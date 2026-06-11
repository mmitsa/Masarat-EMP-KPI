using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Masarat.Core.Services.Caching;
using Masarat.Core.Services.SMS;

namespace Masarat.Core.Services.Notifications;

/// <summary>
/// خدمة إشعارات التطبيق - تدعم Firebase و OneSignal
/// Push Notification Service Implementation
/// </summary>
public class PushNotificationService : IPushNotificationService
{
    private readonly HttpClient _httpClient;
    private readonly ICacheService _cacheService;
    private readonly IUserContactService _userContactService;
    private readonly ILogger<PushNotificationService> _logger;
    private readonly PushNotificationSettings _settings;

    // Cache keys
    private const string DEVICE_TOKEN_KEY = "push:token:{0}:{1}"; // userId:deviceId
    private const string USER_TOKENS_KEY = "push:user_tokens:{0}"; // userId
    private const string NOTIFICATIONS_KEY = "push:notifications:{0}"; // userId
    private const string UNREAD_COUNT_KEY = "push:unread:{0}"; // userId
    private const string TOPIC_SUBSCRIBERS_KEY = "push:topic:{0}"; // topic

    public PushNotificationService(
        HttpClient httpClient,
        ICacheService cacheService,
        IUserContactService userContactService,
        IConfiguration configuration,
        ILogger<PushNotificationService> logger)
    {
        _httpClient = httpClient;
        _cacheService = cacheService;
        _userContactService = userContactService;
        _logger = logger;

        _settings = new PushNotificationSettings
        {
            Provider = configuration["PushNotification:Provider"] ?? "Firebase",
            FirebaseServerKey = configuration["PushNotification:Firebase:ServerKey"],
            FirebaseProjectId = configuration["PushNotification:Firebase:ProjectId"],
            FirebaseCredentialsJson = configuration["PushNotification:Firebase:CredentialsJson"],
            OneSignalAppId = configuration["PushNotification:OneSignal:AppId"],
            OneSignalRestApiKey = configuration["PushNotification:OneSignal:RestApiKey"],
            IsEnabled = bool.Parse(configuration["PushNotification:IsEnabled"] ?? "true"),
            TestMode = bool.Parse(configuration["PushNotification:TestMode"] ?? "false"),
            SaveHistory = bool.Parse(configuration["PushNotification:SaveHistory"] ?? "true"),
            HistoryRetentionDays = int.Parse(configuration["PushNotification:HistoryRetentionDays"] ?? "90")
        };
    }

    /// <inheritdoc />
    public async Task<PushResult> SendNotificationAsync(string userId, PushNotificationRequest request)
    {
        if (!_settings.IsEnabled)
        {
            _logger.LogWarning("Push notification service is disabled");
            return PushResult.SuccessResult("disabled");
        }

        try
        {
            // Get user's device tokens
            var tokens = await GetUserDeviceTokensAsync(userId);
            if (tokens == null || tokens.Count == 0)
            {
                _logger.LogWarning("No device tokens found for user {UserId}", userId);
                return PushResult.FailureResult(
                    "No device token registered",
                    "لا يوجد جهاز مسجل لهذا المستخدم",
                    "NO_TOKEN"
                );
            }

            // Send to all user devices
            var results = new List<PushResult>();
            foreach (var token in tokens)
            {
                var result = _settings.Provider.ToLower() switch
                {
                    "firebase" => await SendViaFirebaseAsync(token.Token, request),
                    "onesignal" => await SendViaOneSignalAsync(token.Token, request),
                    _ => await SendViaFirebaseAsync(token.Token, request)
                };
                results.Add(result);
            }

            // Save to notification history
            if (_settings.SaveHistory)
            {
                await SaveNotificationAsync(userId, request);
            }

            var anySuccess = results.Any(r => r.Success);
            if (anySuccess)
            {
                _logger.LogInformation("Push notification sent to user {UserId}", userId);
                return PushResult.SuccessResult(results.First(r => r.Success).MessageId!);
            }

            return results.First();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending push notification to user {UserId}", userId);
            return PushResult.FailureResult(
                "Failed to send notification",
                "فشل في إرسال الإشعار",
                "SEND_ERROR"
            );
        }
    }

    /// <inheritdoc />
    public async Task<BulkPushResult> SendBulkNotificationAsync(string[] userIds, PushNotificationRequest request)
    {
        var results = new List<PushResult>();
        var failedUserIds = new List<string>();

        var tasks = userIds.Select(async userId =>
        {
            var result = await SendNotificationAsync(userId, request);
            lock (results)
            {
                results.Add(result);
                if (!result.Success)
                {
                    failedUserIds.Add(userId);
                }
            }
        });

        await Task.WhenAll(tasks);

        return new BulkPushResult
        {
            TotalSent = results.Count(r => r.Success),
            TotalFailed = results.Count(r => !r.Success),
            FailedUserIds = failedUserIds,
            Results = results
        };
    }

    /// <inheritdoc />
    public async Task<PushResult> SendToTopicAsync(string topic, PushNotificationRequest request)
    {
        if (!_settings.IsEnabled)
        {
            return PushResult.SuccessResult("disabled");
        }

        try
        {
            return _settings.Provider.ToLower() switch
            {
                "firebase" => await SendToFirebaseTopicAsync(topic, request),
                "onesignal" => await SendToOneSignalSegmentAsync(topic, request),
                _ => await SendToFirebaseTopicAsync(topic, request)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending notification to topic {Topic}", topic);
            return PushResult.FailureResult(
                "Failed to send topic notification",
                "فشل في إرسال إشعار الموضوع",
                "TOPIC_ERROR"
            );
        }
    }

    /// <inheritdoc />
    public async Task<bool> RegisterDeviceTokenAsync(string userId, DeviceTokenRequest request)
    {
        try
        {
            var deviceId = GenerateDeviceId(request.Token);
            var tokenKey = string.Format(DEVICE_TOKEN_KEY, userId, deviceId);
            var userTokensKey = string.Format(USER_TOKENS_KEY, userId);

            var tokenData = new DeviceTokenData
            {
                Token = request.Token,
                DeviceType = request.DeviceType,
                DeviceName = request.DeviceName,
                OsVersion = request.OsVersion,
                AppVersion = request.AppVersion,
                RegisteredAt = DateTime.UtcNow,
                LastActiveAt = DateTime.UtcNow
            };

            // Save token
            await _cacheService.SetAsync(tokenKey, tokenData, TimeSpan.FromDays(365));

            // Add to user's token list
            var userTokens = await _cacheService.GetAsync<List<DeviceTokenData>>(userTokensKey) ?? new List<DeviceTokenData>();
            userTokens.RemoveAll(t => t.Token == request.Token);
            userTokens.Add(tokenData);
            await _cacheService.SetAsync(userTokensKey, userTokens, TimeSpan.FromDays(365));

            _logger.LogInformation("Device token registered for user {UserId}", userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering device token for user {UserId}", userId);
            return false;
        }
    }

    /// <inheritdoc />
    public async Task<bool> UnregisterDeviceTokenAsync(string userId, string deviceToken)
    {
        try
        {
            var deviceId = GenerateDeviceId(deviceToken);
            var tokenKey = string.Format(DEVICE_TOKEN_KEY, userId, deviceId);
            var userTokensKey = string.Format(USER_TOKENS_KEY, userId);

            await _cacheService.RemoveAsync(tokenKey);

            var userTokens = await _cacheService.GetAsync<List<DeviceTokenData>>(userTokensKey);
            if (userTokens != null)
            {
                userTokens.RemoveAll(t => t.Token == deviceToken);
                await _cacheService.SetAsync(userTokensKey, userTokens, TimeSpan.FromDays(365));
            }

            _logger.LogInformation("Device token unregistered for user {UserId}", userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unregistering device token for user {UserId}", userId);
            return false;
        }
    }

    /// <inheritdoc />
    public async Task<bool> SubscribeToTopicAsync(string userId, string topic)
    {
        try
        {
            var topicKey = string.Format(TOPIC_SUBSCRIBERS_KEY, topic);
            var subscribers = await _cacheService.GetAsync<HashSet<string>>(topicKey) ?? new HashSet<string>();
            subscribers.Add(userId);
            await _cacheService.SetAsync(topicKey, subscribers, TimeSpan.FromDays(365));

            // Also subscribe device tokens to Firebase topic
            var tokens = await GetUserDeviceTokensAsync(userId);
            if (tokens != null && _settings.Provider.ToLower() == "firebase")
            {
                foreach (var token in tokens)
                {
                    await SubscribeTokenToFirebaseTopicAsync(token.Token, topic);
                }
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error subscribing user {UserId} to topic {Topic}", userId, topic);
            return false;
        }
    }

    /// <inheritdoc />
    public async Task<bool> UnsubscribeFromTopicAsync(string userId, string topic)
    {
        try
        {
            var topicKey = string.Format(TOPIC_SUBSCRIBERS_KEY, topic);
            var subscribers = await _cacheService.GetAsync<HashSet<string>>(topicKey);
            if (subscribers != null)
            {
                subscribers.Remove(userId);
                await _cacheService.SetAsync(topicKey, subscribers, TimeSpan.FromDays(365));
            }

            var tokens = await GetUserDeviceTokensAsync(userId);
            if (tokens != null && _settings.Provider.ToLower() == "firebase")
            {
                foreach (var token in tokens)
                {
                    await UnsubscribeTokenFromFirebaseTopicAsync(token.Token, topic);
                }
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unsubscribing user {UserId} from topic {Topic}", userId, topic);
            return false;
        }
    }

    /// <inheritdoc />
    public async Task<List<NotificationRecord>> GetUserNotificationsAsync(string userId, int page = 1, int pageSize = 20)
    {
        var key = string.Format(NOTIFICATIONS_KEY, userId);
        var notifications = await _cacheService.GetAsync<List<NotificationRecord>>(key) ?? new List<NotificationRecord>();
        return notifications
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();
    }

    /// <inheritdoc />
    public async Task<bool> MarkAsReadAsync(string userId, string notificationId)
    {
        var key = string.Format(NOTIFICATIONS_KEY, userId);
        var notifications = await _cacheService.GetAsync<List<NotificationRecord>>(key);
        if (notifications == null) return false;

        var notification = notifications.FirstOrDefault(n => n.Id == notificationId);
        if (notification == null) return false;

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await _cacheService.SetAsync(key, notifications, TimeSpan.FromDays(_settings.HistoryRetentionDays));

        // Update unread count
        var unreadKey = string.Format(UNREAD_COUNT_KEY, userId);
        var count = await _cacheService.GetAsync<int>(unreadKey);
        if (count > 0)
        {
            await _cacheService.SetAsync(unreadKey, count - 1, TimeSpan.FromDays(_settings.HistoryRetentionDays));
        }

        return true;
    }

    /// <inheritdoc />
    public async Task<bool> MarkAllAsReadAsync(string userId)
    {
        var key = string.Format(NOTIFICATIONS_KEY, userId);
        var notifications = await _cacheService.GetAsync<List<NotificationRecord>>(key);
        if (notifications == null) return false;

        foreach (var n in notifications.Where(n => !n.IsRead))
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
        }
        await _cacheService.SetAsync(key, notifications, TimeSpan.FromDays(_settings.HistoryRetentionDays));

        var unreadKey = string.Format(UNREAD_COUNT_KEY, userId);
        await _cacheService.SetAsync(unreadKey, 0, TimeSpan.FromDays(_settings.HistoryRetentionDays));

        return true;
    }

    /// <inheritdoc />
    public async Task<bool> DeleteNotificationAsync(string userId, string notificationId)
    {
        var key = string.Format(NOTIFICATIONS_KEY, userId);
        var notifications = await _cacheService.GetAsync<List<NotificationRecord>>(key);
        if (notifications == null) return false;

        var removed = notifications.RemoveAll(n => n.Id == notificationId) > 0;
        if (removed)
        {
            await _cacheService.SetAsync(key, notifications, TimeSpan.FromDays(_settings.HistoryRetentionDays));
        }
        return removed;
    }

    /// <inheritdoc />
    public async Task<int> GetUnreadCountAsync(string userId)
    {
        var unreadKey = string.Format(UNREAD_COUNT_KEY, userId);
        return await _cacheService.GetAsync<int>(unreadKey);
    }

    #region Firebase Implementation

    private async Task<PushResult> SendViaFirebaseAsync(string deviceToken, PushNotificationRequest request)
    {
        var url = "https://fcm.googleapis.com/fcm/send";

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("key", $"={_settings.FirebaseServerKey}");
        _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Content-Type", "application/json");

        var payload = new
        {
            to = deviceToken,
            notification = new
            {
                title = request.Title,
                body = request.Body,
                image = request.ImageUrl,
                sound = request.Sound ?? "default",
                click_action = request.ClickAction,
                android_channel_id = request.ChannelId
            },
            data = request.Data,
            priority = request.Priority == NotificationPriority.High || request.Priority == NotificationPriority.Critical
                ? "high"
                : "normal",
            content_available = request.Silent,
            time_to_live = request.ExpiresAt.HasValue
                ? (int)(request.ExpiresAt.Value - DateTime.UtcNow).TotalSeconds
                : 86400 // 24 hours default
        };

        var response = await _httpClient.PostAsJsonAsync(url, payload);
        var responseContent = await response.Content.ReadAsStringAsync();

        if (response.IsSuccessStatusCode)
        {
            var result = JsonSerializer.Deserialize<FirebaseResponse>(responseContent);
            if (result?.Success > 0)
            {
                return PushResult.SuccessResult(result?.MessageId?.ToString() ?? Guid.NewGuid().ToString());
            }
            return PushResult.FailureResult(
                result?.Results?.FirstOrDefault()?.Error ?? "Firebase send failed",
                "فشل في إرسال الإشعار عبر Firebase",
                result?.Results?.FirstOrDefault()?.Error
            );
        }

        return PushResult.FailureResult(
            $"Firebase HTTP error: {response.StatusCode}",
            "خطأ في الاتصال بخدمة Firebase",
            "HTTP_ERROR"
        );
    }

    private async Task<PushResult> SendToFirebaseTopicAsync(string topic, PushNotificationRequest request)
    {
        var url = "https://fcm.googleapis.com/fcm/send";

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("key", $"={_settings.FirebaseServerKey}");

        var payload = new
        {
            to = $"/topics/{topic}",
            notification = new
            {
                title = request.Title,
                body = request.Body,
                image = request.ImageUrl,
                sound = request.Sound ?? "default"
            },
            data = request.Data
        };

        var response = await _httpClient.PostAsJsonAsync(url, payload);
        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<FirebaseResponse>(content);
            return PushResult.SuccessResult(result?.MessageId?.ToString() ?? Guid.NewGuid().ToString());
        }

        return PushResult.FailureResult(
            "Firebase topic send failed",
            "فشل في إرسال إشعار الموضوع",
            "TOPIC_ERROR"
        );
    }

    private async Task SubscribeTokenToFirebaseTopicAsync(string token, string topic)
    {
        var url = $"https://iid.googleapis.com/iid/v1/{token}/rel/topics/{topic}";
        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("key", $"={_settings.FirebaseServerKey}");
        await _httpClient.PostAsync(url, null);
    }

    private async Task UnsubscribeTokenFromFirebaseTopicAsync(string token, string topic)
    {
        var url = $"https://iid.googleapis.com/iid/v1:batchRemove";
        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("key", $"={_settings.FirebaseServerKey}");
        var payload = new { to = $"/topics/{topic}", registration_tokens = new[] { token } };
        await _httpClient.PostAsJsonAsync(url, payload);
    }

    #endregion

    #region OneSignal Implementation

    private async Task<PushResult> SendViaOneSignalAsync(string playerId, PushNotificationRequest request)
    {
        var url = "https://onesignal.com/api/v1/notifications";

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Basic", _settings.OneSignalRestApiKey);

        var payload = new
        {
            app_id = _settings.OneSignalAppId,
            include_player_ids = new[] { playerId },
            headings = new { ar = request.Title, en = request.TitleEn ?? request.Title },
            contents = new { ar = request.Body, en = request.BodyEn ?? request.Body },
            big_picture = request.ImageUrl,
            data = request.Data,
            priority = request.Priority >= NotificationPriority.High ? 10 : 5,
            ios_sound = request.Sound,
            android_sound = request.Sound,
            android_channel_id = request.ChannelId,
            content_available = request.Silent ? 1 : 0
        };

        var response = await _httpClient.PostAsJsonAsync(url, payload);
        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<OneSignalResponse>(content);
            return PushResult.SuccessResult(result?.Id ?? Guid.NewGuid().ToString());
        }

        return PushResult.FailureResult(
            "OneSignal send failed",
            "فشل في إرسال الإشعار عبر OneSignal",
            "ONESIGNAL_ERROR"
        );
    }

    private async Task<PushResult> SendToOneSignalSegmentAsync(string segment, PushNotificationRequest request)
    {
        var url = "https://onesignal.com/api/v1/notifications";

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Basic", _settings.OneSignalRestApiKey);

        var payload = new
        {
            app_id = _settings.OneSignalAppId,
            included_segments = new[] { segment },
            headings = new { ar = request.Title, en = request.TitleEn ?? request.Title },
            contents = new { ar = request.Body, en = request.BodyEn ?? request.Body },
            data = request.Data
        };

        var response = await _httpClient.PostAsJsonAsync(url, payload);
        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<OneSignalResponse>(content);
            return PushResult.SuccessResult(result?.Id ?? Guid.NewGuid().ToString());
        }

        return PushResult.FailureResult(
            "OneSignal segment send failed",
            "فشل في إرسال إشعار الشريحة",
            "SEGMENT_ERROR"
        );
    }

    #endregion

    #region Helper Methods

    private async Task<List<DeviceTokenData>?> GetUserDeviceTokensAsync(string userId)
    {
        var userTokensKey = string.Format(USER_TOKENS_KEY, userId);
        return await _cacheService.GetAsync<List<DeviceTokenData>>(userTokensKey);
    }

    private async Task SaveNotificationAsync(string userId, PushNotificationRequest request)
    {
        var key = string.Format(NOTIFICATIONS_KEY, userId);
        var notifications = await _cacheService.GetAsync<List<NotificationRecord>>(key) ?? new List<NotificationRecord>();

        var record = new NotificationRecord
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Title = request.Title,
            Body = request.Body,
            Type = request.Type,
            Priority = request.Priority,
            Data = request.Data,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = request.ImageUrl,
            ActionUrl = request.ClickAction
        };

        notifications.Insert(0, record);

        // Keep only recent notifications
        var maxRecords = 100;
        if (notifications.Count > maxRecords)
        {
            notifications = notifications.Take(maxRecords).ToList();
        }

        await _cacheService.SetAsync(key, notifications, TimeSpan.FromDays(_settings.HistoryRetentionDays));

        // Update unread count
        var unreadKey = string.Format(UNREAD_COUNT_KEY, userId);
        var count = await _cacheService.GetAsync<int>(unreadKey);
        await _cacheService.SetAsync(unreadKey, count + 1, TimeSpan.FromDays(_settings.HistoryRetentionDays));
    }

    private static string GenerateDeviceId(string token)
    {
        using var sha = System.Security.Cryptography.SHA256.Create();
        var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hash).Substring(0, 16);
    }

    #endregion
}

#region Internal Models

internal class DeviceTokenData
{
    public string Token { get; set; } = string.Empty;
    public DeviceType DeviceType { get; set; }
    public string? DeviceName { get; set; }
    public string? OsVersion { get; set; }
    public string? AppVersion { get; set; }
    public DateTime RegisteredAt { get; set; }
    public DateTime LastActiveAt { get; set; }
}

internal class FirebaseResponse
{
    public int Success { get; set; }
    public int Failure { get; set; }
    public long? MessageId { get; set; }
    public List<FirebaseResult>? Results { get; set; }
}

internal class FirebaseResult
{
    public string? MessageId { get; set; }
    public string? Error { get; set; }
}

internal class OneSignalResponse
{
    public string? Id { get; set; }
    public int Recipients { get; set; }
    public List<string>? Errors { get; set; }
}

#endregion
