/**
 * AI Assistant Service
 * خدمة المساعد الذكي المدعوم بـ Claude AI
 *
 * يوفر مساعد ذكي سياقي لكل وحدة في المنصة الموحدة
 */

/**
 * معلومات الوحدات المتاحة
 */
const MODULES_INFO = {
    dashboard: {
        nameAr: 'لوحة التحكم',
        description: 'لوحة التحكم الرئيسية للمنصة الموحدة',
        capabilities: ['عرض الإحصائيات', 'الوصول السريع', 'إدارة الحساب'],
    },
    hr: {
        nameAr: 'الموارد البشرية',
        description: 'نظام إدارة الموارد البشرية',
        capabilities: ['إدارة الموظفين', 'الرواتب', 'الحضور والانصراف', 'الإجازات', 'تقييم الأداء'],
    },
    warehouse: {
        nameAr: 'المستودعات',
        description: 'نظام إدارة المستودعات والمخزون',
        capabilities: ['إدارة المخزون', 'حركة المواد', 'تقارير المخزون', 'الجرد'],
    },
    movement: {
        nameAr: 'إدارة الحركة',
        description: 'نظام إدارة الآليات والسائقين',
        capabilities: ['إدارة الآليات', 'إدارة السائقين', 'طلبات الحركة', 'الصيانة'],
    },
    archiving: {
        nameAr: 'الأرشيف',
        description: 'نظام إدارة الأرشيف والوثائق',
        capabilities: ['أرشفة الوثائق', 'البحث في الأرشيف', 'إدارة التصنيف', 'OCR'],
    },
    epm: {
        nameAr: 'إدارة الأداء',
        description: 'نظام إدارة أداء الموظفين',
        capabilities: ['تقييم الأداء', 'الأهداف', 'KPIs', 'التطوير الوظيفي'],
    },
    sadad: {
        nameAr: 'سداد',
        description: 'نظام المدفوعات والتحصيل',
        capabilities: ['الفواتير', 'المدفوعات', 'سداد', 'التقارير المالية'],
    },
    analytics: {
        nameAr: 'التحليلات',
        description: 'نظام التحليلات والتقارير',
        capabilities: ['لوحات المعلومات', 'التقارير التحليلية', 'KPIs', 'التنبؤات'],
    },
    agents: {
        nameAr: 'الوكلاء الأذكياء',
        description: 'نظام إدارة الوكلاء الأذكياء',
        capabilities: ['إدارة الوكلاء', 'المهام التلقائية', 'التعلم الآلي'],
    },
};

/**
 * الإجراءات السريعة حسب الوحدة
 */
const QUICK_ACTIONS = {
    dashboard: [
        { id: 'stats', label: 'عرض الإحصائيات', icon: '📊' },
        { id: 'notifications', label: 'الإشعارات', icon: '🔔' },
        { id: 'profile', label: 'ملفي الشخصي', icon: '👤' },
    ],
    hr: [
        { id: 'employees', label: 'قائمة الموظفين', icon: '👥' },
        { id: 'add_employee', label: 'إضافة موظف', icon: '➕' },
        { id: 'attendance', label: 'الحضور', icon: '📅' },
        { id: 'leaves', label: 'الإجازات', icon: '🏖️' },
        { id: 'payroll', label: 'الرواتب', icon: '💰' },
    ],
    warehouse: [
        { id: 'inventory', label: 'المخزون', icon: '📦' },
        { id: 'add_item', label: 'إضافة صنف', icon: '➕' },
        { id: 'transfer', label: 'نقل مواد', icon: '🔄' },
        { id: 'reports', label: 'التقارير', icon: '📊' },
    ],
    movement: [
        { id: 'vehicles', label: 'الآليات', icon: '🚗' },
        { id: 'drivers', label: 'السائقين', icon: '👨‍✈️' },
        { id: 'new_request', label: 'طلب حركة جديد', icon: '➕' },
        { id: 'maintenance', label: 'الصيانة', icon: '🔧' },
    ],
    archiving: [
        { id: 'documents', label: 'الوثائق', icon: '📄' },
        { id: 'upload', label: 'رفع وثيقة', icon: '⬆️' },
        { id: 'search', label: 'البحث', icon: '🔍' },
        { id: 'categories', label: 'التصنيفات', icon: '📂' },
    ],
};

/**
 * رسائل الترحيب حسب الوحدة
 */
const WELCOME_MESSAGES = {
    dashboard: 'مرحباً بك في المنصة الموحدة! كيف يمكنني مساعدتك اليوم؟',
    hr: 'مرحباً بك في نظام الموارد البشرية. أنا هنا لمساعدتك في إدارة شؤون الموظفين.',
    warehouse: 'مرحباً بك في نظام المستودعات. كيف يمكنني مساعدتك في إدارة المخزون؟',
    movement: 'مرحباً بك في نظام إدارة الحركة. أنا هنا لمساعدتك في إدارة الآليات والسائقين.',
    archiving: 'مرحباً بك في نظام الأرشيف. كيف يمكنني مساعدتك في إدارة الوثائق؟',
};

/**
 * AssistantService - خدمة المساعد الذكي
 */
export class AssistantService {
    constructor(userContext, module = 'dashboard') {
        this.userContext = userContext;
        this.currentModule = module;
        this.conversationId = null;
        this.conversationHistory = [];
        this.lastConfirmation = null;

        // معلومات المستخدم
        this.userId = userContext.userId;
        this.userName = userContext.userName;
        this.userRole = userContext.userRole;
    }

    /**
     * تغيير الوحدة الحالية
     */
    setModule(module) {
        if (MODULES_INFO[module]) {
            this.currentModule = module;
            this.addSystemMessage(`تم التبديل إلى وحدة ${MODULES_INFO[module].nameAr}`);
        }
    }

    /**
     * الحصول على رسالة الترحيب
     */
    getWelcomeMessage() {
        const moduleInfo = MODULES_INFO[this.currentModule];
        return WELCOME_MESSAGES[this.currentModule] || WELCOME_MESSAGES.dashboard;
    }

    /**
     * الحصول على الإجراءات السريعة
     */
    getQuickActions() {
        return QUICK_ACTIONS[this.currentModule] || QUICK_ACTIONS.dashboard;
    }

    /**
     * معالجة رسالة من المستخدم
     */
    async processMessage(message) {
        // إضافة رسالة المستخدم للسجل
        this.addUserMessage(message);

        try {
            // تحليل نية المستخدم
            const intent = this.detectIntent(message);

            // معالجة حسب النية
            let response;
            switch (intent.type) {
                case 'navigation':
                    response = this.handleNavigation(intent.target);
                    break;
                case 'query':
                    response = await this.handleQuery(message, intent);
                    break;
                case 'action':
                    response = await this.handleAction(intent.action, intent.params);
                    break;
                case 'help':
                    response = this.handleHelp(intent.topic);
                    break;
                default:
                    response = await this.handleGeneralQuery(message);
            }

            // إضافة رد المساعد للسجل
            this.addAssistantMessage(response.text);

            return response;

        } catch (error) {
            console.error('Error processing message:', error);
            const errorResponse = {
                text: 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.',
                error: true,
            };
            this.addAssistantMessage(errorResponse.text);
            return errorResponse;
        }
    }

    /**
     * تأكيد وتنفيذ إجراء
     */
    async confirmAndExecute(functionName, args) {
        this.addSystemMessage(`تأكيد تنفيذ: ${functionName}`);

        try {
            // هنا يمكن تنفيذ الإجراءات الفعلية عبر API
            // مؤقتاً نعيد رسالة نجاح
            const response = {
                text: `تم تنفيذ الإجراء بنجاح: ${functionName}`,
                success: true,
            };

            this.addAssistantMessage(response.text);
            return response;

        } catch (error) {
            console.error('Error executing action:', error);
            const errorResponse = {
                text: `حدث خطأ أثناء تنفيذ الإجراء: ${error.message}`,
                error: true,
            };
            this.addAssistantMessage(errorResponse.text);
            return errorResponse;
        }
    }

    /**
     * كشف نية المستخدم من الرسالة
     */
    detectIntent(message) {
        const lowerMessage = message.toLowerCase().trim();

        // التنقل
        if (lowerMessage.includes('اذهب إلى') || lowerMessage.includes('افتح') || lowerMessage.includes('انتقل')) {
            for (const [key, info] of Object.entries(MODULES_INFO)) {
                if (lowerMessage.includes(info.nameAr.toLowerCase())) {
                    return { type: 'navigation', target: key };
                }
            }
        }

        // المساعدة
        if (lowerMessage.includes('مساعدة') || lowerMessage.includes('help') || lowerMessage === '؟') {
            return { type: 'help', topic: this.currentModule };
        }

        // إجراءات محددة
        const actionKeywords = {
            'إضافة': 'add',
            'حذف': 'delete',
            'تعديل': 'edit',
            'عرض': 'view',
            'بحث': 'search',
            'تقرير': 'report',
        };

        for (const [arabicKeyword, action] of Object.entries(actionKeywords)) {
            if (lowerMessage.includes(arabicKeyword)) {
                return {
                    type: 'action',
                    action: action,
                    params: this.extractActionParams(message, action),
                };
            }
        }

        // استعلام
        if (lowerMessage.includes('كم') || lowerMessage.includes('ما هو') || lowerMessage.includes('أين')) {
            return { type: 'query', subtype: 'info' };
        }

        // افتراضي: استعلام عام
        return { type: 'general' };
    }

    /**
     * استخراج معاملات الإجراء من الرسالة
     */
    extractActionParams(message, action) {
        // هنا يمكن إضافة منطق أكثر تعقيداً لاستخراج المعلومات
        return { raw: message };
    }

    /**
     * معالجة التنقل
     */
    handleNavigation(target) {
        const moduleInfo = MODULES_INFO[target];
        return {
            text: `سأنتقل بك إلى ${moduleInfo.nameAr}`,
            action: {
                type: 'navigate',
                route: `/${target}`,
            },
        };
    }

    /**
     * معالجة استعلام
     */
    async handleQuery(message, intent) {
        // هنا يمكن إضافة تكامل مع Claude API للاستعلامات المعقدة
        const moduleInfo = MODULES_INFO[this.currentModule];

        return {
            text: `سأساعدك في ${moduleInfo.nameAr}. ${message}`,
            suggestions: this.getQuickActions().slice(0, 3),
        };
    }

    /**
     * معالجة إجراء
     */
    async handleAction(action, params) {
        const actionTexts = {
            add: 'إضافة',
            delete: 'حذف',
            edit: 'تعديل',
            view: 'عرض',
            search: 'بحث',
            report: 'تقرير',
        };

        const actionText = actionTexts[action] || action;

        // التحقق من الصلاحيات (مبسط)
        if (action === 'delete' && !this.userContext.canDelete) {
            return {
                text: 'عذراً، ليس لديك صلاحية الحذف.',
                error: true,
            };
        }

        // إجراءات تحتاج تأكيد
        if (['delete', 'edit'].includes(action)) {
            return {
                text: `هل أنت متأكد من رغبتك في ${actionText}؟`,
                confirmationRequired: {
                    functionName: `${action}_${this.currentModule}`,
                    arguments: params,
                },
            };
        }

        // إجراءات مباشرة
        return {
            text: `سأقوم بـ${actionText} الآن...`,
            action: {
                type: action,
                module: this.currentModule,
                params: params,
            },
        };
    }

    /**
     * معالجة طلب المساعدة
     */
    handleHelp(topic) {
        const moduleInfo = MODULES_INFO[topic || this.currentModule];

        let helpText = `## ${moduleInfo.nameAr}\n\n`;
        helpText += `${moduleInfo.description}\n\n`;
        helpText += '### الإمكانيات المتاحة:\n';
        moduleInfo.capabilities.forEach(cap => {
            helpText += `• ${cap}\n`;
        });

        return {
            text: helpText,
            quickActions: this.getQuickActions(),
        };
    }

    /**
     * معالجة استعلام عام
     */
    async handleGeneralQuery(message) {
        // هنا يمكن إضافة تكامل مع Claude API
        // مؤقتاً نعيد رد بسيط

        const responses = [
            'يمكنني مساعدتك في العديد من المهام. هل تريد معرفة المزيد؟',
            'لست متأكداً من فهمي لطلبك. هل يمكنك توضيح المزيد؟',
            'أنا هنا لمساعدتك! يمكنك سؤالي عن أي شيء متعلق بـ' + MODULES_INFO[this.currentModule].nameAr,
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        return {
            text: randomResponse,
            suggestions: this.getQuickActions().slice(0, 3),
        };
    }

    /**
     * إضافة رسالة مستخدم للسجل
     */
    addUserMessage(text) {
        this.conversationHistory.push({
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * إضافة رد المساعد للسجل
     */
    addAssistantMessage(text) {
        this.conversationHistory.push({
            role: 'assistant',
            content: text,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * إضافة رسالة نظام للسجل
     */
    addSystemMessage(text) {
        this.conversationHistory.push({
            role: 'system',
            content: text,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * الحصول على سجل المحادثة
     */
    getConversationHistory() {
        return this.conversationHistory;
    }

    /**
     * مسح سجل المحادثة
     */
    clearHistory() {
        this.conversationHistory = [];
        this.lastConfirmation = null;
    }
}

/**
 * إنشاء مساعد من جلسة المستخدم
 */
export function createAssistantFromSession(session, module = 'dashboard') {
    const userContext = {
        userId: session.user?.nationalId || session.user?.id || 'unknown',
        userName: session.user?.name || 'مستخدم',
        userRole: session.user?.role || 'user',
        userEmail: session.user?.email,
        // الصلاحيات (مبسطة - يجب جلبها من النظام الفعلي)
        canDelete: ['admin', 'super_admin'].includes(session.user?.role),
        canEdit: true,
        canView: true,
    };

    return new AssistantService(userContext, module);
}

/**
 * تكامل مع Claude API (اختياري)
 * يمكن استخدامه للاستعلامات المعقدة
 */
export async function queryClaudeAPI(message, context) {
    // هذا مثال - يحتاج إلى مفتاح API فعلي
    // const response = await fetch('https://api.anthropic.com/v1/messages', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'x-api-key': process.env.ANTHROPIC_API_KEY,
    //         'anthropic-version': '2023-06-01',
    //     },
    //     body: JSON.stringify({
    //         model: 'claude-3-sonnet-20240229',
    //         max_tokens: 1024,
    //         messages: [{
    //             role: 'user',
    //             content: message,
    //         }],
    //         system: `أنت مساعد ذكي للمنصة الموحدة الحكومية. السياق: ${JSON.stringify(context)}`,
    //     }),
    // });
    // return await response.json();

    // مؤقتاً نعيد null
    return null;
}

export default {
    AssistantService,
    createAssistantFromSession,
    queryClaudeAPI,
};
