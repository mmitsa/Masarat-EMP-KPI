/**
 * ThemeSwitcher - مكون تبديل الثيمات
 * يتيح التبديل بين الثيم الحكومي والافتراضي
 * مع دعم الوضع الليلي والنهاري
 *
 * @version 1.0.0
 * @date 2026-02-03
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, THEMES, MODES } from '../../context/ThemeContext';

// ========== Icons ==========
const SunIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MoonIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const SystemIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const PaletteIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

const GovernmentIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
);

// ========== Theme Switcher Dropdown ==========
export function ThemeSwitcherDropdown({ className = '' }) {
    const { theme, mode, setTheme, setMode, isGovernmentTheme, isDarkMode } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const themes = [
        {
            id: THEMES.DEFAULT,
            name: 'الافتراضي',
            nameEn: 'Default',
            icon: <PaletteIcon />,
            color: '#1d4ed8'
        },
        {
            id: THEMES.GOVERNMENT,
            name: 'الحكومي',
            nameEn: 'Government',
            icon: <GovernmentIcon />,
            color: '#165C2D'
        }
    ];

    const modes = [
        { id: MODES.LIGHT, name: 'نهاري', nameEn: 'Light', icon: <SunIcon /> },
        { id: MODES.DARK, name: 'ليلي', nameEn: 'Dark', icon: <MoonIcon /> },
        { id: MODES.SYSTEM, name: 'تلقائي', nameEn: 'System', icon: <SystemIcon /> }
    ];

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl
                    transition-all duration-200
                    ${isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                        : 'bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 text-gray-700 dark:text-gray-200'
                    }
                `}
                title="تخصيص المظهر"
            >
                {isGovernmentTheme ? <GovernmentIcon /> : <PaletteIcon />}
                <span className="text-sm font-medium hidden sm:inline">
                    {isGovernmentTheme ? 'حكومي' : 'افتراضي'}
                </span>
                {isDarkMode ? <MoonIcon /> : <SunIcon />}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className={`
                    absolute left-0 mt-2 w-72 rounded-xl shadow-xl z-50
                    border overflow-hidden
                    ${isDarkMode
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                    }
                `}>
                    {/* Header */}
                    <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            تخصيص المظهر
                        </h3>
                        <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            اختر الثيم والوضع المفضل
                        </p>
                    </div>

                    {/* Theme Selection */}
                    <div className="p-3">
                        <label className={`text-xs font-medium mb-2 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            الثيم
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {themes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`
                                        relative flex items-center gap-2 p-3 rounded-xl border-2 transition-all
                                        ${theme === t.id
                                            ? isDarkMode
                                                ? 'border-primary-500 bg-primary-500/10'
                                                : 'border-primary-500 bg-primary-50'
                                            : isDarkMode
                                                ? 'border-gray-700 hover:border-gray-600'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                                        style={{ backgroundColor: t.color }}
                                    >
                                        {t.icon}
                                    </div>
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {t.name}
                                    </span>
                                    {theme === t.id && (
                                        <span className="absolute top-1 left-1 text-primary-500">
                                            <CheckIcon />
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div className={`p-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100 dark:border-gray-800'}`}>
                        <label className={`text-xs font-medium mb-2 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            الوضع
                        </label>
                        <div className="flex gap-2">
                            {modes.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id)}
                                    className={`
                                        flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all
                                        ${mode === m.id
                                            ? isDarkMode
                                                ? 'border-primary-500 bg-primary-500/10'
                                                : 'border-primary-500 bg-primary-50'
                                            : isDarkMode
                                                ? 'border-gray-700 hover:border-gray-600'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <span className={mode === m.id ? 'text-primary-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}>
                                        {m.icon}
                                    </span>
                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {m.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className={`p-3 border-t ${isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800'}`}>
                        <div className="flex items-center justify-between text-xs">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}>
                                المعاينة:
                            </span>
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-4 h-4 rounded-full border"
                                    style={{
                                        backgroundColor: isGovernmentTheme ? '#165C2D' : '#1d4ed8',
                                        borderColor: isDarkMode ? '#374151' : '#e5e7eb'
                                    }}
                                />
                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}>
                                    {isGovernmentTheme ? 'أخضر حكومي' : 'أزرق افتراضي'}
                                    {' + '}
                                    {isDarkMode ? 'داكن' : 'فاتح'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ========== Quick Theme Toggle Button ==========
export function ThemeToggleButton({ className = '' }) {
    const { toggleTheme, isGovernmentTheme, isDarkMode } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`
                p-2.5 rounded-xl transition-all duration-200
                ${isDarkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600 dark:text-gray-300'
                }
                ${className}
            `}
            title={isGovernmentTheme ? 'التبديل للثيم الافتراضي' : 'التبديل للثيم الحكومي'}
        >
            {isGovernmentTheme ? <GovernmentIcon /> : <PaletteIcon />}
        </button>
    );
}

// ========== Quick Dark Mode Toggle Button ==========
export function DarkModeToggleButton({ className = '' }) {
    const { toggleDarkMode, isDarkMode } = useTheme();

    return (
        <button
            onClick={toggleDarkMode}
            className={`
                p-2.5 rounded-xl transition-all duration-200
                ${isDarkMode
                    ? 'hover:bg-gray-700 text-yellow-400'
                    : 'hover:bg-gray-100 text-gray-600 dark:text-gray-300'
                }
                ${className}
            `}
            title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
        >
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
        </button>
    );
}

// ========== Compact Theme Switcher ==========
export function ThemeSwitcherCompact({ className = '' }) {
    const { toggleTheme, toggleDarkMode, isGovernmentTheme, isDarkMode } = useTheme();

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <ThemeToggleButton />
            <DarkModeToggleButton />
        </div>
    );
}

// ========== Theme Switcher Card (for Settings page) ==========
export function ThemeSwitcherCard() {
    const { theme, mode, setTheme, setMode, isGovernmentTheme, isDarkMode } = useTheme();

    return (
        <div className={`
            rounded-2xl border p-6
            ${isDarkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
            }
        `}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                تخصيص المظهر
            </h3>

            {/* Theme Selection */}
            <div className="mb-6">
                <label className={`text-sm font-medium mb-3 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                    اختر الثيم
                </label>
                <div className="grid grid-cols-2 gap-4">
                    {/* Default Theme */}
                    <button
                        onClick={() => setTheme(THEMES.DEFAULT)}
                        className={`
                            relative p-4 rounded-xl border-2 transition-all text-right
                            ${theme === THEMES.DEFAULT
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : isDarkMode
                                    ? 'border-gray-700 hover:border-gray-600'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }
                        `}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white">
                                <PaletteIcon />
                            </div>
                            <div>
                                <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    الافتراضي
                                </h4>
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    تصميم عصري بالأزرق
                                </p>
                            </div>
                        </div>
                        {theme === THEMES.DEFAULT && (
                            <span className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                <CheckIcon />
                            </span>
                        )}
                    </button>

                    {/* Government Theme */}
                    <button
                        onClick={() => setTheme(THEMES.GOVERNMENT)}
                        className={`
                            relative p-4 rounded-xl border-2 transition-all text-right
                            ${theme === THEMES.GOVERNMENT
                                ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                                : isDarkMode
                                    ? 'border-gray-700 hover:border-gray-600'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }
                        `}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center text-white">
                                <GovernmentIcon />
                            </div>
                            <div>
                                <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    الحكومي
                                </h4>
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    الأخضر السعودي الرسمي
                                </p>
                            </div>
                        </div>
                        {theme === THEMES.GOVERNMENT && (
                            <span className="absolute top-2 left-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white">
                                <CheckIcon />
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Mode Selection */}
            <div>
                <label className={`text-sm font-medium mb-3 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                    اختر الوضع
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: MODES.LIGHT, name: 'نهاري', icon: <SunIcon /> },
                        { id: MODES.DARK, name: 'ليلي', icon: <MoonIcon /> },
                        { id: MODES.SYSTEM, name: 'تلقائي', icon: <SystemIcon /> }
                    ].map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id)}
                            className={`
                                flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                                ${mode === m.id
                                    ? isGovernmentTheme
                                        ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                                        : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : isDarkMode
                                        ? 'border-gray-700 hover:border-gray-600'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }
                            `}
                        >
                            <span className={
                                mode === m.id
                                    ? isGovernmentTheme ? 'text-green-600 dark:text-green-400' : 'text-blue-500'
                                    : isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                            }>
                                {m.icon}
                            </span>
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                                {m.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Default export
export default ThemeSwitcherDropdown;
