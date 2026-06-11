using Masarat.Core.Services;
using Masarat.EPM.Application.DTOs;
using Masarat.EPM.Application.Services;
using Masarat.EPM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Masarat.EPM.Infrastructure.Services;

/// <summary>
/// تنفيذ خدمة التقييمات
/// </summary>
public class EvaluationService : BaseService<EvaluationService>, IEvaluationService
{
    private readonly EPMDbContext _context;

    public EvaluationService(ILogger<EvaluationService> logger, EPMDbContext context)
        : base(logger)
    {
        _context = context;
    }

    public async Task<IEnumerable<EvaluationDto>> GetAllEvaluationsAsync(int? year = null)
    {
        var charters = await _context.PerformanceCharters
            .Include(c => c.Goals)
            .Include(c => c.Competencies)
            .Where(c => !year.HasValue || c.FiscalYear == year.Value)
            .Where(c => c.Status == "Submitted" || c.Status == "Approved" || c.Status == "Rejected")
            .OrderByDescending(c => c.FiscalYear)
            .ToListAsync();

        return charters.Select(c => MapToEvaluationDto(c));
    }

    public async Task<EvaluationDto?> GetEvaluationByIdAsync(int id)
    {
        var charter = await _context.PerformanceCharters
            .Include(c => c.Goals)
            .Include(c => c.Competencies)
            .FirstOrDefaultAsync(c => c.CharterId == id);

        return charter != null ? MapToEvaluationDto(charter) : null;
    }

    public async Task<IEnumerable<EvaluationDto>> GetEvaluationsByEmployeeAsync(int employeeId)
    {
        var charters = await _context.PerformanceCharters
            .Include(c => c.Goals)
            .Include(c => c.Competencies)
            .Where(c => c.EmployeeId == employeeId)
            .OrderByDescending(c => c.FiscalYear)
            .ToListAsync();

        return charters.Select(c => MapToEvaluationDto(c));
    }

    public async Task<IEnumerable<EvaluationDto>> GetEvaluationsByPeriodAsync(string period)
    {
        var year = int.Parse(period);
        return await GetAllEvaluationsAsync(year);
    }

    public async Task<IEnumerable<EvaluationDto>> GetPendingEvaluationsAsync()
    {
        var charters = await _context.PerformanceCharters
            .Include(c => c.Goals)
            .Include(c => c.Competencies)
            .Where(c => c.Status == "Submitted")
            .OrderByDescending(c => c.FiscalYear)
            .ToListAsync();

        return charters.Select(c => MapToEvaluationDto(c));
    }

    public async Task<EvaluationDto> CreateEvaluationAsync(CreateEvaluationDto dto)
    {
        var charter = await _context.PerformanceCharters
            .FirstOrDefaultAsync(c => c.EmployeeId == dto.EmployeeId && c.FiscalYear == dto.Year);

        if (charter == null)
        {
            throw new InvalidOperationException("ميثاق الأداء غير موجود");
        }

        // Update charter with evaluation data
        charter.Status = "Draft";
        charter.TotalScore = dto.OverallScore;
        charter.ManagerComments = dto.Comments;
        charter.UpdatedAt = DateTime.UtcNow;
        charter.UpdatedBy = dto.EvaluatorId?.ToString();

        await _context.SaveChangesAsync();

        Logger.LogInformation("تم إنشاء تقييم للموظف: {EmployeeId}", dto.EmployeeId);

        return MapToEvaluationDto(charter);
    }

    public async Task<EvaluationDto> UpdateEvaluationAsync(int id, UpdateEvaluationDto dto)
    {
        var charter = await GetCharterAsync(id);

        if (dto.OverallScore.HasValue)
            charter.TotalScore = dto.OverallScore.Value;

        if (!string.IsNullOrEmpty(dto.ManagerComments))
            charter.ManagerComments = dto.ManagerComments;

        charter.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        Logger.LogInformation("تم تحديث التقييم: {EvaluationId}", id);

        return MapToEvaluationDto(charter);
    }

    public async Task SubmitEvaluationAsync(int id, SubmitEvaluationDto? dto = null)
    {
        var charter = await GetCharterAsync(id);
        charter.Status = "Submitted";
        charter.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        Logger.LogInformation("تم تقديم التقييم للمراجعة: {EvaluationId}", id);
    }

    public async Task ApproveEvaluationAsync(int id, ApproveEvaluationDto? dto = null)
    {
        var charter = await GetCharterAsync(id);
        charter.Status = "Approved";
        charter.ManagerApprovedDate = DateTime.UtcNow;
        charter.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        Logger.LogInformation("تم اعتماد التقييم: {EvaluationId}", id);
    }

    public async Task RejectEvaluationAsync(int id, RejectEvaluationDto dto)
    {
        var charter = await GetCharterAsync(id);
        charter.Status = "Rejected";
        charter.AppealNotes = dto.Reason;
        charter.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        Logger.LogInformation("تم رفض التقييم: {EvaluationId} - السبب: {Reason}", id, dto.Reason);
    }

    public async Task DeleteEvaluationAsync(int id)
    {
        var charter = await GetCharterAsync(id);
        charter.IsActive = false;
        charter.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        Logger.LogInformation("تم حذف التقييم: {EvaluationId}", id);
    }

    public async Task<Dictionary<string, object>> GetEvaluationStatisticsAsync(int year)
    {
        var charters = await _context.PerformanceCharters
            .Where(c => c.FiscalYear == year)
            .ToListAsync();

        var total = charters.Count;
        var approved = charters.Count(c => c.Status == "Approved");
        var pending = charters.Count(c => c.Status == "Submitted");
        var avgScore = charters.Where(c => c.TotalScore.HasValue).Select(c => c.TotalScore!.Value).DefaultIfEmpty(0m).Average();

        return new Dictionary<string, object>
        {
            ["Year"] = year,
            ["TotalEvaluations"] = total,
            ["ApprovedCount"] = approved,
            ["PendingCount"] = pending,
            ["RejectedCount"] = charters.Count(c => c.Status == "Rejected"),
            ["AverageScore"] = Math.Round(avgScore, 2),
            ["CompletionRate"] = total > 0 ? Math.Round((double)approved / total * 100, 1) : 0
        };
    }

    private async Task<Domain.Entities.PerformanceCharter> GetCharterAsync(int id)
    {
        var charter = await _context.PerformanceCharters
            .Include(c => c.Goals)
            .Include(c => c.Competencies)
            .FirstOrDefaultAsync(c => c.CharterId == id);

        if (charter == null)
        {
            throw new InvalidOperationException("التقييم غير موجود");
        }

        return charter;
    }

    private static EvaluationDto MapToEvaluationDto(Domain.Entities.PerformanceCharter charter)
    {
        var goalsScore = charter.GoalsScore ?? 
            (charter.Goals?.Where(g => g.ActualScore.HasValue).Select(g => g.WeightedScore ?? 0m).Sum() ?? 0m);
        var competenciesScore = charter.CompetenciesScore ?? 
            (charter.Competencies?.Select(c => c.WeightedScore ?? 0m).Sum() ?? 0m);

        return new EvaluationDto
        {
            EvaluationId = charter.CharterId,
            EmployeeId = charter.EmployeeId,
            EmployeeName = charter.EmployeeName ?? "غير محدد",
            Department = string.Empty, // Not available in charter
            Year = charter.FiscalYear,
            ReviewType = charter.Status == "MidYearReview" ? "منتصف العام" : "نهاية العام",
            Status = charter.Status ?? "Draft",
            GoalsScore = goalsScore,
            CompetenciesScore = competenciesScore,
            FinalScore = charter.TotalScore ?? (goalsScore * 0.7m + competenciesScore * 0.3m),
            ManagerComments = charter.ManagerComments,
            EmployeeComments = charter.FinalEvaluationNotes,
            SubmittedDate = charter.ManagerApprovedDate,
            ApprovedDate = charter.FinalEvaluationDate,
            CreatedAt = charter.CreatedAt
        };
    }
}
