using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Masarat.Core.Services;
using Masarat.Core.Services.Caching;
using Masarat.Core.Services.FileStorage;
using Masarat.Core.Services.OCR;
using Masarat.Core.Services.Reporting;

namespace Masarat.Core.Extensions;

/// <summary>
/// امتدادات تسجيل الخدمات
/// Service Collection Extensions for registering Masarat.Core services
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// تسجيل جميع خدمات Masarat.Core
    /// Register all Masarat.Core services
    /// </summary>
    public static IServiceCollection AddMasaratCore(this IServiceCollection services, IConfiguration configuration)
    {
        // Add Email Service
        services.AddEmailService(configuration);

        // Add File Storage Service
        services.AddFileStorage(configuration);

        // Add OCR Service
        services.AddOcrService(configuration);

        // Add Report Service
        services.AddReportService(configuration);

        // Add Caching Service
        services.AddCachingService(configuration);

        return services;
    }

    /// <summary>
    /// تسجيل خدمة البريد الإلكتروني
    /// Register Email Service
    /// </summary>
    public static IServiceCollection AddEmailService(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IEmailService, EmailService>();
        return services;
    }

    /// <summary>
    /// تسجيل خدمة تخزين الملفات
    /// Register File Storage Service
    /// </summary>
    public static IServiceCollection AddFileStorage(this IServiceCollection services, IConfiguration configuration)
    {
        var settings = configuration.GetSection("FileStorage").Get<FileStorageSettings>() ?? new FileStorageSettings();
        services.Configure<FileStorageSettings>(configuration.GetSection("FileStorage"));

        // Register appropriate implementation based on provider
        switch (settings.Provider?.ToLowerInvariant())
        {
            case "s3":
            case "aws":
                services.AddHttpClient<IFileStorageService, S3FileStorageService>();
                break;
            // case "azure":
            //     services.AddScoped<IFileStorageService, AzureBlobStorageService>();
            //     break;
            default:
                services.AddScoped<IFileStorageService, LocalFileStorageService>();
                break;
        }

        return services;
    }

    /// <summary>
    /// تسجيل خدمة OCR
    /// Register OCR Service
    /// </summary>
    public static IServiceCollection AddOcrService(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<OcrSettings>(configuration.GetSection("OCR"));
        services.AddScoped<IOcrService, TesseractOcrService>();
        return services;
    }

    /// <summary>
    /// تسجيل خدمة التقارير
    /// Register Report Service
    /// </summary>
    public static IServiceCollection AddReportService(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ReportSettings>(configuration.GetSection("Reporting"));
        services.AddScoped<IReportService, ReportService>();
        return services;
    }

    /// <summary>
    /// تسجيل خدمة التخزين المؤقت
    /// Register Caching Service
    /// </summary>
    public static IServiceCollection AddCachingService(this IServiceCollection services, IConfiguration configuration)
    {
        var redisConnection = configuration.GetSection("Redis:ConnectionString").Value;

        if (!string.IsNullOrEmpty(redisConnection))
        {
            services.AddScoped<ICacheService, RedisCacheService>();
        }

        return services;
    }
}
