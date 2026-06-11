using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Domain.Entities;

/// <summary>
/// كيان الهدف - أهداف SMART ضمن ميثاق الأداء
/// </summary>
public class Goal
{
    [Key]
    public int GoalId { get; set; }

    /// <summary>
    /// معرّف الميثاق
    /// </summary>
    [Required]
    public int CharterId { get; set; }

    /// <summary>
    /// ترتيب الهدف (1, 2, 3...)
    /// </summary>
    [Required]
    public int OrderIndex { get; set; }

    /// <summary>
    /// عنوان الهدف
    /// </summary>
    [Required]
    [StringLength(500)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// وصف تفصيلي للهدف (SMART Description)
    /// </summary>
    [StringLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// الوزن النسبي للهدف (من 100)
    /// مجموع أوزان جميع الأهداف يجب أن يساوي 100
    /// </summary>
    [Required]
    [Range(1, 100)]
    public decimal Weight { get; set; }

    /// <summary>
    /// المؤشرات القابلة للقياس (Measurable Indicators)
    /// </summary>
    [StringLength(1000)]
    public string? MeasurableIndicators { get; set; }

    /// <summary>
    /// الإطار الزمني (Time Frame)
    /// </summary>
    [StringLength(200)]
    public string? TimeFrame { get; set; }

    /// <summary>
    /// حالة الهدف (Pending, InProgress, Completed, NotAchieved)
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Pending";

    /// <summary>
    /// نسبة الإنجاز (0-100%)
    /// </summary>
    [Range(0, 100)]
    public decimal CompletionPercentage { get; set; } = 0;

    /// <summary>
    /// الدرجة الفعلية التي حصل عليها الموظف (من 100)
    /// </summary>
    public decimal? ActualScore { get; set; }

    /// <summary>
    /// الدرجة المرجحة (ActualScore * Weight / 100)
    /// </summary>
    public decimal? WeightedScore { get; set; }

    /// <summary>
    /// ملاحظات التقييم
    /// </summary>
    [StringLength(2000)]
    public string? EvaluationNotes { get; set; }

    /// <summary>
    /// تاريخ التقييم
    /// </summary>
    public DateTime? EvaluatedDate { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public long TenantId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    // Navigation Properties
    public virtual PerformanceCharter? Charter { get; set; }

    // Business Logic Methods

    /// <summary>
    /// هل الهدف مكتمل؟
    /// </summary>
    public bool IsCompleted()
    {
        return Status == "Completed" && CompletionPercentage == 100;
    }

    /// <summary>
    /// هل الهدف قيد التنفيذ؟
    /// </summary>
    public bool IsInProgress()
    {
        return Status == "InProgress" && CompletionPercentage > 0 && CompletionPercentage < 100;
    }

    /// <summary>
    /// تحديث نسبة الإنجاز
    /// </summary>
    public void UpdateProgress(decimal percentage)
    {
        if (percentage < 0 || percentage > 100)
            throw new ArgumentException("نسبة الإنجاز يجب أن تكون بين 0 و 100");

        CompletionPercentage = percentage;

        if (percentage == 100)
            Status = "Completed";
        else if (percentage > 0)
            Status = "InProgress";
        else
            Status = "Pending";

        UpdatedAt = DateTime.Now;
    }

    /// <summary>
    /// تقييم الهدف وحساب الدرجة المرجحة
    /// </summary>
    public void Evaluate(decimal score, string notes)
    {
        if (score < 0 || score > 100)
            throw new ArgumentException("الدرجة يجب أن تكون بين 0 و 100");

        ActualScore = score;
        WeightedScore = (score * Weight) / 100;
        EvaluationNotes = notes;
        EvaluatedDate = DateTime.Now;
        UpdatedAt = DateTime.Now;
    }

    /// <summary>
    /// التحقق من صحة الهدف (SMART Validation)
    /// </summary>
    public bool IsSMARTCompliant()
    {
        // Specific: عنوان واضح
        if (string.IsNullOrWhiteSpace(Title))
            return false;

        // Measurable: مؤشرات قابلة للقياس
        if (string.IsNullOrWhiteSpace(MeasurableIndicators))
            return false;

        // Achievable & Relevant: وصف تفصيلي
        if (string.IsNullOrWhiteSpace(Description))
            return false;

        // Time-bound: إطار زمني
        if (string.IsNullOrWhiteSpace(TimeFrame))
            return false;

        return true;
    }
}
