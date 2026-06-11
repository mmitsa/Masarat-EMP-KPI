import React, { useState } from 'react';
import Link from 'next/link';

const FOOTER_LINKS = {
    modules: {
        title: 'الأنظمة',
        links: [
            { label: 'الموارد البشرية', href: '#modules', icon: '👥' },
            { label: 'المستودعات', href: '#modules', icon: '📦' },
            { label: 'الأرشفة الذكية', href: '#modules', icon: '📂' },
            { label: 'إدارة الحركة', href: '#modules', icon: '🚗' },
            { label: 'سداد', href: '#modules', icon: '💳' },
            { label: 'إدارة الأداء', href: '#modules', icon: '🎯' },
        ]
    },
    company: {
        title: 'الشركة',
        links: [
            { label: 'من نحن', href: '#about' },
            { label: 'فريق العمل', href: '#team' },
            { label: 'الوظائف', href: '#careers', badge: 'نوظف' },
            { label: 'المدونة', href: '#blog' },
            { label: 'الشركاء', href: '#partners' },
        ]
    },
    support: {
        title: 'الدعم',
        links: [
            { label: 'مركز المساعدة', href: '#help' },
            { label: 'التوثيق', href: '#docs' },
            { label: 'الأسئلة الشائعة', href: '#faq' },
            { label: 'تواصل معنا', href: '#contact' },
            { label: 'حالة النظام', href: '#status', badge: 'نشط' },
        ]
    },
    legal: {
        title: 'قانوني',
        links: [
            { label: 'سياسة الخصوصية', href: '#privacy' },
            { label: 'الشروط والأحكام', href: '#terms' },
            { label: 'اتفاقية الاستخدام', href: '#agreement' },
            { label: 'ملفات الارتباط', href: '#cookies' },
        ]
    }
};

const SOCIAL_LINKS = [
    {
        name: 'Twitter',
        href: '#',
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
        )
    },
    {
        name: 'LinkedIn',
        href: '#',
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
        )
    },
    {
        name: 'Instagram',
        href: '#',
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
        )
    },
    {
        name: 'YouTube',
        href: '#',
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
        )
    },
];

const CERTIFICATIONS = [
    { name: 'ISO 27001', icon: '🔒' },
    { name: 'ZATCA', icon: '✅' },
    { name: 'SOC 2', icon: '🛡️' },
];

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const [email, setEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);

    const handleSubscribe = (e) => {
        e.preventDefault();
        // TODO: Implement newsletter subscription
        setIsSubscribed(true);
        setEmail('');
        setTimeout(() => setIsSubscribed(false), 3000);
    };

    return (
        <footer className="bg-gray-900 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />
            </div>

            {/* Newsletter Section */}
            <div className="relative z-10 border-b border-gray-800">
                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-4xl mx-auto bg-gradient-to-l from-primary-600/20 to-secondary-600/20 rounded-3xl p-8 md:p-12 border border-white/10 backdrop-blur-sm">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-2">اشترك في نشرتنا البريدية</h3>
                                <p className="text-gray-400">احصل على آخر الأخبار والتحديثات والنصائح مباشرة في بريدك</p>
                            </div>
                            <form onSubmit={handleSubscribe} className="flex-1 w-full">
                                {isSubscribed ? (
                                    <div className="flex items-center justify-center gap-3 py-4 px-6 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>تم الاشتراك بنجاح!</span>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="أدخل بريدك الإلكتروني"
                                            className="flex-1 px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                        />
                                        <button
                                            type="submit"
                                            className="px-8 py-4 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-all flex-shrink-0"
                                        >
                                            اشترك
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="relative z-10 container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary-500/30">
                                م
                            </div>
                            <div>
                                <span className="text-2xl font-bold">منصة مسارات</span>
                                <p className="text-sm text-gray-400">Masarat Platform</p>
                            </div>
                        </div>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            منصة سحابية متكاملة لإدارة المؤسسات، توفر حلولاً شاملة للموارد البشرية والمستودعات والأرشفة وإدارة الحركة والمزيد.
                        </p>

                        {/* Social Links */}
                        <div className="flex items-center gap-3 mb-8">
                            {SOCIAL_LINKS.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center hover:bg-primary-500 transition-all hover:scale-110"
                                    title={social.name}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>

                        {/* Certifications */}
                        <div className="flex flex-wrap gap-3">
                            {CERTIFICATIONS.map((cert) => (
                                <div key={cert.name} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                                    <span className="text-lg">{cert.icon}</span>
                                    <span className="text-sm text-gray-400">{cert.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(FOOTER_LINKS).map(([key, section]) => (
                        <div key={key}>
                            <h4 className="font-bold text-lg mb-5">{section.title}</h4>
                            <ul className="space-y-3">
                                {section.links.filter(link => link.href).map((link, idx) => (
                                    <li key={idx}>
                                        <Link href={link.href || '#'} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                                            {link.icon && <span className="text-lg">{link.icon}</span>}
                                            <span className="group-hover:translate-x-1 transition-transform">{link.label}</span>
                                            {link.badge && (
                                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                                    {link.badge}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* App Download */}
            <div className="relative z-10 border-t border-gray-800">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-right">
                            <h4 className="font-bold text-lg mb-1">حمّل التطبيق</h4>
                            <p className="text-gray-400 text-sm">متاح على iOS و Android</p>
                        </div>
                        <div className="flex gap-4">
                            <a href="/help" className="flex items-center gap-3 px-5 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all border border-white/10">
                                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                </svg>
                                <div className="text-right">
                                    <div className="text-xs text-gray-400">حمّل من</div>
                                    <div className="font-bold">App Store</div>
                                </div>
                            </a>
                            <a href="/help" className="flex items-center gap-3 px-5 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all border border-white/10">
                                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                                </svg>
                                <div className="text-right">
                                    <div className="text-xs text-gray-400">حمّل من</div>
                                    <div className="font-bold">Google Play</div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="relative z-10 border-t border-gray-800 bg-gray-950">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            © {currentYear} منصة مسارات. جميع الحقوق محفوظة.
                        </p>
                        <div className="flex items-center gap-6 text-sm">
                            <Link href="/platform-admin/login" className="text-gray-500 dark:text-gray-400 hover:text-white transition-colors">
                                بوابة إدارة المنصة
                            </Link>
                            <span className="text-gray-700 dark:text-gray-200">•</span>
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                صنع بـ <span className="text-red-500">❤️</span> في السعودية 🇸🇦
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
