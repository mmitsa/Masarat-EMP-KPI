/**
 * قاعدة البيانات المحلية - IndexedDB مع Dexie.js
 * تُستخدم للتخزين المحلي والعمل بدون اتصال
 */

import Dexie from 'dexie';

class MasaratOfflineDB extends Dexie {
    constructor() {
        super('MasaratOfflineDB');

        this.version(1).stores({
            // البيانات المرجعية (Reference Data)
            employees: 'id, nameAr, departmentId, syncVersion, [departmentId+syncVersion]',
            departments: 'id, nameAr, parentId, syncVersion',
            workLocations: 'id, nameAr, isActive, syncVersion',

            // بيانات العمل (Transactional Data)
            attendances: 'id, employeeId, date, source, syncVersion, [employeeId+date]',
            leaveRequests: 'id, employeeId, status, syncVersion',
            fieldWorkRequests: 'id, employeeId, status, syncVersion',

            // طابور العمليات المعلقة
            pendingOps: '++id, entity, entityId, operation, createdAt, status, retryCount, priority',

            // حالة المزامنة
            syncState: 'entity, lastSyncVersion, lastSyncAt',
        });

        // الإصدار 2: إضافة جداول المستودعات
        this.version(2).stores({
            // البيانات المرجعية (Reference Data)
            employees: 'id, nameAr, departmentId, syncVersion, [departmentId+syncVersion]',
            departments: 'id, nameAr, parentId, syncVersion',
            workLocations: 'id, nameAr, isActive, syncVersion',

            // بيانات العمل (Transactional Data)
            attendances: 'id, employeeId, date, source, syncVersion, [employeeId+date]',
            leaveRequests: 'id, employeeId, status, syncVersion',
            fieldWorkRequests: 'id, employeeId, status, syncVersion',

            // بيانات المستودعات (Warehouse Data)
            warehouseItems: 'id, nameAr, categoryId, barcode, syncVersion, [categoryId+syncVersion]',
            exchangeRequests: 'id, requesterId, status, syncVersion',

            // طابور العمليات المعلقة
            pendingOps: '++id, entity, entityId, operation, createdAt, status, retryCount, priority',

            // حالة المزامنة
            syncState: 'entity, lastSyncVersion, lastSyncAt',
        });
    }
}

// Singleton instance
let dbInstance = null;

export function getOfflineDb() {
    if (!dbInstance) {
        dbInstance = new MasaratOfflineDB();
    }
    return dbInstance;
}

/**
 * إضافة عملية معلقة إلى الطابور
 */
export async function addPendingOp(entity, entityId, operation, data, priority = 5) {
    const db = getOfflineDb();
    return db.pendingOps.add({
        entity,
        entityId,
        operation, // 'create' | 'update' | 'delete'
        data: JSON.stringify(data),
        createdAt: new Date().toISOString(),
        status: 'pending', // 'pending' | 'processing' | 'failed'
        retryCount: 0,
        priority, // 1=highest (attendance), 5=normal, 10=lowest
        error: null,
    });
}

/**
 * جلب العمليات المعلقة مرتبة حسب الأولوية
 */
export async function getPendingOps() {
    const db = getOfflineDb();
    return db.pendingOps
        .where('status')
        .anyOf('pending', 'failed')
        .sortBy('priority');
}

/**
 * تحديث حالة عملية معلقة
 */
export async function updatePendingOpStatus(id, status, error = null) {
    const db = getOfflineDb();
    const update = { status };
    if (error) update.error = error;
    if (status === 'failed') {
        const op = await db.pendingOps.get(id);
        if (op) update.retryCount = (op.retryCount || 0) + 1;
    }
    return db.pendingOps.update(id, update);
}

/**
 * حذف عملية تمت بنجاح
 */
export async function removePendingOp(id) {
    const db = getOfflineDb();
    return db.pendingOps.delete(id);
}

/**
 * جلب حالة المزامنة لكيان معين
 */
export async function getSyncState(entity) {
    const db = getOfflineDb();
    return db.syncState.get(entity);
}

/**
 * تحديث حالة المزامنة
 */
export async function updateSyncState(entity, lastSyncVersion) {
    const db = getOfflineDb();
    return db.syncState.put({
        entity,
        lastSyncVersion,
        lastSyncAt: new Date().toISOString(),
    });
}

/**
 * تنظيف البيانات القديمة (أكثر من 30 يوم)
 */
export async function cleanOldData() {
    const db = getOfflineDb();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    // حذف سجلات الحضور القديمة
    await db.attendances.where('date').below(dateStr).delete();

    // حذف العمليات الفاشلة التي تجاوزت 10 محاولات
    const failedOps = await db.pendingOps.where('retryCount').above(10).toArray();
    if (failedOps.length > 0) {
        await db.pendingOps.bulkDelete(failedOps.map(op => op.id));
    }
}

/**
 * حساب حجم التخزين المحلي التقريبي
 */
export async function getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        return {
            usage: estimate.usage || 0,
            quota: estimate.quota || 0,
            usagePercent: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0,
        };
    }
    return { usage: 0, quota: 0, usagePercent: 0 };
}

export default getOfflineDb;
