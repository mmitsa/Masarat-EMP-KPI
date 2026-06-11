using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Domain.Entities;

/// <summary>
/// كيان الجدارة - تقييم السلوكيات والمهارات
/// </summary>
public class Competency
{
    [Key]
    public int CompetencyId { get; set; }

    /// <summary>
    /// معرّف الميثاق
    /// </summary>
    [Required]
    public int CharterId { get; set; }

    /// <summary>
    /// نوع الجدارة (Leadership, Communication, Initiative, Teamwork, ProblemSolving, etc.)
    /// </summary>
    [Required]
    [StringLength(100)]
    public string CompetencyType { get; set; } = string.Empty;

    /// <summary>
    /// اسم الجدارة بالعربية
    /// </summary>
    [Required]
    [StringLength(200)]
    public string NameAr { get; set; } = string.Empty;

    /// <summary>
    /// اسم الجدارة بالإنجليزية
    /// </summary>
    [StringLength(200)]
    public string? NameEn { get; set; }

    /// <summary>
    /// وصف الجدارة والمعايير المطلوبة
    /// </summary>
    [StringLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// الوزن النسبي للجدارة (من 100)
    /// </summary>
    [Required]
    [Range(1, 100)]
    public decimal Weight { get; set; }

    /// <summary>
    /// الدرجة الفعلية (من 5)
    /// 1 = ضعيف, 2 = مقبول, 3 = جيد, 4 = جيد جداً, 5 = ممتاز
    /// </summary>
    [Range(1, 5)]
    public int? Rating { get; set; }

    /// <summary>
    /// الدرجة بالنسبة المئوية (من 100)
    /// يتم حسابها: (Rating / 5) * 100
    /// </summary>
    public decimal? ScorePercentage { get; set; }

    /// <summary>
    /// الدرجة المرجحة (ScorePercentage * Weight / 100)
    /// </summary>
    public decimal? WeightedScore { get; set; }

    /// <summary>
    /// ملاحظات التقييم
    /// </summary>
    [StringLength(2000)]
    public string? EvaluationNotes { get; set; }

    /// <summary>
    /// أمثلة على السلوكيات الإيجابية
    /// </summary>
    [StringLength(1000)]
    public string? PositiveBehaviors { get; set; }

    /// <summary>
    /// مجالات التحسين
    /// </summary>
    [StringLength(1000)]
    public string? AreasForImprovement { get; set; }

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
    /// تقييم الجدارة وحساب الدرجة المرجحة
    /// </summary>
    public void Evaluate(int rating, string notes, string? positiveBehaviors = null, string? areasForImprovement = null)
    {
        if (rating < 1 || rating > 5)
            throw new ArgumentException("التقييم يجب أن يكون بين 1 و 5");

        Rating = rating;
        ScorePercentage = (rating / 5.0m) * 100;
        WeightedScore = (ScorePercentage.Value * Weight) / 100;
        EvaluationNotes = notes;
        PositiveBehaviors = positiveBehaviors;
        AreasForImprovement = areasForImprovement;
        EvaluatedDate = DateTime.Now;
        UpdatedAt = DateTime.Now;
    }

    /// <summary>
    /// الحصول على وصف التقييم
    /// </summary>
    public string GetRatingDescription()
    {
        return Rating switch
        {
            5 => "ممتاز - Outstanding",
            4 => "جيد جداً - Very Good",
            3 => "جيد - Good",
            2 => "مقبول - Acceptable",
            1 => "ضعيف - Poor",
            _ => "لم يتم التقييم بعد"
        };
    }

    /// <summary>
    /// هل التقييم إيجابي (3 أو أعلى)؟
    /// </summary>
    public bool IsPositiveRating()
    {
        return Rating.HasValue && Rating.Value >= 3;
    }
}
