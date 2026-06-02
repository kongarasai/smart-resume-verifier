const { generateWithGemini } = require('./geminiService');
const { generateWithGroq } = require('./groqService');
const { generateWithOpenRouter } = require('./openrouterService');
const { withRetry } = require('./retryHelper');
const { parseAIResponse } = require('./jsonParser');
const { get, setWithExpiry } = require('../../utils/redis');
const logger = require('../../utils/logger');

const COOLDOWN_SECONDS = 60; // 1 minute cooldown for exhausted providers

/**
 * Distributed health check for AI providers using Redis.
 * Ensures all instances respect the cooldown.
 */
const checkAvailability = async (name) => {
  const cooldownKey = `ai_cooldown:${name}`;
  const inCooldown = await get(cooldownKey);
  if (inCooldown) {
    logger.warn(`Skipping ${name} - Distributed cooldown active`);
    return false;
  }
  return true;
};

const markAsUnavailable = async (name) => {
  const cooldownKey = `ai_cooldown:${name}`;
  logger.error(`Marking AI provider ${name} as UNAVAILABLE for ${COOLDOWN_SECONDS/60} mins`);
  await setWithExpiry(cooldownKey, { timestamp: Date.now() }, COOLDOWN_SECONDS);
};

const getAIResponse = async (prompt) => {
  const providers = [
    { name: 'Gemini', fn: generateWithGemini },
    { name: 'Groq', fn: generateWithGroq },
    { name: 'OpenRouter', fn: generateWithOpenRouter }
  ];

  let lastError;

  for (const provider of providers) {
    if (!(await checkAvailability(provider.name))) continue;

    try {
      logger.info(`Routing AI request to: ${provider.name}`);
      
      const rawResponse = await withRetry(async () => {
        try {
          return await provider.fn(prompt);
        } catch (err) {
          const errMsg = err.message.toLowerCase();
          if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('rate limit')) {
            await markAsUnavailable(provider.name);
            throw err; // Trigger fallback
          }
          throw err;
        }
      }, 1, 500);

      const parsed = parseAIResponse(rawResponse);
      if (parsed) {
        logger.info(`Successfully generated response using ${provider.name}`);
        return parsed;
      } else {
        throw new Error(`${provider.name} returned unparseable or empty JSON`);
      }
      
    } catch (err) {
      lastError = err;
      logger.error(`❌ Provider ${provider.name} failed: ${err.message}`);
      // Continue to next provider...
    }
  }

  throw lastError || new Error("All AI providers are currently exhausted or failing.");
};

module.exports = { getAIResponse };
