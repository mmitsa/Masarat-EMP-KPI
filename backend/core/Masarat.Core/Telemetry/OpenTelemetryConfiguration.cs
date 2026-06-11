using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OpenTelemetry;
using OpenTelemetry.Exporter;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using System.Diagnostics;

namespace Masarat.Core.Telemetry;

/// <summary>
/// تكوين OpenTelemetry للتتبع الموزع والمقاييس والسجلات
/// </summary>
public static class OpenTelemetryConfiguration
{
    public static readonly ActivitySource ActivitySource = new("Masarat.Platform", "1.0.0");

    /// <summary>
    /// إضافة خدمات OpenTelemetry
    /// </summary>
    public static IServiceCollection AddMasaratTelemetry(
        this IServiceCollection services,
        IConfiguration configuration,
        string serviceName)
    {
        var telemetryConfig = configuration.GetSection("Telemetry");
        var jaegerEndpoint = telemetryConfig["JaegerEndpoint"] ?? "http://localhost:14268/api/traces";
        var otlpEndpoint = telemetryConfig["OtlpEndpoint"] ?? "http://localhost:4317";

        // Resource builder with service info
        var resourceBuilder = ResourceBuilder.CreateDefault()
            .AddService(
                serviceName: serviceName,
                serviceVersion: "1.0.0",
                serviceInstanceId: Environment.MachineName)
            .AddAttributes(new[]
            {
                new KeyValuePair<string, object>("deployment.environment",
                    configuration["ASPNETCORE_ENVIRONMENT"] ?? "Development"),
                new KeyValuePair<string, object>("service.namespace", "Masarat"),
                new KeyValuePair<string, object>("host.name", Environment.MachineName)
            });

        // Add OpenTelemetry
        services.AddOpenTelemetry()
            .ConfigureResource(resource => resource
                .AddService(serviceName)
                .AddAttributes(new[]
                {
                    new KeyValuePair<string, object>("service.version", "1.0.0")
                }))
            .WithTracing(tracing =>
            {
                tracing
                    .SetResourceBuilder(resourceBuilder)
                    // Instrumentation
                    .AddAspNetCoreInstrumentation(options =>
                    {
                        options.RecordException = true;
                        options.Filter = context =>
                        {
                            // Skip health checks and metrics endpoints
                            var path = context.Request.Path.Value ?? "";
                            return !path.Contains("/health") &&
                                   !path.Contains("/metrics") &&
                                   !path.Contains("/swagger");
                        };
                        options.EnrichWithHttpRequest = (activity, request) =>
                        {
                            activity.SetTag("http.request.tenant_id",
                                request.Headers["X-Tenant-Id"].FirstOrDefault());
                            activity.SetTag("http.request.user_id",
                                request.HttpContext.User?.FindFirst("sub")?.Value);
                        };
                        options.EnrichWithHttpResponse = (activity, response) =>
                        {
                            activity.SetTag("http.response.content_length",
                                response.ContentLength);
                        };
                    })
                    .AddHttpClientInstrumentation(options =>
                    {
                        options.RecordException = true;
                        options.EnrichWithHttpRequestMessage = (activity, request) =>
                        {
                            activity.SetTag("http.request.uri", request.RequestUri?.ToString());
                        };
                    })
                    .AddSqlClientInstrumentation(options =>
                    {
                        // SetDbStatementForText was removed in SqlClient instrumentation v1.15+
                        // Statement capture is now on by default for text commands
                        options.RecordException = true;
                    })
                    .AddSource(ActivitySource.Name)
                    // Exporters
                    .AddOtlpExporter(options =>
                    {
                        options.Endpoint = new Uri(otlpEndpoint);
                        options.Protocol = OtlpExportProtocol.Grpc;
                    })
                    .AddJaegerExporter(options =>
                    {
                        options.AgentHost = telemetryConfig["JaegerHost"] ?? "localhost";
                        options.AgentPort = int.Parse(telemetryConfig["JaegerPort"] ?? "6831");
                    });

            })
            .WithMetrics(metrics =>
            {
                metrics
                    .SetResourceBuilder(resourceBuilder)
                    // Instrumentation
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    // Custom meters
                    .AddMeter("Masarat.API")
                    .AddMeter("Masarat.Business")
                    .AddMeter("Masarat.Database")
                    // Exporters
                    .AddOtlpExporter(options =>
                    {
                        options.Endpoint = new Uri(otlpEndpoint);
                        options.Protocol = OtlpExportProtocol.Grpc;
                    })
                    .AddPrometheusExporter();
            });

        // Add logging
        services.AddLogging(logging =>
        {
            logging.AddOpenTelemetry(options =>
            {
                options.SetResourceBuilder(resourceBuilder);
                options.IncludeScopes = true;
                options.IncludeFormattedMessage = true;
                options.ParseStateValues = true;
                options.AddOtlpExporter(exporterOptions =>
                {
                    exporterOptions.Endpoint = new Uri(otlpEndpoint);
                    exporterOptions.Protocol = OtlpExportProtocol.Grpc;
                });
            });
        });

        return services;
    }

    /// <summary>
    /// استخدام Prometheus metrics endpoint
    /// Note: Configure Prometheus endpoint manually using MapPrometheusScrapingEndpoint() in endpoint routing
    /// </summary>
    public static IApplicationBuilder UseMasaratTelemetry(this IApplicationBuilder app)
    {
        // Prometheus endpoint is configured via AddPrometheusExporter() above
        // and exposed at /metrics by default
        return app;
    }
}

/// <summary>
/// Extension methods للتتبع
/// </summary>
public static class TracingExtensions
{
    /// <summary>
    /// بدء نشاط جديد للتتبع
    /// </summary>
    public static Activity? StartActivity(string name, ActivityKind kind = ActivityKind.Internal)
    {
        return OpenTelemetryConfiguration.ActivitySource.StartActivity(name, kind);
    }

    /// <summary>
    /// إضافة حدث للنشاط الحالي
    /// </summary>
    public static void AddEvent(this Activity? activity, string name, params KeyValuePair<string, object?>[] tags)
    {
        activity?.AddEvent(new ActivityEvent(name, tags: new ActivityTagsCollection(tags)));
    }

    /// <summary>
    /// إضافة استثناء للنشاط
    /// </summary>
    public static void RecordException(this Activity? activity, Exception ex)
    {
        activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
        activity?.RecordException(ex);
    }

    /// <summary>
    /// إضافة معلومات المستخدم للنشاط
    /// </summary>
    public static void SetUserContext(this Activity? activity, string? userId, string? tenantId)
    {
        activity?.SetTag("enduser.id", userId);
        activity?.SetTag("tenant.id", tenantId);
    }

    /// <summary>
    /// إضافة معلومات العملية التجارية
    /// </summary>
    public static void SetBusinessContext(this Activity? activity, string operation, string? entityType = null, string? entityId = null)
    {
        activity?.SetTag("business.operation", operation);
        if (entityType != null) activity?.SetTag("business.entity_type", entityType);
        if (entityId != null) activity?.SetTag("business.entity_id", entityId);
    }
}

/// <summary>
/// Custom Span Processor لإضافة معلومات إضافية
/// </summary>
public class MasaratSpanProcessor : BaseProcessor<Activity>
{
    public override void OnStart(Activity data)
    {
        // Add correlation ID if not present
        if (string.IsNullOrEmpty(data.GetTagItem("correlation_id")?.ToString()))
        {
            data.SetTag("correlation_id", Activity.Current?.TraceId.ToString() ?? Guid.NewGuid().ToString());
        }

        base.OnStart(data);
    }

    public override void OnEnd(Activity data)
    {
        // Calculate duration in milliseconds
        data.SetTag("duration_ms", data.Duration.TotalMilliseconds);

        base.OnEnd(data);
    }
}
