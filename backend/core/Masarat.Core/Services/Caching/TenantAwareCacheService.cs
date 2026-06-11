using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Masarat.Core.MultiTenancy;

namespace Masarat.Core.Services.Caching
{
    /// <summary>
    /// Tenant-aware cache service that ENFORCES tenant isolation
    /// خدمة Cache آمنة تُلزم بعزل المستأجرين
    /// 
    /// Security Feature: Prevents cache key collisions between tenants
    /// All cache operations MUST include tenant context
    /// </summary>
    public class TenantAwareCacheService : ICacheService
    {
        private readonly ICacheService _innerCache;
        private readonly ITenantContext _tenantContext;
        private readonly ILogger<TenantAwareCacheService> _logger;

        public TenantAwareCacheService(
            RedisCacheService innerCache,
            ITenantContext tenantContext,
            ILogger<TenantAwareCacheService> logger)
        {
            _innerCache = innerCache;
            _tenantContext = tenantContext;
            _logger = logger;
        }

        /// <summary>
        /// Generates tenant-safe cache key with MANDATORY tenant prefix
        /// Format: tenant:{tenantId}:{originalKey}
        /// </summary>
        private string GetTenantSafeKey(string key)
        {
            var tenantId = _tenantContext.TenantId;
            
            if (tenantId == null)
            {
                _logger.LogWarning("⚠️ SECURITY: Cache access without tenant context for key: {Key}", key);
                throw new InvalidOperationException(
                    $"Cannot access cache without tenant context. Key: {key}. " +
                    "All cache operations MUST be tenant-scoped to prevent data leakage.");
            }

            // ✅ MANDATORY tenant prefix - prevents cross-tenant cache collisions
            var tenantSafeKey = $"tenant:{tenantId}:{key}";
            
            _logger.LogTrace("✅ Cache key generated: {TenantSafeKey} (Tenant: {TenantId})", 
                tenantSafeKey, tenantId);
            
            return tenantSafeKey;
        }

        /// <summary>
        /// Get value from cache with automatic tenant isolation
        /// </summary>
        public async Task<T?> GetAsync<T>(string key)
        {
            var tenantSafeKey = GetTenantSafeKey(key);
            _logger.LogDebug("✅ Cache GET (tenant-isolated): {Key} → {TenantSafeKey}", 
                key, tenantSafeKey);
            
            return await _innerCache.GetAsync<T>(tenantSafeKey);
        }

        /// <summary>
        /// Set value in cache with automatic tenant isolation
        /// </summary>
        public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
        {
            var tenantSafeKey = GetTenantSafeKey(key);
            _logger.LogDebug("✅ Cache SET (tenant-isolated): {Key} → {TenantSafeKey}, Expiry: {Expiry}", 
                key, tenantSafeKey, expiry?.TotalSeconds ?? 0);
            
            await _innerCache.SetAsync(tenantSafeKey, value, expiry);
        }

        /// <summary>
        /// Remove value from cache with automatic tenant isolation
        /// </summary>
        public async Task RemoveAsync(string key)
        {
            var tenantSafeKey = GetTenantSafeKey(key);
            _logger.LogDebug("✅ Cache REMOVE (tenant-isolated): {Key} → {TenantSafeKey}", 
                key, tenantSafeKey);
            
            await _innerCache.RemoveAsync(tenantSafeKey);
        }

        /// <summary>
        /// Check if key exists in cache with automatic tenant isolation
        /// </summary>
        public async Task<bool> ExistsAsync(string key)
        {
            var tenantSafeKey = GetTenantSafeKey(key);
            return await _innerCache.ExistsAsync(tenantSafeKey);
        }

        /// <summary>
        /// Get or set pattern with automatic tenant isolation
        /// </summary>
        public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiry = null)
        {
            var tenantSafeKey = GetTenantSafeKey(key);
            
            _logger.LogDebug("✅ Cache GET_OR_SET (tenant-isolated): {Key} → {TenantSafeKey}", 
                key, tenantSafeKey);
            
            // Try to get from cache first
            var cached = await _innerCache.GetAsync<T>(tenantSafeKey);
            if (cached != null)
            {
                _logger.LogTrace("✅ Cache HIT (tenant-isolated): {TenantSafeKey}", tenantSafeKey);
                return cached;
            }

            // Not in cache, fetch from source
            _logger.LogTrace("⚪ Cache MISS (tenant-isolated): {TenantSafeKey}", tenantSafeKey);
            var value = await factory();

            // Store in cache for future requests
            if (value != null)
            {
                await _innerCache.SetAsync(tenantSafeKey, value, expiry);
            }

            return value;
        }
    }
}
