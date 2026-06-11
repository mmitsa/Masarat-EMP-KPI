using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Masarat.Core.Services.SMS;

namespace Masarat.Core.Services.Notifications;

/// <summary>
/// واجهة مركز الإشعارات الموحد
/// Unified Notification Hub Interface
/// </summary>
public interface INotificationHub
{
    /// <summary>
    /// إرسال إشعار عبر جميع القنوات المحددة
    /// Send notification via specified channels
    /// </summary>
    Task<NotificationHubResult> SendAsync(NotificationRequest request);

    /// <summary>
    /// إرسال إشعار لمجموعة من المستخدمين
    /// Send notification to multiple users
    /// </summary>
    Task<BulkNotificationResult> SendBulkAsync(BulkNotificationRequest request);

    /// <summary>
    /// إرسال إشعار مجدول
    /// Schedule a notification
    /// </summary>
    Task<string> ScheduleAsync(NotificationRequest request, DateTime scheduledTime);

    /// <summary>
    /// إلغاء إشعار مجدول
    /// Cancel scheduled notification
    /// </summary>
    Task<bool> CancelScheduledAsync(string notificationId);

    /// <summary>
    /// إرسال إشعار قالب محدد مسبقاً
    /// Send predefined template notification
    /// </summary>
    Task<NotificationHubResult> SendTemplateAsync(TemplateNotificationRequest request);

    /// <summary>
    /// الحصول على تفضيلات إشعارات المستخدم
    /// Get user notification preferences
    /// </summary>
    Task<UserNotificationPreferences> GetUserPreferencesAsync(string userId);

    /// <summary>
    /// تحديث تفضيلات إشعارات المستخدم
    /// Update user notification preferences
    /// </summary>
    Task<bool> UpdateUserPreferencesAsync(string userId, UserNotificationPreferences preferences);
}

/// <summary>
/// مركز الإشعارات الموحد - يجمع جميع قنوات الإرسال
/// Unified Notification Hub Implementation
/// </summary>
public class NotificationHub : INotificationHub
{
    private readonly ISmsService _smsService;
    private readonly IEmailService _emailService;
    private readonly IPushNotificationService _pushService;
    private readonly IUserContactService _userContactService;
    private readonly ILogger<NotificationHub> _logger;
    private readonly NotificationHubSettings _settings;

    public NotificationHub(
        ISmsService smsService,
        IEmailService emailService,
        IPushNotificationService pushService,
        IUserContactService userContactService,
        IConfiguration configuration,
        ILogger<NotificationHub> logger)
    {
        _smsService = smsService;
        _emailService = emailService;
        _pushService = pushService;
        _userContactService = userContactService;
        _logger = logger;

        _settings = new NotificationHubSettings
        {
            DefaultChannels = ParseChannels(configuration["Notifications:DefaultChannels"] ?? "Push,Email"),
            EnableSms = bool.Parse(configuration["Notifications:EnableSms"] ?? "true"),
            EnableEmail = bool.Parse(configuration["Notifications:EnableEmail"] ?? "true"),
            EnablePush = bool.Parse(configuration["Notifications:EnablePush"] ?? "true"),
            RespectUserPreferences = bool.Parse(configuration["Notifications:RespectUserPreferences"] ?? "true"),
            MaxRetries = int.Parse(configuration["Notifications:MaxRetries"] ?? "3"),
            RetryDelaySeconds = int.Parse(configuration["Notifications:RetryDelaySeconds"] ?? "30")
        };
    }

    /// <inheritdoc />
    public async Task<NotificationHubResult> SendAsync(NotificationRequest request)
    {
        var result = new NotificationHubResult
        {
            NotificationId = Guid.NewGuid().ToString(),
            UserId = request.UserId,
            RequestedChannels = request.Channels.ToList()
        };

        try
        {
            // Get user preferences and contact info
            var userContact = await _userContactService.GetUserContactInfoAsync(request.UserId);
            if (userContact == null)
            {
                result.Success = false;
                result.Message = "User not found";
                result.MessageAr = "المستخدم غير موجود";
                return result;
            }

            // Determine channels to use
            var channels = DetermineChannels(request.Channels, userContact, request.ForceChannels);
            result.UsedChannels = channels;

            // Send via each channel
            var tasks = new List<Task<ChannelResult>>();

            if (channels.Contains(NotificationChannel.SMS) && _settings.EnableSms)
            {
                tasks.Add(SendViaSmsAsync(userContact.Phone!, request));
            }

            if (channels.Contains(NotificationChannel.Email) && _settings.EnableEmail)
            {
                tasks.Add(SendViaEmailAsync(userContact.Email!, request));
            }

            if (channels.Contains(NotificationChannel.Push) && _settings.EnablePush)
            {
                tasks.Add(SendViaPushAsync(request.UserId, request));
            }

            var channelResults = await Task.WhenAll(tasks);
            result.ChannelResults = channelResults.ToList();
            result.Success = channelResults.Any(r => r.Success);

            if (result.Success)
            {
                result.Message = "Notification sent successfully";
                result.MessageAr = "تم إرسال الإشعار بنجاح";
                _logger.LogInformation("Notification {NotificationId} sent to user {UserId} via {Channels}",
                    result.NotificationId, request.UserId, string.Join(", ", channels));
            }
            else
            {
                result.Message = "Failed to send notification via any channel";
                result.MessageAr = "فشل إرسال الإشعار عبر جميع القنوات";
                _logger.LogWarning("Notification {NotificationId} failed for user {UserId}",
                    result.NotificationId, request.UserId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending notification to user {UserId}", request.UserId);
            result.Success = false;
            result.Message = "Error sending notification";
            result.MessageAr = "خطأ في إرسال الإشعار";
        }

        return result;
    }

    /// <inheritdoc />
    public async Task<BulkNotificationResult> SendBulkAsync(BulkNotificationRequest request)
    {
        var result = new BulkNotificationResult
        {
            BatchId = Guid.NewGuid().ToString(),
            TotalRecipients = request.UserIds.Length
        };

        var tasks = request.UserIds.Select(async userId =>
        {
            var singleRequest = new NotificationRequest
            {
                UserId = userId,
                Title = request.Title,
                TitleEn = request.TitleEn,
                Body = request.Body,
                BodyEn = request.BodyEn,
                Type = request.Type,
                Priority = request.Priority,
                Channels = request.Channels,
                Data = request.Data
            };

            return await SendAsync(singleRequest);
        });

        var results = await Task.WhenAll(tasks);
        result.Results = results.ToList();
        result.SuccessCount = results.Count(r => r.Success);
        result.FailureCount = results.Count(r => !r.Success);
        result.FailedUserIds = results.Where(r => !r.Success).Select(r => r.UserId).ToList();

        return result;
    }

    /// <inheritdoc />
    public async Task<string> ScheduleAsync(NotificationRequest request, DateTime scheduledTime)
    {
        // For now, return a scheduled ID. In production, this would use a job scheduler like Hangfire
        var notificationId = Guid.NewGuid().ToString();
        _logger.LogInformation("Notification {NotificationId} scheduled for {ScheduledTime}", notificationId, scheduledTime);
        // TODO: Integrate with job scheduler
        return notificationId;
    }

    /// <inheritdoc />
    public async Task<bool> CancelScheduledAsync(string notificationId)
    {
        _logger.LogInformation("Scheduled notification {NotificationId} cancelled", notificationId);
        // TODO: Integrate with job scheduler
        return true;
    }

    /// <inheritdoc />
    public async Task<NotificationHubResult> SendTemplateAsync(TemplateNotificationRequest request)
    {
        var template = GetTemplate(request.TemplateName);
        if (template == null)
        {
            return new NotificationHubResult
            {
                Success = false,
                Message = "Template not found",
                MessageAr = "القالب غير موجود"
            };
        }

        // Replace placeholders
        var title = template.TitleAr;
        var body = template.BodyAr;

        foreach (var placeholder in request.Placeholders)
        {
            title = title.Replace($"{{{{{placeholder.Key}}}}}", placeholder.Value);
            body = body.Replace($"{{{{{placeholder.Key}}}}}", placeholder.Value);
        }

        var notificationRequest = new NotificationRequest
        {
            UserId = request.UserId,
            Title = title,
            TitleEn = template.TitleEn,
            Body = body,
            BodyEn = template.BodyEn,
            Type = template.Type,
            Priority = template.Priority,
            Channels = request.Channels ?? template.DefaultChannels,
            Data = request.Data ?? template.DefaultData
        };

        return await SendAsync(notificationRequest);
    }

    /// <inheritdoc />
    public async Task<UserNotificationPreferences> GetUserPreferencesAsync(string userId)
    {
        // TODO: Fetch from database
        return new UserNotificationPreferences
        {
            UserId = userId,
            EnableSms = true,
            EnableEmail = true,
            EnablePush = true,
            QuietHoursEnabled = false
        };
    }

    /// <inheritdoc />
    public async Task<bool> UpdateUserPreferencesAsync(string userId, UserNotificationPreferences preferences)
    {
        // TODO: Save to database
        _logger.LogInformation("Updated notification preferences for user {UserId}", userId);
        return true;
    }

    #region Private Methods

    private async Task<ChannelResult> SendViaSmsAsync(string phone, NotificationRequest request)
    {
        try
        {
            var result = await _smsService.SendSmsAsync(phone, request.Body);
            return new ChannelResult
            {
                Channel = NotificationChannel.SMS,
                Success = result.Success,
                MessageId = result.MessageId,
                Error = result.Success ? null : result.Message
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMS send failed");
            return new ChannelResult
            {
                Channel = NotificationChannel.SMS,
                Success = false,
                Error = ex.Message
            };
        }
    }

    private async Task<ChannelResult> SendViaEmailAsync(string email, NotificationRequest request)
    {
        try
        {
            var emailBody = GenerateEmailBody(request);
            var result = await _emailService.SendEmailAsync(email, request.Title, emailBody, true);
            return new ChannelResult
            {
                Channel = NotificationChannel.Email,
                Success = result,
                MessageId = result ? Guid.NewGuid().ToString() : null
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email send failed");
            return new ChannelResult
            {
                Channel = NotificationChannel.Email,
                Success = false,
                Error = ex.Message
            };
        }
    }

    private async Task<ChannelResult> SendViaPushAsync(string userId, NotificationRequest request)
    {
        try
        {
            var pushRequest = new PushNotificationRequest
            {
                Title = request.Title,
                TitleEn = request.TitleEn,
                Body = request.Body,
                BodyEn = request.BodyEn,
                Type = request.Type,
                Priority = request.Priority,
                Data = request.Data,
                ClickAction = request.ActionUrl
            };

            var result = await _pushService.SendNotificationAsync(userId, pushRequest);
            return new ChannelResult
            {
                Channel = NotificationChannel.Push,
                Success = result.Success,
                MessageId = result.MessageId,
                Error = result.Success ? null : result.Message
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Push send failed");
            return new ChannelResult
            {
                Channel = NotificationChannel.Push,
                Success = false,
                Error = ex.Message
            };
        }
    }

    private List<NotificationChannel> DetermineChannels(
        NotificationChannel[] requested,
        UserContactInfo user,
        bool force)
    {
        var channels = new List<NotificationChannel>();

        foreach (var channel in requested)
        {
            var shouldUse = channel switch
            {
                NotificationChannel.SMS => force || (user.SmsEnabled && !string.IsNullOrEmpty(user.Phone)),
                NotificationChannel.Email => force || (user.EmailEnabled && !string.IsNullOrEmpty(user.Email)),
                NotificationChannel.Push => force || (user.PushEnabled && !string.IsNullOrEmpty(user.DeviceToken)),
                _ => false
            };

            if (shouldUse)
            {
                channels.Add(channel);
            }
        }

        return channels;
    }

    private string GenerateEmailBody(NotificationRequest request)
    {
        return $@"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%); color: white; padding: 25px; text-align: center; }}
        .content {{ padding: 30px; }}
        .footer {{ background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }}
        .btn {{ display: inline-block; background: #1d4ed8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>{request.Title}</h1>
        </div>
        <div class='content'>
            <p>{request.Body}</p>
            {(string.IsNullOrEmpty(request.ActionUrl) ? "" : $"<p style='text-align: center;'><a href='{request.ActionUrl}' class='btn'>عرض التفاصيل</a></p>")}
        </div>
        <div class='footer'>
            <p>© 2026 منصة مسارات - جميع الحقوق محفوظة</p>
        </div>
    </div>
</body>
</html>";
    }

    private NotificationTemplate? GetTemplate(string templateName)
    {
        var templates = GetNotificationTemplates();
        return templates.TryGetValue(templateName, out var template) ? template : null;
    }

    private Dictionary<string, NotificationTemplate> GetNotificationTemplates()
    {
        return new Dictionary<string, NotificationTemplate>
        {
            ["leave_approved"] = new NotificationTemplate
            {
                TitleAr = "تمت الموافقة على طلب الإجازة",
                TitleEn = "Leave Request Approved",
                BodyAr = "تمت الموافقة على طلب إجازتك من {{StartDate}} إلى {{EndDate}}",
                BodyEn = "Your leave request from {{StartDate}} to {{EndDate}} has been approved",
                Type = NotificationType.Leave,
                Priority = NotificationPriority.Normal,
                DefaultChannels = new[] { NotificationChannel.Push, NotificationChannel.Email }
            },
            ["leave_rejected"] = new NotificationTemplate
            {
                TitleAr = "تم رفض طلب الإجازة",
                TitleEn = "Leave Request Rejected",
                BodyAr = "تم رفض طلب إجازتك. السبب: {{Reason}}",
                BodyEn = "Your leave request has been rejected. Reason: {{Reason}}",
                Type = NotificationType.Leave,
                Priority = NotificationPriority.Normal,
                DefaultChannels = new[] { NotificationChannel.Push, NotificationChannel.Email }
            },
            ["task_assigned"] = new NotificationTemplate
            {
                TitleAr = "تم تعيين مهمة جديدة",
                TitleEn = "New Task Assigned",
                BodyAr = "تم تعيينك لمهمة: {{TaskTitle}}",
                BodyEn = "You have been assigned to task: {{TaskTitle}}",
                Type = NotificationType.Task,
                Priority = NotificationPriority.High,
                DefaultChannels = new[] { NotificationChannel.Push }
            },
            ["payslip_ready"] = new NotificationTemplate
            {
                TitleAr = "كشف الراتب جاهز",
                TitleEn = "Payslip Ready",
                BodyAr = "كشف راتبك لشهر {{Month}} جاهز للعرض",
                BodyEn = "Your payslip for {{Month}} is ready to view",
                Type = NotificationType.Payroll,
                Priority = NotificationPriority.Normal,
                DefaultChannels = new[] { NotificationChannel.Push, NotificationChannel.SMS }
            },
            ["attendance_reminder"] = new NotificationTemplate
            {
                TitleAr = "تذكير بتسجيل الحضور",
                TitleEn = "Attendance Reminder",
                BodyAr = "لم يتم تسجيل حضورك اليوم",
                BodyEn = "You haven't checked in today",
                Type = NotificationType.Attendance,
                Priority = NotificationPriority.Normal,
                DefaultChannels = new[] { NotificationChannel.Push }
            },
            ["support_ticket_update"] = new NotificationTemplate
            {
                TitleAr = "تحديث على طلب الدعم",
                TitleEn = "Support Ticket Update",
                BodyAr = "تم الرد على طلب الدعم رقم #{{TicketNumber}}",
                BodyEn = "Support ticket #{{TicketNumber}} has been updated",
                Type = NotificationType.Support,
                Priority = NotificationPriority.Normal,
                DefaultChannels = new[] { NotificationChannel.Push, NotificationChannel.Email }
            },
            ["warehouse_request_approved"] = new NotificationTemplate
            {
                TitleAr = "تمت الموافقة على طلب المستودع",
                TitleEn = "Warehouse Request Approved",
                BodyAr = "تمت الموافقة على طلبك من المستودع رقم #{{RequestNumber}}",
                BodyEn = "Your warehouse request #{{RequestNumber}} has been approved",
                Type = NotificationType.Warehouse,
                Priority = NotificationPriority.Normal,
                DefaultChannels = new[] { NotificationChannel.Push }
            }
        };
    }

    private static NotificationChannel[] ParseChannels(string channelsStr)
    {
        return channelsStr.Split(',')
            .Select(c => Enum.TryParse<NotificationChannel>(c.Trim(), out var ch) ? ch : (NotificationChannel?)null)
            .Where(c => c.HasValue)
            .Select(c => c!.Value)
            .ToArray();
    }

    #endregion
}

#region Models

/// <summary>
/// قنوات الإشعارات
/// </summary>
public enum NotificationChannel
{
    SMS = 1,
    Email = 2,
    Push = 3
}

/// <summary>
/// طلب إرسال إشعار
/// </summary>
public class NotificationRequest
{
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? TitleEn { get; set; }
    public string Body { get; set; } = string.Empty;
    public string? BodyEn { get; set; }
    public NotificationType Type { get; set; } = NotificationType.General;
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
    public NotificationChannel[] Channels { get; set; } = new[] { NotificationChannel.Push };
    public Dictionary<string, string> Data { get; set; } = new();
    public string? ActionUrl { get; set; }
    public bool ForceChannels { get; set; } = false;
}

/// <summary>
/// طلب إرسال إشعارات جماعية
/// </summary>
public class BulkNotificationRequest
{
    public string[] UserIds { get; set; } = Array.Empty<string>();
    public string Title { get; set; } = string.Empty;
    public string? TitleEn { get; set; }
    public string Body { get; set; } = string.Empty;
    public string? BodyEn { get; set; }
    public NotificationType Type { get; set; } = NotificationType.General;
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
    public NotificationChannel[] Channels { get; set; } = new[] { NotificationChannel.Push };
    public Dictionary<string, string> Data { get; set; } = new();
}

/// <summary>
/// طلب إشعار بقالب
/// </summary>
public class TemplateNotificationRequest
{
    public string UserId { get; set; } = string.Empty;
    public string TemplateName { get; set; } = string.Empty;
    public Dictionary<string, string> Placeholders { get; set; } = new();
    public NotificationChannel[]? Channels { get; set; }
    public Dictionary<string, string>? Data { get; set; }
}

/// <summary>
/// نتيجة إرسال الإشعار
/// </summary>
public class NotificationHubResult
{
    public bool Success { get; set; }
    public string NotificationId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string MessageAr { get; set; } = string.Empty;
    public List<NotificationChannel> RequestedChannels { get; set; } = new();
    public List<NotificationChannel> UsedChannels { get; set; } = new();
    public List<ChannelResult> ChannelResults { get; set; } = new();
}

/// <summary>
/// نتيجة قناة إرسال
/// </summary>
public class ChannelResult
{
    public NotificationChannel Channel { get; set; }
    public bool Success { get; set; }
    public string? MessageId { get; set; }
    public string? Error { get; set; }
}

/// <summary>
/// نتيجة إرسال جماعي
/// </summary>
public class BulkNotificationResult
{
    public string BatchId { get; set; } = string.Empty;
    public int TotalRecipients { get; set; }
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public List<string> FailedUserIds { get; set; } = new();
    public List<NotificationHubResult> Results { get; set; } = new();
}

/// <summary>
/// تفضيلات إشعارات المستخدم
/// </summary>
public class UserNotificationPreferences
{
    public string UserId { get; set; } = string.Empty;
    public bool EnableSms { get; set; } = true;
    public bool EnableEmail { get; set; } = true;
    public bool EnablePush { get; set; } = true;
    public bool QuietHoursEnabled { get; set; } = false;
    public TimeSpan? QuietHoursStart { get; set; }
    public TimeSpan? QuietHoursEnd { get; set; }
    public NotificationType[] MutedTypes { get; set; } = Array.Empty<NotificationType>();
}

/// <summary>
/// قالب إشعار
/// </summary>
internal class NotificationTemplate
{
    public string TitleAr { get; set; } = string.Empty;
    public string TitleEn { get; set; } = string.Empty;
    public string BodyAr { get; set; } = string.Empty;
    public string BodyEn { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public NotificationPriority Priority { get; set; }
    public NotificationChannel[] DefaultChannels { get; set; } = Array.Empty<NotificationChannel>();
    public Dictionary<string, string> DefaultData { get; set; } = new();
}

/// <summary>
/// إعدادات مركز الإشعارات
/// </summary>
public class NotificationHubSettings
{
    public NotificationChannel[] DefaultChannels { get; set; } = new[] { NotificationChannel.Push };
    public bool EnableSms { get; set; } = true;
    public bool EnableEmail { get; set; } = true;
    public bool EnablePush { get; set; } = true;
    public bool RespectUserPreferences { get; set; } = true;
    public int MaxRetries { get; set; } = 3;
    public int RetryDelaySeconds { get; set; } = 30;
}

#endregion
