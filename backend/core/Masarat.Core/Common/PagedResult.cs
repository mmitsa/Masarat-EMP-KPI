namespace Masarat.Core.Common;

/// <summary>
/// نتيجة مُقسّمة لصفحات
/// Paginated result wrapper
/// </summary>
public class PagedResult<T>
{
    /// <summary>
    /// البيانات
    /// </summary>
    public IEnumerable<T> Data { get; set; } = new List<T>();

    /// <summary>
    /// رقم الصفحة الحالية (يبدأ من 1)
    /// </summary>
    public int PageNumber { get; set; }

    /// <summary>
    /// حجم الصفحة
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// إجمالي عدد العناصر
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// إجمالي عدد الصفحات
    /// </summary>
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

    /// <summary>
    /// هل توجد صفحة سابقة؟
    /// </summary>
    public bool HasPreviousPage => PageNumber > 1;

    /// <summary>
    /// هل توجد صفحة تالية؟
    /// </summary>
    public bool HasNextPage => PageNumber < TotalPages;

    public PagedResult()
    {
    }

    public PagedResult(IEnumerable<T> data, int pageNumber, int pageSize, int totalCount)
    {
        Data = data;
        PageNumber = pageNumber;
        PageSize = pageSize;
        TotalCount = totalCount;
    }
}

/// <summary>
/// معاملات التقسيم
/// Pagination parameters
/// </summary>
public class PaginationParams
{
    private const int MaxPageSize = 100;
    private int _pageSize = 20;

    /// <summary>
    /// رقم الصفحة (يبدأ من 1)
    /// </summary>
    public int PageNumber { get; set; } = 1;

    /// <summary>
    /// حجم الصفحة (الحد الأقصى 100)
    /// </summary>
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : value;
    }
}
