import React, { memo, useState } from 'react';

const periods = [
    { id: 'month', label: 'هذا الشهر' },
    { id: 'quarter', label: 'هذا الربع' },
    { id: 'half', label: 'آخر 6 أشهر' },
    { id: 'year', label: 'هذا العام' },
];

const PeriodSelector = memo(function PeriodSelector({
    value = 'quarter',
    onChange,
    showCompare = false,
    compareEnabled = false,
    onCompareChange,
    darkMode = false,
    className = '',
}) {
    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
            {/* فترات سريعة */}
            <div className={`
                inline-flex rounded-lg border overflow-hidden
                ${darkMode ? 'border-neutral-700' : 'border-neutral-200'}
            `}>
                {periods.map((period) => (
                    <button
                        key={period.id}
                        onClick={() => onChange?.(period.id)}
                        className={`
                            px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors
                            ${value === period.id
                                ? darkMode
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-primary-50 text-primary-700 font-bold'
                                : darkMode
                                    ? 'text-neutral-400 hover:bg-neutral-800'
                                    : 'text-neutral-600 hover:bg-neutral-50'
                            }
                        `}
                    >
                        {period.label}
                    </button>
                ))}
            </div>

            {/* زر المقارنة */}
            {showCompare && (
                <button
                    onClick={() => onCompareChange?.(!compareEnabled)}
                    className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm
                        border transition-colors
                        ${compareEnabled
                            ? darkMode
                                ? 'bg-primary-900/30 border-primary-700 text-primary-400'
                                : 'bg-primary-50 border-primary-200 text-primary-700'
                            : darkMode
                                ? 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
                                : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                        }
                    `}
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    مقارنة مع الفترة السابقة
                </button>
            )}
        </div>
    );
});

PeriodSelector.displayName = 'PeriodSelector';

export default PeriodSelector;
