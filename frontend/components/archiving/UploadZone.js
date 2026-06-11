/**
 * UploadZone Component - منطقة رفع الملفات
 * Drag & Drop area لرفع المستندات مع معاينة وProgress bar
 *
 * @version 1.0.0
 * @date 2026-02-14
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { Badge } from '../ui';

const UploadZone = ({
  onFilesSelected,
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'],
  multiple = true,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // تنسيق حجم الملف
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} بايت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  };

  // التحقق من صحة الملف
  const validateFile = (file) => {
    const errors = [];

    // فحص الحجم
    if (file.size > maxFileSize) {
      errors.push(`حجم الملف يتجاوز الحد الأقصى ${formatFileSize(maxFileSize)}`);
    }

    // فحص النوع
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!acceptedFileTypes.includes(ext)) {
      errors.push(`نوع الملف ${ext} غير مدعوم`);
    }

    return errors;
  };

  // معالجة الملفات المختارة
  const handleFiles = useCallback((newFiles) => {
    const fileList = Array.from(newFiles);

    // فحص عدد الملفات
    if (files.length + fileList.length > maxFiles) {
      alert(`يمكنك رفع ${maxFiles} ملف كحد أقصى`);
      return;
    }

    // التحقق من كل ملف
    const validatedFiles = fileList.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: URL.createObjectURL(file),
      errors: validateFile(file),
      status: 'pending', // pending, uploading, success, error
    }));

    setFiles(prev => [...prev, ...validatedFiles]);

    // استدعاء callback
    const validFiles = validatedFiles.filter(f => f.errors.length === 0);
    if (validFiles.length > 0 && onFilesSelected) {
      onFilesSelected(validFiles.map(f => f.file));
    }
  }, [files.length, maxFiles, onFilesSelected]);

  // Drag & Drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  // معالجة اختيار الملفات من المتصفح
  const handleFileInput = (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // فتح نافذة اختيار الملف
  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // حذف ملف
  const removeFile = (fileId) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // تنظيف URL.createObjectURL
      const removed = prev.find(f => f.id === fileId);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  // مسح الكل
  const clearAll = () => {
    files.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
    setUploadProgress({});
    setErrors({});
  };

  // أيقونة حسب نوع الملف
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️';
    return '📎';
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        <CloudArrowUpIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />

        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
          {isDragging ? 'أفلت الملفات هنا' : 'اسحب وأفلت الملفات هنا'}
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          أو انقر لاختيار الملفات من جهازك
        </p>

        <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div>
            الحد الأقصى: {maxFiles} ملف
          </div>
          <div>•</div>
          <div>
            حجم الملف: {formatFileSize(maxFileSize)}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {acceptedFileTypes.slice(0, 5).map((type, i) => (
            <Badge key={i} variant="outline" size="sm">
              {type}
            </Badge>
          ))}
          {acceptedFileTypes.length > 5 && (
            <Badge variant="outline" size="sm">
              +{acceptedFileTypes.length - 5}
            </Badge>
          )}
        </div>
      </div>

      {/* قائمة الملفات المحددة */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-700 dark:text-gray-200">
              الملفات المحددة ({files.length})
            </h4>
            <button
              onClick={clearAll}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 font-medium"
            >
              مسح الكل
            </button>
          </div>

          <div className="space-y-2">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className={`
                  flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border
                  ${fileItem.errors.length > 0
                    ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                {/* File Icon */}
                <div className="text-3xl flex-shrink-0">
                  {getFileIcon(fileItem.name)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {fileItem.name}
                    </p>
                    {fileItem.status === 'success' && (
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                    {fileItem.errors.length > 0 && (
                      <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(fileItem.size)}
                  </p>

                  {/* Errors */}
                  {fileItem.errors.length > 0 && (
                    <div className="mt-1">
                      {fileItem.errors.map((error, i) => (
                        <p key={i} className="text-xs text-red-600 dark:text-red-400">
                          • {error}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Progress Bar */}
                  {uploadProgress[fileItem.id] !== undefined && (
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${uploadProgress[fileItem.id]}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {uploadProgress[fileItem.id]}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(fileItem.id)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  title="حذف"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
