/**
 * 🔐 API Routes Tenant Isolation Middleware
 * حماية جميع API endpoints من محاولات الوصول غير المصرح
 * 
 * @version 1.0.0
 * @date 2026-02-10
 */

import { getSession } from 'next-auth/react'

/**
 * Middleware لحماية API routes من محاولات الوصول غير المصرح
 * 
 * الاستخدام:
 * ```javascript
 * import { withTenantIsolation } from '@/lib/api/tenantMiddleware'
 * 
 * export default withTenantIsolation(async (req, res) => {
 *     // يمكنك الآن استخدام req.tenantId
 * })
 * ```
 */
export function withTenantIsolation(handler) {
    return async (req, res) => {
        try {
            // الحصول على الجلسة
            const session = await getSession({ req })

            // التحقق من الجلسة
            if (!session || !session.user) {
                return res.status(401).json({
                    error: 'غير مصرح - يجب تسجيل الدخول أولاً',
                    code: 'UNAUTHORIZED',
                })
            }

            // استخراج tenantId من:
            // 1. JWT Token (الأولوية الأعلى)
            // 2. Request body (للـ POST/PUT)
            // 3. Query parameters
            // 4. Headers
            let requestTenantId = null

            // من JWT
            if (session.user.tenantId) {
                requestTenantId = session.user.tenantId
            }

            // من Body (إن كان POST/PUT)
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                if (req.body?.tenantId) {
                    // التحقق من أن المستخدم لا يحاول تغيير tenantId
                    if (req.body.tenantId.toString() !== requestTenantId?.toString()) {
                        console.warn(`🚨 محاولة تعديل tenantId من ${session.user.email}`)
                        return res.status(403).json({
                            error: 'غير مصرح - لا يمكن تغيير معرف المستأجر',
                            code: 'FORBIDDEN',
                        })
                    }
                }
            }

            // من Query (للـ GET)
            if (req.method === 'GET' && req.query?.tenantId) {
                if (req.query.tenantId.toString() !== requestTenantId?.toString()) {
                    console.warn(`🚨 محاولة وصول غير مصرح من ${session.user.email} للمستأجر ${req.query.tenantId}`)
                    return res.status(403).json({
                        error: 'غير مصرح للوصول لهذا المستأجر',
                        code: 'FORBIDDEN',
                    })
                }
            }

            // من Headers
            const headerTenantId = req.headers['x-tenant-id']
            if (headerTenantId && headerTenantId.toString() !== requestTenantId?.toString()) {
                console.warn(`🚨 محاولة وصول بـ tenant header غير صحيح من ${session.user.email}`)
                return res.status(403).json({
                    error: 'معرف المستأجر في الـ header غير متطابق',
                    code: 'FORBIDDEN',
                })
            }

            // إضافة معلومات tenant و user للـ request
            req.tenantId = parseInt(requestTenantId) || 1
            req.currentUser = session.user
            req.session = session

            // تسجيل الطلب
            console.log(`✅ [${req.method}] ${req.url} - User: ${session.user.email} - Tenant: ${req.tenantId}`)

            // تنفيذ الـ handler
            return await handler(req, res)
        } catch (error) {
            console.error('❌ Tenant Isolation Middleware Error:', error)
            return res.status(500).json({
                error: 'خطأ في معالجة الطلب',
                code: 'INTERNAL_ERROR',
            })
        }
    }
}

/**
 * Middleware لتسجيل جميع محاولات الوصول
 */
export function withAccessLogging(handler) {
    return async (req, res) => {
        const startTime = Date.now()

        // تسجيل الطلب الداخل
        console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.url}`)

        // الاستجابة الأصلية
        const originalJson = res.json.bind(res)

        // تسجيل الاستجابة
        res.json = function (data) {
            const duration = Date.now() - startTime
            console.log(`📤 Response - Status: ${res.statusCode}, Duration: ${duration}ms`)
            return originalJson(data)
        }

        return await handler(req, res)
    }
}

/**
 * Middleware للتحقق من أن البيانات المُرسلة تحتوي على tenantId صحيح
 */
export function withDataValidation(handler) {
    return async (req, res) => {
        try {
            // فقط للـ POST و PUT
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                if (!req.body) {
                    return res.status(400).json({
                        error: 'البيانات مطلوبة',
                        code: 'BAD_REQUEST',
                    })
                }

                // التحقق من أن البيانات هي JSON صحيح
                if (typeof req.body !== 'object') {
                    return res.status(400).json({
                        error: 'البيانات يجب أن تكون JSON',
                        code: 'BAD_REQUEST',
                    })
                }
            }

            return await handler(req, res)
        } catch (error) {
            console.error('❌ Data Validation Error:', error)
            return res.status(400).json({
                error: 'خطأ في التحقق من البيانات',
                code: 'VALIDATION_ERROR',
            })
        }
    }
}

/**
 * دالة مساعدة لدمج عدة middlewares
 */
export function withMiddleware(...middlewares) {
    return function (handler) {
        return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
    }
}

/**
 * استخدام في API route:
 * 
 * ```javascript
 * import { withTenantIsolation, withAccessLogging } from '@/lib/api/tenantMiddleware'
 * 
 * export default withTenantIsolation(withAccessLogging(async (req, res) => {
 *     // req.tenantId - معرف المستأجر الحالي
 *     // req.currentUser - بيانات المستخدم الحالي
 *     // req.session - بيانات الجلسة الكاملة
 *     
 *     if (req.method === 'POST') {
 *         // عملية الكتابة
 *         return res.json({ 
 *             success: true, 
 *             tenantId: req.tenantId,
 *             data: { ... }
 *         })
 *     }
 *     
 *     if (req.method === 'GET') {
 *         // عملية القراءة
 *         return res.json({ 
 *             success: true,
 *             tenantId: req.tenantId,
 *             data: [ ... ]
 *         })
 *     }
 * }))
 * ```
 */
