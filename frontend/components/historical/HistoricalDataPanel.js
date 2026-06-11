import React, { useState, useMemo, useCallback, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import { DataTable, Badge, Button, EmptyState } from '../ui';
import LegacyDataBanner from '../setup/LegacyDataBanner';
import LegacyRecordDetail from '../setup/LegacyRecordDetail';
import HistoricalFilterBar from './HistoricalFilterBar';
import {
    getHistoricalScreenConfig,
    STATUS_OPTIONS,
    generateMockData,
} from '../../lib/historical-config';
import { exportToExcel, exportToPDF, printElement } from '../../lib/exportUtils';

/**
 * HistoricalDataPanel - لوحة البيانات التاريخية
 * مكون قابل للتضمين في أي شاشة كتاب "البيانات التاريخية"
 *
 * @param {string} screenId - معرف الشاشة (مثل: hr-leaves)
 * @param {string} [title] - عنوان مخصص (اختياري، يؤخذ من التكوين)
 * @param {array} [data] - البيانات (اختياري، يستخدم بيانات تجريبية إن لم يُحدد)
 * @param {boolean} [showEmployeeLink] - ربط اسم الموظف بالملف الشخصي
 * @param {function} [onEmployeeClick] - callback عند الضغط على اسم الموظف
 */
const HistoricalDataPanel = memo(function HistoricalDataPanel({
    screenId,
    title: customTitle,
    data: externalData,
    showEmployeeLink: customShowEmployeeLink,
    onEmployeeClick,
}) {
    // التكوين من الملف المركزي
    const config = useMemo(() => getHistoricalScreenConfig(screenId), [screenId]);

    // حالات الفلترة
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedRecord, setSelectedRecord] = useState(null);

    // مرجع الجدول للطباعة
    const tableRef = useRef(null);

    // البيانات (خارجية أو تجريبية)
    const rawData = useMemo(() => {
        if (externalData) return externalData;
        return generateMockData(screenId, 20);
    }, [externalData, screenId]);

    // البيانات المفلترة
    const filteredData = useMemo(() => {
        let result = [...rawData];

        // فلتر البحث
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter((row) =>
                Object.values(row).some((val) =>
                    val != null && String(val).toLowerCase().includes(q)
                )
            );
        }

        // فلتر التاريخ (من)
        if (dateFrom) {
            result = result.filter((row) => {
                const d = row.date || row.startDate || row.effectiveDate || row.invoiceDate;
                return d && d >= dateFrom;
            });
        }

        // فلتر التاريخ (إلى)
        if (dateTo) {
            result = result.filter((row) => {
                const d = row.date || row.endDate || row.effectiveDate || row.invoiceDate;
                return d && d <= dateTo;
            });
        }

        // فلتر الحالة
        if (statusFilter) {
            const statusMap = {
                completed: 'مكتمل',
                approved: 'معتمد',
                pending: 'معلق',
                rejected: 'مرفوض',
                cancelled: 'ملغي',
            };
            const target = statusMap[statusFilter];
            if (target) {
                result = result.filter((row) => row.status === target);
            }
        }

        return result;
    }, [rawData, search, dateFrom, dateTo, statusFilter]);

    // هل توجد فلاتر نشطة؟
    const hasActiveFilters = search || dateFrom || dateTo || statusFilter;

    // مسح الفلاتر
    const clearFilters = useCallback(() => {
        setSearch('');
        setDateFrom('');
        setDateTo('');
        setStatusFilter('');
    }, []);

    // عرض التفاصيل
    const handleRowClick = useCallback((row) => {
        setSelectedRecord(row);
    }, []);

    // إغلاق مودال التفاصيل
    const handleCloseDetail = useCallback(() => {
        setSelectedRecord(null);
    }, []);

    // خصائص الشاشة
    const showEmployeeLink = customShowEmployeeLink ?? config?.showEmployeeLink ?? false;
    const panelTitle = customTitle || config?.title || 'البيانات التاريخية';
    const sourceSystem = config?.sourceSystem || 'النظام السابق';
    const exportFilename = config?.exportFilename || 'historical-data';

    // التصدير إلى Excel
    const handleExportExcel = useCallback(() => {
        if (!config?.columns) return;
        const exportColumns = config.columns.map((col) => ({
            key: col.key,
            header: col.header,
            type: col.type,
            width: 120,
            render: col.render,
        }));
        exportToExcel(filteredData, exportColumns, exportFilename, {
            title: panelTitle,
            subtitle: `المصدر: ${sourceSystem}`,
            sheetName: 'البيانات التاريخية',
        });
    }, [config, filteredData, exportFilename, panelTitle, sourceSystem]);

    // الطباعة
    const handlePrint = useCallback(() => {
        if (!tableRef.current) return;
        printElement(tableRef.current, {
            title: panelTitle,
            subtitle: `المصدر: ${sourceSystem} | عدد السجلات: ${filteredData.length}`,
        });
    }, [panelTitle, sourceSystem, filteredData.length]);

    // التصدير PDF
    const handleExportPDF = useCallback(() => {
        if (!tableRef.current) return;
        exportToPDF(tableRef.current, exportFilename, {
            title: panelTitle,
            subtitle: `المصدر: ${sourceSystem}`,
        });
    }, [panelTitle, sourceSystem, exportFilename]);

    // إذا لم يوجد تكوين
    if (!config) {
        return (
            <EmptyState
                message={`لم يتم العثور على تكوين للشاشة: ${screenId}`}
                icon={
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
            />
        );
    }

    // بناء أعمدة الجدول مع عمود الشارة وأيقونة العرض
    const tableColumns = useMemo(() => {
        const cols = [];

        // عمود رقم الصف
        cols.push({
            key: '_index',
            header: '#',
            render: (_, __, idx) => idx + 1,
            width: 50,
            align: 'center',
        });

        // أعمدة التكوين
        config.columns.forEach((col) => {
            const column = {
                key: col.key,
                header: col.header,
                sortable: col.sortable,
            };

            // اسم الموظف قابل للنقر
            if (col.key === 'entityName' && showEmployeeLink) {
                column.render = (value, row) => (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEmployeeClick?.(row);
                        }}
                        className="text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] hover:underline font-medium text-right"
                    >
                        {value || '-'}
                    </button>
                );
            } else if (col.render) {
                column.render = col.render;
            }

            cols.push(column);
        });

        // عمود النوع (بيان تاريخي)
        cols.push({
            key: '_legacy_badge',
            header: 'النوع',
            render: () => (
                <Badge variant="warning" size="sm">
                    بيان تاريخي
                </Badge>
            ),
            width: 110,
        });

        // عمود التفاصيل
        cols.push({
            key: '_actions',
            header: '',
            render: (_, row) => (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(row);
                    }}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--color-primary-500)] transition-colors"
                    title="عرض التفاصيل"
                    aria-label="عرض التفاصيل"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>
            ),
            width: 50,
        });

        return cols;
    }, [config.columns, showEmployeeLink, onEmployeeClick, handleRowClick]);

    return (
        <div dir="rtl" className="space-y-4">
            {/* بانر التنبيه */}
            <LegacyDataBanner
                sourceSystem={sourceSystem}
                importDate="2024-06-15"
                recordCount={rawData.length}
            />

            {/* شريط الفلاتر + أزرار الإجراءات */}
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                <div className="flex-1">
                    <HistoricalFilterBar
                        searchValue={search}
                        onSearchChange={setSearch}
                        dateFrom={dateFrom}
                        onDateFromChange={setDateFrom}
                        dateTo={dateTo}
                        onDateToChange={setDateTo}
                        statusValue={statusFilter}
                        onStatusChange={setStatusFilter}
                        statusOptions={STATUS_OPTIONS}
                        onClearFilters={clearFilters}
                        hasActiveFilters={!!hasActiveFilters}
                    />
                </div>

                {/* أزرار التصدير والطباعة */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={handlePrint}>
                        <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        طباعة
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleExportExcel}>
                        <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Excel
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleExportPDF}>
                        <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        PDF
                    </Button>
                </div>
            </div>

            {/* عداد النتائج */}
            {hasActiveFilters && (
                <div className="text-xs text-[var(--text-tertiary)]">
                    عرض {filteredData.length} من {rawData.length} سجل
                </div>
            )}

            {/* الجدول */}
            <div ref={tableRef}>
                <DataTable
                    columns={tableColumns}
                    data={filteredData}
                    emptyMessage="لا توجد بيانات تاريخية لهذه الشاشة"
                    onRowClick={handleRowClick}
                    pagination
                    pageSize={10}
                    sortable
                />
            </div>

            {/* مودال تفاصيل السجل */}
            <LegacyRecordDetail
                record={selectedRecord}
                isOpen={!!selectedRecord}
                onClose={handleCloseDetail}
            />
        </div>
    );
});

HistoricalDataPanel.displayName = 'HistoricalDataPanel';

HistoricalDataPanel.propTypes = {
    /** معرف الشاشة (مثل: hr-leaves) */
    screenId: PropTypes.string.isRequired,
    /** عنوان مخصص */
    title: PropTypes.string,
    /** البيانات (اختياري - يستخدم بيانات تجريبية إن لم يُحدد) */
    data: PropTypes.array,
    /** ربط اسم الموظف بالملف الشخصي */
    showEmployeeLink: PropTypes.bool,
    /** callback عند الضغط على اسم الموظف */
    onEmployeeClick: PropTypes.func,
};

export default HistoricalDataPanel;
