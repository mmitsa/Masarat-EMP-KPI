using Masarat.EPM.Application.DTOs;

namespace Masarat.EPM.Application.Services;

/// <summary>
/// واجهة خدمة الأهداف
/// </summary>
public interface IGoalService
{
    /// <summary>
    /// الحصول على جميع الأهداف
    /// </summary>
    Task<IEnumerable<GoalDto>> GetAllGoalsAsync();

    /// <summary>
    /// الحصول على هدف بواسطة المعرف
    /// </summary>
    Task<GoalDto?> GetGoalByIdAsync(int id);

    /// <summary>
    /// الحصول على أهداف موظف معين
    /// </summary>
    Task<IEnumerable<GoalDto>> GetGoalsByEmployeeAsync(int employeeId);

    /// <summary>
    /// الحصول على أهداف ميثاق معين
    /// </summary>
    Task<IEnumerable<GoalDto>> GetGoalsByCharterAsync(int charterId);

    /// <summary>
    /// إنشاء هدف جديد
    /// </summary>
    Task<GoalDto> CreateGoalAsync(CreateGoalDto dto);

    /// <summary>
    /// تحديث هدف
    /// </summary>
    Task<GoalDto> UpdateGoalAsync(int id, CreateGoalDto dto);

    /// <summary>
    /// تحديث نسبة التقدم
    /// </summary>
    Task UpdateGoalProgressAsync(int id, UpdateGoalProgressDto dto);

    /// <summary>
    /// تقييم الهدف
    /// </summary>
    Task EvaluateGoalAsync(int id, EvaluateGoalDto dto);

    /// <summary>
    /// حذف هدف
    /// </summary>
    Task DeleteGoalAsync(int id);

    /// <summary>
    /// التحقق من صحة أوزان الأهداف
    /// </summary>
    Task<bool> ValidateGoalWeightsAsync(int charterId);

    /// <summary>
    /// الحصول على إحصائيات الأهداف
    /// </summary>
    Task<Dictionary<string, object>> GetGoalStatisticsAsync(int charterId);
}
