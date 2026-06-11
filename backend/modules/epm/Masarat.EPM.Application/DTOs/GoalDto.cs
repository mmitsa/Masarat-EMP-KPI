using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Application.DTOs;

public class GoalDto
{
    public int GoalId { get; set; }
    public int CharterId { get; set; }
    public int OrderIndex { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Weight { get; set; }
    public string? MeasurableIndicators { get; set; }
    public string? TimeFrame { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal CompletionPercentage { get; set; }
    public decimal? ActualScore { get; set; }
    public decimal? WeightedScore { get; set; }
    public string? EvaluationNotes { get; set; }
    public DateTime? EvaluatedDate { get; set; }
    public bool IsSMARTCompliant { get; set; }
}

public class CreateGoalDto
{
    [Required]
    public int CharterId { get; set; }

    [Required]
    public int OrderIndex { get; set; }

    [Required(ErrorMessage = "عنوان الهدف مطلوب")]
    [StringLength(500)]
    public string Title { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; set; }

    [Required]
    [Range(1, 100, ErrorMessage = "الوزن يجب أن يكون بين 1 و 100")]
    public decimal Weight { get; set; }

    [StringLength(1000)]
    public string? MeasurableIndicators { get; set; }

    [StringLength(200)]
    public string? TimeFrame { get; set; }
}

public class UpdateGoalProgressDto
{
    [Required]
    [Range(0, 100)]
    public decimal CompletionPercentage { get; set; }
}

public class EvaluateGoalDto
{
    [Required]
    [Range(0, 100)]
    public decimal Score { get; set; }

    [Required]
    [StringLength(2000)]
    public string EvaluationNotes { get; set; } = string.Empty;
}
