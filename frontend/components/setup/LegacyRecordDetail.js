import React, { useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { Modal, Badge, Button } from '../ui';

/**
 * LegacyRecordDetail - عرض تفاصيل سجل تاريخي واحد
 * يُفتح كنافذة منبثقة تعرض جميع حقول السجل (للقراءة فقط)
 */
const LegacyRecordDetail = memo(function LegacyRecordDetail({
    record,
    isOpen,
    onClose,
    darkMode = false,
}) {
    // تحليل بيانات JSON الإضافية
    const parsedJsonData = useMemo(() => {
        if (!record?.jsonData) return null;

        try {
            if (typeof record.jsonData === 'string') {
                return JSON.parse(record.jsonData);
            }
            if (typeof record.jsonData === 'object') {
                return record.jsonData;
            }
        } catch {
            return null;
        }
        return null;
    }, [record?.jsonData]);

    // تنسيق التاريخ
    const formatDate = useCallback((dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
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
        }) + ' ر.س';
    }, []);

    // الطباعة
    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    if (!record) return null;

    // تحديد شارة حالة التحقق
    const verificationBadge = record.verified
        ? { label: 'تم التحقق', variant: 'success' }
        : { label: 'لم يتم التحقق', variant: 'warning' };

    // تحديد شارة النظام المصدر
    const sourceLabel = record.sourceSystem || record.source || 'غير محدد';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={record.title || 'تفاصيل السجل'}
            subtitle="سجل من النظام السابق - للقراءة فقط"
            size="lg"
            footer={
                <div className="flex items-center gap-3 w-full justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={handlePrint}>
                            <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            طباعة
                        </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        إغلاق
                    </Button>
                </div>
            }
        >
            <div dir="rtl" className="space-y-6">
                {/* شريط التنبيه */}
                <div className={`
                    rounded-xl border p-3 flex items-center gap-2 text-xs
                    ${darkMode
                        ? 'bg-yellow-900/20 border-yellow-800/40 text-yellow-300'
                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                    }
                `}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>هذا السجل منقول من النظام السابق وللاطلاع فقط</span>
                </div>

                {/* الشارات العلوية */}
                <div className="flex flex-wrap gap-2">
                    <Badge variant="info" size="sm">
                        {sourceLabel}
                    </Badge>
                    <Badge variant={verificationBadge.variant} size="sm" dot>
                        {verificationBadge.label}
                    </Badge>
                    {record.recordType && (
                        <Badge variant="default" size="sm">
                            {record.recordType}
                        </Badge>
                    )}
                </div>

                {/* الحقول الأساسية */}
                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                    <h4 className={`text-sm font-bold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-900 dark:text-white'}`}>
                        المعلومات الأساسية
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FieldRow
                            label="الموظف/الكيان"
                            value={record.entityName}
                            darkMode={darkMode}
                        />
                        <FieldRow
                            label="التاريخ"
                            value={formatDate(record.date)}
                            darkMode={darkMode}
                        />
                        <FieldRow
                            label="نوع السجل"
                            value={record.recordType}
                            darkMode={darkMode}
                        />
                        <FieldRow
                            label="الحالة"
                            value={record.status}
                            darkMode={darkMode}
                        />
                        {(record.amount !== null && record.amount !== undefined) && (
                            <FieldRow
                                label="المبلغ"
                                value={formatAmount(record.amount)}
                                darkMode={darkMode}
                            />
                        )}
                        {record.title && (
                            <FieldRow
                                label="العنوان"
                                value={record.title}
                                darkMode={darkMode}
                                fullWidth
                            />
                        )}
                        {record.description && (
                            <FieldRow
                                label="الوصف"
                                value={record.description}
                                darkMode={darkMode}
                                fullWidth
                            />
                        )}
                    </div>
                </div>

                {/* معلومات الاستيراد */}
                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                    <h4 className={`text-sm font-bold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-900 dark:text-white'}`}>
                        معلومات الاستيراد
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FieldRow
                            label="النظام المصدر"
                            value={sourceLabel}
                            darkMode={darkMode}
                        />
                        {record.importDate && (
                            <FieldRow
                                label="تاريخ الاستيراد"
                                value={formatDate(record.importDate)}
                                darkMode={darkMode}
                            />
                        )}
                        {record.importBatchId && (
                            <FieldRow
                                label="رقم الدفعة"
                                value={record.importBatchId}
                                darkMode={darkMode}
                            />
                        )}
                        {record.importedBy && (
                            <FieldRow
                                label="استورد بواسطة"
                                value={record.importedBy}
                                darkMode={darkMode}
                            />
                        )}
                    </div>
                </div>

                {/* البيانات الإضافية (JSON) */}
                {parsedJsonData && Object.keys(parsedJsonData).length > 0 && (
                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                        <h4 className={`text-sm font-bold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-900 dark:text-white'}`}>
                            بيانات إضافية
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(parsedJsonData).map(([key, value]) => (
                                <FieldRow
                                    key={key}
                                    label={key}
                                    value={
                                        typeof value === 'object'
                                            ? JSON.stringify(value, null, 2)
                                            : String(value ?? '-')
                                    }
                                    darkMode={darkMode}
                                    fullWidth={typeof value === 'object'}
                                    mono={typeof value === 'object'}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
});

/**
 * FieldRow - صف حقل للقراءة فقط داخل التفاصيل
 */
const FieldRow = memo(function FieldRow({ label, value, darkMode = false, fullWidth = false, mono = false }) {
    return (
        <div className={fullWidth ? 'sm:col-span-2' : ''}>
            <dt className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {label}
            </dt>
            <dd className={`
                text-sm
                ${mono ? 'font-mono text-xs whitespace-pre-wrap break-all' : ''}
                ${darkMode ? 'text-gray-200' : 'text-gray-900 dark:text-white'}
            `}>
                {value || '-'}
            </dd>
        </div>
    );
});

FieldRow.displayName = 'FieldRow';

FieldRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    darkMode: PropTypes.bool,
    fullWidth: PropTypes.bool,
    mono: PropTypes.bool,
};

LegacyRecordDetail.displayName = 'LegacyRecordDetail';

LegacyRecordDetail.propTypes = {
    /** بيانات السجل */
    record: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        title: PropTypes.string,
        entityName: PropTypes.string,
        date: PropTypes.string,
        recordType: PropTypes.string,
        status: PropTypes.string,
        amount: PropTypes.number,
        description: PropTypes.string,
        sourceSystem: PropTypes.string,
        source: PropTypes.string,
        verified: PropTypes.bool,
        importDate: PropTypes.string,
        importBatchId: PropTypes.string,
        importedBy: PropTypes.string,
        jsonData: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    }),
    /** حالة فتح النافذة */
    isOpen: PropTypes.bool.isRequired,
    /** دالة الإغلاق */
    onClose: PropTypes.func.isRequired,
    /** الوضع الداكن */
    darkMode: PropTypes.bool,
};

export default LegacyRecordDetail;
