import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import { NAVIGATION } from '../../lib/routes';
import TrashBin from '../TrashBin';
import { UnifiedNotificationCenter } from '../notifications';
import LanguageSwitcher from '../LanguageSwitcher';
import { ThemeSwitcherDropdown } from '../ui/ThemeSwitcher';
import { ColorPaletteDropdown } from '../ui/ColorPalette';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import WalletMiniIndicator from '../wallet/WalletMiniIndicator';

/**
 * Header Component - رأس الصفحة الحكومي
 * Government Header with Search, Notifications, and User Menu
 */
export default function Header({
    user,
    onMenuClick,
    darkMode: darkModeProp,
    title,
    subtitle,
    actions,
    onOpenChat,
}) {
    const router = useRouter();
    const { language, languageInfo } = useLanguage();
    const { isDarkMode: themeIsDarkMode } = useTheme();

    // Use theme context dark mode, fallback to prop
    const darkMode = themeIsDarkMode ?? darkModeProp ?? false;
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const userRef = useRef(null);
    const searchInputRef = useRef(null);

    const defaultUser = {
        name: language === 'ar' ? 'مستخدم' : 'User',
        role: language === 'ar' ? 'موظف' : 'Employee',
        avatar: null
    };

    const currentUser = user || defaultUser;
    const isStandaloneEpm = true;

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userRef.current && !userRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcut for search (Cmd+K / Ctrl+K)
    useEffect(() => {
        if (isStandaloneEpm) return;

        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowSearch(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
            }
            if (e.key === 'Escape') {
                setShowSearch(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle search
    const handleSearch = useCallback((e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
            setShowSearch(false);
            setSearchQuery('');
        }
    }, [searchQuery, router]);

    // Handle logout with full session cleanup
    const handleLogout = async () => {
        // Close user menu
        setShowUserMenu(false);

        // Clear all local storage and session storage
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('dashboard-widgets');
            localStorage.removeItem('dashboard-section-order');
            sessionStorage.clear();
        }

        // Sign out using NextAuth with redirect to login
        await signOut({ callbackUrl: '/login', redirect: true });
    };

    // Get current date
    const [currentDate, setCurrentDate] = useState('');
    useEffect(() => {
        const updateDate = () => {
            const now = new Date();
            setCurrentDate(now.toLocaleDateString(languageInfo.dateLocale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }));
        };
        updateDate();
        const interval = setInterval(updateDate, 60000);
        return () => clearInterval(interval);
    }, [languageInfo.dateLocale]);

    return (
        <>
            <header
                className={`
                    epm-header h-16 border-b flex items-center justify-between px-4 lg:px-6
                    sticky top-0 z-30
                    transition-colors duration-200
                    ${darkMode
                        ? 'bg-neutral-900/95 border-neutral-800 backdrop-blur-lg'
                        : 'bg-white/95 border-neutral-200 backdrop-blur-lg'
                    }
                `}
            >
                {/* Right Section - Mobile Menu & Page Info */}
                <div className="flex items-center gap-3">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={onMenuClick}
                        className={`
                            lg:hidden p-2 rounded-lg transition-colors
                            ${darkMode
                                ? 'hover:bg-neutral-800 text-neutral-400'
                                : 'hover:bg-neutral-100 text-neutral-600'
                            }
                        `}
                        aria-label="فتح القائمة"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Page Title & Date */}
                    <div className="hidden md:block">
                        {title ? (
                            <>
                                <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                                    {title}
                                </h1>
                                {subtitle && (
                                    <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                        {subtitle}
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className={`text-sm ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                {currentDate}
                            </p>
                        )}
                    </div>
                </div>

                {/* Center Section - Search */}
                {!isStandaloneEpm && (
                <div className="hidden lg:flex flex-1 justify-center max-w-xl mx-8" data-tour="header-search">
                    <button
                        onClick={() => setShowSearch(true)}
                        className={`
                            w-full h-10 px-4 rounded-xl text-sm
                            flex items-center gap-3
                            transition-all duration-200
                            ${darkMode
                                ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                                : 'bg-neutral-50 border-neutral-200 text-neutral-500 hover:border-primary-300 hover:bg-white'
                            }
                            border focus:outline-none
                        `}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="flex-1 text-start">
                            {language === 'ar' ? 'البحث في نظام قياس الأداء...' : 'Search performance system...'}
                        </span>
                        <kbd className={`
                            px-2 py-0.5 rounded text-xs font-mono
                            ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}
                        `}>
                            ⌘K
                        </kbd>
                    </button>
                </div>
                )}

                {/* Left Section - Actions & User */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Custom Actions */}
                    {actions && (
                        <div className="hidden sm:flex items-center gap-2 ml-2">
                            {actions}
                        </div>
                    )}

                    {/* Mobile Search */}
                    {!isStandaloneEpm && (
                    <button
                        onClick={() => setShowSearch(true)}
                        className={`
                            lg:hidden p-2 rounded-xl transition-colors
                            ${darkMode ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}
                        `}
                        aria-label="بحث"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                    )}

                    {/* Language Switcher */}
                    {!isStandaloneEpm && <LanguageSwitcher darkMode={darkMode} compact />}

                    {/* Theme Switcher - غير ظاهر في النظام المستقل للحفاظ على الهوية السعودية */}
                    {!isStandaloneEpm && <ThemeSwitcherDropdown />}

                    {/* Color Palette - لوحة الألوان المخصصة */}
                    {!isStandaloneEpm && <ColorPaletteDropdown />}

                    {/* مؤشر محفظة التعزيزات المالية */}
                    {!isStandaloneEpm && <WalletMiniIndicator />}

                    {/* Trash Bin */}
                    {!isStandaloneEpm && <TrashBin darkMode={darkMode} />}

                    {/* Unified Notifications - الإشعارات الموحدة */}
                    {!isStandaloneEpm && <div data-tour="header-notifications">
                        <UnifiedNotificationCenter darkMode={darkMode} onOpenChat={onOpenChat} />
                    </div>}

                    {/* Divider */}
                    <div className={`w-px h-8 mx-1 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-200'}`} />

                    {/* User Menu */}
                    <div className="relative" ref={userRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className={`
                                flex items-center gap-3 p-1.5 rounded-xl transition-colors
                                ${darkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-50'}
                            `}
                            aria-expanded={showUserMenu}
                            aria-haspopup="true"
                        >
                            <div className="text-right hidden sm:block">
                                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                                    {currentUser.name}
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    {currentUser.role}
                                </p>
                            </div>
                            {currentUser.avatar ? (
                                <img
                                    src={currentUser.avatar}
                                    alt={currentUser.name}
                                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary-500/20"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold shadow-sm dark:shadow-gray-900/20">
                                    {currentUser.name.charAt(0)}
                                </div>
                            )}
                        </button>

                        {/* User Dropdown */}
                        {showUserMenu && (
                            <div
                                className={`
                                    absolute left-0 mt-2 w-64 rounded-xl shadow-lg border py-2 z-50
                                    animate-slideUp
                                    ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white dark:bg-gray-900 border-neutral-200'}
                                `}
                            >
                                {/* User Info */}
                                <div className={`px-4 py-3 border-b ${darkMode ? 'border-neutral-800' : 'border-neutral-100'}`}>
                                    <div className="flex items-center gap-3">
                                        {currentUser.avatar ? (
                                            <img
                                                src={currentUser.avatar}
                                                alt={currentUser.name}
                                                className="w-12 h-12 rounded-xl object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                                                {currentUser.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <p className={`font-semibold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                                                {currentUser.name}
                                            </p>
                                            <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                                {currentUser.email || currentUser.role}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {!isStandaloneEpm && (
                                <div className="py-1">
                                    <Link
                                        href={NAVIGATION.PROFILE}
                                        className={`
                                            flex items-center gap-3 px-4 py-2.5 transition-colors
                                            ${darkMode
                                                ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                                                : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                                            }
                                        `}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span className="text-sm">{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</span>
                                    </Link>
                                    <Link
                                        href={NAVIGATION.SETTINGS?.HOME || '/settings'}
                                        className={`
                                            flex items-center gap-3 px-4 py-2.5 transition-colors
                                            ${darkMode
                                                ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                                                : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                                            }
                                        `}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="text-sm">{language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
                                    </Link>
                                    <Link
                                        href="/help"
                                        className={`
                                            flex items-center gap-3 px-4 py-2.5 transition-colors
                                            ${darkMode
                                                ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                                                : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                                            }
                                        `}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm">{language === 'ar' ? 'المساعدة' : 'Help'}</span>
                                    </Link>
                                </div>
                                )}

                                <div className={`border-t my-1 ${darkMode ? 'border-neutral-800' : 'border-neutral-100'}`} />

                                <button
                                    onClick={handleLogout}
                                    className={`
                                        flex items-center gap-3 px-4 py-2.5 w-full transition-colors
                                        ${darkMode
                                            ? 'text-error-400 hover:bg-error-900/20'
                                            : 'text-error-600 hover:bg-error-50'
                                        }
                                    `}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span className="text-sm">{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Search Modal */}
            {showSearch && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
                    onClick={() => setShowSearch(false)}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                    {/* Search Box */}
                    <div
                        className={`
                            relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden
                            animate-slideUp
                            ${darkMode ? 'bg-neutral-900' : 'bg-white dark:bg-gray-900'}
                        `}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form onSubmit={handleSearch}>
                            <div className="flex items-center gap-3 p-4 border-b border-neutral-200 dark:border-neutral-700">
                                <svg
                                    className={`w-6 h-6 flex-shrink-0 ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={language === 'ar' ? 'البحث عن موظفين، مستندات، تقارير...' : 'Search for employees, documents, reports...'}
                                    autoFocus
                                    className={`
                                        flex-1 text-lg bg-transparent border-none outline-none
                                        ${darkMode ? 'text-white placeholder-neutral-500' : 'text-neutral-900 placeholder-neutral-400'}
                                    `}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSearch(false)}
                                    className={`
                                        p-1.5 rounded-lg transition-colors
                                        ${darkMode ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}
                                    `}
                                >
                                    <kbd className={`
                                        px-2 py-0.5 rounded text-xs font-mono
                                        ${darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}
                                    `}>
                                        ESC
                                    </kbd>
                                </button>
                            </div>
                        </form>

                        {/* Quick Links */}
                        <div className="p-4">
                            <p className={`text-xs font-medium mb-3 ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: language === 'ar' ? 'الموظفين' : 'Employees', href: '/hr/employees', icon: '👥' },
                                    { label: language === 'ar' ? 'المستودعات' : 'Warehouse', href: '/warehouse', icon: '📦' },
                                    { label: language === 'ar' ? 'التقارير' : 'Reports', href: '/reports', icon: '📊' },
                                    { label: language === 'ar' ? 'الإعدادات' : 'Settings', href: '/settings', icon: '⚙️' },
                                ].map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setShowSearch(false)}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-xl transition-colors
                                            ${darkMode
                                                ? 'hover:bg-neutral-800 text-neutral-300'
                                                : 'hover:bg-neutral-50 text-neutral-700'
                                            }
                                        `}
                                    >
                                        <span className="text-xl">{item.icon}</span>
                                        <span className="text-sm">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
