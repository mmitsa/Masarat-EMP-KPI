/**
 * شريط حالة الاتصال - Offline Status Bar
 * يظهر في أعلى الصفحة لإعلام المستخدم بحالة الاتصال والمزامنة
 */

import React, { useState, useEffect } from 'react';
import { useNetworkStatus } from '../../context/NetworkStatusContext';
import { SyncStatus } from '../../lib/syncEngine';

export default function OfflineStatusBar() {
    const { isOnline, syncStatus, lastSyncAt, pendingOpsCount, forceSync } = useNetworkStatus();
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // إظهار الشريط عند عدم الاتصال أو وجود عمليات معلقة
        if (!isOnline || pendingOpsCount > 0 || syncStatus === SyncStatus.ERROR) {
            setVisible(true);
            setDismissed(false);
        } else if (syncStatus === SyncStatus.SYNCED && pendingOpsCount === 0) {
            // إخفاء بعد 3 ثوانٍ من المزامنة الناجحة
            const timer = setTimeout(() => setVisible(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, syncStatus, pendingOpsCount]);

    if (!visible || dismissed) return null;

    const getStatusConfig = () => {
        if (!isOnline) {
            return {
                bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                iconBg: 'bg-red-100 dark:bg-red-900/30',
                iconColor: 'text-red-600 dark:text-red-400',
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12h.01" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                    </svg>
                ),
                text: 'غير متصل بالإنترنت',
                subtext: 'البيانات محفوظة محلياً وستتم المزامنة عند عودة الاتصال',
                textColor: 'text-red-800 dark:text-red-200',
            };
        }

        if (syncStatus === SyncStatus.SYNCING) {
            return {
                bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
                iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
                iconColor: 'text-yellow-600',
                icon: (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                ),
                text: 'جاري المزامنة...',
                subtext: pendingOpsCount > 0
                    ? `${pendingOpsCount} عملية في الانتظار`
                    : 'جاري سحب التحديثات',
                textColor: 'text-yellow-800 dark:text-yellow-200',
            };
        }

        if (syncStatus === SyncStatus.ERROR) {
            return {
                bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200',
                iconBg: 'bg-orange-100',
                iconColor: 'text-orange-600',
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                ),
                text: 'خطأ في المزامنة',
                subtext: 'سيتم إعادة المحاولة تلقائياً',
                textColor: 'text-orange-800 dark:text-orange-200',
            };
        }

        if (pendingOpsCount > 0) {
            return {
                bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                ),
                text: `${pendingOpsCount} عملية في انتظار المزامنة`,
                subtext: null,
                textColor: 'text-blue-800 dark:text-blue-200',
            };
        }

        // Synced
        return {
            bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
            iconBg: 'bg-green-100 dark:bg-green-900/30',
            iconColor: 'text-green-600 dark:text-green-400',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            ),
            text: 'تمت المزامنة',
            subtext: lastSyncAt
                ? `آخر مزامنة: ${formatTimeAgo(lastSyncAt)}`
                : null,
            textColor: 'text-green-800 dark:text-green-200',
        };
    };

    const config = getStatusConfig();

    return (
        <div className={`${config.bg} border-b px-4 py-2 flex items-center justify-between text-sm transition-all duration-300`}
             dir="rtl">
            <div className="flex items-center gap-2">
                <span className={`${config.iconBg} ${config.iconColor} p-1 rounded-full flex items-center justify-center`}>
                    {config.icon}
                </span>
                <span className={`font-medium ${config.textColor}`}>{config.text}</span>
                {config.subtext && (
                    <span className={`${config.textColor} opacity-70`}>- {config.subtext}</span>
                )}
            </div>
            <div className="flex items-center gap-2">
                {isOnline && pendingOpsCount > 0 && (
                    <button
                        onClick={forceSync}
                        className="text-xs bg-white dark:bg-gray-900 border rounded-lg px-3 py-1 hover:bg-gray-50 transition-colors"
                    >
                        مزامنة الآن
                    </button>
                )}
                {isOnline && (
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="إغلاق"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

function formatTimeAgo(date) {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);

    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
}
