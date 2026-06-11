using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Masarat.Core.Chaos;

/// <summary>
/// أدوات Chaos Engineering لاختبار مرونة النظام
/// تُستخدم فقط في بيئات التطوير والاختبار
/// </summary>
public interface IChaosService
{
    bool ShouldInjectFault(string faultType);
    Task<T> WithChaosAsync<T>(string operationName, Func<Task<T>> operation);
    ChaosConfiguration GetConfiguration();
    void UpdateConfiguration(ChaosConfiguration config);
}

public class ChaosService : IChaosService
{
    private readonly ILogger<ChaosService> _logger;
    private readonly IConfiguration _configuration;
    private ChaosConfiguration _chaosConfig;
    private readonly Random _random = new();

    public ChaosService(
        ILogger<ChaosService> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        _chaosConfig = LoadConfiguration();
    }

    public bool ShouldInjectFault(string faultType)
    {
        if (!_chaosConfig.IsEnabled)
            return false;

        if (!_chaosConfig.Experiments.TryGetValue(faultType, out var experiment))
            return false;

        if (!experiment.IsEnabled)
            return false;

        // Check time window
        var now = DateTime.UtcNow;
        if (experiment.StartTime.HasValue && now < experiment.StartTime.Value)
            return false;

        if (experiment.EndTime.HasValue && now > experiment.EndTime.Value)
            return false;

        // Check probability
        return _random.NextDouble() * 100 < experiment.Probability;
    }

    public async Task<T> WithChaosAsync<T>(string operationName, Func<Task<T>> operation)
    {
        // Check for latency injection
        if (ShouldInjectFault("latency"))
        {
            var latency = _chaosConfig.Experiments["latency"];
            var delay = _random.Next(latency.MinDelayMs, latency.MaxDelayMs);
            _logger.LogWarning("Chaos: Injecting {Delay}ms latency for {Operation}", delay, operationName);
            await Task.Delay(delay);
        }

        // Check for exception injection
        if (ShouldInjectFault("exception"))
        {
            var exception = _chaosConfig.Experiments["exception"];
            _logger.LogWarning("Chaos: Injecting exception for {Operation}", operationName);
            throw new ChaosInjectedException(exception.ExceptionMessage ?? "Chaos injected failure");
        }

        // Check for timeout simulation
        if (ShouldInjectFault("timeout"))
        {
            _logger.LogWarning("Chaos: Injecting timeout for {Operation}", operationName);
            await Task.Delay(TimeSpan.FromSeconds(120)); // Simulate timeout
        }

        // Check for partial failure (return null)
        if (ShouldInjectFault("partial_failure"))
        {
            _logger.LogWarning("Chaos: Injecting partial failure for {Operation}", operationName);
            return default!;
        }

        return await operation();
    }

    public ChaosConfiguration GetConfiguration()
    {
        return _chaosConfig;
    }

    public void UpdateConfiguration(ChaosConfiguration config)
    {
        _chaosConfig = config;
        _logger.LogInformation("Chaos configuration updated: Enabled={IsEnabled}", config.IsEnabled);
    }

    private ChaosConfiguration LoadConfiguration()
    {
        var config = new ChaosConfiguration();
        _configuration.GetSection("Chaos").Bind(config);

        // Default experiments if not configured
        if (!config.Experiments.Any())
        {
            config.Experiments = new Dictionary<string, ChaosExperiment>
            {
                ["latency"] = new ChaosExperiment
                {
                    Name = "Latency Injection",
                    Description = "Adds random latency to requests",
                    IsEnabled = false,
                    Probability = 10,
                    MinDelayMs = 100,
                    MaxDelayMs = 3000
                },
                ["exception"] = new ChaosExperiment
                {
                    Name = "Exception Injection",
                    Description = "Throws random exceptions",
                    IsEnabled = false,
                    Probability = 5,
                    ExceptionMessage = "Chaos monkey strikes!"
                },
                ["timeout"] = new ChaosExperiment
                {
                    Name = "Timeout Simulation",
                    Description = "Simulates request timeouts",
                    IsEnabled = false,
                    Probability = 2
                },
                ["partial_failure"] = new ChaosExperiment
                {
                    Name = "Partial Failure",
                    Description = "Returns null/empty responses",
                    IsEnabled = false,
                    Probability = 5
                },
                ["memory_pressure"] = new ChaosExperiment
                {
                    Name = "Memory Pressure",
                    Description = "Allocates large memory blocks",
                    IsEnabled = false,
                    Probability = 1,
                    MemoryAllocationMb = 100
                },
                ["cpu_stress"] = new ChaosExperiment
                {
                    Name = "CPU Stress",
                    Description = "Performs CPU-intensive operations",
                    IsEnabled = false,
                    Probability = 1,
                    CpuStressDurationMs = 500
                }
            };
        }

        return config;
    }
}

/// <summary>
/// تكوين Chaos Engineering
/// </summary>
public class ChaosConfiguration
{
    public bool IsEnabled { get; set; } = false;
    public List<string> AllowedEnvironments { get; set; } = new() { "Development", "Staging" };
    public Dictionary<string, ChaosExperiment> Experiments { get; set; } = new();
}

public class ChaosExperiment
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = false;
    public double Probability { get; set; } = 10; // Percentage
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public List<string> TargetServices { get; set; } = new();
    public List<string> TargetEndpoints { get; set; } = new();

    // Latency specific
    public int MinDelayMs { get; set; } = 100;
    public int MaxDelayMs { get; set; } = 5000;

    // Exception specific
    public string? ExceptionMessage { get; set; }

    // Memory specific
    public int MemoryAllocationMb { get; set; } = 50;

    // CPU specific
    public int CpuStressDurationMs { get; set; } = 500;
}

/// <summary>
/// استثناء مُحقن من Chaos
/// </summary>
public class ChaosInjectedException : Exception
{
    public ChaosInjectedException(string message) : base(message) { }
}

/// <summary>
/// Middleware لحقن الأعطال
/// </summary>
public class ChaosMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IChaosService _chaosService;
    private readonly ILogger<ChaosMiddleware> _logger;
    private readonly string _environment;

    public ChaosMiddleware(
        RequestDelegate next,
        IChaosService chaosService,
        ILogger<ChaosMiddleware> logger,
        IConfiguration configuration)
    {
        _next = next;
        _chaosService = chaosService;
        _logger = logger;
        _environment = configuration["ASPNETCORE_ENVIRONMENT"] ?? "Production";
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var config = _chaosService.GetConfiguration();

        // Only run in allowed environments
        if (!config.IsEnabled || !config.AllowedEnvironments.Contains(_environment))
        {
            await _next(context);
            return;
        }

        // Skip health and metrics endpoints
        var path = context.Request.Path.Value?.ToLower() ?? "";
        if (path.Contains("/health") || path.Contains("/metrics"))
        {
            await _next(context);
            return;
        }

        // Inject latency
        if (_chaosService.ShouldInjectFault("latency"))
        {
            var experiment = config.Experiments["latency"];
            var delay = new Random().Next(experiment.MinDelayMs, experiment.MaxDelayMs);
            _logger.LogWarning("Chaos Middleware: Injecting {Delay}ms latency for {Path}", delay, path);
            await Task.Delay(delay);
        }

        // Inject exception
        if (_chaosService.ShouldInjectFault("exception"))
        {
            _logger.LogWarning("Chaos Middleware: Injecting exception for {Path}", path);
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Internal Server Error",
                message = "Chaos injection - This is a test failure",
                chaos = true
            });
            return;
        }

        // Inject timeout
        if (_chaosService.ShouldInjectFault("timeout"))
        {
            _logger.LogWarning("Chaos Middleware: Simulating timeout for {Path}", path);
            await Task.Delay(TimeSpan.FromMinutes(5));
        }

        // Inject HTTP error responses
        if (_chaosService.ShouldInjectFault("http_error"))
        {
            var statusCodes = new[] { 500, 502, 503, 504 };
            var statusCode = statusCodes[new Random().Next(statusCodes.Length)];
            _logger.LogWarning("Chaos Middleware: Injecting HTTP {StatusCode} for {Path}", statusCode, path);
            context.Response.StatusCode = statusCode;
            await context.Response.WriteAsJsonAsync(new
            {
                error = $"HTTP {statusCode}",
                message = "Chaos injection - Simulated server error",
                chaos = true
            });
            return;
        }

        await _next(context);
    }
}

/// <summary>
/// Controller لإدارة Chaos
/// </summary>
[Microsoft.AspNetCore.Mvc.ApiController]
[Microsoft.AspNetCore.Mvc.Route("api/chaos")]
public class ChaosController : Microsoft.AspNetCore.Mvc.ControllerBase
{
    private readonly IChaosService _chaosService;
    private readonly IConfiguration _configuration;

    public ChaosController(IChaosService chaosService, IConfiguration configuration)
    {
        _chaosService = chaosService;
        _configuration = configuration;
    }

    [Microsoft.AspNetCore.Mvc.HttpGet("config")]
    public Microsoft.AspNetCore.Mvc.IActionResult GetConfiguration()
    {
        // Only allow in non-production
        if (_configuration["ASPNETCORE_ENVIRONMENT"] == "Production")
        {
            return NotFound();
        }

        return Ok(_chaosService.GetConfiguration());
    }

    [Microsoft.AspNetCore.Mvc.HttpPost("config")]
    public Microsoft.AspNetCore.Mvc.IActionResult UpdateConfiguration([Microsoft.AspNetCore.Mvc.FromBody] ChaosConfiguration config)
    {
        // Only allow in non-production
        if (_configuration["ASPNETCORE_ENVIRONMENT"] == "Production")
        {
            return NotFound();
        }

        _chaosService.UpdateConfiguration(config);
        return Ok(new { message = "Configuration updated", config });
    }

    [Microsoft.AspNetCore.Mvc.HttpPost("experiments/{name}/enable")]
    public Microsoft.AspNetCore.Mvc.IActionResult EnableExperiment(string name)
    {
        if (_configuration["ASPNETCORE_ENVIRONMENT"] == "Production")
        {
            return NotFound();
        }

        var config = _chaosService.GetConfiguration();
        if (config.Experiments.TryGetValue(name, out var experiment))
        {
            experiment.IsEnabled = true;
            _chaosService.UpdateConfiguration(config);
            return Ok(new { message = $"Experiment '{name}' enabled" });
        }

        return NotFound(new { message = $"Experiment '{name}' not found" });
    }

    [Microsoft.AspNetCore.Mvc.HttpPost("experiments/{name}/disable")]
    public Microsoft.AspNetCore.Mvc.IActionResult DisableExperiment(string name)
    {
        if (_configuration["ASPNETCORE_ENVIRONMENT"] == "Production")
        {
            return NotFound();
        }

        var config = _chaosService.GetConfiguration();
        if (config.Experiments.TryGetValue(name, out var experiment))
        {
            experiment.IsEnabled = false;
            _chaosService.UpdateConfiguration(config);
            return Ok(new { message = $"Experiment '{name}' disabled" });
        }

        return NotFound(new { message = $"Experiment '{name}' not found" });
    }
}

/// <summary>
/// Extension Methods
/// </summary>
public static class ChaosExtensions
{
    public static IServiceCollection AddChaosEngineering(this IServiceCollection services)
    {
        services.AddSingleton<IChaosService, ChaosService>();
        return services;
    }

    public static IApplicationBuilder UseChaosEngineering(this IApplicationBuilder app)
    {
        return app.UseMiddleware<ChaosMiddleware>();
    }
}
