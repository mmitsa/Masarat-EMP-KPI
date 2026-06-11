using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace Masarat.Core.Middleware;

/// <summary>
/// 🛡️ TenantContextMiddleware - تعيين سياق المستأجر لـ Row-Level Security
///
/// يقوم هذا الـ Middleware بتعيين SESSION_CONTEXT في SQL Server
/// بناءً على TenantId المستخرج من JWT Token
/// </summary>
public class TenantContextMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantContextMiddleware> _logger;

    public TenantContextMiddleware(RequestDelegate next, ILogger<TenantContextMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IConfiguration configuration)
    {
        // استخراج TenantId من الـ Claims
        var tenantId = GetTenantIdFromClaims(context.User);
        var userId = GetUserIdFromClaims(context.User);
        var isSuperAdmin = IsSuperAdmin(context.User);

        // تخزين في HttpContext.Items للوصول لاحقاً
        context.Items["TenantId"] = tenantId;
        context.Items["UserId"] = userId;
        context.Items["IsSuperAdmin"] = isSuperAdmin;

        _logger.LogDebug(
            "Tenant context set: TenantId={TenantId}, UserId={UserId}, IsSuperAdmin={IsSuperAdmin}",
            tenantId, userId, isSuperAdmin);

        await _next(context);
    }

    private int? GetTenantIdFromClaims(ClaimsPrincipal user)
    {
        var tenantClaim = user.FindFirst("tenant_id")
                       ?? user.FindFirst("TenantId")
                       ?? user.FindFirst("ProfileId");

        if (tenantClaim != null && int.TryParse(tenantClaim.Value, out var tenantId))
        {
            return tenantId;
        }

        return null;
    }

    private int? GetUserIdFromClaims(ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)
                        ?? user.FindFirst("sub")
                        ?? user.FindFirst("UserId");

        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
        {
            return userId;
        }

        return null;
    }

    private bool IsSuperAdmin(ClaimsPrincipal user)
    {
        return user.IsInRole("super_admin") || user.IsInRole("SuperAdmin");
    }
}

/// <summary>
/// 🛡️ TenantAwareDbConnection - اتصال قاعدة بيانات واعٍ بالمستأجر
///
/// يقوم تلقائياً بتعيين SESSION_CONTEXT عند فتح الاتصال
/// </summary>
public class TenantAwareDbConnection : IAsyncDisposable, IDisposable
{
    private readonly SqlConnection _connection;
    private readonly ILogger _logger;
    private readonly int? _tenantId;
    private readonly int? _userId;
    private readonly bool _isSuperAdmin;

    public TenantAwareDbConnection(
        string connectionString,
        int? tenantId,
        int? userId,
        bool isSuperAdmin,
        ILogger logger)
    {
        _connection = new SqlConnection(connectionString);
        _tenantId = tenantId;
        _userId = userId;
        _isSuperAdmin = isSuperAdmin;
        _logger = logger;
    }

    public SqlConnection Connection => _connection;

    /// <summary>
    /// فتح الاتصال مع تعيين سياق المستأجر
    /// </summary>
    public async Task OpenAsync(CancellationToken cancellationToken = default)
    {
        await _connection.OpenAsync(cancellationToken);
        await SetTenantContextAsync(cancellationToken);
    }

    /// <summary>
    /// تعيين سياق المستأجر في SQL Server
    /// </summary>
    private async Task SetTenantContextAsync(CancellationToken cancellationToken)
    {
        if (_tenantId == null && !_isSuperAdmin)
        {
            _logger.LogWarning("No TenantId available for RLS context");
            return;
        }

        try
        {
            await using var cmd = _connection.CreateCommand();
            cmd.CommandText = "EXEC Security.sp_SetTenantContext @TenantId, @UserId, @IsSuperAdmin";

            // TenantId = 0 للـ super_admin (وصول كامل)
            cmd.Parameters.AddWithValue("@TenantId", _isSuperAdmin ? 0 : (_tenantId ?? 0));
            cmd.Parameters.AddWithValue("@UserId", (object?)_userId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IsSuperAdmin", _isSuperAdmin);

            await cmd.ExecuteNonQueryAsync(cancellationToken);

            _logger.LogDebug(
                "SQL SESSION_CONTEXT set: TenantId={TenantId}, UserId={UserId}",
                _isSuperAdmin ? 0 : _tenantId, _userId);
        }
        catch (SqlException ex) when (ex.Number == 2812) // Procedure not found
        {
            // الإجراء غير موجود - استخدام الطريقة المباشرة
            _logger.LogWarning("sp_SetTenantContext not found, using direct sp_set_session_context");
            await SetTenantContextDirectAsync(cancellationToken);
        }
    }

    /// <summary>
    /// تعيين سياق المستأجر مباشرة (إذا لم يكن الإجراء المخزن موجوداً)
    /// </summary>
    private async Task SetTenantContextDirectAsync(CancellationToken cancellationToken)
    {
        var effectiveTenantId = _isSuperAdmin ? 0 : (_tenantId ?? 0);

        await using var cmd = _connection.CreateCommand();
        cmd.CommandText = "EXEC sp_set_session_context N'TenantId', @TenantId";
        cmd.Parameters.AddWithValue("@TenantId", effectiveTenantId);
        await cmd.ExecuteNonQueryAsync(cancellationToken);

        if (_userId.HasValue)
        {
            await using var userCmd = _connection.CreateCommand();
            userCmd.CommandText = "EXEC sp_set_session_context N'UserId', @UserId";
            userCmd.Parameters.AddWithValue("@UserId", _userId.Value);
            await userCmd.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    public void Dispose()
    {
        _connection.Dispose();
    }

    public async ValueTask DisposeAsync()
    {
        await _connection.DisposeAsync();
    }
}

/// <summary>
/// 🛡️ ITenantDbConnectionFactory - مصنع اتصالات واعية بالمستأجر
/// </summary>
public interface ITenantDbConnectionFactory
{
    TenantAwareDbConnection CreateConnection();
}

/// <summary>
/// 🛡️ TenantDbConnectionFactory - تنفيذ مصنع الاتصالات
/// </summary>
public class TenantDbConnectionFactory : ITenantDbConnectionFactory
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TenantAwareDbConnection> _logger;
    private readonly string _connectionStringName;

    public TenantDbConnectionFactory(
        IHttpContextAccessor httpContextAccessor,
        IConfiguration configuration,
        ILogger<TenantAwareDbConnection> logger,
        string connectionStringName = "DefaultConnection")
    {
        _httpContextAccessor = httpContextAccessor;
        _configuration = configuration;
        _logger = logger;
        _connectionStringName = connectionStringName;
    }

    public TenantAwareDbConnection CreateConnection()
    {
        var httpContext = _httpContextAccessor.HttpContext;

        var tenantId = httpContext?.Items["TenantId"] as int?;
        var userId = httpContext?.Items["UserId"] as int?;
        var isSuperAdmin = httpContext?.Items["IsSuperAdmin"] as bool? ?? false;

        var connectionString = _configuration.GetConnectionString(_connectionStringName)
            ?? throw new InvalidOperationException($"Connection string '{_connectionStringName}' not found");

        return new TenantAwareDbConnection(
            connectionString,
            tenantId,
            userId,
            isSuperAdmin,
            _logger);
    }
}

/// <summary>
/// Extension methods لتسجيل الخدمات
/// </summary>
public static class TenantContextExtensions
{
    /// <summary>
    /// إضافة Tenant Context Middleware والخدمات المرتبطة
    /// </summary>
    public static IServiceCollection AddTenantContext(
        this IServiceCollection services,
        string connectionStringName = "DefaultConnection")
    {
        services.AddHttpContextAccessor();

        services.AddScoped<ITenantDbConnectionFactory>(sp =>
        {
            var httpContextAccessor = sp.GetRequiredService<IHttpContextAccessor>();
            var configuration = sp.GetRequiredService<IConfiguration>();
            var logger = sp.GetRequiredService<ILogger<TenantAwareDbConnection>>();

            return new TenantDbConnectionFactory(
                httpContextAccessor,
                configuration,
                logger,
                connectionStringName);
        });

        return services;
    }

    /// <summary>
    /// استخدام Tenant Context Middleware
    /// </summary>
    public static IApplicationBuilder UseTenantContext(this IApplicationBuilder app)
    {
        return app.UseMiddleware<TenantContextMiddleware>();
    }
}
