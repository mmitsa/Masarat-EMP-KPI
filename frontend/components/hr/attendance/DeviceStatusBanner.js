/**
 * DeviceStatusBanner - بانر حالة اتصال أجهزة البصمة
 * يظهر دائماً أعلى صفحة الحضور والانصراف
 * يعرض عدد الأجهزة المتصلة/المنقطعة مع إشعارات تلقائية
 */

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePermission } from '../../PermissionGuard';
import useDeviceStatus from '../../../hooks/useDeviceStatus';
import { useNotifications } from '../../../hooks/useNotifications';

export default function DeviceStatusBanner({ darkMode }) {
    const { stats, devices, loading, newlyOfflineDevices } = useDeviceStatus(60000);
    const canManageDevices = usePermission('hr_devices_manage');
    const notifiedRef = useRef(new Set());

    // إشعارات - جلب الدالة
    let notifyDeviceOffline = null;
    try {
        const notifications = useNotifications();
        notifyDeviceOffline = notifications?.notifyDeviceOffline;
    } catch {
        // useNotifications غير متوفر
    }

    // إرسال إشعارات عند اكتشاف أجهزة منقطعة حديثاً
    useEffect(() => {
        if (!notifyDeviceOffline || !newlyOfflineDevices?.length) return;

        newlyOfflineDevices.forEach(device => {
            if (!notifiedRef.current.has(device.id)) {
                notifiedRef.current.add(device.id);
                notifyDeviceOffline(device.id, device.deviceName, device.location);
            }
        });
    }, [newlyOfflineDevices, notifyDeviceOffline]);

    // إزالة الأجهزة التي عادت للاتصال من قائمة الإشعارات المرسلة
    useEffect(() => {
        if (!devices.length) return;
        const onlineIds = new Set(devices.filter(d => d.isOnline).map(d => d.id));
        onlineIds.forEach(id => notifiedRef.current.delete(id));
    }, [devices]);

    // Loading
    if (loading) {
        return (
            <div className={`mb-4 rounded-lg border p-3 ${
                darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        جاري فحص أجهزة البصمة...
                    </span>
                </div>
            </div>
        );
    }

    // لا توجد أجهزة مسجلة
    if (stats.total === 0) return null;

    const hasOffline = stats.offline > 0;
    const offlineDevices = devices.filter(d => d.isActive !== false && !d.isOnline);

    return (
        <div className={`mb-4 rounded-lg border p-3 transition-colors ${
            hasOffline
                ? darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
        }`}>
            <div className="flex items-center justify-between gap-4">
                {/* الحالة الرئيسية */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* نقطة الحالة */}
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        hasOffline
                            ? 'bg-red-500 animate-pulse'
                            : 'bg-green-500'
                    }`} />

                    <div className="flex flex-col min-w-0">
                        {/* السطر الأول */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {hasOffline ? (
                                <span className={`text-sm font-medium ${
                                    darkMode ? 'text-red-300' : 'text-red-700 dark:text-red-300'
                                }`}>
                                    {stats.offline} جهاز غير متصل من أصل {stats.total}
                                </span>
                            ) : (
                                <span className={`text-sm font-medium ${
                                    darkMode ? 'text-green-300' : 'text-green-700 dark:text-green-300'
                                }`}>
                                    جميع أجهزة البصمة متصلة ({stats.total} {stats.total > 2 ? 'أجهزة' : stats.total === 2 ? 'جهازين' : 'جهاز'})
                                </span>
                            )}

                            {/* إحصائيات مصغرة */}
                            <div className="flex items-center gap-2 text-xs">
                                <span className={`flex items-center gap-1 ${darkMode ? 'text-green-400' : 'text-green-600 dark:text-green-400'}`}>
                                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                                    {stats.online} متصل
                                </span>
                                {hasOffline && (
                                    <span className={`flex items-center gap-1 ${darkMode ? 'text-red-400' : 'text-red-600 dark:text-red-400'}`}>
                                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                                        {stats.offline} منقطع
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* أسماء الأجهزة المنقطعة */}
                        {hasOffline && offlineDevices.length > 0 && (
                            <p className={`text-xs mt-1 truncate ${
                                darkMode ? 'text-red-400/80' : 'text-red-600/80'
                            }`}>
                                الأجهزة المنقطعة: {offlineDevices.map(d => d.deviceName).join('، ')}
                            </p>
                        )}
                    </div>
                </div>

                {/* رابط إدارة الأجهزة - فقط لأصحاب الصلاحية */}
                {canManageDevices && (
                    <Link
                        href="/hr/settings?tab=devices"
                        className={`text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                            darkMode
                                ? 'text-blue-400 hover:text-blue-300'
                                : 'text-blue-600 dark:text-blue-400 hover:text-blue-800'
                        }`}
                    >
                        إدارة الأجهزة ←
                    </Link>
                )}
            </div>
        </div>
    );
}
