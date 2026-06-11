/**
 * EPM (Employee Performance Management) Service via Gateway
 */

import { apiMethods } from '../lib/apiClient'

const EPM_BASE = '/epm'

export const epmService = {
  // Performance evaluation endpoints
  getEvaluations: (page = 1, pageSize = 20, employeeId = '') =>
    apiMethods.get(`${EPM_BASE}/evaluations`, {
      params: { page, pageSize, employeeId },
    }),

  getEvaluation: (id) => apiMethods.get(`${EPM_BASE}/evaluations/${id}`),

  createEvaluation: (data) => apiMethods.post(`${EPM_BASE}/evaluations`, data),

  updateEvaluation: (id, data) => apiMethods.put(`${EPM_BASE}/evaluations/${id}`, data),

  submitEvaluation: (id) =>
    apiMethods.patch(`${EPM_BASE}/evaluations/${id}`, { submitted: true }),

  approveEvaluation: (id) =>
    apiMethods.patch(`${EPM_BASE}/evaluations/${id}`, { approved: true }),

  // Goals endpoints
  getGoals: (employeeId) => apiMethods.get(`${EPM_BASE}/employees/${employeeId}/goals`),

  createGoal: (employeeId, data) =>
    apiMethods.post(`${EPM_BASE}/employees/${employeeId}/goals`, data),

  updateGoal: (goalId, data) => apiMethods.put(`${EPM_BASE}/goals/${goalId}`, data),

  completeGoal: (goalId) =>
    apiMethods.patch(`${EPM_BASE}/goals/${goalId}`, { completed: true }),

  // Competencies
  getCompetencies: () => apiMethods.get(`${EPM_BASE}/competencies`),

  // Performance charters
  getCharters: (employeeId) =>
    apiMethods.get(`${EPM_BASE}/employees/${employeeId}/charters`),

  createCharter: (employeeId, data) =>
    apiMethods.post(`${EPM_BASE}/employees/${employeeId}/charters`, data),

  // Dashboard & Analytics
  getDashboardStats: () => apiMethods.get(`${EPM_BASE}/dashboard/stats`),

  getPerformanceAnalytics: (period = 'quarterly') =>
    apiMethods.get(`${EPM_BASE}/analytics`, { params: { period } }),

  getEmployeePerformance: (employeeId) =>
    apiMethods.get(`${EPM_BASE}/employees/${employeeId}/performance`),
}

export default epmService
