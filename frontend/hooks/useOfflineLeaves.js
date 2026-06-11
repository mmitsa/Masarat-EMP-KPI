/**
 * خطاف الإجازات بدون اتصال - useOfflineLeaves
 * عرض من cache، تقديم طلب → pendingOps
 *
 * النمط: offline-first
 * - طلبات الإجازة تُقرأ من IndexedDB أولاً
 * - تقديم طلب جديد يُحفظ محلياً فوراً بحالة "مسودة محلية"
 * - يُزامن مع الخادم عند الاتصال ويتحول لـ "قيد المراجعة"
 * - رصيد الإجازات يُخزّن محلياً ويُحدّث من الخادم
 *
 * @module hooks/useOfflineLeaves
 * @version 1.0.0
 */

import { useState, useCallback, useMemo } from 'react';
import { useOfflineData } from './useOfflineData';
import { offlineWrite } from '../lib/offlineDataLayer';
import { useNetworkStatus } from '../context/NetworkStatusContext';

// ═══════════════════════════════════════════════════════════
// ثوابت - Constants
// ═══════════════════════════════════════════════════════════

/** اسم الكيان في IndexedDB */
const ENTITY_NAME = 'leaveRequests';

/** أولوية المزامنة: طلبات الإجازات */
const LEAVE_PRIORITY = 3;

/** حالات طلبات الإجازة */
const LeaveStatus = {
    /** مسودة محلية (لم تُزامن بعد) */
    LOCAL_DRAFT: 'local_draft',
    /** قيد المراجعة */
    PENDING: 'pending',
    /** معتمدة من المدير المباشر */
    APPROVED_BY_MANAGER: 'approved_by_manager',
    /** معتمدة نهائياً */
    APPROVED: 'approved',
    /** مرفوضة */
    REJECTED: 'rejected',
    /** ملغاة */
    CANCELLED: 'cancelled',
};

/** أنواع الإجازات */
const LeaveTypes = {
    ANNUAL: 'annual',
    SICK: 'sick',
    EMERGENCY: 'emergency',
    UNPAID: 'unpaid',
    MATERNITY: 'maternity',
    BEREAVEMENT: 'bereavement',
    HAJJ: 'hajj',
};

/** أسماء أنواع الإجازات بالعربي */
const LeaveTypeLabels = {
    [LeaveTypes.ANNUAL]: 'سنوية',
    [LeaveTypes.SICK]: 'مرضية',
    [LeaveTypes.EMERGENCY]: 'اضطرارية',
    [LeaveTypes.UNPAID]: 'بدون راتب',
    [LeaveTypes.MATERNITY]: 'أمومة',
    [LeaveTypes.BEREAVEMENT]: 'وفاة',
    [LeaveTypes.HAJJ]: 'حج',
};

/** أسماء حالات الطلب بالعربي */
const StatusLabels = {
    [LeaveStatus.LOCAL_DRAFT]: 'مسودة محلية',
    [LeaveStatus.PENDING]: 'قيد المراجعة',
    [LeaveStatus.APPROVED_BY_MANAGER]: 'معتمد من المدير',
    [LeaveStatus.APPROVED]: 'معتمد',
    [LeaveStatus.REJECTED]: 'مرفوض',
    [LeaveStatus.CANCELLED]: 'ملغى',
};

// ═══════════════════════════════════════════════════════════
// دوال مساعدة
// ═══════════════════════════════════════════════════════════

/**
 * حساب عدد أيام الإجازة بين تاريخين
 * يستثني أيام الجمعة والسبت (عطلة نهاية الأسبوع)
 */
function calculateLeaveDays(startDate, endDate) {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    let days = 0;

    const current = new Date(start);
    while (current <= end) {
        const dayOfWeek = current.getDay();
        // استثناء الجمعة (5) والسبت (6)
        if (dayOfWeek !== 5 && dayOfWeek !== 6) {
            days++;
        }
        current.setDate(current.getDate() + 1);
    }

    return days;
}

// ═══════════════════════════════════════════════════════════
// الخطاف الرئيسي - useOfflineLeaves
// ═══════════════════════════════════════════════════════════

/**
 * خطاف الإجازات بدون اتصال
 * يوفر عرض وتقديم طلبات الإجازة بنمط offline-first
 *
 * @param {number} employeeId - معرّف الموظف
 * @returns {object} كائن يحتوي على طلبات الإجازة ودوال التقديم
 */
export function useOfflineLeaves(employeeId) {
    // ── حالة العمليات ──────────────────────────────────────
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // ── حالة الاتصال ──────────────────────────────────────
    const { isOnline, forceSync } = useNetworkStatus();

    // ── الخطاف الأساسي ──────────────────────────────────────
    const {
        data: allRequests,
        isLoading,
        error: dataError,
        isStale,
        refresh,
    } = useOfflineData(ENTITY_NAME, {
        filters: employeeId ? { employeeId: Number(employeeId) } : null,
        enabled: !!employeeId,
        autoRefresh: true,
        refreshInterval: 5 * 60 * 1000, // تحديث كل 5 دقائق
        priority: LEAVE_PRIORITY,
    });

    // ── تصنيف الطلبات ──────────────────────────────────────

    /** الطلبات المعلقة (قيد المراجعة أو مسودات محلية) */
    const pendingRequests = useMemo(() => {
        return allRequests
            .filter(r => r.status === LeaveStatus.PENDING || r.status === LeaveStatus.LOCAL_DRAFT || r.status === LeaveStatus.APPROVED_BY_MANAGER)
            .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
    }, [allRequests]);

    /** الطلبات المعتمدة */
    const approvedRequests = useMemo(() => {
        return allRequests
            .filter(r => r.status === LeaveStatus.APPROVED)
            .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
    }, [allRequests]);

    /** الطلبات المرفوضة */
    const rejectedRequests = useMemo(() => {
        return allRequests
            .filter(r => r.status === LeaveStatus.REJECTED)
            .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
    }, [allRequests]);

    /** المسودات المحلية (لم تُزامن بعد) */
    const localDrafts = useMemo(() => {
        return allRequests.filter(r => r.status === LeaveStatus.LOCAL_DRAFT || r._isLocal);
    }, [allRequests]);

    // ── تقديم طلب إجازة ────────────────────────────────────

    /**
     * تقديم طلب إجازة جديد
     * يُحفظ محلياً فوراً كمسودة ثم يُزامن مع الخادم
     *
     * @param {object} requestData - بيانات طلب الإجازة
     * @param {string} requestData.leaveType - نوع الإجازة
     * @param {string} requestData.startDate - تاريخ البداية (YYYY-MM-DD)
     * @param {string} requestData.endDate - تاريخ النهاية (YYYY-MM-DD)
     * @param {string} [requestData.reason] - سبب الإجازة
     * @param {string} [requestData.attachmentBase64] - مرفق (base64)
     * @returns {Promise<{success: boolean, isLocal: boolean, days: number}>}
     */
    const submitRequest = useCallback(async (requestData) => {
        if (!employeeId) {
            throw new Error('معرّف الموظف مطلوب لتقديم طلب إجازة');
        }

        // التحقق من البيانات المطلوبة
        if (!requestData.leaveType) {
            throw new Error('يرجى تحديد نوع الإجازة');
        }
        if (!requestData.startDate) {
            throw new Error('يرجى تحديد تاريخ البداية');
        }
        if (!requestData.endDate) {
            throw new Error('يرجى تحديد تاريخ النهاية');
        }

        // التحقق من أن تاريخ النهاية بعد البداية
        if (requestData.endDate < requestData.startDate) {
            throw new Error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const days = calculateLeaveDays(requestData.startDate, requestData.endDate);

            // بناء بيانات الطلب
            const leaveRequest = {
                employeeId: Number(employeeId),
                leaveType: requestData.leaveType,
                startDate: requestData.startDate,
                endDate: requestData.endDate,
                reason: requestData.reason || '',
                attachmentBase64: requestData.attachmentBase64 || null,
                days,
                status: isOnline ? LeaveStatus.PENDING : LeaveStatus.LOCAL_DRAFT,
                clientTimestamp: new Date().toISOString(),
            };

            // الكتابة في IndexedDB + طابور المزامنة
            await offlineWrite(ENTITY_NAME, 'create', leaveRequest, LEAVE_PRIORITY);

            // محاولة المزامنة الفورية
            if (isOnline) {
                forceSync();
            }

            // إعادة تحميل البيانات
            await refresh();

            return {
                success: true,
                isLocal: !isOnline,
                days,
                message: isOnline
                    ? 'تم تقديم طلب الإجازة بنجاح'
                    : 'تم حفظ طلب الإجازة محلياً - سيتم إرساله عند عودة الاتصال',
            };
        } catch (err) {
            console.warn('[useOfflineLeaves] خطأ في تقديم طلب الإجازة:', err);
            const errorMsg = err.message || 'فشل في تقديم طلب الإجازة';
            setSubmitError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    }, [employeeId, isOnline, forceSync, refresh]);

    // ── إلغاء طلب إجازة ────────────────────────────────────

    /**
     * إلغاء طلب إجازة معلق
     * يُحدّث محلياً فوراً ثم يُزامن
     *
     * @param {number|string} requestId - معرّف الطلب
     * @returns {Promise<{success: boolean}>}
     */
    const cancelRequest = useCallback(async (requestId) => {
        if (!requestId) {
            throw new Error('معرّف الطلب مطلوب');
        }

        try {
            const request = allRequests.find(r => r.id === requestId);
            if (!request) {
                throw new Error('الطلب غير موجود');
            }

            // التحقق من إمكانية الإلغاء
            if (request.status === LeaveStatus.APPROVED || request.status === LeaveStatus.REJECTED) {
                throw new Error('لا يمكن إلغاء طلب معتمد أو مرفوض');
            }

            await offlineWrite(ENTITY_NAME, 'update', {
                id: requestId,
                status: LeaveStatus.CANCELLED,
                cancelledAt: new Date().toISOString(),
            }, LEAVE_PRIORITY);

            if (isOnline) {
                forceSync();
            }

            await refresh();

            return { success: true, message: 'تم إلغاء الطلب بنجاح' };
        } catch (err) {
            console.warn('[useOfflineLeaves] خطأ في إلغاء الطلب:', err);
            throw err;
        }
    }, [allRequests, isOnline, forceSync, refresh]);

    // ── رصيد الإجازات ───────────────────────────────────────

    /**
     * حساب رصيد الإجازات المتبقي (تقديري من البيانات المحلية)
     * ملاحظة: الرصيد الدقيق يأتي من الخادم عند المزامنة
     *
     * @returns {object} رصيد الإجازات التقديري
     */
    const getBalance = useCallback(() => {
        // حساب الأيام المستخدمة من الطلبات المعتمدة والمعلقة
        const currentYear = new Date().getFullYear();
        const usedDays = {};

        for (const request of allRequests) {
            // تجاهل الملغاة والمرفوضة
            if (request.status === LeaveStatus.CANCELLED || request.status === LeaveStatus.REJECTED) {
                continue;
            }

            // فقط طلبات السنة الحالية
            if (request.startDate && request.startDate.startsWith(String(currentYear))) {
                const type = request.leaveType || 'unknown';
                const days = request.days || calculateLeaveDays(request.startDate, request.endDate);
                usedDays[type] = (usedDays[type] || 0) + days;
            }
        }

        return {
            /** الأيام المستخدمة حسب النوع */
            usedByType: usedDays,
            /** إجمالي الأيام السنوية المستخدمة */
            annualUsed: usedDays[LeaveTypes.ANNUAL] || 0,
            /** إجمالي المرضية المستخدمة */
            sickUsed: usedDays[LeaveTypes.SICK] || 0,
            /** إجمالي الاضطرارية المستخدمة */
            emergencyUsed: usedDays[LeaveTypes.EMERGENCY] || 0,
            /** ملاحظة: الأرصدة الكاملة تأتي من الخادم */
            isEstimate: true,
            lastUpdated: new Date().toISOString(),
        };
    }, [allRequests]);

    // ── إحصائيات سريعة ──────────────────────────────────────

    const stats = useMemo(() => ({
        total: allRequests.length,
        pending: pendingRequests.length,
        approved: approvedRequests.length,
        rejected: rejectedRequests.length,
        localDrafts: localDrafts.length,
    }), [allRequests, pendingRequests, approvedRequests, rejectedRequests, localDrafts]);

    // ── الخطأ المجمّع ───────────────────────────────────────
    const error = submitError || dataError;

    return {
        /** جميع طلبات الإجازة */
        requests: allRequests,
        /** الطلبات المعلقة */
        pendingRequests,
        /** الطلبات المعتمدة */
        approvedRequests,
        /** الطلبات المرفوضة */
        rejectedRequests,
        /** المسودات المحلية */
        localDrafts,

        /** حالة التحميل */
        isLoading,
        /** رسالة الخطأ */
        error,
        /** هل البيانات قديمة؟ */
        isStale,
        /** هل الجهاز غير متصل؟ */
        isOffline: !isOnline,

        /** تقديم طلب إجازة */
        submitRequest,
        /** إلغاء طلب إجازة */
        cancelRequest,
        /** هل جاري التقديم؟ */
        isSubmitting,

        /** رصيد الإجازات (تقديري) */
        balance: getBalance(),

        /** إحصائيات الطلبات */
        stats,

        /** إعادة تحميل البيانات */
        refresh,

        /** ثوابت: أنواع الإجازات */
        LeaveTypes,
        /** ثوابت: أسماء الأنواع بالعربي */
        LeaveTypeLabels,
        /** ثوابت: حالات الطلب */
        LeaveStatus,
        /** ثوابت: أسماء الحالات بالعربي */
        StatusLabels,
    };
}

export default useOfflineLeaves;
