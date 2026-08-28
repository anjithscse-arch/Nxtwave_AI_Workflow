import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load rule dataset
const datasetPath = path.resolve(__dirname, 'ruleDataset.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

/**
 * Normalizes input text by removing excessive whitespace, homoglyphs, and non-printable characters.
 * @param {string} text
 * @returns {string}
 */
export function normalizeInput(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    .toLowerCase()
    // Replace common homoglyph lookalikes
    .replace(/[\u0430]/g, 'a') // cyrillic a
    .replace(/[\u0435]/g, 'e') // cyrillic e
    .replace(/[\u043E]/g, 'o') // cyrillic o
    .replace(/[\u0440]/g, 'p') // cyrillic p
    .replace(/[\u0441]/g, 'c') // cyrillic c
    .replace(/[\u0443]/g, 'y') // cyrillic y
    .replace(/[\u0445]/g, 'x') // cyrillic x
    .replace(/[@]/g, 'a')
    .replace(/[\$]/g, 's')
    .replace(/[0]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'e')
    // Remove zero-width and control characters
    .replace(/[\u200B-\u200D\uFEFF\x00-\x1F\x7F]/g, '')
    // Collapse punctuation and multiple whitespace
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Attempts to decode potential base64 substrings in the text to detect obfuscated payloads.
 * @param {string} rawText
 * @returns {string[]} Decoded ascii strings
 */
function extractDecodedBase64(rawText) {
  const base64Regex = /(?:[A-Za-z0-9+/]{4}){3,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g;
  const matches = rawText.match(base64Regex) || [];
  const decoded = [];

  for (const match of matches) {
    try {
      const buff = Buffer.from(match, 'base64');
      const text = buff.toString('utf8');
      // Only treat as decoded payload if it contains readable ASCII letters
      if (/^[a-zA-Z0-9\s.,!?:;_-]{6,}$/.test(text)) {
        decoded.push(text.toLowerCase());
      }
    } catch {
      // Not valid base64
    }
  }

  return decoded;
}

/**
 * Evaluates raw text against Layer 1 Rule-Based heuristics.
 *
 * @param {string} rawText
 * @returns {{ passed: boolean, blockReason: string | null }}
 */
export function evaluateRules(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { passed: true, blockReason: null };
  }

  const normalized = normalizeInput(rawText);
  const decodedBase64 = extractDecodedBase64(rawText);

  for (const ruleGroup of dataset.rules) {
    for (const pattern of ruleGroup.patterns) {
      const normalizedPattern = normalizeInput(pattern);
      
      // 1. Direct normalized match
      if (normalized.includes(normalizedPattern)) {
        return {
          passed: false,
          blockReason: ruleGroup.category
        };
      }

      // 2. Base64 decoded match
      for (const decoded of decodedBase64) {
        const normDecoded = normalizeInput(decoded);
        if (normDecoded.includes(normalizedPattern)) {
          return {
            passed: false,
            blockReason: 'ENCODED_PAYLOAD'
          };
        }
      }
    }
  }

  return { passed: true, blockReason: null };
}

export default {
  evaluateRules,
  normalizeInput
};
