import BaseAiProvider from './baseAiProvider.js';
import natural from 'natural';

export class DeterministicFallbackProvider extends BaseAiProvider {
  constructor() {
    super('fallback-deterministic');
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.vectorDim = 128; // Deterministic hash vector dimension
  }

  isAvailable() {
    return true; // Always available
  }

  /**
   * Generates a deterministic fixed-size hash vector representation of text
   * using feature hashing and token frequencies.
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string') {
      return new Array(this.vectorDim).fill(0);
    }

    const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
    const vector = new Array(this.vectorDim).fill(0);

    for (const token of tokens) {
      const stemmed = this.stemmer.stem(token);
      let hash = 0;
      for (let i = 0; i < stemmed.length; i++) {
        hash = (hash << 5) - hash + stemmed.charCodeAt(i);
        hash |= 0;
      }
      const index = Math.abs(hash) % this.vectorDim;
      vector[index] += 1.0;
    }

    // L2 Normalize vector
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < this.vectorDim; i++) {
        vector[i] = vector[i] / norm;
      }
    }

    return vector;
  }

  /**
   * Generates an extractive, grounded answer from retrieved context using BM25/keyword scoring.
   */
  async generateAnswer({ prompt, context = [], history = [] }) {
    if (!context || context.length === 0) {
      return {
        answer: "I'm sorry, but this information is not found in the official college documents provided.",
        aiProvider: 'fallback-deterministic'
      };
    }

    const queryTokens = new Set(
      (this.tokenizer.tokenize(prompt.toLowerCase()) || [])
        .map(t => this.stemmer.stem(t))
        .filter(t => t.length > 2)
    );

    const relevantSentences = [];

    for (const chunk of context) {
      const sentences = chunk.text
        .replace(/\n+/g, ' ')
        .split(/(?<=[.?!])\s+/)
        .filter(s => s.trim().length > 15);

      for (const sentence of sentences) {
        const sentenceTokens = (this.tokenizer.tokenize(sentence.toLowerCase()) || [])
          .map(t => this.stemmer.stem(t));

        let matchScore = 0;
        for (const token of sentenceTokens) {
          if (queryTokens.has(token)) {
            matchScore += 1;
          }
        }

        if (matchScore > 0) {
          relevantSentences.push({
            sentence: sentence.trim(),
            score: matchScore / Math.sqrt(sentenceTokens.length + 1),
            filename: chunk.filename || 'Document',
            pageNumber: chunk.pageNumber || 1
          });
        }
      }
    }

    if (relevantSentences.length === 0) {
      // If no exact sentence matches query keywords, use the top chunk's first paragraph
      const topChunk = context[0];
      const summaryText = topChunk.text.slice(0, 300).trim();
      return {
        answer: `According to **${topChunk.filename}** (Page ${topChunk.pageNumber}):\n\n> ${summaryText}...\n\n*(Extracted via deterministic fallback mode)*`,
        aiProvider: 'fallback-deterministic'
      };
    }

    // Sort by relevance score
    relevantSentences.sort((a, b) => b.score - a.score);
    const topSentences = relevantSentences.slice(0, 4);

    // Group sentences with citation tags
    const answerParts = topSentences.map(item => 
      `- ${item.sentence} **[${item.filename}, Page ${item.pageNumber}]**`
    );

    const finalAnswer = `Based on the official college documents, here is the relevant information regarding your query:\n\n${answerParts.join('\n\n')}\n\n*(Generated via deterministic extractive fallback)*`;

    return {
      answer: finalAnswer,
      aiProvider: 'fallback-deterministic'
    };
  }
}

export default DeterministicFallbackProvider;
