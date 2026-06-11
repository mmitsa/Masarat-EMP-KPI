using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Masarat.Core.MultiTenancy;

/// <summary>
/// فلتر التحقق من المستأجر
/// Tenant Validation Action Filter
/// </summary>
public class TenantValidationFilter : IAsyncActionFilter
{
    private readonly ITenantAccessor _tenantAccessor;

    public TenantValidationFilter(ITenantAccessor tenantAccessor)
    {
        _tenantAccessor = tenantAccessor;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // التحقق من وجود Attribute لتجاوز الفلتر
        var ignoreTenantFilter = context.ActionDescriptor.EndpointMetadata
            .OfType<IgnoreTenantFilterAttribute>().Any();

        if (ignoreTenantFilter)
        {
            await next();
            return;
        }

        // التحقق من وجود معرف المستأجر
        if (!_tenantAccessor.IsValidTenant)
        {
            context.Result = new BadRequestObjectResult(new
            {
                Error = "معرف المستأجر مطلوب",
                Code = "TENANT_REQUIRED"
            });
            return;
        }

        await next();
    }
}

/// <summary>
/// فلتر التحقق من اشتراك المستأجر
/// Tenant Subscription Validation Filter
/// </summary>
public class TenantSubscriptionFilter : IAsyncActionFilter
{
    private readonly ITenantAccessor _tenantAccessor;
    private readonly ITenantResolver _tenantResolver;

    public TenantSubscriptionFilter(ITenantAccessor tenantAccessor, ITenantResolver tenantResolver)
    {
        _tenantAccessor = tenantAccessor;
        _tenantResolver = tenantResolver;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!_tenantAccessor.TenantId.HasValue)
        {
            await next();
            return;
        }

        var tenant = await _tenantResolver.ResolveByIdAsync(_tenantAccessor.TenantId.Value);

        if (tenant == null)
        {
            context.Result = new NotFoundObjectResult(new
            {
                Error = "المستأجر غير موجود",
                Code = "TENANT_NOT_FOUND"
            });
            return;
        }

        if (!tenant.IsActive)
        {
            context.Result = new ObjectResult(new
            {
                Error = "المستأجر معلق",
                Code = "TENANT_SUSPENDED"
            })
            { StatusCode = 403 };
            return;
        }

        if (tenant.SubscriptionExpiry.HasValue && tenant.SubscriptionExpiry < DateTime.UtcNow)
        {
            context.Result = new ObjectResult(new
            {
                Error = "اشتراك المستأجر منتهي",
                Code = "SUBSCRIPTION_EXPIRED",
                ExpiredAt = tenant.SubscriptionExpiry
            })
            { StatusCode = 402 };
            return;
        }

        await next();
    }
}

/// <summary>
/// فلتر لمنع الوصول عبر المستأجرين
/// Cross-Tenant Access Prevention Filter
/// </summary>
public class CrossTenantAccessFilter : IAsyncActionFilter
{
    private readonly ITenantAccessor _tenantAccessor;
    private readonly ILogger<CrossTenantAccessFilter> _logger;

    public CrossTenantAccessFilter(ITenantAccessor tenantAccessor, ILogger<CrossTenantAccessFilter> logger)
    {
        _tenantAccessor = tenantAccessor;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // التحقق من معاملات الـ Route التي تحتوي على tenantId
        if (context.RouteData.Values.TryGetValue("tenantId", out var routeTenantId))
        {
            if (long.TryParse(routeTenantId?.ToString(), out var parsedTenantId))
            {
                if (_tenantAccessor.TenantId.HasValue && _tenantAccessor.TenantId.Value != parsedTenantId)
                {
                    _logger.LogWarning(
                        "محاولة وصول عبر المستأجرين! Current: {CurrentTenant}, Requested: {RequestedTenant}, User: {User}",
                        _tenantAccessor.TenantId,
                        parsedTenantId,
                        context.HttpContext.User?.Identity?.Name
                    );

                    context.Result = new ObjectResult(new
                    {
                        Error = "غير مصرح بالوصول لهذا المستأجر",
                        Code = "CROSS_TENANT_ACCESS_DENIED"
                    })
                    { StatusCode = 403 };
                    return;
                }
            }
        }

        await next();
    }
}

/// <summary>
/// تسجيل الفلاتر
/// </summary>
public static class TenantFiltersExtensions
{
    public static IMvcBuilder AddTenantFilters(this IMvcBuilder builder)
    {
        builder.AddMvcOptions(options =>
        {
            options.Filters.Add<TenantValidationFilter>();
            options.Filters.Add<TenantSubscriptionFilter>();
            options.Filters.Add<CrossTenantAccessFilter>();
        });

        return builder;
    }
}
