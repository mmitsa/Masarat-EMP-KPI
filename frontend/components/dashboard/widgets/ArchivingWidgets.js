import React, { useState, useEffect } from 'react';

import { fmtDate } from '../../../utils/hijriDate';

// ─── بيانات احتياطية ─────────────────────────────────────

const mockTransactions = [
    { id: 1, transactionNumber: 'DOC-2026-0142', type: 'وارد', description: 'خطاب رسمي من وزارة المالية', date: '2026-02-10', priority: 'high' },
    { id: 2, transactionNumber: 'DOC-2026-0141', type: 'صادر', description: 'رد على استفسار الجهة المختصة', date: '2026-02-09', priority: 'medium' },
    { id: 3, transactionNumber: 'DOC-2026-0139', type: 'داخلي', description: 'تعميم إداري بخصوص الحضور', date: '2026-02-08', priority: 'low' },
    { id: 4, transactionNumber: 'DOC-2026-0138', type: 'وارد', description: 'عقد توريد معدات تقنية', date: '2026-02-07', priority: 'high' },
    { id: 5, transactionNumber: 'DOC-2026-0135', type: 'صادر', description: 'مذكرة تفاهم مع جهة حكومية', date: '2026-02-06', priority: 'medium' },
];

const mockArchiveStats = {
    totalDocuments: 12450,
    digitized: 9200,
    pending: 3250,
    thisMonth: 342,
    categories: [
        { name: 'وارد', count: 4200, color: '#3b82f6' },
        { name: 'صادر', count: 3800, color: '#8a38f5' },
        { name: 'داخلي', count: 2950, color: '#10b981' },
        { name: 'سري', count: 1500, color: '#ef4444' },
    ],
};

// ─── مكون مساعد: Skeleton تحميل ───────────────────────────

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
// 1. معاملات معلقة
// ═══════════════════════════════════════════════════════════

export default function PendingTransactionsWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.archiving?.getPendingTasks?.();
                if (result?.data?.length) setTransactions(result.data.slice(0, 5));
                else if (Array.isArray(result) && result.length) setTransactions(result.slice(0, 5));
                else {
                    const docs = await api.archiving?.getDocuments?.();
                    if (docs?.data?.length) setTransactions(docs.data.slice(0, 5));
                    else setTransactions(mockTransactions);
                }
            } catch {
                setTransactions(mockTransactions);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={4} />;

    const priorityDot = {
        high: 'bg-red-500',
        medium: 'bg-orange-500',
        low: 'bg-green-500',
    };

    const typeColors = {
        'وارد': darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
        'صادر': darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700',
        'داخلي': darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700',
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>بانتظار الأرشفة</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700">
                    {transactions.length}
                </span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {transactions.map((tx) => (
                    <div
                        key={tx.id}
                        className={`p-3 rounded-xl border transition-all ${
                            darkMode ? 'bg-gray-700/30 border-gray-700 hover:border-gray-600' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:shadow-sm'
                        }`}
                    >
                        <div className="flex items-start gap-2">
                            <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityDot[tx.priority]}`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-xs font-mono ${darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {tx.transactionNumber}
                                    </p>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${typeColors[tx.type] || typeColors['داخلي']}`}>
                                        {tx.type}
                                    </span>
                                </div>
                                <p className={`text-xs mt-1 truncate ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {tx.description}
                                </p>
                                <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>
                                    {fmtDate(tx.date)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// 2. إحصائيات الأرشيف
// ═══════════════════════════════════════════════════════════

export function ArchiveStatsWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.archiving?.getDashboardSummary?.();
                if (result?.data) setStats(result.data);
                else if (result?.summary) setStats(result.summary);
                else if (result?.totalDocuments !== undefined) setStats(result);
                else setStats(mockArchiveStats);
            } catch {
                setStats(mockArchiveStats);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={4} />;

    const d = stats || mockArchiveStats;
    const digitizedPercent = d.totalDocuments > 0 ? Math.round((d.digitized / d.totalDocuments) * 100) : 0;

    // Donut chart
    const size = 100;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const categories = d.categories || [];
    const catTotal = categories.reduce((s, c) => s + c.count, 0);
    let cumulativeOffset = 0;

    return (
        <div className="space-y-3">
            {/* إحصائيات رئيسية */}
            <div className="grid grid-cols-3 gap-2">
                <div className={`p-2 rounded-lg text-center ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {d.totalDocuments.toLocaleString('ar-SA')}
                    </p>
                    <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>إجمالي</p>
                </div>
                <div className={`p-2 rounded-lg text-center ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <p className={`text-sm font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                        {d.digitized.toLocaleString('ar-SA')}
                    </p>
                    <p className={`text-[10px] ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>مرقمن</p>
                </div>
                <div className={`p-2 rounded-lg text-center ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <p className={`text-sm font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                        {d.pending.toLocaleString('ar-SA')}
                    </p>
                    <p className={`text-[10px] ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>معلق</p>
                </div>
            </div>

            {/* شريط الرقمنة */}
            <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>نسبة الرقمنة</span>
                    <span className={`text-xs font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{digitizedPercent}%</span>
                </div>
                <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <div
                        className="h-full rounded-full bg-gradient-to-l from-blue-400 to-blue-600 transition-all duration-500"
                        style={{ width: `${digitizedPercent}%` }}
                    />
                </div>
            </div>

            {/* توزيع أنواع المستندات */}
            <div className="flex items-center justify-center gap-4">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {categories.map((cat, i) => {
                        const segPercent = catTotal > 0 ? cat.count / catTotal : 0;
                        const dashLength = circumference * segPercent;
                        const dashOffset = circumference * cumulativeOffset;
                        cumulativeOffset += segPercent;
                        return (
                            <circle
                                key={i}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                stroke={cat.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                                strokeDashoffset={-dashOffset}
                                strokeLinecap="round"
                                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                            />
                        );
                    })}
                </svg>
                <div className="space-y-1.5">
                    {categories.map((cat) => (
                        <div key={cat.name} className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                {cat.name} ({cat.count.toLocaleString('ar-SA')})
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
