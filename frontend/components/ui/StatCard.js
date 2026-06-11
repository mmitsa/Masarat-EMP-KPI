import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';

/**
 * أنماط الألوان الحكومية
 */
const colorStyles = {
    primary: {
        bg: 'bg-primary-50 dark:bg-primary-900/20',
        icon: 'text-primary-500',
        ring: 'ring-primary-500/20',
    },
    success: {
        bg: 'bg-success-50 dark:bg-success-900/20',
        icon: 'text-success-500',
        ring: 'ring-success-500/20',
    },
    warning: {
        bg: 'bg-warning-50 dark:bg-warning-900/20',
        icon: 'text-warning-500',
        ring: 'ring-warning-500/20',
    },
    error: {
        bg: 'bg-error-50 dark:bg-error-900/20',
        icon: 'text-error-500',
        ring: 'ring-error-500/20',
    },
    info: {
        bg: 'bg-info-50 dark:bg-info-900/20',
        icon: 'text-info-500',
        ring: 'ring-info-500/20',
    },
    gold: {
        bg: 'bg-gold-50 dark:bg-gold-900/20',
        icon: 'text-gold-500',
        ring: 'ring-gold-500/20',
    },
    neutral: {
        bg: 'bg-neutral-100 dark:bg-neutral-800',
        icon: 'text-neutral-500',
        ring: 'ring-neutral-500/20',
    },
    blue: {
        bg: 'bg-primary-50 dark:bg-primary-900/20',
        icon: 'text-primary-500',
        ring: 'ring-primary-500/20',
    },
    green: {
        bg: 'bg-success-50 dark:bg-success-900/20',
        icon: 'text-success-500',
        ring: 'ring-success-500/20',
    },
    yellow: {
        bg: 'bg-warning-50 dark:bg-warning-900/20',
        icon: 'text-warning-500',
        ring: 'ring-warning-500/20',
    },
    orange: {
        bg: 'bg-warning-50 dark:bg-warning-900/20',
        icon: 'text-warning-500',
        ring: 'ring-warning-500/20',
    },
    red: {
        bg: 'bg-error-50 dark:bg-error-900/20',
        icon: 'text-error-500',
        ring: 'ring-error-500/20',
    },
    purple: {
        bg: 'bg-secondary-50 dark:bg-secondary-900/20',
        icon: 'text-secondary-500',
        ring: 'ring-secondary-500/20',
    },
};

/**
 * ألوان الاتجاه
 */
const trendColors = {
    up: 'bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-400',
    down: 'bg-error-50 text-error-600 dark:bg-error-900/30 dark:text-error-400',
    neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

/**
 * أيقونة الاتجاه
 */
const TrendIcon = ({ trend }) => {
    if (trend === 'up') {
        return (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
        );
    }
    if (trend === 'down') {
        return (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
        );
    }
    return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14" />
        </svg>
    );
};

/**
 * StatCard Component - بطاقة الإحصائيات الحكومية
 *
 * تعرض إحصائية رقمية مع عنوان وأيقونة واتجاه التغيير
 * مصممة بالأسلوب الحكومي الرسمي
 *
 * @example
 * <StatCard
 *   title="إجمالي الموظفين"
 *   value="1,234"
 *   change="+12%"
 *   trend="up"
 *   icon={<UsersIcon className="w-6 h-6" />}
 *   color="primary"
 * />
 */
const StatCard = memo(function StatCard({
    title,
    value,
    subtitle,
    change,
    trend = 'neutral',
    icon,
    color = 'primary',
    iconBg,
    iconColor,
    link,
    onClick,
    loading = false,
    darkMode = false, // للتوافق مع الكود القديم
    className = '',
    compact = false,
    'aria-label': ariaLabel,
}) {
    // استخدام الألوان الجديدة أو القديمة للتوافق
    const colors = colorStyles[color] || colorStyles.neutral;
    const finalIconBg = iconBg || colors.bg;
    const finalIconColor = iconColor || colors.icon;

    const isClickable = !!(link || onClick);

    // حالة التحميل
    if (loading) {
        return (
            <div className={`
                bg-white dark:bg-neutral-900
                rounded-xl border border-neutral-200 dark:border-neutral-700
                ${compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5 lg:p-6'}
                shadow-sm
                ${className}
            `}>
                <div className="animate-pulse">
                    <div className="flex items-start justify-between mb-2 sm:mb-3 lg:mb-4">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 bg-neutral-200 dark:bg-neutral-700 rounded-lg sm:rounded-xl" />
                        <div className="h-5 sm:h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full w-12 sm:w-16" />
                    </div>
                    <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-16 sm:w-20 mb-1 sm:mb-2" />
                    <div className="h-6 sm:h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-20 sm:w-24" />
                </div>
            </div>
        );
    }

    const content = (
        <div
            className={`
                bg-white dark:bg-neutral-900
                rounded-xl border border-neutral-200 dark:border-neutral-700
                ${compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5 lg:p-6'}
                transition-all duration-200
                shadow-sm
                ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800' : ''}
                ${className}
            `}
            role="region"
            aria-label={ariaLabel || `إحصائية ${title}: ${value}`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-2 sm:mb-3 lg:mb-4">
                {/* Icon */}
                {icon && (
                    <div
                        className={`
                            ${compact ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11'}
                            rounded-lg sm:rounded-xl flex items-center justify-center
                            ${finalIconBg}
                        `}
                        aria-hidden="true"
                    >
                        {typeof icon === 'string' ? (
                            <span className="text-lg sm:text-xl lg:text-2xl">{icon}</span>
                        ) : (
                            <span className={`${compact ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 lg:w-6 lg:h-6'} ${finalIconColor}`}>
                                {icon}
                            </span>
                        )}
                    </div>
                )}

                {/* Change Badge */}
                {change && (
                    <div
                        className={`
                            inline-flex items-center gap-0.5 sm:gap-1
                            px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full
                            text-[10px] sm:text-xs font-semibold
                            ${trendColors[trend]}
                        `}
                        aria-label={`${trend === 'up' ? 'ارتفاع' : trend === 'down' ? 'انخفاض' : 'مستقر'}: ${change}`}
                    >
                        <TrendIcon trend={trend} />
                        <span>{change}</span>
                    </div>
                )}
            </div>

            {/* Title */}
            <p className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-0.5 sm:mb-1 truncate">
                {title}
            </p>

            {/* Value */}
            <p className={`${compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-2xl lg:text-3xl'} font-bold text-neutral-900 dark:text-white`}>
                {value}
            </p>

            {/* Subtitle */}
            {subtitle && (
                <p className="text-[10px] sm:text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 sm:mt-1 truncate">
                    {subtitle}
                </p>
            )}
        </div>
    );

    // Only render Link if link is a valid non-empty string
    if (link && typeof link === 'string' && link.trim() !== '') {
        return (
            <Link href={link} aria-label={ariaLabel || `عرض ${title}`}>
                {content}
            </Link>
        );
    }

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className="text-right w-full"
                aria-label={ariaLabel || `عرض ${title}`}
            >
                {content}
            </button>
        );
    }

    return content;
});

StatCard.displayName = 'StatCard';

StatCard.propTypes = {
    /** عنوان البطاقة */
    title: PropTypes.string.isRequired,
    /** القيمة الإحصائية */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    /** نص فرعي */
    subtitle: PropTypes.string,
    /** نسبة التغيير */
    change: PropTypes.string,
    /** اتجاه التغيير */
    trend: PropTypes.oneOf(['up', 'down', 'neutral']),
    /** أيقونة البطاقة */
    icon: PropTypes.node,
    /** اللون */
    color: PropTypes.oneOf(Object.keys(colorStyles)),
    /** خلفية الأيقونة (للتوافق) */
    iconBg: PropTypes.string,
    /** لون الأيقونة (للتوافق) */
    iconColor: PropTypes.string,
    /** رابط البطاقة */
    link: PropTypes.string,
    /** دالة النقر */
    onClick: PropTypes.func,
    /** حالة التحميل */
    loading: PropTypes.bool,
    /** الوضع الداكن (للتوافق) */
    darkMode: PropTypes.bool,
    /** Classes إضافية */
    className: PropTypes.string,
    /** وضع مضغوط */
    compact: PropTypes.bool,
    /** وصف للـ accessibility */
    'aria-label': PropTypes.string,
};

/**
 * StatCardGrid - شبكة بطاقات الإحصائيات
 */
export const StatCardGrid = memo(function StatCardGrid({
    children,
    columns = 4,
    gap = 6,
    className = '',
}) {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
        6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    };

    const gapClasses = {
        2: 'gap-2',
        3: 'gap-3',
        4: 'gap-4',
        5: 'gap-5',
        6: 'gap-6',
        8: 'gap-8',
    };

    return (
        <div className={`grid ${gridCols[columns]} ${gapClasses[gap]} ${className}`}>
            {children}
        </div>
    );
});

StatCardGrid.displayName = 'StatCardGrid';

StatCardGrid.propTypes = {
    children: PropTypes.node.isRequired,
    columns: PropTypes.oneOf([1, 2, 3, 4, 5, 6]),
    gap: PropTypes.oneOf([2, 3, 4, 5, 6, 8]),
    className: PropTypes.string,
};

/**
 * MiniStatCard - بطاقة إحصائية مصغرة
 */
export const MiniStatCard = memo(function MiniStatCard({
    label,
    value,
    color = 'neutral',
    icon,
    className = '',
}) {
    const colors = colorStyles[color] || colorStyles.neutral;

    return (
        <div className={`
            flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3
            bg-white dark:bg-neutral-900
            rounded-lg border border-neutral-200 dark:border-neutral-700
            ${className}
        `}>
            {icon && (
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                    <span className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.icon}`}>{icon}</span>
                </div>
            )}
            <div className="min-w-0">
                <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white truncate">
                    {value}
                </div>
                <div className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {label}
                </div>
            </div>
        </div>
    );
});

MiniStatCard.displayName = 'MiniStatCard';

MiniStatCard.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    color: PropTypes.oneOf(Object.keys(colorStyles)),
    icon: PropTypes.node,
    className: PropTypes.string,
};

export default StatCard;
