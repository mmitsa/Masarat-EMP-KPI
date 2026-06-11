using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Application.DTOs;

/// <summary>
/// DTO للمراجعة الدورية
/// </summary>
public class ReviewDto
{
    public int ReviewId { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty; // Q1-2026, Q2-2026, etc.
    public string Status { get; set; } = string.Empty;
    public decimal? GoalsScore { get; set; }
    public string? GoalsComments { get; set; }
    public decimal? CompetenciesScore { get; set; }
    public string? CompetenciesComments { get; set; }
    public decimal? OverallScore { get; set; }
    public string? ManagerComments { get; set; }
    public string? DevelopmentPlan { get; set; }
    public DateTime? CompletedDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO لإنشاء مراجعة جديدة
/// </summary>
public class CreateReviewDto
{
    [Required(ErrorMessage = "معرّف الموظف مطلوب")]
    public int EmployeeId { get; set; }

    [Required(ErrorMessage = "الفترة مطلوبة")]
    [StringLength(20)]
    public string Period { get; set; } = string.Empty;

    [Required(ErrorMessage = "السنة مطلوبة")]
    public int Year { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }

    public int? CharterId { get; set; }
}

/// <summary>
/// DTO لتحديث المراجعة
/// </summary>
public class UpdateReviewDto
{
    [Range(0, 5)]
    public decimal? GoalsScore { get; set; }

    [StringLength(1000)]
    public string? GoalsComments { get; set; }

    [Range(0, 5)]
    public decimal? CompetenciesScore { get; set; }

    [StringLength(1000)]
    public string? CompetenciesComments { get; set; }

    [StringLength(2000)]
    public string? ManagerComments { get; set; }

    [StringLength(2000)]
    public string? DevelopmentPlan { get; set; }

    [StringLength(20)]
    public string? Period { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}

/// <summary>
/// DTO لإكمال المراجعة
/// </summary>
public class CompleteReviewDto
{
    [StringLength(2000)]
    public string? FinalComments { get; set; }
}
