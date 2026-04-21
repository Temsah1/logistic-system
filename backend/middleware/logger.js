/**
 * Request logging middleware
 * Logs HTTP requests with response time and status codes
 */

const logger = (req, res, next) => {
  const startTime = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('user-agent') || 'Unknown';

  // Log request
  console.log(`[${new Date().toISOString()}] ${method} ${url} - IP: ${ip} - UA: ${userAgent.substring(0, 50)}`);

  // Capture original end method
  const originalEnd = res.end;

  // Override end method to log response
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    
    // Log response with color coding
    const statusColor = statusCode >= 500 ? '\x1b[31m' : // Red for 5xx
                      statusCode >= 400 ? '\x1b[33m' : // Yellow for 4xx
                      statusCode >= 300 ? '\x1b[36m' : // Cyan for 3xx
                      statusCode >= 200 ? '\x1b[32m' : // Green for 2xx
                      '\x1b[0m'; // Default

    console.log(`${statusColor}[${new Date().toISOString()}] ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms\x1b[0m`);
    
    // Call original end method
    originalEnd.apply(this, args);
  };

  next();
};

/**
 * Error logging middleware
 * Logs errors with stack traces
 */
const errorLogger = (err, req, res, next) => {
  console.error(`\x1b[31m[${new Date().toISOString()}] ERROR: ${err.message}\x1b[0m`);
  console.error(`Stack: ${err.stack}`);
  console.error(`Request: ${req.method} ${req.url}`);
  console.error(`IP: ${req.ip}`);
  next(err);
};

module.exports = {
  logger,
  errorLogger
};
