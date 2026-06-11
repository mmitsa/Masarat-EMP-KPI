import React, { forwardRef, useId, memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Select Component - قائمة منسدلة
 * يدعم RTL و Accessibility كاملة
 */
const Select = memo(forwardRef(function Select({
    label,
    options = [],
    value,
    onChange,
    placeholder = 'اختر...',
    error,
    hint,
    disabled = false,
    required = false,
    className = '',
    id: providedId,
    name,
    ...props
}, ref) {
    const generatedId = useId();
    const selectId = providedId || generatedId;
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                >
                    {label}
                    {required && <span className="text-red-500 mr-1" aria-hidden="true">*</span>}
                </label>
            )}
            <div className="relative">
                <select
                    ref={ref}
                    id={selectId}
                    name={name || selectId}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    required={required}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={
                        [error && errorId, hint && !error && hintId].filter(Boolean).join(' ') || undefined
                    }
                    className={[
                        'w-full px-[var(--spacing-4)] py-[var(--spacing-3)] rounded-[var(--input-radius)] border transition-colors appearance-none',
                        error
                            ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error-light)]'
                            : 'border-[var(--input-border)] focus:border-[var(--input-focus-border)] focus:ring-[var(--color-primary-100)]',
                        disabled
                            ? 'bg-[var(--color-gray-100)] cursor-not-allowed'
                            : 'bg-[var(--input-bg)]',
                        'focus:outline-none focus:ring-4',
                        !value
                            ? 'text-[var(--text-tertiary)]'
                            : 'text-[var(--text-primary)]'
                    ].join(' ')}
                    {...props}
                >
                    <option value="" disabled>{placeholder}</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
                    <svg className="w-5 h-5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            {error && (
                <p id={errorId} className="mt-2 text-sm text-[var(--color-error)] flex items-center gap-1" role="alert">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
            {hint && !error && (
                <p id={hintId} className="mt-2 text-sm text-[var(--text-tertiary)]">{hint}</p>
            )}
        </div>
    );
}));

Select.displayName = 'Select';

Select.propTypes = {
    /** عنوان القائمة */
    label: PropTypes.string,
    /** الخيارات المتاحة */
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
    })),
    /** القيمة المحددة */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** دالة التغيير */
    onChange: PropTypes.func,
    /** النص التوضيحي */
    placeholder: PropTypes.string,
    /** رسالة الخطأ */
    error: PropTypes.string,
    /** نص المساعدة */
    hint: PropTypes.string,
    /** تعطيل القائمة */
    disabled: PropTypes.bool,
    /** قائمة مطلوبة */
    required: PropTypes.bool,
    /** Classes إضافية */
    className: PropTypes.string,
    /** معرف القائمة */
    id: PropTypes.string,
    /** اسم القائمة */
    name: PropTypes.string,
};

export default Select;
