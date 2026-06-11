using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Masarat.Core.Configuration;
using Serilog;
using Serilog.Events;

namespace Masarat.Core.Logging;

public static class LoggingConfiguration
{
    public static void ConfigureLogging(IHostBuilder host, string systemName)
    {
        host.UseSerilog((context, loggerConfiguration) =>
        {
            var seqUrl = context.Configuration["Seq:Url"] ?? "http://localhost:5341";
            loggerConfiguration
                .MinimumLevel.Information()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                .Enrich.FromLogContext()
                .Enrich.WithProperty("Application", systemName)
                .WriteTo.Console()
                .WriteTo.Seq(seqUrl);
        });
    }

    /// <summary>
    /// يضبط التسجيل + يحل متغيرات البيئة ${VAR} في الإعدادات
    /// </summary>
    public static void ConfigureLogging(WebApplicationBuilder builder, string systemName)
    {
        // حل متغيرات البيئة أولاً قبل قراءة أي إعدادات
        builder.ResolveConfigPlaceholders();

        ConfigureLogging(builder.Host, systemName);
    }
}
