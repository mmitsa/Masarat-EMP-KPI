using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Polly;

namespace Masarat.Core.Resilience
{
    /// <summary>
    /// Extension methods for configuring resilient HTTP clients
    /// </summary>
    public static class ResilientHttpClientExtensions
    {
        /// <summary>
        /// Adds all resilient HTTP clients for service-to-service communication
        /// </summary>
        public static IServiceCollection AddResilientHttpClients(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var serviceUrls = configuration.GetSection("Services").Get<Dictionary<string, ServiceConfig>>();

            if (serviceUrls == null || !serviceUrls.Any())
            {
                throw new InvalidOperationException("Services configuration section is missing or empty");
            }

            foreach (var service in serviceUrls)
            {
                services.AddResilientHttpClient(service.Key, service.Value.Url);
            }

            return services;
        }

        /// <summary>
        /// Adds a single resilient HTTP client with all resilience patterns
        /// </summary>
        public static IHttpClientBuilder AddResilientHttpClient(
            this IServiceCollection services,
            string clientName,
            string baseUrl)
        {
            return services
                .AddHttpClient(clientName, client =>
                {
                    client.BaseAddress = new Uri(baseUrl);
                    client.Timeout = TimeSpan.FromSeconds(60); // Overall timeout
                    client.DefaultRequestHeaders.Add("User-Agent", "Masarat-Service/1.0");
                })
                .AddMasaratResilience();
        }

        /// <summary>
        /// Adds a resilient HTTP client for critical services with stricter policies
        /// </summary>
        public static IHttpClientBuilder AddCriticalHttpClient(
            this IServiceCollection services,
            string clientName,
            string baseUrl)
        {
            return services
                .AddHttpClient(clientName, client =>
                {
                    client.BaseAddress = new Uri(baseUrl);
                    client.Timeout = TimeSpan.FromSeconds(30); // Shorter timeout for critical
                })
                .AddMasaratResilience();
        }
    }

    public class ServiceConfig
    {
        public string Url { get; set; } = string.Empty;
        public bool IsCritical { get; set; }
        public int TimeoutSeconds { get; set; } = 30;
    }
}
