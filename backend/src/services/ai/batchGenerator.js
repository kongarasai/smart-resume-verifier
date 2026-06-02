const { getAIResponse } = require('./aiRouter');
const logger = require('../../utils/logger');
const { query } = require('../../config/database');

// Simple concurrency limiter to avoid ESM dependency issues with p-limit
const pLimit = (concurrency) => {
  return async (fn) => {
    // In this simplified version for batch generation, we just execute
    // since batches are already limited by BATCH_SIZE and parallel calls.
    return fn();
  };
};

/**
 * Parallel Batch Generation Architecture with Question Bank Caching.
 */
const generateBatches = async (topic, totalCount, difficulty, existingContext = "") => {
  const targetCount = parseInt(totalCount) || 10;
  
  // 1. QUESTION BANK REUSE (Cache)
  // Try to find existing questions in the DB for this topic to reduce AI costs
  const cachedRes = await query(
    `SELECT title as question, options, correct_answer as "correctAnswer", description as explanation
     FROM questions 
     WHERE (LOWER(title) LIKE $1 OR LOWER(description) LIKE $1) 
     AND is_active=TRUE 
     ORDER BY RANDOM() LIMIT $2`,
    [`%${topic.toLowerCase()}%`, Math.floor(targetCount * 0.5)] // Reuse up to 50% from cache
  );

  let cachedQuestions = cachedRes.rows.map(q => ({
    ...q,
    options: Array.isArray(q.options) ? q.options.map(o => o.text) : []
  })).filter(q => q.options.length === 4);

  const remainingToGenerate = targetCount - cachedQuestions.length;
  
  if (remainingToGenerate <= 0) {
    logger.info(`Full cache hit for topic: ${topic}. Returning ${cachedQuestions.length} questions.`);
    return cachedQuestions;
  }

  logger.info(`Partial cache hit: ${cachedQuestions.length} questions reused. Generating ${remainingToGenerate} more.`);

  const BATCH_SIZE = 10;
  const batchCount = Math.ceil(remainingToGenerate / BATCH_SIZE);
  
  // Set concurrency limit
  const limit = pLimit(3);
  
  const basePrompt = `You are an advanced AI assessment generation engine.
TOPIC: ${topic}
DIFFICULTY: ${difficulty || 'medium'}
${existingContext}

CORE REQUIREMENTS:
1. Every question must test a DIFFERENT concept.
2. Avoid static/template-style questions.
3. Exactly ONE option must be correct.
4. Output valid JSON array under "questions" key.

JSON STRUCTURE:
{
  "questions": [
    {
      "title": "Clear question text",
      "options": [
        {"id": "A", "text": "Option A text"},
        {"id": "B", "text": "Option B text"},
        {"id": "C", "text": "Option C text"},
        {"id": "D", "text": "Option D text"}
      ],
      "correct_answer": "A",
      "explanation": "Brief explanation"
    }
  ]
}`;

  logger.info(`Starting parallel generation for ${targetCount} questions in ${batchCount} batches.`);

  const batchPromises = Array.from({ length: batchCount }).map((_, i) => {
    const currentBatchSize = Math.min(BATCH_SIZE, remainingToGenerate - (i * BATCH_SIZE));
    if (currentBatchSize <= 0) return Promise.resolve([]);

    const prompt = `${basePrompt}\n\nBATCH SIZE: ${currentBatchSize}\nUniqueness Seed: ${Date.now()}-${Math.random()}`;
    
    return limit(async () => {
      try {
        logger.info(`Generating batch ${i + 1}/${batchCount}...`);
        const data = await getAIResponse(prompt);
        return data.questions || [];
      } catch (err) {
        logger.error(`Batch ${i + 1} failed: ${err.message}`);
        return [];
      }
    });
  });

  const results = await Promise.all(batchPromises);
  const generatedQuestions = results.flat();
  
  // Normalize and Combine
  const normalizedGenerated = generatedQuestions.map(q => ({
    title: q.title || q.question || "",
    options: Array.isArray(q.options) ? q.options.map((o, idx) => {
      if (typeof o === 'string') return { id: String.fromCharCode(65 + idx), text: o.replace(/^[A-D]\)\s*/, '') };
      return { id: o.id || String.fromCharCode(65 + idx), text: o.text || String(o) };
    }) : [],
    correct_answer: (q.correct_answer || q.correctAnswer || "A").toUpperCase(),
    explanation: q.explanation || ""
  }));

  const normalizedCached = cachedQuestions.map(q => ({
    title: q.question, // Cached aliased it to question
    options: Array.isArray(q.options) ? q.options : [],
    correct_answer: (q.correctAnswer || "A").toUpperCase(),
    explanation: q.explanation || ""
  }));

  const allQuestions = [...normalizedCached, ...normalizedGenerated];
  
  // Final Deduplication
  const seen = new Set();
  const uniqueQuestions = allQuestions.filter(q => {
    if (!isValidQuestion(q)) return false;
    const title = q.title.toLowerCase().trim();
    if (seen.has(title)) return false;
    seen.add(title);
    return true;
  });

  logger.info(`Generation complete. Successfully created ${uniqueQuestions.length} unique questions.`);
  return uniqueQuestions.slice(0, targetCount);
};

const isValidQuestion = (q) => {
  return (
    q.title &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.correct_answer
  );
};

module.exports = { generateBatches };
