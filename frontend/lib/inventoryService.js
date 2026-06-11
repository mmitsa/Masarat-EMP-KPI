/**
 * خدمة إدارة المخزون وكروت الأصناف
 * Inventory Management Service - Item Cards & Movement Tracking
 *
 * يتضمن:
 * - كارت الصنف (Item Card)
 * - كارت حركة الصنف (Item Movement Card)
 * - إدارة الأرصدة والخصم والإضافة
 * - التكامل مع نظام الاعتمادات
 */

// ==================== أنواع حركات المخزون ====================
export const MOVEMENT_TYPES = {
    // حركات الإضافة
    INITIAL_BALANCE: 'initial_balance',         // رصيد افتتاحي
    PURCHASE_RECEIVE: 'purchase_receive',       // استلام مشتريات
    TRANSFER_IN: 'transfer_in',                 // نقل وارد
    RETURN_FROM_CUSTODY: 'return_from_custody', // استرداد عهدة
    RETURN_FROM_DEPT: 'return_from_dept',       // مرتجع من قسم
    ADJUSTMENT_ADD: 'adjustment_add',           // تسوية بالإضافة
    INVENTORY_COUNT_ADD: 'inventory_count_add', // جرد بالزيادة

    // حركات الخصم
    EXCHANGE_ISSUE: 'exchange_issue',           // صرف للأقسام
    CUSTODY_ISSUE: 'custody_issue',             // صرف عهدة
    TRANSFER_OUT: 'transfer_out',               // نقل صادر
    DISPOSAL: 'disposal',                       // إتلاف
    ADJUSTMENT_DEDUCT: 'adjustment_deduct',     // تسوية بالخصم
    INVENTORY_COUNT_DEDUCT: 'inventory_count_deduct', // جرد بالنقص
    DAMAGED: 'damaged',                         // تالف
};

// تصنيف الحركات حسب التأثير على الرصيد
export const MOVEMENT_EFFECT = {
    ADD: 'add',       // إضافة للرصيد
    DEDUCT: 'deduct', // خصم من الرصيد
    RESERVE: 'reserve', // حجز (لا يؤثر على الرصيد الفعلي)
    RELEASE: 'release', // إلغاء حجز
};

// ربط نوع الحركة بتأثيرها
export const MOVEMENT_TYPE_EFFECT = {
    [MOVEMENT_TYPES.INITIAL_BALANCE]: MOVEMENT_EFFECT.ADD,
    [MOVEMENT_TYPES.PURCHASE_RECEIVE]: MOVEMENT_EFFECT.ADD,
    [MOVEMENT_TYPES.TRANSFER_IN]: MOVEMENT_EFFECT.ADD,
    [MOVEMENT_TYPES.RETURN_FROM_CUSTODY]: MOVEMENT_EFFECT.ADD,
    [MOVEMENT_TYPES.RETURN_FROM_DEPT]: MOVEMENT_EFFECT.ADD,
    [MOVEMENT_TYPES.ADJUSTMENT_ADD]: MOVEMENT_EFFECT.ADD,
    [MOVEMENT_TYPES.INVENTORY_COUNT_ADD]: MOVEMENT_EFFECT.ADD,
    [MOVEMENT_TYPES.EXCHANGE_ISSUE]: MOVEMENT_EFFECT.DEDUCT,
    [MOVEMENT_TYPES.CUSTODY_ISSUE]: MOVEMENT_EFFECT.DEDUCT,
    [MOVEMENT_TYPES.TRANSFER_OUT]: MOVEMENT_EFFECT.DEDUCT,
    [MOVEMENT_TYPES.DISPOSAL]: MOVEMENT_EFFECT.DEDUCT,
    [MOVEMENT_TYPES.ADJUSTMENT_DEDUCT]: MOVEMENT_EFFECT.DEDUCT,
    [MOVEMENT_TYPES.INVENTORY_COUNT_DEDUCT]: MOVEMENT_EFFECT.DEDUCT,
    [MOVEMENT_TYPES.DAMAGED]: MOVEMENT_EFFECT.DEDUCT,
};

// ==================== حالات الحركة ====================
export const MOVEMENT_STATUS = {
    PENDING: 'pending',         // قيد الانتظار
    RESERVED: 'reserved',       // محجوز
    COMPLETED: 'completed',     // مكتمل
    CANCELLED: 'cancelled',     // ملغي
    REVERSED: 'reversed',       // معكوس
};

// ==================== أسماء الحركات بالعربي ====================
export const MOVEMENT_TYPE_NAMES = {
    [MOVEMENT_TYPES.INITIAL_BALANCE]: 'رصيد افتتاحي',
    [MOVEMENT_TYPES.PURCHASE_RECEIVE]: 'استلام مشتريات',
    [MOVEMENT_TYPES.TRANSFER_IN]: 'نقل وارد',
    [MOVEMENT_TYPES.RETURN_FROM_CUSTODY]: 'استرداد عهدة',
    [MOVEMENT_TYPES.RETURN_FROM_DEPT]: 'مرتجع من قسم',
    [MOVEMENT_TYPES.ADJUSTMENT_ADD]: 'تسوية بالإضافة',
    [MOVEMENT_TYPES.INVENTORY_COUNT_ADD]: 'جرد بالزيادة',
    [MOVEMENT_TYPES.EXCHANGE_ISSUE]: 'صرف للأقسام',
    [MOVEMENT_TYPES.CUSTODY_ISSUE]: 'صرف عهدة',
    [MOVEMENT_TYPES.TRANSFER_OUT]: 'نقل صادر',
    [MOVEMENT_TYPES.DISPOSAL]: 'إتلاف',
    [MOVEMENT_TYPES.ADJUSTMENT_DEDUCT]: 'تسوية بالخصم',
    [MOVEMENT_TYPES.INVENTORY_COUNT_DEDUCT]: 'جرد بالنقص',
    [MOVEMENT_TYPES.DAMAGED]: 'تالف',
};

// ==================== أنواع مستندات الاستلام ====================
// محضر الاستلام: يدخل فقط لمستودع الاستخدام المباشر
// مذكرة الاستلام: يدخل للمستودع المحدد حسب اختيار المستخدم
export const RECEIVING_DOCUMENT_TYPES = {
    RECEIVING_MINUTES: 'receiving_minutes',     // محضر استلام - مستودع الاستخدام المباشر فقط
    RECEIVING_NOTE: 'receiving_note',           // مذكرة استلام - المستودع المحدد
};

export const RECEIVING_DOCUMENT_TYPE_NAMES = {
    [RECEIVING_DOCUMENT_TYPES.RECEIVING_MINUTES]: 'محضر استلام',
    [RECEIVING_DOCUMENT_TYPES.RECEIVING_NOTE]: 'مذكرة استلام',
};

// ==================== مستودع الاستخدام المباشر ====================
// المستودع الأساسي الذي تدخل إليه جميع محاضر الاستلام
export const DIRECT_USE_WAREHOUSE = {
    id: 'WH-DIRECT-USE',
    code: 'WH-DU-001',
    name: 'مستودع الاستخدام المباشر',
    description: 'المستودع الأساسي لاستلام المشتريات المباشرة',
    isDefault: true,
    isDirectUse: true,
};

// ==================== API Client ====================
let api = null;
if (typeof window !== 'undefined') {
    import('./api').then(module => {
        api = module.default;
    }).catch(() => {
        console.warn('API client not available for inventory service');
    });
}

// ==================== خدمة إدارة المخزون ====================
export class InventoryService {
    constructor() {
        this.listeners = {};
    }

    // ==================== نظام الأحداث ====================
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        return () => {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        };
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    // ==================== كارت الصنف ====================

    /**
     * جلب كارت صنف كامل مع جميع الحركات
     * @param {String} itemId - معرف الصنف
     * @param {String} warehouseId - معرف المستودع (اختياري)
     */
    async getItemCard(itemId, warehouseId = null) {
        // محاولة جلب من API
        if (api?.warehouse?.items?.getCard) {
            try {
                const response = await api.warehouse.items.getCard(itemId, { warehouseId });
                if (response && !response.error) {
                    return response;
                }
            } catch (error) {
                console.warn('Failed to fetch item card from API:', error);
            }
        }

        // جلب من التخزين المحلي للتطوير
        return this.getItemCardLocal(itemId, warehouseId);
    }

    /**
     * جلب كارت الصنف من التخزين المحلي
     */
    getItemCardLocal(itemId, warehouseId = null) {
        const items = this.getStoredItems();
        const item = items.find(i => i.id === itemId);

        if (!item) {
            return null;
        }

        const movements = this.getItemMovements(itemId, warehouseId);
        const balance = this.calculateBalance(itemId, warehouseId);

        return {
            ...item,
            warehouseId,
            movements,
            currentBalance: balance.available,
            reservedQuantity: balance.reserved,
            totalBalance: balance.total,
            lastMovementDate: movements.length > 0
                ? movements[movements.length - 1].date
                : null,
            movementCount: movements.length,
        };
    }

    /**
     * جلب جميع حركات صنف
     * @param {String} itemId - معرف الصنف
     * @param {String} warehouseId - معرف المستودع
     * @param {Object} filters - فلاتر إضافية
     */
    async getItemMovements(itemId, warehouseId = null, filters = {}) {
        // محاولة جلب من API
        if (api?.warehouse?.items?.getMovements) {
            try {
                const response = await api.warehouse.items.getMovements(itemId, {
                    warehouseId,
                    ...filters
                });
                if (response && !response.error) {
                    return response;
                }
            } catch (error) {
                console.warn('Failed to fetch item movements from API:', error);
            }
        }

        // جلب من التخزين المحلي
        return this.getItemMovementsLocal(itemId, warehouseId, filters);
    }

    getItemMovementsLocal(itemId, warehouseId = null, filters = {}) {
        const allMovements = this.getStoredMovements();

        let movements = allMovements.filter(m => m.itemId === itemId);

        if (warehouseId) {
            movements = movements.filter(m => m.warehouseId === warehouseId);
        }

        if (filters.startDate) {
            movements = movements.filter(m => m.date >= filters.startDate);
        }

        if (filters.endDate) {
            movements = movements.filter(m => m.date <= filters.endDate);
        }

        if (filters.movementType) {
            movements = movements.filter(m => m.movementType === filters.movementType);
        }

        // ترتيب حسب التاريخ
        movements.sort((a, b) => new Date(a.date) - new Date(b.date));

        // حساب الرصيد التراكمي
        let runningBalance = 0;
        movements = movements.map(m => {
            const effect = MOVEMENT_TYPE_EFFECT[m.movementType];
            if (effect === MOVEMENT_EFFECT.ADD) {
                runningBalance += m.quantity;
            } else if (effect === MOVEMENT_EFFECT.DEDUCT) {
                runningBalance -= m.quantity;
            }
            return {
                ...m,
                runningBalance,
            };
        });

        return movements;
    }

    // ==================== إدارة الأرصدة ====================

    /**
     * حساب رصيد صنف في مستودع
     * @param {String} itemId - معرف الصنف
     * @param {String} warehouseId - معرف المستودع
     */
    calculateBalance(itemId, warehouseId = null) {
        const movements = this.getItemMovementsLocal(itemId, warehouseId);

        let totalIn = 0;
        let totalOut = 0;
        let reserved = 0;

        movements.forEach(m => {
            const effect = MOVEMENT_TYPE_EFFECT[m.movementType];

            if (m.status === MOVEMENT_STATUS.RESERVED) {
                reserved += m.quantity;
            } else if (m.status === MOVEMENT_STATUS.COMPLETED) {
                if (effect === MOVEMENT_EFFECT.ADD) {
                    totalIn += m.quantity;
                } else if (effect === MOVEMENT_EFFECT.DEDUCT) {
                    totalOut += m.quantity;
                }
            }
        });

        const total = totalIn - totalOut;
        const available = total - reserved;

        return {
            total,
            available,
            reserved,
            totalIn,
            totalOut,
        };
    }

    /**
     * التحقق من توفر الكمية للصرف
     * @param {String} itemId - معرف الصنف
     * @param {String} warehouseId - معرف المستودع
     * @param {Number} quantity - الكمية المطلوبة
     */
    async checkAvailability(itemId, warehouseId, quantity) {
        const balance = this.calculateBalance(itemId, warehouseId);

        return {
            isAvailable: balance.available >= quantity,
            requested: quantity,
            available: balance.available,
            shortage: quantity > balance.available ? quantity - balance.available : 0,
            reserved: balance.reserved,
            total: balance.total,
        };
    }

    // ==================== تسجيل الحركات ====================

    /**
     * تسجيل حركة جديدة على صنف
     * @param {Object} movement - بيانات الحركة
     */
    async recordMovement(movement) {
        const movementData = {
            id: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...movement,
            date: movement.date || new Date().toISOString(),
            createdAt: new Date().toISOString(),
            status: movement.status || MOVEMENT_STATUS.COMPLETED,
        };

        // محاولة التسجيل عبر API
        if (api?.warehouse?.items?.recordMovement) {
            try {
                const response = await api.warehouse.items.recordMovement(movementData);
                if (response && !response.error) {
                    this.emit('movementRecorded', response);
                    return response;
                }
            } catch (error) {
                console.warn('Failed to record movement via API:', error);
            }
        }

        // تسجيل محلياً
        return this.recordMovementLocal(movementData);
    }

    recordMovementLocal(movement) {
        const movements = this.getStoredMovements();
        movements.push(movement);
        this.storeMovements(movements);

        // تحديث رصيد الصنف
        this.updateItemBalance(movement.itemId, movement.warehouseId);

        this.emit('movementRecorded', movement);
        return movement;
    }

    /**
     * تسجيل حركة صرف (خصم من الرصيد)
     * @param {Object} params - بيانات الصرف
     */
    async recordIssue(params) {
        const {
            itemId,
            itemCode,
            itemName,
            warehouseId,
            warehouseName,
            quantity,
            unitPrice,
            documentNumber,
            documentType,
            departmentId,
            departmentName,
            employeeId,
            employeeName,
            isCustody,
            notes,
            approvedBy,
        } = params;

        // التحقق من توفر الكمية
        const availability = await this.checkAvailability(itemId, warehouseId, quantity);
        if (!availability.isAvailable) {
            throw new Error(`الكمية المتاحة (${availability.available}) أقل من المطلوبة (${quantity})`);
        }

        const movement = {
            itemId,
            itemCode,
            itemName,
            warehouseId,
            warehouseName,
            movementType: isCustody ? MOVEMENT_TYPES.CUSTODY_ISSUE : MOVEMENT_TYPES.EXCHANGE_ISSUE,
            quantity,
            unitPrice,
            totalValue: quantity * unitPrice,
            documentNumber,
            documentType: documentType || 'exchange_request',
            departmentId,
            departmentName,
            employeeId,
            employeeName,
            notes,
            approvedBy,
            status: MOVEMENT_STATUS.COMPLETED,
        };

        const result = await this.recordMovement(movement);

        this.emit('itemIssued', {
            movement: result,
            newBalance: this.calculateBalance(itemId, warehouseId),
        });

        return result;
    }

    /**
     * تسجيل حركة استلام (إضافة للرصيد)
     * @param {Object} params - بيانات الاستلام
     */
    async recordReceipt(params) {
        const {
            itemId,
            itemCode,
            itemName,
            warehouseId,
            warehouseName,
            quantity,
            unitPrice,
            documentNumber,
            documentType,
            supplierId,
            supplierName,
            purchaseOrderNumber,
            notes,
            receivedBy,
        } = params;

        const movement = {
            itemId,
            itemCode,
            itemName,
            warehouseId,
            warehouseName,
            movementType: MOVEMENT_TYPES.PURCHASE_RECEIVE,
            quantity,
            unitPrice,
            totalValue: quantity * unitPrice,
            documentNumber,
            documentType: documentType || 'receiving_note',
            supplierId,
            supplierName,
            purchaseOrderNumber,
            notes,
            receivedBy,
            status: MOVEMENT_STATUS.COMPLETED,
        };

        const result = await this.recordMovement(movement);

        this.emit('itemReceived', {
            movement: result,
            newBalance: this.calculateBalance(itemId, warehouseId),
        });

        return result;
    }

    /**
     * تسجيل حركة نقل
     * @param {Object} params - بيانات النقل
     */
    async recordTransfer(params) {
        const {
            itemId,
            itemCode,
            itemName,
            quantity,
            unitPrice,
            fromWarehouseId,
            fromWarehouseName,
            toWarehouseId,
            toWarehouseName,
            documentNumber,
            notes,
            transferredBy,
        } = params;

        // التحقق من توفر الكمية في المستودع المصدر
        const availability = await this.checkAvailability(itemId, fromWarehouseId, quantity);
        if (!availability.isAvailable) {
            throw new Error(`الكمية المتاحة في ${fromWarehouseName} (${availability.available}) أقل من المطلوبة (${quantity})`);
        }

        // تسجيل حركة الخصم من المستودع المصدر
        const outMovement = await this.recordMovement({
            itemId,
            itemCode,
            itemName,
            warehouseId: fromWarehouseId,
            warehouseName: fromWarehouseName,
            movementType: MOVEMENT_TYPES.TRANSFER_OUT,
            quantity,
            unitPrice,
            totalValue: quantity * unitPrice,
            documentNumber,
            documentType: 'transfer',
            toWarehouseId,
            toWarehouseName,
            notes,
            transferredBy,
            status: MOVEMENT_STATUS.COMPLETED,
        });

        // تسجيل حركة الإضافة للمستودع الهدف
        const inMovement = await this.recordMovement({
            itemId,
            itemCode,
            itemName,
            warehouseId: toWarehouseId,
            warehouseName: toWarehouseName,
            movementType: MOVEMENT_TYPES.TRANSFER_IN,
            quantity,
            unitPrice,
            totalValue: quantity * unitPrice,
            documentNumber,
            documentType: 'transfer',
            fromWarehouseId,
            fromWarehouseName,
            notes,
            transferredBy,
            relatedMovementId: outMovement.id,
            status: MOVEMENT_STATUS.COMPLETED,
        });

        this.emit('itemTransferred', {
            outMovement,
            inMovement,
            fromBalance: this.calculateBalance(itemId, fromWarehouseId),
            toBalance: this.calculateBalance(itemId, toWarehouseId),
        });

        return { outMovement, inMovement };
    }

    /**
     * حجز كمية (للطلبات المعلقة)
     * @param {Object} params - بيانات الحجز
     */
    async reserveQuantity(params) {
        const {
            itemId,
            itemCode,
            itemName,
            warehouseId,
            warehouseName,
            quantity,
            unitPrice,
            documentNumber,
            documentType,
            expiresAt,
            notes,
        } = params;

        // التحقق من توفر الكمية
        const availability = await this.checkAvailability(itemId, warehouseId, quantity);
        if (!availability.isAvailable) {
            throw new Error(`الكمية المتاحة (${availability.available}) أقل من المطلوبة للحجز (${quantity})`);
        }

        const movement = {
            itemId,
            itemCode,
            itemName,
            warehouseId,
            warehouseName,
            movementType: MOVEMENT_TYPES.EXCHANGE_ISSUE,
            quantity,
            unitPrice,
            totalValue: quantity * unitPrice,
            documentNumber,
            documentType,
            notes,
            expiresAt,
            status: MOVEMENT_STATUS.RESERVED, // محجوز فقط
        };

        const result = await this.recordMovement(movement);

        this.emit('quantityReserved', {
            movement: result,
            newBalance: this.calculateBalance(itemId, warehouseId),
        });

        return result;
    }

    /**
     * تأكيد الحجز (تحويل من محجوز إلى مصروف)
     * @param {String} movementId - معرف حركة الحجز
     */
    async confirmReservation(movementId) {
        const movements = this.getStoredMovements();
        const index = movements.findIndex(m => m.id === movementId);

        if (index === -1) {
            throw new Error('حركة الحجز غير موجودة');
        }

        const movement = movements[index];
        if (movement.status !== MOVEMENT_STATUS.RESERVED) {
            throw new Error('هذه الحركة ليست محجوزة');
        }

        movements[index] = {
            ...movement,
            status: MOVEMENT_STATUS.COMPLETED,
            confirmedAt: new Date().toISOString(),
        };

        this.storeMovements(movements);

        this.emit('reservationConfirmed', {
            movement: movements[index],
            newBalance: this.calculateBalance(movement.itemId, movement.warehouseId),
        });

        return movements[index];
    }

    /**
     * إلغاء الحجز
     * @param {String} movementId - معرف حركة الحجز
     */
    async cancelReservation(movementId) {
        const movements = this.getStoredMovements();
        const index = movements.findIndex(m => m.id === movementId);

        if (index === -1) {
            throw new Error('حركة الحجز غير موجودة');
        }

        const movement = movements[index];
        if (movement.status !== MOVEMENT_STATUS.RESERVED) {
            throw new Error('هذه الحركة ليست محجوزة');
        }

        movements[index] = {
            ...movement,
            status: MOVEMENT_STATUS.CANCELLED,
            cancelledAt: new Date().toISOString(),
        };

        this.storeMovements(movements);

        this.emit('reservationCancelled', {
            movement: movements[index],
            newBalance: this.calculateBalance(movement.itemId, movement.warehouseId),
        });

        return movements[index];
    }

    // ==================== التكامل مع نظام الاعتمادات ====================

    /**
     * معالجة اعتماد مراقب المخزون - خصم الرصيد
     * @param {Object} request - طلب الصرف المعتمد
     * @param {Object} approver - المعتمد
     */
    async processInventoryControllerApproval(request, approver) {
        const results = [];
        const errors = [];

        for (const item of request.items) {
            try {
                // التحقق من توفر الكمية
                const availability = await this.checkAvailability(
                    item.itemId,
                    request.warehouseId,
                    item.quantity
                );

                if (!availability.isAvailable) {
                    errors.push({
                        itemId: item.itemId,
                        itemName: item.itemName,
                        error: `الكمية المتاحة (${availability.available}) أقل من المطلوبة (${item.quantity})`,
                    });
                    continue;
                }

                // تسجيل حركة الصرف
                const movement = await this.recordIssue({
                    itemId: item.itemId,
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    warehouseId: request.warehouseId,
                    warehouseName: request.warehouseName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    documentNumber: request.requestNumber || request.id,
                    documentType: 'exchange_request',
                    departmentId: request.departmentId,
                    departmentName: request.departmentName,
                    employeeId: request.employeeId,
                    employeeName: request.employeeName,
                    isCustody: item.isCustody,
                    notes: `صرف بموجب طلب رقم ${request.requestNumber || request.id}`,
                    approvedBy: {
                        id: approver.id,
                        name: approver.name,
                        position: 'مراقب المخزون',
                        date: new Date().toISOString(),
                    },
                });

                results.push({
                    itemId: item.itemId,
                    itemName: item.itemName,
                    movement,
                    newBalance: this.calculateBalance(item.itemId, request.warehouseId),
                });
            } catch (error) {
                errors.push({
                    itemId: item.itemId,
                    itemName: item.itemName,
                    error: error.message,
                });
            }
        }

        const result = {
            success: errors.length === 0,
            requestId: request.id,
            requestNumber: request.requestNumber,
            processedItems: results,
            errors,
            processedAt: new Date().toISOString(),
            processedBy: approver,
        };

        this.emit('exchangeProcessed', result);

        return result;
    }

    /**
     * معالجة استلام مشتريات - إضافة للرصيد
     * يدعم نوعين من المستندات:
     * - محضر استلام (receiving_minutes): يدخل فقط لمستودع الاستخدام المباشر
     * - مذكرة استلام (receiving_note): يدخل للمستودع المحدد
     *
     * @param {Object} receivingNote - مذكرة/محضر الاستلام
     * @param {Object} receiver - المستلم
     */
    async processReceivingNote(receivingNote, receiver) {
        const results = [];
        const errors = [];

        // تحديد نوع المستند (محضر أو مذكرة)
        const isReceivingMinutes = receivingNote.isReceivingMinutes ||
                                   receivingNote.documentType === 'receiving_minutes' ||
                                   receivingNote.documentNumber?.startsWith('RM-');

        const documentTypeName = isReceivingMinutes ? 'محضر استلام' : 'مذكرة استلام';
        const documentTypeCode = isReceivingMinutes ? 'receiving_minutes' : 'receiving_note';

        for (const item of receivingNote.items) {
            try {
                const movement = await this.recordReceipt({
                    itemId: item.itemId,
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    warehouseId: receivingNote.warehouseId,
                    warehouseName: receivingNote.warehouseName,
                    isDirectUseWarehouse: receivingNote.isDirectUseWarehouse || false,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    documentNumber: receivingNote.documentNumber,
                    documentType: documentTypeCode,
                    documentTypeName,
                    isReceivingMinutes,
                    supplierId: receivingNote.supplierId,
                    supplierName: receivingNote.supplierName,
                    purchaseOrderNumber: receivingNote.purchaseOrderNumber,
                    notes: item.notes || `استلام بموجب ${documentTypeName} رقم ${receivingNote.documentNumber}`,
                    receivedBy: {
                        id: receiver.id,
                        name: receiver.name,
                        date: new Date().toISOString(),
                    },
                });

                results.push({
                    itemId: item.itemId,
                    itemName: item.itemName,
                    movement,
                    newBalance: this.calculateBalance(item.itemId, receivingNote.warehouseId),
                });
            } catch (error) {
                errors.push({
                    itemId: item.itemId,
                    itemName: item.itemName,
                    error: error.message,
                });
            }
        }

        const result = {
            success: errors.length === 0,
            documentNumber: receivingNote.documentNumber,
            documentType: documentTypeCode,
            documentTypeName,
            isReceivingMinutes,
            warehouseId: receivingNote.warehouseId,
            warehouseName: receivingNote.warehouseName,
            isDirectUseWarehouse: receivingNote.isDirectUseWarehouse,
            processedItems: results,
            errors,
            processedAt: new Date().toISOString(),
            processedBy: receiver,
        };

        this.emit('receivingProcessed', result);

        return result;
    }

    // ==================== تحديث الأرصدة ====================

    updateItemBalance(itemId, warehouseId) {
        const balance = this.calculateBalance(itemId, warehouseId);

        // تحديث في بيانات الصنف
        const items = this.getStoredItems();
        const itemIndex = items.findIndex(i => i.id === itemId);

        if (itemIndex !== -1) {
            if (!items[itemIndex].balances) {
                items[itemIndex].balances = {};
            }
            items[itemIndex].balances[warehouseId] = balance;
            items[itemIndex].lastBalanceUpdate = new Date().toISOString();
            this.storeItems(items);
        }

        this.emit('balanceUpdated', { itemId, warehouseId, balance });
    }

    // ==================== التخزين المحلي ====================

    getStoredItems() {
        if (typeof window === 'undefined') return [];
        try {
            return JSON.parse(localStorage.getItem('inventoryItems') || '[]');
        } catch {
            return [];
        }
    }

    storeItems(items) {
        if (typeof window === 'undefined') return;
        localStorage.setItem('inventoryItems', JSON.stringify(items));
    }

    getStoredMovements() {
        if (typeof window === 'undefined') return [];
        try {
            return JSON.parse(localStorage.getItem('inventoryMovements') || '[]');
        } catch {
            return [];
        }
    }

    storeMovements(movements) {
        if (typeof window === 'undefined') return;
        localStorage.setItem('inventoryMovements', JSON.stringify(movements));
    }

    // ==================== التقارير ====================

    /**
     * تقرير كارت الصنف المفصل
     */
    async generateItemCardReport(itemId, warehouseId, options = {}) {
        const card = await this.getItemCard(itemId, warehouseId);

        if (!card) {
            return null;
        }

        return {
            reportType: 'item_card',
            generatedAt: new Date().toISOString(),
            item: {
                id: card.id,
                code: card.code,
                name: card.name,
                unit: card.unit,
                category: card.category,
            },
            warehouse: {
                id: warehouseId,
                name: card.warehouseName,
            },
            balance: {
                current: card.currentBalance,
                reserved: card.reservedQuantity,
                total: card.totalBalance,
            },
            movements: card.movements,
            summary: {
                movementCount: card.movementCount,
                lastMovement: card.lastMovementDate,
            },
        };
    }

    /**
     * تقرير حركات المخزون
     */
    async generateMovementReport(warehouseId, startDate, endDate, options = {}) {
        const movements = this.getStoredMovements().filter(m => {
            if (warehouseId && m.warehouseId !== warehouseId) return false;
            if (startDate && m.date < startDate) return false;
            if (endDate && m.date > endDate) return false;
            return true;
        });

        const summary = {
            totalIn: 0,
            totalOut: 0,
            valueIn: 0,
            valueOut: 0,
            byType: {},
        };

        movements.forEach(m => {
            const effect = MOVEMENT_TYPE_EFFECT[m.movementType];

            if (!summary.byType[m.movementType]) {
                summary.byType[m.movementType] = {
                    count: 0,
                    quantity: 0,
                    value: 0,
                };
            }

            summary.byType[m.movementType].count++;
            summary.byType[m.movementType].quantity += m.quantity;
            summary.byType[m.movementType].value += m.totalValue || 0;

            if (effect === MOVEMENT_EFFECT.ADD) {
                summary.totalIn += m.quantity;
                summary.valueIn += m.totalValue || 0;
            } else if (effect === MOVEMENT_EFFECT.DEDUCT) {
                summary.totalOut += m.quantity;
                summary.valueOut += m.totalValue || 0;
            }
        });

        return {
            reportType: 'movement_report',
            generatedAt: new Date().toISOString(),
            period: { startDate, endDate },
            warehouseId,
            movements,
            summary,
        };
    }
}

// ==================== Singleton Instance ====================
export const inventoryService = new InventoryService();

// ==================== Helper Functions ====================

/**
 * الحصول على لون حالة الحركة
 */
export function getMovementStatusColor(status) {
    const colors = {
        [MOVEMENT_STATUS.PENDING]: 'yellow',
        [MOVEMENT_STATUS.RESERVED]: 'blue',
        [MOVEMENT_STATUS.COMPLETED]: 'green',
        [MOVEMENT_STATUS.CANCELLED]: 'gray',
        [MOVEMENT_STATUS.REVERSED]: 'red',
    };
    return colors[status] || 'gray';
}

/**
 * الحصول على لون نوع الحركة
 */
export function getMovementTypeColor(movementType) {
    const effect = MOVEMENT_TYPE_EFFECT[movementType];
    if (effect === MOVEMENT_EFFECT.ADD) return 'green';
    if (effect === MOVEMENT_EFFECT.DEDUCT) return 'red';
    return 'gray';
}

/**
 * الحصول على أيقونة نوع الحركة
 */
export function getMovementTypeIcon(movementType) {
    const effect = MOVEMENT_TYPE_EFFECT[movementType];
    if (effect === MOVEMENT_EFFECT.ADD) return '📥';
    if (effect === MOVEMENT_EFFECT.DEDUCT) return '📤';
    return '🔄';
}

export default inventoryService;
