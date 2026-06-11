/**
 * Connection Status Component - مكون حالة الاتصال
 *
 * يعرض حالة الاتصال بالخدمات في الوقت الفعلي
 *
 * @version 2.0.0
 * @date 2026-02-03
 */

import React, { useState } from 'react';
import { useConnectionMonitor, SERVICES } from '../../hooks/useConnectionMonitor';

// ============================================
// Connection Status Bar - شريط حالة الاتصال
// ============================================

export function ConnectionStatusBar({ showDetails = false, className = '' }) {
    const {
        isOnline,
        isConnected,
        isChecking,
        healthyCount,
        totalCount,
        allHealthy,
        error,
        refresh,
        reconnectAttempts,
        maxReconnectAttempts,
    } = useConnectionMonitor();

    const [expanded, setExpanded] = useState(false);

    // Don't show if all healthy
    if (allHealthy && isOnline && !error) {
        return null;
    }

    const getStatusColor = () => {
        if (!isOnline) return 'bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600';
        if (!isConnected) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
        if (!allHealthy) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200';
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    };

    const getStatusText = () => {
        if (!isOnline) return 'لا يوجد اتصال بالإنترنت';
        if (!isConnected) return 'غير متصل بالخادم';
        if (!allHealthy) return `${healthyCount}/${totalCount} خدمات متصلة`;
        return 'متصل';
    };

    const getStatusIcon = () => {
        if (!isOnline) {
            return (
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                </svg>
            );
        }
        if (isChecking) {
            return (
                <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            );
        }
        if (!isConnected) {
            return (
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            );
        }
        return (
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    };

    return (
        <div className={`rounded-lg border p-3 mb-4 ${getStatusColor()} ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {getStatusIcon()}
                    <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            {getStatusText()}
                        </p>
                        {reconnectAttempts > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                محاولة إعادة الاتصال {reconnectAttempts}/{maxReconnectAttempts}
                            </p>
                        )}
                        {error && (
                            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={refresh}
                        disabled={isChecking}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 disabled:opacity-50"
                    >
                        {isChecking ? 'جاري الفحص...' : 'إعادة المحاولة'}
                    </button>
                    {showDetails && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700"
                        >
                            {expanded ? 'إخفاء' : 'تفاصيل'}
                        </button>
                    )}
                </div>
            </div>

            {expanded && showDetails && (
                <ServicesStatusGrid className="mt-4" />
            )}
        </div>
    );
}

// ============================================
// Services Status Grid - شبكة حالة الخدمات
// ============================================

export function ServicesStatusGrid({ className = '' }) {
    const { serviceStatuses, isChecking, refresh } = useConnectionMonitor();

    return (
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 ${className}`}>
            {Object.entries(serviceStatuses).map(([key, service]) => (
                <ServiceCard key={key} service={service} />
            ))}
        </div>
    );
}

// ============================================
// Service Card - بطاقة الخدمة
// ============================================

function ServiceCard({ service }) {
    const getStatusColor = () => {
        switch (service.status) {
            case 'healthy':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300';
            case 'unhealthy':
                return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 text-amber-700';
            case 'offline':
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300';
            default:
                return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200';
        }
    };

    const getStatusIndicator = () => {
        switch (service.status) {
            case 'healthy':
                return 'bg-green-500';
            case 'unhealthy':
                return 'bg-amber-500';
            case 'offline':
                return 'bg-red-500';
            default:
                return 'bg-gray-400';
        }
    };

    const getStatusText = () => {
        switch (service.status) {
            case 'healthy':
                return 'متصل';
            case 'unhealthy':
                return 'مشكلة';
            case 'offline':
                return 'غير متصل';
            default:
                return 'غير معروف';
        }
    };

    return (
        <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${getStatusIndicator()}`} />
                <span className="text-sm font-medium truncate">{service.name}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
                <span className="text-xs">{getStatusText()}</span>
                {service.latency && (
                    <span className="text-xs opacity-75">{service.latency}ms</span>
                )}
            </div>
            {service.critical && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    أساسي
                </span>
            )}
        </div>
    );
}

// ============================================
// Connection Indicator - مؤشر الاتصال الصغير
// ============================================

export function ConnectionIndicator({ size = 'sm', showLabel = true }) {
    const { isOnline, isConnected, isChecking, allHealthy } = useConnectionMonitor();

    const sizeClasses = {
        xs: 'w-2 h-2',
        sm: 'w-2.5 h-2.5',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    };

    const getColor = () => {
        if (!isOnline) return 'bg-gray-400';
        if (isChecking) return 'bg-blue-400 animate-pulse';
        if (!isConnected) return 'bg-red-500';
        if (!allHealthy) return 'bg-amber-500';
        return 'bg-green-500';
    };

    const getLabel = () => {
        if (!isOnline) return 'غير متصل';
        if (isChecking) return 'جاري الفحص';
        if (!isConnected) return 'منقطع';
        if (!allHealthy) return 'جزئي';
        return 'متصل';
    };

    return (
        <div className="inline-flex items-center gap-1.5">
            <span className={`rounded-full ${sizeClasses[size]} ${getColor()}`} />
            {showLabel && (
                <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600 dark:text-red-400'}`}>
                    {getLabel()}
                </span>
            )}
        </div>
    );
}

// ============================================
// Full Status Panel - لوحة الحالة الكاملة
// ============================================

export function ConnectionStatusPanel() {
    const {
        isOnline,
        isConnected,
        isChecking,
        serviceStatuses,
        lastCheck,
        healthyCount,
        totalCount,
        allHealthy,
        criticalHealthy,
        error,
        refresh,
        forceReconnect,
        reconnectAttempts,
    } = useConnectionMonitor();

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white">حالة الاتصال</h3>
                <div className="flex items-center gap-3">
                    <ConnectionIndicator size="md" />
                    <button
                        onClick={refresh}
                        disabled={isChecking}
                        className="px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                    >
                        {isChecking ? 'جاري الفحص...' : 'تحديث'}
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className={`text-2xl font-bold ${isOnline ? 'text-green-600' : 'text-red-600 dark:text-red-400'}`}>
                        {isOnline ? '✓' : '✗'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">الإنترنت</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className={`text-2xl font-bold ${criticalHealthy ? 'text-green-600' : 'text-red-600 dark:text-red-400'}`}>
                        {criticalHealthy ? '✓' : '✗'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">الخدمات الأساسية</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className={`text-2xl font-bold ${allHealthy ? 'text-green-600 dark:text-green-400' : 'text-amber-600'}`}>
                        {healthyCount}/{totalCount}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">الخدمات المتصلة</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                        {reconnectAttempts}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">محاولات إعادة الاتصال</div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                    {error}
                    <button
                        onClick={forceReconnect}
                        className="mr-2 underline hover:no-underline"
                    >
                        إعادة تعيين
                    </button>
                </div>
            )}

            {/* Services Grid */}
            <ServicesStatusGrid />

            {/* Last Check */}
            {lastCheck && (
                <div className="mt-4 text-xs text-gray-400 text-center">
                    آخر فحص: {new Date(lastCheck).toLocaleTimeString('ar-SA')}
                </div>
            )}
        </div>
    );
}

// ============================================
// Export
// ============================================

export default ConnectionStatusBar;
