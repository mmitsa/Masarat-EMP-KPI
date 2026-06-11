/**
 * مكون طلب تثبيت التطبيق - PWA Install Prompt
 * يظهر شريط سفلي عندما يمكن تثبيت التطبيق كـ PWA
 */

import { useState, useEffect, useCallback } from 'react';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION_DAYS = 7;

/**
 * التحقق من تجاهل المستخدم سابقاً
 */
function isDismissed() {
    if (typeof window === 'undefined') return true;
    try {
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (!dismissed) return false;
        const dismissedAt = parseInt(dismissed, 10);
        const daysSinceDismissal = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
        return daysSinceDismissal < DISMISS_DURATION_DAYS;
    } catch {
        return false;
    }
}

/**
 * التحقق من وضع standalone (iOS)
 */
function isStandalone() {
    if (typeof window === 'undefined') return false;
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
    );
}

/**
 * التحقق من نظام iOS
 */
function isIOS() {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);

    useEffect(() => {
        // لا تعرض إذا كان التطبيق مثبتاً بالفعل
        if (isStandalone()) return;

        // لا تعرض إذا تم التجاهل مؤخراً
        if (isDismissed()) return;

        // معالجة iOS
        if (isIOS()) {
            setShowIOSInstructions(true);
            setShowBanner(true);
            return;
        }

        // معالجة المتصفحات التي تدعم beforeinstallprompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // إخفاء بعد التثبيت
        const handleAppInstalled = () => {
            setShowBanner(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;

        setIsInstalling(true);
        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowBanner(false);
            }
        } catch (err) {
            console.warn('PWA install error:', err);
        } finally {
            setIsInstalling(false);
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    const handleDismiss = useCallback(() => {
        setShowBanner(false);
        try {
            localStorage.setItem(DISMISS_KEY, Date.now().toString());
        } catch {
            // localStorage قد لا يكون متاحاً
        }
    }, []);

    if (!showBanner) return null;

    return (
        <div
            dir="rtl"
            className="fixed bottom-0 inset-x-0 z-50 p-4 animate-slide-up"
            role="alert"
            aria-label="تثبيت التطبيق"
        >
            <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 flex items-center gap-4">
                    {/* App Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6 text-blue-700 dark:text-blue-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                            تثبيت التطبيق
                        </p>
                        {showIOSInstructions ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                اضغط على{' '}
                                <svg className="inline w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                {' '}ثم &quot;إضافة إلى الشاشة الرئيسية&quot;
                            </p>
                        ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                ثبّت منصة مسارات للوصول السريع
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        {!showIOSInstructions && (
                            <button
                                onClick={handleInstall}
                                disabled={isInstalling}
                                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:ring-offset-2"
                                style={{ fontFamily: 'Cairo, sans-serif' }}
                            >
                                {isInstalling ? '...' : 'تثبيت'}
                            </button>
                        )}
                        <button
                            onClick={handleDismiss}
                            className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                            style={{ fontFamily: 'Cairo, sans-serif' }}
                        >
                            لاحقاً
                        </button>
                    </div>
                </div>
            </div>

            {/* Animation styles */}
            <style jsx>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
