import api from './api';

/**
 * Movement API wrapper
 * Maps the nested movementAPI.vehicles / movementAPI.drivers shape
 * that the movement pages expect onto the flat api.movement namespace
 * (which routes through the Gateway with auth + resilience built in).
 */
const movementAPI = {
    vehicles: {
        getAll: (...args) => api.movement.getVehicles?.(...args),
        create: (data) => api.movement.createVehicle?.(data),
        update: (id, data) => api.movement.updateVehicle?.(id, data),
        delete: (id) => api.movement.deleteVehicle?.(id),
        getById: (id) => api.movement.getVehicle?.(id),
        getMaintenanceHistory: (id) =>
            api.movement.getVehicleMaintenance?.(id) || Promise.resolve([]),
    },
    drivers: {
        getAll: (...args) => api.movement.getDrivers?.(...args),
        create: (data) => api.movement.createDriver?.(data),
        update: (id, data) => api.movement.updateDriver?.(id, data),
        delete: (id) => api.movement.deleteDriver?.(id),
        getById: (id) => api.movement.getDriver?.(id),
        // getDriverMissions is the closest trip-history equivalent in api.movement
        getTripHistory: (id) =>
            api.movement.getDriverMissions?.(id) || Promise.resolve([]),
    },
};

export default movementAPI;
