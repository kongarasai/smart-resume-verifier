const axios = require('axios');
const fs = require('fs');
const path = require('path');

const logDebug = (msg) => {
  const logPath = path.join(process.cwd(), 'logs', 'ai-debug.txt');
  if (!fs.existsSync(path.dirname(logPath))) fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `[OPENROUTER] ${new Date().toISOString()}\n${msg}\n\n`);
};

const generateWithOpenRouter = async (prompt) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY missing");

  const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
    model: "openai/gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  }, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:3000",
      "X-Title": "Smart Resume Verifier"
    },
    timeout: 30000
  });

  const text = response.data.choices[0]?.message?.content || "";
  logDebug(`Prompt: ${prompt.substring(0, 100)}...\nResponse: ${text}`);
  return text;
};

module.exports = { generateWithOpenRouter };
