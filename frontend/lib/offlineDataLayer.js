/**
 * طبقة البيانات المحلية - Offline Data Layer
 * تُدير القراءة والكتابة عبر IndexedDB مع المزامنة مع الـ API
 */

import { getOfflineDb, addPendingOp, getSyncState, updateSyncState } from './offlineDb';

const SYNC_API_BASE = '/api/core/sync';

/**
 * قراءة بيانات - محلياً أولاً ثم من الـ API
 * @param {string} entity - نوع الكيان (employees, attendances, etc.)
 * @param {object} options - خيارات البحث
 * @returns {Promise<{data: Array, source: string}>}
 */
export async function offlineRead(entity, options = {}) {
    const db = getOfflineDb();

    // 1. القراءة من IndexedDB فوراً
    let localData = [];
    try {
        const table = db[entity];
        if (table) {
            if (options.filter) {
                localData = await table.where(options.filter).toArray();
            } else {
                localData = await table.toArray();
            }
        }
    } catch (err) {
        console.warn(`[OfflineDataLayer] فشل قراءة ${entity} من IndexedDB:`, err);
    }

    return {
        data: localData,
        source: 'local',
    };
}

/**
 * كتابة بيانات - IndexedDB فوراً + طابور المزامنة
 * @param {string} entity - نوع الكيان
 * @param {string} operation - نوع العملية (create, update, delete)
 * @param {object} data - البيانات
 * @param {number} priority - الأولوية (1=أعلى)
 */
export async function offlineWrite(entity, operation, data, priority = 5) {
    const db = getOfflineDb();

    try {
        // 1. الكتابة المحلية فوراً (Optimistic Update)
        const table = db[entity];
        if (table) {
            if (operation === 'create') {
                // تعيين ID مؤقت سالب للسجلات الجديدة
                const tempId = -Date.now();
                await table.put({ ...data, id: data.id || tempId, _isLocal: true });
            } else if (operation === 'update' && data.id) {
                await table.update(data.id, { ...data, _isLocal: true });
            } else if (operation === 'delete' && data.id) {
                await table.delete(data.id);
            }
        }

        // 2. إضافة للطابور
        await addPendingOp(entity, data.id, operation, data, priority);

        return { success: true, source: 'local' };
    } catch (err) {
        console.warn(`[OfflineDataLayer] فشل الكتابة المحلية لـ ${entity}:`, err?.message || err);
        throw err;
    }
}

/**
 * سحب التحديثات من الخادم (Delta Pull)
 * @param {string} entity - نوع الكيان
 * @returns {Promise<{itemsCount: number, newVersion: number}>}
 */
export async function pullDelta(entity) {
    const db = getOfflineDb();

    // جلب آخر إصدار مزامنة
    const state = await getSyncState(entity);
    const since = state?.lastSyncVersion || 0;

    try {
        const response = await fetch(`${SYNC_API_BASE}/delta?entity=${entity}&since=${since}&limit=200`, {
            headers: {
                'Authorization': `Bearer ${getStoredToken()}`,
            },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();

        if (result.items && result.items.length > 0) {
            const table = db[entity];
            if (table) {
                // تطبيق التغييرات محلياً
                for (const item of result.items) {
                    if (item.operationType === 'SoftDeleted') {
                        await table.delete(item.entityId);
                    } else {
                        // TODO: Fetch full entity data from API
                        // For now, update syncVersion
                        try {
                            await table.update(item.entityId, { syncVersion: item.syncVersion });
                        } catch {
                            // Entity might not exist locally
                        }
                    }
                }
            }

            // تحديث حالة المزامنة
            await updateSyncState(entity, result.lastSyncVersion);

            return {
                itemsCount: result.items.length,
                newVersion: result.lastSyncVersion,
                hasMore: result.hasMore,
            };
        }

        return { itemsCount: 0, newVersion: since, hasMore: false };
    } catch (err) {
        console.warn(`[OfflineDataLayer] فشل سحب التحديثات لـ ${entity}:`, err);
        return { itemsCount: 0, newVersion: since, hasMore: false, error: err.message };
    }
}

/**
 * Helper: Get stored auth token
 */
function getStoredToken() {
    if (typeof window !== 'undefined') {
        // Try to get from session storage or cookie
        try {
            const session = JSON.parse(sessionStorage.getItem('next-auth.session-token') || '{}');
            return session.accessToken || '';
        } catch {
            return '';
        }
    }
    return '';
}
