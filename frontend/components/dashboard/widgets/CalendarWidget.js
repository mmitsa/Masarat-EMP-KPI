import React, { useState, useEffect } from 'react';

const mockEvents = [
    { id: 1, title: 'اجتماع الإدارة', date: '2026-01-26', type: 'meeting' },
    { id: 2, title: 'موعد صيانة مركبة', date: '2026-01-24', type: 'maintenance' },
    { id: 3, title: 'تسليم التقرير الشهري', date: '2026-01-31', type: 'deadline' },
    { id: 4, title: 'ورشة تدريبية', date: '2026-01-28', type: 'training' },
];

export default function CalendarWidget({ events = mockEvents, darkMode = false }) {
    const [mounted, setMounted] = useState(false);
    const [currentDate, setCurrentDate] = useState(null);
    const [today, setToday] = useState(null);

    useEffect(() => {
        setMounted(true);
        setCurrentDate(new Date());
        setToday(new Date());
    }, []);

    const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const dayNames = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

    const prevMonth = () => {
        if (!currentDate) return;
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        if (!currentDate) return;
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const hasEvent = (day) => {
        if (!currentDate) return false;
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.some(e => e.date === dateStr);
    };

    const isToday = (day) => {
        if (!today || !currentDate) return false;
        return today.getDate() === day &&
            today.getMonth() === currentDate.getMonth() &&
            today.getFullYear() === currentDate.getFullYear();
    };

    // Show loading during SSR
    if (!mounted || !currentDate) {
        return (
            <div className="animate-pulse">
                <div className={`h-8 rounded mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className={`h-6 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {[...Array(35)].map((_, i) => (
                        <div key={i} className={`aspect-square rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    ))}
                </div>
            </div>
        );
    }

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    // Generate calendar days
    const days = [];
    // Empty cells before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={nextMonth}
                    className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600 dark:text-gray-300'}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button
                    onClick={prevMonth}
                    className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600 dark:text-gray-300'}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                    <div key={day} className={`text-center text-xs font-medium py-1 ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                    <div
                        key={index}
                        className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative ${day
                            ? isToday(day)
                                ? 'bg-blue-600 text-white font-bold'
                                : darkMode
                                    ? 'hover:bg-gray-700 text-gray-300 cursor-pointer'
                                    : 'hover:bg-gray-100 text-gray-700 dark:text-gray-200 cursor-pointer'
                            : ''
                            }`}
                    >
                        {day}
                        {day && hasEvent(day) && (
                            <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isToday(day) ? 'bg-white dark:bg-gray-900' : 'bg-blue-500'}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Upcoming Events */}
            <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                <h4 className={`text-xs font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    الأحداث القادمة
                </h4>
                <div className="space-y-2">
                    {events.slice(0, 3).map(event => (
                        <div
                            key={event.id}
                            className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'}`}
                        >
                            <div className={`w-2 h-2 rounded-full ${event.type === 'meeting' ? 'bg-blue-500' :
                                event.type === 'deadline' ? 'bg-red-500' :
                                    event.type === 'training' ? 'bg-purple-500' : 'bg-amber-500'
                                }`} />
                            <span className={`text-xs flex-1 truncate ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                {event.title}
                            </span>
                            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {new Date(event.date).getDate()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
