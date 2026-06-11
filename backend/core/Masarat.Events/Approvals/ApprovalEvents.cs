namespace Masarat.Events.Approvals;

using Masarat.Events.Contracts;

/// <summary>
/// Event published when an approval request is initiated
/// نشر حدث عند بدء طلب موافقة
/// </summary>
public record ApprovalRequestInitiatedEvent : DomainEvent
{
    public required long RecordId { get; init; }
    public required string EntityType { get; init; }
    public required long EntityId { get; init; }
    public required int StageOrder { get; init; }
    public required string StageNameAr { get; init; }
    public required string StageNameEn { get; init; }
    public required int InitiatedByUserId { get; init; }
    public string? InitiatedByName { get; init; }
    public decimal? Amount { get; init; }
    public int? DepartmentId { get; init; }
    public string? TitleAr { get; init; }
    public string? TitleEn { get; init; }
    public string? ReferenceNumber { get; init; }

    /// <summary>
    /// List of user IDs who should be notified (approvers)
    /// </summary>
    public List<int>? ApproverUserIds { get; init; }
}

/// <summary>
/// Event published when an approval action is taken
/// نشر حدث عند اتخاذ إجراء موافقة
/// </summary>
public record ApprovalActionTakenEvent : DomainEvent
{
    public required long RecordId { get; init; }
    public required string EntityType { get; init; }
    public required long EntityId { get; init; }
    public required int StageOrder { get; init; }
    public required string Action { get; init; }  // Approve, Reject, Return
    public required string ResultStatus { get; init; }  // Approved, Rejected, Returned
    public required int ApproverUserId { get; init; }
    public string? ApproverName { get; init; }
    public string? Comments { get; init; }
    public string? DelegatedFrom { get; init; }
    public bool IsFinal { get; init; }
    public int? NextStageOrder { get; init; }
    public string? NextStageNameAr { get; init; }

    /// <summary>
    /// User ID of the request initiator (to be notified)
    /// </summary>
    public int? InitiatedByUserId { get; init; }

    /// <summary>
    /// List of user IDs for next stage approvers (if not final)
    /// </summary>
    public List<int>? NextApproverUserIds { get; init; }
}

/// <summary>
/// Event published when an approval request is completed
/// نشر حدث عند اكتمال طلب الموافقة
/// </summary>
public record ApprovalRequestCompletedEvent : DomainEvent
{
    public required string EntityType { get; init; }
    public required long EntityId { get; init; }
    public required string FinalStatus { get; init; }  // Approved, Rejected
    public required int TotalStages { get; init; }
    public required int CompletedStages { get; init; }
    public decimal? Amount { get; init; }
    public string? ReferenceNumber { get; init; }
    public int? InitiatedByUserId { get; init; }
    public DateTime CompletedAt { get; init; }
}

/// <summary>
/// Event published when an approval is overdue
/// نشر حدث عند تأخر الموافقة
/// </summary>
public record ApprovalOverdueEvent : DomainEvent
{
    public required long RecordId { get; init; }
    public required string EntityType { get; init; }
    public required long EntityId { get; init; }
    public required int StageOrder { get; init; }
    public required string StageNameAr { get; init; }
    public required int HoursOverdue { get; init; }
    public decimal? Amount { get; init; }
    public string? ReferenceNumber { get; init; }

    /// <summary>
    /// List of approver user IDs who are overdue
    /// </summary>
    public List<int>? ApproverUserIds { get; init; }

    /// <summary>
    /// List of escalation user IDs (managers)
    /// </summary>
    public List<int>? EscalationUserIds { get; init; }
}
