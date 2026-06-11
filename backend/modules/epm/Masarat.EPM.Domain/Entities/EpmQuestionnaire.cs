using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Domain.Entities;

/// <summary>
/// نموذج أسئلة مرسل للموظف ضمن هدف أو تقييم.
/// </summary>
public class EpmQuestionnaire
{
    [Key]
    public int QuestionnaireId { get; set; }

    [Required]
    [StringLength(500)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Department { get; set; } = "عام";

    [Required]
    [StringLength(50)]
    public string Context { get; set; } = "goal";

    [Required]
    [StringLength(200)]
    public string EmployeeName { get; set; } = string.Empty;

    public int? EmployeeId { get; set; }

    [StringLength(200)]
    public string? ManagerName { get; set; }

    public int? ManagerId { get; set; }

    [StringLength(500)]
    public string? LinkedGoalTitle { get; set; }

    public int? LinkedGoalId { get; set; }

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "sent";

    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }
    public DateTime? AnsweredAt { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public long TenantId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public virtual ICollection<EpmQuestionnaireItem> Items { get; set; } = new List<EpmQuestionnaireItem>();
}
