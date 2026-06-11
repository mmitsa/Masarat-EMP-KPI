import React, { memo } from 'react';
import PropTypes from 'prop-types';

const variants = {
    default: 'bg-[var(--color-gray-150)] text-[var(--color-gray-700)]',
    primary: 'bg-[var(--color-primary-100)] text-[var(--color-primary-500)]',
    secondary: 'bg-[var(--color-secondary-400)]/10 text-[var(--color-secondary-500)]',
    success: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
    danger: 'bg-[var(--color-error-light)] text-[var(--color-error)]',
    info: 'bg-[var(--color-info-light)] text-[var(--color-info)]',
};

const sizes = {
    sm: 'px-[var(--spacing-2)] py-[var(--spacing-1)] text-[var(--font-size-xs)]',
    md: 'px-[var(--spacing-3)] py-[var(--spacing-1)] text-[var(--font-size-sm)]',
    lg: 'px-[var(--spacing-4)] py-[var(--spacing-2)] text-[var(--font-size-base)]',
};

/**
 * Badge Component - شارة لعرض الحالات والتصنيفات
 * يدعم عدة ألوان وأحجام مع دعم Accessibility
 */
const Badge = memo(function Badge({
    children,
    variant = 'default',
    color,
    size = 'md',
    dot = false,
    rounded = true,
    className = '',
    'aria-label': ariaLabel,
}) {
    const finalVariant = color || variant;
    return (
        <span
            role="status"
            aria-label={ariaLabel}
            className={[
                'inline-flex items-center gap-1 font-medium whitespace-nowrap',
                variants[finalVariant] || variants.default,
                sizes[size],
                rounded ? 'rounded-full' : 'rounded-lg',
                className
            ].join(' ')}
        >
            {dot && (
                <span
                    className={`w-2 h-2 rounded-full ${variant === 'success' ? 'bg-[var(--color-success)]' : variant === 'danger' ? 'bg-[var(--color-error)]' : 'bg-current'}`}
                    aria-hidden="true"
                />
            )}
            {children}
        </span>
    );
});

Badge.displayName = 'Badge';

Badge.propTypes = {
    /** محتوى الشارة */
    children: PropTypes.node.isRequired,
    /** نمط الشارة */
    variant: PropTypes.oneOf(['default', 'primary', 'secondary', 'success', 'warning', 'danger', 'info']),
    /** Alias مستخدم في صفحات النظام */
    color: PropTypes.oneOf(['default', 'primary', 'secondary', 'success', 'warning', 'danger', 'info']),
    /** حجم الشارة */
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** إظهار نقطة مؤشر */
    dot: PropTypes.bool,
    /** حواف مستديرة بالكامل */
    rounded: PropTypes.bool,
    /** Classes إضافية */
    className: PropTypes.string,
    /** وصف للـ accessibility */
    'aria-label': PropTypes.string,
};

export default Badge;

/**
 * StatusBadge - شارة حالة مسبقة التعريف
 */
export const StatusBadge = memo(function StatusBadge({ status }) {
    const statusConfig = {
        active: { label: 'نشط', variant: 'success', dot: true },
        inactive: { label: 'غير نشط', variant: 'default', dot: true },
        pending: { label: 'قيد الانتظار', variant: 'warning', dot: true },
        approved: { label: 'معتمد', variant: 'success' },
        rejected: { label: 'مرفوض', variant: 'danger' },
        completed: { label: 'مكتمل', variant: 'success' },
        cancelled: { label: 'ملغي', variant: 'danger' },
        in_progress: { label: 'قيد التنفيذ', variant: 'info', dot: true },
    };

    const config = statusConfig[status] || { label: status, variant: 'default' };

    return (
        <Badge
            variant={config.variant}
            dot={config.dot}
            aria-label={`الحالة: ${config.label}`}
        >
            {config.label}
        </Badge>
    );
});

StatusBadge.displayName = 'StatusBadge';

StatusBadge.propTypes = {
    /** حالة العنصر */
    status: PropTypes.oneOf([
        'active', 'inactive', 'pending', 'approved',
        'rejected', 'completed', 'cancelled', 'in_progress'
    ]),
};
