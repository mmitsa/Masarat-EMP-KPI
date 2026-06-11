using Microsoft.Extensions.DependencyInjection;
using Polly;
using Polly.Extensions.Http;

namespace Masarat.Core.Resilience;

/// <summary>
/// امتدادات المتانة لطلبات HTTP بين الخدمات
/// Circuit Breaker + Retry policies for inter-service HTTP communication
/// </summary>
public static class HttpClientResilienceExtensions
{
    /// <summary>
    /// إضافة سياسات إعادة المحاولة والقاطع الكهربائي لعميل HTTP
    /// Adds retry (3 attempts, exponential backoff) and circuit breaker (opens after 5 failures, 30s break)
    /// </summary>
    public static IHttpClientBuilder AddMasaratResilience(this IHttpClientBuilder builder)
    {
        return builder
            .AddPolicyHandler(GetRetryPolicy())
            .AddPolicyHandler(GetCircuitBreakerPolicy());
    }

    /// <summary>
    /// سياسة إعادة المحاولة - 3 محاولات مع تأخير تصاعدي أسي
    /// Retry policy: 3 retries at 2s, 4s, 8s delays. Handles transient errors and 429 Too Many Requests.
    /// </summary>
    private static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
    {
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .OrResult(msg => msg.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: retryAttempt =>
                    TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                onRetry: (outcome, timespan, retryAttempt, context) =>
                {
                    // Logging is handled by the caller's ILogger when needed;
                    // structured log context is available via context dictionary.
                });
    }

    /// <summary>
    /// سياسة القاطع الكهربائي - يفتح بعد 5 أخطاء متتالية ويبقى مفتوحاً 30 ثانية
    /// Circuit breaker: opens after 5 consecutive failures, breaks for 30 seconds.
    /// </summary>
    private static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy()
    {
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: 5,
                durationOfBreak: TimeSpan.FromSeconds(30),
                onBreak: (outcome, breakDelay) =>
                {
                    // Circuit opened - downstream service is unavailable
                },
                onReset: () =>
                {
                    // Circuit closed - downstream service has recovered
                },
                onHalfOpen: () =>
                {
                    // Circuit half-open - sending one probe request to test recovery
                });
    }
}
