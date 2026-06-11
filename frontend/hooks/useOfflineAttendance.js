/**
 * خطاف الحضور بدون اتصال - useOfflineAttendance
 * يدعم: تسجيل الحضور/الانصراف مع GPS + صورة، عرض السجلات
 * الأولوية: قصوى (priority: 1) - بيانات حساسة زمنياً
 *
 * النمط: offline-first
 * - التسجيل يتم محلياً فوراً ثم يُزامن عند الاتصال
 * - السجلات تُقرأ من IndexedDB أولاً
 * - يُخزّن وقت التسجيل الفعلي (وقت الجهاز) وليس وقت المزامنة
 *
 * @module hooks/useOfflineAttendance
 * @version 1.0.0
 */

import { useState, useCallback, useMemo } from 'react';
import { useOfflineData } from './useOfflineData';
import { offlineWrite } from '../lib/offlineDataLayer';
import { useNetworkStatus } from '../context/NetworkStatusContext';

// ═══════════════════════════════════════════════════════════
// ثوابت - Constants
// ═══════════════════════════════════════════════════════════

/** أولوية الحضور: الأعلى (حرجة زمنياً) */
const ATTENDANCE_PRIORITY = 1;

/** اسم الكيان في IndexedDB */
const ENTITY_NAME = 'attendances';

/** المصدر: تطبيق الويب */
const SOURCE_WEB = 'Web';

// ═══════════════════════════════════════════════════════════
// حالات الحضور - Attendance Statuses
// ═══════════════════════════════════════════════════════════

const AttendanceStatus = {
    /** لم يسجل حضور بعد */
    NOT_CHECKED_IN: 'not_checked_in',
    /** سجّل حضور ولم يسجل انصراف */
    CHECKED_IN: 'checked_in',
    /** سجّل حضور وانصراف */
    CHECKED_OUT: 'checked_out',
    /** تأخير في الحضور */
    LATE: 'late',
};

// ═══════════════════════════════════════════════════════════
// دالة مساعدة: تنسيق التاريخ
// ═══════════════════════════════════════════════════════════

/** الحصول على تاريخ اليوم بصيغة YYYY-MM-DD */
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

/** الحصول على الوقت الحالي بصيغة HH:mm:ss */
function getCurrentTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

/** تنسيق الوقت للعرض (HH:mm) */
function formatTimeDisplay(timeStr) {
    if (!timeStr) return '--:--';
    return timeStr.substring(0, 5);
}

// ═══════════════════════════════════════════════════════════
// الخطاف الرئيسي - useOfflineAttendance
// ═══════════════════════════════════════════════════════════

/**
 * خطاف الحضور بدون اتصال
 * يوفر تسجيل حضور/انصراف offline-first مع GPS وصورة
 *
 * @param {number} employeeId - معرّف الموظف
 * @returns {object} كائن يحتوي على البيانات ودوال التسجيل
 */
export function useOfflineAttendance(employeeId) {
    // ── حالة العمليات الجارية ──────────────────────────────
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [operationError, setOperationError] = useState(null);

    // ── حالة الاتصال ──────────────────────────────────────
    const { isOnline, forceSync } = useNetworkStatus();

    // ── الخطاف الأساسي للبيانات ──────────────────────────────
    const {
        data: records,
        isLoading,
        error: dataError,
        isStale,
        refresh,
    } = useOfflineData(ENTITY_NAME, {
        filters: employeeId ? { employeeId: Number(employeeId) } : null,
        enabled: !!employeeId,
        autoRefresh: true,
        refreshInterval: 2 * 60 * 1000, // تحديث كل دقيقتين
        priority: ATTENDANCE_PRIORITY,
    });

    // ── حالة اليوم الحالي ──────────────────────────────────
    const todayRecord = useMemo(() => {
        const today = getTodayDate();
        return records.find(r => r.date === today && r.employeeId === Number(employeeId)) || null;
    }, [records, employeeId]);

    /**
     * الحصول على حالة اليوم الحالي
     * @returns {object} حالة الحضور اليوم
     */
    const getTodayStatus = useCallback(() => {
        if (!todayRecord) {
            return {
                status: AttendanceStatus.NOT_CHECKED_IN,
                checkInTime: null,
                checkOutTime: null,
                isCheckedIn: false,
                isCheckedOut: false,
                source: null,
                displayCheckIn: '--:--',
                displayCheckOut: '--:--',
            };
        }

        const isCheckedIn = !!todayRecord.checkInTime;
        const isCheckedOut = !!todayRecord.checkOutTime;

        let status = AttendanceStatus.NOT_CHECKED_IN;
        if (isCheckedIn && isCheckedOut) {
            status = AttendanceStatus.CHECKED_OUT;
        } else if (isCheckedIn) {
            status = todayRecord.status === 'late'
                ? AttendanceStatus.LATE
                : AttendanceStatus.CHECKED_IN;
        }

        return {
            status,
            checkInTime: todayRecord.checkInTime,
            checkOutTime: todayRecord.checkOutTime,
            isCheckedIn,
            isCheckedOut,
            source: todayRecord.source,
            displayCheckIn: formatTimeDisplay(todayRecord.checkInTime),
            displayCheckOut: formatTimeDisplay(todayRecord.checkOutTime),
            isLocal: todayRecord._isLocal || false,
        };
    }, [todayRecord]);

    // ── تسجيل الحضور ───────────────────────────────────────

    /**
     * تسجيل حضور الموظف
     * يُحفظ محلياً فوراً مع بيانات GPS والصورة، ثم يُزامن عند الاتصال
     *
     * @param {object} checkInData - بيانات تسجيل الحضور
     * @param {number} [checkInData.latitude] - خط العرض (GPS)
     * @param {number} [checkInData.longitude] - خط الطول (GPS)
     * @param {string} [checkInData.selfieBase64] - صورة السيلفي (base64)
     * @param {boolean} [checkInData.isInsideGeofence] - هل داخل النطاق الجغرافي؟
     * @param {string} [checkInData.fieldWorkReason] - سبب العمل الميداني
     * @returns {Promise<{success: boolean, time: string, isLocal: boolean}>}
     */
    const checkIn = useCallback(async (checkInData = {}) => {
        if (!employeeId) {
            throw new Error('معرّف الموظف مطلوب لتسجيل الحضور');
        }

        // التحقق: هل سبق تسجيل الحضور اليوم؟
        const today = getTodayStatus();
        if (today.isCheckedIn) {
            throw new Error('تم تسجيل الحضور مسبقاً اليوم');
        }

        setIsCheckingIn(true);
        setOperationError(null);

        try {
            const now = new Date();
            const checkInTime = getCurrentTime();
            const date = getTodayDate();

            // بناء بيانات سجل الحضور
            const attendanceRecord = {
                employeeId: Number(employeeId),
                date,
                checkInTime,
                checkOutTime: null,
                source: SOURCE_WEB,
                checkInLatitude: checkInData.latitude || null,
                checkInLongitude: checkInData.longitude || null,
                checkOutLatitude: null,
                checkOutLongitude: null,
                selfieBase64: checkInData.selfieBase64 || null,
                isInsideGeofence: checkInData.isInsideGeofence ?? null,
                fieldWorkReason: checkInData.fieldWorkReason || null,
                status: now.getHours() >= 9 ? 'late' : 'present',
                clientTimestamp: now.toISOString(),
            };

            // الكتابة في IndexedDB + طابور المزامنة بأعلى أولوية
            await offlineWrite(ENTITY_NAME, 'create', attendanceRecord, ATTENDANCE_PRIORITY);

            // محاولة المزامنة الفورية إذا متصل
            if (isOnline) {
                forceSync();
            }

            // إعادة تحميل البيانات المحلية
            await refresh();

            return {
                success: true,
                time: checkInTime,
                isLocal: true,
                message: isOnline
                    ? 'تم تسجيل الحضور بنجاح'
                    : 'تم تسجيل الحضور محلياً - سيتم المزامنة عند عودة الاتصال',
            };
        } catch (err) {
            console.warn('[useOfflineAttendance] خطأ في تسجيل الحضور:', err);
            const errorMsg = err.message || 'فشل في تسجيل الحضور';
            setOperationError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setIsCheckingIn(false);
        }
    }, [employeeId, isOnline, forceSync, refresh, getTodayStatus]);

    // ── تسجيل الانصراف ──────────────────────────────────────

    /**
     * تسجيل انصراف الموظف
     * يُحدّث السجل المحلي فوراً ثم يُزامن عند الاتصال
     *
     * @param {object} checkOutData - بيانات تسجيل الانصراف
     * @param {number} [checkOutData.latitude] - خط العرض (GPS)
     * @param {number} [checkOutData.longitude] - خط الطول (GPS)
     * @param {string} [checkOutData.selfieBase64] - صورة السيلفي (base64)
     * @returns {Promise<{success: boolean, time: string, isLocal: boolean}>}
     */
    const checkOut = useCallback(async (checkOutData = {}) => {
        if (!employeeId) {
            throw new Error('معرّف الموظف مطلوب لتسجيل الانصراف');
        }

        // التحقق: هل تم تسجيل الحضور أولاً؟
        const today = getTodayStatus();
        if (!today.isCheckedIn) {
            throw new Error('لم يتم تسجيل الحضور اليوم بعد');
        }

        if (today.isCheckedOut) {
            throw new Error('تم تسجيل الانصراف مسبقاً اليوم');
        }

        setIsCheckingOut(true);
        setOperationError(null);

        try {
            const checkOutTime = getCurrentTime();

            // بيانات تحديث الانصراف
            const updateData = {
                id: todayRecord.id,
                employeeId: Number(employeeId),
                checkOutTime,
                checkOutLatitude: checkOutData.latitude || null,
                checkOutLongitude: checkOutData.longitude || null,
                status: 'checked_out',
                clientTimestamp: new Date().toISOString(),
            };

            // الكتابة في IndexedDB + طابور المزامنة بأعلى أولوية
            await offlineWrite(ENTITY_NAME, 'update', updateData, ATTENDANCE_PRIORITY);

            // محاولة المزامنة الفورية إذا متصل
            if (isOnline) {
                forceSync();
            }

            // إعادة تحميل البيانات المحلية
            await refresh();

            return {
                success: true,
                time: checkOutTime,
                isLocal: true,
                message: isOnline
                    ? 'تم تسجيل الانصراف بنجاح'
                    : 'تم تسجيل الانصراف محلياً - سيتم المزامنة عند عودة الاتصال',
            };
        } catch (err) {
            console.warn('[useOfflineAttendance] خطأ في تسجيل الانصراف:', err);
            const errorMsg = err.message || 'فشل في تسجيل الانصراف';
            setOperationError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setIsCheckingOut(false);
        }
    }, [employeeId, isOnline, forceSync, refresh, getTodayStatus, todayRecord]);

    // ── جلب سجلات الشهر ─────────────────────────────────────

    /**
     * جلب سجلات الحضور لشهر محدد
     * تُقرأ من IndexedDB أولاً مع تحديث من الخادم في الخلفية
     *
     * @param {number} [month] - رقم الشهر (1-12)، الافتراضي: الشهر الحالي
     * @param {number} [year] - السنة، الافتراضي: السنة الحالية
     * @returns {Array} سجلات الحضور للشهر المحدد
     */
    const getMonthRecords = useCallback((month, year) => {
        const now = new Date();
        const targetMonth = month || (now.getMonth() + 1);
        const targetYear = year || now.getFullYear();

        // بناء بداية ونهاية الشهر
        const monthStr = String(targetMonth).padStart(2, '0');
        const startDate = `${targetYear}-${monthStr}-01`;
        const endDate = `${targetYear}-${monthStr}-31`;

        return records.filter(r => {
            if (r.employeeId !== Number(employeeId)) return false;
            return r.date >= startDate && r.date <= endDate;
        }).sort((a, b) => a.date.localeCompare(b.date));
    }, [records, employeeId]);

    // ── إحصائيات الشهر الحالي ────────────────────────────────

    /**
     * حساب إحصائيات الحضور للشهر الحالي
     * @returns {object} إحصائيات الحضور
     */
    const getMonthStats = useCallback(() => {
        const monthRecords = getMonthRecords();

        const stats = {
            totalDays: monthRecords.length,
            presentDays: 0,
            lateDays: 0,
            absentDays: 0,
            workingHours: 0,
        };

        for (const record of monthRecords) {
            if (record.status === 'present' || record.status === 'checked_out') {
                stats.presentDays++;
            } else if (record.status === 'late') {
                stats.lateDays++;
            } else if (record.status === 'absent') {
                stats.absentDays++;
            }

            // حساب ساعات العمل إذا كان هناك حضور وانصراف
            if (record.checkInTime && record.checkOutTime) {
                const [inH, inM] = record.checkInTime.split(':').map(Number);
                const [outH, outM] = record.checkOutTime.split(':').map(Number);
                const hours = (outH * 60 + outM - inH * 60 - inM) / 60;
                if (hours > 0) {
                    stats.workingHours += hours;
                }
            }
        }

        stats.workingHours = Math.round(stats.workingHours * 10) / 10;

        return stats;
    }, [getMonthRecords]);

    // ── الخطأ المجمّع ───────────────────────────────────────
    const error = operationError || dataError;

    return {
        /** جميع سجلات الحضور للموظف */
        records,
        /** حالة التحميل */
        isLoading,
        /** رسالة الخطأ */
        error,
        /** هل البيانات قديمة؟ */
        isStale,
        /** هل الجهاز غير متصل؟ */
        isOffline: !isOnline,

        /** سجل الحضور لليوم الحالي */
        todayRecord,
        /** حالة اليوم الحالي */
        todayStatus: getTodayStatus(),

        /** تسجيل الحضور */
        checkIn,
        /** تسجيل الانصراف */
        checkOut,
        /** هل جاري تسجيل الحضور؟ */
        isCheckingIn,
        /** هل جاري تسجيل الانصراف؟ */
        isCheckingOut,

        /** جلب سجلات شهر محدد */
        getMonthRecords,
        /** إحصائيات الشهر الحالي */
        monthStats: getMonthStats(),

        /** إعادة تحميل البيانات */
        refresh,
    };
}

export default useOfflineAttendance;
