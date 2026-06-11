/**
 * مكون نافذة اعتماد الإجازة
 * Leave Approval Modal Component
 */

import React, { useState } from 'react';
import { Modal, Input } from '../../ui';
import LeaveStatusBadge from './LeaveStatusBadge';
import LeaveApprovalFlow from './LeaveApprovalFlow';
import { LEAVE_TYPES, formatDate } from '../../../constants/leave-types';

export default function LeaveApprovalModal({
    isOpen,
    onClose,
    leave,
    currentUserLevel = 'manager',
    onApprove,
    onReject,
    loading = false,
}) {
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);

    if (!leave) return null;

    const leaveType = LEAVE_TYPES[leave.leave_type];

    const handleApprove = async () => {
        if (onApprove) {
            await onApprove(leave.id);
            onClose();
        }
    };

    const handleReject = async () => {
        if (onReject && rejectionReason.trim()) {
            await onReject(leave.id, rejectionReason);
            setRejectionReason('');
            setShowRejectForm(false);
            onClose();
        }
    };

    const handleClose = () => {
        setRejectionReason('');
        setShowRejectForm(false);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="تفاصيل طلب الإجازة"
            size="lg"
        >
            <div className="space-y-6">
                {/* معلومات الموظف */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div>
                        <div className="font-bold text-lg text-gray-900 dark:text-white">
                            {leave.employee_name || leave.employee?.full_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {leave.employee_id} - {leave.department_name || leave.employee?.department}
                        </div>
                    </div>
                    <LeaveStatusBadge status={leave.status} size="lg" />
                </div>

                {/* تفاصيل الإجازة */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">نوع الإجازة</div>
                        <div className="font-bold text-blue-800 dark:text-blue-200">
                            {leaveType?.name || leave.leave_type_name}
                        </div>
                        {leaveType?.days > 0 && (
                            <div className="text-xs text-blue-500 mt-1">
                                الحد الأقصى: {leaveType.days} يوم
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                        <div className="text-sm text-emerald-600 mb-1">عدد الأيام</div>
                        <div className="font-bold text-emerald-800 text-2xl">
                            {leave.days_count || leave.total_days} يوم
                        </div>
                    </div>
                </div>

                {/* التواريخ */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">من تاريخ</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                            {formatDate(leave.start_date)}
                        </div>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">إلى تاريخ</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                            {formatDate(leave.end_date)}
                        </div>
                    </div>
                </div>

                {/* السبب */}
                {leave.reason && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">سبب الإجازة</div>
                        <div className="text-gray-900 dark:text-white">{leave.reason}</div>
                    </div>
                )}

                {/* الموظف البديل */}
                {leave.substitute_name && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                        <div className="text-sm text-amber-600 mb-1">الموظف البديل</div>
                        <div className="font-medium text-amber-800 dark:text-amber-200">
                            {leave.substitute_name}
                        </div>
                    </div>
                )}

                {/* تسلسل الاعتمادات */}
                <div className="border-t pt-4">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">تسلسل الاعتمادات</div>
                    <LeaveApprovalFlow
                        leave={leave}
                        currentUserLevel={currentUserLevel}
                        showActions={false}
                    />
                </div>

                {/* نموذج الرفض */}
                {showRejectForm && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                        <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">سبب الرفض</div>
                        <Input
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="أدخل سبب رفض الطلب..."
                            required
                        />
                        <div className="flex justify-end gap-2 mt-3">
                            <button
                                type="button"
                                onClick={() => setShowRejectForm(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50"
                                disabled={loading}
                            >
                                إلغاء
                            </button>
                            <button
                                type="button"
                                onClick={handleReject}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                disabled={loading || !rejectionReason.trim()}
                            >
                                {loading ? 'جاري الرفض...' : 'تأكيد الرفض'}
                            </button>
                        </div>
                    </div>
                )}

                {/* أزرار الإجراءات */}
                {!showRejectForm && leave.status === 'pending' && (
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/50 rounded-xl hover:bg-gray-200 transition-colors"
                            disabled={loading}
                        >
                            إغلاق
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowRejectForm(true)}
                            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl hover:bg-red-200 transition-colors"
                            disabled={loading}
                        >
                            رفض
                        </button>
                        <button
                            type="button"
                            onClick={handleApprove}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'جاري الاعتماد...' : 'اعتماد'}
                        </button>
                    </div>
                )}

                {/* زر إغلاق فقط للطلبات المعتمدة أو المرفوضة */}
                {leave.status !== 'pending' && (
                    <div className="flex justify-end pt-4 border-t">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            إغلاق
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
