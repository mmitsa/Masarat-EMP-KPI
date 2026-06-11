import apiClient, { apiMethods } from '../lib/apiClient'
import { getSession } from 'next-auth/react'

/**
 * Get active systems/modules for tenant (via Gateway)
 */
export const getActiveSystems = async (tenantId) => {
    try {
        const response = await apiMethods.get(`/saas/subscriptions/tenant/${tenantId}/modules`)
        if (!response.data) throw new Error('Failed to fetch systems')
        return response.data.map(m => m.code)
    } catch (error) {
        console.error('[SAAS] Error fetching active systems:', error)
        return []
    }
}

/**
 * Get tenant details (via Gateway)
 */
export const getTenantDetails = async (tenantId) => {
    try {
        const response = await apiMethods.get(`/saas/subscriptions/tenant/${tenantId}`)
        return response.data
    } catch (error) {
        console.error('[SAAS] Error fetching tenant details:', error)
        return null
    }
}

/**
 * Get tenant subscription status
 */
export const getTenantSubscriptionStatus = async (tenantId) => {
    try {
        const response = await apiMethods.get(`/saas/subscriptions/tenant/${tenantId}/status`)
        return response.data
    } catch (error) {
        console.error('[SAAS] Error fetching subscription status:', error)
        return null
    }
}

/**
 * Audit log tenant activity
 */
export const logTenantActivity = async (tenantId, action, details) => {
    try {
        const session = await getSession()
        await apiMethods.post(`/saas/audit/log`, {
            tenantId,
            userId: session?.user?.id,
            action,
            details,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.warn('[SAAS] Failed to log activity:', error)
    }
}
