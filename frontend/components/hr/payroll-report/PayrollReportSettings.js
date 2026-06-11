/**
 * لوحة إعدادات تقرير الرواتب
 * Payroll Report Settings Panel
 */

import React, { useState, useEffect } from 'react';
import {
    DocumentTextIcon,
    CalendarIcon,
    UserIcon,
    Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { ContentCard } from '../../ui';
import EmployeeSearchSelect from './EmployeeSearchSelect';
import {
    REPORT_TYPES,
    NUMBER_FORMATS,
    getReportTypeOptions,
    getNumberFormatOptions,
} from '../../../constants/payroll-report-types';
import api from '../../../lib/api';

const PayrollReportSettings = ({
    settings,
    onChange,
    onGenerate,
    loading = false,
    errors = {},
}) => {
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // جلب قائمة المستخدمين للموظف المختص والمدقق
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await api.hr.getEmployees({ page: 1, pageSize: 100 });
            const data = response?.data || response?.employees || response || [];
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching users:', error);
            // Mock data
            setUsers([
                { id: 1, fullName: 'أحمد محمد العتيبي', position: 'مدير الموارد البشرية' },
                { id: 2, fullName: 'سارة أحمد القحطاني', position: 'أخصائي موارد بشرية' },
                { id: 3, fullName: 'محمد سالم الغامدي', position: 'مدقق داخلي' },
            ]);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleChange = (field, value) => {
        onChange?.({
            ...settings,
            [field]: value,
        });
    };

    const reportTypeOptions = getReportTypeOptions();
    const numberFormatOptions = getNumberFormatOptions();

    return (
        <ContentCard
            title="إعدادات التقرير"
            icon={<Cog6ToothIcon className="w-5 h-5" />}
            className="mb-6"
        >
            <div className="space-y-6">
                {/* الصف الأول: نوع التقرير وصيغة الأرقام */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* نوع التقرير */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                            حدد التقرير
                            <span className="text-red-500 mr-1">*</span>
                        </label>
                        <div className="relative">
                            <DocumentTextIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            <select
                                value={settings.reportType || 'payroll_run'}
                                onChange={(e) => handleChange('reportType', e.target.value)}
                                className={`
                                    w-full pr-10 pl-4 py-2.5 border rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400
                                    ${errors.reportType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                                `}
                            >
                                {reportTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.reportType && (
                            <p className="mt-1 text-sm text-red-500">{errors.reportType}</p>
                        )}
                    </div>

                    {/* صيغة الأرقام */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                            عرض التقرير بالأرقام
                        </label>
                        <div className="flex gap-4">
                            {numberFormatOptions.map((option) => (
                                <label
                                    key={option.value}
                                    className={`
                                        flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                                        border rounded-lg cursor-pointer transition-all
                                        ${settings.numberFormat === option.value
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                        }
                                    `}
                                >
                                    <input
                                        type="radio"
                                        name="numberFormat"
                                        value={option.value}
                                        checked={settings.numberFormat === option.value}
                                        onChange={(e) => handleChange('numberFormat', e.target.value)}
                                        className="sr-only"
                                    />
                                    <span className="text-sm font-medium">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* الصف الثاني: اختيار الموظف */}
                <div>
                    <EmployeeSearchSelect
                        value={settings.employeeId}
                        onChange={(id, employee) => {
                            handleChange('employeeId', id);
                            handleChange('employee', employee);
                        }}
                        label="إسم الموظف"
                        required
                        error={errors.employeeId}
                        showDepartment
                    />
                </div>

                {/* الصف الثالث: نطاق التاريخ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* من تاريخ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                            تاريخ بدايتها
                        </label>
                        <div className="relative">
                            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            <input
                                type="date"
                                value={settings.dateFrom || ''}
                                onChange={(e) => handleChange('dateFrom', e.target.value)}
                                className={`
                                    w-full pr-10 pl-4 py-2.5 border rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400
                                    ${errors.dateFrom ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                                `}
                            />
                        </div>
                        {errors.dateFrom && (
                            <p className="mt-1 text-sm text-red-500">{errors.dateFrom}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            اترك فارغاً لجلب كامل الفترة المتاحة
                        </p>
                    </div>

                    {/* إلى تاريخ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                            تاريخ نهايتها
                        </label>
                        <div className="relative">
                            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            <input
                                type="date"
                                value={settings.dateTo || ''}
                                onChange={(e) => handleChange('dateTo', e.target.value)}
                                className={`
                                    w-full pr-10 pl-4 py-2.5 border rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400
                                    ${errors.dateTo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                                `}
                            />
                        </div>
                        {errors.dateTo && (
                            <p className="mt-1 text-sm text-red-500">{errors.dateTo}</p>
                        )}
                    </div>
                </div>

                {/* قسم الحوكمة: الموظف المختص والمدقق */}
                <div className="border-t pt-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        بيانات الاعتماد والحوكمة
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* الموظف المختص */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                الموظف المختص
                            </label>
                            <select
                                value={settings.preparerId || ''}
                                onChange={(e) => {
                                    const userId = e.target.value;
                                    const user = users.find(u => u.id.toString() === userId);
                                    handleChange('preparerId', userId);
                                    handleChange('preparer', user);
                                }}
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400"
                                disabled={loadingUsers}
                            >
                                <option value="">اختر الموظف المختص</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.fullName || user.nameAr} {user.position ? `- ${user.position}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* المدقق */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                المدقق
                            </label>
                            <select
                                value={settings.auditorId || ''}
                                onChange={(e) => {
                                    const userId = e.target.value;
                                    const user = users.find(u => u.id.toString() === userId);
                                    handleChange('auditorId', userId);
                                    handleChange('auditor', user);
                                }}
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400"
                                disabled={loadingUsers}
                            >
                                <option value="">اختر المدقق</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.fullName || user.nameAr} {user.position ? `- ${user.position}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* زر عرض التقرير */}
                <div className="border-t pt-6">
                    <button
                        onClick={onGenerate}
                        disabled={loading || !settings.employeeId}
                        className={`
                            w-full md:w-auto px-8 py-3 rounded-xl font-medium text-white
                            transition-all duration-200 flex items-center justify-center gap-2
                            ${loading || !settings.employeeId
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                            }
                        `}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                جاري إنشاء التقرير...
                            </>
                        ) : (
                            <>
                                <DocumentTextIcon className="w-5 h-5" />
                                عرض التقرير
                            </>
                        )}
                    </button>
                </div>
            </div>
        </ContentCard>
    );
};

export default PayrollReportSettings;
