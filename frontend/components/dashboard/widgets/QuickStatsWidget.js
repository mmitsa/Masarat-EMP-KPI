import React, { useState, useEffect } from 'react';

const defaultStats = [
    { id: 'employees', label: 'الموظفين', value: 0, change: '', trend: 'neutral', icon: '👥' },
    { id: 'requests', label: 'الطلبات المعلقة', value: 0, change: '', trend: 'neutral', icon: '📋' },
    { id: 'items', label: 'أصناف المخزون', value: 0, change: '', trend: 'neutral', icon: '📦' },
    { id: 'vehicles', label: 'مركبات متاحة', value: 0, change: '', trend: 'neutral', icon: '🚗' },
];

export default function QuickStatsWidget({ stats: propStats, darkMode = false, columns = 2 }) {
    const [loading, setLoading] = useState(!propStats);
    const [stats, setStats] = useState(propStats || defaultStats);

    useEffect(() => {
        if (propStats) return;

        const fetchStats = async () => {
            try {
                const res = await fetch('/api/dashboard/live-stats');
                const json = await res.json();
                if (json.success && json.data) {
                    const d = json.data;
                    setStats([
                        {
                            id: 'employees',
                            label: 'الموظفين',
                            value: d.attendance?.total || 0,
                            change: d.attendance?.presenceRate ? `${d.attendance.presenceRate}% حضور` : '',
                            trend: (d.attendance?.presenceRate || 0) >= 90 ? 'up' : 'neutral',
                            icon: '👥',
                        },
                        {
                            id: 'requests',
                            label: 'في إجازة',
                            value: d.attendance?.onLeave || 0,
                            change: '',
                            trend: 'neutral',
                            icon: '📋',
                        },
                        {
                            id: 'items',
                            label: 'أصناف المخزون',
                            value: d.inventory?.totalItems || 0,
                            change: d.inventory?.lowStock ? `${d.inventory.lowStock} منخفض` : '',
                            trend: (d.inventory?.lowStock || 0) > 0 ? 'down' : 'up',
                            icon: '📦',
                        },
                        {
                            id: 'vehicles',
                            label: 'مركبات نشطة',
                            value: d.fleet?.active || 0,
                            change: d.fleet?.total ? `من ${d.fleet.total}` : '',
                            trend: (d.fleet?.utilizationRate || 0) >= 80 ? 'up' : 'neutral',
                            icon: '🚗',
                        },
                    ]);
                }
            } catch (err) {
                console.warn('QuickStatsWidget: الخدمة غير متاحة');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [propStats]);

    const trendColors = {
        up: darkMode ? 'text-green-400' : 'text-green-600',
        down: darkMode ? 'text-red-400' : 'text-red-600',
        neutral: darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400',
    };

    const trendBg = {
        up: darkMode ? 'bg-green-900/30' : 'bg-green-50',
        down: darkMode ? 'bg-red-900/30' : 'bg-red-50',
        neutral: darkMode ? 'bg-gray-700' : 'bg-gray-100 dark:bg-gray-700/50',
    };

    if (loading) {
        return (
            <div className={`grid gap-3 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`p-4 rounded-xl animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
                        <div className={`h-4 w-16 rounded mb-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
                        <div className={`h-7 w-20 rounded mb-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
                        <div className={`h-3 w-12 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`grid gap-3 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {stats.map(stat => (
                <div
                    key={stat.id}
                    className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{stat.icon}</span>
                        {stat.change ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${trendBg[stat.trend]} ${trendColors[stat.trend]}`}>
                                {stat.trend === 'up' && '↑'}
                                {stat.trend === 'down' && '↓'}
                                {stat.change}
                            </span>
                        ) : null}
                    </div>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {typeof stat.value === 'number' ? stat.value.toLocaleString('ar-SA') : stat.value}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {stat.label}
                    </p>
                </div>
            ))}
        </div>
    );
}

// إحصائيات حسب القسم
export function DepartmentStats({ department, darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([]);

    useEffect(() => {
        const fetchDeptStats = async () => {
            try {
                const res = await fetch('/api/dashboard/live-stats');
                const json = await res.json();
                if (json.success && json.data) {
                    const d = json.data;
                    const deptMap = {
                        hr: [
                            { label: 'موظف نشط', value: d.attendance?.total || 0, icon: '👤' },
                            { label: 'في إجازة', value: d.attendance?.onLeave || 0, icon: '🏖️' },
                            { label: 'حاضر اليوم', value: d.attendance?.present || 0, icon: '✅' },
                        ],
                        warehouse: [
                            { label: 'صنف متاح', value: d.inventory?.totalItems || 0, icon: '📦' },
                            { label: 'مخزون منخفض', value: d.inventory?.lowStock || 0, icon: '⚠️' },
                        ],
                        movement: [
                            { label: 'مركبة نشطة', value: d.fleet?.active || 0, icon: '🚗' },
                            { label: 'في الصيانة', value: d.fleet?.maintenance || 0, icon: '🔧' },
                            { label: 'متوقف', value: d.fleet?.idle || 0, icon: '⏸️' },
                        ],
                    };
                    setStats(deptMap[department] || []);
                }
            } catch {
                setStats([]);
            } finally {
                setLoading(false);
            }
        };
        fetchDeptStats();
    }, [department]);

    if (loading) {
        return (
            <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-12 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'}`}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-xl">{stat.icon}</span>
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                            {stat.label}
                        </span>
                    </div>
                    <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {typeof stat.value === 'number' ? stat.value.toLocaleString('ar-SA') : stat.value}
                    </span>
                </div>
            ))}
        </div>
    );
}
