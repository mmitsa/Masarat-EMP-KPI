/**
 * Skeleton Loading Component - مكون التحميل الهيكلي
 * 
 * يوفر شاشات تحميل احترافية بدلاً من LoadingSpinner
 * يعطي المستخدم فكرة عن شكل المحتوى القادم
 * 
 * @version 1.0.0
 * @date 2026-02-07
 */

import React from 'react';

/**
 * Skeleton Component
 * @param {string} type - نوع الهيكل: text, circle, rect, card, table, avatar
 * @param {string} width - العرض المخصص
 * @param {string} height - الارتفاع المخصص
 * @param {string} className - كلاسات إضافية
 * @param {number} count - عدد التكرارات
 */
export default function Skeleton({ 
    type = 'text', 
    width, 
    height, 
    className = '',
    count = 1,
    rounded = true,
    animate = true,
}) {
    const types = {
        text: 'h-4 w-full',
        title: 'h-6 w-3/4',
        subtitle: 'h-4 w-1/2',
        circle: 'rounded-full',
        avatar: 'h-12 w-12 rounded-full',
        rect: 'h-32 w-full',
        card: 'h-48 w-full',
        button: 'h-10 w-24',
        input: 'h-10 w-full',
        badge: 'h-6 w-16 rounded-full',
    };

    const baseClasses = `
        bg-gray-200 dark:bg-gray-700
        ${animate ? 'animate-pulse' : ''}
        ${rounded && !['circle', 'avatar', 'badge'].includes(type) ? 'rounded-lg' : ''}
        ${types[type] || types.text}
    `;

    const style = {
        ...(width && { width }),
        ...(height && { height }),
    };

    if (count > 1) {
        return (
            <div className="space-y-2">
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        className={`${baseClasses} ${className}`}
                        style={style}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={`${baseClasses} ${className}`}
            style={style}
        />
    );
}

/**
 * Skeleton Card - بطاقة كاملة
 */
export function SkeletonCard({ showImage = true, lines = 3 }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            {showImage && (
                <Skeleton type="rect" height="200px" />
            )}
            <Skeleton type="title" />
            <Skeleton type="text" count={lines} />
            <div className="flex gap-2">
                <Skeleton type="button" />
                <Skeleton type="button" />
            </div>
        </div>
    );
}

/**
 * Skeleton Table - جدول كامل
 */
export function SkeletonTable({ rows = 5, columns = 5 }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={i} type="text" width={`${100 / columns}%`} />
                    ))}
                </div>
            </div>
            
            {/* Rows */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="p-4">
                        <div className="flex gap-4">
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <Skeleton key={colIndex} type="text" width={`${100 / columns}%`} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Skeleton List - قائمة
 */
export function SkeletonList({ items = 5, avatar = true }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    {avatar && <Skeleton type="avatar" />}
                    <div className="flex-1 space-y-2">
                        <Skeleton type="title" />
                        <Skeleton type="text" width="70%" />
                    </div>
                    <Skeleton type="button" />
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton Form - نموذج
 */
export function SkeletonForm({ fields = 4 }) {
    return (
        <div className="space-y-6">
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton type="text" width="100px" />
                    <Skeleton type="input" />
                </div>
            ))}
            <div className="flex gap-3">
                <Skeleton type="button" width="120px" />
                <Skeleton type="button" width="100px" />
            </div>
        </div>
    );
}

/**
 * Skeleton Stats - إحصائيات
 */
export function SkeletonStats({ count = 4 }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
                    <Skeleton type="circle" width="48px" height="48px" />
                    <Skeleton type="title" />
                    <Skeleton type="text" width="60%" />
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton Dashboard - لوحة تحكم كاملة
 */
export function SkeletonDashboard() {
    return (
        <div className="space-y-6">
            {/* Stats */}
            <SkeletonStats count={4} />
            
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkeletonCard lines={0} showImage={true} />
                <SkeletonCard lines={0} showImage={true} />
            </div>
            
            {/* Table */}
            <SkeletonTable rows={5} columns={5} />
        </div>
    );
}
