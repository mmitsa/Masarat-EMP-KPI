/**
 * API Error Handler - معالج أخطاء واجهة برمجة التطبيقات
 * Handles all API errors with error codes and user-friendly messages
 * 
 * يوفر معالجة موحدة لجميع أخطاء API مع:
 * - ترميز تلقائي للأخطاء
 * - رسائل واضحة للمستخدم
 * - تسجيل مفصل للأخطاء
 * - إعادة محاولة تلقائية للطلبات الفاشلة
 */

import { getErrorInfo } from './errorCodes';
import { toast } from '../hooks/useToast';

/**
 * فئة خطأ API مخصصة
 * Custom API Error class
 */
export class APIError extends Error {
    constructor(message, errorCode, statusCode, response = null) {
        super(message);
        this.name = 'APIError';
        this.errorCode = errorCode;
        this.statusCode = statusCode;
        this.response = response;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * تحديد كود الخطأ بناءً على حالة HTTP
 * Determine error code based on HTTP status
 */
function getErrorCodeFromStatus(status, endpoint = '') {
    // أخطاء المصادقة
    if (status === 401) return 'AUTH-001-002'; // Session expired
    if (status === 403) return 'AUTH-002-001'; // Unauthorized
    
    // أخطاء الطلب
    if (status === 400) return 'API-004-001'; // Bad request
    if (status === 404) return 'API-003-001'; // Not found
    if (status === 408) return 'API-001-002'; // Timeout
    
    // أخطاء الخادم
    if (status === 500) return 'API-002-001'; // Internal server error
    if (status === 502 || status === 503 || status === 504) return 'API-001-001'; // Server connection error
    
    // أخطاء قاعدة البيانات (من رسائل الخادم)
    if (status === 409) return 'DB-003-001'; // Duplicate key
    
    // أخطاء خاصة بالوحدات
    if (endpoint.includes('/hr/')) {
        if (status === 404) return 'HR-001-001'; // Employee not found
        if (status === 409) return 'HR-001-002'; // Employee already exists
    }
    
    if (endpoint.includes('/warehouse/')) {
        if (status === 404) return 'WH-001-001'; // Product not available
    }
    
    // خطأ عام
    return 'API-002-001';
}

/**
 * تحليل خطأ الاستجابة واستخراج المعلومات
 * Parse error response and extract information
 */
async function parseErrorResponse(response, endpoint) {
    let errorData = null;
    let errorCode = 'UNKNOWN_ERROR';
    let message = 'حدث خطأ غير متوقع';
    
    // Handle undefined or null response
    if (!response) {
        console.error('parseErrorResponse: response is undefined or null');
        return { errorCode: 'ERROR-UNKNOWN', message: 'حدث خطأ غير محدد', errorData: null };
    }
    
    try {
        // Get error code from status
        if (response.status) {
            errorCode = getErrorCodeFromStatus(response.status, endpoint);
        }
        
        // Check if response has headers
        const contentType = response.headers?.get?.('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            try {
                errorData = await response.json?.call?.(response);
                
                // استخراج كود الخطأ من الاستجابة إذا كان موجوداً
                if (errorData?.errorCode) {
                    errorCode = errorData.errorCode;
                }
                
                // استخراج الرسالة
                message = errorData?.message || errorData?.error || errorData?.title || message;
                
                // معالجة أخطاء التحقق من ModelState
                if (errorData?.errors && typeof errorData.errors === 'object') {
                    const validationErrors = Object.entries(errorData.errors)
                    .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                    .join('\n');
                
                    if (validationErrors) {
                        message = validationErrors;
                        errorCode = 'VAL-001-001'; // Validation error
                    }
                }
            } catch (jsonError) {
                console.warn('Failed to parse response as JSON:', jsonError.message);
                // Try to read as text
                try {
                    const text = await response.text?.call?.(response);
                    if (text) {
                        message = text.substring(0, 200); // أول 200 حرف
                    }
                } catch (textError) {
                    console.warn('Failed to read response as text:', textError.message);
                }
            }
        } else {
            // محاولة قراءة النص
            try {
                const text = await response.text?.call?.(response);
                if (text) {
                    message = text.substring(0, 200); // أول 200 حرف
                }
            } catch (textError) {
                console.warn('Failed to read response as text:', textError.message);
            }
        }
    } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
    }
    
    return { errorCode, message, errorData };
}

/**
 * تسجيل الخطأ للمراقبة والتحليل
 * Log error for monitoring and analysis
 */
function logError(error, endpoint, method, requestData = null) {
    const errorLog = {
        timestamp: error.timestamp || new Date().toISOString(),
        errorCode: error.errorCode,
        statusCode: error.statusCode,
        message: error.message,
        endpoint,
        method,
        requestData: process.env.NODE_ENV === 'development' ? requestData : null, // لا نسجل البيانات في الإنتاج للخصوصية
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };

    // أخطاء الاتصال والخدمات غير المتاحة → warn فقط (متوقع عندما الخدمات مش شغالة)
    const isConnectionError = [0, 502, 503, 504, 408].includes(error.statusCode) ||
        error.errorCode?.startsWith('NET-') || error.errorCode?.startsWith('API-001');
    if (isConnectionError) {
        console.warn('⚠️ Service unavailable:', endpoint, error.message);
    } else {
        console.error('🔴 API Error:', errorLog);
    }
    
    // إرسال إلى خدمة المراقبة في الإنتاج
    if (process.env.NODE_ENV === 'production') {
        sendErrorToMonitoring(errorLog);
    }
    
    return errorLog;
}

/**
 * إرسال الخطأ إلى خدمة المراقبة
 * Send error to monitoring service
 */
async function sendErrorToMonitoring(errorLog) {
    try {
        // يمكن استبدال هذا بـ Sentry أو أي خدمة مراقبة أخرى
        await fetch('/api/logs/api-errors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorLog)
        });
    } catch (e) {
        console.error('Failed to send error to monitoring:', e);
    }
}

/**
 * عرض رسالة الخطأ للمستخدم
 * Display error message to user
 */
function showErrorToUser(errorCode, customMessage = null, showToast = true) {
    const errorInfo = getErrorInfo(errorCode);
    const message = customMessage || errorInfo.message_ar;
    
    if (showToast) {
        toast.error(message, {
            description: errorInfo.description_ar,
            action: errorInfo.solution_ar ? {
                label: 'الحل',
                onClick: () => {
                    toast.info(errorInfo.solution_ar);
                }
            } : null
        });
    }
    
    return {
        errorCode,
        message,
        errorInfo
    };
}

/**
 * معالج الأخطاء الرئيسي لـ API
 * Main API error handler
 */
export async function handleAPIError(error, endpoint = '', method = 'GET', options = {}) {
    const {
        showToast = false,
        silent = false,
        requestData = null
    } = options;
    
    let apiError;
    
    // معالجة أخطاء الشبكة
    if (!error.response && (error.message === 'Failed to fetch' || error.name === 'TypeError')) {
        const errorCode = 'NET-001-001'; // No internet
        const message = 'فقدان الاتصال بالإنترنت';
        
        apiError = new APIError(message, errorCode, 0);
        
        if (!silent) {
            logError(apiError, endpoint, method, requestData);
            if (showToast) showErrorToUser(errorCode, message);
        }
        
        throw apiError;
    }
    
    // معالجة أخطاء انتهاء الوقت
    if (error.name === 'AbortError' || error?.message?.includes('timeout')) {
        const errorCode = 'API-001-002'; // Timeout
        const message = 'انتهى وقت الانتظار للرد من الخادم';
        
        apiError = new APIError(message, errorCode, 408);
        
        if (!silent) {
            logError(apiError, endpoint, method, requestData);
            if (showToast) showErrorToUser(errorCode, message);
        }
        
        throw apiError;
    }
    
    // معالجة استجابات HTTP
    if (error.response) {
        const response = error.response;
        const { errorCode, message, errorData } = await parseErrorResponse(response, endpoint);
        
        apiError = new APIError(message, errorCode, response.status, errorData);
        
        if (!silent) {
            logError(apiError, endpoint, method, requestData);
            if (showToast) showErrorToUser(errorCode, message);
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // 401 من Backend: لا نعمل redirect أبداً من هنا!
        // الأسباب:
        // 1. إذا المستخدم مسجل دخول (NextAuth session صالحة) → 401 من backend
        //    يعني أن mock-token غير معروف للخدمة، وليس أن المستخدم غير مصادق.
        //    إعادة تسجيل الدخول لن تحل المشكلة → redirect loop.
        // 2. إذا المستخدم غير مسجل → middleware.js يتعامل مع ذلك server-side.
        // 3. إذا الجلسة انتهت → authenticatedFetch يتعامل مع ذلك.
        // ═══════════════════════════════════════════════════════════════════
        // لا redirect هنا - فقط نرمي الخطأ للمستدعي ليتعامل معه
        
        throw apiError;
    }
    
    // خطأ غير متوقع
    const errorCode = 'SYS-001-001';
    const message = error.message || 'حدث خطأ غير متوقع';
    
    apiError = new APIError(message, errorCode, 0);
    
    if (!silent) {
        logError(apiError, endpoint, method, requestData);
        if (showToast) showErrorToUser(errorCode, message);
    }
    
    throw apiError;
}

/**
 * Wrapper لـ fetch مع معالجة أخطاء تلقائية
 * Fetch wrapper with automatic error handling
 */
export async function fetchWithErrorHandling(url, options = {}) {
    const {
        method = 'GET',
        retries = 1,
        retryDelay = 1000,
        timeout = 30000,
        showToast = false,
        silent = false,
        ...fetchOptions
    } = options;
    
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            // إضافة timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, {
                ...fetchOptions,
                method,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // إذا كانت الاستجابة ناجحة
            if (response.ok) {
                return response;
            }
            
            // معالجة الخطأ
            lastError = { response };
            
            // عدم إعادة المحاولة للأخطاء 4xx (باستثناء 408, 429)
            if (response.status >= 400 && response.status < 500 && 
                response.status !== 408 && response.status !== 429) {
                break;
            }
            
        } catch (error) {
            lastError = error;
            
            // عدم إعادة المحاولة لأخطاء المصادقة
            if (error.response && error.response.status === 401) {
                break;
            }
        }
        
        // الانتظار قبل إعادة المحاولة (باستثناء المحاولة الأخيرة)
        if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
    }
    
    // معالجة الخطأ وإلقاؤه
    await handleAPIError(lastError, url, method, { showToast, silent, requestData: options.body });
}

/**
 * معالج أخطاء خاص بالوحدات
 * Module-specific error handler
 */
export function createModuleErrorHandler(moduleName, moduleErrorCodes = {}) {
    return async function (error, endpoint, method, options = {}) {
        // محاولة تحديد كود خطأ خاص بالوحدة
        if (error.response && moduleErrorCodes[error.response.status]) {
            const errorCode = moduleErrorCodes[error.response.status];
            const { message, errorData } = await parseErrorResponse(error.response, endpoint);
            
            const apiError = new APIError(message, errorCode, error.response.status, errorData);
            
            if (!options.silent) {
                logError(apiError, endpoint, method, options.requestData);
                if (options.showToast === true) {
                    showErrorToUser(errorCode, message);
                }
            }
            
            throw apiError;
        }
        
        // استخدام المعالج العام
        return handleAPIError(error, endpoint, method, options);
    };
}

/**
 * Hook لاستخدام معالج الأخطاء في المكونات
 * Hook to use error handler in components
 */
export function useAPIErrorHandler() {
    const handleError = async (error, options = {}) => {
        try {
            await handleAPIError(error, '', 'GET', options);
        } catch (apiError) {
            // الخطأ تم معالجته وعرضه للمستخدم
            return apiError;
        }
    };
    
    return { handleError };
}

export default {
    APIError,
    handleAPIError,
    fetchWithErrorHandling,
    createModuleErrorHandler,
    useAPIErrorHandler
};
