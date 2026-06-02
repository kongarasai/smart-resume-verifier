const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const logDebug = (msg) => {
  const logPath = path.join(process.cwd(), 'logs', 'ai-debug.txt');
  if (!fs.existsSync(path.dirname(logPath))) fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `[GEMINI] ${new Date().toISOString()}\n${msg}\n\n`);
};

const generateWithGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using only non-deprecated models as requested
  const models = ["gemini-2.0-flash", "gemini-2.5-flash"];
  let lastErr;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      logDebug(`Model: ${modelName}\nPrompt: ${prompt.substring(0, 100)}...\nResponse: ${text}`);
      return text;
    } catch (err) {
      lastErr = err;
      console.warn(`Gemini ${modelName} failed: ${err.message}`);
    }
  }
  throw lastErr;
};

module.exports = { generateWithGemini };
