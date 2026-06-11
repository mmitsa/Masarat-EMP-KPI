using Masarat.Core.Configuration;
using Masarat.Core.Logging;
using Masarat.Core.Monitoring;
using Masarat.Core.Services.Caching;
using Masarat.Core.Extensions;
using Masarat.Core.Middleware;
using Masarat.Core.Resilience;
using Masarat.Core.Database;
using Masarat.Core.MultiTenancy;
using Masarat.Core.RateLimiting;
using Masarat.EPM.Application.Services;
using Masarat.EPM.Infrastructure.Data;
using Masarat.EPM.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MassTransit;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);
LoggingConfiguration.ConfigureLogging(builder, "EPMAPI");
builder.ResolveConfigPlaceholders();

// Kestrel Performance Tuning
builder.WebHost.ConfigureKestrel(options =>
{
    options.AddServerHeader = false;
    options.Limits.MaxConcurrentConnections = 1000;
    options.Limits.MaxRequestBodySize = 50 * 1024 * 1024;
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(30);
});

// Add Observability Services (Logging, Tracing, Caching)
builder.Services.AddObservability(builder.Configuration);
builder.Services.AddTenantAwareCaching();
builder.Services.AddResilientHttpClients(builder.Configuration);

// Register TenantConnectionInterceptor for database tenant isolation
builder.Services.AddScoped<Masarat.Core.Database.TenantConnectionInterceptor>();

// Database Context
builder.Services.AddDbContext<EPMDbContext>((sp, options) =>
{
    var connectionString = builder.Configuration.GetConnectionString("EPMConnection");
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException("ConnectionStrings:EPMConnection must be configured for PostgreSQL");
    }

    options.UseNpgsql(connectionString, npgsql =>
    {
        npgsql.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorCodesToAdd: null);
    });
});

// ═══════════════════════════════════════════════════════════════
// Multi-Tenancy & Rate Limiting
// ═══════════════════════════════════════════════════════════════
builder.Services.AddMultiTenancy();
builder.Services.AddTenantRateLimiting();

// Dependency Injection - Services
builder.Services.AddScoped<IPerformanceCharterService, PerformanceCharterService>();
builder.Services.AddScoped<IGoalService, GoalService>();
builder.Services.AddScoped<IEvaluationService, EvaluationService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IEmployeeIntegrationService, EmployeeIntegrationService>();

builder.Services.AddHttpClient("HrIntegration", client =>
{
    var baseUrl = builder.Configuration["Integrations:HR:BaseUrl"]
        ?? builder.Configuration["Services:HRService:Url"]
        ?? "http://localhost:5001";

    client.BaseAddress = new Uri(baseUrl.TrimEnd('/'));
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");
});

// ═══════════════════════════════════════════════════════════════
// MassTransit Event Bus - HR Integration
// ═══════════════════════════════════════════════════════════════
var useRabbitMQ = builder.Configuration.GetValue<bool>("UseRabbitMQ", false);
builder.Services.AddMassTransit(x =>
{
    x.AddConsumersFromNamespaceContaining<Masarat.EPM.API.Consumers.EmployeeUpdatedConsumer>();

    if (useRabbitMQ)
    {
        x.UsingRabbitMq((context, cfg) =>
        {
            var rabbitHost = builder.Configuration["RabbitMQ:Host"] ?? "localhost";
            var rabbitPassword = builder.Configuration["RabbitMQ:Password"] ?? "guest";
            cfg.Host(rabbitHost, "/masarat", h =>
            {
                h.Username("masarat");
                h.Password(rabbitPassword);
            });
            cfg.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
            cfg.ConfigureEndpoints(context);
        });
    }
    else
    {
        x.UsingInMemory((context, cfg) => cfg.ConfigureEndpoints(context));
    }
});

// Response Compression (Gzip + Brotli)
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
    options.MimeTypes = Microsoft.AspNetCore.ResponseCompression.ResponseCompressionDefaults.MimeTypes.Concat(
        new[] { "application/json", "text/json", "application/xml" });
});
builder.Services.Configure<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProviderOptions>(options =>
    options.Level = System.IO.Compression.CompressionLevel.Fastest);
builder.Services.Configure<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProviderOptions>(options =>
    options.Level = System.IO.Compression.CompressionLevel.SmallestSize);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Masarat EPM API - نظام تقييم أداء الموظفين",
        Version = "v1",
        Description = @"
## واجهة برمجة تطبيقات تقييم الأداء - مسارات

### الوحدات المتاحة:
- **الأهداف (Goals)**: إدارة أهداف الأداء
- **مؤشرات الأداء (KPIs)**: مؤشرات القياس
- **المراجعات (Reviews)**: دورات التقييم
- **الملاحظات (Feedback)**: ملاحظات الأداء
- **التقارير (Reports)**: تقارير الأداء
",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "فريق مسارات التقني",
            Email = "support@masarat.sa"
        }
    });
    
    // Include XML comments
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
    
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "أدخل توكن JWT. مثال: Bearer eyJhbGciOi..."
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? (builder.Environment.IsDevelopment()
                ? new[] { "http://localhost:3000", "http://localhost:3008", "http://localhost:5173" }
                : new[] { "https://dashboard.masarat.sa" });

        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
              .AllowCredentials();
    });
});

builder.Services.AddHealthChecks();

// Authentication & Authorization - HS256 tokens from OtpAuthController
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey))
{
    throw new InvalidOperationException("Jwt:Key must be configured for token validation");
}
var symmetricKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtKey));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Disable OIDC discovery - use manual symmetric key configuration
        options.RequireHttpsMetadata = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = symmetricKey,
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5)
        };
    });

builder.Services.AddAuthorization(options =>
{
    // API-specific policies
    options.AddPolicy("epm:read", policy =>
        policy.RequireClaim("permission", "epm:read"));
    options.AddPolicy("epm:write", policy =>
        policy.RequireClaim("permission", "epm:write"));
    options.AddPolicy("epm:admin", policy =>
        policy.RequireClaim("permission", "epm:admin"));
});

var app = builder.Build();

app.UseResponseCompression();

// Security Headers (defense-in-depth - must be early in pipeline)
app.UseSecurityHeaders();

// Database initialization
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<EPMDbContext>();
    try
    {
        var initializeMode = app.Configuration["Database:InitializeMode"] ?? "EnsureCreated";
        if (initializeMode.Equals("Migrate", StringComparison.OrdinalIgnoreCase))
        {
            await context.Database.MigrateAsync();
        }
        else if (initializeMode.Equals("EnsureCreated", StringComparison.OrdinalIgnoreCase))
        {
            await context.Database.EnsureCreatedAsync();
        }

        app.Logger.LogInformation("EPM PostgreSQL database initialized with mode {Mode}", initializeMode);
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error initializing EPM PostgreSQL database");
    }
}

// Add Observability Middleware (Global exception handler, logging, tracing)
app.UseObservability();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseMultiTenancy();
app.UseTenantRateLimiting();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
