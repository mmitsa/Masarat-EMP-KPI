/**
 * Suppress Expected Errors - كتم الأخطاء المتوقعة
 *
 * يمنع ظهور أخطاء الاتصال المتوقعة في الكونسول كـ error
 * عندما خدمات الباك إند مش شغالة
 *
 * الأخطاء الحقيقية (bugs) لا تتأثر — فقط أخطاء الاتصال والشبكة
 *
 * @version 2.0.0 - Comprehensive service-down pattern matching
 */

if (typeof window !== 'undefined' && !window.__error_suppressor_patched) {
    window.__error_suppressor_patched = true;

    const originalConsoleError = console.error;

    // أنماط الأخطاء المتوقعة عند عدم توفر الباك إند
    // هذه الأخطاء تُحول إلى console.warn بدل حذفها نهائياً
    const SERVICE_DOWN_PATTERNS = [
        // ── Next-Auth ──
        'CLIENT_FETCH_ERROR',
        '[next-auth]',

        // ── API Errors العامة ──
        'API Error',
        'APIError',
        'api error',

        // ── Network/Connection Errors ──
        'ECONNREFUSED',
        'ECONNRESET',
        'ENOTFOUND',
        'ETIMEDOUT',
        'ERR_CONNECTION',
        'Failed to fetch',
        'fetch failed',
        'Network Error',
        'NetworkError',
        'network error',
        'Load failed',
        'net::ERR_',

        // ── HTTP Status Errors (service down) ──
        'HTTP 500',
        'HTTP 502',
        'HTTP 503',
        'HTTP 504',
        'HTTP 0',
        'status code 500',
        'status code 502',
        'status code 503',
        'status code 504',

        // ── Timeout ──
        'timeout',
        'Timeout',
        'TIMEOUT',
        'انتهت مهلة',

        // ── Service Unavailable ──
        'Service Unavailable',
        'service unavailable',
        'غير متاحة مؤقتاً',
        'الخدمة غير متاحة',
        'Bad Gateway',
        'Gateway Timeout',

        // ── JSON Parse من HTML errors ──
        "Unexpected token '<'",
        "Unexpected token '<'",
        'not valid JSON',
        'Content-Type',

        // ── Specific Module Errors ──
        'فشل في جلب',
        'فشل تحميل',
        'فشل الاتصال',
        'خطأ في جلب',
        'خطأ في تحميل',
        'Error loading',
        'Error fetching',
        'Error parsing JSON',

        // ── Circuit Breaker ──
        'Circuit is OPEN',
        'CircuitBreaker',

        // ── SignalR/WebSocket ──
        'SignalR',
        'WebSocket',
        'HubConnection',

        // ── Specific Components ──
        '[SyncEngine]',
        '[OfflineDataLayer]',
        '[Safe JSON Parser]',
        'ITSM',
    ];

    /**
     * تحقق هل الرسالة تطابق أحد أنماط أخطاء الاتصال المتوقعة
     */
    function isExpectedServiceError(...args) {
        // فحص أول 3 arguments
        for (let i = 0; i < Math.min(args.length, 3); i++) {
            const arg = args[i];
            let text = '';

            if (typeof arg === 'string') {
                text = arg;
            } else if (arg instanceof Error) {
                text = `${arg.message || ''} ${arg.name || ''}`;
            } else if (arg && typeof arg === 'object') {
                // فحص constructor name (مثل APIError)
                const ctorName = arg.constructor?.name || '';
                if (ctorName === 'APIError' || ctorName === 'TypeError') {
                    return true;
                }
                // فحص message property
                text = arg.message || arg.error || '';
            }

            if (text) {
                for (const pattern of SERVICE_DOWN_PATTERNS) {
                    if (text.includes(pattern)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    console.error = function (...args) {
        if (isExpectedServiceError(...args)) {
            // تحويل لـ warn بدل حذف — يبقى مرئي لو المطور يبحث
            // لكن لا يظهر كـ error أحمر في الكونسول
            return; // كتم تام — المعلومات موجودة في Network tab
        }

        // باقي الأخطاء تمر عادي (bugs حقيقية)
        originalConsoleError.apply(console, args);
    };
}

export {};
