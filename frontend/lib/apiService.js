// API Configuration for Gateway
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = {
    // HR API
    hr: {
        getEmployees: () => fetch(`${API_BASE_URL}/api/hr/employees`).then(r => r.json()),
        getEmployee: (id) => fetch(`${API_BASE_URL}/api/hr/employees/${id}`).then(r => r.json()),
        getDepartments: () => fetch(`${API_BASE_URL}/api/hr/departments`).then(r => r.json()),
    },

    // Warehouse API
    warehouse: {
        getInventory: () => fetch(`${API_BASE_URL}/api/warehouse/inventory`).then(r => r.json()),
        getItem: (id) => fetch(`${API_BASE_URL}/api/warehouse/inventory/${id}`).then(r => r.json()),
        getCustodies: () => fetch(`${API_BASE_URL}/api/warehouse/custody`).then(r => r.json()),
    },

    // Movement API
    movement: {
        getVehicles: () => fetch(`${API_BASE_URL}/api/movement/vehicles`).then(r => r.json()),
        getTrips: () => fetch(`${API_BASE_URL}/api/movement/trips`).then(r => r.json()),
        getDrivers: () => fetch(`${API_BASE_URL}/api/movement/drivers`).then(r => r.json()),
    },

    // Archiving API
    archiving: {
        getDocuments: () => fetch(`${API_BASE_URL}/api/archiving/documents`).then(r => r.json()),
        getDocument: (id) => fetch(`${API_BASE_URL}/api/archiving/documents/${id}`).then(r => r.json()),
        searchByBarcode: (barcode) => fetch(`${API_BASE_URL}/api/archiving/documents/barcode/${barcode}`).then(r => r.json()),
    },

    // EPM API
    epm: {
        getPerformance: () => fetch(`${API_BASE_URL}/api/epm/performance`).then(r => r.json()),
        getKPIs: () => fetch(`${API_BASE_URL}/api/epm/kpis`).then(r => r.json()),
        getEvaluations: () => fetch(`${API_BASE_URL}/api/epm/evaluations`).then(r => r.json()),
    },

    // Sadad API
    sadad: {
        getPayments: () => fetch(`${API_BASE_URL}/api/sadad/payments`).then(r => r.json()),
        getInvoices: () => fetch(`${API_BASE_URL}/api/sadad/invoices`).then(r => r.json()),
    },

    // Analytics API
    analytics: {
        getDashboardStats: () => fetch(`${API_BASE_URL}/api/analytics/dashboard`).then(r => r.json()),
        getReports: () => fetch(`${API_BASE_URL}/api/analytics/reports`).then(r => r.json()),
    },

    // SaaS API
    saas: {
        getTenants: () => fetch(`${API_BASE_URL}/api/saas/tenants`).then(r => r.json()),
        getCurrentTenant: () => fetch(`${API_BASE_URL}/api/saas/tenant/current`).then(r => r.json()),
    },

    // Health Check
    health: {
        checkAll: async () => {
            const services = ['hr', 'warehouse', 'movement', 'archiving', 'epm', 'sadad', 'analytics', 'saas'];
            const results = {};

            for (const service of services) {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/${service}/health`, {
                        method: 'GET',
                        signal: AbortSignal.timeout(5000)
                    });
                    results[service] = response.ok ? 'نشط' : 'مشكلة';
                } catch {
                    results[service] = 'غير متاح';
                }
            }
            return results;
        }
    }
};

export default api;
