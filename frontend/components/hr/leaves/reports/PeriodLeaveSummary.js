/**
 * ملخص إجازات فترة
 * Period Leave Summary Component
 */

import React, { forwardRef } from 'react';
import {
    CalendarDaysIcon,
    ChartBarIcon,
    BuildingOfficeIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import { ContentCard, Badge, EmptyState } from '../../../ui';
import { LEAVE_TYPES, getLeaveTypeName, LEAVE_STATUS } from '../../../../constants/leave-types';
import { formatDateArabic } from '../../../../utils/hr-helpers';

const PeriodLeaveSummary = forwardRef(({
    data = null,
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
                    <p className="text-gray-600 dark:text-gray-300">جاري تحميل البيانات...</p>
                </div>
            </ContentCard>
        );
    }

    if (!data) {
        return (
            <ContentCard>
                <EmptyState
                    icon={<CalendarDaysIcon className="w-16 h-16" />}
                    title="حدد الفترة"
                    description="اختر الفترة الزمنية لعرض ملخص الإجازات"
                />
            </ContentCard>
        );
    }

    const {
        summary = {},
        byType = [],
        byDepartment = [],
        byStatus = [],
        leaves = [],
    } = data;

    return (
        <div ref={ref} className="space-y-6">
            {/* رأس التقرير (للطباعة) */}
            {showPrintHeader && (
                <div className="text-center border-b pb-6 mb-6">
                    <h1 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-2">
                        حصر الإجازات خلال فترة
                    </h1>
                    <div className="text-gray-600 dark:text-gray-300">
                        من {formatDateArabic(dateFrom)} إلى {formatDateArabic(dateTo)}
                    </div>
                </div>
            )}

            {/* الإحصائيات العامة */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="إجمالي الطلبات"
                    value={summary.totalRequests || 0}
                    color="blue"
                />
                <StatCard
                    label="إجمالي الأيام"
                    value={summary.totalDays || 0}
                    suffix="يوم"
                    color="purple"
                />
                <StatCard
                    label="الموظفين"
                    value={summary.uniqueEmployees || 0}
                    suffix="موظف"
                    color="green"
                />
                <StatCard
                    label="معدل الموافقة"
                    value={summary.approvalRate || 0}
                    suffix="%"
                    color="amber"
                />
            </div>

            {/* التوزيع حسب الحالة */}
            <ContentCard
                title="توزيع الطلبات حسب الحالة"
                icon={<ChartBarIcon className="w-5 h-5" />}
            >
                <div className="flex flex-wrap gap-4">
                    {byStatus.map((item, idx) => {
                        const status = LEAVE_STATUS[item.status] || LEAVE_STATUS.pending;
                        const percentage = summary.totalRequests > 0
                            ? (item.count / summary.totalRequests) * 100
                            : 0;

                        return (
                            <div
                                key={idx}
                                className={`flex-1 min-w-[120px] p-4 rounded-xl ${status.bgColor} border ${status.borderColor}`}
                            >
                                <div className={`text-sm ${status.textColor}`}>{status.name}</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{item.count}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{percentage.toFixed(1)}%</div>
                            </div>
                        );
                    })}
                </div>
            </ContentCard>

            {/* التوزيع حسب النوع */}
            <ContentCard
                title="توزيع الإجازات حسب النوع"
                icon={<CalendarDaysIcon className="w-5 h-5" />}
            >
                {byType.length > 0 ? (
                    <div className="space-y-4">
                        {byType.map((item, idx) => {
                            const leaveType = LEAVE_TYPES[item.leaveType];
                            const percentage = summary.totalRequests > 0
                                ? (item.count / summary.totalRequests) * 100
                                : 0;

                            return (
                                <div key={idx} className="flex items-center gap-4">
                                    <div className={`w-4 h-4 rounded-full bg-${leaveType?.color || 'gray'}-500 flex-shrink-0`} />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {getLeaveTypeName(item.leaveType)}
                                            </span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {item.count} طلب - {item.days} يوم
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-${leaveType?.color || 'gray'}-500 rounded-full transition-all`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 w-12 text-left">
                                        {percentage.toFixed(0)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState
                        title="لا توجد بيانات"
                        description="لا توجد إجازات في الفترة المحددة"
                    />
                )}
            </ContentCard>

            {/* التوزيع حسب القسم */}
            <ContentCard
                title="توزيع الإجازات حسب القسم"
                icon={<BuildingOfficeIcon className="w-5 h-5" />}
            >
                {byDepartment.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800">
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">القسم</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">عدد الطلبات</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">إجمالي الأيام</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">عدد الموظفين</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">النسبة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {byDepartment.map((dept, idx) => {
                                    const percentage = summary.totalRequests > 0
                                        ? (dept.count / summary.totalRequests) * 100
                                        : 0;

                                    return (
                                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                                            <td className="px-4 py-3 font-medium">{dept.name}</td>
                                            <td className="px-4 py-3">{dept.count}</td>
                                            <td className="px-4 py-3">{dept.days} يوم</td>
                                            <td className="px-4 py-3">{dept.employees}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-gray-600 dark:text-gray-300 w-12">
                                                        {percentage.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        title="لا توجد بيانات"
                        description="لا توجد أقسام في الفترة المحددة"
                    />
                )}
            </ContentCard>

            {/* قائمة الإجازات */}
            {leaves.length > 0 && (
                <ContentCard
                    title="قائمة الإجازات"
                    icon={<UsersIcon className="w-5 h-5" />}
                    subtitle={`${leaves.length} إجازة`}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800">
                                    <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">#</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">الموظف</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">القسم</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">النوع</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">من</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">إلى</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">الأيام</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.slice(0, 50).map((leave, idx) => {
                                    const status = LEAVE_STATUS[leave.status] || LEAVE_STATUS.pending;
                                    return (
                                        <tr key={leave.id || idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50">
                                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                                            <td className="px-3 py-2 font-medium">
                                                {leave.employee?.fullName || leave.employee?.nameAr || '-'}
                                            </td>
                                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                                                {leave.employee?.department || '-'}
                                            </td>
                                            <td className="px-3 py-2">
                                                <Badge variant="primary" size="sm">
                                                    {getLeaveTypeName(leave.leave_type)}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-2">{formatDateArabic(leave.start_date)}</td>
                                            <td className="px-3 py-2">{formatDateArabic(leave.end_date)}</td>
                                            <td className="px-3 py-2 font-medium">{leave.days}</td>
                                            <td className="px-3 py-2">
                                                <Badge variant={status.color} size="sm">
                                                    {status.name}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {leaves.length > 50 && (
                            <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
                                يتم عرض أول 50 سجل من {leaves.length}
                            </p>
                        )}
                    </div>
                </ContentCard>
            )}
        </div>
    );
});

// مكون بطاقة الإحصائية
const StatCard = ({ label, value, suffix = '', color = 'blue' }) => {
    const colors = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600',
        green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
        amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600',
    };

    return (
        <div className={`p-4 rounded-xl border-2 ${colors[color]}`}>
            <div className="text-sm opacity-80">{label}</div>
            <div className="text-3xl font-bold">
                {value}
                {suffix && <span className="text-lg mr-1">{suffix}</span>}
            </div>
        </div>
    );
};

PeriodLeaveSummary.displayName = 'PeriodLeaveSummary';

export default PeriodLeaveSummary;
