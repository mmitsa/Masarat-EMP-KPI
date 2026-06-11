using Masarat.Core.Services;
using Masarat.EPM.Application.DTOs;
using Masarat.EPM.Application.Services;
using Masarat.EPM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Masarat.EPM.Infrastructure.Services;

/// <summary>
/// تنفيذ خدمة المراجعات الدورية
/// </summary>
public class ReviewService : BaseService<ReviewService>, IReviewService
{
    private readonly EPMDbContext _context;

    public ReviewService(ILogger<ReviewService> logger, EPMDbContext context)
        : base(logger)
    {
        _context = context;
    }

    public async Task<IEnumerable<ReviewDto>> GetAllReviewsAsync(string? period = null)
    {
        var query = _context.PerformanceCharters
            .Include(c => c.Goals)
            .AsQueryable();

        if (!string.IsNullOrEmpty(period))
        {
            var periodParts = period.Split('-');
            if (periodParts.Length >= 2 && int.TryParse(periodParts[1], out var year))
            {
                query = query.Where(c => c.FiscalYear == year);
            }
        }

        var charters = await query.OrderByDescending(c => c.UpdatedAt).ToListAsync();

        return charters.Select(c => MapToReviewDto(c, period ?? $"Q4-{c.FiscalYear}"));
    }

    public async Task<ReviewDto?> GetReviewByIdAsync(int id)
    {
        var charter = await _context.PerformanceCharters
            .Include(c => c.Goals)
            .FirstOrDefaultAsync(c => c.CharterId == id);

        return charter != null ? MapToReviewDto(charter, $"Q4-{charter.FiscalYear}") : null;
    }

    public async Task<IEnumerable<ReviewDto>> GetReviewsByEmployeeAsync(int employeeId)
    {
        var charters = await _context.PerformanceCharters
            .Include(c => c.Goals)
            .Where(c => c.EmployeeId == employeeId)
            .OrderByDescending(c => c.FiscalYear)
            .ToListAsync();

        return charters.Select(c => MapToReviewDto(c, $"Q4-{c.FiscalYear}"));
    }

    public async Task<IEnumerable<ReviewDto>> GetReviewsByPeriodAsync(string period)
    {
        return await GetAllReviewsAsync(period);
    }

    public async Task<ReviewDto> CreateReviewAsync(CreateReviewDto dto)
    {
        var charter = await _context.PerformanceCharters
            .FirstOrDefaultAsync(c => c.EmployeeId == dto.EmployeeId && c.FiscalYear == dto.Year);

        if (charter == null)
        {
            throw new InvalidOperationException("ميثاق الأداء غير موجود");
        }

        // Log the review creation
        charter.ManagerComments = string.IsNullOrEmpty(charter.ManagerComments)
            ? $"[{dto.Period}] {dto.Notes}"
            : $"{charter.ManagerComments}\n[{dto.Period}] {dto.Notes}";

        charter.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        Logger.LogInformation("تم إنشاء مراجعة للموظف: {EmployeeId} - الفترة: {Period}", dto.EmployeeId, dto.Period);

        return MapToReviewDto(charter, dto.Period);
    }

    public async Task<ReviewDto> UpdateReviewAsync(int id, UpdateReviewDto dto)
    {
        var charter = await GetCharterAsync(id);

        if (!string.IsNullOrEmpty(dto.Notes))
        {
            charter.ManagerComments = dto.Notes;
        }

        charter.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        Logger.LogInformation("تم تحديث المراجعة: {ReviewId}", id);

        return MapToReviewDto(charter, dto.Period ?? $"Q4-{charter.FiscalYear}");
    }

    public async Task CompleteReviewAsync(int id, CompleteReviewDto? dto = null)
    {
        var charter = await GetCharterAsync(id);

        charter.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        Logger.LogInformation("تم إكمال المراجعة: {ReviewId}", id);
    }

    public async Task DeleteReviewAsync(int id)
    {
        var charter = await GetCharterAsync(id);
        charter.IsActive = false;
        charter.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        Logger.LogInformation("تم حذف المراجعة: {ReviewId}", id);
    }

    public async Task<Dictionary<string, object>> GetReviewStatisticsAsync(string period)
    {
        var periodParts = period.Split('-');
        var year = periodParts.Length >= 2 && int.TryParse(periodParts[1], out var y) ? y : DateTime.Now.Year;

        var charters = await _context.PerformanceCharters
            .Where(c => c.FiscalYear == year)
            .ToListAsync();

        var total = charters.Count;
        var completed = charters.Count(c => c.Status == "Approved");
        var avgProgress = charters.Any() ? charters.Average(c => (double)(c.TotalScore ?? 0m)) : 0;

        return new Dictionary<string, object>
        {
            ["Period"] = period,
            ["TotalReviews"] = total,
            ["CompletedCount"] = completed,
            ["PendingCount"] = total - completed,
            ["AverageProgress"] = Math.Round((double)avgProgress, 1),
            ["CompletionRate"] = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0
        };
    }

    private async Task<Domain.Entities.PerformanceCharter> GetCharterAsync(int id)
    {
        var charter = await _context.PerformanceCharters
            .Include(c => c.Goals)
            .FirstOrDefaultAsync(c => c.CharterId == id);

        if (charter == null)
        {
            throw new InvalidOperationException("المراجعة غير موجودة");
        }

        return charter;
    }

    private static ReviewDto MapToReviewDto(Domain.Entities.PerformanceCharter charter, string period)
    {
        return new ReviewDto
        {
            ReviewId = charter.CharterId,
            EmployeeId = charter.EmployeeId,
            EmployeeName = charter.EmployeeName ?? "غير محدد",
            Period = period,
            Status = charter.Status == "Approved" ? "Completed" : "In Progress",
            GoalsScore = charter.GoalsScore,
            CompetenciesScore = charter.CompetenciesScore,
            OverallScore = charter.TotalScore,
            ManagerComments = charter.ManagerComments,
            DevelopmentPlan = charter.FinalEvaluationNotes,
            CompletedDate = charter.FinalEvaluationDate,
            CreatedAt = charter.CreatedAt
        };
    }
}
