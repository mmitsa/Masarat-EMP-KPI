using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Domain.Entities;

/// <summary>
/// كيان ميثاق الأداء الوظيفي - العقد السنوي بين الموظف والمدير
/// </summary>
public class PerformanceCharter
{
    [Key]
    public int CharterId { get; set; }

    /// <summary>
    /// معرّف الموظف (ربط مع HR.API)
    /// </summary>
    [Required]
    public int EmployeeId { get; set; }

    /// <summary>
    /// الرقم الوطني للموظف
    /// </summary>
    [Required]
    [StringLength(10)]
    public string EmployeeNationalId { get; set; } = string.Empty;

    /// <summary>
    /// اسم الموظف (مخزّن للأرشفة)
    /// </summary>
    [Required]
    [StringLength(200)]
    public string EmployeeName { get; set; } = string.Empty;

    /// <summary>
    /// المسمى الوظيفي حسب نموذج الميثاق
    /// </summary>
    [StringLength(200)]
    public string? JobTitle { get; set; }

    /// <summary>
    /// الرقم الوظيفي حسب نموذج الميثاق
    /// </summary>
    [StringLength(50)]
    public string? JobNumber { get; set; }

    /// <summary>
    /// الوكالة / الإدارة العامة
    /// </summary>
    [StringLength(200)]
    public string? AgencyName { get; set; }

    /// <summary>
    /// الإدارة / القسم
    /// </summary>
    [StringLength(200)]
    public string? DepartmentName { get; set; }

    /// <summary>
    /// نوع الوظيفة: nonSupervisory أو supervisory
    /// </summary>
    [Required]
    [StringLength(50)]
    public string JobCategory { get; set; } = "nonSupervisory";

    /// <summary>
    /// معرّف المدير المباشر
    /// </summary>
    [Required]
    public int ManagerId { get; set; }

    /// <summary>
    /// اسم المدير المباشر
    /// </summary>
    [Required]
    [StringLength(200)]
    public string ManagerName { get; set; } = string.Empty;

    /// <summary>
    /// السنة المالية للميثاق (2025, 2026, etc.)
    /// </summary>
    [Required]
    public int FiscalYear { get; set; }

    /// <summary>
    /// حالة الميثاق (Draft, Active, MidYearReview, Completed, Archived)
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Draft";

    /// <summary>
    /// تاريخ توقيع الموظف على الميثاق
    /// </summary>
    public DateTime? EmployeeSignedDate { get; set; }

    /// <summary>
    /// تاريخ موافقة المدير على الميثاق
    /// </summary>
    public DateTime? ManagerApprovedDate { get; set; }

    /// <summary>
    /// تاريخ المراجعة نصف السنوية
    /// </summary>
    public DateTime? MidYearReviewDate { get; set; }

    /// <summary>
    /// ملاحظات المراجعة نصف السنوية
    /// </summary>
    [StringLength(2000)]
    public string? MidYearReviewNotes { get; set; }

    /// <summary>
    /// تاريخ التقييم النهائي
    /// </summary>
    public DateTime? FinalEvaluationDate { get; set; }

    /// <summary>
    /// الدرجة النهائية للأهداف (Goals Score) من 100
    /// </summary>
    public decimal? GoalsScore { get; set; }

    /// <summary>
    /// الدرجة النهائية للجدارات (Competencies Score) من 100
    /// </summary>
    public decimal? CompetenciesScore { get; set; }

    /// <summary>
    /// الدرجة الإجمالية (Total Score) من 100
    /// </summary>
    public decimal? TotalScore { get; set; }

    /// <summary>
    /// التقدير النهائي (Outstanding, Exceeds, Meets, Needs Improvement, Unsatisfactory)
    /// </summary>
    [StringLength(50)]
    public string? FinalRating { get; set; }

    /// <summary>
    /// ملاحظات التقييم النهائي
    /// </summary>
    [StringLength(2000)]
    public string? FinalEvaluationNotes { get; set; }

    /// <summary>
    /// هل هناك تظلم من الموظف؟
    /// </summary>
    public bool HasAppeal { get; set; } = false;

    /// <summary>
    /// تاريخ التظلم
    /// </summary>
    public DateTime? AppealDate { get; set; }

    /// <summary>
    /// نص التظلم
    /// </summary>
    [StringLength(2000)]
    public string? AppealNotes { get; set; }

    /// <summary>
    /// حالة التظلم (Pending, Approved, Rejected)
    /// </summary>
    [StringLength(50)]
    public string? AppealStatus { get; set; }

    /// <summary>
    /// ملاحظات المدير
    /// </summary>
    [StringLength(2000)]
    public string? ManagerComments { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public long TenantId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    // Navigation Properties
    public virtual ICollection<Goal> Goals { get; set; } = new List<Goal>();
    public virtual ICollection<Competency> Competencies { get; set; } = new List<Competency>();

    // Business Logic Methods

    /// <summary>
    /// هل الميثاق في مرحلة التخطيط (لم يتم التوقيع بعد)؟
    /// </summary>
    public bool IsInPlanningPhase()
    {
        return Status == "Draft" && !EmployeeSignedDate.HasValue;
    }

    /// <summary>
    /// هل الميثاق نشط (تم التوقيع)؟
    /// </summary>
    public bool IsActiveCharter()
    {
        return Status == "Active" && EmployeeSignedDate.HasValue && ManagerApprovedDate.HasValue;
    }

    /// <summary>
    /// هل حان موعد المراجعة نصف السنوية؟
    /// </summary>
    public bool IsMidYearReviewDue()
    {
        if (!IsActiveCharter()) return false;

        var midYearDate = new DateTime(FiscalYear, 6, 30); // نهاية يونيو
        return DateTime.Now >= midYearDate && !MidYearReviewDate.HasValue;
    }

    /// <summary>
    /// هل حان موعد التقييم النهائي؟
    /// </summary>
    public bool IsFinalEvaluationDue()
    {
        if (!IsActiveCharter()) return false;

        var endOfYear = new DateTime(FiscalYear, 12, 31); // نهاية السنة
        return DateTime.Now >= endOfYear && !FinalEvaluationDate.HasValue;
    }

    /// <summary>
    /// توقيع الموظف على الميثاق
    /// </summary>
    public void SignByEmployee()
    {
        if (EmployeeSignedDate.HasValue)
            throw new InvalidOperationException("الميثاق موقع بالفعل من قبل الموظف");

        EmployeeSignedDate = DateTime.Now;
        UpdatedAt = DateTime.Now;
    }

    /// <summary>
    /// موافقة المدير على الميثاق
    /// </summary>
    public void ApproveByManager()
    {
        if (!EmployeeSignedDate.HasValue)
            throw new InvalidOperationException("يجب أن يوقع الموظف أولاً");

        if (ManagerApprovedDate.HasValue)
            throw new InvalidOperationException("الميثاق معتمد بالفعل من المدير");

        ManagerApprovedDate = DateTime.Now;
        Status = "Active";
        UpdatedAt = DateTime.Now;
    }

    /// <summary>
    /// إجراء المراجعة نصف السنوية
    /// </summary>
    public void PerformMidYearReview(string notes)
    {
        if (!IsActiveCharter())
            throw new InvalidOperationException("الميثاق غير نشط");

        if (MidYearReviewDate.HasValue)
            throw new InvalidOperationException("المراجعة نصف السنوية تمت بالفعل");

        MidYearReviewDate = DateTime.Now;
        MidYearReviewNotes = notes;
        Status = "MidYearReview";
        UpdatedAt = DateTime.Now;
    }

    /// <summary>
    /// حساب الدرجة الإجمالية من أهداف وجدارات
    /// </summary>
    public void CalculateTotalScore(decimal goalsWeight = 70, decimal competenciesWeight = 30)
    {
        if (!GoalsScore.HasValue || !CompetenciesScore.HasValue)
            throw new InvalidOperationException("يجب تقييم الأهداف والجدارات أولاً");

        TotalScore = (GoalsScore.Value * goalsWeight / 100) + (CompetenciesScore.Value * competenciesWeight / 100);

        // تحديد التقدير النهائي حسب مقياس النماذج الرسمية (1-5)
        var normalizedScore = TotalScore.Value / 20;
        FinalRating = normalizedScore switch
        {
            >= 4.5m => "ممتاز",
            >= 3.5m => "جيد جداً",
            >= 2.5m => "جيد",
            >= 1.5m => "مرضي",
            _ => "غير مرضي"
        };

        UpdatedAt = DateTime.Now;
    }

    /// <summary>
    /// إنهاء التقييم النهائي
    /// </summary>
    public void CompleteFinalEvaluation(string notes)
    {
        if (!TotalScore.HasValue)
            throw new InvalidOperationException("يجب حساب الدرجة الإجمالية أولاً");

        FinalEvaluationDate = DateTime.Now;
        FinalEvaluationNotes = notes;
        Status = "Completed";
        UpdatedAt = DateTime.Now;
    }

    /// <summary>
    /// تقديم تظلم من الموظف
    /// </summary>
    public void FileAppeal(string appealNotes)
    {
        if (Status != "Completed")
            throw new InvalidOperationException("لا يمكن التظلم إلا بعد إكمال التقييم");

        if (HasAppeal)
            throw new InvalidOperationException("تم تقديم تظلم مسبقاً");

        HasAppeal = true;
        AppealDate = DateTime.Now;
        AppealNotes = appealNotes;
        AppealStatus = "Pending";
        UpdatedAt = DateTime.Now;
    }

    /// <summary>
    /// معالجة التظلم (قبول أو رفض)
    /// </summary>
    public void ProcessAppeal(bool approved, string? reason = null)
    {
        if (!HasAppeal || AppealStatus != "Pending")
            throw new InvalidOperationException("لا يوجد تظلم قيد المعالجة");

        AppealStatus = approved ? "Approved" : "Rejected";

        if (!string.IsNullOrEmpty(reason))
        {
            AppealNotes += $"\n\nنتيجة التظلم: {reason}";
        }

        UpdatedAt = DateTime.Now;
    }
}
