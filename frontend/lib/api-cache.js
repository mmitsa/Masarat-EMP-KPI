/**
 * API Caching Utility for Next.js Route Handlers
 * Implements cache-aside pattern with Redis
 */

import { getOrSetCached, getCached, deleteCached } from '../lib/redis-cache';

/**
 * Fetch from backend API with caching
 * @param {string} endpoint - Backend API endpoint
 * @param {object} options - Fetch options
 * @param {number} cacheTtl - Cache TTL in seconds (default: 300s = 5 min)
 */
export async function fetchWithCache(endpoint, options = {}, cacheTtl = 300) {
  const cacheKey = `api:${endpoint}:${JSON.stringify(options.body || {})}`;

  return await getOrSetCached(
    cacheKey,
    async () => {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    },
    cacheTtl
  );
}

/**
 * Invalidate API cache for a specific endpoint
 */
export async function invalidateApiCache(endpoint) {
  const pattern = `api:${endpoint}:*`;
  await deleteCached(pattern);
}

/**
 * Create a cached API route handler
 */
export function createCachedApiRoute(handler, cacheTtl = 300) {
  return async (req, res) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return handler(req, res);
    }

    const cacheKey = `api_handler:${req.url}`;

    try {
      // Try to get from cache
      const cached = await getCached(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cached);
      }

      // Intercept res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function (data) {
        // Cache successful responses only (2xx status)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          deleteCached(cacheKey).then(() => {
            setCached(cacheKey, data, cacheTtl);
          });
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(data);
      };

      return handler(req, res);
    } catch (error) {
      console.warn('Cached API route error:', error);
      return handler(req, res);
    }
  };
}
