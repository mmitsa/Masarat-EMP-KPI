using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Domain.Entities;

/// <summary>
/// كيان عنصر التميز - أنشطة إضافية تعزز التقييم
/// </summary>
public class ExcellenceElement
{
    [Key]
    public int ElementId { get; set; }

    /// <summary>
    /// معرّف الميثاق
    /// </summary>
    [Required]
    public int CharterId { get; set; }

    /// <summary>
    /// نوع عنصر التميز (Innovation, KnowledgeTransfer, VolunteerWork, Leadership, etc.)
    /// </summary>
    [Required]
    [StringLength(100)]
    public string ElementType { get; set; } = string.Empty;

    /// <summary>
    /// عنوان النشاط
    /// </summary>
    [Required]
    [StringLength(500)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// وصف تفصيلي للنشاط
    /// </summary>
    [StringLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// التاريخ الذي تم فيه النشاط
    /// </summary>
    [Required]
    public DateTime ActivityDate { get; set; }

    /// <summary>
    /// الأثر أو القيمة المضافة
    /// </summary>
    [StringLength(1000)]
    public string? Impact { get; set; }

    /// <summary>
    /// المستندات الداعمة (روابط أو مسارات)
    /// </summary>
    [StringLength(500)]
    public string? SupportingDocuments { get; set; }

    /// <summary>
    /// حالة الموافقة (Pending, Approved, Rejected)
    /// </summary>
    [Required]
    [StringLength(50)]
    public string ApprovalStatus { get; set; } = "Pending";

    /// <summary>
    /// تاريخ الموافقة
    /// </summary>
    public DateTime? ApprovedDate { get; set; }

    /// <summary>
    /// ملاحظات المدير
    /// </summary>
    [StringLength(1000)]
    public string? ManagerNotes { get; set; }

    /// <summary>
    /// الدرجة الممنوحة (نقاط إضافية)
    /// </summary>
    [Range(0, 10)]
    public decimal? BonusPoints { get; set; }

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
    /// الموافقة على عنصر التميز
    /// </summary>
    public void Approve(decimal bonusPoints, string? notes = null)
    {
        if (bonusPoints < 0 || bonusPoints > 10)
            throw new ArgumentException("النقاط الإضافية يجب أن تكون بين 0 و 10");

        ApprovalStatus = "Approved";
        ApprovedDate = DateTime.Now;
        BonusPoints = bonusPoints;
        ManagerNotes = notes;
        UpdatedAt = DateTime.Now;
    }

    /// <summary>
    /// رفض عنصر التميز
    /// </summary>
    public void Reject(string reason)
    {
        ApprovalStatus = "Rejected";
        ApprovedDate = DateTime.Now;
        ManagerNotes = reason;
        BonusPoints = 0;
        UpdatedAt = DateTime.Now;
    }

    /// <summary>
    /// هل تمت الموافقة؟
    /// </summary>
    public bool IsApproved()
    {
        return ApprovalStatus == "Approved" && BonusPoints.HasValue;
    }

    /// <summary>
    /// الحصول على وصف نوع العنصر
    /// </summary>
    public string GetElementTypeDescription()
    {
        return ElementType switch
        {
            "Innovation" => "فكرة إبداعية - Creative Idea",
            "KnowledgeTransfer" => "نقل المعرفة - Knowledge Sharing",
            "VolunteerWork" => "عمل تطوعي - Volunteer Work",
            "Leadership" => "مبادرة قيادية - Leadership Initiative",
            "ProcessImprovement" => "تحسين إجراءات - Process Improvement",
            "CustomerService" => "خدمة متميزة - Excellence in Service",
            _ => ElementType
        };
    }
}
