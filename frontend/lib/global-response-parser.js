/**
 * Global Response Parser Interceptor
 * Patches fetch() globally to safely parse JSON
 * المقاطع العام لتحليل الاستجابات
 * 
 * @version 1.0.0
 * @date 2026-02-15
 */

if (typeof window !== 'undefined' && !window.__response_parser_patched) {
    window.__response_parser_patched = true;

    const originalFetch = window.fetch;

    window.fetch = function (...args) {
        return originalFetch.apply(this, args).then((response) => {
            // Create a proxy for the response to intercept .json() calls
            return new Proxy(response, {
                get(target, prop) {
                    if (prop === 'json') {
                        return async function() {
                            try {
                                const contentType = target.headers?.get('Content-Type') || '';
                                
                                // Check if response is actually JSON
                                if (!contentType.includes('application/json')) {
                                    // Bind text method to ensure context is maintained
                                    const text = await target.text.call(target);
                                    
                                    // Try to parse as JSON anyway
                                    try {
                                        const trimmed = text.trim();
                                        if (!trimmed) {
                                            return {};
                                        }
                                        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                                            return JSON.parse(trimmed);
                                        }
                                    } catch (parseErr) {
                                        // Not JSON, log and return empty
                                        console.warn(`Response is not JSON (${contentType}):`, text.substring(0, 200));
                                        return {};
                                    }
                                    
                                    // If we get here, it's not JSON
                                    return {};
                                }

                                // It's JSON, parse normally with bound context
                                return await target.json.call(target);
                            } catch (error) {
                                console.warn('Safe JSON parse error:', error);
                                return {};
                            }
                        };
                    }
                    
                    // Return the original property
                    return Reflect.get(target, prop);
                },
            });
        });
    };

    // Preserve fetch properties
    window.fetch.toString = function() {
        return originalFetch.toString();
    };
}

export {};
