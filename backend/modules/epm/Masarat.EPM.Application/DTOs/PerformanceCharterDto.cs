using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Application.DTOs;

/// <summary>
/// DTO لميثاق الأداء الكامل
/// </summary>
public class PerformanceCharterDto
{
    public int CharterId { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeNationalId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string? JobNumber { get; set; }
    public string? AgencyName { get; set; }
    public string? DepartmentName { get; set; }
    public string JobCategory { get; set; } = "nonSupervisory";
    public int ManagerId { get; set; }
    public string ManagerName { get; set; } = string.Empty;
    public int FiscalYear { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? EmployeeSignedDate { get; set; }
    public DateTime? ManagerApprovedDate { get; set; }
    public DateTime? MidYearReviewDate { get; set; }
    public string? MidYearReviewNotes { get; set; }
    public DateTime? FinalEvaluationDate { get; set; }
    public decimal? GoalsScore { get; set; }
    public decimal? CompetenciesScore { get; set; }
    public decimal? TotalScore { get; set; }
    public string? FinalRating { get; set; }
    public string? FinalEvaluationNotes { get; set; }
    public bool HasAppeal { get; set; }
    public DateTime? AppealDate { get; set; }
    public string? AppealNotes { get; set; }
    public string? AppealStatus { get; set; }
    public int GoalsCount { get; set; }
    public int CompetenciesCount { get; set; }
    public int ExcellenceElementsCount { get; set; }
    public bool IsInPlanningPhase { get; set; }
    public bool IsActiveCharter { get; set; }
    public bool IsMidYearReviewDue { get; set; }
    public bool IsFinalEvaluationDue { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO لإنشاء ميثاق أداء جديد
/// </summary>
public class CreateCharterDto
{
    [Required(ErrorMessage = "معرّف الموظف مطلوب")]
    public int EmployeeId { get; set; }

    [Required(ErrorMessage = "الرقم الوطني مطلوب")]
    [StringLength(10, MinimumLength = 10, ErrorMessage = "الرقم الوطني يجب أن يكون 10 أرقام")]
    public string EmployeeNationalId { get; set; } = string.Empty;

    [Required(ErrorMessage = "اسم الموظف مطلوب")]
    [StringLength(200)]
    public string EmployeeName { get; set; } = string.Empty;

    [StringLength(200)]
    public string? JobTitle { get; set; }

    [StringLength(50)]
    public string? JobNumber { get; set; }

    [StringLength(200)]
    public string? AgencyName { get; set; }

    [StringLength(200)]
    public string? DepartmentName { get; set; }

    [Required(ErrorMessage = "نوع الوظيفة مطلوب")]
    [RegularExpression("^(nonSupervisory|supervisory)$", ErrorMessage = "نوع الوظيفة يجب أن يكون nonSupervisory أو supervisory")]
    public string JobCategory { get; set; } = "nonSupervisory";

    [Required(ErrorMessage = "معرّف المدير مطلوب")]
    public int ManagerId { get; set; }

    [Required(ErrorMessage = "اسم المدير مطلوب")]
    [StringLength(200)]
    public string ManagerName { get; set; } = string.Empty;

    [Required(ErrorMessage = "السنة المالية مطلوبة")]
    [Range(2020, 2100)]
    public int FiscalYear { get; set; }
}

/// <summary>
/// DTO للمراجعة نصف السنوية
/// </summary>
public class MidYearReviewDto
{
    [Required(ErrorMessage = "ملاحظات المراجعة مطلوبة")]
    [StringLength(2000)]
    public string ReviewNotes { get; set; } = string.Empty;
}

/// <summary>
/// DTO للتقييم النهائي
/// </summary>
public class FinalEvaluationDto
{
    [StringLength(2000)]
    public string? EvaluationNotes { get; set; }

    [Range(0, 100)]
    public decimal GoalsWeight { get; set; } = 70;

    [Range(0, 100)]
    public decimal CompetenciesWeight { get; set; } = 30;
}

/// <summary>
/// DTO لتقديم تظلم
/// </summary>
public class AppealDto
{
    [Required(ErrorMessage = "نص التظلم مطلوب")]
    [StringLength(2000)]
    public string AppealNotes { get; set; } = string.Empty;
}

/// <summary>
/// DTO لمعالجة التظلم
/// </summary>
public class ProcessAppealDto
{
    [Required]
    public bool Approved { get; set; }

    [StringLength(1000)]
    public string? Reason { get; set; }
}
