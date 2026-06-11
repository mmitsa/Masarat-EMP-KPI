import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';

/**
 * حالات النظام
 */
const statusStyles = {
    active: {
        dot: 'bg-success-500',
        bg: 'bg-success-50 dark:bg-success-900/20',
        text: 'text-success-600 dark:text-success-400',
        label: 'نشط',
    },
    inactive: {
        dot: 'bg-neutral-400',
        bg: 'bg-neutral-100 dark:bg-neutral-800',
        text: 'text-neutral-500 dark:text-neutral-400',
        label: 'غير نشط',
    },
    maintenance: {
        dot: 'bg-warning-500',
        bg: 'bg-warning-50 dark:bg-warning-900/20',
        text: 'text-warning-600 dark:text-warning-400',
        label: 'صيانة',
    },
    error: {
        dot: 'bg-error-500',
        bg: 'bg-error-50 dark:bg-error-900/20',
        text: 'text-error-600 dark:text-error-400',
        label: 'خطأ',
    },
    loading: {
        dot: 'bg-info-500 animate-pulse',
        bg: 'bg-info-50 dark:bg-info-900/20',
        text: 'text-info-600 dark:text-info-400',
        label: 'جاري التحميل...',
    },
};

/**
 * SystemStatusItem - عنصر حالة نظام
 */
const SystemStatusItem = memo(function SystemStatusItem({
    name,
    status = 'active',
    href,
    icon,
    stats,
    darkMode = false,
}) {
    const statusConfig = statusStyles[status] || statusStyles.inactive;

    const content = (
        <div
            className={`
                flex items-center justify-between p-4 rounded-xl
                border transition-all duration-200
                ${href ? 'cursor-pointer hover:shadow-md' : ''}
                ${darkMode
                    ? 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'
                    : 'bg-white dark:bg-gray-900 border-neutral-200 hover:border-primary-200'
                }
            `}
        >
            <div className="flex items-center gap-3">
                {/* Icon */}
                {icon && (
                    <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${darkMode ? 'bg-neutral-700' : 'bg-neutral-100'}
                    `}>
                        <span className={`w-5 h-5 ${darkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
                            {icon}
                        </span>
                    </div>
                )}

                {/* Name & Stats */}
                <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                        {name}
                    </p>
                    {stats && (
                        <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            {stats}
                        </p>
                    )}
                </div>
            </div>

            {/* Status Badge */}
            <div className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                ${statusConfig.bg} ${statusConfig.text}
            `}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
            </div>
        </div>
    );

    // Only render Link if href is a valid non-empty string
    if (href && typeof href === 'string' && href.trim() !== '') {
        return <Link href={href}>{content}</Link>;
    }

    return content;
});

/**
 * SystemStatusCard Component - بطاقة حالة الأنظمة
 *
 * تعرض حالة جميع أنظمة المنصة
 *
 * @example
 * <SystemStatusCard
 *   systems={[
 *     { name: 'الموارد البشرية', status: 'active', href: '/hr', icon: <UsersIcon />, stats: '245 موظف' },
 *     { name: 'المستودعات', status: 'active', href: '/warehouse', icon: <BoxIcon />, stats: '1,250 صنف' },
 *   ]}
 * />
 */
const SystemStatusCard = memo(function SystemStatusCard({
    systems = [],
    title = 'حالة الأنظمة',
    darkMode = false,
    className = '',
    columns = 2,
}) {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    };

    return (
        <div
            className={`
                rounded-xl border p-6
                ${darkMode
                    ? 'bg-neutral-900 border-neutral-800'
                    : 'bg-white dark:bg-gray-900 border-neutral-200'
                }
                ${className}
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <svg
                        className={`w-5 h-5 ${darkMode ? 'text-primary-400' : 'text-primary-500'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                        {title}
                    </h3>
                </div>

                {/* Overall Status */}
                <div className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                    ${systems.every(s => s.status === 'active')
                        ? 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400'
                        : 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400'
                    }
                `}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                        systems.every(s => s.status === 'active') ? 'bg-success-500' : 'bg-warning-500'
                    }`} />
                    {systems.filter(s => s.status === 'active').length}/{systems.length} نشط
                </div>
            </div>

            {/* Systems Grid */}
            <div className={`grid ${gridCols[columns]} gap-4`}>
                {systems.map((system, index) => (
                    <SystemStatusItem
                        key={index}
                        name={system.name}
                        status={system.status}
                        href={system.href}
                        icon={system.icon}
                        stats={system.stats}
                        darkMode={darkMode}
                    />
                ))}
            </div>
        </div>
    );
});

SystemStatusCard.displayName = 'SystemStatusCard';

SystemStatusCard.propTypes = {
    /** قائمة الأنظمة */
    systems: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        status: PropTypes.oneOf(['active', 'inactive', 'maintenance', 'error', 'loading']),
        href: PropTypes.string,
        icon: PropTypes.node,
        stats: PropTypes.string,
    })),
    /** عنوان البطاقة */
    title: PropTypes.string,
    /** الوضع المظلم */
    darkMode: PropTypes.bool,
    /** Classes إضافية */
    className: PropTypes.string,
    /** عدد الأعمدة */
    columns: PropTypes.oneOf([1, 2, 3]),
};

export default SystemStatusCard;
