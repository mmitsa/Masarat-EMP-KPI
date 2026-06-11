/**
 * Theme Toggle Component - مفتاح تبديل الثيم
 * يدعم التبديل بين الثيم الحكومي والافتراضي + الوضع الليلي
 *
 * @version 2.0.0
 * @date 2026-02-03
 */

import React from 'react';
import { useTheme, THEMES, MODES } from '../../context/ThemeContext';

// ========== Icons ==========
const SunIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MoonIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const GovernmentIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
);

const PaletteIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

// ========== Main Component ==========
export default function ThemeToggle({ variant = 'default', showLabel = true }) {
    const {
        theme,
        mode,
        toggleTheme,
        toggleDarkMode,
        isGovernmentTheme,
        isDarkMode,
        themeConfig,
        currentColors
    } = useTheme();

    // Icon variant - just toggle theme type
    if (variant === 'icon') {
        return (
            <button
                onClick={toggleTheme}
                className={`
                    p-2 rounded-lg transition-all duration-300
                    ${isGovernmentTheme
                        ? isDarkMode
                            ? 'bg-green-900/50 text-green-400 hover:bg-green-900/70'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200'
                        : isDarkMode
                            ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-900/70'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200'
                    }
                `}
                title={isGovernmentTheme ? 'تبديل إلى الثيم الافتراضي' : 'تبديل إلى الثيم الحكومي'}
            >
                {isGovernmentTheme ? <GovernmentIcon /> : <PaletteIcon />}
            </button>
        );
    }

    // Dark mode icon variant
    if (variant === 'dark-mode') {
        return (
            <button
                onClick={toggleDarkMode}
                className={`
                    p-2 rounded-lg transition-all duration-300
                    ${isDarkMode
                        ? 'bg-yellow-900/50 text-yellow-400 hover:bg-yellow-900/70'
                        : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }
                `}
                title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
                {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>
        );
    }

    // Combined buttons
    if (variant === 'combined') {
        return (
            <div className="flex items-center gap-1">
                <button
                    onClick={toggleTheme}
                    className={`
                        p-2 rounded-lg transition-all duration-300
                        ${isGovernmentTheme
                            ? isDarkMode
                                ? 'bg-green-900/50 text-green-400 hover:bg-green-900/70'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200'
                            : isDarkMode
                                ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-900/70'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200'
                        }
                    `}
                    title={isGovernmentTheme ? 'الثيم الافتراضي' : 'الثيم الحكومي'}
                >
                    {isGovernmentTheme ? <GovernmentIcon /> : <PaletteIcon />}
                </button>
                <button
                    onClick={toggleDarkMode}
                    className={`
                        p-2 rounded-lg transition-all duration-300
                        ${isDarkMode
                            ? 'bg-yellow-900/50 text-yellow-400 hover:bg-yellow-900/70'
                            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }
                    `}
                    title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
                >
                    {isDarkMode ? <SunIcon /> : <MoonIcon />}
                </button>
            </div>
        );
    }

    // Compact variant
    if (variant === 'compact') {
        return (
            <button
                onClick={toggleTheme}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300
                    ${isGovernmentTheme
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/30'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                    }
                `}
            >
                {isGovernmentTheme ? <GovernmentIcon /> : <PaletteIcon />}
                <span className="text-sm font-medium">
                    {isGovernmentTheme ? 'حكومي' : 'افتراضي'}
                </span>
            </button>
        );
    }

    // Default variant - card style
    return (
        <div className={`
            rounded-xl p-6 border-2 transition-all duration-300
            ${isGovernmentTheme
                ? isDarkMode
                    ? 'border-green-600 bg-gradient-to-br from-green-950 to-green-900'
                    : 'border-green-600 bg-gradient-to-br from-green-50 to-green-100'
                : isDarkMode
                    ? 'border-blue-600 bg-gradient-to-br from-blue-950 to-blue-900'
                    : 'border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100'
            }
        `}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`
                        w-12 h-12 rounded-lg flex items-center justify-center
                        ${isGovernmentTheme ? 'bg-green-600' : 'bg-blue-600'}
                    `}>
                        {isGovernmentTheme
                            ? <GovernmentIcon className="w-6 h-6 text-white" />
                            : <PaletteIcon className="w-6 h-6 text-white" />
                        }
                    </div>
                    <div>
                        <h3 className={`
                            font-bold text-lg
                            ${isDarkMode
                                ? 'text-white'
                                : isGovernmentTheme ? 'text-green-900' : 'text-blue-900'
                            }
                        `}>
                            {isGovernmentTheme ? 'الثيم الحكومي' : 'الثيم الافتراضي'}
                        </h3>
                        <p className={`
                            text-sm
                            ${isDarkMode
                                ? 'text-gray-400'
                                : isGovernmentTheme ? 'text-green-600' : 'text-blue-600 dark:text-blue-400'
                            }
                        `}>
                            {isGovernmentTheme ? 'الهوية الحكومية السعودية' : 'الألوان الافتراضية'}
                        </p>
                    </div>
                </div>

                {/* Toggle Switch */}
                <button
                    onClick={toggleTheme}
                    className={`
                        relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300
                        ${isGovernmentTheme ? 'bg-green-600' : 'bg-blue-600'}
                    `}
                >
                    <span
                        className={`
                            inline-block h-6 w-6 transform rounded-full bg-white dark:bg-gray-900 transition-transform duration-300
                            ${isGovernmentTheme ? 'translate-x-7' : 'translate-x-1'}
                        `}
                    />
                </button>
            </div>

            {/* Dark Mode Toggle */}
            <div className={`
                flex items-center justify-between p-3 rounded-lg mb-4
                ${isDarkMode
                    ? 'bg-gray-800'
                    : isGovernmentTheme ? 'bg-green-100' : 'bg-blue-100 dark:bg-blue-900/30'
                }
            `}>
                <div className="flex items-center gap-2">
                    {isDarkMode ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    <span className={`
                        text-sm font-medium
                        ${isDarkMode
                            ? 'text-white'
                            : isGovernmentTheme ? 'text-green-800' : 'text-blue-800 dark:text-blue-200'
                        }
                    `}>
                        {isDarkMode ? 'الوضع الليلي' : 'الوضع النهاري'}
                    </span>
                </div>
                <button
                    onClick={toggleDarkMode}
                    className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300
                        ${isDarkMode
                            ? 'bg-yellow-500'
                            : 'bg-gray-300'
                        }
                    `}
                >
                    <span
                        className={`
                            inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-900 transition-transform duration-300
                            ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}
                        `}
                    />
                </button>
            </div>

            {showLabel && (
                <div className={`
                    p-3 rounded-lg
                    ${isDarkMode
                        ? 'bg-gray-800'
                        : isGovernmentTheme ? 'bg-green-100' : 'bg-blue-100 dark:bg-blue-900/30'
                    }
                `}>
                    <p className={`
                        text-sm
                        ${isDarkMode
                            ? 'text-gray-300'
                            : isGovernmentTheme ? 'text-green-800' : 'text-blue-800 dark:text-blue-200'
                        }
                    `}>
                        {isGovernmentTheme
                            ? '✨ الألوان الرسمية للمملكة العربية السعودية'
                            : '✨ الألوان الافتراضية للمنصة'
                        }
                        {isDarkMode ? ' - الوضع الليلي' : ' - الوضع النهاري'}
                    </p>
                </div>
            )}

            {/* Color Preview */}
            <div className="mt-4 grid grid-cols-5 gap-2">
                {['100', '300', '500', '600', '700'].map((shade) => (
                    <div
                        key={shade}
                        className="h-8 rounded"
                        style={{
                            backgroundColor: `var(--color-primary-${shade})`
                        }}
                        title={`Primary ${shade}`}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * مكون بسيط لمعاينة الثيم الحالي
 */
export function ThemeIndicator() {
    const { isGovernmentTheme, isDarkMode } = useTheme();

    return (
        <div className={`
            fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg
            ${isGovernmentTheme
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white'
            }
        `}>
            {isGovernmentTheme ? <GovernmentIcon className="w-4 h-4" /> : <PaletteIcon className="w-4 h-4" />}
            <span className="text-xs font-medium">
                {isGovernmentTheme ? 'حكومي' : 'افتراضي'}
            </span>
            {isDarkMode && (
                <>
                    <span className="text-xs opacity-60">|</span>
                    <MoonIcon className="w-4 h-4" />
                </>
            )}
        </div>
    );
}

/**
 * مفتاح بسيط للوضع الليلي فقط
 */
export function DarkModeToggle({ className = '' }) {
    const { isDarkMode, toggleDarkMode } = useTheme();

    return (
        <button
            onClick={toggleDarkMode}
            className={`
                p-2 rounded-lg transition-all duration-200
                ${isDarkMode
                    ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }
                ${className}
            `}
            title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
        >
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
        </button>
    );
}
