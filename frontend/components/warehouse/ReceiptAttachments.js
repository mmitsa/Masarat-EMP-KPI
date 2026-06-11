import React, { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { Badge, Button, Modal } from '../ui';

// ═══════════════════════════════════════════════════════════════
// مرفقات محضر الاستلام
// Receipt Attachments Component
// ═══════════════════════════════════════════════════════════════

const ATTACHMENT_CATEGORIES = {
    1: { label: 'الفاتورة', icon: '🧾', mandatory: true },
    2: { label: 'أمر الشراء', icon: '📋', mandatory: true },
    3: { label: 'العقد', icon: '📄', mandatory: false },
    4: { label: 'شهادة المنشأ', icon: '🌍', mandatory: false },
    5: { label: 'شهادة الجودة', icon: '✅', mandatory: false },
    6: { label: 'صور المواد', icon: '📸', mandatory: false },
    7: { label: 'محضر الفحص', icon: '🔍', mandatory: true },
    8: { label: 'محضر الاستلام', icon: '📝', mandatory: true },
    99: { label: 'مستندات أخرى', icon: '📎', mandatory: false },
};

const FILE_TYPES = {
    'application/pdf': { icon: '📕', color: 'red' },
    'image/jpeg': { icon: '🖼️', color: 'blue' },
    'image/png': { icon: '🖼️', color: 'blue' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📊', color: 'green' },
    'application/vnd.ms-excel': { icon: '📊', color: 'green' },
    'application/msword': { icon: '📘', color: 'blue' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📘', color: 'blue' },
};

export function ReceiptAttachments({ receiptId, attachments: initialAttachments, onRefresh, readOnly = false }) {
    const [attachments, setAttachments] = useState(initialAttachments || []);
    const [loading, setLoading] = useState(!initialAttachments);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(1);
    const [description, setDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [validation, setValidation] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState(null);

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!initialAttachments && receiptId) {
            loadAttachments();
        }
        validateAttachments();
    }, [receiptId, initialAttachments]);

    const loadAttachments = async () => {
        setLoading(true);
        try {
            const response = await api.warehouse?.getReceiptAttachments?.(receiptId);
            setAttachments(response || mockAttachments);
        } catch (error) {
            console.warn('Error loading attachments:', error);
            setAttachments(mockAttachments);
        } finally {
            setLoading(false);
        }
    };

    const validateAttachments = async () => {
        try {
            const result = await api.warehouse?.validateReceiptAttachments?.(receiptId);
            setValidation(result || calculateValidation(attachments));
        } catch (error) {
            setValidation(calculateValidation(attachments));
        }
    };

    const calculateValidation = (atts) => {
        const mandatory = Object.entries(ATTACHMENT_CATEGORIES)
            .filter(([_, cat]) => cat.mandatory)
            .map(([id, cat]) => ({ category: parseInt(id), ...cat }));

        const missing = mandatory.filter(
            cat => !atts.some(a => a.category === cat.category)
        );

        return {
            isValid: missing.length === 0,
            missingAttachments: missing.map(m => ({
                category: m.category,
                categoryName: m.label,
                description: `مطلوب رفع ${m.label}`,
            })),
            totalRequired: mandatory.length,
            totalUploaded: mandatory.filter(
                cat => atts.some(a => a.category === cat.category)
            ).length,
            message: missing.length === 0
                ? 'جميع المرفقات الإلزامية موجودة'
                : `يوجد ${missing.length} مرفق إلزامي مفقود`,
        };
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('category', selectedCategory);
            formData.append('description', description);
            formData.append('isMandatory', ATTACHMENT_CATEGORIES[selectedCategory]?.mandatory || false);

            await api.warehouse?.addReceiptAttachment?.(receiptId, formData);

            setShowUploadModal(false);
            setSelectedFile(null);
            setDescription('');
            loadAttachments();
            validateAttachments();
            onRefresh?.();
        } catch (error) {
            console.warn('Error uploading attachment:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (attachmentId) => {
        if (!confirm('هل أنت متأكد من حذف هذا المرفق؟')) return;

        try {
            await api.warehouse?.deleteReceiptAttachment?.(receiptId, attachmentId);
            loadAttachments();
            validateAttachments();
            onRefresh?.();
        } catch (error) {
            console.warn('Error deleting attachment:', error);
        }
    };

    const handlePreview = (attachment) => {
        setPreviewAttachment(attachment);
        setShowPreview(true);
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileTypeInfo = (fileType) => FILE_TYPES[fileType] || { icon: '📄', color: 'gray' };

    const getCategoryInfo = (category) => ATTACHMENT_CATEGORIES[category] || ATTACHMENT_CATEGORIES[99];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="mr-3 text-gray-500 dark:text-gray-400">جاري تحميل المرفقات...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        📎
                    </span>
                    المرفقات
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        ({attachments.length} مرفق)
                    </span>
                </h3>
                {!readOnly && (
                    <Button variant="primary" onClick={() => setShowUploadModal(true)}>
                        <UploadIcon className="w-4 h-4 ml-2" />
                        رفع مرفق
                    </Button>
                )}
            </div>

            {/* Validation Status */}
            {validation && (
                <div
                    className={`p-4 rounded-xl border ${validation.isValid
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${validation.isValid
                                    ? 'bg-green-500 text-white'
                                    : 'bg-yellow-500 text-white'
                                }`}
                        >
                            {validation.isValid ? '✓' : '⚠'}
                        </div>
                        <div className="flex-1">
                            <h4
                                className={`font-semibold ${validation.isValid ? 'text-green-900' : 'text-yellow-900'
                                    }`}
                            >
                                {validation.isValid ? 'المرفقات مكتملة' : 'المرفقات غير مكتملة'}
                            </h4>
                            <p
                                className={`text-sm ${validation.isValid ? 'text-green-700 dark:text-green-300' : 'text-yellow-700'
                                    }`}
                            >
                                {validation.message}
                            </p>
                            {validation.missingAttachments?.length > 0 && (
                                <div className="mt-3 space-y-1">
                                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                        المرفقات المفقودة:
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {validation.missingAttachments.map((m, i) => (
                                            <Badge key={i} variant="warning">
                                                {getCategoryInfo(m.category).icon} {m.categoryName}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {validation.totalUploaded} / {validation.totalRequired} مرفقات إلزامية
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Attachments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {attachments.map((attachment) => {
                    const category = getCategoryInfo(attachment.category);
                    const fileType = getFileTypeInfo(attachment.fileType);

                    return (
                        <div
                            key={attachment.id}
                            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-gray-900/20 hover:shadow-md transition-shadow p-4"
                        >
                            {/* File Icon */}
                            <div className="flex items-start gap-3">
                                <div
                                    className={`w-12 h-12 rounded-lg bg-${fileType.color}-100 flex items-center justify-center text-2xl`}
                                >
                                    {fileType.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-white truncate" title={attachment.originalFileName}>
                                        {attachment.originalFileName}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant={category.mandatory ? 'warning' : 'secondary'} className="text-xs">
                                            {category.icon} {category.label}
                                        </Badge>
                                        {attachment.isVerified && (
                                            <Badge variant="success" className="text-xs">
                                                ✓ موثق
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {formatFileSize(attachment.fileSize)}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {attachment.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 truncate" title={attachment.description}>
                                    {attachment.description}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={() => handlePreview(attachment)}
                                    className="flex-1 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    <EyeIcon className="w-4 h-4 inline ml-1" />
                                    عرض
                                </button>
                                <a
                                    href={attachment.fileUrl}
                                    download={attachment.originalFileName}
                                    className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-center"
                                >
                                    <DownloadIcon className="w-4 h-4 inline ml-1" />
                                    تحميل
                                </a>
                                {!readOnly && (
                                    <button
                                        onClick={() => handleDelete(attachment.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {attachments.length === 0 && (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
                        📎
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">لا توجد مرفقات</p>
                    {!readOnly && (
                        <Button
                            variant="primary"
                            className="mt-4"
                            onClick={() => setShowUploadModal(true)}
                        >
                            <UploadIcon className="w-4 h-4 ml-2" />
                            رفع مرفق
                        </Button>
                    )}
                </div>
            )}

            {/* Upload Modal */}
            <Modal
                isOpen={showUploadModal}
                onClose={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setDescription('');
                }}
                title="رفع مرفق جديد"
                size="md"
            >
                <div className="space-y-6">
                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            نوع المرفق *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(ATTACHMENT_CATEGORIES).map(([id, cat]) => (
                                <button
                                    key={id}
                                    onClick={() => setSelectedCategory(parseInt(id))}
                                    className={`p-3 rounded-lg border text-right transition-colors ${selectedCategory === parseInt(id)
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{cat.icon}</span>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">{cat.label}</div>
                                            {cat.mandatory && (
                                                <div className="text-xs text-red-500">إلزامي</div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* File Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            الملف *
                        </label>
                        <div
                            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${selectedFile
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                                }`}
                        >
                            {selectedFile ? (
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-2xl">
                                        {getFileTypeInfo(selectedFile.type).icon}
                                    </span>
                                    <div className="text-right">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {selectedFile.name}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatFileSize(selectedFile.size)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedFile(null)}
                                        className="p-1 text-red-500 hover:bg-red-100 rounded"
                                    >
                                        <XIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                                        اسحب الملف هنا أو
                                    </p>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-blue-500 hover:underline"
                                    >
                                        اختر ملف
                                    </button>
                                    <p className="text-xs text-gray-400 mt-2">
                                        PDF, Word, Excel, صور (حد أقصى 10MB)
                                    </p>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                onChange={handleFileSelect}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            وصف المرفق
                        </label>
                        <textarea
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400"
                            rows="2"
                            placeholder="وصف اختياري للمرفق..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="secondary"
                            onClick={() => setShowUploadModal(false)}
                        >
                            إلغاء
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleUpload}
                            disabled={!selectedFile || uploading}
                        >
                            {uploading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></span>
                                    جاري الرفع...
                                </>
                            ) : (
                                <>
                                    <UploadIcon className="w-4 h-4 ml-2" />
                                    رفع المرفق
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Preview Modal */}
            <Modal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                title={previewAttachment?.originalFileName || 'معاينة المرفق'}
                size="xl"
            >
                {previewAttachment && (
                    <div className="space-y-4">
                        {previewAttachment.fileType?.includes('image') ? (
                            <img
                                src={previewAttachment.fileUrl}
                                alt={previewAttachment.originalFileName}
                                className="max-w-full rounded-lg"
                            />
                        ) : previewAttachment.fileType === 'application/pdf' ? (
                            <iframe
                                src={previewAttachment.fileUrl}
                                className="w-full h-[600px] rounded-lg border"
                                title={previewAttachment.originalFileName}
                            />
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">
                                    {getFileTypeInfo(previewAttachment.fileType).icon}
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                    لا يمكن معاينة هذا النوع من الملفات
                                </p>
                                <a
                                    href={previewAttachment.fileUrl}
                                    download={previewAttachment.originalFileName}
                                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                    <DownloadIcon className="w-4 h-4 ml-2" />
                                    تحميل الملف
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════

function UploadIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
    );
}

function EyeIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
}

function DownloadIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
    );
}

function TrashIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

function XIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

// ═══════════════════════════════════════════════════════════════
// Mock Data for Development
// ═══════════════════════════════════════════════════════════════

const mockAttachments = [
    {
        id: 1,
        receiptNoteId: 1,
        fileName: 'invoice-2026-00450.pdf',
        originalFileName: 'فاتورة المورد INV-2026-00450.pdf',
        fileUrl: '/attachments/invoice.pdf',
        fileType: 'application/pdf',
        fileSize: 245678,
        category: 1,
        isMandatory: true,
        isVerified: true,
        description: 'فاتورة شركة التوريدات المتحدة',
    },
    {
        id: 2,
        receiptNoteId: 1,
        fileName: 'po-2026-001.pdf',
        originalFileName: 'أمر الشراء PO-2026-001.pdf',
        fileUrl: '/attachments/po.pdf',
        fileType: 'application/pdf',
        fileSize: 156234,
        category: 2,
        isMandatory: true,
        isVerified: true,
        description: 'أمر شراء رقم 2026/001',
    },
    {
        id: 3,
        receiptNoteId: 1,
        fileName: 'inspection-report.pdf',
        originalFileName: 'محضر الفحص.pdf',
        fileUrl: '/attachments/inspection.pdf',
        fileType: 'application/pdf',
        fileSize: 89234,
        category: 7,
        isMandatory: true,
        isVerified: false,
        description: 'محضر فحص لجنة الاستلام',
    },
    {
        id: 4,
        receiptNoteId: 1,
        fileName: 'items-photo.jpg',
        originalFileName: 'صور المواد المستلمة.jpg',
        fileUrl: '/attachments/photo.jpg',
        fileType: 'image/jpeg',
        fileSize: 1234567,
        category: 6,
        isMandatory: false,
        isVerified: false,
        description: 'صور الأصناف بعد الفحص',
    },
];

export default ReceiptAttachments;
