/**
 * جدول تفاصيل الراتب
 * Payroll Salary Table Component
 */

import React from 'react';
import {
    formatCurrency,
    toArabicNumerals,
    getAllowanceTypeByCode,
    getDeductionTypeByCode,
} from '../../../constants/payroll-report-types';

const PayrollSalaryTable = ({
    salary,
    numberFormat = 'english',
    showDetails = true,
    compact = false,
}) => {
    if (!salary) return null;

    const format = (amount) => formatCurrency(amount, numberFormat, false);
    const formatWithCurrency = (amount) => formatCurrency(amount, numberFormat, true);

    const {
        basic = 0,
        allowances = [],
        deductions = [],
        totalAllowances = 0,
        totalDeductions = 0,
        grossSalary = 0,
        netSalary = 0,
    } = salary;

    // حساب الإجماليات إذا لم تكن موجودة
    const calculatedTotalAllowances = totalAllowances || allowances.reduce((sum, a) => sum + (a.amount || 0), 0);
    const calculatedTotalDeductions = totalDeductions || deductions.reduce((sum, d) => sum + (d.amount || 0), 0);
    const calculatedGross = grossSalary || (basic + calculatedTotalAllowances);
    const calculatedNet = netSalary || (calculatedGross - calculatedTotalDeductions);

    if (compact) {
        return (
            <div className="space-y-2">
                <div className="flex justify-between py-1 border-b">
                    <span className="text-gray-600 dark:text-gray-300">الراتب الأساسي</span>
                    <span className="font-medium">{formatWithCurrency(basic)}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                    <span className="text-gray-600 dark:text-gray-300">إجمالي البدلات</span>
                    <span className="font-medium text-green-600 dark:text-green-400">+ {formatWithCurrency(calculatedTotalAllowances)}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                    <span className="text-gray-600 dark:text-gray-300">إجمالي الخصومات</span>
                    <span className="font-medium text-red-600 dark:text-red-400">- {formatWithCurrency(calculatedTotalDeductions)}</span>
                </div>
                <div className="flex justify-between py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3">
                    <span className="font-bold text-blue-900">صافي المستحقات</span>
                    <span className="font-bold text-blue-900">{formatWithCurrency(calculatedNet)}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-200 border-b">
                            البند
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b w-40">
                            المبلغ (ر.س)
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {/* الراتب الأساسي */}
                    <tr className="border-b">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            الراتب الأساسي
                        </td>
                        <td className="px-4 py-3 text-left font-mono">
                            {format(basic)}
                        </td>
                    </tr>

                    {/* البدلات */}
                    {showDetails && allowances.length > 0 && (
                        <>
                            <tr className="bg-green-50/50">
                                <td colSpan="2" className="px-4 py-2 font-semibold text-green-800 dark:text-green-200 text-sm">
                                    البدلات والعلاوات
                                </td>
                            </tr>
                            {allowances.map((allowance, index) => {
                                const typeInfo = getAllowanceTypeByCode(allowance.code);
                                return (
                                    <tr key={`allowance-${index}`} className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="px-4 py-2 pr-8 text-gray-700 dark:text-gray-200">
                                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-2"></span>
                                            {allowance.nameAr || typeInfo?.name || allowance.name}
                                        </td>
                                        <td className="px-4 py-2 text-left font-mono text-green-700 dark:text-green-300">
                                            + {format(allowance.amount)}
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-green-50 dark:bg-green-900/20 border-b-2 border-green-200 dark:border-green-800">
                                <td className="px-4 py-2 font-semibold text-green-800 dark:text-green-200">
                                    إجمالي البدلات
                                </td>
                                <td className="px-4 py-2 text-left font-mono font-semibold text-green-800 dark:text-green-200">
                                    + {format(calculatedTotalAllowances)}
                                </td>
                            </tr>
                        </>
                    )}

                    {/* إجمالي الراتب قبل الخصومات */}
                    <tr className="bg-gray-100 dark:bg-gray-700/50 border-b-2">
                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                            إجمالي الراتب
                        </td>
                        <td className="px-4 py-3 text-left font-mono font-bold text-gray-900 dark:text-white">
                            {format(calculatedGross)}
                        </td>
                    </tr>

                    {/* الخصومات */}
                    {showDetails && deductions.length > 0 && (
                        <>
                            <tr className="bg-red-50/50">
                                <td colSpan="2" className="px-4 py-2 font-semibold text-red-800 dark:text-red-200 text-sm">
                                    الخصومات
                                </td>
                            </tr>
                            {deductions.map((deduction, index) => {
                                const typeInfo = getDeductionTypeByCode(deduction.code);
                                return (
                                    <tr key={`deduction-${index}`} className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="px-4 py-2 pr-8 text-gray-700 dark:text-gray-200">
                                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 ml-2"></span>
                                            {deduction.nameAr || typeInfo?.name || deduction.name}
                                        </td>
                                        <td className="px-4 py-2 text-left font-mono text-red-600 dark:text-red-400">
                                            - {format(deduction.amount)}
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-red-50 dark:bg-red-900/20 border-b-2 border-red-200 dark:border-red-800">
                                <td className="px-4 py-2 font-semibold text-red-800 dark:text-red-200">
                                    إجمالي الخصومات
                                </td>
                                <td className="px-4 py-2 text-left font-mono font-semibold text-red-800 dark:text-red-200">
                                    - {format(calculatedTotalDeductions)}
                                </td>
                            </tr>
                        </>
                    )}

                    {/* صافي المستحقات */}
                    <tr className="bg-blue-600 text-white">
                        <td className="px-4 py-4 font-bold text-lg">
                            صافي المستحقات
                        </td>
                        <td className="px-4 py-4 text-left font-mono font-bold text-lg">
                            {format(calculatedNet)}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default PayrollSalaryTable;
