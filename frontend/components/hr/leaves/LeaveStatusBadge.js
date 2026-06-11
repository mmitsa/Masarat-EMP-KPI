/**
 * مكون شارة حالة الإجازة
 * Leave Status Badge Component
 */

import React from 'react';
import { Badge } from '../../ui';
import { LEAVE_STATUS, getLeaveStatus } from '../../../constants/leave-types';

export default function LeaveStatusBadge({ status, size = 'md', showIcon = false }) {
    const statusInfo = getLeaveStatus(status);

    // تحويل الألوان إلى variants المتاحة في Badge
    const variantMap = {
        amber: 'warning',
        yellow: 'warning',
        emerald: 'success',
        green: 'success',
        red: 'danger',
        gray: 'default',
        blue: 'info',
        indigo: 'info',
        purple: 'info',
        teal: 'success',
    };

    const variant = variantMap[statusInfo.color] || 'default';

    // أيقونات الحالات
    const icons = {
        pending: (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        approved: (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        rejected: (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        cancelled: (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
        ),
    };

    // أيقونة بناءً على الحالة الأساسية
    let icon = null;
    if (showIcon) {
        if (status === 'pending' || status?.includes('approved') && status !== 'approved') {
            icon = icons.pending;
        } else if (status === 'approved' || status === 'hr_approved' || status === 'final_approved') {
            icon = icons.approved;
        } else if (status === 'rejected') {
            icon = icons.rejected;
        } else if (status === 'cancelled') {
            icon = icons.cancelled;
        }
    }

    return (
        <Badge variant={variant} size={size}>
            {showIcon && icon && <span className="ml-1">{icon}</span>}
            {statusInfo.name}
        </Badge>
    );
}

// مكونات شارات جاهزة
export function PendingBadge(props) {
    return <LeaveStatusBadge status="pending" {...props} />;
}

export function ApprovedBadge(props) {
    return <LeaveStatusBadge status="approved" {...props} />;
}

export function RejectedBadge(props) {
    return <LeaveStatusBadge status="rejected" {...props} />;
}
