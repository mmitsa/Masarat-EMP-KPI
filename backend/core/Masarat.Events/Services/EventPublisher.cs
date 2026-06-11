namespace Masarat.Events.Services;

using Masarat.Events.Contracts;
using Microsoft.Extensions.Logging;
using System.Text.Json;

/// <summary>
/// Interface for event publishing
/// واجهة لنشر الأحداث
/// </summary>
public interface IEventPublisher
{
    /// <summary>
    /// Publish a domain event
    /// </summary>
    Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default) where TEvent : IEvent;

    /// <summary>
    /// Publish multiple events
    /// </summary>
    Task PublishManyAsync<TEvent>(IEnumerable<TEvent> events, CancellationToken cancellationToken = default) where TEvent : IEvent;
}

/// <summary>
/// Interface for event subscription
/// واجهة للاشتراك في الأحداث
/// </summary>
public interface IEventSubscriber
{
    /// <summary>
    /// Subscribe to an event type
    /// </summary>
    void Subscribe<TEvent>(Func<TEvent, CancellationToken, Task> handler) where TEvent : IEvent;

    /// <summary>
    /// Unsubscribe from an event type
    /// </summary>
    void Unsubscribe<TEvent>() where TEvent : IEvent;
}

/// <summary>
/// In-memory event publisher implementation
/// تطبيق نشر الأحداث في الذاكرة
/// </summary>
public class InMemoryEventPublisher : IEventPublisher, IEventSubscriber
{
    private readonly Dictionary<Type, List<Delegate>> _handlers = new();
    private readonly ILogger<InMemoryEventPublisher> _logger;
    private readonly object _lock = new();

    public InMemoryEventPublisher(ILogger<InMemoryEventPublisher> logger)
    {
        _logger = logger;
    }

    public async Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default) where TEvent : IEvent
    {
        var eventType = typeof(TEvent);

        _logger.LogInformation(
            "Publishing event {EventType} with ID {EventId}",
            eventType.Name,
            @event.EventId);

        List<Delegate> handlers;
        lock (_lock)
        {
            if (!_handlers.TryGetValue(eventType, out handlers!) || handlers.Count == 0)
            {
                _logger.LogDebug("No handlers registered for event type {EventType}", eventType.Name);
                return;
            }
        }

        var tasks = handlers
            .Cast<Func<TEvent, CancellationToken, Task>>()
            .Select(handler => ExecuteHandlerAsync(handler, @event, cancellationToken));

        await Task.WhenAll(tasks);
    }

    public async Task PublishManyAsync<TEvent>(IEnumerable<TEvent> events, CancellationToken cancellationToken = default) where TEvent : IEvent
    {
        foreach (var @event in events)
        {
            await PublishAsync(@event, cancellationToken);
        }
    }

    public void Subscribe<TEvent>(Func<TEvent, CancellationToken, Task> handler) where TEvent : IEvent
    {
        var eventType = typeof(TEvent);

        lock (_lock)
        {
            if (!_handlers.ContainsKey(eventType))
            {
                _handlers[eventType] = new List<Delegate>();
            }

            _handlers[eventType].Add(handler);
        }

        _logger.LogInformation("Subscribed handler for event type {EventType}", eventType.Name);
    }

    public void Unsubscribe<TEvent>() where TEvent : IEvent
    {
        var eventType = typeof(TEvent);

        lock (_lock)
        {
            _handlers.Remove(eventType);
        }

        _logger.LogInformation("Unsubscribed all handlers for event type {EventType}", eventType.Name);
    }

    private async Task ExecuteHandlerAsync<TEvent>(
        Func<TEvent, CancellationToken, Task> handler,
        TEvent @event,
        CancellationToken cancellationToken) where TEvent : IEvent
    {
        try
        {
            await handler(@event, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error executing handler for event {EventType} with ID {EventId}",
                typeof(TEvent).Name,
                @event.EventId);
        }
    }
}

/// <summary>
/// Event publisher that logs events to a store (for audit trail)
/// ناشر أحداث يسجل الأحداث في مخزن (لسجل التدقيق)
/// </summary>
public class AuditedEventPublisher : IEventPublisher
{
    private readonly IEventPublisher _innerPublisher;
    private readonly IEventStore _eventStore;
    private readonly ILogger<AuditedEventPublisher> _logger;

    public AuditedEventPublisher(
        IEventPublisher innerPublisher,
        IEventStore eventStore,
        ILogger<AuditedEventPublisher> logger)
    {
        _innerPublisher = innerPublisher;
        _eventStore = eventStore;
        _logger = logger;
    }

    public async Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default) where TEvent : IEvent
    {
        // Store event for audit
        await _eventStore.StoreAsync(@event, cancellationToken);

        // Publish to handlers
        await _innerPublisher.PublishAsync(@event, cancellationToken);
    }

    public async Task PublishManyAsync<TEvent>(IEnumerable<TEvent> events, CancellationToken cancellationToken = default) where TEvent : IEvent
    {
        foreach (var @event in events)
        {
            await PublishAsync(@event, cancellationToken);
        }
    }
}

/// <summary>
/// Interface for event storage
/// واجهة لتخزين الأحداث
/// </summary>
public interface IEventStore
{
    Task StoreAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default) where TEvent : IEvent;
    Task<IEnumerable<StoredEvent>> GetEventsAsync(string entityType, long entityId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Stored event record
/// سجل الحدث المخزن
/// </summary>
public record StoredEvent
{
    public required Guid EventId { get; init; }
    public required string EventType { get; init; }
    public required string EntityType { get; init; }
    public required long EntityId { get; init; }
    public required string EventData { get; init; }
    public required DateTime OccurredAt { get; init; }
    public string? TriggeredBy { get; init; }
    public string? CorrelationId { get; init; }
}

/// <summary>
/// In-memory event store implementation
/// تطبيق مخزن الأحداث في الذاكرة
/// </summary>
public class InMemoryEventStore : IEventStore
{
    private readonly List<StoredEvent> _events = new();
    private readonly object _lock = new();

    public Task StoreAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default) where TEvent : IEvent
    {
        var storedEvent = new StoredEvent
        {
            EventId = @event.EventId,
            EventType = typeof(TEvent).Name,
            EntityType = ExtractEntityType(@event),
            EntityId = ExtractEntityId(@event),
            EventData = JsonSerializer.Serialize(@event),
            OccurredAt = @event.OccurredAt,
            TriggeredBy = @event.TriggeredBy,
            CorrelationId = @event.CorrelationId
        };

        lock (_lock)
        {
            _events.Add(storedEvent);
        }

        return Task.CompletedTask;
    }

    public Task<IEnumerable<StoredEvent>> GetEventsAsync(
        string entityType,
        long entityId,
        CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var events = _events
                .Where(e => e.EntityType == entityType && e.EntityId == entityId)
                .OrderBy(e => e.OccurredAt)
                .ToList();

            return Task.FromResult<IEnumerable<StoredEvent>>(events);
        }
    }

    private static string ExtractEntityType<TEvent>(TEvent @event)
    {
        var type = @event?.GetType();
        var property = type?.GetProperty("EntityType");
        return property?.GetValue(@event)?.ToString() ?? "Unknown";
    }

    private static long ExtractEntityId<TEvent>(TEvent @event)
    {
        var type = @event?.GetType();
        var property = type?.GetProperty("EntityId");
        var value = property?.GetValue(@event);
        return value is long id ? id : 0;
    }
}
