import React, { useState, useEffect, useRef } from 'react';
import { useLanding } from '../../context/LandingContext';

// Default features if not provided by API
const DEFAULT_FEATURES = [
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
    }
];

const DEFAULT_CERTIFICATIONS = [
    { name: 'ISO 27001', description: 'معايير أمن المعلومات' },
    { name: 'SOC 2', description: 'ضوابط أمنية' },
    { name: 'ZATCA', description: 'متوافق مع الفوترة الإلكترونية' },
    { name: 'PDPL', description: 'حماية البيانات الشخصية' },
];

function AnimatedCounter({ value, suffix, isVisible }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isVisible) return;

        let start = 0;
        const duration = 2000;
        const increment = value / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [value, isVisible]);

    const formatNumber = (num) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'K';
        }
        return num.toLocaleString('en-US');
    };

    return (
        <span>
            {value === 99.9 ? count.toFixed(1) : formatNumber(count)}
            {suffix}
        </span>
    );
}

function StatCard({ stat, index, isVisible }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative group"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className={`
                absolute inset-0 bg-gradient-to-br ${stat.gradient || 'from-blue-400 to-indigo-500'} rounded-3xl opacity-0 group-hover:opacity-100
                transition-all duration-500 blur-xl
            `} />
            <div className="relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2">
                {/* Icon */}
                <div className={`
                    w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient || 'from-blue-400 to-indigo-500'} flex items-center justify-center
                    text-3xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500
                    shadow-lg
                `}>
                    {stat.icon}
                </div>

                {/* Value */}
                <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} isVisible={isVisible} />
                </div>

                {/* Label */}
                <div className="text-xl font-bold text-white mb-1">{stat.labelAr || stat.label}</div>
                <div className="text-gray-400">{stat.descriptionAr || stat.description}</div>
            </div>
        </div>
    );
}

function FeatureCard({ feature, index }) {
    return (
        <div
            className="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className={`
                w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center
                text-2xl mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300
                shadow-lg shadow-black/20
            `}>
                {feature.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
            <p className="text-gray-400 leading-relaxed">{feature.description}</p>
        </div>
    );
}

export default function StatsSection() {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);

    // Get data from context with fallback
    let contextData = { stats: [], features: [], certifications: [] };
    try {
        contextData = useLanding();
    } catch (e) {
        // Context not available, use defaults
    }

    const stats = contextData.stats?.length > 0 ? contextData.stats.filter(s => s.isActive !== false) : [
        { value: 500, suffix: '+', labelAr: 'مؤسسة تستخدم المنصة', descriptionAr: 'في مختلف القطاعات', icon: '🏢', gradient: 'from-blue-400 to-indigo-500' },
        { value: 50000, suffix: '+', labelAr: 'مستخدم نشط', descriptionAr: 'يومياً على المنصة', icon: '👥', gradient: 'from-green-400 to-emerald-500' },
        { value: 99.9, suffix: '%', labelAr: 'وقت التشغيل', descriptionAr: 'مضمون ومستقر', icon: '⚡', gradient: 'from-amber-400 to-orange-500' },
        { value: 24, suffix: '/7', labelAr: 'دعم فني', descriptionAr: 'متواصل بدون انقطاع', icon: '🛟', gradient: 'from-purple-400 to-fuchsia-500' },
    ];

    const features = contextData.features?.length > 0 ? contextData.features : DEFAULT_FEATURES;
    const certifications = contextData.certifications?.length > 0 ? contextData.certifications : DEFAULT_CERTIFICATIONS;

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section id="stats" ref={sectionRef} className="py-24 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-white/80 text-sm font-medium">أرقام تتحدث</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold mb-6">
                        ثقة{' '}
                        <span className="bg-gradient-to-l from-primary-400 via-secondary-400 to-primary-400 bg-clip-text text-transparent">
                            المؤسسات
                        </span>
                        {' '}في أرقام
                    </h2>

                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        أرقام حقيقية تعكس ثقة عملائنا وجودة خدماتنا
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
                    {stats.map((stat, index) => (
                        <StatCard key={stat.id || index} stat={stat} index={index} isVisible={isVisible} />
                    ))}
                </div>

                {/* Why Choose Us */}
                <div className="text-center mb-16">
                    <h3 className="text-3xl md:text-4xl font-bold mb-4">
                        لماذا تختار منصة مسارات؟
                    </h3>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        نوفر لك كل ما تحتاجه لإدارة مؤسستك بكفاءة وأمان
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} index={index} />
                    ))}
                </div>

                {/* Certifications */}
                <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">معتمدون ومتوافقون مع:</p>
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        {certifications.map((cert, index) => (
                            <div
                                key={index}
                                className="group flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer"
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/5 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-bold group-hover:text-primary-400 transition-colors">{cert.name}</div>
                                    <div className="text-gray-500 dark:text-gray-400 text-sm">{cert.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
