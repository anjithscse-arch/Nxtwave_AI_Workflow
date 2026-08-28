import aiProviderFactory from '../ai/aiProviderFactory.js';
import { vectorSearch } from '../config/vectorIndex.js';
import config from '../config/env.js';

/**
 * Retrieval Agent:
 * Embeds the question and runs similarity search against the Chunks collection.
 *
 * @param {Object} pipelineContext
 * @returns {Promise<Object>} Updated pipeline context
 */
export async function executeRetrievalStage(pipelineContext) {
  const startTime = Date.now();
  const question = pipelineContext.sanitizedQuestion || pipelineContext.question;
  const provider = aiProviderFactory.getProvider();

  try {
    // 1. Generate embedding vector for query
    const queryEmbedding = await provider.generateEmbedding(question);

    // 2. Perform vector search in database
    const topChunks = await vectorSearch(queryEmbedding, {
      topK: config.topK,
      minScore: 0.0 // Raw retrieval, thresholding is handled in Context Agent
    });

    const durationMs = Date.now() - startTime;

    return {
      ...pipelineContext,
      retrievalResult: {
        rawChunks: topChunks,
        chunkCount: topChunks.length,
        durationMs
      }
    };
  } catch (error) {
    console.error('Error in Retrieval Agent:', error);
    const durationMs = Date.now() - startTime;
    return {
      ...pipelineContext,
      retrievalResult: {
        rawChunks: [],
        chunkCount: 0,
        error: error.message,
        durationMs
      }
    };
  }
}

export default executeRetrievalStage;
