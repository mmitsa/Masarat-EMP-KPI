/**
 * محرر مواد قرار الإجازة
 * Article Editor Component
 */

import React, { useState, useEffect } from 'react';
import {
    PlusIcon,
    XMarkIcon,
    CheckIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { ContentCard, Button, Input, Select } from '../../../ui';
import { LEAVE_TYPES, getLeaveTypesOptions } from '../../../../constants/leave-types';

const ArticleEditor = ({
    article = null,
    onSave,
    onCancel,
    loading = false,
}) => {
    const [formData, setFormData] = useState({
        number: '',
        text: '',
        leaveType: 'all',
        reference: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (article) {
            setFormData({
                number: article.number || '',
                text: article.text || '',
                leaveType: article.leaveType || 'all',
                reference: article.reference || '',
            });
        } else {
            resetForm();
        }
    }, [article]);

    const resetForm = () => {
        setFormData({
            number: '',
            text: '',
            leaveType: 'all',
            reference: '',
        });
        setErrors({});
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // مسح الخطأ عند التعديل
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.number?.trim()) {
            newErrors.number = 'رقم المادة مطلوب';
        }

        if (!formData.text?.trim()) {
            newErrors.text = 'نص المادة مطلوب';
        } else if (formData.text.length < 10) {
            newErrors.text = 'نص المادة قصير جداً';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;

        onSave?.({
            ...article,
            ...formData,
            id: article?.id || Date.now(),
        });

        if (!article) {
            resetForm();
        }
    };

    const handleCancel = () => {
        resetForm();
        onCancel?.();
    };

    // خيارات أنواع الإجازات
    const leaveTypeOptions = [
        { value: 'all', label: 'عام (جميع الأنواع)' },
        ...Object.entries(LEAVE_TYPES).map(([code, type]) => ({
            value: code,
            label: `${type.name} (${code})`,
        })),
    ];

    const isEditing = !!article;

    return (
        <ContentCard
            title={isEditing ? 'تعديل المادة' : 'إضافة مادة جديدة'}
            icon={<DocumentTextIcon className="w-5 h-5" />}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* رقم المادة */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            رقم المادة <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.number}
                            onChange={(e) => handleChange('number', e.target.value)}
                            placeholder="مثال: 109"
                            error={errors.number}
                        />
                        {errors.number && (
                            <p className="mt-1 text-sm text-red-500">{errors.number}</p>
                        )}
                    </div>

                    {/* نوع الإجازة المرتبطة */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            نوع الإجازة المرتبطة
                        </label>
                        <Select
                            value={formData.leaveType}
                            onChange={(e) => handleChange('leaveType', e.target.value)}
                            options={leaveTypeOptions}
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            اختر "عام" لتظهر المادة مع جميع أنواع الإجازات
                        </p>
                    </div>
                </div>

                {/* نص المادة */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        نص المادة <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.text}
                        onChange={(e) => handleChange('text', e.target.value)}
                        placeholder="أدخل نص المادة القانونية..."
                        rows={4}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 resize-none ${
                            errors.text ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'
                        }`}
                    />
                    {errors.text && (
                        <p className="mt-1 text-sm text-red-500">{errors.text}</p>
                    )}
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-left">
                        {formData.text.length} حرف
                    </div>
                </div>

                {/* المرجع القانوني */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        المرجع القانوني
                    </label>
                    <Input
                        value={formData.reference}
                        onChange={(e) => handleChange('reference', e.target.value)}
                        placeholder="مثال: نظام العمل السعودي، اللائحة الداخلية..."
                    />
                </div>

                {/* الأزرار */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    {(isEditing || onCancel) && (
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            icon={<XMarkIcon className="w-4 h-4" />}
                        >
                            إلغاء
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={loading}
                        icon={isEditing ? <CheckIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                    >
                        {loading ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديلات' : 'إضافة المادة'}
                    </Button>
                </div>
            </div>
        </ContentCard>
    );
};

export default ArticleEditor;
