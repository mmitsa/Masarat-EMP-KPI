using System;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Globalization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Masarat.Core.Services.FileStorage;

/// <summary>
/// خدمة تخزين الملفات على S3 (متوافق مع AWS S3 و MinIO)
/// S3 File Storage Service (Compatible with AWS S3 and MinIO)
/// </summary>
public class S3FileStorageService : IFileStorageService
{
    private readonly FileStorageSettings _settings;
    private readonly S3Settings _s3Settings;
    private readonly ILogger<S3FileStorageService> _logger;
    private readonly HttpClient _httpClient;

    public S3FileStorageService(
        IOptions<FileStorageSettings> settings,
        ILogger<S3FileStorageService> logger,
        HttpClient httpClient)
    {
        _settings = settings.Value;
        _s3Settings = settings.Value.S3 ?? throw new ArgumentException("S3 settings are required");
        _logger = logger;
        _httpClient = httpClient;
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

            // Read file into memory
            using var memoryStream = new MemoryStream();
            await fileStream.CopyToAsync(memoryStream);
            var content = memoryStream.ToArray();

            // Calculate hash
            string hash;
            using (var sha256 = SHA256.Create())
            {
                hash = Convert.ToBase64String(sha256.ComputeHash(content));
            }

            // Upload to S3
            var success = await PutObjectAsync(fileKey, content, contentType);

            if (!success)
            {
                return new FileUploadResult
                {
                    Success = false,
                    ErrorMessage = "Failed to upload file to S3. فشل رفع الملف إلى S3."
                };
            }

            _logger.LogInformation("File uploaded to S3: {FileKey}, Size: {Size} bytes", fileKey, content.Length);

            return new FileUploadResult
            {
                Success = true,
                FileKey = fileKey,
                OriginalFileName = fileName,
                Url = GetObjectUrl(fileKey),
                Size = content.Length,
                ContentType = contentType,
                Hash = hash,
                UploadedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file to S3: {FileName}", fileName);
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
            _logger.LogError(ex, "Error uploading base64 file to S3: {FileName}", fileName);
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
            var (content, metadata) = await GetObjectAsync(fileKey);

            if (content == null)
            {
                _logger.LogWarning("File not found in S3: {FileKey}", fileKey);
                return null;
            }

            return new FileDownloadResult
            {
                Content = new MemoryStream(content),
                FileName = Path.GetFileName(fileKey),
                ContentType = metadata.ContentType ?? GetContentType(fileKey),
                Size = content.Length,
                LastModified = metadata.LastModified
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading file from S3: {FileKey}", fileKey);
            return null;
        }
    }

    public async Task<bool> DeleteAsync(string fileKey)
    {
        try
        {
            return await DeleteObjectAsync(fileKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file from S3: {FileKey}", fileKey);
            return false;
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

    public async Task<bool> ExistsAsync(string fileKey)
    {
        try
        {
            return await HeadObjectAsync(fileKey);
        }
        catch
        {
            return false;
        }
    }

    public Task<string?> GetTemporaryUrlAsync(string fileKey, TimeSpan? expiry = null)
    {
        var expiryTime = expiry ?? TimeSpan.FromHours(1);
        var url = GeneratePresignedUrl(fileKey, expiryTime);
        return Task.FromResult<string?>(url);
    }

    public Task<string?> GetPermanentUrlAsync(string fileKey)
    {
        return Task.FromResult<string?>(GetObjectUrl(fileKey));
    }

    public async Task<FileMetadata?> GetMetadataAsync(string fileKey)
    {
        try
        {
            var metadata = await HeadObjectMetadataAsync(fileKey);
            if (metadata == null)
            {
                return null;
            }

            return new FileMetadata
            {
                FileKey = fileKey,
                FileName = Path.GetFileName(fileKey),
                ContentType = metadata.ContentType ?? GetContentType(fileKey),
                Size = metadata.ContentLength,
                LastModified = metadata.LastModified,
                Folder = Path.GetDirectoryName(fileKey)?.Replace("\\", "/")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting metadata from S3: {FileKey}", fileKey);
            return null;
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
            _logger.LogError(ex, "Error copying file in S3: {SourceKey}", sourceKey);
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

    public async Task<IEnumerable<FileMetadata>> ListFilesAsync(string folder, int? maxResults = null)
    {
        try
        {
            var objects = await ListObjectsAsync(folder, maxResults);
            return objects.Select(obj => new FileMetadata
            {
                FileKey = obj.Key,
                FileName = Path.GetFileName(obj.Key),
                ContentType = GetContentType(obj.Key),
                Size = obj.Size,
                LastModified = obj.LastModified,
                Folder = Path.GetDirectoryName(obj.Key)?.Replace("\\", "/")
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing files in S3: {Folder}", folder);
            return Array.Empty<FileMetadata>();
        }
    }

    #region S3 API Implementation

    private string GetEndpoint()
    {
        if (!string.IsNullOrEmpty(_s3Settings.ServiceUrl))
        {
            return _s3Settings.ServiceUrl.TrimEnd('/');
        }

        return $"https://s3.{_s3Settings.Region}.amazonaws.com";
    }

    private string GetObjectUrl(string fileKey)
    {
        var endpoint = GetEndpoint();
        if (_s3Settings.ForcePathStyle)
        {
            return $"{endpoint}/{_s3Settings.BucketName}/{fileKey}";
        }
        return $"https://{_s3Settings.BucketName}.s3.{_s3Settings.Region}.amazonaws.com/{fileKey}";
    }

    private async Task<bool> PutObjectAsync(string key, byte[] content, string contentType)
    {
        var endpoint = GetEndpoint();
        var path = _s3Settings.ForcePathStyle
            ? $"/{_s3Settings.BucketName}/{key}"
            : $"/{key}";

        var host = _s3Settings.ForcePathStyle
            ? new Uri(endpoint).Host
            : $"{_s3Settings.BucketName}.s3.{_s3Settings.Region}.amazonaws.com";

        var url = _s3Settings.ForcePathStyle
            ? $"{endpoint}/{_s3Settings.BucketName}/{key}"
            : $"https://{host}/{key}";

        using var contentStream = new ByteArrayContent(content);
        contentStream.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        var now = DateTime.UtcNow;
        var amzDate = now.ToString("yyyyMMddTHHmmssZ", CultureInfo.InvariantCulture);
        var dateStamp = now.ToString("yyyyMMdd", CultureInfo.InvariantCulture);

        var contentHash = ComputeSHA256Hash(content);

        using var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Content = contentStream;
        request.Headers.Add("x-amz-date", amzDate);
        request.Headers.Add("x-amz-content-sha256", contentHash);
        request.Headers.Host = host;

        // Sign the request
        SignRequest(request, "PUT", path, contentHash, amzDate, dateStamp, host);

        var response = await _httpClient.SendAsync(request);
        return response.IsSuccessStatusCode;
    }

    private async Task<(byte[]? content, S3ObjectMetadata metadata)> GetObjectAsync(string key)
    {
        var endpoint = GetEndpoint();
        var path = _s3Settings.ForcePathStyle
            ? $"/{_s3Settings.BucketName}/{key}"
            : $"/{key}";

        var host = _s3Settings.ForcePathStyle
            ? new Uri(endpoint).Host
            : $"{_s3Settings.BucketName}.s3.{_s3Settings.Region}.amazonaws.com";

        var url = _s3Settings.ForcePathStyle
            ? $"{endpoint}/{_s3Settings.BucketName}/{key}"
            : $"https://{host}/{key}";

        var now = DateTime.UtcNow;
        var amzDate = now.ToString("yyyyMMddTHHmmssZ", CultureInfo.InvariantCulture);
        var dateStamp = now.ToString("yyyyMMdd", CultureInfo.InvariantCulture);

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("x-amz-date", amzDate);
        request.Headers.Add("x-amz-content-sha256", "UNSIGNED-PAYLOAD");
        request.Headers.Host = host;

        SignRequest(request, "GET", path, "UNSIGNED-PAYLOAD", amzDate, dateStamp, host);

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            return (null, new S3ObjectMetadata());
        }

        var content = await response.Content.ReadAsByteArrayAsync();
        var metadata = new S3ObjectMetadata
        {
            ContentType = response.Content.Headers.ContentType?.MediaType,
            ContentLength = content.Length,
            LastModified = response.Content.Headers.LastModified?.UtcDateTime
        };

        return (content, metadata);
    }

    private async Task<bool> DeleteObjectAsync(string key)
    {
        var endpoint = GetEndpoint();
        var path = _s3Settings.ForcePathStyle
            ? $"/{_s3Settings.BucketName}/{key}"
            : $"/{key}";

        var host = _s3Settings.ForcePathStyle
            ? new Uri(endpoint).Host
            : $"{_s3Settings.BucketName}.s3.{_s3Settings.Region}.amazonaws.com";

        var url = _s3Settings.ForcePathStyle
            ? $"{endpoint}/{_s3Settings.BucketName}/{key}"
            : $"https://{host}/{key}";

        var now = DateTime.UtcNow;
        var amzDate = now.ToString("yyyyMMddTHHmmssZ", CultureInfo.InvariantCulture);
        var dateStamp = now.ToString("yyyyMMdd", CultureInfo.InvariantCulture);

        using var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("x-amz-date", amzDate);
        request.Headers.Add("x-amz-content-sha256", "UNSIGNED-PAYLOAD");
        request.Headers.Host = host;

        SignRequest(request, "DELETE", path, "UNSIGNED-PAYLOAD", amzDate, dateStamp, host);

        var response = await _httpClient.SendAsync(request);
        return response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.NotFound;
    }

    private async Task<bool> HeadObjectAsync(string key)
    {
        var metadata = await HeadObjectMetadataAsync(key);
        return metadata != null;
    }

    private async Task<S3ObjectMetadata?> HeadObjectMetadataAsync(string key)
    {
        var endpoint = GetEndpoint();
        var path = _s3Settings.ForcePathStyle
            ? $"/{_s3Settings.BucketName}/{key}"
            : $"/{key}";

        var host = _s3Settings.ForcePathStyle
            ? new Uri(endpoint).Host
            : $"{_s3Settings.BucketName}.s3.{_s3Settings.Region}.amazonaws.com";

        var url = _s3Settings.ForcePathStyle
            ? $"{endpoint}/{_s3Settings.BucketName}/{key}"
            : $"https://{host}/{key}";

        var now = DateTime.UtcNow;
        var amzDate = now.ToString("yyyyMMddTHHmmssZ", CultureInfo.InvariantCulture);
        var dateStamp = now.ToString("yyyyMMdd", CultureInfo.InvariantCulture);

        using var request = new HttpRequestMessage(HttpMethod.Head, url);
        request.Headers.Add("x-amz-date", amzDate);
        request.Headers.Add("x-amz-content-sha256", "UNSIGNED-PAYLOAD");
        request.Headers.Host = host;

        SignRequest(request, "HEAD", path, "UNSIGNED-PAYLOAD", amzDate, dateStamp, host);

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        return new S3ObjectMetadata
        {
            ContentType = response.Content.Headers.ContentType?.MediaType,
            ContentLength = response.Content.Headers.ContentLength ?? 0,
            LastModified = response.Content.Headers.LastModified?.UtcDateTime
        };
    }

    private async Task<List<S3Object>> ListObjectsAsync(string? prefix, int? maxKeys)
    {
        // Simplified implementation - in production, use proper XML parsing
        var objects = new List<S3Object>();
        // This would need proper S3 ListObjects API implementation
        _logger.LogWarning("ListObjects is a simplified implementation");
        return await Task.FromResult(objects);
    }

    private string GeneratePresignedUrl(string key, TimeSpan expiry)
    {
        var now = DateTime.UtcNow;
        var amzDate = now.ToString("yyyyMMddTHHmmssZ", CultureInfo.InvariantCulture);
        var dateStamp = now.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
        var expiresIn = (int)expiry.TotalSeconds;

        var host = _s3Settings.ForcePathStyle
            ? new Uri(GetEndpoint()).Host
            : $"{_s3Settings.BucketName}.s3.{_s3Settings.Region}.amazonaws.com";

        var path = _s3Settings.ForcePathStyle
            ? $"/{_s3Settings.BucketName}/{key}"
            : $"/{key}";

        var credentialScope = $"{dateStamp}/{_s3Settings.Region}/s3/aws4_request";
        var credential = $"{_s3Settings.AccessKey}/{credentialScope}";

        var queryParams = new SortedDictionary<string, string>
        {
            { "X-Amz-Algorithm", "AWS4-HMAC-SHA256" },
            { "X-Amz-Credential", credential },
            { "X-Amz-Date", amzDate },
            { "X-Amz-Expires", expiresIn.ToString() },
            { "X-Amz-SignedHeaders", "host" }
        };

        var canonicalQueryString = string.Join("&",
            queryParams.Select(kvp => $"{Uri.EscapeDataString(kvp.Key)}={Uri.EscapeDataString(kvp.Value)}"));

        var canonicalRequest = $"GET\n{path}\n{canonicalQueryString}\nhost:{host}\n\nhost\nUNSIGNED-PAYLOAD";
        var canonicalRequestHash = ComputeSHA256Hash(Encoding.UTF8.GetBytes(canonicalRequest));

        var stringToSign = $"AWS4-HMAC-SHA256\n{amzDate}\n{credentialScope}\n{canonicalRequestHash}";

        var signingKey = GetSignatureKey(_s3Settings.SecretKey, dateStamp, _s3Settings.Region, "s3");
        var signature = ComputeHMACSHA256(signingKey, stringToSign);

        var baseUrl = _s3Settings.ForcePathStyle
            ? $"{GetEndpoint()}/{_s3Settings.BucketName}/{key}"
            : $"https://{host}/{key}";

        return $"{baseUrl}?{canonicalQueryString}&X-Amz-Signature={signature}";
    }

    private void SignRequest(HttpRequestMessage request, string method, string path, string payloadHash,
        string amzDate, string dateStamp, string host)
    {
        var signedHeaders = "host;x-amz-content-sha256;x-amz-date";
        var canonicalHeaders = $"host:{host}\nx-amz-content-sha256:{payloadHash}\nx-amz-date:{amzDate}\n";

        var canonicalRequest = $"{method}\n{path}\n\n{canonicalHeaders}\n{signedHeaders}\n{payloadHash}";
        var canonicalRequestHash = ComputeSHA256Hash(Encoding.UTF8.GetBytes(canonicalRequest));

        var credentialScope = $"{dateStamp}/{_s3Settings.Region}/s3/aws4_request";
        var stringToSign = $"AWS4-HMAC-SHA256\n{amzDate}\n{credentialScope}\n{canonicalRequestHash}";

        var signingKey = GetSignatureKey(_s3Settings.SecretKey, dateStamp, _s3Settings.Region, "s3");
        var signature = ComputeHMACSHA256(signingKey, stringToSign);

        var authorizationHeader = $"AWS4-HMAC-SHA256 Credential={_s3Settings.AccessKey}/{credentialScope}, " +
                                  $"SignedHeaders={signedHeaders}, Signature={signature}";

        request.Headers.TryAddWithoutValidation("Authorization", authorizationHeader);
    }

    private static byte[] GetSignatureKey(string key, string dateStamp, string regionName, string serviceName)
    {
        var kDate = ComputeHMACSHA256Bytes(Encoding.UTF8.GetBytes("AWS4" + key), dateStamp);
        var kRegion = ComputeHMACSHA256Bytes(kDate, regionName);
        var kService = ComputeHMACSHA256Bytes(kRegion, serviceName);
        var kSigning = ComputeHMACSHA256Bytes(kService, "aws4_request");
        return kSigning;
    }

    private static string ComputeSHA256Hash(byte[] data)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(data);
        return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
    }

    private static string ComputeHMACSHA256(byte[] key, string data)
    {
        using var hmac = new HMACSHA256(key);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
    }

    private static byte[] ComputeHMACSHA256Bytes(byte[] key, string data)
    {
        using var hmac = new HMACSHA256(key);
        return hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
    }

    #endregion

    #region Helper Methods

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

    private static string SanitizeFileName(string fileName)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = string.Join("_", fileName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));
        return sanitized.Replace(" ", "_");
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
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".txt" => "text/plain",
            ".json" => "application/json",
            ".xml" => "application/xml",
            ".zip" => "application/zip",
            _ => "application/octet-stream"
        };
    }

    #endregion

    #region Helper Classes

    private class S3ObjectMetadata
    {
        public string? ContentType { get; set; }
        public long ContentLength { get; set; }
        public DateTime? LastModified { get; set; }
    }

    private class S3Object
    {
        public string Key { get; set; } = string.Empty;
        public long Size { get; set; }
        public DateTime? LastModified { get; set; }
    }

    #endregion
}
