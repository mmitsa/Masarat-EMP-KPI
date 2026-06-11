using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Masarat.Core.Services.Caching
{
    /// <summary>
    /// Redis-based distributed cache implementation
    /// Provides high-performance caching for frequently accessed data
    /// Falls back gracefully when Redis is not available
    /// </summary>
    public class RedisCacheService : ICacheService
    {
        private readonly IConnectionMultiplexer? _redis;
        private readonly ILogger<RedisCacheService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;
        private readonly bool _isRedisAvailable;

        public RedisCacheService(
            IConnectionMultiplexer? redis,
            ILogger<RedisCacheService> logger)
        {
            _redis = redis;
            _logger = logger;
            _isRedisAvailable = redis != null && redis.IsConnected;
            _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            if (!_isRedisAvailable)
            {
                _logger.LogWarning("Redis is not available, caching will be disabled");
            }
        }

        /// <summary>
        /// Get value from Redis cache
        /// </summary>
        public async Task<T?> GetAsync<T>(string key)
        {
            if (!_isRedisAvailable || _redis == null)
            {
                return default;
            }

            try
            {
                var db = _redis.GetDatabase();
                var value = await db.StringGetAsync(key);

                if (!value.HasValue)
                {
                    _logger.LogDebug("Cache miss for key: {Key}", key);
                    return default;
                }

                var deserialized = JsonSerializer.Deserialize<T>(value.ToString(), _jsonOptions);
                _logger.LogDebug("Cache hit for key: {Key}", key);
                return deserialized;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cache for key: {Key}", key);
                return default;
            }
        }

        /// <summary>
        /// Set value in Redis cache with optional expiration
        /// </summary>
        public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
        {
            if (!_isRedisAvailable || _redis == null)
            {
                return;
            }

            try
            {
                var db = _redis.GetDatabase();
                var json = JsonSerializer.Serialize(value, _jsonOptions);
                await db.StringSetAsync(key, json, expiry);
                _logger.LogDebug("Cache set for key: {Key}, Expiry: {Expiry}",
                    key, expiry?.TotalSeconds ?? 0);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting cache for key: {Key}", key);
            }
        }

        /// <summary>
        /// Remove value from Redis cache
        /// </summary>
        public async Task RemoveAsync(string key)
        {
            if (!_isRedisAvailable || _redis == null)
            {
                return;
            }

            try
            {
                var db = _redis.GetDatabase();
                await db.KeyDeleteAsync(key);
                _logger.LogDebug("Cache removed for key: {Key}", key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing cache for key: {Key}", key);
            }
        }

        /// <summary>
        /// Check if key exists in cache
        /// </summary>
        public async Task<bool> ExistsAsync(string key)
        {
            if (!_isRedisAvailable || _redis == null)
            {
                return false;
            }

            try
            {
                var db = _redis.GetDatabase();
                return await db.KeyExistsAsync(key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking cache existence for key: {Key}", key);
                return false;
            }
        }

        /// <summary>
        /// Get or set pattern - implements cache-aside pattern
        /// </summary>
        public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiry = null)
        {
            // Try to get from cache first
            var cached = await GetAsync<T>(key);
            if (cached != null)
            {
                return cached;
            }

            // Not in cache, fetch from source
            var value = await factory();

            // Store in cache for future requests
            if (value != null)
            {
                await SetAsync(key, value, expiry);
            }

            return value;
        }
    }
}
