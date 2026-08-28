import ChatLog from '../models/ChatLog.js';
import { emitPipelineEvent } from '../config/socket.js';

/**
 * Monitoring Agent:
 * Persists granular ChatLog audit records to MongoDB and streams real-time Socket.IO events to client.
 */
export class MonitoringAgent {
  /**
   * Logs a stage lifecycle event, saves to DB, and broadcasts via Socket.IO.
   *
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} [params.chatMessageId]
   * @param {'guardrail'|'retrieval'|'context'|'generation'|'citation'|'monitoring'} params.stage
   * @param {'info'|'warning'|'error'|'blocked'} params.level
   * @param {string} params.message
   * @param {Object} [params.metadata]
   * @param {number} [params.durationMs]
   */
  static async recordStageEvent({
    sessionId,
    chatMessageId = null,
    stage,
    level = 'info',
    message,
    metadata = {},
    durationMs = 0
  }) {
    // 1. Emit live Socket.IO event
    emitPipelineEvent(sessionId, {
      chatMessageId,
      stage,
      level,
      message,
      metadata,
      durationMs
    });

    // 2. Persist to MongoDB ChatLog collection
    try {
      if (sessionId) {
        await ChatLog.create({
          sessionId,
          chatMessageId,
          stage,
          level,
          message,
          metadata,
          durationMs,
          timestamp: new Date()
        });
      }
    } catch (err) {
      console.error(`Failed to write ChatLog for stage [${stage}]:`, err.message);
    }
  }
}

export default MonitoringAgent;
