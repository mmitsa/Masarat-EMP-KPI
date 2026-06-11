using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Threading.RateLimiting;

namespace Masarat.Core.RateLimiting;

/// <summary>
/// تكوين Rate Limiting لكل مستأجر
/// </summary>
public static class TenantRateLimitingConfiguration
{
    /// <summary>
    /// إضافة Rate Limiting مع دعم متعدد المستأجرين
    /// </summary>
    public static IServiceCollection AddTenantRateLimiting(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var rateLimitConfig = configuration.GetSection("RateLimiting");

        services.AddRateLimiter(options =>
        {
            // Global rate limit
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                var tenantId = GetTenantId(context);

                return RateLimitPartition.GetSlidingWindowLimiter(
                    partitionKey: tenantId,
                    factory: _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = rateLimitConfig.GetValue("GlobalPermitLimit", 1000),
                        Window = TimeSpan.FromMinutes(1),
                        SegmentsPerWindow = 6,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = rateLimitConfig.GetValue("QueueLimit", 100)
                    });
            });

            // Per-tenant policy
            options.AddPolicy("PerTenant", context =>
            {
                var tenantId = GetTenantId(context);
                var tier = GetTenantTier(context);

                var (permitLimit, window) = tier switch
                {
                    "Enterprise" => (5000, TimeSpan.FromMinutes(1)),
                    "Professional" => (2000, TimeSpan.FromMinutes(1)),
                    "Standard" => (500, TimeSpan.FromMinutes(1)),
                    "Trial" => (100, TimeSpan.FromMinutes(1)),
                    _ => (200, TimeSpan.FromMinutes(1))
                };

                return RateLimitPartition.GetSlidingWindowLimiter(
                    partitionKey: tenantId,
                    factory: _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = permitLimit,
                        Window = window,
                        SegmentsPerWindow = 6,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 50
                    });
            });

            // Per-user policy
            options.AddPolicy("PerUser", context =>
            {
                var userId = context.User?.FindFirst("sub")?.Value ?? "anonymous";

                return RateLimitPartition.GetSlidingWindowLimiter(
                    partitionKey: userId,
                    factory: _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = rateLimitConfig.GetValue("PerUserPermitLimit", 100),
                        Window = TimeSpan.FromMinutes(1),
                        SegmentsPerWindow = 6,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 10
                    });
            });

            // API endpoint specific policies
            options.AddPolicy("AuthEndpoints", context =>
            {
                var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: ipAddress,
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,  // 10 login attempts per minute
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 5
                    });
            });

            options.AddPolicy("FileUpload", context =>
            {
                var tenantId = GetTenantId(context);

                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: tenantId,
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 50,  // 50 uploads per hour
                        Window = TimeSpan.FromHours(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 10
                    });
            });

            options.AddPolicy("ReportGeneration", context =>
            {
                var tenantId = GetTenantId(context);

                return RateLimitPartition.GetTokenBucketLimiter(
                    partitionKey: tenantId,
                    factory: _ => new TokenBucketRateLimiterOptions
                    {
                        TokenLimit = 10,
                        TokensPerPeriod = 2,
                        ReplenishmentPeriod = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 5
                    });
            });

            options.AddPolicy("BulkOperations", context =>
            {
                var tenantId = GetTenantId(context);

                return RateLimitPartition.GetConcurrencyLimiter(
                    partitionKey: tenantId,
                    factory: _ => new ConcurrencyLimiterOptions
                    {
                        PermitLimit = 3,  // Max 3 concurrent bulk operations
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 5
                    });
            });

            // Response customization
            options.OnRejected = async (context, cancellationToken) =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILogger<RateLimiterOptions>>();

                var tenantId = GetTenantId(context.HttpContext);
                var endpoint = context.HttpContext.Request.Path;

                logger.LogWarning(
                    "Rate limit exceeded for tenant {TenantId} on endpoint {Endpoint}. Retry after {RetryAfter}",
                    tenantId,
                    endpoint,
                    context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)
                        ? retryAfter
                        : TimeSpan.FromMinutes(1));

                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.HttpContext.Response.ContentType = "application/json; charset=utf-8";

                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retry))
                {
                    context.HttpContext.Response.Headers.RetryAfter = ((int)retry.TotalSeconds).ToString();
                }

                await context.HttpContext.Response.WriteAsJsonAsync(new
                {
                    error = "تم تجاوز الحد المسموح من الطلبات",
                    message = "Too many requests. Please try again later.",
                    retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var r)
                        ? (int)r.TotalSeconds
                        : 60
                }, cancellationToken);
            };
        });

        return services;
    }

    private static string GetTenantId(HttpContext context)
    {
        // Try to get tenant ID from header
        if (context.Request.Headers.TryGetValue("X-Tenant-Id", out var tenantHeader))
        {
            return tenantHeader.ToString();
        }

        // Try to get from claim
        var tenantClaim = context.User?.FindFirst("tenant_id")?.Value;
        if (!string.IsNullOrEmpty(tenantClaim))
        {
            return tenantClaim;
        }

        // Try to get from route
        if (context.Request.RouteValues.TryGetValue("tenantId", out var routeTenant))
        {
            return routeTenant?.ToString() ?? "default";
        }

        return "anonymous";
    }

    private static string GetTenantTier(HttpContext context)
    {
        // Get tenant tier from claim or header
        var tier = context.User?.FindFirst("tenant_tier")?.Value;
        if (!string.IsNullOrEmpty(tier))
        {
            return tier;
        }

        if (context.Request.Headers.TryGetValue("X-Tenant-Tier", out var tierHeader))
        {
            return tierHeader.ToString();
        }

        return "Standard";
    }
}

/// <summary>
/// Attribute للتطبيق على endpoints
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RateLimitPolicyAttribute : Attribute
{
    public string PolicyName { get; }

    public RateLimitPolicyAttribute(string policyName)
    {
        PolicyName = policyName;
    }
}

/// <summary>
/// Rate Limit Metrics للمراقبة
/// </summary>
public interface IRateLimitMetrics
{
    void RecordRejection(string tenantId, string endpoint);
    void RecordRequest(string tenantId, string endpoint);
    Task<RateLimitStats> GetStatsAsync(string tenantId);
}

public class RateLimitStats
{
    public string TenantId { get; set; } = string.Empty;
    public int TotalRequests { get; set; }
    public int RejectedRequests { get; set; }
    public double RejectionRate => TotalRequests > 0 ? (double)RejectedRequests / TotalRequests * 100 : 0;
    public DateTime Period { get; set; }
}
