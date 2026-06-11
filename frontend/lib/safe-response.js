'use client';

/**
 * Safe Response Parsing Utility
 * Handles JSON parsing with comprehensive error handling
 * تحليل آمن للاستجابات مع معالجة شاملة للأخطاء
 * 
 * @version 1.0.0
 * @date 2026-02-15
 */

/**
 * Parse response safely - checks Content-Type before parsing JSON
 * @param {Response} response - Fetch response object
 * @param {object} options - Options ({ fallback: defaultValue, allowHTML: false })
 * @returns {Promise<object>}
 */
export async function safeParseResponse(response, options = {}) {
    const { 
        fallback = null, 
        allowHTML = false,
        logError = true 
    } = options;

    try {
        if (!response) {
            if (logError) console.warn('Response is null or undefined');
            return fallback;
        }

        const contentType = response.headers?.get('Content-Type') || '';
        const isJSON = contentType.includes('application/json');
        
        // Handle status codes
        if (!response.ok) {
            try {
                if (isJSON) {
                    const errorData = await response.json();
                    return fallback || { 
                        error: true, 
                        message: errorData?.message || `HTTP ${response.status}`,
                        status: response.status
                    };
                } else {
                    // Try to parse as JSON anyway
                    const text = await response.text();
                    const parsed = tryParseJSON(text);
                    if (parsed) {
                        return fallback || { 
                            error: true, 
                            message: parsed.message || `HTTP ${response.status}`,
                            status: response.status
                        };
                    }
                    return fallback || { 
                        error: true, 
                        message: `خدمة غير متاحة (${response.status})`,
                        status: response.status
                    };
                }
            } catch (e) {
                return fallback || { 
                    error: true, 
                    message: `خدمة غير متاحة`,
                    status: response.status
                };
            }
        }

        // Handle success with JSON
        if (isJSON) {
            return await response.json();
        }

        // Try parsing as JSON even if Content-Type doesn't say so
        const text = await response.text();
        const parsed = tryParseJSON(text);
        
        if (parsed) {
            return parsed;
        }

        // If it's HTML and we allow it, return it
        if (allowHTML && text.includes('<')) {
            if (logError) {
                console.warn('Response is HTML but allowHTML is true');
            }
            return { 
                error: true, 
                message: 'استجابة غير صحيحة من الخادم',
                isHTML: true 
            };
        }

        // Return empty object or fallback
        return fallback || {};

    } catch (error) {
        if (logError) {
            console.warn('Safe parse response error:', error);
        }
        return fallback || { 
            error: true, 
            message: 'فشل في معالجة استجابة الخادم',
            originalError: error.message 
        };
    }
}

/**
 * Try to parse text as JSON
 * @param {string} text
 * @returns {object|null}
 */
function tryParseJSON(text) {
    try {
        if (typeof text !== 'string' || !text) {
            return null;
        }
        const trimmed = text.trim();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
            return null;
        }
        return JSON.parse(trimmed);
    } catch (e) {
        return null;
    }
}

/**
 * Wrapper for fetch with safe JSON parsing
 * @param {string} url
 * @param {object} options - Fetch options + safe parse options
 * @returns {Promise<object>}
 */
export async function safeFetch(url, options = {}) {
    const { 
        fallback = null,
        allowHTML = false,
        ...fetchOptions 
    } = options;

    try {
        const response = await fetch(url, fetchOptions);
        return await safeParseResponse(response, { 
            fallback, 
            allowHTML,
            logError: true
        });
    } catch (error) {
        console.warn(`SafeFetch error for ${url}:`, error);
        return fallback || { 
            error: true, 
            message: 'خطأ في الاتصال',
            originalError: error.message 
        };
    }
}

/**
 * Concurrent fetch with fallback data
 * يجلب من عدة عناوين بالتوازي مع بيانات احتياطية
 * @param {Array} urls - Array of { url, fallback }
 * @returns {Promise<object>} - Combined results
 */
export async function concurrentSafeFetch(urls) {
    const results = {};
    
    const promises = urls.map(async (item) => {
        const { key, url, fallback = [] } = item;
        try {
            const data = await safeFetch(url, { fallback });
            results[key] = data;
        } catch (error) {
            console.warn(`Concurrent fetch error for ${key}:`, error);
            results[key] = fallback;
        }
    });

    await Promise.allSettled(promises);
    return results;
}

/**
 * Retry fetch with exponential backoff
 * @param {string} url
 * @param {object} options - { maxRetries, delay, backoff }
 * @returns {Promise<object>}
 */
export async function retryFetch(url, options = {}) {
    const { 
        maxRetries = 3, 
        delay = 1000, 
        backoff = 2,
        fallback = null,
        ...restOptions 
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, restOptions);
            return await safeParseResponse(response, { fallback });
        } catch (error) {
            lastError = error;
            
            if (attempt < maxRetries) {
                const waitTime = delay * Math.pow(backoff, attempt);
                console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${waitTime}ms for ${url}`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    console.warn(`All retries failed for ${url}:`, lastError);
    return fallback || { 
        error: true, 
        message: 'فشلت جميع محاولات الاتصال',
        originalError: lastError.message 
    };
}

export default {
    safeParseResponse,
    safeFetch,
    concurrentSafeFetch,
    retryFetch,
    tryParseJSON,
};
