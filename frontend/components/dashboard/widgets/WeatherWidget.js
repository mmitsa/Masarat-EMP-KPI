import React, { useState, useEffect } from 'react';

const weatherIcons = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    stormy: '⛈️',
    snowy: '❄️',
    windy: '💨',
    partlyCloudy: '⛅',
};

const weatherLabels = {
    sunny: 'مشمس',
    cloudy: 'غائم',
    rainy: 'ممطر',
    stormy: 'عاصف',
    snowy: 'ثلجي',
    windy: 'رياح',
    partlyCloudy: 'غائم جزئياً',
};

export default function WeatherWidget({ weather = null, darkMode = false }) {
    const [mounted, setMounted] = useState(false);
    const [currentTime, setCurrentTime] = useState(null);

    useEffect(() => {
        setMounted(true);
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Show loading state during SSR
    if (!mounted || !currentTime) {
        return (
            <div className={`text-center animate-pulse`}>
                <div className="mb-4">
                    <div className={`h-4 w-20 mx-auto rounded mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className={`h-16 w-16 mx-auto rounded-full mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className={`h-10 w-16 mx-auto rounded mb-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className={`h-4 w-12 mx-auto rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                </div>
                <div className={`flex justify-center gap-6 py-3 border-y ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className={`h-8 w-16 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className={`h-8 w-16 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-20 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!weather) {
        return (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <div className="text-4xl mb-3">🌡️</div>
                <p className="text-sm">بيانات الطقس غير متوفرة</p>
            </div>
        );
    }

    const hours = currentTime.getHours();
    const isNight = hours < 6 || hours >= 18;

    return (
        <div className={`text-center ${isNight && !darkMode ? 'bg-gradient-to-b from-indigo-900 to-purple-900 -m-4 p-4 rounded-xl' : ''}`}>
            {/* Current Weather */}
            <div className="mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <svg className={`w-4 h-4 ${darkMode || isNight ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className={`text-sm ${darkMode || isNight ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                        {weather.location}
                    </span>
                </div>

                <div className="text-6xl mb-2">
                    {isNight && weather.condition === 'sunny' ? '🌙' : weatherIcons[weather.condition]}
                </div>

                <div className={`text-4xl font-bold mb-1 ${darkMode || isNight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {weather.temperature}°
                </div>

                <div className={`text-sm ${darkMode || isNight ? 'text-gray-400' : 'text-gray-500'}`}>
                    {weatherLabels[weather.condition]}
                </div>
            </div>

            {/* Details */}
            <div className={`flex justify-center gap-6 py-3 border-y ${darkMode || isNight ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="text-center">
                    <div className={`text-xs ${darkMode || isNight ? 'text-gray-500' : 'text-gray-400'}`}>الرطوبة</div>
                    <div className={`font-bold ${darkMode || isNight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {weather.humidity}%
                    </div>
                </div>
                <div className="text-center">
                    <div className={`text-xs ${darkMode || isNight ? 'text-gray-500' : 'text-gray-400'}`}>الرياح</div>
                    <div className={`font-bold ${darkMode || isNight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {weather.wind} كم/س
                    </div>
                </div>
            </div>

            {/* Forecast */}
            <div className="grid grid-cols-3 gap-2 mt-3">
                {weather.forecast.map((day, index) => (
                    <div
                        key={index}
                        className={`p-2 rounded-lg ${darkMode || isNight ? 'bg-gray-700/50' : 'bg-gray-100 dark:bg-gray-700/50'}`}
                    >
                        <div className={`text-xs mb-1 ${darkMode || isNight ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {day.day}
                        </div>
                        <div className="text-xl mb-1">
                            {weatherIcons[day.condition]}
                        </div>
                        <div className={`text-sm font-bold ${darkMode || isNight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            {day.temp}°
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// نسخة مصغرة للهيدر
export function MiniWeather({ weather = null, darkMode = false }) {
    if (!weather) {
        return (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
                <span className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                    بيانات الطقس غير متوفرة
                </span>
            </div>
        );
    }
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
            <span>{weatherIcons[weather.condition]}</span>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                {weather.temperature}°
            </span>
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {weather.location}
            </span>
        </div>
    );
}
