using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;
using System.Reflection;

namespace Masarat.Core.Extensions;

/// <summary>
/// امتدادات Swagger المحسنة
/// Enhanced Swagger Extensions for all Masarat services
/// </summary>
public static class SwaggerExtensions
{
    /// <summary>
    /// إضافة تكوين Swagger المحسن
    /// Add enhanced Swagger configuration
    /// </summary>
    public static IServiceCollection AddMasaratSwagger(
        this IServiceCollection services,
        string serviceName,
        string serviceVersion = "v1",
        string? description = null)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc(serviceVersion, new OpenApiInfo
            {
                Title = $"Masarat {serviceName} API",
                Version = serviceVersion,
                Description = description ?? $"API documentation for Masarat {serviceName} - توثيق واجهة برمجة {serviceName}",
                Contact = new OpenApiContact
                {
                    Name = "Masarat Support",
                    Email = "support@masarat.sa",
                    Url = new Uri("https://masarat.sa")
                },
                License = new OpenApiLicense
                {
                    Name = "Proprietary",
                    Url = new Uri("https://masarat.sa/license")
                }
            });

            // JWT Authentication
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Description = "JWT Authorization header using the Bearer scheme.\n\n" +
                              "Enter 'Bearer' [space] and then your token in the text input below.\n\n" +
                              "Example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer",
                BearerFormat = "JWT"
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
                        },
                        Scheme = "oauth2",
                        Name = "Bearer",
                        In = ParameterLocation.Header
                    },
                    new List<string>()
                }
            });

            // Include XML comments if available
            try
            {
                var xmlFile = $"{Assembly.GetEntryAssembly()?.GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                if (File.Exists(xmlPath))
                {
                    options.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
                }
            }
            catch
            {
                // XML comments not available
            }

            // Custom schema IDs to handle Arabic characters
            options.CustomSchemaIds(type => type.FullName?.Replace("+", "."));

            // Operation filters
            options.OperationFilter<SwaggerDefaultValuesFilter>();

            // Document filters
            options.DocumentFilter<SwaggerArabicSupportFilter>();

            // Enable annotations
            options.EnableAnnotations();

            // Add response examples
            options.OperationFilter<SwaggerResponseExamplesFilter>();
        });

        return services;
    }

    /// <summary>
    /// استخدام Swagger UI المحسن
    /// Use enhanced Swagger UI
    /// </summary>
    public static IApplicationBuilder UseMasaratSwagger(
        this IApplicationBuilder app,
        string serviceName,
        string serviceVersion = "v1",
        bool enableDarkMode = false)
    {
        app.UseSwagger(options =>
        {
            options.RouteTemplate = "swagger/{documentName}/swagger.json";
        });

        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint($"/swagger/{serviceVersion}/swagger.json", $"Masarat {serviceName} {serviceVersion}");
            options.RoutePrefix = "swagger";
            options.DocumentTitle = $"Masarat {serviceName} - API Documentation";

            // UI Configuration
            options.DefaultModelsExpandDepth(2);
            options.DefaultModelRendering(Swashbuckle.AspNetCore.SwaggerUI.ModelRendering.Example);
            options.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.None);
            options.EnableDeepLinking();
            options.DisplayRequestDuration();
            options.ShowExtensions();
            options.EnableFilter();
            options.EnableTryItOutByDefault();

            // Custom CSS for RTL support
            options.HeadContent = @"
                <style>
                    /* RTL Support for Arabic */
                    .swagger-ui .opblock-tag-section .opblock-tag,
                    .swagger-ui .opblock-summary-description,
                    .swagger-ui .markdown p,
                    .swagger-ui .model-title {
                        direction: rtl;
                        text-align: right;
                    }

                    /* Custom branding */
                    .swagger-ui .topbar {
                        background-color: #1d4ed8;
                    }

                    .swagger-ui .topbar-wrapper .link span {
                        color: white;
                        font-weight: bold;
                    }

                    .swagger-ui .topbar-wrapper .link::after {
                        content: ' - مسارات API';
                        color: white;
                    }
                </style>";
        });

        return app;
    }
}

/// <summary>
/// فلتر للقيم الافتراضية
/// Default Values Filter
/// </summary>
public class SwaggerDefaultValuesFilter : Swashbuckle.AspNetCore.SwaggerGen.IOperationFilter
{
    public void Apply(OpenApiOperation operation, Swashbuckle.AspNetCore.SwaggerGen.OperationFilterContext context)
    {
        var apiDescription = context.ApiDescription;

        // Add deprecation notice
        operation.Deprecated |= apiDescription.IsDeprecated();

        // Set default response
        if (operation.Responses.Count == 0)
        {
            operation.Responses.Add("200", new OpenApiResponse { Description = "Success" });
        }

        // Add common error responses
        if (!operation.Responses.ContainsKey("401"))
        {
            operation.Responses.Add("401", new OpenApiResponse
            {
                Description = "Unauthorized - غير مصرح"
            });
        }

        if (!operation.Responses.ContainsKey("500"))
        {
            operation.Responses.Add("500", new OpenApiResponse
            {
                Description = "Internal Server Error - خطأ في الخادم"
            });
        }
    }
}

/// <summary>
/// فلتر لدعم اللغة العربية
/// Arabic Support Filter
/// </summary>
public class SwaggerArabicSupportFilter : Swashbuckle.AspNetCore.SwaggerGen.IDocumentFilter
{
    public void Apply(OpenApiDocument swaggerDoc, Swashbuckle.AspNetCore.SwaggerGen.DocumentFilterContext context)
    {
        // Add Arabic descriptions to common tags
        var arabicTags = new Dictionary<string, string>
        {
            { "Employees", "الموظفين" },
            { "Departments", "الأقسام" },
            { "Jobs", "الوظائف" },
            { "Attendance", "الحضور والانصراف" },
            { "Leaves", "الإجازات" },
            { "Warehouses", "المستودعات" },
            { "Items", "الأصناف" },
            { "Receipts", "سندات الاستلام" },
            { "FixedAssets", "الأصول الثابتة" },
            { "Dashboard", "لوحة التحكم" },
            { "Reports", "التقارير" },
            { "Settings", "الإعدادات" },
            { "Users", "المستخدمين" },
            { "Roles", "الأدوار" },
            { "Permissions", "الصلاحيات" }
        };

        foreach (var tag in swaggerDoc.Tags)
        {
            if (arabicTags.TryGetValue(tag.Name, out var arabicName))
            {
                tag.Description = $"{arabicName} - {tag.Description}";
            }
        }
    }
}

/// <summary>
/// فلتر لأمثلة الاستجابات
/// Response Examples Filter
/// </summary>
public class SwaggerResponseExamplesFilter : Swashbuckle.AspNetCore.SwaggerGen.IOperationFilter
{
    public void Apply(OpenApiOperation operation, Swashbuckle.AspNetCore.SwaggerGen.OperationFilterContext context)
    {
        // Add example for 400 Bad Request
        if (operation.Responses.TryGetValue("400", out var badRequest))
        {
            badRequest.Content ??= new Dictionary<string, OpenApiMediaType>();
            if (!badRequest.Content.ContainsKey("application/json"))
            {
                badRequest.Content["application/json"] = new OpenApiMediaType
                {
                    Example = new Microsoft.OpenApi.Any.OpenApiObject
                    {
                        ["status"] = new Microsoft.OpenApi.Any.OpenApiString("error"),
                        ["error"] = new Microsoft.OpenApi.Any.OpenApiObject
                        {
                            ["code"] = new Microsoft.OpenApi.Any.OpenApiString("VALIDATION_ERROR"),
                            ["message"] = new Microsoft.OpenApi.Any.OpenApiString("خطأ في التحقق من البيانات")
                        }
                    }
                };
            }
        }
    }
}

/// <summary>
/// Extension method to check if an API is deprecated
/// </summary>
internal static class ApiDescriptionExtensions
{
    public static bool IsDeprecated(this Microsoft.AspNetCore.Mvc.ApiExplorer.ApiDescription apiDescription)
    {
        return apiDescription.ActionDescriptor.EndpointMetadata
            .OfType<ObsoleteAttribute>()
            .Any();
    }
}
