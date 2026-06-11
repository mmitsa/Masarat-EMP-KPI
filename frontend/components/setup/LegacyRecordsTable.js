import React, { useState, useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { Badge, EmptyState, Select } from '../ui';

/**
 * ألوان أنواع السجلات
 */
const RECORD_TYPE_COLORS = {
    'إجازة': { variant: 'success', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    'ترقية': { variant: 'primary', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    'علاوة': { variant: 'secondary', bg: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    'انتداب': { variant: 'warning', bg: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    'أصل': { variant: 'info', bg: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
    'فاتورة': { variant: 'info', bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
};

const PAGE_SIZE = 10;

/**
 * LegacyRecordsTable - جدول السجلات التاريخية (للقراءة فقط)
 * يعرض بيانات منقولة من الأنظمة السابقة مع إمكانية البحث والفلترة
 */
const LegacyRecordsTable = memo(function LegacyRecordsTable({
    records = [],
    recordTypes = [],
    moduleType,
    darkMode = false,
    onRecordClick,
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // فلترة السجلات
    const filteredRecords = useMemo(() => {
        if (!Array.isArray(records)) return [];

        return records.filter((record) => {
            if (!record) return false;

            // فلتر نوع السجل
            if (selectedType && record.recordType !== selectedType) return false;

            // فلتر البحث
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const nameMatch = (record.entityName || '').toLowerCase().includes(term);
                const titleMatch = (record.title || '').toLowerCase().includes(term);
                if (!nameMatch && !titleMatch) return false;
            }

            return true;
        });
    }, [records, searchTerm, selectedType]);

    // حساب الصفحات
    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
    const paginatedRecords = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredRecords.slice(start, start + PAGE_SIZE);
    }, [filteredRecords, currentPage]);

    // إعادة تعيين الصفحة عند تغيير الفلاتر
    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    }, []);

    const handleTypeChange = useCallback((e) => {
        setSelectedType(e.target.value);
        setCurrentPage(1);
    }, []);

    // خيارات الأنواع
    const typeOptions = useMemo(() => {
        const types = recordTypes.length > 0
            ? recordTypes
            : [...new Set(records.filter(r => r?.recordType).map(r => r.recordType))];
        return types.map((t) => ({ value: t, label: t }));
    }, [recordTypes, records]);

    // تنسيق التاريخ
    const formatDate = useCallback((dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return dateStr;
        }
    }, []);

    // تنسيق المبلغ
    const formatAmount = useCallback((amount) => {
        if (amount === null || amount === undefined) return '-';
        return Number(amount).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }, []);

    // شارة نوع السجل
    const renderTypeBadge = useCallback((type) => {
        const colorConfig = RECORD_TYPE_COLORS[type];
        if (colorConfig) {
            return (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorConfig.bg}`}>
                    {type}
                </span>
            );
        }
        return <Badge variant="default" size="sm">{type || '-'}</Badge>;
    }, []);

    // هل يوجد عمود المبلغ
    const hasAmountColumn = useMemo(() => {
        return records.some((r) => r?.amount !== null && r?.amount !== undefined);
    }, [records]);

    return (
        <div dir="rtl" className="space-y-4">
            {/* شريط الفلاتر */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* بحث */}
                <div className="relative flex-1">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="بحث بالاسم أو العنوان..."
                        aria-label="بحث في السجلات التاريخية"
                        className={`
                            w-full pr-10 pl-4 py-2.5 rounded-lg border text-sm transition-colors
                            focus:outline-none focus:ring-2
                            ${darkMode
                                ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400'
                            }
                        `}
                    />
                </div>

                {/* فلتر النوع */}
                <div className="w-full sm:w-48">
                    <select
                        value={selectedType}
                        onChange={handleTypeChange}
                        aria-label="فلتر نوع السجل"
                        className={`
                            w-full px-4 py-2.5 rounded-lg border text-sm transition-colors appearance-none
                            focus:outline-none focus:ring-2
                            ${darkMode
                                ? 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400'
                            }
                        `}
                    >
                        <option value="">جميع الأنواع</option>
                        {typeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* عدد النتائج */}
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`} aria-live="polite">
                {filteredRecords.length === 0
                    ? 'لا توجد نتائج'
                    : `${filteredRecords.length.toLocaleString('ar-SA')} سجل`
                }
            </p>

            {/* حالة عدم وجود بيانات */}
            {filteredRecords.length === 0 ? (
                <EmptyState
                    icon={
                        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    }
                    title="لا توجد سجلات تاريخية"
                    description={searchTerm || selectedType ? 'جرّب تغيير معايير البحث أو الفلترة' : 'لم يتم استيراد بيانات من الأنظمة السابقة بعد'}
                />
            ) : (
                <>
                    {/* الجدول */}
                    <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                        <div className="overflow-x-auto">
                            <table className="w-full" role="grid" aria-label="جدول السجلات التاريخية">
                                <thead>
                                    <tr className={darkMode ? 'bg-gray-800/50' : 'bg-gray-50 dark:bg-gray-800'}>
                                        <th scope="col" className={`px-3 py-3 text-right text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'} w-10`}>#</th>
                                        <th scope="col" className={`px-3 py-3 text-right text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>التاريخ</th>
                                        <th scope="col" className={`px-3 py-3 text-right text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>النوع</th>
                                        <th scope="col" className={`px-3 py-3 text-right text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>الموظف/الكيان</th>
                                        <th scope="col" className={`px-3 py-3 text-right text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'} hidden md:table-cell`}>العنوان</th>
                                        {hasAmountColumn && (
                                            <th scope="col" className={`px-3 py-3 text-right text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'} hidden lg:table-cell`}>المبلغ</th>
                                        )}
                                        <th scope="col" className={`px-3 py-3 text-right text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100 dark:divide-gray-800'}`}>
                                    {paginatedRecords.map((record, index) => (
                                        <tr
                                            key={record.id || index}
                                            className={`
                                                transition-colors cursor-pointer
                                                ${darkMode
                                                    ? 'hover:bg-gray-800/40'
                                                    : 'hover:bg-gray-50'
                                                }
                                            `}
                                            onClick={() => onRecordClick?.(record)}
                                            tabIndex={0}
                                            role="row"
                                            aria-label={`سجل ${record.title || record.entityName || ''}`}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') onRecordClick?.(record);
                                            }}
                                        >
                                            {/* رقم الصف */}
                                            <td className={`px-3 py-3 text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-amber-500 flex-shrink-0" aria-hidden="true" title="للقراءة فقط">
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                    <span>{(currentPage - 1) * PAGE_SIZE + index + 1}</span>
                                                </div>
                                            </td>

                                            {/* التاريخ */}
                                            <td className={`px-3 py-3 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'} whitespace-nowrap`}>
                                                {formatDate(record.date)}
                                            </td>

                                            {/* النوع */}
                                            <td className="px-3 py-3">
                                                {renderTypeBadge(record.recordType)}
                                            </td>

                                            {/* الموظف/الكيان */}
                                            <td className={`px-3 py-3 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900 dark:text-white'}`}>
                                                <span className="truncate block max-w-[180px]">{record.entityName || '-'}</span>
                                            </td>

                                            {/* العنوان */}
                                            <td className={`px-3 py-3 text-xs hidden md:table-cell ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                                                <span className="truncate block max-w-[200px]">{record.title || '-'}</span>
                                            </td>

                                            {/* المبلغ */}
                                            {hasAmountColumn && (
                                                <td className={`px-3 py-3 text-xs hidden lg:table-cell ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'} whitespace-nowrap font-mono`}>
                                                    {formatAmount(record.amount)}
                                                </td>
                                            )}

                                            {/* الحالة */}
                                            <td className="px-3 py-3">
                                                <Badge
                                                    variant={
                                                        record.status === 'مكتمل' || record.status === 'completed' ? 'success' :
                                                        record.status === 'ملغي' || record.status === 'cancelled' ? 'danger' :
                                                        record.status === 'قيد التنفيذ' || record.status === 'in_progress' ? 'info' :
                                                        record.status === 'معلق' || record.status === 'pending' ? 'warning' :
                                                        'default'
                                                    }
                                                    size="sm"
                                                >
                                                    {record.status || '-'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ترقيم الصفحات */}
                    {totalPages > 1 && (
                        <nav
                            className={`flex flex-col sm:flex-row items-center justify-between gap-2 px-2 py-3`}
                            aria-label="التنقل بين صفحات السجلات"
                        >
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`} aria-live="polite">
                                عرض {((currentPage - 1) * PAGE_SIZE + 1).toLocaleString('ar-SA')} - {Math.min(currentPage * PAGE_SIZE, filteredRecords.length).toLocaleString('ar-SA')} من {filteredRecords.length.toLocaleString('ar-SA')}
                            </p>
                            <div className="flex items-center gap-1">
                                {/* الصفحة الأخيرة (RTL) */}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400'}`}
                                    aria-label="الصفحة الأخيرة"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>
                                {/* التالي */}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400'}`}
                                    aria-label="الصفحة التالية"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <span className={`px-3 py-1 text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`} aria-current="page">
                                    {currentPage}/{totalPages}
                                </span>
                                {/* السابق */}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400'}`}
                                    aria-label="الصفحة السابقة"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                {/* الصفحة الأولى (RTL) */}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400'}`}
                                    aria-label="الصفحة الأولى"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </nav>
                    )}
                </>
            )}
        </div>
    );
});

LegacyRecordsTable.displayName = 'LegacyRecordsTable';

LegacyRecordsTable.propTypes = {
    /** مصفوفة السجلات التاريخية */
    records: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        date: PropTypes.string,
        recordType: PropTypes.string,
        entityName: PropTypes.string,
        title: PropTypes.string,
        amount: PropTypes.number,
        status: PropTypes.string,
    })),
    /** أنواع السجلات المتاحة للفلترة */
    recordTypes: PropTypes.arrayOf(PropTypes.string),
    /** نوع الوحدة (hr, warehouse, movement, etc.) */
    moduleType: PropTypes.string,
    /** الوضع الداكن */
    darkMode: PropTypes.bool,
    /** دالة النقر على سجل */
    onRecordClick: PropTypes.func,
};

export default LegacyRecordsTable;
