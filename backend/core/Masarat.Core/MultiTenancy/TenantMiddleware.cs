using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Masarat.Core.MultiTenancy;

/// <summary>
/// Middleware لاستخراج وتعيين المستأجر الحالي
/// Tenant Resolution Middleware - ISO 27001 Compliant
/// </summary>
public class TenantMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantMiddleware> _logger;
    private readonly TenantResolutionOptions _options;

    public TenantMiddleware(
        RequestDelegate next, 
        ILogger<TenantMiddleware> logger,
        TenantResolutionOptions? options = null)
    {
        _next = next;
        _logger = logger;
        _options = options ?? new TenantResolutionOptions();
    }

    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext, ITenantResolver tenantResolver)
    {
        // تجاوز المسارات المستثناة
        if (IsExcludedPath(context.Request.Path))
        {
            await _next(context);
            return;
        }

        try
        {
            // محاولة استخراج معرف المستأجر
            var tenantIdentifier = ResolveTenantIdentifier(context);

            if (string.IsNullOrEmpty(tenantIdentifier))
            {
                if (_options.RequireTenant)
                {
                    _logger.LogWarning("طلب بدون معرف مستأجر من {IP}", context.Connection.RemoteIpAddress);
                    context.Response.StatusCode = 400;
                    await context.Response.WriteAsJsonAsync(new { Error = "معرف المستأجر مطلوب" });
                    return;
                }
                
                await _next(context);
                return;
            }

            // جلب معلومات المستأجر
            var tenantInfo = await tenantResolver.ResolveAsync(tenantIdentifier);

            if (tenantInfo == null)
            {
                _logger.LogWarning("مستأجر غير موجود: {TenantId}", tenantIdentifier);
                context.Response.StatusCode = 404;
                await context.Response.WriteAsJsonAsync(new { Error = "المستأجر غير موجود" });
                return;
            }

            // التحقق من حالة المستأجر
            if (!tenantInfo.IsActive)
            {
                _logger.LogWarning("محاولة وصول لمستأجر غير نشط: {TenantId}", tenantIdentifier);
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new { Error = "المستأجر معلق أو غير نشط" });
                return;
            }

            // التحقق من صلاحية الاشتراك
            if (tenantInfo.SubscriptionExpiry.HasValue && tenantInfo.SubscriptionExpiry < DateTime.UtcNow)
            {
                _logger.LogWarning("اشتراك منتهي للمستأجر: {TenantId}", tenantIdentifier);
                context.Response.StatusCode = 402; // Payment Required
                await context.Response.WriteAsJsonAsync(new { Error = "اشتراك المستأجر منتهي" });
                return;
            }

            // تعيين المستأجر في السياق
            tenantContext.SetTenant(tenantInfo);

            // إضافة معلومات المستأجر في الـ Response Headers (للتصحيح)
            if (_options.IncludeTenantHeader)
            {
                context.Response.Headers.Append("X-Tenant-Id", tenantInfo.Id.ToString());
                context.Response.Headers.Append("X-Tenant-Code", tenantInfo.Code);
            }

            _logger.LogDebug("تم تعيين المستأجر: {TenantId} - {TenantName}", tenantInfo.Id, tenantInfo.Name);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في معالجة المستأجر");
            
            if (_options.ThrowOnError)
                throw;

            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new { Error = "خطأ في معالجة المستأجر" });
            return;
        }

        await _next(context);
    }

    /// <summary>
    /// استخراج معرف المستأجر من الطلب
    /// </summary>
    private string? ResolveTenantIdentifier(HttpContext context)
    {
        // 1. من JWT Claims (الأولوية الأعلى)
        var claimValue = context.User?.FindFirst("tenant_id")?.Value;
        if (!string.IsNullOrEmpty(claimValue))
            return claimValue;

        // 2. من Header
        var headerValue = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (!string.IsNullOrEmpty(headerValue))
            return headerValue;

        // 3. من Query String
        var queryValue = context.Request.Query["tenantId"].FirstOrDefault();
        if (!string.IsNullOrEmpty(queryValue))
            return queryValue;

        // 4. من Subdomain (tenant.masarat.sa)
        var host = context.Request.Host.Host;
        if (_options.UseSubdomainResolution && host.Contains('.'))
        {
            var subdomain = host.Split('.')[0];
            if (!_options.ExcludedSubdomains.Contains(subdomain.ToLower()))
                return subdomain;
        }

        return null;
    }

    /// <summary>
    /// التحقق من المسارات المستثناة
    /// </summary>
    private bool IsExcludedPath(PathString path)
    {
        var pathValue = path.Value?.ToLower() ?? "";
        
        return _options.ExcludedPaths.Any(p => pathValue.StartsWith(p.ToLower()));
    }
}

/// <summary>
/// خيارات Tenant Resolution
/// </summary>
public class TenantResolutionOptions
{
    /// <summary>
    /// هل المستأجر مطلوب لجميع الطلبات
    /// في بيئة الإنتاج يُنصح بتعيين القيمة إلى true
    /// يمكن تجاوزها عبر الإعدادات: MultiTenancy:RequireTenant
    /// </summary>
    public bool RequireTenant { get; set; } = true;

    /// <summary>
    /// استخدام الـ Subdomain لتحديد المستأجر
    /// </summary>
    public bool UseSubdomainResolution { get; set; } = true;

    /// <summary>
    /// إضافة معلومات المستأجر في Headers
    /// </summary>
    public bool IncludeTenantHeader { get; set; } = false;

    /// <summary>
    /// رمي استثناء عند الخطأ
    /// </summary>
    public bool ThrowOnError { get; set; } = false;

    /// <summary>
    /// المسارات المستثناة من التحقق
    /// </summary>
    public List<string> ExcludedPaths { get; set; } = new()
    {
        "/health",
        "/api/health",
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/forgot-password",
        "/swagger",
        "/hangfire",
        "/.well-known"
    };

    /// <summary>
    /// الـ Subdomains المستثناة
    /// </summary>
    public List<string> ExcludedSubdomains { get; set; } = new()
    {
        "www",
        "api",
        "auth",
        "admin",
        "dashboard",
        "localhost",
        "unified",
        "masarat",
        "mmit"
    };
}

/// <summary>
/// واجهة حل المستأجر
/// </summary>
public interface ITenantResolver
{
    Task<TenantInfo?> ResolveAsync(string identifier);
    Task<TenantInfo?> ResolveByIdAsync(long id);
    Task<TenantInfo?> ResolveByCodeAsync(string code);
    void InvalidateCache(long tenantId);
}

/// <summary>
/// تنفيذ حل المستأجر مع Cache
/// </summary>
public class CachedTenantResolver : ITenantResolver
{
    private readonly ITenantRepository _repository;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CachedTenantResolver> _logger;
    private readonly TimeSpan _cacheExpiry = TimeSpan.FromMinutes(5);

    public CachedTenantResolver(
        ITenantRepository repository, 
        IMemoryCache cache,
        ILogger<CachedTenantResolver> logger)
    {
        _repository = repository;
        _cache = cache;
        _logger = logger;
    }

    public async Task<TenantInfo?> ResolveAsync(string identifier)
    {
        // محاولة كـ ID أولاً
        if (long.TryParse(identifier, out var id))
            return await ResolveByIdAsync(id);

        // ثم كـ Code
        return await ResolveByCodeAsync(identifier);
    }

    public async Task<TenantInfo?> ResolveByIdAsync(long id)
    {
        var cacheKey = $"tenant:id:{id}";
        
        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = _cacheExpiry;
            return await _repository.GetByIdAsync(id);
        });
    }

    public async Task<TenantInfo?> ResolveByCodeAsync(string code)
    {
        var cacheKey = $"tenant:code:{code.ToLower()}";
        
        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = _cacheExpiry;
            return await _repository.GetByCodeAsync(code);
        });
    }

    public void InvalidateCache(long tenantId)
    {
        _cache.Remove($"tenant:id:{tenantId}");
        _logger.LogInformation("تم إبطال Cache للمستأجر: {TenantId}", tenantId);
    }
}

/// <summary>
/// واجهة مستودع المستأجرين
/// </summary>
public interface ITenantRepository
{
    Task<TenantInfo?> GetByIdAsync(long id);
    Task<TenantInfo?> GetByCodeAsync(string code);
}

/// <summary>
/// مستودع المستأجرين الافتراضي (في الذاكرة) - للتطوير والاختبار
/// In-Memory Tenant Repository - for development and testing
/// </summary>
public class InMemoryTenantRepository : ITenantRepository
{
    private static readonly Dictionary<long, TenantInfo> _tenantsById = new()
    {
        [1] = new TenantInfo
        {
            Id = 1,
            Code = "default",
            Name = "Default Tenant",
            SubscriptionPlan = "enterprise",
            IsActive = true,
            ConnectionString = null // يستخدم الاتصال الافتراضي
        },
        [2] = new TenantInfo
        {
            Id = 2,
            Code = "demo",
            Name = "Demo Tenant",
            SubscriptionPlan = "pro",
            IsActive = true,
            ConnectionString = null
        },
        [3] = new TenantInfo
        {
            Id = 3,
            Code = "test",
            Name = "Test Tenant",
            SubscriptionPlan = "basic",
            IsActive = true,
            ConnectionString = null
        }
    };

    // Alias mapping for tenant codes that map to existing tenants
    private static readonly Dictionary<string, long> _tenantAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["tenant-1"] = 1,      // tenant-1 -> Default Tenant
        ["tenant-2"] = 2,      // tenant-2 -> Demo Tenant
        ["tenant-3"] = 3,      // tenant-3 -> Test Tenant
        ["masarat"] = 1,       // masarat -> Default Tenant
        ["mmit"] = 1,          // mmit -> Default Tenant
    };

    private static readonly Dictionary<string, TenantInfo> _tenantsByCode;

    static InMemoryTenantRepository()
    {
        _tenantsByCode = _tenantsById.Values.ToDictionary(t => t.Code, t => t, StringComparer.OrdinalIgnoreCase);
    }

    public Task<TenantInfo?> GetByIdAsync(long id)
    {
        _tenantsById.TryGetValue(id, out var tenant);
        return Task.FromResult(tenant);
    }

    public Task<TenantInfo?> GetByCodeAsync(string code)
    {
        // Try direct code match first
        if (_tenantsByCode.TryGetValue(code, out var tenant))
            return Task.FromResult<TenantInfo?>(tenant);

        // Try alias mapping
        if (_tenantAliases.TryGetValue(code, out var aliasId))
        {
            _tenantsById.TryGetValue(aliasId, out var aliasTenant);
            return Task.FromResult(aliasTenant);
        }

        return Task.FromResult<TenantInfo?>(null);
    }
}
