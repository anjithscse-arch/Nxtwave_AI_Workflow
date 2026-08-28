import config from '../config/env.js';

/**
 * Context Agent:
 * Filters retrieved chunks by similarity threshold and assembles the context block.
 *
 * @param {Object} pipelineContext
 * @returns {Promise<Object>} Updated pipeline context
 */
export async function executeContextStage(pipelineContext) {
  const startTime = Date.now();
  const rawChunks = pipelineContext.retrievalResult?.rawChunks || [];
  const threshold = config.similarityThreshold;

  // Filter chunks meeting minimum similarity threshold
  const qualifyingChunks = rawChunks.filter(chunk => (chunk.score || 0) >= threshold);

  const durationMs = Date.now() - startTime;

  if (qualifyingChunks.length === 0) {
    // Short-circuit: Refusal when no grounded context is available
    return {
      ...pipelineContext,
      contextResult: {
        hasContext: false,
        qualifyingChunks: [],
        thresholdUsed: threshold,
        highestScore: rawChunks.length > 0 ? rawChunks[0].score : 0,
        durationMs
      },
      isTerminated: true,
      terminationReason: 'NO_RELEVANT_CONTEXT',
      finalAnswer: "I'm sorry, but I could not find any relevant information in the official college documents regarding your question. Please verify your query or consult the college administration desk."
    };
  }

  // Format context objects for Generation and Citation stages
  const formattedContext = qualifyingChunks.map(chunk => ({
    chunkId: chunk._id,
    docId: chunk.docId?._id || chunk.docId,
    filename: chunk.docId?.originalName || chunk.docId?.filename || 'College Document',
    topicCategory: chunk.docId?.topicCategory || 'General',
    pageNumber: chunk.pageNumber || 1,
    score: chunk.score || 0,
    text: chunk.text
  }));

  return {
    ...pipelineContext,
    contextResult: {
      hasContext: true,
      qualifyingChunks: formattedContext,
      thresholdUsed: threshold,
      highestScore: qualifyingChunks[0].score,
      durationMs
    }
  };
}

export default executeContextStage;
