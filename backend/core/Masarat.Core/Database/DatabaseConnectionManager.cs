using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using System.Diagnostics;

namespace Masarat.Core.Database
{
    /// <summary>
    /// Database connection manager with read/write splitting and automatic failover
    /// </summary>
    public class DatabaseConnectionManager : IDisposable
    {
        private readonly string _primaryConnectionString;
        private readonly List<string> _readReplicaConnectionStrings;
        private readonly ILogger<DatabaseConnectionManager> _logger;
        private readonly ConcurrentDictionary<string, ServerHealth> _serverHealth;
        private readonly Timer _healthCheckTimer;
        private int _currentReplicaIndex;
        private bool _primaryIsHealthy = true;

        public DatabaseConnectionManager(
            string primaryConnectionString,
            IEnumerable<string>? readReplicaConnectionStrings,
            ILogger<DatabaseConnectionManager> logger)
        {
            _primaryConnectionString = primaryConnectionString ?? throw new ArgumentNullException(nameof(primaryConnectionString));
            _readReplicaConnectionStrings = readReplicaConnectionStrings?.ToList() ?? new List<string>();
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _serverHealth = new ConcurrentDictionary<string, ServerHealth>();

            // Initialize health status
            _serverHealth[_primaryConnectionString] = new ServerHealth { IsHealthy = true };
            foreach (var replica in _readReplicaConnectionStrings)
            {
                _serverHealth[replica] = new ServerHealth { IsHealthy = true };
            }

            // Start health check timer (every 30 seconds)
            _healthCheckTimer = new Timer(
                async _ => await PerformHealthChecksAsync(),
                null,
                TimeSpan.FromSeconds(5),
                TimeSpan.FromSeconds(30));
        }

        /// <summary>
        /// Get connection string for read operations (uses replicas if available)
        /// </summary>
        public string GetReadConnectionString()
        {
            // If no replicas configured, use primary
            if (_readReplicaConnectionStrings.Count == 0)
            {
                return _primaryConnectionString;
            }

            // Try to get a healthy replica
            var healthyReplicas = _readReplicaConnectionStrings
                .Where(r => _serverHealth.TryGetValue(r, out var health) && health.IsHealthy)
                .ToList();

            if (healthyReplicas.Count == 0)
            {
                _logger.LogWarning("No healthy read replicas available, falling back to primary");
                return _primaryConnectionString;
            }

            // Round-robin through healthy replicas
            var index = Interlocked.Increment(ref _currentReplicaIndex) % healthyReplicas.Count;
            var selectedReplica = healthyReplicas[index];

            _logger.LogDebug("Selected read replica {Index}: {Replica}", index, MaskConnectionString(selectedReplica));
            return selectedReplica;
        }

        /// <summary>
        /// Get connection string for write operations (always uses primary)
        /// </summary>
        public string GetWriteConnectionString()
        {
            if (!_primaryIsHealthy)
            {
                _logger.LogWarning("Primary database is marked unhealthy but will still be used for writes");
            }

            return _primaryConnectionString;
        }

        /// <summary>
        /// Check if primary database is healthy
        /// </summary>
        public bool IsPrimaryHealthy() => _primaryIsHealthy;

        /// <summary>
        /// Get health status for all servers
        /// </summary>
        public Dictionary<string, bool> GetServerHealthStatus()
        {
            return _serverHealth.ToDictionary(
                kvp => MaskConnectionString(kvp.Key),
                kvp => kvp.Value.IsHealthy);
        }

        /// <summary>
        /// Perform health checks on all database servers
        /// </summary>
        private async Task PerformHealthChecksAsync()
        {
            _logger.LogDebug("Starting database health checks");

            // Check primary
            var primaryHealth = await CheckServerHealthAsync(_primaryConnectionString);
            var previousPrimaryHealth = _primaryIsHealthy;
            _primaryIsHealthy = primaryHealth;

            if (previousPrimaryHealth != _primaryIsHealthy)
            {
                var status = _primaryIsHealthy ? "healthy" : "unhealthy";
                _logger.LogWarning("Primary database status changed to: {Status}", status);
            }

            // Check replicas
            foreach (var replica in _readReplicaConnectionStrings)
            {
                var replicaHealth = await CheckServerHealthAsync(replica);
                var previousHealth = _serverHealth.TryGetValue(replica, out var health) && health.IsHealthy;
                _serverHealth[replica] = new ServerHealth { IsHealthy = replicaHealth };

                if (previousHealth != replicaHealth)
                {
                    var status = replicaHealth ? "healthy" : "unhealthy";
                    _logger.LogWarning("Read replica {Replica} status changed to: {Status}",
                        MaskConnectionString(replica), status);
                }
            }

            _logger.LogDebug("Database health checks completed");
        }

        /// <summary>
        /// Check if a specific server is healthy
        /// </summary>
        private async Task<bool> CheckServerHealthAsync(string connectionString)
        {
            try
            {
                using var connection = new SqlConnection(connectionString);
                using var command = connection.CreateCommand();
                command.CommandText = "SELECT 1";
                command.CommandTimeout = 5;

                await connection.OpenAsync();
                var result = await command.ExecuteScalarAsync();

                return result != null && Convert.ToInt32(result) == 1;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed for server: {Server}",
                    MaskConnectionString(connectionString));
                return false;
            }
        }

        /// <summary>
        /// Mask sensitive connection string information for logging
        /// </summary>
        private string MaskConnectionString(string connectionString)
        {
            var builder = new SqlConnectionStringBuilder(connectionString);
            return $"Server={builder.DataSource};Database={builder.InitialCatalog}";
        }

        public void Dispose()
        {
            _healthCheckTimer?.Dispose();
        }

        private class ServerHealth
        {
            public bool IsHealthy { get; set; }
            public DateTime LastChecked { get; set; } = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Extension for DbContext to support read/write splitting
    /// </summary>
    public static class DbContextReadWriteExtensions
    {
        /// <summary>
        /// Configure DbContext with read/write splitting support
        /// </summary>
        public static IServiceCollection AddDbContextWithReadWriteSplitting<TContext>(
            this IServiceCollection services,
            string primaryConnectionString,
            IEnumerable<string>? readReplicaConnectionStrings = null)
            where TContext : DbContext
        {
            // Register connection manager
            services.AddSingleton(sp =>
            {
                var logger = sp.GetRequiredService<ILogger<DatabaseConnectionManager>>();
                return new DatabaseConnectionManager(
                    primaryConnectionString,
                    readReplicaConnectionStrings,
                    logger);
            });

            // Register primary DbContext for writes
            services.AddDbContext<TContext>((sp, options) =>
            {
                var connectionManager = sp.GetRequiredService<DatabaseConnectionManager>();
                options.UseSqlServer(connectionManager.GetWriteConnectionString());
            }, ServiceLifetime.Scoped);

            // Register read-only DbContext factory for reads
            services.AddSingleton<IReadOnlyDbContextFactory<TContext>>(sp =>
            {
                return new ReadOnlyDbContextFactory<TContext>(
                    sp.GetRequiredService<DatabaseConnectionManager>(),
                    sp.GetRequiredService<ILoggerFactory>());
            });

            return services;
        }
    }

    /// <summary>
    /// Factory for creating read-only DbContext instances
    /// </summary>
    public interface IReadOnlyDbContextFactory<TContext> where TContext : DbContext
    {
        TContext CreateReadOnlyContext();
    }

    /// <summary>
    /// Implementation of read-only DbContext factory
    /// </summary>
    public class ReadOnlyDbContextFactory<TContext> : IReadOnlyDbContextFactory<TContext>
        where TContext : DbContext
    {
        private readonly DatabaseConnectionManager _connectionManager;
        private readonly ILoggerFactory _loggerFactory;

        public ReadOnlyDbContextFactory(
            DatabaseConnectionManager connectionManager,
            ILoggerFactory loggerFactory)
        {
            _connectionManager = connectionManager;
            _loggerFactory = loggerFactory;
        }

        public TContext CreateReadOnlyContext()
        {
            var connectionString = _connectionManager.GetReadConnectionString();
            var optionsBuilder = new DbContextOptionsBuilder<TContext>();
            optionsBuilder.UseSqlServer(connectionString);
            optionsBuilder.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
            optionsBuilder.UseLoggerFactory(_loggerFactory);

            return (TContext)Activator.CreateInstance(typeof(TContext), optionsBuilder.Options)!;
        }
    }

    /// <summary>
    /// Connection pool monitor for tracking pool statistics
    /// </summary>
    public class ConnectionPoolMonitor
    {
        private readonly string _connectionString;
        private readonly ILogger<ConnectionPoolMonitor> _logger;
        private readonly Timer _monitorTimer;
        private ConnectionPoolStatistics _lastStatistics;

        public ConnectionPoolMonitor(
            string connectionString,
            ILogger<ConnectionPoolMonitor> logger)
        {
            _connectionString = connectionString;
            _logger = logger;
            _lastStatistics = new ConnectionPoolStatistics();

            // Monitor every 60 seconds
            _monitorTimer = new Timer(
                _ => CollectStatistics(),
                null,
                TimeSpan.FromSeconds(10),
                TimeSpan.FromSeconds(60));
        }

        public ConnectionPoolStatistics GetStatistics() => _lastStatistics;

        private void CollectStatistics()
        {
            try
            {
                // Clear all pools to reset statistics
                var stats = new ConnectionPoolStatistics
                {
                    Timestamp = DateTime.UtcNow,
                    ConnectionString = MaskConnectionString(_connectionString)
                };

                // Try to get pool information (this is approximate)
                using var connection = new SqlConnection(_connectionString);
                connection.Open();
                
                // Get basic connection info
                stats.ServerVersion = connection.ServerVersion;
                stats.Database = connection.Database;
                stats.DataSource = connection.DataSource;
                stats.State = connection.State.ToString();

                _lastStatistics = stats;

                _logger.LogDebug(
                    "Connection pool stats - Server: {Server}, DB: {Database}, State: {State}",
                    stats.DataSource, stats.Database, stats.State);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to collect connection pool statistics");
            }
        }

        private string MaskConnectionString(string connectionString)
        {
            var builder = new SqlConnectionStringBuilder(connectionString);
            return $"Server={builder.DataSource};Database={builder.InitialCatalog}";
        }

        public void Dispose()
        {
            _monitorTimer?.Dispose();
        }
    }

    public class ConnectionPoolStatistics
    {
        public DateTime Timestamp { get; set; }
        public string ConnectionString { get; set; } = string.Empty;
        public string ServerVersion { get; set; } = string.Empty;
        public string Database { get; set; } = string.Empty;
        public string DataSource { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
    }
}
