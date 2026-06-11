import React, { useState, useEffect } from 'react';

import { fmtDate } from '../../../utils/hijriDate';

// ─── بيانات احتياطية ─────────────────────────────────────

const mockVehicleData = {
    total: 45,
    active: 32,
    maintenance: 8,
    idle: 5,
    utilizationRate: 71,
};

const mockTrips = [
    { id: 1, driverName: 'سعود المطيري', vehiclePlate: 'أ ب ج ١٢٣٤', destination: 'الرياض - جدة', departureTime: '2026-02-10T08:30:00', status: 'in_progress' },
    { id: 2, driverName: 'ماجد القحطاني', vehiclePlate: 'هـ و ز ٥٦٧٨', destination: 'الرياض - الدمام', departureTime: '2026-02-10T07:00:00', status: 'in_progress' },
    { id: 3, driverName: 'تركي العنزي', vehiclePlate: 'ح ط ي ٩٠١٢', destination: 'داخل المدينة', departureTime: '2026-02-10T09:15:00', status: 'in_progress' },
];

const mockMaintenance = [
    { id: 1, plateNumber: 'أ ب ج ٤٥٦٧', vehicleType: 'تويوتا كامري', lastService: '2025-10-15', nextDue: '2026-01-15', urgency: 'overdue' },
    { id: 2, plateNumber: 'هـ و ز ٨٩٠١', vehicleType: 'هيونداي أكسنت', lastService: '2025-12-20', nextDue: '2026-02-20', urgency: 'due_soon' },
    { id: 3, plateNumber: 'ح ط ي ٢٣٤٥', vehicleType: 'نيسان باترول', lastService: '2026-01-10', nextDue: '2026-04-10', urgency: 'scheduled' },
    { id: 4, plateNumber: 'ك ل م ٦٧٨٩', vehicleType: 'تويوتا هايلكس', lastService: '2025-09-05', nextDue: '2025-12-05', urgency: 'overdue' },
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
// 1. حالة المركبات (Donut Chart)
// ═══════════════════════════════════════════════════════════

export default function VehicleStatusWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.movement?.getVehicles?.();
                if (result?.summary) {
                    setData(result.summary);
                } else if (result?.data?.length || (Array.isArray(result) && result.length)) {
                    const vehicles = result.data || result;
                    const total = vehicles.length;
                    const active = vehicles.filter(v => v.status === 'Active' || v.status === 'active' || v.isActive).length;
                    const maintenance = vehicles.filter(v => v.status === 'Maintenance' || v.status === 'maintenance' || v.needsMaintenance).length;
                    setData({ total, active, maintenance, idle: total - active - maintenance });
                } else {
                    setData(mockVehicleData);
                }
            } catch {
                setData(mockVehicleData);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={4} />;

    const d = data || mockVehicleData;
    const segments = [
        { label: 'نشط', value: d.active, color: '#10b981' },
        { label: 'صيانة', value: d.maintenance, color: '#f59e0b' },
        { label: 'متوقف', value: d.idle, color: '#6b7280' },
    ];
    const total = segments.reduce((s, seg) => s + seg.value, 0);

    // SVG Donut
    const size = 120;
    const strokeWidth = 16;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let cumulativeOffset = 0;

    return (
        <div className="flex flex-col items-center gap-3">
            {/* الدونات */}
            <div className="relative">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {segments.map((seg, i) => {
                        const segPercent = total > 0 ? seg.value / total : 0;
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
                                stroke={seg.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                                strokeDashoffset={-dashOffset}
                                strokeLinecap="round"
                                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                                style={{ transition: 'stroke-dasharray 0.5s ease' }}
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {total.toLocaleString('ar-SA')}
                    </span>
                    <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>مركبة</span>
                </div>
            </div>

            {/* المفتاح التوضيحي */}
            <div className="flex gap-4">
                {segments.map((seg) => (
                    <div key={seg.label} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                        <span className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {seg.label} ({seg.value.toLocaleString('ar-SA')})
                        </span>
                    </div>
                ))}
            </div>

            {/* نسبة الاستخدام */}
            <div className={`w-full p-2.5 rounded-xl text-center ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>نسبة الاستخدام: </span>
                <span className={`text-sm font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{d.utilizationRate}%</span>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// 2. الرحلات النشطة
// ═══════════════════════════════════════════════════════════

export function ActiveTripsWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [trips, setTrips] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.movement?.getInProgressMissions?.();
                if (result?.data?.length) setTrips(result.data.slice(0, 4));
                else if (result?.length) setTrips(result.slice(0, 4));
                else setTrips(mockTrips);
            } catch {
                setTrips(mockTrips);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={3} />;

    if (trips.length === 0) {
        return (
            <div className={`text-center py-6 ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                <span className="text-3xl block mb-2">🚗</span>
                <p className="text-sm">لا توجد رحلات نشطة حالياً</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 max-h-[240px] overflow-y-auto">
            {trips.map((trip) => (
                <div
                    key={trip.id}
                    className={`p-3 rounded-xl border transition-all ${
                        darkMode ? 'bg-gray-700/30 border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                    }`}
                >
                    <div className="flex items-start gap-2">
                        {/* نقطة نابضة */}
                        <span className="relative flex h-2.5 w-2.5 mt-1.5 flex-shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <p className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {trip.driverName}
                                </p>
                                <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {trip.vehiclePlate}
                                </span>
                            </div>
                            <p className={`text-[10px] mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                📍 {trip.destination}
                            </p>
                            <p className={`text-[10px] ${darkMode ? 'text-gray-600 dark:text-gray-300' : 'text-gray-300'}`}>
                                المغادرة: {new Date(trip.departureTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// 3. صيانة مستحقة
// ═══════════════════════════════════════════════════════════

export function MaintenanceDueWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [vehicles, setVehicles] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.movement?.getVehiclesNeedingMaintenance?.();
                if (result?.data?.length) setVehicles(result.data.slice(0, 4));
                else if (Array.isArray(result) && result.length) setVehicles(result.slice(0, 4));
                else setVehicles(mockMaintenance);
            } catch {
                setVehicles(mockMaintenance);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={4} />;

    const urgencyConfig = {
        overdue: {
            label: 'متأخرة',
            color: darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
            icon: '🔴',
        },
        due_soon: {
            label: 'قريبة',
            color: darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700',
            icon: '🟠',
        },
        scheduled: {
            label: 'مجدولة',
            color: darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            icon: '🟢',
        },
    };

    return (
        <div className="space-y-2 max-h-[260px] overflow-y-auto">
            {vehicles.map((vehicle) => {
                const urgency = urgencyConfig[vehicle.urgency] || urgencyConfig.scheduled;
                return (
                    <div
                        key={vehicle.id}
                        className={`p-3 rounded-xl border transition-all ${
                            darkMode ? 'bg-gray-700/30 border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{urgency.icon}</span>
                                <p className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {vehicle.plateNumber}
                                </p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${urgency.color}`}>
                                {urgency.label}
                            </span>
                        </div>
                        <p className={`text-[10px] ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                            {vehicle.vehicleType}
                        </p>
                        <div className={`flex items-center justify-between mt-1.5 text-[10px] ${darkMode ? 'text-gray-600 dark:text-gray-300' : 'text-gray-300'}`}>
                            <span>آخر صيانة: {fmtDate(vehicle.lastService)}</span>
                            <span>الموعد: {fmtDate(vehicle.nextDue)}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
