/**
 * مكون بطاقة رصيد الإجازات
 * Leave Balance Card Component
 */

import React from 'react';
import { ContentCard } from '../../ui';

export default function LeaveBalanceCard({
    title = 'رصيد الإجازات',
    balances = {},
    loading = false,
    compact = false,
    showCarried = true,
}) {
    // الأرصدة الافتراضية
    const defaultBalances = {
        annual: { total: 21, used: 0, remaining: 21, carried: 0 },
        sick: { total: 30, used: 0, remaining: 30 },
        emergency: { total: 5, used: 0, remaining: 5 },
    };

    const data = { ...defaultBalances, ...balances };

    // حساب النسبة المئوية
    const getPercentage = (used, total) => {
        if (total === 0) return 0;
        return Math.round((used / total) * 100);
    };

    // ألوان الأنواع
    const colors = {
        annual: { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-600' },
        sick: { bg: 'bg-red-500', light: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
        emergency: { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-600' },
    };

    // أسماء الأنواع
    const labels = {
        annual: 'السنوية',
        sick: 'المرضية',
        emergency: 'الطارئة',
    };

    if (loading) {
        return (
            <ContentCard title={title}>
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
                    ))}
                </div>
            </ContentCard>
        );
    }

    if (compact) {
        return (
            <div className="grid grid-cols-3 gap-3">
                {Object.entries(data).map(([type, balance]) => (
                    <div
                        key={type}
                        className={`p-3 rounded-xl ${colors[type]?.light || 'bg-gray-100 dark:bg-gray-700/50'} text-center`}
                    >
                        <div className={`text-2xl font-bold ${colors[type]?.text || 'text-gray-700 dark:text-gray-200'}`}>
                            {balance.remaining}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{labels[type]} من {balance.total}</div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <ContentCard title={title}>
            <div className="space-y-4">
                {Object.entries(data).map(([type, balance]) => {
                    const percentage = getPercentage(balance.used, balance.total);
                    const color = colors[type] || { bg: 'bg-gray-500', light: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-600 dark:text-gray-300' };

                    return (
                        <div key={type} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-gray-700 dark:text-gray-200">{labels[type] || type}</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-lg font-bold ${color.text}`}>
                                        {balance.remaining}
                                    </span>
                                    <span className="text-sm text-gray-400">/ {balance.total}</span>
                                </div>
                            </div>

                            {/* شريط التقدم */}
                            <div className={`h-2 ${color.light} rounded-full overflow-hidden`}>
                                <div
                                    className={`h-full ${color.bg} rounded-full transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>

                            <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <span>مستخدم: {balance.used} يوم</span>
                                {showCarried && balance.carried > 0 && (
                                    <span className="text-blue-500">مرحل: {balance.carried} يوم</span>
                                )}
                                <span>{percentage}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ContentCard>
    );
}

// بطاقة رصيد صغيرة
export function LeaveBalanceMini({ type, balance, color = 'emerald' }) {
    const colors = {
        emerald: 'text-emerald-600 bg-emerald-100',
        red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
        amber: 'text-amber-600 bg-amber-100',
        blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    };

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors[color]}`}>
            <span className="text-sm font-medium">{type}:</span>
            <span className="font-bold">{balance.remaining}</span>
            <span className="text-xs opacity-70">/ {balance.total}</span>
        </div>
    );
}
