import React, { useState, useEffect } from 'react';

import { fmtDate } from '../../../utils/hijriDate';

// ─── بيانات احتياطية ─────────────────────────────────────

const mockAlerts = [
    { id: 1, type: 'low_stock', message: 'أوراق A4 - المخزون أقل من الحد الأدنى', priority: 'high', date: '2026-02-10' },
    { id: 2, type: 'expiring', message: 'حبر طابعة HP - ينتهي خلال 15 يوم', priority: 'medium', date: '2026-02-09' },
    { id: 3, type: 'pending', message: 'طلب صرف #1247 بانتظار الموافقة', priority: 'low', date: '2026-02-10' },
    { id: 4, type: 'low_stock', message: 'أقلام حبر جاف - المخزون صفر', priority: 'high', date: '2026-02-08' },
    { id: 5, type: 'pending', message: 'طلب صرف #1250 بانتظار مراقب المخزون', priority: 'medium', date: '2026-02-10' },
];

const mockLowStock = [
    { id: 1, nameAr: 'أوراق A4 (80 جرام)', currentQty: 15, minQty: 100, unit: 'رزمة' },
    { id: 2, nameAr: 'حبر طابعة HP 26A', currentQty: 3, minQty: 20, unit: 'علبة' },
    { id: 3, nameAr: 'أقلام حبر جاف أزرق', currentQty: 0, minQty: 50, unit: 'قلم' },
    { id: 4, nameAr: 'ملفات بلاستيكية شفافة', currentQty: 8, minQty: 30, unit: 'ملف' },
    { id: 5, nameAr: 'دباسة ورق كبيرة', currentQty: 2, minQty: 10, unit: 'حبة' },
];

const mockCustodies = [
    { id: 1, employeeName: 'عبدالرحمن الشهري', itemName: 'لابتوب Dell Latitude', issueDate: '2025-08-15', status: 'active' },
    { id: 2, employeeName: 'منال العتيبي', itemName: 'جوال آيفون 15', issueDate: '2025-11-20', status: 'active' },
    { id: 3, employeeName: 'فيصل الحربي', itemName: 'طابعة HP LaserJet', issueDate: '2025-06-10', status: 'transfer_pending' },
    { id: 4, employeeName: 'هند الزهراني', itemName: 'شاشة عرض LG 27"', issueDate: '2026-01-05', status: 'active' },
];

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
// 1. تنبيهات المخزون
// ═══════════════════════════════════════════════════════════

export default function InventoryAlertsWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const alertsResult = await api.warehouse?.getDashboardAlerts?.();
                if (alertsResult?.data?.length) {
                    setAlerts(alertsResult.data.slice(0, 5));
                } else {
                    const summaryResult = await api.warehouse?.getDashboardSummary?.();
                    if (summaryResult?.alerts?.length) setAlerts(summaryResult.alerts.slice(0, 5));
                    else setAlerts(mockAlerts);
                }
            } catch {
                setAlerts(mockAlerts);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={4} />;

    const priorityStyles = {
        high: {
            border: darkMode ? 'border-red-800/50' : 'border-red-200 dark:border-red-800',
            bg: darkMode ? 'bg-red-900/10' : 'bg-red-50/50',
            dot: 'bg-red-500',
            text: darkMode ? 'text-red-400' : 'text-red-600 dark:text-red-400',
        },
        medium: {
            border: darkMode ? 'border-orange-800/50' : 'border-orange-200',
            bg: darkMode ? 'bg-orange-900/10' : 'bg-orange-50/50',
            dot: 'bg-orange-500',
            text: darkMode ? 'text-orange-400' : 'text-orange-600',
        },
        low: {
            border: darkMode ? 'border-yellow-800/50' : 'border-yellow-200 dark:border-yellow-800',
            bg: darkMode ? 'bg-yellow-900/10' : 'bg-yellow-50/50',
            dot: 'bg-yellow-500',
            text: darkMode ? 'text-yellow-400' : 'text-yellow-600',
        },
    };

    const typeLabels = {
        low_stock: 'مخزون منخفض',
        expiring: 'قريب الانتهاء',
        pending: 'طلب معلق',
    };

    const counts = {
        low_stock: alerts.filter(a => a.type === 'low_stock').length,
        expiring: alerts.filter(a => a.type === 'expiring').length,
        pending: alerts.filter(a => a.type === 'pending').length,
    };

    return (
        <div className="space-y-3">
            {/* عدادات الفئات */}
            <div className="flex gap-2">
                {Object.entries(counts).filter(([, c]) => c > 0).map(([type, count]) => (
                    <span
                        key={type}
                        className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                            type === 'low_stock'
                                ? darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                : type === 'expiring'
                                    ? darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-600'
                                    : darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                        }`}
                    >
                        {typeLabels[type]}: {count}
                    </span>
                ))}
            </div>

            {/* قائمة التنبيهات */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {alerts.map((alert) => {
                    const style = priorityStyles[alert.priority] || priorityStyles.low;
                    return (
                        <div
                            key={alert.id}
                            className={`p-2.5 rounded-xl border transition-all ${style.border} ${style.bg}`}
                        >
                            <div className="flex items-start gap-2">
                                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {alert.message}
                                    </p>
                                    <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                                        {fmtDate(alert.date)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// 2. أصناف منخفضة المخزون
// ═══════════════════════════════════════════════════════════

export function LowStockWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.warehouse?.getItems?.({ filter: 'low-stock', pageSize: 5 });
                if (result?.data?.length) setItems(result.data);
                else setItems(mockLowStock);
            } catch {
                setItems(mockLowStock);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={4} />;

    return (
        <div className="space-y-2 max-h-[260px] overflow-y-auto">
            {items.map((item) => {
                const percent = item.minQty > 0 ? Math.round((item.currentQty / item.minQty) * 100) : 0;
                const isZero = item.currentQty === 0;
                const barColor = isZero
                    ? 'bg-red-500'
                    : percent < 30
                        ? 'bg-red-400'
                        : percent < 60
                            ? 'bg-orange-400'
                            : 'bg-yellow-400';

                return (
                    <div
                        key={item.id}
                        className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50 dark:bg-gray-800'}`}
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <p className={`text-xs font-medium truncate flex-1 ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                {item.nameAr}
                            </p>
                            <span className={`text-[10px] mr-2 ${isZero ? 'text-red-500 font-bold' : darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                {item.currentQty.toLocaleString('ar-SA')} / {item.minQty.toLocaleString('ar-SA')} {item.unit}
                            </span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// 3. حالة العهد
// ═══════════════════════════════════════════════════════════

export function CustodyStatusWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [custodies, setCustodies] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.warehouse?.reports?.getCustodies?.({ pageSize: 5 });
                if (result?.data?.length) setCustodies(result.data.slice(0, 5));
                else if (Array.isArray(result) && result.length) setCustodies(result.slice(0, 5));
                else setCustodies(mockCustodies);
            } catch {
                setCustodies(mockCustodies);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={4} />;

    const statusConfig = {
        active: { label: 'نشطة', color: darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
        transfer_pending: { label: 'نقل معلق', color: darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700' },
        returned: { label: 'مرتجعة', color: darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300' },
    };

    return (
        <div className="space-y-2 max-h-[260px] overflow-y-auto">
            {custodies.map((custody) => {
                const status = statusConfig[custody.status] || statusConfig.active;
                return (
                    <div
                        key={custody.id}
                        className={`p-3 rounded-xl border transition-all ${
                            darkMode ? 'bg-gray-700/30 border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {custody.employeeName}
                                </p>
                                <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {custody.itemName}
                                </p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${status.color}`}>
                                {status.label}
                            </span>
                        </div>
                        <p className={`text-[10px] mt-1 ${darkMode ? 'text-gray-600 dark:text-gray-300' : 'text-gray-300'}`}>
                            تاريخ التسليم: {fmtDate(custody.issueDate)}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
