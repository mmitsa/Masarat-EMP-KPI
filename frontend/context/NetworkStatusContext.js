/**
 * سياق حالة الاتصال - Network Status Context
 * يوفر معلومات حالة الاتصال والمزامنة لجميع المكونات
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { syncEngine, SyncStatus } from '../lib/syncEngine';
import { getPendingOps } from '../lib/offlineDb';

const NetworkStatusContext = createContext(null);

export function NetworkStatusProvider({ children }) {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    const [syncStatus, setSyncStatus] = useState(SyncStatus.IDLE);
    const [lastSyncAt, setLastSyncAt] = useState(null);
    const [pendingOpsCount, setPendingOpsCount] = useState(0);

    useEffect(() => {
        // مراقبة حالة الاتصال
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // الاشتراك في أحداث محرك المزامنة
        const unsubscribe = syncEngine.subscribe((state) => {
            setSyncStatus(state.status);
            setLastSyncAt(state.lastSyncAt);
            setPendingOpsCount(state.pendingCount);
            setIsOnline(state.isOnline);
        });

        // بدء محرك المزامنة
        syncEngine.start();

        // تحميل عدد العمليات المعلقة
        getPendingOps().then(ops => setPendingOpsCount(ops.length));

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            unsubscribe();
            syncEngine.stop();
        };
    }, []);

    const forceSync = useCallback(async () => {
        await syncEngine.sync();
    }, []);

    const value = {
        isOnline,
        syncStatus,
        lastSyncAt,
        pendingOpsCount,
        forceSync,
    };

    return (
        <NetworkStatusContext.Provider value={value}>
            {children}
        </NetworkStatusContext.Provider>
    );
}

export function useNetworkStatus() {
    const context = useContext(NetworkStatusContext);
    if (!context) {
        // Return safe defaults when outside provider
        return {
            isOnline: true,
            syncStatus: SyncStatus.IDLE,
            lastSyncAt: null,
            pendingOpsCount: 0,
            forceSync: async () => {},
        };
    }
    return context;
}

export default NetworkStatusContext;
