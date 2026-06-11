import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useUser } from './AppContext';

const SmartAssistantContext = createContext(null);

// تكوين المساعد الذكي
const ASSISTANT_CONFIG = {
    useLLM: true, // استخدام Claude API
    fallbackToLocal: true, // الرجوع للمعالجة المحلية عند فشل API
    enableFeedback: true, // تفعيل جمع التغذية الراجعة
    enableRAG: true, // تفعيل البحث الدلالي
    autoLearn: true, // التعلم التلقائي
};

// قاعدة معرفة المساعد لكل موديول
const MODULE_KNOWLEDGE = {
    hr: {
        nameAr: 'الموارد البشرية',
        icon: '👥',
        color: '#3b82f6',
        welcomeMessages: [
            'أهلاً بك في قسم الموارد البشرية! كيف أساعدك اليوم؟',
            'مرحباً! هل تحتاج مساعدة في إدارة شؤون الموظفين؟',
            'أهلاً! أنا هنا لمساعدتك في كل ما يخص الموارد البشرية.',
        ],
        quickActions: [
            { label: 'طلب إجازة', path: '/hr/leaves', icon: '🏖️', description: 'تقديم طلب إجازة جديد' },
            { label: 'سجل الحضور', path: '/hr/attendance', icon: '📊', description: 'عرض سجل الحضور والانصراف' },
            { label: 'بيانات الموظفين', path: '/hr/employees', icon: '👤', description: 'إدارة بيانات الموظفين' },
            { label: 'الرواتب', path: '/hr/salaries', icon: '💰', description: 'عرض كشوف الرواتب' },
        ],
        tips: [
            { title: 'رصيد الإجازات', content: 'يمكنك متابعة رصيد إجازاتك من صفحة الإجازات', type: 'info' },
            { title: 'لائحة العمل', content: 'وفقاً للمادة 109: الإجازة السنوية 21 يوماً للسنة الأولى و30 يوماً بعد 5 سنوات', type: 'policy' },
            { title: 'تذكير', content: 'لا تنسَ تسجيل حضورك يومياً', type: 'reminder' },
        ],
        faqs: [
            { q: 'كيف أقدم طلب إجازة؟', a: 'اذهب إلى صفحة الإجازات > طلب إجازة جديد > حدد النوع والتواريخ > إرسال', path: '/hr/leaves' },
            { q: 'أين أجد رصيد إجازاتي؟', a: 'في صفحة الإجازات ستجد رصيدك المتبقي في الأعلى', path: '/hr/leaves/balances' },
            { q: 'كيف أعدل بياناتي الشخصية؟', a: 'اذهب إلى الموظفين > ابحث عن ملفك > تعديل', path: '/hr/employees' },
            { q: 'ما هي أنواع الإجازات المتاحة؟', a: 'إجازة سنوية، مرضية، اضطرارية، زواج، وفاة، أمومة/أبوة', path: '/hr/leaves' },
        ],
        regulations: {
            leaves: {
                annual: { days: 21, afterFiveYears: 30 },
                sick: { days: 120, paidDays: 30 },
                emergency: { days: 5 },
                marriage: { days: 5 },
                death: { days: 5 },
                maternity: { days: 70 },
                paternity: { days: 3 },
            },
            workingHours: { daily: 8, weekly: 48 },
        },
    },
    warehouse: {
        nameAr: 'المستودعات',
        icon: '📦',
        color: '#10b981',
        welcomeMessages: [
            'مرحباً بك في نظام المستودعات! كيف أساعدك؟',
            'أهلاً! هل تريد مساعدة في إدارة المخزون؟',
            'مرحباً! أنا مساعدك الذكي للمستودعات.',
        ],
        quickActions: [
            { label: 'المخزون الحالي', path: '/warehouse/inventory', icon: '📋', description: 'عرض حالة المخزون' },
            { label: 'طلب صرف', path: '/warehouse/movements', icon: '📤', description: 'إنشاء طلب صرف جديد' },
            { label: 'العهد', path: '/warehouse/custody', icon: '🔑', description: 'إدارة العهد' },
            { label: 'تقارير المخزون', path: '/warehouse/reports', icon: '📊', description: 'تقارير وإحصائيات' },
        ],
        tips: [
            { title: 'الحد الأدنى', content: 'تأكد من متابعة الأصناف التي وصلت للحد الأدنى', type: 'warning' },
            { title: 'الجرد الدوري', content: 'يُنصح بإجراء جرد دوري شهري للمخزون', type: 'info' },
        ],
        faqs: [
            { q: 'كيف أطلب صرف صنف؟', a: 'اذهب إلى حركة المخزون > طلب صرف جديد > حدد الأصناف > إرسال', path: '/warehouse/movements' },
            { q: 'كيف أضيف صنف جديد؟', a: 'اذهب إلى المخزون > إضافة صنف جديد > أدخل البيانات', path: '/warehouse/inventory' },
            { q: 'أين أجد تقرير العهد؟', a: 'في صفحة العهد يمكنك عرض وطباعة تقرير العهد', path: '/warehouse/custody' },
        ],
    },
    movement: {
        nameAr: 'حركة الأسطول',
        icon: '🚗',
        color: '#06b6d4',
        welcomeMessages: [
            'مرحباً بك في نظام حركة الأسطول!',
            'أهلاً! هل تحتاج مساعدة في إدارة المركبات؟',
            'مرحباً! كيف أساعدك في متابعة الأسطول؟',
        ],
        quickActions: [
            { label: 'المركبات', path: '/movement/vehicles', icon: '🚙', description: 'عرض قائمة المركبات' },
            { label: 'الرحلات', path: '/movement/trips', icon: '🛣️', description: 'إدارة الرحلات' },
            { label: 'السائقين', path: '/movement/drivers', icon: '👨‍✈️', description: 'بيانات السائقين' },
            { label: 'الصيانة', path: '/movement/maintenance', icon: '🔧', description: 'جدول الصيانة' },
            { label: 'الوقود', path: '/movement/fuel', icon: '⛽', description: 'سجل الوقود' },
        ],
        tips: [
            { title: 'الصيانة الدورية', content: 'تأكد من جدولة الصيانة الدورية للمركبات', type: 'warning' },
            { title: 'تجديد الرخص', content: 'راجع تواريخ انتهاء رخص المركبات والسائقين', type: 'reminder' },
        ],
        faqs: [
            { q: 'كيف أحجز مركبة؟', a: 'اذهب إلى الرحلات > طلب رحلة جديدة > حدد التفاصيل', path: '/movement/trips' },
            { q: 'أين أسجل تعبئة الوقود؟', a: 'في صفحة الوقود يمكنك إضافة سجل تعبئة جديد', path: '/movement/fuel' },
        ],
    },
    archiving: {
        nameAr: 'الأرشفة الذكية',
        icon: '📂',
        color: '#f59e0b',
        welcomeMessages: [
            'مرحباً بك في نظام الأرشفة الذكية!',
            'أهلاً! كيف أساعدك في إدارة الوثائق؟',
            'مرحباً! أنا هنا لمساعدتك في الأرشفة.',
        ],
        quickActions: [
            { label: 'المعاملات', path: '/archiving/documents', icon: '📄', description: 'عرض المعاملات' },
            { label: 'إضافة معاملة', path: '/archiving/documents', icon: '➕', description: 'إنشاء معاملة جديدة' },
            { label: 'التصنيفات', path: '/archiving/classifications', icon: '🏷️', description: 'إدارة التصنيفات' },
            { label: 'البحث', path: '/archiving', icon: '🔍', description: 'البحث في الأرشيف' },
        ],
        tips: [
            { title: 'الباركود', content: 'يمكنك البحث عن المعاملات باستخدام الباركود', type: 'info' },
            { title: 'التصنيف', content: 'تصنيف المعاملات بشكل صحيح يسهل البحث لاحقاً', type: 'info' },
        ],
        faqs: [
            { q: 'كيف أبحث عن معاملة؟', a: 'استخدم حقل البحث بالباركود أو الرقم أو الموضوع', path: '/archiving' },
            { q: 'كيف أضيف معاملة جديدة؟', a: 'اذهب إلى المعاملات > إضافة معاملة > أدخل البيانات والمرفقات', path: '/archiving/documents' },
        ],
    },
    sadad: {
        nameAr: 'سداد',
        icon: '💳',
        color: '#ec4899',
        welcomeMessages: [
            'مرحباً بك في نظام سداد المالي!',
            'أهلاً! كيف أساعدك في الفواتير والمدفوعات؟',
        ],
        quickActions: [
            { label: 'الفواتير', path: '/sadad/invoices', icon: '🧾', description: 'عرض الفواتير' },
            { label: 'المدفوعات', path: '/sadad/payments', icon: '💵', description: 'سجل المدفوعات' },
            { label: 'المرتجعات', path: '/sadad/refunds', icon: '↩️', description: 'طلبات الاسترداد' },
        ],
        tips: [
            { title: 'الفواتير المستحقة', content: 'راجع الفواتير المستحقة بشكل دوري', type: 'warning' },
        ],
        faqs: [
            { q: 'كيف أسجل دفعة؟', a: 'اذهب إلى المدفوعات > إضافة دفعة > حدد الفاتورة والمبلغ', path: '/sadad/payments' },
        ],
    },
    epm: {
        nameAr: 'قياس الأداء',
        icon: '🎯',
        color: '#8b5cf6',
        welcomeMessages: [
            'مرحباً بك في نظام قياس الأداء!',
            'أهلاً! هل تريد متابعة أدائك أو تقييم فريقك؟',
        ],
        quickActions: [
            { label: 'الأهداف', path: '/epm/goals', icon: '🎯', description: 'أهدافي ومتابعتها' },
            { label: 'التقييمات', path: '/epm/evaluations', icon: '📝', description: 'تقييمات الأداء' },
            { label: 'المؤشرات', path: '/epm/kpis', icon: '📈', description: 'مؤشرات الأداء' },
        ],
        tips: [
            { title: 'تحديث الأهداف', content: 'حدث نسبة إنجاز أهدافك بشكل أسبوعي', type: 'reminder' },
        ],
        faqs: [
            { q: 'كيف أضيف هدف جديد؟', a: 'اذهب إلى الأهداف > إضافة هدف > حدد التفاصيل والموعد', path: '/epm/goals' },
        ],
    },
    analytics: {
        nameAr: 'التحليلات',
        icon: '📊',
        color: '#6366f1',
        welcomeMessages: [
            'مرحباً بك في مركز التحليلات والتقارير!',
            'أهلاً! كيف أساعدك في إنشاء التقارير؟',
        ],
        quickActions: [
            { label: 'التقارير', path: '/analytics/reports', icon: '📋', description: 'التقارير الجاهزة' },
            { label: 'التدقيق', path: '/analytics/audit', icon: '🔍', description: 'سجل التدقيق' },
            { label: 'الامتثال', path: '/analytics/compliance', icon: '✅', description: 'تقارير الامتثال' },
        ],
        tips: [
            { title: 'التصدير', content: 'يمكنك تصدير التقارير بصيغ Excel و PDF', type: 'info' },
        ],
        faqs: [
            { q: 'كيف أنشئ تقرير مخصص؟', a: 'اذهب إلى التقارير > تقرير جديد > حدد المعايير', path: '/analytics/reports' },
        ],
    },
    dashboard: {
        nameAr: 'لوحة التحكم',
        icon: '🏠',
        color: '#1d4ed8',
        welcomeMessages: [
            'مرحباً بك في منصة مسارات!',
            'أهلاً وسهلاً! كيف أساعدك اليوم؟',
            'حياك الله! أنا مساعدك الذكي.',
        ],
        quickActions: [
            { label: 'الموارد البشرية', path: '/hr', icon: '👥', description: 'إدارة الموظفين' },
            { label: 'المستودعات', path: '/warehouse', icon: '📦', description: 'إدارة المخزون' },
            { label: 'الحركة', path: '/movement', icon: '🚗', description: 'إدارة الأسطول' },
            { label: 'الأرشفة', path: '/archiving', icon: '📂', description: 'إدارة الوثائق' },
        ],
        tips: [
            { title: 'تلميح', content: 'يمكنك الوصول لأي نظام من القائمة الجانبية', type: 'info' },
        ],
        faqs: [
            { q: 'كيف أنتقل بين الأنظمة؟', a: 'استخدم القائمة الجانبية للتنقل بين الأنظمة المختلفة', path: '/dashboard' },
        ],
    },
};

// رسائل ترحيب شخصية
const GREETING_TEMPLATES = [
    'حياك الله {name}! كيف أساعدك اليوم؟',
    'أهلاً وسهلاً {name}! ماذا تحتاج؟',
    'مرحباً {name}! أنا هنا لخدمتك.',
    'صباح/مساء الخير {name}! كيف الحال؟',
    'حياك الله يا {name}! جاهز لمساعدتك.',
];

export function SmartAssistantProvider({ children }) {
    const router = useRouter();
    const user = useUser();
    const [currentModule, setCurrentModule] = useState('dashboard');
    const [showWelcomePopup, setShowWelcomePopup] = useState(false);
    const [showAssistantTip, setShowAssistantTip] = useState(false);
    const [currentTip, setCurrentTip] = useState(null);
    const [userContext, setUserContext] = useState({
        visitedPages: [],
        frequentActions: [],
        preferences: {},
        lastActivity: null,
    });
    const [chatHistory, setChatHistory] = useState([]);
    const [isTyping, setIsTyping] = useState(false);

    // حالة جديدة للتكامل مع Claude API
    const [conversationId, setConversationId] = useState(null);
    const [pendingConfirmation, setPendingConfirmation] = useState(null);
    const [isLLMAvailable, setIsLLMAvailable] = useState(ASSISTANT_CONFIG.useLLM);
    const [lastMessageId, setLastMessageId] = useState(null);
    const abortControllerRef = useRef(null);

    // تحديد الموديول الحالي من المسار
    useEffect(() => {
        const path = router.pathname;
        let module = 'dashboard';

        if (path.startsWith('/hr')) module = 'hr';
        else if (path.startsWith('/warehouse')) module = 'warehouse';
        else if (path.startsWith('/movement')) module = 'movement';
        else if (path.startsWith('/archiving')) module = 'archiving';
        else if (path.startsWith('/sadad')) module = 'sadad';
        else if (path.startsWith('/epm')) module = 'epm';
        else if (path.startsWith('/analytics')) module = 'analytics';
        else if (path.startsWith('/agents')) module = 'agents';

        setCurrentModule(module);

        // تسجيل زيارة الصفحة
        setUserContext(prev => ({
            ...prev,
            visitedPages: [...new Set([...prev.visitedPages, path])].slice(-50),
            lastActivity: new Date(),
        }));
    }, [router.pathname]);

    // عرض البوب أب الترحيبية عند الدخول الأول
    useEffect(() => {
        const hasSeenWelcome = localStorage.getItem('masarat_welcome_seen');
        if (!hasSeenWelcome && user?.name) {
            setTimeout(() => {
                setShowWelcomePopup(true);
                localStorage.setItem('masarat_welcome_seen', 'true');
            }, 2000);
        }
    }, [user]);

    // عرض تلميحات دورية
    useEffect(() => {
        const tipInterval = setInterval(() => {
            const moduleKnowledge = MODULE_KNOWLEDGE[currentModule];
            if (moduleKnowledge?.tips?.length > 0) {
                const randomTip = moduleKnowledge.tips[Math.floor(Math.random() * moduleKnowledge.tips.length)];
                setCurrentTip(randomTip);
                setShowAssistantTip(true);
                setTimeout(() => setShowAssistantTip(false), 8000);
            }
        }, 5 * 60 * 1000); // كل 5 دقائق

        return () => clearInterval(tipInterval);
    }, [currentModule]);

    // الحصول على معرفة الموديول الحالي
    const moduleKnowledge = useMemo(() => {
        return MODULE_KNOWLEDGE[currentModule] || MODULE_KNOWLEDGE.dashboard;
    }, [currentModule]);

    // الحصول على رسالة ترحيب شخصية
    const getPersonalGreeting = useCallback(() => {
        const template = GREETING_TEMPLATES[Math.floor(Math.random() * GREETING_TEMPLATES.length)];
        const firstName = user?.name?.split(' ')[0] || 'المستخدم';
        const hour = new Date().getHours();
        let greeting = template.replace('{name}', firstName);

        if (greeting.includes('صباح/مساء')) {
            greeting = greeting.replace('صباح/مساء', hour < 12 ? 'صباح' : 'مساء');
        }

        return greeting;
    }, [user]);

    // معالجة سؤال المستخدم باستخدام Claude API
    const processQuestionWithLLM = useCallback(async (question) => {
        try {
            // إلغاء أي طلب سابق
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            const response = await fetch('/api/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: question,
                    module: currentModule,
                    conversationId,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error('فشل الاتصال بالمساعد');
            }

            const data = await response.json();

            if (data.conversationId) {
                setConversationId(data.conversationId);
            }

            if (data.messageId) {
                setLastMessageId(data.messageId);
            }

            // التحقق من وجود تأكيد معلق
            if (data.requiresConfirmation) {
                setPendingConfirmation({
                    action: data.confirmationAction,
                    data: data.confirmationData,
                    message: data.content,
                });
            }

            return {
                text: data.content,
                actions: data.actions || [],
                tips: data.tips || [],
                data: data.data,
                type: data.type,
                requiresConfirmation: data.requiresConfirmation,
            };

        } catch (error) {
            if (error.name === 'AbortError') {
                return null;
            }
            console.warn('LLM Error:', error);
            setIsLLMAvailable(false);
            return null;
        }
    }, [currentModule, conversationId]);

    // معالجة التأكيد
    const handleConfirmation = useCallback(async (confirmed) => {
        if (!pendingConfirmation) return null;

        try {
            const response = await fetch('/api/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: confirmed ? 'تأكيد' : 'إلغاء',
                    module: currentModule,
                    conversationId,
                    confirmation: {
                        confirmed,
                        action: pendingConfirmation.action,
                        data: pendingConfirmation.data,
                    },
                }),
            });

            const data = await response.json();
            setPendingConfirmation(null);

            return {
                text: data.content,
                actions: data.actions || [],
                success: data.success,
                data: data.data,
            };

        } catch (error) {
            console.warn('Confirmation Error:', error);
            setPendingConfirmation(null);
            return { text: 'حدث خطأ أثناء تنفيذ الإجراء', success: false };
        }
    }, [pendingConfirmation, currentModule, conversationId]);

    // تقديم تقييم
    const submitFeedback = useCallback(async (rating, feedbackType, comment) => {
        if (!ASSISTANT_CONFIG.enableFeedback || !lastMessageId) return;

        try {
            await fetch('/api/assistant/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageId: lastMessageId,
                    conversationId,
                    rating,
                    feedbackType,
                    comment,
                    module: currentModule,
                }),
            });
        } catch (error) {
            console.warn('Feedback Error:', error);
        }
    }, [lastMessageId, conversationId, currentModule]);

    // معالجة سؤال المستخدم (محلياً - للاحتياط)
    const processQuestionLocally = useCallback(async (question) => {
        const lowerQuestion = question.toLowerCase();
        let response = {
            text: '',
            actions: [],
            tips: [],
        };

        // البحث في الأسئلة الشائعة
        const allFaqs = Object.values(MODULE_KNOWLEDGE).flatMap(m => m.faqs || []);
        const matchedFaq = allFaqs.find(faq =>
            lowerQuestion.includes(faq.q.toLowerCase().slice(0, 20)) ||
            faq.q.toLowerCase().includes(lowerQuestion.slice(0, 20))
        );

        if (matchedFaq) {
            response.text = matchedFaq.a;
            if (matchedFaq.path) {
                response.actions.push({
                    label: 'الذهاب للصفحة',
                    path: matchedFaq.path,
                    icon: '➡️',
                });
            }
        }
        // كلمات مفتاحية للتوجيه
        else if (lowerQuestion.includes('إجازة') || lowerQuestion.includes('اجازة')) {
            response.text = 'لتقديم طلب إجازة، اذهب إلى قسم الموارد البشرية > الإجازات. يمكنك اختيار نوع الإجازة وتحديد التواريخ ثم إرسال الطلب للموافقة.';
            response.actions = [
                { label: 'طلب إجازة', path: '/hr/leaves', icon: '🏖️' },
                { label: 'رصيد الإجازات', path: '/hr/leaves/balances', icon: '📊' },
            ];
            response.tips = MODULE_KNOWLEDGE.hr.tips.filter(t => t.title.includes('إجاز'));
        }
        else if (lowerQuestion.includes('حضور') || lowerQuestion.includes('انصراف')) {
            response.text = 'يمكنك متابعة سجل الحضور والانصراف من صفحة الحضور في الموارد البشرية.';
            response.actions = [{ label: 'سجل الحضور', path: '/hr/attendance', icon: '📋' }];
        }
        else if (lowerQuestion.includes('راتب') || lowerQuestion.includes('رواتب')) {
            response.text = 'لعرض كشف الراتب، اذهب إلى قسم الموارد البشرية > الرواتب.';
            response.actions = [{ label: 'كشف الراتب', path: '/hr/salaries', icon: '💰' }];
        }
        else if (lowerQuestion.includes('مخزون') || lowerQuestion.includes('صنف')) {
            response.text = 'يمكنك إدارة المخزون وطلب صرف الأصناف من قسم المستودعات.';
            response.actions = [
                { label: 'المخزون', path: '/warehouse/inventory', icon: '📦' },
                { label: 'طلب صرف', path: '/warehouse/movements', icon: '📤' },
            ];
        }
        else if (lowerQuestion.includes('سيارة') || lowerQuestion.includes('مركبة') || lowerQuestion.includes('رحلة')) {
            response.text = 'لحجز مركبة أو إنشاء رحلة، اذهب إلى قسم حركة الأسطول.';
            response.actions = [
                { label: 'الرحلات', path: '/movement/trips', icon: '🛣️' },
                { label: 'المركبات', path: '/movement/vehicles', icon: '🚙' },
            ];
        }
        else if (lowerQuestion.includes('معاملة') || lowerQuestion.includes('أرشفة') || lowerQuestion.includes('وثيقة')) {
            response.text = 'يمكنك إضافة والبحث عن المعاملات من قسم الأرشفة الذكية.';
            response.actions = [{ label: 'المعاملات', path: '/archiving/documents', icon: '📄' }];
        }
        else if (lowerQuestion.includes('هدف') || lowerQuestion.includes('أداء')) {
            response.text = 'يمكنك إدارة أهدافك ومتابعة أدائك من قسم قياس الأداء.';
            response.actions = [
                { label: 'الأهداف', path: '/epm/goals', icon: '🎯' },
                { label: 'التقييمات', path: '/epm/evaluations', icon: '📝' },
            ];
        }
        else if (lowerQuestion.includes('فاتورة') || lowerQuestion.includes('دفع') || lowerQuestion.includes('سداد')) {
            response.text = 'يمكنك إدارة الفواتير والمدفوعات من قسم سداد.';
            response.actions = [
                { label: 'الفواتير', path: '/sadad/invoices', icon: '🧾' },
                { label: 'المدفوعات', path: '/sadad/payments', icon: '💵' },
            ];
        }
        else {
            // رد افتراضي مع الإجراءات السريعة للموديول الحالي
            response.text = `أنا هنا لمساعدتك في ${moduleKnowledge.nameAr}. يمكنك اختيار أحد الإجراءات السريعة أو سؤالي عن أي شيء.`;
            response.actions = moduleKnowledge.quickActions.slice(0, 4);
        }

        return response;
    }, [moduleKnowledge]);

    // معالجة سؤال المستخدم (الدالة الرئيسية)
    const processQuestion = useCallback(async (question) => {
        setIsTyping(true);
        let response = null;

        // محاولة استخدام Claude API
        if (ASSISTANT_CONFIG.useLLM && isLLMAvailable) {
            response = await processQuestionWithLLM(question);
        }

        // الرجوع للمعالجة المحلية عند الفشل
        if (!response && ASSISTANT_CONFIG.fallbackToLocal) {
            response = await processQuestionLocally(question);
        }

        if (!response) {
            response = {
                text: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
                actions: moduleKnowledge.quickActions.slice(0, 4),
                tips: [],
            };
        }

        // إضافة للسجل
        const userMessage = { type: 'user', text: question, timestamp: new Date() };
        const assistantMessage = { type: 'assistant', ...response, timestamp: new Date() };

        setChatHistory(prev => [...prev, userMessage, assistantMessage]);
        setIsTyping(false);

        return response;
    }, [isLLMAvailable, processQuestionWithLLM, processQuestionLocally, moduleKnowledge]);

    // التنقل لصفحة
    const navigateToPage = useCallback((path) => {
        router.push(path);
    }, [router]);

    // إخفاء البوب أب الترحيبية
    const dismissWelcomePopup = useCallback(() => {
        setShowWelcomePopup(false);
    }, []);

    // إخفاء التلميح
    const dismissTip = useCallback(() => {
        setShowAssistantTip(false);
    }, []);

    // بدء محادثة جديدة
    const startNewConversation = useCallback(() => {
        setConversationId(null);
        setChatHistory([]);
        setPendingConfirmation(null);
        setLastMessageId(null);
    }, []);

    // إيقاف المعالجة الحالية
    const stopProcessing = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsTyping(false);
    }, []);

    const value = {
        // الحالة الأساسية
        currentModule,
        moduleKnowledge,
        showWelcomePopup,
        showAssistantTip,
        currentTip,
        userContext,
        chatHistory,
        isTyping,

        // وظائف المحادثة
        getPersonalGreeting,
        processQuestion,
        navigateToPage,
        dismissWelcomePopup,
        dismissTip,

        // وظائف جديدة للتكامل مع Claude API
        conversationId,
        pendingConfirmation,
        isLLMAvailable,
        handleConfirmation,
        submitFeedback,
        startNewConversation,
        stopProcessing,

        // البيانات المرجعية
        MODULE_KNOWLEDGE,
        ASSISTANT_CONFIG,
    };

    return (
        <SmartAssistantContext.Provider value={value}>
            {children}
        </SmartAssistantContext.Provider>
    );
}

export const useSmartAssistant = () => {
    const context = useContext(SmartAssistantContext);
    if (!context) {
        throw new Error('useSmartAssistant must be used within SmartAssistantProvider');
    }
    return context;
};

export default SmartAssistantContext;
