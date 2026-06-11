/**
 * 🔌 Backend Integration Layer
 * طبقة التكامل مع Backend API والـ Database
 * 
 * هذا الملف يوفر وسائل الاتصال بـ Backend Services
 * ويتعامل مع:
 * - HR Service
 * - Warehouse Service
 * - Tenant Management
 * - Analytics
 * 
 * @version 1.0.0
 * @date 2026-02-10
 */

const BACKEND_CONFIG = {
    // Browser: relative URLs to avoid mixed-content; Server: direct Gateway URL
    GATEWAY_URL: typeof window !== 'undefined'
        ? '' // Browser: relative URLs
        : (process.env.INTERNAL_GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080'),
    HR_SERVICE: process.env.NEXT_PUBLIC_HR_SERVICE_URL || 'http://localhost:5001',
    WAREHOUSE_SERVICE: process.env.NEXT_PUBLIC_WAREHOUSE_SERVICE_URL || 'http://localhost:5002',
    SAAS_SERVICE: process.env.NEXT_PUBLIC_SAAS_SERVICE_URL || 'http://localhost:5008',
    TIMEOUT: 30000,
}

/**
 * Base HTTP Client for Backend API Calls
 */
class BackendClient {
    constructor(baseURL, token) {
        this.baseURL = baseURL
        this.token = token
    }

    /**
     * Make HTTP Request to Backend
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
            ...options.headers,
        }

        const config = {
            method: options.method || 'GET',
            headers,
            timeout: BACKEND_CONFIG.TIMEOUT,
            ...options,
        }

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body)
        }

        try {
            const response = await fetch(url, config)

            if (!response.ok) {
                const error = await response.json().catch(() => ({
                    message: response.statusText,
                }))

                console.warn(`[Backend Error] ${response.status}:`, error)

                throw {
                    status: response.status,
                    message: error.message || response.statusText,
                    data: error,
                }
            }

            const data = await response.json()
            return { success: true, data }
        } catch (error) {
            console.warn(`[Backend Request Failed] ${endpoint}:`, error)
            throw error
        }
    }

    /**
     * GET Request
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' })
    }

    /**
     * POST Request
     */
    async post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body })
    }

    /**
     * PUT Request
     */
    async put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body })
    }

    /**
     * DELETE Request
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' })
    }
}

/**
 * Backend Integration Service
 */
class BackendIntegration {
    constructor(token) {
        this.token = token
        this.gateway = new BackendClient(BACKEND_CONFIG.GATEWAY_URL, token)
        this.hr = new BackendClient(BACKEND_CONFIG.HR_SERVICE, token)
        this.warehouse = new BackendClient(BACKEND_CONFIG.WAREHOUSE_SERVICE, token)
        this.saas = new BackendClient(BACKEND_CONFIG.SAAS_SERVICE, token)
    }

    /**
     * ═══════════════════════════════════════════════════════
     * HR Service Methods - إدارة الموارد البشرية
     * ═══════════════════════════════════════════════════════
     */

    /**
     * جلب جميع الموظفين من قاعدة البيانات
     */
    async getEmployees(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString()
            const endpoint = `/api/employees${queryParams ? `?${queryParams}` : ''}`

            const response = await this.hr.get(endpoint)

            return {
                success: true,
                data: response.data.items || response.data || [],
                total: response.data.total || 0,
            }
        } catch (error) {
            console.warn('[HR Service] Failed to get employees:', error)
            return {
                success: false,
                error: error.message,
                data: [],
            }
        }
    }

    /**
     * جلب موظف واحد من قاعدة البيانات
     */
    async getEmployee(employeeId) {
        try {
            const response = await this.hr.get(`/api/employees/${employeeId}`)

            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            console.warn('[HR Service] Failed to get employee:', error)
            return {
                success: false,
                error: error.message,
                data: null,
            }
        }
    }

    /**
     * إضافة موظف جديد
     */
    async createEmployee(employeeData) {
        try {
            const response = await this.hr.post('/api/employees', employeeData)

            return {
                success: true,
                data: response.data,
                message: 'تم إضافة الموظف بنجاح',
            }
        } catch (error) {
            console.warn('[HR Service] Failed to create employee:', error)
            return {
                success: false,
                error: error.message,
                data: null,
            }
        }
    }

    /**
     * تحديث بيانات موظف
     */
    async updateEmployee(employeeId, employeeData) {
        try {
            const response = await this.hr.put(`/api/employees/${employeeId}`, employeeData)

            return {
                success: true,
                data: response.data,
                message: 'تم تحديث بيانات الموظف بنجاح',
            }
        } catch (error) {
            console.warn('[HR Service] Failed to update employee:', error)
            return {
                success: false,
                error: error.message,
                data: null,
            }
        }
    }

    /**
     * حذف موظف
     */
    async deleteEmployee(employeeId) {
        try {
            await this.hr.delete(`/api/employees/${employeeId}`)

            return {
                success: true,
                message: 'تم حذف الموظف بنجاح',
            }
        } catch (error) {
            console.warn('[HR Service] Failed to delete employee:', error)
            return {
                success: false,
                error: error.message,
            }
        }
    }

    /**
     * ═══════════════════════════════════════════════════════
     * Warehouse Service Methods - إدارة المستودعات
     * ═══════════════════════════════════════════════════════
     */

    /**
     * جلب جرد المستودع
     */
    async getInventory(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString()
            const endpoint = `/api/inventory${queryParams ? `?${queryParams}` : ''}`

            const response = await this.warehouse.get(endpoint)

            return {
                success: true,
                data: response.data.items || response.data || [],
                total: response.data.total || 0,
            }
        } catch (error) {
            console.warn('[Warehouse Service] Failed to get inventory:', error)
            return {
                success: false,
                error: error.message,
                data: [],
            }
        }
    }

    /**
     * ═══════════════════════════════════════════════════════
     * SaaS Service Methods - إدارة المستأجرين والنظام
     * ═══════════════════════════════════════════════════════
     */

    /**
     * جلب جميع المستأجرين
     */
    async getTenants(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString()
            const endpoint = `/api/tenants${queryParams ? `?${queryParams}` : ''}`

            const response = await this.saas.get(endpoint)

            return {
                success: true,
                data: response.data.items || response.data || [],
                total: response.data.total || 0,
            }
        } catch (error) {
            console.warn('[SaaS Service] Failed to get tenants:', error)
            return {
                success: false,
                error: error.message,
                data: [],
            }
        }
    }

    /**
     * جلب مستأجر واحد
     */
    async getTenant(tenantId) {
        try {
            const response = await this.saas.get(`/api/tenants/${tenantId}`)

            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            console.warn('[SaaS Service] Failed to get tenant:', error)
            return {
                success: false,
                error: error.message,
                data: null,
            }
        }
    }

    /**
     * إنشاء مستأجر جديد
     */
    async createTenant(tenantData) {
        try {
            const response = await this.saas.post('/api/tenants', tenantData)

            return {
                success: true,
                data: response.data,
                message: 'تم إنشاء المستأجر بنجاح',
            }
        } catch (error) {
            console.warn('[SaaS Service] Failed to create tenant:', error)
            return {
                success: false,
                error: error.message,
                data: null,
            }
        }
    }

    /**
     * تحديث المستأجر
     */
    async updateTenant(tenantId, tenantData) {
        try {
            const response = await this.saas.put(`/api/tenants/${tenantId}`, tenantData)

            return {
                success: true,
                data: response.data,
                message: 'تم تحديث المستأجر بنجاح',
            }
        } catch (error) {
            console.warn('[SaaS Service] Failed to update tenant:', error)
            return {
                success: false,
                error: error.message,
                data: null,
            }
        }
    }

    /**
     * ═══════════════════════════════════════════════════════
     * Analytics Service Methods - التحليلات
     * ═══════════════════════════════════════════════════════
     */

    /**
     * جلب لوحة معلومات التحليلات
     */
    async getDashboardAnalytics() {
        try {
            const response = await this.gateway.get('/api/analytics/dashboard')

            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            console.warn('[Analytics Service] Failed to get analytics:', error)
            return {
                success: false,
                error: error.message,
                data: null,
            }
        }
    }

    /**
     * جلب إحصائيات الموظفين
     */
    async getEmployeeStats(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString()
            const endpoint = `/api/analytics/employees${queryParams ? `?${queryParams}` : ''}`

            const response = await this.gateway.get(endpoint)

            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            console.warn('[Analytics Service] Failed to get employee stats:', error)
            return {
                success: false,
                error: error.message,
                data: null,
            }
        }
    }

    /**
     * ═══════════════════════════════════════════════════════
     * System Management Methods
     * ═══════════════════════════════════════════════════════
     */

    /**
     * جلب سجلات النظام
     */
    async getSystemLogs(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString()
            const endpoint = `/api/logs${queryParams ? `?${queryParams}` : ''}`

            const response = await this.gateway.get(endpoint)

            return {
                success: true,
                data: response.data.items || response.data || [],
                total: response.data.total || 0,
            }
        } catch (error) {
            console.warn('[System] Failed to get logs:', error)
            return {
                success: false,
                error: error.message,
                data: [],
            }
        }
    }

    /**
     * جلب تحديثات النظام
     */
    async getSystemHealth() {
        try {
            const response = await this.gateway.get('/api/health')

            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            console.warn('[System] Failed to get health:', error)
            return {
                success: false,
                error: error.message,
                data: null,
            }
        }
    }
}

/**
 * Factory Function - إنشاء Backend Integration Instance
 */
export async function getBackendClient(token) {
    return new BackendIntegration(token)
}

/**
 * Standalone Export
 */
export default BackendIntegration
