import React, { useState, useRef, useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Badge, Input, Select } from '../ui';

/**
 * أنواع السجلات حسب الوحدة
 */
const RECORD_TYPES_BY_MODULE = {
    hr: [
        { value: 'إجازة', label: 'إجازة' },
        { value: 'ترقية', label: 'ترقية' },
        { value: 'علاوة', label: 'علاوة' },
        { value: 'انتداب', label: 'انتداب' },
        { value: 'تقييم', label: 'تقييم أداء' },
        { value: 'تدريب', label: 'تدريب' },
        { value: 'جزاء', label: 'جزاء' },
    ],
    warehouse: [
        { value: 'أصل', label: 'أصل ثابت' },
        { value: 'مخزون', label: 'مخزون' },
        { value: 'استلام', label: 'استلام' },
        { value: 'صرف', label: 'صرف' },
    ],
    movement: [
        { value: 'رحلة', label: 'رحلة' },
        { value: 'صيانة', label: 'صيانة مركبة' },
        { value: 'وقود', label: 'وقود' },
    ],
    archiving: [
        { value: 'مستند', label: 'مستند' },
        { value: 'معاملة', label: 'معاملة' },
    ],
    sadad: [
        { value: 'فاتورة', label: 'فاتورة' },
        { value: 'دفعة', label: 'دفعة' },
        { value: 'مطالبة', label: 'مطالبة' },
    ],
    epm: [
        { value: 'تقييم', label: 'تقييم' },
        { value: 'هدف', label: 'هدف' },
    ],
};

/**
 * الملفات المقبولة
 */
const ACCEPTED_FILE_TYPES = '.xlsx,.csv,.json';
const ACCEPTED_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/json',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * عناوين الخطوات
 */
const STEPS = [
    { id: 1, title: 'اختيار المصدر', icon: '1' },
    { id: 2, title: 'رفع الملف', icon: '2' },
    { id: 3, title: 'معاينة البيانات', icon: '3' },
    { id: 4, title: 'تأكيد الاستيراد', icon: '4' },
    { id: 5, title: 'النتيجة', icon: '5' },
];

/**
 * LegacyImportWizard - معالج استيراد البيانات التاريخية
 * معالج متعدد الخطوات لاستيراد بيانات من الأنظمة السابقة
 */
const LegacyImportWizard = memo(function LegacyImportWizard({
    moduleType = 'hr',
    isOpen,
    onClose,
    onImportComplete,
    darkMode = false,
}) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    // بيانات الخطوة 1
    const [sourceSystem, setSourceSystem] = useState('');
    const [recordType, setRecordType] = useState('');

    // بيانات الخطوة 2
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileError, setFileError] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // بيانات الخطوة 3
    const [previewData, setPreviewData] = useState(null);
    const [validationSummary, setValidationSummary] = useState(null);

    // بيانات الخطوة 5
    const [importResult, setImportResult] = useState(null);

    // أنواع السجلات المتاحة للوحدة
    const recordTypeOptions = useMemo(() => {
        return RECORD_TYPES_BY_MODULE[moduleType] || [];
    }, [moduleType]);

    // إعادة تعيين المعالج
    const resetWizard = useCallback(() => {
        setCurrentStep(1);
        setSourceSystem('');
        setRecordType('');
        setSelectedFile(null);
        setFileError('');
        setPreviewData(null);
        setValidationSummary(null);
        setImportResult(null);
        setLoading(false);
        setIsDragging(false);
    }, []);

    // إغلاق المعالج
    const handleClose = useCallback(() => {
        resetWizard();
        onClose?.();
    }, [resetWizard, onClose]);

    // التحقق من الملف
    const validateFile = useCallback((file) => {
        if (!file) return 'يرجى اختيار ملف';

        const extension = file.name.split('.').pop()?.toLowerCase();
        const isValidType = ACCEPTED_MIME_TYPES.includes(file.type) || ['xlsx', 'csv', 'json'].includes(extension);

        if (!isValidType) {
            return 'نوع الملف غير مدعوم. الأنواع المقبولة: .xlsx، .csv، .json';
        }

        if (file.size > MAX_FILE_SIZE) {
            return 'حجم الملف يتجاوز الحد الأقصى (10 ميجابايت)';
        }

        return null;
    }, []);

    // معالجة اختيار الملف
    const handleFileSelect = useCallback((file) => {
        const error = validateFile(file);
        if (error) {
            setFileError(error);
            setSelectedFile(null);
            return;
        }
        setFileError('');
        setSelectedFile(file);
    }, [validateFile]);

    const handleFileInputChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    // السحب والإفلات
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer?.files?.[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    // تنسيق حجم الملف
    const formatFileSize = useCallback((bytes) => {
        if (!bytes) return '0';
        if (bytes < 1024) return bytes + ' بايت';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' ك.ب';
        return (bytes / (1024 * 1024)).toFixed(2) + ' م.ب';
    }, []);

    // التالي
    const handleNext = useCallback(async () => {
        if (currentStep === 2 && selectedFile) {
            // الانتقال للخطوة 3 - المعاينة والتحقق
            setLoading(true);
            try {
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('sourceSystem', sourceSystem);
                formData.append('recordType', recordType);
                formData.append('module', moduleType);

                const response = await fetch('/api/admin/legacy-import/validate', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('فشل في التحقق من البيانات');
                }

                const result = await response.json();
                setPreviewData(result.preview || []);
                setValidationSummary(result.summary || { valid: 0, invalid: 0, total: 0 });
                setCurrentStep(3);
            } catch (err) {
                setFileError(err.message || 'حدث خطأ أثناء التحقق من البيانات');
            } finally {
                setLoading(false);
            }
        } else if (currentStep === 3) {
            setCurrentStep(4);
        } else if (currentStep === 4) {
            // تنفيذ الاستيراد
            setLoading(true);
            try {
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('sourceSystem', sourceSystem);
                formData.append('recordType', recordType);
                formData.append('module', moduleType);

                const response = await fetch('/api/admin/legacy-import', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('فشل في استيراد البيانات');
                }

                const result = await response.json();
                setImportResult({
                    success: true,
                    imported: result.imported || 0,
                    failed: result.failed || 0,
                    batchId: result.batchId,
                });
                setCurrentStep(5);
                onImportComplete?.(result);
            } catch (err) {
                setImportResult({
                    success: false,
                    error: err.message || 'حدث خطأ أثناء الاستيراد',
                });
                setCurrentStep(5);
            } finally {
                setLoading(false);
            }
        } else {
            setCurrentStep((s) => Math.min(5, s + 1));
        }
    }, [currentStep, selectedFile, sourceSystem, recordType, moduleType, onImportComplete]);

    // السابق
    const handleBack = useCallback(() => {
        setCurrentStep((s) => Math.max(1, s - 1));
    }, []);

    // هل يمكن الانتقال للتالي
    const canProceed = useMemo(() => {
        switch (currentStep) {
            case 1:
                return sourceSystem.trim().length > 0 && recordType.length > 0;
            case 2:
                return selectedFile && !fileError;
            case 3:
                return validationSummary && validationSummary.valid > 0;
            case 4:
                return true;
            default:
                return false;
        }
    }, [currentStep, sourceSystem, recordType, selectedFile, fileError, validationSummary]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="استيراد بيانات من النظام السابق"
            size="xl"
            closeOnOverlayClick={false}
            footer={
                currentStep < 5 ? (
                    <div className="flex items-center gap-3 w-full justify-between">
                        <div>
                            {currentStep > 1 && (
                                <Button variant="ghost" size="sm" onClick={handleBack} disabled={loading}>
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    السابق
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleClose} disabled={loading}>
                                إلغاء
                            </Button>
                            <Button
                                variant={currentStep === 4 ? 'success' : 'primary'}
                                size="sm"
                                onClick={handleNext}
                                disabled={!canProceed || loading}
                                loading={loading}
                            >
                                {currentStep === 4 ? 'تأكيد الاستيراد' : 'التالي'}
                                {currentStep < 4 && (
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 w-full justify-end">
                        <Button variant="primary" size="sm" onClick={handleClose}>
                            إغلاق
                        </Button>
                    </div>
                )
            }
        >
            <div dir="rtl" className="space-y-6">
                {/* مؤشر التقدم */}
                <StepIndicator steps={STEPS} currentStep={currentStep} darkMode={darkMode} />

                {/* محتوى الخطوات */}
                {currentStep === 1 && (
                    <StepSource
                        sourceSystem={sourceSystem}
                        onSourceChange={setSourceSystem}
                        recordType={recordType}
                        onRecordTypeChange={setRecordType}
                        recordTypeOptions={recordTypeOptions}
                        darkMode={darkMode}
                    />
                )}

                {currentStep === 2 && (
                    <StepUpload
                        selectedFile={selectedFile}
                        fileError={fileError}
                        isDragging={isDragging}
                        fileInputRef={fileInputRef}
                        onFileInputChange={handleFileInputChange}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onRemoveFile={() => { setSelectedFile(null); setFileError(''); }}
                        formatFileSize={formatFileSize}
                        darkMode={darkMode}
                    />
                )}

                {currentStep === 3 && (
                    <StepPreview
                        previewData={previewData}
                        validationSummary={validationSummary}
                        darkMode={darkMode}
                    />
                )}

                {currentStep === 4 && (
                    <StepConfirm
                        sourceSystem={sourceSystem}
                        recordType={recordType}
                        fileName={selectedFile?.name}
                        validationSummary={validationSummary}
                        darkMode={darkMode}
                    />
                )}

                {currentStep === 5 && (
                    <StepResult
                        result={importResult}
                        darkMode={darkMode}
                    />
                )}
            </div>
        </Modal>
    );
});

// ============================================================
// مكونات فرعية
// ============================================================

/**
 * StepIndicator - مؤشر خطوات المعالج
 */
const StepIndicator = memo(function StepIndicator({ steps, currentStep, darkMode }) {
    return (
        <div className="flex items-center justify-between" role="navigation" aria-label="خطوات المعالج">
            {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;

                return (
                    <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                            <div
                                className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                    ${isCompleted
                                        ? 'bg-emerald-500 text-white'
                                        : isActive
                                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                            : darkMode
                                                ? 'bg-gray-700 text-gray-400'
                                                : 'bg-gray-200 text-gray-500 dark:text-gray-400'
                                    }
                                `}
                                aria-current={isActive ? 'step' : undefined}
                            >
                                {isCompleted ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    step.icon
                                )}
                            </div>
                            <span className={`
                                text-[10px] font-medium text-center whitespace-nowrap hidden sm:block
                                ${isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : isCompleted
                                        ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
                                        : darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'
                                }
                            `}>
                                {step.title}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={`
                                    flex-1 h-0.5 mx-2
                                    ${step.id < currentStep
                                        ? 'bg-emerald-400'
                                        : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                    }
                                `}
                                aria-hidden="true"
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
});

/**
 * الخطوة 1 - اختيار المصدر
 */
const StepSource = memo(function StepSource({
    sourceSystem,
    onSourceChange,
    recordType,
    onRecordTypeChange,
    recordTypeOptions,
    darkMode,
}) {
    return (
        <div className="space-y-4">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                حدد اسم النظام المصدر ونوع السجلات المراد استيرادها
            </p>
            <Input
                label="اسم النظام المصدر"
                placeholder="مثال: نظام شؤون الموظفين القديم"
                value={sourceSystem}
                onChange={(e) => onSourceChange(e.target.value)}
                required
            />
            <Select
                label="نوع السجلات"
                placeholder="اختر نوع السجلات..."
                options={recordTypeOptions}
                value={recordType}
                onChange={(e) => onRecordTypeChange(e.target.value)}
                required
            />
        </div>
    );
});

/**
 * الخطوة 2 - رفع الملف
 */
const StepUpload = memo(function StepUpload({
    selectedFile,
    fileError,
    isDragging,
    fileInputRef,
    onFileInputChange,
    onDragOver,
    onDragLeave,
    onDrop,
    onRemoveFile,
    formatFileSize,
    darkMode,
}) {
    const fileExtension = selectedFile?.name?.split('.').pop()?.toUpperCase();

    return (
        <div className="space-y-4">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                ارفع ملف البيانات بأحد التنسيقات المدعومة (Excel أو CSV أو JSON)
            </p>

            {/* منطقة السحب والإفلات */}
            {!selectedFile && (
                <div
                    className={`
                        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                        ${isDragging
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : darkMode
                                ? 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 bg-gray-50 dark:bg-gray-800'
                        }
                    `}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    role="button"
                    tabIndex={0}
                    aria-label="اضغط أو اسحب ملفاً هنا لرفعه"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            fileInputRef.current?.click();
                        }
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_FILE_TYPES}
                        onChange={onFileInputChange}
                        className="hidden"
                        aria-hidden="true"
                    />
                    <svg className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                        اسحب الملف هنا أو اضغط للاختيار
                    </p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        الأنواع المقبولة: .xlsx، .csv، .json (حد أقصى 10 م.ب)
                    </p>
                </div>
            )}

            {/* معلومات الملف المختار */}
            {selectedFile && (
                <div className={`
                    rounded-xl border p-4 flex items-center gap-3
                    ${darkMode
                        ? 'bg-gray-800/50 border-gray-700'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                    }
                `}>
                    <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold
                        ${fileExtension === 'XLSX' || fileExtension === 'XLS'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : fileExtension === 'CSV'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        }
                    `}>
                        {fileExtension}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-900 dark:text-white'}`}>
                            {selectedFile.name}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {formatFileSize(selectedFile.size)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onRemoveFile}
                        className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400'}`}
                        aria-label="إزالة الملف"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* رسالة خطأ */}
            {fileError && (
                <p className="text-sm text-red-500 flex items-center gap-1.5" role="alert">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fileError}
                </p>
            )}
        </div>
    );
});

/**
 * الخطوة 3 - معاينة البيانات
 */
const StepPreview = memo(function StepPreview({ previewData, validationSummary, darkMode }) {
    return (
        <div className="space-y-4">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                معاينة البيانات قبل الاستيراد
            </p>

            {/* ملخص التحقق */}
            {validationSummary && (
                <div className="grid grid-cols-3 gap-3">
                    <div className={`rounded-xl border p-3 text-center ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                        <p className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900 dark:text-white'}`}>
                            {validationSummary.total?.toLocaleString('ar-SA') || 0}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>إجمالي السجلات</p>
                    </div>
                    <div className={`rounded-xl border p-3 text-center ${darkMode ? 'bg-emerald-900/20 border-emerald-800/40' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200'}`}>
                        <p className="text-lg font-bold text-emerald-600">
                            {validationSummary.valid?.toLocaleString('ar-SA') || 0}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>صالح</p>
                    </div>
                    <div className={`rounded-xl border p-3 text-center ${darkMode ? 'bg-red-900/20 border-red-800/40' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                            {validationSummary.invalid?.toLocaleString('ar-SA') || 0}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600 dark:text-red-400'}`}>غير صالح</p>
                    </div>
                </div>
            )}

            {/* جدول المعاينة */}
            {previewData && previewData.length > 0 && (
                <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className={darkMode ? 'bg-gray-800/50' : 'bg-gray-50 dark:bg-gray-800'}>
                                    {Object.keys(previewData[0]).map((key) => (
                                        <th
                                            key={key}
                                            scope="col"
                                            className={`px-3 py-2 text-right text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}
                                        >
                                            {key}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100 dark:divide-gray-800'}`}>
                                {previewData.slice(0, 5).map((row, idx) => (
                                    <tr key={idx}>
                                        {Object.values(row).map((val, colIdx) => (
                                            <td
                                                key={colIdx}
                                                className={`px-3 py-2 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'} whitespace-nowrap`}
                                            >
                                                {val !== null && val !== undefined ? String(val) : '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {previewData.length > 5 && (
                        <p className={`text-center text-xs py-2 ${darkMode ? 'text-gray-500 dark:text-gray-400 bg-gray-800/30' : 'text-gray-400 bg-gray-50 dark:bg-gray-800'}`}>
                            يتم عرض أول 5 سجلات من أصل {previewData.length.toLocaleString('ar-SA')}
                        </p>
                    )}
                </div>
            )}

            {previewData && previewData.length === 0 && (
                <div className={`rounded-xl border p-6 text-center ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        لا توجد سجلات للمعاينة
                    </p>
                </div>
            )}
        </div>
    );
});

/**
 * الخطوة 4 - تأكيد الاستيراد
 */
const StepConfirm = memo(function StepConfirm({ sourceSystem, recordType, fileName, validationSummary, darkMode }) {
    return (
        <div className="space-y-4">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                راجع المعلومات التالية قبل تأكيد الاستيراد
            </p>

            <div className={`rounded-xl border p-4 space-y-3 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center justify-between">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>النظام المصدر</span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900 dark:text-white'}`}>{sourceSystem}</span>
                </div>
                <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`} />
                <div className="flex items-center justify-between">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>نوع السجلات</span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900 dark:text-white'}`}>{recordType}</span>
                </div>
                <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`} />
                <div className="flex items-center justify-between">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>اسم الملف</span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900 dark:text-white'}`}>{fileName}</span>
                </div>
                <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`} />
                <div className="flex items-center justify-between">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>السجلات الصالحة</span>
                    <Badge variant="success" size="sm">
                        {validationSummary?.valid?.toLocaleString('ar-SA') || 0} سجل
                    </Badge>
                </div>
                {validationSummary?.invalid > 0 && (
                    <>
                        <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`} />
                        <div className="flex items-center justify-between">
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>سجلات غير صالحة (سيتم تجاهلها)</span>
                            <Badge variant="danger" size="sm">
                                {validationSummary.invalid.toLocaleString('ar-SA')} سجل
                            </Badge>
                        </div>
                    </>
                )}
            </div>

            {/* تحذير */}
            <div className={`
                rounded-xl border p-3 flex items-start gap-2 text-xs
                ${darkMode
                    ? 'bg-amber-900/20 border-amber-800/40 text-amber-300'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                }
            `}>
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                    سيتم استيراد السجلات الصالحة فقط كبيانات تاريخية للقراءة فقط. هذا الإجراء لا يمكن التراجع عنه.
                </span>
            </div>
        </div>
    );
});

/**
 * الخطوة 5 - النتيجة
 */
const StepResult = memo(function StepResult({ result, darkMode }) {
    if (!result) return null;

    return (
        <div className="text-center py-4 space-y-4">
            {result.success ? (
                <>
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900 dark:text-white'}`}>
                        تم الاستيراد بنجاح
                    </h3>
                    <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-600">
                                {result.imported?.toLocaleString('ar-SA') || 0}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>سجل تم استيراده</p>
                        </div>
                        {result.failed > 0 && (
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-500">
                                    {result.failed?.toLocaleString('ar-SA') || 0}
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>سجل فشل</p>
                            </div>
                        )}
                    </div>
                    {result.batchId && (
                        <p className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                            رقم الدفعة: {result.batchId}
                        </p>
                    )}
                </>
            ) : (
                <>
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900 dark:text-white'}`}>
                        فشل الاستيراد
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {result.error || 'حدث خطأ غير متوقع أثناء عملية الاستيراد'}
                    </p>
                </>
            )}
        </div>
    );
});

LegacyImportWizard.displayName = 'LegacyImportWizard';

LegacyImportWizard.propTypes = {
    /** نوع الوحدة */
    moduleType: PropTypes.oneOf(['hr', 'warehouse', 'movement', 'archiving', 'sadad', 'epm']),
    /** حالة فتح المعالج */
    isOpen: PropTypes.bool.isRequired,
    /** دالة الإغلاق */
    onClose: PropTypes.func.isRequired,
    /** دالة عند اكتمال الاستيراد */
    onImportComplete: PropTypes.func,
    /** الوضع الداكن */
    darkMode: PropTypes.bool,
};

export default LegacyImportWizard;
