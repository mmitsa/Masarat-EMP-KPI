/**
 * Redis Client Configuration for Next.js Server Components
 * Provides caching functionality for API calls and data
 */

import redis from 'redis';

let redisClient = null;

/**
 * Get or create Redis client
 */
function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || 'masarat123',
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 500),
    },
  });

  redisClient.on('error', (err) => {
    console.warn('Redis error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Connected to Redis');
  });

  redisClient.connect().catch(console.warn);

  return redisClient;
}

/**
 * Get value from cache
 */
export async function getCached(key) {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    if (value) {
      console.log(`Cache hit: ${key}`);
      return JSON.parse(value);
    }
    console.log(`Cache miss: ${key}`);
    return null;
  } catch (error) {
    console.warn('Error getting cached value:', error);
    return null;
  }
}

/**
 * Set value in cache with expiration
 */
export async function setCached(key, value, ttlSeconds = 300) {
  try {
    const client = getRedisClient();
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
    console.log(`Cache set: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    console.warn('Error setting cached value:', error);
  }
}

/**
 * Delete value from cache
 */
export async function deleteCached(key) {
  try {
    const client = getRedisClient();
    await client.del(key);
    console.log(`Cache deleted: ${key}`);
  } catch (error) {
    console.warn('Error deleting cached value:', error);
  }
}

/**
 * Get or set pattern (cache-aside)
 */
export async function getOrSetCached(key, fetchFn, ttlSeconds = 300) {
  try {
    // Try to get from cache first
    const cached = await getCached(key);
    if (cached) {
      return cached;
    }

    // Not in cache, fetch from source
    const value = await fetchFn();

    // Store in cache
    if (value) {
      await setCached(key, value, ttlSeconds);
    }

    return value;
  } catch (error) {
    console.warn('Error in getOrSetCached:', error);
    // Return fresh value if caching fails
    return await fetchFn();
  }
}

/**
 * Invalidate cache pattern (e.g., "employees:*")
 */
export async function invalidatePattern(pattern) {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.warn('Error invalidating cache pattern:', error);
  }
}

/**
 * Clear all cache
 */
export async function clearAllCache() {
  try {
    const client = getRedisClient();
    await client.flushDb();
    console.log('All cache cleared');
  } catch (error) {
    console.warn('Error clearing all cache:', error);
  }
}

export default {
  getCached,
  setCached,
  deleteCached,
  getOrSetCached,
  invalidatePattern,
  clearAllCache,
};
