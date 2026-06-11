using System;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Linq;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Masarat.Core.Services.FileStorage;

/// <summary>
/// خدمة التخزين المحلي للملفات
/// Local File Storage Service Implementation
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private readonly FileStorageSettings _settings;
    private readonly ILogger<LocalFileStorageService> _logger;
    private readonly string _rootPath;

    public LocalFileStorageService(
        IOptions<FileStorageSettings> settings,
        ILogger<LocalFileStorageService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
        _rootPath = Path.GetFullPath(_settings.LocalStoragePath);

        // Ensure root directory exists
        if (!Directory.Exists(_rootPath))
        {
            Directory.CreateDirectory(_rootPath);
        }
    }

    public async Task<FileUploadResult> UploadAsync(Stream fileStream, string fileName, string contentType, string? folder = null)
    {
        try
        {
            // Validate file extension
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            if (!_settings.AllowedExtensions.Contains(extension))
            {
                return new FileUploadResult
                {
                    Success = false,
                    ErrorMessage = $"File extension '{extension}' is not allowed. الامتداد '{extension}' غير مسموح به."
                };
            }

            // Check file size
            if (fileStream.Length > _settings.MaxFileSizeMB * 1024 * 1024)
            {
                return new FileUploadResult
                {
                    Success = false,
                    ErrorMessage = $"File size exceeds maximum allowed ({_settings.MaxFileSizeMB}MB). حجم الملف يتجاوز الحد المسموح."
                };
            }

            // Generate unique file key
            var fileKey = GenerateFileKey(fileName, folder);
            var fullPath = GetFullPath(fileKey);

            // Ensure directory exists
            var directory = Path.GetDirectoryName(fullPath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            // Calculate hash and save file
            string hash;
            using (var sha256 = SHA256.Create())
            using (var fileStreamOut = new FileStream(fullPath, FileMode.Create, FileAccess.Write))
            {
                // Read file into memory for hashing
                using var memoryStream = new MemoryStream();
                await fileStream.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                // Calculate hash
                hash = Convert.ToBase64String(sha256.ComputeHash(memoryStream.ToArray()));

                // Save file
                memoryStream.Position = 0;
                await memoryStream.CopyToAsync(fileStreamOut);
            }

            var fileInfo = new FileInfo(fullPath);

            _logger.LogInformation("File uploaded successfully: {FileKey}, Size: {Size} bytes", fileKey, fileInfo.Length);

            return new FileUploadResult
            {
                Success = true,
                FileKey = fileKey,
                OriginalFileName = fileName,
                Url = $"{_settings.BaseUrl}/{fileKey}",
                Size = fileInfo.Length,
                ContentType = contentType,
                Hash = hash,
                UploadedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file: {FileName}", fileName);
            return new FileUploadResult
            {
                Success = false,
                ErrorMessage = $"Error uploading file: {ex.Message}"
            };
        }
    }

    public async Task<FileUploadResult> UploadAsync(string filePath, string? folder = null)
    {
        if (!File.Exists(filePath))
        {
            return new FileUploadResult
            {
                Success = false,
                ErrorMessage = $"File not found: {filePath}"
            };
        }

        var fileName = Path.GetFileName(filePath);
        var contentType = GetContentType(fileName);

        using var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        return await UploadAsync(fileStream, fileName, contentType, folder);
    }

    public async Task<FileUploadResult> UploadBase64Async(string base64Content, string fileName, string contentType, string? folder = null)
    {
        try
        {
            var bytes = Convert.FromBase64String(base64Content);
            using var memoryStream = new MemoryStream(bytes);
            return await UploadAsync(memoryStream, fileName, contentType, folder);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading base64 file: {FileName}", fileName);
            return new FileUploadResult
            {
                Success = false,
                ErrorMessage = $"Invalid base64 content: {ex.Message}"
            };
        }
    }

    public async Task<FileDownloadResult?> DownloadAsync(string fileKey)
    {
        try
        {
            var fullPath = GetFullPath(fileKey);

            if (!File.Exists(fullPath))
            {
                _logger.LogWarning("File not found: {FileKey}", fileKey);
                return null;
            }

            var fileInfo = new FileInfo(fullPath);
            var memoryStream = new MemoryStream();

            using (var fileStream = new FileStream(fullPath, FileMode.Open, FileAccess.Read))
            {
                await fileStream.CopyToAsync(memoryStream);
            }

            memoryStream.Position = 0;

            return new FileDownloadResult
            {
                Content = memoryStream,
                FileName = Path.GetFileName(fileKey),
                ContentType = GetContentType(fileKey),
                Size = fileInfo.Length,
                LastModified = fileInfo.LastWriteTimeUtc
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading file: {FileKey}", fileKey);
            return null;
        }
    }

    public Task<bool> DeleteAsync(string fileKey)
    {
        try
        {
            var fullPath = GetFullPath(fileKey);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                _logger.LogInformation("File deleted: {FileKey}", fileKey);
                return Task.FromResult(true);
            }

            _logger.LogWarning("File not found for deletion: {FileKey}", fileKey);
            return Task.FromResult(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file: {FileKey}", fileKey);
            return Task.FromResult(false);
        }
    }

    public async Task<bool> DeleteManyAsync(IEnumerable<string> fileKeys)
    {
        var results = new List<bool>();
        foreach (var fileKey in fileKeys)
        {
            results.Add(await DeleteAsync(fileKey));
        }
        return results.All(r => r);
    }

    public Task<bool> ExistsAsync(string fileKey)
    {
        var fullPath = GetFullPath(fileKey);
        return Task.FromResult(File.Exists(fullPath));
    }

    public Task<string?> GetTemporaryUrlAsync(string fileKey, TimeSpan? expiry = null)
    {
        // For local storage, just return the permanent URL
        // In production, you might implement signed URLs
        return GetPermanentUrlAsync(fileKey);
    }

    public Task<string?> GetPermanentUrlAsync(string fileKey)
    {
        var fullPath = GetFullPath(fileKey);
        if (!File.Exists(fullPath))
        {
            return Task.FromResult<string?>(null);
        }

        return Task.FromResult<string?>($"{_settings.BaseUrl}/{fileKey}");
    }

    public Task<FileMetadata?> GetMetadataAsync(string fileKey)
    {
        try
        {
            var fullPath = GetFullPath(fileKey);

            if (!File.Exists(fullPath))
            {
                return Task.FromResult<FileMetadata?>(null);
            }

            var fileInfo = new FileInfo(fullPath);

            return Task.FromResult<FileMetadata?>(new FileMetadata
            {
                FileKey = fileKey,
                FileName = fileInfo.Name,
                ContentType = GetContentType(fileKey),
                Size = fileInfo.Length,
                CreatedAt = fileInfo.CreationTimeUtc,
                LastModified = fileInfo.LastWriteTimeUtc,
                Folder = Path.GetDirectoryName(fileKey)?.Replace("\\", "/")
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting metadata: {FileKey}", fileKey);
            return Task.FromResult<FileMetadata?>(null);
        }
    }

    public async Task<FileUploadResult?> CopyAsync(string sourceKey, string destinationFolder)
    {
        try
        {
            var downloadResult = await DownloadAsync(sourceKey);
            if (downloadResult == null)
            {
                return null;
            }

            return await UploadAsync(
                downloadResult.Content,
                downloadResult.FileName,
                downloadResult.ContentType,
                destinationFolder);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error copying file: {SourceKey}", sourceKey);
            return null;
        }
    }

    public async Task<FileUploadResult?> MoveAsync(string sourceKey, string destinationFolder)
    {
        var copyResult = await CopyAsync(sourceKey, destinationFolder);
        if (copyResult?.Success == true)
        {
            await DeleteAsync(sourceKey);
        }
        return copyResult;
    }

    public Task<IEnumerable<FileMetadata>> ListFilesAsync(string folder, int? maxResults = null)
    {
        try
        {
            var folderPath = string.IsNullOrEmpty(folder)
                ? _rootPath
                : Path.Combine(_rootPath, folder.Replace("/", Path.DirectorySeparatorChar.ToString()));

            if (!Directory.Exists(folderPath))
            {
                return Task.FromResult<IEnumerable<FileMetadata>>(Array.Empty<FileMetadata>());
            }

            var files = Directory.GetFiles(folderPath, "*", SearchOption.AllDirectories)
                .Select(path =>
                {
                    var fileInfo = new FileInfo(path);
                    var relativePath = Path.GetRelativePath(_rootPath, path).Replace("\\", "/");

                    return new FileMetadata
                    {
                        FileKey = relativePath,
                        FileName = fileInfo.Name,
                        ContentType = GetContentType(fileInfo.Name),
                        Size = fileInfo.Length,
                        CreatedAt = fileInfo.CreationTimeUtc,
                        LastModified = fileInfo.LastWriteTimeUtc,
                        Folder = Path.GetDirectoryName(relativePath)?.Replace("\\", "/")
                    };
                });

            if (maxResults.HasValue)
            {
                files = files.Take(maxResults.Value);
            }

            return Task.FromResult(files);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing files in folder: {Folder}", folder);
            return Task.FromResult<IEnumerable<FileMetadata>>(Array.Empty<FileMetadata>());
        }
    }

    #region Private Methods

    private string GenerateFileKey(string fileName, string? folder)
    {
        var sanitizedFileName = SanitizeFileName(fileName);
        var uniqueId = Guid.NewGuid().ToString("N")[..8];
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd");

        var newFileName = $"{Path.GetFileNameWithoutExtension(sanitizedFileName)}_{timestamp}_{uniqueId}{Path.GetExtension(sanitizedFileName)}";

        return string.IsNullOrEmpty(folder)
            ? newFileName
            : $"{folder.TrimEnd('/')}/{newFileName}";
    }

    private string SanitizeFileName(string fileName)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = string.Join("_", fileName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));
        return sanitized.Replace(" ", "_");
    }

    private string GetFullPath(string fileKey)
    {
        // Prevent path traversal attacks
        var normalizedKey = fileKey.Replace("..", "").Replace("//", "/");
        return Path.Combine(_rootPath, normalizedKey.Replace("/", Path.DirectorySeparatorChar.ToString()));
    }

    private static string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension switch
        {
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".ppt" => "application/vnd.ms-powerpoint",
            ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".bmp" => "image/bmp",
            ".webp" => "image/webp",
            ".svg" => "image/svg+xml",
            ".txt" => "text/plain",
            ".csv" => "text/csv",
            ".json" => "application/json",
            ".xml" => "application/xml",
            ".zip" => "application/zip",
            ".rar" => "application/vnd.rar",
            ".7z" => "application/x-7z-compressed",
            ".mp3" => "audio/mpeg",
            ".mp4" => "video/mp4",
            ".avi" => "video/x-msvideo",
            ".mov" => "video/quicktime",
            _ => "application/octet-stream"
        };
    }

    #endregion
}
