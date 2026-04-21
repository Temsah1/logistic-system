/**
 * Simple in-memory caching middleware
 * Implements LRU cache with TTL support
 */

class Cache {
  constructor(maxSize = 1000, defaultTTL = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    // Remove oldest item if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Cleanup expired items periodically
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  get size() {
    return this.cache.size;
  }
}

// Create a singleton cache instance
const cache = new Cache(1000, 300000); // 1000 items, 5 minute TTL

// Cleanup expired items every minute
setInterval(() => cache.cleanup(), 60000);

/**
 * Cache middleware factory
 * @param {string} keyGenerator - Function to generate cache key from request
 * @param {number} ttl - Time to live in milliseconds
 */
const cacheMiddleware = (keyGenerator, ttl) => {
  return (req, res, next) => {
    const cacheKey = keyGenerator(req);
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache response
    res.json = function(data) {
      cache.set(cacheKey, data, ttl);
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Pattern to match cache keys
 */
const invalidateCache = (pattern) => {
  for (const key of cache.cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

module.exports = {
  cache,
  cacheMiddleware,
  invalidateCache
};
