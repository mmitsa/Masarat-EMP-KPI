/**
 * Movement Service - Vehicle & Fleet Management via Gateway
 */

import { apiMethods } from '../lib/apiClient'

const MOVEMENT_BASE = '/movement'

export const movementService = {
  // Vehicle endpoints
  getVehicles: (page = 1, pageSize = 20, search = '') =>
    apiMethods.get(`${MOVEMENT_BASE}/vehicles`, {
      params: { page, pageSize, search },
    }),

  getVehicle: (id) => apiMethods.get(`${MOVEMENT_BASE}/vehicles/${id}`),

  createVehicle: (data) => apiMethods.post(`${MOVEMENT_BASE}/vehicles`, data),

  updateVehicle: (id, data) => apiMethods.put(`${MOVEMENT_BASE}/vehicles/${id}`, data),

  deleteVehicle: (id) => apiMethods.delete(`${MOVEMENT_BASE}/vehicles/${id}`),

  // Driver endpoints
  getDrivers: (page = 1, pageSize = 20) =>
    apiMethods.get(`${MOVEMENT_BASE}/drivers`, {
      params: { page, pageSize },
    }),

  getDriver: (id) => apiMethods.get(`${MOVEMENT_BASE}/drivers/${id}`),

  createDriver: (data) => apiMethods.post(`${MOVEMENT_BASE}/drivers`, data),

  updateDriver: (id, data) => apiMethods.put(`${MOVEMENT_BASE}/drivers/${id}`, data),

  // Mission/Trip endpoints
  getMissions: (page = 1, pageSize = 20, status = '') =>
    apiMethods.get(`${MOVEMENT_BASE}/missions`, {
      params: { page, pageSize, status },
    }),

  getMission: (id) => apiMethods.get(`${MOVEMENT_BASE}/missions/${id}`),

  createMission: (data) => apiMethods.post(`${MOVEMENT_BASE}/missions`, data),

  updateMissionStatus: (id, status) =>
    apiMethods.patch(`${MOVEMENT_BASE}/missions/${id}`, { status }),

  // Maintenance endpoints
  getMaintenance: (vehicleId) =>
    apiMethods.get(`${MOVEMENT_BASE}/vehicles/${vehicleId}/maintenance`),

  scheduleMaintenance: (vehicleId, data) =>
    apiMethods.post(`${MOVEMENT_BASE}/vehicles/${vehicleId}/maintenance`, data),

  completeMaintenance: (maintenanceId) =>
    apiMethods.patch(`${MOVEMENT_BASE}/maintenance/${maintenanceId}`, { completed: true }),

  // Dashboard
  getDashboardStats: () => apiMethods.get(`${MOVEMENT_BASE}/dashboard/stats`),
}

export default movementService
