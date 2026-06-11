/**
 * Safe API Call Wrapper
 * يوفر طبقة حماية شاملة لكل استدعاءات API في Contexts
 */

import { getSession } from 'next-auth/react';

/**
 * تنفيذ استدعاء API بشكل آمن مع معالجة شاملة للأخطاء
 * @param {Function} apiCall - دالة API للاستدعاء
 * @param {Object} options - خيارات إضافية
 * @returns {Promise<{success: boolean, data: any, error: string}>}
 */
export async function safeApiCall(apiCall, options = {}) {
    const {
        requireSession = true,
        fallbackData = null,
        onError = null,
        silent = false,
    } = options;

    try {
        // التحقق من الجلسة إذا كانت مطلوبة
        if (requireSession) {
            const session = await getSession();
            if (!session) {
                if (!silent) {
                    console.warn('[SafeAPI] No active session, skipping API call');
                }
                return {
                    success: false,
                    data: fallbackData,
                    error: 'لا توجد جلسة نشطة',
                };
            }
        }

        // تنفيذ استدعاء API
        const result = await apiCall();

        return {
            success: true,
            data: result,
            error: null,
        };
    } catch (error) {
        if (!silent) {
            console.warn('[SafeAPI] API call failed:', error);
        }

        // استدعاء callback معالج الخطأ إذا كان موجوداً
        if (onError) {
            try {
                onError(error);
            } catch (callbackError) {
                console.warn('[SafeAPI] Error callback failed:', callbackError);
            }
        }

        return {
            success: false,
            data: fallbackData,
            error: error.message || 'حدث خطأ أثناء الاتصال بالخادم',
        };
    }
}

/**
 * تنفيذ استدعاء API فقط إذا كانت هناك جلسة نشطة
 * @param {Function} apiCall - دالة API للاستدعاء
 * @returns {Promise<any|null>} - نتيجة API أو null
 */
export async function safeApiCallWithSession(apiCall) {
    const session = await getSession();
    if (!session) {
        return null;
    }

    try {
        return await apiCall();
    } catch (error) {
        console.warn('[SafeAPI] API call with session failed:', error);
        return null;
    }
}

/**
 * معالج أخطاء شامل للـ useEffect في Contexts
 * @param {Function} effectFn - دالة effect للتنفيذ
 * @param {string} contextName - اسم Context للـ logging
 */
export function safeUseEffectWrapper(effectFn, contextName = 'Unknown') {
    return async () => {
        try {
            await effectFn();
        } catch (error) {
            console.warn(`[${contextName}] Effect error:`, error);
            // لا نرمي الخطأ لمنع كسر التطبيق
        }
    };
}

/**
 * التحقق من توفر feature بناءً على environment variables
 * @param {string} featureName - اسم الـ feature
 * @returns {boolean}
 */
export function isFeatureEnabled(featureName) {
    const envKey = `NEXT_PUBLIC_ENABLE_${featureName.toUpperCase()}`;
    const value = process.env[envKey];
    
    // افتراضياً، كل الـ features مفعلة إلا إذا تم تعطيلها صراحةً
    if (value === undefined || value === null) {
        return true;
    }
    
    return value === 'true' || value === '1';
}
