import React, { useState, useId, useRef, useEffect, memo, forwardRef, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * SearchInput Component - حقل البحث
 * يدعم RTL و Accessibility كاملة
 * onChange يمرر القيمة النصية مباشرة (string) وليس event
 */
const SearchInput = memo(forwardRef(function SearchInput({
    value,
    onChange,
    placeholder = 'بحث...',
    onSearch,
    className = '',
    size = 'md',
    id: providedId,
    'aria-label': ariaLabel = 'بحث',
    ...props
}, ref) {
    const [isFocused, setIsFocused] = useState(false);
    const generatedId = useId();
    const inputId = providedId || generatedId;

    // Stable refs to avoid re-renders from callback changes
    const onChangeRef = useRef(onChange);
    const onSearchRef = useRef(onSearch);
    useEffect(() => { onChangeRef.current = onChange; });
    useEffect(() => { onSearchRef.current = onSearch; });

    const sizes = {
        sm: 'py-[var(--spacing-2)] px-[var(--spacing-3)] text-[var(--font-size-sm)]',
        md: 'py-[var(--spacing-3)] px-[var(--spacing-4)] text-[var(--font-size-base)]',
        lg: 'py-[var(--spacing-4)] px-[var(--spacing-5)] text-[var(--font-size-lg)]',
    };

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && onSearchRef.current) {
            onSearchRef.current(value);
        }
    }, [value]);

    const handleClear = useCallback(() => {
        onChangeRef.current('');
    }, []);

    const handleChange = useCallback((e) => {
        onChangeRef.current(e.target.value);
    }, []);

    return (
        <div className={`relative ${className}`} role="search">
            <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
                <svg
                    className={`w-5 h-5 transition-colors ${isFocused ? 'text-primary-500' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input
                ref={ref}
                id={inputId}
                type="search"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                aria-label={ariaLabel}
                className={[
                    'w-full pr-11 rounded-[var(--input-radius)] border border-[var(--input-border)] bg-[var(--input-bg)]',
                    'focus:outline-none focus:border-[var(--input-focus-border)] focus:ring-4 focus:ring-[var(--color-primary-100)]',
                    'transition-all placeholder:text-[var(--text-tertiary)] text-[var(--text-primary)]',
                    sizes[size]
                ].join(' ')}
                {...props}
            />
            {value && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--bg-tertiary)] transition-colors"
                    aria-label="مسح البحث"
                >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}));

SearchInput.displayName = 'SearchInput';

SearchInput.propTypes = {
    /** قيمة البحث */
    value: PropTypes.string,
    /** دالة تغيير القيمة */
    onChange: PropTypes.func.isRequired,
    /** النص التوضيحي */
    placeholder: PropTypes.string,
    /** دالة تنفيذ البحث عند الضغط على Enter */
    onSearch: PropTypes.func,
    /** Classes إضافية */
    className: PropTypes.string,
    /** حجم الحقل */
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** معرف الحقل */
    id: PropTypes.string,
    /** وصف للـ accessibility */
    'aria-label': PropTypes.string,
};

export default SearchInput;
