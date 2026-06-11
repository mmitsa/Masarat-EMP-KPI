/**
 * ================================================================
 * Warehouse Components - Export Index
 * ================================================================
 *
 * @module WarehouseComponents
 * @description تصدير جميع مكونات موديول المستودعات
 * @version 1.0.0
 * @date 2026-02-14
 */

// Core Components
export { default as InventoryTable } from './InventoryTable';
export { default as StockLevelIndicator } from './StockLevelIndicator';
export { default as ItemSelector } from './ItemSelector';

// Form Components
export { default as MovementForm } from './MovementForm';
export { default as PurchaseOrderForm } from './PurchaseOrderForm';

// Selector Components
export { default as SupplierSelector } from './SupplierSelector';
export { default as WarehouseSelector } from './WarehouseSelector';

// Chart & Analytics
export { default as StockChart } from './StockChart';
export { default as ValuationSummary } from './ValuationSummary';

// Re-export everything as a single object
import InventoryTable from './InventoryTable';
import StockLevelIndicator from './StockLevelIndicator';
import ItemSelector from './ItemSelector';
// import MovementForm from './MovementForm';
// import PurchaseOrderForm from './PurchaseOrderForm';
// import SupplierSelector from './SupplierSelector';
// import WarehouseSelector from './WarehouseSelector';
// import StockChart from './StockChart';
// import ValuationSummary from './ValuationSummary';

export default {
    InventoryTable,
    StockLevelIndicator,
    ItemSelector,
    // MovementForm,
    // PurchaseOrderForm,
    // SupplierSelector,
    // WarehouseSelector,
    // StockChart,
    // ValuationSummary,
};
