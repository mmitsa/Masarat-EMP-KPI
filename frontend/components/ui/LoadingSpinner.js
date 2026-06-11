import React, { memo } from 'react';
import PropTypes from 'prop-types';

const sizes = {
    xs: 'w-4 h-4 border-2',
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
};

const colors = {
    primary: 'border-[var(--color-primary-500)]',
    secondary: 'border-[var(--color-secondary-500)]',
    white: 'border-[var(--text-inverse)]',
    gray: 'border-[var(--color-gray-600)]',
};

/**
 * LoadingSpinner Component - مؤشر التحميل الدوار
 * يدعم عدة أحجام وألوان مع Accessibility
 */
const LoadingSpinner = memo(function LoadingSpinner({
    size = 'md',
    color = 'primary',
    className = '',
    'aria-label': ariaLabel = 'جاري التحميل',
}) {
    return (
        <div
            role="status"
            aria-label={ariaLabel}
            aria-live="polite"
            className={`
                ${sizes[size]}
                ${colors[color]}
                rounded-full border-t-transparent animate-spin
                ${className}
            `}
        >
            <span className="sr-only">{ariaLabel}</span>
        </div>
    );
});

LoadingSpinner.displayName = 'LoadingSpinner';

LoadingSpinner.propTypes = {
    /** حجم المؤشر */
    size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
    /** لون المؤشر */
    color: PropTypes.oneOf(['primary', 'secondary', 'white', 'gray']),
    /** Classes إضافية */
    className: PropTypes.string,
    /** وصف للـ accessibility */
    'aria-label': PropTypes.string,
};

export default LoadingSpinner;

/**
 * PageLoading - شاشة تحميل كاملة
 */
export const PageLoading = memo(function PageLoading({
    text = 'جاري التحميل...',
}) {
    return (
        <div
            className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
            role="alert"
            aria-busy="true"
            aria-live="assertive"
        >
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-gray-600 dark:text-gray-300 font-medium">{text}</p>
            </div>
        </div>
    );
});

PageLoading.displayName = 'PageLoading';

PageLoading.propTypes = {
    /** نص التحميل */
    text: PropTypes.string,
};

/**
 * InlineLoading - مؤشر تحميل سطري
 */
export const InlineLoading = memo(function InlineLoading({
    text,
    'aria-label': ariaLabel,
}) {
    return (
        <div
            className="flex items-center gap-3 text-gray-500 dark:text-gray-400"
            role="status"
            aria-label={ariaLabel || text || 'جاري التحميل'}
        >
            <LoadingSpinner size="sm" />
            {text && <span className="text-sm">{text}</span>}
        </div>
    );
});

InlineLoading.displayName = 'InlineLoading';

InlineLoading.propTypes = {
    /** نص التحميل */
    text: PropTypes.string,
    /** وصف للـ accessibility */
    'aria-label': PropTypes.string,
};

/**
 * Skeleton - هيكل تحميل
 */
export const Skeleton = memo(function Skeleton({
    className = '',
    variant = 'text',
    'aria-label': ariaLabel = 'جاري تحميل المحتوى',
}) {
    const variants = {
        text: 'h-4 w-full rounded',
        title: 'h-6 w-3/4 rounded',
        avatar: 'h-10 w-10 rounded-full',
        card: 'h-32 w-full rounded-xl',
        button: 'h-10 w-24 rounded-lg',
    };

    return (
        <div
            role="status"
            aria-label={ariaLabel}
            className={`bg-gray-200 animate-pulse ${variants[variant]} ${className}`}
        >
            <span className="sr-only">{ariaLabel}</span>
        </div>
    );
});

Skeleton.displayName = 'Skeleton';

Skeleton.propTypes = {
    /** Classes إضافية */
    className: PropTypes.string,
    /** نوع الهيكل */
    variant: PropTypes.oneOf(['text', 'title', 'avatar', 'card', 'button']),
    /** وصف للـ accessibility */
    'aria-label': PropTypes.string,
};
