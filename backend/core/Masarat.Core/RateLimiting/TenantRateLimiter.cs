using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.RateLimiting;
using System.Threading.Tasks;

namespace Masarat.Core.RateLimiting;

/// <summary>
/// Rate Limiting per Tenant - التحكم في معدل الطلبات لكل مستأجر
/// </summary>
/// 
#region Configuration

/// <summary>
/// خيارات Rate Limiting لكل مستأجر
/// </summary>
public class TenantRateLimitOptions
{
    /// <summary>
    /// عدد الطلبات المسموح بها في النافذة الزمنية - الخطة المجانية
    /// </summary>
    public int FreePermitLimit { get; set; } = 100;

    /// <summary>
    /// عدد الطلبات المسموح بها - الخطة الأساسية
    /// </summary>
    public int BasicPermitLimit { get; set; } = 1000;

    /// <summary>
    /// عدد الطلبات المسموح بها - الخطة المتقدمة
    /// </summary>
    public int ProPermitLimit { get; set; } = 5000;

    /// <summary>
    /// عدد الطلبات المسموح بها - خطة المؤسسات
    /// </summary>
    public int EnterprisePermitLimit { get; set; } = 50000;

    /// <summary>
    /// النافذة الزمنية بالدقائق
    /// </summary>
    public int WindowMinutes { get; set; } = 1;

    /// <summary>
    /// حجم قائمة الانتظار
    /// </summary>
    public int QueueLimit { get; set; } = 10;

    /// <summary>
    /// تفعيل Rate Limiting
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// المسارات المستثناة
    /// </summary>
    public List<string> ExcludedPaths { get; set; } = new()
    {
        "/health",
        "/api/health",
        "/swagger",
        "/favicon.ico"
    };
}

/// <summary>
/// خطط الاشتراك
/// </summary>
public enum SubscriptionPlan
{
    Free = 0,
    Basic = 1,
    Pro = 2,
    Enterprise = 3
}

#endregion

#region Rate Limiter Policy

/// <summary>
/// سياسة Rate Limiting حسب المستأجر
/// </summary>
public class TenantRateLimiterPolicy : IRateLimiterPolicy<string>
{
    private readonly TenantRateLimitOptions _options;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TenantRateLimiterPolicy> _logger;
    private readonly ConcurrentDictionary<string, RateLimiter> _limiters = new();

    public TenantRateLimiterPolicy(
        IOptions<TenantRateLimitOptions> options,
        IServiceProvider serviceProvider,
        ILogger<TenantRateLimiterPolicy> logger)
    {
        _options = options.Value;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public Func<OnRejectedContext, CancellationToken, ValueTask>? OnRejected => async (context, token) =>
    {
        var tenantId = GetTenantId(context.HttpContext);
        
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.Headers["Retry-After"] = _options.WindowMinutes.ToString();
        context.HttpContext.Response.Headers["X-RateLimit-Reset"] = 
            DateTimeOffset.UtcNow.AddMinutes(_options.WindowMinutes).ToUnixTimeSeconds().ToString();
        
        _logger.LogWarning(
            "Rate limit exceeded for tenant {TenantId}. Path: {Path}",
            tenantId,
            context.HttpContext.Request.Path);

        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            error = "RATE_LIMIT_EXCEEDED",
            message = "تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.",
            message_en = "Too many requests. Please try again later.",
            retryAfterSeconds = _options.WindowMinutes * 60,
            tenantId
        }, cancellationToken: token);
    };

    public RateLimitPartition<string> GetPartition(HttpContext httpContext)
    {
        var tenantId = GetTenantId(httpContext);
        var plan = GetTenantPlan(tenantId);
        var permitLimit = GetPermitLimit(plan);

        return RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: tenantId,
            factory: key => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = TimeSpan.FromMinutes(_options.WindowMinutes),
                SegmentsPerWindow = 4,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = _options.QueueLimit
            });
    }

    private string GetTenantId(HttpContext context)
    {
        // Try JWT claim first
        var tenantClaim = context.User?.FindFirst("tenant_id")?.Value;
        if (!string.IsNullOrEmpty(tenantClaim))
            return tenantClaim;

        // Try header
        if (context.Request.Headers.TryGetValue("X-Tenant-Id", out var headerValue))
            return headerValue.ToString();

        // Fallback to IP for anonymous
        return context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
    }

    private SubscriptionPlan GetTenantPlan(string tenantId)
    {
        // TODO: Get from cache/database
        // For now, return Pro as default
        return SubscriptionPlan.Pro;
    }

    private int GetPermitLimit(SubscriptionPlan plan)
    {
        return plan switch
        {
            SubscriptionPlan.Free => _options.FreePermitLimit,
            SubscriptionPlan.Basic => _options.BasicPermitLimit,
            SubscriptionPlan.Pro => _options.ProPermitLimit,
            SubscriptionPlan.Enterprise => _options.EnterprisePermitLimit,
            _ => _options.FreePermitLimit
        };
    }
}

#endregion

#region Middleware

/// <summary>
/// Middleware لعرض معلومات Rate Limit في Headers
/// </summary>
public class RateLimitHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;

    public RateLimitHeadersMiddleware(RequestDelegate next, IMemoryCache cache)
    {
        _next = next;
        _cache = cache;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var tenantId = GetTenantId(context);
        var cacheKey = $"rate_limit_{tenantId}";
        
        // Get current usage
        var usage = _cache.GetOrCreate(cacheKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1);
            return new RateLimitUsage { Count = 0, ResetAt = DateTime.UtcNow.AddMinutes(1) };
        });

        usage!.Count++;

        // Add rate limit headers
        context.Response.OnStarting(() =>
        {
            context.Response.Headers["X-RateLimit-Limit"] = "1000"; // Default
            context.Response.Headers["X-RateLimit-Remaining"] = Math.Max(0, 1000 - usage.Count).ToString();
            context.Response.Headers["X-RateLimit-Reset"] = new DateTimeOffset(usage.ResetAt).ToUnixTimeSeconds().ToString();
            return Task.CompletedTask;
        });

        await _next(context);
    }

    private string GetTenantId(HttpContext context)
    {
        var tenantClaim = context.User?.FindFirst("tenant_id")?.Value;
        if (!string.IsNullOrEmpty(tenantClaim))
            return tenantClaim;

        if (context.Request.Headers.TryGetValue("X-Tenant-Id", out var headerValue))
            return headerValue.ToString();

        return context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
    }

    private class RateLimitUsage
    {
        public int Count { get; set; }
        public DateTime ResetAt { get; set; }
    }
}

#endregion

#region Service Extensions

/// <summary>
/// Extension methods لتسجيل خدمات Rate Limiting
/// </summary>
public static class RateLimitingServiceExtensions
{
    /// <summary>
    /// إضافة Rate Limiting لكل مستأجر
    /// </summary>
    public static IServiceCollection AddTenantRateLimiting(
        this IServiceCollection services,
        Action<TenantRateLimitOptions>? configure = null)
    {
        // Configure options
        if (configure != null)
        {
            services.Configure(configure);
        }
        else
        {
            services.Configure<TenantRateLimitOptions>(_ => { });
        }

        // Add memory cache if not already added
        services.AddMemoryCache();

        // Add rate limiting
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            
            // Global limiter as fallback
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                var tenantId = context.User?.FindFirst("tenant_id")?.Value 
                    ?? context.Request.Headers["X-Tenant-Id"].ToString()
                    ?? context.Connection.RemoteIpAddress?.ToString()
                    ?? "anonymous";

                return RateLimitPartition.GetSlidingWindowLimiter(
                    partitionKey: tenantId,
                    factory: _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = 1000,
                        Window = TimeSpan.FromMinutes(1),
                        SegmentsPerWindow = 4,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 10
                    });
            });

            // Tenant-specific policy
            options.AddPolicy("TenantPolicy", context =>
            {
                var tenantId = context.User?.FindFirst("tenant_id")?.Value
                    ?? context.Request.Headers["X-Tenant-Id"].ToString()
                    ?? "anonymous";

                return RateLimitPartition.GetSlidingWindowLimiter(
                    partitionKey: tenantId,
                    factory: _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = 1000,
                        Window = TimeSpan.FromMinutes(1),
                        SegmentsPerWindow = 4,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 10
                    });
            });

            // Strict policy for sensitive endpoints
            options.AddPolicy("StrictPolicy", context =>
            {
                var tenantId = context.User?.FindFirst("tenant_id")?.Value ?? "anonymous";

                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: tenantId,
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    });
            });
        });

        return services;
    }

    /// <summary>
    /// استخدام Rate Limiting في Pipeline
    /// </summary>
    public static IApplicationBuilder UseTenantRateLimiting(this IApplicationBuilder app)
    {
        // Add headers middleware
        app.UseMiddleware<RateLimitHeadersMiddleware>();
        
        // Use built-in rate limiter
        app.UseRateLimiter();
        
        return app;
    }
}

#endregion

#region Attributes

/// <summary>
/// تطبيق Rate Limiting صارم على endpoint معين
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class StrictRateLimitAttribute : Attribute
{
    public int PermitLimit { get; }
    public int WindowSeconds { get; }

    public StrictRateLimitAttribute(int permitLimit = 10, int windowSeconds = 60)
    {
        PermitLimit = permitLimit;
        WindowSeconds = windowSeconds;
    }
}

/// <summary>
/// استثناء endpoint من Rate Limiting
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class ExcludeFromRateLimitAttribute : Attribute
{
}

#endregion

#region Usage Examples

/*
 * ========================================
 * كيفية الاستخدام - Usage Examples
 * ========================================
 *
 * 1. التسجيل في Program.cs:
 * ------------------------------------------
 * builder.Services.AddTenantRateLimiting(options =>
 * {
 *     options.FreePermitLimit = 100;
 *     options.BasicPermitLimit = 1000;
 *     options.ProPermitLimit = 5000;
 *     options.EnterprisePermitLimit = 50000;
 *     options.WindowMinutes = 1;
 * });
 *
 * app.UseTenantRateLimiting();
 *
 * 2. استخدام على Controller:
 * ------------------------------------------
 * [ApiController]
 * [EnableRateLimiting("TenantPolicy")]
 * public class EmployeesController : ControllerBase
 * {
 *     [HttpGet]
 *     public async Task<IActionResult> GetAll() { }
 *     
 *     [HttpPost("import")]
 *     [EnableRateLimiting("StrictPolicy")] // 10 requests/min
 *     public async Task<IActionResult> Import() { }
 *     
 *     [HttpGet("health")]
 *     [DisableRateLimiting]
 *     public IActionResult Health() => Ok();
 * }
 *
 * 3. Response Headers:
 * ------------------------------------------
 * X-RateLimit-Limit: 1000
 * X-RateLimit-Remaining: 950
 * X-RateLimit-Reset: 1706367600
 *
 * 4. عند تجاوز الحد:
 * ------------------------------------------
 * HTTP 429 Too Many Requests
 * Retry-After: 60
 * {
 *   "error": "RATE_LIMIT_EXCEEDED",
 *   "message": "تم تجاوز الحد المسموح من الطلبات",
 *   "retryAfterSeconds": 60
 * }
 */

#endregion
