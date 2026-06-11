import { fmtDate } from '../utils/hijriDate';

/**
 * signatureResolver.js
 * يحوّل بيانات الاعتمادات والموظفين إلى مصفوفة التوقيعات لنماذج الطباعة الحكومية
 *
 * يربط بين:
 * - أسماء الأدوار العربية في النماذج (DEFAULT_SIGNATURES)
 * - حقول الاعتمادات في بيانات الطلب (approval chain fields)
 * - أدوار tempReceive (المسلم، مأمور ساحة الاستلام، إلخ)
 * - صور التوقيع من بيانات الموظف في HR
 */

/**
 * خريطة ربط أسماء الأدوار في النماذج مع حقول الاعتماد في بيانات الطلب
 * المفتاح: اسم الدور بالعربي كما يظهر في DEFAULT_SIGNATURES
 * القيمة: أسماء الحقول في كائن بيانات الطلب
 */
const ROLE_TO_APPROVAL_FIELD_MAP = {
  'مدير إدارة المستودعات': {
    field: 'HeadWarehouse_Approved',
    fieldDate: 'HeadWarehouse_ApprovedDate',
    fieldBy: 'HeadWarehouse_ApprovedBy',
  },
  'أمين المستودع': {
    field: 'Security_Approved',
    fieldDate: 'Security_ApprovedDate',
    fieldBy: 'Security_ApprovedBy',
  },
  'أمين المستودع / مأمور العهدة': {
    field: 'Security_Approved',
    fieldDate: 'Security_ApprovedDate',
    fieldBy: 'Security_ApprovedBy',
  },
  'مدير الإدارة الطالبة': {
    field: 'HeadDepartment_Approved',
    fieldDate: 'HeadDepartment_ApprovedDate',
    fieldBy: 'HeadDepartment_ApprovedBy',
  },
  'مراقب المخزون': {
    field: 'InventoryController_Approved',
    fieldDate: 'InventoryController_ApprovedDate',
    fieldBy: 'InventoryController_ApprovedBy',
  },
  'رئيس البلدية': {
    field: 'MunicipalityManager_Approved',
    fieldDate: 'MunicipalityManager_ApprovedDate',
    fieldBy: 'MunicipalityManager_ApprovedBy',
  },
  'المستلم': {
    field: 'Receiver_Confirmed',
    fieldDate: 'Receiver_ConfirmedDate',
    fieldBy: 'Receiver_ConfirmedBy',
  },
};

/**
 * خريطة ربط أسماء الأدوار مع مفاتيح roles من بيانات tempReceive
 */
const ROLE_TO_TEMP_RECEIVE_MAP = {
  'المسلم': 'deliverer',
  'المسلّم': 'deliverer',
  'مأمور عهدة ساحة الاستلام': 'yard_officer',
  'مأمور ساحة الاستلام': 'yard_officer',
  'أمين المستودع': 'warehouse_keeper',
  'أمين المستودع / مأمور العهدة': 'warehouse_keeper',
  'مدير إدارة المستودعات': 'warehouse_manager',
  'مراقب المخزون': 'inventory_controller',
};

/**
 * بناء مصفوفة التوقيعات المحسّنة من بيانات الاعتماد والموظفين
 *
 * @param {Array} defaultSignatures - التوقيعات الافتراضية من النموذج [{role, name?, title?}]
 * @param {Object} requestData - بيانات الطلب/المستند (تحتوي حقول الاعتماد)
 * @param {Object} options - خيارات إضافية
 * @param {Object} options.roles - بيانات الأدوار من tempReceive مثل {deliverer: {name, employeeId}}
 * @param {Object} options.employeeSignatures - خريطة صور التوقيع {employeeId: signatureImageUrl}
 * @returns {Array} مصفوفة التوقيعات المحسّنة مع signatureImageUrl, isElectronic, approvedAt
 */
export function resolveSignatures(defaultSignatures, requestData = {}, options = {}) {
  const { roles = {}, employeeSignatures = {} } = options;

  return defaultSignatures.map((sig) => {
    const enhanced = { ...sig };

    // 1. محاولة المطابقة عبر حقول الاعتماد (approval chain)
    const approvalMapping = ROLE_TO_APPROVAL_FIELD_MAP[sig.role];
    if (approvalMapping && requestData[approvalMapping.field]) {
      const approverInfo = requestData[approvalMapping.fieldBy];
      const approvedDate = requestData[approvalMapping.fieldDate];

      if (approverInfo) {
        const isObj = typeof approverInfo === 'object' && approverInfo !== null;
        enhanced.name = enhanced.name || (isObj
          ? (approverInfo.name || approverInfo.fullName || '')
          : String(approverInfo));
        enhanced.title = enhanced.title || (isObj
          ? (approverInfo.position || approverInfo.jobTitle || '')
          : '');
        enhanced.isElectronic = true;
        enhanced.approvedAt = approvedDate;
        enhanced.date = enhanced.date || formatDate(approvedDate);

        // ربط صورة التوقيع عبر معرف الموظف
        const empId = isObj ? (approverInfo.id || approverInfo.employeeId) : null;
        if (empId && employeeSignatures[empId]) {
          enhanced.signatureImageUrl = employeeSignatures[empId];
        }
      }
    }

    // 2. محاولة المطابقة عبر أدوار tempReceive
    const tempReceiveKey = ROLE_TO_TEMP_RECEIVE_MAP[sig.role];
    if (tempReceiveKey && roles[tempReceiveKey]) {
      const roleData = roles[tempReceiveKey];
      if (!enhanced.name) {
        enhanced.name = roleData.name || roleData.employeeName || '';
      }
      if (!enhanced.title) {
        enhanced.title = roleData.position || roleData.jobTitle || '';
      }

      const empId = roleData.employeeId || roleData.id;
      if (empId && !enhanced.signatureImageUrl && employeeSignatures[empId]) {
        enhanced.signatureImageUrl = employeeSignatures[empId];
      }
    }

    return enhanced;
  });
}

/**
 * تنسيق التاريخ للعرض بالعربية
 */
function formatDate(isoDate) {
  if (!isoDate) return '';
  try {
    return fmtDate(isoDate);
  } catch {
    return String(isoDate);
  }
}

export { ROLE_TO_APPROVAL_FIELD_MAP, ROLE_TO_TEMP_RECEIVE_MAP };
