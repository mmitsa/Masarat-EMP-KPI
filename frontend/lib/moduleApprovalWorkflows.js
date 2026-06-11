/**
 * تعريف تسلسلات الاعتمادات لجميع الموديولات
 * Module Approval Workflow Definitions
 */

import { JOB_TITLES } from './permissions';

// ============================================
// تسلسلات الاعتمادات الافتراضية لكل موديول
// ============================================

export const MODULE_APPROVAL_WORKFLOWS = {
    hr: {
        nameAr: 'الموارد البشرية',
        workflows: [
            {
                id: 'hr_leave_request',
                nameAr: 'اعتماد طلب إجازة',
                nameEn: 'Leave Request Approval',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'employee', label: 'الموظف البديل', required: false },
                    { id: 'step_2', order: 2, roleId: 'department_director', label: 'المدير المباشر', required: true },
                    { id: 'step_3', order: 3, roleId: 'hr_director', label: 'صاحب الصلاحية', required: true },
                    { id: 'step_4', order: 4, roleId: 'hr_employee', label: 'الموارد البشرية', required: false },
                ],
            },
            {
                id: 'hr_salary_change',
                nameAr: 'تعديل راتب',
                nameEn: 'Salary Change Approval',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'hr_employee', label: 'إعداد طلب التعديل', required: true },
                    { id: 'step_2', order: 2, roleId: 'hr_director', label: 'مراجعة مدير الموارد البشرية', required: true },
                    { id: 'step_3', order: 3, roleId: 'finance_director', label: 'موافقة المدير المالي', required: true },
                    { id: 'step_4', order: 4, roleId: 'deputy_mayor_assistant', label: 'الاعتماد النهائي', required: true },
                ],
            },
            {
                id: 'hr_promotion',
                nameAr: 'ترقية موظف',
                nameEn: 'Employee Promotion',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'department_director', label: 'ترشيح المدير المباشر', required: true },
                    { id: 'step_2', order: 2, roleId: 'hr_director', label: 'مراجعة الموارد البشرية', required: true },
                    { id: 'step_3', order: 3, roleId: 'deputy_mayor_assistant', label: 'الاعتماد النهائي', required: true },
                ],
            },
            {
                id: 'hr_transfer',
                nameAr: 'نقل موظف',
                nameEn: 'Employee Transfer',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'department_director', label: 'موافقة الإدارة المصدر', required: true },
                    { id: 'step_2', order: 2, roleId: 'department_director', label: 'موافقة الإدارة المستقبلة', required: true },
                    { id: 'step_3', order: 3, roleId: 'hr_director', label: 'مراجعة الموارد البشرية', required: true },
                    { id: 'step_4', order: 4, roleId: 'deputy_mayor_assistant', label: 'الاعتماد النهائي', required: true },
                ],
            },
            {
                id: 'hr_decision',
                nameAr: 'قرار إداري',
                nameEn: 'Administrative Decision',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'decision_issuer', label: 'إعداد القرار', required: true },
                    { id: 'step_2', order: 2, roleId: 'hr_director', label: 'مراجعة مدير الموارد البشرية', required: true },
                    { id: 'step_3', order: 3, roleId: 'deputy_mayor_assistant', label: 'الاعتماد النهائي', required: true },
                ],
            },
            {
                id: 'hr_overtime',
                nameAr: 'اعتماد عمل إضافي',
                nameEn: 'Overtime Approval',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'department_director', label: 'المدير المباشر', required: true },
                    { id: 'step_2', order: 2, roleId: 'hr_director', label: 'مراجعة الموارد البشرية', required: true },
                    { id: 'step_3', order: 3, roleId: 'finance_director', label: 'الموافقة المالية', required: true },
                ],
            },
            {
                id: 'hr_delegation',
                nameAr: 'تفويض صلاحيات',
                nameEn: 'Delegation Approval',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'department_director', label: 'طلب التفويض', required: true },
                    { id: 'step_2', order: 2, roleId: 'hr_director', label: 'مراجعة الموارد البشرية', required: true },
                    { id: 'step_3', order: 3, roleId: 'deputy_mayor_assistant', label: 'الاعتماد النهائي', required: true },
                ],
            },
        ],
    },

    warehouse: {
        nameAr: 'المستودعات',
        workflows: [
            {
                id: 'warehouse_exchange_request',
                nameAr: 'طلب صرف',
                nameEn: 'Exchange Request',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'department_director', label: 'موافقة رئيس القسم', required: true },
                    { id: 'step_2', order: 2, roleId: 'warehouse_director', label: 'موافقة مدير المستودع', required: true },
                    { id: 'step_3', order: 3, roleId: 'warehouse_keeper', label: 'تحقق أمين المستودع', required: true },
                    { id: 'step_4', order: 4, roleId: 'inventory_controller', label: 'موافقة مراقب المخزون', required: true },
                    { id: 'step_5', order: 5, roleId: 'deputy_mayor_assistant', label: 'موافقة الخدمات العامة', required: true },
                ],
            },
            {
                id: 'warehouse_return_request',
                nameAr: 'طلب إرجاع',
                nameEn: 'Return Request',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'department_director', label: 'موافقة رئيس القسم', required: true },
                    { id: 'step_2', order: 2, roleId: 'warehouse_director', label: 'موافقة مدير المستودع', required: true },
                    { id: 'step_3', order: 3, roleId: 'warehouse_keeper', label: 'تحقق أمين المستودع', required: true },
                    { id: 'step_4', order: 4, roleId: 'it_employee', label: 'فحص اللجنة الفنية', required: true },
                    { id: 'step_5', order: 5, roleId: 'inventory_controller', label: 'موافقة مراقب المخزون', required: true },
                    { id: 'step_6', order: 6, roleId: 'deputy_mayor_assistant', label: 'موافقة الخدمات العامة', required: true },
                ],
            },
            {
                id: 'warehouse_temp_receipt',
                nameAr: 'استلام مؤقت',
                nameEn: 'Temporary Receipt',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'warehouse_director', label: 'مراجعة مدير المستودع', required: true },
                    { id: 'step_2', order: 2, roleId: 'warehouse_keeper', label: 'تحقق أمين المستودع', required: true },
                    { id: 'step_3', order: 3, roleId: 'it_employee', label: 'فحص اللجنة الفنية', required: true },
                    { id: 'step_4', order: 4, roleId: 'deputy_mayor_assistant', label: 'موافقة الخدمات العامة', required: true },
                    { id: 'step_5', order: 5, roleId: 'inventory_controller', label: 'الاعتماد النهائي', required: true },
                ],
            },
            {
                id: 'warehouse_receipt_report',
                nameAr: 'محضر استلام',
                nameEn: 'Receipt Protocol',
                rejectionPolicy: {
                    returnToCreator: true,
                    requireRejectionReason: true,
                    resumeFromRejector: true,
                    description: 'عند الرفض في أي مرحلة يُعاد المحضر لمدخل المحضر لمعالجة الملاحظات وتصحيح المطلوب، ثم يُعتمد منه ويُرسل للرافض للتحقق والاعتماد لإكمال سلسلة الاعتمادات',
                },
                requiredAttachments: [
                    { id: 'claim', nameAr: 'المطالبة', required: true },
                    { id: 'sales_invoice', nameAr: 'فاتورة المبيعات بضريبة منفصلة', required: true },
                    { id: 'quantities_schedule', nameAr: 'جدول الكميات المعتمد بالأسعار من المعاملة', required: true },
                    { id: 'authorization_doc', nameAr: 'محضر التعميد أو الاستلام أو صورة العقد', required: true },
                ],
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'department_director', label: 'مدير الجهة المستلمة', required: true },
                    { id: 'step_2', order: 2, roleId: 'it_employee', label: 'عضو الفحص', required: true },
                    { id: 'step_3', order: 3, roleId: 'warehouse_director', label: 'مدير المستودعات', required: true },
                    { id: 'step_4', order: 4, roleId: 'inventory_controller', label: 'مراقب المخزون', required: true },
                ],
            },
            {
                id: 'warehouse_inventory_form',
                nameAr: 'ملف جرد',
                nameEn: 'Inventory Form',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'warehouse_keeper', label: 'موافقة أمين المستودع', required: true },
                    { id: 'step_2', order: 2, roleId: 'warehouse_director', label: 'موافقة مدير المستودع', required: true },
                    { id: 'step_3', order: 3, roleId: 'inventory_controller', label: 'اعتماد مراقب المخزون', required: true },
                ],
            },
        ],
    },

    finance: {
        nameAr: 'الإدارة المالية',
        workflows: [
            {
                id: 'finance_budget_approval',
                nameAr: 'اعتماد موازنة',
                nameEn: 'Budget Approval',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'accountant', label: 'إعداد الموازنة', required: true },
                    { id: 'step_2', order: 2, roleId: 'finance_director', label: 'مراجعة المدير المالي', required: true },
                    { id: 'step_3', order: 3, roleId: 'deputy_mayor_assistant', label: 'الاعتماد النهائي', required: true },
                ],
            },
            {
                id: 'finance_payment_approval',
                nameAr: 'اعتماد صرف مالي',
                nameEn: 'Payment Approval',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'accountant', label: 'إعداد أمر الصرف', required: true },
                    { id: 'step_2', order: 2, roleId: 'treasurer', label: 'مراجعة أمين الصندوق', required: true },
                    { id: 'step_3', order: 3, roleId: 'finance_director', label: 'موافقة المدير المالي', required: true },
                    { id: 'step_4', order: 4, roleId: 'deputy_mayor_assistant', label: 'الاعتماد النهائي', required: true },
                ],
            },
            {
                id: 'finance_purchase_order',
                nameAr: 'أمر شراء',
                nameEn: 'Purchase Order',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'department_director', label: 'طلب الشراء', required: true },
                    { id: 'step_2', order: 2, roleId: 'finance_director', label: 'مراجعة المدير المالي', required: true },
                    { id: 'step_3', order: 3, roleId: 'deputy_mayor_assistant', label: 'الاعتماد النهائي', required: true },
                ],
            },
            {
                id: 'finance_journal_entry',
                nameAr: 'قيد يومية',
                nameEn: 'Journal Entry',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'accountant', label: 'إعداد القيد', required: true },
                    { id: 'step_2', order: 2, roleId: 'finance_director', label: 'اعتماد المدير المالي', required: true },
                ],
            },
        ],
    },

    movement: {
        nameAr: 'إدارة الحركة',
        workflows: [
            {
                id: 'movement_trip_approval',
                nameAr: 'اعتماد رحلة',
                nameEn: 'Trip Approval',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'employee', label: 'طلب الرحلة', required: true },
                    { id: 'step_2', order: 2, roleId: 'department_director', label: 'موافقة المدير المباشر', required: true },
                    { id: 'step_3', order: 3, roleId: 'section_manager', label: 'تعيين المركبة والسائق', required: true },
                ],
            },
            {
                id: 'movement_fuel_request',
                nameAr: 'طلب وقود',
                nameEn: 'Fuel Request',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'employee', label: 'تقديم الطلب', required: true },
                    { id: 'step_2', order: 2, roleId: 'section_manager', label: 'موافقة مشرف الأسطول', required: true },
                    { id: 'step_3', order: 3, roleId: 'finance_director', label: 'الموافقة المالية', required: true },
                ],
            },
            {
                id: 'movement_maintenance_request',
                nameAr: 'طلب صيانة',
                nameEn: 'Maintenance Request',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'employee', label: 'الإبلاغ عن العطل', required: true },
                    { id: 'step_2', order: 2, roleId: 'section_manager', label: 'مراجعة المشرف', required: true },
                    { id: 'step_3', order: 3, roleId: 'department_director', label: 'الموافقة على الصيانة', required: true },
                ],
            },
        ],
    },

    projects: {
        nameAr: 'إدارة المشاريع',
        workflows: [
            {
                id: 'projects_approval',
                nameAr: 'اعتماد مشروع جديد',
                nameEn: 'New Project Approval',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'section_manager', label: 'إعداد المقترح', required: true },
                    { id: 'step_2', order: 2, roleId: 'department_director', label: 'مراجعة مدير الإدارة', required: true },
                    { id: 'step_3', order: 3, roleId: 'deputy_mayor_assistant', label: 'الاعتماد النهائي', required: true },
                ],
            },
            {
                id: 'projects_milestone_approval',
                nameAr: 'اعتماد مرحلة',
                nameEn: 'Milestone Approval',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'section_manager', label: 'تقرير إنجاز المرحلة', required: true },
                    { id: 'step_2', order: 2, roleId: 'department_director', label: 'مراجعة واعتماد', required: true },
                ],
            },
            {
                id: 'projects_change_request',
                nameAr: 'طلب تغيير على المشروع',
                nameEn: 'Change Request',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'section_manager', label: 'تقديم طلب التغيير', required: true },
                    { id: 'step_2', order: 2, roleId: 'department_director', label: 'مراجعة مدير المشروع', required: true },
                    { id: 'step_3', order: 3, roleId: 'deputy_mayor_assistant', label: 'الاعتماد النهائي', required: true },
                ],
            },
        ],
    },

    grc: {
        nameAr: 'الحوكمة والمخاطر',
        workflows: [
            {
                id: 'grc_risk_assessment',
                nameAr: 'تقييم مخاطر',
                nameEn: 'Risk Assessment Approval',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'auditor', label: 'إعداد تقييم المخاطر', required: true },
                    { id: 'step_2', order: 2, roleId: 'department_director', label: 'مراجعة مدير الإدارة', required: true },
                    { id: 'step_3', order: 3, roleId: 'deputy_mayor_assistant', label: 'الاعتماد النهائي', required: true },
                ],
            },
            {
                id: 'grc_incident_report',
                nameAr: 'تقرير حادثة',
                nameEn: 'Incident Report',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'employee', label: 'الإبلاغ عن الحادثة', required: true },
                    { id: 'step_2', order: 2, roleId: 'department_director', label: 'مراجعة المدير المباشر', required: true },
                    { id: 'step_3', order: 3, roleId: 'auditor', label: 'تحقيق المدقق', required: true },
                    { id: 'step_4', order: 4, roleId: 'deputy_mayor_assistant', label: 'الاعتماد النهائي', required: false },
                ],
            },
            {
                id: 'grc_audit_finding',
                nameAr: 'ملاحظة تدقيق',
                nameEn: 'Audit Finding',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'auditor', label: 'تسجيل الملاحظة', required: true },
                    { id: 'step_2', order: 2, roleId: 'department_director', label: 'مراجعة الجهة المعنية', required: true },
                    { id: 'step_3', order: 3, roleId: 'deputy_mayor_assistant', label: 'اعتماد خطة المعالجة', required: true },
                ],
            },
        ],
    },

    itsm: {
        nameAr: 'الدعم الفني',
        workflows: [
            {
                id: 'itsm_ticket_escalation',
                nameAr: 'تصعيد تذكرة',
                nameEn: 'Ticket Escalation',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'it_employee', label: 'المعالجة المبدئية', required: true },
                    { id: 'step_2', order: 2, roleId: 'section_manager', label: 'مراجعة المشرف', required: true },
                    { id: 'step_3', order: 3, roleId: 'it_director', label: 'اعتماد مدير التقنية', required: true },
                ],
            },
            {
                id: 'itsm_asset_request',
                nameAr: 'طلب أصل تقني',
                nameEn: 'IT Asset Request',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'employee', label: 'تقديم الطلب', required: true },
                    { id: 'step_2', order: 2, roleId: 'department_director', label: 'موافقة المدير المباشر', required: true },
                    { id: 'step_3', order: 3, roleId: 'it_director', label: 'موافقة مدير التقنية', required: true },
                    { id: 'step_4', order: 4, roleId: 'finance_director', label: 'الموافقة المالية', required: false },
                ],
            },
        ],
    },

    archiving: {
        nameAr: 'الأرشفة',
        workflows: [
            {
                id: 'archiving_access_request',
                nameAr: 'طلب وصول لوثيقة',
                nameEn: 'Document Access Request',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'employee', label: 'تقديم طلب الوصول', required: true },
                    { id: 'step_2', order: 2, roleId: 'department_director', label: 'موافقة المدير المباشر', required: true },
                    { id: 'step_3', order: 3, roleId: 'section_manager', label: 'مراجعة مسؤول الأرشيف', required: true },
                ],
            },
        ],
    },

    epm: {
        nameAr: 'قياس الأداء',
        workflows: [
            {
                id: 'epm_evaluation_approval',
                nameAr: 'اعتماد تقييم أداء',
                nameEn: 'Performance Evaluation Approval',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'department_director', label: 'إعداد التقييم', required: true },
                    { id: 'step_2', order: 2, roleId: 'hr_director', label: 'مراجعة الموارد البشرية', required: true },
                    { id: 'step_3', order: 3, roleId: 'deputy_mayor_assistant', label: 'الاعتماد النهائي', required: true },
                ],
            },
        ],
    },

    sadad: {
        nameAr: 'سداد',
        workflows: [
            {
                id: 'sadad_payment_approval',
                nameAr: 'اعتماد عملية دفع',
                nameEn: 'Payment Approval',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'accountant', label: 'إعداد عملية الدفع', required: true },
                    { id: 'step_2', order: 2, roleId: 'finance_director', label: 'موافقة المدير المالي', required: true },
                    { id: 'step_3', order: 3, roleId: 'deputy_mayor_assistant', label: 'الاعتماد النهائي', required: false },
                ],
            },
        ],
    },

    analytics: {
        nameAr: 'التحليلات',
        workflows: [
            {
                id: 'analytics_report_approval',
                nameAr: 'اعتماد تقرير',
                nameEn: 'Report Approval',
                defaultSteps: [
                    { id: 'step_1', order: 1, roleId: 'section_manager', label: 'إعداد التقرير', required: true },
                    { id: 'step_2', order: 2, roleId: 'department_director', label: 'مراجعة واعتماد', required: true },
                ],
            },
        ],
    },
};

// ============================================
// دوال مساعدة
// ============================================

/**
 * الحصول على أدوار JOB_TITLES بتنسيق dropdown
 */
export function getWorkflowRoleOptions() {
    return Object.values(JOB_TITLES).map(role => ({
        value: role.id,
        label: role.nameAr,
        category: role.category,
    }));
}

/**
 * تحميل تسلسلات الاعتمادات من localStorage أو الافتراضي
 */
export function loadModuleWorkflows(moduleId) {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`masarat-approval-workflows-${moduleId}`);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                // تجاهل البيانات التالفة
            }
        }
    }

    // الرجوع للافتراضي
    const moduleConfig = MODULE_APPROVAL_WORKFLOWS[moduleId];
    if (!moduleConfig?.workflows) return [];

    return moduleConfig.workflows.map(wf => ({
        id: wf.id,
        nameAr: wf.nameAr,
        nameEn: wf.nameEn,
        steps: wf.defaultSteps.map(s => ({ ...s })),
        ...(wf.rejectionPolicy && { rejectionPolicy: { ...wf.rejectionPolicy } }),
        ...(wf.requiredAttachments && { requiredAttachments: wf.requiredAttachments.map(a => ({ ...a })) }),
    }));
}

/**
 * حفظ تسلسلات الاعتمادات في localStorage
 */
export function saveModuleWorkflows(moduleId, workflows) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(
            `masarat-approval-workflows-${moduleId}`,
            JSON.stringify(workflows)
        );
    }
}

/**
 * تحميل تسلسلات الاعتمادات من API أولاً، ثم localStorage كـ fallback
 */
export async function loadModuleWorkflowsFromAPI(moduleId) {
    try {
        const { default: api } = await import('./api');
        const data = await api.permissionsManagement.getWorkflows(moduleId);
        if (data && data.workflows && data.workflows.length > 0) {
            const workflows = data.workflows.map(wf => ({
                id: wf.workflowId,
                nameAr: wf.workflowNameAr,
                steps: (wf.steps || []).map(s => ({
                    id: `step_${s.id}`,
                    order: s.stepOrder,
                    roleId: s.roleId,
                    assignType: s.assignType || 'position',
                    assigneeId: s.assigneeId || null,
                    assigneeName: s.assigneeName || null,
                    label: s.labelAr,
                    required: s.isRequired,
                })),
            }));
            // Cache to localStorage
            saveModuleWorkflows(moduleId, workflows);
            return workflows;
        }
    } catch (err) {
        console.warn('Failed to load workflows from API:', err.message);
    }
    // Fallback to localStorage
    return loadModuleWorkflows(moduleId);
}

/**
 * حفظ تسلسلات الاعتمادات إلى API + localStorage
 */
export async function saveModuleWorkflowsToAPI(moduleId, workflows) {
    // Always save to localStorage
    saveModuleWorkflows(moduleId, workflows);

    try {
        const { default: api } = await import('./api');
        const apiData = {
            workflows: workflows.map(wf => ({
                workflowId: wf.id,
                workflowNameAr: wf.nameAr,
                isActive: true,
                steps: (wf.steps || []).map(s => ({
                    stepOrder: s.order,
                    roleId: s.roleId,
                    assignType: s.assignType || 'position',
                    assigneeId: s.assigneeId || null,
                    assigneeName: s.assigneeName || null,
                    labelAr: s.label,
                    isRequired: s.required !== false,
                })),
            })),
        };
        await api.permissionsManagement.saveAllWorkflows(moduleId, apiData);
        return true;
    } catch (err) {
        console.warn('Failed to save workflows to API:', err.message);
        return false;
    }
}

/**
 * إنشاء ID فريد لخطوة جديدة
 */
export function generateStepId() {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}
