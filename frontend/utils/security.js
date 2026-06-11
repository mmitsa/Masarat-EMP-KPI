/**
 * Security Utilities - أدوات الأمان
 * 
 * حماية من XSS, CSRF, وهجمات الحقن
 * 
 * @version 1.0.0
 * @date 2026-02-07
 */

/**
 * تنظيف النص من HTML الخطير (XSS Protection)
 */
export function sanitizeHTML(html) {
    if (!html) return '';
    
    // إنشاء عنصر مؤقت
    const temp = document.createElement('div');
    temp.textContent = html;
    
    return temp.innerHTML;
}

/**
 * تنظيف متقدم مع السماح ببعض التاجات
 */
export function sanitizeHTMLAdvanced(html, allowedTags = ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'a']) {
    if (!html) return '';
    
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // إزالة جميع السكريبتات
    const scripts = temp.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // إزالة التاجات غير المسموح بها
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(el => {
        if (!allowedTags.includes(el.tagName.toLowerCase())) {
            // استبدال بالمحتوى النصي فقط
            el.replaceWith(document.createTextNode(el.textContent));
        }
    });
    
    // إزالة السمات الخطيرة
    const elements = temp.querySelectorAll('[onclick], [onload], [onerror], [onmouseover]');
    elements.forEach(el => {
        el.removeAttribute('onclick');
        el.removeAttribute('onload');
        el.removeAttribute('onerror');
        el.removeAttribute('onmouseover');
    });
    
    return temp.innerHTML;
}

/**
 * تنظيف المدخلات النصية
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .trim()
        // إزالة الأحرف الخطيرة
        .replace(/[<>]/g, '')
        // إزالة JavaScript
        .replace(/javascript:/gi, '')
        // إزالة on* events
        .replace(/on\w+\s*=/gi, '');
}

/**
 * التحقق من صحة البريد الإلكتروني
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * التحقق من صحة رقم الهاتف السعودي
 */
export function isValidSaudiPhone(phone) {
    const phoneRegex = /^(05|5)[0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * التحقق من صحة رقم الهوية الوطنية السعودي
 */
export function isValidSaudiID(id) {
    if (!id || id.length !== 10) return false;
    
    const idRegex = /^[12]\d{9}$/;
    return idRegex.test(id);
}

/**
 * التحقق من صحة IBAN السعودي
 */
export function isValidSaudiIBAN(iban) {
    if (!iban) return false;
    
    // إزالة المسافات
    iban = iban.replace(/\s/g, '');
    
    // IBAN السعودي يبدأ بـ SA ويتكون من 24 حرف
    const ibanRegex = /^SA\d{22}$/;
    return ibanRegex.test(iban);
}

/**
 * التحقق من قوة كلمة المرور
 */
export function validatePasswordStrength(password) {
    const result = {
        score: 0,
        feedback: [],
        isStrong: false,
    };
    
    if (password.length < 8) {
        result.feedback.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    } else {
        result.score += 1;
    }
    
    if (!/[a-z]/.test(password)) {
        result.feedback.push('يجب أن تحتوي على حرف صغير');
    } else {
        result.score += 1;
    }
    
    if (!/[A-Z]/.test(password)) {
        result.feedback.push('يجب أن تحتوي على حرف كبير');
    } else {
        result.score += 1;
    }
    
    if (!/[0-9]/.test(password)) {
        result.feedback.push('يجب أن تحتوي على رقم');
    } else {
        result.score += 1;
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        result.feedback.push('يجب أن تحتوي على رمز خاص');
    } else {
        result.score += 1;
    }
    
    result.isStrong = result.score >= 4;
    
    return result;
}

/**
 * توليد CSRF Token
 */
export function generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * حفظ CSRF Token
 */
export function setCSRFToken(token) {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('csrf_token', token);
    }
}

/**
 * الحصول على CSRF Token
 */
export function getCSRFToken() {
    if (typeof window !== 'undefined') {
        return sessionStorage.getItem('csrf_token');
    }
    return null;
}

/**
 * تشفير البيانات الحساسة باستخدام AES-GCM (للتخزين المحلي)
 */
export async function encryptSensitiveData(data, password) {
    try {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(JSON.stringify(data));

        // اشتقاق مفتاح من كلمة المرور
        const keyMaterial = await crypto.subtle.importKey(
            'raw', encoder.encode(password || 'masarat-local-key'),
            { name: 'PBKDF2' }, false, ['deriveKey']
        );
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
        );

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv }, key, encoded
        );

        // تجميع salt + iv + encrypted في Base64
        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);

        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption failed:', error);
        return null;
    }
}

/**
 * فك تشفير البيانات باستخدام AES-GCM
 */
export async function decryptSensitiveData(encryptedData, password) {
    try {
        const encoder = new TextEncoder();
        const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const data = combined.slice(28);

        const keyMaterial = await crypto.subtle.importKey(
            'raw', encoder.encode(password || 'masarat-local-key'),
            { name: 'PBKDF2' }, false, ['deriveKey']
        );
        const key = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv }, key, data
        );

        return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (error) {
        console.error('Decryption failed:', error);
        return null;
    }
}

/**
 * Rate Limiting - تحديد معدل الطلبات
 */
class RateLimiter {
    constructor(maxRequests = 100, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }
    
    isAllowed(identifier) {
        const now = Date.now();
        const userRequests = this.requests.get(identifier) || [];
        
        // إزالة الطلبات القديمة
        const validRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);
        
        if (validRequests.length >= this.maxRequests) {
            return false;
        }
        
        validRequests.push(now);
        this.requests.set(identifier, validRequests);
        
        return true;
    }
    
    getRemainingRequests(identifier) {
        const userRequests = this.requests.get(identifier) || [];
        const now = Date.now();
        const validRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);
        
        return Math.max(0, this.maxRequests - validRequests.length);
    }
    
    reset(identifier) {
        this.requests.delete(identifier);
    }
}

// Instance عامة
export const apiRateLimiter = new RateLimiter(100, 60000); // 100 طلب في الدقيقة

/**
 * تنظيف URL من المحتوى الخطير
 */
export function sanitizeURL(url) {
    if (!url) return '';
    
    try {
        const urlObj = new URL(url);
        
        // السماح فقط بـ HTTP/HTTPS
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return '';
        }
        
        return urlObj.toString();
    } catch (error) {
        return '';
    }
}

/**
 * @deprecated SQL Injection يُمنع في Backend فقط عبر Parameterized Queries.
 * هذه الدالة محتفظ بها للتوافق الخلفي فقط - لا تستخدمها في كود جديد.
 */
export function preventSQLInjection(input) {
    // SQL Injection prevention belongs in the backend via parameterized queries.
    // Client-side keyword removal is ineffective and breaks legitimate user input.
    return typeof input === 'string' ? input.trim() : input;
}

/**
 * التحقق من سلامة البيانات المرفوعة
 */
export function validateFileUpload(file, options = {}) {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB
        allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
        allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'],
    } = options;
    
    const errors = [];
    
    // التحقق من الحجم
    if (file.size > maxSize) {
        errors.push(`الملف كبير جداً. الحد الأقصى ${maxSize / 1024 / 1024}MB`);
    }
    
    // التحقق من النوع
    if (!allowedTypes.includes(file.type)) {
        errors.push(`نوع الملف غير مسموح. الأنواع المسموحة: ${allowedTypes.join(', ')}`);
    }
    
    // التحقق من الامتداد
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
        errors.push(`امتداد الملف غير مسموح. الامتدادات المسموحة: ${allowedExtensions.join(', ')}`);
    }
    
    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * تنظيف اسم الملف
 */
export function sanitizeFileName(fileName) {
    return fileName
        .replace(/[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF._-]/g, '_')
        .replace(/_{2,}/g, '_')
        .substring(0, 255);
}

export default {
    sanitizeHTML,
    sanitizeHTMLAdvanced,
    sanitizeInput,
    isValidEmail,
    isValidSaudiPhone,
    isValidSaudiID,
    isValidSaudiIBAN,
    validatePasswordStrength,
    generateCSRFToken,
    setCSRFToken,
    getCSRFToken,
    encryptSensitiveData,
    decryptSensitiveData,
    apiRateLimiter,
    sanitizeURL,
    preventSQLInjection,
    validateFileUpload,
    sanitizeFileName,
};
