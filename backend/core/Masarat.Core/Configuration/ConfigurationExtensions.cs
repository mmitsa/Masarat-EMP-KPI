using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;

namespace Masarat.Core.Configuration;

/// <summary>
/// يحل مشكلة استخدام ${VAR} في ملفات appsettings.Production.json
/// .NET لا يدعم هذه الصيغة تلقائياً - يجب استبدالها بقيم متغيرات البيئة
/// </summary>
public static class ConfigurationExtensions
{
    private static readonly Regex PlaceholderPattern = new(@"\$\{([^}]+)\}", RegexOptions.Compiled);

    /// <summary>
    /// يستبدل أنماط ${VAR} في جميع قيم الإعدادات بقيم متغيرات البيئة الفعلية
    /// يجب استدعاؤه فوراً بعد WebApplication.CreateBuilder(args)
    /// </summary>
    public static WebApplicationBuilder ResolveConfigPlaceholders(this WebApplicationBuilder builder)
    {
        var updates = new Dictionary<string, string?>();

        foreach (var kvp in builder.Configuration.AsEnumerable())
        {
            if (kvp.Value != null && PlaceholderPattern.IsMatch(kvp.Value))
            {
                var resolved = PlaceholderPattern.Replace(kvp.Value, match =>
                {
                    var envVarName = match.Groups[1].Value;
                    var envValue = Environment.GetEnvironmentVariable(envVarName);

                    if (envValue != null)
                        return envValue;

                    // Log warning but don't crash - return original placeholder
                    Console.WriteLine($"[CONFIG WARNING] Environment variable '{envVarName}' not found. " +
                                      $"Set it on the server or run configure-production.ps1");
                    return match.Value;
                });

                if (resolved != kvp.Value)
                {
                    updates[kvp.Key] = resolved;
                }
            }
        }

        if (updates.Count > 0)
        {
            builder.Configuration.AddInMemoryCollection(updates!);
            Console.WriteLine($"[CONFIG] Resolved {updates.Count} environment variable placeholders");
        }

        return builder;
    }
}
