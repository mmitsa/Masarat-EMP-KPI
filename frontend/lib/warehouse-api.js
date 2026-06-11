// Warehouse API Services
// خدمات برنامج المستودعات المتقدمة

import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_WAREHOUSE_API_URL || 'http://localhost:5002';

export const warehouseAPI = {
  // ==================== المخزون ====================
  inventory: {
    getAll: (filters = {}) =>
      axios.get(`${API_BASE}/api/inventory`, { params: filters }),
    
    getById: (id) =>
      axios.get(`${API_BASE}/api/inventory/${id}`),
    
    create: (data) =>
      axios.post(`${API_BASE}/api/inventory`, data),
    
    update: (id, data) =>
      axios.put(`${API_BASE}/api/inventory/${id}`, data),
    
    delete: (id) =>
      axios.delete(`${API_BASE}/api/inventory/${id}`),
    
    getLow: () =>
      axios.get(`${API_BASE}/api/inventory/low-stock`),
    
    getExpiring: () =>
      axios.get(`${API_BASE}/api/inventory/expiring-items`),
    
    searchByCode: (code) =>
      axios.get(`${API_BASE}/api/inventory/search/${code}`),
  },

  // ==================== الحركات ====================
  movements: {
    getAll: (filters = {}) =>
      axios.get(`${API_BASE}/api/movements`, { params: filters }),
    
    getById: (id) =>
      axios.get(`${API_BASE}/api/movements/${id}`),
    
    createIn: (data) =>
      axios.post(`${API_BASE}/api/movements/in`, data),
    
    createOut: (data) =>
      axios.post(`${API_BASE}/api/movements/out`, data),
    
    createTransfer: (data) =>
      axios.post(`${API_BASE}/api/movements/transfer`, data),
    
    approve: (id) =>
      axios.put(`${API_BASE}/api/movements/${id}/approve`),
    
    reject: (id, reason) =>
      axios.put(`${API_BASE}/api/movements/${id}/reject`, { reason }),
    
    getHistory: (itemId) =>
      axios.get(`${API_BASE}/api/movements/history/${itemId}`),
  },

  // ==================== الأصناف ====================
  categories: {
    getAll: () =>
      axios.get(`${API_BASE}/api/categories`),
    
    getById: (id) =>
      axios.get(`${API_BASE}/api/categories/${id}`),
    
    create: (data) =>
      axios.post(`${API_BASE}/api/categories`, data),
    
    update: (id, data) =>
      axios.put(`${API_BASE}/api/categories/${id}`, data),
    
    delete: (id) =>
      axios.delete(`${API_BASE}/api/categories/${id}`),
  },

  // ==================== المستودعات ====================
  warehouses: {
    getAll: () =>
      axios.get(`${API_BASE}/api/warehouses`),
    
    getById: (id) =>
      axios.get(`${API_BASE}/api/warehouses/${id}`),
    
    create: (data) =>
      axios.post(`${API_BASE}/api/warehouses`, data),
    
    update: (id, data) =>
      axios.put(`${API_BASE}/api/warehouses/${id}`, data),
    
    getCapacity: (id) =>
      axios.get(`${API_BASE}/api/warehouses/${id}/capacity`),
  },

  // ==================== التقارير ====================
  reports: {
    inventorySummary: (warehouseId, date) =>
      axios.get(`${API_BASE}/api/reports/inventory-summary`, {
        params: { warehouseId, date },
      }),
    
    movementLog: (startDate, endDate, filters = {}) =>
      axios.get(`${API_BASE}/api/reports/movement-log`, {
        params: { startDate, endDate, ...filters },
      }),
    
    itemCost: (itemId) =>
      axios.get(`${API_BASE}/api/reports/item-cost/${itemId}`),
    
    warehouseValue: (warehouseId) =>
      axios.get(`${API_BASE}/api/reports/warehouse-value/${warehouseId}`),
    
    generatePDF: (reportType, params) =>
      axios.post(`${API_BASE}/api/reports/generate-pdf`, {
        reportType,
        params,
      }),
  },

  // ==================== الموردون ====================
  suppliers: {
    getAll: () =>
      axios.get(`${API_BASE}/api/suppliers`),
    
    getById: (id) =>
      axios.get(`${API_BASE}/api/suppliers/${id}`),
    
    create: (data) =>
      axios.post(`${API_BASE}/api/suppliers`, data),
    
    update: (id, data) =>
      axios.put(`${API_BASE}/api/suppliers/${id}`, data),
  },

  // ==================== المراجعات ====================
  audits: {
    getAll: () =>
      axios.get(`${API_BASE}/api/audits`),
    
    create: (data) =>
      axios.post(`${API_BASE}/api/audits`, data),
    
    complete: (id, data) =>
      axios.put(`${API_BASE}/api/audits/${id}/complete`, data),
    
    getAdjustments: (auditId) =>
      axios.get(`${API_BASE}/api/audits/${auditId}/adjustments`),
  },
};

export default warehouseAPI;
