import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HeroSection() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false);
    const [counters, setCounters] = useState({ orgs: 0, users: 0, uptime: 0 });
    const heroRef = useRef(null);

    useEffect(() => {
        setIsVisible(true);
        // Animate counters
        const duration = 2000;
        const steps = 60;
        const interval = duration / steps;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const easeOut = 1 - Math.pow(1 - progress, 3);

            setCounters({
                orgs: Math.floor(500 * easeOut),
                users: Math.floor(10000 * easeOut),
                uptime: Math.floor(99.9 * easeOut * 10) / 10
            });

            if (step >= steps) clearInterval(timer);
        }, interval);

        return () => clearInterval(timer);
    }, []);

    const handleMouseMove = (e) => {
        if (!heroRef.current) return;
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height
        });
    };

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section
            ref={heroRef}
            onMouseMove={handleMouseMove}
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1929 25%, #111827 50%, #0a1628 75%, #070c14 100%)'
            }}
        >
            {/* Animated Mesh Gradient Background */}
            <div className="absolute inset-0">
                {/* Dynamic Gradient Orbs that follow mouse */}
                <div
                    className="absolute w-[800px] h-[800px] rounded-full blur-[120px] transition-all duration-1000 ease-out"
                    style={{
                        background: 'radial-gradient(circle, rgba(29, 78, 216, 0.3) 0%, transparent 70%)',
                        left: `${mousePosition.x * 30}%`,
                        top: `${mousePosition.y * 30}%`,
                    }}
                />
                <div
                    className="absolute w-[600px] h-[600px] rounded-full blur-[100px] transition-all duration-1000 ease-out"
                    style={{
                        background: 'radial-gradient(circle, rgba(138, 56, 245, 0.25) 0%, transparent 70%)',
                        right: `${(1 - mousePosition.x) * 20}%`,
                        bottom: `${(1 - mousePosition.y) * 20}%`,
                    }}
                />
                <div
                    className="absolute w-[500px] h-[500px] rounded-full blur-[80px] animate-pulse"
                    style={{
                        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
                        left: '50%',
                        top: '30%',
                        transform: 'translate(-50%, -50%)',
                    }}
                />

                {/* Animated Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '60px 60px',
                        animation: 'gridMove 20s linear infinite'
                    }}
                />

                {/* Floating 3D Elements */}
                <div className="absolute top-20 right-[15%] w-20 h-20 perspective-1000">
                    <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 backdrop-blur-sm border border-white/10 rounded-2xl animate-float3D" />
                </div>
                <div className="absolute bottom-32 left-[10%] w-16 h-16 perspective-1000">
                    <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-primary-500/20 backdrop-blur-sm border border-white/10 rounded-xl animate-float3D delay-1000" />
                </div>
                <div className="absolute top-1/3 left-[5%] w-12 h-12 perspective-1000">
                    <div className="w-full h-full bg-gradient-to-br from-secondary-500/20 to-pink-500/20 backdrop-blur-sm border border-white/10 rounded-lg animate-float3D delay-500" />
                </div>
                <div className="absolute bottom-20 right-[8%] w-24 h-24 perspective-1000">
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 backdrop-blur-sm border border-white/10 rounded-2xl animate-float3D delay-700" />
                </div>

                {/* Glowing Particles */}
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white dark:bg-gray-900 rounded-full animate-twinkle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 2}s`
                        }}
                    />
                ))}
            </div>

            {/* Content */}
            <div className={`relative z-10 container mx-auto px-4 text-center pt-24 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {/* Status Badge */}
                <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 mb-10 hover:bg-white/10 transition-all duration-300 cursor-pointer group">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-white/90 text-sm font-medium">منصة سحابية متكاملة لإدارة المؤسسات الحكومية والخاصة</span>
                    <svg className="w-4 h-4 text-white/50 group-hover:translate-x-[-4px] transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </div>

                {/* Main Title with Gradient Animation */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-tight">
                    <span className="block mb-2">نظام</span>
                    <span className="relative inline-block">
                        <span className="bg-gradient-to-l from-primary-400 via-secondary-400 to-cyan-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                            مسارات
                        </span>
                        <span className="absolute -inset-1 bg-gradient-to-l from-primary-400/20 via-secondary-400/20 to-cyan-400/20 blur-2xl -z-10 animate-pulse" />
                    </span>
                    <span className="block mt-2">الموحد</span>
                </h1>

                {/* Subtitle with Typewriter Effect */}
                <p className="text-xl md:text-2xl lg:text-3xl text-gray-300 mb-6 max-w-4xl mx-auto leading-relaxed">
                    حلول <span className="text-primary-400 font-semibold">ERP</span> و <span className="text-secondary-400 font-semibold">GRP</span> المتكاملة
                    <br className="hidden md:block" />
                    لإدارة جميع عمليات مؤسستك بكفاءة استثنائية
                </p>

                {/* Features Tags */}
                <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
                    {['الموارد البشرية', 'المستودعات', 'الأرشفة', 'الحركة', 'المالية', 'التحليلات'].map((feature, i) => (
                        <span
                            key={i}
                            className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-sm text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            {feature}
                        </span>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                    <Link href="/login">
                        <button className="group relative px-10 py-5 bg-gradient-to-l from-primary-500 to-primary-600 text-white rounded-2xl font-bold text-lg overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/30 hover:-translate-y-1">
                            <span className="relative z-10 flex items-center gap-3">
                                ابدأ تجربتك المجانية
                                <svg className="w-5 h-5 rotate-180 group-hover:-translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-l from-primary-600 to-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </button>
                    </Link>
                    <button
                        onClick={() => scrollToSection('modules')}
                        className="group px-10 py-5 bg-white/5 backdrop-blur-xl border-2 border-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/40 transition-all duration-300"
                    >
                        <span className="flex items-center gap-3">
                            استكشف الأنظمة
                            <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </span>
                    </button>
                </div>

                {/* Stats Cards - Glassmorphism */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="text-5xl md:text-6xl font-black text-white mb-2">
                                +{counters.orgs}
                            </div>
                            <div className="text-gray-400 text-lg">مؤسسة تثق بنا</div>
                            <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" />
                                </svg>
                                <span>نمو 45% سنوياً</span>
                            </div>
                        </div>
                    </div>

                    <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-secondary-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="text-5xl md:text-6xl font-black text-white mb-2">
                                +{counters.users.toLocaleString()}
                            </div>
                            <div className="text-gray-400 text-lg">مستخدم نشط</div>
                            <div className="mt-4 flex items-center gap-2 text-primary-400 text-sm">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                </svg>
                                <span>من 15+ دولة</span>
                            </div>
                        </div>
                    </div>

                    <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="text-5xl md:text-6xl font-black text-white mb-2">
                                {counters.uptime}%
                            </div>
                            <div className="text-gray-400 text-lg">وقت التشغيل</div>
                            <div className="mt-4 flex items-center gap-2 text-cyan-400 text-sm">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>ضمان الجودة</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-16 flex flex-wrap items-center justify-center gap-8 opacity-60">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">موثوق من قبل:</span>
                    {['ISO 27001', 'SAMA', 'GDPR', 'SOC 2'].map((badge, i) => (
                        <div key={i} className="px-4 py-2 bg-white/5 rounded-lg text-gray-400 text-sm font-medium">
                            {badge}
                        </div>
                    ))}
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400 text-sm">اكتشف المزيد</span>
                <button
                    onClick={() => scrollToSection('modules')}
                    className="w-10 h-16 border-2 border-white/20 rounded-full flex items-start justify-center p-2 hover:border-white/40 transition-colors"
                >
                    <div className="w-1.5 h-3 bg-white/60 rounded-full animate-scrollDown" />
                </button>
            </div>

            <style jsx>{`
                @keyframes gridMove {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(60px, 60px); }
                }
                @keyframes float3D {
                    0%, 100% {
                        transform: translateY(0) rotateX(0deg) rotateY(0deg);
                    }
                    25% {
                        transform: translateY(-15px) rotateX(5deg) rotateY(5deg);
                    }
                    50% {
                        transform: translateY(-25px) rotateX(0deg) rotateY(10deg);
                    }
                    75% {
                        transform: translateY(-15px) rotateX(-5deg) rotateY(5deg);
                    }
                }
                .animate-float3D {
                    animation: float3D 6s ease-in-out infinite;
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.5); }
                }
                .animate-twinkle {
                    animation: twinkle 2s ease-in-out infinite;
                }
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    animation: gradient 3s ease infinite;
                }
                @keyframes scrollDown {
                    0%, 100% { transform: translateY(0); opacity: 1; }
                    50% { transform: translateY(8px); opacity: 0.5; }
                }
                .animate-scrollDown {
                    animation: scrollDown 1.5s ease-in-out infinite;
                }
                .perspective-1000 {
                    perspective: 1000px;
                }
                .delay-500 { animation-delay: 0.5s; }
                .delay-700 { animation-delay: 0.7s; }
                .delay-1000 { animation-delay: 1s; }
            `}</style>
        </section>
    );
}
