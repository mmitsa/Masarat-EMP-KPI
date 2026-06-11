/**
 * Color Palette Component - لوحة اختيار الألوان
 * يتيح للمستخدم تخصيص ألوان الـ Hover وشريط الأخبار
 * مع زر تطبيق للتأكيد
 *
 * @version 2.0.0
 * @date 2026-02-03
 */

import React, { useState } from 'react';
import { useColors, COLOR_PRESETS, NEWS_BAR_PRESETS } from '../../context/ColorContext';
import { useTheme } from '../../context/ThemeContext';

// ========== Color Swatch ==========
const ColorSwatch = ({ color, isSelected, onClick, size = 'md' }) => {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
    };

    return (
        <button
            onClick={onClick}
            className={`
                ${sizes[size]} rounded-xl transition-all duration-200
                flex items-center justify-center
                ${isSelected ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}
            `}
            style={{ background: color.gradient || color.primary || color.background }}
            title={color.name}
        >
            {isSelected && (
                <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            )}
        </button>
    );
};

// ========== Custom Color Picker ==========
const CustomColorPicker = ({ value, onChange, label, isDarkMode = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempColor, setTempColor] = useState(value || '#165C2D');

    const handleApply = () => {
        onChange({
            id: 'custom',
            name: 'مخصص',
            nameEn: 'Custom',
            primary: tempColor,
            hover: tempColor,
            background: tempColor,
            text: '#FFFFFF',
            light: `${tempColor}15`,
            gradient: tempColor,
            labelBg: tempColor,
        });
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                    text-sm font-medium
                    ${isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                        : 'bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 text-gray-700 dark:text-gray-200'}
                `}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                لون مخصص
            </button>

            {isOpen && (
                <div className={`
                    absolute top-full right-0 mt-2 p-4 rounded-xl shadow-xl border z-50 min-w-[200px]
                    ${isDarkMode
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}
                `}>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700 dark:text-gray-200'}`}>
                        {label}
                    </label>
                    <div className="flex items-center gap-3 mb-3">
                        <input
                            type="color"
                            value={tempColor}
                            onChange={(e) => setTempColor(e.target.value)}
                            className="w-12 h-12 rounded-lg cursor-pointer border-0"
                        />
                        <input
                            type="text"
                            value={tempColor}
                            onChange={(e) => setTempColor(e.target.value)}
                            className={`
                                flex-1 px-3 py-2 border rounded-lg text-sm font-mono
                                ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-gray-100'
                                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'}
                            `}
                            placeholder="#165C2D"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleApply}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                        >
                            اختيار
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className={`
                                px-3 py-2 rounded-lg text-sm font-medium
                                ${isDarkMode
                                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-700 dark:text-gray-200 hover:bg-gray-300'}
                            `}
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ========== Color Palette Dropdown ==========
export function ColorPaletteDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const { isDarkMode } = useTheme();
    const {
        hoverColors,
        newsBarColors,
        colorPresets,
        newsBarPresets,
        currentHoverPreset,
        currentNewsBarPreset,
        hasUnsavedChanges,
        previewHover,
        previewCustomHover,
        previewNewsBar,
        previewCustomNewsBar,
        applyColors,
        cancelPreview,
        resetColors,
    } = useColors();

    const handleApply = () => {
        applyColors();
        setIsOpen(false);
    };

    const handleCancel = () => {
        cancelPreview();
        setIsOpen(false);
    };

    const handleClose = () => {
        if (hasUnsavedChanges) {
            cancelPreview();
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 p-2.5 rounded-xl transition-all duration-200
                    ${isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        : 'bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 text-gray-700 dark:text-gray-200'}
                    ${hasUnsavedChanges ? 'ring-2 ring-orange-400' : ''}
                `}
                title="لوحة الألوان"
            >
                <div className="relative">
                    <div
                        className="w-5 h-5 rounded-full"
                        style={{ background: hoverColors.gradient }}
                    />
                    {hasUnsavedChanges && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    )}
                </div>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={handleClose}
                    />

                    {/* Dropdown */}
                    <div
                        className={`
                            absolute top-full left-0 mt-2 p-4 rounded-2xl z-50
                            w-96 shadow-2xl border
                            ${isDarkMode
                                ? 'bg-gray-900 border-gray-700'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}
                        `}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                🎨 لوحة الألوان
                            </h3>
                            {hasUnsavedChanges && (
                                <span className="text-xs text-orange-500 font-medium">
                                    تغييرات غير محفوظة
                                </span>
                            )}
                        </div>

                        {/* Hover Colors Section */}
                        <div className="mb-5">
                            <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                ألوان الـ Hover والشريط الجانبي
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {Object.values(colorPresets).map((preset) => (
                                    <ColorSwatch
                                        key={preset.id}
                                        color={preset}
                                        isSelected={currentHoverPreset === preset.id}
                                        onClick={() => previewHover(preset.id)}
                                    />
                                ))}
                            </div>
                            <CustomColorPicker
                                label="لون الـ Hover"
                                value={hoverColors.primary}
                                onChange={previewCustomHover}
                                isDarkMode={isDarkMode}
                            />
                        </div>

                        {/* Divider */}
                        <div className={`h-px my-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

                        {/* News Bar Colors Section */}
                        <div className="mb-5">
                            <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                لون شريط الأخبار
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {Object.values(newsBarPresets).map((preset) => (
                                    <ColorSwatch
                                        key={preset.id}
                                        color={preset}
                                        isSelected={currentNewsBarPreset === preset.id}
                                        onClick={() => previewNewsBar(preset.id)}
                                    />
                                ))}
                            </div>
                            <CustomColorPicker
                                label="لون شريط الأخبار"
                                value={newsBarColors.background}
                                onChange={previewCustomNewsBar}
                                isDarkMode={isDarkMode}
                            />
                        </div>

                        {/* Live Preview */}
                        <div className={`mb-4 p-3 rounded-xl border border-dashed ${isDarkMode ? 'border-gray-600' : 'border-gray-300 dark:border-gray-600'}`}>
                            <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                معاينة مباشرة:
                            </p>
                            <div
                                className="h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium mb-2"
                                style={{ background: newsBarColors.gradient }}
                            >
                                شريط الأخبار
                            </div>
                            <div className="flex gap-2">
                                <div
                                    className="flex-1 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                                    style={{ background: hoverColors.gradient }}
                                >
                                    Hover
                                </div>
                                <div
                                    className="flex-1 h-8 rounded-lg flex items-center justify-center text-sm font-medium"
                                    style={{
                                        backgroundColor: hoverColors.light,
                                        color: hoverColors.primary
                                    }}
                                >
                                    Light
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleApply}
                                disabled={!hasUnsavedChanges}
                                className={`
                                    flex-1 py-3 rounded-xl font-bold text-sm transition-all
                                    ${hasUnsavedChanges
                                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                                `}
                            >
                                ✓ تطبيق على المنصة
                            </button>
                            {hasUnsavedChanges && (
                                <button
                                    onClick={handleCancel}
                                    className={`
                                        px-4 py-3 rounded-xl font-medium text-sm
                                        ${isDarkMode
                                            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                            : 'bg-gray-200 text-gray-700 dark:text-gray-200 hover:bg-gray-300'}
                                    `}
                                >
                                    إلغاء
                                </button>
                            )}
                        </div>

                        {/* Reset Button */}
                        <button
                            onClick={resetColors}
                            className={`w-full mt-2 py-2 text-xs transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                        >
                            إعادة تعيين للألوان الافتراضية
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// ========== Color Palette Card (for Settings Page) ==========
export function ColorPaletteCard() {
    const { isDarkMode } = useTheme();
    const {
        hoverColors,
        newsBarColors,
        colorPresets,
        newsBarPresets,
        currentHoverPreset,
        currentNewsBarPreset,
        hasUnsavedChanges,
        previewHover,
        previewCustomHover,
        previewNewsBar,
        previewCustomNewsBar,
        applyColors,
        cancelPreview,
        resetColors,
    } = useColors();

    return (
        <div className={`
            p-6 rounded-2xl border
            ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}
        `}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            لوحة الألوان المخصصة
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            خصص ألوان الواجهة حسب رغبتك
                        </p>
                    </div>
                </div>
                {hasUnsavedChanges && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'}`}>
                        تغييرات غير محفوظة
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hover Colors */}
                <div>
                    <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                        ألوان الـ Hover والشريط الجانبي
                    </label>
                    <div className="flex flex-wrap gap-3 mb-4">
                        {Object.values(colorPresets).map((preset) => (
                            <ColorSwatch
                                key={preset.id}
                                color={preset}
                                isSelected={currentHoverPreset === preset.id}
                                onClick={() => previewHover(preset.id)}
                                size="lg"
                            />
                        ))}
                    </div>
                    <CustomColorPicker
                        label="لون مخصص للـ Hover"
                        value={hoverColors.primary}
                        onChange={previewCustomHover}
                        isDarkMode={isDarkMode}
                    />
                </div>

                {/* News Bar Colors */}
                <div>
                    <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                        لون شريط الأخبار
                    </label>
                    <div className="flex flex-wrap gap-3 mb-4">
                        {Object.values(newsBarPresets).map((preset) => (
                            <ColorSwatch
                                key={preset.id}
                                color={preset}
                                isSelected={currentNewsBarPreset === preset.id}
                                onClick={() => previewNewsBar(preset.id)}
                                size="lg"
                            />
                        ))}
                    </div>
                    <CustomColorPicker
                        label="لون مخصص لشريط الأخبار"
                        value={newsBarColors.background}
                        onChange={previewCustomNewsBar}
                        isDarkMode={isDarkMode}
                    />
                </div>
            </div>

            {/* Live Preview */}
            <div className="mt-6">
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                    معاينة مباشرة
                </label>
                <div className="space-y-3">
                    <div
                        className="h-10 rounded-xl flex items-center justify-center text-white font-medium shadow-lg"
                        style={{ background: newsBarColors.gradient }}
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                            آخر الأخبار: تم تحديث سياسة الإجازات الجديدة
                        </span>
                    </div>

                    <div className="flex gap-3">
                        <button
                            className="flex-1 py-3 rounded-xl text-white font-medium shadow-lg transition-all hover:scale-[1.02]"
                            style={{ background: hoverColors.gradient }}
                        >
                            زر رئيسي
                        </button>
                        <button
                            className="flex-1 py-3 rounded-xl font-medium transition-all hover:scale-[1.02]"
                            style={{
                                backgroundColor: hoverColors.light,
                                color: hoverColors.primary
                            }}
                        >
                            زر ثانوي
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
                <button
                    onClick={applyColors}
                    disabled={!hasUnsavedChanges}
                    className={`
                        flex-1 py-3 rounded-xl font-bold transition-all
                        ${hasUnsavedChanges
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                            : isDarkMode
                                ? 'bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                    `}
                >
                    ✓ تطبيق الألوان على المنصة
                </button>
                {hasUnsavedChanges && (
                    <button
                        onClick={cancelPreview}
                        className={`
                            px-6 py-3 rounded-xl font-medium
                            ${isDarkMode
                                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                : 'bg-gray-200 text-gray-700 dark:text-gray-200 hover:bg-gray-300'}
                        `}
                    >
                        إلغاء
                    </button>
                )}
                <button
                    onClick={resetColors}
                    className={`
                        px-6 py-3 rounded-xl font-medium transition-colors
                        ${isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 text-gray-700 dark:text-gray-200'}
                    `}
                >
                    إعادة تعيين
                </button>
            </div>
        </div>
    );
}

// ========== Simple Color Button ==========
export function ColorButton({ onClick }) {
    const { hoverColors, hasUnsavedChanges } = useColors();
    const { isDarkMode } = useTheme();

    return (
        <button
            onClick={onClick}
            className={`
                p-2.5 rounded-xl transition-all duration-200 group relative
                ${isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200'}
            `}
            title="لوحة الألوان"
        >
            <div className="relative">
                <div
                    className="w-5 h-5 rounded-full group-hover:scale-110 transition-transform"
                    style={{ background: hoverColors.gradient }}
                />
                {hasUnsavedChanges && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                )}
            </div>
        </button>
    );
}

export default ColorPaletteDropdown;
