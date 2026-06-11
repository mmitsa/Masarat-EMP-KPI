/**
 * Action Handlers Index
 * تصدير جميع معالجات الإجراءات
 */

export { HRActionHandler } from './hr-action-handler';
export { WarehouseActionHandler } from './warehouse-action-handler';
export { MovementActionHandler } from './movement-action-handler';
export { ArchivingActionHandler } from './archiving-action-handler';
export { SadadActionHandler } from './sadad-action-handler';
export { EPMActionHandler } from './epm-action-handler';

/**
 * Navigation Handler
 * معالج التنقل - متاح للجميع
 */
export class NavigationHandler {
    constructor(router) {
        this.router = router;
    }

    /**
     * خريطة الوجهات
     */
    static DESTINATIONS = {
        // الموارد البشرية
        'الإجازات': '/hr/leaves',
        'إجازة': '/hr/leaves',
        'طلب إجازة': '/hr/leaves',
        'الحضور': '/hr/attendance',
        'الموظفين': '/hr/employees',
        'الموظفون': '/hr/employees',
        'الرواتب': '/hr/salaries',
        'الموارد البشرية': '/hr',

        // المستودعات
        'المستودع': '/warehouse',
        'المستودعات': '/warehouse',
        'المخزون': '/warehouse/inventory',
        'طلب صرف': '/warehouse/movements',
        'الصرف': '/warehouse/movements',
        'العهد': '/warehouse/custody',

        // الحركة
        'الأسطول': '/movement',
        'حركة الأسطول': '/movement',
        'المركبات': '/movement/vehicles',
        'السيارات': '/movement/vehicles',
        'الرحلات': '/movement/trips',
        'السائقين': '/movement/drivers',
        'الصيانة': '/movement/maintenance',
        'الوقود': '/movement/fuel',

        // الأرشفة
        'الأرشفة': '/archiving',
        'المعاملات': '/archiving/documents',
        'الوثائق': '/archiving/documents',

        // سداد
        'سداد': '/sadad',
        'الفواتير': '/sadad/invoices',
        'المدفوعات': '/sadad/payments',

        // قياس الأداء
        'قياس الأداء': '/epm',
        'الأداء': '/epm',
        'الأهداف': '/epm/goals',
        'التقييم': '/epm/evaluations',

        // التحليلات
        'التحليلات': '/analytics',
        'التقارير': '/analytics/reports',

        // الرئيسية
        'الرئيسية': '/dashboard',
        'لوحة التحكم': '/dashboard',
    };

    /**
     * التنقل لوجهة
     */
    async navigateTo({ destination }) {
        const normalizedDest = destination.trim();

        // البحث في خريطة الوجهات
        let path = NavigationHandler.DESTINATIONS[normalizedDest];

        // بحث جزئي إذا لم يوجد تطابق كامل
        if (!path) {
            for (const [key, value] of Object.entries(NavigationHandler.DESTINATIONS)) {
                if (key.includes(normalizedDest) || normalizedDest.includes(key)) {
                    path = value;
                    break;
                }
            }
        }

        if (!path) {
            return {
                success: false,
                error: `لم أتمكن من تحديد الوجهة: "${destination}"`,
                suggestion: 'جرب وصفاً أوضح مثل: الإجازات، المستودع، المركبات',
                availableDestinations: Object.keys(NavigationHandler.DESTINATIONS).slice(0, 10),
            };
        }

        return {
            success: true,
            type: 'navigation',
            data: {
                path,
                destination: normalizedDest,
            },
            message: `جاري الانتقال إلى ${normalizedDest}...`,
            action: 'navigate',
            actionData: { path },
        };
    }

    /**
     * عرض المساعدة
     */
    async getHelp({ topic }) {
        const helpTopics = {
            'إجازة': {
                title: 'طلب الإجازات',
                content: [
                    '1. اذهب إلى صفحة الإجازات',
                    '2. اضغط على "طلب إجازة جديد"',
                    '3. اختر نوع الإجازة والتواريخ',
                    '4. أضف السبب والموظف البديل',
                    '5. اضغط إرسال',
                ],
            },
            'صرف': {
                title: 'طلب صرف من المستودع',
                content: [
                    '1. اذهب إلى صفحة حركة المخزون',
                    '2. اضغط على "طلب صرف جديد"',
                    '3. ابحث عن الأصناف المطلوبة',
                    '4. حدد الكميات',
                    '5. أرسل الطلب للموافقة',
                ],
            },
            'حجز': {
                title: 'حجز مركبة',
                content: [
                    '1. اذهب إلى صفحة الرحلات',
                    '2. اضغط على "طلب رحلة جديدة"',
                    '3. حدد التاريخ والوجهة',
                    '4. أضف تفاصيل المهمة',
                    '5. أرسل الطلب',
                ],
            },
        };

        // البحث عن الموضوع
        let helpContent = null;
        for (const [key, value] of Object.entries(helpTopics)) {
            if (topic.includes(key) || key.includes(topic)) {
                helpContent = value;
                break;
            }
        }

        if (!helpContent) {
            return {
                success: true,
                type: 'help',
                message: `يمكنني مساعدتك في:\n• طلب إجازة\n• طلب صرف من المستودع\n• حجز مركبة\n• البحث عن معلومات\n\nما الذي تريد معرفته؟`,
            };
        }

        return {
            success: true,
            type: 'help',
            data: helpContent,
            message: `📖 ${helpContent.title}:\n\n${helpContent.content.join('\n')}`,
        };
    }
}

/**
 * الحصول على معالج حسب الوحدة
 */
export function getHandler(module, userId, userRoles, accessToken) {
    const handlers = {
        hr: () => new HRActionHandler(userId, userRoles, accessToken),
        warehouse: () => new WarehouseActionHandler(userId, userRoles, accessToken),
        movement: () => new MovementActionHandler(userId, userRoles, accessToken),
        archiving: () => new ArchivingActionHandler(userId, userRoles, accessToken),
        sadad: () => new SadadActionHandler(userId, userRoles, accessToken),
        epm: () => new EPMActionHandler(userId, userRoles, accessToken),
        navigation: () => new NavigationHandler(),
    };

    const handlerFactory = handlers[module];
    return handlerFactory ? handlerFactory() : null;
}

/**
 * تنفيذ دالة
 */
export async function executeFunction(functionName, args, context) {
    const { module, userId, userRoles, accessToken } = context;

    // تحديد الوحدة من اسم الدالة
    let targetModule = module;
    if (functionName.startsWith('navigate') || functionName.startsWith('get_help')) {
        targetModule = 'navigation';
    }

    const handler = getHandler(targetModule, userId, userRoles, accessToken);
    if (!handler) {
        return {
            success: false,
            error: `لا يوجد معالج للوحدة: ${targetModule}`,
        };
    }

    // البحث عن الدالة في المعالج
    const methodName = functionName.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    const method = handler[methodName] || handler[functionName];

    if (typeof method !== 'function') {
        return {
            success: false,
            error: `الدالة غير موجودة: ${functionName}`,
        };
    }

    try {
        return await method.call(handler, args);
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}

export default {
    HRActionHandler,
    WarehouseActionHandler,
    MovementActionHandler,
    ArchivingActionHandler,
    SadadActionHandler,
    EPMActionHandler,
    NavigationHandler,
    getHandler,
    executeFunction,
};
