using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Masarat.Core.Domain;
using System.Collections.Concurrent;
using System.Text.Json;

namespace Masarat.Core.Interceptors;

public class SyncVersionInterceptor : SaveChangesInterceptor
{
    private static readonly ConcurrentDictionary<string, long> _versionCounters = new();

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is null) return base.SavingChangesAsync(eventData, result, cancellationToken);

        var context = eventData.Context;
        var entries = context.ChangeTracker.Entries<BaseEntity>()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified)
            .ToList();

        foreach (var entry in entries)
        {
            var entityType = entry.Entity.GetType().Name;
            var newVersion = _versionCounters.AddOrUpdate(
                $"{entry.Entity.TenantId}_{entityType}",
                1,
                (_, current) => current + 1);

            entry.Entity.SyncVersion = newVersion;

            var operationType = entry.State switch
            {
                EntityState.Added => SyncOperationType.Created,
                EntityState.Modified when entry.Entity.IsDeleted &&
                    entry.OriginalValues.GetValue<bool>(nameof(BaseEntity.IsDeleted)) == false
                    => SyncOperationType.SoftDeleted,
                EntityState.Modified when !entry.Entity.IsDeleted &&
                    entry.OriginalValues.GetValue<bool>(nameof(BaseEntity.IsDeleted)) == true
                    => SyncOperationType.Restored,
                _ => SyncOperationType.Updated
            };

            // Get changed fields for updates
            string? changedFields = null;
            if (entry.State == EntityState.Modified)
            {
                var changed = entry.Properties
                    .Where(p => p.IsModified && p.Metadata.Name != nameof(BaseEntity.SyncVersion))
                    .Select(p => p.Metadata.Name)
                    .ToList();
                if (changed.Count > 0)
                    changedFields = JsonSerializer.Serialize(changed);
            }

            var syncLog = new SyncLog
            {
                EntityType = entityType,
                EntityId = entry.Entity.Id,
                TenantId = entry.Entity.TenantId,
                OperationType = operationType,
                SyncVersion = newVersion,
                ChangedFields = changedFields,
                OccurredAt = DateTimeOffset.UtcNow,
                UserId = entry.Entity.LastModifiedBy ?? entry.Entity.CreatedBy
            };

            context.Set<SyncLog>().Add(syncLog);
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
