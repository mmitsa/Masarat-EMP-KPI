/**
 * Safe Response Parser for API Routes
 * استخدمه في pages/api/* للتعامل الآمن مع الاستجابات
 */

export async function safeFetchJson(response) {
    try {
        const contentType = response.headers.get('Content-Type') || '';
        
        if (!contentType.includes('application/json')) {
            const text = await response.text();
            try {
                const trimmed = text.trim();
                if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                    return JSON.parse(trimmed);
                }
            } catch (e) {
                console.warn('Failed to parse response as JSON:', e);
                return null;
            }
            return null;
        }

        return await response.json();
    } catch (error) {
        console.warn('Safe fetch JSON error:', error);
        return null;
    }
}

export default safeFetchJson;
