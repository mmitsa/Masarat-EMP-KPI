import React, { useState, useEffect } from 'react';

import { fmtDate } from '../../../utils/hijriDate';

// ─── بيانات احتياطية ─────────────────────────────────────

const mockSummary = {
    totalEmployees: 1254,
    active: 1189,
    onLeave: 42,
    newHires: 23,
    departments: 14,
    presenceRate: 94.1,
};

const mockLeaves = [
    { id: 1, employeeName: 'أحمد محمد العلي', leaveType: 'سنوية', startDate: '2026-02-12', endDate: '2026-02-20', days: 8, status: 'pending' },
    { id: 2, employeeName: 'فاطمة عبدالله السالم', leaveType: 'مرضية', startDate: '2026-02-11', endDate: '2026-02-13', days: 2, status: 'pending' },
    { id: 3, employeeName: 'خالد إبراهيم النصر', leaveType: 'اضطرارية', startDate: '2026-02-14', endDate: '2026-02-15', days: 1, status: 'pending' },
    { id: 4, employeeName: 'نورة سعد الحربي', leaveType: 'سنوية', startDate: '2026-02-18', endDate: '2026-02-25', days: 7, status: 'pending' },
];

const today = new Date();
const mockBirthdays = [
    { id: 1, name: 'سارة أحمد الشمري', department: 'تقنية المعلومات', birthDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString(), isToday: true },
    { id: 2, name: 'محمد علي الدوسري', department: 'الموارد البشرية', birthDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString(), isToday: false },
    { id: 3, name: 'عبدالله خالد المالكي', department: 'المالية', birthDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2).toISOString(), isToday: false },
    { id: 4, name: 'ريم فهد القحطاني', department: 'المستودعات', birthDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4).toISOString(), isToday: false },
    { id: 5, name: 'يوسف عمر الغامدي', department: 'الشؤون الإدارية', birthDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6).toISOString(), isToday: false },
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

// ─── مكون مساعد: صندوق إحصائية ────────────────────────────

function StatBox({ icon, label, value, color, darkMode }) {
    const colorMap = {
        blue: darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        green: darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600',
        orange: darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-50 text-orange-600',
        purple: darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
        red: darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600 dark:text-red-400',
    };

    return (
        <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800'}`}>
            <div className="flex items-center gap-2 mb-1">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${colorMap[color] || colorMap.blue}`}>
                    {icon}
                </span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
            </div>
            <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {typeof value === 'number' ? value.toLocaleString('ar-SA') : value}
            </p>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// 1. ملخص الموارد البشرية
// ═══════════════════════════════════════════════════════════

export default function HRSummaryWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.hr?.getDashboardSummary?.();
                if (result) setData(result);
            } catch {
                setData(mockSummary);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={4} />;

    const d = data || mockSummary;
    const activePercent = Math.round((d.active / d.totalEmployees) * 100);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
                <StatBox icon="👥" label="إجمالي" value={d.totalEmployees} color="blue" darkMode={darkMode} />
                <StatBox icon="✅" label="نشط" value={d.active} color="green" darkMode={darkMode} />
                <StatBox icon="🏖️" label="إجازة" value={d.onLeave} color="orange" darkMode={darkMode} />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <StatBox icon="🆕" label="موظفين جدد" value={d.newHires} color="purple" darkMode={darkMode} />
                <StatBox icon="🏢" label="الأقسام" value={d.departments} color="blue" darkMode={darkMode} />
            </div>
            {/* شريط نسبة الحضور */}
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>نسبة الحضور</span>
                    <span className={`text-sm font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{activePercent}%</span>
                </div>
                <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <div
                        className="h-full rounded-full bg-gradient-to-l from-green-400 to-green-500 transition-all duration-500"
                        style={{ width: `${activePercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// 2. طلبات الإجازة المعلقة
// ═══════════════════════════════════════════════════════════

export function LeaveRequestsWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [leaves, setLeaves] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.hr?.leaves?.getPending?.();
                if (result?.data?.length) setLeaves(result.data.slice(0, 4));
                else setLeaves(mockLeaves);
            } catch {
                setLeaves(mockLeaves);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={4} />;

    const leaveTypeColors = {
        'سنوية': darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
        'مرضية': darkMode ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-700',
        'اضطرارية': darkMode ? 'bg-orange-900/40 text-orange-400' : 'bg-orange-100 text-orange-700',
    };

    return (
        <div className="space-y-2">
            {/* عداد الطلبات */}
            <div className="flex items-center justify-between mb-1">
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>بانتظار الموافقة</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700">
                    {leaves.length}
                </span>
            </div>

            {/* قائمة الطلبات */}
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {leaves.map((leave) => (
                    <div
                        key={leave.id}
                        className={`p-3 rounded-xl border transition-all ${
                            darkMode
                                ? 'bg-gray-700/30 border-gray-700 hover:border-gray-600'
                                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 hover:shadow-sm'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {leave.employeeName}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${leaveTypeColors[leave.leaveType] || leaveTypeColors['سنوية']}`}>
                                        {leave.leaveType}
                                    </span>
                                    <span className={`text-[10px] ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                                        {leave.days} يوم
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button className="w-6 h-6 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 flex items-center justify-center transition-colors" title="موافقة">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </button>
                                <button className="w-6 h-6 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-colors" title="رفض">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <p className={`text-[10px] mt-1.5 ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                            {fmtDate(leave.startDate)} — {fmtDate(leave.endDate)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// 3. أعياد الميلاد القادمة
// ═══════════════════════════════════════════════════════════

export function BirthdaysWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [birthdays, setBirthdays] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const api = (await import('../../../lib/api')).default;
                const result = await api.hr?.getEmployees?.({ upcomingBirthdays: true });
                if (result?.data?.length) setBirthdays(result.data.slice(0, 5));
                else setBirthdays(mockBirthdays);
            } catch {
                setBirthdays(mockBirthdays);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSkeleton darkMode={darkMode} rows={4} />;

    const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'];

    const formatBirthDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.round((date - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'اليوم';
        if (diffDays === 1) return 'غداً';
        return `بعد ${diffDays} أيام`;
    };

    return (
        <div className="space-y-2 max-h-[260px] overflow-y-auto">
            {birthdays.map((person, idx) => {
                const isToday = person.isToday || formatBirthDate(person.birthDate) === 'اليوم';
                return (
                    <div
                        key={person.id}
                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                            isToday
                                ? darkMode
                                    ? 'bg-amber-900/20 border border-amber-800/30'
                                    : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                                : darkMode
                                    ? 'hover:bg-gray-700/50'
                                    : 'hover:bg-gray-50'
                        }`}
                    >
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarColors[idx % avatarColors.length]}`}>
                            {person.name.charAt(0)}
                        </div>
                        {/* المعلومات */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                {isToday && '🎂 '}{person.name}
                            </p>
                            <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {person.department}
                            </p>
                        </div>
                        {/* التاريخ */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                            isToday
                                ? 'bg-amber-500/20 text-amber-600 font-bold'
                                : darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'
                        }`}>
                            {formatBirthDate(person.birthDate)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
