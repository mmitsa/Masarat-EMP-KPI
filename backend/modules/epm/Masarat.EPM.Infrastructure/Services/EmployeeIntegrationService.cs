using System.Net.Http.Json;
using System.Text.Json;
using Masarat.EPM.Application.DTOs;
using Masarat.EPM.Application.Services;
using Masarat.EPM.Domain.Entities;
using Masarat.EPM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Masarat.EPM.Infrastructure.Services;

public class EmployeeIntegrationService : IEmployeeIntegrationService
{
    private static readonly HashSet<string> ClosedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Archived",
        "Completed",
        "FinalEvaluationCompleted"
    };

    private readonly EPMDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmployeeIntegrationService> _logger;

    public EmployeeIntegrationService(
        EPMDbContext db,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<EmployeeIntegrationService> logger)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<IReadOnlyList<EmployeeSnapshotDto>> GetEmployeesAsync(
        string? search,
        bool activeOnly,
        CancellationToken cancellationToken = default)
    {
        var query = _db.EmployeeSnapshots.AsNoTracking();

        if (activeOnly)
        {
            query = query.Where(e => e.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(e =>
                e.NameAr.Contains(term) ||
                e.NationalId.Contains(term) ||
                (e.EmployeeNumber != null && e.EmployeeNumber.Contains(term)) ||
                (e.JobTitle != null && e.JobTitle.Contains(term)) ||
                (e.DepartmentName != null && e.DepartmentName.Contains(term)));
        }

        var employees = await query
            .OrderBy(e => e.NameAr)
            .Take(500)
            .ToListAsync(cancellationToken);

        return employees.Select(MapToDto).ToList();
    }

    public async Task<EmployeeSnapshotDto?> GetEmployeeBySourceIdAsync(
        int sourceEmployeeId,
        CancellationToken cancellationToken = default)
    {
        var employee = await _db.EmployeeSnapshots
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.SourceSystem == "HR" && e.SourceEmployeeId == sourceEmployeeId, cancellationToken);

        return employee == null ? null : MapToDto(employee);
    }

    public async Task<EmployeeSyncResultDto> SyncFromHrAsync(CancellationToken cancellationToken = default)
    {
        var startedAt = DateTime.UtcNow;
        var syncLog = new IntegrationSyncLog
        {
            IntegrationName = "HR",
            Status = "Started",
            StartedAt = startedAt
        };

        _db.IntegrationSyncLogs.Add(syncLog);
        await _db.SaveChangesAsync(cancellationToken);

        var result = new EmployeeSyncResultDto
        {
            IntegrationName = "HR",
            Status = "Completed",
            StartedAt = startedAt
        };

        try
        {
            var employees = await FetchEmployeesFromHrAsync(cancellationToken);
            result.PulledCount = employees.Count;

            foreach (var external in employees)
            {
                try
                {
                    var upsertResult = await UpsertEmployeeAsync(external, cancellationToken);
                    if (upsertResult == UpsertResult.Inserted)
                    {
                        result.InsertedCount++;
                    }
                    else if (upsertResult == UpsertResult.Updated)
                    {
                        result.UpdatedCount++;
                    }
                }
                catch (Exception ex)
                {
                    result.FailedCount++;
                    _logger.LogWarning(ex, "فشل تحديث موظف من HR أثناء المزامنة: {@Employee}", external);
                }
            }

            result.CompletedAt = DateTime.UtcNow;
            syncLog.Status = result.FailedCount > 0 ? "CompletedWithErrors" : "Completed";
            syncLog.PulledCount = result.PulledCount;
            syncLog.InsertedCount = result.InsertedCount;
            syncLog.UpdatedCount = result.UpdatedCount;
            syncLog.FailedCount = result.FailedCount;
            syncLog.CompletedAt = result.CompletedAt;
            _db.IntegrationSyncLogs.Update(syncLog);
            await _db.SaveChangesAsync(cancellationToken);

            return result;
        }
        catch (Exception ex)
        {
            result.Status = "Failed";
            result.ErrorMessage = ex.Message;
            result.CompletedAt = DateTime.UtcNow;

            syncLog.Status = "Failed";
            syncLog.ErrorMessage = ex.Message;
            syncLog.CompletedAt = result.CompletedAt;
            _db.IntegrationSyncLogs.Update(syncLog);
            await _db.SaveChangesAsync(cancellationToken);

            throw;
        }
    }

    private async Task<IReadOnlyList<ExternalEmployeeDto>> FetchEmployeesFromHrAsync(CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient("HrIntegration");
        var endpoint = _configuration["Integrations:HR:EmployeesEndpoint"] ?? "/api/hr/employees";
        var apiKey = _configuration["Integrations:HR:ApiKey"];

        using var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            request.Headers.TryAddWithoutValidation("X-Integration-Key", apiKey);
        }

        using var response = await client.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        var employeeArray = ResolveEmployeeArray(document.RootElement);
        return JsonSerializer.Deserialize<List<ExternalEmployeeDto>>(
                employeeArray.GetRawText(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? new List<ExternalEmployeeDto>();
    }

    private static JsonElement ResolveEmployeeArray(JsonElement root)
    {
        if (root.ValueKind == JsonValueKind.Array)
        {
            return root;
        }

        foreach (var propertyName in new[] { "data", "items", "employees", "results" })
        {
            if (root.TryGetProperty(propertyName, out var property) && property.ValueKind == JsonValueKind.Array)
            {
                return property;
            }
        }

        if (root.TryGetProperty("data", out var data)
            && data.ValueKind == JsonValueKind.Object
            && data.TryGetProperty("items", out var nestedItems)
            && nestedItems.ValueKind == JsonValueKind.Array)
        {
            return nestedItems;
        }

        throw new InvalidOperationException("استجابة HR لا تحتوي على قائمة موظفين قابلة للقراءة");
    }

    private async Task<UpsertResult> UpsertEmployeeAsync(ExternalEmployeeDto external, CancellationToken cancellationToken)
    {
        var sourceEmployeeId = external.EmployeeId ?? external.Id;
        if (sourceEmployeeId <= 0)
        {
            throw new InvalidOperationException("معرف الموظف القادم من HR غير صالح");
        }

        var nationalId = external.NationalId?.Trim();
        var nameAr = external.NameAr?.Trim() ?? external.FullName?.Trim();

        if (string.IsNullOrWhiteSpace(nationalId) || string.IsNullOrWhiteSpace(nameAr))
        {
            throw new InvalidOperationException("بيانات الموظف القادمة من HR ناقصة: رقم الهوية أو الاسم");
        }

        var snapshot = await _db.EmployeeSnapshots
            .AsTracking()
            .FirstOrDefaultAsync(e => e.SourceSystem == "HR" && e.SourceEmployeeId == sourceEmployeeId, cancellationToken);

        var now = DateTime.UtcNow;
        var status = string.IsNullOrWhiteSpace(external.Status) ? "Active" : external.Status.Trim();
        var isActive = IsActiveStatus(status);
        var result = snapshot == null ? UpsertResult.Inserted : UpsertResult.Updated;

        if (snapshot == null)
        {
            snapshot = new EmployeeSnapshot
            {
                SourceSystem = "HR",
                SourceEmployeeId = sourceEmployeeId,
                CreatedAt = now
            };
            _db.EmployeeSnapshots.Add(snapshot);
        }

        snapshot.EmployeeNumber = external.EmployeeNumber?.Trim();
        snapshot.NationalId = nationalId;
        snapshot.NameAr = nameAr;
        snapshot.NameEn = external.NameEn?.Trim();
        snapshot.Email = external.Email?.Trim();
        snapshot.PhoneNumber = external.PhoneNumber?.Trim() ?? external.Phone?.Trim();
        snapshot.DepartmentId = external.DepartmentId;
        snapshot.DepartmentName = external.DepartmentName?.Trim();
        snapshot.PositionId = external.PositionId;
        snapshot.JobTitle = external.JobTitle?.Trim();
        snapshot.ManagerEmployeeId = external.ManagerEmployeeId ?? external.DirectManagerId;
        snapshot.ManagerName = external.ManagerName?.Trim();
        snapshot.EmploymentStatus = status;
        snapshot.IsActive = isActive;
        snapshot.IsDeleted = !isActive;
        snapshot.LastSyncedAt = now;
        snapshot.UpdatedAt = result == UpsertResult.Updated ? now : null;

        await UpdateOpenChartersAsync(snapshot, cancellationToken);
        return result;
    }

    private async Task UpdateOpenChartersAsync(EmployeeSnapshot snapshot, CancellationToken cancellationToken)
    {
        var employeeCharters = await _db.PerformanceCharters
            .AsTracking()
            .Where(c => c.EmployeeId == snapshot.SourceEmployeeId && !ClosedStatuses.Contains(c.Status))
            .ToListAsync(cancellationToken);

        foreach (var charter in employeeCharters)
        {
            charter.EmployeeNationalId = snapshot.NationalId;
            charter.EmployeeName = snapshot.NameAr;
            charter.JobNumber = snapshot.EmployeeNumber;
            charter.JobTitle = snapshot.JobTitle;
            charter.DepartmentName = snapshot.DepartmentName;
            charter.ManagerId = snapshot.ManagerEmployeeId ?? charter.ManagerId;
            charter.ManagerName = snapshot.ManagerName ?? charter.ManagerName;
            charter.UpdatedAt = DateTime.UtcNow;
        }

        if (!string.IsNullOrWhiteSpace(snapshot.NameAr))
        {
            var managerCharters = await _db.PerformanceCharters
                .AsTracking()
                .Where(c => c.ManagerId == snapshot.SourceEmployeeId && !ClosedStatuses.Contains(c.Status))
                .ToListAsync(cancellationToken);

            foreach (var charter in managerCharters)
            {
                charter.ManagerName = snapshot.NameAr;
                charter.UpdatedAt = DateTime.UtcNow;
            }
        }
    }

    private static bool IsActiveStatus(string status)
    {
        return !status.Equals("Inactive", StringComparison.OrdinalIgnoreCase)
            && !status.Equals("Terminated", StringComparison.OrdinalIgnoreCase)
            && !status.Equals("Retired", StringComparison.OrdinalIgnoreCase)
            && !status.Equals("Resigned", StringComparison.OrdinalIgnoreCase)
            && !status.Equals("Suspended", StringComparison.OrdinalIgnoreCase);
    }

    private static EmployeeSnapshotDto MapToDto(EmployeeSnapshot employee)
    {
        return new EmployeeSnapshotDto
        {
            Id = employee.Id,
            SourceEmployeeId = employee.SourceEmployeeId,
            EmployeeNumber = employee.EmployeeNumber,
            NationalId = employee.NationalId,
            NameAr = employee.NameAr,
            NameEn = employee.NameEn,
            Email = employee.Email,
            PhoneNumber = employee.PhoneNumber,
            DepartmentId = employee.DepartmentId,
            DepartmentName = employee.DepartmentName,
            PositionId = employee.PositionId,
            JobTitle = employee.JobTitle,
            ManagerEmployeeId = employee.ManagerEmployeeId,
            ManagerName = employee.ManagerName,
            EmploymentStatus = employee.EmploymentStatus,
            SourceSystem = employee.SourceSystem,
            LastSyncedAt = employee.LastSyncedAt,
            IsActive = employee.IsActive
        };
    }

    private enum UpsertResult
    {
        Inserted,
        Updated
    }
}
