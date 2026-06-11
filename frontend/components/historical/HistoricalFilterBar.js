import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { SearchInput } from '../ui';

/**
 * HistoricalFilterBar - شريط فلاتر البيانات التاريخية
 * يدعم البحث بالاسم + فترة زمنية + الحالة + مسح الفلاتر
 */
const HistoricalFilterBar = memo(function HistoricalFilterBar({
    searchValue = '',
    onSearchChange,
    dateFrom = '',
    onDateFromChange,
    dateTo = '',
    onDateToChange,
    statusValue = '',
    onStatusChange,
    statusOptions = [],
    onClearFilters,
    hasActiveFilters = false,
}) {
    const handleClear = useCallback(() => {
        onClearFilters?.();
    }, [onClearFilters]);

    return (
        <div dir="rtl" className="flex flex-wrap items-end gap-3">
            {/* البحث بالاسم */}
            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    بحث
                </label>
                <SearchInput
                    value={searchValue}
                    onChange={onSearchChange}
                    placeholder="بحث بالاسم أو الرقم..."
                    size="sm"
                />
            </div>

            {/* من تاريخ */}
            <div className="min-w-[150px]">
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    من تاريخ
                </label>
                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => onDateFromChange?.(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[var(--card-border,var(--border-light))] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)]"
                />
            </div>

            {/* إلى تاريخ */}
            <div className="min-w-[150px]">
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    إلى تاريخ
                </label>
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => onDateToChange?.(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[var(--card-border,var(--border-light))] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)]"
                />
            </div>

            {/* الحالة */}
            <div className="min-w-[140px]">
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    الحالة
                </label>
                <select
                    value={statusValue}
                    onChange={(e) => onStatusChange?.(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[var(--card-border,var(--border-light))] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)]"
                >
                    {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* مسح الفلاتر */}
            {hasActiveFilters && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-error-light)] rounded-lg transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    مسح الفلاتر
                </button>
            )}
        </div>
    );
});

HistoricalFilterBar.displayName = 'HistoricalFilterBar';

HistoricalFilterBar.propTypes = {
    searchValue: PropTypes.string,
    onSearchChange: PropTypes.func.isRequired,
    dateFrom: PropTypes.string,
    onDateFromChange: PropTypes.func.isRequired,
    dateTo: PropTypes.string,
    onDateToChange: PropTypes.func.isRequired,
    statusValue: PropTypes.string,
    onStatusChange: PropTypes.func.isRequired,
    statusOptions: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
    })),
    onClearFilters: PropTypes.func.isRequired,
    hasActiveFilters: PropTypes.bool,
};

export default HistoricalFilterBar;
