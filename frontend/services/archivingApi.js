/**
 * Archiving API Service - نظام الأرشفة الإلكترونية
 * جميع دوال الاتصال بـ API الأرشفة
 *
 * @version 1.0.0
 * @date 2026-02-14
 */

import { apiMethods } from '../lib/apiClient';

const BASE_PATH = '/archiving';

export const archivingApi = {
  // ========== Dashboard & Statistics ==========

  /**
   * الحصول على إحصائيات لوحة التحكم
   * @returns {Promise<Object>} إحصائيات المستندات والخزائن
   */
  getDashboardStats: () => apiMethods.get(`${BASE_PATH}/dashboard/stats`),

  /**
   * الحصول على آخر المستندات المضافة
   * @param {number} limit - عدد المستندات (افتراضي: 10)
   * @returns {Promise<Array>} قائمة المستندات الأخيرة
   */
  getRecentDocuments: (limit = 10) =>
    apiMethods.get(`${BASE_PATH}/documents/recent`, { params: { limit } }),

  /**
   * الحصول على الخزائن الأكثر استخداماً
   * @param {number} limit - عدد الخزائن (افتراضي: 5)
   * @returns {Promise<Array>} قائمة الخزائن
   */
  getTopCabinets: (limit = 5) =>
    apiMethods.get(`${BASE_PATH}/cabinets/top-used`, { params: { limit } }),

  // ========== Documents Management ==========

  /**
   * الحصول على قائمة المستندات
   * @param {Object} params - معاملات البحث والفلترة
   * @returns {Promise<Object>} قائمة المستندات مع Pagination
   */
  getDocuments: (params = {}) =>
    apiMethods.get(`${BASE_PATH}/documents`, { params }),

  /**
   * الحصول على تفاصيل مستند
   * @param {string|number} id - معرف المستند
   * @returns {Promise<Object>} بيانات المستند
   */
  getDocument: (id) =>
    apiMethods.get(`${BASE_PATH}/documents/${id}`),

  /**
   * إنشاء مستند جديد
   * @param {FormData} formData - بيانات المستند والملف
   * @returns {Promise<Object>} المستند المنشأ
   */
  createDocument: (formData) =>
    apiMethods.post(`${BASE_PATH}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  /**
   * تحديث بيانات مستند
   * @param {string|number} id - معرف المستند
   * @param {Object} data - البيانات المحدثة
   * @returns {Promise<Object>} المستند المحدث
   */
  updateDocument: (id, data) =>
    apiMethods.put(`${BASE_PATH}/documents/${id}`, data),

  /**
   * حذف مستند
   * @param {string|number} id - معرف المستند
   * @returns {Promise<void>}
   */
  deleteDocument: (id) =>
    apiMethods.delete(`${BASE_PATH}/documents/${id}`),

  /**
   * أرشفة مستند
   * @param {string|number} id - معرف المستند
   * @returns {Promise<Object>} المستند المؤرشف
   */
  archiveDocument: (id) =>
    apiMethods.post(`${BASE_PATH}/documents/${id}/archive`),

  /**
   * استعادة مستند من الأرشيف
   * @param {string|number} id - معرف المستند
   * @returns {Promise<Object>} المستند المستعاد
   */
  unarchiveDocument: (id) =>
    apiMethods.post(`${BASE_PATH}/documents/${id}/unarchive`),

  /**
   * تحميل ملف المستند
   * @param {string|number} id - معرف المستند
   * @returns {Promise<Blob>} الملف
   */
  downloadDocument: (id) =>
    apiMethods.get(`${BASE_PATH}/documents/${id}/download`, {
      responseType: 'blob'
    }),

  /**
   * الحصول على رابط معاينة المستند
   * @param {string|number} id - معرف المستند
   * @returns {string} رابط المعاينة
   */
  getDocumentPreviewUrl: (id) =>
    `${process.env.NEXT_PUBLIC_GATEWAY_URL}${BASE_PATH}/documents/${id}/preview`,

  // ========== Cabinets Management ==========

  /**
   * الحصول على قائمة الخزائن
   * @param {Object} params - معاملات البحث
   * @returns {Promise<Array>} قائمة الخزائن
   */
  getCabinets: (params = {}) =>
    apiMethods.get(`${BASE_PATH}/cabinets`, { params }),

  /**
   * الحصول على شجرة الخزائن (Hierarchical)
   * @returns {Promise<Array>} شجرة الخزائن
   */
  getCabinetsTree: () =>
    apiMethods.get(`${BASE_PATH}/cabinets/tree`),

  /**
   * الحصول على تفاصيل خزينة
   * @param {string|number} id - معرف الخزينة
   * @returns {Promise<Object>} بيانات الخزينة
   */
  getCabinet: (id) =>
    apiMethods.get(`${BASE_PATH}/cabinets/${id}`),

  /**
   * إنشاء خزينة جديدة
   * @param {Object} data - بيانات الخزينة
   * @returns {Promise<Object>} الخزينة المنشأة
   */
  createCabinet: (data) =>
    apiMethods.post(`${BASE_PATH}/cabinets`, data),

  /**
   * تحديث بيانات خزينة
   * @param {string|number} id - معرف الخزينة
   * @param {Object} data - البيانات المحدثة
   * @returns {Promise<Object>} الخزينة المحدثة
   */
  updateCabinet: (id, data) =>
    apiMethods.put(`${BASE_PATH}/cabinets/${id}`, data),

  /**
   * حذف خزينة
   * @param {string|number} id - معرف الخزينة
   * @returns {Promise<void>}
   */
  deleteCabinet: (id) =>
    apiMethods.delete(`${BASE_PATH}/cabinets/${id}`),

  /**
   * الحصول على المستندات داخل خزينة
   * @param {string|number} cabinetId - معرف الخزينة
   * @param {Object} params - معاملات البحث
   * @returns {Promise<Object>} قائمة المستندات
   */
  getCabinetDocuments: (cabinetId, params = {}) =>
    apiMethods.get(`${BASE_PATH}/cabinets/${cabinetId}/documents`, { params }),

  // ========== Classifications Management ==========

  /**
   * الحصول على قائمة التصنيفات
   * @returns {Promise<Array>} قائمة التصنيفات
   */
  getClassifications: () =>
    apiMethods.get(`${BASE_PATH}/classifications`),

  /**
   * الحصول على شجرة التصنيفات
   * @returns {Promise<Array>} شجرة التصنيفات
   */
  getClassificationsTree: () =>
    apiMethods.get(`${BASE_PATH}/classifications/tree`),

  /**
   * الحصول على تفاصيل تصنيف
   * @param {string|number} id - معرف التصنيف
   * @returns {Promise<Object>} بيانات التصنيف
   */
  getClassification: (id) =>
    apiMethods.get(`${BASE_PATH}/classifications/${id}`),

  /**
   * إنشاء تصنيف جديد
   * @param {Object} data - بيانات التصنيف
   * @returns {Promise<Object>} التصنيف المنشأ
   */
  createClassification: (data) =>
    apiMethods.post(`${BASE_PATH}/classifications`, data),

  /**
   * تحديث بيانات تصنيف
   * @param {string|number} id - معرف التصنيف
   * @param {Object} data - البيانات المحدثة
   * @returns {Promise<Object>} التصنيف المحدث
   */
  updateClassification: (id, data) =>
    apiMethods.put(`${BASE_PATH}/classifications/${id}`, data),

  /**
   * حذف تصنيف
   * @param {string|number} id - معرف التصنيف
   * @returns {Promise<void>}
   */
  deleteClassification: (id) =>
    apiMethods.delete(`${BASE_PATH}/classifications/${id}`),

  // ========== Search & Filters ==========

  /**
   * البحث في المستندات
   * @param {Object} filters - معايير البحث
   * @returns {Promise<Object>} نتائج البحث
   */
  searchDocuments: (filters) =>
    apiMethods.post(`${BASE_PATH}/documents/search`, filters),

  /**
   * البحث المتقدم
   * @param {Object} query - استعلام البحث المتقدم
   * @returns {Promise<Object>} نتائج البحث
   */
  advancedSearch: (query) =>
    apiMethods.post(`${BASE_PATH}/search/advanced`, query),

  /**
   * البحث بالنص الكامل (Full-text search)
   * @param {string} term - كلمة البحث
   * @param {Object} options - خيارات إضافية
   * @returns {Promise<Object>} نتائج البحث
   */
  fullTextSearch: (term, options = {}) =>
    apiMethods.get(`${BASE_PATH}/search/fulltext`, {
      params: { q: term, ...options }
    }),

  // ========== Access Requests ==========

  /**
   * طلب الوصول إلى مستند
   * @param {string|number} documentId - معرف المستند
   * @param {Object} data - بيانات الطلب
   * @returns {Promise<Object>} الطلب المنشأ
   */
  requestDocumentAccess: (documentId, data) =>
    apiMethods.post(`${BASE_PATH}/documents/${documentId}/access-request`, data),

  /**
   * الحصول على طلبات الوصول
   * @param {Object} params - معاملات الفلترة
   * @returns {Promise<Array>} قائمة طلبات الوصول
   */
  getAccessRequests: (params = {}) =>
    apiMethods.get(`${BASE_PATH}/access-requests`, { params }),

  /**
   * الموافقة على طلب وصول
   * @param {string|number} requestId - معرف الطلب
   * @param {Object} data - بيانات الموافقة
   * @returns {Promise<Object>} الطلب المحدث
   */
  approveAccessRequest: (requestId, data) =>
    apiMethods.post(`${BASE_PATH}/access-requests/${requestId}/approve`, data),

  /**
   * رفض طلب وصول
   * @param {string|number} requestId - معرف الطلب
   * @param {Object} data - بيانات الرفض
   * @returns {Promise<Object>} الطلب المحدث
   */
  rejectAccessRequest: (requestId, data) =>
    apiMethods.post(`${BASE_PATH}/access-requests/${requestId}/reject`, data),

  // ========== Document History & Audit ==========

  /**
   * الحصول على سجل المستند
   * @param {string|number} documentId - معرف المستند
   * @returns {Promise<Array>} سجل التعديلات
   */
  getDocumentHistory: (documentId) =>
    apiMethods.get(`${BASE_PATH}/documents/${documentId}/history`),

  /**
   * الحصول على سجل الوصول إلى المستند
   * @param {string|number} documentId - معرف المستند
   * @param {Object} params - معاملات الفلترة
   * @returns {Promise<Array>} سجل الوصول
   */
  getDocumentAccessLog: (documentId, params = {}) =>
    apiMethods.get(`${BASE_PATH}/documents/${documentId}/access-log`, { params }),

  /**
   * تسجيل وصول إلى مستند
   * @param {string|number} documentId - معرف المستند
   * @param {Object} data - بيانات الوصول
   * @returns {Promise<Object>} سجل الوصول
   */
  logDocumentAccess: (documentId, data) =>
    apiMethods.post(`${BASE_PATH}/documents/${documentId}/log-access`, data),

  // ========== File Upload (Multiple) ==========

  /**
   * رفع ملفات متعددة
   * @param {Array<File>} files - قائمة الملفات
   * @param {Object} metadata - البيانات الوصفية
   * @param {Function} onProgress - دالة تتبع التقدم
   * @returns {Promise<Array>} المستندات المرفوعة
   */
  uploadMultipleDocuments: (files, metadata = {}, onProgress = null) => {
    const formData = new FormData();

    files.forEach((file, index) => {
      formData.append('files', file);
    });

    formData.append('metadata', JSON.stringify(metadata));

    return apiMethods.post(`${BASE_PATH}/documents/upload-multiple`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
  },

  /**
   * رفع ملف واحد مع تتبع التقدم
   * @param {File} file - الملف
   * @param {Object} metadata - البيانات الوصفية
   * @param {Function} onProgress - دالة تتبع التقدم
   * @returns {Promise<Object>} المستند المرفوع
   */
  uploadDocument: (file, metadata = {}, onProgress = null) => {
    const formData = new FormData();
    formData.append('file', file);

    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });

    return apiMethods.post(`${BASE_PATH}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
  },

  // ========== OCR & Text Extraction ==========

  /**
   * استخراج النص من مستند (OCR)
   * @param {string|number} documentId - معرف المستند
   * @returns {Promise<Object>} النص المستخرج
   */
  extractDocumentText: (documentId) =>
    apiMethods.post(`${BASE_PATH}/documents/${documentId}/ocr`),

  /**
   * البحث في النصوص المستخرجة
   * @param {string} term - كلمة البحث
   * @returns {Promise<Array>} المستندات المطابقة
   */
  searchOcrText: (term) =>
    apiMethods.get(`${BASE_PATH}/search/ocr`, { params: { q: term } }),

  // ========== Tags & Metadata ==========

  /**
   * إضافة وسم لمستند
   * @param {string|number} documentId - معرف المستند
   * @param {string} tag - الوسم
   * @returns {Promise<Object>} المستند المحدث
   */
  addDocumentTag: (documentId, tag) =>
    apiMethods.post(`${BASE_PATH}/documents/${documentId}/tags`, { tag }),

  /**
   * حذف وسم من مستند
   * @param {string|number} documentId - معرف المستند
   * @param {string} tag - الوسم
   * @returns {Promise<void>}
   */
  removeDocumentTag: (documentId, tag) =>
    apiMethods.delete(`${BASE_PATH}/documents/${documentId}/tags/${tag}`),

  /**
   * الحصول على جميع الوسوم
   * @returns {Promise<Array>} قائمة الوسوم
   */
  getAllTags: () =>
    apiMethods.get(`${BASE_PATH}/tags`),

  /**
   * البحث بالوسوم
   * @param {Array<string>} tags - قائمة الوسوم
   * @returns {Promise<Array>} المستندات المطابقة
   */
  searchByTags: (tags) =>
    apiMethods.post(`${BASE_PATH}/search/tags`, { tags }),

  // ========== Reports & Analytics ==========

  /**
   * الحصول على تقرير استخدام الأرشيف
   * @param {Object} params - معاملات التقرير
   * @returns {Promise<Object>} بيانات التقرير
   */
  getUsageReport: (params = {}) =>
    apiMethods.get(`${BASE_PATH}/reports/usage`, { params }),

  /**
   * الحصول على تقرير الوصول
   * @param {Object} params - معاملات التقرير
   * @returns {Promise<Object>} بيانات التقرير
   */
  getAccessReport: (params = {}) =>
    apiMethods.get(`${BASE_PATH}/reports/access`, { params }),

  /**
   * تصدير تقرير
   * @param {string} reportType - نوع التقرير
   * @param {string} format - صيغة التصدير (pdf, excel, csv)
   * @param {Object} params - معاملات التقرير
   * @returns {Promise<Blob>} ملف التقرير
   */
  exportReport: (reportType, format = 'pdf', params = {}) =>
    apiMethods.get(`${BASE_PATH}/reports/${reportType}/export`, {
      params: { format, ...params },
      responseType: 'blob'
    }),
};

export default archivingApi;
