/**
 * مكون تسلسل اعتمادات الإجازة
 * Leave Approval Flow Component
 */

import React from 'react';
import { APPROVAL_LEVELS, LEAVE_STATUS } from '../../../constants/leave-types';

import { fmtDate } from '../../../utils/hijriDate';

export default function LeaveApprovalFlow({
    leave,
    currentUserLevel = null,
    onApprove,
    onReject,
    vertical = false,
    showActions = true,
}) {
    if (!leave) return null;

    // تحديد مستويات الاعتماد المطلوبة
    const levels = [];

    // إضافة مستوى الموظف البديل إذا تم تحديده
    if (leave.substitute_employee_id || leave.substituteEmployeeId) {
        levels.push({
            key: 'substitute',
            label: 'الموظف البديل',
            sublabel: leave.substitute_employee_name || leave.substituteEmployeeName,
            field: 'is_substitute_approved',
            dateField: 'substitute_approval_date',
            byField: 'substitute_employee_name',
            notesField: 'substitute_notes',
            rejectionField: 'substitute_rejection_reason',
        });
    }

    // المدير المباشر
    levels.push({
        key: 'manager',
        label: 'المدير المباشر',
        field: 'is_manager_approved',
        dateField: 'manager_approval_date',
        byField: 'manager_approved_by_name',
        notesField: 'manager_notes',
    });

    // صاحب الصلاحية
    levels.push({
        key: 'final',
        label: 'صاحب الصلاحية',
        field: 'is_final_approved',
        dateField: 'final_approval_date',
        byField: 'final_approved_by_name',
        notesField: 'final_notes',
    });

    // إضافة مستوى HR إذا كانت الإجازة تتطلب ذلك
    const requiresHR = ['03', '04', '05', '28', '15', '02', '10'].includes(leave.leave_type);
    if (requiresHR) {
        levels.push({
            key: 'hr',
            label: 'الموارد البشرية',
            field: 'is_hr_approved',
            dateField: 'hr_approval_date',
            byField: 'hr_approved_by_name',
            notesField: 'hr_notes',
        });
    }

    // تحديد حالة كل مستوى
    const getStepStatus = (level) => {
        // التحقق من الرفض
        if (leave.status === 'rejected') {
            // التحقق من مصدر الرفض
            if (level.key === 'substitute' && leave.substitute_rejection_reason) return 'rejected';
            if (leave.rejection_reason?.includes(level.label)) return 'rejected';
        }

        // التحقق من حقل الموافقة (دعم snake_case و camelCase)
        const isApproved = leave[level.field] ||
                          leave[level.field.replace(/_/g, '')] ||
                          leave[toCamelCase(level.field)];

        if (isApproved) return 'approved';

        // تحديد الخطوة النشطة بناءً على مستوى الموافقة الحالي
        const currentLevel = leave.current_approval_level || leave.currentApprovalLevel;
        const levelMap = {
            'substitute': 0,
            'manager': 1,
            'final': 2,
            'hr': 3,
            'completed': 4
        };

        const currentLevelNum = typeof currentLevel === 'number' ? currentLevel : levelMap[currentLevel?.toLowerCase()];
        const thisLevelNum = levelMap[level.key];

        if (thisLevelNum === currentLevelNum && leave.status !== 'rejected') return 'current';
        if (thisLevelNum < currentLevelNum) return 'approved';
        return 'pending';
    };

    // تحويل snake_case إلى camelCase
    const toCamelCase = (str) => {
        return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    };

    // ألوان الحالات
    const statusColors = {
        approved: {
            bg: 'bg-emerald-500',
            border: 'border-emerald-500',
            text: 'text-emerald-600',
            line: 'bg-emerald-500',
        },
        current: {
            bg: 'bg-blue-500',
            border: 'border-blue-500',
            text: 'text-blue-600 dark:text-blue-400',
            line: 'bg-gray-300',
        },
        pending: {
            bg: 'bg-gray-300',
            border: 'border-gray-300 dark:border-gray-600',
            text: 'text-gray-400',
            line: 'bg-gray-300',
        },
        rejected: {
            bg: 'bg-red-500',
            border: 'border-red-500',
            text: 'text-red-600 dark:text-red-400',
            line: 'bg-red-500',
        },
    };

    // أيقونات الحالات
    const StatusIcon = ({ status }) => {
        if (status === 'approved') {
            return (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            );
        }
        if (status === 'rejected') {
            return (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            );
        }
        if (status === 'current') {
            return (
                <svg className="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        }
        return <span className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full" />;
    };

    if (vertical) {
        return (
            <div className="space-y-4">
                {levels.map((level, index) => {
                    const status = getStepStatus(level);
                    const colors = statusColors[status];
                    const isLast = index === levels.length - 1;

                    return (
                        <div key={level.key} className="flex">
                            {/* الخط العمودي والدائرة */}
                            <div className="flex flex-col items-center ml-4">
                                <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center`}>
                                    <StatusIcon status={status} />
                                </div>
                                {!isLast && (
                                    <div className={`w-0.5 h-full min-h-[40px] ${colors.line}`} />
                                )}
                            </div>

                            {/* المحتوى */}
                            <div className="flex-1 pb-4">
                                <div className={`font-medium ${colors.text}`}>{level.label}</div>
                                {leave[level.dateField] && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {fmtDate(leave[level.dateField])}
                                        {leave[level.byField] && ` - ${leave[level.byField]}`}
                                    </div>
                                )}
                                {status === 'rejected' && leave.rejection_reason && (
                                    <div className="text-sm text-red-500 mt-1">
                                        السبب: {leave.rejection_reason}
                                    </div>
                                )}
                                {/* أزرار الإجراءات */}
                                {showActions && status === 'current' && currentUserLevel === level.key && (
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => onApprove?.(leave.id)}
                                            className="px-3 py-1 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                                        >
                                            موافقة
                                        </button>
                                        <button
                                            onClick={() => onReject?.(leave.id)}
                                            className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                                        >
                                            رفض
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // العرض الأفقي
    return (
        <div className="flex items-center justify-between">
            {levels.map((level, index) => {
                const status = getStepStatus(level);
                const colors = statusColors[status];
                const isLast = index === levels.length - 1;

                return (
                    <React.Fragment key={level.key}>
                        {/* الخطوة */}
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}>
                                <StatusIcon status={status} />
                            </div>
                            <div className={`mt-2 text-sm font-medium ${colors.text}`}>
                                {level.label}
                            </div>
                            {leave[level.dateField] && (
                                <div className="text-xs text-gray-400">
                                    {fmtDate(leave[level.dateField])}
                                </div>
                            )}
                        </div>

                        {/* الخط الفاصل */}
                        {!isLast && (
                            <div className={`flex-1 h-0.5 mx-2 ${colors.line}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// مكون مبسط لعرض حالة الاعتماد
export function LeaveApprovalStatus({ leave }) {
    if (!leave) return null;

    const getStatusText = () => {
        if (leave.status === 'rejected') return 'مرفوضة';
        if (leave.status === 'approved') return 'معتمدة';

        // التحقق من مستوى الموافقة الحالي
        const currentLevel = leave.current_approval_level ?? leave.currentApprovalLevel;

        // إذا كان رقم
        if (typeof currentLevel === 'number') {
            switch (currentLevel) {
                case 0: return 'بانتظار موافقة الموظف البديل';
                case 1: return 'بانتظار موافقة المدير المباشر';
                case 2: return 'بانتظار موافقة صاحب الصلاحية';
                case 3: return 'بانتظار موافقة الموارد البشرية';
                case 4: return 'معتمدة';
                default: return 'قيد الانتظار';
            }
        }

        // fallback للحقول القديمة
        if (leave.is_hr_approved || leave.isHRApproved) return 'معتمدة';
        if (leave.is_final_approved || leave.isFinalApproved) return 'بانتظار موافقة HR';
        if (leave.is_manager_approved || leave.isManagerApproved) return 'بانتظار الموافقة النهائية';
        if (leave.is_substitute_approved || leave.isSubstituteApproved) return 'بانتظار موافقة المدير';

        // التحقق من وجود موظف بديل
        if (leave.substitute_employee_id || leave.substituteEmployeeId) {
            return 'بانتظار موافقة الموظف البديل';
        }

        return 'بانتظار موافقة المدير المباشر';
    };

    const getStatusColor = () => {
        if (leave.status === 'rejected') return 'text-red-600 dark:text-red-400';
        if (leave.status === 'approved') return 'text-emerald-600';
        return 'text-amber-600';
    };

    return (
        <span className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
        </span>
    );
}
