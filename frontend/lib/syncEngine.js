/**
 * محرك المزامنة - Sync Engine
 * يدير المزامنة التلقائية بين التخزين المحلي والخادم
 *
 * @version 2.1.0 - Smart backoff per entity, reduced logging
 */

import { getPendingOps, updatePendingOpStatus, removePendingOp, cleanOldData } from './offlineDb';
import { pullDelta } from './offlineDataLayer';

// ═══════════════════════════════════════════════════════════
// حالات المزامنة
// ═══════════════════════════════════════════════════════════

export const SyncStatus = {
    IDLE: 'idle',
    SYNCING: 'syncing',
    SYNCED: 'synced',
    ERROR: 'error',
    OFFLINE: 'offline',
};

// ═══════════════════════════════════════════════════════════
// إعدادات المزامنة
// ═══════════════════════════════════════════════════════════

const SYNC_CONFIG = {
    intervalMs: 60 * 1000, // 60 ثانية (بدل 30 — أقل ضغط)
    pushBatchSize: 10,
    maxRetries: 5,
    entities: ['employees', 'departments', 'workLocations', 'attendances', 'leaveRequests'],
    // Entity-level backoff عند الفشل المتكرر
    maxEntityFailures: 3,           // بعد 3 فشل متتالي → إيقاف مؤقت
    entityBackoffMs: 5 * 60 * 1000, // 5 دقائق إيقاف بعد الفشل المتكرر
};

const SYNC_API_BASE = '/api/core/sync';

// ═══════════════════════════════════════════════════════════
// Sync Engine Class
// ═══════════════════════════════════════════════════════════

class SyncEngine {
    constructor() {
        this._status = SyncStatus.IDLE;
        this._listeners = new Set();
        this._intervalId = null;
        this._isRunning = false;
        this._lastSyncAt = null;
        this._pendingCount = 0;

        // Entity-level failure tracking
        this._entityFailures = {};    // { entity: failureCount }
        this._entityPausedUntil = {}; // { entity: timestamp }
        this._pushFailures = 0;
        this._pushPausedUntil = 0;
    }

    // ── Getters ──────────────────────────────────────────

    get status() { return this._status; }
    get lastSyncAt() { return this._lastSyncAt; }
    get pendingCount() { return this._pendingCount; }
    get isOnline() { return typeof navigator !== 'undefined' ? navigator.onLine : true; }

    // ── Listeners ────────────────────────────────────────

    subscribe(listener) {
        this._listeners.add(listener);
        return () => this._listeners.delete(listener);
    }

    _notify() {
        const state = {
            status: this._status,
            lastSyncAt: this._lastSyncAt,
            pendingCount: this._pendingCount,
            isOnline: this.isOnline,
        };
        this._listeners.forEach(fn => {
            try { fn(state); } catch { /* ignore listener errors */ }
        });
    }

    _setStatus(status) {
        this._status = status;
        this._notify();
    }

    // ── Start/Stop ───────────────────────────────────────

    start() {
        if (this._intervalId) return;

        // مراقبة حالة الاتصال
        if (typeof window !== 'undefined') {
            window.addEventListener('online', this._onOnline);
            window.addEventListener('offline', this._onOffline);
        }

        // مزامنة دورية
        this._intervalId = setInterval(() => this.sync(), SYNC_CONFIG.intervalMs);

        // مزامنة فورية (بعد تأخير قصير للسماح للصفحة بالتحميل)
        setTimeout(() => this.sync(), 3000);
    }

    stop() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
        if (typeof window !== 'undefined') {
            window.removeEventListener('online', this._onOnline);
            window.removeEventListener('offline', this._onOffline);
        }
    }

    // ── Event Handlers ───────────────────────────────────

    _onOnline = () => {
        // عند عودة الاتصال، إعادة تعيين backoff لكل الكيانات
        this._entityFailures = {};
        this._entityPausedUntil = {};
        this._pushFailures = 0;
        this._pushPausedUntil = 0;
        this.sync();
    };

    _onOffline = () => {
        this._setStatus(SyncStatus.OFFLINE);
    };

    // ── Entity Backoff ───────────────────────────────────

    _isEntityPaused(entity) {
        const pausedUntil = this._entityPausedUntil[entity] || 0;
        if (pausedUntil > Date.now()) return true;
        // انتهت فترة الإيقاف — إعادة تعيين
        if (pausedUntil > 0) {
            this._entityPausedUntil[entity] = 0;
            this._entityFailures[entity] = 0;
        }
        return false;
    }

    _recordEntityFailure(entity) {
        this._entityFailures[entity] = (this._entityFailures[entity] || 0) + 1;
        if (this._entityFailures[entity] >= SYNC_CONFIG.maxEntityFailures) {
            // إيقاف مؤقت لهذا الكيان
            this._entityPausedUntil[entity] = Date.now() + SYNC_CONFIG.entityBackoffMs;
            this._entityFailures[entity] = 0;
        }
    }

    _recordEntitySuccess(entity) {
        this._entityFailures[entity] = 0;
        this._entityPausedUntil[entity] = 0;
    }

    _isPushPaused() {
        if (this._pushPausedUntil > Date.now()) return true;
        if (this._pushPausedUntil > 0) {
            this._pushPausedUntil = 0;
            this._pushFailures = 0;
        }
        return false;
    }

    _recordPushFailure() {
        this._pushFailures++;
        if (this._pushFailures >= SYNC_CONFIG.maxEntityFailures) {
            this._pushPausedUntil = Date.now() + SYNC_CONFIG.entityBackoffMs;
            this._pushFailures = 0;
        }
    }

    // ── Core Sync ────────────────────────────────────────

    async sync() {
        if (this._isRunning) return;
        if (!this.isOnline) {
            this._setStatus(SyncStatus.OFFLINE);
            return;
        }

        this._isRunning = true;
        this._setStatus(SyncStatus.SYNCING);

        try {
            // 1. Push أولاً - إرسال العمليات المعلقة
            await this._pushPendingOps();

            // 2. Pull - سحب التحديثات من الخادم
            await this._pullDeltas();

            // 3. تنظيف البيانات القديمة (كل 24 ساعة)
            await this._cleanupIfNeeded();

            this._lastSyncAt = new Date();
            this._setStatus(SyncStatus.SYNCED);
        } catch (err) {
            console.warn('[SyncEngine] خطأ في المزامنة:', err?.message || err);
            this._setStatus(SyncStatus.ERROR);
        } finally {
            this._isRunning = false;
        }
    }

    /**
     * إرسال العمليات المعلقة للخادم
     */
    async _pushPendingOps() {
        const ops = await getPendingOps();
        this._pendingCount = ops.length;

        if (ops.length === 0) return;

        // تجاوز إذا Push متوقف مؤقتاً
        if (this._isPushPaused()) return;

        // تقسيم العمليات إلى دفعات
        const batches = [];
        for (let i = 0; i < ops.length; i += SYNC_CONFIG.pushBatchSize) {
            batches.push(ops.slice(i, i + SYNC_CONFIG.pushBatchSize));
        }

        for (const batch of batches) {
            try {
                const changes = batch.map(op => ({
                    entityType: op.entity,
                    entityId: op.entityId,
                    operationType: op.operation,
                    data: typeof op.data === 'string' ? JSON.parse(op.data) : op.data,
                    clientTimestamp: op.createdAt,
                    clientSyncVersion: 0,
                }));

                const response = await fetch(`${SYNC_API_BASE}/push`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this._getToken()}`,
                    },
                    body: JSON.stringify({ changes }),
                });

                if (response.ok) {
                    const result = await response.json();

                    // حذف العمليات المقبولة
                    for (const op of batch) {
                        const accepted = result.accepted?.find(a =>
                            a.entityType === op.entity && a.entityId === op.entityId
                        );
                        if (accepted) {
                            await removePendingOp(op.id);
                        }
                    }

                    // تسجيل التعارضات
                    if (result.conflicts?.length > 0) {
                        console.warn('[SyncEngine] تعارضات:', result.conflicts);
                    }

                    this._pushFailures = 0;
                } else {
                    this._recordPushFailure();
                }
            } catch (err) {
                console.warn('[SyncEngine] فشل Push:', err?.message || err);
                this._recordPushFailure();

                // تحديث حالة العمليات الفاشلة
                for (const op of batch) {
                    if (op.retryCount >= SYNC_CONFIG.maxRetries) {
                        await updatePendingOpStatus(op.id, 'failed', err?.message || 'Unknown error');
                    }
                }
            }
        }

        // تحديث العدد
        const remaining = await getPendingOps();
        this._pendingCount = remaining.length;
    }

    /**
     * سحب التحديثات من الخادم لكل الكيانات
     */
    async _pullDeltas() {
        for (const entity of SYNC_CONFIG.entities) {
            // تجاوز الكيانات المتوقفة مؤقتاً
            if (this._isEntityPaused(entity)) continue;

            try {
                let hasMore = true;
                let pullSucceeded = false;

                while (hasMore) {
                    const result = await pullDelta(entity);
                    hasMore = result.hasMore || false;

                    if (result.error) {
                        this._recordEntityFailure(entity);
                        break;
                    }

                    pullSucceeded = true;
                }

                if (pullSucceeded) {
                    this._recordEntitySuccess(entity);
                }
            } catch (err) {
                console.warn(`[SyncEngine] فشل Pull لـ ${entity}:`, err?.message || err);
                this._recordEntityFailure(entity);
            }
        }
    }

    /**
     * تنظيف البيانات القديمة (كل 24 ساعة)
     */
    async _cleanupIfNeeded() {
        try {
            const lastCleanup = localStorage.getItem('masarat_last_cleanup');
            const now = Date.now();
            if (!lastCleanup || now - parseInt(lastCleanup) > 24 * 60 * 60 * 1000) {
                await cleanOldData();
                localStorage.setItem('masarat_last_cleanup', now.toString());
            }
        } catch {
            // localStorage might not be available
        }
    }

    /**
     * Helper: Get stored auth token
     */
    _getToken() {
        if (typeof window !== 'undefined') {
            try {
                const session = JSON.parse(sessionStorage.getItem('next-auth.session-token') || '{}');
                return session.accessToken || '';
            } catch {
                return '';
            }
        }
        return '';
    }
}

// Singleton
export const syncEngine = new SyncEngine();
export default syncEngine;
