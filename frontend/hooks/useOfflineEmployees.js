/**
 * خطاف الموظفين بدون اتصال - useOfflineEmployees
 * بيانات مرجعية (Reference Data) - مزامنة كاملة يومياً
 *
 * النمط: بيانات مرجعية تُحمّل من IndexedDB فوراً
 * - تُزامن بالكامل مرة يومياً في الخلفية
 * - البحث المحلي سريع بدون اتصال
 * - تُستخدم كمرجع من الخطافات الأخرى (حضور، إجازات)
 *
 * @module hooks/useOfflineEmployees
 * @version 1.0.0
 */

import { useState, useCallback, useMemo } from 'react';
import { useOfflineData } from './useOfflineData';
import { getOfflineDb } from '../lib/offlineDb';

// ═══════════════════════════════════════════════════════════
// ثوابت - Constants
// ═══════════════════════════════════════════════════════════

/** اسم الكيان في IndexedDB */
const ENTITY_NAME = 'employees';

/** أولوية المزامنة: عامة */
const SYNC_PRIORITY = 5;

/** الفاصل الزمني للتحديث: يومياً (24 ساعة) */
const DAILY_REFRESH_INTERVAL = 24 * 60 * 60 * 1000;

// ═══════════════════════════════════════════════════════════
// الخطاف الرئيسي - useOfflineEmployees
// ═══════════════════════════════════════════════════════════

/**
 * خطاف الموظفين بدون اتصال
 * يوفر بيانات الموظفين مع بحث محلي سريع
 *
 * @param {object} [filters={}] - فلاتر اختيارية
 * @param {number} [filters.departmentId] - فلتر حسب القسم
 * @param {boolean} [filters.isActive] - فلتر حسب الحالة
 * @returns {object} كائن يحتوي على بيانات الموظفين ودوال البحث
 */
export function useOfflineEmployees(filters = {}) {
    // ── حالة البحث ──────────────────────────────────────
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    // ── تحويل الفلاتر لصيغة IndexedDB ──────────────────────
    const indexedDbFilters = useMemo(() => {
        const dbFilters = {};
        if (filters.departmentId) dbFilters.departmentId = Number(filters.departmentId);
        // ملاحظة: الفلاتر الأخرى تُطبّق بعد جلب البيانات
        return Object.keys(dbFilters).length > 0 ? dbFilters : null;
    }, [filters.departmentId]);

    // ── الخطاف الأساسي ──────────────────────────────────────
    const {
        data: allEmployees,
        isLoading,
        error,
        isStale,
        isOffline,
        refresh,
        getSyncInfo,
    } = useOfflineData(ENTITY_NAME, {
        filters: indexedDbFilters,
        enabled: true,
        autoRefresh: true,
        refreshInterval: DAILY_REFRESH_INTERVAL,
        priority: SYNC_PRIORITY,
    });

    // ── تطبيق الفلاتر المتقدمة (غير مدعومة في Dexie مباشرة) ──
    const employees = useMemo(() => {
        let filtered = allEmployees;

        // فلتر الحالة (نشط/غير نشط)
        if (filters.isActive !== undefined) {
            filtered = filtered.filter(emp => emp.isActive === filters.isActive);
        }

        // ترتيب أبجدي حسب الاسم العربي
        return filtered.sort((a, b) => {
            const nameA = a.nameAr || '';
            const nameB = b.nameAr || '';
            return nameA.localeCompare(nameB, 'ar');
        });
    }, [allEmployees, filters.isActive]);

    // ── البحث المحلي ────────────────────────────────────────

    /**
     * بحث في الموظفين محلياً (IndexedDB)
     * يبحث في الاسم العربي والاسم الإنجليزي ورقم الهوية
     *
     * @param {string} query - نص البحث
     * @returns {Promise<Array>} نتائج البحث
     */
    const searchLocal = useCallback(async (query) => {
        if (!query || query.trim().length === 0) {
            setSearchResults(null);
            return employees;
        }

        setIsSearching(true);

        try {
            const searchTerm = query.trim().toLowerCase();
            const db = getOfflineDb();

            // جلب كل الموظفين من IndexedDB للبحث
            let allRecords = [];
            try {
                allRecords = await db.employees.toArray();
            } catch {
                // إذا فشل الوصول المباشر، استخدم البيانات المحملة
                allRecords = allEmployees;
            }

            // البحث في الحقول المتعددة
            const results = allRecords.filter(emp => {
                const nameAr = (emp.nameAr || '').toLowerCase();
                const nameEn = (emp.nameEn || '').toLowerCase();
                const nationalId = (emp.nationalId || '').toString();
                const jobTitle = (emp.jobTitle || '').toLowerCase();
                const phone = (emp.phone || '').toString();

                return (
                    nameAr.includes(searchTerm) ||
                    nameEn.includes(searchTerm) ||
                    nationalId.includes(searchTerm) ||
                    jobTitle.includes(searchTerm) ||
                    phone.includes(searchTerm)
                );
            });

            // ترتيب النتائج: الأكثر تطابقاً أولاً
            results.sort((a, b) => {
                const nameA = (a.nameAr || '').toLowerCase();
                const nameB = (b.nameAr || '').toLowerCase();
                const startsWithA = nameA.startsWith(searchTerm) ? 0 : 1;
                const startsWithB = nameB.startsWith(searchTerm) ? 0 : 1;
                return startsWithA - startsWithB || nameA.localeCompare(nameB, 'ar');
            });

            setSearchResults(results);
            return results;
        } catch (err) {
            console.warn('[useOfflineEmployees] خطأ في البحث المحلي:', err);
            setSearchResults([]);
            return [];
        } finally {
            setIsSearching(false);
        }
    }, [allEmployees, employees]);

    // ── جلب موظف بالمعرّف ───────────────────────────────────

    /**
     * جلب موظف واحد بالمعرّف من IndexedDB
     *
     * @param {number|string} id - معرّف الموظف
     * @returns {Promise<object|null>} بيانات الموظف أو null
     */
    const getById = useCallback(async (id) => {
        if (!id) return null;

        try {
            const db = getOfflineDb();
            const employee = await db.employees.get(Number(id));
            return employee || null;
        } catch (err) {
            console.warn(`[useOfflineEmployees] خطأ في جلب الموظف ${id}:`, err);
            // محاولة من البيانات المحملة
            return employees.find(emp => emp.id === Number(id)) || null;
        }
    }, [employees]);

    // ── جلب موظفين حسب القسم ────────────────────────────────

    /**
     * جلب الموظفين حسب القسم
     *
     * @param {number} departmentId - معرّف القسم
     * @returns {Array} موظفي القسم
     */
    const getByDepartment = useCallback((departmentId) => {
        if (!departmentId) return [];
        return allEmployees.filter(emp => emp.departmentId === Number(departmentId));
    }, [allEmployees]);

    // ── إحصائيات سريعة ──────────────────────────────────────

    /**
     * إحصائيات الموظفين
     * @returns {object} إحصائيات مختصرة
     */
    const stats = useMemo(() => ({
        /** العدد الإجمالي */
        total: allEmployees.length,
        /** النشطين */
        active: allEmployees.filter(e => e.isActive).length,
        /** غير النشطين */
        inactive: allEmployees.filter(e => !e.isActive).length,
    }), [allEmployees]);

    // ── مسح نتائج البحث ─────────────────────────────────────
    const clearSearch = useCallback(() => {
        setSearchResults(null);
    }, []);

    return {
        /** قائمة الموظفين (مع الفلاتر المطبقة) */
        employees,
        /** حالة التحميل */
        isLoading,
        /** رسالة الخطأ */
        error,
        /** هل البيانات قديمة؟ */
        isStale,
        /** هل الجهاز غير متصل؟ */
        isOffline,

        /** بحث محلي في الموظفين */
        searchLocal,
        /** نتائج البحث الحالية (null = لا بحث نشط) */
        searchResults,
        /** هل جاري البحث؟ */
        isSearching,
        /** مسح نتائج البحث */
        clearSearch,

        /** جلب موظف بالمعرّف */
        getById,
        /** جلب موظفين حسب القسم */
        getByDepartment,

        /** إحصائيات الموظفين */
        stats,

        /** إعادة تحميل البيانات */
        refresh,
        /** معلومات المزامنة */
        getSyncInfo,
    };
}

export default useOfflineEmployees;
