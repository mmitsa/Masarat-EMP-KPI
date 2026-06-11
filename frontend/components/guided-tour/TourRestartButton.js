/**
 * زر إعادة الجولة التعريفية
 * يظهر بعد إكمال أو تخطي الجولة - يسمح بإعادة تشغيلها
 */

import React, { memo } from 'react';
import { useGuidedTour } from '../../context/GuidedTourContext';

const TourRestartButton = memo(function TourRestartButton({ tourId, variant = 'default' }) {
    const { restartTour, isTourCompleted, isActive } = useGuidedTour();

    // لا يظهر إذا الجولة لم تكتمل بعد أو إذا جولة نشطة حالياً
    if (!isTourCompleted(tourId) || isActive) return null;

    if (variant === 'icon') {
        return (
            <button
                onClick={() => restartTour(tourId)}
                className="p-2 rounded-xl text-[var(--color-primary-500)] hover:bg-[var(--color-primary-50,rgba(29,78,216,0.06))] transition-all"
                title="إعادة الجولة التعريفية"
                aria-label="إعادة الجولة التعريفية"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
        );
    }

    return (
        <button
            onClick={() => restartTour(tourId)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl
                       bg-[var(--color-primary-50,rgba(29,78,216,0.06))] text-[var(--color-primary-500)]
                       hover:bg-[var(--color-primary-100,rgba(29,78,216,0.12))] transition-all
                       border border-[var(--color-primary-200,rgba(29,78,216,0.15))]"
            title="إعادة الجولة التعريفية"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>الجولة التعريفية</span>
        </button>
    );
});

TourRestartButton.displayName = 'TourRestartButton';

export default TourRestartButton;
