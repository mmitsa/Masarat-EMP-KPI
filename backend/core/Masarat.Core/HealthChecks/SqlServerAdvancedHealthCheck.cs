using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Data.SqlClient;
using System.Collections.Concurrent;
using System.Diagnostics;

namespace Masarat.Core.HealthChecks
{
    /// <summary>
    /// Advanced SQL Server health check with cached detailed diagnostics
    /// Basic check uses SELECT 1 (fast), detailed diagnostics cached for 60 seconds
    /// </summary>
    public class SqlServerAdvancedHealthCheck : IHealthCheck
    {
        private readonly string _connectionString;
        private readonly string? _readReplicaConnectionString;
        private readonly ILogger<SqlServerAdvancedHealthCheck> _logger;
        private readonly int _timeout;

        // Cache for expensive DMV queries - shared across all instances
        private static readonly ConcurrentDictionary<string, CachedDiagnostics> _diagnosticsCache = new();
        private static readonly TimeSpan _cacheDuration = TimeSpan.FromSeconds(60);

        public SqlServerAdvancedHealthCheck(
            string connectionString,
            ILogger<SqlServerAdvancedHealthCheck> logger,
            string? readReplicaConnectionString = null,
            int timeout = 5)
        {
            _connectionString = connectionString ?? throw new ArgumentNullException(nameof(connectionString));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _readReplicaConnectionString = readReplicaConnectionString;
            _timeout = timeout;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            var data = new Dictionary<string, object>();
            var stopwatch = Stopwatch.StartNew();

            try
            {
                // Fast check: SELECT 1 to verify connectivity
                var primaryResult = await CheckDatabaseFastAsync(_connectionString, cancellationToken);
                data["primary_status"] = primaryResult.IsHealthy ? "Healthy" : "Unhealthy";
                data["primary_response_time_ms"] = primaryResult.ResponseTimeMs;

                // Get cached detailed diagnostics (runs expensive queries only every 60 seconds)
                var diagnostics = await GetCachedDiagnosticsAsync(_connectionString, cancellationToken);
                if (diagnostics != null)
                {
                    data["primary_active_connections"] = diagnostics.ActiveConnections;
                    data["primary_blocked_processes"] = diagnostics.BlockedProcesses;
                }

                // Check read replica if configured
                if (!string.IsNullOrEmpty(_readReplicaConnectionString))
                {
                    var replicaResult = await CheckDatabaseFastAsync(_readReplicaConnectionString, cancellationToken);
                    data["replica_status"] = replicaResult.IsHealthy ? "Healthy" : "Unhealthy";
                    data["replica_response_time_ms"] = replicaResult.ResponseTimeMs;
                }

                stopwatch.Stop();
                data["total_check_time_ms"] = stopwatch.ElapsedMilliseconds;

                if (!primaryResult.IsHealthy)
                {
                    return HealthCheckResult.Unhealthy(
                        "Primary database is unreachable",
                        data: data);
                }

                var hasWarnings = (diagnostics?.BlockedProcesses ?? 0) > 0 ||
                                 primaryResult.ResponseTimeMs > 1000;

                if (hasWarnings)
                {
                    return HealthCheckResult.Degraded(
                        "Database has performance warnings",
                        data: data);
                }

                return HealthCheckResult.Healthy(
                    "Database is healthy",
                    data: data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database health check failed");
                data["error"] = ex.Message;
                stopwatch.Stop();
                data["total_check_time_ms"] = stopwatch.ElapsedMilliseconds;

                return HealthCheckResult.Unhealthy(
                    "Database health check failed",
                    ex,
                    data);
            }
        }

        /// <summary>
        /// Fast connectivity check using SELECT 1 (~1-5ms)
        /// </summary>
        private async Task<(bool IsHealthy, long ResponseTimeMs)> CheckDatabaseFastAsync(
            string connectionString,
            CancellationToken cancellationToken)
        {
            var stopwatch = Stopwatch.StartNew();
            try
            {
                using var connection = new SqlConnection(connectionString);
                using var command = connection.CreateCommand();
                command.CommandTimeout = _timeout;
                command.CommandText = "SELECT 1";

                await connection.OpenAsync(cancellationToken);
                await command.ExecuteScalarAsync(cancellationToken);

                stopwatch.Stop();
                return (true, stopwatch.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Fast health check failed");
                stopwatch.Stop();
                return (false, stopwatch.ElapsedMilliseconds);
            }
        }

        /// <summary>
        /// Get cached detailed diagnostics (DMV queries cached for 60 seconds)
        /// </summary>
        private async Task<CachedDiagnostics?> GetCachedDiagnosticsAsync(
            string connectionString,
            CancellationToken cancellationToken)
        {
            var cacheKey = connectionString.GetHashCode().ToString();

            if (_diagnosticsCache.TryGetValue(cacheKey, out var cached) &&
                DateTime.UtcNow - cached.CachedAt < _cacheDuration)
            {
                return cached;
            }

            try
            {
                using var connection = new SqlConnection(connectionString);
                using var command = connection.CreateCommand();
                command.CommandTimeout = _timeout;
                command.CommandText = @"
                    SELECT
                        (SELECT COUNT(*) FROM sys.dm_exec_sessions WHERE is_user_process = 1) as ActiveConnections,
                        (SELECT COUNT(*) FROM sys.dm_exec_requests WHERE blocking_session_id > 0) as BlockedProcesses
                ";

                await connection.OpenAsync(cancellationToken);
                using var reader = await command.ExecuteReaderAsync(cancellationToken);

                if (await reader.ReadAsync(cancellationToken))
                {
                    var diagnostics = new CachedDiagnostics
                    {
                        ActiveConnections = reader.GetInt32(0),
                        BlockedProcesses = reader.GetInt32(1),
                        CachedAt = DateTime.UtcNow
                    };

                    _diagnosticsCache[cacheKey] = diagnostics;
                    return diagnostics;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to get detailed diagnostics, using cached or defaults");
            }

            return cached; // Return stale cache if available
        }

        private class CachedDiagnostics
        {
            public int ActiveConnections { get; set; }
            public int BlockedProcesses { get; set; }
            public DateTime CachedAt { get; set; }
        }
    }

    /// <summary>
    /// Extension methods for registering advanced database health checks
    /// </summary>
    public static class DatabaseHealthCheckExtensions
    {
        /// <summary>
        /// Adds advanced SQL Server health check with optional read replica monitoring
        /// </summary>
        public static IHealthChecksBuilder AddSqlServerAdvanced(
            this IHealthChecksBuilder builder,
            string connectionString,
            string? readReplicaConnectionString = null,
            string name = "sqlserver-advanced",
            HealthStatus? failureStatus = null,
            IEnumerable<string>? tags = null,
            TimeSpan? timeout = null)
        {
            return builder.Add(new HealthCheckRegistration(
                name,
                sp =>
                {
                    var logger = sp.GetRequiredService<ILogger<SqlServerAdvancedHealthCheck>>();
                    return new SqlServerAdvancedHealthCheck(
                        connectionString,
                        logger,
                        readReplicaConnectionString,
                        timeout: (int?)timeout?.TotalSeconds ?? 5);
                },
                failureStatus,
                tags,
                timeout));
        }

        /// <summary>
        /// Adds a lightweight database connection pool health check (no ClearAllPools)
        /// </summary>
        public static IHealthChecksBuilder AddConnectionPoolMonitoring(
            this IHealthChecksBuilder builder,
            string connectionString,
            string name = "connection-pool",
            HealthStatus? failureStatus = null,
            IEnumerable<string>? tags = null)
        {
            return builder.AddCheck(name, new ConnectionPoolHealthCheck(connectionString), failureStatus, tags ?? Array.Empty<string>());
        }
    }

    /// <summary>
    /// Lightweight connection pool health check - verifies connectivity without clearing pools
    /// </summary>
    internal class ConnectionPoolHealthCheck : IHealthCheck
    {
        private readonly string _connectionString;

        public ConnectionPoolHealthCheck(string connectionString)
        {
            _connectionString = connectionString;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            var data = new Dictionary<string, object>();

            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync(cancellationToken);

                data["state"] = connection.State.ToString();
                data["database"] = connection.Database;
                data["server_version"] = connection.ServerVersion;

                return HealthCheckResult.Healthy("Connection pool is healthy", data);
            }
            catch (Exception ex)
            {
                data["error"] = ex.Message;
                return HealthCheckResult.Unhealthy("Connection pool check failed", ex, data);
            }
        }
    }
}
