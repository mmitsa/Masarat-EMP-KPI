import React from 'react';
import { Badge } from '../ui';

import { fmtDate } from '../../utils/hijriDate';

// ═══════════════════════════════════════════════════════════════
// مؤشر حالة محضر الاستلام
// Receipt Status Indicator Component
// ═══════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
    Draft: {
        label: 'مسودة',
        color: 'gray',
        bgColor: 'bg-gray-100 dark:bg-gray-700/50',
        textColor: 'text-gray-700 dark:text-gray-200',
        borderColor: 'border-gray-300 dark:border-gray-600',
        icon: '📝',
        description: 'المحضر قيد الإعداد ولم يتم إرساله للفحص',
        step: 1,
    },
    UnderInspection: {
        label: 'قيد الفحص',
        color: 'purple',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-700 dark:text-purple-300',
        borderColor: 'border-purple-300',
        icon: '🔍',
        description: 'المحضر أمام لجنة الفحص والاستلام',
        step: 2,
    },
    Approved: {
        label: 'معتمد',
        color: 'green',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-700 dark:text-green-300',
        borderColor: 'border-green-300',
        icon: '✅',
        description: 'تم اعتماد المحضر من قبل الجهة المختصة',
        step: 3,
    },
    Rejected: {
        label: 'مرفوض',
        color: 'red',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-700 dark:text-red-300',
        borderColor: 'border-red-300',
        icon: '❌',
        description: 'تم رفض المحضر',
        step: 0,
    },
    Cancelled: {
        label: 'ملغي',
        color: 'gray',
        bgColor: 'bg-gray-100 dark:bg-gray-700/50',
        textColor: 'text-gray-500 dark:text-gray-400',
        borderColor: 'border-gray-300 dark:border-gray-600',
        icon: '🚫',
        description: 'تم إلغاء المحضر',
        step: 0,
    },
    Posted: {
        label: 'مرحّل للمخزون',
        color: 'blue',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-700 dark:text-blue-300',
        borderColor: 'border-blue-300',
        icon: '📦',
        description: 'تم ترحيل المحضر للمخزون وإضافة الأصناف',
        step: 4,
    },
};

const WORKFLOW_STEPS = [
    { key: 'Draft', label: 'مسودة', icon: '📝' },
    { key: 'UnderInspection', label: 'الفحص', icon: '🔍' },
    { key: 'Approved', label: 'الاعتماد', icon: '✅' },
    { key: 'Posted', label: 'الترحيل', icon: '📦' },
];

// Simple Badge Indicator
export function ReceiptStatusBadge({ status, size = 'md' }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses[size]}`}
        >
            <span>{config.icon}</span>
            {config.label}
        </span>
    );
}

// Full Status Card
export function ReceiptStatusCard({ status, receiptNumber, receiptDate, lastUpdate }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;

    return (
        <div className={`rounded-xl border-2 ${config.borderColor} ${config.bgColor} p-4`}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center text-2xl`}
                    >
                        {config.icon}
                    </div>
                    <div>
                        <div className={`font-bold text-lg ${config.textColor}`}>{config.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{config.description}</div>
                    </div>
                </div>
                {receiptNumber && (
                    <div className="text-left">
                        <div className="font-mono font-bold text-gray-700 dark:text-gray-200">{receiptNumber}</div>
                        {receiptDate && (
                            <div className="text-xs text-gray-400">
                                {fmtDate(receiptDate)}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {lastUpdate && (
                <div className="mt-3 pt-3 border-t border-gray-200/50 text-xs text-gray-500 dark:text-gray-400">
                    آخر تحديث: {new Date(lastUpdate).toLocaleString('ar-SA')}
                </div>
            )}
        </div>
    );
}

// Workflow Progress Indicator
export function ReceiptWorkflowProgress({ status, compact = false }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
    const currentStep = config.step;

    if (status === 'Rejected' || status === 'Cancelled') {
        return (
            <div className={`rounded-xl ${config.bgColor} p-4`}>
                <div className="flex items-center gap-3">
                    <div className="text-3xl">{config.icon}</div>
                    <div>
                        <div className={`font-bold ${config.textColor}`}>{config.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{config.description}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 ${compact ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center justify-between">
                {WORKFLOW_STEPS.map((step, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = currentStep >= stepNumber;
                    const isCurrent = currentStep === stepNumber;
                    const isLast = index === WORKFLOW_STEPS.length - 1;

                    return (
                        <React.Fragment key={step.key}>
                            {/* Step */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`relative flex items-center justify-center ${compact ? 'w-10 h-10' : 'w-14 h-14'
                                        } rounded-full transition-all ${isCompleted
                                            ? 'bg-green-500 text-white'
                                            : isCurrent
                                                ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                                                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-400'
                                        }`}
                                >
                                    {isCompleted && !isCurrent ? (
                                        <CheckIcon className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
                                    ) : (
                                        <span className={compact ? 'text-lg' : 'text-xl'}>{step.icon}</span>
                                    )}
                                    {isCurrent && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping"></span>
                                    )}
                                </div>
                                <div
                                    className={`mt-2 text-center ${compact ? 'text-xs' : 'text-sm'} ${isCurrent ? 'font-bold text-blue-600 dark:text-blue-400' : isCompleted ? 'text-green-600' : 'text-gray-400'
                                        }`}
                                >
                                    {step.label}
                                </div>
                            </div>

                            {/* Connector */}
                            {!isLast && (
                                <div className="flex-1 mx-2">
                                    <div
                                        className={`h-1 rounded-full transition-all ${currentStep > stepNumber
                                                ? 'bg-green-500'
                                                : currentStep === stepNumber
                                                    ? 'bg-gradient-to-l from-gray-200 to-blue-500'
                                                    : 'bg-gray-200'
                                            }`}
                                    ></div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

// Detailed Timeline Indicator
export function ReceiptStatusTimeline({ status, activities = [] }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;

    // Filter status-related activities
    const statusActivities = activities.filter(a =>
        [1, 3, 4, 5, 7, 8, 9, 10, 11].includes(a.activityType)
    );

    return (
        <div className="space-y-4">
            {/* Current Status */}
            <ReceiptStatusCard status={status} />

            {/* Status Timeline */}
            {statusActivities.length > 0 && (
                <div className="relative pr-6">
                    <div className="absolute right-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    <div className="space-y-4">
                        {statusActivities.map((activity, index) => (
                            <div key={activity.id || index} className="relative flex items-start gap-4">
                                <div
                                    className={`absolute right-0 w-4 h-4 rounded-full border-2 border-white ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                                        }`}
                                ></div>
                                <div className="bg-white dark:bg-gray-900 rounded-lg border p-3 flex-1 mr-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{activity.activityTypeName}</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(activity.activityDate).toLocaleString('ar-SA')}
                                        </span>
                                    </div>
                                    {activity.performedByName && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            بواسطة: {activity.performedByName}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Mini Status Indicator (for tables)
export function ReceiptStatusDot({ status }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;

    const dotColors = {
        gray: 'bg-gray-400',
        purple: 'bg-purple-500',
        green: 'bg-green-500',
        red: 'bg-red-500',
        blue: 'bg-blue-500',
    };

    return (
        <span className="inline-flex items-center gap-2">
            <span
                className={`w-2 h-2 rounded-full ${dotColors[config.color]} ${status === 'UnderInspection' ? 'animate-pulse' : ''
                    }`}
            ></span>
            <span className="text-sm">{config.label}</span>
        </span>
    );
}

// Helper Icon
function CheckIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
    );
}

export default {
    ReceiptStatusBadge,
    ReceiptStatusCard,
    ReceiptWorkflowProgress,
    ReceiptStatusTimeline,
    ReceiptStatusDot,
};
