import React, { useState, useEffect } from 'react';
import { useTheme as useAppTheme, useUser } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { NAVIGATION } from '../../lib/routes';
import { navigateTo } from '../../lib/routeHelpers';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../ui/ToastContainer';
import { useToastStore } from '../../hooks/useToast';
import ErrorBoundary from '../ui/ErrorBoundary';
import { useNavigationStore } from '../../hooks/useNavigationLoading';
import { ContentOverlay } from './NavigationProgress';
import NewsTicker from '../dashboard/widgets/NewsTicker';
import PasswordExpiryBanner from './PasswordExpiryBanner';

// Offline & Updates Components
import { NetworkStatusProvider } from '../../context/NetworkStatusContext';
import OfflineStatusBar from '../ui/OfflineStatusBar';
import UpdateNotification from '../ui/UpdateNotification';

// Chat Components
import InternalChat, { InternalChatButton, CHAT_PANEL_WIDTH } from '../chat/InternalChat';
import SmartAssistant, { SmartAssistantButton } from '../assistant/SmartAssistant';
import { WelcomePopup, TipPopup } from '../assistant/WelcomePopup';

// ITSM Support Components (للموظفين)
import SupportButton from '../itsm/SupportButton';
import SupportWidget from '../itsm/SupportWidget';
import { useGlobalShortcuts, ShortcutsHelp } from '../../hooks/useKeyboardShortcuts';

// Guided Tour Component (الجولة التعريفية)
import GuidedTour from '../guided-tour/GuidedTour';


export default function AppLayout({
    children,
    title = 'نظام قياس الأداء الوظيفي',
    subtitle,
    actions,
    showSidebar = true,
    showHeader = true,
    showChat = false,
    fullWidth = true
}) {
    const router = useRouter();
    const appTheme = useAppTheme();
    const { isDarkMode, toggleDarkMode, isGovernmentTheme, toggleTheme: toggleThemeType } = useTheme();
    const user = useUser();
    const unreadCount = 0;
    const moduleKnowledge = null;
    const publishedItems = [];
    const isMinimized = true;
    const toasts = useToastStore((state) => state.toasts);
    const removeToast = useToastStore((state) => state.removeToast);
    const isNavigating = useNavigationStore((state) => state.isNavigating);

    // Use theme context dark mode
    const darkMode = isDarkMode;
    const toggleTheme = toggleDarkMode;

    // Sidebar collapse state with localStorage persistence
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        try {
            return localStorage.getItem('sidebar-collapsed') === 'true';
        } catch { return false; }
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [assistantOpen, setAssistantOpen] = useState(false);
    const [internalChatOpen, setInternalChatOpen] = useState(false);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

    // فتح الشات مع إغلاق المساعد الذكي
    const openChat = () => {
        setAssistantOpen(false);
        setInternalChatOpen(true);
    };

    // فتح المساعد مع إغلاق الشات
    const openAssistant = () => {
        setInternalChatOpen(false);
        setAssistantOpen(true);
    };

    // حفظ حالة طيّ السايدبار في localStorage
    React.useEffect(() => {
        try { localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed)); } catch {}
    }, [sidebarCollapsed]);

    // حساب إزاحة الأيقونات العائمة بناءً على اللوحة المفتوحة
    const floatingButtonsLeft = internalChatOpen ? CHAT_PANEL_WIDTH + 24 : assistantOpen ? 408 : 24;
    
    // Keyboard Shortcuts
    useGlobalShortcuts({
        onSearch: () => {
            // يمكن فتح modal للبحث
            console.log('Global search');
        },
        onHelp: () => setShowShortcutsHelp(true),
        onToggleSidebar: () => setSidebarCollapsed(!sidebarCollapsed),
        onToggleTheme: () => toggleTheme(),
        enabled: true,
    });

    // تم إزالة الـ useEffect الذي كان يطوي الـ Sidebar تلقائياً
    // الآن الـ Sidebar يبقى معروضاً دائماً في جميع الشاشات

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [router.pathname]);

    // Handle logout using NextAuth signOut
    const handleLogout = async () => {
        // Clear any stored session/auth data
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            sessionStorage.clear();
        }
        // Sign out using NextAuth and redirect to login
        await signOut({ callbackUrl: '/login' });
    };

    const pageTitle = title ? `${title} | نظام قياس الأداء الوظيفي` : 'نظام قياس الأداء الوظيفي';

    return (
        <NetworkStatusProvider>
            <Head>
                <title>{pageTitle}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className="epm-app-shell min-h-screen transition-colors duration-300 bg-[var(--color-background)]" dir="rtl">
                {/* شريط حالة الاتصال والتحديثات */}
                <OfflineStatusBar />
                <UpdateNotification />

                {/* Sidebar */}
                {showSidebar && (
                    <>
                        {/* Desktop Sidebar */}
                        <div className="hidden lg:block" data-tour="sidebar">
                            <Sidebar
                                collapsed={sidebarCollapsed}
                                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                                darkMode={darkMode}
                                onThemeToggle={toggleTheme}
                                user={user}
                                onLogout={handleLogout}
                            />
                        </div>

                        {/* Mobile Sidebar Overlay */}
                        {mobileMenuOpen && (
                            <div className="lg:hidden fixed inset-0 z-50">
                                <div
                                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                                    onClick={() => setMobileMenuOpen(false)}
                                ></div>
                                <div className="absolute top-0 right-0 h-full">
                                    <Sidebar
                                        collapsed={false}
                                        onToggle={() => setMobileMenuOpen(false)}
                                        darkMode={darkMode}
                                        onThemeToggle={toggleTheme}
                                        user={user}
                                        onLogout={handleLogout}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Main Content */}
                <div
                    className={`${showSidebar
                        ? sidebarCollapsed
                            ? 'lg:mr-20'
                            : 'lg:mr-72'
                        : ''
                        }`}
                    style={{
                        marginLeft: (internalChatOpen || assistantOpen)
                            ? `${internalChatOpen ? CHAT_PANEL_WIDTH : 384}px`
                            : undefined,
                        transition: 'margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.3s ease',
                    }}
                >
                    {/* Header */}
                    {showHeader && (
                        <Header
                            onMenuClick={() => setMobileMenuOpen(true)}
                            darkMode={darkMode}
                            onThemeToggle={toggleTheme}
                            user={user}
                            title={title}
                            subtitle={subtitle}
                            actions={actions}
                            onOpenChat={openChat}
                        />
                    )}

                    {/* بانر تحذير انتهاء كلمة المرور */}
                    <PasswordExpiryBanner />

                    {/* Page Content - Responsive padding for better screen usage */}
                    <main className={`
                        epm-content-surface
                        w-full overflow-x-hidden break-words wrap-anywhere no-x-scroll
                        px-3 py-4 sm:px-4 sm:py-5 md:px-5 lg:px-6 lg:py-6
                        ${fullWidth ? '' : 'max-w-7xl mx-auto'}
                        relative
                        ${publishedItems.length > 0 && !isMinimized ? 'pb-14' : ''}
                    `}>
                        {/* محتوى الصفحة مع تأثير انتقالي */}
                        <div
                            style={{
                                opacity: isNavigating ? 0.3 : 1,
                                filter: isNavigating ? 'blur(1px)' : 'none',
                                transition: 'opacity 150ms ease, filter 150ms ease',
                                pointerEvents: isNavigating ? 'none' : 'auto',
                            }}
                        >
                            {/* Page Title (when no header) */}
                            {!showHeader && (title || subtitle || actions) && (
                                <div className="mb-4 sm:mb-6 flex items-center justify-between flex-wrap gap-2">
                                    <div>
                                        {title && (
                                            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                {title}
                                            </h1>
                                        )}
                                        {subtitle && (
                                            <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {subtitle}
                                            </p>
                                        )}
                                    </div>
                                    {actions && <div>{actions}</div>}
                                </div>
                            )}

                            {/* Children */}
                            <ErrorBoundary>
                                {children}
                            </ErrorBoundary>
                        </div>

                        {/* Skeleton overlay أثناء التنقل */}
                        {isNavigating && <ContentOverlay />}
                    </main>
                </div>

                {/* Floating Action Buttons - تنزلق مع اللوحة المفتوحة */}
                {showChat && (
                    <div
                        className="fixed bottom-14 z-40 flex flex-col gap-3 transition-all duration-300"
                        style={{ left: `${floatingButtonsLeft}px` }}
                        data-tour="floating-buttons"
                    >
                        {/* IT Support Button - للموظفين لطلب الدعم الفني */}
                        <SupportButton />

                        {/* Internal Chat Button */}
                        <InternalChatButton
                            onClick={openChat}
                            darkMode={darkMode}
                            unreadCount={unreadCount}
                        />

                        {/* Smart Assistant Button */}
                        <SmartAssistantButton
                            onClick={openAssistant}
                            darkMode={darkMode}
                            moduleKnowledge={moduleKnowledge}
                        />
                    </div>
                )}

                {showChat && (
                    <>
                        {/* IT Support Widget - ويدجت الدعم الفني للموظفين */}
                        <SupportWidget />

                        {/* Smart Assistant Panel */}
                        <SmartAssistant
                            isOpen={assistantOpen}
                            onClose={() => setAssistantOpen(false)}
                            darkMode={darkMode}
                        />

                        {/* Internal Chat Panel - لوحة جانبية يسرى */}
                        <InternalChat
                            isOpen={internalChatOpen}
                            onClose={() => setInternalChatOpen(false)}
                            darkMode={darkMode}
                        />
                    </>
                )}

                {/* Backdrop للوحات الجانبية على الشاشات الكبيرة - اختياري */}
                {/* يمكن إزالته إذا لم يكن مرغوباً */}

                {showChat && (
                    <>
                        {/* Welcome Popup */}
                        <WelcomePopup darkMode={darkMode} />

                        {/* Tip Popup */}
                        <TipPopup darkMode={darkMode} />

                        {/* الجولة التعريفية */}
                        <GuidedTour />
                    </>
                )}

                {/* Toast Notifications */}
                <ToastContainer
                    toasts={toasts}
                    onClose={removeToast}
                />
                
                {/* Keyboard Shortcuts Help */}
                {showShortcutsHelp && (
                    <ShortcutsHelp onClose={() => setShowShortcutsHelp(false)} />
                )}

                {showChat && (
                    <NewsTicker
                        darkMode={darkMode}
                        sidebarWidth={showSidebar ? (sidebarCollapsed ? 80 : 288) : 0}
                    />
                )}
            </div>
        </NetworkStatusProvider>
    );
}
