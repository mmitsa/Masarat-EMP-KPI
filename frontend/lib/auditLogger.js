/**
 * Audit Logger - تسجيل جميع الأنشطة الحساسة
 * للأمان والامتثال والتدقيق
 */

class AuditLogger {
    constructor() {
        this.logs = [];
        this.apiEndpoint = '/api/saas/audit-logs';
        this.maxLocalLogs = 100; // حد أقصى للسجلات المحلية
    }

    /**
     * تسجيل حدث
     */
    log(action, resource, resourceId, details = {}, severity = 'info') {
        const logEntry = {
            id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
            action,
            resource,
            resourceId,
            severity,
            details,
            userId: this.getUserId(),
            userRole: this.getUserRole(),
            url: typeof window !== 'undefined' ? window.location.href : 'N/A'
        };

        // تسجيل محلي
        console.log(`[${severity.toUpperCase()}] [AUDIT] ${action} | ${resource}:${resourceId}`, details);

        // حفظ محلي (مع حد أقصى)
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLocalLogs) {
            this.logs.shift();
        }

        // إرسال إلى backend بدون انتظار
        if (this.isProduction()) {
            this.sendToBackend(logEntry).catch(err => 
                console.error('[AUDIT] Failed to send to backend:', err.message)
            );
        }

        return logEntry;
    }

    /**
     * تسجيل نجاح العملية
     */
    success(action, resource, resourceId, details = {}) {
        return this.log(action, resource, resourceId, details, 'info');
    }

    /**
     * تسجيل تحذير
     */
    warning(action, resource, resourceId, details = {}) {
        return this.log(action, resource, resourceId, details, 'warning');
    }

    /**
     * تسجيل خطأ
     */
    error(action, resource, resourceId, details = {}) {
        return this.log(action, resource, resourceId, details, 'error');
    }

    /**
     * إرسال السجل إلى backend
     */
    async sendToBackend(logEntry) {
        try {
            const token = this.getToken();
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(logEntry)
            });

            if (!response.ok) {
                console.warn(`[AUDIT] Backend returned ${response.status}`);
            }
        } catch (error) {
            console.error('[AUDIT] Send failed:', error.message);
        }
    }

    /**
     * الحصول على معرف المستخدم
     */
    getUserId() {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            try {
                const session = localStorage.getItem('adminSession');
                return session ? JSON.parse(session).userId : 'ANONYMOUS';
            } catch (e) {
                return 'UNKNOWN';
            }
        }
        return 'UNKNOWN';
    }

    /**
     * الحصول على دور المستخدم
     */
    getUserRole() {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            try {
                const session = localStorage.getItem('adminSession');
                return session ? JSON.parse(session).role : 'UNKNOWN';
            } catch (e) {
                return 'UNKNOWN';
            }
        }
        return 'UNKNOWN';
    }

    /**
     * الحصول على التوكن
     */
    getToken() {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            try {
                const session = localStorage.getItem('session');
                return session ? JSON.parse(session).accessToken : null;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * التحقق من الإنتاج
     */
    isProduction() {
        return process.env.NEXT_PUBLIC_ENV === 'production';
    }

    /**
     * الحصول على السجلات
     */
    getLogs() {
        return this.logs;
    }

    /**
     * الحصول على السجلات حسب المورد
     */
    getLogsByResource(resource) {
        return this.logs.filter(log => log.resource === resource);
    }

    /**
     * الحصول على السجلات حسب الإجراء
     */
    getLogsByAction(action) {
        return this.logs.filter(log => log.action === action);
    }

    /**
     * تنظيف السجلات
     */
    clear() {
        this.logs = [];
    }

    /**
     * إحصائيات
     */
    getStats() {
        const errors = this.logs.filter(l => l.severity === 'error').length;
        const warnings = this.logs.filter(l => l.severity === 'warning').length;
        const info = this.logs.filter(l => l.severity === 'info').length;

        return {
            total: this.logs.length,
            errors,
            warnings,
            info,
            lastLog: this.logs[this.logs.length - 1] || null
        };
    }
}

// تصدير instance واحد
export const auditLogger = new AuditLogger();

// Export class للاختبارات
export default AuditLogger;
