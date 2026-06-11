namespace Masarat.Core.MultiTenancy;

/// <summary>
/// واجهة للوصول إلى معلومات المستأجر الحالي
/// Interface for accessing current tenant information
/// </summary>
public interface ITenantAccessor
{
    /// <summary>
    /// معرف المستأجر الحالي
    /// </summary>
    long? TenantId { get; }
    
    /// <summary>
    /// كود المستأجر الحالي
    /// </summary>
    string? TenantCode { get; }
    
    /// <summary>
    /// اسم المستأجر الحالي
    /// </summary>
    string? TenantName { get; }
    
    /// <summary>
    /// هل المستأجر صالح ونشط
    /// </summary>
    bool IsValidTenant { get; }
    
    /// <summary>
    /// خطة الاشتراك للمستأجر
    /// </summary>
    string? SubscriptionPlan { get; }
}

/// <summary>
/// واجهة موسعة لإدارة سياق المستأجر
/// </summary>
public interface ITenantContext : ITenantAccessor
{
    /// <summary>
    /// تعيين المستأجر الحالي (للاستخدام في Middleware)
    /// </summary>
    void SetTenant(TenantInfo tenant);
    
    /// <summary>
    /// مسح المستأجر الحالي
    /// </summary>
    void ClearTenant();
}

/// <summary>
/// معلومات المستأجر
/// </summary>
public class TenantInfo
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? SubscriptionPlan { get; set; }
    public bool IsActive { get; set; }
    public DateTime? SubscriptionExpiry { get; set; }
    public string? ConnectionString { get; set; }
    public Dictionary<string, object> Settings { get; set; } = new();
}

