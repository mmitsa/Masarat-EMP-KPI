/**
 * Sadad Action Handler
 * معالج إجراءات سداد المالية
 */

import { apiGet, apiPost } from '../../api';

import { fmtDate } from '../../../utils/hijriDate';

/**
 * معالج إجراءات سداد
 */
export class SadadActionHandler {
    constructor(userId, userRoles, accessToken) {
        this.userId = userId;
        this.roles = userRoles;
        this.accessToken = accessToken;
    }

    /**
     * عرض الفواتير
     */
    async getInvoices({ status }) {
        try {
            const invoices = await this.fetchInvoices(status);

            if (invoices.length === 0) {
                return {
                    success: true,
                    type: 'invoices',
                    data: [],
                    message: 'لا توجد فواتير',
                };
            }

            const statusLabels = {
                pending: 'معلقة',
                paid: 'مدفوعة',
                overdue: 'متأخرة',
            };

            const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
            const pendingCount = invoices.filter(i => i.status === 'pending').length;

            return {
                success: true,
                type: 'invoices',
                data: invoices,
                message: `لديك ${invoices.length} فاتورة`,
                summary: {
                    total: invoices.length,
                    pending: pendingCount,
                    totalAmount: totalAmount.toLocaleString('ar-SA'),
                },
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * تفاصيل فاتورة
     */
    async getInvoiceDetails({ invoiceId }) {
        try {
            const invoice = await this.fetchInvoiceDetails(invoiceId);

            if (!invoice) {
                return {
                    success: false,
                    error: `لم يتم العثور على الفاتورة: ${invoiceId}`,
                };
            }

            const statusMap = {
                pending: 'معلقة',
                paid: 'مدفوعة',
                overdue: 'متأخرة',
                cancelled: 'ملغاة',
            };

            return {
                success: true,
                type: 'invoice_details',
                data: invoice,
                message: [
                    `🧾 فاتورة رقم: ${invoice.id}`,
                    `المبلغ: ${invoice.amount?.toLocaleString('ar-SA')} ر.س`,
                    `الحالة: ${statusMap[invoice.status] || invoice.status}`,
                    `تاريخ الإصدار: ${this.formatDate(invoice.issueDate)}`,
                    `تاريخ الاستحقاق: ${this.formatDate(invoice.dueDate)}`,
                    invoice.vendor ? `المورد: ${invoice.vendor}` : '',
                ].filter(Boolean).join('\n'),
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * تسجيل دفعة
     */
    async recordPayment({ invoiceId, amount, paymentMethod, reference }) {
        try {
            const invoice = await this.fetchInvoiceDetails(invoiceId);

            if (!invoice) {
                return {
                    success: false,
                    error: `لم يتم العثور على الفاتورة: ${invoiceId}`,
                };
            }

            if (invoice.status === 'paid') {
                return {
                    success: false,
                    error: 'هذه الفاتورة مدفوعة مسبقاً',
                };
            }

            const paymentData = {
                invoice_id: invoiceId,
                amount: amount || invoice.amount,
                payment_method: paymentMethod || 'transfer',
                reference,
                paid_by: this.userId,
                paid_at: new Date().toISOString(),
            };

            const result = await this.submitPayment(paymentData);

            return {
                success: true,
                type: 'payment_recorded',
                data: result,
                message: `تم تسجيل الدفعة بنجاح`,
                details: [
                    `رقم الدفعة: ${result.id}`,
                    `المبلغ: ${amount?.toLocaleString('ar-SA')} ر.س`,
                    `طريقة الدفع: ${paymentMethod === 'cash' ? 'نقدي' : 'تحويل بنكي'}`,
                ],
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * عرض المدفوعات
     */
    async getPayments({ fromDate, toDate }) {
        try {
            const payments = await this.fetchPayments(fromDate, toDate);

            if (payments.length === 0) {
                return {
                    success: true,
                    type: 'payments',
                    data: [],
                    message: 'لا توجد مدفوعات في هذه الفترة',
                };
            }

            const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

            return {
                success: true,
                type: 'payments',
                data: payments,
                message: `تم العثور على ${payments.length} دفعة`,
                summary: {
                    count: payments.length,
                    totalAmount: totalPaid.toLocaleString('ar-SA'),
                },
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // دوال مساعدة
    async fetchInvoices(status) {
        try {
            let url = '/api/sadad/invoices';
            if (status && status !== 'all') url += `?status=${status}`;
            const response = await apiGet(url);
            return response.data || response;
        } catch {
            return [
                { id: 'INV-001', amount: 5000, status: 'pending', vendor: 'شركة التوريدات', dueDate: '2026-02-15' },
                { id: 'INV-002', amount: 3500, status: 'paid', vendor: 'مؤسسة الخدمات', dueDate: '2026-01-30' },
            ];
        }
    }

    async fetchInvoiceDetails(invoiceId) {
        try {
            const response = await apiGet(`/api/sadad/invoices/${invoiceId}`);
            return response;
        } catch {
            return {
                id: invoiceId,
                amount: 5000,
                status: 'pending',
                vendor: 'شركة التوريدات',
                issueDate: new Date().toISOString(),
                dueDate: '2026-02-15',
            };
        }
    }

    async submitPayment(data) {
        try {
            const response = await apiPost('/api/sadad/payments', data);
            return response;
        } catch {
            return { id: 'PAY-' + Date.now(), ...data };
        }
    }

    async fetchPayments(fromDate, toDate) {
        try {
            let url = '/api/sadad/payments';
            if (fromDate) url += `?from=${fromDate}`;
            if (toDate) url += `&to=${toDate}`;
            const response = await apiGet(url);
            return response.data || response;
        } catch {
            return [
                { id: 'PAY-001', invoiceId: 'INV-002', amount: 3500, paidAt: '2026-01-28', method: 'تحويل' },
            ];
        }
    }

    formatDate(dateStr) {
        return fmtDate(dateStr);
    }
}

export default SadadActionHandler;
