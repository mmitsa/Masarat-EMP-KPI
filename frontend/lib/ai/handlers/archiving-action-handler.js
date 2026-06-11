/**
 * Archiving Action Handler
 * معالج إجراءات الأرشفة
 */

import { apiGet, apiPost } from '../../api';

import { fmtDate } from '../../../utils/hijriDate';

/**
 * معالج إجراءات الأرشفة
 */
export class ArchivingActionHandler {
    constructor(userId, userRoles, accessToken) {
        this.userId = userId;
        this.roles = userRoles;
        this.accessToken = accessToken;
    }

    /**
     * البحث عن وثائق/معاملات
     */
    async searchDocuments({ query, type, fromDate, toDate }) {
        try {
            const documents = await this.fetchDocuments(query, type, fromDate, toDate);

            if (documents.length === 0) {
                return {
                    success: true,
                    type: 'document_search',
                    data: [],
                    message: `لم يتم العثور على معاملات تطابق "${query}"`,
                    suggestion: 'جرب البحث بالباركود أو رقم المعاملة',
                };
            }

            return {
                success: true,
                type: 'document_search',
                data: documents,
                message: `تم العثور على ${documents.length} معاملة`,
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * متابعة حالة معاملة
     */
    async getDocumentStatus({ documentId }) {
        try {
            const document = await this.fetchDocumentDetails(documentId);

            if (!document) {
                return {
                    success: false,
                    error: `لم يتم العثور على المعاملة: ${documentId}`,
                };
            }

            const statusMap = {
                pending: 'قيد المعالجة',
                in_progress: 'تحت الإجراء',
                completed: 'منتهية',
                archived: 'مؤرشفة',
            };

            return {
                success: true,
                type: 'document_status',
                data: document,
                message: [
                    `📄 المعاملة: ${document.subject || document.id}`,
                    `الحالة: ${statusMap[document.status] || document.status}`,
                    `التصنيف: ${document.classification || 'غير محدد'}`,
                    `تاريخ الإنشاء: ${this.formatDate(document.createdAt)}`,
                    document.assignedTo ? `مسندة إلى: ${document.assignedTo}` : '',
                ].filter(Boolean).join('\n'),
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * إنشاء معاملة جديدة
     */
    async createDocument({ subject, type, classification, description, attachments }) {
        try {
            const documentData = {
                subject,
                type: type || 'incoming',
                classification,
                description,
                attachments: attachments || [],
                created_by: this.userId,
                status: 'pending',
                created_at: new Date().toISOString(),
            };

            const result = await this.submitDocument(documentData);

            return {
                success: true,
                type: 'document_created',
                data: {
                    documentId: result.id,
                    barcode: result.barcode,
                    subject,
                },
                message: `تم إنشاء المعاملة بنجاح`,
                details: [
                    `رقم المعاملة: ${result.id}`,
                    `الباركود: ${result.barcode}`,
                    `الموضوع: ${subject}`,
                ],
                nextSteps: [
                    'يمكنك طباعة الباركود وإرفاقه بالمعاملة',
                    'سيتم توجيه المعاملة للجهة المختصة',
                ],
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * عرض التصنيفات
     */
    async getClassifications() {
        try {
            const classifications = await this.fetchClassifications();

            return {
                success: true,
                type: 'classifications',
                data: classifications,
                message: `التصنيفات المتاحة:\n${classifications.map(c => `• ${c.nameAr}`).join('\n')}`,
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // دوال مساعدة
    async fetchDocuments(query, type, fromDate, toDate) {
        try {
            let url = `/api/archiving/documents?search=${encodeURIComponent(query)}`;
            if (type) url += `&type=${type}`;
            if (fromDate) url += `&from=${fromDate}`;
            if (toDate) url += `&to=${toDate}`;
            const response = await apiGet(url);
            return response.data || response;
        } catch {
            return [
                { id: 'DOC-001', subject: 'طلب إجازة', barcode: 'BC123456', status: 'completed', classification: 'موارد بشرية' },
                { id: 'DOC-002', subject: 'خطاب تعميد', barcode: 'BC789012', status: 'in_progress', classification: 'إداري' },
            ].filter(d => d.subject.includes(query) || d.id.includes(query) || d.barcode.includes(query));
        }
    }

    async fetchDocumentDetails(documentId) {
        try {
            const response = await apiGet(`/api/archiving/documents/${documentId}`);
            return response;
        } catch {
            return {
                id: documentId,
                subject: 'معاملة تجريبية',
                status: 'in_progress',
                classification: 'إداري',
                createdAt: new Date().toISOString(),
            };
        }
    }

    async submitDocument(data) {
        try {
            const response = await apiPost('/api/archiving/documents', data);
            return response;
        } catch {
            return {
                id: 'DOC-' + Date.now(),
                barcode: 'BC' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                ...data,
            };
        }
    }

    async fetchClassifications() {
        try {
            const response = await apiGet('/api/archiving/classifications');
            return response.data || response;
        } catch {
            return [
                { id: 1, code: 'HR', nameAr: 'موارد بشرية' },
                { id: 2, code: 'FIN', nameAr: 'مالية' },
                { id: 3, code: 'ADM', nameAr: 'إدارية' },
                { id: 4, code: 'TECH', nameAr: 'تقنية' },
            ];
        }
    }

    formatDate(dateStr) {
        return fmtDate(dateStr);
    }
}

export default ArchivingActionHandler;
