using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading.Tasks;

namespace Masarat.Core.Health
{
    /// <summary>
    /// Base Health Controller - يمكن وراثته من قبل كل خدمة
    /// </summary>
    [ApiController]
    [Route("[controller]")]
    [AllowAnonymous]
    public abstract class BaseHealthController<TDbContext> : ControllerBase where TDbContext : DbContext
    {
        protected readonly TDbContext _context;
        protected readonly string _serviceName;

        protected BaseHealthController(TDbContext context, string serviceName)
        {
            _context = context;
            _serviceName = serviceName;
        }

        /// <summary>
        /// فحص صحة شامل للخدمة
        /// GET /health
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetHealth()
        {
            var stopwatch = Stopwatch.StartNew();

            var status = new
            {
                service = _serviceName,
                status = "healthy",
                version = GetVersion(),
                timestamp = DateTime.UtcNow,
                uptime = GetUptime(),
                checks = new Dictionary<string, object>()
            };

            var checks = new Dictionary<string, object>();
            bool isHealthy = true;

            // Database check
            try
            {
                var dbStopwatch = Stopwatch.StartNew();
                var canConnect = await _context.Database.CanConnectAsync();
                dbStopwatch.Stop();

                checks["database"] = new
                {
                    status = canConnect ? "healthy" : "unhealthy",
                    responseTimeMs = dbStopwatch.ElapsedMilliseconds,
                    provider = _context.Database.ProviderName,
                };

                if (!canConnect) isHealthy = false;
            }
            catch (Exception ex)
            {
                checks["database"] = new
                {
                    status = "unhealthy",
                    error = ex.Message,
                };
                isHealthy = false;
            }

            // Memory check
            var process = Process.GetCurrentProcess();
            var memoryMb = process.WorkingSet64 / (1024 * 1024);
            checks["memory"] = new
            {
                status = memoryMb < 1024 ? "healthy" : memoryMb < 2048 ? "degraded" : "unhealthy",
                workingSetMb = memoryMb,
                gcMemoryMb = GC.GetTotalMemory(false) / (1024 * 1024),
            };

            stopwatch.Stop();

            var result = new
            {
                service = _serviceName,
                status = isHealthy ? "healthy" : "unhealthy",
                version = GetVersion(),
                timestamp = DateTime.UtcNow,
                uptime = GetUptime().ToString(@"dd\.hh\:mm\:ss"),
                responseTimeMs = stopwatch.ElapsedMilliseconds,
                checks,
            };

            return isHealthy ? Ok(result) : StatusCode(503, result);
        }

        /// <summary>
        /// فحص سريع - هل الخدمة تعمل؟
        /// GET /health/live
        /// </summary>
        [HttpGet("live")]
        public IActionResult GetLiveness()
        {
            return Ok(new
            {
                status = "alive",
                service = _serviceName,
                timestamp = DateTime.UtcNow,
            });
        }

        /// <summary>
        /// فحص الجاهزية - هل الخدمة جاهزة لاستقبال الطلبات؟
        /// GET /health/ready
        /// </summary>
        [HttpGet("ready")]
        public async Task<IActionResult> GetReadiness()
        {
            try
            {
                // Check database
                var canConnect = await _context.Database.CanConnectAsync();

                if (canConnect)
                {
                    return Ok(new
                    {
                        status = "ready",
                        service = _serviceName,
                        timestamp = DateTime.UtcNow,
                    });
                }

                return StatusCode(503, new
                {
                    status = "not_ready",
                    service = _serviceName,
                    reason = "Database connection failed",
                    timestamp = DateTime.UtcNow,
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new
                {
                    status = "not_ready",
                    service = _serviceName,
                    reason = ex.Message,
                    timestamp = DateTime.UtcNow,
                });
            }
        }

        /// <summary>
        /// معلومات الخدمة
        /// GET /health/info
        /// </summary>
        [HttpGet("info")]
        public IActionResult GetInfo()
        {
            var process = Process.GetCurrentProcess();

            return Ok(new
            {
                service = _serviceName,
                version = GetVersion(),
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                runtime = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription,
                os = System.Runtime.InteropServices.RuntimeInformation.OSDescription,
                processId = process.Id,
                startTime = process.StartTime,
                uptime = GetUptime().ToString(@"dd\.hh\:mm\:ss"),
                threads = process.Threads.Count,
                memoryMb = process.WorkingSet64 / (1024 * 1024),
                timestamp = DateTime.UtcNow,
            });
        }

        /// <summary>
        /// إحصائيات قاعدة البيانات
        /// GET /health/database
        /// </summary>
        [HttpGet("database")]
        public async Task<IActionResult> GetDatabaseHealth()
        {
            try
            {
                var stopwatch = Stopwatch.StartNew();
                var canConnect = await _context.Database.CanConnectAsync();
                stopwatch.Stop();

                // Get connection string info (without password)
                var connectionString = _context.Database.GetConnectionString() ?? "";
                var sanitizedConnectionString = SanitizeConnectionString(connectionString);

                return Ok(new
                {
                    status = canConnect ? "connected" : "disconnected",
                    provider = _context.Database.ProviderName,
                    connectionString = sanitizedConnectionString,
                    responseTimeMs = stopwatch.ElapsedMilliseconds,
                    timestamp = DateTime.UtcNow,
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new
                {
                    status = "error",
                    error = ex.Message,
                    timestamp = DateTime.UtcNow,
                });
            }
        }

        private string GetVersion()
        {
            var assembly = System.Reflection.Assembly.GetEntryAssembly();
            return assembly?.GetName().Version?.ToString() ?? "1.0.0";
        }

        private TimeSpan GetUptime()
        {
            return DateTime.UtcNow - Process.GetCurrentProcess().StartTime.ToUniversalTime();
        }

        private string SanitizeConnectionString(string connectionString)
        {
            // Remove password from connection string
            var parts = connectionString.Split(';');
            var sanitized = new List<string>();

            foreach (var part in parts)
            {
                var trimmed = part.Trim();
                if (!trimmed.StartsWith("Password=", StringComparison.OrdinalIgnoreCase) &&
                    !trimmed.StartsWith("Pwd=", StringComparison.OrdinalIgnoreCase))
                {
                    sanitized.Add(trimmed);
                }
                else
                {
                    sanitized.Add(trimmed.Split('=')[0] + "=****");
                }
            }

            return string.Join(";", sanitized);
        }
    }
}
