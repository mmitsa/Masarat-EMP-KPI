using System;
using System.Threading.Tasks;

namespace Masarat.Core.Services.SMS;

/// <summary>
/// خدمة الرسائل النصية SMS
/// SMS Service Interface
/// </summary>
public interface ISmsService
{
    /// <summary>
    /// إرسال رسالة نصية
    /// Send SMS message
    /// </summary>
    Task<SmsResult> SendSmsAsync(string phoneNumber, string message);

    /// <summary>
    /// إرسال رسالة OTP
    /// Send OTP SMS
    /// </summary>
    Task<SmsResult> SendOtpAsync(string userId, string otpCode, int expirationMinutes);

    /// <summary>
    /// إرسال رسالة نصية لعدة أرقام
    /// Send bulk SMS
    /// </summary>
    Task<BulkSmsResult> SendBulkSmsAsync(string[] phoneNumbers, string message);

    /// <summary>
    /// التحقق من صحة رقم الهاتف
    /// Validate phone number format
    /// </summary>
    bool ValidatePhoneNumber(string phoneNumber);

    /// <summary>
    /// الحصول على رصيد الرسائل المتبقي
    /// Get remaining SMS credits
    /// </summary>
    Task<int> GetRemainingCreditsAsync();

    /// <summary>
    /// الحصول على حالة رسالة مرسلة
    /// Get sent message status
    /// </summary>
    Task<SmsDeliveryStatus> GetMessageStatusAsync(string messageId);
}

/// <summary>
/// نتيجة إرسال الرسالة
/// </summary>
public class SmsResult
{
    public bool Success { get; set; }
    public string MessageId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string MessageAr { get; set; } = string.Empty;
    public string MaskedPhone { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public string ErrorCode { get; set; } = string.Empty;

    public static SmsResult SuccessResult(string messageId, string maskedPhone, decimal cost = 0)
    {
        return new SmsResult
        {
            Success = true,
            MessageId = messageId,
            Message = "SMS sent successfully",
            MessageAr = "تم إرسال الرسالة بنجاح",
            MaskedPhone = maskedPhone,
            Cost = cost
        };
    }

    public static SmsResult FailureResult(string message, string messageAr, string errorCode = "")
    {
        return new SmsResult
        {
            Success = false,
            Message = message,
            MessageAr = messageAr,
            ErrorCode = errorCode
        };
    }
}

/// <summary>
/// نتيجة إرسال رسائل جماعية
/// </summary>
public class BulkSmsResult
{
    public int TotalSent { get; set; }
    public int TotalFailed { get; set; }
    public decimal TotalCost { get; set; }
    public List<SmsResult> Results { get; set; } = new();
}

/// <summary>
/// حالة تسليم الرسالة
/// </summary>
public class SmsDeliveryStatus
{
    public string MessageId { get; set; } = string.Empty;
    public SmsStatus Status { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public string StatusDescription { get; set; } = string.Empty;
}

/// <summary>
/// حالات الرسالة
/// </summary>
public enum SmsStatus
{
    Pending = 0,
    Sent = 1,
    Delivered = 2,
    Failed = 3,
    Rejected = 4,
    Expired = 5
}

/// <summary>
/// إعدادات خدمة SMS
/// </summary>
public class SmsSettings
{
    /// <summary>اسم مزود الخدمة</summary>
    public string Provider { get; set; } = "Unifonic"; // Unifonic, Twilio, etc.

    /// <summary>مفتاح API</summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>سر API</summary>
    public string ApiSecret { get; set; } = string.Empty;

    /// <summary>معرف المرسل</summary>
    public string SenderId { get; set; } = "MASARAT";

    /// <summary>رابط API</summary>
    public string ApiUrl { get; set; } = string.Empty;

    /// <summary>تفعيل الخدمة</summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>وضع الاختبار</summary>
    public bool TestMode { get; set; } = false;

    /// <summary>رقم الاختبار</summary>
    public string TestNumber { get; set; } = string.Empty;
}
