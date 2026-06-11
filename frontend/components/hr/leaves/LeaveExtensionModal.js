/**
 * مكون نافذة تمديد الإجازة
 * Leave Extension Modal Component
 */

import React, { useState, useEffect } from 'react';
import { Modal, Input, Button } from '../../ui';
import { calculateLeaveDays } from '../../../constants/leave-types';

import { fmtDate } from '../../../utils/hijriDate';

export default function LeaveExtensionModal({
    isOpen,
    onClose,
    leave, // الإجازة المراد تمديدها
    onSubmit,
    loading = false,
    errors = {},
}) {
    const [form, setForm] = useState({
        leaveId: '',
        newEndDate: '',
        reason: '',
        attachmentPath: '',
    });

    const [extensionDays, setExtensionDays] = useState(0);
    const [warnings, setWarnings] = useState([]);

    // تهيئة النموذج عند فتح النافذة
    useEffect(() => {
        if (leave && isOpen) {
            setForm({
                leaveId: leave.id?.toString() || '',
                newEndDate: '',
                reason: '',
                attachmentPath: '',
            });
            setExtensionDays(0);
            setWarnings([]);
        }
    }, [leave, isOpen]);

    // حساب أيام التمديد
    useEffect(() => {
        if (form.newEndDate && leave?.endDate) {
            const currentEnd = new Date(leave.endDate);
            const newEnd = new Date(form.newEndDate);

            if (newEnd > currentEnd) {
                const days = Math.ceil((newEnd - currentEnd) / (1000 * 60 * 60 * 24));
                setExtensionDays(days);
                setWarnings([]);
            } else {
                setExtensionDays(0);
                setWarnings(['تاريخ النهاية الجديد يجب أن يكون بعد تاريخ النهاية الحالي']);
            }
        } else {
            setExtensionDays(0);
        }
    }, [form.newEndDate, leave?.endDate]);

    // تحديث الحقل
    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    // إرسال النموذج
    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit && extensionDays > 0) {
            onSubmit({
                ...form,
                extensionDays,
            });
        }
    };

    if (!leave) return null;

    // تنسيق التاريخ للعرض
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return fmtDate(date);
    };

    // الحد الأدنى لتاريخ النهاية الجديد
    const minEndDate = leave.endDate
        ? new Date(new Date(leave.endDate).getTime() + 86400000).toISOString().split('T')[0]
        : '';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="طلب تمديد إجازة"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* معلومات الإجازة الحالية */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">معلومات الإجازة الحالية</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">الموظف:</span>
                            <span className="font-medium mr-2">{leave.employeeName || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">نوع الإجازة:</span>
                            <span className="font-medium mr-2">{leave.typeName || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">من تاريخ:</span>
                            <span className="font-medium mr-2">{formatDate(leave.startDate)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">إلى تاريخ:</span>
                            <span className="font-medium mr-2">{formatDate(leave.endDate)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">عدد الأيام:</span>
                            <span className="font-medium mr-2">{leave.totalDays || '-'} يوم</span>
                        </div>
                        {leave.substituteEmployeeName && (
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">الموظف البديل:</span>
                                <span className="font-medium mr-2">{leave.substituteEmployeeName}</span>
                            </div>
                        )}
                    </div>

                    {/* عرض التمديدات السابقة إن وجدت */}
                    {leave.extensionCount > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-amber-600 text-sm flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                تم تمديد هذه الإجازة {leave.extensionCount} مرة سابقاً
                            </span>
                        </div>
                    )}
                </div>

                {/* تاريخ النهاية الجديد */}
                <Input
                    label="تاريخ النهاية الجديد"
                    type="date"
                    value={form.newEndDate}
                    onChange={(e) => handleChange('newEndDate', e.target.value)}
                    min={minEndDate}
                    required
                    error={errors.newEndDate}
                />

                {/* عدد أيام التمديد */}
                {extensionDays > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-blue-700 dark:text-blue-300">
                            <span className="font-bold text-lg">{extensionDays}</span>
                            <span className="mr-1">يوم تمديد</span>
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                            إجمالي أيام الإجازة بعد التمديد: {(leave.totalDays || 0) + extensionDays} يوم
                        </div>
                    </div>
                )}

                {/* تحذيرات */}
                {warnings.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        {warnings.map((warning, idx) => (
                            <div key={idx} className="text-sm text-amber-600 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {warning}
                            </div>
                        ))}
                    </div>
                )}

                {/* سبب التمديد */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        سبب التمديد <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={form.reason}
                        onChange={(e) => handleChange('reason', e.target.value)}
                        placeholder="أدخل سبب طلب التمديد..."
                        required
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 resize-none"
                    />
                    {errors.reason && (
                        <p className="mt-1 text-sm text-red-500">{errors.reason}</p>
                    )}
                </div>

                {/* ملاحظة للموظف البديل */}
                {leave.substituteEmployeeId && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="text-sm text-purple-700 dark:text-purple-300 flex items-start gap-2">
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>
                                سيتم إرسال طلب التمديد للموظف البديل ({leave.substituteEmployeeName}) للموافقة عليه أولاً، ثم للمدير المباشر.
                            </span>
                        </div>
                    </div>
                )}

                {/* أزرار الإجراءات */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/50 rounded-xl hover:bg-gray-200 transition-colors"
                        disabled={loading}
                    >
                        إلغاء
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                        disabled={loading || extensionDays <= 0 || warnings.length > 0}
                    >
                        {loading ? 'جاري الإرسال...' : 'إرسال طلب التمديد'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

/**
 * مكون عرض تمديدات الإجازة
 * Leave Extensions List Component
 */
export function LeaveExtensionsList({ extensions = [], onApprove, loading = false }) {
    if (!extensions || extensions.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                لا توجد تمديدات لهذه الإجازة
            </div>
        );
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            0: { text: 'قيد الانتظار', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700' },
            1: { text: 'معتمد', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
            2: { text: 'مرفوض', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
            3: { text: 'ملغي', color: 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200' },
        };
        const config = statusConfig[status] || statusConfig[0];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const getLevelBadge = (level) => {
        const levelConfig = {
            0: { text: 'الموظف البديل', color: 'bg-purple-100 text-purple-700 dark:text-purple-300' },
            1: { text: 'المدير', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
            2: { text: 'مكتمل', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
        };
        const config = levelConfig[level] || levelConfig[0];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return fmtDate(date);
    };

    return (
        <div className="space-y-3">
            {extensions.map((ext, index) => (
                <div key={ext.id || index} className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-900/20">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-2">
                            {getStatusBadge(ext.status)}
                            {ext.status === 0 && getLevelBadge(ext.currentApprovalLevel)}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(ext.createdAt)}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">من:</span>
                            <span className="font-medium mr-1">{formatDate(ext.previousEndDate)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">إلى:</span>
                            <span className="font-medium mr-1">{formatDate(ext.newEndDate)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">أيام التمديد:</span>
                            <span className="font-medium mr-1">{ext.extensionDays} يوم</span>
                        </div>
                    </div>

                    {ext.reason && (
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <span className="text-gray-500 dark:text-gray-400">السبب:</span>
                            <span className="mr-1">{ext.reason}</span>
                        </div>
                    )}

                    {ext.rejectionReason && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            <span className="font-medium">سبب الرفض:</span>
                            <span className="mr-1">{ext.rejectionReason}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
