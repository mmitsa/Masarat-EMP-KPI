/**
 * Logger Service - خدمة التسجيل
 * 
 * بديل احترافي لـ console.log/error
 * يوفر تسجيل منظم مع مستويات مختلفة
 * 
 * @version 1.0.0
 * @date 2026-02-07
 */

const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4,
};

class Logger {
    constructor() {
        this.level = process.env.NODE_ENV === 'production' 
            ? LogLevel.WARN 
            : LogLevel.DEBUG;
        this.logs = [];
        this.maxLogs = 1000;
    }

    setLevel(level) {
        this.level = level;
    }

    _log(level, levelName, message, data = null) {
        if (level < this.level) return;

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: levelName,
            message,
            data,
        };

        // حفظ في الذاكرة
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // الطباعة في وضع التطوير
        if (process.env.NODE_ENV === 'development') {
            const style = this._getStyle(levelName);
            console.log(
                `%c[${timestamp}] ${levelName}`,
                style,
                message,
                data || ''
            );
        }

        // في الإنتاج، يمكن إرسال الأخطاء لخدمة المراقبة
        if (process.env.NODE_ENV === 'production' && level >= LogLevel.ERROR) {
            this._sendToMonitoring(logEntry);
        }
    }

    _getStyle(level) {
        const styles = {
            DEBUG: 'color: #6B7280; font-weight: normal',
            INFO: 'color: #3B82F6; font-weight: normal',
            WARN: 'color: #F59E0B; font-weight: bold',
            ERROR: 'color: #EF4444; font-weight: bold',
            FATAL: 'color: #DC2626; font-weight: bold; background: #FEE2E2',
        };
        return styles[level] || styles.INFO;
    }

    _sendToMonitoring(logEntry) {
        // يمكن إضافة integration مع خدمات مثل:
        // - Sentry
        // - LogRocket
        // - Application Insights
        // - Custom API endpoint
        
        // مثال: إرسال للـ API
        if (window.navigator.onLine) {
            fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logEntry),
            }).catch(() => {
                // Silent fail - لا نريد أخطاء إضافية
            });
        }
    }

    debug(message, data) {
        this._log(LogLevel.DEBUG, 'DEBUG', message, data);
    }

    info(message, data) {
        this._log(LogLevel.INFO, 'INFO', message, data);
    }

    warn(message, data) {
        this._log(LogLevel.WARN, 'WARN', message, data);
    }

    error(message, data) {
        this._log(LogLevel.ERROR, 'ERROR', message, data);
    }

    fatal(message, data) {
        this._log(LogLevel.FATAL, 'FATAL', message, data);
    }

    // الحصول على السجلات
    getLogs(level = null) {
        if (level) {
            return this.logs.filter(log => log.level === level);
        }
        return [...this.logs];
    }

    // مسح السجلات
    clearLogs() {
        this.logs = [];
    }

    // تصدير السجلات
    exportLogs() {
        const dataStr = JSON.stringify(this.logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `logs-${new Date().toISOString()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// Instance واحدة للاستخدام في كل المشروع
const logger = new Logger();

export { logger, LogLevel };
export default logger;
