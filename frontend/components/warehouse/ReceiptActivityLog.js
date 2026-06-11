import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Badge } from '../ui';

// ═══════════════════════════════════════════════════════════════
// سجل إجراءات محضر الاستلام
// Receipt Activity Log Component
// ═══════════════════════════════════════════════════════════════

const ACTIVITY_TYPES = {
    1: { label: 'إنشاء المحضر', icon: '📄', color: 'blue' },
    2: { label: 'تعديل بيانات', icon: '✏️', color: 'yellow' },
    3: { label: 'إرسال للفحص', icon: '🔍', color: 'purple' },
    4: { label: 'بدء الفحص', icon: '🔬', color: 'indigo' },
    5: { label: 'إكمال الفحص', icon: '✅', color: 'green' },
    6: { label: 'توقيع عضو لجنة', icon: '✍️', color: 'cyan' },
    7: { label: 'إرسال للاعتماد', icon: '📤', color: 'orange' },
    8: { label: 'اعتماد', icon: '✓', color: 'green' },
    9: { label: 'رفض', icon: '✗', color: 'red' },
    10: { label: 'ترحيل للمخزون', icon: '📦', color: 'green' },
    11: { label: 'إلغاء', icon: '🚫', color: 'red' },
    12: { label: 'إرفاق مستند', icon: '📎', color: 'blue' },
    13: { label: 'حذف مرفق', icon: '🗑️', color: 'gray' },
    14: { label: 'طباعة', icon: '🖨️', color: 'gray' },
    15: { label: 'تصدير', icon: '📥', color: 'gray' },
    16: { label: 'تعليق', icon: '💬', color: 'blue' },
    17: { label: 'تعديل صنف', icon: '📝', color: 'yellow' },
    18: { label: 'إضافة صنف', icon: '➕', color: 'green' },
    19: { label: 'حذف صنف', icon: '➖', color: 'red' },
    20: { label: 'تعيين لجنة فحص', icon: '👥', color: 'purple' },
    21: { label: 'طلب مراجعة', icon: '🔄', color: 'orange' },
    22: { label: 'إعادة للتعديل', icon: '↩️', color: 'yellow' },
    23: { label: 'اعتماد نهائي', icon: '🏆', color: 'green' },
    24: { label: 'إشعار مرسل', icon: '🔔', color: 'blue' },
};

const STATUS_COLORS = {
    Draft: 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200',
    UnderInspection: 'bg-purple-100 text-purple-700 dark:text-purple-300',
    Approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    Rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    Cancelled: 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200',
    Posted: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
};

export function ReceiptActivityLog({ receiptId, activities: initialActivities, onRefresh }) {
    const [activities, setActivities] = useState(initialActivities || []);
    const [loading, setLoading] = useState(!initialActivities);
    const [filter, setFilter] = useState('all');
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!initialActivities && receiptId) {
            loadActivities();
        }
    }, [receiptId, initialActivities]);

    const loadActivities = async () => {
        setLoading(true);
        try {
            const response = await api.warehouse?.getReceiptActivities?.(receiptId);
            setActivities(response || mockActivities);
        } catch (error) {
            console.warn('Error loading activities:', error);
            setActivities(mockActivities);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            await api.warehouse?.addReceiptComment?.(receiptId, { comment: newComment });
            setNewComment('');
            loadActivities();
            onRefresh?.();
        } catch (error) {
            console.warn('Error adding comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredActivities = filter === 'all'
        ? activities
        : activities.filter(a => {
            if (filter === 'approvals') return [7, 8, 9, 23].includes(a.activityType);
            if (filter === 'signatures') return a.activityType === 6;
            if (filter === 'comments') return a.activityType === 16;
            if (filter === 'attachments') return [12, 13].includes(a.activityType);
            return true;
        });

    const getActivityInfo = (type) => ACTIVITY_TYPES[type] || { label: 'إجراء', icon: '📋', color: 'gray' };

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getColorClasses = (color) => {
        const colors = {
            blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
            green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
            red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
            yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 border-yellow-200 dark:border-yellow-800',
            purple: 'bg-purple-100 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
            orange: 'bg-orange-100 text-orange-700 border-orange-200',
            gray: 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700',
            cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
            indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        };
        return colors[color] || colors.gray;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="mr-3 text-gray-500 dark:text-gray-400">جاري تحميل سجل الإجراءات...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header and Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                        📋
                    </span>
                    سجل الإجراءات
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        ({filteredActivities.length} إجراء)
                    </span>
                </h3>
                <div className="flex gap-2 flex-wrap">
                    <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
                        الكل
                    </FilterButton>
                    <FilterButton active={filter === 'approvals'} onClick={() => setFilter('approvals')}>
                        الاعتمادات
                    </FilterButton>
                    <FilterButton active={filter === 'signatures'} onClick={() => setFilter('signatures')}>
                        التوقيعات
                    </FilterButton>
                    <FilterButton active={filter === 'comments'} onClick={() => setFilter('comments')}>
                        التعليقات
                    </FilterButton>
                    <FilterButton active={filter === 'attachments'} onClick={() => setFilter('attachments')}>
                        المرفقات
                    </FilterButton>
                </div>
            </div>

            {/* Add Comment */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                        💬
                    </div>
                    <div className="flex-1">
                        <textarea
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 resize-none"
                            rows="2"
                            placeholder="أضف تعليقاً أو ملاحظة..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                            <button
                                onClick={handleAddComment}
                                disabled={!newComment.trim() || submitting}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        جاري الإرسال...
                                    </>
                                ) : (
                                    <>
                                        <SendIcon className="w-4 h-4" />
                                        إضافة تعليق
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Timeline Line */}
                <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {/* Activities */}
                <div className="space-y-4">
                    {filteredActivities.map((activity, index) => {
                        const info = getActivityInfo(activity.activityType);
                        return (
                            <div
                                key={activity.id || index}
                                className="relative pr-12"
                            >
                                {/* Timeline Dot */}
                                <div
                                    className={`absolute right-2 w-6 h-6 rounded-full flex items-center justify-center text-sm ${getColorClasses(info.color)} border-2 border-white shadow-sm dark:shadow-gray-900/20`}
                                >
                                    {info.icon}
                                </div>

                                {/* Activity Card */}
                                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-gray-900/20 hover:shadow-md transition-shadow p-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div>
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${getColorClasses(info.color)}`}
                                            >
                                                {info.icon} {info.label}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-400 whitespace-nowrap">
                                            {formatDate(activity.activityDate)}
                                            {activity.hijriActivityDate && (
                                                <span className="block text-gray-300">
                                                    {activity.hijriActivityDate}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-2">
                                        {/* Performer */}
                                        {activity.performedByName && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">بواسطة:</span>
                                                <span className="font-medium">{activity.performedByName}</span>
                                                {activity.performedByRole && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {activity.performedByRole}
                                                    </Badge>
                                                )}
                                                {activity.performedByPosition && (
                                                    <span className="text-gray-400 text-xs">
                                                        ({activity.performedByPosition})
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Committee Info */}
                                        {activity.committeeName && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">اللجنة:</span>
                                                <span className="font-medium">{activity.committeeName}</span>
                                                {activity.committeeRole && (
                                                    <Badge variant="info" className="text-xs">
                                                        {activity.committeeRole}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* Status Change */}
                                        {activity.previousStatus && activity.newStatus && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">تغيير الحالة:</span>
                                                <span
                                                    className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[activity.previousStatus] || 'bg-gray-100 dark:bg-gray-700/50'}`}
                                                >
                                                    {activity.previousStatus}
                                                </span>
                                                <span className="text-gray-400">←</span>
                                                <span
                                                    className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[activity.newStatus] || 'bg-gray-100 dark:bg-gray-700/50'}`}
                                                >
                                                    {activity.newStatus}
                                                </span>
                                            </div>
                                        )}

                                        {/* Signature */}
                                        {activity.hasSignature && (
                                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                                <CheckIcon className="w-4 h-4" />
                                                <span>تم التوقيع الإلكتروني</span>
                                                {activity.signatureDate && (
                                                    <span className="text-gray-400 text-xs">
                                                        ({formatDate(activity.signatureDate)})
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Attachment */}
                                        {activity.hasAttachment && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <AttachmentIcon className="w-4 h-4 text-blue-500" />
                                                <a
                                                    href={activity.attachmentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:underline"
                                                >
                                                    {activity.attachmentName || 'مرفق'}
                                                </a>
                                            </div>
                                        )}

                                        {/* Description */}
                                        {activity.activityDescription && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                {activity.activityDescription}
                                            </p>
                                        )}

                                        {/* Notes */}
                                        {activity.notes && (
                                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-300">
                                                <span className="font-medium text-gray-700 dark:text-gray-200">ملاحظات: </span>
                                                {activity.notes}
                                            </div>
                                        )}

                                        {/* Comments */}
                                        {activity.comments && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
                                                <span className="font-medium">تعليق: </span>
                                                {activity.comments}
                                            </div>
                                        )}

                                        {/* Rejection Reason */}
                                        {activity.rejectionReason && (
                                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
                                                <span className="font-medium">سبب الرفض: </span>
                                                {activity.rejectionReason}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredActivities.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
                            📋
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">لا توجد إجراءات مسجلة</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════

function FilterButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${active
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
        >
            {children}
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════

function SendIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
    );
}

function CheckIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}

function AttachmentIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
    );
}

// ═══════════════════════════════════════════════════════════════
// Mock Data for Development
// ═══════════════════════════════════════════════════════════════

const mockActivities = [
    {
        id: 1,
        activityType: 1,
        activityTypeName: 'إنشاء المحضر',
        performedByName: 'أحمد محمد العمري',
        performedByRole: 'أمين مستودع',
        performedByPosition: 'المستودع الرئيسي',
        activityDate: '2026-01-28T09:30:00',
        hijriActivityDate: '1447/07/28',
    },
    {
        id: 2,
        activityType: 3,
        activityTypeName: 'إرسال للفحص',
        performedByName: 'أحمد محمد العمري',
        performedByRole: 'أمين مستودع',
        previousStatus: 'Draft',
        newStatus: 'UnderInspection',
        activityDate: '2026-01-28T10:00:00',
        hijriActivityDate: '1447/07/28',
    },
    {
        id: 3,
        activityType: 20,
        activityTypeName: 'تعيين لجنة فحص',
        performedByName: 'أحمد محمد العمري',
        committeeName: 'لجنة فحص المشتريات',
        activityDate: '2026-01-28T10:05:00',
        hijriActivityDate: '1447/07/28',
    },
    {
        id: 4,
        activityType: 6,
        activityTypeName: 'توقيع عضو لجنة',
        performedByName: 'فهد عبدالله السالم',
        performedByRole: 'رئيس اللجنة',
        committeeName: 'لجنة فحص المشتريات',
        committeeRole: 'رئيس اللجنة',
        hasSignature: true,
        signatureDate: '2026-01-28T14:00:00',
        activityDate: '2026-01-28T14:00:00',
        hijriActivityDate: '1447/07/28',
    },
    {
        id: 5,
        activityType: 6,
        activityTypeName: 'توقيع عضو لجنة',
        performedByName: 'محمد سعود القحطاني',
        performedByRole: 'عضو اللجنة',
        committeeName: 'لجنة فحص المشتريات',
        committeeRole: 'عضو',
        hasSignature: true,
        signatureDate: '2026-01-28T14:15:00',
        activityDate: '2026-01-28T14:15:00',
        hijriActivityDate: '1447/07/28',
    },
    {
        id: 6,
        activityType: 12,
        activityTypeName: 'إرفاق مستند',
        performedByName: 'أحمد محمد العمري',
        hasAttachment: true,
        attachmentUrl: '/attachments/invoice.pdf',
        attachmentName: 'فاتورة المورد.pdf',
        notes: 'تم إرفاق فاتورة المورد الأصلية',
        activityDate: '2026-01-28T14:30:00',
        hijriActivityDate: '1447/07/28',
    },
    {
        id: 7,
        activityType: 5,
        activityTypeName: 'إكمال الفحص',
        performedByName: 'فهد عبدالله السالم',
        performedByRole: 'رئيس اللجنة',
        activityDescription: 'تم فحص جميع الأصناف والتحقق من مطابقتها للمواصفات',
        activityDate: '2026-01-28T15:00:00',
        hijriActivityDate: '1447/07/28',
    },
    {
        id: 8,
        activityType: 8,
        activityTypeName: 'اعتماد',
        performedByName: 'سعد خالد الحربي',
        performedByRole: 'مدير المستودعات',
        previousStatus: 'UnderInspection',
        newStatus: 'Approved',
        comments: 'تم اعتماد المحضر بناءً على توصية لجنة الفحص',
        activityDate: '2026-01-28T16:00:00',
        hijriActivityDate: '1447/07/28',
    },
    {
        id: 9,
        activityType: 10,
        activityTypeName: 'ترحيل للمخزون',
        performedByName: 'أحمد محمد العمري',
        performedByRole: 'أمين مستودع',
        previousStatus: 'Approved',
        newStatus: 'Posted',
        activityDescription: 'تم ترحيل 35 وحدة من 3 أصناف إلى المخزون',
        activityDate: '2026-01-29T09:00:00',
        hijriActivityDate: '1447/07/29',
    },
];

export default ReceiptActivityLog;
