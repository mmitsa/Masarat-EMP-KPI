/**
 * Color Context - سياق الألوان المخصصة
 * يتيح للمستخدم تخصيص ألوان الـ Hover وشريط الأخبار
 * مع دعم وضع المعاينة وزر التطبيق
 *
 * @version 2.0.0
 * @date 2026-02-03
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ========== Color Presets ==========
export const COLOR_PRESETS = {
    saudiGreen: {
        id: 'saudiGreen',
        name: 'الأخضر السعودي',
        nameEn: 'Saudi Green',
        primary: '#165C2D',
        hover: '#1E7A3D',
        light: '#E8F5ED',
        gradient: 'linear-gradient(135deg, #165C2D, #1E7A3D)',
    },
    royalBlue: {
        id: 'royalBlue',
        name: 'الأزرق الملكي',
        nameEn: 'Royal Blue',
        primary: '#1d4ed8',
        hover: '#2563eb',
        light: '#EFF6FF',
        gradient: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
    },
    gold: {
        id: 'gold',
        name: 'الذهبي',
        nameEn: 'Gold',
        primary: '#B8860B',
        hover: '#D4AF37',
        light: '#FEF9E7',
        gradient: 'linear-gradient(135deg, #B8860B, #D4AF37)',
    },
    purple: {
        id: 'purple',
        name: 'البنفسجي',
        nameEn: 'Purple',
        primary: '#7C3AED',
        hover: '#8B5CF6',
        light: '#F5F3FF',
        gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
    },
    teal: {
        id: 'teal',
        name: 'التركواز',
        nameEn: 'Teal',
        primary: '#0D9488',
        hover: '#14B8A6',
        light: '#F0FDFA',
        gradient: 'linear-gradient(135deg, #0D9488, #14B8A6)',
    },
    crimson: {
        id: 'crimson',
        name: 'القرمزي',
        nameEn: 'Crimson',
        primary: '#BE123C',
        hover: '#E11D48',
        light: '#FFF1F2',
        gradient: 'linear-gradient(135deg, #BE123C, #E11D48)',
    },
    orange: {
        id: 'orange',
        name: 'البرتقالي',
        nameEn: 'Orange',
        primary: '#EA580C',
        hover: '#F97316',
        light: '#FFF7ED',
        gradient: 'linear-gradient(135deg, #EA580C, #F97316)',
    },
    slate: {
        id: 'slate',
        name: 'الرمادي الداكن',
        nameEn: 'Slate',
        primary: '#475569',
        hover: '#64748B',
        light: '#F8FAFC',
        gradient: 'linear-gradient(135deg, #475569, #64748B)',
    },
};

// ========== News Bar Presets ==========
export const NEWS_BAR_PRESETS = {
    saudiGreen: {
        id: 'saudiGreen',
        name: 'الأخضر السعودي',
        background: '#165C2D',
        text: '#FFFFFF',
        gradient: 'linear-gradient(90deg, #165C2D, #1E7A3D)',
        labelBg: '#0D4A22',
    },
    royalBlue: {
        id: 'royalBlue',
        name: 'الأزرق الملكي',
        background: '#1d4ed8',
        text: '#FFFFFF',
        gradient: 'linear-gradient(90deg, #1d4ed8, #2563eb)',
        labelBg: '#1e40af',
    },
    gold: {
        id: 'gold',
        name: 'الذهبي',
        background: '#B8860B',
        text: '#FFFFFF',
        gradient: 'linear-gradient(90deg, #B8860B, #D4AF37)',
        labelBg: '#92400E',
    },
    purple: {
        id: 'purple',
        name: 'البنفسجي',
        background: '#7C3AED',
        text: '#FFFFFF',
        gradient: 'linear-gradient(90deg, #7C3AED, #8B5CF6)',
        labelBg: '#6D28D9',
    },
    teal: {
        id: 'teal',
        name: 'التركواز',
        background: '#0D9488',
        text: '#FFFFFF',
        gradient: 'linear-gradient(90deg, #0D9488, #14B8A6)',
        labelBg: '#0F766E',
    },
    dark: {
        id: 'dark',
        name: 'الداكن',
        background: '#1F2937',
        text: '#FFFFFF',
        gradient: 'linear-gradient(90deg, #1F2937, #374151)',
        labelBg: '#111827',
    },
};

// ========== Default Values ==========
const DEFAULT_HOVER_PRESET = 'saudiGreen';
const DEFAULT_NEWSBAR_PRESET = 'saudiGreen';

// ========== Context ==========
const ColorContext = createContext(null);

// ========== Provider ==========
export function ColorProvider({ children }) {
    // الألوان المطبقة (المحفوظة)
    const [appliedHoverPreset, setAppliedHoverPreset] = useState(DEFAULT_HOVER_PRESET);
    const [appliedNewsBarPreset, setAppliedNewsBarPreset] = useState(DEFAULT_NEWSBAR_PRESET);
    const [appliedCustomColors, setAppliedCustomColors] = useState({ hover: null, newsBar: null });

    // الألوان المعاينة (قبل التطبيق)
    const [previewHoverPreset, setPreviewHoverPreset] = useState(null);
    const [previewNewsBarPreset, setPreviewNewsBarPreset] = useState(null);
    const [previewCustomColors, setPreviewCustomColors] = useState({ hover: null, newsBar: null });

    // حالة التعديل
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // تحميل الألوان المحفوظة من localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedHoverPreset = localStorage.getItem('masarat_hover_preset');
            const savedNewsBarPreset = localStorage.getItem('masarat_newsbar_preset');
            const savedCustomColors = localStorage.getItem('masarat_custom_colors');

            if (savedHoverPreset) setAppliedHoverPreset(savedHoverPreset);
            if (savedNewsBarPreset) setAppliedNewsBarPreset(savedNewsBarPreset);
            if (savedCustomColors) setAppliedCustomColors(JSON.parse(savedCustomColors));
        }
    }, []);

    // الحصول على ألوان الـ Hover الفعلية (المطبقة أو المعاينة)
    const getHoverColors = useCallback(() => {
        // إذا كان في وضع المعاينة
        if (previewCustomColors.hover) {
            return previewCustomColors.hover;
        }
        if (previewHoverPreset) {
            return COLOR_PRESETS[previewHoverPreset] || COLOR_PRESETS[DEFAULT_HOVER_PRESET];
        }

        // الألوان المطبقة
        if (appliedCustomColors.hover) {
            return appliedCustomColors.hover;
        }
        return COLOR_PRESETS[appliedHoverPreset] || COLOR_PRESETS[DEFAULT_HOVER_PRESET];
    }, [previewCustomColors.hover, previewHoverPreset, appliedCustomColors.hover, appliedHoverPreset]);

    // الحصول على ألوان شريط الأخبار الفعلية
    const getNewsBarColors = useCallback(() => {
        if (previewCustomColors.newsBar) {
            return previewCustomColors.newsBar;
        }
        if (previewNewsBarPreset) {
            return NEWS_BAR_PRESETS[previewNewsBarPreset] || NEWS_BAR_PRESETS[DEFAULT_NEWSBAR_PRESET];
        }

        if (appliedCustomColors.newsBar) {
            return appliedCustomColors.newsBar;
        }
        return NEWS_BAR_PRESETS[appliedNewsBarPreset] || NEWS_BAR_PRESETS[DEFAULT_NEWSBAR_PRESET];
    }, [previewCustomColors.newsBar, previewNewsBarPreset, appliedCustomColors.newsBar, appliedNewsBarPreset]);

    // معاينة لون hover
    const previewHover = useCallback((presetId) => {
        setPreviewHoverPreset(presetId);
        setPreviewCustomColors(prev => ({ ...prev, hover: null }));
        setHasUnsavedChanges(true);
    }, []);

    // معاينة لون مخصص للـ hover
    const previewCustomHover = useCallback((colorObj) => {
        setPreviewCustomColors(prev => ({ ...prev, hover: colorObj }));
        setPreviewHoverPreset(null);
        setHasUnsavedChanges(true);
    }, []);

    // معاينة لون شريط الأخبار
    const previewNewsBar = useCallback((presetId) => {
        setPreviewNewsBarPreset(presetId);
        setPreviewCustomColors(prev => ({ ...prev, newsBar: null }));
        setHasUnsavedChanges(true);
    }, []);

    // معاينة لون مخصص لشريط الأخبار
    const previewCustomNewsBar = useCallback((colorObj) => {
        setPreviewCustomColors(prev => ({ ...prev, newsBar: colorObj }));
        setPreviewNewsBarPreset(null);
        setHasUnsavedChanges(true);
    }, []);

    // تطبيق الألوان وحفظها
    const applyColors = useCallback(() => {
        // تطبيق ألوان الـ hover
        if (previewCustomColors.hover) {
            setAppliedCustomColors(prev => ({ ...prev, hover: previewCustomColors.hover }));
            setAppliedHoverPreset(null);
        } else if (previewHoverPreset) {
            setAppliedHoverPreset(previewHoverPreset);
            setAppliedCustomColors(prev => ({ ...prev, hover: null }));
        }

        // تطبيق ألوان شريط الأخبار
        if (previewCustomColors.newsBar) {
            setAppliedCustomColors(prev => ({ ...prev, newsBar: previewCustomColors.newsBar }));
            setAppliedNewsBarPreset(null);
        } else if (previewNewsBarPreset) {
            setAppliedNewsBarPreset(previewNewsBarPreset);
            setAppliedCustomColors(prev => ({ ...prev, newsBar: null }));
        }

        // حفظ في localStorage
        if (typeof window !== 'undefined') {
            const newHoverPreset = previewHoverPreset || appliedHoverPreset;
            const newNewsBarPreset = previewNewsBarPreset || appliedNewsBarPreset;
            const newCustomColors = {
                hover: previewCustomColors.hover || appliedCustomColors.hover,
                newsBar: previewCustomColors.newsBar || appliedCustomColors.newsBar,
            };

            if (newHoverPreset) localStorage.setItem('masarat_hover_preset', newHoverPreset);
            if (newNewsBarPreset) localStorage.setItem('masarat_newsbar_preset', newNewsBarPreset);
            localStorage.setItem('masarat_custom_colors', JSON.stringify(newCustomColors));
        }

        // مسح المعاينة
        setPreviewHoverPreset(null);
        setPreviewNewsBarPreset(null);
        setPreviewCustomColors({ hover: null, newsBar: null });
        setHasUnsavedChanges(false);

        return true;
    }, [previewHoverPreset, previewNewsBarPreset, previewCustomColors, appliedHoverPreset, appliedNewsBarPreset, appliedCustomColors]);

    // إلغاء المعاينة
    const cancelPreview = useCallback(() => {
        setPreviewHoverPreset(null);
        setPreviewNewsBarPreset(null);
        setPreviewCustomColors({ hover: null, newsBar: null });
        setHasUnsavedChanges(false);
    }, []);

    // إعادة الألوان للافتراضي
    const resetColors = useCallback(() => {
        setAppliedHoverPreset(DEFAULT_HOVER_PRESET);
        setAppliedNewsBarPreset(DEFAULT_NEWSBAR_PRESET);
        setAppliedCustomColors({ hover: null, newsBar: null });
        setPreviewHoverPreset(null);
        setPreviewNewsBarPreset(null);
        setPreviewCustomColors({ hover: null, newsBar: null });
        setHasUnsavedChanges(false);

        if (typeof window !== 'undefined') {
            localStorage.setItem('masarat_hover_preset', DEFAULT_HOVER_PRESET);
            localStorage.setItem('masarat_newsbar_preset', DEFAULT_NEWSBAR_PRESET);
            localStorage.setItem('masarat_custom_colors', JSON.stringify({ hover: null, newsBar: null }));
        }
    }, []);

    // الحصول على الـ preset الحالي (للعرض)
    const getCurrentHoverPreset = useCallback(() => {
        if (previewHoverPreset) return previewHoverPreset;
        if (previewCustomColors.hover) return 'custom';
        if (appliedCustomColors.hover) return 'custom';
        return appliedHoverPreset;
    }, [previewHoverPreset, previewCustomColors.hover, appliedCustomColors.hover, appliedHoverPreset]);

    const getCurrentNewsBarPreset = useCallback(() => {
        if (previewNewsBarPreset) return previewNewsBarPreset;
        if (previewCustomColors.newsBar) return 'custom';
        if (appliedCustomColors.newsBar) return 'custom';
        return appliedNewsBarPreset;
    }, [previewNewsBarPreset, previewCustomColors.newsBar, appliedCustomColors.newsBar, appliedNewsBarPreset]);

    const value = {
        // الألوان الفعلية (للاستخدام في المكونات)
        hoverColors: getHoverColors(),
        newsBarColors: getNewsBarColors(),

        // الـ Presets
        colorPresets: COLOR_PRESETS,
        newsBarPresets: NEWS_BAR_PRESETS,

        // الـ IDs الحالية
        currentHoverPreset: getCurrentHoverPreset(),
        currentNewsBarPreset: getCurrentNewsBarPreset(),

        // حالة التعديل
        hasUnsavedChanges,

        // دوال المعاينة
        previewHover,
        previewCustomHover,
        previewNewsBar,
        previewCustomNewsBar,

        // دوال التطبيق
        applyColors,
        cancelPreview,
        resetColors,
    };

    return (
        <ColorContext.Provider value={value}>
            {children}
        </ColorContext.Provider>
    );
}

// ========== Hook ==========
export function useColors() {
    const context = useContext(ColorContext);
    if (!context) {
        // إرجاع قيم افتراضية إذا لم يكن السياق موجوداً
        return {
            hoverColors: COLOR_PRESETS[DEFAULT_HOVER_PRESET],
            newsBarColors: NEWS_BAR_PRESETS[DEFAULT_NEWSBAR_PRESET],
            colorPresets: COLOR_PRESETS,
            newsBarPresets: NEWS_BAR_PRESETS,
            currentHoverPreset: DEFAULT_HOVER_PRESET,
            currentNewsBarPreset: DEFAULT_NEWSBAR_PRESET,
            hasUnsavedChanges: false,
            previewHover: () => {},
            previewCustomHover: () => {},
            previewNewsBar: () => {},
            previewCustomNewsBar: () => {},
            applyColors: () => {},
            cancelPreview: () => {},
            resetColors: () => {},
        };
    }
    return context;
}

export default ColorContext;
