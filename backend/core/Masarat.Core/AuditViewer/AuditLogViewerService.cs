using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Data;
using System.Text.Json;

namespace Masarat.Core.AuditViewer;

/// <summary>
/// خدمة عرض سجلات التدقيق
/// Centralized Audit Log Viewer Service
/// </summary>
public interface IAuditLogViewerService
{
    Task<PagedAuditResult> GetAuditLogsAsync(AuditLogQuery query);
    Task<AuditLogEntry?> GetAuditLogByIdAsync(long id);
    Task<AuditLogStatistics> GetStatisticsAsync(string? tenantId, DateTime? from, DateTime? to);
    Task<IEnumerable<AuditLogEntry>> GetUserActivityAsync(string userId, int days = 30);
    Task<IEnumerable<AuditLogEntry>> GetEntityHistoryAsync(string entityType, string entityId);
    Task<IEnumerable<AuditSummary>> GetDailyActivitySummaryAsync(string? tenantId, int days = 30);
    Task<IEnumerable<string>> GetDistinctActionsAsync(string? tenantId = null);
    Task<IEnumerable<string>> GetDistinctEntityTypesAsync(string? tenantId = null);
}

public class AuditLogViewerService : IAuditLogViewerService
{
    private readonly string _connectionString;
    private readonly ILogger<AuditLogViewerService> _logger;

    public AuditLogViewerService(
        IConfiguration configuration,
        ILogger<AuditLogViewerService> logger)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new ArgumentNullException("Connection string is required");
        _logger = logger;
    }

    /// <summary>
    /// البحث في سجلات التدقيق مع الفلترة والترتيب والتصفح
    /// </summary>
    public async Task<PagedAuditResult> GetAuditLogsAsync(AuditLogQuery query)
    {
        var result = new PagedAuditResult
        {
            Page = query.Page,
            PageSize = query.PageSize
        };

        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // Build WHERE clause dynamically
            var whereConditions = new List<string> { "1=1" };
            var parameters = new List<SqlParameter>();

            if (!string.IsNullOrEmpty(query.TenantId))
            {
                whereConditions.Add("TenantId = @TenantId");
                parameters.Add(new SqlParameter("@TenantId", query.TenantId));
            }

            if (!string.IsNullOrEmpty(query.UserId))
            {
                whereConditions.Add("UserId = @UserId");
                parameters.Add(new SqlParameter("@UserId", query.UserId));
            }

            if (!string.IsNullOrEmpty(query.Action))
            {
                whereConditions.Add("Action = @Action");
                parameters.Add(new SqlParameter("@Action", query.Action));
            }

            if (!string.IsNullOrEmpty(query.EntityType))
            {
                whereConditions.Add("EntityType = @EntityType");
                parameters.Add(new SqlParameter("@EntityType", query.EntityType));
            }

            if (!string.IsNullOrEmpty(query.EntityId))
            {
                whereConditions.Add("EntityId = @EntityId");
                parameters.Add(new SqlParameter("@EntityId", query.EntityId));
            }

            if (query.FromDate.HasValue)
            {
                whereConditions.Add("Timestamp >= @FromDate");
                parameters.Add(new SqlParameter("@FromDate", query.FromDate.Value));
            }

            if (query.ToDate.HasValue)
            {
                whereConditions.Add("Timestamp <= @ToDate");
                parameters.Add(new SqlParameter("@ToDate", query.ToDate.Value));
            }

            if (!string.IsNullOrEmpty(query.SearchTerm))
            {
                whereConditions.Add("(UserName LIKE @Search OR Action LIKE @Search OR EntityType LIKE @Search OR OldValues LIKE @Search OR NewValues LIKE @Search)");
                parameters.Add(new SqlParameter("@Search", $"%{query.SearchTerm}%"));
            }

            if (query.Module.HasValue)
            {
                whereConditions.Add("Module = @Module");
                parameters.Add(new SqlParameter("@Module", (int)query.Module.Value));
            }

            if (!string.IsNullOrEmpty(query.IpAddress))
            {
                whereConditions.Add("IpAddress = @IpAddress");
                parameters.Add(new SqlParameter("@IpAddress", query.IpAddress));
            }

            var whereClause = string.Join(" AND ", whereConditions);

            // Get total count
            var countQuery = $@"
                SELECT COUNT(*)
                FROM Core.AuditLogs
                WHERE {whereClause}";

            await using (var countCmd = new SqlCommand(countQuery, connection))
            {
                countCmd.Parameters.AddRange(parameters.ToArray());
                result.TotalCount = (int)(await countCmd.ExecuteScalarAsync() ?? 0);
            }

            result.TotalPages = (int)Math.Ceiling((double)result.TotalCount / query.PageSize);

            // Get paginated data
            var sortColumn = GetSortColumn(query.SortBy);
            var sortOrder = query.SortDescending ? "DESC" : "ASC";
            var offset = (query.Page - 1) * query.PageSize;

            var dataQuery = $@"
                SELECT
                    Id, TenantId, UserId, UserName, Action, EntityType, EntityId,
                    OldValues, NewValues, Timestamp, IpAddress, UserAgent,
                    Module, CorrelationId, AdditionalInfo
                FROM Core.AuditLogs
                WHERE {whereClause}
                ORDER BY {sortColumn} {sortOrder}
                OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

            await using (var dataCmd = new SqlCommand(dataQuery, connection))
            {
                // Re-create parameters for data query
                foreach (var param in parameters)
                {
                    dataCmd.Parameters.Add(new SqlParameter(param.ParameterName, param.Value));
                }
                dataCmd.Parameters.Add(new SqlParameter("@Offset", offset));
                dataCmd.Parameters.Add(new SqlParameter("@PageSize", query.PageSize));

                var entries = new List<AuditLogEntry>();
                await using var reader = await dataCmd.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    entries.Add(MapToAuditLogEntry(reader));
                }

                result.Items = entries;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error querying audit logs");
            throw;
        }

        return result;
    }

    /// <summary>
    /// الحصول على سجل تدقيق محدد بواسطة المعرف
    /// </summary>
    public async Task<AuditLogEntry?> GetAuditLogByIdAsync(long id)
    {
        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = @"
                SELECT
                    Id, TenantId, UserId, UserName, Action, EntityType, EntityId,
                    OldValues, NewValues, Timestamp, IpAddress, UserAgent,
                    Module, CorrelationId, AdditionalInfo
                FROM Core.AuditLogs
                WHERE Id = @Id";

            await using var cmd = new SqlCommand(query, connection);
            cmd.Parameters.Add(new SqlParameter("@Id", id));

            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapToAuditLogEntry(reader);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit log by ID: {Id}", id);
            throw;
        }

        return null;
    }

    /// <summary>
    /// الحصول على إحصائيات سجلات التدقيق
    /// </summary>
    public async Task<AuditLogStatistics> GetStatisticsAsync(string? tenantId, DateTime? from, DateTime? to)
    {
        var stats = new AuditLogStatistics();

        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var whereConditions = new List<string> { "1=1" };
            var parameters = new List<SqlParameter>();

            if (!string.IsNullOrEmpty(tenantId))
            {
                whereConditions.Add("TenantId = @TenantId");
                parameters.Add(new SqlParameter("@TenantId", tenantId));
            }

            if (from.HasValue)
            {
                whereConditions.Add("Timestamp >= @From");
                parameters.Add(new SqlParameter("@From", from.Value));
            }

            if (to.HasValue)
            {
                whereConditions.Add("Timestamp <= @To");
                parameters.Add(new SqlParameter("@To", to.Value));
            }

            var whereClause = string.Join(" AND ", whereConditions);

            // Total count
            var countQuery = $"SELECT COUNT(*) FROM Core.AuditLogs WHERE {whereClause}";
            await using (var cmd = new SqlCommand(countQuery, connection))
            {
                cmd.Parameters.AddRange(parameters.Select(p => new SqlParameter(p.ParameterName, p.Value)).ToArray());
                stats.TotalEntries = (int)(await cmd.ExecuteScalarAsync() ?? 0);
            }

            // Unique users
            var usersQuery = $"SELECT COUNT(DISTINCT UserId) FROM Core.AuditLogs WHERE {whereClause}";
            await using (var cmd = new SqlCommand(usersQuery, connection))
            {
                cmd.Parameters.AddRange(parameters.Select(p => new SqlParameter(p.ParameterName, p.Value)).ToArray());
                stats.UniqueUsers = (int)(await cmd.ExecuteScalarAsync() ?? 0);
            }

            // Actions by type
            var actionsQuery = $@"
                SELECT Action, COUNT(*) as Count
                FROM Core.AuditLogs
                WHERE {whereClause}
                GROUP BY Action
                ORDER BY Count DESC";

            await using (var cmd = new SqlCommand(actionsQuery, connection))
            {
                cmd.Parameters.AddRange(parameters.Select(p => new SqlParameter(p.ParameterName, p.Value)).ToArray());
                await using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    stats.ActionCounts[reader.GetString(0)] = reader.GetInt32(1);
                }
            }

            // Entity types
            var entitiesQuery = $@"
                SELECT EntityType, COUNT(*) as Count
                FROM Core.AuditLogs
                WHERE {whereClause}
                GROUP BY EntityType
                ORDER BY Count DESC";

            await using (var cmd = new SqlCommand(entitiesQuery, connection))
            {
                cmd.Parameters.AddRange(parameters.Select(p => new SqlParameter(p.ParameterName, p.Value)).ToArray());
                await using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    stats.EntityTypeCounts[reader.GetString(0)] = reader.GetInt32(1);
                }
            }

            // Top users
            var topUsersQuery = $@"
                SELECT TOP 10 UserId, UserName, COUNT(*) as Count
                FROM Core.AuditLogs
                WHERE {whereClause}
                GROUP BY UserId, UserName
                ORDER BY Count DESC";

            await using (var cmd = new SqlCommand(topUsersQuery, connection))
            {
                cmd.Parameters.AddRange(parameters.Select(p => new SqlParameter(p.ParameterName, p.Value)).ToArray());
                await using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    stats.TopUsers.Add(new UserActivityCount
                    {
                        UserId = reader.GetString(0),
                        UserName = reader.IsDBNull(1) ? null : reader.GetString(1),
                        Count = reader.GetInt32(2)
                    });
                }
            }

            // Module distribution
            var modulesQuery = $@"
                SELECT Module, COUNT(*) as Count
                FROM Core.AuditLogs
                WHERE {whereClause} AND Module IS NOT NULL
                GROUP BY Module";

            await using (var cmd = new SqlCommand(modulesQuery, connection))
            {
                cmd.Parameters.AddRange(parameters.Select(p => new SqlParameter(p.ParameterName, p.Value)).ToArray());
                await using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var module = (AuditModule)reader.GetInt32(0);
                    stats.ModuleCounts[module.ToString()] = reader.GetInt32(1);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit statistics");
            throw;
        }

        return stats;
    }

    /// <summary>
    /// الحصول على نشاط مستخدم معين
    /// </summary>
    public async Task<IEnumerable<AuditLogEntry>> GetUserActivityAsync(string userId, int days = 30)
    {
        var entries = new List<AuditLogEntry>();

        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = @"
                SELECT TOP 1000
                    Id, TenantId, UserId, UserName, Action, EntityType, EntityId,
                    OldValues, NewValues, Timestamp, IpAddress, UserAgent,
                    Module, CorrelationId, AdditionalInfo
                FROM Core.AuditLogs
                WHERE UserId = @UserId AND Timestamp >= @FromDate
                ORDER BY Timestamp DESC";

            await using var cmd = new SqlCommand(query, connection);
            cmd.Parameters.Add(new SqlParameter("@UserId", userId));
            cmd.Parameters.Add(new SqlParameter("@FromDate", DateTime.UtcNow.AddDays(-days)));

            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                entries.Add(MapToAuditLogEntry(reader));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user activity for: {UserId}", userId);
            throw;
        }

        return entries;
    }

    /// <summary>
    /// الحصول على تاريخ كيان معين
    /// </summary>
    public async Task<IEnumerable<AuditLogEntry>> GetEntityHistoryAsync(string entityType, string entityId)
    {
        var entries = new List<AuditLogEntry>();

        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = @"
                SELECT
                    Id, TenantId, UserId, UserName, Action, EntityType, EntityId,
                    OldValues, NewValues, Timestamp, IpAddress, UserAgent,
                    Module, CorrelationId, AdditionalInfo
                FROM Core.AuditLogs
                WHERE EntityType = @EntityType AND EntityId = @EntityId
                ORDER BY Timestamp DESC";

            await using var cmd = new SqlCommand(query, connection);
            cmd.Parameters.Add(new SqlParameter("@EntityType", entityType));
            cmd.Parameters.Add(new SqlParameter("@EntityId", entityId));

            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                entries.Add(MapToAuditLogEntry(reader));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting entity history for: {EntityType}/{EntityId}", entityType, entityId);
            throw;
        }

        return entries;
    }

    /// <summary>
    /// الحصول على ملخص النشاط اليومي
    /// </summary>
    public async Task<IEnumerable<AuditSummary>> GetDailyActivitySummaryAsync(string? tenantId, int days = 30)
    {
        var summaries = new List<AuditSummary>();

        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var whereClause = string.IsNullOrEmpty(tenantId)
                ? "Timestamp >= @FromDate"
                : "TenantId = @TenantId AND Timestamp >= @FromDate";

            var query = $@"
                SELECT
                    CAST(Timestamp AS DATE) as Date,
                    COUNT(*) as TotalActions,
                    COUNT(DISTINCT UserId) as UniqueUsers,
                    SUM(CASE WHEN Action LIKE '%Create%' OR Action LIKE '%Add%' THEN 1 ELSE 0 END) as Creates,
                    SUM(CASE WHEN Action LIKE '%Update%' OR Action LIKE '%Edit%' THEN 1 ELSE 0 END) as Updates,
                    SUM(CASE WHEN Action LIKE '%Delete%' OR Action LIKE '%Remove%' THEN 1 ELSE 0 END) as Deletes,
                    SUM(CASE WHEN Action LIKE '%View%' OR Action LIKE '%Read%' OR Action LIKE '%Get%' THEN 1 ELSE 0 END) as Reads
                FROM Core.AuditLogs
                WHERE {whereClause}
                GROUP BY CAST(Timestamp AS DATE)
                ORDER BY Date DESC";

            await using var cmd = new SqlCommand(query, connection);
            if (!string.IsNullOrEmpty(tenantId))
            {
                cmd.Parameters.Add(new SqlParameter("@TenantId", tenantId));
            }
            cmd.Parameters.Add(new SqlParameter("@FromDate", DateTime.UtcNow.AddDays(-days)));

            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                summaries.Add(new AuditSummary
                {
                    Date = reader.GetDateTime(0),
                    TotalActions = reader.GetInt32(1),
                    UniqueUsers = reader.GetInt32(2),
                    Creates = reader.GetInt32(3),
                    Updates = reader.GetInt32(4),
                    Deletes = reader.GetInt32(5),
                    Reads = reader.GetInt32(6)
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting daily activity summary");
            throw;
        }

        return summaries;
    }

    /// <summary>
    /// الحصول على الإجراءات المميزة
    /// </summary>
    public async Task<IEnumerable<string>> GetDistinctActionsAsync(string? tenantId = null)
    {
        var actions = new List<string>();

        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = string.IsNullOrEmpty(tenantId)
                ? "SELECT DISTINCT Action FROM Core.AuditLogs ORDER BY Action"
                : "SELECT DISTINCT Action FROM Core.AuditLogs WHERE TenantId = @TenantId ORDER BY Action";

            await using var cmd = new SqlCommand(query, connection);
            if (!string.IsNullOrEmpty(tenantId))
            {
                cmd.Parameters.Add(new SqlParameter("@TenantId", tenantId));
            }

            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                actions.Add(reader.GetString(0));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting distinct actions");
            throw;
        }

        return actions;
    }

    /// <summary>
    /// الحصول على أنواع الكيانات المميزة
    /// </summary>
    public async Task<IEnumerable<string>> GetDistinctEntityTypesAsync(string? tenantId = null)
    {
        var entityTypes = new List<string>();

        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = string.IsNullOrEmpty(tenantId)
                ? "SELECT DISTINCT EntityType FROM Core.AuditLogs WHERE EntityType IS NOT NULL ORDER BY EntityType"
                : "SELECT DISTINCT EntityType FROM Core.AuditLogs WHERE TenantId = @TenantId AND EntityType IS NOT NULL ORDER BY EntityType";

            await using var cmd = new SqlCommand(query, connection);
            if (!string.IsNullOrEmpty(tenantId))
            {
                cmd.Parameters.Add(new SqlParameter("@TenantId", tenantId));
            }

            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                entityTypes.Add(reader.GetString(0));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting distinct entity types");
            throw;
        }

        return entityTypes;
    }

    private static string GetSortColumn(string? sortBy)
    {
        return sortBy?.ToLower() switch
        {
            "action" => "Action",
            "user" or "username" => "UserName",
            "entitytype" => "EntityType",
            "timestamp" or "date" => "Timestamp",
            "module" => "Module",
            _ => "Timestamp"
        };
    }

    private static AuditLogEntry MapToAuditLogEntry(SqlDataReader reader)
    {
        return new AuditLogEntry
        {
            Id = reader.GetInt64(0),
            TenantId = reader.IsDBNull(1) ? null : reader.GetString(1),
            UserId = reader.GetString(2),
            UserName = reader.IsDBNull(3) ? null : reader.GetString(3),
            Action = reader.GetString(4),
            EntityType = reader.IsDBNull(5) ? null : reader.GetString(5),
            EntityId = reader.IsDBNull(6) ? null : reader.GetString(6),
            OldValues = reader.IsDBNull(7) ? null : reader.GetString(7),
            NewValues = reader.IsDBNull(8) ? null : reader.GetString(8),
            Timestamp = reader.GetDateTime(9),
            IpAddress = reader.IsDBNull(10) ? null : reader.GetString(10),
            UserAgent = reader.IsDBNull(11) ? null : reader.GetString(11),
            Module = reader.IsDBNull(12) ? null : (AuditModule?)reader.GetInt32(12),
            CorrelationId = reader.IsDBNull(13) ? null : reader.GetString(13),
            AdditionalInfo = reader.IsDBNull(14) ? null : reader.GetString(14)
        };
    }
}

#region DTOs and Models

/// <summary>
/// استعلام سجلات التدقيق
/// </summary>
public class AuditLogQuery
{
    public string? TenantId { get; set; }
    public string? UserId { get; set; }
    public string? Action { get; set; }
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? SearchTerm { get; set; }
    public AuditModule? Module { get; set; }
    public string? IpAddress { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public string? SortBy { get; set; } = "timestamp";
    public bool SortDescending { get; set; } = true;
}

/// <summary>
/// نتيجة الاستعلام المُصفّحة
/// </summary>
public class PagedAuditResult
{
    public IEnumerable<AuditLogEntry> Items { get; set; } = new List<AuditLogEntry>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

/// <summary>
/// سجل تدقيق واحد
/// </summary>
public class AuditLogEntry
{
    public long Id { get; set; }
    public string? TenantId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public DateTime Timestamp { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public AuditModule? Module { get; set; }
    public string? CorrelationId { get; set; }
    public string? AdditionalInfo { get; set; }

    /// <summary>
    /// الحصول على التغييرات كقاموس
    /// </summary>
    public Dictionary<string, ChangeDetail>? GetChanges()
    {
        if (string.IsNullOrEmpty(OldValues) && string.IsNullOrEmpty(NewValues))
            return null;

        var changes = new Dictionary<string, ChangeDetail>();

        var oldDict = string.IsNullOrEmpty(OldValues)
            ? new Dictionary<string, object?>()
            : JsonSerializer.Deserialize<Dictionary<string, object?>>(OldValues) ?? new();

        var newDict = string.IsNullOrEmpty(NewValues)
            ? new Dictionary<string, object?>()
            : JsonSerializer.Deserialize<Dictionary<string, object?>>(NewValues) ?? new();

        var allKeys = oldDict.Keys.Union(newDict.Keys);

        foreach (var key in allKeys)
        {
            oldDict.TryGetValue(key, out var oldValue);
            newDict.TryGetValue(key, out var newValue);

            if (!Equals(oldValue?.ToString(), newValue?.ToString()))
            {
                changes[key] = new ChangeDetail
                {
                    OldValue = oldValue?.ToString(),
                    NewValue = newValue?.ToString()
                };
            }
        }

        return changes;
    }
}

/// <summary>
/// تفاصيل التغيير
/// </summary>
public class ChangeDetail
{
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
}

/// <summary>
/// إحصائيات سجلات التدقيق
/// </summary>
public class AuditLogStatistics
{
    public int TotalEntries { get; set; }
    public int UniqueUsers { get; set; }
    public Dictionary<string, int> ActionCounts { get; set; } = new();
    public Dictionary<string, int> EntityTypeCounts { get; set; } = new();
    public Dictionary<string, int> ModuleCounts { get; set; } = new();
    public List<UserActivityCount> TopUsers { get; set; } = new();
}

/// <summary>
/// عدد نشاط المستخدم
/// </summary>
public class UserActivityCount
{
    public string UserId { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public int Count { get; set; }
}

/// <summary>
/// ملخص التدقيق اليومي
/// </summary>
public class AuditSummary
{
    public DateTime Date { get; set; }
    public int TotalActions { get; set; }
    public int UniqueUsers { get; set; }
    public int Creates { get; set; }
    public int Updates { get; set; }
    public int Deletes { get; set; }
    public int Reads { get; set; }
}

/// <summary>
/// وحدات النظام
/// </summary>
public enum AuditModule
{
    Core = 0,
    HR = 1,
    Warehouse = 2,
    Movement = 3,
    Archiving = 4,
    EPM = 5,
    Sadad = 6,
    SaaS = 7,
    Analytics = 8,
    Agents = 9,
    Finance = 10,
    Projects = 11
}

#endregion

#region Extension Methods

public static class AuditViewerExtensions
{
    public static IServiceCollection AddAuditLogViewer(this IServiceCollection services)
    {
        services.AddScoped<IAuditLogViewerService, AuditLogViewerService>();
        return services;
    }
}

#endregion
