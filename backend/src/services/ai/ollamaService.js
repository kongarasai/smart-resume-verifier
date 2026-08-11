const fs = require('fs');
const path = require('path');

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const OLLAMA_TIMEOUT_MS = 120000; // 2 minutes — local inference can be slow

const logDebug = (msg) => {
  const logPath = path.join(process.cwd(), 'logs', 'ai-debug.txt');
  if (!fs.existsSync(path.dirname(logPath))) fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `[OLLAMA] ${new Date().toISOString()}\n${msg}\n\n`);
};

/**
 * Generates a response using a locally-running Ollama model.
 * No API key required — Ollama runs entirely on-machine.
 *
 * To set up:
 *   1. Install Ollama: https://ollama.com/download
 *   2. Pull a model: `ollama pull llama3.2`
 *   3. Start Ollama (it auto-starts on install): `ollama serve`
 *
 * Optional env vars:
 *   OLLAMA_URL   — Default: http://localhost:11434
 *   OLLAMA_MODEL — Default: llama3.2
 */
const generateWithOllama = async (prompt) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'bypass-tunnel-reminder': 'true',   // localtunnel bypass
        'User-Agent': 'SmartResumeVerifier/2.0'
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.5,
          num_predict: 2048,
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const text = data.response || '';

    logDebug(`Model: ${OLLAMA_MODEL}\nPrompt: ${prompt.substring(0, 100)}...\nResponse: ${text.substring(0, 200)}...`);
    return text;

  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Ollama request timed out after ${OLLAMA_TIMEOUT_MS / 1000}s`);
    }
    // Give a helpful error message if Ollama is not running
    if (err.code === 'ECONNREFUSED') {
      throw new Error(
        `Ollama is not running at ${OLLAMA_BASE_URL}. ` +
        `Install it from https://ollama.com and run: ollama pull ${OLLAMA_MODEL}`
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { generateWithOllama };
