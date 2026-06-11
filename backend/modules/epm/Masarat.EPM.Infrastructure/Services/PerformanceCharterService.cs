using Masarat.EPM.Application.DTOs;
using Masarat.EPM.Application.Services;
using Masarat.EPM.Domain.Entities;
using Masarat.EPM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Masarat.EPM.Infrastructure.Services;

/// <summary>
/// تنفيذ خدمة ميثاق الأداء
/// </summary>
public class PerformanceCharterService : IPerformanceCharterService
{
    private readonly EPMDbContext _context;
    private readonly ILogger<PerformanceCharterService> _logger;

    public PerformanceCharterService(EPMDbContext context, ILogger<PerformanceCharterService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<PerformanceCharterDto>> GetAllChartersAsync()
    {
        var charters = await _context.PerformanceCharters
            .Where(c => c.IsActive)
            .Include(c => c.Goals)
            .Include(c => c.Competencies)
            .OrderByDescending(c => c.FiscalYear)
            .ThenBy(c => c.EmployeeName)
            .ToListAsync();

        return charters.Select(MapToDto);
    }

    public async Task<PerformanceCharterDto?> GetCharterByIdAsync(int id)
    {
        var charter = await _context.PerformanceCharters
            .Include(c => c.Goals)
            .Include(c => c.Competencies)
            .FirstOrDefaultAsync(c => c.CharterId == id && c.IsActive);

        return charter != null ? MapToDto(charter) : null;
    }

    public async Task<PerformanceCharterDto?> GetCharterByEmployeeAndYearAsync(int employeeId, int fiscalYear)
    {
        var charter = await _context.PerformanceCharters
            .Include(c => c.Goals)
            .Include(c => c.Competencies)
            .FirstOrDefaultAsync(c => c.EmployeeId == employeeId && c.FiscalYear == fiscalYear && c.IsActive);

        return charter != null ? MapToDto(charter) : null;
    }

    public async Task<IEnumerable<PerformanceCharterDto>> GetChartersByManagerAsync(int managerId)
    {
        var charters = await _context.PerformanceCharters
            .Where(c => c.ManagerId == managerId && c.IsActive)
            .Include(c => c.Goals)
            .Include(c => c.Competencies)
            .OrderByDescending(c => c.FiscalYear)
            .ToListAsync();

        return charters.Select(MapToDto);
    }

    public async Task<IEnumerable<PerformanceCharterDto>> GetChartersByYearAsync(int fiscalYear)
    {
        var charters = await _context.PerformanceCharters
            .Where(c => c.FiscalYear == fiscalYear && c.IsActive)
            .Include(c => c.Goals)
            .Include(c => c.Competencies)
            .OrderBy(c => c.EmployeeName)
            .ToListAsync();

        return charters.Select(MapToDto);
    }

    public async Task<IEnumerable<PerformanceCharterDto>> GetDueForMidYearReviewAsync(int fiscalYear)
    {
        var charters = await _context.PerformanceCharters
            .Where(c => c.FiscalYear == fiscalYear && c.IsActive && c.Status == "Active" && !c.MidYearReviewDate.HasValue)
            .Include(c => c.Goals)
            .ToListAsync();

        return charters.Where(c => c.IsMidYearReviewDue()).Select(MapToDto);
    }

    public async Task<IEnumerable<PerformanceCharterDto>> GetDueForFinalEvaluationAsync(int fiscalYear)
    {
        var charters = await _context.PerformanceCharters
            .Where(c => c.FiscalYear == fiscalYear && c.IsActive && c.Status == "MidYearReview" && !c.FinalEvaluationDate.HasValue)
            .Include(c => c.Goals)
            .ToListAsync();

        return charters.Where(c => c.IsFinalEvaluationDue()).Select(MapToDto);
    }

    public async Task<PerformanceCharterDto> CreateCharterAsync(CreateCharterDto dto)
    {
        // Check if charter already exists for this employee and year
        var existing = await _context.PerformanceCharters
            .AnyAsync(c => c.EmployeeId == dto.EmployeeId && c.FiscalYear == dto.FiscalYear && c.IsActive);

        if (existing)
        {
            throw new InvalidOperationException($"يوجد ميثاق أداء للموظف {dto.EmployeeName} للسنة {dto.FiscalYear}");
        }

        var charter = new PerformanceCharter
        {
            EmployeeId = dto.EmployeeId,
            EmployeeNationalId = dto.EmployeeNationalId,
            EmployeeName = dto.EmployeeName,
            JobTitle = dto.JobTitle,
            JobNumber = dto.JobNumber,
            AgencyName = dto.AgencyName,
            DepartmentName = dto.DepartmentName,
            JobCategory = OfficialPerformanceStandards.NormalizeJobCategory(dto.JobCategory),
            ManagerId = dto.ManagerId,
            ManagerName = dto.ManagerName,
            FiscalYear = dto.FiscalYear,
            Status = "Draft",
            CreatedAt = DateTime.UtcNow
        };

        _context.PerformanceCharters.Add(charter);
        await _context.SaveChangesAsync();

        var standardCompetencies = OfficialPerformanceStandards.GetCompetencies(charter.JobCategory);
        foreach (var competencyStandard in standardCompetencies)
        {
            _context.Competencies.Add(new Competency
            {
                CharterId = charter.CharterId,
                CompetencyType = competencyStandard.Id,
                NameAr = competencyStandard.Name,
                Weight = competencyStandard.Weight,
                Description = string.Join(Environment.NewLine, competencyStandard.Behaviors),
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("تم إنشاء ميثاق أداء جديد للموظف {EmployeeName} للسنة {Year}", dto.EmployeeName, dto.FiscalYear);

        return MapToDto(charter);
    }

    public async Task SignCharterByEmployeeAsync(int charterId)
    {
        var charter = await GetCharterEntityAsync(charterId);
        charter.SignByEmployee();
        await _context.SaveChangesAsync();

        _logger.LogInformation("تم توقيع الميثاق {CharterId} من قبل الموظف", charterId);
    }

    public async Task ApproveCharterByManagerAsync(int charterId)
    {
        var charter = await GetCharterEntityAsync(charterId);
        charter.ApproveByManager();
        await _context.SaveChangesAsync();

        _logger.LogInformation("تمت الموافقة على الميثاق {CharterId} من قبل المدير", charterId);
    }

    public async Task PerformMidYearReviewAsync(int charterId, MidYearReviewDto dto)
    {
        var charter = await GetCharterEntityAsync(charterId);
        charter.PerformMidYearReview(dto.ReviewNotes);
        await _context.SaveChangesAsync();

        _logger.LogInformation("تمت المراجعة نصف السنوية للميثاق {CharterId}", charterId);
    }

    public async Task CompleteFinalEvaluationAsync(int charterId, FinalEvaluationDto dto)
    {
        var charter = await _context.PerformanceCharters
            .Include(c => c.Goals)
            .Include(c => c.Competencies)
            .FirstOrDefaultAsync(c => c.CharterId == charterId && c.IsActive);

        if (charter == null)
        {
            throw new InvalidOperationException("الميثاق غير موجود");
        }

        // Calculate goals score
        var goalsWithScores = charter.Goals.Where(g => g.ActualScore.HasValue).ToList();
        if (goalsWithScores.Any())
        {
            charter.GoalsScore = goalsWithScores.Sum(g => g.WeightedScore ?? 0);
        }

        // Calculate competencies score
        var competenciesWithScores = charter.Competencies.Where(c => c.ScorePercentage.HasValue).ToList();
        if (competenciesWithScores.Any())
        {
            charter.CompetenciesScore = competenciesWithScores.Sum(c => c.WeightedScore ?? 0);
        }

        // Calculate total score
        charter.CalculateTotalScore(dto.GoalsWeight, dto.CompetenciesWeight);

        // Complete final evaluation
        charter.CompleteFinalEvaluation(dto.EvaluationNotes ?? "");

        await _context.SaveChangesAsync();

        _logger.LogInformation("تم إكمال التقييم النهائي للميثاق {CharterId} بدرجة {Score}", charterId, charter.TotalScore);
    }

    public async Task FileAppealAsync(int charterId, AppealDto dto)
    {
        var charter = await GetCharterEntityAsync(charterId);
        charter.FileAppeal(dto.AppealNotes);
        await _context.SaveChangesAsync();

        _logger.LogInformation("تم تقديم تظلم للميثاق {CharterId}", charterId);
    }

    public async Task ProcessAppealAsync(int charterId, ProcessAppealDto dto)
    {
        var charter = await GetCharterEntityAsync(charterId);
        charter.ProcessAppeal(dto.Approved, dto.Reason);
        await _context.SaveChangesAsync();

        _logger.LogInformation("تمت معالجة التظلم للميثاق {CharterId} - {Result}", charterId, dto.Approved ? "قبول" : "رفض");
    }

    public async Task DeleteCharterAsync(int id)
    {
        var charter = await GetCharterEntityAsync(id);
        charter.IsActive = false;
        charter.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("تم حذف الميثاق {CharterId}", id);
    }

    public async Task<Dictionary<string, int>> GetCharterStatisticsByStatusAsync(int fiscalYear)
    {
        var stats = await _context.PerformanceCharters
            .Where(c => c.FiscalYear == fiscalYear && c.IsActive)
            .GroupBy(c => c.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        return stats.ToDictionary(s => s.Status, s => s.Count);
    }

    private async Task<PerformanceCharter> GetCharterEntityAsync(int id)
    {
        var charter = await _context.PerformanceCharters
            .FirstOrDefaultAsync(c => c.CharterId == id && c.IsActive);

        if (charter == null)
        {
            throw new InvalidOperationException("الميثاق غير موجود");
        }

        return charter;
    }

    private static PerformanceCharterDto MapToDto(PerformanceCharter charter)
    {
        return new PerformanceCharterDto
        {
            CharterId = charter.CharterId,
            EmployeeId = charter.EmployeeId,
            EmployeeNationalId = charter.EmployeeNationalId,
            EmployeeName = charter.EmployeeName,
            JobTitle = charter.JobTitle,
            JobNumber = charter.JobNumber,
            AgencyName = charter.AgencyName,
            DepartmentName = charter.DepartmentName,
            JobCategory = charter.JobCategory,
            ManagerId = charter.ManagerId,
            ManagerName = charter.ManagerName,
            FiscalYear = charter.FiscalYear,
            Status = charter.Status,
            EmployeeSignedDate = charter.EmployeeSignedDate,
            ManagerApprovedDate = charter.ManagerApprovedDate,
            MidYearReviewDate = charter.MidYearReviewDate,
            MidYearReviewNotes = charter.MidYearReviewNotes,
            FinalEvaluationDate = charter.FinalEvaluationDate,
            GoalsScore = charter.GoalsScore,
            CompetenciesScore = charter.CompetenciesScore,
            TotalScore = charter.TotalScore,
            FinalRating = charter.FinalRating,
            FinalEvaluationNotes = charter.FinalEvaluationNotes,
            HasAppeal = charter.HasAppeal,
            AppealDate = charter.AppealDate,
            AppealNotes = charter.AppealNotes,
            AppealStatus = charter.AppealStatus,
            GoalsCount = charter.Goals?.Count ?? 0,
            CompetenciesCount = charter.Competencies?.Count ?? 0,
            IsInPlanningPhase = charter.IsInPlanningPhase(),
            IsActiveCharter = charter.IsActiveCharter(),
            IsMidYearReviewDue = charter.IsMidYearReviewDue(),
            IsFinalEvaluationDue = charter.IsFinalEvaluationDue(),
            CreatedAt = charter.CreatedAt
        };
    }
}
