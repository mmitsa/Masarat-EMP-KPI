/**
 * Virtual Scrolling Component - التمرير الافتراضي
 * 
 * لعرض جداول كبيرة (10,000+ صف) بدون lag
 * 
 * @version 1.0.0
 * @date 2026-02-07
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Virtual Table - جدول افتراضي
 */
export default function VirtualTable({
    data = [],
    columns = [],
    rowHeight = 60,
    headerHeight = 48,
    containerHeight = 600,
    onRowClick,
    className = '',
}) {
    const containerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);
    
    // حساب عدد الصفوف المرئية
    const visibleRowCount = Math.ceil(containerHeight / rowHeight);
    
    // حساب البداية والنهاية
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 5);
    const endIndex = Math.min(data.length, startIndex + visibleRowCount + 10);
    
    // الصفوف المرئية فقط
    const visibleRows = data.slice(startIndex, endIndex);
    
    // الارتفاع الكلي
    const totalHeight = data.length * rowHeight;
    
    // معالجة التمرير
    const handleScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, []);
    
    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);
    
    return (
        <div 
            ref={containerRef}
            className={`overflow-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}
            style={{ height: containerHeight }}
        >
            {/* Header */}
            <div 
                className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
                style={{ height: headerHeight }}
            >
                <div className="flex">
                    {columns.map((column, index) => (
                        <div
                            key={index}
                            className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300"
                            style={{ 
                                width: column.width || `${100 / columns.length}%`,
                                minWidth: column.minWidth || 'auto',
                            }}
                        >
                            {column.header}
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Body */}
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div
                    style={{
                        transform: `translateY(${startIndex * rowHeight}px)`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                    }}
                >
                    {visibleRows.map((row, rowIndex) => {
                        const actualIndex = startIndex + rowIndex;
                        return (
                            <div
                                key={actualIndex}
                                className="flex border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                                style={{ height: rowHeight }}
                                onClick={() => onRowClick?.(row, actualIndex)}
                            >
                                {columns.map((column, colIndex) => (
                                    <div
                                        key={colIndex}
                                        className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 flex items-center"
                                        style={{ 
                                            width: column.width || `${100 / columns.length}%`,
                                            minWidth: column.minWidth || 'auto',
                                        }}
                                    >
                                        {column.render ? column.render(row, actualIndex) : row[column.field]}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Empty State */}
            {data.length === 0 && (
                <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                    لا توجد بيانات
                </div>
            )}
        </div>
    );
}

/**
 * Virtual List - قائمة افتراضية
 */
export function VirtualList({
    data = [],
    itemHeight = 80,
    containerHeight = 600,
    renderItem,
    gap = 8,
    className = '',
}) {
    const containerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);
    
    const visibleItemCount = Math.ceil(containerHeight / (itemHeight + gap));
    const startIndex = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - 3);
    const endIndex = Math.min(data.length, startIndex + visibleItemCount + 6);
    
    const visibleItems = data.slice(startIndex, endIndex);
    const totalHeight = data.length * (itemHeight + gap);
    
    const handleScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, []);
    
    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);
    
    return (
        <div 
            ref={containerRef}
            className={`overflow-auto ${className}`}
            style={{ height: containerHeight }}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div
                    style={{
                        transform: `translateY(${startIndex * (itemHeight + gap)}px)`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                    }}
                >
                    {visibleItems.map((item, index) => {
                        const actualIndex = startIndex + index;
                        return (
                            <div
                                key={actualIndex}
                                style={{ 
                                    height: itemHeight,
                                    marginBottom: gap,
                                }}
                            >
                                {renderItem(item, actualIndex)}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {data.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    لا توجد عناصر
                </div>
            )}
        </div>
    );
}

/**
 * Virtual Grid - شبكة افتراضية
 */
export function VirtualGrid({
    data = [],
    itemWidth = 300,
    itemHeight = 200,
    containerHeight = 600,
    gap = 16,
    renderItem,
    className = '',
}) {
    const containerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    
    // حساب عدد الأعمدة
    const columns = Math.floor((containerWidth + gap) / (itemWidth + gap)) || 1;
    const rows = Math.ceil(data.length / columns);
    
    const visibleRowCount = Math.ceil(containerHeight / (itemHeight + gap));
    const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - 2);
    const endRow = Math.min(rows, startRow + visibleRowCount + 4);
    
    const startIndex = startRow * columns;
    const endIndex = Math.min(data.length, endRow * columns);
    const visibleItems = data.slice(startIndex, endIndex);
    
    const totalHeight = rows * (itemHeight + gap);
    
    const handleScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, []);
    
    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            setContainerWidth(container.offsetWidth);
            
            const resizeObserver = new ResizeObserver((entries) => {
                setContainerWidth(entries[0].contentRect.width);
            });
            
            resizeObserver.observe(container);
            container.addEventListener('scroll', handleScroll, { passive: true });
            
            return () => {
                resizeObserver.disconnect();
                container.removeEventListener('scroll', handleScroll);
            };
        }
    }, [handleScroll]);
    
    return (
        <div 
            ref={containerRef}
            className={`overflow-auto ${className}`}
            style={{ height: containerHeight }}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div
                    style={{
                        transform: `translateY(${startRow * (itemHeight + gap)}px)`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        display: 'grid',
                        gridTemplateColumns: `repeat(${columns}, 1fr)`,
                        gap: gap,
                    }}
                >
                    {visibleItems.map((item, index) => {
                        const actualIndex = startIndex + index;
                        return (
                            <div
                                key={actualIndex}
                                style={{ height: itemHeight }}
                            >
                                {renderItem(item, actualIndex)}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {data.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    لا توجد عناصر
                </div>
            )}
        </div>
    );
}
