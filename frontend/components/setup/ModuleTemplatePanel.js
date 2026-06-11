import React, { useMemo, useRef, useState } from 'react';
import { useToast } from '../../context/NotificationContext';
import { useOrganization } from '../../context/OrganizationContext';
import { TEMPLATE_CATEGORIES } from '../../lib/setup-templates';
import { downloadExcelTemplate, VALID_EXCEL_TYPES } from '../../lib/setup-template-utils';
import {
    ContentCard,
    Button,
    Badge,
    Modal,
    Input,
    EmptyState,
} from '../ui';

const DownloadIcon = ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
    </svg>
);

const UploadIcon = ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 14l5-5 5 5M12 9v12" />
    </svg>
);

export default function ModuleTemplatePanel({ categoryId, className = '' }) {
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
        return [...category.templates].sort((a, b) => a.order - b.order);
    }, [category]);

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

                if (result.warnings && result.warnings.length > 0) {
                    result.warnings.forEach((w) => toast.warning(w.message || w));
                }

                setShowUploadModal(false);
            } else {
                if (result.validationErrors && result.validationErrors.length > 0) {
                    setValidationErrors(result.validationErrors);
                }
                toast.error(result.error || 'فشل في استيراد البيانات');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setValidationErrors([
                {
                    row: 0,
                    field: 'general',
                    message: 'فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى.',
                },
            ]);
            toast.error('حدث خطأ أثناء معالجة الملف');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!category) {
        return (
            <ContentCard
                title="قوالب إدخال البيانات"
                subtitle="لا توجد قوالب متاحة لهذا الموديول حالياً"
                className={className}
            >
                <EmptyState
                    title="لا توجد قوالب"
                    description="لم يتم توفير قوالب تحميل/رفع لهذا الموديول بعد"
                />
            </ContentCard>
        );
    }

    return (
        <>
            <ContentCard
                title={`قوالب إدخال البيانات - ${category.name}`}
                subtitle="تحميل القالب ورفع البيانات من نفس الشاشة (متصل بنظام التهيئة المركزي)"
                className={className}
            >
                <div className="space-y-3">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {template.name}
                                        </h4>
                                        {template.required && (
                                            <Badge variant="danger">مطلوب</Badge>
                                        )}
                                        {template.dependsOn?.length > 0 && (
                                            <Badge variant="warning">يعتمد على مراجع</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {template.description}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            downloadExcelTemplate({
                                                template,
                                                category,
                                                organizationName: organization?.name,
                                                toast,
                                            })
                                        }
                                    >
                                        <DownloadIcon className="w-4 h-4 ml-1" />
                                        تحميل القالب
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => openUploadModal(template)}
                                    >
                                        <UploadIcon className="w-4 h-4 ml-1" />
                                        رفع البيانات
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ContentCard>

            <Modal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                title={`رفع بيانات - ${selectedTemplate?.name || ''}`}
            >
                <div className="space-y-4">
                    <Input
                        type="file"
                        ref={fileInputRef}
                        accept=".xls,.xlsx"
                        onChange={handleFileSelect}
                        label="اختر ملف القالب"
                    />

                    {validationErrors.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">أخطاء التحقق:</p>
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
                        <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                            إلغاء
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleUpload}
                            disabled={!uploadFile || isProcessing}
                        >
                            {isProcessing ? 'جاري المعالجة...' : 'رفع واستيراد'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
