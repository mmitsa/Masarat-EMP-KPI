/**
 * Archiving Service - Document Management via Gateway
 */

import { apiMethods } from '../lib/apiClient'

const ARCHIVING_BASE = '/archiving'

export const archivingService = {
  // Document endpoints
  getDocuments: (page = 1, pageSize = 20, search = '') =>
    apiMethods.get(`${ARCHIVING_BASE}/documents`, {
      params: { page, pageSize, search },
    }),

  getDocument: (id) => apiMethods.get(`${ARCHIVING_BASE}/documents/${id}`),

  createDocument: (data) => apiMethods.post(`${ARCHIVING_BASE}/documents`, data),

  updateDocument: (id, data) => apiMethods.put(`${ARCHIVING_BASE}/documents/${id}`, data),

  archiveDocument: (id) =>
    apiMethods.patch(`${ARCHIVING_BASE}/documents/${id}`, { archived: true }),

  deleteDocument: (id) => apiMethods.delete(`${ARCHIVING_BASE}/documents/${id}`),

  // Search endpoints
  searchDocuments: (query) =>
    apiMethods.get(`${ARCHIVING_BASE}/search`, { params: { q: query } }),

  // Classification endpoints
  getClassifications: () => apiMethods.get(`${ARCHIVING_BASE}/classifications`),

  createClassification: (data) =>
    apiMethods.post(`${ARCHIVING_BASE}/classifications`, data),

  // Document history/audit
  getDocumentHistory: (documentId) =>
    apiMethods.get(`${ARCHIVING_BASE}/documents/${documentId}/history`),

  // Dashboard
  getDashboardStats: () => apiMethods.get(`${ARCHIVING_BASE}/dashboard/stats`),
}

export default archivingService
