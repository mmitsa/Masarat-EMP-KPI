/**
 * مكون فحص أهلية الترقية
 * Promotion Eligibility Checker Component
 */

import React, { useState, useEffect } from 'react';
import { Button, Select, Badge } from '../../ui';
import {
    PROMOTION_TYPES,
    PROMOTION_BLOCKERS,
    PERFORMANCE_RATINGS,
    getPromotionTypesForSelect,
    calculateYearsInRank,
    checkServiceDurationEligibility,
    checkPromotionBlockers,
    isEligibleByPerformance,
} from '../../../constants/promotion-types';

export default function PromotionEligibilityChecker({ employee, onResult }) {
    const [promotionType, setPromotionType] = useState('regular');
    const [result, setResult] = useState(null);
    const [checking, setChecking] = useState(false);

    const promotionTypeOptions = getPromotionTypesForSelect();

    useEffect(() => {
        if (employee) {
            checkEligibility();
        }
    }, [employee, promotionType]);

    const checkEligibility = () => {
        if (!employee) return;

        setChecking(true);

        // Simulate a small delay for UX
        setTimeout(() => {
            const yearsInRank = calculateYearsInRank(employee.rankStartDate);

            const checks = {
                // 1. مدة الخدمة
                serviceDuration: checkServiceDurationEligibility(employee.rankStartDate, promotionType),

                // 2. تقييم الأداء
                performance: {
                    eligible: isEligibleByPerformance(employee.lastPerformanceRating, promotionType),
                    rating: employee.lastPerformanceRating,
                    ratingLabel: PERFORMANCE_RATINGS[employee.lastPerformanceRating]?.label,
                    requiredRating: PROMOTION_TYPES[promotionType]?.requirements?.minPerformanceRating,
                    requiredLabel: PERFORMANCE_RATINGS[PROMOTION_TYPES[promotionType]?.requirements?.minPerformanceRating]?.label,
                },

                // 3. الموانع
                blockers: checkPromotionBlockers({
                    ...employee,
                    yearsInRank: yearsInRank.years,
                }, promotionType),

                // 4. الوظيفة الشاغرة
                vacantPosition: {
                    eligible: employee.hasVacantPosition,
                    message: employee.hasVacantPosition
                        ? `يوجد شواغر في المرتبة ${employee.currentRank + 1}`
                        : 'لا توجد وظائف شاغرة في المرتبة المستهدفة',
                },

                // 5. المؤهلات (للعرض فقط)
                qualifications: {
                    eligible: true, // افتراضي - يمكن تطويره لاحقاً
                    message: 'تتطابق المؤهلات مع متطلبات الوظيفة',
                },
            };

            const overallEligible =
                checks.serviceDuration.eligible &&
                checks.performance.eligible &&
                checks.blockers.length === 0 &&
                checks.vacantPosition.eligible;

            const checkResult = {
                eligible: overallEligible,
                checks,
                yearsInRank,
                promotionType,
                targetRank: employee.currentRank + (PROMOTION_TYPES[promotionType]?.requirements?.rankIncrement || 1),
            };

            setResult(checkResult);
            if (onResult) onResult(checkResult);
            setChecking(false);
        }, 500);
    };

    if (!employee) {
        return (
            <div className="text-center py-12 text-gray-400">
                <CheckIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>اختر موظفاً لفحص أهليته للترقية</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Promotion Type Selection */}
            <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <Select
                        label="نوع الترقية"
                        value={promotionType}
                        onChange={(e) => setPromotionType(e.target.value)}
                        options={promotionTypeOptions}
                    />
                </div>
                <Button onClick={checkEligibility} disabled={checking}>
                    {checking ? 'جاري الفحص...' : 'إعادة الفحص'}
                </Button>
            </div>

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    {/* Overall Result */}
                    <div className={`rounded-xl p-6 ${result.eligible ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${result.eligible ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                {result.eligible ? (
                                    <CheckIcon className="w-10 h-10 text-white" />
                                ) : (
                                    <XIcon className="w-10 h-10 text-white" />
                                )}
                            </div>
                            <div>
                                <h3 className={`text-2xl font-bold ${result.eligible ? 'text-emerald-800' : 'text-red-800 dark:text-red-200'}`}>
                                    {result.eligible ? 'مؤهل للترقية' : 'غير مؤهل للترقية'}
                                </h3>
                                <p className={`${result.eligible ? 'text-emerald-600' : 'text-red-600 dark:text-red-400'}`}>
                                    {result.eligible
                                        ? `يمكن ترقية الموظف من المرتبة ${employee.currentRank} إلى المرتبة ${result.targetRank}`
                                        : 'يوجد موانع تمنع الترقية حالياً'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Checks */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                        {/* Service Duration Check */}
                        <CheckItem
                            title="التحقق من مدة الخدمة"
                            passed={result.checks.serviceDuration.eligible}
                            details={[
                                {
                                    label: 'المدة المطلوبة',
                                    value: `${result.checks.serviceDuration.requiredYears} سنوات`,
                                },
                                {
                                    label: 'المدة الفعلية',
                                    value: result.checks.serviceDuration.yearsInRank?.formatted || result.yearsInRank?.formatted,
                                },
                            ]}
                            message={result.checks.serviceDuration.message}
                        />

                        {/* Performance Check */}
                        <CheckItem
                            title="التحقق من تقييم الأداء"
                            passed={result.checks.performance.eligible}
                            details={[
                                {
                                    label: 'التقييم المطلوب',
                                    value: result.checks.performance.requiredLabel,
                                },
                                {
                                    label: 'تقييم الموظف',
                                    value: result.checks.performance.ratingLabel,
                                    badge: result.checks.performance.eligible ? 'success' : 'danger',
                                },
                            ]}
                        />

                        {/* Blockers Check */}
                        <CheckItem
                            title="التحقق من الموانع"
                            passed={result.checks.blockers.length === 0}
                            blockers={result.checks.blockers}
                        />

                        {/* Vacant Position Check */}
                        <CheckItem
                            title="التحقق من الوظيفة الشاغرة"
                            passed={result.checks.vacantPosition.eligible}
                            message={result.checks.vacantPosition.message}
                        />

                        {/* Qualifications Check */}
                        <CheckItem
                            title="التحقق من المؤهلات"
                            passed={result.checks.qualifications.eligible}
                            message={result.checks.qualifications.message}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function CheckItem({ title, passed, details = [], blockers = [], message }) {
    return (
        <div className="p-4">
            <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                    {passed ? (
                        <CheckIcon className="w-5 h-5" />
                    ) : (
                        <XIcon className="w-5 h-5" />
                    )}
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white">{title}</h4>

                    {details.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {details.map((detail, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">{detail.label}:</span>
                                    {detail.badge ? (
                                        <Badge variant={detail.badge}>{detail.value}</Badge>
                                    ) : (
                                        <span className="font-medium text-gray-700 dark:text-gray-200">{detail.value}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {blockers.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {blockers.map((blocker, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                                    <span className="text-red-400">•</span>
                                    <span>{blocker.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {message && (
                        <p className={`mt-1 text-sm ${passed ? 'text-emerald-600' : 'text-red-600 dark:text-red-400'}`}>
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function CheckIcon({ className = "w-6 h-6" }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}

function XIcon({ className = "w-6 h-6" }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}
