/**
 * Theme Context - نظام إدارة الثيمات المتكامل
 * يدعم التبديل بين الثيم الحكومي والافتراضي
 * مع دعم الوضع الليلي والنهاري
 *
 * @version 2.0.0
 * @date 2026-02-03
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

// ========== Theme Constants ==========
export const THEMES = {
    DEFAULT: 'default',
    GOVERNMENT: 'government'
};

export const MODES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
};

// ========== Theme Configurations ==========

// الثيم الحكومي - الألوان الرسمية للمملكة العربية السعودية
export const GOVERNMENT_THEME = {
    id: 'government',
    name: 'الثيم الحكومي',
    nameEn: 'Government Theme',
    description: 'التصميم الرسمي الحكومي السعودي',
    icon: '🏛️',
    colors: {
        light: {
            // الألوان الأساسية - الأخضر السعودي
            primary: {
                50: '#e8f5ec',
                100: '#c8e6cf',
                200: '#a5d6b1',
                300: '#81c793',
                400: '#66ba7d',
                500: '#165C2D',    // الأخضر السعودي الرسمي
                600: '#124d26',
                700: '#0e3e1f',
                800: '#0a2f18',
                900: '#062011',
            },
            // الذهبي
            secondary: {
                50: '#fefce8',
                100: '#fef9c3',
                200: '#fef08a',
                300: '#fde047',
                400: '#facc15',
                500: '#D4AF37',    // الذهبي
                600: '#ca8a04',
                700: '#a16207',
                800: '#854d0e',
                900: '#713f12',
            },
            // دلالية
            success: '#165C2D',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#0284c7',
            // خلفيات
            background: '#FFFFFF',
            backgroundSoft: '#F8FBF9',
            backgroundMedium: '#F0F7F4',
            surface: '#FFFFFF',
            surfaceHover: '#F8FBF9',
            // نصوص
            textPrimary: '#1A1A1A',
            textSecondary: '#4B5563',
            textTertiary: '#9CA3AF',
            textInverse: '#FFFFFF',
            // حدود
            border: '#E5E7EB',
            borderMedium: '#D1D5DB',
            borderFocus: '#165C2D',
            // أخرى
            sidebar: '#0A3319',
            sidebarText: '#FFFFFF',
            sidebarHover: 'rgba(255,255,255,0.1)',
            header: '#FFFFFF',
            headerBorder: '#E5E7EB',
        },
        dark: {
            primary: {
                50: '#062011',
                100: '#0a2f18',
                200: '#0e3e1f',
                300: '#124d26',
                400: '#165C2D',
                500: '#1a7035',    // أفتح للوضع الليلي
                600: '#22863f',
                700: '#2a9c49',
                800: '#32b253',
                900: '#3ac85d',
            },
            secondary: {
                50: '#713f12',
                100: '#854d0e',
                200: '#a16207',
                300: '#ca8a04',
                400: '#D4AF37',
                500: '#e6c349',    // أفتح للوضع الليلي
                600: '#f0d35b',
                700: '#f5de7a',
                800: '#fae999',
                900: '#fef4b8',
            },
            success: '#22c55e',
            warning: '#fbbf24',
            error: '#f87171',
            info: '#38bdf8',
            background: '#0f1610',
            backgroundSoft: '#151d18',
            backgroundMedium: '#1b2420',
            surface: '#1e2921',
            surfaceHover: '#253029',
            textPrimary: '#f0fdf4',
            textSecondary: '#a3cbb3',
            textTertiary: '#6b9a7d',
            textInverse: '#0f1610',
            border: '#2d3d32',
            borderMedium: '#3d4d42',
            borderFocus: '#22c55e',
            sidebar: '#0a1a0f',
            sidebarText: '#f0fdf4',
            sidebarHover: 'rgba(255,255,255,0.1)',
            header: '#1e2921',
            headerBorder: '#2d3d32',
        }
    },
    shadows: {
        light: {
            sm: '0 1px 2px 0 rgba(22, 92, 45, 0.05)',
            md: '0 4px 6px -1px rgba(22, 92, 45, 0.1)',
            lg: '0 10px 15px -3px rgba(22, 92, 45, 0.1)',
            xl: '0 20px 25px -5px rgba(22, 92, 45, 0.15)',
        },
        dark: {
            sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
            md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
            lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
            xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }
    }
};

// الثيم الافتراضي (الأزرق)
export const DEFAULT_THEME = {
    id: 'default',
    name: 'الثيم الافتراضي',
    nameEn: 'Default Theme',
    description: 'التصميم الافتراضي للمنصة',
    icon: '🎨',
    colors: {
        light: {
            primary: {
                50: '#eff6ff',
                100: '#dbeafe',
                200: '#bfdbfe',
                300: '#93c5fd',
                400: '#60a5fa',
                500: '#1d4ed8',
                600: '#1e40af',
                700: '#1e3a8a',
                800: '#1e3a8a',
                900: '#172554',
            },
            secondary: {
                50: '#faf5ff',
                100: '#f3e8ff',
                200: '#e9d5ff',
                300: '#d8b4fe',
                400: '#c084fc',
                500: '#8a38f5',
                600: '#7c3aed',
                700: '#6d28d9',
                800: '#5b21b6',
                900: '#4c1d95',
            },
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
            background: '#FFFFFF',
            backgroundSoft: '#F9FAFB',
            backgroundMedium: '#F3F4F6',
            surface: '#FFFFFF',
            surfaceHover: '#F9FAFB',
            textPrimary: '#1F2937',
            textSecondary: '#4B5563',
            textTertiary: '#9CA3AF',
            textInverse: '#FFFFFF',
            border: '#E5E7EB',
            borderMedium: '#D1D5DB',
            borderFocus: '#1d4ed8',
            sidebar: '#1e3a8a',
            sidebarText: '#FFFFFF',
            sidebarHover: 'rgba(255,255,255,0.1)',
            header: '#FFFFFF',
            headerBorder: '#E5E7EB',
        },
        dark: {
            primary: {
                50: '#172554',
                100: '#1e3a8a',
                200: '#1e40af',
                300: '#1d4ed8',
                400: '#2563eb',
                500: '#3b82f6',
                600: '#60a5fa',
                700: '#93c5fd',
                800: '#bfdbfe',
                900: '#dbeafe',
            },
            secondary: {
                50: '#4c1d95',
                100: '#5b21b6',
                200: '#6d28d9',
                300: '#7c3aed',
                400: '#8a38f5',
                500: '#a855f7',
                600: '#c084fc',
                700: '#d8b4fe',
                800: '#e9d5ff',
                900: '#f3e8ff',
            },
            success: '#34d399',
            warning: '#fbbf24',
            error: '#f87171',
            info: '#60a5fa',
            background: '#111827',
            backgroundSoft: '#1F2937',
            backgroundMedium: '#374151',
            surface: '#1F2937',
            surfaceHover: '#374151',
            textPrimary: '#F9FAFB',
            textSecondary: '#D1D5DB',
            textTertiary: '#9CA3AF',
            textInverse: '#111827',
            border: '#374151',
            borderMedium: '#4B5563',
            borderFocus: '#3b82f6',
            sidebar: '#0f172a',
            sidebarText: '#F9FAFB',
            sidebarHover: 'rgba(255,255,255,0.1)',
            header: '#1F2937',
            headerBorder: '#374151',
        }
    },
    shadows: {
        light: {
            sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            xl: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
        },
        dark: {
            sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
            md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
            lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
            xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }
    }
};

// Backward compatibility aliases
export const SAUDI_THEME = GOVERNMENT_THEME;

// ========== Theme Context ==========
const ThemeContext = createContext(null);

// ========== Theme Provider ==========
export function ThemeProvider({ children }) {
    const [currentTheme, setCurrentTheme] = useState(THEMES.GOVERNMENT);
    const [mode, setModeState] = useState(MODES.LIGHT);
    const [resolvedMode, setResolvedMode] = useState(MODES.LIGHT);
    const [isLoaded, setIsLoaded] = useState(false);

    // تحميل التفضيلات من localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const savedTheme = localStorage.getItem('platform-theme');
        const savedMode = localStorage.getItem('platform-mode');

        if (savedTheme === THEMES.DEFAULT) {
            localStorage.setItem('platform-theme', THEMES.GOVERNMENT);
            setCurrentTheme(THEMES.GOVERNMENT);
        } else if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
            setCurrentTheme(savedTheme);
        }
        if (savedMode && Object.values(MODES).includes(savedMode)) {
            setModeState(savedMode);
        }

        setIsLoaded(true);
    }, []);

    // التعامل مع تفضيل النظام
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e) => {
            if (mode === MODES.SYSTEM) {
                setResolvedMode(e.matches ? MODES.DARK : MODES.LIGHT);
            }
        };

        if (mode === MODES.SYSTEM) {
            setResolvedMode(mediaQuery.matches ? MODES.DARK : MODES.LIGHT);
        } else {
            setResolvedMode(mode);
        }

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [mode]);

    // تطبيق متغيرات CSS على المستند
    useEffect(() => {
        if (typeof window === 'undefined' || !isLoaded) return;

        const root = document.documentElement;
        const themeConfig = currentTheme === THEMES.GOVERNMENT ? GOVERNMENT_THEME : DEFAULT_THEME;
        const modeColors = themeConfig.colors[resolvedMode];
        const modeShadows = themeConfig.shadows[resolvedMode];

        // إزالة كل كلاسات الثيم
        root.classList.remove('theme-default', 'theme-government', 'theme-saudi', 'light', 'dark');
        document.body.classList.remove('theme-default', 'theme-government', 'theme-saudi', 'light', 'dark');

        // إضافة كلاسات الثيم الحالية
        root.classList.add(`theme-${currentTheme}`, resolvedMode);
        document.body.classList.add(`theme-${currentTheme}`, resolvedMode);

        // إضافة كلاس saudi للتوافق العكسي
        if (currentTheme === THEMES.GOVERNMENT) {
            root.classList.add('theme-saudi');
        }

        // تعيين data attributes
        root.setAttribute('data-theme', currentTheme);
        root.setAttribute('data-mode', resolvedMode);

        // تطبيق الألوان الأساسية
        Object.entries(modeColors.primary).forEach(([shade, color]) => {
            root.style.setProperty(`--color-primary-${shade}`, color);
        });

        // تطبيق الألوان الثانوية
        Object.entries(modeColors.secondary).forEach(([shade, color]) => {
            root.style.setProperty(`--color-secondary-${shade}`, color);
        });

        // تطبيق الألوان الدلالية
        root.style.setProperty('--color-success', modeColors.success);
        root.style.setProperty('--color-warning', modeColors.warning);
        root.style.setProperty('--color-error', modeColors.error);
        root.style.setProperty('--color-info', modeColors.info);

        // تطبيق ألوان الخلفية
        root.style.setProperty('--color-background', modeColors.background);
        root.style.setProperty('--color-background-soft', modeColors.backgroundSoft);
        root.style.setProperty('--color-background-medium', modeColors.backgroundMedium);
        root.style.setProperty('--color-surface', modeColors.surface);
        root.style.setProperty('--color-surface-hover', modeColors.surfaceHover);

        // تطبيق ألوان النص
        root.style.setProperty('--color-text-primary', modeColors.textPrimary);
        root.style.setProperty('--color-text-secondary', modeColors.textSecondary);
        root.style.setProperty('--color-text-tertiary', modeColors.textTertiary);
        root.style.setProperty('--color-text-inverse', modeColors.textInverse);

        // تطبيق ألوان الحدود
        root.style.setProperty('--color-border', modeColors.border);
        root.style.setProperty('--color-border-medium', modeColors.borderMedium);
        root.style.setProperty('--color-border-focus', modeColors.borderFocus);

        // تطبيق ألوان المكونات
        root.style.setProperty('--color-sidebar', modeColors.sidebar);
        root.style.setProperty('--color-sidebar-text', modeColors.sidebarText);
        root.style.setProperty('--color-sidebar-hover', modeColors.sidebarHover);
        root.style.setProperty('--color-header', modeColors.header);
        root.style.setProperty('--color-header-border', modeColors.headerBorder);

        // تطبيق الظلال
        root.style.setProperty('--shadow-sm', modeShadows.sm);
        root.style.setProperty('--shadow-md', modeShadows.md);
        root.style.setProperty('--shadow-lg', modeShadows.lg);
        root.style.setProperty('--shadow-xl', modeShadows.xl);

        // تحديث meta theme-color
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = modeColors.primary[500];

        // حفظ في localStorage
        localStorage.setItem('platform-theme', currentTheme);
        localStorage.setItem('platform-mode', mode);

    }, [currentTheme, resolvedMode, isLoaded, mode]);

    // دوال التبديل
    const toggleTheme = useCallback(() => {
        setCurrentTheme(prev =>
            prev === THEMES.DEFAULT ? THEMES.GOVERNMENT : THEMES.DEFAULT
        );
    }, []);

    const setTheme = useCallback((theme) => {
        if (Object.values(THEMES).includes(theme)) {
            setCurrentTheme(theme);
        }
    }, []);

    const setMode = useCallback((newMode) => {
        if (Object.values(MODES).includes(newMode)) {
            setModeState(newMode);
        }
    }, []);

    const toggleDarkMode = useCallback(() => {
        setModeState(prev => prev === MODES.DARK ? MODES.LIGHT : MODES.DARK);
    }, []);

    const cycleMode = useCallback(() => {
        const modes = [MODES.LIGHT, MODES.DARK, MODES.SYSTEM];
        setModeState(prev => {
            const currentIndex = modes.indexOf(prev);
            return modes[(currentIndex + 1) % modes.length];
        });
    }, []);

    // الحصول على تكوين الثيم الحالي
    const themeConfig = useMemo(() => {
        return currentTheme === THEMES.GOVERNMENT ? GOVERNMENT_THEME : DEFAULT_THEME;
    }, [currentTheme]);

    // الحصول على ألوان الوضع الحالي
    const currentColors = useMemo(() => {
        return themeConfig.colors[resolvedMode];
    }, [themeConfig, resolvedMode]);

    // قيمة السياق
    const value = useMemo(() => ({
        // القيم الحالية
        currentTheme,
        theme: currentTheme, // alias
        mode,
        resolvedMode,
        darkMode: resolvedMode === MODES.DARK,
        isLoaded,

        // تكوين الثيم
        themeConfig,
        currentColors,

        // الفحوصات
        isGovernmentTheme: currentTheme === THEMES.GOVERNMENT,
        isSaudiTheme: currentTheme === THEMES.GOVERNMENT, // alias للتوافق العكسي
        isDefaultTheme: currentTheme === THEMES.DEFAULT,
        isDarkMode: resolvedMode === MODES.DARK,
        isLightMode: resolvedMode === MODES.LIGHT,
        isSystemMode: mode === MODES.SYSTEM,

        // الدوال
        setTheme,
        setMode,
        toggleTheme,
        toggleDarkMode,
        cycleMode,

        // الثوابت
        THEMES,
        MODES,
        GOVERNMENT_THEME,
        DEFAULT_THEME,
        SAUDI_THEME, // alias للتوافق العكسي
    }), [currentTheme, mode, resolvedMode, isLoaded, themeConfig, currentColors, setTheme, setMode, toggleTheme, toggleDarkMode, cycleMode]);

    // منع وميض المحتوى غير المنسق
    if (!isLoaded) {
        return null;
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// ========== Custom Hooks ==========
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Alias للتوافق العكسي
export function useThemeContext() {
    return useTheme();
}

export default ThemeContext;
