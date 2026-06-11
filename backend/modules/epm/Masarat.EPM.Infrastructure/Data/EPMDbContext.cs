using Masarat.EPM.Domain.Entities;
using Masarat.Core.Database;
using Masarat.Core.MultiTenancy;
using Microsoft.EntityFrameworkCore;

namespace Masarat.EPM.Infrastructure.Data;

/// <summary>
/// سياق قاعدة البيانات لنظام إدارة الأداء - Multi-Tenant
/// </summary>
public class EPMDbContext : BaseTenantDbContext
{
    public EPMDbContext(DbContextOptions<EPMDbContext> options, ITenantAccessor tenantAccessor)
        : base(options, tenantAccessor)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured) return;

        optionsBuilder.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
    }

    public DbSet<PerformanceCharter> PerformanceCharters { get; set; }
    public DbSet<Goal> Goals { get; set; }
    public DbSet<Competency> Competencies { get; set; }
    public DbSet<ExcellenceElement> ExcellenceElements { get; set; }
    public DbSet<EmployeeSnapshot> EmployeeSnapshots { get; set; }
    public DbSet<IntegrationSyncLog> IntegrationSyncLogs { get; set; }
    public DbSet<EpmQuestion> EpmQuestions { get; set; }
    public DbSet<EpmQuestionnaire> EpmQuestionnaires { get; set; }
    public DbSet<EpmQuestionnaireItem> EpmQuestionnaireItems { get; set; }
    public DbSet<EpmPerformanceTask> EpmPerformanceTasks { get; set; }
    public DbSet<EpmTaskHistory> EpmTaskHistories { get; set; }
    public DbSet<EpmTaskExtensionRequest> EpmTaskExtensionRequests { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure PerformanceCharter
        modelBuilder.Entity<PerformanceCharter>(entity =>
        {
            entity.ToTable("PerformanceCharters");
            entity.HasKey(e => e.CharterId);

            entity.HasIndex(e => new { e.TenantId, e.EmployeeId, e.FiscalYear })
                .IsUnique()
                .HasDatabaseName("IX_Charter_Tenant_Employee_Year");

            entity.HasIndex(e => e.ManagerId)
                .HasDatabaseName("IX_Charter_Manager");

            entity.HasIndex(e => e.FiscalYear)
                .HasDatabaseName("IX_Charter_FiscalYear");

            entity.HasIndex(e => e.Status)
                .HasDatabaseName("IX_Charter_Status");

            // Relationships
            entity.HasMany(c => c.Goals)
                .WithOne(g => g.Charter)
                .HasForeignKey(g => g.CharterId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(c => c.Competencies)
                .WithOne(c => c.Charter)
                .HasForeignKey(c => c.CharterId)
                .OnDelete(DeleteBehavior.Cascade);

            // Default values
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Status).HasDefaultValue("Draft");
            entity.Property(e => e.JobCategory).HasDefaultValue("nonSupervisory");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.GoalsScore).HasPrecision(5, 2);
            entity.Property(e => e.CompetenciesScore).HasPrecision(5, 2);
            entity.Property(e => e.TotalScore).HasPrecision(5, 2);
        });

        // Configure Goal
        modelBuilder.Entity<Goal>(entity =>
        {
            entity.ToTable("Goals");
            entity.HasKey(e => e.GoalId);

            entity.HasIndex(e => e.CharterId)
                .HasDatabaseName("IX_Goal_Charter");

            entity.HasIndex(e => new { e.CharterId, e.OrderIndex })
                .HasDatabaseName("IX_Goal_Charter_Order");

            entity.Property(e => e.Weight).HasPrecision(5, 2);
            entity.Property(e => e.CompletionPercentage).HasPrecision(5, 2);
            entity.Property(e => e.ActualScore).HasPrecision(5, 2);
            entity.Property(e => e.WeightedScore).HasPrecision(5, 2);

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Status).HasDefaultValue("Pending");
        });

        // Configure Competency
        modelBuilder.Entity<Competency>(entity =>
        {
            entity.ToTable("Competencies");
            entity.HasKey(e => e.CompetencyId);

            entity.HasIndex(e => e.CharterId)
                .HasDatabaseName("IX_Competency_Charter");

            entity.HasIndex(e => e.CompetencyType)
                .HasDatabaseName("IX_Competency_Type");

            entity.Property(e => e.Weight).HasPrecision(5, 2);
            entity.Property(e => e.ScorePercentage).HasPrecision(5, 2);
            entity.Property(e => e.WeightedScore).HasPrecision(5, 2);

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Configure ExcellenceElement
        modelBuilder.Entity<ExcellenceElement>(entity =>
        {
            entity.ToTable("ExcellenceElements");
            entity.HasKey(e => e.ElementId);

            entity.HasIndex(e => e.CharterId)
                .HasDatabaseName("IX_Excellence_Charter");

            entity.HasIndex(e => e.ElementType)
                .HasDatabaseName("IX_Excellence_Type");

            entity.HasIndex(e => e.ApprovalStatus)
                .HasDatabaseName("IX_Excellence_Status");

            entity.Property(e => e.BonusPoints).HasPrecision(4, 2);

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.ApprovalStatus).HasDefaultValue("Pending");
        });

        // Configure EmployeeSnapshot
        modelBuilder.Entity<EmployeeSnapshot>(entity =>
        {
            entity.ToTable("EmployeeSnapshots");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => new { e.TenantId, e.SourceSystem, e.SourceEmployeeId })
                .IsUnique()
                .HasDatabaseName("IX_EmployeeSnapshot_Tenant_Source_Employee");

            entity.HasIndex(e => new { e.TenantId, e.NationalId })
                .HasDatabaseName("IX_EmployeeSnapshot_Tenant_NationalId");

            entity.HasIndex(e => e.DepartmentId)
                .HasDatabaseName("IX_EmployeeSnapshot_Department");

            entity.HasIndex(e => e.ManagerEmployeeId)
                .HasDatabaseName("IX_EmployeeSnapshot_Manager");

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.SourceSystem).HasDefaultValue("HR");
            entity.Property(e => e.EmploymentStatus).HasDefaultValue("Active");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.LastSyncedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Configure IntegrationSyncLog
        modelBuilder.Entity<IntegrationSyncLog>(entity =>
        {
            entity.ToTable("IntegrationSyncLogs");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => new { e.TenantId, e.IntegrationName, e.StartedAt })
                .HasDatabaseName("IX_IntegrationSyncLog_Tenant_Name_StartedAt");

            entity.Property(e => e.StartedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Status).HasDefaultValue("Started");
        });

        // Configure EPM Workflow Question Bank
        modelBuilder.Entity<EpmQuestion>(entity =>
        {
            entity.ToTable("EpmQuestions");
            entity.HasKey(e => e.QuestionId);
            entity.HasIndex(e => new { e.TenantId, e.Code }).IsUnique().HasDatabaseName("IX_EpmQuestions_Tenant_Code");
            entity.HasIndex(e => new { e.TenantId, e.Department, e.Context }).HasDatabaseName("IX_EpmQuestions_Tenant_Department_Context");
            entity.HasIndex(e => e.Audience).HasDatabaseName("IX_EpmQuestions_Audience");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<EpmQuestionnaire>(entity =>
        {
            entity.ToTable("EpmQuestionnaires");
            entity.HasKey(e => e.QuestionnaireId);
            entity.HasIndex(e => new { e.TenantId, e.Status, e.DueDate }).HasDatabaseName("IX_EpmQuestionnaires_Tenant_Status_Due");
            entity.HasIndex(e => new { e.TenantId, e.EmployeeId }).HasDatabaseName("IX_EpmQuestionnaires_Tenant_Employee");
            entity.HasIndex(e => new { e.TenantId, e.ManagerId }).HasDatabaseName("IX_EpmQuestionnaires_Tenant_Manager");
            entity.HasMany(e => e.Items)
                .WithOne(e => e.Questionnaire)
                .HasForeignKey(e => e.QuestionnaireId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.Status).HasDefaultValue("sent");
            entity.Property(e => e.SentAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<EpmQuestionnaireItem>(entity =>
        {
            entity.ToTable("EpmQuestionnaireItems");
            entity.HasKey(e => e.ItemId);
            entity.HasIndex(e => e.QuestionnaireId).HasDatabaseName("IX_EpmQuestionnaireItems_Questionnaire");
            entity.HasOne(e => e.Question)
                .WithMany()
                .HasForeignKey(e => e.QuestionId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<EpmPerformanceTask>(entity =>
        {
            entity.ToTable("EpmPerformanceTasks");
            entity.HasKey(e => e.TaskId);
            entity.HasIndex(e => new { e.TenantId, e.Status, e.DueDate }).HasDatabaseName("IX_EpmPerformanceTasks_Tenant_Status_Due");
            entity.HasIndex(e => new { e.TenantId, e.Department }).HasDatabaseName("IX_EpmPerformanceTasks_Tenant_Department");
            entity.HasIndex(e => new { e.TenantId, e.AssigneeId }).HasDatabaseName("IX_EpmPerformanceTasks_Tenant_Assignee");
            entity.HasIndex(e => new { e.TenantId, e.ManagerId }).HasDatabaseName("IX_EpmPerformanceTasks_Tenant_Manager");
            entity.HasMany(e => e.History)
                .WithOne(e => e.Task)
                .HasForeignKey(e => e.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(e => e.ExtensionRequests)
                .WithOne(e => e.Task)
                .HasForeignKey(e => e.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.Status).HasDefaultValue("notStarted");
            entity.Property(e => e.Priority).HasDefaultValue("medium");
            entity.Property(e => e.Progress).HasDefaultValue(0);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<EpmTaskHistory>(entity =>
        {
            entity.ToTable("EpmTaskHistories");
            entity.HasKey(e => e.HistoryId);
            entity.HasIndex(e => new { e.TaskId, e.At }).HasDatabaseName("IX_EpmTaskHistories_Task_At");
            entity.Property(e => e.At).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<EpmTaskExtensionRequest>(entity =>
        {
            entity.ToTable("EpmTaskExtensionRequests");
            entity.HasKey(e => e.ExtensionRequestId);
            entity.HasIndex(e => new { e.TenantId, e.Status }).HasDatabaseName("IX_EpmTaskExtensionRequests_Tenant_Status");
            entity.HasIndex(e => e.TaskId).HasDatabaseName("IX_EpmTaskExtensionRequests_Task");
            entity.Property(e => e.Status).HasDefaultValue("pending");
            entity.Property(e => e.RequestedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // ═══════════════════════════════════════════════════════════════
        // Multi-Tenancy + Soft Delete Filters
        // ═══════════════════════════════════════════════════════════════
        modelBuilder.ApplyTenantFilters<EPMDbContext>(TenantAccessor);
        modelBuilder.AddTenantIndexes();
    }
}
