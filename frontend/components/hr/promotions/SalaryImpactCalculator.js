/**
 * حاسبة تأثير الترقية على الراتب
 * Salary Impact Calculator Component
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Badge } from '../../ui';
import {
    PROMOTION_TYPES,
    calculateNewSalary,
    getPromotionTypesForSelect,
} from '../../../constants/promotion-types';

export default function SalaryImpactCalculator({ employee, salaryScale, onCalculate }) {
    const [targetRank, setTargetRank] = useState('');
    const [promotionType, setPromotionType] = useState('regular');
    const [result, setResult] = useState(null);

    const promotionTypeOptions = getPromotionTypesForSelect();

    useEffect(() => {
        if (employee) {
            const typeConfig = PROMOTION_TYPES[promotionType];
            const increment = typeConfig?.requirements?.rankIncrement || 1;
            setTargetRank((employee.currentRank + increment).toString());
        }
    }, [employee, promotionType]);

    useEffect(() => {
        if (employee && targetRank && salaryScale) {
            calculateImpact();
        }
    }, [targetRank, employee, salaryScale]);

    const calculateImpact = () => {
        if (!employee || !targetRank || !salaryScale) return;

        const impact = calculateNewSalary(
            {
                currentSalary: employee.salary,
                currentRank: employee.currentRank,
                currentStep: employee.currentStep,
            },
            parseInt(targetRank),
            salaryScale
        );

        setResult(impact);
        if (onCalculate) onCalculate(impact);
    };

    if (!employee) {
        return (
            <div className="text-center py-12 text-gray-400">
                <CurrencyIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>اختر موظفاً لحساب تأثير الترقية على راتبه</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="grid md:grid-cols-2 gap-4">
                <Select
                    label="نوع الترقية"
                    value={promotionType}
                    onChange={(e) => setPromotionType(e.target.value)}
                    options={promotionTypeOptions}
                />
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        المرتبة المستهدفة
                    </label>
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">{employee.currentRank}</span>
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <Input
                            type="number"
                            value={targetRank}
                            onChange={(e) => setTargetRank(e.target.value)}
                            min={employee.currentRank + 1}
                            max={15}
                            className="w-24 text-center font-bold text-emerald-600"
                        />
                    </div>
                </div>
            </div>

            {/* Results */}
            {result && !result.error && (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Current Status */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                        <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <ArrowDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </span>
                            الوضع الحالي
                        </h4>
                        <div className="space-y-4">
                            <InfoRow label="المرتبة" value={result.current.rank} />
                            <InfoRow label="الدرجة" value={result.current.step} />
                            <div className="pt-4 border-t">
                                <InfoRow
                                    label="الراتب الأساسي"
                                    value={`${result.current.salary?.toLocaleString()} ر.س`}
                                    large
                                />
                            </div>
                        </div>
                    </div>

                    {/* New Status */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6 border-2 border-emerald-200">
                        <h4 className="font-bold text-emerald-700 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center">
                                <ArrowUpIcon className="w-4 h-4 text-emerald-600" />
                            </span>
                            بعد الترقية
                        </h4>
                        <div className="space-y-4">
                            <InfoRow label="المرتبة" value={result.new.rank} highlight />
                            <InfoRow label="الدرجة" value={result.new.step} highlight />
                            <div className="pt-4 border-t border-emerald-200">
                                <InfoRow
                                    label="الراتب الجديد"
                                    value={`${result.new.salary?.toLocaleString()} ر.س`}
                                    large
                                    highlight
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Increase Summary */}
            {result && !result.error && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Salary Increase */}
                        <div className="text-center">
                            <p className="text-blue-100 text-sm mb-1">زيادة الراتب الأساسي</p>
                            <p className="text-3xl font-bold">+{result.increase.amount?.toLocaleString()}</p>
                            <p className="text-blue-200">ر.س</p>
                        </div>

                        {/* Percentage */}
                        <div className="text-center border-x border-blue-400/30">
                            <p className="text-blue-100 text-sm mb-1">نسبة الزيادة</p>
                            <p className="text-3xl font-bold">+{result.increase.percentage}%</p>
                        </div>

                        {/* Total Monthly */}
                        <div className="text-center">
                            <p className="text-blue-100 text-sm mb-1">إجمالي الزيادة الشهرية</p>
                            <p className="text-3xl font-bold">+{result.totalMonthlyIncrease?.toLocaleString()}</p>
                            <p className="text-blue-200">ر.س</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Allowances Impact */}
            {result && !result.error && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4">تأثير الترقية على البدلات</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <HomeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">بدل السكن (25%)</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {Math.round(result.new.salary * 0.25)?.toLocaleString()} ر.س
                                    </p>
                                </div>
                            </div>
                            <Badge variant="success">+{result.allowancesImpact.housing?.toLocaleString()}</Badge>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <CarIcon className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">بدل النقل</p>
                                    <p className="font-bold text-gray-900 dark:text-white">ثابت</p>
                                </div>
                            </div>
                            <Badge variant="default">بدون تغيير</Badge>
                        </div>
                    </div>
                </div>
            )}

            {/* Annual Impact */}
            {result && !result.error && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
                    <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2">التأثير السنوي</h4>
                    <p className="text-3xl font-bold text-amber-600">
                        +{(result.totalMonthlyIncrease * 12)?.toLocaleString()} ر.س
                    </p>
                    <p className="text-sm text-amber-700 mt-1">زيادة سنوية في إجمالي الدخل</p>
                </div>
            )}

            {result?.error && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-6 text-center">
                    <p className="text-red-600 dark:text-red-400">{result.error}</p>
                </div>
            )}
        </div>
    );
}

function InfoRow({ label, value, large, highlight }) {
    return (
        <div className="flex justify-between items-center">
            <span className={`${highlight ? 'text-emerald-600' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
            <span className={`font-bold ${large ? 'text-xl' : ''} ${highlight ? 'text-emerald-700' : 'text-gray-900 dark:text-white'}`}>
                {value}
            </span>
        </div>
    );
}

function CurrencyIcon({ className = "w-6 h-6" }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function ArrowUpIcon({ className = "w-6 h-6" }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
    );
}

function ArrowDownIcon({ className = "w-6 h-6" }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
    );
}

function HomeIcon({ className = "w-6 h-6" }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    );
}

function CarIcon({ className = "w-6 h-6" }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
    );
}
