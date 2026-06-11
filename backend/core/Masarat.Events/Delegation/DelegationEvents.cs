namespace Masarat.Events.Delegation;

using Masarat.Events.Contracts;

/// <summary>
/// حدث تفعيل التفويض التلقائي - يُنشر عند نقل الصلاحيات والموافقات للبديل
/// </summary>
public record DelegationActivatedEvent : DomainEvent
{
    /// <summary>معرف سجل التفويض</summary>
    public required int DelegationId { get; init; }

    /// <summary>معرف الموظف الأصلي (المفوِّض)</summary>
    public required int DelegatorEmployeeId { get; init; }

    /// <summary>اسم الموظف الأصلي</summary>
    public string? DelegatorName { get; init; }

    /// <summary>معرف الموظف البديل (المفوَّض إليه)</summary>
    public required int DelegateEmployeeId { get; init; }

    /// <summary>اسم الموظف البديل</summary>
    public string? DelegateName { get; init; }

    /// <summary>تاريخ بداية التفويض</summary>
    public required DateTime StartDate { get; init; }

    /// <summary>تاريخ نهاية التفويض</summary>
    public required DateTime EndDate { get; init; }

    /// <summary>سبب التفويض (Leave, Mission, Assignment, Training, Manual)</summary>
    public required string Reason { get; init; }

    /// <summary>نوع المصدر (Leave, Mission, Manual ...)</summary>
    public required string SourceEntityType { get; init; }

    /// <summary>معرف المصدر (رقم الإجازة أو المأمورية إن وجد)</summary>
    public int? SourceEntityId { get; init; }

    /// <summary>عدد الموافقات المعلقة التي تم تحويلها</summary>
    public int TransferredApprovalsCount { get; init; }
}

/// <summary>
/// حدث إلغاء/إنهاء التفويض التلقائي - يُنشر عند إعادة الصلاحيات للموظف الأصلي
/// </summary>
public record DelegationDeactivatedEvent : DomainEvent
{
    /// <summary>معرف سجل التفويض</summary>
    public required int DelegationId { get; init; }

    /// <summary>معرف الموظف الأصلي (المفوِّض)</summary>
    public required int DelegatorEmployeeId { get; init; }

    /// <summary>اسم الموظف الأصلي</summary>
    public string? DelegatorName { get; init; }

    /// <summary>معرف الموظف البديل (المفوَّض إليه)</summary>
    public required int DelegateEmployeeId { get; init; }

    /// <summary>اسم الموظف البديل</summary>
    public string? DelegateName { get; init; }

    /// <summary>سبب الإنهاء</summary>
    public required string Reason { get; init; }

    /// <summary>عدد الموافقات التي أُعيدت للموظف الأصلي</summary>
    public int ReturnedApprovalsCount { get; init; }

    /// <summary>هل انتهى التفويض بشكل طبيعي (اكتمل) أم ألغي</summary>
    public bool IsCompleted { get; init; }
}

/// <summary>
/// حدث تحويل الموافقات المعلقة بين الموظفين
/// يُنشر عند كل عملية نقل جماعي للموافقات (تفعيل أو إلغاء تفويض)
/// </summary>
public record ApprovalsTransferredEvent : DomainEvent
{
    /// <summary>معرف سجل التفويض المرتبط</summary>
    public required int DelegationId { get; init; }

    /// <summary>معرف الموظف المُحوَّل منه</summary>
    public required int FromEmployeeId { get; init; }

    /// <summary>معرف مستخدم النظام المُحوَّل منه</summary>
    public string? FromUserId { get; init; }

    /// <summary>معرف الموظف المُحوَّل إليه</summary>
    public required int ToEmployeeId { get; init; }

    /// <summary>معرف مستخدم النظام المُحوَّل إليه</summary>
    public string? ToUserId { get; init; }

    /// <summary>عدد الموافقات التي تم تحويلها</summary>
    public required int TransferredCount { get; init; }

    /// <summary>هل هذا تحويل (تفعيل) أم إعادة (إلغاء)</summary>
    public required bool IsReturn { get; init; }
}
