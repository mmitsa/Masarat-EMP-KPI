using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Masarat.Core.Domain;
using Masarat.Core.Services.Sync;
using System.Text.Json;

namespace Masarat.Core.Controllers;

/// <summary>
/// متحكم المزامنة - Delta Sync للعمل بدون اتصال
/// </summary>
[ApiController]
[Route("api/core/[controller]")]
[Authorize]
public class SyncController : ControllerBase
{
    private readonly IConflictResolver _conflictResolver;

    public SyncController(IConflictResolver conflictResolver)
    {
        _conflictResolver = conflictResolver;
    }

    /// <summary>
    /// جلب التغييرات التفاضلية بعد رقم إصدار معين
    /// </summary>
    [HttpGet("delta")]
    public async Task<ActionResult> GetDelta(
        [FromQuery] string entity,
        [FromQuery] long since = 0,
        [FromQuery] int limit = 100,
        [FromServices] DbContext dbContext = null!)
    {
        if (string.IsNullOrWhiteSpace(entity))
            return BadRequest(new { message = "نوع الكيان مطلوب" });

        if (limit > 500) limit = 500;

        var tenantId = GetTenantId();

        var logs = await dbContext.Set<SyncLog>()
            .Where(s => s.EntityType == entity
                     && s.TenantId == tenantId
                     && s.SyncVersion > since)
            .OrderBy(s => s.SyncVersion)
            .Take(limit + 1)
            .Select(s => new SyncDeltaItem
            {
                EntityId = s.EntityId,
                SyncVersion = s.SyncVersion,
                OperationType = s.OperationType.ToString(),
                ChangedFields = s.ChangedFields,
                OccurredAt = s.OccurredAt
            })
            .ToListAsync();

        var hasMore = logs.Count > limit;
        if (hasMore) logs = logs.Take(limit).ToList();

        var lastVersion = logs.Count > 0 ? logs[^1].SyncVersion : since;

        return Ok(new SyncDeltaResponse
        {
            Items = logs,
            LastSyncVersion = lastVersion,
            HasMore = hasMore,
            Entity = entity
        });
    }

    /// <summary>
    /// استقبال التغييرات من العميل (Push)
    /// </summary>
    [HttpPost("push")]
    public async Task<ActionResult> Push(
        [FromBody] SyncPushRequest request,
        [FromServices] DbContext dbContext = null!)
    {
        if (request.Changes == null || request.Changes.Count == 0)
            return BadRequest(new { message = "لا توجد تغييرات للمزامنة" });

        var accepted = new List<SyncPushResult>();
        var conflicts = new List<SyncPushConflict>();

        foreach (var change in request.Changes)
        {
            var resolution = _conflictResolver.Resolve(change.EntityType, change, null);

            if (resolution.Action == ConflictAction.AcceptClient)
            {
                accepted.Add(new SyncPushResult
                {
                    EntityType = change.EntityType,
                    EntityId = change.EntityId,
                    Status = "accepted"
                });
            }
            else
            {
                conflicts.Add(new SyncPushConflict
                {
                    EntityType = change.EntityType,
                    EntityId = change.EntityId,
                    Message = resolution.Message ?? "تعارض في البيانات",
                    ServerVersion = resolution.ServerVersion
                });
            }
        }

        return Ok(new SyncPushResponse
        {
            Accepted = accepted,
            Conflicts = conflicts,
            ProcessedAt = DateTimeOffset.UtcNow
        });
    }

    /// <summary>
    /// جلب حالة المزامنة - آخر إصدار لكل نوع كيان
    /// </summary>
    [HttpGet("status")]
    public async Task<ActionResult> GetStatus([FromServices] DbContext dbContext = null!)
    {
        var tenantId = GetTenantId();

        var statuses = await dbContext.Set<SyncLog>()
            .Where(s => s.TenantId == tenantId)
            .GroupBy(s => s.EntityType)
            .Select(g => new
            {
                Entity = g.Key,
                LastSyncVersion = g.Max(s => s.SyncVersion),
                LastModified = g.Max(s => s.OccurredAt),
                TotalChanges = g.Count()
            })
            .ToListAsync();

        return Ok(new
        {
            entities = statuses.ToDictionary(
                s => s.Entity,
                s => new { s.LastSyncVersion, s.LastModified, s.TotalChanges }),
            serverTime = DateTimeOffset.UtcNow
        });
    }

    private long GetTenantId()
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value;
        return long.TryParse(tenantClaim, out var id) ? id : 1;
    }
}

// DTOs
public class SyncDeltaItem
{
    public int EntityId { get; set; }
    public long SyncVersion { get; set; }
    public string OperationType { get; set; } = string.Empty;
    public string? ChangedFields { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
}

public class SyncDeltaResponse
{
    public List<SyncDeltaItem> Items { get; set; } = new();
    public long LastSyncVersion { get; set; }
    public bool HasMore { get; set; }
    public string Entity { get; set; } = string.Empty;
}

public class SyncPushRequest
{
    public List<SyncPushItem> Changes { get; set; } = new();
}

public class SyncPushResult
{
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class SyncPushConflict
{
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string Message { get; set; } = string.Empty;
    public object? ServerVersion { get; set; }
}

public class SyncPushResponse
{
    public List<SyncPushResult> Accepted { get; set; } = new();
    public List<SyncPushConflict> Conflicts { get; set; } = new();
    public DateTimeOffset ProcessedAt { get; set; }
}
