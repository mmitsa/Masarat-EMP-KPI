namespace Masarat.Core.Domain;

/// <summary>
/// Base entity for all domain entities
/// SECURITY: All entities MUST include TenantId for proper isolation
/// </summary>
public abstract class BaseEntity
{
    public int Id { get; set; }
    
    /// <summary>
    /// SECURITY FIX: Tenant ID for multi-tenant isolation
    /// Prevents cross-tenant data access at database level
    /// </summary>
    public long TenantId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? LastModifiedAt { get; set; }
    public string? LastModifiedBy { get; set; }
    public bool IsDeleted { get; set; } = false;
    public string? CorrelationId { get; set; } // For distributed tracing

    /// <summary>
    /// رقم إصدار المزامنة - يزداد تلقائياً مع كل تعديل
    /// يُستخدم كـ cursor للمزامنة التفاضلية (Delta Sync)
    /// </summary>
    public long SyncVersion { get; set; }
}
