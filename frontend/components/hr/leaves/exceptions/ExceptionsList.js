/**
 * قائمة استثناءات الموافقات
 * Exceptions List Component
 */

import React, { useState } from 'react';
import {
    ShieldExclamationIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { Button, Badge, EmptyState, DataTable } from '../../../ui';
import { getLeaveTypeName, APPROVAL_LEVELS } from '../../../../constants/leave-types';
import { formatDateArabic } from '../../../../utils/hr-helpers';

const ExceptionsList = ({
    exceptions = [],
    onEdit,
    onDelete,
    onToggleStatus,
    loading = false,
}) => {
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">جاري تحميل الاستثناءات...</p>
            </div>
        );
    }

    if (exceptions.length === 0) {
        return (
            <EmptyState
                icon={<ShieldExclamationIcon className="w-16 h-16" />}
                title="لا توجد استثناءات"
                description="لم يتم إضافة أي استثناءات لموافقات الإجازات"
            />
        );
    }

    const handleDelete = (exception) => {
        onDelete?.(exception);
        setDeleteConfirmId(null);
    };

    // التحقق من صلاحية الاستثناء
    const isValid = (exception) => {
        const now = new Date();
        const from = new Date(exception.validFrom);
        const to = new Date(exception.validTo);
        return exception.isActive && now >= from && now <= to;
    };

    // الحصول على حالة الاستثناء
    const getStatus = (exception) => {
        const now = new Date();
        const from = new Date(exception.validFrom);
        const to = new Date(exception.validTo);

        if (!exception.isActive) {
            return { label: 'غير فعّال', variant: 'gray', icon: XCircleIcon };
        }
        if (now < from) {
            return { label: 'قادم', variant: 'info', icon: ClockIcon };
        }
        if (now > to) {
            return { label: 'منتهي', variant: 'warning', icon: ClockIcon };
        }
        return { label: 'فعّال', variant: 'success', icon: CheckCircleIcon };
    };

    // أعمدة الجدول
    const columns = [
        {
            key: 'employee',
            label: 'الموظف',
            render: (_, exception) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                        {exception.employee?.fullName || exception.employee?.nameAr || '-'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {exception.employee?.employeeNumber}
                    </div>
                </div>
            ),
        },
        {
            key: 'leaveType',
            label: 'نوع الإجازة',
            render: (value) => (
                <Badge variant="primary" size="sm">
                    {getLeaveTypeName(value)}
                </Badge>
            ),
        },
        {
            key: 'exemptLevel',
            label: 'المستوى المستثنى',
            render: (value) => (
                <span className="text-gray-700 dark:text-gray-200">
                    {APPROVAL_LEVELS[value]?.name || value}
                </span>
            ),
        },
        {
            key: 'validity',
            label: 'فترة الصلاحية',
            render: (_, exception) => (
                <div className="text-sm">
                    <div>من: {formatDateArabic(exception.validFrom)}</div>
                    <div>إلى: {formatDateArabic(exception.validTo)}</div>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'الحالة',
            render: (_, exception) => {
                const status = getStatus(exception);
                const StatusIcon = status.icon;
                return (
                    <Badge variant={status.variant} size="sm">
                        <StatusIcon className="w-3 h-3 ml-1" />
                        {status.label}
                    </Badge>
                );
            },
        },
        {
            key: 'actions',
            label: 'الإجراءات',
            render: (_, exception) => (
                <div className="flex items-center gap-2">
                    {/* تبديل الحالة */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleStatus?.(exception)}
                        title={exception.isActive ? 'إلغاء التفعيل' : 'تفعيل'}
                    >
                        {exception.isActive ? (
                            <XCircleIcon className="w-4 h-4 text-red-500" />
                        ) : (
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        )}
                    </Button>

                    {/* تعديل */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(exception)}
                        icon={<PencilIcon className="w-4 h-4" />}
                    />

                    {/* حذف */}
                    {deleteConfirmId === exception.id ? (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(exception)}
                            >
                                تأكيد
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirmId(null)}
                            >
                                إلغاء
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(exception.id)}
                            icon={<TrashIcon className="w-4 h-4 text-red-500" />}
                        />
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            {/* الجدول */}
            <DataTable
                columns={columns}
                data={exceptions}
                emptyMessage="لا توجد استثناءات"
            />

            {/* ملاحظات */}
            <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <strong>ملاحظات:</strong>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>الاستثناء الفعّال يتجاوز المستوى المحدد في سير الموافقات</li>
                    <li>الاستثناءات المنتهية لا تؤثر على طلبات الإجازة الجديدة</li>
                    <li>يجب توثيق سبب منح الاستثناء لأغراض التدقيق</li>
                </ul>
            </div>
        </div>
    );
};

export default ExceptionsList;
