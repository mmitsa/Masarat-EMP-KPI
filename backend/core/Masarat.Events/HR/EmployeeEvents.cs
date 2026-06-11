namespace Masarat.Events.HR;

using Masarat.Events.Contracts;

/// <summary>
/// Event published when a new employee is created
/// نشر حدث عند إنشاء موظف جديد
/// </summary>
public record EmployeeCreatedEvent : DomainEvent
{
    public required int EmployeeId { get; init; }
    public required string FullName { get; init; }
    public required string NationalId { get; init; }
    public required string Email { get; init; }
    public string? PhoneNumber { get; init; }
    public required int DepartmentId { get; init; }
    public required int PositionId { get; init; }
    public DateTime HireDate { get; init; }
    public decimal Salary { get; init; }
}

/// <summary>
/// Event published when employee information is updated
/// نشر حدث عند تحديث معلومات موظف
/// </summary>
public record EmployeeUpdatedEvent : DomainEvent
{
    public required int EmployeeId { get; init; }
    public string? FullName { get; init; }
    public string? Email { get; init; }
    public string? PhoneNumber { get; init; }
    public int? DepartmentId { get; init; }
    public int? PositionId { get; init; }
    public Dictionary<string, object>? ChangedFields { get; init; }
}

/// <summary>
/// Event published when an employee is terminated
/// نشر حدث عند إنهاء خدمة موظف
/// </summary>
public record EmployeeTerminatedEvent : DomainEvent
{
    public required int EmployeeId { get; init; }
    public required DateTime TerminationDate { get; init; }
    public required string Reason { get; init; }
    public string? Notes { get; init; }
}

/// <summary>
/// Event published when employee status changes
/// نشر حدث عند تغيير حالة موظف
/// </summary>
public record EmployeeStatusChangedEvent : DomainEvent
{
    public required int EmployeeId { get; init; }
    public required string OldStatus { get; init; }
    public required string NewStatus { get; init; }
    public string? Reason { get; init; }
}

/// <summary>
/// Event published when leave request is submitted
/// نشر حدث عند تقديم طلب إجازة
/// </summary>
public record LeaveRequestSubmittedEvent : DomainEvent
{
    public required int LeaveRequestId { get; init; }
    public required int EmployeeId { get; init; }
    public required string LeaveType { get; init; }
    public required DateTime StartDate { get; init; }
    public required DateTime EndDate { get; init; }
    public int TotalDays { get; init; }
    public string? Reason { get; init; }
}

/// <summary>
/// Event published when leave request is approved/rejected
/// نشر حدث عند الموافقة/رفض طلب إجازة
/// </summary>
public record LeaveRequestReviewedEvent : DomainEvent
{
    public required int LeaveRequestId { get; init; }
    public required int EmployeeId { get; init; }
    public required string Status { get; init; }
    public required string ReviewedBy { get; init; }
    public DateTime ReviewedAt { get; init; }
    public string? Comments { get; init; }
}

/// <summary>
/// Event published when attendance is recorded
/// نشر حدث عند تسجيل الحضور
/// </summary>
public record AttendanceRecordedEvent : DomainEvent
{
    public required int AttendanceId { get; init; }
    public required int EmployeeId { get; init; }
    public required DateTime CheckInTime { get; init; }
    public DateTime? CheckOutTime { get; init; }
    public required string AttendanceType { get; init; }
    public string? Location { get; init; }
}
