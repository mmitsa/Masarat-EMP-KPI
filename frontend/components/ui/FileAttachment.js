import React, { useState, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import api from '../../lib/api';

/**
 * أنواع الملفات المسموحة - متوافق مع FileStorageSettings في الباك إند
 */
const FILE_TYPE_CONFIG = {
    image: {
        accept: 'image/jpeg,image/png,image/gif,image/webp,image/bmp,image/svg+xml',
        icon: '🖼️',
        label: 'صور',
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
    },
    document: {
        accept: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv',
        icon: '📄',
        label: 'مستندات',
        extensions: ['.pdf', '.doc', '.docx', '.txt', '.csv']
    },
    spreadsheet: {
        accept: 'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        icon: '📊',
        label: 'جداول',
        extensions: ['.xls', '.xlsx']
    },
    presentation: {
        accept: 'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
        icon: '📽️',
        label: 'عروض',
        extensions: ['.ppt', '.pptx']
    },
    archive: {
        accept: 'application/zip,application/vnd.rar,application/x-7z-compressed',
        icon: '📦',
        label: 'ملفات مضغوطة',
        extensions: ['.zip', '.rar', '.7z']
    },
    all: {
        accept: 'image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml,.zip,.rar,.7z',
        icon: '📎',
        label: 'ملفات',
        extensions: []
    }
};

/**
 * أيقونات الملفات حسب النوع
 */
const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconMap = {
        pdf: '📄', doc: '📝', docx: '📝',
        xls: '📊', xlsx: '📊', csv: '📊',
        ppt: '📽️', pptx: '📽️',
        jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', bmp: '🖼️', svg: '🖼️',
        zip: '📦', rar: '📦', '7z': '📦',
        txt: '📝', json: '📋', xml: '📋',
    };
    return iconMap[ext] || '📎';
};

/**
 * تنسيق حجم الملف
 */
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'ك.ب', 'م.ب', 'ج.ب'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * FileAttachment Component - مكون رفع وإدارة المرفقات
 * متكامل مع IFileStorageService في الباك إند
 *
 * @example
 * // رفع بسيط بدون باك إند
 * <FileAttachment files={files} onChange={setFiles} />
 *
 * @example
 * // رفع مع ربط الباك إند
 * <FileAttachment
 *   files={files}
 *   onChange={setFiles}
 *   module="archiving"
 *   entityType="transactions"
 *   entityId={transactionId}
 *   onUploadComplete={(fileId, result) => console.log('تم الرفع:', result)}
 * />
 */
const FileAttachment = memo(function FileAttachment({
    files = [],
    onChange,
    maxFiles = 5,
    maxSizeMB = 10,
    allowedTypes = ['all'],
    disabled = false,
    label = 'المرفقات',
    helperText,
    required = false,
    error,
    className = '',
    module,
    entityType,
    entityId,
    uploadEndpoint,
    onUploadComplete,
    onUploadError,
    showPreview = true,
}) {
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [errors, setErrors] = useState([]);

    // حساب أنواع الملفات المسموحة
    const acceptedTypes = allowedTypes.includes('all')
        ? FILE_TYPE_CONFIG.all.accept
        : allowedTypes.map(t => FILE_TYPE_CONFIG[t]?.accept).filter(Boolean).join(',');

    // بناء endpoint الرفع من الموديول
    const resolvedEndpoint = uploadEndpoint || (module && entityType
        ? `/api/${module}/${entityType}${entityId ? `/${entityId}` : ''}/attachments`
        : null);

    // التحقق من صحة الملف
    const validateFile = (file) => {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;

        if (file.size > maxSizeBytes) {
            return `الملف "${file.name}" يتجاوز الحد الأقصى (${maxSizeMB} م.ب)`;
        }

        if (file.size === 0) {
            return `الملف "${file.name}" فارغ`;
        }

        return null;
    };

    // معالجة إضافة الملفات
    const handleAddFiles = async (newFiles) => {
        const fileArray = Array.from(newFiles);
        const validationErrors = [];
        const validFiles = [];

        if (files.length + fileArray.length > maxFiles) {
            validationErrors.push(`يمكنك إضافة ${maxFiles} ملفات كحد أقصى`);
            setErrors(validationErrors);
            return;
        }

        for (const file of fileArray) {
            const validationError = validateFile(file);
            if (validationError) {
                validationErrors.push(validationError);
            } else {
                const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                validFiles.push({
                    id: fileId,
                    file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    status: 'pending',
                    progress: 0,
                    url: null,
                    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
                });
            }
        }

        setErrors(validationErrors);

        if (validFiles.length > 0) {
            const updatedFiles = [...files, ...validFiles];
            onChange(updatedFiles);

            if (resolvedEndpoint) {
                for (const fileData of validFiles) {
                    await uploadFile(fileData, updatedFiles);
                }
            }
        }
    };

    // رفع ملف واحد عبر API
    const uploadFile = async (fileData, allFiles) => {
        try {
            updateFileStatus(fileData.id, { status: 'uploading', progress: 10 }, allFiles);

            const formData = new FormData();
            formData.append('file', fileData.file);
            if (entityId) formData.append('entityId', entityId);
            if (entityType) formData.append('entityType', entityType);

            updateFileStatus(fileData.id, { progress: 30 }, allFiles);

            const response = await fetch(resolvedEndpoint, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            updateFileStatus(fileData.id, { progress: 80 }, allFiles);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'فشل رفع الملف');
            }

            const result = await response.json();

            updateFileStatus(fileData.id, {
                status: 'uploaded',
                progress: 100,
                url: result.url || result.fileUrl || result.Url,
                serverId: result.id || result.fileId || result.fileKey || result.FileKey,
            }, allFiles);

            onUploadComplete?.(fileData.id, result);
        } catch (uploadError) {
            console.warn('خطأ في رفع الملف:', uploadError);
            updateFileStatus(fileData.id, {
                status: 'error',
                error: uploadError.message
            }, allFiles);
            onUploadError?.(fileData.id, uploadError);
        }
    };

    // تحديث حالة ملف معين
    const updateFileStatus = (fileId, updates, allFiles) => {
        const updatedFiles = (allFiles || files).map(f =>
            f.id === fileId ? { ...f, ...updates } : f
        );
        onChange(updatedFiles);
    };

    // حذف ملف
    const handleRemoveFile = (fileId) => {
        const fileToRemove = files.find(f => f.id === fileId);
        if (fileToRemove?.previewUrl) {
            URL.revokeObjectURL(fileToRemove.previewUrl);
        }
        onChange(files.filter(f => f.id !== fileId));
    };

    // السحب والإفلات
    const handleDragOver = (e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!disabled && e.dataTransfer.files.length > 0) {
            handleAddFiles(e.dataTransfer.files);
        }
    };

    const handleClick = () => {
        if (!disabled) fileInputRef.current?.click();
    };

    return (
        <div className={`file-attachment ${className}`}>
            {/* Label */}
            {label && (
                <label className="block text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--text-primary)] mb-[var(--spacing-2)]">
                    {label}
                    {required && <span className="text-[var(--color-error)] mr-[var(--spacing-1)]">*</span>}
                </label>
            )}

            {/* منطقة السحب والإفلات */}
            <div
                className={`
                    border-2 border-dashed rounded-[var(--card-radius)] p-[var(--spacing-6)] text-center cursor-pointer transition-all
                    ${isDragging
                        ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                        : 'border-[var(--border-medium)] hover:border-[var(--color-primary-400)]'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${error ? 'border-[var(--color-error)] bg-[var(--color-error-light)]' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedTypes}
                    multiple={maxFiles > 1}
                    onChange={(e) => handleAddFiles(e.target.files)}
                    className="hidden"
                    disabled={disabled}
                />

                <div className="flex flex-col items-center gap-[var(--spacing-2)]">
                    <div className="w-12 h-12 rounded-[var(--radius-full)] bg-[var(--color-primary-50)] flex items-center justify-center">
                        <svg className="w-6 h-6 text-[var(--color-primary-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <p className="text-[var(--font-size-sm)] text-[var(--text-secondary)]">
                        اسحب الملفات هنا أو <span className="text-[var(--color-primary-500)] font-[var(--font-weight-medium)]">اضغط للاختيار</span>
                    </p>
                    <p className="text-[var(--font-size-xs)] text-[var(--text-tertiary)]">
                        الحد الأقصى: {maxFiles} ملفات، {maxSizeMB} م.ب لكل ملف
                    </p>
                </div>
            </div>

            {/* Helper Text */}
            {helperText && !error && (
                <p className="mt-[var(--spacing-1)] text-[var(--font-size-xs)] text-[var(--text-tertiary)]">{helperText}</p>
            )}

            {/* Error Messages */}
            {(error || errors.length > 0) && (
                <div className="mt-[var(--spacing-2)] space-y-1">
                    {error && <p className="text-[var(--font-size-xs)] text-[var(--color-error)]">{error}</p>}
                    {errors.map((err, idx) => (
                        <p key={idx} className="text-[var(--font-size-xs)] text-[var(--color-error)]">{err}</p>
                    ))}
                </div>
            )}

            {/* قائمة الملفات المرفقة */}
            {files.length > 0 && (
                <div className="mt-[var(--spacing-4)] space-y-[var(--spacing-2)]">
                    <p className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--text-primary)]">
                        الملفات المرفقة ({files.length}/{maxFiles})
                    </p>
                    <div className="space-y-[var(--spacing-2)]">
                        {files.map((fileData) => (
                            <FileItem
                                key={fileData.id}
                                file={fileData}
                                onRemove={() => handleRemoveFile(fileData.id)}
                                showPreview={showPreview}
                                disabled={disabled}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

/**
 * FileItem - عنصر ملف واحد
 */
const FileItem = memo(function FileItem({ file, onRemove, showPreview, disabled }) {
    return (
        <div className={`
            flex items-center gap-[var(--spacing-3)] p-[var(--spacing-3)] rounded-[var(--radius-lg)] border transition-all
            ${file.status === 'error'
                ? 'bg-[var(--color-error-light)] border-[var(--color-error)]'
                : 'bg-[var(--color-background-soft)] border-[var(--card-border,var(--border-light))]'}
            ${file.status === 'uploading' ? 'animate-pulse' : ''}
        `}>
            {/* معاينة أو أيقونة */}
            {showPreview && file.previewUrl ? (
                <img src={file.previewUrl} alt={file.name} className="w-10 h-10 rounded-[var(--radius-md)] object-cover" />
            ) : (
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--card-bg,var(--bg-primary))] border border-[var(--card-border,var(--border-light))] flex items-center justify-center text-xl">
                    {getFileIcon(file.name)}
                </div>
            )}

            {/* معلومات الملف */}
            <div className="flex-1 min-w-0">
                <p className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--text-primary)] truncate">{file.name}</p>
                <div className="flex items-center gap-[var(--spacing-2)] text-[var(--font-size-xs)] text-[var(--text-tertiary)]">
                    <span>{formatFileSize(file.size)}</span>
                    {file.status === 'uploading' && (
                        <span className="text-[var(--color-primary-500)]">جاري الرفع... {file.progress}%</span>
                    )}
                    {file.status === 'uploaded' && (
                        <span className="text-[var(--color-success)]">✓ تم الرفع</span>
                    )}
                    {file.status === 'error' && (
                        <span className="text-[var(--color-error)]">✗ {file.error || 'فشل الرفع'}</span>
                    )}
                </div>

                {/* شريط التقدم */}
                {file.status === 'uploading' && (
                    <div className="mt-[var(--spacing-1)] w-full h-1 bg-[var(--color-background-medium)] rounded-[var(--radius-full)] overflow-hidden">
                        <div
                            className="h-full bg-[var(--color-primary-500)] transition-all"
                            style={{ width: `${file.progress}%` }}
                        />
                    </div>
                )}
            </div>

            {/* زر الحذف */}
            <button
                type="button"
                onClick={onRemove}
                disabled={disabled || file.status === 'uploading'}
                className={`
                    p-[var(--spacing-1)] rounded-[var(--btn-radius)] text-[var(--text-tertiary)]
                    hover:text-[var(--color-error)] hover:bg-[var(--color-error-light)] transition-colors
                    ${disabled || file.status === 'uploading' ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title="حذف الملف"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
});

FileAttachment.displayName = 'FileAttachment';

FileAttachment.propTypes = {
    /** قائمة الملفات المرفقة */
    files: PropTypes.array,
    /** دالة التحديث */
    onChange: PropTypes.func.isRequired,
    /** الحد الأقصى لعدد الملفات */
    maxFiles: PropTypes.number,
    /** الحد الأقصى لحجم الملف بالميغابايت */
    maxSizeMB: PropTypes.number,
    /** أنواع الملفات المسموحة */
    allowedTypes: PropTypes.arrayOf(PropTypes.oneOf(['image', 'document', 'spreadsheet', 'presentation', 'archive', 'all'])),
    /** تعطيل المكون */
    disabled: PropTypes.bool,
    /** عنوان الحقل */
    label: PropTypes.string,
    /** نص المساعدة */
    helperText: PropTypes.string,
    /** حقل مطلوب */
    required: PropTypes.bool,
    /** رسالة خطأ */
    error: PropTypes.string,
    /** Classes إضافية */
    className: PropTypes.string,
    /** اسم الموديول (hr, warehouse, archiving, etc.) - يبني الـ endpoint تلقائياً */
    module: PropTypes.string,
    /** نوع الكيان (transactions, employees, receipts, etc.) */
    entityType: PropTypes.string,
    /** معرف الكيان */
    entityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** نقطة نهاية الرفع (يتجاوز module/entityType) */
    uploadEndpoint: PropTypes.string,
    /** دالة اكتمال الرفع */
    onUploadComplete: PropTypes.func,
    /** دالة خطأ الرفع */
    onUploadError: PropTypes.func,
    /** إظهار المعاينة للصور */
    showPreview: PropTypes.bool,
};

export default FileAttachment;
