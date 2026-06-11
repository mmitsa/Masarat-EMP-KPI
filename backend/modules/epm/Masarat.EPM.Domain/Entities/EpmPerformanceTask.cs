using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Domain.Entities;

/// <summary>
/// مهمة أداء مرتبطة بهدف، تقييم، توجيه مدير، أو إجابة موظف.
/// </summary>
public class EpmPerformanceTask
{
    [Key]
    public int TaskId { get; set; }

    [Required]
    [StringLength(500)]
    public string Title { get; set; } = string.Empty;

    [StringLength(4000)]
    public string? Description { get; set; }

    [Required]
    [StringLength(200)]
    public string Department { get; set; } = "عام";

    [Required]
    [StringLength(200)]
    public string AssigneeName { get; set; } = string.Empty;

    public int? AssigneeId { get; set; }

    [StringLength(200)]
    public string? ManagerName { get; set; }

    public int? ManagerId { get; set; }

    [Required]
    [StringLength(50)]
    public string SourceType { get; set; } = "self";

    [StringLength(500)]
    public string? LinkedGoalTitle { get; set; }

    public int? LinkedGoalId { get; set; }
    public int? QuestionnaireId { get; set; }
    public int? QuestionnaireItemId { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "notStarted";

    [Range(0, 100)]
    public int Progress { get; set; }

    [Required]
    [StringLength(50)]
    public string Priority { get; set; } = "medium";

    [StringLength(50)]
    public string CreatedByRole { get; set; } = "employee";

    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public long TenantId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public virtual ICollection<EpmTaskHistory> History { get; set; } = new List<EpmTaskHistory>();
    public virtual ICollection<EpmTaskExtensionRequest> ExtensionRequests { get; set; } = new List<EpmTaskExtensionRequest>();
}
