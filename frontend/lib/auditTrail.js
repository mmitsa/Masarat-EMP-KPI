/**
 * سجل التدقيق المحلي - Offline Audit Trail
 * يسجل offlineCreatedAt مقابل syncedAt لكشف التلاعب
 * يسجل جميع العمليات المحلية للتتبع والمراجعة
 *
 * يُخزن السجلات في IndexedDB ويحتفظ بها لمدة 7 أيام
 */

import Dexie from 'dexie';

// ═══════════════════════════════════════════════════════════
// الثوابت
// ═══════════════════════════════════════════════════════════

/** مدة الاحتفاظ بسجلات التدقيق - 7 أيام */
const AUDIT_RETENTION_DAYS = 7;

/** الحد الأقصى للفرق المسموح بين وقت الإنشاء المحلي والوقت الفعلي - 24 ساعة */
const MAX_TIMESTAMP_DRIFT_MS = 24 * 60 * 60 * 1000;

/** الحد الأقصى لعدد السجلات في قاعدة البيانات */
const MAX_AUDIT_RECORDS = 10000;

// ═══════════════════════════════════════════════════════════
// قاعدة بيانات التدقيق (منفصلة عن قاعدة البيانات الرئيسية)
// ═══════════════════════════════════════════════════════════

class AuditDatabase extends Dexie {
    constructor() {
        super('MasaratAuditTrail');

        this.version(1).stores({
            // سجلات التدقيق
            auditLogs: '++id, entity, entityId, type, userId, offlineCreatedAt, syncedAt, [entity+entityId]',
            // ملخص التحقق من السلامة
            integrityChecks: '++id, entity, entityId, status, checkedAt',
        });
    }
}

// Singleton لقاعدة بيانات التدقيق
let _auditDb = null;

/**
 * الحصول على مثيل قاعدة بيانات التدقيق
 * @returns {AuditDatabase}
 */
function _getAuditDb() {
    if (!_auditDb) {
        _auditDb = new AuditDatabase();
    }
    return _auditDb;
}

// ═══════════════════════════════════════════════════════════
// دوال مساعدة داخلية
// ═══════════════════════════════════════════════════════════

/**
 * الحصول على معرف المستخدم الحالي من التخزين
 * @returns {string} معرف المستخدم أو 'unknown'
 */
function _getCurrentUserId() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return 'unknown';
    }

    try {
        // محاولة قراءة من التوكن
        const token = localStorage.getItem('@masarat/auth_token');
        if (token) {
            const parts = token.split('.');
            if (parts.length === 3) {
                let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                const padding = base64.length % 4;
                if (padding) base64 += '='.repeat(4 - padding);
                const payload = JSON.parse(atob(base64));
                return payload.sub || payload.userId || payload.nameid || 'unknown';
            }
        }
    } catch {
        // تجاهل أخطاء التحليل
    }

    return 'unknown';
}

/**
 * إنشاء بصمة هاش بسيطة للبيانات (للتحقق من السلامة)
 * @param {any} data - البيانات المراد حساب بصمتها
 * @returns {Promise<string>} بصمة الهاش
 */
async function _computeDataHash(data) {
    try {
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const encoder = new TextEncoder();
            const dataStr = JSON.stringify(data);
            const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(dataStr));
            const hashArray = new Uint8Array(hashBuffer);
            let hex = '';
            for (let i = 0; i < hashArray.length; i++) {
                hex += hashArray[i].toString(16).padStart(2, '0');
            }
            // أول 16 حرف فقط لتوفير المساحة
            return hex.substring(0, 16);
        }
    } catch {
        // fallback بدون Web Crypto
    }

    // هاش بسيط كبديل
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // تحويل إلى 32-bit
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

// ═══════════════════════════════════════════════════════════
// الواجهة العامة - auditTrail
// ═══════════════════════════════════════════════════════════

export const auditTrail = {

    /**
     * تسجيل عملية محلية في سجل التدقيق
     * يُستدعى عند كل عملية كتابة/تعديل/حذف محلية
     *
     * @param {object} operation - تفاصيل العملية
     * @param {string} operation.type - نوع العملية ('create' | 'update' | 'delete')
     * @param {string} operation.entity - نوع الكيان (مثل: 'employees', 'attendances')
     * @param {string|number} operation.entityId - معرف الكيان
     * @param {any} [operation.data] - البيانات المرتبطة بالعملية
     * @param {string} [operation.offlineCreatedAt] - وقت الإنشاء المحلي (ISO)
     * @param {string} [operation.userId] - معرف المستخدم
     * @returns {Promise<number>} معرف سجل التدقيق المُنشأ
     */
    async logOperation(operation) {
        try {
            const db = _getAuditDb();
            const now = new Date().toISOString();

            // حساب بصمة البيانات
            const dataHash = operation.data
                ? await _computeDataHash(operation.data)
                : null;

            const auditRecord = {
                type: operation.type || 'unknown',
                entity: operation.entity || 'unknown',
                entityId: String(operation.entityId || ''),
                // البيانات الأساسية فقط (بدون البيانات الكاملة لتوفير المساحة)
                dataSummary: operation.data ? {
                    hash: dataHash,
                    keys: typeof operation.data === 'object'
                        ? Object.keys(operation.data).slice(0, 10)
                        : [],
                    size: JSON.stringify(operation.data).length,
                } : null,
                offlineCreatedAt: operation.offlineCreatedAt || now,
                loggedAt: now,
                syncedAt: null, // يُحدّث عند المزامنة
                userId: operation.userId || _getCurrentUserId(),
                deviceInfo: {
                    userAgent: typeof navigator !== 'undefined'
                        ? navigator.userAgent.substring(0, 100)
                        : 'unknown',
                    isOnline: typeof navigator !== 'undefined'
                        ? navigator.onLine
                        : true,
                },
            };

            const id = await db.auditLogs.add(auditRecord);

            // فحص عدد السجلات وتنظيف إذا لزم الأمر
            const count = await db.auditLogs.count();
            if (count > MAX_AUDIT_RECORDS) {
                await this._trimOldRecords(db, count - MAX_AUDIT_RECORDS);
            }

            return id;
        } catch (err) {
            console.error('[سجل التدقيق] فشل تسجيل العملية:', err);
            // لا نرمي الخطأ - سجل التدقيق لا يجب أن يعطل العمليات الأساسية
            return -1;
        }
    },

    /**
     * جلب سجلات التدقيق لكيان محدد
     *
     * @param {string} entity - نوع الكيان
     * @param {string|number} entityId - معرف الكيان
     * @param {object} [options] - خيارات إضافية
     * @param {number} [options.limit=50] - الحد الأقصى للنتائج
     * @param {string} [options.fromDate] - من تاريخ (ISO)
     * @param {string} [options.toDate] - إلى تاريخ (ISO)
     * @returns {Promise<Array>} قائمة سجلات التدقيق
     */
    async getAuditLogs(entity, entityId, options = {}) {
        try {
            const db = _getAuditDb();
            const limit = options.limit || 50;

            let query = db.auditLogs
                .where('[entity+entityId]')
                .equals([entity, String(entityId)]);

            let results = await query.reverse().toArray();

            // تصفية حسب التاريخ إذا حُدد
            if (options.fromDate) {
                const from = new Date(options.fromDate).getTime();
                results = results.filter(r =>
                    new Date(r.offlineCreatedAt).getTime() >= from
                );
            }

            if (options.toDate) {
                const to = new Date(options.toDate).getTime();
                results = results.filter(r =>
                    new Date(r.offlineCreatedAt).getTime() <= to
                );
            }

            return results.slice(0, limit);
        } catch (err) {
            console.error(`[سجل التدقيق] فشل جلب السجلات لـ ${entity}/${entityId}:`, err);
            return [];
        }
    },

    /**
     * التحقق من سلامة عملية - كشف التلاعب بالتوقيت
     * يتحقق أن offlineCreatedAt معقول (ليس في المستقبل البعيد أو الماضي البعيد)
     *
     * @param {object} operation - العملية المراد التحقق منها
     * @param {string} operation.offlineCreatedAt - وقت الإنشاء المحلي
     * @param {string} [operation.entity] - نوع الكيان
     * @param {string|number} [operation.entityId] - معرف الكيان
     * @returns {Promise<{valid: boolean, issues: string[]}>}
     */
    async verifyIntegrity(operation) {
        const issues = [];
        const now = Date.now();

        try {
            // 1. التحقق من وجود offlineCreatedAt
            if (!operation.offlineCreatedAt) {
                issues.push('وقت الإنشاء المحلي مفقود');
                return { valid: false, issues };
            }

            const createdAt = new Date(operation.offlineCreatedAt).getTime();

            // 2. التحقق من صحة التاريخ
            if (isNaN(createdAt)) {
                issues.push('تنسيق وقت الإنشاء المحلي غير صالح');
                return { valid: false, issues };
            }

            // 3. التحقق أن الوقت ليس في المستقبل (مع هامش 5 دقائق)
            if (createdAt > now + (5 * 60 * 1000)) {
                issues.push(`وقت الإنشاء المحلي في المستقبل: ${operation.offlineCreatedAt}`);
            }

            // 4. التحقق أن الفرق بين الوقت المحلي والوقت الحالي معقول
            const drift = Math.abs(now - createdAt);
            if (drift > MAX_TIMESTAMP_DRIFT_MS) {
                const driftHours = Math.round(drift / (60 * 60 * 1000));
                issues.push(`فرق التوقيت كبير جداً: ${driftHours} ساعة - قد يكون هناك تلاعب`);
            }

            // 5. التحقق من التسلسل الزمني مع العمليات السابقة
            if (operation.entity && operation.entityId) {
                const previousLogs = await this.getAuditLogs(
                    operation.entity,
                    operation.entityId,
                    { limit: 1 }
                );

                if (previousLogs.length > 0) {
                    const lastLogTime = new Date(previousLogs[0].offlineCreatedAt).getTime();
                    if (createdAt < lastLogTime - (60 * 1000)) {
                        issues.push('وقت الإنشاء أقدم من آخر عملية مسجلة - ترتيب زمني غير منطقي');
                    }
                }
            }

            // تسجيل نتيجة الفحص
            const db = _getAuditDb();
            await db.integrityChecks.add({
                entity: operation.entity || 'unknown',
                entityId: String(operation.entityId || ''),
                status: issues.length === 0 ? 'valid' : 'suspicious',
                issues: issues,
                checkedAt: new Date().toISOString(),
            });

            return {
                valid: issues.length === 0,
                issues,
            };
        } catch (err) {
            console.error('[سجل التدقيق] فشل التحقق من السلامة:', err);
            issues.push(`خطأ في الفحص: ${err.message}`);
            return { valid: false, issues };
        }
    },

    /**
     * تنظيف سجلات التدقيق القديمة (أكثر من 7 أيام)
     *
     * @returns {Promise<{deletedLogs: number, deletedChecks: number}>}
     */
    async cleanOldLogs() {
        let deletedLogs = 0;
        let deletedChecks = 0;

        try {
            const db = _getAuditDb();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - AUDIT_RETENTION_DAYS);
            const cutoffStr = cutoffDate.toISOString();

            // حذف سجلات التدقيق القديمة
            const allLogs = await db.auditLogs.toArray();
            const oldLogs = allLogs.filter(log =>
                log.loggedAt && log.loggedAt < cutoffStr
            );

            if (oldLogs.length > 0) {
                await db.auditLogs.bulkDelete(oldLogs.map(l => l.id));
                deletedLogs = oldLogs.length;
            }

            // حذف فحوصات السلامة القديمة
            const allChecks = await db.integrityChecks.toArray();
            const oldChecks = allChecks.filter(check =>
                check.checkedAt && check.checkedAt < cutoffStr
            );

            if (oldChecks.length > 0) {
                await db.integrityChecks.bulkDelete(oldChecks.map(c => c.id));
                deletedChecks = oldChecks.length;
            }

            if (deletedLogs > 0 || deletedChecks > 0) {
                console.log(`[سجل التدقيق] تم تنظيف ${deletedLogs} سجل تدقيق و${deletedChecks} فحص سلامة`);
            }
        } catch (err) {
            console.error('[سجل التدقيق] فشل تنظيف السجلات القديمة:', err);
        }

        return { deletedLogs, deletedChecks };
    },

    /**
     * تحديث وقت المزامنة لسجل تدقيق
     * يُستدعى بعد نجاح المزامنة مع الخادم
     *
     * @param {number} auditLogId - معرف سجل التدقيق
     * @param {string} [syncedAt] - وقت المزامنة (ISO)، الافتراضي: الآن
     * @returns {Promise<void>}
     */
    async markSynced(auditLogId, syncedAt) {
        try {
            const db = _getAuditDb();
            await db.auditLogs.update(auditLogId, {
                syncedAt: syncedAt || new Date().toISOString(),
            });
        } catch (err) {
            console.error(`[سجل التدقيق] فشل تحديث حالة المزامنة للسجل ${auditLogId}:`, err);
        }
    },

    /**
     * الحصول على إحصائيات سجل التدقيق
     *
     * @returns {Promise<{totalLogs: number, pendingSync: number, suspiciousChecks: number, oldestLog: string|null}>}
     */
    async getStats() {
        try {
            const db = _getAuditDb();

            const totalLogs = await db.auditLogs.count();

            // السجلات التي لم تتم مزامنتها
            const allLogs = await db.auditLogs.toArray();
            const pendingSync = allLogs.filter(l => !l.syncedAt).length;

            // الفحوصات المشبوهة
            const allChecks = await db.integrityChecks.toArray();
            const suspiciousChecks = allChecks.filter(c => c.status === 'suspicious').length;

            // أقدم سجل
            const oldestLog = allLogs.length > 0
                ? allLogs.reduce((oldest, log) =>
                    log.loggedAt < oldest ? log.loggedAt : oldest,
                    allLogs[0].loggedAt
                )
                : null;

            return {
                totalLogs,
                pendingSync,
                suspiciousChecks,
                oldestLog,
            };
        } catch (err) {
            console.error('[سجل التدقيق] فشل جلب الإحصائيات:', err);
            return {
                totalLogs: 0,
                pendingSync: 0,
                suspiciousChecks: 0,
                oldestLog: null,
            };
        }
    },

    /**
     * جلب جميع سجلات التدقيق لمستخدم محدد
     *
     * @param {string} userId - معرف المستخدم
     * @param {number} [limit=100] - الحد الأقصى
     * @returns {Promise<Array>}
     */
    async getLogsByUser(userId, limit = 100) {
        try {
            const db = _getAuditDb();
            const allLogs = await db.auditLogs
                .where('userId')
                .equals(userId)
                .reverse()
                .limit(limit)
                .toArray();
            return allLogs;
        } catch (err) {
            console.error(`[سجل التدقيق] فشل جلب سجلات المستخدم ${userId}:`, err);
            return [];
        }
    },

    /**
     * حذف السجلات الزائدة عن الحد الأقصى (أقدم السجلات أولاً)
     * دالة داخلية تُستدعى تلقائياً
     *
     * @param {AuditDatabase} db - مثيل قاعدة البيانات
     * @param {number} countToDelete - عدد السجلات المراد حذفها
     * @private
     */
    async _trimOldRecords(db, countToDelete) {
        try {
            const oldRecords = await db.auditLogs
                .orderBy('id')
                .limit(countToDelete)
                .toArray();

            if (oldRecords.length > 0) {
                await db.auditLogs.bulkDelete(oldRecords.map(r => r.id));
                console.log(`[سجل التدقيق] تم حذف ${oldRecords.length} سجل قديم (تجاوز الحد الأقصى)`);
            }
        } catch (err) {
            console.warn('[سجل التدقيق] فشل حذف السجلات الزائدة:', err);
        }
    },
};

export default auditTrail;
