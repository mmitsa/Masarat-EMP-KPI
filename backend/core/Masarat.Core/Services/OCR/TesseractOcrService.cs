using System;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Masarat.Core.Services.Caching;

namespace Masarat.Core.Services.OCR;

/// <summary>
/// خدمة OCR باستخدام Tesseract
/// Tesseract OCR Service Implementation
/// </summary>
public class TesseractOcrService : IOcrService
{
    private readonly OcrSettings _settings;
    private readonly ILogger<TesseractOcrService> _logger;
    private readonly ICacheService? _cacheService;

    // Supported languages with their codes
    private static readonly Dictionary<string, OcrLanguage> SupportedLanguages = new()
    {
        { "ara", new OcrLanguage { Code = "ara", Name = "Arabic", ArabicName = "العربية", IsRtl = true } },
        { "eng", new OcrLanguage { Code = "eng", Name = "English", ArabicName = "الإنجليزية", IsRtl = false } },
        { "fra", new OcrLanguage { Code = "fra", Name = "French", ArabicName = "الفرنسية", IsRtl = false } },
        { "deu", new OcrLanguage { Code = "deu", Name = "German", ArabicName = "الألمانية", IsRtl = false } },
        { "spa", new OcrLanguage { Code = "spa", Name = "Spanish", ArabicName = "الإسبانية", IsRtl = false } },
        { "ita", new OcrLanguage { Code = "ita", Name = "Italian", ArabicName = "الإيطالية", IsRtl = false } },
        { "por", new OcrLanguage { Code = "por", Name = "Portuguese", ArabicName = "البرتغالية", IsRtl = false } },
        { "rus", new OcrLanguage { Code = "rus", Name = "Russian", ArabicName = "الروسية", IsRtl = false } },
        { "chi_sim", new OcrLanguage { Code = "chi_sim", Name = "Chinese (Simplified)", ArabicName = "الصينية المبسطة", IsRtl = false } },
        { "jpn", new OcrLanguage { Code = "jpn", Name = "Japanese", ArabicName = "اليابانية", IsRtl = false } },
        { "kor", new OcrLanguage { Code = "kor", Name = "Korean", ArabicName = "الكورية", IsRtl = false } },
        { "hin", new OcrLanguage { Code = "hin", Name = "Hindi", ArabicName = "الهندية", IsRtl = false } },
        { "urd", new OcrLanguage { Code = "urd", Name = "Urdu", ArabicName = "الأردية", IsRtl = true } },
        { "fas", new OcrLanguage { Code = "fas", Name = "Persian", ArabicName = "الفارسية", IsRtl = true } },
        { "tur", new OcrLanguage { Code = "tur", Name = "Turkish", ArabicName = "التركية", IsRtl = false } }
    };

    public TesseractOcrService(
        IOptions<OcrSettings> settings,
        ILogger<TesseractOcrService> logger,
        ICacheService? cacheService = null)
    {
        _settings = settings.Value;
        _logger = logger;
        _cacheService = cacheService;

        // Ensure temp directory exists
        if (!Directory.Exists(_settings.TempDirectory))
        {
            Directory.CreateDirectory(_settings.TempDirectory);
        }
    }

    public async Task<OcrResult> ExtractTextAsync(Stream imageStream, OcrOptions? options = null)
    {
        options ??= new OcrOptions();
        var stopwatch = Stopwatch.StartNew();

        try
        {
            // Check file size
            if (imageStream.Length > _settings.MaxImageSizeMB * 1024 * 1024)
            {
                return new OcrResult
                {
                    Success = false,
                    ErrorMessage = $"Image size exceeds maximum allowed ({_settings.MaxImageSizeMB}MB). حجم الصورة يتجاوز الحد المسموح."
                };
            }

            // Check cache
            string? cacheKey = null;
            if (_settings.EnableCaching && _cacheService != null)
            {
                cacheKey = await ComputeCacheKey(imageStream, options);
                var cachedResult = await _cacheService.GetAsync<OcrResult>(cacheKey);
                if (cachedResult != null)
                {
                    _logger.LogDebug("OCR result retrieved from cache: {CacheKey}", cacheKey);
                    return cachedResult;
                }
            }

            // Save stream to temp file
            var tempFilePath = Path.Combine(_settings.TempDirectory, $"{Guid.NewGuid()}.png");
            var outputBasePath = Path.Combine(_settings.TempDirectory, $"{Guid.NewGuid()}");

            try
            {
                // Save image to temp file
                await using (var fileStream = new FileStream(tempFilePath, FileMode.Create, FileAccess.Write))
                {
                    await imageStream.CopyToAsync(fileStream);
                }

                // Run Tesseract
                var result = await RunTesseractAsync(tempFilePath, outputBasePath, options);

                stopwatch.Stop();
                result.ProcessingTimeMs = stopwatch.ElapsedMilliseconds;

                // Cache result
                if (_settings.EnableCaching && _cacheService != null && cacheKey != null && result.Success)
                {
                    await _cacheService.SetAsync(cacheKey, result, TimeSpan.FromMinutes(_settings.CacheDurationMinutes));
                }

                _logger.LogInformation(
                    "OCR completed: {WordCount} words, {Confidence}% confidence, {ProcessingTime}ms",
                    result.WordCount, result.Confidence, result.ProcessingTimeMs);

                return result;
            }
            finally
            {
                // Cleanup temp files
                CleanupTempFiles(tempFilePath, outputBasePath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during OCR processing");
            stopwatch.Stop();
            return new OcrResult
            {
                Success = false,
                ErrorMessage = $"OCR processing error: {ex.Message}",
                ProcessingTimeMs = stopwatch.ElapsedMilliseconds
            };
        }
    }

    public async Task<OcrResult> ExtractTextAsync(string imagePath, OcrOptions? options = null)
    {
        if (!File.Exists(imagePath))
        {
            return new OcrResult
            {
                Success = false,
                ErrorMessage = $"Image file not found: {imagePath}"
            };
        }

        await using var fileStream = new FileStream(imagePath, FileMode.Open, FileAccess.Read);
        return await ExtractTextAsync(fileStream, options);
    }

    public async Task<OcrResult> ExtractTextFromBase64Async(string base64Image, OcrOptions? options = null)
    {
        try
        {
            // Remove data URI prefix if present
            var base64Data = base64Image;
            if (base64Image.Contains(","))
            {
                base64Data = base64Image.Split(',')[1];
            }

            var imageBytes = Convert.FromBase64String(base64Data);
            using var memoryStream = new MemoryStream(imageBytes);
            return await ExtractTextAsync(memoryStream, options);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Base64 image");
            return new OcrResult
            {
                Success = false,
                ErrorMessage = $"Invalid Base64 image: {ex.Message}"
            };
        }
    }

    public async Task<OcrResult> ExtractTextFromPdfAsync(Stream pdfStream, OcrOptions? options = null)
    {
        options ??= new OcrOptions();
        var stopwatch = Stopwatch.StartNew();

        try
        {
            var tempPdfPath = Path.Combine(_settings.TempDirectory, $"{Guid.NewGuid()}.pdf");
            var tempImagesDir = Path.Combine(_settings.TempDirectory, $"{Guid.NewGuid()}_images");

            try
            {
                Directory.CreateDirectory(tempImagesDir);

                // Save PDF to temp file
                await using (var fileStream = new FileStream(tempPdfPath, FileMode.Create, FileAccess.Write))
                {
                    await pdfStream.CopyToAsync(fileStream);
                }

                // Convert PDF to images using pdftoppm or similar tool
                var convertSuccess = await ConvertPdfToImagesAsync(tempPdfPath, tempImagesDir);
                if (!convertSuccess)
                {
                    return new OcrResult
                    {
                        Success = false,
                        ErrorMessage = "Failed to convert PDF to images. فشل تحويل PDF إلى صور."
                    };
                }

                // Process each image
                var imageFiles = Directory.GetFiles(tempImagesDir, "*.png")
                    .OrderBy(f => f)
                    .ToList();

                var allText = new StringBuilder();
                var totalConfidence = 0f;
                var totalWords = 0;
                var totalChars = 0;

                foreach (var imageFile in imageFiles)
                {
                    await using var imageStream = new FileStream(imageFile, FileMode.Open, FileAccess.Read);
                    var pageResult = await ExtractTextAsync(imageStream, options);

                    if (pageResult.Success && !string.IsNullOrWhiteSpace(pageResult.Text))
                    {
                        allText.AppendLine(pageResult.Text);
                        allText.AppendLine("---");
                        totalConfidence += pageResult.Confidence;
                        totalWords += pageResult.WordCount;
                        totalChars += pageResult.CharacterCount;
                    }
                }

                stopwatch.Stop();

                return new OcrResult
                {
                    Success = true,
                    Text = allText.ToString().Trim(),
                    Confidence = imageFiles.Count > 0 ? totalConfidence / imageFiles.Count : 0,
                    WordCount = totalWords,
                    CharacterCount = totalChars,
                    ProcessingTimeMs = stopwatch.ElapsedMilliseconds,
                    Metadata = new Dictionary<string, string>
                    {
                        { "PageCount", imageFiles.Count.ToString() }
                    }
                };
            }
            finally
            {
                // Cleanup
                if (File.Exists(tempPdfPath))
                    File.Delete(tempPdfPath);

                if (Directory.Exists(tempImagesDir))
                    Directory.Delete(tempImagesDir, true);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing PDF for OCR");
            stopwatch.Stop();
            return new OcrResult
            {
                Success = false,
                ErrorMessage = $"PDF OCR error: {ex.Message}",
                ProcessingTimeMs = stopwatch.ElapsedMilliseconds
            };
        }
    }

    public async Task<OcrResult> ExtractTextFromPdfAsync(string pdfPath, OcrOptions? options = null)
    {
        if (!File.Exists(pdfPath))
        {
            return new OcrResult
            {
                Success = false,
                ErrorMessage = $"PDF file not found: {pdfPath}"
            };
        }

        await using var fileStream = new FileStream(pdfPath, FileMode.Open, FileAccess.Read);
        return await ExtractTextFromPdfAsync(fileStream, options);
    }

    public async Task<OcrDetailedResult> ExtractTextWithBoundsAsync(Stream imageStream, OcrOptions? options = null)
    {
        options ??= new OcrOptions();
        options.OutputType = OcrOutputType.Tsv;

        var basicResult = await ExtractTextAsync(imageStream, options);

        var detailedResult = new OcrDetailedResult
        {
            Success = basicResult.Success,
            Text = basicResult.Text,
            Confidence = basicResult.Confidence,
            WordCount = basicResult.WordCount,
            CharacterCount = basicResult.CharacterCount,
            ProcessingTimeMs = basicResult.ProcessingTimeMs,
            ErrorMessage = basicResult.ErrorMessage,
            DetectedLanguages = basicResult.DetectedLanguages,
            Metadata = basicResult.Metadata
        };

        // Parse TSV to extract bounding boxes
        // This is a simplified implementation
        // In production, you would parse the actual TSV output

        return detailedResult;
    }

    public Task<bool> IsLanguageSupportedAsync(string languageCode)
    {
        return Task.FromResult(SupportedLanguages.ContainsKey(languageCode.ToLowerInvariant()));
    }

    public Task<IEnumerable<OcrLanguage>> GetSupportedLanguagesAsync()
    {
        return Task.FromResult(SupportedLanguages.Values.AsEnumerable());
    }

    #region Private Methods

    private async Task<OcrResult> RunTesseractAsync(string inputPath, string outputBasePath, OcrOptions options)
    {
        var languages = string.Join("+", options.Languages);
        var outputFile = $"{outputBasePath}.txt";

        // Build Tesseract arguments
        var arguments = new StringBuilder();
        arguments.Append($"\"{inputPath}\" \"{outputBasePath}\"");

        // Add language
        arguments.Append($" -l {languages}");

        // Add PSM (Page Segmentation Mode)
        arguments.Append($" --psm {(int)options.SegmentationMode}");

        // Add OEM (OCR Engine Mode)
        arguments.Append($" --oem {(int)options.EngineMode}");

        // Set tessdata path
        if (!string.IsNullOrEmpty(_settings.TessdataPath))
        {
            arguments.Append($" --tessdata-dir \"{_settings.TessdataPath}\"");
        }

        // Output format
        if (options.OutputType == OcrOutputType.Tsv)
        {
            arguments.Append(" tsv");
        }

        var processInfo = new ProcessStartInfo
        {
            FileName = _settings.TesseractPath,
            Arguments = arguments.ToString(),
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        try
        {
            using var process = new Process { StartInfo = processInfo };
            process.Start();

            var errorOutput = await process.StandardError.ReadToEndAsync();

            var completed = process.WaitForExit(_settings.TimeoutSeconds * 1000);

            if (!completed)
            {
                try
                {
                    process.Kill();
                }
                catch { }

                return new OcrResult
                {
                    Success = false,
                    ErrorMessage = $"OCR processing timed out after {_settings.TimeoutSeconds} seconds."
                };
            }

            if (process.ExitCode != 0)
            {
                _logger.LogWarning("Tesseract exited with code {ExitCode}: {Error}", process.ExitCode, errorOutput);
            }

            // Read output
            if (!File.Exists(outputFile))
            {
                return new OcrResult
                {
                    Success = false,
                    ErrorMessage = "OCR output file not generated."
                };
            }

            var text = await File.ReadAllTextAsync(outputFile);

            // Parse confidence from stderr (Tesseract outputs confidence info to stderr)
            var confidence = ParseConfidence(errorOutput);

            // Analyze text
            var wordCount = CountWords(text);
            var charCount = text.Length;

            // Detect languages in output
            var detectedLanguages = DetectLanguages(text);

            return new OcrResult
            {
                Success = true,
                Text = text.Trim(),
                Confidence = confidence,
                WordCount = wordCount,
                CharacterCount = charCount,
                DetectedLanguages = detectedLanguages
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running Tesseract");
            return new OcrResult
            {
                Success = false,
                ErrorMessage = $"Tesseract execution error: {ex.Message}"
            };
        }
    }

    private async Task<bool> ConvertPdfToImagesAsync(string pdfPath, string outputDir)
    {
        try
        {
            // Try using pdftoppm (from poppler-utils)
            var processInfo = new ProcessStartInfo
            {
                FileName = "pdftoppm",
                Arguments = $"-png -r {300} \"{pdfPath}\" \"{Path.Combine(outputDir, "page")}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = processInfo };
            process.Start();

            await process.WaitForExitAsync();

            return process.ExitCode == 0 && Directory.GetFiles(outputDir, "*.png").Any();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error converting PDF to images");
            return false;
        }
    }

    private static float ParseConfidence(string tesseractOutput)
    {
        // Default confidence if we can't parse
        float confidence = 0;

        // Try to find confidence in output
        var match = Regex.Match(tesseractOutput, @"Mean\s+text\s+confidence:\s*(\d+\.?\d*)");
        if (match.Success && float.TryParse(match.Groups[1].Value, out var parsed))
        {
            confidence = parsed;
        }

        return confidence;
    }

    private static int CountWords(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return 0;

        // Split by whitespace and punctuation
        return Regex.Split(text, @"[\s\p{P}]+")
            .Count(w => !string.IsNullOrWhiteSpace(w));
    }

    private static List<string> DetectLanguages(string text)
    {
        var languages = new List<string>();

        // Simple language detection based on character ranges
        if (ContainsArabic(text))
            languages.Add("ara");

        if (ContainsLatin(text))
            languages.Add("eng");

        if (ContainsChinese(text))
            languages.Add("chi_sim");

        return languages.Distinct().ToList();
    }

    private static bool ContainsArabic(string text)
    {
        return Regex.IsMatch(text, @"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]");
    }

    private static bool ContainsLatin(string text)
    {
        return Regex.IsMatch(text, @"[a-zA-Z]");
    }

    private static bool ContainsChinese(string text)
    {
        return Regex.IsMatch(text, @"[\u4E00-\u9FFF]");
    }

    private async Task<string> ComputeCacheKey(Stream imageStream, OcrOptions options)
    {
        imageStream.Position = 0;

        using var sha256 = SHA256.Create();
        var hashBytes = await sha256.ComputeHashAsync(imageStream);
        var imageHash = Convert.ToBase64String(hashBytes);

        imageStream.Position = 0;

        var optionsKey = $"{string.Join("_", options.Languages)}_{options.SegmentationMode}_{options.EngineMode}";

        return $"ocr:{imageHash}:{optionsKey}";
    }

    private static void CleanupTempFiles(string inputPath, string outputBasePath)
    {
        try
        {
            if (File.Exists(inputPath))
                File.Delete(inputPath);

            // Delete all possible output files
            var outputFiles = new[]
            {
                $"{outputBasePath}.txt",
                $"{outputBasePath}.tsv",
                $"{outputBasePath}.hocr",
                $"{outputBasePath}.html",
                $"{outputBasePath}.pdf"
            };

            foreach (var file in outputFiles)
            {
                if (File.Exists(file))
                    File.Delete(file);
            }
        }
        catch
        {
            // Ignore cleanup errors
        }
    }

    #endregion
}
