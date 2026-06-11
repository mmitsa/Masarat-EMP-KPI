namespace Masarat.Events;

using Masarat.Events.Handlers;
using Masarat.Events.Services;
using Microsoft.Extensions.DependencyInjection;

/// <summary>
/// Extension methods for registering event services
/// طرق إضافية لتسجيل خدمات الأحداث
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Add event services to the service collection
    /// إضافة خدمات الأحداث إلى مجموعة الخدمات
    /// </summary>
    public static IServiceCollection AddEventServices(this IServiceCollection services)
    {
        // Register in-memory event publisher (singleton for shared state)
        services.AddSingleton<InMemoryEventPublisher>();
        services.AddSingleton<IEventPublisher>(sp => sp.GetRequiredService<InMemoryEventPublisher>());
        services.AddSingleton<IEventSubscriber>(sp => sp.GetRequiredService<InMemoryEventPublisher>());

        // Register event store
        services.AddSingleton<IEventStore, InMemoryEventStore>();

        // Register notification event handler
        services.AddSingleton<NotificationEventHandler>();

        return services;
    }

    /// <summary>
    /// Add event services with auditing
    /// إضافة خدمات الأحداث مع التدقيق
    /// </summary>
    public static IServiceCollection AddAuditedEventServices(this IServiceCollection services)
    {
        // Register base services
        services.AddSingleton<InMemoryEventPublisher>();
        services.AddSingleton<IEventStore, InMemoryEventStore>();
        services.AddSingleton<IEventSubscriber>(sp => sp.GetRequiredService<InMemoryEventPublisher>());

        // Register audited publisher
        services.AddSingleton<IEventPublisher, AuditedEventPublisher>(sp =>
        {
            var innerPublisher = sp.GetRequiredService<InMemoryEventPublisher>();
            var eventStore = sp.GetRequiredService<IEventStore>();
            var logger = sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<AuditedEventPublisher>>();
            return new AuditedEventPublisher(innerPublisher, eventStore, logger);
        });

        // Register notification event handler
        services.AddSingleton<NotificationEventHandler>();

        return services;
    }

    /// <summary>
    /// Configure and register all event handlers
    /// تكوين وتسجيل جميع معالجات الأحداث
    /// </summary>
    public static IServiceProvider UseEventHandlers(this IServiceProvider serviceProvider)
    {
        var subscriber = serviceProvider.GetRequiredService<IEventSubscriber>();
        var notificationHandler = serviceProvider.GetRequiredService<NotificationEventHandler>();

        // Register notification handlers
        notificationHandler.RegisterHandlers(subscriber);

        return serviceProvider;
    }
}
