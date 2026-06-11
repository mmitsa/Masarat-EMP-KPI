using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

namespace Masarat.Core.Monitoring;

public static class MonitoringConfiguration
{
    /// <summary>
    /// إضافة خدمات المراقبة والتتبع
    /// </summary>
    public static IServiceCollection AddObservability(this IServiceCollection services, IConfiguration configuration)
    {
        // Add health checks
        services.AddHealthChecks()
            .AddCheck("Self", () => HealthCheckResult.Healthy(), tags: new[] { "live" });

        // Memory cache for observability
        services.AddMemoryCache();

        // Add Redis connection if configured
        var redisConnectionString = configuration["Redis:ConnectionString"];
        if (!string.IsNullOrEmpty(redisConnectionString))
        {
            try
            {
                var redis = ConnectionMultiplexer.Connect(redisConnectionString);
                services.AddSingleton<IConnectionMultiplexer>(redis);
            }
            catch
            {
                // Redis not available, will use memory cache fallback
                services.AddSingleton<IConnectionMultiplexer>(_ => null!);
            }
        }
        else
        {
            // No Redis configured, provide null implementation
            services.AddSingleton<IConnectionMultiplexer>(_ => null!);
        }

        return services;
    }

    /// <summary>
    /// استخدام Observability Middleware
    /// </summary>
    public static IApplicationBuilder UseObservability(this IApplicationBuilder app)
    {
        // Add exception handling middleware
        app.UseExceptionHandler("/error");

        return app;
    }

    public static void AddEnterpriseHealthChecks(this IServiceCollection services, string? connectionString)
    {
        var healthChecksBuilder = services.AddHealthChecks();

        if (!string.IsNullOrEmpty(connectionString))
        {
            healthChecksBuilder.AddSqlServer(connectionString, name: "Database", failureStatus: HealthStatus.Unhealthy);
        }
    }
}
