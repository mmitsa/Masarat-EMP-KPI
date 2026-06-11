using Masarat.EPM.Domain.Entities;

namespace Masarat.EPM.Domain.Interfaces;

/// <summary>
/// واجهة مستودع الجدارات
/// </summary>
public interface ICompetencyRepository
{
    Task<IEnumerable<Competency>> GetAllAsync();
    Task<Competency?> GetByIdAsync(int id);
    Task<IEnumerable<Competency>> GetByCharterIdAsync(int charterId);
    Task<Competency> AddAsync(Competency competency);
    Task UpdateAsync(Competency competency);
    Task DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);

    /// <summary>
    /// التحقق من صحة مجموع الأوزان لميثاق معين (يجب أن يساوي 100)
    /// </summary>
    Task<bool> ValidateWeightsSumAsync(int charterId);

    /// <summary>
    /// حساب متوسط الدرجات المرجحة لميثاق معين
    /// </summary>
    Task<decimal> CalculateCharterCompetenciesScoreAsync(int charterId);
}
