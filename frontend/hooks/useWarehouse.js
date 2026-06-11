/**
 * ================================================================
 * Warehouse React Query Hooks
 * ================================================================
 *
 * @module useWarehouse
 * @description React Query Hooks لموديول المستودعات
 * @version 1.0.0
 * @date 2026-02-14
 *
 * الميزات:
 * - Automatic Caching (5 دقائق)
 * - Background Refetching
 * - Optimistic Updates
 * - Error Handling
 * - Loading States
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import warehouseApi from '../services/warehouseApi';
import { useToast } from './useToast';

// ================================================================
// QUERY KEYS (مفاتيح التخزين المؤقت)
// ================================================================

const QUERY_KEYS = {
    // Dashboard
    dashboardStats: ['warehouse', 'dashboard', 'stats'],
    dashboardKPIs: ['warehouse', 'dashboard', 'kpis'],
    lowStockAlerts: ['warehouse', 'dashboard', 'low-stock-alerts'],
    pendingApprovals: ['warehouse', 'dashboard', 'pending-approvals'],
    recentMovements: (limit) => ['warehouse', 'dashboard', 'recent-movements', limit],

    // Inventory
    stockLevels: (filters) => ['warehouse', 'inventory', 'stock-levels', filters],
    lowStockItems: ['warehouse', 'inventory', 'low-stock'],
    stockValuation: (method, filters) => ['warehouse', 'inventory', 'valuation', method, filters],
    itemStock: (itemId, warehouseId) => ['warehouse', 'inventory', 'items', itemId, 'stock', warehouseId],
    warehouseStock: (warehouseId, filters) => ['warehouse', 'inventory', 'warehouses', warehouseId, 'stock', filters],

    // Stock Movements
    stockMovements: (filters) => ['warehouse', 'stock-movements', filters],
    itemMovements: (itemId, filters) => ['warehouse', 'stock-movements', 'items', itemId, filters],
    stockMovementById: (id) => ['warehouse', 'stock-movements', id],

    // Purchase Orders
    purchaseOrders: (filters) => ['warehouse', 'purchase-orders', filters],
    purchaseOrderById: (id) => ['warehouse', 'purchase-orders', id],
    purchaseOrderPendingItems: (id) => ['warehouse', 'purchase-orders', id, 'pending-items'],

    // Receipts
    receipts: (filters) => ['warehouse', 'receipts', filters],
    receiptById: (id) => ['warehouse', 'receipts', id],

    // Issues
    issues: (filters) => ['warehouse', 'issues', filters],
    issueById: (id) => ['warehouse', 'issues', id],

    // Transfers
    transfers: (filters) => ['warehouse', 'transfers', filters],
    transferById: (id) => ['warehouse', 'transfers', id],

    // Adjustments
    adjustments: (filters) => ['warehouse', 'adjustments', filters],
    adjustmentById: (id) => ['warehouse', 'adjustments', id],

    // Items
    items: (filters) => ['warehouse', 'items', filters],
    itemById: (id) => ['warehouse', 'items', id],

    // Categories
    categories: ['warehouse', 'categories'],

    // Suppliers
    suppliers: (filters) => ['warehouse', 'suppliers', filters],
    supplierById: (id) => ['warehouse', 'suppliers', id],

    // Warehouses
    warehouses: ['warehouse', 'warehouses'],
    warehouseById: (id) => ['warehouse', 'warehouses', id],

    // Reports
    reportStockStatus: (filters) => ['warehouse', 'reports', 'stock-status', filters],
    reportMovements: (filters) => ['warehouse', 'reports', 'movements', filters],
    reportABCAnalysis: ['warehouse', 'reports', 'abc-analysis'],
    reportValuation: (method) => ['warehouse', 'reports', 'valuation', method],
    reportSupplierPerformance: (filters) => ['warehouse', 'reports', 'supplier-performance', filters],
    reportTurnoverRate: (filters) => ['warehouse', 'reports', 'turnover-rate', filters],
};

// ================================================================
// DASHBOARD HOOKS
// ================================================================

/**
 * إحصائيات Dashboard
 */
export function useDashboardStats() {
    return useQuery({
        queryKey: QUERY_KEYS.dashboardStats,
        queryFn: warehouseApi.dashboard.getStats,
        staleTime: 5 * 60 * 1000, // 5 دقائق
    });
}

/**
 * KPIs
 */
export function useDashboardKPIs() {
    return useQuery({
        queryKey: QUERY_KEYS.dashboardKPIs,
        queryFn: warehouseApi.dashboard.getKPIs,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * تنبيهات المخزون المنخفض
 */
export function useLowStockAlerts() {
    return useQuery({
        queryKey: QUERY_KEYS.lowStockAlerts,
        queryFn: warehouseApi.dashboard.getLowStockAlerts,
        staleTime: 3 * 60 * 1000, // 3 دقائق
        refetchInterval: 5 * 60 * 1000, // إعادة التحميل كل 5 دقائق
    });
}

/**
 * الموافقات المعلقة
 */
export function usePendingApprovals() {
    return useQuery({
        queryKey: QUERY_KEYS.pendingApprovals,
        queryFn: warehouseApi.dashboard.getPendingApprovals,
        staleTime: 2 * 60 * 1000, // دقيقتان
    });
}

/**
 * آخر الحركات
 */
export function useRecentMovements(limit = 10) {
    return useQuery({
        queryKey: QUERY_KEYS.recentMovements(limit),
        queryFn: () => warehouseApi.dashboard.getRecentMovements(limit),
        staleTime: 5 * 60 * 1000,
    });
}

// ================================================================
// INVENTORY HOOKS
// ================================================================

/**
 * حالة المخزون
 */
export function useStockLevels(filters = {}) {
    return useQuery({
        queryKey: QUERY_KEYS.stockLevels(filters),
        queryFn: () => warehouseApi.inventory.getStockLevels(filters),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * الأصناف منخفضة المخزون
 */
export function useLowStockItems() {
    return useQuery({
        queryKey: QUERY_KEYS.lowStockItems,
        queryFn: warehouseApi.inventory.getLowStockItems,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * تقييم المخزون
 */
export function useStockValuation(method = 'FIFO', filters = {}) {
    return useQuery({
        queryKey: QUERY_KEYS.stockValuation(method, filters),
        queryFn: () => warehouseApi.inventory.getStockValuation(method, filters),
        staleTime: 10 * 60 * 1000, // 10 دقائق
    });
}

/**
 * رصيد صنف محدد
 */
export function useItemStock(itemId, warehouseId = null) {
    return useQuery({
        queryKey: QUERY_KEYS.itemStock(itemId, warehouseId),
        queryFn: () => warehouseApi.inventory.getItemStock(itemId, warehouseId),
        enabled: !!itemId,
        staleTime: 5 * 60 * 1000,
    });
}

// ================================================================
// STOCK MOVEMENTS HOOKS
// ================================================================

/**
 * جميع حركات المخزون
 */
export function useStockMovements(filters = {}) {
    return useQuery({
        queryKey: QUERY_KEYS.stockMovements(filters),
        queryFn: () => warehouseApi.stockMovements.getAll(filters),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * حركات صنف معين
 */
export function useItemMovements(itemId, filters = {}) {
    return useQuery({
        queryKey: QUERY_KEYS.itemMovements(itemId, filters),
        queryFn: () => warehouseApi.stockMovements.getItemMovements(itemId, filters),
        enabled: !!itemId,
        staleTime: 5 * 60 * 1000,
    });
}

// ================================================================
// PURCHASE ORDERS HOOKS
// ================================================================

/**
 * قائمة طلبات الشراء
 */
export function usePurchaseOrders(filters = {}) {
    return useQuery({
        queryKey: QUERY_KEYS.purchaseOrders(filters),
        queryFn: () => warehouseApi.purchaseOrders.getAll(filters),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * تفاصيل طلب شراء
 */
export function usePurchaseOrder(id) {
    return useQuery({
        queryKey: QUERY_KEYS.purchaseOrderById(id),
        queryFn: () => warehouseApi.purchaseOrders.getById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * إنشاء طلب شراء
 */
export function useCreatePurchaseOrder() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (data) => warehouseApi.purchaseOrders.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['warehouse', 'purchase-orders']);
            showToast('تم إنشاء طلب الشراء بنجاح', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'فشل في إنشاء طلب الشراء', 'error');
        },
    });
}

/**
 * تعديل طلب شراء
 */
export function useUpdatePurchaseOrder() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({ id, data }) => warehouseApi.purchaseOrders.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries(['warehouse', 'purchase-orders']);
            queryClient.invalidateQueries(QUERY_KEYS.purchaseOrderById(id));
            showToast('تم تعديل طلب الشراء بنجاح', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'فشل في تعديل طلب الشراء', 'error');
        },
    });
}

/**
 * الموافقة على طلب شراء
 */
export function useApprovePurchaseOrder() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({ id, notes }) => warehouseApi.purchaseOrders.approve(id, notes),
        onSuccess: () => {
            queryClient.invalidateQueries(['warehouse', 'purchase-orders']);
            queryClient.invalidateQueries(['warehouse', 'dashboard']);
            showToast('تمت الموافقة على طلب الشراء', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'فشل في الموافقة', 'error');
        },
    });
}

// ================================================================
// RECEIPTS HOOKS
// ================================================================

/**
 * قائمة الاستلامات
 */
export function useReceipts(filters = {}) {
    return useQuery({
        queryKey: QUERY_KEYS.receipts(filters),
        queryFn: () => warehouseApi.receipts.getAll(filters),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * إنشاء استلام
 */
export function useCreateReceipt() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({ type, data }) => {
            if (type === 'po') {
                return warehouseApi.receipts.createAgainstPO(data);
            }
            return warehouseApi.receipts.createDirect(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['warehouse', 'receipts']);
            queryClient.invalidateQueries(['warehouse', 'inventory']);
            queryClient.invalidateQueries(['warehouse', 'stock-movements']);
            showToast('تم إنشاء الاستلام بنجاح', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'فشل في إنشاء الاستلام', 'error');
        },
    });
}

// ================================================================
// ISSUES HOOKS
// ================================================================

/**
 * قائمة الصرفيات
 */
export function useIssues(filters = {}) {
    return useQuery({
        queryKey: QUERY_KEYS.issues(filters),
        queryFn: () => warehouseApi.issues.getAll(filters),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * إنشاء صرفية
 */
export function useCreateIssue() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (data) => warehouseApi.issues.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['warehouse', 'issues']);
            queryClient.invalidateQueries(['warehouse', 'inventory']);
            showToast('تم إنشاء الصرفية بنجاح', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'فشل في إنشاء الصرفية', 'error');
        },
    });
}

// ================================================================
// TRANSFERS HOOKS
// ================================================================

/**
 * قائمة النقل
 */
export function useTransfers(filters = {}) {
    return useQuery({
        queryKey: QUERY_KEYS.transfers(filters),
        queryFn: () => warehouseApi.transfers.getAll(filters),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * إنشاء نقل
 */
export function useCreateTransfer() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (data) => warehouseApi.transfers.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['warehouse', 'transfers']);
            showToast('تم إنشاء طلب النقل بنجاح', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'فشل في إنشاء طلب النقل', 'error');
        },
    });
}

// ================================================================
// ITEMS HOOKS
// ================================================================

/**
 * قائمة الأصناف
 */
export function useItems(filters = {}) {
    return useQuery({
        queryKey: QUERY_KEYS.items(filters),
        queryFn: () => warehouseApi.items.getAll(filters),
        staleTime: 10 * 60 * 1000, // 10 دقائق
    });
}

/**
 * تفاصيل صنف
 */
export function useItem(id) {
    return useQuery({
        queryKey: QUERY_KEYS.itemById(id),
        queryFn: () => warehouseApi.items.getById(id),
        enabled: !!id,
        staleTime: 10 * 60 * 1000,
    });
}

// ================================================================
// CATEGORIES & SUPPLIERS HOOKS
// ================================================================

/**
 * قائمة التصنيفات
 */
export function useCategories() {
    return useQuery({
        queryKey: QUERY_KEYS.categories,
        queryFn: warehouseApi.categories.getAll,
        staleTime: 30 * 60 * 1000, // 30 دقيقة (نادراً ما تتغير)
    });
}

/**
 * قائمة الموردين
 */
export function useSuppliers(filters = {}) {
    return useQuery({
        queryKey: QUERY_KEYS.suppliers(filters),
        queryFn: () => warehouseApi.suppliers.getAll(filters),
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * قائمة المستودعات
 */
export function useWarehouses() {
    return useQuery({
        queryKey: QUERY_KEYS.warehouses,
        queryFn: warehouseApi.warehouses.getAll,
        staleTime: 30 * 60 * 1000, // 30 دقيقة
    });
}

// ================================================================
// REPORTS HOOKS
// ================================================================

/**
 * تقرير حالة المخزون
 */
export function useStockStatusReport(filters = {}) {
    return useQuery({
        queryKey: QUERY_KEYS.reportStockStatus(filters),
        queryFn: () => warehouseApi.reports.stockStatus(filters),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * تحليل ABC
 */
export function useABCAnalysisReport() {
    return useQuery({
        queryKey: QUERY_KEYS.reportABCAnalysis,
        queryFn: warehouseApi.reports.abcAnalysis,
        staleTime: 30 * 60 * 1000, // 30 دقيقة
    });
}

/**
 * تقرير التقييم
 */
export function useValuationReport(method = 'FIFO') {
    return useQuery({
        queryKey: QUERY_KEYS.reportValuation(method),
        queryFn: () => warehouseApi.reports.valuation(method),
        staleTime: 10 * 60 * 1000,
    });
}

// ================================================================
// EXPORT ALL
// ================================================================

export default {
    // Dashboard
    useDashboardStats,
    useDashboardKPIs,
    useLowStockAlerts,
    usePendingApprovals,
    useRecentMovements,

    // Inventory
    useStockLevels,
    useLowStockItems,
    useStockValuation,
    useItemStock,

    // Stock Movements
    useStockMovements,
    useItemMovements,

    // Purchase Orders
    usePurchaseOrders,
    usePurchaseOrder,
    useCreatePurchaseOrder,
    useUpdatePurchaseOrder,
    useApprovePurchaseOrder,

    // Receipts
    useReceipts,
    useCreateReceipt,

    // Issues
    useIssues,
    useCreateIssue,

    // Transfers
    useTransfers,
    useCreateTransfer,

    // Items
    useItems,
    useItem,

    // Categories & Suppliers
    useCategories,
    useSuppliers,
    useWarehouses,

    // Reports
    useStockStatusReport,
    useABCAnalysisReport,
    useValuationReport,
};
