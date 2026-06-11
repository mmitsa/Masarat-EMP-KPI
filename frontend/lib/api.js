import { getSession, signOut } from 'next-auth/react'
import { API } from './routes'
import {
    withRetry,
    getCircuitBreaker,
    CircuitState,
    CONFIG as RESILIENT_CONFIG,
} from './resilientClient'
import { handleAPIError, APIError } from './apiErrorHandler'
import { 
    attachTenantId, 
    validateTenantId, 
    filterByCurrentTenant,
    getCurrentTenantId,
} from './tenantIsolation'

/**
 * API Helper - Authenticated fetch wrapper with resilience + Tenant Isolation
 * Automatically injects JWT token from session
 * Includes: Retry logic, Circuit Breaker, Connection monitoring, Error Codes, Tenant Isolation
 *
 * @version 3.1.0 - With Tenant Isolation
 * @date 2026-02-10
 */

// Browser: use relative URLs (same origin) to avoid mixed-content (HTTPS→HTTP) issues
// Server-side (SSR/API routes): use direct Gateway URL for faster internal calls
const GATEWAY_URL = typeof window !== 'undefined'
    ? '' // Browser: relative URLs → proxied via Next.js catch-all → Gateway
    : (process.env.INTERNAL_GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080')
const USE_PLATFORM_API = process.env.NEXT_PUBLIC_USE_PLATFORM_API === 'true'

// ============================================
// Safe JSON Parsing Helper
// ============================================

/**
 * Safely parse JSON from response, handling HTML error pages
 * @param {Response} response - Fetch response object
 * @returns {Promise<object>} Parsed JSON or empty object
 */
async function safeJsonParse(response) {
    // Clone response to avoid "Illegal invocation" error
    // Response methods need proper context binding
    try {
        const contentType = response.headers.get('content-type');
        
        // Check if response is actually JSON
        if (contentType && contentType.includes('application/json')) {
            try {
                // Bind the json method to ensure context is maintained
                return await response.json.call(response);
            } catch (error) {
                console.warn('JSON parse error:', error.message);
                return {};
            }
        }
        
        // If it's HTML (error page), return empty object
        if (contentType && contentType.includes('text/html')) {
            console.warn('Received HTML instead of JSON. Server might be returning an error page.');
            return {};
        }
        
        // Try to parse as text for debugging
        try {
            // Bind the text method to ensure context is maintained
            const text = await response.text.call(response);
            if (text && text.trim() && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
                return JSON.parse(text);
            }
            console.warn('Response is not JSON:', text?.substring(0, 100) || 'empty');
            return {};
        } catch (error) {
            console.warn('Failed to parse response text:', error.message);
            return {};
        }
    } catch (error) {
        console.warn('safeJsonParse error:', error.message);
        return {};
    }
}

// ============================================
// Retry Configuration
// ============================================

const RETRY_CONFIG = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    multiplier: 2,
}

// Non-retryable HTTP status codes
const NON_RETRYABLE_CODES = [400, 401, 403, 404, 422]

/**
 * Extract service name from endpoint for circuit breaker
 */
function getServiceFromEndpoint(endpoint) {
    const match = endpoint.match(/\/api\/([^\/]+)/)
    return match ? match[1] : 'default'
}

/**
 * Safe wrapper for fetch().then(r => r.json())
 * Prevents "Unexpected token '<'" errors when server returns HTML
 */
function safeFetchJson(url, options = {}) {
    return fetch(url, options).then(async (response) => {
        if (!response.ok) {
            const errorData = await safeJsonParse(response);
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        return safeJsonParse(response);
    });
}

/**
 * Agents API fetch - Uses local Next.js API routes with tenant context
 * @param {string} endpoint - API endpoint (e.g., '/api/agents')
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
async function agentsFetch(endpoint, options = {}) {
    // Get session for authentication and tenant context
    const session = await getSession()

    if (!session) {
        // لا نعمل hard redirect - نرمي خطأ فقط والمكون يتعامل معه
        throw new Error('لم يتم تسجيل الدخول')
    }

    // Use local API routes (relative URL for browser, absolute for SSR)
    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXTAUTH_URL || 'http://localhost:3008')
    const url = `${baseUrl}${endpoint}`

    const headers = {
        'Content-Type': 'application/json',
        // Add authentication token
        'Authorization': `Bearer ${session.accessToken}`,
        // Add tenant context
        'X-Tenant-Id': session.user?.tenantId || '1',
        ...options.headers,
    }

    const config = {
        method: 'GET',
        ...options,
        headers,
    }

    const executeRequest = async () => {
        const response = await fetch(url, config)

        if (!response.ok) {
            const errorData = await safeJsonParse(response)
            const errorMessage = errorData?.message || errorData?.error || `خطأ في الطلب: ${response.status}`
            const error = new Error(errorMessage)
            error.status = response.status
            error.data = errorData
            throw error
        }

        return await safeJsonParse(response)
    }

    try {
        // Use retry for agents API (reduced retries for dashboard calls)
        return await withRetry(executeRequest, { ...RETRY_CONFIG, maxRetries: 1 })
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('Agents API Error:', error.message || error)
        }
        throw error
    }
}

/**
 * Base fetch function with authentication and resilience
 * @param {string} endpoint - API endpoint (e.g., '/api/hr/employees')
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
async function authenticatedFetch(endpoint, options = {}) {
    const session = await getSession()

    if (!session) {
        // ── Fallback: Platform Admin session (localStorage) ──
        // مشرفو المنصة يسجلون دخولهم عبر /platform-admin/login
        // ولا تُنشأ لهم جلسة next-auth — نرسل header خاص بدلاً من ذلك
        if (typeof window !== 'undefined') {
            try {
                const platformSession = localStorage.getItem('platform_admin_session');
                if (platformSession) {
                    const parsed = JSON.parse(platformSession);
                    // التحقق من عدم انتهاء الجلسة (24 ساعة)
                    if (parsed?.user?.email && parsed?.loginTime &&
                        Date.now() - parsed.loginTime < 24 * 60 * 60 * 1000) {
                        // مشرف منصة مصادق — نتابع بـ header خاص
                        const pUrl = endpoint.startsWith('http')
                            ? endpoint
                            : `${USE_PLATFORM_API ? '' : GATEWAY_URL}${endpoint}`;

                        const platformHeaders = {
                            'Content-Type': 'application/json',
                            'X-Platform-Admin': btoa(JSON.stringify({
                                email: parsed.user.email,
                                role: parsed.user.role,
                                loginTime: parsed.loginTime,
                            })),
                            ...options.headers,
                        };

                        const response = await fetch(pUrl, {
                            ...options,
                            headers: platformHeaders,
                            signal: options.signal || AbortSignal.timeout(RESILIENT_CONFIG.REQUEST_TIMEOUT),
                        });

                        if (!response.ok) {
                            const errorData = await safeJsonParse(response);
                            const error = new Error(errorData.message || `HTTP ${response.status}`);
                            error.status = response.status;
                            error.response = { data: errorData, status: response.status };
                            throw error;
                        }

                        return await safeJsonParse(response);
                    }
                }
            } catch (platformErr) {
                // إذا كان الخطأ من الـ fetch (وليس من localStorage)، نعيد رميه
                if (platformErr.status) throw platformErr;
                // خطأ localStorage — نتجاهل ونتابع للتحويل لصفحة الدخول
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // لا توجد جلسة NextAuth — لا نعمل redirect هنا.
        // الأسباب:
        // 1. middleware.js يحمي جميع المسارات server-side ويعيد التوجيه.
        // 2. الصفحات نفسها (dashboard.js, etc.) تفحص status === 'unauthenticated'.
        // 3. الـ redirect من هنا كان يسبب redirect loop لأنه يتضارب مع
        //    middleware.js + الصفحات + apiErrorHandler.
        // ═══════════════════════════════════════════════════════════════════
        throw new Error('لم يتم تسجيل الدخول')
    }

    const url = endpoint.startsWith('http')
        ? endpoint
        : `${USE_PLATFORM_API ? '' : GATEWAY_URL}${endpoint}`

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
        'X-Tenant-Id': session.user?.tenantId || '1',
        ...options.headers,
    }

    const config = {
        ...options,
        headers,
        // Add timeout
        signal: options.signal || AbortSignal.timeout(RESILIENT_CONFIG.REQUEST_TIMEOUT),
    }

    // Get service name for circuit breaker
    const serviceName = getServiceFromEndpoint(endpoint)
    const circuitBreaker = getCircuitBreaker(serviceName)

    const executeRequest = async () => {
        const response = await fetch(url, config)

        // Handle 401 Unauthorized (token expired)
        // لا نقوم بتسجيل الخروج تلقائياً لتجنب حلقة signOut اللانهائية
        // الـ middleware و الـ SessionProvider يتعاملان مع انتهاء الجلسة
        if (response.status === 401) {
            console.warn('⚠️ 401 received for', endpoint, '— returning null (no auto-signout)')
            const error = new Error('الخادم غير متاح أو الجلسة منتهية')
            error.status = 401
            throw error
        }

        // Handle 403 Forbidden (insufficient permissions)
        if (response.status === 403) {
            const error = new Error('ليس لديك الصلاحيات اللازمة لهذا الإجراء')
            error.status = 403
            throw error
        }

        // Handle other errors
        if (!response.ok) {
            const errorData = await safeJsonParse(response)

            // Extract meaningful error message from various backend formats:
            // 1. { message: "..." } — custom error
            // 2. { title: "...", errors: { "Field": ["msg"] } } — ProblemDetails (FluentValidation)
            // 3. { "Field": ["msg1", "msg2"] } — ModelState validation
            let errorMessage = errorData.message || errorData.title

            if (!errorMessage) {
                // Try to extract validation messages from errors object or top-level ModelState
                const errorsObj = errorData.errors || errorData
                if (errorsObj && typeof errorsObj === 'object' && !Array.isArray(errorsObj)) {
                    const messages = []
                    for (const [, value] of Object.entries(errorsObj)) {
                        if (Array.isArray(value)) {
                            messages.push(...value)
                        } else if (typeof value === 'string') {
                            messages.push(value)
                        }
                    }
                    if (messages.length > 0) {
                        errorMessage = messages.join(' | ')
                    }
                }
            }

            if (!errorMessage) {
                errorMessage = `خطأ في الطلب: ${response.status}`
            }

            const error = new Error(errorMessage)
            error.status = response.status
            error.response = { data: errorData, status: response.status }
            throw error
        }

        return await safeJsonParse(response)
    }

    // Execute with circuit breaker and retry
    const executeWithResilience = async () => {
        return circuitBreaker.execute(async () => {
            return withRetry(executeRequest, {
                ...RETRY_CONFIG,
                // Don't retry non-retryable errors
                shouldRetry: (error) => !NON_RETRYABLE_CODES.includes(error.status),
            })
        })
    }

    try {
        return await executeWithResilience()
    } catch (error) {
        // ═══ تحديد نوع الخطأ ═══
        const status = error?.status || 0

        // 401 → الجلسة انتهت (يُعالج في مكان آخر)
        if (status === 401) {
            return null
        }

        // أخطاء حقيقية من الـ client (400, 403, 404, 409, 422) → نرميها للمستدعي
        const isRealClientError = status >= 400 && status < 500
        if (isRealClientError) {
            error.service = serviceName
            error.endpoint = endpoint
            // معالجة الخطأ وتسجيله
            try {
                const errorResponseData = error.response?.data || { message: error.message }
                await handleAPIError(
                    {
                        response: {
                            status: error.status,
                            headers: { get: () => 'application/json' },
                            json: async () => errorResponseData,
                        },
                    },
                    endpoint,
                    config.method || 'GET',
                    { showToast: false, requestData: config.body }
                )
            } catch (apiError) {
                if (!apiError.response && error.response) {
                    apiError.response = error.response
                }
                throw apiError
            }
            throw error
        }

        // كل شيء آخر → الخدمة مش شغالة (0, 500, 502, 503, 504, network, timeout, circuit breaker)
        // نرجع null بهدوء بدل ما نرمي خطأ ونملأ الكونسول
        return null
    }
}

/**
 * GET request
 */
export async function apiGet(endpoint) {
    return authenticatedFetch(endpoint, {
        method: 'GET',
    })
}

/**
 * POST request with Tenant Isolation
 * تلقائياً يضيف tenantId للبيانات ويتحقق من العزل
 */
export async function apiPost(endpoint, data) {
    try {
        // إضافة tenantId تلقائياً إذا لم يكن موجود
        const enrichedData = await attachTenantId(data)
        
        return authenticatedFetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(enrichedData),
        })
    } catch (error) {
        console.error('❌ Error in apiPost with tenant isolation:', error)
        throw error
    }
}

/**
 * PUT request with Tenant Isolation
 * تلقائياً يضيف tenantId للبيانات ويتحقق من العزل
 */
export async function apiPut(endpoint, data) {
    try {
        // إضافة tenantId تلقائياً إذا لم يكن موجود (مثل apiPost)
        const enrichedData = await attachTenantId(data)

        return authenticatedFetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify(enrichedData),
        })
    } catch (error) {
        console.error('❌ Error in apiPut with tenant isolation:', error)
        throw error
    }
}

/**
 * DELETE request
 */
export async function apiDelete(endpoint) {
    return authenticatedFetch(endpoint, {
        method: 'DELETE',
    })
}

/**
 * Get system health (unauthenticated)
 */
export async function getSystemHealth(systemPath) {
    try {
        const response = await fetch(`${GATEWAY_URL}${systemPath}/health`)
        return response.status === 200 ? 'نشط' : 'مشكلة'
    } catch (error) {
        return 'غير متصل'
    }
}

/**
 * API Client object with all methods
 */
const api = {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    delete: apiDelete,

    // System-specific helpers
    hr: {
        // Dashboard
        getDashboardSummary: () => apiGet(API.HR.DASHBOARD_SUMMARY),

        // Employees - Updated for new PostgreSQL API
        getEmployees: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return apiGet(`${API.HR.EMPLOYEES}${queryString ? `?${queryString}` : ''}`);
        },
        getEmployee: (id) => apiGet(API.HR.EMPLOYEE_BY_ID(id)),
        createEmployee: (data) => apiPost(API.HR.EMPLOYEES, data),
        updateEmployee: (id, data) => apiPut(API.HR.EMPLOYEE_BY_ID(id), data),
        deleteEmployee: (id) => apiDelete(API.HR.EMPLOYEE_BY_ID(id)),
        uploadSignature: async (empId, data) => {
            const res = await fetch(`/api/hr/employees/${empId}`, {
                method: 'PUT', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signatureImageUrl: data.signatureImageUrl }),
            });
            return res.json();
        },
        getSignature: (empId) => apiGet(API.HR.EMPLOYEE_SIGNATURE(empId)),
        uploadPhoto: async (empId, data) => {
            const res = await fetch(`/api/hr/employees/${empId}`, {
                method: 'PUT', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoUrl: data.photoUrl }),
            });
            return res.json();
        },
        getPhoto: (empId) => apiGet(API.HR.EMPLOYEE_PHOTO(empId)),
        searchEmployees: (query) => apiGet(`${API.HR.EMPLOYEE_SEARCH}?search=${encodeURIComponent(query)}`),
        getEmployeesByDepartment: (deptId) => apiGet(`${API.HR.EMPLOYEE_BY_DEPT}?departmentId=${deptId}`),

        // Departments
        getDepartments: () => apiGet(API.HR.DEPARTMENTS),
        getDepartment: (id) => apiGet(API.HR.DEPARTMENT_BY_ID(id)),
        createDepartment: (data) => apiPost(API.HR.DEPARTMENTS, data),
        updateDepartment: (id, data) => apiPut(API.HR.DEPARTMENT_BY_ID(id), data),
        deleteDepartment: (id) => apiDelete(API.HR.DEPARTMENT_BY_ID(id)),

        // Sections (Organization Structure)
        getSections: () => apiGet(API.HR.SECTIONS),
        getSection: (id) => apiGet(API.HR.SECTION_BY_ID(id)),
        getSectionsByDepartment: (deptId) => apiGet(API.HR.SECTIONS_BY_DEPT(deptId)),
        createSection: (data) => apiPost(API.HR.SECTIONS, data),
        updateSection: (id, data) => apiPut(API.HR.SECTION_BY_ID(id), data),
        deleteSection: (id) => apiDelete(API.HR.SECTION_BY_ID(id)),

        // Units (Organization Structure)
        getOrgUnits: () => apiGet(API.HR.ORG_UNITS),
        getOrgUnit: (id) => apiGet(API.HR.ORG_UNIT_BY_ID(id)),
        getOrgUnitsBySection: (sectionId) => apiGet(API.HR.ORG_UNITS_BY_SECTION(sectionId)),
        getOrgUnitsByDepartment: (deptId) => apiGet(API.HR.ORG_UNITS_BY_DEPT(deptId)),
        createOrgUnit: (data) => apiPost(API.HR.ORG_UNITS, data),
        updateOrgUnit: (id, data) => apiPut(API.HR.ORG_UNIT_BY_ID(id), data),
        deleteOrgUnit: (id) => apiDelete(API.HR.ORG_UNIT_BY_ID(id)),

        // Transfers
        createTransfer: (data) => apiPost(API.HR.TRANSFERS, data),
        getTransfers: () => apiGet(API.HR.TRANSFERS),
        getPendingTransfers: () => apiGet(API.HR.TRANSFER_PENDING),
        approveTransfer: (id) => apiPost(API.HR.TRANSFER_APPROVE(id)),
        rejectTransfer: (id, reason) => apiPost(API.HR.TRANSFER_REJECT(id), { reason }),

        // Attendance
        getAttendance: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`${API.HR.ATTENDANCE}${query ? `?${query}` : ''}`);
        },
        recordAttendance: (data) => apiPost(API.HR.ATTENDANCE, data),
        checkOutAttendance: (employeeId, checkOutTime) => {
            const payload = { employee_id: employeeId };
            if (checkOutTime) payload.check_out = checkOutTime;
            return safeFetchJson('/api/hr/attendance', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        },
        getAttendanceReport: (employeeId, startDate, endDate) =>
            apiGet(`/api/hr/attendance/report?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`),

        // ==========================================
        // Mobile Attendance - الحضور عبر الجوال
        // ==========================================
        mobileAttendance: {
            checkIn: (data) => apiPost('/api/hr/attendance/mobile?action=checkin', data),
            checkOut: (data) => apiPost('/api/hr/attendance/mobile?action=checkout', data),
            getTodayStatus: (employeeId) => apiGet(`/api/hr/attendance/mobile?action=status&employeeId=${employeeId}`),
        },

        // ==========================================
        // Work Locations - مواقع العمل
        // ==========================================
        workLocations: {
            getAll: () => apiGet('/api/hr/attendance/work-locations'),
            getById: (id) => apiGet(`/api/hr/attendance/work-locations?id=${id}`),
            create: (data) => apiPost('/api/hr/attendance/work-locations', data),
            update: (id, data) => safeFetchJson(`/api/hr/attendance/work-locations?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }),
            delete: (id) => safeFetchJson(`/api/hr/attendance/work-locations?id=${id}`, {
                method: 'DELETE',
            }),
            getByEmployee: (employeeId) => apiGet(`/api/hr/attendance/work-locations?employeeId=${employeeId}`),
            assign: (locationId, employeeId) => apiPost(`/api/hr/attendance/work-locations?action=assign&locationId=${locationId}&employeeId=${employeeId}`),
            unassign: (locationId, employeeId) => safeFetchJson(`/api/hr/attendance/work-locations?action=unassign&locationId=${locationId}&employeeId=${employeeId}`, {
                method: 'DELETE',
            }),
        },

        // ==========================================
        // Field Work - العمل الميداني
        // ==========================================
        fieldWork: {
            getPending: (departmentId) => apiGet(`/api/hr/attendance/field-work${departmentId ? `?departmentId=${departmentId}` : ''}`),
            approve: (data) => apiPost('/api/hr/attendance/field-work', data),
        },

        // ==========================================
        // Reconciliation - مطابقة السجلات
        // ==========================================
        reconciliation: {
            getPending: () => apiGet('/api/hr/attendance/reconciliation'),
            approve: (data) => apiPost('/api/hr/attendance/reconciliation', data),
        },

        // ==========================================
        // Fingerprints - البصمات
        // ==========================================
        fingerprints: {
            getEmployeeFingerprints: (empId) => apiGet(API.HR.FINGERPRINTS_EMPLOYEE(empId)),
            create: (data) => apiPost(API.HR.FINGERPRINTS, data),
            update: (id, data) => apiPut(API.HR.FINGERPRINT_BY_ID(id), data),
            delete: (id) => apiDelete(API.HR.FINGERPRINT_BY_ID(id)),
            setPrimary: (data) => apiPut(API.HR.FINGERPRINTS_SET_PRIMARY, data),
            checkDuplicates: (empId) => apiGet(API.HR.FINGERPRINTS_CHECK_DUPLICATES(empId)),
            syncFromDevice: (data) => apiPost(API.HR.FINGERPRINTS_SYNC, data),
            getDevicesStatus: () => apiGet(API.HR.FINGERPRINTS_DEVICES_STATUS),
        },

        // ==========================================
        // Biometric Devices - أجهزة البصمة
        // ==========================================
        biometricDevices: {
            getAll: () => apiGet(API.HR.BIOMETRIC_DEVICES),
            getById: (id) => apiGet(API.HR.BIOMETRIC_DEVICE_BY_ID(id)),
            create: (data) => apiPost(API.HR.BIOMETRIC_DEVICES, data),
            update: (data) => apiPut(API.HR.BIOMETRIC_DEVICES, data),
            delete: (id) => apiDelete(`${API.HR.BIOMETRIC_DEVICES}?id=${id}`),
            testConnection: (id) => apiGet(API.HR.BIOMETRIC_DEVICE_TEST(id)),
            triggerSync: (id) => apiGet(API.HR.BIOMETRIC_DEVICE_SYNC(id)),
            syncAll: () => apiPost(API.HR.BIOMETRIC_SYNC_ALL, { action: 'sync-all' }),
            getSyncLogs: (id) => apiGet(API.HR.BIOMETRIC_DEVICE_LOGS(id)),
            getStatus: (id) => apiGet(API.HR.BIOMETRIC_DEVICE_STATUS(id)),
        },

        // ==========================================
        // Agent Sync - مزامنة الوكيل المحلي
        // ==========================================
        agentSync: (data) => apiPost(API.HR.AGENT_SYNC, data),

        // ==========================================
        // Official Holidays - الإجازات الرسمية
        // ==========================================
        officialHolidays: {
            getAll: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.HR.OFFICIAL_HOLIDAYS}${query ? `?${query}` : ''}`);
            },
            getById: (id) => apiGet(API.HR.OFFICIAL_HOLIDAY_BY_ID(id)),
            getByYear: (year) => apiGet(API.HR.OFFICIAL_HOLIDAYS_YEAR(year)),
            create: (data) => apiPost(API.HR.OFFICIAL_HOLIDAYS, data),
            update: (id, data) => apiPut(API.HR.OFFICIAL_HOLIDAY_BY_ID(id), data),
            delete: (id) => apiDelete(API.HR.OFFICIAL_HOLIDAY_BY_ID(id)),
            sync: (data) => apiPost(API.HR.OFFICIAL_HOLIDAYS_SYNC, data),
            checkDate: (date) => apiGet(API.HR.OFFICIAL_HOLIDAYS_CHECK(date)),
        },

        // ==========================================
        // Custom Schedules - المواعيد المخصصة
        // ==========================================
        customSchedules: {
            getAll: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.HR.CUSTOM_SCHEDULES}${query ? `?${query}` : ''}`);
            },
            getById: (id) => apiGet(API.HR.CUSTOM_SCHEDULE_BY_ID(id)),
            getByEmployee: (empId) => apiGet(API.HR.CUSTOM_SCHEDULES_EMPLOYEE(empId)),
            create: (data) => apiPost(API.HR.CUSTOM_SCHEDULES, data),
            update: (id, data) => apiPut(API.HR.CUSTOM_SCHEDULE_BY_ID(id), data),
            approve: (id, data) => apiPut(API.HR.CUSTOM_SCHEDULE_APPROVE(id), data),
            reject: (id, data) => apiPut(API.HR.CUSTOM_SCHEDULE_REJECT(id), data),
            cancel: (id, data) => apiDelete(API.HR.CUSTOM_SCHEDULE_BY_ID(id), data),
            getExempted: () => apiGet(API.HR.CUSTOM_SCHEDULES_EXEMPTED),
            bulkExempt: (data) => apiPost(API.HR.CUSTOM_SCHEDULES_BULK_EXEMPT, data),
        },

        // ==========================================
        // Work Shifts - نوبات العمل
        // ==========================================
        workShifts: {
            getAll: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.HR.WORK_SHIFTS}${query ? `?${query}` : ''}`);
            },
            getById: (id) => apiGet(API.HR.WORK_SHIFT_BY_ID(id)),
            getDefault: () => apiGet(API.HR.WORK_SHIFTS_DEFAULT),
            getByDepartment: (deptId) => apiGet(API.HR.WORK_SHIFTS_BY_DEPARTMENT(deptId)),
            create: (data) => apiPost(API.HR.WORK_SHIFTS, data),
            update: (id, data) => apiPut(API.HR.WORK_SHIFT_BY_ID(id), data),
            delete: (id) => apiDelete(API.HR.WORK_SHIFT_BY_ID(id)),
            assignDepartment: (data) => apiPost(API.HR.WORK_SHIFT_ASSIGN_DEPARTMENT, data),
            assignEmployee: (data) => apiPost(API.HR.WORK_SHIFT_ASSIGN_EMPLOYEE, data),
            unassignEmployee: (empId) => apiDelete(API.HR.WORK_SHIFT_UNASSIGN_EMPLOYEE(empId)),
        },

        // ==========================================
        // Cadres - الكوادر الوظيفية
        // ==========================================
        cadres: {
            getAll: () => apiGet(API.HR.CADRES),
            getById: (id) => apiGet(API.HR.CADRE_BY_ID(id)),
            getActive: () => apiGet(API.HR.CADRE_ACTIVE),
            search: (query) => apiGet(`${API.HR.CADRE_SEARCH}?q=${encodeURIComponent(query)}`),
            create: (data) => apiPost(API.HR.CADRES, data),
            update: (id, data) => apiPut(API.HR.CADRE_BY_ID(id), data),
            delete: (id) => apiDelete(API.HR.CADRE_BY_ID(id)),
            checkCodeExists: (code, excludeId = null) =>
                apiGet(`${API.HR.CADRE_CHECK_CODE(code)}${excludeId ? `?excludeId=${excludeId}` : ''}`),
        },

        // ==========================================
        // Salary Scales - سلم الرواتب والمراتب
        // ==========================================
        salaryScales: {
            // سلالم الرواتب
            getAll: () => apiGet(API.HR.SALARY_SCALES),
            getById: (id) => apiGet(API.HR.SALARY_SCALE_BY_ID(id)),
            getActive: () => apiGet(API.HR.SALARY_SCALE_ACTIVE),
            getByCadre: (cadreId) => apiGet(API.HR.SALARY_SCALES_BY_CADRE(cadreId)),
            create: (data) => apiPost(API.HR.SALARY_SCALES, data),
            update: (id, data) => apiPut(API.HR.SALARY_SCALE_BY_ID(id), data),
            delete: (id) => apiDelete(API.HR.SALARY_SCALE_BY_ID(id)),
            seedOfficial: () => apiPost(API.HR.SALARY_SCALE_SEED_OFFICIAL),

            // المراتب
            getGrades: (scaleId) => apiGet(API.HR.GRADE_SCALES(scaleId)),
            getGrade: (gradeId) => apiGet(API.HR.GRADE_SCALE_BY_ID(gradeId)),
            createGrade: (scaleId, data) => apiPost(API.HR.GRADE_SCALES(scaleId), data),
            updateGrade: (gradeId, data) => apiPut(API.HR.GRADE_SCALE_BY_ID(gradeId), data),
            deleteGrade: (gradeId) => apiDelete(API.HR.GRADE_SCALE_BY_ID(gradeId)),
            regenerateSteps: (gradeId) => apiPost(API.HR.GRADE_SCALE_REGENERATE_STEPS(gradeId)),

            // الدرجات
            getSteps: (gradeId) => apiGet(API.HR.SALARY_SCALE_STEPS(gradeId)),
            bulkUpdateSteps: (data) => apiPut(API.HR.SALARY_SCALE_STEPS_BULK_UPDATE, data),
            calculateSalary: (gradeId, step) => apiGet(API.HR.SALARY_SCALE_CALCULATE_SALARY(gradeId, step)),

            // تعيين الراتب للموظف
            getEmployeeSalaryInfo: (empId) => apiGet(API.HR.EMPLOYEE_SALARY_INFO(empId)),
            assignEmployeeToGrade: (data) => apiPost(API.HR.EMPLOYEE_ASSIGN_GRADE, data),

            // العلاوة الدورية
            getEligibleForIncrement: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.HR.INCREMENT_ELIGIBLE}${query ? `?${query}` : ''}`);
            },
            processIncrement: (empId) => apiPost(API.HR.INCREMENT_PROCESS(empId)),
            processBulkIncrement: (employeeIds) => apiPost(API.HR.INCREMENT_PROCESS_BULK, { employeeIds }),
        },

        // ==========================================
        // Leaves - نظام الإجازات
        // ==========================================
        leaves: {
            // الطلبات
            getAll: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.HR.LEAVES}${query ? `?${query}` : ''}`);
            },
            getById: (id) => apiGet(API.HR.LEAVE_BY_ID(id)),
            getByEmployee: (employeeId, params = {}) => {
                const query = new URLSearchParams({ ...params, employeeId }).toString();
                return apiGet(`${API.HR.LEAVES}?${query}`);
            },
            getPending: () => apiGet(`${API.HR.LEAVES}?status=pending`),
            getApproved: () => apiGet(`${API.HR.LEAVES}?status=approved`),
            getRejected: () => apiGet(`${API.HR.LEAVES}?status=rejected`),

            // إنشاء طلب جديد
            create: (data) => apiPost(API.HR.LEAVES, {
                employeeId: parseInt(data.employee_id),
                substituteEmployeeId: data.employee_to_id ? parseInt(data.employee_to_id) : null,
                leaveType: String(data.leave_type || '01').padStart(2, '0'),
                startDate: data.start_date,
                endDate: data.end_date,
                daysCount: parseInt(data.days_count) || 1,
                reason: data.reason,
                notes: data.notes,
            }),
            update: (id, data) => apiPut(API.HR.LEAVE_BY_ID(id), data),
            delete: (id) => apiDelete(API.HR.LEAVE_BY_ID(id)),

            // الاعتمادات متعددة المستويات
            approveByEmployee: (id) => apiPost(API.HR.LEAVE_APPROVE_EMPLOYEE(id)),
            approveByManager: (id) => apiPost(API.HR.LEAVE_APPROVE_MANAGER(id)),
            approveByFinal: (id) => apiPost(API.HR.LEAVE_APPROVE_FINAL(id)),
            approveByHR: (id) => apiPost(API.HR.LEAVE_APPROVE_HR(id)),
            reject: (id, reason) => apiPost(API.HR.LEAVE_REJECT(id), { reason }),

            // موافقة الموظف البديل
            getSubstitutePending: () => apiGet(API.HR.LEAVE_SUBSTITUTE_PENDING),
            approveBySubstitute: (leaveId, isApproved, notes = '', rejectionReason = '') =>
                apiPost(API.HR.LEAVE_SUBSTITUTE_APPROVE, {
                    leaveId,
                    isApproved,
                    notes,
                    rejectionReason,
                }),

            // الموافقات حسب المستوى
            getPendingByLevel: (level, departmentId = null) =>
                apiGet(`${API.HR.LEAVE_LEVEL_PENDING(level)}${departmentId ? `?departmentId=${departmentId}` : ''}`),
            approveAtLevel: (leaveId, level, isApproved, notes = '', rejectionReason = '') =>
                apiPost(API.HR.LEAVE_LEVEL_APPROVE(leaveId, level), {
                    isApproved,
                    notes,
                    rejectionReason,
                }),

            // الموافقات للمدير المباشر
            getManagerPending: () => apiGet(API.HR.LEAVE_MANAGER_PENDING),

            // الأرصدة
            getBalance: (employeeId) => apiGet(API.HR.LEAVE_BALANCE(employeeId)),
            getAllBalances: () => apiGet(`${API.HR.LEAVES}/balances`),
            updateBalance: (employeeId, data) => apiPut(API.HR.LEAVE_BALANCE(employeeId), data),

            // ترحيل الإجازات السنوية
            getCarryForwardList: (hijriYear) => apiGet(`/api/hr/leaves/carryforward?year=${hijriYear}`),
            processCarryForward: (hijriYear) => apiPost('/api/hr/leaves/carryforward/process', { year: hijriYear }),
            getCarryForwardHistory: (employeeId) => apiGet(`/api/hr/leaves/carryforward/history/${employeeId}`),

            // الإجازات التعويضية
            getCompensatory: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/leaves/compensatory${query ? `?${query}` : ''}`);
            },
            createCompensatory: (data) => apiPost('/api/hr/leaves/compensatory', data),
            approveCompensatory: (id) => apiPost(`/api/hr/leaves/compensatory/${id}/approve`),

            // الإجازات المرضية
            getSickLeaves: (params = {}) => {
                const query = new URLSearchParams({ ...params, leave_type: '03' }).toString();
                return apiGet(`/api/hr/leaves?${query}`);
            },
            attachMedicalReport: (id, data) => apiPost(`/api/hr/leaves/${id}/medical-report`, data),

            // إجازات التدريب
            getTrainingLeaves: (params = {}) => {
                const query = new URLSearchParams({ ...params, category: 'training' }).toString();
                return apiGet(`/api/hr/leaves?${query}`);
            },

            // قرارات الإجازة
            getDecision: (id) => apiGet(`/api/hr/leaves/${id}/decision`),
            generateDecision: (id) => apiPost(`/api/hr/leaves/${id}/generate-decision`),
            printDecision: (id) => apiGet(`/api/hr/leaves/${id}/decision/print`),

            // التقارير
            getStatistics: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/leaves/statistics${query ? `?${query}` : ''}`);
            },
            getSummaryReport: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/leaves/reports/summary${query ? `?${query}` : ''}`);
            },
            getDetailedReport: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/leaves/reports/detailed${query ? `?${query}` : ''}`);
            },
            getEmployeeReport: (employeeId, params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.HR.LEAVES}/reports/employee/${employeeId}${query ? `?${query}` : ''}`);
            },
            getDepartmentReport: (departmentId, params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.HR.LEAVES}/reports/department/${departmentId}${query ? `?${query}` : ''}`);
            },
            getOnLeaveToday: () => apiGet(`${API.HR.LEAVES}/on-leave-today`),

            // الإعدادات
            getSettings: () => apiGet(`${API.HR.LEAVES}/settings`),
            updateSettings: (data) => apiPut(`${API.HR.LEAVES}/settings`, data),
            getLeaveTypes: () => apiGet(`${API.HR.LEAVES}/types`),

            // التصدير
            exportToExcel: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.HR.LEAVES}/export/excel${query ? `?${query}` : ''}`);
            },
            exportToPDF: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.HR.LEAVES}/export/pdf${query ? `?${query}` : ''}`);
            },

            // تمديد الإجازات
            extensions: {
                // إنشاء طلب تمديد
                create: (data) => apiPost(`${API.HR.LEAVES}/extension`, {
                    leaveId: parseInt(data.leaveId),
                    newEndDate: data.newEndDate,
                    reason: data.reason,
                    attachmentPath: data.attachmentPath,
                }),

                // جلب تمديدات إجازة معينة
                getByLeaveId: (leaveId) => apiGet(`${API.HR.LEAVES}/${leaveId}/extensions`),

                // جلب طلبات التمديد المعلقة للموظف البديل
                getSubstitutePending: () => apiGet(`${API.HR.LEAVES}/extension/substitute/pending`),

                // جلب طلبات التمديد المعلقة للمدير
                getManagerPending: () => apiGet(`${API.HR.LEAVES}/extension/manager/pending`),

                // موافقة/رفض طلب تمديد
                approve: (extensionId, level, isApproved, notes = '', rejectionReason = '') =>
                    apiPost(`${API.HR.LEAVES}/extension/approve`, {
                        extensionId,
                        level,
                        isApproved,
                        notes,
                        rejectionReason,
                    }),
            },

            // التحقق من صلاحية تقديم الطلب
            validation: {
                // التحقق من صلاحية الموظف
                validateEmployee: (employeeId, startDate) =>
                    apiGet(`${API.HR.LEAVES}/validate/employee/${employeeId}?startDate=${startDate}`),

                // التحقق من صلاحية الموظف البديل
                validateSubstitute: (substituteId, startDate, endDate) =>
                    apiGet(`${API.HR.LEAVES}/validate/substitute/${substituteId}?startDate=${startDate}&endDate=${endDate}`),
            },

            // ==========================================
            // القرارات - Leave Decisions
            // ==========================================
            decisions: {
                generate: (leaveId, data) => apiPost(`${API.HR.LEAVES}/${leaveId}/decision`, data),
                getByLeave: (leaveId) => apiGet(`${API.HR.LEAVES}/${leaveId}/decision`),
                print: (decisionId) => apiGet(`${API.HR.LEAVES}/decisions/${decisionId}/print`),
                getAll: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return apiGet(`${API.HR.LEAVES}/decisions${query ? `?${query}` : ''}`);
                },
            },

            // ==========================================
            // استثناءات الموافقات - Approval Exceptions
            // ==========================================
            exceptions: {
                getAll: () => apiGet(`${API.HR.LEAVES}/approval-exceptions`),
                getById: (id) => apiGet(`${API.HR.LEAVES}/approval-exceptions/${id}`),
                create: (data) => apiPost(`${API.HR.LEAVES}/approval-exceptions`, data),
                update: (id, data) => apiPut(`${API.HR.LEAVES}/approval-exceptions/${id}`, data),
                delete: (id) => apiDelete(`${API.HR.LEAVES}/approval-exceptions/${id}`),
                getByEmployee: (employeeId) => apiGet(`${API.HR.LEAVES}/approval-exceptions/employee/${employeeId}`),
            },

            // ==========================================
            // التقارير - Reports (Extended)
            // ==========================================
            reports: {
                employeeSummary: (employeeId, params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return apiGet(`${API.HR.LEAVES}/reports/employee/${employeeId}${query ? `?${query}` : ''}`);
                },
                periodSummary: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return apiGet(`${API.HR.LEAVES}/reports/period${query ? `?${query}` : ''}`);
                },
                exportBalances: (params = {}, format = 'excel') => {
                    const query = new URLSearchParams({ ...params, format }).toString();
                    return apiGet(`${API.HR.LEAVES}/reports/balances/export?${query}`);
                },
                getBalances: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return apiGet(`${API.HR.LEAVES}/balances${query ? `?${query}` : ''}`);
                },
            },

            // ==========================================
            // الجداول - Schedules
            // ==========================================
            schedules: {
                getCalendar: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return apiGet(`${API.HR.LEAVES}/schedule${query ? `?${query}` : ''}`);
                },
                getSickLeaves: (params = {}) => {
                    const query = new URLSearchParams({ ...params, leave_type: '03' }).toString();
                    return apiGet(`${API.HR.LEAVES}/schedule/sick?${query}`);
                },
                getTrainingLeaves: (params = {}) => {
                    const query = new URLSearchParams({ ...params, category: 'training' }).toString();
                    return apiGet(`${API.HR.LEAVES}/schedule/training?${query}`);
                },
            },

            // ==========================================
            // المواد القانونية - Decision Articles
            // ==========================================
            articles: {
                getAll: () => apiGet(`${API.HR.LEAVES}/decision-articles`),
                getById: (id) => apiGet(`${API.HR.LEAVES}/decision-articles/${id}`),
                create: (data) => apiPost(`${API.HR.LEAVES}/decision-articles`, data),
                update: (id, data) => apiPut(`${API.HR.LEAVES}/decision-articles/${id}`, data),
                delete: (id) => apiDelete(`${API.HR.LEAVES}/decision-articles/${id}`),
                getByLeaveType: (leaveTypeCode) => apiGet(`${API.HR.LEAVES}/decision-articles/type/${leaveTypeCode}`),
            },

            // ==========================================
            // الترحيل المحسّن - Enhanced Carryforward
            // ==========================================
            carryforward: {
                preview: (params) => apiPost(`${API.HR.LEAVES}/carryforward/preview`, params),
                execute: (params) => apiPost(`${API.HR.LEAVES}/carryforward/execute`, params),
                getHistory: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return apiGet(`${API.HR.LEAVES}/carryforward/history${query ? `?${query}` : ''}`);
                },
                getEmployeeHistory: (employeeId) => apiGet(`${API.HR.LEAVES}/carryforward/history/${employeeId}`),
            },

            // ==========================================
            // العمل الإضافي (للإجازات التعويضية) - Overtime
            // ==========================================
            overtime: {
                getByEmployee: (employeeId) => apiGet(`/api/hr/employees/${employeeId}/overtime`),
                create: (data) => apiPost('/api/hr/overtime', data),
                update: (id, data) => apiPut(`/api/hr/overtime/${id}`, data),
                delete: (id) => apiDelete(`/api/hr/overtime/${id}`),
            },
        },

        // Legacy leaves methods (للتوافق مع الكود القديم)
        getLeaves: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`${API.HR.LEAVES}${query ? `?${query}` : ''}`);
        },
        getLeavesByEmployee: (employeeId) => apiGet(`${API.HR.LEAVES}?employeeId=${employeeId}`),
        requestLeave: (data) => {
            const payload = {
                employee_id: data.employeeId || data.employee_id,
                leave_type: data.leaveType || data.leave_type,
                start_date: data.startDate || data.start_date,
                end_date: data.endDate || data.end_date,
                days_count: data.daysCount || data.days_count,
                reason: data.reason
            };
            return apiPost(API.HR.LEAVES, payload);
        },
        approveLeave: (id, notes) =>
            USE_PLATFORM_API
                ? apiPut(API.HR.LEAVE_BY_ID(id), { status: 'approved', notes })
                : apiPost(API.HR.LEAVE_APPROVE_EMPLOYEE(id)),
        rejectLeave: (id, reason) =>
            USE_PLATFORM_API
                ? apiPut(API.HR.LEAVE_BY_ID(id), { status: 'rejected', reason })
                : apiPost(API.HR.LEAVE_REJECT(id), { reason }),
        getLeaveBalance: (employeeId) => apiGet(API.HR.LEAVE_BALANCE(employeeId)),

        // Payroll
        getPayroll: (month, year) => apiGet(`${API.HR.PAYROLL}?month=${month}&year=${year}`),
        getPayslips: (month) => apiGet(`${API.HR.PAYROLL}/payslips${month ? `?month=${month}` : ''}`),
        getEmployeePayslip: (employeeId, month, year) =>
            apiGet(`${API.HR.PAYROLL}/payslip/${employeeId}?month=${month}&year=${year}`),
        processPayroll: (month, year) => apiPost(`${API.HR.PAYROLL}/process`, { month, year }),
        generatePayslip: (salaryId) => apiPost(`${API.HR.PAYROLL}/payslip/${salaryId}/generate`),
        downloadPayslip: (payslipId) => apiGet(`${API.HR.PAYROLL}/payslip/${payslipId}/download`),

        // Eltizam Integration (التكامل مع نظام التزام)
        eltizam: {
            checkConnection: () => apiGet('/api/hr/eltizam/status'),
            syncEmployees: () => apiPost('/api/hr/eltizam/sync-employees'),
        },

        // ==========================================
        // Loans - السلف والقروض
        // ==========================================
        loans: {
            // السلف
            getLoans: (filter = 'All') => apiGet(`/api/hr/loans?filter=${filter}`),
            getLoan: (id) => apiGet(`/api/hr/loans/${id}`),
            getLoansByEmployee: (empId) => apiGet(`/api/hr/loans/employee/${empId}`),
            createLoan: (data) => apiPost('/api/hr/loans', data),
            updateLoan: (id, data) => apiPut(`/api/hr/loans/${id}`, data),
            deleteLoan: (id) => apiDelete(`/api/hr/loans/${id}`),
            toggleLoanStatus: (id) => apiPost(`/api/hr/loans/${id}/toggle-status`),

            // قائمة الأقساط
            getLoanInstallments: (loanId) => apiGet(`/api/hr/loans/${loanId}/installments`),
            updateInstallment: (id, data) => apiPut(`/api/hr/loans/installments/${id}`, data),
            markInstallmentPaid: (id) => apiPost(`/api/hr/loans/installments/${id}/pay`),
            reserveInstallment: (id, note) => apiPost(`/api/hr/loans/installments/${id}/reserve`, { note }),

            // إحصائيات السلف
            getLoansStatistics: () => apiGet('/api/hr/loans/statistics'),
        },

        // ==========================================
        // Loan Destinations - جهات التسليف
        // ==========================================
        loanDestinations: {
            getAll: () => apiGet('/api/hr/loan-destinations'),
            getById: (id) => apiGet(`/api/hr/loan-destinations/${id}`),
            create: (data) => apiPost('/api/hr/loan-destinations', data),
            update: (id, data) => apiPut(`/api/hr/loan-destinations/${id}`, data),
            delete: (id) => apiDelete(`/api/hr/loan-destinations/${id}`),
        },

        // Banks - البنوك
        getBanks: () => apiGet('/api/hr/banks'),

        // ==========================================
        // Payroll - الرواتب والمستحقات
        // ==========================================
        payroll: {
            // مسيرات الرواتب
            getPayrolls: (year) => apiGet(`/api/hr/payroll${year ? `?year=${year}` : ''}`),
            getPayroll: (id) => apiGet(`/api/hr/payroll/${id}`),
            createPayroll: (data) => apiPost('/api/hr/payroll', data),
            updatePayroll: (id, data) => apiPut(`/api/hr/payroll/${id}`, data),
            deletePayroll: (id) => apiDelete(`/api/hr/payroll/${id}`),
            processPayroll: (id) => apiPost(`/api/hr/payroll/${id}/process`),
            approvePayroll: (id) => apiPost(`/api/hr/payroll/${id}/approve`),

            // موظفي المسير
            getPayrollEmployees: (payrollId) => apiGet(`/api/hr/payroll/${payrollId}/employees`),
            getPayrollEmployee: (payrollId, empId) => apiGet(`/api/hr/payroll/${payrollId}/employees/${empId}`),
            addEmployeeToPayroll: (payrollId, data) => apiPost(`/api/hr/payroll/${payrollId}/employees`, data),
            updatePayrollEmployee: (payrollId, empId, data) => apiPut(`/api/hr/payroll/${payrollId}/employees/${empId}`, data),
            removeEmployeeFromPayroll: (payrollId, empId) => apiDelete(`/api/hr/payroll/${payrollId}/employees/${empId}`),
            calculateEmployeeSalary: (payrollId, empId, data) => apiPost(`/api/hr/payroll/${payrollId}/employees/${empId}/calculate`, data),

            // إحصائيات الرواتب
            getPayrollStatistics: (year) => apiGet(`/api/hr/payroll/statistics${year ? `?year=${year}` : ''}`),
            getPayrollSummary: (payrollId) => apiGet(`/api/hr/payroll/${payrollId}/summary`),

            // Integration deductions
            getIntegrationDeductions: (month, year) =>
              apiGet(`/api/hr/payroll/integration-deductions?month=${month}&year=${year}`),
            scanIntegrationDeductions: (month, year) =>
              apiPost('/api/hr/payroll/integration-deductions', { month, year }),
            waiveIntegrationDeduction: (id, reason) =>
              apiPut(`/api/hr/payroll/integration-deductions?id=${id}`, { status: 'Waived', waiverReason: reason }),

            // Clearance check
            getClearanceCheck: (payrollId) =>
              apiGet(`/api/hr/payroll/${payrollId}/clearance-check`),
            runClearanceCheck: (payrollId) =>
              apiPost(`/api/hr/payroll/${payrollId}/clearance-check`, { action: 'check' }),

            // Employee obligations
            getEmployeeObligations: (employeeId) =>
              apiGet(`/api/hr/payroll/employee-obligations?employeeId=${employeeId}`),
        },

        // ==========================================
        // Substitutes - البدلات والعلاوات
        // ==========================================
        substitutes: {
            // تعريفات البدلات
            getAll: () => apiGet('/api/hr/substitutes'),
            getById: (id) => apiGet(`/api/hr/substitutes/${id}`),
            create: (data) => apiPost('/api/hr/substitutes', data),
            update: (id, data) => apiPut(`/api/hr/substitutes/${id}`, data),
            delete: (id) => apiDelete(`/api/hr/substitutes/${id}`),

            // بدلات الموظفين
            getEmployeeSubstitutes: (empId) => apiGet(`/api/hr/employees/${empId}/substitutes`),
            addEmployeeSubstitute: (empId, data) => apiPost(`/api/hr/employees/${empId}/substitutes`, data),
            updateEmployeeSubstitute: (empId, id, data) => apiPut(`/api/hr/employees/${empId}/substitutes/${id}`, data),
            removeEmployeeSubstitute: (empId, id) => apiDelete(`/api/hr/employees/${empId}/substitutes/${id}`),
            toggleEmployeeSubstitute: (empId, id) => apiPost(`/api/hr/employees/${empId}/substitutes/${id}/toggle`),
        },

        // ==========================================
        // Deductions - الخصومات والاستقطاعات
        // ==========================================
        deductions: {
            // تعريفات الخصومات
            getAll: () => apiGet('/api/hr/deductions'),
            getById: (id) => apiGet(`/api/hr/deductions/${id}`),
            create: (data) => apiPost('/api/hr/deductions', data),
            update: (id, data) => apiPut(`/api/hr/deductions/${id}`, data),
            delete: (id) => apiDelete(`/api/hr/deductions/${id}`),

            // خصومات الموظفين
            getEmployeeDeductions: (empId) => apiGet(`/api/hr/employees/${empId}/deductions`),
            addEmployeeDeduction: (empId, data) => apiPost(`/api/hr/employees/${empId}/deductions`, data),
            updateEmployeeDeduction: (empId, id, data) => apiPut(`/api/hr/employees/${empId}/deductions/${id}`, data),
            removeEmployeeDeduction: (empId, id) => apiDelete(`/api/hr/employees/${empId}/deductions/${id}`),
            toggleEmployeeDeduction: (empId, id) => apiPost(`/api/hr/employees/${empId}/deductions/${id}/toggle`),

            // قرارات الخصم
            getDeductionDecisions: () => apiGet('/api/hr/deduction-decisions'),
            createDeductionDecision: (data) => apiPost('/api/hr/deduction-decisions', data),
            approveDeductionDecision: (id) => apiPost(`/api/hr/deduction-decisions/${id}/approve`),
        },

        // ==========================================
        // Late Deductions - خصومات التأخير
        // ==========================================
        lateDeductions: {
            calculate: (month, year, employeeId) => {
                const params = new URLSearchParams();
                if (month) params.set('month', month);
                if (year) params.set('year', year);
                if (employeeId) params.set('employeeId', employeeId);
                return apiGet(`/api/hr/attendance/late-deductions?${params.toString()}`);
            },
            apply: (data) => apiPost('/api/hr/attendance/late-deductions', data),
        },

        // ==========================================
        // Annual Increment - العلاوة الدورية
        // ==========================================
        annualIncrement: {
            getAll: (year) => apiGet(`/api/hr/annual-increment${year ? `?year=${year}` : ''}`),
            getById: (id) => apiGet(`/api/hr/annual-increment/${id}`),
            create: (data) => apiPost('/api/hr/annual-increment', data),
            getEmployees: (incrementId) => apiGet(`/api/hr/annual-increment/${incrementId}/employees`),
            addEmployee: (incrementId, data) => apiPost(`/api/hr/annual-increment/${incrementId}/employees`, data),
            removeEmployee: (incrementId, empId) => apiDelete(`/api/hr/annual-increment/${incrementId}/employees/${empId}`),
            process: (id) => apiPost(`/api/hr/annual-increment/${id}/process`),
            approve: (id) => apiPost(`/api/hr/annual-increment/${id}/approve`),
        },

        // ==========================================
        // GOSI - التأمينات الاجتماعية
        // ==========================================
        gosi: {
            getSettings: () => apiGet('/api/hr/gosi/settings'),
            updateSettings: (data) => apiPut('/api/hr/gosi/settings', data),
            getEmployeeGosi: (empId) => apiGet(`/api/hr/employees/${empId}/gosi`),
            updateEmployeeGosi: (empId, data) => apiPut(`/api/hr/employees/${empId}/gosi`, data),
            getGosiReport: (payrollId) => apiGet(`/api/hr/payroll/${payrollId}/gosi-report`),
            getNonSaudiCompensation: (payrollId) => apiGet(`/api/hr/payroll/${payrollId}/non-saudi-compensation`),
        },

        // ==========================================
        // Payroll Reports - تقارير الرواتب
        // ==========================================
        payrollReports: {
            getDetailedReport: (payrollId, contractList) => apiGet(`/api/hr/payroll/${payrollId}/reports/detailed${contractList ? `?contracts=${contractList}` : ''}`),
            getSummaryReport: (payrollId) => apiGet(`/api/hr/payroll/${payrollId}/reports/summary`),
            getEmployeePayslip: (payrollId, empId) => apiGet(`/api/hr/payroll/${payrollId}/employees/${empId}/payslip`),
            exportPaymentFile: (payrollId, format) => apiGet(`/api/hr/payroll/${payrollId}/export/${format || 'excel'}`),
            getGosiReport: (payrollId) => apiGet(`/api/hr/payroll/${payrollId}/reports/gosi`),
            getBankFile: (payrollId) => apiGet(`/api/hr/payroll/${payrollId}/export/bank-file`),
        },

        // ==========================================
        // Payroll Entitlement Report - حصر رواتب ومستحقات موظف
        // ==========================================
        payrollEntitlementReport: {
            // توليد تقرير شامل للموظف
            generate: (params) => apiPost('/api/hr/payroll-report/generate', {
                employeeId: params.employeeId,
                dateFrom: params.dateFrom,
                dateTo: params.dateTo,
                reportType: params.reportType,
                numberFormat: params.numberFormat,
                preparerId: params.preparerId,
                auditorId: params.auditorId,
            }),

            // سجل رواتب الموظف خلال فترة
            getEmployeePayrollHistory: (employeeId, dateFrom, dateTo) => {
                const params = new URLSearchParams();
                if (dateFrom) params.append('from', dateFrom);
                if (dateTo) params.append('to', dateTo);
                return apiGet(`/api/hr/payroll-report/employee/${employeeId}/history?${params.toString()}`);
            },

            // أنواع التقارير المتاحة
            getReportTypes: () => apiGet('/api/hr/payroll-report/types'),

            // تصدير التقرير
            exportPDF: (reportId) => apiGet(`/api/hr/payroll-report/${reportId}/export/pdf`),
            exportExcel: (reportId) => apiGet(`/api/hr/payroll-report/${reportId}/export/excel`),

            // البحث في التقارير السابقة
            search: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/payroll-report/search${query ? `?${query}` : ''}`);
            },
        },

        // ==========================================
        // Clearance - إخلاء الطرف
        // ==========================================
        clearance: {
            // العمليات الأساسية CRUD
            getAll: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/clearances${query ? `?${query}` : ''}`);
            },
            getById: (id) => apiGet(`/api/hr/clearances/${id}`),
            getByEmployee: (employeeId) => apiGet(`/api/hr/clearances/employee/${employeeId}`),
            getByStatus: (status) => apiGet(`/api/hr/clearances?status=${status}`),
            getPending: () => apiGet('/api/hr/clearances?status=pending'),
            getInProgress: () => apiGet('/api/hr/clearances?status=in_progress'),
            getCompleted: () => apiGet('/api/hr/clearances?status=completed'),
            create: (data) => apiPost('/api/hr/clearances', data),
            update: (id, data) => apiPut(`/api/hr/clearances/${id}`, data),
            delete: (id) => apiDelete(`/api/hr/clearances/${id}`),
            cancel: (id, reason) => apiPost(`/api/hr/clearances/${id}/cancel`, { reason }),

            // الاعتمادات - Approvals
            approve: (id, departmentId, data) => apiPost(`/api/hr/clearances/${id}/approve/${departmentId}`, data),
            reject: (id, departmentId, reason) => apiPost(`/api/hr/clearances/${id}/reject/${departmentId}`, { reason }),
            getApprovalStatus: (id) => apiGet(`/api/hr/clearances/${id}/approval-status`),
            getPendingApprovals: (departmentId) => apiGet(`/api/hr/clearances/pending-approvals/${departmentId}`),
            getApprovalHistory: (id) => apiGet(`/api/hr/clearances/${id}/approval-history`),

            // العهد - Custody
            getEmployeeCustodies: (employeeId) => apiGet(`/api/hr/clearances/custody/${employeeId}`),
            getClearanceCustodies: (clearanceId) => apiGet(`/api/hr/clearances/${clearanceId}/custodies`),
            handoverCustody: (clearanceId, custodyId, data) => apiPost(`/api/hr/clearances/${clearanceId}/custody/${custodyId}/handover`, data),
            returnCustody: (clearanceId, custodyId, data) => apiPost(`/api/hr/clearances/${clearanceId}/custody/${custodyId}/return`, data),
            getCustodyStatus: (clearanceId) => apiGet(`/api/hr/clearances/${clearanceId}/custody-status`),

            // التسوية المالية - Settlement
            calculateSettlement: (clearanceId) => apiGet(`/api/hr/clearances/${clearanceId}/settlement/calculate`),
            getSettlement: (clearanceId) => apiGet(`/api/hr/clearances/${clearanceId}/settlement`),
            processSettlement: (clearanceId, data) => apiPost(`/api/hr/clearances/${clearanceId}/settlement/process`, data),
            approveSettlement: (clearanceId) => apiPost(`/api/hr/clearances/${clearanceId}/settlement/approve`),
            getEndOfService: (employeeId, terminationReason) => apiGet(`/api/hr/clearances/end-of-service/${employeeId}?reason=${terminationReason}`),

            // المستندات - Documents
            generateDocument: (clearanceId) => apiGet(`/api/hr/clearances/${clearanceId}/document`),
            downloadDocument: (clearanceId, format = 'pdf') => apiGet(`/api/hr/clearances/${clearanceId}/document/download?format=${format}`),
            uploadAttachment: (clearanceId, file) => {
                const formData = new FormData();
                formData.append('file', file);
                return safeFetchJson(`/api/hr/clearances/${clearanceId}/attachments`, {
                    method: 'POST',
                    body: formData
                });
            },
            getAttachments: (clearanceId) => apiGet(`/api/hr/clearances/${clearanceId}/attachments`),
            deleteAttachment: (clearanceId, attachmentId) => apiDelete(`/api/hr/clearances/${clearanceId}/attachments/${attachmentId}`),

            // التقارير - Reports
            getStatistics: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/clearances/statistics${query ? `?${query}` : ''}`);
            },
            getSummaryReport: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/clearances/reports/summary${query ? `?${query}` : ''}`);
            },
            getDetailedReport: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/clearances/reports/detailed${query ? `?${query}` : ''}`);
            },
            getDepartmentReport: (departmentId, params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/clearances/reports/department/${departmentId}${query ? `?${query}` : ''}`);
            },

            // الإعدادات - Settings
            getSettings: () => apiGet('/api/hr/clearances/settings'),
            updateSettings: (data) => apiPut('/api/hr/clearances/settings', data),
            getDepartments: () => apiGet('/api/hr/clearances/departments'),
            updateDepartment: (departmentId, data) => apiPut(`/api/hr/clearances/departments/${departmentId}`, data),

            // التصدير - Export
            exportToExcel: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/clearances/export/excel${query ? `?${query}` : ''}`);
            },
            exportToPDF: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/clearances/export/pdf${query ? `?${query}` : ''}`);
            },
        },

        // ==========================================
        // Expatriates - الوافدون (غير السعوديين)
        // ==========================================
        expatriates: {
            // CRUD Operations
            getAll: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/expatriates${query ? `?${query}` : ''}`);
            },
            getById: (id) => apiGet(`/api/expatriates/${id}`),
            getFullProfile: (id) => apiGet(`/api/expatriates/${id}/full-profile`),
            getByIqama: (iqamaNumber) => apiGet(`/api/expatriates/by-iqama/${iqamaNumber}`),
            getByEmployee: (employeeId) => apiGet(`/api/expatriates/by-employee/${employeeId}`),
            create: (data) => apiPost('/api/expatriates', data),
            update: (id, data) => apiPut(`/api/expatriates/${id}`, data),
            delete: (id) => apiDelete(`/api/expatriates/${id}`),
            checkIqama: (iqamaNumber, excludeId) =>
                apiGet(`/api/expatriates/check-iqama/${iqamaNumber}${excludeId ? `?excludeId=${excludeId}` : ''}`),
            renewIqama: (id, newExpiryDate) =>
                apiPost(`/api/expatriates/${id}/renew-iqama`, { newExpiryDate }),

            // Documents & Expiry
            getExpiringDocuments: (withinDays = 30) =>
                apiGet(`/api/expatriates/expiring-documents?withinDays=${withinDays}`),

            // Statistics
            getStatistics: () => apiGet('/api/expatriates/statistics'),

            // Nationalities
            getNationalities: () => apiGet('/api/expatriates/nationalities'),

            // Work Permits
            getWorkPermits: (expatriateId) => apiGet(`/api/expatriates/${expatriateId}/work-permits`),
            getActiveWorkPermit: (expatriateId) => apiGet(`/api/expatriates/${expatriateId}/work-permits/active`),
            createWorkPermit: (expatriateId, data) => apiPost(`/api/expatriates/${expatriateId}/work-permits`, data),
            renewWorkPermit: (permitId) => apiPost(`/api/expatriates/work-permits/${permitId}/renew`),
            cancelWorkPermit: (permitId) => apiPost(`/api/expatriates/work-permits/${permitId}/cancel`),
            getExpiringWorkPermits: (withinDays = 30) =>
                apiGet(`/api/expatriates/work-permits/expiring?withinDays=${withinDays}`),

            // Travel Visas
            getTravelVisas: (expatriateId) => apiGet(`/api/expatriates/${expatriateId}/travel-visas`),
            createExitReentryVisa: (expatriateId, data) =>
                apiPost(`/api/expatriates/${expatriateId}/travel-visas/exit-reentry`, data),
            createFinalExitVisa: (expatriateId, data) =>
                apiPost(`/api/expatriates/${expatriateId}/travel-visas/final-exit`, data),
            extendVisa: (visaId, additionalDays) =>
                apiPost(`/api/expatriates/travel-visas/${visaId}/extend`, { additionalDays }),
            cancelVisa: (visaId) => apiPost(`/api/expatriates/travel-visas/${visaId}/cancel`),
            markVisaUsed: (visaId, travelDate) =>
                apiPost(`/api/expatriates/travel-visas/${visaId}/mark-used`, { travelDate }),
            markVisaReturned: (visaId, returnDate) =>
                apiPost(`/api/expatriates/travel-visas/${visaId}/mark-returned`, { returnDate }),

            // Health Insurance
            getHealthInsurance: (expatriateId) => apiGet(`/api/expatriates/${expatriateId}/health-insurance`),
            getActiveInsurance: (expatriateId) => apiGet(`/api/expatriates/${expatriateId}/health-insurance/active`),
            createInsurance: (expatriateId, data) => apiPost(`/api/expatriates/${expatriateId}/health-insurance`, data),
            renewInsurance: (insuranceId, newEndDate) =>
                apiPost(`/api/expatriates/health-insurance/${insuranceId}/renew`, { newEndDate }),
            cancelInsurance: (insuranceId) => apiPost(`/api/expatriates/health-insurance/${insuranceId}/cancel`),
            getExpiringInsurance: (withinDays = 30) =>
                apiGet(`/api/expatriates/health-insurance/expiring?withinDays=${withinDays}`),
        },

        // ==========================================
        // Expatriate Leaves - إجازات الوافدين
        // ==========================================
        expatriateLeaves: {
            // CRUD Operations
            getByExpatriate: (expatriateId) => apiGet(`/api/expatriates/${expatriateId}/leaves`),
            getById: (leaveId) => apiGet(`/api/expatriates/leaves/${leaveId}`),
            create: (expatriateId, data) => apiPost(`/api/expatriates/${expatriateId}/leaves`, data),
            update: (leaveId, data) => apiPut(`/api/expatriates/leaves/${leaveId}`, data),
            cancel: (leaveId) => apiPost(`/api/expatriates/leaves/${leaveId}/cancel`),

            // Workflow
            approve: (leaveId) => apiPost(`/api/expatriates/leaves/${leaveId}/approve`),
            reject: (leaveId, reason) => apiPost(`/api/expatriates/leaves/${leaveId}/reject`, { reason }),
            start: (leaveId, actualStartDate) =>
                apiPost(`/api/expatriates/leaves/${leaveId}/start`, { actualStartDate }),
            complete: (leaveId, actualEndDate) =>
                apiPost(`/api/expatriates/leaves/${leaveId}/complete`, { actualEndDate }),

            // Early Return - العودة المبكرة
            recordEarlyReturn: (leaveId, data) =>
                apiPost(`/api/expatriates/leaves/${leaveId}/early-return`, data),
            getEarlyReturnLogs: (leaveId) => apiGet(`/api/expatriates/leaves/${leaveId}/early-return-logs`),
            verifyEarlyReturn: (logId, data) =>
                apiPost(`/api/expatriates/early-return-logs/${logId}/verify`, data),
            getAllEarlyReturns: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/expatriates/early-returns${query ? `?${query}` : ''}`);
            },
            getEarlyReturnStatistics: (year, month) => {
                const params = new URLSearchParams();
                if (year) params.append('year', year);
                if (month) params.append('month', month);
                const query = params.toString();
                return apiGet(`/api/expatriates/early-returns/statistics${query ? `?${query}` : ''}`);
            },

            // Balance
            getBalance: (expatriateId) => apiGet(`/api/expatriates/${expatriateId}/leave-balance`),
            getBalanceByYear: (expatriateId, year) =>
                apiGet(`/api/expatriates/${expatriateId}/leave-balance/${year}`),
            initializeBalance: (expatriateId, year) =>
                apiPost(`/api/expatriates/${expatriateId}/leave-balance/initialize`, { year }),
            adjustBalance: (expatriateId, data) =>
                apiPost(`/api/expatriates/${expatriateId}/leave-balance/adjust`, data),

            // Reports
            getByStatus: (status) => apiGet(`/api/expatriates/leaves/by-status/${status}`),
            getActive: () => apiGet('/api/expatriates/leaves/active'),
            getUpcoming: (withinDays = 30) =>
                apiGet(`/api/expatriates/leaves/upcoming?withinDays=${withinDays}`),
            getOverdue: () => apiGet('/api/expatriates/leaves/overdue'),
            getStatistics: (year) => {
                const params = year ? `?year=${year}` : '';
                return apiGet(`/api/expatriates/leaves/statistics${params}`);
            },

            // Ticket Entitlement
            getTicketEntitlement: (expatriateId) =>
                apiGet(`/api/expatriates/${expatriateId}/ticket-entitlement`),
        },

        // ==========================================
        // Promotions - قرارات الترقية
        // ==========================================
        promotions: {
            // العمليات الأساسية CRUD
            getAll: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/promotions${query ? `?${query}` : ''}`);
            },
            getById: (id) => apiGet(`/api/hr/promotions/${id}`),
            getByEmployee: (employeeId) => apiGet(`/api/hr/promotions/employee/${employeeId}`),
            getByStatus: (status) => apiGet(`/api/hr/promotions?status=${status}`),
            getPending: () => apiGet('/api/hr/promotions?status=pending'),
            getApproved: () => apiGet('/api/hr/promotions?status=approved'),
            create: (data) => apiPost('/api/hr/promotions', data),
            update: (id, data) => apiPut(`/api/hr/promotions/${id}`, data),
            delete: (id) => apiDelete(`/api/hr/promotions/${id}`),
            cancel: (id, reason) => apiPost(`/api/hr/promotions/${id}/cancel`, { reason }),

            // فحص الأهلية - Eligibility Check
            checkEligibility: (employeeId, promotionType) =>
                apiGet(`/api/hr/promotions/eligibility/${employeeId}?type=${promotionType}`),
            getBlockers: (employeeId) =>
                apiGet(`/api/hr/promotions/blockers/${employeeId}`),

            // نقاط المفاضلة - Differentiation Points
            calculatePoints: (employeeId, data) =>
                apiPost(`/api/hr/promotions/calculate-points/${employeeId}`, data),
            getEmployeePoints: (employeeId) =>
                apiGet(`/api/hr/promotions/points/${employeeId}`),

            // تأثير الراتب - Salary Impact
            calculateSalaryImpact: (employeeId, targetRank) =>
                apiGet(`/api/hr/promotions/salary-impact/${employeeId}?targetRank=${targetRank}`),

            // الاعتمادات - Approvals
            submitForApproval: (id) => apiPost(`/api/hr/promotions/${id}/submit`),
            approve: (id, level, data) =>
                apiPost(`/api/hr/promotions/${id}/approve/${level}`, data),
            reject: (id, level, reason) =>
                apiPost(`/api/hr/promotions/${id}/reject/${level}`, { reason }),
            getApprovalHistory: (id) => apiGet(`/api/hr/promotions/${id}/approval-history`),
            getPendingApprovals: (level) =>
                apiGet(`/api/hr/promotions/pending-approvals/${level}`),

            // الوظائف الشاغرة - Vacant Positions
            getVacantPositions: (rank) =>
                apiGet(`/api/hr/promotions/vacant-positions?rank=${rank}`),

            // تنفيذ الترقية - Execute
            execute: (id) => apiPost(`/api/hr/promotions/${id}/execute`),

            // المستندات - Documents
            generateDecision: (id) => apiGet(`/api/hr/promotions/${id}/decision`),
            downloadDecision: (id, format = 'pdf') =>
                apiGet(`/api/hr/promotions/${id}/decision/download?format=${format}`),
            uploadAttachment: (id, file) => {
                const formData = new FormData();
                formData.append('file', file);
                return safeFetchJson(`/api/hr/promotions/${id}/attachments`, {
                    method: 'POST',
                    body: formData
                });
            },
            getAttachments: (id) => apiGet(`/api/hr/promotions/${id}/attachments`),
            deleteAttachment: (id, attachmentId) => apiDelete(`/api/hr/promotions/${id}/attachments/${attachmentId}`),

            // التقارير - Reports
            getStatistics: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/promotions/statistics${query ? `?${query}` : ''}`);
            },
            getAnnualReport: (year) => apiGet(`/api/hr/promotions/reports/annual?year=${year}`),
            getDepartmentReport: (deptId, params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/promotions/reports/department/${deptId}${query ? `?${query}` : ''}`);
            },

            // الإعدادات - Settings
            getSettings: () => apiGet('/api/hr/promotions/settings'),
            updateSettings: (data) => apiPut('/api/hr/promotions/settings', data),
            getCommitteeMembers: () => apiGet('/api/hr/promotions/committee'),
            updateCommitteeMembers: (data) => apiPut('/api/hr/promotions/committee', data),

            // التصدير - Export
            exportToExcel: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/promotions/export/excel${query ? `?${query}` : ''}`);
            },
            exportToPDF: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/hr/promotions/export/pdf${query ? `?${query}` : ''}`);
            },
        },
    },

    warehouse: {
        // ==========================================
        // Dashboard - لوحة التحكم
        // ==========================================
        getDashboardSummary: () => apiGet(API.WAREHOUSE.DASHBOARD_SUMMARY),
        getDashboardAlerts: () => apiGet(API.WAREHOUSE.DASHBOARD_ALERTS),
        getDashboardPendingApprovals: () => apiGet(API.WAREHOUSE.DASHBOARD_PENDING_APPROVALS),
        getDashboardRecentTransactions: () => apiGet(API.WAREHOUSE.DASHBOARD_RECENT_TRANSACTIONS),
        getDashboardKPIs: () => apiGet(API.WAREHOUSE.DASHBOARD_KPIS),

        // ==========================================
        // Shortcut Methods - اختصارات للتوافق مع الصفحات القديمة
        // ==========================================
        getItems: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return apiGet(`${API.WAREHOUSE.ITEMS}${queryString ? `?${queryString}` : ''}`);
        },
        createItem: (data) => apiPost(API.WAREHOUSE.ITEMS, data),
        updateItem: (id, data) => apiPut(API.WAREHOUSE.ITEM_BY_ID(id), data),
        deleteItem: (id) => apiDelete(API.WAREHOUSE.ITEM_BY_ID(id)),
        getGroups: () => apiGet(API.WAREHOUSE.ITEM_GROUPS),
        getUnits: () => apiGet(API.WAREHOUSE.UNITS),

        // Inventory Forms shortcuts
        getInventoryForms: (filters = {}) => {
            const queryString = new URLSearchParams(filters).toString();
            return apiGet(`${API.WAREHOUSE.INVENTORY_FORMS}${queryString ? `?${queryString}` : ''}`);
        },
        getDeviationSettlements: () => apiGet(`${API.WAREHOUSE.INVENTORY_FORMS}/deviation-settlements`),
        createInventoryForm: (data) => apiPost(API.WAREHOUSE.INVENTORY_FORMS, data),
        saveInventoryCounting: (formId, items) => apiPost(`${API.WAREHOUSE.INVENTORY_FORMS}/${formId}/counting`, { items }),

        // Stocktaking shortcuts
        createStocktaking: (data) => apiPost(API.WAREHOUSE.STOCKTAKING, data),
        deleteStocktaking: (id) => apiDelete(API.WAREHOUSE.STOCKTAKING_BY_ID(id)),
        startStocktaking: (id) => apiPost(`${API.WAREHOUSE.STOCKTAKING_BY_ID(id)}/start`),

        // Receipt Note shortcuts
        cancelReceiptNote: (noteId, data) => apiPost(`/api/warehouse/receipt-notes/${noteId}/cancel`, data),
        adjustReceiptNote: (noteId, data) => apiPost(`/api/warehouse/receipt-notes/${noteId}/adjust`, data),

        // Settings & Sync shortcuts
        getSyncStatus: () => apiGet('/api/warehouse/sync/status'),
        updateSettings: (settings) => apiPut('/api/warehouse/settings', settings),
        triggerSync: () => apiPost('/api/warehouse/sync/trigger'),

        // Integration shortcuts - Employees, Warehouses, Departments
        getEmployees: () => apiGet(API.WAREHOUSE.INTEGRATION.HR_EMPLOYEES),
        getWarehouses: () => apiGet(API.WAREHOUSE.WAREHOUSES),
        getDepartments: () => apiGet(API.WAREHOUSE.INTEGRATION.HR_DEPARTMENTS),

        // Inspection shortcut
        submitInspection: (id, data) => apiPost(API.WAREHOUSE.TEMP_RECEIVE_SUBMIT_INSPECTION(id), data),

        // ==========================================
        // Exchange Requests - طلبات الصرف (سلسلة 6 موافقات + دورة التصحيح)
        // ==========================================
        exchangeRequest: {
            // القراءة والبحث
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.EXCHANGE_REQUESTS}${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(API.WAREHOUSE.EXCHANGE_REQUEST_BY_ID(id)),
            getByNumber: (num) => apiGet(API.WAREHOUSE.EXCHANGE_REQUEST_BY_NUMBER(num)),
            getPending: () => apiGet(API.WAREHOUSE.EXCHANGE_REQUEST_PENDING),
            getMyPending: () => apiGet(API.WAREHOUSE.EXCHANGE_REQUEST_MY_PENDING),
            getByDepartment: (deptId) => apiGet(API.WAREHOUSE.EXCHANGE_REQUEST_BY_DEPARTMENT(deptId)),
            getByEmployee: (empId) => apiGet(API.WAREHOUSE.EXCHANGE_REQUEST_BY_EMPLOYEE(empId)),

            // الإنشاء والتعديل
            create: (data) => apiPost(API.WAREHOUSE.EXCHANGE_REQUESTS, data),
            update: (id, data) => apiPut(API.WAREHOUSE.EXCHANGE_REQUEST_BY_ID(id), data),
            delete: (id) => apiDelete(API.WAREHOUSE.EXCHANGE_REQUEST_BY_ID(id)),

            // سلسلة الموافقات الخماسية
            approveDeptHead: (id, data = {}) => apiPost(API.WAREHOUSE.EXCHANGE_REQUEST_APPROVE_DEPT_HEAD(id), data),
            approveWhManager: (id, data = {}) => apiPost(API.WAREHOUSE.EXCHANGE_REQUEST_APPROVE_WH_MANAGER(id), data),
            approveGeneralServices: (id, data = {}) => apiPost(API.WAREHOUSE.EXCHANGE_REQUEST_APPROVE_GENERAL_SERVICES(id), data),
            approveStockController: (id, data = {}) => apiPost(API.WAREHOUSE.EXCHANGE_REQUEST_APPROVE_STOCK_CONTROLLER(id), data),
            approveCustodian: (id, data = {}) => apiPost(API.WAREHOUSE.EXCHANGE_REQUEST_APPROVE_CUSTODIAN(id), data),

            // اعتماد عام (يعتمد على المرحلة الحالية - state machine)
            approve: (id, data = {}) => apiPost(`/api/warehouse/exchangerequests/${id}/approve`, data),

            // الإجراءات
            reject: (id, reason) => apiPost(API.WAREHOUSE.EXCHANGE_REQUEST_REJECT(id), { reason }),
            cancel: (id, reason) => apiPost(API.WAREHOUSE.EXCHANGE_REQUEST_CANCEL(id), { reason }),
            complete: (id) => apiPost(API.WAREHOUSE.EXCHANGE_REQUEST_COMPLETE(id)),

            // إرجاع للتصحيح (دورة الرفض/التصحيح)
            returnForCorrection: (id, data) => apiPost(`/api/warehouse/exchangerequests/${id}/return-for-correction`, data),
            resubmitAfterCorrection: (id, data) => apiPost(`/api/warehouse/exchangerequests/${id}/resubmit`, data),

            // التحقق من المخزون
            checkStockAvailability: (warehouseId, items) => apiPost(`/api/warehouse/exchangerequests/check-stock`, { warehouseId, items }),

            // الصرف الفعلي
            dispense: (id, data) => apiPost(`/api/warehouse/exchange-requests/${id}/dispense`, data),
            getDispenseHistory: (id) => apiGet(`/api/warehouse/exchange-requests/${id}/dispense-history`),

            // إرجاع العهدة
            returnCustody: (id, data) => apiPost(`/api/warehouse/exchange-requests/${id}/return-custody`, data),
            getReturnHistory: (id) => apiGet(`/api/warehouse/exchange-requests/${id}/return-history`),

            // العهد المرتبطة
            getCustodies: (id) => apiGet(`/api/warehouse/exchange-requests/${id}/custodies`),

            // الطباعة والتقارير
            print: (id) => apiGet(`/api/warehouse/exchange-requests/${id}/print`),
            exportPDF: (id) => apiGet(`/api/warehouse/exchange-requests/${id}/export/pdf`),

            // حالات طلب الصرف
            getByStatus: (status) => apiGet(`/api/warehouse/exchange-requests?status=${status}`),
            getByPriority: (priority) => apiGet(`/api/warehouse/exchange-requests?priority=${priority}`),

            // التقارير والإحصائيات
            getStatistics: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/exchange-requests/statistics${queryString ? `?${queryString}` : ''}`);
            },
            getApprovalTimeline: (id) => apiGet(`/api/warehouse/exchange-requests/${id}/approval-timeline`),
        },

        // ==========================================
        // Temp Receive - الاستلام المؤقت للفحص (سير العمل الخماسي)
        // ==========================================
        tempReceive: {
            // القراءة والبحث
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.TEMP_RECEIVES}${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(API.WAREHOUSE.TEMP_RECEIVE_BY_ID(id)),
            getByNumber: (num) => apiGet(API.WAREHOUSE.TEMP_RECEIVE_BY_NUMBER(num)),
            getPending: () => apiGet(API.WAREHOUSE.TEMP_RECEIVE_PENDING),
            getInspected: () => apiGet(API.WAREHOUSE.TEMP_RECEIVE_INSPECTED),
            getBySupplier: (supplierId) => apiGet(API.WAREHOUSE.TEMP_RECEIVE_BY_SUPPLIER(supplierId)),
            getByPO: (poNumber) => apiGet(API.WAREHOUSE.TEMP_RECEIVE_BY_PO(poNumber)),
            getByStatus: (status) => apiGet(`${API.WAREHOUSE.TEMP_RECEIVES}?status=${status}`),
            getApproved: () => apiGet(`${API.WAREHOUSE.TEMP_RECEIVES}?status=approved`),
            getRejected: () => apiGet(`${API.WAREHOUSE.TEMP_RECEIVES}?status=rejected`),
            getTransferred: () => apiGet(`${API.WAREHOUSE.TEMP_RECEIVES}?status=transferred`),
            getFollowUp: () => apiGet(`${API.WAREHOUSE.TEMP_RECEIVES}?status=follow_up`),
            getByWarehouse: (warehouseId) => apiGet(`${API.WAREHOUSE.TEMP_RECEIVES}?warehouseId=${warehouseId}`),
            getByFiscalYear: (year) => apiGet(`${API.WAREHOUSE.TEMP_RECEIVES}?fiscalYear=${year}`),

            // الإنشاء والتعديل
            create: (data) => apiPost(API.WAREHOUSE.TEMP_RECEIVES, data),
            update: (id, data) => apiPut(API.WAREHOUSE.TEMP_RECEIVE_BY_ID(id), data),
            delete: (id) => apiDelete(API.WAREHOUSE.TEMP_RECEIVE_BY_ID(id)),

            // لجنة الفحص
            assignCommittee: (id, data) => apiPost(API.WAREHOUSE.TEMP_RECEIVE_ASSIGN_COMMITTEE(id), data),
            submitInspection: (id, data) => apiPost(API.WAREHOUSE.TEMP_RECEIVE_SUBMIT_INSPECTION(id), data),
            approveInspection: (id, data = {}) => apiPost(API.WAREHOUSE.TEMP_RECEIVE_APPROVE_INSPECTION(id), data),
            rejectInspection: (id, reason) => apiPost(API.WAREHOUSE.TEMP_RECEIVE_REJECT_INSPECTION(id), { reason }),
            convertToReceipt: (id) => apiPost(API.WAREHOUSE.TEMP_RECEIVE_CONVERT_TO_RECEIPT(id)),

            // ==========================================
            // سير العمل الخماسي للاستلام المؤقت
            // الأدوار: المسلّم، مأمور ساحة الاستلام، أمين المستودع، مدير إدارة المستودعات، مراقب المخزون
            // ==========================================

            // ترحيل الاستلام المؤقت (من قيد المتابعة إلى مرحل)
            transfer: (id, data = {}) => apiPost(API.WAREHOUSE.TEMP_RECEIVE_TRANSFER(id), data),

            // اعتماد الاستلام المؤقت (من مرحل إلى معتمد)
            approve: (id, data = {}) => apiPost(API.WAREHOUSE.TEMP_RECEIVE_APPROVE(id), data),

            // رفض الاستلام المؤقت
            reject: (id, reason) => apiPost(API.WAREHOUSE.TEMP_RECEIVE_REJECT(id), { reason }),

            // إلغاء الاستلام المؤقت
            cancel: (id, reason) => apiPost(API.WAREHOUSE.TEMP_RECEIVE_CANCEL(id), { reason }),

            // إنشاء مذكرة استلام من الاستلام المؤقت المعتمد
            createReceiptNote: (id, data = {}) => apiPost(`${API.WAREHOUSE.TEMP_RECEIVES}/${id}/create-receipt-note`, data),

            // حالات الاستلام المؤقت المتقدمة (deprecated - use transfer/approve/reject/cancel instead)
            forward: (id, data = {}) => apiPost(`${API.WAREHOUSE.TEMP_RECEIVES}/${id}/forward`, data),

            // سجل الفحص والملاحظات
            getInspectionHistory: (id) => apiGet(`${API.WAREHOUSE.TEMP_RECEIVES}/${id}/inspection-history`),
            addInspectionNote: (id, data) => apiPost(`${API.WAREHOUSE.TEMP_RECEIVES}/${id}/inspection-notes`, data),

            // سجل سير العمل
            getWorkflowHistory: (id) => apiGet(`${API.WAREHOUSE.TEMP_RECEIVES}/${id}/workflow-history`),

            // الأدوار والتوقيعات
            getRoles: (id) => apiGet(`${API.WAREHOUSE.TEMP_RECEIVES}/${id}/roles`),
            updateRole: (id, roleId, data) => apiPut(`${API.WAREHOUSE.TEMP_RECEIVES}/${id}/roles/${roleId}`, data),

            // المرفقات
            getAttachments: (id) => apiGet(`${API.WAREHOUSE.TEMP_RECEIVES}/${id}/attachments`),
            uploadAttachment: (id, formData) => {
                return safeFetchJson(`${API.WAREHOUSE.TEMP_RECEIVES}/${id}/attachments`, {
                    method: 'POST',
                    body: formData
                });
            },
            deleteAttachment: (id, attachmentId) => apiDelete(`${API.WAREHOUSE.TEMP_RECEIVES}/${id}/attachments/${attachmentId}`),

            // الطباعة والتصدير
            print: (id) => apiGet(`${API.WAREHOUSE.TEMP_RECEIVES}/${id}/print`),
            exportPDF: (id) => apiGet(`${API.WAREHOUSE.TEMP_RECEIVES}/${id}/export/pdf`),

            // الإحصائيات والتقارير
            getStatistics: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.TEMP_RECEIVES}/statistics${queryString ? `?${queryString}` : ''}`);
            },
        },

        // ==========================================
        // Document Types - أنواع المستندات
        // ==========================================
        documentTypes: {
            // القراءة والبحث
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/document-types${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(`/api/warehouse/document-types/${id}`),
            getByCode: (code) => apiGet(`/api/warehouse/document-types/code/${code}`),
            getActive: () => apiGet('/api/warehouse/document-types?isActive=true'),
            getByCategory: (category) => apiGet(`/api/warehouse/document-types?category=${category}`),

            // الإنشاء والتعديل
            create: (data) => apiPost('/api/warehouse/document-types', data),
            update: (id, data) => apiPut(`/api/warehouse/document-types/${id}`, data),
            delete: (id) => apiDelete(`/api/warehouse/document-types/${id}`),

            // التفعيل والتعطيل
            activate: (id) => apiPost(`/api/warehouse/document-types/${id}/activate`),
            deactivate: (id) => apiPost(`/api/warehouse/document-types/${id}/deactivate`),

            // الإعدادات
            getSettings: () => apiGet('/api/warehouse/document-types/settings'),
            updateSettings: (data) => apiPut('/api/warehouse/document-types/settings', data),
        },

        // ==========================================
        // Government Forms - النماذج الحكومية المعتمدة
        // ==========================================
        getRecentGovernmentForms: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return apiGet(`/api/warehouse/government-forms/recent${queryString ? `?${queryString}` : ''}`);
        },

        // ==========================================
        // Receipt Protocols - محاضر الاستلام
        // ==========================================
        receiptProtocol: {
            // القراءة والبحث
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/receipt-protocols${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(`/api/warehouse/receipt-protocols/${id}`),
            getByNumber: (num) => apiGet(`/api/warehouse/receipt-protocols/number/${num}`),
            getByReceiptNote: (receiptNoteId) => apiGet(`/api/warehouse/receipt-protocols/receipt-note/${receiptNoteId}`),
            getPending: () => apiGet('/api/warehouse/receipt-protocols?status=pending'),
            getApproved: () => apiGet('/api/warehouse/receipt-protocols?status=approved'),

            // الإنشاء والتعديل
            create: (data) => apiPost('/api/warehouse/receipt-protocols', data),
            update: (id, data) => apiPut(`/api/warehouse/receipt-protocols/${id}`, data),
            delete: (id) => apiDelete(`/api/warehouse/receipt-protocols/${id}`),

            // لجنة الفحص والتوقيعات
            assignCommittee: (id, data) => apiPost(`/api/warehouse/receipt-protocols/${id}/assign-committee`, data),
            signByChairman: (id, data) => apiPost(`/api/warehouse/receipt-protocols/${id}/sign/chairman`, data),
            signByFirstMember: (id, data) => apiPost(`/api/warehouse/receipt-protocols/${id}/sign/first-member`, data),
            signBySecondMember: (id, data) => apiPost(`/api/warehouse/receipt-protocols/${id}/sign/second-member`, data),
            getSignatures: (id) => apiGet(`/api/warehouse/receipt-protocols/${id}/signatures`),

            // الإجراءات
            approve: (id, data = {}) => apiPost(`/api/warehouse/receipt-protocols/${id}/approve`, data),
            reject: (id, reason) => apiPost(`/api/warehouse/receipt-protocols/${id}/reject`, { reason }),

            // الطباعة والتقارير
            print: (id) => apiGet(`/api/warehouse/receipt-protocols/${id}/print`),
            exportPDF: (id) => apiGet(`/api/warehouse/receipt-protocols/${id}/export/pdf`),

            // الملاحظات والملفات
            addNote: (id, data) => apiPost(`/api/warehouse/receipt-protocols/${id}/notes`, data),
            getNotes: (id) => apiGet(`/api/warehouse/receipt-protocols/${id}/notes`),
            uploadAttachment: (id, formData) => {
                return safeFetchJson(`/api/warehouse/receipt-protocols/${id}/attachments`, {
                    method: 'POST',
                    body: formData
                });
            },
            getAttachments: (id) => apiGet(`/api/warehouse/receipt-protocols/${id}/attachments`),
        },

        // ==========================================
        // Receipts - إذونات الاستلام (ReceiptsController)
        // ==========================================
        receipts: {
            // القراءة والبحث
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/receipts${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(`/api/receipts/${id}`),

            // الإنشاء والتعديل
            create: (data) => apiPost('/api/receipts', data),
            update: (id, data) => apiPut(`/api/receipts/${id}`, data),
            delete: (id, reason) => apiDelete(`/api/receipts/${id}?reason=${encodeURIComponent(reason)}`),

            // سير العمل - Workflow
            submit: (id) => apiPost(`/api/receipts/${id}/submit`),
            approve: (id, data = {}) => apiPost(`/api/receipts/${id}/approve`, data),
            reject: (id, reason) => apiPost(`/api/receipts/${id}/reject`, { reason }),

            // الفحص - Inspection
            startInspection: (id, committeeId) => apiPost(`/api/receipts/${id}/start-inspection`, { committeeId }),
            completeInspection: (id, data) => apiPost(`/api/receipts/${id}/complete-inspection`, data),

            // ترحيل للمخزون
            postToInventory: (id) => apiPost(`/api/receipts/${id}/post`),

            // لجان الفحص
            getCommittees: () => apiGet('/api/receipts/committees'),
            createCommittee: (data) => apiPost('/api/receipts/committees', data),

            // سجل الإجراءات - Activity Log
            getActivities: (id) => apiGet(`/api/receipts/${id}/activities`),
            addComment: (id, comment) => apiPost(`/api/receipts/${id}/comments`, { comment }),

            // المرفقات - Attachments
            getAttachments: (id) => apiGet(`/api/receipts/${id}/attachments`),
            addAttachment: (id, formData) => {
                return safeFetchJson(`/api/receipts/${id}/attachments`, {
                    method: 'POST',
                    body: formData
                });
            },
            deleteAttachment: (id, attachmentId) => apiDelete(`/api/receipts/${id}/attachments/${attachmentId}`),
            validateAttachments: (id) => apiGet(`/api/receipts/${id}/attachments/validate`),

            // التصدير - Export
            exportToExcel: (id) => apiGet(`/api/receipts/${id}/export/excel`),
            exportToPdf: (id) => apiGet(`/api/receipts/${id}/export/pdf`),

            // النماذج الحكومية
            generateForm: (id, formType) => apiGet(`/api/receipts/${id}/form/${formType}`),
            generateInspectionReport: (id) => apiGet(`/api/receipts/${id}/inspection-report`),

            // الإشعارات
            sendNotification: (id, data) => apiPost(`/api/receipts/${id}/notify`, data),
        },

        // ==========================================
        // Custody Transfer Protocols - محاضر نقل العهدة
        // ==========================================
        custodyTransfer: {
            // القراءة والبحث
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/custody-transfers${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(`/api/warehouse/custody-transfers/${id}`),
            getByNumber: (num) => apiGet(`/api/warehouse/custody-transfers/number/${num}`),
            getByFromEmployee: (empId) => apiGet(`/api/warehouse/custody-transfers/from-employee/${empId}`),
            getByToEmployee: (empId) => apiGet(`/api/warehouse/custody-transfers/to-employee/${empId}`),
            getPending: () => apiGet('/api/warehouse/custody-transfers?status=pending'),
            getApproved: () => apiGet('/api/warehouse/custody-transfers?status=approved'),
            getRejected: () => apiGet('/api/warehouse/custody-transfers?status=rejected'),

            // الإنشاء والتعديل
            create: (data) => apiPost('/api/warehouse/custody-transfers', data),
            update: (id, data) => apiPut(`/api/warehouse/custody-transfers/${id}`, data),
            delete: (id) => apiDelete(`/api/warehouse/custody-transfers/${id}`),

            // سير العمل
            submit: (id) => apiPost(`/api/warehouse/custody-transfers/${id}/submit`),
            approve: (id, data = {}) => apiPost(`/api/warehouse/custody-transfers/${id}/approve`, data),
            reject: (id, reason) => apiPost(`/api/warehouse/custody-transfers/${id}/reject`, { reason }),
            cancel: (id, reason) => apiPost(`/api/warehouse/custody-transfers/${id}/cancel`, { reason }),

            // التوقيعات
            signByTransferringEmployee: (id, data) => apiPost(`/api/warehouse/custody-transfers/${id}/sign/transferring`, data),
            signByReceivingEmployee: (id, data) => apiPost(`/api/warehouse/custody-transfers/${id}/sign/receiving`, data),
            signByWarehouseManager: (id, data) => apiPost(`/api/warehouse/custody-transfers/${id}/sign/warehouse-manager`, data),
            getSignatures: (id) => apiGet(`/api/warehouse/custody-transfers/${id}/signatures`),

            // العناصر المنقولة
            addItem: (id, data) => apiPost(`/api/warehouse/custody-transfers/${id}/items`, data),
            updateItem: (id, itemId, data) => apiPut(`/api/warehouse/custody-transfers/${id}/items/${itemId}`, data),
            removeItem: (id, itemId) => apiDelete(`/api/warehouse/custody-transfers/${id}/items/${itemId}`),
            getItems: (id) => apiGet(`/api/warehouse/custody-transfers/${id}/items`),

            // الطباعة والتقارير
            print: (id) => apiGet(`/api/warehouse/custody-transfers/${id}/print`),
            exportPDF: (id) => apiGet(`/api/warehouse/custody-transfers/${id}/export/pdf`),

            // الملاحظات والملفات
            addNote: (id, data) => apiPost(`/api/warehouse/custody-transfers/${id}/notes`, data),
            getNotes: (id) => apiGet(`/api/warehouse/custody-transfers/${id}/notes`),
            uploadAttachment: (id, formData) => {
                return safeFetchJson(`/api/warehouse/custody-transfers/${id}/attachments`, {
                    method: 'POST',
                    body: formData
                });
            },
            getAttachments: (id) => apiGet(`/api/warehouse/custody-transfers/${id}/attachments`),
        },

        // ==========================================
        // Receipt Notes - مذكرات الاستلام
        // ==========================================
        receiptNote: {
            // القراءة والبحث
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.RECEIPT_NOTES}${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(API.WAREHOUSE.RECEIPT_NOTE_BY_ID(id)),
            getByNumber: (num) => apiGet(API.WAREHOUSE.RECEIPT_NOTE_BY_NUMBER(num)),
            getByTempReceive: (tempId) => apiGet(API.WAREHOUSE.RECEIPT_NOTE_BY_TEMP_RECEIVE(tempId)),
            getByWarehouse: (whId) => apiGet(API.WAREHOUSE.RECEIPT_NOTE_BY_WAREHOUSE(whId)),

            // الإنشاء والتعديل
            create: (data) => apiPost(API.WAREHOUSE.RECEIPT_NOTES, data),
            update: (id, data) => apiPut(API.WAREHOUSE.RECEIPT_NOTE_BY_ID(id), data),
            delete: (id) => apiDelete(API.WAREHOUSE.RECEIPT_NOTE_BY_ID(id)),

            // محضر الاستلام والطباعة
            getProtocol: (id) => apiGet(API.WAREHOUSE.RECEIPT_NOTE_PROTOCOL(id)),
            print: (id) => apiGet(API.WAREHOUSE.RECEIPT_NOTE_PRINT(id)),

            // ==========================================
            // سير العمل - اعتماد وترحيل مذكرة الاستلام
            // ==========================================

            // اعتماد مذكرة الاستلام (إضافة الأصناف للمخزون)
            approve: (id, data = {}) => apiPost(API.WAREHOUSE.RECEIPT_NOTE_APPROVE(id), data),

            // الترحيل للمخزون (يتم تلقائياً مع الاعتماد)
            postToStock: (id, data = {}) => apiPost(`/api/warehouse/receipt-notes/${id}/post-to-stock`, data),
            getPostingStatus: (id) => apiGet(`/api/warehouse/receipt-notes/${id}/posting-status`),

            // الإلغاء والتعديل
            cancel: (id, reason) => apiPost(`/api/warehouse/receipt-notes/${id}/cancel`, { reason }),
            adjust: (id, data) => apiPost(`/api/warehouse/receipt-notes/${id}/adjust`, data),

            // حركات المخزون
            getStockMovements: (id) => apiGet(`/api/warehouse/receipt-notes/${id}/stock-movements`),

            // حالات مذكرة الاستلام
            getByStatus: (status) => apiGet(`/api/warehouse/receipt-notes?status=${status}`),

            // التقارير
            getStatistics: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/receipt-notes/statistics${queryString ? `?${queryString}` : ''}`);
            },
        },

        // ==========================================
        // Custody - العهد (شخصية/إدارية)
        // ==========================================
        custody: {
            // القراءة والبحث
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.CUSTODIES}${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(API.WAREHOUSE.CUSTODY_BY_ID(id)),
            getByEmployee: (empId) => apiGet(API.WAREHOUSE.CUSTODY_BY_EMPLOYEE(empId)),
            getReport: (empId) => apiGet(`${API.WAREHOUSE.CUSTODY_BY_EMPLOYEE(empId)}/report`),
            getByDepartment: (deptId) => apiGet(API.WAREHOUSE.CUSTODY_BY_DEPARTMENT(deptId)),
            getByType: (type) => apiGet(API.WAREHOUSE.CUSTODY_BY_TYPE(type)),
            getPersonal: () => apiGet(API.WAREHOUSE.CUSTODY_PERSONAL),
            getAdministrative: () => apiGet(API.WAREHOUSE.CUSTODY_ADMINISTRATIVE),

            // الإنشاء والتعديل
            create: (data) => apiPost(API.WAREHOUSE.CUSTODIES, data),
            update: (id, data) => apiPut(API.WAREHOUSE.CUSTODY_BY_ID(id), data),
            delete: (id) => apiDelete(API.WAREHOUSE.CUSTODY_BY_ID(id)),

            // نقل وإرجاع العهد
            transfer: (id, data) => apiPost(API.WAREHOUSE.CUSTODY_TRANSFER(id), data),
            return: (id, data = {}) => apiPost(API.WAREHOUSE.CUSTODY_RETURN(id), data),
            acceptTransfer: (id, data = {}) => apiPost(API.WAREHOUSE.CUSTODY_ACCEPT_TRANSFER(id), data),
            rejectTransfer: (id, reason) => apiPost(API.WAREHOUSE.CUSTODY_REJECT_TRANSFER(id), { reason }),

            // حالة الربط مع الأنظمة الأخرى
            syncHR: (id) => apiPost(API.WAREHOUSE.CUSTODY_SYNC_HR(id)),
            syncFinance: (id) => apiPost(API.WAREHOUSE.CUSTODY_SYNC_FINANCE(id)),
            syncAssets: (id) => apiPost(API.WAREHOUSE.CUSTODY_SYNC_ASSETS(id)),
            getIntegrationStatus: (id) => apiGet(API.WAREHOUSE.CUSTODY_INTEGRATION_STATUS(id)),
        },

        // ==========================================
        // Inventory Forms - استمارات الجرد (كلي/جزئي/مستمر)
        // ==========================================
        inventoryForm: {
            // القراءة والبحث
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.INVENTORY_FORMS}${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(API.WAREHOUSE.INVENTORY_FORM_BY_ID(id)),
            getByNumber: (num) => apiGet(API.WAREHOUSE.INVENTORY_FORM_BY_NUMBER(num)),
            getByType: (type) => apiGet(API.WAREHOUSE.INVENTORY_FORM_BY_TYPE(type)),
            getByWarehouse: (whId) => apiGet(API.WAREHOUSE.INVENTORY_FORM_BY_WAREHOUSE(whId)),
            getPending: () => apiGet(API.WAREHOUSE.INVENTORY_FORM_PENDING),
            getInProgress: () => apiGet(API.WAREHOUSE.INVENTORY_FORM_IN_PROGRESS),
            getCompleted: () => apiGet(API.WAREHOUSE.INVENTORY_FORM_COMPLETED),

            // الإنشاء والتعديل
            create: (data) => apiPost(API.WAREHOUSE.INVENTORY_FORMS, data),
            update: (id, data) => apiPut(API.WAREHOUSE.INVENTORY_FORM_BY_ID(id), data),
            delete: (id) => apiDelete(API.WAREHOUSE.INVENTORY_FORM_BY_ID(id)),

            // عمليات الجرد
            startCounting: (id) => apiPost(API.WAREHOUSE.INVENTORY_FORM_START_COUNTING(id)),
            submitCount: (id, data) => apiPost(API.WAREHOUSE.INVENTORY_FORM_SUBMIT_COUNT(id), data),
            completeCounting: (id) => apiPost(API.WAREHOUSE.INVENTORY_FORM_COMPLETE_COUNTING(id)),
            approve: (id, data = {}) => apiPost(API.WAREHOUSE.INVENTORY_FORM_APPROVE(id), data),

            // تسوية الانحرافات
            getDeviations: (id) => apiGet(API.WAREHOUSE.INVENTORY_FORM_DEVIATIONS(id)),
            settleDeviation: (id, devId, data) => apiPost(API.WAREHOUSE.INVENTORY_FORM_SETTLE_DEVIATION(id, devId), data),
            approveSettlement: (id, data = {}) => apiPost(API.WAREHOUSE.INVENTORY_FORM_APPROVE_SETTLEMENT(id), data),
        },

        // ==========================================
        // Stocktaking - الجرد (واجهة مبسطة)
        // ==========================================
        stocktaking: {
            // القراءة والبحث
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.STOCKTAKING}${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(API.WAREHOUSE.STOCKTAKING_BY_ID(id)),
            getActive: () => apiGet(`${API.WAREHOUSE.STOCKTAKING}?status=active`),
            getCompleted: () => apiGet(`${API.WAREHOUSE.STOCKTAKING}?status=completed`),
            getByWarehouse: (warehouseId) => apiGet(`${API.WAREHOUSE.STOCKTAKING}?warehouseId=${warehouseId}`),

            // الإنشاء والتعديل
            create: (data) => apiPost(API.WAREHOUSE.STOCKTAKING, data),
            update: (id, data) => apiPut(API.WAREHOUSE.STOCKTAKING_BY_ID(id), data),
            delete: (id) => apiDelete(API.WAREHOUSE.STOCKTAKING_BY_ID(id)),

            // عمليات الجرد
            start: (id) => apiPost(`${API.WAREHOUSE.STOCKTAKING_BY_ID(id)}/start`),
            addItem: (id, data) => apiPost(`${API.WAREHOUSE.STOCKTAKING_BY_ID(id)}/items`, data),
            updateItem: (id, itemId, data) => apiPut(`${API.WAREHOUSE.STOCKTAKING_BY_ID(id)}/items/${itemId}`, data),
            removeItem: (id, itemId) => apiDelete(`${API.WAREHOUSE.STOCKTAKING_BY_ID(id)}/items/${itemId}`),
            complete: (id) => apiPost(`${API.WAREHOUSE.STOCKTAKING_BY_ID(id)}/complete`),
            approve: (id, data = {}) => apiPost(`${API.WAREHOUSE.STOCKTAKING_BY_ID(id)}/approve`, data),

            // التقارير
            getVariance: (id) => apiGet(`${API.WAREHOUSE.STOCKTAKING_BY_ID(id)}/variance`),
            exportReport: (id, format = 'pdf') => apiGet(`${API.WAREHOUSE.STOCKTAKING_BY_ID(id)}/export?format=${format}`, { responseType: 'blob' }),
        },

        // ==========================================
        // Fixed Assets - الأصول الثابتة (المستودعات)
        // ==========================================
        fixedAssets: {
            // القراءة والبحث
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.FIXED_ASSETS}${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(API.WAREHOUSE.FIXED_ASSET_BY_ID(id)),
            getByCode: (code) => apiGet(`${API.WAREHOUSE.FIXED_ASSETS}/by-code/${code}`),
            getByCategory: (categoryId) => apiGet(`${API.WAREHOUSE.FIXED_ASSETS}?categoryId=${categoryId}`),
            getByLocation: (locationId) => apiGet(`${API.WAREHOUSE.FIXED_ASSETS}?locationId=${locationId}`),
            getByWarehouse: (warehouseId) => apiGet(`${API.WAREHOUSE.FIXED_ASSETS}?warehouseId=${warehouseId}`),

            // الإنشاء والتعديل
            create: (data) => apiPost(API.WAREHOUSE.FIXED_ASSETS, data),
            update: (id, data) => apiPut(API.WAREHOUSE.FIXED_ASSET_BY_ID(id), data),
            delete: (id) => apiDelete(API.WAREHOUSE.FIXED_ASSET_BY_ID(id)),

            // عمليات الأصول
            transfer: (id, data) => apiPost(`${API.WAREHOUSE.FIXED_ASSET_BY_ID(id)}/transfer`, data),
            dispose: (id, data) => apiPost(`${API.WAREHOUSE.FIXED_ASSET_BY_ID(id)}/dispose`, data),
            getHistory: (id) => apiGet(`${API.WAREHOUSE.FIXED_ASSET_BY_ID(id)}/history`),
            getMaintenanceHistory: (id) => apiGet(`${API.WAREHOUSE.FIXED_ASSET_BY_ID(id)}/maintenance`),

            // التصنيفات
            getCategories: () => apiGet(`${API.WAREHOUSE.FIXED_ASSETS}/categories`),
            getCategoryById: (id) => apiGet(`${API.WAREHOUSE.FIXED_ASSETS}/categories/${id}`),
            createCategory: (data) => apiPost(`${API.WAREHOUSE.FIXED_ASSETS}/categories`, data),
            updateCategory: (id, data) => apiPut(`${API.WAREHOUSE.FIXED_ASSETS}/categories/${id}`, data),
        },

        // ==========================================
        // Depreciation - الإهلاك
        // ==========================================
        depreciation: {
            // القراءة والبحث
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.DEPRECIATION}${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(`${API.WAREHOUSE.DEPRECIATION}/${id}`),
            getByAsset: (assetId) => apiGet(`${API.WAREHOUSE.DEPRECIATION}?assetId=${assetId}`),

            // العمليات
            calculate: (params) => apiPost(`${API.WAREHOUSE.DEPRECIATION}/calculate`, params),
            process: (params) => apiPost(`${API.WAREHOUSE.DEPRECIATION}/process`, params),
            getForecast: (params) => apiGet(`${API.WAREHOUSE.DEPRECIATION}/forecast?${new URLSearchParams(params)}`),
            getHistory: (assetId) => apiGet(`${API.WAREHOUSE.DEPRECIATION}/history/${assetId}`),

            // التقارير
            getReport: (params) => apiGet(`${API.WAREHOUSE.DEPRECIATION}/report?${new URLSearchParams(params)}`),
            exportReport: (params, format = 'pdf') => apiGet(`${API.WAREHOUSE.DEPRECIATION}/export?format=${format}&${new URLSearchParams(params)}`, { responseType: 'blob' }),
        },

        // ==========================================
        // Transfer Requests - طلبات النقل
        // ==========================================
        transferRequests: {
            // القراءة والبحث
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.TRANSFER_REQUESTS}${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(API.WAREHOUSE.TRANSFER_REQUEST_BY_ID(id)),
            getPending: () => apiGet(`${API.WAREHOUSE.TRANSFER_REQUESTS}?status=pending`),
            getByStatus: (status) => apiGet(`${API.WAREHOUSE.TRANSFER_REQUESTS}?status=${status}`),

            // الإنشاء والتعديل
            create: (data) => apiPost(API.WAREHOUSE.TRANSFER_REQUESTS, data),
            update: (id, data) => apiPut(API.WAREHOUSE.TRANSFER_REQUEST_BY_ID(id), data),
            delete: (id) => apiDelete(API.WAREHOUSE.TRANSFER_REQUEST_BY_ID(id)),

            // الموافقات
            approve: (id, data = {}) => apiPost(`${API.WAREHOUSE.TRANSFER_REQUEST_BY_ID(id)}/approve`, data),
            reject: (id, reason) => apiPost(`${API.WAREHOUSE.TRANSFER_REQUEST_BY_ID(id)}/reject`, { reason }),
            complete: (id) => apiPost(`${API.WAREHOUSE.TRANSFER_REQUEST_BY_ID(id)}/complete`),
        },

        // ==========================================
        // Return Requests - طلبات الإرجاع
        // ==========================================
        returnRequests: {
            // القراءة والبحث
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.RETURN_REQUESTS}${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(API.WAREHOUSE.RETURN_REQUEST_BY_ID(id)),
            getPending: () => apiGet(`${API.WAREHOUSE.RETURN_REQUESTS}?status=pending`),
            getByStatus: (status) => apiGet(`${API.WAREHOUSE.RETURN_REQUESTS}?status=${status}`),

            // الإنشاء والتعديل
            create: (data) => apiPost(API.WAREHOUSE.RETURN_REQUESTS, data),
            update: (id, data) => apiPut(API.WAREHOUSE.RETURN_REQUEST_BY_ID(id), data),
            delete: (id) => apiDelete(API.WAREHOUSE.RETURN_REQUEST_BY_ID(id)),

            // الموافقات
            approve: (id, data = {}) => apiPost(`${API.WAREHOUSE.RETURN_REQUEST_BY_ID(id)}/approve`, data),
            reject: (id, reason) => apiPost(`${API.WAREHOUSE.RETURN_REQUEST_BY_ID(id)}/reject`, { reason }),
            complete: (id) => apiPost(`${API.WAREHOUSE.RETURN_REQUEST_BY_ID(id)}/complete`),
        },

        // ==========================================
        // Items - الأصناف (مستديم/مستهلك)
        // ==========================================
        items: {
            // القراءة والبحث
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.ITEMS}${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(API.WAREHOUSE.ITEM_BY_ID(id)),
            getByCode: (code) => apiGet(API.WAREHOUSE.ITEM_BY_CODE(code)),
            getByBarcode: (barcode) => apiGet(API.WAREHOUSE.ITEM_BY_BARCODE(barcode)),
            search: (query) => apiGet(`${API.WAREHOUSE.ITEM_SEARCH}?q=${encodeURIComponent(query)}`),
            getByType: (type) => apiGet(API.WAREHOUSE.ITEM_BY_TYPE(type)),
            getByGroup: (groupId) => apiGet(API.WAREHOUSE.ITEM_BY_GROUP(groupId)),
            getDurable: () => apiGet(API.WAREHOUSE.ITEM_DURABLE),
            getConsumable: () => apiGet(API.WAREHOUSE.ITEM_CONSUMABLE),
            getLowStock: () => apiGet(API.WAREHOUSE.ITEM_LOW_STOCK),

            // الإنشاء والتعديل
            create: (data) => apiPost(API.WAREHOUSE.ITEMS, data),
            update: (id, data) => apiPut(API.WAREHOUSE.ITEM_BY_ID(id), data),
            delete: (id) => apiDelete(API.WAREHOUSE.ITEM_BY_ID(id)),

            // عمليات إضافية
            getQRCode: (id) => apiGet(API.WAREHOUSE.ITEM_QR_CODE(id)),
            getStockHistory: (id) => apiGet(API.WAREHOUSE.ITEM_STOCK_HISTORY(id)),
            getCustodies: (id) => apiGet(API.WAREHOUSE.ITEM_CUSTODIES(id)),
        },

        // ==========================================
        // Item Groups - مجموعات الأصناف
        // ==========================================
        itemGroups: {
            getAll: () => apiGet(API.WAREHOUSE.ITEM_GROUPS),
            getById: (id) => apiGet(API.WAREHOUSE.ITEM_GROUP_BY_ID(id)),
            create: (data) => apiPost(API.WAREHOUSE.ITEM_GROUPS, data),
            update: (id, data) => apiPut(API.WAREHOUSE.ITEM_GROUP_BY_ID(id), data),
            delete: (id) => apiDelete(API.WAREHOUSE.ITEM_GROUP_BY_ID(id)),
        },

        // ==========================================
        // Units - وحدات القياس
        // ==========================================
        units: {
            getAll: () => apiGet(API.WAREHOUSE.UNITS),
            getById: (id) => apiGet(API.WAREHOUSE.UNIT_BY_ID(id)),
            create: (data) => apiPost(API.WAREHOUSE.UNITS, data),
            update: (id, data) => apiPut(API.WAREHOUSE.UNIT_BY_ID(id), data),
            delete: (id) => apiDelete(API.WAREHOUSE.UNIT_BY_ID(id)),
        },

        // ==========================================
        // Warehouses - المستودعات
        // ==========================================
        warehouses: {
            getAll: () => apiGet(API.WAREHOUSE.WAREHOUSES),
            getById: (id) => apiGet(API.WAREHOUSE.WAREHOUSE_BY_ID(id)),
            getByCode: (code) => apiGet(API.WAREHOUSE.WAREHOUSE_BY_CODE(code)),
            create: (data) => apiPost(API.WAREHOUSE.WAREHOUSES, data),
            update: (id, data) => apiPut(API.WAREHOUSE.WAREHOUSE_BY_ID(id), data),
            delete: (id) => apiDelete(API.WAREHOUSE.WAREHOUSE_BY_ID(id)),
            getItems: (id) => apiGet(API.WAREHOUSE.WAREHOUSE_ITEMS(id)),
            getStock: (id) => apiGet(API.WAREHOUSE.WAREHOUSE_STOCK(id)),
            getCustodians: (id) => apiGet(API.WAREHOUSE.WAREHOUSE_CUSTODIANS(id)),
            getTransactions: (id) => apiGet(API.WAREHOUSE.WAREHOUSE_TRANSACTIONS(id)),
        },

        // ==========================================
        // Stock - المخزون
        // ==========================================
        stock: {
            getAll: () => apiGet(API.WAREHOUSE.STOCK),
            getByItem: (itemId) => apiGet(API.WAREHOUSE.STOCK_BY_ITEM(itemId)),
            getByWarehouse: (whId) => apiGet(API.WAREHOUSE.STOCK_BY_WAREHOUSE(whId)),
            getMovements: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.STOCK_MOVEMENTS}${queryString ? `?${queryString}` : ''}`);
            },
            getAlerts: () => apiGet(API.WAREHOUSE.STOCK_ALERTS),
        },

        // ==========================================
        // Suppliers - الموردون
        // ==========================================
        suppliers: {
            getAll: () => apiGet(API.WAREHOUSE.SUPPLIERS),
            getById: (id) => apiGet(API.WAREHOUSE.SUPPLIER_BY_ID(id)),
            create: (data) => apiPost(API.WAREHOUSE.SUPPLIERS, data),
            update: (id, data) => apiPut(API.WAREHOUSE.SUPPLIER_BY_ID(id), data),
            delete: (id) => apiDelete(API.WAREHOUSE.SUPPLIER_BY_ID(id)),
            getTransactions: (id) => apiGet(API.WAREHOUSE.SUPPLIER_TRANSACTIONS(id)),
        },

        // ==========================================
        // Reports - التقارير (17 تقرير شامل)
        // ==========================================
        reports: {
            // دالة عامة للحصول على تقرير
            getReport: (reportId, params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/${reportId}${queryString ? `?${queryString}` : ''}`);
            },

            // 1. تقرير أرصدة
            getBalanceReport: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/balance${queryString ? `?${queryString}` : ''}`);
            },

            // 2. تقرير مستودعات عام
            getGeneralWarehouses: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/general-warehouses${queryString ? `?${queryString}` : ''}`);
            },

            // 3. تقرير حركات تعديل الرصيد الافتتاحي
            getOpeningBalanceAdjustments: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/opening-balance-adjustments${queryString ? `?${queryString}` : ''}`);
            },

            // 4. تقرير حركات الصنف تفصيلي
            getItemMovementDetail: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/item-movement-detail${queryString ? `?${queryString}` : ''}`);
            },

            // 5. بطاقة مراقبة حركة الصنف
            getItemControlCard: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/item-control-card${queryString ? `?${queryString}` : ''}`);
            },

            // 6. تقرير طلبات الصرف
            getDisbursementRequests: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/disbursement-requests${queryString ? `?${queryString}` : ''}`);
            },

            // 7. تقرير آخر طلبات الصرف
            getLatestDisbursement: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/latest-disbursement${queryString ? `?${queryString}` : ''}`);
            },

            // 8. تقرير عهدة موظف
            getEmployeeCustody: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/employee-custody${queryString ? `?${queryString}` : ''}`);
            },

            // 9. تقرير كميات
            getQuantitiesReport: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/quantities${queryString ? `?${queryString}` : ''}`);
            },

            // 10. تقرير قيمة المخزون
            getInventoryValue: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/inventory-value${queryString ? `?${queryString}` : ''}`);
            },

            // 11. تقرير تنبيهات المخزون
            getInventoryAlerts: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/inventory-alerts${queryString ? `?${queryString}` : ''}`);
            },

            // 12. تقرير صلاحية الأصناف
            getItemsValidity: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/items-validity${queryString ? `?${queryString}` : ''}`);
            },

            // 13. تقرير نواقص الأصناف
            getItemsShortages: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/items-shortages${queryString ? `?${queryString}` : ''}`);
            },

            // 14. تقرير آخر طلبات الشراء
            getLatestPurchases: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/latest-purchases${queryString ? `?${queryString}` : ''}`);
            },

            // 15. تقرير الرواكد حسب فترات التخزين
            getStagnantItems: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/stagnant-items${queryString ? `?${queryString}` : ''}`);
            },

            // 16. تقرير عمر المخزون وفترات الصلاحية
            getInventoryAge: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/inventory-age${queryString ? `?${queryString}` : ''}`);
            },

            // ========== وظائف التصدير ==========
            exportToExcel: (reportId, params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/${reportId}/export/excel${queryString ? `?${queryString}` : ''}`);
            },
            exportToPDF: (reportId, params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/${reportId}/export/pdf${queryString ? `?${queryString}` : ''}`);
            },
            print: (reportId, params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/reports/${reportId}/print${queryString ? `?${queryString}` : ''}`);
            },

            // ========== التقارير القديمة (للتوافق) ==========
            getAll: () => apiGet(API.WAREHOUSE.REPORTS),
            getStock: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.REPORT_STOCK}${queryString ? `?${queryString}` : ''}`);
            },
            getMovements: (startDate, endDate) =>
                apiGet(`${API.WAREHOUSE.REPORT_MOVEMENTS}?startDate=${startDate}&endDate=${endDate}`),
            getExchangeRequests: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.REPORT_EXCHANGE_REQUESTS}${queryString ? `?${queryString}` : ''}`);
            },
            getCustodies: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.REPORT_CUSTODIES}${queryString ? `?${queryString}` : ''}`);
            },
            getInventory: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.REPORT_INVENTORY}${queryString ? `?${queryString}` : ''}`);
            },
            getDeviations: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.REPORT_DEVIATIONS}${queryString ? `?${queryString}` : ''}`);
            },
            getItemsByType: () => apiGet(API.WAREHOUSE.REPORT_ITEMS_BY_TYPE),
            getApprovalChain: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.REPORT_APPROVAL_CHAIN}${queryString ? `?${queryString}` : ''}`);
            },
        },

        // ==========================================
        // Approval Chains - تسلسل الاعتمادات المرن
        // ==========================================
        approvalChain: {
            // القراءة والبحث
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.APPROVAL_CHAINS}${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(API.WAREHOUSE.APPROVAL_CHAIN_BY_ID(id)),
            getByType: (type) => apiGet(API.WAREHOUSE.APPROVAL_CHAIN_BY_TYPE(type)),
            getActive: () => apiGet(`${API.WAREHOUSE.APPROVAL_CHAINS}?status=active`),

            // الإنشاء والتعديل
            create: (data) => apiPost(API.WAREHOUSE.APPROVAL_CHAINS, data),
            update: (id, data) => apiPut(API.WAREHOUSE.APPROVAL_CHAIN_BY_ID(id), data),
            delete: (id) => apiDelete(API.WAREHOUSE.APPROVAL_CHAIN_BY_ID(id)),

            // إدارة خطوات التسلسل
            addStep: (chainId, data) => apiPost(`${API.WAREHOUSE.APPROVAL_CHAIN_BY_ID(chainId)}/steps`, data),
            updateStep: (chainId, stepId, data) => apiPut(`${API.WAREHOUSE.APPROVAL_CHAIN_BY_ID(chainId)}/steps/${stepId}`, data),
            removeStep: (chainId, stepId) => apiDelete(`${API.WAREHOUSE.APPROVAL_CHAIN_BY_ID(chainId)}/steps/${stepId}`),
            reorderSteps: (chainId, newOrder) => apiPost(`${API.WAREHOUSE.APPROVAL_CHAIN_BY_ID(chainId)}/steps/reorder`, { order: newOrder }),

            // تفعيل وتعطيل
            activate: (id) => apiPost(`${API.WAREHOUSE.APPROVAL_CHAIN_BY_ID(id)}/activate`),
            deactivate: (id) => apiPost(`${API.WAREHOUSE.APPROVAL_CHAIN_BY_ID(id)}/deactivate`),
            setAsDefault: (id, workflowType) => apiPost(`${API.WAREHOUSE.APPROVAL_CHAIN_BY_ID(id)}/set-default`, { workflowType }),

            // استعلام الموافقات
            getPendingApprovals: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`${API.WAREHOUSE.PENDING_APPROVALS}${queryString ? `?${queryString}` : ''}`);
            },
            getMyPendingApprovals: () => apiGet(`${API.WAREHOUSE.PENDING_APPROVALS}/my`),
            getApprovalHistory: (requestId) => apiGet(`/api/warehouse/approvals/${requestId}/history`),

            // تنفيذ الموافقات
            approve: (requestId, level, data = {}) => apiPost(API.WAREHOUSE.APPROVE_REQUEST(requestId, level), data),
            reject: (requestId, reason) => apiPost(API.WAREHOUSE.REJECT_REQUEST(requestId), { reason }),
            delegate: (requestId, level, toUserId, reason) =>
                apiPost(`/api/warehouse/approvals/${requestId}/delegate/${level}`, { toUserId, reason }),
            escalate: (requestId, reason) =>
                apiPost(`/api/warehouse/approvals/${requestId}/escalate`, { reason }),

            // ربط المسميات الوظيفية
            getJobPositions: () => apiGet('/api/warehouse/approval-chains/job-positions'),
            linkPositionToChain: (chainId, positionCode, stepOrder) =>
                apiPost(`${API.WAREHOUSE.APPROVAL_CHAIN_BY_ID(chainId)}/positions`, { positionCode, stepOrder }),
            unlinkPosition: (chainId, positionCode) =>
                apiDelete(`${API.WAREHOUSE.APPROVAL_CHAIN_BY_ID(chainId)}/positions/${positionCode}`),

            // الموظفين المتاحين للاعتماد
            getAvailableApprovers: (positionCode) =>
                apiGet(`/api/warehouse/approval-chains/approvers?position=${positionCode}`),
            getApproversByDepartment: (deptId) =>
                apiGet(`/api/warehouse/approval-chains/approvers/department/${deptId}`),

            // التقارير والإحصائيات
            getStatistics: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/approval-chains/statistics${queryString ? `?${queryString}` : ''}`);
            },
            getApprovalTimeline: (requestId) => apiGet(`/api/warehouse/approvals/${requestId}/timeline`),
            getAverageApprovalTime: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouse/approval-chains/reports/avg-time${queryString ? `?${queryString}` : ''}`);
            },
        },

        // ==========================================
        // Integration - الربط مع الأنظمة الأخرى
        // ==========================================
        integration: {
            // HR Integration
            hr: {
                getEmployees: () => apiGet(API.WAREHOUSE.INTEGRATION.HR_EMPLOYEES),
                getEmployee: (empId) => apiGet(API.WAREHOUSE.INTEGRATION.HR_EMPLOYEE(empId)),
                getDepartments: () => apiGet(API.WAREHOUSE.INTEGRATION.HR_DEPARTMENTS),
            },
            // Finance Integration
            finance: {
                createJournalEntry: (data) => apiPost(API.WAREHOUSE.INTEGRATION.FINANCE_JOURNAL_ENTRY, data),
                registerAsset: (data) => apiPost(API.WAREHOUSE.INTEGRATION.FINANCE_ASSET_REGISTER, data),
            },
            // Assets Integration
            assets: {
                register: (data) => apiPost(API.WAREHOUSE.INTEGRATION.ASSETS_REGISTER, data),
                depreciation: (assetId) => apiGet(API.WAREHOUSE.INTEGRATION.ASSETS_DEPRECIATION),
            },
            // Tech Support Integration
            techSupport: {
                createTicket: (data) => apiPost(API.WAREHOUSE.INTEGRATION.TECH_SUPPORT_TICKET, data),
            },
        },

        // ==========================================
        // Sync - مزامنة شامل (WarehouseSyncService)
        // ==========================================
        sync: {
            // حالة الخدمة
            getServiceStatus: () => apiGet('/api/warehouse/sync/status'),
            getLastSyncTime: () => apiGet('/api/warehouse/sync/last-time'),

            // السجلات المعلقة
            getPendingCount: () => apiGet('/api/warehouse/sync/pending/count'),
            getPendingCategories: () => apiGet('/api/warehouse/sync/pending/categories'),
            getPendingItems: () => apiGet('/api/warehouse/sync/pending/items'),
            getPendingWarehouses: () => apiGet('/api/warehouse/sync/pending/warehouses'),
            getPendingExchangeRequests: () => apiGet('/api/warehouse/sync/pending/exchange-requests'),
            getPendingReturnRequests: () => apiGet('/api/warehouse/sync/pending/return-requests'),
            getPendingInventoryForms: () => apiGet('/api/warehouse/sync/pending/inventory-forms'),
            getPendingTempReceipts: () => apiGet('/api/warehouse/sync/pending/temp-receipts'),
            getPendingReceiptNotes: () => apiGet('/api/warehouse/sync/pending/receipt-notes'),
            getPendingCustodyCards: () => apiGet('/api/warehouse/sync/pending/custody-cards'),
            getPendingItemMovements: () => apiGet('/api/warehouse/sync/pending/item-movements'),

            // سجلات المزامنة
            getLogs: (params) => apiGet('/api/warehouse/sync/logs', params),
            getLogById: (id) => apiGet(`/api/warehouse/sync/logs/${id}`),

            // المزامنة اليدوية
            syncNow: () => apiPost('/api/warehouse/sync/trigger'),
            syncCategories: () => apiPost('/api/warehouse/sync/trigger/categories'),
            syncItems: () => apiPost('/api/warehouse/sync/trigger/items'),
            syncWarehouses: () => apiPost('/api/warehouse/sync/trigger/warehouses'),
            syncByTemplate: (templateId) => apiPost(`/api/warehouse/sync/trigger/template/${templateId}`),

            // إعادة محاولة المزامنة
            retryFailed: () => apiPost('/api/warehouse/sync/retry-failed'),
            retryById: (recordId, recordType) => apiPost(`/api/warehouse/sync/retry/${recordType}/${recordId}`),

            // إعدادات المزامنة
            getSettings: () => apiGet('/api/warehouse/sync/settings'),
            updateSettings: (data) => apiPut('/api/warehouse/sync/settings', data),

            // جداول ربط شامل
            getShamelUnits: () => apiGet('/api/warehouse/sync/shamel/units'),
            getShamelBranches: () => apiGet('/api/warehouse/sync/shamel/branches'),
            getShamelCities: () => apiGet('/api/warehouse/sync/shamel/cities'),
            getShamelClassifications: () => apiGet('/api/warehouse/sync/shamel/classifications'),
            updateShamelMapping: (type, data) => apiPut(`/api/warehouse/sync/shamel/${type}/mapping`, data),
        },

        // ==========================================
        // Division - تقسيم المستودعات
        // ==========================================
        division: {
            // المستودعات - تستخدم endpoints الـ WarehousesController
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouses/division${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(`/api/warehouses/${id}`),
            getByRegion: (region) => apiGet(`/api/warehouses/division?regionCode=${region}`),
            getByClassification: (classification) => apiGet(`/api/warehouses/division?classification=${classification}`),
            getActive: () => apiGet('/api/warehouses/division?isActive=true'),
            getStatistics: () => apiGet('/api/warehouses/division/statistics'),

            // الإنشاء والتعديل - تستخدم endpoints المستودعات الأساسية
            create: (data) => apiPost('/api/warehouses', data),
            update: (id, data) => apiPut(`/api/warehouses/${id}`, data),
            delete: (id) => apiDelete(`/api/warehouses/${id}`),

            // الموقع الجغرافي
            updateLocation: (id, data) => apiPut(`/api/warehouses/${id}/location`, data),
            getLocations: () => apiGet('/api/warehouses/division?page=1&pageSize=1000'),

            // التفعيل والتعطيل
            activate: (id) => apiPut(`/api/warehouses/${id}`, { isActive: true }),
            deactivate: (id) => apiPut(`/api/warehouses/${id}`, { isActive: false }),

            // الموظفين المرتبطين
            assignCustodian: (id, employeeId, employeeName) => apiPut(`/api/warehouses/${id}`, { custodianId: employeeId, custodianName: employeeName }),
            assignInspector: (id, employeeId, employeeName) => apiPut(`/api/warehouses/${id}`, { inspectorId: employeeId, inspectorName: employeeName }),
        },

        // ==========================================
        // Fiscal Years - السنوات المالية
        // ==========================================
        fiscalYear: {
            getAll: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return apiGet(`/api/warehouses/fiscal-years${queryString ? `?${queryString}` : ''}`);
            },
            getById: (id) => apiGet(`/api/warehouses/fiscal-years/${id}`),
            getCurrent: () => apiGet('/api/warehouses/fiscal-years/current'),

            create: (data) => apiPost('/api/warehouses/fiscal-years', data),
            update: (id, data) => apiPut(`/api/warehouses/fiscal-years/${id}`, data),
            delete: (id) => apiDelete(`/api/warehouses/fiscal-years/${id}`),

            setCurrent: (id) => apiPost(`/api/warehouses/fiscal-years/${id}/set-current`),
            close: (id) => apiPost(`/api/warehouses/fiscal-years/${id}/close`),
        },

        // ==========================================
        // Date Settings - إعدادات التاريخ
        // ==========================================
        dateSettings: {
            get: () => apiGet('/api/warehouses/date-settings'),
            update: (data) => apiPut('/api/warehouses/date-settings', data),
        },

        // Alias methods for the division page (للتوافق مع الواجهة)
        getDivisions: (params) => apiGet(`/api/warehouses/division${params ? `?${new URLSearchParams(params)}` : ''}`),
        createWarehouse: (data) => apiPost('/api/warehouses', data),
        updateWarehouse: (id, data) => apiPut(`/api/warehouses/${id}`, data),
        deleteWarehouse: (id) => apiDelete(`/api/warehouses/${id}`),
        updateWarehouseLocation: (id, data) => apiPut(`/api/warehouses/${id}/location`, data),
        getDivisionStatistics: () => apiGet('/api/warehouses/division/statistics'),
        getFiscalYears: (params) => apiGet(`/api/warehouses/fiscal-years${params ? `?${new URLSearchParams(params)}` : ''}`),
        createFiscalYear: (data) => apiPost('/api/warehouses/fiscal-years', data),
        updateFiscalYear: (id, data) => apiPut(`/api/warehouses/fiscal-years/${id}`, data),
        deleteFiscalYear: (id) => apiDelete(`/api/warehouses/fiscal-years/${id}`),
        setCurrentFiscalYear: (id) => apiPost(`/api/warehouses/fiscal-years/${id}/set-current`),
        closeFiscalYear: (id) => apiPost(`/api/warehouses/fiscal-years/${id}/close`),
        getDateSettings: () => apiGet('/api/warehouses/date-settings'),
        updateDateSettings: (data) => apiPut('/api/warehouses/date-settings', data),
    },

    movement: {
        // Vehicles
        getVehicles: () => apiGet(API.MOVEMENT.VEHICLES),
        getVehicle: (id) => apiGet(API.MOVEMENT.VEHICLE_BY_ID(id)),
        getActiveVehicles: () => apiGet(API.MOVEMENT.VEHICLE_ACTIVE),
        getVehiclesNeedingMaintenance: () => apiGet(API.MOVEMENT.VEHICLE_NEEDS_MAINTENANCE),
        createVehicle: (data) => apiPost(API.MOVEMENT.VEHICLES, data),
        updateVehicle: (id, data) => apiPut(API.MOVEMENT.VEHICLE_BY_ID(id), data),
        deleteVehicle: (id) => apiDelete(API.MOVEMENT.VEHICLE_BY_ID(id)),
        assignDriver: (vehicleId, driverId) => apiPost(API.MOVEMENT.VEHICLE_ASSIGN_DRIVER(vehicleId, driverId)),
        unassignDriver: (vehicleId) => apiPost(API.MOVEMENT.VEHICLE_UNASSIGN_DRIVER(vehicleId)),

        // Drivers
        getDrivers: () => apiGet(API.MOVEMENT.DRIVERS),
        getDriver: (id) => apiGet(API.MOVEMENT.DRIVER_BY_ID(id)),
        getActiveDrivers: () => apiGet(API.MOVEMENT.DRIVER_ACTIVE),
        getAvailableDrivers: () => apiGet(API.MOVEMENT.DRIVER_AVAILABLE),
        getExpiringLicenses: (days = 30) => apiGet(`${API.MOVEMENT.DRIVER_EXPIRING_LICENSES}?daysThreshold=${days}`),
        createDriver: (data) => apiPost(API.MOVEMENT.DRIVERS, data),
        updateDriver: (id, data) => apiPut(API.MOVEMENT.DRIVER_BY_ID(id), data),
        deleteDriver: (id) => apiDelete(API.MOVEMENT.DRIVER_BY_ID(id)),
        getDriverMissions: (id) => apiGet(API.MOVEMENT.DRIVER_MISSIONS(id)),

        // Missions
        getMissions: () => apiGet(API.MOVEMENT.MISSIONS),
        getMission: (id) => apiGet(API.MOVEMENT.MISSION_BY_ID(id)),
        getPendingMissions: () => apiGet(API.MOVEMENT.MISSION_PENDING),
        getInProgressMissions: () => apiGet(API.MOVEMENT.MISSION_IN_PROGRESS),
        getMissionsByVehicle: (vehicleId) => apiGet(API.MOVEMENT.MISSION_BY_VEHICLE(vehicleId)),
        getMissionsByDriver: (driverId) => apiGet(API.MOVEMENT.MISSION_BY_DRIVER(driverId)),
        createMission: (data) => apiPost(API.MOVEMENT.MISSIONS, data),
        updateMission: (id, data) => apiPut(API.MOVEMENT.MISSION_BY_ID(id), data),
        startMission: (id, startMileage) => apiPost(API.MOVEMENT.MISSION_START(id), { id, startMileage }),
        completeMission: (id, endMileage, notes) => apiPost(API.MOVEMENT.MISSION_COMPLETE(id), { id, endMileage, notes }),
        cancelMission: (id) => apiDelete(API.MOVEMENT.MISSION_BY_ID(id)),

        // Maintenance
        getMaintenance: () => apiGet(API.MOVEMENT.MAINTENANCE),
        getMaintenanceRecord: (id) => apiGet(API.MOVEMENT.MAINTENANCE_BY_ID(id)),
        getScheduledMaintenance: () => apiGet(API.MOVEMENT.MAINTENANCE_SCHEDULED),
        getOverdueMaintenance: () => apiGet(API.MOVEMENT.MAINTENANCE_OVERDUE),
        getVehicleMaintenance: (vehicleId) => apiGet(API.MOVEMENT.MAINTENANCE_BY_VEHICLE(vehicleId)),
        scheduleMaintenance: (data) => apiPost(API.MOVEMENT.MAINTENANCE, data),
        updateMaintenance: (id, data) => apiPut(API.MOVEMENT.MAINTENANCE_BY_ID(id), data),
        completeMaintenance: (id, data) => apiPost(API.MOVEMENT.MAINTENANCE_COMPLETE(id), data),
        deleteMaintenance: (id) => apiDelete(API.MOVEMENT.MAINTENANCE_BY_ID(id)),

        // Fuel
        getFuelRecords: () => apiGet(API.MOVEMENT.FUEL),
        getFuelRecord: (id) => apiGet(API.MOVEMENT.FUEL_BY_ID(id)),
        getVehicleFuel: (vehicleId) => apiGet(API.MOVEMENT.FUEL_BY_VEHICLE(vehicleId)),
        addFuelRecord: (data) => apiPost(API.MOVEMENT.FUEL, data),
        deleteFuelRecord: (id) => apiDelete(API.MOVEMENT.FUEL_BY_ID(id)),
        getFuelSummary: (startDate, endDate) => {
            let url = API.MOVEMENT.FUEL_SUMMARY
            if (startDate && endDate) {
                url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
            }
            return apiGet(url)
        },

        // GPS Tracking
        getTrackingSummary: () => apiGet(API.MOVEMENT.TRACKING_VEHICLES),
        getVehiclePosition: (vehicleId) => apiGet(API.MOVEMENT.TRACKING_VEHICLE(vehicleId)),
        getPositionHistory: (vehicleId, fromDate, toDate) =>
            apiGet(`${API.MOVEMENT.TRACKING_VEHICLE_HISTORY(vehicleId)}?fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}`),
        registerGpsDevice: (data) => apiPost(API.MOVEMENT.TRACKING_DEVICE, data),
    },

    archiving: {
        // ==========================================
        // Dashboard (لوحة المعلومات)
        // ==========================================
        getDashboard: () => apiGet(API.ARCHIVING.DASHBOARD),
        getDashboardSummary: () => apiGet(API.ARCHIVING.DASHBOARD_SUMMARY),
        getStorageStats: () => apiGet(API.ARCHIVING.STORAGE_STATS),
        getRecentActivities: (count = 10) => apiGet(`${API.ARCHIVING.RECENT_ACTIVITIES}?count=${count}`),
        getRecentDocuments: (count = 10) => apiGet(`${API.ARCHIVING.RECENT_DOCUMENTS}?count=${count}`),

        // ==========================================
        // File Cabinets (الخزائن الإلكترونية)
        // ==========================================
        getCabinets: () => apiGet(API.ARCHIVING.CABINETS),
        getCabinet: (id) => apiGet(API.ARCHIVING.CABINET_BY_ID(id)),
        getCabinetByCode: (code) => apiGet(API.ARCHIVING.CABINET_BY_CODE(code)),
        getCabinetStatistics: () => apiGet(API.ARCHIVING.CABINET_STATISTICS),
        createCabinet: (data) => apiPost(API.ARCHIVING.CABINETS, data),
        updateCabinet: (id, data) => apiPut(API.ARCHIVING.CABINET_BY_ID(id), data),
        deleteCabinet: (id) => apiDelete(API.ARCHIVING.CABINET_BY_ID(id)),

        // ==========================================
        // Documents (المستندات)
        // ==========================================
        getDocuments: () => apiGet(API.ARCHIVING.DOCUMENTS),
        getDocument: (id) => apiGet(API.ARCHIVING.DOCUMENT_BY_ID(id)),
        getDocumentByBarcode: (barcode) => apiGet(API.ARCHIVING.DOCUMENT_BY_BARCODE(barcode)),
        getDocumentsByCabinet: (cabinetId) => apiGet(API.ARCHIVING.DOCUMENT_BY_CABINET(cabinetId)),
        searchDocuments: (searchDto) => apiPost(API.ARCHIVING.DOCUMENT_SEARCH, searchDto),
        uploadDocument: async (formData) => {
            const session = await getSession();
            if (!session) throw new Error('لم يتم تسجيل الدخول');
            const response = await fetch(`${GATEWAY_URL}${API.ARCHIVING.DOCUMENT_UPLOAD}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.accessToken}` },
                body: formData, // FormData - don't set Content-Type header
            });
            if (!response.ok) {
                const errorData = await safeJsonParse(response);
                throw new Error(errorData.message || 'خطأ في رفع المستند');
            }
            return safeJsonParse(response);
        },
        updateDocument: (id, data) => apiPut(API.ARCHIVING.DOCUMENT_BY_ID(id), data),
        deleteDocument: (id) => apiDelete(API.ARCHIVING.DOCUMENT_BY_ID(id)),
        getDocumentStatsByStatus: () => apiGet(API.ARCHIVING.DOCUMENT_STATS_BY_STATUS),
        getDocumentStatsByCabinet: () => apiGet(API.ARCHIVING.DOCUMENT_STATS_BY_CABINET),
        getStorageSize: (cabinetId = null) => apiGet(`${API.ARCHIVING.DOCUMENT_STORAGE_SIZE}${cabinetId ? `?cabinetId=${cabinetId}` : ''}`),

        // Document Versions (إصدارات المستندات)
        getDocumentWithVersions: (id) => apiGet(API.ARCHIVING.DOCUMENT_WITH_VERSIONS(id)),
        getDocumentVersions: (id) => apiGet(API.ARCHIVING.DOCUMENT_VERSIONS(id)),
        getDocumentVersion: (id, versionNumber) => apiGet(API.ARCHIVING.DOCUMENT_VERSION(id, versionNumber)),
        createDocumentVersion: async (documentId, formData) => {
            const session = await getSession();
            if (!session) throw new Error('لم يتم تسجيل الدخول');
            const response = await fetch(`${GATEWAY_URL}${API.ARCHIVING.DOCUMENT_VERSIONS(documentId)}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.accessToken}` },
                body: formData,
            });
            if (!response.ok) {
                const errorData = await safeJsonParse(response);
                throw new Error(errorData.message || 'خطأ في إنشاء الإصدار');
            }
            return safeJsonParse(response);
        },

        // Document Annotations (التعليقات التوضيحية)
        getDocumentAnnotations: (documentId) => apiGet(API.ARCHIVING.DOCUMENT_ANNOTATIONS(documentId)),
        createAnnotation: (documentId, data) => apiPost(API.ARCHIVING.DOCUMENT_ANNOTATIONS(documentId), data),
        updateAnnotation: (documentId, annotationId, data) => apiPut(API.ARCHIVING.DOCUMENT_ANNOTATION_BY_ID(documentId, annotationId), data),
        deleteAnnotation: (documentId, annotationId) => apiDelete(API.ARCHIVING.DOCUMENT_ANNOTATION_BY_ID(documentId, annotationId)),

        // Document Sharing (مشاركة المستندات)
        getDocumentShares: (documentId) => apiGet(API.ARCHIVING.DOCUMENT_SHARES(documentId)),
        createDocumentShare: (documentId, data) => apiPost(API.ARCHIVING.DOCUMENT_SHARES(documentId), data),
        deleteDocumentShare: (documentId, shareId) => apiDelete(API.ARCHIVING.DOCUMENT_SHARE_BY_ID(documentId, shareId)),

        // ==========================================
        // Workflows (سير العمل)
        // ==========================================
        getWorkflows: () => apiGet(API.ARCHIVING.WORKFLOWS),
        getWorkflow: (id) => apiGet(API.ARCHIVING.WORKFLOW_BY_ID(id)),
        getWorkflowSteps: (id) => apiGet(API.ARCHIVING.WORKFLOW_STEPS(id)),
        createWorkflow: (data) => apiPost(API.ARCHIVING.WORKFLOWS, data),
        updateWorkflow: (id, data) => apiPut(API.ARCHIVING.WORKFLOW_BY_ID(id), data),
        deleteWorkflow: (id) => apiDelete(API.ARCHIVING.WORKFLOW_BY_ID(id)),
        startWorkflow: (workflowId, documentId) => apiPost(API.ARCHIVING.WORKFLOW_START(workflowId, documentId)),

        // Workflow Tasks (مهام سير العمل)
        getWorkflowTasks: () => apiGet(API.ARCHIVING.WORKFLOW_TASKS),
        getWorkflowTask: (id) => apiGet(API.ARCHIVING.WORKFLOW_TASK_BY_ID(id)),
        getPendingTasks: () => apiGet(API.ARCHIVING.WORKFLOW_TASKS_PENDING),
        getMyTasks: () => apiGet(API.ARCHIVING.WORKFLOW_TASKS_MY),
        completeTask: (id, data) => apiPost(API.ARCHIVING.WORKFLOW_TASK_COMPLETE(id), data),
        rejectTask: (id, reason) => apiPost(API.ARCHIVING.WORKFLOW_TASK_REJECT(id), { reason }),
        reassignTask: (id, assignedTo) => apiPost(API.ARCHIVING.WORKFLOW_TASK_REASSIGN(id), { assignedTo }),

        // ==========================================
        // NCAR Transactions (معاملات الأرشيف الوطني)
        // ==========================================
        getTransactions: () => apiGet(API.ARCHIVING.TRANSACTIONS),
        getTransaction: (id) => apiGet(API.ARCHIVING.TRANSACTION_BY_ID(id)),
        getTransactionByBarcode: (barcode) => apiGet(API.ARCHIVING.TRANSACTION_BY_BARCODE(barcode)),
        getTransactionByReference: (ref) => apiGet(API.ARCHIVING.TRANSACTION_BY_REFERENCE(ref)),
        getTransactionsByClassification: (classificationId) => apiGet(API.ARCHIVING.TRANSACTIONS_BY_CLASSIFICATION(classificationId)),
        getTransactionsByStatus: (status) => apiGet(API.ARCHIVING.TRANSACTIONS_BY_STATUS(status)),
        getReadyForArchiving: () => apiGet(API.ARCHIVING.TRANSACTIONS_READY),
        getArchivedTransactions: () => apiGet(API.ARCHIVING.TRANSACTIONS_ARCHIVED),
        getExpiredTransactions: () => apiGet(API.ARCHIVING.TRANSACTIONS_EXPIRED),
        searchTransactions: (searchDto) => apiPost(API.ARCHIVING.TRANSACTIONS_SEARCH, searchDto),
        createTransaction: (data) => apiPost(API.ARCHIVING.TRANSACTIONS, data),
        updateTransaction: (id, data) => apiPut(API.ARCHIVING.TRANSACTION_BY_ID(id), data),
        deleteTransaction: (id) => apiDelete(API.ARCHIVING.TRANSACTION_BY_ID(id)),
        archiveToNCAR: (id, ncarFileNumber) => apiPost(API.ARCHIVING.TRANSACTION_ARCHIVE_TO_NCAR(id), { ncarFileNumber }),
        uploadTransactionAttachment: async (formData) => {
            const session = await getSession();
            if (!session) throw new Error('لم يتم تسجيل الدخول');
            const response = await fetch(`${GATEWAY_URL}/api/archiving/transactions/attachments`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.accessToken}` },
                body: formData,
            });
            if (!response.ok) {
                const errorData = await safeJsonParse(response);
                throw new Error(errorData.message || 'خطأ في رفع المرفق');
            }
            return safeJsonParse(response);
        },
        getStatsByStatus: () => apiGet(API.ARCHIVING.TRANSACTIONS_STATS_BY_STATUS),
        getStatsByClassification: () => apiGet(API.ARCHIVING.TRANSACTIONS_STATS_BY_CLASSIFICATION),

        // Classifications (التصنيفات)
        getClassifications: () => apiGet(API.ARCHIVING.CLASSIFICATIONS),
        getClassification: (id) => apiGet(API.ARCHIVING.CLASSIFICATION_BY_ID(id)),
        getClassificationByCode: (code) => apiGet(API.ARCHIVING.CLASSIFICATION_BY_CODE(code)),
        getRootClassifications: () => apiGet(API.ARCHIVING.CLASSIFICATIONS_ROOT),
        getSubClassifications: (parentId) => apiGet(API.ARCHIVING.CLASSIFICATION_SUBS(parentId)),
        createClassification: (data) => apiPost(API.ARCHIVING.CLASSIFICATIONS, data),
        updateClassification: (id, data) => apiPut(API.ARCHIVING.CLASSIFICATION_BY_ID(id), data),
        deleteClassification: (id) => apiDelete(API.ARCHIVING.CLASSIFICATION_BY_ID(id)),

        // Retention Policies (سياسات الاحتفاظ)
        getRetentionPolicies: () => apiGet(API.ARCHIVING.RETENTION_POLICIES),
        getRetentionPolicy: (id) => apiGet(API.ARCHIVING.RETENTION_BY_ID(id)),
        createRetentionPolicy: (data) => apiPost(API.ARCHIVING.RETENTION_POLICIES, data),
        updateRetentionPolicy: (id, data) => apiPut(API.ARCHIVING.RETENTION_BY_ID(id), data),
        deleteRetentionPolicy: (id) => apiDelete(API.ARCHIVING.RETENTION_BY_ID(id)),

        // Audit Log (سجل التدقيق)
        getAuditLog: () => apiGet(API.ARCHIVING.AUDIT_LOG),
        searchAuditLog: (searchDto) => apiPost(API.ARCHIVING.AUDIT_LOG_SEARCH, searchDto),
        getAuditLogByEntity: (entityType, entityId) => apiGet(API.ARCHIVING.AUDIT_LOG_BY_ENTITY(entityType, entityId)),
        verifyAuditChain: () => apiGet(API.ARCHIVING.AUDIT_LOG_VERIFY_CHAIN),

        // Hot Folders (المجلدات الساخنة)
        getHotFolders: () => apiGet(API.ARCHIVING.HOT_FOLDERS),
        getHotFolder: (id) => apiGet(API.ARCHIVING.HOT_FOLDER_BY_ID(id)),
        createHotFolder: (data) => apiPost(API.ARCHIVING.HOT_FOLDERS, data),
        updateHotFolder: (id, data) => apiPut(API.ARCHIVING.HOT_FOLDER_BY_ID(id), data),
        deleteHotFolder: (id) => apiDelete(API.ARCHIVING.HOT_FOLDER_BY_ID(id)),
        processHotFolder: (id) => apiPost(API.ARCHIVING.HOT_FOLDER_PROCESS(id)),

        // Physical Locations (المواقع الفيزيائية)
        getPhysicalLocations: () => apiGet(API.ARCHIVING.PHYSICAL_LOCATIONS),
        getPhysicalLocation: (id) => apiGet(API.ARCHIVING.PHYSICAL_LOCATION_BY_ID(id)),
        createPhysicalLocation: (data) => apiPost(API.ARCHIVING.PHYSICAL_LOCATIONS, data),
        updatePhysicalLocation: (id, data) => apiPut(API.ARCHIVING.PHYSICAL_LOCATION_BY_ID(id), data),
        deletePhysicalLocation: (id) => apiDelete(API.ARCHIVING.PHYSICAL_LOCATION_BY_ID(id)),

        // Reports (التقارير)
        getReports: () => apiGet(API.ARCHIVING.REPORTS),
        getDocumentActivityReport: (fromDate, toDate) => apiGet(`${API.ARCHIVING.REPORT_DOCUMENT_ACTIVITY}?fromDate=${fromDate}&toDate=${toDate}`),
        getStorageUsageReport: () => apiGet(API.ARCHIVING.REPORT_STORAGE_USAGE),
        getWorkflowStatusReport: () => apiGet(API.ARCHIVING.REPORT_WORKFLOW_STATUS),
        getUserActivityReport: (userId, fromDate, toDate) => apiGet(`${API.ARCHIVING.REPORT_USER_ACTIVITY}?userId=${userId}&fromDate=${fromDate}&toDate=${toDate}`),

        // ==========================================
        // Document Security (أمان المستندات)
        // ==========================================
        documentSecurity: {
            // إعدادات العارض الآمن
            getViewerConfig: (documentId) =>
                apiGet(`/api/documents/${documentId}/security/viewer-config`),

            // توليد رموز الوصول
            generateViewToken: (documentId) =>
                apiPost(`/api/documents/${documentId}/security/view-token`),
            generateDownloadToken: (documentId) =>
                apiPost(`/api/documents/${documentId}/security/download-token`),
            generatePrintToken: (documentId) =>
                apiPost(`/api/documents/${documentId}/security/print-token`),

            // التحقق من الرموز
            validateToken: (data) =>
                apiPost('/api/document-access/validate-token', data),
            revokeToken: (token) =>
                apiDelete(`/api/document-access/revoke-token/${token}`),

            // طلبات موافقة التحميل/الطباعة
            requestDownload: (documentId, data) =>
                apiPost(`/api/documents/${documentId}/security/request-download`, data),
            requestPrint: (documentId, data) =>
                apiPost(`/api/documents/${documentId}/security/request-print`, data),

            // طلبات الوصول للمستندات السرية
            requestConfidentialAccess: (documentId, data) =>
                apiPost(`/api/documents/${documentId}/security/request-confidential-access`, data),

            // إدارة الموافقات
            getPendingApprovals: () =>
                apiGet('/api/document-access/pending-approvals'),
            getMyRequests: () =>
                apiGet('/api/document-access/my-requests'),
            getRequestStatus: (requestId) =>
                apiGet(`/api/document-access/request/${requestId}/status`),
            approveRequest: (requestId, data) =>
                apiPost(`/api/document-access/approve/${requestId}`, data),
            rejectRequest: (requestId, data) =>
                apiPost(`/api/document-access/reject/${requestId}`, data),
            delegateRequest: (requestId, data) =>
                apiPost(`/api/document-access/delegate/${requestId}`, data),

            // سجل التدقيق الأمني
            getSecurityAuditLog: (documentId, params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/documents/${documentId}/security/audit-log${query ? `?${query}` : ''}`);
            },
            searchSecurityLogs: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/document-access/security-logs${query ? `?${query}` : ''}`);
            },
            getSecurityStats: () =>
                apiGet('/api/document-access/security-stats'),

            // بث المستند الآمن
            getSecureDocumentUrl: (documentId, token) =>
                `/api/documents/${documentId}/security/stream?token=${token}`,
        },
    },

    epm: {
        // Dashboard - لوحة المعلومات
        getDashboard: () => apiGet(API.EPM.DASHBOARD),
        getDashboardSummary: () => apiGet(API.EPM.DASHBOARD_SUMMARY),
        getHealth: () => apiGet(API.EPM.HEALTH),
        getStandards: () => apiGet(API.EPM.STANDARDS),
        getEmployees: (params = {}) => {
            const q = new URLSearchParams(params).toString();
            return apiGet(`${API.EPM.EMPLOYEES}${q ? `?${q}` : ''}`);
        },
        getEmployee: (id) => apiGet(API.EPM.EMPLOYEE_BY_SOURCE_ID(id)),
        syncHrEmployees: () => apiPost(API.EPM.HR_SYNC),

        // Charters - الميثاقات
        getCharters: (filters = {}) => {
            const params = new URLSearchParams();
            if (filters.fiscalYear) params.append('fiscalYear', filters.fiscalYear);
            if (filters.status) params.append('status', filters.status);
            if (filters.employeeId) params.append('employeeId', filters.employeeId);
            if (filters.search) params.append('search', filters.search);
            if (filters.page) params.append('page', filters.page);
            if (filters.pageSize) params.append('pageSize', filters.pageSize);
            const q = params.toString();
            return apiGet(`${API.EPM.CHARTERS}${q ? `?${q}` : ''}`);
        },
        getCharter: (id) => apiGet(API.EPM.CHARTER_BY_ID(id)),
        getCharterByEmployee: (employeeId) => apiGet(API.EPM.CHARTER_BY_EMPLOYEE(employeeId)),
        getActiveCharters: () => apiGet(API.EPM.CHARTERS_ACTIVE),
        createCharter: (data) => apiPost(API.EPM.CHARTERS, data),
        updateCharter: (id, data) => apiPut(API.EPM.CHARTER_BY_ID(id), data),
        submitCharter: (id) => apiPost(API.EPM.CHARTER_SUBMIT(id)),
        approveCharter: (id, data) => apiPost(API.EPM.CHARTER_APPROVE(id), data),
        rejectCharter: (id, reason) => apiPost(API.EPM.CHARTER_REJECT(id), { reason }),
        deleteCharter: (id) => apiDelete(API.EPM.CHARTER_BY_ID(id)),
        calculateCharterScore: (id) => apiPost(API.EPM.CHARTER_SCORE(id)),

        // Goals - الأهداف
        getGoals: (filters = {}) => {
            const params = new URLSearchParams();
            if (filters.charterId) params.append('charterId', filters.charterId);
            if (filters.status) params.append('status', filters.status);
            if (filters.page) params.append('page', filters.page);
            if (filters.pageSize) params.append('pageSize', filters.pageSize);
            const q = params.toString();
            return apiGet(`${API.EPM.GOALS}${q ? `?${q}` : ''}`);
        },
        getGoal: (id) => apiGet(API.EPM.GOAL_BY_ID(id)),
        getGoalsByCharter: (charterId) => apiGet(API.EPM.GOALS_BY_CHARTER(charterId)),
        createGoal: (data) => apiPost(API.EPM.GOALS, data),
        updateGoal: (id, data) => apiPut(API.EPM.GOAL_BY_ID(id), data),
        updateGoalProgress: (id, data) => apiPut(API.EPM.GOAL_PROGRESS(id), data),
        deleteGoal: (id) => apiDelete(API.EPM.GOAL_BY_ID(id)),
        validateGoalWeights: (data) => apiPost(API.EPM.GOALS_VALIDATE_WEIGHTS, data),

        // Competencies - الكفايات
        getCompetencies: (filters = {}) => {
            const params = new URLSearchParams();
            if (filters.charterId) params.append('charterId', filters.charterId);
            if (filters.competencyType) params.append('competencyType', filters.competencyType);
            if (filters.page) params.append('page', filters.page);
            if (filters.pageSize) params.append('pageSize', filters.pageSize);
            const q = params.toString();
            return apiGet(`${API.EPM.COMPETENCIES}${q ? `?${q}` : ''}`);
        },
        getCompetency: (id) => apiGet(API.EPM.COMPETENCY_BY_ID(id)),
        getCompetenciesByCharter: (charterId) => apiGet(API.EPM.COMPETENCIES_BY_CHARTER(charterId)),
        createCompetency: (data) => apiPost(API.EPM.COMPETENCIES, data),
        updateCompetency: (id, data) => apiPut(API.EPM.COMPETENCY_BY_ID(id), data),
        deleteCompetency: (id) => apiDelete(API.EPM.COMPETENCY_BY_ID(id)),

        // Excellence - عناصر التميز
        getExcellenceElements: (filters = {}) => {
            const params = new URLSearchParams();
            if (filters.charterId) params.append('charterId', filters.charterId);
            if (filters.elementType) params.append('elementType', filters.elementType);
            if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
            if (filters.page) params.append('page', filters.page);
            if (filters.pageSize) params.append('pageSize', filters.pageSize);
            const q = params.toString();
            return apiGet(`${API.EPM.EXCELLENCE}${q ? `?${q}` : ''}`);
        },
        getExcellenceElement: (id) => apiGet(API.EPM.EXCELLENCE_BY_ID(id)),
        createExcellenceElement: (data) => apiPost(API.EPM.EXCELLENCE, data),
        updateExcellenceElement: (id, data) => apiPut(API.EPM.EXCELLENCE_BY_ID(id), data),
        deleteExcellenceElement: (id) => apiDelete(API.EPM.EXCELLENCE_BY_ID(id)),
        approveExcellenceElement: (id, data) => apiPost(API.EPM.EXCELLENCE_BY_ID(id), { action: 'approve', ...data }),
        rejectExcellenceElement: (id, data) => apiPost(API.EPM.EXCELLENCE_BY_ID(id), { action: 'reject', ...data }),

        // Performance Reviews - المراجعات الدورية
        getReviews: (filters = {}) => {
            const params = new URLSearchParams();
            if (filters.charterId) params.append('charterId', filters.charterId);
            if (filters.reviewType) params.append('reviewType', filters.reviewType);
            if (filters.status) params.append('status', filters.status);
            if (filters.page) params.append('page', filters.page);
            if (filters.pageSize) params.append('pageSize', filters.pageSize);
            const q = params.toString();
            return apiGet(`${API.EPM.REVIEWS}${q ? `?${q}` : ''}`);
        },
        getReview: (id) => apiGet(API.EPM.REVIEW_BY_ID(id)),
        getReviewsByCharter: (charterId) => apiGet(API.EPM.REVIEWS_BY_CHARTER(charterId)),
        getPendingReviews: () => apiGet(API.EPM.REVIEWS_PENDING),
        createReview: (data) => apiPost(API.EPM.REVIEWS, data),
        updateReview: (id, data) => apiPut(API.EPM.REVIEW_BY_ID(id), data),
        submitReview: (id) => apiPost(API.EPM.REVIEW_SUBMIT(id)),
        acknowledgeReview: (id) => apiPost(API.EPM.REVIEW_ACKNOWLEDGE(id)),
        appealReview: (id, data) => apiPost(API.EPM.REVIEW_APPEAL(id), data),
        deleteReview: (id) => apiDelete(API.EPM.REVIEW_BY_ID(id)),

        // Evaluation aliases (used by evaluations page)
        getEvaluations: (params) => apiGet('/api/epm/reviews', params),
        scheduleEvaluation: (data) => apiPost('/api/epm/reviews', data),
        submitEvaluation: (id, data) => apiPost(`/api/epm/reviews/${id}/submit`, data),

        // KPIs - مؤشرات الأداء
        getKPIs: (filters = {}) => {
            const params = new URLSearchParams();
            if (filters.charterId) params.append('charterId', filters.charterId);
            if (filters.goalId) params.append('goalId', filters.goalId);
            if (filters.status) params.append('status', filters.status);
            if (filters.page) params.append('page', filters.page);
            if (filters.pageSize) params.append('pageSize', filters.pageSize);
            const q = params.toString();
            return apiGet(`${API.EPM.KPIS}${q ? `?${q}` : ''}`);
        },
        getKPI: (id) => apiGet(API.EPM.KPI_BY_ID(id)),
        getKPIsByCharter: (charterId) => apiGet(API.EPM.KPIS_BY_CHARTER(charterId)),
        createKPI: (data) => apiPost(API.EPM.KPIS, data),
        updateKPI: (id, data) => apiPut(API.EPM.KPI_BY_ID(id), data),
        measureKPI: (id, data) => apiPut(API.EPM.KPI_MEASURE(id), data),
        deleteKPI: (id) => apiDelete(API.EPM.KPI_BY_ID(id)),

        // Reports - التقارير
        getPerformanceReport: (employeeId, year) => apiGet(`${API.EPM.REPORT_PERFORMANCE}?employeeId=${employeeId}&fiscalYear=${year}`),
        getDepartmentReport: (fiscalYear) => apiGet(`${API.EPM.REPORT_DEPARTMENT}?fiscalYear=${fiscalYear}`),
        getAnnualReport: (year) => apiGet(`${API.EPM.REPORT_ANNUAL}?fiscalYear=${year}`),
    },

    sadad: {
        // Dashboard
        getDashboardSummary: () => apiGet('/api/sadad/summary'),
        getHealth: () => getSystemHealth('/api/sadad'),

        // Invoices - الفواتير
        getInvoices: () => apiGet('/api/v1/Invoices'),
        getInvoice: (id) => apiGet(`/api/v1/Invoices/${id}`),
        getInvoiceByBillNumber: (billNumber) => apiGet(`/api/v1/Invoices/bill/${billNumber}`),
        getInvoicesByStatus: (statusId) => apiGet(`/api/v1/Invoices/status/${statusId}`),
        getCustomerInvoices: (nationalId) => apiGet(`/api/v1/Invoices/customer/${nationalId}`),
        createInvoice: (data) => apiPost('/api/v1/Invoices', data),
        publishInvoice: (id) => apiPost(`/api/v1/Invoices/${id}/publish`),
        cancelInvoice: (id) => apiPost(`/api/v1/Invoices/${id}/cancel`),
        getInvoiceTotal: (id) => apiGet(`/api/v1/Invoices/${id}/total`),

        // Payments - المدفوعات
        getPayments: () => apiGet('/api/sadad/payments'),
        checkPaymentStatus: (data) => apiPost('/api/v1/Payments/check-status', data),
        processPayment: (invoiceId) => apiPost(`/api/v1/Payments/process/${invoiceId}`),
        getPaymentByInvoice: (invoiceId) => apiGet(`/api/v1/Payments/invoice/${invoiceId}`),
        refundPayment: (paymentId, data) => apiPost(`/api/v1/Payments/${paymentId}/refund`, data),

        // Refunds - المبالغ المستردة
        getRefunds: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/v1/Payments/refunds${query ? `?${query}` : ''}`);
        },
        createRefund: (data) => apiPost('/api/v1/Payments/refund', data),
        approveRefund: (id) => apiPost(`/api/v1/Payments/${id}/refund/approve`),
        rejectRefund: (id) => apiPost(`/api/v1/Payments/${id}/refund/reject`),
    },

    analytics: {
        // Intelligence - الذكاء المؤسسي
        getDashboard: () => apiGet('/api/Intelligence/summary'),
        getSystemHealth: () => apiGet('/api/Intelligence/health'),
        getCompliance: () => apiGet('/api/Intelligence/compliance'),

        // Audit - التدقيق الأمني
        logAuditEvent: (data) => apiPost('/api/Audit/log', data),
        getAuditAlerts: (riskLevel) => apiGet(`/api/Audit/alerts/${riskLevel}`),
        getAuditLogs: (params) => {
            const queryParams = new URLSearchParams()
            if (params?.startDate) queryParams.append('startDate', params.startDate)
            if (params?.endDate) queryParams.append('endDate', params.endDate)
            if (params?.userId) queryParams.append('userId', params.userId)
            if (params?.action) queryParams.append('action', params.action)
            const query = queryParams.toString()
            return apiGet(`/api/Audit/logs${query ? `?${query}` : ''}`)
        },

        // Reports - التقارير التحليلية
        getSystemUsageReport: (startDate, endDate) =>
            apiGet(`/api/analytics/reports/usage?startDate=${startDate}&endDate=${endDate}`),
        getUserActivityReport: (userId, startDate, endDate) =>
            apiGet(`/api/analytics/reports/user-activity/${userId}?startDate=${startDate}&endDate=${endDate}`),
        getPerformanceMetrics: () => apiGet('/api/analytics/metrics/performance'),

        // Enterprise Analytics - التحليلات المؤسسية
        getEnterpriseSummary: () => apiGet('/api/analytics/enterprise-summary'),
        getHRAnalytics: (period) => apiGet(`/api/analytics/hr${period ? `?period=${period}` : ''}`),
        getWarehouseAnalytics: (period) => apiGet(`/api/analytics/warehouse${period ? `?period=${period}` : ''}`),
        getFinancialAnalytics: (period) => apiGet(`/api/analytics/financial${period ? `?period=${period}` : ''}`),
        getFleetAnalytics: (period) => apiGet(`/api/analytics/fleet${period ? `?period=${period}` : ''}`),
        getKPIs: (period) => apiGet(`/api/analytics/kpis${period ? `?period=${period}` : ''}`),

        // Reports Management - إدارة التقارير
        getReports: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/analytics/reports${query ? `?${query}` : ''}`);
        },
        getReportTemplates: () => apiGet('/api/analytics/reports/templates'),
        createReport: (data) => apiPost('/api/analytics/reports', data),
        scheduleReport: (id, schedule) => apiPost(`/api/analytics/reports/${id}/schedule`, schedule),
        runReport: (id) => apiPost(`/api/analytics/reports/${id}/run`),
        downloadReport: (id, format) => apiGet(`/api/analytics/reports/${id}/download${format ? `?format=${format}` : ''}`),

        // Security Alerts - التنبيهات الأمنية
        getSecurityAlerts: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/Audit/alerts${query ? `?${query}` : ''}`);
        },
    },

    saas: {
        // ══════════════════════════════════════════════════════════════════
        // Tenants - المستأجرين
        // ══════════════════════════════════════════════════════════════════
        getTenants: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/saas/tenants${query ? `?${query}` : ''}`);
        },
        getTenant: (id) => apiGet(`/api/saas/tenants/${id}`),
        getTenantByCode: (code) => apiGet(`/api/saas/tenants/code/${code}`),
        createTenant: (data) => apiPost('/api/saas/tenants', data),
        updateTenant: (id, data) => apiPut(`/api/saas/tenants/${id}`, data),
        activateTenant: (id) => apiPost(`/api/saas/tenants/${id}/activate`),
        suspendTenant: (id, reason) => apiPost(`/api/saas/tenants/${id}/suspend`, { reason }),
        deleteTenant: (id) => apiDelete(`/api/saas/tenants/${id}`),
        resetTenantAdminPassword: (id) => apiPost(`/api/saas/tenants/${id}/reset-password`),
        getTenantStats: () => apiGet('/api/saas/tenants/statistics'),

        // ══════════════════════════════════════════════════════════════════
        // Subscriptions - الاشتراكات
        // ══════════════════════════════════════════════════════════════════
        getSubscriptions: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/saas/subscriptions${query ? `?${query}` : ''}`);
        },
        getSubscription: (id) => apiGet(`/api/saas/subscriptions/${id}`),
        getTenantModules: (tenantId) => apiGet(`/api/saas/tenants/${tenantId}/modules`),
        getTenantDetails: (tenantId) => apiGet(`/api/saas/tenants/${tenantId}`),
        activateModule: (tenantId, moduleCode, months) =>
            apiPost(`/api/saas/tenants/${tenantId}/modules`, { modulesActive: [moduleCode] }),
        deactivateModule: (tenantId, moduleCode) =>
            apiPut(`/api/saas/tenants/${tenantId}/modules`, { moduleCode, isActive: false }),
        renewSubscription: (subscriptionId, months) =>
            apiPost(`/api/saas/subscriptions/${subscriptionId}/renew`, { months }),
        cancelSubscription: (subscriptionId, reason) =>
            apiPost(`/api/saas/subscriptions/${subscriptionId}/cancel`, { reason }),
        upgradeSubscription: (subscriptionId, data) =>
            apiPut(`/api/saas/subscriptions/${subscriptionId}/upgrade`, data),
        getSubscriptionStats: () => apiGet('/api/saas/subscriptions/statistics'),
        getExpiringSubscriptions: (days = 30) => apiGet(`/api/saas/subscriptions?status=expiring&days=${days}`),

        // ══════════════════════════════════════════════════════════════════
        // Free Trial - التجربة المجانية
        // ══════════════════════════════════════════════════════════════════
        // Public endpoints (no auth required)
        submitFreeTrialRequest: (data) => apiPost('/api/saas/free-trial/request', data),
        checkTrialStatus: (email) => apiGet(`/api/saas/free-trial/check-status?email=${encodeURIComponent(email)}`),
        getAvailableModules: () => apiGet('/api/saas/free-trial/available-modules'),

        // Admin endpoints (auth required)
        getFreeTrialRequests: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/saas/free-trial/requests${query ? `?${query}` : ''}`);
        },
        getFreeTrialRequest: (id) => apiGet(`/api/saas/free-trial/requests/${id}`),
        approveFreeTrialRequest: (id, data = {}) => apiPut(`/api/saas/free-trial/requests/${id}`, { action: 'approve', ...data }),
        rejectFreeTrialRequest: (id, reason) => apiPut(`/api/saas/free-trial/requests/${id}`, { action: 'reject', notes: reason }),
        getFreeTrialStats: () => apiGet('/api/saas/free-trial/statistics'),

        // ══════════════════════════════════════════════════════════════════
        // Contact Requests - طلبات التواصل
        // ══════════════════════════════════════════════════════════════════
        // Public endpoint (no auth required)
        submitContactRequest: (data) => apiPost('/api/saas/contact/submit', data),

        // Admin endpoints (auth required)
        getContactRequests: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/saas/contact/requests${query ? `?${query}` : ''}`);
        },
        getContactRequest: (id) => apiGet(`/api/saas/contact/requests/${id}`),
        markContactAsRead: (id) => apiPut(`/api/saas/contact/requests/${id}`, { status: 'read' }),
        respondToContact: (id, response) => apiPut(`/api/saas/contact/requests/${id}`, { status: 'responded', notes: response }),
        archiveContactRequest: (id) => apiPut(`/api/saas/contact/requests/${id}`, { status: 'closed' }),
        getContactStats: () => apiGet('/api/saas/contact/statistics'),

        // ══════════════════════════════════════════════════════════════════
        // Entities - الجهات الحكومية
        // ══════════════════════════════════════════════════════════════════
        getEntities: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/saas/entities${query ? `?${query}` : ''}`);
        },
        getEntity: (id) => apiGet(`/api/saas/entities/${id}`),
        createEntity: (data) => apiPost('/api/saas/entities', data),
        updateEntity: (id, data) => apiPut(`/api/saas/entities/${id}`, data),
        deleteEntity: (id) => apiDelete(`/api/saas/entities/${id}`),
        getEntitySubscriptions: (id) => apiGet(`/api/saas/entities/${id}/subscriptions`),
        getEntityInvoices: (id) => apiGet(`/api/saas/entities/${id}/invoices`),

        // ══════════════════════════════════════════════════════════════════
        // Plans - خطط الاشتراك
        // ══════════════════════════════════════════════════════════════════
        getPlans: () => apiGet('/api/saas/plans'),
        getPlan: (id) => apiGet(`/api/saas/plans/${id}`),
        createPlan: (data) => apiPost('/api/saas/plans', data),
        updatePlan: (id, data) => apiPut(`/api/saas/plans/${id}`, data),
        deletePlan: (id) => apiDelete(`/api/saas/plans/${id}`),
        getActivePlans: () => apiGet('/api/saas/plans/active'),

        // ══════════════════════════════════════════════════════════════════
        // System Modules - وحدات النظام
        // ══════════════════════════════════════════════════════════════════
        getSystemModules: () => apiGet('/api/saas/modules'),
        getSystemModule: (code) => apiGet(`/api/saas/modules/${code}`),
        updateModuleStatus: (code, isActive) => apiPut(`/api/saas/modules/${code}/status`, { isActive }),
        updateModulePrice: (code, price) => apiPut(`/api/saas/modules/${code}/pricing`, { price }),

        // ══════════════════════════════════════════════════════════════════
        // Billing & Invoices - الفواتير والمدفوعات
        // ══════════════════════════════════════════════════════════════════
        getTenantBilling: (tenantId) => apiGet(`/api/saas/billing/tenant/${tenantId}`),
        generateInvoice: (tenantId, data) => apiPost(`/api/saas/billing/tenant/${tenantId}/generate-invoice`, data),
        getInvoices: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/saas/invoices${query ? `?${query}` : ''}`);
        },
        getInvoice: (id) => apiGet(`/api/saas/invoices/${id}`),
        markInvoicePaid: (id, paymentData) => apiPost(`/api/saas/invoices/${id}/mark-paid`, paymentData),
        cancelInvoice: (id, reason) => apiPost(`/api/saas/invoices/${id}/cancel`, { reason }),
        sendInvoiceReminder: (id) => apiPost(`/api/saas/invoices/${id}/send-reminder`),
        getBillingStats: () => apiGet('/api/saas/billing/statistics'),
        getPendingInvoices: () => apiGet('/api/saas/invoices/pending'),
        getOverdueInvoices: () => apiGet('/api/saas/invoices/overdue'),

        // ══════════════════════════════════════════════════════════════════
        // Dashboard & Analytics - لوحة التحكم والتحليلات
        // ══════════════════════════════════════════════════════════════════
        getDashboardStats: () => apiGet('/api/saas/dashboard/stats'),
        getRevenueReport: (startDate, endDate) =>
            apiGet(`/api/saas/reports/revenue?startDate=${startDate}&endDate=${endDate}`),
        getGrowthReport: (months = 12) => apiGet(`/api/saas/reports/growth?months=${months}`),
        getChurnReport: (months = 12) => apiGet(`/api/saas/reports/churn?months=${months}`),
        getModuleUsageReport: () => apiGet('/api/saas/reports/module-usage'),
        exportReport: (type, format = 'xlsx') =>
            apiGet(`/api/saas/reports/export?type=${type}&format=${format}`, { responseType: 'blob' }),

        // ══════════════════════════════════════════════════════════════════
        // Admin Users - مستخدمي الإدارة
        // ══════════════════════════════════════════════════════════════════
        getAdminUsers: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/saas/admin-users${query ? `?${query}` : ''}`);
        },
        getAdminUser: (id) => apiGet(`/api/saas/admin-users/${id}`),
        createAdminUser: (data) => apiPost('/api/saas/admin-users', data),
        updateAdminUser: (id, data) => apiPut(`/api/saas/admin-users/${id}`, data),
        deleteAdminUser: (id) => apiDelete(`/api/saas/admin-users/${id}`),
        getAdminUserStats: () => apiGet('/api/saas/admin-users/stats'),

        // Notification Preferences - إعدادات الإشعارات
        getNotificationPreferences: (adminUserId) => apiGet(`/api/saas/notifications/preferences?userId=${adminUserId}`),
        updateNotificationPreferences: (adminUserId, data) => apiPut(`/api/saas/notifications/preferences`, { userId: adminUserId, ...data }),

        // Telegram Settings - إعدادات تليجرام
        getTelegramSettings: (adminUserId) => apiGet(`/api/saas/notifications/preferences?userId=${adminUserId}&channel=telegram`),
        initiateTelegramConnection: (adminUserId) => apiPost(`/api/saas/admin-users/${adminUserId}/telegram/connect`),
        connectTelegram: (adminUserId) => apiPost(`/api/saas/admin-users/${adminUserId}/telegram/connect`), // alias
        disconnectTelegram: (adminUserId) => apiDelete(`/api/saas/admin-users/${adminUserId}/telegram`),

        // ══════════════════════════════════════════════════════════════════
        // Notifications - الإشعارات
        // ══════════════════════════════════════════════════════════════════
        getNotificationLogs: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/saas/notifications/logs${query ? `?${query}` : ''}`);
        },
        getNotificationStats: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/saas/notifications/statistics${query ? `?${query}` : ''}`);
        },
        sendTestEmail: (adminUserId) => apiPost('/api/saas/notifications/test-email', { adminUserId }),
        sendTestTelegram: (adminUserId) => apiPost('/api/saas/notifications/test-telegram', { adminUserId }),
        testEmailNotification: (adminUserId) => apiPost('/api/saas/notifications/test-email', { adminUserId }), // alias
        testTelegramNotification: (adminUserId) => apiPost('/api/saas/notifications/test-telegram', { adminUserId }), // alias
        getTelegramBotStatus: () => apiGet('/api/saas/notifications/telegram/status'),
        getNotificationTypes: () => apiGet('/api/saas/notifications/types'),

        // ══════════════════════════════════════════════════════════════════
        // Landing Page Management - إدارة الصفحة الرئيسية
        // ══════════════════════════════════════════════════════════════════
        landing: {
            // ─────────────────────────────────────────────────────────────────
            // Public Endpoints (No Auth Required) - للعرض في الصفحة الرئيسية
            // ─────────────────────────────────────────────────────────────────
            getPublicData: () => safeFetchJson(`${GATEWAY_URL}/api/saas/landing/public/data`),
            getPublicModules: () => safeFetchJson(`${GATEWAY_URL}/api/saas/landing/public/modules`),
            getPublicPricing: () => safeFetchJson(`${GATEWAY_URL}/api/saas/landing/public/pricing`),
            getPublicTestimonials: () => safeFetchJson(`${GATEWAY_URL}/api/saas/landing/public/testimonials`),
            getPublicFAQs: () => safeFetchJson(`${GATEWAY_URL}/api/saas/landing/public/faqs`),
            getPublicStats: () => safeFetchJson(`${GATEWAY_URL}/api/saas/landing/public/stats`),
            getPublicPartners: () => safeFetchJson(`${GATEWAY_URL}/api/saas/landing/public/partners`),
            submitContactRequest: (data) => safeFetchJson(`${GATEWAY_URL}/api/saas/landing/public/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }),

            // ─────────────────────────────────────────────────────────────────
            // Admin Endpoints - Sections (أقسام الصفحة)
            // ─────────────────────────────────────────────────────────────────
            getSections: () => apiGet('/api/saas/landing/admin/sections'),
            updateSection: (id, data) => apiPut(`/api/saas/landing/admin/sections/${id}`, data),
            toggleSection: (id) => apiPost(`/api/saas/landing/admin/sections/${id}/toggle`),
            reorderSections: (data) => apiPost('/api/saas/landing/admin/sections/reorder', data),

            // ─────────────────────────────────────────────────────────────────
            // Admin Endpoints - Modules (الأنظمة)
            // ─────────────────────────────────────────────────────────────────
            getModules: () => apiGet('/api/saas/landing/admin/modules'),
            getModule: (id) => apiGet(`/api/saas/landing/admin/modules/${id}`),
            createModule: (data) => apiPost('/api/saas/landing/admin/modules', data),
            updateModule: (id, data) => apiPut(`/api/saas/landing/admin/modules/${id}`, data),
            deleteModule: (id) => apiDelete(`/api/saas/landing/admin/modules/${id}`),
            toggleModule: (id) => apiPost(`/api/saas/landing/admin/modules/${id}/toggle`),

            // ─────────────────────────────────────────────────────────────────
            // Admin Endpoints - Pricing Plans (خطط الأسعار)
            // ─────────────────────────────────────────────────────────────────
            getPricingPlans: () => apiGet('/api/saas/landing/admin/pricing'),
            getPricingPlan: (id) => apiGet(`/api/saas/landing/admin/pricing/${id}`),
            createPricingPlan: (data) => apiPost('/api/saas/landing/admin/pricing', data),
            updatePricingPlan: (id, data) => apiPut(`/api/saas/landing/admin/pricing/${id}`, data),
            deletePricingPlan: (id) => apiDelete(`/api/saas/landing/admin/pricing/${id}`),
            togglePricingPlan: (id) => apiPost(`/api/saas/landing/admin/pricing/${id}/toggle`),

            // ─────────────────────────────────────────────────────────────────
            // Admin Endpoints - Testimonials (آراء العملاء)
            // ─────────────────────────────────────────────────────────────────
            getTestimonials: () => apiGet('/api/saas/landing/admin/testimonials'),
            getTestimonial: (id) => apiGet(`/api/saas/landing/admin/testimonials/${id}`),
            createTestimonial: (data) => apiPost('/api/saas/landing/admin/testimonials', data),
            updateTestimonial: (id, data) => apiPut(`/api/saas/landing/admin/testimonials/${id}`, data),
            deleteTestimonial: (id) => apiDelete(`/api/saas/landing/admin/testimonials/${id}`),
            toggleTestimonial: (id) => apiPost(`/api/saas/landing/admin/testimonials/${id}/toggle`),

            // ─────────────────────────────────────────────────────────────────
            // Admin Endpoints - FAQs (الأسئلة الشائعة)
            // ─────────────────────────────────────────────────────────────────
            getFAQs: () => apiGet('/api/saas/landing/admin/faqs'),
            getFAQ: (id) => apiGet(`/api/saas/landing/admin/faqs/${id}`),
            createFAQ: (data) => apiPost('/api/saas/landing/admin/faqs', data),
            updateFAQ: (id, data) => apiPut(`/api/saas/landing/admin/faqs/${id}`, data),
            deleteFAQ: (id) => apiDelete(`/api/saas/landing/admin/faqs/${id}`),
            toggleFAQ: (id) => apiPost(`/api/saas/landing/admin/faqs/${id}/toggle`),
            reorderFAQs: (data) => apiPost('/api/saas/landing/admin/faqs/reorder', data),

            // ─────────────────────────────────────────────────────────────────
            // Admin Endpoints - Stats (الإحصائيات)
            // ─────────────────────────────────────────────────────────────────
            getStats: () => apiGet('/api/saas/landing/admin/stats'),
            getStat: (id) => apiGet(`/api/saas/landing/admin/stats/${id}`),
            createStat: (data) => apiPost('/api/saas/landing/admin/stats', data),
            updateStat: (id, data) => apiPut(`/api/saas/landing/admin/stats/${id}`, data),
            deleteStat: (id) => apiDelete(`/api/saas/landing/admin/stats/${id}`),
            toggleStat: (id) => apiPost(`/api/saas/landing/admin/stats/${id}/toggle`),

            // ─────────────────────────────────────────────────────────────────
            // Admin Endpoints - Partners (الشركاء)
            // ─────────────────────────────────────────────────────────────────
            getPartners: () => apiGet('/api/saas/landing/admin/partners'),
            getPartner: (id) => apiGet(`/api/saas/landing/admin/partners/${id}`),
            createPartner: (data) => apiPost('/api/saas/landing/admin/partners', data),
            updatePartner: (id, data) => apiPut(`/api/saas/landing/admin/partners/${id}`, data),
            deletePartner: (id) => apiDelete(`/api/saas/landing/admin/partners/${id}`),
            togglePartner: (id) => apiPost(`/api/saas/landing/admin/partners/${id}/toggle`),

            // ─────────────────────────────────────────────────────────────────
            // Admin Endpoints - Contact Requests (طلبات التواصل)
            // ─────────────────────────────────────────────────────────────────
            getContactRequests: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/saas/landing/admin/contacts${query ? `?${query}` : ''}`);
            },
            getContactRequest: (id) => apiGet(`/api/saas/landing/admin/contacts/${id}`),
            updateContactStatus: (id, data) => apiPut(`/api/saas/landing/admin/contacts/${id}/status`, data),
            deleteContactRequest: (id) => apiDelete(`/api/saas/landing/admin/contacts/${id}`),
            getContactStats: () => apiGet('/api/saas/landing/admin/contacts/stats'),

            // ─────────────────────────────────────────────────────────────────
            // Admin Endpoints - Settings (الإعدادات)
            // ─────────────────────────────────────────────────────────────────
            getSettings: () => apiGet('/api/saas/landing/admin/settings'),
            updateSetting: (key, value) => apiPut(`/api/saas/landing/admin/settings/${key}`, { value }),
            updateSettings: (settings) => {
                // تحديث عدة إعدادات دفعة واحدة
                const promises = Object.entries(settings).map(([key, value]) =>
                    apiPut(`/api/saas/landing/admin/settings/${key}`, { value: String(value) })
                );
                return Promise.all(promises);
            },
        },
    },

    // ==========================================
    // Agents - نظام الوكلاء الذكيين
    // ==========================================
    agents: {
        // Dashboard
        getDashboard: () => agentsFetch('/api/agents/dashboard'),

        // Agents - الوكلاء
        getAgents: () => agentsFetch('/api/agents'),
        getActiveAgents: () => agentsFetch('/api/agents/active'),
        getAgent: (id) => agentsFetch(`/api/agents/${id}`),
        getAgentByCode: (code) => agentsFetch(`/api/agents/code/${code}`),
        getAgentsByTeam: (team) => agentsFetch(`/api/agents/team/${encodeURIComponent(team)}`),
        createAgent: (data) => agentsFetch('/api/agents', { method: 'POST', body: JSON.stringify(data) }),
        updateAgent: (id, data) => agentsFetch(`/api/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        activateAgent: (id) => agentsFetch(`/api/agents/${id}/activate`, { method: 'POST' }),
        deactivateAgent: (id) => agentsFetch(`/api/agents/${id}/deactivate`, { method: 'POST' }),
        deleteAgent: (id) => agentsFetch(`/api/agents/${id}`, { method: 'DELETE' }),

        // Tasks - المهام (via /api/agents/tasks route)
        getTasks: () => agentsFetch('/api/agents/tasks'),
        getTask: (id) => agentsFetch(`/api/agents/tasks?id=${id}`),
        getTasksByAgent: (agentId) => agentsFetch(`/api/agents/tasks?agentId=${encodeURIComponent(agentId)}`),
        getTasksByStatus: (status) => agentsFetch(`/api/agents/tasks?status=${encodeURIComponent(status)}`),
        getTasksByPriority: (priority) => agentsFetch(`/api/agents/tasks?priority=${encodeURIComponent(priority)}`),
        getOverdueTasks: () => agentsFetch('/api/agents/tasks?filter=overdue'),
        getUpcomingTasks: (days = 7) => agentsFetch(`/api/agents/tasks?filter=upcoming&days=${days}`),
        createTask: (data) => agentsFetch('/api/agents/tasks', { method: 'POST', body: JSON.stringify(data) }),
        updateTask: (id, data) => agentsFetch('/api/agents/tasks', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
        updateTaskStatus: (id, status) => agentsFetch('/api/agents/tasks', { method: 'PUT', body: JSON.stringify({ id, status }) }),
        updateTaskProgress: (id, progress) => agentsFetch('/api/agents/tasks', { method: 'PUT', body: JSON.stringify({ id, progress }) }),
        startTask: (id) => agentsFetch(`/api/agents/tasks/${id}`, { method: 'POST', body: JSON.stringify({ action: 'start' }) }),
        completeTask: (id, result) => agentsFetch(`/api/agents/tasks/${id}`, { method: 'POST', body: JSON.stringify({ action: 'complete', result }) }),
        cancelTask: (id) => agentsFetch(`/api/agents/tasks/${id}`, { method: 'POST', body: JSON.stringify({ action: 'cancel' }) }),
        deleteTask: (id) => agentsFetch(`/api/agents/tasks?id=${id}`, { method: 'DELETE' }),

        // Commands - أوامر الوكلاء
        executeCommand: (agentId, command) => agentsFetch(`/api/agents/${agentId}/command`, { method: 'POST', body: JSON.stringify({ command }) }),
        startAllAgents: () => agentsFetch('/api/agents/start-all', { method: 'POST' }),
        stopAllAgents: () => agentsFetch('/api/agents/stop-all', { method: 'POST' }),
    },

    // ==========================================
    // Finance - الإدارة المالية
    // ==========================================
    finance: {
        // Dashboard
        getDashboardSummary: () => apiGet(API.FINANCE.DASHBOARD_SUMMARY),

        // ==========================================
        // General Ledger - الأستاذ العام
        // ==========================================
        gl: {
            // شجرة الحسابات
            getAccounts: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.GL.ACCOUNTS}${query ? `?${query}` : ''}`);
            },
            getAccount: (id) => apiGet(API.FINANCE.GL.ACCOUNT_BY_ID(id)),
            getAccountsTree: () => apiGet(API.FINANCE.GL.ACCOUNTS_TREE),
            getAccountChildren: (id) => apiGet(API.FINANCE.GL.ACCOUNT_CHILDREN(id)),
            createAccount: (data) => apiPost(API.FINANCE.GL.ACCOUNTS, data),
            updateAccount: (id, data) => apiPut(API.FINANCE.GL.ACCOUNT_BY_ID(id), data),
            deleteAccount: (id) => apiDelete(API.FINANCE.GL.ACCOUNT_BY_ID(id)),
            getAccountStatement: (id, params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.GL.ACCOUNT_STATEMENT(id)}${query ? `?${query}` : ''}`);
            },

            // القيود اليومية
            getJournals: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.GL.JOURNALS}${query ? `?${query}` : ''}`);
            },
            getJournal: (id) => apiGet(API.FINANCE.GL.JOURNAL_BY_ID(id)),
            createJournal: (data) => apiPost(API.FINANCE.GL.JOURNALS, data),
            updateJournal: (id, data) => apiPut(API.FINANCE.GL.JOURNAL_BY_ID(id), data),
            deleteJournal: (id) => apiDelete(API.FINANCE.GL.JOURNAL_BY_ID(id)),
            postJournal: (id) => apiPost(API.FINANCE.GL.JOURNAL_POST(id)),
            reverseJournal: (id, data) => apiPost(API.FINANCE.GL.JOURNAL_REVERSE(id), data),

            // الفترات المحاسبية
            getPeriods: (fiscalYear) => apiGet(`${API.FINANCE.GL.PERIODS}${fiscalYear ? `?fiscalYear=${fiscalYear}` : ''}`),
            getPeriod: (id) => apiGet(API.FINANCE.GL.PERIOD_BY_ID(id)),
            createPeriod: (data) => apiPost(API.FINANCE.GL.PERIODS, data),
            openPeriod: (id) => apiPost(API.FINANCE.GL.PERIOD_OPEN(id)),
            closePeriod: (id) => apiPost(API.FINANCE.GL.PERIOD_CLOSE(id)),

            // مراكز التكلفة
            getCostCenters: () => apiGet(API.FINANCE.GL.COST_CENTERS),
            getCostCenter: (id) => apiGet(API.FINANCE.GL.COST_CENTER_BY_ID(id)),
            createCostCenter: (data) => apiPost(API.FINANCE.GL.COST_CENTERS, data),
            updateCostCenter: (id, data) => apiPut(API.FINANCE.GL.COST_CENTER_BY_ID(id), data),
            deleteCostCenter: (id) => apiDelete(API.FINANCE.GL.COST_CENTER_BY_ID(id)),

            // التقارير
            getTrialBalance: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.GL.TRIAL_BALANCE}${query ? `?${query}` : ''}`);
            },
            getIncomeStatement: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.GL.INCOME_STATEMENT}${query ? `?${query}` : ''}`);
            },
            getBalanceSheet: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.GL.BALANCE_SHEET}${query ? `?${query}` : ''}`);
            },

            // دفتر الأستاذ
            getLedger: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.GL.LEDGER}${query ? `?${query}` : ''}`);
            },

            // تقرير القيود
            getJournalReport: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.GL.JOURNAL_REPORT}${query ? `?${query}` : ''}`);
            },
        },

        // ==========================================
        // Budget - الموازنة
        // ==========================================
        budget: {
            // الموازنات
            getBudgets: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.BUDGET.BUDGETS}${query ? `?${query}` : ''}`);
            },
            getBudget: (id) => apiGet(API.FINANCE.BUDGET.BUDGET_BY_ID(id)),
            createBudget: (data) => apiPost(API.FINANCE.BUDGET.BUDGETS, data),
            updateBudget: (id, data) => apiPut(API.FINANCE.BUDGET.BUDGET_BY_ID(id), data),
            deleteBudget: (id) => apiDelete(API.FINANCE.BUDGET.BUDGET_BY_ID(id)),
            approveBudget: (id) => apiPost(API.FINANCE.BUDGET.BUDGET_APPROVE(id)),
            getBudgetLines: (id) => apiGet(API.FINANCE.BUDGET.BUDGET_LINES(id)),
            addBudgetLine: (id, data) => apiPost(API.FINANCE.BUDGET.BUDGET_LINES(id), data),
            checkAvailability: (data) => apiPost(API.FINANCE.BUDGET.BUDGET_AVAILABILITY, data),

            // الارتباطات
            getEncumbrances: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.BUDGET.ENCUMBRANCES}${query ? `?${query}` : ''}`);
            },
            getEncumbrance: (id) => apiGet(API.FINANCE.BUDGET.ENCUMBRANCE_BY_ID(id)),
            createEncumbrance: (data) => apiPost(API.FINANCE.BUDGET.ENCUMBRANCES, data),
            consumeEncumbrance: (id, data) => apiPost(API.FINANCE.BUDGET.ENCUMBRANCE_CONSUME(id), data),
            releaseEncumbrance: (id, data) => apiPost(API.FINANCE.BUDGET.ENCUMBRANCE_RELEASE(id), data),

            // المناقلات
            getTransfers: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.BUDGET.TRANSFERS}${query ? `?${query}` : ''}`);
            },
            getTransfer: (id) => apiGet(API.FINANCE.BUDGET.TRANSFER_BY_ID(id)),
            createTransfer: (data) => apiPost(API.FINANCE.BUDGET.TRANSFERS, data),
            approveTransfer: (id) => apiPost(API.FINANCE.BUDGET.TRANSFER_APPROVE(id)),

            // التقارير
            getExecutionReport: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.BUDGET.EXECUTION_REPORT}${query ? `?${query}` : ''}`);
            },
        },

        // ==========================================
        // محفظة التعزيزات المالية - Wallet
        // ==========================================
        wallet: {
            get: () => apiGet(API.FINANCE.WALLET.BASE),
            getTransactions: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.WALLET.TRANSACTIONS}${query ? `?${query}` : ''}`);
            },
            commit: (data) => apiPost(API.FINANCE.WALLET.COMMIT, data),
            release: (txnId) => apiPost(API.FINANCE.WALLET.RELEASE(txnId)),
            topUp: (data) => apiPost(API.FINANCE.WALLET.TOPUP, data),
            getSettings: () => apiGet(API.FINANCE.WALLET.SETTINGS),
            updateSettings: (data) => apiPut(API.FINANCE.WALLET.SETTINGS, data),
            getSummary: () => apiGet(API.FINANCE.WALLET.SUMMARY),
            checkAvailability: (amount) => apiPost(API.FINANCE.WALLET.CHECK_AVAILABILITY, { amount }),
            canIssueDecision: (amount) => apiPost(API.FINANCE.WALLET.CAN_ISSUE_DECISION, { amount }),
        },

        // ==========================================
        // Accounts Payable - الذمم الدائنة
        // ==========================================
        ap: {
            // الموردون
            getVendors: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.AP.VENDORS}${query ? `?${query}` : ''}`);
            },
            getVendor: (id) => apiGet(API.FINANCE.AP.VENDOR_BY_ID(id)),
            createVendor: (data) => apiPost(API.FINANCE.AP.VENDORS, data),
            updateVendor: (id, data) => apiPut(API.FINANCE.AP.VENDOR_BY_ID(id), data),
            deleteVendor: (id) => apiDelete(API.FINANCE.AP.VENDOR_BY_ID(id)),
            getVendorStatement: (id, params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.AP.VENDOR_STATEMENT(id)}${query ? `?${query}` : ''}`);
            },

            // الفواتير
            getInvoices: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.AP.INVOICES}${query ? `?${query}` : ''}`);
            },
            getInvoice: (id) => apiGet(API.FINANCE.AP.INVOICE_BY_ID(id)),
            createInvoice: (data) => apiPost(API.FINANCE.AP.INVOICES, data),
            updateInvoice: (id, data) => apiPut(API.FINANCE.AP.INVOICE_BY_ID(id), data),
            deleteInvoice: (id) => apiDelete(API.FINANCE.AP.INVOICE_BY_ID(id)),
            matchInvoice: (id, data) => apiPost(API.FINANCE.AP.INVOICE_MATCH(id), data),
            approveInvoice: (id) => apiPost(API.FINANCE.AP.INVOICE_APPROVE(id)),

            // الدفعات
            getPayments: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.AP.PAYMENTS}${query ? `?${query}` : ''}`);
            },
            getPayment: (id) => apiGet(API.FINANCE.AP.PAYMENT_BY_ID(id)),
            createPayment: (data) => apiPost(API.FINANCE.AP.PAYMENTS, data),
            approvePayment: (id, level) => apiPost(API.FINANCE.AP.PAYMENT_APPROVE(id, level)),
            executePayment: (id) => apiPost(API.FINANCE.AP.PAYMENT_EXECUTE(id)),

            // التقارير
            getAgingReport: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.AP.AGING_REPORT}${query ? `?${query}` : ''}`);
            },
        },

        // ==========================================
        // Procurement - المشتريات
        // ==========================================
        procurement: {
            // طلبات الشراء
            getRequests: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.PROCUREMENT.REQUESTS}${query ? `?${query}` : ''}`);
            },
            getRequest: (id) => apiGet(API.FINANCE.PROCUREMENT.REQUEST_BY_ID(id)),
            createRequest: (data) => apiPost(API.FINANCE.PROCUREMENT.REQUESTS, data),
            updateRequest: (id, data) => apiPut(API.FINANCE.PROCUREMENT.REQUEST_BY_ID(id), data),
            deleteRequest: (id) => apiDelete(API.FINANCE.PROCUREMENT.REQUEST_BY_ID(id)),
            submitRequest: (id) => apiPost(API.FINANCE.PROCUREMENT.REQUEST_SUBMIT(id)),
            approveRequest: (id, level) => apiPost(API.FINANCE.PROCUREMENT.REQUEST_APPROVE(id, level)),
            rejectRequest: (id, reason) => apiPost(API.FINANCE.PROCUREMENT.REQUEST_REJECT(id), { reason }),

            // أوامر الشراء
            getOrders: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.PROCUREMENT.ORDERS}${query ? `?${query}` : ''}`);
            },
            getOrder: (id) => apiGet(API.FINANCE.PROCUREMENT.ORDER_BY_ID(id)),
            createOrder: (data) => apiPost(API.FINANCE.PROCUREMENT.ORDERS, data),
            updateOrder: (id, data) => apiPut(API.FINANCE.PROCUREMENT.ORDER_BY_ID(id), data),
            issueOrder: (id) => apiPost(API.FINANCE.PROCUREMENT.ORDER_ISSUE(id)),
            createOrderFromRequest: (prId) => apiPost(API.FINANCE.PROCUREMENT.ORDER_FROM_REQUEST(prId)),

            // العقود
            getContracts: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.PROCUREMENT.CONTRACTS}${query ? `?${query}` : ''}`);
            },
            getContract: (id) => apiGet(API.FINANCE.PROCUREMENT.CONTRACT_BY_ID(id)),
            createContract: (data) => apiPost(API.FINANCE.PROCUREMENT.CONTRACTS, data),
            updateContract: (id, data) => apiPut(API.FINANCE.PROCUREMENT.CONTRACT_BY_ID(id), data),
            getContractMilestones: (id) => apiGet(API.FINANCE.PROCUREMENT.CONTRACT_MILESTONES(id)),
            updateContractProgress: (id, data) => apiPut(API.FINANCE.PROCUREMENT.CONTRACT_PROGRESS(id), data),

            // استلام البضائع
            getGoodsReceipts: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.PROCUREMENT.GOODS_RECEIPTS}${query ? `?${query}` : ''}`);
            },
            getGoodsReceipt: (id) => apiGet(API.FINANCE.PROCUREMENT.GOODS_RECEIPT_BY_ID(id)),
            createGoodsReceipt: (data) => apiPost(API.FINANCE.PROCUREMENT.GOODS_RECEIPTS, data),
        },

        // ==========================================
        // Treasury - الخزينة
        // ==========================================
        treasury: {
            // الحسابات البنكية
            getBankAccounts: () => apiGet(API.FINANCE.TREASURY.BANK_ACCOUNTS),
            getBankAccount: (id) => apiGet(API.FINANCE.TREASURY.BANK_ACCOUNT_BY_ID(id)),
            createBankAccount: (data) => apiPost(API.FINANCE.TREASURY.BANK_ACCOUNTS, data),
            updateBankAccount: (id, data) => apiPut(API.FINANCE.TREASURY.BANK_ACCOUNT_BY_ID(id), data),
            deleteBankAccount: (id) => apiDelete(API.FINANCE.TREASURY.BANK_ACCOUNT_BY_ID(id)),
            getBankStatement: (id, params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.TREASURY.BANK_ACCOUNT_STATEMENT(id)}${query ? `?${query}` : ''}`);
            },

            // الحركات البنكية
            getTransactions: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.TREASURY.TRANSACTIONS}${query ? `?${query}` : ''}`);
            },
            getTransaction: (id) => apiGet(API.FINANCE.TREASURY.TRANSACTION_BY_ID(id)),
            createTransaction: (data) => apiPost(API.FINANCE.TREASURY.TRANSACTIONS, data),

            // التسويات البنكية
            getReconciliations: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.TREASURY.RECONCILIATIONS}${query ? `?${query}` : ''}`);
            },
            getReconciliation: (id) => apiGet(API.FINANCE.TREASURY.RECONCILIATION_BY_ID(id)),
            createReconciliation: (data) => apiPost(API.FINANCE.TREASURY.RECONCILIATIONS, data),
            getReconciliationItems: (id) => apiGet(API.FINANCE.TREASURY.RECONCILIATION_ITEMS(id)),
            reconcileItem: (reconciliationId, itemId) =>
                apiPost(API.FINANCE.TREASURY.RECONCILIATION_RECONCILE(reconciliationId, itemId)),

            // المركز النقدي
            getCashPosition: () => apiGet(API.FINANCE.TREASURY.CASH_POSITION),
            getCashForecast: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.TREASURY.CASH_FORECAST}${query ? `?${query}` : ''}`);
            },
        },

        // ==========================================
        // Fixed Assets - الأصول الثابتة
        // ==========================================
        assets: {
            // الأصول
            getAssets: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.ASSETS.LIST}${query ? `?${query}` : ''}`);
            },
            getAsset: (id) => apiGet(API.FINANCE.ASSETS.BY_ID(id)),
            createAsset: (data) => apiPost(API.FINANCE.ASSETS.LIST, data),
            updateAsset: (id, data) => apiPut(API.FINANCE.ASSETS.BY_ID(id), data),
            deleteAsset: (id) => apiDelete(API.FINANCE.ASSETS.BY_ID(id)),

            // التصنيفات
            getCategories: () => apiGet(API.FINANCE.ASSETS.CATEGORIES),
            getCategory: (id) => apiGet(API.FINANCE.ASSETS.CATEGORY_BY_ID(id)),
            createCategory: (data) => apiPost(API.FINANCE.ASSETS.CATEGORIES, data),
            updateCategory: (id, data) => apiPut(API.FINANCE.ASSETS.CATEGORY_BY_ID(id), data),

            // الإهلاك
            getDepreciation: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.ASSETS.DEPRECIATION}${query ? `?${query}` : ''}`);
            },
            runDepreciation: (data) => apiPost(API.FINANCE.ASSETS.DEPRECIATION_RUN, data),
            getDepreciationSchedule: (assetId) => apiGet(API.FINANCE.ASSETS.DEPRECIATION_SCHEDULE(assetId)),

            // الاستبعاد
            disposeAsset: (id, data) => apiPost(API.FINANCE.ASSETS.DISPOSE(id), data),
        },

        // ==========================================
        // Reports - التقارير
        // ==========================================
        reports: {
            getFinancialSummary: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.REPORTS.FINANCIAL_SUMMARY}${query ? `?${query}` : ''}`);
            },
            getBudgetVsActual: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.REPORTS.BUDGET_VS_ACTUAL}${query ? `?${query}` : ''}`);
            },
            getCashFlow: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.REPORTS.CASH_FLOW}${query ? `?${query}` : ''}`);
            },
        },

        // ==========================================
        // Warehouse Integration - تكامل المستودعات مع المالية
        // ==========================================
        warehouseIntegration: {
            // التأثير المالي لطلبات الصرف
            calculateExchangeImpact: (data) => apiPost('/api/finance/warehouse/exchange-impact', data),

            // قيود اليومية التلقائية
            createJournalFromExchange: (exchangeRequestId) =>
                apiPost('/api/finance/warehouse/journal-from-exchange', { exchangeRequestId }),
            createJournalFromReceipt: (receiptNoteId) =>
                apiPost('/api/finance/warehouse/journal-from-receipt', { receiptNoteId }),
            createJournalFromCustody: (custodyId, action) =>
                apiPost('/api/finance/warehouse/journal-from-custody', { custodyId, action }),
            previewJournalEntry: (data) =>
                apiPost('/api/finance/warehouse/journal-preview', data),

            // فحص الميزانية
            checkBudgetAvailability: (data) =>
                apiPost(API.FINANCE.BUDGET_CHECK, data),
            getBudgetImpact: (data) =>
                apiPost('/api/finance/warehouse/budget-impact', data),
            getBudgetItemBalance: (budgetItemCode) =>
                apiGet(API.FINANCE.BUDGET_BY_ITEM(budgetItemCode)),
            getBudgetItems: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.BUDGET_ITEMS}${query ? `?${query}` : ''}`);
            },

            // دليل الحسابات الموحد للجهات الحكومية
            getChartOfAccounts: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.FINANCE.CHART_OF_ACCOUNTS}${query ? `?${query}` : ''}`);
            },
            getAccountByCode: (code) => apiGet(API.FINANCE.ACCOUNT_BY_CODE(code)),
            getInventoryAccounts: () => apiGet('/api/finance/chart-of-accounts?category=inventory'),
            getExpenseAccounts: () => apiGet('/api/finance/chart-of-accounts?category=expense'),

            // تصنيفات المخزون المالية
            getInventoryCategories: () => apiGet('/api/finance/warehouse/inventory-categories'),
            mapCategoryToAccount: (categoryId, accountCode, budgetItem) =>
                apiPost('/api/finance/warehouse/category-mapping', { categoryId, accountCode, budgetItem }),
            getCategoryMapping: (categoryId) =>
                apiGet(`/api/finance/warehouse/category-mapping/${categoryId}`),

            // التقارير المالية للمخزون
            getInventoryValuation: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/finance/warehouse/inventory-valuation${query ? `?${query}` : ''}`);
            },
            getInventoryMovementReport: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/finance/warehouse/movement-report${query ? `?${query}` : ''}`);
            },
            getBudgetUtilizationByCategory: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/finance/warehouse/budget-utilization${query ? `?${query}` : ''}`);
            },

            // مطابقة القيود
            reconcileInventoryWithGL: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/finance/warehouse/reconciliation${query ? `?${query}` : ''}`);
            },
            getDiscrepancies: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`/api/finance/warehouse/discrepancies${query ? `?${query}` : ''}`);
            },
        },
    },

    reports: {
        // Fixed Assets Reports
        getDepreciationReport: (year) => apiGet(`/api/reports/depreciation${year ? `?year=${year}` : ''}`),
        getAssetsSummary: () => apiGet('/api/reports/assets/summary'),
        getAssetsbyCategory: () => apiGet('/api/reports/assets/by-category'),
        getAssetsNearingFullDepreciation: () => apiGet('/api/reports/assets/nearing-full-depreciation'),

        // Custody Reports
        getCustodyReport: () => apiGet('/api/reports/custody'),
        getCustodyByEmployee: (employeeId) => apiGet(`/api/reports/custody/employee/${employeeId}`),
        getCustodyByDepartment: (departmentId) => apiGet(`/api/reports/custody/department/${departmentId}`),
        getPendingCustodyTransfers: () => apiGet('/api/reports/custody/pending-transfers'),

        // Movement Reports
        getMovementReport: (startDate, endDate) => {
            let url = '/api/reports/movement'
            if (startDate && endDate) {
                url += `?startDate=${startDate}&endDate=${endDate}`
            }
            return apiGet(url)
        },
        getVehicleUtilization: () => apiGet('/api/reports/movement/utilization'),
        getFuelConsumption: (startDate, endDate) => {
            let url = '/api/reports/movement/fuel-consumption'
            if (startDate && endDate) {
                url += `?startDate=${startDate}&endDate=${endDate}`
            }
            return apiGet(url)
        },
        getMaintenanceCosts: (year) => apiGet(`/api/reports/movement/maintenance-costs${year ? `?year=${year}` : ''}`),

        // Archiving Reports
        getArchivingReport: () => apiGet('/api/reports/archiving'),
        getRetentionReport: () => apiGet('/api/reports/archiving/retention'),
        getSecurityLevelReport: () => apiGet('/api/reports/archiving/security-levels'),
    },

    // ==========================================
    // AI Monitoring - نظام المراقبة الذكي
    // ==========================================
    aiMonitor: {
        // Service Status
        getStatus: () => safeFetchJson('/api/ai'),
        startService: () => safeFetchJson('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'start' })
        }),
        stopService: () => safeFetchJson('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'stop' })
        }),

        // Scanning
        runScan: () => safeFetchJson('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'scan' })
        }),
        runSpecificScan: (checkType) => safeFetchJson('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'scan-specific', checkType })
        }),

        // Issues
        getIssues: (filters = {}) => {
            const params = new URLSearchParams(filters).toString();
            return safeFetchJson(`/api/ai/issues${params ? `?${params}` : ''}`);
        },
        previewFix: (issueId) => safeFetchJson('/api/ai/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'preview-fix', issueId })
        }),
        applyFix: (issueId) => safeFetchJson('/api/ai/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'apply-fix', issueId })
        }),
        rollbackFix: (issueId) => safeFetchJson('/api/ai/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'rollback', issueId })
        }),
        dismissIssue: (issueId) => safeFetchJson('/api/ai/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'dismiss', issueId })
        }),
        batchFix: (issueIds) => safeFetchJson('/api/ai/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'batch-fix', issueIds })
        }),

        // Confirmations
        processConfirmation: (confirmationId, confirmAction, userId) => safeFetchJson('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'confirm', confirmationId, confirmAction, userId })
        }),

        // Reports
        sendDailyReport: () => safeFetchJson('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send-report' })
        }),

        // Configuration
        updateConfig: (config) => safeFetchJson('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update-config', config })
        }),
    },

    // ==========================================
    // ITSM - الدعم الفني
    // ==========================================
    itsm: {
        // Dashboard
        getDashboardSummary: () => apiGet(API.ITSM.DASHBOARD_SUMMARY),

        // ==========================================
        // Tickets - التذاكر
        // ==========================================
        tickets: {
            // التذاكر
            getAll: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.ITSM.TICKETS.LIST}${query ? `?${query}` : ''}`);
            },
            getById: (id) => apiGet(API.ITSM.TICKETS.BY_ID(id)),
            getMyTickets: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.ITSM.TICKETS.MY_TICKETS}${query ? `?${query}` : ''}`);
            },
            getAssigned: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.ITSM.TICKETS.ASSIGNED}${query ? `?${query}` : ''}`);
            },
            getPending: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.ITSM.TICKETS.PENDING}${query ? `?${query}` : ''}`);
            },
            getByStatus: (status, params = {}) => {
                const query = new URLSearchParams({ ...params, status }).toString();
                return apiGet(`${API.ITSM.TICKETS.LIST}?${query}`);
            },
            getByPriority: (priority, params = {}) => {
                const query = new URLSearchParams({ ...params, priority }).toString();
                return apiGet(`${API.ITSM.TICKETS.LIST}?${query}`);
            },
            getByCategory: (categoryId, params = {}) => {
                const query = new URLSearchParams({ ...params, categoryId }).toString();
                return apiGet(`${API.ITSM.TICKETS.LIST}?${query}`);
            },
            create: (data) => apiPost(API.ITSM.TICKETS.LIST, data),
            update: (id, data) => apiPut(API.ITSM.TICKETS.BY_ID(id), data),
            delete: (id) => apiDelete(API.ITSM.TICKETS.BY_ID(id)),

            // إجراءات التذاكر
            assign: (id, specialistId) => apiPost(API.ITSM.TICKETS.ASSIGN(id), { specialistId }),
            start: (id) => apiPost(API.ITSM.TICKETS.START(id)),
            resolve: (id, resolution) => apiPost(API.ITSM.TICKETS.RESOLVE(id), { resolution }),
            close: (id, feedback) => apiPost(API.ITSM.TICKETS.CLOSE(id), { feedback }),
            reopen: (id, reason) => apiPost(API.ITSM.TICKETS.REOPEN(id), { reason }),
            escalate: (id, reason) => apiPost(API.ITSM.TICKETS.ESCALATE(id), { reason }),

            // التعليقات والمرفقات
            getComments: (ticketId) => apiGet(API.ITSM.TICKETS.COMMENTS(ticketId)),
            addComment: (ticketId, data) => apiPost(API.ITSM.TICKETS.COMMENTS(ticketId), data),
            getAttachments: (ticketId) => apiGet(API.ITSM.TICKETS.ATTACHMENTS(ticketId)),
            addAttachment: (ticketId, file) => {
                const formData = new FormData();
                formData.append('file', file);
                return safeFetchJson(`${API.ITSM.TICKETS.ATTACHMENTS(ticketId)}`, {
                    method: 'POST',
                    body: formData,
                });
            },

            // سجل التذكرة
            getHistory: (ticketId) => apiGet(API.ITSM.TICKETS.HISTORY(ticketId)),
        },

        // ==========================================
        // Assets - الأصول/العهد
        // ==========================================
        assets: {
            getAll: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.ITSM.ASSETS.LIST}${query ? `?${query}` : ''}`);
            },
            getById: (id) => apiGet(API.ITSM.ASSETS.BY_ID(id)),
            getMyAssets: () => apiGet(API.ITSM.ASSETS.MY_ASSETS),
            getByEmployee: (employeeId) => apiGet(API.ITSM.ASSETS.BY_EMPLOYEE(employeeId)),
            create: (data) => apiPost(API.ITSM.ASSETS.LIST, data),
            update: (id, data) => apiPut(API.ITSM.ASSETS.BY_ID(id), data),
            delete: (id) => apiDelete(API.ITSM.ASSETS.BY_ID(id)),

            // حالة الأصل
            changeStatus: (id, status) => apiPost(API.ITSM.ASSETS.STATUS(id), { status }),

            // تاريخ الصيانة
            getMaintenanceHistory: (id) => apiGet(API.ITSM.ASSETS.MAINTENANCE(id)),
            addMaintenanceRecord: (id, data) => apiPost(API.ITSM.ASSETS.MAINTENANCE(id), data),
        },

        // ==========================================
        // Categories - التصنيفات
        // ==========================================
        categories: {
            getAll: () => apiGet(API.ITSM.CATEGORIES.LIST),
            getById: (id) => apiGet(API.ITSM.CATEGORIES.BY_ID(id)),
            create: (data) => apiPost(API.ITSM.CATEGORIES.LIST, data),
            update: (id, data) => apiPut(API.ITSM.CATEGORIES.BY_ID(id), data),
            delete: (id) => apiDelete(API.ITSM.CATEGORIES.BY_ID(id)),
        },

        // ==========================================
        // Specialists - فنيي الدعم
        // ==========================================
        specialists: {
            getAll: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.ITSM.SPECIALISTS.LIST}${query ? `?${query}` : ''}`);
            },
            getById: (id) => apiGet(API.ITSM.SPECIALISTS.BY_ID(id)),
            getAvailable: () => apiGet(API.ITSM.SPECIALISTS.AVAILABLE),
            create: (data) => apiPost(API.ITSM.SPECIALISTS.LIST, data),
            update: (id, data) => apiPut(API.ITSM.SPECIALISTS.BY_ID(id), data),
            delete: (id) => apiDelete(API.ITSM.SPECIALISTS.BY_ID(id)),

            // التخصصات
            getSpecialties: (id) => apiGet(API.ITSM.SPECIALISTS.SPECIALTIES(id)),
            updateSpecialties: (id, specialties) => apiPut(API.ITSM.SPECIALISTS.SPECIALTIES(id), { specialties }),

            // إحصائيات الأداء
            getPerformance: (id, params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.ITSM.SPECIALISTS.PERFORMANCE(id)}${query ? `?${query}` : ''}`);
            },
            getWorkload: (id) => apiGet(API.ITSM.SPECIALISTS.WORKLOAD(id)),
        },

        // ==========================================
        // Reports - التقارير
        // ==========================================
        reports: {
            // إحصائيات عامة
            getStatistics: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.ITSM.REPORTS.STATISTICS}${query ? `?${query}` : ''}`);
            },

            // تقارير الأداء
            getPerformanceReport: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.ITSM.REPORTS.PERFORMANCE}${query ? `?${query}` : ''}`);
            },

            // تقارير SLA
            getSLAReport: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.ITSM.REPORTS.SLA}${query ? `?${query}` : ''}`);
            },

            // تقارير التصنيفات
            getCategoryReport: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.ITSM.REPORTS.BY_CATEGORY}${query ? `?${query}` : ''}`);
            },

            // تقارير الأصول
            getAssetsReport: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return apiGet(`${API.ITSM.REPORTS.ASSETS}${query ? `?${query}` : ''}`);
            },
        },

        // ==========================================
        // Settings - الإعدادات
        // ==========================================
        settings: {
            getAll: () => apiGet(API.ITSM.SETTINGS.ALL),
            get: (key) => apiGet(API.ITSM.SETTINGS.BY_KEY(key)),
            update: (key, value) => apiPut(API.ITSM.SETTINGS.BY_KEY(key), { value }),

            // إعدادات الأولويات
            getPriorities: () => apiGet(API.ITSM.SETTINGS.PRIORITIES),
            updatePriorities: (data) => apiPut(API.ITSM.SETTINGS.PRIORITIES, data),

            // إعدادات SLA
            getSLASettings: () => apiGet(API.ITSM.SETTINGS.SLA),
            updateSLASettings: (data) => apiPut(API.ITSM.SETTINGS.SLA, data),
        },

        // ==========================================
        // Quick Support - دعم سريع للموظفين
        // ==========================================
        quickSupport: {
            // إنشاء تذكرة سريعة
            createQuickTicket: (data) => apiPost(API.ITSM.QUICK_SUPPORT.CREATE, data),

            // الحصول على الأصول المتاحة للموظف
            getMyAssetsForSupport: () => apiGet(API.ITSM.QUICK_SUPPORT.MY_ASSETS),

            // الحصول على حالة طلب سابق
            getTicketStatus: (ticketId) => apiGet(API.ITSM.QUICK_SUPPORT.STATUS(ticketId)),

            // تقييم الخدمة
            rateService: (ticketId, rating, feedback) =>
                apiPost(API.ITSM.QUICK_SUPPORT.RATE(ticketId), { rating, feedback }),
        },
    },

    // ==========================================
    // Projects Module - إدارة المشاريع والمهام
    // ==========================================
    projects: {
        // ==========================================
        // Dashboard - لوحة التحكم
        // ==========================================
        getDashboard: (departmentId = null) => {
            const query = departmentId ? `?departmentId=${departmentId}` : '';
            return apiGet(`${API.PROJECTS.DASHBOARD}${query}`);
        },

        // ==========================================
        // Projects - المشاريع
        // ==========================================
        getProjects: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`${API.PROJECTS.LIST}${query ? `?${query}` : ''}`);
        },
        getProject: (id) => apiGet(API.PROJECTS.BY_ID(id)),
        getProjectByCode: (code) => apiGet(API.PROJECTS.BY_CODE(code)),
        createProject: (data) => apiPost(API.PROJECTS.LIST, data),
        updateProject: (id, data) => apiPut(API.PROJECTS.BY_ID(id), data),
        deleteProject: (id) => apiDelete(API.PROJECTS.BY_ID(id)),
        archiveProject: (id) => apiPost(API.PROJECTS.ARCHIVE(id)),
        getProjectsByDepartment: (deptId) => apiGet(API.PROJECTS.BY_DEPARTMENT(deptId)),
        getProjectsByManager: (managerId) => apiGet(API.PROJECTS.BY_MANAGER(managerId)),
        getProjectsByEmployee: (empId) => apiGet(API.PROJECTS.BY_EMPLOYEE(empId)),

        // ==========================================
        // Members - أعضاء المشروع
        // ==========================================
        getProjectMembers: (projectId) => apiGet(API.PROJECTS.MEMBERS(projectId)),
        addProjectMember: (projectId, data) => apiPost(API.PROJECTS.MEMBERS(projectId), data),
        removeProjectMember: (projectId, memberId) =>
            apiDelete(API.PROJECTS.MEMBER_BY_ID(projectId, memberId)),
        updateMemberRole: (projectId, memberId, role) =>
            apiPut(API.PROJECTS.MEMBER_ROLE(projectId, memberId), role),

        // ==========================================
        // Milestones - مراحل المشروع
        // ==========================================
        getMilestones: (projectId) => apiGet(API.PROJECTS.MILESTONES(projectId)),
        createMilestone: (projectId, data) => apiPost(API.PROJECTS.MILESTONES(projectId), data),
        updateMilestone: (milestoneId, data) => apiPut(API.PROJECTS.MILESTONE_BY_ID(milestoneId), data),
        deleteMilestone: (milestoneId) => apiDelete(API.PROJECTS.MILESTONE_BY_ID(milestoneId)),
        completeMilestone: (milestoneId) => apiPost(API.PROJECTS.MILESTONE_COMPLETE(milestoneId)),

        // ==========================================
        // Activities - سجل النشاطات
        // ==========================================
        getActivities: (projectId, take = 50) =>
            apiGet(`${API.PROJECTS.ACTIVITIES(projectId)}?take=${take}`),

        // ==========================================
        // Tasks - المهام
        // ==========================================
        getTasks: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`${API.PROJECTS.TASKS.LIST}${query ? `?${query}` : ''}`);
        },
        getTask: (id) => apiGet(API.PROJECTS.TASKS.BY_ID(id)),
        getTaskByCode: (code) => apiGet(API.PROJECTS.TASKS.BY_CODE(code)),
        createTask: (data) => apiPost(API.PROJECTS.TASKS.LIST, data),
        updateTask: (id, data) => apiPut(API.PROJECTS.TASKS.BY_ID(id), data),
        deleteTask: (id) => apiDelete(API.PROJECTS.TASKS.BY_ID(id)),
        moveTask: (id, data) => apiPost(API.PROJECTS.TASKS.MOVE(id), data),
        completeTask: (id) => apiPost(API.PROJECTS.TASKS.COMPLETE(id)),
        reopenTask: (id) => apiPost(API.PROJECTS.TASKS.REOPEN(id)),

        // Kanban Board
        getKanbanBoard: (projectId) => apiGet(API.PROJECTS.TASKS.KANBAN(projectId)),

        // My Tasks
        getMyTasks: () => apiGet(API.PROJECTS.TASKS.MY_TASKS),
        getOverdueTasks: (projectId = null) => {
            const query = projectId ? `?projectId=${projectId}` : '';
            return apiGet(`${API.PROJECTS.TASKS.OVERDUE}${query}`);
        },
        getUpcomingTasks: (days = 7) => apiGet(`${API.PROJECTS.TASKS.UPCOMING}?days=${days}`),

        // ==========================================
        // Assignments - تكليفات المهام
        // ==========================================
        getTaskAssignments: (taskId) => apiGet(API.PROJECTS.TASKS.ASSIGNMENTS(taskId)),
        assignTask: (taskId, employeeId) => apiPost(API.PROJECTS.TASKS.ASSIGN(taskId, employeeId)),
        unassignTask: (taskId, employeeId) => apiDelete(API.PROJECTS.TASKS.UNASSIGN(taskId, employeeId)),

        // ==========================================
        // Comments - تعليقات المهام
        // ==========================================
        getTaskComments: (taskId) => apiGet(API.PROJECTS.TASKS.COMMENTS(taskId)),
        addComment: (taskId, data) => apiPost(API.PROJECTS.TASKS.COMMENTS(taskId), data),
        updateComment: (commentId, data) => apiPut(API.PROJECTS.TASKS.COMMENT_BY_ID(commentId), data),
        deleteComment: (commentId) => apiDelete(API.PROJECTS.TASKS.COMMENT_BY_ID(commentId)),

        // ==========================================
        // Checklists - قوائم المهام الفرعية
        // ==========================================
        getTaskChecklists: (taskId) => apiGet(API.PROJECTS.TASKS.CHECKLISTS(taskId)),
        addChecklistItem: (taskId, data) => apiPost(API.PROJECTS.TASKS.CHECKLISTS(taskId), data),
        toggleChecklistItem: (checklistId) => apiPost(API.PROJECTS.TASKS.CHECKLIST_TOGGLE(checklistId)),
        deleteChecklistItem: (checklistId) => apiDelete(API.PROJECTS.TASKS.CHECKLIST_BY_ID(checklistId)),

        // ==========================================
        // Time Logs - سجل الوقت
        // ==========================================
        getTaskTimeLogs: (taskId) => apiGet(API.PROJECTS.TASKS.TIMELOGS(taskId)),
        logTime: (taskId, data) => apiPost(API.PROJECTS.TASKS.TIMELOGS(taskId), data),
        getTotalLoggedHours: (taskId) => apiGet(API.PROJECTS.TASKS.TIMELOGS_TOTAL(taskId)),

        // ==========================================
        // Categories - فئات المشاريع
        // ==========================================
        getCategories: () => apiGet(API.PROJECTS.CATEGORIES.LIST),
        getCategory: (id) => apiGet(API.PROJECTS.CATEGORIES.BY_ID(id)),
        createCategory: (data) => apiPost(API.PROJECTS.CATEGORIES.LIST, data),
        updateCategory: (id, data) => apiPut(API.PROJECTS.CATEGORIES.BY_ID(id), data),
        deleteCategory: (id) => apiDelete(API.PROJECTS.CATEGORIES.BY_ID(id)),
    },

    // ==========================================
    // 🤖 AI Services - خدمات الذكاء الاصطناعي
    // ==========================================
    ai: {
        /**
         * تصحيح نص OCR
         * @param {string} text - النص المستخرج من OCR
         * @param {string} language - اللغة (افتراضي: ar)
         * @returns {Promise} نتيجة التصحيح
         */
        correctOCR: async (text, language = 'ar') => {
            return await apiPost('/api/ai/correct-ocr', {
                text,
                language
            });
        },

        /**
         * تصنيف الوثيقة
         * @param {string} text - نص الوثيقة
         * @returns {Promise} نوع الوثيقة والثقة
         */
        classifyDocument: async (text) => {
            return await apiPost('/api/ai/classify-document', {
                text,
                max_length: 1000
            });
        },

        /**
         * استخراج بيانات النموذج
         * @param {string} text - نص النموذج
         * @param {string} formType - نوع النموذج (invoice, exchange_request, etc.)
         * @param {Array} fields - الحقول المطلوبة (اختياري)
         * @returns {Promise} البيانات المستخرجة
         */
        extractFormData: async (text, formType, fields = null) => {
            return await apiPost('/api/ai/extract-form-data', {
                text,
                form_type: formType,
                fields
            });
        },

        /**
         * المحادثة مع المساعد الذكي
         * @param {string} message - رسالة المستخدم
         * @param {object} context - سياق النظام
         * @returns {Promise} رد المساعد
         */
        chat: async (message, context = {}) => {
            return await apiPost('/api/assistant/chat', {
                message,
                context
            });
        },

        /**
         * تحليل فاتورة
         * @param {string} text - نص الفاتورة
         * @returns {Promise} البيانات المستخرجة
         */
        analyzeInvoice: async (text) => {
            return await apiPost('/api/ai/analyze-invoice', { text });
        },

        /**
         * تحليل طلب صرف
         * @param {string} text - نص الطلب
         * @returns {Promise} البيانات المستخرجة
         */
        analyzeExchangeRequest: async (text) => {
            return await apiPost('/api/ai/analyze-exchange-request', { text });
        },

        /**
         * تحليل محضر جرد
         * @param {string} text - نص المحضر
         * @returns {Promise} البيانات المستخرجة
         */
        analyzeInventory: async (text) => {
            return await apiPost('/api/ai/analyze-inventory', { text });
        },

        /**
         * الحصول على أنواع الوثائق المدعومة
         * @returns {Promise} قائمة الأنواع
         */
        getDocumentTypes: async () => {
            return await apiGet('/api/ai/document-types');
        },

        /**
         * الحصول على أنواع النماذج وحقولها
         * @returns {Promise} أنواع النماذج
         */
        getFormTypes: async () => {
            return await apiGet('/api/ai/form-types');
        },

        /**
         * فحص صحة خدمة AI
         * @returns {Promise} حالة الخدمة
         */
        healthCheck: async () => {
            return await apiGet('/api/ai/health');
        },
    },

    // ============================================
    // Notifications - الإشعارات (موحّد)
    // الطرق المحلية (/api/notifications/*) لها الأولوية
    // الطرق الخاصة بالـ Gateway تُستخدم للعمليات غير المتوفرة محلياً
    // ============================================
    notifications: {
        /**
         * جلب إشعارات المستخدم الحالي
         * @param {object} params - فلاتر اختيارية (type, category, isRead, priority, page, pageSize)
         */
        getNotifications: (params = {}) => {
            const qs = new URLSearchParams();
            Object.entries(params).forEach(([k, v]) => { if (v !== null && v !== undefined) qs.set(k, v); });
            const query = qs.toString();
            return apiGet(`/api/notifications${query ? `?${query}` : ''}`);
        },

        /**
         * جلب عدد الإشعارات غير المقروءة
         */
        getUnreadCount: () =>
            apiGet(`/api/notifications/unread-count`),

        /**
         * تحديد إشعار واحد كمقروء
         * @param {number|string} id - معرف الإشعار
         */
        markAsRead: (id) =>
            apiPut(`/api/notifications/${id}`),

        /**
         * تحديد جميع إشعارات المستخدم الحالي كمقروءة
         */
        markAllAsRead: () =>
            apiPost(`/api/notifications/mark-all-read`),

        /**
         * حذف ناعم لإشعار
         * @param {number|string} id - معرف الإشعار
         */
        deleteNotification: (id) =>
            apiDelete(`/api/notifications/${id}`),

        /**
         * إرسال إشعار لمستخدمين محددين أو قسم
         * @param {object} data - بيانات الإشعار (userIds|departmentId, titleAr, messageAr, ...)
         */
        sendNotification: (data) =>
            apiPost(`/api/notifications/send`, data),

        /**
         * alias لـ getNotifications - للتوافق مع الكود القديم
         * @param {number} userId - معرف المستخدم (غير مستخدم - يُستنتج من الجلسة)
         * @param {boolean} unreadOnly - الإشعارات غير المقروءة فقط
         * @param {number} page - رقم الصفحة
         * @param {number} pageSize - حجم الصفحة
         */
        getUserNotifications: (userId, unreadOnly = false, page = 1, pageSize = 20) => {
            const params = { page, pageSize };
            if (unreadOnly) params.isRead = 0;
            const qs = new URLSearchParams(params).toString();
            return apiGet(`/api/notifications?${qs}`);
        },

        /**
         * جلب تفضيلات الإشعارات (Gateway)
         * @param {number} userId - معرف المستخدم
         */
        getPreferences: (userId) =>
            apiGet(`${GATEWAY_URL}/api/authorization/notifications/user/${userId}/preferences`),

        /**
         * حفظ تفضيلات الإشعارات (Gateway)
         * @param {number} userId - معرف المستخدم
         * @param {object} preferences - التفضيلات
         */
        savePreferences: (userId, preferences) =>
            apiPost(`${GATEWAY_URL}/api/authorization/notifications/user/${userId}/preferences`, { preferences }),

        /**
         * إرسال إشعار جماعي (Gateway)
         * @param {object} data - بيانات الإشعار مع قائمة المستخدمين
         */
        sendBulk: (data) =>
            apiPost(`${GATEWAY_URL}/api/authorization/notifications/bulk`, data),

        /**
         * جلب الإشعارات حسب النظام (Gateway)
         * @param {number} userId - معرف المستخدم
         * @param {string} system - اسم النظام
         */
        getBySystem: (userId, system) =>
            apiGet(`${GATEWAY_URL}/api/authorization/notifications/user/${userId}/system/${system}`),
    },

    // ============================================
    // Approvals - الموافقات وسير العمل
    // ============================================
    approvals: {
        /**
         * جلب المهام المعلقة للمستخدم
         * @param {number} userId - معرف المستخدم
         * @param {string} entityType - نوع الكيان (اختياري)
         * @param {number} page - رقم الصفحة
         * @param {number} pageSize - حجم الصفحة
         */
        getPendingTasks: (userId, entityType = null, page = 1, pageSize = 20) => {
            const params = new URLSearchParams({ page, pageSize });
            if (entityType) params.append('entityType', entityType);
            return apiGet(`${GATEWAY_URL}/api/authorization/approval-tasks/pending/${userId}?${params}`);
        },

        /**
         * جلب ملخص المهام للوحة التحكم
         * @param {number} userId - معرف المستخدم
         */
        getTasksSummary: (userId) =>
            apiGet(`${GATEWAY_URL}/api/authorization/approval-tasks/summary/${userId}`),

        /**
         * بدء طلب موافقة جديد
         * @param {object} data - بيانات الطلب
         */
        initiateRequest: (data) =>
            apiPost(`${GATEWAY_URL}/api/authorization/approval-tasks/initiate`, data),

        /**
         * تنفيذ إجراء على طلب (موافقة/رفض/إعادة)
         * @param {object} data - بيانات الإجراء
         */
        processAction: (data) =>
            apiPost(`${GATEWAY_URL}/api/authorization/approval-tasks/action`, data),

        /**
         * جلب سجل الموافقات لطلب معين
         * @param {string} entityType - نوع الكيان
         * @param {number} entityId - معرف الكيان
         */
        getApprovalHistory: (entityType, entityId) =>
            apiGet(`${GATEWAY_URL}/api/authorization/approval-tasks/history/${entityType}/${entityId}`),

        /**
         * جلب طلبات المستخدم
         * @param {number} userId - معرف المستخدم
         * @param {string} status - حالة الطلب (اختياري)
         * @param {number} page - رقم الصفحة
         * @param {number} pageSize - حجم الصفحة
         */
        getMyRequests: (userId, status = null, page = 1, pageSize = 20) => {
            const params = new URLSearchParams({ page, pageSize });
            if (status) params.append('status', status);
            return apiGet(`${GATEWAY_URL}/api/authorization/approval-tasks/my-requests/${userId}?${params}`);
        },

        /**
         * جلب أنواع الكيانات المتاحة للموافقات
         */
        getEntityTypes: () =>
            apiGet(`${GATEWAY_URL}/api/authorization/approval-matrix/entities`),

        /**
         * جلب مراحل الموافقة لنوع كيان معين
         * @param {string} entityType - نوع الكيان
         */
        getApprovalStages: (entityType) =>
            apiGet(`${GATEWAY_URL}/api/authorization/approval-matrix/${entityType}/stages`),

        /**
         * بدء سير عمل (Legacy)
         */
        initiateWorkflow: (data) =>
            apiPost(`${GATEWAY_URL}/api/authorization/workflow/initiate`, data),

        /**
         * موافقة في سير العمل (Legacy)
         */
        approveWorkflow: (data) =>
            apiPost(`${GATEWAY_URL}/api/authorization/workflow/approve`, data),
    },

    // ============================================
    // Disbursements - طلبات الصرف
    // ============================================
    disbursements: {
        /**
         * جلب جميع طلبات الصرف
         * @param {object} params - معاملات البحث
         */
        getAll: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`${GATEWAY_URL}/api/finance/ap/disbursements${query ? `?${query}` : ''}`);
        },

        /**
         * جلب طلب صرف بالمعرف
         * @param {number} id - معرف الطلب
         */
        getById: (id) => apiGet(`${GATEWAY_URL}/api/finance/ap/disbursements/${id}`),

        /**
         * إنشاء طلب صرف جديد
         * @param {object} data - بيانات الطلب
         */
        create: async (data) => {
            // إنشاء طلب الصرف في نظام المالية
            const result = await apiPost(`${GATEWAY_URL}/api/finance/ap/disbursements`, data);

            // بدء سير العمل للموافقات
            if (result && result.id) {
                await apiPost(`${GATEWAY_URL}/api/authorization/approval-tasks/initiate`, {
                    EntityType: 'DisbursementRequest',
                    EntityId: result.id,
                    InitiatedByUserId: data.requestedByUserId,
                    InitiatedByName: data.requestedByName,
                    Amount: data.amount,
                    DepartmentId: data.departmentId,
                    TitleAr: data.descriptionAr || `طلب صرف - ${data.referenceNumber}`,
                    TitleEn: data.descriptionEn || `Disbursement Request - ${data.referenceNumber}`,
                    DescriptionAr: data.notesAr,
                    DescriptionEn: data.notesEn,
                    ReferenceNumber: data.referenceNumber
                });
            }

            return result;
        },

        /**
         * تحديث طلب صرف
         * @param {number} id - معرف الطلب
         * @param {object} data - البيانات المحدثة
         */
        update: (id, data) => apiPut(`${GATEWAY_URL}/api/finance/ap/disbursements/${id}`, data),

        /**
         * حذف طلب صرف
         * @param {number} id - معرف الطلب
         */
        delete: (id) => apiDelete(`${GATEWAY_URL}/api/finance/ap/disbursements/${id}`),

        /**
         * جلب الإحصائيات
         */
        getStatistics: () => apiGet(`${GATEWAY_URL}/api/finance/ap/disbursements/statistics`),

        /**
         * جلب طلبات الصرف المعلقة
         */
        getPending: () => apiGet(`${GATEWAY_URL}/api/finance/ap/disbursements?status=Pending`),

        /**
         * تصدير إلى Excel
         * @param {object} params - معاملات التصفية
         */
        exportToExcel: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`${GATEWAY_URL}/api/finance/ap/disbursements/export/excel${query ? `?${query}` : ''}`);
        },
    },

    // ══════════════════════════════════════════════════════════════════════════
    // Admin - الإدارة والمراقبة
    // ══════════════════════════════════════════════════════════════════════════
    admin: {
        // ══════════════════════════════════════════════════════════════════
        // Feature Flags - التحكم في الميزات
        // ══════════════════════════════════════════════════════════════════
        getFeatureFlags: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/admin/feature-flags${query ? `?${query}` : ''}`);
        },
        getFeatureFlag: (id) => apiGet(`/api/admin/feature-flags/${id}`),
        createFeatureFlag: (data) => apiPost('/api/admin/feature-flags', data),
        updateFeatureFlag: (id, data) => apiPut(`/api/admin/feature-flags/${id}`, data),
        deleteFeatureFlag: (id) => apiDelete(`/api/admin/feature-flags/${id}`),
        toggleFeatureFlag: (id, enabled) => apiPost(`/api/admin/feature-flags/${id}/toggle`, { enabled }),
        getFeatureFlagCategories: () => apiGet('/api/admin/feature-flags/categories'),
        checkFeatureFlag: (name, tenantId = null, userId = null) => {
            const params = new URLSearchParams({ name });
            if (tenantId) params.append('tenantId', tenantId);
            if (userId) params.append('userId', userId);
            return apiGet(`/api/admin/feature-flags/check?${params.toString()}`);
        },

        // ══════════════════════════════════════════════════════════════════
        // Audit Logs - سجلات التدقيق
        // ══════════════════════════════════════════════════════════════════
        getAuditLogs: (params = {}) => {
            const query = new URLSearchParams();
            if (params.page) query.append('page', params.page);
            if (params.pageSize) query.append('pageSize', params.pageSize);
            if (params.userId) query.append('userId', params.userId);
            if (params.action) query.append('action', params.action);
            if (params.entityType) query.append('entityType', params.entityType);
            if (params.startDate) query.append('startDate', params.startDate);
            if (params.endDate) query.append('endDate', params.endDate);
            if (params.module) query.append('module', params.module);
            if (params.tenantId) query.append('tenantId', params.tenantId);
            return apiGet(`/api/admin/audit-logs?${query.toString()}`);
        },
        getAuditLog: (id) => apiGet(`/api/admin/audit-logs/${id}`),
        getAuditLogStatistics: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/admin/audit-logs/statistics${query ? `?${query}` : ''}`);
        },
        getEntityHistory: (entityType, entityId) =>
            apiGet(`/api/admin/audit-logs/entity/${entityType}/${entityId}`),
        getUserActivity: (userId, params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/admin/audit-logs/user/${userId}${query ? `?${query}` : ''}`);
        },
        getAuditLogActions: () => apiGet('/api/admin/audit-logs/actions'),
        getAuditLogEntityTypes: () => apiGet('/api/admin/audit-logs/entity-types'),
        exportAuditLogs: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/admin/audit-logs/export${query ? `?${query}` : ''}`, { responseType: 'blob' });
        },

        // ══════════════════════════════════════════════════════════════════
        // System Monitoring - مراقبة النظام
        // ══════════════════════════════════════════════════════════════════
        getSystemHealth: () => apiGet('/api/admin/monitoring/health'),
        getServiceHealth: (serviceName) => apiGet(`/api/admin/monitoring/health/${serviceName}`),
        getSystemMetrics: () => apiGet('/api/admin/monitoring/metrics'),
        getSystemAlerts: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/admin/monitoring/alerts${query ? `?${query}` : ''}`);
        },
        acknowledgeAlert: (alertId) => apiPost(`/api/admin/monitoring/alerts/${alertId}/acknowledge`),
        resolveAlert: (alertId) => apiPost(`/api/admin/monitoring/alerts/${alertId}/resolve`),
        getOnlineUsers: () => apiGet('/api/admin/monitoring/online-users'),
        getConnectionStats: () => apiGet('/api/admin/monitoring/connections'),
        getPerformanceMetrics: (period = '1h') => apiGet(`/api/admin/monitoring/performance?period=${period}`),
        getDatabaseMetrics: () => apiGet('/api/admin/monitoring/database'),
        getCacheMetrics: () => apiGet('/api/admin/monitoring/cache'),
        getQueueMetrics: () => apiGet('/api/admin/monitoring/queues'),

        // ══════════════════════════════════════════════════════════════════
        // Webhooks - الروابط التكاملية
        // ══════════════════════════════════════════════════════════════════
        getWebhooks: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/admin/webhooks${query ? `?${query}` : ''}`);
        },
        getWebhook: (id) => apiGet(`/api/admin/webhooks/${id}`),
        createWebhook: (data) => apiPost('/api/admin/webhooks', data),
        updateWebhook: (id, data) => apiPut(`/api/admin/webhooks/${id}`, data),
        deleteWebhook: (id) => apiDelete(`/api/admin/webhooks/${id}`),
        testWebhook: (id) => apiPost(`/api/admin/webhooks/${id}/test`),
        getWebhookDeliveries: (id, params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/admin/webhooks/${id}/deliveries${query ? `?${query}` : ''}`);
        },
        retryWebhookDelivery: (webhookId, deliveryId) =>
            apiPost(`/api/admin/webhooks/${webhookId}/deliveries/${deliveryId}/retry`),
        getAvailableWebhookEvents: () => apiGet('/api/admin/webhooks/events'),

        // ══════════════════════════════════════════════════════════════════
        // User Sessions - جلسات المستخدمين
        // ══════════════════════════════════════════════════════════════════
        getActiveSessions: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/admin/sessions${query ? `?${query}` : ''}`);
        },
        terminateSession: (sessionId) => apiDelete(`/api/admin/sessions/${sessionId}`),
        terminateUserSessions: (userId) => apiDelete(`/api/admin/sessions/user/${userId}`),
        getSessionStats: () => apiGet('/api/admin/sessions/stats'),

        // ══════════════════════════════════════════════════════════════════
        // Rate Limiting - التحكم في معدل الطلبات
        // ══════════════════════════════════════════════════════════════════
        getRateLimitConfig: () => apiGet('/api/admin/rate-limit/config'),
        updateRateLimitConfig: (data) => apiPut('/api/admin/rate-limit/config', data),
        getRateLimitStats: () => apiGet('/api/admin/rate-limit/stats'),
        resetRateLimit: (identifier) => apiPost('/api/admin/rate-limit/reset', { identifier }),

        // ══════════════════════════════════════════════════════════════════
        // System Configuration - تكوين النظام
        // ══════════════════════════════════════════════════════════════════
        getSystemConfig: () => apiGet('/api/admin/config'),
        updateSystemConfig: (key, value) => apiPut('/api/admin/config', { key, value }),
        getEnvironmentInfo: () => apiGet('/api/admin/config/environment'),
        clearCache: (cacheType = 'all') => apiPost('/api/admin/config/clear-cache', { type: cacheType }),
        runDiagnostics: () => apiPost('/api/admin/config/diagnostics'),

        // ══════════════════════════════════════════════════════════════════
        // Maintenance - الصيانة
        // ══════════════════════════════════════════════════════════════════
        getMaintenanceStatus: () => apiGet('/api/admin/maintenance/status'),
        enableMaintenanceMode: (message, estimatedDuration) =>
            apiPost('/api/admin/maintenance/enable', { message, estimatedDuration }),
        disableMaintenanceMode: () => apiPost('/api/admin/maintenance/disable'),
        scheduleMaintenance: (data) => apiPost('/api/admin/maintenance/schedule', data),
        cancelScheduledMaintenance: (id) => apiDelete(`/api/admin/maintenance/schedule/${id}`),
    },

    // ══════════════════════════════════════════════════════════════════
    // GRC - الحوكمة والمخاطر والامتثال
    // ══════════════════════════════════════════════════════════════════
    grc: {
        // Dashboard
        getDashboard: () => apiGet('/api/v1/grc/dashboard/overview'),
        getKPIs: () => apiGet('/api/v1/grc/dashboard/kpis'),
        getAlerts: () => apiGet('/api/v1/grc/dashboard/alerts'),

        // ══════════════════════════════════════════════════════════════════
        // Risks - إدارة المخاطر
        // ══════════════════════════════════════════════════════════════════
        getRisks: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/v1/grc/risks${query ? `?${query}` : ''}`);
        },
        getRisk: (id) => apiGet(`/api/v1/grc/risks/${id}`),
        createRisk: (data) => apiPost('/api/v1/grc/risks', data),
        updateRisk: (id, data) => apiPut(`/api/v1/grc/risks/${id}`, data),
        assessRisk: (id, data) => apiPost(`/api/v1/grc/risks/${id}/assess`, data),
        getRiskHeatMap: () => apiGet('/api/v1/grc/risks/heat-map'),
        getRiskCategories: () => apiGet('/api/v1/grc/risks/categories'),

        // KRIs - مؤشرات المخاطر
        getRiskKRIs: (riskId) => apiGet(`/api/v1/grc/risks/${riskId}/kris`),
        addKRIMeasurement: (kriId, data) => apiPost(`/api/v1/grc/risks/kris/${kriId}/measurements`, data),

        // ══════════════════════════════════════════════════════════════════
        // Policies - السياسات
        // ══════════════════════════════════════════════════════════════════
        getPolicies: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/v1/grc/policies${query ? `?${query}` : ''}`);
        },
        getPolicy: (id) => apiGet(`/api/v1/grc/policies/${id}`),
        createPolicy: (data) => apiPost('/api/v1/grc/policies', data),
        updatePolicy: (id, data) => apiPut(`/api/v1/grc/policies/${id}`, data),
        changePolicyStatus: (id, data) => apiPost(`/api/v1/grc/policies/${id}/status`, data),
        createPolicyVersion: (id, data) => apiPost(`/api/v1/grc/policies/${id}/versions`, data),
        getPolicyAcknowledgments: (id, params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/v1/grc/policies/${id}/acknowledgments${query ? `?${query}` : ''}`);
        },
        acknowledgePolicy: (id) => apiPost(`/api/v1/grc/policies/${id}/acknowledge`),
        getPolicyCategories: () => apiGet('/api/v1/grc/policies/categories'),

        // ══════════════════════════════════════════════════════════════════
        // Controls - الضوابط الرقابية
        // ══════════════════════════════════════════════════════════════════
        getControls: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/v1/grc/controls${query ? `?${query}` : ''}`);
        },
        getControl: (id) => apiGet(`/api/v1/grc/controls/${id}`),
        createControl: (data) => apiPost('/api/v1/grc/controls', data),
        updateControl: (id, data) => apiPut(`/api/v1/grc/controls/${id}`, data),
        recordControlTest: (id, data) => apiPost(`/api/v1/grc/controls/${id}/tests`, data),
        getControlTests: (id, limit = 10) => apiGet(`/api/v1/grc/controls/${id}/tests?limit=${limit}`),
        linkControlToRisks: (id, data) => apiPost(`/api/v1/grc/controls/${id}/risks`, data),
        getControlsNeedingTest: (daysAhead = 30) => apiGet(`/api/v1/grc/controls/needing-test?daysAhead=${daysAhead}`),
        getControlEffectivenessStats: () => apiGet('/api/v1/grc/controls/effectiveness-stats'),

        // ══════════════════════════════════════════════════════════════════
        // Compliance - الامتثال
        // ══════════════════════════════════════════════════════════════════
        getRegulatoryBodies: () => apiGet('/api/v1/grc/compliance/regulatory-bodies'),
        createRegulatoryBody: (data) => apiPost('/api/v1/grc/compliance/regulatory-bodies', data),
        getComplianceRequirements: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/v1/grc/compliance/requirements${query ? `?${query}` : ''}`);
        },
        getComplianceRequirement: (id) => apiGet(`/api/v1/grc/compliance/requirements/${id}`),
        createComplianceRequirement: (data) => apiPost('/api/v1/grc/compliance/requirements', data),
        updateComplianceRequirement: (id, data) => apiPut(`/api/v1/grc/compliance/requirements/${id}`, data),
        recordComplianceAssessment: (id, data) => apiPost(`/api/v1/grc/compliance/requirements/${id}/assessments`, data),
        linkRequirementToControls: (id, data) => apiPost(`/api/v1/grc/compliance/requirements/${id}/controls`, data),
        getComplianceStatistics: () => apiGet('/api/v1/grc/compliance/statistics'),
        getOverdueRequirements: () => apiGet('/api/v1/grc/compliance/overdue'),
        getApproachingDeadlines: (daysAhead = 30) => apiGet(`/api/v1/grc/compliance/approaching-deadlines?daysAhead=${daysAhead}`),

        // ══════════════════════════════════════════════════════════════════
        // Audit - التدقيق الداخلي
        // ══════════════════════════════════════════════════════════════════
        getAuditPlans: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/v1/grc/audit/plans${query ? `?${query}` : ''}`);
        },
        createAuditPlan: (data) => apiPost('/api/v1/grc/audit/plans', data),
        approveAuditPlan: (id) => apiPost(`/api/v1/grc/audit/plans/${id}/approve`),
        getAuditEngagements: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/v1/grc/audit/engagements${query ? `?${query}` : ''}`);
        },
        getAuditEngagement: (id) => apiGet(`/api/v1/grc/audit/engagements/${id}`),
        createAuditEngagement: (data) => apiPost('/api/v1/grc/audit/engagements', data),
        updateEngagementStatus: (id, data) => apiPost(`/api/v1/grc/audit/engagements/${id}/status`, data),
        addTeamMembers: (id, data) => apiPost(`/api/v1/grc/audit/engagements/${id}/team`, data),
        getAuditFindings: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/v1/grc/audit/findings${query ? `?${query}` : ''}`);
        },
        getAuditFinding: (id) => apiGet(`/api/v1/grc/audit/findings/${id}`),
        createAuditFinding: (data) => apiPost('/api/v1/grc/audit/findings', data),
        updateFindingStatus: (id, data) => apiPost(`/api/v1/grc/audit/findings/${id}/status`, data),
        addManagementResponse: (id, data) => apiPost(`/api/v1/grc/audit/findings/${id}/response`, data),
        addActionPlan: (id, data) => apiPost(`/api/v1/grc/audit/findings/${id}/action-plans`, data),
        getAuditStatistics: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/v1/grc/audit/statistics${query ? `?${query}` : ''}`);
        },

        // ══════════════════════════════════════════════════════════════════
        // Incidents - إدارة الحوادث
        // ══════════════════════════════════════════════════════════════════
        getIncidents: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/v1/grc/incidents${query ? `?${query}` : ''}`);
        },
        getIncident: (id) => apiGet(`/api/v1/grc/incidents/${id}`),
        reportIncident: (data) => apiPost('/api/v1/grc/incidents', data),
        updateIncident: (id, data) => apiPut(`/api/v1/grc/incidents/${id}`, data),
        updateIncidentStatus: (id, data) => apiPost(`/api/v1/grc/incidents/${id}/status`, data),
        assignInvestigator: (id, data) => apiPost(`/api/v1/grc/incidents/${id}/assign`, data),
        escalateIncident: (id, data) => apiPost(`/api/v1/grc/incidents/${id}/escalate`, data),
        addIncidentNote: (id, data) => apiPost(`/api/v1/grc/incidents/${id}/notes`, data),
        addIncidentAttachment: (id, data) => apiPost(`/api/v1/grc/incidents/${id}/attachments`, data),
        getIncidentStatistics: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiGet(`/api/v1/grc/incidents/statistics${query ? `?${query}` : ''}`);
        },
        getCriticalIncidents: () => apiGet('/api/v1/grc/incidents/critical'),
        getMonthlyIncidentReport: (year, month) => apiGet(`/api/v1/grc/incidents/monthly-report?year=${year}&month=${month}`),

        // ══════════════════════════════════════════════════════════════════
        // GRC Engine - محرك الحوكمة
        // ══════════════════════════════════════════════════════════════════
        checkRule: (data) => apiPost('/api/v1/grc/engine/check', data),
        checkRuleBatch: (data) => apiPost('/api/v1/grc/engine/check-batch', data),
        checkSoD: (data) => apiPost('/api/v1/grc/engine/check-sod', data),
        checkThreshold: (data) => apiPost('/api/v1/grc/engine/check-threshold', data),
        getActiveRules: (module, operation) => {
            let url = `/api/v1/grc/engine/rules?module=${module}`;
            if (operation) url += `&operation=${operation}`;
            return apiGet(url);
        },
    },

    // ══════════════════════════════════════════════════════════════════
    // Chat - نظام المحادثات الداخلية
    // ══════════════════════════════════════════════════════════════════
    chat: {
        // المحادثات - تمر عبر Gateway: /api/chat/* → PathRemovePrefix /api/chat → PathPrefix /api → Chat service
        getConversations: (userId) => apiGet(`/api/chat/conversations?userId=${userId}`),
        getConversation: (id) => apiGet(`/api/chat/conversations/${id}`),
        createConversation: (data) => apiPost(`/api/chat/conversations`, data),

        // الرسائل
        getMessages: (conversationId, page = 1, pageSize = 50) =>
            apiGet(`/api/chat/conversations/${conversationId}/messages?page=${page}&pageSize=${pageSize}`),
        sendMessage: (conversationId, data) =>
            apiPost(`/api/chat/conversations/${conversationId}/messages`, data),

        // رفع الملفات والرسائل الصوتية
        uploadAttachment: async (conversationId, messageId, formData) => {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${GATEWAY_URL}/api/chat/conversations/${conversationId}/messages/${messageId}/upload`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        // لا تضع Content-Type - سيتم تعيينه تلقائياً مع boundary
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                const error = await safeJsonParse(response);
                throw new Error(error.error || 'فشل رفع الملف');
            }

            return await safeJsonParse(response);
        },

        // القراءة
        markAsRead: (conversationId) =>
            apiPost(`/api/chat/conversations/${conversationId}/read`),
        getUnreadCount: () =>
            apiGet(`/api/chat/unread`),
    },

    // ══════════════════════════════════════════════════════════════════
    // Announcements - الإعلانات والتعميمات
    // ══════════════════════════════════════════════════════════════════
    announcements: {
        getAll: (params) => apiGet('/api/announcements', params),
        getById: (id) => apiGet(`/api/announcements/${id}`),
        create: (data) => apiPost('/api/announcements', data),
        update: (id, data) => apiPut(`/api/announcements/${id}`, data),
        delete: (id) => apiDelete(`/api/announcements/${id}`),
        publish: (id) => apiPost(`/api/announcements/${id}/publish`),
        unpublish: (id) => apiPost(`/api/announcements/${id}/unpublish`),
        archive: (id) => apiPost(`/api/announcements/${id}/archive`),
        uploadImage: (id, formData) => apiPost(`/api/announcements/${id}/image`, formData),
        getPending: () => apiGet('/api/announcements/pending'),
        acknowledge: (data) => apiPost('/api/announcements/acknowledge', data),
        getReport: (id) => apiGet(`/api/announcements/${id}/report`),
    },

    // ══════════════════════════════════════════════════════════════════
    // Permission Management - إدارة الصلاحيات (IT Director Only)
    // ══════════════════════════════════════════════════════════════════
    permissionsManagement: {
        // صلاحيات الشاشات
        getScreenPermissions: (moduleId) =>
            apiGet(`/api/authorization/permissions/screens/${moduleId}`),
        saveScreenPermissions: (moduleId, data) =>
            apiPost(`/api/authorization/permissions/screens/${moduleId}`, data),
        removeScreenBeneficiary: (moduleId, type, id) =>
            apiDelete(`/api/authorization/permissions/screens/${moduleId}/beneficiary?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`),

        // صلاحيات العمليات
        getOperationPermissions: (moduleId) =>
            apiGet(`/api/authorization/permissions/operations/${moduleId}`),
        saveOperationPermissions: (moduleId, data) =>
            apiPost(`/api/authorization/permissions/operations/${moduleId}`, data),
        removeOperationBeneficiary: (moduleId, type, id) =>
            apiDelete(`/api/authorization/permissions/operations/${moduleId}/beneficiary?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`),

        // تسلسل الاعتمادات
        getWorkflows: (moduleId) =>
            apiGet(`/api/authorization/permissions/workflows/${moduleId}`),
        saveWorkflow: (moduleId, workflowId, data) =>
            apiPut(`/api/authorization/permissions/workflows/${moduleId}/${workflowId}`, data),
        saveAllWorkflows: (moduleId, data) =>
            apiPost(`/api/authorization/permissions/workflows/${moduleId}/bulk`, data),

        // التحقق Runtime
        checkPermission: (userId, moduleId, screenId) =>
            apiGet(`/api/authorization/permissions/check?userId=${userId}&moduleId=${moduleId}${screenId ? `&screenId=${screenId}` : ''}`),
    },

    // ══════════════════════════════════════════════════════════════════
    // Nafath - نظام نفاذ الوطني (التحقق بالهوية الرقمية)
    // ══════════════════════════════════════════════════════════════════
    nafath: {
        // Admin APIs - إدارة النظام
        getConfig: () => apiGet('/api/admin/nafath/config'),
        saveConfig: (data) => apiPost('/api/admin/nafath/config', data),
        testConnection: () => apiPost('/api/admin/nafath/test-connection'),
        getStats: (period = 'week') => apiGet(`/api/admin/nafath/stats?period=${period}`),
        getRecentLogins: (count = 20) => apiGet(`/api/admin/nafath/logins?count=${count}`),
        toggleService: (isActive) => apiPost('/api/admin/nafath/toggle', { isActive }),

        // Auth APIs - تسجيل الدخول للمستخدمين
        getStatus: () => apiGet('/api/nafath/status'),
        login: (nationalId) => apiPost('/api/nafath/login', { nationalId }),
        checkLoginStatus: (requestId) => apiGet(`/api/nafath/login/status/${requestId}`),
    },

    // ══════════════════════════════════════════════════════════════════
    // Declarations - نظام الإقرارات
    // ══════════════════════════════════════════════════════════════════
    declarations: {
        // أنواع الإقرارات
        getTypes: () => apiGet('/api/declarations/types'),
        getType: (id) => apiGet(`/api/declarations/types/${id}`),

        // إقراراتي
        getMyCompliance: () => apiGet('/api/declarations/my-compliance'),
        getMyDeclarations: () => apiGet('/api/declarations/my-declarations'),
        getDeclaration: (id) => apiGet(`/api/declarations/${id}`),
        create: (data) => apiPost('/api/declarations', data),
        saveDraft: (id, data) => apiPut(`/api/declarations/${id}/draft`, data),
        sign: (id) => apiPost(`/api/declarations/${id}/sign`),
        exportPdf: (id) => apiGet(`/api/declarations/${id}/pdf`),

        // تقارير الامتثال (HR/Manager/Internal Audit)
        getOrganizationCompliance: () => apiGet('/api/declarations/compliance/organization'),
        getKpis: () => apiGet('/api/declarations/compliance/kpis'),
        getEmployeeCompliance: (employeeId) => apiGet(`/api/declarations/compliance/employee/${employeeId}`),
    },
}

export default api
