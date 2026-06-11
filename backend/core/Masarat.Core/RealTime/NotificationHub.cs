using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Masarat.Core.RealTime;

/// <summary>
/// SignalR Hub للإشعارات الفورية
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;
    private readonly IConnectionManager _connectionManager;

    public NotificationHub(
        ILogger<NotificationHub> logger,
        IConnectionManager connectionManager)
    {
        _logger = logger;
        _connectionManager = connectionManager;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var tenantId = GetTenantId();

        if (!string.IsNullOrEmpty(userId))
        {
            await _connectionManager.AddConnectionAsync(userId, Context.ConnectionId, tenantId);

            // Join user-specific group
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");

            // Join tenant group
            if (!string.IsNullOrEmpty(tenantId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"tenant:{tenantId}");
            }

            _logger.LogInformation(
                "User {UserId} connected. ConnectionId: {ConnectionId}, Tenant: {TenantId}",
                userId,
                Context.ConnectionId,
                tenantId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();

        if (!string.IsNullOrEmpty(userId))
        {
            await _connectionManager.RemoveConnectionAsync(userId, Context.ConnectionId);

            _logger.LogInformation(
                "User {UserId} disconnected. ConnectionId: {ConnectionId}",
                userId,
                Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// الانضمام لمجموعة معينة
    /// </summary>
    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        _logger.LogDebug("Connection {ConnectionId} joined group {Group}", Context.ConnectionId, groupName);
    }

    /// <summary>
    /// مغادرة مجموعة
    /// </summary>
    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        _logger.LogDebug("Connection {ConnectionId} left group {Group}", Context.ConnectionId, groupName);
    }

    /// <summary>
    /// تأكيد استلام إشعار
    /// </summary>
    public async Task AcknowledgeNotification(string notificationId)
    {
        var userId = GetUserId();
        await Clients.Caller.SendAsync("NotificationAcknowledged", notificationId);
        _logger.LogDebug("Notification {NotificationId} acknowledged by {UserId}", notificationId, userId);
    }

    /// <summary>
    /// تحديث حالة المستخدم (متصل، مشغول، إلخ)
    /// </summary>
    public async Task UpdateStatus(string status)
    {
        var userId = GetUserId();
        var tenantId = GetTenantId();

        await _connectionManager.UpdateStatusAsync(userId!, status);

        // Notify other users in the same tenant
        if (!string.IsNullOrEmpty(tenantId))
        {
            await Clients.Group($"tenant:{tenantId}")
                .SendAsync("UserStatusChanged", new { UserId = userId, Status = status });
        }
    }

    private string? GetUserId()
    {
        return Context.User?.FindFirst("sub")?.Value ??
               Context.User?.FindFirst("user_id")?.Value;
    }

    private string? GetTenantId()
    {
        return Context.User?.FindFirst("tenant_id")?.Value;
    }
}

/// <summary>
/// خدمة إرسال الإشعارات
/// </summary>
public interface INotificationService
{
    Task SendToUserAsync(string userId, string type, object data);
    Task SendToUsersAsync(IEnumerable<string> userIds, string type, object data);
    Task SendToTenantAsync(string tenantId, string type, object data);
    Task SendToGroupAsync(string groupName, string type, object data);
    Task SendToAllAsync(string type, object data);
    Task SendProgressUpdateAsync(string userId, string operationId, int progress, string? message = null);
}

public class NotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly IConnectionManager _connectionManager;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IHubContext<NotificationHub> hubContext,
        IConnectionManager connectionManager,
        ILogger<NotificationService> logger)
    {
        _hubContext = hubContext;
        _connectionManager = connectionManager;
        _logger = logger;
    }

    public async Task SendToUserAsync(string userId, string type, object data)
    {
        var notification = CreateNotification(type, data);
        await _hubContext.Clients.Group($"user:{userId}")
            .SendAsync("ReceiveNotification", notification);

        _logger.LogDebug("Notification sent to user {UserId}: {Type}", userId, type);
    }

    public async Task SendToUsersAsync(IEnumerable<string> userIds, string type, object data)
    {
        var notification = CreateNotification(type, data);
        var groups = userIds.Select(id => $"user:{id}").ToList();

        await _hubContext.Clients.Groups(groups)
            .SendAsync("ReceiveNotification", notification);

        _logger.LogDebug("Notification sent to {Count} users: {Type}", groups.Count, type);
    }

    public async Task SendToTenantAsync(string tenantId, string type, object data)
    {
        var notification = CreateNotification(type, data);
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("ReceiveNotification", notification);

        _logger.LogDebug("Notification sent to tenant {TenantId}: {Type}", tenantId, type);
    }

    public async Task SendToGroupAsync(string groupName, string type, object data)
    {
        var notification = CreateNotification(type, data);
        await _hubContext.Clients.Group(groupName)
            .SendAsync("ReceiveNotification", notification);

        _logger.LogDebug("Notification sent to group {Group}: {Type}", groupName, type);
    }

    public async Task SendToAllAsync(string type, object data)
    {
        var notification = CreateNotification(type, data);
        await _hubContext.Clients.All.SendAsync("ReceiveNotification", notification);

        _logger.LogDebug("Notification broadcast: {Type}", type);
    }

    public async Task SendProgressUpdateAsync(string userId, string operationId, int progress, string? message = null)
    {
        await _hubContext.Clients.Group($"user:{userId}")
            .SendAsync("ProgressUpdate", new
            {
                OperationId = operationId,
                Progress = progress,
                Message = message,
                Timestamp = DateTime.UtcNow
            });
    }

    private static NotificationMessage CreateNotification(string type, object data)
    {
        return new NotificationMessage
        {
            Id = Guid.NewGuid().ToString(),
            Type = type,
            Data = data,
            Timestamp = DateTime.UtcNow
        };
    }
}

public class NotificationMessage
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public object Data { get; set; } = new();
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// إدارة اتصالات المستخدمين
/// </summary>
public interface IConnectionManager
{
    Task AddConnectionAsync(string userId, string connectionId, string? tenantId);
    Task RemoveConnectionAsync(string userId, string connectionId);
    Task<IEnumerable<string>> GetConnectionsAsync(string userId);
    Task<bool> IsOnlineAsync(string userId);
    Task UpdateStatusAsync(string userId, string status);
    Task<string?> GetStatusAsync(string userId);
    Task<int> GetOnlineCountAsync(string? tenantId = null);
}

public class InMemoryConnectionManager : IConnectionManager
{
    private readonly Dictionary<string, HashSet<string>> _connections = new();
    private readonly Dictionary<string, string> _tenants = new();
    private readonly Dictionary<string, string> _statuses = new();
    private readonly SemaphoreSlim _lock = new(1, 1);

    public async Task AddConnectionAsync(string userId, string connectionId, string? tenantId)
    {
        await _lock.WaitAsync();
        try
        {
            if (!_connections.ContainsKey(userId))
            {
                _connections[userId] = new HashSet<string>();
            }
            _connections[userId].Add(connectionId);

            if (!string.IsNullOrEmpty(tenantId))
            {
                _tenants[userId] = tenantId;
            }

            _statuses[userId] = "online";
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task RemoveConnectionAsync(string userId, string connectionId)
    {
        await _lock.WaitAsync();
        try
        {
            if (_connections.TryGetValue(userId, out var connections))
            {
                connections.Remove(connectionId);
                if (connections.Count == 0)
                {
                    _connections.Remove(userId);
                    _statuses[userId] = "offline";
                }
            }
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<IEnumerable<string>> GetConnectionsAsync(string userId)
    {
        await _lock.WaitAsync();
        try
        {
            return _connections.TryGetValue(userId, out var connections)
                ? connections.ToList()
                : Enumerable.Empty<string>();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<bool> IsOnlineAsync(string userId)
    {
        await _lock.WaitAsync();
        try
        {
            return _connections.ContainsKey(userId) && _connections[userId].Count > 0;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task UpdateStatusAsync(string userId, string status)
    {
        await _lock.WaitAsync();
        try
        {
            _statuses[userId] = status;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<string?> GetStatusAsync(string userId)
    {
        await _lock.WaitAsync();
        try
        {
            return _statuses.TryGetValue(userId, out var status) ? status : null;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<int> GetOnlineCountAsync(string? tenantId = null)
    {
        await _lock.WaitAsync();
        try
        {
            if (string.IsNullOrEmpty(tenantId))
            {
                return _connections.Count;
            }

            return _connections.Keys
                .Count(userId => _tenants.TryGetValue(userId, out var t) && t == tenantId);
        }
        finally
        {
            _lock.Release();
        }
    }
}

/// <summary>
/// أنواع الإشعارات
/// </summary>
public static class NotificationTypes
{
    // System
    public const string SystemAlert = "system.alert";
    public const string SystemMaintenance = "system.maintenance";

    // HR
    public const string LeaveRequestSubmitted = "hr.leave.submitted";
    public const string LeaveRequestApproved = "hr.leave.approved";
    public const string LeaveRequestRejected = "hr.leave.rejected";
    public const string AttendanceReminder = "hr.attendance.reminder";

    // Warehouse
    public const string LowStockAlert = "warehouse.stock.low";
    public const string ItemReceived = "warehouse.item.received";
    public const string TransferCompleted = "warehouse.transfer.completed";

    // Archiving
    public const string DocumentUploaded = "archiving.document.uploaded";
    public const string ApprovalRequired = "archiving.approval.required";
    public const string AccessGranted = "archiving.access.granted";

    // Finance
    public const string PaymentReceived = "finance.payment.received";
    public const string InvoiceDue = "finance.invoice.due";

    // Tasks
    public const string TaskAssigned = "task.assigned";
    public const string TaskCompleted = "task.completed";
    public const string TaskOverdue = "task.overdue";
}

/// <summary>
/// Extension Methods
/// </summary>
public static class SignalRExtensions
{
    public static IServiceCollection AddMasaratRealTime(this IServiceCollection services)
    {
        services.AddSignalR(options =>
        {
            options.EnableDetailedErrors = true;
            options.KeepAliveInterval = TimeSpan.FromSeconds(15);
            options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
            options.MaximumReceiveMessageSize = 64 * 1024; // 64KB
        });

        services.AddSingleton<IConnectionManager, InMemoryConnectionManager>();
        services.AddScoped<INotificationService, NotificationService>();

        return services;
    }

    public static IEndpointRouteBuilder MapMasaratHub(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapHub<NotificationHub>("/hubs/notifications");
        return endpoints;
    }
}
