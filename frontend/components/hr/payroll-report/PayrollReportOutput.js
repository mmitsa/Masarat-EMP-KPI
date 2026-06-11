/**
 * عرض نتائج تقرير الرواتب
 * Payroll Report Output Component
 */

import React from 'react';
import {
    UserIcon,
    CalendarIcon,
    BuildingOfficeIcon,
    IdentificationIcon,
    BanknotesIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { ContentCard, Badge } from '../../ui';
import PayrollSalaryTable from './PayrollSalaryTable';
import AuditSignaturesSection from './AuditSignaturesSection';
import {
    formatDateArabic,
    formatHijriDate,
    getReportTypeByCode,
} from '../../../constants/payroll-report-types';

const PayrollReportOutput = ({
    report,
    settings,
    loading = false,
}) => {
    if (loading) {
        return (
            <ContentCard>
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">جاري إنشاء التقرير...</p>
                </div>
            </ContentCard>
        );
    }

    if (!report) {
        return (
            <ContentCard>
                <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
                    <DocumentTextIcon className="w-16 h-16 mb-4 text-gray-300" />
                    <p className="text-lg mb-2">لم يتم إنشاء التقرير بعد</p>
                    <p className="text-sm">حدد الموظف والإعدادات ثم اضغط على "عرض التقرير"</p>
                </div>
            </ContentCard>
        );
    }

    const {
        referenceNumber,
        reportType,
        generatedAt,
        financialPeriod,
        employee,
        salary,
        audit,
    } = report;

    const reportTypeInfo = getReportTypeByCode(reportType);
    const numberFormat = settings?.numberFormat || 'english';

    return (
        <div className="space-y-6">
            {/* رأس التقرير */}
            <ContentCard>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {reportTypeInfo?.name || 'تقرير الرواتب'}
                            </h2>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {reportTypeInfo?.description}
                        </p>
                    </div>
                    <div className="text-left">
                        <Badge variant="primary" className="mb-2">
                            {referenceNumber}
                        </Badge>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            تاريخ الإنشاء: {formatDateArabic(generatedAt)}
                        </div>
                    </div>
                </div>

                {/* بيانات الموظف */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        بيانات الموظف
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InfoItem
                            icon={<UserIcon className="w-4 h-4" />}
                            label="الاسم الكامل"
                            value={employee?.nameAr || employee?.fullName}
                        />
                        <InfoItem
                            icon={<IdentificationIcon className="w-4 h-4" />}
                            label="الرقم الوظيفي"
                            value={employee?.employeeNumber}
                        />
                        <InfoItem
                            icon={<IdentificationIcon className="w-4 h-4" />}
                            label="رقم الهوية"
                            value={employee?.nationalId}
                        />
                        <InfoItem
                            icon={<BuildingOfficeIcon className="w-4 h-4" />}
                            label="المسمى الوظيفي"
                            value={employee?.position}
                        />
                        <InfoItem
                            icon={<BuildingOfficeIcon className="w-4 h-4" />}
                            label="القسم / الإدارة"
                            value={employee?.department}
                        />
                        <InfoItem
                            icon={<CalendarIcon className="w-4 h-4" />}
                            label="تاريخ التعيين"
                            value={formatDateArabic(employee?.hireDate)}
                        />
                    </div>
                </div>

                {/* الفترة المالية */}
                {financialPeriod && (
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            الفترة المالية
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            <div className="text-sm">
                                <span className="text-blue-600 dark:text-blue-400">من: </span>
                                <span className="font-medium text-blue-900">
                                    {formatDateArabic(financialPeriod.from)}
                                </span>
                                {financialPeriod.hijriFrom && (
                                    <span className="text-blue-700 dark:text-blue-300 mr-2">
                                        ({financialPeriod.hijriFrom})
                                    </span>
                                )}
                            </div>
                            <div className="text-sm">
                                <span className="text-blue-600 dark:text-blue-400">إلى: </span>
                                <span className="font-medium text-blue-900">
                                    {formatDateArabic(financialPeriod.to)}
                                </span>
                                {financialPeriod.hijriTo && (
                                    <span className="text-blue-700 dark:text-blue-300 mr-2">
                                        ({financialPeriod.hijriTo})
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* جدول الرواتب */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <BanknotesIcon className="w-4 h-4" />
                        تفاصيل الراتب
                    </h3>
                    <PayrollSalaryTable
                        salary={salary}
                        numberFormat={numberFormat}
                        showDetails={true}
                    />
                </div>

                {/* التوقيعات */}
                <AuditSignaturesSection
                    preparer={audit?.preparer || settings?.preparer}
                    auditor={audit?.auditor || settings?.auditor}
                    date={generatedAt}
                />
            </ContentCard>
        </div>
    );
};

// مكون عرض المعلومات
const InfoItem = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-gray-400 flex-shrink-0">
            {icon}
        </div>
        <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
            <div className="font-medium text-gray-900 dark:text-white">{value || '-'}</div>
        </div>
    </div>
);

export default PayrollReportOutput;
