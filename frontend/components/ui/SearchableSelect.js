import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * SearchableSelect - قائمة منسدلة مع شريط بحث
 * بديل لـ Select العادي عندما تكون القائمة طويلة (مثل قوائم الموظفين)
 */
export default function SearchableSelect({
    label,
    value,
    onChange,
    options = [],
    placeholder = 'ابحث واختر...',
    className = '',
    disabled = false,
    error,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // إغلاق القائمة عند النقر خارجها
    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // فلترة الخيارات بناء على البحث
    const filteredOptions = useMemo(() => {
        if (!search.trim()) return options.filter(o => o.value !== '');
        const term = search.toLowerCase();
        return options.filter(o =>
            o.value !== '' && o.label?.toLowerCase().includes(term)
        );
    }, [options, search]);

    // اسم الخيار المحدد حالياً
    const selectedLabel = useMemo(() => {
        if (!value) return '';
        const opt = options.find(o => String(o.value) === String(value));
        return opt?.label || '';
    }, [value, options]);

    const handleSelect = (optValue) => {
        onChange({ target: { value: optValue } });
        setIsOpen(false);
        setSearch('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange({ target: { value: '' } });
        setSearch('');
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{label}</label>
            )}

            {/* الحقل الرئيسي */}
            <div
                className={`
                    flex items-center justify-between gap-2 w-full px-3 py-2.5
                    border rounded-lg cursor-pointer transition-colors
                    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white dark:bg-gray-900 hover:border-blue-400'}
                    ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 dark:border-gray-600'}
                    ${error ? 'border-red-500' : ''}
                `}
                onClick={() => {
                    if (!disabled) {
                        setIsOpen(!isOpen);
                        setTimeout(() => inputRef.current?.focus(), 50);
                    }
                }}
            >
                <span className={`text-sm truncate ${selectedLabel ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {selectedLabel || placeholder}
                </span>
                <div className="flex items-center gap-1">
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* القائمة المنسدلة */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-72 overflow-hidden">
                    {/* شريط البحث */}
                    <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                        <div className="relative">
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="اكتب للبحث..."
                                className="w-full pr-9 pl-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* قائمة الخيارات */}
                    <div className="max-h-52 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                                {search ? 'لا توجد نتائج' : 'لا توجد خيارات'}
                            </div>
                        ) : (
                            filteredOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleSelect(opt.value)}
                                    className={`
                                        w-full text-right px-3 py-2.5 text-sm transition-colors
                                        hover:bg-blue-50 hover:text-blue-700
                                        ${String(opt.value) === String(value) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 font-medium' : 'text-gray-700 dark:text-gray-200'}
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}
