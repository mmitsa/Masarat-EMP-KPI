/**
 * Activity Logger Service
 * Central service for logging all user activities across the platform
 */

// In-memory activity logs store (replace with database in production)
const activityLogs = [];

// Maximum logs to keep in memory (for demo)
const MAX_LOGS = 10000;

/**
 * Activity types configuration
 */
export const ACTIVITY_TYPES = {
    // Authentication
    login: { category: 'auth', severity: 'success', label: 'تسجيل دخول' },
    logout: { category: 'auth', severity: 'info', label: 'تسجيل خروج' },
    login_failed: { category: 'auth', severity: 'error', label: 'فشل تسجيل الدخول' },
    password_change: { category: 'auth', severity: 'warning', label: 'تغيير كلمة المرور' },
    password_reset: { category: 'auth', severity: 'warning', label: 'إعادة تعيين كلمة المرور' },
    two_factor_enabled: { category: 'auth', severity: 'info', label: 'تفعيل التحقق الثنائي' },
    two_factor_disabled: { category: 'auth', severity: 'warning', label: 'إلغاء التحقق الثنائي' },

    // CRUD Operations
    create: { category: 'crud', severity: 'info', label: 'إنشاء' },
    read: { category: 'crud', severity: 'info', label: 'عرض' },
    update: { category: 'crud', severity: 'info', label: 'تحديث' },
    delete: { category: 'crud', severity: 'warning', label: 'حذف' },

    // File Operations
    upload: { category: 'file', severity: 'info', label: 'رفع ملف' },
    download: { category: 'file', severity: 'info', label: 'تحميل ملف' },
    export: { category: 'file', severity: 'info', label: 'تصدير' },
    import: { category: 'file', severity: 'info', label: 'استيراد' },

    // Workflow Operations
    approval: { category: 'workflow', severity: 'success', label: 'اعتماد' },
    rejection: { category: 'workflow', severity: 'warning', label: 'رفض' },
    status_change: { category: 'workflow', severity: 'info', label: 'تغيير الحالة' },
    submission: { category: 'workflow', severity: 'info', label: 'تقديم طلب' },

    // System Operations
    settings_change: { category: 'system', severity: 'warning', label: 'تغيير الإعدادات' },
    role_change: { category: 'system', severity: 'warning', label: 'تغيير الصلاحيات' },
    backup: { category: 'system', severity: 'info', label: 'نسخ احتياطي' },
    restore: { category: 'system', severity: 'critical', label: 'استعادة' },
    system_error: { category: 'system', severity: 'error', label: 'خطأ في النظام' },

    // ===========================================
    // HR Sensitive Operations (العمليات الحساسة)
    // ===========================================
    hr_payroll_create: { category: 'hr', severity: 'critical', label: 'إنشاء مسير رواتب', notify: true, auditRequired: true },
    hr_salary_update: { category: 'hr', severity: 'critical', label: 'تعديل راتب موظف', notify: true, auditRequired: true },
    hr_salary_definition: { category: 'hr', severity: 'critical', label: 'تعريف راتب', notify: true, auditRequired: true },
    hr_leave_carryforward: { category: 'hr', severity: 'warning', label: 'ترحيل إجازات', notify: true, auditRequired: true },
    hr_clearance: { category: 'hr', severity: 'warning', label: 'إخلاء طرف', notify: true, auditRequired: true },
    hr_employee_delete: { category: 'hr', severity: 'critical', label: 'حذف موظف', notify: true, auditRequired: true },
    hr_deduction_decision: { category: 'hr', severity: 'warning', label: 'قرار خصم', notify: true, auditRequired: true },
    hr_allowance_decision: { category: 'hr', severity: 'warning', label: 'قرار علاوة', notify: true, auditRequired: true },
    hr_payroll_export: { category: 'hr', severity: 'info', label: 'تصدير ملف صرف', auditRequired: true },
    hr_attendance_exception: { category: 'hr', severity: 'info', label: 'استثناء حضور', auditRequired: true },
    hr_leave_exception: { category: 'hr', severity: 'info', label: 'استثناء إجازة', auditRequired: true },
    hr_delegation_create: { category: 'hr', severity: 'info', label: 'إنشاء انتداب', auditRequired: true },
    hr_overtime_process: { category: 'hr', severity: 'info', label: 'معالجة خارج دوام', auditRequired: true },

    // User Management (إدارة المستخدمين)
    user_create: { category: 'admin', severity: 'warning', label: 'إنشاء مستخدم', notify: true, auditRequired: true },
    user_update: { category: 'admin', severity: 'info', label: 'تحديث مستخدم', auditRequired: true },
    user_delete: { category: 'admin', severity: 'critical', label: 'حذف مستخدم', notify: true, auditRequired: true },
    user_password_change: { category: 'admin', severity: 'critical', label: 'تغيير كلمة مرور مستخدم', notify: true, auditRequired: true },
    user_link_employee: { category: 'admin', severity: 'warning', label: 'ربط مستخدم بموظف', auditRequired: true },
    user_activate: { category: 'admin', severity: 'info', label: 'تفعيل مستخدم', auditRequired: true },
    user_deactivate: { category: 'admin', severity: 'warning', label: 'تعطيل مستخدم', notify: true, auditRequired: true },
};

/**
 * العمليات الحساسة التي تتطلب تسجيل إلزامي
 */
export const SENSITIVE_OPERATIONS = {
    'user_management.change_password': { severity: 'critical', notify: true, auditRequired: true },
    'payroll.create_payroll': { severity: 'critical', notify: true, auditRequired: true },
    'payroll.deduction_decision': { severity: 'warning', notify: true, auditRequired: true },
    'payroll.allowance': { severity: 'warning', notify: true, auditRequired: true },
    'employees.salary_definition': { severity: 'critical', notify: true, auditRequired: true },
    'employees.clearance': { severity: 'warning', notify: true, auditRequired: true },
    'leaves.carryforward': { severity: 'warning', notify: true, auditRequired: true },
    'audit.backup': { severity: 'info', notify: false, auditRequired: true },
};

/**
 * التحقق مما إذا كانت العملية تتطلب تسجيل إلزامي
 * @param {string} activityType نوع النشاط
 * @returns {boolean}
 */
export function isAuditRequired(activityType) {
    const config = ACTIVITY_TYPES[activityType];
    return config?.auditRequired === true;
}

/**
 * التحقق مما إذا كانت العملية تتطلب إشعار
 * @param {string} activityType نوع النشاط
 * @returns {boolean}
 */
export function requiresNotification(activityType) {
    const config = ACTIVITY_TYPES[activityType];
    return config?.notify === true;
}

/**
 * Module names configuration
 */
export const MODULES = {
    hr: 'الموارد البشرية',
    warehouse: 'المستودعات',
    movement: 'إدارة الحركة',
    archiving: 'الأرشيف',
    finance: 'المالية',
    sadad: 'سداد',
    epm: 'الأداء',
    settings: 'الإعدادات',
    auth: 'المصادقة',
    analytics: 'التحليلات',
    agents: 'الوكلاء الذكيين',
};

/**
 * Log an activity
 * @param {Object} params - Activity parameters
 * @param {string} params.type - Activity type (login, create, update, etc.)
 * @param {string} params.module - Module name (hr, warehouse, etc.)
 * @param {string} params.description - Human-readable description
 * @param {number|string} params.userId - User ID who performed the action
 * @param {string} params.userName - User name
 * @param {string} params.userEmail - User email
 * @param {string} [params.severity] - Severity level (info, warning, error, critical, success)
 * @param {Object} [params.details] - Additional details
 * @param {Object} [params.req] - Request object for IP extraction
 * @param {string} [params.tenantId] - Tenant ID for multi-tenant support
 */
export async function logActivity({
    type,
    module,
    description,
    userId,
    userName,
    userEmail,
    severity,
    details = {},
    req = null,
    tenantId = 'default',
}) {
    try {
        // Get activity type config
        const typeConfig = ACTIVITY_TYPES[type] || { category: 'other', severity: 'info', label: type };

        // Extract IP address from request
        let ipAddress = null;
        let userAgent = null;

        if (req) {
            ipAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
                       req.headers['x-real-ip'] ||
                       req.socket?.remoteAddress ||
                       req.connection?.remoteAddress ||
                       'unknown';
            userAgent = req.headers['user-agent'] || null;
        }

        // Create log entry
        const logEntry = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            timestamp: new Date().toISOString(),
            type,
            typeLabel: typeConfig.label,
            category: typeConfig.category,
            module,
            moduleName: MODULES[module] || module,
            description,
            severity: severity || typeConfig.severity,
            user: {
                id: userId,
                name: userName,
                email: userEmail,
            },
            details,
            ipAddress,
            userAgent,
            tenantId,
        };

        // Add to in-memory store
        activityLogs.unshift(logEntry);

        // Trim old logs if exceeding max
        if (activityLogs.length > MAX_LOGS) {
            activityLogs.splice(MAX_LOGS);
        }

        // In production, also persist to database
        // await saveToDatabase(logEntry);

        // For critical activities, trigger alerts
        if (logEntry.severity === 'critical' || logEntry.severity === 'error') {
            // await sendAlert(logEntry);
            console.warn('[ACTIVITY ALERT]', logEntry.description, logEntry.details);
        }

        return logEntry;
    } catch (error) {
        console.warn('Error logging activity:', error);
        // Don't throw - logging should not break the main flow
        return null;
    }
}

/**
 * Get activity logs with filtering
 * @param {Object} filters - Filter options
 * @returns {Array} Filtered logs
 */
export function getActivityLogs({
    search,
    module,
    type,
    severity,
    userId,
    startDate,
    endDate,
    tenantId = 'default',
    page = 1,
    limit = 50,
} = {}) {
    let filtered = [...activityLogs];

    // Filter by tenant
    filtered = filtered.filter(log => log.tenantId === tenantId);

    // Filter by search
    if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(log =>
            log.description.toLowerCase().includes(searchLower) ||
            log.user?.name?.toLowerCase().includes(searchLower) ||
            log.user?.email?.toLowerCase().includes(searchLower)
        );
    }

    // Filter by module
    if (module && module !== 'all') {
        filtered = filtered.filter(log => log.module === module);
    }

    // Filter by type
    if (type && type !== 'all') {
        filtered = filtered.filter(log => log.type === type);
    }

    // Filter by severity
    if (severity && severity !== 'all') {
        filtered = filtered.filter(log => log.severity === severity);
    }

    // Filter by user
    if (userId) {
        filtered = filtered.filter(log => log.user?.id?.toString() === userId.toString());
    }

    // Filter by date range
    if (startDate) {
        const start = new Date(startDate);
        filtered = filtered.filter(log => new Date(log.timestamp) >= start);
    }
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(log => new Date(log.timestamp) <= end);
    }

    // Calculate total before pagination
    const total = filtered.length;

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedLogs = filtered.slice(startIndex, startIndex + limit);

    return {
        logs: paginatedLogs,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

/**
 * Get activity statistics
 * @param {Object} options - Options
 * @returns {Object} Statistics
 */
export function getActivityStats({ tenantId = 'default', days = 7 } = {}) {
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const relevantLogs = activityLogs.filter(log =>
        log.tenantId === tenantId && new Date(log.timestamp) >= cutoff
    );

    // Get today's logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogs = relevantLogs.filter(log => new Date(log.timestamp) >= today);

    // Count by module
    const byModule = {};
    relevantLogs.forEach(log => {
        byModule[log.module] = (byModule[log.module] || 0) + 1;
    });

    // Count by type
    const byType = {};
    relevantLogs.forEach(log => {
        byType[log.type] = (byType[log.type] || 0) + 1;
    });

    // Count by severity
    const bySeverity = {};
    relevantLogs.forEach(log => {
        bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
    });

    // Count unique users
    const uniqueUsers = new Set(relevantLogs.map(log => log.user?.id).filter(Boolean));

    // Get recent errors
    const recentErrors = relevantLogs
        .filter(log => log.severity === 'error' || log.severity === 'critical')
        .slice(0, 10);

    return {
        total: relevantLogs.length,
        today: todayLogs.length,
        errors: (bySeverity.error || 0) + (bySeverity.critical || 0),
        uniqueUsers: uniqueUsers.size,
        byModule,
        byType,
        bySeverity,
        recentErrors,
        period: `${days} days`,
    };
}

/**
 * Clear old logs
 * @param {number} daysToKeep - Number of days to keep
 */
export function clearOldLogs(daysToKeep = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    const beforeCount = activityLogs.length;
    const toKeep = activityLogs.filter(log => new Date(log.timestamp) >= cutoff);

    // Replace array contents
    activityLogs.length = 0;
    activityLogs.push(...toKeep);

    return {
        removed: beforeCount - activityLogs.length,
        remaining: activityLogs.length,
    };
}

/**
 * Get raw logs array (for API)
 */
export function getRawLogs() {
    return activityLogs;
}

// No sample/mock data in production — logs are populated only by real user actions

export default {
    logActivity,
    getActivityLogs,
    getActivityStats,
    clearOldLogs,
    getRawLogs,
    ACTIVITY_TYPES,
    MODULES,
};
