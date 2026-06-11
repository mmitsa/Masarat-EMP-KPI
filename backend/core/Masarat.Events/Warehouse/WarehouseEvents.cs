namespace Masarat.Events.Warehouse;

using Masarat.Events.Contracts;

/// <summary>
/// Event published when a new item is created
/// نشر حدث عند إنشاء صنف جديد
/// </summary>
public record ItemCreatedEvent : DomainEvent
{
    public required int ItemId { get; init; }
    public required string Name { get; init; }
    public required string SKU { get; init; }
    public string? Barcode { get; init; }
    public required int CategoryId { get; init; }
    public decimal UnitPrice { get; init; }
    public int ReorderLevel { get; init; }
}

/// <summary>
/// Event published when item stock level changes
/// نشر حدث عند تغيير مستوى المخزون
/// </summary>
public record StockLevelChangedEvent : DomainEvent
{
    public required int ItemId { get; init; }
    public required int WarehouseId { get; init; }
    public required int OldQuantity { get; init; }
    public required int NewQuantity { get; init; }
    public required string TransactionType { get; init; }
    public string? Reference { get; init; }
}

/// <summary>
/// Event published when stock falls below reorder level
/// نشر حدث عند انخفاض المخزون لحد الطلب
/// </summary>
public record LowStockAlertEvent : DomainEvent
{
    public required int ItemId { get; init; }
    public required string ItemName { get; init; }
    public required int WarehouseId { get; init; }
    public required int CurrentQuantity { get; init; }
    public required int ReorderLevel { get; init; }
    public DateTime AlertedAt { get; init; }
}

/// <summary>
/// Event published when transfer is initiated
/// نشر حدث عند بدء عملية نقل
/// </summary>
public record TransferInitiatedEvent : DomainEvent
{
    public required int TransferId { get; init; }
    public required int SourceWarehouseId { get; init; }
    public required int DestinationWarehouseId { get; init; }
    public required List<TransferItem> Items { get; init; }
    public required string InitiatedBy { get; init; }
    public DateTime InitiatedAt { get; init; }
}

/// <summary>
/// Event published when transfer is approved
/// نشر حدث عند الموافقة على النقل
/// </summary>
public record TransferApprovedEvent : DomainEvent
{
    public required int TransferId { get; init; }
    public required string ApprovedBy { get; init; }
    public DateTime ApprovedAt { get; init; }
    public string? Notes { get; init; }
}

/// <summary>
/// Event published when transfer is completed
/// نشر حدث عند اكتمال النقل
/// </summary>
public record TransferCompletedEvent : DomainEvent
{
    public required int TransferId { get; init; }
    public DateTime CompletedAt { get; init; }
    public required string CompletedBy { get; init; }
}

public record TransferItem
{
    public required int ItemId { get; init; }
    public required int Quantity { get; init; }
}
