using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;

namespace Masarat.Core.MultiTenancy;

/// <summary>
/// امتدادات تسجيل خدمات Multi-Tenancy
/// Multi-Tenancy Service Registration Extensions
/// </summary>
public static class MultiTenancyServiceExtensions
{
    /// <summary>
    /// إضافة خدمات Multi-Tenancy
    /// </summary>
    public static IServiceCollection AddMultiTenancy(
        this IServiceCollection services, 
        Action<TenantResolutionOptions>? configureOptions = null)
    {
        // خيارات التكوين
        var options = new TenantResolutionOptions();
        configureOptions?.Invoke(options);
        services.AddSingleton(options);

        // تسجيل الخدمات
        services.AddHttpContextAccessor();
        services.AddMemoryCache();
        
        // Tenant Accessor - Scoped لكل Request
        services.AddScoped<ITenantAccessor, TenantAccessor>();
        services.AddScoped<ITenantContext, TenantAccessor>();
        
        // Tenant Resolver
        services.AddScoped<ITenantResolver, CachedTenantResolver>();
        
        // تسجيل المستودع الافتراضي (In-Memory) للتطوير
        services.AddScoped<ITenantRepository, InMemoryTenantRepository>();

        return services;
    }

    /// <summary>
    /// إضافة مستودع المستأجرين (يحل محل الافتراضي)
    /// </summary>
    public static IServiceCollection AddTenantRepository<TRepository>(this IServiceCollection services)
        where TRepository : class, ITenantRepository
    {
        // إزالة التسجيل السابق وإضافة الجديد
        var descriptor = services.FirstOrDefault(d => d.ServiceType == typeof(ITenantRepository));
        if (descriptor != null)
            services.Remove(descriptor);
            
        services.AddScoped<ITenantRepository, TRepository>();
        return services;
    }

    /// <summary>
    /// استخدام Middleware الـ Multi-Tenancy
    /// </summary>
    public static IApplicationBuilder UseMultiTenancy(this IApplicationBuilder app)
    {
        return app.UseMiddleware<TenantMiddleware>();
    }
}

/// <summary>
/// مثال على استخدام Multi-Tenancy في Program.cs
/// </summary>
/*

// Program.cs - مثال الاستخدام
// ================================

// 1. إضافة الخدمات
builder.Services.AddMultiTenancy(options =>
{
    options.RequireTenant = true;
    options.UseSubdomainResolution = true;
    options.ExcludedPaths.Add("/api/public");
});

// 2. إضافة مستودع المستأجرين
builder.Services.AddTenantRepository<SqlTenantRepository>();

// 3. استخدام الـ Middleware (بعد Authentication)
app.UseAuthentication();
app.UseMultiTenancy();  // <-- هنا
app.UseAuthorization();

// ================================
// في DbContext
// ================================

public class AppDbContext : MultiTenantDbContext
{
    public AppDbContext(
        DbContextOptions<AppDbContext> options, 
        ITenantAccessor tenantAccessor) 
        : base(options, tenantAccessor)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // تطبيق فلاتر المستأجر
        modelBuilder.ApplyTenantQueryFilters(TenantAccessor);
    }
}

// ================================
// في Controller
// ================================

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly ITenantAccessor _tenantAccessor;
    private readonly AppDbContext _context;

    public EmployeesController(ITenantAccessor tenantAccessor, AppDbContext context)
    {
        _tenantAccessor = tenantAccessor;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetEmployees()
    {
        // الفلتر يُطبق تلقائياً - يرجع فقط موظفي المستأجر الحالي
        var employees = await _context.Employees.ToListAsync();
        return Ok(employees);
    }

    [HttpGet("current-tenant")]
    public IActionResult GetCurrentTenant()
    {
        return Ok(new
        {
            TenantId = _tenantAccessor.TenantId,
            TenantCode = _tenantAccessor.TenantCode,
            TenantName = _tenantAccessor.TenantName,
            Plan = _tenantAccessor.SubscriptionPlan
        });
    }
}

*/
