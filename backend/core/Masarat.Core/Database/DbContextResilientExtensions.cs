using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Logging;
using Polly;

namespace Masarat.Core.Database
{
    /// <summary>
    /// Database resilience extensions for connection retry and failover
    /// </summary>
    public static class DbContextResilientExtensions
    {
        /// <summary>
        /// Configures SQL Server with connection resiliency
        /// Automatically retries on transient failures
        /// </summary>
        public static DbContextOptionsBuilder UseResilientSqlServer(
            this DbContextOptionsBuilder options,
            string connectionString,
            Action<Microsoft.EntityFrameworkCore.Infrastructure.SqlServerDbContextOptionsBuilder>? sqlOptions = null)
        {
            return options.UseSqlServer(connectionString, opts =>
            {
                // Enable automatic retry on transient failures
                opts.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: new[]
                    {
                        // Add SQL Server error numbers to retry
                        -2,    // Timeout
                        -1,    // Connection broken
                        1205,  // Deadlock
                        40501, // Service unavailable
                        40613, // Database unavailable
                        49918, // Cannot process request
                        49919, // Cannot process create/update
                        49920  // Cannot process delete
                    }
                );

                // Command timeout (30 seconds default)
                opts.CommandTimeout(30);

                // Use multiple active result sets
                opts.EnableRetryOnFailure();

                // Apply additional options
                sqlOptions?.Invoke(opts);
            });
        }

        /// <summary>
        /// Executes database operation with retry policy
        /// Use for critical operations that must succeed
        /// </summary>
        public static async Task<T> ExecuteWithRetryAsync<T>(
            this DbContext context,
            Func<Task<T>> operation,
            ILogger logger,
            int maxRetries = 3)
        {
            var retryPolicy = Policy
                .Handle<Exception>(ex =>
                {
                    // Retry on transient errors
                    var message = ex.Message.ToLower();
                    return message.Contains("timeout") ||
                           message.Contains("deadlock") ||
                           message.Contains("transport") ||
                           message.Contains("connection");
                })
                .WaitAndRetryAsync(
                    retryCount: maxRetries,
                    sleepDurationProvider: retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                    onRetry: (exception, timespan, retryCount, policyContext) =>
                    {
                        logger.LogWarning(
                            exception,
                            "Database operation retry {RetryCount}/{MaxRetries} after {Delay}s",
                            retryCount,
                            maxRetries,
                            timespan.TotalSeconds
                        );
                    }
                );

            return await retryPolicy.ExecuteAsync(operation);
        }

        /// <summary>
        /// Executes database operation without return value with retry
        /// </summary>
        public static async Task ExecuteWithRetryAsync(
            this DbContext context,
            Func<Task> operation,
            ILogger logger,
            int maxRetries = 3)
        {
            await ExecuteWithRetryAsync(
                context,
                async () =>
                {
                    await operation();
                    return true;
                },
                logger,
                maxRetries
            );
        }
    }

    /// <summary>
    /// Database context factory for read/write splitting
    /// Supports read replicas for query optimization
    /// </summary>
    public class DbContextFactory<TContext> where TContext : DbContext
    {
        private readonly string _primaryConnectionString;
        private readonly List<string> _readReplicaConnectionStrings;
        private readonly ILogger _logger;
        private int _currentReplicaIndex = 0;
        private readonly bool _useReadReplicas;
        private readonly object _lock = new();

        public DbContextFactory(
            string primaryConnectionString,
            IEnumerable<string> readReplicaConnectionStrings,
            ILogger logger,
            bool useReadReplicas = true)
        {
            _primaryConnectionString = primaryConnectionString;
            _readReplicaConnectionStrings = readReplicaConnectionStrings?.ToList() ?? new List<string>();
            _logger = logger;
            _useReadReplicas = useReadReplicas && _readReplicaConnectionStrings.Any();

            _logger.LogInformation(
                "DbContextFactory initialized. Primary: configured, Read replicas: {Count}, Enabled: {Enabled}",
                _readReplicaConnectionStrings.Count,
                _useReadReplicas
            );
        }

        /// <summary>
        /// Creates context connected to primary database
        /// Use for write operations (INSERT, UPDATE, DELETE)
        /// </summary>
        public TContext CreateWriteContext()
        {
            _logger.LogDebug("Creating WRITE context (primary database)");
            return CreateContext(_primaryConnectionString);
        }

        /// <summary>
        /// Creates context connected to read replica
        /// Use for read-only queries (SELECT)
        /// Falls back to primary if replicas unavailable
        /// </summary>
        public TContext CreateReadContext()
        {
            if (!_useReadReplicas || !_readReplicaConnectionStrings.Any())
            {
                _logger.LogDebug("Creating READ context (primary - no replicas configured)");
                return CreateWriteContext();
            }

            // Round-robin load balancing across replicas
            string replicaConnectionString;
            lock (_lock)
            {
                var index = _currentReplicaIndex++ % _readReplicaConnectionStrings.Count;
                replicaConnectionString = _readReplicaConnectionStrings[index];
            }

            _logger.LogDebug("Creating READ context (replica {Index})", _currentReplicaIndex % _readReplicaConnectionStrings.Count);

            try
            {
                return CreateContext(replicaConnectionString);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to connect to read replica, falling back to primary");
                return CreateWriteContext();
            }
        }

        private TContext CreateContext(string connectionString)
        {
            var optionsBuilder = new DbContextOptionsBuilder<TContext>();
            optionsBuilder.UseResilientSqlServer(connectionString);

            return (TContext)Activator.CreateInstance(typeof(TContext), optionsBuilder.Options)!;
        }
    }

    /// <summary>
    /// Repository base with automatic read/write splitting
    /// </summary>
    public abstract class ResilientRepository<TContext> where TContext : DbContext
    {
        protected readonly DbContextFactory<TContext> ContextFactory;
        protected readonly ILogger Logger;

        protected ResilientRepository(DbContextFactory<TContext> contextFactory, ILogger logger)
        {
            ContextFactory = contextFactory;
            Logger = logger;
        }

        /// <summary>
        /// Executes read query using read replica
        /// </summary>
        protected async Task<T> ExecuteReadAsync<T>(Func<TContext, Task<T>> query)
        {
            using var context = ContextFactory.CreateReadContext();
            return await context.ExecuteWithRetryAsync(() => query(context), Logger);
        }

        /// <summary>
        /// Executes write operation using primary database
        /// </summary>
        protected async Task<T> ExecuteWriteAsync<T>(Func<TContext, Task<T>> operation)
        {
            using var context = ContextFactory.CreateWriteContext();
            return await context.ExecuteWithRetryAsync(() => operation(context), Logger);
        }

        /// <summary>
        /// Executes write operation without return value
        /// </summary>
        protected async Task ExecuteWriteAsync(Func<TContext, Task> operation)
        {
            using var context = ContextFactory.CreateWriteContext();
            await context.ExecuteWithRetryAsync(() => operation(context), Logger);
        }
    }
}
