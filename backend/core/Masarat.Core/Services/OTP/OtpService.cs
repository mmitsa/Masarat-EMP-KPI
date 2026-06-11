using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Masarat.Core.Services.Caching;
using Masarat.Core.Services.SMS;
using Masarat.Core.Services.Notifications;

namespace Masarat.Core.Services.OTP;

/// <summary>
/// خدمة OTP - تنفيذ كامل لكلمة المرور لمرة واحدة
/// Complete OTP Service Implementation
/// </summary>
public class OtpService : IOtpService
{
    private readonly ICacheService _cacheService;
    private readonly ISmsService _smsService;
    private readonly IEmailService _emailService;
    private readonly IPushNotificationService _pushService;
    private readonly ILogger<OtpService> _logger;
    private readonly OtpSettings _settings;

    // Cache key prefixes
    private const string OTP_CODE_KEY = "otp:code:{0}";
    private const string OTP_ATTEMPTS_KEY = "otp:attempts:{0}";
    private const string OTP_LOCKOUT_KEY = "otp:lockout:{0}";
    private const string OTP_RESEND_KEY = "otp:resend:{0}";
    private const string OTP_RESEND_COUNT_KEY = "otp:resend_count:{0}";

    /// <summary>
    /// Constructor مع IOtpSettingsProvider (يُفضَّل - يقرأ الإعدادات من قاعدة البيانات)
    /// Preferred constructor - reads settings from database via provider
    /// </summary>
    public OtpService(
        ICacheService cacheService,
        ISmsService smsService,
        IEmailService emailService,
        IPushNotificationService pushService,
        IOtpSettingsProvider settingsProvider,
        ILogger<OtpService> logger)
    {
        _cacheService = cacheService;
        _smsService = smsService;
        _emailService = emailService;
        _pushService = pushService;
        _logger = logger;

        _settings = settingsProvider.GetOtpSettingsAsync().GetAwaiter().GetResult();
    }

    /// <summary>
    /// Constructor مع IConfiguration (للتوافق مع الكود القديم - fallback)
    /// Legacy constructor - reads settings from appsettings.json
    /// </summary>
    public OtpService(
        ICacheService cacheService,
        ISmsService smsService,
        IEmailService emailService,
        IPushNotificationService pushService,
        IConfiguration configuration,
        ILogger<OtpService> logger)
    {
        _cacheService = cacheService;
        _smsService = smsService;
        _emailService = emailService;
        _pushService = pushService;
        _logger = logger;

        _settings = new OtpSettings
        {
            CodeLength = int.Parse(configuration["OTP:CodeLength"] ?? "6"),
            ExpirationMinutes = int.Parse(configuration["OTP:ExpirationMinutes"] ?? "5"),
            MaxAttempts = int.Parse(configuration["OTP:MaxAttempts"] ?? "3"),
            LockoutMinutes = int.Parse(configuration["OTP:LockoutMinutes"] ?? "15"),
            ResendCooldownSeconds = int.Parse(configuration["OTP:ResendCooldownSeconds"] ?? "60"),
            MaxResendAttempts = int.Parse(configuration["OTP:MaxResendAttempts"] ?? "5"),
            NumericOnly = bool.Parse(configuration["OTP:NumericOnly"] ?? "true"),
            EnableSms = bool.Parse(configuration["OTP:EnableSms"] ?? "true"),
            EnableEmail = bool.Parse(configuration["OTP:EnableEmail"] ?? "true"),
            EnablePushNotification = bool.Parse(configuration["OTP:EnablePushNotification"] ?? "true")
        };
    }

    /// <inheritdoc />
    public async Task<OtpResult> GenerateAndSendOtpAsync(string userId, OtpDeliveryMethod method = OtpDeliveryMethod.SMS)
    {
        try
        {
            // Check if user is locked out
            if (await IsLockedOutAsync(userId))
            {
                var lockoutKey = string.Format(OTP_LOCKOUT_KEY, userId);
                var lockoutExpiry = await _cacheService.GetAsync<DateTime?>(lockoutKey);
                var remainingSeconds = lockoutExpiry.HasValue
                    ? (int)(lockoutExpiry.Value - DateTime.UtcNow).TotalSeconds
                    : _settings.LockoutMinutes * 60;

                return OtpResult.FailureResult(
                    $"Too many failed attempts. Try again in {remainingSeconds / 60} minutes.",
                    $"تم تجاوز الحد المسموح من المحاولات. حاول مجدداً بعد {remainingSeconds / 60} دقيقة.",
                    remainingSeconds
                );
            }

            // Check resend cooldown
            var resendKey = string.Format(OTP_RESEND_KEY, userId);
            var canResend = await _cacheService.GetAsync<DateTime?>(resendKey);
            if (canResend.HasValue && canResend.Value > DateTime.UtcNow)
            {
                var waitSeconds = (int)(canResend.Value - DateTime.UtcNow).TotalSeconds;
                return OtpResult.FailureResult(
                    $"Please wait {waitSeconds} seconds before requesting a new code.",
                    $"يرجى الانتظار {waitSeconds} ثانية قبل طلب رمز جديد.",
                    waitSeconds
                );
            }

            // Check max resend attempts
            var resendCountKey = string.Format(OTP_RESEND_COUNT_KEY, userId);
            var resendCount = await _cacheService.GetAsync<int>(resendCountKey);
            if (resendCount >= _settings.MaxResendAttempts)
            {
                return OtpResult.FailureResult(
                    "Maximum resend attempts reached. Please try again later.",
                    "تم تجاوز الحد الأقصى لمرات إعادة الإرسال. حاول مجدداً لاحقاً."
                );
            }

            // Generate OTP code
            var otpCode = GenerateOtpCode();
            var expiresAt = DateTime.UtcNow.AddMinutes(_settings.ExpirationMinutes);

            // Store OTP in cache
            var codeKey = string.Format(OTP_CODE_KEY, userId);
            var hashedCode = HashOtp(otpCode);
            await _cacheService.SetAsync(codeKey, new OtpData
            {
                HashedCode = hashedCode,
                ExpiresAt = expiresAt,
                CreatedAt = DateTime.UtcNow
            }, TimeSpan.FromMinutes(_settings.ExpirationMinutes));

            // Reset attempt counter
            var attemptsKey = string.Format(OTP_ATTEMPTS_KEY, userId);
            await _cacheService.SetAsync(attemptsKey, 0, TimeSpan.FromMinutes(_settings.ExpirationMinutes));

            // Set resend cooldown
            await _cacheService.SetAsync(resendKey,
                DateTime.UtcNow.AddSeconds(_settings.ResendCooldownSeconds),
                TimeSpan.FromSeconds(_settings.ResendCooldownSeconds));

            // Increment resend count
            await _cacheService.SetAsync(resendCountKey, resendCount + 1, TimeSpan.FromHours(1));

            // Send OTP via selected method(s)
            var (maskedPhone, maskedEmail) = await SendOtpViaMethodAsync(userId, otpCode, method);

            _logger.LogInformation("OTP generated and sent for user {UserId} via {Method}", userId, method);

            // ⚠️ Development only - log OTP code for testing (checks runtime environment)
            var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            if (env == "Development")
            {
                _logger.LogWarning("🔑 [DEV ONLY] OTP Code for user {UserId}: {OtpCode}", userId, otpCode);
            }
            #if DEBUG
            _logger.LogWarning("🔑 [DEV ONLY] OTP Code for user {UserId}: {OtpCode}", userId, otpCode);
            #endif

            return OtpResult.SuccessResult(expiresAt, method, maskedPhone, maskedEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating OTP for user {UserId}", userId);
            return OtpResult.FailureResult(
                "An error occurred while sending the verification code.",
                "حدث خطأ أثناء إرسال رمز التحقق."
            );
        }
    }

    /// <inheritdoc />
    public async Task<OtpVerificationResult> VerifyOtpAsync(string userId, string otpCode)
    {
        try
        {
            // Check if user is locked out
            if (await IsLockedOutAsync(userId))
            {
                var lockoutKey = string.Format(OTP_LOCKOUT_KEY, userId);
                var lockoutExpiry = await _cacheService.GetAsync<DateTime?>(lockoutKey);
                var remainingSeconds = lockoutExpiry.HasValue
                    ? (int)(lockoutExpiry.Value - DateTime.UtcNow).TotalSeconds
                    : _settings.LockoutMinutes * 60;

                return OtpVerificationResult.FailureResult(
                    "Account temporarily locked due to too many failed attempts.",
                    "تم قفل الحساب مؤقتاً بسبب تجاوز عدد المحاولات المسموحة.",
                    0,
                    true,
                    remainingSeconds
                );
            }

            // Get stored OTP
            var codeKey = string.Format(OTP_CODE_KEY, userId);
            var storedOtp = await _cacheService.GetAsync<OtpData>(codeKey);

            if (storedOtp == null)
            {
                return OtpVerificationResult.FailureResult(
                    "No active verification code. Please request a new one.",
                    "لا يوجد رمز تحقق نشط. يرجى طلب رمز جديد.",
                    0
                );
            }

            // Check expiration
            if (storedOtp.ExpiresAt < DateTime.UtcNow)
            {
                await _cacheService.RemoveAsync(codeKey);
                return OtpVerificationResult.FailureResult(
                    "Verification code has expired. Please request a new one.",
                    "انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.",
                    0
                );
            }

            // Verify OTP
            var hashedInput = HashOtp(otpCode);

            // Debug logging for development
            var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            if (env == "Development")
            {
                _logger.LogWarning("🔍 [DEV] OTP Verify - User: {UserId}, Input: '{OtpCode}', InputLen: {Len}",
                    userId, otpCode, otpCode?.Length ?? 0);
            }

            if (!ConstantTimeEquals(hashedInput, storedOtp.HashedCode))
            {
                // Increment failed attempts
                var attemptsKey = string.Format(OTP_ATTEMPTS_KEY, userId);
                var attempts = await _cacheService.GetAsync<int>(attemptsKey);
                attempts++;
                await _cacheService.SetAsync(attemptsKey, attempts, TimeSpan.FromMinutes(_settings.ExpirationMinutes));

                var remainingAttempts = _settings.MaxAttempts - attempts;

                // Check if should lock out
                if (remainingAttempts <= 0)
                {
                    var lockoutKey = string.Format(OTP_LOCKOUT_KEY, userId);
                    var lockoutUntil = DateTime.UtcNow.AddMinutes(_settings.LockoutMinutes);
                    await _cacheService.SetAsync(lockoutKey, lockoutUntil, TimeSpan.FromMinutes(_settings.LockoutMinutes));
                    await _cacheService.RemoveAsync(codeKey);

                    _logger.LogWarning("User {UserId} locked out due to too many failed OTP attempts", userId);

                    return OtpVerificationResult.FailureResult(
                        $"Account locked for {_settings.LockoutMinutes} minutes due to too many failed attempts.",
                        $"تم قفل الحساب لمدة {_settings.LockoutMinutes} دقيقة بسبب تجاوز عدد المحاولات.",
                        0,
                        true,
                        _settings.LockoutMinutes * 60
                    );
                }

                return OtpVerificationResult.FailureResult(
                    $"Invalid verification code. {remainingAttempts} attempts remaining.",
                    $"رمز التحقق غير صحيح. متبقي {remainingAttempts} محاولات.",
                    remainingAttempts
                );
            }

            // OTP verified successfully - clean up
            await InvalidateOtpAsync(userId);

            _logger.LogInformation("OTP verified successfully for user {UserId}", userId);

            // Generate temporary auth token (actual token generation would be handled by Identity Server)
            var authToken = GenerateSecureToken();
            var tokenExpiresAt = DateTime.UtcNow.AddMinutes(30);

            return OtpVerificationResult.SuccessResult(authToken, tokenExpiresAt);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying OTP for user {UserId}", userId);
            return OtpVerificationResult.FailureResult(
                "An error occurred while verifying the code.",
                "حدث خطأ أثناء التحقق من الرمز.",
                0
            );
        }
    }

    /// <inheritdoc />
    public async Task<OtpResult> ResendOtpAsync(string userId, OtpDeliveryMethod method = OtpDeliveryMethod.SMS)
    {
        return await GenerateAndSendOtpAsync(userId, method);
    }

    /// <inheritdoc />
    public async Task InvalidateOtpAsync(string userId)
    {
        var codeKey = string.Format(OTP_CODE_KEY, userId);
        var attemptsKey = string.Format(OTP_ATTEMPTS_KEY, userId);
        var resendKey = string.Format(OTP_RESEND_KEY, userId);
        var resendCountKey = string.Format(OTP_RESEND_COUNT_KEY, userId);

        await Task.WhenAll(
            _cacheService.RemoveAsync(codeKey),
            _cacheService.RemoveAsync(attemptsKey),
            _cacheService.RemoveAsync(resendKey),
            _cacheService.RemoveAsync(resendCountKey)
        );
    }

    /// <inheritdoc />
    public async Task<int> GetRemainingAttemptsAsync(string userId)
    {
        var attemptsKey = string.Format(OTP_ATTEMPTS_KEY, userId);
        var attempts = await _cacheService.GetAsync<int>(attemptsKey);
        return Math.Max(0, _settings.MaxAttempts - attempts);
    }

    /// <inheritdoc />
    public async Task<bool> IsLockedOutAsync(string userId)
    {
        var lockoutKey = string.Format(OTP_LOCKOUT_KEY, userId);
        var lockoutUntil = await _cacheService.GetAsync<DateTime?>(lockoutKey);
        return lockoutUntil.HasValue && lockoutUntil.Value > DateTime.UtcNow;
    }

    /// <inheritdoc />
    public async Task<DateTime?> GetOtpExpirationAsync(string userId)
    {
        var codeKey = string.Format(OTP_CODE_KEY, userId);
        var storedOtp = await _cacheService.GetAsync<OtpData>(codeKey);
        return storedOtp?.ExpiresAt;
    }

    #region Private Methods

    private string GenerateOtpCode()
    {
        if (_settings.NumericOnly)
        {
            var bytes = new byte[4];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            var number = BitConverter.ToUInt32(bytes, 0) % (uint)Math.Pow(10, _settings.CodeLength);
            return number.ToString().PadLeft(_settings.CodeLength, '0');
        }
        else
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var code = new StringBuilder(_settings.CodeLength);
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[_settings.CodeLength];
            rng.GetBytes(bytes);
            for (int i = 0; i < _settings.CodeLength; i++)
            {
                code.Append(chars[bytes[i] % chars.Length]);
            }
            return code.ToString();
        }
    }

    private static string HashOtp(string otp)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(otp);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    private static bool ConstantTimeEquals(string a, string b)
    {
        if (a.Length != b.Length)
            return false;

        var result = 0;
        for (int i = 0; i < a.Length; i++)
        {
            result |= a[i] ^ b[i];
        }
        return result == 0;
    }

    private static string GenerateSecureToken()
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[32];
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    private async Task<(string maskedPhone, string maskedEmail)> SendOtpViaMethodAsync(
        string userId,
        string otpCode,
        OtpDeliveryMethod method)
    {
        var maskedPhone = "";
        var maskedEmail = "";

        // Format OTP message
        var messageAr = $"رمز التحقق الخاص بك هو: {otpCode}\nصالح لمدة {_settings.ExpirationMinutes} دقائق.\nلا تشارك هذا الرمز مع أي شخص.";
        var messageEn = $"Your verification code is: {otpCode}\nValid for {_settings.ExpirationMinutes} minutes.\nDo not share this code with anyone.";
        var subject = "رمز التحقق - منصة مسارات";

        switch (method)
        {
            case OtpDeliveryMethod.SMS:
                if (_settings.EnableSms)
                {
                    var smsResult = await _smsService.SendOtpAsync(userId, otpCode, _settings.ExpirationMinutes);
                    maskedPhone = smsResult.MaskedPhone;
                }
                break;

            case OtpDeliveryMethod.Email:
                if (_settings.EnableEmail)
                {
                    var emailResult = await _emailService.SendEmailAsync(userId, subject, GetOtpEmailTemplate(otpCode, _settings.ExpirationMinutes), true);
                    // Get masked email from user service
                    maskedEmail = await GetMaskedEmailAsync(userId);
                }
                break;

            case OtpDeliveryMethod.PushNotification:
                if (_settings.EnablePushNotification)
                {
                    await _pushService.SendNotificationAsync(userId, new PushNotificationRequest
                    {
                        Title = subject,
                        Body = messageAr,
                        Data = new Dictionary<string, string>
                        {
                            { "type", "otp" },
                            { "code", otpCode }
                        }
                    });
                }
                break;

            case OtpDeliveryMethod.Both:
                var tasks = new List<Task>();
                if (_settings.EnableSms)
                {
                    var smsTask = _smsService.SendOtpAsync(userId, otpCode, _settings.ExpirationMinutes);
                    tasks.Add(smsTask.ContinueWith(t => maskedPhone = t.Result.MaskedPhone));
                }
                if (_settings.EnableEmail)
                {
                    tasks.Add(_emailService.SendEmailAsync(userId, subject, GetOtpEmailTemplate(otpCode, _settings.ExpirationMinutes), true));
                    maskedEmail = await GetMaskedEmailAsync(userId);
                }
                await Task.WhenAll(tasks);
                break;
        }

        return (maskedPhone, maskedEmail);
    }

    private string GetOtpEmailTemplate(string otpCode, int expirationMinutes)
    {
        return $@"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }}
        .content {{ padding: 30px; text-align: center; }}
        .otp-code {{ font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8; background: #eff6ff; padding: 20px; border-radius: 12px; margin: 20px 0; }}
        .warning {{ background: #fef3c7; border-right: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 8px; text-align: right; }}
        .footer {{ background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🔐 رمز التحقق</h1>
        </div>
        <div class='content'>
            <p>مرحباً،</p>
            <p>استخدم الرمز التالي لإتمام عملية تسجيل الدخول:</p>
            <div class='otp-code'>{otpCode}</div>
            <p>صالح لمدة <strong>{expirationMinutes} دقائق</strong></p>
            <div class='warning'>
                <strong>⚠️ تنبيه أمني:</strong>
                <p>لا تشارك هذا الرمز مع أي شخص. فريق منصة مسارات لن يطلب منك هذا الرمز أبداً.</p>
            </div>
        </div>
        <div class='footer'>
            <p>إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.</p>
            <p>© 2026 منصة مسارات - جميع الحقوق محفوظة</p>
        </div>
    </div>
</body>
</html>";
    }

    private async Task<string> GetMaskedEmailAsync(string userId)
    {
        // This would typically fetch from user service
        // For now, return a placeholder
        return "***@***.com";
    }

    #endregion
}

/// <summary>
/// بيانات OTP المخزنة في الكاش
/// </summary>
internal class OtpData
{
    public string HashedCode { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
