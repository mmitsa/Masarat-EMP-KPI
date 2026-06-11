using Asp.Versioning;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Masarat.Core.Versioning;

/// <summary>
/// تكوين API Versioning
/// </summary>
public static class ApiVersioningConfiguration
{
    /// <summary>
    /// إضافة API Versioning
    /// </summary>
    public static IServiceCollection AddMasaratApiVersioning(this IServiceCollection services)
    {
        services.AddApiVersioning(options =>
        {
            // Default version when not specified
            options.DefaultApiVersion = new ApiVersion(1, 0);

            // Assume default version when version not specified
            options.AssumeDefaultVersionWhenUnspecified = true;

            // Report API versions in response headers
            options.ReportApiVersions = true;

            // Read version from multiple sources
            options.ApiVersionReader = ApiVersionReader.Combine(
                new UrlSegmentApiVersionReader(),           // /api/v1/...
                new HeaderApiVersionReader("X-Api-Version"), // X-Api-Version: 1.0
                new QueryStringApiVersionReader("api-version"), // ?api-version=1.0
                new MediaTypeApiVersionReader("version")    // Accept: application/json;version=1.0
            );
        })
        .AddMvc()
        .AddApiExplorer(options =>
        {
            // Version format: 'v'major[.minor][-status]
            options.GroupNameFormat = "'v'VVV";

            // Substitute version in URL
            options.SubstituteApiVersionInUrl = true;
        });

        return services;
    }

    /// <summary>
    /// تكوين Swagger مع دعم الإصدارات
    /// </summary>
    public static IServiceCollection AddVersionedSwagger(
        this IServiceCollection services,
        string title,
        string description)
    {
        services.AddSwaggerGen(options =>
        {
            // Create swagger doc for each version
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = $"{title} V1",
                Version = "v1",
                Description = $"{description} - الإصدار 1.0",
                Contact = new OpenApiContact
                {
                    Name = "Masarat Support",
                    Email = "support@masarat.sa",
                    Url = new Uri("https://masarat.sa/support")
                },
                License = new OpenApiLicense
                {
                    Name = "Proprietary",
                    Url = new Uri("https://masarat.sa/license")
                }
            });

            options.SwaggerDoc("v2", new OpenApiInfo
            {
                Title = $"{title} V2",
                Version = "v2",
                Description = $"{description} - الإصدار 2.0 (Beta)",
                Contact = new OpenApiContact
                {
                    Name = "Masarat Support",
                    Email = "support@masarat.sa"
                }
            });

            // Add security definition
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description = "أدخل رمز JWT الخاص بك"
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });

            // Add operation filters
            options.OperationFilter<ApiVersionOperationFilter>();
            options.OperationFilter<DeprecatedOperationFilter>();

            // Include XML comments
            var xmlFiles = Directory.GetFiles(AppContext.BaseDirectory, "*.xml");
            foreach (var xmlFile in xmlFiles)
            {
                options.IncludeXmlComments(xmlFile, includeControllerXmlComments: true);
            }
        });

        return services;
    }

    /// <summary>
    /// استخدام Swagger UI مع الإصدارات
    /// </summary>
    public static IApplicationBuilder UseVersionedSwagger(this IApplicationBuilder app)
    {
        app.UseSwagger(options =>
        {
            options.RouteTemplate = "swagger/{documentName}/swagger.json";
        });

        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "Masarat API V1");
            options.SwaggerEndpoint("/swagger/v2/swagger.json", "Masarat API V2 (Beta)");

            options.RoutePrefix = "swagger";
            options.DocumentTitle = "Masarat API Documentation";
            options.DefaultModelsExpandDepth(-1);
            options.DisplayRequestDuration();
            options.EnableDeepLinking();
            options.EnableFilter();
            options.ShowExtensions();
        });

        return app;
    }
}

/// <summary>
/// فلتر لإضافة معلومات الإصدار للعمليات
/// </summary>
public class ApiVersionOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var apiVersionMetadata = context.ApiDescription.ActionDescriptor.EndpointMetadata
            .OfType<ApiVersionAttribute>()
            .FirstOrDefault();

        if (apiVersionMetadata != null)
        {
            operation.Description += $"\n\n**API Version:** {string.Join(", ", apiVersionMetadata.Versions)}";
        }

        // Add version parameter if not URL-based
        var hasVersionParam = operation.Parameters?.Any(p =>
            p.Name.Equals("api-version", StringComparison.OrdinalIgnoreCase) ||
            p.Name.Equals("X-Api-Version", StringComparison.OrdinalIgnoreCase)) ?? false;

        if (!hasVersionParam && !context.ApiDescription.RelativePath?.Contains("{version}") == true)
        {
            operation.Parameters ??= new List<OpenApiParameter>();
            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "X-Api-Version",
                In = ParameterLocation.Header,
                Required = false,
                Schema = new OpenApiSchema
                {
                    Type = "string",
                    Default = new Microsoft.OpenApi.Any.OpenApiString("1.0")
                },
                Description = "API version (e.g., 1.0, 2.0)"
            });
        }
    }
}

/// <summary>
/// فلتر لتمييز العمليات المهملة
/// </summary>
public class DeprecatedOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var isDeprecated = context.MethodInfo.GetCustomAttributes(typeof(ObsoleteAttribute), false).Any()
            || context.MethodInfo.DeclaringType?.GetCustomAttributes(typeof(ObsoleteAttribute), false).Any() == true;

        if (isDeprecated)
        {
            operation.Deprecated = true;
            operation.Description = "⚠️ **DEPRECATED** - " + operation.Description;
        }
    }
}

/// <summary>
/// Base Controller مع دعم الإصدارات
/// </summary>
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
public abstract class VersionedApiController : ControllerBase
{
    /// <summary>
    /// الحصول على إصدار API الحالي
    /// </summary>
    protected ApiVersion CurrentApiVersion =>
        HttpContext.GetRequestedApiVersion() ?? new ApiVersion(1, 0);
}

/// <summary>
/// Attributes للتحكم في الإصدارات
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class ApiV1Attribute : ApiVersionAttribute
{
    public ApiV1Attribute() : base(new ApiVersion(1, 0)) { }
}

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class ApiV2Attribute : ApiVersionAttribute
{
    public ApiV2Attribute() : base(new ApiVersion(2, 0)) { }
}

/// <summary>
/// Version negotiation للاستجابات المختلفة
/// </summary>
public interface IVersionedResponse<T>
{
    T GetResponse(ApiVersion version);
}

public static class VersionedResponseExtensions
{
    public static T ForVersion<T>(this IVersionedResponse<T> response, ApiVersion version)
    {
        return response.GetResponse(version);
    }
}
