import { executeGuardrailStage } from './guardrailAgent.js';
import { executeRetrievalStage } from './retrievalAgent.js';
import { executeContextStage } from './contextAgent.js';
import { executeGenerationStage } from './generationAgent.js';
import { executeCitationStage } from './citationAgent.js';
import { MonitoringAgent } from './monitoringAgent.js';
import ChatMessage from '../models/ChatMessage.js';
import ChatSession from '../models/ChatSession.js';
import Notification from '../models/Notification.js';
import { emitAdminNotification } from '../config/socket.js';

/**
 * Executes the complete 6-stage RAG Pipeline for a user question.
 *
 * @param {Object} params
 * @param {string} params.question - Raw user input question
 * @param {string} params.sessionId - ChatSession ID
 * @param {string} params.userId - Authenticated user ID
 * @param {Array} [params.history] - Previous messages in session
 * @returns {Promise<Object>} Final response object
 */
export async function runRagPipeline({ question, sessionId, userId, history = [] }) {
  const pipelineStart = Date.now();

  // 1. Save user query message to database
  const userMessage = await ChatMessage.create({
    sessionId,
    role: 'user',
    content: question
  });

  // Update session lastMessageAt
  await ChatSession.findByIdAndUpdate(sessionId, { lastMessageAt: new Date() });

  let ctx = {
    question,
    sessionId,
    userId,
    userMessageId: userMessage._id,
    history,
    isTerminated: false,
    terminationReason: null,
    finalAnswer: '',
    aiProvider: null
  };

  // ================= STAGE 1: GUARDRAIL AGENT =================
  await MonitoringAgent.recordStageEvent({
    sessionId,
    chatMessageId: userMessage._id,
    stage: 'guardrail',
    level: 'info',
    message: 'Screening query through Rule-based filter and ML classifier...'
  });

  ctx = await executeGuardrailStage(ctx);

  if (ctx.guardrailResult.blocked) {
    await MonitoringAgent.recordStageEvent({
      sessionId,
      chatMessageId: userMessage._id,
      stage: 'guardrail',
      level: 'blocked',
      message: `Query BLOCKED by Guardrail (${ctx.guardrailResult.blockReason}, Layer: ${ctx.guardrailResult.layer})`,
      metadata: {
        blockReason: ctx.guardrailResult.blockReason,
        confidence: ctx.guardrailResult.confidence,
        layer: ctx.guardrailResult.layer
      },
      durationMs: ctx.guardrailResult.durationMs
    });

    // Mark user message as blocked with reason
    userMessage.blocked = true;
    userMessage.blockReason = ctx.guardrailResult.blockReason;
    await userMessage.save();

    // Save blocked assistant message
    const assistantMessage = await ChatMessage.create({
      sessionId,
      role: 'assistant',
      content: ctx.finalAnswer,
      blocked: true,
      blockReason: ctx.guardrailResult.blockReason,
      aiProvider: 'none',
      retrievedSources: []
    });

    // Create and broadcast admin security notification
    try {
      const notif = await Notification.create({
        type: 'guardrail_alert',
        title: 'Prompt Injection Blocked',
        message: `Blocked adversarial attempt under category "${ctx.guardrailResult.blockReason}" (Layer: ${ctx.guardrailResult.layer}).`
      });
      emitAdminNotification(notif);
    } catch (notifErr) {
      console.warn('Failed to persist guardrail notification:', notifErr.message);
    }

    return {
      messageId: assistantMessage._id,
      userMessageId: userMessage._id,
      content: ctx.finalAnswer,
      blocked: true,
      blockReason: ctx.guardrailResult.blockReason,
      aiProvider: 'none',
      sources: [],
      totalDurationMs: Date.now() - pipelineStart
    };
  }

  await MonitoringAgent.recordStageEvent({
    sessionId,
    chatMessageId: userMessage._id,
    stage: 'guardrail',
    level: 'info',
    message: 'Guardrail check passed. Query deemed safe and relevant.',
    durationMs: ctx.guardrailResult.durationMs
  });

  // ================= STAGE 2: RETRIEVAL AGENT =================
  await MonitoringAgent.recordStageEvent({
    sessionId,
    chatMessageId: userMessage._id,
    stage: 'retrieval',
    level: 'info',
    message: 'Generating query embedding and querying MongoDB vector store...'
  });

  ctx = await executeRetrievalStage(ctx);

  await MonitoringAgent.recordStageEvent({
    sessionId,
    chatMessageId: userMessage._id,
    stage: 'retrieval',
    level: 'info',
    message: `Retrieved ${ctx.retrievalResult.chunkCount} candidate chunk(s) from knowledge base.`,
    metadata: { chunkCount: ctx.retrievalResult.chunkCount },
    durationMs: ctx.retrievalResult.durationMs
  });

  // ================= STAGE 3: CONTEXT AGENT =================
  await MonitoringAgent.recordStageEvent({
    sessionId,
    chatMessageId: userMessage._id,
    stage: 'context',
    level: 'info',
    message: 'Evaluating similarity scores and assembling context block...'
  });

  ctx = await executeContextStage(ctx);

  if (ctx.isTerminated && ctx.terminationReason === 'NO_RELEVANT_CONTEXT') {
    await MonitoringAgent.recordStageEvent({
      sessionId,
      chatMessageId: userMessage._id,
      stage: 'context',
      level: 'warning',
      message: `NO_RELEVANT_CONTEXT: Highest similarity score (${(ctx.contextResult.highestScore || 0).toFixed(3)}) below threshold (${ctx.contextResult.thresholdUsed}).`,
      metadata: {
        highestScore: ctx.contextResult.highestScore,
        threshold: ctx.contextResult.thresholdUsed
      },
      durationMs: ctx.contextResult.durationMs
    });

    const assistantMessage = await ChatMessage.create({
      sessionId,
      role: 'assistant',
      content: ctx.finalAnswer,
      blocked: false,
      blockReason: null,
      aiProvider: 'none',
      retrievedSources: []
    });

    return {
      messageId: assistantMessage._id,
      userMessageId: userMessage._id,
      content: ctx.finalAnswer,
      blocked: false,
      blockReason: null,
      aiProvider: 'none',
      sources: [],
      totalDurationMs: Date.now() - pipelineStart
    };
  }

  await MonitoringAgent.recordStageEvent({
    sessionId,
    chatMessageId: userMessage._id,
    stage: 'context',
    level: 'info',
    message: `Context assembled with ${ctx.contextResult.qualifyingChunks.length} qualifying chunk(s). Highest score: ${(ctx.contextResult.highestScore || 0).toFixed(3)}.`,
    metadata: {
      qualifyingCount: ctx.contextResult.qualifyingChunks.length,
      highestScore: ctx.contextResult.highestScore
    },
    durationMs: ctx.contextResult.durationMs
  });

  // ================= STAGE 4: GENERATION AGENT =================
  await MonitoringAgent.recordStageEvent({
    sessionId,
    chatMessageId: userMessage._id,
    stage: 'generation',
    level: 'info',
    message: 'Generating grounded answer from retrieved context...'
  });

  ctx = await executeGenerationStage(ctx);

  await MonitoringAgent.recordStageEvent({
    sessionId,
    chatMessageId: userMessage._id,
    stage: 'generation',
    level: 'info',
    message: `Answer produced via [${ctx.generationResult.aiProvider}].`,
    metadata: {
      aiProvider: ctx.generationResult.aiProvider,
      fallbackTriggered: ctx.generationResult.fallbackTriggered || false
    },
    durationMs: ctx.generationResult.durationMs
  });

  // ================= STAGE 5: CITATION AGENT =================
  await MonitoringAgent.recordStageEvent({
    sessionId,
    chatMessageId: userMessage._id,
    stage: 'citation',
    level: 'info',
    message: 'Extracting and attributing source document pages...'
  });

  ctx = await executeCitationStage(ctx);

  await MonitoringAgent.recordStageEvent({
    sessionId,
    chatMessageId: userMessage._id,
    stage: 'citation',
    level: 'info',
    message: `Attached ${ctx.citationResult.totalSources} verified source citation(s).`,
    metadata: { sources: ctx.citationResult.sources },
    durationMs: ctx.citationResult.durationMs
  });

  // ================= STAGE 6: MONITORING AGENT =================
  const totalDurationMs = Date.now() - pipelineStart;

  // Persist assistant message in DB
  const assistantMessage = await ChatMessage.create({
    sessionId,
    role: 'assistant',
    content: ctx.finalAnswer,
    blocked: false,
    blockReason: null,
    aiProvider: ctx.generationResult.aiProvider,
    retrievedSources: ctx.citationResult.sources
  });

  await MonitoringAgent.recordStageEvent({
    sessionId,
    chatMessageId: assistantMessage._id,
    stage: 'monitoring',
    level: 'info',
    message: `Pipeline completed successfully in ${totalDurationMs}ms.`,
    metadata: {
      totalDurationMs,
      aiProvider: ctx.generationResult.aiProvider
    },
    durationMs: totalDurationMs
  });

  return {
    messageId: assistantMessage._id,
    userMessageId: userMessage._id,
    content: ctx.finalAnswer,
    blocked: false,
    blockReason: null,
    aiProvider: ctx.generationResult.aiProvider,
    sources: ctx.citationResult.sources,
    totalDurationMs
  };
}

export default runRagPipeline;
