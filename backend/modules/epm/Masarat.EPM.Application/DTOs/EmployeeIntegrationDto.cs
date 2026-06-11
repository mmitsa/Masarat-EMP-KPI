namespace Masarat.EPM.Application.DTOs;

public class EmployeeSnapshotDto
{
    public int Id { get; set; }
    public int SourceEmployeeId { get; set; }
    public string? EmployeeNumber { get; set; }
    public string NationalId { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public int? PositionId { get; set; }
    public string? JobTitle { get; set; }
    public int? ManagerEmployeeId { get; set; }
    public string? ManagerName { get; set; }
    public string EmploymentStatus { get; set; } = "Active";
    public string SourceSystem { get; set; } = "HR";
    public DateTime LastSyncedAt { get; set; }
    public bool IsActive { get; set; }
}

public class ExternalEmployeeDto
{
    public int Id { get; set; }
    public int? EmployeeId { get; set; }
    public string? EmployeeNumber { get; set; }
    public string? NationalId { get; set; }
    public string? NameAr { get; set; }
    public string? FullName { get; set; }
    public string? NameEn { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Phone { get; set; }
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public int? PositionId { get; set; }
    public string? JobTitle { get; set; }
    public int? ManagerEmployeeId { get; set; }
    public int? DirectManagerId { get; set; }
    public string? ManagerName { get; set; }
    public string? Status { get; set; }
}

public class EmployeeSyncResultDto
{
    public string IntegrationName { get; set; } = "HR";
    public string Status { get; set; } = "Completed";
    public int PulledCount { get; set; }
    public int InsertedCount { get; set; }
    public int UpdatedCount { get; set; }
    public int FailedCount { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime CompletedAt { get; set; }
}
