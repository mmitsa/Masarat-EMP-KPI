/**
 * Warehouse Service - Inventory Management via Gateway
 */

import { apiMethods } from '../lib/apiClient'

const WAREHOUSE_BASE = '/warehouse'

export const warehouseService = {
  // Items endpoints
  getItems: (page = 1, pageSize = 20, search = '') =>
    apiMethods.get(`${WAREHOUSE_BASE}/items`, {
      params: { page, pageSize, search },
    }),

  getItem: (id) => apiMethods.get(`${WAREHOUSE_BASE}/items/${id}`),

  createItem: (data) => apiMethods.post(`${WAREHOUSE_BASE}/items`, data),

  updateItem: (id, data) => apiMethods.put(`${WAREHOUSE_BASE}/items/${id}`, data),

  deleteItem: (id) => apiMethods.delete(`${WAREHOUSE_BASE}/items/${id}`),

  // Warehouse endpoints
  getWarehouses: () => apiMethods.get(`${WAREHOUSE_BASE}/warehouses`),

  getWarehouse: (id) => apiMethods.get(`${WAREHOUSE_BASE}/warehouses/${id}`),

  getWarehouseItems: (warehouseId, page = 1, pageSize = 20) =>
    apiMethods.get(`${WAREHOUSE_BASE}/warehouses/${warehouseId}/items`, {
      params: { page, pageSize },
    }),

  // Transfer requests
  getTransfers: (page = 1, pageSize = 20, status = '') =>
    apiMethods.get(`${WAREHOUSE_BASE}/transfers`, {
      params: { page, pageSize, status },
    }),

  createTransfer: (data) => apiMethods.post(`${WAREHOUSE_BASE}/transfers`, data),

  approveTransfer: (id, approved) =>
    apiMethods.patch(`${WAREHOUSE_BASE}/transfers/${id}`, { approved }),

  // Stock adjustment
  adjustStock: (itemId, quantity, reason) =>
    apiMethods.post(`${WAREHOUSE_BASE}/items/${itemId}/adjust`, {
      quantity,
      reason,
    }),

  // Dashboard
  getDashboardStats: () => apiMethods.get(`${WAREHOUSE_BASE}/dashboard/stats`),

  getInventoryValue: () => apiMethods.get(`${WAREHOUSE_BASE}/inventory/value`),
}

export default warehouseService
