using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Domain.Entities;

/// <summary>
/// نسخة قراءة محلية لبيانات الموظف القادمة من نظام الموارد البشرية الخارجي.
/// لا تعد هذه النسخة مصدر الحقيقة، لكنها تحفظ بيانات الربط اللازمة للتقييم.
/// </summary>
public class EmployeeSnapshot
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int SourceEmployeeId { get; set; }

    [StringLength(50)]
    public string? EmployeeNumber { get; set; }

    [Required]
    [StringLength(20)]
    public string NationalId { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string NameAr { get; set; } = string.Empty;

    [StringLength(200)]
    public string? NameEn { get; set; }

    [StringLength(200)]
    public string? Email { get; set; }

    [StringLength(50)]
    public string? PhoneNumber { get; set; }

    public int? DepartmentId { get; set; }

    [StringLength(200)]
    public string? DepartmentName { get; set; }

    public int? PositionId { get; set; }

    [StringLength(200)]
    public string? JobTitle { get; set; }

    public int? ManagerEmployeeId { get; set; }

    [StringLength(200)]
    public string? ManagerName { get; set; }

    [Required]
    [StringLength(50)]
    public string EmploymentStatus { get; set; } = "Active";

    [Required]
    [StringLength(100)]
    public string SourceSystem { get; set; } = "HR";

    [StringLength(100)]
    public string? SourceVersion { get; set; }

    public DateTime LastSyncedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public long TenantId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
