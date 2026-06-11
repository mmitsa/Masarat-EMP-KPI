/**
 * Gateway Proxy Utility (Secured v2)
 *
 * يستخدم كـ catch-all proxy لتمرير الطلبات غير المعروفة
 * من Next.js إلى Gateway backend
 *
 * الحماية:
 * - Tenant ID من JWT فقط (لا يقبل من headers)
 * - Path validation ضد SSRF و path traversal
 * - Response header filtering
 * - Request timeout (15 ثانية)
 * - Rate limiting (100 req/min per tenant)
 */

import { getToken } from 'next-auth/jwt';

// ══════════════════════════════════════════════════════
// Rate Limiter بسيط (in-memory)
// ══════════════════════════════════════════════════════
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // دقيقة واحدة
const RATE_LIMIT_MAX = 100;             // 100 طلب في الدقيقة

function checkRateLimit(key) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || (now - entry.start) > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return false;
  return true;
}

// تنظيف Rate Limit Map كل 5 دقائق (منع تسرب الذاكرة)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if ((now - entry.start) > RATE_LIMIT_WINDOW_MS * 2) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

// ══════════════════════════════════════════════════════
// Headers المسموح بها في الاستجابة
// ══════════════════════════════════════════════════════
const SAFE_RESPONSE_HEADERS = [
  'content-type',
  'content-length',
  'cache-control',
  'etag',
  'last-modified',
  'x-request-id',
];

/**
 * التحقق من صحة المسار (ضد SSRF و path traversal)
 */
function isValidSubPath(subPath) {
  if (!subPath) return true;
  // منع path traversal
  if (subPath.includes('..')) return false;
  // منع أحرف خطيرة
  if (/[<>{}|\\^`\x00-\x1f]/.test(subPath)) return false;
  // منع بروتوكولات خارجية
  if (/^(https?|ftp|file|data):/i.test(subPath)) return false;
  // السماح فقط بأحرف آمنة: حروف، أرقام، شرطات، نقاط، خطوط مائلة
  if (!/^[a-zA-Z0-9\-._/]+$/.test(subPath)) return false;
  return true;
}

/**
 * إنشاء catch-all proxy handler لموديول معين
 * @param {string} moduleName - اسم الموديول (مثل 'hr', 'warehouse')
 * @param {object} options - خيارات إضافية
 * @param {string} options.gatewayPrefix - المسار في Gateway (افتراضي: `/api/${moduleName}`)
 * @param {boolean} options.requireAuth - هل يتطلب تسجيل دخول (افتراضي: true)
 * @param {string} options.errorMessage - رسالة الخطأ العربية
 * @param {number} options.timeout - المهلة بالمللي ثانية (افتراضي: 15000)
 */
export function createGatewayProxy(moduleName, options = {}) {
  const {
    gatewayPrefix = `/api/${moduleName}`,
    requireAuth = true,
    errorMessage = `خدمة ${moduleName} غير متاحة حالياً`,
    timeout = 15000,
  } = options;

  return async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // ═══ المصادقة عبر getToken (JWT) ═══
    let token = null;
    if (requireAuth) {
      token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'غير مصرح - يرجى تسجيل الدخول',
          code: 'UNAUTHORIZED',
        });
      }
    }

    try {
      // ═══ Tenant ID من JWT فقط (لا يقبل من headers - أمان) ═══
      const tenantId = token?.tenantId || '1';

      // ═══ Rate Limiting ═══
      const rateLimitKey = `${tenantId}:${token?.sub || 'anon'}`;
      if (!checkRateLimit(rateLimitKey)) {
        return res.status(429).json({
          success: false,
          error: 'تم تجاوز الحد الأقصى للطلبات. حاول بعد دقيقة.',
          code: 'RATE_LIMITED',
        });
      }

      // ═══ استخراج المسار والتحقق منه (ضد SSRF) ═══
      const { path } = req.query;
      const subPath = Array.isArray(path) ? path.join('/') : path || '';

      if (!isValidSubPath(subPath)) {
        return res.status(400).json({
          success: false,
          error: 'مسار غير صالح',
          code: 'INVALID_PATH',
        });
      }

      // ═══ بناء URL الهدف ═══
      const gatewayUrl =
        process.env.INTERNAL_GATEWAY_URL ||
        process.env.NEXT_PUBLIC_GATEWAY_URL ||
        'http://localhost:8080';

      const urlParts = req.url.split('?');
      const queryString = urlParts.length > 1 ? urlParts[1] : '';
      const targetUrl = `${gatewayUrl}${gatewayPrefix}/${subPath}${queryString ? `?${queryString}` : ''}`;

      // ═══ بناء خيارات الطلب مع Timeout ═══
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const fetchOptions = {
        method: req.method,
        signal: controller.signal,
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json',
          'Accept': req.headers['accept'] || 'application/json',
          'X-Tenant-Id': String(tenantId),
        },
      };

      // ═══ إضافة Authorization header ═══
      if (req.headers.authorization) {
        fetchOptions.headers['Authorization'] = req.headers.authorization;
      } else if (token?.accessToken) {
        fetchOptions.headers['Authorization'] = `Bearer ${token.accessToken}`;
      }

      // ═══ تمرير Body لغير GET/HEAD ═══
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        if (req.body) {
          fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }
      }

      const response = await fetch(targetUrl, fetchOptions);
      clearTimeout(timer);

      // ═══ تصفية Response Headers (فقط الآمنة) ═══
      for (const headerName of SAFE_RESPONSE_HEADERS) {
        const val = response.headers.get(headerName);
        if (val) {
          res.setHeader(headerName, val);
        }
      }

      // ═══ إرجاع الاستجابة ═══
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return res.status(response.status).json(data);
      } else {
        const text = await response.text();
        return res.status(response.status).send(text);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: `انتهت مهلة الاتصال بخدمة ${moduleName}`,
          code: 'TIMEOUT',
        });
      }
      console.warn(`[Gateway Proxy] Error proxying to ${moduleName}:`, error.message);
      return res.status(503).json({
        success: false,
        error: errorMessage,
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };
}
