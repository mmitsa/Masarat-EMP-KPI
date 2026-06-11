/**
 * صلاحيات المستودعات وسلسلة الاعتمادات
 * بناءً على نظام HR-Warehouse-Management
 */

import { ROLES } from './rbac';

/**
 * أدوار المستودعات ومعرفاتها (LinkId)
 */
export const WAREHOUSE_LINK_IDS = {
    MUNICIPALITY: 1,        // رئيس البلدية
    HEAD_WAREHOUSE: 2,      // مدير المستودع
    SECURITY_WAREHOUSE: 3,  // أمين المستودع
    INVENTORY_AUDITOR: 4,   // مراقب المخزون (Authorized)
    PUBLIC_SERVICES: 6,     // مدير الخدمات العامة
};

/**
 * تعريف صلاحيات كل دور في المستودعات
 */
export const WAREHOUSE_PERMISSIONS = {
    // مدير المستودع (LinkId: 2)
    [ROLES.HEAD_WAREHOUSE]: {
        nameAr: 'مدير المستودع',
        nameEn: 'Head Warehouse Manager',
        linkId: 2,
        permissions: [
            'warehouse.view',
            'warehouse.items.view',
            'warehouse.items.manage',
            'warehouse.employees.assign',
            'warehouse.reports.view',
            'warehouse.exchange.approve',        // الموافقة على طلبات الصرف
            'warehouse.return.approve',          // الموافقة على طلبات الإرجاع
            'warehouse.receipt.approve',         // الموافقة على الاستلام المؤقت
            'warehouse.inventory.review',        // مراجعة الجرد
            'warehouse.settings.manage',         // إدارة الإعدادات
        ],
        approvalField: 'HeadWarehouse_Accept',
        approvalDateField: 'HeadWarehouse_Date',
        approvalIdField: 'HeadWarehouse_Id',
    },

    // أمين المستودع (LinkId: 3)
    [ROLES.SECURITY_WAREHOUSE]: {
        nameAr: 'أمين المستودع',
        nameEn: 'Security Warehouse Keeper',
        linkId: 3,
        permissions: [
            'warehouse.view',
            'warehouse.items.view',
            'warehouse.items.receive',           // استلام الأصناف
            'warehouse.items.dispatch',          // صرف الأصناف
            'warehouse.exchange.verify',         // التحقق من الصرف
            'warehouse.return.verify',           // التحقق من الإرجاع
            'warehouse.receipt.verify',          // التحقق من الاستلام
            'warehouse.inventory.approve',       // الموافقة على الجرد
            'warehouse.custody.manage',          // إدارة العهد
        ],
        approvalField: 'SecurityWarehouse_Accept',
        approvalDateField: 'SecurityWarehouse_Date',
        approvalIdField: 'SecurityWarehouse_Id',
    },

    // مراقب المخزون (LinkId: 4)
    [ROLES.INVENTORY_AUDITOR]: {
        nameAr: 'مراقب المخزون',
        nameEn: 'Inventory Auditor',
        linkId: 4,
        permissions: [
            'warehouse.view',
            'warehouse.items.view',
            'warehouse.reports.view',
            'warehouse.exchange.final_approve',  // الموافقة النهائية على الصرف
            'warehouse.return.final_approve',    // الموافقة النهائية على الإرجاع
            'warehouse.receipt.final_approve',   // الموافقة النهائية على الاستلام
            'warehouse.inventory.final_approve', // الموافقة النهائية على الجرد
            'warehouse.audit.all',               // تدقيق جميع العمليات
        ],
        approvalField: 'Authorized_Accept',
        approvalDateField: 'Authorized_Date',
        approvalIdField: 'Authorized_Id',
    },

    // مدير الخدمات العامة (LinkId: 6)
    [ROLES.PUBLIC_SERVICES]: {
        nameAr: 'مدير الخدمات العامة',
        nameEn: 'Public Services Manager',
        linkId: 6,
        permissions: [
            'warehouse.view',
            'warehouse.items.view',
            'warehouse.reports.view',
            'warehouse.exchange.admin_approve',  // الموافقة الإدارية على الصرف
            'warehouse.return.admin_approve',    // الموافقة الإدارية على الإرجاع
            'warehouse.receipt.admin_approve',   // الموافقة الإدارية على الاستلام
        ],
        approvalField: 'Public_Services_Accept',
        approvalDateField: 'Public_Services_Date',
        approvalIdField: 'Public_Services_Id',
    },

    // رئيس البلدية (LinkId: 1)
    [ROLES.MUNICIPALITY_MANAGER]: {
        nameAr: 'رئيس البلدية',
        nameEn: 'Municipality Manager',
        linkId: 1,
        permissions: [
            'warehouse.view',
            'warehouse.reports.view',
            'warehouse.exchange.executive_approve',  // الموافقة التنفيذية
            'warehouse.return.executive_approve',
            'warehouse.receipt.executive_approve',
            'warehouse.all.override',                // تجاوز جميع الصلاحيات
        ],
        approvalField: 'Municipality_Accept',
        approvalDateField: 'Municipality_Date',
        approvalIdField: 'Municipality_Id',
    },
};

/**
 * سلسلة الاعتمادات لكل نوع من العمليات
 */
export const APPROVAL_WORKFLOWS = {
    // طلب الصرف (Exchange Request)
    EXCHANGE_REQUEST: {
        nameAr: 'طلب صرف',
        nameEn: 'Exchange Request',
        steps: [
            {
                order: 1,
                role: ROLES.MUNICIPALITY_MANAGER,
                field: 'Municipality_Accept',
                required: false, // اختياري
                label: 'موافقة رئيس البلدية',
            },
            {
                order: 2,
                role: ROLES.HEAD_WAREHOUSE,
                field: 'HeadWarehouse_Accept',
                required: true,
                label: 'موافقة مدير المستودع',
            },
            {
                order: 3,
                role: ROLES.SECURITY_WAREHOUSE,
                field: 'SecurityWarehouse_Accept',
                required: true,
                label: 'تحقق أمين المستودع',
            },
            {
                order: 4,
                role: ROLES.INVENTORY_AUDITOR,
                field: 'Authorized_Accept',
                required: true,
                label: 'موافقة مراقب المخزون',
            },
            {
                order: 5,
                role: ROLES.PUBLIC_SERVICES,
                field: 'Public_Services_Accept',
                required: true,
                label: 'موافقة الخدمات العامة',
            },
        ],
    },

    // طلب الإرجاع (Return Request)
    RETURN_REQUEST: {
        nameAr: 'طلب إرجاع',
        nameEn: 'Return Request',
        steps: [
            {
                order: 1,
                role: ROLES.MUNICIPALITY_MANAGER,
                field: 'Municipality_Accept',
                required: false,
                label: 'موافقة رئيس البلدية',
            },
            {
                order: 2,
                role: ROLES.HEAD_WAREHOUSE,
                field: 'HeadWarehouse_Accept',
                required: true,
                label: 'موافقة مدير المستودع',
            },
            {
                order: 3,
                role: ROLES.SECURITY_WAREHOUSE,
                field: 'SecurityWarehouse_Accept',
                required: true,
                label: 'تحقق أمين المستودع',
            },
            {
                order: 4,
                role: 'TECHNICAL_COMMITTEE',
                field: 'Tech_Accept',
                required: true,
                label: 'فحص اللجنة الفنية',
                multiApprover: true,
                approvers: ['Tech_Id', 'Tech_Id2', 'Tech_Id3'],
            },
            {
                order: 5,
                role: ROLES.INVENTORY_AUDITOR,
                field: 'Authorized_Accept',
                required: true,
                label: 'موافقة مراقب المخزون',
            },
            {
                order: 6,
                role: ROLES.PUBLIC_SERVICES,
                field: 'Public_Services_Accept',
                required: true,
                label: 'موافقة الخدمات العامة',
            },
        ],
    },

    // الاستلام المؤقت (Temp Receipt Report)
    TEMP_RECEIPT: {
        nameAr: 'استلام مؤقت',
        nameEn: 'Temporary Receipt',
        steps: [
            {
                order: 1,
                role: ROLES.HEAD_WAREHOUSE,
                field: 'HeadWarehouse_Accept',
                required: true,
                label: 'مراجعة مدير المستودع',
            },
            {
                order: 2,
                role: ROLES.SECURITY_WAREHOUSE,
                field: 'SecurityWarehouse_Accept',
                required: true,
                label: 'تحقق أمين المستودع',
            },
            {
                order: 3,
                role: 'TECHNICAL_COMMITTEE',
                field: 'Tech_Accept',
                required: true,
                label: 'فحص اللجنة الفنية',
            },
            {
                order: 4,
                role: ROLES.PUBLIC_SERVICES,
                field: 'Public_Services_Accept',
                required: true,
                label: 'موافقة الخدمات العامة',
            },
            {
                order: 5,
                role: ROLES.INVENTORY_AUDITOR,
                field: 'Authorized_Accept',
                required: true,
                label: 'الاعتماد النهائي',
            },
        ],
    },

    // الاستلام النهائي (Receipt Report)
    RECEIPT_REPORT: {
        nameAr: 'استلام نهائي',
        nameEn: 'Final Receipt',
        steps: [
            {
                order: 1,
                role: ROLES.HEAD_WAREHOUSE,
                field: 'HeadWarehouse_Accept',
                required: true,
                label: 'مراجعة مدير المستودع',
            },
            {
                order: 2,
                role: ROLES.PUBLIC_SERVICES,
                field: 'Public_Services_Accept',
                required: true,
                label: 'مراجعة الخدمات العامة',
            },
            {
                order: 3,
                role: ROLES.SECURITY_WAREHOUSE,
                field: 'Recipient_Accept',
                required: true,
                label: 'تدقيق أمين المستودع',
            },
            {
                order: 4,
                role: 'TECHNICAL_MEMBER',
                field: 'Technical_Member_Accept',
                required: true,
                label: 'فحص العضو الفني',
            },
            {
                order: 5,
                role: 'RESPONSIBLE_PRESIDENT',
                field: 'Responsible_President_Accept',
                required: true,
                label: 'موافقة رئيس المسؤول',
            },
            {
                order: 6,
                role: ROLES.INVENTORY_AUDITOR,
                field: 'Authorized_Accept',
                required: true,
                label: 'الاعتماد النهائي',
            },
        ],
    },

    // ملف الجرد (Inventory Form)
    INVENTORY_FORM: {
        nameAr: 'ملف جرد',
        nameEn: 'Inventory Form',
        steps: [
            {
                order: 1,
                role: ROLES.SECURITY_WAREHOUSE,
                field: 'SecurityWarehouse_Accept',
                required: true,
                label: 'موافقة أمين المستودع',
            },
            {
                order: 2,
                role: ROLES.HEAD_WAREHOUSE,
                field: 'HeadWarehouse_Accept',
                required: true,
                label: 'موافقة مدير المستودع',
            },
            {
                order: 3,
                role: ROLES.INVENTORY_AUDITOR,
                field: 'Authorized_Accept',
                required: true,
                label: 'اعتماد مراقب المخزون',
            },
        ],
    },
};

/**
 * التحقق من صلاحية المستخدم للموافقة على خطوة معينة
 */
export function canApproveStep(userRoles, workflow, stepOrder) {
    const workflowDef = APPROVAL_WORKFLOWS[workflow];
    if (!workflowDef) return false;

    const step = workflowDef.steps.find(s => s.order === stepOrder);
    if (!step) return false;

    // Super Admin يمكنه الموافقة على كل شيء
    if (userRoles.includes(ROLES.SUPER_ADMIN)) return true;

    // التحقق من الدور المطلوب
    return userRoles.includes(step.role);
}

/**
 * الحصول على الخطوة التالية في سلسلة الاعتمادات
 */
export function getNextApprovalStep(workflow, currentStepOrder) {
    const workflowDef = APPROVAL_WORKFLOWS[workflow];
    if (!workflowDef) return null;

    const nextStep = workflowDef.steps.find(s => s.order === currentStepOrder + 1);
    return nextStep || null;
}

/**
 * الحصول على حالة الطلب بناءً على الموافقات
 */
export function getRequestStatus(request, workflow) {
    const workflowDef = APPROVAL_WORKFLOWS[workflow];
    if (!workflowDef) return 'unknown';

    // التحقق من الرفض
    if (request.RejectBy || request.IsRejected === true) {
        return 'rejected';
    }

    // التحقق من كل خطوة
    let completedSteps = 0;
    let pendingStep = null;

    for (const step of workflowDef.steps) {
        if (!step.required) continue;

        const approvalValue = request[step.field];

        if (approvalValue === '1' || approvalValue === true) {
            completedSteps++;
        } else if (approvalValue === '0' || approvalValue === false) {
            return 'rejected';
        } else if (!pendingStep) {
            pendingStep = step;
        }
    }

    const requiredSteps = workflowDef.steps.filter(s => s.required).length;

    if (completedSteps === requiredSteps) {
        return 'approved';
    } else if (pendingStep) {
        return `pending_${pendingStep.role}`;
    }

    return 'pending';
}

/**
 * التحقق من صلاحية المستخدم لعملية معينة في المستودع
 */
export function hasWarehousePermission(userRoles, permission) {
    if (!userRoles || !Array.isArray(userRoles)) return false;

    // Super Admin لديه كل الصلاحيات
    if (userRoles.includes(ROLES.SUPER_ADMIN)) return true;

    // التحقق من كل دور
    for (const role of userRoles) {
        const rolePermissions = WAREHOUSE_PERMISSIONS[role];
        if (rolePermissions && rolePermissions.permissions.includes(permission)) {
            return true;
        }
    }

    return false;
}

/**
 * الحصول على جميع صلاحيات المستخدم في المستودعات
 */
export function getWarehousePermissions(userRoles) {
    const permissions = new Set();

    if (!userRoles || !Array.isArray(userRoles)) return [];

    // Super Admin
    if (userRoles.includes(ROLES.SUPER_ADMIN)) {
        Object.values(WAREHOUSE_PERMISSIONS).forEach(role => {
            role.permissions.forEach(p => permissions.add(p));
        });
        return Array.from(permissions);
    }

    // جمع صلاحيات كل دور
    for (const role of userRoles) {
        const rolePermissions = WAREHOUSE_PERMISSIONS[role];
        if (rolePermissions) {
            rolePermissions.permissions.forEach(p => permissions.add(p));
        }
    }

    return Array.from(permissions);
}

/**
 * الحصول على العمليات المعلقة للمستخدم
 */
export function getPendingActionsForRole(role) {
    const pendingActions = [];

    for (const [workflowKey, workflow] of Object.entries(APPROVAL_WORKFLOWS)) {
        const step = workflow.steps.find(s => s.role === role);
        if (step) {
            pendingActions.push({
                workflow: workflowKey,
                workflowName: workflow.nameAr,
                step: step.order,
                stepLabel: step.label,
                field: step.field,
            });
        }
    }

    return pendingActions;
}

export default {
    WAREHOUSE_LINK_IDS,
    WAREHOUSE_PERMISSIONS,
    APPROVAL_WORKFLOWS,
    canApproveStep,
    getNextApprovalStep,
    getRequestStatus,
    hasWarehousePermission,
    getWarehousePermissions,
    getPendingActionsForRole,
};
