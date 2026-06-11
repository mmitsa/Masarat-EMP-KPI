/**
 * إشعار التحديثات — يظهر بانر عند نشر نسخة جديدة على السيرفر
 *
 * الآلية:
 * 1. يسحب /api/version كل 5 دقائق
 * 2. يقارن buildId الحالي (عند فتح الصفحة) بالجديد
 * 3. عند اكتشاف تغيير → يعرض بانر "يوجد تحديث جديد" + زر "تحديث الآن"
 * 4. المستخدم يختار: تحديث الآن أو لاحقاً
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// فترة التحقق: 1 دقيقة (لاكتشاف التحديثات بسرعة بعد النشر)
const CHECK_INTERVAL = 1 * 60 * 1000;

// مفتاح التخزين المحلي للتأجيل
const DISMISSED_KEY = 'masarat-update-dismissed-build';

export default function UpdateNotification() {
    const [hasUpdate, setHasUpdate] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [updating, setUpdating] = useState(false);
    const initialBuildId = useRef(null);
    const intervalRef = useRef(null);

    /**
     * التحقق من وجود تحديث جديد عبر مقارنة BUILD_ID
     */
    const checkForUpdates = useCallback(async () => {
        try {
            const response = await fetch('/api/version', {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
            });

            if (!response.ok) return;

            const { buildId } = await response.json();

            if (!buildId || buildId === '__development__') return;

            // أول مرة — حفظ النسخة الحالية
            if (!initialBuildId.current) {
                initialBuildId.current = buildId;
                return;
            }

            // مقارنة مع النسخة الأولية
            if (buildId !== initialBuildId.current) {
                // التحقق إذا كان المستخدم أجّل هذا البناء تحديداً
                const dismissedBuild = localStorage.getItem(DISMISSED_KEY);
                if (dismissedBuild === buildId) {
                    return;
                }

                setHasUpdate(true);
                setDismissed(false);
            }
        } catch {
            // تجاهل — الشبكة غير متاحة مؤقتاً
        }
    }, []);

    /**
     * بدء التحقق الدوري
     */
    useEffect(() => {
        // التحقق الأولي بعد 10 ثوانٍ
        const initialTimer = setTimeout(checkForUpdates, 10_000);

        // التحقق الدوري كل 5 دقائق
        intervalRef.current = setInterval(checkForUpdates, CHECK_INTERVAL);

        // الاستماع لأحداث تحديث الـ Service Worker
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (updating) {
                    window.location.reload();
                }
            });
        }

        return () => {
            clearTimeout(initialTimer);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [checkForUpdates, updating]);

    /**
     * تحديث الآن: تنظيف الكاش وإعادة التحميل
     */
    const handleUpdate = useCallback(async () => {
        setUpdating(true);

        try {
            // تنظيف Service Worker cache
            if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(
                    names
                        .filter(n => n.includes('static-resources') || n.includes('next-'))
                        .map(n => caches.delete(n))
                );
            }

            // إعادة تسجيل Service Worker
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(reg => reg.update()));
            }

            // إعادة التحميل
            setTimeout(() => window.location.reload(), 500);
        } catch {
            window.location.reload();
        }
    }, []);

    /**
     * تأجيل التحديث
     */
    const handleDismiss = useCallback(async () => {
        setDismissed(true);

        // حفظ buildId المؤجل حتى لا يظهر مجدداً
        try {
            const res = await fetch('/api/version', { cache: 'no-store' });
            const { buildId } = await res.json();
            if (buildId) localStorage.setItem(DISMISSED_KEY, buildId);
        } catch {
            // لا شيء
        }
    }, []);

    // لا تعرض شيئاً إذا لم يكن هناك تحديث أو تم التأجيل
    if (!hasUpdate || dismissed) return null;

    return (
        <div
            className="border-b px-4 py-3 transition-all duration-300 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            dir="rtl"
            role="alert"
            aria-live="assertive"
        >
            <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* الأيقونة والنص */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="p-2 rounded-xl flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </span>

                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-blue-800 dark:text-blue-200">
                            يوجد تحديث جديد للمنصة
                        </p>
                        <p className="text-xs mt-0.5 text-blue-700 dark:text-blue-300">
                            تم نشر نسخة جديدة. اضغط &quot;تحديث الآن&quot; لتحميل آخر التحديثات.
                        </p>
                    </div>
                </div>

                {/* أزرار الإجراءات */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={handleUpdate}
                        disabled={updating}
                        className={`
                            px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200
                            flex items-center gap-2
                            bg-blue-600 hover:bg-blue-700 text-white shadow-sm dark:shadow-gray-900/20
                            ${updating ? 'opacity-70 cursor-not-allowed' : ''}
                        `}
                    >
                        {updating ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                جاري التحديث...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                تحديث الآن
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleDismiss}
                        className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                        لاحقاً
                    </button>
                </div>
            </div>
        </div>
    );
}
