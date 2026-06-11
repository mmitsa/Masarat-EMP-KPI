using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Masarat.Core.Services.SMS;

/// <summary>
/// خدمة الرسائل النصية - تدعم مزودين متعددين (Unifonic, Twilio)
/// SMS Service Implementation - Supports multiple providers
/// </summary>
public class SmsService : ISmsService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<SmsService> _logger;
    private readonly SmsSettings _settings;
    private readonly IUserContactService _userContactService;

    public SmsService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<SmsService> logger,
        IUserContactService userContactService)
    {
        _httpClient = httpClient;
        _logger = logger;
        _userContactService = userContactService;

        _settings = new SmsSettings
        {
            Provider = configuration["SMS:Provider"] ?? "Unifonic",
            ApiKey = configuration["SMS:ApiKey"] ?? "",
            ApiSecret = configuration["SMS:ApiSecret"] ?? "",
            SenderId = configuration["SMS:SenderId"] ?? "MASARAT",
            ApiUrl = configuration["SMS:ApiUrl"] ?? "",
            IsEnabled = bool.Parse(configuration["SMS:IsEnabled"] ?? "true"),
            TestMode = bool.Parse(configuration["SMS:TestMode"] ?? "false"),
            TestNumber = configuration["SMS:TestNumber"] ?? ""
        };
    }

    /// <inheritdoc />
    public async Task<SmsResult> SendSmsAsync(string phoneNumber, string message)
    {
        if (!_settings.IsEnabled)
        {
            _logger.LogWarning("SMS service is disabled. Message to {Phone} not sent.", MaskPhoneNumber(phoneNumber));
            return SmsResult.SuccessResult("disabled", MaskPhoneNumber(phoneNumber));
        }

        if (!ValidatePhoneNumber(phoneNumber))
        {
            return SmsResult.FailureResult(
                "Invalid phone number format",
                "صيغة رقم الهاتف غير صحيحة",
                "INVALID_NUMBER"
            );
        }

        try
        {
            // Use test number in test mode
            var targetNumber = _settings.TestMode && !string.IsNullOrEmpty(_settings.TestNumber)
                ? _settings.TestNumber
                : phoneNumber;

            var result = _settings.Provider.ToLower() switch
            {
                "unifonic" => await SendViaUnifonicAsync(targetNumber, message),
                "twilio" => await SendViaTwilioAsync(targetNumber, message),
                "msegat" => await SendViaMsegatAsync(targetNumber, message),
                _ => await SendViaUnifonicAsync(targetNumber, message)
            };

            if (result.Success)
            {
                _logger.LogInformation("SMS sent successfully to {Phone} via {Provider}",
                    MaskPhoneNumber(phoneNumber), _settings.Provider);
            }
            else
            {
                _logger.LogWarning("SMS failed to {Phone}: {Error}",
                    MaskPhoneNumber(phoneNumber), result.ErrorCode);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending SMS to {Phone}", MaskPhoneNumber(phoneNumber));
            return SmsResult.FailureResult(
                "Failed to send SMS",
                "فشل في إرسال الرسالة النصية",
                "SEND_ERROR"
            );
        }
    }

    /// <inheritdoc />
    public async Task<SmsResult> SendOtpAsync(string userId, string otpCode, int expirationMinutes)
    {
        // Get user's phone number from user service
        var phoneNumber = await _userContactService.GetUserPhoneAsync(userId);
        if (string.IsNullOrEmpty(phoneNumber))
        {
            return SmsResult.FailureResult(
                "User phone number not found",
                "رقم هاتف المستخدم غير موجود",
                "NO_PHONE"
            );
        }

        var message = $"رمز التحقق الخاص بك هو: {otpCode}\n" +
                     $"صالح لمدة {expirationMinutes} دقائق.\n" +
                     "منصة مسارات - لا تشارك هذا الرمز مع أي شخص.";

        var result = await SendSmsAsync(phoneNumber, message);
        result.MaskedPhone = MaskPhoneNumber(phoneNumber);
        return result;
    }

    /// <inheritdoc />
    public async Task<BulkSmsResult> SendBulkSmsAsync(string[] phoneNumbers, string message)
    {
        var results = new List<SmsResult>();
        var totalCost = 0m;

        foreach (var phone in phoneNumbers)
        {
            var result = await SendSmsAsync(phone, message);
            results.Add(result);
            if (result.Success)
            {
                totalCost += result.Cost;
            }
        }

        return new BulkSmsResult
        {
            TotalSent = results.Count(r => r.Success),
            TotalFailed = results.Count(r => !r.Success),
            TotalCost = totalCost,
            Results = results
        };
    }

    /// <inheritdoc />
    public bool ValidatePhoneNumber(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return false;

        // Remove any non-digit characters
        var cleanNumber = Regex.Replace(phoneNumber, @"[^\d+]", "");

        // Saudi Arabia format: +966XXXXXXXXX (12 digits) or 05XXXXXXXX (10 digits)
        // International format: +XXXXXXXXXXX
        var patterns = new[]
        {
            @"^\+966[0-9]{9}$",           // +966XXXXXXXXX
            @"^966[0-9]{9}$",             // 966XXXXXXXXX
            @"^0?5[0-9]{8}$",             // 05XXXXXXXX or 5XXXXXXXX
            @"^\+[1-9][0-9]{7,14}$"       // International format
        };

        return patterns.Any(p => Regex.IsMatch(cleanNumber, p));
    }

    /// <inheritdoc />
    public async Task<int> GetRemainingCreditsAsync()
    {
        try
        {
            return _settings.Provider.ToLower() switch
            {
                "unifonic" => await GetUnifonicBalanceAsync(),
                "twilio" => await GetTwilioBalanceAsync(),
                _ => -1
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting SMS balance");
            return -1;
        }
    }

    /// <inheritdoc />
    public async Task<SmsDeliveryStatus> GetMessageStatusAsync(string messageId)
    {
        try
        {
            return _settings.Provider.ToLower() switch
            {
                "unifonic" => await GetUnifonicStatusAsync(messageId),
                "twilio" => await GetTwilioStatusAsync(messageId),
                _ => new SmsDeliveryStatus { MessageId = messageId, Status = SmsStatus.Pending }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting message status for {MessageId}", messageId);
            return new SmsDeliveryStatus { MessageId = messageId, Status = SmsStatus.Pending };
        }
    }

    #region Provider Implementations

    /// <summary>
    /// إرسال عبر Unifonic (السعودية)
    /// </summary>
    private async Task<SmsResult> SendViaUnifonicAsync(string phoneNumber, string message)
    {
        var url = string.IsNullOrEmpty(_settings.ApiUrl)
            ? "https://el.cloud.unifonic.com/rest/SMS/messages"
            : _settings.ApiUrl;

        var content = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("AppSid", _settings.ApiKey),
            new KeyValuePair<string, string>("Recipient", NormalizePhoneNumber(phoneNumber)),
            new KeyValuePair<string, string>("Body", message),
            new KeyValuePair<string, string>("SenderID", _settings.SenderId),
            new KeyValuePair<string, string>("responseType", "JSON"),
            new KeyValuePair<string, string>("CorrelationID", Guid.NewGuid().ToString())
        });

        var response = await _httpClient.PostAsync(url, content);
        var responseContent = await response.Content.ReadAsStringAsync();

        if (response.IsSuccessStatusCode)
        {
            var result = JsonSerializer.Deserialize<UnifonicResponse>(responseContent);
            if (result?.Success == true || result?.ErrorCode == "ER-00")
            {
                return SmsResult.SuccessResult(
                    result?.Data?.MessageID ?? Guid.NewGuid().ToString(),
                    MaskPhoneNumber(phoneNumber),
                    result?.Data?.Cost ?? 0
                );
            }
            return SmsResult.FailureResult(
                result?.Message ?? "Unknown error",
                "فشل في إرسال الرسالة",
                result?.ErrorCode ?? "UNKNOWN"
            );
        }

        return SmsResult.FailureResult(
            $"HTTP Error: {response.StatusCode}",
            "خطأ في الاتصال بمزود الخدمة",
            "HTTP_ERROR"
        );
    }

    /// <summary>
    /// إرسال عبر Twilio
    /// </summary>
    private async Task<SmsResult> SendViaTwilioAsync(string phoneNumber, string message)
    {
        var url = $"https://api.twilio.com/2010-04-01/Accounts/{_settings.ApiKey}/Messages.json";

        var authToken = Convert.ToBase64String(
            Encoding.ASCII.GetBytes($"{_settings.ApiKey}:{_settings.ApiSecret}"));

        _httpClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authToken);

        var content = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("To", NormalizePhoneNumber(phoneNumber)),
            new KeyValuePair<string, string>("From", _settings.SenderId),
            new KeyValuePair<string, string>("Body", message)
        });

        var response = await _httpClient.PostAsync(url, content);
        var responseContent = await response.Content.ReadAsStringAsync();

        if (response.IsSuccessStatusCode)
        {
            var result = JsonSerializer.Deserialize<TwilioResponse>(responseContent);
            return SmsResult.SuccessResult(
                result?.Sid ?? Guid.NewGuid().ToString(),
                MaskPhoneNumber(phoneNumber),
                decimal.Parse(result?.Price ?? "0")
            );
        }

        return SmsResult.FailureResult(
            "Twilio send failed",
            "فشل في إرسال الرسالة عبر Twilio",
            "TWILIO_ERROR"
        );
    }

    /// <summary>
    /// إرسال عبر Msegat (السعودية)
    /// </summary>
    private async Task<SmsResult> SendViaMsegatAsync(string phoneNumber, string message)
    {
        var url = "https://www.msegat.com/gw/sendsms.php";

        var payload = new
        {
            userName = _settings.ApiKey,
            apiKey = _settings.ApiSecret,
            numbers = NormalizePhoneNumber(phoneNumber),
            userSender = _settings.SenderId,
            msg = message,
            msgEncoding = "UTF8"
        };

        var response = await _httpClient.PostAsJsonAsync(url, payload);
        var responseContent = await response.Content.ReadAsStringAsync();

        if (response.IsSuccessStatusCode)
        {
            var result = JsonSerializer.Deserialize<MsegatResponse>(responseContent);
            if (result?.Code == "1")
            {
                return SmsResult.SuccessResult(
                    result?.Id ?? Guid.NewGuid().ToString(),
                    MaskPhoneNumber(phoneNumber)
                );
            }
            return SmsResult.FailureResult(
                result?.Message ?? "Unknown error",
                "فشل في إرسال الرسالة",
                result?.Code ?? "UNKNOWN"
            );
        }

        return SmsResult.FailureResult(
            "Msegat send failed",
            "فشل في إرسال الرسالة عبر Msegat",
            "MSEGAT_ERROR"
        );
    }

    #endregion

    #region Balance & Status Methods

    private async Task<int> GetUnifonicBalanceAsync()
    {
        var url = $"https://el.cloud.unifonic.com/rest/Account/GetBalance?AppSid={_settings.ApiKey}";
        var response = await _httpClient.GetAsync(url);
        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<UnifonicBalanceResponse>(content);
            return (int)(result?.Data?.Balance ?? 0);
        }
        return -1;
    }

    private async Task<int> GetTwilioBalanceAsync()
    {
        // Twilio balance check implementation
        return -1;
    }

    private async Task<SmsDeliveryStatus> GetUnifonicStatusAsync(string messageId)
    {
        var url = $"https://el.cloud.unifonic.com/rest/SMS/GetMessageIDStatus?AppSid={_settings.ApiKey}&MessageID={messageId}";
        var response = await _httpClient.GetAsync(url);
        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            // Parse and return status
        }
        return new SmsDeliveryStatus { MessageId = messageId, Status = SmsStatus.Pending };
    }

    private async Task<SmsDeliveryStatus> GetTwilioStatusAsync(string messageId)
    {
        return new SmsDeliveryStatus { MessageId = messageId, Status = SmsStatus.Pending };
    }

    #endregion

    #region Helper Methods

    private static string NormalizePhoneNumber(string phoneNumber)
    {
        var clean = Regex.Replace(phoneNumber, @"[^\d]", "");

        // Convert Saudi local format to international
        if (clean.StartsWith("05") || clean.StartsWith("5"))
        {
            clean = "966" + clean.TrimStart('0');
        }

        return clean.StartsWith("+") ? clean : "+" + clean;
    }

    private static string MaskPhoneNumber(string phoneNumber)
    {
        if (string.IsNullOrEmpty(phoneNumber) || phoneNumber.Length < 6)
            return "***";

        var clean = Regex.Replace(phoneNumber, @"[^\d]", "");
        var last4 = clean.Substring(clean.Length - 4);
        return $"******{last4}";
    }

    #endregion
}

#region Response Models

internal class UnifonicResponse
{
    public bool Success { get; set; }
    public string? ErrorCode { get; set; }
    public string? Message { get; set; }
    public UnifonicData? Data { get; set; }
}

internal class UnifonicData
{
    public string? MessageID { get; set; }
    public decimal Cost { get; set; }
}

internal class UnifonicBalanceResponse
{
    public UnifonicBalanceData? Data { get; set; }
}

internal class UnifonicBalanceData
{
    public decimal Balance { get; set; }
}

internal class TwilioResponse
{
    public string? Sid { get; set; }
    public string? Status { get; set; }
    public string? Price { get; set; }
}

internal class MsegatResponse
{
    public string? Code { get; set; }
    public string? Message { get; set; }
    public string? Id { get; set; }
}

#endregion

/// <summary>
/// واجهة للحصول على بيانات اتصال المستخدم
/// </summary>
public interface IUserContactService
{
    Task<string?> GetUserPhoneAsync(string userId);
    Task<string?> GetUserEmailAsync(string userId);
    Task<UserContactInfo?> GetUserContactInfoAsync(string userId);
}

/// <summary>
/// بيانات اتصال المستخدم
/// </summary>
public class UserContactInfo
{
    public string UserId { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? DeviceToken { get; set; }
    public bool SmsEnabled { get; set; } = true;
    public bool EmailEnabled { get; set; } = true;
    public bool PushEnabled { get; set; } = true;
}
