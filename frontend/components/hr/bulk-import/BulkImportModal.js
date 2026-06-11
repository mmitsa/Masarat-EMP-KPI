import React, { useState, useRef } from 'react';
import { useToast } from '../../../context/NotificationContext';
import { useOrganizationStructure } from '../../../context/OrganizationStructureContext';
import { generateTemplate, parseImportFile, validateImportRows } from '../../../lib/hr/excelImportExport';
import { buildEmployeePayload, getFullNameAr, getFullNameEn } from '../../../lib/hr/employeeFormDefaults';
import api from '../../../lib/api';

export default function BulkImportModal({ isOpen, onClose, employees, onImportComplete }) {
    const toast = useToast();
    const { departments: orgDepartments } = useOrganizationStructure();
    const fileInputRef = useRef(null);

    const [step, setStep] = useState('upload'); // upload | validating | results | importing | done
    const [file, setFile] = useState(null);
    const [validationResult, setValidationResult] = useState(null);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0, failed: 0 });

    if (!isOpen) return null;

    const handleDownloadTemplate = async () => {
        try {
            const buffer = await generateTemplate();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'masarat_employee_import_template.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('تم تحميل القالب بنجاح');
        } catch (error) {
            console.error('Template generation error:', error);
            toast.error('فشل في إنشاء القالب');
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
        ];
        if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.xlsx?$/i)) {
            toast.warning('يرجى اختيار ملف Excel (.xlsx)');
            return;
        }

        setFile(selectedFile);
    };

    const handleValidate = async () => {
        if (!file) return;
        setStep('validating');

        try {
            const rows = await parseImportFile(file);
            if (rows.length === 0) {
                toast.warning('الملف فارغ أو لا يحتوي على بيانات');
                setStep('upload');
                return;
            }

            const result = validateImportRows(rows, employees, orgDepartments);
            setValidationResult(result);
            setStep('results');
        } catch (error) {
            console.error('Parse error:', error);
            toast.error(`فشل في قراءة الملف: ${error.message}`);
            setStep('upload');
        }
    };

    const handleImport = async () => {
        const validRecords = validationResult.records.filter(r => r.isValid);
        if (validRecords.length === 0) {
            toast.warning('لا توجد سجلات صالحة للاستيراد');
            return;
        }

        setStep('importing');
        setImportProgress({ current: 0, total: validRecords.length, failed: 0 });

        // بناء payloads لجميع السجلات الصالحة
        const payloads = validRecords.map(record => {
            const payload = buildEmployeePayload({
                ...record.data,
                departmentId: record.data._resolvedDepartmentId || record.data.departmentId,
                status: 'Active',
            });
            payload.arName = getFullNameAr(record.data);
            payload.enName = getFullNameEn(record.data) || payload.arName;
            return payload;
        });

        let failedCount = 0;

        // ══ محاولة 1: Bulk Import API مباشر (sqlcmd - مضمون العمل) ══
        try {
            const bulkRes = await fetch('/api/hr/employees/bulk-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employees: payloads }),
            });
            const bulkData = await bulkRes.json();

            if (bulkRes.ok || bulkRes.status === 207) {
                failedCount = bulkData.data?.failed || 0;
                setImportProgress({
                    current: payloads.length,
                    total: payloads.length,
                    failed: failedCount,
                });
                setStep('done');
                onImportComplete?.();
                return;
            }
            // إذا فشل الـ endpoint، ننتقل للطريقة البديلة
            console.warn('[BulkImport] bulk endpoint failed:', bulkData.error);
        } catch (bulkErr) {
            console.warn('[BulkImport] bulk endpoint unreachable:', bulkErr.message);
        }

        // ══ محاولة 2: Fallback - إدراج فردي عبر api.hr.createEmployee ══
        const BATCH_SIZE = 5;
        for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
            const batch = payloads.slice(i, i + BATCH_SIZE);
            const promises = batch.map(async (payload) => {
                try {
                    await api.hr.createEmployee(payload);
                } catch (err) {
                    failedCount++;
                    console.error(`Failed to import ${payload.nationalId}:`, err);
                }
            });

            await Promise.all(promises);
            setImportProgress({ current: Math.min(i + BATCH_SIZE, payloads.length), total: payloads.length, failed: failedCount });
        }

        setImportProgress(prev => ({ ...prev, failed: failedCount }));
        setStep('done');
        onImportComplete?.();
    };

    const handleReset = () => {
        setStep('upload');
        setFile(null);
        setValidationResult(null);
        setImportProgress({ current: 0, total: 0, failed: 0 });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const progressPercent = importProgress.total > 0
        ? Math.round((importProgress.current / importProgress.total) * 100)
        : 0;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">استيراد موظفين من Excel</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">إضافة مجموعة موظفين دفعة واحدة</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* مرحلة الرفع */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            {/* تحميل القالب */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                                <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">الخطوة 1: تحميل القالب</h4>
                                <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">حمّل قالب Excel، املأ بيانات الموظفين، ثم ارفع الملف</p>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition font-medium flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    تحميل قالب الاستيراد
                                </button>
                                <p className="text-xs text-blue-500 mt-2">الأعمدة ذات الخلفية الحمراء إلزامية</p>
                            </div>

                            {/* رفع الملف */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border-2 border-dashed border-gray-300 dark:border-gray-600">
                                <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-2">الخطوة 2: رفع الملف</h4>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                                />
                                {file && (
                                    <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                    </p>
                                )}
                            </div>

                            {file && (
                                <button
                                    onClick={handleValidate}
                                    className="w-full py-3 bg-green-600 text-white hover:bg-green-700 rounded-xl transition font-bold text-lg flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    بدء التحقق من البيانات
                                </button>
                            )}
                        </div>
                    )}

                    {/* مرحلة التحليل */}
                    {step === 'validating' && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-lg font-bold text-gray-700 dark:text-gray-200">جاري تحليل البيانات...</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">يرجى الانتظار</p>
                        </div>
                    )}

                    {/* مرحلة النتائج */}
                    {step === 'results' && validationResult && (
                        <div className="space-y-5">
                            {/* ملخص */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{validationResult.total}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400">إجمالي السجلات</p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{validationResult.valid}</p>
                                    <p className="text-xs text-green-600 dark:text-green-400">صالح للاستيراد</p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{validationResult.invalid}</p>
                                    <p className="text-xs text-red-600 dark:text-red-400">يحتاج تصحيح</p>
                                </div>
                            </div>

                            {/* نسبة التطابق الإجمالية */}
                            {validationResult.records.length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">متوسط التطابق مع التزام</span>
                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                            {Math.round(validationResult.records.reduce((sum, r) => sum + r.compliance, 0) / validationResult.records.length)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all"
                                            style={{ width: `${Math.round(validationResult.records.reduce((sum, r) => sum + r.compliance, 0) / validationResult.records.length)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* الأخطاء */}
                            {validationResult.errors.length > 0 && (
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 max-h-48 overflow-y-auto">
                                    <h4 className="font-bold text-red-800 dark:text-red-200 mb-2">الأخطاء ({validationResult.errors.length})</h4>
                                    <div className="space-y-1.5">
                                        {validationResult.errors.map((err, i) => (
                                            <div key={i} className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                                                <span className="text-red-500 mt-0.5">&#x2022;</span>
                                                <span>سطر {err.rowNumber} — <strong>{err.recordName}</strong>: {err.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* التحذيرات */}
                            {validationResult.warnings.length > 0 && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 max-h-32 overflow-y-auto">
                                    <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2">التحذيرات ({validationResult.warnings.length})</h4>
                                    <div className="space-y-1.5">
                                        {validationResult.warnings.map((warn, i) => (
                                            <div key={i} className="text-sm text-amber-700 flex items-start gap-2">
                                                <span className="text-amber-500 mt-0.5">&#x26A0;</span>
                                                <span>سطر {warn.rowNumber}: {warn.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* أزرار الإجراءات */}
                            <div className="flex items-center gap-3">
                                <button onClick={handleReset}
                                    className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 rounded-xl transition font-medium">
                                    رفع ملف آخر
                                </button>
                                {validationResult.valid > 0 && (
                                    <button onClick={handleImport}
                                        className="flex-1 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-xl transition font-bold flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        استيراد {validationResult.valid} سجل صحيح
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* مرحلة الاستيراد */}
                    {step === 'importing' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-full max-w-md mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">جاري الاستيراد...</span>
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{importProgress.current}/{importProgress.total}</span>
                                </div>
                                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-l from-blue-600 to-blue-400 rounded-full transition-all duration-300"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">{progressPercent}%</p>
                            </div>
                            {importProgress.failed > 0 && (
                                <p className="text-sm text-red-500">{importProgress.failed} سجل فشل في الاستيراد</p>
                            )}
                        </div>
                    )}

                    {/* مرحلة الانتهاء */}
                    {step === 'done' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">تم الاستيراد بنجاح</h3>
                            <div className="text-center space-y-1">
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    تم استيراد <strong>{importProgress.current - importProgress.failed}</strong> موظف بنجاح
                                </p>
                                {importProgress.failed > 0 && (
                                    <p className="text-sm text-red-500">فشل استيراد <strong>{importProgress.failed}</strong> سجل</p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="mt-6 px-8 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition font-medium"
                            >
                                إغلاق
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
