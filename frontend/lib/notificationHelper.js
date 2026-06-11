/**
 * lib/notificationHelper.js
 * مكتبة مساعدة لإنشاء الإشعارات من أي API route
 *
 * الاستخدام:
 *   import { createNotification, notifyUser, notifyDepartment } from '@/lib/notificationHelper';
 *   await createNotification({ userId: 1, titleAr: 'إشعار', ... });
 */
import { sqlcmdExec, escapeSql, safeIntVal } from './sqlcmd';

const DB = 'Masarat_Notifications';

/**
 * إنشاء إشعار واحد في قاعدة البيانات
 * @param {object} params
 * @param {number} params.userId - معرف المستخدم
 * @param {string} [params.username] - اسم المستخدم
 * @param {string} params.titleAr - العنوان بالعربية
 * @param {string} [params.titleEn] - العنوان بالإنجليزية
 * @param {string} params.messageAr - الرسالة بالعربية
 * @param {string} [params.messageEn] - الرسالة بالإنجليزية
 * @param {string} [params.type] - نوع الإشعار (info, success, warning, error)
 * @param {string} [params.category] - التصنيف (chat, epm, itsm, hr, warehouse, etc.)
 * @param {string} [params.priority] - الأولوية (low, normal, high, urgent)
 * @param {string} [params.actionUrl] - رابط الإجراء
 * @param {string} [params.iconUrl] - رابط الأيقونة
 * @param {string} [params.entityType] - نوع الكيان (charter, ticket, message, etc.)
 * @param {string} [params.entityId] - معرف الكيان
 * @param {object} [params.metadata] - بيانات إضافية JSON
 * @param {number} [params.tenantId] - معرف المستأجر
 * @returns {Promise<boolean>} نجاح العملية
 */
export async function createNotification({
  userId,
  username = null,
  titleAr,
  titleEn = null,
  messageAr,
  messageEn = null,
  type = 'info',
  category = 'system',
  priority = 'normal',
  actionUrl = null,
  iconUrl = null,
  entityType = null,
  entityId = null,
  metadata = null,
  tenantId = 1,
}) {
  try {
    const metaStr = metadata ? JSON.stringify(metadata) : null;
    const sql = `
      INSERT INTO dbo.Notifications (
        NotificationId, UserId, Username,
        TitleAr, TitleEn, MessageAr, MessageEn,
        Type, Category, Priority,
        ActionUrl, IconUrl,
        EntityType, EntityId, Metadata,
        IsRead, IsDeleted, CreatedAt, TenantId
      ) VALUES (
        NEWID(),
        ${safeIntVal(userId)},
        ${username ? escapeSql(username) : 'NULL'},
        ${escapeSql(titleAr)},
        ${titleEn ? escapeSql(titleEn) : 'NULL'},
        ${escapeSql(messageAr)},
        ${messageEn ? escapeSql(messageEn) : 'NULL'},
        ${escapeSql(type)},
        ${escapeSql(category)},
        ${escapeSql(priority)},
        ${actionUrl ? escapeSql(actionUrl) : 'NULL'},
        ${iconUrl ? escapeSql(iconUrl) : 'NULL'},
        ${entityType ? escapeSql(entityType) : 'NULL'},
        ${entityId ? escapeSql(String(entityId)) : 'NULL'},
        ${metaStr ? escapeSql(metaStr) : 'NULL'},
        0, 0, SYSUTCDATETIME(),
        ${safeIntVal(tenantId)}
      )
    `;
    await sqlcmdExec(sql, DB);
    return true;
  } catch (err) {
    console.error('[notificationHelper] createNotification error:', err.message);
    return false;
  }
}

/**
 * إرسال إشعار لمستخدم واحد (اختصار)
 */
export async function notifyUser(userId, titleAr, messageAr, opts = {}) {
  return createNotification({ userId, titleAr, messageAr, ...opts });
}

/**
 * إرسال إشعار لعدة مستخدمين
 * @param {number[]} userIds
 * @param {string} titleAr
 * @param {string} messageAr
 * @param {object} opts
 */
export async function notifyUsers(userIds, titleAr, messageAr, opts = {}) {
  const promises = userIds.map(uid =>
    createNotification({ userId: uid, titleAr, messageAr, ...opts })
  );
  const results = await Promise.allSettled(promises);
  return results.filter(r => r.status === 'fulfilled' && r.value).length;
}

/**
 * إشعارات جاهزة للأنظمة المختلفة
 */
export const NotificationTemplates = {
  // ─── الشات ────────────────────────────────
  chatNewMessage: (userId, senderName, conversationName, tenantId) =>
    createNotification({
      userId,
      titleAr: 'رسالة جديدة',
      titleEn: 'New Message',
      messageAr: `رسالة جديدة من ${senderName}` + (conversationName ? ` في ${conversationName}` : ''),
      type: 'info',
      category: 'chat',
      priority: 'normal',
      actionUrl: '/chat',
      entityType: 'message',
      tenantId,
    }),

  // ─── إدارة الأداء ────────────────────────
  epmCharterSubmitted: (managerId, employeeName, charterId, tenantId) =>
    createNotification({
      userId: managerId,
      titleAr: 'ميثاق أداء جديد للاعتماد',
      titleEn: 'Performance Charter Submitted',
      messageAr: `قدّم ${employeeName} ميثاق الأداء للاعتماد`,
      type: 'info',
      category: 'epm',
      priority: 'high',
      actionUrl: `/epm/charters/${charterId}`,
      entityType: 'charter',
      entityId: charterId,
      tenantId,
    }),

  epmCharterApproved: (employeeId, charterId, tenantId) =>
    createNotification({
      userId: employeeId,
      titleAr: 'تم اعتماد ميثاق الأداء',
      titleEn: 'Charter Approved',
      messageAr: 'تم اعتماد ميثاق الأداء الخاص بك بنجاح',
      type: 'success',
      category: 'epm',
      priority: 'normal',
      actionUrl: `/epm/charters/${charterId}`,
      entityType: 'charter',
      entityId: charterId,
      tenantId,
    }),

  epmCharterRejected: (employeeId, charterId, reason, tenantId) =>
    createNotification({
      userId: employeeId,
      titleAr: 'تم رفض ميثاق الأداء',
      titleEn: 'Charter Rejected',
      messageAr: `تم رفض ميثاق الأداء` + (reason ? `: ${reason}` : ''),
      type: 'warning',
      category: 'epm',
      priority: 'high',
      actionUrl: `/epm/charters/${charterId}`,
      entityType: 'charter',
      entityId: charterId,
      tenantId,
    }),

  epmReviewSubmitted: (employeeId, reviewId, tenantId) =>
    createNotification({
      userId: employeeId,
      titleAr: 'تقييم أداء جديد',
      titleEn: 'New Performance Review',
      messageAr: 'تم تقديم تقييم أداء جديد لك',
      type: 'info',
      category: 'epm',
      priority: 'high',
      actionUrl: `/epm/reviews/${reviewId}`,
      entityType: 'review',
      entityId: reviewId,
      tenantId,
    }),

  // ─── الدعم الفني ─────────────────────────
  itsmTicketAssigned: (specialistId, ticketNumber, ticketTitle, tenantId) =>
    createNotification({
      userId: specialistId,
      titleAr: 'تذكرة مُسندة إليك',
      titleEn: 'Ticket Assigned',
      messageAr: `تم إسناد التذكرة ${ticketNumber}: ${ticketTitle}`,
      type: 'info',
      category: 'itsm',
      priority: 'high',
      actionUrl: `/itsm/tickets`,
      entityType: 'ticket',
      entityId: ticketNumber,
      tenantId,
    }),

  itsmTicketResolved: (reporterId, ticketNumber, ticketTitle, tenantId) =>
    createNotification({
      userId: reporterId,
      titleAr: 'تم حل التذكرة',
      titleEn: 'Ticket Resolved',
      messageAr: `تم حل التذكرة ${ticketNumber}: ${ticketTitle}`,
      type: 'success',
      category: 'itsm',
      priority: 'normal',
      actionUrl: `/itsm/tickets`,
      entityType: 'ticket',
      entityId: ticketNumber,
      tenantId,
    }),
};

export default {
  createNotification,
  notifyUser,
  notifyUsers,
  NotificationTemplates,
};
