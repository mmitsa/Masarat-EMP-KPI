import React, { useState, useEffect } from 'react';

import { fmtDate } from '../../../utils/hijriDate';

// ─── بيانات احتياطية ─────────────────────────────────────

const mockEPMSummary = {
    currentCycle: 'الربع الأول 2026',
    totalEvaluations: 112,
    completed: 45,
    pending: 67,
    averageScore: 3.8,
    maxScore: 5,
};

const mockDeadlines = [
    { id: 1, employeeName: 'عبدالعزيز الراشد', evaluationType: 'تقييم فترة التجربة', deadline: '2026-02-12', urgency: 'overdue' },
    { id: 2, employeeName: 'هيفاء المنصور', evaluationType: 'تقييم ربع سنوي', deadline: '2026-02-15', urgency: 'due_soon' },
    { id: 3, employeeName: 'عمر البارقي', evaluationType: 'تقييم سنوي', deadline: '2026-02-20', urgency: 'due_soon' },
    { id: 4, employeeName: 'لمى الشريف', evaluationType: 'تقييم ربع سنوي', deadline: '2026-03-01', urgency: 'scheduled' },
    { id: 5, employeeName: 'بدر الحمدان', evaluationType: 'تقييم ترقية', deadline: '2026-03-10', urgency: 'scheduled' },
];

// ─── مكونات مساعدة ───────────────────────────────────────

function LoadingSkeleton({ darkMode, rows = 3 }) {
    return (
        <div className="space-y-3 animate-pulse">
            {Array.from({ length: rows }, (_, i) => (
                <div key={i} className={`h-10 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// 1. ملخص تقييم الأداء
// ═══════════════════════════════════════════════════════════

export default function EPMSummaryWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.epm?.getDashboardSummary?.();
                if (result) setData(result);
                else setData(mockEPMSummary);
            } catch {
                setData(mockEPMSummary);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={4} />;

    const d = data || mockEPMSummary;
    const completedPercent = d.totalEvaluations > 0 ? Math.round((d.completed / d.totalEvaluations) * 100) : 0;
    const scorePercent = d.maxScore > 0 ? Math.round((d.averageScore / d.maxScore) * 100) : 0;

    // SVG circular progress
    const size = 80;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const scoreOffset = circumference - (circumference * scorePercent) / 100;

    return (
        <div className="space-y-3">
            {/* دورة التقييم */}
            <div className={`p-2.5 rounded-xl text-center ${darkMode ? 'bg-purple-900/20 border border-purple-800/30' : 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'}`}>
                <span className={`text-[10px] ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>الدورة الحالية</span>
                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{d.currentCycle}</p>
            </div>

            {/* المحتوى الرئيسي */}
            <div className="flex items-center gap-4">
                {/* حلقة الدرجة */}
                <div className="relative flex-shrink-0">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        <circle
                            cx={size / 2} cy={size / 2} r={radius}
                            fill="none"
                            stroke={darkMode ? '#374151' : '#e5e7eb'}
                            strokeWidth={strokeWidth}
                        />
                        <circle
                            cx={size / 2} cy={size / 2} r={radius}
                            fill="none"
                            stroke={scorePercent >= 80 ? '#10b981' : scorePercent >= 60 ? '#f59e0b' : '#ef4444'}
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={scoreOffset}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${size / 2} ${size / 2})`}
                            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{d.averageScore}</span>
                        <span className={`text-[8px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>من {d.maxScore}</span>
                    </div>
                </div>

                {/* إحصائيات */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>الإجمالي</span>
                        <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            {d.totalEvaluations.toLocaleString('ar-SA')}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>مكتملة</span>
                        <span className={`text-sm font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                            {d.completed.toLocaleString('ar-SA')}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>معلقة</span>
                        <span className={`text-sm font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                            {d.pending.toLocaleString('ar-SA')}
                        </span>
                    </div>
                </div>
            </div>

            {/* شريط التقدم */}
            <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>نسبة الإنجاز</span>
                    <span className={`text-xs font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{completedPercent}%</span>
                </div>
                <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <div
                        className="h-full rounded-full bg-gradient-to-l from-purple-400 to-purple-600 transition-all duration-500"
                        style={{ width: `${completedPercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// 2. مواعيد التقييم
// ═══════════════════════════════════════════════════════════

export function EvaluationDeadlinesWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [deadlines, setDeadlines] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.epm?.getPendingEvaluations?.();
                if (result?.data?.length) setDeadlines(result.data.slice(0, 5));
                else if (Array.isArray(result) && result.length) setDeadlines(result.slice(0, 5));
                else setDeadlines(mockDeadlines);
            } catch {
                setDeadlines(mockDeadlines);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={4} />;

    const urgencyConfig = {
        overdue: {
            label: 'متأخر',
            dot: 'bg-red-500',
            text: darkMode ? 'text-red-400' : 'text-red-600 dark:text-red-400',
            bg: darkMode ? 'bg-red-900/10' : 'bg-red-50/50',
        },
        due_soon: {
            label: 'قريب',
            dot: 'bg-orange-500',
            text: darkMode ? 'text-orange-400' : 'text-orange-600',
            bg: darkMode ? 'bg-orange-900/10' : 'bg-orange-50/50',
        },
        scheduled: {
            label: 'مجدول',
            dot: 'bg-green-500',
            text: darkMode ? 'text-green-400' : 'text-green-600 dark:text-green-400',
            bg: darkMode ? 'bg-green-900/10' : '',
        },
    };

    const getDaysRemaining = (dateStr) => {
        const now = new Date();
        const target = new Date(dateStr);
        const diff = Math.ceil((target - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / (1000 * 60 * 60 * 24));
        if (diff < 0) return `متأخر ${Math.abs(diff)} يوم`;
        if (diff === 0) return 'اليوم';
        if (diff === 1) return 'غداً';
        return `بعد ${diff} يوم`;
    };

    return (
        <div className="space-y-2 max-h-[260px] overflow-y-auto">
            {deadlines.map((item) => {
                const config = urgencyConfig[item.urgency] || urgencyConfig.scheduled;
                return (
                    <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all ${
                            darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-100 dark:border-gray-800 hover:shadow-sm'
                        } ${config.bg}`}
                    >
                        <div className="flex items-start gap-2">
                            <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${config.dot}`} />
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {item.employeeName}
                                </p>
                                <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {item.evaluationType}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className={`text-[10px] ${darkMode ? 'text-gray-600 dark:text-gray-300' : 'text-gray-300'}`}>
                                        {fmtDate(item.deadline)}
                                    </span>
                                    <span className={`text-[10px] font-medium ${config.text}`}>
                                        {getDaysRemaining(item.deadline)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
