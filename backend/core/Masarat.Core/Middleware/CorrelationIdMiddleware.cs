using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Serilog.Context;
using System.Diagnostics;

namespace Masarat.Core.Middleware;

/// <summary>
/// Middleware لإدارة Correlation IDs عبر جميع الطلبات
/// يربط جميع السجلات والتتبعات لطلب واحد
/// </summary>
public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CorrelationIdMiddleware> _logger;

    public const string CorrelationIdHeader = "X-Correlation-Id";
    public const string RequestIdHeader = "X-Request-Id";
    public const string CausationIdHeader = "X-Causation-Id";

    public CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Get or generate correlation ID
        var correlationId = GetOrGenerateCorrelationId(context);
        var requestId = Guid.NewGuid().ToString("N");
        var causationId = GetCausationId(context) ?? correlationId;

        // Store in HttpContext items for access throughout the request
        context.Items["CorrelationId"] = correlationId;
        context.Items["RequestId"] = requestId;
        context.Items["CausationId"] = causationId;

        // Add to response headers
        context.Response.OnStarting(() =>
        {
            context.Response.Headers.TryAdd(CorrelationIdHeader, correlationId);
            context.Response.Headers.TryAdd(RequestIdHeader, requestId);
            return Task.CompletedTask;
        });

        // Set Activity tags for OpenTelemetry
        Activity.Current?.SetTag("correlation_id", correlationId);
        Activity.Current?.SetTag("request_id", requestId);
        Activity.Current?.SetTag("causation_id", causationId);

        // Add to Serilog LogContext
        using (LogContext.PushProperty("CorrelationId", correlationId))
        using (LogContext.PushProperty("RequestId", requestId))
        using (LogContext.PushProperty("CausationId", causationId))
        using (LogContext.PushProperty("TenantId", GetTenantId(context)))
        using (LogContext.PushProperty("UserId", GetUserId(context)))
        {
            _logger.LogDebug(
                "Request started: {Method} {Path} | CorrelationId: {CorrelationId}",
                context.Request.Method,
                context.Request.Path,
                correlationId);

            try
            {
                await _next(context);

                _logger.LogDebug(
                    "Request completed: {Method} {Path} | Status: {StatusCode} | CorrelationId: {CorrelationId}",
                    context.Request.Method,
                    context.Request.Path,
                    context.Response.StatusCode,
                    correlationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Request failed: {Method} {Path} | CorrelationId: {CorrelationId}",
                    context.Request.Method,
                    context.Request.Path,
                    correlationId);
                throw;
            }
        }
    }

    private static string GetOrGenerateCorrelationId(HttpContext context)
    {
        // Check request header
        if (context.Request.Headers.TryGetValue(CorrelationIdHeader, out StringValues correlationId) &&
            !StringValues.IsNullOrEmpty(correlationId))
        {
            return correlationId.ToString();
        }

        // Check trace ID from OpenTelemetry
        var traceId = Activity.Current?.TraceId.ToString();
        if (!string.IsNullOrEmpty(traceId))
        {
            return traceId;
        }

        // Generate new
        return Guid.NewGuid().ToString("N");
    }

    private static string? GetCausationId(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue(CausationIdHeader, out StringValues causationId) &&
            !StringValues.IsNullOrEmpty(causationId))
        {
            return causationId.ToString();
        }
        return null;
    }

    private static string GetTenantId(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue("X-Tenant-Id", out var tenantId))
        {
            return tenantId.ToString();
        }
        return context.User?.FindFirst("tenant_id")?.Value ?? "unknown";
    }

    private static string GetUserId(HttpContext context)
    {
        return context.User?.FindFirst("sub")?.Value ??
               context.User?.FindFirst("user_id")?.Value ??
               "anonymous";
    }
}

/// <summary>
/// Extension methods للوصول إلى Correlation IDs
/// </summary>
public static class CorrelationIdExtensions
{
    /// <summary>
    /// الحصول على Correlation ID من HttpContext
    /// </summary>
    public static string GetCorrelationId(this HttpContext context)
    {
        if (context.Items.TryGetValue("CorrelationId", out var correlationId))
        {
            return correlationId?.ToString() ?? Guid.NewGuid().ToString("N");
        }
        return Activity.Current?.TraceId.ToString() ?? Guid.NewGuid().ToString("N");
    }

    /// <summary>
    /// الحصول على Request ID من HttpContext
    /// </summary>
    public static string GetRequestId(this HttpContext context)
    {
        if (context.Items.TryGetValue("RequestId", out var requestId))
        {
            return requestId?.ToString() ?? Guid.NewGuid().ToString("N");
        }
        return Guid.NewGuid().ToString("N");
    }

    /// <summary>
    /// الحصول على Causation ID من HttpContext
    /// </summary>
    public static string GetCausationId(this HttpContext context)
    {
        if (context.Items.TryGetValue("CausationId", out var causationId))
        {
            return causationId?.ToString() ?? context.GetCorrelationId();
        }
        return context.GetCorrelationId();
    }
}

/// <summary>
/// HTTP Client Handler لنشر Correlation IDs في الطلبات الصادرة
/// </summary>
public class CorrelationIdDelegatingHandler : DelegatingHandler
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CorrelationIdDelegatingHandler(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var context = _httpContextAccessor.HttpContext;

        if (context != null)
        {
            // Propagate correlation ID
            var correlationId = context.GetCorrelationId();
            request.Headers.TryAddWithoutValidation(CorrelationIdMiddleware.CorrelationIdHeader, correlationId);

            // Set causation ID as current request's correlation ID
            var causationId = context.GetRequestId();
            request.Headers.TryAddWithoutValidation(CorrelationIdMiddleware.CausationIdHeader, causationId);

            // Propagate tenant ID
            if (context.Request.Headers.TryGetValue("X-Tenant-Id", out var tenantId))
            {
                request.Headers.TryAddWithoutValidation("X-Tenant-Id", tenantId.ToString());
            }
        }
        else
        {
            // Generate new correlation ID if no context
            request.Headers.TryAddWithoutValidation(
                CorrelationIdMiddleware.CorrelationIdHeader,
                Activity.Current?.TraceId.ToString() ?? Guid.NewGuid().ToString("N"));
        }

        return await base.SendAsync(request, cancellationToken);
    }
}

/// <summary>
/// Service Collection Extensions
/// </summary>
public static class CorrelationIdServiceExtensions
{
    public static IServiceCollection AddCorrelationId(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddTransient<CorrelationIdDelegatingHandler>();
        return services;
    }

    public static IHttpClientBuilder AddCorrelationIdForwarding(this IHttpClientBuilder builder)
    {
        return builder.AddHttpMessageHandler<CorrelationIdDelegatingHandler>();
    }
}

/// <summary>
/// Application Builder Extensions
/// </summary>
public static class CorrelationIdApplicationExtensions
{
    public static IApplicationBuilder UseCorrelationId(this IApplicationBuilder app)
    {
        return app.UseMiddleware<CorrelationIdMiddleware>();
    }
}
