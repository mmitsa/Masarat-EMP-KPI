using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Application.DTOs;

public class CompetencyDto
{
    public int CompetencyId { get; set; }
    public int CharterId { get; set; }
    public string CompetencyType { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public string? Description { get; set; }
    public decimal Weight { get; set; }
    public int? Rating { get; set; }
    public decimal? ScorePercentage { get; set; }
    public decimal? WeightedScore { get; set; }
    public string? EvaluationNotes { get; set; }
    public string? PositiveBehaviors { get; set; }
    public string? AreasForImprovement { get; set; }
    public DateTime? EvaluatedDate { get; set; }
    public string RatingDescription { get; set; } = string.Empty;
}

public class CreateCompetencyDto
{
    [Required]
    public int CharterId { get; set; }

    [Required]
    [StringLength(100)]
    public string CompetencyType { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string NameAr { get; set; } = string.Empty;

    [StringLength(200)]
    public string? NameEn { get; set; }

    [StringLength(2000)]
    public string? Description { get; set; }

    [Required]
    [Range(1, 100)]
    public decimal Weight { get; set; }
}

public class EvaluateCompetencyDto
{
    [Required]
    [Range(1, 5, ErrorMessage = "التقييم يجب أن يكون بين 1 و 5")]
    public int Rating { get; set; }

    [Required]
    [StringLength(2000)]
    public string EvaluationNotes { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? PositiveBehaviors { get; set; }

    [StringLength(1000)]
    public string? AreasForImprovement { get; set; }
}
