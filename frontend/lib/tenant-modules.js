/**
 * Tenant Module Configuration — DB-driven
 * إعدادات الموديولات المتاحة لكل مستأجر (مدفوعة من قاعدة البيانات)
 *
 * الأدمن (super_admin) يتجاوز هذا القيد ويرى كل شيء دائماً.
 *
 * آلية العمل:
 *   1. عند تحميل السايدبار يُستدعى loadTenantModules(tenantId) (async).
 *   2. النتيجة تُخزَّن في cache داخل الذاكرة مع TTL 5 دقائق.
 *   3. isTenantModuleEnabled تقرأ من الـ cache بشكل متزامن (synchronous).
 *   4. عند انتهاء TTL أو استدعاء refreshTenantModules يُعاد الجلب.
 *
 * @version 2.0.0
 * @date 2026-03-04
 */

// ════════════════════════════════════════════════════════════════
// الموديولات التي تظهر دائماً بغض النظر عن إعدادات المستأجر
// ════════════════════════════════════════════════════════════════
export const ALWAYS_VISIBLE = [
    'dashboard',           // لوحة التحكم الرئيسية
    'my-portal',           // بوابتي
    'my-department',       // إدارتي
    'executive-dashboard', // لوحة صاحب الصلاحية
    'settings',            // الإعدادات
    'trash',               // سلة المهملات
];

// ════════════════════════════════════════════════════════════════
// Cache داخل الذاكرة
// ════════════════════════════════════════════════════════════════
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 دقائق

/**
 * @typedef {Object} CacheEntry
 * @property {string[]|null} modules  - قائمة الموديولات المسموحة، أو null = الكل
 * @property {number}        fetchedAt - timestamp لوقت الجلب
 */

/** @type {Map<number, CacheEntry>} */
const _cache = new Map();

/** @type {Map<number, Promise<string[]|null>>} */
const _inflight = new Map(); // منع طلبات متعددة لنفس tenantId

// ════════════════════════════════════════════════════════════════
// الدوال المساعدة
// ════════════════════════════════════════════════════════════════

/**
 * تحليل tenantId إلى عدد صحيح نظيف
 * @param {number|string} tenantId
 * @returns {number}
 */
function parseTenantId(tenantId) {
    return parseInt(String(tenantId).replace(/^tenant-/i, '').trim()) || 1;
}

/**
 * هل مدة الـ cache لا تزال صالحة؟
 * @param {CacheEntry} entry
 * @returns {boolean}
 */
function isCacheValid(entry) {
    return entry && (Date.now() - entry.fetchedAt) < CACHE_TTL_MS;
}

// ════════════════════════════════════════════════════════════════
// الدوال العامة
// ════════════════════════════════════════════════════════════════

/**
 * تحميل موديولات المستأجر من الـ API وتخزينها في الـ cache.
 * آمنة للاستدعاء المتعدد: إذا كان هناك طلب قيد التنفيذ ينتظر نفس الـ promise.
 *
 * @param {number|string} tenantId
 * @returns {Promise<string[]|null>} الموديولات المسموحة أو null = الكل
 */
export async function loadTenantModules(tenantId) {
    const tid = parseTenantId(tenantId);

    // إرجاع الـ cache إذا كان صالحاً
    const cached = _cache.get(tid);
    if (isCacheValid(cached)) {
        return cached.modules;
    }

    // إذا كان هناك طلب قيد التنفيذ لنفس المستأجر، ننتظره
    if (_inflight.has(tid)) {
        return _inflight.get(tid);
    }

    const fetchPromise = (async () => {
        try {
            // نستخدم fetch النسبي — يعمل فقط على جانب الـ client (browser)
            // على جانب الـ server (SSR) نعود مباشرة إلى null (fail-open)
            if (typeof window === 'undefined') {
                _cache.set(tid, { modules: null, fetchedAt: Date.now() });
                return null;
            }

            const response = await fetch(`/api/saas/tenant-modules?tenantId=${tid}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // data.modules: string[] | null
            const modules = data.success ? (data.modules ?? null) : null;
            _cache.set(tid, { modules, fetchedAt: Date.now() });
            return modules;
        } catch (err) {
            console.warn('[tenant-modules] loadTenantModules error:', err.message);
            // Fail-open: null = كل الموديولات مسموحة
            _cache.set(tid, { modules: null, fetchedAt: Date.now() });
            return null;
        } finally {
            _inflight.delete(tid);
        }
    })();

    _inflight.set(tid, fetchPromise);
    return fetchPromise;
}

/**
 * مسح الـ cache وإعادة الجلب من الـ API.
 *
 * @param {number|string} tenantId
 * @returns {Promise<string[]|null>}
 */
export async function refreshTenantModules(tenantId) {
    const tid = parseTenantId(tenantId);
    _cache.delete(tid);
    _inflight.delete(tid);
    return loadTenantModules(tid);
}

/**
 * الحصول على الموديولات المسموحة للمستأجر من الـ cache (synchronous).
 * يُرجع null إذا لم يكن الـ cache محملاً بعد (= كل الموديولات مسموحة).
 *
 * @param {number|string} tenantId
 * @returns {string[]|null}
 */
export function getTenantAllowedModules(tenantId) {
    const tid = parseTenantId(tenantId);
    const cached = _cache.get(tid);
    if (isCacheValid(cached)) {
        return cached.modules;
    }
    // الـ cache غير محمَّل أو منتهي الصلاحية — fail-open (null = الكل مسموح)
    return null;
}

/**
 * التحقق من أن الموديول مسموح للمستأجر (synchronous — يقرأ من الـ cache).
 *
 * @param {number|string} tenantId   - معرف المستأجر
 * @param {string}        moduleId   - معرف الموديول
 * @param {boolean}       isSuperAdmin - هل المستخدم أدمن
 * @returns {boolean}
 */
export function isTenantModuleEnabled(tenantId, moduleId, isSuperAdmin = false) {
    // الأدمن يرى كل شيء
    if (isSuperAdmin) return true;

    // الموديولات الدائمة تظهر دائماً
    if (ALWAYS_VISIBLE.includes(moduleId)) return true;

    // فحص الـ cache
    const allowed = getTenantAllowedModules(tenantId);
    if (!allowed) return true; // null = كل شيء مسموح (fail-open)

    return allowed.includes(moduleId);
}

export default {
    getTenantAllowedModules,
    isTenantModuleEnabled,
    loadTenantModules,
    refreshTenantModules,
    ALWAYS_VISIBLE,
};
