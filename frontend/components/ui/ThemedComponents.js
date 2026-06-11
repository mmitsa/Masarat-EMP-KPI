/**
 * مكونات واجهة المستخدم المحسّنة للثيم السعودي
 * Theme-aware UI Components
 */
import React from 'react';
import { useThemeContext } from '../../context/ThemeContext';

/**
 * زر محسّن للثيم
 */
export function ThemedButton({ 
    children, 
    variant = 'primary', 
    size = 'md',
    className = '',
    ...props 
}) {
    const { isSaudiTheme, themeConfig } = useThemeContext();

    const baseClasses = 'font-medium transition-all duration-200 flex items-center justify-center gap-2';
    
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm rounded-lg',
        md: 'px-6 py-2.5 text-base rounded-xl',
        lg: 'px-8 py-3.5 text-lg rounded-xl',
    };

    const variantClasses = {
        primary: isSaudiTheme
            ? 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg hover:shadow-green-500/30'
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg hover:shadow-blue-500/30',
        secondary: isSaudiTheme
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 border-2 border-green-600'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 border-2 border-blue-600',
        outline: isSaudiTheme
            ? 'border-2 border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50'
            : 'border-2 border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50',
        gold: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 dark:text-white hover:from-yellow-600 hover:to-yellow-700 shadow-md hover:shadow-lg',
        success: 'bg-green-600 text-white hover:bg-green-700 shadow-md',
        danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md',
        ghost: isSaudiTheme
            ? 'text-green-700 dark:text-green-300 hover:bg-green-50'
            : 'text-blue-700 dark:text-blue-300 hover:bg-blue-50',
    };

    return (
        <button
            className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

/**
 * بطاقة محسّنة للثيم
 */
export function ThemedCard({ 
    children, 
    title,
    icon,
    variant = 'default',
    hoverable = true,
    className = '',
    ...props 
}) {
    const { isSaudiTheme } = useThemeContext();

    const variantClasses = {
        default: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
        primary: isSaudiTheme
            ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-600'
            : 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-600',
        gold: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-600',
        dark: 'bg-gray-900 border border-gray-800 text-white',
    };

    const hoverClasses = hoverable 
        ? isSaudiTheme
            ? 'hover:shadow-lg hover:shadow-green-500/20 hover:border-green-700'
            : 'hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-700'
        : '';

    return (
        <div
            className={`rounded-xl p-6 transition-all duration-200 ${variantClasses[variant]} ${hoverClasses} ${className}`}
            {...props}
        >
            {title && (
                <div className="flex items-center gap-3 mb-4">
                    {icon && (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSaudiTheme ? 'bg-green-600' : 'bg-blue-600'
                        }`}>
                            {icon}
                        </div>
                    )}
                    <h3 className={`font-bold text-lg ${
                        isSaudiTheme ? 'text-green-900' : 'text-blue-900'
                    }`}>
                        {title}
                    </h3>
                </div>
            )}
            {children}
        </div>
    );
}

/**
 * Badge محسّن للثيم
 */
export function ThemedBadge({ 
    children, 
    variant = 'primary',
    size = 'md',
    className = '',
    ...props 
}) {
    const { isSaudiTheme } = useThemeContext();

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
    };

    const variantClasses = {
        primary: isSaudiTheme
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300',
        success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300',
        warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 border border-yellow-300',
        danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300',
        info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300',
        gold: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-400',
    };

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
}

/**
 * Input محسّن للثيم
 */
export function ThemedInput({ 
    label,
    error,
    helperText,
    className = '',
    ...props 
}) {
    const { isSaudiTheme } = useThemeContext();

    const focusClasses = isSaudiTheme
        ? 'focus:border-green-600 focus:ring-green-500'
        : 'focus:border-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400';

    return (
        <div className="w-full">
            {label && (
                <label className="block mb-2 font-medium text-gray-900 dark:text-white">
                    {label}
                </label>
            )}
            <input
                className={`w-full px-4 py-2.5 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-lg transition-all
                    ${focusClasses} focus:outline-none focus:ring-2 focus:ring-opacity-20
                    ${error ? 'border-red-500' : ''}
                    ${className}`}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
            )}
        </div>
    );
}

/**
 * Alert محسّن للثيم
 */
export function ThemedAlert({ 
    children, 
    type = 'info',
    title,
    className = '',
    ...props 
}) {
    const { isSaudiTheme } = useThemeContext();

    const typeClasses = {
        success: isSaudiTheme
            ? 'bg-green-50 dark:bg-green-900/20 border-green-600 text-green-900'
            : 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-900',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-900',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-900',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-900',
    };

    const icons = {
        success: '✓',
        warning: '⚠',
        error: '✕',
        info: 'ℹ',
    };

    return (
        <div
            className={`rounded-lg p-4 border-l-4 ${typeClasses[type]} ${className}`}
            {...props}
        >
            <div className="flex items-start gap-3">
                <span className="text-2xl">{icons[type]}</span>
                <div>
                    {title && <h4 className="font-bold mb-1">{title}</h4>}
                    <div>{children}</div>
                </div>
            </div>
        </div>
    );
}

/**
 * Progress Bar محسّن للثيم
 */
export function ThemedProgress({ 
    value = 0,
    max = 100,
    label,
    showPercentage = true,
    className = '',
    ...props 
}) {
    const { isSaudiTheme } = useThemeContext();
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={className} {...props}>
            {(label || showPercentage) && (
                <div className="flex justify-between items-center mb-2">
                    {label && <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>}
                    {showPercentage && <span className="text-sm text-gray-600 dark:text-gray-300">{Math.round(percentage)}%</span>}
                </div>
            )}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 rounded-full ${
                        isSaudiTheme
                            ? 'bg-gradient-to-r from-green-600 to-green-500'
                            : 'bg-gradient-to-r from-blue-600 to-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

/**
 * Divider محسّن للثيم
 */
export function ThemedDivider({ 
    text,
    className = '',
    ...props 
}) {
    const { isSaudiTheme } = useThemeContext();

    if (text) {
        return (
            <div className={`flex items-center gap-4 my-6 ${className}`} {...props}>
                <div className={`flex-1 h-px ${isSaudiTheme ? 'bg-green-200' : 'bg-blue-200'}`} />
                <span className={`text-sm font-medium ${isSaudiTheme ? 'text-green-700' : 'text-blue-700 dark:text-blue-300'}`}>
                    {text}
                </span>
                <div className={`flex-1 h-px ${isSaudiTheme ? 'bg-green-200' : 'bg-blue-200'}`} />
            </div>
        );
    }

    return (
        <div className={`h-px my-6 ${isSaudiTheme ? 'bg-green-200' : 'bg-blue-200'} ${className}`} {...props} />
    );
}
