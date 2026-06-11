/**
 * أمان التخزين المحلي - Offline Security
 * تشفير البيانات الحساسة في IndexedDB باستخدام Web Crypto API
 * تنظيف البيانات القديمة وإدارة حدود التخزين
 *
 * يستخدم AES-256-GCM للتشفير مع مفتاح مشتق من توكن المستخدم
 */

import { getOfflineDb } from './offlineDb';

// ═══════════════════════════════════════════════════════════
// ثوابت الأمان
// ═══════════════════════════════════════════════════════════

/** حد التخزين للويب - 100 ميجابايت */
const WEB_STORAGE_LIMIT = 100 * 1024 * 1024;

/** حد التحذير - 80 ميجابايت */
const WEB_STORAGE_WARNING = 80 * 1024 * 1024;

/** مدة الاحتفاظ بالبيانات - 30 يوم */
const DATA_RETENTION_DAYS = 30;

/** اسم خوارزمية التشفير */
const ENCRYPTION_ALGORITHM = 'AES-GCM';

/** طول مفتاح التشفير بالبت */
const KEY_LENGTH = 256;

/** طول متجه التهيئة (IV) بالبايت */
const IV_LENGTH = 12;

/** مفتاح تخزين مفتاح التشفير */
const CRYPTO_KEY_STORAGE = '@masarat/crypto_key_hash';

// ═══════════════════════════════════════════════════════════
// متغيرات داخلية
// ═══════════════════════════════════════════════════════════

/** مفتاح التشفير المحفوظ في الذاكرة فقط */
let _cryptoKey = null;

/** حالة توفر Web Crypto API */
let _isCryptoAvailable = false;

// ═══════════════════════════════════════════════════════════
// دوال مساعدة داخلية
// ═══════════════════════════════════════════════════════════

/**
 * التحقق من توفر Web Crypto API
 * @returns {boolean} هل الـ API متاح
 */
function _checkCryptoAvailability() {
    if (typeof window === 'undefined') return false;
    if (typeof crypto === 'undefined' || !crypto.subtle) return false;
    _isCryptoAvailable = true;
    return true;
}

/**
 * تحويل نص إلى ArrayBuffer
 * @param {string} str - النص المراد تحويله
 * @returns {ArrayBuffer}
 */
function _stringToBuffer(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

/**
 * تحويل ArrayBuffer إلى نص
 * @param {ArrayBuffer} buffer - المخزن المؤقت
 * @returns {string}
 */
function _bufferToString(buffer) {
    const decoder = new TextDecoder();
    return decoder.decode(buffer);
}

/**
 * تحويل ArrayBuffer إلى سلسلة Base64
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function _bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * تحويل سلسلة Base64 إلى ArrayBuffer
 * @param {string} base64
 * @returns {ArrayBuffer}
 */
function _base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * اشتقاق مفتاح تشفير من توكن المستخدم باستخدام PBKDF2
 * @param {string} token - توكن المستخدم
 * @returns {Promise<CryptoKey>}
 */
async function _deriveKeyFromToken(token) {
    if (!_isCryptoAvailable) {
        throw new Error('Web Crypto API غير متاح');
    }

    // استخدام SHA-256 لإنشاء هاش من التوكن كمادة أولية
    const tokenBuffer = _stringToBuffer(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', tokenBuffer);

    // استيراد الهاش كمفتاح خام لـ PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        hashBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    // ملح ثابت مشتق من اسم التطبيق (في الإنتاج يجب أن يكون عشوائي لكل مستخدم)
    const salt = _stringToBuffer('masarat-offline-encryption-salt-v1');

    // اشتقاق مفتاح AES-256-GCM
    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        {
            name: ENCRYPTION_ALGORITHM,
            length: KEY_LENGTH,
        },
        false, // غير قابل للاستخراج
        ['encrypt', 'decrypt']
    );

    return derivedKey;
}

/**
 * توليد متجه تهيئة عشوائي (IV)
 * @returns {Uint8Array}
 */
function _generateIV() {
    return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

// ═══════════════════════════════════════════════════════════
// الواجهة العامة - offlineSecurity
// ═══════════════════════════════════════════════════════════

export const offlineSecurity = {

    /**
     * الكيانات الحساسة التي لا يجب تخزينها محلياً أبداً
     * @type {string[]}
     */
    SENSITIVE_ENTITIES: ['salaries', 'bankAccounts', 'financialReports'],

    /**
     * تهيئة مفتاح التشفير من توكن المستخدم
     * يجب استدعاؤه عند تسجيل الدخول أو عند بدء التطبيق
     *
     * @param {string} userToken - توكن JWT الخاص بالمستخدم
     * @returns {Promise<boolean>} هل تمت التهيئة بنجاح
     */
    async initKey(userToken) {
        try {
            if (!_checkCryptoAvailability()) {
                console.warn('[أمان التخزين] Web Crypto API غير متاح - التشفير معطل');
                return false;
            }

            if (!userToken || typeof userToken !== 'string') {
                console.error('[أمان التخزين] التوكن غير صالح');
                return false;
            }

            // اشتقاق المفتاح من التوكن
            _cryptoKey = await _deriveKeyFromToken(userToken);

            // حفظ هاش التوكن للتحقق لاحقاً (ليس التوكن نفسه)
            const tokenHash = await crypto.subtle.digest(
                'SHA-256',
                _stringToBuffer(userToken)
            );
            const hashBase64 = _bufferToBase64(tokenHash);

            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(CRYPTO_KEY_STORAGE, hashBase64);
            }

            console.log('[أمان التخزين] تم تهيئة مفتاح التشفير بنجاح');
            return true;
        } catch (err) {
            console.error('[أمان التخزين] فشل تهيئة مفتاح التشفير:', err);
            _cryptoKey = null;
            return false;
        }
    },

    /**
     * تشفير البيانات قبل تخزينها في IndexedDB
     * يستخدم AES-256-GCM مع متجه تهيئة عشوائي لكل عملية تشفير
     *
     * @param {any} data - البيانات المراد تشفيرها (سيتم تحويلها إلى JSON)
     * @returns {Promise<string>} البيانات المشفرة كسلسلة Base64 (IV + البيانات المشفرة)
     */
    async encrypt(data) {
        // إذا لم يتوفر التشفير، نعيد البيانات كـ JSON عادي
        if (!_cryptoKey || !_isCryptoAvailable) {
            console.warn('[أمان التخزين] التشفير غير مفعل - تخزين البيانات بدون تشفير');
            return JSON.stringify({ _unencrypted: true, data });
        }

        try {
            const jsonStr = JSON.stringify(data);
            const dataBuffer = _stringToBuffer(jsonStr);
            const iv = _generateIV();

            // تشفير البيانات
            const encryptedBuffer = await crypto.subtle.encrypt(
                {
                    name: ENCRYPTION_ALGORITHM,
                    iv: iv,
                },
                _cryptoKey,
                dataBuffer
            );

            // دمج IV مع البيانات المشفرة
            const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(encryptedBuffer), iv.length);

            // تحويل إلى Base64 للتخزين
            const result = _bufferToBase64(combined.buffer);

            return JSON.stringify({ _encrypted: true, payload: result });
        } catch (err) {
            console.error('[أمان التخزين] فشل التشفير:', err);
            throw new Error('فشل تشفير البيانات');
        }
    },

    /**
     * فك تشفير البيانات المقروءة من IndexedDB
     *
     * @param {string} encryptedData - البيانات المشفرة (ناتج دالة encrypt)
     * @returns {Promise<any>} البيانات الأصلية بعد فك التشفير
     */
    async decrypt(encryptedData) {
        try {
            const parsed = JSON.parse(encryptedData);

            // إذا كانت البيانات غير مشفرة
            if (parsed._unencrypted) {
                return parsed.data;
            }

            // إذا لم يتوفر مفتاح التشفير
            if (!_cryptoKey || !_isCryptoAvailable) {
                console.error('[أمان التخزين] لا يمكن فك التشفير - المفتاح غير متاح');
                throw new Error('مفتاح التشفير غير متاح - يرجى إعادة تسجيل الدخول');
            }

            if (!parsed._encrypted || !parsed.payload) {
                // البيانات بتنسيق قديم غير مشفر
                return parsed;
            }

            // فصل IV عن البيانات المشفرة
            const combined = new Uint8Array(_base64ToBuffer(parsed.payload));
            const iv = combined.slice(0, IV_LENGTH);
            const encryptedBuffer = combined.slice(IV_LENGTH);

            // فك التشفير
            const decryptedBuffer = await crypto.subtle.decrypt(
                {
                    name: ENCRYPTION_ALGORITHM,
                    iv: iv,
                },
                _cryptoKey,
                encryptedBuffer
            );

            const jsonStr = _bufferToString(decryptedBuffer);
            return JSON.parse(jsonStr);
        } catch (err) {
            // إذا كان الخطأ بسبب تغير المفتاح (تسجيل دخول مختلف)
            if (err.name === 'OperationError') {
                console.error('[أمان التخزين] فشل فك التشفير - ربما تغير مفتاح التشفير');
                throw new Error('فشل فك التشفير - البيانات المحلية قد تكون من جلسة سابقة');
            }
            throw err;
        }
    },

    /**
     * فحص حدود التخزين المحلي
     * يُحذر عند 80 ميجابايت ويمنع عند 100 ميجابايت
     *
     * @returns {Promise<{used: number, limit: number, percentage: number, warning: boolean, blocked: boolean, message: string}>}
     */
    async checkStorageLimit() {
        const result = {
            used: 0,
            limit: WEB_STORAGE_LIMIT,
            percentage: 0,
            warning: false,
            blocked: false,
            message: '',
        };

        try {
            // استخدام Storage API الحديث
            if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                result.used = estimate.usage || 0;
            }

            result.percentage = Math.round((result.used / result.limit) * 100);

            // تحذير عند 80 ميجابايت
            if (result.used >= WEB_STORAGE_WARNING) {
                result.warning = true;
                const usedMB = Math.round(result.used / (1024 * 1024));
                result.message = `تحذير: التخزين المحلي يقترب من الحد الأقصى (${usedMB} ميجابايت من ${Math.round(WEB_STORAGE_LIMIT / (1024 * 1024))} ميجابايت)`;
                console.warn(`[أمان التخزين] ${result.message}`);
            }

            // منع التخزين عند 100 ميجابايت
            if (result.used >= WEB_STORAGE_LIMIT) {
                result.blocked = true;
                result.message = 'تم الوصول للحد الأقصى للتخزين المحلي. يرجى المزامنة أو حذف البيانات القديمة.';
                console.error(`[أمان التخزين] ${result.message}`);
            }
        } catch (err) {
            console.warn('[أمان التخزين] فشل فحص حدود التخزين:', err);
        }

        return result;
    },

    /**
     * تنظيف البيانات القديمة (أكثر من 30 يوم)
     * يحذف سجلات الحضور والعمليات المعلقة القديمة
     *
     * @returns {Promise<{deletedCount: number, freedSpace: string}>}
     */
    async cleanOldData() {
        let deletedCount = 0;

        try {
            const db = getOfflineDb();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - DATA_RETENTION_DAYS);
            const cutoffStr = cutoffDate.toISOString();
            const cutoffDateOnly = cutoffStr.split('T')[0];

            // 1. حذف سجلات الحضور القديمة
            try {
                const oldAttendances = await db.attendances
                    .where('date')
                    .below(cutoffDateOnly)
                    .count();
                if (oldAttendances > 0) {
                    await db.attendances.where('date').below(cutoffDateOnly).delete();
                    deletedCount += oldAttendances;
                }
            } catch (e) {
                console.warn('[أمان التخزين] فشل تنظيف الحضور القديم:', e);
            }

            // 2. حذف طلبات الإجازة القديمة المكتملة
            try {
                const allLeaves = await db.leaveRequests.toArray();
                const oldLeaves = allLeaves.filter(lr => {
                    const created = lr.createdAt || lr.requestDate;
                    return created && new Date(created) < cutoffDate;
                });
                if (oldLeaves.length > 0) {
                    await db.leaveRequests.bulkDelete(oldLeaves.map(l => l.id));
                    deletedCount += oldLeaves.length;
                }
            } catch (e) {
                console.warn('[أمان التخزين] فشل تنظيف الإجازات القديمة:', e);
            }

            // 3. حذف العمليات المعلقة القديمة أو الفاشلة كثيراً
            try {
                const allOps = await db.pendingOps.toArray();
                const oldOps = allOps.filter(op => {
                    // حذف العمليات الأقدم من 30 يوم
                    const isOld = op.createdAt && new Date(op.createdAt) < cutoffDate;
                    // حذف العمليات الفاشلة أكثر من 10 مرات
                    const isTooManyRetries = op.retryCount > 10;
                    return isOld || isTooManyRetries;
                });
                if (oldOps.length > 0) {
                    await db.pendingOps.bulkDelete(oldOps.map(op => op.id));
                    deletedCount += oldOps.length;
                }
            } catch (e) {
                console.warn('[أمان التخزين] فشل تنظيف العمليات القديمة:', e);
            }

            // 4. حذف حالات المزامنة القديمة جداً
            try {
                const allSync = await db.syncState.toArray();
                const oldSync = allSync.filter(s => {
                    return s.lastSyncAt && new Date(s.lastSyncAt) < cutoffDate;
                });
                if (oldSync.length > 0) {
                    for (const s of oldSync) {
                        await db.syncState.delete(s.entity);
                    }
                    deletedCount += oldSync.length;
                }
            } catch (e) {
                console.warn('[أمان التخزين] فشل تنظيف حالات المزامنة:', e);
            }

            const freedEstimate = deletedCount > 0
                ? `~${Math.round(deletedCount * 0.5)} كيلوبايت`
                : '0 كيلوبايت';

            if (deletedCount > 0) {
                console.log(`[أمان التخزين] تم تنظيف ${deletedCount} سجل قديم (تقدير المساحة المحررة: ${freedEstimate})`);
            }

            return { deletedCount, freedSpace: freedEstimate };
        } catch (err) {
            console.error('[أمان التخزين] فشل التنظيف العام:', err);
            return { deletedCount, freedSpace: '0 كيلوبايت' };
        }
    },

    /**
     * التحقق مما إذا كان نوع الكيان مسموحاً للتخزين المحلي
     * الكيانات الحساسة (الرواتب، الحسابات البنكية، التقارير المالية) ممنوعة
     *
     * @param {string} entityType - نوع الكيان
     * @returns {boolean} هل مسموح بالتخزين المحلي
     */
    isAllowedOffline(entityType) {
        if (!entityType || typeof entityType !== 'string') {
            return false;
        }

        const normalizedType = entityType.toLowerCase().trim();

        // فحص القائمة السوداء
        const isBlocked = this.SENSITIVE_ENTITIES.some(
            sensitive => normalizedType === sensitive.toLowerCase()
        );

        if (isBlocked) {
            console.warn(`[أمان التخزين] الكيان "${entityType}" محظور من التخزين المحلي - بيانات حساسة`);
        }

        return !isBlocked;
    },

    /**
     * مسح جميع البيانات المحلية (عند تسجيل الخروج)
     * يحذف كل محتويات IndexedDB ومفتاح التشفير
     *
     * @returns {Promise<void>}
     */
    async clearAllLocalData() {
        try {
            // حذف مفتاح التشفير من الذاكرة
            _cryptoKey = null;

            // حذف هاش المفتاح من localStorage
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(CRYPTO_KEY_STORAGE);
            }

            // حذف جميع بيانات IndexedDB
            const db = getOfflineDb();
            await db.delete();

            console.log('[أمان التخزين] تم مسح جميع البيانات المحلية بنجاح');
        } catch (err) {
            console.error('[أمان التخزين] فشل مسح البيانات المحلية:', err);
            throw err;
        }
    },

    /**
     * التحقق من حالة التشفير
     *
     * @returns {{available: boolean, keyLoaded: boolean, algorithm: string}}
     */
    getEncryptionStatus() {
        return {
            available: _isCryptoAvailable,
            keyLoaded: _cryptoKey !== null,
            algorithm: `${ENCRYPTION_ALGORITHM} (${KEY_LENGTH}-bit)`,
        };
    },
};

export default offlineSecurity;
