using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Domain.Entities;

/// <summary>
/// سجل حركة المهمة.
/// </summary>
public class EpmTaskHistory
{
    [Key]
    public int HistoryId { get; set; }

    [Required]
    public int TaskId { get; set; }

    [Required]
    [StringLength(1000)]
    public string Action { get; set; } = string.Empty;

    [StringLength(200)]
    public string? ActorName { get; set; }

    public DateTime At { get; set; } = DateTime.UtcNow;
    public long TenantId { get; set; }

    public virtual EpmPerformanceTask? Task { get; set; }
}
