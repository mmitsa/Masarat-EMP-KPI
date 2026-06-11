import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * تعريف حالات النظام
 * System Status Definitions
 */
const statusConfig = {
    // حالات عامة
    active: {
        label: 'نشط',
        labelEn: 'Active',
        color: 'success',
        icon: '●',
    },
    inactive: {
        label: 'غير نشط',
        labelEn: 'Inactive',
        color: 'neutral',
        icon: '○',
    },
    pending: {
        label: 'معلق',
        labelEn: 'Pending',
        color: 'warning',
        icon: '◐',
    },
    approved: {
        label: 'معتمد',
        labelEn: 'Approved',
        color: 'success',
        icon: '✓',
    },
    rejected: {
        label: 'مرفوض',
        labelEn: 'Rejected',
        color: 'error',
        icon: '✕',
    },
    cancelled: {
        label: 'ملغي',
        labelEn: 'Cancelled',
        color: 'neutral',
        icon: '⊘',
    },

    // حالات الموظفين
    on_leave: {
        label: 'في إجازة',
        labelEn: 'On Leave',
        color: 'info',
        icon: '🏖',
    },
    terminated: {
        label: 'منتهي الخدمة',
        labelEn: 'Terminated',
        color: 'neutral',
        icon: '⊗',
    },
    suspended: {
        label: 'موقوف',
        labelEn: 'Suspended',
        color: 'error',
        icon: '⊘',
    },
    probation: {
        label: 'تحت التجربة',
        labelEn: 'Probation',
        color: 'warning',
        icon: '◔',
    },

    // حالات المهام
    todo: {
        label: 'للتنفيذ',
        labelEn: 'To Do',
        color: 'neutral',
        icon: '○',
    },
    in_progress: {
        label: 'قيد التنفيذ',
        labelEn: 'In Progress',
        color: 'info',
        icon: '◐',
    },
    completed: {
        label: 'مكتمل',
        labelEn: 'Completed',
        color: 'success',
        icon: '●',
    },
    overdue: {
        label: 'متأخر',
        labelEn: 'Overdue',
        color: 'error',
        icon: '!',
    },

    // حالات المستودعات
    in_stock: {
        label: 'متوفر',
        labelEn: 'In Stock',
        color: 'success',
        icon: '●',
    },
    low_stock: {
        label: 'مخزون منخفض',
        labelEn: 'Low Stock',
        color: 'warning',
        icon: '▼',
    },
    out_of_stock: {
        label: 'نفذ المخزون',
        labelEn: 'Out of Stock',
        color: 'error',
        icon: '✕',
    },

    // حالات المركبات
    available: {
        label: 'متاح',
        labelEn: 'Available',
        color: 'success',
        icon: '●',
    },
    in_use: {
        label: 'قيد الاستخدام',
        labelEn: 'In Use',
        color: 'info',
        icon: '◐',
    },
    maintenance: {
        label: 'في الصيانة',
        labelEn: 'Maintenance',
        color: 'warning',
        icon: '⚙',
    },

    // حالات المالية
    paid: {
        label: 'مدفوع',
        labelEn: 'Paid',
        color: 'success',
        icon: '✓',
    },
    unpaid: {
        label: 'غير مدفوع',
        labelEn: 'Unpaid',
        color: 'error',
        icon: '✕',
    },
    partial: {
        label: 'مدفوع جزئياً',
        labelEn: 'Partial',
        color: 'warning',
        icon: '◐',
    },

    // حالات الوثائق
    draft: {
        label: 'مسودة',
        labelEn: 'Draft',
        color: 'neutral',
        icon: '○',
    },
    review: {
        label: 'قيد المراجعة',
        labelEn: 'Under Review',
        color: 'info',
        icon: '◐',
    },
    published: {
        label: 'منشور',
        labelEn: 'Published',
        color: 'success',
        icon: '●',
    },
    archived: {
        label: 'مؤرشف',
        labelEn: 'Archived',
        color: 'neutral',
        icon: '📁',
    },

    // حالات الأولوية
    urgent: {
        label: 'عاجل',
        labelEn: 'Urgent',
        color: 'error',
        icon: '!!',
    },
    high: {
        label: 'مرتفع',
        labelEn: 'High',
        color: 'warning',
        icon: '↑',
    },
    normal: {
        label: 'عادي',
        labelEn: 'Normal',
        color: 'info',
        icon: '—',
    },
    low: {
        label: 'منخفض',
        labelEn: 'Low',
        color: 'neutral',
        icon: '↓',
    },
};

/**
 * أنماط الألوان
 */
const colorStyles = {
    success: {
        bg: 'bg-success-50 dark:bg-success-900/20',
        text: 'text-success-600 dark:text-success-400',
        border: 'border-success-200 dark:border-success-800',
        dot: 'bg-success-500',
    },
    warning: {
        bg: 'bg-warning-50 dark:bg-warning-900/20',
        text: 'text-warning-600 dark:text-warning-400',
        border: 'border-warning-200 dark:border-warning-800',
        dot: 'bg-warning-500',
    },
    error: {
        bg: 'bg-error-50 dark:bg-error-900/20',
        text: 'text-error-600 dark:text-error-400',
        border: 'border-error-200 dark:border-error-800',
        dot: 'bg-error-500',
    },
    info: {
        bg: 'bg-info-50 dark:bg-info-900/20',
        text: 'text-info-600 dark:text-info-400',
        border: 'border-info-200 dark:border-info-800',
        dot: 'bg-info-500',
    },
    neutral: {
        bg: 'bg-neutral-100 dark:bg-neutral-800',
        text: 'text-neutral-600 dark:text-neutral-400',
        border: 'border-neutral-200 dark:border-neutral-700',
        dot: 'bg-neutral-400',
    },
    primary: {
        bg: 'bg-primary-50 dark:bg-primary-900/20',
        text: 'text-primary-600 dark:text-primary-400',
        border: 'border-primary-200 dark:border-primary-800',
        dot: 'bg-primary-500',
    },
    gold: {
        bg: 'bg-gold-50 dark:bg-gold-900/20',
        text: 'text-gold-600 dark:text-gold-400',
        border: 'border-gold-200 dark:border-gold-800',
        dot: 'bg-gold-500',
    },
};

/**
 * أحجام الشارات
 */
const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
};

/**
 * StatusBadge Component - شارة الحالة
 *
 * تعرض حالة العنصر بشكل مرئي مع لون ونص مناسب
 *
 * @example
 * // باستخدام حالة معرفة مسبقاً
 * <StatusBadge status="active" />
 * <StatusBadge status="pending" />
 * <StatusBadge status="rejected" />
 *
 * // باستخدام لون ونص مخصص
 * <StatusBadge color="success" label="تم بنجاح" />
 */
const StatusBadge = memo(function StatusBadge({
    status,
    color,
    label,
    size = 'md',
    variant = 'filled',
    showDot = true,
    showIcon = false,
    pulse = false,
    className = '',
}) {
    // الحصول على إعدادات الحالة
    const config = status ? statusConfig[status] : null;
    const displayColor = color || config?.color || 'neutral';
    const displayLabel = label || config?.label || status || 'غير محدد';
    const displayIcon = config?.icon;

    const colors = colorStyles[displayColor] || colorStyles.neutral;

    // أنماط الشارة حسب النوع
    const variantStyles = {
        filled: `${colors.bg} ${colors.text}`,
        outlined: `bg-transparent border ${colors.border} ${colors.text}`,
        ghost: `bg-transparent ${colors.text}`,
    };

    return (
        <span
            className={`
                inline-flex items-center justify-center
                font-medium rounded-full
                whitespace-nowrap
                ${sizeStyles[size]}
                ${variantStyles[variant]}
                ${className}
            `}
        >
            {/* Dot Indicator */}
            {showDot && (
                <span
                    className={`
                        w-1.5 h-1.5 rounded-full flex-shrink-0
                        ${colors.dot}
                        ${pulse ? 'animate-pulse' : ''}
                    `}
                />
            )}

            {/* Icon */}
            {showIcon && displayIcon && (
                <span className="flex-shrink-0">{displayIcon}</span>
            )}

            {/* Label */}
            <span>{displayLabel}</span>
        </span>
    );
});

StatusBadge.displayName = 'StatusBadge';

StatusBadge.propTypes = {
    /** معرف الحالة المعرفة مسبقاً */
    status: PropTypes.oneOf(Object.keys(statusConfig)),
    /** لون مخصص */
    color: PropTypes.oneOf(Object.keys(colorStyles)),
    /** نص مخصص */
    label: PropTypes.string,
    /** حجم الشارة */
    size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
    /** نمط الشارة */
    variant: PropTypes.oneOf(['filled', 'outlined', 'ghost']),
    /** إظهار النقطة */
    showDot: PropTypes.bool,
    /** إظهار الأيقونة */
    showIcon: PropTypes.bool,
    /** تأثير النبض */
    pulse: PropTypes.bool,
    /** Classes إضافية */
    className: PropTypes.string,
};

/**
 * StatusDot - نقطة الحالة فقط
 */
export const StatusDot = memo(function StatusDot({
    status,
    color,
    size = 'md',
    pulse = false,
    className = '',
}) {
    const config = status ? statusConfig[status] : null;
    const displayColor = color || config?.color || 'neutral';
    const colors = colorStyles[displayColor] || colorStyles.neutral;

    const dotSizes = {
        xs: 'w-1.5 h-1.5',
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
    };

    return (
        <span
            className={`
                inline-block rounded-full
                ${dotSizes[size]}
                ${colors.dot}
                ${pulse ? 'animate-pulse' : ''}
                ${className}
            `}
            title={config?.label}
        />
    );
});

StatusDot.displayName = 'StatusDot';

// تصدير قائمة الحالات للاستخدام الخارجي
export const STATUS_LIST = statusConfig;
export const STATUS_COLORS = colorStyles;

export default StatusBadge;
