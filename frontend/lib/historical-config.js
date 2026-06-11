/**
 * تكوين شاشات البيانات التاريخية
 * يحدد الأعمدة والفلاتر والبيانات التجريبية لكل شاشة
 */
import { LEGACY_RECORD_TYPES, getRecordType } from './legacy-record-types';

/**
 * تنسيق التاريخ بالعربية
 */
function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

/**
 * تنسيق المبلغ بالريال
 */
function formatAmount(amount) {
    if (amount === null || amount === undefined) return '-';
    return Number(amount).toLocaleString('ar-SA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }) + ' ر.س';
}

/**
 * حالات الفلترة المتاحة
 */
export const STATUS_OPTIONS = [
    { value: '', label: 'جميع الحالات' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'approved', label: 'معتمد' },
    { value: 'pending', label: 'معلق' },
    { value: 'rejected', label: 'مرفوض' },
    { value: 'cancelled', label: 'ملغي' },
];

/**
 * تكوين كل شاشة تاريخية
 */
export const HISTORICAL_SCREENS = {
    // ============ HR ============
    'hr-leaves': {
        moduleType: 'hr',
        recordType: 'leave',
        title: 'البيانات التاريخية للإجازات',
        sourceSystem: 'نظام شؤون الموظفين',
        exportFilename: 'historical-leaves',
        showEmployeeLink: true,
        columns: [
            { key: 'entityName', header: 'الموظف', sortable: true },
            { key: 'leaveType', header: 'نوع الإجازة' },
            { key: 'startDate', header: 'من تاريخ', render: (v) => formatDate(v) },
            { key: 'endDate', header: 'إلى تاريخ', render: (v) => formatDate(v) },
            { key: 'totalDays', header: 'الأيام', type: 'number', align: 'center' },
            { key: 'status', header: 'الحالة' },
            { key: 'substitute', header: 'البديل' },
        ],
    },
    'hr-attendance': {
        moduleType: 'hr',
        recordType: 'leave',
        title: 'البيانات التاريخية للحضور والانصراف',
        sourceSystem: 'نظام الحضور القديم',
        exportFilename: 'historical-attendance',
        showEmployeeLink: true,
        columns: [
            { key: 'entityName', header: 'الموظف', sortable: true },
            { key: 'date', header: 'التاريخ', render: (v) => formatDate(v) },
            { key: 'checkIn', header: 'وقت الحضور' },
            { key: 'checkOut', header: 'وقت الانصراف' },
            { key: 'hoursWorked', header: 'ساعات العمل', type: 'number', align: 'center' },
            { key: 'status', header: 'الحالة' },
        ],
    },
    'hr-payroll': {
        moduleType: 'hr',
        recordType: 'salary_record',
        title: 'البيانات التاريخية للرواتب',
        sourceSystem: 'نظام الرواتب',
        exportFilename: 'historical-payroll',
        showEmployeeLink: true,
        columns: [
            { key: 'entityName', header: 'الموظف', sortable: true },
            { key: 'month', header: 'الشهر' },
            { key: 'year', header: 'السنة' },
            { key: 'basicSalary', header: 'الراتب الأساسي', render: (v) => formatAmount(v), type: 'currency' },
            { key: 'totalAllowances', header: 'البدلات', render: (v) => formatAmount(v), type: 'currency' },
            { key: 'totalDeductions', header: 'الاستقطاعات', render: (v) => formatAmount(v), type: 'currency' },
            { key: 'netSalary', header: 'الصافي', render: (v) => formatAmount(v), type: 'currency' },
        ],
    },
    'hr-promotions': {
        moduleType: 'hr',
        recordType: 'promotion',
        title: 'البيانات التاريخية للترقيات',
        sourceSystem: 'نظام شؤون الموظفين',
        exportFilename: 'historical-promotions',
        showEmployeeLink: true,
        columns: [
            { key: 'entityName', header: 'الموظف', sortable: true },
            { key: 'fromRank', header: 'من مرتبة' },
            { key: 'toRank', header: 'إلى مرتبة' },
            { key: 'decisionNumber', header: 'رقم القرار' },
            { key: 'effectiveDate', header: 'تاريخ النفاذ', render: (v) => formatDate(v) },
            { key: 'salaryBefore', header: 'الراتب قبل', render: (v) => formatAmount(v), type: 'currency' },
            { key: 'salaryAfter', header: 'الراتب بعد', render: (v) => formatAmount(v), type: 'currency' },
        ],
    },
    'hr-transfers': {
        moduleType: 'hr',
        recordType: 'transfer',
        title: 'البيانات التاريخية للنقل والتكليف',
        sourceSystem: 'نظام شؤون الموظفين',
        exportFilename: 'historical-transfers',
        showEmployeeLink: true,
        columns: [
            { key: 'entityName', header: 'الموظف', sortable: true },
            { key: 'transferType', header: 'نوع النقل' },
            { key: 'fromDepartment', header: 'من إدارة' },
            { key: 'toDepartment', header: 'إلى إدارة' },
            { key: 'decisionNumber', header: 'رقم القرار' },
            { key: 'effectiveDate', header: 'تاريخ النفاذ', render: (v) => formatDate(v) },
            { key: 'status', header: 'الحالة' },
        ],
    },
    'hr-salaries': {
        moduleType: 'hr',
        recordType: 'allowance',
        title: 'البيانات التاريخية للعلاوات والبدلات',
        sourceSystem: 'نظام الرواتب',
        exportFilename: 'historical-salaries',
        showEmployeeLink: true,
        columns: [
            { key: 'entityName', header: 'الموظف', sortable: true },
            { key: 'allowanceType', header: 'نوع العلاوة' },
            { key: 'amount', header: 'المبلغ', render: (v) => formatAmount(v), type: 'currency' },
            { key: 'percentage', header: 'النسبة %', type: 'number', align: 'center' },
            { key: 'decisionNumber', header: 'رقم القرار' },
            { key: 'effectiveDate', header: 'تاريخ النفاذ', render: (v) => formatDate(v) },
            { key: 'status', header: 'الحالة' },
        ],
    },

    // ============ Warehouse ============
    'warehouse-items': {
        moduleType: 'warehouse',
        recordType: 'inventory_movement',
        title: 'البيانات التاريخية لحركات المخزون',
        sourceSystem: 'نظام المستودعات',
        exportFilename: 'historical-inventory',
        showEmployeeLink: false,
        columns: [
            { key: 'itemCode', header: 'كود الصنف', sortable: true },
            { key: 'itemName', header: 'اسم الصنف' },
            { key: 'movementType', header: 'نوع الحركة' },
            { key: 'quantity', header: 'الكمية', type: 'number', align: 'center' },
            { key: 'unitPrice', header: 'سعر الوحدة', render: (v) => formatAmount(v), type: 'currency' },
            { key: 'warehouse', header: 'المستودع' },
            { key: 'date', header: 'التاريخ', render: (v) => formatDate(v) },
        ],
    },
    'warehouse-custody': {
        moduleType: 'warehouse',
        recordType: 'fixed_asset',
        title: 'البيانات التاريخية للعهد والأصول',
        sourceSystem: 'نظام الأصول',
        exportFilename: 'historical-custody',
        showEmployeeLink: true,
        columns: [
            { key: 'assetCode', header: 'رقم الأصل', sortable: true },
            { key: 'assetName', header: 'اسم الأصل' },
            { key: 'category', header: 'الفئة' },
            { key: 'custodian', header: 'العهدة' },
            { key: 'acquisitionDate', header: 'تاريخ الشراء', render: (v) => formatDate(v) },
            { key: 'acquisitionCost', header: 'التكلفة', render: (v) => formatAmount(v), type: 'currency' },
            { key: 'condition', header: 'الحالة' },
        ],
    },
    'warehouse-receiving': {
        moduleType: 'warehouse',
        recordType: 'supplier_history',
        title: 'البيانات التاريخية للاستلام والتوريد',
        sourceSystem: 'نظام المشتريات',
        exportFilename: 'historical-receiving',
        showEmployeeLink: false,
        columns: [
            { key: 'supplierName', header: 'المورد', sortable: true },
            { key: 'contractNumber', header: 'رقم العقد' },
            { key: 'totalOrders', header: 'الطلبات', type: 'number', align: 'center' },
            { key: 'totalAmount', header: 'إجمالي المبالغ', render: (v) => formatAmount(v), type: 'currency' },
            { key: 'lastOrderDate', header: 'آخر طلب', render: (v) => formatDate(v) },
            { key: 'rating', header: 'التقييم' },
        ],
    },

    // ============ Movement ============
    'movement-vehicles': {
        moduleType: 'movement',
        recordType: 'vehicle',
        title: 'البيانات التاريخية للمركبات',
        sourceSystem: 'نظام الأسطول',
        exportFilename: 'historical-vehicles',
        showEmployeeLink: false,
        columns: [
            { key: 'plateNumber', header: 'رقم اللوحة', sortable: true },
            { key: 'vehicleType', header: 'نوع المركبة' },
            { key: 'make', header: 'الشركة المصنعة' },
            { key: 'model', header: 'الموديل' },
            { key: 'year', header: 'سنة الصنع', type: 'number', align: 'center' },
            { key: 'mileage', header: 'الكيلومترات', type: 'number' },
            { key: 'condition', header: 'الحالة' },
        ],
    },
    'movement-drivers': {
        moduleType: 'movement',
        recordType: 'trip',
        title: 'البيانات التاريخية للسائقين والرحلات',
        sourceSystem: 'نظام الأسطول',
        exportFilename: 'historical-drivers',
        showEmployeeLink: true,
        columns: [
            { key: 'driver', header: 'السائق', sortable: true },
            { key: 'vehiclePlate', header: 'رقم المركبة' },
            { key: 'origin', header: 'نقطة الانطلاق' },
            { key: 'destination', header: 'الوجهة' },
            { key: 'distance', header: 'المسافة (كم)', type: 'number', align: 'center' },
            { key: 'startDate', header: 'التاريخ', render: (v) => formatDate(v) },
            { key: 'fuelCost', header: 'تكلفة الوقود', render: (v) => formatAmount(v), type: 'currency' },
        ],
    },
    'movement-maintenance': {
        moduleType: 'movement',
        recordType: 'maintenance',
        title: 'البيانات التاريخية للصيانة',
        sourceSystem: 'نظام الأسطول',
        exportFilename: 'historical-maintenance',
        showEmployeeLink: false,
        columns: [
            { key: 'vehiclePlate', header: 'رقم المركبة', sortable: true },
            { key: 'maintenanceType', header: 'نوع الصيانة' },
            { key: 'description', header: 'الوصف' },
            { key: 'cost', header: 'التكلفة', render: (v) => formatAmount(v), type: 'currency' },
            { key: 'workshop', header: 'الورشة' },
            { key: 'startDate', header: 'من تاريخ', render: (v) => formatDate(v) },
            { key: 'endDate', header: 'إلى تاريخ', render: (v) => formatDate(v) },
        ],
    },

    // ============ Finance ============
    'finance-vendors': {
        moduleType: 'finance',
        recordType: 'invoice',
        title: 'البيانات التاريخية للموردين والفواتير',
        sourceSystem: 'النظام المالي',
        exportFilename: 'historical-vendors',
        showEmployeeLink: false,
        columns: [
            { key: 'invoiceNumber', header: 'رقم الفاتورة', sortable: true },
            { key: 'vendor', header: 'المورد/الجهة' },
            { key: 'invoiceDate', header: 'التاريخ', render: (v) => formatDate(v) },
            { key: 'amount', header: 'المبلغ', render: (v) => formatAmount(v), type: 'currency' },
            { key: 'vat', header: 'الضريبة', render: (v) => formatAmount(v), type: 'currency' },
            { key: 'totalAmount', header: 'الإجمالي', render: (v) => formatAmount(v), type: 'currency' },
            { key: 'paymentStatus', header: 'حالة الدفع' },
        ],
    },

    // ============ Archiving ============
    'archiving-documents': {
        moduleType: 'archiving',
        recordType: 'document',
        title: 'البيانات التاريخية للوثائق',
        sourceSystem: 'نظام الأرشفة',
        exportFilename: 'historical-documents',
        showEmployeeLink: false,
        columns: [
            { key: 'documentNumber', header: 'رقم الوثيقة', sortable: true },
            { key: 'title', header: 'العنوان' },
            { key: 'category', header: 'التصنيف' },
            { key: 'date', header: 'التاريخ', render: (v) => formatDate(v) },
            { key: 'department', header: 'الإدارة' },
            { key: 'status', header: 'الحالة' },
        ],
    },

    // ============ EPM ============
    'epm-evaluations': {
        moduleType: 'epm',
        recordType: 'evaluation',
        title: 'البيانات التاريخية للتقييمات',
        sourceSystem: 'نظام تقييم الأداء',
        exportFilename: 'historical-evaluations',
        showEmployeeLink: true,
        columns: [
            { key: 'entityName', header: 'الموظف', sortable: true },
            { key: 'evaluationPeriod', header: 'فترة التقييم' },
            { key: 'score', header: 'الدرجة', type: 'number', align: 'center' },
            { key: 'rating', header: 'التصنيف' },
            { key: 'evaluator', header: 'المقيّم' },
            { key: 'date', header: 'التاريخ', render: (v) => formatDate(v) },
            { key: 'status', header: 'الحالة' },
        ],
    },
};

/**
 * الحصول على تكوين شاشة تاريخية
 */
export function getHistoricalScreenConfig(screenId) {
    return HISTORICAL_SCREENS[screenId] || null;
}

/**
 * الحصول على جميع معرفات الشاشات لموديول معين
 */
export function getScreenIdsForModule(moduleType) {
    return Object.entries(HISTORICAL_SCREENS)
        .filter(([, config]) => config.moduleType === moduleType)
        .map(([id]) => id);
}

/**
 * generateMockData — stub: real data must be fetched from the API.
 * Returns an empty array; callers should load records via the import/legacy API endpoints.
 */
export function generateMockData(screenId, count = 15) { // eslint-disable-line no-unused-vars
    return [];
}

export default {
    HISTORICAL_SCREENS,
    STATUS_OPTIONS,
    getHistoricalScreenConfig,
    getScreenIdsForModule,
    generateMockData,
};
