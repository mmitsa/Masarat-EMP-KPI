/**
 * خدمة الاستلام المؤقت للفحص
 * Temporary Receive for Inspection Service
 *
 * سير العمل:
 * 1. استلام مؤقت للفحص ← 2. ترحيل ← 3. اعتماد/رفض ← 4. مذكرة استلام
 *
 * هذه الخدمة تتعامل مع:
 * - إنشاء الاستلام المؤقت
 * - ترحيل الاستلام للاعتماد
 * - اعتماد أو رفض الاستلام
 * - إنشاء مذكرة الاستلام النهائية
 * - الإشعارات لجميع الأطراف
 * - التكامل مع نظام الصلاحيات والمستودعات
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';

// ==================== حالات الاستلام المؤقت ====================
export const TEMP_RECEIVE_STATUS = {
    FOLLOW_UP: 'follow_up',                          // قيد المتابعة (قيد الفحص)
    TRANSFERRED: 'transferred',                       // مرحل (بانتظار الاعتماد)
    APPROVED: 'approved',                             // معتمد
    REJECTED: 'rejected',                             // مرفوض
    RETURNED_FOR_CORRECTION: 'returned_for_correction', // مرجع للتصحيح
    CANCELLED: 'cancelled',                           // ملغي
};

export const TEMP_RECEIVE_STATUS_NAMES = {
    [TEMP_RECEIVE_STATUS.FOLLOW_UP]: 'قيد المتابعة',
    [TEMP_RECEIVE_STATUS.TRANSFERRED]: 'مرحل',
    [TEMP_RECEIVE_STATUS.APPROVED]: 'معتمد',
    [TEMP_RECEIVE_STATUS.REJECTED]: 'مرفوض',
    [TEMP_RECEIVE_STATUS.RETURNED_FOR_CORRECTION]: 'مرجع للتصحيح',
    [TEMP_RECEIVE_STATUS.CANCELLED]: 'ملغي',
};

export const TEMP_RECEIVE_STATUS_COLORS = {
    [TEMP_RECEIVE_STATUS.FOLLOW_UP]: 'warning',
    [TEMP_RECEIVE_STATUS.TRANSFERRED]: 'info',
    [TEMP_RECEIVE_STATUS.APPROVED]: 'success',
    [TEMP_RECEIVE_STATUS.REJECTED]: 'danger',
    [TEMP_RECEIVE_STATUS.RETURNED_FOR_CORRECTION]: 'warning',
    [TEMP_RECEIVE_STATUS.CANCELLED]: 'secondary',
};

// ==================== حالات مذكرة الاستلام ====================
export const RECEIPT_NOTE_STATUS = {
    FOLLOW_UP: 'follow_up',         // قيد المتابعة
    APPROVED: 'approved',            // معتمد
    CANCELLED: 'cancelled',          // ملغي
};

export const RECEIPT_NOTE_STATUS_NAMES = {
    [RECEIPT_NOTE_STATUS.FOLLOW_UP]: 'قيد المتابعة',
    [RECEIPT_NOTE_STATUS.APPROVED]: 'معتمد',
    [RECEIPT_NOTE_STATUS.CANCELLED]: 'ملغي',
};

// ==================== أنواع مستندات المرجعية ====================
export const REFERENCE_DOCUMENT_TYPES = {
    AUTHORIZATION: 'authorization',  // تعميد
    MINUTES: 'minutes',              // محضر استلام
};

export const REFERENCE_DOCUMENT_TYPE_NAMES = {
    [REFERENCE_DOCUMENT_TYPES.AUTHORIZATION]: 'تعميد',
    [REFERENCE_DOCUMENT_TYPES.MINUTES]: 'محضر',
};

// ==================== الأدوار الإلزامية ====================
export const TEMP_RECEIVE_ROLES = {
    DELIVERER: {
        id: 'deliverer',
        name: 'المسلّم',
        nameEn: 'Deliverer',
        description: 'الشخص الذي يقوم بتسليم البضاعة',
        required: true,
    },
    YARD_OFFICER: {
        id: 'yard_officer',
        name: 'مأمور ساحة الاستلام',
        nameEn: 'Receiving Yard Officer',
        description: 'المسؤول عن استلام البضائع في الساحة',
        required: true,
    },
    WAREHOUSE_KEEPER: {
        id: 'warehouse_keeper',
        name: 'أمين المستودع',
        nameEn: 'Warehouse Keeper',
        description: 'أمين المستودع المسؤول عن التخزين',
        required: true,
    },
    WAREHOUSE_MANAGER: {
        id: 'warehouse_manager',
        name: 'مدير إدارة المستودعات',
        nameEn: 'Warehouse Manager',
        description: 'مدير إدارة المستودعات المسؤول عن الاعتماد',
        required: true,
    },
    INVENTORY_CONTROLLER: {
        id: 'inventory_controller',
        name: 'مراقب المخزون',
        nameEn: 'Inventory Controller',
        description: 'مراقب المخزون للتأكد من مطابقة الأصناف',
        required: true,
    },
};

// ==================== أنواع الإشعارات ====================
export const TEMP_RECEIVE_NOTIFICATION_TYPES = {
    NEW_TEMP_RECEIVE: 'new_temp_receive',                // استلام مؤقت جديد
    TEMP_RECEIVE_TRANSFERRED: 'temp_receive_transferred', // تم الترحيل
    TEMP_RECEIVE_APPROVED: 'temp_receive_approved',       // تم اعتماد الاستلام المؤقت
    TEMP_RECEIVE_REJECTED: 'temp_receive_rejected',       // تم الرفض
    TEMP_RECEIVE_RETURNED: 'temp_receive_returned',       // مرجع للتصحيح
    TEMP_RECEIVE_RESUBMITTED: 'temp_receive_resubmitted', // تم إعادة الإرسال بعد التصحيح
    TEMP_RECEIVE_CANCELLED: 'temp_receive_cancelled',     // تم الإلغاء
    RECEIPT_NOTE_CREATED: 'receipt_note_created',         // تم إنشاء مذكرة الاستلام
    RECEIPT_NOTE_APPROVED: 'receipt_note_approved',       // تم اعتماد مذكرة الاستلام
    RECEIPT_NOTE_CANCELLED: 'receipt_note_cancelled',     // تم إلغاء مذكرة الاستلام
    STOCK_ADDED: 'stock_added',                           // تم إضافة للمخزون
    APPROVAL_REQUIRED: 'approval_required',               // مطلوب الاعتماد
    INSPECTION_REQUIRED: 'inspection_required',           // مطلوب الفحص
};

// ==================== API Endpoints ====================
const API_ENDPOINTS = {
    TEMP_RECEIVES: '/api/warehouse/temp-receives',
    TEMP_RECEIVE_BY_ID: (id) => `/api/warehouse/temp-receives/${id}`,
    TEMP_RECEIVE_TRANSFER: (id) => `/api/warehouse/temp-receives/${id}/transfer`,
    TEMP_RECEIVE_APPROVE: (id) => `/api/warehouse/temp-receives/${id}/approve`,
    TEMP_RECEIVE_REJECT: (id) => `/api/warehouse/temp-receives/${id}/reject`,
    TEMP_RECEIVE_RETURN: (id) => `/api/warehouse/temp-receives/${id}/return-for-correction`,
    TEMP_RECEIVE_RESUBMIT: (id) => `/api/warehouse/temp-receives/${id}/resubmit`,
    TEMP_RECEIVE_CANCEL: (id) => `/api/warehouse/temp-receives/${id}/cancel`,
    RECEIPT_NOTES: '/api/warehouse/receipt-notes',
    RECEIPT_NOTE_BY_ID: (id) => `/api/warehouse/receipt-notes/${id}`,
    RECEIPT_NOTE_APPROVE: (id) => `/api/warehouse/receipt-notes/${id}/approve`,
    NOTIFICATIONS: '/api/notifications',
    NOTIFICATIONS_SEND: '/api/notifications/send',
};

// ==================== Local Storage Keys ====================
const STORAGE_KEYS = {
    TEMP_RECEIVES: 'masarat_temp_receives',
    RECEIPT_NOTES: 'masarat_receipt_notes',
    NOTIFICATIONS: 'masarat_temp_receive_notifications',
};

// ==================== خدمة الاستلام المؤقت ====================
class TempReceiveService {
    constructor() {
        this.listeners = new Map();
        this.useLocalStorage = process.env.NODE_ENV === 'development';
    }

    // ==================== نظام الأحداث ====================
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return () => {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

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

    // ==================== إدارة الاستلام المؤقت ====================

    /**
     * إنشاء استلام مؤقت جديد للفحص
     * @param {Object} data - بيانات الاستلام المؤقت
     * @returns {Promise<Object>} - نتيجة العملية
     */
    async createTempReceive(data) {
        try {
            // التحقق من صحة البيانات
            const validation = this.validateTempReceiveData(data);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: 'validation_error',
                    message: 'بيانات الاستلام المؤقت غير مكتملة',
                    validationErrors: validation.errors,
                };
            }

            // إنشاء كائن الاستلام المؤقت
            const tempReceive = {
                id: this.generateId('TR'),
                documentNumber: this.generateDocumentNumber('TR'),
                ...data,
                status: TEMP_RECEIVE_STATUS.FOLLOW_UP,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                history: [{
                    action: 'created',
                    performedBy: data.createdBy,
                    performedAt: new Date().toISOString(),
                    notes: 'تم إنشاء الاستلام المؤقت للفحص',
                }],
            };

            // حفظ في قاعدة البيانات
            const savedTempReceive = await this.saveTempReceive(tempReceive);

            // إرسال الإشعارات
            await this.sendNotification(
                TEMP_RECEIVE_NOTIFICATION_TYPES.NEW_TEMP_RECEIVE,
                savedTempReceive,
                [TEMP_RECEIVE_ROLES.YARD_OFFICER.id, TEMP_RECEIVE_ROLES.WAREHOUSE_KEEPER.id]
            );

            // إطلاق حدث الإنشاء
            this.emit('tempReceiveCreated', savedTempReceive);

            return {
                success: true,
                tempReceive: savedTempReceive,
                message: 'تم إنشاء الاستلام المؤقت بنجاح',
            };
        } catch (error) {
            console.warn('Error creating temp receive:', error);
            return {
                success: false,
                error: error.message,
                message: 'حدث خطأ أثناء إنشاء الاستلام المؤقت',
            };
        }
    }

    /**
     * تحديث استلام مؤقت
     * @param {String} id - معرف الاستلام المؤقت
     * @param {Object} updates - التحديثات
     * @param {Object} updatedBy - المحدث
     * @returns {Promise<Object>}
     */
    async updateTempReceive(id, updates, updatedBy) {
        try {
            const tempReceive = await this.getTempReceive(id);
            if (!tempReceive) {
                return {
                    success: false,
                    error: 'not_found',
                    message: 'الاستلام المؤقت غير موجود',
                };
            }

            // التحقق من أن الحالة تسمح بالتعديل
            if (tempReceive.status !== TEMP_RECEIVE_STATUS.FOLLOW_UP &&
                tempReceive.status !== TEMP_RECEIVE_STATUS.RETURNED_FOR_CORRECTION) {
                return {
                    success: false,
                    error: 'invalid_status',
                    message: 'لا يمكن تعديل الاستلام المؤقت في هذه الحالة',
                };
            }

            const updatedTempReceive = {
                ...tempReceive,
                ...updates,
                updatedAt: new Date().toISOString(),
                history: [
                    ...tempReceive.history,
                    {
                        action: 'updated',
                        performedBy: updatedBy,
                        performedAt: new Date().toISOString(),
                        notes: 'تم تحديث بيانات الاستلام المؤقت',
                        changes: updates,
                    },
                ],
            };

            const saved = await this.saveTempReceive(updatedTempReceive);
            this.emit('tempReceiveUpdated', saved);

            return {
                success: true,
                tempReceive: saved,
                message: 'تم تحديث الاستلام المؤقت بنجاح',
            };
        } catch (error) {
            console.warn('Error updating temp receive:', error);
            return {
                success: false,
                error: error.message,
                message: 'حدث خطأ أثناء تحديث الاستلام المؤقت',
            };
        }
    }

    /**
     * ترحيل الاستلام المؤقت للاعتماد
     * @param {String} id - معرف الاستلام المؤقت
     * @param {Object} transferredBy - المرحل
     * @param {String} notes - ملاحظات الترحيل
     * @returns {Promise<Object>}
     */
    async transferTempReceive(id, transferredBy, notes = '') {
        try {
            const tempReceive = await this.getTempReceive(id);
            if (!tempReceive) {
                return {
                    success: false,
                    error: 'not_found',
                    message: 'الاستلام المؤقت غير موجود',
                };
            }

            // التحقق من أن الحالة تسمح بالترحيل
            if (tempReceive.status !== TEMP_RECEIVE_STATUS.FOLLOW_UP) {
                return {
                    success: false,
                    error: 'invalid_status',
                    message: 'لا يمكن ترحيل الاستلام المؤقت في هذه الحالة',
                };
            }

            // التحقق من اكتمال بيانات الفحص
            const inspectionValidation = this.validateInspectionData(tempReceive);
            if (!inspectionValidation.isValid) {
                return {
                    success: false,
                    error: 'inspection_incomplete',
                    message: 'بيانات الفحص غير مكتملة',
                    validationErrors: inspectionValidation.errors,
                };
            }

            const updatedTempReceive = {
                ...tempReceive,
                status: TEMP_RECEIVE_STATUS.TRANSFERRED,
                transferredAt: new Date().toISOString(),
                transferredBy: transferredBy,
                transferNotes: notes,
                updatedAt: new Date().toISOString(),
                history: [
                    ...tempReceive.history,
                    {
                        action: 'transferred',
                        performedBy: transferredBy,
                        performedAt: new Date().toISOString(),
                        notes: notes || 'تم ترحيل الاستلام المؤقت للاعتماد',
                    },
                ],
            };

            const saved = await this.saveTempReceive(updatedTempReceive);

            // إرسال إشعار للمدير للاعتماد
            await this.sendNotification(
                TEMP_RECEIVE_NOTIFICATION_TYPES.TEMP_RECEIVE_TRANSFERRED,
                saved,
                [TEMP_RECEIVE_ROLES.WAREHOUSE_MANAGER.id, TEMP_RECEIVE_ROLES.INVENTORY_CONTROLLER.id]
            );

            this.emit('tempReceiveTransferred', saved);

            return {
                success: true,
                tempReceive: saved,
                message: 'تم ترحيل الاستلام المؤقت للاعتماد بنجاح',
            };
        } catch (error) {
            console.warn('Error transferring temp receive:', error);
            return {
                success: false,
                error: error.message,
                message: 'حدث خطأ أثناء ترحيل الاستلام المؤقت',
            };
        }
    }

    /**
     * اعتماد الاستلام المؤقت
     * @param {String} id - معرف الاستلام المؤقت
     * @param {Object} approvedBy - المعتمد
     * @param {String} notes - ملاحظات الاعتماد
     * @returns {Promise<Object>}
     */
    async approveTempReceive(id, approvedBy, notes = '') {
        try {
            const tempReceive = await this.getTempReceive(id);
            if (!tempReceive) {
                return {
                    success: false,
                    error: 'not_found',
                    message: 'الاستلام المؤقت غير موجود',
                };
            }

            // التحقق من أن الحالة تسمح بالاعتماد
            if (tempReceive.status !== TEMP_RECEIVE_STATUS.TRANSFERRED) {
                return {
                    success: false,
                    error: 'invalid_status',
                    message: 'لا يمكن اعتماد الاستلام المؤقت في هذه الحالة',
                };
            }

            const updatedTempReceive = {
                ...tempReceive,
                status: TEMP_RECEIVE_STATUS.APPROVED,
                approvedAt: new Date().toISOString(),
                approvedBy: approvedBy,
                approvalNotes: notes,
                updatedAt: new Date().toISOString(),
                history: [
                    ...tempReceive.history,
                    {
                        action: 'approved',
                        performedBy: approvedBy,
                        performedAt: new Date().toISOString(),
                        notes: notes || 'تم اعتماد الاستلام المؤقت',
                    },
                ],
            };

            const saved = await this.saveTempReceive(updatedTempReceive);

            // إنشاء مذكرة الاستلام تلقائياً
            const receiptNoteResult = await this.createReceiptNoteFromTempReceive(saved);

            // إرسال إشعار بالاعتماد
            await this.sendNotification(
                TEMP_RECEIVE_NOTIFICATION_TYPES.TEMP_RECEIVE_APPROVED,
                saved,
                [TEMP_RECEIVE_ROLES.WAREHOUSE_KEEPER.id, TEMP_RECEIVE_ROLES.YARD_OFFICER.id]
            );

            this.emit('tempReceiveApproved', { tempReceive: saved, receiptNote: receiptNoteResult.receiptNote });

            return {
                success: true,
                tempReceive: saved,
                receiptNote: receiptNoteResult.receiptNote,
                message: 'تم اعتماد الاستلام المؤقت وإنشاء مذكرة الاستلام بنجاح',
            };
        } catch (error) {
            console.warn('Error approving temp receive:', error);
            return {
                success: false,
                error: error.message,
                message: 'حدث خطأ أثناء اعتماد الاستلام المؤقت',
            };
        }
    }

    /**
     * رفض الاستلام المؤقت وإرجاعه لمأمور ساحة الاستلام للتصحيح
     * @param {String} id - معرف الاستلام المؤقت
     * @param {Object} rejectedBy - الرافض (يجب أن يحتوي على id, name, role)
     * @param {String} reason - سبب الرفض (إجباري)
     * @param {String} detailedNotes - ملاحظات تفصيلية للتصحيح
     * @returns {Promise<Object>}
     */
    async rejectTempReceive(id, rejectedBy, reason, detailedNotes = '') {
        try {
            if (!reason || reason.trim() === '') {
                return {
                    success: false,
                    error: 'reason_required',
                    message: 'يجب تحديد سبب الرفض',
                };
            }

            const tempReceive = await this.getTempReceive(id);
            if (!tempReceive) {
                return {
                    success: false,
                    error: 'not_found',
                    message: 'الاستلام المؤقت غير موجود',
                };
            }

            // التحقق من أن الحالة تسمح بالرفض
            if (tempReceive.status !== TEMP_RECEIVE_STATUS.TRANSFERRED) {
                return {
                    success: false,
                    error: 'invalid_status',
                    message: 'لا يمكن رفض الاستلام المؤقت في هذه الحالة',
                };
            }

            const updatedTempReceive = {
                ...tempReceive,
                status: TEMP_RECEIVE_STATUS.RETURNED_FOR_CORRECTION,
                rejectedAt: new Date().toISOString(),
                rejectedBy: rejectedBy,
                rejectedByRole: rejectedBy.role || 'unknown',
                rejectionReason: reason,
                rejectionDetailedNotes: detailedNotes,
                correctionRequired: true,
                updatedAt: new Date().toISOString(),
                history: [
                    ...tempReceive.history,
                    {
                        action: 'returned_for_correction',
                        performedBy: rejectedBy,
                        performedAt: new Date().toISOString(),
                        notes: `تم إرجاع المستند للتصحيح - السبب: ${reason}${detailedNotes ? ` | التفاصيل: ${detailedNotes}` : ''}`,
                        rejectedByRole: rejectedBy.role,
                    },
                ],
            };

            const saved = await this.saveTempReceive(updatedTempReceive);

            // إرسال إشعار لمأمور ساحة الاستلام للتصحيح
            await this.sendNotification(
                TEMP_RECEIVE_NOTIFICATION_TYPES.TEMP_RECEIVE_RETURNED,
                {
                    ...saved,
                    notificationTitle: 'مطلوب تصحيح - مستند استلام مؤقت',
                    notificationBody: `تم إرجاع المستند رقم ${saved.documentNumber} من ${rejectedBy.name} (${this.getRoleName(rejectedBy.role)}) للتصحيح. السبب: ${reason}`,
                },
                [TEMP_RECEIVE_ROLES.YARD_OFFICER.id]
            );

            this.emit('tempReceiveReturnedForCorrection', saved);

            return {
                success: true,
                tempReceive: saved,
                message: 'تم إرجاع المستند لمأمور ساحة الاستلام للتصحيح',
            };
        } catch (error) {
            console.warn('Error rejecting temp receive:', error);
            return {
                success: false,
                error: error.message,
                message: 'حدث خطأ أثناء رفض الاستلام المؤقت',
            };
        }
    }

    /**
     * إعادة إرسال الاستلام المؤقت بعد التصحيح
     * يعود المستند للرافض الأصلي مباشرة (وليس من البداية)
     * @param {String} id - معرف الاستلام المؤقت
     * @param {Object} resubmittedBy - مأمور ساحة الاستلام
     * @param {String} correctionNotes - ملاحظات التصحيح
     * @returns {Promise<Object>}
     */
    async resubmitTempReceive(id, resubmittedBy, correctionNotes = '') {
        try {
            const tempReceive = await this.getTempReceive(id);
            if (!tempReceive) {
                return {
                    success: false,
                    error: 'not_found',
                    message: 'الاستلام المؤقت غير موجود',
                };
            }

            // التحقق من أن الحالة تسمح بإعادة الإرسال
            if (tempReceive.status !== TEMP_RECEIVE_STATUS.RETURNED_FOR_CORRECTION) {
                return {
                    success: false,
                    error: 'invalid_status',
                    message: 'لا يمكن إعادة إرسال الاستلام المؤقت - لم يتم إرجاعه للتصحيح',
                };
            }

            const previousRejectedBy = tempReceive.rejectedBy;
            const previousRejectedByRole = tempReceive.rejectedByRole;

            const updatedTempReceive = {
                ...tempReceive,
                status: TEMP_RECEIVE_STATUS.TRANSFERRED,
                correctionRequired: false,
                correctionNotes: correctionNotes,
                resubmittedAt: new Date().toISOString(),
                resubmittedBy: resubmittedBy,
                resubmittedToRole: previousRejectedByRole,
                resubmittedTo: previousRejectedBy,
                updatedAt: new Date().toISOString(),
                history: [
                    ...tempReceive.history,
                    {
                        action: 'resubmitted',
                        performedBy: resubmittedBy,
                        performedAt: new Date().toISOString(),
                        notes: `تم إعادة الإرسال بعد التصحيح إلى ${this.getRoleName(previousRejectedByRole)}${correctionNotes ? ` | التصحيح: ${correctionNotes}` : ''}`,
                        resubmittedToRole: previousRejectedByRole,
                    },
                ],
            };

            const saved = await this.saveTempReceive(updatedTempReceive);

            // إرسال إشعار للرافض الأصلي فقط
            const notifyRoles = previousRejectedByRole ? [previousRejectedByRole] :
                [TEMP_RECEIVE_ROLES.WAREHOUSE_MANAGER.id, TEMP_RECEIVE_ROLES.INVENTORY_CONTROLLER.id];

            await this.sendNotification(
                TEMP_RECEIVE_NOTIFICATION_TYPES.TEMP_RECEIVE_RESUBMITTED,
                {
                    ...saved,
                    notificationTitle: 'إعادة إرسال بعد التصحيح - مستند استلام مؤقت',
                    notificationBody: `تم إعادة إرسال المستند رقم ${saved.documentNumber} بعد التصحيح من ${resubmittedBy.name}. يرجى مراجعة التصحيح والاعتماد.`,
                },
                notifyRoles
            );

            this.emit('tempReceiveResubmitted', saved);

            return {
                success: true,
                tempReceive: saved,
                message: `تم إعادة إرسال المستند بعد التصحيح إلى ${this.getRoleName(previousRejectedByRole)}`,
            };
        } catch (error) {
            console.warn('Error resubmitting temp receive:', error);
            return {
                success: false,
                error: error.message,
                message: 'حدث خطأ أثناء إعادة إرسال الاستلام المؤقت',
            };
        }
    }

    /**
     * الحصول على اسم الدور بالعربي
     * @param {String} roleId - معرف الدور
     * @returns {String}
     */
    getRoleName(roleId) {
        const roleMap = {
            [TEMP_RECEIVE_ROLES.WAREHOUSE_MANAGER.id]: TEMP_RECEIVE_ROLES.WAREHOUSE_MANAGER.name,
            [TEMP_RECEIVE_ROLES.WAREHOUSE_KEEPER.id]: TEMP_RECEIVE_ROLES.WAREHOUSE_KEEPER.name,
            [TEMP_RECEIVE_ROLES.INVENTORY_CONTROLLER.id]: TEMP_RECEIVE_ROLES.INVENTORY_CONTROLLER.name,
            [TEMP_RECEIVE_ROLES.YARD_OFFICER.id]: TEMP_RECEIVE_ROLES.YARD_OFFICER.name,
            [TEMP_RECEIVE_ROLES.DELIVERER.id]: TEMP_RECEIVE_ROLES.DELIVERER.name,
        };
        return roleMap[roleId] || roleId;
    }

    /**
     * إلغاء الاستلام المؤقت
     * @param {String} id - معرف الاستلام المؤقت
     * @param {Object} cancelledBy - الملغي
     * @param {String} reason - سبب الإلغاء
     * @returns {Promise<Object>}
     */
    async cancelTempReceive(id, cancelledBy, reason) {
        try {
            const tempReceive = await this.getTempReceive(id);
            if (!tempReceive) {
                return {
                    success: false,
                    error: 'not_found',
                    message: 'الاستلام المؤقت غير موجود',
                };
            }

            // التحقق من أن الحالة تسمح بالإلغاء (لا يمكن إلغاء المعتمد أو الملغي)
            if (tempReceive.status === TEMP_RECEIVE_STATUS.APPROVED ||
                tempReceive.status === TEMP_RECEIVE_STATUS.CANCELLED) {
                return {
                    success: false,
                    error: 'invalid_status',
                    message: 'لا يمكن إلغاء الاستلام المؤقت في هذه الحالة',
                };
            }

            const updatedTempReceive = {
                ...tempReceive,
                status: TEMP_RECEIVE_STATUS.CANCELLED,
                cancelledAt: new Date().toISOString(),
                cancelledBy: cancelledBy,
                cancellationReason: reason,
                updatedAt: new Date().toISOString(),
                history: [
                    ...tempReceive.history,
                    {
                        action: 'cancelled',
                        performedBy: cancelledBy,
                        performedAt: new Date().toISOString(),
                        notes: `تم إلغاء الاستلام المؤقت: ${reason || 'بدون سبب'}`,
                    },
                ],
            };

            const saved = await this.saveTempReceive(updatedTempReceive);

            // إرسال إشعار بالإلغاء
            await this.sendNotification(
                TEMP_RECEIVE_NOTIFICATION_TYPES.TEMP_RECEIVE_CANCELLED,
                saved,
                [
                    TEMP_RECEIVE_ROLES.YARD_OFFICER.id,
                    TEMP_RECEIVE_ROLES.WAREHOUSE_KEEPER.id,
                    TEMP_RECEIVE_ROLES.WAREHOUSE_MANAGER.id,
                    TEMP_RECEIVE_ROLES.INVENTORY_CONTROLLER.id
                ]
            );

            this.emit('tempReceiveCancelled', saved);

            return {
                success: true,
                tempReceive: saved,
                message: 'تم إلغاء الاستلام المؤقت',
            };
        } catch (error) {
            console.warn('Error cancelling temp receive:', error);
            return {
                success: false,
                error: error.message,
                message: 'حدث خطأ أثناء إلغاء الاستلام المؤقت',
            };
        }
    }

    // ==================== إدارة مذكرات الاستلام ====================

    /**
     * إنشاء مذكرة استلام من استلام مؤقت معتمد
     * @param {Object} tempReceive - الاستلام المؤقت المعتمد
     * @returns {Promise<Object>}
     */
    async createReceiptNoteFromTempReceive(tempReceive) {
        try {
            const receiptNote = {
                id: this.generateId('RN'),
                documentNumber: this.generateDocumentNumber('RN'),
                tempReceiveId: tempReceive.id,
                tempReceiveNumber: tempReceive.documentNumber,
                referenceDocumentType: tempReceive.referenceDocumentType,
                referenceDocumentNumber: tempReceive.referenceDocumentNumber,
                fiscalYear: tempReceive.fiscalYear,
                warehouseId: tempReceive.warehouseId,
                warehouseName: tempReceive.warehouseName,
                supplierId: tempReceive.supplierId,
                supplierName: tempReceive.supplierName,
                receivingDate: tempReceive.receivingDate,
                items: tempReceive.items.map(item => ({
                    ...item,
                    tempReceiveItemId: item.id,
                })),
                roles: tempReceive.roles,
                totalQuantity: tempReceive.items.reduce((sum, item) => sum + (item.receivedQuantity || item.quantity || 0), 0),
                totalValue: tempReceive.items.reduce((sum, item) => sum + ((item.receivedQuantity || item.quantity || 0) * (item.unitPrice || 0)), 0),
                status: RECEIPT_NOTE_STATUS.FOLLOW_UP,
                createdAt: new Date().toISOString(),
                createdBy: tempReceive.approvedBy,
                history: [{
                    action: 'created',
                    performedBy: tempReceive.approvedBy,
                    performedAt: new Date().toISOString(),
                    notes: `تم إنشاء مذكرة الاستلام من الاستلام المؤقت رقم ${tempReceive.documentNumber}`,
                }],
            };

            const saved = await this.saveReceiptNote(receiptNote);

            // إرسال إشعار بإنشاء مذكرة الاستلام
            await this.sendNotification(
                TEMP_RECEIVE_NOTIFICATION_TYPES.RECEIPT_NOTE_CREATED,
                saved,
                [TEMP_RECEIVE_ROLES.WAREHOUSE_KEEPER.id, TEMP_RECEIVE_ROLES.INVENTORY_CONTROLLER.id]
            );

            this.emit('receiptNoteCreated', saved);

            return {
                success: true,
                receiptNote: saved,
                message: 'تم إنشاء مذكرة الاستلام بنجاح',
            };
        } catch (error) {
            console.warn('Error creating receipt note:', error);
            return {
                success: false,
                error: error.message,
                message: 'حدث خطأ أثناء إنشاء مذكرة الاستلام',
            };
        }
    }

    /**
     * اعتماد مذكرة الاستلام (إضافة للمخزون)
     * @param {String} id - معرف مذكرة الاستلام
     * @param {Object} approvedBy - المعتمد
     * @param {String} notes - ملاحظات
     * @returns {Promise<Object>}
     */
    async approveReceiptNote(id, approvedBy, notes = '') {
        try {
            const receiptNote = await this.getReceiptNote(id);
            if (!receiptNote) {
                return {
                    success: false,
                    error: 'not_found',
                    message: 'مذكرة الاستلام غير موجودة',
                };
            }

            if (receiptNote.status !== RECEIPT_NOTE_STATUS.FOLLOW_UP) {
                return {
                    success: false,
                    error: 'invalid_status',
                    message: 'لا يمكن اعتماد مذكرة الاستلام في هذه الحالة',
                };
            }

            // إضافة الأصناف للمخزون
            const inventoryResults = await this.addItemsToInventory(receiptNote);

            const updatedReceiptNote = {
                ...receiptNote,
                status: RECEIPT_NOTE_STATUS.APPROVED,
                approvedAt: new Date().toISOString(),
                approvedBy: approvedBy,
                approvalNotes: notes,
                inventoryMovements: inventoryResults.movements,
                updatedAt: new Date().toISOString(),
                history: [
                    ...receiptNote.history,
                    {
                        action: 'approved',
                        performedBy: approvedBy,
                        performedAt: new Date().toISOString(),
                        notes: notes || 'تم اعتماد مذكرة الاستلام وإضافة الأصناف للمخزون',
                    },
                ],
            };

            const saved = await this.saveReceiptNote(updatedReceiptNote);

            // إرسال إشعار باعتماد مذكرة الاستلام
            await this.sendNotification(
                TEMP_RECEIVE_NOTIFICATION_TYPES.RECEIPT_NOTE_APPROVED,
                saved,
                [
                    TEMP_RECEIVE_ROLES.YARD_OFFICER.id,
                    TEMP_RECEIVE_ROLES.WAREHOUSE_KEEPER.id,
                    TEMP_RECEIVE_ROLES.WAREHOUSE_MANAGER.id
                ]
            );

            // إشعار خاص بإضافة المخزون
            if (inventoryResults.success && inventoryResults.totalAdded > 0) {
                await this.sendNotification(
                    TEMP_RECEIVE_NOTIFICATION_TYPES.STOCK_ADDED,
                    {
                        ...saved,
                        addedItems: inventoryResults.totalAdded,
                    },
                    [TEMP_RECEIVE_ROLES.INVENTORY_CONTROLLER.id]
                );
            }

            this.emit('receiptNoteApproved', saved);

            return {
                success: true,
                receiptNote: saved,
                inventoryResults,
                message: 'تم اعتماد مذكرة الاستلام وإضافة الأصناف للمخزون',
            };
        } catch (error) {
            console.warn('Error approving receipt note:', error);
            return {
                success: false,
                error: error.message,
                message: 'حدث خطأ أثناء اعتماد مذكرة الاستلام',
            };
        }
    }

    // ==================== استعلامات ====================

    /**
     * جلب استلام مؤقت بالمعرف
     * @param {String} id - معرف الاستلام المؤقت
     * @returns {Promise<Object>}
     */
    async getTempReceive(id) {
        try {
            // محاولة جلب من API
            try {
                const response = await apiGet(API_ENDPOINTS.TEMP_RECEIVE_BY_ID(id));
                if (response && !response.error) {
                    return response;
                }
            } catch (apiError) {
                console.warn('API not available, using local storage');
            }

            // جلب من التخزين المحلي
            const tempReceives = this.getStoredTempReceives();
            return tempReceives.find(tr => tr.id === id) || null;
        } catch (error) {
            console.warn('Error getting temp receive:', error);
            return null;
        }
    }

    /**
     * جلب جميع الاستلامات المؤقتة مع الفلاتر
     * @param {Object} filters - الفلاتر
     * @returns {Promise<Array>}
     */
    async getTempReceives(filters = {}) {
        try {
            // محاولة جلب من API
            try {
                const queryString = new URLSearchParams(filters).toString();
                const response = await apiGet(`${API_ENDPOINTS.TEMP_RECEIVES}?${queryString}`);
                if (response && !response.error) {
                    return response;
                }
            } catch (apiError) {
                console.warn('API not available, using local storage');
            }

            // جلب من التخزين المحلي
            let tempReceives = this.getStoredTempReceives();

            // تطبيق الفلاتر
            if (filters.status) {
                tempReceives = tempReceives.filter(tr => tr.status === filters.status);
            }
            if (filters.warehouseId) {
                tempReceives = tempReceives.filter(tr => tr.warehouseId === filters.warehouseId);
            }
            if (filters.fiscalYear) {
                tempReceives = tempReceives.filter(tr => tr.fiscalYear === filters.fiscalYear);
            }
            if (filters.fromDate) {
                tempReceives = tempReceives.filter(tr => tr.receivingDate >= filters.fromDate);
            }
            if (filters.toDate) {
                tempReceives = tempReceives.filter(tr => tr.receivingDate <= filters.toDate);
            }
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                tempReceives = tempReceives.filter(tr =>
                    tr.documentNumber?.toLowerCase().includes(searchLower) ||
                    tr.supplierName?.toLowerCase().includes(searchLower) ||
                    tr.referenceDocumentNumber?.toLowerCase().includes(searchLower)
                );
            }

            // ترتيب حسب التاريخ
            tempReceives.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return tempReceives;
        } catch (error) {
            console.warn('Error getting temp receives:', error);
            return [];
        }
    }

    /**
     * جلب الاستلامات المؤقتة المنتظرة للاعتماد
     * @returns {Promise<Array>}
     */
    async getPendingTempReceives() {
        return this.getTempReceives({ status: TEMP_RECEIVE_STATUS.TRANSFERRED });
    }

    /**
     * جلب مذكرة استلام بالمعرف
     * @param {String} id - معرف مذكرة الاستلام
     * @returns {Promise<Object>}
     */
    async getReceiptNote(id) {
        try {
            try {
                const response = await apiGet(API_ENDPOINTS.RECEIPT_NOTE_BY_ID(id));
                if (response && !response.error) {
                    return response;
                }
            } catch (apiError) {
                console.warn('API not available, using local storage');
            }

            const receiptNotes = this.getStoredReceiptNotes();
            return receiptNotes.find(rn => rn.id === id) || null;
        } catch (error) {
            console.warn('Error getting receipt note:', error);
            return null;
        }
    }

    /**
     * جلب جميع مذكرات الاستلام مع الفلاتر
     * @param {Object} filters - الفلاتر
     * @returns {Promise<Array>}
     */
    async getReceiptNotes(filters = {}) {
        try {
            try {
                const queryString = new URLSearchParams(filters).toString();
                const response = await apiGet(`${API_ENDPOINTS.RECEIPT_NOTES}?${queryString}`);
                if (response && !response.error) {
                    return response;
                }
            } catch (apiError) {
                console.warn('API not available, using local storage');
            }

            let receiptNotes = this.getStoredReceiptNotes();

            // تطبيق الفلاتر
            if (filters.status) {
                receiptNotes = receiptNotes.filter(rn => rn.status === filters.status);
            }
            if (filters.warehouseId) {
                receiptNotes = receiptNotes.filter(rn => rn.warehouseId === filters.warehouseId);
            }
            if (filters.tempReceiveId) {
                receiptNotes = receiptNotes.filter(rn => rn.tempReceiveId === filters.tempReceiveId);
            }

            receiptNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return receiptNotes;
        } catch (error) {
            console.warn('Error getting receipt notes:', error);
            return [];
        }
    }

    // ==================== الإحصائيات ====================

    /**
     * جلب إحصائيات الاستلام المؤقت
     * @param {Object} filters - الفلاتر
     * @returns {Promise<Object>}
     */
    async getStatistics(filters = {}) {
        try {
            const tempReceives = await this.getTempReceives(filters);

            const statistics = {
                total: tempReceives.length,
                byStatus: {
                    [TEMP_RECEIVE_STATUS.FOLLOW_UP]: 0,
                    [TEMP_RECEIVE_STATUS.TRANSFERRED]: 0,
                    [TEMP_RECEIVE_STATUS.APPROVED]: 0,
                    [TEMP_RECEIVE_STATUS.REJECTED]: 0,
                    [TEMP_RECEIVE_STATUS.CANCELLED]: 0,
                },
                totalValue: 0,
                totalItems: 0,
                pendingApproval: 0,
                thisMonth: 0,
                thisWeek: 0,
            };

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());

            tempReceives.forEach(tr => {
                statistics.byStatus[tr.status]++;
                statistics.totalItems += tr.items?.length || 0;
                statistics.totalValue += tr.items?.reduce((sum, item) =>
                    sum + ((item.receivedQuantity || item.quantity || 0) * (item.unitPrice || 0)), 0) || 0;

                const createdDate = new Date(tr.createdAt);
                if (createdDate >= startOfMonth) {
                    statistics.thisMonth++;
                }
                if (createdDate >= startOfWeek) {
                    statistics.thisWeek++;
                }
            });

            statistics.pendingApproval = statistics.byStatus[TEMP_RECEIVE_STATUS.TRANSFERRED];

            return statistics;
        } catch (error) {
            console.warn('Error getting statistics:', error);
            return null;
        }
    }

    // ==================== الإشعارات ====================

    /**
     * إرسال إشعار
     * @param {String} type - نوع الإشعار
     * @param {Object} data - البيانات
     * @param {Array} recipientRoles - أدوار المستلمين
     * @returns {Promise<void>}
     */
    async sendNotification(type, data, recipientRoles) {
        try {
            const notification = {
                id: this.generateId('NOTIF'),
                type,
                title: this.getNotificationTitle(type),
                message: this.getNotificationMessage(type, data),
                data: {
                    tempReceiveId: data.id,
                    documentNumber: data.documentNumber,
                    warehouseId: data.warehouseId,
                    status: data.status,
                },
                recipientRoles,
                isRead: false,
                createdAt: new Date().toISOString(),
            };

            // محاولة إرسال عبر API
            try {
                await apiPost(API_ENDPOINTS.NOTIFICATIONS_SEND, notification);
            } catch (apiError) {
                console.warn('API notification failed, storing locally');
                this.storeNotification(notification);
            }

            this.emit('notificationSent', notification);
        } catch (error) {
            console.warn('Error sending notification:', error);
        }
    }

    getNotificationTitle(type) {
        const titles = {
            [TEMP_RECEIVE_NOTIFICATION_TYPES.NEW_TEMP_RECEIVE]: 'استلام مؤقت جديد',
            [TEMP_RECEIVE_NOTIFICATION_TYPES.TEMP_RECEIVE_TRANSFERRED]: 'تم ترحيل استلام مؤقت',
            [TEMP_RECEIVE_NOTIFICATION_TYPES.TEMP_RECEIVE_APPROVED]: 'تم اعتماد استلام مؤقت',
            [TEMP_RECEIVE_NOTIFICATION_TYPES.TEMP_RECEIVE_REJECTED]: 'تم رفض استلام مؤقت',
            [TEMP_RECEIVE_NOTIFICATION_TYPES.TEMP_RECEIVE_CANCELLED]: 'تم إلغاء استلام مؤقت',
            [TEMP_RECEIVE_NOTIFICATION_TYPES.RECEIPT_NOTE_CREATED]: 'تم إنشاء مذكرة استلام',
            [TEMP_RECEIVE_NOTIFICATION_TYPES.RECEIPT_NOTE_APPROVED]: 'تم اعتماد مذكرة استلام',
            [TEMP_RECEIVE_NOTIFICATION_TYPES.RECEIPT_NOTE_CANCELLED]: 'تم إلغاء مذكرة استلام',
            [TEMP_RECEIVE_NOTIFICATION_TYPES.STOCK_ADDED]: 'تم إضافة أصناف للمخزون',
            [TEMP_RECEIVE_NOTIFICATION_TYPES.APPROVAL_REQUIRED]: 'مطلوب اعتماد',
            [TEMP_RECEIVE_NOTIFICATION_TYPES.INSPECTION_REQUIRED]: 'مطلوب فحص',
        };
        return titles[type] || 'إشعار';
    }

    getNotificationMessage(type, data) {
        const messages = {
            [TEMP_RECEIVE_NOTIFICATION_TYPES.NEW_TEMP_RECEIVE]: `تم إنشاء استلام مؤقت جديد رقم ${data.documentNumber}`,
            [TEMP_RECEIVE_NOTIFICATION_TYPES.TEMP_RECEIVE_TRANSFERRED]: `تم ترحيل الاستلام المؤقت رقم ${data.documentNumber} للاعتماد`,
            [TEMP_RECEIVE_NOTIFICATION_TYPES.TEMP_RECEIVE_APPROVED]: `تم اعتماد الاستلام المؤقت رقم ${data.documentNumber}`,
            [TEMP_RECEIVE_NOTIFICATION_TYPES.TEMP_RECEIVE_REJECTED]: `تم رفض الاستلام المؤقت رقم ${data.documentNumber}`,
            [TEMP_RECEIVE_NOTIFICATION_TYPES.TEMP_RECEIVE_CANCELLED]: `تم إلغاء الاستلام المؤقت رقم ${data.documentNumber}`,
            [TEMP_RECEIVE_NOTIFICATION_TYPES.RECEIPT_NOTE_CREATED]: `تم إنشاء مذكرة استلام رقم ${data.documentNumber}`,
            [TEMP_RECEIVE_NOTIFICATION_TYPES.RECEIPT_NOTE_APPROVED]: `تم اعتماد مذكرة الاستلام رقم ${data.documentNumber} وإضافة الأصناف للمخزون`,
            [TEMP_RECEIVE_NOTIFICATION_TYPES.RECEIPT_NOTE_CANCELLED]: `تم إلغاء مذكرة الاستلام رقم ${data.documentNumber}`,
            [TEMP_RECEIVE_NOTIFICATION_TYPES.STOCK_ADDED]: `تم إضافة ${data.addedItems || 'عدة'} أصناف للمخزون من مذكرة الاستلام رقم ${data.documentNumber}`,
            [TEMP_RECEIVE_NOTIFICATION_TYPES.APPROVAL_REQUIRED]: `الاستلام المؤقت رقم ${data.documentNumber} بانتظار اعتمادك`,
            [TEMP_RECEIVE_NOTIFICATION_TYPES.INSPECTION_REQUIRED]: `الاستلام المؤقت رقم ${data.documentNumber} بانتظار الفحص`,
        };
        return messages[type] || 'لديك إشعار جديد';
    }

    // ==================== التكامل مع المخزون ====================

    /**
     * إضافة الأصناف للمخزون
     * @param {Object} receiptNote - مذكرة الاستلام
     * @returns {Promise<Object>}
     */
    async addItemsToInventory(receiptNote) {
        const movements = [];
        const errors = [];

        // استيراد خدمة المخزون ديناميكياً
        let inventoryService;
        try {
            const { inventoryService: service } = await import('./inventoryService');
            inventoryService = service;
        } catch (error) {
            console.warn('Inventory service not available');
        }

        for (const item of receiptNote.items) {
            try {
                const movementData = {
                    itemId: item.itemId,
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    warehouseId: receiptNote.warehouseId,
                    warehouseName: receiptNote.warehouseName,
                    quantity: item.receivedQuantity || item.quantity,
                    unitPrice: item.unitPrice,
                    documentNumber: receiptNote.documentNumber,
                    documentType: 'receipt_note',
                    supplierId: receiptNote.supplierId,
                    supplierName: receiptNote.supplierName,
                    notes: `استلام من مذكرة ${receiptNote.documentNumber}`,
                    receivedBy: receiptNote.approvedBy,
                };

                if (inventoryService) {
                    const result = await inventoryService.recordReceipt(movementData);
                    movements.push(result);
                } else {
                    // تسجيل محلي
                    movements.push({
                        ...movementData,
                        id: this.generateId('MOV'),
                        status: 'completed',
                        createdAt: new Date().toISOString(),
                    });
                }
            } catch (itemError) {
                errors.push({
                    itemId: item.itemId,
                    itemName: item.itemName,
                    error: itemError.message,
                });
            }
        }

        return {
            success: errors.length === 0,
            movements,
            errors,
            totalAdded: movements.length,
            totalFailed: errors.length,
        };
    }

    // ==================== التحقق من الصحة ====================

    /**
     * التحقق من صحة بيانات الاستلام المؤقت
     * @param {Object} data - البيانات
     * @returns {Object} - نتيجة التحقق
     */
    validateTempReceiveData(data) {
        const errors = [];

        if (!data.referenceDocumentType) {
            errors.push('نوع المستند المرجعي مطلوب (تعميد أو محضر)');
        }
        if (!data.referenceDocumentNumber) {
            errors.push('رقم المستند المرجعي مطلوب');
        }
        if (!data.fiscalYear) {
            errors.push('السنة المالية مطلوبة');
        }
        if (!data.warehouseId) {
            errors.push('المستودع مطلوب');
        }
        if (!data.receivingDate) {
            errors.push('تاريخ الاستلام مطلوب');
        }
        if (!data.items || data.items.length === 0) {
            errors.push('يجب إضافة صنف واحد على الأقل');
        }

        // التحقق من الأدوار الإلزامية
        if (!data.roles) {
            errors.push('بيانات الأدوار مطلوبة');
        } else {
            Object.values(TEMP_RECEIVE_ROLES).forEach(role => {
                if (role.required && !data.roles[role.id]) {
                    errors.push(`${role.name} مطلوب`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * التحقق من اكتمال بيانات الفحص
     * @param {Object} tempReceive - الاستلام المؤقت
     * @returns {Object}
     */
    validateInspectionData(tempReceive) {
        const errors = [];

        if (!tempReceive.items || tempReceive.items.length === 0) {
            errors.push('لا توجد أصناف للفحص');
            return { isValid: false, errors };
        }

        tempReceive.items.forEach((item, index) => {
            if (item.receivedQuantity === undefined || item.receivedQuantity === null) {
                errors.push(`الكمية المستلمة للصنف ${index + 1} غير محددة`);
            }
            if (!item.inspectionResult) {
                errors.push(`نتيجة الفحص للصنف ${index + 1} غير محددة`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // ==================== مساعدات ====================

    generateId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    generateDocumentNumber(prefix) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}-${year}${month}-${random}`;
    }

    // ==================== التخزين ====================

    async saveTempReceive(tempReceive) {
        try {
            // محاولة الحفظ عبر API
            try {
                const response = tempReceive.id && !tempReceive.id.startsWith('TR-')
                    ? await apiPut(API_ENDPOINTS.TEMP_RECEIVE_BY_ID(tempReceive.id), tempReceive)
                    : await apiPost(API_ENDPOINTS.TEMP_RECEIVES, tempReceive);
                if (response && !response.error) {
                    return response;
                }
            } catch (apiError) {
                console.warn('API save failed, storing locally');
            }

            // حفظ محلي
            const tempReceives = this.getStoredTempReceives();
            const existingIndex = tempReceives.findIndex(tr => tr.id === tempReceive.id);
            if (existingIndex >= 0) {
                tempReceives[existingIndex] = tempReceive;
            } else {
                tempReceives.push(tempReceive);
            }
            this.storeTempReceives(tempReceives);
            return tempReceive;
        } catch (error) {
            throw error;
        }
    }

    async saveReceiptNote(receiptNote) {
        try {
            try {
                const response = receiptNote.id && !receiptNote.id.startsWith('RN-')
                    ? await apiPut(API_ENDPOINTS.RECEIPT_NOTE_BY_ID(receiptNote.id), receiptNote)
                    : await apiPost(API_ENDPOINTS.RECEIPT_NOTES, receiptNote);
                if (response && !response.error) {
                    return response;
                }
            } catch (apiError) {
                console.warn('API save failed, storing locally');
            }

            const receiptNotes = this.getStoredReceiptNotes();
            const existingIndex = receiptNotes.findIndex(rn => rn.id === receiptNote.id);
            if (existingIndex >= 0) {
                receiptNotes[existingIndex] = receiptNote;
            } else {
                receiptNotes.push(receiptNote);
            }
            this.storeReceiptNotes(receiptNotes);
            return receiptNote;
        } catch (error) {
            throw error;
        }
    }

    getStoredTempReceives() {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.TEMP_RECEIVES);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    storeTempReceives(tempReceives) {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEYS.TEMP_RECEIVES, JSON.stringify(tempReceives));
        } catch (error) {
            console.warn('Error storing temp receives:', error);
        }
    }

    getStoredReceiptNotes() {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.RECEIPT_NOTES);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    storeReceiptNotes(receiptNotes) {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEYS.RECEIPT_NOTES, JSON.stringify(receiptNotes));
        } catch (error) {
            console.warn('Error storing receipt notes:', error);
        }
    }

    storeNotification(notification) {
        if (typeof window === 'undefined') return;
        try {
            const notifications = this.getStoredNotifications();
            notifications.push(notification);
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        } catch (error) {
            console.warn('Error storing notification:', error);
        }
    }

    getStoredNotifications() {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }
}

// إنشاء instance واحد للخدمة
export const tempReceiveService = new TempReceiveService();
export default tempReceiveService;
