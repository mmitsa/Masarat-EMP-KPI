using Masarat.EPM.Domain.Entities;

namespace Masarat.EPM.Domain.Interfaces;

/// <summary>
/// واجهة مستودع عناصر التميز
/// </summary>
public interface IExcellenceElementRepository
{
    Task<IEnumerable<ExcellenceElement>> GetAllAsync();
    Task<ExcellenceElement?> GetByIdAsync(int id);
    Task<IEnumerable<ExcellenceElement>> GetByCharterIdAsync(int charterId);
    Task<IEnumerable<ExcellenceElement>> GetPendingApprovalsAsync();
    Task<ExcellenceElement> AddAsync(ExcellenceElement element);
    Task UpdateAsync(ExcellenceElement element);
    Task DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);

    /// <summary>
    /// حساب إجمالي النقاط الإضافية لميثاق معين
    /// </summary>
    Task<decimal> CalculateTotalBonusPointsAsync(int charterId);
}
