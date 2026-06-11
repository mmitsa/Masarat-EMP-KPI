using Masarat.EPM.Application.DTOs;

namespace Masarat.EPM.Application.Services;

public interface IPerformanceCharterService
{
    Task<IEnumerable<PerformanceCharterDto>> GetAllChartersAsync();
    Task<PerformanceCharterDto?> GetCharterByIdAsync(int id);
    Task<PerformanceCharterDto?> GetCharterByEmployeeAndYearAsync(int employeeId, int fiscalYear);
    Task<IEnumerable<PerformanceCharterDto>> GetChartersByManagerAsync(int managerId);
    Task<IEnumerable<PerformanceCharterDto>> GetChartersByYearAsync(int fiscalYear);
    Task<IEnumerable<PerformanceCharterDto>> GetDueForMidYearReviewAsync(int fiscalYear);
    Task<IEnumerable<PerformanceCharterDto>> GetDueForFinalEvaluationAsync(int fiscalYear);
    Task<PerformanceCharterDto> CreateCharterAsync(CreateCharterDto dto);
    Task SignCharterByEmployeeAsync(int charterId);
    Task ApproveCharterByManagerAsync(int charterId);
    Task PerformMidYearReviewAsync(int charterId, MidYearReviewDto dto);
    Task CompleteFinalEvaluationAsync(int charterId, FinalEvaluationDto dto);
    Task FileAppealAsync(int charterId, AppealDto dto);
    Task ProcessAppealAsync(int charterId, ProcessAppealDto dto);
    Task DeleteCharterAsync(int id);
    Task<Dictionary<string, int>> GetCharterStatisticsByStatusAsync(int fiscalYear);
}
