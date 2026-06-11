using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Data.SqlClient;
using Masarat.Core.Metrics;
using System.Diagnostics;

namespace Masarat.Core.Database
{
    /// <summary>
    /// Database configuration with read replica support
    /// </summary>
    public class DatabaseConfiguration
    {
        public string PrimaryConnectionString { get; set; } = string.Empty;
        public List<string> ReadReplicaConnectionStrings { get; set; } = new();
        public bool EnableReadReplicas { get; set; }
        public int HealthCheckIntervalSeconds { get; set; } = 30;
        public int ConnectionTimeout { get; set; } = 30;
        public int MaxPoolSize { get; set; } = 100;
        public int MinPoolSize { get; set; } = 5;
    }

    /// <summary>
    /// Background service for monitoring database failover events
    /// </summary>
    public class DatabaseFailoverMonitor : BackgroundService
    {
        private readonly DatabaseConnectionManager _connectionManager;
        private readonly ILogger<DatabaseFailoverMonitor> _logger;
        private Dictionary<string, bool> _previousHealthStatus;

        public DatabaseFailoverMonitor(
            DatabaseConnectionManager connectionManager,
            ILogger<DatabaseFailoverMonitor> logger)
        {
            _connectionManager = connectionManager;
            _logger = logger;
            _previousHealthStatus = new Dictionary<string, bool>();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Database failover monitor started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await MonitorHealthStatusAsync();
                    await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // Expected when stopping
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in database failover monitor");
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                }
            }

            _logger.LogInformation("Database failover monitor stopped");
        }

        private async Task MonitorHealthStatusAsync()
        {
            var currentHealth = _connectionManager.GetServerHealthStatus();

            foreach (var (server, isHealthy) in currentHealth)
            {
                if (_previousHealthStatus.TryGetValue(server, out var previousHealth))
                {
                    // Detect failover events
                    if (previousHealth && !isHealthy)
                    {
                        _logger.LogWarning(
                            "⚠️  DATABASE FAILOVER DETECTED: {Server} went from HEALTHY to UNHEALTHY",
                            server);

                        DatabaseMetrics.RecordConnectionError(server, "failover");

                        // Trigger alert or notification here
                        await OnDatabaseFailoverAsync(server, "healthy", "unhealthy");
                    }
                    else if (!previousHealth && isHealthy)
                    {
                        _logger.LogInformation(
                            "✅ DATABASE RECOVERED: {Server} is now HEALTHY",
                            server);

                        // Trigger recovery notification
                        await OnDatabaseRecoveryAsync(server);
                    }
                }

                _previousHealthStatus[server] = isHealthy;
            }
        }

        private async Task OnDatabaseFailoverAsync(string server, string fromState, string toState)
        {
            _logger.LogCritical(
                "CRITICAL: Database failover on {Server} - State changed from {From} to {To}",
                server, fromState, toState);

            // TODO: Integrate with alerting system (email, Slack, PagerDuty, etc.)
            // Example: await _alertService.SendCriticalAlert($"Database failover: {server}");

            await Task.CompletedTask;
        }

        private async Task OnDatabaseRecoveryAsync(string server)
        {
            _logger.LogInformation(
                "INFO: Database recovered: {Server} is back online",
                server);

            // TODO: Send recovery notification
            // Example: await _alertService.SendInfoAlert($"Database recovered: {server}");

            await Task.CompletedTask;
        }
    }

    /// <summary>
    /// Extension methods for database failover configuration
    /// </summary>
    public static class DatabaseFailoverExtensions
    {
        /// <summary>
        /// Add database failover monitoring to the application
        /// </summary>
        public static IServiceCollection AddDatabaseFailoverMonitoring(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // Read database configuration
            var dbConfig = configuration.GetSection("Database").Get<DatabaseConfiguration>()
                ?? new DatabaseConfiguration();

            var primaryConnection = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection not found");

            // Get read replica connections
            var readReplicas = new List<string>();
            if (dbConfig.EnableReadReplicas)
            {
                var replicaConnection = configuration.GetConnectionString("ReadReplicaConnection");
                if (!string.IsNullOrEmpty(replicaConnection))
                {
                    readReplicas.Add(replicaConnection);
                }

                // Support multiple replicas (ReadReplicaConnection1, ReadReplicaConnection2, etc.)
                for (int i = 1; i <= 5; i++)
                {
                    var replicaKey = $"ReadReplicaConnection{i}";
                    var replica = configuration.GetConnectionString(replicaKey);
                    if (!string.IsNullOrEmpty(replica))
                    {
                        readReplicas.Add(replica);
                    }
                }
            }

            // Register connection manager
            services.AddSingleton(sp =>
            {
                var logger = sp.GetRequiredService<ILogger<DatabaseConnectionManager>>();
                return new DatabaseConnectionManager(
                    primaryConnection,
                    readReplicas,
                    logger);
            });

            // Register failover monitor background service
            services.AddHostedService<DatabaseFailoverMonitor>();

            return services;
        }

        /// <summary>
        /// Configure connection string with resilience settings
        /// </summary>
        public static string WithResilienceSettings(
            this string connectionString,
            int? maxPoolSize = null,
            int? minPoolSize = null,
            int? connectionTimeout = null,
            int? connectionLifetime = null)
        {
            var builder = new SqlConnectionStringBuilder(connectionString);

            // Apply resilience settings
            builder.MaxPoolSize = maxPoolSize ?? 100;
            builder.MinPoolSize = minPoolSize ?? 5;
            builder.ConnectTimeout = connectionTimeout ?? 30;
            
            if (connectionLifetime.HasValue)
            {
                builder.LoadBalanceTimeout = connectionLifetime.Value;
            }

            // Enable connection pooling
            builder.Pooling = true;

            // Enable MultipleActiveResultSets for better concurrency
            builder.MultipleActiveResultSets = true;

            // Enable encryption
            builder.Encrypt = true;
            builder.TrustServerCertificate = false;

            return builder.ConnectionString;
        }
    }

    /// <summary>
    /// Sample configuration for appsettings.json
    /// </summary>
    public class DatabaseConfigurationExample
    {
        public const string SampleConfiguration = @"
{
  ""ConnectionStrings"": {
    ""DefaultConnection"": ""Server=primary-server;Database=MasaratDB;User Id=sa;Password=***;Encrypt=True;TrustServerCertificate=False;"",
    ""ReadReplicaConnection"": ""Server=replica-server;Database=MasaratDB;User Id=sa;Password=***;Encrypt=True;TrustServerCertificate=False;ApplicationIntent=ReadOnly;"",
    ""ReadReplicaConnection1"": ""Server=replica-server-1;Database=MasaratDB;User Id=sa;Password=***;Encrypt=True;TrustServerCertificate=False;ApplicationIntent=ReadOnly;"",
    ""ReadReplicaConnection2"": ""Server=replica-server-2;Database=MasaratDB;User Id=sa;Password=***;Encrypt=True;TrustServerCertificate=False;ApplicationIntent=ReadOnly;""
  },
  ""Database"": {
    ""EnableReadReplicas"": true,
    ""HealthCheckIntervalSeconds"": 30,
    ""ConnectionTimeout"": 30,
    ""MaxPoolSize"": 100,
    ""MinPoolSize"": 5
  }
}";
    }
}
