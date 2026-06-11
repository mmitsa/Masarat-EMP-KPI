/**
 * حاسبة مستحقات نهاية الخدمة
 * Settlement Calculator Component
 * متوافق مع نظام العمل السعودي
 */

import React, { useState, useEffect, useMemo } from 'react';
import { fmtDate } from '../../../utils/hijriDate';

import {
    calculateEndOfService,
    calculateServiceDuration,
    TERMINATION_REASONS,
} from '../../../constants/clearance-types';

export default function SettlementCalculator({
    employee,
    terminationReason,
    lastWorkingDay,
    onCalculate,
    readOnly = false,
}) {
    const [settlement, setSettlement] = useState({
        // المستحقات
        final_salary: 0,
        leave_balance_days: 0,
        leave_balance_amount: 0,
        end_of_service: 0,
        other_allowances: 0,
        total_entitlements: 0,

        // الخصومات
        loan_balance: 0,
        advance_balance: 0,
        damages: 0,
        other_deductions: 0,
        total_deductions: 0,

        // الصافي
        net_amount: 0,
    });

    const [customValues, setCustomValues] = useState({
        other_allowances: 0,
        damages: 0,
        other_deductions: 0,
    });

    // حساب مدة الخدمة
    const serviceDuration = useMemo(() => {
        if (!employee?.hireDate || !lastWorkingDay) return null;
        return calculateServiceDuration(employee.hireDate, lastWorkingDay);
    }, [employee?.hireDate, lastWorkingDay]);

    // حساب المستحقات
    useEffect(() => {
        if (!employee || !terminationReason || !lastWorkingDay) return;

        const salary = employee.salary || 0;
        const dailySalary = salary / 30;

        // مكافأة نهاية الخدمة
        const endOfService = calculateEndOfService(
            employee.hireDate,
            lastWorkingDay,
            salary,
            terminationReason
        );

        // بدل رصيد الإجازات
        const leaveBalanceDays = employee.leaveBalance || 0;
        const leaveBalanceAmount = leaveBalanceDays * dailySalary;

        // إجمالي المستحقات
        const totalEntitlements =
            salary +
            leaveBalanceAmount +
            endOfService +
            (customValues.other_allowances || 0);

        // إجمالي الخصومات
        const loanBalance = employee.loanBalance || 0;
        const advanceBalance = employee.advanceBalance || 0;
        const totalDeductions =
            loanBalance +
            advanceBalance +
            (customValues.damages || 0) +
            (customValues.other_deductions || 0);

        // الصافي
        const netAmount = totalEntitlements - totalDeductions;

        const newSettlement = {
            final_salary: salary,
            leave_balance_days: leaveBalanceDays,
            leave_balance_amount: leaveBalanceAmount,
            end_of_service: endOfService,
            other_allowances: customValues.other_allowances || 0,
            total_entitlements: totalEntitlements,

            loan_balance: loanBalance,
            advance_balance: advanceBalance,
            damages: customValues.damages || 0,
            other_deductions: customValues.other_deductions || 0,
            total_deductions: totalDeductions,

            net_amount: netAmount,
        };

        setSettlement(newSettlement);
        onCalculate?.(newSettlement);
    }, [employee, terminationReason, lastWorkingDay, customValues, onCalculate]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 2,
        }).format(amount || 0);
    };

    const handleCustomValueChange = (field, value) => {
        setCustomValues(prev => ({
            ...prev,
            [field]: parseFloat(value) || 0,
        }));
    };

    const reasonConfig = TERMINATION_REASONS[terminationReason];

    return (
        <div className="space-y-6">
            {/* معلومات الموظف */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-3">بيانات الموظف</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-blue-600 dark:text-blue-400">الاسم:</span>
                        <div className="font-bold text-blue-900">{employee?.name || '-'}</div>
                    </div>
                    <div>
                        <span className="text-blue-600 dark:text-blue-400">الراتب الأساسي:</span>
                        <div className="font-bold text-blue-900">{formatCurrency(employee?.salary)}</div>
                    </div>
                    <div>
                        <span className="text-blue-600 dark:text-blue-400">تاريخ التعيين:</span>
                        <div className="font-bold text-blue-900">
                            {employee?.hireDate ? fmtDate(employee.hireDate) : '-'}
                        </div>
                    </div>
                    <div>
                        <span className="text-blue-600 dark:text-blue-400">مدة الخدمة:</span>
                        <div className="font-bold text-blue-900">
                            {serviceDuration
                                ? `${serviceDuration.years} سنة، ${serviceDuration.months} شهر، ${serviceDuration.days} يوم`
                                : '-'}
                        </div>
                    </div>
                </div>
            </div>

            {/* معلومات إنهاء الخدمة */}
            {reasonConfig && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                    <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2">سبب إنهاء الخدمة</h4>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-amber-200 text-amber-800 dark:text-amber-200 rounded-full text-sm font-medium">
                            {reasonConfig.label}
                        </span>
                        {reasonConfig.endOfServiceRatio === 'partial' && (
                            <span className="text-sm text-amber-600">
                                (المكافأة حسب مدة الخدمة)
                            </span>
                        )}
                        {reasonConfig.endOfServiceRatio === 'none' && (
                            <span className="text-sm text-red-600 dark:text-red-400">
                                (لا يستحق مكافأة نهاية الخدمة)
                            </span>
                        )}
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* المستحقات */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200">
                    <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        المستحقات
                    </h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-emerald-200">
                            <span className="text-emerald-700">راتب الشهر الأخير</span>
                            <span className="font-bold text-emerald-800">{formatCurrency(settlement.final_salary)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-emerald-200">
                            <div className="text-emerald-700">
                                بدل رصيد الإجازات
                                <span className="text-xs text-emerald-500 mr-1">({settlement.leave_balance_days} يوم)</span>
                            </div>
                            <span className="font-bold text-emerald-800">{formatCurrency(settlement.leave_balance_amount)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-emerald-200">
                            <span className="text-emerald-700">مكافأة نهاية الخدمة</span>
                            <span className="font-bold text-emerald-800">{formatCurrency(settlement.end_of_service)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-emerald-200">
                            <span className="text-emerald-700">بدلات أخرى</span>
                            {readOnly ? (
                                <span className="font-bold text-emerald-800">{formatCurrency(settlement.other_allowances)}</span>
                            ) : (
                                <input
                                    type="number"
                                    value={customValues.other_allowances}
                                    onChange={(e) => handleCustomValueChange('other_allowances', e.target.value)}
                                    className="w-32 px-2 py-1 text-left border border-emerald-300 rounded-lg text-sm"
                                    placeholder="0.00"
                                />
                            )}
                        </div>
                        <div className="flex justify-between items-center py-3 bg-emerald-100 rounded-lg px-3 mt-2">
                            <span className="font-bold text-emerald-800">إجمالي المستحقات</span>
                            <span className="font-bold text-xl text-emerald-800">{formatCurrency(settlement.total_entitlements)}</span>
                        </div>
                    </div>
                </div>

                {/* الخصومات */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                    <h4 className="font-bold text-red-800 dark:text-red-200 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                        الخصومات
                    </h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-red-200 dark:border-red-800">
                            <span className="text-red-700 dark:text-red-300">رصيد السلف</span>
                            <span className="font-bold text-red-800 dark:text-red-200">{formatCurrency(settlement.loan_balance)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-red-200 dark:border-red-800">
                            <span className="text-red-700 dark:text-red-300">العهد النقدية</span>
                            <span className="font-bold text-red-800 dark:text-red-200">{formatCurrency(settlement.advance_balance)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-red-200 dark:border-red-800">
                            <span className="text-red-700 dark:text-red-300">تلفيات / فقد</span>
                            {readOnly ? (
                                <span className="font-bold text-red-800 dark:text-red-200">{formatCurrency(settlement.damages)}</span>
                            ) : (
                                <input
                                    type="number"
                                    value={customValues.damages}
                                    onChange={(e) => handleCustomValueChange('damages', e.target.value)}
                                    className="w-32 px-2 py-1 text-left border border-red-300 rounded-lg text-sm"
                                    placeholder="0.00"
                                />
                            )}
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-red-200 dark:border-red-800">
                            <span className="text-red-700 dark:text-red-300">خصومات أخرى</span>
                            {readOnly ? (
                                <span className="font-bold text-red-800 dark:text-red-200">{formatCurrency(settlement.other_deductions)}</span>
                            ) : (
                                <input
                                    type="number"
                                    value={customValues.other_deductions}
                                    onChange={(e) => handleCustomValueChange('other_deductions', e.target.value)}
                                    className="w-32 px-2 py-1 text-left border border-red-300 rounded-lg text-sm"
                                    placeholder="0.00"
                                />
                            )}
                        </div>
                        <div className="flex justify-between items-center py-3 bg-red-100 dark:bg-red-900/30 rounded-lg px-3 mt-2">
                            <span className="font-bold text-red-800 dark:text-red-200">إجمالي الخصومات</span>
                            <span className="font-bold text-xl text-red-800 dark:text-red-200">{formatCurrency(settlement.total_deductions)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* الصافي */}
            <div className={`rounded-xl p-6 border-2 ${settlement.net_amount >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300' : 'bg-red-50 border-red-300'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className={`font-bold text-lg ${settlement.net_amount >= 0 ? 'text-blue-800 dark:text-blue-200' : 'text-red-800'}`}>
                            صافي المستحقات
                        </h4>
                        <p className={`text-sm ${settlement.net_amount >= 0 ? 'text-blue-600' : 'text-red-600 dark:text-red-400'}`}>
                            {settlement.net_amount >= 0 ? 'مستحقات للموظف' : 'مستحقات على الموظف'}
                        </p>
                    </div>
                    <div className={`text-3xl font-bold ${settlement.net_amount >= 0 ? 'text-blue-800 dark:text-blue-200' : 'text-red-800'}`}>
                        {formatCurrency(Math.abs(settlement.net_amount))}
                    </div>
                </div>
            </div>

            {/* شرح حساب مكافأة نهاية الخدمة */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    طريقة حساب مكافأة نهاية الخدمة
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                    <p><strong>عند إنهاء الخدمة من صاحب العمل:</strong></p>
                    <ul className="list-disc list-inside mr-4 space-y-1">
                        <li>أول 5 سنوات: نصف راتب عن كل سنة</li>
                        <li>ما زاد عن 5 سنوات: راتب كامل عن كل سنة</li>
                    </ul>
                    <p className="mt-3"><strong>عند الاستقالة:</strong></p>
                    <ul className="list-disc list-inside mr-4 space-y-1">
                        <li>أقل من سنتين: لا يستحق</li>
                        <li>2-5 سنوات: ثلث المكافأة</li>
                        <li>5-10 سنوات: ثلثي المكافأة</li>
                        <li>أكثر من 10 سنوات: المكافأة كاملة</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

// مكون ملخص التسوية المختصر
export function SettlementSummary({ settlement }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    return (
        <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
                <div className="text-xs text-emerald-600">المستحقات</div>
                <div className="text-lg font-bold text-emerald-700">{formatCurrency(settlement?.total_entitlements)}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                <div className="text-xs text-red-600 dark:text-red-400">الخصومات</div>
                <div className="text-lg font-bold text-red-700 dark:text-red-300">{formatCurrency(settlement?.total_deductions)}</div>
            </div>
            <div className={`rounded-lg p-3 text-center ${settlement?.net_amount >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-amber-50'}`}>
                <div className={`text-xs ${settlement?.net_amount >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600'}`}>الصافي</div>
                <div className={`text-lg font-bold ${settlement?.net_amount >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700'}`}>
                    {formatCurrency(settlement?.net_amount)}
                </div>
            </div>
        </div>
    );
}
