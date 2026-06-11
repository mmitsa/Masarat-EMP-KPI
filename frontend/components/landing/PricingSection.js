import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useLanding } from '../../context/LandingContext';

const DEFAULT_PRICING_PLANS = [
    {
        id: 'starter',
        nameAr: 'المبتدئ',
        nameEn: 'Starter',
        price: 0,
        period: 'شهرياً',
        description: 'مثالي للشركات الناشئة والفرق الصغيرة',
        badge: null,
        color: 'gray',
        gradient: 'from-gray-400 to-gray-500',
        bgGradient: 'from-gray-50 to-white',
        accentColor: '#6b7280',
        maxUsers: 5,
        maxStorage: '1 GB',
        modules: ['الموارد البشرية'],
        modulesCount: 1,
        features: [
            { text: 'إدارة حتى 5 موظفين', included: true },
            { text: 'الموارد البشرية الأساسية', included: true },
            { text: 'تقارير أساسية', included: true },
            { text: 'دعم بالبريد الإلكتروني', included: true },
            { text: 'تحديثات مجانية', included: true },
            { text: 'الأنظمة المتقدمة', included: false },
            { text: 'التكامل مع APIs', included: false },
            { text: 'الدعم الفني المباشر', included: false },
        ],
        popular: false,
        cta: 'ابدأ مجاناً',
    },
    {
        id: 'pro',
        nameAr: 'المتقدم',
        nameEn: 'Professional',
        price: 2500,
        period: 'شهرياً',
        description: 'للشركات المتوسطة التي تحتاج أنظمة متعددة',
        badge: 'الأكثر شيوعاً',
        color: 'primary',
        gradient: 'from-blue-500 via-primary-500 to-indigo-500',
        bgGradient: 'from-blue-50 to-indigo-50',
        accentColor: '#1d4ed8',
        maxUsers: 50,
        maxStorage: '50 GB',
        modules: ['الموارد البشرية', 'المستودعات', 'الحركة', 'الأرشفة'],
        modulesCount: 4,
        features: [
            { text: 'إدارة حتى 50 موظف', included: true },
            { text: '4 أنظمة متكاملة', included: true },
            { text: 'تقارير متقدمة وتحليلات', included: true },
            { text: 'دعم فني على مدار الساعة', included: true },
            { text: 'تدريب مجاني للفريق', included: true },
            { text: 'تكامل مع APIs', included: true },
            { text: 'نسخ احتياطي يومي', included: true },
            { text: 'مدير حساب مخصص', included: false },
            { text: 'SLA مضمون', included: false },
        ],
        popular: true,
        cta: 'اشترك الآن',
    },
    {
        id: 'enterprise',
        nameAr: 'المؤسسات',
        nameEn: 'Enterprise',
        price: null,
        period: 'حسب الطلب',
        description: 'للمؤسسات الكبيرة ذات الاحتياجات المخصصة',
        badge: 'مخصص',
        color: 'secondary',
        gradient: 'from-purple-500 via-secondary-500 to-pink-500',
        bgGradient: 'from-purple-50 to-pink-50',
        accentColor: '#8a38f5',
        maxUsers: 'غير محدود',
        maxStorage: 'غير محدود',
        modules: ['جميع الأنظمة التسعة'],
        modulesCount: 9,
        features: [
            { text: 'عدد مستخدمين غير محدود', included: true },
            { text: 'جميع الأنظمة التسعة', included: true },
            { text: 'تخصيص كامل حسب الطلب', included: true },
            { text: 'مدير حساب مخصص', included: true },
            { text: 'SLA مضمون 99.9%', included: true },
            { text: 'تكامل مع الأنظمة الخارجية', included: true },
            { text: 'تدريب شامل ومستمر', included: true },
            { text: 'أولوية في الدعم الفني', included: true },
            { text: 'تقارير مخصصة', included: true },
        ],
        popular: false,
        cta: 'تواصل معنا',
    }
];

// Comparison Modal Component
function ComparisonModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const comparisonFeatures = [
        { name: 'عدد الموظفين', starter: '5', pro: '50', enterprise: 'غير محدود' },
        { name: 'مساحة التخزين', starter: '1 GB', pro: '50 GB', enterprise: 'غير محدود' },
        { name: 'عدد الأنظمة', starter: '1', pro: '4', enterprise: '9' },
        { name: 'الدعم الفني', starter: 'بريد', pro: '24/7', enterprise: 'VIP' },
        { name: 'التكامل مع APIs', starter: '❌', pro: '✅', enterprise: '✅' },
        { name: 'مدير حساب مخصص', starter: '❌', pro: '❌', enterprise: '✅' },
        { name: 'SLA مضمون', starter: '❌', pro: '❌', enterprise: '99.9%' },
        { name: 'التدريب', starter: 'فيديوهات', pro: 'جلسات', enterprise: 'مستمر' },
        { name: 'النسخ الاحتياطي', starter: 'أسبوعي', pro: 'يومي', enterprise: 'فوري' },
        { name: 'التخصيص', starter: '❌', pro: 'جزئي', enterprise: 'كامل' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative bg-white dark:bg-gray-900 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-8 py-6 flex items-center justify-between z-10 rounded-t-3xl">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">مقارنة الباقات</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Comparison Table */}
                <div className="p-8">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-right py-4 px-4 font-medium text-gray-500 dark:text-gray-400">الميزة</th>
                                    {PRICING_PLANS.map((plan) => (
                                        <th key={plan.id} className="text-center py-4 px-4">
                                            <div className={`inline-flex flex-col items-center p-4 rounded-2xl bg-gradient-to-br ${plan.bgGradient}`}>
                                                <span className="font-bold text-gray-900 dark:text-white">{plan.nameAr}</span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{plan.nameEn}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonFeatures.map((feature, idx) => (
                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                                        <td className="py-4 px-4 font-medium text-gray-700 dark:text-gray-200">{feature.name}</td>
                                        <td className="text-center py-4 px-4 text-gray-600 dark:text-gray-300">{feature.starter}</td>
                                        <td className="text-center py-4 px-4 text-primary-600 font-medium">{feature.pro}</td>
                                        <td className="text-center py-4 px-4 text-secondary-600 font-medium">{feature.enterprise}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Pricing Card Component
function PricingCard({ plan, billingCycle, index }) {
    const cardRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const getPrice = () => {
        if (plan.price === null) return 'تواصل معنا';
        if (plan.price === 0) return 'مجاني';
        const price = billingCycle === 'yearly' ? Math.round(plan.price * 10) : plan.price;
        return price.toLocaleString('ar-SA');
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
                relative bg-white dark:bg-gray-900 rounded-3xl p-8 transition-all duration-500
                ${plan.popular
                    ? 'border-2 border-primary-500 shadow-2xl scale-105 z-10'
                    : 'border border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:shadow-xl'
                }
                overflow-hidden
            `}
            style={{
                animationDelay: `${index * 100}ms`,
            }}
        >
            {/* Mouse follow gradient */}
            <div
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, ${plan.accentColor}10, transparent 40%)`
                }}
            />

            {/* Badge */}
            {plan.badge && (
                <div className={`absolute -top-px left-1/2 -translate-x-1/2 px-6 py-2 rounded-b-2xl text-sm font-bold text-white bg-gradient-to-l ${plan.gradient}`}>
                    {plan.badge}
                </div>
            )}

            {/* Header */}
            <div className="text-center mb-8 pt-4">
                {/* Icon */}
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg`}>
                    <span className="text-3xl text-white">
                        {plan.id === 'starter' ? '🚀' : plan.id === 'pro' ? '⭐' : '🏢'}
                    </span>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{plan.nameAr}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{plan.nameEn}</p>
            </div>

            {/* Price */}
            <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold" style={{ color: plan.accentColor }}>
                        {getPrice()}
                    </span>
                    {plan.price !== null && plan.price > 0 && (
                        <span className="text-gray-500 dark:text-gray-400 text-lg">ر.س</span>
                    )}
                </div>
                <div className="text-gray-500 dark:text-gray-400 mt-1">{plan.period}</div>
                {billingCycle === 'yearly' && plan.price > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        وفر شهرين
                    </div>
                )}
            </div>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                {plan.description}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{plan.maxUsers}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">مستخدم</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{plan.maxStorage}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">تخزين</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{plan.modulesCount}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">أنظمة</div>
                </div>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                    <li key={idx} className={`flex items-start gap-3 ${feature.included ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'}`}>
                        <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${feature.included ? 'bg-green-100' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
                            {feature.included ? (
                                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </div>
                        <span className="text-sm">{feature.text}</span>
                    </li>
                ))}
            </ul>

            {/* CTA Button */}
            <Link href={plan.price === null ? '#contact' : '/login'}>
                <button className={`
                    w-full py-4 rounded-xl font-bold text-lg transition-all duration-300
                    flex items-center justify-center gap-2
                    ${plan.popular
                        ? `bg-gradient-to-l ${plan.gradient} text-white hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-1`
                        : plan.id === 'enterprise'
                        ? `bg-gradient-to-l ${plan.gradient} text-white hover:shadow-lg hover:shadow-secondary-500/30 hover:-translate-y-1`
                        : 'bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-white hover:bg-gray-200'
                    }
                `}>
                    <span>{plan.cta}</span>
                    <svg className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </button>
            </Link>
        </div>
    );
}

export default function PricingSection() {
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [showComparison, setShowComparison] = useState(false);

    // Get data from context with fallback
    let contextData = { pricing: [] };
    try {
        contextData = useLanding();
    } catch (e) {
        // Context not available, use defaults
    }

    // Use context pricing if available
    const PRICING_PLANS = useMemo(() => {
        const contextPricing = contextData.pricing?.filter(p => p.isActive !== false);
        if (contextPricing?.length > 0) {
            return contextPricing.map((plan, index) => ({
                id: plan.id || `plan-${index}`,
                nameAr: plan.nameAr,
                nameEn: plan.nameEn,
                price: billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly,
                period: billingCycle === 'monthly' ? 'شهرياً' : 'سنوياً',
                description: plan.descriptionAr || '',
                badge: plan.isPopular ? 'الأكثر شيوعاً' : null,
                color: plan.isPopular ? 'primary' : 'gray',
                gradient: plan.gradient || (plan.isPopular ? 'from-blue-500 via-primary-500 to-indigo-500' : 'from-gray-400 to-gray-500'),
                bgGradient: plan.isPopular ? 'from-blue-50 to-indigo-50' : 'from-gray-50 to-white',
                accentColor: plan.accentColor || (plan.isPopular ? '#1d4ed8' : '#6b7280'),
                maxUsers: plan.maxUsers || 'غير محدود',
                maxStorage: plan.maxStorage || 'غير محدود',
                features: (typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : plan.features || []).map(f =>
                    typeof f === 'string' ? { text: f, included: true } : f
                ),
                popular: plan.isPopular,
                cta: plan.isPopular ? 'ابدأ الآن' : 'اختر هذه الخطة',
            }));
        }
        return DEFAULT_PRICING_PLANS;
    }, [contextData.pricing, billingCycle]);

    return (
        <section id="pricing" className="py-24 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-l from-secondary-100 to-primary-100 rounded-full mb-4">
                        <span className="w-2 h-2 bg-secondary-500 rounded-full animate-pulse" />
                        <span className="text-secondary-600 text-sm font-medium">خطط الأسعار</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                        اختر{' '}
                        <span className="bg-gradient-to-l from-secondary-600 via-primary-500 to-secondary-600 bg-clip-text text-transparent">
                            الباقة المناسبة
                        </span>
                    </h2>

                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                        باقات مرنة تناسب جميع أحجام المؤسسات مع إمكانية الترقية في أي وقت
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <span className={`text-lg font-medium transition-colors ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                            شهري
                        </span>
                        <button
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            className="relative w-20 h-10 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-500/20"
                            style={{
                                background: billingCycle === 'yearly'
                                    ? 'linear-gradient(to left, #1d4ed8, #8a38f5)'
                                    : '#e5e7eb'
                            }}
                        >
                            <span
                                className="absolute top-1 w-8 h-8 bg-white dark:bg-gray-900 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
                                style={{ left: billingCycle === 'yearly' ? '2.75rem' : '0.25rem' }}
                            >
                                {billingCycle === 'yearly' ? '💰' : '📅'}
                            </span>
                        </button>
                        <div className="flex items-center gap-2">
                            <span className={`text-lg font-medium transition-colors ${billingCycle === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                سنوي
                            </span>
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium rounded-full">
                                -17%
                            </span>
                        </div>
                    </div>

                    {/* Compare Button */}
                    <button
                        onClick={() => setShowComparison(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:border-primary-500 hover:text-primary-600 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        قارن الباقات
                    </button>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
                    {PRICING_PLANS.map((plan, index) => (
                        <PricingCard
                            key={plan.id}
                            plan={plan}
                            billingCycle={billingCycle}
                            index={index}
                        />
                    ))}
                </div>

                {/* Guarantees */}
                <div className="mt-16 flex flex-wrap items-center justify-center gap-6">
                    <div className="flex items-center gap-3 px-5 py-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <div className="font-bold text-green-700 dark:text-green-300">ضمان استرداد الأموال</div>
                            <div className="text-sm text-green-600 dark:text-green-400">خلال 30 يوماً</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <div className="font-bold text-blue-700 dark:text-blue-300">أمان وحماية</div>
                            <div className="text-sm text-blue-600 dark:text-blue-400">تشفير SSL 256-bit</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-5 py-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <div className="font-bold text-purple-700 dark:text-purple-300">ترقية مرنة</div>
                            <div className="text-sm text-purple-600">في أي وقت</div>
                        </div>
                    </div>
                </div>

                {/* Enterprise CTA */}
                <div className="mt-16 max-w-4xl mx-auto">
                    <div className="bg-gradient-to-l from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 left-0 w-full h-full" style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                backgroundSize: '32px 32px'
                            }} />
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl md:text-3xl font-bold mb-3">
                                    هل تحتاج حلاً مخصصاً لمؤسستك؟
                                </h3>
                                <p className="text-gray-300 text-lg">
                                    فريقنا جاهز لتصميم حل يناسب احتياجاتك الخاصة مع دعم متكامل
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button className="px-8 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    تحدث مع خبير
                                </button>
                                <button className="px-8 py-4 border-2 border-white/30 text-white rounded-xl font-bold hover:bg-white/10 transition-all flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    احصل على عرض سعر
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison Modal */}
            <ComparisonModal isOpen={showComparison} onClose={() => setShowComparison(false)} />

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </section>
    );
}
