-- Migration: إضافة دعم المزامنة (Sync Support)
-- تاريخ: 2026-02-12

-- 1. إضافة عمود SyncVersion لجميع الجداول الرئيسية
-- HR Module
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[HR].[Employees]') AND name = 'SyncVersion')
    ALTER TABLE [HR].[Employees] ADD [SyncVersion] BIGINT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[HR].[Attendances]') AND name = 'SyncVersion')
    ALTER TABLE [HR].[Attendances] ADD [SyncVersion] BIGINT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[HR].[Departments]') AND name = 'SyncVersion')
    ALTER TABLE [HR].[Departments] ADD [SyncVersion] BIGINT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[HR].[LeaveRequests]') AND name = 'SyncVersion')
    ALTER TABLE [HR].[LeaveRequests] ADD [SyncVersion] BIGINT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[HR].[WorkLocations]') AND name = 'SyncVersion')
    ALTER TABLE [HR].[WorkLocations] ADD [SyncVersion] BIGINT NOT NULL DEFAULT 0;

-- Warehouse Module
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[Warehouse].[Items]') AND name = 'SyncVersion')
    ALTER TABLE [Warehouse].[Items] ADD [SyncVersion] BIGINT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[Warehouse].[Transactions]') AND name = 'SyncVersion')
    ALTER TABLE [Warehouse].[Transactions] ADD [SyncVersion] BIGINT NOT NULL DEFAULT 0;

-- 2. إنشاء جدول SyncLogs
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[Core].[SyncLogs]') AND type = 'U')
BEGIN
    -- Create schema if not exists
    IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'Core')
        EXEC('CREATE SCHEMA [Core]');

    CREATE TABLE [Core].[SyncLogs] (
        [Id]              BIGINT IDENTITY(1,1) NOT NULL,
        [EntityType]      NVARCHAR(128)        NOT NULL,
        [EntityId]        INT                  NOT NULL,
        [TenantId]        BIGINT               NOT NULL,
        [OperationType]   INT                  NOT NULL, -- 0=Created, 1=Updated, 2=SoftDeleted, 3=Restored
        [SyncVersion]     BIGINT               NOT NULL,
        [ChangedFields]   NVARCHAR(MAX)        NULL,     -- JSON array
        [OccurredAt]      DATETIMEOFFSET(7)    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        [UserId]          NVARCHAR(256)        NULL,
        CONSTRAINT [PK_SyncLogs] PRIMARY KEY CLUSTERED ([Id] ASC)
    );

    -- فهارس للاستعلام السريع
    CREATE NONCLUSTERED INDEX [IX_SyncLogs_Entity_Tenant_Version]
        ON [Core].[SyncLogs] ([EntityType], [TenantId], [SyncVersion])
        INCLUDE ([EntityId], [OperationType], [ChangedFields], [OccurredAt]);

    CREATE NONCLUSTERED INDEX [IX_SyncLogs_TenantId]
        ON [Core].[SyncLogs] ([TenantId])
        INCLUDE ([EntityType], [SyncVersion]);

    CREATE NONCLUSTERED INDEX [IX_SyncLogs_OccurredAt]
        ON [Core].[SyncLogs] ([OccurredAt])
        INCLUDE ([EntityType], [TenantId]);
END

-- 3. فهارس على SyncVersion في الجداول الرئيسية
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Employees_SyncVersion' AND object_id = OBJECT_ID(N'[HR].[Employees]'))
    CREATE NONCLUSTERED INDEX [IX_Employees_SyncVersion] ON [HR].[Employees] ([SyncVersion]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Attendances_SyncVersion' AND object_id = OBJECT_ID(N'[HR].[Attendances]'))
    CREATE NONCLUSTERED INDEX [IX_Attendances_SyncVersion] ON [HR].[Attendances] ([SyncVersion]);

PRINT 'Migration 20260212_AddSyncSupport completed successfully.';
