/**
 * نموذج طلب الترقية
 * Promotion Request Form Component
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Badge } from '../../ui';
import {
    PROMOTION_TYPES,
    PERFORMANCE_RATINGS,
    getPromotionTypesForSelect,
    calculateYearsInRank,
    checkPromotionBlockers,
    checkServiceDurationEligibility,
} from '../../../constants/promotion-types';

export default function PromotionForm({
    employees = [],
    selectedEmployee,
    onEmployeeSelect,
    eligibilityResult,
    pointsResult,
    salaryImpact,
    onSubmit,
    onReset,
    salaryScale,
}) {
    const [form, setForm] = useState({
        promotionType: 'regular',
        targetRank: '',
        targetPosition: '',
        effectiveDate: '',
        justification: '',
    });
    const [blockers, setBlockers] = useState([]);

    const promotionTypeOptions = getPromotionTypesForSelect();
    const employeeOptions = employees.map(e => ({
        value: e.id.toString(),
        label: `${e.fullName || e.name} - ${e.employeeNumber}`,
    }));

    useEffect(() => {
        if (selectedEmployee) {
            // Set default target rank based on promotion type
            const typeConfig = PROMOTION_TYPES[form.promotionType];
            const increment = typeConfig?.requirements?.rankIncrement || 1;
            const newTargetRank = selectedEmployee.currentRank + increment;

            setForm(prev => ({
                ...prev,
                targetRank: newTargetRank.toString(),
                targetPosition: selectedEmployee.targetPosition || '',
            }));

            // Check blockers
            const employeeBlockers = checkPromotionBlockers({
                ...selectedEmployee,
                yearsInRank: calculateYearsInRank(selectedEmployee.rankStartDate).years,
            }, form.promotionType);
            setBlockers(employeeBlockers);
        }
    }, [selectedEmployee, form.promotionType]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (blockers.length > 0) {
            return;
        }
        onSubmit({
            ...form,
            targetRank: parseInt(form.targetRank),
            differentiationPoints: pointsResult,
            newSalary: salaryImpact?.new?.salary,
        });
    };

    const handleTypeChange = (value) => {
        setForm(prev => ({ ...prev, promotionType: value }));
        if (selectedEmployee) {
            const typeConfig = PROMOTION_TYPES[value];
            const increment = typeConfig?.requirements?.rankIncrement || 1;
            const newTargetRank = selectedEmployee.currentRank + increment;
            setForm(prev => ({ ...prev, targetRank: newTargetRank.toString() }));
        }
    };

    const yearsInRank = selectedEmployee
        ? calculateYearsInRank(selectedEmployee.rankStartDate)
        : null;

    const performanceRating = selectedEmployee
        ? PERFORMANCE_RATINGS[selectedEmployee.lastPerformanceRating]
        : null;

    const isEligible = blockers.length === 0 && selectedEmployee;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">إنشاء طلب ترقية جديد</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Employee Selection */}
                <div className="grid md:grid-cols-2 gap-4">
                    <Select
                        label="الموظف"
                        value={selectedEmployee?.id?.toString() || ''}
                        onChange={(e) => onEmployeeSelect(e.target.value)}
                        options={employeeOptions}
                        placeholder="اختر الموظف..."
                        required
                    />
                    <Select
                        label="نوع الترقية"
                        value={form.promotionType}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        options={promotionTypeOptions}
                        required
                    />
                </div>

                {selectedEmployee && (
                    <>
                        {/* Current Status */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                            <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-4">الوضع الحالي</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 block">المرتبة</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{selectedEmployee.currentRank}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 block">الدرجة</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{selectedEmployee.currentStep}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 block">الراتب</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{selectedEmployee.salary?.toLocaleString()} ر.س</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 block">مدة الخدمة في المرتبة</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{yearsInRank?.formatted}</span>
                                </div>
                            </div>
                        </div>

                        {/* Target Rank */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    المرتبة المستهدفة
                                </label>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-gray-400">{selectedEmployee.currentRank}</span>
                                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    <Input
                                        type="number"
                                        value={form.targetRank}
                                        onChange={(e) => setForm({ ...form, targetRank: e.target.value })}
                                        min={selectedEmployee.currentRank + 1}
                                        max={15}
                                        className="w-24 text-center font-bold text-emerald-600"
                                        required
                                    />
                                </div>
                            </div>
                            <Input
                                label="المسمى الوظيفي المستهدف"
                                value={form.targetPosition}
                                onChange={(e) => setForm({ ...form, targetPosition: e.target.value })}
                                placeholder="مثال: مطور برمجيات أول"
                            />
                        </div>

                        <Input
                            label="تاريخ نفاذ الترقية"
                            type="date"
                            value={form.effectiveDate}
                            onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                            required
                        />

                        {/* Performance Rating */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                            <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-3">تقييم الأداء</h4>
                            <div className="flex items-center gap-4">
                                <Badge variant={
                                    selectedEmployee.lastPerformanceRating === 'excellent' ? 'success' :
                                    selectedEmployee.lastPerformanceRating === 'very_good' ? 'info' :
                                    selectedEmployee.lastPerformanceRating === 'good' ? 'warning' : 'default'
                                }>
                                    {performanceRating?.label || 'غير محدد'}
                                </Badge>
                                <span className="text-sm text-blue-700 dark:text-blue-300">
                                    آخر تقييم للسنة الماضية
                                </span>
                            </div>
                            {selectedEmployee.performanceHistory && (
                                <div className="mt-3 flex gap-2">
                                    {selectedEmployee.performanceHistory.slice(0, 3).map((perf, idx) => (
                                        <div key={idx} className="text-center text-xs">
                                            <span className="block text-blue-600 dark:text-blue-400">{perf.year}</span>
                                            <span className="font-medium text-blue-800 dark:text-blue-200">
                                                {PERFORMANCE_RATINGS[perf.rating]?.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Blockers */}
                        {blockers.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                                <h4 className="font-bold text-red-800 dark:text-red-200 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    موانع الترقية
                                </h4>
                                <ul className="space-y-2">
                                    {blockers.map((blocker, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                                            <span className="w-5 h-5 rounded-full bg-red-200 text-red-800 dark:text-red-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <span className="font-medium">{blocker.label}</span>
                                                {blocker.details && (
                                                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{blocker.details}</p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Eligibility & Points Summary */}
                        {isEligible && (
                            <div className="grid md:grid-cols-2 gap-4">
                                {pointsResult && (
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                                        <h4 className="font-bold text-emerald-800 mb-2">نقاط المفاضلة</h4>
                                        <div className="text-3xl font-bold text-emerald-600">
                                            {pointsResult.total}
                                            <span className="text-lg font-normal text-emerald-500"> / 100</span>
                                        </div>
                                    </div>
                                )}
                                {salaryImpact && (
                                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                                        <h4 className="font-bold text-purple-800 dark:text-purple-200 mb-2">تأثير الراتب</h4>
                                        <div className="text-xl font-bold text-purple-600">
                                            +{salaryImpact.increase?.amount?.toLocaleString()} ر.س
                                            <span className="text-sm font-normal text-purple-500 mr-2">
                                                ({salaryImpact.increase?.percentage}%)
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Justification */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">مبررات الترقية</label>
                            <textarea
                                value={form.justification}
                                onChange={(e) => setForm({ ...form, justification: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                                placeholder="اذكر مبررات الترقية والإنجازات الداعمة..."
                            />
                        </div>
                    </>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                    <Button
                        type="submit"
                        disabled={!isEligible || !form.effectiveDate}
                    >
                        إنشاء طلب الترقية
                    </Button>
                    <Button variant="outline" type="button" onClick={onReset}>
                        إعادة تعيين
                    </Button>
                </div>
            </form>
        </div>
    );
}
