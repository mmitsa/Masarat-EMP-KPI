namespace Masarat.Events.Handlers;

using Masarat.Events.Approvals;
using Masarat.Events.Finance;
using Masarat.Events.Services;
using Microsoft.Extensions.Logging;
using System.Net.Http.Json;

/// <summary>
/// Event handler that creates notifications based on events
/// معالج الأحداث الذي ينشئ إشعارات بناءً على الأحداث
/// </summary>
public class NotificationEventHandler
{
    private readonly ILogger<NotificationEventHandler> _logger;
    private readonly HttpClient _httpClient;
    private readonly string _notificationApiUrl;

    public NotificationEventHandler(
        ILogger<NotificationEventHandler> logger,
        HttpClient httpClient,
        string notificationApiUrl = "http://localhost:8080/api/authorization/notifications")
    {
        _logger = logger;
        _httpClient = httpClient;
        _notificationApiUrl = notificationApiUrl;
    }

    /// <summary>
    /// Register all event handlers
    /// </summary>
    public void RegisterHandlers(IEventSubscriber subscriber)
    {
        // Approval events
        subscriber.Subscribe<ApprovalRequestInitiatedEvent>(HandleApprovalInitiated);
        subscriber.Subscribe<ApprovalActionTakenEvent>(HandleApprovalAction);
        subscriber.Subscribe<ApprovalRequestCompletedEvent>(HandleApprovalCompleted);
        subscriber.Subscribe<ApprovalOverdueEvent>(HandleApprovalOverdue);

        // Finance events
        subscriber.Subscribe<DisbursementRequestCreatedEvent>(HandleDisbursementCreated);
        subscriber.Subscribe<DisbursementStatusChangedEvent>(HandleDisbursementStatusChanged);
        subscriber.Subscribe<DisbursementApprovedEvent>(HandleDisbursementApproved);
        subscriber.Subscribe<DisbursementRejectedEvent>(HandleDisbursementRejected);
        subscriber.Subscribe<DisbursementExecutedEvent>(HandleDisbursementExecuted);

        _logger.LogInformation("Notification event handlers registered");
    }

    #region Approval Event Handlers

    private async Task HandleApprovalInitiated(ApprovalRequestInitiatedEvent @event, CancellationToken ct)
    {
        _logger.LogInformation(
            "Handling ApprovalRequestInitiated for {EntityType}/{EntityId}",
            @event.EntityType,
            @event.EntityId);

        // Notify approvers
        if (@event.ApproverUserIds != null)
        {
            foreach (var approverId in @event.ApproverUserIds)
            {
                await CreateNotificationAsync(new NotificationDto
                {
                    UserId = approverId,
                    TitleAr = "طلب موافقة جديد",
                    TitleEn = "New Approval Request",
                    MessageAr = $"لديك طلب جديد يحتاج موافقتك: {@event.TitleAr ?? @event.EntityType}",
                    MessageEn = $"You have a new request pending your approval: {@event.TitleEn ?? @event.EntityType}",
                    NotificationType = "Approval",
                    EntityType = @event.EntityType,
                    EntityId = @event.EntityId,
                    ActionUrl = "/approvals",
                    Priority = @event.Amount > 500000 ? "High" : "Normal"
                }, ct);
            }
        }
    }

    private async Task HandleApprovalAction(ApprovalActionTakenEvent @event, CancellationToken ct)
    {
        _logger.LogInformation(
            "Handling ApprovalActionTaken for {EntityType}/{EntityId}: {Action}",
            @event.EntityType,
            @event.EntityId,
            @event.Action);

        // Notify initiator
        if (@event.InitiatedByUserId.HasValue)
        {
            var statusAr = @event.ResultStatus switch
            {
                "Approved" => "تمت الموافقة",
                "Rejected" => "تم الرفض",
                "Returned" => "تمت الإعادة",
                _ => @event.ResultStatus
            };

            var statusEn = @event.ResultStatus;

            var messageAr = @event.IsFinal
                ? $"{statusAr} على طلبك - الطلب مكتمل"
                : $"{statusAr} في المرحلة الحالية - انتقل للمرحلة التالية: {@event.NextStageNameAr}";

            await CreateNotificationAsync(new NotificationDto
            {
                UserId = @event.InitiatedByUserId.Value,
                TitleAr = "تحديث على طلبك",
                TitleEn = "Update on Your Request",
                MessageAr = messageAr,
                MessageEn = @event.IsFinal
                    ? $"Your request has been {statusEn.ToLower()}"
                    : $"Your request has been {statusEn.ToLower()} at current stage",
                NotificationType = "Approval",
                EntityType = @event.EntityType,
                EntityId = @event.EntityId,
                ActionUrl = $"/workflows?entityType={@event.EntityType}&entityId={@event.EntityId}",
                Priority = @event.ResultStatus == "Rejected" ? "High" : "Normal"
            }, ct);
        }

        // Notify next approvers if not final
        if (!@event.IsFinal && @event.NextApproverUserIds != null)
        {
            foreach (var approverId in @event.NextApproverUserIds)
            {
                await CreateNotificationAsync(new NotificationDto
                {
                    UserId = approverId,
                    TitleAr = "طلب موافقة منتقل إليك",
                    TitleEn = "Approval Request Forwarded to You",
                    MessageAr = $"تم تحويل طلب إليك للموافقة في المرحلة: {@event.NextStageNameAr}",
                    MessageEn = $"A request has been forwarded to you for approval",
                    NotificationType = "Approval",
                    EntityType = @event.EntityType,
                    EntityId = @event.EntityId,
                    ActionUrl = "/approvals",
                    Priority = "Normal"
                }, ct);
            }
        }
    }

    private async Task HandleApprovalCompleted(ApprovalRequestCompletedEvent @event, CancellationToken ct)
    {
        _logger.LogInformation(
            "Handling ApprovalRequestCompleted for {EntityType}/{EntityId}: {FinalStatus}",
            @event.EntityType,
            @event.EntityId,
            @event.FinalStatus);

        if (@event.InitiatedByUserId.HasValue)
        {
            var isApproved = @event.FinalStatus == "Approved";

            await CreateNotificationAsync(new NotificationDto
            {
                UserId = @event.InitiatedByUserId.Value,
                TitleAr = isApproved ? "تمت الموافقة على طلبك" : "تم رفض طلبك",
                TitleEn = isApproved ? "Your Request Approved" : "Your Request Rejected",
                MessageAr = isApproved
                    ? $"تمت الموافقة النهائية على طلبك رقم {@event.ReferenceNumber}"
                    : $"تم رفض طلبك رقم {@event.ReferenceNumber}",
                MessageEn = isApproved
                    ? $"Your request {@event.ReferenceNumber} has been finally approved"
                    : $"Your request {@event.ReferenceNumber} has been rejected",
                NotificationType = isApproved ? "Info" : "Alert",
                EntityType = @event.EntityType,
                EntityId = @event.EntityId,
                ActionUrl = $"/workflows?entityType={@event.EntityType}&entityId={@event.EntityId}",
                Priority = isApproved ? "Normal" : "High"
            }, ct);
        }
    }

    private async Task HandleApprovalOverdue(ApprovalOverdueEvent @event, CancellationToken ct)
    {
        _logger.LogWarning(
            "Handling ApprovalOverdue for {EntityType}/{EntityId}: {HoursOverdue} hours overdue",
            @event.EntityType,
            @event.EntityId,
            @event.HoursOverdue);

        // Notify approvers
        if (@event.ApproverUserIds != null)
        {
            foreach (var approverId in @event.ApproverUserIds)
            {
                await CreateNotificationAsync(new NotificationDto
                {
                    UserId = approverId,
                    TitleAr = "تذكير: طلب متأخر",
                    TitleEn = "Reminder: Overdue Request",
                    MessageAr = $"لديك طلب متأخر منذ {@event.HoursOverdue} ساعة يحتاج اهتمامك",
                    MessageEn = $"You have a request overdue for {@event.HoursOverdue} hours that needs your attention",
                    NotificationType = "Alert",
                    EntityType = @event.EntityType,
                    EntityId = @event.EntityId,
                    ActionUrl = "/approvals",
                    Priority = "High"
                }, ct);
            }
        }

        // Notify escalation users (managers)
        if (@event.EscalationUserIds != null)
        {
            foreach (var managerId in @event.EscalationUserIds)
            {
                await CreateNotificationAsync(new NotificationDto
                {
                    UserId = managerId,
                    TitleAr = "تصعيد: طلب متأخر",
                    TitleEn = "Escalation: Overdue Request",
                    MessageAr = $"طلب في قسمك متأخر منذ {@event.HoursOverdue} ساعة - المرحلة: {@event.StageNameAr}",
                    MessageEn = $"A request in your department is overdue for {@event.HoursOverdue} hours",
                    NotificationType = "Alert",
                    EntityType = @event.EntityType,
                    EntityId = @event.EntityId,
                    ActionUrl = "/approvals",
                    Priority = "High"
                }, ct);
            }
        }
    }

    #endregion

    #region Finance Event Handlers

    private async Task HandleDisbursementCreated(DisbursementRequestCreatedEvent @event, CancellationToken ct)
    {
        _logger.LogInformation(
            "Handling DisbursementRequestCreated: {ReferenceNumber}, Amount: {Amount}",
            @event.ReferenceNumber,
            @event.Amount);

        // Notification is created through approval flow
    }

    private async Task HandleDisbursementStatusChanged(DisbursementStatusChangedEvent @event, CancellationToken ct)
    {
        if (@event.RequestedByUserId.HasValue)
        {
            await CreateNotificationAsync(new NotificationDto
            {
                UserId = @event.RequestedByUserId.Value,
                TitleAr = "تحديث حالة طلب الصرف",
                TitleEn = "Disbursement Status Update",
                MessageAr = $"تم تغيير حالة طلب الصرف {@event.ReferenceNumber} إلى {GetStatusAr(@event.NewStatus)}",
                MessageEn = $"Disbursement request {@event.ReferenceNumber} status changed to {@event.NewStatus}",
                NotificationType = "Info",
                EntityType = "DisbursementRequest",
                EntityId = @event.DisbursementId,
                ActionUrl = $"/workflows?entityType=DisbursementRequest&entityId={@event.DisbursementId}",
                Priority = "Normal"
            }, ct);
        }
    }

    private async Task HandleDisbursementApproved(DisbursementApprovedEvent @event, CancellationToken ct)
    {
        if (@event.RequestedByUserId.HasValue)
        {
            var messageAr = @event.IsFinalApproval
                ? $"تمت الموافقة النهائية على طلب الصرف {@event.ReferenceNumber}"
                : $"تمت الموافقة على طلب الصرف {@event.ReferenceNumber} في المرحلة {@event.ApprovalStage}";

            await CreateNotificationAsync(new NotificationDto
            {
                UserId = @event.RequestedByUserId.Value,
                TitleAr = @event.IsFinalApproval ? "تمت الموافقة النهائية" : "تمت الموافقة",
                TitleEn = @event.IsFinalApproval ? "Final Approval Granted" : "Approval Granted",
                MessageAr = messageAr,
                MessageEn = $"Disbursement request {@event.ReferenceNumber} has been approved",
                NotificationType = "Approval",
                EntityType = "DisbursementRequest",
                EntityId = @event.DisbursementId,
                ActionUrl = $"/workflows?entityType=DisbursementRequest&entityId={@event.DisbursementId}",
                Priority = "Normal"
            }, ct);
        }
    }

    private async Task HandleDisbursementRejected(DisbursementRejectedEvent @event, CancellationToken ct)
    {
        if (@event.RequestedByUserId.HasValue)
        {
            await CreateNotificationAsync(new NotificationDto
            {
                UserId = @event.RequestedByUserId.Value,
                TitleAr = "تم رفض طلب الصرف",
                TitleEn = "Disbursement Request Rejected",
                MessageAr = $"تم رفض طلب الصرف {@event.ReferenceNumber}. السبب: {@event.RejectionReason}",
                MessageEn = $"Disbursement request {@event.ReferenceNumber} has been rejected. Reason: {@event.RejectionReason}",
                NotificationType = "Alert",
                EntityType = "DisbursementRequest",
                EntityId = @event.DisbursementId,
                ActionUrl = $"/workflows?entityType=DisbursementRequest&entityId={@event.DisbursementId}",
                Priority = "High"
            }, ct);
        }
    }

    private async Task HandleDisbursementExecuted(DisbursementExecutedEvent @event, CancellationToken ct)
    {
        if (@event.RequestedByUserId.HasValue)
        {
            await CreateNotificationAsync(new NotificationDto
            {
                UserId = @event.RequestedByUserId.Value,
                TitleAr = "تم تنفيذ الصرف",
                TitleEn = "Disbursement Executed",
                MessageAr = $"تم تنفيذ طلب الصرف {@event.ReferenceNumber} بمبلغ {FormatAmount(@event.Amount)} إلى {@event.BeneficiaryName}",
                MessageEn = $"Disbursement {@event.ReferenceNumber} for {FormatAmount(@event.Amount)} has been executed to {@event.BeneficiaryName}",
                NotificationType = "Info",
                EntityType = "DisbursementRequest",
                EntityId = @event.DisbursementId,
                ActionUrl = $"/workflows?entityType=DisbursementRequest&entityId={@event.DisbursementId}",
                Priority = "Normal"
            }, ct);
        }
    }

    #endregion

    #region Helpers

    private async Task CreateNotificationAsync(NotificationDto dto, CancellationToken ct)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync(_notificationApiUrl, dto, ct);
            response.EnsureSuccessStatusCode();
            _logger.LogInformation("Notification created for user {UserId}", dto.UserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create notification for user {UserId}", dto.UserId);
        }
    }

    private static string GetStatusAr(string status) => status switch
    {
        "Pending" => "قيد المعالجة",
        "Approved" => "معتمد",
        "Rejected" => "مرفوض",
        "Returned" => "معاد",
        "Executed" => "منفذ",
        "Paid" => "مدفوع",
        _ => status
    };

    private static string FormatAmount(decimal amount) =>
        amount.ToString("N0") + " ريال";

    #endregion

    private record NotificationDto
    {
        public required int UserId { get; init; }
        public required string TitleAr { get; init; }
        public required string TitleEn { get; init; }
        public required string MessageAr { get; init; }
        public required string MessageEn { get; init; }
        public required string NotificationType { get; init; }
        public string? EntityType { get; init; }
        public long? EntityId { get; init; }
        public string? ActionUrl { get; init; }
        public string Priority { get; init; } = "Normal";
    }
}
