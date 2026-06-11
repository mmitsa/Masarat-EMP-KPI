/**
 * ================================================================
 * Inventory Table Component
 * ================================================================
 *
 * @component InventoryTable
 * @description جدول عرض المخزون مع البحث والفلترة
 * @version 1.0.0
 * @date 2026-02-14
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { DataTable, Badge, Button } from '../ui';
import StockLevelIndicator from './StockLevelIndicator';
import Link from 'next/link';

import { fmtDate } from '../../utils/hijriDate';

/**
 * InventoryTable Component
 */
export default function InventoryTable({
    data = [],
    loading = false,
    onRowClick,
    showActions = true,
    className = ''
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterWarehouse, setFilterWarehouse] = useState('all');

    // تصفية البيانات
    const filteredData = useMemo(() => {
        return data.filter(item => {
            // البحث
            const matchesSearch = !searchQuery ||
                item.itemCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.itemNameAr?.includes(searchQuery) ||
                item.categoryNameAr?.includes(searchQuery);

            // فلترة حسب الحالة
            const matchesStatus = filterStatus === 'all' || (() => {
                const { status } = getStockStatus(item.currentStock, item.minimumStock, item.maximumStock);
                return status === filterStatus;
            })();

            // فلترة حسب المستودع
            const matchesWarehouse = filterWarehouse === 'all' || item.warehouseId === filterWarehouse;

            return matchesSearch && matchesStatus && matchesWarehouse;
        });
    }, [data, searchQuery, filterStatus, filterWarehouse]);

    // أعمدة الجدول
    const columns = [
        {
            key: 'itemCode',
            label: 'كود الصنف',
            render: (value, row) => (
                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {value}
                </span>
            ),
        },
        {
            key: 'itemNameAr',
            label: 'اسم الصنف',
            render: (value) => (
                <span className="font-semibold">{value}</span>
            ),
        },
        {
            key: 'categoryNameAr',
            label: 'التصنيف',
            render: (value) => (
                <Badge variant="secondary">{value}</Badge>
            ),
        },
        {
            key: 'warehouseNameAr',
            label: 'المستودع',
        },
        {
            key: 'currentStock',
            label: 'الرصيد الحالي',
            render: (value, row) => (
                <StockLevelIndicator
                    current={value}
                    minimum={row.minimumStock}
                    maximum={row.maximumStock}
                />
            ),
        },
        {
            key: 'unitNameAr',
            label: 'الوحدة',
        },
        {
            key: 'lastMovementDate',
            label: 'آخر حركة',
            render: (value) => fmtDate(value),
        },
    ];

    // إضافة عمود الإجراءات إذا كان مطلوباً
    if (showActions) {
        columns.push({
            key: 'actions',
            label: 'الإجراءات',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <Link href={`/warehouse/items/${row.id}`}>
                        <Button variant="ghost" size="xs">
                            <ViewIcon className="w-4 h-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Print barcode logic
                        }}
                    >
                        <BarcodeIcon className="w-4 h-4" />
                    </Button>
                </div>
            ),
        });
    }

    // حساب الإحصائيات
    const stats = useMemo(() => {
        const total = filteredData.length;
        const critical = filteredData.filter(item => {
            const { status } = getStockStatus(item.currentStock, item.minimumStock, item.maximumStock);
            return status === 'critical' || status === 'out-of-stock';
        }).length;
        const low = filteredData.filter(item => {
            const { status } = getStockStatus(item.currentStock, item.minimumStock, item.maximumStock);
            return status === 'low';
        }).length;

        return { total, critical, low };
    }, [filteredData]);

    return (
        <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800 ${className}`}>
            {/* Header with search and filters */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="البحث بالكود أو الاسم أو التصنيف..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400"
                    >
                        <option value="all">كل الحالات</option>
                        <option value="critical">حرج</option>
                        <option value="low">منخفض</option>
                        <option value="normal">عادي</option>
                        <option value="excess">زائد</option>
                    </select>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">إجمالي:</span>
                        <Badge variant="info">{stats.total}</Badge>
                    </div>
                    {stats.critical > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">حرج:</span>
                            <Badge variant="danger">{stats.critical}</Badge>
                        </div>
                    )}
                    {stats.low > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">منخفض:</span>
                            <Badge variant="warning">{stats.low}</Badge>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={filteredData}
                loading={loading}
                emptyMessage="لا توجد أصناف في المخزون"
                onRowClick={onRowClick}
                rowClassName="hover:bg-gray-50 cursor-pointer"
            />
        </div>
    );
}

InventoryTable.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object),
    loading: PropTypes.bool,
    onRowClick: PropTypes.func,
    showActions: PropTypes.bool,
    className: PropTypes.string,
};

// Helper function
function getStockStatus(current, minimum, maximum) {
    if (current === 0) {
        return { status: 'out-of-stock' };
    }
    if (current <= minimum) {
        return { status: 'critical' };
    }
    if (current <= minimum * 1.2) {
        return { status: 'low' };
    }
    if (maximum && current >= maximum) {
        return { status: 'excess' };
    }
    return { status: 'normal' };
}

// Icons
function ViewIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
}

function BarcodeIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10M6 7v10M9 7v10M12 7v10M15 7v10M18 7v10M21 7v10" />
        </svg>
    );
}
