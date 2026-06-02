const { jsonrepair } = require('jsonrepair');
const logger = require('../../utils/logger');

/**
 * Enterprise-grade JSON parser with self-healing capabilities.
 * Prevents system crashes from malformed AI responses.
 */
const parseAIResponse = (raw) => {
  if (!raw) return null;

  // 1. Try direct cleaning
  let cleaned = raw.trim();
  
  // Strip potential markdown code blocks
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
  }
  
  cleaned = cleaned.trim();

  try {
    // 2. Try standard parse
    return JSON.parse(cleaned);
  } catch (e) {
    logger.warn('Initial JSON parse failed, attempting repair...');
    try {
      // 3. Try jsonrepair for structural fixes (missing commas, quotes, etc.)
      const repaired = jsonrepair(cleaned);
      return JSON.parse(repaired);
    } catch (err) {
      logger.error('JSON repair failed. Raw response was unsalvageable.');
      
      // 4. Fallback: regex search for anything that looks like a JSON array or object
      try {
        const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) {
          const extracted = jsonrepair(match[0]);
          return JSON.parse(extracted);
        }
      } catch (finalErr) {
        logger.error('Regex extraction failed.');
      }
      
      return null;
    }
  }
};

module.exports = { parseAIResponse };
