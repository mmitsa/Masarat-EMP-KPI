namespace Masarat.Core.Domain;

/// <summary>
/// سجل تتبع التغييرات للمزامنة - يُسجَّل تلقائياً عبر EF Core Interceptor
/// </summary>
public class SyncLog
{
    public long Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public required long TenantId { get; set; }
    public SyncOperationType OperationType { get; set; }
    public long SyncVersion { get; set; }
    public string? ChangedFields { get; set; } // JSON array of changed field names
    public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;
    public string? UserId { get; set; }
}

public enum SyncOperationType
{
    Created = 0,
    Updated = 1,
    SoftDeleted = 2,
    Restored = 3
}
