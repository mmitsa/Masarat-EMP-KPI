import React, { useState, useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';

/**
 * DataTable Component - جدول بيانات متقدم
 * يدعم الترتيب، التحديد، الصفحات، RTL و Accessibility
 */
const DataTable = memo(function DataTable({
    columns,
    data,
    loading = false,
    emptyMessage = 'لا توجد بيانات',
    selectable = false,
    onSelectionChange,
    onRowClick,
    sortable = true,
    pagination = true,
    pageSize = 10,
    actions,
}) {
    const [selectedRows, setSelectedRows] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);

    // Filter out null/undefined rows and ensure data is always an array
    const safeData = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];
        return data.filter(row => row != null);
    }, [data]);

    // Sorting
    const sortedData = useMemo(() => {
        if (!sortConfig.key || !sortable) return safeData;

        return [...safeData].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [safeData, sortConfig, sortable]);

    // Pagination
    const paginatedData = useMemo(() => {
        if (!pagination) return sortedData;

        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize, pagination]);

    const totalPages = Math.ceil(safeData.length / pageSize);

    // Handlers
    const handleSort = (key) => {
        if (!sortable) return;

        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = paginatedData.map((row) => row.id);
            setSelectedRows(allIds);
            onSelectionChange?.(allIds);
        } else {
            setSelectedRows([]);
            onSelectionChange?.([]);
        }
    };

    const handleSelectRow = (id) => {
        const newSelection = selectedRows.includes(id)
            ? selectedRows.filter((rowId) => rowId !== id)
            : [...selectedRows, id];

        setSelectedRows(newSelection);
        onSelectionChange?.(newSelection);
    };

    // Loading state
    if (loading) {
        return (
            <div className="bg-[var(--card-bg)] rounded-[var(--card-radius)] overflow-hidden border border-[var(--card-border)]">
                <div className="animate-pulse">
                    <div className="h-10 sm:h-12 bg-gray-100 dark:bg-gray-700"></div>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 sm:h-14 lg:h-16 border-b border-gray-100 dark:border-gray-700 flex items-center px-3 sm:px-4 lg:px-6 gap-2 sm:gap-3 lg:gap-4">
                            <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
                            <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                            <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4 hidden sm:block"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (safeData.length === 0) {
        return (
            <div className="bg-[var(--card-bg)] rounded-[var(--card-radius)] p-6 sm:p-8 lg:p-12 text-center border border-[var(--card-border)]">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto mb-3 sm:mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base lg:text-lg">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="bg-[var(--card-bg)] rounded-[var(--card-radius)] overflow-hidden border border-[var(--card-border)]">
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full" role="grid" aria-label="جدول البيانات">
                    <thead>
                        <tr className="bg-[var(--table-header-bg)] border-b border-[var(--table-border)]">
                            {selectable && (
                                <th scope="col" className="px-3 py-3 sm:px-4 lg:px-6 w-10 sm:w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400"
                                        aria-label="تحديد جميع الصفوف"
                                    />
                                </th>
                            )}
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    scope="col"
                                    className={`px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-right text-xs sm:text-sm font-bold text-[var(--text-secondary)] ${sortable && col.sortable !== false ? 'cursor-pointer hover:text-[var(--text-primary)] select-none' : ''}`}
                                    onClick={() => col.sortable !== false && handleSort(col.key)}
                                    style={{ width: col.width }}
                                    aria-sort={sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                                    tabIndex={sortable && col.sortable !== false ? 0 : undefined}
                                    onKeyDown={(e) => {
                                        if ((e.key === 'Enter' || e.key === ' ') && col.sortable !== false) {
                                            e.preventDefault();
                                            handleSort(col.key);
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        {col.title || col.label}
                                        {sortable && col.sortable !== false && sortConfig.key === col.key && (
                                            <span className="text-primary-600 dark:text-primary-400" aria-hidden="true">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions && <th scope="col" className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-right text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300">الإجراءات</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--table-border)]">
                        {paginatedData.map((row, rowIndex) => (
                            <tr
                                key={row.id || rowIndex}
                                className={`hover:bg-[var(--table-row-hover)] transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${selectedRows.includes(row.id) ? 'bg-[var(--color-primary-100)]' : ''}`}
                                onClick={() => onRowClick?.(row)}
                                tabIndex={onRowClick ? 0 : undefined}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && onRowClick) {
                                        onRowClick(row);
                                    }
                                }}
                                aria-selected={selectedRows.includes(row.id)}
                            >
                                {selectable && (
                                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.includes(row.id)}
                                            onChange={() => handleSelectRow(row.id)}
                                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400"
                                            aria-label={`تحديد الصف ${rowIndex + 1}`}
                                        />
                                    </td>
                                )}
                                {columns.map((col) => (
                                    <td key={col.key} className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-xs sm:text-sm text-[var(--text-primary)]">
                                        {col.render ? col.render(row?.[col.key], row) : row?.[col.key]}
                                    </td>
                                ))}
                                {actions && (
                                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4" onClick={(e) => e.stopPropagation()}>
                                        {actions(row)}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination - RTL aware */}
            {pagination && totalPages > 1 && (
                <nav
                    className="px-3 py-3 sm:px-4 sm:py-3 lg:px-6 lg:py-4 border-t border-[var(--table-border)] flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0"
                    aria-label="التنقل بين الصفحات"
                >
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] order-2 sm:order-1" aria-live="polite">
                        <span className="hidden sm:inline">عرض </span>{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, safeData.length)} من {safeData.length}
                    </p>
                    <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                        {/* Last page (RTL: appears first visually) */}
                        <button
                            type="button"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-secondary)]"
                            aria-label="الصفحة الأخيرة"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                        {/* Next page */}
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => p + 1)}
                            disabled={currentPage === totalPages}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-secondary)]"
                            aria-label="الصفحة التالية"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-[var(--text-secondary)]" aria-current="page">
                            {currentPage}/{totalPages}
                        </span>
                        {/* Previous page */}
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => p - 1)}
                            disabled={currentPage === 1}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-secondary)]"
                            aria-label="الصفحة السابقة"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        {/* First page (RTL: appears last visually) */}
                        <button
                            type="button"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-secondary)]"
                            aria-label="الصفحة الأولى"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </nav>
            )}
        </div>
    );
});

DataTable.displayName = 'DataTable';

DataTable.propTypes = {
    /** تعريف الأعمدة */
    columns: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string.isRequired,
        title: PropTypes.string,
        label: PropTypes.string,
        width: PropTypes.string,
        sortable: PropTypes.bool,
        /** دالة عرض مخصصة: render(cellValue, row) */
        render: PropTypes.func,
    })).isRequired,
    /** بيانات الجدول */
    data: PropTypes.array,
    /** حالة التحميل */
    loading: PropTypes.bool,
    /** رسالة عدم وجود بيانات */
    emptyMessage: PropTypes.string,
    /** تفعيل التحديد */
    selectable: PropTypes.bool,
    /** دالة تغيير التحديد */
    onSelectionChange: PropTypes.func,
    /** دالة النقر على الصف */
    onRowClick: PropTypes.func,
    /** تفعيل الترتيب */
    sortable: PropTypes.bool,
    /** تفعيل الصفحات */
    pagination: PropTypes.bool,
    /** عدد العناصر بالصفحة */
    pageSize: PropTypes.number,
    /** دالة الإجراءات */
    actions: PropTypes.func,
};

export default DataTable;
