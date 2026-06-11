using Microsoft.Extensions.DependencyInjection;
using Masarat.Core.Interceptors;
using Masarat.Core.Services.Sync;

namespace Masarat.Core.Extensions;

/// <summary>
/// تسجيل خدمات المزامنة في DI Container
/// </summary>
public static class SyncServiceExtensions
{
    public static IServiceCollection AddMasaratSync(this IServiceCollection services)
    {
        services.AddSingleton<SyncVersionInterceptor>();
        services.AddSingleton<IConflictResolver, ConflictResolver>();
        return services;
    }
}
