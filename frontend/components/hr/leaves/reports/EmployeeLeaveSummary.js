/**
 * ملخص إجازات موظف
 * Employee Leave Summary Component
 */

import React, { forwardRef } from 'react';
import {
    UserIcon,
    CalendarIcon,
    DocumentChartBarIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { ContentCard, Badge, EmptyState } from '../../../ui';
import { LEAVE_TYPES, getLeaveTypeName, LEAVE_STATUS } from '../../../../constants/leave-types';
import { formatDateArabic } from '../../../../utils/hr-helpers';

const EmployeeLeaveSummary = forwardRef(({
    employee = null,
    balances = [],
    leaves = [],
    dateFrom = null,
    dateTo = null,
    loading = false,
    showPrintHeader = false,
}, ref) => {
    if (loading) {
        return (
            <ContentCard>
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">جاري تحميل بيانات الموظف...</p>
                </div>
            </ContentCard>
        );
    }

    if (!employee) {
        return (
            <ContentCard>
                <EmptyState
                    icon={<UserIcon className="w-16 h-16" />}
                    title="اختر موظف"
                    description="حدد الموظف والفترة لعرض ملخص الإجازات"
                />
            </ContentCard>
        );
    }

    // حساب الإجماليات
    const totalUsedDays = leaves.reduce((sum, leave) => sum + (leave.days || 0), 0);
    const totalRemainingBalance = balances.reduce((sum, b) => sum + (b.remaining || 0), 0);

    // تجميع الإجازات حسب النوع
    const leavesByType = {};
    leaves.forEach(leave => {
        const type = leave.leave_type;
        if (!leavesByType[type]) {
            leavesByType[type] = { count: 0, days: 0, leaves: [] };
        }
        leavesByType[type].count++;
        leavesByType[type].days += leave.days || 0;
        leavesByType[type].leaves.push(leave);
    });

    return (
        <div ref={ref} className="space-y-6">
            {/* رأس التقرير (للطباعة) */}
            {showPrintHeader && (
                <div className="text-center border-b pb-6 mb-6">
                    <h1 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-2">
                        حصر الإجازات لموظف
                    </h1>
                    <div className="text-gray-600 dark:text-gray-300">
                        الفترة: {formatDateArabic(dateFrom)} - {formatDateArabic(dateTo)}
                    </div>
                </div>
            )}

            {/* بيانات الموظف */}
            <ContentCard
                title="بيانات الموظف"
                icon={<UserIcon className="w-5 h-5" />}
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoItem label="الاسم" value={employee.fullName || employee.nameAr} />
                    <InfoItem label="الرقم الوظيفي" value={employee.employeeNumber} />
                    <InfoItem label="رقم الهوية" value={employee.nationalId} />
                    <InfoItem label="القسم" value={employee.department} />
                    <InfoItem label="المسمى الوظيفي" value={employee.position} />
                    <InfoItem label="تاريخ التعيين" value={formatDateArabic(employee.hireDate)} />
                </div>
            </ContentCard>

            {/* ملخص الأرصدة */}
            <ContentCard
                title="أرصدة الإجازات"
                icon={<DocumentChartBarIcon className="w-5 h-5" />}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {balances.map((balance, idx) => {
                        const leaveType = LEAVE_TYPES[balance.leaveType];
                        const usedPercentage = balance.total > 0
                            ? ((balance.used / balance.total) * 100).toFixed(0)
                            : 0;

                        return (
                            <div
                                key={idx}
                                className={`p-4 rounded-xl border-2 ${
                                    balance.remaining <= 0
                                        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                                        : balance.remaining <= 5
                                        ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/20'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-3 h-3 rounded-full bg-${leaveType?.color || 'gray'}-500`} />
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {getLeaveTypeName(balance.leaveType)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400">الإجمالي</div>
                                        <div className="font-bold text-lg">{balance.total}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400">المستخدم</div>
                                        <div className="font-bold text-lg text-red-600 dark:text-red-400">{balance.used}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400">المتبقي</div>
                                        <div className="font-bold text-lg text-green-600 dark:text-green-400">{balance.remaining}</div>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${
                                                usedPercentage >= 100 ? 'bg-red-500' :
                                                usedPercentage >= 80 ? 'bg-amber-500' : 'bg-green-500'
                                            }`}
                                            style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                                        {usedPercentage}% مستخدم
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* الإجمالي */}
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-blue-800 dark:text-blue-200">الإجمالي المتبقي</span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalRemainingBalance} يوم</span>
                    </div>
                </div>
            </ContentCard>

            {/* سجل الإجازات */}
            <ContentCard
                title="سجل الإجازات"
                icon={<CalendarIcon className="w-5 h-5" />}
                subtitle={`${leaves.length} إجازة - ${totalUsedDays} يوم`}
            >
                {leaves.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800">
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">#</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">النوع</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">من</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">إلى</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">الأيام</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map((leave, idx) => {
                                    const status = LEAVE_STATUS[leave.status] || LEAVE_STATUS.pending;
                                    return (
                                        <tr key={leave.id || idx} className="border-b border-gray-100 dark:border-gray-800">
                                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="primary" size="sm">
                                                    {getLeaveTypeName(leave.leave_type)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{formatDateArabic(leave.start_date)}</td>
                                            <td className="px-4 py-3 text-sm">{formatDateArabic(leave.end_date)}</td>
                                            <td className="px-4 py-3 text-sm font-medium">{leave.days} يوم</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={status.color} size="sm">
                                                    {status.name}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 dark:bg-gray-800 font-bold">
                                    <td colSpan="4" className="px-4 py-3 text-left">الإجمالي</td>
                                    <td className="px-4 py-3">{totalUsedDays} يوم</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        title="لا توجد إجازات"
                        description="لم يتم تسجيل أي إجازات في الفترة المحددة"
                    />
                )}
            </ContentCard>

            {/* توزيع الإجازات حسب النوع */}
            {Object.keys(leavesByType).length > 0 && (
                <ContentCard
                    title="توزيع الإجازات حسب النوع"
                    icon={<ClockIcon className="w-5 h-5" />}
                >
                    <div className="space-y-4">
                        {Object.entries(leavesByType).map(([type, data]) => {
                            const leaveType = LEAVE_TYPES[type];
                            const percentage = totalUsedDays > 0
                                ? (data.days / totalUsedDays) * 100
                                : 0;

                            return (
                                <div key={type} className="flex items-center gap-4">
                                    <div className={`w-4 h-4 rounded-full bg-${leaveType?.color || 'gray'}-500`} />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {getLeaveTypeName(type)}
                                            </span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {data.count} طلب - {data.days} يوم ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-${leaveType?.color || 'gray'}-500 rounded-full`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ContentCard>
            )}
        </div>
    );
});

// مكون عرض المعلومات
const InfoItem = ({ label, value }) => (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
        <div className="font-medium text-gray-900 dark:text-white">{value || '-'}</div>
    </div>
);

EmployeeLeaveSummary.displayName = 'EmployeeLeaveSummary';

export default EmployeeLeaveSummary;
