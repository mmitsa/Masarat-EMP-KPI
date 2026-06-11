using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Masarat.Core.AuditViewer;

/// <summary>
/// API Controller لعرض سجلات التدقيق
/// Centralized Audit Log API
/// </summary>
[ApiController]
[Route("api/audit")]
[Authorize(Roles = "admin,audit_viewer,super_admin")]
public class AuditLogController : ControllerBase
{
    private readonly IAuditLogViewerService _auditService;
    private readonly ILogger<AuditLogController> _logger;

    public AuditLogController(
        IAuditLogViewerService auditService,
        ILogger<AuditLogController> logger)
    {
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// البحث في سجلات التدقيق
    /// </summary>
    /// <remarks>
    /// يمكن البحث والفلترة حسب:
    /// - المستأجر (TenantId)
    /// - المستخدم (UserId)
    /// - نوع الإجراء (Action)
    /// - نوع الكيان (EntityType)
    /// - معرف الكيان (EntityId)
    /// - نطاق التاريخ
    /// - الوحدة (Module)
    /// </remarks>
    [HttpGet]
    [ProducesResponseType(typeof(PagedAuditResult), 200)]
    public async Task<IActionResult> GetAuditLogs([FromQuery] AuditLogQuery query)
    {
        try
        {
            // Enforce tenant isolation for non-admin users
            if (!User.IsInRole("super_admin") && !User.IsInRole("admin"))
            {
                var userTenantId = User.FindFirst("tenant_id")?.Value;
                if (!string.IsNullOrEmpty(userTenantId))
                {
                    query.TenantId = userTenantId;
                }
            }

            var result = await _auditService.GetAuditLogsAsync(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit logs");
            return StatusCode(500, new { message = "حدث خطأ أثناء استرجاع سجلات التدقيق" });
        }
    }

    /// <summary>
    /// الحصول على سجل تدقيق محدد
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AuditLogEntry), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetAuditLogById(long id)
    {
        try
        {
            var entry = await _auditService.GetAuditLogByIdAsync(id);
            if (entry == null)
            {
                return NotFound(new { message = "سجل التدقيق غير موجود" });
            }

            // Check tenant access
            if (!User.IsInRole("super_admin") && !User.IsInRole("admin"))
            {
                var userTenantId = User.FindFirst("tenant_id")?.Value;
                if (entry.TenantId != userTenantId)
                {
                    return Forbid();
                }
            }

            return Ok(entry);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit log: {Id}", id);
            return StatusCode(500, new { message = "حدث خطأ أثناء استرجاع سجل التدقيق" });
        }
    }

    /// <summary>
    /// الحصول على التغييرات في سجل تدقيق محدد
    /// </summary>
    [HttpGet("{id}/changes")]
    [ProducesResponseType(typeof(Dictionary<string, ChangeDetail>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetAuditLogChanges(long id)
    {
        try
        {
            var entry = await _auditService.GetAuditLogByIdAsync(id);
            if (entry == null)
            {
                return NotFound(new { message = "سجل التدقيق غير موجود" });
            }

            // Check tenant access
            if (!User.IsInRole("super_admin") && !User.IsInRole("admin"))
            {
                var userTenantId = User.FindFirst("tenant_id")?.Value;
                if (entry.TenantId != userTenantId)
                {
                    return Forbid();
                }
            }

            var changes = entry.GetChanges();
            return Ok(changes ?? new Dictionary<string, ChangeDetail>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit log changes: {Id}", id);
            return StatusCode(500, new { message = "حدث خطأ أثناء استرجاع تفاصيل التغييرات" });
        }
    }

    /// <summary>
    /// الحصول على إحصائيات سجلات التدقيق
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(AuditLogStatistics), 200)]
    public async Task<IActionResult> GetStatistics(
        [FromQuery] string? tenantId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        try
        {
            // Enforce tenant isolation
            if (!User.IsInRole("super_admin") && !User.IsInRole("admin"))
            {
                tenantId = User.FindFirst("tenant_id")?.Value;
            }

            var stats = await _auditService.GetStatisticsAsync(tenantId, from, to);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit statistics");
            return StatusCode(500, new { message = "حدث خطأ أثناء استرجاع الإحصائيات" });
        }
    }

    /// <summary>
    /// الحصول على نشاط مستخدم معين
    /// </summary>
    [HttpGet("users/{userId}/activity")]
    [ProducesResponseType(typeof(IEnumerable<AuditLogEntry>), 200)]
    public async Task<IActionResult> GetUserActivity(string userId, [FromQuery] int days = 30)
    {
        try
        {
            // Limit to 90 days max
            days = Math.Min(days, 90);

            // Check if user can view this user's activity
            if (!User.IsInRole("super_admin") && !User.IsInRole("admin"))
            {
                var currentUserId = User.FindFirst("sub")?.Value ?? User.FindFirst("user_id")?.Value;
                if (userId != currentUserId)
                {
                    return Forbid();
                }
            }

            var activity = await _auditService.GetUserActivityAsync(userId, days);
            return Ok(activity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user activity: {UserId}", userId);
            return StatusCode(500, new { message = "حدث خطأ أثناء استرجاع نشاط المستخدم" });
        }
    }

    /// <summary>
    /// الحصول على تاريخ كيان معين
    /// </summary>
    [HttpGet("entities/{entityType}/{entityId}/history")]
    [ProducesResponseType(typeof(IEnumerable<AuditLogEntry>), 200)]
    public async Task<IActionResult> GetEntityHistory(string entityType, string entityId)
    {
        try
        {
            var history = await _auditService.GetEntityHistoryAsync(entityType, entityId);

            // Filter by tenant if not admin
            if (!User.IsInRole("super_admin") && !User.IsInRole("admin"))
            {
                var userTenantId = User.FindFirst("tenant_id")?.Value;
                history = history.Where(h => h.TenantId == userTenantId);
            }

            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving entity history: {EntityType}/{EntityId}", entityType, entityId);
            return StatusCode(500, new { message = "حدث خطأ أثناء استرجاع تاريخ الكيان" });
        }
    }

    /// <summary>
    /// الحصول على ملخص النشاط اليومي
    /// </summary>
    [HttpGet("summary/daily")]
    [ProducesResponseType(typeof(IEnumerable<AuditSummary>), 200)]
    public async Task<IActionResult> GetDailyActivitySummary(
        [FromQuery] string? tenantId,
        [FromQuery] int days = 30)
    {
        try
        {
            // Limit to 365 days max
            days = Math.Min(days, 365);

            // Enforce tenant isolation
            if (!User.IsInRole("super_admin") && !User.IsInRole("admin"))
            {
                tenantId = User.FindFirst("tenant_id")?.Value;
            }

            var summary = await _auditService.GetDailyActivitySummaryAsync(tenantId, days);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving daily activity summary");
            return StatusCode(500, new { message = "حدث خطأ أثناء استرجاع الملخص اليومي" });
        }
    }

    /// <summary>
    /// الحصول على قائمة الإجراءات المميزة
    /// </summary>
    [HttpGet("actions")]
    [ProducesResponseType(typeof(IEnumerable<string>), 200)]
    public async Task<IActionResult> GetDistinctActions([FromQuery] string? tenantId)
    {
        try
        {
            // Enforce tenant isolation
            if (!User.IsInRole("super_admin") && !User.IsInRole("admin"))
            {
                tenantId = User.FindFirst("tenant_id")?.Value;
            }

            var actions = await _auditService.GetDistinctActionsAsync(tenantId);
            return Ok(actions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving distinct actions");
            return StatusCode(500, new { message = "حدث خطأ" });
        }
    }

    /// <summary>
    /// الحصول على قائمة أنواع الكيانات المميزة
    /// </summary>
    [HttpGet("entity-types")]
    [ProducesResponseType(typeof(IEnumerable<string>), 200)]
    public async Task<IActionResult> GetDistinctEntityTypes([FromQuery] string? tenantId)
    {
        try
        {
            // Enforce tenant isolation
            if (!User.IsInRole("super_admin") && !User.IsInRole("admin"))
            {
                tenantId = User.FindFirst("tenant_id")?.Value;
            }

            var entityTypes = await _auditService.GetDistinctEntityTypesAsync(tenantId);
            return Ok(entityTypes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving distinct entity types");
            return StatusCode(500, new { message = "حدث خطأ" });
        }
    }

    /// <summary>
    /// تصدير سجلات التدقيق إلى CSV
    /// </summary>
    [HttpGet("export")]
    [ProducesResponseType(typeof(FileResult), 200)]
    public async Task<IActionResult> ExportAuditLogs([FromQuery] AuditLogQuery query)
    {
        try
        {
            // Enforce tenant isolation
            if (!User.IsInRole("super_admin") && !User.IsInRole("admin"))
            {
                query.TenantId = User.FindFirst("tenant_id")?.Value;
            }

            // Limit export size
            query.PageSize = 10000;
            query.Page = 1;

            var result = await _auditService.GetAuditLogsAsync(query);

            // Generate CSV
            var csv = GenerateCsv(result.Items);
            var bytes = System.Text.Encoding.UTF8.GetBytes(csv);
            var fileName = $"audit_logs_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";

            return File(bytes, "text/csv", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting audit logs");
            return StatusCode(500, new { message = "حدث خطأ أثناء التصدير" });
        }
    }

    /// <summary>
    /// الحصول على ملخص وحدات النظام
    /// </summary>
    [HttpGet("modules/summary")]
    [ProducesResponseType(typeof(object), 200)]
    [Authorize(Roles = "super_admin,admin")]
    public async Task<IActionResult> GetModulesSummary([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        try
        {
            var stats = await _auditService.GetStatisticsAsync(null, from, to);

            var moduleSummary = Enum.GetValues<AuditModule>()
                .Select(m => new
                {
                    Module = m.ToString(),
                    ModuleId = (int)m,
                    Count = stats.ModuleCounts.TryGetValue(m.ToString(), out var count) ? count : 0
                })
                .OrderByDescending(m => m.Count)
                .ToList();

            return Ok(new
            {
                totalActions = stats.TotalEntries,
                uniqueUsers = stats.UniqueUsers,
                modules = moduleSummary
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving modules summary");
            return StatusCode(500, new { message = "حدث خطأ" });
        }
    }

    private static string GenerateCsv(IEnumerable<AuditLogEntry> entries)
    {
        var sb = new System.Text.StringBuilder();

        // Header
        sb.AppendLine("Id,Timestamp,UserId,UserName,Action,EntityType,EntityId,Module,IpAddress,TenantId,CorrelationId");

        // Data
        foreach (var entry in entries)
        {
            sb.AppendLine(string.Join(",",
                entry.Id,
                entry.Timestamp.ToString("yyyy-MM-dd HH:mm:ss"),
                EscapeCsv(entry.UserId),
                EscapeCsv(entry.UserName),
                EscapeCsv(entry.Action),
                EscapeCsv(entry.EntityType),
                EscapeCsv(entry.EntityId),
                entry.Module?.ToString() ?? "",
                EscapeCsv(entry.IpAddress),
                EscapeCsv(entry.TenantId),
                EscapeCsv(entry.CorrelationId)
            ));
        }

        return sb.ToString();
    }

    private static string EscapeCsv(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return "";

        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }

        return value;
    }
}
