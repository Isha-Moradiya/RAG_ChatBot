import { LRUCache } from "lru-cache";

// Enhanced rate limiting configuration
const rateLimitOptions = {
  max: 1000, // Maximum number of users to track
  ttl: 1000 * 60 * 60, // 1 hour TTL
};

const rateLimitStore = new LRUCache(rateLimitOptions);

// Get rate limit configuration from environment variables
const getRateLimitConfig = () => {
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 20;
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 1 minute default
  
  return { maxRequests, windowMs };
};

export function rateLimit(userId, customLimit = null) {
  const { maxRequests, windowMs } = getRateLimitConfig();
  const limit = customLimit || maxRequests;
  
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const entry = rateLimitStore.get(userId) || {
    requests: [],
    lastRequest: now,
  };

  // Clean old requests outside the window
  entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
  
  // Check if user has exceeded the limit
  if (entry.requests.length >= limit) {
    const oldestRequest = Math.min(...entry.requests);
    const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
    
    return { 
      success: false, 
      retryAfter: Math.max(0, retryAfter),
      limit,
      remaining: 0,
      resetTime: oldestRequest + windowMs
    };
  }

  // Add current request
  entry.requests.push(now);
  entry.lastRequest = now;
  rateLimitStore.set(userId, entry);
  
  return { 
    success: true, 
    limit,
    remaining: limit - entry.requests.length,
    resetTime: now + windowMs
  };
}

// Get rate limit info for a user (without incrementing)
export function getRateLimitInfo(userId) {
  const { maxRequests, windowMs } = getRateLimitConfig();
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const entry = rateLimitStore.get(userId);
  if (!entry) {
    return {
      limit: maxRequests,
      remaining: maxRequests,
      resetTime: now + windowMs
    };
  }
  
  const validRequests = entry.requests.filter(timestamp => timestamp > windowStart);
  
  return {
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - validRequests.length),
    resetTime: now + windowMs
  };
}

// Reset rate limit for a user (admin function)
export function resetRateLimit(userId) {
  rateLimitStore.delete(userId);
  return { success: true };
}
