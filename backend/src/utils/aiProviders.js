const { getAIResponse } = require('../services/ai/aiRouter');
const logger = require('./logger');

const analyzeResumeWithAI = async (resumeText) => {
  const prompt = `
    Analyze the following resume text and provide:
    1. A resume score (0-100) based on industry standards.
    2. 5 specific tips for improvement.
    
    Resume Text:
    ${resumeText}
    
    Return ONLY a JSON object with keys: "score", "tips" (array of strings).
  `;
  try {
    return await getAIResponse(prompt);
  } catch (err) {
    logger.error(`analyzeResumeWithAI failed: ${err.message}`);
    return { score: 0, tips: ["Could not analyze resume at this time."] };
  }
};

const evaluateInterviewWithAI = async (sessionData) => {
  const prompt = `
    Evaluate the following interview session:
    Session Data: ${JSON.stringify(sessionData)}
    
    Provide an overall score (0-100) and feedback for each question.
    Return ONLY a JSON object with keys: "overall_score", "feedback" (array of objects with question and rating).
  `;
  try {
    return await getAIResponse(prompt);
  } catch (err) {
    logger.error(`evaluateInterviewWithAI failed: ${err.message}`);
    return { overall_score: 0, feedback: [] };
  }
};

module.exports = {
  analyzeResumeWithAI,
  evaluateInterviewWithAI
};
