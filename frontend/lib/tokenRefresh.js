/**
 * تجديد التوكن - Token Refresh
 * يتأكد من صلاحية JWT قبل المزامنة
 * يجدد التوكن تلقائياً عند الحاجة
 *
 * يُستخدم قبل كل عملية مزامنة لضمان صلاحية التوكن
 */

// ═══════════════════════════════════════════════════════════
// الثوابت
// ═══════════════════════════════════════════════════════════

/** مفتاح تخزين التوكن الرئيسي */
const AUTH_TOKEN_KEY = '@masarat/auth_token';

/** مفتاح تخزين توكن التجديد */
const REFRESH_TOKEN_KEY = '@masarat/refresh_token';

/** هامش الأمان قبل انتهاء التوكن - 5 دقائق */
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/** الحد الأقصى لمحاولات التجديد */
const MAX_REFRESH_RETRIES = 3;

/** عنوان API الأساسي — Browser: relative URLs; Server: direct Gateway */
const API_BASE = typeof window !== 'undefined'
    ? '' // Browser: relative URLs, proxied by Next.js
    : (typeof process !== 'undefined'
        ? (process.env?.INTERNAL_GATEWAY_URL || process.env?.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080')
        : 'http://localhost:8080');

/** مسار تجديد التوكن */
const REFRESH_ENDPOINT = '/api/identity/auth/refresh';

// ═══════════════════════════════════════════════════════════
// متغيرات داخلية
// ═══════════════════════════════════════════════════════════

/** قفل لمنع تجديد التوكن المتزامن */
let _isRefreshing = false;

/** وعد مشترك لطلبات التجديد المتزامنة */
let _refreshPromise = null;

// ═══════════════════════════════════════════════════════════
// دوال مساعدة داخلية
// ═══════════════════════════════════════════════════════════

/**
 * قراءة قيمة من التخزين المحلي بأمان
 * @param {string} key - مفتاح التخزين
 * @returns {string|null}
 */
function _getStoredValue(key) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return null;
    }
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

/**
 * حفظ قيمة في التخزين المحلي بأمان
 * @param {string} key - مفتاح التخزين
 * @param {string} value - القيمة
 */
function _setStoredValue(key, value) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(key, value);
    } catch (err) {
        console.warn('[تجديد التوكن] فشل حفظ القيمة:', err);
    }
}

/**
 * حذف قيمة من التخزين المحلي
 * @param {string} key - مفتاح التخزين
 */
function _removeStoredValue(key) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
        localStorage.removeItem(key);
    } catch {
        // تجاهل أخطاء الحذف
    }
}

/**
 * تحليل حمولة JWT بدون مكتبة خارجية
 * @param {string} token - توكن JWT
 * @returns {object|null} حمولة التوكن المحللة
 */
function _parseJwtPayload(token) {
    try {
        if (!token || typeof token !== 'string') return null;

        const parts = token.split('.');
        if (parts.length !== 3) return null;

        // فك تشفير Base64URL
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        // إضافة padding إذا لزم الأمر
        const padding = base64.length % 4;
        if (padding) {
            base64 += '='.repeat(4 - padding);
        }

        const payload = JSON.parse(atob(base64));
        return payload;
    } catch {
        return null;
    }
}

/**
 * الحصول على وقت انتهاء التوكن بالمللي ثانية
 * @param {string} token - توكن JWT
 * @returns {number|null} وقت الانتهاء بالمللي ثانية أو null إذا لا يمكن تحديده
 */
function _getTokenExpiry(token) {
    const payload = _parseJwtPayload(token);
    if (!payload || !payload.exp) return null;

    // exp في JWT هو بالثواني منذ Unix epoch
    return payload.exp * 1000;
}

// ═══════════════════════════════════════════════════════════
// الواجهة العامة - tokenRefresh
// ═══════════════════════════════════════════════════════════

export const tokenRefresh = {

    /**
     * التحقق مما إذا كان التوكن منتهي الصلاحية أو على وشك الانتهاء
     * يعتبر التوكن "على وشك الانتهاء" إذا كان سينتهي خلال 5 دقائق
     *
     * @returns {boolean} هل التوكن منتهي أو على وشك الانتهاء
     */
    isTokenExpiring() {
        const token = _getStoredValue(AUTH_TOKEN_KEY);

        if (!token) {
            // لا يوجد توكن أصلاً
            return true;
        }

        const expiry = _getTokenExpiry(token);

        if (!expiry) {
            // لا يمكن تحديد وقت الانتهاء - نعتبره منتهي للأمان
            console.warn('[تجديد التوكن] لا يمكن قراءة وقت انتهاء التوكن');
            return true;
        }

        const now = Date.now();
        const timeUntilExpiry = expiry - now;

        // التوكن منتهي أو سينتهي خلال 5 دقائق
        if (timeUntilExpiry <= EXPIRY_BUFFER_MS) {
            const minutesLeft = Math.max(0, Math.round(timeUntilExpiry / 60000));
            console.log(`[تجديد التوكن] التوكن سينتهي خلال ${minutesLeft} دقيقة - يحتاج تجديد`);
            return true;
        }

        return false;
    },

    /**
     * تجديد التوكن باستخدام refresh_token
     * يمنع طلبات التجديد المتزامنة (يستخدم قفل)
     *
     * @returns {Promise<string|null>} التوكن الجديد أو null عند الفشل
     */
    async refreshToken() {
        // منع طلبات التجديد المتزامنة
        if (_isRefreshing && _refreshPromise) {
            console.log('[تجديد التوكن] انتظار طلب تجديد قائم...');
            return _refreshPromise;
        }

        const refreshToken = _getStoredValue(REFRESH_TOKEN_KEY);

        if (!refreshToken) {
            console.warn('[تجديد التوكن] لا يوجد توكن تجديد - يرجى إعادة تسجيل الدخول');
            return null;
        }

        _isRefreshing = true;

        _refreshPromise = (async () => {
            let lastError = null;

            for (let attempt = 1; attempt <= MAX_REFRESH_RETRIES; attempt++) {
                try {
                    console.log(`[تجديد التوكن] محاولة التجديد ${attempt}/${MAX_REFRESH_RETRIES}...`);

                    const response = await fetch(`${API_BASE}${REFRESH_ENDPOINT}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            refreshToken: refreshToken,
                        }),
                    });

                    if (!response.ok) {
                        // إذا كان الخطأ 401 أو 403 فالتوكن المجدد أيضاً غير صالح
                        if (response.status === 401 || response.status === 403) {
                            console.warn('[تجديد التوكن] توكن التجديد غير صالح - يرجى إعادة تسجيل الدخول');
                            _removeStoredValue(AUTH_TOKEN_KEY);
                            _removeStoredValue(REFRESH_TOKEN_KEY);
                            return null;
                        }
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const result = await response.json();

                    // تخزين التوكن الجديد
                    const newToken = result.accessToken || result.token;
                    const newRefreshToken = result.refreshToken;

                    if (newToken) {
                        _setStoredValue(AUTH_TOKEN_KEY, newToken);
                        console.log('[تجديد التوكن] تم تجديد التوكن بنجاح');
                    }

                    if (newRefreshToken) {
                        _setStoredValue(REFRESH_TOKEN_KEY, newRefreshToken);
                    }

                    return newToken || null;
                } catch (err) {
                    lastError = err;
                    console.warn(`[تجديد التوكن] فشل المحاولة ${attempt}:`, err.message);

                    // انتظار قبل إعادة المحاولة (backoff تصاعدي)
                    if (attempt < MAX_REFRESH_RETRIES) {
                        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            console.warn('[تجديد التوكن] فشل جميع محاولات التجديد:', lastError?.message);
            return null;
        })();

        try {
            return await _refreshPromise;
        } finally {
            _isRefreshing = false;
            _refreshPromise = null;
        }
    },

    /**
     * الحصول على توكن صالح - يجدد تلقائياً إذا لزم الأمر
     * هذه الدالة الرئيسية التي يجب استخدامها قبل أي طلب API
     *
     * @returns {Promise<string>} توكن صالح
     * @throws {Error} إذا فشل الحصول على توكن صالح
     */
    async getValidToken() {
        const currentToken = _getStoredValue(AUTH_TOKEN_KEY);

        // لا يوجد توكن أصلاً
        if (!currentToken) {
            throw new Error('لا يوجد توكن مصادقة - يرجى تسجيل الدخول');
        }

        // التوكن صالح ولم يقترب من الانتهاء
        if (!this.isTokenExpiring()) {
            return currentToken;
        }

        // محاولة التجديد
        const newToken = await this.refreshToken();

        if (newToken) {
            return newToken;
        }

        // فشل التجديد - التحقق إذا كان التوكن الحالي لا يزال صالحاً
        const expiry = _getTokenExpiry(currentToken);
        if (expiry && expiry > Date.now()) {
            console.warn('[تجديد التوكن] فشل التجديد لكن التوكن الحالي لا يزال صالحاً');
            return currentToken;
        }

        throw new Error('انتهت صلاحية التوكن وفشل التجديد - يرجى إعادة تسجيل الدخول');
    },

    /**
     * التأكد من المصادقة قبل بدء المزامنة
     * يُستدعى من محرك المزامنة (SyncEngine) قبل كل دورة مزامنة
     *
     * @returns {Promise<boolean>} هل المستخدم مصادق بنجاح
     */
    async ensureAuthenticated() {
        try {
            const token = await this.getValidToken();
            return !!token;
        } catch (err) {
            console.warn('[تجديد التوكن] فشل التحقق من المصادقة:', err.message);

            // إرسال حدث لإخبار التطبيق بضرورة إعادة تسجيل الدخول
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('masarat:auth-expired', {
                    detail: { reason: err.message },
                }));
            }

            return false;
        }
    },

    /**
     * الحصول على معلومات التوكن الحالي (للتشخيص)
     *
     * @returns {{hasToken: boolean, hasRefreshToken: boolean, expiresAt: string|null, isExpiring: boolean}}
     */
    getTokenInfo() {
        const token = _getStoredValue(AUTH_TOKEN_KEY);
        const refreshToken = _getStoredValue(REFRESH_TOKEN_KEY);
        const expiry = token ? _getTokenExpiry(token) : null;

        return {
            hasToken: !!token,
            hasRefreshToken: !!refreshToken,
            expiresAt: expiry ? new Date(expiry).toISOString() : null,
            isExpiring: this.isTokenExpiring(),
        };
    },

    /**
     * حفظ التوكنات (يُستخدم بعد تسجيل الدخول)
     *
     * @param {string} accessToken - توكن الوصول
     * @param {string} refreshTokenValue - توكن التجديد
     */
    storeTokens(accessToken, refreshTokenValue) {
        if (accessToken) {
            _setStoredValue(AUTH_TOKEN_KEY, accessToken);
        }
        if (refreshTokenValue) {
            _setStoredValue(REFRESH_TOKEN_KEY, refreshTokenValue);
        }
    },

    /**
     * مسح جميع التوكنات (يُستخدم عند تسجيل الخروج)
     */
    clearTokens() {
        _removeStoredValue(AUTH_TOKEN_KEY);
        _removeStoredValue(REFRESH_TOKEN_KEY);
        _isRefreshing = false;
        _refreshPromise = null;
    },
};

export default tokenRefresh;
