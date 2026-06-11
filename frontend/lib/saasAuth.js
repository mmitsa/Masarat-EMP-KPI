/**
 * SaaS API Dual Authentication Helper
 * ════════════════════════════════════════════
 *
 * يدعم طريقتين للمصادقة في SaaS API routes:
 *
 * 1. next-auth session (للمستخدمين المسجلين عبر لوحة التحكم الرئيسية)
 * 2. Platform Admin header (للمشرفين المسجلين عبر /platform-admin/login)
 *
 * الأولوية: next-auth أولاً → ثم Platform Admin header
 *
 * الاستخدام في API route:
 * ```javascript
 * import { getSaasAuth } from '@/lib/saasAuth';
 *
 * export default async function handler(req, res) {
 *   const auth = await getSaasAuth(req, res);
 *   if (!auth) {
 *     return res.status(401).json({ success: false, error: 'غير مصرح' });
 *   }
 *   // auth.tenantId, auth.userName, auth.role, auth.isPlatformAdmin
 * }
 * ```
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { sqlcmdJson, escapeSql } from '@/lib/sqlcmd';

// ══════════════════════════════════════════════════════
// تطبيع TenantId
// ══════════════════════════════════════════════════════
function normalizeTenantId(tid) {
  if (!tid) return 1;
  return parseInt(String(tid).replace(/^tenant-/i, '').trim()) || 1;
}

/**
 * التحقق من مصادقة SaaS (dual-auth)
 * يحاول next-auth أولاً، ثم يفحص header المشرف
 *
 * @param {object} req - Next.js request
 * @param {object} res - Next.js response
 * @returns {object|null} - بيانات المصادقة أو null
 */
export async function getSaasAuth(req, res) {
  // ── المحاولة الأولى: next-auth session ──────────────
  try {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user) {
      return {
        tenantId: normalizeTenantId(session.user.tenantId),
        userName: session.user.name || session.user.nameAr || 'system',
        userId: session.user.id || session.user.nationalId,
        role: session.user.role || 'user',
        isPlatformAdmin: false,
        source: 'next-auth',
      };
    }
  } catch (err) {
    console.warn('[saasAuth] next-auth session check failed:', err.message);
  }

  // ── المحاولة الثانية: Platform Admin header ─────────
  const platformHeader = req.headers['x-platform-admin'];
  if (platformHeader) {
    try {
      // فك تشفير الـ header (base64 encoded JSON)
      const decoded = JSON.parse(
        Buffer.from(platformHeader, 'base64').toString('utf-8')
      );

      const { email, loginTime } = decoded;

      // التحقق من أن الجلسة لم تنتهِ (24 ساعة)
      if (loginTime && Date.now() - loginTime > 24 * 60 * 60 * 1000) {
        console.warn('[saasAuth] Platform admin session expired');
        return null;
      }

      if (!email || typeof email !== 'string') {
        console.warn('[saasAuth] Missing or invalid email in platform admin header');
        return null;
      }

      // التحقق من وجود المشرف في قاعدة البيانات
      const emailSql = escapeSql(email.toLowerCase().trim());
      const admins = await sqlcmdJson(`
        SELECT Id, Email, FullName, Role
        FROM dbo.SaaSAdminUsers
        WHERE Email = ${emailSql} AND IsActive = 1
        FOR JSON PATH
      `, 'Masarat_SaaS');

      const admin = admins?.[0];
      if (!admin) {
        console.warn(`[saasAuth] Unknown or inactive platform admin email: ${email}`);
        return null;
      }

      const normalizedRole = admin.Role === 'SuperAdmin'
        ? 'super_platform_admin'
        : 'platform_support';

      return {
        tenantId: 1, // مشرفو المنصة يعملون على مستوى النظام (Tenant 1)
        userName: admin.FullName,
        userId: `pa-${admin.Id}`,
        role: normalizedRole,
        isPlatformAdmin: true,
        source: 'platform-admin',
      };
    } catch (parseErr) {
      console.warn('[saasAuth] Failed to parse platform admin header:', parseErr.message);
      return null;
    }
  }

  // ── لا توجد مصادقة صالحة ──────────────────────────
  return null;
}

/**
 * تطبيع TenantId (re-exported for convenience)
 */
export { normalizeTenantId };
