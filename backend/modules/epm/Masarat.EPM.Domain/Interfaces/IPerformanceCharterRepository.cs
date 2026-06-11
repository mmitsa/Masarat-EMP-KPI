using Masarat.EPM.Domain.Entities;

namespace Masarat.EPM.Domain.Interfaces;

/// <summary>
/// واجهة مستودع مواثيق الأداء
/// </summary>
public interface IPerformanceCharterRepository
{
    Task<IEnumerable<PerformanceCharter>> GetAllAsync();
    Task<PerformanceCharter?> GetByIdAsync(int id);
    Task<PerformanceCharter?> GetByEmployeeAndYearAsync(int employeeId, int fiscalYear);
    Task<IEnumerable<PerformanceCharter>> GetByManagerIdAsync(int managerId);
    Task<IEnumerable<PerformanceCharter>> GetByFiscalYearAsync(int fiscalYear);
    Task<IEnumerable<PerformanceCharter>> GetByStatusAsync(string status);
    Task<IEnumerable<PerformanceCharter>> GetDueForMidYearReviewAsync(int fiscalYear);
    Task<IEnumerable<PerformanceCharter>> GetDueForFinalEvaluationAsync(int fiscalYear);
    Task<IEnumerable<PerformanceCharter>> GetWithAppealsAsync();
    Task<PerformanceCharter> AddAsync(PerformanceCharter charter);
    Task UpdateAsync(PerformanceCharter charter);
    Task DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task<bool> EmployeeHasCharterForYearAsync(int employeeId, int fiscalYear);

    /// <summary>
    /// إحصائيات المواثيق حسب الحالة
    /// </summary>
    Task<Dictionary<string, int>> GetCharterStatisticsByStatusAsync(int fiscalYear);

    /// <summary>
    /// إحصائيات المواثيق حسب المدير
    /// </summary>
    Task<Dictionary<int, int>> GetCharterStatisticsByManagerAsync(int fiscalYear);
}
