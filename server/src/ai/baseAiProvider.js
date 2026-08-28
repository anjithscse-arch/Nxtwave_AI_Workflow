/**
 * Base AI Provider Abstract Class / Interface.
 * All AI providers (Gemini, Fallback, etc.) must implement this interface.
 */
export class BaseAiProvider {
  constructor(providerName = 'base') {
    this.providerName = providerName;
  }

  /**
   * Generates a grounded response based strictly on the retrieved context.
   *
   * @param {Object} params
   * @param {string} params.prompt - User's question
   * @param {Array<{ text: string, filename: string, pageNumber: number }>} params.context - Retrieved chunks
   * @param {Array<{ role: string, content: string }>} [params.history] - Chat history
   * @returns {Promise<{ answer: string, aiProvider: string, usage?: Object }>}
   */
  async generateAnswer({ prompt, context, history = [] }) {
    throw new Error('generateAnswer() must be implemented by subclass');
  }

  /**
   * Generates a numeric vector embedding for a given text.
   *
   * @param {string} text
   * @returns {Promise<number[]>} Array of floating-point embedding dimensions
   */
  async generateEmbedding(text) {
    throw new Error('generateEmbedding() must be implemented by subclass');
  }

  /**
   * Generates embeddings in batch.
   *
   * @param {string[]} texts
   * @returns {Promise<number[][]>}
   */
  async generateEmbeddings(texts) {
    return Promise.all(texts.map(t => this.generateEmbedding(t)));
  }

  /**
   * Checks whether this provider is currently available/configured.
   * @returns {boolean}
   */
  isAvailable() {
    return true;
  }
}

export default BaseAiProvider;
