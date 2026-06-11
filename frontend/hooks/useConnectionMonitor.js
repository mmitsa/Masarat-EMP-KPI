/**
 * Connection Monitor Hook - مراقب الاتصال
 *
 * يوفر:
 * - مراقبة حالة الاتصال بالإنترنت
 * - فحص صحة الخدمات
 * - إعادة الاتصال التلقائي
 * - إشعارات حالة الاتصال
 *
 * @version 2.0.0
 * @date 2026-02-03
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    healthMonitor,
    initializeServices,
    getConnectionState,
    circuitBreakers,
    CircuitState,
} from '../lib/resilientClient';

// ============================================
// Configuration
// ============================================

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080';
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const RECONNECT_INTERVAL = 5000; // 5 seconds
const MAX_RECONNECT_ATTEMPTS = 10;

// ============================================
// Service Definitions
// ============================================

export const SERVICES = {
    gateway: { name: 'البوابة', endpoint: '/health', critical: true },
    identity: { name: 'الهوية', endpoint: '/api/identity/health', critical: true },
    hr: { name: 'الموارد البشرية', endpoint: '/api/hr/health', critical: false },
    warehouse: { name: 'المستودعات', endpoint: '/api/warehouse/health', critical: false },
    movement: { name: 'الحركة', endpoint: '/api/movement/health', critical: false },
    archiving: { name: 'الأرشفة', endpoint: '/api/archiving/health', critical: false },
    sadad: { name: 'سداد', endpoint: '/api/sadad/health', critical: false },
    epm: { name: 'الأداء', endpoint: '/api/epm/health', critical: false },
    analytics: { name: 'التحليلات', endpoint: '/api/analytics/health', critical: false },
    agents: { name: 'الوكلاء', endpoint: '/api/agents/health', critical: false },
};

// ============================================
// Main Hook
// ============================================

export function useConnectionMonitor(options = {}) {
    const {
        autoStart = true,
        checkInterval = HEALTH_CHECK_INTERVAL,
        services = Object.keys(SERVICES),
    } = options;

    // State
    const [isOnline, setIsOnline] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [serviceStatuses, setServiceStatuses] = useState({});
    const [lastCheck, setLastCheck] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [error, setError] = useState(null);

    // Refs
    const checkIntervalRef = useRef(null);
    const reconnectIntervalRef = useRef(null);
    const mountedRef = useRef(true);

    // ============================================
    // Health Check Functions
    // ============================================

    const checkServiceHealth = useCallback(async (serviceKey) => {
        const service = SERVICES[serviceKey];
        if (!service) return null;

        const url = `${GATEWAY_URL}${service.endpoint}`;
        const startTime = Date.now();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const latency = Date.now() - startTime;
            const data = await response.json().catch(() => null);

            return {
                key: serviceKey,
                name: service.name,
                status: response.ok ? 'healthy' : 'unhealthy',
                statusCode: response.status,
                latency,
                data,
                lastCheck: new Date().toISOString(),
                critical: service.critical,
            };
        } catch (error) {
            return {
                key: serviceKey,
                name: service.name,
                status: 'offline',
                error: error.message,
                lastCheck: new Date().toISOString(),
                critical: service.critical,
            };
        }
    }, []);

    const checkAllServices = useCallback(async () => {
        if (!mountedRef.current) return;

        setIsChecking(true);
        setError(null);

        const results = {};
        let hasConnectedService = false;
        let hasCriticalFailure = false;

        await Promise.all(
            services.map(async (serviceKey) => {
                const result = await checkServiceHealth(serviceKey);
                if (result) {
                    results[serviceKey] = result;

                    if (result.status === 'healthy') {
                        hasConnectedService = true;
                    } else if (result.critical) {
                        hasCriticalFailure = true;
                    }
                }
            })
        );

        if (mountedRef.current) {
            setServiceStatuses(results);
            setLastCheck(new Date().toISOString());
            setIsConnected(hasConnectedService && !hasCriticalFailure);
            setIsChecking(false);

            // Reset reconnect attempts on successful connection
            if (hasConnectedService && !hasCriticalFailure) {
                setReconnectAttempts(0);
            }
        }

        return results;
    }, [services, checkServiceHealth]);

    // ============================================
    // Reconnection Logic
    // ============================================

    const attemptReconnect = useCallback(async () => {
        if (!mountedRef.current) return;

        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            setError('تجاوزت المحاولات الحد الأقصى. يرجى التحقق من الاتصال يدوياً.');
            return;
        }

        setReconnectAttempts(prev => prev + 1);
        console.log(`[ConnectionMonitor] Reconnect attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}`);

        await checkAllServices();
    }, [reconnectAttempts, checkAllServices]);

    const startReconnecting = useCallback(() => {
        if (reconnectIntervalRef.current) return;

        reconnectIntervalRef.current = setInterval(() => {
            if (!isConnected && isOnline) {
                attemptReconnect();
            } else {
                // Clear interval if connected
                if (reconnectIntervalRef.current) {
                    clearInterval(reconnectIntervalRef.current);
                    reconnectIntervalRef.current = null;
                }
            }
        }, RECONNECT_INTERVAL);
    }, [isConnected, isOnline, attemptReconnect]);

    const stopReconnecting = useCallback(() => {
        if (reconnectIntervalRef.current) {
            clearInterval(reconnectIntervalRef.current);
            reconnectIntervalRef.current = null;
        }
    }, []);

    // ============================================
    // Periodic Health Checks
    // ============================================

    const startMonitoring = useCallback(() => {
        if (checkIntervalRef.current) return;

        // Initial check
        checkAllServices();

        // Periodic checks
        checkIntervalRef.current = setInterval(() => {
            if (mountedRef.current && isOnline) {
                checkAllServices();
            }
        }, checkInterval);
    }, [checkAllServices, checkInterval, isOnline]);

    const stopMonitoring = useCallback(() => {
        if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
        }
    }, []);

    // ============================================
    // Manual Actions
    // ============================================

    const refresh = useCallback(async () => {
        setReconnectAttempts(0);
        setError(null);
        return checkAllServices();
    }, [checkAllServices]);

    const forceReconnect = useCallback(async () => {
        // Reset circuit breakers
        for (const [, breaker] of circuitBreakers) {
            breaker.reset();
        }

        setReconnectAttempts(0);
        setError(null);
        return checkAllServices();
    }, [checkAllServices]);

    // ============================================
    // Online/Offline Detection
    // ============================================

    useEffect(() => {
        const handleOnline = () => {
            console.log('[ConnectionMonitor] Browser online');
            setIsOnline(true);
            checkAllServices();
        };

        const handleOffline = () => {
            console.log('[ConnectionMonitor] Browser offline');
            setIsOnline(false);
            setIsConnected(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Set initial state
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [checkAllServices]);

    // ============================================
    // Auto-start Monitoring
    // ============================================

    useEffect(() => {
        mountedRef.current = true;

        if (autoStart) {
            startMonitoring();
        }

        return () => {
            mountedRef.current = false;
            stopMonitoring();
            stopReconnecting();
        };
    }, [autoStart, startMonitoring, stopMonitoring, stopReconnecting]);

    // ============================================
    // Auto-reconnect on disconnect
    // ============================================

    useEffect(() => {
        if (!isConnected && isOnline && autoStart) {
            startReconnecting();
        } else {
            stopReconnecting();
        }
    }, [isConnected, isOnline, autoStart, startReconnecting, stopReconnecting]);

    // ============================================
    // Computed Values
    // ============================================

    const healthyCount = Object.values(serviceStatuses).filter(s => s.status === 'healthy').length;
    const totalCount = Object.keys(serviceStatuses).length;
    const allHealthy = healthyCount === totalCount && totalCount > 0;
    const criticalServices = Object.values(serviceStatuses).filter(s => s.critical);
    const criticalHealthy = criticalServices.every(s => s.status === 'healthy');

    return {
        // Connection State
        isOnline,
        isConnected,
        isChecking,
        error,

        // Service Statuses
        serviceStatuses,
        lastCheck,

        // Statistics
        healthyCount,
        totalCount,
        allHealthy,
        criticalHealthy,

        // Reconnection
        reconnectAttempts,
        maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,

        // Actions
        refresh,
        forceReconnect,
        startMonitoring,
        stopMonitoring,
        checkServiceHealth,
    };
}

// ============================================
// Simplified Hook for Single Service
// ============================================

export function useServiceHealth(serviceKey) {
    const [status, setStatus] = useState(null);
    const [isChecking, setIsChecking] = useState(false);

    const checkHealth = useCallback(async () => {
        const service = SERVICES[serviceKey];
        if (!service) return null;

        setIsChecking(true);
        const url = `${GATEWAY_URL}${service.endpoint}`;
        const startTime = Date.now();

        try {
            const response = await fetch(url, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });

            const result = {
                status: response.ok ? 'healthy' : 'unhealthy',
                latency: Date.now() - startTime,
                lastCheck: new Date().toISOString(),
            };

            setStatus(result);
            setIsChecking(false);
            return result;
        } catch (error) {
            const result = {
                status: 'offline',
                error: error.message,
                lastCheck: new Date().toISOString(),
            };

            setStatus(result);
            setIsChecking(false);
            return result;
        }
    }, [serviceKey]);

    useEffect(() => {
        checkHealth();
        const interval = setInterval(checkHealth, HEALTH_CHECK_INTERVAL);
        return () => clearInterval(interval);
    }, [checkHealth]);

    return {
        ...status,
        isChecking,
        refresh: checkHealth,
    };
}

// ============================================
// Export
// ============================================

export default useConnectionMonitor;
