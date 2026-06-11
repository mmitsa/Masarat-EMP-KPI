/**
 * Platform Admin Authentication Guard
 * حماية صفحات إدارة المنصة
 */

import { useRouter } from 'next/router';
import { useEffect, useState, createContext, useContext } from 'react';

// Platform Admin Context
const PlatformAdminContext = createContext({
    isAdmin: false,
    adminUser: null,
    loading: true,
    login: async () => {},
    logout: () => {}
});

// Session storage key
const PLATFORM_SESSION_KEY = 'platform_admin_session';

/**
 * Check if platform admin session exists
 */
export function getPlatformSession() {
    if (typeof window === 'undefined') return null;

    try {
        const session = localStorage.getItem(PLATFORM_SESSION_KEY);
        if (!session) return null;

        const parsed = JSON.parse(session);
        // Check if session is expired (24 hours)
        if (Date.now() - parsed.loginTime > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(PLATFORM_SESSION_KEY);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

/**
 * Platform Admin Provider
 */
export function PlatformAdminProvider({ children }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminUser, setAdminUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const session = getPlatformSession();
        if (session) {
            setIsAdmin(true);
            setAdminUser(session.user);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await fetch('/api/saas/admin-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'بيانات الدخول غير صحيحة');
        }

        const session = {
            user: {
                id: data.user.id,
                name: data.user.fullName,
                email: data.user.email,
                role: data.user.role,
                permissions: data.user.permissions,
            },
            loginTime: Date.now(),
        };

        localStorage.setItem(PLATFORM_SESSION_KEY, JSON.stringify(session));
        setIsAdmin(true);
        setAdminUser(session.user);

        return session;
    };

    const logout = () => {
        localStorage.removeItem(PLATFORM_SESSION_KEY);
        setIsAdmin(false);
        setAdminUser(null);
    };

    return (
        <PlatformAdminContext.Provider value={{ isAdmin, adminUser, loading, login, logout }}>
            {children}
        </PlatformAdminContext.Provider>
    );
}

/**
 * Hook to use platform admin context
 */
export function usePlatformAdmin() {
    const context = useContext(PlatformAdminContext);
    if (!context) {
        throw new Error('usePlatformAdmin must be used within PlatformAdminProvider');
    }
    return context;
}

/**
 * Hook to protect platform admin pages
 */
export function usePlatformAdminGuard() {
    const router = useRouter();
    const { isAdmin, loading } = usePlatformAdmin();

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.replace('/platform-admin/login');
        }
    }, [isAdmin, loading, router]);

    return { isAdmin, loading };
}

/**
 * Higher-order component to protect platform admin pages
 */
export function withPlatformAdmin(Component) {
    return function ProtectedRoute(props) {
        const { isAdmin, loading } = usePlatformAdminGuard();

        if (loading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">جاري التحقق من الصلاحيات...</p>
                    </div>
                </div>
            );
        }

        if (!isAdmin) {
            return null;
        }

        return <Component {...props} />;
    };
}

/**
 * Check if user has specific platform permission
 */
export function hasPlatformPermission(user, permission) {
    if (!user || !user.permissions) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
}
