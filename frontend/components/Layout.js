import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { NAVIGATION } from '../lib/routes'
import { navigateTo } from '../lib/routeHelpers'

export default function Layout({ children }) {
    const { data: session } = useSession()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(true)

    // Define all available systems with required permissions
    const allSystems = [
        {
            name: 'الموارد البشرية',
            icon: '👥',
            path: '/hr',
            requiredPermission: 'hr:read',
            color: 'blue'
        },
        {
            name: 'المستودعات',
            icon: '📦',
            path: '/warehouse',
            requiredPermission: 'warehouse:read',
            color: 'green'
        },
        {
            name: 'الحركة والأسطول',
            icon: '🚗',
            path: '/movement',
            requiredPermission: 'movement:read',
            color: 'purple'
        },
        {
            name: 'الأرشفة',
            icon: '📁',
            path: '/archiving',
            requiredPermission: 'archiving:read',
            color: 'yellow'
        },
        {
            name: 'الأداء الوظيفي',
            icon: '📊',
            path: '/epm',
            requiredPermission: 'epm:read',
            color: 'indigo'
        },
        {
            name: 'سداد',
            icon: '💳',
            path: '/sadad',
            requiredPermission: 'sadad:read',
            color: 'red'
        },
        {
            name: 'التحليلات',
            icon: '📈',
            path: '/analytics',
            requiredPermission: 'analytics:read',
            color: 'pink'
        },
        {
            name: 'إدارة النظام',
            icon: '⚙️',
            path: '/admin/tenants',
            requiredPermission: 'saas:read',
            color: 'gray'
        },
    ]

    // Filter systems based on user permissions
    const userPermissions = session?.user?.permissions || []
    const accessibleSystems = allSystems.filter(system =>
        userPermissions.includes(system.requiredPermission)
    )

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' })
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-800" dir="rtl">
            {/* Top Navigation Bar */}
            <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 fixed w-full z-30 top-0">
                <div className="px-4 py-3 lg:px-6">
                    <div className="flex items-center justify-between">
                        {/* Logo & Menu Toggle */}
                        <div className="flex items-center">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-3 mr-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                                    م
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">مسارات</h1>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">المنصة الموحدة</p>
                                </div>
                            </div>
                        </div>

                        {/* User Info & Logout */}
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {session?.user?.name || session?.user?.email}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{session?.user?.tenantName}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                            >
                                تسجيل الخروج
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Sidebar */}
            <aside
                className={`fixed top-16 right-0 z-20 h-full transition-transform ${
                    sidebarOpen ? 'translate-x-0' : 'translate-x-full'
                } bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 w-64`}
            >
                <div className="h-full px-3 py-4 overflow-y-auto">
                    {/* Accessible Systems */}
                    <div className="space-y-2">
                        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            الأنظمة المتاحة ({accessibleSystems.length})
                        </p>

                        {accessibleSystems.length === 0 && (
                            <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                لا توجد أنظمة متاحة
                            </div>
                        )}

                        {accessibleSystems.map((system, idx) => {
                            const isActive = router.pathname.startsWith(system.path)
                            return (
                                <button
                                    key={idx}
                                    onClick={() => router.push(system.path)}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-right transition ${
                                        isActive
                                            ? `bg-${system.color}-50 text-${system.color}-700 font-medium`
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="text-2xl">{system.icon}</span>
                                    <span className="text-sm">{system.name}</span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Dashboard Link */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => navigateTo(router, NAVIGATION.DASHBOARD)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-right transition ${
                                router.pathname === '/dashboard'
                                    ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-white font-medium'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <span className="text-2xl">🏠</span>
                            <span className="text-sm">الصفحة الرئيسية</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`pt-16 transition-all ${sidebarOpen ? 'mr-64' : 'mr-0'}`}>
                <div className="p-6">
                    {children}
                </div>
            </main>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    )
}
