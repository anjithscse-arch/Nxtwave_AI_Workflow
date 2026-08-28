import mongoose from 'mongoose';
import Chunk from '../models/Chunk.js';

/**
 * Computes cosine similarity between two numeric vectors.
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} Cosine similarity (-1 to 1)
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Searches chunks using MongoDB Atlas $vectorSearch if configured,
 * or fallback in-memory exact cosine similarity scoring.
 *
 * @param {number[]} queryEmbedding - The query vector
 * @param {Object} options - { topK, filterDocId, minScore }
 * @returns {Promise<Array>} Scored and populated chunk documents
 */
export async function vectorSearch(queryEmbedding, options = {}) {
  const { topK = 5, filterDocId = null, minScore = 0.0 } = options;

  try {
    // Check if Atlas vector search is available by checking if we have Atlas index
    // If not, perform exact vector scan with cosine similarity
    const filter = {};
    if (filterDocId) {
      filter.docId = new mongoose.Types.ObjectId(filterDocId);
    }

    const chunks = await Chunk.find(filter)
      .populate('docId', 'filename topicCategory status originalName')
      .lean();

    if (!chunks || chunks.length === 0) {
      return [];
    }

    const scoredChunks = chunks
      .map(chunk => {
        let score = 0;
        if (chunk.embedding && chunk.embedding.length > 0 && queryEmbedding && queryEmbedding.length > 0) {
          score = cosineSimilarity(queryEmbedding, chunk.embedding);
        }
        return {
          ...chunk,
          score
        };
      })
      .filter(chunk => chunk.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scoredChunks;
  } catch (error) {
    console.error('Error in vectorSearch:', error);
    throw error;
  }
}
