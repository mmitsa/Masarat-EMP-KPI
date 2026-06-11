import React, { memo, forwardRef } from 'react';
import PropTypes from 'prop-types';

/**
 * أنماط الأزرار الحكومية
 * Government Button Variants
 */
const variants = {
    // الزر الأساسي - أخضر حكومي
    primary: `
        bg-primary-500 text-white
        hover:bg-primary-600 active:bg-primary-700
        focus:ring-primary-500/30
        shadow-sm dark:shadow-gray-900/20 hover:shadow-md
    `,
    // الزر الثانوي - إطار أخضر
    secondary: `
        bg-transparent text-primary-500
        border-2 border-primary-500
        hover:bg-primary-50 active:bg-primary-100
        focus:ring-primary-500/30
        dark:text-primary-400 dark:border-primary-400
        dark:hover:bg-primary-950/50 dark:active:bg-primary-900/30
    `,
    // زر النجاح
    success: `
        bg-success-500 text-white
        hover:bg-success-600 active:bg-success-700
        focus:ring-success-500/30
        shadow-sm dark:shadow-gray-900/20 hover:shadow-md
    `,
    // زر الخطر
    danger: `
        bg-error-500 text-white
        hover:bg-error-600 active:bg-error-700
        focus:ring-error-500/30
        shadow-sm dark:shadow-gray-900/20 hover:shadow-md
    `,
    // زر التحذير
    warning: `
        bg-warning-500 text-white
        hover:bg-warning-600 active:bg-warning-700
        focus:ring-warning-500/30
        shadow-sm dark:shadow-gray-900/20 hover:shadow-md
    `,
    // زر المعلومات
    info: `
        bg-info-500 text-white
        hover:bg-info-600 active:bg-info-700
        focus:ring-info-500/30
        shadow-sm dark:shadow-gray-900/20 hover:shadow-md
    `,
    // زر شفاف
    ghost: `
        bg-transparent text-neutral-600
        hover:bg-neutral-100 active:bg-neutral-200
        focus:ring-neutral-500/30
        dark:text-neutral-300 dark:hover:bg-neutral-800
    `,
    // زر بإطار فقط
    outline: `
        bg-transparent text-neutral-700
        border border-neutral-300
        hover:bg-neutral-50 active:bg-neutral-100
        focus:ring-neutral-500/30
        dark:text-neutral-300 dark:border-neutral-600 dark:hover:bg-neutral-800
    `,
    // زر رابط
    link: `
        bg-transparent text-primary-500
        hover:text-primary-600 hover:underline
        focus:ring-primary-500/30
        p-0 h-auto
        dark:text-primary-400 dark:hover:text-primary-300
    `,
    // زر ذهبي (للعناصر المميزة)
    gold: `
        bg-gold-500 text-white
        hover:bg-gold-600 active:bg-gold-700
        focus:ring-gold-500/30
        shadow-sm dark:shadow-gray-900/20 hover:shadow-md
    `,
};

/**
 * أحجام الأزرار - محسنة للشاشات المختلفة
 * Button Sizes - Responsive optimized
 */
const sizes = {
    xs: 'px-2.5 sm:px-3 py-1 text-xs min-h-[28px] gap-1',
    sm: 'px-3 sm:px-4 py-1.5 text-xs sm:text-sm min-h-[32px] sm:min-h-[36px] gap-1.5',
    md: 'px-4 sm:px-5 py-2 text-sm min-h-[36px] sm:min-h-[40px] gap-2',
    lg: 'px-5 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base min-h-[40px] sm:min-h-[48px] gap-2',
    xl: 'px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg min-h-[48px] sm:min-h-[56px] gap-3',
};

/**
 * أحجام الأيقونات
 */
const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
};

/**
 * Button Component - زر حكومي قابل لإعادة الاستخدام
 * يدعم عدة أنماط وأحجام مع دعم كامل للـ RTL و Accessibility
 *
 * @example
 * // الزر الأساسي
 * <Button variant="primary">إضافة موظف</Button>
 *
 * // زر مع أيقونة
 * <Button variant="primary" icon={<PlusIcon />}>إضافة جديد</Button>
 *
 * // زر تحميل
 * <Button variant="primary" loading>جاري الحفظ...</Button>
 */
const Button = memo(forwardRef(function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'start',
    loading = false,
    disabled = false,
    fullWidth = false,
    rounded = 'lg',
    className = '',
    'aria-label': ariaLabel,
    type = 'button',
    ...props
}, ref) {

    const baseClasses = `
        inline-flex items-center justify-center
        font-semibold whitespace-nowrap
        rounded-${rounded}
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        select-none
    `;

    const isDisabled = disabled || loading;
    const IconSize = iconSizes[size];

    // Loading Spinner
    const LoadingSpinner = () => (
        <svg
            className={`animate-spin ${IconSize}`}
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );

    // Icon Wrapper
    const IconWrapper = ({ children: iconChildren }) => (
        <span className={`flex-shrink-0 ${IconSize}`} aria-hidden="true">
            {iconChildren}
        </span>
    );

    return (
        <button
            ref={ref}
            type={type}
            className={[
                baseClasses,
                variants[variant],
                sizes[size],
                fullWidth ? 'w-full' : '',
                className
            ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()}
            disabled={isDisabled}
            aria-disabled={isDisabled}
            aria-busy={loading}
            aria-label={ariaLabel || (loading ? 'جاري التحميل' : undefined)}
            {...props}
        >
            {loading ? (
                <>
                    <LoadingSpinner />
                    <span>{children || 'جاري التحميل...'}</span>
                </>
            ) : (
                <>
                    {/* RTL: iconPosition 'start' means right side in RTL */}
                    {icon && iconPosition === 'start' && <IconWrapper>{icon}</IconWrapper>}
                    {children && <span>{children}</span>}
                    {icon && iconPosition === 'end' && <IconWrapper>{icon}</IconWrapper>}
                </>
            )}
        </button>
    );
}));

Button.displayName = 'Button';

Button.propTypes = {
    /** محتوى الزر */
    children: PropTypes.node,
    /** نمط الزر */
    variant: PropTypes.oneOf([
        'primary', 'secondary', 'success', 'danger',
        'warning', 'info', 'ghost', 'outline', 'link', 'gold'
    ]),
    /** حجم الزر */
    size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
    /** أيقونة الزر */
    icon: PropTypes.node,
    /** موضع الأيقونة (start = يمين في RTL، end = يسار في RTL) */
    iconPosition: PropTypes.oneOf(['start', 'end']),
    /** حالة التحميل */
    loading: PropTypes.bool,
    /** تعطيل الزر */
    disabled: PropTypes.bool,
    /** عرض كامل */
    fullWidth: PropTypes.bool,
    /** نصف قطر الحواف */
    rounded: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl', 'full']),
    /** Classes إضافية */
    className: PropTypes.string,
    /** نوع الزر */
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    /** وصف للـ accessibility */
    'aria-label': PropTypes.string,
    /** دالة onClick */
    onClick: PropTypes.func,
};

/**
 * IconButton - زر أيقونة فقط
 */
export const IconButton = memo(forwardRef(function IconButton({
    icon,
    size = 'md',
    variant = 'ghost',
    className = '',
    'aria-label': ariaLabel,
    ...props
}, ref) {
    const iconButtonSizes = {
        xs: 'w-7 h-7',
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-14 h-14',
    };

    return (
        <Button
            ref={ref}
            variant={variant}
            size={size}
            icon={icon}
            aria-label={ariaLabel}
            className={`${iconButtonSizes[size]} !p-0 ${className}`}
            {...props}
        />
    );
}));

IconButton.displayName = 'IconButton';

IconButton.propTypes = {
    icon: PropTypes.node.isRequired,
    size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
    variant: PropTypes.string,
    className: PropTypes.string,
    'aria-label': PropTypes.string.isRequired,
};

/**
 * ButtonGroup - مجموعة أزرار
 */
export const ButtonGroup = memo(function ButtonGroup({
    children,
    className = '',
    attached = false,
}) {
    return (
        <div
            className={`
                inline-flex items-center
                ${attached ? '[&>button]:rounded-none [&>button:first-child]:rounded-r-lg [&>button:last-child]:rounded-l-lg [&>button:not(:last-child)]:border-l-0' : 'gap-2'}
                ${className}
            `}
            role="group"
        >
            {children}
        </div>
    );
});

ButtonGroup.displayName = 'ButtonGroup';

ButtonGroup.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    attached: PropTypes.bool,
};

export default Button;
