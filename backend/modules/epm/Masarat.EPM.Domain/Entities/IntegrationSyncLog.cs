using System.ComponentModel.DataAnnotations;

namespace Masarat.EPM.Domain.Entities;

/// <summary>
/// سجل تشغيل مزامنة التكاملات الخارجية.
/// </summary>
public class IntegrationSyncLog
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string IntegrationName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Started";

    public int PulledCount { get; set; }
    public int InsertedCount { get; set; }
    public int UpdatedCount { get; set; }
    public int FailedCount { get; set; }

    [StringLength(2000)]
    public string? ErrorMessage { get; set; }

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public long TenantId { get; set; }
}
