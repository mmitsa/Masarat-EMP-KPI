using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Masarat.Core.MultiTenancy;

/// <summary>
/// تنفيذ خدمة الوصول للمستأجر الحالي
/// Implementation of current tenant accessor service
/// </summary>
public class TenantAccessor : ITenantContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly bool _requireTenant;
    private TenantInfo? _currentTenant;

    public TenantAccessor(IHttpContextAccessor httpContextAccessor, IConfiguration? configuration = null)
    {
        _httpContextAccessor = httpContextAccessor;
        // في بيئة الإنتاج: لا يوجد Default TenantId - يجب تحديد المستأجر صراحة
        // في بيئة التطوير: يمكن استخدام Default TenantId = 1
        var environment = configuration?["ASPNETCORE_ENVIRONMENT"]
            ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? "Development";
        _requireTenant = !environment.Equals("Development", StringComparison.OrdinalIgnoreCase);
    }

    public long? TenantId
    {
        get
        {
            // أولاً: من السياق المُعيَّن (عبر TenantMiddleware)
            if (_currentTenant != null)
                return _currentTenant.Id;

            // ثانياً: من Claims في JWT
            var tenantClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("tenant_id");
            if (tenantClaim != null && long.TryParse(tenantClaim.Value, out var id))
                return id;

            // ثالثاً: من Header
            var headerValue = _httpContextAccessor.HttpContext?.Request?.Headers["X-Tenant-Id"].FirstOrDefault();
            if (!string.IsNullOrEmpty(headerValue) && long.TryParse(headerValue, out var headerId))
                return headerId;

            // في بيئة الإنتاج: لا يوجد Default - يجب تحديد المستأجر صراحة
            // في بيئة التطوير فقط: يُستخدم TenantId = 1 كافتراضي
            if (_requireTenant)
                return null;

            return 1;
        }
    }

    public string? TenantCode
    {
        get
        {
            if (_currentTenant != null)
                return _currentTenant.Code;

            return _httpContextAccessor.HttpContext?.User?.FindFirst("tenant_code")?.Value
                ?? _httpContextAccessor.HttpContext?.Request?.Headers["X-Tenant-Code"].FirstOrDefault();
        }
    }

    public string? TenantName => _currentTenant?.Name;

    public bool IsValidTenant => TenantId.HasValue && TenantId.Value > 0;

    public string? SubscriptionPlan => _currentTenant?.SubscriptionPlan;

    public void SetTenant(TenantInfo tenant)
    {
        _currentTenant = tenant ?? throw new ArgumentNullException(nameof(tenant));
    }

    public void ClearTenant()
    {
        _currentTenant = null;
    }
}

/// <summary>
/// استثناء خاص بالمستأجر
/// </summary>
public class TenantException : Exception
{
    public TenantException(string message) : base(message) { }
    public TenantException(string message, Exception inner) : base(message, inner) { }
}

/// <summary>
/// استثناء عدم العثور على المستأجر
/// </summary>
public class TenantNotFoundException : TenantException
{
    public TenantNotFoundException(string identifier) 
        : base($"المستأجر '{identifier}' غير موجود") { }
}

/// <summary>
/// استثناء المستأجر غير النشط
/// </summary>
public class TenantInactiveException : TenantException
{
    public TenantInactiveException(string identifier) 
        : base($"المستأجر '{identifier}' غير نشط أو معلق") { }
}

/// <summary>
/// استثناء انتهاء اشتراك المستأجر
/// </summary>
public class TenantSubscriptionExpiredException : TenantException
{
    public TenantSubscriptionExpiredException(string identifier) 
        : base($"اشتراك المستأجر '{identifier}' منتهي") { }
}
