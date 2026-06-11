/**
 * PlatformAdminLayout - Layout بوابة إدارة المنصة
 * يوفر هيكل الصفحة الكامل مع السايدبار والهيدر
 */

import React, { useState } from 'react';
import Head from 'next/head';
import PlatformAdminSidebar from './PlatformAdminSidebar';
import { usePlatformAdmin, withPlatformAdmin } from '../../lib/platformAuth';

function PlatformAdminLayoutInner({ title, subtitle, children, actions }) {
    const { adminUser } = usePlatformAdmin();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <Head>
                <title>{title ? `${title} | إدارة المنصة` : 'إدارة المنصة | منصة مسارات'}</title>
            </Head>

            <div className="min-h-screen bg-gray-950" dir="rtl">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block">
                    <PlatformAdminSidebar
                        collapsed={sidebarCollapsed}
                        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    />
                </div>

                {/* Mobile Sidebar */}
                {mobileMenuOpen && (
                    <div className="lg:hidden">
                        <PlatformAdminSidebar
                            collapsed={false}
                            onToggleCollapse={() => setMobileMenuOpen(false)}
                        />
                    </div>
                )}

                {/* Main Content Area */}
                <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:mr-20' : 'lg:mr-72'}`}>
                    {/* Header */}
                    <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/50">
                        <div className="flex items-center justify-between h-14 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                {/* Mobile menu button */}
                                <button
                                    onClick={() => setMobileMenuOpen(true)}
                                    className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>

                                <div>
                                    <h1 className="text-white font-bold text-base">{title || 'إدارة المنصة'}</h1>
                                    {subtitle && <p className="text-gray-500 dark:text-gray-400 text-xs">{subtitle}</p>}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Actions */}
                                {actions && <div className="flex items-center gap-2">{actions}</div>}

                                {/* Admin info (desktop only) */}
                                <div className="hidden sm:flex items-center gap-2 text-left">
                                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                        <span className="text-purple-400 font-bold text-xs">
                                            {adminUser?.name?.charAt(0) || 'م'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-white text-xs font-medium">{adminUser?.name}</p>
                                        <p className="text-gray-500 dark:text-gray-400 text-[10px]">{adminUser?.role === 'super_platform_admin' ? 'مدير المنصة' : 'فريق الدعم'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="p-4 sm:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}

// تصدير مع حماية المصادقة
function PlatformAdminLayout(props) {
    return <PlatformAdminLayoutInner {...props} />;
}

export default withPlatformAdmin(PlatformAdminLayout);
