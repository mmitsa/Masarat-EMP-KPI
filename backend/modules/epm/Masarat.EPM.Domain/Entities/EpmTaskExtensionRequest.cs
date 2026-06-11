using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Domain.Entities;

/// <summary>
/// طلب تمديد مهمة أداء مع قرار المدير.
/// </summary>
public class EpmTaskExtensionRequest
{
    [Key]
    public int ExtensionRequestId { get; set; }

    [Required]
    public int TaskId { get; set; }

    [Required]
    [StringLength(2000)]
    public string Reason { get; set; } = string.Empty;

    [Required]
    public DateTime RequestedDueDate { get; set; }

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "pending";

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DecidedAt { get; set; }

    [StringLength(2000)]
    public string? ManagerComment { get; set; }

    [StringLength(200)]
    public string? DecidedBy { get; set; }

    public long TenantId { get; set; }

    public virtual EpmPerformanceTask? Task { get; set; }
}
