/**
 * نموذج طلب إجازة تعويضية
 * Compensatory Leave Request Form Component
 */

import React, { useState, useEffect } from 'react';
import {
    ClockIcon,
    UserIcon,
    CalendarIcon,
    DocumentPlusIcon,
    PaperClipIcon,
} from '@heroicons/react/24/outline';
import { ContentCard, Button, Input, Select, Badge } from '../../../ui';
import OvertimeWorkLog from './OvertimeWorkLog';
import { formatDateArabic } from '../../../../utils/hr-helpers';
import api from '../../../../lib/api';

const CompensatoryLeaveForm = ({
    onSubmit,
    loading = false,
    employees = [],
    currentUser = null,
}) => {
    const [formData, setFormData] = useState({
        employeeId: currentUser?.id?.toString() || '',
        overtimeEntries: [],
        requestedDays: 0,
        startDate: '',
        endDate: '',
        substituteId: '',
        reason: '',
        attachments: [],
    });
    const [errors, setErrors] = useState({});
    const [substitutes, setSubstitutes] = useState([]);
    const [loadingSubstitutes, setLoadingSubstitutes] = useState(false);

    useEffect(() => {
        if (formData.employeeId) {
            loadSubstitutes(formData.employeeId);
        }
    }, [formData.employeeId]);

    // حساب الأيام التعويضية المستحقة تلقائياً
    useEffect(() => {
        const totalHours = formData.overtimeEntries.reduce(
            (sum, entry) => sum + (parseFloat(entry.hours) || 0),
            0
        );
        // 8 ساعات عمل = يوم تعويضي
        const calculatedDays = Math.floor(totalHours / 8);
        if (calculatedDays !== formData.requestedDays) {
            setFormData(prev => ({
                ...prev,
                requestedDays: calculatedDays,
            }));
        }
    }, [formData.overtimeEntries]);

    // حساب تاريخ النهاية تلقائياً
    useEffect(() => {
        if (formData.startDate && formData.requestedDays > 0) {
            const start = new Date(formData.startDate);
            const end = new Date(start);
            end.setDate(end.getDate() + formData.requestedDays - 1);
            setFormData(prev => ({
                ...prev,
                endDate: end.toISOString().split('T')[0],
            }));
        }
    }, [formData.startDate, formData.requestedDays]);

    const loadSubstitutes = async (employeeId) => {
        setLoadingSubstitutes(true);
        try {
            const response = await api.hr.getEmployees({ departmentId: employees.find(e => e.id?.toString() === employeeId)?.departmentId }).catch(() => null);
            const subs = (response?.data || response || employees)
                .filter(e => e.id?.toString() !== employeeId);
            setSubstitutes(subs);
        } catch (err) {
            setSubstitutes(employees.filter(e => e.id?.toString() !== employeeId));
        } finally {
            setLoadingSubstitutes(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleOvertimeChange = (entries) => {
        setFormData(prev => ({ ...prev, overtimeEntries: entries }));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.employeeId) {
            newErrors.employeeId = 'يجب اختيار الموظف';
        }

        if (formData.overtimeEntries.length === 0) {
            newErrors.overtimeEntries = 'يجب إضافة سجل عمل إضافي واحد على الأقل';
        }

        if (formData.requestedDays < 1) {
            newErrors.requestedDays = 'عدد الأيام المطلوبة يجب أن يكون أكبر من صفر';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'يجب تحديد تاريخ البداية';
        }

        if (!formData.substituteId) {
            newErrors.substituteId = 'يجب تحديد البديل أثناء الغياب';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        const employee = employees.find(e => e.id?.toString() === formData.employeeId);
        const substitute = substitutes.find(s => s.id?.toString() === formData.substituteId);

        onSubmit?.({
            ...formData,
            employee,
            substitute,
            leaveType: '18', // كود الإجازة التعويضية
            totalOvertimeHours: formData.overtimeEntries.reduce(
                (sum, entry) => sum + (parseFloat(entry.hours) || 0),
                0
            ),
        });
    };

    // حساب إجمالي الساعات
    const totalHours = formData.overtimeEntries.reduce(
        (sum, entry) => sum + (parseFloat(entry.hours) || 0),
        0
    );

    // خيارات الموظفين
    const employeeOptions = employees.map(emp => ({
        value: emp.id?.toString(),
        label: `${emp.fullName || emp.nameAr} - ${emp.employeeNumber || ''}`,
    }));

    // خيارات البدلاء
    const substituteOptions = substitutes.map(sub => ({
        value: sub.id?.toString(),
        label: `${sub.fullName || sub.nameAr} - ${sub.position || ''}`,
    }));

    return (
        <div className="space-y-6">
            {/* بيانات الموظف */}
            <ContentCard
                title="بيانات طلب الإجازة التعويضية"
                icon={<ClockIcon className="w-5 h-5" />}
            >
                <div className="space-y-4">
                    {/* اختيار الموظف */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            الموظف <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={formData.employeeId}
                            onChange={(e) => handleChange('employeeId', e.target.value)}
                            options={employeeOptions}
                            placeholder="اختر الموظف"
                            error={errors.employeeId}
                        />
                        {errors.employeeId && (
                            <p className="mt-1 text-sm text-red-500">{errors.employeeId}</p>
                        )}
                    </div>

                    {/* ملخص الساعات */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-blue-600 dark:text-blue-400">إجمالي ساعات العمل الإضافي</div>
                                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{totalHours} ساعة</div>
                            </div>
                            <div className="text-center px-6 border-r border-blue-200 dark:border-blue-800">
                                <div className="text-sm text-blue-600 dark:text-blue-400">الأيام المستحقة</div>
                                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{formData.requestedDays} يوم</div>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-blue-500">
                            * كل 8 ساعات عمل إضافي = يوم تعويضي واحد
                        </div>
                    </div>
                </div>
            </ContentCard>

            {/* سجل العمل الإضافي */}
            <OvertimeWorkLog
                entries={formData.overtimeEntries}
                onChange={handleOvertimeChange}
                error={errors.overtimeEntries}
            />

            {/* تفاصيل الإجازة */}
            <ContentCard
                title="تفاصيل الإجازة المطلوبة"
                icon={<CalendarIcon className="w-5 h-5" />}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* عدد الأيام */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            عدد الأيام المطلوبة
                        </label>
                        <Input
                            type="number"
                            value={formData.requestedDays}
                            onChange={(e) => handleChange('requestedDays', parseInt(e.target.value) || 0)}
                            min={0}
                            max={Math.floor(totalHours / 8)}
                            disabled
                        />
                        {errors.requestedDays && (
                            <p className="mt-1 text-sm text-red-500">{errors.requestedDays}</p>
                        )}
                    </div>

                    {/* البديل */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            البديل أثناء الغياب <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={formData.substituteId}
                            onChange={(e) => handleChange('substituteId', e.target.value)}
                            options={substituteOptions}
                            placeholder={loadingSubstitutes ? 'جاري التحميل...' : 'اختر البديل'}
                            disabled={loadingSubstitutes || !formData.employeeId}
                            error={errors.substituteId}
                        />
                        {errors.substituteId && (
                            <p className="mt-1 text-sm text-red-500">{errors.substituteId}</p>
                        )}
                    </div>

                    {/* تاريخ البداية */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            تاريخ البداية <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => handleChange('startDate', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            error={errors.startDate}
                        />
                        {errors.startDate && (
                            <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>
                        )}
                    </div>

                    {/* تاريخ النهاية */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            تاريخ النهاية
                        </label>
                        <Input
                            type="date"
                            value={formData.endDate}
                            disabled
                        />
                    </div>
                </div>

                {/* سبب الطلب */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        ملاحظات إضافية
                    </label>
                    <textarea
                        value={formData.reason}
                        onChange={(e) => handleChange('reason', e.target.value)}
                        placeholder="أي ملاحظات أو توضيحات إضافية..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 resize-none"
                    />
                </div>
            </ContentCard>

            {/* زر الإرسال */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={loading || formData.requestedDays < 1}
                    icon={<DocumentPlusIcon className="w-5 h-5" />}
                >
                    {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </Button>
            </div>
        </div>
    );
};

export default CompensatoryLeaveForm;
