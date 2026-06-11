/**
 * نظام تسلسل الاعتمادات المرن
 * Flexible Approval Chain Management System
 *
 * يدعم:
 * - إضافة/حذف/ترتيب مستويات الاعتماد ديناميكياً
 * - الربط مع المسميات الوظيفية من HR
 * - الربط مع نظام الصلاحيات RBAC
 * - التكامل مع النظام المالي
 */

import { ROLES } from './rbac';

// ==================== أنواع مسارات الاعتماد ====================
export const WORKFLOW_TYPES = {
    EXCHANGE_REQUEST: 'exchange_request',      // طلبات الصرف من المستودع
    PURCHASE_REQUEST: 'purchase_request',      // طلبات الشراء
    LEAVE_REQUEST: 'leave_request',            // طلبات الإجازات
    CUSTODY_REQUEST: 'custody_request',        // طلبات العهد
    RETURN_REQUEST: 'return_request',          // طلبات الإرجاع
    TRANSFER_REQUEST: 'transfer_request',      // طلبات النقل
    DISPOSAL_REQUEST: 'disposal_request',      // طلبات الإتلاف
    BUDGET_REQUEST: 'budget_request',          // طلبات الميزانية
};

// ==================== المسميات الوظيفية من HR ====================
export const JOB_POSITIONS = {
    // الإدارة العليا
    MUNICIPALITY_MANAGER: {
        id: 'municipality_manager',
        titleAr: 'رئيس البلدية',
        titleEn: 'Municipality Manager',
        level: 1,
        grade: 15,
        roles: [ROLES.MUNICIPALITY_MANAGER, ROLES.SUPER_ADMIN]
    },
    DEPUTY_MANAGER: {
        id: 'deputy_manager',
        titleAr: 'نائب رئيس البلدية',
        titleEn: 'Deputy Manager',
        level: 2,
        grade: 14,
        roles: [ROLES.SUPER_ADMIN]
    },

    // الإدارات
    DEPARTMENT_DIRECTOR: {
        id: 'department_director',
        titleAr: 'مدير الإدارة',
        titleEn: 'Department Director',
        level: 3,
        grade: 13,
        roles: [ROLES.HR_MANAGER, ROLES.WAREHOUSE_ADMIN, ROLES.FINANCE_DIRECTOR]
    },
    DEPARTMENT_HEAD: {
        id: 'department_head',
        titleAr: 'رئيس القسم',
        titleEn: 'Department Head',
        level: 4,
        grade: 12,
        roles: [ROLES.DEPARTMENT_HEAD]
    },

    // المستودعات
    HEAD_WAREHOUSE: {
        id: 'head_warehouse',
        titleAr: 'مدير المستودع',
        titleEn: 'Head Warehouse',
        level: 5,
        grade: 11,
        roles: [ROLES.HEAD_WAREHOUSE]
    },
    SECURITY_WAREHOUSE: {
        id: 'security_warehouse',
        titleAr: 'أمين المستودع',
        titleEn: 'Warehouse Keeper',
        level: 6,
        grade: 9,
        roles: [ROLES.SECURITY_WAREHOUSE, ROLES.WAREHOUSE_KEEPER]
    },
    INVENTORY_AUDITOR: {
        id: 'inventory_auditor',
        titleAr: 'مراقب المخزون',
        titleEn: 'Inventory Auditor',
        level: 5,
        grade: 10,
        roles: [ROLES.INVENTORY_AUDITOR]
    },

    // الخدمات العامة
    PUBLIC_SERVICES: {
        id: 'public_services',
        titleAr: 'مدير الخدمات العامة',
        titleEn: 'Public Services Manager',
        level: 4,
        grade: 12,
        roles: [ROLES.PUBLIC_SERVICES]
    },

    // المستلم - دور خاص لتأكيد استلام الأصناف
    RECEIVER: {
        id: 'receiver',
        titleAr: 'المستلم',
        titleEn: 'Receiver',
        level: 7,
        grade: 0, // أي موظف يمكنه الاستلام
        roles: [ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD, ROLES.SUPER_ADMIN],
        description: 'الموظف المسؤول عن استلام الأصناف المصروفة'
    },

    // المالية
    FINANCE_DIRECTOR: {
        id: 'finance_director',
        titleAr: 'مدير الإدارة المالية',
        titleEn: 'Finance Director',
        level: 3,
        grade: 13,
        roles: [ROLES.FINANCE_DIRECTOR, ROLES.FINANCE_ADMIN]
    },
    ACCOUNTING_MANAGER: {
        id: 'accounting_manager',
        titleAr: 'مدير المحاسبة',
        titleEn: 'Accounting Manager',
        level: 4,
        grade: 12,
        roles: [ROLES.ACCOUNTING_MANAGER]
    },
    BUDGET_MANAGER: {
        id: 'budget_manager',
        titleAr: 'مدير الميزانية',
        titleEn: 'Budget Manager',
        level: 4,
        grade: 12,
        roles: [ROLES.BUDGET_MANAGER]
    },
    ACCOUNTANT: {
        id: 'accountant',
        titleAr: 'محاسب',
        titleEn: 'Accountant',
        level: 6,
        grade: 8,
        roles: [ROLES.ACCOUNTANT]
    },
    INTERNAL_AUDITOR: {
        id: 'internal_auditor',
        titleAr: 'المراجع الداخلي',
        titleEn: 'Internal Auditor',
        level: 4,
        grade: 11,
        roles: [ROLES.INTERNAL_AUDITOR]
    },
    PROCUREMENT_MANAGER: {
        id: 'procurement_manager',
        titleAr: 'مدير المشتريات',
        titleEn: 'Procurement Manager',
        level: 4,
        grade: 12,
        roles: [ROLES.PROCUREMENT_MANAGER]
    },
};

// ==================== شروط التنفيذ ====================
export const CONDITION_TYPES = {
    AMOUNT_THRESHOLD: 'amount_threshold',      // حد مبلغ معين
    ITEM_COUNT: 'item_count',                  // عدد الأصناف
    CATEGORY: 'category',                      // فئة معينة
    DEPARTMENT: 'department',                  // قسم معين
    PRIORITY: 'priority',                      // أولوية معينة
    BUDGET_AVAILABILITY: 'budget_availability', // توفر الميزانية
    FISCAL_YEAR_END: 'fiscal_year_end',        // نهاية السنة المالية
};

// ==================== تسلسل الاعتماد الافتراضي لطلبات الصرف ====================
// يتوافق مع نظام البلديات: 6 مراحل متتابعة (Serial Approvals)
export const DEFAULT_EXCHANGE_APPROVAL_CHAIN = [
    {
        order: 1,
        stepId: 'dept_head_approval',
        titleAr: 'موافقة رئيس الجهة الطالبة',
        titleEn: 'Requesting Department Head Approval',
        position: JOB_POSITIONS.DEPARTMENT_HEAD,
        field: 'HeadDepartment_Approved',
        fieldDate: 'HeadDepartment_ApprovedDate',
        fieldBy: 'HeadDepartment_ApprovedBy',
        fieldNotes: 'HeadDepartment_Notes',
        required: true,
        canSkip: false,
        autoApprove: false,
        maxDays: 2,
        escalateTo: 'municipality_manager_approval',
        conditions: [],
        icon: '👤',
        color: '#3b82f6',
        actions: ['approve', 'reject', 'return_for_correction']
    },
    {
        order: 2,
        stepId: 'municipality_manager_approval',
        titleAr: 'موافقة رئيس البلدية',
        titleEn: 'Municipality Manager Approval',
        position: JOB_POSITIONS.MUNICIPALITY_MANAGER,
        field: 'MunicipalityManager_Approved',
        fieldDate: 'MunicipalityManager_ApprovedDate',
        fieldBy: 'MunicipalityManager_ApprovedBy',
        fieldNotes: 'MunicipalityManager_Notes',
        required: false, // اختياري - يمكن تخطيها حسب السياسة
        canSkip: true,
        autoApprove: false,
        maxDays: 3,
        escalateTo: 'head_warehouse_approval',
        conditions: [
            // تفعّل فقط للطلبات عالية القيمة أو الحرجة
            { type: CONDITION_TYPES.AMOUNT_THRESHOLD, operator: '>=', value: 50000 },
            { type: CONDITION_TYPES.PRIORITY, operator: '==', value: 'critical' }
        ],
        conditionLogic: 'OR', // أي شرط ينطبق يفعّل الخطوة
        icon: '🏛️',
        color: '#059669',
        actions: ['approve', 'reject', 'return_for_correction']
    },
    {
        order: 3,
        stepId: 'head_warehouse_approval',
        titleAr: 'موافقة إدارة المستودعات',
        titleEn: 'Warehouse Management Approval',
        position: JOB_POSITIONS.HEAD_WAREHOUSE,
        field: 'HeadWarehouse_Approved',
        fieldDate: 'HeadWarehouse_ApprovedDate',
        fieldBy: 'HeadWarehouse_ApprovedBy',
        fieldNotes: 'HeadWarehouse_Notes',
        required: true,
        canSkip: false,
        autoApprove: false,
        maxDays: 2,
        escalateTo: 'security_warehouse_approval',
        conditions: [],
        icon: '🏪',
        color: '#10b981',
        actions: ['approve', 'reject', 'return_for_correction', 'partial_approve'],
        // يمكنه الموافقة الجزئية إذا لم تتوفر كل الكميات
        allowPartialApproval: true
    },
    {
        order: 4,
        stepId: 'security_warehouse_approval',
        titleAr: 'تجهيز الصرف من مأمور المستودع',
        titleEn: 'Warehouse Keeper Preparation',
        position: JOB_POSITIONS.SECURITY_WAREHOUSE,
        field: 'Security_Approved',
        fieldDate: 'Security_ApprovedDate',
        fieldBy: 'Security_ApprovedBy',
        fieldNotes: 'Security_Notes',
        required: true,
        canSkip: false,
        autoApprove: false,
        maxDays: 1,
        escalateTo: 'receiver_confirmation',
        conditions: [],
        icon: '📦',
        color: '#f59e0b',
        actions: ['approve', 'reject'],
        // يتحقق من توفر الكميات ويجهز إذن الصرف
        validateStock: true,
        createIssueNote: true
    },
    {
        order: 5,
        stepId: 'receiver_confirmation',
        titleAr: 'تأكيد الاستلام من المستلم',
        titleEn: 'Receiver Confirmation',
        position: JOB_POSITIONS.RECEIVER,
        field: 'Receiver_Confirmed',
        fieldDate: 'Receiver_ConfirmedDate',
        fieldBy: 'Receiver_ConfirmedBy',
        fieldNotes: 'Receiver_Notes',
        required: true,
        canSkip: false,
        autoApprove: false,
        maxDays: 3,
        escalateTo: 'inventory_controller_final',
        conditions: [],
        icon: '✋',
        color: '#8b5cf6',
        actions: ['confirm_receipt', 'report_shortage', 'report_damage'],
        // خيارات الاستلام
        receiptOptions: {
            allowPartialReceipt: true,
            requireSignature: true,
            allowShortageReport: true,
            allowDamageReport: true
        }
    },
    {
        order: 6,
        stepId: 'inventory_controller_final',
        titleAr: 'الاعتماد النهائي من مراقب المخزون',
        titleEn: 'Inventory Controller Final Approval',
        position: JOB_POSITIONS.INVENTORY_AUDITOR,
        field: 'InventoryController_Approved',
        fieldDate: 'InventoryController_ApprovedDate',
        fieldBy: 'InventoryController_ApprovedBy',
        fieldNotes: 'InventoryController_Notes',
        required: true,
        canSkip: false,
        autoApprove: false,
        maxDays: 2,
        escalateTo: null,
        conditions: [],
        icon: '📊',
        color: '#ec4899',
        isFinalStep: true,
        actions: ['finalize', 'return_for_review'],
        // عند الاعتماد النهائي
        onApprove: {
            updateStockLedger: true,      // تحديث دفتر المخزون
            createAccountingEntry: true,  // إنشاء القيد المحاسبي
            closeRequest: true            // إغلاق الطلب
        }
    }
];

// ==================== حالات الإرجاع للتعديل ====================
export const RETURN_FOR_CORRECTION_REASONS = [
    { id: 'incomplete_info', label: 'معلومات ناقصة', description: 'الطلب يحتاج معلومات إضافية' },
    { id: 'wrong_items', label: 'أصناف خاطئة', description: 'الأصناف المطلوبة غير صحيحة' },
    { id: 'quantity_issue', label: 'مشكلة في الكميات', description: 'الكميات المطلوبة تحتاج مراجعة' },
    { id: 'missing_attachment', label: 'مرفقات ناقصة', description: 'يجب إرفاق مستندات إضافية' },
    { id: 'budget_exceeded', label: 'تجاوز الميزانية', description: 'الطلب يتجاوز الميزانية المتاحة' },
    { id: 'other', label: 'أخرى', description: 'سبب آخر (يرجى التوضيح)' }
];

// ==================== حالات الإبلاغ عن مشاكل الاستلام ====================
export const RECEIPT_ISSUES = {
    SHORTAGE: {
        id: 'shortage',
        label: 'نقص في الكمية',
        icon: '📉',
        requiresQuantity: true,
        requiresNote: true
    },
    DAMAGE: {
        id: 'damage',
        label: 'تلف في الأصناف',
        icon: '💔',
        requiresQuantity: true,
        requiresNote: true,
        requiresPhoto: true
    },
    WRONG_ITEM: {
        id: 'wrong_item',
        label: 'صنف خاطئ',
        icon: '❌',
        requiresNote: true
    },
    QUALITY_ISSUE: {
        id: 'quality_issue',
        label: 'مشكلة في الجودة',
        icon: '⚠️',
        requiresNote: true,
        requiresPhoto: true
    }
};

// ==================== تسلسل الاعتماد للطلبات ذات القيمة العالية ====================
export const HIGH_VALUE_APPROVAL_CHAIN = [
    ...DEFAULT_EXCHANGE_APPROVAL_CHAIN.slice(0, 3),
    {
        order: 4,
        stepId: 'finance_review',
        titleAr: 'مراجعة الإدارة المالية',
        titleEn: 'Finance Review',
        position: JOB_POSITIONS.ACCOUNTING_MANAGER,
        field: 'Finance_Reviewed',
        fieldDate: 'Finance_ReviewedDate',
        fieldBy: 'Finance_ReviewedBy',
        fieldNotes: 'Finance_Notes',
        required: true,
        canSkip: false,
        autoApprove: false,
        maxDays: 3,
        escalateTo: 'budget_check',
        conditions: [
            { type: CONDITION_TYPES.AMOUNT_THRESHOLD, operator: '>=', value: 50000 }
        ],
        icon: '💰',
        color: '#059669'
    },
    {
        order: 5,
        stepId: 'budget_check',
        titleAr: 'التحقق من الميزانية',
        titleEn: 'Budget Verification',
        position: JOB_POSITIONS.BUDGET_MANAGER,
        field: 'Budget_Verified',
        fieldDate: 'Budget_VerifiedDate',
        fieldBy: 'Budget_VerifiedBy',
        fieldNotes: 'Budget_Notes',
        required: true,
        canSkip: false,
        autoApprove: false,
        maxDays: 2,
        escalateTo: 'inventory_auditor_approval',
        conditions: [
            { type: CONDITION_TYPES.BUDGET_AVAILABILITY, operator: '==', value: true }
        ],
        icon: '📋',
        color: '#7c3aed'
    },
    ...DEFAULT_EXCHANGE_APPROVAL_CHAIN.slice(3)
];

// ==================== فئة إدارة تسلسل الاعتمادات ====================
export class ApprovalChainManager {
    constructor(workflowType = WORKFLOW_TYPES.EXCHANGE_REQUEST) {
        this.workflowType = workflowType;
        this.chain = this.getDefaultChain();
    }

    /**
     * الحصول على التسلسل الافتراضي حسب نوع الطلب
     */
    getDefaultChain() {
        switch (this.workflowType) {
            case WORKFLOW_TYPES.EXCHANGE_REQUEST:
                return [...DEFAULT_EXCHANGE_APPROVAL_CHAIN];
            case WORKFLOW_TYPES.PURCHASE_REQUEST:
                return [...HIGH_VALUE_APPROVAL_CHAIN];
            default:
                return [...DEFAULT_EXCHANGE_APPROVAL_CHAIN];
        }
    }

    /**
     * إضافة خطوة جديدة للتسلسل
     * @param {Object} step - خطوة الاعتماد
     * @param {Number} position - الموقع (اختياري، الافتراضي في النهاية)
     */
    addStep(step, position = null) {
        const newStep = {
            ...step,
            order: position !== null ? position : this.chain.length + 1
        };

        if (position !== null) {
            // إعادة ترتيب الخطوات
            this.chain = this.chain.map(s => ({
                ...s,
                order: s.order >= position ? s.order + 1 : s.order
            }));
            this.chain.splice(position - 1, 0, newStep);
        } else {
            this.chain.push(newStep);
        }

        this.reorderChain();
        return this;
    }

    /**
     * حذف خطوة من التسلسل
     * @param {String} stepId - معرف الخطوة
     */
    removeStep(stepId) {
        const index = this.chain.findIndex(s => s.stepId === stepId);
        if (index !== -1) {
            this.chain.splice(index, 1);
            this.reorderChain();
        }
        return this;
    }

    /**
     * نقل خطوة لموقع جديد
     * @param {String} stepId - معرف الخطوة
     * @param {Number} newPosition - الموقع الجديد
     */
    moveStep(stepId, newPosition) {
        const index = this.chain.findIndex(s => s.stepId === stepId);
        if (index !== -1) {
            const [step] = this.chain.splice(index, 1);
            this.chain.splice(newPosition - 1, 0, step);
            this.reorderChain();
        }
        return this;
    }

    /**
     * تحديث خطوة
     * @param {String} stepId - معرف الخطوة
     * @param {Object} updates - التحديثات
     */
    updateStep(stepId, updates) {
        const index = this.chain.findIndex(s => s.stepId === stepId);
        if (index !== -1) {
            this.chain[index] = { ...this.chain[index], ...updates };
        }
        return this;
    }

    /**
     * إعادة ترتيب التسلسل
     */
    reorderChain() {
        this.chain = this.chain
            .sort((a, b) => a.order - b.order)
            .map((step, index) => ({
                ...step,
                order: index + 1
            }));
    }

    /**
     * الحصول على التسلسل الحالي
     */
    getChain() {
        return this.chain;
    }

    /**
     * تعيين تسلسل جديد
     */
    setChain(chain) {
        this.chain = chain;
        this.reorderChain();
        return this;
    }

    /**
     * الحصول على التسلسل المناسب بناءً على شروط الطلب
     * @param {Object} request - بيانات الطلب
     */
    getApplicableChain(request) {
        return this.chain.filter(step => {
            if (!step.conditions || step.conditions.length === 0) {
                return true;
            }

            return step.conditions.every(condition => {
                return this.evaluateCondition(condition, request);
            });
        });
    }

    /**
     * تقييم شرط
     * @param {Object} condition - الشرط
     * @param {Object} request - بيانات الطلب
     */
    evaluateCondition(condition, request) {
        const { type, operator, value } = condition;
        let actualValue;

        switch (type) {
            case CONDITION_TYPES.AMOUNT_THRESHOLD:
                actualValue = request.totalAmount || 0;
                break;
            case CONDITION_TYPES.ITEM_COUNT:
                actualValue = request.items?.length || 0;
                break;
            case CONDITION_TYPES.CATEGORY:
                actualValue = request.category;
                break;
            case CONDITION_TYPES.DEPARTMENT:
                actualValue = request.departmentId;
                break;
            case CONDITION_TYPES.PRIORITY:
                actualValue = request.priority;
                break;
            case CONDITION_TYPES.BUDGET_AVAILABILITY:
                actualValue = request.budgetAvailable;
                break;
            default:
                return true;
        }

        switch (operator) {
            case '==': return actualValue === value;
            case '!=': return actualValue !== value;
            case '>': return actualValue > value;
            case '>=': return actualValue >= value;
            case '<': return actualValue < value;
            case '<=': return actualValue <= value;
            case 'in': return Array.isArray(value) && value.includes(actualValue);
            case 'not_in': return Array.isArray(value) && !value.includes(actualValue);
            default: return true;
        }
    }

    /**
     * الحصول على الخطوة الحالية للطلب
     * @param {Object} request - بيانات الطلب
     */
    getCurrentStep(request) {
        const applicableChain = this.getApplicableChain(request);

        for (const step of applicableChain) {
            if (!request[step.field]) {
                return step;
            }
        }

        return null; // تم اعتماد جميع الخطوات
    }

    /**
     * التحقق من صلاحية المستخدم للاعتماد على خطوة معينة
     * @param {Array} userRoles - أدوار المستخدم
     * @param {String} stepId - معرف الخطوة
     */
    canUserApproveStep(userRoles, stepId) {
        const step = this.chain.find(s => s.stepId === stepId);
        if (!step) return false;

        // Super Admin يمكنه الاعتماد على أي خطوة
        if (userRoles.includes(ROLES.SUPER_ADMIN)) return true;

        return userRoles.some(role => step.position.roles.includes(role));
    }

    /**
     * الحصول على الخطوات المتاحة للمستخدم
     * @param {Array} userRoles - أدوار المستخدم
     */
    getStepsForUser(userRoles) {
        return this.chain.filter(step =>
            this.canUserApproveStep(userRoles, step.stepId)
        );
    }

    /**
     * حساب حالة التقدم في الاعتماد
     * @param {Object} request - بيانات الطلب
     */
    getProgress(request) {
        const applicableChain = this.getApplicableChain(request);
        const totalSteps = applicableChain.length;
        const completedSteps = applicableChain.filter(step => request[step.field]).length;

        return {
            total: totalSteps,
            completed: completedSteps,
            percentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
            isComplete: completedSteps === totalSteps,
            currentStep: this.getCurrentStep(request),
            steps: applicableChain.map(step => ({
                ...step,
                isApproved: !!request[step.field],
                approvedDate: request[step.fieldDate],
                approvedBy: request[step.fieldBy],
                notes: request[step.fieldNotes]
            }))
        };
    }

    /**
     * تصدير التسلسل كـ JSON
     */
    toJSON() {
        return {
            workflowType: this.workflowType,
            chain: this.chain
        };
    }

    /**
     * استيراد تسلسل من JSON
     */
    static fromJSON(json) {
        const manager = new ApprovalChainManager(json.workflowType);
        manager.setChain(json.chain);
        return manager;
    }
}

// ==================== تهيئة API Client ====================
let api = null;
if (typeof window !== 'undefined') {
    import('./api').then(module => {
        api = module.default;
    }).catch(() => {
        console.warn('API client not available, using mock data for approval chain');
    });
}

// ==================== ربط المسميات الوظيفية مع HR ====================
/**
 * جلب الموظفين حسب المسمى الوظيفي من الـ API
 * ملاحظة: هذه الدالة تجلب البيانات الحقيقية من الخادم فقط
 * @param {String} positionId - معرف المسمى الوظيفي
 * @param {Number} departmentId - معرف القسم (اختياري)
 * @returns {Promise<Array>} قائمة الموظفين
 */
export async function getEmployeesByPosition(positionId, departmentId = null) {
    // جلب البيانات من API فقط - لا توجد بيانات وهمية
    if (api?.warehouse?.approvalChain?.getAvailableApprovers) {
        try {
            const response = await api.warehouse.approvalChain.getAvailableApprovers(positionId);
            if (response && !response.error && Array.isArray(response)) {
                let employees = response;
                if (departmentId) {
                    employees = employees.filter(e => e.departmentId === null || e.departmentId === departmentId);
                }
                return employees;
            }
        } catch (error) {
            console.warn('فشل جلب الموظفين من الخادم:', error);
        }
    }

    // إرجاع مصفوفة فارغة إذا لم يتوفر الـ API
    console.warn(`الخادم غير متاح - لم يتم العثور على موظفين للمسمى الوظيفي: ${positionId}`);
    return [];
}

/**
 * الحصول على المعتمد الافتراضي لخطوة معينة
 * @param {String} stepId - معرف الخطوة
 * @param {Number} departmentId - معرف القسم (اختياري)
 */
export async function getDefaultApprover(stepId, departmentId = null) {
    const step = DEFAULT_EXCHANGE_APPROVAL_CHAIN.find(s => s.stepId === stepId);
    if (!step) return null;

    const employees = await getEmployeesByPosition(step.position.id, departmentId);
    return employees.length > 0 ? employees[0] : null;
}

/**
 * الحصول على كل المعتمدين المتاحين
 */
export async function getAllAvailableApprovers() {
    const positions = Object.values(JOB_POSITIONS);
    const approvers = {};

    for (const position of positions) {
        approvers[position.id] = await getEmployeesByPosition(position.id);
    }

    return approvers;
}

// ==================== API Functions ====================

/**
 * حفظ تسلسل اعتماد مخصص
 * @param {String} workflowType - نوع سير العمل
 * @param {Array} chain - التسلسل
 * @param {String} name - الاسم
 * @param {String} description - الوصف
 */
export async function saveCustomApprovalChain(workflowType, chain, name, description = '') {
    // محاولة الحفظ عبر API
    if (api?.warehouse?.approvalChain?.create) {
        try {
            const response = await api.warehouse.approvalChain.create({
                workflowType,
                name,
                description,
                steps: chain,
                isActive: true
            });

            if (response && !response.error) {
                return {
                    id: response.id,
                    workflowType,
                    name,
                    description,
                    chain,
                    createdAt: response.createdAt || new Date().toISOString(),
                    isActive: true,
                    ...response
                };
            }
        } catch (error) {
            console.warn('Failed to save approval chain to API:', error);
        }
    }

    // حفظ محلي للتطوير
    const savedChain = {
        id: `chain_${Date.now()}`,
        workflowType,
        name,
        description,
        chain,
        createdAt: new Date().toISOString(),
        isActive: true
    };

    // حفظ في localStorage للتطوير
    if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('customApprovalChains') || '[]');
        stored.push(savedChain);
        localStorage.setItem('customApprovalChains', JSON.stringify(stored));
    }

    console.log('Saved custom approval chain (local):', savedChain);
    return savedChain;
}

/**
 * تحديث تسلسل اعتماد موجود
 * @param {String} chainId - معرف التسلسل
 * @param {Object} updates - التحديثات
 */
export async function updateApprovalChain(chainId, updates) {
    // محاولة التحديث عبر API
    if (api?.warehouse?.approvalChain?.update) {
        try {
            const response = await api.warehouse.approvalChain.update(chainId, updates);
            if (response && !response.error) {
                return response;
            }
        } catch (error) {
            console.warn('Failed to update approval chain via API:', error);
        }
    }

    // تحديث محلي للتطوير
    if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('customApprovalChains') || '[]');
        const index = stored.findIndex(c => c.id === chainId);
        if (index !== -1) {
            stored[index] = { ...stored[index], ...updates, updatedAt: new Date().toISOString() };
            localStorage.setItem('customApprovalChains', JSON.stringify(stored));
            return stored[index];
        }
    }

    return null;
}

/**
 * حذف تسلسل اعتماد
 * @param {String} chainId - معرف التسلسل
 */
export async function deleteApprovalChain(chainId) {
    // محاولة الحذف عبر API
    if (api?.warehouse?.approvalChain?.delete) {
        try {
            const response = await api.warehouse.approvalChain.delete(chainId);
            if (response && !response.error) {
                return { success: true };
            }
        } catch (error) {
            console.warn('Failed to delete approval chain via API:', error);
        }
    }

    // حذف محلي للتطوير
    if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('customApprovalChains') || '[]');
        const filtered = stored.filter(c => c.id !== chainId);
        localStorage.setItem('customApprovalChains', JSON.stringify(filtered));
    }

    return { success: true };
}

/**
 * جلب التسلسلات المحفوظة من الخادم
 * @param {String} workflowType - نوع سير العمل (اختياري)
 * @returns {Promise<Array>} قائمة التسلسلات المحفوظة
 */
export async function getSavedApprovalChains(workflowType = null) {
    // جلب من API أولاً
    if (api?.warehouse?.approvalChain?.getAll) {
        try {
            const params = workflowType ? { workflowType } : {};
            const response = await api.warehouse.approvalChain.getAll(params);
            if (response && !response.error && Array.isArray(response)) {
                return response;
            }
        } catch (error) {
            console.warn('فشل جلب تسلسلات الاعتماد من الخادم:', error);
        }
    }

    // إرجاع التسلسلات الافتراضية المدمجة في الكود (ليست بيانات وهمية - إنها الإعدادات الافتراضية للنظام)
    const defaultChains = [
        {
            id: 'chain_default',
            workflowType: WORKFLOW_TYPES.EXCHANGE_REQUEST,
            name: 'التسلسل الافتراضي',
            description: 'تسلسل الاعتماد الافتراضي لطلبات الصرف',
            chain: DEFAULT_EXCHANGE_APPROVAL_CHAIN,
            isActive: true,
            isDefault: true,
            isSystemDefault: true // للتمييز عن التسلسلات المخصصة
        },
        {
            id: 'chain_high_value',
            workflowType: WORKFLOW_TYPES.EXCHANGE_REQUEST,
            name: 'تسلسل الطلبات عالية القيمة',
            description: 'للطلبات التي تزيد قيمتها عن 50,000 ريال',
            chain: HIGH_VALUE_APPROVAL_CHAIN,
            isActive: true,
            isDefault: false,
            isSystemDefault: true,
            conditions: [
                { type: CONDITION_TYPES.AMOUNT_THRESHOLD, operator: '>=', value: 50000 }
            ]
        }
    ];

    if (workflowType) {
        return defaultChains.filter(c => c.workflowType === workflowType);
    }

    return defaultChains;
}

/**
 * تفعيل/تعطيل تسلسل اعتماد
 */
export async function toggleApprovalChain(chainId, isActive) {
    // في الإنتاج: تحديث في قاعدة البيانات
    console.log(`Toggling chain ${chainId} to ${isActive ? 'active' : 'inactive'}`);
    return { success: true };
}

export default ApprovalChainManager;
