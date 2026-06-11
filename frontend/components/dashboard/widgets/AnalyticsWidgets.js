import React, { useState, useEffect } from 'react';

// ─── بيانات احتياطية ─────────────────────────────────────

const mockSystemHealth = [
    { name: 'الموارد البشرية', uptime: 99.9, responseTime: 85, status: 'healthy' },
    { name: 'المستودعات', uptime: 99.8, responseTime: 92, status: 'healthy' },
    { name: 'الحركة', uptime: 99.7, responseTime: 78, status: 'healthy' },
    { name: 'الأرشفة', uptime: 99.9, responseTime: 65, status: 'healthy' },
    { name: 'سداد', uptime: 98.5, responseTime: 156, status: 'degraded' },
    { name: 'تقييم الأداء', uptime: 99.6, responseTime: 88, status: 'healthy' },
    { name: 'التحليلات', uptime: 99.9, responseTime: 45, status: 'healthy' },
];

const mockKPIs = [
    { name: 'رضا الموظفين', target: 85, actual: 87, unit: '%', trend: 'up' },
    { name: 'استخدام الميزانية', target: 75, actual: 62.8, unit: '%', trend: 'neutral' },
    { name: 'دوران المخزون', target: 4.0, actual: 4.2, unit: 'x', trend: 'up' },
    { name: 'استخدام الأسطول', target: 85, actual: 84.6, unit: '%', trend: 'down' },
    { name: 'وقت التشغيل', target: 99.5, actual: 99.9, unit: '%', trend: 'up' },
    { name: 'نسبة السعودة', target: 70, actual: 74.9, unit: '%', trend: 'up' },
    { name: 'رقمنة المستندات', target: 80, actual: 73.5, unit: '%', trend: 'neutral' },
    { name: 'الامتثال التنظيمي', target: 95, actual: 98, unit: '%', trend: 'up' },
];

// ─── مكون مساعد ──────────────────────────────────────────

function LoadingSkeleton({ darkMode, rows = 3 }) {
    return (
        <div className="space-y-3 animate-pulse">
            {Array.from({ length: rows }, (_, i) => (
                <div key={i} className={`h-8 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// 1. صحة الأنظمة
// ═══════════════════════════════════════════════════════════

export default function SystemHealthWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [systems, setSystems] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.analytics?.getSystemHealth?.();
                if (result?.systems?.length) setSystems(result.systems);
                else setSystems(mockSystemHealth);
            } catch {
                setSystems(mockSystemHealth);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={6} />;

    const statusConfig = {
        healthy: { color: 'bg-green-500', label: 'سليم' },
        degraded: { color: 'bg-orange-500', label: 'بطيء' },
        down: { color: 'bg-red-500', label: 'متوقف' },
    };

    const healthyCount = systems.filter(s => s.status === 'healthy').length;

    return (
        <div className="space-y-3">
            {/* ملخص عام */}
            <div className={`p-2.5 rounded-xl flex items-center justify-between ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>الأنظمة السليمة</span>
                <span className={`text-sm font-bold ${
                    healthyCount === systems.length
                        ? darkMode ? 'text-green-400' : 'text-green-600 dark:text-green-400'
                        : darkMode ? 'text-orange-400' : 'text-orange-600'
                }`}>
                    {healthyCount} / {systems.length}
                </span>
            </div>

            {/* قائمة الأنظمة */}
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {systems.map((system, idx) => {
                    const config = statusConfig[system.status] || statusConfig.healthy;
                    return (
                        <div
                            key={idx}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all ${
                                darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                            }`}
                        >
                            {/* نقطة الحالة */}
                            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                                {system.status === 'healthy' && (
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.color} opacity-40`} />
                                )}
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.color}`} />
                            </span>

                            {/* اسم النظام */}
                            <span className={`text-xs flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                {system.name}
                            </span>

                            {/* وقت التشغيل */}
                            <span className={`text-[10px] font-mono ${
                                system.uptime >= 99.5
                                    ? darkMode ? 'text-green-400' : 'text-green-600 dark:text-green-400'
                                    : system.uptime >= 98
                                        ? darkMode ? 'text-orange-400' : 'text-orange-600'
                                        : darkMode ? 'text-red-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                                {system.uptime}%
                            </span>

                            {/* وقت الاستجابة */}
                            <span className={`text-[10px] w-12 text-left ${
                                system.responseTime <= 100
                                    ? darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'
                                    : darkMode ? 'text-orange-400' : 'text-orange-500'
                            }`}>
                                {system.responseTime}ms
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// 2. مؤشرات الأداء الرئيسية
// ═══════════════════════════════════════════════════════════

export function KPISummaryWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [kpis, setKPIs] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.analytics?.getKPIs?.();
                if (result?.data?.length) setKPIs(result.data);
                else setKPIs(mockKPIs);
            } catch {
                setKPIs(mockKPIs);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={6} />;

    const getTrafficLight = (actual, target) => {
        const ratio = actual / target;
        if (ratio >= 1) return { color: 'bg-green-500', label: 'محقق' };
        if (ratio >= 0.9) return { color: 'bg-yellow-500', label: 'قريب' };
        return { color: 'bg-red-500', label: 'متأخر' };
    };

    const trendIcons = {
        up: { icon: '↑', color: darkMode ? 'text-green-400' : 'text-green-600' },
        down: { icon: '↓', color: darkMode ? 'text-red-400' : 'text-red-600' },
        neutral: { icon: '→', color: darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400' },
    };

    const achievedCount = kpis.filter(k => k.actual >= k.target).length;

    return (
        <div className="space-y-3">
            {/* ملخص */}
            <div className={`p-2.5 rounded-xl flex items-center justify-between ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>المحققة</span>
                <span className={`text-sm font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {achievedCount} / {kpis.length}
                </span>
            </div>

            {/* قائمة KPIs */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {kpis.map((kpi, idx) => {
                    const traffic = getTrafficLight(kpi.actual, kpi.target);
                    const trend = trendIcons[kpi.trend] || trendIcons.neutral;
                    const barPercent = kpi.target > 0 ? Math.min(Math.round((kpi.actual / kpi.target) * 100), 100) : 0;

                    return (
                        <div key={idx} className={`p-2.5 rounded-xl ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50/70'}`}>
                            <div className="flex items-center gap-2 mb-1.5">
                                {/* إشارة المرور */}
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${traffic.color}`} />
                                {/* الاسم */}
                                <span className={`text-[11px] flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                    {kpi.name}
                                </span>
                                {/* الاتجاه */}
                                <span className={`text-xs font-bold ${trend.color}`}>{trend.icon}</span>
                            </div>

                            {/* الشريط */}
                            <div className="flex items-center gap-2">
                                <div className={`flex-1 h-1.5 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${traffic.color}`}
                                        style={{ width: `${barPercent}%` }}
                                    />
                                </div>
                                <span className={`text-[10px] font-mono w-16 text-left ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {kpi.actual}{kpi.unit} / {kpi.target}{kpi.unit}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
