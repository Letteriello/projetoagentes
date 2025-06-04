const axios = require('axios');

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000/api/chat-stream'; // Default to localhost for easy local test
const API_KEY = process.env.CHAT_API_KEY || 'your-test-api-key'; // Ensure this is set for actual tests
const CONCURRENT_REQUESTS = parseInt(process.env.CONCURRENT_REQUESTS) || 10;
const TOTAL_REQUESTS = parseInt(process.env.TOTAL_REQUESTS) || 50;

const requestPayload = {
  agentId: 'agent_simple_llm',
  userMessage: 'Hello, tell me a short story about a robot.',
  history: [],
};

const requestHeaders = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

let completedRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
const responseTimes = [];

async function sendRequest(requestId) {
  const startTime = Date.now();
  try {
    const response = await axios.post(TARGET_URL, requestPayload, { headers: requestHeaders, responseType: 'stream' });

    let chunks = 0;
    let totalBytes = 0;
    // Consume the stream
    await new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        chunks++;
        totalBytes += chunk.length;
        // Optionally parse chunk if it's NDJSON and we need to verify content
        // For this basic test, just consuming is enough to ensure the stream is flowing.
      });
      response.data.on('end', () => {
        const duration = Date.now() - startTime;
        responseTimes.push(duration);
        successfulRequests++;
        // console.log(`Request ${requestId}: Success (${duration}ms) - ${chunks} chunks, ${totalBytes} bytes`);
        resolve();
      });
      response.data.on('error', (err) => {
        const duration = Date.now() - startTime;
        // responseTimes.push(duration); // Optionally record time for failed stream after start
        failedRequests++;
        console.error(`Request ${requestId}: Stream Error (${duration}ms) - ${err.message}`);
        reject(err);
      });
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    // responseTimes.push(duration); // Optionally record time for failed requests
    failedRequests++;
    if (error.response) {
      // Log error response from server (e.g., 401, 404, 500)
      // error.response.data might be a stream too if error response is streamed, or an object if not.
      // For simplicity, we'll try to log status and potentially data if not a stream.
      let errorData = error.response.data;
      if (error.response.data && typeof error.response.data.on === 'function') { // Check if it's a stream
        errorData = await new Promise(resolve => {
          let data = '';
          error.response.data.on('data', chunk => data += chunk);
          error.response.data.on('end', () => resolve(data));
        });
      }
      console.error(`Request ${requestId}: Fail (${duration}ms) - Status ${error.response.status}: ${typeof errorData === 'object' ? JSON.stringify(errorData) : errorData}`);
    } else {
      // Network error or other issue before response
      console.error(`Request ${requestId}: Fail (${duration}ms) - ${error.message}`);
    }
  } finally {
    completedRequests++;
    // console.log(`Completed: ${completedRequests}/${TOTAL_REQUESTS}`);
  }
}

async function runLoadTest() {
  console.log(`Starting load test: ${TOTAL_REQUESTS} requests, ${CONCURRENT_REQUESTS} concurrency, to ${TARGET_URL}`);
  const testStartTime = Date.now();

  const requestPromises = [];
  let activeRequestCount = 0;
  let launchedRequests = 0;

  const manageConcurrency = async () => {
    while (launchedRequests < TOTAL_REQUESTS || activeRequestCount > 0) {
      if (activeRequestCount < CONCURRENT_REQUESTS && launchedRequests < TOTAL_REQUESTS) {
        const requestId = launchedRequests + 1;
        // console.log(`Launching request ${requestId}`);
        const promise = sendRequest(requestId)
          .finally(() => {
            activeRequestCount--;
            // console.log(`Request ${requestId} finished. Active: ${activeRequestCount}`);
          });
        requestPromises.push(promise);
        activeRequestCount++;
        launchedRequests++;
      } else if (activeRequestCount > 0) {
        // Wait for some requests to complete if concurrency limit is reached or all requests launched
        // This basic limiter waits for the next promise in the list to settle.
        // A more sophisticated approach might use Promise.race on a pool of active promises.
        // For this script, a simpler awaiting of pushed promises will naturally limit if needed,
        // but let's explicitly manage activeRequestCount.
        await Promise.allSettled(requestPromises.slice(-CONCURRENT_REQUESTS)); // Check on a batch
      } else {
        // All requests launched and all active requests finished
        break;
      }
       // Small delay to prevent tight loop if all requests are finishing very fast
       // or if waiting for a slot.
      if (activeRequestCount >= CONCURRENT_REQUESTS || (launchedRequests === TOTAL_REQUESTS && activeRequestCount > 0)) {
         await new Promise(resolve => setTimeout(resolve, 50)); // wait for some requests to complete
      }
    }
  };

  await manageConcurrency();
  await Promise.allSettled(requestPromises); // Ensure all requests are truly settled

  const testDuration = Date.now() - testStartTime;
  console.log("\n--- Load Test Summary ---");
  console.log(`Total Requests Sent: ${launchedRequests} (intended: ${TOTAL_REQUESTS})`);
  console.log(`Completed Requests: ${completedRequests}`);
  console.log(`Successful Requests (Stream End): ${successfulRequests}`);
  console.log(`Failed Requests (Error/Stream Error): ${failedRequests}`);
  console.log(`Test Duration: ${(testDuration / 1000).toFixed(2)}s`);

  if (responseTimes.length > 0) {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    responseTimes.sort((a,b) => a - b); // Sort for percentile calculation
    const p90ResponseTime = responseTimes[Math.floor(0.90 * responseTimes.length)] || responseTimes[responseTimes.length-1];
    const p95ResponseTime = responseTimes[Math.floor(0.95 * responseTimes.length)] || responseTimes[responseTimes.length-1];
    const p99ResponseTime = responseTimes[Math.floor(0.99 * responseTimes.length)] || responseTimes[responseTimes.length-1];

    console.log(`Avg Response Time (to stream end): ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${minResponseTime}ms`);
    console.log(`Max Response Time: ${maxResponseTime}ms`);
    console.log(`P90 Response Time: ${p90ResponseTime}ms`);
    console.log(`P95 Response Time: ${p95ResponseTime}ms`);
    console.log(`P99 Response Time: ${p99ResponseTime}ms`);
  } else {
    console.log("No successful requests to calculate response times.");
  }
  const rps = successfulRequests / (testDuration / 1000);
  console.log(`Successful Requests Per Second (RPS): ${rps.toFixed(2)}`);
}

if (!process.env.CHAT_API_KEY) {
    console.warn("WARN: CHAT_API_KEY environment variable is not set. Test might fail due to authentication.");
}
if (!process.env.TARGET_URL) {
    console.warn(`WARN: TARGET_URL environment variable is not set. Using default: ${TARGET_URL}`);
}

runLoadTest().catch(err => {
  console.error("Load test execution failed:", err);
});
