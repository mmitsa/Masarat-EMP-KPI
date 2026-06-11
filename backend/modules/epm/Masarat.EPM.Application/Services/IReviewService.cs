using Masarat.EPM.Application.DTOs;

namespace Masarat.EPM.Application.Services;

/// <summary>
/// واجهة خدمة المراجعات الدورية
/// </summary>
public interface IReviewService
{
    /// <summary>
    /// الحصول على جميع المراجعات
    /// </summary>
    Task<IEnumerable<ReviewDto>> GetAllReviewsAsync(string? period = null);

    /// <summary>
    /// الحصول على مراجعة بواسطة المعرف
    /// </summary>
    Task<ReviewDto?> GetReviewByIdAsync(int id);

    /// <summary>
    /// الحصول على مراجعات موظف معين
    /// </summary>
    Task<IEnumerable<ReviewDto>> GetReviewsByEmployeeAsync(int employeeId);

    /// <summary>
    /// الحصول على مراجعات فترة معينة
    /// </summary>
    Task<IEnumerable<ReviewDto>> GetReviewsByPeriodAsync(string period);

    /// <summary>
    /// إنشاء مراجعة جديدة
    /// </summary>
    Task<ReviewDto> CreateReviewAsync(CreateReviewDto dto);

    /// <summary>
    /// تحديث مراجعة
    /// </summary>
    Task<ReviewDto> UpdateReviewAsync(int id, UpdateReviewDto dto);

    /// <summary>
    /// إكمال المراجعة
    /// </summary>
    Task CompleteReviewAsync(int id, CompleteReviewDto? dto = null);

    /// <summary>
    /// حذف مراجعة
    /// </summary>
    Task DeleteReviewAsync(int id);

    /// <summary>
    /// الحصول على إحصائيات المراجعات
    /// </summary>
    Task<Dictionary<string, object>> GetReviewStatisticsAsync(string period);
}
