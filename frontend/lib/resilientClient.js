/**
 * Resilient API Client - عميل API متين ومستقر
 *
 * يوفر:
 * - Retry مع exponential backoff
 * - Circuit Breaker لحماية الخدمات
 * - Connection Pooling
 * - Health Monitoring
 * - Automatic Reconnection
 *
 * @version 2.0.0
 * @date 2026-02-03
 */

// ============================================
// Configuration - الإعدادات
// ============================================

/**
 * Safe JSON parsing with Content-Type validation
 * @param {Response} response
 * @returns {Promise<object>}
 */
async function safeJsonParse(response) {
    try {
        const contentType = response.headers.get('Content-Type') || '';
        
        // Check if response is actually JSON
        if (!contentType.includes('application/json')) {
            // Try to parse as JSON anyway, if it fails, return error object
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                return {
                    error: true,
                    message: `غير صحيح Content-Type: ${contentType}`,
                    status: response.status,
                    statusText: response.statusText,
                };
            }
        }
        return await response.json();
    } catch (error) {
        console.warn('Error parsing JSON response:', error?.message || error);
        return {
            error: true,
            message: 'فشل في تحليل استجابة API',
            originalError: error.message,
        };
    }
}

const CONFIG = {
    // Retry Settings
    MAX_RETRIES: 1,
    INITIAL_RETRY_DELAY: 500, // 500ms
    MAX_RETRY_DELAY: 3000, // 3 seconds
    RETRY_MULTIPLIER: 2,

    // Circuit Breaker Settings
    FAILURE_THRESHOLD: 3, // Open circuit after 3 failures
    SUCCESS_THRESHOLD: 2, // Close circuit after 2 successes
    HALF_OPEN_TIMEOUT: 15000, // 15 seconds
    RESET_TIMEOUT: 30000, // 30 seconds

    // Connection Settings
    REQUEST_TIMEOUT: 15000, // 15 seconds (fast fail for UI responsiveness)
    KEEP_ALIVE: true,
    KEEP_ALIVE_TIMEOUT: 30000, // 30 seconds

    // Health Check Settings
    HEALTH_CHECK_INTERVAL: 120000, // 2 minutes (reduced frequency)
    HEALTH_CHECK_TIMEOUT: 5000, // 5 seconds
};

// ============================================
// Circuit Breaker - قاطع الدائرة
// ============================================

const CircuitState = {
    CLOSED: 'CLOSED',     // الدائرة مغلقة - يعمل بشكل طبيعي
    OPEN: 'OPEN',         // الدائرة مفتوحة - يرفض الطلبات
    HALF_OPEN: 'HALF_OPEN' // نصف مفتوحة - يجرب طلب واحد
};

class CircuitBreaker {
    constructor(name) {
        this.name = name;
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.lastStateChange = Date.now();
    }

    async execute(fn) {
        // في وضع التطوير، نتجاوز حماية Circuit Breaker ونحاول دائماً
        const isDevelopment = process.env.NODE_ENV === 'development';

        if (this.state === CircuitState.OPEN) {
            // تحقق من إمكانية الانتقال إلى HALF_OPEN
            if (Date.now() - this.lastStateChange >= CONFIG.HALF_OPEN_TIMEOUT) {
                this.state = CircuitState.HALF_OPEN;
                this.lastStateChange = Date.now();
                if (isDevelopment) {
                    console.log(`[CircuitBreaker:${this.name}] Transitioning to HALF_OPEN`);
                }
            } else if (!isDevelopment) {
                // فقط في الإنتاج نرفض الطلبات عند فتح الدائرة
                throw new Error(`الخدمة ${this.name} غير متاحة مؤقتاً. جاري إعادة المحاولة...`);
            } else {
                // في التطوير، نسجل تحذير ونحاول على أي حال
                console.warn(`[CircuitBreaker:${this.name}] Circuit is OPEN but allowing request in development mode`);
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        this.failureCount = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= CONFIG.SUCCESS_THRESHOLD) {
                this.state = CircuitState.CLOSED;
                this.successCount = 0;
                this.lastStateChange = Date.now();
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[CircuitBreaker:${this.name}] Circuit CLOSED - Service recovered`);
                }
            }
        }
    }

    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        this.successCount = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            this.lastStateChange = Date.now();
            if (process.env.NODE_ENV === 'development') {
                console.log(`[CircuitBreaker:${this.name}] Circuit OPEN - Failed in HALF_OPEN state`);
            }
        } else if (this.failureCount >= CONFIG.FAILURE_THRESHOLD) {
            this.state = CircuitState.OPEN;
            this.lastStateChange = Date.now();
            if (process.env.NODE_ENV === 'development') {
                console.log(`[CircuitBreaker:${this.name}] Circuit OPEN - Failure threshold reached`);
            }
        }
    }

    getState() {
        return {
            name: this.name,
            state: this.state,
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime,
        };
    }

    reset() {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.lastStateChange = Date.now();
    }
}

// Circuit Breakers لكل خدمة
const circuitBreakers = new Map();

function getCircuitBreaker(serviceName) {
    if (!circuitBreakers.has(serviceName)) {
        circuitBreakers.set(serviceName, new CircuitBreaker(serviceName));
    }
    return circuitBreakers.get(serviceName);
}

// ============================================
// Retry Logic - منطق إعادة المحاولة
// ============================================

async function withRetry(fn, options = {}) {
    const maxRetries = options.maxRetries ?? CONFIG.MAX_RETRIES;
    const initialDelay = options.initialDelay ?? CONFIG.INITIAL_RETRY_DELAY;
    const maxDelay = options.maxDelay ?? CONFIG.MAX_RETRY_DELAY;
    const multiplier = options.multiplier ?? CONFIG.RETRY_MULTIPLIER;

    let lastError;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // لا تعيد المحاولة لأخطاء معينة
            if (isNonRetryableError(error)) {
                throw error;
            }

            if (attempt < maxRetries) {
                console.warn(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
                await sleep(delay);
                delay = Math.min(delay * multiplier, maxDelay);
            }
        }
    }

    throw lastError;
}

function isNonRetryableError(error) {
    // لا تعيد المحاولة للأخطاء التي لن تتغير
    const nonRetryableCodes = [400, 401, 403, 404, 422];
    return error.status && nonRetryableCodes.includes(error.status);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Request Queue - طابور الطلبات
// ============================================

class RequestQueue {
    constructor(concurrency = 6) {
        this.queue = [];
        this.running = 0;
        this.concurrency = concurrency;
    }

    async add(fn, priority = 0) {
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject, priority });
            this.queue.sort((a, b) => b.priority - a.priority);
            this.process();
        });
    }

    async process() {
        if (this.running >= this.concurrency || this.queue.length === 0) {
            return;
        }

        this.running++;
        const { fn, resolve, reject } = this.queue.shift();

        try {
            const result = await fn();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.running--;
            this.process();
        }
    }
}

const requestQueue = new RequestQueue(6);

// ============================================
// Health Monitor - مراقب الصحة
// ============================================

class HealthMonitor {
    constructor() {
        this.services = new Map();
        this.listeners = new Set();
        this.checkInterval = null;
    }

    registerService(name, healthEndpoint) {
        this.services.set(name, {
            name,
            endpoint: healthEndpoint,
            status: 'unknown',
            lastCheck: null,
            latency: null,
            consecutiveFailures: 0,
        });
    }

    async checkService(name) {
        const service = this.services.get(name);
        if (!service) return null;

        const startTime = Date.now();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.HEALTH_CHECK_TIMEOUT);

            const response = await fetch(service.endpoint, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const latency = Date.now() - startTime;
            const isHealthy = response.ok;

            service.status = isHealthy ? 'healthy' : 'unhealthy';
            service.lastCheck = new Date().toISOString();
            service.latency = latency;
            service.consecutiveFailures = isHealthy ? 0 : service.consecutiveFailures + 1;

            // Reset circuit breaker if service recovered
            if (isHealthy) {
                const cb = circuitBreakers.get(name);
                if (cb && cb.state === CircuitState.OPEN) {
                    cb.reset();
                }
            }

            this.notifyListeners();
            return service;
        } catch (error) {
            service.status = 'offline';
            service.lastCheck = new Date().toISOString();
            service.latency = null;
            service.consecutiveFailures++;

            this.notifyListeners();
            return service;
        }
    }

    async checkAllServices() {
        const results = {};
        for (const [name] of this.services) {
            results[name] = await this.checkService(name);
        }
        return results;
    }

    startMonitoring(interval = CONFIG.HEALTH_CHECK_INTERVAL) {
        if (this.checkInterval) {
            this.stopMonitoring();
        }

        // Initial check
        this.checkAllServices();

        // Periodic checks
        this.checkInterval = setInterval(() => {
            this.checkAllServices();
        }, interval);
    }

    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners() {
        const status = this.getStatus();
        this.listeners.forEach(callback => callback(status));
    }

    getStatus() {
        const services = {};
        let healthyCount = 0;
        let totalCount = 0;

        for (const [name, service] of this.services) {
            services[name] = { ...service };
            totalCount++;
            if (service.status === 'healthy') {
                healthyCount++;
            }
        }

        return {
            services,
            summary: {
                total: totalCount,
                healthy: healthyCount,
                unhealthy: totalCount - healthyCount,
                allHealthy: healthyCount === totalCount,
            },
            timestamp: new Date().toISOString(),
        };
    }
}

// Global health monitor instance
const healthMonitor = new HealthMonitor();

// ============================================
// Resilient Fetch - طلب متين
// ============================================

async function resilientFetch(url, options = {}) {
    const {
        serviceName = 'default',
        timeout = CONFIG.REQUEST_TIMEOUT,
        retries = CONFIG.MAX_RETRIES,
        priority = 0,
        skipCircuitBreaker = false,
        ...fetchOptions
    } = options;

    const circuitBreaker = getCircuitBreaker(serviceName);

    const executeRequest = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
                keepalive: CONFIG.KEEP_ALIVE,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.response = response;
                throw error;
            }

            return response;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error(`انتهت مهلة الطلب (${timeout}ms)`);
            }

            throw error;
        }
    };

    const requestWithRetry = () => withRetry(executeRequest, { maxRetries: retries });

    // Execute with circuit breaker
    if (skipCircuitBreaker) {
        return requestQueue.add(requestWithRetry, priority);
    }

    return requestQueue.add(
        () => circuitBreaker.execute(requestWithRetry),
        priority
    );
}

// ============================================
// API Methods - طرق API
// ============================================

async function resilientGet(url, options = {}) {
    const response = await resilientFetch(url, {
        method: 'GET',
        ...options,
    });
    return safeJsonParse(response);
}

async function resilientPost(url, data, options = {}) {
    const response = await resilientFetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
    });
    return safeJsonParse(response);
}

async function resilientPut(url, data, options = {}) {
    const response = await resilientFetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
    });
    return safeJsonParse(response);
}

async function resilientDelete(url, options = {}) {
    const response = await resilientFetch(url, {
        method: 'DELETE',
        ...options,
    });
    return safeJsonParse(response);
}

// ============================================
// Service Registration - تسجيل الخدمات
// ============================================

const SERVICES = {
    GATEWAY: { name: 'gateway', port: 8080, path: '/health' },
    IDENTITY: { name: 'identity', port: 5000, path: '/health' },
    HR: { name: 'hr', port: 5001, path: '/health' },
    WAREHOUSE: { name: 'warehouse', port: 5002, path: '/health' },
    MOVEMENT: { name: 'movement', port: 5003, path: '/health' },
    ARCHIVING: { name: 'archiving', port: 5004, path: '/health' },
    SADAD: { name: 'sadad', port: 5005, path: '/health' },
    EPM: { name: 'epm', port: 5006, path: '/health' },
    ANALYTICS: { name: 'analytics', port: 5007, path: '/health' },
    SAAS: { name: 'saas', port: 5008, path: '/health' },
    AGENTS: { name: 'agents', port: 5010, path: '/health' },
};

function initializeServices(gatewayUrl = 'http://localhost:8080') {
    // Register all services with health monitor
    Object.values(SERVICES).forEach(service => {
        const healthUrl = service.name === 'gateway'
            ? `${gatewayUrl}${service.path}`
            : `${gatewayUrl}/api/${service.name}${service.path}`;

        healthMonitor.registerService(service.name, healthUrl);
    });

    // Health monitoring is on-demand only (no auto-start)
    // Call healthMonitor.startMonitoring() explicitly if needed
}

// ============================================
// Connection State - حالة الاتصال
// ============================================

let connectionState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastOnlineTime: Date.now(),
    reconnecting: false,
};

// Listen for online/offline events
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        connectionState.isOnline = true;
        connectionState.lastOnlineTime = Date.now();
        connectionState.reconnecting = false;
        if (process.env.NODE_ENV === 'development') {
            console.log('[Connection] Back online');
        }

        // Trigger health check
        healthMonitor.checkAllServices();
    });

    window.addEventListener('offline', () => {
        connectionState.isOnline = false;
        if (process.env.NODE_ENV === 'development') {
            console.log('[Connection] Offline');
        }
    });
}

function getConnectionState() {
    return { ...connectionState };
}

// ============================================
// Exports
// ============================================

export {
    // Core functions
    resilientFetch,
    resilientGet,
    resilientPost,
    resilientPut,
    resilientDelete,
    safeJsonParse,

    // Circuit Breaker
    CircuitBreaker,
    CircuitState,
    getCircuitBreaker,
    circuitBreakers,

    // Health Monitor
    HealthMonitor,
    healthMonitor,

    // Request Queue
    RequestQueue,
    requestQueue,

    // Services
    SERVICES,
    initializeServices,

    // Connection State
    getConnectionState,
    connectionState,

    // Utilities
    withRetry,
    sleep,

    // Configuration
    CONFIG,
};

export default {
    fetch: resilientFetch,
    get: resilientGet,
    post: resilientPost,
    put: resilientPut,
    delete: resilientDelete,
    healthMonitor,
    initializeServices,
    getConnectionState,
    CONFIG,
};
