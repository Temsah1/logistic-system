/**
 * Rate limiting middleware
 * Implements token bucket algorithm for rate limiting
 */

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute window
    this.maxRequests = options.maxRequests || 100; // 100 requests per window
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.requests = new Map();
    
    // Cleanup old entries periodically
    this.cleanupInterval = setInterval(() => this.cleanup(), this.windowMs);
  }

  getKey(req) {
    // Use IP address as the key
    return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      // Remove entries older than the window
      if (now - data.resetTime > this.windowMs) {
        this.requests.delete(key);
      }
    }
  }

  middleware() {
    return (req, res, next) => {
      const key = this.getKey(req);
      const now = Date.now();
      const record = this.requests.get(key);

      if (!record || now - record.resetTime > this.windowMs) {
        // New window
        this.requests.set(key, {
          count: 1,
          resetTime: now
        });
        return this.addHeaders(res, 1, now, next);
      }

      // Check if limit exceeded
      if (record.count >= this.maxRequests) {
        const retryAfter = Math.ceil((record.resetTime + this.windowMs - now) / 1000);
        return res.status(429).json({
          message: 'Too many requests, please try again later',
          retryAfter
        });
      }

      // Increment counter
      record.count++;
      this.requests.set(key, record);

      this.addHeaders(res, record.count, record.resetTime, next);
    };
  }

  addHeaders(res, count, resetTime, next) {
    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - count));
    res.setHeader('X-RateLimit-Reset', new Date(resetTime + this.windowMs).toISOString());
    next();
  }

  reset(key) {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

// Create rate limiter instances for different use cases
const generalLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100 // 100 requests per minute
});

const authLimiter = new RateLimiter({
  windowMs: 900000, // 15 minutes
  maxRequests: 5 // 5 login attempts per 15 minutes
});

const apiLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 200 // 200 requests per minute
});

module.exports = {
  RateLimiter,
  generalLimiter,
  authLimiter,
  apiLimiter
};
