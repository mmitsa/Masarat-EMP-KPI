import React, { useState, useRef, useEffect } from 'react';
import { SYSTEM_DEFINITIONS } from '../../lib/rbac';

// Extended module data with detailed information
const MODULES_DATA = {
    hr: {
        features: ['إدارة بيانات الموظفين', 'نظام الحضور والانصراف', 'إدارة الإجازات', 'مسير الرواتب', 'التقييم السنوي'],
        gradient: 'from-blue-500 via-blue-600 to-indigo-600',
        bgGradient: 'from-blue-500/10 to-indigo-500/5',
        accentColor: '#3b82f6',
        size: 'large', // Bento grid size
        stats: { employees: '50,000+', companies: '200+' },
        benefits: ['توفير 80% من وقت الإدارة', 'دقة 99.9% في الحسابات', 'تقارير فورية'],
        integrations: ['نظام البصمة', 'البنوك', 'التأمينات'],
        videoUrl: '/videos/hr-demo.mp4',
        demoImages: ['/images/hr-1.png', '/images/hr-2.png'],
    },
    warehouse: {
        features: ['إدارة المخزون', 'طلبات الصرف', 'العهد الشخصية', 'تقارير المستودع', 'الباركود'],
        gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
        bgGradient: 'from-emerald-500/10 to-cyan-500/5',
        accentColor: '#10b981',
        size: 'medium',
        stats: { items: '1M+', transactions: '10M+' },
        benefits: ['تتبع دقيق للمخزون', 'تنبيهات ذكية', 'تقليل الهدر 60%'],
        integrations: ['الباركود', 'RFID', 'ERP'],
        videoUrl: '/videos/warehouse-demo.mp4',
    },
    archiving: {
        features: ['أرشفة الوثائق', 'البحث الذكي', 'سير العمل', 'التصنيفات', 'OCR'],
        gradient: 'from-amber-500 via-orange-500 to-red-500',
        bgGradient: 'from-amber-500/10 to-orange-500/5',
        accentColor: '#f59e0b',
        size: 'medium',
        stats: { documents: '5M+', searches: '100K/day' },
        benefits: ['بحث فوري', 'حفظ آمن 100%', 'استرجاع سهل'],
        integrations: ['OneDrive', 'Google Drive', 'SharePoint'],
        videoUrl: '/videos/archiving-demo.mp4',
    },
    epm: {
        features: ['تقييم الأداء', 'الأهداف الذكية', 'خطط التطوير', 'التقارير', '360° تقييم'],
        gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
        bgGradient: 'from-violet-500/10 to-purple-500/5',
        accentColor: '#8b5cf6',
        size: 'small',
        stats: { evaluations: '500K+', goals: '1M+' },
        benefits: ['تحسين الأداء 40%', 'شفافية كاملة', 'تحليلات ذكية'],
        integrations: ['Slack', 'Teams', 'HR Systems'],
    },
    movement: {
        features: ['إدارة المركبات', 'متابعة السائقين', 'جدولة الرحلات', 'تتبع GPS', 'الصيانة'],
        gradient: 'from-cyan-500 via-sky-500 to-blue-500',
        bgGradient: 'from-cyan-500/10 to-blue-500/5',
        accentColor: '#06b6d4',
        size: 'large',
        stats: { vehicles: '10K+', trips: '5M+' },
        benefits: ['توفير الوقود 30%', 'تتبع مباشر', 'صيانة استباقية'],
        integrations: ['GPS', 'OBD', 'Fuel Systems'],
        videoUrl: '/videos/movement-demo.mp4',
    },
    sadad: {
        features: ['الفواتير الإلكترونية', 'بوابات الدفع', 'التقارير المالية', 'الإشعارات', 'ZATCA'],
        gradient: 'from-pink-500 via-rose-500 to-red-500',
        bgGradient: 'from-pink-500/10 to-rose-500/5',
        accentColor: '#ec4899',
        size: 'medium',
        stats: { invoices: '10M+', payments: '5B SAR' },
        benefits: ['متوافق مع ZATCA', 'دفع آمن', 'تقارير فورية'],
        integrations: ['Mada', 'Apple Pay', 'STC Pay'],
    },
    analytics: {
        features: ['لوحات البيانات', 'التقارير المتقدمة', 'التنبؤات', 'التصدير', 'AI Insights'],
        gradient: 'from-indigo-500 via-blue-500 to-violet-500',
        bgGradient: 'from-indigo-500/10 to-violet-500/5',
        accentColor: '#6366f1',
        size: 'small',
        stats: { reports: '1000+', charts: '50+' },
        benefits: ['قرارات مبنية على البيانات', 'تنبؤات ذكية', 'تصور بياني'],
        integrations: ['Power BI', 'Tableau', 'Excel'],
    },
    finance: {
        features: ['الأستاذ العام', 'الموازنات', 'الذمم المدينة', 'الذمم الدائنة', 'التسويات'],
        gradient: 'from-green-500 via-emerald-500 to-teal-500',
        bgGradient: 'from-green-500/10 to-emerald-500/5',
        accentColor: '#22c55e',
        size: 'medium',
        stats: { transactions: '50M+', accuracy: '99.99%' },
        benefits: ['دقة محاسبية 100%', 'إغلاق شهري سريع', 'تدقيق آلي'],
        integrations: ['البنوك', 'ZATCA', 'ERP'],
    },
    itsm: {
        features: ['إدارة التذاكر', 'قاعدة المعرفة', 'الأصول التقنية', 'التقارير', 'SLA'],
        gradient: 'from-orange-500 via-amber-500 to-yellow-500',
        bgGradient: 'from-orange-500/10 to-amber-500/5',
        accentColor: '#f97316',
        size: 'small',
        stats: { tickets: '100K+', resolution: '< 4hrs' },
        benefits: ['حل سريع للمشاكل', 'تتبع الأصول', 'رضا المستخدمين'],
        integrations: ['Jira', 'ServiceNow', 'Slack'],
    }
};

// Modal Component for module details
function ModuleDetailModal({ module, isOpen, onClose }) {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !module) return null;

    const moduleData = MODULES_DATA[module.key] || {};

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" />

            {/* Modal Content */}
            <div
                ref={modalRef}
                className="relative bg-white dark:bg-gray-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-modalSlideIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div className={`relative h-48 bg-gradient-to-br ${moduleData.gradient} rounded-t-3xl overflow-hidden`}>
                    {/* Decorative elements */}
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-10 right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
                        <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/20 rounded-full blur-xl" />
                    </div>

                    {/* Icon and Title */}
                    <div className="absolute bottom-6 right-8 flex items-center gap-4">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-5xl">
                            {module.icon}
                        </div>
                        <div className="text-white">
                            <h2 className="text-3xl font-bold">{module.nameAr}</h2>
                            <p className="text-white/80">{module.nameEn}</p>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Description */}
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">{module.description}</p>

                    {/* Stats */}
                    {moduleData.stats && (
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {Object.entries(moduleData.stats).map(([key, value]) => (
                                <div key={key} className={`p-4 rounded-2xl bg-gradient-to-br ${moduleData.bgGradient}`}>
                                    <div className="text-3xl font-bold" style={{ color: moduleData.accentColor }}>{value}</div>
                                    <div className="text-gray-600 dark:text-gray-300 text-sm">{key === 'employees' ? 'موظف مُدار' : key === 'companies' ? 'شركة' : key === 'items' ? 'صنف' : key === 'transactions' ? 'عملية' : key === 'documents' ? 'وثيقة' : key === 'searches' ? 'بحث يومي' : key === 'vehicles' ? 'مركبة' : key === 'trips' ? 'رحلة' : key === 'invoices' ? 'فاتورة' : key === 'payments' ? 'مدفوعات' : key}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Features Grid */}
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">المميزات الرئيسية</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {moduleData.features?.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${moduleData.accentColor}20` }}>
                                        <svg className="w-4 h-4" style={{ color: moduleData.accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-200 text-sm">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Benefits */}
                    {moduleData.benefits && (
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">الفوائد</h3>
                            <div className="flex flex-wrap gap-3">
                                {moduleData.benefits.map((benefit, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span className="text-sm font-medium">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Integrations */}
                    {moduleData.integrations && (
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">التكاملات</h3>
                            <div className="flex flex-wrap gap-2">
                                {moduleData.integrations.map((integration, idx) => (
                                    <span key={idx} className="px-4 py-2 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 rounded-xl text-sm">
                                        {integration}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t">
                        <button
                            className={`flex-1 py-4 px-6 bg-gradient-to-l ${moduleData.gradient} text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2`}
                        >
                            <span>جرب النظام مجاناً</span>
                            <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                        <button className="flex-1 py-4 px-6 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>شاهد العرض التوضيحي</span>
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                .animate-modalSlideIn {
                    animation: modalSlideIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}

// Bento Card Component
function BentoCard({ module, moduleData, onClick, index }) {
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

    const sizeClasses = {
        large: 'md:col-span-2 md:row-span-2',
        medium: 'md:col-span-1 md:row-span-2',
        small: 'md:col-span-1 md:row-span-1'
    };

    return (
        <div
            ref={cardRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
                group relative bg-white dark:bg-gray-900 rounded-3xl p-6 cursor-pointer
                border border-gray-100 dark:border-gray-800 hover:border-transparent
                transition-all duration-500 hover:-translate-y-2
                ${sizeClasses[moduleData.size]}
                overflow-hidden
            `}
            style={{
                animationDelay: `${index * 100}ms`,
                boxShadow: isHovered
                    ? `0 25px 50px -12px ${moduleData.accentColor}30, 0 0 0 1px ${moduleData.accentColor}20`
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
        >
            {/* Mouse follow gradient */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${moduleData.accentColor}15, transparent 40%)`
                }}
            />

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={`absolute inset-0 bg-gradient-to-br ${moduleData.bgGradient}`} />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white/80 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Icon with gradient background */}
                <div className={`
                    w-16 h-16 rounded-2xl bg-gradient-to-br ${moduleData.gradient}
                    flex items-center justify-center text-3xl shadow-lg
                    group-hover:scale-110 group-hover:rotate-3 transition-all duration-500
                    mb-4
                `}>
                    {module.icon}
                </div>

                {/* Title & Description */}
                <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-gray-800">
                        {module.nameAr}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-600">
                        {module.nameEn}
                    </p>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {module.description}
                </p>

                {/* Features (only for large cards) */}
                {moduleData.size === 'large' && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {moduleData.features?.slice(0, 4).map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: moduleData.accentColor }} />
                                {feature}
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats (for large and medium cards) */}
                {(moduleData.size === 'large' || moduleData.size === 'medium') && moduleData.stats && (
                    <div className="flex gap-4 mb-4">
                        {Object.entries(moduleData.stats).slice(0, 2).map(([key, value]) => (
                            <div key={key} className="text-center">
                                <div className="text-xl font-bold" style={{ color: moduleData.accentColor }}>{value}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{key === 'employees' ? 'موظف' : key === 'companies' ? 'شركة' : key === 'items' ? 'صنف' : key === 'vehicles' ? 'مركبة' : key}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* CTA */}
                <div className="flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0" style={{ color: moduleData.accentColor }}>
                    <span>اكتشف المزيد</span>
                    <svg className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </div>
            </div>

            {/* Corner Decorations */}
            <div className={`absolute -top-12 -left-12 w-24 h-24 bg-gradient-to-br ${moduleData.gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
            <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br ${moduleData.gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
        </div>
    );
}

export default function ModulesShowcase() {
    const [selectedModule, setSelectedModule] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const modules = Object.entries(SYSTEM_DEFINITIONS).map(([key, system]) => ({
        ...system,
        key,
        ...MODULES_DATA[key]
    }));

    const handleModuleClick = (module) => {
        setSelectedModule(module);
        setIsModalOpen(true);
    };

    return (
        <section id="modules" className="py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-l from-primary-100 to-secondary-100 rounded-full mb-4">
                        <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                        <span className="text-primary-600 text-sm font-medium">أنظمتنا المتكاملة</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                        <span className="bg-gradient-to-l from-primary-600 via-secondary-500 to-primary-600 bg-clip-text text-transparent">
                            9 أنظمة
                        </span>
                        {' '}في منصة واحدة
                    </h2>

                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        اضغط على أي نظام لاكتشاف المميزات والفوائد والتكاملات المتاحة
                    </p>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {modules.map((module, index) => (
                        <BentoCard
                            key={module.key}
                            module={module}
                            moduleData={MODULES_DATA[module.key] || { size: 'small', gradient: 'from-gray-400 to-gray-500', bgGradient: 'from-gray-100 to-gray-50', accentColor: '#6b7280', features: [] }}
                            onClick={() => handleModuleClick(module)}
                            index={index}
                        />
                    ))}
                </div>

                {/* Integration Banner */}
                <div className="mt-16 relative">
                    <div className="max-w-4xl mx-auto bg-gradient-to-l from-primary-600 via-secondary-500 to-primary-600 rounded-3xl p-8 md:p-12 text-white overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white dark:bg-gray-900 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white dark:bg-gray-900 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            {/* Icons Animation */}
                            <div className="flex -space-x-4 space-x-reverse">
                                {modules.slice(0, 5).map((module, idx) => (
                                    <div
                                        key={idx}
                                        className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl border-2 border-white/30 hover:scale-110 transition-transform cursor-pointer"
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                        onClick={() => handleModuleClick(module)}
                                    >
                                        {module.icon}
                                    </div>
                                ))}
                                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg font-bold border-2 border-white/30">
                                    +4
                                </div>
                            </div>

                            {/* Text */}
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl md:text-3xl font-bold mb-2">
                                    تكامل سلس بين جميع الأنظمة
                                </h3>
                                <p className="text-white/80 text-lg">
                                    بيانات موحدة، تقارير شاملة، وتجربة مستخدم استثنائية
                                </p>
                            </div>

                            {/* CTA */}
                            <button className="px-8 py-4 bg-white dark:bg-gray-900 text-primary-600 rounded-xl font-bold hover:bg-white/90 transition-all hover:shadow-xl flex items-center gap-2">
                                <span>ابدأ الآن</span>
                                <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Module Detail Modal */}
            <ModuleDetailModal
                module={selectedModule}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </section>
    );
}
