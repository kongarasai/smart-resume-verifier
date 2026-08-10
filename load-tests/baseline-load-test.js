const autocannon = require('autocannon');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const DURATION = parseInt(process.env.DURATION || '60', 10); // 1 minute (60 seconds)
const CONNECTIONS = parseInt(process.env.CONNECTIONS || '100', 10); // 100 virtual users

console.log(`=======================================================`);
console.log(`🚀 STARTING BASELINE LOAD TEST (300 Load Scenarios)`);
console.log(` Target URL: ${BASE_URL}`);
console.log(` Virtual Users (Connections): ${CONNECTIONS}`);
console.log(` Duration: ${DURATION} seconds (1 minute)`);
console.log(`=======================================================\n`);

// Generate 300 unique load test scenarios / requests
const loadTestRequests = [];
const apiEndpoints = [
  '/health',
  '/api/auth/me',
  '/api/profile',
  '/api/questions',
  '/api/ranking',
  '/api/jobs',
  '/api/groups',
  '/api/notifications',
  '/api/trust-score',
  '/api/practice/progress'
];

// Replicate combinations to create 300 distinct HTTP scenarios
for (let i = 1; i <= 300; i++) {
  const endpoint = apiEndpoints[i % apiEndpoints.length];
  loadTestRequests.push({
    method: 'GET',
    path: `${endpoint}?testScenarioId=LTC-${String(i).padStart(3, '0')}`,
    headers: {
      'x-load-test-id': `LTC-${String(i).padStart(3, '0')}`
    }
  });
}

const instance = autocannon({
  url: BASE_URL,
  connections: CONNECTIONS,
  duration: DURATION,
  pipelining: 1,
  requests: loadTestRequests
}, (err, result) => {
  if (err) {
    console.error('Error running baseline load test:', err);
    process.exit(1);
  }

  console.log(`\n=======================================================`);
  console.log(`📊 BASELINE LOAD TEST RESULTS SUMMARY (300 Scenarios)`);
  console.log(`=======================================================`);
  console.log(` Requests Per Second (RPS): ${result.requests.average.toFixed(2)} req/sec`);
  console.log(` Total Requests Sent: ${result.requests.total}`);
  console.log(` Response Time (Average): ${result.latency.average.toFixed(2)} ms`);
  console.log(` Response Time (Min): ${result.latency.min} ms`);
  console.log(` Response Time (Max): ${result.latency.max} ms`);
  console.log(` Response Time (p90): ${result.latency.p90} ms`);
  console.log(` Response Time (p99): ${result.latency.p99} ms`);
  console.log(` Throughput: ${(result.throughput.average / (1024 * 1024)).toFixed(2)} MB/sec`);
  console.log(` 2xx Responses: ${result['2xx'] || 0}`);
  console.log(` Non-2xx Responses: ${result.non2xx || 0}`);
  console.log(` Total Errors: ${result.errors || 0}`);
  console.log(` Timeouts: ${result.timeouts || 0}`);
  console.log(`=======================================================\n`);

  const metricsPath = path.join(__dirname, 'load-test-metrics.json');
  fs.writeFileSync(metricsPath, JSON.stringify(result, null, 2));
  console.log(` Saved load test metrics to ${metricsPath}`);
});

autocannon.track(instance, { renderProgressBar: true });
