-- ============================================================
-- Masarat Platform - Performance Optimization Indexes
-- Generated: 2026-02-08
-- Purpose: Composite, filtered, and covering indexes for all modules
-- Description: Advanced performance optimization indexes including
--   composite indexes, filtered indexes, and covering indexes
--   to optimize common query patterns across all Masarat modules
-- ============================================================

-- ============================================================
-- SECTION 1: MOVEMENT MODULE
-- Database: Masarat_Movement
-- ============================================================
USE [Masarat_Movement];
GO

-- 1. Vehicles: Status + TenantId composite for fleet status dashboards
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Vehicles_Status_TenantId')
    CREATE NONCLUSTERED INDEX IX_Vehicles_Status_TenantId
    ON Vehicles (Status, TenantId) INCLUDE (PlateNumber, Model, VehicleType)
    WITH (FILLFACTOR = 90);
GO

-- 2. Missions: Vehicle + Status + StartDate for mission scheduling queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Missions_Vehicle_Status_StartDate')
    CREATE NONCLUSTERED INDEX IX_Missions_Vehicle_Status_StartDate
    ON Missions (VehicleId, Status, StartDate DESC)
    INCLUDE (DriverId, Destination, EndDate)
    WITH (FILLFACTOR = 90);
GO

-- 3. Missions: Driver + Status for driver workload queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Missions_Driver_Status')
    CREATE NONCLUSTERED INDEX IX_Missions_Driver_Status
    ON Missions (DriverId, Status)
    INCLUDE (VehicleId, StartDate, EndDate, Destination)
    WITH (FILLFACTOR = 90);
GO

-- 4. Missions: Status + CreatedAt for recent missions listing
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Missions_Status_CreatedAt')
    CREATE NONCLUSTERED INDEX IX_Missions_Status_CreatedAt
    ON Missions (Status, CreatedAt DESC)
    INCLUDE (VehicleId, DriverId, Destination)
    WITH (FILLFACTOR = 90);
GO

-- 5. FuelRecords: Vehicle + FuelDate for fuel consumption reports
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FuelRecords_Vehicle_FuelDate')
    CREATE NONCLUSTERED INDEX IX_FuelRecords_Vehicle_FuelDate
    ON FuelRecords (VehicleId, FuelDate DESC)
    INCLUDE (Liters, TotalCost, CostPerLiter)
    WITH (FILLFACTOR = 90);
GO

-- 6. FuelRecords: Driver + FuelDate for driver fuel tracking
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FuelRecords_Driver_FuelDate')
    CREATE NONCLUSTERED INDEX IX_FuelRecords_Driver_FuelDate
    ON FuelRecords (DriverId, FuelDate DESC)
    INCLUDE (VehicleId, Liters, TotalCost)
    WITH (FILLFACTOR = 90);
GO

-- 7. Maintenances: Vehicle + NextMaintenanceDate for upcoming maintenance
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Maintenances_Vehicle_NextDate')
    CREATE NONCLUSTERED INDEX IX_Maintenances_Vehicle_NextDate
    ON Maintenances (VehicleId, NextMaintenanceDate)
    INCLUDE (MaintenanceType, Status, MaintenanceDate)
    WITH (FILLFACTOR = 90);
GO

-- 8. Maintenances: Status + ScheduledDate for maintenance scheduling
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Maintenances_Status_ScheduledDate')
    CREATE NONCLUSTERED INDEX IX_Maintenances_Status_ScheduledDate
    ON Maintenances (Status, ScheduledDate)
    INCLUDE (VehicleId, MaintenanceType, MaintenanceDate)
    WITH (FILLFACTOR = 90);
GO

-- ============================================================
-- SECTION 2: WAREHOUSE MODULE
-- Database: Masarat_Warehouse
-- ============================================================
USE [Masarat_Warehouse];
GO

-- 9. FixedAssets: CategoryId + AssetStatus for asset category reports
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FixedAssets_Category_Status')
    CREATE NONCLUSTERED INDEX IX_FixedAssets_Category_Status
    ON FixedAssets (CategoryId, AssetStatus)
    INCLUDE (AssetCode, AssetName, AcquisitionCost, AccumulatedDepreciation)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 10. FixedAssets: LocationId + AssetStatus for location-based asset tracking
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FixedAssets_Location_Status')
    CREATE NONCLUSTERED INDEX IX_FixedAssets_Location_Status
    ON FixedAssets (LocationId, AssetStatus)
    INCLUDE (AssetCode, AssetName, CategoryId, CustodianId)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 11. FixedAssets: TenantId + AssetStatus for tenant asset dashboards
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FixedAssets_Tenant_Status')
    CREATE NONCLUSTERED INDEX IX_FixedAssets_Tenant_Status
    ON FixedAssets (TenantId, AssetStatus)
    INCLUDE (AssetCode, AssetName, AcquisitionCost, CategoryId)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 12. Suppliers: Active suppliers filtered index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Suppliers_Active')
    CREATE NONCLUSTERED INDEX IX_Suppliers_Active
    ON Suppliers (TenantId, SupplierName)
    INCLUDE (SupplierCode, CommercialRegistration, TaxNumber)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 13. WarehouseItems: Composite for stock lookup with quantity
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_WarehouseItems_Lookup')
    CREATE NONCLUSTERED INDEX IX_WarehouseItems_Lookup
    ON WarehouseItems (WarehouseId, ItemId)
    INCLUDE (ItemName, Quantity, ReservedQuantity, UnitPrice)
    WITH (FILLFACTOR = 90);
GO

-- 14. WarehouseItems: ItemName for search queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_WarehouseItems_ItemName')
    CREATE NONCLUSTERED INDEX IX_WarehouseItems_ItemName
    ON WarehouseItems (ItemName)
    INCLUDE (WarehouseId, ItemId, Quantity, UnitPrice)
    WITH (FILLFACTOR = 90);
GO

-- 15. ReceiptNotes: Supplier + Status for receipt tracking
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ReceiptNotes_Supplier_Status')
    CREATE NONCLUSTERED INDEX IX_ReceiptNotes_Supplier_Status
    ON ReceiptNotes (SupplierId, Status)
    INCLUDE (ReceiptNumber, WarehouseId, TotalValue, TotalQuantity)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 16. SupplierContracts: Supplier + Status for contract management
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SupplierContracts_Supplier_Status')
    CREATE NONCLUSTERED INDEX IX_SupplierContracts_Supplier_Status
    ON SupplierContracts (SupplierId, Status)
    INCLUDE (ContractNumber, TotalValue, StartDate, EndDate)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 17. AssetDepreciationRecords: Asset for depreciation history
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AssetDepreciation_Asset_Period')
    CREATE NONCLUSTERED INDEX IX_AssetDepreciation_Asset_Period
    ON AssetDepreciationRecords (AssetId, Year DESC, Month DESC)
    INCLUDE (DepreciationAmount, OpeningNetBookValue, ClosingNetBookValue)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 18. KindCustodies: Employee + Status for custody tracking
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_KindCustodies_Employee_Status')
    CREATE NONCLUSTERED INDEX IX_KindCustodies_Employee_Status
    ON KindCustodies (EmployeeId, Status)
    INCLUDE (CustodyNumber, WarehouseId, EmployeeName)
    WITH (FILLFACTOR = 90);
GO

-- ============================================================
-- SECTION 3: GRC MODULE (Governance, Risk & Compliance)
-- Database: Masarat_GRC
-- ============================================================
USE [Masarat_GRC];
GO

-- 19. Risks: CategoryId + RiskLevel + Status for risk register views
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Risks_Category_Level_Status')
    CREATE NONCLUSTERED INDEX IX_Risks_Category_Level_Status
    ON GRC.Risks (CategoryId, InherentLikelihood, Status)
    INCLUDE (RiskNumber, TitleAr, TenantId)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 20. Controls: ControlType + Status for control inventory
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Controls_Type_Status')
    CREATE NONCLUSTERED INDEX IX_Controls_Type_Status
    ON GRC.Controls (ControlType, Status)
    INCLUDE (ControlNumber, TitleAr, TenantId)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 21. ComplianceRequirements: Status + DueDate for compliance tracking
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ComplianceRequirements_Status_DueDate')
    CREATE NONCLUSTERED INDEX IX_ComplianceRequirements_Status_DueDate
    ON GRC.ComplianceRequirements (ComplianceStatus, DueDate)
    INCLUDE (RequirementNumber, TitleAr, RegulatoryBodyId, TenantId)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 22. AuditFindings: Severity + Status for finding prioritization
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditFindings_Severity_Status')
    CREATE NONCLUSTERED INDEX IX_AuditFindings_Severity_Status
    ON GRC.AuditFindings (Severity, Status)
    INCLUDE (FindingNumber, TitleAr, EngagementId, DueDate)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 23. Incidents: Status + CreatedAt for incident timeline
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Incidents_Status_CreatedAt')
    CREATE NONCLUSTERED INDEX IX_Incidents_Status_CreatedAt
    ON GRC.Incidents (Status, CreatedAt DESC)
    INCLUDE (IncidentNumber, TitleAr, Type, Severity, TenantId)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 24. Incidents: SeverityLevel + Status for severity dashboards
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Incidents_Severity_Status')
    CREATE NONCLUSTERED INDEX IX_Incidents_Severity_Status
    ON GRC.Incidents (Severity, Status)
    INCLUDE (IncidentNumber, TitleAr, CreatedAt, FinancialImpact)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 25. RuleExecutionLogs: Module + Operation for rule analysis
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RuleExecLogs_Module_Operation')
    CREATE NONCLUSTERED INDEX IX_RuleExecLogs_Module_Operation
    ON GRC.RuleExecutionLogs (Module, Operation, ExecutedAt DESC)
    INCLUDE (RuleId, Result, UserId)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- ============================================================
-- SECTION 4: AGENTS MODULE
-- Database: Masarat_Agents
-- ============================================================
USE [Masarat_Agents];
GO

-- 26. AgentTasks: AgentId + Status + CreatedAt for agent workload
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AgentTasks_Agent_Status_Created')
    CREATE NONCLUSTERED INDEX IX_AgentTasks_Agent_Status_Created
    ON AgentTasks (AgentId, Status, CreatedAt DESC)
    INCLUDE (Title, Priority, DueDate)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 27. Agents: Status + Team for agent roster queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Agents_Status_Team')
    CREATE NONCLUSTERED INDEX IX_Agents_Status_Team
    ON Agents (IsActive, Team)
    INCLUDE (AgentCode, NameAr, NameEn, Role, Tier)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 28. AgentTasks: Priority + DueDate for task prioritization
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AgentTasks_Priority_DueDate')
    CREATE NONCLUSTERED INDEX IX_AgentTasks_Priority_DueDate
    ON AgentTasks (Priority, DueDate)
    INCLUDE (AgentId, Title, Status)
    WHERE IsDeleted = 0 AND Status != 'Completed'
    WITH (FILLFACTOR = 95);
GO

-- ============================================================
-- SECTION 5: EPM MODULE (Employee Performance Management)
-- Database: Masarat_EPM
-- ============================================================
USE [Masarat_EPM];
GO

-- 29. Goals: EmployeeId (via Charter) + Status for employee goal tracking
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Goals_Charter_Status')
    CREATE NONCLUSTERED INDEX IX_Goals_Charter_Status
    ON Goals (CharterId, Status)
    INCLUDE (Weight, CompletionPercentage, ActualScore, WeightedScore)
    WITH (FILLFACTOR = 90);
GO

-- 30. PerformanceCharters: EmployeeId + Status for performance review
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Charters_Employee_Status')
    CREATE NONCLUSTERED INDEX IX_Charters_Employee_Status
    ON PerformanceCharters (EmployeeId, Status)
    INCLUDE (FiscalYear, ManagerId, GoalsWeight, CompetenciesWeight)
    WITH (FILLFACTOR = 90);
GO

-- 31. PerformanceCharters: Department (ManagerId) + FiscalYear for department reviews
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Charters_Manager_Year')
    CREATE NONCLUSTERED INDEX IX_Charters_Manager_Year
    ON PerformanceCharters (ManagerId, FiscalYear)
    INCLUDE (EmployeeId, Status, GoalsWeight)
    WITH (FILLFACTOR = 90);
GO

-- 32. ExcellenceElements: Charter + ApprovalStatus for excellence review
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Excellence_Charter_Approval')
    CREATE NONCLUSTERED INDEX IX_Excellence_Charter_Approval
    ON ExcellenceElements (CharterId, ApprovalStatus)
    INCLUDE (ElementType, BonusPoints, IsActive)
    WITH (FILLFACTOR = 90);
GO

-- ============================================================
-- SECTION 6: SADAD MODULE (Payments)
-- Database: Masarat_Sadad
-- ============================================================
USE [Masarat_Sadad];
GO

-- 33. Payments: Status + PaidAt for payment reporting
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payments_Status_PaidAt')
    CREATE NONCLUSTERED INDEX IX_Payments_Status_PaidAt
    ON Payments (PaymentStatus, PaidAt DESC)
    INCLUDE (InvoiceId, PaidAmount, PaymentMethod, ReceiptNumber)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 34. Invoices: Customer + Status for customer invoice lookup
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Invoices_Customer_Status')
    CREATE NONCLUSTERED INDEX IX_Invoices_Customer_Status
    ON Invoices (CustomerNationalId, StatusId)
    INCLUDE (BillNumber, TotalAmount, CreatedAt, ExpiryDate)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 35. Invoices: DueDate + Status for overdue invoice tracking
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Invoices_ExpiryDate_Status')
    CREATE NONCLUSTERED INDEX IX_Invoices_ExpiryDate_Status
    ON Invoices (ExpiryDate, StatusId)
    INCLUDE (BillNumber, TotalAmount, CustomerNationalId, CustomerName)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 36. PaymentTransactions: Payment + Status for transaction tracking
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PaymentTransactions_Payment_Status')
    CREATE NONCLUSTERED INDEX IX_PaymentTransactions_Payment_Status
    ON PaymentTransactions (PaymentId, Status)
    INCLUDE (ProcessedAt, GatewayResponse)
    WITH (FILLFACTOR = 90);
GO

-- ============================================================
-- SECTION 7: ARCHIVING MODULE
-- Database: Masarat_Archiving
-- ============================================================
USE [Masarat_Archiving];
GO

-- 37. Documents: CabinetId + Status for cabinet document listing
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Documents_Cabinet_Status')
    CREATE NONCLUSTERED INDEX IX_Documents_Cabinet_Status
    ON Documents (CabinetId, Status)
    INCLUDE (Barcode, LifecycleStage, CreatedAt, CreatedBy)
    WITH (FILLFACTOR = 90);
GO

-- 38. Documents: CreatedAt DESC for recent documents
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Documents_CreatedAt_Desc')
    CREATE NONCLUSTERED INDEX IX_Documents_CreatedAt_Desc
    ON Documents (CreatedAt DESC)
    INCLUDE (CabinetId, Status, Barcode, LifecycleStage)
    WITH (FILLFACTOR = 90);
GO

-- 39. WorkflowTasks: AssignedTo + Status + DueDate for task inbox
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_WorkflowTasks_Assignee_Status_Due')
    CREATE NONCLUSTERED INDEX IX_WorkflowTasks_Assignee_Status_Due
    ON WorkflowTasks (AssignedTo, Status, DueDate)
    INCLUDE (WorkflowId, DocumentId, Priority, CreatedAt)
    WITH (FILLFACTOR = 90);
GO

-- 40. Transactions: Classification + Status for archive queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Transactions_Classification_Status')
    CREATE NONCLUSTERED INDEX IX_Transactions_Classification_Status
    ON Transactions (ClassificationId, Status)
    INCLUDE (Barcode, ReferenceNumber, TransactionDate, SecurityLevel)
    WITH (FILLFACTOR = 90);
GO

-- ============================================================
-- SECTION 8: CHAT MODULE
-- Database: Masarat_Chat
-- ============================================================
USE [Masarat_Chat];
GO

-- 41. Messages: ConversationId + CreatedAt DESC for message history
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Messages_Conversation_CreatedAt_Cover')
    CREATE NONCLUSTERED INDEX IX_Messages_Conversation_CreatedAt_Cover
    ON Messages (ConversationId, CreatedAt DESC)
    INCLUDE (SenderId, Content, Type, IsEdited, IsDeleted)
    WITH (FILLFACTOR = 90);
GO

-- 42. Messages: SenderId + CreatedAt DESC for user message history
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Messages_Sender_CreatedAt')
    CREATE NONCLUSTERED INDEX IX_Messages_Sender_CreatedAt
    ON Messages (SenderId, CreatedAt DESC)
    INCLUDE (ConversationId, Content, Type)
    WITH (FILLFACTOR = 90);
GO

-- 43. Conversations: Active conversations sorted by last activity
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Conversations_Active_Updated')
    CREATE NONCLUSTERED INDEX IX_Conversations_Active_Updated
    ON Conversations (IsArchived, UpdatedAt DESC)
    INCLUDE (Name, Type, CreatedBy)
    WITH (FILLFACTOR = 90);
GO

-- 44. Participants: EmployeeId for finding user conversations
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Participants_Employee_Active')
    CREATE NONCLUSTERED INDEX IX_Participants_Employee_Active
    ON Participants (EmployeeId, IsRemoved)
    INCLUDE (ConversationId, IsAdmin, JoinedAt)
    WITH (FILLFACTOR = 90);
GO

-- ============================================================
-- SECTION 9: FINANCE MODULE
-- Database: MasaratFinance
-- ============================================================
USE [MasaratFinance];
GO

-- 45. GeneralLedgerEntries: AccountCode + PostingDate for ledger queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GLEntries_Account_PostingDate')
    CREATE NONCLUSTERED INDEX IX_GLEntries_Account_PostingDate
    ON FIN_GENERAL_LEDGER_ENTRIES (AccountCode, PostingDate DESC)
    INCLUDE (JournalNumber, Debit, Credit, Description, Status)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 46. GeneralLedgerEntries: TenantId + Status for tenant-scoped queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GLEntries_Tenant_Status')
    CREATE NONCLUSTERED INDEX IX_GLEntries_Tenant_Status
    ON FIN_GENERAL_LEDGER_ENTRIES (TenantId, Status)
    INCLUDE (JournalNumber, AccountCode, Debit, Credit, PostingDate)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 47. BudgetItems: FiscalYear + DepartmentId for budget overview
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_BudgetItems_Year_Department')
    CREATE NONCLUSTERED INDEX IX_BudgetItems_Year_Department
    ON FIN_BUDGET_ITEMS (FiscalYear, DepartmentId)
    INCLUDE (CategoryCode, AllocatedAmount, SpentAmount, RemainingAmount, Status)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 48. AccountsPayableEntries: VendorId + Status + DueDate for AP aging
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_APEntries_Vendor_Status_DueDate')
    CREATE NONCLUSTERED INDEX IX_APEntries_Vendor_Status_DueDate
    ON FIN_ACCOUNTS_PAYABLE_ENTRIES (VendorId, Status, DueDate)
    INCLUDE (InvoiceNumber, Amount, PaidAmount, InvoiceDate)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 49. ProcurementRequests: Status + RequestDate for procurement pipeline
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProcurementRequests_Status_Date')
    CREATE NONCLUSTERED INDEX IX_ProcurementRequests_Status_Date
    ON FIN_PROCUREMENT_REQUESTS (Status, RequestDate DESC)
    INCLUDE (RequestNumber, TotalAmount, RequestedBy, DepartmentId, Priority)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- ============================================================
-- SECTION 10: PROJECTS MODULE
-- Database: Masarat_Projects
-- ============================================================
USE [Masarat_Projects];
GO

-- 50. ProjectTasks: ProjectId + Status + DueDate for project task boards
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProjectTasks_Project_Status_DueDate')
    CREATE NONCLUSTERED INDEX IX_ProjectTasks_Project_Status_DueDate
    ON ProjectTasks (ProjectId, Status, DueDate)
    INCLUDE (Code, Title, Priority, AssignedTo, EstimatedHours)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 51. ProjectTasks: AssigneeId + Status for personal task views
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProjectTasks_Assignee_Status')
    CREATE NONCLUSTERED INDEX IX_ProjectTasks_Assignee_Status
    ON ProjectTasks (AssignedTo, Status)
    INCLUDE (ProjectId, Code, Title, DueDate, Priority)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 52. Projects: TenantId + Status for project portfolio
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Projects_Tenant_Status')
    CREATE NONCLUSTERED INDEX IX_Projects_Tenant_Status
    ON Projects (TenantId, Status)
    INCLUDE (Code, NameAr, ManagerId, Budget, ActualCost, StartDate, EndDate)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 53. Projects: ManagerId + Status for manager project overview
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Projects_Manager_Status')
    CREATE NONCLUSTERED INDEX IX_Projects_Manager_Status
    ON Projects (ManagerId, Status)
    INCLUDE (Code, NameAr, Budget, StartDate, EndDate, CategoryId)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 54. TaskTimeLogs: TaskId + LogDate for time tracking reports
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TaskTimeLogs_Task_LogDate')
    CREATE NONCLUSTERED INDEX IX_TaskTimeLogs_Task_LogDate
    ON TaskTimeLogs (TaskId, LogDate DESC)
    INCLUDE (Hours, Description, EmployeeId)
    WITH (FILLFACTOR = 90);
GO

-- 55. ProjectActivities: ProjectId + CreatedAt for activity feed
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProjectActivities_Project_Created')
    CREATE NONCLUSTERED INDEX IX_ProjectActivities_Project_Created
    ON ProjectActivities (ProjectId, CreatedAt DESC)
    INCLUDE (ActivityType, Description, EmployeeId, TaskId)
    WITH (FILLFACTOR = 90);
GO

-- ============================================================
-- SECTION 11: SAAS MODULE
-- Database: Masarat_SaaS
-- ============================================================
USE [Masarat_SaaS];
GO

-- 56. TenantEntities: Status + IsActive for tenant management
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tenants_Status_Active')
    CREATE NONCLUSTERED INDEX IX_Tenants_Status_Active
    ON TenantEntities (IsActive)
    INCLUDE (NameAr, NameEn, TaxNumber)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 57. SystemSubscriptions: TenantId + Status + ExpiryDate for subscription management
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Subscriptions_Tenant_Status_Expiry')
    CREATE NONCLUSTERED INDEX IX_Subscriptions_Tenant_Status_Expiry
    ON SystemSubscriptions (TenantEntityId, IsActive, ExpiryDate)
    INCLUDE (SystemModuleId, IsAutoRenew)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 58. ContactRequests: Status + CreatedAt for request queue
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ContactRequests_Status_Created')
    CREATE NONCLUSTERED INDEX IX_ContactRequests_Status_Created
    ON ContactRequests (Status, CreatedAt DESC)
    INCLUDE (FullName, Email, Subject, RequestType)
    WITH (FILLFACTOR = 90);
GO

-- 59. FreeTrialRequests: Status + CreatedAt for trial pipeline
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FreeTrialRequests_Status_Created')
    CREATE NONCLUSTERED INDEX IX_FreeTrialRequests_Status_Created
    ON FreeTrialRequests (Status, CreatedAt DESC)
    INCLUDE (OrganizationNameAr, ContactName, Email, Phone)
    WITH (FILLFACTOR = 90);
GO

-- 60. NotificationLogs: SaaSAdminUserId + SentAt for notification history
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_NotificationLogs_User_SentAt')
    CREATE NONCLUSTERED INDEX IX_NotificationLogs_User_SentAt
    ON NotificationLogs (SaaSAdminUserId, SentAt DESC)
    INCLUDE (Type, Channel, Subject, IsSuccess)
    WITH (FILLFACTOR = 90);
GO

-- ============================================================
-- SECTION 12: HR MODULE (Additional composite indexes)
-- Database: Masarat_HR
-- ============================================================
USE [Masarat_HR];
GO

-- 61. Employees: DepartmentId + IsActive for department roster
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Employees_Department_Active')
    CREATE NONCLUSTERED INDEX IX_Employees_Department_Active
    ON Employees (DepartmentId, IsActive)
    INCLUDE (ArName, EnName, NationalId, JobId, Rank)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 62. Leaves: EmployeeId + Status + StartDate for leave calendar
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Leaves_Employee_Status_StartDate')
    CREATE NONCLUSTERED INDEX IX_Leaves_Employee_Status_StartDate
    ON Leaves (EmployeeId, Status, StartDate)
    INCLUDE (EndDate, LeaveType, TotalDays, Notes)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- 63. ExpatriateEmployees: NationalityId + Status for nationality reports
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Expatriates_Nationality_Status')
    CREATE NONCLUSTERED INDEX IX_Expatriates_Nationality_Status
    ON ExpatriateEmployees (NationalityId, IsActive)
    INCLUDE (EmployeeId, IqamaNumber, IqamaExpiryDate, PassportNumber)
    WHERE IsDeleted = 0
    WITH (FILLFACTOR = 90);
GO

-- ============================================================
-- SUMMARY
-- ============================================================
PRINT '============================================================';
PRINT 'Masarat Platform - Performance Optimization Indexes';
PRINT 'Total Indexes Created: 55';
PRINT '============================================================';
PRINT 'Section  1: Movement Module    - 8 indexes  (1-8)';
PRINT 'Section  2: Warehouse Module   - 10 indexes (9-18)';
PRINT 'Section  3: GRC Module         - 7 indexes  (19-25)';
PRINT 'Section  4: Agents Module      - 3 indexes  (26-28)';
PRINT 'Section  5: EPM Module         - 4 indexes  (29-32)';
PRINT 'Section  6: Sadad Module       - 4 indexes  (33-36)';
PRINT 'Section  7: Archiving Module   - 4 indexes  (37-40)';
PRINT 'Section  8: Chat Module        - 4 indexes  (41-44)';
PRINT 'Section  9: Finance Module     - 5 indexes  (45-49)';
PRINT 'Section 10: Projects Module    - 6 indexes  (50-55)';
PRINT 'Section 11: SaaS Module        - 5 indexes  (56-60)';
PRINT 'Section 12: HR Module          - 3 indexes  (61-63)';
PRINT '============================================================';
PRINT 'Performance optimization indexes created successfully!';
GO
