using System;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Masarat.Core.Services.OCR;

/// <summary>
/// خدمة التعرف الضوئي على النصوص (OCR)
/// Optical Character Recognition (OCR) Service
/// </summary>
public interface IOcrService
{
    /// <summary>
    /// استخراج النص من صورة - Extract text from image
    /// </summary>
    Task<OcrResult> ExtractTextAsync(Stream imageStream, OcrOptions? options = null);

    /// <summary>
    /// استخراج النص من ملف صورة - Extract text from image file
    /// </summary>
    Task<OcrResult> ExtractTextAsync(string imagePath, OcrOptions? options = null);

    /// <summary>
    /// استخراج النص من صورة Base64 - Extract text from Base64 image
    /// </summary>
    Task<OcrResult> ExtractTextFromBase64Async(string base64Image, OcrOptions? options = null);

    /// <summary>
    /// استخراج النص من PDF - Extract text from PDF
    /// </summary>
    Task<OcrResult> ExtractTextFromPdfAsync(Stream pdfStream, OcrOptions? options = null);

    /// <summary>
    /// استخراج النص من PDF (من ملف) - Extract text from PDF file
    /// </summary>
    Task<OcrResult> ExtractTextFromPdfAsync(string pdfPath, OcrOptions? options = null);

    /// <summary>
    /// استخراج نص مع تحديد الموقع - Extract text with bounding boxes
    /// </summary>
    Task<OcrDetailedResult> ExtractTextWithBoundsAsync(Stream imageStream, OcrOptions? options = null);

    /// <summary>
    /// التحقق من دعم اللغة - Check if language is supported
    /// </summary>
    Task<bool> IsLanguageSupportedAsync(string languageCode);

    /// <summary>
    /// الحصول على اللغات المدعومة - Get supported languages
    /// </summary>
    Task<IEnumerable<OcrLanguage>> GetSupportedLanguagesAsync();
}

/// <summary>
/// خيارات OCR - OCR Options
/// </summary>
public class OcrOptions
{
    /// <summary>اللغات المستخدمة (مثل: ara, eng) - Languages to use</summary>
    public List<string> Languages { get; set; } = new() { "ara", "eng" };

    /// <summary>مستوى دقة الصفحة - Page segmentation mode</summary>
    public PageSegmentationMode SegmentationMode { get; set; } = PageSegmentationMode.Auto;

    /// <summary>مستوى محرك OCR - OCR engine mode</summary>
    public OcrEngineMode EngineMode { get; set; } = OcrEngineMode.Default;

    /// <summary>تطبيق معالجة الصورة - Apply image preprocessing</summary>
    public bool PreprocessImage { get; set; } = true;

    /// <summary>إزالة الضوضاء - Remove noise</summary>
    public bool DenoiseImage { get; set; } = true;

    /// <summary>تحسين التباين - Enhance contrast</summary>
    public bool EnhanceContrast { get; set; } = true;

    /// <summary>تصحيح الانحراف - Deskew image</summary>
    public bool Deskew { get; set; } = true;

    /// <summary>الحد الأدنى للثقة (0-100) - Minimum confidence threshold</summary>
    public int MinConfidence { get; set; } = 30;

    /// <summary>دقة DPI للمسح - DPI for scanning</summary>
    public int Dpi { get; set; } = 300;

    /// <summary>نوع الإخراج - Output type</summary>
    public OcrOutputType OutputType { get; set; } = OcrOutputType.PlainText;
}

/// <summary>
/// أوضاع تقسيم الصفحة - Page Segmentation Modes
/// </summary>
public enum PageSegmentationMode
{
    /// <summary>تلقائي - Automatic</summary>
    Auto = 3,

    /// <summary>عمود واحد - Single column</summary>
    SingleColumn = 4,

    /// <summary>كتلة واحدة من النص - Single uniform block</summary>
    SingleBlock = 6,

    /// <summary>سطر واحد - Single line</summary>
    SingleLine = 7,

    /// <summary>كلمة واحدة - Single word</summary>
    SingleWord = 8,

    /// <summary>حرف واحد - Single character</summary>
    SingleChar = 10,

    /// <summary>النص المتناثر - Sparse text</summary>
    SparseText = 11
}

/// <summary>
/// أوضاع محرك OCR - OCR Engine Modes
/// </summary>
public enum OcrEngineMode
{
    /// <summary>الوضع الافتراضي - Default mode</summary>
    Default = 3,

    /// <summary>Tesseract فقط - Tesseract only</summary>
    TesseractOnly = 0,

    /// <summary>LSTM فقط - LSTM only</summary>
    LstmOnly = 1,

    /// <summary>Tesseract + LSTM - Combined</summary>
    TesseractAndLstm = 2
}

/// <summary>
/// نوع الإخراج - Output Type
/// </summary>
public enum OcrOutputType
{
    /// <summary>نص عادي - Plain text</summary>
    PlainText,

    /// <summary>HTML - HTML format</summary>
    Html,

    /// <summary>hOCR - hOCR format</summary>
    Hocr,

    /// <summary>TSV - Tab-separated values</summary>
    Tsv,

    /// <summary>PDF قابل للبحث - Searchable PDF</summary>
    SearchablePdf
}

/// <summary>
/// نتيجة OCR - OCR Result
/// </summary>
public class OcrResult
{
    /// <summary>هل نجحت العملية - Was successful</summary>
    public bool Success { get; set; }

    /// <summary>النص المستخرج - Extracted text</summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>مستوى الثقة (0-100) - Confidence level</summary>
    public float Confidence { get; set; }

    /// <summary>اللغات المكتشفة - Detected languages</summary>
    public List<string> DetectedLanguages { get; set; } = new();

    /// <summary>عدد الكلمات - Word count</summary>
    public int WordCount { get; set; }

    /// <summary>عدد الأحرف - Character count</summary>
    public int CharacterCount { get; set; }

    /// <summary>وقت المعالجة بالمللي ثانية - Processing time in ms</summary>
    public long ProcessingTimeMs { get; set; }

    /// <summary>رسالة الخطأ - Error message</summary>
    public string? ErrorMessage { get; set; }

    /// <summary>البيانات الوصفية - Metadata</summary>
    public Dictionary<string, string>? Metadata { get; set; }
}

/// <summary>
/// نتيجة OCR مفصلة مع الإحداثيات - Detailed OCR Result with coordinates
/// </summary>
public class OcrDetailedResult : OcrResult
{
    /// <summary>الصفحات - Pages</summary>
    public List<OcrPage> Pages { get; set; } = new();
}

/// <summary>
/// صفحة OCR - OCR Page
/// </summary>
public class OcrPage
{
    /// <summary>رقم الصفحة - Page number</summary>
    public int PageNumber { get; set; }

    /// <summary>عرض الصفحة - Page width</summary>
    public int Width { get; set; }

    /// <summary>ارتفاع الصفحة - Page height</summary>
    public int Height { get; set; }

    /// <summary>الكتل النصية - Text blocks</summary>
    public List<OcrBlock> Blocks { get; set; } = new();
}

/// <summary>
/// كتلة نصية - Text Block
/// </summary>
public class OcrBlock
{
    /// <summary>النص - Text content</summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>مستوى الثقة - Confidence</summary>
    public float Confidence { get; set; }

    /// <summary>إحداثيات الكتلة - Bounding box</summary>
    public BoundingBox BoundingBox { get; set; } = new();

    /// <summary>الفقرات - Paragraphs</summary>
    public List<OcrParagraph> Paragraphs { get; set; } = new();
}

/// <summary>
/// فقرة - Paragraph
/// </summary>
public class OcrParagraph
{
    /// <summary>النص - Text content</summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>مستوى الثقة - Confidence</summary>
    public float Confidence { get; set; }

    /// <summary>إحداثيات الفقرة - Bounding box</summary>
    public BoundingBox BoundingBox { get; set; } = new();

    /// <summary>الأسطر - Lines</summary>
    public List<OcrLine> Lines { get; set; } = new();
}

/// <summary>
/// سطر - Line
/// </summary>
public class OcrLine
{
    /// <summary>النص - Text content</summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>مستوى الثقة - Confidence</summary>
    public float Confidence { get; set; }

    /// <summary>إحداثيات السطر - Bounding box</summary>
    public BoundingBox BoundingBox { get; set; } = new();

    /// <summary>الكلمات - Words</summary>
    public List<OcrWord> Words { get; set; } = new();
}

/// <summary>
/// كلمة - Word
/// </summary>
public class OcrWord
{
    /// <summary>الكلمة - Word text</summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>مستوى الثقة - Confidence</summary>
    public float Confidence { get; set; }

    /// <summary>إحداثيات الكلمة - Bounding box</summary>
    public BoundingBox BoundingBox { get; set; } = new();

    /// <summary>اللغة المكتشفة - Detected language</summary>
    public string? DetectedLanguage { get; set; }
}

/// <summary>
/// إحداثيات المربع المحيط - Bounding Box
/// </summary>
public class BoundingBox
{
    /// <summary>الإحداثي X - X coordinate</summary>
    public int X { get; set; }

    /// <summary>الإحداثي Y - Y coordinate</summary>
    public int Y { get; set; }

    /// <summary>العرض - Width</summary>
    public int Width { get; set; }

    /// <summary>الارتفاع - Height</summary>
    public int Height { get; set; }

    /// <summary>الإحداثي X2 - X2 coordinate</summary>
    public int X2 => X + Width;

    /// <summary>الإحداثي Y2 - Y2 coordinate</summary>
    public int Y2 => Y + Height;
}

/// <summary>
/// لغة OCR - OCR Language
/// </summary>
public class OcrLanguage
{
    /// <summary>كود اللغة - Language code</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>اسم اللغة - Language name</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>الاسم بالعربية - Arabic name</summary>
    public string? ArabicName { get; set; }

    /// <summary>RTL - Right to left</summary>
    public bool IsRtl { get; set; }
}

/// <summary>
/// إعدادات OCR - OCR Settings
/// </summary>
public class OcrSettings
{
    /// <summary>مسار Tesseract - Tesseract executable path</summary>
    public string TesseractPath { get; set; } = "/usr/bin/tesseract";

    /// <summary>مسار بيانات اللغة - Tessdata path</summary>
    public string TessdataPath { get; set; } = "/usr/share/tesseract-ocr/5/tessdata";

    /// <summary>اللغة الافتراضية - Default language</summary>
    public string DefaultLanguage { get; set; } = "ara+eng";

    /// <summary>الحد الأقصى لحجم الصورة (بالميجابايت) - Max image size in MB</summary>
    public int MaxImageSizeMB { get; set; } = 20;

    /// <summary>مهلة المعالجة (بالثواني) - Processing timeout in seconds</summary>
    public int TimeoutSeconds { get; set; } = 60;

    /// <summary>مجلد الملفات المؤقتة - Temp files directory</summary>
    public string TempDirectory { get; set; } = "/tmp/ocr";

    /// <summary>تفعيل التخزين المؤقت - Enable caching</summary>
    public bool EnableCaching { get; set; } = true;

    /// <summary>مدة التخزين المؤقت (بالدقائق) - Cache duration in minutes</summary>
    public int CacheDurationMinutes { get; set; } = 60;
}
