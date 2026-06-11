/**
 * مكون مسار اعتمادات إخلاء الطرف
 * Clearance Approval Flow Component
 */

import React from 'react';
import { CLEARANCE_DEPARTMENTS, DEPARTMENT_STATUS } from '../../../constants/clearance-types';

import { fmtDate } from '../../../utils/hijriDate';

export default function ClearanceApprovalFlow({
    clearance,
    currentUserDepartment = null,
    onApprove,
    onReject,
    vertical = false,
    showActions = true,
    compact = false,
}) {
    if (!clearance || !clearance.departments) return null;

    const departments = clearance.departments.sort((a, b) => {
        const orderA = CLEARANCE_DEPARTMENTS[a.id]?.order || 99;
        const orderB = CLEARANCE_DEPARTMENTS[b.id]?.order || 99;
        return orderA - orderB;
    });

    const getStatusConfig = (status) => {
        return DEPARTMENT_STATUS[status] || DEPARTMENT_STATUS.pending;
    };

    const StatusIcon = ({ status }) => {
        if (status === 'approved') {
            return (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            );
        }
        if (status === 'rejected') {
            return (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            );
        }
        if (status === 'not_applicable') {
            return (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                </svg>
            );
        }
        return (
            <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    };

    const getStatusColors = (status) => {
        const colors = {
            approved: {
                bg: 'bg-emerald-500',
                border: 'border-emerald-500',
                text: 'text-emerald-600',
                line: 'bg-emerald-500',
                lightBg: 'bg-emerald-50 dark:bg-emerald-900/20',
            },
            rejected: {
                bg: 'bg-red-500',
                border: 'border-red-500',
                text: 'text-red-600 dark:text-red-400',
                line: 'bg-red-500',
                lightBg: 'bg-red-50 dark:bg-red-900/20',
            },
            pending: {
                bg: 'bg-gray-300',
                border: 'border-gray-300 dark:border-gray-600',
                text: 'text-gray-500 dark:text-gray-400',
                line: 'bg-gray-200',
                lightBg: 'bg-gray-50 dark:bg-gray-800',
            },
            not_applicable: {
                bg: 'bg-gray-400',
                border: 'border-gray-400',
                text: 'text-gray-400',
                line: 'bg-gray-300',
                lightBg: 'bg-gray-50 dark:bg-gray-800',
            },
        };
        return colors[status] || colors.pending;
    };

    const canTakeAction = (dept) => {
        return showActions &&
            dept.status === 'pending' &&
            currentUserDepartment === dept.id;
    };

    // العرض العمودي
    if (vertical) {
        return (
            <div className="space-y-2">
                {departments.map((dept, index) => {
                    const config = CLEARANCE_DEPARTMENTS[dept.id];
                    const colors = getStatusColors(dept.status);
                    const isLast = index === departments.length - 1;

                    return (
                        <div key={dept.id} className="flex">
                            {/* الخط العمودي والدائرة */}
                            <div className="flex flex-col items-center ml-4">
                                <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center shadow-md`}>
                                    <StatusIcon status={dept.status} />
                                </div>
                                {!isLast && (
                                    <div className={`w-1 flex-1 min-h-[50px] ${colors.line}`} />
                                )}
                            </div>

                            {/* المحتوى */}
                            <div className={`flex-1 pb-6 ${compact ? 'pb-4' : ''}`}>
                                <div className={`rounded-xl p-4 ${colors.lightBg} border-2 ${colors.border}`}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1">
                                            <div className={`text-base font-bold ${colors.text}`}>
                                                {config?.label || dept.id}
                                                {!config?.required && (
                                                    <span className="text-sm font-normal text-gray-400 mr-2">(اختياري)</span>
                                                )}
                                            </div>
                                            {!compact && config?.description && (
                                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{config.description}</div>
                                            )}
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${colors.bg} text-white whitespace-nowrap`}>
                                            {getStatusConfig(dept.status).label}
                                        </span>
                                    </div>

                                    {/* معلومات الاعتماد */}
                                    {dept.approvedBy && (
                                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 border-t pt-2">
                                            <span>{dept.status === 'approved' ? 'موافقة' : 'رفض'} بواسطة: </span>
                                            <span className="font-medium">{dept.approvedBy}</span>
                                            {dept.approvedDate && (
                                                <span className="mr-2">
                                                    - {fmtDate(dept.approvedDate)}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* ملاحظات */}
                                    {dept.notes && (
                                        <div className="mt-2 text-sm bg-white dark:bg-gray-900 rounded p-2 border">
                                            <span className="text-gray-500 dark:text-gray-400">ملاحظات: </span>
                                            {dept.notes}
                                        </div>
                                    )}

                                    {/* أزرار الإجراءات */}
                                    {canTakeAction(dept) && (
                                        <div className="flex gap-2 mt-3 pt-3 border-t">
                                            <button
                                                onClick={() => onApprove?.(clearance.id, dept.id)}
                                                className="flex-1 px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                            >
                                                موافقة
                                            </button>
                                            <button
                                                onClick={() => onReject?.(clearance.id, dept.id)}
                                                className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                            >
                                                رفض
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // العرض الأفقي (Grid)
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {departments.map((dept) => {
                const config = CLEARANCE_DEPARTMENTS[dept.id];
                const colors = getStatusColors(dept.status);

                return (
                    <div
                        key={dept.id}
                        className={`rounded-xl p-4 border-2 ${colors.border} ${colors.lightBg} transition-all hover:shadow-md`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center shadow-sm dark:shadow-gray-900/20`}>
                                <StatusIcon status={dept.status} />
                            </div>
                            {!config?.required && (
                                <span className="text-sm text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-lg">اختياري</span>
                            )}
                        </div>

                        {/* Title */}
                        <h4 className={`text-base font-bold ${colors.text} mb-2`}>
                            {config?.label || dept.id}
                        </h4>

                        {/* Status */}
                        <div className={`text-sm font-medium ${colors.text} mb-2`}>
                            {getStatusConfig(dept.status).label}
                        </div>

                        {/* Approver Info */}
                        {dept.approvedBy && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 border-t pt-2 mt-2">
                                <div className="font-medium">{dept.approvedBy}</div>
                                {dept.approvedDate && (
                                    <div className="text-gray-400">{fmtDate(dept.approvedDate)}</div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        {canTakeAction(dept) && (
                            <div className="flex gap-2 mt-3 pt-3 border-t">
                                <button
                                    onClick={() => onApprove?.(clearance.id, dept.id)}
                                    className="flex-1 px-3 py-2 text-sm font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                >
                                    موافقة
                                </button>
                                <button
                                    onClick={() => onReject?.(clearance.id, dept.id)}
                                    className="flex-1 px-3 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    رفض
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// مكون ملخص التقدم
export function ClearanceProgressSummary({ clearance }) {
    if (!clearance || !clearance.departments) return null;

    const total = clearance.departments.length;
    const approved = clearance.departments.filter(d => d.status === 'approved').length;
    const rejected = clearance.departments.filter(d => d.status === 'rejected').length;
    const pending = total - approved - rejected;
    const progress = Math.round((approved / total) * 100);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-900/20">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-700 dark:text-gray-200">تقدم إخلاء الطرف</h4>
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 mb-5">
                <div
                    className="bg-gradient-to-r from-blue-500 to-emerald-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-100">
                    <div className="text-2xl font-bold text-emerald-600">{approved}</div>
                    <div className="text-sm font-medium text-emerald-600 mt-1">مكتمل</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-100">
                    <div className="text-2xl font-bold text-amber-600">{pending}</div>
                    <div className="text-sm font-medium text-amber-600 mt-1">قيد الانتظار</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-100">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{rejected}</div>
                    <div className="text-sm font-medium text-red-600 dark:text-red-400 mt-1">مرفوض</div>
                </div>
            </div>
        </div>
    );
}
