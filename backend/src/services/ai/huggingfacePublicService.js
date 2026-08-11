/**
 * HuggingFace Public Inference Service
 * ─────────────────────────────────────
 * Uses HuggingFace's FREE public inference endpoint.
 * NO API key, NO account, NO credit card required.
 * Just a plain public HTTP POST — like calling any website.
 *
 * Model: HuggingFaceH4/zephyr-7b-beta (7B parameter real AI)
 * Falls back to phi-2 (2.7B) if zephyr is loading.
 */

const logger = require('../../utils/logger');

const MODELS = [
  'HuggingFaceH4/zephyr-7b-beta',
  'mistralai/Mistral-7B-Instruct-v0.3',
  'microsoft/phi-2',
];

const HF_TIMEOUT_MS = 60000; // 60 seconds (model may need warm-up)

const generateWithHuggingFacePublic = async (prompt) => {
  let lastErr;

  for (const model of MODELS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HF_TIMEOUT_MS);

    try {
      logger.info(`[HF Public] Trying model: ${model}`);

      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // ⚠️ No Authorization header — fully anonymous public access
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 2048,
              temperature: 0.6,
              return_full_text: false,
            },
            options: {
              wait_for_model: true, // wait instead of returning 503
            }
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeout);

      if (response.status === 503) {
        // Model is loading — try next model
        logger.warn(`[HF Public] ${model} is loading (503), trying next model...`);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HF Public API ${response.status}: ${errText.substring(0, 200)}`);
      }

      const data = await response.json();

      // HF returns array of generated_text
      let text = '';
      if (Array.isArray(data) && data[0]?.generated_text) {
        text = data[0].generated_text;
      } else if (typeof data === 'string') {
        text = data;
      } else if (data?.generated_text) {
        text = data.generated_text;
      }

      if (!text || text.trim().length < 10) {
        throw new Error(`${model} returned empty response`);
      }

      logger.info(`[HF Public] ✅ Generated response using ${model} (${text.length} chars)`);
      return text;

    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        logger.warn(`[HF Public] ${model} timed out after ${HF_TIMEOUT_MS / 1000}s`);
      } else {
        logger.warn(`[HF Public] ${model} failed: ${err.message}`);
      }
      lastErr = err;
    }
  }

  throw lastErr || new Error('All HuggingFace public models failed');
};

module.exports = { generateWithHuggingFacePublic };
