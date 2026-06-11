/**
 * خطاف البيانات بدون اتصال - useOfflineData
 * يوفر قراءة/كتابة offline-first لأي كيان
 * القراءة: IndexedDB أولاً → API في الخلفية → تحديث IndexedDB
 * الكتابة: IndexedDB + pendingOps → API عند الاتصال
 *
 * @module hooks/useOfflineData
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNetworkStatus } from '../context/NetworkStatusContext';
import { offlineRead, offlineWrite, pullDelta } from '../lib/offlineDataLayer';
import { getSyncState } from '../lib/offlineDb';

// ═══════════════════════════════════════════════════════════
// ثوابت - Constants
// ═══════════════════════════════════════════════════════════

/** الفاصل الزمني الافتراضي للتحديث التلقائي (5 دقائق) */
const DEFAULT_REFRESH_INTERVAL = 5 * 60 * 1000;

/** الحد الأقصى لعمر البيانات قبل اعتبارها قديمة (10 دقائق) */
const STALE_THRESHOLD_MS = 10 * 60 * 1000;

// ═══════════════════════════════════════════════════════════
// خطاف البيانات العام - useOfflineData
// ═══════════════════════════════════════════════════════════

/**
 * خطاف عام للبيانات بدون اتصال
 * يعمل بنمط offline-first: يقرأ من IndexedDB فوراً ثم يحدّث من الخادم في الخلفية
 *
 * @param {string} entity - نوع الكيان (employees, attendances, leaveRequests, etc.)
 * @param {object} options - خيارات الخطاف
 * @param {object} [options.filters] - فلاتر البحث في IndexedDB (مثال: { employeeId: 123 })
 * @param {boolean} [options.enabled=true] - تفعيل/تعطيل جلب البيانات
 * @param {boolean} [options.autoRefresh=false] - تفعيل التحديث التلقائي الدوري
 * @param {number} [options.refreshInterval] - الفاصل الزمني للتحديث التلقائي (بالمللي ثانية)
 * @param {number} [options.priority=5] - أولوية عمليات الكتابة (1=أعلى، 10=أدنى)
 *
 * @returns {object} كائن يحتوي على البيانات والحالة ودوال التعديل
 */
export function useOfflineData(entity, options = {}) {
    const {
        filters = null,
        enabled = true,
        autoRefresh = false,
        refreshInterval = DEFAULT_REFRESH_INTERVAL,
        priority = 5,
    } = options;

    // ── الحالة ──────────────────────────────────────────
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isStale, setIsStale] = useState(false);
    const [lastFetchedAt, setLastFetchedAt] = useState(null);

    // ── المراجع ──────────────────────────────────────────
    const mountedRef = useRef(true);
    const refreshTimerRef = useRef(null);
    const isFetchingRef = useRef(false);

    // ── حالة الاتصال ──────────────────────────────────────
    const { isOnline, forceSync } = useNetworkStatus();

    // ── تحميل البيانات المحلية ──────────────────────────────
    const loadLocalData = useCallback(async () => {
        try {
            const readOptions = {};
            if (filters) {
                readOptions.filter = filters;
            }

            const result = await offlineRead(entity, readOptions);

            if (mountedRef.current) {
                setData(result.data || []);
                setError(null);
            }

            return result.data || [];
        } catch (err) {
            console.warn(`[useOfflineData] خطأ في قراءة ${entity} من التخزين المحلي:`, err);
            if (mountedRef.current) {
                setError(`فشل قراءة البيانات المحلية: ${err.message}`);
            }
            return [];
        }
    }, [entity, filters]);

    // ── تحديث من الخادم في الخلفية ──────────────────────────
    const refreshFromServer = useCallback(async () => {
        if (!isOnline || isFetchingRef.current) return;

        isFetchingRef.current = true;

        try {
            // سحب التحديثات (Delta) من الخادم
            const deltaResult = await pullDelta(entity);

            // إذا وُجدت تحديثات جديدة، نعيد تحميل البيانات المحلية
            if (deltaResult.itemsCount > 0 && mountedRef.current) {
                await loadLocalData();
            }

            if (mountedRef.current) {
                setLastFetchedAt(new Date());
                setIsStale(false);
                setError(null);
            }
        } catch (err) {
            console.warn(`[useOfflineData] فشل تحديث ${entity} من الخادم:`, err);
            // لا نعرض خطأ عند فشل التحديث الخلفي - البيانات المحلية كافية
        } finally {
            isFetchingRef.current = false;
        }
    }, [entity, isOnline, loadLocalData]);

    // ── دالة التحديث الشاملة ──────────────────────────────
    const refresh = useCallback(async () => {
        if (!mountedRef.current) return;

        setIsLoading(true);

        try {
            // 1. تحميل من IndexedDB فوراً
            await loadLocalData();

            // 2. تحديث من الخادم في الخلفية (إذا متصل)
            if (isOnline) {
                await refreshFromServer();
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [loadLocalData, refreshFromServer, isOnline]);

    // ── عمليات الكتابة (CRUD) ──────────────────────────────

    /**
     * إنشاء سجل جديد (offline-first)
     * يُحفظ محلياً فوراً ويُضاف لطابور المزامنة
     *
     * @param {object} itemData - بيانات السجل الجديد
     * @returns {Promise<{success: boolean, source: string}>}
     */
    const create = useCallback(async (itemData) => {
        try {
            const result = await offlineWrite(entity, 'create', itemData, priority);

            // تحديث الحالة المحلية فوراً (Optimistic Update)
            if (mountedRef.current) {
                setData(prev => [...prev, { ...itemData, id: itemData.id || -Date.now(), _isLocal: true }]);
            }

            // محاولة المزامنة الفورية إذا متصل
            if (isOnline) {
                forceSync();
            }

            return result;
        } catch (err) {
            console.warn(`[useOfflineData] فشل إنشاء ${entity}:`, err);
            if (mountedRef.current) {
                setError(`فشل في حفظ البيانات: ${err.message}`);
            }
            throw err;
        }
    }, [entity, priority, isOnline, forceSync]);

    /**
     * تحديث سجل موجود (offline-first)
     *
     * @param {number|string} id - معرّف السجل
     * @param {object} itemData - البيانات المحدّثة
     * @returns {Promise<{success: boolean, source: string}>}
     */
    const update = useCallback(async (id, itemData) => {
        try {
            const result = await offlineWrite(entity, 'update', { ...itemData, id }, priority);

            // تحديث الحالة المحلية فوراً
            if (mountedRef.current) {
                setData(prev => prev.map(item =>
                    item.id === id ? { ...item, ...itemData, _isLocal: true } : item
                ));
            }

            if (isOnline) {
                forceSync();
            }

            return result;
        } catch (err) {
            console.warn(`[useOfflineData] فشل تحديث ${entity}:`, err);
            if (mountedRef.current) {
                setError(`فشل في تحديث البيانات: ${err.message}`);
            }
            throw err;
        }
    }, [entity, priority, isOnline, forceSync]);

    /**
     * حذف سجل (offline-first)
     *
     * @param {number|string} id - معرّف السجل
     * @returns {Promise<{success: boolean, source: string}>}
     */
    const remove = useCallback(async (id) => {
        try {
            const result = await offlineWrite(entity, 'delete', { id }, priority);

            // حذف من الحالة المحلية فوراً
            if (mountedRef.current) {
                setData(prev => prev.filter(item => item.id !== id));
            }

            if (isOnline) {
                forceSync();
            }

            return result;
        } catch (err) {
            console.warn(`[useOfflineData] فشل حذف ${entity}:`, err);
            if (mountedRef.current) {
                setError(`فشل في حذف البيانات: ${err.message}`);
            }
            throw err;
        }
    }, [entity, priority, isOnline, forceSync]);

    // ── التحميل الأولي ──────────────────────────────────────
    useEffect(() => {
        mountedRef.current = true;

        if (enabled) {
            refresh();
        }

        return () => {
            mountedRef.current = false;
        };
    }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── مراقبة حالة البيانات القديمة ─────────────────────────
    useEffect(() => {
        if (!lastFetchedAt) return;

        const checkStale = () => {
            const elapsed = Date.now() - lastFetchedAt.getTime();
            if (mountedRef.current) {
                setIsStale(elapsed > STALE_THRESHOLD_MS);
            }
        };

        // فحص كل دقيقة
        const staleCheckTimer = setInterval(checkStale, 60 * 1000);
        return () => clearInterval(staleCheckTimer);
    }, [lastFetchedAt]);

    // ── التحديث التلقائي الدوري ──────────────────────────────
    useEffect(() => {
        if (!autoRefresh || !enabled) return;

        refreshTimerRef.current = setInterval(() => {
            if (mountedRef.current && isOnline) {
                refreshFromServer().then(() => {
                    if (mountedRef.current) {
                        loadLocalData();
                    }
                });
            }
        }, refreshInterval);

        return () => {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
            }
        };
    }, [autoRefresh, enabled, refreshInterval, isOnline, refreshFromServer, loadLocalData]);

    // ── إعادة المزامنة عند عودة الاتصال ──────────────────────
    useEffect(() => {
        if (isOnline && enabled && lastFetchedAt) {
            refreshFromServer().then(() => {
                if (mountedRef.current) {
                    loadLocalData();
                }
            });
        }
    }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── فحص حالة المزامنة ───────────────────────────────────
    const getSyncInfo = useCallback(async () => {
        try {
            const state = await getSyncState(entity);
            return {
                lastSyncVersion: state?.lastSyncVersion || 0,
                lastSyncAt: state?.lastSyncAt || null,
            };
        } catch {
            return { lastSyncVersion: 0, lastSyncAt: null };
        }
    }, [entity]);

    return {
        /** البيانات المحملة من IndexedDB */
        data,
        /** حالة التحميل */
        isLoading,
        /** رسالة الخطأ (إن وُجد) */
        error,
        /** هل البيانات قديمة وتحتاج تحديث؟ */
        isStale,
        /** هل الجهاز غير متصل بالإنترنت؟ */
        isOffline: !isOnline,
        /** آخر وقت تم فيه جلب البيانات من الخادم */
        lastFetchedAt,
        /** إنشاء سجل جديد */
        create,
        /** تحديث سجل موجود */
        update,
        /** حذف سجل */
        remove,
        /** إعادة تحميل البيانات */
        refresh,
        /** معلومات حالة المزامنة */
        getSyncInfo,
    };
}

// ═══════════════════════════════════════════════════════════
// خطاف عنصر واحد - useOfflineItem
// ═══════════════════════════════════════════════════════════

/**
 * خطاف لجلب عنصر واحد بالمعرّف من التخزين المحلي
 *
 * @param {string} entity - نوع الكيان
 * @param {number|string} id - معرّف العنصر
 * @returns {object} كائن يحتوي على العنصر والحالة
 */
export function useOfflineItem(entity, id) {
    const [item, setItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);

    const { isOnline } = useNetworkStatus();

    const loadItem = useCallback(async () => {
        if (!id) {
            setItem(null);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            // جلب من IndexedDB باستخدام فلتر المعرّف
            const result = await offlineRead(entity, { filter: { id: Number(id) } });
            const found = result.data?.[0] || null;

            if (mountedRef.current) {
                setItem(found);
                setError(null);
            }
        } catch (err) {
            console.warn(`[useOfflineItem] خطأ في جلب ${entity}/${id}:`, err);
            if (mountedRef.current) {
                setError(`فشل جلب العنصر: ${err.message}`);
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [entity, id]);

    useEffect(() => {
        mountedRef.current = true;
        loadItem();

        return () => {
            mountedRef.current = false;
        };
    }, [loadItem]);

    // تحديث العنصر عند عودة الاتصال
    useEffect(() => {
        if (isOnline && id) {
            pullDelta(entity).then(() => loadItem()).catch(() => {});
        }
    }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        /** العنصر المطلوب */
        item,
        /** حالة التحميل */
        isLoading,
        /** رسالة الخطأ */
        error,
        /** هل الجهاز غير متصل؟ */
        isOffline: !isOnline,
        /** إعادة تحميل العنصر */
        refresh: loadItem,
    };
}

export default useOfflineData;
