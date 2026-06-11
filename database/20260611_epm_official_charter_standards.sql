USE [Masarat_EPM];
GO

IF COL_LENGTH('dbo.PerformanceCharters', 'JobTitle') IS NULL
    ALTER TABLE dbo.PerformanceCharters ADD JobTitle NVARCHAR(200) NULL;
GO

IF COL_LENGTH('dbo.PerformanceCharters', 'JobNumber') IS NULL
    ALTER TABLE dbo.PerformanceCharters ADD JobNumber NVARCHAR(50) NULL;
GO

IF COL_LENGTH('dbo.PerformanceCharters', 'AgencyName') IS NULL
    ALTER TABLE dbo.PerformanceCharters ADD AgencyName NVARCHAR(200) NULL;
GO

IF COL_LENGTH('dbo.PerformanceCharters', 'DepartmentName') IS NULL
    ALTER TABLE dbo.PerformanceCharters ADD DepartmentName NVARCHAR(200) NULL;
GO

IF COL_LENGTH('dbo.PerformanceCharters', 'JobCategory') IS NULL
    ALTER TABLE dbo.PerformanceCharters ADD JobCategory NVARCHAR(50) NOT NULL CONSTRAINT DF_PerformanceCharters_JobCategory DEFAULT N'nonSupervisory';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PerformanceCharters_JobCategory' AND object_id = OBJECT_ID('dbo.PerformanceCharters'))
    CREATE INDEX IX_PerformanceCharters_JobCategory ON dbo.PerformanceCharters(JobCategory);
GO

PRINT N'EPM official charter standards fields applied.';
GO

