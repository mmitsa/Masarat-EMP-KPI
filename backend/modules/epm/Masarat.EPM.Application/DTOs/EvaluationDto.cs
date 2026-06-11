using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Application.DTOs;

/// <summary>
/// DTO للتقييم
/// </summary>
public class EvaluationDto
{
    public int EvaluationId { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public int Year { get; set; }
    public string ReviewType { get; set; } = string.Empty; // منتصف العام / نهاية العام
    public string Status { get; set; } = string.Empty;
    public decimal? GoalsScore { get; set; }
    public decimal? CompetenciesScore { get; set; }
    public decimal? FinalScore { get; set; }
    public string? ManagerComments { get; set; }
    public string? EmployeeComments { get; set; }
    public DateTime? SubmittedDate { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO لإنشاء تقييم جديد
/// </summary>
public class CreateEvaluationDto
{
    [Required(ErrorMessage = "معرّف الموظف مطلوب")]
    public int EmployeeId { get; set; }

    [Required(ErrorMessage = "السنة مطلوبة")]
    [Range(2020, 2100)]
    public int Year { get; set; }

    [Required(ErrorMessage = "نوع المراجعة مطلوب")]
    [StringLength(50)]
    public string ReviewType { get; set; } = string.Empty;

    [Range(0, 100)]
    public decimal? OverallScore { get; set; }

    [StringLength(2000)]
    public string? Comments { get; set; }

    public int? EvaluatorId { get; set; }

    public int? CharterId { get; set; }
}

/// <summary>
/// DTO لتحديث التقييم
/// </summary>
public class UpdateEvaluationDto
{
    [Range(0, 100)]
    public decimal? GoalsScore { get; set; }

    [Range(0, 100)]
    public decimal? CompetenciesScore { get; set; }

    [Range(0, 100)]
    public decimal? OverallScore { get; set; }

    [StringLength(2000)]
    public string? ManagerComments { get; set; }

    [StringLength(2000)]
    public string? EmployeeComments { get; set; }
}

/// <summary>
/// DTO لتقديم التقييم للمراجعة
/// </summary>
public class SubmitEvaluationDto
{
    [StringLength(2000)]
    public string? Comments { get; set; }
}

/// <summary>
/// DTO للموافقة على التقييم
/// </summary>
public class ApproveEvaluationDto
{
    [StringLength(2000)]
    public string? ApprovalComments { get; set; }
}

/// <summary>
/// DTO لرفض التقييم
/// </summary>
public class RejectEvaluationDto
{
    [Required(ErrorMessage = "سبب الرفض مطلوب")]
    [StringLength(1000)]
    public string Reason { get; set; } = string.Empty;
}
