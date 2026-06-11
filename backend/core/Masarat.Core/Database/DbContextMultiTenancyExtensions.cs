using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Masarat.Core.MultiTenancy;

namespace Masarat.Core.Database;

/// <summary>
/// Extension methods for applying Multi-Tenancy to DbContext
/// </summary>
public static class DbContextMultiTenancyExtensions
{
    /// <summary>
    /// Apply tenant filter on all entities that have a TenantId property
    /// </summary>
    public static void ApplyTenantFilters<TContext>(
        this ModelBuilder modelBuilder, 
        ITenantAccessor tenantAccessor) where TContext : DbContext
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var clrType = entityType.ClrType;
            
            // Check for TenantId property
            var tenantIdProperty = clrType.GetProperty("TenantId");
            if (tenantIdProperty == null) continue;

            // Check for IsDeleted property
            var isDeletedProperty = clrType.GetProperty("IsDeleted");

            // Build dynamic filter expression
            var parameter = System.Linq.Expressions.Expression.Parameter(clrType, "e");
            
            // TenantId filter: e.TenantId == currentTenantId
            // IMPORTANT: We must create a properly-typed expression that reads from tenantAccessor
            // to avoid "binary operator Equal is not defined for types 'System.Int64' and 'System.Object'"
            var tenantIdAccess = System.Linq.Expressions.Expression.Property(parameter, "TenantId");
            
            // Create a properly-typed expression that reads TenantId from the accessor at query time
            var tenantAccessorConstant = System.Linq.Expressions.Expression.Constant(tenantAccessor);
            var tenantIdGetter = System.Linq.Expressions.Expression.Property(tenantAccessorConstant, nameof(ITenantAccessor.TenantId));
            
            // Convert the nullable long? to the property type (long) for comparison
            var propertyType = tenantIdProperty.PropertyType;
            System.Linq.Expressions.Expression tenantIdValue;
            
            if (propertyType == typeof(long))
            {
                tenantIdValue = System.Linq.Expressions.Expression.Convert(tenantIdGetter, typeof(long));
            }
            else if (propertyType == typeof(int))
            {
                tenantIdValue = System.Linq.Expressions.Expression.Convert(tenantIdGetter, typeof(int));
            }
            else
            {
                tenantIdValue = System.Linq.Expressions.Expression.Convert(tenantIdGetter, propertyType);
            }
            
            var tenantFilter = System.Linq.Expressions.Expression.Equal(tenantIdAccess, tenantIdValue);

            System.Linq.Expressions.Expression combinedFilter = tenantFilter;

            // Add Soft Delete filter if IsDeleted exists
            if (isDeletedProperty != null)
            {
                var isDeletedAccess = System.Linq.Expressions.Expression.Property(parameter, "IsDeleted");
                var falseConstant = System.Linq.Expressions.Expression.Constant(false);
                var softDeleteFilter = System.Linq.Expressions.Expression.Equal(isDeletedAccess, falseConstant);
                
                combinedFilter = System.Linq.Expressions.Expression.AndAlso(tenantFilter, softDeleteFilter);
            }

            // Create Lambda Expression
            var lambdaType = typeof(Func<,>).MakeGenericType(clrType, typeof(bool));
            var lambda = System.Linq.Expressions.Expression.Lambda(lambdaType, combinedFilter, parameter);

            // Apply Query Filter
            modelBuilder.Entity(clrType).HasQueryFilter((dynamic)lambda);
        }
    }

    /// <summary>
    /// Add Indexes on TenantId for all entities
    /// </summary>
    public static void AddTenantIndexes(this ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var clrType = entityType.ClrType;
            var tenantIdProperty = clrType.GetProperty("TenantId");
            
            if (tenantIdProperty != null)
            {
                modelBuilder.Entity(clrType)
                    .HasIndex("TenantId")
                    .HasDatabaseName($"IX_{entityType.GetTableName()}_TenantId");
            }
        }
    }
}

/// <summary>
/// Base DbContext with built-in Multi-Tenancy support
/// </summary>
public abstract class BaseTenantDbContext : DbContext
{
    protected readonly ITenantAccessor TenantAccessor;

    protected BaseTenantDbContext(
        DbContextOptions options, 
        ITenantAccessor tenantAccessor) : base(options)
    {
        TenantAccessor = tenantAccessor ?? throw new ArgumentNullException(nameof(tenantAccessor));
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        SetTenantIdForNewEntities();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override async Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess, 
        CancellationToken cancellationToken = default)
    {
        SetTenantIdForNewEntities();
        return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void SetTenantIdForNewEntities()
    {
        var tenantId = TenantAccessor.TenantId;
        if (!tenantId.HasValue) return;

        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added);

        foreach (var entry in entries)
        {
            var tenantIdProperty = entry.Entity.GetType().GetProperty("TenantId");
            if (tenantIdProperty != null && tenantIdProperty.CanWrite)
            {
                var currentValue = tenantIdProperty.GetValue(entry.Entity);
                if (currentValue == null || (currentValue is long l && l == 0))
                {
                    tenantIdProperty.SetValue(entry.Entity, tenantId.Value);
                }
            }
        }
    }

    public IQueryable<TEntity> IgnoreTenantFilter<TEntity>() where TEntity : class
    {
        return Set<TEntity>().IgnoreQueryFilters();
    }
}