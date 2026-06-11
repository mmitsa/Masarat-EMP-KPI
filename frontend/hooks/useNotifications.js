/**
 * useNotifications Hook - ربط الإشعارات بقاعدة البيانات
 * يدمج بين SystemNotificationContext و Backend API
 * مع دعم تفضيلات المستخدم وصلاحياته (RBAC)
 *
 * @version 2.0.0
 * @date 2026-02-03
 */

import { useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useSystemNotifications, SYSTEMS, PRIORITY, NOTIFICATION_TYPES } from '../context/SystemNotificationContext';
import { useNotificationPreferences } from '../context/NotificationPreferencesContext';
import api from '../lib/api';

// ═══════════════════════════════════════════════════════════════
// تعيين الأنظمة وأنواع الإشعارات
// ═══════════════════════════════════════════════════════════════
const SYSTEM_TYPE_MAPPING = {
    // Warehouse
    warehouse_lowStock: { system: 'warehouse', type: 'lowStock' },
    warehouse_exchangeRequest: { system: 'warehouse', type: 'exchangeRequest' },
    warehouse_custody: { system: 'warehouse', type: 'custody' },
    warehouse_approval: { system: 'warehouse', type: 'approval' },
    warehouse_delivery: { system: 'warehouse', type: 'delivery' },
    // HR
    hr_leaveRequest: { system: 'hr', type: 'leaveRequest' },
    hr_newEmployee: { system: 'hr', type: 'newEmployee' },
    hr_documentExpiry: { system: 'hr', type: 'documentExpiry' },
    hr_evaluation: { system: 'hr', type: 'evaluation' },
    hr_attendance: { system: 'hr', type: 'attendance' },
    hr_deviceOffline: { system: 'hr', type: 'deviceOffline' },
    hr_transfer: { system: 'hr', type: 'transfer' },
    // Movement
    movement_vehicleAssigned: { system: 'movement', type: 'vehicleAssigned' },
    movement_tripStatus: { system: 'movement', type: 'tripStatus' },
    movement_maintenance: { system: 'movement', type: 'maintenance' },
    // Archiving
    archiving_documentUploaded: { system: 'archiving', type: 'documentUploaded' },
    archiving_documentShared: { system: 'archiving', type: 'documentShared' },
    archiving_folderShared: { system: 'archiving', type: 'folderShared' },
    // Sadad
    sadad_paymentReceived: { system: 'sadad', type: 'paymentReceived' },
    sadad_invoiceCreated: { system: 'sadad', type: 'invoiceCreated' },
    sadad_paymentDue: { system: 'sadad', type: 'paymentDue' },
    // Approval
    approval_pending: { system: 'approval', type: 'pending' },
    approval_result: { system: 'approval', type: 'result' },
    // System
    system_announcement: { system: 'system', type: 'announcement' },
};

// تحويل الأولوية من النص إلى الصيغة المستخدمة في التفضيلات
const PRIORITY_MAPPING = {
    'High': 'high',
    'Normal': 'medium',
    'Low': 'low',
    'Urgent': 'urgent',
};

/**
 * Hook للإشعارات المتكاملة مع قاعدة البيانات
 * يرسل الإشعارات للـ Backend ويضيفها للـ Context المحلي
 * مع احترام تفضيلات المستخدم وصلاحياته
 */
export function useNotifications() {
    const { data: session } = useSession();
    const systemNotifications = useSystemNotifications();
    const userId = session?.user?.id;

    // الحصول على تفضيلات الإشعارات (اختياري - قد لا يكون موجوداً)
    let notificationPreferences = null;
    try {
        notificationPreferences = useNotificationPreferences();
    } catch (e) {
        // Context غير متوفر - استمر بدون تفضيلات
    }

    const { canSendNotification, preferences } = notificationPreferences || {};

    /**
     * التحقق من إمكانية إرسال الإشعار بناءً على التفضيلات
     */
    const shouldSendNotification = useCallback((notificationKey, priority = 'Normal') => {
        // إذا لم تكن التفضيلات متوفرة، أرسل دائماً
        if (!canSendNotification) return true;

        const mapping = SYSTEM_TYPE_MAPPING[notificationKey];
        if (!mapping) return true;

        const priorityKey = PRIORITY_MAPPING[priority] || 'medium';
        return canSendNotification(mapping.system, mapping.type, priorityKey);
    }, [canSendNotification]);

    /**
     * إرسال إشعار للـ Backend وإضافته محلياً
     * مع احترام تفضيلات المستخدم
     */
    const sendNotification = useCallback(async ({
        recipientIds,
        title,
        titleAr,
        message,
        messageAr,
        notificationType = 'Info',
        entityType,
        entityId,
        actionUrl,
        priority = 'Normal',
        system = SYSTEMS.SYSTEM,
        localPriority = PRIORITY.MEDIUM,
        notificationKey, // مفتاح التحقق من التفضيلات
        skipPreferenceCheck = false, // تجاوز التحقق من التفضيلات (للإشعارات الإجبارية)
    }) => {
        // التحقق من التفضيلات (إذا لم يتم تجاوزها)
        if (!skipPreferenceCheck && notificationKey) {
            const canSend = shouldSendNotification(notificationKey, priority);
            if (!canSend) {
                console.log(`Notification blocked by preferences: ${notificationKey}`);
                return null;
            }
        }

        // التحقق من تفعيل الصوت
        const shouldPlaySound = preferences?.general?.sound !== false;

        // إضافة للـ Context المحلي فوراً
        const localNotification = systemNotifications.addNotification({
            type: NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
            system,
            priority: localPriority,
            title: titleAr || title,
            message: messageAr || message,
            actionUrl,
            data: { entityType, entityId },
            playSound: shouldPlaySound,
        });

        // إرسال للـ Backend
        try {
            // دعم إرسال لعدة مستلمين
            const recipients = recipientIds || [userId];

            // إرسال إشعار لكل مستلم
            const sendPromises = recipients.filter(Boolean).map(async (recipientId) => {
                const backendData = {
                    UserId: parseInt(recipientId, 10),
                    TitleAr: titleAr || title || '',
                    TitleEn: title || titleAr || '',
                    MessageAr: messageAr || message || '',
                    MessageEn: message || messageAr || '',
                    NotificationType: notificationType || 'Info',
                    EntityType: entityType || null,
                    EntityId: entityId ? parseInt(entityId, 10) : null,
                    ActionUrl: actionUrl || null,
                    Priority: priority || 'Normal',
                };

                return api.notifications?.create?.(backendData);
            });

            await Promise.allSettled(sendPromises).catch(err => {
                console.warn('Backend notification failed, local only:', err);
            });
        } catch (error) {
            console.warn('Failed to send to backend:', error);
        }

        return localNotification;
    }, [userId, systemNotifications, shouldSendNotification, preferences]);

    // ═══════════════════════════════════════════════════════════════
    // إشعارات المستودعات
    // ═══════════════════════════════════════════════════════════════

    const notifyWarehouseLowStock = useCallback(async (itemName, currentStock, minStock, itemId) => {
        const priority = currentStock <= minStock * 0.5 ? 'High' : 'Normal';
        return sendNotification({
            title: 'Low Stock Alert',
            titleAr: 'تنبيه مخزون منخفض',
            message: `Item "${itemName}" reached minimum level (${currentStock} remaining)`,
            messageAr: `المنتج "${itemName}" وصل للحد الأدنى (${currentStock} وحدة متبقية)`,
            notificationType: 'Alert',
            entityType: 'WarehouseItem',
            entityId: itemId,
            actionUrl: '/warehouse/items',
            priority,
            system: SYSTEMS.WAREHOUSE,
            localPriority: currentStock <= minStock * 0.5 ? PRIORITY.URGENT : PRIORITY.HIGH,
            notificationKey: 'warehouse_lowStock',
        });
    }, [sendNotification]);

    const notifyWarehouseExchangeRequest = useCallback(async (requestId, requestNumber, requesterName, status) => {
        const statusMessages = {
            created: { title: 'طلب صرف جديد', message: `${requesterName} أنشأ طلب صرف رقم ${requestNumber}` },
            approved: { title: 'تمت الموافقة على طلب الصرف', message: `تمت الموافقة على طلب الصرف رقم ${requestNumber}` },
            rejected: { title: 'تم رفض طلب الصرف', message: `تم رفض طلب الصرف رقم ${requestNumber}` },
            delivered: { title: 'تم تسليم الصرف', message: `تم تسليم طلب الصرف رقم ${requestNumber}` },
        };
        const msg = statusMessages[status] || statusMessages.created;
        const priority = status === 'created' ? 'High' : 'Normal';

        return sendNotification({
            titleAr: msg.title,
            messageAr: msg.message,
            notificationType: status === 'created' ? 'Approval' : 'Info',
            entityType: 'ExchangeRequest',
            entityId: requestId,
            actionUrl: `/warehouse/exchange-request?id=${requestId}`,
            priority,
            system: SYSTEMS.WAREHOUSE,
            localPriority: status === 'created' ? PRIORITY.HIGH : PRIORITY.MEDIUM,
            notificationKey: 'warehouse_exchangeRequest',
        });
    }, [sendNotification]);

    const notifyWarehouseCustody = useCallback(async (custodyId, employeeName, action) => {
        const actions = {
            assigned: { title: 'عهدة جديدة', message: `تم تسليم عهدة جديدة لـ ${employeeName}` },
            returned: { title: 'إرجاع عهدة', message: `${employeeName} أرجع عهدة` },
            transferred: { title: 'نقل عهدة', message: `تم نقل عهدة من ${employeeName}` },
        };
        const msg = actions[action] || actions.assigned;

        return sendNotification({
            titleAr: msg.title,
            messageAr: msg.message,
            notificationType: 'Info',
            entityType: 'Custody',
            entityId: custodyId,
            actionUrl: `/warehouse/custody?id=${custodyId}`,
            system: SYSTEMS.WAREHOUSE,
            notificationKey: 'warehouse_custody',
        });
    }, [sendNotification]);

    // ═══════════════════════════════════════════════════════════════
    // إشعارات الموارد البشرية
    // ═══════════════════════════════════════════════════════════════

    const notifyHRLeaveRequest = useCallback(async (leaveId, employeeName, leaveType, startDate, endDate, status) => {
        const statusMessages = {
            pending: { title: 'طلب إجازة جديد', message: `${employeeName} طلب إجازة ${leaveType} من ${startDate} إلى ${endDate}`, type: 'Approval' },
            approved: { title: 'تمت الموافقة على الإجازة', message: `تمت الموافقة على إجازة ${employeeName}`, type: 'Info' },
            rejected: { title: 'تم رفض طلب الإجازة', message: `تم رفض طلب إجازة ${employeeName}`, type: 'Alert' },
        };
        const msg = statusMessages[status] || statusMessages.pending;
        const priority = status === 'pending' ? 'High' : 'Normal';

        return sendNotification({
            titleAr: msg.title,
            messageAr: msg.message,
            notificationType: msg.type,
            entityType: 'LeaveRequest',
            entityId: leaveId,
            actionUrl: `/hr/leaves?id=${leaveId}`,
            priority,
            system: SYSTEMS.HR,
            localPriority: status === 'pending' ? PRIORITY.HIGH : PRIORITY.MEDIUM,
            notificationKey: 'hr_leaveRequest',
        });
    }, [sendNotification]);

    const notifyHRNewEmployee = useCallback(async (employeeId, employeeName, departmentName) => {
        return sendNotification({
            titleAr: 'موظف جديد',
            messageAr: `تم إضافة الموظف ${employeeName} إلى قسم ${departmentName}`,
            notificationType: 'Info',
            entityType: 'Employee',
            entityId: employeeId,
            actionUrl: `/hr/employees/${employeeId}`,
            system: SYSTEMS.HR,
            notificationKey: 'hr_newEmployee',
        });
    }, [sendNotification]);

    const notifyHRDocumentExpiry = useCallback(async (employeeId, employeeName, documentType, expiryDate) => {
        return sendNotification({
            titleAr: 'وثيقة قاربت على الانتهاء',
            messageAr: `${documentType} للموظف ${employeeName} ستنتهي في ${expiryDate}`,
            notificationType: 'Alert',
            entityType: 'EmployeeDocument',
            entityId: employeeId,
            actionUrl: `/hr/employees/${employeeId}?tab=documents`,
            priority: 'High',
            system: SYSTEMS.HR,
            localPriority: PRIORITY.HIGH,
            notificationKey: 'hr_documentExpiry',
        });
    }, [sendNotification]);

    const notifyDeviceOffline = useCallback(async (deviceId, deviceName, location) => {
        return sendNotification({
            title: 'Biometric Device Offline',
            titleAr: 'جهاز بصمة غير متصل',
            message: `Device "${deviceName}" at ${location || 'unknown location'} went offline`,
            messageAr: `الجهاز "${deviceName}"${location ? ` في ${location}` : ''} فقد الاتصال`,
            notificationType: 'Alert',
            entityType: 'BiometricDevice',
            entityId: deviceId,
            actionUrl: '/hr/settings?tab=devices',
            priority: 'High',
            system: SYSTEMS.HR,
            localPriority: PRIORITY.HIGH,
            notificationKey: 'hr_deviceOffline',
            skipPreferenceCheck: true, // تنبيه تشغيلي حرج
        });
    }, [sendNotification]);

    const notifyHREvaluation = useCallback(async (evaluationId, employeeName, evaluationType, status) => {
        const statusMessages = {
            due: { title: 'تقييم مستحق', message: `حان موعد تقييم ${evaluationType} للموظف ${employeeName}` },
            completed: { title: 'تم إكمال التقييم', message: `تم إكمال تقييم ${evaluationType} للموظف ${employeeName}` },
        };
        const msg = statusMessages[status] || statusMessages.due;
        const priority = status === 'due' ? 'High' : 'Normal';

        return sendNotification({
            titleAr: msg.title,
            messageAr: msg.message,
            notificationType: status === 'due' ? 'Task' : 'Info',
            entityType: 'Evaluation',
            entityId: evaluationId,
            actionUrl: `/hr/evaluations?id=${evaluationId}`,
            priority,
            system: SYSTEMS.HR,
            notificationKey: 'hr_evaluation',
        });
    }, [sendNotification]);

    // ═══════════════════════════════════════════════════════════════
    // إشعارات الحركة والنقل
    // ═══════════════════════════════════════════════════════════════

    const notifyMovementVehicleAssigned = useCallback(async (tripId, vehiclePlate, driverName, tripDate) => {
        return sendNotification({
            titleAr: 'تم تعيين مركبة',
            messageAr: `تم تعيين المركبة (${vehiclePlate}) مع السائق ${driverName} ليوم ${tripDate}`,
            notificationType: 'Info',
            entityType: 'Trip',
            entityId: tripId,
            actionUrl: `/movement/trips/${tripId}`,
            system: SYSTEMS.MOVEMENT,
            notificationKey: 'movement_vehicleAssigned',
        });
    }, [sendNotification]);

    const notifyMovementTripStatus = useCallback(async (tripId, tripName, status) => {
        const statusMessages = {
            started: { title: 'بدأت الرحلة', message: `بدأت رحلة ${tripName}` },
            completed: { title: 'اكتملت الرحلة', message: `اكتملت رحلة ${tripName} بنجاح` },
            cancelled: { title: 'تم إلغاء الرحلة', message: `تم إلغاء رحلة ${tripName}` },
        };
        const msg = statusMessages[status] || statusMessages.started;

        return sendNotification({
            titleAr: msg.title,
            messageAr: msg.message,
            notificationType: 'Info',
            entityType: 'Trip',
            entityId: tripId,
            actionUrl: `/movement/trips/${tripId}`,
            system: SYSTEMS.MOVEMENT,
            notificationKey: 'movement_tripStatus',
        });
    }, [sendNotification]);

    const notifyMovementMaintenance = useCallback(async (vehicleId, vehiclePlate, maintenanceType, dueDate) => {
        return sendNotification({
            titleAr: 'صيانة مستحقة',
            messageAr: `المركبة (${vehiclePlate}) تحتاج ${maintenanceType} قبل ${dueDate}`,
            notificationType: 'Alert',
            entityType: 'Vehicle',
            entityId: vehicleId,
            actionUrl: `/movement/vehicles/${vehicleId}`,
            priority: 'High',
            system: SYSTEMS.MOVEMENT,
            localPriority: PRIORITY.HIGH,
            notificationKey: 'movement_maintenance',
        });
    }, [sendNotification]);

    // ═══════════════════════════════════════════════════════════════
    // إشعارات الأرشفة
    // ═══════════════════════════════════════════════════════════════

    const notifyArchivingDocumentUploaded = useCallback(async (documentId, documentName, uploaderName) => {
        return sendNotification({
            titleAr: 'مستند جديد',
            messageAr: `${uploaderName} رفع مستند "${documentName}"`,
            notificationType: 'Info',
            entityType: 'Document',
            entityId: documentId,
            actionUrl: `/archiving/documents/${documentId}`,
            system: SYSTEMS.ARCHIVING,
            notificationKey: 'archiving_documentUploaded',
        });
    }, [sendNotification]);

    const notifyArchivingDocumentShared = useCallback(async (documentId, documentName, sharerName) => {
        return sendNotification({
            titleAr: 'تمت مشاركة مستند معك',
            messageAr: `${sharerName} شارك معك المستند "${documentName}"`,
            notificationType: 'Info',
            entityType: 'Document',
            entityId: documentId,
            actionUrl: `/archiving/documents/${documentId}`,
            system: SYSTEMS.ARCHIVING,
            notificationKey: 'archiving_documentShared',
        });
    }, [sendNotification]);

    const notifyArchivingFolderShared = useCallback(async (folderId, folderName, sharerName) => {
        return sendNotification({
            titleAr: 'تمت مشاركة مجلد معك',
            messageAr: `${sharerName} شارك معك المجلد "${folderName}"`,
            notificationType: 'Info',
            entityType: 'Folder',
            entityId: folderId,
            actionUrl: `/archiving/folders/${folderId}`,
            system: SYSTEMS.ARCHIVING,
            notificationKey: 'archiving_folderShared',
        });
    }, [sendNotification]);

    // ═══════════════════════════════════════════════════════════════
    // إشعارات سداد
    // ═══════════════════════════════════════════════════════════════

    const notifySadadPaymentReceived = useCallback(async (paymentId, amount, payerName) => {
        return sendNotification({
            titleAr: 'دفعة مستلمة',
            messageAr: `تم استلام دفعة بمبلغ ${amount.toLocaleString()} ريال من ${payerName}`,
            notificationType: 'Info',
            entityType: 'Payment',
            entityId: paymentId,
            actionUrl: `/sadad/payments/${paymentId}`,
            system: SYSTEMS.SADAD,
            notificationKey: 'sadad_paymentReceived',
        });
    }, [sendNotification]);

    const notifySadadInvoiceCreated = useCallback(async (invoiceId, invoiceNumber, amount, clientName) => {
        return sendNotification({
            titleAr: 'فاتورة جديدة',
            messageAr: `تم إنشاء فاتورة رقم ${invoiceNumber} بمبلغ ${amount.toLocaleString()} ريال لـ ${clientName}`,
            notificationType: 'Info',
            entityType: 'Invoice',
            entityId: invoiceId,
            actionUrl: `/sadad/invoices/${invoiceId}`,
            system: SYSTEMS.SADAD,
            notificationKey: 'sadad_invoiceCreated',
        });
    }, [sendNotification]);

    const notifySadadPaymentDue = useCallback(async (invoiceId, invoiceNumber, amount, dueDate) => {
        return sendNotification({
            titleAr: 'دفعة مستحقة',
            messageAr: `الفاتورة رقم ${invoiceNumber} بمبلغ ${amount.toLocaleString()} ريال مستحقة في ${dueDate}`,
            notificationType: 'Alert',
            entityType: 'Invoice',
            entityId: invoiceId,
            actionUrl: `/sadad/invoices/${invoiceId}`,
            priority: 'High',
            system: SYSTEMS.SADAD,
            localPriority: PRIORITY.HIGH,
            notificationKey: 'sadad_paymentDue',
        });
    }, [sendNotification]);

    // ═══════════════════════════════════════════════════════════════
    // إشعارات الموافقات
    // ═══════════════════════════════════════════════════════════════

    const notifyApprovalPending = useCallback(async (requestId, requestType, requesterName, description) => {
        const typeNames = {
            leave: 'طلب إجازة',
            exchange: 'طلب صرف',
            purchase: 'طلب شراء',
            transfer: 'طلب نقل',
            custody: 'طلب عهدة',
            expense: 'طلب مصروفات',
        };
        const typeName = typeNames[requestType] || 'طلب';

        return sendNotification({
            titleAr: 'طلب موافقة جديد',
            messageAr: `${typeName} من ${requesterName}: ${description}`,
            notificationType: 'Approval',
            entityType: requestType,
            entityId: requestId,
            actionUrl: '/approvals',
            priority: 'High',
            system: SYSTEMS.APPROVAL,
            localPriority: PRIORITY.HIGH,
            notificationKey: 'approval_pending',
        });
    }, [sendNotification]);

    const notifyApprovalResult = useCallback(async (requestId, requestType, approved, approverName, reason) => {
        const priority = approved ? 'Normal' : 'High';

        return sendNotification({
            titleAr: approved ? 'تمت الموافقة على طلبك' : 'تم رفض طلبك',
            messageAr: approved
                ? `${approverName} وافق على طلبك`
                : `${approverName} رفض طلبك${reason ? `: ${reason}` : ''}`,
            notificationType: approved ? 'Info' : 'Alert',
            entityType: requestType,
            entityId: requestId,
            actionUrl: '/workflows',
            priority,
            system: SYSTEMS.APPROVAL,
            localPriority: approved ? PRIORITY.MEDIUM : PRIORITY.HIGH,
            notificationKey: 'approval_result',
        });
    }, [sendNotification]);

    // ═══════════════════════════════════════════════════════════════
    // إشعارات النظام
    // ═══════════════════════════════════════════════════════════════

    const notifySystemAnnouncement = useCallback(async (title, message, priority = 'Normal') => {
        return sendNotification({
            titleAr: title,
            messageAr: message,
            notificationType: 'Info',
            priority,
            system: SYSTEMS.SYSTEM,
            localPriority: priority === 'High' ? PRIORITY.HIGH : PRIORITY.LOW,
            notificationKey: 'system_announcement',
            skipPreferenceCheck: priority === 'Urgent', // إشعارات النظام العاجلة تتجاوز التفضيلات
        });
    }, [sendNotification]);

    return {
        // Core
        sendNotification,
        ...systemNotifications,

        // Warehouse
        notifyWarehouseLowStock,
        notifyWarehouseExchangeRequest,
        notifyWarehouseCustody,

        // HR
        notifyHRLeaveRequest,
        notifyHRNewEmployee,
        notifyHRDocumentExpiry,
        notifyHREvaluation,
        notifyDeviceOffline,

        // Movement
        notifyMovementVehicleAssigned,
        notifyMovementTripStatus,
        notifyMovementMaintenance,

        // Archiving
        notifyArchivingDocumentUploaded,
        notifyArchivingDocumentShared,
        notifyArchivingFolderShared,

        // Sadad
        notifySadadPaymentReceived,
        notifySadadInvoiceCreated,
        notifySadadPaymentDue,

        // Approvals
        notifyApprovalPending,
        notifyApprovalResult,

        // System
        notifySystemAnnouncement,
    };
}

export default useNotifications;
