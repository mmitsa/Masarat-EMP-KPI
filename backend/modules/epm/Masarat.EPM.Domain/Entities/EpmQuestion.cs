using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Domain.Entities;

/// <summary>
/// سؤال في بنك أسئلة ميثاق الأداء والتقييم.
/// </summary>
public class EpmQuestion
{
    [Key]
    public int QuestionId { get; set; }

    [Required]
    [StringLength(120)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Department { get; set; } = "عام";

    [Required]
    [StringLength(50)]
    public string Context { get; set; } = "goal";

    [Required]
    [StringLength(50)]
    public string Audience { get; set; } = "employee";

    [Required]
    [StringLength(50)]
    public string Type { get; set; } = "text";

    [Required]
    [StringLength(2000)]
    public string Text { get; set; } = string.Empty;

    [StringLength(500)]
    public string? SuggestedTaskTitle { get; set; }

    public bool Required { get; set; }
    public bool IsOfficial { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public long TenantId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}
