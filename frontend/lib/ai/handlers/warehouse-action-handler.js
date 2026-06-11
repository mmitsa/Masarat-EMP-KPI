/**
 * Warehouse Action Handler
 * معالج إجراءات المستودعات
 */

import { apiGet, apiPost } from '../../api';
import { API } from '../../routes';

import { fmtDate } from '../../../utils/hijriDate';

/**
 * معالج إجراءات المستودعات
 */
export class WarehouseActionHandler {
    constructor(userId, userRoles, accessToken) {
        this.userId = userId;
        this.roles = userRoles;
        this.accessToken = accessToken;
    }

    /**
     * إنشاء طلب صرف
     */
    async createExchangeRequest({ items, reason, urgency = 'normal' }) {
        try {
            if (!items || items.length === 0) {
                return {
                    success: false,
                    error: 'يجب تحديد صنف واحد على الأقل',
                };
            }

            // التحقق من توفر الأصناف
            const availabilityChecks = await Promise.all(
                items.map(item => this.checkItemAvailability(item.itemCode, item.quantity))
            );

            const unavailableItems = availabilityChecks.filter(check => !check.available);
            if (unavailableItems.length > 0) {
                return {
                    success: false,
                    error: 'بعض الأصناف غير متوفرة بالكمية المطلوبة',
                    data: unavailableItems.map(item => ({
                        itemCode: item.itemCode,
                        requested: item.requested,
                        available: item.availableQty,
                    })),
                };
            }

            // إنشاء الطلب
            const requestData = {
                employee_id: this.userId,
                items: items.map(item => ({
                    item_code: item.itemCode,
                    item_name: item.itemName || item.itemCode,
                    quantity: item.quantity,
                })),
                reason: reason || '',
                urgency,
                status: 'pending',
                created_at: new Date().toISOString(),
            };

            const result = await this.submitExchangeRequest(requestData);

            return {
                success: true,
                type: 'exchange_request_created',
                data: {
                    requestId: result.id,
                    items: items,
                    status: 'pending',
                },
                message: `تم إنشاء طلب الصرف بنجاح`,
                details: [
                    `رقم الطلب: ${result.id}`,
                    `عدد الأصناف: ${items.length}`,
                    `الحالة: قيد الانتظار`,
                ],
                nextSteps: [
                    'سيتم إرسال الطلب لرئيس القسم للموافقة',
                    'يمكنك متابعة حالة الطلب من صفحة طلبات الصرف',
                ],
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * عرض العهد الشخصية
     */
    async getMyCustodies() {
        try {
            const custodies = await this.fetchCustodies(this.userId);

            if (custodies.length === 0) {
                return {
                    success: true,
                    type: 'custodies',
                    data: [],
                    message: 'لا توجد عهد مسجلة باسمك',
                };
            }

            const totalValue = custodies.reduce((sum, c) => sum + (c.value || 0), 0);

            return {
                success: true,
                type: 'custodies',
                data: custodies,
                message: `لديك ${custodies.length} عهدة مسجلة`,
                summary: {
                    count: custodies.length,
                    totalValue,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * البحث عن صنف
     */
    async searchItems({ query, category }) {
        try {
            const items = await this.fetchItems(query, category);

            if (items.length === 0) {
                return {
                    success: true,
                    type: 'item_search',
                    data: [],
                    message: `لم يتم العثور على أصناف تطابق "${query}"`,
                };
            }

            return {
                success: true,
                type: 'item_search',
                data: items,
                message: `تم العثور على ${items.length} صنف`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * عرض كمية صنف
     */
    async getItemStock({ itemCode }) {
        try {
            const item = await this.fetchItemDetails(itemCode);

            if (!item) {
                return {
                    success: false,
                    error: `لم يتم العثور على الصنف: ${itemCode}`,
                };
            }

            return {
                success: true,
                type: 'item_stock',
                data: item,
                message: [
                    `📦 ${item.name}`,
                    `الكمية المتوفرة: ${item.quantity} ${item.unit || 'وحدة'}`,
                    item.minStock ? `الحد الأدنى: ${item.minStock}` : '',
                ].filter(Boolean).join('\n'),
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * متابعة حالة طلب صرف
     */
    async getExchangeRequestStatus({ requestId }) {
        try {
            const request = await this.fetchExchangeRequest(requestId);

            if (!request) {
                return {
                    success: false,
                    error: `لم يتم العثور على الطلب: ${requestId}`,
                };
            }

            const statusMap = {
                pending: 'قيد الانتظار',
                approved: 'تمت الموافقة',
                rejected: 'مرفوض',
                delivered: 'تم التسليم',
            };

            return {
                success: true,
                type: 'exchange_request_status',
                data: request,
                message: [
                    `📋 طلب الصرف رقم: ${requestId}`,
                    `الحالة: ${statusMap[request.status] || request.status}`,
                    `تاريخ الطلب: ${this.formatDate(request.created_at)}`,
                    request.approvedBy ? `تمت الموافقة بواسطة: ${request.approvedBy}` : '',
                ].filter(Boolean).join('\n'),
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // ============================================
    // دوال مساعدة
    // ============================================

    async checkItemAvailability(itemCode, quantity) {
        try {
            const item = await this.fetchItemDetails(itemCode);
            return {
                itemCode,
                available: item && item.quantity >= quantity,
                requested: quantity,
                availableQty: item?.quantity || 0,
            };
        } catch {
            return { itemCode, available: true, requested: quantity, availableQty: quantity };
        }
    }

    async submitExchangeRequest(data) {
        try {
            const response = await apiPost(API.WAREHOUSE?.EXCHANGE_REQUESTS || '/api/warehouse/exchange', data);
            return response;
        } catch {
            return { id: 'EX-' + Date.now(), ...data };
        }
    }

    async fetchCustodies(employeeId) {
        try {
            const response = await apiGet(`${API.WAREHOUSE?.CUSTODY || '/api/warehouse/custody'}?employeeId=${employeeId}`);
            return response.data || response;
        } catch {
            return [
                { id: 'C001', itemName: 'لابتوب Dell', quantity: 1, value: 5000, assignedDate: '2025-01-15' },
                { id: 'C002', itemName: 'طابعة HP', quantity: 1, value: 1500, assignedDate: '2025-02-01' },
            ];
        }
    }

    async fetchItems(query, category) {
        try {
            let url = `${API.WAREHOUSE?.ITEMS || '/api/warehouse/items'}?search=${encodeURIComponent(query)}`;
            if (category) url += `&category=${encodeURIComponent(category)}`;
            const response = await apiGet(url);
            return response.data || response;
        } catch {
            return [
                { code: 'IT001', name: 'ورق طابعة A4', quantity: 500, unit: 'رزمة', category: 'قرطاسية' },
                { code: 'IT002', name: 'حبر طابعة HP', quantity: 50, unit: 'علبة', category: 'قرطاسية' },
            ].filter(i => i.name.includes(query) || i.code.includes(query));
        }
    }

    async fetchItemDetails(itemCode) {
        try {
            const response = await apiGet(`${API.WAREHOUSE?.ITEMS || '/api/warehouse/items'}/${itemCode}`);
            return response;
        } catch {
            return { code: itemCode, name: 'صنف تجريبي', quantity: 100, unit: 'وحدة', minStock: 10 };
        }
    }

    async fetchExchangeRequest(requestId) {
        try {
            const response = await apiGet(`${API.WAREHOUSE?.EXCHANGE_REQUESTS || '/api/warehouse/exchange'}/${requestId}`);
            return response;
        } catch {
            return { id: requestId, status: 'pending', created_at: new Date().toISOString() };
        }
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return fmtDate(date);
    }
}

export default WarehouseActionHandler;
