using Masarat.EPM.Application.DTOs;

namespace Masarat.EPM.Application.Services;

public interface IEmployeeIntegrationService
{
    Task<IReadOnlyList<EmployeeSnapshotDto>> GetEmployeesAsync(string? search, bool activeOnly, CancellationToken cancellationToken = default);
    Task<EmployeeSnapshotDto?> GetEmployeeBySourceIdAsync(int sourceEmployeeId, CancellationToken cancellationToken = default);
    Task<EmployeeSyncResultDto> SyncFromHrAsync(CancellationToken cancellationToken = default);
}
