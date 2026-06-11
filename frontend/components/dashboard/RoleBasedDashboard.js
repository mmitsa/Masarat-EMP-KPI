import React, { useMemo } from 'react';
import Link from 'next/link';
import { ROLES, SYSTEMS, canAccessSystem, SYSTEM_DEFINITIONS, getUserApprovalLevels } from '../../lib/rbac';
import { NAVIGATION } from '../../lib/routes';

/**
 * تكوين لوحة التحكم حسب الدور
 * كل دور له إحصائيات وإجراءات سريعة وأنظمة مختلفة
 */
const roleConfigs = {
    // ========== مدير النظام ==========
    [ROLES.SUPER_ADMIN]: {
        welcomeMessage: 'مرحباً بك في لوحة تحكم المنصة',
        primaryColor: 'blue',
        statsConfig: [
            { key: 'totalEmployees', label: 'إجمالي الموظفين', icon: '👥', color: 'emerald' },
            { key: 'systemHealth', label: 'صحة النظام', icon: '💚', color: 'green', suffix: '%' },
            { key: 'activeUsers', label: 'مستخدمين نشطين', icon: '🟢', color: 'blue' },
            { key: 'pendingRequests', label: 'طلبات معلقة', icon: '⏳', color: 'amber' },
            { key: 'totalSystems', label: 'الأنظمة النشطة', icon: '🖥️', color: 'violet' },
        ],
        quickActions: [
            { label: 'إدارة المستخدمين', icon: '👥', path: '/admin/users', color: 'blue' },
            { label: 'إعدادات النظام', icon: '⚙️', path: '/admin/settings', color: 'gray' },
            { label: 'سجل النشاطات', icon: '📋', path: '/admin/logs', color: 'violet' },
            { label: 'التقارير الشاملة', icon: '📊', path: '/reports', color: 'emerald' },
        ],
        showAllSystems: true,
    },

    // ========== مدير تقنية المعلومات ==========
    [ROLES.IT_DIRECTOR]: {
        welcomeMessage: 'لوحة تحكم تقنية المعلومات',
        primaryColor: 'cyan',
        statsConfig: [
            { key: 'openTickets', label: 'تذاكر مفتوحة', icon: '🎫', color: 'amber' },
            { key: 'systemHealth', label: 'صحة الأنظمة', icon: '💚', color: 'green', suffix: '%' },
            { key: 'activeUsers', label: 'مستخدمين متصلين', icon: '🟢', color: 'blue' },
            { key: 'resolvedToday', label: 'تم حلها اليوم', icon: '✅', color: 'emerald' },
        ],
        quickActions: [
            { label: 'تذاكر الدعم', icon: '🎫', path: '/itsm/tickets', color: 'blue' },
            { label: 'مراقبة الأنظمة', icon: '📡', path: '/admin/monitoring', color: 'cyan' },
            { label: 'إدارة الصلاحيات', icon: '🔐', path: '/admin/permissions', color: 'violet' },
            { label: 'النسخ الاحتياطي', icon: '💾', path: '/admin/backup', color: 'gray' },
        ],
    },

    // ========== مدير الموارد البشرية ==========
    [ROLES.HR_DIRECTOR]: {
        welcomeMessage: 'لوحة تحكم الموارد البشرية',
        primaryColor: 'emerald',
        statsConfig: [
            { key: 'totalEmployees', label: 'إجمالي الموظفين', icon: '👥', color: 'emerald' },
            { key: 'presentToday', label: 'حضور اليوم', icon: '✅', color: 'green' },
            { key: 'pendingLeaves', label: 'طلبات إجازة', icon: '🏖️', color: 'amber' },
            { key: 'newHires', label: 'موظفين جدد', icon: '🆕', color: 'blue' },
        ],
        quickActions: [
            { label: 'سجل الحضور', icon: '📋', path: NAVIGATION.HR.ATTENDANCE, color: 'emerald' },
            { label: 'طلبات الإجازة', icon: '🏖️', path: NAVIGATION.HR.LEAVES, color: 'amber' },
            { label: 'إضافة موظف', icon: '➕', path: NAVIGATION.HR.ADD_EMPLOYEE, color: 'blue' },
            { label: 'تقارير HR', icon: '📊', path: '/hr/reports', color: 'violet' },
        ],
    },

    // ========== مدير الموارد البشرية (الدور القديم) ==========
    [ROLES.HR_MANAGER]: {
        welcomeMessage: 'لوحة تحكم الموارد البشرية',
        primaryColor: 'emerald',
        statsConfig: [
            { key: 'totalEmployees', label: 'إجمالي الموظفين', icon: '👥', color: 'emerald' },
            { key: 'presentToday', label: 'حضور اليوم', icon: '✅', color: 'green' },
            { key: 'pendingLeaves', label: 'طلبات إجازة معلقة', icon: '🏖️', color: 'amber' },
            { key: 'absentToday', label: 'غياب اليوم', icon: '❌', color: 'red' },
        ],
        quickActions: [
            { label: 'سجل الحضور', icon: '📋', path: NAVIGATION.HR.ATTENDANCE, color: 'emerald' },
            { label: 'طلبات الإجازة', icon: '🏖️', path: NAVIGATION.HR.LEAVES, color: 'amber' },
            { label: 'قائمة الموظفين', icon: '👥', path: NAVIGATION.HR.EMPLOYEES, color: 'blue' },
            { label: 'التقييمات', icon: '⭐', path: NAVIGATION.EPM?.DASHBOARD || '/epm', color: 'violet' },
        ],
    },

    // ========== مراقب الدوام ==========
    [ROLES.ATTENDANCE_SUPERVISOR]: {
        welcomeMessage: 'لوحة مراقبة الدوام',
        primaryColor: 'green',
        statsConfig: [
            { key: 'presentToday', label: 'حاضرين الآن', icon: '✅', color: 'green' },
            { key: 'lateToday', label: 'متأخرين', icon: '⏰', color: 'amber' },
            { key: 'absentToday', label: 'غائبين', icon: '❌', color: 'red' },
            { key: 'onLeave', label: 'في إجازة', icon: '🏖️', color: 'blue' },
        ],
        quickActions: [
            { label: 'تسجيل حضور', icon: '📝', path: NAVIGATION.HR.ATTENDANCE, color: 'green' },
            { label: 'الاستثناءات', icon: '⚠️', path: '/hr/attendance/exceptions', color: 'amber' },
            { label: 'تقارير الحضور', icon: '📊', path: '/hr/attendance/reports', color: 'blue' },
            { label: 'الأجهزة', icon: '📱', path: '/hr/attendance/devices', color: 'gray' },
        ],
    },

    // ========== مدير المستودعات ==========
    [ROLES.WAREHOUSE_DIRECTOR]: {
        welcomeMessage: 'لوحة تحكم المستودعات',
        primaryColor: 'blue',
        statsConfig: [
            { key: 'totalItems', label: 'إجمالي الأصناف', icon: '📦', color: 'blue' },
            { key: 'lowStock', label: 'منخفض المخزون', icon: '⚠️', color: 'amber' },
            { key: 'pendingExchange', label: 'طلبات صرف', icon: '📋', color: 'violet' },
            { key: 'todayReceived', label: 'استلام اليوم', icon: '📥', color: 'emerald' },
        ],
        quickActions: [
            { label: 'طلبات الصرف', icon: '📋', path: NAVIGATION.WAREHOUSE.EXCHANGE_LIST, color: 'blue' },
            { label: 'الاستلام', icon: '📥', path: NAVIGATION.WAREHOUSE.RECEIVE, color: 'emerald' },
            { label: 'الجرد', icon: '📊', path: NAVIGATION.WAREHOUSE.INVENTORY_FORM, color: 'violet' },
            { label: 'تقارير المخزون', icon: '📈', path: '/warehouse/reports', color: 'gray' },
        ],
    },

    // ========== أمين المستودع ==========
    [ROLES.WAREHOUSE_KEEPER]: {
        welcomeMessage: 'لوحة أمين المستودع',
        primaryColor: 'blue',
        statsConfig: [
            { key: 'myCustody', label: 'عهدتي', icon: '🔑', color: 'blue' },
            { key: 'pendingExchange', label: 'طلبات معلقة', icon: '⏳', color: 'amber' },
            { key: 'todayExchanged', label: 'صرف اليوم', icon: '📤', color: 'emerald' },
            { key: 'lowStock', label: 'تنبيهات المخزون', icon: '⚠️', color: 'red' },
        ],
        quickActions: [
            { label: 'طلبات الصرف', icon: '📋', path: NAVIGATION.WAREHOUSE.EXCHANGE_LIST, color: 'blue' },
            { label: 'صرف جديد', icon: '➕', path: NAVIGATION.WAREHOUSE.EXCHANGE_NEW, color: 'emerald' },
            { label: 'عهدتي', icon: '🔑', path: NAVIGATION.WAREHOUSE.CUSTODY, color: 'violet' },
            { label: 'البحث', icon: '🔍', path: NAVIGATION.WAREHOUSE.ITEMS, color: 'gray' },
        ],
    },

    // ========== مراقب المخزون ==========
    [ROLES.INVENTORY_CONTROLLER]: {
        welcomeMessage: 'لوحة مراقب المخزون',
        primaryColor: 'violet',
        statsConfig: [
            { key: 'pendingApproval', label: 'بانتظار الاعتماد', icon: '⏳', color: 'amber' },
            { key: 'approvedToday', label: 'اعتمدت اليوم', icon: '✅', color: 'emerald' },
            { key: 'inventoryAudits', label: 'محاضر الجرد', icon: '📋', color: 'violet' },
            { key: 'adjustments', label: 'التسويات', icon: '🔄', color: 'blue' },
        ],
        quickActions: [
            { label: 'الاعتمادات المعلقة', icon: '⏳', path: NAVIGATION.WAREHOUSE.EXCHANGE_LIST + '?status=pending', color: 'amber' },
            { label: 'محاضر الجرد', icon: '📋', path: NAVIGATION.WAREHOUSE.INVENTORY_FORM, color: 'violet' },
            { label: 'التسويات', icon: '🔄', path: '/warehouse/adjustments', color: 'blue' },
            { label: 'التقارير', icon: '📊', path: '/warehouse/reports', color: 'gray' },
        ],
    },

    // ========== مدير الحركة ==========
    [ROLES.FLEET_MANAGER]: {
        welcomeMessage: 'لوحة إدارة الأسطول',
        primaryColor: 'cyan',
        statsConfig: [
            { key: 'totalVehicles', label: 'المركبات', icon: '🚗', color: 'cyan' },
            { key: 'activeTrips', label: 'رحلات نشطة', icon: '🛣️', color: 'emerald' },
            { key: 'maintenanceDue', label: 'صيانة مطلوبة', icon: '🔧', color: 'amber' },
            { key: 'availableDrivers', label: 'سائقين متاحين', icon: '👨‍✈️', color: 'blue' },
        ],
        quickActions: [
            { label: 'المركبات', icon: '🚗', path: NAVIGATION.MOVEMENT.VEHICLES, color: 'cyan' },
            { label: 'الرحلات', icon: '🛣️', path: NAVIGATION.MOVEMENT.TRIPS, color: 'emerald' },
            { label: 'السائقين', icon: '👨‍✈️', path: NAVIGATION.MOVEMENT.DRIVERS, color: 'blue' },
            { label: 'الصيانة', icon: '🔧', path: NAVIGATION.MOVEMENT.MAINTENANCE, color: 'amber' },
        ],
    },

    // ========== المدير المالي ==========
    [ROLES.FINANCE_DIRECTOR]: {
        welcomeMessage: 'لوحة الإدارة المالية',
        primaryColor: 'emerald',
        statsConfig: [
            { key: 'monthlyBudget', label: 'الميزانية الشهرية', icon: '💰', color: 'emerald' },
            { key: 'pendingPayments', label: 'مدفوعات معلقة', icon: '💳', color: 'amber' },
            { key: 'receivables', label: 'الذمم المدينة', icon: '📥', color: 'blue' },
            { key: 'payables', label: 'الذمم الدائنة', icon: '📤', color: 'violet' },
        ],
        quickActions: [
            { label: 'الأستاذ العام', icon: '📚', path: '/finance/ledger', color: 'emerald' },
            { label: 'الفواتير', icon: '🧾', path: '/finance/invoices', color: 'blue' },
            { label: 'الميزانية', icon: '💰', path: '/finance/budget', color: 'violet' },
            { label: 'التقارير المالية', icon: '📊', path: '/finance/reports', color: 'gray' },
        ],
    },

    // ========== مدير المشاريع ==========
    [ROLES.PROJECT_MANAGER]: {
        welcomeMessage: 'لوحة إدارة المشاريع',
        primaryColor: 'indigo',
        statsConfig: [
            { key: 'activeProjects', label: 'مشاريع نشطة', icon: '📋', color: 'indigo' },
            { key: 'myTasks', label: 'مهامي', icon: '✅', color: 'emerald' },
            { key: 'overdueTasks', label: 'مهام متأخرة', icon: '⚠️', color: 'red' },
            { key: 'upcomingDeadlines', label: 'مواعيد قريبة', icon: '📅', color: 'amber' },
        ],
        quickActions: [
            { label: 'مشاريعي', icon: '📋', path: NAVIGATION.PROJECTS?.LIST || '/projects', color: 'indigo' },
            { label: 'مهامي', icon: '✅', path: NAVIGATION.PROJECTS?.MY_TASKS || '/projects/tasks/my', color: 'emerald' },
            { label: 'إنشاء مشروع', icon: '➕', path: '/projects/new', color: 'blue' },
            { label: 'التقارير', icon: '📊', path: '/projects/reports', color: 'gray' },
        ],
    },

    // ========== رئيس القسم ==========
    [ROLES.DEPARTMENT_HEAD]: {
        welcomeMessage: 'لوحة رئيس القسم',
        primaryColor: 'violet',
        statsConfig: [
            { key: 'teamMembers', label: 'أعضاء الفريق', icon: '👥', color: 'violet' },
            { key: 'pendingApprovals', label: 'طلبات معلقة', icon: '⏳', color: 'amber' },
            { key: 'teamPresent', label: 'حاضرين اليوم', icon: '✅', color: 'emerald' },
            { key: 'departmentTasks', label: 'مهام القسم', icon: '📋', color: 'blue' },
        ],
        quickActions: [
            { label: 'اعتماد الطلبات', icon: '✅', path: '/approvals/pending', color: 'amber' },
            { label: 'فريق العمل', icon: '👥', path: '/department/team', color: 'violet' },
            { label: 'حضور القسم', icon: '📋', path: NAVIGATION.HR.ATTENDANCE, color: 'emerald' },
            { label: 'تقارير القسم', icon: '📊', path: '/department/reports', color: 'gray' },
        ],
    },

    // ========== موظف عام ==========
    [ROLES.EMPLOYEE]: {
        welcomeMessage: 'مرحباً بك',
        primaryColor: 'blue',
        statsConfig: [
            { key: 'myLeaveBalance', label: 'رصيد الإجازات', icon: '🏖️', color: 'blue' },
            { key: 'myTasks', label: 'مهامي', icon: '✅', color: 'emerald' },
            { key: 'myCustody', label: 'عهدتي', icon: '🔑', color: 'violet' },
            { key: 'myAttendance', label: 'حضوري الشهري', icon: '📅', color: 'cyan' },
        ],
        quickActions: [
            { label: 'طلب إجازة', icon: '🏖️', path: NAVIGATION.HR.LEAVES + '?action=new', color: 'blue' },
            { label: 'سجل حضوري', icon: '📋', path: NAVIGATION.HR.ATTENDANCE + '?view=my', color: 'emerald' },
            { label: 'مهامي', icon: '✅', path: NAVIGATION.PROJECTS?.MY_TASKS || '/projects/tasks/my', color: 'violet' },
            { label: 'طلب دعم فني', icon: '🛠️', path: '/itsm/tickets/new', color: 'cyan' },
        ],
    },
};

/**
 * الحصول على تكوين لوحة التحكم للمستخدم
 */
export function getDashboardConfig(userRoles = []) {
    // ترتيب الأولوية للأدوار
    const rolePriority = [
        ROLES.SUPER_ADMIN,
        ROLES.IT_DIRECTOR,
        ROLES.HR_DIRECTOR,
        ROLES.WAREHOUSE_DIRECTOR,
        ROLES.FINANCE_DIRECTOR,
        ROLES.HR_MANAGER,
        ROLES.FLEET_MANAGER,
        ROLES.PROJECT_MANAGER,
        ROLES.ATTENDANCE_SUPERVISOR,
        ROLES.WAREHOUSE_KEEPER,
        ROLES.INVENTORY_CONTROLLER,
        ROLES.DEPARTMENT_HEAD,
        ROLES.EMPLOYEE,
    ];

    // البحث عن أعلى دور متاح
    for (const role of rolePriority) {
        if (userRoles.includes(role) && roleConfigs[role]) {
            return { ...roleConfigs[role], primaryRole: role };
        }
    }

    // الافتراضي: موظف
    return { ...roleConfigs[ROLES.EMPLOYEE], primaryRole: ROLES.EMPLOYEE };
}

/**
 * تصفية الأنظمة المتاحة للمستخدم
 */
export function getAccessibleSystems(userRoles = [], tenantId = null) {
    return Object.values(SYSTEM_DEFINITIONS).filter(system =>
        canAccessSystem(userRoles, system.id, tenantId)
    );
}

/**
 * مكون قسم "يتطلب انتباهك"
 */
export function AttentionRequiredSection({ items = [], darkMode = false }) {
    if (!items || items.length === 0) return null;

    const priorityColors = {
        high: darkMode
            ? 'bg-red-900/30 border-red-700 text-red-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
        medium: darkMode
            ? 'bg-amber-900/30 border-amber-700 text-amber-300'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 text-amber-700',
        low: darkMode
            ? 'bg-blue-900/30 border-blue-700 text-blue-300'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    };

    return (
        <div className={`rounded-2xl p-6 mb-6 ${
            darkMode
                ? 'bg-gradient-to-r from-amber-900/20 to-red-900/20 border border-amber-800/50'
                : 'bg-gradient-to-r from-amber-50 to-red-50 border border-amber-200 dark:border-amber-800'
        }`}>
            <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl animate-pulse">⚠️</span>
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    يتطلب انتباهك
                </h2>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                    {items.length}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.slice(0, 6).map((item, index) => (
                    <Link
                        key={item.id || index}
                        href={item.link || '#'}
                        className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${priorityColors[item.priority || 'medium']}`}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-xl">{item.icon || '📋'}</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.title}</p>
                                <p className="text-xs opacity-75 mt-1">{item.description}</p>
                                {item.count > 0 && (
                                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs bg-white/20">
                                        {item.count} عنصر
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {items.length > 6 && (
                <div className="mt-4 text-center">
                    <Link
                        href="/notifications"
                        className={`text-sm font-medium ${
                            darkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'
                        }`}
                    >
                        عرض الكل ({items.length})  ←
                    </Link>
                </div>
            )}
        </div>
    );
}

/**
 * مكون الإجراءات السريعة
 */
export function QuickActionsGrid({ actions = [], darkMode = false }) {
    const colorClasses = {
        blue: darkMode ? 'bg-blue-900/30 hover:bg-blue-900/50 text-blue-300' : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-700 dark:text-blue-300',
        emerald: darkMode ? 'bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-300' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700',
        amber: darkMode ? 'bg-amber-900/30 hover:bg-amber-900/50 text-amber-300' : 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 text-amber-700',
        violet: darkMode ? 'bg-violet-900/30 hover:bg-violet-900/50 text-violet-300' : 'bg-violet-50 hover:bg-violet-100 text-violet-700',
        cyan: darkMode ? 'bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-300' : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700',
        gray: darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 text-gray-700 dark:text-gray-200',
        indigo: darkMode ? 'bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700',
        red: darkMode ? 'bg-red-900/30 hover:bg-red-900/50 text-red-300' : 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-700 dark:text-red-300',
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {actions.map((action, index) => (
                <Link
                    key={index}
                    href={action.path || '#'}
                    className={`p-4 rounded-xl transition-all hover:scale-105 flex flex-col items-center gap-2 ${
                        colorClasses[action.color] || colorClasses.blue
                    }`}
                >
                    <span className="text-2xl">{action.icon}</span>
                    <span className="text-sm font-medium text-center">{action.label}</span>
                </Link>
            ))}
        </div>
    );
}

/**
 * مكون رأس الترحيب المحسّن
 */
export function EnhancedWelcomeHeader({
    user,
    config,
    greeting,
    currentTime,
    darkMode = false,
    approvalLevels = []
}) {
    const getRoleBadge = (role) => {
        const roleNames = {
            [ROLES.SUPER_ADMIN]: 'مدير النظام',
            [ROLES.IT_DIRECTOR]: 'مدير تقنية المعلومات',
            [ROLES.HR_DIRECTOR]: 'مدير الموارد البشرية',
            [ROLES.HR_MANAGER]: 'مدير الموارد البشرية',
            [ROLES.WAREHOUSE_DIRECTOR]: 'مدير المستودعات',
            [ROLES.WAREHOUSE_KEEPER]: 'أمين المستودع',
            [ROLES.INVENTORY_CONTROLLER]: 'مراقب المخزون',
            [ROLES.FLEET_MANAGER]: 'مدير الحركة',
            [ROLES.FINANCE_DIRECTOR]: 'المدير المالي',
            [ROLES.PROJECT_MANAGER]: 'مدير المشاريع',
            [ROLES.ATTENDANCE_SUPERVISOR]: 'مراقب الدوام',
            [ROLES.DEPARTMENT_HEAD]: 'رئيس القسم',
            [ROLES.EMPLOYEE]: 'موظف',
        };
        return roleNames[role] || 'مستخدم';
    };

    const primaryColorClasses = {
        blue: darkMode ? 'from-blue-900/50 to-indigo-900/50 border-blue-800' : 'from-blue-50 to-indigo-50 border-blue-200 dark:border-blue-800',
        emerald: darkMode ? 'from-emerald-900/50 to-teal-900/50 border-emerald-800' : 'from-emerald-50 to-teal-50 border-emerald-200',
        cyan: darkMode ? 'from-cyan-900/50 to-blue-900/50 border-cyan-800' : 'from-cyan-50 to-blue-50 border-cyan-200',
        violet: darkMode ? 'from-violet-900/50 to-purple-900/50 border-violet-800' : 'from-violet-50 to-purple-50 border-violet-200',
        indigo: darkMode ? 'from-indigo-900/50 to-violet-900/50 border-indigo-800' : 'from-indigo-50 to-violet-50 border-indigo-200',
        green: darkMode ? 'from-green-900/50 to-emerald-900/50 border-green-800' : 'from-green-50 to-emerald-50 border-green-200 dark:border-green-800',
    };

    return (
        <div className={`mb-6 p-6 rounded-2xl bg-gradient-to-r border ${
            primaryColorClasses[config.primaryColor] || primaryColorClasses.blue
        }`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* معلومات المستخدم */}
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${
                        darkMode ? 'bg-white/10' : 'bg-white dark:bg-gray-900 shadow-sm'
                    }`}>
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                            <span className={darkMode ? 'text-white' : 'text-gray-700 dark:text-gray-200'}>
                                {(user?.name || 'م').charAt(0)}
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl">👋</span>
                            <h1 className={`text-xl lg:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                {greeting}، {user?.name || 'المستخدم'}
                            </h1>
                        </div>

                        <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                            {config.welcomeMessage}
                        </p>

                        {/* الأدوار والمعلومات */}
                        <div className="flex flex-wrap items-center gap-2">
                            {config.primaryRole && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    darkMode ? 'bg-white/10 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 shadow-sm'
                                }`}>
                                    {getRoleBadge(config.primaryRole)}
                                </span>
                            )}

                            {user?.department && (
                                <span className={`px-3 py-1 rounded-full text-xs ${
                                    darkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                                }`}>
                                    📍 {user.department}
                                </span>
                            )}

                            {approvalLevels.length > 0 && (
                                <span className={`px-3 py-1 rounded-full text-xs ${
                                    darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'
                                }`}>
                                    ✅ صلاحية اعتماد
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* التاريخ والوقت */}
                <div className={`flex flex-col items-start lg:items-end gap-2`}>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                        {currentTime}
                    </p>

                    {user?.tenant && (
                        <span className={`px-3 py-1 rounded-lg text-xs ${
                            darkMode ? 'bg-white/5 text-gray-500 dark:text-gray-400' : 'bg-white/50 text-gray-500 dark:text-gray-400'
                        }`}>
                            🏢 {user.tenant}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * مكون بطاقة النظام المحسّنة
 */
export function EnhancedSystemCard({ system, status, darkMode = false }) {
    const colorClasses = {
        emerald: darkMode
            ? 'bg-emerald-900/20 border-emerald-800 hover:border-emerald-600 hover:bg-emerald-900/30'
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100',
        blue: darkMode
            ? 'bg-blue-900/20 border-blue-800 hover:border-blue-600 hover:bg-blue-900/30'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-400 hover:shadow-blue-100',
        amber: darkMode
            ? 'bg-amber-900/20 border-amber-800 hover:border-amber-600 hover:bg-amber-900/30'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:border-amber-400 hover:shadow-amber-100',
        violet: darkMode
            ? 'bg-violet-900/20 border-violet-800 hover:border-violet-600 hover:bg-violet-900/30'
            : 'bg-violet-50 border-violet-200 hover:border-violet-400 hover:shadow-violet-100',
        purple: darkMode
            ? 'bg-purple-900/20 border-purple-800 hover:border-purple-600 hover:bg-purple-900/30'
            : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:border-purple-400 hover:shadow-purple-100',
        cyan: darkMode
            ? 'bg-cyan-900/20 border-cyan-800 hover:border-cyan-600 hover:bg-cyan-900/30'
            : 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 hover:border-cyan-400 hover:shadow-cyan-100',
        indigo: darkMode
            ? 'bg-indigo-900/20 border-indigo-800 hover:border-indigo-600 hover:bg-indigo-900/30'
            : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-100',
        pink: darkMode
            ? 'bg-pink-900/20 border-pink-800 hover:border-pink-600 hover:bg-pink-900/30'
            : 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 hover:border-pink-400 hover:shadow-pink-100',
    };

    // تحويل لون النظام إلى المفتاح الصحيح
    const getColorKey = (color) => {
        const colorMap = {
            '#3b82f6': 'blue',
            '#10b981': 'emerald',
            '#f59e0b': 'amber',
            '#8b5cf6': 'violet',
            '#06b6d4': 'cyan',
            '#ec4899': 'pink',
            '#6366f1': 'indigo',
            '#7c3aed': 'purple',
            '#059669': 'emerald',
        };
        return colorMap[color] || 'blue';
    };

    const colorKey = getColorKey(system.color);
    const safePath = system.path || '#';

    return (
        <Link
            href={safePath}
            className={`block p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                colorClasses[colorKey] || colorClasses.blue
            }`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    darkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-900 shadow-sm'
                }`}>
                    {system.icon}
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                        status === 'نشط' || status === 'active'
                            ? 'bg-green-500 animate-pulse'
                            : 'bg-gray-400'
                    }`} />
                </div>
            </div>

            <h3 className={`font-bold text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {system.nameAr || system.name}
            </h3>

            <p className={`text-sm mb-3 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {system.description}
            </p>

            <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${
                    status === 'نشط' || status === 'active'
                        ? darkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
                        : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'
                }`}>
                    {status === 'نشط' || status === 'active' ? 'نشط' : 'غير متصل'}
                </span>

                <svg className={`w-5 h-5 ${darkMode ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </div>
        </Link>
    );
}

export default {
    getDashboardConfig,
    getAccessibleSystems,
    AttentionRequiredSection,
    QuickActionsGrid,
    EnhancedWelcomeHeader,
    EnhancedSystemCard,
    roleConfigs,
};