-- =====================================================
-- Masarat Platform - Performance Optimization Indexes
-- Created: 2026-02-03
-- Description: Additional indexes for query optimization
-- =====================================================

USE [Masarat_HR];
GO

-- =====================================================
-- HR Module Indexes
-- =====================================================

-- Employee search optimization
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Employees_Search')
CREATE NONCLUSTERED INDEX IX_Employees_Search
ON Employees (ArName, EnName, NationalId)
INCLUDE (DepartmentId, JobId, IsActive)
WHERE IsDeleted = 0;
GO

-- Attendance date range queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Attendances_DateRange')
CREATE NONCLUSTERED INDEX IX_Attendances_DateRange
ON Attendances (EmployeeId, [Date])
INCLUDE (CheckInTime, CheckOutTime, Status)
WHERE IsDeleted = 0;
GO

-- Leave status tracking
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Leaves_Status_Date')
CREATE NONCLUSTERED INDEX IX_Leaves_Status_Date
ON Leaves (Status, StartDate, EndDate)
INCLUDE (EmployeeId, LeaveType, TotalDays)
WHERE IsDeleted = 0;
GO

-- Expatriate document expiry tracking
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkPermits_Expiry')
CREATE NONCLUSTERED INDEX IX_WorkPermits_Expiry
ON WorkPermits (ExpiryDate, Status)
INCLUDE (ExpatriateId, PermitNumber)
WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TravelVisas_Expiry')
CREATE NONCLUSTERED INDEX IX_TravelVisas_Expiry
ON TravelVisas (ExpiryDate, Status)
INCLUDE (ExpatriateId, VisaNumber)
WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HealthInsurances_Expiry')
CREATE NONCLUSTERED INDEX IX_HealthInsurances_Expiry
ON HealthInsurances (EndDate, Status)
INCLUDE (ExpatriateId, PolicyNumber)
WHERE IsDeleted = 0;
GO

-- =====================================================
-- Use Warehouse Database
-- =====================================================
USE [Masarat_Warehouse];
GO

-- Item search optimization
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Items_Search')
CREATE NONCLUSTERED INDEX IX_Items_Search
ON Items (NameAr, NameEn, ItemCode)
INCLUDE (ItemGroupId, UnitId, IsActive)
WHERE IsDeleted = 0;
GO

-- Stock tracking
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WarehouseItems_Stock')
CREATE NONCLUSTERED INDEX IX_WarehouseItems_Stock
ON WarehouseItems (WarehouseId, ItemId)
INCLUDE (Quantity, MinimumQuantity, MaximumQuantity)
WHERE IsDeleted = 0;
GO

-- Exchange request status
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ExchangeRequests_Status')
CREATE NONCLUSTERED INDEX IX_ExchangeRequests_Status
ON ExchangeRequests (Status, RequestDate)
INCLUDE (RequestedById, ApprovedById)
WHERE IsDeleted = 0;
GO

-- Fixed Asset tracking
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FixedAssets_Location')
CREATE NONCLUSTERED INDEX IX_FixedAssets_Location
ON FixedAssets (LocationId, CategoryId)
INCLUDE (AssetCode, NameAr, Status)
WHERE IsDeleted = 0;
GO

-- =====================================================
-- Use Finance Database
-- =====================================================
USE [MasaratFinance];
GO

-- Journal Entry search
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_JournalEntries_Search')
CREATE NONCLUSTERED INDEX IX_JournalEntries_Search
ON GL_JOURNAL_ENTRIES (JournalDate, FiscalPeriodId)
INCLUDE (JournalNumber, TotalDebit, TotalCredit, Status)
WHERE IsDeleted = 0;
GO

-- Vendor search
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Vendors_Search')
CREATE NONCLUSTERED INDEX IX_Vendors_Search
ON AP_VENDORS (VendorNameAr, VendorCode, VATNumber)
INCLUDE (VendorCategoryId, IsActive)
WHERE IsDeleted = 0;
GO

-- Invoice search
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_APInvoices_Search')
CREATE NONCLUSTERED INDEX IX_APInvoices_Search
ON AP_INVOICES (InvoiceDate, VendorId, Status)
INCLUDE (InvoiceNumber, TotalAmount, PaidAmount)
WHERE IsDeleted = 0;
GO

-- Budget tracking
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_BudgetLines_Account')
CREATE NONCLUSTERED INDEX IX_BudgetLines_Account
ON BUD_BUDGET_LINES (BudgetHeaderId, AccountId, CostCenterId)
INCLUDE (OriginalAmount, RevisedAmount, ActualAmount)
WHERE IsDeleted = 0;
GO

-- =====================================================
-- Use SaaS Database
-- =====================================================
USE [Masarat_SaaS];
GO

-- Tenant search
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tenants_Search')
CREATE NONCLUSTERED INDEX IX_Tenants_Search
ON TenantEntities (NameAr, NameEn, TaxNumber)
INCLUDE (IsActive)
WHERE IsDeleted = 0;
GO

-- Subscription tracking
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Subscriptions_Expiry')
CREATE NONCLUSTERED INDEX IX_Subscriptions_Expiry
ON SystemSubscriptions (ExpiryDate, IsAutoRenew)
INCLUDE (TenantEntityId, SystemModuleId)
WHERE IsDeleted = 0;
GO

-- Invoice status tracking
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Invoices_Status')
CREATE NONCLUSTERED INDEX IX_Invoices_Status
ON Invoices (StatusId, ExpiryDate)
INCLUDE (BillNumber, TotalAmount, CustomerNationalId)
GO

-- Payment tracking
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Payments_Status')
CREATE NONCLUSTERED INDEX IX_Payments_Status
ON Payments (PaymentStatus, PaymentDateGregorian)
INCLUDE (InvoiceId, PaidAmount, ReceiptNumber)
GO

-- =====================================================
-- Use Identity Database
-- =====================================================
USE [Masarat_Identity];
GO

-- User search
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Search')
CREATE NONCLUSTERED INDEX IX_Users_Search
ON AspNetUsers (TenantId, NormalizedUserName)
INCLUDE (Email, PhoneNumber, IsActive)
GO

-- Permission lookup
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserPermissions_Lookup')
CREATE NONCLUSTERED INDEX IX_UserPermissions_Lookup
ON UserPermissions (UserId, PermissionId)
INCLUDE (IsGranted, GrantedAt)
GO

PRINT 'Performance indexes created successfully!'
GO
