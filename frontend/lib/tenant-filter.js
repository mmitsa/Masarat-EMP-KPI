/**
 * lib/tenant-filter.js - فلتر المستأجرين المركزي
 *
 * حل نهائي لمشكلة Multi-Tenancy: يُستخدم في جميع API Routes
 * يضمن أن كل استعلام يحتوي على فلتر TenantId صحيح
 *
 * القواعد:
 * 1. super_admin → يرى جميع المستأجرين
 * 2. أي دور آخر → يرى بيانات المستأجر الخاص + البيانات المشتركة (TenantId=0)
 * 3. لا يُسمح أبداً بدون فلتر TenantId (أمان إلزامي)
 *
 * يدعم كائنات session و token من NextAuth:
 *   - session: { user: { tenantId, roles, role } }
 *   - token:   { tenantId, roles, role }
 *
 * @version 2.0.0
 */

/**
 * استخراج TenantId من الجلسة أو التوكن مع تطبيع
 * @param {object} sessionOrToken - كائن الجلسة أو التوكن من NextAuth
 * @returns {number} TenantId الرقمي (افتراضي: 1)
 *
 * @example
 * getTenantId(session)  // session.user.tenantId
 * getTenantId(token)    // token.tenantId
 */
export function getTenantId(sessionOrToken) {
    // دعم كلا الصيغتين: session.user.tenantId أو token.tenantId
    const raw = sessionOrToken?.user?.tenantId ?? sessionOrToken?.tenantId;
    if (raw == null) return 1;
    // دعم صيغ مختلفة: 'tenant-2', '2', 2
    const str = String(raw).replace(/^tenant-/i, '');
    const num = parseInt(str, 10);
    return isNaN(num) ? 1 : num;
}

/**
 * هل المستخدم super_admin؟
 * @param {object} sessionOrToken - كائن الجلسة أو التوكن
 * @returns {boolean}
 */
export function isSuperAdmin(sessionOrToken) {
    // دعم session.user.roles و token.roles و session.user.role و token.role
    const roles = sessionOrToken?.user?.roles || sessionOrToken?.roles || [];
    const role = sessionOrToken?.user?.role || sessionOrToken?.role || '';
    return roles.includes('super_admin') || roles.includes('SuperAdmin')
        || role === 'super_admin' || role === 'SuperAdmin';
}

/**
 * بناء شرط WHERE للمستأجر
 *
 * @param {object} sessionOrToken - كائن الجلسة أو التوكن
 * @param {string} [alias=''] - اسم الجدول المستعار (مثل 'e.' أو '')
 * @returns {string} شرط SQL مثل "e.TenantId IN (0, 2)"
 *
 * @example
 * // بدون alias:
 * const where = tenantWhere(token); // "TenantId IN (0, 2)"
 * // مع alias:
 * const where = tenantWhere(token, 'e.'); // "e.TenantId IN (0, 2)"
 */
export function tenantWhere(sessionOrToken, alias = '') {
    const col = `${alias}TenantId`;
    if (isSuperAdmin(sessionOrToken)) {
        // super_admin يرى الكل — لكن نستبعد القيم السالبة احتياطاً
        return `${col} >= 0`;
    }
    const tid = getTenantId(sessionOrToken);
    // الموظف يرى بيانات المستأجر الخاص + البيانات المشتركة (TenantId=0)
    return `${col} IN (0, ${tid})`;
}

/**
 * بناء شرط WHERE كامل (يُضاف لـ WHERE الموجود)
 *
 * @param {object} sessionOrToken - كائن الجلسة أو التوكن
 * @param {string} [alias=''] - اسم الجدول المستعار
 * @returns {string} شرط SQL مع AND مسبق: " AND e.TenantId IN (0, 2)"
 */
export function tenantAnd(sessionOrToken, alias = '') {
    return ` AND ${tenantWhere(sessionOrToken, alias)}`;
}

/**
 * بناء قائمة TenantIds المسموح بها (للاستخدام في IN clause)
 *
 * @param {object} sessionOrToken
 * @returns {string|null} مثل "(0, 2)" أو null لـ super_admin
 */
export function tenantIdList(sessionOrToken) {
    if (isSuperAdmin(sessionOrToken)) return null; // لا فلتر
    const tid = getTenantId(sessionOrToken);
    return `(0, ${tid})`;
}

/**
 * شرط TenantId صارم للعمليات الكتابية (INSERT/UPDATE الخاص بالمستأجر فقط)
 * يُستخدم عند كتابة سجلات جديدة - لا يشمل TenantId=0
 *
 * @param {object} sessionOrToken
 * @param {string} [alias=''] - اسم الجدول المستعار
 * @returns {string} مثل "e.TenantId = 2" أو "e.TenantId >= 0" لـ super_admin
 */
export function tenantWhereStrict(sessionOrToken, alias = '') {
    const col = `${alias}TenantId`;
    if (isSuperAdmin(sessionOrToken)) {
        return `${col} >= 0`;
    }
    const tid = getTenantId(sessionOrToken);
    return `${col} = ${tid}`;
}

export default {
    getTenantId,
    isSuperAdmin,
    tenantWhere,
    tenantAnd,
    tenantIdList,
    tenantWhereStrict,
};
