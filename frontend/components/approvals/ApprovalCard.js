/**
 * Approval Card Component
 * مكون بطاقة الموافقة
 *
 * @module components/approvals/ApprovalCard
 * @version 1.0.0
 * @date 2026-02-14
 */

import React from 'react';
import { useRouter } from 'next/router';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { fmtDate } from '../../utils/hijriDate';

import {
    ClockIcon,
    UserIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

/**
 * Status Badge Mapping
 */
const STATUS_CONFIG = {
    pending: { label: 'معلق', variant: 'warning' },
    approved: { label: 'موافق عليه', variant: 'success' },
    rejected: { label: 'مرفوض', variant: 'error' },
    recalled: { label: 'مسحوب', variant: 'secondary' },
    in_progress: { label: 'قيد المراجعة', variant: 'info' },
};

/**
 * Priority Badge Mapping
 */
const PRIORITY_CONFIG = {
    low: { label: 'عادي', variant: 'secondary' },
    normal: { label: 'متوسط', variant: 'info' },
    high: { label: 'مهم', variant: 'warning' },
    urgent: { label: 'عاجل', variant: 'error' },
};

/**
 * ApprovalCard Component
 */
export default function ApprovalCard({
    request,
    showActions = true,
    onApprove,
    onReject,
    onView,
}) {
    const router = useRouter();

    const handleView = () => {
        if (onView) {
            onView(request);
        } else {
            router.push(`/approvals/requests/${request.id}`);
        }
    };

    const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
    const priorityConfig = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.normal;

    return (
        <div
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 cursor-pointer"
            onClick={handleView}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <DocumentTextIcon className="w-5 h-5 text-primary-500" />
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {request.title}
                        </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {request.description}
                    </p>
                </div>
                <div className="flex flex-col gap-2 mr-4">
                    <Badge variant={statusConfig.variant} size="sm">
                        {statusConfig.label}
                    </Badge>
                    {request.priority !== 'normal' && (
                        <Badge variant={priorityConfig.variant} size="sm">
                            {priorityConfig.label}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <UserIcon className="w-4 h-4" />
                    <span>{request.requesterName}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <ClockIcon className="w-4 h-4" />
                    <span>{fmtDate(request.createdAt)}</span>
                </div>
            </div>

            {/* Workflow Info */}
            {request.workflowName && (
                <div className="mb-4 text-xs text-gray-500 dark:text-gray-500">
                    Workflow: {request.workflowName}
                </div>
            )}

            {/* SLA Alert */}
            {request.slaExceeded && (
                <div className="mb-4 p-2 bg-error-light dark:bg-error-dark/20 rounded-lg text-xs text-error-dark dark:text-error-light flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    <span>تجاوز SLA - يتطلب اتخاذ إجراء فوري</span>
                </div>
            )}

            {/* Actions */}
            {showActions && request.status === 'pending' && (
                <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="success"
                        size="sm"
                        icon={<CheckCircleIcon className="w-4 h-4" />}
                        onClick={() => onApprove?.(request)}
                    >
                        موافقة
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        icon={<XCircleIcon className="w-4 h-4" />}
                        onClick={() => onReject?.(request)}
                    >
                        رفض
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleView}
                        className="mr-auto"
                    >
                        التفاصيل
                    </Button>
                </div>
            )}
        </div>
    );
}
