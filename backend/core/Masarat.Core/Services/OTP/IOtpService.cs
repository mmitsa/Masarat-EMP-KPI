using System;
using System.Threading.Tasks;

namespace Masarat.Core.Services.OTP;

/// <summary>
/// خدمة OTP (كلمة المرور لمرة واحدة)
/// OTP Service Interface for One-Time Password Authentication
/// </summary>
public interface IOtpService
{
    /// <summary>
    /// توليد رمز OTP جديد وإرساله للموظف
    /// Generate and send OTP to employee
    /// </summary>
    Task<OtpResult> GenerateAndSendOtpAsync(string userId, OtpDeliveryMethod method = OtpDeliveryMethod.SMS);

    /// <summary>
    /// التحقق من رمز OTP المُدخل
    /// Verify the entered OTP code
    /// </summary>
    Task<OtpVerificationResult> VerifyOtpAsync(string userId, string otpCode);

    /// <summary>
    /// إعادة إرسال رمز OTP
    /// Resend OTP code
    /// </summary>
    Task<OtpResult> ResendOtpAsync(string userId, OtpDeliveryMethod method = OtpDeliveryMethod.SMS);

    /// <summary>
    /// إلغاء صلاحية رمز OTP الحالي
    /// Invalidate current OTP
    /// </summary>
    Task InvalidateOtpAsync(string userId);

    /// <summary>
    /// التحقق من عدد المحاولات المتبقية
    /// Check remaining attempts
    /// </summary>
    Task<int> GetRemainingAttemptsAsync(string userId);

    /// <summary>
    /// التحقق من حالة القفل
    /// Check if user is locked out from OTP attempts
    /// </summary>
    Task<bool> IsLockedOutAsync(string userId);

    /// <summary>
    /// الحصول على وقت انتهاء صلاحية OTP
    /// Get OTP expiration time
    /// </summary>
    Task<DateTime?> GetOtpExpirationAsync(string userId);
}

/// <summary>
/// طرق إرسال OTP
/// OTP Delivery Methods
/// </summary>
public enum OtpDeliveryMethod
{
    /// <summary>رسالة نصية SMS</summary>
    SMS = 1,

    /// <summary>البريد الإلكتروني</summary>
    Email = 2,

    /// <summary>إشعار التطبيق</summary>
    PushNotification = 3,

    /// <summary>كلاهما SMS وEmail</summary>
    Both = 4
}

/// <summary>
/// نتيجة توليد OTP
/// </summary>
public class OtpResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string MessageAr { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
    public int CodeLength { get; set; }
    public OtpDeliveryMethod DeliveryMethod { get; set; }
    public string MaskedPhone { get; set; } = string.Empty;
    public string MaskedEmail { get; set; } = string.Empty;
    public int RetryAfterSeconds { get; set; }

    public static OtpResult SuccessResult(DateTime expiresAt, OtpDeliveryMethod method, string maskedPhone = "", string maskedEmail = "")
    {
        return new OtpResult
        {
            Success = true,
            Message = "OTP sent successfully",
            MessageAr = "تم إرسال رمز التحقق بنجاح",
            ExpiresAt = expiresAt,
            CodeLength = 6,
            DeliveryMethod = method,
            MaskedPhone = maskedPhone,
            MaskedEmail = maskedEmail
        };
    }

    public static OtpResult FailureResult(string message, string messageAr, int retryAfterSeconds = 0)
    {
        return new OtpResult
        {
            Success = false,
            Message = message,
            MessageAr = messageAr,
            RetryAfterSeconds = retryAfterSeconds
        };
    }
}

/// <summary>
/// نتيجة التحقق من OTP
/// </summary>
public class OtpVerificationResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string MessageAr { get; set; } = string.Empty;
    public int RemainingAttempts { get; set; }
    public bool IsLocked { get; set; }
    public int LockoutSeconds { get; set; }
    public string? AuthToken { get; set; }
    public DateTime? TokenExpiresAt { get; set; }

    public static OtpVerificationResult SuccessResult(string authToken, DateTime tokenExpiresAt)
    {
        return new OtpVerificationResult
        {
            Success = true,
            Message = "OTP verified successfully",
            MessageAr = "تم التحقق بنجاح",
            AuthToken = authToken,
            TokenExpiresAt = tokenExpiresAt
        };
    }

    public static OtpVerificationResult FailureResult(string message, string messageAr, int remainingAttempts, bool isLocked = false, int lockoutSeconds = 0)
    {
        return new OtpVerificationResult
        {
            Success = false,
            Message = message,
            MessageAr = messageAr,
            RemainingAttempts = remainingAttempts,
            IsLocked = isLocked,
            LockoutSeconds = lockoutSeconds
        };
    }
}

/// <summary>
/// إعدادات خدمة OTP
/// </summary>
public class OtpSettings
{
    /// <summary>طول رمز OTP (افتراضي: 6 أرقام)</summary>
    public int CodeLength { get; set; } = 6;

    /// <summary>مدة صلاحية OTP بالدقائق (افتراضي: 5 دقائق)</summary>
    public int ExpirationMinutes { get; set; } = 5;

    /// <summary>عدد المحاولات المسموحة (افتراضي: 3)</summary>
    public int MaxAttempts { get; set; } = 3;

    /// <summary>مدة القفل بالدقائق عند تجاوز المحاولات (افتراضي: 15 دقيقة)</summary>
    public int LockoutMinutes { get; set; } = 15;

    /// <summary>الحد الأدنى للانتظار بين طلبات إعادة الإرسال (افتراضي: 60 ثانية)</summary>
    public int ResendCooldownSeconds { get; set; } = 60;

    /// <summary>الحد الأقصى لعدد مرات إعادة الإرسال (افتراضي: 5)</summary>
    public int MaxResendAttempts { get; set; } = 5;

    /// <summary>هل يُستخدم OTP رقمي فقط (افتراضي: نعم)</summary>
    public bool NumericOnly { get; set; } = true;

    /// <summary>طريقة الإرسال الافتراضية</summary>
    public OtpDeliveryMethod DefaultDeliveryMethod { get; set; } = OtpDeliveryMethod.SMS;

    /// <summary>تفعيل الإرسال عبر SMS</summary>
    public bool EnableSms { get; set; } = true;

    /// <summary>تفعيل الإرسال عبر Email</summary>
    public bool EnableEmail { get; set; } = true;

    /// <summary>تفعيل الإشعارات</summary>
    public bool EnablePushNotification { get; set; } = true;
}
