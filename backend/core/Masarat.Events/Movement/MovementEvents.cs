namespace Masarat.Events.Movement;

using Masarat.Events.Contracts;

/// <summary>
/// Event published when vehicle is assigned to driver
/// نشر حدث عند تعيين مركبة لسائق
/// </summary>
public record VehicleAssignedEvent : DomainEvent
{
    public required int VehicleId { get; init; }
    public required string VehiclePlateNumber { get; init; }
    public required int DriverEmployeeId { get; init; }
    public required DateTime AssignmentDate { get; init; }
    public DateTime? ExpectedReturnDate { get; init; }
    public string? Purpose { get; init; }
}

/// <summary>
/// Event published when vehicle is returned
/// نشر حدث عند إعادة مركبة
/// </summary>
public record VehicleReturnedEvent : DomainEvent
{
    public required int VehicleId { get; init; }
    public required int DriverEmployeeId { get; init; }
    public required DateTime ReturnDate { get; init; }
    public int? OdometerReading { get; init; }
    public string? Condition { get; init; }
    public string? Notes { get; init; }
}

/// <summary>
/// Event published when maintenance is scheduled
/// نشر حدث عند جدولة صيانة
/// </summary>
public record MaintenanceScheduledEvent : DomainEvent
{
    public required int MaintenanceId { get; init; }
    public required int VehicleId { get; init; }
    public required DateTime ScheduledDate { get; init; }
    public required string MaintenanceType { get; init; }
    public string? Description { get; init; }
    public decimal? EstimatedCost { get; init; }
}

/// <summary>
/// Event published when maintenance is completed
/// نشر حدث عند اكتمال الصيانة
/// </summary>
public record MaintenanceCompletedEvent : DomainEvent
{
    public required int MaintenanceId { get; init; }
    public required int VehicleId { get; init; }
    public required DateTime CompletedDate { get; init; }
    public required decimal ActualCost { get; init; }
    public string? WorkPerformed { get; init; }
    public string? CompletedBy { get; init; }
}

/// <summary>
/// Event published when trip is created
/// نشر حدث عند إنشاء رحلة
/// </summary>
public record TripCreatedEvent : DomainEvent
{
    public required int TripId { get; init; }
    public required int VehicleId { get; init; }
    public required int DriverEmployeeId { get; init; }
    public required string StartLocation { get; init; }
    public required string EndLocation { get; init; }
    public required DateTime PlannedDepartureTime { get; init; }
    public string? Purpose { get; init; }
}

/// <summary>
/// Event published when trip is completed
/// نشر حدث عند اكتمال رحلة
/// </summary>
public record TripCompletedEvent : DomainEvent
{
    public required int TripId { get; init; }
    public required DateTime CompletedAt { get; init; }
    public required double DistanceTraveled { get; init; }
    public required decimal FuelConsumed { get; init; }
    public string? Notes { get; init; }
}
