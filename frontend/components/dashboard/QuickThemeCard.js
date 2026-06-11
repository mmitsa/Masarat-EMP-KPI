/**
 * بطاقة الثيم السريعة - للعرض في لوحة التحكم
 * Quick Theme Card Component
 */
import React from 'react';
import Link from 'next/link';
import { useThemeContext } from '../../context/ThemeContext';

export default function QuickThemeCard() {
    const { isSaudiTheme, themeConfig, toggleTheme } = useThemeContext();

    return (
        <div className={`rounded-xl p-6 border-2 transition-all duration-300 ${
            isSaudiTheme
                ? 'border-green-600 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg hover:shadow-green-500/20'
                : 'border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg hover:shadow-blue-500/20'
        }`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl shadow-md ${
                        isSaudiTheme ? 'bg-green-600' : 'bg-blue-600'
                    }`}>
                        {isSaudiTheme ? '🇸🇦' : '🎨'}
                    </div>
                    <div>
                        <h3 className={`font-bold ${
                            isSaudiTheme ? 'text-green-900' : 'text-blue-900'
                        }`}>
                            {themeConfig.name}
                        </h3>
                        <p className={`text-sm ${
                            isSaudiTheme ? 'text-green-600' : 'text-blue-600 dark:text-blue-400'
                        }`}>
                            الثيم الحالي
                        </p>
                    </div>
                </div>
                
                {/* Toggle Switch */}
                <button
                    onClick={toggleTheme}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                        isSaudiTheme ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    title="تبديل الثيم"
                >
                    <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-900 transition-transform duration-300 shadow-md ${
                            isSaudiTheme ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>

            {/* Color Preview */}
            <div className="grid grid-cols-5 gap-1 mb-4">
                {[500, 600, 700, 400, 300].map((shade) => (
                    <div
                        key={shade}
                        className="h-6 rounded shadow-sm dark:shadow-gray-900/20"
                        style={{ backgroundColor: themeConfig.colors.primary[shade] }}
                    />
                ))}
            </div>

            {/* Link to settings */}
            <Link
                href="/settings/theme"
                className={`block text-center py-2 px-4 rounded-lg font-medium transition-all ${
                    isSaudiTheme
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
                إعدادات المظهر الكاملة
            </Link>
        </div>
    );
}

/**
 * Badge صغير لإظهار الثيم الحالي
 */
export function ThemeBadge() {
    const { isSaudiTheme } = useThemeContext();

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isSaudiTheme
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300'
        }`}>
            <span>{isSaudiTheme ? '🇸🇦' : '🎨'}</span>
            <span>{isSaudiTheme ? 'السعودي' : 'الافتراضي'}</span>
        </span>
    );
}
