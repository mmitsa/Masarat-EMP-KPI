/**
 * سجل عمليات محفظة التعزيزات المالية
 * WalletTransactionHistory - جدول عمليات مع بحث وفلترة
 *
 * يعرض:
 * - بطاقة ContentCard برأس يحتوي على عنوان "سجل العمليات" وأيقونة جدول
 * - جدول DataTable بالأعمدة: النوع، المبلغ، المرجع، الوصف، الرصيد بعد، التاريخ
 * - شارات ملونة لأنواع العمليات (ارتباط=برتقالي، تحرير=أخضر، إيداع=أزرق، تعديل=بنفسجي)
 * - فلترة حسب نوع العملية (قائمة منسدلة) وبحث في الوصف
 * - حالة فارغة "لا توجد عمليات"
 * - دعم فلترة حسب نوع المرجع (filter prop) لعرض عمليات موديول معين
 * - دعم تحديد عدد أقصى (limit prop) لعرض آخر N عملية
 *
 * @requires WalletContext - سياق المحفظة للوصول لقائمة العمليات وحالة التحميل
 * @requires walletData - مساعدات التنسيق وأنواع العمليات والمراجع
 *
 * @version 2.0.0
 * @date 2026-02-12
 */

import React, { memo, useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useWallet } from '../../context/WalletContext';
import {
    formatCurrency,
    formatWalletDate,
    TRANSACTION_TYPES,
    REFERENCE_TYPES,
} from '../../lib/walletData';
import { ContentCard, DataTable } from '../ui';

// ═══════════════════════════════════════════════════════════
// ثوابت الألوان لشارات أنواع العمليات
// ═══════════════════════════════════════════════════════════

const TYPE_BADGE_STYLES = {
    commitment: 'bg-orange-100 text-orange-700',
    release: 'bg-emerald-100 text-emerald-700',
    topup: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    adjustment: 'bg-purple-100 text-purple-700 dark:text-purple-300',
};

// ═══════════════════════════════════════════════════════════
// خيارات فلتر نوع العملية
// ═══════════════════════════════════════════════════════════

const TYPE_FILTER_OPTIONS = [
    { value: 'all', label: 'جميع العمليات' },
    { value: 'commitment', label: 'ارتباط' },
    { value: 'release', label: 'تحرير' },
    { value: 'topup', label: 'إيداع' },
    { value: 'adjustment', label: 'تعديل' },
];

/**
 * أيقونة الجدول SVG
 * @param {object} props - className
 */
function TableIcon({ className = 'w-5 h-5' }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" />
        </svg>
    );
}

/**
 * WalletTransactionHistory
 * جدول عرض سجل عمليات المحفظة مع بحث وفلترة
 *
 * @param {object} props
 * @param {string} [props.filter] - فلترة حسب نوع المرجع (مثال: 'secondment', 'overtime') لعرض عمليات موديول معين
 * @param {number} [props.limit] - عدد أقصى للعمليات المعروضة (يعرض آخر N عملية)
 * @param {string} [props.className] - كلاسات CSS إضافية
 */
const WalletTransactionHistory = memo(function WalletTransactionHistory({
    filter,
    limit,
    className = '',
}) {
    const { transactions, loading } = useWallet();

    // ── حالة البحث والتصفية ──
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    /**
     * تصفية العمليات حسب جميع المعايير
     */
    const filteredTransactions = useMemo(() => {
        let result = transactions || [];

        // فلترة حسب نوع المرجع (prop خارجي - للعرض من واجهة HR مثلا)
        if (filter) {
            result = result.filter((txn) => txn.referenceType === filter);
        }

        // فلترة حسب نوع العملية (dropdown داخلي)
        if (typeFilter !== 'all') {
            result = result.filter((txn) => txn.type === typeFilter);
        }

        // بحث في الوصف
        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            result = result.filter(
                (txn) =>
                    (txn.description || '').toLowerCase().includes(query) ||
                    (txn.referenceId || '').toLowerCase().includes(query)
            );
        }

        // تحديد العدد (آخر N عملية)
        if (limit && limit > 0) {
            result = result.slice(0, limit);
        }

        return result;
    }, [transactions, filter, typeFilter, searchQuery, limit]);

    /**
     * تعريف أعمدة DataTable
     */
    const columns = useMemo(
        () => [
            {
                key: 'type',
                title: 'النوع',
                width: '100px',
                sortable: true,
                render: (value) => {
                    const typeInfo = TRANSACTION_TYPES[value] || { label: value };
                    const badgeClass = TYPE_BADGE_STYLES[value] || 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200';
                    return (
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}
                        >
                            {typeInfo.label}
                        </span>
                    );
                },
            },
            {
                key: 'amount',
                title: 'المبلغ',
                width: '130px',
                sortable: true,
                render: (value, row) => {
                    const isPositive = row.type === 'release' || row.type === 'topup';
                    return (
                        <span
                            className={`font-semibold text-sm ${
                                isPositive ? 'text-emerald-600' : 'text-orange-600'
                            }`}
                        >
                            {isPositive ? '+' : '-'} {formatCurrency(value)}
                        </span>
                    );
                },
            },
            {
                key: 'referenceType',
                title: 'المرجع',
                width: '160px',
                sortable: true,
                render: (value, row) => {
                    const refInfo = REFERENCE_TYPES[value] || { label: value };
                    return (
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                                {refInfo.label}
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono" dir="ltr">
                                {row.referenceId}
                            </span>
                        </div>
                    );
                },
            },
            {
                key: 'description',
                title: 'الوصف',
                sortable: false,
                render: (value) => (
                    <span className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2" title={value}>
                        {value || '-'}
                    </span>
                ),
            },
            {
                key: 'balanceAfter',
                title: 'الرصيد بعد',
                width: '130px',
                sortable: true,
                render: (value) => (
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {formatCurrency(value)}
                    </span>
                ),
            },
            {
                key: 'createdAt',
                title: 'التاريخ',
                width: '160px',
                sortable: true,
                render: (value) => (
                    <span className="text-xs text-gray-500 dark:text-gray-400" dir="ltr">
                        {formatWalletDate(value)}
                    </span>
                ),
            },
        ],
        []
    );

    /** معالج تغيير فلتر النوع */
    const handleTypeFilterChange = useCallback((e) => {
        setTypeFilter(e.target.value);
    }, []);

    /** معالج تغيير البحث */
    const handleSearchChange = useCallback((e) => {
        setSearchQuery(e.target.value);
    }, []);

    /** أيقونة العنوان */
    const headerIcon = <TableIcon className="w-5 h-5" />;

    /** أدوات الفلترة في رأس البطاقة */
    const headerActions = (
        <div className="flex items-center gap-2 flex-wrap">
            {/* فلتر نوع العملية */}
            <select
                value={typeFilter}
                onChange={handleTypeFilterChange}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                aria-label="فلترة حسب نوع العملية"
            >
                {TYPE_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>

            {/* حقل البحث */}
            <div className="relative">
                <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="بحث في الوصف..."
                    className="pr-9 pl-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors w-48"
                    aria-label="بحث في سجل العمليات"
                />
            </div>
        </div>
    );

    return (
        <ContentCard
            title="سجل العمليات"
            icon={headerIcon}
            actions={headerActions}
            padding="none"
            className={className}
        >
            <div dir="rtl">
                <DataTable
                    columns={columns}
                    data={filteredTransactions}
                    loading={loading}
                    emptyMessage="لا توجد عمليات"
                    pagination={!limit}
                    pageSize={10}
                    sortable
                />
            </div>
        </ContentCard>
    );
});

WalletTransactionHistory.displayName = 'WalletTransactionHistory';

WalletTransactionHistory.propTypes = {
    /** فلترة حسب نوع المرجع (مثال: 'secondment', 'overtime') لعرض عمليات موديول معين */
    filter: PropTypes.string,
    /** عدد أقصى للعمليات المعروضة (يعرض آخر N عملية) */
    limit: PropTypes.number,
    /** كلاسات CSS إضافية */
    className: PropTypes.string,
};

export default WalletTransactionHistory;
