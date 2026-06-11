import React, { createContext, useContext, useState, useEffect } from 'react';

// Base URL for API calls
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080';

// Default/fallback data
const defaultData = {
    sections: [
        { key: 'hero', titleAr: 'القسم الرئيسي', isVisible: true, displayOrder: 1 },
        { key: 'modules', titleAr: 'الأنظمة والوحدات', isVisible: true, displayOrder: 2 },
        { key: 'stats', titleAr: 'الإحصائيات', isVisible: true, displayOrder: 3 },
        { key: 'pricing', titleAr: 'الأسعار', isVisible: true, displayOrder: 4 },
        { key: 'testimonials', titleAr: 'آراء العملاء', isVisible: true, displayOrder: 5 },
        { key: 'faq', titleAr: 'الأسئلة الشائعة', isVisible: true, displayOrder: 6 },
        { key: 'cta', titleAr: 'دعوة للعمل', isVisible: true, displayOrder: 7 },
        { key: 'footer', titleAr: 'ذيل الصفحة', isVisible: true, displayOrder: 8 },
    ],
    modules: [
        {
            code: 'hr',
            nameAr: 'الموارد البشرية',
            icon: '👥',
            descriptionAr: 'إدارة شاملة للموظفين والرواتب والحضور',
            features: ['إدارة بيانات الموظفين', 'نظام الرواتب', 'تتبع الحضور', 'إدارة الإجازات'],
            benefits: ['تقليل الأخطاء البشرية', 'توفير الوقت والجهد'],
            gradient: 'from-blue-500 to-indigo-600',
            isActive: true,
            displayOrder: 1,
        },
        {
            code: 'warehouse',
            nameAr: 'المستودعات',
            icon: '📦',
            descriptionAr: 'تتبع المخزون والعهد بدقة عالية',
            features: ['إدارة المخزون', 'تتبع الأصناف', 'الجرد الدوري', 'التقارير المتقدمة'],
            benefits: ['تقليل الفاقد', 'تحسين الكفاءة'],
            gradient: 'from-amber-500 to-orange-600',
            isActive: true,
            displayOrder: 2,
        },
        {
            code: 'archiving',
            nameAr: 'الأرشفة الذكية',
            icon: '📂',
            descriptionAr: 'أرشفة وبحث ذكي للوثائق',
            features: ['مسح ضوئي', 'OCR ذكي', 'بحث متقدم', 'تصنيف تلقائي'],
            benefits: ['سهولة الوصول', 'توفير المساحة'],
            gradient: 'from-purple-500 to-pink-600',
            isActive: true,
            displayOrder: 3,
        },
        {
            code: 'movement',
            nameAr: 'إدارة الحركة',
            icon: '🚗',
            descriptionAr: 'تتبع المركبات والسائقين',
            features: ['تتبع GPS', 'إدارة المركبات', 'جدولة الرحلات', 'تقارير الوقود'],
            benefits: ['تحسين الكفاءة', 'تقليل التكاليف'],
            gradient: 'from-green-500 to-teal-600',
            isActive: true,
            displayOrder: 4,
        },
        {
            code: 'sadad',
            nameAr: 'سداد',
            icon: '💳',
            descriptionAr: 'فوترة إلكترونية متوافقة مع ZATCA',
            features: ['فواتير إلكترونية', 'ربط ZATCA', 'تقارير مالية', 'دعم QR'],
            benefits: ['التوافق الحكومي', 'السرعة والدقة'],
            gradient: 'from-cyan-500 to-blue-600',
            isActive: true,
            displayOrder: 5,
        },
        {
            code: 'epm',
            nameAr: 'إدارة الأداء',
            icon: '🎯',
            descriptionAr: 'تقييم وتطوير الموظفين',
            features: ['مؤشرات الأداء', 'التقييم الدوري', 'خطط التطوير', 'المكافآت'],
            benefits: ['تحسين الأداء', 'زيادة الإنتاجية'],
            gradient: 'from-rose-500 to-red-600',
            isActive: true,
            displayOrder: 6,
        },
    ],
    pricing: [
        {
            nameAr: 'الأساسية',
            nameEn: 'Basic',
            priceMonthly: 500,
            priceYearly: 5000,
            features: ['حتى 10 مستخدمين', 'نظامان فقط', 'دعم بالبريد', 'تخزين 10 GB'],
            isActive: true,
            isPopular: false,
        },
        {
            nameAr: 'الاحترافية',
            nameEn: 'Professional',
            priceMonthly: 1500,
            priceYearly: 15000,
            features: ['حتى 50 مستخدم', 'كل الأنظمة', 'دعم 24/7', 'تخزين 100 GB', 'API متاح'],
            isActive: true,
            isPopular: true,
        },
        {
            nameAr: 'المؤسسية',
            nameEn: 'Enterprise',
            priceMonthly: 5000,
            priceYearly: 50000,
            features: ['مستخدمين غير محدود', 'كل الأنظمة + Premium', 'مدير حساب مخصص', 'تخزين غير محدود', 'SLA متقدم'],
            isActive: true,
            isPopular: false,
        },
    ],
    testimonials: [
        {
            clientName: 'أحمد محمد الشهري',
            clientPosition: 'مدير تقنية المعلومات',
            companyName: 'شركة الفجر للتجارة',
            contentAr: 'منصة مسارات غيرت طريقة عملنا بالكامل. الآن نستطيع إدارة جميع عمليات الشركة من مكان واحد.',
            rating: 5,
            highlight: 'زيادة الإنتاجية 40%',
            isActive: true,
        },
        {
            clientName: 'سارة أحمد العتيبي',
            clientPosition: 'مدير الموارد البشرية',
            companyName: 'مؤسسة النور',
            contentAr: 'نظام الموارد البشرية ممتاز وسهل الاستخدام. وفر علينا ساعات عمل طويلة.',
            rating: 5,
            highlight: 'توفير 60% من الوقت',
            isActive: true,
        },
        {
            clientName: 'خالد عبدالله المالكي',
            clientPosition: 'المدير التنفيذي',
            companyName: 'مجموعة الأمل',
            contentAr: 'الدعم الفني استثنائي والفريق دائماً متواجد للمساعدة. أنصح بالمنصة بشدة.',
            rating: 5,
            highlight: 'دعم فني 24/7',
            isActive: true,
        },
    ],
    faqs: [
        {
            questionAr: 'ما هي مدة التجربة المجانية؟',
            answerAr: 'نوفر تجربة مجانية كاملة لمدة 14 يوماً يمكنك خلالها تجربة جميع مميزات المنصة بدون أي التزام أو بطاقة ائتمان.',
            category: 'general',
            isActive: true,
        },
        {
            questionAr: 'هل يمكنني ترقية أو تخفيض الباقة؟',
            answerAr: 'نعم، يمكنك تغيير باقتك في أي وقت. عند الترقية يتم احتساب الفرق تناسبياً، وعند التخفيض يتم الاحتفاظ بالرصيد لصالحك.',
            category: 'pricing',
            isActive: true,
        },
        {
            questionAr: 'ما مستوى أمان البيانات؟',
            answerAr: 'نستخدم تشفير SSL 256-bit ونحتفظ بنسخ احتياطية يومية. جميع البيانات مخزنة في مراكز بيانات معتمدة داخل المملكة.',
            category: 'technical',
            isActive: true,
        },
        {
            questionAr: 'هل تتوفر خدمة تدريب للموظفين؟',
            answerAr: 'نعم، نوفر تدريباً شاملاً عبر الإنترنت مجاناً، بالإضافة إلى دورات تدريبية في الموقع للباقات المؤسسية.',
            category: 'support',
            isActive: true,
        },
        {
            questionAr: 'هل المنصة متوافقة مع ZATCA؟',
            answerAr: 'نعم، نظام سداد متوافق تماماً مع متطلبات هيئة الزكاة والضريبة والجمارك للفوترة الإلكترونية.',
            category: 'technical',
            isActive: true,
        },
        {
            questionAr: 'كيف يمكنني التواصل مع الدعم الفني؟',
            answerAr: 'يمكنك التواصل عبر الدردشة المباشرة، البريد الإلكتروني، أو الاتصال المباشر. نوفر دعماً على مدار الساعة للباقات الاحترافية والمؤسسية.',
            category: 'support',
            isActive: true,
        },
    ],
    stats: [
        {
            value: 500,
            suffix: '+',
            labelAr: 'مؤسسة تستخدم المنصة',
            descriptionAr: 'في مختلف القطاعات',
            icon: '🏢',
            gradient: 'from-blue-400 to-indigo-500',
            isActive: true,
        },
        {
            value: 50000,
            suffix: '+',
            labelAr: 'مستخدم نشط',
            descriptionAr: 'يومياً على المنصة',
            icon: '👥',
            gradient: 'from-green-400 to-emerald-500',
            isActive: true,
        },
        {
            value: 99.9,
            suffix: '%',
            labelAr: 'وقت التشغيل',
            descriptionAr: 'مضمون ومستقر',
            icon: '⚡',
            gradient: 'from-amber-400 to-orange-500',
            isActive: true,
        },
        {
            value: 24,
            suffix: '/7',
            labelAr: 'دعم فني',
            descriptionAr: 'متواصل بدون انقطاع',
            icon: '🛟',
            gradient: 'from-purple-400 to-fuchsia-500',
            isActive: true,
        },
    ],
    partners: [
        { name: 'شركة الفجر للتجارة', logoUrl: '', isActive: true },
        { name: 'مؤسسة النور', logoUrl: '', isActive: true },
        { name: 'مجموعة الأمل', logoUrl: '', isActive: true },
        { name: 'شركة البناء الحديث', logoUrl: '', isActive: true },
    ],
    features: [
        {
            title: 'أمان على مستوى البنوك',
            description: 'تشفير SSL 256-bit وحماية متعددة الطبقات مع مراقبة أمنية على مدار الساعة',
            icon: '🔒',
            gradient: 'from-blue-500 to-indigo-600',
        },
        {
            title: 'تحديثات مستمرة',
            description: 'تحديثات تلقائية ومميزات جديدة شهرياً بدون انقطاع الخدمة',
            icon: '🔄',
            gradient: 'from-green-500 to-teal-600',
        },
        {
            title: 'تكامل سلس',
            description: 'واجهات برمجة تطبيقات مفتوحة للتكامل مع أنظمتك الحالية',
            icon: '🔗',
            gradient: 'from-purple-500 to-pink-600',
        },
        {
            title: 'نسخ احتياطي يومي',
            description: 'حماية بياناتك مع نسخ احتياطي تلقائي يومي وإمكانية استرجاع فوري',
            icon: '☁️',
            gradient: 'from-cyan-500 to-blue-600',
        },
        {
            title: 'دعم متعدد اللغات',
            description: 'واجهة عربية بالكامل مع دعم للغة الإنجليزية',
            icon: '🌍',
            gradient: 'from-orange-500 to-red-600',
        },
        {
            title: 'تقارير ذكية',
            description: 'تحليلات متقدمة ولوحات بيانات تفاعلية لاتخاذ قرارات أفضل',
            icon: '📊',
            gradient: 'from-yellow-500 to-amber-600',
        },
    ],
    certifications: [
        { name: 'ISO 27001', description: 'معايير أمن المعلومات' },
        { name: 'SOC 2', description: 'ضوابط أمنية' },
        { name: 'ZATCA', description: 'متوافق مع الفوترة الإلكترونية' },
        { name: 'PDPL', description: 'حماية البيانات الشخصية' },
    ],
};

const LandingContext = createContext(null);

export function LandingProvider({ children }) {
    const [data, setData] = useState(defaultData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLandingData();
    }, []);

    const fetchLandingData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${GATEWAY_URL}/api/saas/landing/public/data`);

            if (!response.ok) {
                throw new Error('Failed to fetch landing data');
            }

            const apiData = await response.json();

            // Merge API data with defaults (API data takes priority)
            setData(prevData => ({
                ...prevData,
                sections: apiData.sections?.length ? apiData.sections : prevData.sections,
                modules: apiData.modules?.length ? apiData.modules : prevData.modules,
                pricing: apiData.pricing?.length ? apiData.pricing : prevData.pricing,
                testimonials: apiData.testimonials?.length ? apiData.testimonials : prevData.testimonials,
                faqs: apiData.faqs?.length ? apiData.faqs : prevData.faqs,
                stats: apiData.stats?.length ? apiData.stats : prevData.stats,
                partners: apiData.partners?.length ? apiData.partners : prevData.partners,
            }));
        } catch (err) {
            console.log('Using default landing data:', err.message);
            // Keep using default data on error
            setError(null); // Don't show error to users since defaults work
        }

        setLoading(false);
    };

    const isSectionVisible = (sectionKey) => {
        const section = data.sections.find(s => s.key === sectionKey);
        return section?.isVisible ?? true;
    };

    const submitContactRequest = async (contactData) => {
        try {
            const response = await fetch(`${GATEWAY_URL}/api/saas/landing/public/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData),
            });

            if (!response.ok) {
                throw new Error('Failed to submit contact request');
            }

            return await response.json();
        } catch (err) {
            console.warn('Contact submission error:', err);
            throw err;
        }
    };

    const value = {
        ...data,
        loading,
        error,
        isSectionVisible,
        submitContactRequest,
        refresh: fetchLandingData,
    };

    return (
        <LandingContext.Provider value={value}>
            {children}
        </LandingContext.Provider>
    );
}

export function useLanding() {
    const context = useContext(LandingContext);
    if (!context) {
        throw new Error('useLanding must be used within a LandingProvider');
    }
    return context;
}

export default LandingContext;
