import React, { useState, useEffect } from 'react';

import { fmtDate } from '../../../utils/hijriDate';

// ─── بيانات احتياطية ─────────────────────────────────────

const mockSadadSummary = {
    pendingCount: 15,
    overdueCount: 3,
    totalAmount: 2450000,
    paidAmount: 1820000,
    pendingAmount: 630000,
};

const mockPayments = [
    { id: 1, vendorName: 'شركة الفارس للتوريدات', amount: 125000, dueDate: '2026-02-15', status: 'pending', invoiceNumber: 'INV-2026-0089' },
    { id: 2, vendorName: 'مؤسسة النخبة التقنية', amount: 85000, dueDate: '2026-02-12', status: 'overdue', invoiceNumber: 'INV-2026-0085' },
    { id: 3, vendorName: 'شركة الأمان للصيانة', amount: 42000, dueDate: '2026-02-20', status: 'pending', invoiceNumber: 'INV-2026-0092' },
    { id: 4, vendorName: 'مؤسسة الرواد للأثاث', amount: 195000, dueDate: '2026-02-08', status: 'overdue', invoiceNumber: 'INV-2026-0078' },
    { id: 5, vendorName: 'شركة البيانات الذكية', amount: 67000, dueDate: '2026-02-25', status: 'pending', invoiceNumber: 'INV-2026-0095' },
];

const mockBudget = {
    totalBudget: 5000000,
    spent: 3200000,
    remaining: 1800000,
    departments: [
        { name: 'تقنية المعلومات', budget: 1200000, spent: 890000 },
        { name: 'الشؤون الإدارية', budget: 800000, spent: 620000 },
        { name: 'الموارد البشرية', budget: 600000, spent: 450000 },
        { name: 'المستودعات', budget: 500000, spent: 380000 },
        { name: 'الصيانة', budget: 400000, spent: 360000 },
    ],
};

// ─── مكون مساعد ──────────────────────────────────────────

function LoadingSkeleton({ darkMode, rows = 3 }) {
    return (
        <div className="space-y-3 animate-pulse">
            {Array.from({ length: rows }, (_, i) => (
                <div key={i} className={`h-10 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
            ))}
        </div>
    );
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(amount);
}

// ═══════════════════════════════════════════════════════════
// 1. ملخص المدفوعات
// ═══════════════════════════════════════════════════════════

export default function SadadSummaryWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.sadad?.getDashboardSummary?.();
                if (result?.data) setData(result.data);
                else if (result?.summary) setData(result.summary);
                else if (result?.totalInvoices !== undefined) setData(result);
                else setData(mockSadadSummary);
            } catch {
                setData(mockSadadSummary);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={4} />;

    const d = data || mockSadadSummary;
    const paidPercent = d.totalAmount > 0 ? Math.round((d.paidAmount / d.totalAmount) * 100) : 0;

    const stats = [
        { icon: '📋', label: 'معلقة', value: d.pendingCount, color: darkMode ? 'text-orange-400' : 'text-orange-600' },
        { icon: '⚠️', label: 'متأخرة', value: d.overdueCount, color: darkMode ? 'text-red-400' : 'text-red-600 dark:text-red-400' },
    ];

    return (
        <div className="space-y-3">
            {/* عدادات */}
            <div className="grid grid-cols-2 gap-2">
                {stats.map((stat) => (
                    <div key={stat.label} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{stat.icon}</span>
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>{stat.label}</span>
                        </div>
                        <p className={`text-xl font-bold ${stat.color}`}>
                            {stat.value.toLocaleString('ar-SA')}
                        </p>
                    </div>
                ))}
            </div>

            {/* المبالغ */}
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>إجمالي المدفوعات</span>
                    <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {formatCurrency(d.totalAmount)}
                    </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>المدفوع</span>
                    <span className={`text-xs font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                        {formatCurrency(d.paidAmount)}
                    </span>
                </div>
                <div className={`w-full h-2.5 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <div
                        className="h-full rounded-full bg-gradient-to-l from-green-400 to-green-600 transition-all duration-500"
                        style={{ width: `${paidPercent}%` }}
                    />
                </div>
                <p className={`text-[10px] mt-1 text-center ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                    {paidPercent}% مدفوع
                </p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// 2. مدفوعات معلقة
// ═══════════════════════════════════════════════════════════

export function PendingPaymentsWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.sadad?.getInvoices?.();
                if (result?.data?.length) {
                    const pending = result.data.filter(inv => inv.status === 'pending' || inv.statusId === 1);
                    setPayments(pending.length > 0 ? pending.slice(0, 5) : result.data.slice(0, 5));
                } else if (Array.isArray(result) && result.length) {
                    const pending = result.filter(inv => inv.status === 'pending' || inv.statusId === 1);
                    setPayments(pending.length > 0 ? pending.slice(0, 5) : result.slice(0, 5));
                }
                else setPayments(mockPayments);
            } catch {
                setPayments(mockPayments);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={4} />;

    const statusConfig = {
        pending: { label: 'معلقة', color: darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700' },
        overdue: { label: 'متأخرة', color: darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
        paid: { label: 'مدفوعة', color: darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700' },
    };

    return (
        <div className="space-y-2 max-h-[260px] overflow-y-auto">
            {payments.map((payment) => {
                const status = statusConfig[payment.status] || statusConfig.pending;
                return (
                    <div
                        key={payment.id}
                        className={`p-3 rounded-xl border transition-all ${
                            darkMode ? 'bg-gray-700/30 border-gray-700 hover:border-gray-600' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:shadow-sm'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {payment.vendorName}
                                </p>
                                <p className={`text-[10px] mt-0.5 font-mono ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                                    {payment.invoiceNumber}
                                </p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${status.color}`}>
                                {status.label}
                            </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                {formatCurrency(payment.amount)}
                            </span>
                            <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                الاستحقاق: {fmtDate(payment.dueDate)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// 3. نظرة على الميزانية
// ═══════════════════════════════════════════════════════════

export function BudgetOverviewWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.finance?.getDashboardSummary?.();
                if (result?.data) setData(result.data);
                else if (result) setData(result);
                else setData(mockBudget);
            } catch {
                setData(mockBudget);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={5} />;

    const d = data || mockBudget;
    const overallPercent = d.totalBudget > 0 ? Math.round((d.spent / d.totalBudget) * 100) : 0;

    return (
        <div className="space-y-3">
            {/* الميزانية الإجمالية */}
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>الميزانية الإجمالية</span>
                    <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {formatCurrency(d.totalBudget)}
                    </span>
                </div>
                <div className={`w-full h-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${
                            overallPercent > 90
                                ? 'bg-gradient-to-l from-red-400 to-red-600'
                                : overallPercent > 70
                                    ? 'bg-gradient-to-l from-orange-400 to-orange-600'
                                    : 'bg-gradient-to-l from-blue-400 to-blue-600'
                        }`}
                        style={{ width: `${overallPercent}%` }}
                    />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                    <span className={`text-[10px] ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                        المنصرف: {formatCurrency(d.spent)}
                    </span>
                    <span className={`text-[10px] font-bold ${
                        overallPercent > 90
                            ? darkMode ? 'text-red-400' : 'text-red-600'
                            : darkMode ? 'text-blue-400' : 'text-blue-600 dark:text-blue-400'
                    }`}>
                        {overallPercent}%
                    </span>
                </div>
            </div>

            {/* تفصيل حسب الإدارات */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {(d.departments || []).map((dept, idx) => {
                    const deptPercent = dept.budget > 0 ? Math.round((dept.spent / dept.budget) * 100) : 0;
                    return (
                        <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>{dept.name}</span>
                                <span className={`text-[10px] ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>{deptPercent}%</span>
                            </div>
                            <div className={`w-full h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        deptPercent > 90 ? 'bg-red-400' : deptPercent > 70 ? 'bg-orange-400' : 'bg-blue-400'
                                    }`}
                                    style={{ width: `${deptPercent}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
