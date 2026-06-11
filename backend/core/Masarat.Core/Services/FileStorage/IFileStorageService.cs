using System;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Masarat.Core.Services.FileStorage;

/// <summary>
/// خدمة تخزين الملفات المتكاملة - تدعم التخزين المحلي و S3 و Azure Blob
/// Unified File Storage Service - Supports Local, S3, and Azure Blob Storage
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// رفع ملف - Upload a file
    /// </summary>
    Task<FileUploadResult> UploadAsync(Stream fileStream, string fileName, string contentType, string? folder = null);

    /// <summary>
    /// رفع ملف من مسار - Upload a file from path
    /// </summary>
    Task<FileUploadResult> UploadAsync(string filePath, string? folder = null);

    /// <summary>
    /// رفع ملف من Base64 - Upload a file from Base64
    /// </summary>
    Task<FileUploadResult> UploadBase64Async(string base64Content, string fileName, string contentType, string? folder = null);

    /// <summary>
    /// تنزيل ملف - Download a file
    /// </summary>
    Task<FileDownloadResult?> DownloadAsync(string fileKey);

    /// <summary>
    /// حذف ملف - Delete a file
    /// </summary>
    Task<bool> DeleteAsync(string fileKey);

    /// <summary>
    /// حذف مجموعة ملفات - Delete multiple files
    /// </summary>
    Task<bool> DeleteManyAsync(IEnumerable<string> fileKeys);

    /// <summary>
    /// التحقق من وجود ملف - Check if file exists
    /// </summary>
    Task<bool> ExistsAsync(string fileKey);

    /// <summary>
    /// الحصول على رابط مؤقت للملف - Get temporary URL for file
    /// </summary>
    Task<string?> GetTemporaryUrlAsync(string fileKey, TimeSpan? expiry = null);

    /// <summary>
    /// الحصول على رابط دائم للملف - Get permanent URL for file
    /// </summary>
    Task<string?> GetPermanentUrlAsync(string fileKey);

    /// <summary>
    /// الحصول على معلومات الملف - Get file metadata
    /// </summary>
    Task<FileMetadata?> GetMetadataAsync(string fileKey);

    /// <summary>
    /// نسخ ملف - Copy a file
    /// </summary>
    Task<FileUploadResult?> CopyAsync(string sourceKey, string destinationFolder);

    /// <summary>
    /// نقل ملف - Move a file
    /// </summary>
    Task<FileUploadResult?> MoveAsync(string sourceKey, string destinationFolder);

    /// <summary>
    /// الحصول على قائمة الملفات في مجلد - List files in a folder
    /// </summary>
    Task<IEnumerable<FileMetadata>> ListFilesAsync(string folder, int? maxResults = null);
}

/// <summary>
/// نتيجة رفع الملف - File Upload Result
/// </summary>
public class FileUploadResult
{
    /// <summary>هل نجحت العملية - Was the operation successful</summary>
    public bool Success { get; set; }

    /// <summary>مفتاح الملف الفريد - Unique file key</summary>
    public string FileKey { get; set; } = string.Empty;

    /// <summary>اسم الملف الأصلي - Original file name</summary>
    public string OriginalFileName { get; set; } = string.Empty;

    /// <summary>رابط الملف - File URL</summary>
    public string? Url { get; set; }

    /// <summary>حجم الملف بالبايت - File size in bytes</summary>
    public long Size { get; set; }

    /// <summary>نوع المحتوى - Content type</summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>رسالة الخطأ - Error message</summary>
    public string? ErrorMessage { get; set; }

    /// <summary>تاريخ الرفع - Upload date</summary>
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Hash للملف - File hash (SHA256)</summary>
    public string? Hash { get; set; }
}

/// <summary>
/// نتيجة تنزيل الملف - File Download Result
/// </summary>
public class FileDownloadResult
{
    /// <summary>محتوى الملف - File content stream</summary>
    public Stream Content { get; set; } = Stream.Null;

    /// <summary>اسم الملف - File name</summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>نوع المحتوى - Content type</summary>
    public string ContentType { get; set; } = "application/octet-stream";

    /// <summary>حجم الملف - File size</summary>
    public long Size { get; set; }

    /// <summary>تاريخ آخر تعديل - Last modified date</summary>
    public DateTime? LastModified { get; set; }
}

/// <summary>
/// بيانات الملف الوصفية - File Metadata
/// </summary>
public class FileMetadata
{
    /// <summary>مفتاح الملف - File key</summary>
    public string FileKey { get; set; } = string.Empty;

    /// <summary>اسم الملف - File name</summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>نوع المحتوى - Content type</summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>حجم الملف - File size</summary>
    public long Size { get; set; }

    /// <summary>تاريخ الإنشاء - Created date</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>تاريخ آخر تعديل - Last modified</summary>
    public DateTime? LastModified { get; set; }

    /// <summary>Hash الملف - File hash</summary>
    public string? Hash { get; set; }

    /// <summary>المجلد - Folder</summary>
    public string? Folder { get; set; }

    /// <summary>بيانات إضافية - Additional metadata</summary>
    public Dictionary<string, string>? CustomMetadata { get; set; }
}

/// <summary>
/// إعدادات تخزين الملفات - File Storage Settings
/// </summary>
public class FileStorageSettings
{
    /// <summary>نوع التخزين: Local, AzureBlob, S3 - Storage provider type</summary>
    public string Provider { get; set; } = "Local";

    /// <summary>المجلد الرئيسي للتخزين المحلي - Local storage root folder</summary>
    public string LocalStoragePath { get; set; } = "uploads";

    /// <summary>الرابط الأساسي للملفات - Base URL for files</summary>
    public string BaseUrl { get; set; } = "https://files.masarat.sa";

    /// <summary>الحجم الأقصى للملف (ميجابايت) - Max file size in MB</summary>
    public int MaxFileSizeMB { get; set; } = 50;

    /// <summary>الامتدادات المسموح بها - Allowed file extensions</summary>
    public List<string> AllowedExtensions { get; set; } = new()
    {
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp",
        ".txt", ".csv", ".json", ".xml",
        ".zip", ".rar", ".7z"
    };

    /// <summary>إعدادات Azure Blob - Azure Blob settings</summary>
    public AzureBlobSettings? AzureBlob { get; set; }

    /// <summary>إعدادات AWS S3 - AWS S3 settings</summary>
    public S3Settings? S3 { get; set; }
}

/// <summary>
/// إعدادات Azure Blob Storage
/// </summary>
public class AzureBlobSettings
{
    /// <summary>سلسلة الاتصال - Connection string</summary>
    public string ConnectionString { get; set; } = string.Empty;

    /// <summary>اسم الحاوية - Container name</summary>
    public string ContainerName { get; set; } = "masarat-files";

    /// <summary>مستوى الوصول - Access tier</summary>
    public string AccessTier { get; set; } = "Hot";
}

/// <summary>
/// إعدادات AWS S3
/// </summary>
public class S3Settings
{
    /// <summary>مفتاح الوصول - Access key</summary>
    public string AccessKey { get; set; } = string.Empty;

    /// <summary>المفتاح السري - Secret key</summary>
    public string SecretKey { get; set; } = string.Empty;

    /// <summary>المنطقة - Region</summary>
    public string Region { get; set; } = "me-south-1"; // Bahrain region

    /// <summary>اسم الـ Bucket</summary>
    public string BucketName { get; set; } = "masarat-files";

    /// <summary>رابط مخصص (للتخزين المتوافق مع S3) - Custom endpoint for S3-compatible storage</summary>
    public string? ServiceUrl { get; set; }

    /// <summary>استخدام Path Style - Use path style addressing</summary>
    public bool ForcePathStyle { get; set; } = false;
}
