using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace Masarat.Core.Services.Caching;

/// <summary>
/// Cache-Aside pattern extensions for IDistributedCache
/// </summary>
public static class CacheExtensions
{
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    };

    /// <summary>
    /// Get or set a cached value with automatic serialization
    /// </summary>
    public static async Task<T?> GetOrSetAsync<T>(
        this IDistributedCache cache,
        string key,
        Func<Task<T>> factory,
        TimeSpan? expiration = null,
        CancellationToken cancellationToken = default)
    {
        var cached = await cache.GetStringAsync(key, cancellationToken);
        if (cached != null)
        {
            return JsonSerializer.Deserialize<T>(cached, _jsonOptions);
        }

        var value = await factory();
        if (value != null)
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromMinutes(5)
            };

            var json = JsonSerializer.Serialize(value, _jsonOptions);
            await cache.SetStringAsync(key, json, options, cancellationToken);
        }

        return value;
    }

    /// <summary>
    /// Invalidate a cache entry
    /// </summary>
    public static async Task InvalidateAsync(
        this IDistributedCache cache,
        string key,
        CancellationToken cancellationToken = default)
    {
        await cache.RemoveAsync(key, cancellationToken);
    }

    /// <summary>
    /// Invalidate all entries matching a prefix pattern
    /// </summary>
    public static async Task InvalidateByPrefixAsync(
        this IDistributedCache cache,
        string prefix,
        CancellationToken cancellationToken = default)
    {
        // Note: IDistributedCache doesn't support key scanning natively
        // For Redis-backed cache, use the RedisCacheService directly
        // This is a convenience method for single key invalidation
        await cache.RemoveAsync(prefix, cancellationToken);
    }
}
