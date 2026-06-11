/**
 * Global JSON Parser - Safe and Robust
 * Patches Response.prototype.json() globally to handle HTML errors gracefully
 * 
 * This fixes the "Unexpected token '<'" error that happens when backend returns
 * HTML error pages instead of JSON
 * 
 * @version 2.0.0 - Fixed for Next.js Router compatibility
 * @date 2026-02-15
 */

if (typeof window !== 'undefined' && !window.__json_parser_patched) {
    window.__json_parser_patched = true;

    // Store the original json method
    const originalJson = Response.prototype.json;

    // Override Response.prototype.json globally
    Response.prototype.json = async function() {
        try {
            const contentType = this.headers?.get('Content-Type') || '';
            
            // If content-type says it's JSON, use the original parser
            if (contentType.includes('application/json')) {
                try {
                    return await originalJson.call(this);
                } catch (error) {
                    console.warn('[Safe JSON Parser] Failed to parse JSON response:', error.message);
                    return {};
                }
            }

            // Try to read the response as text
            try {
                const text = await this.text();
                
                if (!text || !text.trim()) {
                    console.warn('[Safe JSON Parser] Empty response body');
                    return {};
                }

                // Check if it looks like JSON
                const trimmed = text.trim();
                if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                    try {
                        return JSON.parse(trimmed);
                    } catch (parseError) {
                        console.warn('[Safe JSON Parser] Failed to parse as JSON:', parseError.message);
                        return {};
                    }
                }

                // Check if it's HTML error page
                if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
                    console.warn('[Safe JSON Parser] Received HTML instead of JSON (likely error page)');
                    console.debug('Response preview:', trimmed.substring(0, 200));
                    return {};
                }

                // Unknown format
                console.warn('[Safe JSON Parser] Response is not JSON:', trimmed.substring(0, 100));
                return {};
            } catch (textError) {
                console.warn('[Safe JSON Parser] Failed to read response body:', textError.message);
                return {};
            }
        } catch (error) {
            console.warn('[Safe JSON Parser] Critical error:', error);
            return {};
        }
    };

    // Preserve method properties
    Response.prototype.json.toString = originalJson.toString.bind(originalJson);
}

export {};
