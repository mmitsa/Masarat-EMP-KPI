using MassTransit;
using Masarat.EPM.Domain.Entities;
using Masarat.Events.HR;
using Masarat.EPM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Masarat.EPM.API.Consumers;

/// <summary>
/// مستهلك أحداث تحديث وإنهاء خدمة الموظفين لنظام تقييم الأداء (EPM)
/// يُحدِّث بيانات ميثاق الأداء (PerformanceCharter) عند تغيير بيانات الموظف أو المدير
/// </summary>
public class EmployeeUpdatedConsumer :
    IConsumer<EmployeeUpdatedEvent>,
    IConsumer<EmployeeTerminatedEvent>
{
    private readonly EPMDbContext _db;
    private readonly ILogger<EmployeeUpdatedConsumer> _logger;

    /// <summary>
    /// حالات الميثاق التي تُعتبر منتهية أو مؤرشفة - لا تُحدَّث
    /// </summary>
    private static readonly HashSet<string> ClosedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Archived",
        "Completed"
    };

    public EmployeeUpdatedConsumer(EPMDbContext db, ILogger<EmployeeUpdatedConsumer> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// معالجة حدث تحديث بيانات موظف
    /// يُحدِّث اسم الموظف في مواثيق الأداء النشطة،
    /// وإذا تغيّر القسم يُحدِّث اسم ومعرف المدير في المواثيق المفتوحة
    /// </summary>
    public async Task Consume(ConsumeContext<EmployeeUpdatedEvent> context)
    {
        var ev = context.Message;

        _logger.LogInformation(
            "EPM: معالجة EmployeeUpdatedEvent للموظف {EmployeeId}",
            ev.EmployeeId);

        // ── 1. تحديث اسم الموظف في مواثيقه النشطة ──────────────────────────
        await UpdateEmployeeSnapshotAsync(ev, context.CancellationToken);

        if (!string.IsNullOrWhiteSpace(ev.FullName))
        {
            var employeeCharters = await _db.PerformanceCharters
                .IgnoreQueryFilters()
                .Where(c => c.TenantId == ev.TenantId && c.EmployeeId == ev.EmployeeId && !ClosedStatuses.Contains(c.Status))
                .ToListAsync();

            if (employeeCharters.Count > 0)
            {
                foreach (var charter in employeeCharters)
                {
                    charter.EmployeeName = ev.FullName;
                    charter.UpdatedAt = DateTime.UtcNow;
                }

                _db.PerformanceCharters.UpdateRange(employeeCharters);
                await _db.SaveChangesAsync();

                _logger.LogInformation(
                    "EPM: تم تحديث اسم الموظف {EmployeeId} في {Count} ميثاق أداء نشط",
                    ev.EmployeeId, employeeCharters.Count);
            }
        }

        // ── 2. تحديث بيانات المدير في مواثيق موظفيه عند تغيير القسم ──────────
        // إذا تغيّر قسم هذا الموظف، فمن المحتمل أن يكون مديراً لموظفين آخرين
        // نُحدِّث حقلَي ManagerId/ManagerName في المواثيق التي يكون هو مديراً لها
        if (ev.DepartmentId.HasValue || !string.IsNullOrWhiteSpace(ev.FullName))
        {
            var managerCharters = await _db.PerformanceCharters
                .IgnoreQueryFilters()
                .Where(c => c.TenantId == ev.TenantId && c.ManagerId == ev.EmployeeId && !ClosedStatuses.Contains(c.Status))
                .ToListAsync();

            if (managerCharters.Count > 0)
            {
                foreach (var charter in managerCharters)
                {
                    if (!string.IsNullOrWhiteSpace(ev.FullName))
                    {
                        charter.ManagerName = ev.FullName;
                    }

                    charter.UpdatedAt = DateTime.UtcNow;
                }

                _db.PerformanceCharters.UpdateRange(managerCharters);
                await _db.SaveChangesAsync();

                _logger.LogInformation(
                    "EPM: تم تحديث بيانات المدير {ManagerId} في {Count} ميثاق أداء نشط",
                    ev.EmployeeId, managerCharters.Count);
            }
        }
    }

    /// <summary>
    /// معالجة حدث إنهاء خدمة موظف
    /// لا توجد إجراءات تلقائية لإغلاق المواثيق - يتم تسجيل التحذير فقط
    /// لأن مواثيق الأداء المفتوحة تحتاج مراجعة يدوية من المدير
    /// </summary>
    public async Task Consume(ConsumeContext<EmployeeTerminatedEvent> context)
    {
        var ev = context.Message;

        _logger.LogInformation(
            "EPM: معالجة EmployeeTerminatedEvent للموظف {EmployeeId}",
            ev.EmployeeId);

        // البحث عن مواثيق أداء مفتوحة لهذا الموظف
        var openCharters = await _db.PerformanceCharters
            .IgnoreQueryFilters()
            .Where(c => c.TenantId == ev.TenantId && c.EmployeeId == ev.EmployeeId && !ClosedStatuses.Contains(c.Status))
            .Select(c => new { c.CharterId, c.FiscalYear, c.Status })
            .ToListAsync();

        var snapshot = await _db.EmployeeSnapshots
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(e => e.TenantId == ev.TenantId && e.SourceSystem == "HR" && e.SourceEmployeeId == ev.EmployeeId);

        if (snapshot != null)
        {
            snapshot.EmploymentStatus = "Terminated";
            snapshot.IsActive = false;
            snapshot.IsDeleted = true;
            snapshot.UpdatedAt = DateTime.UtcNow;
            snapshot.LastSyncedAt = DateTime.UtcNow;
            _db.EmployeeSnapshots.Update(snapshot);
            await _db.SaveChangesAsync();
        }

        foreach (var charter in openCharters)
        {
            _logger.LogWarning(
                "EPM: الموظف {EmployeeId} لديه ميثاق أداء مفتوح: CharterId={CharterId}, FiscalYear={FiscalYear}, Status={Status}. " +
                "يلزم مراجعة يدوية من المدير المسؤول بعد إنهاء الخدمة.",
                ev.EmployeeId, charter.CharterId, charter.FiscalYear, charter.Status);
        }

        if (openCharters.Count > 0)
        {
            _logger.LogWarning(
                "EPM: إجمالي المواثيق المفتوحة للموظف المنتهية خدمته {EmployeeId}: {Count}. السبب: {Reason}",
                ev.EmployeeId, openCharters.Count, ev.Reason);
        }
        else
        {
            _logger.LogInformation(
                "EPM: الموظف {EmployeeId} لا يملك مواثيق أداء مفتوحة - لا إجراء مطلوب",
                ev.EmployeeId);
        }

        await Task.CompletedTask;
    }

    private async Task UpdateEmployeeSnapshotAsync(EmployeeUpdatedEvent ev, CancellationToken cancellationToken)
    {
        var snapshot = await _db.EmployeeSnapshots
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(e => e.TenantId == ev.TenantId && e.SourceSystem == "HR" && e.SourceEmployeeId == ev.EmployeeId, cancellationToken);

        if (snapshot == null)
        {
            _logger.LogInformation(
                "EPM: لا توجد نسخة ربط محلية للموظف {EmployeeId}. سيتم إنشاؤها عند المزامنة الكاملة من HR.",
                ev.EmployeeId);
            return;
        }

        if (!string.IsNullOrWhiteSpace(ev.FullName))
        {
            snapshot.NameAr = ev.FullName;
        }

        if (!string.IsNullOrWhiteSpace(ev.Email))
        {
            snapshot.Email = ev.Email;
        }

        if (!string.IsNullOrWhiteSpace(ev.PhoneNumber))
        {
            snapshot.PhoneNumber = ev.PhoneNumber;
        }

        if (ev.DepartmentId.HasValue)
        {
            snapshot.DepartmentId = ev.DepartmentId;
        }

        if (ev.PositionId.HasValue)
        {
            snapshot.PositionId = ev.PositionId;
        }

        snapshot.LastSyncedAt = DateTime.UtcNow;
        snapshot.UpdatedAt = DateTime.UtcNow;
        _db.EmployeeSnapshots.Update(snapshot);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
