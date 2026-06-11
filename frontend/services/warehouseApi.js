/**
 * ================================================================
 * Warehouse API Service Layer
 * ================================================================
 *
 * @module WarehouseAPI
 * @description طبقة خدمات API لموديول المستودعات
 * @version 1.0.0
 * @date 2026-02-14
 *
 * التنظيم:
 * - Inventory Management (إدارة المخزون)
 * - Stock Movements (حركة المخزون)
 * - Purchase Orders (طلبات الشراء)
 * - Receipts (الاستلامات)
 * - Issues (الصرفيات)
 * - Transfers (النقل)
 * - Adjustments (التسويات)
 * - Reports (التقارير)
 * - Categories & Suppliers (التصنيفات والموردين)
 * - Warehouses (المستودعات)
 */

import { API } from '../lib/routes';

// Base URL - يأتي من API Gateway
const BASE_URL = '/api/v1/warehouse';

/**
 * مساعد لإنشاء URL مع query parameters
 */
function buildUrl(endpoint, params = {}) {
    const url = new URL(endpoint, window.location.origin);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value)) {
                value.forEach(v => url.searchParams.append(key, v));
            } else {
                url.searchParams.append(key, value);
            }
        }
    });

    return url.pathname + url.search;
}

/**
 * مساعد لاستدعاء API
 */
async function apiCall(endpoint, options = {}) {
    const { method = 'GET', body, ...restOptions } = options;

    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...restOptions.headers,
        },
        ...restOptions,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'حدث خطأ غير متوقع' }));
        throw new Error(error.message || `خطأ ${response.status}`);
    }

    return response.json();
}

// ================================================================
// INVENTORY MANAGEMENT (إدارة المخزون)
// ================================================================

const inventory = {
    /**
     * الحصول على حالة المخزون
     */
    getStockLevels: (filters = {}) => {
        const url = buildUrl(`${BASE_URL}/inventory/stock-levels`, filters);
        return apiCall(url);
    },

    /**
     * الأصناف منخفضة المخزون
     */
    getLowStockItems: () => {
        return apiCall(`${BASE_URL}/inventory/low-stock`);
    },

    /**
     * تقييم المخزون (Valuation)
     */
    getStockValuation: (method = 'FIFO', filters = {}) => {
        const url = buildUrl(`${BASE_URL}/inventory/valuation`, { method, ...filters });
        return apiCall(url);
    },

    /**
     * رصيد صنف محدد
     */
    getItemStock: (itemId, warehouseId = null) => {
        const params = warehouseId ? { warehouseId } : {};
        const url = buildUrl(`${BASE_URL}/inventory/items/${itemId}/stock`, params);
        return apiCall(url);
    },

    /**
     * تفاصيل المخزون حسب المستودع
     */
    getWarehouseStock: (warehouseId, filters = {}) => {
        const url = buildUrl(`${BASE_URL}/inventory/warehouses/${warehouseId}/stock`, filters);
        return apiCall(url);
    },
};

// ================================================================
// STOCK MOVEMENTS (حركة المخزون)
// ================================================================

const stockMovements = {
    /**
     * جميع حركات المخزون
     */
    getAll: (filters = {}) => {
        const url = buildUrl(`${BASE_URL}/stock`, filters);
        return apiCall(url);
    },

    /**
     * حركات صنف معين
     */
    getItemMovements: (itemId, filters = {}) => {
        const url = buildUrl(`${BASE_URL}/stock/items/${itemId}`, filters);
        return apiCall(url);
    },

    /**
     * تفاصيل حركة معينة
     */
    getById: (id) => {
        return apiCall(`${BASE_URL}/stock/${id}`);
    },
};

// ================================================================
// PURCHASE ORDERS (طلبات الشراء)
// ================================================================

const purchaseOrders = {
    /**
     * قائمة طلبات الشراء
     */
    getAll: (filters = {}) => {
        const url = buildUrl(`${BASE_URL}/purchase-orders`, filters);
        return apiCall(url);
    },

    /**
     * تفاصيل طلب شراء
     */
    getById: (id) => {
        return apiCall(`${BASE_URL}/purchase-orders/${id}`);
    },

    /**
     * إنشاء طلب شراء جديد
     */
    create: (data) => {
        return apiCall(`${BASE_URL}/purchase-orders`, {
            method: 'POST',
            body: data,
        });
    },

    /**
     * تعديل طلب شراء
     */
    update: (id, data) => {
        return apiCall(`${BASE_URL}/purchase-orders/${id}`, {
            method: 'PUT',
            body: data,
        });
    },

    /**
     * حذف طلب شراء (Soft Delete)
     */
    delete: (id) => {
        return apiCall(`${BASE_URL}/purchase-orders/${id}`, {
            method: 'DELETE',
        });
    },

    /**
     * إرسال للموافقة
     */
    submit: (id) => {
        return apiCall(`${BASE_URL}/purchase-orders/${id}/submit`, {
            method: 'POST',
        });
    },

    /**
     * الموافقة على طلب شراء
     */
    approve: (id, notes = '') => {
        return apiCall(`${BASE_URL}/purchase-orders/${id}/approve`, {
            method: 'PUT',
            body: { notes },
        });
    },

    /**
     * رفض طلب شراء
     */
    reject: (id, reason) => {
        return apiCall(`${BASE_URL}/purchase-orders/${id}/reject`, {
            method: 'PUT',
            body: { reason },
        });
    },

    /**
     * إلغاء طلب شراء
     */
    cancel: (id, reason) => {
        return apiCall(`${BASE_URL}/purchase-orders/${id}/cancel`, {
            method: 'PUT',
            body: { reason },
        });
    },

    /**
     * الأصناف المعلقة في PO
     */
    getPendingItems: (id) => {
        return apiCall(`${BASE_URL}/purchase-orders/${id}/pending-items`);
    },
};

// ================================================================
// RECEIPTS (الاستلامات)
// ================================================================

const receipts = {
    /**
     * قائمة الاستلامات
     */
    getAll: (filters = {}) => {
        const url = buildUrl(`${BASE_URL}/receipts`, filters);
        return apiCall(url);
    },

    /**
     * تفاصيل استلام
     */
    getById: (id) => {
        return apiCall(`${BASE_URL}/receipts/${id}`);
    },

    /**
     * استلام ضد طلب شراء
     */
    createAgainstPO: (data) => {
        return apiCall(`${BASE_URL}/receipts/against-po`, {
            method: 'POST',
            body: data,
        });
    },

    /**
     * استلام مباشر (بدون PO)
     */
    createDirect: (data) => {
        return apiCall(`${BASE_URL}/receipts/direct`, {
            method: 'POST',
            body: data,
        });
    },

    /**
     * إتمام استلام مؤقت
     */
    finalizeTempReceipt: (id, data) => {
        return apiCall(`${BASE_URL}/receipts/${id}/finalize`, {
            method: 'POST',
            body: data,
        });
    },

    /**
     * إلغاء استلام
     */
    cancel: (id, reason) => {
        return apiCall(`${BASE_URL}/receipts/${id}/cancel`, {
            method: 'PUT',
            body: { reason },
        });
    },
};

// ================================================================
// ISSUES (الصرفيات)
// ================================================================

const issues = {
    /**
     * قائمة الصرفيات
     */
    getAll: (filters = {}) => {
        const url = buildUrl(`${BASE_URL}/issues`, filters);
        return apiCall(url);
    },

    /**
     * تفاصيل صرفية
     */
    getById: (id) => {
        return apiCall(`${BASE_URL}/issues/${id}`);
    },

    /**
     * إنشاء صرفية جديدة
     */
    create: (data) => {
        return apiCall(`${BASE_URL}/issues`, {
            method: 'POST',
            body: data,
        });
    },

    /**
     * تعديل صرفية (قبل الصرف)
     */
    update: (id, data) => {
        return apiCall(`${BASE_URL}/issues/${id}`, {
            method: 'PUT',
            body: data,
        });
    },

    /**
     * الموافقة على الصرف
     */
    approve: (id) => {
        return apiCall(`${BASE_URL}/issues/${id}/approve`, {
            method: 'POST',
        });
    },

    /**
     * تنفيذ الصرف
     */
    dispense: (id, data) => {
        return apiCall(`${BASE_URL}/issues/${id}/dispense`, {
            method: 'POST',
            body: data,
        });
    },

    /**
     * إلغاء صرفية
     */
    cancel: (id, reason) => {
        return apiCall(`${BASE_URL}/issues/${id}/cancel`, {
            method: 'PUT',
            body: { reason },
        });
    },
};

// ================================================================
// TRANSFERS (النقل بين المستودعات)
// ================================================================

const transfers = {
    /**
     * قائمة النقل
     */
    getAll: (filters = {}) => {
        const url = buildUrl(`${BASE_URL}/transfers`, filters);
        return apiCall(url);
    },

    /**
     * تفاصيل نقل
     */
    getById: (id) => {
        return apiCall(`${BASE_URL}/transfers/${id}`);
    },

    /**
     * إنشاء طلب نقل
     */
    create: (data) => {
        return apiCall(`${BASE_URL}/transfers`, {
            method: 'POST',
            body: data,
        });
    },

    /**
     * بدء عملية النقل
     */
    startTransfer: (id) => {
        return apiCall(`${BASE_URL}/transfers/${id}/start`, {
            method: 'POST',
        });
    },

    /**
     * استلام المنقولات
     */
    receive: (id, data) => {
        return apiCall(`${BASE_URL}/transfers/${id}/receive`, {
            method: 'POST',
            body: data,
        });
    },

    /**
     * إلغاء نقل
     */
    cancel: (id, reason) => {
        return apiCall(`${BASE_URL}/transfers/${id}/cancel`, {
            method: 'PUT',
            body: { reason },
        });
    },
};

// ================================================================
// ADJUSTMENTS (التسويات)
// ================================================================

const adjustments = {
    /**
     * قائمة التسويات
     */
    getAll: (filters = {}) => {
        const url = buildUrl(`${BASE_URL}/adjustments`, filters);
        return apiCall(url);
    },

    /**
     * تفاصيل تسوية
     */
    getById: (id) => {
        return apiCall(`${BASE_URL}/adjustments/${id}`);
    },

    /**
     * إنشاء تسوية
     */
    create: (data) => {
        return apiCall(`${BASE_URL}/adjustments`, {
            method: 'POST',
            body: data,
        });
    },

    /**
     * الموافقة على تسوية
     */
    approve: (id) => {
        return apiCall(`${BASE_URL}/adjustments/${id}/approve`, {
            method: 'POST',
        });
    },

    /**
     * رفض تسوية
     */
    reject: (id, reason) => {
        return apiCall(`${BASE_URL}/adjustments/${id}/reject`, {
            method: 'PUT',
            body: { reason },
        });
    },
};

// ================================================================
// ITEMS (الأصناف)
// ================================================================

const items = {
    /**
     * قائمة الأصناف
     */
    getAll: (filters = {}) => {
        const url = buildUrl(`${BASE_URL}/items`, filters);
        return apiCall(url);
    },

    /**
     * تفاصيل صنف
     */
    getById: (id) => {
        return apiCall(`${BASE_URL}/items/${id}`);
    },

    /**
     * إنشاء صنف جديد
     */
    create: (data) => {
        return apiCall(`${BASE_URL}/items`, {
            method: 'POST',
            body: data,
        });
    },

    /**
     * تعديل صنف
     */
    update: (id, data) => {
        return apiCall(`${BASE_URL}/items/${id}`, {
            method: 'PUT',
            body: data,
        });
    },

    /**
     * حذف صنف
     */
    delete: (id) => {
        return apiCall(`${BASE_URL}/items/${id}`, {
            method: 'DELETE',
        });
    },

    /**
     * طباعة باركود
     */
    printBarcode: (id) => {
        return apiCall(`${BASE_URL}/items/${id}/barcode`, {
            method: 'GET',
        });
    },
};

// ================================================================
// CATEGORIES (التصنيفات)
// ================================================================

const categories = {
    /**
     * قائمة التصنيفات
     */
    getAll: () => {
        return apiCall(`${BASE_URL}/categories`);
    },

    /**
     * إنشاء تصنيف
     */
    create: (data) => {
        return apiCall(`${BASE_URL}/categories`, {
            method: 'POST',
            body: data,
        });
    },

    /**
     * تعديل تصنيف
     */
    update: (id, data) => {
        return apiCall(`${BASE_URL}/categories/${id}`, {
            method: 'PUT',
            body: data,
        });
    },

    /**
     * حذف تصنيف
     */
    delete: (id) => {
        return apiCall(`${BASE_URL}/categories/${id}`, {
            method: 'DELETE',
        });
    },
};

// ================================================================
// SUPPLIERS (الموردين)
// ================================================================

const suppliers = {
    /**
     * قائمة الموردين
     */
    getAll: (filters = {}) => {
        const url = buildUrl(`${BASE_URL}/suppliers`, filters);
        return apiCall(url);
    },

    /**
     * تفاصيل مورد
     */
    getById: (id) => {
        return apiCall(`${BASE_URL}/suppliers/${id}`);
    },

    /**
     * إنشاء مورد
     */
    create: (data) => {
        return apiCall(`${BASE_URL}/suppliers`, {
            method: 'POST',
            body: data,
        });
    },

    /**
     * تعديل مورد
     */
    update: (id, data) => {
        return apiCall(`${BASE_URL}/suppliers/${id}`, {
            method: 'PUT',
            body: data,
        });
    },

    /**
     * حذف مورد
     */
    delete: (id) => {
        return apiCall(`${BASE_URL}/suppliers/${id}`, {
            method: 'DELETE',
        });
    },
};

// ================================================================
// WAREHOUSES (المستودعات)
// ================================================================

const warehouses = {
    /**
     * قائمة المستودعات
     */
    getAll: () => {
        return apiCall(`${BASE_URL}/warehouses`);
    },

    /**
     * تفاصيل مستودع
     */
    getById: (id) => {
        return apiCall(`${BASE_URL}/warehouses/${id}`);
    },

    /**
     * إنشاء مستودع
     */
    create: (data) => {
        return apiCall(`${BASE_URL}/warehouses`, {
            method: 'POST',
            body: data,
        });
    },

    /**
     * تعديل مستودع
     */
    update: (id, data) => {
        return apiCall(`${BASE_URL}/warehouses/${id}`, {
            method: 'PUT',
            body: data,
        });
    },
};

// ================================================================
// REPORTS (التقارير)
// ================================================================

const reports = {
    /**
     * تقرير حالة المخزون
     */
    stockStatus: (filters = {}) => {
        const url = buildUrl(`${BASE_URL}/reports/stock-status`, filters);
        return apiCall(url);
    },

    /**
     * تقرير حركة المخزون
     */
    movements: (filters = {}) => {
        const url = buildUrl(`${BASE_URL}/reports/movements`, filters);
        return apiCall(url);
    },

    /**
     * تحليل ABC
     */
    abcAnalysis: () => {
        return apiCall(`${BASE_URL}/reports/abc-analysis`);
    },

    /**
     * تقرير التقييم
     */
    valuation: (method = 'FIFO') => {
        const url = buildUrl(`${BASE_URL}/reports/valuation`, { method });
        return apiCall(url);
    },

    /**
     * تقرير أداء الموردين
     */
    supplierPerformance: (filters = {}) => {
        const url = buildUrl(`${BASE_URL}/reports/supplier-performance`, filters);
        return apiCall(url);
    },

    /**
     * تقرير معدل الدوران
     */
    turnoverRate: (filters = {}) => {
        const url = buildUrl(`${BASE_URL}/reports/turnover-rate`, filters);
        return apiCall(url);
    },

    /**
     * تصدير تقرير (PDF/Excel)
     */
    export: (reportType, format = 'pdf', filters = {}) => {
        const url = buildUrl(`${BASE_URL}/reports/${reportType}/export`, { format, ...filters });
        // Return the URL for download
        return window.open(url, '_blank');
    },
};

// ================================================================
// DASHBOARD (لوحة المعلومات)
// ================================================================

const dashboard = {
    /**
     * إحصائيات Dashboard
     */
    getStats: () => {
        return apiCall(`${BASE_URL}/dashboard/stats`);
    },

    /**
     * KPIs
     */
    getKPIs: () => {
        return apiCall(`${BASE_URL}/dashboard/kpis`);
    },

    /**
     * الأصناف منخفضة المخزون
     */
    getLowStockAlerts: () => {
        return apiCall(`${BASE_URL}/dashboard/low-stock-alerts`);
    },

    /**
     * الطلبات المعلقة
     */
    getPendingApprovals: () => {
        return apiCall(`${BASE_URL}/dashboard/pending-approvals`);
    },

    /**
     * آخر الحركات
     */
    getRecentMovements: (limit = 10) => {
        const url = buildUrl(`${BASE_URL}/dashboard/recent-movements`, { limit });
        return apiCall(url);
    },
};

// ================================================================
// EXPORT الكائن النهائي
// ================================================================

const warehouseApi = {
    inventory,
    stockMovements,
    purchaseOrders,
    receipts,
    issues,
    transfers,
    adjustments,
    items,
    categories,
    suppliers,
    warehouses,
    reports,
    dashboard,
};

export default warehouseApi;
