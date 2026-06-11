/**
 * Approval History Component
 * مكون تاريخ الموافقات
 *
 * @module components/approvals/ApprovalHistory
 * @version 1.0.0
 * @date 2026-02-14
 */

import React from 'react';
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    UserCircleIcon,
    ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

/**
 * Action Type Icons
 */
const ACTION_ICONS = {
    created: ClockIcon,
    approved: CheckCircleIcon,
    rejected: XCircleIcon,
    recalled: XCircleIcon,
    pending: ClockIcon,
};

/**
 * Action Type Colors
 */
const ACTION_COLORS = {
    created: 'text-blue-500',
    approved: 'text-green-500',
    rejected: 'text-red-500',
    recalled: 'text-gray-500 dark:text-gray-400',
    pending: 'text-yellow-500',
};

/**
 * Action Type Labels
 */
const ACTION_LABELS = {
    created: 'تم إنشاء الطلب',
    approved: 'تمت الموافقة',
    rejected: 'تم الرفض',
    recalled: 'تم السحب',
    pending: 'في انتظار الموافقة',
};

/**
 * ApprovalHistory Component
 */
export default function ApprovalHistory({ history = [], loading = false }) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!history || history.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                لا يوجد تاريخ للموافقات
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {history.map((item, index) => {
                const Icon = ACTION_ICONS[item.action] || ClockIcon;
                const color = ACTION_COLORS[item.action] || 'text-gray-500 dark:text-gray-400';
                const label = ACTION_LABELS[item.action] || item.action;

                return (
                    <div
                        key={item.id || index}
                        className="relative pr-8 pb-4 border-r-2 border-gray-200 dark:border-gray-700 last:border-0"
                    >
                        {/* Timeline Icon */}
                        <div className="absolute -right-[13px] top-0">
                            <div className={`rounded-full p-1.5 bg-white dark:bg-gray-800 border-2 ${color} border-current`}>
                                <Icon className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h4 className={`text-sm font-semibold ${color}`}>
                                        {label}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        <UserCircleIcon className="w-4 h-4" />
                                        <span>{item.userName || 'النظام'}</span>
                                    </div>
                                </div>
                                <time className="text-xs text-gray-500 dark:text-gray-500">
                                    {new Date(item.createdAt).toLocaleString('ar-SA', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </time>
                            </div>

                            {/* Comment/Notes */}
                            {item.comment && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-start gap-2">
                                        <ChatBubbleLeftIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            {item.comment}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Step Info */}
                            {item.stepName && (
                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                                    المرحلة: {item.stepName}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
