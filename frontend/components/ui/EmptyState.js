import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * EmptyState Component - حالة فارغة
 * يُستخدم عند عدم وجود بيانات للعرض
 */
const EmptyState = memo(function EmptyState({
    icon,
    title,
    description,
    action,
    className = '',
}) {
    const defaultIcon = (
        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
    );

    const displayTitle = title || 'لا توجد بيانات';

    return (
        <div
            className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}
            role="status"
            aria-label={displayTitle}
        >
            <div className="mb-4" aria-hidden="true">
                {icon || defaultIcon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {displayTitle}
            </h3>
            {description && (
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
                    {description}
                </p>
            )}
            {action && (
                <div>{action}</div>
            )}
        </div>
    );
});

EmptyState.displayName = 'EmptyState';

EmptyState.propTypes = {
    /** أيقونة مخصصة */
    icon: PropTypes.node,
    /** عنوان الحالة الفارغة */
    title: PropTypes.string,
    /** وصف تفصيلي */
    description: PropTypes.string,
    /** زر أو إجراء */
    action: PropTypes.node,
    /** Classes إضافية */
    className: PropTypes.string,
};

export default EmptyState;
