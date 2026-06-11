using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Masarat.Core.AuditViewer;
using Masarat.Core.Chaos;
using Masarat.Core.FeatureFlags;
using Masarat.Core.Middleware;
using Masarat.Core.RateLimiting;
using Masarat.Core.RealTime;
using Masarat.Core.Telemetry;
using Masarat.Core.Versioning;
namespace Masarat.Core.Extensions;

/// <summary>
/// Extension methods موحدة لإضافة جميع خدمات Masarat
/// Unified extension methods for adding all Masarat services
/// </summary>
public static class MasaratServiceExtensions
{
    /// <summary>
    /// إضافة جميع خدمات Masarat الأساسية
    /// Add all core Masarat services
    /// </summary>
    /// <example>
    /// <code>
    /// // في Program.cs
    /// builder.Services.AddMasaratCore(builder.Configuration, "HR-API");
    /// </code>
    /// </example>
    public static IServiceCollection AddMasaratCore(
        this IServiceCollection services,
        IConfiguration configuration,
        string serviceName)
    {
        // 1. OpenTelemetry (Tracing, Metrics, Logging)
        services.AddMasaratTelemetry(configuration, serviceName);

        // 2. Rate Limiting
        services.AddTenantRateLimiting(configuration);

        // 3. API Versioning
        services.AddMasaratApiVersioning();

        // 4. Feature Flags
        services.AddFeatureFlags();

        // 5. Audit Log Viewer
        services.AddAuditLogViewer();

        // 6. Real-time Notifications (SignalR)
        services.AddMasaratRealTime();

        // 7. Chaos Engineering (only in non-production)
        if (configuration["ASPNETCORE_ENVIRONMENT"] != "Production")
        {
            services.AddChaosEngineering();
        }

        // 8. Correlation ID
        services.AddCorrelationId();

        return services;
    }

    /// <summary>
    /// استخدام جميع Middleware الخاصة بـ Masarat
    /// Use all Masarat middleware
    /// </summary>
    /// <example>
    /// <code>
    /// // في Program.cs
    /// app.UseMasaratCore();
    /// </code>
    /// </example>
    public static IApplicationBuilder UseMasaratCore(
        this IApplicationBuilder app,
        IConfiguration configuration)
    {
        // 1. Security Headers (يجب أن يكون أولاً - defense in depth)
        app.UseSecurityHeaders();

        // 2. Correlation IDs
        app.UseCorrelationId();

        // 3. Request/Response Logging
        app.UseRequestResponseLogging();

        // 4. Rate Limiting
        app.UseRateLimiter();

        // 5. Telemetry
        app.UseMasaratTelemetry();

        // 6. Chaos Engineering (only in non-production)
        if (configuration["ASPNETCORE_ENVIRONMENT"] != "Production")
        {
            app.UseChaosEngineering();
        }

        return app;
    }

    /// <summary>
    /// تكوين Endpoints الخاصة بـ Masarat
    /// Configure Masarat endpoints
    /// </summary>
    /// <example>
    /// <code>
    /// // في Program.cs
    /// app.MapMasaratEndpoints();
    /// </code>
    /// </example>
    public static IEndpointRouteBuilder MapMasaratEndpoints(this IEndpointRouteBuilder endpoints)
    {
        // SignalR Hub
        endpoints.MapMasaratHub();

        return endpoints;
    }

    /// <summary>
    /// إضافة Swagger مع دعم الإصدارات
    /// Add Swagger with versioning support
    /// </summary>
    public static IServiceCollection AddMasaratSwagger(
        this IServiceCollection services,
        string title,
        string description)
    {
        return services.AddVersionedSwagger(title, description);
    }

    /// <summary>
    /// استخدام Swagger مع الإصدارات
    /// Use Swagger with versioning
    /// </summary>
    public static IApplicationBuilder UseMasaratSwagger(this IApplicationBuilder app)
    {
        return app.UseVersionedSwagger();
    }
}

/// <summary>
/// مثال على استخدام الخدمات في Program.cs
/// Example usage in Program.cs
/// </summary>
/// <remarks>
/// <code>
/// // ============================================
/// // Program.cs Example for any Masarat API
/// // ============================================
///
/// using Masarat.Core.Extensions;
///
/// var builder = WebApplication.CreateBuilder(args);
///
/// // ============================================
/// // 1. Add Masarat Core Services
/// // ============================================
/// builder.Services.AddMasaratCore(builder.Configuration, "HR-API");
///
/// // OR add services individually:
/// // builder.Services.AddMasaratTelemetry(builder.Configuration, "HR-API");
/// // builder.Services.AddMasaratRateLimiting(builder.Configuration);
/// // builder.Services.AddMasaratApiVersioning();
/// // builder.Services.AddFeatureFlags();
/// // builder.Services.AddAuditLogViewer();
/// // builder.Services.AddMasaratRealTime();
/// // builder.Services.AddWebhookService();
///
/// // ============================================
/// // 2. Add Swagger with Versioning
/// // ============================================
/// builder.Services.AddMasaratSwagger("Masarat HR API", "API للموارد البشرية");
///
/// // ============================================
/// // 3. Add Controllers
/// // ============================================
/// builder.Services.AddControllers();
///
/// var app = builder.Build();
///
/// // ============================================
/// // 4. Use Masarat Middleware
/// // ============================================
/// app.UseMasaratCore(builder.Configuration);
///
/// // OR use middleware individually:
/// // app.UseCorrelationIds();
/// // app.UseRequestResponseLogging();
/// // app.UseRateLimiter();
/// // app.UseMasaratTelemetry();
///
/// // ============================================
/// // 5. Use Swagger
/// // ============================================
/// if (app.Environment.IsDevelopment())
/// {
///     app.UseMasaratSwagger();
/// }
///
/// // ============================================
/// // 6. Standard Middleware
/// // ============================================
/// app.UseRouting();
/// app.UseAuthentication();
/// app.UseAuthorization();
///
/// // ============================================
/// // 7. Map Endpoints
/// // ============================================
/// app.MapControllers();
/// app.MapMasaratEndpoints(); // Maps SignalR hub
///
/// app.Run();
/// </code>
/// </remarks>
public class ProgramExample { }

/// <summary>
/// إعدادات appsettings.json المطلوبة
/// Required appsettings.json configuration
/// </summary>
/// <remarks>
/// <code>
/// {
///   "ConnectionStrings": {
///     "DefaultConnection": "Server=localhost;Database=Masarat_HR;User Id=sa;Password=***;",
///     "Redis": "localhost:6379"
///   },
///
///   "Telemetry": {
///     "JaegerEndpoint": "http://localhost:14268/api/traces",
///     "JaegerHost": "localhost",
///     "JaegerPort": "6831",
///     "OtlpEndpoint": "http://localhost:4317"
///   },
///
///   "RateLimiting": {
///     "EnableRateLimiting": true,
///     "EnablePerTenantLimits": true,
///     "DefaultRequestsPerMinute": 1000,
///     "TierLimits": {
///       "Enterprise": 5000,
///       "Professional": 2000,
///       "Standard": 500,
///       "Trial": 100
///     }
///   },
///
///   "FeatureFlags": {
///     "UseRedis": true,
///     "CacheExpirationMinutes": 5
///   },
///
///   "Webhooks": {
///     "MaxRetries": 3,
///     "RetryDelaySeconds": 60,
///     "TimeoutSeconds": 30
///   },
///
///   "Chaos": {
///     "IsEnabled": false,
///     "AllowedEnvironments": ["Development", "Staging"],
///     "Experiments": {
///       "latency": {
///         "IsEnabled": false,
///         "Probability": 10,
///         "MinDelayMs": 100,
///         "MaxDelayMs": 3000
///       },
///       "exception": {
///         "IsEnabled": false,
///         "Probability": 5
///       }
///     }
///   },
///
///   "RequestLogging": {
///     "LogRequestBody": true,
///     "LogResponseBody": true,
///     "MaxBodyLength": 4096,
///     "SlowRequestThresholdMs": 1000,
///     "ExcludedPaths": ["/health", "/metrics", "/swagger"]
///   }
/// }
/// </code>
/// </remarks>
public class AppSettingsExample { }
