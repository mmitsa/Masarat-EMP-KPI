/**
 * API Middleware - التحقق من الصلاحيات وRate Limiting
 * يجب استخدام هذه الدوال في جميع API endpoints
 */

import { getToken } from 'next-auth/jwt';

// ==========================================
// Rate Limiting Configuration
// ==========================================
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMITS = {
    default: 100,      // 100 requests per minute
    auth: 10,          // 10 auth attempts per minute
    upload: 20,        // 20 uploads per minute
    heavy: 30,         // 30 heavy operations per minute
};

/**
 * Rate Limiter - يمنع الطلبات الزائدة
 * @param {string} identifier - معرف المستخدم (IP أو userId)
 * @param {string} type - نوع الحد ('default', 'auth', 'upload', 'heavy')
 * @returns {object} { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(identifier, type = 'default') {
    const limit = RATE_LIMITS[type] || RATE_LIMITS.default;
    const now = Date.now();
    const key = `${type}:${identifier}`;

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
        record = {
            count: 0,
            resetAt: now + RATE_LIMIT_WINDOW,
        };
    }

    record.count++;
    rateLimitStore.set(key, record);

    // Clean up old entries periodically
    if (rateLimitStore.size > 10000) {
        const cutoff = now - RATE_LIMIT_WINDOW;
        for (const [k, v] of rateLimitStore.entries()) {
            if (v.resetAt < cutoff) {
                rateLimitStore.delete(k);
            }
        }
    }

    return {
        allowed: record.count <= limit,
        remaining: Math.max(0, limit - record.count),
        resetIn: Math.ceil((record.resetAt - now) / 1000),
    };
}

/**
 * الحصول على معرف العميل (IP أو User ID)
 */
export function getClientIdentifier(req) {
    // Try to get real IP from headers (for proxied requests)
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const ip = forwarded?.split(',')[0] || realIp || req.socket?.remoteAddress || 'unknown';
    return ip;
}

// ==========================================
// Authentication & Authorization Middleware
// ==========================================

/**
 * التحقق من أن المستخدم مسجل دخول
 * @param {object} req - Next.js request
 * @param {object} res - Next.js response
 * @returns {object|null} - Session object or null
 */
export async function requireAuth(req, res) {
    // استخدام getToken بدلاً من getServerSession لتجنب التبعية الدائرية
    // (api-middleware → [...nextauth] → admin/users → api-middleware)
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
        res.status(401).json({
            success: false,
            error: 'غير مصرح - يرجى تسجيل الدخول',
            code: 'UNAUTHORIZED',
        });
        return null;
    }

    // تحويل JWT token إلى شكل session مشابه لـ getServerSession
    const session = {
        user: {
            id: token.sub,
            name: token.name,
            email: token.email,
            tenantId: token.tenantId,
            tenantName: token.tenantName,
            permissions: token.permissions || [],
            roles: token.roles || [],
            departmentId: token.departmentId,
            department: token.department,
            position: token.position,
            allowedScreens: token.allowedScreens || [],
            allowedOperations: token.allowedOperations || {},
        },
        accessToken: token.accessToken,
    };

    return session;
}

/**
 * التحقق من أن المستخدم لديه صلاحية معينة
 * @param {object} req - Next.js request
 * @param {object} res - Next.js response
 * @param {string|string[]} permissions - الصلاحيات المطلوبة
 * @param {boolean} requireAll - هل يجب توفر جميع الصلاحيات
 * @returns {object|null} - Session object or null
 */
export async function requirePermission(req, res, permissions, requireAll = false) {
    const session = await requireAuth(req, res);
    if (!session) return null;

    const userPermissions = session.user?.permissions || [];
    const userRoles = session.user?.roles || [];

    // Super admin bypasses all permission checks
    if (userRoles.includes('super_admin')) {
        return session;
    }

    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

    const hasPermission = requireAll
        ? requiredPermissions.every(p => userPermissions.includes(p))
        : requiredPermissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
        res.status(403).json({
            success: false,
            error: 'ليس لديك الصلاحيات اللازمة لهذا الإجراء',
            code: 'FORBIDDEN',
            required: requiredPermissions,
        });
        return null;
    }

    return session;
}

/**
 * التحقق من أن المستخدم لديه دور معين
 * @param {object} req - Next.js request
 * @param {object} res - Next.js response
 * @param {string|string[]} roles - الأدوار المطلوبة
 * @returns {object|null} - Session object or null
 */
export async function requireRole(req, res, roles) {
    const session = await requireAuth(req, res);
    if (!session) return null;

    const userRoles = session.user?.roles || [];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    // Super admin bypasses all role checks
    if (userRoles.includes('super_admin')) {
        return session;
    }

    const hasRole = requiredRoles.some(r => userRoles.includes(r));

    if (!hasRole) {
        res.status(403).json({
            success: false,
            error: 'ليس لديك الدور المطلوب لهذا الإجراء',
            code: 'FORBIDDEN',
            required: requiredRoles,
        });
        return null;
    }

    return session;
}

// ==========================================
// CORS Configuration
// ==========================================
const ALLOWED_ORIGINS = [
    'http://localhost:3008',
    'http://localhost:3000',
    'https://masarat.sa',
    'https://dashboard.masarat.sa',
    'https://unified.mmit.sa',
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean);

/**
 * ضبط CORS headers باستخدام whitelist
 * @param {object} req - Next.js request
 * @param {object} res - Next.js response
 * @param {object} options - خيارات إضافية
 * @param {string[]} options.methods - HTTP methods المسموحة
 */
export function setCorsHeaders(req, res, options = {}) {
    const { methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] } = options;
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // ضمان ترميز UTF-8 لكل الاستجابات (دعم العربية)
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
}

// ==========================================
// Request Validation
// ==========================================

/**
 * التحقق من HTTP Method
 * @param {object} req - Next.js request
 * @param {object} res - Next.js response
 * @param {string[]} allowedMethods - المethods المسموحة
 * @returns {boolean}
 */
export function validateMethod(req, res, allowedMethods) {
    if (!allowedMethods.includes(req.method)) {
        res.setHeader('Allow', allowedMethods);
        res.status(405).json({
            success: false,
            error: `Method ${req.method} غير مسموح`,
            code: 'METHOD_NOT_ALLOWED',
            allowed: allowedMethods,
        });
        return false;
    }
    return true;
}

// ==========================================
// Combined Middleware Handler
// ==========================================

/**
 * Middleware Handler الشامل
 * يجمع جميع الفحوصات في دالة واحدة
 * 
 * @param {object} options - خيارات الـ middleware
 * @param {string[]} options.methods - HTTP methods المسموحة
 * @param {string|string[]} options.permissions - الصلاحيات المطلوبة
 * @param {string|string[]} options.roles - الأدوار المطلوبة
 * @param {string} options.rateLimit - نوع Rate Limit
 * @param {boolean} options.requireAuth - هل التسجيل مطلوب
 * 
 * @returns {function} - Middleware function
 * 
 * @example
 * // في ملف API
 * import { withMiddleware } from '@/lib/api-middleware';
 * 
 * export default withMiddleware({
 *     methods: ['GET', 'POST'],
 *     permissions: 'hr:read',
 *     rateLimit: 'default',
 * })(async (req, res, session) => {
 *     // API logic here
 * });
 */
export function withMiddleware(options = {}) {
    const {
        methods = ['GET', 'POST', 'PUT', 'DELETE'],
        permissions = null,
        roles = null,
        rateLimit = 'default',
        requireAuth: authRequired = true,
        requireAll = false,
        allowDevAccess = true, // السماح بالوصول في بيئة التطوير
    } = options;

    return (handler) => async (req, res) => {
        try {
            // 0. Set CORS headers
            setCorsHeaders(req, res, { methods });

            // Handle preflight
            if (req.method === 'OPTIONS') {
                return res.status(200).end();
            }

            // 1. Check HTTP Method
            if (!validateMethod(req, res, methods)) {
                return;
            }

            // 2. Check Rate Limit
            const clientId = getClientIdentifier(req);
            const rateLimitResult = checkRateLimit(clientId, rateLimit);

            // Add rate limit headers
            res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
            res.setHeader('X-RateLimit-Reset', rateLimitResult.resetIn);

            if (!rateLimitResult.allowed) {
                return res.status(429).json({
                    success: false,
                    error: 'تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقاً',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: rateLimitResult.resetIn,
                });
            }

            // 3. Check Authentication
            let session = null;
            // ═══════════════════════════════════════════════════════════════════
            // ⚠️ تم إزالة Dev Mode Bypass لأسباب أمنية
            // يجب تسجيل الدخول حتى في بيئة التطوير
            // ═══════════════════════════════════════════════════════════════════

            if (authRequired) {
                if (permissions) {
                    session = await requirePermission(req, res, permissions, requireAll);
                } else if (roles) {
                    session = await requireRole(req, res, roles);
                } else {
                    session = await requireAuth(req, res);
                }

                if (!session) {
                    return; // Response already sent by auth functions
                }
            }

            // 4. Call the actual handler
            return await handler(req, res, session);

        } catch (error) {
            console.warn('API Middleware Error:', error);
            return res.status(500).json({
                success: false,
                error: 'حدث خطأ في الخادم',
                code: 'INTERNAL_ERROR',
                ...(process.env.NODE_ENV === 'development' && {
                    details: error.message,
                }),
            });
        }
    };
}

/**
 * Helper للـ API routes بدون authentication
 */
export function withPublicMiddleware(options = {}) {
    return withMiddleware({
        ...options,
        requireAuth: false,
    });
}

export default {
    withMiddleware,
    withPublicMiddleware,
    requireAuth,
    requirePermission,
    requireRole,
    checkRateLimit,
    validateMethod,
    setCorsHeaders,
};
