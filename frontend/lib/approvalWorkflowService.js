/**
 * خدمة سير عمل الاعتمادات الموحدة
 * Unified Approval Workflow Service
 *
 * نظام متكامل للتعامل مع:
 * - إدارة دورة حياة الطلبات
 * - تنفيذ الموافقات والرفض
 * - الإشعارات في الوقت الفعلي
 * - التكامل مع HR والمالية
 * - سجل التدقيق الكامل
 */

import { ApprovalChainManager, WORKFLOW_TYPES, JOB_POSITIONS, getEmployeesByPosition } from './approvalChain';
import { FinancialImpactCalculator, FINANCIAL_TRANSACTION_TYPES, postJournalEntry, checkBudgetAvailabilityAPI } from './financeIntegration';
import { inventoryService, MOVEMENT_TYPES } from './inventoryService';

// ==================== حالات الطلب ====================
export const REQUEST_STATUS = {
    DRAFT: 'draft',                    // مسودة
    PENDING: 'pending',                // في انتظار الاعتماد
    IN_REVIEW: 'in_review',            // قيد المراجعة
    APPROVED: 'approved',              // معتمد
    REJECTED: 'rejected',              // مرفوض
    CANCELLED: 'cancelled',            // ملغي
    COMPLETED: 'completed',            // مكتمل
    ESCALATED: 'escalated',            // تم التصعيد
};

// ==================== أنواع الإجراءات ====================
export const ACTION_TYPES = {
    SUBMIT: 'submit',                  // تقديم
    APPROVE: 'approve',                // موافقة
    REJECT: 'reject',                  // رفض
    RETURN: 'return',                  // إعادة للمرسل
    DELEGATE: 'delegate',              // تفويض
    ESCALATE: 'escalate',              // تصعيد
    CANCEL: 'cancel',                  // إلغاء
    COMPLETE: 'complete',              // إكمال
    COMMENT: 'comment',                // تعليق
};

// ==================== أنواع الإشعارات ====================
export const NOTIFICATION_TYPES = {
    NEW_REQUEST: 'new_request',                    // طلب جديد
    APPROVAL_REQUIRED: 'approval_required',        // مطلوب الاعتماد
    REQUEST_APPROVED: 'request_approved',          // تمت الموافقة
    REQUEST_REJECTED: 'request_rejected',          // تم الرفض
    REQUEST_RETURNED: 'request_returned',          // تم الإرجاع
    REQUEST_COMPLETED: 'request_completed',        // تم الإكمال
    DEADLINE_WARNING: 'deadline_warning',          // تحذير الموعد النهائي
    ESCALATION_NOTICE: 'escalation_notice',        // إشعار التصعيد
    DELEGATION_NOTICE: 'delegation_notice',        // إشعار التفويض
};

// ==================== API Client ====================
let api = null;
if (typeof window !== 'undefined') {
    import('./api').then(module => {
        api = module.default;
    }).catch(() => {
        console.warn('API client not available');
    });
}

// ==================== خدمة الاعتمادات الموحدة ====================
export class ApprovalWorkflowService {
    constructor() {
        this.chainManager = null;
        this.financialCalculator = new FinancialImpactCalculator();
        this.listeners = new Map();
    }

    /**
     * تهيئة الخدمة لنوع سير عمل معين
     * @param {String} workflowType - نوع سير العمل
     */
    initialize(workflowType = WORKFLOW_TYPES.EXCHANGE_REQUEST) {
        this.chainManager = new ApprovalChainManager(workflowType);
        return this;
    }

    // ==================== إدارة الطلبات ====================

    /**
     * تقديم طلب جديد للاعتماد
     * @param {Object} request - بيانات الطلب
     * @param {Object} submitter - بيانات مقدم الطلب
     */
    async submitRequest(request, submitter) {
        try {
            // التحقق من اكتمال البيانات
            this.validateRequest(request);

            // حساب التأثير المالي
            const financialImpact = await this.calculateFinancialImpact(request);

            // التحقق من توفر الميزانية
            const budgetCheck = await this.checkBudget(financialImpact);
            if (!budgetCheck.isAvailable) {
                return {
                    success: false,
                    error: 'budget_exceeded',
                    message: 'المبلغ المطلوب يتجاوز الميزانية المتاحة',
                    details: budgetCheck
                };
            }

            // الحصول على التسلسل المناسب
            const applicableChain = this.chainManager.getApplicableChain({
                ...request,
                totalAmount: financialImpact.summary.subtotal
            });

            // إنشاء سجل الطلب
            const submittedRequest = {
                ...request,
                id: request.id || `REQ-${Date.now()}`,
                status: REQUEST_STATUS.PENDING,
                currentStep: 1,
                totalSteps: applicableChain.length,
                approvalChain: applicableChain.map((step, index) => ({
                    ...step,
                    stepNumber: index + 1,
                    status: index === 0 ? 'pending' : 'waiting',
                    approvedBy: null,
                    approvedAt: null,
                    notes: null
                })),
                financialImpact,
                budgetCheck,
                submittedBy: submitter,
                submittedAt: new Date().toISOString(),
                history: [{
                    action: ACTION_TYPES.SUBMIT,
                    performedBy: submitter,
                    performedAt: new Date().toISOString(),
                    notes: 'تم تقديم الطلب'
                }]
            };

            // حفظ الطلب
            const savedRequest = await this.saveRequest(submittedRequest);

            // إرسال إشعار للمعتمد الأول
            await this.sendNotification(
                NOTIFICATION_TYPES.APPROVAL_REQUIRED,
                savedRequest,
                applicableChain[0]
            );

            // إطلاق حدث تقديم الطلب
            this.emit('requestSubmitted', savedRequest);

            return {
                success: true,
                request: savedRequest,
                message: 'تم تقديم الطلب بنجاح'
            };
        } catch (error) {
            console.warn('Error submitting request:', error);
            return {
                success: false,
                error: error.message,
                message: 'حدث خطأ أثناء تقديم الطلب'
            };
        }
    }

    /**
     * الموافقة على طلب
     * @param {String} requestId - معرف الطلب
     * @param {Number} stepNumber - رقم الخطوة
     * @param {Object} approver - بيانات المعتمد
     * @param {String} notes - ملاحظات (اختياري)
     */
    async approveRequest(requestId, stepNumber, approver, notes = '') {
        try {
            // جلب الطلب
            const request = await this.getRequest(requestId);
            if (!request) {
                throw new Error('الطلب غير موجود');
            }

            // التحقق من صلاحية الاعتماد
            const canApprove = await this.canUserApprove(request, stepNumber, approver);
            if (!canApprove.allowed) {
                return {
                    success: false,
                    error: 'unauthorized',
                    message: canApprove.reason
                };
            }

            // تحديث حالة الخطوة
            const stepIndex = stepNumber - 1;
            const currentStepData = request.approvalChain[stepIndex];
            request.approvalChain[stepIndex] = {
                ...currentStepData,
                status: 'approved',
                approvedBy: approver,
                approvedAt: new Date().toISOString(),
                notes
            };

            // إضافة للسجل
            request.history.push({
                action: ACTION_TYPES.APPROVE,
                performedBy: approver,
                performedAt: new Date().toISOString(),
                stepNumber,
                notes
            });

            // ==================== خصم الرصيد عند اعتماد مراقب المخزون ====================
            // إذا كان المعتمد هو مراقب المخزون (inventory_auditor)، يتم خصم الرصيد مباشرة
            const isInventoryAuditorStep = currentStepData?.position?.id === JOB_POSITIONS.INVENTORY_AUDITOR.id ||
                                           currentStepData?.stepId === 'inventory_auditor_approval';

            if (isInventoryAuditorStep && request.type === 'exchange_request') {
                try {
                    const inventoryResult = await this.processInventoryDeduction(request, approver);
                    request.inventoryProcessed = true;
                    request.inventoryProcessResult = inventoryResult;

                    // إضافة للسجل
                    request.history.push({
                        action: 'inventory_deducted',
                        performedBy: approver,
                        performedAt: new Date().toISOString(),
                        details: {
                            processedItems: inventoryResult.processedItems?.length || 0,
                            errors: inventoryResult.errors?.length || 0,
                        }
                    });

                    console.log('Inventory deducted by inventory auditor:', inventoryResult);
                } catch (inventoryError) {
                    console.warn('Error processing inventory deduction:', inventoryError);
                    // نستمر في عملية الاعتماد حتى لو فشل خصم المخزون
                    request.inventoryProcessed = false;
                    request.inventoryError = inventoryError.message;
                }
            }

            // التحقق إذا كانت هذه آخر خطوة
            const isLastStep = stepNumber >= request.totalSteps;

            if (isLastStep) {
                // الطلب مكتمل - تنفيذ العملية
                request.status = REQUEST_STATUS.APPROVED;
                request.currentStep = request.totalSteps;
                request.completedAt = new Date().toISOString();

                // تنفيذ التأثير المالي
                await this.executeFinancialImpact(request);

                // إرسال إشعار الاكتمال
                await this.sendNotification(
                    NOTIFICATION_TYPES.REQUEST_COMPLETED,
                    request,
                    { employee: request.submittedBy }
                );
            } else {
                // الانتقال للخطوة التالية
                request.currentStep = stepNumber + 1;
                request.approvalChain[stepNumber].status = 'pending';

                // إرسال إشعار للمعتمد التالي
                await this.sendNotification(
                    NOTIFICATION_TYPES.APPROVAL_REQUIRED,
                    request,
                    request.approvalChain[stepNumber]
                );
            }

            // حفظ التحديثات
            const updatedRequest = await this.saveRequest(request);

            // إطلاق حدث الموافقة
            this.emit('requestApproved', { request: updatedRequest, stepNumber, approver });

            return {
                success: true,
                request: updatedRequest,
                message: isLastStep ? 'تمت الموافقة النهائية على الطلب' : 'تمت الموافقة، الطلب انتقل للخطوة التالية'
            };
        } catch (error) {
            console.warn('Error approving request:', error);
            return {
                success: false,
                error: error.message,
                message: 'حدث خطأ أثناء الموافقة'
            };
        }
    }

    /**
     * رفض طلب
     * @param {String} requestId - معرف الطلب
     * @param {Object} rejector - بيانات الرافض
     * @param {String} reason - سبب الرفض
     */
    async rejectRequest(requestId, rejector, reason) {
        try {
            const request = await this.getRequest(requestId);
            if (!request) {
                throw new Error('الطلب غير موجود');
            }

            // تحديث حالة الطلب
            request.status = REQUEST_STATUS.REJECTED;
            request.rejectedBy = rejector;
            request.rejectedAt = new Date().toISOString();
            request.rejectionReason = reason;

            // تحديث الخطوة الحالية
            const currentStepIndex = request.currentStep - 1;
            request.approvalChain[currentStepIndex] = {
                ...request.approvalChain[currentStepIndex],
                status: 'rejected',
                approvedBy: rejector,
                approvedAt: new Date().toISOString(),
                notes: reason
            };

            // إضافة للسجل
            request.history.push({
                action: ACTION_TYPES.REJECT,
                performedBy: rejector,
                performedAt: new Date().toISOString(),
                stepNumber: request.currentStep,
                notes: reason
            });

            // حفظ التحديثات
            const updatedRequest = await this.saveRequest(request);

            // إرسال إشعار الرفض
            await this.sendNotification(
                NOTIFICATION_TYPES.REQUEST_REJECTED,
                updatedRequest,
                { employee: request.submittedBy }
            );

            // إطلاق حدث الرفض
            this.emit('requestRejected', { request: updatedRequest, rejector, reason });

            return {
                success: true,
                request: updatedRequest,
                message: 'تم رفض الطلب'
            };
        } catch (error) {
            console.warn('Error rejecting request:', error);
            return {
                success: false,
                error: error.message,
                message: 'حدث خطأ أثناء الرفض'
            };
        }
    }

    /**
     * تفويض الاعتماد لشخص آخر
     * @param {String} requestId - معرف الطلب
     * @param {Number} stepNumber - رقم الخطوة
     * @param {Object} delegator - المفوض
     * @param {Object} delegatee - المفوض إليه
     * @param {String} reason - السبب
     */
    async delegateApproval(requestId, stepNumber, delegator, delegatee, reason = '') {
        try {
            const request = await this.getRequest(requestId);
            if (!request) {
                throw new Error('الطلب غير موجود');
            }

            const stepIndex = stepNumber - 1;

            // تحديث الخطوة
            request.approvalChain[stepIndex] = {
                ...request.approvalChain[stepIndex],
                delegatedFrom: delegator,
                delegatedTo: delegatee,
                delegatedAt: new Date().toISOString(),
                delegationReason: reason
            };

            // إضافة للسجل
            request.history.push({
                action: ACTION_TYPES.DELEGATE,
                performedBy: delegator,
                performedAt: new Date().toISOString(),
                stepNumber,
                notes: `تم التفويض إلى ${delegatee.name}: ${reason}`
            });

            // حفظ التحديثات
            const updatedRequest = await this.saveRequest(request);

            // إرسال إشعار للمفوض إليه
            await this.sendNotification(
                NOTIFICATION_TYPES.DELEGATION_NOTICE,
                updatedRequest,
                { employee: delegatee }
            );

            this.emit('approvalDelegated', { request: updatedRequest, delegator, delegatee });

            return {
                success: true,
                request: updatedRequest,
                message: `تم تفويض الاعتماد إلى ${delegatee.name}`
            };
        } catch (error) {
            console.warn('Error delegating approval:', error);
            return {
                success: false,
                error: error.message,
                message: 'حدث خطأ أثناء التفويض'
            };
        }
    }

    /**
     * تصعيد الطلب
     * @param {String} requestId - معرف الطلب
     * @param {Object} escalator - المصعد
     * @param {String} reason - السبب
     */
    async escalateRequest(requestId, escalator, reason) {
        try {
            const request = await this.getRequest(requestId);
            if (!request) {
                throw new Error('الطلب غير موجود');
            }

            const currentStep = request.approvalChain[request.currentStep - 1];
            const escalateTo = currentStep.escalateTo;

            request.status = REQUEST_STATUS.ESCALATED;
            request.escalatedBy = escalator;
            request.escalatedAt = new Date().toISOString();
            request.escalationReason = reason;

            // إضافة للسجل
            request.history.push({
                action: ACTION_TYPES.ESCALATE,
                performedBy: escalator,
                performedAt: new Date().toISOString(),
                stepNumber: request.currentStep,
                notes: reason
            });

            // حفظ التحديثات
            const updatedRequest = await this.saveRequest(request);

            // إرسال إشعار التصعيد
            await this.sendNotification(
                NOTIFICATION_TYPES.ESCALATION_NOTICE,
                updatedRequest,
                { position: escalateTo }
            );

            this.emit('requestEscalated', { request: updatedRequest, escalator, reason });

            return {
                success: true,
                request: updatedRequest,
                message: 'تم تصعيد الطلب'
            };
        } catch (error) {
            console.warn('Error escalating request:', error);
            return {
                success: false,
                error: error.message,
                message: 'حدث خطأ أثناء التصعيد'
            };
        }
    }

    // ==================== التحقق والتأكيد ====================

    /**
     * التحقق من صحة الطلب
     * @param {Object} request - بيانات الطلب
     */
    validateRequest(request) {
        if (!request.items || request.items.length === 0) {
            throw new Error('يجب إضافة أصناف للطلب');
        }

        if (!request.departmentId) {
            throw new Error('يجب تحديد القسم');
        }

        // التحقق من الأصناف
        request.items.forEach((item, index) => {
            if (!item.id && !item.itemId) {
                throw new Error(`يجب تحديد الصنف في السطر ${index + 1}`);
            }
            if (!item.quantity || item.quantity <= 0) {
                throw new Error(`الكمية غير صحيحة في السطر ${index + 1}`);
            }
        });

        return true;
    }

    /**
     * التحقق من صلاحية المستخدم للاعتماد
     * @param {Object} request - الطلب
     * @param {Number} stepNumber - رقم الخطوة
     * @param {Object} user - المستخدم
     */
    async canUserApprove(request, stepNumber, user) {
        const step = request.approvalChain[stepNumber - 1];

        if (!step) {
            return { allowed: false, reason: 'الخطوة غير موجودة' };
        }

        if (step.status !== 'pending') {
            return { allowed: false, reason: 'هذه الخطوة ليست معلقة' };
        }

        if (stepNumber !== request.currentStep) {
            return { allowed: false, reason: 'ليست الخطوة الحالية' };
        }

        // التحقق من المنصب الوظيفي
        const approvers = await getEmployeesByPosition(step.position?.id, request.departmentId);
        const canApprove = approvers.some(emp => emp.id === user.id);

        // التحقق من التفويض
        const isDelegated = step.delegatedTo && step.delegatedTo.id === user.id;

        if (!canApprove && !isDelegated) {
            return { allowed: false, reason: 'ليس لديك صلاحية الاعتماد لهذه الخطوة' };
        }

        return { allowed: true };
    }

    // ==================== التكامل المالي ====================

    /**
     * حساب التأثير المالي للطلب
     * @param {Object} request - الطلب
     */
    async calculateFinancialImpact(request) {
        return this.financialCalculator.calculateExchangeImpact(request.items, {
            includeVat: true,
            departmentId: request.departmentId
        });
    }

    /**
     * التحقق من توفر الميزانية
     * @param {Object} financialImpact - التأثير المالي
     */
    async checkBudget(financialImpact) {
        const budgetChecks = [];

        for (const [budgetCode, data] of Object.entries(financialImpact.summary.byBudgetItem)) {
            const check = await checkBudgetAvailabilityAPI({
                budgetItemCode: budgetCode,
                amount: data.amount
            });
            budgetChecks.push({
                budgetCode,
                budgetName: data.name,
                ...check
            });
        }

        const allAvailable = budgetChecks.every(c => c.isAvailable);

        return {
            isAvailable: allAvailable,
            items: budgetChecks,
            totalRequired: financialImpact.summary.subtotal
        };
    }

    /**
     * تنفيذ التأثير المالي بعد الاعتماد النهائي
     * @param {Object} request - الطلب المعتمد
     */
    async executeFinancialImpact(request) {
        const { financialImpact } = request;

        if (!financialImpact || !financialImpact.journalEntry) {
            console.warn('No financial impact to execute');
            return null;
        }

        try {
            // إنشاء قيد اليومية
            const journalResult = await postJournalEntry({
                ...financialImpact.journalEntry,
                reference: request.id,
                description: `صرف مواد - طلب رقم ${request.id}`,
                sourceDocument: request.id,
                sourceType: 'exchange_request'
            });

            // تحديث الطلب بمعلومات القيد
            request.journalEntryId = journalResult.entryNumber;
            request.journalPostedAt = journalResult.postedAt;

            return journalResult;
        } catch (error) {
            console.warn('Error executing financial impact:', error);
            throw error;
        }
    }

    // ==================== التكامل مع المخزون ====================

    /**
     * خصم الرصيد من المخزون عند اعتماد مراقب المخزون
     * يتم تسجيل حركة صرف لكل صنف في الطلب
     * @param {Object} request - طلب الصرف
     * @param {Object} approver - المعتمد (مراقب المخزون)
     */
    async processInventoryDeduction(request, approver) {
        // استخدام خدمة المخزون لمعالجة الصرف
        const result = await inventoryService.processInventoryControllerApproval(request, approver);

        // تسجيل النتيجة في الطلب
        if (result.success) {
            // تحديث أرصدة الأصناف في الطلب
            request.items = request.items.map(item => {
                const processedItem = result.processedItems.find(p => p.itemId === item.itemId);
                if (processedItem) {
                    return {
                        ...item,
                        movementId: processedItem.movement?.id,
                        newBalance: processedItem.newBalance,
                        issuedAt: processedItem.movement?.date,
                    };
                }
                return item;
            });

            // إرسال إشعار بخصم المخزون
            this.emit('inventoryDeducted', {
                requestId: request.id,
                requestNumber: request.requestNumber,
                items: result.processedItems,
                approver,
            });
        }

        return result;
    }

    /**
     * إضافة للرصيد عند استلام مشتريات
     * @param {Object} receivingNote - مذكرة الاستلام
     * @param {Object} receiver - المستلم
     */
    async processReceivingNote(receivingNote, receiver) {
        const result = await inventoryService.processReceivingNote(receivingNote, receiver);

        if (result.success) {
            this.emit('inventoryReceived', {
                documentNumber: receivingNote.documentNumber,
                items: result.processedItems,
                receiver,
            });
        }

        return result;
    }

    /**
     * معالجة مرتجعات لإضافتها للمخزون
     * @param {Object} returnRequest - طلب المرتجع
     * @param {Object} processor - المعالج
     */
    async processReturn(returnRequest, processor) {
        const results = [];

        for (const item of returnRequest.items) {
            try {
                const movement = await inventoryService.recordMovement({
                    itemId: item.itemId,
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    warehouseId: returnRequest.warehouseId,
                    warehouseName: returnRequest.warehouseName,
                    movementType: item.isCustody
                        ? MOVEMENT_TYPES.RETURN_FROM_CUSTODY
                        : MOVEMENT_TYPES.RETURN_FROM_DEPT,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalValue: item.quantity * item.unitPrice,
                    documentNumber: returnRequest.documentNumber,
                    documentType: 'return_request',
                    departmentId: returnRequest.departmentId,
                    departmentName: returnRequest.departmentName,
                    employeeId: returnRequest.employeeId,
                    employeeName: returnRequest.employeeName,
                    notes: item.returnReason || `مرتجع بموجب طلب رقم ${returnRequest.documentNumber}`,
                    processedBy: processor,
                });

                results.push({
                    itemId: item.itemId,
                    itemName: item.itemName,
                    movement,
                    success: true,
                });
            } catch (error) {
                results.push({
                    itemId: item.itemId,
                    itemName: item.itemName,
                    error: error.message,
                    success: false,
                });
            }
        }

        const result = {
            success: results.every(r => r.success),
            documentNumber: returnRequest.documentNumber,
            processedItems: results.filter(r => r.success),
            errors: results.filter(r => !r.success),
        };

        if (result.success) {
            this.emit('inventoryReturned', {
                documentNumber: returnRequest.documentNumber,
                items: result.processedItems,
                processor,
            });
        }

        return result;
    }

    // ==================== الإشعارات ====================

    /**
     * إرسال إشعار
     * @param {String} type - نوع الإشعار
     * @param {Object} request - الطلب
     * @param {Object} recipient - المستلم
     */
    async sendNotification(type, request, recipient) {
        const notification = {
            id: `NOTIF-${Date.now()}`,
            type,
            requestId: request.id,
            recipientId: recipient.employee?.id || recipient.id,
            recipientName: recipient.employee?.name || recipient.name,
            title: this.getNotificationTitle(type),
            message: this.getNotificationMessage(type, request),
            priority: this.getNotificationPriority(type),
            createdAt: new Date().toISOString(),
            read: false,
            actionRequired: type === NOTIFICATION_TYPES.APPROVAL_REQUIRED
        };

        // إرسال عبر API إذا متاح
        if (api?.notifications?.create) {
            try {
                await api.notifications.create(notification);
            } catch (error) {
                console.warn('Failed to send notification via API:', error);
            }
        }

        // إرسال عبر WebSocket إذا متاح
        if (typeof window !== 'undefined' && window.notificationSocket) {
            window.notificationSocket.send(JSON.stringify({
                type: 'notification',
                data: notification
            }));
        }

        // حفظ محلياً
        this.storeNotification(notification);

        return notification;
    }

    /**
     * الحصول على عنوان الإشعار
     */
    getNotificationTitle(type) {
        const titles = {
            [NOTIFICATION_TYPES.NEW_REQUEST]: 'طلب جديد',
            [NOTIFICATION_TYPES.APPROVAL_REQUIRED]: 'مطلوب اعتمادك',
            [NOTIFICATION_TYPES.REQUEST_APPROVED]: 'تمت الموافقة',
            [NOTIFICATION_TYPES.REQUEST_REJECTED]: 'تم الرفض',
            [NOTIFICATION_TYPES.REQUEST_RETURNED]: 'تم الإرجاع',
            [NOTIFICATION_TYPES.REQUEST_COMPLETED]: 'اكتمل الطلب',
            [NOTIFICATION_TYPES.DEADLINE_WARNING]: 'تحذير الموعد النهائي',
            [NOTIFICATION_TYPES.ESCALATION_NOTICE]: 'تم تصعيد الطلب',
            [NOTIFICATION_TYPES.DELEGATION_NOTICE]: 'تم تفويض اعتماد',
        };
        return titles[type] || 'إشعار';
    }

    /**
     * الحصول على نص الإشعار
     */
    getNotificationMessage(type, request) {
        const messages = {
            [NOTIFICATION_TYPES.APPROVAL_REQUIRED]: `طلب صرف رقم ${request.id} بانتظار اعتمادك`,
            [NOTIFICATION_TYPES.REQUEST_APPROVED]: `تمت الموافقة على طلب الصرف رقم ${request.id}`,
            [NOTIFICATION_TYPES.REQUEST_REJECTED]: `تم رفض طلب الصرف رقم ${request.id}`,
            [NOTIFICATION_TYPES.REQUEST_COMPLETED]: `اكتمل طلب الصرف رقم ${request.id} وتم الصرف`,
            [NOTIFICATION_TYPES.ESCALATION_NOTICE]: `تم تصعيد طلب الصرف رقم ${request.id}`,
            [NOTIFICATION_TYPES.DELEGATION_NOTICE]: `تم تفويضك لاعتماد طلب الصرف رقم ${request.id}`,
        };
        return messages[type] || `إشعار بخصوص الطلب ${request.id}`;
    }

    /**
     * الحصول على أولوية الإشعار
     */
    getNotificationPriority(type) {
        if ([NOTIFICATION_TYPES.APPROVAL_REQUIRED, NOTIFICATION_TYPES.DEADLINE_WARNING].includes(type)) {
            return 'high';
        }
        if ([NOTIFICATION_TYPES.REQUEST_REJECTED, NOTIFICATION_TYPES.ESCALATION_NOTICE].includes(type)) {
            return 'medium';
        }
        return 'normal';
    }

    /**
     * حفظ الإشعار محلياً
     */
    storeNotification(notification) {
        if (typeof window !== 'undefined') {
            const stored = JSON.parse(localStorage.getItem('approvalNotifications') || '[]');
            stored.unshift(notification);
            // الاحتفاظ بآخر 100 إشعار
            localStorage.setItem('approvalNotifications', JSON.stringify(stored.slice(0, 100)));
        }
    }

    // ==================== تخزين واسترجاع الطلبات ====================

    /**
     * حفظ الطلب
     * @param {Object} request - الطلب
     */
    async saveRequest(request) {
        // محاولة الحفظ عبر API
        if (api?.warehouse?.exchangeRequest) {
            try {
                if (request.id && !request.id.startsWith('REQ-')) {
                    // تحديث طلب موجود
                    const response = await api.warehouse.exchangeRequest.update(request.id, request);
                    if (response && !response.error) {
                        return response;
                    }
                } else {
                    // إنشاء طلب جديد
                    const response = await api.warehouse.exchangeRequest.create(request);
                    if (response && !response.error) {
                        return response;
                    }
                }
            } catch (error) {
                console.warn('Failed to save request via API:', error);
            }
        }

        // حفظ محلي للتطوير
        if (typeof window !== 'undefined') {
            const stored = JSON.parse(localStorage.getItem('exchangeRequests') || '[]');
            const index = stored.findIndex(r => r.id === request.id);
            if (index !== -1) {
                stored[index] = request;
            } else {
                stored.push(request);
            }
            localStorage.setItem('exchangeRequests', JSON.stringify(stored));
        }

        return request;
    }

    /**
     * جلب طلب بالمعرف
     * @param {String} requestId - معرف الطلب
     */
    async getRequest(requestId) {
        // محاولة الجلب من API
        if (api?.warehouse?.exchangeRequest?.getById) {
            try {
                const response = await api.warehouse.exchangeRequest.getById(requestId);
                if (response && !response.error) {
                    return response;
                }
            } catch (error) {
                console.warn('Failed to fetch request from API:', error);
            }
        }

        // جلب من التخزين المحلي
        if (typeof window !== 'undefined') {
            const stored = JSON.parse(localStorage.getItem('exchangeRequests') || '[]');
            return stored.find(r => r.id === requestId);
        }

        return null;
    }

    /**
     * جلب الطلبات المعلقة للمستخدم
     * @param {Object} user - المستخدم
     */
    async getPendingRequestsForUser(user) {
        // محاولة الجلب من API
        if (api?.warehouse?.approvalChain?.getMyPendingApprovals) {
            try {
                const response = await api.warehouse.approvalChain.getMyPendingApprovals();
                if (response && !response.error) {
                    return response;
                }
            } catch (error) {
                console.warn('Failed to fetch pending requests from API:', error);
            }
        }

        // جلب من التخزين المحلي وتصفية
        if (typeof window !== 'undefined') {
            const stored = JSON.parse(localStorage.getItem('exchangeRequests') || '[]');
            return stored.filter(request => {
                if (request.status !== REQUEST_STATUS.PENDING) return false;

                const currentStep = request.approvalChain?.[request.currentStep - 1];
                if (!currentStep) return false;

                // التحقق من صلاحية المستخدم
                const positions = currentStep.position?.roles || [];
                return positions.some(role =>
                    user.roles?.includes(role) ||
                    currentStep.delegatedTo?.id === user.id
                );
            });
        }

        return [];
    }

    // ==================== نظام الأحداث ====================

    /**
     * الاستماع لحدث
     * @param {String} event - اسم الحدث
     * @param {Function} callback - دالة الاستدعاء
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return () => this.off(event, callback);
    }

    /**
     * إلغاء الاستماع لحدث
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * إطلاق حدث
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.warn(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
}

// ==================== مثيل واحد من الخدمة ====================
export const approvalWorkflowService = new ApprovalWorkflowService();

// ==================== دوال مساعدة ====================

/**
 * الحصول على لون حالة الطلب
 */
export function getStatusColor(status) {
    const colors = {
        [REQUEST_STATUS.DRAFT]: 'gray',
        [REQUEST_STATUS.PENDING]: 'yellow',
        [REQUEST_STATUS.IN_REVIEW]: 'blue',
        [REQUEST_STATUS.APPROVED]: 'green',
        [REQUEST_STATUS.REJECTED]: 'red',
        [REQUEST_STATUS.CANCELLED]: 'gray',
        [REQUEST_STATUS.COMPLETED]: 'green',
        [REQUEST_STATUS.ESCALATED]: 'orange',
    };
    return colors[status] || 'gray';
}

/**
 * الحصول على نص حالة الطلب
 */
export function getStatusText(status) {
    const texts = {
        [REQUEST_STATUS.DRAFT]: 'مسودة',
        [REQUEST_STATUS.PENDING]: 'في انتظار الاعتماد',
        [REQUEST_STATUS.IN_REVIEW]: 'قيد المراجعة',
        [REQUEST_STATUS.APPROVED]: 'معتمد',
        [REQUEST_STATUS.REJECTED]: 'مرفوض',
        [REQUEST_STATUS.CANCELLED]: 'ملغي',
        [REQUEST_STATUS.COMPLETED]: 'مكتمل',
        [REQUEST_STATUS.ESCALATED]: 'تم التصعيد',
    };
    return texts[status] || status;
}

/**
 * حساب نسبة تقدم الطلب
 */
export function getRequestProgress(request) {
    if (!request.approvalChain) return 0;

    const approved = request.approvalChain.filter(s => s.status === 'approved').length;
    return Math.round((approved / request.totalSteps) * 100);
}

export default approvalWorkflowService;
