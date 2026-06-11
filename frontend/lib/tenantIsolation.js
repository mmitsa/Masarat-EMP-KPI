/**
 * 🔐 Tenant Isolation Middleware & Utilities
 * فئة العزل الكامل للمستأجرين
 * 
 * الوظائف:
 * 1. التحقق من أن جميع البيانات لها tenantId
 * 2. فلترة البيانات حسب tenantId الحالي
 * 3. منع الوصول لبيانات مستأجر آخر
 * 4. تسجيل جميع محاولات الوصول غير المصرح
 * 
 * @version 1.0.0
 * @date 2026-02-10
 */

import { getSession } from 'next-auth/react'

/**
 * الحصول على tenantId من الجلسة الحالية
 */
export async function getCurrentTenantId() {
    const session = await getSession()
    if (!session?.user?.tenantId) {
        throw new Error('❌ لم يتم العثور على معرف المستأجر في الجلسة')
    }
    return session.user.tenantId
}

/**
 * التحقق من أن البيانات تحتوي على tenantId صحيح
 */
export function validateTenantId(data, requiredTenantId) {
    if (!data) {
        throw new Error('❌ البيانات لا يمكن أن تكون فارغة')
    }

    // تطبيع tenantId للمقارنة الآمنة (string vs number, "tenant-X" vs X)
    const normalizeTid = (tid) => {
        if (tid === null || tid === undefined) return null
        return String(tid).replace(/^tenant-/i, '').trim()
    }
    const reqTid = normalizeTid(requiredTenantId)

    // إذا كانت البيانات array
    if (Array.isArray(data)) {
        return data.map((item, index) => {
            // تخطي التحقق إذا لم يكن هناك tenantId في البيان (سيتم إضافته لاحقاً)
            if (item.tenantId === undefined || item.tenantId === null) return item
            if (normalizeTid(item.tenantId) !== reqTid) {
                console.error(`❌ بيان رقم ${index} لا ينتمي للمستأجر الحالي`, item)
                throw new Error(`بيان رقم ${index} غير مصرح للمستأجر الحالي`)
            }
            return item
        })
    }

    // إذا كانت البيانات object
    if (typeof data === 'object') {
        // تخطي التحقق إذا لم يكن هناك tenantId في البيانات (سيتم إضافته عبر attachTenantId)
        if (data.tenantId === undefined || data.tenantId === null) return data
        if (normalizeTid(data.tenantId) !== reqTid) {
            console.error(`❌ البيان لا ينتمي للمستأجر الحالي:`, data)
            throw new Error('البيان غير مصرح للمستأجر الحالي')
        }
        return data
    }

    return data
}

/**
 * إضافة tenantId تلقائياً للبيانات الجديدة
 */
export async function attachTenantId(data) {
    if (!data) return data

    const tenantId = await getCurrentTenantId()

    // إذا كانت array
    if (Array.isArray(data)) {
        return data.map(item => ({
            ...item,
            tenantId: item.tenantId || tenantId,
        }))
    }

    // إذا كانت object
    if (typeof data === 'object') {
        return {
            ...data,
            tenantId: data.tenantId || tenantId,
        }
    }

    return data
}

/**
 * فلترة البيانات حسب tenantId
 */
export async function filterByCurrentTenant(data) {
    if (!data) return data

    const tenantId = await getCurrentTenantId()
    const normalizeTid = (tid) => String(tid || '').replace(/^tenant-/i, '').trim()
    const currentTid = normalizeTid(tenantId)

    // إذا كانت array
    if (Array.isArray(data)) {
        return data.filter(item => normalizeTid(item.tenantId) === currentTid)
    }

    // إذا كانت object
    if (typeof data === 'object') {
        if (data.tenantId !== undefined && normalizeTid(data.tenantId) !== currentTid) {
            return null // لا ترجع البيانات إذا لم تكن للمستأجر الحالي
        }
        return data
    }

    return data
}

/**
 * معالج middleware للتحقق من العزل
 */
export async function tenantIsolationMiddleware(request, tenantId) {
    const session = await getSession()
    const currentTenantId = session?.user?.tenantId

    // التحقق من أن المستخدم يحاول الوصول لبيانات مستأجره فقط
    if (tenantId && tenantId.toString() !== currentTenantId?.toString()) {
        console.warn(`⚠️ محاولة وصول غير مصرح: المستخدم ${session?.user?.email} يحاول الوصول للمستأجر ${tenantId}`)
        throw new Error('❌ غير مصرح للوصول لهذه البيانات')
    }

    return true
}

/**
 * التحقق من صلاحيات الكتابة على البيانات
 */
export async function validateWriteAccess(targetTenantId, userRole = 'user') {
    const currentTenantId = await getCurrentTenantId()

    // التحقق من أن tenantId متطابق
    if (targetTenantId.toString() !== currentTenantId.toString()) {
        throw new Error('❌ لا يمكن الكتابة على بيانات مستأجر آخر')
    }

    // التحقق من الأدوار (مثال)
    const writableRoles = ['admin', 'manager', 'super_admin']
    if (!writableRoles.includes(userRole)) {
        throw new Error('❌ ليس لديك صلاحيات الكتابة على هذه البيانات')
    }

    return true
}

/**
 * إنشاء فلتر query من tenantId
 */
export async function getTenantFilter() {
    const tenantId = await getCurrentTenantId()
    return {
        tenantId: parseInt(tenantId),
    }
}

/**
 * التحقق من أن المستخدم يمكنه إنشاء بيانات في هذا المستأجر
 */
export async function validateTenantCreationAccess(targetTenantId) {
    const currentTenantId = await getCurrentTenantId()

    if (targetTenantId.toString() !== currentTenantId.toString()) {
        throw new Error('❌ يمكنك فقط إنشاء بيانات في مستأجرك الخاص')
    }

    return true
}

/**
 * تسجيل محاولات الوصول غير المصرح
 */
export async function logUnauthorizedAccess(action, targetTenantId, details = {}) {
    const session = await getSession()
    const timestamp = new Date().toISOString()

    const logEntry = {
        timestamp,
        action,
        user: session?.user?.email,
        currentTenantId: session?.user?.tenantId,
        targetTenantId,
        details,
        severity: 'HIGH',
    }

    console.error('🚨 [SECURITY] Unauthorized Access Attempt:', logEntry)

    // يمكن إرسال هذا إلى خدمة logging مركزية
    // await logService.logSecurityEvent(logEntry)

    return logEntry
}

/**
 * Middleware لفحص جميع requests
 */
export async function ensureTenantIsolation(operation) {
    return async (data) => {
        try {
            // التحقق من أن المستخدم مسجل الدخول
            const session = await getSession()
            if (!session || !session.user) {
                throw new Error('❌ يجب تسجيل الدخول أولاً')
            }

            // التحقق من tenantId
            const tenantId = await getCurrentTenantId()
            if (!tenantId) {
                throw new Error('❌ لم يتم العثور على معرف المستأجر')
            }

            // إضافة tenantId للبيانات
            const enrichedData = await attachTenantId(data)

            // التحقق من أن البيانات صحيحة
            const validatedData = validateTenantId(enrichedData, tenantId)

            // تنفيذ العملية
            return await operation(validatedData)
        } catch (error) {
            console.error('❌ Tenant Isolation Error:', error)
            throw error
        }
    }
}

/**
 * حماية API endpoint من محاولات الوصول غير المصرح
 */
export function createTenantProtectedEndpoint(handler) {
    return async (req, res) => {
        try {
            const session = await getSession({ req })

            // التحقق من وجود جلسة
            if (!session || !session.user) {
                return res.status(401).json({ error: 'غير مصرح - يجب تسجيل الدخول' })
            }

            // استخراج tenantId من الطلب أو الجلسة
            const requestTenantId = req.body?.tenantId || req.query?.tenantId || session.user.tenantId

            // التحقق من أن tenantId متطابق
            if (requestTenantId.toString() !== session.user.tenantId.toString()) {
                await logUnauthorizedAccess('API_ACCESS', requestTenantId, {
                    endpoint: req.url,
                    method: req.method,
                })
                return res.status(403).json({ error: 'غير مصرح للوصول لهذا المستأجر' })
            }

            // إرسال tenantId للـ handler
            req.tenantId = requestTenantId

            return await handler(req, res)
        } catch (error) {
            console.error('🔐 Tenant Protection Error:', error)
            return res.status(500).json({ error: 'خطأ في معالجة الطلب' })
        }
    }
}

export default {
    getCurrentTenantId,
    validateTenantId,
    attachTenantId,
    filterByCurrentTenant,
    tenantIsolationMiddleware,
    validateWriteAccess,
    getTenantFilter,
    validateTenantCreationAccess,
    logUnauthorizedAccess,
    ensureTenantIsolation,
    createTenantProtectedEndpoint,
}
