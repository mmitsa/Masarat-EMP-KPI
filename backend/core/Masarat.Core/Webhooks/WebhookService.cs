using Microsoft.Extensions.Logging;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Masarat.Core.Webhooks;

/// <summary>
/// خدمة إدارة وإرسال Webhooks
/// </summary>
public interface IWebhookService
{
    Task<WebhookDeliveryResult> SendAsync(string eventType, object payload, string? tenantId = null);
    Task<WebhookSubscription> SubscribeAsync(WebhookSubscription subscription);
    Task UnsubscribeAsync(Guid subscriptionId);
    Task<IEnumerable<WebhookSubscription>> GetSubscriptionsAsync(string? tenantId = null);
    Task<IEnumerable<WebhookDeliveryLog>> GetDeliveryLogsAsync(Guid subscriptionId, int take = 50);
    Task RetryFailedDeliveriesAsync(Guid subscriptionId);
}

public class WebhookService : IWebhookService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WebhookService> _logger;
    private readonly IWebhookRepository _repository;
    private readonly WebhookOptions _options;

    public WebhookService(
        HttpClient httpClient,
        ILogger<WebhookService> logger,
        IWebhookRepository repository,
        WebhookOptions options)
    {
        _httpClient = httpClient;
        _logger = logger;
        _repository = repository;
        _options = options;
    }

    public async Task<WebhookDeliveryResult> SendAsync(string eventType, object payload, string? tenantId = null)
    {
        var subscriptions = await _repository.GetActiveSubscriptionsAsync(eventType, tenantId);
        var results = new List<WebhookDeliveryAttempt>();

        foreach (var subscription in subscriptions)
        {
            var attempt = await DeliverWebhookAsync(subscription, eventType, payload);
            results.Add(attempt);

            // Log delivery
            await _repository.LogDeliveryAsync(new WebhookDeliveryLog
            {
                SubscriptionId = subscription.Id,
                EventType = eventType,
                Payload = JsonSerializer.Serialize(payload),
                StatusCode = attempt.StatusCode,
                ResponseBody = attempt.ResponseBody,
                IsSuccess = attempt.IsSuccess,
                AttemptNumber = 1,
                DeliveredAt = DateTime.UtcNow,
                DurationMs = attempt.DurationMs
            });
        }

        return new WebhookDeliveryResult
        {
            EventType = eventType,
            TotalSubscriptions = subscriptions.Count(),
            SuccessfulDeliveries = results.Count(r => r.IsSuccess),
            FailedDeliveries = results.Count(r => !r.IsSuccess),
            Attempts = results
        };
    }

    public async Task<WebhookSubscription> SubscribeAsync(WebhookSubscription subscription)
    {
        subscription.Id = Guid.NewGuid();
        subscription.Secret = GenerateSecret();
        subscription.CreatedAt = DateTime.UtcNow;
        subscription.IsActive = true;

        // Verify endpoint if required
        if (_options.VerifyEndpoints)
        {
            var verified = await VerifyEndpointAsync(subscription);
            if (!verified)
            {
                throw new InvalidOperationException("Failed to verify webhook endpoint");
            }
        }

        await _repository.CreateSubscriptionAsync(subscription);

        _logger.LogInformation(
            "Webhook subscription created: {SubscriptionId} for {EventTypes} to {Url}",
            subscription.Id,
            string.Join(", ", subscription.EventTypes),
            subscription.Url);

        return subscription;
    }

    public async Task UnsubscribeAsync(Guid subscriptionId)
    {
        await _repository.DeleteSubscriptionAsync(subscriptionId);
        _logger.LogInformation("Webhook subscription deleted: {SubscriptionId}", subscriptionId);
    }

    public async Task<IEnumerable<WebhookSubscription>> GetSubscriptionsAsync(string? tenantId = null)
    {
        return await _repository.GetSubscriptionsAsync(tenantId);
    }

    public async Task<IEnumerable<WebhookDeliveryLog>> GetDeliveryLogsAsync(Guid subscriptionId, int take = 50)
    {
        return await _repository.GetDeliveryLogsAsync(subscriptionId, take);
    }

    public async Task RetryFailedDeliveriesAsync(Guid subscriptionId)
    {
        var failedDeliveries = await _repository.GetFailedDeliveriesAsync(subscriptionId);
        var subscription = await _repository.GetSubscriptionAsync(subscriptionId);

        if (subscription == null)
        {
            throw new InvalidOperationException("Subscription not found");
        }

        foreach (var delivery in failedDeliveries)
        {
            if (delivery.AttemptNumber >= _options.MaxRetryAttempts)
            {
                continue;
            }

            var payload = JsonSerializer.Deserialize<object>(delivery.Payload);
            var attempt = await DeliverWebhookAsync(subscription, delivery.EventType, payload!);

            delivery.AttemptNumber++;
            delivery.StatusCode = attempt.StatusCode;
            delivery.ResponseBody = attempt.ResponseBody;
            delivery.IsSuccess = attempt.IsSuccess;
            delivery.DeliveredAt = DateTime.UtcNow;
            delivery.DurationMs = attempt.DurationMs;

            await _repository.UpdateDeliveryLogAsync(delivery);
        }
    }

    private async Task<WebhookDeliveryAttempt> DeliverWebhookAsync(
        WebhookSubscription subscription,
        string eventType,
        object payload)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var webhookPayload = new WebhookPayload
            {
                Id = Guid.NewGuid().ToString(),
                EventType = eventType,
                Timestamp = DateTime.UtcNow,
                TenantId = subscription.TenantId,
                Data = payload
            };

            var json = JsonSerializer.Serialize(webhookPayload);
            var signature = GenerateSignature(json, subscription.Secret);

            var request = new HttpRequestMessage(HttpMethod.Post, subscription.Url)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };

            // Add headers
            request.Headers.Add("X-Webhook-Id", webhookPayload.Id);
            request.Headers.Add("X-Webhook-Event", eventType);
            request.Headers.Add("X-Webhook-Signature", signature);
            request.Headers.Add("X-Webhook-Timestamp", webhookPayload.Timestamp.ToString("O"));

            // Add custom headers
            foreach (var header in subscription.CustomHeaders)
            {
                request.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }

            using var cts = new CancellationTokenSource(_options.Timeout);
            var response = await _httpClient.SendAsync(request, cts.Token);

            var responseBody = await response.Content.ReadAsStringAsync();
            var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;

            return new WebhookDeliveryAttempt
            {
                SubscriptionId = subscription.Id,
                IsSuccess = response.IsSuccessStatusCode,
                StatusCode = (int)response.StatusCode,
                ResponseBody = responseBody.Length > 1000 ? responseBody[..1000] : responseBody,
                DurationMs = duration
            };
        }
        catch (TaskCanceledException)
        {
            _logger.LogWarning(
                "Webhook delivery timeout for subscription {SubscriptionId} to {Url}",
                subscription.Id,
                subscription.Url);

            return new WebhookDeliveryAttempt
            {
                SubscriptionId = subscription.Id,
                IsSuccess = false,
                StatusCode = 0,
                ResponseBody = "Request timeout",
                DurationMs = (DateTime.UtcNow - startTime).TotalMilliseconds
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Webhook delivery failed for subscription {SubscriptionId} to {Url}",
                subscription.Id,
                subscription.Url);

            return new WebhookDeliveryAttempt
            {
                SubscriptionId = subscription.Id,
                IsSuccess = false,
                StatusCode = 0,
                ResponseBody = ex.Message,
                DurationMs = (DateTime.UtcNow - startTime).TotalMilliseconds
            };
        }
    }

    private async Task<bool> VerifyEndpointAsync(WebhookSubscription subscription)
    {
        try
        {
            var challenge = Guid.NewGuid().ToString();

            var request = new HttpRequestMessage(HttpMethod.Get,
                $"{subscription.Url}?challenge={challenge}");

            var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            return response.IsSuccessStatusCode && responseBody.Contains(challenge);
        }
        catch
        {
            return false;
        }
    }

    private static string GenerateSecret()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes);
    }

    private static string GenerateSignature(string payload, string secret)
    {
        var secretBytes = Encoding.UTF8.GetBytes(secret);
        var payloadBytes = Encoding.UTF8.GetBytes(payload);

        using var hmac = new HMACSHA256(secretBytes);
        var hash = hmac.ComputeHash(payloadBytes);

        return $"sha256={Convert.ToHexString(hash).ToLower()}";
    }
}

// Models
public class WebhookSubscription
{
    public Guid Id { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Secret { get; set; } = string.Empty;
    public List<string> EventTypes { get; set; } = new();
    public Dictionary<string, string> CustomHeaders { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class WebhookPayload
{
    public string Id { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? TenantId { get; set; }
    public object Data { get; set; } = new();
}

public class WebhookDeliveryResult
{
    public string EventType { get; set; } = string.Empty;
    public int TotalSubscriptions { get; set; }
    public int SuccessfulDeliveries { get; set; }
    public int FailedDeliveries { get; set; }
    public List<WebhookDeliveryAttempt> Attempts { get; set; } = new();
}

public class WebhookDeliveryAttempt
{
    public Guid SubscriptionId { get; set; }
    public bool IsSuccess { get; set; }
    public int StatusCode { get; set; }
    public string? ResponseBody { get; set; }
    public double DurationMs { get; set; }
}

public class WebhookDeliveryLog
{
    public Guid Id { get; set; }
    public Guid SubscriptionId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public string? ResponseBody { get; set; }
    public bool IsSuccess { get; set; }
    public int AttemptNumber { get; set; }
    public DateTime DeliveredAt { get; set; }
    public double DurationMs { get; set; }
}

public class WebhookOptions
{
    public TimeSpan Timeout { get; set; } = TimeSpan.FromSeconds(30);
    public int MaxRetryAttempts { get; set; } = 3;
    public bool VerifyEndpoints { get; set; } = true;
}

// Repository interface
public interface IWebhookRepository
{
    Task<IEnumerable<WebhookSubscription>> GetActiveSubscriptionsAsync(string eventType, string? tenantId);
    Task<IEnumerable<WebhookSubscription>> GetSubscriptionsAsync(string? tenantId);
    Task<WebhookSubscription?> GetSubscriptionAsync(Guid id);
    Task CreateSubscriptionAsync(WebhookSubscription subscription);
    Task DeleteSubscriptionAsync(Guid id);
    Task LogDeliveryAsync(WebhookDeliveryLog log);
    Task UpdateDeliveryLogAsync(WebhookDeliveryLog log);
    Task<IEnumerable<WebhookDeliveryLog>> GetDeliveryLogsAsync(Guid subscriptionId, int take);
    Task<IEnumerable<WebhookDeliveryLog>> GetFailedDeliveriesAsync(Guid subscriptionId);
}

// Event types
public static class WebhookEvents
{
    // HR Events
    public const string EmployeeCreated = "employee.created";
    public const string EmployeeUpdated = "employee.updated";
    public const string EmployeeDeleted = "employee.deleted";
    public const string LeaveRequested = "leave.requested";
    public const string LeaveApproved = "leave.approved";

    // Warehouse Events
    public const string ItemCreated = "item.created";
    public const string StockUpdated = "stock.updated";
    public const string LowStockAlert = "stock.low_alert";

    // Archiving Events
    public const string DocumentUploaded = "document.uploaded";
    public const string DocumentApproved = "document.approved";
    public const string AccessRequested = "access.requested";

    // Finance Events
    public const string PaymentReceived = "payment.received";
    public const string InvoiceCreated = "invoice.created";

    // SaaS Events
    public const string TenantCreated = "tenant.created";
    public const string SubscriptionChanged = "subscription.changed";
}
