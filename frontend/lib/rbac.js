/**
 * Masarat Unified RBAC Service
 * نظام الصلاحيات الموحد للدخول الموحد
 * 
 * المبادئ الأساسية:
 * 1. اسم المستخدم هو رقم الهوية (National ID).
 * 2. كلمة المرور الافتراضية موحدة مبدئياً.
 * 3. يتم ترجمة الصلاحيات القديمة (ClientRoles) إلى أدوار موحدة.
 */

// تعريف الأنظمة المتاحة
export const SYSTEMS = {
    HR: 'hr',
    WAREHOUSE: 'warehouse',
    ARCHIVING: 'archiving',
    EPM: 'epm',
    MOVEMENT: 'movement',
    SADAD: 'sadad',
    ANALYTICS: 'analytics',
    FINANCE: 'finance',
    ITSM: 'itsm',
    PROJECTS: 'projects',
    GRC: 'grc',
    DECLARATIONS: 'declarations',
};

// ==================== صلاحيات الموارد البشرية المحدودة (للإدارات) ====================
export const DEPARTMENT_HR_ACCESS = {
    // الأدوار التي يمكنها رؤية موظفي إدارتها فقط
    DEPARTMENT_MANAGERS: [
        'warehouse_keeper',
        'warehouse_admin',
        'head_warehouse',
        'security_warehouse',
        'department_head',
        'fleet_manager',
        'archive_admin',
        'section_head',
        'unit_head',
    ],
    // الصفحات المسموحة لمديري الإدارات
    ALLOWED_HR_PAGES: [
        '/hr/organization',      // الهيكل الإداري (إدارته فقط)
        '/hr/attendance',        // الحضور والانصراف (موظفي إدارته)
        '/hr/leaves',            // الإجازات (موظفي إدارته)
        '/hr/employees-unified', // الملف الموحد (موظفي إدارته فقط)
        '/hr/my-department',     // صفحة إدارتي
        '/hr/attendance-monitor', // مراقب الدوام
    ],
    // الصفحات المسموحة لصاحب الصلاحية (كل شيء)
    AUTHORITY_PAGES: [
        '/hr/authority-dashboard',
        '/hr/organization',
        '/hr/employees-unified',
        '/hr/departments',
        '/hr/attendance',
        '/hr/leaves',
        '/hr/salaries',
        '/hr/payroll',
        '/hr/reports',
        '/hr/attendance-monitor', // مراقب الدوام
    ]
};

// ==================== مصفوفة صلاحيات HR التفصيلية ====================
// أنواع الصلاحيات: true = كامل, 'view' = عرض فقط, false = ممنوع
export const HR_PERMISSIONS_MATRIX = {
    // فئات الصلاحيات
    CATEGORIES: {
        USER_MANAGEMENT: 'user_management',      // إدارة المستخدمين
        EMPLOYEES: 'employees',                  // نظام الموظفين
        PAYROLL: 'payroll',                      // الرواتب والمستحقات
        ATTENDANCE: 'attendance',                // الحضور والانصراف
        LEAVES: 'leaves',                        // الإجازات
        DELEGATION: 'delegation',                // الانتداب وخارج الدوام
        AUDIT: 'audit',                          // السجلات والنسخ الاحتياطي
    },

    // الصلاحيات التفصيلية لكل دور
    PERMISSIONS: {
        // موظف تقنية المعلومات (IT) - إدارة المستخدمين فقط
        hr_sys_admin: {
            user_management: {
                view_users: true,
                create_user: true,
                edit_user: true,
                delete_user: true,
                change_password: true,
                link_employee: true,
            },
            employees: {
                view: true,
                create: false,
                edit: false,
                employee_card: false,
                salary_definition: false,
                clearance: false,
            },
            payroll: {
                create_payroll: false,
                reports: false,
                deduction_decision: false,
                allowance: false,
            },
            attendance: {
                daily_schedule: false,
                confirm_attendance: false,
                exceptions: false,
                reports: false,
            },
            leaves: {
                decision: false,
                compensatory: false,
                schedule: false,
                carryforward: false,
            },
            delegation: {
                external_allowance: false,
                overtime: false,
                reports: false,
            },
            audit: {
                activity_log: true,
                login_log: true,
                backup: true,
            },
        },

        // موظف موارد بشرية (كامل الصلاحيات)
        hr_officer_full: {
            user_management: {
                view_users: false,
                create_user: false,
                edit_user: false,
                delete_user: false,
                change_password: false,
                link_employee: false,
            },
            employees: {
                view: true,
                create: true,
                edit: true,
                employee_card: true,
                salary_definition: true,
                service_statement: true,
                clearance: true,
                account: true,
            },
            payroll: {
                create_payroll: true,
                reports: true,
                deduction_decision: true,
                allowance: true,
                export_file: true,
            },
            attendance: {
                daily_schedule: true,
                employee_attendance: true,
                confirm_attendance: true,
                work_periods: true,
                exceptions: true,
                reports: true,
            },
            leaves: {
                decision: true,
                compensatory: true,
                exceptions: true,
                schedule: true,
                carryforward: true,  // صلاحية كاملة
            },
            delegation: {
                external_allowance: true,
                overtime: true,
                reports: true,
            },
            audit: {
                activity_log: false,
                login_log: false,
                backup: false,
            },
        },

        // موظف موارد بشرية (البيانات الأساسية فقط)
        hr_officer_basic: {
            user_management: {
                view_users: false,
                create_user: false,
                edit_user: false,
                delete_user: false,
                change_password: false,
                link_employee: false,
            },
            employees: {
                view: true,
                create: true,
                edit: true,
                employee_card: 'view',  // عرض فقط
                salary_definition: false,
                service_statement: 'view',  // عرض فقط
                clearance: false,
                account: false,
            },
            payroll: {
                create_payroll: false,
                reports: false,
                deduction_decision: false,
                allowance: false,
            },
            attendance: {
                daily_schedule: false,
                employee_attendance: false,
                confirm_attendance: false,
                work_periods: false,
                exceptions: false,
                reports: false,
            },
            leaves: {
                decision: false,
                compensatory: false,
                exceptions: false,
                schedule: false,
                carryforward: false,
            },
            delegation: {
                external_allowance: false,
                overtime: false,
                reports: false,
            },
            audit: {
                activity_log: false,
                login_log: false,
                backup: false,
            },
        },

        // موظف متابعة الحضور
        hr_attendance: {
            user_management: {
                view_users: false,
                create_user: false,
                edit_user: false,
                delete_user: false,
                change_password: false,
                link_employee: false,
            },
            employees: {
                view: 'view',  // عرض بيانات أساسية فقط
                create: false,
                edit: false,
                employee_card: false,
                salary_definition: false,
            },
            payroll: {
                create_payroll: false,
                reports: false,
                deduction_decision: false,
                allowance: false,
            },
            attendance: {
                daily_schedule: true,
                employee_attendance: true,
                confirm_attendance: true,
                work_periods: 'view',
                exceptions: true,
                reports: true,
            },
            leaves: {
                decision: false,
                compensatory: false,
                exceptions: false,
                schedule: false,
                carryforward: false,
            },
            delegation: {
                external_allowance: false,
                overtime: 'view',  // عرض فقط
                reports: 'view',
            },
            audit: {
                activity_log: false,
                login_log: false,
                backup: false,
            },
        },

        // موظف متابعة الحضور والإجازات
        hr_att_vac: {
            user_management: {
                view_users: false,
                create_user: false,
                edit_user: false,
                delete_user: false,
                change_password: false,
                link_employee: false,
            },
            employees: {
                view: 'view',
                create: false,
                edit: false,
                employee_card: false,
                salary_definition: false,
            },
            payroll: {
                create_payroll: false,
                reports: false,
                deduction_decision: false,
                allowance: false,
            },
            attendance: {
                daily_schedule: true,
                employee_attendance: true,
                confirm_attendance: true,
                work_periods: 'view',
                exceptions: true,
                reports: true,
            },
            leaves: {
                decision: true,
                compensatory: true,
                exceptions: true,
                schedule: true,
                carryforward: 'special',  // يتطلب صلاحية خاصة إضافية
            },
            delegation: {
                external_allowance: false,
                overtime: false,
                reports: false,
            },
            audit: {
                activity_log: false,
                login_log: false,
                backup: false,
            },
        },

        // موظف مسير انتداب / خارج الدوام
        hr_overtime: {
            user_management: {
                view_users: false,
                create_user: false,
                edit_user: false,
                delete_user: false,
                change_password: false,
                link_employee: false,
            },
            employees: {
                view: 'view',
                create: false,
                edit: false,
                employee_card: false,
                salary_definition: false,
            },
            payroll: {
                create_payroll: false,
                reports: false,
                deduction_decision: false,
                allowance: false,
            },
            attendance: {
                daily_schedule: 'view',
                employee_attendance: false,
                confirm_attendance: false,
                work_periods: false,
                exceptions: false,
                reports: 'view',
            },
            leaves: {
                decision: false,
                compensatory: false,
                exceptions: false,
                schedule: false,
                carryforward: false,
            },
            delegation: {
                external_allowance: true,
                overtime: true,
                reports: 'view',
            },
            audit: {
                activity_log: false,
                login_log: false,
                backup: false,
            },
        },

        // مراقب الدوام (صلاحيات كاملة على الحضور + تعديل الأوقات + أوديت)
        attendance_monitor: {
            user_management: {
                view_users: false,
                create_user: false,
                edit_user: false,
                delete_user: false,
                change_password: false,
                link_employee: false,
            },
            employees: {
                view: 'view',
                create: false,
                edit: false,
                employee_card: false,
                salary_definition: false,
            },
            payroll: {
                create_payroll: false,
                reports: false,
                deduction_decision: 'view',
                allowance: false,
            },
            attendance: {
                daily_schedule: true,
                employee_attendance: true,
                confirm_attendance: true,
                work_periods: true,
                exceptions: true,
                reports: true,
                modify_times: true,
                bulk_modify: true,
                manage_excuses: true,
                view_audit: true,
                manage_settings: true,
                send_notifications: true,
                late_deductions: true,
            },
            leaves: {
                decision: false,
                compensatory: false,
                exceptions: 'view',
                schedule: 'view',
                carryforward: false,
            },
            delegation: {
                external_allowance: false,
                overtime: 'view',
                reports: 'view',
            },
            audit: {
                activity_log: 'view',
                login_log: false,
                backup: false,
            },
        },
    },

    // العمليات الحساسة التي تتطلب تسجيل في Audit
    SENSITIVE_OPERATIONS: {
        'user_management.change_password': { severity: 'critical', notify: true, auditRequired: true },
        'payroll.create_payroll': { severity: 'critical', notify: true, auditRequired: true },
        'payroll.deduction_decision': { severity: 'warning', notify: true, auditRequired: true },
        'payroll.allowance': { severity: 'warning', notify: true, auditRequired: true },
        'employees.salary_definition': { severity: 'critical', notify: true, auditRequired: true },
        'employees.clearance': { severity: 'warning', notify: true, auditRequired: true },
        'leaves.carryforward': { severity: 'warning', notify: true, auditRequired: true },
        'audit.backup': { severity: 'info', notify: false, auditRequired: true },
        'attendance.modify_times': { severity: 'warning', notify: true, auditRequired: true },
        'attendance.bulk_modify': { severity: 'critical', notify: true, auditRequired: true },
        'attendance.manage_settings': { severity: 'warning', notify: true, auditRequired: true },
    },
};

/**
 * التحقق من صلاحية HR محددة
 * @param {string} role دور المستخدم
 * @param {string} category فئة الصلاحية
 * @param {string} permission الصلاحية المطلوبة
 * @returns {boolean|'view'|'special'} الصلاحية
 */
export function checkHRPermission(role, category, permission) {
    const rolePermissions = HR_PERMISSIONS_MATRIX.PERMISSIONS[role];
    if (!rolePermissions) return false;

    const categoryPermissions = rolePermissions[category];
    if (!categoryPermissions) return false;

    return categoryPermissions[permission] || false;
}

/**
 * التحقق مما إذا كانت العملية حساسة
 * @param {string} operation مسار العملية (category.permission)
 * @returns {object|null} تفاصيل العملية الحساسة
 */
export function getSensitiveOperationConfig(operation) {
    return HR_PERMISSIONS_MATRIX.SENSITIVE_OPERATIONS[operation] || null;
}

/**
 * الحصول على جميع صلاحيات دور معين
 * @param {string} role دور المستخدم
 * @returns {object} جميع الصلاحيات
 */
export function getHRRolePermissions(role) {
    return HR_PERMISSIONS_MATRIX.PERMISSIONS[role] || {};
}

// تعريف الأدوار الموحدة (Unified Roles)
export const ROLES = {
    SUPER_ADMIN: 'super_admin',

    // IT Roles (تقنية المعلومات)
    IT_DIRECTOR: 'it_director',                      // مدير تقنية المعلومات - صلاحيات كاملة ما عدا SaaS/Agents
    IT_MANAGER: 'it_manager',                        // مدير الدعم الفني
    IT_SPECIALIST: 'it_specialist',                  // أخصائي دعم فني
    IT_HELPDESK: 'it_helpdesk',                      // موظف مكتب المساعدة

    // HR Roles (الموارد البشرية)
    HR_DIRECTOR: 'hr_director',                      // مدير الموارد البشرية
    HR_MANAGER: 'hr_manager',
    HR_EMPLOYEE: 'hr_employee',
    ATTENDANCE_SUPERVISOR: 'attendance_supervisor',
    ATTENDANCE_MONITOR: 'attendance_monitor',  // مراقب الدوام - صلاحيات كاملة للحضور

    // أدوار HR المتخصصة (مصفوفة الصلاحيات)
    HR_SYS_ADMIN: 'hr_sys_admin',                    // موظف تقنية المعلومات - إدارة المستخدمين والسجلات
    HR_OFFICER_FULL: 'hr_officer_full',              // موظف موارد بشرية (كامل الصلاحيات)
    HR_OFFICER_BASIC: 'hr_officer_basic',            // موظف موارد بشرية (البيانات الأساسية فقط)
    HR_ATTENDANCE: 'hr_attendance',                  // موظف متابعة الحضور
    HR_ATT_VAC: 'hr_att_vac',                        // موظف متابعة الحضور والإجازات
    HR_OVERTIME: 'hr_overtime',                      // موظف مسير انتداب / خارج الدوام

    // أدوار HR إضافية
    DELEGATION_COORDINATOR: 'delegation_coordinator', // منسق الانتدابات
    LEAVE_OFFICER: 'leave_officer',                  // موظف متابعة إجازات
    SICK_LEAVE_SPECIALIST: 'sick_leave_specialist',  // مختص إجازات مرضية
    DECISION_ISSUER: 'decision_issuer',              // موظف إصدار القرارات

    // Warehouse Roles (أدوار المستودعات)
    WAREHOUSE_DIRECTOR: 'warehouse_director',        // مدير المستودعات - كامل ما عدا محاضر الجرد
    WAREHOUSE_ADMIN: 'warehouse_admin',              // مدير المستودعات العام
    HEAD_WAREHOUSE: 'head_warehouse',                // مدير المستودع (LinkId: 2)
    SECURITY_WAREHOUSE: 'security_warehouse',        // أمين المستودع (LinkId: 3)
    WAREHOUSE_KEEPER: 'warehouse_keeper',            // أمين مستودع (محدود بالمستودعات المسندة)
    RECEIVING_OFFICER: 'receiving_officer',          // مأمور ساحة الاستلام
    INVENTORY_CONTROLLER: 'inventory_controller',    // مراقب المخزون (محاضر جرد + تسويات + سنة مالية)
    INVENTORY_AUDITOR: 'inventory_auditor',          // مراقب المخزون (LinkId: 4) - للتوافق
    PUBLIC_SERVICES: 'public_services',              // مدير الخدمات العامة (LinkId: 6)
    MUNICIPALITY_MANAGER: 'municipality_manager',    // رئيس البلدية (LinkId: 1)

    // Archiving Roles
    ARCHIVE_ADMIN: 'archive_admin',
    ARCHIVE_CLERK: 'archive_clerk',

    // Fleet Roles
    FLEET_MANAGER: 'fleet_manager',
    DRIVER: 'driver',

    // Finance/Sadad Roles
    FINANCE_ADMIN: 'finance_admin',

    // Finance Module Roles (الإدارة المالية)
    FINANCE_DIRECTOR: 'finance_director',           // مدير الإدارة المالية
    ACCOUNTING_MANAGER: 'accounting_manager',       // مدير المحاسبة
    ACCOUNTANT: 'accountant',                       // محاسب
    BUDGET_MANAGER: 'budget_manager',               // مدير الميزانية
    PROCUREMENT_MANAGER: 'procurement_manager',     // مدير المشتريات
    PROCUREMENT_OFFICER: 'procurement_officer',     // موظف مشتريات
    TREASURER: 'treasurer',                         // أمين الخزينة
    INTERNAL_AUDITOR: 'internal_auditor',           // المراجع الداخلي
    INTERNAL_AUDIT_MANAGER: 'internal_audit_manager', // مدير المراجعة الداخلية

    // EPM Roles
    EPM_ADMIN: 'epm_admin',
    EPM_MANAGER: 'epm_manager',
    EPM_VIEWER: 'epm_viewer',

    // ITSM Roles (الدعم الفني)
    IT_MANAGER: 'it_manager',           // مدير الدعم الفني
    IT_SPECIALIST: 'it_specialist',     // أخصائي دعم فني
    IT_HELPDESK: 'it_helpdesk',         // موظف مكتب المساعدة

    // Projects Roles (إدارة المشاريع)
    PROJECT_ADMIN: 'project_admin',         // مدير إدارة المشاريع
    PROJECT_MANAGER: 'project_manager',     // مدير مشروع
    PROJECT_TEAM_LEAD: 'project_team_lead', // قائد فريق
    PROJECT_MEMBER: 'project_member',       // عضو فريق

    // Analytics Roles (التحليلات)
    ANALYTICS_MANAGER: 'analytics_manager',

    // General
    EMPLOYEE: 'employee',

    // Department Head (رئيس القسم) - للاعتمادات
    DEPARTMENT_HEAD: 'department_head',

    // Authority Roles (صلاحيات إدارية)
    AUTHORITY_HOLDER: 'authority_holder',         // صاحب الصلاحية / رئيس الجهة
    DEPUTY_AUTHORITY: 'deputy_authority',         // نائب صاحب الصلاحية
    SECTION_HEAD: 'section_head',                // رئيس قسم
    UNIT_HEAD: 'unit_head',                      // رئيس وحدة
};

// ==================== صلاحيات اعتماد طلبات الصرف ====================
export const EXCHANGE_APPROVAL_PERMISSIONS = {
    // المستوى 1: منشئ الطلب (تقديم فقط)
    LEVEL_1_CREATOR: {
        level: 1,
        key: 'Creator',
        field: 'Creator_Submitted',
        title: 'منشئ الطلب',
        titleEn: 'Request Creator',
        icon: '📝',
        roles: [ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD, ROLES.HR_MANAGER, ROLES.SUPER_ADMIN, ROLES.IT_DIRECTOR],
        permission: 'warehouse.exchange.submit',
        actions: ['submit']
    },
    // المستوى 2: مدير منشئ الطلب
    LEVEL_2_CREATOR_MANAGER: {
        level: 2,
        key: 'CreatorManager',
        field: 'CreatorManager_Approved',
        title: 'مدير منشئ الطلب',
        titleEn: 'Creator Manager',
        icon: '👤',
        roles: [ROLES.DEPARTMENT_HEAD, ROLES.HR_MANAGER, ROLES.SUPER_ADMIN, ROLES.IT_DIRECTOR],
        permission: 'warehouse.exchange.approve.level2',
        actions: ['approve', 'reject']
    },
    // المستوى 3: صاحب الصلاحية
    LEVEL_3_AUTHORITY_HOLDER: {
        level: 3,
        key: 'AuthorityHolder',
        field: 'AuthorityHolder_Approved',
        title: 'صاحب الصلاحية',
        titleEn: 'Authority Holder',
        icon: '🏛️',
        roles: [ROLES.MUNICIPALITY_MANAGER, ROLES.SUPER_ADMIN, ROLES.IT_DIRECTOR],
        permission: 'warehouse.exchange.approve.level3',
        actions: ['approve', 'reject']
    },
    // المستوى 4: مدير المستودعات (يمكنه تعديل الأصناف والكميات)
    LEVEL_4_WAREHOUSE_MANAGER: {
        level: 4,
        key: 'WarehouseManager',
        field: 'WarehouseManager_Approved',
        title: 'مدير المستودعات',
        titleEn: 'Warehouse Manager',
        icon: '🏪',
        roles: [ROLES.HEAD_WAREHOUSE, ROLES.WAREHOUSE_DIRECTOR, ROLES.WAREHOUSE_ADMIN, ROLES.SUPER_ADMIN, ROLES.IT_DIRECTOR],
        permission: 'warehouse.exchange.approve.level4',
        actions: ['approve', 'reject', 'edit_items']
    },
    // المستوى 5: أمين المستودع المستلم
    LEVEL_5_WAREHOUSE_KEEPER: {
        level: 5,
        key: 'WarehouseKeeper',
        field: 'WarehouseKeeper_Approved',
        title: 'أمين المستودع المستلم',
        titleEn: 'Receiving Warehouse Keeper',
        icon: '📦',
        roles: [ROLES.SECURITY_WAREHOUSE, ROLES.WAREHOUSE_KEEPER, ROLES.SUPER_ADMIN, ROLES.IT_DIRECTOR],
        permission: 'warehouse.exchange.approve.level5',
        actions: ['approve', 'reject'],
        validateStock: true
    },
    // المستوى 6: مراقب المخزون (الاعتماد النهائي - خصم من المخزون)
    LEVEL_6_INVENTORY_CONTROLLER: {
        level: 6,
        key: 'InventoryController',
        field: 'InventoryController_Approved',
        title: 'مراقب المخزون',
        titleEn: 'Inventory Controller',
        icon: '📊',
        roles: [ROLES.INVENTORY_CONTROLLER, ROLES.INVENTORY_AUDITOR, ROLES.SUPER_ADMIN, ROLES.IT_DIRECTOR],
        permission: 'warehouse.exchange.approve.level6',
        actions: ['finalize', 'reject'],
        isFinal: true,
        deductsInventory: true
    }
};

/**
 * الحصول على مستوى الاعتماد المتاح للمستخدم
 * @param {Array} userRoles أدوار المستخدم
 * @returns {Array} مستويات الاعتماد المتاحة
 */
export function getUserApprovalLevels(userRoles) {
    if (!userRoles || !Array.isArray(userRoles)) return [];

    const availableLevels = [];

    Object.values(EXCHANGE_APPROVAL_PERMISSIONS).forEach(level => {
        if (userRoles.some(role => level.roles.includes(role))) {
            availableLevels.push(level);
        }
    });

    return availableLevels.sort((a, b) => a.level - b.level);
}

/**
 * التحقق من صلاحية الاعتماد على مستوى معين
 * @param {Array} userRoles أدوار المستخدم
 * @param {Number} level مستوى الاعتماد (1-6)
 * @returns {Boolean}
 */
export function canApproveAtLevel(userRoles, level) {
    if (!userRoles || !Array.isArray(userRoles)) return false;

    const levelKey = `LEVEL_${level}_${['CREATOR', 'CREATOR_MANAGER', 'AUTHORITY_HOLDER', 'WAREHOUSE_MANAGER', 'WAREHOUSE_KEEPER', 'INVENTORY_CONTROLLER'][level - 1]}`;
    const levelConfig = EXCHANGE_APPROVAL_PERMISSIONS[levelKey];

    if (!levelConfig) return false;

    return userRoles.some(role => levelConfig.roles.includes(role));
}

/**
 * الحصول على المستوى الحالي للاعتماد للطلب
 * @param {Object} request طلب الصرف
 * @returns {Object|null} معلومات المستوى الحالي
 */
export function getCurrentApprovalLevel(request) {
    const levels = Object.values(EXCHANGE_APPROVAL_PERMISSIONS);

    for (const level of levels) {
        if (!request[level.field]) {
            return level;
        }
    }

    return null; // تم الاعتماد بالكامل
}

// تعريف الأنظمة للعرض (Metadata)
export const SYSTEM_DEFINITIONS = {
    [SYSTEMS.HR]: {
        id: SYSTEMS.HR,
        nameAr: 'الموارد البشرية',
        nameEn: 'Human Resources',
        icon: '👥',
        color: '#3b82f6',
        path: '/hr',
        description: 'إدارة الموظفين والحضور والإجازات',
        roles: [ROLES.SUPER_ADMIN, ROLES.IT_DIRECTOR, ROLES.HR_DIRECTOR, ROLES.HR_MANAGER, ROLES.HR_EMPLOYEE, ROLES.ATTENDANCE_SUPERVISOR, ROLES.ATTENDANCE_MONITOR, ROLES.EPM_ADMIN]
    },
    [SYSTEMS.WAREHOUSE]: {
        id: SYSTEMS.WAREHOUSE,
        nameAr: 'المستودعات',
        nameEn: 'Warehouse',
        icon: '📦',
        color: '#10b981',
        path: '/warehouse',
        description: 'إدارة المخزون والعهد والصرف والاستلام',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.IT_DIRECTOR,           // مدير تقنية المعلومات
            ROLES.WAREHOUSE_DIRECTOR,    // مدير المستودعات
            ROLES.WAREHOUSE_ADMIN,
            ROLES.HEAD_WAREHOUSE,
            ROLES.SECURITY_WAREHOUSE,
            ROLES.WAREHOUSE_KEEPER,      // أمين المستودع
            ROLES.RECEIVING_OFFICER,     // مأمور ساحة الاستلام
            ROLES.INVENTORY_CONTROLLER,  // مراقب المخزون (الجديد)
            ROLES.INVENTORY_AUDITOR,
            ROLES.PUBLIC_SERVICES,
            ROLES.MUNICIPALITY_MANAGER,
            ROLES.DEPARTMENT_HEAD        // رئيس القسم - للاعتمادات
        ]
    },
    [SYSTEMS.ARCHIVING]: {
        id: SYSTEMS.ARCHIVING,
        nameAr: 'الأرشفة الذكية',
        nameEn: 'Archiving',
        icon: '📂',
        color: '#f59e0b',
        path: '/archiving',
        description: 'إدارة الوثائق والمعاملات',
        roles: [ROLES.SUPER_ADMIN, ROLES.ARCHIVE_ADMIN, ROLES.ARCHIVE_CLERK, ROLES.HR_MANAGER, ROLES.WAREHOUSE_ADMIN]
    },
    [SYSTEMS.EPM]: {
        id: SYSTEMS.EPM,
        nameAr: 'قياس الأداء',
        nameEn: 'Performance',
        icon: '🎯',
        color: '#8b5cf6',
        path: '/epm',
        description: 'تقييم أداء الموظفين',
        roles: [ROLES.SUPER_ADMIN, ROLES.HR_MANAGER, ROLES.EPM_ADMIN, ROLES.EPM_VIEWER]
    },
    [SYSTEMS.MOVEMENT]: {
        id: SYSTEMS.MOVEMENT,
        nameAr: 'حركة الأسطول',
        nameEn: 'Fleet',
        icon: '🚗',
        color: '#06b6d4',
        path: '/movement',
        description: 'إدارة السيارات والرحلات',
        roles: [ROLES.SUPER_ADMIN, ROLES.FLEET_MANAGER, ROLES.DRIVER]
    },
    [SYSTEMS.SADAD]: {
        id: SYSTEMS.SADAD,
        nameAr: 'سداد',
        nameEn: 'Payments',
        icon: '💳',
        color: '#ec4899',
        path: '/sadad',
        description: 'الفواتير والمدفوعات',
        roles: [ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN]
    },
    [SYSTEMS.ANALYTICS]: {
        id: SYSTEMS.ANALYTICS,
        nameAr: 'التحليلات',
        nameEn: 'Analytics',
        icon: '📊',
        color: '#6366f1',
        path: '/analytics',
        description: 'تقارير وتحليلات متقدمة',
        roles: [ROLES.SUPER_ADMIN, ROLES.IT_DIRECTOR, ROLES.HR_DIRECTOR, ROLES.HR_MANAGER, ROLES.FINANCE_DIRECTOR, ROLES.FINANCE_ADMIN, ROLES.WAREHOUSE_DIRECTOR]
    },
    [SYSTEMS.FINANCE]: {
        id: SYSTEMS.FINANCE,
        nameAr: 'الإدارة المالية',
        nameEn: 'Finance Management',
        icon: '💰',
        color: '#059669',
        path: '/finance',
        description: 'الأستاذ العام والموازنة والذمم والمشتريات والخزينة',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.IT_DIRECTOR,           // مدير تقنية المعلومات
            ROLES.FINANCE_DIRECTOR,      // المدير المالي - صلاحيات كاملة
            ROLES.ACCOUNTING_MANAGER,
            ROLES.ACCOUNTANT,
            ROLES.BUDGET_MANAGER,
            ROLES.PROCUREMENT_MANAGER,
            ROLES.PROCUREMENT_OFFICER,
            ROLES.TREASURER,
            ROLES.INTERNAL_AUDITOR,
            ROLES.FINANCE_ADMIN
        ]
    },
    [SYSTEMS.ITSM]: {
        id: SYSTEMS.ITSM,
        nameAr: 'الدعم الفني',
        nameEn: 'IT Service Management',
        icon: '🛠️',
        color: '#f59e0b',
        path: '/itsm',
        description: 'إدارة التذاكر والأصول والدعم الفني',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.IT_MANAGER,
            ROLES.IT_SPECIALIST,
            ROLES.IT_HELPDESK
        ],
        // جميع الموظفين يمكنهم إنشاء طلبات دعم فني
        allowAllEmployees: true
    },
    [SYSTEMS.PROJECTS]: {
        id: SYSTEMS.PROJECTS,
        nameAr: 'إدارة المشاريع',
        nameEn: 'Project Management',
        icon: '📋',
        color: '#7c3aed',
        path: '/projects',
        description: 'إدارة المشاريع والمهام والفرق',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.PROJECT_ADMIN,
            ROLES.PROJECT_MANAGER,
            ROLES.PROJECT_TEAM_LEAD,
            ROLES.PROJECT_MEMBER
        ],
        // جميع الموظفين يمكنهم عرض المشاريع التي يشاركون فيها
        allowAllEmployees: true
    },
    [SYSTEMS.GRC]: {
        id: SYSTEMS.GRC,
        nameAr: 'الحوكمة والمخاطر',
        nameEn: 'GRC',
        icon: '🛡️',
        color: '#dc2626',
        path: '/grc',
        description: 'الحوكمة وإدارة المخاطر والامتثال',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.IT_DIRECTOR,
            ROLES.INTERNAL_AUDITOR,
            ROLES.FINANCE_DIRECTOR,
            ROLES.HR_DIRECTOR
        ]
    },
    [SYSTEMS.DECLARATIONS]: {
        id: SYSTEMS.DECLARATIONS,
        nameAr: 'الإقرارات',
        nameEn: 'Declarations',
        icon: '📋',
        color: '#7c3aed',
        path: '/declarations',
        description: 'إدارة الإقرارات الوظيفية والامتثال',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.IT_DIRECTOR,
            ROLES.HR_DIRECTOR,
            ROLES.HR_MANAGER,
            ROLES.INTERNAL_AUDITOR,
            ROLES.INTERNAL_AUDIT_MANAGER
        ]
    },
};

/**
 * دالة تعيين الصلاحيات القديمة (Legacy ClientRoles) إلى أداور موحدة
 * @param {Object} legacyRoles كائن يحتوي على الحقول القديمة مثل HasCustody, AccountType
 * @returns {Array} مصفوفة بالأدوار الموحدة
 */
export function mapLegacyToUnified(legacyRoles) {
    const roles = new Set();

    // Always add basic employee role
    roles.add(ROLES.EMPLOYEE);

    if (!legacyRoles) return Array.from(roles);

    // 1. Admin Mapping
    if (legacyRoles.AccountType === 'Admin' || legacyRoles.UserRoll === 'Admin') {
        roles.add(ROLES.SUPER_ADMIN);
        return [ROLES.SUPER_ADMIN, ROLES.EMPLOYEE];
    }

    // 2. Warehouse Mapping (تحويل صلاحيات المستودعات)
    // LinkId = 2: مدير المستودع
    if (legacyRoles.LinkId === 2 || legacyRoles.IsHeadWarehouse === "1") {
        roles.add(ROLES.HEAD_WAREHOUSE);
        roles.add(ROLES.WAREHOUSE_ADMIN);
    }
    // LinkId = 3: أمين المستودع
    if (legacyRoles.LinkId === 3 || legacyRoles.IsSecurityWarehouse === "1") {
        roles.add(ROLES.SECURITY_WAREHOUSE);
        roles.add(ROLES.WAREHOUSE_KEEPER);
    }
    // LinkId = 4: مراقب المخزون
    if (legacyRoles.LinkId === 4 || legacyRoles.IsInventoryAuditor === "1" || legacyRoles.Authorized === "1") {
        roles.add(ROLES.INVENTORY_AUDITOR);
    }
    // LinkId = 6: مدير الخدمات العامة
    if (legacyRoles.LinkId === 6 || legacyRoles.IsPublicServices === "1") {
        roles.add(ROLES.PUBLIC_SERVICES);
    }
    // LinkId = 1: رئيس البلدية
    if (legacyRoles.LinkId === 1 || legacyRoles.IsMunicipalityManager === "1") {
        roles.add(ROLES.MUNICIPALITY_MANAGER);
    }
    // Legacy warehouse keeper
    if (legacyRoles.HasCustody === "1" || legacyRoles.Custody > 0) {
        roles.add(ROLES.WAREHOUSE_KEEPER);
    }
    if (legacyRoles.Reports === 1 || legacyRoles.Balance === 1) {
        roles.add(ROLES.WAREHOUSE_ADMIN);
    }

    // 3. Finance/SADAD Mapping
    if (legacyRoles.HasFinancialCustody === "1" || legacyRoles.Exchange > 0) {
        roles.add(ROLES.FINANCE_ADMIN);
    }

    // 4. HR Mapping
    if (legacyRoles.profile_name && legacyRoles.profile_name.includes("موارد")) {
        roles.add(ROLES.HR_MANAGER);
    } else if (legacyRoles.HasProManagment === "1") {
        roles.add(ROLES.HR_EMPLOYEE);
    }

    // 5. Fleet Mapping
    if (legacyRoles.SystemRoll === "Fleet" || legacyRoles.Areas > 0) {
        roles.add(ROLES.FLEET_MANAGER);
    }

    // 6. Finance Module Mapping
    if (legacyRoles.IsFinanceDirector === "1") {
        roles.add(ROLES.FINANCE_DIRECTOR);
        roles.add(ROLES.FINANCE_ADMIN);
    }
    if (legacyRoles.IsAccountingManager === "1") {
        roles.add(ROLES.ACCOUNTING_MANAGER);
    }
    if (legacyRoles.IsAccountant === "1") {
        roles.add(ROLES.ACCOUNTANT);
    }
    if (legacyRoles.IsBudgetManager === "1") {
        roles.add(ROLES.BUDGET_MANAGER);
    }
    if (legacyRoles.IsProcurementManager === "1") {
        roles.add(ROLES.PROCUREMENT_MANAGER);
    }
    if (legacyRoles.IsProcurementOfficer === "1") {
        roles.add(ROLES.PROCUREMENT_OFFICER);
    }
    if (legacyRoles.IsTreasurer === "1") {
        roles.add(ROLES.TREASURER);
    }
    if (legacyRoles.IsInternalAuditor === "1") {
        roles.add(ROLES.INTERNAL_AUDITOR);
    }

    // 7. ITSM Mapping (الدعم الفني)
    if (legacyRoles.IsITManager === "1" || legacyRoles.ITRole === "Manager") {
        roles.add(ROLES.IT_MANAGER);
    }
    if (legacyRoles.IsITSpecialist === "1" || legacyRoles.ITRole === "Specialist") {
        roles.add(ROLES.IT_SPECIALIST);
    }
    if (legacyRoles.IsITHelpdesk === "1" || legacyRoles.ITRole === "Helpdesk") {
        roles.add(ROLES.IT_HELPDESK);
    }

    // 8. Attendance Supervisor Mapping (مراقب الدوام)
    if (legacyRoles.IsAttendanceSupervisor === "1" || legacyRoles.AttendanceRole === "Supervisor") {
        roles.add(ROLES.ATTENDANCE_SUPERVISOR);
    }

    // 8b. Attendance Monitor Mapping (مراقب الدوام بصلاحيات كاملة)
    if (legacyRoles.IsAttendanceMonitor === "1" || legacyRoles.AttendanceRole === "Monitor") {
        roles.add(ROLES.ATTENDANCE_MONITOR);
    }

    // 9. Department Head Mapping (رئيس القسم)
    if (legacyRoles.IsDepartmentHead === "1" || legacyRoles.DepartmentRole === "Head") {
        roles.add(ROLES.DEPARTMENT_HEAD);
    }

    // 10. IT Director Mapping (مدير تقنية المعلومات)
    if (legacyRoles.IsITDirector === "1" || legacyRoles.ITRole === "Director") {
        roles.add(ROLES.IT_DIRECTOR);
    }

    // 11. HR Director Mapping (مدير الموارد البشرية)
    if (legacyRoles.IsHRDirector === "1" || legacyRoles.HRRole === "Director") {
        roles.add(ROLES.HR_DIRECTOR);
    }

    // 12. Warehouse Director Mapping (مدير المستودعات)
    if (legacyRoles.IsWarehouseDirector === "1" || legacyRoles.WarehouseRole === "Director") {
        roles.add(ROLES.WAREHOUSE_DIRECTOR);
    }

    // 13. Receiving Officer Mapping (مأمور ساحة الاستلام)
    if (legacyRoles.IsReceivingOfficer === "1" || legacyRoles.WarehouseRole === "ReceivingOfficer") {
        roles.add(ROLES.RECEIVING_OFFICER);
    }

    // 14. Inventory Controller Mapping (مراقب المخزون - الجديد)
    if (legacyRoles.IsInventoryController === "1" || legacyRoles.WarehouseRole === "InventoryController") {
        roles.add(ROLES.INVENTORY_CONTROLLER);
    }

    // 15. Fleet Manager Mapping (مدير الحركة)
    if (legacyRoles.IsFleetManager === "1" || legacyRoles.FleetRole === "Manager") {
        roles.add(ROLES.FLEET_MANAGER);
    }

    // 16. Archive Admin Mapping (مدير الأرشفة)
    if (legacyRoles.IsArchiveAdmin === "1" || legacyRoles.ArchiveRole === "Admin") {
        roles.add(ROLES.ARCHIVE_ADMIN);
    }

    // 17. Project Admin Mapping (مدير المشاريع)
    if (legacyRoles.IsProjectAdmin === "1" || legacyRoles.ProjectRole === "Admin") {
        roles.add(ROLES.PROJECT_ADMIN);
    }

    // 18. Project Manager Mapping (مدير مشروع)
    if (legacyRoles.IsProjectManager === "1" || legacyRoles.ProjectRole === "Manager") {
        roles.add(ROLES.PROJECT_MANAGER);
    }

    // 19. Warehouse Admin Mapping (مدير المستودع)
    if (legacyRoles.IsWarehouseAdmin === "1" || legacyRoles.WarehouseRole === "Admin") {
        roles.add(ROLES.WAREHOUSE_ADMIN);
    }

    // 20. EPM Manager Mapping (مدير الأداء)
    if (legacyRoles.IsEPMManager === "1" || legacyRoles.EPMRole === "Manager") {
        roles.add(ROLES.EPM_MANAGER);
    }

    // 21. Analytics Manager Mapping (مدير التحليلات)
    if (legacyRoles.IsAnalyticsManager === "1" || legacyRoles.AnalyticsRole === "Manager") {
        roles.add(ROLES.ANALYTICS_MANAGER);
    }

    // ===========================================
    // أدوار HR المتخصصة (مصفوفة الصلاحيات)
    // ===========================================

    // 22. HR SYS ADMIN (موظف تقنية المعلومات)
    if (legacyRoles.IsHRSysAdmin === "1" || legacyRoles.HRRole === "SysAdmin") {
        roles.add(ROLES.HR_SYS_ADMIN);
    }

    // 23. HR Officer Full (موظف موارد بشرية كامل)
    if (legacyRoles.IsHROfficerFull === "1" || legacyRoles.HRRole === "OfficerFull") {
        roles.add(ROLES.HR_OFFICER_FULL);
    }

    // 24. HR Officer Basic (موظف موارد بشرية أساسي)
    if (legacyRoles.IsHROfficerBasic === "1" || legacyRoles.HRRole === "OfficerBasic") {
        roles.add(ROLES.HR_OFFICER_BASIC);
    }

    // 25. HR Attendance (موظف متابعة الحضور)
    if (legacyRoles.IsHRAttendance === "1" || legacyRoles.HRRole === "Attendance") {
        roles.add(ROLES.HR_ATTENDANCE);
    }

    // 26. HR Attendance + Vacation (موظف متابعة الحضور والإجازات)
    if (legacyRoles.IsHRAttVac === "1" || legacyRoles.HRRole === "AttVac") {
        roles.add(ROLES.HR_ATT_VAC);
    }

    // 27. HR Overtime (موظف مسير انتداب / خارج الدوام)
    if (legacyRoles.IsHROvertime === "1" || legacyRoles.HRRole === "Overtime") {
        roles.add(ROLES.HR_OVERTIME);
    }

    // 28. Delegation Coordinator (منسق الانتدابات)
    if (legacyRoles.IsDelegationCoordinator === "1") {
        roles.add(ROLES.DELEGATION_COORDINATOR);
    }

    // 29. Leave Officer (موظف متابعة إجازات)
    if (legacyRoles.IsLeaveOfficer === "1") {
        roles.add(ROLES.LEAVE_OFFICER);
    }

    // 30. Sick Leave Specialist (مختص إجازات مرضية)
    if (legacyRoles.IsSickLeaveSpecialist === "1") {
        roles.add(ROLES.SICK_LEAVE_SPECIALIST);
    }

    // 31. Decision Issuer (موظف إصدار القرارات)
    if (legacyRoles.IsDecisionIssuer === "1") {
        roles.add(ROLES.DECISION_ISSUER);
    }

    return Array.from(roles);
}

/**
 * التحقق مما إذا كان المستخدم يملك صلاحية الوصول للنظام
 * @param {Array} userRoles أدوار المستخدم
 * @param {string} systemId معرف النظام
 * @param {number|string|null} tenantId معرف المستأجر (اختياري)
 */
export function canAccessSystem(userRoles, systemId, tenantId = null) {
    if (!userRoles || !Array.isArray(userRoles)) return false;

    const isSuperAdmin = userRoles.includes(ROLES.SUPER_ADMIN);

    // فحص إعدادات المستأجر (الأدمن يتجاوز)
    if (tenantId) {
        try {
            const { isTenantModuleEnabled } = require('./tenant-modules');
            if (!isTenantModuleEnabled(tenantId, systemId, isSuperAdmin)) return false;
        } catch (_) { /* tenant-modules not available */ }
    }

    if (isSuperAdmin) return true;

    const systemDef = SYSTEM_DEFINITIONS[systemId];
    if (!systemDef) return false;

    // Check intersection between userRoles and systemDef.roles
    return userRoles.some(role => systemDef.roles.includes(role));
}

/**
 * الحصول على الأنظمة المتاحة للمستخدم
 * @param {Array} userRoles أدوار المستخدم
 * @param {number|string|null} tenantId معرف المستأجر (اختياري)
 */
export function getSystemsForDisplay(userRoles, tenantId = null) {
    return Object.values(SYSTEM_DEFINITIONS).filter(sys => canAccessSystem(userRoles, sys.id, tenantId));
}

/**
 * التحقق من صلاحية الوصول للموارد البشرية على مستوى الإدارة
 * @param {Array} userRoles أدوار المستخدم
 * @returns {Boolean} true إذا كان للمستخدم صلاحية محدودة على الموارد البشرية
 */
export function hasDepartmentLevelHRAccess(userRoles) {
    if (!userRoles || !Array.isArray(userRoles)) return false;
    // Super admin له صلاحية كاملة
    if (userRoles.includes(ROLES.SUPER_ADMIN)) return false;
    // HR roles لها صلاحية كاملة
    if (userRoles.some(r => [ROLES.HR_DIRECTOR, ROLES.HR_MANAGER, ROLES.HR_EMPLOYEE].includes(r))) return false;
    // تحقق من الأدوار ذات الصلاحية المحدودة
    return userRoles.some(role => DEPARTMENT_HR_ACCESS.DEPARTMENT_MANAGERS.includes(role));
}

/**
 * استخراج نطاق المستخدم بناءً على دوره ومعرفاته
 * يُستخدم لتحديد ما يراه المستخدم في صفحات الموظفين والهيكل
 * @param {object} session - بيانات الجلسة (session.user)
 * @returns {object|null} - { type, id, label } أو null لصلاحية كاملة
 */
export function getUserScope(session) {
    if (!session?.user) return null;
    const { roles, role, departmentId, sectionId, unitId, isAuthorityHolder } = session.user;
    const userRoles = roles || (role ? [role] : []);

    // Super admin / HR Director / Authority Holder = صلاحية كاملة
    if (userRoles.includes(ROLES.SUPER_ADMIN) || userRoles.includes(ROLES.HR_DIRECTOR) || userRoles.includes(ROLES.HR_MANAGER)) {
        return null;
    }
    if (isAuthorityHolder || userRoles.includes(ROLES.AUTHORITY_HOLDER)) {
        return null;
    }

    // مدير إدارة → يرى إدارته فقط
    if (userRoles.includes(ROLES.DEPARTMENT_HEAD) || userRoles.some(r => ['warehouse_admin', 'head_warehouse', 'fleet_manager', 'archive_admin'].includes(r))) {
        if (departmentId) {
            return { type: 'department', id: departmentId, label: 'إدارة' };
        }
    }

    // رئيس قسم → يرى قسمه فقط
    if (userRoles.includes(ROLES.SECTION_HEAD)) {
        if (sectionId) {
            return { type: 'section', id: sectionId, departmentId, label: 'قسم' };
        }
    }

    // رئيس وحدة → يرى وحدته فقط
    if (userRoles.includes(ROLES.UNIT_HEAD)) {
        if (unitId) {
            return { type: 'unit', id: unitId, sectionId, departmentId, label: 'وحدة' };
        }
    }

    // أدوار أخرى ذات صلاحية محدودة بالإدارة
    if (hasDepartmentLevelHRAccess(userRoles) && departmentId) {
        return { type: 'department', id: departmentId, label: 'إدارة' };
    }

    return null;
}

/**
 * هل المستخدم صاحب صلاحية أو نائبه
 * @param {object} session - بيانات الجلسة
 * @returns {boolean}
 */
export function isAuthorityUser(session) {
    if (!session?.user) return false;
    const { roles, role, isAuthorityHolder, isDeputyAuthority } = session.user;
    const userRoles = roles || (role ? [role] : []);
    return isAuthorityHolder || isDeputyAuthority ||
        userRoles.includes(ROLES.AUTHORITY_HOLDER) ||
        userRoles.includes(ROLES.DEPUTY_AUTHORITY);
}

/**
 * التحقق من صلاحية الوصول لصفحة HR معينة
 * @param {Array} userRoles أدوار المستخدم
 * @param {String} path مسار الصفحة
 * @returns {Boolean}
 */
export function canAccessHRPage(userRoles, path) {
    if (!userRoles || !Array.isArray(userRoles)) return false;
    // Super admin و HR roles لهم صلاحية كاملة
    if (userRoles.includes(ROLES.SUPER_ADMIN)) return true;
    if (userRoles.some(r => [ROLES.HR_DIRECTOR, ROLES.HR_MANAGER, ROLES.HR_EMPLOYEE, ROLES.IT_DIRECTOR].includes(r))) return true;
    // صاحب الصلاحية / نائبه — صلاحيات واسعة
    if (userRoles.includes(ROLES.AUTHORITY_HOLDER) || userRoles.includes(ROLES.DEPUTY_AUTHORITY)) {
        return DEPARTMENT_HR_ACCESS.AUTHORITY_PAGES.some(allowedPath => path.startsWith(allowedPath));
    }
    // تحقق من الأدوار ذات الصلاحية المحدودة
    if (hasDepartmentLevelHRAccess(userRoles)) {
        return DEPARTMENT_HR_ACCESS.ALLOWED_HR_PAGES.some(allowedPath => path.startsWith(allowedPath));
    }
    return false;
}

/**
 * الحصول على قائمة صفحات HR المسموحة للمستخدم
 * @param {Array} userRoles أدوار المستخدم
 * @returns {Array} قائمة الصفحات المسموحة
 */
export function getAllowedHRPages(userRoles) {
    if (!userRoles || !Array.isArray(userRoles)) return [];
    // Super admin و HR roles لهم صلاحية كاملة
    if (userRoles.includes(ROLES.SUPER_ADMIN)) return 'all';
    if (userRoles.some(r => [ROLES.HR_DIRECTOR, ROLES.HR_MANAGER, ROLES.HR_EMPLOYEE, ROLES.IT_DIRECTOR].includes(r))) return 'all';
    // صاحب الصلاحية / نائبه
    if (userRoles.includes(ROLES.AUTHORITY_HOLDER) || userRoles.includes(ROLES.DEPUTY_AUTHORITY)) {
        return DEPARTMENT_HR_ACCESS.AUTHORITY_PAGES;
    }
    // تحقق من الأدوار ذات الصلاحية المحدودة
    if (hasDepartmentLevelHRAccess(userRoles)) {
        return DEPARTMENT_HR_ACCESS.ALLOWED_HR_PAGES;
    }
    return [];
}

/**
 * الحصول على عناصر الـ HR sidebar بناءً على صلاحيات المستخدم
 * @param {Array} userRoles أدوار المستخدم
 * @returns {Array} عناصر القائمة
 */
export function getHRSidebarItems(userRoles) {
    const allowedPages = getAllowedHRPages(userRoles);

    // جميع عناصر HR الممكنة
    const allHRItems = [
        { id: 'hr-organization', label: 'الهيكل الإداري', path: '/hr/organization', permission: 'hr:read' },
        { id: 'hr-employees', label: 'الملف الموحد', path: '/hr/employees-unified', permission: 'hr:read' },
        { id: 'hr-departments', label: 'الأقسام', path: '/hr/departments', permission: 'hr:read' },
        { id: 'hr-leaves', label: 'الإجازات', path: '/hr/leaves', permission: 'hr:read' },
        { id: 'hr-attendance', label: 'الحضور والانصراف', path: '/hr/attendance', permission: 'hr:read' },
        { id: 'hr-salaries', label: 'الرواتب', path: '/hr/salaries', permission: 'hr:read' },
        { id: 'hr-payroll', label: 'مسير الرواتب', path: '/hr/payroll', permission: 'hr:read' },
        { id: 'hr-reports', label: 'التقارير', path: '/hr/reports', permission: 'hr:read' },
    ];

    if (allowedPages === 'all') {
        return allHRItems;
    }

    // فلترة العناصر بناءً على الصفحات المسموحة
    return allHRItems.filter(item =>
        allowedPages.some(allowedPath => item.path.startsWith(allowedPath))
    );
}

// ==================== تكوين التنقل حسب الأدوار ====================
// ROLE_NAVIGATION_CONFIG - يحدد ما يظهر لكل دور في السايدبار

export const ROLE_NAVIGATION_CONFIG = {
    // ===========================================
    // الأدوار الإدارية العليا
    // ===========================================
    [ROLES.SUPER_ADMIN]: {
        access: 'full',
        excluded: [],
    },

    [ROLES.IT_DIRECTOR]: {
        modules: ['dashboard', 'hr', 'epm', 'itsm', 'settings'],
        subItems: {
            hr: 'all',
            epm: 'all',
            itsm: 'all',
            settings: 'all',
        },
        // صلاحيات خاصة بمدير تقنية المعلومات
        permissions: ['it_permissions:manage'],
    },

    // ===========================================
    // مدراء الإدارات
    // ===========================================
    [ROLES.HR_DIRECTOR]: {
        modules: ['dashboard', 'hr', 'epm', 'itsm'],
        subItems: {
            hr: 'all',
            epm: 'all',
            itsm: 'all',
        },
        hrAccess: 'full',
    },

    [ROLES.FINANCE_DIRECTOR]: {
        modules: ['dashboard', 'executive-dashboard', 'finance', 'sadad', 'grc', 'analytics', 'approvals', 'settings'],
        subItems: {
            finance: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users', 'admin-feature-flags'],
        },
    },

    [ROLES.WAREHOUSE_DIRECTOR]: {
        modules: ['dashboard', 'executive-dashboard', 'warehouse', 'analytics', 'approvals', 'settings'],
        subItems: {
            warehouse: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users', 'admin-feature-flags'],
        },
    },

    // ===========================================
    // المدراء
    // ===========================================
    [ROLES.HR_MANAGER]: {
        modules: ['dashboard', 'hr', 'epm', 'itsm'],
        subItems: {
            hr: 'all',
            epm: 'all',
            itsm: 'all',
        },
        hrAccess: 'full',
    },

    // ===========================================
    // أدوار HR المتخصصة (مصفوفة الصلاحيات)
    // ===========================================

    // موظف تقنية المعلومات - إدارة المستخدمين والسجلات فقط
    [ROLES.HR_SYS_ADMIN]: {
        modules: ['dashboard', 'settings', 'approvals'],
        subItems: {
            settings: 'all',
            approvals: 'all',
        },
    },

    // موظف موارد بشرية (كامل الصلاحيات)
    [ROLES.HR_OFFICER_FULL]: {
        modules: ['dashboard', 'hr', 'approvals', 'settings'],
        subItems: {
            hr: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
        hrAccess: 'full',
    },

    // موظف موارد بشرية (البيانات الأساسية فقط)
    [ROLES.HR_OFFICER_BASIC]: {
        modules: ['dashboard', 'hr', 'approvals', 'settings'],
        subItems: {
            hr: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    // موظف متابعة الحضور
    [ROLES.HR_ATTENDANCE]: {
        modules: ['dashboard', 'hr', 'approvals', 'settings'],
        subItems: {
            hr: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    // موظف متابعة الحضور والإجازات
    [ROLES.HR_ATT_VAC]: {
        modules: ['dashboard', 'hr', 'approvals', 'settings'],
        subItems: {
            hr: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    // موظف مسير انتداب / خارج الدوام
    [ROLES.HR_OVERTIME]: {
        modules: ['dashboard', 'hr', 'approvals', 'settings'],
        subItems: {
            hr: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    [ROLES.WAREHOUSE_ADMIN]: {
        modules: ['dashboard', 'warehouse', 'hr', 'approvals', 'settings'],
        subItems: {
            warehouse: 'all',
            hr: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users', 'admin-feature-flags'],
        },
        hrAccess: 'department',
    },

    [ROLES.HEAD_WAREHOUSE]: {
        modules: ['dashboard', 'warehouse', 'hr', 'approvals', 'settings'],
        subItems: {
            warehouse: 'all',
            hr: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users', 'admin-feature-flags'],
        },
        hrAccess: 'department',
    },

    [ROLES.FLEET_MANAGER]: {
        modules: ['dashboard', 'movement', 'hr', 'approvals', 'settings'],
        subItems: {
            movement: 'all',
            hr: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users', 'admin-feature-flags'],
        },
        hrAccess: 'department',
    },

    [ROLES.ARCHIVE_ADMIN]: {
        modules: ['dashboard', 'archiving', 'hr', 'approvals', 'settings'],
        subItems: {
            archiving: 'all',
            hr: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users', 'admin-feature-flags'],
        },
        hrAccess: 'department',
    },

    // ===========================================
    // أدوار المستودعات المتخصصة
    // ===========================================
    [ROLES.WAREHOUSE_KEEPER]: {
        modules: ['dashboard', 'warehouse', 'hr', 'approvals', 'settings'],
        subItems: {
            warehouse: 'all',
            hr: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
        hrAccess: 'department',
    },

    [ROLES.SECURITY_WAREHOUSE]: {
        modules: ['dashboard', 'warehouse', 'hr', 'approvals', 'settings'],
        subItems: {
            warehouse: 'all',
            hr: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
        hrAccess: 'department',
    },

    [ROLES.RECEIVING_OFFICER]: {
        modules: ['dashboard', 'warehouse', 'approvals', 'settings'],
        subItems: {
            warehouse: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    [ROLES.INVENTORY_CONTROLLER]: {
        modules: ['dashboard', 'warehouse', 'approvals', 'settings'],
        subItems: {
            warehouse: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    [ROLES.INVENTORY_AUDITOR]: {
        modules: ['dashboard', 'warehouse', 'approvals', 'settings'],
        subItems: {
            warehouse: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    [ROLES.PUBLIC_SERVICES]: {
        modules: ['dashboard', 'warehouse', 'approvals', 'settings'],
        subItems: {
            warehouse: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    // ===========================================
    // أدوار المالية
    // ===========================================
    [ROLES.FINANCE_ADMIN]: {
        modules: ['dashboard', 'finance', 'sadad', 'approvals', 'settings'],
        subItems: {
            finance: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users', 'admin-feature-flags'],
        },
    },

    [ROLES.ACCOUNTING_MANAGER]: {
        modules: ['dashboard', 'finance', 'approvals', 'settings'],
        subItems: {
            finance: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    [ROLES.ACCOUNTANT]: {
        modules: ['dashboard', 'finance', 'approvals', 'settings'],
        subItems: {
            finance: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    [ROLES.BUDGET_MANAGER]: {
        modules: ['dashboard', 'finance', 'approvals', 'settings'],
        subItems: {
            finance: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    [ROLES.PROCUREMENT_MANAGER]: {
        modules: ['dashboard', 'finance', 'approvals', 'settings'],
        subItems: {
            finance: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    [ROLES.PROCUREMENT_OFFICER]: {
        modules: ['dashboard', 'finance', 'approvals', 'settings'],
        subItems: {
            finance: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    [ROLES.TREASURER]: {
        modules: ['dashboard', 'finance', 'approvals', 'settings'],
        subItems: {
            finance: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    [ROLES.INTERNAL_AUDITOR]: {
        modules: ['dashboard', 'finance', 'grc', 'declarations', 'analytics', 'approvals', 'settings'],
        subItems: {
            finance: 'all',
            declarations: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    // ===========================================
    // مدير المراجعة الداخلية
    // ===========================================
    [ROLES.INTERNAL_AUDIT_MANAGER]: {
        modules: ['dashboard', 'finance', 'grc', 'declarations', 'analytics', 'approvals', 'settings'],
        subItems: {
            finance: 'all',
            grc: 'all',
            declarations: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users', 'admin-feature-flags'],
        },
    },

    // ===========================================
    // أدوار الدعم الفني
    // ===========================================
    [ROLES.IT_MANAGER]: {
        modules: ['dashboard', 'hr', 'epm', 'itsm', 'settings'],
        subItems: {
            hr: 'all',
            epm: 'all',
            itsm: 'all',
            settings: 'all',
        },
        permissions: ['it_permissions:manage'],
    },

    [ROLES.IT_SPECIALIST]: {
        modules: ['dashboard', 'itsm', 'approvals', 'settings'],
        subItems: {
            itsm: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    [ROLES.IT_HELPDESK]: {
        modules: ['dashboard', 'itsm', 'approvals', 'settings'],
        subItems: {
            itsm: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    // ===========================================
    // أدوار المشاريع
    // ===========================================
    [ROLES.PROJECT_ADMIN]: {
        modules: ['dashboard', 'projects', 'approvals', 'settings'],
        subItems: {
            projects: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users', 'admin-feature-flags'],
        },
    },

    [ROLES.PROJECT_MANAGER]: {
        modules: ['dashboard', 'projects', 'approvals', 'settings'],
        subItems: {
            projects: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    [ROLES.PROJECT_TEAM_LEAD]: {
        modules: ['dashboard', 'projects', 'approvals', 'settings'],
        subItems: {
            projects: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    [ROLES.PROJECT_MEMBER]: {
        modules: ['dashboard', 'projects', 'approvals', 'settings'],
        subItems: {
            projects: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    // ===========================================
    // أدوار قياس الأداء
    // ===========================================
    [ROLES.EPM_ADMIN]: {
        modules: ['dashboard', 'epm', 'approvals', 'settings'],
        subItems: {
            epm: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users', 'admin-feature-flags'],
        },
    },

    [ROLES.EPM_VIEWER]: {
        modules: ['dashboard', 'epm', 'approvals', 'settings'],
        subItems: {
            epm: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    // ===========================================
    // رئيس القسم / مدير الإدارة
    // ===========================================
    [ROLES.DEPARTMENT_HEAD]: {
        modules: ['dashboard', 'hr', 'approvals', 'settings'],
        subItems: {
            hr: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
        hrAccess: 'department',
    },

    // ===========================================
    // الموظف العادي (الحد الأدنى) — يرى بوابتي وإدارتي
    // ===========================================
    [ROLES.EMPLOYEE]: {
        modules: ['dashboard', 'itsm', 'agents'],
        subItems: {
            itsm: ['itsm-dashboard', 'itsm-tickets'],
            agents: ['agents-dashboard', 'agents-tasks'],
        },
        hrAccess: 'self',
        isBaseline: true,
    },

    // ===========================================
    // أدوار الأرشفة
    // ===========================================
    [ROLES.ARCHIVE_CLERK]: {
        modules: ['dashboard', 'archiving', 'approvals', 'settings'],
        subItems: {
            archiving: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },

    // ===========================================
    // السائق
    // ===========================================
    [ROLES.DRIVER]: {
        modules: ['dashboard', 'movement', 'approvals', 'settings'],
        subItems: {
            movement: 'all',
            approvals: 'all',
            settings: ['admin-dashboard', 'admin-organization', 'admin-announcements', 'admin-news-ticker', 'admin-users'],
        },
    },
};

/**
 * الحصول على تكوين التنقل لجميع أدوار المستخدم
 * @param {Array} userRoles أدوار المستخدم
 * @returns {Object} تكوين التنقل المدمج
 */
export function getNavigationForRoles(userRoles) {
    if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) {
        return ROLE_NAVIGATION_CONFIG[ROLES.EMPLOYEE] || { modules: ['dashboard'] };
    }

    // التحقق من super_admin أولاً
    if (userRoles.includes(ROLES.SUPER_ADMIN)) {
        return { access: 'full', excluded: [] };
    }

    // التحقق من IT Director
    if (userRoles.includes(ROLES.IT_DIRECTOR)) {
        return ROLE_NAVIGATION_CONFIG[ROLES.IT_DIRECTOR];
    }

    // دمج تكوينات جميع الأدوار
    let mergedConfig = {
        modules: new Set(['dashboard']), // Dashboard دائماً متاح
        subItems: {},
        hrAccess: null,
    };

    // إضافة baseline للموظف — فقط إذا لم يكن هناك تكوين خاص بأدوار المستخدم
    const hasExplicitRoleConfig = userRoles.some(r =>
        r !== ROLES.EMPLOYEE && ROLE_NAVIGATION_CONFIG[r]
    );
    if (!hasExplicitRoleConfig) {
        const employeeConfig = ROLE_NAVIGATION_CONFIG[ROLES.EMPLOYEE];
        if (employeeConfig && employeeConfig.modules) {
            employeeConfig.modules.forEach(m => mergedConfig.modules.add(m));
            Object.entries(employeeConfig.subItems || {}).forEach(([module, items]) => {
                if (!mergedConfig.subItems[module]) {
                    mergedConfig.subItems[module] = new Set();
                }
                if (items === 'all') {
                    mergedConfig.subItems[module] = 'all';
                } else if (mergedConfig.subItems[module] !== 'all' && Array.isArray(items)) {
                    items.forEach(item => mergedConfig.subItems[module].add(item));
                }
            });
        }
    }

    // دمج كل دور للمستخدم
    for (const role of userRoles) {
        const roleConfig = ROLE_NAVIGATION_CONFIG[role];
        if (!roleConfig) continue;

        // إذا كان لديه صلاحية كاملة
        if (roleConfig.access === 'full') {
            return roleConfig;
        }

        // إضافة الموديولات
        if (roleConfig.modules) {
            roleConfig.modules.forEach(m => mergedConfig.modules.add(m));
        }

        // دمج الصفحات الفرعية
        if (roleConfig.subItems) {
            Object.entries(roleConfig.subItems).forEach(([module, items]) => {
                if (!mergedConfig.subItems[module]) {
                    mergedConfig.subItems[module] = new Set();
                }
                if (items === 'all') {
                    mergedConfig.subItems[module] = 'all';
                } else if (mergedConfig.subItems[module] !== 'all' && Array.isArray(items)) {
                    items.forEach(item => mergedConfig.subItems[module].add(item));
                }
            });
        }

        // مستوى الوصول لـ HR
        if (roleConfig.hrAccess) {
            if (roleConfig.hrAccess === 'full' || mergedConfig.hrAccess !== 'full') {
                mergedConfig.hrAccess = roleConfig.hrAccess;
            }
        }
    }

    // تحويل Sets إلى Arrays
    return {
        modules: Array.from(mergedConfig.modules),
        subItems: Object.fromEntries(
            Object.entries(mergedConfig.subItems).map(([k, v]) =>
                [k, v === 'all' ? 'all' : Array.from(v)]
            )
        ),
        hrAccess: mergedConfig.hrAccess,
    };
}

/**
 * التحقق من إمكانية الوصول لعنصر تنقل محدد
 * @param {Object} navConfig تكوين التنقل
 * @param {string} moduleId معرف الموديول
 * @param {string} subItemId معرف العنصر الفرعي (اختياري)
 * @returns {boolean}
 */
export function canAccessNavItem(navConfig, moduleId, subItemId = null) {
    if (!navConfig) return false;

    // التحقق من الصلاحية الكاملة
    if (navConfig.access === 'full') {
        if (navConfig.excluded && navConfig.excluded.includes(moduleId)) {
            return false;
        }
        return true;
    }

    // التحقق من وجود الموديول في القائمة المسموحة
    if (!navConfig.modules || !navConfig.modules.includes(moduleId)) {
        return false;
    }

    // إذا لم يكن هناك عنصر فرعي، الوصول للموديول كافٍ
    if (!subItemId) return true;

    // التحقق من الوصول للعنصر الفرعي
    const moduleSubItems = navConfig.subItems?.[moduleId];
    if (!moduleSubItems) return true; // إذا لم يكن هناك تحديد، اسمح بالكل
    if (moduleSubItems === 'all') return true;

    return moduleSubItems.includes(subItemId);
}

/**
 * التحقق مما إذا كان المستخدم مراقب دوام
 * @param {Array} userRoles أدوار المستخدم
 * @param {string} jobTitle المسمى الوظيفي
 * @returns {boolean}
 */
export function isAttendanceMonitor(userRoles, jobTitle = '') {
    if (!userRoles || !Array.isArray(userRoles)) return false;

    const monitorRoles = [
        ROLES.SUPER_ADMIN,
        ROLES.HR_DIRECTOR,
        ROLES.HR_MANAGER,
        ROLES.ATTENDANCE_SUPERVISOR,
        ROLES.ATTENDANCE_MONITOR,
        ROLES.HR_ATTENDANCE,
        ROLES.HR_ATT_VAC,
    ];

    if (userRoles.some(r => monitorRoles.includes(r))) return true;

    // التحقق من المسمى الوظيفي
    if (jobTitle && (jobTitle.includes('مراقب دوام') || jobTitle.includes('مراقب الدوام'))) {
        return true;
    }

    return false;
}
