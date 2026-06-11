using Masarat.Core.Domain;

namespace Masarat.Core.Services.Sync;

/// <summary>
/// استراتيجية حل التعارضات عند المزامنة
/// </summary>
public interface IConflictResolver
{
    ConflictResolution Resolve(string entityType, SyncPushItem clientChange, object? serverEntity);
}

public class ConflictResolver : IConflictResolver
{
    // Entity types where client wins
    private static readonly HashSet<string> _clientWinsEntities = new(StringComparer.OrdinalIgnoreCase)
    {
        "UserPreference", "UserSetting"
    };

    // Entity types where last-write wins
    private static readonly HashSet<string> _lastWriteWinsEntities = new(StringComparer.OrdinalIgnoreCase)
    {
        "Attendance"
    };

    public ConflictResolution Resolve(string entityType, SyncPushItem clientChange, object? serverEntity)
    {
        if (serverEntity is null)
            return new ConflictResolution { Action = ConflictAction.AcceptClient };

        if (_clientWinsEntities.Contains(entityType))
            return new ConflictResolution { Action = ConflictAction.AcceptClient };

        if (_lastWriteWinsEntities.Contains(entityType))
        {
            // Compare timestamps - more recent wins
            if (clientChange.ClientTimestamp > DateTimeOffset.UtcNow.AddMinutes(-1))
                return new ConflictResolution { Action = ConflictAction.AcceptClient };
        }

        // Default: Server wins, notify client
        return new ConflictResolution
        {
            Action = ConflictAction.AcceptServer,
            ServerVersion = serverEntity,
            Message = "تم تحديث هذا السجل من مصدر آخر. تم الاحتفاظ بنسخة الخادم."
        };
    }
}

public class ConflictResolution
{
    public ConflictAction Action { get; set; }
    public object? ServerVersion { get; set; }
    public string? Message { get; set; }
}

public enum ConflictAction
{
    AcceptClient,
    AcceptServer,
    RequireManualResolution
}

/// <summary>
/// عنصر مُرسل من العميل للمزامنة
/// </summary>
public class SyncPushItem
{
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public long ClientSyncVersion { get; set; }
    public DateTimeOffset ClientTimestamp { get; set; }
    public string OperationType { get; set; } = "Updated";
    public Dictionary<string, object?> Data { get; set; } = new();
}
