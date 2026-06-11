using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Masarat.Core.Database;

/// <summary>
/// امتدادات للـ Migrations
/// EF Core Migration Extensions
/// </summary>
public static class MigrationExtensions
{
    /// <summary>
    /// تطبيق الـ Migrations تلقائياً عند بدء التطبيق
    /// Apply pending migrations automatically at startup
    /// </summary>
    public static async Task ApplyMigrationsAsync<TContext>(
        this IServiceProvider serviceProvider,
        ILogger? logger = null) where TContext : DbContext
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TContext>();
        var contextName = typeof(TContext).Name;

        try
        {
            var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
            var migrationList = pendingMigrations.ToList();

            if (migrationList.Count > 0)
            {
                logger?.LogInformation(
                    "Applying {Count} pending migrations for {Context}: {Migrations}",
                    migrationList.Count,
                    contextName,
                    string.Join(", ", migrationList));

                await context.Database.MigrateAsync();

                logger?.LogInformation(
                    "Successfully applied {Count} migrations for {Context}",
                    migrationList.Count,
                    contextName);
            }
            else
            {
                logger?.LogDebug("No pending migrations for {Context}", contextName);
            }
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "Error applying migrations for {Context}", contextName);
            throw;
        }
    }

    /// <summary>
    /// إنشاء قاعدة البيانات إذا لم تكن موجودة
    /// Ensure database is created
    /// </summary>
    public static async Task EnsureDatabaseCreatedAsync<TContext>(
        this IServiceProvider serviceProvider,
        ILogger? logger = null,
        bool isDevelopment = true) where TContext : DbContext
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TContext>();
        var contextName = typeof(TContext).Name;

        try
        {
            if (isDevelopment)
            {
                var created = await context.Database.EnsureCreatedAsync();
                if (created)
                {
                    logger?.LogInformation("Database created for {Context}", contextName);
                }
            }
            else
            {
                await context.Database.MigrateAsync();
                logger?.LogInformation("Migrations applied for {Context}", contextName);
            }
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "Error ensuring database for {Context}", contextName);
            throw;
        }
    }

    /// <summary>
    /// إعادة تعيين قاعدة البيانات (للتطوير فقط!)
    /// Reset database (DEVELOPMENT ONLY!)
    /// </summary>
    public static async Task ResetDatabaseAsync<TContext>(
        this IServiceProvider serviceProvider,
        ILogger? logger = null) where TContext : DbContext
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TContext>();
        var contextName = typeof(TContext).Name;

        logger?.LogWarning("⚠️ RESETTING DATABASE for {Context}", contextName);

        await context.Database.EnsureDeletedAsync();
        await context.Database.MigrateAsync();

        logger?.LogWarning("Database reset complete for {Context}", contextName);
    }

    /// <summary>
    /// الحصول على حالة الـ Migrations
    /// Get migration status
    /// </summary>
    public static async Task<MigrationStatus> GetMigrationStatusAsync<TContext>(
        this IServiceProvider serviceProvider) where TContext : DbContext
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TContext>();

        var applied = await context.Database.GetAppliedMigrationsAsync();
        var pending = await context.Database.GetPendingMigrationsAsync();

        return new MigrationStatus
        {
            ContextName = typeof(TContext).Name,
            AppliedMigrations = applied.ToList(),
            PendingMigrations = pending.ToList(),
            IsCurrent = !pending.Any()
        };
    }
}

/// <summary>
/// حالة الـ Migrations
/// Migration Status
/// </summary>
public class MigrationStatus
{
    /// <summary>اسم الـ DbContext</summary>
    public string ContextName { get; set; } = string.Empty;

    /// <summary>الـ Migrations المطبقة</summary>
    public List<string> AppliedMigrations { get; set; } = new();

    /// <summary>الـ Migrations المعلقة</summary>
    public List<string> PendingMigrations { get; set; } = new();

    /// <summary>هل قاعدة البيانات محدثة</summary>
    public bool IsCurrent { get; set; }

    /// <summary>عدد الـ Migrations المطبقة</summary>
    public int AppliedCount => AppliedMigrations.Count;

    /// <summary>عدد الـ Migrations المعلقة</summary>
    public int PendingCount => PendingMigrations.Count;
}
