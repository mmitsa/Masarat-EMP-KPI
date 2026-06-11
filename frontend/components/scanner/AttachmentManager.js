/**
 * مدير المرفقات المتكامل
 * Integrated Attachment Manager Component
 *
 * يجمع كل وظائف إدارة المرفقات:
 * - المسح الضوئي
 * - رفع الملفات
 * - معاينة وتعديل الصور
 * - عرض ملفات PDF
 * - إعادة التسمية والحذف
 * - الترتيب والسحب والإفلات
 */

import React, { useState, useRef, useCallback } from 'react';
import ScannerInterface from './ScannerInterface';
import ImageEditor from './ImageEditor';
import PDFViewer, { PDFThumbnail } from './PDFViewer';

// أيقونات
const Icons = {
    Upload: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
    ),
    Scanner: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    Camera: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Edit: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    ),
    Delete: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    ),
    Eye: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ),
    Download: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
    ),
    Rename: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    ),
    Grip: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    ),
    File: () => (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    ),
    PDF: () => (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z"/>
            <path d="M9 14h2v4H9v-4zm4 0h2v4h-2v-4z"/>
        </svg>
    ),
    Word: () => (
        <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z"/>
        </svg>
    ),
    Excel: () => (
        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z"/>
        </svg>
    ),
    Plus: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
    ),
    Close: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
};

// أنواع الملفات المدعومة
const FILE_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
    pdf: ['application/pdf'],
    document: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

// دالة تحديد نوع الملف
const getFileType = (mimeType) => {
    if (FILE_TYPES.image.includes(mimeType)) return 'image';
    if (FILE_TYPES.pdf.includes(mimeType)) return 'pdf';
    if (FILE_TYPES.document.includes(mimeType)) return 'document';
    if (FILE_TYPES.spreadsheet.includes(mimeType)) return 'spreadsheet';
    return 'file';
};

// دالة تنسيق حجم الملف
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'ك.ب', 'م.ب', 'ج.ب'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function AttachmentManager({
    attachments = [],
    onChange,
    onUpload,
    onDelete,
    onRename,
    maxFiles = 50,
    maxFileSize = 10 * 1024 * 1024, // 10MB
    acceptedTypes = 'image/*,application/pdf,.doc,.docx,.xls,.xlsx',
    transactionId,
    showScanner = true,
    showUpload = true,
    showCamera = true,
    readOnly = false,
    className = '',
}) {
    // الحالات
    const [localAttachments, setLocalAttachments] = useState(attachments);
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState(null);
    const [editingAttachment, setEditingAttachment] = useState(null);
    const [viewingPDF, setViewingPDF] = useState(null);
    const [renamingIndex, setRenamingIndex] = useState(null);
    const [newName, setNewName] = useState('');
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);

    // المراجع
    const fileInputRef = useRef(null);

    // تحديث المرفقات
    const updateAttachments = useCallback((newAttachments) => {
        setLocalAttachments(newAttachments);
        if (onChange) {
            onChange(newAttachments);
        }
    }, [onChange]);

    // رفع الملفات
    const handleFileUpload = async (files) => {
        const fileArray = Array.from(files);

        // التحقق من العدد
        if (localAttachments.length + fileArray.length > maxFiles) {
            setError(`لا يمكن إضافة أكثر من ${maxFiles} ملف`);
            return;
        }

        setIsUploading(true);
        setError(null);

        const newAttachments = [];

        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];

            // التحقق من الحجم
            if (file.size > maxFileSize) {
                setError(`الملف ${file.name} أكبر من الحد المسموح (${formatFileSize(maxFileSize)})`);
                continue;
            }

            try {
                // قراءة الملف كـ Base64
                const dataUrl = await fileToBase64(file);

                const attachment = {
                    id: `file-${Date.now()}-${i}`,
                    name: file.name,
                    originalName: file.name,
                    type: file.type,
                    size: file.size,
                    data: dataUrl,
                    file: file,
                    uploadedAt: new Date().toISOString(),
                    source: 'upload',
                };

                newAttachments.push(attachment);

                // تحديث شريط التقدم
                setUploadProgress(Math.round(((i + 1) / fileArray.length) * 100));

            } catch (err) {
                console.error('Error uploading file:', err);
                setError(`فشل في رفع الملف ${file.name}`);
            }
        }

        if (newAttachments.length > 0) {
            const updatedAttachments = [...localAttachments, ...newAttachments];
            updateAttachments(updatedAttachments);

            if (onUpload) {
                onUpload(newAttachments);
            }
        }

        setIsUploading(false);
        setUploadProgress(0);
    };

    // تحويل الملف إلى Base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // حذف مرفق
    const handleDelete = (index) => {
        const attachment = localAttachments[index];
        const updatedAttachments = localAttachments.filter((_, i) => i !== index);
        updateAttachments(updatedAttachments);

        if (onDelete) {
            onDelete(attachment);
        }
    };

    // إعادة تسمية مرفق
    const handleRename = (index, name) => {
        const updatedAttachments = [...localAttachments];
        updatedAttachments[index] = {
            ...updatedAttachments[index],
            name: name,
        };
        updateAttachments(updatedAttachments);

        if (onRename) {
            onRename(updatedAttachments[index]);
        }

        setRenamingIndex(null);
        setNewName('');
    };

    // بدء إعادة التسمية
    const startRename = (index) => {
        setRenamingIndex(index);
        setNewName(localAttachments[index].name);
    };

    // السحب والإفلات
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDrop = (e, index) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            const updatedAttachments = [...localAttachments];
            const [draggedItem] = updatedAttachments.splice(draggedIndex, 1);
            updatedAttachments.splice(index, 0, draggedItem);
            updateAttachments(updatedAttachments);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // إضافة من الماسح
    const handleScanComplete = (scannedAttachments) => {
        const updatedAttachments = [...localAttachments, ...scannedAttachments];
        updateAttachments(updatedAttachments);
        setShowScannerModal(false);
    };

    // حفظ الصورة المعدلة
    const handleSaveEditedImage = (editedImage) => {
        if (editingAttachment !== null) {
            const updatedAttachments = [...localAttachments];
            updatedAttachments[editingAttachment] = {
                ...updatedAttachments[editingAttachment],
                data: editedImage.data,
                name: editedImage.name || updatedAttachments[editingAttachment].name,
                editedAt: new Date().toISOString(),
            };
            updateAttachments(updatedAttachments);
        }
        setEditingAttachment(null);
    };

    // عرض المعاينة
    const handlePreview = (index) => {
        const attachment = localAttachments[index];
        const fileType = getFileType(attachment.type);

        if (fileType === 'image') {
            setSelectedAttachment(index);
        } else if (fileType === 'pdf') {
            setViewingPDF(attachment);
        } else {
            // تحميل الملف مباشرة
            handleDownload(index);
        }
    };

    // تحميل الملف
    const handleDownload = (index) => {
        const attachment = localAttachments[index];
        const link = document.createElement('a');
        link.href = attachment.data;
        link.download = attachment.name;
        link.click();
    };

    // الحصول على أيقونة الملف
    const getFileIcon = (attachment) => {
        const fileType = getFileType(attachment.type);

        switch (fileType) {
            case 'pdf':
                return <Icons.PDF />;
            case 'document':
                return <Icons.Word />;
            case 'spreadsheet':
                return <Icons.Excel />;
            default:
                return <Icons.File />;
        }
    };

    // عرض الصورة المصغرة
    const renderThumbnail = (attachment, index) => {
        const fileType = getFileType(attachment.type);

        if (fileType === 'image') {
            return (
                <img
                    src={attachment.data}
                    alt={attachment.name}
                    className="w-full h-full object-cover"
                />
            );
        } else if (fileType === 'pdf') {
            return (
                <PDFThumbnail
                    fileUrl={attachment.data}
                    className="w-full h-full"
                />
            );
        } else {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700/50">
                    {getFileIcon(attachment)}
                </div>
            );
        }
    };

    return (
        <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800 ${className}`} dir="rtl">
            {/* رأس المكون */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">المرفقات</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {localAttachments.length} / {maxFiles} ملف
                        </p>
                    </div>

                    {!readOnly && (
                        <div className="flex gap-2">
                            {showUpload && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 flex items-center gap-2"
                                >
                                    <Icons.Upload />
                                    <span>رفع ملف</span>
                                </button>
                            )}

                            {showScanner && (
                                <button
                                    onClick={() => setShowScannerModal(true)}
                                    className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 flex items-center gap-2"
                                >
                                    <Icons.Scanner />
                                    <span>مسح ضوئي</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* حقل رفع الملفات */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={acceptedTypes}
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                />
            </div>

            {/* رسالة الخطأ */}
            {error && (
                <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>
                        <Icons.Close />
                    </button>
                </div>
            )}

            {/* شريط التقدم */}
            {isUploading && (
                <div className="mx-4 mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                        <span>جاري رفع الملفات...</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* قائمة المرفقات */}
            <div className="p-4">
                {localAttachments.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {localAttachments.map((attachment, index) => (
                            <div
                                key={attachment.id || index}
                                draggable={!readOnly}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`relative group rounded-xl border-2 overflow-hidden transition-all cursor-pointer
                                    ${dragOverIndex === index ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}
                                    ${draggedIndex === index ? 'opacity-50' : ''}
                                    hover:border-gray-300 hover:shadow-md`}
                                onClick={() => handlePreview(index)}
                            >
                                {/* الصورة المصغرة */}
                                <div className="aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-700/50">
                                    {renderThumbnail(attachment, index)}
                                </div>

                                {/* اسم الملف */}
                                <div className="p-2 bg-white dark:bg-gray-900 border-t">
                                    {renamingIndex === index ? (
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            onBlur={() => handleRename(index, newName)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRename(index, newName);
                                                if (e.key === 'Escape') setRenamingIndex(null);
                                            }}
                                            className="w-full px-2 py-1 text-xs border rounded"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <div className="text-xs text-gray-600 dark:text-gray-300 truncate" title={attachment.name}>
                                            {attachment.name}
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-400">
                                        {formatFileSize(attachment.size)}
                                    </div>
                                </div>

                                {/* أزرار الإجراءات */}
                                {!readOnly && (
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {getFileType(attachment.type) === 'image' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingAttachment(index);
                                                }}
                                                className="p-1.5 bg-white dark:bg-gray-900 rounded-lg shadow hover:bg-blue-50"
                                                title="تعديل"
                                            >
                                                <Icons.Edit />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startRename(index);
                                            }}
                                            className="p-1.5 bg-white dark:bg-gray-900 rounded-lg shadow hover:bg-yellow-50"
                                            title="إعادة تسمية"
                                        >
                                            <Icons.Rename />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(index);
                                            }}
                                            className="p-1.5 bg-white dark:bg-gray-900 rounded-lg shadow hover:bg-green-50"
                                            title="تحميل"
                                        >
                                            <Icons.Download />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(index);
                                            }}
                                            className="p-1.5 bg-white dark:bg-gray-900 rounded-lg shadow hover:bg-red-50 text-red-600 dark:text-red-400"
                                            title="حذف"
                                        >
                                            <Icons.Delete />
                                        </button>
                                    </div>
                                )}

                                {/* مقبض السحب */}
                                {!readOnly && (
                                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                                        <div className="p-1 bg-white dark:bg-gray-900 rounded shadow text-gray-400">
                                            <Icons.Grip />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* زر إضافة مرفق */}
                        {!readOnly && localAttachments.length < maxFiles && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
                            >
                                <Icons.Plus />
                                <span className="text-sm mt-2">إضافة ملف</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center">
                            <Icons.Upload />
                        </div>
                        <p>لا توجد مرفقات</p>
                        {!readOnly && (
                            <p className="text-sm mt-1">اسحب الملفات هنا أو اضغط على "رفع ملف"</p>
                        )}
                    </div>
                )}
            </div>

            {/* نافذة الماسح الضوئي */}
            {showScannerModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-bold text-lg">المسح الضوئي</h3>
                            <button
                                onClick={() => setShowScannerModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <Icons.Close />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                            <ScannerInterface
                                onScanComplete={handleScanComplete}
                                transactionId={transactionId}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* معاينة الصورة */}
            {selectedAttachment !== null && localAttachments[selectedAttachment] && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedAttachment(null)}
                >
                    <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={localAttachments[selectedAttachment].data}
                            alt={localAttachments[selectedAttachment].name}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg"
                        />
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-white/90 rounded-lg p-2">
                            <button
                                onClick={() => setEditingAttachment(selectedAttachment)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                                title="تعديل"
                            >
                                <Icons.Edit />
                            </button>
                            <button
                                onClick={() => handleDownload(selectedAttachment)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                                title="تحميل"
                            >
                                <Icons.Download />
                            </button>
                        </div>
                        <button
                            onClick={() => setSelectedAttachment(null)}
                            className="absolute top-4 left-4 p-2 bg-white/90 rounded-lg hover:bg-white"
                        >
                            <Icons.Close />
                        </button>
                    </div>
                </div>
            )}

            {/* محرر الصور */}
            {editingAttachment !== null && localAttachments[editingAttachment] && (
                <ImageEditor
                    image={localAttachments[editingAttachment].data}
                    fileName={localAttachments[editingAttachment].name}
                    onSave={handleSaveEditedImage}
                    onClose={() => setEditingAttachment(null)}
                />
            )}

            {/* عارض PDF */}
            {viewingPDF && (
                <PDFViewer
                    fileUrl={viewingPDF.data}
                    fileName={viewingPDF.name}
                    onClose={() => setViewingPDF(null)}
                    onRename={(newName) => {
                        const index = localAttachments.findIndex(a => a.id === viewingPDF.id);
                        if (index !== -1) {
                            handleRename(index, newName);
                        }
                    }}
                />
            )}
        </div>
    );
}
