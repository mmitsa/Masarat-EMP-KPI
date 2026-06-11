import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';

/**
 * QuickActionButton - زر إجراء سريع
 */
const QuickActionButton = memo(function QuickActionButton({
    href,
    onClick,
    icon,
    label,
    color = 'primary',
    darkMode = false,
}) {
    const colorStyles = {
        primary: {
            bg: 'bg-primary-50 dark:bg-primary-900/20',
            hover: 'hover:bg-primary-100 dark:hover:bg-primary-900/30',
            icon: 'text-primary-500',
            border: 'border-primary-200 dark:border-primary-800',
        },
        success: {
            bg: 'bg-success-50 dark:bg-success-900/20',
            hover: 'hover:bg-success-100 dark:hover:bg-success-900/30',
            icon: 'text-success-500',
            border: 'border-success-200 dark:border-success-800',
        },
        warning: {
            bg: 'bg-warning-50 dark:bg-warning-900/20',
            hover: 'hover:bg-warning-100 dark:hover:bg-warning-900/30',
            icon: 'text-warning-500',
            border: 'border-warning-200 dark:border-warning-800',
        },
        info: {
            bg: 'bg-info-50 dark:bg-info-900/20',
            hover: 'hover:bg-info-100 dark:hover:bg-info-900/30',
            icon: 'text-info-500',
            border: 'border-info-200 dark:border-info-800',
        },
        gold: {
            bg: 'bg-gold-50 dark:bg-gold-900/20',
            hover: 'hover:bg-gold-100 dark:hover:bg-gold-900/30',
            icon: 'text-gold-500',
            border: 'border-gold-200 dark:border-gold-800',
        },
    };

    const colors = colorStyles[color] || colorStyles.primary;

    const content = (
        <div
            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl
                border transition-all duration-200
                cursor-pointer
                ${colors.bg} ${colors.hover} ${colors.border}
            `}
        >
            <span className={`w-5 h-5 ${colors.icon}`}>{icon}</span>
            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-neutral-700'}`}>
                {label}
            </span>
        </div>
    );

    // Only render Link if href is a valid non-empty string
    if (href && typeof href === 'string' && href.trim() !== '') {
        return <Link href={href}>{content}</Link>;
    }

    return (
        <button type="button" onClick={onClick}>
            {content}
        </button>
    );
});

/**
 * QuickActionsBar Component - شريط الإجراءات السريعة
 *
 * يعرض مجموعة من الإجراءات السريعة للمستخدم
 *
 * @example
 * <QuickActionsBar
 *   actions={[
 *     { label: 'موظف جديد', href: '/hr/employees/new', icon: <PlusIcon />, color: 'primary' },
 *     { label: 'طلب إجازة', href: '/hr/leaves/new', icon: <CalendarIcon />, color: 'info' },
 *   ]}
 * />
 */
const QuickActionsBar = memo(function QuickActionsBar({
    actions = [],
    title = 'إجراءات سريعة',
    showTitle = true,
    darkMode = false,
    className = '',
}) {
    if (!actions.length) return null;

    return (
        <div className={`${className}`}>
            {showTitle && (
                <div className="flex items-center gap-2 mb-4">
                    <svg
                        className={`w-5 h-5 ${darkMode ? 'text-gold-400' : 'text-gold-500'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className={`text-sm font-semibold ${darkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
                        {title}
                    </h3>
                </div>
            )}
            <div className="flex flex-wrap gap-3">
                {actions.map((action, index) => (
                    <QuickActionButton
                        key={index}
                        href={action.href}
                        onClick={action.onClick}
                        icon={action.icon}
                        label={action.label}
                        color={action.color}
                        darkMode={darkMode}
                    />
                ))}
            </div>
        </div>
    );
});

QuickActionsBar.displayName = 'QuickActionsBar';

QuickActionsBar.propTypes = {
    /** قائمة الإجراءات */
    actions: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string,
        onClick: PropTypes.func,
        icon: PropTypes.node,
        color: PropTypes.oneOf(['primary', 'success', 'warning', 'info', 'gold']),
    })),
    /** عنوان القسم */
    title: PropTypes.string,
    /** إظهار العنوان */
    showTitle: PropTypes.bool,
    /** الوضع المظلم */
    darkMode: PropTypes.bool,
    /** Classes إضافية */
    className: PropTypes.string,
};

export default QuickActionsBar;
