/**
 * DocumentFilters Component - فلاتر البحث عن المستندات
 * فلاتر متقدمة للبحث والتصفية
 *
 * @version 1.0.0
 * @date 2026-02-14
 */

import React, { useState } from 'react';
import { Input, Select, Button } from '../ui';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const DocumentFilters = ({
  onFilter,
  onReset,
  cabinets = [],
  classifications = [],
  initialFilters = {},
  showAdvanced = false,
}) => {
  const [filters, setFilters] = useState({
    searchTerm: initialFilters.searchTerm || '',
    cabinetId: initialFilters.cabinetId || '',
    classificationId: initialFilters.classificationId || '',
    securityLevel: initialFilters.securityLevel || '',
    isArchived: initialFilters.isArchived || '',
    fromDate: initialFilters.fromDate || '',
    toDate: initialFilters.toDate || '',
    tags: initialFilters.tags || '',
  });

  const [isExpanded, setIsExpanded] = useState(showAdvanced);

  const securityLevels = [
    { value: '', label: 'الكل' },
    { value: 'Public', label: 'عام' },
    { value: 'Internal', label: 'داخلي' },
    { value: 'Confidential', label: 'سري' },
    { value: 'Secret', label: 'سري للغاية' },
    { value: 'TopSecret', label: 'سري جداً' },
  ];

  const archiveStatus = [
    { value: '', label: 'الكل' },
    { value: 'true', label: 'مؤرشف' },
    { value: 'false', label: 'غير مؤرشف' },
  ];

  const handleChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // تنظيف القيم الفارغة
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    onFilter?.(cleanFilters);
  };

  const handleReset = () => {
    const emptyFilters = {
      searchTerm: '',
      cabinetId: '',
      classificationId: '',
      securityLevel: '',
      isArchived: '',
      fromDate: '',
      toDate: '',
      tags: '',
    };
    setFilters(emptyFilters);
    onReset?.(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <Input
              type="text"
              placeholder="ابحث بالعنوان، الوصف، أو رقم الملف..."
              value={filters.searchTerm}
              onChange={(e) => handleChange('searchTerm', e.target.value)}
              icon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
            />
          </div>

          {/* Cabinet Filter */}
          <Select
            value={filters.cabinetId}
            onChange={(e) => handleChange('cabinetId', e.target.value)}
            options={[
              { value: '', label: 'جميع الخزائن' },
              ...cabinets.map(c => ({ value: c.id, label: c.nameAr || c.name }))
            ]}
          />
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700"
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            {isExpanded ? 'إخفاء الفلاتر المتقدمة' : 'فلاتر متقدمة'}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700"
            >
              <XMarkIcon className="w-4 h-4" />
              مسح الفلاتر
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            {/* Classification */}
            <Select
              label="التصنيف"
              value={filters.classificationId}
              onChange={(e) => handleChange('classificationId', e.target.value)}
              options={[
                { value: '', label: 'جميع التصنيفات' },
                ...classifications.map(c => ({
                  value: c.id,
                  label: c.nameAr || c.name
                }))
              ]}
            />

            {/* Security Level */}
            <Select
              label="مستوى السرية"
              value={filters.securityLevel}
              onChange={(e) => handleChange('securityLevel', e.target.value)}
              options={securityLevels}
            />

            {/* Archive Status */}
            <Select
              label="حالة الأرشفة"
              value={filters.isArchived}
              onChange={(e) => handleChange('isArchived', e.target.value)}
              options={archiveStatus}
            />

            {/* Tags */}
            <Input
              label="الوسوم"
              type="text"
              placeholder="فصل الوسوم بفاصلة"
              value={filters.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
            />

            {/* From Date */}
            <Input
              label="من تاريخ"
              type="date"
              value={filters.fromDate}
              onChange={(e) => handleChange('fromDate', e.target.value)}
            />

            {/* To Date */}
            <Input
              label="إلى تاريخ"
              type="date"
              value={filters.toDate}
              onChange={(e) => handleChange('toDate', e.target.value)}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4" />
            تطبيق الفلاتر
          </Button>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
            >
              إعادة تعيين
            </Button>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-600 dark:text-gray-300">الفلاتر النشطة:</span>
            {filters.searchTerm && (
              <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                <span>بحث: {filters.searchTerm}</span>
                <button
                  type="button"
                  onClick={() => handleChange('searchTerm', '')}
                  className="hover:text-blue-900"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            {filters.cabinetId && (
              <div className="flex items-center gap-1 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                <span>
                  خزينة: {cabinets.find(c => c.id === filters.cabinetId)?.nameAr}
                </span>
                <button
                  type="button"
                  onClick={() => handleChange('cabinetId', '')}
                  className="hover:text-purple-900"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            {filters.classificationId && (
              <div className="flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm">
                <span>
                  تصنيف: {classifications.find(c => c.id === filters.classificationId)?.nameAr}
                </span>
                <button
                  type="button"
                  onClick={() => handleChange('classificationId', '')}
                  className="hover:text-green-900"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            {filters.securityLevel && (
              <div className="flex items-center gap-1 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 rounded-full text-sm">
                <span>
                  سرية: {securityLevels.find(s => s.value === filters.securityLevel)?.label}
                </span>
                <button
                  type="button"
                  onClick={() => handleChange('securityLevel', '')}
                  className="hover:text-yellow-900"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default DocumentFilters;
