/**
 * ربط الصلاحيات بالمناصب الإدارية
 * Position-based Permission System
 *
 * كل منصب إداري له مجموعة صلاحيات تتفعل تلقائياً عند تسكين موظف فيه
 */

// ============================================
// خريطة المناصب والصلاحيات
// ============================================

export const POSITION_TYPES = {
    AUTHORITY_HOLDER: 'authority_holder',     // صاحب الصلاحية / رئيس الجهة
    DEPUTY_AUTHORITY: 'deputy_authority',     // نائب صاحب الصلاحية
    DEPARTMENT_HEAD: 'department_head',       // مدير إدارة
    SECTION_HEAD: 'section_head',           // رئيس قسم
    UNIT_HEAD: 'unit_head',                 // رئيس وحدة
    SUPERVISOR: 'supervisor',               // مشرف
    EMPLOYEE: 'employee',                   // موظف
};

export const POSITION_LABELS = {
    [POSITION_TYPES.AUTHORITY_HOLDER]: 'صاحب الصلاحية',
    [POSITION_TYPES.DEPUTY_AUTHORITY]: 'نائب صاحب الصلاحية',
    [POSITION_TYPES.DEPARTMENT_HEAD]: 'مدير إدارة',
    [POSITION_TYPES.SECTION_HEAD]: 'رئيس قسم',
    [POSITION_TYPES.UNIT_HEAD]: 'رئيس وحدة',
    [POSITION_TYPES.SUPERVISOR]: 'مشرف',
    [POSITION_TYPES.EMPLOYEE]: 'موظف',
};

/**
 * خريطة الصلاحيات لكل منصب
 * wildcards: 'hr.*' = جميع صلاحيات HR
 */
export const POSITION_PERMISSION_MAP = {
    [POSITION_TYPES.AUTHORITY_HOLDER]: {
        label: 'صاحب الصلاحية',
        scope: 'organization', // كل المنظمة
        permissions: [
            'hr.*',
            'approvals.final',
            'org.view_all',
            'org.manage',
            'reports.*',
            'employees.view_all',
            'employees.manage',
            'finance.approve',
            'admin.settings',
        ],
        pages: [
            '/hr/authority-dashboard',
            '/hr/organization',
            '/hr/employees-unified',
            '/hr/departments',
            '/hr/attendance',
            '/hr/leaves',
            '/hr/salaries',
            '/hr/payroll',
            '/hr/reports',
        ],
        approvalLevel: 'Final',
    },

    [POSITION_TYPES.DEPUTY_AUTHORITY]: {
        label: 'نائب صاحب الصلاحية',
        scope: 'organization',
        permissions: [
            'hr.*',
            'approvals.deputy',
            'org.view_all',
            'reports.*',
            'employees.view_all',
        ],
        pages: [
            '/hr/authority-dashboard',
            '/hr/organization',
            '/hr/employees-unified',
            '/hr/departments',
            '/hr/attendance',
            '/hr/leaves',
            '/hr/reports',
        ],
        approvalLevel: 'Level3',
    },

    [POSITION_TYPES.DEPARTMENT_HEAD]: {
        label: 'مدير إدارة',
        scope: 'department', // إدارته فقط
        permissions: [
            'hr.dept.view',
            'hr.dept.employees',
            'approvals.dept',
            'reports.dept',
            'employees.dept.view',
            'employees.dept.manage',
            'attendance.dept.view',
            'leaves.dept.approve',
        ],
        pages: [
            '/hr/organization',
            '/hr/employees-unified',
            '/hr/attendance',
            '/hr/leaves',
            '/hr/my-department',
        ],
        approvalLevel: 'Level2',
    },

    [POSITION_TYPES.SECTION_HEAD]: {
        label: 'رئيس قسم',
        scope: 'section', // قسمه فقط
        permissions: [
            'hr.section.view',
            'hr.section.employees',
            'approvals.section',
            'employees.section.view',
            'attendance.section.view',
            'leaves.section.recommend',
        ],
        pages: [
            '/hr/organization',
            '/hr/employees-unified',
            '/hr/attendance',
            '/hr/leaves',
        ],
        approvalLevel: 'Level1',
    },

    [POSITION_TYPES.UNIT_HEAD]: {
        label: 'رئيس وحدة',
        scope: 'unit', // وحدته فقط
        permissions: [
            'hr.unit.view',
            'hr.unit.employees',
            'employees.unit.view',
            'attendance.unit.view',
        ],
        pages: [
            '/hr/organization',
            '/hr/employees-unified',
            '/hr/attendance',
        ],
        approvalLevel: 'Level1',
    },

    [POSITION_TYPES.SUPERVISOR]: {
        label: 'مشرف',
        scope: 'team',
        permissions: [
            'hr.team.view',
            'employees.team.view',
        ],
        pages: [
            '/hr/organization',
        ],
        approvalLevel: 'None',
    },

    [POSITION_TYPES.EMPLOYEE]: {
        label: 'موظف',
        scope: 'self',
        permissions: [
            'hr.self.view',
        ],
        pages: [],
        approvalLevel: 'None',
    },
};

// ============================================
// دوال الصلاحيات
// ============================================

/**
 * جلب صلاحيات منصب معين
 * @param {string} positionCode - رمز المنصب
 * @returns {object|null} بيانات الصلاحيات
 */
export function getPermissionsForPosition(positionCode) {
    return POSITION_PERMISSION_MAP[positionCode] || null;
}

/**
 * فحص هل منصب معين يمتلك صلاحية محددة
 * @param {string} positionCode - رمز المنصب
 * @param {string} permission - الصلاحية المطلوبة (مثال: 'hr.dept.view')
 * @returns {boolean}
 */
export function positionHasPermission(positionCode, permission) {
    const config = POSITION_PERMISSION_MAP[positionCode];
    if (!config) return false;

    return config.permissions.some(p => {
        if (p === permission) return true;
        // wildcard matching: 'hr.*' يطابق 'hr.dept.view'
        if (p.endsWith('.*')) {
            const prefix = p.slice(0, -2);
            return permission.startsWith(prefix + '.');
        }
        return false;
    });
}

/**
 * فحص هل منصب معين يمكنه الوصول لصفحة
 * @param {string} positionCode - رمز المنصب
 * @param {string} pagePath - مسار الصفحة
 * @returns {boolean}
 */
export function positionCanAccessPage(positionCode, pagePath) {
    const config = POSITION_PERMISSION_MAP[positionCode];
    if (!config) return false;
    return config.pages.includes(pagePath);
}

/**
 * تحديد نوع المنصب بناءً على الـ role و السياق
 * @param {object} params - { role, isDepartmentManager, isSectionManager, isUnitManager, isAuthorityHolder }
 * @returns {string} نوع المنصب
 */
export function resolvePositionType({ role, isDepartmentManager, isSectionManager, isUnitManager, isAuthorityHolder, isDeputyAuthority }) {
    if (isAuthorityHolder) return POSITION_TYPES.AUTHORITY_HOLDER;
    if (isDeputyAuthority) return POSITION_TYPES.DEPUTY_AUTHORITY;
    if (isDepartmentManager || role === 'department_head') return POSITION_TYPES.DEPARTMENT_HEAD;
    if (isSectionManager || role === 'section_head') return POSITION_TYPES.SECTION_HEAD;
    if (isUnitManager || role === 'unit_head') return POSITION_TYPES.UNIT_HEAD;
    if (role === 'supervisor') return POSITION_TYPES.SUPERVISOR;
    return POSITION_TYPES.EMPLOYEE;
}

/**
 * جلب النطاق (scope) لمنصب معين
 * @param {string} positionCode - رمز المنصب
 * @returns {{ type: string, label: string }}
 */
export function getPositionScope(positionCode) {
    const config = POSITION_PERMISSION_MAP[positionCode];
    if (!config) return { type: 'self', label: 'شخصي' };

    const scopeLabels = {
        organization: 'كل المنظمة',
        department: 'الإدارة',
        section: 'القسم',
        unit: 'الوحدة',
        team: 'الفريق',
        self: 'شخصي',
    };

    return {
        type: config.scope,
        label: scopeLabels[config.scope] || config.scope,
    };
}

/**
 * تفعيل صلاحيات المنصب عند التسكين
 * يُستدعى عند تعيين موظف كمدير لإدارة/قسم/وحدة
 * @param {string} employeeId - معرف الموظف
 * @param {string} positionCode - رمز المنصب
 * @param {string} scopeId - معرف الإدارة/القسم/الوحدة
 * @returns {object} - بيانات التفعيل
 */
export function activatePositionPermissions(employeeId, positionCode, scopeId) {
    const config = POSITION_PERMISSION_MAP[positionCode];
    if (!config) return null;

    return {
        employeeId,
        positionCode,
        positionLabel: config.label,
        scopeId,
        scopeType: config.scope,
        permissions: config.permissions,
        approvalLevel: config.approvalLevel,
        pages: config.pages,
        activatedAt: new Date().toISOString(),
    };
}

/**
 * إلغاء صلاحيات المنصب عند إزالة التسكين
 */
export function deactivatePositionPermissions(employeeId) {
    return {
        employeeId,
        positionCode: POSITION_TYPES.EMPLOYEE,
        positionLabel: POSITION_LABELS[POSITION_TYPES.EMPLOYEE],
        scopeId: null,
        scopeType: 'self',
        permissions: POSITION_PERMISSION_MAP[POSITION_TYPES.EMPLOYEE].permissions,
        approvalLevel: 'None',
        pages: [],
        deactivatedAt: new Date().toISOString(),
    };
}
