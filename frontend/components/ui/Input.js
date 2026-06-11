import React, { forwardRef, useId, memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Input Component - حقل إدخال نصي
 * يدعم RTL و Accessibility كاملة
 */
const Input = memo(forwardRef(({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    hint,
    disabled = false,
    required = false,
    icon,
    suffix,
    className = '',
    id: providedId,
    name,
    min,
    max,
    step,
    ...props
}, ref) => {
    const generatedId = useId();
    const inputId = providedId || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    // تحويل type="number" إلى text مع inputMode للسماح بالكتابة الحرة
    const isNumeric = type === 'number';
    const inputType = isNumeric ? 'text' : type;
    const inputMode = isNumeric ? (step && parseFloat(step) % 1 !== 0 ? 'decimal' : 'numeric') : undefined;

    // معالجة الإدخال الرقمي - السماح بالأرقام والنقطة والسالب فقط
    const handleChange = (e) => {
        if (isNumeric && onChange) {
            const val = e.target.value;
            // السماح بالقيمة الفارغة والأرقام والنقطة العشرية والسالب
            if (val === '' || val === '-' || val === '.' || val === '-.' || /^-?\d*\.?\d*$/.test(val)) {
                onChange(e);
            }
        } else if (onChange) {
            onChange(e);
        }
    };

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                >
                    {label}
                    {required && <span className="text-red-500 mr-1" aria-hidden="true">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" aria-hidden="true">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    name={name || inputId}
                    type={inputType}
                    inputMode={inputMode}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    {...(isNumeric && min !== undefined ? { 'data-min': min } : {})}
                    {...(isNumeric && max !== undefined ? { 'data-max': max } : {})}
                    {...(isNumeric && step !== undefined ? { 'data-step': step } : {})}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={
                        [error && errorId, hint && !error && hintId].filter(Boolean).join(' ') || undefined
                    }
                    className={[
                        'w-full px-[var(--spacing-4)] py-[var(--spacing-3)] rounded-[var(--input-radius)] border transition-colors',
                        icon ? 'pr-11' : '',
                        suffix ? 'pl-12' : '',
                        error
                            ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error-light)]'
                            : 'border-[var(--input-border)] focus:border-[var(--input-focus-border)] focus:ring-[var(--color-primary-100)]',
                        disabled
                            ? 'bg-[var(--color-gray-100)] cursor-not-allowed'
                            : 'bg-[var(--input-bg)]',
                        'text-[var(--text-primary)] focus:outline-none focus:ring-4 placeholder:text-[var(--text-tertiary)]',
                    ].join(' ')}
                    {...props}
                />
                {suffix && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-sm pointer-events-none" aria-hidden="true">
                        {suffix}
                    </div>
                )}
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

Input.displayName = 'Input';

Input.propTypes = {
    /** عنوان الحقل */
    label: PropTypes.string,
    /** نوع الحقل */
    type: PropTypes.oneOf(['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time', 'datetime-local']),
    /** النص التوضيحي */
    placeholder: PropTypes.string,
    /** القيمة */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** دالة التغيير */
    onChange: PropTypes.func,
    /** رسالة الخطأ */
    error: PropTypes.string,
    /** نص المساعدة */
    hint: PropTypes.string,
    /** تعطيل الحقل */
    disabled: PropTypes.bool,
    /** حقل مطلوب */
    required: PropTypes.bool,
    /** أيقونة على اليمين */
    icon: PropTypes.node,
    /** لاحقة على اليسار */
    suffix: PropTypes.node,
    /** Classes إضافية */
    className: PropTypes.string,
    /** معرف الحقل */
    id: PropTypes.string,
    /** اسم الحقل */
    name: PropTypes.string,
};

export default Input;

/**
 * Textarea Component - حقل نص متعدد الأسطر
 */
export const Textarea = memo(forwardRef(({
    label,
    placeholder,
    value,
    onChange,
    error,
    hint,
    disabled = false,
    required = false,
    rows = 4,
    className = '',
    id: providedId,
    name,
    maxLength,
    ...props
}, ref) => {
    const generatedId = useId();
    const textareaId = providedId || generatedId;
    const errorId = `${textareaId}-error`;
    const hintId = `${textareaId}-hint`;

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label
                    htmlFor={textareaId}
                    className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                >
                    {label}
                    {required && <span className="text-red-500 mr-1" aria-hidden="true">*</span>}
                </label>
            )}
            <textarea
                ref={ref}
                id={textareaId}
                name={name || textareaId}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                rows={rows}
                maxLength={maxLength}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={
                    [error && errorId, hint && !error && hintId].filter(Boolean).join(' ') || undefined
                }
                className={[
                    'w-full px-[var(--spacing-4)] py-[var(--spacing-3)] rounded-[var(--input-radius)] border transition-colors resize-none',
                    error
                        ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error-light)]'
                        : 'border-[var(--input-border)] focus:border-[var(--input-focus-border)] focus:ring-[var(--color-primary-100)]',
                    disabled
                        ? 'bg-[var(--color-gray-100)] cursor-not-allowed'
                        : 'bg-[var(--input-bg)]',
                    'text-[var(--text-primary)] focus:outline-none focus:ring-4 placeholder:text-[var(--text-tertiary)]',
                ].join(' ')}
                {...props}
            />
            <div className="flex justify-between items-center mt-2">
                {error ? (
                    <p id={errorId} className="text-sm text-[var(--color-error)]" role="alert">{error}</p>
                ) : hint ? (
                    <p id={hintId} className="text-sm text-[var(--text-tertiary)]">{hint}</p>
                ) : (
                    <span></span>
                )}
                {maxLength && (
                    <span className="text-xs text-[var(--text-tertiary)]">
                        {(value?.length || 0)}/{maxLength}
                    </span>
                )}
            </div>
        </div>
    );
}));

Textarea.displayName = 'Textarea';

Textarea.propTypes = {
    label: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    error: PropTypes.string,
    hint: PropTypes.string,
    disabled: PropTypes.bool,
    required: PropTypes.bool,
    rows: PropTypes.number,
    className: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
    maxLength: PropTypes.number,
};
