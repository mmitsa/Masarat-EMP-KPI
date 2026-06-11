/**
 * Navigation Progress - شريط تقدم التنقل + overlay المحتوى
 *
 * يوفر تجربة تحميل سلسة أثناء التنقل بين الصفحات
 * - شريط تقدم علوي بتأثير shimmer
 * - overlay على المحتوى مع skeleton بعد 300ms
 *
 * @version 1.0.0
 * @date 2026-02-09
 */

import React, { useState, useEffect } from 'react';
import { useNavigationStore } from '../../hooks/useNavigationLoading';
import { useTheme } from '../../context/ThemeContext';
import { SkeletonDashboard } from '../ui/Skeleton';

/**
 * شريط التقدم العلوي - يُعرض في _app.js
 */
export function NavigationProgress() {
    const isNavigating = useNavigationStore((s) => s.isNavigating);
    const [visible, setVisible] = useState(false);
    const [finishing, setFinishing] = useState(false);

    useEffect(() => {
        if (isNavigating) {
            setVisible(true);
            setFinishing(false);
        } else if (visible) {
            // عند انتهاء التنقل: أكمل الشريط ثم أخفه
            setFinishing(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setFinishing(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isNavigating]);

    if (!visible) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
            style={{ height: '3px' }}
            dir="ltr"
        >
            <div
                className={`h-full transition-all ${finishing ? 'duration-200' : 'duration-[2s]'}`}
                style={{
                    width: finishing ? '100%' : '85%',
                    background: 'linear-gradient(90deg, #0A3319, #165C2D, #D4AF37, #165C2D, #0A3319)',
                    backgroundSize: '200% 100%',
                    animation: finishing ? 'none' : 'navShimmer 1.5s ease-in-out infinite',
                    opacity: finishing ? 0 : 1,
                    transition: finishing
                        ? 'width 200ms ease-out, opacity 200ms ease-out 100ms'
                        : 'width 2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 0 8px rgba(22, 92, 45, 0.45)',
                    borderRadius: '0 2px 2px 0',
                }}
            />
            <style jsx>{`
                @keyframes navShimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}

/**
 * overlay المحتوى - يُعرض داخل AppLayout فوق المحتوى
 */
export function ContentOverlay() {
    const { isDarkMode } = useTheme();
    const [showSkeleton, setShowSkeleton] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowSkeleton(true), 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className="absolute inset-0 z-10 flex items-start justify-center"
            style={{
                backdropFilter: showSkeleton ? 'blur(2px)' : 'none',
                transition: 'backdrop-filter 200ms ease',
            }}
        >
            {showSkeleton && (
                <div
                    className={`w-full h-full p-4 sm:p-5 lg:p-6 ${isDarkMode ? 'bg-gray-900/80' : 'bg-gray-50/80'}`}
                    style={{
                        animation: 'navFadeIn 200ms ease-out',
                    }}
                >
                    {/* رسالة التحميل */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="relative">
                            <div
                                className={`w-5 h-5 rounded-full border-2 border-t-transparent animate-spin ${isDarkMode ? 'border-green-400' : 'border-green-700'}`}
                            />
                        </div>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                            جارِ تحميل الصفحة...
                        </span>
                    </div>

                    <SkeletonDashboard />
                </div>
            )}

            <style jsx>{`
                @keyframes navFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
