import React, { useState, useEffect } from 'react';

export default function DigitalClock({ darkMode = false, showDate = true, showHijri = true }) {
    const [mounted, setMounted] = useState(false);
    const [time, setTime] = useState(null);

    useEffect(() => {
        setMounted(true);
        setTime(new Date());

        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        if (!date) return '--:--:--';
        return date.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date) => {
        if (!date) return '';
        return date.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatHijriDate = (date) => {
        if (!date) return '';
        return date.toLocaleDateString('ar-SA-u-ca-islamic', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const hours = time ? time.getHours() : 12;
    const period = hours >= 5 && hours < 12 ? 'صباحاً' : hours >= 12 && hours < 17 ? 'ظهراً' : hours >= 17 && hours < 21 ? 'مساءً' : 'ليلاً';
    const periodIcon = hours >= 5 && hours < 17 ? '☀️' : hours >= 17 && hours < 21 ? '🌅' : '🌙';

    // Show placeholder during SSR to prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="text-center py-2">
                <div className="mb-3">
                    <div className={`text-4xl font-bold font-mono tracking-wider ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        --:--:--
                    </div>
                    <div className={`flex items-center justify-center gap-2 mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span>⏰</span>
                        <span className="text-sm">جاري التحميل...</span>
                    </div>
                </div>
                {showDate && (
                    <div className={`pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                            ---
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="text-center py-2">
            {/* Time Display */}
            <div className="mb-3">
                <div className={`text-4xl font-bold font-mono tracking-wider ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {formatTime(time)}
                </div>
                <div className={`flex items-center justify-center gap-2 mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>{periodIcon}</span>
                    <span className="text-sm">{period}</span>
                </div>
            </div>

            {/* Date Display */}
            {showDate && (
                <div className={`pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                        {formatDate(time)}
                    </p>
                    {showHijri && (
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {formatHijriDate(time)}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// نسخة مصغرة للهيدر
export function MiniClock({ darkMode = false }) {
    const [mounted, setMounted] = useState(false);
    const [time, setTime] = useState(null);

    useEffect(() => {
        setMounted(true);
        setTime(new Date());

        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!mounted) {
        return (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
                <svg className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={`text-sm font-medium font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                    --:--
                </span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
            <svg className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-sm font-medium font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                {time ? time.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </span>
        </div>
    );
}
