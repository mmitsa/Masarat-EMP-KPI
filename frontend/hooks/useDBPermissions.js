import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import api from '../lib/api';

/**
 * Hook لفحص الصلاحيات من قاعدة البيانات (Authorization API)
 * يستخدم للتحقق Runtime من صلاحيات المستخدم على شاشات وعمليات محددة
 *
 * @param {string} moduleId - معرف الموديول (مثل 'hr', 'warehouse')
 * @returns {{ allowedScreens: string[], allowedOperations: object, loading: boolean, hasScreenAccess: Function, hasOperationAccess: Function, refresh: Function }}
 */
export default function useDBPermissions(moduleId) {
    const { data: session } = useSession();
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);

    const userId = session?.user?.id;
    const userRoles = session?.user?.roles || [];

    // Super admin and IT Director bypass
    const isSuperAdmin = userRoles.includes('super_admin') ||
                         userRoles.includes('Admin') ||
                         userRoles.includes('admin');
    const isITDirector = userRoles.includes('it_director');

    const fetchPermissions = useCallback(async () => {
        if (!moduleId || !userId) {
            setLoading(false);
            return;
        }

        // Super admin has all permissions
        if (isSuperAdmin || isITDirector) {
            setPermissions({
                hasAccess: true,
                allowedScreens: ['*'],
                allowedOperations: {},
            });
            setLoading(false);
            return;
        }

        try {
            const result = await api.permissionsManagement.checkPermission(userId, moduleId);
            setPermissions(result);
        } catch (err) {
            console.warn(`Failed to fetch DB permissions for ${moduleId}:`, err.message);
            // Fallback: no DB-level restrictions (let role-based checks handle it)
            setPermissions({
                hasAccess: true,
                allowedScreens: [],
                allowedOperations: {},
            });
        } finally {
            setLoading(false);
        }
    }, [moduleId, userId, isSuperAdmin, isITDirector]);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    /**
     * التحقق من وصول المستخدم لشاشة معينة
     */
    const hasScreenAccess = useCallback((screenId) => {
        if (isSuperAdmin || isITDirector) return true;
        if (!permissions) return true; // Default: allow until loaded
        if (permissions.allowedScreens.includes('*')) return true;
        if (permissions.allowedScreens.length === 0) return true; // No DB restrictions
        return permissions.allowedScreens.includes(screenId);
    }, [permissions, isSuperAdmin, isITDirector]);

    /**
     * التحقق من صلاحية عملية على شاشة
     */
    const hasOperationAccess = useCallback((screenId, operationType) => {
        if (isSuperAdmin || isITDirector) return true;
        if (!permissions) return true;
        const screenOps = permissions.allowedOperations?.[screenId];
        if (!screenOps) return true; // No DB restrictions for this screen
        return screenOps.includes(operationType);
    }, [permissions, isSuperAdmin, isITDirector]);

    return {
        permissions,
        loading,
        hasScreenAccess,
        hasOperationAccess,
        refresh: fetchPermissions,
    };
}
