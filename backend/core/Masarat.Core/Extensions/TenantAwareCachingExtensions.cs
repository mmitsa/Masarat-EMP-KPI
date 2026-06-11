using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Masarat.Core.Services.Caching;

namespace Masarat.Core.Extensions
{
    /// <summary>
    /// Extension methods for configuring tenant-aware caching
    /// </summary>
    public static class TenantAwareCachingExtensions
    {
        /// <summary>
        /// Adds tenant-aware caching services
        /// SECURITY: Replaces standard cache service with tenant-isolated version
        /// </summary>
        public static IServiceCollection AddTenantAwareCaching(this IServiceCollection services)
        {
            // Register inner Redis cache implementation
            services.AddScoped<RedisCacheService>();

            // Register tenant-aware wrapper as ICacheService
            // This ensures ALL cache operations are tenant-isolated
            services.AddScoped<ICacheService>(provider =>
            {
                var innerCache = provider.GetRequiredService<RedisCacheService>();
                var tenantContext = provider.GetRequiredService<MultiTenancy.ITenantContext>();
                var logger = provider.GetRequiredService<ILogger<TenantAwareCacheService>>();

                return new TenantAwareCacheService(innerCache, tenantContext, logger);
            });

            return services;
        }
    }
}
