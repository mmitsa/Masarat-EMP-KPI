/**
 * نموذج إضافة استثناء موافقة
 * Approval Exception Form Component
 */

import React, { useState, useEffect } from 'react';
import {
    ShieldExclamationIcon,
    PlusIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { ContentCard, Button, Input, Select } from '../../../ui';
import { LEAVE_TYPES, APPROVAL_LEVELS } from '../../../../constants/leave-types';

const ApprovalExceptionForm = ({
    exception = null,
    employees = [],
    onSave,
    onCancel,
    loading = false,
}) => {
    const [formData, setFormData] = useState({
        leaveType: '',
        employeeId: '',
        exemptLevel: '',
        validFrom: '',
        validTo: '',
        reason: '',
        isActive: true,
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (exception) {
            setFormData({
                leaveType: exception.leaveType || '',
                employeeId: exception.employeeId?.toString() || '',
                exemptLevel: exception.exemptLevel || '',
                validFrom: exception.validFrom || '',
                validTo: exception.validTo || '',
                reason: exception.reason || '',
                isActive: exception.isActive !== false,
            });
        } else {
            resetForm();
        }
    }, [exception]);

    const resetForm = () => {
        setFormData({
            leaveType: '',
            employeeId: '',
            exemptLevel: '',
            validFrom: '',
            validTo: '',
            reason: '',
            isActive: true,
        });
        setErrors({});
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.leaveType) {
            newErrors.leaveType = 'يجب اختيار نوع الإجازة';
        }

        if (!formData.employeeId) {
            newErrors.employeeId = 'يجب اختيار الموظف';
        }

        if (!formData.exemptLevel) {
            newErrors.exemptLevel = 'يجب اختيار المستوى المستثنى';
        }

        if (!formData.validFrom) {
            newErrors.validFrom = 'يجب تحديد تاريخ البداية';
        }

        if (!formData.validTo) {
            newErrors.validTo = 'يجب تحديد تاريخ النهاية';
        }

        if (formData.validFrom && formData.validTo) {
            if (new Date(formData.validFrom) > new Date(formData.validTo)) {
                newErrors.validTo = 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
            }
        }

        if (!formData.reason?.trim()) {
            newErrors.reason = 'يجب إدخال سبب الاستثناء';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;

        const employee = employees.find(e => e.id?.toString() === formData.employeeId);

        onSave?.({
            ...exception,
            ...formData,
            id: exception?.id || Date.now(),
            employee,
        });

        if (!exception) {
            resetForm();
        }
    };

    const handleCancel = () => {
        resetForm();
        onCancel?.();
    };

    // خيارات أنواع الإجازات
    const leaveTypeOptions = [
        { value: '', label: 'اختر نوع الإجازة' },
        ...Object.entries(LEAVE_TYPES).map(([code, type]) => ({
            value: code,
            label: `${type.name} (${code})`,
        })),
    ];

    // خيارات الموظفين
    const employeeOptions = [
        { value: '', label: 'اختر الموظف' },
        ...employees.map(emp => ({
            value: emp.id?.toString(),
            label: `${emp.fullName || emp.nameAr} - ${emp.employeeNumber || ''}`,
        })),
    ];

    // خيارات مستويات الموافقة
    const approvalLevelOptions = [
        { value: '', label: 'اختر المستوى' },
        ...Object.entries(APPROVAL_LEVELS).map(([key, level]) => ({
            value: key,
            label: `${level.name} (المستوى ${level.level})`,
        })),
    ];

    const isEditing = !!exception;

    return (
        <ContentCard
            title={isEditing ? 'تعديل الاستثناء' : 'إضافة استثناء جديد'}
            icon={<ShieldExclamationIcon className="w-5 h-5" />}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* نوع الإجازة */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            نوع الإجازة <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={formData.leaveType}
                            onChange={(e) => handleChange('leaveType', e.target.value)}
                            options={leaveTypeOptions}
                            error={errors.leaveType}
                        />
                        {errors.leaveType && (
                            <p className="mt-1 text-sm text-red-500">{errors.leaveType}</p>
                        )}
                    </div>

                    {/* الموظف */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            الموظف <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={formData.employeeId}
                            onChange={(e) => handleChange('employeeId', e.target.value)}
                            options={employeeOptions}
                            error={errors.employeeId}
                        />
                        {errors.employeeId && (
                            <p className="mt-1 text-sm text-red-500">{errors.employeeId}</p>
                        )}
                    </div>
                </div>

                {/* المستوى المستثنى */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        المستوى المستثنى من الموافقة <span className="text-red-500">*</span>
                    </label>
                    <Select
                        value={formData.exemptLevel}
                        onChange={(e) => handleChange('exemptLevel', e.target.value)}
                        options={approvalLevelOptions}
                        error={errors.exemptLevel}
                    />
                    {errors.exemptLevel && (
                        <p className="mt-1 text-sm text-red-500">{errors.exemptLevel}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        سيتم تجاوز هذا المستوى في سير الموافقات للموظف المحدد
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* صالح من */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            صالح من <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="date"
                            value={formData.validFrom}
                            onChange={(e) => handleChange('validFrom', e.target.value)}
                            error={errors.validFrom}
                        />
                        {errors.validFrom && (
                            <p className="mt-1 text-sm text-red-500">{errors.validFrom}</p>
                        )}
                    </div>

                    {/* صالح إلى */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            صالح إلى <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="date"
                            value={formData.validTo}
                            onChange={(e) => handleChange('validTo', e.target.value)}
                            min={formData.validFrom}
                            error={errors.validTo}
                        />
                        {errors.validTo && (
                            <p className="mt-1 text-sm text-red-500">{errors.validTo}</p>
                        )}
                    </div>
                </div>

                {/* السبب */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        سبب الاستثناء <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.reason}
                        onChange={(e) => handleChange('reason', e.target.value)}
                        placeholder="أدخل سبب منح هذا الاستثناء..."
                        rows={3}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 resize-none ${
                            errors.reason ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'
                        }`}
                    />
                    {errors.reason && (
                        <p className="mt-1 text-sm text-red-500">{errors.reason}</p>
                    )}
                </div>

                {/* حالة الاستثناء */}
                <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => handleChange('isActive', e.target.checked)}
                            className="w-5 h-5 rounded text-blue-600 dark:text-blue-400"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            الاستثناء فعّال
                        </span>
                    </label>
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
                        icon={<PlusIcon className="w-4 h-4" />}
                    >
                        {loading ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديلات' : 'إضافة الاستثناء'}
                    </Button>
                </div>
            </div>
        </ContentCard>
    );
};

export default ApprovalExceptionForm;
