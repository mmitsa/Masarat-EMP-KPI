using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Masarat.Core.FeatureFlags;

/// <summary>
/// خدمة إدارة Feature Flags
/// </summary>
public interface IFeatureFlagService
{
    Task<bool> IsEnabledAsync(string featureName, string? tenantId = null, string? userId = null);
    Task<T?> GetFeatureValueAsync<T>(string featureName, string? tenantId = null);
    Task SetFeatureAsync(string featureName, FeatureFlag feature);
    Task<IEnumerable<FeatureFlag>> GetAllFeaturesAsync();
    Task DisableFeatureAsync(string featureName);
    Task EnableFeatureAsync(string featureName);
}

/// <summary>
/// تنفيذ خدمة Feature Flags
/// </summary>
public class FeatureFlagService : IFeatureFlagService
{
    private readonly IDistributedCache _cache;
    private readonly IConfiguration _configuration;
    private readonly ILogger<FeatureFlagService> _logger;
    private const string CachePrefix = "feature:";
    private const string AllFeaturesKey = "feature:_all";

    public FeatureFlagService(
        IDistributedCache cache,
        IConfiguration configuration,
        ILogger<FeatureFlagService> logger)
    {
        _cache = cache;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> IsEnabledAsync(string featureName, string? tenantId = null, string? userId = null)
    {
        try
        {
            var feature = await GetFeatureAsync(featureName);

            if (feature == null)
            {
                // Check configuration as fallback
                return _configuration.GetValue($"FeatureFlags:{featureName}", false);
            }

            // Check if globally disabled
            if (!feature.IsEnabled)
                return false;

            // Check if in maintenance mode
            if (feature.IsInMaintenance)
                return false;

            // Check date range
            if (feature.EnabledFrom.HasValue && DateTime.UtcNow < feature.EnabledFrom.Value)
                return false;

            if (feature.EnabledUntil.HasValue && DateTime.UtcNow > feature.EnabledUntil.Value)
                return false;

            // Check tenant restrictions
            if (tenantId != null && feature.TenantRestrictions.Any())
            {
                if (feature.TenantRestrictions.Contains(tenantId))
                    return feature.TenantRestrictionMode == RestrictionMode.Whitelist;
                else
                    return feature.TenantRestrictionMode == RestrictionMode.Blacklist;
            }

            // Check user restrictions
            if (userId != null && feature.UserRestrictions.Any())
            {
                if (feature.UserRestrictions.Contains(userId))
                    return feature.UserRestrictionMode == RestrictionMode.Whitelist;
                else
                    return feature.UserRestrictionMode == RestrictionMode.Blacklist;
            }

            // Check percentage rollout
            if (feature.RolloutPercentage < 100)
            {
                var hash = GetConsistentHash(tenantId ?? userId ?? featureName);
                return hash % 100 < feature.RolloutPercentage;
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking feature flag {FeatureName}", featureName);
            // Return configuration value or false on error
            return _configuration.GetValue($"FeatureFlags:{featureName}", false);
        }
    }

    public async Task<T?> GetFeatureValueAsync<T>(string featureName, string? tenantId = null)
    {
        var feature = await GetFeatureAsync(featureName);

        if (feature == null || !feature.IsEnabled)
            return default;

        // Check for tenant-specific value
        if (tenantId != null && feature.TenantValues.TryGetValue(tenantId, out var tenantValue))
        {
            return JsonSerializer.Deserialize<T>(tenantValue);
        }

        // Return default value
        if (!string.IsNullOrEmpty(feature.DefaultValue))
        {
            return JsonSerializer.Deserialize<T>(feature.DefaultValue);
        }

        return default;
    }

    public async Task SetFeatureAsync(string featureName, FeatureFlag feature)
    {
        var cacheKey = CachePrefix + featureName;
        var json = JsonSerializer.Serialize(feature);

        await _cache.SetStringAsync(cacheKey, json, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
        });

        // Update all features list
        await UpdateAllFeaturesListAsync(featureName, feature);

        _logger.LogInformation(
            "Feature flag {FeatureName} updated: Enabled={IsEnabled}, Rollout={RolloutPercentage}%",
            featureName,
            feature.IsEnabled,
            feature.RolloutPercentage);
    }

    public async Task<IEnumerable<FeatureFlag>> GetAllFeaturesAsync()
    {
        var json = await _cache.GetStringAsync(AllFeaturesKey);

        if (string.IsNullOrEmpty(json))
        {
            return Enumerable.Empty<FeatureFlag>();
        }

        return JsonSerializer.Deserialize<List<FeatureFlag>>(json) ?? new List<FeatureFlag>();
    }

    public async Task DisableFeatureAsync(string featureName)
    {
        var feature = await GetFeatureAsync(featureName);

        if (feature != null)
        {
            feature.IsEnabled = false;
            feature.UpdatedAt = DateTime.UtcNow;
            await SetFeatureAsync(featureName, feature);
        }
    }

    public async Task EnableFeatureAsync(string featureName)
    {
        var feature = await GetFeatureAsync(featureName);

        if (feature != null)
        {
            feature.IsEnabled = true;
            feature.UpdatedAt = DateTime.UtcNow;
            await SetFeatureAsync(featureName, feature);
        }
    }

    private async Task<FeatureFlag?> GetFeatureAsync(string featureName)
    {
        var cacheKey = CachePrefix + featureName;
        var json = await _cache.GetStringAsync(cacheKey);

        if (string.IsNullOrEmpty(json))
            return null;

        return JsonSerializer.Deserialize<FeatureFlag>(json);
    }

    private async Task UpdateAllFeaturesListAsync(string featureName, FeatureFlag feature)
    {
        var allFeatures = (await GetAllFeaturesAsync()).ToList();

        var existing = allFeatures.FindIndex(f => f.Name == featureName);
        if (existing >= 0)
            allFeatures[existing] = feature;
        else
            allFeatures.Add(feature);

        await _cache.SetStringAsync(AllFeaturesKey, JsonSerializer.Serialize(allFeatures));
    }

    private static int GetConsistentHash(string input)
    {
        unchecked
        {
            int hash = 23;
            foreach (char c in input)
            {
                hash = hash * 31 + c;
            }
            return Math.Abs(hash);
        }
    }
}

/// <summary>
/// نموذج Feature Flag
/// </summary>
public class FeatureFlag
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
    public bool IsInMaintenance { get; set; } = false;
    public int RolloutPercentage { get; set; } = 100;
    public DateTime? EnabledFrom { get; set; }
    public DateTime? EnabledUntil { get; set; }
    public string? DefaultValue { get; set; }
    public Dictionary<string, string> TenantValues { get; set; } = new();
    public List<string> TenantRestrictions { get; set; } = new();
    public RestrictionMode TenantRestrictionMode { get; set; } = RestrictionMode.Whitelist;
    public List<string> UserRestrictions { get; set; } = new();
    public RestrictionMode UserRestrictionMode { get; set; } = RestrictionMode.Whitelist;
    public string? Category { get; set; }
    public List<string> Tags { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
}

public enum RestrictionMode
{
    Whitelist,  // Only listed items have access
    Blacklist   // All except listed items have access
}

/// <summary>
/// Feature Flags المُعرّفة مسبقاً
/// </summary>
public static class FeatureFlags
{
    // HR Module
    public const string HR_AdvancedReporting = "hr.advanced_reporting";
    public const string HR_BiometricAttendance = "hr.biometric_attendance";
    public const string HR_AIRecruitment = "hr.ai_recruitment";

    // Warehouse Module
    public const string Warehouse_BarcodeScanning = "warehouse.barcode_scanning";
    public const string Warehouse_AutoReorder = "warehouse.auto_reorder";
    public const string Warehouse_RFIDTracking = "warehouse.rfid_tracking";

    // Archiving Module
    public const string Archiving_OCR = "archiving.ocr";
    public const string Archiving_AIClassification = "archiving.ai_classification";
    public const string Archiving_AdvancedSearch = "archiving.advanced_search";

    // Finance Module
    public const string Finance_AutoReconciliation = "finance.auto_reconciliation";
    public const string Finance_CryptoCurrency = "finance.cryptocurrency";

    // Platform
    public const string Platform_DarkMode = "platform.dark_mode";
    public const string Platform_BetaFeatures = "platform.beta_features";
    public const string Platform_NewDashboard = "platform.new_dashboard";
    public const string Platform_AIAssistant = "platform.ai_assistant";

    // SaaS
    public const string SaaS_FreeTrial = "saas.free_trial";
    public const string SaaS_CustomBranding = "saas.custom_branding";
}

/// <summary>
/// Extension Methods
/// </summary>
public static class FeatureFlagExtensions
{
    public static IServiceCollection AddFeatureFlags(this IServiceCollection services)
    {
        services.AddSingleton<IFeatureFlagService, FeatureFlagService>();
        return services;
    }
}

/// <summary>
/// Attribute للتحقق من Feature Flag
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class FeatureGateAttribute : Attribute
{
    public string FeatureName { get; }
    public string? FallbackAction { get; set; }

    public FeatureGateAttribute(string featureName)
    {
        FeatureName = featureName;
    }
}
