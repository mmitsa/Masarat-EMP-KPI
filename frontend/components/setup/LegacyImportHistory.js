import React, { useState, useEffect, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { Badge, Button, EmptyState, LoadingSpinner } from '../ui';

/**
 * LegacyImportHistory - سجل عمليات استيراد البيانات التاريخية
 * يعرض جميع دفعات الاستيراد لوحدة معينة مع إمكانية التوسيع لعرض التفاصيل
 */
const LegacyImportHistory = memo(function LegacyImportHistory({
    moduleType,
    darkMode = false,
}) {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedBatchId, setExpandedBatchId] = useState(null);

    // جلب البيانات
    const fetchBatches = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/admin/legacy-import?module=${encodeURIComponent(moduleType)}`);
            if (!response.ok) {
                throw new Error('فشل في جلب سجل الاستيراد');
            }
            const data = await response.json();
            setBatches(Array.isArray(data) ? data : data.batches || []);
        } catch (err) {
            setError(err.message || 'حدث خطأ أثناء جلب البيانات');
        } finally {
            setLoading(false);
        }
    }, [moduleType]);

    useEffect(() => {
        if (moduleType) {
            fetchBatches();
        }
    }, [moduleType, fetchBatches]);

    // تبديل التوسيع
    const toggleExpand = useCallback((batchId) => {
        setExpandedBatchId((prev) => (prev === batchId ? null : batchId));
    }, []);

    // تنسيق التاريخ
    const formatDate = useCallback((dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    }, []);

    // شارة الحالة
    const renderStatusBadge = useCallback((status) => {
        const statusMap = {
            completed: { label: 'مكتمل', variant: 'success' },
            failed: { label: 'فشل', variant: 'danger' },
            processing: { label: 'قيد المعالجة', variant: 'warning' },
            partial: { label: 'مكتمل جزئياً', variant: 'warning' },
        };

        const config = statusMap[status] || { label: status || '-', variant: 'default' };
        return (
            <Badge variant={config.variant} size="sm" dot>
                {config.label}
            </Badge>
        );
    }, []);

    // حالة التحميل
    if (loading) {
        return (
            <div dir="rtl" className="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    // حالة الخطأ
    if (error) {
        return (
            <div dir="rtl" className={`rounded-xl border p-6 text-center ${darkMode ? 'bg-red-900/10 border-red-800/30' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                <svg className="w-10 h-10 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-red-300' : 'text-red-800 dark:text-red-200'}`}>
                    {error}
                </p>
                <Button variant="outline" size="sm" onClick={fetchBatches}>
                    إعادة المحاولة
                </Button>
            </div>
        );
    }

    // حالة عدم وجود بيانات
    if (batches.length === 0) {
        return (
            <div dir="rtl">
                <EmptyState
                    icon={
                        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                    }
                    title="لا توجد عمليات استيراد سابقة"
                    description="لم يتم استيراد أي بيانات من الأنظمة السابقة لهذه الوحدة بعد"
                />
            </div>
        );
    }

    return (
        <div dir="rtl" className="space-y-3">
            {/* العنوان */}
            <div className="flex items-center justify-between">
                <h3 className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900 dark:text-white'}`}>
                    سجل عمليات الاستيراد
                </h3>
                <Button variant="ghost" size="xs" onClick={fetchBatches} aria-label="تحديث">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </Button>
            </div>

            {/* الجدول */}
            <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                <table className="w-full" role="grid" aria-label="سجل عمليات الاستيراد">
                    <thead>
                        <tr className={darkMode ? 'bg-gray-800/50' : 'bg-gray-50 dark:bg-gray-800'}>
                            <th scope="col" className={`px-3 py-3 text-right text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'} w-8`} aria-hidden="true"></th>
                            <th scope="col" className={`px-3 py-3 text-right text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>رقم الدفعة</th>
                            <th scope="col" className={`px-3 py-3 text-right text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>النظام المصدر</th>
                            <th scope="col" className={`px-3 py-3 text-right text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'} hidden sm:table-cell`}>التاريخ</th>
                            <th scope="col" className={`px-3 py-3 text-right text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>السجلات</th>
                            <th scope="col" className={`px-3 py-3 text-right text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>الحالة</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100 dark:divide-gray-800'}`}>
                        {batches.map((batch) => {
                            const isExpanded = expandedBatchId === batch.id;
                            return (
                                <React.Fragment key={batch.id}>
                                    {/* صف الدفعة */}
                                    <tr
                                        className={`
                                            transition-colors cursor-pointer
                                            ${isExpanded
                                                ? darkMode ? 'bg-gray-800/60' : 'bg-blue-50/50'
                                                : darkMode ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'
                                            }
                                        `}
                                        onClick={() => toggleExpand(batch.id)}
                                        tabIndex={0}
                                        role="row"
                                        aria-expanded={isExpanded}
                                        aria-label={`دفعة ${batch.batchId || batch.id}`}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') toggleExpand(batch.id);
                                        }}
                                    >
                                        {/* سهم التوسيع */}
                                        <td className="px-3 py-3">
                                            <svg
                                                className={`w-4 h-4 transition-transform duration-200 ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'} ${isExpanded ? 'rotate-90' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </td>

                                        {/* رقم الدفعة */}
                                        <td className={`px-3 py-3 text-sm font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                            {batch.batchId || batch.id}
                                        </td>

                                        {/* النظام المصدر */}
                                        <td className={`px-3 py-3 text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900 dark:text-white'}`}>
                                            {batch.sourceSystem || '-'}
                                        </td>

                                        {/* التاريخ */}
                                        <td className={`px-3 py-3 text-xs hidden sm:table-cell ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'} whitespace-nowrap`}>
                                            {formatDate(batch.importDate || batch.createdAt)}
                                        </td>

                                        {/* السجلات */}
                                        <td className={`px-3 py-3 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                            {(batch.recordCount || batch.totalRecords || 0).toLocaleString('ar-SA')}
                                        </td>

                                        {/* الحالة */}
                                        <td className="px-3 py-3">
                                            {renderStatusBadge(batch.status)}
                                        </td>
                                    </tr>

                                    {/* تفاصيل الدفعة (موسعة) */}
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={6} className="px-0 py-0">
                                                <BatchDetails batch={batch} darkMode={darkMode} formatDate={formatDate} />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

/**
 * BatchDetails - تفاصيل دفعة الاستيراد الموسعة
 */
const BatchDetails = memo(function BatchDetails({ batch, darkMode, formatDate }) {
    return (
        <div className={`
            px-6 py-4 border-t
            ${darkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50/50 border-gray-100 dark:border-gray-800'}
        `}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <DetailItem
                    label="نوع السجلات"
                    value={batch.recordType || '-'}
                    darkMode={darkMode}
                />
                <DetailItem
                    label="السجلات المستوردة"
                    value={(batch.importedCount || batch.successCount || 0).toLocaleString('ar-SA')}
                    darkMode={darkMode}
                />
                <DetailItem
                    label="السجلات الفاشلة"
                    value={(batch.failedCount || 0).toLocaleString('ar-SA')}
                    darkMode={darkMode}
                />
                <DetailItem
                    label="استورد بواسطة"
                    value={batch.importedBy || batch.createdBy || '-'}
                    darkMode={darkMode}
                />
                {batch.fileName && (
                    <DetailItem
                        label="اسم الملف"
                        value={batch.fileName}
                        darkMode={darkMode}
                    />
                )}
                {batch.completedAt && (
                    <DetailItem
                        label="وقت الانتهاء"
                        value={formatDate(batch.completedAt)}
                        darkMode={darkMode}
                    />
                )}
                {batch.notes && (
                    <div className="sm:col-span-4">
                        <DetailItem
                            label="ملاحظات"
                            value={batch.notes}
                            darkMode={darkMode}
                        />
                    </div>
                )}
                {batch.errorMessage && (
                    <div className="sm:col-span-4">
                        <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>رسالة الخطأ</p>
                        <p className={`text-xs font-mono ${darkMode ? 'text-red-300' : 'text-red-700 dark:text-red-300'}`}>{batch.errorMessage}</p>
                    </div>
                )}
            </div>
        </div>
    );
});

/**
 * DetailItem - عنصر تفاصيل فردي
 */
const DetailItem = memo(function DetailItem({ label, value, darkMode }) {
    return (
        <div>
            <p className={`text-xs font-medium mb-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {label}
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900 dark:text-white'}`}>
                {value}
            </p>
        </div>
    );
});

DetailItem.displayName = 'DetailItem';
DetailItem.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    darkMode: PropTypes.bool,
};

BatchDetails.displayName = 'BatchDetails';
BatchDetails.propTypes = {
    batch: PropTypes.object.isRequired,
    darkMode: PropTypes.bool,
    formatDate: PropTypes.func.isRequired,
};

LegacyImportHistory.displayName = 'LegacyImportHistory';

LegacyImportHistory.propTypes = {
    /** نوع الوحدة (hr, warehouse, movement, etc.) */
    moduleType: PropTypes.string.isRequired,
    /** الوضع الداكن */
    darkMode: PropTypes.bool,
};

export default LegacyImportHistory;
