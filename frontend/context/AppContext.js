import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { OrganizationProvider } from './OrganizationContext';
import { useTheme as useRealTheme } from './ThemeContext';

// Default User - will be overridden by session data
const defaultUser = {
    id: null,
    name: 'مستخدم',
    email: '',
    role: 'موظف',
    avatar: null,
    tenant: 'مسارات',
    permissions: [],
    roles: [],
    department: '',
    position: ''
};

// User Context
const UserContext = createContext(defaultUser);

// User Provider - Uses session data when available
export function UserProvider({ children, user = defaultUser }) {
    const { data: session, status } = useSession();
    const [currentUser, setCurrentUser] = useState(defaultUser);

    useEffect(() => {
        if (session?.user) {
            // Map session user to app user format
            setCurrentUser({
                id: session.user.id,
                name: session.user.name || 'مستخدم',
                email: session.user.email || '',
                role: session.user.position || 'موظف',
                avatar: session.user.image || null,
                tenant: session.user.tenantName || 'مسارات',
                permissions: session.user.permissions || [],
                roles: session.user.roles || [],
                department: session.user.department || '',
                position: session.user.position || '',
                tenantId: session.user.tenantId,
                departmentId: session.user.departmentId,
            });
        } else if (user && user !== defaultUser) {
            setCurrentUser(user);
        }
    }, [session, user]);

    return (
        <UserContext.Provider value={currentUser}>
            {children}
        </UserContext.Provider>
    );
}

// Combined App Provider
// Note: NotificationProvider, ChatProvider, SmartAssistantProvider, ITSMProvider
// are provided in _app.js to avoid double-nesting
export function AppProvider({ children }) {
    return (
        <UserProvider>
            <OrganizationProvider>
                {children}
            </OrganizationProvider>
        </UserProvider>
    );
}

// Hooks — delegates to the real ThemeContext (ThemeContext.js)
// This provides backward-compatible { darkMode, toggleTheme } API
// for the ~30 pages that import useTheme from AppContext
export const useTheme = () => {
    const realTheme = useRealTheme();
    return {
        darkMode: realTheme.isDarkMode,
        toggleTheme: realTheme.toggleDarkMode,
        toggleDarkMode: realTheme.toggleDarkMode,
        // Pass through all ThemeContext values for pages that need them
        ...realTheme,
    };
};

export const useUser = () => {
    const context = useContext(UserContext);
    return context;
};

export { defaultUser };
