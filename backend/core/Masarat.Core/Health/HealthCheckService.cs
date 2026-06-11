using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Masarat.Core.Health
{
    /// <summary>
    /// خدمة فحص صحة النظام الموحدة
    /// Unified Health Check Service
    /// </summary>
    public class HealthCheckService
    {
        private readonly IServiceProvider _serviceProvider;

        public HealthCheckService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        /// <summary>
        /// فحص صحة الخدمة
        /// </summary>
        public async Task<HealthStatus> CheckHealthAsync()
        {
            var status = new HealthStatus
            {
                ServiceName = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "Unknown",
                Version = GetServiceVersion(),
                Timestamp = DateTime.UtcNow,
                Uptime = GetUptime(),
            };

            var stopwatch = Stopwatch.StartNew();

            try
            {
                // Check database connection
                status.Checks.Add("database", await CheckDatabaseAsync());

                // Check memory usage
                status.Checks.Add("memory", CheckMemory());

                // Check CPU usage
                status.Checks.Add("cpu", CheckCpu());

                // Check disk space
                status.Checks.Add("disk", CheckDisk());

                stopwatch.Stop();
                status.ResponseTimeMs = stopwatch.ElapsedMilliseconds;

                // Determine overall status
                status.Status = DetermineOverallStatus(status.Checks);
            }
            catch (Exception ex)
            {
                status.Status = "unhealthy";
                status.Error = ex.Message;
                status.ResponseTimeMs = stopwatch.ElapsedMilliseconds;
            }

            return status;
        }

        /// <summary>
        /// فحص بسيط للتأكد من أن الخدمة تعمل
        /// </summary>
        public LivenessStatus CheckLiveness()
        {
            return new LivenessStatus
            {
                Status = "alive",
                Timestamp = DateTime.UtcNow,
            };
        }

        /// <summary>
        /// فحص جاهزية الخدمة لاستقبال الطلبات
        /// </summary>
        public async Task<ReadinessStatus> CheckReadinessAsync()
        {
            var status = new ReadinessStatus
            {
                Timestamp = DateTime.UtcNow,
            };

            try
            {
                // Check if database is ready
                var dbCheck = await CheckDatabaseAsync();
                status.DatabaseReady = dbCheck.Status == "healthy";

                // Check if dependencies are ready
                status.DependenciesReady = true; // Add actual dependency checks

                status.Ready = status.DatabaseReady && status.DependenciesReady;
                status.Status = status.Ready ? "ready" : "not_ready";
            }
            catch (Exception ex)
            {
                status.Ready = false;
                status.Status = "not_ready";
                status.Error = ex.Message;
            }

            return status;
        }

        private async Task<HealthCheckResult> CheckDatabaseAsync()
        {
            // This should be overridden by specific services
            return new HealthCheckResult
            {
                Name = "database",
                Status = "healthy",
                ResponseTimeMs = 0,
            };
        }

        private HealthCheckResult CheckMemory()
        {
            var process = Process.GetCurrentProcess();
            var memoryMb = process.WorkingSet64 / (1024 * 1024);
            var gcMemory = GC.GetTotalMemory(false) / (1024 * 1024);

            return new HealthCheckResult
            {
                Name = "memory",
                Status = memoryMb < 1024 ? "healthy" : memoryMb < 2048 ? "degraded" : "unhealthy",
                Data = new Dictionary<string, object>
                {
                    ["workingSetMb"] = memoryMb,
                    ["gcMemoryMb"] = gcMemory,
                    ["gen0Collections"] = GC.CollectionCount(0),
                    ["gen1Collections"] = GC.CollectionCount(1),
                    ["gen2Collections"] = GC.CollectionCount(2),
                },
            };
        }

        private HealthCheckResult CheckCpu()
        {
            var process = Process.GetCurrentProcess();

            return new HealthCheckResult
            {
                Name = "cpu",
                Status = "healthy",
                Data = new Dictionary<string, object>
                {
                    ["processorTime"] = process.TotalProcessorTime.TotalSeconds,
                    ["threads"] = process.Threads.Count,
                },
            };
        }

        private HealthCheckResult CheckDisk()
        {
            try
            {
                var drive = new System.IO.DriveInfo(System.IO.Path.GetPathRoot(Environment.CurrentDirectory) ?? "/");
                var freeSpaceGb = drive.AvailableFreeSpace / (1024.0 * 1024 * 1024);
                var totalSpaceGb = drive.TotalSize / (1024.0 * 1024 * 1024);
                var usedPercent = ((totalSpaceGb - freeSpaceGb) / totalSpaceGb) * 100;

                return new HealthCheckResult
                {
                    Name = "disk",
                    Status = usedPercent < 80 ? "healthy" : usedPercent < 90 ? "degraded" : "unhealthy",
                    Data = new Dictionary<string, object>
                    {
                        ["freeSpaceGb"] = Math.Round(freeSpaceGb, 2),
                        ["totalSpaceGb"] = Math.Round(totalSpaceGb, 2),
                        ["usedPercent"] = Math.Round(usedPercent, 2),
                    },
                };
            }
            catch
            {
                return new HealthCheckResult
                {
                    Name = "disk",
                    Status = "unknown",
                };
            }
        }

        private string DetermineOverallStatus(Dictionary<string, HealthCheckResult> checks)
        {
            bool hasUnhealthy = false;
            bool hasDegraded = false;

            foreach (var check in checks.Values)
            {
                if (check.Status == "unhealthy")
                    hasUnhealthy = true;
                else if (check.Status == "degraded")
                    hasDegraded = true;
            }

            if (hasUnhealthy) return "unhealthy";
            if (hasDegraded) return "degraded";
            return "healthy";
        }

        private string GetServiceVersion()
        {
            var assembly = System.Reflection.Assembly.GetEntryAssembly();
            return assembly?.GetName().Version?.ToString() ?? "1.0.0";
        }

        private TimeSpan GetUptime()
        {
            return DateTime.UtcNow - Process.GetCurrentProcess().StartTime.ToUniversalTime();
        }
    }

    #region Health Status DTOs

    public class HealthStatus
    {
        public string ServiceName { get; set; } = string.Empty;
        public string Status { get; set; } = "unknown";
        public string Version { get; set; } = "1.0.0";
        public DateTime Timestamp { get; set; }
        public TimeSpan Uptime { get; set; }
        public long ResponseTimeMs { get; set; }
        public string? Error { get; set; }
        public Dictionary<string, HealthCheckResult> Checks { get; set; } = new();
    }

    public class HealthCheckResult
    {
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = "unknown";
        public long ResponseTimeMs { get; set; }
        public string? Error { get; set; }
        public Dictionary<string, object>? Data { get; set; }
    }

    public class LivenessStatus
    {
        public string Status { get; set; } = "alive";
        public DateTime Timestamp { get; set; }
    }

    public class ReadinessStatus
    {
        public string Status { get; set; } = "not_ready";
        public bool Ready { get; set; }
        public bool DatabaseReady { get; set; }
        public bool DependenciesReady { get; set; }
        public DateTime Timestamp { get; set; }
        public string? Error { get; set; }
    }

    #endregion
}
