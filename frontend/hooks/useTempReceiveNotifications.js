/**
 * Hook للتكامل بين خدمة الاستلام المؤقت وسياق الإشعارات
 * Integration hook between TempReceiveService and SystemNotificationContext
 */

import { useEffect, useCallback } from 'react';
import { useSystemNotifications } from '../context/SystemNotificationContext';
import { tempReceiveService, TEMP_RECEIVE_NOTIFICATION_TYPES } from '../lib/tempReceiveService';

/**
 * يستمع لأحداث خدمة الاستلام المؤقت ويرسل الإشعارات للسياق
 */
export function useTempReceiveNotifications() {
    const { notifyTempReceive, notifyReceiptNote } = useSystemNotifications();

    // معالج إنشاء استلام مؤقت جديد
    const handleTempReceiveCreated = useCallback((data) => {
        notifyTempReceive('created', {
            id: data.id,
            documentNumber: data.documentNumber,
            warehouseId: data.warehouseId,
            status: data.status,
            performer: data.createdBy,
        });
    }, [notifyTempReceive]);

    // معالج ترحيل الاستلام المؤقت
    const handleTempReceiveTransferred = useCallback((data) => {
        notifyTempReceive('transferred', {
            id: data.id,
            documentNumber: data.documentNumber,
            warehouseId: data.warehouseId,
            status: data.status,
            performer: data.transferredBy,
        });
    }, [notifyTempReceive]);

    // معالج اعتماد الاستلام المؤقت
    const handleTempReceiveApproved = useCallback((data) => {
        const { tempReceive, receiptNote } = data;

        notifyTempReceive('approved', {
            id: tempReceive.id,
            documentNumber: tempReceive.documentNumber,
            warehouseId: tempReceive.warehouseId,
            status: tempReceive.status,
            performer: tempReceive.approvedBy,
        });

        // إشعار بإنشاء مذكرة الاستلام
        if (receiptNote) {
            notifyReceiptNote('created', {
                id: receiptNote.id,
                documentNumber: receiptNote.documentNumber,
                tempReceiveId: tempReceive.id,
                warehouseId: receiptNote.warehouseId,
                performer: tempReceive.approvedBy,
            });
        }
    }, [notifyTempReceive, notifyReceiptNote]);

    // معالج رفض الاستلام المؤقت
    const handleTempReceiveRejected = useCallback((data) => {
        notifyTempReceive('rejected', {
            id: data.id,
            documentNumber: data.documentNumber,
            warehouseId: data.warehouseId,
            status: data.status,
            reason: data.rejectionReason,
            performer: data.rejectedBy,
        });
    }, [notifyTempReceive]);

    // معالج إلغاء الاستلام المؤقت
    const handleTempReceiveCancelled = useCallback((data) => {
        notifyTempReceive('cancelled', {
            id: data.id,
            documentNumber: data.documentNumber,
            warehouseId: data.warehouseId,
            status: data.status,
            performer: data.cancelledBy,
        });
    }, [notifyTempReceive]);

    // معالج إنشاء مذكرة الاستلام
    const handleReceiptNoteCreated = useCallback((data) => {
        notifyReceiptNote('created', {
            id: data.id,
            documentNumber: data.documentNumber,
            tempReceiveId: data.tempReceiveId,
            warehouseId: data.warehouseId,
        });
    }, [notifyReceiptNote]);

    // معالج اعتماد مذكرة الاستلام
    const handleReceiptNoteApproved = useCallback((data) => {
        notifyReceiptNote('approved', {
            id: data.id,
            documentNumber: data.documentNumber,
            tempReceiveId: data.tempReceiveId,
            warehouseId: data.warehouseId,
            performer: data.approvedBy,
        });

        // إشعار بإضافة الأصناف للمخزون
        if (data.inventoryMovements?.length > 0) {
            notifyReceiptNote('stock_added', {
                id: data.id,
                documentNumber: data.documentNumber,
                itemCount: data.inventoryMovements.length,
                warehouseId: data.warehouseId,
            });
        }
    }, [notifyReceiptNote]);

    // تسجيل المستمعين للأحداث
    useEffect(() => {
        // الاستلام المؤقت
        const unsubCreated = tempReceiveService.on('tempReceiveCreated', handleTempReceiveCreated);
        const unsubTransferred = tempReceiveService.on('tempReceiveTransferred', handleTempReceiveTransferred);
        const unsubApproved = tempReceiveService.on('tempReceiveApproved', handleTempReceiveApproved);
        const unsubRejected = tempReceiveService.on('tempReceiveRejected', handleTempReceiveRejected);
        const unsubCancelled = tempReceiveService.on('tempReceiveCancelled', handleTempReceiveCancelled);

        // مذكرات الاستلام
        const unsubNoteCreated = tempReceiveService.on('receiptNoteCreated', handleReceiptNoteCreated);
        const unsubNoteApproved = tempReceiveService.on('receiptNoteApproved', handleReceiptNoteApproved);

        // إلغاء التسجيل عند إزالة المكون
        return () => {
            unsubCreated();
            unsubTransferred();
            unsubApproved();
            unsubRejected();
            unsubCancelled();
            unsubNoteCreated();
            unsubNoteApproved();
        };
    }, [
        handleTempReceiveCreated,
        handleTempReceiveTransferred,
        handleTempReceiveApproved,
        handleTempReceiveRejected,
        handleTempReceiveCancelled,
        handleReceiptNoteCreated,
        handleReceiptNoteApproved,
    ]);

    return {
        // يمكن إضافة وظائف إضافية هنا إذا لزم الأمر
        isListening: true,
    };
}

export default useTempReceiveNotifications;
