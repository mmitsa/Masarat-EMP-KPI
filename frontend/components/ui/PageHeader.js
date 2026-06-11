import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';

/**
 * Breadcrumb Item
 */
const BreadcrumbItem = ({ href, children, isLast }) => {
    if (isLast) {
        return (
            <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                {children}
            </span>
        );
    }

    return (
        <>
            <Link
                href={href || '#'}
                className="text-primary-500 hover:text-primary-600 hover:underline transition-colors"
            >
                {children}
            </Link>
            <svg
                className="w-4 h-4 text-neutral-400 mx-2 rtl:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
        </>
    );
};

/**
 * PageHeader Component - رأس الصفحة الموحد
 *
 * يوفر عنوان الصفحة، الوصف، مسار التنقل (Breadcrumbs)، وأزرار الإجراءات
 *
 * @example
 * <PageHeader
 *   title="إدارة الموظفين"
 *   subtitle="عرض وإدارة جميع موظفي المنظمة"
 *   breadcrumbs={[
 *     { label: 'الرئيسية', href: '/' },
 *     { label: 'الموارد البشرية', href: '/hr' },
 *     { label: 'الموظفين' }
 *   ]}
 *   actions={
 *     <>
 *       <Button variant="secondary">تصدير</Button>
 *       <Button variant="primary" icon={<PlusIcon />}>إضافة موظف</Button>
 *     </>
 *   }
 * />
 */
const PageHeader = memo(function PageHeader({
    title,
    subtitle,
    breadcrumbs = [],
    actions,
    icon,
    badge,
    className = '',
    sticky = false,
    bordered = true,
    compact = false,
}) {
    return (
        <div
            className={`
                ${sticky ? 'sticky top-16 z-20' : ''}
                ${bordered ? 'border-b border-neutral-200 dark:border-neutral-700' : ''}
                bg-white dark:bg-neutral-900
                ${compact ? 'py-4' : 'py-6'}
                ${className}
            `}
        >
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <nav
                    className="flex items-center text-sm mb-3"
                    aria-label="مسار التنقل"
                >
                    {/* Home Icon */}
                    <Link
                        href="/"
                        className="text-neutral-400 hover:text-primary-500 transition-colors ml-2"
                        aria-label="الرئيسية"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </Link>
                    <svg
                        className="w-4 h-4 text-neutral-400 mx-2 rtl:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {breadcrumbs.map((item, index) => (
                        <BreadcrumbItem
                            key={index}
                            href={item.href}
                            isLast={index === breadcrumbs.length - 1}
                        >
                            {item.label}
                        </BreadcrumbItem>
                    ))}
                </nav>
            )}

            {/* Title Row */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* Title & Subtitle */}
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    {icon && (
                        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500 flex-shrink-0">
                            {icon}
                        </div>
                    )}

                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {title}
                            </h1>
                            {badge && badge}
                        </div>
                        {subtitle && (
                            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {actions && (
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
});

PageHeader.displayName = 'PageHeader';

PageHeader.propTypes = {
    /** عنوان الصفحة */
    title: PropTypes.string.isRequired,
    /** وصف الصفحة */
    subtitle: PropTypes.string,
    /** مسار التنقل */
    breadcrumbs: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string,
    })),
    /** أزرار الإجراءات */
    actions: PropTypes.node,
    /** أيقونة الصفحة */
    icon: PropTypes.node,
    /** شارة بجانب العنوان */
    badge: PropTypes.node,
    /** Classes إضافية */
    className: PropTypes.string,
    /** تثبيت في الأعلى */
    sticky: PropTypes.bool,
    /** إظهار الحد السفلي */
    bordered: PropTypes.bool,
    /** وضع مضغوط */
    compact: PropTypes.bool,
};

export default PageHeader;
