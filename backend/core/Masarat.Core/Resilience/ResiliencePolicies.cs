using Microsoft.Extensions.Logging;
using Polly;
using Polly.CircuitBreaker;
using Polly.Extensions.Http;
using Polly.Timeout;

namespace Masarat.Core.Resilience
{
    /// <summary>
    /// Resilience policies for service-to-service communication
    /// Implements Circuit Breaker, Retry, Timeout, and Bulkhead patterns
    /// </summary>
    public static class ResiliencePolicies
    {
        /// <summary>
        /// Circuit Breaker Policy
        /// Opens after 5 consecutive failures, stays open for 30 seconds
        /// </summary>
        public static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy(ILogger logger)
        {
            return HttpPolicyExtensions
                .HandleTransientHttpError()
                .Or<TimeoutRejectedException>()
                .CircuitBreakerAsync(
                    handledEventsAllowedBeforeBreaking: 5,
                    durationOfBreak: TimeSpan.FromSeconds(30),
                    onBreak: (outcome, duration) =>
                    {
                        logger.LogWarning(
                            "Circuit breaker OPENED for {Duration}s. Reason: {Reason}",
                            duration.TotalSeconds,
                            outcome.Exception?.Message ?? outcome.Result?.StatusCode.ToString()
                        );
                    },
                    onReset: () =>
                    {
                        logger.LogInformation("Circuit breaker RESET - service recovered");
                    },
                    onHalfOpen: () =>
                    {
                        logger.LogInformation("Circuit breaker HALF-OPEN - testing service health");
                    }
                );
        }

        /// <summary>
        /// Retry Policy with Exponential Backoff
        /// Retries 3 times: 2s, 4s, 8s delays
        /// </summary>
        public static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy(ILogger logger)
        {
            return HttpPolicyExtensions
                .HandleTransientHttpError()
                .Or<TimeoutRejectedException>()
                .WaitAndRetryAsync(
                    retryCount: 3,
                    sleepDurationProvider: retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                    onRetry: (outcome, timespan, retryCount, context) =>
                    {
                        logger.LogWarning(
                            "Retry {RetryCount}/3 after {Delay}s. Endpoint: {Endpoint}",
                            retryCount,
                            timespan.TotalSeconds,
                            context.GetValueOrDefault("endpoint") ?? "unknown"
                        );
                    }
                );
        }

        /// <summary>
        /// Timeout Policy
        /// Cancels requests after 30 seconds
        /// </summary>
        public static IAsyncPolicy<HttpResponseMessage> GetTimeoutPolicy(ILogger logger, int timeoutSeconds = 30)
        {
            return Policy.TimeoutAsync<HttpResponseMessage>(
                timeout: TimeSpan.FromSeconds(timeoutSeconds),
                timeoutStrategy: TimeoutStrategy.Pessimistic,
                onTimeoutAsync: (context, timespan, task) =>
                {
                    logger.LogWarning(
                        "Request TIMEOUT after {Timeout}s. Endpoint: {Endpoint}",
                        timespan.TotalSeconds,
                        context.GetValueOrDefault("endpoint") ?? "unknown"
                    );
                    return Task.CompletedTask;
                }
            );
        }

        /// <summary>
        /// Combined Policy: Timeout → Retry → Circuit Breaker
        /// Wraps all resilience patterns in correct order
        /// </summary>
        public static IAsyncPolicy<HttpResponseMessage> GetCombinedPolicy(ILogger logger)
        {
            return Policy.WrapAsync(
                GetCircuitBreakerPolicy(logger),
                GetRetryPolicy(logger),
                GetTimeoutPolicy(logger)
            );
        }

        /// <summary>
        /// Bulkhead Isolation Policy
        /// Limits concurrent executions to prevent resource exhaustion
        /// Max 20 concurrent, 40 queued
        /// </summary>
        public static IAsyncPolicy GetBulkheadPolicy(ILogger logger, int maxParallelization = 20, int maxQueuingActions = 40)
        {
            return Policy.BulkheadAsync(
                maxParallelization: maxParallelization,
                maxQueuingActions: maxQueuingActions,
                onBulkheadRejectedAsync: context =>
                {
                    logger.LogWarning(
                        "Bulkhead REJECTED - too many concurrent requests. Endpoint: {Endpoint}",
                        context.GetValueOrDefault("endpoint") ?? "unknown"
                    );
                    return Task.CompletedTask;
                }
            );
        }

        /// <summary>
        /// Fallback Policy
        /// Returns cached or default response when service fails
        /// </summary>
        public static IAsyncPolicy<HttpResponseMessage> GetFallbackPolicy(
            ILogger logger,
            HttpResponseMessage fallbackResponse)
        {
            return Policy<HttpResponseMessage>
                .Handle<HttpRequestException>()
                .Or<TimeoutRejectedException>()
                .Or<BrokenCircuitException>()
                .FallbackAsync(
                    fallbackValue: fallbackResponse,
                    onFallbackAsync: (outcome, context) =>
                    {
                        logger.LogWarning(
                            "FALLBACK triggered. Returning cached/default response. Reason: {Reason}",
                            outcome.Exception?.Message ?? "Circuit breaker open"
                        );
                        return Task.CompletedTask;
                    }
                );
        }

        /// <summary>
        /// Database Retry Policy
        /// For transient database errors (connection, timeout, deadlock)
        /// </summary>
        public static IAsyncPolicy GetDatabaseRetryPolicy(ILogger logger)
        {
            return Policy
                .Handle<Exception>(ex =>
                {
                    // SQL transient errors: connection, timeout, deadlock
                    var message = ex.Message.ToLower();
                    return message.Contains("timeout") ||
                           message.Contains("deadlock") ||
                           message.Contains("transport-level") ||
                           message.Contains("connection");
                })
                .WaitAndRetryAsync(
                    retryCount: 3,
                    sleepDurationProvider: retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                    onRetry: (exception, timespan, retryCount, context) =>
                    {
                        logger.LogWarning(
                            exception,
                            "Database retry {RetryCount}/3 after {Delay}s",
                            retryCount,
                            timespan.TotalSeconds
                        );
                    }
                );
        }
    }
}
