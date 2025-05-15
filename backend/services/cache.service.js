/**
 * Cache Service for NiveshPath
 * Provides in-memory caching to improve response times
 */

class CacheService {
  constructor(ttl = 3600) {
    this.cache = new Map();
    this.ttl = ttl * 1000; // Convert to milliseconds
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    if (!this.cache.has(key)) return null;
    
    const { value, expiry } = this.cache.get(key);
    
    // Check if cache entry has expired
    if (expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return value;
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} customTtl - Optional custom TTL in seconds
   */
  set(key, value, customTtl) {
    const ttl = customTtl ? customTtl * 1000 : this.ttl;
    const expiry = Date.now() + ttl;
    
    this.cache.set(key, { value, expiry });
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   * @returns {Object} - Cache statistics
   */
  getStats() {
    let activeEntries = 0;
    let expiredEntries = 0;
    const now = Date.now();
    
    this.cache.forEach(({ expiry }) => {
      if (expiry > now) {
        activeEntries++;
      } else {
        expiredEntries++;
      }
    });
    
    return {
      totalEntries: this.cache.size,
      activeEntries,
      expiredEntries
    };
  }
}

// Create singleton instance
const chatbotCache = new CacheService(1800); // 30 minutes TTL for chatbot responses
const userProfileCache = new CacheService(3600); // 1 hour TTL for user profiles

module.exports = {
  chatbotCache,
  userProfileCache
};