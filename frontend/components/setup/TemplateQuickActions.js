import React, { useMemo, useRef, useState } from 'react';
import { useToast } from '../../context/NotificationContext';
import { useOrganization } from '../../context/OrganizationContext';
import { TEMPLATE_CATEGORIES } from '../../lib/setup-templates';
import { downloadExcelTemplate, VALID_EXCEL_TYPES } from '../../lib/setup-template-utils';
import PermissionGuard from '../PermissionGuard';
import { Button, Modal } from '../ui';

/**
 * TemplateQuickActions - أزرار سريعة لتحميل/رفع قوالب البيانات
 * يُعرض في أعلى صفحات الموديولات
 *
 * @param {string} categoryId - معرف الفئة (hr, warehouse, movement, etc.)
 * @param {string|string[]} templateIds - معرف القالب أو مصفوفة معرفات
 * @param {string} className - CSS classes
 */
export default function TemplateQuickActions({ categoryId, templateIds, className = '' }) {
    const toast = useToast();
    const { organization } = useOrganization();
    const fileInputRef = useRef(null);

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const category = useMemo(
        () => TEMPLATE_CATEGORIES.find((c) => c.id === categoryId),
        [categoryId]
    );

    const templates = useMemo(() => {
        if (!category?.templates) return [];
        const ids = Array.isArray(templateIds) ? templateIds : templateIds ? [templateIds] : null;
        if (!ids) return category.templates;
        return category.templates.filter(t => ids.includes(t.id));
    }, [category, templateIds]);

    if (!category || templates.length === 0) return null;

    const handleDownload = (template) => {
        downloadExcelTemplate({
            template,
            category,
            organizationName: organization?.name,
            toast,
        });
    };

    const openUploadModal = (template) => {
        setSelectedTemplate({ ...template, categoryId: category.id });
        setUploadFile(null);
        setValidationErrors([]);
        setShowUploadModal(true);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!VALID_EXCEL_TYPES.includes(file.type) && !file.name.match(/\.(xls|xlsx|ods)$/i)) {
            toast.error('يرجى رفع ملف Excel صالح (.xls أو .xlsx)');
            return;
        }

        setUploadFile(file);
        setValidationErrors([]);
    };

    const handleUpload = async () => {
        if (!uploadFile || !selectedTemplate) return;

        setIsProcessing(true);
        setValidationErrors([]);

        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('templateId', selectedTemplate.id);
            formData.append('categoryId', selectedTemplate.categoryId);

            const response = await fetch('/api/setup/import', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message || `تم استيراد بيانات "${selectedTemplate.name}" بنجاح`);
                if (result.warnings?.length > 0) {
                    result.warnings.forEach((w) => toast.warning(w.message || w));
                }
                setShowUploadModal(false);
            } else {
                if (result.validationErrors?.length > 0) {
                    setValidationErrors(result.validationErrors);
                }
                toast.error(result.error || 'فشل في استيراد البيانات');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setValidationErrors([{
                row: 0,
                field: 'general',
                message: 'فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى.',
            }]);
            toast.error('حدث خطأ أثناء معالجة الملف');
        } finally {
            setIsProcessing(false);
        }
    };

    // عرض مبسط: إذا كان قالب واحد فقط
    if (templates.length === 1) {
        const template = templates[0];
        return (
            <PermissionGuard requires="settings:read">
                <div className={`flex items-center gap-2 ${className}`}>
                    <button
                        onClick={() => handleDownload(template)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                            border border-gray-300 dark:border-gray-600
                            text-gray-700 dark:text-gray-300
                            hover:bg-gray-50 dark:hover:bg-gray-700
                            transition-colors duration-150"
                        title={`تحميل قالب ${template.name}`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                        </svg>
                        تحميل القالب
                    </button>
                    <button
                        onClick={() => openUploadModal(template)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                            bg-blue-600 text-white hover:bg-blue-700
                            transition-colors duration-150"
                        title={`رفع بيانات ${template.name}`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 14l5-5 5 5M12 9v12" />
                        </svg>
                        رفع البيانات
                    </button>

                    <UploadModal
                        show={showUploadModal}
                        onClose={() => setShowUploadModal(false)}
                        selectedTemplate={selectedTemplate}
                        uploadFile={uploadFile}
                        onFileSelect={handleFileSelect}
                        onUpload={handleUpload}
                        validationErrors={validationErrors}
                        isProcessing={isProcessing}
                        fileInputRef={fileInputRef}
                    />
                </div>
            </PermissionGuard>
        );
    }

    // عرض متعدد: dropdown أو قائمة
    return (
        <PermissionGuard requires="settings:read">
            <div className={`flex items-center gap-2 ${className}`}>
                <TemplateDropdown
                    templates={templates}
                    onDownload={handleDownload}
                    onUpload={openUploadModal}
                />

                <UploadModal
                    show={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    selectedTemplate={selectedTemplate}
                    uploadFile={uploadFile}
                    onFileSelect={handleFileSelect}
                    onUpload={handleUpload}
                    validationErrors={validationErrors}
                    isProcessing={isProcessing}
                    fileInputRef={fileInputRef}
                />
            </div>
        </PermissionGuard>
    );
}

// Dropdown للقوالب المتعددة
function TemplateDropdown({ templates, onDownload, onUpload }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                    border border-gray-300 dark:border-gray-600
                    text-gray-700 dark:text-gray-300
                    hover:bg-gray-50 dark:hover:bg-gray-700
                    transition-colors duration-150"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                قوالب البيانات
                <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 z-20 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
                        {templates.map((template) => (
                            <div key={template.id} className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">{template.name}</p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { onDownload(template); setOpen(false); }}
                                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        تحميل
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        onClick={() => { onUpload(template); setOpen(false); }}
                                        className="text-[10px] text-green-600 dark:text-green-400 hover:underline"
                                    >
                                        رفع
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// Modal رفع الملف
function UploadModal({ show, onClose, selectedTemplate, uploadFile, onFileSelect, onUpload, validationErrors, isProcessing, fileInputRef }) {
    if (!show) return null;

    return (
        <Modal
            isOpen={show}
            onClose={onClose}
            title={`رفع بيانات - ${selectedTemplate?.name || ''}`}
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        اختر ملف القالب
                    </label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".xls,.xlsx"
                        onChange={onFileSelect}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                            file:ml-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            dark:file:bg-blue-900/30 dark:file:text-blue-400
                            hover:file:bg-blue-100"
                    />
                    {uploadFile && (
                        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                            تم اختيار: {uploadFile.name}
                        </p>
                    )}
                </div>

                {validationErrors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">أخطاء التحقق:</p>
                        <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                            {validationErrors.map((err, idx) => (
                                <li key={idx}>
                                    {err.row ? `صف ${err.row}: ` : ''}{err.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        إلغاء
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onUpload}
                        disabled={!uploadFile || isProcessing}
                    >
                        {isProcessing ? 'جاري المعالجة...' : 'رفع واستيراد'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
