using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.IO;
using Serilog.Context;
using System.Diagnostics;
using System.Text;
using System.Text.Json;

namespace Masarat.Core.Middleware;

/// <summary>
/// Middleware لتسجيل الطلبات والاستجابات بشكل تفصيلي
/// </summary>
public class RequestResponseLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestResponseLoggingMiddleware> _logger;
    private readonly RecyclableMemoryStreamManager _streamManager;
    private readonly RequestResponseLoggingOptions _options;

    public RequestResponseLoggingMiddleware(
        RequestDelegate next,
        ILogger<RequestResponseLoggingMiddleware> logger,
        RequestResponseLoggingOptions? options = null)
    {
        _next = next;
        _logger = logger;
        _streamManager = new RecyclableMemoryStreamManager();
        _options = options ?? new RequestResponseLoggingOptions();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip logging for excluded paths
        if (ShouldSkip(context.Request.Path))
        {
            await _next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();
        var requestLog = await LogRequest(context);

        // Replace response body stream to capture response
        var originalBodyStream = context.Response.Body;
        await using var responseBody = _streamManager.GetStream();
        context.Response.Body = responseBody;

        Exception? exception = null;

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            exception = ex;
            throw;
        }
        finally
        {
            stopwatch.Stop();

            // Log response
            await LogResponse(context, responseBody, requestLog, stopwatch.Elapsed, exception);

            // Copy response back to original stream
            responseBody.Seek(0, SeekOrigin.Begin);
            await responseBody.CopyToAsync(originalBodyStream);
        }
    }

    private async Task<RequestLogEntry> LogRequest(HttpContext context)
    {
        var request = context.Request;

        // Read request body
        request.EnableBuffering();
        string requestBody = string.Empty;

        if (_options.LogRequestBody && request.ContentLength > 0)
        {
            using var reader = new StreamReader(
                request.Body,
                Encoding.UTF8,
                detectEncodingFromByteOrderMarks: false,
                bufferSize: 1024,
                leaveOpen: true);

            requestBody = await reader.ReadToEndAsync();
            request.Body.Position = 0;

            // Mask sensitive data
            requestBody = MaskSensitiveData(requestBody);

            // Truncate if too large
            if (requestBody.Length > _options.MaxBodyLength)
            {
                requestBody = requestBody[.._options.MaxBodyLength] + "...[TRUNCATED]";
            }
        }

        var logEntry = new RequestLogEntry
        {
            Timestamp = DateTime.UtcNow,
            CorrelationId = context.GetCorrelationId(),
            RequestId = context.GetRequestId(),
            Method = request.Method,
            Path = request.Path,
            QueryString = request.QueryString.ToString(),
            Headers = GetFilteredHeaders(request.Headers),
            Body = requestBody,
            ContentType = request.ContentType,
            ContentLength = request.ContentLength,
            UserId = context.User?.FindFirst("sub")?.Value,
            TenantId = request.Headers["X-Tenant-Id"].FirstOrDefault(),
            IpAddress = context.Connection.RemoteIpAddress?.ToString(),
            UserAgent = request.Headers["User-Agent"].FirstOrDefault()
        };

        if (_options.LogRequestDetails)
        {
            using (LogContext.PushProperty("RequestBody", requestBody))
            {
                _logger.LogInformation(
                    "HTTP Request: {Method} {Path}{QueryString} | User: {UserId} | Tenant: {TenantId} | IP: {IpAddress}",
                    logEntry.Method,
                    logEntry.Path,
                    logEntry.QueryString,
                    logEntry.UserId ?? "anonymous",
                    logEntry.TenantId ?? "unknown",
                    logEntry.IpAddress);
            }
        }

        return logEntry;
    }

    private async Task LogResponse(
        HttpContext context,
        MemoryStream responseBody,
        RequestLogEntry requestLog,
        TimeSpan elapsed,
        Exception? exception)
    {
        responseBody.Seek(0, SeekOrigin.Begin);

        string responseBodyText = string.Empty;
        if (_options.LogResponseBody && responseBody.Length > 0)
        {
            using var reader = new StreamReader(responseBody, Encoding.UTF8, leaveOpen: true);
            responseBodyText = await reader.ReadToEndAsync();
            responseBody.Seek(0, SeekOrigin.Begin);

            // Mask sensitive data
            responseBodyText = MaskSensitiveData(responseBodyText);

            // Truncate if too large
            if (responseBodyText.Length > _options.MaxBodyLength)
            {
                responseBodyText = responseBodyText[.._options.MaxBodyLength] + "...[TRUNCATED]";
            }
        }

        var responseLog = new ResponseLogEntry
        {
            Timestamp = DateTime.UtcNow,
            CorrelationId = requestLog.CorrelationId,
            RequestId = requestLog.RequestId,
            StatusCode = context.Response.StatusCode,
            Headers = GetFilteredHeaders(context.Response.Headers),
            Body = responseBodyText,
            ContentType = context.Response.ContentType,
            ContentLength = responseBody.Length,
            DurationMs = elapsed.TotalMilliseconds,
            Exception = exception?.Message
        };

        // Log based on status code
        using (LogContext.PushProperty("ResponseBody", responseBodyText))
        using (LogContext.PushProperty("DurationMs", elapsed.TotalMilliseconds))
        {
            if (exception != null)
            {
                _logger.LogError(exception,
                    "HTTP Response: {Method} {Path} | Status: {StatusCode} | Duration: {DurationMs}ms | Error: {Error}",
                    requestLog.Method,
                    requestLog.Path,
                    responseLog.StatusCode,
                    responseLog.DurationMs,
                    exception.Message);
            }
            else if (responseLog.StatusCode >= 500)
            {
                _logger.LogError(
                    "HTTP Response: {Method} {Path} | Status: {StatusCode} | Duration: {DurationMs}ms | Server Error",
                    requestLog.Method,
                    requestLog.Path,
                    responseLog.StatusCode,
                    responseLog.DurationMs);
            }
            else if (responseLog.StatusCode >= 400)
            {
                _logger.LogWarning(
                    "HTTP Response: {Method} {Path} | Status: {StatusCode} | Duration: {DurationMs}ms | Client Error",
                    requestLog.Method,
                    requestLog.Path,
                    responseLog.StatusCode,
                    responseLog.DurationMs);
            }
            else if (elapsed.TotalMilliseconds > _options.SlowRequestThresholdMs)
            {
                _logger.LogWarning(
                    "HTTP Response (SLOW): {Method} {Path} | Status: {StatusCode} | Duration: {DurationMs}ms",
                    requestLog.Method,
                    requestLog.Path,
                    responseLog.StatusCode,
                    responseLog.DurationMs);
            }
            else
            {
                _logger.LogInformation(
                    "HTTP Response: {Method} {Path} | Status: {StatusCode} | Duration: {DurationMs}ms",
                    requestLog.Method,
                    requestLog.Path,
                    responseLog.StatusCode,
                    responseLog.DurationMs);
            }
        }
    }

    private bool ShouldSkip(PathString path)
    {
        var pathValue = path.Value?.ToLower() ?? "";
        return _options.ExcludePaths.Any(p => pathValue.Contains(p.ToLower()));
    }

    private Dictionary<string, string> GetFilteredHeaders(IHeaderDictionary headers)
    {
        var result = new Dictionary<string, string>();

        foreach (var header in headers)
        {
            if (_options.SensitiveHeaders.Contains(header.Key, StringComparer.OrdinalIgnoreCase))
            {
                result[header.Key] = "[REDACTED]";
            }
            else
            {
                result[header.Key] = header.Value.ToString();
            }
        }

        return result;
    }

    private string MaskSensitiveData(string data)
    {
        if (string.IsNullOrEmpty(data)) return data;

        foreach (var field in _options.SensitiveFields)
        {
            // Mask JSON fields
            data = System.Text.RegularExpressions.Regex.Replace(
                data,
                $@"""{field}""\s*:\s*""[^""]*""",
                $@"""{field}"": ""[REDACTED]""",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        }

        return data;
    }
}

/// <summary>
/// خيارات تسجيل الطلبات والاستجابات
/// </summary>
public class RequestResponseLoggingOptions
{
    public bool LogRequestBody { get; set; } = true;
    public bool LogResponseBody { get; set; } = true;
    public bool LogRequestDetails { get; set; } = true;
    public int MaxBodyLength { get; set; } = 32000;
    public int SlowRequestThresholdMs { get; set; } = 1000;

    public List<string> ExcludePaths { get; set; } = new()
    {
        "/health",
        "/metrics",
        "/swagger",
        "/favicon.ico",
        "/_framework",
        "/signalr"
    };

    public List<string> SensitiveHeaders { get; set; } = new()
    {
        "Authorization",
        "Cookie",
        "Set-Cookie",
        "X-Api-Key"
    };

    public List<string> SensitiveFields { get; set; } = new()
    {
        "password",
        "token",
        "secret",
        "apiKey",
        "api_key",
        "accessToken",
        "access_token",
        "refreshToken",
        "refresh_token",
        "creditCard",
        "credit_card",
        "cvv",
        "ssn",
        "nationalId",
        "national_id"
    };
}

/// <summary>
/// نموذج سجل الطلب
/// </summary>
public class RequestLogEntry
{
    public DateTime Timestamp { get; set; }
    public string CorrelationId { get; set; } = string.Empty;
    public string RequestId { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string QueryString { get; set; } = string.Empty;
    public Dictionary<string, string> Headers { get; set; } = new();
    public string Body { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public long? ContentLength { get; set; }
    public string? UserId { get; set; }
    public string? TenantId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}

/// <summary>
/// نموذج سجل الاستجابة
/// </summary>
public class ResponseLogEntry
{
    public DateTime Timestamp { get; set; }
    public string CorrelationId { get; set; } = string.Empty;
    public string RequestId { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public Dictionary<string, string> Headers { get; set; } = new();
    public string Body { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public long ContentLength { get; set; }
    public double DurationMs { get; set; }
    public string? Exception { get; set; }
}

/// <summary>
/// Extension methods
/// </summary>
public static class RequestResponseLoggingExtensions
{
    public static IApplicationBuilder UseRequestResponseLogging(
        this IApplicationBuilder app,
        Action<RequestResponseLoggingOptions>? configure = null)
    {
        var options = new RequestResponseLoggingOptions();
        configure?.Invoke(options);
        return app.UseMiddleware<RequestResponseLoggingMiddleware>(options);
    }
}
