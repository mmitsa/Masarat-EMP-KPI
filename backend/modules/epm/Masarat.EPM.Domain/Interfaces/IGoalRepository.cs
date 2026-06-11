using Masarat.EPM.Domain.Entities;

namespace Masarat.EPM.Domain.Interfaces;

/// <summary>
/// واجهة مستودع الأهداف
/// </summary>
public interface IGoalRepository
{
    Task<IEnumerable<Goal>> GetAllAsync();
    Task<Goal?> GetByIdAsync(int id);
    Task<IEnumerable<Goal>> GetByCharterIdAsync(int charterId);
    Task<Goal> AddAsync(Goal goal);
    Task UpdateAsync(Goal goal);
    Task DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);

    /// <summary>
    /// التحقق من صحة مجموع الأوزان لميثاق معين (يجب أن يساوي 100)
    /// </summary>
    Task<bool> ValidateWeightsSumAsync(int charterId);

    /// <summary>
    /// حساب متوسط الدرجات المرجحة لميثاق معين
    /// </summary>
    Task<decimal> CalculateCharterGoalsScoreAsync(int charterId);
}
