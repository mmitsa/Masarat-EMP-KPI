import React, { useState, useMemo } from 'react';
import { useLanding } from '../../context/LandingContext';

const FAQ_CATEGORIES = [
    { id: 'general', name: 'عام', icon: '💡' },
    { id: 'pricing', name: 'الأسعار', icon: '💰' },
    { id: 'technical', name: 'تقني', icon: '⚙️' },
    { id: 'support', name: 'الدعم', icon: '🎧' },
];

const FAQ_DATA = [
    {
        id: 1,
        category: 'general',
        question: 'ما هي منصة مسارات؟',
        answer: 'منصة مسارات هي نظام سحابي متكامل لإدارة المؤسسات يجمع 9 أنظمة في منصة واحدة: الموارد البشرية، المستودعات، الأرشفة، إدارة الحركة، سداد، إدارة الأداء، المالية، التحليلات، والدعم التقني. تم تصميمها خصيصاً للسوق السعودي مع دعم كامل للغة العربية ومتوافقة مع متطلبات هيئة الزكاة والضريبة.',
    },
    {
        id: 2,
        category: 'general',
        question: 'هل يمكنني استخدام أنظمة محددة فقط؟',
        answer: 'نعم، يمكنك اختيار الأنظمة التي تحتاجها فقط. نوفر باقات مرنة تبدأ من نظام واحد (الموارد البشرية) وتصل حتى 9 أنظمة متكاملة. يمكنك أيضاً إضافة أنظمة جديدة في أي وقت بسهولة.',
    },
    {
        id: 3,
        category: 'general',
        question: 'هل البيانات آمنة في المنصة؟',
        answer: 'نعم، نستخدم أعلى معايير الأمان المعتمدة عالمياً. جميع البيانات مشفرة بتقنية SSL 256-bit، مع نسخ احتياطية يومية، وتخزين على خوادم معتمدة داخل المملكة العربية السعودية. كما نوفر صلاحيات مستخدمين متعددة المستويات لحماية البيانات الحساسة.',
    },
    {
        id: 4,
        category: 'pricing',
        question: 'كيف يتم احتساب التكلفة؟',
        answer: 'يتم احتساب التكلفة بناءً على عدة عوامل: عدد المستخدمين، عدد الأنظمة المختارة، ومساحة التخزين. نوفر باقة مجانية للشركات الصغيرة (حتى 5 موظفين)، وباقات مدفوعة تبدأ من 2,500 ر.س شهرياً. يمكنك التواصل معنا للحصول على عرض سعر مخصص.',
    },
    {
        id: 5,
        category: 'pricing',
        question: 'هل يوجد خصم للاشتراك السنوي؟',
        answer: 'نعم، نوفر خصم 17% (ما يعادل شهرين مجاناً) عند الاشتراك السنوي. هذا يعني أنك تدفع 10 أشهر فقط وتحصل على 12 شهراً من الخدمة.',
    },
    {
        id: 6,
        category: 'pricing',
        question: 'هل يمكنني تجربة المنصة قبل الاشتراك؟',
        answer: 'بالتأكيد! نوفر فترة تجربة مجانية لمدة 14 يوماً لجميع الأنظمة بدون الحاجة لبطاقة ائتمان. كما نوفر باقة مجانية دائمة للشركات الصغيرة.',
    },
    {
        id: 7,
        category: 'pricing',
        question: 'ما سياسة استرداد الأموال؟',
        answer: 'نوفر ضمان استرداد الأموال بنسبة 100% خلال أول 30 يوماً من الاشتراك إذا لم تكن راضياً عن الخدمة لأي سبب.',
    },
    {
        id: 8,
        category: 'technical',
        question: 'هل يتكامل النظام مع البرامج الأخرى؟',
        answer: 'نعم، نوفر API متكامل للربط مع الأنظمة الخارجية. نتكامل مع: أنظمة البصمة، البنوك السعودية، أنظمة التأمينات الاجتماعية، بوابات الدفع (مدى، Apple Pay، STC Pay)، وأنظمة ERP الأخرى. كما نوفر وثائق API شاملة ودعم فني للتكامل.',
    },
    {
        id: 9,
        category: 'technical',
        question: 'هل النظام متوافق مع هيئة الزكاة والضريبة؟',
        answer: 'نعم، نظام سداد متوافق 100% مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA). يدعم الفوترة الإلكترونية بالمرحلة الثانية، ويصدر الفواتير بصيغة FATOORA المعتمدة.',
    },
    {
        id: 10,
        category: 'technical',
        question: 'هل يعمل النظام على الجوال؟',
        answer: 'نعم، المنصة متجاوبة بالكامل وتعمل على جميع الأجهزة: الكمبيوتر، الأجهزة اللوحية، والهواتف الذكية. كما نوفر تطبيقات مخصصة للموظفين على iOS و Android للخدمة الذاتية والحضور والانصراف.',
    },
    {
        id: 11,
        category: 'support',
        question: 'كيف يمكنني التواصل مع الدعم الفني؟',
        answer: 'نوفر عدة قنوات للدعم: الدردشة المباشرة على الموقع (24/7)، البريد الإلكتروني (support@masarat.sa)، الهاتف خلال ساعات العمل (920000XXX)، ونظام تذاكر الدعم داخل المنصة. للمشتركين بباقة المؤسسات، نوفر مدير حساب مخصص.',
    },
    {
        id: 12,
        category: 'support',
        question: 'هل يوجد تدريب على النظام؟',
        answer: 'نعم، نوفر عدة خيارات للتدريب: فيديوهات تعليمية شاملة، مقالات وأدلة مكتوبة، جلسات تدريب مباشرة عبر الإنترنت للباقات المدفوعة، وتدريب شخصي للمؤسسات الكبيرة. كما نوفر ندوات مجانية أسبوعية للمستخدمين الجدد.',
    },
    {
        id: 13,
        category: 'support',
        question: 'ما مدة الاستجابة للدعم الفني؟',
        answer: 'تختلف مدة الاستجابة حسب الباقة: الباقة المجانية (48 ساعة)، الباقة المتقدمة (4 ساعات)، باقة المؤسسات (ساعة واحدة). للحالات الطارئة، نوفر خط دعم عاجل متاح على مدار الساعة.',
    },
];

function FAQItem({ faq, isOpen, onToggle }) {
    return (
        <div
            className={`
                border rounded-2xl overflow-hidden transition-all duration-300
                ${isOpen ? 'border-primary-200 bg-gradient-to-l from-primary-50/50 to-secondary-50/50 shadow-lg' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300'}
            `}
        >
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 text-right"
            >
                <span className={`text-lg font-medium ${isOpen ? 'text-primary-700' : 'text-gray-900 dark:text-white'}`}>
                    {faq.question}
                </span>
                <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
                    ${isOpen ? 'bg-primary-500 rotate-180' : 'bg-gray-100 dark:bg-gray-700/50'}
                `}>
                    <svg
                        className={`w-5 h-5 ${isOpen ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            <div className={`
                overflow-hidden transition-all duration-300
                ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
            `}>
                <div className="px-6 pb-6">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
                </div>
            </div>
        </div>
    );
}

export default function FAQSection() {
    const [activeCategory, setActiveCategory] = useState('general');
    const [openFAQs, setOpenFAQs] = useState([1]); // First FAQ open by default
    const [searchQuery, setSearchQuery] = useState('');

    // Get data from context with fallback
    let contextData = { faqs: [] };
    try {
        contextData = useLanding();
    } catch (e) {
        // Context not available, use defaults
    }

    // Use context FAQs if available, otherwise use default FAQ_DATA
    const faqData = useMemo(() => {
        const contextFaqs = contextData.faqs?.filter(f => f.isActive !== false);
        if (contextFaqs?.length > 0) {
            return contextFaqs.map((faq, index) => ({
                id: faq.id || index + 1,
                category: faq.category || 'general',
                question: faq.questionAr || faq.question,
                answer: faq.answerAr || faq.answer,
            }));
        }
        return FAQ_DATA;
    }, [contextData.faqs]);

    const toggleFAQ = (id) => {
        setOpenFAQs((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const filteredFAQs = faqData.filter((faq) => {
        const matchesCategory = faq.category === activeCategory;
        const matchesSearch = searchQuery === '' ||
            faq.question.includes(searchQuery) ||
            faq.answer.includes(searchQuery);
        return matchesCategory && matchesSearch;
    });

    return (
        <section id="faq" className="py-24 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-l from-blue-100 to-cyan-100 rounded-full mb-4">
                        <span className="text-xl">❓</span>
                        <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">الأسئلة الشائعة</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                        لديك{' '}
                        <span className="bg-gradient-to-l from-blue-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
                            سؤال؟
                        </span>
                    </h2>

                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                        نجيب على أكثر الأسئلة شيوعاً حول منصة مسارات
                    </p>

                    {/* Search */}
                    <div className="max-w-xl mx-auto relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث في الأسئلة..."
                            className="w-full px-6 py-4 pr-14 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
                    {FAQ_CATEGORIES.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={`
                                flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300
                                ${activeCategory === category.id
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                }
                            `}
                        >
                            <span className="text-xl">{category.icon}</span>
                            <span>{category.name}</span>
                        </button>
                    ))}
                </div>

                {/* FAQ List */}
                <div className="max-w-3xl mx-auto space-y-4">
                    {filteredFAQs.map((faq) => (
                        <FAQItem
                            key={faq.id}
                            faq={faq}
                            isOpen={openFAQs.includes(faq.id)}
                            onToggle={() => toggleFAQ(faq.id)}
                        />
                    ))}
                </div>

                {/* No Results */}
                {filteredFAQs.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لم نجد نتائج</h3>
                        <p className="text-gray-500 dark:text-gray-400">جرب البحث بكلمات مختلفة أو تصفح الفئات الأخرى</p>
                    </div>
                )}

                {/* Still Have Questions */}
                <div className="mt-16 max-w-3xl mx-auto">
                    <div className="bg-gradient-to-l from-primary-600 via-secondary-500 to-primary-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 left-0 w-full h-full" style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                backgroundSize: '24px 24px'
                            }} />
                        </div>

                        <div className="relative z-10 text-center">
                            <div className="w-16 h-16 mx-auto mb-6 bg-white/20 rounded-2xl flex items-center justify-center text-4xl">
                                💬
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold mb-4">
                                لم تجد إجابة لسؤالك؟
                            </h3>
                            <p className="text-white/80 text-lg mb-8">
                                فريق الدعم جاهز لمساعدتك على مدار الساعة
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button className="px-8 py-4 bg-white dark:bg-gray-900 text-primary-600 rounded-xl font-bold hover:bg-white/90 transition-all flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span>محادثة مباشرة</span>
                                </button>
                                <button className="px-8 py-4 border-2 border-white/30 text-white rounded-xl font-bold hover:bg-white/10 transition-all flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>أرسل استفسارك</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
