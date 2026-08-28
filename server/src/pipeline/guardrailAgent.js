import { evaluatePrompt } from '../guardrail/guardrailService.js';

/**
 * Guardrail Agent:
 * Evaluates the raw input against security rules & ML classification.
 *
 * @param {Object} pipelineContext
 * @returns {Promise<Object>} Updated pipeline context
 */
export async function executeGuardrailStage(pipelineContext) {
  const startTime = Date.now();
  const { question } = pipelineContext;

  const result = evaluatePrompt(question);
  const durationMs = Date.now() - startTime;

  if (result.isBlocked) {
    return {
      ...pipelineContext,
      guardrailResult: {
        passed: false,
        blocked: true,
        blockReason: result.blockReason,
        layer: result.layer,
        confidence: result.confidence,
        durationMs
      },
      isTerminated: true,
      terminationReason: 'GUARDRAIL_BLOCKED',
      finalAnswer: `⚠️ **Security Alert**: Your prompt was blocked by the CampusMind Guardrail Layer.\n\n**Reason Category:** \`${result.blockReason}\`\n\n*CampusMind strictly accepts queries regarding college admissions, academics, notices, and campus facilities.*`
    };
  }

  return {
    ...pipelineContext,
    guardrailResult: {
      passed: true,
      blocked: false,
      blockReason: null,
      layer: null,
      confidence: result.confidence,
      durationMs
    },
    sanitizedQuestion: result.sanitizedPrompt || question
  };
}

export default executeGuardrailStage;
