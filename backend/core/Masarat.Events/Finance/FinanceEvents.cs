namespace Masarat.Events.Finance;

using Masarat.Events.Contracts;

/// <summary>
/// Event published when a disbursement request is created
/// نشر حدث عند إنشاء طلب صرف
/// </summary>
public record DisbursementRequestCreatedEvent : DomainEvent
{
    public required long DisbursementId { get; init; }
    public required string ReferenceNumber { get; init; }
    public required string DisbursementType { get; init; }
    public required decimal Amount { get; init; }
    public required string Currency { get; init; }
    public required int RequestedByUserId { get; init; }
    public string? RequestedByName { get; init; }
    public required int DepartmentId { get; init; }
    public string? DepartmentName { get; init; }
    public string? BeneficiaryName { get; init; }
    public string? DescriptionAr { get; init; }
    public string? DescriptionEn { get; init; }
    public string Status { get; init; } = "Pending";
}

/// <summary>
/// Event published when a disbursement status changes
/// نشر حدث عند تغيير حالة طلب الصرف
/// </summary>
public record DisbursementStatusChangedEvent : DomainEvent
{
    public required long DisbursementId { get; init; }
    public required string ReferenceNumber { get; init; }
    public required string OldStatus { get; init; }
    public required string NewStatus { get; init; }
    public required decimal Amount { get; init; }
    public int? ChangedByUserId { get; init; }
    public string? ChangedByName { get; init; }
    public string? Comments { get; init; }

    /// <summary>
    /// User ID of the request initiator (to be notified)
    /// </summary>
    public int? RequestedByUserId { get; init; }
}

/// <summary>
/// Event published when a disbursement is approved
/// نشر حدث عند الموافقة على طلب صرف
/// </summary>
public record DisbursementApprovedEvent : DomainEvent
{
    public required long DisbursementId { get; init; }
    public required string ReferenceNumber { get; init; }
    public required decimal Amount { get; init; }
    public required int ApprovedByUserId { get; init; }
    public string? ApprovedByName { get; init; }
    public required int ApprovalStage { get; init; }
    public bool IsFinalApproval { get; init; }
    public string? Comments { get; init; }
    public int? RequestedByUserId { get; init; }
}

/// <summary>
/// Event published when a disbursement is rejected
/// نشر حدث عند رفض طلب صرف
/// </summary>
public record DisbursementRejectedEvent : DomainEvent
{
    public required long DisbursementId { get; init; }
    public required string ReferenceNumber { get; init; }
    public required decimal Amount { get; init; }
    public required int RejectedByUserId { get; init; }
    public string? RejectedByName { get; init; }
    public required int RejectionStage { get; init; }
    public required string RejectionReason { get; init; }
    public int? RequestedByUserId { get; init; }
}

/// <summary>
/// Event published when a disbursement is executed/paid
/// نشر حدث عند تنفيذ/دفع طلب الصرف
/// </summary>
public record DisbursementExecutedEvent : DomainEvent
{
    public required long DisbursementId { get; init; }
    public required string ReferenceNumber { get; init; }
    public required decimal Amount { get; init; }
    public required string PaymentMethod { get; init; }
    public string? TransactionReference { get; init; }
    public required int ExecutedByUserId { get; init; }
    public string? ExecutedByName { get; init; }
    public DateTime ExecutedAt { get; init; }
    public int? RequestedByUserId { get; init; }
    public string? BeneficiaryName { get; init; }
}

/// <summary>
/// Event published when an invoice is created
/// نشر حدث عند إنشاء فاتورة
/// </summary>
public record InvoiceCreatedEvent : DomainEvent
{
    public required long InvoiceId { get; init; }
    public required string InvoiceNumber { get; init; }
    public required long VendorId { get; init; }
    public required string VendorName { get; init; }
    public required decimal TotalAmount { get; init; }
    public required DateTime DueDate { get; init; }
    public string? PurchaseOrderNumber { get; init; }
    public int? CreatedByUserId { get; init; }
}

/// <summary>
/// Event published when an invoice is approved
/// نشر حدث عند اعتماد فاتورة
/// </summary>
public record InvoiceApprovedEvent : DomainEvent
{
    public required long InvoiceId { get; init; }
    public required string InvoiceNumber { get; init; }
    public required decimal Amount { get; init; }
    public required int ApprovedByUserId { get; init; }
    public string? ApprovedByName { get; init; }
    public string? Comments { get; init; }
}

/// <summary>
/// Event published when a payment is processed
/// نشر حدث عند معالجة دفعة
/// </summary>
public record PaymentProcessedEvent : DomainEvent
{
    public required long PaymentId { get; init; }
    public required string PaymentReference { get; init; }
    public required decimal Amount { get; init; }
    public required string PaymentMethod { get; init; }
    public required string BeneficiaryName { get; init; }
    public string? BankAccount { get; init; }
    public required int ProcessedByUserId { get; init; }
    public DateTime ProcessedAt { get; init; }
    public string Status { get; init; } = "Completed";
}
