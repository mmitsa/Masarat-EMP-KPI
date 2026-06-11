import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const MODULES_MENU = [
    { name: 'الموارد البشرية', icon: '👥', href: '#modules', description: 'إدارة شاملة للموظفين والرواتب' },
    { name: 'المستودعات', icon: '📦', href: '#modules', description: 'تتبع المخزون والعهد' },
    { name: 'الأرشفة الذكية', icon: '📂', href: '#modules', description: 'أرشفة وبحث ذكي للوثائق' },
    { name: 'إدارة الحركة', icon: '🚗', href: '#modules', description: 'تتبع المركبات والسائقين' },
    { name: 'سداد', icon: '💳', href: '#modules', description: 'فوترة إلكترونية متوافقة' },
    { name: 'إدارة الأداء', icon: '🎯', href: '#modules', description: 'تقييم وتطوير الموظفين' },
];

export default function LandingNavbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsMobileMenuOpen(false);
        setActiveDropdown(null);
    };

    const navLinks = [
        { label: 'الرئيسية', sectionId: 'hero' },
        { label: 'الأنظمة', sectionId: 'modules', hasDropdown: true },
        { label: 'الأسعار', sectionId: 'pricing' },
        { label: 'آراء العملاء', sectionId: 'testimonials' },
        { label: 'الأسئلة الشائعة', sectionId: 'faq' },
        { label: 'تواصل معنا', sectionId: 'contact' },
    ];

    return (
        <nav className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
            isScrolled
                ? 'bg-white/95 backdrop-blur-lg shadow-lg shadow-gray-900/5'
                : 'bg-gradient-to-b from-gray-900/50 to-transparent'
        }`}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold
                            transition-all duration-300 group-hover:scale-110
                            ${isScrolled
                                ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/30'
                                : 'bg-white/20 backdrop-blur-sm text-white border border-white/20'
                            }
                        `}>
                            م
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-xl font-bold transition-colors ${isScrolled ? 'text-gray-900 dark:text-white' : 'text-white'}`}>
                                منصة مسارات
                            </span>
                            <span className={`text-xs transition-colors ${isScrolled ? 'text-gray-500 dark:text-gray-400' : 'text-white/60'}`}>
                                Masarat Platform
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
                        {navLinks.map((link) => (
                            <div key={link.sectionId} className="relative">
                                <button
                                    onClick={() => link.hasDropdown
                                        ? setActiveDropdown(activeDropdown === link.sectionId ? null : link.sectionId)
                                        : scrollToSection(link.sectionId)
                                    }
                                    className={`
                                        px-4 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-1
                                        ${isScrolled
                                            ? 'text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-primary-50'
                                            : 'text-white/90 hover:text-white hover:bg-white/10'
                                        }
                                    `}
                                >
                                    {link.label}
                                    {link.hasDropdown && (
                                        <svg
                                            className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === link.sectionId ? 'rotate-180' : ''}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    )}
                                </button>

                                {/* Dropdown Menu */}
                                {link.hasDropdown && activeDropdown === link.sectionId && (
                                    <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-fadeIn">
                                        <div className="p-2">
                                            {MODULES_MENU.map((module) => (
                                                <button
                                                    key={module.name}
                                                    onClick={() => scrollToSection('modules')}
                                                    className="w-full flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors text-right group"
                                                >
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                        {module.icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                                                            {module.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {module.description}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="border-t p-4 bg-gray-50 dark:bg-gray-800">
                                            <button
                                                onClick={() => scrollToSection('modules')}
                                                className="w-full flex items-center justify-center gap-2 text-primary-600 font-medium hover:text-primary-700"
                                            >
                                                <span>عرض جميع الأنظمة</span>
                                                <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Auth Buttons */}
                    <div className="hidden lg:flex items-center gap-3">
                        <Link href="/login">
                            <button className={`
                                px-5 py-2.5 rounded-xl font-medium transition-all duration-300
                                ${isScrolled
                                    ? 'text-gray-700 dark:text-gray-200 hover:bg-gray-100'
                                    : 'text-white hover:bg-white/10'
                                }
                            `}>
                                تسجيل الدخول
                            </button>
                        </Link>
                        <Link href="/platform-admin/login">
                            <button className={`
                                px-6 py-2.5 rounded-xl font-bold transition-all duration-300
                                flex items-center gap-2
                                ${isScrolled
                                    ? 'bg-gradient-to-l from-primary-500 to-secondary-500 text-white hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5'
                                    : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-white/90 hover:shadow-lg'
                                }
                            `}>
                                <span>ابدأ الآن</span>
                                <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`
                            lg:hidden w-12 h-12 rounded-xl flex items-center justify-center transition-all
                            ${isScrolled ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-white' : 'bg-white/10 text-white'}
                        `}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {isMobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                <div className={`
                    lg:hidden overflow-hidden transition-all duration-300
                    ${isMobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}
                `}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 mb-4">
                        {/* Navigation Links */}
                        <div className="space-y-1 mb-4">
                            {navLinks.map((link) => (
                                <button
                                    key={link.sectionId}
                                    onClick={() => scrollToSection(link.sectionId)}
                                    className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 font-medium transition-colors"
                                >
                                    <span>{link.label}</span>
                                    <svg className="w-4 h-4 text-gray-400 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ))}
                        </div>

                        {/* Quick Access Modules */}
                        <div className="mb-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400 px-4 mb-2">الأنظمة الرئيسية</div>
                            <div className="grid grid-cols-3 gap-2">
                                {MODULES_MENU.slice(0, 6).map((module) => (
                                    <button
                                        key={module.name}
                                        onClick={() => scrollToSection('modules')}
                                        className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 transition-colors"
                                    >
                                        <span className="text-2xl">{module.icon}</span>
                                        <span className="text-xs text-gray-600 dark:text-gray-300">{module.name.split(' ')[0]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <hr className="my-4" />

                        {/* Auth Buttons */}
                        <div className="space-y-2">
                            <Link href="/login" className="block">
                                <button className="w-full py-3 px-4 rounded-xl text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 font-medium transition-colors">
                                    تسجيل الدخول
                                </button>
                            </Link>
                            <Link href="/platform-admin/login" className="block">
                                <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-l from-primary-500 to-secondary-500 text-white font-bold transition-all flex items-center justify-center gap-2">
                                    <span>ابدأ الآن مجاناً</span>
                                    <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </button>
                            </Link>
                        </div>

                        {/* Contact Info */}
                        <div className="mt-4 pt-4 border-t flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <a href="tel:920000000" className="flex items-center gap-1 hover:text-primary-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span dir="ltr">920 000 000</span>
                            </a>
                            <span className="text-gray-300">|</span>
                            <a href="mailto:info@masarat.sa" className="hover:text-primary-600">
                                info@masarat.sa
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </nav>
    );
}
