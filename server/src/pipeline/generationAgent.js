import aiProviderFactory from '../ai/aiProviderFactory.js';

/**
 * Generation Agent:
 * Invokes the AI Provider (Gemini / Deterministic Fallback) strictly with context chunks.
 *
 * @param {Object} pipelineContext
 * @returns {Promise<Object>} Updated pipeline context
 */
export async function executeGenerationStage(pipelineContext) {
  const startTime = Date.now();
  const { question, contextResult, history = [] } = pipelineContext;
  const context = contextResult?.qualifyingChunks || [];
  const provider = aiProviderFactory.getProvider();

  try {
    const genResult = await provider.generateAnswer({
      prompt: question,
      context,
      history
    });

    const durationMs = Date.now() - startTime;

    return {
      ...pipelineContext,
      generationResult: {
        rawAnswer: genResult.answer,
        aiProvider: genResult.aiProvider,
        durationMs
      },
      finalAnswer: genResult.answer
    };
  } catch (error) {
    console.error('Generation Agent failed, falling back to deterministic:', error);
    // If Gemini fails dynamically (e.g. rate limit, network), fallback to deterministic immediately
    const fallbackProvider = aiProviderFactory.fallback;
    const fallbackResult = await fallbackProvider.generateAnswer({
      prompt: question,
      context,
      history
    });

    const durationMs = Date.now() - startTime;

    return {
      ...pipelineContext,
      generationResult: {
        rawAnswer: fallbackResult.answer,
        aiProvider: 'fallback-deterministic',
        fallbackTriggered: true,
        error: error.message,
        durationMs
      },
      finalAnswer: fallbackResult.answer
    };
  }
}

export default executeGenerationStage;
