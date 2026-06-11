/**
 * Masarat Scanner Bridge - جسر الماسح الضوئي
 * ==========================================
 *
 * يربط المتصفح بالخدمة المحلية (masarat_scanner_bridge.py) تلقائياً.
 * بديل مجاني لـ Dynamsoft Web TWAIN.
 *
 * ✅ تعمل تلقائياً بدون أي إعداد من المستخدم:
 *    - الخدمة المحلية تبدأ مع Windows (setup.bat مرة واحدة)
 *    - المتصفح يتصل تلقائياً ويعيد الاتصال إذا انقطع
 *
 * الخدمة المحلية: http://localhost:11234
 * WebSocket: ws://localhost:11234/ws
 */

const BRIDGE_DEFAULT_PORT = 11234;
const BRIDGE_BASE_URL = `http://localhost:${BRIDGE_DEFAULT_PORT}`;
const BRIDGE_WS_URL = `ws://localhost:${BRIDGE_DEFAULT_PORT}/ws`;

// حالات الاتصال
export const CONNECTION_STATUS = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    ERROR: 'error',
};

/**
 * فئة جسر الماسح الضوئي
 * تتواصل مع الخدمة المحلية عبر REST API و WebSocket
 *
 * ✅ الاتصال تلقائي بالكامل:
 *    - يحاول الاتصال عند فتح الصفحة
 *    - يعيد المحاولة كل 10 ثوانٍ بلا حد
 *    - يعيد الاتصال تلقائياً إذا انقطع
 */
export class ScannerBridge {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || BRIDGE_BASE_URL;
        this.wsUrl = options.wsUrl || BRIDGE_WS_URL;
        this.port = options.port || BRIDGE_DEFAULT_PORT;

        this.status = CONNECTION_STATUS.DISCONNECTED;
        this.ws = null;
        this.isConnected = false;
        this.serviceInfo = null;
        this.listeners = new Map();

        // ✅ إعادة اتصال لا نهائية - الخدمة ستكون شغالة دائماً
        this.reconnectTimer = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = Infinity; // لا حد - تحاول دائماً
        this.reconnectDelay = 3000; // 3 ثوانٍ أول مرة
        this.maxReconnectDelay = 30000; // أقصى 30 ثانية بين المحاولات
        this._destroyed = false;

        // فحص دوري كل 15 ثانية للتأكد من الاتصال
        this._healthCheckTimer = null;

        // معلومات الخدمة
        this.twainAvailable = false;
        this.wiaAvailable = false;
        this.version = null;
    }

    /**
     * تهيئة الاتصال بالخدمة المحلية
     * يبدأ فحص صحة دوري تلقائياً إذا فشل الاتصال الأول
     */
    async initialize() {
        if (this._destroyed) return { success: false, available: false };

        this.status = CONNECTION_STATUS.CONNECTING;
        this.emit('statusChange', { status: this.status });

        try {
            // 1. فحص الخدمة عبر HTTP
            const healthCheck = await this._checkService();

            if (!healthCheck) {
                this.status = CONNECTION_STATUS.DISCONNECTED;
                this.emit('statusChange', {
                    status: this.status,
                    message: 'الخدمة المحلية غير متوفرة',
                });
                // تشغيل فحص صحة دوري لاكتشاف الخدمة عند تشغيلها
                this._startHealthCheck();
                return {
                    success: false,
                    available: false,
                    message: 'خدمة الماسح المحلية غير مُشغّلة. سيتم الاتصال تلقائياً عند تشغيلها.',
                };
            }

            // 2. حفظ معلومات الخدمة
            this.serviceInfo = healthCheck;
            this.twainAvailable = healthCheck.twain_available || healthCheck.twain || false;
            this.wiaAvailable = healthCheck.wia_available || healthCheck.wia || false;
            this.version = healthCheck.version;

            // 3. إنشاء اتصال WebSocket
            await this._connectWebSocket();

            this.isConnected = true;
            this.status = CONNECTION_STATUS.CONNECTED;
            this.reconnectAttempts = 0;
            this._stopHealthCheck();
            this.emit('statusChange', { status: this.status, info: healthCheck });
            this.emit('connected', healthCheck);

            // فحص صحة دوري للتأكد من استمرار الاتصال
            this._startHealthCheck();

            return {
                success: true,
                available: true,
                twain: this.twainAvailable,
                wia: this.wiaAvailable,
                version: this.version,
            };

        } catch (error) {
            this.status = CONNECTION_STATUS.ERROR;
            this.isConnected = false;
            this.emit('statusChange', { status: this.status, error: error.message });
            this._startHealthCheck();
            return {
                success: false,
                available: false,
                error: error.message,
            };
        }
    }

    /**
     * فحص الخدمة المحلية
     */
    async _checkService() {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${this.baseUrl}/api/health`, {
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * إنشاء اتصال WebSocket
     */
    async _connectWebSocket() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.wsUrl);
                const timeout = setTimeout(() => {
                    reject(new Error('انتهت مهلة اتصال WebSocket'));
                }, 5000);

                this.ws.onopen = () => {
                    clearTimeout(timeout);
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this._handleWSMessage(data);
                    } catch (e) {
                        console.warn('رسالة WebSocket غير صالحة:', e);
                    }
                };

                this.ws.onclose = () => {
                    this.isConnected = false;
                    this.status = CONNECTION_STATUS.DISCONNECTED;
                    this.emit('statusChange', { status: this.status });
                    this.emit('disconnected');
                    this._scheduleReconnect();
                };

                this.ws.onerror = (err) => {
                    clearTimeout(timeout);
                    // لا نرفض هنا - WebSocket اختياري
                    resolve();
                };
            } catch {
                // WebSocket اختياري - الخدمة تعمل بدونه
                resolve();
            }
        });
    }

    /**
     * معالجة رسائل WebSocket
     */
    _handleWSMessage(data) {
        switch (data.type) {
            case 'connected':
                this.emit('ws_connected', data);
                break;
            case 'scan_started':
                this.emit('scanStarted', data);
                break;
            case 'scan_complete':
                this.emit('scanComplete', data);
                break;
            case 'scan_error':
                this.emit('scanError', { error: data.error });
                break;
            case 'scanners_list':
                this.emit('scannersUpdated', data);
                break;
            case 'pong':
                this.emit('pong', data);
                break;
            default:
                this.emit('message', data);
        }
    }

    /**
     * جدولة إعادة الاتصال - لا نهائية مع exponential backoff
     */
    _scheduleReconnect() {
        if (this._destroyed) return;

        clearTimeout(this.reconnectTimer);

        // Exponential backoff: 3s, 6s, 12s, 24s, 30s (max)
        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
            this.maxReconnectDelay
        );

        this.reconnectTimer = setTimeout(async () => {
            if (this._destroyed) return;
            this.reconnectAttempts++;
            await this.initialize();
        }, delay);
    }

    /**
     * فحص صحة دوري - يكتشف تلقائياً متى تبدأ/تتوقف الخدمة
     */
    _startHealthCheck() {
        this._stopHealthCheck();
        if (this._destroyed) return;

        this._healthCheckTimer = setInterval(async () => {
            if (this._destroyed) return;

            const health = await this._checkService();

            if (health && !this.isConnected) {
                // الخدمة عادت! نعيد الاتصال الكامل
                this.reconnectAttempts = 0;
                await this.initialize();
            } else if (!health && this.isConnected) {
                // الخدمة انقطعت
                this.isConnected = false;
                this.status = CONNECTION_STATUS.DISCONNECTED;
                this.emit('statusChange', { status: this.status });
                this.emit('disconnected');
            }
        }, 15000); // كل 15 ثانية
    }

    /**
     * إيقاف الفحص الدوري
     */
    _stopHealthCheck() {
        if (this._healthCheckTimer) {
            clearInterval(this._healthCheckTimer);
            this._healthCheckTimer = null;
        }
    }

    /**
     * الحصول على قائمة الماسحات المتصلة
     */
    async getScanners(refresh = false) {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/scanners?refresh=${refresh}`
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // تحويل لصيغة ScannerService المتوقعة
            const scanners = (data.scanners || []).map(s => ({
                index: s.index,
                name: s.name,
                type: s.type, // twain أو wia
                manufacturer: s.manufacturer || '',
                model: s.model || s.name,
                is_ready: s.is_ready !== false,
                source: 'bridge', // تمييز أنها من الخدمة المحلية
            }));

            return { success: true, scanners };

        } catch (error) {
            return { success: false, scanners: [], error: error.message };
        }
    }

    /**
     * بدء المسح
     */
    async scan(config = {}) {
        const scanConfig = {
            scanner_index: config.scannerIndex ?? config.scanner_index ?? 0,
            dpi: config.dpi ?? 300,
            color_mode: config.colorMode ?? config.color_mode ?? 'color',
            paper_size: config.paperSize ?? config.paper_size ?? 'A4',
            duplex: config.duplex ?? false,
            auto_feeder: config.autoFeeder ?? config.auto_feeder ?? false,
            show_ui: config.showUI ?? config.show_ui ?? false,
            brightness: config.brightness ?? 0,
            contrast: config.contrast ?? 0,
            jpeg_quality: config.jpegQuality ?? config.jpeg_quality ?? 85,
            output_format: config.outputFormat ?? config.output_format ?? 'jpeg',
        };

        try {
            this.emit('scanStarted', { config: scanConfig });

            const response = await fetch(`${this.baseUrl}/api/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scanConfig),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'خطأ غير معروف' }));
                throw new Error(error.detail || `HTTP ${response.status}`);
            }

            const data = await response.json();

            // تحويل الصور لصيغة ScannerService
            const images = (data.images || []).map((img, i) => ({
                index: i,
                data: img.data,
                width: img.width,
                height: img.height,
                format: img.format || 'jpeg',
                timestamp: img.timestamp || new Date().toISOString(),
                source: 'bridge',
            }));

            this.emit('scanComplete', { images, pageCount: images.length });

            return {
                success: true,
                images,
                pageCount: images.length,
            };

        } catch (error) {
            this.emit('scanError', { error: error.message });
            throw error;
        }
    }

    /**
     * الحصول على إمكانيات ماسح محدد
     */
    async getScannerCapabilities(scannerIndex) {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/scanner/${scannerIndex}/capabilities`
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.capabilities || null;

        } catch (error) {
            return null;
        }
    }

    /**
     * هل الخدمة متصلة ومتوفرة؟
     */
    isAvailable() {
        return this.isConnected && (this.twainAvailable || this.wiaAvailable);
    }

    /**
     * هل هناك ماسحات فعلية متوفرة؟
     */
    hasScanners() {
        return this.twainAvailable || this.wiaAvailable;
    }

    /**
     * فحص سريع - هل الخدمة تعمل؟
     */
    static async isServiceRunning(port = BRIDGE_DEFAULT_PORT) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2000);
            const response = await fetch(`http://localhost:${port}/api/health`, {
                signal: controller.signal,
            });
            clearTimeout(timeout);
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * إيقاف الاتصال وتنظيف الموارد
     */
    destroy() {
        this._destroyed = true;
        clearTimeout(this.reconnectTimer);
        this._stopHealthCheck();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.isConnected = false;
        this.status = CONNECTION_STATUS.DISCONNECTED;
        this.listeners.clear();
    }

    // ========== Event System ==========

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
    }

    emit(event, data) {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event).forEach(cb => {
            try {
                cb(data);
            } catch (error) {
                console.error(`خطأ في حدث ${event}:`, error);
            }
        });
    }
}

// Instance مشترك
let _bridgeInstance = null;

/**
 * الحصول على instance مشترك من الجسر
 */
export function getScannerBridge() {
    if (!_bridgeInstance) {
        _bridgeInstance = new ScannerBridge();
    }
    return _bridgeInstance;
}

export default ScannerBridge;
