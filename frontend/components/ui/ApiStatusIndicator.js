/**
 * ApiStatusIndicator Component
 * يعرض حالة الاتصال بالـ Backend API
 *
 * @version 1.0.0
 * @date 2026-02-03
 */

import React, { useState } from 'react';
import { useServiceStatus, useAllServicesStatus } from '../../hooks/useApiStatus';

/**
 * مؤشر حالة الاتصال لخدمة معينة
 */
export function ServiceStatusIndicator({ serviceKey, showLabel = true, size = 'sm' }) {
    const { isConnected, isLoading, error, usingMockData, refresh } = useServiceStatus(serviceKey);

    const sizeClasses = {
        xs: 'w-2 h-2',
        sm: 'w-2.5 h-2.5',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    };

    const statusColor = isLoading
        ? 'bg-gray-400 animate-pulse'
        : isConnected
            ? 'bg-green-500'
            : 'bg-red-500';

    const statusText = isLoading
        ? 'جاري الفحص...'
        : isConnected
            ? 'متصل'
            : 'غير متصل';

    return (
        <div className="inline-flex items-center gap-1.5" title={error || statusText}>
            <span className={`${sizeClasses[size]} rounded-full ${statusColor}`} />
            {showLabel && (
                <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600 dark:text-red-400'}`}>
                    {usingMockData ? 'بيانات تجريبية' : 'بيانات حقيقية'}
                </span>
            )}
        </div>
    );
}

/**
 * شريط حالة الاتصال في أعلى الصفحة
 */
export function ApiStatusBar({ serviceKey }) {
    const { isConnected, isLoading, usingMockData, refresh } = useServiceStatus(serviceKey);
    const [isExpanded, setIsExpanded] = useState(false);

    if (isLoading) return null;

    // لا تعرض الشريط إذا كان متصل
    if (isConnected) return null;

    return (
        <div className={`rounded-lg p-3 mb-4 ${usingMockData ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {usingMockData
                            ? 'الخدمة غير متصلة - يتم عرض بيانات تجريبية'
                            : 'متصل بالخادم'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={refresh}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline"
                    >
                        إعادة المحاولة
                    </button>
                    {usingMockData && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700"
                        >
                            {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                        </button>
                    )}
                </div>
            </div>
            {isExpanded && usingMockData && (
                <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800 text-xs text-gray-600 dark:text-gray-300">
                    <p>لتفعيل البيانات الحقيقية:</p>
                    <code className="block bg-gray-800 text-green-400 p-2 rounded mt-1 overflow-x-auto">
                        cd /Volumes/Projects/All\ Progs && ./scripts/start/start-all.sh docker
                    </code>
                </div>
            )}
        </div>
    );
}

/**
 * نافذة حالة جميع الخدمات
 */
export function AllServicesStatus() {
    const { statuses, isLoading, connectedCount, totalCount, allConnected, refresh } = useAllServicesStatus();

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">حالة الخدمات</h3>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        allConnected
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : connectedCount > 0
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                        {connectedCount}/{totalCount} متصل
                    </span>
                    <button
                        onClick={refresh}
                        disabled={isLoading}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 disabled:opacity-50"
                    >
                        {isLoading ? 'جاري الفحص...' : 'تحديث'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(statuses).map(([key, status]) => (
                    <div
                        key={key}
                        className={`p-3 rounded-lg border ${
                            status.isConnected
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                                status.isConnected ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                {status.name}
                            </span>
                        </div>
                        <p className={`text-xs mt-1 ${
                            status.isConnected ? 'text-green-600' : 'text-red-600 dark:text-red-400'
                        }`}>
                            {status.isConnected ? 'متصل' : status.error || 'غير متصل'}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Badge صغير يظهر في Header
 */
export function DataSourceBadge({ serviceKey }) {
    const { isConnected, isLoading, usingMockData } = useServiceStatus(serviceKey);

    if (isLoading) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
                جاري الاتصال
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            usingMockData
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
                usingMockData ? 'bg-amber-500' : 'bg-green-500'
            }`} />
            {usingMockData ? 'Demo' : 'Live'}
        </span>
    );
}

export default ServiceStatusIndicator;
