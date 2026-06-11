/**
 * HR Service - Employee Management via Gateway
 */

import apiClient, { apiMethods } from '../lib/apiClient'

const HR_BASE = '/hr'

export const hrService = {
  // Employee endpoints
  getEmployees: (page = 1, pageSize = 20, search = '') =>
    apiMethods.get(`${HR_BASE}/employees`, {
      params: { page, pageSize, search },
    }),

  getEmployee: (id) => apiMethods.get(`${HR_BASE}/employees/${id}`),

  createEmployee: (data) => apiMethods.post(`${HR_BASE}/employees`, data),

  updateEmployee: (id, data) => apiMethods.put(`${HR_BASE}/employees/${id}`, data),

  deleteEmployee: (id) => apiMethods.delete(`${HR_BASE}/employees/${id}`),

  // Department endpoints
  getDepartments: () => apiMethods.get(`${HR_BASE}/departments`),

  getDepartment: (id) => apiMethods.get(`${HR_BASE}/departments/${id}`),

  createDepartment: (data) => apiMethods.post(`${HR_BASE}/departments`, data),

  updateDepartment: (id, data) => apiMethods.put(`${HR_BASE}/departments/${id}`, data),

  // Dashboard stats
  getDashboardStats: () => apiMethods.get(`${HR_BASE}/dashboard/stats`),

  // Leave management
  getEmployeeLeaves: (employeeId) => 
    apiMethods.get(`${HR_BASE}/employees/${employeeId}/leaves`),

  requestLeave: (employeeId, data) =>
    apiMethods.post(`${HR_BASE}/employees/${employeeId}/leaves`, data),

  approveLeave: (leaveId, approved) =>
    apiMethods.patch(`${HR_BASE}/leaves/${leaveId}`, { approved }),
}

export default hrService
