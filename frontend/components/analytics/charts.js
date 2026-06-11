import React from 'react';
import { CartesianGrid, Tooltip } from 'recharts';

// ألوان الرسوم البيانية المتوافقة مع design tokens
export const CHART_COLORS = {
    primary: '#1d4ed8',
    secondary: '#8a38f5',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    teal: '#14b8a6',
    pink: '#ec4899',
    indigo: '#6366f1',
    orange: '#f97316',
    cyan: '#06b6d4',
    lime: '#84cc16',
};

// مصفوفة ألوان متسلسلة للرسوم البيانية
export const CHART_SERIES_COLORS = [
    '#1d4ed8', '#10b981', '#f59e0b', '#8a38f5',
    '#ef4444', '#14b8a6', '#ec4899', '#6366f1',
    '#f97316', '#06b6d4', '#84cc16', '#3b82f6',
];

// تنسيق الأرقام بالعربية
export const formatArabicNumber = (value) => {
    if (value == null) return '';
    return new Intl.NumberFormat('ar-SA').format(value);
};

// تنسيق العملة بالعربية
export const formatArabicCurrency = (value) => {
    if (value == null) return '';
    if (Math.abs(value) >= 1000000) {
        return new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 1 }).format(value / 1000000) + ' م.ر';
    }
    if (Math.abs(value) >= 1000) {
        return new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(value / 1000) + ' ألف';
    }
    return new Intl.NumberFormat('ar-SA').format(value) + ' ريال';
};

// تنسيق النسبة المئوية
export const formatPercent = (value) => {
    if (value == null) return '';
    return `${Number(value).toFixed(1)}%`;
};

// Tooltip مشترك بدعم RTL و dark mode
export function RTLTooltip({ darkMode = false, formatter, ...props }) {
    return (
        <Tooltip
            formatter={formatter}
            contentStyle={{
                backgroundColor: darkMode ? '#1F2937' : '#fff',
                border: darkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                borderRadius: '8px',
                color: darkMode ? '#F9FAFB' : '#111827',
                direction: 'rtl',
                fontFamily: 'IBM Plex Sans Arabic, sans-serif',
                fontSize: '13px',
                padding: '8px 12px',
            }}
            labelStyle={{
                color: darkMode ? '#9CA3AF' : '#6B7280',
                fontWeight: 'bold',
                marginBottom: '4px',
            }}
            {...props}
        />
    );
}

// شبكة الرسم البياني المنسقة
export function StyledCartesianGrid({ darkMode = false, ...props }) {
    return (
        <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? '#374151' : '#E5E7EB'}
            {...props}
        />
    );
}

// خصائص المحاور المشتركة
export const getAxisProps = (darkMode = false) => ({
    stroke: darkMode ? '#6B7280' : '#9CA3AF',
    fontSize: 12,
    fontFamily: 'IBM Plex Sans Arabic, sans-serif',
    tickLine: false,
    axisLine: false,
});

// تعريفات التدرج اللوني SVG
export function GradientDef({ id, color, opacity = [0.3, 0] }) {
    return (
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={opacity[0]} />
            <stop offset="95%" stopColor={color} stopOpacity={opacity[1]} />
        </linearGradient>
    );
}

// Sparkline مصغر للبطاقات
export function MiniSparkline({ data, dataKey, color = CHART_COLORS.primary, height = 40 }) {
    // يستخدم SVG بسيط بدون recharts لتحسين الأداء
    if (!data || data.length < 2) return null;

    const values = data.map(d => d[dataKey]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const width = 120;

    const points = values.map((v, i) => {
        const x = (i / (values.length - 1)) * width;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="flex-shrink-0">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
