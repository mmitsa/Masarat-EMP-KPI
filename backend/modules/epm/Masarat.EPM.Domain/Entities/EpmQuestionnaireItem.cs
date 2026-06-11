using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Domain.Entities;

/// <summary>
/// سؤال داخل نموذج مرسل، مع حفظ نص السؤال وقت الإرسال.
/// </summary>
public class EpmQuestionnaireItem
{
    [Key]
    public int ItemId { get; set; }

    [Required]
    public int QuestionnaireId { get; set; }

    public int? QuestionId { get; set; }

    [Required]
    [StringLength(120)]
    public string QuestionCode { get; set; } = string.Empty;

    [Required]
    [StringLength(2000)]
    public string QuestionText { get; set; } = string.Empty;

    [StringLength(50)]
    public string Context { get; set; } = "goal";

    [StringLength(50)]
    public string Audience { get; set; } = "employee";

    [StringLength(50)]
    public string Type { get; set; } = "text";

    [StringLength(500)]
    public string? SuggestedTaskTitle { get; set; }

    public bool Required { get; set; }

    [StringLength(4000)]
    public string? Answer { get; set; }

    public DateTime? AnsweredAt { get; set; }
    public bool ConvertedToTask { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public long TenantId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual EpmQuestionnaire? Questionnaire { get; set; }
    public virtual EpmQuestion? Question { get; set; }
}
