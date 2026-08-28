import GeminiProvider from './geminiProvider.js';
import DeterministicFallbackProvider from './deterministicFallbackProvider.js';
import config from '../config/env.js';

class AiProviderFactory {
  constructor() {
    this.gemini = new GeminiProvider();
    this.fallback = new DeterministicFallbackProvider();
  }

  /**
   * Returns the primary active provider based on environment configuration.
   * @returns {import('./baseAiProvider.js').BaseAiProvider}
   */
  getProvider() {
    if (this.gemini.isAvailable()) {
      return this.gemini;
    }
    return this.fallback;
  }

  /**
   * Returns current health and configuration status of AI providers.
   */
  getStatus() {
    const hasGemini = this.gemini.isAvailable();
    return {
      activeProvider: hasGemini ? 'gemini' : 'fallback-deterministic',
      geminiConfigured: hasGemini,
      geminiModel: config.geminiModel,
      geminiEmbeddingModel: config.geminiEmbeddingModel,
      fallbackReady: true
    };
  }
}

export const aiProviderFactory = new AiProviderFactory();
export default aiProviderFactory;
