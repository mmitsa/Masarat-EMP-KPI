/**
 * مكون الجولة التعريفية - Guided Tour Component
 * يعرض overlay مع spotlight وبطاقة شرح متحركة
 *
 * التصميم متكامل مع هوية المنصة الموحدة:
 * - ألوان المنصة (primary blue + design tokens)
 * - حواف مدورة (rounded-xl)
 * - RTL كامل
 * - أنيميشن سلسة
 */

import React, { useEffect, useCallback, useState, useRef, memo } from 'react';
import { useGuidedTour } from '../../context/GuidedTourContext';

// ==================== حساب موقع التولتيب ====================
const TOOLTIP_WIDTH = 380;
const GAP = 16;
const PADDING = 10; // حشوة حول العنصر المستهدف

function calculateTooltipPosition(targetRect, placement = 'auto', tooltipHeight = 220) {
    if (!targetRect) {
        // إذا لا يوجد عنصر مستهدف - يعرض في وسط الشاشة
        return {
            top: Math.max(60, (window.innerHeight - tooltipHeight) / 2),
            left: Math.max(16, (window.innerWidth - TOOLTIP_WIDTH) / 2),
            placement: 'center',
            arrowLeft: TOOLTIP_WIDTH / 2,
        };
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // حساب المساحات المتاحة
    const spaceBelow = vh - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const spaceLeft = targetRect.left;
    const spaceRight = vw - targetRect.right;

    // اكتشاف أفضل موقع تلقائياً
    if (placement === 'auto') {
        if (spaceBelow >= tooltipHeight + GAP + 20) {
            placement = 'bottom';
        } else if (spaceAbove >= tooltipHeight + GAP + 20) {
            placement = 'top';
        } else if (spaceRight >= TOOLTIP_WIDTH + GAP + 20) {
            placement = 'right';
        } else if (spaceLeft >= TOOLTIP_WIDTH + GAP + 20) {
            placement = 'left';
        } else {
            placement = 'bottom'; // fallback
        }
    }

    let top, left, arrowLeft, arrowTop;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    switch (placement) {
        case 'bottom':
            top = targetRect.bottom + GAP;
            left = targetCenterX - TOOLTIP_WIDTH / 2;
            arrowLeft = TOOLTIP_WIDTH / 2;
            break;

        case 'top':
            top = targetRect.top - tooltipHeight - GAP;
            left = targetCenterX - TOOLTIP_WIDTH / 2;
            arrowLeft = TOOLTIP_WIDTH / 2;
            break;

        case 'left':
            top = targetCenterY - tooltipHeight / 2;
            left = targetRect.left - TOOLTIP_WIDTH - GAP;
            arrowTop = tooltipHeight / 2;
            break;

        case 'right':
            top = targetCenterY - tooltipHeight / 2;
            left = targetRect.right + GAP;
            arrowTop = tooltipHeight / 2;
            break;

        default:
            top = targetRect.bottom + GAP;
            left = targetCenterX - TOOLTIP_WIDTH / 2;
            arrowLeft = TOOLTIP_WIDTH / 2;
            placement = 'bottom';
    }

    // حدود الشاشة
    left = Math.max(16, Math.min(left, vw - TOOLTIP_WIDTH - 16));
    top = Math.max(16, Math.min(top, vh - tooltipHeight - 16));

    // تصحيح موقع السهم بعد clamping
    if (placement === 'bottom' || placement === 'top') {
        arrowLeft = targetCenterX - left;
        arrowLeft = Math.max(24, Math.min(arrowLeft, TOOLTIP_WIDTH - 24));
    }

    return { top, left, placement, arrowLeft, arrowTop };
}

// ==================== مكون السهم ====================
function TooltipArrow({ placement, arrowLeft, arrowTop }) {
    if (placement === 'center') return null;

    const baseClasses = 'tour-arrow';
    let positionStyle = {};
    let directionClass = '';

    switch (placement) {
        case 'bottom':
            directionClass = 'tour-arrow-bottom';
            positionStyle = { left: arrowLeft ? `${arrowLeft}px` : '50%', transform: 'translateX(-50%) rotate(45deg)' };
            break;
        case 'top':
            directionClass = 'tour-arrow-top';
            positionStyle = { left: arrowLeft ? `${arrowLeft}px` : '50%', transform: 'translateX(-50%) rotate(45deg)' };
            break;
        case 'left':
            directionClass = 'tour-arrow-left';
            positionStyle = { top: arrowTop ? `${arrowTop}px` : '50%', transform: 'translateY(-50%) rotate(45deg)' };
            break;
        case 'right':
            directionClass = 'tour-arrow-right';
            positionStyle = { top: arrowTop ? `${arrowTop}px` : '50%', transform: 'translateY(-50%) rotate(45deg)' };
            break;
    }

    return <div className={`${baseClasses} ${directionClass}`} style={positionStyle} />;
}

// ==================== مكون نقاط الخطوات ====================
function StepDots({ total, current, onGoToStep }) {
    return (
        <div className="flex items-center gap-1.5" dir="ltr">
            {Array.from({ length: total }, (_, i) => (
                <button
                    key={i}
                    onClick={() => onGoToStep(i)}
                    className={`tour-step-dot rounded-full transition-all duration-300 ${
                        i === current
                            ? 'bg-[var(--color-primary-500)] w-7 h-2.5 tour-step-dot-active'
                            : i < current
                            ? 'bg-[var(--color-primary-300)] w-2.5 h-2.5 hover:bg-[var(--color-primary-400)]'
                            : 'bg-[var(--color-gray-300)] w-2.5 h-2.5 hover:bg-[var(--color-gray-400)]'
                    }`}
                    aria-label={`الخطوة ${i + 1}`}
                    title={`الخطوة ${i + 1}`}
                />
            ))}
        </div>
    );
}

// ==================== المكون الرئيسي ====================
const GuidedTour = memo(function GuidedTour() {
    const {
        isActive,
        currentStep,
        currentStepIndex,
        steps,
        totalSteps,
        tourTitle,
        targetRect,
        progress,
        isFirstStep,
        isLastStep,
        nextStep,
        prevStep,
        goToStep,
        skipTour,
        endTour,
    } = useGuidedTour();

    const tooltipRef = useRef(null);
    const [tooltipPos, setTooltipPos] = useState(null);
    const [isExiting, setIsExiting] = useState(false);
    const [tooltipHeight, setTooltipHeight] = useState(220);

    // حساب موقع التولتيب عند تغير targetRect
    useEffect(() => {
        if (!isActive || !currentStep) return;

        const pos = calculateTooltipPosition(
            targetRect,
            currentStep.placement || 'auto',
            tooltipHeight
        );
        setTooltipPos(pos);
    }, [isActive, currentStep, targetRect, tooltipHeight]);

    // قياس ارتفاع التولتيب بعد الرندر
    useEffect(() => {
        if (!tooltipRef.current || !isActive) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const newHeight = entry.contentRect.height;
                if (Math.abs(newHeight - tooltipHeight) > 10) {
                    setTooltipHeight(newHeight);
                }
            }
        });
        observer.observe(tooltipRef.current);
        return () => observer.disconnect();
    }, [isActive, tooltipHeight]);

    // التعامل مع لوحة المفاتيح
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'Escape':
                    handleSkip();
                    break;
                case 'ArrowLeft': // RTL: يسار = التالي
                    e.preventDefault();
                    handleNext();
                    break;
                case 'ArrowRight': // RTL: يمين = السابق
                    e.preventDefault();
                    if (!isFirstStep) handlePrev();
                    break;
                case 'Enter':
                    e.preventDefault();
                    handleNext();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isActive, isFirstStep, isLastStep]);

    // أنيميشن الانتقال بين الخطوات
    const handleNext = useCallback(() => {
        if (isExiting) return;
        setIsExiting(true);
        setTimeout(() => {
            nextStep();
            setIsExiting(false);
        }, 200);
    }, [nextStep, isExiting]);

    const handlePrev = useCallback(() => {
        if (isExiting) return;
        setIsExiting(true);
        setTimeout(() => {
            prevStep();
            setIsExiting(false);
        }, 200);
    }, [prevStep, isExiting]);

    const handleSkip = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => {
            skipTour();
            setIsExiting(false);
        }, 200);
    }, [skipTour]);

    const handleEnd = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => {
            endTour();
            setIsExiting(false);
        }, 200);
    }, [endTour]);

    if (!isActive || !currentStep) return null;

    const spotlightStyle = targetRect ? {
        top: `${targetRect.top - PADDING}px`,
        left: `${targetRect.left - PADDING}px`,
        width: `${targetRect.width + PADDING * 2}px`,
        height: `${targetRect.height + PADDING * 2}px`,
    } : {
        top: '50%',
        left: '50%',
        width: '0px',
        height: '0px',
    };

    return (
        <div dir="rtl" className="no-print">
            {/* طبقة النقر على الخلفية */}
            <div
                className="tour-overlay-click"
                onClick={handleSkip}
                aria-hidden="true"
            />

            {/* تأثير Spotlight */}
            <div
                className="tour-spotlight"
                style={spotlightStyle}
                aria-hidden="true"
            />

            {/* بطاقة التولتيب */}
            {tooltipPos && (
                <div
                    ref={tooltipRef}
                    className={`tour-tooltip ${isExiting ? 'tour-tooltip-exit' : ''}`}
                    style={{
                        top: `${tooltipPos.top}px`,
                        left: `${tooltipPos.left}px`,
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${tourTitle} - الخطوة ${currentStepIndex + 1} من ${totalSteps}`}
                >
                    <div className="tour-tooltip-card">
                        {/* الهيدر - تدرج لوني بألوان المنصة */}
                        <div className="tour-tooltip-header">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-2xl" role="img" aria-hidden="true">
                                        {currentStep.icon || '💡'}
                                    </span>
                                    <h3 className="text-base font-bold text-white leading-tight">
                                        {currentStep.title}
                                    </h3>
                                </div>
                                <button
                                    onClick={handleEnd}
                                    className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                                    aria-label="إغلاق الجولة"
                                >
                                    <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* شريط التقدم */}
                            <div className="tour-progress-bar">
                                <div
                                    className="tour-progress-fill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[11px] text-white/70 font-medium">
                                    {tourTitle}
                                </span>
                                <span className="text-[11px] text-white/70 font-medium" dir="ltr">
                                    {currentStepIndex + 1} / {totalSteps}
                                </span>
                            </div>
                        </div>

                        {/* المحتوى */}
                        <div className="p-5">
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                {currentStep.description}
                            </p>
                        </div>

                        {/* الفوتر - نقاط + أزرار */}
                        <div className="flex items-center justify-between px-5 pb-4 pt-1">
                            {/* نقاط الخطوات */}
                            <StepDots
                                total={totalSteps}
                                current={currentStepIndex}
                                onGoToStep={(i) => {
                                    if (i !== currentStepIndex) {
                                        setIsExiting(true);
                                        setTimeout(() => {
                                            goToStep(i);
                                            setIsExiting(false);
                                        }, 200);
                                    }
                                }}
                            />

                            {/* أزرار التنقل */}
                            <div className="flex items-center gap-2">
                                {/* زر تخطي */}
                                <button
                                    onClick={handleSkip}
                                    className="px-3 py-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors rounded-lg hover:bg-[var(--bg-tertiary,rgba(0,0,0,0.04))]"
                                >
                                    تخطي
                                </button>

                                {/* زر السابق */}
                                {!isFirstStep && (
                                    <button
                                        onClick={handlePrev}
                                        className="px-3.5 py-1.5 text-xs font-medium rounded-xl border border-[var(--card-border,var(--border-light))] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary,rgba(0,0,0,0.04))] transition-colors"
                                    >
                                        السابق
                                    </button>
                                )}

                                {/* زر التالي / إنهاء */}
                                <button
                                    onClick={handleNext}
                                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600,#1e40af)] transition-all shadow-sm dark:shadow-gray-900/20 hover:shadow-md active:scale-[0.97]"
                                >
                                    {isLastStep ? (
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                            فهمت!
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            التالي
                                            <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* السهم */}
                    <TooltipArrow
                        placement={tooltipPos.placement}
                        arrowLeft={tooltipPos.arrowLeft}
                        arrowTop={tooltipPos.arrowTop}
                    />
                </div>
            )}
        </div>
    );
});

GuidedTour.displayName = 'GuidedTour';

export default GuidedTour;
