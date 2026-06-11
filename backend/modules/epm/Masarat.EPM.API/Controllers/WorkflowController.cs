using Masarat.EPM.Domain.Entities;
using Masarat.EPM.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Masarat.EPM.API.Controllers;

[ApiController]
[Route("api/epm/workflow")]
[Authorize]
public class WorkflowController : ControllerBase
{
    private readonly EPMDbContext _db;
    private readonly ILogger<WorkflowController> _logger;
    private static readonly SemaphoreSlim SchemaLock = new(1, 1);
    private static bool _schemaEnsured;

    public WorkflowController(EPMDbContext db, ILogger<WorkflowController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetWorkflow(CancellationToken cancellationToken)
    {
        await EnsureWorkflowSchema(cancellationToken);
        await EnsureQuestionBankSeeded(cancellationToken);

        var questionEntities = await _db.EpmQuestions
            .Where(q => q.IsActive && !q.IsDeleted)
            .OrderByDescending(q => q.IsOfficial)
            .ThenBy(q => q.Department)
            .ThenBy(q => q.QuestionId)
            .ToListAsync(cancellationToken);
        var questions = questionEntities.Select(ToQuestionDto).ToList();

        var questionnaireEntities = await _db.EpmQuestionnaires
            .Include(q => q.Items)
            .Where(q => q.IsActive && !q.IsDeleted)
            .OrderByDescending(q => q.SentAt)
            .ToListAsync(cancellationToken);
        var questionnaires = questionnaireEntities.Select(ToQuestionnaireDto).ToList();

        var taskEntities = await _db.EpmPerformanceTasks
            .Include(t => t.History)
            .Include(t => t.ExtensionRequests)
            .Where(t => t.IsActive && !t.IsDeleted)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
        var tasks = taskEntities.Select(ToTaskDto).ToList();

        return Ok(new WorkflowStoreDto(questions, questionnaires, tasks));
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken)
    {
        await EnsureWorkflowSchema(cancellationToken);
        var now = DateTime.UtcNow.Date;
        var tasks = _db.EpmPerformanceTasks.Where(t => t.IsActive && !t.IsDeleted);
        var questionnaires = _db.EpmQuestionnaires.Where(q => q.IsActive && !q.IsDeleted);

        var stats = new
        {
            totalTasks = await tasks.CountAsync(cancellationToken),
            completedTasks = await tasks.CountAsync(t => t.Status == "completed", cancellationToken),
            delayedTasks = await tasks.CountAsync(t => t.DueDate != null && t.DueDate.Value.Date < now && t.Status != "completed", cancellationToken),
            extensionRequests = await tasks.CountAsync(t => t.Status == "extensionRequested", cancellationToken),
            pendingQuestionnaires = await questionnaires.CountAsync(q => q.Status == "sent", cancellationToken),
            answeredQuestionnaires = await questionnaires.CountAsync(q => q.Status == "answered", cancellationToken)
        };

        return Ok(stats);
    }

    [HttpPost("questions")]
    public async Task<IActionResult> AddQuestion([FromBody] UpsertQuestionRequest request, CancellationToken cancellationToken)
    {
        await EnsureWorkflowSchema(cancellationToken);
        if (string.IsNullOrWhiteSpace(request.Text))
            return BadRequest(new { error = "نص السؤال مطلوب" });

        var question = new EpmQuestion
        {
            Code = $"q-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            Department = request.Department ?? "عام",
            Context = request.Context ?? "goal",
            Audience = request.Audience ?? "employee",
            Type = request.Type ?? "custom",
            Text = request.Text,
            SuggestedTaskTitle = request.SuggestedTaskTitle,
            Required = request.Required,
            IsOfficial = false,
            CreatedBy = User.Identity?.Name
        };

        _db.EpmQuestions.Add(question);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(ToQuestionDto(question));
    }

    [HttpPost("questionnaires")]
    public async Task<IActionResult> SendQuestionnaire([FromBody] SendQuestionnaireRequest request, CancellationToken cancellationToken)
    {
        await EnsureWorkflowSchema(cancellationToken);
        if (string.IsNullOrWhiteSpace(request.EmployeeName))
            return BadRequest(new { error = "اسم الموظف مطلوب" });
        if (request.QuestionIds.Count == 0)
            return BadRequest(new { error = "يجب اختيار سؤال واحد على الأقل" });

        await EnsureQuestionBankSeeded(cancellationToken);

        var selectedQuestions = await _db.EpmQuestions
            .Where(q => request.QuestionIds.Contains(q.Code) && q.IsActive && !q.IsDeleted)
            .ToListAsync(cancellationToken);

        if (selectedQuestions.Count == 0)
            return BadRequest(new { error = "الأسئلة المختارة غير موجودة في البنك" });

        var questionnaire = new EpmQuestionnaire
        {
            Title = string.IsNullOrWhiteSpace(request.Title) ? $"أسئلة {request.Context} - {request.EmployeeName}" : request.Title,
            Department = request.Department ?? "عام",
            Context = request.Context ?? "goal",
            EmployeeName = request.EmployeeName,
            EmployeeId = request.EmployeeId,
            ManagerName = request.ManagerName,
            ManagerId = request.ManagerId,
            LinkedGoalTitle = request.LinkedGoalTitle,
            LinkedGoalId = request.LinkedGoalId,
            DueDate = ParseDate(request.DueDate),
            Status = "sent",
            SentAt = DateTime.UtcNow,
            CreatedBy = User.Identity?.Name,
            Items = selectedQuestions.Select(q => new EpmQuestionnaireItem
            {
                QuestionId = q.QuestionId,
                QuestionCode = q.Code,
                QuestionText = q.Text,
                Context = q.Context,
                Audience = q.Audience,
                Type = q.Type,
                SuggestedTaskTitle = q.SuggestedTaskTitle,
                Required = q.Required
            }).ToList()
        };

        _db.EpmQuestionnaires.Add(questionnaire);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(ToQuestionnaireDto(questionnaire));
    }

    [HttpPut("questionnaires/{id:int}/answers")]
    public async Task<IActionResult> AnswerQuestionnaire(int id, [FromBody] AnswerQuestionnaireRequest request, CancellationToken cancellationToken)
    {
        await EnsureWorkflowSchema(cancellationToken);
        var questionnaire = await _db.EpmQuestionnaires
            .Include(q => q.Items)
            .AsTracking()
            .FirstOrDefaultAsync(q => q.QuestionnaireId == id && q.IsActive && !q.IsDeleted, cancellationToken);

        if (questionnaire == null)
            return NotFound(new { error = "نموذج الأسئلة غير موجود" });

        foreach (var item in questionnaire.Items)
        {
            if (request.Answers.TryGetValue(item.QuestionCode, out var answer))
            {
                item.Answer = answer;
                item.AnsweredAt = DateTime.UtcNow;
            }
        }

        questionnaire.Status = "answered";
        questionnaire.AnsweredAt = DateTime.UtcNow;
        questionnaire.UpdatedAt = DateTime.UtcNow;
        questionnaire.UpdatedBy = User.Identity?.Name;

        await _db.SaveChangesAsync(cancellationToken);
        return Ok(ToQuestionnaireDto(questionnaire));
    }

    [HttpPost("tasks")]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskRequest request, CancellationToken cancellationToken)
    {
        await EnsureWorkflowSchema(cancellationToken);
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { error = "عنوان المهمة مطلوب" });

        var task = new EpmPerformanceTask
        {
            Title = request.Title,
            Description = request.Description,
            Department = request.Department ?? "عام",
            AssigneeName = request.AssigneeName ?? string.Empty,
            AssigneeId = request.AssigneeId,
            ManagerName = request.ManagerName,
            ManagerId = request.ManagerId,
            SourceType = request.SourceType ?? "self",
            LinkedGoalTitle = request.LinkedGoalTitle,
            LinkedGoalId = request.LinkedGoalId,
            QuestionnaireId = request.QuestionnaireId,
            QuestionnaireItemId = request.QuestionnaireItemId,
            StartDate = ParseDate(request.StartDate) ?? DateTime.UtcNow.Date,
            DueDate = ParseDate(request.DueDate) ?? DateTime.UtcNow.Date.AddDays(7),
            Status = request.Status ?? "notStarted",
            Progress = Math.Clamp(request.Progress ?? 0, 0, 100),
            Priority = request.Priority ?? "medium",
            CreatedByRole = request.CreatedBy ?? "employee",
            CreatedBy = User.Identity?.Name,
            History = new List<EpmTaskHistory>
            {
                new() { Action = request.HistoryAction ?? "تم إنشاء المهمة", ActorName = User.Identity?.Name }
            }
        };

        _db.EpmPerformanceTasks.Add(task);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(ToTaskDto(task));
    }

    [HttpPut("tasks/{id:int}")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskRequest request, CancellationToken cancellationToken)
    {
        await EnsureWorkflowSchema(cancellationToken);
        var task = await _db.EpmPerformanceTasks
            .Include(t => t.History)
            .AsTracking()
            .FirstOrDefaultAsync(t => t.TaskId == id && t.IsActive && !t.IsDeleted, cancellationToken);

        if (task == null)
            return NotFound(new { error = "المهمة غير موجودة" });

        if (request.Title != null) task.Title = request.Title;
        if (request.Description != null) task.Description = request.Description;
        if (request.Department != null) task.Department = request.Department;
        if (request.AssigneeName != null) task.AssigneeName = request.AssigneeName;
        if (request.ManagerName != null) task.ManagerName = request.ManagerName;
        if (request.Status != null) task.Status = request.Status;
        if (request.Priority != null) task.Priority = request.Priority;
        if (request.Progress.HasValue) task.Progress = Math.Clamp(request.Progress.Value, 0, 100);
        if (request.DueDate != null) task.DueDate = ParseDate(request.DueDate);
        if (task.Progress >= 100) task.Status = "completed";

        task.UpdatedAt = DateTime.UtcNow;
        task.UpdatedBy = User.Identity?.Name;

        if (!string.IsNullOrWhiteSpace(request.ActionLabel))
        {
            task.History.Add(new EpmTaskHistory
            {
                Action = request.ActionLabel,
                ActorName = User.Identity?.Name
            });
        }

        await _db.SaveChangesAsync(cancellationToken);
        return Ok(ToTaskDto(task));
    }

    [HttpPost("tasks/{id:int}/extension-request")]
    public async Task<IActionResult> RequestExtension(int id, [FromBody] ExtensionRequestDto request, CancellationToken cancellationToken)
    {
        await EnsureWorkflowSchema(cancellationToken);
        if (string.IsNullOrWhiteSpace(request.Reason) || string.IsNullOrWhiteSpace(request.RequestedDueDate))
            return BadRequest(new { error = "سبب التمديد والتاريخ الجديد مطلوبان" });

        var task = await _db.EpmPerformanceTasks
            .Include(t => t.History)
            .AsTracking()
            .FirstOrDefaultAsync(t => t.TaskId == id && t.IsActive && !t.IsDeleted, cancellationToken);

        if (task == null)
            return NotFound(new { error = "المهمة غير موجودة" });

        var requestedDueDate = ParseDate(request.RequestedDueDate);
        if (!requestedDueDate.HasValue)
            return BadRequest(new { error = "تاريخ التمديد غير صحيح" });

        task.Status = "extensionRequested";
        task.ExtensionRequests.Add(new EpmTaskExtensionRequest
        {
            Reason = request.Reason,
            RequestedDueDate = requestedDueDate.Value,
            Status = "pending"
        });
        task.History.Add(new EpmTaskHistory
        {
            Action = $"طلب الموظف تمديد المهمة إلى {requestedDueDate.Value:yyyy-MM-dd}",
            ActorName = User.Identity?.Name
        });

        await _db.SaveChangesAsync(cancellationToken);
        return Ok(ToTaskDto(task));
    }

    [HttpPost("tasks/{id:int}/extension-decision")]
    public async Task<IActionResult> DecideExtension(int id, [FromBody] ExtensionDecisionDto request, CancellationToken cancellationToken)
    {
        await EnsureWorkflowSchema(cancellationToken);
        var task = await _db.EpmPerformanceTasks
            .Include(t => t.History)
            .Include(t => t.ExtensionRequests)
            .AsTracking()
            .FirstOrDefaultAsync(t => t.TaskId == id && t.IsActive && !t.IsDeleted, cancellationToken);

        if (task == null)
            return NotFound(new { error = "المهمة غير موجودة" });

        var pending = task.ExtensionRequests
            .OrderByDescending(e => e.RequestedAt)
            .FirstOrDefault(e => e.Status == "pending");

        if (pending == null)
            return BadRequest(new { error = "لا يوجد طلب تمديد بانتظار القرار" });

        pending.Status = request.Approved ? "approved" : "rejected";
        pending.DecidedAt = DateTime.UtcNow;
        pending.ManagerComment = request.ManagerComment;
        pending.DecidedBy = User.Identity?.Name;

        if (request.Approved)
        {
            task.Status = "extended";
            task.DueDate = pending.RequestedDueDate;
        }
        else
        {
            task.Status = task.Progress > 0 ? "inProgress" : "notStarted";
        }

        task.History.Add(new EpmTaskHistory
        {
            Action = request.Approved ? "اعتمد المدير طلب التمديد" : "رفض المدير طلب التمديد",
            ActorName = User.Identity?.Name
        });

        await _db.SaveChangesAsync(cancellationToken);
        return Ok(ToTaskDto(task));
    }

    private async Task EnsureQuestionBankSeeded(CancellationToken cancellationToken)
    {
        if (await _db.EpmQuestions.AnyAsync(cancellationToken))
            return;

        _logger.LogInformation("Seeding default EPM workflow question bank");
        _db.EpmQuestions.AddRange(DefaultQuestions.Select(q => new EpmQuestion
        {
            Code = q.Code,
            Department = q.Department,
            Context = q.Context,
            Audience = q.Audience,
            Type = q.Type,
            Text = q.Text,
            SuggestedTaskTitle = q.SuggestedTaskTitle,
            Required = q.Required,
            IsOfficial = true
        }));
        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureWorkflowSchema(CancellationToken cancellationToken)
    {
        if (_schemaEnsured) return;

        await SchemaLock.WaitAsync(cancellationToken);
        try
        {
            if (_schemaEnsured) return;
            await _db.Database.ExecuteSqlRawAsync(WorkflowSchemaSql, cancellationToken);
            _schemaEnsured = true;
        }
        finally
        {
            SchemaLock.Release();
        }
    }

    private static DateTime? ParseDate(string? value)
    {
        return DateTime.TryParse(value, out var date) ? date.Date : null;
    }

    private static QuestionDto ToQuestionDto(EpmQuestion q) => new(
        q.Code,
        q.Department,
        q.Context,
        q.Audience,
        q.Type,
        q.Text,
        q.SuggestedTaskTitle,
        q.Required,
        q.IsOfficial);

    private static QuestionnaireDto ToQuestionnaireDto(EpmQuestionnaire q) => new(
        q.QuestionnaireId,
        q.Title,
        q.Department,
        q.Context,
        q.EmployeeName,
        q.ManagerName,
        q.LinkedGoalTitle,
        q.Status,
        q.SentAt.ToString("yyyy-MM-dd"),
        q.DueDate?.ToString("yyyy-MM-dd"),
        q.AnsweredAt?.ToString("yyyy-MM-dd"),
        q.Items.OrderBy(i => i.ItemId).Select(ToQuestionnaireItemDto).ToList());

    private static QuestionnaireItemDto ToQuestionnaireItemDto(EpmQuestionnaireItem i) => new(
        i.QuestionCode,
        i.QuestionText,
        i.Context,
        i.Audience,
        i.Type,
        i.SuggestedTaskTitle,
        i.Required,
        i.Answer ?? string.Empty,
        i.ConvertedToTask);

    private static TaskDto ToTaskDto(EpmPerformanceTask t)
    {
        var latestExtension = t.ExtensionRequests
            .OrderByDescending(e => e.RequestedAt)
            .FirstOrDefault();

        return new TaskDto(
            t.TaskId,
            t.Title,
            t.Description,
            t.Department,
            t.AssigneeName,
            t.ManagerName,
            t.SourceType,
            t.LinkedGoalTitle,
            t.StartDate?.ToString("yyyy-MM-dd"),
            t.DueDate?.ToString("yyyy-MM-dd"),
            t.Status,
            t.Progress,
            t.Priority,
            t.CreatedByRole,
            t.History.OrderBy(h => h.At).Select(h => new TaskHistoryDto(h.At.ToString("yyyy-MM-dd"), h.Action)).ToList(),
            latestExtension == null ? null : new TaskExtensionDto(
                latestExtension.Reason,
                latestExtension.RequestedDueDate.ToString("yyyy-MM-dd"),
                latestExtension.RequestedAt.ToString("yyyy-MM-dd"),
                latestExtension.Status,
                latestExtension.DecidedAt?.ToString("yyyy-MM-dd"),
                latestExtension.ManagerComment));
    }

    private static readonly DefaultQuestion[] DefaultQuestions =
    [
        new("goal_measurement_001", "عام", "goal", "employee", "text", "ما المهام العملية التي ستنفذها لتحقيق هذا الهدف؟", "تحويل الهدف إلى مهام تنفيذية", true),
        new("goal_measurement_002", "عام", "goal", "employee", "text", "ما الأدلة أو المرفقات التي ستثبت تحقق الناتج المستهدف؟", "تجهيز أدلة إنجاز الهدف", true),
        new("goal_risk_001", "عام", "goal", "employee", "text", "ما المخاطر أو العوائق المتوقعة التي قد تؤخر تنفيذ الهدف؟", "معالجة عوائق تنفيذ الهدف", false),
        new("goal_support_001", "عام", "goal", "employee", "text", "ما الدعم أو الصلاحيات أو البيانات التي تحتاجها من المدير أو الإدارة؟", "طلب دعم لتنفيذ الهدف", false),
        new("evaluation_evidence_001", "عام", "evaluation", "employee", "text", "اذكر أهم ثلاثة إنجازات مرتبطة بميثاق الأداء خلال الفترة.", "توثيق إنجازات فترة التقييم", true),
        new("evaluation_improvement_001", "عام", "evaluation", "employee", "text", "ما الجدارة أو المهارة التي تحتاج إلى تحسينها في الفترة القادمة؟", "خطة تحسين مهارة أو جدارة", true),
        new("extension_reason_001", "عام", "extension", "employee", "text", "ما سبب طلب تمديد مدة المهمة؟ وما التاريخ الجديد المقترح؟", "استكمال المهمة بعد التمديد", true),
        new("manager_direction_001", "عام", "directive", "manager", "text", "ما التوجيه الإداري المطلوب تحويله إلى مهمة للموظف؟", "تنفيذ توجيه المدير", true),
        new("finance_goal_001", "المالية", "goal", "employee", "text", "ما معيار الالتزام المالي المطلوب: نسبة صرف، مطابقة، إغلاق مطالبة، أو زمن معالجة؟", "متابعة معيار الالتزام المالي", true),
        new("hr_goal_001", "الموارد البشرية", "goal", "employee", "text", "ما مؤشر قياس الخدمة HR: زمن إنجاز، دقة بيانات، رضا مستفيد، أو اكتمال إجراء؟", "تنفيذ مؤشر خدمة الموارد البشرية", true),
        new("projects_goal_001", "المشاريع", "goal", "employee", "text", "ما المعالم الرئيسية للهدف وما تاريخ تسليم كل مخرج؟", "تسليم معلم مشروع مرتبط بالهدف", true),
        new("technical_goal_001", "تقنية المعلومات", "goal", "employee", "text", "ما معيار الجودة الفني المطلوب: توفر، زمن استجابة، أمن، أو إغلاق بلاغات؟", "تحقيق معيار جودة تقني", true),
        new("field_goal_001", "الأعمال الميدانية", "goal", "employee", "text", "ما خطة التنفيذ الميداني وعدد الجولات أو المواقع المستهدفة؟", "تنفيذ جولة أو مهمة ميدانية", true)
    ];

    private const string WorkflowSchemaSql = """
CREATE TABLE IF NOT EXISTS "EpmQuestions" (
    "QuestionId" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "Code" varchar(120) NOT NULL,
    "Department" varchar(200) NOT NULL DEFAULT 'عام',
    "Context" varchar(50) NOT NULL DEFAULT 'goal',
    "Audience" varchar(50) NOT NULL DEFAULT 'employee',
    "Type" varchar(50) NOT NULL DEFAULT 'text',
    "Text" varchar(2000) NOT NULL,
    "SuggestedTaskTitle" varchar(500) NULL,
    "Required" boolean NOT NULL DEFAULT false,
    "IsOfficial" boolean NOT NULL DEFAULT false,
    "IsActive" boolean NOT NULL DEFAULT true,
    "IsDeleted" boolean NOT NULL DEFAULT false,
    "TenantId" bigint NOT NULL DEFAULT 1,
    "CreatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" text NULL,
    "UpdatedAt" timestamp without time zone NULL,
    "UpdatedBy" text NULL
);

CREATE TABLE IF NOT EXISTS "EpmQuestionnaires" (
    "QuestionnaireId" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "Title" varchar(500) NOT NULL,
    "Department" varchar(200) NOT NULL DEFAULT 'عام',
    "Context" varchar(50) NOT NULL DEFAULT 'goal',
    "EmployeeName" varchar(200) NOT NULL,
    "EmployeeId" integer NULL,
    "ManagerName" varchar(200) NULL,
    "ManagerId" integer NULL,
    "LinkedGoalTitle" varchar(500) NULL,
    "LinkedGoalId" integer NULL,
    "Status" varchar(50) NOT NULL DEFAULT 'sent',
    "SentAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DueDate" timestamp without time zone NULL,
    "AnsweredAt" timestamp without time zone NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "IsDeleted" boolean NOT NULL DEFAULT false,
    "TenantId" bigint NOT NULL DEFAULT 1,
    "CreatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" text NULL,
    "UpdatedAt" timestamp without time zone NULL,
    "UpdatedBy" text NULL
);

CREATE TABLE IF NOT EXISTS "EpmQuestionnaireItems" (
    "ItemId" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "QuestionnaireId" integer NOT NULL REFERENCES "EpmQuestionnaires"("QuestionnaireId") ON DELETE CASCADE,
    "QuestionId" integer NULL REFERENCES "EpmQuestions"("QuestionId") ON DELETE SET NULL,
    "QuestionCode" varchar(120) NOT NULL,
    "QuestionText" varchar(2000) NOT NULL,
    "Context" varchar(50) NOT NULL DEFAULT 'goal',
    "Audience" varchar(50) NOT NULL DEFAULT 'employee',
    "Type" varchar(50) NOT NULL DEFAULT 'text',
    "SuggestedTaskTitle" varchar(500) NULL,
    "Required" boolean NOT NULL DEFAULT false,
    "Answer" varchar(4000) NULL,
    "AnsweredAt" timestamp without time zone NULL,
    "ConvertedToTask" boolean NOT NULL DEFAULT false,
    "IsActive" boolean NOT NULL DEFAULT true,
    "IsDeleted" boolean NOT NULL DEFAULT false,
    "TenantId" bigint NOT NULL DEFAULT 1,
    "CreatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EpmPerformanceTasks" (
    "TaskId" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "Title" varchar(500) NOT NULL,
    "Description" varchar(4000) NULL,
    "Department" varchar(200) NOT NULL DEFAULT 'عام',
    "AssigneeName" varchar(200) NOT NULL,
    "AssigneeId" integer NULL,
    "ManagerName" varchar(200) NULL,
    "ManagerId" integer NULL,
    "SourceType" varchar(50) NOT NULL DEFAULT 'self',
    "LinkedGoalTitle" varchar(500) NULL,
    "LinkedGoalId" integer NULL,
    "QuestionnaireId" integer NULL,
    "QuestionnaireItemId" integer NULL,
    "StartDate" timestamp without time zone NULL,
    "DueDate" timestamp without time zone NULL,
    "Status" varchar(50) NOT NULL DEFAULT 'notStarted',
    "Progress" integer NOT NULL DEFAULT 0,
    "Priority" varchar(50) NOT NULL DEFAULT 'medium',
    "CreatedByRole" varchar(50) NULL DEFAULT 'employee',
    "IsActive" boolean NOT NULL DEFAULT true,
    "IsDeleted" boolean NOT NULL DEFAULT false,
    "TenantId" bigint NOT NULL DEFAULT 1,
    "CreatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" text NULL,
    "UpdatedAt" timestamp without time zone NULL,
    "UpdatedBy" text NULL
);

CREATE TABLE IF NOT EXISTS "EpmTaskHistories" (
    "HistoryId" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "TaskId" integer NOT NULL REFERENCES "EpmPerformanceTasks"("TaskId") ON DELETE CASCADE,
    "Action" varchar(1000) NOT NULL,
    "ActorName" varchar(200) NULL,
    "At" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "TenantId" bigint NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "EpmTaskExtensionRequests" (
    "ExtensionRequestId" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "TaskId" integer NOT NULL REFERENCES "EpmPerformanceTasks"("TaskId") ON DELETE CASCADE,
    "Reason" varchar(2000) NOT NULL,
    "RequestedDueDate" timestamp without time zone NOT NULL,
    "Status" varchar(50) NOT NULL DEFAULT 'pending',
    "RequestedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DecidedAt" timestamp without time zone NULL,
    "ManagerComment" varchar(2000) NULL,
    "DecidedBy" varchar(200) NULL,
    "TenantId" bigint NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_EpmQuestions_Tenant_Code" ON "EpmQuestions" ("TenantId", "Code");
CREATE INDEX IF NOT EXISTS "IX_EpmQuestions_Tenant_Department_Context" ON "EpmQuestions" ("TenantId", "Department", "Context");
CREATE INDEX IF NOT EXISTS "IX_EpmQuestionnaires_Tenant_Status_Due" ON "EpmQuestionnaires" ("TenantId", "Status", "DueDate");
CREATE INDEX IF NOT EXISTS "IX_EpmQuestionnaires_Tenant_Employee" ON "EpmQuestionnaires" ("TenantId", "EmployeeId");
CREATE INDEX IF NOT EXISTS "IX_EpmQuestionnaires_Tenant_Manager" ON "EpmQuestionnaires" ("TenantId", "ManagerId");
CREATE INDEX IF NOT EXISTS "IX_EpmQuestionnaireItems_Questionnaire" ON "EpmQuestionnaireItems" ("QuestionnaireId");
CREATE INDEX IF NOT EXISTS "IX_EpmPerformanceTasks_Tenant_Status_Due" ON "EpmPerformanceTasks" ("TenantId", "Status", "DueDate");
CREATE INDEX IF NOT EXISTS "IX_EpmPerformanceTasks_Tenant_Department" ON "EpmPerformanceTasks" ("TenantId", "Department");
CREATE INDEX IF NOT EXISTS "IX_EpmPerformanceTasks_Tenant_Assignee" ON "EpmPerformanceTasks" ("TenantId", "AssigneeId");
CREATE INDEX IF NOT EXISTS "IX_EpmPerformanceTasks_Tenant_Manager" ON "EpmPerformanceTasks" ("TenantId", "ManagerId");
CREATE INDEX IF NOT EXISTS "IX_EpmTaskHistories_Task_At" ON "EpmTaskHistories" ("TaskId", "At");
CREATE INDEX IF NOT EXISTS "IX_EpmTaskExtensionRequests_Tenant_Status" ON "EpmTaskExtensionRequests" ("TenantId", "Status");
CREATE INDEX IF NOT EXISTS "IX_EpmTaskExtensionRequests_Task" ON "EpmTaskExtensionRequests" ("TaskId");
""";
}

public record WorkflowStoreDto(IReadOnlyList<QuestionDto> Questions, IReadOnlyList<QuestionnaireDto> Questionnaires, IReadOnlyList<TaskDto> Tasks);
public record QuestionDto(string Id, string Department, string Context, string Audience, string Type, string Text, string? SuggestedTaskTitle, bool Required, bool IsOfficial);
public record QuestionnaireDto(int Id, string Title, string Department, string Context, string EmployeeName, string? ManagerName, string? LinkedGoalTitle, string Status, string SentAt, string? DueDate, string? AnsweredAt, IReadOnlyList<QuestionnaireItemDto> Questions);
public record QuestionnaireItemDto(string Id, string Text, string Context, string Audience, string Type, string? SuggestedTaskTitle, bool Required, string Answer, bool ConvertedToTask);
public record TaskDto(int Id, string Title, string? Description, string Department, string AssigneeName, string? ManagerName, string SourceType, string? LinkedGoalTitle, string? StartDate, string? DueDate, string Status, int Progress, string Priority, string? CreatedBy, IReadOnlyList<TaskHistoryDto> History, TaskExtensionDto? ExtensionRequest);
public record TaskHistoryDto(string At, string Action);
public record TaskExtensionDto(string Reason, string RequestedDueDate, string RequestedAt, string Status, string? DecidedAt, string? ManagerComment);
public record UpsertQuestionRequest(string? Department, string? Context, string? Audience, string? Type, string Text, string? SuggestedTaskTitle, bool Required);
public record SendQuestionnaireRequest(string? Title, string? Department, string? Context, string EmployeeName, int? EmployeeId, string? ManagerName, int? ManagerId, string? LinkedGoalTitle, int? LinkedGoalId, string? DueDate, List<string> QuestionIds);
public record AnswerQuestionnaireRequest(Dictionary<string, string> Answers);
public record CreateTaskRequest(string Title, string? Description, string? Department, string? AssigneeName, int? AssigneeId, string? ManagerName, int? ManagerId, string? SourceType, string? LinkedGoalTitle, int? LinkedGoalId, int? QuestionnaireId, int? QuestionnaireItemId, string? StartDate, string? DueDate, string? Status, int? Progress, string? Priority, string? CreatedBy, string? HistoryAction);
public record UpdateTaskRequest(string? Title, string? Description, string? Department, string? AssigneeName, string? ManagerName, string? Status, int? Progress, string? Priority, string? DueDate, string? ActionLabel);
public record ExtensionRequestDto(string Reason, string RequestedDueDate);
public record ExtensionDecisionDto(bool Approved, string? ManagerComment);
internal record DefaultQuestion(string Code, string Department, string Context, string Audience, string Type, string Text, string SuggestedTaskTitle, bool Required);
