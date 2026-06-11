/**
 * خطاف المستودعات بدون اتصال - useOfflineWarehouse
 * أصناف → sync، صرف → pendingOps مع تحقق محلي
 *
 * النمط: offline-first
 * - بيانات الأصناف تُزامن دورياً وتُخزّن في IndexedDB
 * - البحث في الأصناف يعمل بالكامل بدون اتصال
 * - طلبات الصرف تُحفظ محلياً مع تحقق من الكمية المتاحة
 * - تتم المزامنة تلقائياً عند عودة الاتصال
 *
 * @module hooks/useOfflineWarehouse
 * @version 1.0.0
 */

import { useState, useCallback, useMemo } from 'react';
import { useOfflineData } from './useOfflineData';
import { offlineWrite, offlineRead } from '../lib/offlineDataLayer';
import { useNetworkStatus } from '../context/NetworkStatusContext';
import { getOfflineDb } from '../lib/offlineDb';

// ═══════════════════════════════════════════════════════════
// ثوابت - Constants
// ═══════════════════════════════════════════════════════════

/** اسم كيان الأصناف في IndexedDB */
const ITEMS_ENTITY = 'warehouseItems';

/** اسم كيان طلبات الصرف في IndexedDB */
const EXCHANGE_ENTITY = 'exchangeRequests';

/** أولوية المزامنة: المستودعات */
const WAREHOUSE_PRIORITY = 4;

/** حالات طلبات الصرف */
const ExchangeStatus = {
    /** مسودة محلية */
    LOCAL_DRAFT: 'local_draft',
    /** قيد المراجعة */
    PENDING: 'pending',
    /** معتمد */
    APPROVED: 'approved',
    /** مرفوض */
    REJECTED: 'rejected',
    /** تم الصرف */
    DISPENSED: 'dispensed',
    /** ملغى */
    CANCELLED: 'cancelled',
};

/** أسماء حالات الصرف بالعربي */
const ExchangeStatusLabels = {
    [ExchangeStatus.LOCAL_DRAFT]: 'مسودة محلية',
    [ExchangeStatus.PENDING]: 'قيد المراجعة',
    [ExchangeStatus.APPROVED]: 'معتمد',
    [ExchangeStatus.REJECTED]: 'مرفوض',
    [ExchangeStatus.DISPENSED]: 'تم الصرف',
    [ExchangeStatus.CANCELLED]: 'ملغى',
};

// ═══════════════════════════════════════════════════════════
// الخطاف الرئيسي - useOfflineWarehouse
// ═══════════════════════════════════════════════════════════

/**
 * خطاف المستودعات بدون اتصال
 * يوفر بحث في الأصناف وتقديم طلبات صرف بنمط offline-first
 *
 * @returns {object} كائن يحتوي على بيانات المستودع ودوال الصرف
 */
export function useOfflineWarehouse() {
    // ── حالات العمليات ──────────────────────────────────────
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [operationError, setOperationError] = useState(null);

    // ── حالة الاتصال ──────────────────────────────────────
    const { isOnline, forceSync } = useNetworkStatus();

    // ── خطاف بيانات الأصناف ──────────────────────────────────
    const {
        data: items,
        isLoading: isLoadingItems,
        error: itemsError,
        isStale: isItemsStale,
        refresh: refreshItems,
    } = useOfflineData(ITEMS_ENTITY, {
        enabled: true,
        autoRefresh: true,
        refreshInterval: 15 * 60 * 1000, // تحديث كل 15 دقيقة
        priority: WAREHOUSE_PRIORITY,
    });

    // ── خطاف بيانات طلبات الصرف ─────────────────────────────
    const {
        data: exchangeRequests,
        isLoading: isLoadingExchanges,
        error: exchangeError,
        refresh: refreshExchanges,
    } = useOfflineData(EXCHANGE_ENTITY, {
        enabled: true,
        autoRefresh: true,
        refreshInterval: 5 * 60 * 1000,
        priority: WAREHOUSE_PRIORITY,
    });

    // ── البحث في الأصناف ────────────────────────────────────

    /**
     * بحث محلي في الأصناف (IndexedDB)
     * يبحث في الاسم العربي، الاسم الإنجليزي، الباركود، ورقم الصنف
     *
     * @param {string} query - نص البحث
     * @returns {Promise<Array>} نتائج البحث
     */
    const searchItems = useCallback(async (query) => {
        if (!query || query.trim().length === 0) {
            setSearchResults(null);
            return items;
        }

        setIsSearching(true);

        try {
            const searchTerm = query.trim().toLowerCase();

            // محاولة البحث من IndexedDB مباشرة للحصول على كل البيانات
            let allItems = items;
            try {
                const db = getOfflineDb();
                if (db.warehouseItems) {
                    allItems = await db.warehouseItems.toArray();
                }
            } catch {
                // استخدام البيانات المحملة كاحتياط
            }

            // البحث في الحقول المتعددة
            const results = allItems.filter(item => {
                const nameAr = (item.nameAr || '').toLowerCase();
                const nameEn = (item.nameEn || '').toLowerCase();
                const barcode = (item.barcode || '').toString().toLowerCase();
                const itemCode = (item.itemCode || item.code || '').toString().toLowerCase();
                const categoryName = (item.categoryName || '').toLowerCase();

                return (
                    nameAr.includes(searchTerm) ||
                    nameEn.includes(searchTerm) ||
                    barcode.includes(searchTerm) ||
                    itemCode.includes(searchTerm) ||
                    categoryName.includes(searchTerm)
                );
            });

            // ترتيب: الأكثر تطابقاً أولاً
            results.sort((a, b) => {
                const nameA = (a.nameAr || '').toLowerCase();
                const nameB = (b.nameAr || '').toLowerCase();
                const startsA = nameA.startsWith(searchTerm) ? 0 : 1;
                const startsB = nameB.startsWith(searchTerm) ? 0 : 1;
                return startsA - startsB || nameA.localeCompare(nameB, 'ar');
            });

            setSearchResults(results);
            return results;
        } catch (err) {
            console.warn('[useOfflineWarehouse] خطأ في البحث:', err);
            setSearchResults([]);
            return [];
        } finally {
            setIsSearching(false);
        }
    }, [items]);

    // ── مسح نتائج البحث ─────────────────────────────────────
    const clearSearch = useCallback(() => {
        setSearchResults(null);
    }, []);

    // ── التحقق من الكمية المتاحة محلياً ──────────────────────

    /**
     * التحقق من توفر الكمية المطلوبة من صنف معين
     * يتحقق من الكمية في IndexedDB مع مراعاة الطلبات المعلقة
     *
     * @param {number} itemId - معرّف الصنف
     * @param {number} requestedQuantity - الكمية المطلوبة
     * @returns {Promise<{available: boolean, currentStock: number, pendingOut: number}>}
     */
    const checkLocalAvailability = useCallback(async (itemId, requestedQuantity) => {
        try {
            // جلب بيانات الصنف
            const item = items.find(i => i.id === Number(itemId));
            const currentStock = item?.currentQuantity || item?.quantity || 0;

            // حساب الكميات المحجوزة في طلبات الصرف المعلقة
            const pendingExchanges = exchangeRequests.filter(req =>
                req.status === ExchangeStatus.PENDING ||
                req.status === ExchangeStatus.LOCAL_DRAFT ||
                req.status === ExchangeStatus.APPROVED
            );

            let pendingOut = 0;
            for (const req of pendingExchanges) {
                // التحقق من عناصر الطلب (items array أو itemId مباشر)
                if (req.items && Array.isArray(req.items)) {
                    const matchingItem = req.items.find(ri => ri.itemId === Number(itemId));
                    if (matchingItem) {
                        pendingOut += matchingItem.quantity || 0;
                    }
                } else if (req.itemId === Number(itemId)) {
                    pendingOut += req.quantity || 0;
                }
            }

            const availableStock = currentStock - pendingOut;
            const available = availableStock >= requestedQuantity;

            return {
                available,
                currentStock,
                pendingOut,
                availableStock: Math.max(0, availableStock),
            };
        } catch (err) {
            console.warn('[useOfflineWarehouse] خطأ في التحقق من الكمية:', err);
            // في حالة الخطأ، نسمح بالطلب ونترك التحقق للخادم
            return {
                available: true,
                currentStock: 0,
                pendingOut: 0,
                availableStock: 0,
                warning: 'تعذر التحقق من الكمية المتاحة محلياً',
            };
        }
    }, [items, exchangeRequests]);

    // ── تقديم طلب صرف ──────────────────────────────────────

    /**
     * تقديم طلب صرف مواد
     * يُحفظ محلياً مع تحقق من الكمية المتاحة، ثم يُزامن عند الاتصال
     *
     * @param {object} requestData - بيانات طلب الصرف
     * @param {Array} requestData.items - الأصناف المطلوبة [{itemId, quantity, notes}]
     * @param {string} [requestData.reason] - سبب الصرف
     * @param {string} [requestData.urgency] - درجة الأولوية (normal, urgent, critical)
     * @param {number} [requestData.requesterId] - معرّف مقدم الطلب
     * @returns {Promise<{success: boolean, isLocal: boolean, validationResults: Array}>}
     */
    const createExchangeRequest = useCallback(async (requestData) => {
        // التحقق من البيانات المطلوبة
        if (!requestData.items || requestData.items.length === 0) {
            throw new Error('يرجى إضافة صنف واحد على الأقل لطلب الصرف');
        }

        setIsSubmitting(true);
        setOperationError(null);

        try {
            // التحقق المحلي من توفر الكميات لكل صنف
            const validationResults = [];
            let allAvailable = true;

            for (const reqItem of requestData.items) {
                if (!reqItem.itemId) {
                    validationResults.push({
                        itemId: null,
                        valid: false,
                        message: 'معرّف الصنف مطلوب',
                    });
                    allAvailable = false;
                    continue;
                }

                if (!reqItem.quantity || reqItem.quantity <= 0) {
                    validationResults.push({
                        itemId: reqItem.itemId,
                        valid: false,
                        message: 'الكمية يجب أن تكون أكبر من صفر',
                    });
                    allAvailable = false;
                    continue;
                }

                const availability = await checkLocalAvailability(reqItem.itemId, reqItem.quantity);

                validationResults.push({
                    itemId: reqItem.itemId,
                    valid: availability.available,
                    currentStock: availability.currentStock,
                    availableStock: availability.availableStock,
                    requestedQuantity: reqItem.quantity,
                    message: availability.available
                        ? 'متوفر'
                        : `الكمية غير كافية (المتاح: ${availability.availableStock})`,
                    warning: availability.warning || null,
                });

                if (!availability.available) {
                    allAvailable = false;
                }
            }

            // إذا لم تتوفر الكميات، نُبلغ المستخدم لكن نسمح بالاستمرار
            if (!allAvailable) {
                const insufficientItems = validationResults
                    .filter(v => !v.valid)
                    .map(v => v.message);

                console.warn('[useOfflineWarehouse] كميات غير كافية:', insufficientItems);
                // نرفض الطلب فقط عند التحقق المحلي القاطع
                const hardFailures = validationResults.filter(v => !v.valid && !v.warning);
                if (hardFailures.length > 0) {
                    throw new Error(`الكمية غير كافية: ${hardFailures.map(f => f.message).join('، ')}`);
                }
            }

            // بناء بيانات طلب الصرف
            const exchangeRequest = {
                items: requestData.items.map(item => ({
                    itemId: Number(item.itemId),
                    quantity: Number(item.quantity),
                    notes: item.notes || '',
                })),
                reason: requestData.reason || '',
                urgency: requestData.urgency || 'normal',
                requesterId: requestData.requesterId || null,
                status: isOnline ? ExchangeStatus.PENDING : ExchangeStatus.LOCAL_DRAFT,
                clientTimestamp: new Date().toISOString(),
            };

            // الكتابة في IndexedDB + طابور المزامنة
            await offlineWrite(EXCHANGE_ENTITY, 'create', exchangeRequest, WAREHOUSE_PRIORITY);

            // محاولة المزامنة الفورية
            if (isOnline) {
                forceSync();
            }

            // إعادة تحميل البيانات
            await refreshExchanges();

            return {
                success: true,
                isLocal: !isOnline,
                validationResults,
                message: isOnline
                    ? 'تم تقديم طلب الصرف بنجاح'
                    : 'تم حفظ طلب الصرف محلياً - سيتم إرساله عند عودة الاتصال',
            };
        } catch (err) {
            console.warn('[useOfflineWarehouse] خطأ في تقديم طلب الصرف:', err);
            const errorMsg = err.message || 'فشل في تقديم طلب الصرف';
            setOperationError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    }, [isOnline, forceSync, refreshExchanges, checkLocalAvailability]);

    // ── جلب صنف بالمعرّف ────────────────────────────────────

    /**
     * جلب تفاصيل صنف من IndexedDB
     *
     * @param {number|string} itemId - معرّف الصنف
     * @returns {object|null} تفاصيل الصنف
     */
    const getItemById = useCallback((itemId) => {
        if (!itemId) return null;
        return items.find(i => i.id === Number(itemId)) || null;
    }, [items]);

    // ── تصنيف طلبات الصرف ───────────────────────────────────

    /** الطلبات المعلقة */
    const pendingExchanges = useMemo(() => {
        return exchangeRequests
            .filter(r => r.status === ExchangeStatus.PENDING || r.status === ExchangeStatus.LOCAL_DRAFT || r.status === ExchangeStatus.APPROVED)
            .sort((a, b) => (b.clientTimestamp || '').localeCompare(a.clientTimestamp || ''));
    }, [exchangeRequests]);

    /** المسودات المحلية */
    const localDrafts = useMemo(() => {
        return exchangeRequests.filter(r => r.status === ExchangeStatus.LOCAL_DRAFT || r._isLocal);
    }, [exchangeRequests]);

    // ── إحصائيات ────────────────────────────────────────────

    const stats = useMemo(() => ({
        /** إجمالي الأصناف */
        totalItems: items.length,
        /** أصناف تحت الحد الأدنى */
        lowStockItems: items.filter(i => {
            const qty = i.currentQuantity || i.quantity || 0;
            const min = i.minimumQuantity || i.minStock || 0;
            return qty > 0 && min > 0 && qty <= min;
        }).length,
        /** أصناف نفدت */
        outOfStockItems: items.filter(i => {
            const qty = i.currentQuantity || i.quantity || 0;
            return qty <= 0;
        }).length,
        /** طلبات صرف معلقة */
        pendingExchangeCount: pendingExchanges.length,
        /** مسودات محلية */
        localDraftCount: localDrafts.length,
    }), [items, pendingExchanges, localDrafts]);

    // ── الخطأ المجمّع ───────────────────────────────────────
    const error = operationError || itemsError || exchangeError;

    return {
        /** قائمة الأصناف */
        items,
        /** حالة تحميل الأصناف */
        isLoadingItems,
        /** حالة تحميل الطلبات */
        isLoadingExchanges,
        /** رسالة الخطأ */
        error,
        /** هل بيانات الأصناف قديمة؟ */
        isItemsStale,
        /** هل الجهاز غير متصل؟ */
        isOffline: !isOnline,

        /** بحث في الأصناف */
        searchItems,
        /** نتائج البحث */
        searchResults,
        /** هل جاري البحث؟ */
        isSearching,
        /** مسح نتائج البحث */
        clearSearch,
        /** جلب صنف بالمعرّف */
        getItemById,

        /** تقديم طلب صرف */
        createExchangeRequest,
        /** هل جاري التقديم؟ */
        isSubmitting,
        /** التحقق من توفر الكمية */
        checkLocalAvailability,

        /** طلبات الصرف */
        exchangeRequests,
        /** الطلبات المعلقة */
        pendingExchanges,
        /** المسودات المحلية */
        localDrafts,

        /** إحصائيات المستودع */
        stats,

        /** إعادة تحميل الأصناف */
        refreshItems,
        /** إعادة تحميل طلبات الصرف */
        refreshExchanges,

        /** ثوابت: حالات الصرف */
        ExchangeStatus,
        /** ثوابت: أسماء الحالات بالعربي */
        ExchangeStatusLabels,
    };
}

export default useOfflineWarehouse;
