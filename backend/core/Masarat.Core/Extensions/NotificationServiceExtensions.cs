using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Masarat.Core.Services.OTP;
using Masarat.Core.Services.SMS;
using Masarat.Core.Services.Notifications;

namespace Masarat.Core.Extensions;

/// <summary>
/// امتدادات تسجيل خدمات الإشعارات و OTP
/// Notification and OTP Service Registration Extensions
/// </summary>
public static class NotificationServiceExtensions
{
    /// <summary>
    /// إضافة جميع خدمات الإشعارات
    /// Add all notification services
    /// </summary>
    public static IServiceCollection AddNotificationServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Register OTP Service
        services.AddScoped<IOtpService, OtpService>();

        // Register SMS Service
        services.AddHttpClient<ISmsService, SmsService>();

        // Register Push Notification Service
        services.AddHttpClient<IPushNotificationService, PushNotificationService>();

        // Register Notification Hub
        services.AddScoped<INotificationHub, NotificationHub>();

        // Register User Contact Service (if not already registered)
        services.AddScoped<IUserContactService, DefaultUserContactService>();

        return services;
    }

    /// <summary>
    /// إضافة خدمة OTP فقط
    /// Add OTP service only
    /// </summary>
    public static IServiceCollection AddOtpService(this IServiceCollection services)
    {
        services.AddScoped<IOtpService, OtpService>();
        return services;
    }

    /// <summary>
    /// إضافة خدمة SMS فقط
    /// Add SMS service only
    /// </summary>
    public static IServiceCollection AddSmsService(this IServiceCollection services)
    {
        services.AddHttpClient<ISmsService, SmsService>();
        return services;
    }

    /// <summary>
    /// إضافة خدمة Push Notifications فقط
    /// Add Push Notification service only
    /// </summary>
    public static IServiceCollection AddPushNotificationService(this IServiceCollection services)
    {
        services.AddHttpClient<IPushNotificationService, PushNotificationService>();
        return services;
    }
}

/// <summary>
/// تنفيذ افتراضي لخدمة بيانات اتصال المستخدم
/// Default implementation of User Contact Service
/// </summary>
public class DefaultUserContactService : IUserContactService
{
    private readonly IConfiguration _configuration;

    public DefaultUserContactService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<string?> GetUserPhoneAsync(string userId)
    {
        // In production, this would fetch from the HR database or user profile
        // For now, return a test phone number in development mode
        if (bool.Parse(_configuration["Development:UseTestData"] ?? "false"))
        {
            return _configuration["Development:TestPhone"] ?? "+966500000000";
        }

        // TODO: Implement actual lookup from HR database
        return null;
    }

    public async Task<string?> GetUserEmailAsync(string userId)
    {
        // In production, this would fetch from the HR database or user profile
        if (bool.Parse(_configuration["Development:UseTestData"] ?? "false"))
        {
            return _configuration["Development:TestEmail"] ?? "test@masarat.sa";
        }

        // TODO: Implement actual lookup from HR database
        return null;
    }

    public async Task<UserContactInfo?> GetUserContactInfoAsync(string userId)
    {
        var phone = await GetUserPhoneAsync(userId);
        var email = await GetUserEmailAsync(userId);

        if (string.IsNullOrEmpty(phone) && string.IsNullOrEmpty(email))
        {
            return null;
        }

        return new UserContactInfo
        {
            UserId = userId,
            Phone = phone,
            Email = email,
            SmsEnabled = !string.IsNullOrEmpty(phone),
            EmailEnabled = !string.IsNullOrEmpty(email),
            PushEnabled = true
        };
    }
}
