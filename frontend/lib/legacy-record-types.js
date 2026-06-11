/**
 * تعريفات أنواع السجلات التاريخية لكل موديول
 * Legacy Record Type Definitions per Module
 */

// أنواع السجلات حسب الموديول
export const LEGACY_RECORD_TYPES = {
    hr: [
        {
            id: 'leave',
            name: 'الإجازات',
            icon: '🏖️',
            color: '#10b981',
            badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            subtypes: [
                { id: 'annual', name: 'إجازة سنوية' },
                { id: 'sick', name: 'إجازة مرضية' },
                { id: 'emergency', name: 'إجازة اضطرارية' },
                { id: 'marriage', name: 'إجازة زواج' },
                { id: 'maternity', name: 'إجازة أمومة' },
                { id: 'paternity', name: 'إجازة أبوة' },
                { id: 'bereavement', name: 'إجازة وفاة' },
                { id: 'hajj', name: 'إجازة حج' },
                { id: 'unpaid', name: 'إجازة بدون راتب' },
                { id: 'study', name: 'إجازة دراسية' },
            ],
            fields: [
                { key: 'leaveType', label: 'نوع الإجازة' },
                { key: 'startDate', label: 'تاريخ البداية' },
                { key: 'endDate', label: 'تاريخ النهاية' },
                { key: 'totalDays', label: 'عدد الأيام' },
                { key: 'substitute', label: 'البديل' },
                { key: 'status', label: 'الحالة' },
                { key: 'approvedBy', label: 'المعتمد' },
            ],
        },
        {
            id: 'promotion',
            name: 'الترقيات',
            icon: '📈',
            color: '#3b82f6',
            badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            fields: [
                { key: 'fromRank', label: 'من مرتبة' },
                { key: 'toRank', label: 'إلى مرتبة' },
                { key: 'fromStep', label: 'من درجة' },
                { key: 'toStep', label: 'إلى درجة' },
                { key: 'decisionNumber', label: 'رقم القرار' },
                { key: 'effectiveDate', label: 'تاريخ النفاذ' },
                { key: 'salaryBefore', label: 'الراتب قبل' },
                { key: 'salaryAfter', label: 'الراتب بعد' },
            ],
        },
        {
            id: 'allowance',
            name: 'العلاوات',
            icon: '💰',
            color: '#8b5cf6',
            badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            subtypes: [
                { id: 'annual', name: 'علاوة سنوية' },
                { id: 'exceptional', name: 'علاوة استثنائية' },
                { id: 'nature_of_work', name: 'بدل طبيعة عمل' },
            ],
            fields: [
                { key: 'allowanceType', label: 'نوع العلاوة' },
                { key: 'amount', label: 'المبلغ' },
                { key: 'percentage', label: 'النسبة %' },
                { key: 'decisionNumber', label: 'رقم القرار' },
                { key: 'effectiveDate', label: 'تاريخ النفاذ' },
            ],
        },
        {
            id: 'delegation',
            name: 'الانتدابات',
            icon: '✈️',
            color: '#f59e0b',
            badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            fields: [
                { key: 'destination', label: 'جهة الانتداب' },
                { key: 'city', label: 'المدينة' },
                { key: 'country', label: 'الدولة' },
                { key: 'startDate', label: 'تاريخ البداية' },
                { key: 'endDate', label: 'تاريخ النهاية' },
                { key: 'totalDays', label: 'عدد الأيام' },
                { key: 'dailyAllowance', label: 'بدل يومي' },
                { key: 'purpose', label: 'الغرض' },
                { key: 'decisionNumber', label: 'رقم القرار' },
            ],
        },
        {
            id: 'transfer',
            name: 'النقل والتكليف',
            icon: '🔄',
            color: '#06b6d4',
            badgeClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
            fields: [
                { key: 'fromDepartment', label: 'من إدارة' },
                { key: 'toDepartment', label: 'إلى إدارة' },
                { key: 'fromPosition', label: 'من وظيفة' },
                { key: 'toPosition', label: 'إلى وظيفة' },
                { key: 'transferType', label: 'نوع النقل' },
                { key: 'decisionNumber', label: 'رقم القرار' },
                { key: 'effectiveDate', label: 'تاريخ النفاذ' },
            ],
        },
        {
            id: 'salary_record',
            name: 'سجل الرواتب',
            icon: '🧾',
            color: '#ec4899',
            badgeClass: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
            fields: [
                { key: 'month', label: 'الشهر' },
                { key: 'year', label: 'السنة' },
                { key: 'basicSalary', label: 'الراتب الأساسي' },
                { key: 'totalAllowances', label: 'إجمالي البدلات' },
                { key: 'totalDeductions', label: 'إجمالي الاستقطاعات' },
                { key: 'netSalary', label: 'صافي الراتب' },
            ],
        },
    ],
    warehouse: [
        {
            id: 'fixed_asset',
            name: 'الأصول الثابتة',
            icon: '🏢',
            color: '#14b8a6',
            badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
            fields: [
                { key: 'assetCode', label: 'رقم الأصل' },
                { key: 'assetName', label: 'اسم الأصل' },
                { key: 'category', label: 'الفئة' },
                { key: 'acquisitionDate', label: 'تاريخ الشراء' },
                { key: 'acquisitionCost', label: 'تكلفة الشراء' },
                { key: 'currentValue', label: 'القيمة الحالية' },
                { key: 'location', label: 'الموقع' },
                { key: 'custodian', label: 'العهدة' },
                { key: 'condition', label: 'الحالة' },
                { key: 'depreciationRate', label: 'معدل الإهلاك' },
            ],
        },
        {
            id: 'inventory_movement',
            name: 'حركات المخزون',
            icon: '📦',
            color: '#f59e0b',
            badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            fields: [
                { key: 'movementType', label: 'نوع الحركة' },
                { key: 'itemCode', label: 'كود الصنف' },
                { key: 'itemName', label: 'اسم الصنف' },
                { key: 'quantity', label: 'الكمية' },
                { key: 'unitPrice', label: 'سعر الوحدة' },
                { key: 'totalValue', label: 'القيمة الإجمالية' },
                { key: 'warehouse', label: 'المستودع' },
                { key: 'reference', label: 'المرجع' },
            ],
        },
        {
            id: 'supplier_history',
            name: 'سجل الموردين',
            icon: '🤝',
            color: '#6366f1',
            badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
            fields: [
                { key: 'supplierName', label: 'اسم المورد' },
                { key: 'contractNumber', label: 'رقم العقد' },
                { key: 'totalOrders', label: 'إجمالي الطلبات' },
                { key: 'totalAmount', label: 'إجمالي المبالغ' },
                { key: 'lastOrderDate', label: 'تاريخ آخر طلب' },
                { key: 'rating', label: 'التقييم' },
            ],
        },
        {
            id: 'stocktaking',
            name: 'الجرد التاريخي',
            icon: '📋',
            color: '#8b5cf6',
            badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            fields: [
                { key: 'stocktakingDate', label: 'تاريخ الجرد' },
                { key: 'warehouse', label: 'المستودع' },
                { key: 'totalItems', label: 'عدد الأصناف' },
                { key: 'totalValue', label: 'القيمة الإجمالية' },
                { key: 'discrepancies', label: 'الفروقات' },
                { key: 'approvedBy', label: 'المعتمد' },
            ],
        },
    ],
    finance: [
        {
            id: 'invoice',
            name: 'الفواتير',
            icon: '🧾',
            color: '#6366f1',
            badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
            fields: [
                { key: 'invoiceNumber', label: 'رقم الفاتورة' },
                { key: 'invoiceDate', label: 'التاريخ' },
                { key: 'vendor', label: 'المورد/الجهة' },
                { key: 'amount', label: 'المبلغ' },
                { key: 'vat', label: 'ضريبة القيمة المضافة' },
                { key: 'totalAmount', label: 'الإجمالي' },
                { key: 'paymentStatus', label: 'حالة الدفع' },
                { key: 'paymentDate', label: 'تاريخ الدفع' },
            ],
        },
        {
            id: 'budget',
            name: 'الميزانيات',
            icon: '📊',
            color: '#3b82f6',
            badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            fields: [
                { key: 'fiscalYear', label: 'السنة المالية' },
                { key: 'department', label: 'الإدارة' },
                { key: 'budgetType', label: 'نوع الميزانية' },
                { key: 'allocatedAmount', label: 'المخصص' },
                { key: 'spentAmount', label: 'المنصرف' },
                { key: 'remainingAmount', label: 'المتبقي' },
                { key: 'utilizationRate', label: 'نسبة الاستخدام' },
            ],
        },
        {
            id: 'journal_entry',
            name: 'القيود المحاسبية',
            icon: '📝',
            color: '#10b981',
            badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            fields: [
                { key: 'entryNumber', label: 'رقم القيد' },
                { key: 'entryDate', label: 'التاريخ' },
                { key: 'description', label: 'البيان' },
                { key: 'debitAccount', label: 'حساب المدين' },
                { key: 'creditAccount', label: 'حساب الدائن' },
                { key: 'debitAmount', label: 'مبلغ المدين' },
                { key: 'creditAmount', label: 'مبلغ الدائن' },
            ],
        },
        {
            id: 'payment',
            name: 'المدفوعات',
            icon: '💳',
            color: '#f59e0b',
            badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            fields: [
                { key: 'paymentNumber', label: 'رقم الدفعة' },
                { key: 'paymentDate', label: 'التاريخ' },
                { key: 'beneficiary', label: 'المستفيد' },
                { key: 'amount', label: 'المبلغ' },
                { key: 'paymentMethod', label: 'طريقة الدفع' },
                { key: 'reference', label: 'المرجع' },
                { key: 'status', label: 'الحالة' },
            ],
        },
    ],
    movement: [
        {
            id: 'vehicle',
            name: 'المركبات',
            icon: '🚗',
            color: '#3b82f6',
            badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            fields: [
                { key: 'plateNumber', label: 'رقم اللوحة' },
                { key: 'vehicleType', label: 'نوع المركبة' },
                { key: 'make', label: 'الشركة المصنعة' },
                { key: 'model', label: 'الموديل' },
                { key: 'year', label: 'سنة الصنع' },
                { key: 'mileage', label: 'عداد الكيلومترات' },
                { key: 'condition', label: 'الحالة' },
                { key: 'assignedTo', label: 'مسندة إلى' },
            ],
        },
        {
            id: 'maintenance',
            name: 'سجل الصيانة',
            icon: '🔧',
            color: '#f59e0b',
            badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            fields: [
                { key: 'vehiclePlate', label: 'رقم المركبة' },
                { key: 'maintenanceType', label: 'نوع الصيانة' },
                { key: 'description', label: 'الوصف' },
                { key: 'cost', label: 'التكلفة' },
                { key: 'workshop', label: 'الورشة' },
                { key: 'startDate', label: 'تاريخ البداية' },
                { key: 'endDate', label: 'تاريخ الانتهاء' },
            ],
        },
        {
            id: 'trip',
            name: 'الرحلات',
            icon: '🗺️',
            color: '#10b981',
            badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            fields: [
                { key: 'vehiclePlate', label: 'رقم المركبة' },
                { key: 'driver', label: 'السائق' },
                { key: 'origin', label: 'نقطة الانطلاق' },
                { key: 'destination', label: 'الوجهة' },
                { key: 'distance', label: 'المسافة (كم)' },
                { key: 'startDate', label: 'تاريخ البداية' },
                { key: 'endDate', label: 'تاريخ النهاية' },
                { key: 'fuelCost', label: 'تكلفة الوقود' },
            ],
        },
    ],
    archiving: [
        {
            id: 'document',
            name: 'الوثائق',
            icon: '📄',
            color: '#6366f1',
            badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
            fields: [
                { key: 'documentNumber', label: 'رقم الوثيقة' },
                { key: 'title', label: 'العنوان' },
                { key: 'classification', label: 'التصنيف' },
                { key: 'securityLevel', label: 'مستوى السرية' },
                { key: 'sourceOrg', label: 'الجهة المصدرة' },
                { key: 'documentDate', label: 'تاريخ الوثيقة' },
                { key: 'retentionPeriod', label: 'مدة الحفظ' },
                { key: 'status', label: 'الحالة' },
            ],
        },
        {
            id: 'correspondence',
            name: 'المراسلات',
            icon: '✉️',
            color: '#3b82f6',
            badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            fields: [
                { key: 'referenceNumber', label: 'رقم المرجع' },
                { key: 'subject', label: 'الموضوع' },
                { key: 'sender', label: 'المرسل' },
                { key: 'recipient', label: 'المستلم' },
                { key: 'date', label: 'التاريخ' },
                { key: 'type', label: 'النوع (صادر/وارد)' },
                { key: 'status', label: 'الحالة' },
            ],
        },
    ],
    epm: [
        {
            id: 'evaluation',
            name: 'تقييمات الأداء',
            icon: '📋',
            color: '#8b5cf6',
            badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            fields: [
                { key: 'evaluationPeriod', label: 'فترة التقييم' },
                { key: 'evaluator', label: 'المقيّم' },
                { key: 'overallScore', label: 'التقييم الإجمالي' },
                { key: 'technicalScore', label: 'المهارات التقنية' },
                { key: 'communicationScore', label: 'التواصل' },
                { key: 'teamworkScore', label: 'العمل الجماعي' },
                { key: 'recommendation', label: 'التوصية' },
                { key: 'status', label: 'الحالة' },
            ],
        },
        {
            id: 'goal',
            name: 'الأهداف',
            icon: '🎯',
            color: '#10b981',
            badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            fields: [
                { key: 'goalTitle', label: 'عنوان الهدف' },
                { key: 'category', label: 'الفئة' },
                { key: 'targetDate', label: 'التاريخ المستهدف' },
                { key: 'weight', label: 'الوزن %' },
                { key: 'achievementRate', label: 'نسبة الإنجاز' },
                { key: 'status', label: 'الحالة' },
            ],
        },
    ],
};

// أسماء الموديولات
export const MODULE_NAMES = {
    hr: 'الموارد البشرية',
    warehouse: 'المستودعات',
    finance: 'المالية',
    movement: 'الأسطول والحركة',
    archiving: 'الأرشفة',
    epm: 'تقييم الأداء',
};

// أيقونات الموديولات
export const MODULE_ICONS = {
    hr: '👥',
    warehouse: '📦',
    finance: '💳',
    movement: '🚗',
    archiving: '📂',
    epm: '🎯',
};

// الحصول على نوع سجل بمعرفه
export function getRecordType(moduleType, recordTypeId) {
    const types = LEGACY_RECORD_TYPES[moduleType] || [];
    return types.find(t => t.id === recordTypeId);
}

// الحصول على badge class لنوع سجل
export function getRecordTypeBadgeClass(moduleType, recordTypeId) {
    const type = getRecordType(moduleType, recordTypeId);
    return type?.badgeClass || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
}

// الحصول على حقول نوع سجل
export function getRecordTypeFields(moduleType, recordTypeId) {
    const type = getRecordType(moduleType, recordTypeId);
    return type?.fields || [];
}
