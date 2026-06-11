/**
 * تعريفات خطوات الجولة التعريفية
 * Guided Tour Step Definitions
 *
 * كل موديول له جولة خاصة تشرح وظائف الشاشة
 * يتم اكتشاف الجولة تلقائياً بناءً على مسار الصفحة
 */

/**
 * ربط مسار الصفحة بمعرّف الجولة
 * @param {string} pathname - مسار الراوتر
 * @returns {string|null} معرّف الجولة أو null
 */
export function detectTourForPath(pathname) {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/hr' || pathname.startsWith('/hr/')) return 'hr';
    if (pathname === '/warehouse' || pathname.startsWith('/warehouse/')) return 'warehouse';
    if (pathname === '/movement' || pathname.startsWith('/movement/')) return 'movement';
    if (pathname === '/archiving' || pathname.startsWith('/archiving/')) return 'archiving';
    if (pathname === '/epm' || pathname.startsWith('/epm/')) return 'epm';
    if (pathname === '/finance' || pathname.startsWith('/finance/')) return 'finance';
    if (pathname === '/sadad' || pathname.startsWith('/sadad/')) return 'sadad';
    if (pathname === '/projects' || pathname.startsWith('/projects/')) return 'projects';
    if (pathname === '/analytics' || pathname.startsWith('/analytics/')) return 'analytics';
    if (pathname === '/agents' || pathname.startsWith('/agents/')) return 'agents';
    if (pathname === '/grc' || pathname.startsWith('/grc/')) return 'grc';
    if (pathname === '/settings') return 'settings';
    return null;
}

/**
 * تعريفات الجولات لكل موديول
 */
export const TOUR_STEPS = {
    // ==================== لوحة التحكم ====================
    dashboard: {
        id: 'dashboard',
        version: 1,
        title: 'مرحباً بك في لوحة التحكم',
        steps: [
            {
                target: '[data-tour="sidebar"]',
                title: 'القائمة الجانبية',
                description: 'من هنا يمكنك التنقل بين جميع أنظمة المنصة مثل الموارد البشرية والمستودعات والحركة والأرشفة وغيرها.',
                icon: '📋',
                placement: 'left',
            },
            {
                target: '[data-tour="header-search"]',
                title: 'البحث السريع',
                description: 'ابحث عن أي شيء في المنصة: موظفين، معاملات، أصناف، مركبات، وأكثر. يمكنك أيضاً استخدام الاختصار Ctrl+K.',
                icon: '🔍',
                placement: 'bottom',
            },
            {
                target: '[data-tour="header-notifications"]',
                title: 'الإشعارات',
                description: 'ستجد هنا جميع الإشعارات والتنبيهات المهمة مثل الموافقات المطلوبة والتحديثات الجديدة.',
                icon: '🔔',
                placement: 'bottom',
            },
            {
                target: '[data-tour="dashboard-welcome"]',
                title: 'ملخص يومك',
                description: 'نظرة سريعة على أهم الإحصائيات والمهام المطلوبة منك اليوم.',
                icon: '📊',
                placement: 'bottom',
            },
            {
                target: '[data-tour="widget-area"]',
                title: 'منطقة الويدجات',
                description: 'هذه المنطقة تعرض الأدوات والإحصائيات المخصصة. يمكنك تخصيصها حسب احتياجاتك.',
                icon: '🧩',
                placement: 'top',
            },
            {
                target: '[data-tour="floating-buttons"]',
                title: 'الأدوات المساعدة',
                description: 'المساعد الذكي يجيب عن أسئلتك، والمحادثة الداخلية للتواصل مع زملائك في العمل.',
                icon: '💬',
                placement: 'right',
            },
        ],
    },

    // ==================== الموارد البشرية ====================
    hr: {
        id: 'hr',
        version: 1,
        title: 'نظام الموارد البشرية',
        steps: [
            {
                target: '[data-tour="hr-stats"]',
                title: 'ملخص الإحصائيات',
                description: 'نظرة سريعة على أهم أرقام الموارد البشرية: إجمالي الموظفين، نسبة الحضور، الطلبات المعلقة، والإجازات النشطة.',
                icon: '📈',
            },
            {
                target: '[data-tour="hr-quick-actions"]',
                title: 'الإجراءات السريعة',
                description: 'اختصارات لأكثر العمليات استخداماً: إضافة موظف جديد، طلب إجازة، مسير الرواتب، تقييم الأداء.',
                icon: '⚡',
            },
            {
                target: '[data-tour="hr-tabs"]',
                title: 'أقسام النظام',
                description: 'يمكنك التبديل بين الأقسام المختلفة: الموظفين، الحضور والانصراف، الإجازات، الرواتب، والهيكل التنظيمي.',
                icon: '📂',
            },
            {
                target: '[data-tour="hr-pending-requests"]',
                title: 'الطلبات المعلقة',
                description: 'جدول يعرض جميع الطلبات التي تحتاج موافقتك أو اتخاذ إجراء مع إمكانية البحث والفلترة.',
                icon: '📋',
            },
        ],
    },

    // ==================== المستودعات ====================
    warehouse: {
        id: 'warehouse',
        version: 1,
        title: 'نظام المستودعات',
        steps: [
            {
                target: '[data-tour="sidebar"]',
                title: 'القائمة الجانبية',
                description: 'يمكنك العودة للوحة التحكم الرئيسية أو التنقل لأي نظام آخر من القائمة الجانبية.',
                icon: '📋',
                placement: 'left',
            },
            {
                target: '[data-tour="wh-stats"]',
                title: 'ملخص المستودعات',
                description: 'يعرض عدد الأصناف الإجمالي، طلبات الصرف النشطة، الموافقات المعلقة، وقيمة العهد.',
                icon: '📦',
            },
        ],
    },

    // ==================== حركة الأسطول ====================
    movement: {
        id: 'movement',
        version: 1,
        title: 'نظام حركة الأسطول',
        steps: [
            {
                target: '[data-tour="mv-stats"]',
                title: 'إحصائيات الأسطول',
                description: 'أرقام سريعة: عدد المركبات، السائقين النشطين، المهام الجارية، طلبات الصيانة.',
                icon: '📊',
            },
            {
                target: '[data-tour="mv-map"]',
                title: 'خريطة التتبع',
                description: 'تتبع مواقع جميع المركبات في الوقت الفعلي على الخريطة التفاعلية مع حالة كل مركبة.',
                icon: '🗺️',
            },
            {
                target: '[data-tour="mv-tabs"]',
                title: 'أقسام النظام',
                description: 'يمكنك التبديل بين: الخريطة، المركبات، السائقين، المهام، الصيانة، والوقود.',
                icon: '🔄',
            },
        ],
    },

    // ==================== الأرشفة ====================
    archiving: {
        id: 'archiving',
        version: 1,
        title: 'نظام الأرشفة الذكية',
        steps: [
            {
                target: '[data-tour="arch-stats"]',
                title: 'ملخص الأرشيف',
                description: 'إحصائيات شاملة: عدد المعاملات الكلي، المعاملات الواردة والصادرة، ونسبة الإنجاز.',
                icon: '📂',
            },
            {
                target: '[data-tour="floating-buttons"]',
                title: 'المساعد الذكي',
                description: 'يمكنك استخدام المساعد الذكي لمساعدتك في البحث عن المعاملات أو الإجابة على استفساراتك.',
                icon: '🤖',
                placement: 'right',
            },
        ],
    },

    // ==================== تقييم الأداء ====================
    epm: {
        id: 'epm',
        version: 1,
        title: 'نظام تقييم الأداء',
        steps: [
            {
                target: '[data-tour="sidebar"]',
                title: 'مرحباً بك في نظام تقييم الأداء',
                description: 'هنا يمكنك متابعة تقييمات الموظفين والأهداف ومؤشرات الأداء. استخدم القائمة الجانبية للتنقل.',
                icon: '🎯',
                placement: 'left',
            },
            {
                target: '[data-tour="header-search"]',
                title: 'البحث في التقييمات',
                description: 'يمكنك البحث عن أي موظف أو تقييم من خلال شريط البحث.',
                icon: '🔍',
                placement: 'bottom',
            },
        ],
    },

    // ==================== المالية ====================
    finance: {
        id: 'finance',
        version: 1,
        title: 'النظام المالي',
        steps: [
            {
                target: '[data-tour="sidebar"]',
                title: 'مرحباً بك في النظام المالي',
                description: 'هنا يمكنك إدارة الميزانية والمصروفات والإيرادات والقيود المحاسبية.',
                icon: '💰',
                placement: 'left',
            },
            {
                target: '[data-tour="header-search"]',
                title: 'البحث في القيود والفواتير',
                description: 'استخدم البحث السريع للوصول لأي قيد محاسبي أو فاتورة.',
                icon: '🔍',
                placement: 'bottom',
            },
        ],
    },

    // ==================== سداد ====================
    sadad: {
        id: 'sadad',
        version: 1,
        title: 'نظام سداد',
        steps: [
            {
                target: '[data-tour="sidebar"]',
                title: 'مرحباً بك في نظام سداد',
                description: 'هنا يمكنك إدارة المدفوعات والفواتير والأقساط والتقارير المالية.',
                icon: '💳',
                placement: 'left',
            },
            {
                target: '[data-tour="floating-buttons"]',
                title: 'المساعد الذكي',
                description: 'استخدم المساعد الذكي للاستفسار عن حالة الفواتير أو المدفوعات.',
                icon: '🤖',
                placement: 'right',
            },
        ],
    },

    // ==================== المشاريع ====================
    projects: {
        id: 'projects',
        version: 1,
        title: 'نظام إدارة المشاريع',
        steps: [
            {
                target: '[data-tour="sidebar"]',
                title: 'مرحباً بك في نظام إدارة المشاريع',
                description: 'هنا يمكنك إنشاء ومتابعة المشاريع والمهام ومراقبة نسب الإنجاز.',
                icon: '📋',
                placement: 'left',
            },
            {
                target: '[data-tour="header-search"]',
                title: 'البحث في المشاريع',
                description: 'ابحث عن أي مشروع أو مهمة من شريط البحث.',
                icon: '🔍',
            },
        ],
    },

    // ==================== التحليلات ====================
    analytics: {
        id: 'analytics',
        version: 1,
        title: 'نظام التحليلات',
        steps: [
            {
                target: '[data-tour="sidebar"]',
                title: 'مرحباً بك في نظام التحليلات',
                description: 'هنا يمكنك استعراض الرسوم البيانية والإحصائيات الشاملة عن أداء جميع أنظمة المنصة.',
                icon: '📊',
                placement: 'left',
            },
            {
                target: '[data-tour="header-notifications"]',
                title: 'التنبيهات',
                description: 'ستصلك إشعارات عند وجود تغييرات مهمة في المؤشرات أو تقارير جديدة.',
                icon: '🔔',
                placement: 'bottom',
            },
        ],
    },

    // ==================== الوكلاء الذكيين ====================
    agents: {
        id: 'agents',
        version: 1,
        title: 'نظام الوكلاء الذكيين',
        steps: [
            {
                target: '[data-tour="sidebar"]',
                title: 'مرحباً بك في نظام الوكلاء الذكيين',
                description: 'هنا يمكنك إدارة الوكلاء الذكيين ومتابعة المهام المؤتمتة وسجلات الأداء.',
                icon: '🤖',
                placement: 'left',
            },
            {
                target: '[data-tour="floating-buttons"]',
                title: 'المساعد الذكي',
                description: 'يمكنك التحدث مع المساعد الذكي لإنشاء مهام جديدة أو متابعة حالة الوكلاء.',
                icon: '💬',
                placement: 'right',
            },
        ],
    },

    // ==================== الحوكمة والمخاطر ====================
    grc: {
        id: 'grc',
        version: 1,
        title: 'نظام الحوكمة والمخاطر والامتثال',
        steps: [
            {
                target: '[data-tour="sidebar"]',
                title: 'مرحباً بك في نظام GRC',
                description: 'هنا يمكنك إدارة المخاطر والضوابط الرقابية ومتابعة نسب الامتثال.',
                icon: '🛡️',
                placement: 'left',
            },
            {
                target: '[data-tour="header-search"]',
                title: 'البحث في الضوابط',
                description: 'ابحث عن أي ضابط أو خطر أو سياسة من شريط البحث.',
                icon: '🔍',
                placement: 'bottom',
            },
        ],
    },

    // ==================== الإعدادات ====================
    settings: {
        id: 'settings',
        version: 1,
        title: 'إعدادات المنصة',
        steps: [
            {
                target: '[data-tour="sidebar"]',
                title: 'إعدادات المنصة',
                description: 'هنا يمكنك تعديل بياناتك الشخصية وتفضيلات المظهر والإشعارات.',
                icon: '⚙️',
                placement: 'left',
            },
            {
                target: '[data-tour="header-notifications"]',
                title: 'إعدادات الإشعارات',
                description: 'يمكنك التحكم في أنواع الإشعارات التي تصلك من هنا.',
                icon: '🔔',
                placement: 'bottom',
            },
        ],
    },
};

/**
 * الحصول على جولة بمعرّفها
 * @param {string} tourId
 * @returns {object|null}
 */
export function getTourById(tourId) {
    return TOUR_STEPS[tourId] || null;
}

/**
 * الحصول على جميع معرّفات الجولات
 * @returns {string[]}
 */
export function getAllTourIds() {
    return Object.keys(TOUR_STEPS);
}
