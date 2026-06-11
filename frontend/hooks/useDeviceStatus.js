/**
 * useDeviceStatus - Hook مشترك لجلب حالة أجهزة البصمة
 * يُستخدم في DeviceStatusBanner (مع polling) وصفحة الإعدادات
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export default function useDeviceStatus(pollInterval = 0) {
    const [devices, setDevices] = useState([]);
    const [stats, setStats] = useState({ total: 0, online: 0, offline: 0, todayRecords: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // تتبع الأجهزة التي كانت غير متصلة سابقاً (لكشف الانقطاع الجديد)
    const previousOfflineIdsRef = useRef(new Set());
    const [newlyOfflineDevices, setNewlyOfflineDevices] = useState([]);

    const fetchStatus = useCallback(async () => {
        try {
            const response = await fetch('/api/hr/attendance/devices?action=list');
            const data = await response.json();

            if (data.success && data.devices) {
                const deviceList = data.devices;
                setDevices(deviceList);

                const active = deviceList.filter(d => d.isActive !== false);
                const onlineCount = active.filter(d => d.isOnline).length;
                const offlineCount = active.filter(d => !d.isOnline).length;
                const records = deviceList.reduce((sum, d) => sum + (d.todayRecords || 0), 0);

                setStats({ total: active.length, online: onlineCount, offline: offlineCount, todayRecords: records });

                // كشف الأجهزة المنقطعة حديثاً
                const currentOfflineIds = new Set(active.filter(d => !d.isOnline).map(d => d.id));
                const previousIds = previousOfflineIdsRef.current;

                const newOffline = active.filter(
                    d => !d.isOnline && !previousIds.has(d.id)
                );

                if (newOffline.length > 0) {
                    setNewlyOfflineDevices(newOffline);
                } else {
                    setNewlyOfflineDevices([]);
                }

                previousOfflineIdsRef.current = currentOfflineIds;
                setError(null);
            }
        } catch (err) {
            setError(err?.message || 'فشل جلب حالة الأجهزة');
        } finally {
            setLoading(false);
        }
    }, []);

    // جلب أولي
    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // polling دوري
    useEffect(() => {
        if (!pollInterval || pollInterval <= 0) return;

        const interval = setInterval(fetchStatus, pollInterval);
        return () => clearInterval(interval);
    }, [pollInterval, fetchStatus]);

    return {
        devices,
        stats,
        loading,
        error,
        newlyOfflineDevices,
        refetch: fetchStatus,
    };
}
