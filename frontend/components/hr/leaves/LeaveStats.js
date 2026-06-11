/**
 * مكون إحصائيات الإجازات
 * Leave Statistics Component
 */

import React from 'react';
import { LEAVE_STATUS } from '../../../constants/leave-types';

export default function LeaveStats({
    stats = {},
    loading = false,
    period = 'الشهر الحالي',
}) {
    const defaultStats = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        inProgress: 0,
        totalDays: 0,
        byType: {},
        ...stats,
    };

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-900/20 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                        <div className="h-8 bg-gray-200 rounded w-16" />
                    </div>
                ))}
            </div>
        );
    }

    const statCards = [
        {
            label: 'إجمالي الطلبات',
            value: defaultStats.total,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            color: 'blue',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            textColor: 'text-blue-600 dark:text-blue-400',
            iconColor: 'text-blue-500',
        },
        {
            label: 'قيد الانتظار',
            value: defaultStats.pending,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'amber',
            bgColor: 'bg-amber-50 dark:bg-amber-900/20',
            textColor: 'text-amber-600',
            iconColor: 'text-amber-500',
        },
        {
            label: 'معتمدة',
            value: defaultStats.approved,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'emerald',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
            textColor: 'text-emerald-600',
            iconColor: 'text-emerald-500',
        },
        {
            label: 'مرفوضة',
            value: defaultStats.rejected,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'red',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            textColor: 'text-red-600 dark:text-red-400',
            iconColor: 'text-red-500',
        },
    ];

    return (
        <div className="space-y-4">
            {/* العنوان */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">إحصائيات الإجازات</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{period}</span>
            </div>

            {/* البطاقات */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className={`${stat.bgColor} rounded-xl p-4 transition-transform hover:scale-105`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className={`${stat.iconColor}`}>{stat.icon}</span>
                        </div>
                        <div className={`text-2xl font-bold ${stat.textColor}`}>
                            {stat.value}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* إحصائيات إضافية */}
            {defaultStats.totalDays > 0 && (
                <div className="bg-gradient-to-l from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-blue-100 text-sm">إجمالي أيام الإجازات المعتمدة</div>
                            <div className="text-3xl font-bold">{defaultStats.totalDays} يوم</div>
                        </div>
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// مكون إحصائيات حسب النوع
export function LeaveStatsByType({ stats = {}, loading = false }) {
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-900/20">
                <div className="h-4 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-24" />
                            <div className="h-4 bg-gray-200 rounded w-16" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const types = Object.entries(stats).sort((a, b) => b[1] - a[1]);

    if (types.length === 0) {
        return null;
    }

    const total = types.reduce((sum, [, count]) => sum + count, 0);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">الإجازات حسب النوع</h4>
            <div className="space-y-3">
                {types.map(([type, count]) => {
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return (
                        <div key={type}>
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-700 dark:text-gray-200">{type}</span>
                                <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// مكون ملخص سريع
export function LeaveQuickStats({ pending = 0, approvedToday = 0, onLeaveToday = 0 }) {
    return (
        <div className="flex gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-sm text-amber-700">{pending} طلب قيد الانتظار</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-sm text-emerald-700">{approvedToday} تم اعتماده اليوم</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm text-blue-700 dark:text-blue-300">{onLeaveToday} موظف في إجازة اليوم</span>
            </div>
        </div>
    );
}
