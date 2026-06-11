using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Masarat.Core.Services;

/// <summary>
/// Audit Event - حدث المراجعة
/// </summary>
public record AuditEvent
{
    public string EventId { get; init; } = Guid.NewGuid().ToString();
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    public int? UserId { get; init; }
    public string? UserName { get; init; }
    public string? TenantId { get; init; }
    public string Action { get; init; } = string.Empty;
    public string EntityType { get; init; } = string.Empty;
    public string? EntityId { get; init; }
    public string? IpAddress { get; init; }
    public string? UserAgent { get; init; }
    public string? RequestPath { get; init; }
    public string? RequestMethod { get; init; }
    public object? OldValues { get; init; }
    public object? NewValues { get; init; }
    public bool Success { get; init; } = true;
    public string? ErrorMessage { get; init; }
    public Dictionary<string, object>? Metadata { get; init; }
}

/// <summary>
/// Audit Actions - أنواع العمليات
/// </summary>
public static class AuditActions
{
    // Authentication
    public const string LOGIN = "LOGIN";
    public const string LOGOUT = "LOGOUT";
    public const string LOGIN_FAILED = "LOGIN_FAILED";
    public const string PASSWORD_CHANGED = "PASSWORD_CHANGED";
    public const string TOKEN_REFRESHED = "TOKEN_REFRESHED";

    // CRUD Operations
    public const string CREATE = "CREATE";
    public const string READ = "READ";
    public const string UPDATE = "UPDATE";
    public const string DELETE = "DELETE";
    public const string SOFT_DELETE = "SOFT_DELETE";
    public const string RESTORE = "RESTORE";

    // Approvals
    public const string APPROVE = "APPROVE";
    public const string REJECT = "REJECT";
    public const string RETURN = "RETURN";
    public const string DELEGATE = "DELEGATE";

    // Security
    public const string PERMISSION_GRANTED = "PERMISSION_GRANTED";
    public const string PERMISSION_REVOKED = "PERMISSION_REVOKED";
    public const string ROLE_ASSIGNED = "ROLE_ASSIGNED";
    public const string ROLE_REMOVED = "ROLE_REMOVED";
    public const string ACCESS_DENIED = "ACCESS_DENIED";

    // Data Export
    public const string EXPORT = "EXPORT";
    public const string PRINT = "PRINT";
    public const string DOWNLOAD = "DOWNLOAD";
}

/// <summary>
/// Audit Logger Interface - واجهة مسجل المراجعة
/// </summary>
public interface IAuditLogger
{
    Task LogAsync(AuditEvent auditEvent);
    Task LogAsync(int? userId, string action, string entityType, string? entityId = null, object? metadata = null);
    Task LogSuccessAsync(int? userId, string action, string entityType, string? entityId = null);
    Task LogFailureAsync(int? userId, string action, string entityType, string? entityId = null, string? error = null);
}

/// <summary>
/// Audit Logger Implementation - تنفيذ مسجل المراجعة
/// </summary>
public class AuditLogger : IAuditLogger
{
    private readonly ILogger<AuditLogger> _logger;
    private readonly IHttpContextAccessor? _httpContextAccessor;

    public AuditLogger(ILogger<AuditLogger> logger, IHttpContextAccessor? httpContextAccessor = null)
    {
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(AuditEvent auditEvent)
    {
        // Enrich with HTTP context if available
        if (_httpContextAccessor?.HttpContext != null)
        {
            var context = _httpContextAccessor.HttpContext;
            auditEvent = auditEvent with
            {
                IpAddress = auditEvent.IpAddress ?? context.Connection.RemoteIpAddress?.ToString(),
                UserAgent = auditEvent.UserAgent ?? context.Request.Headers["User-Agent"].ToString(),
                RequestPath = auditEvent.RequestPath ?? context.Request.Path.Value,
                RequestMethod = auditEvent.RequestMethod ?? context.Request.Method
            };
        }

        // Log structured event
        var logLevel = auditEvent.Success ? LogLevel.Information : LogLevel.Warning;

        _logger.Log(logLevel,
            "AUDIT: {Action} on {EntityType}/{EntityId} by User {UserId} from {IpAddress} - Success: {Success}",
            auditEvent.Action,
            auditEvent.EntityType,
            auditEvent.EntityId ?? "N/A",
            auditEvent.UserId?.ToString() ?? "Anonymous",
            auditEvent.IpAddress ?? "Unknown",
            auditEvent.Success);

        // In production, you would also:
        // 1. Write to a dedicated audit database table
        // 2. Send to a SIEM system
        // 3. Write to an append-only log file

        // Serialize for detailed logging
        if (_logger.IsEnabled(LogLevel.Debug))
        {
            var json = JsonSerializer.Serialize(auditEvent, new JsonSerializerOptions
            {
                WriteIndented = false,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            _logger.LogDebug("AUDIT_DETAIL: {AuditEventJson}", json);
        }

        await Task.CompletedTask;
    }

    public async Task LogAsync(int? userId, string action, string entityType, string? entityId = null, object? metadata = null)
    {
        var auditEvent = new AuditEvent
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Metadata = metadata != null ? new Dictionary<string, object> { ["data"] = metadata } : null,
            Success = true
        };

        await LogAsync(auditEvent);
    }

    public async Task LogSuccessAsync(int? userId, string action, string entityType, string? entityId = null)
    {
        await LogAsync(userId, action, entityType, entityId);
    }

    public async Task LogFailureAsync(int? userId, string action, string entityType, string? entityId = null, string? error = null)
    {
        var auditEvent = new AuditEvent
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Success = false,
            ErrorMessage = error
        };

        await LogAsync(auditEvent);
    }
}

/// <summary>
/// Extension methods for registering AuditLogger
/// </summary>
public static class AuditLoggerExtensions
{
    public static IServiceCollection AddAuditLogging(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<IAuditLogger, AuditLogger>();
        return services;
    }
}
