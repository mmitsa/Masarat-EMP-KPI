/**
 * NextAuth v4 Configuration Helper
 * تكوين مساعد لـ NextAuth v4
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";

/**
 * Get the current session on the server side
 * الحصول على الجلسة الحالية من جانب الخادم
 */
export async function getSession(req, res) {
    return await getServerSession(req, res, authOptions);
}

/**
 * Check if user has specific permission
 * التحقق من صلاحية المستخدم
 */
export function hasPermission(session, permission) {
    if (!session?.user?.permissions) return false;
    return session.user.permissions.includes(permission);
}

/**
 * Check if user has specific role
 * التحقق من دور المستخدم
 */
export function hasRole(session, role) {
    if (!session?.user?.roles) return false;
    return session.user.roles.includes(role);
}

/**
 * Check if user is super admin
 * التحقق من المدير العام
 */
export function isSuperAdmin(session) {
    return hasRole(session, 'super_admin') || hasRole(session, 'Admin');
}

/**
 * Get user's access token for API calls
 * الحصول على رمز الوصول لاستدعاءات API
 */
export function getAccessToken(session) {
    return session?.accessToken;
}

/**
 * Get user's tenant ID
 * الحصول على معرف المستأجر
 */
export function getTenantId(session) {
    return session?.user?.tenantId;
}

export { authOptions };
