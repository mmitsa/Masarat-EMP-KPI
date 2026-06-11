/**
 * News Ticker Component - الشريط الإخباري السفلي
 * شريط ثابت أسفل الشاشة يعرض الأخبار والتعميمات
 *
 * @version 3.0.0
 * @date 2026-02-09
 */

import React, { useState, useRef, useEffect } from 'react';
import { useColors } from '../../../context/ColorContext';
import { useNewsTicker, NEWS_TYPES } from '../../../context/NewsTickerContext';

// ══════════════════════════════════════════════════════════════
// الشريط الإخباري السفلي - يظهر في جميع الصفحات
// ══════════════════════════════════════════════════════════════
export default function NewsTicker({ darkMode = false, speed = 'normal', sidebarWidth = 288 }) {
    const [isPaused, setIsPaused] = useState(false);
    const tickerRef = useRef(null);
    const { newsBarColors } = useColors();
    const { publishedItems, isMinimized, toggleMinimize } = useNewsTicker();

    const speedValues = { slow: '60s', normal: '40s', fast: '25s' };

    // الألوان
    const bgGradient = newsBarColors?.gradient || (darkMode
        ? 'linear-gradient(90deg, #1E293B, #334155)'
        : 'linear-gradient(90deg, #1d4ed8, #2563eb)');
    const labelBg = newsBarColors?.labelBg || (darkMode ? '#0F172A' : '#1e40af');

    // لا نعرض شيء إذا لم توجد أخبار
    if (!publishedItems || publishedItems.length === 0) return null;

    // الشريط في حالة الإخفاء - شريط رفيع مع زر إعادة الفتح
    if (isMinimized) {
        return (
            <div
                className="fixed bottom-0 left-0 z-40 transition-all duration-300"
                style={{ right: `${sidebarWidth}px` }}
            >
                <button
                    onClick={toggleMinimize}
                    className="flex items-center gap-2 px-4 py-1.5 text-white text-xs font-medium rounded-tr-lg transition-all hover:py-2"
                    style={{ background: bgGradient }}
                    title="إظهار الشريط الإخباري"
                >
                    <span className="animate-pulse text-[10px]">🔴</span>
                    <span>آخر الأخبار ({publishedItems.length})</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div
            className="fixed bottom-0 left-0 z-40 transition-all duration-300"
            style={{ right: `${sidebarWidth}px` }}
        >
            <div className="relative overflow-hidden" style={{ background: bgGradient }}>
                {/* زر الإخفاء */}
                <button
                    onClick={toggleMinimize}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="إخفاء الشريط الإخباري"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* التسمية */}
                <div
                    className="absolute right-0 top-0 bottom-0 z-10 flex items-center px-4"
                    style={{ backgroundColor: labelBg }}
                >
                    <div className="flex items-center gap-2">
                        <span className="animate-pulse text-xs">🔴</span>
                        <span className="text-white font-bold text-xs">آخر الأخبار</span>
                        <span className="text-white/60 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">
                            {publishedItems.length}
                        </span>
                    </div>
                </div>

                {/* المحتوى المتحرك */}
                <div
                    ref={tickerRef}
                    className="py-2.5 pr-40 pl-10"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div
                        className={`flex gap-12 whitespace-nowrap ${isPaused ? '' : 'animate-ticker'}`}
                        style={{
                            animationDuration: speedValues[speed],
                            animationPlayState: isPaused ? 'paused' : 'running',
                        }}
                    >
                        {/* تكرار مزدوج للحركة المستمرة */}
                        {[...publishedItems, ...publishedItems].map((item, index) => (
                            <TickerNewsItem key={`${item.id}-${index}`} item={item} darkMode={darkMode} />
                        ))}
                    </div>
                </div>

                {/* تأثير التلاشي على اليسار */}
                <div
                    className="absolute left-8 top-0 bottom-0 w-16 pointer-events-none"
                    style={{
                        background: `linear-gradient(to left, transparent, ${newsBarColors?.background || (darkMode ? '#334155' : '#2563eb')})`,
                    }}
                />

                {/* CSS Animation */}
                <style jsx>{`
                    @keyframes ticker {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(50%); }
                    }
                    .animate-ticker {
                        animation: ticker linear infinite;
                    }
                `}</style>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// عنصر خبر واحد في الشريط
// ══════════════════════════════════════════════════════════════
function TickerNewsItem({ item, darkMode }) {
    const config = NEWS_TYPES[item.type] || NEWS_TYPES.news;

    return (
        <div className="flex items-center gap-3 text-white">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${darkMode ? 'bg-gray-700' : 'bg-white/20'}`}>
                {config.icon} {config.label}
            </span>
            <span className="text-sm">{item.text}</span>
            <span className="text-white/30">|</span>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// نسخة بطاقة للأخبار (تُستخدم كويدجت في لوحة التحكم)
// ══════════════════════════════════════════════════════════════
export function NewsCard({ darkMode = false, maxItems = 5 }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const { hoverColors } = useColors();
    const { publishedItems } = useNewsTicker();
    const news = publishedItems.length > 0 ? publishedItems : [];

    useEffect(() => {
        if (news.length === 0) return;
        const timer = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % Math.min(news.length, maxItems));
        }, 5000);
        return () => clearInterval(timer);
    }, [news.length, maxItems]);

    const primaryColor = hoverColors?.primary || '#1d4ed8';
    const lightBg = hoverColors?.light || '#EFF6FF';
    const displayNews = news.slice(0, maxItems);

    if (displayNews.length === 0) {
        return (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                <span className="text-3xl block mb-2">📰</span>
                <p className="text-sm">لا توجد أخبار حالياً</p>
            </div>
        );
    }

    return (
        <div>
            {/* الخبر الحالي */}
            <div
                className="p-4 rounded-xl mb-4"
                style={{ backgroundColor: darkMode ? '#374151' : lightBg }}
            >
                <div className="flex items-start gap-3">
                    <span className="text-2xl">{NEWS_TYPES[displayNews[activeIndex]?.type]?.icon || '📰'}</span>
                    <div className="flex-1">
                        <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                                backgroundColor: darkMode ? `${primaryColor}30` : `${primaryColor}20`,
                                color: primaryColor,
                            }}
                        >
                            {NEWS_TYPES[displayNews[activeIndex]?.type]?.label || 'خبر'}
                        </span>
                        <p className={`mt-2 text-sm leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700 dark:text-gray-200'}`}>
                            {displayNews[activeIndex]?.text}
                        </p>
                    </div>
                </div>
            </div>

            {/* المؤشرات */}
            <div className="flex justify-center gap-2">
                {displayNews.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        className="h-2 rounded-full transition-all"
                        style={{
                            width: index === activeIndex ? '24px' : '8px',
                            backgroundColor: index === activeIndex ? primaryColor : darkMode ? '#4B5563' : '#D1D5DB',
                        }}
                    />
                ))}
            </div>

            {/* قائمة الأخبار */}
            <div className={`mt-4 pt-4 border-t space-y-2 ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                {displayNews.map((item, index) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveIndex(index)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-right transition-colors"
                        style={{
                            backgroundColor:
                                index === activeIndex
                                    ? darkMode ? '#374151' : `${primaryColor}10`
                                    : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                            if (index !== activeIndex) {
                                e.currentTarget.style.backgroundColor = darkMode ? '#374151' : `${primaryColor}05`;
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (index !== activeIndex) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }
                        }}
                    >
                        <span className="text-sm">{NEWS_TYPES[item.type]?.icon}</span>
                        <span className={`text-xs flex-1 truncate ${darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                            {item.text}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
