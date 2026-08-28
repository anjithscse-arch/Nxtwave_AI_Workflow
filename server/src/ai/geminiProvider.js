import { GoogleGenerativeAI } from '@google/generative-ai';
import BaseAiProvider from './baseAiProvider.js';
import config from '../config/env.js';

export class GeminiProvider extends BaseAiProvider {
  constructor() {
    super('gemini');
    this.apiKey = config.geminiApiKey;
    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
    this.modelName = config.geminiModel || 'gemini-1.5-flash';
    this.embeddingModelName = config.geminiEmbeddingModel || 'text-embedding-004';
  }

  isAvailable() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0 && this.genAI);
  }

  /**
   * Generates embedding vector using Gemini text-embedding-004.
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async generateEmbedding(text) {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key is not configured');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.embeddingModelName });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Error generating Gemini embedding:', error);
      throw error;
    }
  }

  /**
   * Generates grounded answer using Gemini LLM.
   */
  async generateAnswer({ prompt, context = [], history = [] }) {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key is not configured');
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.2, // Low temperature for high factual grounding
          topP: 0.8,
          maxOutputTokens: 1024
        }
      });

      // Format context chunks with document names and page numbers
      const formattedContext = context
        .map((c, i) => `[Source ${i + 1}: ${c.filename || 'Document'} (Page ${c.pageNumber || 1})]\n${c.text}`)
        .join('\n\n---\n\n');

      const systemInstruction = `You are CampusMind, the official, highly accurate AI assistant for the college.
CRITICAL GROUNDING RULES:
1. You must answer the student's question STRICTLY and EXCLUSIVELY using the provided Source Context excerpts below.
2. DO NOT use external general knowledge or extrapolate facts beyond what is stated in the context.
3. For every claim made, cite the source in your response (e.g. "[Academic_Calendar.pdf, Page 3]").
4. If the provided context does NOT contain sufficient information to answer the question, clearly state: "I'm sorry, but this information is not found in the official college documents provided."
5. Format your answers clearly using clean Markdown (bullet points, bold highlights, tables when applicable).`;

      const userPrompt = `SOURCE CONTEXT EXCERPTS:
${formattedContext}

STUDENT QUESTION:
${prompt}

Provide a well-structured, factual answer grounded in the sources above.`;

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }]
          }
        ]
      });

      const response = await result.response;
      const answer = response.text();

      return {
        answer,
        aiProvider: 'gemini'
      };
    } catch (error) {
      console.error('Gemini generateAnswer error:', error);
      throw error;
    }
  }
}

export default GeminiProvider;
