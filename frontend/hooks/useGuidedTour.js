/**
 * هوك الجولة التعريفية - Guided Tour Hook
 * واجهة مبسطة للوصول لسياق الجولة التعريفية
 */

import { useCallback } from 'react';
import { useGuidedTour as useGuidedTourContext } from '../context/GuidedTourContext';

/**
 * هوك أساسي للوصول لحالة ودوال الجولة التعريفية
 */
export function useGuidedTour() {
    return useGuidedTourContext();
}

/**
 * هوك مبسط لتشغيل جولة محددة من أي صفحة
 * @param {string} tourId - معرّف الجولة
 * @returns {{ start, restart, isCompleted }}
 */
export function useTourTrigger(tourId) {
    const { startTour, restartTour, isTourCompleted } = useGuidedTourContext();

    const start = useCallback(() => {
        startTour(tourId);
    }, [tourId, startTour]);

    const restart = useCallback(() => {
        restartTour(tourId);
    }, [tourId, restartTour]);

    return {
        start,
        restart,
        isCompleted: isTourCompleted(tourId),
    };
}

export default useGuidedTour;
