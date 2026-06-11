using System;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Masarat.Core.Services.Reporting;

/// <summary>
/// خدمة إنشاء التقارير - PDF و Excel
/// Report Generation Service - PDF and Excel
/// </summary>
public interface IReportService
{
    /// <summary>
    /// إنشاء تقرير PDF - Generate PDF report
    /// </summary>
    Task<ReportResult> GeneratePdfAsync<T>(ReportDefinition<T> definition) where T : class;

    /// <summary>
    /// إنشاء تقرير Excel - Generate Excel report
    /// </summary>
    Task<ReportResult> GenerateExcelAsync<T>(ReportDefinition<T> definition) where T : class;

    /// <summary>
    /// إنشاء تقرير CSV - Generate CSV report
    /// </summary>
    Task<ReportResult> GenerateCsvAsync<T>(ReportDefinition<T> definition) where T : class;

    /// <summary>
    /// إنشاء تقرير من قالب - Generate report from template
    /// </summary>
    Task<ReportResult> GenerateFromTemplateAsync<T>(string templateName, T data, ReportFormat format) where T : class;

    /// <summary>
    /// إنشاء تقرير جدولي - Generate tabular report
    /// </summary>
    Task<ReportResult> GenerateTableReportAsync<T>(TableReportDefinition<T> definition) where T : class;

    /// <summary>
    /// دمج تقارير PDF - Merge PDF reports
    /// </summary>
    Task<ReportResult> MergePdfsAsync(IEnumerable<Stream> pdfStreams, string outputFileName);

    /// <summary>
    /// الحصول على القوالب المتاحة - Get available templates
    /// </summary>
    Task<IEnumerable<ReportTemplate>> GetAvailableTemplatesAsync();
}

/// <summary>
/// نتيجة إنشاء التقرير - Report Result
/// </summary>
public class ReportResult
{
    /// <summary>هل نجحت العملية - Was successful</summary>
    public bool Success { get; set; }

    /// <summary>محتوى التقرير - Report content stream</summary>
    public Stream? Content { get; set; }

    /// <summary>اسم الملف - File name</summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>نوع المحتوى - Content type</summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>حجم الملف بالبايت - File size in bytes</summary>
    public long Size { get; set; }

    /// <summary>رسالة الخطأ - Error message</summary>
    public string? ErrorMessage { get; set; }

    /// <summary>وقت الإنشاء - Generation time in ms</summary>
    public long GenerationTimeMs { get; set; }

    /// <summary>البيانات الوصفية - Metadata</summary>
    public Dictionary<string, string>? Metadata { get; set; }
}

/// <summary>
/// تعريف التقرير - Report Definition
/// </summary>
public class ReportDefinition<T> where T : class
{
    /// <summary>عنوان التقرير - Report title</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>العنوان الفرعي - Subtitle</summary>
    public string? Subtitle { get; set; }

    /// <summary>اسم الملف - File name (without extension)</summary>
    public string FileName { get; set; } = "report";

    /// <summary>البيانات - Data</summary>
    public IEnumerable<T> Data { get; set; } = new List<T>();

    /// <summary>تعريف الأعمدة - Column definitions</summary>
    public List<ColumnDefinition> Columns { get; set; } = new();

    /// <summary>خيارات التقرير - Report options</summary>
    public ReportOptions Options { get; set; } = new();

    /// <summary>الرأس - Header content</summary>
    public ReportHeader? Header { get; set; }

    /// <summary>التذييل - Footer content</summary>
    public ReportFooter? Footer { get; set; }

    /// <summary>ملخص - Summary section</summary>
    public ReportSummary? Summary { get; set; }

    /// <summary>فلاتر - Applied filters description</summary>
    public Dictionary<string, string>? AppliedFilters { get; set; }
}

/// <summary>
/// تعريف تقرير جدولي - Table Report Definition
/// </summary>
public class TableReportDefinition<T> : ReportDefinition<T> where T : class
{
    /// <summary>تجميع حسب - Group by field</summary>
    public string? GroupByField { get; set; }

    /// <summary>ترتيب - Sort order</summary>
    public List<SortDefinition>? SortOrder { get; set; }

    /// <summary>إجماليات - Show totals</summary>
    public bool ShowTotals { get; set; } = true;

    /// <summary>حقول الإجمالي - Total fields</summary>
    public List<string>? TotalFields { get; set; }

    /// <summary>إجماليات فرعية - Show subtotals per group</summary>
    public bool ShowSubtotals { get; set; } = false;
}

/// <summary>
/// تعريف العمود - Column Definition
/// </summary>
public class ColumnDefinition
{
    /// <summary>اسم الحقل - Property name</summary>
    public string PropertyName { get; set; } = string.Empty;

    /// <summary>عنوان العمود - Column header</summary>
    public string Header { get; set; } = string.Empty;

    /// <summary>العنوان بالإنجليزية - English header</summary>
    public string? HeaderEn { get; set; }

    /// <summary>العرض - Width (in percentage or pixels)</summary>
    public string? Width { get; set; }

    /// <summary>المحاذاة - Alignment</summary>
    public TextAlignment Alignment { get; set; } = TextAlignment.Right;

    /// <summary>تنسيق - Format string (e.g., "N2", "dd/MM/yyyy")</summary>
    public string? Format { get; set; }

    /// <summary>نوع البيانات - Data type</summary>
    public ColumnDataType DataType { get; set; } = ColumnDataType.Text;

    /// <summary>قابل للإجمال - Is summable</summary>
    public bool IsSummable { get; set; } = false;

    /// <summary>مخفي - Hidden column</summary>
    public bool IsHidden { get; set; } = false;

    /// <summary>دالة تنسيق مخصصة - Custom formatter</summary>
    public Func<object?, string>? CustomFormatter { get; set; }
}

/// <summary>
/// نوع بيانات العمود - Column Data Type
/// </summary>
public enum ColumnDataType
{
    Text,
    Number,
    Currency,
    Date,
    DateTime,
    Boolean,
    Percentage,
    Custom
}

/// <summary>
/// محاذاة النص - Text Alignment
/// </summary>
public enum TextAlignment
{
    Right,
    Left,
    Center
}

/// <summary>
/// صيغة التقرير - Report Format
/// </summary>
public enum ReportFormat
{
    Pdf,
    Excel,
    Csv,
    Html
}

/// <summary>
/// خيارات التقرير - Report Options
/// </summary>
public class ReportOptions
{
    /// <summary>اللغة - Language (ar/en)</summary>
    public string Language { get; set; } = "ar";

    /// <summary>اتجاه النص - Text direction</summary>
    public TextDirection Direction { get; set; } = TextDirection.Rtl;

    /// <summary>حجم الصفحة - Page size</summary>
    public PageSize PageSize { get; set; } = PageSize.A4;

    /// <summary>الاتجاه - Orientation</summary>
    public PageOrientation Orientation { get; set; } = PageOrientation.Portrait;

    /// <summary>الهوامش - Margins</summary>
    public PageMargins Margins { get; set; } = new();

    /// <summary>إظهار أرقام الصفحات - Show page numbers</summary>
    public bool ShowPageNumbers { get; set; } = true;

    /// <summary>إظهار التاريخ - Show generation date</summary>
    public bool ShowDate { get; set; } = true;

    /// <summary>إظهار الشعار - Show logo</summary>
    public bool ShowLogo { get; set; } = true;

    /// <summary>مسار الشعار - Logo path or URL</summary>
    public string? LogoPath { get; set; }

    /// <summary>ارتفاع الشعار - Logo height</summary>
    public int LogoHeight { get; set; } = 50;

    /// <summary>اسم الخط - Font name</summary>
    public string FontFamily { get; set; } = "Cairo";

    /// <summary>حجم الخط - Font size</summary>
    public int FontSize { get; set; } = 10;

    /// <summary>لون الرأس - Header color</summary>
    public string HeaderColor { get; set; } = "#1d4ed8";

    /// <summary>لون خطوط الجدول - Table border color</summary>
    public string BorderColor { get; set; } = "#e2e8f0";

    /// <summary>تلوين الصفوف - Alternate row colors</summary>
    public bool AlternateRowColors { get; set; } = true;

    /// <summary>لون الصف الزوجي - Even row color</summary>
    public string EvenRowColor { get; set; } = "#f8fafc";

    /// <summary>العملة - Currency symbol</summary>
    public string CurrencySymbol { get; set; } = "ريال";

    /// <summary>فاصل الآلاف - Thousands separator</summary>
    public string ThousandsSeparator { get; set; } = ",";

    /// <summary>فاصل العشري - Decimal separator</summary>
    public string DecimalSeparator { get; set; } = ".";

    /// <summary>عدد الأرقام العشرية - Decimal places</summary>
    public int DecimalPlaces { get; set; } = 2;

    /// <summary>اسم المنشأة - Organization name</summary>
    public string? OrganizationName { get; set; }
}

/// <summary>
/// اتجاه النص - Text Direction
/// </summary>
public enum TextDirection
{
    Rtl,
    Ltr
}

/// <summary>
/// حجم الصفحة - Page Size
/// </summary>
public enum PageSize
{
    A4,
    A3,
    Letter,
    Legal
}

/// <summary>
/// اتجاه الصفحة - Page Orientation
/// </summary>
public enum PageOrientation
{
    Portrait,
    Landscape
}

/// <summary>
/// هوامش الصفحة - Page Margins
/// </summary>
public class PageMargins
{
    public float Top { get; set; } = 20;
    public float Bottom { get; set; } = 20;
    public float Left { get; set; } = 20;
    public float Right { get; set; } = 20;
}

/// <summary>
/// رأس التقرير - Report Header
/// </summary>
public class ReportHeader
{
    /// <summary>عنوان مخصص - Custom title</summary>
    public string? CustomTitle { get; set; }

    /// <summary>نص إضافي - Additional text</summary>
    public string? AdditionalText { get; set; }

    /// <summary>إظهار التاريخ - Show date</summary>
    public bool ShowDate { get; set; } = true;

    /// <summary>صورة الشعار - Logo image bytes</summary>
    public byte[]? LogoImage { get; set; }
}

/// <summary>
/// تذييل التقرير - Report Footer
/// </summary>
public class ReportFooter
{
    /// <summary>نص التذييل - Footer text</summary>
    public string? Text { get; set; }

    /// <summary>إظهار رقم الصفحة - Show page number</summary>
    public bool ShowPageNumber { get; set; } = true;

    /// <summary>إظهار إجمالي الصفحات - Show total pages</summary>
    public bool ShowTotalPages { get; set; } = true;

    /// <summary>إظهار تاريخ الطباعة - Show print date</summary>
    public bool ShowPrintDate { get; set; } = true;
}

/// <summary>
/// ملخص التقرير - Report Summary
/// </summary>
public class ReportSummary
{
    /// <summary>عنوان الملخص - Summary title</summary>
    public string Title { get; set; } = "ملخص";

    /// <summary>عناصر الملخص - Summary items</summary>
    public List<SummaryItem> Items { get; set; } = new();

    /// <summary>موقع الملخص - Summary position</summary>
    public SummaryPosition Position { get; set; } = SummaryPosition.BeforeTable;
}

/// <summary>
/// عنصر ملخص - Summary Item
/// </summary>
public class SummaryItem
{
    /// <summary>التسمية - Label</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>القيمة - Value</summary>
    public string Value { get; set; } = string.Empty;

    /// <summary>نوع القيمة - Value type</summary>
    public SummaryValueType ValueType { get; set; } = SummaryValueType.Text;

    /// <summary>هل مميز - Is highlighted</summary>
    public bool IsHighlighted { get; set; } = false;
}

/// <summary>
/// نوع قيمة الملخص - Summary Value Type
/// </summary>
public enum SummaryValueType
{
    Text,
    Number,
    Currency,
    Percentage,
    Date
}

/// <summary>
/// موقع الملخص - Summary Position
/// </summary>
public enum SummaryPosition
{
    BeforeTable,
    AfterTable,
    Both
}

/// <summary>
/// تعريف الترتيب - Sort Definition
/// </summary>
public class SortDefinition
{
    /// <summary>اسم الحقل - Field name</summary>
    public string FieldName { get; set; } = string.Empty;

    /// <summary>تصاعدي - Ascending</summary>
    public bool Ascending { get; set; } = true;
}

/// <summary>
/// قالب التقرير - Report Template
/// </summary>
public class ReportTemplate
{
    /// <summary>اسم القالب - Template name</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>وصف القالب - Template description</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>الوصف بالعربية - Arabic description</summary>
    public string? DescriptionAr { get; set; }

    /// <summary>الصيغ المدعومة - Supported formats</summary>
    public List<ReportFormat> SupportedFormats { get; set; } = new();

    /// <summary>معاينة - Preview image URL</summary>
    public string? PreviewUrl { get; set; }

    /// <summary>الفئة - Category</summary>
    public string? Category { get; set; }
}

/// <summary>
/// إعدادات خدمة التقارير - Report Service Settings
/// </summary>
public class ReportSettings
{
    /// <summary>مجلد القوالب - Templates directory</summary>
    public string TemplatesDirectory { get; set; } = "templates/reports";

    /// <summary>مجلد الملفات المؤقتة - Temp directory</summary>
    public string TempDirectory { get; set; } = "/tmp/reports";

    /// <summary>مسار الخط العربي - Arabic font path</summary>
    public string ArabicFontPath { get; set; } = "fonts/Cairo-Regular.ttf";

    /// <summary>مسار الشعار الافتراضي - Default logo path</summary>
    public string? DefaultLogoPath { get; set; }

    /// <summary>اسم المنشأة الافتراضي - Default organization name</summary>
    public string DefaultOrganizationName { get; set; } = "منصة مسارات";

    /// <summary>الحجم الأقصى للتقرير (MB) - Max report size</summary>
    public int MaxReportSizeMB { get; set; } = 50;

    /// <summary>الحد الأقصى للصفوف - Max rows per report</summary>
    public int MaxRows { get; set; } = 50000;

    /// <summary>تفعيل التخزين المؤقت - Enable caching</summary>
    public bool EnableCaching { get; set; } = true;

    /// <summary>مدة التخزين المؤقت (دقائق) - Cache duration</summary>
    public int CacheDurationMinutes { get; set; } = 30;
}
