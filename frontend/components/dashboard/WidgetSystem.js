import React, { useState, useEffect } from 'react';
import { canAccessSystem } from '../../lib/rbac';

// Error Boundary خفيف لكل ويدجت — يمنع انهيار الداشبورد بالكامل
class WidgetErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.warn(`[Widget Error] ${this.props.widgetTitle || 'unknown'}:`, error?.message);
    }
    render() {
        if (this.state.hasError) {
            const dark = this.props.darkMode;
            return (
                <div className={`text-center py-8 px-4 ${dark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="text-2xl block mb-2">⚠️</span>
                    <p className="text-sm font-medium mb-1">تعذّر تحميل هذا الويدجت</p>
                    <p className="text-xs mb-3">{this.state.error?.message?.slice(0, 100)}</p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                            dark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 text-gray-600 dark:text-gray-300'
                        }`}
                    >
                        إعادة المحاولة
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// تكوين الويدجت المتاحة حسب الصلاحيات
const widgetCatalog = [
    {
        id: 'clock',
        name: 'الساعة والتاريخ',
        icon: '🕐',
        permission: null, // متاح للجميع
        category: 'عام',
        size: 'small'
    },
    {
        id: 'weather',
        name: 'حالة الطقس',
        icon: '🌤️',
        permission: null,
        category: 'عام',
        size: 'small'
    },
    {
        id: 'quick-stats',
        name: 'إحصائيات سريعة',
        icon: '📊',
        permission: null,
        category: 'عام',
        size: 'medium'
    },
    {
        id: 'my-tasks',
        name: 'مهامي',
        icon: '✅',
        permission: null,
        category: 'عام',
        size: 'medium'
    },
    {
        id: 'calendar',
        name: 'التقويم',
        icon: '📅',
        permission: null,
        category: 'عام',
        size: 'medium'
    },
    {
        id: 'news',
        name: 'آخر الأخبار',
        icon: '📰',
        permission: null,
        category: 'عام',
        size: 'small'
    },
    {
        id: 'announcements',
        name: 'لوحة الإعلانات',
        icon: '📢',
        permission: null,
        category: 'عام',
        size: 'medium'
    },
    {
        id: 'validation',
        name: 'حالة التحقق من البيانات',
        icon: '✅',
        permission: 'hr:read',
        category: 'الموارد البشرية',
        size: 'medium'
    },
    {
        id: 'hr-summary',
        name: 'ملخص الموارد البشرية',
        icon: '👥',
        permission: 'hr:read',
        category: 'الموارد البشرية',
        size: 'medium'
    },
    {
        id: 'leave-requests',
        name: 'طلبات الإجازة',
        icon: '🏖️',
        permission: 'hr:read',
        category: 'الموارد البشرية',
        size: 'small'
    },
    {
        id: 'birthdays',
        name: 'أعياد الميلاد',
        icon: '🎂',
        permission: 'hr:read',
        category: 'الموارد البشرية',
        size: 'small'
    },
    {
        id: 'inventory-alerts',
        name: 'تنبيهات المخزون',
        icon: '📦',
        permission: 'warehouse:read',
        category: 'المستودعات',
        size: 'medium'
    },
    {
        id: 'low-stock',
        name: 'أصناف منخفضة',
        icon: '⚠️',
        permission: 'warehouse:read',
        category: 'المستودعات',
        size: 'small'
    },
    {
        id: 'custody-status',
        name: 'حالة العهد',
        icon: '🔑',
        permission: 'warehouse:read',
        category: 'المستودعات',
        size: 'small'
    },
    {
        id: 'vehicle-status',
        name: 'حالة المركبات',
        icon: '🚗',
        permission: 'movement:read',
        category: 'الحركة',
        size: 'medium'
    },
    {
        id: 'active-trips',
        name: 'الرحلات النشطة',
        icon: '🛣️',
        permission: 'movement:read',
        category: 'الحركة',
        size: 'small'
    },
    {
        id: 'maintenance-due',
        name: 'صيانة مستحقة',
        icon: '🔧',
        permission: 'movement:read',
        category: 'الحركة',
        size: 'small'
    },
    {
        id: 'pending-transactions',
        name: 'معاملات معلقة',
        icon: '📄',
        permission: 'archiving:read',
        category: 'الأرشفة',
        size: 'medium'
    },
    {
        id: 'archive-stats',
        name: 'إحصائيات الأرشيف',
        icon: '📁',
        permission: 'archiving:read',
        category: 'الأرشفة',
        size: 'small'
    },
    // إدارة المشاريع
    {
        id: 'projects-summary',
        name: 'ملخص المشاريع',
        icon: '📋',
        permission: 'projects:read',
        category: 'إدارة المشاريع',
        size: 'medium'
    },
    {
        id: 'my-project-tasks',
        name: 'مهامي في المشاريع',
        icon: '✅',
        permission: 'projects:read',
        category: 'إدارة المشاريع',
        size: 'medium'
    },
    {
        id: 'project-progress',
        name: 'تقدم المشاريع',
        icon: '📊',
        permission: 'projects:read',
        category: 'إدارة المشاريع',
        size: 'medium'
    },
    {
        id: 'project-deadlines',
        name: 'مواعيد التسليم',
        icon: '📅',
        permission: 'projects:read',
        category: 'إدارة المشاريع',
        size: 'small'
    },
    {
        id: 'project-quick-actions',
        name: 'إجراءات سريعة للمشاريع',
        icon: '⚡',
        permission: 'projects:read',
        category: 'إدارة المشاريع',
        size: 'small'
    },
    {
        id: 'project-stats-chart',
        name: 'إحصائيات المشاريع',
        icon: '📈',
        permission: 'projects:read',
        category: 'إدارة المشاريع',
        size: 'medium'
    },
    {
        id: 'projects-summary-large',
        name: 'ملخص المشاريع الشامل',
        icon: '📋',
        permission: 'projects:read',
        category: 'إدارة المشاريع',
        size: 'large'
    },
    // المدفوعات والمالية
    {
        id: 'sadad-summary',
        name: 'ملخص المدفوعات',
        icon: '💳',
        permission: 'sadad:read',
        category: 'المدفوعات',
        size: 'medium'
    },
    {
        id: 'pending-payments',
        name: 'مدفوعات معلقة',
        icon: '💰',
        permission: 'sadad:read',
        category: 'المدفوعات',
        size: 'small'
    },
    {
        id: 'budget-overview',
        name: 'نظرة على الميزانية',
        icon: '📊',
        permission: 'finance:read',
        category: 'المدفوعات',
        size: 'medium'
    },
    // تقييم الأداء
    {
        id: 'epm-summary',
        name: 'ملخص تقييم الأداء',
        icon: '🎯',
        permission: 'epm:read',
        category: 'تقييم الأداء',
        size: 'medium'
    },
    {
        id: 'evaluation-deadlines',
        name: 'مواعيد التقييم',
        icon: '📅',
        permission: 'epm:read',
        category: 'تقييم الأداء',
        size: 'small'
    },
    // التحليلات
    {
        id: 'system-health',
        name: 'صحة الأنظمة',
        icon: '🏥',
        permission: 'analytics:read',
        category: 'التحليلات',
        size: 'medium'
    },
    {
        id: 'kpi-summary',
        name: 'مؤشرات الأداء',
        icon: '📈',
        permission: 'analytics:read',
        category: 'التحليلات',
        size: 'medium'
    },
];

// مكون اختيار الويدجت
export function WidgetSelector({ isOpen, onClose, onAdd, userPermissions = [], userRoles = [], activeWidgets = [], darkMode = false }) {
    const [selectedCategory, setSelectedCategory] = useState('الكل');
    const [searchTerm, setSearchTerm] = useState('');

    const categories = ['الكل', ...new Set(widgetCatalog.map(w => w.category))];

    const hasPermission = (permission) => {
        if (!permission) return true;
        // فحص الصلاحيات المباشرة
        if (userPermissions.includes(permission) || userPermissions.includes('admin')) return true;
        // فحص عبر الأدوار (RBAC) - استخراج اسم النظام من الصلاحية
        if (userRoles?.length) {
            if (userRoles.includes('super_admin')) return true;
            const system = permission.split(':')[0];
            return canAccessSystem(userRoles, system);
        }
        return false;
    };

    const availableWidgets = widgetCatalog.filter(widget => {
        const matchesCategory = selectedCategory === 'الكل' || widget.category === selectedCategory;
        const matchesSearch = widget.name.includes(searchTerm);
        const hasAccess = hasPermission(widget.permission);
        const notActive = !activeWidgets.includes(widget.id);
        return matchesCategory && matchesSearch && hasAccess && notActive;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className={`relative w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-900'
                }`} dir="rtl">
                {/* Header */}
                <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            إضافة ويدجت
                        </h2>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search */}
                    <div className={`flex items-center gap-2 p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
                        <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="البحث عن ويدجت..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`flex-1 bg-transparent outline-none ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'
                                }`}
                        />
                    </div>

                    {/* Categories */}
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${selectedCategory === cat
                                    ? 'bg-blue-600 text-white'
                                    : darkMode
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Widgets Grid */}
                <div className="p-6 overflow-y-auto max-h-[50vh]">
                    {availableWidgets.length === 0 ? (
                        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            <span className="text-4xl mb-4 block">📭</span>
                            <p>لا توجد ويدجت متاحة في هذا التصنيف</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {availableWidgets.map(widget => (
                                <button
                                    key={widget.id}
                                    onClick={() => {
                                        onAdd(widget.id);
                                        onClose();
                                    }}
                                    className={`p-4 rounded-xl border-2 text-center transition-all hover:scale-105 ${darkMode
                                        ? 'bg-gray-700 border-gray-600 hover:border-blue-500'
                                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                        }`}
                                >
                                    <span className="text-3xl mb-2 block">{widget.icon}</span>
                                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {widget.name}
                                    </p>
                                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {widget.category}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// زر إضافة ويدجت
export function AddWidgetButton({ onClick, darkMode = false }) {
    return (
        <button
            onClick={onClick}
            className={`w-full h-full min-h-[200px] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 group ${darkMode
                ? 'border-gray-700 hover:border-blue-500 hover:bg-gray-800/50'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50'
                }`}
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${darkMode
                ? 'bg-gray-700 group-hover:bg-blue-600'
                : 'bg-gray-200 group-hover:bg-blue-500'
                }`}>
                <svg className={`w-6 h-6 ${darkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </div>
            <span className={`font-medium ${darkMode ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600'}`}>
                إضافة ويدجت
            </span>
        </button>
    );
}

// حاوية الويدجت مع إمكانية الحذف
export function WidgetContainer({ id, title, icon, children, onRemove, darkMode = false }) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700'}`}>
            {/* Widget Header */}
            <div className={`px-4 py-3 flex items-center justify-between border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{title}</h3>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>
                    {showMenu && (
                        <div className={`absolute left-0 top-full mt-1 rounded-lg shadow-lg overflow-hidden z-10 ${darkMode ? 'bg-gray-700' : 'bg-white dark:bg-gray-900'}`}>
                            <button
                                onClick={() => {
                                    onRemove(id);
                                    setShowMenu(false);
                                }}
                                className={`px-4 py-2 text-sm flex items-center gap-2 whitespace-nowrap ${darkMode ? 'text-red-400 hover:bg-gray-600' : 'text-red-600 dark:text-red-400 hover:bg-red-50'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                إزالة
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Widget Content */}
            <div className="p-4">
                <WidgetErrorBoundary widgetTitle={title} darkMode={darkMode}>
                    {children}
                </WidgetErrorBoundary>
            </div>
        </div>
    );
}

export { widgetCatalog };
