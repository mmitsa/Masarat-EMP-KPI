/**
 * سياق الجولة التعريفية - Guided Tour Context
 * يدير حالة الجولة التعريفية وتخزين التقدم
 *
 * يتبع نفس نمط AnnouncementPopupContext مع useReducer + localStorage
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { detectTourForPath, getTourById } from '../lib/tourSteps';

// ==================== الثوابت ====================
const TOUR_STORAGE_KEY = 'masarat-guided-tours';
const AUTO_START_DELAY = 1800; // تأخير قبل بدء الجولة تلقائياً (مللي ثانية)

// ==================== أنواع الأكشنز ====================
const ACTIONS = {
    START_TOUR: 'START_TOUR',
    NEXT_STEP: 'NEXT_STEP',
    PREV_STEP: 'PREV_STEP',
    GO_TO_STEP: 'GO_TO_STEP',
    END_TOUR: 'END_TOUR',
    SKIP_TOUR: 'SKIP_TOUR',
    UPDATE_TARGET: 'UPDATE_TARGET',
};

// ==================== الحالة الابتدائية ====================
const initialState = {
    isActive: false,
    currentTourId: null,
    currentStepIndex: 0,
    steps: [],
    tourTitle: '',
    targetRect: null,
};

// ==================== Reducer ====================
function tourReducer(state, action) {
    switch (action.type) {
        case ACTIONS.START_TOUR:
            return {
                ...state,
                isActive: true,
                currentTourId: action.payload.tourId,
                currentStepIndex: 0,
                steps: action.payload.steps,
                tourTitle: action.payload.title,
                targetRect: null,
            };

        case ACTIONS.NEXT_STEP:
            if (state.currentStepIndex >= state.steps.length - 1) {
                return { ...initialState };
            }
            return {
                ...state,
                currentStepIndex: state.currentStepIndex + 1,
                targetRect: null,
            };

        case ACTIONS.PREV_STEP:
            if (state.currentStepIndex <= 0) return state;
            return {
                ...state,
                currentStepIndex: state.currentStepIndex - 1,
                targetRect: null,
            };

        case ACTIONS.GO_TO_STEP:
            if (action.payload < 0 || action.payload >= state.steps.length) return state;
            return {
                ...state,
                currentStepIndex: action.payload,
                targetRect: null,
            };

        case ACTIONS.END_TOUR:
        case ACTIONS.SKIP_TOUR:
            return { ...initialState };

        case ACTIONS.UPDATE_TARGET:
            return {
                ...state,
                targetRect: action.payload,
            };

        default:
            return state;
    }
}

// ==================== localStorage helpers ====================
function getTourStorage() {
    if (typeof window === 'undefined') return {};
    try {
        const saved = localStorage.getItem(TOUR_STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
}

function saveTourStorage(data) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore quota errors */ }
}

// ==================== قياس العنصر المستهدف ====================
function measureTarget(selector) {
    if (typeof document === 'undefined') return null;
    const el = document.querySelector(selector);
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
    };
}

// ==================== Context ====================
const GuidedTourContext = createContext(null);

// ==================== Provider ====================
export function GuidedTourProvider({ children }) {
    const router = useRouter();
    const [state, dispatch] = useReducer(tourReducer, initialState);
    const autoStartTimerRef = useRef(null);
    const measureTimerRef = useRef(null);
    const isStartingRef = useRef(false);

    // التحقق من إكمال/تخطي الجولة
    const isTourCompleted = useCallback((tourId) => {
        const storage = getTourStorage();
        const record = storage[tourId];
        if (!record) return false;

        const tourDef = getTourById(tourId);
        if (!tourDef) return false;

        // إذا تم تحديث الإصدار، تُعاد الجولة
        if (record.version < tourDef.version) return false;

        return record.status === 'completed' || record.status === 'skipped';
    }, []);

    // بدء جولة
    const startTour = useCallback((tourId) => {
        if (isStartingRef.current || state.isActive) return;
        isStartingRef.current = true;

        const tourDef = getTourById(tourId);
        if (!tourDef || !tourDef.steps?.length) {
            isStartingRef.current = false;
            return;
        }

        dispatch({
            type: ACTIONS.START_TOUR,
            payload: {
                tourId: tourDef.id,
                steps: tourDef.steps,
                title: tourDef.title,
            },
        });

        // قفل التمرير
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            isStartingRef.current = false;
        }, 100);
    }, [state.isActive]);

    // الانتقال للخطوة التالية
    const nextStep = useCallback(() => {
        if (state.currentStepIndex >= state.steps.length - 1) {
            // آخر خطوة - إكمال الجولة
            const storage = getTourStorage();
            const tourDef = getTourById(state.currentTourId);
            storage[state.currentTourId] = {
                status: 'completed',
                version: tourDef?.version || 1,
                timestamp: new Date().toISOString(),
            };
            saveTourStorage(storage);
            dispatch({ type: ACTIONS.END_TOUR });
            document.body.style.overflow = 'auto';
        } else {
            dispatch({ type: ACTIONS.NEXT_STEP });
        }
    }, [state.currentStepIndex, state.steps.length, state.currentTourId]);

    // الرجوع للخطوة السابقة
    const prevStep = useCallback(() => {
        dispatch({ type: ACTIONS.PREV_STEP });
    }, []);

    // الانتقال لخطوة محددة
    const goToStep = useCallback((index) => {
        dispatch({ type: ACTIONS.GO_TO_STEP, payload: index });
    }, []);

    // تخطي الجولة
    const skipTour = useCallback(() => {
        if (!state.currentTourId) return;
        const storage = getTourStorage();
        const tourDef = getTourById(state.currentTourId);
        storage[state.currentTourId] = {
            status: 'skipped',
            version: tourDef?.version || 1,
            timestamp: new Date().toISOString(),
        };
        saveTourStorage(storage);
        dispatch({ type: ACTIONS.SKIP_TOUR });
        document.body.style.overflow = 'auto';
    }, [state.currentTourId]);

    // إنهاء الجولة (بدون حفظ)
    const endTour = useCallback(() => {
        if (!state.currentTourId) return;
        const storage = getTourStorage();
        const tourDef = getTourById(state.currentTourId);
        storage[state.currentTourId] = {
            status: 'skipped',
            version: tourDef?.version || 1,
            timestamp: new Date().toISOString(),
        };
        saveTourStorage(storage);
        dispatch({ type: ACTIONS.END_TOUR });
        document.body.style.overflow = 'auto';
    }, [state.currentTourId]);

    // إعادة بدء جولة
    const restartTour = useCallback((tourId) => {
        const storage = getTourStorage();
        delete storage[tourId];
        saveTourStorage(storage);
        startTour(tourId);
    }, [startTour]);

    // مسح جميع الجولات المكتملة
    const resetAllTours = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOUR_STORAGE_KEY);
        }
    }, []);

    // تحديث موقع العنصر المستهدف
    const updateTargetRect = useCallback((rect) => {
        dispatch({ type: ACTIONS.UPDATE_TARGET, payload: rect });
    }, []);

    // ==================== قياس العنصر عند تغيير الخطوة ====================
    useEffect(() => {
        if (!state.isActive || !state.steps.length) return;

        const step = state.steps[state.currentStepIndex];
        if (!step?.target) return;

        const doMeasure = () => {
            const el = document.querySelector(step.target);
            if (!el) return;

            // تمرير للعنصر إذا خارج الشاشة
            const rect = el.getBoundingClientRect();
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
            if (!isVisible) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            // قياس بعد التمرير
            measureTimerRef.current = setTimeout(() => {
                const measured = measureTarget(step.target);
                if (measured) {
                    updateTargetRect(measured);
                }
            }, isVisible ? 50 : 450);
        };

        // تأخير قصير لانتظار DOM
        const initTimer = setTimeout(doMeasure, 100);

        // إعادة القياس عند تغيير حجم النافذة أو التمرير
        const handleReposition = () => {
            const measured = measureTarget(step.target);
            if (measured) updateTargetRect(measured);
        };

        let resizeTimer;
        const debouncedReposition = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(handleReposition, 100);
        };

        window.addEventListener('resize', debouncedReposition);
        window.addEventListener('scroll', debouncedReposition, true);

        return () => {
            clearTimeout(initTimer);
            clearTimeout(measureTimerRef.current);
            clearTimeout(resizeTimer);
            window.removeEventListener('resize', debouncedReposition);
            window.removeEventListener('scroll', debouncedReposition, true);
        };
    }, [state.isActive, state.currentStepIndex, state.steps, updateTargetRect]);

    // ==================== التشغيل التلقائي عند تغيير الصفحة ====================
    useEffect(() => {
        // إلغاء أي مؤقت سابق
        if (autoStartTimerRef.current) {
            clearTimeout(autoStartTimerRef.current);
            autoStartTimerRef.current = null;
        }

        // لا تبدأ تلقائياً إذا جولة نشطة
        if (state.isActive) return;

        const tourId = detectTourForPath(router.pathname);
        if (!tourId) return;

        // تحقق من الإكمال/التخطي
        if (isTourCompleted(tourId)) return;

        // بدء الجولة بعد تأخير للسماح بتحميل المحتوى
        autoStartTimerRef.current = setTimeout(() => {
            if (!isStartingRef.current) {
                startTour(tourId);
            }
        }, AUTO_START_DELAY);

        return () => {
            if (autoStartTimerRef.current) {
                clearTimeout(autoStartTimerRef.current);
            }
        };
    }, [router.pathname, state.isActive, isTourCompleted, startTour]);

    // ==================== تنظيف عند إلغاء تحميل المكون ====================
    useEffect(() => {
        return () => {
            document.body.style.overflow = 'auto';
            if (autoStartTimerRef.current) clearTimeout(autoStartTimerRef.current);
            if (measureTimerRef.current) clearTimeout(measureTimerRef.current);
        };
    }, []);

    // ==================== القيمة المعروضة ====================
    const value = useMemo(() => ({
        // الحالة
        isActive: state.isActive,
        currentTourId: state.currentTourId,
        currentStepIndex: state.currentStepIndex,
        steps: state.steps,
        tourTitle: state.tourTitle,
        targetRect: state.targetRect,
        totalSteps: state.steps.length,
        isFirstStep: state.currentStepIndex === 0,
        isLastStep: state.currentStepIndex === state.steps.length - 1,
        currentStep: state.steps[state.currentStepIndex] || null,
        progress: state.steps.length > 0
            ? ((state.currentStepIndex + 1) / state.steps.length) * 100
            : 0,

        // الدوال
        startTour,
        nextStep,
        prevStep,
        goToStep,
        skipTour,
        endTour,
        restartTour,
        resetAllTours,
        isTourCompleted,
    }), [
        state, startTour, nextStep, prevStep, goToStep,
        skipTour, endTour, restartTour, resetAllTours, isTourCompleted,
    ]);

    return (
        <GuidedTourContext.Provider value={value}>
            {children}
        </GuidedTourContext.Provider>
    );
}

// ==================== Hook ====================
export function useGuidedTour() {
    const context = useContext(GuidedTourContext);
    if (!context) {
        throw new Error('useGuidedTour يجب استخدامه داخل GuidedTourProvider');
    }
    return context;
}

export default GuidedTourContext;
