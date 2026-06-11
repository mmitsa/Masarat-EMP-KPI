/**
 * PlatformAdminSidebar - سايدبار بوابة إدارة المنصة
 * سايدبار مخصص لإدارة المنصة بتصميم Dark Theme
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { usePlatformAdmin } from '../../lib/platformAuth';

// تكوين عناصر التنقل
const navigationItems = [
    {
        id: 'dashboard',
        label: 'لوحة التحكم',
        path: '/platform-admin',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 12a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
            </svg>
        ),
    },
    {
        id: 'tenants',
        label: 'المستأجرون',
        path: '/platform-admin/tenants',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
    },
    {
        id: 'subscriptions',
        label: 'الاشتراكات',
        path: '/platform-admin/subscriptions',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
        ),
    },
    {
        id: 'billing',
        label: 'الفوترة والمدفوعات',
        path: '/platform-admin/billing',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        ),
    },
    {
        id: 'free-trials',
        label: 'طلبات التجربة المجانية',
        path: '/platform-admin/free-trials',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
        ),
    },
    {
        id: 'modules',
        label: 'الوحدات والأنظمة',
        path: '/platform-admin/modules',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
    },
    { id: 'divider-1', type: 'divider' },
    {
        id: 'admin-users',
        label: 'مستخدمو الإدارة',
        path: '/platform-admin/admin-users',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
    },
    {
        id: 'notifications',
        label: 'الإشعارات',
        path: '/platform-admin/notifications',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
    },
    {
        id: 'contact-requests',
        label: 'طلبات التواصل',
        path: '/platform-admin/contact-requests',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
    },
    { id: 'divider-2', type: 'divider' },
    {
        id: 'landing',
        label: 'الصفحة التعريفية',
        path: '/platform-admin/landing',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
        ),
    },
    {
        id: 'analytics',
        label: 'التحليلات',
        path: '/platform-admin/analytics',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    },
];

export default function PlatformAdminSidebar({ collapsed, onToggleCollapse }) {
    const router = useRouter();
    const { adminUser, logout } = usePlatformAdmin();
    const currentPath = router.pathname;

    const isActive = (path) => {
        if (path === '/platform-admin') {
            return currentPath === '/platform-admin';
        }
        return currentPath === path || currentPath.startsWith(path + '/');
    };

    const handleLogout = () => {
        logout();
        router.push('/platform-admin/login');
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={`hidden lg:flex flex-col fixed top-0 right-0 h-screen z-40 transition-all duration-300 ${
                    collapsed ? 'w-20' : 'w-72'
                } bg-gray-900 border-l border-gray-800`}
            >
                {/* Logo / Header */}
                <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-800 shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-lg">م</span>
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <h1 className="text-white font-bold text-sm truncate">إدارة المنصة</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-xs truncate">لوحة التحكم الرئيسية</p>
                        </div>
                    )}
                    <button
                        onClick={onToggleCollapse}
                        className="mr-auto p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                        title={collapsed ? 'توسيع' : 'تصغير'}
                    >
                        <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
                    {navigationItems.map((item) => {
                        if (item.type === 'divider') {
                            return (
                                <div key={item.id} className="my-3 border-t border-gray-800" />
                            );
                        }

                        const active = isActive(item.path);

                        return (
                            <Link key={item.id} href={item.path}>
                                <button
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                                        collapsed ? 'justify-center' : ''
                                    } ${
                                        active
                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800/60 border border-transparent'
                                    }`}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <span className={`shrink-0 ${active ? 'text-purple-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-300'}`}>
                                        {item.icon}
                                    </span>
                                    {!collapsed && (
                                        <span className="text-sm font-medium truncate">{item.label}</span>
                                    )}
                                    {active && !collapsed && (
                                        <span className="mr-auto w-1.5 h-1.5 rounded-full bg-purple-400" />
                                    )}
                                </button>
                            </Link>
                        );
                    })}
                </nav>

                {/* رابط العودة للوحة التحكم الرئيسية */}
                <div className="px-3 py-2 border-t border-gray-800">
                    <Link href="/dashboard">
                        <button
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 ${
                                collapsed ? 'justify-center' : ''
                            }`}
                            title="العودة للوحة التحكم"
                        >
                            <svg className="w-5 h-5 shrink-0 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                            </svg>
                            {!collapsed && <span className="text-sm font-medium">لوحة التحكم الرئيسية</span>}
                        </button>
                    </Link>
                </div>

                {/* User Info & Logout */}
                <div className="px-3 py-3 border-t border-gray-800 shrink-0">
                    {!collapsed ? (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                                <span className="text-purple-400 font-bold text-sm">
                                    {adminUser?.name?.charAt(0) || 'م'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{adminUser?.name}</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{adminUser?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                                title="تسجيل الخروج"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="w-full flex justify-center p-2 text-gray-500 dark:text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="تسجيل الخروج"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    )}
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {!collapsed && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onToggleCollapse} />
                    <aside className="absolute top-0 right-0 h-full w-72 bg-gray-900 border-l border-gray-800 shadow-2xl overflow-y-auto">
                        {/* Mobile Header */}
                        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">م</span>
                                </div>
                                <div>
                                    <h1 className="text-white font-bold text-sm">إدارة المنصة</h1>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs">لوحة التحكم الرئيسية</p>
                                </div>
                            </div>
                            <button
                                onClick={onToggleCollapse}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Mobile Navigation */}
                        <nav className="py-4 px-3 space-y-1">
                            {navigationItems.map((item) => {
                                if (item.type === 'divider') {
                                    return <div key={item.id} className="my-3 border-t border-gray-800" />;
                                }

                                const active = isActive(item.path);

                                return (
                                    <Link key={item.id} href={item.path}>
                                        <button
                                            onClick={onToggleCollapse}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                                                active
                                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60 border border-transparent'
                                            }`}
                                        >
                                            <span className={active ? 'text-purple-400' : 'text-gray-500 dark:text-gray-400'}>{item.icon}</span>
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </button>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Mobile - Back to main dashboard */}
                        <div className="px-3 py-2 border-t border-gray-800">
                            <Link href="/dashboard">
                                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200">
                                    <svg className="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                                    </svg>
                                    <span className="text-sm font-medium">لوحة التحكم الرئيسية</span>
                                </button>
                            </Link>
                        </div>

                        {/* Mobile User Info */}
                        <div className="px-3 py-3 border-t border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                    <span className="text-purple-400 font-bold text-sm">{adminUser?.name?.charAt(0) || 'م'}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{adminUser?.name}</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{adminUser?.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="تسجيل الخروج"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}
