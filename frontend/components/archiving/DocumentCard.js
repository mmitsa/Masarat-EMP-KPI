/**
 * DocumentCard Component - بطاقة عرض مستند
 * عرض معلومات المستند بشكل مرئي جذاب
 *
 * @version 1.0.0
 * @date 2026-02-14
 */

import React from 'react';
import { Badge } from '../ui';
import {
  DocumentTextIcon,
  FolderIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  LockClosedIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const DocumentCard = ({
  document,
  onView,
  onDownload,
  showCabinet = true,
  compact = false
}) => {
  const {
    id,
    title,
    titleAr,
    description,
    fileName,
    fileExtension,
    fileSize,
    cabinetName,
    classificationName,
    createdAt,
    tags = [],
    securityLevel,
    isArchived,
  } = document;

  const displayTitle = titleAr || title || fileName;

  // أيقونة حسب نوع الملف
  const getFileIcon = () => {
    const ext = fileExtension?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️';
    return '📎';
  };

  // لون حسب مستوى السرية
  const getSecurityColor = () => {
    const colors = {
      Public: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      Internal: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      Confidential: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
      Secret: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
      TopSecret: 'bg-red-200 text-red-900',
    };
    return colors[securityLevel] || colors.Public;
  };

  // تنسيق حجم الملف
  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} بايت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  };

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 hover:bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-700 transition-all cursor-pointer group"
        onClick={() => onView?.(document)}
      >
        <div className="text-3xl">{getFileIcon()}</div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600">
            {displayTitle}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(fileSize)} • {formatDate(createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${getSecurityColor()}`}>
            {securityLevel}
          </span>
          {isArchived && (
            <Badge variant="success" size="sm">مؤرشف</Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-900/20 hover:shadow-md transition-all overflow-hidden group">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-l from-blue-50 to-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-4xl">{getFileIcon()}</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600">
                {displayTitle}
              </h3>
              {description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>

          {isArchived && (
            <Badge variant="success" className="flex-shrink-0">
              <LockClosedIcon className="w-4 h-4 ml-1" />
              مؤرشف
            </Badge>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {showCabinet && cabinetName && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <FolderIcon className="w-4 h-4 text-gray-400" />
              <span className="truncate">{cabinetName}</span>
            </div>
          )}

          {classificationName && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <DocumentTextIcon className="w-4 h-4 text-gray-400" />
              <span className="truncate">{classificationName}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <span>{formatDate(createdAt)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${getSecurityColor()} font-medium`}>
              {securityLevel}
            </span>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <TagIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" size="sm">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">+{tags.length - 3}</span>
            )}
          </div>
        )}

        {/* File Info */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-mono bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded">
              {fileName}
            </span>
            <span className="mx-2">•</span>
            <span>{formatFileSize(fileSize)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
        <button
          onClick={() => onView?.(document)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <EyeIcon className="w-4 h-4" />
          عرض
        </button>

        <button
          onClick={() => onDownload?.(document)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          تحميل
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;
