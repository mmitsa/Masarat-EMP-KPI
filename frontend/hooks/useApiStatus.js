/**
 * useApiStatus Hook - مراقبة حالة اتصال الـ APIs
 * يتحقق من حالة الخدمات الخلفية ويوفر معلومات الاتصال
 *
 * @version 1.0.0
 * @date 2026-02-03
 */

import { useState, useEffect, useCallback } from 'react';

// Health checks go through Next.js API proxy (server-side) to avoid Gateway routing issues
// تعريف الخدمات
const SERVICES = {
    gateway: { name: 'البوابة الرئيسية', key: 'gateway' },
    hr: { name: 'الموارد البشرية', key: 'hr' },
    warehouse: { name: 'المستودعات', key: 'warehouse' },
    movement: { name: 'الحركة', key: 'movement' },
    archiving: { name: 'الأرشفة', key: 'archiving' },
    sadad: { name: 'سداد', key: 'sadad' },
    epm: { name: 'الأداء', key: 'epm' },
    analytics: { name: 'التحليلات', key: 'analytics' },
    agents: { name: 'الوكلاء', key: 'agents' },
};

/**
 * Hook للتحقق من حالة API معين
 */
export function useServiceStatus(serviceKey) {
    const [status, setStatus] = useState({
        isConnected: null, // null = loading, true = connected, false = disconnected
        isLoading: true,
        error: null,
        lastCheck: null,
        usingMockData: true,
    });

    const checkConnection = useCallback(async () => {
        const service = SERVICES[serviceKey];
        if (!service) {
            setStatus(prev => ({
                ...prev,
                isConnected: false,
                isLoading: false,
                error: 'خدمة غير معروفة',
                usingMockData: true,
            }));
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            // Use Next.js API proxy for health checks (server-side, avoids Gateway routing issues)
            const response = await fetch(`/api/health-check/${serviceKey}`, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                const isHealthy = data.healthy === true;

                setStatus({
                    isConnected: isHealthy,
                    isLoading: false,
                    error: isHealthy ? null : (data.error || `حالة: ${data.status}`),
                    lastCheck: new Date(),
                    usingMockData: !isHealthy,
                });
            } else {
                setStatus({
                    isConnected: false,
                    isLoading: false,
                    error: `حالة: ${response.status}`,
                    lastCheck: new Date(),
                    usingMockData: true,
                });
            }
        } catch (error) {
            setStatus({
                isConnected: false,
                isLoading: false,
                error: error.name === 'AbortError' ? 'انتهت مهلة الاتصال' : error.message,
                lastCheck: new Date(),
                usingMockData: true,
            });
        }
    }, [serviceKey]);

    useEffect(() => {
        checkConnection();
        // إعادة الفحص كل 30 ثانية
        const interval = setInterval(checkConnection, 30000);
        return () => clearInterval(interval);
    }, [checkConnection]);

    return { ...status, refresh: checkConnection };
}

/**
 * Hook للتحقق من حالة جميع الخدمات
 */
export function useAllServicesStatus() {
    const [statuses, setStatuses] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const checkAllServices = useCallback(async () => {
        setIsLoading(true);
        const results = {};

        await Promise.all(
            Object.entries(SERVICES).map(async ([key, service]) => {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);

                    const response = await fetch(`/api/health-check/${key}`, {
                        method: 'GET',
                        signal: controller.signal,
                    });

                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const data = await response.json();
                        results[key] = {
                            name: service.name,
                            isConnected: data.healthy === true,
                            error: data.healthy ? null : data.error,
                        };
                    } else {
                        results[key] = {
                            name: service.name,
                            isConnected: false,
                            error: `HTTP ${response.status}`,
                        };
                    }
                } catch (error) {
                    results[key] = {
                        name: service.name,
                        isConnected: false,
                        error: error.message,
                    };
                }
            })
        );

        setStatuses(results);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        checkAllServices();
        const interval = setInterval(checkAllServices, 60000);
        return () => clearInterval(interval);
    }, [checkAllServices]);

    const connectedCount = Object.values(statuses).filter(s => s.isConnected).length;
    const totalCount = Object.keys(SERVICES).length;

    return {
        statuses,
        isLoading,
        connectedCount,
        totalCount,
        allConnected: connectedCount === totalCount,
        refresh: checkAllServices,
    };
}

/**
 * Hook للتحقق مما إذا كان يجب استخدام بيانات حقيقية أو mock
 */
export function useShouldUseMockData(serviceKey) {
    const { isConnected, isLoading } = useServiceStatus(serviceKey);

    // أثناء التحميل، استخدم mock data
    if (isLoading) return true;

    // إذا كان متصل، استخدم بيانات حقيقية
    return !isConnected;
}

export default useServiceStatus;
