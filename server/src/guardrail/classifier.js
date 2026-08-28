import natural from 'natural';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GuardrailClassifier {
  constructor() {
    this.classifier = new natural.BayesClassifier();
    this.isTrained = false;
    this.init();
  }

  init() {
    try {
      const datasetPath = path.resolve(__dirname, 'ruleDataset.json');
      const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

      if (dataset.trainingDataset && Array.isArray(dataset.trainingDataset)) {
        for (const sample of dataset.trainingDataset) {
          this.classifier.addDocument(sample.text, sample.label);
        }
        this.classifier.train();
        this.isTrained = true;
      }
    } catch (err) {
      console.error('Failed to initialize Guardrail ML Classifier:', err);
    }
  }

  /**
   * Classifies input text and returns classification and confidence score.
   * @param {string} text
   * @param {number} threshold - Defaults to config.guardrailConfidenceThreshold
   * @returns {{ isBlocked: boolean, label: string, confidence: number, blockReason: string | null }}
   */
  classify(text, threshold = config.guardrailConfidenceThreshold) {
    if (!this.isTrained || !text) {
      return { isBlocked: false, label: 'benign', confidence: 0, blockReason: null };
    }

    const classifications = this.classifier.getClassifications(text);
    // Find highest scoring classification
    const jailbreakClass = classifications.find(c => c.label === 'jailbreak');
    const benignClass = classifications.find(c => c.label === 'benign');

    const jailbreakScore = jailbreakClass ? jailbreakClass.value : 0;
    const benignScore = benignClass ? benignClass.value : 0;
    const total = jailbreakScore + benignScore;
    
    // Normalize score to 0..1 confidence
    const confidence = total > 0 ? (jailbreakScore / total) : 0;
    const isJailbreak = confidence >= threshold;

    return {
      isBlocked: isJailbreak,
      label: isJailbreak ? 'jailbreak' : 'benign',
      confidence: parseFloat(confidence.toFixed(4)),
      blockReason: isJailbreak ? 'ML_FLAGGED' : null
    };
  }
}

export const guardrailClassifier = new GuardrailClassifier();
export default guardrailClassifier;
