import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import {
    canAccessPage,
    getPermissionDeniedMessage,
    PAGE_PERMISSIONS,
    hasScreenPermission,
    getPermissionsForRole,
    mergePermissions,
    DEFAULT_PERMISSIONS,
    isWarehouseScoped,
    canAccessWarehouse,
    getAccessibleWarehouses,
    canApproveExchangeAtLevel,
    getAvailableApprovalLevels,
    canApproveExchangeRequest,
    canCreateInventoryForm,
    canSignInventoryFormAsKeeper,
    canApproveInventoryForm,
    canManageFiscalYear,
    canApproveStockPosting,
    canManageAdjustments,
    EXCHANGE_APPROVAL_LEVELS,
} from '../lib/permissions'

/**
 * PermissionGuard Component
 * Conditionally renders children based on user permissions or roles
 *
 * @param {string|string[]} requires - Single permission or array of permissions required
 * @param {boolean} requireAll - If true, user must have ALL permissions. If false, ANY permission is enough
 * @param {ReactNode} fallback - Component to show if user doesn't have permission
 * @param {ReactNode} children - Content to show if user has permission
 */
export default function PermissionGuard({
    requires,
    requireAll = false,
    fallback = null,
    children
}) {
    const { data: session } = useSession()

    // Get user permissions and roles from session
    const userPermissions = session?.user?.permissions || []
    const userRoles = session?.user?.roles || []

    // Super admin, IT Director, and Admin bypass all permission checks
    const isSuperAdmin = userRoles.includes('super_admin') ||
                         userRoles.includes('Admin') ||
                         userRoles.includes('admin')

    // IT Director has almost full access (except SaaS, Agents, AI Monitoring)
    const isITDirector = userRoles.includes('it_director') ||
                         userRoles.includes('it_manager')

    // HR Manager has full access to HR-related permissions
    const isHRManager = userRoles.includes('hr_manager') ||
                        userRoles.includes('hr_director')

    if (isSuperAdmin) {
        return <>{children}</>
    }

    // Normalize requires to array
    const requiredPermissions = Array.isArray(requires) ? requires : [requires]

    // Check if IT Director is blocked from specific permissions
    if (isITDirector) {
        const blockedForITDirector = ['saas_', 'agents_', 'ai_monitoring_']
        const isBlocked = requiredPermissions.some(perm =>
            blockedForITDirector.some(blocked => perm.startsWith(blocked))
        )
        if (!isBlocked) {
            return <>{children}</>
        }
    }

    // HR Manager: full access to HR permissions (hr.*, hr_*)
    if (isHRManager) {
        const allHR = requiredPermissions.every(perm =>
            perm.startsWith('hr.') || perm.startsWith('hr_')
        )
        if (allHR) {
            return <>{children}</>
        }
    }

    // Check if a single permission is granted, supporting wildcards
    // e.g. userPermissions=['hr.*'] grants 'hr.salaryscale.edit'
    const checkOnePerm = (perm) => {
        if (userPermissions.includes(perm) || userRoles.includes(perm)) return true
        // Wildcard check: if user has 'hr.*' it grants any 'hr.xxx' permission
        return userPermissions.some(up => {
            if (!up.endsWith('*')) return false
            const prefix = up.slice(0, -1) // 'hr.'
            return perm.startsWith(prefix)
        })
    }

    // Check if user has required permissions OR roles
    const hasPermission = requireAll
        ? requiredPermissions.every(perm => checkOnePerm(perm))
        : requiredPermissions.some(perm => checkOnePerm(perm))

    if (!hasPermission) {
        return fallback
    }

    return <>{children}</>
}

/**
 * Hook version of PermissionGuard
 * Returns boolean indicating if user has permission
 */
export function usePermission(requires, requireAll = false) {
    const { data: session } = useSession()
    const userPermissions = session?.user?.permissions || []
    const userRoles = session?.user?.roles || []
    const requiredPermissions = Array.isArray(requires) ? requires : [requires]

    // Super admin bypass
    const isSuperAdmin = userRoles.includes('super_admin') ||
                         userRoles.includes('Admin') ||
                         userRoles.includes('admin')

    if (isSuperAdmin) return true

    // IT Director / IT Manager has almost full access
    const isITDirector = userRoles.includes('it_director') ||
                         userRoles.includes('it_manager')
    if (isITDirector) {
        const blockedForITDirector = ['saas_', 'agents_', 'ai_monitoring_']
        const isBlocked = requiredPermissions.some(perm =>
            blockedForITDirector.some(blocked => perm.startsWith(blocked))
        )
        if (!isBlocked) return true
    }

    // HR Manager: full access to HR permissions
    const isHRManager = userRoles.includes('hr_manager') ||
                        userRoles.includes('hr_director')
    if (isHRManager) {
        const allHR = requiredPermissions.every(perm =>
            perm.startsWith('hr.') || perm.startsWith('hr_')
        )
        if (allHR) return true
    }

    // Wildcard-aware permission check
    const checkOnePerm = (perm) => {
        if (userPermissions.includes(perm) || userRoles.includes(perm)) return true
        return userPermissions.some(up => {
            if (!up.endsWith('*')) return false
            const prefix = up.slice(0, -1)
            return perm.startsWith(prefix)
        })
    }

    return requireAll
        ? requiredPermissions.every(perm => checkOnePerm(perm))
        : requiredPermissions.some(perm => checkOnePerm(perm))
}

/**
 * Re-export useDBPermissions for convenience
 * Hook لفحص الصلاحيات من قاعدة البيانات (Authorization API)
 */
export { default as useDBPermissions } from '../hooks/useDBPermissions'

/**
 * Hook for screen-based permissions (new permission system)
 * يتحقق أولاً من صلاحيات قاعدة البيانات (Authorization API) ثم fallback للنظام المحلي
 * @param {string} screenId - معرف الشاشة (مثل: warehouse_temp_receive)
 * @param {string} permissionType - نوع الصلاحية (view, create, edit, delete, approve, export, print)
 * @returns {boolean}
 */
export function useScreenPermission(screenId, permissionType = 'view') {
    const { data: session } = useSession()
    const userRoles = session?.user?.roles || []

    // Super admin bypass
    const isSuperAdmin = userRoles.includes('super_admin') ||
                         userRoles.includes('Admin') ||
                         userRoles.includes('admin')

    if (isSuperAdmin) return true

    // التحقق من صلاحيات قاعدة البيانات أولاً (إن وجدت)
    const dbAllowedScreens = session?.user?.allowedScreens || []
    const dbAllowedOperations = session?.user?.allowedOperations || {}

    if (dbAllowedScreens.length > 0) {
        // إذا الشاشة موجودة في القائمة المسموحة
        if (dbAllowedScreens.includes(screenId)) {
            // تحقق من نوع العملية إذا كانت محددة
            if (permissionType === 'view') return true
            const screenOps = dbAllowedOperations[screenId] || []
            return screenOps.includes(permissionType)
        }
        return false
    }

    // Fallback: النظام المحلي (role-based)
    const mergedPermissions = mergePermissions(userRoles)

    return hasScreenPermission(mergedPermissions, screenId, permissionType)
}

/**
 * Component for screen-based permission guard
 */
export function ScreenPermissionGuard({
    screenId,
    permissionType = 'view',
    fallback = null,
    children
}) {
    const hasPermission = useScreenPermission(screenId, permissionType)

    if (!hasPermission) {
        return fallback
    }

    return <>{children}</>
}

/**
 * Hook for warehouse-scoped permissions
 * Returns accessible warehouses for the current user
 */
export function useWarehouseScope(allWarehouses = []) {
    const { data: session } = useSession()
    const userRoles = session?.user?.roles || []
    const user = session?.user || {}

    return {
        isScoped: userRoles.some(role => isWarehouseScoped(role)),
        canAccessWarehouse: (warehouseId) => canAccessWarehouse(user, warehouseId),
        accessibleWarehouses: getAccessibleWarehouses(user, allWarehouses),
        isFullAccess: userRoles.includes('super_admin') ||
                      userRoles.includes('it_director') ||
                      userRoles.includes('warehouse_director'),
    }
}

/**
 * Hook for exchange request approval permissions
 * Returns available approval levels and check functions
 */
export function useExchangeApprovalPermission() {
    const { data: session } = useSession()
    const userRoles = session?.user?.roles || []

    return {
        availableLevels: getAvailableApprovalLevels(userRoles),
        canApproveAtLevel: (level) => canApproveExchangeAtLevel(userRoles, level),
        canApproveRequest: (request) => canApproveExchangeRequest(userRoles, request),
        LEVELS: EXCHANGE_APPROVAL_LEVELS,
    }
}

/**
 * Hook for inventory form permissions
 */
export function useInventoryFormPermission() {
    const { data: session } = useSession()
    const userRoles = session?.user?.roles || []

    return {
        canCreate: canCreateInventoryForm(userRoles),
        canSign: canSignInventoryFormAsKeeper(userRoles),
        canApprove: canApproveInventoryForm(userRoles),
    }
}

/**
 * Hook for fiscal year and stock posting permissions
 */
export function useFiscalYearPermission() {
    const { data: session } = useSession()
    const userRoles = session?.user?.roles || []

    return {
        canManageFiscalYear: canManageFiscalYear(userRoles),
        canApproveStockPosting: canApproveStockPosting(userRoles),
        canManageAdjustments: canManageAdjustments(userRoles),
    }
}

/**
 * Component to show message when user lacks permission
 */
export function PermissionDenied({ message = 'ليس لديك الصلاحيات اللازمة' }) {
    return (
        <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>{message}</span>
        </div>
    )
}

/**
 * PagePermissionGuard Component
 * Protects entire pages based on user permissions
 * Redirects to dashboard if user doesn't have access
 */
export function PagePermissionGuard({ children, pathname = null }) {
    const router = useRouter()
    const { data: session, status } = useSession()
    const currentPath = pathname || router.pathname

    // Loading state - wait for session to be determined
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">جاري التحميل...</p>
                </div>
            </div>
        )
    }

    // User is not authenticated - redirect to login
    // IMPORTANT: Check status instead of just session to avoid race conditions
    // Session might be null briefly while NextAuth is initializing
    if (status === 'unauthenticated') {
        if (typeof window !== 'undefined') {
            router.replace('/login')
        }
        return null
    }

    // Extra safety check - if session is still null but status is authenticated, show loading
    // This handles edge cases during session initialization
    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">جاري تحميل الجلسة...</p>
                </div>
            </div>
        )
    }

    const userPermissions = session.user?.permissions || []
    const userRoles = session.user?.roles || []
    const requiredPermission = PAGE_PERMISSIONS[currentPath]

    // Check page access
    if (!canAccessPage(currentPath, userPermissions, userRoles)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center max-w-md p-8">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        غير مصرح بالوصول
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {getPermissionDeniedMessage(requiredPermission)}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                        >
                            العودة للخلف
                        </button>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-6 py-2 bg-green-700 text-white rounded-xl hover:bg-green-800 transition-colors"
                        >
                            الصفحة الرئيسية
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return children
}

/**
 * Hook to get current user's permissions state
 */
export function usePermissions() {
    const { data: session, status } = useSession()

    if (status === 'loading') return {
        loading: true,
        permissions: [],
        roles: [],
        isSuperAdmin: false,
        isITDirector: false,
        screenPermissions: {}
    }

    if (!session) return {
        loading: false,
        permissions: [],
        roles: [],
        isSuperAdmin: false,
        isITDirector: false,
        screenPermissions: {}
    }

    const userPermissions = session.user?.permissions || []
    const userRoles = session.user?.roles || []
    const isSuperAdmin = userRoles.includes('super_admin') ||
                         userRoles.includes('Admin') ||
                         userRoles.includes('admin')
    const isITDirector = userRoles.includes('it_director')

    // Get merged screen permissions from all roles
    const screenPermissions = mergePermissions(userRoles)

    return {
        loading: false,
        permissions: userPermissions,
        roles: userRoles,
        isSuperAdmin,
        isITDirector,
        screenPermissions,
        // صلاحيات قاعدة البيانات (من Authorization API)
        allowedScreens: session.user?.allowedScreens || [],
        allowedOperations: session.user?.allowedOperations || {},
        user: session.user,
    }
}

/**
 * Higher-Order Component to wrap pages with permission protection
 */
export function withPagePermission(WrappedComponent) {
    return function ProtectedPage(props) {
        return (
            <PagePermissionGuard>
                <WrappedComponent {...props} />
            </PagePermissionGuard>
        )
    }
}

/**
 * Higher-Order Component to wrap components with screen permission
 */
export function withScreenPermission(WrappedComponent, screenId, permissionType = 'view') {
    return function ProtectedComponent(props) {
        const hasPermission = useScreenPermission(screenId, permissionType)

        if (!hasPermission) {
            return <PermissionDenied message={`ليس لديك صلاحية ${
                permissionType === 'view' ? 'عرض' :
                permissionType === 'create' ? 'إضافة' :
                permissionType === 'edit' ? 'تعديل' :
                permissionType === 'delete' ? 'حذف' :
                permissionType === 'approve' ? 'اعتماد' : 'الوصول'
            } لهذه الشاشة`} />
        }

        return <WrappedComponent {...props} />
    }
}

/**
 * Exchange Approval Level Guard
 * Shows content only if user can approve at specified level
 */
export function ExchangeApprovalGuard({ level, fallback = null, children }) {
    const { canApproveAtLevel } = useExchangeApprovalPermission()

    if (!canApproveAtLevel(level)) {
        return fallback
    }

    return <>{children}</>
}

/**
 * Inventory Form Permission Guard
 * Shows content based on inventory form permissions
 */
export function InventoryFormGuard({ action = 'create', fallback = null, children }) {
    const { canCreate, canSign, canApprove } = useInventoryFormPermission()

    const hasPermission =
        action === 'create' ? canCreate :
        action === 'sign' ? canSign :
        action === 'approve' ? canApprove : false

    if (!hasPermission) {
        return fallback
    }

    return <>{children}</>
}

/**
 * Warehouse Scoped Guard
 * Shows content only for accessible warehouses
 */
export function WarehouseScopedGuard({ warehouseId, fallback = null, children }) {
    const { canAccessWarehouse } = useWarehouseScope()

    if (!canAccessWarehouse(warehouseId)) {
        return fallback
    }

    return <>{children}</>
}
