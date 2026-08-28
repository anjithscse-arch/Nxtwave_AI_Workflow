import { evaluateRules } from './rules.js';
import { guardrailClassifier } from './classifier.js';
import config from '../config/env.js';

/**
 * Evaluates an input prompt through the two-layer Guardrail architecture.
 *
 * @param {string} prompt - Raw user input query
 * @param {Object} options - Optional overrides { mlThreshold }
 * @returns {{
 *   isBlocked: boolean,
 *   blockReason: 'INSTRUCTION_OVERRIDE' | 'ROLE_PLAY_JAILBREAK' | 'PROMPT_EXTRACTION' | 'ENCODED_PAYLOAD' | 'ML_FLAGGED' | null,
 *   layer: 'rule' | 'ml' | null,
 *   confidence: number,
 *   sanitizedPrompt: string
 * }}
 */
export function evaluatePrompt(prompt, options = {}) {
  const mlThreshold = options.mlThreshold || config.guardrailConfidenceThreshold;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return {
      isBlocked: false,
      blockReason: null,
      layer: null,
      confidence: 0,
      sanitizedPrompt: ''
    };
  }

  // 1. Layer 1: Rule-Based Evaluation
  const ruleResult = evaluateRules(prompt);
  if (!ruleResult.passed) {
    return {
      isBlocked: true,
      blockReason: ruleResult.blockReason,
      layer: 'rule',
      confidence: 1.0,
      sanitizedPrompt: prompt.trim()
    };
  }

  // 2. Layer 2: ML Classifier (TF-IDF + Probabilistic model)
  const mlResult = guardrailClassifier.classify(prompt, mlThreshold);
  if (mlResult.isBlocked) {
    return {
      isBlocked: true,
      blockReason: 'ML_FLAGGED',
      layer: 'ml',
      confidence: mlResult.confidence,
      sanitizedPrompt: prompt.trim()
    };
  }

  return {
    isBlocked: false,
    blockReason: null,
    layer: null,
    confidence: mlResult.confidence,
    sanitizedPrompt: prompt.trim()
  };
}

export default {
  evaluatePrompt
};
