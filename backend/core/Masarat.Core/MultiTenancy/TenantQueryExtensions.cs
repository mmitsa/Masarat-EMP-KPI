using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Masarat.Core.MultiTenancy;

/// <summary>
/// امتدادات EF Core لتعدد المستأجرين
/// EF Core Extensions for Multi-Tenancy (ISO 27001 Compliant)
/// </summary>
public static class TenantQueryExtensions
{
    /// <summary>
    /// إضافة فلتر المستأجر تلقائياً لجميع الكيانات
    /// </summary>
    public static void ApplyTenantQueryFilters(this ModelBuilder modelBuilder, ITenantAccessor tenantAccessor)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            // التحقق من أن الكيان يحتوي على TenantId
            var tenantIdProperty = entityType.FindProperty("TenantId");
            if (tenantIdProperty == null) continue;

            // إنشاء الفلتر
            var parameter = Expression.Parameter(entityType.ClrType, "e");
            
            // e.TenantId == tenantAccessor.TenantId
            var tenantIdExpression = Expression.Property(parameter, "TenantId");
            var currentTenantExpression = Expression.Property(
                Expression.Constant(tenantAccessor), 
                nameof(ITenantAccessor.TenantId)
            );
            
            // Handle nullable comparison
            var tenantIdValue = Expression.Convert(currentTenantExpression, typeof(long));
            var comparison = Expression.Equal(tenantIdExpression, tenantIdValue);
            
            var lambda = Expression.Lambda(comparison, parameter);
            
            // تطبيق الفلتر
            entityType.SetQueryFilter(lambda);
        }
    }

    /// <summary>
    /// إضافة فلاتر شاملة (Tenant + Soft Delete)
    /// </summary>
    public static void ApplyGlobalFilters<TEntity>(
        this ModelBuilder modelBuilder, 
        ITenantAccessor tenantAccessor) 
        where TEntity : class
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(e =>
            EF.Property<long>(e, "TenantId") == tenantAccessor.TenantId!.Value &&
            !EF.Property<bool>(e, "IsDeleted")
        );
    }
}

/// <summary>
/// DbContext أساسي مع دعم Multi-Tenant
/// Base DbContext with Multi-Tenant Support
/// </summary>
public abstract class MultiTenantDbContext : DbContext
{
    protected readonly ITenantAccessor TenantAccessor;

    protected MultiTenantDbContext(DbContextOptions options, ITenantAccessor tenantAccessor) 
        : base(options)
    {
        TenantAccessor = tenantAccessor;
    }

    /// <summary>
    /// تعيين TenantId تلقائياً عند الحفظ
    /// </summary>
    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        SetTenantIdForNewEntities();
        ValidateTenantIdForModifiedEntities();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        SetTenantIdForNewEntities();
        ValidateTenantIdForModifiedEntities();
        return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    /// <summary>
    /// تعيين TenantId للكيانات الجديدة
    /// </summary>
    private void SetTenantIdForNewEntities()
    {
        var tenantId = TenantAccessor.TenantId;
        if (!tenantId.HasValue) return;

        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added);

        foreach (var entry in entries)
        {
            var tenantIdProperty = entry.Property("TenantId");
            if (tenantIdProperty != null && tenantIdProperty.CurrentValue is long currentTenantId && currentTenantId == 0)
            {
                tenantIdProperty.CurrentValue = tenantId.Value;
            }
        }
    }

    /// <summary>
    /// التحقق من عدم تغيير TenantId للكيانات المعدلة
    /// </summary>
    private void ValidateTenantIdForModifiedEntities()
    {
        var tenantId = TenantAccessor.TenantId;
        if (!tenantId.HasValue) return;

        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            var tenantIdProperty = entry.Property("TenantId");
            if (tenantIdProperty != null)
            {
                var originalValue = tenantIdProperty.OriginalValue;
                var currentValue = tenantIdProperty.CurrentValue;

                // منع تغيير TenantId
                if (originalValue != null && !originalValue.Equals(currentValue))
                {
                    throw new TenantException("لا يمكن تغيير معرف المستأجر للكيان");
                }

                // التحقق من ملكية البيانات
                if (originalValue != null && !originalValue.Equals(tenantId.Value))
                {
                    throw new CrossTenantAccessException(
                        $"محاولة تعديل بيانات مستأجر آخر. Current: {tenantId}, Entity: {originalValue}");
                }
            }
        }
    }

    /// <summary>
    /// تجاهل فلتر المستأجر (للمسؤولين فقط)
    /// </summary>
    public IQueryable<TEntity> IgnoreTenantFilter<TEntity>() where TEntity : class
    {
        return Set<TEntity>().IgnoreQueryFilters();
    }
}

/// <summary>
/// استثناء الوصول بين المستأجرين
/// </summary>
public class CrossTenantAccessException : TenantException
{
    public CrossTenantAccessException(string message) : base(message) { }
}

/// <summary>
/// Attribute لتجاوز فلتر المستأجر
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class IgnoreTenantFilterAttribute : Attribute { }

/// <summary>
/// Attribute للسماح بالوصول للمسؤولين فقط
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class TenantAdminOnlyAttribute : Attribute { }
