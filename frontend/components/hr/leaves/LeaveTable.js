/**
 * مكون جدول الإجازات
 * Leave Table Component
 */

import React, { useState } from 'react';
import { DataTable, Badge } from '../../ui';
import LeaveStatusBadge from './LeaveStatusBadge';
import LeaveApprovalModal from './LeaveApprovalModal';
import { LEAVE_TYPES, formatDate, calculateLeaveDays } from '../../../constants/leave-types';

export default function LeaveTable({
    leaves = [],
    loading = false,
    onApprove,
    onReject,
    onView,
    onEdit,
    onDelete,
    onExtend, // دالة لطلب تمديد الإجازة
    currentUserLevel = null,
    showActions = true,
    showEmployee = true,
    showExtendButton = false, // إظهار زر التمديد للإجازات المعتمدة
    pagination = null,
    onPageChange,
}) {
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);

    const handleViewClick = (leave) => {
        if (onView) {
            onView(leave);
        } else {
            setSelectedLeave(leave);
            setShowApprovalModal(true);
        }
    };

    const handleApprove = async (id) => {
        if (onApprove) {
            await onApprove(id);
            setShowApprovalModal(false);
        }
    };

    const handleReject = async (id, reason) => {
        if (onReject) {
            await onReject(id, reason);
            setShowApprovalModal(false);
        }
    };

    const columns = [
        ...(showEmployee ? [{
            key: 'employee',
            label: 'الموظف',
            render: (_, row) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                        {row.employee_name || row.employee?.full_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {row.employee_id}
                    </div>
                </div>
            ),
        }] : []),
        {
            key: 'leave_type',
            label: 'نوع الإجازة',
            render: (value) => {
                const leaveType = LEAVE_TYPES[value];
                return (
                    <div className="flex items-center gap-2">
                        <span
                            className={`w-2 h-2 rounded-full bg-${leaveType?.color || 'gray'}-500`}
                        />
                        <span>{leaveType?.name || value}</span>
                    </div>
                );
            },
        },
        {
            key: 'dates',
            label: 'الفترة',
            render: (_, row) => (
                <div className="text-sm">
                    <div>{formatDate(row.start_date)}</div>
                    <div className="text-gray-500 dark:text-gray-400">إلى {formatDate(row.end_date)}</div>
                </div>
            ),
        },
        {
            key: 'days_count',
            label: 'عدد الأيام',
            render: (value, row) => (
                <Badge variant="secondary">
                    {value || row.total_days || calculateLeaveDays(row.start_date, row.end_date)} يوم
                </Badge>
            ),
        },
        {
            key: 'status',
            label: 'الحالة',
            render: (value) => <LeaveStatusBadge status={value} />,
        },
        {
            key: 'created_at',
            label: 'تاريخ الطلب',
            render: (value) => (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(value)}
                </span>
            ),
        },
    ];

    // إضافة عمود الإجراءات
    if (showActions) {
        columns.push({
            key: 'actions',
            label: 'الإجراءات',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleViewClick(row)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
                        title="عرض التفاصيل"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>

                    {/* زر تمديد الإجازة - يظهر للإجازات المعتمدة */}
                    {showExtendButton && onExtend && (row.status === 'approved' || row.status === 1) && (
                        <button
                            onClick={() => onExtend(row)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="طلب تمديد"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </button>
                    )}

                    {row.status === 'pending' && currentUserLevel && (
                        <>
                            <button
                                onClick={() => onApprove?.(row.id)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="اعتماد"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleViewClick(row)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                title="رفض"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </>
                    )}

                    {onEdit && row.status === 'pending' && (
                        <button
                            onClick={() => onEdit(row)}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-lg transition-colors"
                            title="تعديل"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    )}

                    {onDelete && row.status === 'pending' && (
                        <button
                            onClick={() => onDelete(row.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            ),
        });
    }

    return (
        <>
            <DataTable
                columns={columns}
                data={leaves}
                loading={loading}
                emptyMessage="لا توجد إجازات"
                pagination={pagination}
                onPageChange={onPageChange}
            />

            {/* نافذة تفاصيل الإجازة */}
            <LeaveApprovalModal
                isOpen={showApprovalModal}
                onClose={() => setShowApprovalModal(false)}
                leave={selectedLeave}
                currentUserLevel={currentUserLevel}
                onApprove={handleApprove}
                onReject={handleReject}
            />
        </>
    );
}

// مكون جدول مبسط للعرض السريع
export function LeaveTableMini({ leaves = [], limit = 5, onViewAll }) {
    const displayLeaves = leaves.slice(0, limit);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white">آخر طلبات الإجازات</h3>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
                    >
                        عرض الكل
                    </button>
                )}
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {displayLeaves.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        لا توجد طلبات إجازات
                    </div>
                ) : (
                    displayLeaves.map((leave) => (
                        <div key={leave.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                                        {(leave.employee_name || leave.employee?.full_name || '؟')[0]}
                                    </span>
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {leave.employee_name || leave.employee?.full_name}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {LEAVE_TYPES[leave.leave_type]?.name || leave.leave_type_name}
                                    </div>
                                </div>
                            </div>
                            <div className="text-left">
                                <LeaveStatusBadge status={leave.status} size="sm" />
                                <div className="text-xs text-gray-400 mt-1">
                                    {formatDate(leave.created_at)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
