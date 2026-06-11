using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Masarat.Core.Services.Notifications;

/// <summary>
/// خدمة إشعارات التطبيق Push Notifications
/// Push Notification Service Interface
/// </summary>
public interface IPushNotificationService
{
    /// <summary>
    /// إرسال إشعار لمستخدم واحد
    /// Send notification to a single user
    /// </summary>
    Task<PushResult> SendNotificationAsync(string userId, PushNotificationRequest request);

    /// <summary>
    /// إرسال إشعار لعدة مستخدمين
    /// Send notification to multiple users
    /// </summary>
    Task<BulkPushResult> SendBulkNotificationAsync(string[] userIds, PushNotificationRequest request);

    /// <summary>
    /// إرسال إشعار لمجموعة/موضوع
    /// Send notification to a topic
    /// </summary>
    Task<PushResult> SendToTopicAsync(string topic, PushNotificationRequest request);

    /// <summary>
    /// تسجيل توكن الجهاز للمستخدم
    /// Register device token for user
    /// </summary>
    Task<bool> RegisterDeviceTokenAsync(string userId, DeviceTokenRequest request);

    /// <summary>
    /// إلغاء تسجيل توكن الجهاز
    /// Unregister device token
    /// </summary>
    Task<bool> UnregisterDeviceTokenAsync(string userId, string deviceToken);

    /// <summary>
    /// اشتراك المستخدم في موضوع
    /// Subscribe user to topic
    /// </summary>
    Task<bool> SubscribeToTopicAsync(string userId, string topic);

    /// <summary>
    /// إلغاء اشتراك المستخدم من موضوع
    /// Unsubscribe user from topic
    /// </summary>
    Task<bool> UnsubscribeFromTopicAsync(string userId, string topic);

    /// <summary>
    /// الحصول على إشعارات المستخدم
    /// Get user notifications history
    /// </summary>
    Task<List<NotificationRecord>> GetUserNotificationsAsync(string userId, int page = 1, int pageSize = 20);

    /// <summary>
    /// تحديد الإشعار كمقروء
    /// Mark notification as read
    /// </summary>
    Task<bool> MarkAsReadAsync(string userId, string notificationId);

    /// <summary>
    /// تحديد جميع الإشعارات كمقروءة
    /// Mark all notifications as read
    /// </summary>
    Task<bool> MarkAllAsReadAsync(string userId);

    /// <summary>
    /// حذف إشعار
    /// Delete notification
    /// </summary>
    Task<bool> DeleteNotificationAsync(string userId, string notificationId);

    /// <summary>
    /// الحصول على عدد الإشعارات غير المقروءة
    /// Get unread notification count
    /// </summary>
    Task<int> GetUnreadCountAsync(string userId);
}

/// <summary>
/// طلب إرسال إشعار
/// </summary>
public class PushNotificationRequest
{
    /// <summary>عنوان الإشعار</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>العنوان بالإنجليزية (اختياري)</summary>
    public string? TitleEn { get; set; }

    /// <summary>محتوى الإشعار</summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>المحتوى بالإنجليزية (اختياري)</summary>
    public string? BodyEn { get; set; }

    /// <summary>رابط الصورة (اختياري)</summary>
    public string? ImageUrl { get; set; }

    /// <summary>بيانات إضافية</summary>
    public Dictionary<string, string> Data { get; set; } = new();

    /// <summary>نوع الإشعار</summary>
    public NotificationType Type { get; set; } = NotificationType.General;

    /// <summary>أولوية الإشعار</summary>
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;

    /// <summary>صوت الإشعار</summary>
    public string? Sound { get; set; } = "default";

    /// <summary>شارة التطبيق</summary>
    public int? Badge { get; set; }

    /// <summary>قناة الإشعار (Android)</summary>
    public string? ChannelId { get; set; }

    /// <summary>الإجراء عند النقر</summary>
    public string? ClickAction { get; set; }

    /// <summary>تاريخ انتهاء الصلاحية</summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>إرسال صامت (بدون إظهار للمستخدم)</summary>
    public bool Silent { get; set; } = false;
}

/// <summary>
/// أنواع الإشعارات
/// </summary>
public enum NotificationType
{
    /// <summary>عام</summary>
    General = 0,

    /// <summary>تذكير</summary>
    Reminder = 1,

    /// <summary>موافقة/رفض</summary>
    Approval = 2,

    /// <summary>إجازة</summary>
    Leave = 3,

    /// <summary>مهمة</summary>
    Task = 4,

    /// <summary>راتب</summary>
    Payroll = 5,

    /// <summary>حضور</summary>
    Attendance = 6,

    /// <summary>تدريب</summary>
    Training = 7,

    /// <summary>دعم فني</summary>
    Support = 8,

    /// <summary>نظام</summary>
    System = 9,

    /// <summary>OTP</summary>
    OTP = 10,

    /// <summary>أمان</summary>
    Security = 11,

    /// <summary>مستودع</summary>
    Warehouse = 12,

    /// <summary>أرشفة</summary>
    Archiving = 13
}

/// <summary>
/// أولويات الإشعارات
/// </summary>
public enum NotificationPriority
{
    Low = 0,
    Normal = 1,
    High = 2,
    Critical = 3
}

/// <summary>
/// طلب تسجيل توكن الجهاز
/// </summary>
public class DeviceTokenRequest
{
    /// <summary>توكن الجهاز</summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>نوع الجهاز</summary>
    public DeviceType DeviceType { get; set; }

    /// <summary>اسم الجهاز</summary>
    public string? DeviceName { get; set; }

    /// <summary>إصدار نظام التشغيل</summary>
    public string? OsVersion { get; set; }

    /// <summary>إصدار التطبيق</summary>
    public string? AppVersion { get; set; }
}

/// <summary>
/// أنواع الأجهزة
/// </summary>
public enum DeviceType
{
    iOS = 0,
    Android = 1,
    Web = 2
}

/// <summary>
/// نتيجة إرسال الإشعار
/// </summary>
public class PushResult
{
    public bool Success { get; set; }
    public string? MessageId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string MessageAr { get; set; } = string.Empty;
    public string? ErrorCode { get; set; }

    public static PushResult SuccessResult(string messageId)
    {
        return new PushResult
        {
            Success = true,
            MessageId = messageId,
            Message = "Notification sent successfully",
            MessageAr = "تم إرسال الإشعار بنجاح"
        };
    }

    public static PushResult FailureResult(string message, string messageAr, string? errorCode = null)
    {
        return new PushResult
        {
            Success = false,
            Message = message,
            MessageAr = messageAr,
            ErrorCode = errorCode
        };
    }
}

/// <summary>
/// نتيجة إرسال إشعارات جماعية
/// </summary>
public class BulkPushResult
{
    public int TotalSent { get; set; }
    public int TotalFailed { get; set; }
    public List<string> FailedUserIds { get; set; } = new();
    public List<PushResult> Results { get; set; } = new();
}

/// <summary>
/// سجل الإشعار
/// </summary>
public class NotificationRecord
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public NotificationPriority Priority { get; set; }
    public Dictionary<string, string> Data { get; set; } = new();
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public string? ImageUrl { get; set; }
    public string? ActionUrl { get; set; }
}

/// <summary>
/// إعدادات خدمة الإشعارات
/// </summary>
public class PushNotificationSettings
{
    /// <summary>مزود الخدمة (Firebase, OneSignal, etc.)</summary>
    public string Provider { get; set; } = "Firebase";

    /// <summary>مفتاح خادم Firebase</summary>
    public string? FirebaseServerKey { get; set; }

    /// <summary>معرف مشروع Firebase</summary>
    public string? FirebaseProjectId { get; set; }

    /// <summary>بيانات اعتماد Firebase (JSON)</summary>
    public string? FirebaseCredentialsJson { get; set; }

    /// <summary>معرف تطبيق OneSignal</summary>
    public string? OneSignalAppId { get; set; }

    /// <summary>مفتاح REST API لـ OneSignal</summary>
    public string? OneSignalRestApiKey { get; set; }

    /// <summary>تفعيل الخدمة</summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>وضع الاختبار</summary>
    public bool TestMode { get; set; } = false;

    /// <summary>حفظ سجل الإشعارات</summary>
    public bool SaveHistory { get; set; } = true;

    /// <summary>مدة الاحتفاظ بالسجل (بالأيام)</summary>
    public int HistoryRetentionDays { get; set; } = 90;
}
