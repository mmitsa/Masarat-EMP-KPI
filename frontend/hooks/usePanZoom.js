import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook للتحكم في السحب (Pan) والزوم للمحتوى
 * يوفر وظائف السحب باليد والزوم بالماوس ويل
 * مع دعم اللمس (Touch) والحفظ في LocalStorage
 */
export function usePanZoom({
    initialScale = 1,
    minScale = 0.3,
    maxScale = 2,
    disabled = false,
    storageKey = 'panZoomState', // مفتاح LocalStorage
    enableStorage = false // تفعيل الحفظ في LocalStorage
} = {}) {
    // تحميل الحالة من LocalStorage إن وجدت
    const loadStateFromStorage = () => {
        if (!enableStorage || typeof window === 'undefined') return null;
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    };

    const savedState = loadStateFromStorage();

    const [scale, setScale] = useState(savedState?.scale || initialScale);
    const [position, setPosition] = useState(savedState?.position || { x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const startPosRef = useRef({ x: 0, y: 0 });
    const currentPosRef = useRef({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Touch support refs
    const touchStartDistance = useRef(0);
    const touchStartScale = useRef(1);
    const lastTouchTime = useRef(0);

    // بدء السحب
    const handleMouseDown = useCallback((e) => {
        if (disabled) return;

        // تجاهل إذا كان الضغط على زر أو عنصر تفاعلي
        if (e.target.closest('button, a, input, select, textarea')) {
            return;
        }

        setIsPanning(true);
        setIsDragging(false);
        startPosRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        currentPosRef.current = { x: e.clientX, y: e.clientY };

        // تغيير المؤشر
        if (containerRef.current) {
            containerRef.current.style.cursor = 'grabbing';
        }
    }, [position, disabled]);

    // الحركة أثناء السحب
    const handleMouseMove = useCallback((e) => {
        if (!isPanning || disabled) return;

        const deltaX = Math.abs(e.clientX - currentPosRef.current.x);
        const deltaY = Math.abs(e.clientY - currentPosRef.current.y);

        // إذا تحرك الماوس أكثر من 5 بكسل، نعتبره سحب
        if (deltaX > 5 || deltaY > 5) {
            setIsDragging(true);
        }

        const newX = e.clientX - startPosRef.current.x;
        const newY = e.clientY - startPosRef.current.y;

        setPosition({ x: newX, y: newY });
    }, [isPanning, disabled]);

    // إنهاء السحب
    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
        setTimeout(() => setIsDragging(false), 100);

        if (containerRef.current) {
            containerRef.current.style.cursor = disabled ? 'default' : 'grab';
        }
    }, [disabled]);

    // الزوم بالماوس ويل
    const handleWheel = useCallback((e) => {
        if (disabled) return;

        e.preventDefault();

        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(minScale, Math.min(maxScale, scale + delta));

        setScale(newScale);
    }, [scale, minScale, maxScale, disabled]);

    // إعادة التعيين
    const reset = useCallback(() => {
        setScale(initialScale);
        setPosition({ x: 0, y: 0 });
    }, [initialScale]);

    // الزوم In
    const zoomIn = useCallback(() => {
        setScale(prev => Math.min(maxScale, prev + 0.2));
    }, [maxScale]);

    // الزوم Out
    const zoomOut = useCallback(() => {
        setScale(prev => Math.max(minScale, prev - 0.2));
    }, [minScale]);

    // توسيط المحتوى
    const center = useCallback(() => {
        setPosition({ x: 0, y: 0 });
    }, []);

    // حساب المسافة بين نقطتي لمس
    const getTouchDistance = (touch1, touch2) => {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // معالج بدء اللمس
    const handleTouchStart = useCallback((e) => {
        if (disabled) return;

        // تجاهل إذا كان اللمس على زر أو عنصر تفاعلي
        if (e.target.closest('button, a, input, select, textarea')) {
            return;
        }

        const touches = e.touches;

        if (touches.length === 1) {
            // لمسة واحدة = سحب
            setIsPanning(true);
            setIsDragging(false);
            const touch = touches[0];
            startPosRef.current = {
                x: touch.clientX - position.x,
                y: touch.clientY - position.y
            };
            currentPosRef.current = { x: touch.clientX, y: touch.clientY };
        } else if (touches.length === 2) {
            // لمستان = زوم
            e.preventDefault();
            touchStartDistance.current = getTouchDistance(touches[0], touches[1]);
            touchStartScale.current = scale;
        }
    }, [position, scale, disabled]);

    // معالج حركة اللمس
    const handleTouchMove = useCallback((e) => {
        if (disabled) return;

        const touches = e.touches;

        if (touches.length === 1 && isPanning) {
            // السحب بلمسة واحدة
            const touch = touches[0];
            const deltaX = Math.abs(touch.clientX - currentPosRef.current.x);
            const deltaY = Math.abs(touch.clientY - currentPosRef.current.y);

            if (deltaX > 5 || deltaY > 5) {
                setIsDragging(true);
            }

            const newX = touch.clientX - startPosRef.current.x;
            const newY = touch.clientY - startPosRef.current.y;

            setPosition({ x: newX, y: newY });
        } else if (touches.length === 2) {
            // Pinch to zoom
            e.preventDefault();
            const currentDistance = getTouchDistance(touches[0], touches[1]);
            const scaleDelta = currentDistance / touchStartDistance.current;
            const newScale = Math.max(
                minScale,
                Math.min(maxScale, touchStartScale.current * scaleDelta)
            );
            setScale(newScale);
        }
    }, [isPanning, minScale, maxScale, disabled]);

    // معالج نهاية اللمس
    const handleTouchEnd = useCallback(() => {
        setIsPanning(false);
        setTimeout(() => setIsDragging(false), 100);
        touchStartDistance.current = 0;
    }, []);

    // حفظ الحالة في LocalStorage
    useEffect(() => {
        if (!enableStorage || typeof window === 'undefined') return;

        const saveState = setTimeout(() => {
            try {
                localStorage.setItem(storageKey, JSON.stringify({ scale, position }));
            } catch (error) {
                console.warn('Failed to save pan-zoom state:', error);
            }
        }, 500); // تأخير 500ms لتجنب الحفظ المتكرر

        return () => clearTimeout(saveState);
    }, [scale, position, enableStorage, storageKey]);

    // تسجيل مستمعي الأحداث
    useEffect(() => {
        if (disabled) {
            if (containerRef.current) {
                containerRef.current.style.cursor = 'default';
            }
            return;
        }

        if (containerRef.current) {
            containerRef.current.style.cursor = isPanning ? 'grabbing' : 'grab';
        }

        // Mouse events
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        // Touch events
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd, isPanning, disabled]);

    return {
        scale,
        position,
        isPanning,
        isDragging,
        containerRef,
        handlers: {
            onMouseDown: handleMouseDown,
            onWheel: handleWheel,
            onTouchStart: handleTouchStart,
        },
        controls: {
            reset,
            zoomIn,
            zoomOut,
            center,
            setScale,
            setPosition, // إضافة دالة تعيين الموضع
        }
    };
}

export default usePanZoom;