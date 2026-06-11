/**
 * لوحة تصدير الإجازات
 * Leave Export Panel Component
 */

import React, { useState } from 'react';
import {
    ArrowDownTrayIcon,
    DocumentArrowDownIcon,
    TableCellsIcon,
    DocumentTextIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';
import { ContentCard, Button, Select, Badge } from '../../../ui';
import { LEAVE_TYPES } from '../../../../constants/leave-types';

const LeaveExportPanel = ({
    onExport,
    loading = false,
    data = null,
}) => {
    const [settings, setSettings] = useState({
        format: 'excel',
        leaveType: '',
        departmentId: '',
        includeUsed: true,
        includeRemaining: true,
        includeCarried: true,
        numberFormat: 'english',
    });

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleExport = (format) => {
        onExport?.({ ...settings, format });
    };

    // خيارات أنواع الإجازات
    const leaveTypeOptions = [
        { value: '', label: 'جميع الأنواع' },
        ...Object.entries(LEAVE_TYPES).map(([code, type]) => ({
            value: code,
            label: type.name,
        })),
    ];

    // خيارات صيغة الأرقام
    const numberFormatOptions = [
        { value: 'english', label: 'أرقام إنجليزية (1234)' },
        { value: 'arabic', label: 'أرقام عربية (١٢٣٤)' },
    ];

    // صيغ التصدير
    const exportFormats = [
        {
            id: 'excel',
            name: 'Excel',
            icon: TableCellsIcon,
            description: 'ملف Excel (.xlsx)',
            color: 'green',
        },
        {
            id: 'pdf',
            name: 'PDF',
            icon: DocumentTextIcon,
            description: 'ملف PDF للطباعة',
            color: 'red',
        },
        {
            id: 'csv',
            name: 'CSV',
            icon: DocumentArrowDownIcon,
            description: 'ملف CSV للاستيراد',
            color: 'blue',
        },
    ];

    return (
        <ContentCard
            title="إعدادات التصدير"
            icon={<ArrowDownTrayIcon className="w-5 h-5" />}
        >
            <div className="space-y-6">
                {/* الفلاتر */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* نوع الإجازة */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            نوع الإجازة
                        </label>
                        <Select
                            value={settings.leaveType}
                            onChange={(e) => handleChange('leaveType', e.target.value)}
                            options={leaveTypeOptions}
                        />
                    </div>

                    {/* صيغة الأرقام */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            صيغة الأرقام
                        </label>
                        <Select
                            value={settings.numberFormat}
                            onChange={(e) => handleChange('numberFormat', e.target.value)}
                            options={numberFormatOptions}
                        />
                    </div>
                </div>

                {/* الخيارات */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                        البيانات المضمنة
                    </label>
                    <div className="flex flex-wrap gap-4">
                        <CheckboxOption
                            checked={settings.includeUsed}
                            onChange={(e) => handleChange('includeUsed', e.target.checked)}
                            label="المستخدم"
                        />
                        <CheckboxOption
                            checked={settings.includeRemaining}
                            onChange={(e) => handleChange('includeRemaining', e.target.checked)}
                            label="المتبقي"
                        />
                        <CheckboxOption
                            checked={settings.includeCarried}
                            onChange={(e) => handleChange('includeCarried', e.target.checked)}
                            label="المرحّل"
                        />
                    </div>
                </div>

                {/* معاينة البيانات */}
                {data && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className="flex items-center gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">عدد السجلات: </span>
                                <span className="font-bold">{data.length || 0}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">آخر تحديث: </span>
                                <span className="font-bold">{new Date().toLocaleTimeString('ar-SA')}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* أزرار التصدير */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                        صيغة الملف
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {exportFormats.map((format) => {
                            const Icon = format.icon;
                            const isSelected = settings.format === format.id;

                            return (
                                <button
                                    key={format.id}
                                    onClick={() => handleExport(format.id)}
                                    disabled={loading}
                                    className={`p-4 rounded-xl border-2 transition-all text-right ${
                                        isSelected
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icon className={`w-5 h-5 text-${format.color}-600`} />
                                                <span className="font-bold text-gray-900 dark:text-white">{format.name}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{format.description}</p>
                                        </div>
                                        {isSelected && (
                                            <CheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* زر التصدير الرئيسي */}
                <div className="flex justify-end pt-4 border-t">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => handleExport(settings.format)}
                        disabled={loading}
                        icon={<ArrowDownTrayIcon className="w-5 h-5" />}
                    >
                        {loading ? 'جاري التصدير...' : 'تصدير الملف'}
                    </Button>
                </div>
            </div>
        </ContentCard>
    );
};

// مكون خيار الاختيار
const CheckboxOption = ({ checked, onChange, label }) => (
    <label className="flex items-center gap-2 cursor-pointer">
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="w-4 h-4 rounded text-blue-600 dark:text-blue-400"
        />
        <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
    </label>
);

export default LeaveExportPanel;
