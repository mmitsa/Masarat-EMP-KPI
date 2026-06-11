using Masarat.EPM.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Masarat.EPM.API.Controllers;

[ApiController]
[Route("api/epm")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly EPMDbContext _context;

    public DashboardController(EPMDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// ملخص لوحة معلومات قياس الأداء - بيانات حقيقية من قاعدة البيانات
    /// </summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var currentYear = DateTime.UtcNow.Year;

        // عدد الموظفين المسجلين في ميثاقات الأداء
        var totalEmployees = await _context.PerformanceCharters
            .Where(c => c.IsActive && c.FiscalYear == currentYear)
            .Select(c => c.EmployeeId)
            .Distinct()
            .CountAsync();

        // الميثاقات المكتملة
        var chartersCompleted = await _context.PerformanceCharters
            .Where(c => c.IsActive && c.FiscalYear == currentYear
                && (c.Status == "Completed" || c.Status == "FinalEvaluationCompleted"))
            .CountAsync();

        // الميثاقات المعلقة (Draft أو قيد المراجعة)
        var pendingCharters = await _context.PerformanceCharters
            .Where(c => c.IsActive && c.FiscalYear == currentYear
                && (c.Status == "Draft" || c.Status == "PendingApproval"
                    || c.Status == "PendingEmployeeSignature" || c.Status == "PendingManagerApproval"))
            .CountAsync();

        // متوسط التقييم (من الأهداف المقيّمة)
        var averageScore = await _context.Goals
            .Where(g => g.Charter != null && g.Charter.IsActive
                && g.Charter.FiscalYear == currentYear && g.ActualScore > 0)
            .AverageAsync(g => (double?)g.ActualScore) ?? 0;

        // الأهداف المحققة
        var goalsAchieved = await _context.Goals
            .Where(g => g.Charter != null && g.Charter.IsActive
                && g.Charter.FiscalYear == currentYear
                && (g.Status == "Achieved" || g.CompletionPercentage >= 100))
            .CountAsync();

        // المراجعات القادمة (ميثاقات في حالة تحتاج مراجعة نصف سنوية)
        var upcomingReviews = await _context.PerformanceCharters
            .Where(c => c.IsActive && c.FiscalYear == currentYear
                && (c.Status == "Active" || c.Status == "Approved"
                    || c.Status == "PendingMidYearReview"))
            .CountAsync();

        // توزيع الحالات
        var statusDistribution = await _context.PerformanceCharters
            .Where(c => c.IsActive && c.FiscalYear == currentYear)
            .GroupBy(c => c.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        // إجمالي الميثاقات والأهداف
        var totalCharters = await _context.PerformanceCharters
            .Where(c => c.IsActive && c.FiscalYear == currentYear)
            .CountAsync();

        var totalGoals = await _context.Goals
            .Where(g => g.Charter != null && g.Charter.IsActive && g.Charter.FiscalYear == currentYear)
            .CountAsync();

        return Ok(new
        {
            TotalEmployees = totalEmployees,
            ChartersCompleted = chartersCompleted,
            PendingCharters = pendingCharters,
            AverageScore = Math.Round(averageScore, 2),
            GoalsAchieved = goalsAchieved,
            UpcomingReviews = upcomingReviews,
            TotalCharters = totalCharters,
            TotalGoals = totalGoals,
            FiscalYear = currentYear,
            StatusDistribution = statusDistribution.ToDictionary(s => s.Status ?? "Unknown", s => s.Count),
            LastUpdated = DateTime.UtcNow
        });
    }

    [HttpGet("health")]
    public IActionResult Health() => Ok(new { Status = "Healthy", Service = "EPM API" });
}
