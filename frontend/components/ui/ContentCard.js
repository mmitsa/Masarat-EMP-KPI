import React, { memo } from 'react';
import PropTypes from 'prop-types';

const paddingVariants = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5 lg:p-6',
    lg: 'p-5 sm:p-6 lg:p-8',
};

/**
 * ContentCard Component - بطاقة محتوى
 * تُستخدم لتغليف المحتوى في بطاقات منسقة
 */
const ContentCard = memo(function ContentCard({
    title,
    subtitle,
    icon,
    actions,
    children,
    padding = 'md',
    headerBorder = true,
    allowOverflow = false,
    className = '',
    bodyClassName = '',
    as: Component = 'article',
    'aria-label': ariaLabel,
    onClick,
    style,
}) {
    const hasHeader = title || subtitle || actions;

    return (
        <Component
            className={`bg-[var(--card-bg)] rounded-[var(--card-radius)] shadow-[var(--card-shadow)] border border-[var(--card-border)] ${allowOverflow ? '' : 'overflow-hidden'} ${className}`}
            aria-label={ariaLabel || title}
            onClick={onClick}
            style={style}
        >
            {/* Header */}
            {hasHeader && (
                <header className={`px-3 py-3 sm:px-4 sm:py-3 lg:px-6 lg:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 ${headerBorder ? 'border-b border-[var(--card-border)]' : ''}`}>
                    <div className="flex items-center gap-2 sm:gap-3">
                        {icon && (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-500)] flex-shrink-0" aria-hidden="true">
                                {typeof icon === 'string' ? <span className="text-lg sm:text-xl">{icon}</span> : icon}
                            </div>
                        )}
                        <div className="min-w-0">
                            {title && <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate">{title}</h3>}
                            {subtitle && <p className="text-xs sm:text-sm text-[var(--text-secondary)] truncate">{subtitle}</p>}
                        </div>
                    </div>
                    {actions && <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center">{actions}</div>}
                </header>
            )}

            {/* Body */}
            <div className={`${paddingVariants[padding]} ${allowOverflow ? '' : 'overflow-x-hidden'} break-words wrap-anywhere no-x-scroll ${bodyClassName}`}>
                {children}
            </div>
        </Component>
    );
});

ContentCard.displayName = 'ContentCard';

ContentCard.propTypes = {
    /** عنوان البطاقة */
    title: PropTypes.string,
    /** العنوان الفرعي */
    subtitle: PropTypes.string,
    /** أيقونة البطاقة */
    icon: PropTypes.node,
    /** أزرار الإجراءات */
    actions: PropTypes.node,
    /** محتوى البطاقة */
    children: PropTypes.node,
    /** حجم الحشوة الداخلية */
    padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
    /** إظهار الحد بين الرأس والمحتوى */
    headerBorder: PropTypes.bool,
    /** Classes إضافية للبطاقة */
    className: PropTypes.string,
    /** Classes إضافية للمحتوى */
    bodyClassName: PropTypes.string,
    /** السماح بتجاوز المحتوى (للقوائم المنسدلة) */
    allowOverflow: PropTypes.bool,
    /** نوع العنصر HTML */
    as: PropTypes.oneOf(['article', 'section', 'div', 'aside']),
    /** وصف للـ accessibility */
    'aria-label': PropTypes.string,
    /** حدث النقر */
    onClick: PropTypes.func,
    /** أنماط مخصصة */
    style: PropTypes.object,
};

export default ContentCard;

/**
 * CardSection - قسم داخل البطاقة
 */
export const CardSection = memo(function CardSection({
    title,
    children,
    className = '',
}) {
    return (
        <section className={className} aria-label={title}>
            {title && (
                <h4 className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                    <span className="w-1 h-3 sm:h-4 bg-[var(--color-primary-500)] rounded-full" aria-hidden="true"></span>
                    {title}
                </h4>
            )}
            {children}
        </section>
    );
});

CardSection.displayName = 'CardSection';

CardSection.propTypes = {
    /** عنوان القسم */
    title: PropTypes.string,
    /** محتوى القسم */
    children: PropTypes.node,
    /** Classes إضافية */
    className: PropTypes.string,
};
