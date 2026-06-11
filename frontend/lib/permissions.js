/**
 * ============================================
 * نظام الصلاحيات الشامل - Masarat Platform
 * ============================================
 *
 * يحتوي هذا الملف على:
 * 1. جميع المسميات الوظيفية
 * 2. جميع شاشات النظام
 * 3. مصفوفة الصلاحيات الافتراضية
 */

// ============================================
// تعريف الصلاحيات الأساسية (للتوافق مع النظام القديم)
// ============================================
export const PERMISSIONS = {
    HR_READ: 'hr:read',
    HR_WRITE: 'hr:write',
    HR_ADMIN: 'hr:admin',
    HR_EXPORT: 'hr:export',
    EPM_READ: 'epm:read',
    EPM_WRITE: 'epm:write',
    EPM_ADMIN: 'epm:admin',
    WAREHOUSE_READ: 'warehouse:read',
    WAREHOUSE_WRITE: 'warehouse:write',
    WAREHOUSE_ADMIN: 'warehouse:admin',
    MOVEMENT_READ: 'movement:read',
    MOVEMENT_WRITE: 'movement:write',
    MOVEMENT_ADMIN: 'movement:admin',
    ARCHIVING_READ: 'archiving:read',
    ARCHIVING_WRITE: 'archiving:write',
    ARCHIVING_ADMIN: 'archiving:admin',
    // صلاحيات أمان المستندات
    ARCHIVING_DOCUMENT_VIEW: 'archiving:document:view',
    ARCHIVING_DOCUMENT_DOWNLOAD: 'archiving:document:download',
    ARCHIVING_DOCUMENT_PRINT: 'archiving:document:print',
    ARCHIVING_CONFIDENTIAL_REQUEST: 'archiving:confidential:request',
    ARCHIVING_CONFIDENTIAL_APPROVE: 'archiving:confidential:approve',
    ARCHIVING_DOWNLOAD_REQUEST: 'archiving:download:request',
    ARCHIVING_DOWNLOAD_APPROVE: 'archiving:download:approve',
    ARCHIVING_SECURITY_AUDIT: 'archiving:security:audit',
    FINANCE_READ: 'finance:read',
    FINANCE_WRITE: 'finance:write',
    FINANCE_ADMIN: 'finance:admin',
    SADAD_READ: 'sadad:read',
    SADAD_WRITE: 'sadad:write',
    SADAD_ADMIN: 'sadad:admin',
    ANALYTICS_READ: 'analytics:read',
    ANALYTICS_WRITE: 'analytics:write',
    ANALYTICS_ADMIN: 'analytics:admin',
    SAAS_READ: 'saas:read',
    SAAS_WRITE: 'saas:write',
    SAAS_ADMIN: 'saas:admin',
    AGENTS_READ: 'agents:read',
    AGENTS_WRITE: 'agents:write',
    AGENTS_ADMIN: 'agents:admin',
    REPORTS_READ: 'reports:read',
    REPORTS_ADMIN: 'reports:admin',
    SETTINGS_READ: 'settings:read',
    SETTINGS_ADMIN: 'settings:admin',
    ADMIN_SYSTEM: 'admin:system',
    // صلاحيات الداشبورد التنفيذية
    EXECUTIVE_DASHBOARD_ACCESS: 'executive_dashboard_access',
    EXECUTIVE_DASHBOARD_FULL: 'executive_dashboard_full',
    // صلاحيات إدارة الصلاحيات - حصرية لمدير تقنية المعلومات
    IT_PERMISSIONS_MANAGE: 'it_permissions:manage',
};

// ============================================
// 1. المسميات الوظيفية (Job Titles / Roles)
// ============================================

export const JOB_TITLES = {
    // الإدارة العليا
    SUPER_ADMIN: {
        id: 'super_admin',
        nameAr: 'مدير النظام',
        nameEn: 'System Administrator',
        category: 'admin',
        level: 1,
        description: 'صلاحيات كاملة على جميع الأنظمة'
    },
    DEPUTY_MAYOR_ASSISTANT: {
        id: 'deputy_mayor_assistant',
        nameAr: 'مساعد رئيس البلدية',
        nameEn: 'Deputy Mayor Assistant',
        category: 'executive',
        level: 2,
        description: 'الإشراف العام على جميع الإدارات'
    },
    DEPARTMENT_DIRECTOR: {
        id: 'department_director',
        nameAr: 'مدير الإدارة',
        nameEn: 'Department Director',
        category: 'management',
        level: 3,
        description: 'إدارة والإشراف على الإدارة'
    },
    SECTION_MANAGER: {
        id: 'section_manager',
        nameAr: 'مدير القسم',
        nameEn: 'Section Manager',
        category: 'management',
        level: 4,
        description: 'إدارة والإشراف على القسم'
    },
    UNIT_MANAGER: {
        id: 'unit_manager',
        nameAr: 'مدير الوحدة',
        nameEn: 'Unit Manager',
        category: 'management',
        level: 5,
        description: 'إدارة والإشراف على الوحدة'
    },

    // تقنية المعلومات
    IT_DIRECTOR: {
        id: 'it_director',
        nameAr: 'مدير تقنية المعلومات',
        nameEn: 'IT Director',
        category: 'it',
        level: 3,
        description: 'صلاحيات كاملة على جميع الموديولات والشاشات وإعدادات النظام - ما عدا SaaS والوكلاء والرقابة الذكية'
    },
    IT_EMPLOYEE: {
        id: 'it_employee',
        nameAr: 'موظف تقنية معلومات',
        nameEn: 'IT Employee',
        category: 'it',
        level: 6,
        description: 'الدعم الفني وإدارة الأنظمة'
    },

    // الموارد البشرية
    HR_DIRECTOR: {
        id: 'hr_director',
        nameAr: 'مدير الموارد البشرية',
        nameEn: 'HR Director',
        category: 'hr',
        level: 3,
        description: 'إدارة شؤون الموارد البشرية'
    },
    HR_EMPLOYEE: {
        id: 'hr_employee',
        nameAr: 'موظف موارد بشرية',
        nameEn: 'HR Employee',
        category: 'hr',
        level: 6,
        description: 'تنفيذ مهام الموارد البشرية'
    },
    DELEGATION_COORDINATOR: {
        id: 'delegation_coordinator',
        nameAr: 'موظف مسير انتداب وخارج دوام',
        nameEn: 'Delegation & Overtime Coordinator',
        category: 'hr',
        level: 6,
        description: 'إدارة الانتدابات والعمل الإضافي'
    },
    ATTENDANCE_LEAVE_OFFICER: {
        id: 'attendance_leave_officer',
        nameAr: 'موظف متابعة حضور وإجازات',
        nameEn: 'Attendance & Leave Officer',
        category: 'hr',
        level: 6,
        description: 'متابعة الحضور والإجازات معاً'
    },
    ATTENDANCE_OFFICER: {
        id: 'attendance_officer',
        nameAr: 'موظف متابعة حضور',
        nameEn: 'Attendance Officer',
        category: 'hr',
        level: 6,
        description: 'متابعة الحضور والانصراف'
    },
    LEAVE_OFFICER: {
        id: 'leave_officer',
        nameAr: 'موظف متابعة إجازات',
        nameEn: 'Leave Officer',
        category: 'hr',
        level: 6,
        description: 'متابعة ومعالجة الإجازات'
    },
    SICK_LEAVE_SPECIALIST: {
        id: 'sick_leave_specialist',
        nameAr: 'مختص إجازات مرضية',
        nameEn: 'Sick Leave Specialist',
        category: 'hr',
        level: 6,
        description: 'معالجة الإجازات المرضية'
    },
    ATTENDANCE_SUPERVISOR: {
        id: 'attendance_supervisor',
        nameAr: 'مراقب الدوام',
        nameEn: 'Attendance Supervisor',
        category: 'hr',
        level: 4,
        description: 'مراقبة ومتابعة حضور وانصراف الموظفين وإرسال التنبيهات والإنذارات'
    },
    DECISION_ISSUER: {
        id: 'decision_issuer',
        nameAr: 'موظف إصدار القرار',
        nameEn: 'Decision Issuer',
        category: 'hr',
        level: 6,
        description: 'إصدار القرارات الإدارية'
    },
    AUDITOR: {
        id: 'auditor',
        nameAr: 'موظف مدقق',
        nameEn: 'Auditor',
        category: 'audit',
        level: 6,
        description: 'التدقيق والمراجعة'
    },

    // المالية
    FINANCE_DIRECTOR: {
        id: 'finance_director',
        nameAr: 'مدير الشؤون المالية',
        nameEn: 'Finance Director',
        category: 'finance',
        level: 3,
        description: 'إدارة الشؤون المالية'
    },
    ACCOUNTANT: {
        id: 'accountant',
        nameAr: 'محاسب',
        nameEn: 'Accountant',
        category: 'finance',
        level: 6,
        description: 'المحاسبة والقيود المالية'
    },
    TREASURER: {
        id: 'treasurer',
        nameAr: 'أمين الخزينة',
        nameEn: 'Treasurer',
        category: 'finance',
        level: 6,
        description: 'إدارة الخزينة والمدفوعات'
    },

    // المستودعات
    WAREHOUSE_DIRECTOR: {
        id: 'warehouse_director',
        nameAr: 'مدير المستودعات',
        nameEn: 'Warehouse Director',
        category: 'warehouse',
        level: 3,
        description: 'إدارة المستودعات والمخزون'
    },
    WAREHOUSE_KEEPER: {
        id: 'warehouse_keeper',
        nameAr: 'أمين المستودع',
        nameEn: 'Warehouse Keeper',
        category: 'warehouse',
        level: 6,
        description: 'حفظ وصرف المواد'
    },
    RECEIVING_OFFICER: {
        id: 'receiving_officer',
        nameAr: 'مأمور ساحة الاستلام',
        nameEn: 'Receiving Officer',
        category: 'warehouse',
        level: 6,
        description: 'استلام المواد والتحقق منها'
    },
    INVENTORY_CONTROLLER: {
        id: 'inventory_controller',
        nameAr: 'مراقب المخزون',
        nameEn: 'Inventory Controller',
        category: 'warehouse',
        level: 6,
        description: 'مراقبة وجرد المخزون'
    },

    // موظف عام
    EMPLOYEE: {
        id: 'employee',
        nameAr: 'موظف',
        nameEn: 'Employee',
        category: 'general',
        level: 7,
        description: 'موظف عام'
    }
};

// تصنيفات المسميات الوظيفية
export const JOB_CATEGORIES = {
    admin: { nameAr: 'الإدارة العليا', nameEn: 'Administration', color: '#dc2626' },
    executive: { nameAr: 'الإدارة التنفيذية', nameEn: 'Executive', color: '#9333ea' },
    management: { nameAr: 'الإدارة الوسطى', nameEn: 'Management', color: '#2563eb' },
    it: { nameAr: 'تقنية المعلومات', nameEn: 'IT', color: '#0891b2' },
    hr: { nameAr: 'الموارد البشرية', nameEn: 'HR', color: '#059669' },
    finance: { nameAr: 'المالية', nameEn: 'Finance', color: '#d97706' },
    warehouse: { nameAr: 'المستودعات', nameEn: 'Warehouse', color: '#7c3aed' },
    audit: { nameAr: 'التدقيق', nameEn: 'Audit', color: '#be123c' },
    general: { nameAr: 'عام', nameEn: 'General', color: '#6b7280' }
};

// ============================================
// 2. شاشات وموديولات النظام
// ============================================

export const SYSTEM_MODULES = {
    DASHBOARD: {
        id: 'dashboard',
        nameAr: 'لوحة التحكم',
        nameEn: 'Dashboard',
        path: '/dashboard',
        icon: 'HomeIcon',
        system: 'core',
        screens: [
            { id: 'dashboard_view', nameAr: 'عرض لوحة التحكم', nameEn: 'View Dashboard', path: '/dashboard' },
        ]
    },

    HR: {
        id: 'hr',
        nameAr: 'الموارد البشرية',
        nameEn: 'Human Resources',
        path: '/hr',
        icon: 'UsersIcon',
        system: 'hr',
        screens: [
            { id: 'hr_dashboard', nameAr: 'لوحة تحكم الموارد البشرية', nameEn: 'HR Dashboard', path: '/hr' },
            { id: 'hr_employees', nameAr: 'إدارة الموظفين', nameEn: 'Employees Management', path: '/hr/employees' },
            { id: 'hr_employees_add', nameAr: 'إضافة موظف', nameEn: 'Add Employee', path: '/hr/employees/add' },
            { id: 'hr_employees_edit', nameAr: 'تعديل موظف', nameEn: 'Edit Employee', path: '/hr/employees/edit' },
            { id: 'hr_employees_delete', nameAr: 'حذف موظف', nameEn: 'Delete Employee', path: '/hr/employees/delete' },
            { id: 'hr_departments', nameAr: 'الإدارات والأقسام', nameEn: 'Departments', path: '/hr/departments' },
            { id: 'hr_organization', nameAr: 'الهيكل التنظيمي', nameEn: 'Organization Structure', path: '/hr/organization' },
            { id: 'hr_attendance', nameAr: 'الحضور والانصراف', nameEn: 'Attendance', path: '/hr/attendance' },
            { id: 'hr_attendance_daily', nameAr: 'الحضور اليومي', nameEn: 'Daily Attendance', path: '/hr/attendance/daily' },
            { id: 'hr_attendance_reports', nameAr: 'تقارير الحضور', nameEn: 'Attendance Reports', path: '/hr/attendance/reports' },
            { id: 'hr_attendance_devices', nameAr: 'أجهزة البصمة', nameEn: 'Biometric Devices', path: '/hr/attendance/devices' },
            { id: 'hr_attendance_exceptions', nameAr: 'الاستثناءات', nameEn: 'Exceptions', path: '/hr/attendance/exceptions' },
            { id: 'hr_attendance_supervisor', nameAr: 'مراقب الدوام', nameEn: 'Attendance Supervisor', path: '/hr/attendance/supervisor' },
            { id: 'hr_attendance_supervisor_dashboard', nameAr: 'لوحة تحكم مراقب الدوام', nameEn: 'Supervisor Dashboard', path: '/hr/attendance/supervisor/dashboard' },
            { id: 'hr_attendance_deductions', nameAr: 'الخصومات والجزاءات', nameEn: 'Deductions & Penalties', path: '/hr/attendance/deductions' },
            { id: 'hr_attendance_notifications', nameAr: 'إشعارات الحضور', nameEn: 'Attendance Notifications', path: '/hr/attendance/notifications' },
            { id: 'hr_attendance_actions', nameAr: 'الإجراءات التأديبية', nameEn: 'Disciplinary Actions', path: '/hr/attendance/actions' },
            { id: 'hr_leaves', nameAr: 'الإجازات', nameEn: 'Leaves', path: '/hr/leaves' },
            { id: 'hr_leaves_requests', nameAr: 'طلبات الإجازات', nameEn: 'Leave Requests', path: '/hr/leaves/requests' },
            { id: 'hr_leaves_approvals', nameAr: 'اعتماد الإجازات', nameEn: 'Leave Approvals', path: '/hr/leaves/approvals' },
            { id: 'hr_leaves_balances', nameAr: 'أرصدة الإجازات', nameEn: 'Leave Balances', path: '/hr/leaves/balances' },
            { id: 'hr_leaves_sick', nameAr: 'الإجازات المرضية', nameEn: 'Sick Leaves', path: '/hr/leaves/sick' },
            { id: 'hr_leaves_carryforward', nameAr: 'ترحيل الإجازات', nameEn: 'Leave Carryforward', path: '/hr/leaves/carryforward' },
            { id: 'hr_delegations', nameAr: 'الانتدابات', nameEn: 'Delegations', path: '/hr/delegations' },
            { id: 'hr_overtime', nameAr: 'العمل الإضافي', nameEn: 'Overtime', path: '/hr/overtime' },
            { id: 'hr_decisions', nameAr: 'القرارات الإدارية', nameEn: 'Administrative Decisions', path: '/hr/decisions' },
            { id: 'hr_payroll', nameAr: 'الرواتب', nameEn: 'Payroll', path: '/hr/payroll' },
            { id: 'hr_salaries', nameAr: 'سلم الرواتب', nameEn: 'Salary Scale', path: '/hr/salaries' },
            { id: 'hr_promotions', nameAr: 'الترقيات', nameEn: 'Promotions', path: '/hr/promotions' },
            { id: 'hr_transfers', nameAr: 'النقل والتكليف', nameEn: 'Transfers', path: '/hr/transfers' },
            { id: 'hr_contracts', nameAr: 'العقود', nameEn: 'Contracts', path: '/hr/contracts' },
            { id: 'hr_documents', nameAr: 'المستندات', nameEn: 'Documents', path: '/hr/documents' },
            { id: 'hr_clearance', nameAr: 'إخلاء الطرف', nameEn: 'Clearance', path: '/hr/clearance' },
            { id: 'hr_reports', nameAr: 'تقارير الموارد البشرية', nameEn: 'HR Reports', path: '/hr/reports' },
            { id: 'hr_settings', nameAr: 'إعدادات الموارد البشرية', nameEn: 'HR Settings', path: '/hr/settings' },
        ]
    },

    WAREHOUSE: {
        id: 'warehouse',
        nameAr: 'المستودعات',
        nameEn: 'Warehouse',
        path: '/warehouse',
        icon: 'CubeIcon',
        system: 'warehouse',
        screens: [
            { id: 'warehouse_dashboard', nameAr: 'لوحة تحكم المستودعات', nameEn: 'Warehouse Dashboard', path: '/warehouse' },
            { id: 'warehouse_inventory', nameAr: 'المخزون', nameEn: 'Inventory', path: '/warehouse/inventory' },
            { id: 'warehouse_items', nameAr: 'الأصناف', nameEn: 'Items', path: '/warehouse/items' },
            { id: 'warehouse_items_add', nameAr: 'إضافة صنف', nameEn: 'Add Item', path: '/warehouse/items/add' },
            { id: 'warehouse_items_edit', nameAr: 'تعديل صنف', nameEn: 'Edit Item', path: '/warehouse/items/edit' },
            { id: 'warehouse_movements', nameAr: 'حركة المخزون', nameEn: 'Stock Movements', path: '/warehouse/movements' },
            // === شاشات الاستلام ===
            { id: 'warehouse_receiving', nameAr: 'الاستلام', nameEn: 'Receiving', path: '/warehouse/receiving' },
            { id: 'warehouse_temp_receive', nameAr: 'الاستلام المؤقت للفحص', nameEn: 'Temp Receive for Inspection', path: '/warehouse/temp-receive' },
            { id: 'warehouse_temp_receive_create', nameAr: 'إنشاء استلام مؤقت', nameEn: 'Create Temp Receive', path: '/warehouse/temp-receive/create' },
            { id: 'warehouse_temp_receive_transfer', nameAr: 'ترحيل استلام مؤقت', nameEn: 'Transfer Temp Receive', path: '/warehouse/temp-receive/transfer' },
            { id: 'warehouse_temp_receive_approve', nameAr: 'اعتماد استلام مؤقت', nameEn: 'Approve Temp Receive', path: '/warehouse/temp-receive/approve' },
            { id: 'warehouse_receipt_notes', nameAr: 'مذكرات الاستلام', nameEn: 'Receipt Notes', path: '/warehouse/receipt-notes' },
            { id: 'warehouse_receipt_notes_create', nameAr: 'إنشاء مذكرة استلام', nameEn: 'Create Receipt Note', path: '/warehouse/receipt-notes/create' },
            { id: 'warehouse_receipt_notes_approve', nameAr: 'اعتماد مذكرة استلام', nameEn: 'Approve Receipt Note', path: '/warehouse/receipt-notes/approve' },
            // === شاشات الصرف ===
            { id: 'warehouse_issuing', nameAr: 'الصرف', nameEn: 'Issuing', path: '/warehouse/issuing' },
            { id: 'warehouse_exchange_requests', nameAr: 'طلبات الصرف', nameEn: 'Exchange Requests', path: '/warehouse/exchange-requests' },
            { id: 'warehouse_exchange_requests_create', nameAr: 'إنشاء طلب صرف', nameEn: 'Create Exchange Request', path: '/warehouse/exchange-requests/create' },
            { id: 'warehouse_exchange_approve_level1', nameAr: 'اعتماد الصرف - رئيس القسم', nameEn: 'Exchange Approve Level 1', path: '/warehouse/exchange-requests/approve/level1' },
            { id: 'warehouse_exchange_approve_level2', nameAr: 'اعتماد الصرف - مدير المستودع', nameEn: 'Exchange Approve Level 2', path: '/warehouse/exchange-requests/approve/level2' },
            { id: 'warehouse_exchange_approve_level3', nameAr: 'اعتماد الصرف - الخدمات العامة', nameEn: 'Exchange Approve Level 3', path: '/warehouse/exchange-requests/approve/level3' },
            { id: 'warehouse_exchange_approve_level4', nameAr: 'اعتماد الصرف - مراقب المخزون', nameEn: 'Exchange Approve Level 4', path: '/warehouse/exchange-requests/approve/level4' },
            { id: 'warehouse_exchange_approve_level5', nameAr: 'اعتماد الصرف - أمين المستودع', nameEn: 'Exchange Approve Level 5', path: '/warehouse/exchange-requests/approve/level5' },
            // === التحويلات ===
            { id: 'warehouse_transfers', nameAr: 'التحويلات', nameEn: 'Transfers', path: '/warehouse/transfers' },
            { id: 'warehouse_transfers_between', nameAr: 'التحويل بين المستودعات', nameEn: 'Inter-warehouse Transfers', path: '/warehouse/transfers/between' },
            // === الجرد ومحاضر الجرد ===
            { id: 'warehouse_stocktaking', nameAr: 'الجرد', nameEn: 'Stocktaking', path: '/warehouse/stocktaking' },
            { id: 'warehouse_inventory_forms', nameAr: 'محاضر الجرد', nameEn: 'Inventory Forms', path: '/warehouse/inventory-forms' },
            { id: 'warehouse_inventory_forms_create', nameAr: 'إنشاء محضر جرد', nameEn: 'Create Inventory Form', path: '/warehouse/inventory-forms/create' },
            { id: 'warehouse_inventory_forms_sign', nameAr: 'توقيع محضر جرد', nameEn: 'Sign Inventory Form', path: '/warehouse/inventory-forms/sign' },
            { id: 'warehouse_inventory_forms_approve', nameAr: 'اعتماد محضر جرد', nameEn: 'Approve Inventory Form', path: '/warehouse/inventory-forms/approve' },
            // === التسويات والسنة المالية ===
            { id: 'warehouse_adjustments', nameAr: 'تسويات المخزون', nameEn: 'Stock Adjustments', path: '/warehouse/adjustments' },
            { id: 'warehouse_adjustments_create', nameAr: 'إنشاء تسوية', nameEn: 'Create Adjustment', path: '/warehouse/adjustments/create' },
            { id: 'warehouse_adjustments_approve', nameAr: 'اعتماد تسوية', nameEn: 'Approve Adjustment', path: '/warehouse/adjustments/approve' },
            { id: 'warehouse_fiscal_year', nameAr: 'السنة المالية', nameEn: 'Fiscal Year', path: '/warehouse/fiscal-year' },
            { id: 'warehouse_fiscal_year_open', nameAr: 'فتح سنة مالية', nameEn: 'Open Fiscal Year', path: '/warehouse/fiscal-year/open' },
            { id: 'warehouse_fiscal_year_close', nameAr: 'إقفال سنة مالية', nameEn: 'Close Fiscal Year', path: '/warehouse/fiscal-year/close' },
            { id: 'warehouse_stock_posting', nameAr: 'ترحيل المخزون', nameEn: 'Stock Posting', path: '/warehouse/stock-posting' },
            { id: 'warehouse_stock_posting_approve', nameAr: 'اعتماد ترحيل المخزون', nameEn: 'Approve Stock Posting', path: '/warehouse/stock-posting/approve' },
            // === العهد والإهلاك ===
            { id: 'warehouse_custody', nameAr: 'العهد', nameEn: 'Custody', path: '/warehouse/custody' },
            { id: 'warehouse_custody_assign', nameAr: 'تسليم عهدة', nameEn: 'Assign Custody', path: '/warehouse/custody/assign' },
            { id: 'warehouse_custody_return', nameAr: 'استلام عهدة', nameEn: 'Return Custody', path: '/warehouse/custody/return' },
            { id: 'warehouse_depreciation', nameAr: 'الإهلاك', nameEn: 'Depreciation', path: '/warehouse/depreciation' },
            // === التقارير والإعدادات ===
            { id: 'warehouse_reports', nameAr: 'تقارير المستودعات', nameEn: 'Warehouse Reports', path: '/warehouse/reports' },
            { id: 'warehouse_reports_financial', nameAr: 'التقارير المالية للمستودعات', nameEn: 'Warehouse Financial Reports', path: '/warehouse/reports/financial' },
            { id: 'warehouse_settings', nameAr: 'إعدادات المستودعات', nameEn: 'Warehouse Settings', path: '/warehouse/settings' },
        ]
    },

    FINANCE: {
        id: 'finance',
        nameAr: 'الإدارة المالية',
        nameEn: 'Finance',
        path: '/finance',
        icon: 'CurrencyDollarIcon',
        system: 'finance',
        screens: [
            { id: 'finance_dashboard', nameAr: 'لوحة تحكم المالية', nameEn: 'Finance Dashboard', path: '/finance' },
            { id: 'finance_gl', nameAr: 'الأستاذ العام', nameEn: 'General Ledger', path: '/finance/gl' },
            { id: 'finance_gl_accounts', nameAr: 'شجرة الحسابات', nameEn: 'Chart of Accounts', path: '/finance/gl/accounts' },
            { id: 'finance_gl_journals', nameAr: 'القيود اليومية', nameEn: 'Journal Entries', path: '/finance/gl/journals' },
            { id: 'finance_gl_periods', nameAr: 'الفترات المحاسبية', nameEn: 'Fiscal Periods', path: '/finance/gl/periods' },
            { id: 'finance_budget', nameAr: 'الموازنة', nameEn: 'Budget', path: '/finance/budget' },
            { id: 'finance_budget_create', nameAr: 'إعداد الموازنة', nameEn: 'Budget Creation', path: '/finance/budget/create' },
            { id: 'finance_budget_encumbrances', nameAr: 'الارتباطات', nameEn: 'Encumbrances', path: '/finance/budget/encumbrances' },
            { id: 'finance_budget_transfers', nameAr: 'المناقلات', nameEn: 'Budget Transfers', path: '/finance/budget/transfers' },
            { id: 'finance_ap', nameAr: 'الذمم الدائنة', nameEn: 'Accounts Payable', path: '/finance/ap' },
            { id: 'finance_ap_vendors', nameAr: 'الموردون', nameEn: 'Vendors', path: '/finance/ap/vendors' },
            { id: 'finance_ap_invoices', nameAr: 'الفواتير', nameEn: 'Invoices', path: '/finance/ap/invoices' },
            { id: 'finance_ap_payments', nameAr: 'الدفعات', nameEn: 'Payments', path: '/finance/ap/payments' },
            { id: 'finance_procurement', nameAr: 'المشتريات', nameEn: 'Procurement', path: '/finance/procurement' },
            { id: 'finance_procurement_requests', nameAr: 'طلبات الشراء', nameEn: 'Purchase Requests', path: '/finance/procurement/requests' },
            { id: 'finance_procurement_orders', nameAr: 'أوامر الشراء', nameEn: 'Purchase Orders', path: '/finance/procurement/orders' },
            { id: 'finance_procurement_contracts', nameAr: 'العقود', nameEn: 'Contracts', path: '/finance/procurement/contracts' },
            { id: 'finance_treasury', nameAr: 'الخزينة', nameEn: 'Treasury', path: '/finance/treasury' },
            { id: 'finance_treasury_accounts', nameAr: 'الحسابات البنكية', nameEn: 'Bank Accounts', path: '/finance/treasury/accounts' },
            { id: 'finance_treasury_reconciliation', nameAr: 'التسويات البنكية', nameEn: 'Reconciliation', path: '/finance/treasury/reconciliation' },
            { id: 'finance_assets', nameAr: 'الأصول الثابتة', nameEn: 'Fixed Assets', path: '/finance/assets' },
            { id: 'finance_assets_depreciation', nameAr: 'الإهلاك', nameEn: 'Depreciation', path: '/finance/assets/depreciation' },
            { id: 'finance_reports', nameAr: 'التقارير المالية', nameEn: 'Financial Reports', path: '/finance/reports' },
            { id: 'finance_settings', nameAr: 'إعدادات المالية', nameEn: 'Finance Settings', path: '/finance/settings' },
        ]
    },

    MOVEMENT: {
        id: 'movement',
        nameAr: 'حركة الأسطول',
        nameEn: 'Fleet Movement',
        path: '/movement',
        icon: 'TruckIcon',
        system: 'movement',
        screens: [
            { id: 'movement_dashboard', nameAr: 'لوحة تحكم الحركة', nameEn: 'Movement Dashboard', path: '/movement' },
            { id: 'movement_vehicles', nameAr: 'المركبات', nameEn: 'Vehicles', path: '/movement/vehicles' },
            { id: 'movement_drivers', nameAr: 'السائقون', nameEn: 'Drivers', path: '/movement/drivers' },
            { id: 'movement_trips', nameAr: 'الرحلات', nameEn: 'Trips', path: '/movement/trips' },
            { id: 'movement_fuel', nameAr: 'الوقود', nameEn: 'Fuel', path: '/movement/fuel' },
            { id: 'movement_maintenance', nameAr: 'الصيانة', nameEn: 'Maintenance', path: '/movement/maintenance' },
            { id: 'movement_reports', nameAr: 'تقارير الحركة', nameEn: 'Movement Reports', path: '/movement/reports' },
        ]
    },

    ARCHIVING: {
        id: 'archiving',
        nameAr: 'الأرشفة',
        nameEn: 'Archiving',
        path: '/archiving',
        icon: 'FolderIcon',
        system: 'archiving',
        screens: [
            { id: 'archiving_dashboard', nameAr: 'لوحة تحكم الأرشفة', nameEn: 'Archiving Dashboard', path: '/archiving' },
            { id: 'archiving_documents', nameAr: 'المستندات', nameEn: 'Documents', path: '/archiving/documents' },
            { id: 'archiving_classifications', nameAr: 'التصنيفات', nameEn: 'Classifications', path: '/archiving/classifications' },
            { id: 'archiving_search', nameAr: 'البحث', nameEn: 'Search', path: '/archiving/search' },
            { id: 'archiving_reports', nameAr: 'تقارير الأرشفة', nameEn: 'Archiving Reports', path: '/archiving/reports' },
        ]
    },

    EPM: {
        id: 'epm',
        nameAr: 'قياس الأداء',
        nameEn: 'Performance Management',
        path: '/epm',
        icon: 'ChartBarIcon',
        system: 'epm',
        screens: [
            { id: 'epm_dashboard', nameAr: 'لوحة تحكم الأداء', nameEn: 'EPM Dashboard', path: '/epm' },
            { id: 'epm_evaluations', nameAr: 'التقييمات', nameEn: 'Evaluations', path: '/epm/evaluations' },
            { id: 'epm_goals', nameAr: 'الأهداف', nameEn: 'Goals', path: '/epm/goals' },
            { id: 'epm_kpis', nameAr: 'مؤشرات الأداء', nameEn: 'KPIs', path: '/epm/kpis' },
            { id: 'epm_reports', nameAr: 'تقارير الأداء', nameEn: 'Performance Reports', path: '/epm/reports' },
        ]
    },

    ANALYTICS: {
        id: 'analytics',
        nameAr: 'التحليلات',
        nameEn: 'Analytics',
        path: '/analytics',
        icon: 'PresentationChartLineIcon',
        system: 'analytics',
        screens: [
            { id: 'analytics_dashboard', nameAr: 'لوحة التحليلات', nameEn: 'Analytics Dashboard', path: '/analytics' },
            { id: 'analytics_reports', nameAr: 'التقارير', nameEn: 'Reports', path: '/analytics/reports' },
            { id: 'analytics_audit', nameAr: 'سجل التدقيق', nameEn: 'Audit Log', path: '/analytics/audit' },
            { id: 'analytics_compliance', nameAr: 'الامتثال', nameEn: 'Compliance', path: '/analytics/compliance' },
        ]
    },

    ADMIN: {
        id: 'admin',
        nameAr: 'الإدارة',
        nameEn: 'Administration',
        path: '/admin',
        icon: 'CogIcon',
        system: 'admin',
        screens: [
            { id: 'admin_users', nameAr: 'المستخدمون', nameEn: 'Users', path: '/admin/users' },
            { id: 'admin_roles', nameAr: 'الأدوار', nameEn: 'Roles', path: '/admin/roles' },
            { id: 'admin_permissions', nameAr: 'الصلاحيات', nameEn: 'Permissions', path: '/admin/permissions' },
            { id: 'admin_organization', nameAr: 'الهيكل التنظيمي', nameEn: 'Organization', path: '/admin/organization' },
            { id: 'admin_positions', nameAr: 'المسميات الوظيفية', nameEn: 'Positions', path: '/admin/positions' },
            { id: 'admin_approval_workflow', nameAr: 'سير العمل', nameEn: 'Workflow', path: '/admin/approval-workflow' },
            { id: 'admin_approval_matrix', nameAr: 'مصفوفة الصلاحيات', nameEn: 'Approval Matrix', path: '/admin/approval-matrix' },
            { id: 'admin_settings', nameAr: 'الإعدادات العامة', nameEn: 'General Settings', path: '/settings' },
        ]
    },

    SADAD: {
        id: 'sadad',
        nameAr: 'سداد',
        nameEn: 'Sadad',
        path: '/sadad',
        icon: 'CreditCardIcon',
        system: 'sadad',
        screens: [
            { id: 'sadad_dashboard', nameAr: 'لوحة تحكم سداد', nameEn: 'Sadad Dashboard', path: '/sadad' },
            { id: 'sadad_invoices', nameAr: 'الفواتير', nameEn: 'Invoices', path: '/sadad/invoices' },
            { id: 'sadad_payments', nameAr: 'المدفوعات', nameEn: 'Payments', path: '/sadad/payments' },
            { id: 'sadad_refunds', nameAr: 'المستردات', nameEn: 'Refunds', path: '/sadad/refunds' },
        ]
    },

    SAAS: {
        id: 'saas',
        nameAr: 'إدارة المنصة',
        nameEn: 'Platform Management',
        path: '/admin/tenants',
        icon: 'CloudIcon',
        system: 'saas',
        screens: [
            { id: 'saas_tenants', nameAr: 'مستأجرو المنصة', nameEn: 'Tenants', path: '/admin/tenants' },
            { id: 'saas_subscriptions', nameAr: 'اشتراكات المنصة', nameEn: 'Subscriptions', path: '/admin/platform/subscriptions' },
            { id: 'saas_billing', nameAr: 'فوترة المنصة', nameEn: 'Billing', path: '/admin/platform/billing' },
            { id: 'saas_free_trials', nameAr: 'طلبات التجربة', nameEn: 'Free Trials', path: '/admin/platform/free-trials' },
            { id: 'saas_admin_users', nameAr: 'مستخدمو إدارة المنصة', nameEn: 'Platform Admin Users', path: '/admin/platform/admin-users' },
            { id: 'saas_notifications', nameAr: 'إشعارات المنصة', nameEn: 'Notifications', path: '/admin/platform/notifications' },
            { id: 'saas_contact_requests', nameAr: 'طلبات التواصل', nameEn: 'Contact Requests', path: '/admin/platform/contact-requests' },
            { id: 'saas_landing_admin', nameAr: 'الصفحة التعريفية', nameEn: 'Landing Admin', path: '/admin/platform/landing-admin' },
            { id: 'saas_analytics', nameAr: 'تحليلات المنصة', nameEn: 'Platform Analytics', path: '/admin/platform/analytics' },
        ]
    },

    GRC: {
        id: 'grc',
        nameAr: 'الحوكمة والمخاطر',
        nameEn: 'Governance, Risk & Compliance',
        path: '/grc',
        icon: 'ShieldCheckIcon',
        system: 'grc',
        screens: [
            { id: 'grc_dashboard', nameAr: 'لوحة تحكم الحوكمة', nameEn: 'GRC Dashboard', path: '/grc' },
            { id: 'grc_risks', nameAr: 'سجل المخاطر', nameEn: 'Risk Register', path: '/grc/risks' },
            { id: 'grc_risk_assessment', nameAr: 'تقييم المخاطر', nameEn: 'Risk Assessment', path: '/grc/risks/assessment' },
            { id: 'grc_risk_treatment', nameAr: 'معالجة المخاطر', nameEn: 'Risk Treatment', path: '/grc/risks/treatment' },
            { id: 'grc_incidents', nameAr: 'الحوادث', nameEn: 'Incidents', path: '/grc/incidents' },
            { id: 'grc_incident_report', nameAr: 'الإبلاغ عن حادثة', nameEn: 'Report Incident', path: '/grc/incidents/report' },
            { id: 'grc_compliance', nameAr: 'الامتثال', nameEn: 'Compliance', path: '/grc/compliance' },
            { id: 'grc_policies', nameAr: 'السياسات والإجراءات', nameEn: 'Policies', path: '/grc/policies' },
            { id: 'grc_audits', nameAr: 'التدقيق الداخلي', nameEn: 'Internal Audit', path: '/grc/audits' },
            { id: 'grc_reports', nameAr: 'تقارير الحوكمة', nameEn: 'GRC Reports', path: '/grc/reports' },
        ]
    },

    ITSM: {
        id: 'itsm',
        nameAr: 'الدعم الفني',
        nameEn: 'IT Service Management',
        path: '/itsm',
        icon: 'WrenchScrewdriverIcon',
        system: 'itsm',
        screens: [
            { id: 'itsm_dashboard', nameAr: 'لوحة تحكم الدعم الفني', nameEn: 'ITSM Dashboard', path: '/itsm' },
            { id: 'itsm_tickets', nameAr: 'التذاكر', nameEn: 'Tickets', path: '/itsm/tickets' },
            { id: 'itsm_tickets_create', nameAr: 'إنشاء تذكرة', nameEn: 'Create Ticket', path: '/itsm/tickets/create' },
            { id: 'itsm_tickets_assign', nameAr: 'تعيين التذاكر', nameEn: 'Assign Tickets', path: '/itsm/tickets/assign' },
            { id: 'itsm_tickets_escalate', nameAr: 'تصعيد التذاكر', nameEn: 'Escalate Tickets', path: '/itsm/tickets/escalate' },
            { id: 'itsm_assets', nameAr: 'الأصول التقنية', nameEn: 'IT Assets', path: '/itsm/assets' },
            { id: 'itsm_assets_manage', nameAr: 'إدارة الأصول', nameEn: 'Manage Assets', path: '/itsm/assets/manage' },
            { id: 'itsm_specialists', nameAr: 'المتخصصين', nameEn: 'Specialists', path: '/itsm/specialists' },
            { id: 'itsm_categories', nameAr: 'التصنيفات', nameEn: 'Categories', path: '/itsm/categories' },
            { id: 'itsm_sla', nameAr: 'اتفاقيات مستوى الخدمة', nameEn: 'SLA', path: '/itsm/sla' },
            { id: 'itsm_reports', nameAr: 'تقارير الدعم الفني', nameEn: 'ITSM Reports', path: '/itsm/reports' },
        ]
    },

    PROJECTS: {
        id: 'projects',
        nameAr: 'إدارة المشاريع',
        nameEn: 'Project Management',
        path: '/projects',
        icon: 'ClipboardDocumentListIcon',
        system: 'projects',
        screens: [
            { id: 'projects_dashboard', nameAr: 'لوحة تحكم المشاريع', nameEn: 'Projects Dashboard', path: '/projects' },
            { id: 'projects_list', nameAr: 'قائمة المشاريع', nameEn: 'Projects List', path: '/projects/list' },
            { id: 'projects_create', nameAr: 'إنشاء مشروع', nameEn: 'Create Project', path: '/projects/create' },
            { id: 'projects_edit', nameAr: 'تعديل مشروع', nameEn: 'Edit Project', path: '/projects/edit' },
            { id: 'projects_tasks', nameAr: 'المهام', nameEn: 'Tasks', path: '/projects/tasks' },
            { id: 'projects_tasks_create', nameAr: 'إنشاء مهمة', nameEn: 'Create Task', path: '/projects/tasks/create' },
            { id: 'projects_tasks_assign', nameAr: 'تعيين المهام', nameEn: 'Assign Tasks', path: '/projects/tasks/assign' },
            { id: 'projects_members', nameAr: 'أعضاء المشروع', nameEn: 'Project Members', path: '/projects/members' },
            { id: 'projects_milestones', nameAr: 'المراحل', nameEn: 'Milestones', path: '/projects/milestones' },
            { id: 'projects_reports', nameAr: 'تقارير المشاريع', nameEn: 'Project Reports', path: '/projects/reports' },
        ]
    }
};

// ============================================
// 3. أنواع الصلاحيات لكل شاشة
// ============================================

export const PERMISSION_TYPES = {
    VIEW: { id: 'view', nameAr: 'عرض', nameEn: 'View', icon: 'EyeIcon', color: '#3b82f6' },
    CREATE: { id: 'create', nameAr: 'إضافة', nameEn: 'Create', icon: 'PlusIcon', color: '#10b981' },
    EDIT: { id: 'edit', nameAr: 'تعديل', nameEn: 'Edit', icon: 'PencilIcon', color: '#f59e0b' },
    DELETE: { id: 'delete', nameAr: 'حذف', nameEn: 'Delete', icon: 'TrashIcon', color: '#ef4444' },
    APPROVE: { id: 'approve', nameAr: 'اعتماد', nameEn: 'Approve', icon: 'CheckIcon', color: '#8b5cf6' },
    EXPORT: { id: 'export', nameAr: 'تصدير', nameEn: 'Export', icon: 'DownloadIcon', color: '#06b6d4' },
    PRINT: { id: 'print', nameAr: 'طباعة', nameEn: 'Print', icon: 'PrinterIcon', color: '#6b7280' },
    IMPORT: { id: 'import', nameAr: 'استيراد', nameEn: 'Import', icon: 'UploadIcon', color: '#0ea5e9' },
    DOWNLOAD: { id: 'download', nameAr: 'تحميل', nameEn: 'Download', icon: 'DocumentDownloadIcon', color: '#14b8a6' },
    SIGN: { id: 'sign', nameAr: 'توقيع', nameEn: 'Sign', icon: 'PencilAltIcon', color: '#a855f7' },
    WORKFLOW: { id: 'workflow', nameAr: 'سير العمل', nameEn: 'Workflow', icon: 'SwitchHorizontalIcon', color: '#f97316' },
};

// ============================================
// 4. الصلاحيات الافتراضية لكل مسمى وظيفي
// ============================================

export const DEFAULT_PERMISSIONS = {
    // ============================================
    // مدير النظام - صلاحيات كاملة على كل شيء
    // ============================================
    'super_admin': { '*': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'] },

    // ============================================
    // مدير تقنية المعلومات (IT_DIRECTOR)
    // صلاحيات كاملة على جميع الموديولات والشاشات وإعدادات النظام
    // ما عدا: SaaS، الوكلاء (Agents)، الرقابة الذكية (AI Monitoring)
    // ============================================
    'it_director': {
        // لوحة التحكم
        'dashboard_*': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        // الموارد البشرية - كامل
        'hr_*': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        // المستودعات - كامل
        'warehouse_*': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        // المالية - كامل
        'finance_*': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        // سداد - كامل
        'sadad_*': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        // حركة الأسطول - كامل
        'movement_*': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        // الأرشفة - كامل
        'archiving_*': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        // قياس الأداء - كامل
        'epm_*': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        // التحليلات - كامل
        'analytics_*': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        // إدارة النظام - كامل
        'admin_*': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        // ممنوع: SaaS, Agents, AI Monitoring
        'saas_*': [],
        'agents_*': [],
        'ai_monitoring_*': [],
    },

    // ============================================
    // المدير المالي (FINANCE_DIRECTOR)
    // - HR: فقط الجوانب المالية (الرواتب، البدلات، الجزاءات، المكافآت) - عرض فقط
    // - Warehouse: عرض فقط للبيانات المالية
    // - Finance: صلاحيات كاملة
    // ============================================
    'finance_director': {
        'dashboard_*': ['view'],
        // HR - الجوانب المالية فقط (عرض + تقارير)
        'hr_dashboard': ['view'],
        'hr_payroll': ['view', 'export', 'print'],
        'hr_salaries': ['view', 'export', 'print'],
        'hr_promotions': ['view'], // عرض الترقيات للجانب المالي
        'hr_reports': ['view', 'export', 'print'],
        // المستودعات - عرض التقارير المالية فقط
        'warehouse_dashboard': ['view'],
        'warehouse_reports': ['view', 'export', 'print'],
        'warehouse_reports_financial': ['view', 'export', 'print'],
        // المالية - صلاحيات كاملة
        'finance_*': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        // سداد - كامل
        'sadad_*': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        // التحليلات المالية
        'analytics_*': ['view', 'export', 'print'],
    },

    // ============================================
    // مدير المستودعات (WAREHOUSE_DIRECTOR)
    // صلاحيات كاملة على المستودعات ما عدا محاضر الجرد
    // ============================================
    'warehouse_director': {
        'dashboard_*': ['view'],
        // المستودعات - كامل ما عدا محاضر الجرد
        'warehouse_dashboard': ['view', 'export', 'print'],
        'warehouse_inventory': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'warehouse_items': ['view', 'create', 'edit', 'delete', 'export', 'print'],
        'warehouse_items_add': ['view', 'create'],
        'warehouse_items_edit': ['view', 'edit'],
        'warehouse_movements': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        // الاستلام - كامل
        'warehouse_receiving': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'warehouse_temp_receive': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'warehouse_temp_receive_create': ['view', 'create'],
        'warehouse_temp_receive_transfer': ['view', 'create', 'approve'],
        'warehouse_temp_receive_approve': ['view', 'approve'],
        'warehouse_receipt_notes': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'warehouse_receipt_notes_create': ['view', 'create'],
        'warehouse_receipt_notes_approve': ['view', 'approve'],
        // الصرف - كامل
        'warehouse_issuing': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'warehouse_exchange_requests': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'warehouse_exchange_requests_create': ['view', 'create'],
        'warehouse_exchange_approve_level1': ['view'],
        'warehouse_exchange_approve_level2': ['view', 'approve'], // مدير المستودع = Level 2
        'warehouse_exchange_approve_level3': ['view'],
        'warehouse_exchange_approve_level4': ['view'],
        'warehouse_exchange_approve_level5': ['view'],
        // التحويلات
        'warehouse_transfers': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'warehouse_transfers_between': ['view', 'create', 'edit', 'approve'],
        // الجرد - عرض فقط (ممنوع من محاضر الجرد)
        'warehouse_stocktaking': ['view', 'export', 'print'],
        'warehouse_inventory_forms': [], // ممنوع
        'warehouse_inventory_forms_create': [], // ممنوع
        'warehouse_inventory_forms_sign': [], // ممنوع
        'warehouse_inventory_forms_approve': [], // ممنوع
        // التسويات والسنة المالية - عرض فقط
        'warehouse_adjustments': ['view', 'export', 'print'],
        'warehouse_adjustments_create': [],
        'warehouse_adjustments_approve': [],
        'warehouse_fiscal_year': ['view', 'export', 'print'],
        'warehouse_fiscal_year_open': [],
        'warehouse_fiscal_year_close': [],
        'warehouse_stock_posting': ['view', 'export', 'print'],
        'warehouse_stock_posting_approve': [],
        // العهد والإهلاك
        'warehouse_custody': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'warehouse_custody_assign': ['view', 'create', 'approve'],
        'warehouse_custody_return': ['view', 'create', 'approve'],
        'warehouse_depreciation': ['view', 'create', 'edit', 'approve', 'export', 'print'],
        // التقارير والإعدادات
        'warehouse_reports': ['view', 'export', 'print'],
        'warehouse_reports_financial': ['view', 'export', 'print'],
        'warehouse_settings': ['view', 'create', 'edit'],
        // التحليلات
        'analytics_*': ['view', 'export', 'print'],
    },

    // ============================================
    // مدير الموارد البشرية (HR_DIRECTOR)
    // صلاحيات كاملة على HR ما عدا:
    // - إنشاء مسير الرواتب
    // - إنشاء إجازات
    // - العمل الإضافي
    // - مراقب الدوام
    // ============================================
    'hr_director': {
        'dashboard_*': ['view'],
        // HR Dashboard
        'hr_dashboard': ['view', 'export', 'print'],
        // الموظفين - كامل
        'hr_employees': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'hr_employees_add': ['view', 'create'],
        'hr_employees_edit': ['view', 'edit'],
        'hr_employees_delete': ['view', 'delete'],
        // الإدارات والهيكل التنظيمي
        'hr_departments': ['view', 'create', 'edit', 'delete', 'export', 'print'],
        'hr_organization': ['view', 'create', 'edit', 'delete', 'export', 'print'],
        // الحضور - عرض فقط (ممنوع من مراقب الدوام)
        'hr_attendance': ['view', 'export', 'print'],
        'hr_attendance_daily': ['view', 'export', 'print'],
        'hr_attendance_reports': ['view', 'export', 'print'],
        'hr_attendance_devices': ['view'],
        'hr_attendance_exceptions': ['view', 'approve', 'export', 'print'],
        'hr_attendance_supervisor': [], // ممنوع - مراقب الدوام
        'hr_attendance_supervisor_dashboard': [], // ممنوع
        'hr_attendance_deductions': ['view', 'approve', 'export', 'print'],
        'hr_attendance_notifications': ['view'],
        'hr_attendance_actions': ['view', 'approve', 'export', 'print'],
        // الإجازات - عرض واعتماد فقط (ممنوع من الإنشاء)
        'hr_leaves': ['view', 'approve', 'export', 'print'],
        'hr_leaves_requests': ['view', 'approve'], // لا يمكنه إنشاء
        'hr_leaves_approvals': ['view', 'approve'],
        'hr_leaves_balances': ['view', 'export', 'print'],
        'hr_leaves_sick': ['view', 'approve', 'export', 'print'],
        'hr_leaves_carryforward': ['view', 'approve'],
        // الانتدابات - كامل
        'hr_delegations': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        // العمل الإضافي - عرض واعتماد فقط (ممنوع من الإنشاء)
        'hr_overtime': ['view', 'approve', 'export', 'print'],
        // القرارات
        'hr_decisions': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        // الرواتب - عرض واعتماد فقط (ممنوع من الإنشاء)
        'hr_payroll': ['view', 'approve', 'export', 'print'],
        'hr_salaries': ['view', 'edit', 'approve', 'export', 'print'],
        // الترقيات والنقل
        'hr_promotions': ['view', 'create', 'edit', 'approve', 'export', 'print'],
        'hr_transfers': ['view', 'create', 'edit', 'approve', 'export', 'print'],
        // العقود والمستندات
        'hr_contracts': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'hr_documents': ['view', 'create', 'edit', 'delete', 'export', 'print'],
        // إخلاء الطرف
        'hr_clearance': ['view', 'create', 'edit', 'approve', 'export', 'print'],
        // التقارير والإعدادات
        'hr_reports': ['view', 'export', 'print'],
        'hr_settings': ['view', 'create', 'edit'],
        // قياس الأداء - كامل
        'epm_*': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        // التحليلات
        'analytics_*': ['view', 'export', 'print'],
    },

    // ============================================
    // أمين المستودع (WAREHOUSE_KEEPER)
    // - محدود بالمستودعات المسندة إليه (warehouseScoped)
    // - تفويض استلام من مذكرة الاستلام
    // - اعتماد طلبات الصرف - المستوى 5
    // - توقيع محاضر الجرد كأمين مستودع
    // ============================================
    'warehouse_keeper': {
        'dashboard_*': ['view'],
        'warehouse_dashboard': ['view'],
        // المخزون - محدود بالمستودع المسند
        'warehouse_inventory': ['view', 'export', 'print'],
        'warehouse_items': ['view'],
        'warehouse_movements': ['view', 'export', 'print'],
        // الاستلام - تفويض استلام
        'warehouse_receiving': ['view', 'create', 'edit'],
        'warehouse_temp_receive': ['view'],
        'warehouse_temp_receive_create': [],
        'warehouse_temp_receive_transfer': [],
        'warehouse_temp_receive_approve': [],
        'warehouse_receipt_notes': ['view', 'create', 'edit', 'approve'], // تفويض استلام
        'warehouse_receipt_notes_create': ['view', 'create'],
        'warehouse_receipt_notes_approve': ['view', 'approve'],
        // الصرف - المستوى 5 (الصرف النهائي)
        'warehouse_issuing': ['view', 'create', 'edit'],
        'warehouse_exchange_requests': ['view'],
        'warehouse_exchange_requests_create': [],
        'warehouse_exchange_approve_level1': [],
        'warehouse_exchange_approve_level2': [],
        'warehouse_exchange_approve_level3': [],
        'warehouse_exchange_approve_level4': [],
        'warehouse_exchange_approve_level5': ['view', 'approve'], // المستوى 5 - أمين المستودع
        // التحويلات
        'warehouse_transfers': ['view'],
        'warehouse_transfers_between': ['view'],
        // الجرد - توقيع كأمين مستودع
        'warehouse_stocktaking': ['view'],
        'warehouse_inventory_forms': ['view'],
        'warehouse_inventory_forms_create': [],
        'warehouse_inventory_forms_sign': ['view', 'create'], // توقيع كأمين مستودع
        'warehouse_inventory_forms_approve': [],
        // التسويات والسنة المالية
        'warehouse_adjustments': ['view'],
        'warehouse_adjustments_create': [],
        'warehouse_adjustments_approve': [],
        'warehouse_fiscal_year': ['view'],
        'warehouse_fiscal_year_open': [],
        'warehouse_fiscal_year_close': [],
        'warehouse_stock_posting': ['view'],
        'warehouse_stock_posting_approve': [],
        // العهد
        'warehouse_custody': ['view', 'create', 'edit'],
        'warehouse_custody_assign': ['view', 'create'],
        'warehouse_custody_return': ['view', 'create'],
        'warehouse_depreciation': ['view'],
        // التقارير
        'warehouse_reports': ['view', 'export', 'print'],
        'warehouse_reports_financial': [],
        'warehouse_settings': ['view'],
        // صلاحية خاصة: warehouseScoped = true (محدود بالمستودعات المسندة)
        _meta: { warehouseScoped: true }
    },

    // ============================================
    // مأمور ساحة الاستلام (RECEIVING_OFFICER)
    // - إنشاء مستندات الاستلام المؤقت
    // - ترحيل إلى مذكرة استلام بعد الفحص
    // ============================================
    'receiving_officer': {
        'dashboard_*': ['view'],
        'warehouse_dashboard': ['view'],
        // المخزون - عرض فقط
        'warehouse_inventory': ['view'],
        'warehouse_items': ['view'],
        'warehouse_movements': ['view'],
        // الاستلام المؤقت - كامل
        'warehouse_receiving': ['view', 'create', 'edit'],
        'warehouse_temp_receive': ['view', 'create', 'edit', 'export', 'print'],
        'warehouse_temp_receive_create': ['view', 'create'],
        'warehouse_temp_receive_transfer': ['view', 'create'], // ترحيل لمذكرة الاستلام
        'warehouse_temp_receive_approve': [],
        // مذكرات الاستلام - إنشاء من الاستلام المؤقت
        'warehouse_receipt_notes': ['view', 'create'],
        'warehouse_receipt_notes_create': ['view', 'create'],
        'warehouse_receipt_notes_approve': [],
        // الصرف - عرض فقط
        'warehouse_issuing': ['view'],
        'warehouse_exchange_requests': ['view'],
        'warehouse_exchange_requests_create': [],
        'warehouse_exchange_approve_level1': [],
        'warehouse_exchange_approve_level2': [],
        'warehouse_exchange_approve_level3': [],
        'warehouse_exchange_approve_level4': [],
        'warehouse_exchange_approve_level5': [],
        // التحويلات
        'warehouse_transfers': ['view'],
        'warehouse_transfers_between': [],
        // الجرد
        'warehouse_stocktaking': ['view'],
        'warehouse_inventory_forms': [],
        'warehouse_inventory_forms_create': [],
        'warehouse_inventory_forms_sign': [],
        'warehouse_inventory_forms_approve': [],
        // التسويات
        'warehouse_adjustments': [],
        'warehouse_adjustments_create': [],
        'warehouse_adjustments_approve': [],
        'warehouse_fiscal_year': [],
        'warehouse_fiscal_year_open': [],
        'warehouse_fiscal_year_close': [],
        'warehouse_stock_posting': [],
        'warehouse_stock_posting_approve': [],
        // العهد
        'warehouse_custody': ['view'],
        'warehouse_custody_assign': [],
        'warehouse_custody_return': [],
        'warehouse_depreciation': ['view'],
        // التقارير
        'warehouse_reports': ['view', 'export', 'print'],
        'warehouse_reports_financial': [],
        'warehouse_settings': ['view'],
    },

    // ============================================
    // مراقب المخزون (INVENTORY_CONTROLLER)
    // - صلاحيات كاملة على محاضر الجرد
    // - التسويات
    // - إدارة السنة المالية
    // - اعتماد ترحيل المخزون
    // - اعتماد طلبات الصرف - المستوى 4
    // ============================================
    'inventory_controller': {
        'dashboard_*': ['view'],
        'warehouse_dashboard': ['view', 'export', 'print'],
        // المخزون - كامل
        'warehouse_inventory': ['view', 'create', 'edit', 'export', 'print'],
        'warehouse_items': ['view', 'export', 'print'],
        'warehouse_movements': ['view', 'export', 'print'],
        // الاستلام - عرض فقط
        'warehouse_receiving': ['view'],
        'warehouse_temp_receive': ['view'],
        'warehouse_temp_receive_create': [],
        'warehouse_temp_receive_transfer': [],
        'warehouse_temp_receive_approve': [],
        'warehouse_receipt_notes': ['view'],
        'warehouse_receipt_notes_create': [],
        'warehouse_receipt_notes_approve': [],
        // الصرف - المستوى 4
        'warehouse_issuing': ['view'],
        'warehouse_exchange_requests': ['view', 'export', 'print'],
        'warehouse_exchange_requests_create': [],
        'warehouse_exchange_approve_level1': [],
        'warehouse_exchange_approve_level2': [],
        'warehouse_exchange_approve_level3': [],
        'warehouse_exchange_approve_level4': ['view', 'approve'], // المستوى 4 - مراقب المخزون
        'warehouse_exchange_approve_level5': [],
        // التحويلات
        'warehouse_transfers': ['view', 'export', 'print'],
        'warehouse_transfers_between': ['view'],
        // الجرد ومحاضر الجرد - كامل
        'warehouse_stocktaking': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'warehouse_inventory_forms': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'warehouse_inventory_forms_create': ['view', 'create'],
        'warehouse_inventory_forms_sign': ['view', 'create'],
        'warehouse_inventory_forms_approve': ['view', 'approve'],
        // التسويات - كامل
        'warehouse_adjustments': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'warehouse_adjustments_create': ['view', 'create'],
        'warehouse_adjustments_approve': ['view', 'approve'],
        // السنة المالية - كامل
        'warehouse_fiscal_year': ['view', 'create', 'edit', 'approve', 'export', 'print'],
        'warehouse_fiscal_year_open': ['view', 'create'],
        'warehouse_fiscal_year_close': ['view', 'create', 'approve'],
        // ترحيل المخزون - كامل
        'warehouse_stock_posting': ['view', 'create', 'edit', 'approve', 'export', 'print'],
        'warehouse_stock_posting_approve': ['view', 'approve'],
        // العهد - عرض فقط
        'warehouse_custody': ['view', 'export', 'print'],
        'warehouse_custody_assign': [],
        'warehouse_custody_return': [],
        'warehouse_depreciation': ['view', 'export', 'print'],
        // التقارير
        'warehouse_reports': ['view', 'export', 'print'],
        'warehouse_reports_financial': ['view', 'export', 'print'],
        'warehouse_settings': ['view'],
    },

    // ============================================
    // الأدوار الأخرى (للتوافق مع النظام القديم)
    // ============================================
    'deputy_mayor_assistant': {
        'dashboard_*': ['view', 'export', 'print'],
        'hr_*': ['view', 'approve', 'export', 'print'],
        'warehouse_*': ['view', 'approve', 'export', 'print'],
        'finance_*': ['view', 'approve', 'export', 'print'],
        'movement_*': ['view', 'approve', 'export', 'print'],
        'analytics_*': ['view', 'export', 'print'],
    },
    'department_director': {
        'dashboard_*': ['view'],
        'hr_dashboard': ['view'],
        'hr_employees': ['view'],
        'hr_leaves_approvals': ['view', 'approve'],
        'hr_attendance': ['view', 'export', 'print'],
        'hr_reports': ['view', 'export', 'print'],
        // اعتماد طلبات الصرف - المستوى 1 (رئيس القسم)
        'warehouse_exchange_approve_level1': ['view', 'approve'],
    },
    'section_manager': {
        'dashboard_*': ['view'],
        'hr_dashboard': ['view'],
        'hr_employees': ['view'],
        'hr_leaves_approvals': ['view', 'approve'],
        'hr_attendance': ['view'],
    },
    'unit_manager': {
        'dashboard_*': ['view'],
        'hr_dashboard': ['view'],
        'hr_leaves_approvals': ['view', 'approve'],
        'hr_attendance': ['view'],
    },
    'it_employee': {
        'admin_*': ['view', 'create', 'edit', 'delete'],
        'dashboard_*': ['view'],
        'analytics_audit': ['view', 'export'],
    },
    'hr_employee': {
        'hr_dashboard': ['view'],
        'hr_employees': ['view', 'create', 'edit'],
        'hr_departments': ['view'],
        'hr_attendance': ['view'],
        'hr_leaves': ['view', 'create'],
        'hr_documents': ['view', 'create', 'edit'],
        'hr_reports': ['view', 'export', 'print'],
    },
    'delegation_coordinator': {
        'hr_dashboard': ['view'],
        'hr_delegations': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'hr_overtime': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'hr_employees': ['view'],
        'hr_reports': ['view', 'export', 'print'],
    },
    'attendance_leave_officer': {
        'hr_dashboard': ['view'],
        'hr_attendance': ['view', 'create', 'edit', 'export', 'print'],
        'hr_attendance_daily': ['view', 'create', 'edit', 'export', 'print'],
        'hr_attendance_reports': ['view', 'export', 'print'],
        'hr_attendance_exceptions': ['view', 'create', 'edit'],
        'hr_leaves': ['view', 'create', 'edit', 'export', 'print'],
        'hr_leaves_requests': ['view', 'create', 'edit'],
        'hr_leaves_balances': ['view', 'edit', 'export', 'print'],
        'hr_employees': ['view'],
        'hr_reports': ['view', 'export', 'print'],
    },
    'attendance_officer': {
        'hr_dashboard': ['view'],
        'hr_attendance': ['view', 'create', 'edit', 'export', 'print'],
        'hr_attendance_daily': ['view', 'create', 'edit', 'export', 'print'],
        'hr_attendance_reports': ['view', 'export', 'print'],
        'hr_attendance_devices': ['view'],
        'hr_attendance_exceptions': ['view', 'create', 'edit'],
        'hr_employees': ['view'],
        'hr_reports': ['view', 'export', 'print'],
    },
    'attendance_supervisor': {
        'hr_dashboard': ['view'],
        'hr_attendance': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'hr_attendance_daily': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'hr_attendance_reports': ['view', 'create', 'export', 'print'],
        'hr_attendance_devices': ['view', 'create', 'edit'],
        'hr_attendance_exceptions': ['view', 'create', 'edit', 'delete', 'approve'],
        'hr_attendance_supervisor': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'hr_attendance_supervisor_dashboard': ['view', 'create', 'edit', 'approve', 'export', 'print'],
        'hr_attendance_deductions': ['view', 'create', 'edit', 'delete', 'approve'],
        'hr_attendance_notifications': ['view', 'create', 'edit', 'delete'],
        'hr_attendance_actions': ['view', 'create', 'edit', 'delete', 'approve'],
        'hr_employees': ['view'],
        'hr_leaves': ['view'],
        'hr_leaves_balances': ['view', 'edit'],
        'hr_reports': ['view', 'export', 'print'],
    },
    'leave_officer': {
        'hr_dashboard': ['view'],
        'hr_leaves': ['view', 'create', 'edit', 'export', 'print'],
        'hr_leaves_requests': ['view', 'create', 'edit'],
        'hr_leaves_balances': ['view', 'edit', 'export', 'print'],
        'hr_leaves_carryforward': ['view', 'create', 'edit'],
        'hr_employees': ['view'],
        'hr_reports': ['view', 'export', 'print'],
    },
    'sick_leave_specialist': {
        'hr_dashboard': ['view'],
        'hr_leaves': ['view'],
        'hr_leaves_sick': ['view', 'create', 'edit', 'approve', 'export', 'print'],
        'hr_leaves_requests': ['view'],
        'hr_employees': ['view'],
        'hr_reports': ['view', 'export', 'print'],
    },
    'decision_issuer': {
        'hr_dashboard': ['view'],
        'hr_decisions': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'hr_promotions': ['view', 'create', 'edit'],
        'hr_transfers': ['view', 'create', 'edit'],
        'hr_employees': ['view'],
        'hr_contracts': ['view', 'create', 'edit'],
        'hr_reports': ['view', 'export', 'print'],
    },
    'auditor': {
        'dashboard_*': ['view'],
        'hr_*': ['view', 'export', 'print'],
        'warehouse_*': ['view', 'export', 'print'],
        'finance_*': ['view', 'export', 'print'],
        'analytics_*': ['view', 'export', 'print'],
        'analytics_audit': ['view', 'export', 'print'],
    },
    'accountant': {
        'finance_dashboard': ['view'],
        'finance_gl': ['view', 'create', 'edit'],
        'finance_gl_accounts': ['view', 'create', 'edit'],
        'finance_gl_journals': ['view', 'create', 'edit'],
        'finance_ap': ['view', 'create', 'edit'],
        'finance_ap_invoices': ['view', 'create', 'edit'],
        'finance_reports': ['view', 'export', 'print'],
    },
    'treasurer': {
        'finance_dashboard': ['view'],
        'finance_treasury': ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        'finance_treasury_accounts': ['view', 'create', 'edit'],
        'finance_treasury_reconciliation': ['view', 'create', 'edit'],
        'finance_ap_payments': ['view', 'create', 'edit', 'approve'],
        'finance_reports': ['view', 'export', 'print'],
    },
    // مدير الخدمات العامة - المستوى 3
    'public_services': {
        'dashboard_*': ['view'],
        'warehouse_dashboard': ['view'],
        'warehouse_exchange_requests': ['view'],
        'warehouse_exchange_approve_level3': ['view', 'approve'], // المستوى 3
        'warehouse_reports': ['view', 'export', 'print'],
    },
    // مدير المستودع (للتوافق) - المستوى 2
    'head_warehouse': {
        'dashboard_*': ['view'],
        'warehouse_*': ['view', 'create', 'edit', 'approve', 'export', 'print'],
        'warehouse_exchange_approve_level2': ['view', 'approve'], // المستوى 2
    },
    'employee': {
        'dashboard_view': ['view'],
        'hr_leaves_requests': ['view', 'create'],
        'hr_attendance': ['view'],
        // طلبات الصرف - إنشاء فقط
        'warehouse_exchange_requests': ['view'],
        'warehouse_exchange_requests_create': ['view', 'create'],
    }
};

// ============================================
// 5. تعريف صلاحيات الصفحات (للتوافق)
// ============================================

export const PAGE_PERMISSIONS = {
    '/dashboard': null,
    '/chat': null,
    '/notifications': null,
    '/hr': PERMISSIONS.HR_READ,
    '/hr/organization': PERMISSIONS.HR_READ,
    '/hr/employees': PERMISSIONS.HR_READ,
    '/hr/departments': PERMISSIONS.HR_READ,
    '/hr/leaves': PERMISSIONS.HR_READ,
    '/hr/attendance': PERMISSIONS.HR_READ,
    '/hr/attendance/supervisor': PERMISSIONS.HR_ADMIN,
    '/hr/attendance/supervisor/dashboard': PERMISSIONS.HR_ADMIN,
    '/hr/attendance/deductions': PERMISSIONS.HR_ADMIN,
    '/hr/attendance/notifications': PERMISSIONS.HR_WRITE,
    '/hr/attendance/actions': PERMISSIONS.HR_ADMIN,
    '/hr/clearance': PERMISSIONS.HR_WRITE,
    '/hr/promotions': PERMISSIONS.HR_WRITE,
    '/hr/payroll': PERMISSIONS.HR_ADMIN,
    '/hr/settings': PERMISSIONS.HR_ADMIN,
    '/epm': PERMISSIONS.EPM_READ,
    '/warehouse': PERMISSIONS.WAREHOUSE_READ,
    '/warehouse/inventory': PERMISSIONS.WAREHOUSE_READ,
    '/warehouse/custody': PERMISSIONS.WAREHOUSE_READ,
    '/warehouse/stocktaking': PERMISSIONS.WAREHOUSE_ADMIN,
    '/warehouse/temp-receive': PERMISSIONS.WAREHOUSE_READ,
    '/warehouse/receipt-notes': PERMISSIONS.WAREHOUSE_READ,
    '/warehouse/exchange-requests': PERMISSIONS.WAREHOUSE_READ,
    '/warehouse/inventory-forms': PERMISSIONS.WAREHOUSE_ADMIN,
    '/warehouse/fiscal-year': PERMISSIONS.WAREHOUSE_ADMIN,
    '/warehouse/adjustments': PERMISSIONS.WAREHOUSE_ADMIN,
    '/warehouse/stock-posting': PERMISSIONS.WAREHOUSE_ADMIN,
    '/movement': PERMISSIONS.MOVEMENT_READ,
    '/movement/vehicles': PERMISSIONS.MOVEMENT_READ,
    '/movement/drivers': PERMISSIONS.MOVEMENT_READ,
    '/archiving': PERMISSIONS.ARCHIVING_READ,
    '/finance': PERMISSIONS.FINANCE_READ,
    '/finance/gl': PERMISSIONS.FINANCE_READ,
    '/finance/budget': PERMISSIONS.FINANCE_READ,
    '/finance/ap': PERMISSIONS.FINANCE_READ,
    '/finance/procurement': PERMISSIONS.FINANCE_READ,
    '/finance/treasury': PERMISSIONS.FINANCE_READ,
    '/finance/assets': PERMISSIONS.FINANCE_READ,
    '/finance/reports': PERMISSIONS.FINANCE_READ,
    '/sadad': PERMISSIONS.SADAD_READ,
    '/analytics': PERMISSIONS.ANALYTICS_READ,
    '/admin/tenants': PERMISSIONS.SAAS_READ,
    '/admin/platform/subscriptions': PERMISSIONS.SAAS_READ,
    '/admin/platform/billing': PERMISSIONS.SAAS_ADMIN,
    '/admin/platform/free-trials': PERMISSIONS.SAAS_READ,
    '/admin/platform/admin-users': PERMISSIONS.SAAS_ADMIN,
    '/admin/platform/notifications': PERMISSIONS.SAAS_ADMIN,
    '/admin/platform/contact-requests': PERMISSIONS.SAAS_READ,
    '/admin/platform/landing-admin': PERMISSIONS.SAAS_ADMIN,
    '/admin/platform/analytics': PERMISSIONS.SAAS_READ,
    '/admin': PERMISSIONS.SETTINGS_READ,
    '/admin/roles': PERMISSIONS.SETTINGS_ADMIN,
    '/admin/permissions': PERMISSIONS.SETTINGS_ADMIN,
};

// ============================================
// 6. Helper Functions
// ============================================

export function isSuperAdmin(roles) {
    if (!roles || !Array.isArray(roles)) return false;
    return roles.includes('super_admin');
}

export function hasPermission(permission, userPermissions = [], userRoles = []) {
    if (!permission) return true;
    if (isSuperAdmin(userRoles)) return true;
    if (userPermissions.includes(permission)) return true;
    const [module] = permission.split(':');
    if (userPermissions.includes(`${module}:admin`)) return true;
    return false;
}

export function canAccessPage(pathname, userPermissions = [], userRoles = []) {
    if (isSuperAdmin(userRoles)) return true;
    const requiredPermission = PAGE_PERMISSIONS[pathname];
    if (requiredPermission === null || requiredPermission === undefined) return true;
    return hasPermission(requiredPermission, userPermissions, userRoles);
}

export function getAccessiblePages(userPermissions = [], userRoles = []) {
    return Object.keys(PAGE_PERMISSIONS).filter(
        path => canAccessPage(path, userPermissions, userRoles)
    );
}

export function getPermissionDeniedMessage(permission) {
    const messages = {
        [PERMISSIONS.HR_READ]: 'ليس لديك صلاحية عرض بيانات الموارد البشرية',
        [PERMISSIONS.HR_WRITE]: 'ليس لديك صلاحية تعديل بيانات الموارد البشرية',
        [PERMISSIONS.HR_ADMIN]: 'ليس لديك صلاحية إدارة الموارد البشرية',
        [PERMISSIONS.WAREHOUSE_READ]: 'ليس لديك صلاحية عرض بيانات المستودعات',
        [PERMISSIONS.FINANCE_READ]: 'ليس لديك صلاحية عرض البيانات المالية',
        [PERMISSIONS.SETTINGS_ADMIN]: 'ليس لديك صلاحية إدارة إعدادات النظام',
    };
    return messages[permission] || 'ليس لديك صلاحية الوصول لهذه الصفحة';
}

export function getJobTitlesByCategory() {
    const grouped = {};
    Object.values(JOB_TITLES).forEach(job => {
        if (!grouped[job.category]) grouped[job.category] = [];
        grouped[job.category].push(job);
    });
    return grouped;
}

export function getAllScreens() {
    const screens = [];
    Object.values(SYSTEM_MODULES).forEach(module => {
        module.screens.forEach(screen => {
            screens.push({
                ...screen,
                moduleId: module.id,
                moduleName: module.nameAr,
                system: module.system
            });
        });
    });
    return screens;
}

export function hasScreenPermission(userPermissions, screenId, permissionType) {
    if (!userPermissions) return false;
    if (userPermissions['*']?.includes(permissionType)) return true;
    const modulePrefix = screenId.split('_')[0] + '_*';
    if (userPermissions[modulePrefix]?.includes(permissionType)) return true;
    return userPermissions[screenId]?.includes(permissionType) || false;
}

export function getPermissionsForRole(roleId) {
    return DEFAULT_PERMISSIONS[roleId] || {};
}

export function mergePermissions(roleIds) {
    const merged = {};
    roleIds.forEach(roleId => {
        const permissions = DEFAULT_PERMISSIONS[roleId] || {};
        Object.entries(permissions).forEach(([screenId, perms]) => {
            if (screenId === '_meta') return; // تخطي البيانات الوصفية
            if (!merged[screenId]) merged[screenId] = [];
            if (Array.isArray(perms)) {
                perms.forEach(p => {
                    if (!merged[screenId].includes(p)) merged[screenId].push(p);
                });
            }
        });
    });
    return merged;
}

// ============================================
// 7. دوال التحقق من الصلاحيات المحددة بالنطاق
// ============================================

/**
 * التحقق مما إذا كان الدور له صلاحيات محدودة بالمستودع
 * @param {string} roleId معرف الدور
 * @returns {boolean}
 */
export function isWarehouseScoped(roleId) {
    const permissions = DEFAULT_PERMISSIONS[roleId];
    return permissions?._meta?.warehouseScoped === true;
}

/**
 * التحقق مما إذا كان الدور له صلاحيات محدودة بالقسم
 * @param {string} roleId معرف الدور
 * @returns {boolean}
 */
export function isDepartmentScoped(roleId) {
    const permissions = DEFAULT_PERMISSIONS[roleId];
    return permissions?._meta?.departmentScoped === true;
}

/**
 * التحقق مما إذا كان المستخدم يمكنه الوصول للمستودع المحدد
 * @param {Object} user كائن المستخدم
 * @param {string|number} warehouseId معرف المستودع
 * @returns {boolean}
 */
export function canAccessWarehouse(user, warehouseId) {
    if (!user || !user.roles) return false;

    // المدراء لديهم وصول كامل
    if (user.roles.includes('super_admin') ||
        user.roles.includes('it_director') ||
        user.roles.includes('warehouse_director')) {
        return true;
    }

    // التحقق من الأدوار المحددة بالمستودع
    const hasWarehouseScopedRole = user.roles.some(role => isWarehouseScoped(role));

    if (hasWarehouseScopedRole) {
        // التحقق من المستودعات المسندة للمستخدم
        const assignedWarehouses = user.assignedWarehouses || [];
        return assignedWarehouses.includes(String(warehouseId)) ||
               assignedWarehouses.includes(Number(warehouseId));
    }

    return true; // الأدوار الأخرى لديها وصول كامل
}

/**
 * الحصول على المستودعات المتاحة للمستخدم
 * @param {Object} user كائن المستخدم
 * @param {Array} allWarehouses جميع المستودعات
 * @returns {Array} المستودعات المتاحة
 */
export function getAccessibleWarehouses(user, allWarehouses = []) {
    if (!user || !user.roles) return [];

    // المدراء لديهم وصول كامل
    if (user.roles.includes('super_admin') ||
        user.roles.includes('it_director') ||
        user.roles.includes('warehouse_director')) {
        return allWarehouses;
    }

    // التحقق من الأدوار المحددة بالمستودع
    const hasWarehouseScopedRole = user.roles.some(role => isWarehouseScoped(role));

    if (hasWarehouseScopedRole) {
        const assignedWarehouses = user.assignedWarehouses || [];
        return allWarehouses.filter(w =>
            assignedWarehouses.includes(String(w.id)) ||
            assignedWarehouses.includes(Number(w.id))
        );
    }

    return allWarehouses;
}

// ============================================
// 8. دوال مستويات اعتماد طلبات الصرف
// ============================================

/**
 * مستويات اعتماد طلبات الصرف
 */
export const EXCHANGE_APPROVAL_LEVELS = {
    LEVEL_1: {
        level: 1,
        key: 'HeadDepartment',
        field: 'HeadDepartment_Approved',
        title: 'رئيس القسم',
        titleEn: 'Department Head',
        icon: '👤',
        roles: ['department_director', 'super_admin', 'it_director'],
        screenPermission: 'warehouse_exchange_approve_level1'
    },
    LEVEL_2: {
        level: 2,
        key: 'HeadWarehouse',
        field: 'HeadWarehouse_Approved',
        title: 'مدير المستودع',
        titleEn: 'Warehouse Manager',
        icon: '🏪',
        roles: ['warehouse_director', 'head_warehouse', 'super_admin', 'it_director'],
        screenPermission: 'warehouse_exchange_approve_level2'
    },
    LEVEL_3: {
        level: 3,
        key: 'PublicServices',
        field: 'Public_Services_Approved',
        title: 'الخدمات العامة',
        titleEn: 'Public Services',
        icon: '🔧',
        roles: ['public_services', 'super_admin', 'it_director'],
        screenPermission: 'warehouse_exchange_approve_level3'
    },
    LEVEL_4: {
        level: 4,
        key: 'Authorized',
        field: 'Authorized_Approved',
        title: 'مراقب المخزون',
        titleEn: 'Inventory Controller',
        icon: '📊',
        roles: ['inventory_controller', 'super_admin', 'it_director'],
        screenPermission: 'warehouse_exchange_approve_level4'
    },
    LEVEL_5: {
        level: 5,
        key: 'Security',
        field: 'Security_Approved',
        title: 'أمين المستودع',
        titleEn: 'Warehouse Keeper',
        icon: '🔐',
        roles: ['warehouse_keeper', 'super_admin', 'it_director'],
        screenPermission: 'warehouse_exchange_approve_level5'
    }
};

/**
 * الحصول على مستويات الاعتماد المتاحة للمستخدم
 * @param {Array} userRoles أدوار المستخدم
 * @returns {Array} مستويات الاعتماد المتاحة
 */
export function getAvailableApprovalLevels(userRoles) {
    if (!userRoles || !Array.isArray(userRoles)) return [];

    return Object.values(EXCHANGE_APPROVAL_LEVELS)
        .filter(level => userRoles.some(role => level.roles.includes(role)))
        .sort((a, b) => a.level - b.level);
}

/**
 * التحقق من صلاحية الاعتماد على مستوى معين
 * @param {Array} userRoles أدوار المستخدم
 * @param {number} level مستوى الاعتماد (1-5)
 * @returns {boolean}
 */
export function canApproveExchangeAtLevel(userRoles, level) {
    if (!userRoles || !Array.isArray(userRoles)) return false;

    const levelConfig = EXCHANGE_APPROVAL_LEVELS[`LEVEL_${level}`];
    if (!levelConfig) return false;

    return userRoles.some(role => levelConfig.roles.includes(role));
}

/**
 * الحصول على المستوى الحالي المطلوب للاعتماد
 * @param {Object} exchangeRequest طلب الصرف
 * @returns {Object|null} معلومات المستوى الحالي أو null إذا تم الاعتماد بالكامل
 */
export function getCurrentRequiredApprovalLevel(exchangeRequest) {
    if (!exchangeRequest) return EXCHANGE_APPROVAL_LEVELS.LEVEL_1;

    for (const level of Object.values(EXCHANGE_APPROVAL_LEVELS)) {
        if (!exchangeRequest[level.field]) {
            return level;
        }
    }

    return null; // تم الاعتماد بالكامل
}

/**
 * التحقق مما إذا كان المستخدم يمكنه اعتماد طلب الصرف
 * @param {Array} userRoles أدوار المستخدم
 * @param {Object} exchangeRequest طلب الصرف
 * @returns {boolean}
 */
export function canApproveExchangeRequest(userRoles, exchangeRequest) {
    const currentLevel = getCurrentRequiredApprovalLevel(exchangeRequest);
    if (!currentLevel) return false; // تم الاعتماد بالكامل

    return canApproveExchangeAtLevel(userRoles, currentLevel.level);
}

/**
 * الحصول على حالة اعتماد طلب الصرف
 * @param {Object} exchangeRequest طلب الصرف
 * @returns {Object} حالة الاعتماد لكل مستوى
 */
export function getExchangeApprovalStatus(exchangeRequest) {
    if (!exchangeRequest) return {};

    const status = {};

    Object.values(EXCHANGE_APPROVAL_LEVELS).forEach(level => {
        status[level.level] = {
            ...level,
            approved: !!exchangeRequest[level.field],
            approvedBy: exchangeRequest[`${level.field}_By`] || null,
            approvedAt: exchangeRequest[`${level.field}_Date`] || null,
        };
    });

    return status;
}

// ============================================
// 9. دوال صلاحيات محاضر الجرد
// ============================================

/**
 * التحقق من صلاحية إنشاء محضر جرد
 * @param {Array} userRoles أدوار المستخدم
 * @returns {boolean}
 */
export function canCreateInventoryForm(userRoles) {
    if (!userRoles || !Array.isArray(userRoles)) return false;

    const allowedRoles = ['inventory_controller', 'super_admin', 'it_director'];
    return userRoles.some(role => allowedRoles.includes(role));
}

/**
 * التحقق من صلاحية توقيع محضر الجرد كأمين مستودع
 * @param {Array} userRoles أدوار المستخدم
 * @returns {boolean}
 */
export function canSignInventoryFormAsKeeper(userRoles) {
    if (!userRoles || !Array.isArray(userRoles)) return false;

    const allowedRoles = ['warehouse_keeper', 'inventory_controller', 'super_admin', 'it_director'];
    return userRoles.some(role => allowedRoles.includes(role));
}

/**
 * التحقق من صلاحية اعتماد محضر الجرد
 * @param {Array} userRoles أدوار المستخدم
 * @returns {boolean}
 */
export function canApproveInventoryForm(userRoles) {
    if (!userRoles || !Array.isArray(userRoles)) return false;

    const allowedRoles = ['inventory_controller', 'super_admin', 'it_director'];
    return userRoles.some(role => allowedRoles.includes(role));
}

// ============================================
// 10. دوال السنة المالية والترحيل
// ============================================

/**
 * التحقق من صلاحية فتح/إقفال السنة المالية
 * @param {Array} userRoles أدوار المستخدم
 * @returns {boolean}
 */
export function canManageFiscalYear(userRoles) {
    if (!userRoles || !Array.isArray(userRoles)) return false;

    const allowedRoles = ['inventory_controller', 'super_admin', 'it_director'];
    return userRoles.some(role => allowedRoles.includes(role));
}

/**
 * التحقق من صلاحية اعتماد ترحيل المخزون
 * @param {Array} userRoles أدوار المستخدم
 * @returns {boolean}
 */
export function canApproveStockPosting(userRoles) {
    if (!userRoles || !Array.isArray(userRoles)) return false;

    const allowedRoles = ['inventory_controller', 'super_admin', 'it_director'];
    return userRoles.some(role => allowedRoles.includes(role));
}

/**
 * التحقق من صلاحية إنشاء/اعتماد التسويات
 * @param {Array} userRoles أدوار المستخدم
 * @returns {boolean}
 */
export function canManageAdjustments(userRoles) {
    if (!userRoles || !Array.isArray(userRoles)) return false;

    const allowedRoles = ['inventory_controller', 'super_admin', 'it_director'];
    return userRoles.some(role => allowedRoles.includes(role));
}

export default {
    // الثوابت
    PERMISSIONS,
    PAGE_PERMISSIONS,
    JOB_TITLES,
    JOB_CATEGORIES,
    SYSTEM_MODULES,
    PERMISSION_TYPES,
    DEFAULT_PERMISSIONS,
    EXCHANGE_APPROVAL_LEVELS,

    // دوال الصلاحيات الأساسية
    hasPermission,
    canAccessPage,
    getAccessiblePages,
    isSuperAdmin,
    getPermissionDeniedMessage,
    getJobTitlesByCategory,
    getAllScreens,
    hasScreenPermission,
    getPermissionsForRole,
    mergePermissions,

    // دوال الصلاحيات المحددة بالنطاق
    isWarehouseScoped,
    isDepartmentScoped,
    canAccessWarehouse,
    getAccessibleWarehouses,

    // دوال اعتماد طلبات الصرف
    getAvailableApprovalLevels,
    canApproveExchangeAtLevel,
    getCurrentRequiredApprovalLevel,
    canApproveExchangeRequest,
    getExchangeApprovalStatus,

    // دوال محاضر الجرد
    canCreateInventoryForm,
    canSignInventoryFormAsKeeper,
    canApproveInventoryForm,

    // دوال السنة المالية والترحيل
    canManageFiscalYear,
    canApproveStockPosting,
    canManageAdjustments,
};
