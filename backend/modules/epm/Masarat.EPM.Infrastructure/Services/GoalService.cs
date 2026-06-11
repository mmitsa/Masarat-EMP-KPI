using Masarat.EPM.Application.DTOs;
using Masarat.EPM.Application.Services;
using Masarat.EPM.Domain.Entities;
using Masarat.EPM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Masarat.EPM.Infrastructure.Services;

/// <summary>
/// تنفيذ خدمة الأهداف
/// </summary>
public class GoalService : IGoalService
{
    private readonly EPMDbContext _context;
    private readonly ILogger<GoalService> _logger;

    public GoalService(EPMDbContext context, ILogger<GoalService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<GoalDto>> GetAllGoalsAsync()
    {
        var goals = await _context.Goals
            .Where(g => g.IsActive)
            .OrderBy(g => g.CharterId)
            .ThenBy(g => g.OrderIndex)
            .ToListAsync();

        return goals.Select(MapToDto);
    }

    public async Task<GoalDto?> GetGoalByIdAsync(int id)
    {
        var goal = await _context.Goals
            .FirstOrDefaultAsync(g => g.GoalId == id && g.IsActive);

        return goal != null ? MapToDto(goal) : null;
    }

    public async Task<IEnumerable<GoalDto>> GetGoalsByEmployeeAsync(int employeeId)
    {
        var goals = await _context.Goals
            .Include(g => g.Charter)
            .Where(g => g.Charter != null && g.Charter.EmployeeId == employeeId && g.IsActive)
            .OrderByDescending(g => g.Charter!.FiscalYear)
            .ThenBy(g => g.OrderIndex)
            .ToListAsync();

        return goals.Select(MapToDto);
    }

    public async Task<IEnumerable<GoalDto>> GetGoalsByCharterAsync(int charterId)
    {
        var goals = await _context.Goals
            .Where(g => g.CharterId == charterId && g.IsActive)
            .OrderBy(g => g.OrderIndex)
            .ToListAsync();

        return goals.Select(MapToDto);
    }

    public async Task<GoalDto> CreateGoalAsync(CreateGoalDto dto)
    {
        // Validate charter exists
        var charterExists = await _context.PerformanceCharters
            .AnyAsync(c => c.CharterId == dto.CharterId && c.IsActive);

        if (!charterExists)
        {
            throw new InvalidOperationException("الميثاق غير موجود");
        }

        // Validate total weight doesn't exceed 100
        var currentWeight = await _context.Goals
            .Where(g => g.CharterId == dto.CharterId && g.IsActive)
            .SumAsync(g => g.Weight);

        if (currentWeight + dto.Weight > 100)
        {
            throw new InvalidOperationException($"مجموع أوزان الأهداف ({currentWeight + dto.Weight}) يتجاوز 100");
        }

        var goal = new Goal
        {
            CharterId = dto.CharterId,
            OrderIndex = dto.OrderIndex,
            Title = dto.Title,
            Description = dto.Description,
            Weight = dto.Weight,
            MeasurableIndicators = dto.MeasurableIndicators,
            TimeFrame = dto.TimeFrame,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.Goals.Add(goal);
        await _context.SaveChangesAsync();

        _logger.LogInformation("تم إنشاء هدف جديد {GoalId} للميثاق {CharterId}", goal.GoalId, dto.CharterId);

        return MapToDto(goal);
    }

    public async Task<GoalDto> UpdateGoalAsync(int id, CreateGoalDto dto)
    {
        var goal = await GetGoalEntityAsync(id);

        // Validate weight if changed
        if (goal.Weight != dto.Weight)
        {
            var otherGoalsWeight = await _context.Goals
                .Where(g => g.CharterId == goal.CharterId && g.GoalId != id && g.IsActive)
                .SumAsync(g => g.Weight);

            if (otherGoalsWeight + dto.Weight > 100)
            {
                throw new InvalidOperationException($"مجموع أوزان الأهداف ({otherGoalsWeight + dto.Weight}) يتجاوز 100");
            }
        }

        goal.Title = dto.Title;
        goal.Description = dto.Description;
        goal.Weight = dto.Weight;
        goal.MeasurableIndicators = dto.MeasurableIndicators;
        goal.TimeFrame = dto.TimeFrame;
        goal.OrderIndex = dto.OrderIndex;
        goal.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("تم تحديث الهدف {GoalId}", id);

        return MapToDto(goal);
    }

    public async Task UpdateGoalProgressAsync(int id, UpdateGoalProgressDto dto)
    {
        var goal = await GetGoalEntityAsync(id);
        goal.UpdateProgress(dto.CompletionPercentage);
        await _context.SaveChangesAsync();

        _logger.LogInformation("تم تحديث نسبة إنجاز الهدف {GoalId} إلى {Progress}%", id, dto.CompletionPercentage);
    }

    public async Task EvaluateGoalAsync(int id, EvaluateGoalDto dto)
    {
        var goal = await GetGoalEntityAsync(id);
        goal.Evaluate(dto.Score, dto.EvaluationNotes);
        await _context.SaveChangesAsync();

        _logger.LogInformation("تم تقييم الهدف {GoalId} بدرجة {Score}", id, dto.Score);
    }

    public async Task DeleteGoalAsync(int id)
    {
        var goal = await GetGoalEntityAsync(id);
        goal.IsActive = false;
        goal.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("تم حذف الهدف {GoalId}", id);
    }

    public async Task<bool> ValidateGoalWeightsAsync(int charterId)
    {
        var totalWeight = await _context.Goals
            .Where(g => g.CharterId == charterId && g.IsActive)
            .SumAsync(g => g.Weight);

        return totalWeight == 100;
    }

    public async Task<Dictionary<string, object>> GetGoalStatisticsAsync(int charterId)
    {
        var goals = await _context.Goals
            .Where(g => g.CharterId == charterId && g.IsActive)
            .ToListAsync();

        return new Dictionary<string, object>
        {
            ["TotalGoals"] = goals.Count,
            ["TotalWeight"] = goals.Sum(g => g.Weight),
            ["CompletedGoals"] = goals.Count(g => g.Status == "Completed"),
            ["InProgressGoals"] = goals.Count(g => g.Status == "InProgress"),
            ["PendingGoals"] = goals.Count(g => g.Status == "Pending"),
            ["AverageProgress"] = goals.Any() ? goals.Average(g => g.CompletionPercentage) : 0,
            ["SMARTCompliant"] = goals.Count(g => g.IsSMARTCompliant()),
            ["EvaluatedGoals"] = goals.Count(g => g.ActualScore.HasValue),
            ["AverageScore"] = goals.Where(g => g.ActualScore.HasValue).Any()
                ? goals.Where(g => g.ActualScore.HasValue).Average(g => g.ActualScore!.Value)
                : 0
        };
    }

    private async Task<Goal> GetGoalEntityAsync(int id)
    {
        var goal = await _context.Goals
            .FirstOrDefaultAsync(g => g.GoalId == id && g.IsActive);

        if (goal == null)
        {
            throw new InvalidOperationException("الهدف غير موجود");
        }

        return goal;
    }

    private static GoalDto MapToDto(Goal goal)
    {
        return new GoalDto
        {
            GoalId = goal.GoalId,
            CharterId = goal.CharterId,
            OrderIndex = goal.OrderIndex,
            Title = goal.Title,
            Description = goal.Description,
            Weight = goal.Weight,
            MeasurableIndicators = goal.MeasurableIndicators,
            TimeFrame = goal.TimeFrame,
            Status = goal.Status,
            CompletionPercentage = goal.CompletionPercentage,
            ActualScore = goal.ActualScore,
            WeightedScore = goal.WeightedScore,
            EvaluationNotes = goal.EvaluationNotes,
            EvaluatedDate = goal.EvaluatedDate,
            IsSMARTCompliant = goal.IsSMARTCompliant()
        };
    }
}
