/**
 * ============================================
 * API Routes Configuration
 * ============================================
 *
 * This file contains API endpoint definitions for all platform modules
 */

// Gateway base URL
// Browser: relative URLs to avoid mixed-content; Server: direct Gateway URL
const GATEWAY = typeof window !== 'undefined'
    ? '' // Browser: relative URLs, proxied by Next.js catch-all
    : (process.env.INTERNAL_GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080');

// ============================================
// URL Builder Functions
// ============================================

/**
 * Build navigation URL with optional parameters
 * @param {string} path - Base path
 * @param {object} params - Query parameters
 * @returns {string} - Complete URL with query string
 */
export function buildNavigationUrl(path, params = {}) {
    if (!path) return '#';

    const filteredParams = Object.entries(params).filter(([, value]) => value != null && value !== '');

    if (filteredParams.length === 0) return path;

    const queryString = new URLSearchParams(
        filteredParams.map(([key, value]) => [key, String(value)])
    ).toString();

    return `${path}?${queryString}`;
}

/**
 * Build API URL - ensures proper gateway prefix
 * @param {string} endpoint - API endpoint
 * @returns {string} - Complete API URL
 */
export function buildApiUrl(endpoint) {
    if (!endpoint) return '';

    // If already a full URL, return as is
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
        return endpoint;
    }

    // If endpoint already includes gateway, return as is
    if (endpoint.includes(GATEWAY)) {
        return endpoint;
    }

    // Add gateway prefix if needed
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${GATEWAY}${cleanEndpoint}`;
}

// ============================================
// API Endpoints Configuration
// ============================================

export const API = {
    // ============================================
    // HR Module APIs
    // ============================================
    HR: {
        // Dashboard
        DASHBOARD_SUMMARY: `${GATEWAY}/api/hr/dashboard/summary`,

        // Employees
        EMPLOYEES: `${GATEWAY}/api/hr/employees`,
        EMPLOYEE_BY_ID: (id) => `${GATEWAY}/api/hr/employees/${id}`,
        EMPLOYEE_SIGNATURE: (id) => `${GATEWAY}/api/hr/employees/${id}/signature`,
        EMPLOYEE_PHOTO: (id) => `${GATEWAY}/api/hr/employees/${id}/photo`,
        EMPLOYEE_SEARCH: `${GATEWAY}/api/hr/employees/search`,
        EMPLOYEE_BY_DEPT: (deptId) => `${GATEWAY}/api/hr/employees/department/${deptId}`,

        // Departments
        DEPARTMENTS: `${GATEWAY}/api/hr/departments`,
        DEPARTMENT_BY_ID: (id) => `${GATEWAY}/api/hr/departments/${id}`,

        // Sections
        SECTIONS: `${GATEWAY}/api/hr/sections`,
        SECTION_BY_ID: (id) => `${GATEWAY}/api/hr/sections/${id}`,
        SECTIONS_BY_DEPT: (deptId) => `${GATEWAY}/api/hr/sections/by-department/${deptId}`,
        SECTION_CHECK_CODE: (code) => `${GATEWAY}/api/hr/sections/check-code/${code}`,

        // Units (Org Structure)
        ORG_UNITS: `${GATEWAY}/api/hr/units`,
        ORG_UNIT_BY_ID: (id) => `${GATEWAY}/api/hr/units/${id}`,
        ORG_UNITS_BY_SECTION: (sectionId) => `${GATEWAY}/api/hr/units/by-section/${sectionId}`,
        ORG_UNITS_BY_DEPT: (deptId) => `${GATEWAY}/api/hr/units/by-department/${deptId}`,
        ORG_UNIT_CHECK_CODE: (code) => `${GATEWAY}/api/hr/units/check-code/${code}`,

        // Transfers
        TRANSFERS: `${GATEWAY}/api/hr/transfers`,
        TRANSFER_BY_ID: (id) => `${GATEWAY}/api/hr/transfers/${id}`,
        TRANSFER_PENDING: `${GATEWAY}/api/hr/transfers/pending`,
        TRANSFER_APPROVE: (id) => `${GATEWAY}/api/hr/transfers/${id}/approve`,
        TRANSFER_REJECT: (id) => `${GATEWAY}/api/hr/transfers/${id}/reject`,

        // Attendance
        ATTENDANCE: `${GATEWAY}/api/hr/attendance`,
        ATTENDANCE_SUMMARY: `${GATEWAY}/api/hr/attendance/summary`,
        ATTENDANCE_REPORT: `${GATEWAY}/api/hr/attendance/report`,

        // Mobile Attendance
        MOBILE_CHECK_IN: `${GATEWAY}/api/hr/attendance/mobile/check-in`,
        MOBILE_CHECK_OUT: `${GATEWAY}/api/hr/attendance/mobile/check-out`,
        MOBILE_STATUS: (empId) => `${GATEWAY}/api/hr/attendance/mobile/status/${empId}`,

        // Work Locations
        WORK_LOCATIONS: `${GATEWAY}/api/hr/attendance/work-locations`,
        WORK_LOCATION_BY_ID: (id) => `${GATEWAY}/api/hr/attendance/work-locations/${id}`,
        WORK_LOCATIONS_BY_EMPLOYEE: (empId) => `${GATEWAY}/api/hr/attendance/work-locations/employee/${empId}`,
        WORK_LOCATION_ASSIGN: (locId, empId) => `${GATEWAY}/api/hr/attendance/work-locations/${locId}/assign/${empId}`,
        WORK_LOCATION_UNASSIGN: (locId, empId) => `${GATEWAY}/api/hr/attendance/work-locations/${locId}/unassign/${empId}`,

        // Field Work
        FIELD_WORK_PENDING: `${GATEWAY}/api/hr/attendance/field-work/pending`,
        FIELD_WORK_APPROVE: `${GATEWAY}/api/hr/attendance/field-work/approve`,

        // Leaves - Complete API
        LEAVES: `${GATEWAY}/api/hr/leaves`,
        LEAVE_BY_ID: (id) => `${GATEWAY}/api/hr/leaves/${id}`,
        LEAVE_BALANCE: (empId) => `${GATEWAY}/api/hr/leaves/balance/${empId}`,
        LEAVE_APPROVE_MANAGER: (id) => `${GATEWAY}/api/hr/leaves/${id}/approve-manager`,
        LEAVE_APPROVE_HR: (id) => `${GATEWAY}/api/hr/leaves/${id}/approve-hr`,
        LEAVE_APPROVE_FINAL: (id) => `${GATEWAY}/api/hr/leaves/${id}/approve-final`,
        LEAVE_APPROVE_EMPLOYEE: (id) => `${GATEWAY}/api/hr/leaves/${id}/approve-employee`,
        LEAVE_REJECT: (id) => `${GATEWAY}/api/hr/leaves/${id}/reject`,
        LEAVE_MANAGER_PENDING: `${GATEWAY}/api/hr/leaves/pending/manager`,
        LEAVE_SUBSTITUTE_PENDING: `${GATEWAY}/api/hr/leaves/pending/substitute`,
        LEAVE_SUBSTITUTE_APPROVE: (id) => `${GATEWAY}/api/hr/leaves/${id}/substitute-approve`,
        LEAVE_LEVEL_PENDING: (level) => `${GATEWAY}/api/hr/leaves/pending/level/${level}`,
        LEAVE_LEVEL_APPROVE: (id, level) => `${GATEWAY}/api/hr/leaves/${id}/approve/${level}`,

        // Payroll (BFF)
        PAYROLL: '/api/hr/payroll',
        PAYROLL_BY_ID: (id) => `/api/hr/payroll/${id}`,

        // Fingerprints - البصمات (BFF)
        FINGERPRINTS_EMPLOYEE: (empId) => `/api/hr/fingerprints?employeeId=${empId}`,
        FINGERPRINTS: '/api/hr/fingerprints',
        FINGERPRINT_BY_ID: (id) => `/api/hr/fingerprints/${id}`,
        FINGERPRINTS_SET_PRIMARY: '/api/hr/fingerprints/set-primary',
        FINGERPRINTS_CHECK_DUPLICATES: (empId) => `/api/hr/fingerprints/check-duplicates/${empId}`,
        FINGERPRINTS_SYNC: '/api/hr/fingerprints/sync-from-device',
        FINGERPRINTS_DEVICES_STATUS: '/api/hr/attendance/devices?action=status',

        // Biometric Devices - أجهزة البصمة (BFF proxy)
        BIOMETRIC_DEVICES: '/api/hr/attendance/devices',
        BIOMETRIC_DEVICE_BY_ID: (id) => `/api/hr/attendance/devices?action=get&id=${id}`,
        BIOMETRIC_DEVICE_TEST: (id) => `/api/hr/attendance/devices?action=test&id=${id}`,
        BIOMETRIC_DEVICE_SYNC: (id) => `/api/hr/attendance/devices?action=sync&id=${id}`,
        BIOMETRIC_DEVICE_LOGS: (id) => `/api/hr/attendance/devices?action=logs&id=${id}`,
        BIOMETRIC_DEVICE_STATUS: (id) => `/api/hr/attendance/devices?action=status&id=${id}`,
        BIOMETRIC_SYNC_ALL: '/api/hr/attendance/devices',
        AGENT_SYNC: '/api/hr/attendance/agent-sync',

        // Official Holidays - الإجازات الرسمية
        OFFICIAL_HOLIDAYS: `${GATEWAY}/api/hr/official-holidays`,
        OFFICIAL_HOLIDAY_BY_ID: (id) => `${GATEWAY}/api/hr/official-holidays/${id}`,
        OFFICIAL_HOLIDAYS_YEAR: (year) => `${GATEWAY}/api/hr/official-holidays/year/${year}`,
        OFFICIAL_HOLIDAYS_SYNC: `${GATEWAY}/api/hr/official-holidays/sync`,
        OFFICIAL_HOLIDAYS_CHECK: (date) => `${GATEWAY}/api/hr/official-holidays/check/${date}`,

        // Custom Schedules - المواعيد المخصصة (BFF)
        CUSTOM_SCHEDULES: '/api/hr/custom-schedules',
        CUSTOM_SCHEDULE_BY_ID: (id) => `/api/hr/custom-schedules/${id}`,
        CUSTOM_SCHEDULES_EMPLOYEE: (empId) => `/api/hr/custom-schedules?employeeId=${empId}`,
        CUSTOM_SCHEDULE_APPROVE: (id) => `/api/hr/custom-schedules/${id}`,
        CUSTOM_SCHEDULE_REJECT: (id) => `/api/hr/custom-schedules/${id}`,
        CUSTOM_SCHEDULES_EXEMPTED: '/api/hr/custom-schedules?exempted=true',
        CUSTOM_SCHEDULES_BULK_EXEMPT: '/api/hr/custom-schedules',

        // Work Shifts - نوبات العمل
        WORK_SHIFTS: `${GATEWAY}/api/hr/work-shifts`,
        WORK_SHIFT_BY_ID: (id) => `${GATEWAY}/api/hr/work-shifts/${id}`,
        WORK_SHIFTS_DEFAULT: `${GATEWAY}/api/hr/work-shifts/default`,
        WORK_SHIFTS_BY_DEPARTMENT: (deptId) => `${GATEWAY}/api/hr/work-shifts/department/${deptId}`,
        WORK_SHIFT_ASSIGN_DEPARTMENT: `${GATEWAY}/api/hr/work-shifts/assign-department`,
        WORK_SHIFT_ASSIGN_EMPLOYEE: `${GATEWAY}/api/hr/work-shifts/assign-employee`,
        WORK_SHIFT_UNASSIGN_EMPLOYEE: (empId) => `${GATEWAY}/api/hr/work-shifts/unassign-employee/${empId}`,

        // Cadres - الكوادر الوظيفية
        CADRES: `${GATEWAY}/api/hr/cadres`,
        CADRE_BY_ID: (id) => `${GATEWAY}/api/hr/cadres/${id}`,
        CADRE_ACTIVE: `${GATEWAY}/api/hr/cadres/active`,
        CADRE_SEARCH: `${GATEWAY}/api/hr/cadres/search`,
        CADRE_CHECK_CODE: (code) => `${GATEWAY}/api/hr/cadres/check-code/${code}`,

        // Salary Scales - سلم الرواتب
        SALARY_SCALES: `${GATEWAY}/api/hr/salary-scales`,
        SALARY_SCALE_BY_ID: (id) => `${GATEWAY}/api/hr/salary-scales/${id}`,
        SALARY_SCALE_ACTIVE: `${GATEWAY}/api/hr/salary-scales/active`,
        SALARY_SCALES_BY_CADRE: (cadreId) => `${GATEWAY}/api/hr/salary-scales/cadre/${cadreId}`,
        SALARY_SCALE_SEED_OFFICIAL: `${GATEWAY}/api/hr/salary-scales/seed-official`,

        // Grade Scales - المراتب
        GRADE_SCALES: (scaleId) => `${GATEWAY}/api/hr/salary-scales/${scaleId}/grades`,
        GRADE_SCALE_BY_ID: (gradeId) => `${GATEWAY}/api/hr/salary-scales/grades/${gradeId}`,
        GRADE_SCALE_REGENERATE_STEPS: (gradeId) => `${GATEWAY}/api/hr/salary-scales/grades/${gradeId}/regenerate-steps`,

        // Salary Scale Steps - الدرجات
        SALARY_SCALE_STEPS: (gradeId) => `${GATEWAY}/api/hr/salary-scales/grades/${gradeId}/steps`,
        SALARY_SCALE_STEPS_BULK_UPDATE: `${GATEWAY}/api/hr/salary-scales/steps/bulk-update`,
        SALARY_SCALE_CALCULATE_SALARY: (gradeId, step) => `${GATEWAY}/api/hr/salary-scales/grades/${gradeId}/calculate-salary/${step}`,

        // Employee Salary Assignment - تعيين الراتب للموظف
        EMPLOYEE_SALARY_INFO: (empId) => `${GATEWAY}/api/hr/salary-scales/employees/${empId}/salary-info`,
        EMPLOYEE_ASSIGN_GRADE: `${GATEWAY}/api/hr/salary-scales/employees/assign`,

        // Annual Increment - العلاوة الدورية
        INCREMENT_ELIGIBLE: `${GATEWAY}/api/hr/salary-scales/increment/eligible`,
        INCREMENT_PROCESS: (empId) => `${GATEWAY}/api/hr/salary-scales/increment/process/${empId}`,
        INCREMENT_PROCESS_BULK: `${GATEWAY}/api/hr/salary-scales/increment/process-bulk`,
    },

    // ============================================
    // Warehouse Module APIs
    // ============================================
    WAREHOUSE: {
        // Dashboard
        DASHBOARD: `${GATEWAY}/api/warehouse/dashboard`,
        DASHBOARD_SUMMARY: `${GATEWAY}/api/warehouse/dashboard/summary`,
        DASHBOARD_KPIS: `${GATEWAY}/api/warehouse/dashboard/kpis`,
        DASHBOARD_ALERTS: `${GATEWAY}/api/warehouse/dashboard/alerts`,
        DASHBOARD_RECENT_TRANSACTIONS: `${GATEWAY}/api/warehouse/dashboard/recent-transactions`,
        DASHBOARD_PENDING_APPROVALS: `${GATEWAY}/api/warehouse/dashboard/pending-approvals`,

        // Items
        ITEMS: `${GATEWAY}/api/warehouse/items`,
        ITEM_BY_ID: (id) => `${GATEWAY}/api/warehouse/items/${id}`,
        ITEM_BY_CODE: (code) => `${GATEWAY}/api/warehouse/items/code/${code}`,
        ITEM_BY_BARCODE: (barcode) => `${GATEWAY}/api/warehouse/items/barcode/${barcode}`,
        ITEM_SEARCH: `${GATEWAY}/api/warehouse/items/search`,
        ITEM_BY_GROUP: (groupId) => `${GATEWAY}/api/warehouse/items/group/${groupId}`,
        ITEM_BY_TYPE: (type) => `${GATEWAY}/api/warehouse/items/type/${type}`,
        ITEM_CONSUMABLE: `${GATEWAY}/api/warehouse/items/consumable`,
        ITEM_DURABLE: `${GATEWAY}/api/warehouse/items/durable`,
        ITEM_LOW_STOCK: `${GATEWAY}/api/warehouse/items/low-stock`,
        ITEM_STOCK_HISTORY: (id) => `${GATEWAY}/api/warehouse/items/${id}/stock-history`,
        ITEM_CUSTODIES: (id) => `${GATEWAY}/api/warehouse/items/${id}/custodies`,
        ITEM_QR_CODE: (id) => `${GATEWAY}/api/warehouse/items/${id}/qr-code`,

        // Item Groups
        ITEM_GROUPS: `${GATEWAY}/api/warehouse/item-groups`,
        ITEM_GROUP_BY_ID: (id) => `${GATEWAY}/api/warehouse/item-groups/${id}`,

        // Units
        UNITS: `${GATEWAY}/api/warehouse/units`,
        UNIT_BY_ID: (id) => `${GATEWAY}/api/warehouse/units/${id}`,

        // Warehouses
        WAREHOUSES: `${GATEWAY}/api/warehouse/warehouses`,
        WAREHOUSE_BY_ID: (id) => `${GATEWAY}/api/warehouse/warehouses/${id}`,
        WAREHOUSE_BY_CODE: (code) => `${GATEWAY}/api/warehouse/warehouses/code/${code}`,
        WAREHOUSE_STOCK: (id) => `${GATEWAY}/api/warehouse/warehouses/${id}/stock`,
        WAREHOUSE_ITEMS: (id) => `${GATEWAY}/api/warehouse/warehouses/${id}/items`,
        WAREHOUSE_CUSTODIANS: (id) => `${GATEWAY}/api/warehouse/warehouses/${id}/custodians`,
        WAREHOUSE_TRANSACTIONS: (id) => `${GATEWAY}/api/warehouse/warehouses/${id}/transactions`,

        // Stock
        STOCK: `${GATEWAY}/api/warehouse/stock`,
        STOCK_BY_ITEM: (itemId) => `${GATEWAY}/api/warehouse/stock/item/${itemId}`,
        STOCK_BY_WAREHOUSE: (whId) => `${GATEWAY}/api/warehouse/stock/warehouse/${whId}`,
        STOCK_MOVEMENTS: `${GATEWAY}/api/warehouse/stock/movements`,
        STOCK_ALERTS: `${GATEWAY}/api/warehouse/stock/alerts`,

        // Exchange Requests
        EXCHANGE_REQUESTS: `${GATEWAY}/api/warehouse/exchange-requests`,
        EXCHANGE_REQUEST_BY_ID: (id) => `${GATEWAY}/api/warehouse/exchange-requests/${id}`,
        EXCHANGE_REQUEST_BY_NUMBER: (num) => `${GATEWAY}/api/warehouse/exchange-requests/number/${num}`,
        EXCHANGE_REQUEST_BY_EMPLOYEE: (empId) => `${GATEWAY}/api/warehouse/exchange-requests/employee/${empId}`,
        EXCHANGE_REQUEST_BY_DEPARTMENT: (deptId) => `${GATEWAY}/api/warehouse/exchange-requests/department/${deptId}`,
        EXCHANGE_REQUEST_PENDING: `${GATEWAY}/api/warehouse/exchange-requests/pending`,
        EXCHANGE_REQUEST_MY_PENDING: `${GATEWAY}/api/warehouse/exchange-requests/my-pending`,
        EXCHANGE_REQUEST_APPROVE_DEPT_HEAD: (id) => `${GATEWAY}/api/warehouse/exchange-requests/${id}/approve/dept-head`,
        EXCHANGE_REQUEST_APPROVE_WH_MANAGER: (id) => `${GATEWAY}/api/warehouse/exchange-requests/${id}/approve/wh-manager`,
        EXCHANGE_REQUEST_APPROVE_STOCK_CONTROLLER: (id) => `${GATEWAY}/api/warehouse/exchange-requests/${id}/approve/stock-controller`,
        EXCHANGE_REQUEST_APPROVE_GENERAL_SERVICES: (id) => `${GATEWAY}/api/warehouse/exchange-requests/${id}/approve/general-services`,
        EXCHANGE_REQUEST_APPROVE_CUSTODIAN: (id) => `${GATEWAY}/api/warehouse/exchange-requests/${id}/approve/custodian`,
        EXCHANGE_REQUEST_REJECT: (id) => `${GATEWAY}/api/warehouse/exchange-requests/${id}/reject`,
        EXCHANGE_REQUEST_CANCEL: (id) => `${GATEWAY}/api/warehouse/exchange-requests/${id}/cancel`,
        EXCHANGE_REQUEST_COMPLETE: (id) => `${GATEWAY}/api/warehouse/exchange-requests/${id}/complete`,

        // Custodies
        CUSTODIES: `${GATEWAY}/api/warehouse/custodies`,
        CUSTODY_BY_ID: (id) => `${GATEWAY}/api/warehouse/custodies/${id}`,
        CUSTODY_BY_EMPLOYEE: (empId) => `${GATEWAY}/api/warehouse/custodies/employee/${empId}`,
        CUSTODY_BY_DEPARTMENT: (deptId) => `${GATEWAY}/api/warehouse/custodies/department/${deptId}`,
        CUSTODY_BY_TYPE: (type) => `${GATEWAY}/api/warehouse/custodies/type/${type}`,
        CUSTODY_PERSONAL: `${GATEWAY}/api/warehouse/custodies/personal`,
        CUSTODY_ADMINISTRATIVE: `${GATEWAY}/api/warehouse/custodies/administrative`,
        CUSTODY_TRANSFER: (id) => `${GATEWAY}/api/warehouse/custodies/${id}/transfer`,
        CUSTODY_RETURN: (id) => `${GATEWAY}/api/warehouse/custodies/${id}/return`,
        CUSTODY_ACCEPT_TRANSFER: (id) => `${GATEWAY}/api/warehouse/custodies/${id}/accept-transfer`,
        CUSTODY_REJECT_TRANSFER: (id) => `${GATEWAY}/api/warehouse/custodies/${id}/reject-transfer`,
        CUSTODY_SYNC_HR: `${GATEWAY}/api/warehouse/custodies/sync/hr`,
        CUSTODY_SYNC_ASSETS: `${GATEWAY}/api/warehouse/custodies/sync/assets`,
        CUSTODY_SYNC_FINANCE: `${GATEWAY}/api/warehouse/custodies/sync/finance`,
        CUSTODY_INTEGRATION_STATUS: `${GATEWAY}/api/warehouse/custodies/integration-status`,

        // Inventory Forms (الجرد)
        INVENTORY_FORMS: `${GATEWAY}/api/warehouse/inventory-forms`,
        INVENTORY_FORM_BY_ID: (id) => `${GATEWAY}/api/warehouse/inventory-forms/${id}`,
        INVENTORY_FORM_BY_NUMBER: (num) => `${GATEWAY}/api/warehouse/inventory-forms/number/${num}`,
        INVENTORY_FORM_BY_WAREHOUSE: (whId) => `${GATEWAY}/api/warehouse/inventory-forms/warehouse/${whId}`,
        INVENTORY_FORM_BY_TYPE: (type) => `${GATEWAY}/api/warehouse/inventory-forms/type/${type}`,
        INVENTORY_FORM_PENDING: `${GATEWAY}/api/warehouse/inventory-forms/pending`,
        INVENTORY_FORM_IN_PROGRESS: `${GATEWAY}/api/warehouse/inventory-forms/in-progress`,
        INVENTORY_FORM_COMPLETED: `${GATEWAY}/api/warehouse/inventory-forms/completed`,
        INVENTORY_FORM_START_COUNTING: (id) => `${GATEWAY}/api/warehouse/inventory-forms/${id}/start-counting`,
        INVENTORY_FORM_SUBMIT_COUNT: (id) => `${GATEWAY}/api/warehouse/inventory-forms/${id}/submit-count`,
        INVENTORY_FORM_COMPLETE_COUNTING: (id) => `${GATEWAY}/api/warehouse/inventory-forms/${id}/complete-counting`,
        INVENTORY_FORM_APPROVE: (id) => `${GATEWAY}/api/warehouse/inventory-forms/${id}/approve`,
        INVENTORY_FORM_DEVIATIONS: (id) => `${GATEWAY}/api/warehouse/inventory-forms/${id}/deviations`,
        INVENTORY_FORM_SETTLE_DEVIATION: (id) => `${GATEWAY}/api/warehouse/inventory-forms/${id}/settle-deviation`,
        INVENTORY_FORM_APPROVE_SETTLEMENT: (id) => `${GATEWAY}/api/warehouse/inventory-forms/${id}/approve-settlement`,

        // Suppliers
        SUPPLIERS: `${GATEWAY}/api/warehouse/suppliers`,
        SUPPLIER_BY_ID: (id) => `${GATEWAY}/api/warehouse/suppliers/${id}`,
        SUPPLIER_TRANSACTIONS: (id) => `${GATEWAY}/api/warehouse/suppliers/${id}/transactions`,

        // Stocktaking
        STOCKTAKING: `${GATEWAY}/api/warehouse/stocktaking`,
        STOCKTAKING_BY_ID: (id) => `${GATEWAY}/api/warehouse/stocktaking/${id}`,

        // Fixed Assets
        FIXED_ASSETS: `${GATEWAY}/api/warehouse/fixed-assets`,
        FIXED_ASSET_BY_ID: (id) => `${GATEWAY}/api/warehouse/fixed-assets/${id}`,
        DEPRECIATION: `${GATEWAY}/api/warehouse/depreciation`,

        // Transfer & Return Requests
        TRANSFER_REQUESTS: `${GATEWAY}/api/warehouse/transfer-requests`,
        TRANSFER_REQUEST_BY_ID: (id) => `${GATEWAY}/api/warehouse/transfer-requests/${id}`,
        RETURN_REQUESTS: `${GATEWAY}/api/warehouse/return-requests`,
        RETURN_REQUEST_BY_ID: (id) => `${GATEWAY}/api/warehouse/return-requests/${id}`,

        // Approval Chains
        APPROVAL_CHAINS: `${GATEWAY}/api/warehouse/approval-chains`,
        APPROVAL_CHAIN_BY_ID: (id) => `${GATEWAY}/api/warehouse/approval-chains/${id}`,
        APPROVAL_CHAIN_BY_TYPE: (type) => `${GATEWAY}/api/warehouse/approval-chains/type/${type}`,
        PENDING_APPROVALS: `${GATEWAY}/api/warehouse/approvals/pending`,
        APPROVE_REQUEST: (requestId, level) => `${GATEWAY}/api/warehouse/approvals/${requestId}/approve/${level}`,
        REJECT_REQUEST: (requestId) => `${GATEWAY}/api/warehouse/approvals/${requestId}/reject`,

        // Temp Receives
        TEMP_RECEIVES: `${GATEWAY}/api/warehouse/temp-receives`,
        TEMP_RECEIVE_BY_ID: (id) => `${GATEWAY}/api/warehouse/temp-receives/${id}`,
        TEMP_RECEIVE_BY_NUMBER: (num) => `${GATEWAY}/api/warehouse/temp-receives/number/${num}`,
        TEMP_RECEIVE_BY_PO: (poId) => `${GATEWAY}/api/warehouse/temp-receives/po/${poId}`,
        TEMP_RECEIVE_BY_SUPPLIER: (suppId) => `${GATEWAY}/api/warehouse/temp-receives/supplier/${suppId}`,
        TEMP_RECEIVE_PENDING: `${GATEWAY}/api/warehouse/temp-receives/pending`,
        TEMP_RECEIVE_INSPECTED: `${GATEWAY}/api/warehouse/temp-receives/inspected`,
        TEMP_RECEIVE_TRANSFER: (id) => `${GATEWAY}/api/warehouse/temp-receives/${id}/transfer`,
        TEMP_RECEIVE_APPROVE: (id) => `${GATEWAY}/api/warehouse/temp-receives/${id}/approve`,
        TEMP_RECEIVE_REJECT: (id) => `${GATEWAY}/api/warehouse/temp-receives/${id}/reject`,
        TEMP_RECEIVE_CANCEL: (id) => `${GATEWAY}/api/warehouse/temp-receives/${id}/cancel`,
        TEMP_RECEIVE_ASSIGN_COMMITTEE: (id) => `${GATEWAY}/api/warehouse/temp-receives/${id}/assign-committee`,
        TEMP_RECEIVE_SUBMIT_INSPECTION: (id) => `${GATEWAY}/api/warehouse/temp-receives/${id}/submit-inspection`,
        TEMP_RECEIVE_APPROVE_INSPECTION: (id) => `${GATEWAY}/api/warehouse/temp-receives/${id}/approve-inspection`,
        TEMP_RECEIVE_REJECT_INSPECTION: (id) => `${GATEWAY}/api/warehouse/temp-receives/${id}/reject-inspection`,
        TEMP_RECEIVE_CONVERT_TO_RECEIPT: (id) => `${GATEWAY}/api/warehouse/temp-receives/${id}/convert-to-receipt`,

        // Receipt Notes
        RECEIPT_NOTES: `${GATEWAY}/api/warehouse/receipt-notes`,
        RECEIPT_NOTE_BY_ID: (id) => `${GATEWAY}/api/warehouse/receipt-notes/${id}`,
        RECEIPT_NOTE_BY_NUMBER: (num) => `${GATEWAY}/api/warehouse/receipt-notes/number/${num}`,
        RECEIPT_NOTE_BY_WAREHOUSE: (whId) => `${GATEWAY}/api/warehouse/receipt-notes/warehouse/${whId}`,
        RECEIPT_NOTE_BY_TEMP_RECEIVE: (tempReceiveId) => `${GATEWAY}/api/warehouse/receipt-notes/by-temp-receive/${tempReceiveId}`,
        RECEIPT_NOTE_APPROVE: (id) => `${GATEWAY}/api/warehouse/receipt-notes/${id}/approve`,
        RECEIPT_NOTE_PROTOCOL: (id) => `${GATEWAY}/api/warehouse/receipt-notes/${id}/protocol`,
        RECEIPT_NOTE_PRINT: (id) => `${GATEWAY}/api/warehouse/receipt-notes/${id}/print`,

        // Integration APIs
        INTEGRATION: {
            HR_EMPLOYEES: `${GATEWAY}/api/warehouse/integration/hr/employees`,
            HR_EMPLOYEE: (empId) => `${GATEWAY}/api/warehouse/integration/hr/employees/${empId}`,
            HR_DEPARTMENTS: `${GATEWAY}/api/warehouse/integration/hr/departments`,
            FINANCE_JOURNAL_ENTRY: `${GATEWAY}/api/warehouse/integration/finance/journal-entry`,
            FINANCE_ASSET_REGISTER: `${GATEWAY}/api/warehouse/integration/finance/asset-register`,
            ASSETS_REGISTER: `${GATEWAY}/api/warehouse/integration/assets/register`,
            ASSETS_DEPRECIATION: `${GATEWAY}/api/warehouse/integration/assets/depreciation`,
            TECH_SUPPORT_TICKET: `${GATEWAY}/api/warehouse/integration/tech-support/ticket`,
        },

        // Reports
        REPORTS: `${GATEWAY}/api/warehouse/reports`,
        REPORT_STOCK: `${GATEWAY}/api/warehouse/reports/stock`,
        REPORT_MOVEMENTS: `${GATEWAY}/api/warehouse/reports/movements`,
        REPORT_CUSTODIES: `${GATEWAY}/api/warehouse/reports/custodies`,
        REPORT_INVENTORY: `${GATEWAY}/api/warehouse/reports/inventory`,
        REPORT_DEVIATIONS: `${GATEWAY}/api/warehouse/reports/deviations`,
        REPORT_ITEMS_BY_TYPE: `${GATEWAY}/api/warehouse/reports/items-by-type`,
        REPORT_EXCHANGE_REQUESTS: `${GATEWAY}/api/warehouse/reports/exchange-requests`,
        REPORT_APPROVAL_CHAIN: `${GATEWAY}/api/warehouse/reports/approval-chain`,
    },

    // ============================================
    // Movement Module APIs
    // ============================================
    MOVEMENT: {
        DASHBOARD: `${GATEWAY}/api/movement/dashboard`,

        // Vehicles
        VEHICLES: `${GATEWAY}/api/movement/vehicles`,
        VEHICLE_BY_ID: (id) => `${GATEWAY}/api/movement/vehicles/${id}`,
        VEHICLE_ACTIVE: `${GATEWAY}/api/movement/vehicles/active`,
        VEHICLE_NEEDS_MAINTENANCE: `${GATEWAY}/api/movement/vehicles/needs-maintenance`,
        VEHICLE_ASSIGN_DRIVER: (id) => `${GATEWAY}/api/movement/vehicles/${id}/assign-driver`,
        VEHICLE_UNASSIGN_DRIVER: (id) => `${GATEWAY}/api/movement/vehicles/${id}/unassign-driver`,

        // Drivers
        DRIVERS: `${GATEWAY}/api/movement/drivers`,
        DRIVER_BY_ID: (id) => `${GATEWAY}/api/movement/drivers/${id}`,
        DRIVER_ACTIVE: `${GATEWAY}/api/movement/drivers/active`,
        DRIVER_AVAILABLE: `${GATEWAY}/api/movement/drivers/available`,
        DRIVER_EXPIRING_LICENSES: `${GATEWAY}/api/movement/drivers/expiring-licenses`,
        DRIVER_MISSIONS: (id) => `${GATEWAY}/api/movement/drivers/${id}/missions`,

        // Missions
        MISSIONS: `${GATEWAY}/api/movement/missions`,
        MISSION_BY_ID: (id) => `${GATEWAY}/api/movement/missions/${id}`,
        MISSION_PENDING: `${GATEWAY}/api/movement/missions/pending`,
        MISSION_IN_PROGRESS: `${GATEWAY}/api/movement/missions/in-progress`,
        MISSION_BY_VEHICLE: (vehicleId) => `${GATEWAY}/api/movement/missions/vehicle/${vehicleId}`,
        MISSION_BY_DRIVER: (driverId) => `${GATEWAY}/api/movement/missions/driver/${driverId}`,
        MISSION_START: (id) => `${GATEWAY}/api/movement/missions/${id}/start`,
        MISSION_COMPLETE: (id) => `${GATEWAY}/api/movement/missions/${id}/complete`,

        // Maintenance
        MAINTENANCE: `${GATEWAY}/api/movement/maintenance`,
        MAINTENANCE_BY_ID: (id) => `${GATEWAY}/api/movement/maintenance/${id}`,
        MAINTENANCE_BY_VEHICLE: (vehicleId) => `${GATEWAY}/api/movement/maintenance/vehicle/${vehicleId}`,
        MAINTENANCE_SCHEDULED: `${GATEWAY}/api/movement/maintenance/scheduled`,
        MAINTENANCE_OVERDUE: `${GATEWAY}/api/movement/maintenance/overdue`,
        MAINTENANCE_COMPLETE: (id) => `${GATEWAY}/api/movement/maintenance/${id}/complete`,

        // Fuel
        FUEL: `${GATEWAY}/api/movement/fuel`,
        FUEL_BY_ID: (id) => `${GATEWAY}/api/movement/fuel/${id}`,
        FUEL_BY_VEHICLE: (vehicleId) => `${GATEWAY}/api/movement/fuel/vehicle/${vehicleId}`,
        FUEL_SUMMARY: `${GATEWAY}/api/movement/fuel/summary`,

        // Tracking
        TRACKING_VEHICLES: `${GATEWAY}/api/movement/tracking/vehicles`,
        TRACKING_VEHICLE: (id) => `${GATEWAY}/api/movement/tracking/vehicles/${id}`,
        TRACKING_VEHICLE_HISTORY: (id) => `${GATEWAY}/api/movement/tracking/vehicles/${id}/history`,
        TRACKING_DEVICE: (deviceId) => `${GATEWAY}/api/movement/tracking/devices/${deviceId}`,
    },

    // ============================================
    // Archiving Module APIs
    // ============================================
    ARCHIVING: {
        DASHBOARD: `${GATEWAY}/api/archiving/dashboard`,
        DASHBOARD_SUMMARY: `${GATEWAY}/api/archiving/dashboard/summary`,
        RECENT_DOCUMENTS: `${GATEWAY}/api/archiving/recent-documents`,
        RECENT_ACTIVITIES: `${GATEWAY}/api/archiving/recent-activities`,
        STORAGE_STATS: `${GATEWAY}/api/archiving/storage-stats`,

        // Documents
        DOCUMENTS: `${GATEWAY}/api/archiving/documents`,
        DOCUMENT_BY_ID: (id) => `${GATEWAY}/api/archiving/documents/${id}`,
        DOCUMENT_BY_BARCODE: (barcode) => `${GATEWAY}/api/archiving/documents/barcode/${barcode}`,
        DOCUMENT_BY_CABINET: (cabinetId) => `${GATEWAY}/api/archiving/documents/cabinet/${cabinetId}`,
        DOCUMENT_SEARCH: `${GATEWAY}/api/archiving/documents/search`,
        DOCUMENT_UPLOAD: `${GATEWAY}/api/archiving/documents/upload`,
        DOCUMENT_VERSIONS: (id) => `${GATEWAY}/api/archiving/documents/${id}/versions`,
        DOCUMENT_VERSION: (id, versionId) => `${GATEWAY}/api/archiving/documents/${id}/versions/${versionId}`,
        DOCUMENT_WITH_VERSIONS: (id) => `${GATEWAY}/api/archiving/documents/${id}/with-versions`,
        DOCUMENT_ANNOTATIONS: (id) => `${GATEWAY}/api/archiving/documents/${id}/annotations`,
        DOCUMENT_ANNOTATION_BY_ID: (docId, annId) => `${GATEWAY}/api/archiving/documents/${docId}/annotations/${annId}`,
        DOCUMENT_SHARES: (id) => `${GATEWAY}/api/archiving/documents/${id}/shares`,
        DOCUMENT_SHARE_BY_ID: (docId, shareId) => `${GATEWAY}/api/archiving/documents/${docId}/shares/${shareId}`,
        DOCUMENT_STATS_BY_STATUS: `${GATEWAY}/api/archiving/documents/stats/by-status`,
        DOCUMENT_STATS_BY_CABINET: `${GATEWAY}/api/archiving/documents/stats/by-cabinet`,
        DOCUMENT_STORAGE_SIZE: `${GATEWAY}/api/archiving/documents/storage-size`,

        // Transactions
        TRANSACTIONS: `${GATEWAY}/api/archiving/transactions`,
        TRANSACTION_BY_ID: (id) => `${GATEWAY}/api/archiving/transactions/${id}`,
        TRANSACTION_BY_BARCODE: (barcode) => `${GATEWAY}/api/archiving/transactions/barcode/${barcode}`,
        TRANSACTION_BY_REFERENCE: (ref) => `${GATEWAY}/api/archiving/transactions/reference/${ref}`,
        TRANSACTIONS_SEARCH: `${GATEWAY}/api/archiving/transactions/search`,
        TRANSACTIONS_BY_STATUS: (status) => `${GATEWAY}/api/archiving/transactions/status/${status}`,
        TRANSACTIONS_BY_CLASSIFICATION: (classId) => `${GATEWAY}/api/archiving/transactions/classification/${classId}`,
        TRANSACTIONS_READY: `${GATEWAY}/api/archiving/transactions/ready`,
        TRANSACTIONS_ARCHIVED: `${GATEWAY}/api/archiving/transactions/archived`,
        TRANSACTIONS_EXPIRED: `${GATEWAY}/api/archiving/transactions/expired`,
        TRANSACTIONS_STATS_BY_STATUS: `${GATEWAY}/api/archiving/transactions/stats/by-status`,
        TRANSACTIONS_STATS_BY_CLASSIFICATION: `${GATEWAY}/api/archiving/transactions/stats/by-classification`,
        TRANSACTION_ARCHIVE_TO_NCAR: (id) => `${GATEWAY}/api/archiving/transactions/${id}/archive-to-ncar`,

        // Classifications
        CLASSIFICATIONS: `${GATEWAY}/api/archiving/classifications`,
        CLASSIFICATION_BY_ID: (id) => `${GATEWAY}/api/archiving/classifications/${id}`,
        CLASSIFICATION_BY_CODE: (code) => `${GATEWAY}/api/archiving/classifications/code/${code}`,
        CLASSIFICATIONS_ROOT: `${GATEWAY}/api/archiving/classifications/root`,
        CLASSIFICATION_SUBS: (id) => `${GATEWAY}/api/archiving/classifications/${id}/subs`,

        // Cabinets
        CABINETS: `${GATEWAY}/api/archiving/cabinets`,
        CABINET_BY_ID: (id) => `${GATEWAY}/api/archiving/cabinets/${id}`,
        CABINET_BY_CODE: (code) => `${GATEWAY}/api/archiving/cabinets/code/${code}`,
        CABINET_STATISTICS: (id) => `${GATEWAY}/api/archiving/cabinets/${id}/statistics`,

        // Physical Locations
        PHYSICAL_LOCATIONS: `${GATEWAY}/api/archiving/physical-locations`,
        PHYSICAL_LOCATION_BY_ID: (id) => `${GATEWAY}/api/archiving/physical-locations/${id}`,

        // Retention Policies
        RETENTION_POLICIES: `${GATEWAY}/api/archiving/retention-policies`,
        RETENTION_BY_ID: (id) => `${GATEWAY}/api/archiving/retention-policies/${id}`,

        // Hot Folders
        HOT_FOLDERS: `${GATEWAY}/api/archiving/hot-folders`,
        HOT_FOLDER_BY_ID: (id) => `${GATEWAY}/api/archiving/hot-folders/${id}`,
        HOT_FOLDER_PROCESS: (id) => `${GATEWAY}/api/archiving/hot-folders/${id}/process`,

        // Workflows
        WORKFLOWS: `${GATEWAY}/api/archiving/workflows`,
        WORKFLOW_BY_ID: (id) => `${GATEWAY}/api/archiving/workflows/${id}`,
        WORKFLOW_STEPS: (id) => `${GATEWAY}/api/archiving/workflows/${id}/steps`,
        WORKFLOW_START: (id) => `${GATEWAY}/api/archiving/workflows/${id}/start`,
        WORKFLOW_TASKS: `${GATEWAY}/api/archiving/workflow-tasks`,
        WORKFLOW_TASK_BY_ID: (id) => `${GATEWAY}/api/archiving/workflow-tasks/${id}`,
        WORKFLOW_TASKS_PENDING: `${GATEWAY}/api/archiving/workflow-tasks/pending`,
        WORKFLOW_TASKS_MY: `${GATEWAY}/api/archiving/workflow-tasks/my`,
        WORKFLOW_TASK_COMPLETE: (id) => `${GATEWAY}/api/archiving/workflow-tasks/${id}/complete`,
        WORKFLOW_TASK_REJECT: (id) => `${GATEWAY}/api/archiving/workflow-tasks/${id}/reject`,
        WORKFLOW_TASK_REASSIGN: (id) => `${GATEWAY}/api/archiving/workflow-tasks/${id}/reassign`,

        // Audit Log
        AUDIT_LOG: `${GATEWAY}/api/archiving/audit-log`,
        AUDIT_LOG_BY_ENTITY: (entityType, entityId) => `${GATEWAY}/api/archiving/audit-log/${entityType}/${entityId}`,
        AUDIT_LOG_SEARCH: `${GATEWAY}/api/archiving/audit-log/search`,
        AUDIT_LOG_VERIFY_CHAIN: `${GATEWAY}/api/archiving/audit-log/verify-chain`,

        // Reports
        REPORTS: `${GATEWAY}/api/archiving/reports`,
        REPORT_DOCUMENT_ACTIVITY: `${GATEWAY}/api/archiving/reports/document-activity`,
        REPORT_USER_ACTIVITY: `${GATEWAY}/api/archiving/reports/user-activity`,
        REPORT_STORAGE_USAGE: `${GATEWAY}/api/archiving/reports/storage-usage`,
        REPORT_WORKFLOW_STATUS: `${GATEWAY}/api/archiving/reports/workflow-status`,
    },

    // ============================================
    // Finance Module APIs
    // ============================================
    FINANCE: {
        DASHBOARD: `${GATEWAY}/api/finance/dashboard`,
        DASHBOARD_SUMMARY: `${GATEWAY}/api/finance/dashboard/summary`,
        CHART_OF_ACCOUNTS: `${GATEWAY}/api/finance/chart-of-accounts`,
        ACCOUNT_BY_CODE: (code) => `${GATEWAY}/api/finance/chart-of-accounts/${code}`,

        // General Ledger (GL)
        GL: {
            ACCOUNTS: `${GATEWAY}/api/finance/gl/accounts`,
            ACCOUNT_BY_ID: (id) => `${GATEWAY}/api/finance/gl/accounts/${id}`,
            ACCOUNTS_TREE: `${GATEWAY}/api/finance/gl/accounts/tree`,
            ACCOUNT_CHILDREN: (id) => `${GATEWAY}/api/finance/gl/accounts/${id}/children`,
            ACCOUNT_STATEMENT: (id) => `${GATEWAY}/api/finance/gl/accounts/${id}/statement`,
            JOURNALS: `${GATEWAY}/api/finance/gl/journals`,
            JOURNAL_BY_ID: (id) => `${GATEWAY}/api/finance/gl/journals/${id}`,
            JOURNAL_POST: (id) => `${GATEWAY}/api/finance/gl/journals/${id}/post`,
            JOURNAL_REVERSE: (id) => `${GATEWAY}/api/finance/gl/journals/${id}/reverse`,
            PERIODS: `${GATEWAY}/api/finance/gl/periods`,
            PERIOD_BY_ID: (id) => `${GATEWAY}/api/finance/gl/periods/${id}`,
            PERIOD_OPEN: (id) => `${GATEWAY}/api/finance/gl/periods/${id}/open`,
            PERIOD_CLOSE: (id) => `${GATEWAY}/api/finance/gl/periods/${id}/close`,
            COST_CENTERS: `${GATEWAY}/api/finance/gl/cost-centers`,
            COST_CENTER_BY_ID: (id) => `${GATEWAY}/api/finance/gl/cost-centers/${id}`,
            TRIAL_BALANCE: `${GATEWAY}/api/finance/gl/reports/trial-balance`,
            INCOME_STATEMENT: `${GATEWAY}/api/finance/gl/reports/income-statement`,
            BALANCE_SHEET: `${GATEWAY}/api/finance/gl/reports/balance-sheet`,
            LEDGER: `${GATEWAY}/api/finance/gl/reports/ledger`,
            JOURNAL_REPORT: `${GATEWAY}/api/finance/gl/reports/journal-report`,
        },

        // Accounts Payable (AP)
        AP: {
            VENDORS: `${GATEWAY}/api/finance/ap/vendors`,
            VENDOR_BY_ID: (id) => `${GATEWAY}/api/finance/ap/vendors/${id}`,
            VENDOR_STATEMENT: (id) => `${GATEWAY}/api/finance/ap/vendors/${id}/statement`,
            INVOICES: `${GATEWAY}/api/finance/ap/invoices`,
            INVOICE_BY_ID: (id) => `${GATEWAY}/api/finance/ap/invoices/${id}`,
            INVOICE_APPROVE: (id) => `${GATEWAY}/api/finance/ap/invoices/${id}/approve`,
            INVOICE_MATCH: (id) => `${GATEWAY}/api/finance/ap/invoices/${id}/match`,
            PAYMENTS: `${GATEWAY}/api/finance/ap/payments`,
            PAYMENT_BY_ID: (id) => `${GATEWAY}/api/finance/ap/payments/${id}`,
            PAYMENT_APPROVE: (id) => `${GATEWAY}/api/finance/ap/payments/${id}/approve`,
            PAYMENT_EXECUTE: (id) => `${GATEWAY}/api/finance/ap/payments/${id}/execute`,
            AGING_REPORT: `${GATEWAY}/api/finance/ap/reports/aging`,
        },

        // Budget Management
        BUDGET: {
            BUDGETS: `${GATEWAY}/api/finance/budget/budgets`,
            BUDGET_BY_ID: (id) => `${GATEWAY}/api/finance/budget/budgets/${id}`,
            BUDGET_APPROVE: (id) => `${GATEWAY}/api/finance/budget/budgets/${id}/approve`,
            BUDGET_LINES: (id) => `${GATEWAY}/api/finance/budget/budgets/${id}/lines`,
            BUDGET_AVAILABILITY: `${GATEWAY}/api/finance/budget/availability`,
            ENCUMBRANCES: `${GATEWAY}/api/finance/budget/encumbrances`,
            ENCUMBRANCE_BY_ID: (id) => `${GATEWAY}/api/finance/budget/encumbrances/${id}`,
            ENCUMBRANCE_CONSUME: (id) => `${GATEWAY}/api/finance/budget/encumbrances/${id}/consume`,
            ENCUMBRANCE_RELEASE: (id) => `${GATEWAY}/api/finance/budget/encumbrances/${id}/release`,
            TRANSFERS: `${GATEWAY}/api/finance/budget/transfers`,
            TRANSFER_BY_ID: (id) => `${GATEWAY}/api/finance/budget/transfers/${id}`,
            TRANSFER_APPROVE: (id) => `${GATEWAY}/api/finance/budget/transfers/${id}/approve`,
            EXECUTION_REPORT: `${GATEWAY}/api/finance/budget/reports/execution`,
        },

        // Wallet - محفظة التعزيزات المالية
        WALLET: {
            BASE: `${GATEWAY}/api/finance/wallet`,
            TRANSACTIONS: `${GATEWAY}/api/finance/wallet/transactions`,
            TRANSACTION_BY_ID: (id) => `${GATEWAY}/api/finance/wallet/transactions/${id}`,
            COMMIT: `${GATEWAY}/api/finance/wallet/commit`,
            RELEASE: (txnId) => `${GATEWAY}/api/finance/wallet/transactions/${txnId}/release`,
            TOPUP: `${GATEWAY}/api/finance/wallet/topup`,
            SETTINGS: `${GATEWAY}/api/finance/wallet/settings`,
            SUMMARY: `${GATEWAY}/api/finance/wallet/summary`,
            CHECK_AVAILABILITY: `${GATEWAY}/api/finance/wallet/check-availability`,
            CAN_ISSUE_DECISION: `${GATEWAY}/api/finance/wallet/can-issue-decision`,
        },

        // Fixed Assets
        ASSETS: {
            LIST: `${GATEWAY}/api/finance/assets`,
            BY_ID: (id) => `${GATEWAY}/api/finance/assets/${id}`,
            CATEGORIES: `${GATEWAY}/api/finance/assets/categories`,
            CATEGORY_BY_ID: (id) => `${GATEWAY}/api/finance/assets/categories/${id}`,
            DEPRECIATION: `${GATEWAY}/api/finance/assets/depreciation`,
            DEPRECIATION_RUN: `${GATEWAY}/api/finance/assets/depreciation/run`,
            DEPRECIATION_SCHEDULE: (id) => `${GATEWAY}/api/finance/assets/${id}/depreciation-schedule`,
            DISPOSE: (id) => `${GATEWAY}/api/finance/assets/${id}/dispose`,
        },

        // Procurement
        PROCUREMENT: {
            REQUESTS: `${GATEWAY}/api/finance/procurement/requests`,
            REQUEST_BY_ID: (id) => `${GATEWAY}/api/finance/procurement/requests/${id}`,
            REQUEST_SUBMIT: (id) => `${GATEWAY}/api/finance/procurement/requests/${id}/submit`,
            REQUEST_APPROVE: (id) => `${GATEWAY}/api/finance/procurement/requests/${id}/approve`,
            REQUEST_REJECT: (id) => `${GATEWAY}/api/finance/procurement/requests/${id}/reject`,
            ORDERS: `${GATEWAY}/api/finance/procurement/orders`,
            ORDER_BY_ID: (id) => `${GATEWAY}/api/finance/procurement/orders/${id}`,
            ORDER_FROM_REQUEST: (reqId) => `${GATEWAY}/api/finance/procurement/orders/from-request/${reqId}`,
            ORDER_ISSUE: (id) => `${GATEWAY}/api/finance/procurement/orders/${id}/issue`,
            GOODS_RECEIPTS: `${GATEWAY}/api/finance/procurement/goods-receipts`,
            GOODS_RECEIPT_BY_ID: (id) => `${GATEWAY}/api/finance/procurement/goods-receipts/${id}`,
            CONTRACTS: `${GATEWAY}/api/finance/procurement/contracts`,
            CONTRACT_BY_ID: (id) => `${GATEWAY}/api/finance/procurement/contracts/${id}`,
            CONTRACT_MILESTONES: (id) => `${GATEWAY}/api/finance/procurement/contracts/${id}/milestones`,
            CONTRACT_PROGRESS: (id) => `${GATEWAY}/api/finance/procurement/contracts/${id}/progress`,
        },

        // Treasury
        TREASURY: {
            BANK_ACCOUNTS: `${GATEWAY}/api/finance/treasury/bank-accounts`,
            BANK_ACCOUNT_BY_ID: (id) => `${GATEWAY}/api/finance/treasury/bank-accounts/${id}`,
            BANK_ACCOUNT_STATEMENT: (id) => `${GATEWAY}/api/finance/treasury/bank-accounts/${id}/statement`,
            TRANSACTIONS: `${GATEWAY}/api/finance/treasury/transactions`,
            TRANSACTION_BY_ID: (id) => `${GATEWAY}/api/finance/treasury/transactions/${id}`,
            CASH_POSITION: `${GATEWAY}/api/finance/treasury/cash-position`,
            CASH_FORECAST: `${GATEWAY}/api/finance/treasury/cash-forecast`,
            RECONCILIATIONS: `${GATEWAY}/api/finance/treasury/reconciliations`,
            RECONCILIATION_BY_ID: (id) => `${GATEWAY}/api/finance/treasury/reconciliations/${id}`,
            RECONCILIATION_ITEMS: (id) => `${GATEWAY}/api/finance/treasury/reconciliations/${id}/items`,
            RECONCILIATION_RECONCILE: (id) => `${GATEWAY}/api/finance/treasury/reconciliations/${id}/reconcile`,
        },

        // Reports
        REPORTS: {
            FINANCIAL_SUMMARY: `${GATEWAY}/api/finance/reports/financial-summary`,
            BUDGET_VS_ACTUAL: `${GATEWAY}/api/finance/reports/budget-vs-actual`,
            CASH_FLOW: `${GATEWAY}/api/finance/reports/cash-flow`,
        },
    },

    // ============================================
    // Sadad Module APIs
    // ============================================
    SADAD: {
        DASHBOARD: `${GATEWAY}/api/sadad/dashboard`,
        PAYMENTS: `${GATEWAY}/api/sadad/payments`,
        INVOICES: `${GATEWAY}/api/sadad/invoices`,
    },

    // ============================================
    // EPM Module APIs
    // ============================================
    EPM: {
        DASHBOARD: `${GATEWAY}/api/epm/summary`,
        DASHBOARD_SUMMARY: `${GATEWAY}/api/epm/summary`,
        HEALTH: `${GATEWAY}/api/epm/health`,
        STANDARDS: `${GATEWAY}/api/epm/standards`,
        EMPLOYEES: `${GATEWAY}/api/epm/integrations/hr/employees`,
        EMPLOYEE_BY_SOURCE_ID: (id) => `${GATEWAY}/api/epm/integrations/hr/employees/${id}`,
        HR_SYNC: `${GATEWAY}/api/epm/integrations/hr/sync`,

        // Charters
        CHARTERS: `${GATEWAY}/api/epm/charters`,
        CHARTER_BY_ID: (id) => `${GATEWAY}/api/epm/charters/${id}`,
        CHARTER_BY_EMPLOYEE: (empId) => `${GATEWAY}/api/epm/charters/employee/${empId}`,
        CHARTERS_ACTIVE: `${GATEWAY}/api/epm/charters/active`,
        CHARTER_SUBMIT: (id) => `${GATEWAY}/api/epm/charters/${id}/submit`,
        CHARTER_APPROVE: (id) => `${GATEWAY}/api/epm/charters/${id}/approve`,
        CHARTER_REJECT: (id) => `${GATEWAY}/api/epm/charters/${id}/reject`,
        CHARTER_SCORE: (id) => `${GATEWAY}/api/epm/charters/${id}/score`,

        // Goals
        GOALS: `${GATEWAY}/api/epm/goals`,
        GOAL_BY_ID: (id) => `${GATEWAY}/api/epm/goals/${id}`,
        GOALS_BY_EMPLOYEE: (empId) => `${GATEWAY}/api/epm/goals/employee/${empId}`,
        GOALS_BY_CHARTER: (charterId) => `${GATEWAY}/api/epm/goals/charter/${charterId}`,
        GOAL_PROGRESS: (id) => `${GATEWAY}/api/epm/goals/${id}/progress`,
        GOALS_VALIDATE_WEIGHTS: `${GATEWAY}/api/epm/goals/validate-weights`,

        // Competencies
        COMPETENCIES: `${GATEWAY}/api/epm/competencies`,
        COMPETENCY_BY_ID: (id) => `${GATEWAY}/api/epm/competencies/${id}`,
        COMPETENCIES_BY_CHARTER: (charterId) => `${GATEWAY}/api/epm/competencies/charter/${charterId}`,

        // Excellence
        EXCELLENCE: `${GATEWAY}/api/epm/excellence`,
        EXCELLENCE_BY_ID: (id) => `${GATEWAY}/api/epm/excellence/${id}`,

        // Reviews
        REVIEWS: `${GATEWAY}/api/epm/reviews`,
        REVIEW_BY_ID: (id) => `${GATEWAY}/api/epm/reviews/${id}`,
        REVIEWS_BY_CHARTER: (charterId) => `${GATEWAY}/api/epm/reviews/charter/${charterId}`,
        REVIEWS_PENDING: `${GATEWAY}/api/epm/reviews/pending`,
        REVIEW_SUBMIT: (id) => `${GATEWAY}/api/epm/reviews/${id}/submit`,
        REVIEW_ACKNOWLEDGE: (id) => `${GATEWAY}/api/epm/reviews/${id}/acknowledge`,
        REVIEW_APPEAL: (id) => `${GATEWAY}/api/epm/reviews/${id}/appeal`,

        // KPIs
        KPIS: `${GATEWAY}/api/epm/kpis`,
        KPI_BY_ID: (id) => `${GATEWAY}/api/epm/kpis/${id}`,
        KPI_MEASURE: (id) => `${GATEWAY}/api/epm/kpis/${id}/measure`,
        KPIS_BY_CHARTER: (charterId) => `${GATEWAY}/api/epm/kpis/charter/${charterId}`,

        // Reports
        REPORT_PERFORMANCE: `${GATEWAY}/api/epm/reports/performance`,
        REPORT_DEPARTMENT: `${GATEWAY}/api/epm/reports/department`,
        REPORT_ANNUAL: `${GATEWAY}/api/epm/reports/annual`,
    },

    // ============================================
    // ITSM Module APIs
    // ============================================
    ITSM: {
        DASHBOARD: `${GATEWAY}/api/itsm/dashboard`,
        DASHBOARD_SUMMARY: `${GATEWAY}/api/itsm/dashboard/summary`,

        // Tickets
        TICKETS: {
            LIST: `${GATEWAY}/api/itsm/tickets`,
            BY_ID: (id) => `${GATEWAY}/api/itsm/tickets/${id}`,
            MY_TICKETS: `${GATEWAY}/api/itsm/tickets/my`,
            ASSIGNED: `${GATEWAY}/api/itsm/tickets/assigned`,
            PENDING: `${GATEWAY}/api/itsm/tickets/pending`,
            COMMENTS: (id) => `${GATEWAY}/api/itsm/tickets/${id}/comments`,
            ATTACHMENTS: (id) => `${GATEWAY}/api/itsm/tickets/${id}/attachments`,
            HISTORY: (id) => `${GATEWAY}/api/itsm/tickets/${id}/history`,
            ASSIGN: (id) => `${GATEWAY}/api/itsm/tickets/${id}/assign`,
            START: (id) => `${GATEWAY}/api/itsm/tickets/${id}/start`,
            RESOLVE: (id) => `${GATEWAY}/api/itsm/tickets/${id}/resolve`,
            CLOSE: (id) => `${GATEWAY}/api/itsm/tickets/${id}/close`,
            REOPEN: (id) => `${GATEWAY}/api/itsm/tickets/${id}/reopen`,
            ESCALATE: (id) => `${GATEWAY}/api/itsm/tickets/${id}/escalate`,
        },

        // Categories
        CATEGORIES: {
            LIST: `${GATEWAY}/api/itsm/categories`,
            BY_ID: (id) => `${GATEWAY}/api/itsm/categories/${id}`,
        },

        // Assets
        ASSETS: {
            LIST: `${GATEWAY}/api/itsm/assets`,
            BY_ID: (id) => `${GATEWAY}/api/itsm/assets/${id}`,
            MY_ASSETS: `${GATEWAY}/api/itsm/assets/my`,
            BY_EMPLOYEE: (empId) => `${GATEWAY}/api/itsm/assets/employee/${empId}`,
            STATUS: (id) => `${GATEWAY}/api/itsm/assets/${id}/status`,
            MAINTENANCE: (id) => `${GATEWAY}/api/itsm/assets/${id}/maintenance`,
        },

        // Specialists
        SPECIALISTS: {
            LIST: `${GATEWAY}/api/itsm/specialists`,
            BY_ID: (id) => `${GATEWAY}/api/itsm/specialists/${id}`,
            AVAILABLE: `${GATEWAY}/api/itsm/specialists/available`,
            SPECIALTIES: `${GATEWAY}/api/itsm/specialists/specialties`,
            WORKLOAD: `${GATEWAY}/api/itsm/specialists/workload`,
            PERFORMANCE: (id) => `${GATEWAY}/api/itsm/specialists/${id}/performance`,
        },

        // Quick Support
        QUICK_SUPPORT: {
            CREATE: `${GATEWAY}/api/itsm/quick-support`,
            STATUS: (id) => `${GATEWAY}/api/itsm/quick-support/${id}/status`,
            RATE: (id) => `${GATEWAY}/api/itsm/quick-support/${id}/rate`,
            MY_ASSETS: `${GATEWAY}/api/itsm/quick-support/my-assets`,
        },

        // Settings
        SETTINGS: {
            ALL: `${GATEWAY}/api/itsm/settings`,
            BY_KEY: (key) => `${GATEWAY}/api/itsm/settings/${key}`,
            SLA: `${GATEWAY}/api/itsm/settings/sla`,
            PRIORITIES: `${GATEWAY}/api/itsm/settings/priorities`,
        },

        // Reports
        REPORTS: {
            STATISTICS: `${GATEWAY}/api/itsm/reports/statistics`,
            BY_CATEGORY: `${GATEWAY}/api/itsm/reports/by-category`,
            PERFORMANCE: `${GATEWAY}/api/itsm/reports/performance`,
            SLA: `${GATEWAY}/api/itsm/reports/sla`,
            ASSETS: `${GATEWAY}/api/itsm/reports/assets`,
        },
    },

    // ============================================
    // Analytics Module APIs
    // ============================================
    ANALYTICS: {
        DASHBOARD: `${GATEWAY}/api/analytics/dashboard`,
        REPORTS: `${GATEWAY}/api/analytics/reports`,
    },

    // ============================================
    // Projects Module APIs
    // ============================================
    PROJECTS: {
        DASHBOARD: `${GATEWAY}/api/projects/dashboard`,
        LIST: `${GATEWAY}/api/projects`,
        BY_ID: (id) => `${GATEWAY}/api/projects/${id}`,
        BY_CODE: (code) => `${GATEWAY}/api/projects/code/${code}`,
        BY_DEPARTMENT: (deptId) => `${GATEWAY}/api/projects/department/${deptId}`,
        BY_MANAGER: (managerId) => `${GATEWAY}/api/projects/manager/${managerId}`,
        BY_EMPLOYEE: (empId) => `${GATEWAY}/api/projects/employee/${empId}`,
        ARCHIVE: (id) => `${GATEWAY}/api/projects/${id}/archive`,
        ACTIVITIES: (id) => `${GATEWAY}/api/projects/${id}/activities`,

        // Members
        MEMBERS: (id) => `${GATEWAY}/api/projects/${id}/members`,
        MEMBER_BY_ID: (projectId, memberId) => `${GATEWAY}/api/projects/${projectId}/members/${memberId}`,
        MEMBER_ROLE: (projectId, memberId) => `${GATEWAY}/api/projects/${projectId}/members/${memberId}/role`,

        // Milestones
        MILESTONES: (id) => `${GATEWAY}/api/projects/${id}/milestones`,
        MILESTONE_BY_ID: (projectId, milestoneId) => `${GATEWAY}/api/projects/${projectId}/milestones/${milestoneId}`,
        MILESTONE_COMPLETE: (projectId, milestoneId) => `${GATEWAY}/api/projects/${projectId}/milestones/${milestoneId}/complete`,

        // Categories
        CATEGORIES: {
            LIST: `${GATEWAY}/api/projects/categories`,
            BY_ID: (id) => `${GATEWAY}/api/projects/categories/${id}`,
        },

        // Tasks
        TASKS: {
            LIST: `${GATEWAY}/api/projects/tasks`,
            BY_ID: (id) => `${GATEWAY}/api/projects/tasks/${id}`,
            BY_CODE: (code) => `${GATEWAY}/api/projects/tasks/code/${code}`,
            MY_TASKS: `${GATEWAY}/api/projects/tasks/my`,
            OVERDUE: `${GATEWAY}/api/projects/tasks/overdue`,
            UPCOMING: `${GATEWAY}/api/projects/tasks/upcoming`,
            KANBAN: (projectId) => `${GATEWAY}/api/projects/${projectId}/tasks/kanban`,
            ASSIGN: (id) => `${GATEWAY}/api/projects/tasks/${id}/assign`,
            UNASSIGN: (id) => `${GATEWAY}/api/projects/tasks/${id}/unassign`,
            COMPLETE: (id) => `${GATEWAY}/api/projects/tasks/${id}/complete`,
            REOPEN: (id) => `${GATEWAY}/api/projects/tasks/${id}/reopen`,
            MOVE: (id) => `${GATEWAY}/api/projects/tasks/${id}/move`,
            ASSIGNMENTS: (id) => `${GATEWAY}/api/projects/tasks/${id}/assignments`,
            COMMENTS: (id) => `${GATEWAY}/api/projects/tasks/${id}/comments`,
            COMMENT_BY_ID: (taskId, commentId) => `${GATEWAY}/api/projects/tasks/${taskId}/comments/${commentId}`,
            CHECKLISTS: (id) => `${GATEWAY}/api/projects/tasks/${id}/checklists`,
            CHECKLIST_BY_ID: (taskId, checklistId) => `${GATEWAY}/api/projects/tasks/${taskId}/checklists/${checklistId}`,
            CHECKLIST_TOGGLE: (taskId, checklistId) => `${GATEWAY}/api/projects/tasks/${taskId}/checklists/${checklistId}/toggle`,
            TIMELOGS: (id) => `${GATEWAY}/api/projects/tasks/${id}/timelogs`,
            TIMELOGS_TOTAL: (id) => `${GATEWAY}/api/projects/tasks/${id}/timelogs/total`,
        },
    },

    // ============================================
    // Announcements Module APIs
    // ============================================
    ANNOUNCEMENTS: {
        LIST: `${GATEWAY}/api/announcements`,
        BY_ID: (id) => `${GATEWAY}/api/announcements/${id}`,
        CREATE: `${GATEWAY}/api/announcements`,
        UPDATE: (id) => `${GATEWAY}/api/announcements/${id}`,
        DELETE: (id) => `${GATEWAY}/api/announcements/${id}`,
        PUBLISH: (id) => `${GATEWAY}/api/announcements/${id}/publish`,
        UNPUBLISH: (id) => `${GATEWAY}/api/announcements/${id}/unpublish`,
        ARCHIVE: (id) => `${GATEWAY}/api/announcements/${id}/archive`,
        UPLOAD_IMAGE: (id) => `${GATEWAY}/api/announcements/${id}/image`,
        PENDING: `${GATEWAY}/api/announcements/pending`,
        ACKNOWLEDGE: `${GATEWAY}/api/announcements/acknowledge`,
        REPORT: (id) => `${GATEWAY}/api/announcements/${id}/report`,
    },

    // ============================================
    // Settings/Admin Module APIs
    // ============================================
    SETTINGS: {
        USERS: `${GATEWAY}/api/admin/users`,
        USER_BY_ID: (id) => `${GATEWAY}/api/admin/users/${id}`,
        ROLES: `${GATEWAY}/api/admin/roles`,
        PERMISSIONS: `${GATEWAY}/api/admin/permissions`,
        SYSTEM: `${GATEWAY}/api/admin/system`,
    },
};

// ============================================
// Navigation Routes Configuration
// ============================================

export const NAVIGATION = {
    // Main Routes
    HOME: '/',
    DASHBOARD: '/dashboard',
    EXECUTIVE_DASHBOARD: '/executive-dashboard',
    LOGIN: '/login',
    PROFILE: '/profile',
    MY_PORTAL: '/my-portal',
    UNAUTHORIZED: '/unauthorized',

    // HR Module Routes
    HR_HOME: '/hr',
    HR: {
        HOME: '/hr',
        MY_DEPARTMENT: '/hr/my-department',  // لوحة تحكم مدير الإدارة
        EMPLOYEES: '/hr/employees',
        EMPLOYEES_UNIFIED: '/hr/employees-unified',
        EMPLOYEE_MANAGEMENT: '/hr/employee-management',
        EMPLOYEE_MANAGEMENT_EXPATRIATES: '/hr/employee-management?tab=unified&subtab=expatriates',
        EMPLOYEE_MANAGEMENT_INTEGRATION: '/hr/employee-management?tab=integration',
        EMPLOYEE_MANAGEMENT_PROMOTIONS: '/hr/employee-management?tab=promotions',
        EMPLOYEE_DETAILS: '/hr/employee-details',
        EMPLOYEE_UNIFIED_PROFILE: (id) => id === 'new' ? '/hr/employee-unified-profile?id=new' : `/hr/employee-unified-profile?id=${id}`,
        DEPARTMENTS: '/hr/departments',
        DEPARTMENT_DETAILS: (id) => `/hr/departments/${id}`,
        TRANSFERS: '/hr/transfers',
        LEAVES: '/hr/leaves',
        LEAVES_APPROVALS: '/hr/leaves/approvals',
        LEAVES_BALANCES: '/hr/leaves/balances',
        LEAVES_CARRYFORWARD: '/hr/leaves/carryforward',
        LEAVES_REPORTS: '/hr/leaves/reports',
        ATTENDANCE: '/hr/attendance',
        WORK_LOCATIONS: '/hr/work-locations',
        FINGERPRINTS: '/hr/fingerprints',
        BIOMETRIC_SETTINGS: '/hr/biometric-settings',
        OFFICIAL_HOLIDAYS: '/hr/official-holidays',
        CUSTOM_SCHEDULES: '/hr/custom-schedules',
        WORK_SHIFTS: '/hr/work-shifts',
        PAYROLL: '/hr/payroll',
        PERFORMANCE: '/hr/performance',
        ORGANIZATION: '/hr/organization',
        AUTHORITY_DASHBOARD: '/hr/authority-dashboard',
        CLEARANCE: '/hr/clearance',
        PERMISSIONS: '/hr/permissions',
        COMPLIANCE_VALIDATION: '/hr/compliance-validation',
        ELTIZAM_AUDIT: '/hr/eltizam-audit',
        ELTIZAM_REPORTS: '/hr/eltizam-reports',
        INTEGRATION: '/hr/integration',
        ADD_EMPLOYEE: '/hr/employee-unified-profile?id=new',
        SALARY_SCALES: '/hr/salary-scales',
    },

    // Warehouse Module Routes
    WAREHOUSE_HOME: '/warehouse',
    WAREHOUSE: {
        HOME: '/warehouse',
        DASHBOARD: '/warehouse',
        DIVISION: '/warehouse/division',
        ITEMS: '/warehouse/items',
        ITEM_DETAILS: (id) => `/warehouse/items/${id}`,
        // حركات الاستلام
        TEMP_RECEIVE: '/warehouse/temp-receive',
        TEMP_RECEIVE_DETAILS: (id) => `/warehouse/temp-receive/${id}`,
        RECEIPT_NOTE: '/warehouse/receipt-note',
        RECEIPT_NOTE_DETAILS: (id) => `/warehouse/receipt-note/${id}`,
        RECEIPT_PROTOCOL: '/warehouse/receipt-protocol',
        RECEIPT_PROTOCOL_DETAILS: (id) => `/warehouse/receipt-protocol/${id}`,
        // حركات الصرف والعهد
        EXCHANGE_REQUESTS: '/warehouse/exchange-request',
        EXCHANGE_REQUEST_DETAILS: (id) => `/warehouse/exchange-request/${id}`,
        CUSTODY: '/warehouse/custody',
        CUSTODY_DETAILS: (id) => `/warehouse/custody/${id}`,
        CUSTODY_TRANSFER: '/warehouse/custody-transfer',
        CUSTODY_TRANSFER_DETAILS: (id) => `/warehouse/custody-transfer/${id}`,
        // الجرد والإعدادات
        INVENTORY: '/warehouse/inventory',
        INVENTORY_FORM: '/warehouse/inventory-form',
        INVENTORY_FORM_DETAILS: (id) => `/warehouse/inventory-form/${id}`,
        STOCKTAKING: '/warehouse/stocktaking',
        STOCKTAKING_DETAILS: (id) => `/warehouse/stocktaking/${id}`,
        DOCUMENT_TYPES: '/warehouse/document-types',
        WAREHOUSES: '/warehouse/warehouses',
        WAREHOUSE_DETAILS: (id) => `/warehouse/warehouses/${id}`,
        // الموردين
        SUPPLIERS: '/warehouse/suppliers',
        SUPPLIER_DETAILS: (id) => `/warehouse/suppliers/${id}`,
        SUPPLIER_NEW: '/warehouse/suppliers/new',
        // الأصول الثابتة
        FIXED_ASSETS: '/warehouse/fixed-assets',
        FIXED_ASSET_DETAILS: (id) => `/warehouse/fixed-assets/${id}`,
        FIXED_ASSET_NEW: '/warehouse/fixed-assets/new',
        DEPRECIATION: '/warehouse/depreciation',
        // طلبات النقل والإرجاع
        TRANSFER_REQUESTS: '/warehouse/transfer-requests',
        TRANSFER_REQUEST_DETAILS: (id) => `/warehouse/transfer-requests/${id}`,
        RETURN_REQUESTS: '/warehouse/return-requests',
        RETURN_REQUEST_DETAILS: (id) => `/warehouse/return-requests/${id}`,
        // عهد الموظفين
        EMPLOYEE_CUSTODY: '/warehouse/employee-custody',
        REPORTS: '/warehouse/reports',
        PERMISSIONS: '/warehouse/permissions',
        // Aliases للتوافق مع لوحة التحكم
        EXCHANGE_LIST: '/warehouse/exchange-request',
        EXCHANGE_NEW: '/warehouse/exchange-request-new',
        RECEIVE: '/warehouse/temp-receive',
    },

    // Movement Module Routes
    MOVEMENT_HOME: '/movement',
    MOVEMENT: {
        HOME: '/movement',
        DASHBOARD: '/movement',
        VEHICLES: '/movement/vehicles',
        VEHICLE_DETAILS: (id) => `/movement/vehicles/${id}`,
        DRIVERS: '/movement/drivers',
        MISSIONS: '/movement/missions',
        TRIPS: '/movement/missions',
        MAINTENANCE: '/movement/maintenance',
        FUEL: '/movement/fuel',
        PERMISSIONS: '/movement/permissions',
    },

    // Archiving Module Routes
    ARCHIVING_HOME: '/archiving',
    ARCHIVING: {
        HOME: '/archiving',
        DASHBOARD: '/archiving',
        DOCUMENTS: '/archiving/documents',
        DOCUMENT_DETAILS: (id) => `/archiving/documents/${id}`,
        SEARCH: '/archiving/search',
        CATEGORIES: '/archiving/categories',
        PERMISSIONS: '/archiving/permissions',
    },

    // Finance Module Routes
    FINANCE_HOME: '/finance',
    FINANCE: {
        HOME: '/finance',
        DASHBOARD: '/finance',
        GENERAL_LEDGER: '/finance/general-ledger',
        ACCOUNTS_PAYABLE: '/finance/accounts-payable',
        BUDGET: '/finance/budget',
        ASSETS: '/finance/assets',
        PERMISSIONS: '/finance/permissions',
    },

    // Sadad Module Routes
    SADAD_HOME: '/sadad',
    SADAD: {
        HOME: '/sadad',
        DASHBOARD: '/sadad',
        PAYMENTS: '/sadad/payments',
        INVOICES: '/sadad/invoices',
        PERMISSIONS: '/sadad/permissions',
    },

    // EPM Module Routes
    EPM_HOME: '/epm',
    EPM: {
        HOME: '/epm',
        DASHBOARD: '/epm',
        EVALUATIONS: '/epm/evaluations',
        EVALUATION_NEW: '/epm/evaluations/new',
        KPIS: '/epm/kpis',
        GOALS: '/epm/goals',
        GOAL_NEW: '/epm/goals/new',
        PERMISSIONS: '/epm/permissions',
    },

    // GRC Module Routes
    GRC_HOME: '/grc',
    GRC: {
        HOME: '/grc',
        DASHBOARD: '/grc',
        RISKS: '/grc/risks',
        INCIDENTS: '/grc/incidents',
        PERMISSIONS: '/grc/permissions',
    },

    // ITSM Module Routes
    ITSM_HOME: '/itsm',
    ITSM: {
        HOME: '/itsm',
        DASHBOARD: '/itsm',
        TICKETS: '/itsm/tickets',
        TICKET_DETAILS: (id) => `/itsm/tickets/${id}`,
        ASSETS: '/itsm/assets',
        CATEGORIES: '/itsm/categories',
        PERMISSIONS: '/itsm/permissions',
    },

    // Analytics Module Routes
    ANALYTICS_HOME: '/analytics',
    ANALYTICS: {
        HOME: '/analytics',
        DASHBOARD: '/analytics',
        HR: '/analytics/hr-analytics',
        WAREHOUSE: '/analytics/warehouse-analytics',
        FINANCIAL: '/analytics/financial-analytics',
        FLEET: '/analytics/fleet-analytics',
        KPIS: '/analytics/kpis',
        AUDIT: '/analytics/audit',
        COMPLIANCE: '/analytics/compliance',
        REPORTS: '/analytics/reports',
        PERMISSIONS: '/analytics/permissions',
    },

    // Projects Module Routes
    PROJECTS_HOME: '/projects',
    PROJECTS: {
        HOME: '/projects',
        DASHBOARD: '/projects',
        PROJECT_DETAILS: (id) => `/projects/${id}`,
        TASKS: '/projects/tasks',
        MY_TASKS: '/projects/tasks/my',
        PERMISSIONS: '/projects/permissions',
    },

    // Platform Admin Routes (بوابة إدارة المنصة)
    SAAS_HOME: '/platform-admin',
    SAAS: {
        HOME: '/platform-admin',
        TENANTS: '/platform-admin/tenants',
        SUBSCRIPTIONS: '/platform-admin/subscriptions',
        FREE_TRIALS: '/platform-admin/free-trials',
        CONTACT_REQUESTS: '/platform-admin/contact-requests',
        BILLING: '/platform-admin/billing',
        ANALYTICS: '/platform-admin/analytics',
        ADMIN_USERS: '/platform-admin/admin-users',
        NOTIFICATIONS: '/platform-admin/notifications',
        LANDING_ADMIN: '/platform-admin/landing',
        MODULES: '/platform-admin/modules',
    },

    // Approvals & Workflows
    APPROVALS: '/approvals',
    WORKFLOWS: '/workflows',
    WORKFLOW_DETAILS: (entityType, entityId) => `/workflows?entityType=${entityType}&entityId=${entityId}`,

    // Disbursements - طلبات الصرف
    DISBURSEMENT_NEW: '/disbursement-new',

    // Delegations - التفويضات
    DELEGATIONS: '/delegations',

    // Reports
    REPORTS: '/reports',

    // Announcements Routes
    ANNOUNCEMENTS: '/admin/announcements',

    // Settings/Admin Routes
    SETTINGS: {
        HOME: '/admin',
        USERS: '/admin/users',
        USER_DETAILS: (id) => `/admin/users/${id}`,
        ROLES: '/admin/roles',
        PERMISSIONS: '/admin/permissions',
        SYSTEM: '/admin/system',
        ORG_STRUCTURE: '/admin/organization-structure',
        ANNOUNCEMENTS: '/admin/announcements',
    },
};

// ============================================
// Systems Configuration (for RBAC)
// ============================================

export const SYSTEMS = {
    DASHBOARD: 'dashboard',
    HR: 'hr',
    WAREHOUSE: 'warehouse',
    MOVEMENT: 'movement',
    ARCHIVING: 'archiving',
    FINANCE: 'finance',
    SADAD: 'sadad',
    EPM: 'epm',
    ITSM: 'itsm',
    ANALYTICS: 'analytics',
    PROJECTS: 'projects',
    SAAS: 'saas',
    SETTINGS: 'settings',
};

// Export default
export default {
    API,
    NAVIGATION,
    SYSTEMS,
};
