using Masarat.EPM.Application.DTOs;

namespace Masarat.EPM.Application.Services;

/// <summary>
/// واجهة خدمة التقييمات
/// </summary>
public interface IEvaluationService
{
    /// <summary>
    /// الحصول على جميع التقييمات
    /// </summary>
    Task<IEnumerable<EvaluationDto>> GetAllEvaluationsAsync(int? year = null);

    /// <summary>
    /// الحصول على تقييم بواسطة المعرف
    /// </summary>
    Task<EvaluationDto?> GetEvaluationByIdAsync(int id);

    /// <summary>
    /// الحصول على تقييمات موظف معين
    /// </summary>
    Task<IEnumerable<EvaluationDto>> GetEvaluationsByEmployeeAsync(int employeeId);

    /// <summary>
    /// الحصول على تقييمات فترة معينة
    /// </summary>
    Task<IEnumerable<EvaluationDto>> GetEvaluationsByPeriodAsync(string period);

    /// <summary>
    /// الحصول على التقييمات المعلقة
    /// </summary>
    Task<IEnumerable<EvaluationDto>> GetPendingEvaluationsAsync();

    /// <summary>
    /// إنشاء تقييم جديد
    /// </summary>
    Task<EvaluationDto> CreateEvaluationAsync(CreateEvaluationDto dto);

    /// <summary>
    /// تحديث تقييم
    /// </summary>
    Task<EvaluationDto> UpdateEvaluationAsync(int id, UpdateEvaluationDto dto);

    /// <summary>
    /// تقديم التقييم للمراجعة
    /// </summary>
    Task SubmitEvaluationAsync(int id, SubmitEvaluationDto? dto = null);

    /// <summary>
    /// الموافقة على التقييم
    /// </summary>
    Task ApproveEvaluationAsync(int id, ApproveEvaluationDto? dto = null);

    /// <summary>
    /// رفض التقييم
    /// </summary>
    Task RejectEvaluationAsync(int id, RejectEvaluationDto dto);

    /// <summary>
    /// حذف تقييم
    /// </summary>
    Task DeleteEvaluationAsync(int id);

    /// <summary>
    /// الحصول على إحصائيات التقييمات
    /// </summary>
    Task<Dictionary<string, object>> GetEvaluationStatisticsAsync(int year);
}
