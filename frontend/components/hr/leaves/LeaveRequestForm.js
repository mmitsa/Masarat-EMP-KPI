/**
 * مكون نموذج طلب الإجازة
 * Leave Request Form Component
 */

import React, { useState, useEffect } from 'react';
import { Input, Select } from '../../ui';
import LeaveTypeSelect from './LeaveTypeSelect';
import { LeaveBalanceMini } from './LeaveBalanceCard';
import {
    LEAVE_TYPES,
    calculateLeaveDays,
    requiresDocuments,
    requiresHRApproval,
    deductsFromBalance,
} from '../../../constants/leave-types';

export default function LeaveRequestForm({
    employees = [],
    selectedEmployeeId = null,
    balance = null,
    onSubmit,
    onCancel,
    loading = false,
    errors = {},
}) {
    const [form, setForm] = useState({
        employee_id: selectedEmployeeId || '',
        employee_to_id: '',
        leave_type: '01',
        start_date: '',
        end_date: '',
        reason: '',
    });

    const [calculatedDays, setCalculatedDays] = useState(0);
    const [warnings, setWarnings] = useState([]);

    // حساب عدد الأيام عند تغيير التواريخ
    useEffect(() => {
        if (form.start_date && form.end_date) {
            const days = calculateLeaveDays(form.start_date, form.end_date);
            setCalculatedDays(days);

            // تحقق من التحذيرات
            const newWarnings = [];
            const leaveType = LEAVE_TYPES[form.leave_type];

            if (leaveType?.days > 0 && days > leaveType.days) {
                newWarnings.push(`عدد الأيام (${days}) يتجاوز الحد المسموح (${leaveType.days} يوم)`);
            }

            if (deductsFromBalance(form.leave_type) && balance) {
                if (form.leave_type === '01' || form.leave_type === '02') {
                    if (days > balance.annual?.remaining) {
                        newWarnings.push(`الرصيد المتاح (${balance.annual?.remaining} يوم) غير كافي`);
                    }
                } else if (form.leave_type === '17') {
                    if (days > balance.emergency?.remaining) {
                        newWarnings.push(`رصيد الإجازة الطارئة (${balance.emergency?.remaining} يوم) غير كافي`);
                    }
                }
            }

            setWarnings(newWarnings);
        } else {
            setCalculatedDays(0);
            setWarnings([]);
        }
    }, [form.start_date, form.end_date, form.leave_type, balance]);

    // تحديث الحقل
    const handleChange = (field, value) => {
        setForm(prev => {
            const updated = { ...prev, [field]: value };
            // إذا تغير الموظف، نمسح الموظف البديل (لأن الإدارة قد تتغير)
            if (field === 'employee_id') {
                updated.employee_to_id = '';
            }
            return updated;
        });
    };

    // إرسال النموذج
    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit({
                ...form,
                days_count: calculatedDays,
            });
        }
    };

    // الحصول على معلومات نوع الإجازة
    const leaveTypeInfo = LEAVE_TYPES[form.leave_type];
    const needsDocuments = requiresDocuments(form.leave_type);
    const needsHR = requiresHRApproval(form.leave_type);

    // تحويل الموظفين لخيارات Select
    const employeeOptions = employees.map(emp => ({
        value: emp.id?.toString() || emp.employee_id?.toString(),
        label: emp.fullName || emp.name || emp.full_name,
        departmentId: emp.departmentId || emp.department_id || null,
    }));

    // الموظف البديل: فقط موظفين نفس الإدارة (باستثناء الموظف نفسه)
    const selectedEmployee = employees.find(
        emp => String(emp.id || emp.employee_id) === String(form.employee_id)
    );
    const selectedDeptId = selectedEmployee?.departmentId || selectedEmployee?.department_id || null;

    const substituteOptions = employeeOptions.filter(emp => {
        // استبعاد الموظف نفسه
        if (emp.value === form.employee_id) return false;
        // إذا الموظف المختار ليس لديه إدارة، نعرض الكل
        if (!selectedDeptId) return true;
        // فلترة حسب نفس الإدارة
        return String(emp.departmentId) === String(selectedDeptId);
    });

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* اختيار الموظف */}
            <Select
                label="الموظف"
                value={form.employee_id}
                onChange={(e) => handleChange('employee_id', e.target.value)}
                options={employeeOptions}
                placeholder="اختر الموظف"
                required
                error={errors.employee_id}
                disabled={!!selectedEmployeeId}
            />

            {/* عرض الرصيد */}
            {balance && (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <LeaveBalanceMini type="السنوية" balance={balance.annual || {}} color="emerald" />
                    <LeaveBalanceMini type="المرضية" balance={balance.sick || {}} color="red" />
                    <LeaveBalanceMini type="الطارئة" balance={balance.emergency || {}} color="amber" />
                </div>
            )}

            {/* نوع الإجازة */}
            <LeaveTypeSelect
                value={form.leave_type}
                onChange={(e) => handleChange('leave_type', e.target.value)}
                required
                grouped={true}
                showDays={true}
                error={errors.leave_type}
            />

            {/* معلومات النوع */}
            {leaveTypeInfo && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>{leaveTypeInfo.name}</strong>
                        {leaveTypeInfo.days > 0 && (
                            <span className="mr-2">- الحد الأقصى: {leaveTypeInfo.days} يوم</span>
                        )}
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-blue-600 dark:text-blue-400">
                        {needsDocuments && (
                            <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                                يتطلب مستندات
                            </span>
                        )}
                        {needsHR && (
                            <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                يتطلب موافقة HR
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* التواريخ */}
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="من تاريخ"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    required
                    error={errors.start_date}
                />
                <Input
                    label="إلى تاريخ"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                    min={form.start_date}
                    required
                    error={errors.end_date}
                />
            </div>

            {/* عدد الأيام المحسوب */}
            {calculatedDays > 0 && (
                <div className={`p-3 rounded-lg ${warnings.length > 0 ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-emerald-50 border border-emerald-200'}`}>
                    <div className={`text-lg font-bold ${warnings.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        عدد الأيام: {calculatedDays} يوم
                    </div>
                    {warnings.map((warning, idx) => (
                        <div key={idx} className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {warning}
                        </div>
                    ))}
                </div>
            )}

            {/* الموظف البديل */}
            <Select
                label="الموظف البديل"
                value={form.employee_to_id}
                onChange={(e) => handleChange('employee_to_id', e.target.value)}
                options={substituteOptions}
                placeholder="اختر الموظف البديل (اختياري)"
                error={errors.employee_to_id}
            />

            {/* السبب */}
            <Input
                label="سبب الإجازة"
                value={form.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                placeholder="أدخل سبب الإجازة..."
                error={errors.reason}
            />

            {/* أزرار الإجراءات */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/50 rounded-xl hover:bg-gray-200 transition-colors"
                        disabled={loading}
                    >
                        إلغاء
                    </button>
                )}
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={loading || warnings.length > 0}
                >
                    {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </button>
            </div>
        </form>
    );
}