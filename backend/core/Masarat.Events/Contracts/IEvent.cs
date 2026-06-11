namespace Masarat.Events.Contracts;

/// <summary>
/// Base interface for all domain events in the Masarat platform
/// </summary>
public interface IEvent
{
    /// <summary>
    /// Unique identifier for the event
    /// </summary>
    Guid EventId { get; }
    
    /// <summary>
    /// Timestamp when the event occurred
    /// </summary>
    DateTime OccurredAt { get; }
    
    /// <summary>
    /// Version of the event schema for compatibility
    /// </summary>
    int Version { get; }
    
    /// <summary>
    /// User or system that triggered the event
    /// </summary>
    string? TriggeredBy { get; }
    
    /// <summary>
    /// Correlation ID for tracking related events
    /// </summary>
    string? CorrelationId { get; }
}

/// <summary>
/// Base interface for commands (requests for action)
/// </summary>
public interface ICommand
{
    /// <summary>
    /// Unique identifier for the command
    /// </summary>
    Guid CommandId { get; }
    
    /// <summary>
    /// Timestamp when the command was issued
    /// </summary>
    DateTime IssuedAt { get; }
    
    /// <summary>
    /// User or system issuing the command
    /// </summary>
    string IssuedBy { get; }
    
    /// <summary>
    /// Correlation ID for tracking
    /// </summary>
    string? CorrelationId { get; }
}

/// <summary>
/// Base class for domain events
/// SECURITY: All events MUST include TenantId for proper isolation
/// </summary>
public abstract record DomainEvent : IEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTime OccurredAt { get; init; } = DateTime.UtcNow;
    public int Version { get; init; } = 1;
    public string? TriggeredBy { get; init; }
    public string? CorrelationId { get; init; }
    
    /// <summary>
    /// SECURITY FIX: Tenant ID for multi-tenant isolation
    /// Prevents cross-tenant data leakage in async workers
    /// </summary>
    public required long TenantId { get; init; }
}

/// <summary>
/// Base class for commands
/// </summary>
public abstract record Command : ICommand
{
    public Guid CommandId { get; init; } = Guid.NewGuid();
    public DateTime IssuedAt { get; init; } = DateTime.UtcNow;
    public required string IssuedBy { get; init; }
    public string? CorrelationId { get; init; }
}
