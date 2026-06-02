/**
 * Retries a function with exponential backoff.
 */
const withRetry = async (fn, retries = 2, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries) {
        const waitTime = delay * Math.pow(2, i);
        console.warn(`Retry ${i + 1}/${retries} after ${waitTime}ms due to: ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
};

module.exports = { withRetry };
