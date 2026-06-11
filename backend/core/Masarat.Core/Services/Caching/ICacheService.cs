using System;
using System.Threading.Tasks;

namespace Masarat.Core.Services.Caching
{
    /// <summary>
    /// Cache service abstraction for distributed caching
    /// </summary>
    public interface ICacheService
    {
        /// <summary>
        /// Get value from cache by key
        /// </summary>
        Task<T?> GetAsync<T>(string key);

        /// <summary>
        /// Set value in cache with optional expiration
        /// </summary>
        Task SetAsync<T>(string key, T value, TimeSpan? expiry = null);

        /// <summary>
        /// Remove value from cache
        /// </summary>
        Task RemoveAsync(string key);

        /// <summary>
        /// Check if key exists in cache
        /// </summary>
        Task<bool> ExistsAsync(string key);

        /// <summary>
        /// Get or set value (cache-aside pattern)
        /// </summary>
        Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiry = null);
    }
}
