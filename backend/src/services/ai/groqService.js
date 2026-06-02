const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const logDebug = (msg) => {
  const logPath = path.join(process.cwd(), 'logs', 'ai-debug.txt');
  if (!fs.existsSync(path.dirname(logPath))) fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `[GROQ] ${new Date().toISOString()}\n${msg}\n\n`);
};

const generateWithGroq = async (prompt) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing");

  const groq = new Groq({ apiKey });
  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
  });

  const text = chatCompletion.choices[0]?.message?.content || "";
  logDebug(`Prompt: ${prompt.substring(0, 100)}...\nResponse: ${text}`);
  return text;
};

module.exports = { generateWithGroq };
