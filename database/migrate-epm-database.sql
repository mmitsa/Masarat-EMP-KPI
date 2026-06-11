-- ================================================================
-- Masarat EPM Database Migration Script
-- Adds TenantId + IsDeleted to existing tables
-- Creates new KPIs and Reviews tables
-- ================================================================

USE [Masarat_EPM];
GO

-- ================================================================
-- 1. Add TenantId + IsDeleted to PerformanceCharters
-- ================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PerformanceCharters') AND name = 'TenantId')
BEGIN
    ALTER TABLE dbo.PerformanceCharters ADD TenantId INT NOT NULL DEFAULT 1;
    PRINT 'Added TenantId to PerformanceCharters.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PerformanceCharters') AND name = 'IsDeleted')
BEGIN
    ALTER TABLE dbo.PerformanceCharters ADD IsDeleted BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsDeleted to PerformanceCharters.';
END
GO

-- ================================================================
-- 2. Add TenantId + IsDeleted to Goals
-- ================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Goals') AND name = 'TenantId')
BEGIN
    ALTER TABLE dbo.Goals ADD TenantId INT NOT NULL DEFAULT 1;
    PRINT 'Added TenantId to Goals.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Goals') AND name = 'IsDeleted')
BEGIN
    ALTER TABLE dbo.Goals ADD IsDeleted BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsDeleted to Goals.';
END
GO

-- ================================================================
-- 3. Add TenantId + IsDeleted to Competencies
-- ================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Competencies') AND name = 'TenantId')
BEGIN
    ALTER TABLE dbo.Competencies ADD TenantId INT NOT NULL DEFAULT 1;
    PRINT 'Added TenantId to Competencies.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Competencies') AND name = 'IsDeleted')
BEGIN
    ALTER TABLE dbo.Competencies ADD IsDeleted BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsDeleted to Competencies.';
END
GO

-- ================================================================
-- 4. Add TenantId + IsDeleted to ExcellenceElements
-- ================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ExcellenceElements') AND name = 'TenantId')
BEGIN
    ALTER TABLE dbo.ExcellenceElements ADD TenantId INT NOT NULL DEFAULT 1;
    PRINT 'Added TenantId to ExcellenceElements.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ExcellenceElements') AND name = 'IsDeleted')
BEGIN
    ALTER TABLE dbo.ExcellenceElements ADD IsDeleted BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsDeleted to ExcellenceElements.';
END
GO

-- ================================================================
-- 5. Create Indexes on TenantId for existing tables
-- ================================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PerformanceCharters_TenantId')
    CREATE INDEX IX_PerformanceCharters_TenantId ON dbo.PerformanceCharters(TenantId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Goals_TenantId')
    CREATE INDEX IX_Goals_TenantId ON dbo.Goals(TenantId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Competencies_TenantId')
    CREATE INDEX IX_Competencies_TenantId ON dbo.Competencies(TenantId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ExcellenceElements_TenantId')
    CREATE INDEX IX_ExcellenceElements_TenantId ON dbo.ExcellenceElements(TenantId);
GO

-- ================================================================
-- 6. Create KPIs Table
-- ================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'KPIs')
BEGIN
    CREATE TABLE dbo.KPIs (
        KPIId                   INT IDENTITY(1,1) PRIMARY KEY,
        CharterId               INT NOT NULL REFERENCES dbo.PerformanceCharters(CharterId),
        GoalId                  INT NULL REFERENCES dbo.Goals(GoalId),
        Title                   NVARCHAR(300) NOT NULL,
        Description             NVARCHAR(1000) NULL,
        Unit                    NVARCHAR(50) NOT NULL DEFAULT N'نسبة مئوية',
        TargetValue             DECIMAL(18,2) NOT NULL DEFAULT 0,
        ActualValue             DECIMAL(18,2) NULL,
        Weight                  DECIMAL(5,2) NOT NULL DEFAULT 0,
        AchievementPercentage   DECIMAL(5,2) NULL,
        MeasurementFrequency    INT NOT NULL DEFAULT 0,
            -- 0=شهري, 1=ربع سنوي, 2=نصف سنوي, 3=سنوي
        Status                  NVARCHAR(50) NOT NULL DEFAULT N'Draft',
            -- Draft, Active, Completed
        IsActive                BIT NOT NULL DEFAULT 1,
        CreatedAt               DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CreatedBy               NVARCHAR(MAX) NULL,
        UpdatedAt               DATETIME2 NULL,
        UpdatedBy               NVARCHAR(MAX) NULL,
        TenantId                INT NOT NULL DEFAULT 1,
        IsDeleted               BIT NOT NULL DEFAULT 0
    );
    CREATE INDEX IX_KPIs_CharterId ON dbo.KPIs(CharterId);
    CREATE INDEX IX_KPIs_GoalId ON dbo.KPIs(GoalId);
    CREATE INDEX IX_KPIs_TenantId ON dbo.KPIs(TenantId);
    PRINT 'Table KPIs created.';
END
GO

-- ================================================================
-- 7. Create Reviews Table
-- ================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Reviews')
BEGIN
    CREATE TABLE dbo.Reviews (
        ReviewId                INT IDENTITY(1,1) PRIMARY KEY,
        CharterId               INT NOT NULL REFERENCES dbo.PerformanceCharters(CharterId),
        ReviewType              NVARCHAR(50) NOT NULL DEFAULT N'Annual',
            -- Q1, Q2, Q3, Annual
        ReviewerEmployeeId      INT NULL,
        ReviewerName            NVARCHAR(200) NULL,
        GoalsScore              DECIMAL(5,2) NULL,
        CompetenciesScore       DECIMAL(5,2) NULL,
        TotalScore              DECIMAL(5,2) NULL,
        OverallRating           NVARCHAR(50) NULL,
            -- Outstanding, Exceeds, Meets, NeedsImprovement, Unsatisfactory
        StrengthNotes           NVARCHAR(2000) NULL,
        ImprovementNotes        NVARCHAR(2000) NULL,
        ActionPlan              NVARCHAR(2000) NULL,
        Status                  NVARCHAR(50) NOT NULL DEFAULT N'Draft',
            -- Draft, Submitted, Acknowledged, Appealed
        ReviewDate              DATETIME2 NULL,
        IsActive                BIT NOT NULL DEFAULT 1,
        CreatedAt               DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CreatedBy               NVARCHAR(MAX) NULL,
        UpdatedAt               DATETIME2 NULL,
        UpdatedBy               NVARCHAR(MAX) NULL,
        TenantId                INT NOT NULL DEFAULT 1,
        IsDeleted               BIT NOT NULL DEFAULT 0
    );
    CREATE INDEX IX_Reviews_CharterId ON dbo.Reviews(CharterId);
    CREATE INDEX IX_Reviews_TenantId ON dbo.Reviews(TenantId);
    CREATE INDEX IX_Reviews_ReviewerEmployeeId ON dbo.Reviews(ReviewerEmployeeId);
    PRINT 'Table Reviews created.';
END
GO

-- ================================================================
-- 8. Create additional indexes for better performance
-- ================================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PerformanceCharters_EmployeeId')
    CREATE INDEX IX_PerformanceCharters_EmployeeId ON dbo.PerformanceCharters(EmployeeId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PerformanceCharters_FiscalYear')
    CREATE INDEX IX_PerformanceCharters_FiscalYear ON dbo.PerformanceCharters(FiscalYear);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Goals_CharterId')
    CREATE INDEX IX_Goals_CharterId ON dbo.Goals(CharterId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Competencies_CharterId')
    CREATE INDEX IX_Competencies_CharterId ON dbo.Competencies(CharterId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ExcellenceElements_CharterId')
    CREATE INDEX IX_ExcellenceElements_CharterId ON dbo.ExcellenceElements(CharterId);
GO

PRINT '================================================================';
PRINT 'Masarat_EPM database migration completed successfully!';
PRINT '================================================================';
