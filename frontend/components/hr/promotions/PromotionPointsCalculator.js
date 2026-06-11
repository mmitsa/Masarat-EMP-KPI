/**
 * حاسبة نقاط المفاضلة
 * Promotion Points Calculator Component
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Badge } from '../../ui';
import {
    DIFFERENTIATION_CRITERIA,
    PERFORMANCE_RATINGS,
    calculateDifferentiationPoints,
} from '../../../constants/promotion-types';

export default function PromotionPointsCalculator({ employee, onCalculate }) {
    const [formData, setFormData] = useState({
        performanceRating: '',
        testScore: 0,
        volunteerWork: false,
        excellenceCertificate: false,
        trainingPrograms: [],
        ipaDays: 0,
    });
    const [result, setResult] = useState(null);

    const performanceOptions = Object.entries(PERFORMANCE_RATINGS)
        .filter(([key]) => ['excellent', 'very_good', 'good'].includes(key))
        .map(([key, value]) => ({
            value: key,
            label: value.label,
        }));

    const trainingOptions = [
        { value: 'international_certified', label: 'برنامج دولي معتمد' },
        { value: 'government_certified', label: 'برنامج حكومي معتمد' },
        { value: 'private_certified', label: 'برنامج خاص معتمد' },
    ];

    useEffect(() => {
        if (employee) {
            setFormData(prev => ({
                ...prev,
                performanceRating: employee.lastPerformanceRating || '',
            }));
        }
    }, [employee]);

    const handleCalculate = () => {
        const points = calculateDifferentiationPoints(formData);
        setResult(points);
        if (onCalculate) onCalculate(points);
    };

    const handleTrainingToggle = (program) => {
        setFormData(prev => {
            const programs = prev.trainingPrograms.includes(program)
                ? prev.trainingPrograms.filter(p => p !== program)
                : [...prev.trainingPrograms, program];
            return { ...prev, trainingPrograms: programs };
        });
    };

    if (!employee) {
        return (
            <div className="text-center py-12 text-gray-400">
                <CalculatorIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>اختر موظفاً لحساب نقاط المفاضلة</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Input Form */}
                <div className="space-y-6">
                    {/* Performance Evaluation */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <span className="text-emerald-600 font-bold text-sm">30%</span>
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white">تقييم الأداء الوظيفي</h4>
                        </div>
                        <Select
                            value={formData.performanceRating}
                            onChange={(e) => setFormData({ ...formData, performanceRating: e.target.value })}
                            options={performanceOptions}
                            placeholder="اختر تقييم الأداء..."
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            متوسط تقييم الأداء للثلاث سنوات الأخيرة
                        </p>
                    </div>

                    {/* Competition Test */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">40%</span>
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white">اختبار المفاضلة</h4>
                        </div>
                        <div className="flex items-center gap-4">
                            <Input
                                type="number"
                                value={formData.testScore}
                                onChange={(e) => setFormData({ ...formData, testScore: parseInt(e.target.value) || 0 })}
                                min={0}
                                max={100}
                                className="w-32"
                            />
                            <span className="text-gray-500 dark:text-gray-400">/ 100</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            نتيجة اختبار المفاضلة المعتمد
                        </p>
                    </div>

                    {/* Initiatives */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                <span className="text-purple-600 font-bold text-sm">20%</span>
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white">المبادرات والإنجازات</h4>
                        </div>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.volunteerWork}
                                    onChange={(e) => setFormData({ ...formData, volunteerWork: e.target.checked })}
                                    className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-gray-700 dark:text-gray-200">أعمال تطوعية موثقة</span>
                                <Badge variant="info">80%</Badge>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.excellenceCertificate}
                                    onChange={(e) => setFormData({ ...formData, excellenceCertificate: e.target.checked })}
                                    className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-gray-700 dark:text-gray-200">شهادات تميز معتمدة</span>
                                <Badge variant="info">20%</Badge>
                            </label>
                        </div>
                    </div>

                    {/* Training */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                <span className="text-amber-600 font-bold text-sm">10%</span>
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white">برامج التدريب والتطوير</h4>
                        </div>
                        <div className="space-y-3">
                            {trainingOptions.map(opt => (
                                <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.trainingPrograms.includes(opt.value)}
                                        onChange={() => handleTrainingToggle(opt.value)}
                                        className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-gray-700 dark:text-gray-200">{opt.label}</span>
                                </label>
                            ))}
                            <div className="pt-2 border-t">
                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                                    عدد أيام دورات معهد الإدارة
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={formData.ipaDays}
                                        onChange={(e) => setFormData({ ...formData, ipaDays: parseInt(e.target.value) || 0 })}
                                        min={0}
                                        max={15}
                                        className="w-24"
                                    />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">يوم (الحد الأقصى 15)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button onClick={handleCalculate} className="w-full">
                        حساب النقاط
                    </Button>
                </div>

                {/* Results */}
                <div>
                    {result ? (
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 dark:border-blue-800 p-6 sticky top-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">نتيجة حساب النقاط</h3>

                            {/* Total Score */}
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                                    <div>
                                        <span className="text-4xl font-bold">{result.total}</span>
                                        <span className="text-sm block opacity-80">/ 100</span>
                                    </div>
                                </div>
                                <p className="mt-4 text-gray-600 dark:text-gray-300">إجمالي نقاط المفاضلة</p>
                            </div>

                            {/* Breakdown */}
                            <div className="space-y-4">
                                <PointsBreakdown
                                    label="تقييم الأداء"
                                    points={result.performance.points}
                                    maxPoints={result.performance.maxPoints}
                                    color="emerald"
                                />
                                <PointsBreakdown
                                    label="اختبار المفاضلة"
                                    points={result.test.points}
                                    maxPoints={result.test.maxPoints}
                                    color="blue"
                                />
                                <PointsBreakdown
                                    label="المبادرات والإنجازات"
                                    points={result.initiatives.points}
                                    maxPoints={result.initiatives.maxPoints}
                                    color="purple"
                                />
                                <PointsBreakdown
                                    label="برامج التدريب"
                                    points={result.training.points}
                                    maxPoints={result.training.maxPoints}
                                    color="amber"
                                />
                            </div>

                            {/* Ranking Estimate */}
                            <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">التقدير</span>
                                    <Badge variant={
                                        result.total >= 80 ? 'success' :
                                        result.total >= 60 ? 'info' :
                                        result.total >= 40 ? 'warning' : 'danger'
                                    }>
                                        {result.total >= 80 ? 'ممتاز' :
                                         result.total >= 60 ? 'جيد جداً' :
                                         result.total >= 40 ? 'جيد' : 'ضعيف'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
                            <CalculatorIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500 dark:text-gray-400">أدخل البيانات واضغط "حساب النقاط"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PointsBreakdown({ label, points, maxPoints, color }) {
    const percentage = (points / maxPoints) * 100;
    const colorClasses = {
        emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600' },
        blue: { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
        purple: { bg: 'bg-purple-500', text: 'text-purple-600' },
        amber: { bg: 'bg-amber-500', text: 'text-amber-600' },
    };

    return (
        <div>
            <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-300">{label}</span>
                <span className={`font-bold ${colorClasses[color].text}`}>
                    {points} / {maxPoints}
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                    className={`h-3 rounded-full transition-all duration-500 ${colorClasses[color].bg}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function CalculatorIcon({ className = "w-6 h-6" }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    );
}
