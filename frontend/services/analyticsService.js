/**
 * Analytics Service - Reports & Insights via Gateway
 */

import { apiMethods } from '../lib/apiClient'

const ANALYTICS_BASE = '/analytics'

export const analyticsService = {
  // Dashboard metrics
  getDashboardMetrics: () => apiMethods.get(`${ANALYTICS_BASE}/dashboard/metrics`),

  // System-wide analytics
  getSystemHealth: () => apiMethods.get(`${ANALYTICS_BASE}/system/health`),

  getAuditLogs: (page = 1, pageSize = 50, filters = {}) =>
    apiMethods.get(`${ANALYTICS_BASE}/audit-logs`, {
      params: { page, pageSize, ...filters },
    }),

  // Department analytics
  getDepartmentMetrics: (departmentId, period = 'monthly') =>
    apiMethods.get(`${ANALYTICS_BASE}/departments/${departmentId}`, {
      params: { period },
    }),

  // Employee analytics
  getEmployeeMetrics: (employeeId, period = 'monthly') =>
    apiMethods.get(`${ANALYTICS_BASE}/employees/${employeeId}`, {
      params: { period },
    }),

  // Financial reports
  getFinancialReport: (period = 'monthly', format = 'json') =>
    apiMethods.get(`${ANALYTICS_BASE}/reports/financial`, {
      params: { period, format },
    }),

  getRevenueAnalytics: () => apiMethods.get(`${ANALYTICS_BASE}/analytics/revenue`),

  getExpenseAnalytics: () => apiMethods.get(`${ANALYTICS_BASE}/analytics/expenses`),

  // Operational reports
  getOperationalReport: (module, period = 'monthly') =>
    apiMethods.get(`${ANALYTICS_BASE}/reports/${module}`, {
      params: { period },
    }),

  // Custom reports
  generateCustomReport: (config) =>
    apiMethods.post(`${ANALYTICS_BASE}/reports/custom`, config),

  getReportHistory: (page = 1, pageSize = 20) =>
    apiMethods.get(`${ANALYTICS_BASE}/reports/history`, {
      params: { page, pageSize },
    }),

  // Data export
  exportData: (module, format = 'excel') =>
    apiMethods.get(`${ANALYTICS_BASE}/export/${module}`, {
      params: { format },
    }),

  // System activity tracking
  trackActivity: (action, details) =>
    apiMethods.post(`${ANALYTICS_BASE}/activity/track`, {
      action,
      details,
      timestamp: new Date().toISOString(),
    }),
}

export default analyticsService
