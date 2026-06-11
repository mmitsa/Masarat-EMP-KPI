/**
 * Unified API Client for Masarat Dashboard
 * 
 * Purpose: Centralized HTTP client with:
 * - Gateway routing (all requests through /api/gateway/api)
 * - JWT token management from NextAuth session
 * - Unified error handling
 * - Audit logging for all operations
 * - Request/Response interceptors
 */

import axios from 'axios'
import { getSession } from 'next-auth/react'

// Browser: relative URLs to avoid mixed-content; Server: direct Gateway URL
const GATEWAY_URL = typeof window !== 'undefined'
    ? '' // Browser: relative URLs, proxied by Next.js catch-all
    : (process.env.INTERNAL_GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080')
const API_BASE = `${GATEWAY_URL}/api`

/**
 * Create axios instance with Gateway base URL
 */
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  withCredentials: true,
})

/**
 * Request interceptor: Add JWT token from NextAuth session
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const session = await getSession()
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`
      }
    } catch (error) {
      console.warn('Failed to attach session token:', error)
    }

    // Add audit headers
    config.headers['X-Request-ID'] = generateRequestId()
    config.headers['X-Timestamp'] = new Date().toISOString()
    config.headers['X-User-Agent'] = 'Unified-Dashboard/1.0'

    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Response interceptor: Handle errors and log responses
 */
apiClient.interceptors.response.use(
  (response) => {
    logAudit({
      action: 'API_SUCCESS',
      method: response.config.method.toUpperCase(),
      path: response.config.url,
      status: response.status,
      timestamp: new Date().toISOString(),
    })
    return response
  },
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message

    logAudit({
      action: 'API_ERROR',
      method: error.config?.method?.toUpperCase(),
      path: error.config?.url,
      status,
      error: message,
      timestamp: new Date().toISOString(),
    })

    // Handle 401 Unauthorized
    if (status === 401) {
      console.warn('Unauthorized: Token may be invalid or expired')
    }

    // Handle 403 Forbidden
    if (status === 403) {
      console.warn('Forbidden: User does not have permission')
    }

    return Promise.reject(error)
  }
)

/**
 * Generate unique request ID for tracking
 */
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Log audit trail to console and optionally to server
 */
function logAudit(data) {
  const auditLog = {
    timestamp: data.timestamp,
    action: data.action,
    method: data.method,
    path: data.path,
    status: data.status,
    error: data.error || null,
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', JSON.stringify(auditLog, null, 2))
  }

  // TODO: Send to server audit endpoint for persistence
  // await fetch('/api/audit', { method: 'POST', body: JSON.stringify(auditLog) })
}

export default apiClient

/**
 * Helper functions for common operations
 */

export const apiMethods = {
  /**
   * GET request
   */
  get: (path, config = {}) => apiClient.get(path, config),

  /**
   * POST request with audit
   */
  post: async (path, data, config = {}) => {
    const response = await apiClient.post(path, data, config)
    logAudit({
      action: 'POST_CREATE',
      path,
      status: response.status,
      timestamp: new Date().toISOString(),
    })
    return response
  },

  /**
   * PUT request with audit
   */
  put: async (path, data, config = {}) => {
    const response = await apiClient.put(path, data, config)
    logAudit({
      action: 'PUT_UPDATE',
      path,
      status: response.status,
      timestamp: new Date().toISOString(),
    })
    return response
  },

  /**
   * DELETE request with audit
   */
  delete: async (path, config = {}) => {
    const response = await apiClient.delete(path, config)
    logAudit({
      action: 'DELETE_REMOVE',
      path,
      status: response.status,
      timestamp: new Date().toISOString(),
    })
    return response
  },

  /**
   * PATCH request with audit
   */
  patch: async (path, data, config = {}) => {
    const response = await apiClient.patch(path, data, config)
    logAudit({
      action: 'PATCH_MODIFY',
      path,
      status: response.status,
      timestamp: new Date().toISOString(),
    })
    return response
  },
}
