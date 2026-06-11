using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace Masarat.Core.Metrics;

/// <summary>
/// Middleware لتسجيل مقاييس Prometheus لجميع الطلبات
/// </summary>
public class PrometheusMetricsMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<PrometheusMetricsMiddleware> _logger;
    private readonly string _serviceName;

    // Metrics instruments
    private static readonly Meter _meter = new("Masarat.API", "1.0.0");

    // Counter for total requests
    private static readonly Counter<long> _requestCounter = _meter.CreateCounter<long>(
        "http_server_requests_total",
        "requests",
        "Total number of HTTP requests");

    // Histogram for request duration
    private static readonly Histogram<double> _requestDuration = _meter.CreateHistogram<double>(
        "http_server_request_duration_seconds",
        "seconds",
        "HTTP request duration in seconds");

    // Counter for errors
    private static readonly Counter<long> _errorCounter = _meter.CreateCounter<long>(
        "http_server_errors_total",
        "errors",
        "Total number of HTTP errors");

    // Gauge for active requests
    private static int _activeRequests = 0;
    private static readonly ObservableGauge<int> _activeRequestsGauge = _meter.CreateObservableGauge(
        "http_server_active_requests",
        () => _activeRequests,
        "requests",
        "Number of active HTTP requests");

    // Counter for rate limiting
    private static readonly Counter<long> _rateLimitCounter = _meter.CreateCounter<long>(
        "http_server_rate_limit_exceeded_total",
        "requests",
        "Total number of rate limited requests");

    // Histogram for response size
    private static readonly Histogram<long> _responseSizeHistogram = _meter.CreateHistogram<long>(
        "http_server_response_size_bytes",
        "bytes",
        "HTTP response size in bytes");

    public PrometheusMetricsMiddleware(
        RequestDelegate next,
        ILogger<PrometheusMetricsMiddleware> logger,
        string serviceName)
    {
        _next = next;
        _logger = logger;
        _serviceName = serviceName;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip metrics endpoint itself to avoid recursion
        if (context.Request.Path.StartsWithSegments("/metrics"))
        {
            await _next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();
        Interlocked.Increment(ref _activeRequests);

        try
        {
            await _next(context);
            stopwatch.Stop();

            RecordMetrics(context, stopwatch.Elapsed.TotalSeconds);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            RecordError(context, ex, stopwatch.Elapsed.TotalSeconds);
            throw;
        }
        finally
        {
            Interlocked.Decrement(ref _activeRequests);
        }
    }

    private void RecordMetrics(HttpContext context, double durationSeconds)
    {
        var tags = CreateTags(context);

        // Record request count
        _requestCounter.Add(1, tags);

        // Record duration
        _requestDuration.Record(durationSeconds, tags);

        // Record response size if available
        if (context.Response.ContentLength.HasValue)
        {
            _responseSizeHistogram.Record(context.Response.ContentLength.Value, tags);
        }

        // Record errors (4xx and 5xx)
        if (context.Response.StatusCode >= 400)
        {
            _errorCounter.Add(1, tags);
        }

        // Record rate limiting
        if (context.Response.StatusCode == 429)
        {
            _rateLimitCounter.Add(1, tags);
        }
    }

    private void RecordError(HttpContext context, Exception ex, double durationSeconds)
    {
        var tags = CreateTags(context);

        _requestCounter.Add(1, tags);
        _requestDuration.Record(durationSeconds, tags);
        _errorCounter.Add(1, tags);

        _logger.LogError(ex, "Request failed: {Method} {Path}",
            context.Request.Method,
            context.Request.Path);
    }

    private KeyValuePair<string, object?>[] CreateTags(HttpContext context)
    {
        return new[]
        {
            new KeyValuePair<string, object?>("service", _serviceName),
            new KeyValuePair<string, object?>("method", context.Request.Method),
            new KeyValuePair<string, object?>("endpoint", GetNormalizedEndpoint(context.Request.Path)),
            new KeyValuePair<string, object?>("status_code", context.Response.StatusCode.ToString()),
            new KeyValuePair<string, object?>("tenant_id", context.Request.Headers["X-Tenant-Id"].FirstOrDefault() ?? "unknown")
        };
    }

    private static string GetNormalizedEndpoint(PathString path)
    {
        // Normalize paths by replacing IDs with placeholders
        var normalizedPath = path.Value ?? "/";

        // Replace GUIDs
        normalizedPath = System.Text.RegularExpressions.Regex.Replace(
            normalizedPath,
            @"[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}",
            "{id}");

        // Replace numeric IDs
        normalizedPath = System.Text.RegularExpressions.Regex.Replace(
            normalizedPath,
            @"/\d+",
            "/{id}");

        return normalizedPath;
    }
}

/// <summary>
/// Extension methods for adding Prometheus metrics middleware
/// </summary>
public static class PrometheusMetricsExtensions
{
    /// <summary>
    /// إضافة Middleware لتسجيل مقاييس Prometheus
    /// </summary>
    public static IApplicationBuilder UsePrometheusMetrics(
        this IApplicationBuilder app,
        string serviceName)
    {
        return app.UseMiddleware<PrometheusMetricsMiddleware>(serviceName);
    }
}

/// <summary>
/// Custom metrics for business-specific tracking
/// </summary>
public static class BusinessMetrics
{
    private static readonly Meter _meter = new("Masarat.Business", "1.0.0");

    // Document operations
    private static readonly Counter<long> _documentUploads = _meter.CreateCounter<long>(
        "masarat_document_uploads_total",
        "documents",
        "Total document uploads");

    private static readonly Counter<long> _documentDownloads = _meter.CreateCounter<long>(
        "masarat_document_downloads_total",
        "documents",
        "Total document downloads");

    // Authentication
    private static readonly Counter<long> _loginAttempts = _meter.CreateCounter<long>(
        "masarat_login_attempts_total",
        "attempts",
        "Total login attempts");

    private static readonly Counter<long> _loginFailures = _meter.CreateCounter<long>(
        "masarat_login_failures_total",
        "failures",
        "Total login failures");

    // Approval workflow
    private static readonly Counter<long> _approvalRequests = _meter.CreateCounter<long>(
        "masarat_approval_requests_total",
        "requests",
        "Total approval requests");

    private static readonly Histogram<double> _approvalDuration = _meter.CreateHistogram<double>(
        "masarat_approval_duration_hours",
        "hours",
        "Approval process duration in hours");

    // SaaS metrics
    private static readonly Counter<long> _tenantRegistrations = _meter.CreateCounter<long>(
        "masarat_tenant_registrations_total",
        "registrations",
        "Total tenant registrations");

    private static readonly Counter<long> _subscriptionChanges = _meter.CreateCounter<long>(
        "masarat_subscription_changes_total",
        "changes",
        "Total subscription changes");

    // Methods to record metrics
    public static void RecordDocumentUpload(string tenantId, string documentType)
    {
        _documentUploads.Add(1,
            new KeyValuePair<string, object?>("tenant_id", tenantId),
            new KeyValuePair<string, object?>("document_type", documentType));
    }

    public static void RecordDocumentDownload(string tenantId, string documentType)
    {
        _documentDownloads.Add(1,
            new KeyValuePair<string, object?>("tenant_id", tenantId),
            new KeyValuePair<string, object?>("document_type", documentType));
    }

    public static void RecordLoginAttempt(bool success, string? reason = null)
    {
        _loginAttempts.Add(1,
            new KeyValuePair<string, object?>("success", success.ToString().ToLower()));

        if (!success)
        {
            _loginFailures.Add(1,
                new KeyValuePair<string, object?>("reason", reason ?? "unknown"));
        }
    }

    public static void RecordApprovalRequest(string requestType, string confidentialityLevel)
    {
        _approvalRequests.Add(1,
            new KeyValuePair<string, object?>("request_type", requestType),
            new KeyValuePair<string, object?>("confidentiality_level", confidentialityLevel));
    }

    public static void RecordApprovalDuration(double hours, string requestType, string outcome)
    {
        _approvalDuration.Record(hours,
            new KeyValuePair<string, object?>("request_type", requestType),
            new KeyValuePair<string, object?>("outcome", outcome));
    }

    public static void RecordTenantRegistration(string plan)
    {
        _tenantRegistrations.Add(1,
            new KeyValuePair<string, object?>("plan", plan));
    }

    public static void RecordSubscriptionChange(string changeType, string fromPlan, string toPlan)
    {
        _subscriptionChanges.Add(1,
            new KeyValuePair<string, object?>("change_type", changeType),
            new KeyValuePair<string, object?>("from_plan", fromPlan),
            new KeyValuePair<string, object?>("to_plan", toPlan));
    }
}

/// <summary>
/// Database metrics tracking
/// </summary>
public static class DatabaseMetrics
{
    private static readonly Meter _meter = new("Masarat.Database", "1.0.0");

    private static readonly Histogram<double> _queryDuration = _meter.CreateHistogram<double>(
        "masarat_db_query_duration_seconds",
        "seconds",
        "Database query duration");

    private static readonly Counter<long> _queryCount = _meter.CreateCounter<long>(
        "masarat_db_queries_total",
        "queries",
        "Total database queries");

    private static readonly Counter<long> _connectionErrors = _meter.CreateCounter<long>(
        "masarat_db_connection_errors_total",
        "errors",
        "Database connection errors");

    public static void RecordQuery(string queryType, string database, double durationSeconds)
    {
        _queryCount.Add(1,
            new KeyValuePair<string, object?>("query_type", queryType),
            new KeyValuePair<string, object?>("database", database));

        _queryDuration.Record(durationSeconds,
            new KeyValuePair<string, object?>("query_type", queryType),
            new KeyValuePair<string, object?>("database", database));
    }

    public static void RecordConnectionError(string database, string errorType)
    {
        _connectionErrors.Add(1,
            new KeyValuePair<string, object?>("database", database),
            new KeyValuePair<string, object?>("error_type", errorType));
    }
}
