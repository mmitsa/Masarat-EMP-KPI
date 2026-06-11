/**
 * NotificationPreferencesContext - إدارة تفضيلات الإشعارات المتكاملة مع RBAC
 * @version 1.0.0
 * @date 2026-02-03
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { SYSTEMS, canAccessSystem, SYSTEM_DEFINITIONS } from '../lib/rbac';
import api from '../lib/api';

// ═══════════════════════════════════════════════════════════════
// أنواع الإشعارات لكل نظام
// ═══════════════════════════════════════════════════════════════
export const NOTIFICATION_CATEGORIES = {
    // المستودعات
    warehouse: {
        id: 'warehouse',
        system: SYSTEMS.WAREHOUSE,
        nameAr: 'المستودعات',
        nameEn: 'Warehouse',
        icon: '📦',
        types: {
            lowStock: { nameAr: 'تنبيهات المخزون المنخفض', nameEn: 'Low Stock Alerts', default: true },
            exchangeRequest: { nameAr: 'طلبات الصرف', nameEn: 'Exchange Requests', default: true },
            custody: { nameAr: 'إشعارات العهد', nameEn: 'Custody Notifications', default: true },
            approval: { nameAr: 'طلبات الموافقة', nameEn: 'Approval Requests', default: true },
            delivery: { nameAr: 'إشعارات التسليم', nameEn: 'Delivery Notifications', default: true },
        }
    },
    // الموارد البشرية
    hr: {
        id: 'hr',
        system: SYSTEMS.HR,
        nameAr: 'الموارد البشرية',
        nameEn: 'Human Resources',
        icon: '👥',
        types: {
            leaveRequest: { nameAr: 'طلبات الإجازات', nameEn: 'Leave Requests', default: true },
            newEmployee: { nameAr: 'الموظفين الجدد', nameEn: 'New Employees', default: true },
            documentExpiry: { nameAr: 'انتهاء الوثائق', nameEn: 'Document Expiry', default: true },
            evaluation: { nameAr: 'التقييمات', nameEn: 'Evaluations', default: true },
            attendance: { nameAr: 'الحضور والانصراف', nameEn: 'Attendance', default: true },
            transfer: { nameAr: 'طلبات النقل', nameEn: 'Transfer Requests', default: true },
        }
    },
    // الحركة والنقل
    movement: {
        id: 'movement',
        system: SYSTEMS.MOVEMENT,
        nameAr: 'حركة الأسطول',
        nameEn: 'Fleet Movement',
        icon: '🚗',
        types: {
            vehicleAssigned: { nameAr: 'تعيين المركبات', nameEn: 'Vehicle Assignments', default: true },
            tripStatus: { nameAr: 'حالة الرحلات', nameEn: 'Trip Status', default: true },
            maintenance: { nameAr: 'الصيانة المستحقة', nameEn: 'Due Maintenance', default: true },
            fuelAlert: { nameAr: 'تنبيهات الوقود', nameEn: 'Fuel Alerts', default: false },
        }
    },
    // الأرشفة
    archiving: {
        id: 'archiving',
        system: SYSTEMS.ARCHIVING,
        nameAr: 'الأرشفة',
        nameEn: 'Archiving',
        icon: '📂',
        types: {
            documentUploaded: { nameAr: 'رفع مستندات جديدة', nameEn: 'New Documents Uploaded', default: true },
            documentShared: { nameAr: 'مشاركة المستندات', nameEn: 'Document Sharing', default: true },
            folderShared: { nameAr: 'مشاركة المجلدات', nameEn: 'Folder Sharing', default: true },
            accessRequest: { nameAr: 'طلبات الوصول', nameEn: 'Access Requests', default: true },
        }
    },
    // سداد
    sadad: {
        id: 'sadad',
        system: SYSTEMS.SADAD,
        nameAr: 'سداد',
        nameEn: 'Sadad',
        icon: '💳',
        types: {
            paymentReceived: { nameAr: 'المدفوعات المستلمة', nameEn: 'Payments Received', default: true },
            invoiceCreated: { nameAr: 'الفواتير الجديدة', nameEn: 'New Invoices', default: true },
            paymentDue: { nameAr: 'المدفوعات المستحقة', nameEn: 'Due Payments', default: true },
            invoiceReminder: { nameAr: 'تذكير الفواتير', nameEn: 'Invoice Reminders', default: true },
        }
    },
    // الأداء
    epm: {
        id: 'epm',
        system: SYSTEMS.EPM,
        nameAr: 'قياس الأداء',
        nameEn: 'Performance',
        icon: '🎯',
        types: {
            goalDue: { nameAr: 'الأهداف المستحقة', nameEn: 'Due Goals', default: true },
            evaluationDue: { nameAr: 'التقييمات المستحقة', nameEn: 'Due Evaluations', default: true },
            feedbackReceived: { nameAr: 'الملاحظات الجديدة', nameEn: 'New Feedback', default: true },
        }
    },
    // الإدارة المالية
    finance: {
        id: 'finance',
        system: SYSTEMS.FINANCE,
        nameAr: 'الإدارة المالية',
        nameEn: 'Finance',
        icon: '💰',
        types: {
            budgetAlert: { nameAr: 'تنبيهات الميزانية', nameEn: 'Budget Alerts', default: true },
            approvalRequired: { nameAr: 'موافقات مطلوبة', nameEn: 'Approvals Required', default: true },
            reportReady: { nameAr: 'التقارير الجاهزة', nameEn: 'Reports Ready', default: true },
        }
    },
    // النظام
    system: {
        id: 'system',
        system: 'system',
        nameAr: 'النظام',
        nameEn: 'System',
        icon: '⚙️',
        types: {
            announcement: { nameAr: 'الإعلانات', nameEn: 'Announcements', default: true },
            maintenance: { nameAr: 'الصيانة المجدولة', nameEn: 'Scheduled Maintenance', default: true },
            update: { nameAr: 'التحديثات', nameEn: 'Updates', default: true },
            security: { nameAr: 'التنبيهات الأمنية', nameEn: 'Security Alerts', default: true },
        }
    },
    // الموافقات
    approval: {
        id: 'approval',
        system: 'approval',
        nameAr: 'الموافقات',
        nameEn: 'Approvals',
        icon: '✅',
        types: {
            pending: { nameAr: 'الموافقات المعلقة', nameEn: 'Pending Approvals', default: true },
            result: { nameAr: 'نتائج الموافقات', nameEn: 'Approval Results', default: true },
            delegated: { nameAr: 'التفويضات', nameEn: 'Delegations', default: true },
        }
    },
};

// ═══════════════════════════════════════════════════════════════
// الإعدادات الافتراضية
// ═══════════════════════════════════════════════════════════════
const DEFAULT_PREFERENCES = {
    // الإعدادات العامة
    general: {
        enabled: true,                    // تفعيل الإشعارات
        sound: true,                      // صوت الإشعارات
        desktop: false,                   // إشعارات سطح المكتب
        email: true,                      // إشعارات البريد
        emailDigest: 'daily',             // ملخص البريد: immediate, daily, weekly
        doNotDisturb: false,              // وضع عدم الإزعاج
        doNotDisturbStart: '22:00',       // بداية عدم الإزعاج
        doNotDisturbEnd: '07:00',         // نهاية عدم الإزعاج
    },
    // تفضيلات الأولوية
    priority: {
        urgent: true,                     // الإشعارات العاجلة دائماً
        high: true,                       // الأولوية العالية
        medium: true,                     // الأولوية المتوسطة
        low: true,                        // الأولوية المنخفضة
    },
    // تفضيلات الأنظمة (يتم تعبئتها ديناميكياً)
    systems: {},
};

// ═══════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════
const NotificationPreferencesContext = createContext(null);

export function NotificationPreferencesProvider({ children }) {
    const { data: session, status } = useSession();
    const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [userSystems, setUserSystems] = useState([]);

    // استخراج أدوار المستخدم
    const userRoles = session?.user?.roles || [];

    // ═══════════════════════════════════════════════════════════
    // تحديد الأنظمة المتاحة للمستخدم بناءً على صلاحياته
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        if (!session) return;

        const availableSystems = [];

        Object.entries(NOTIFICATION_CATEGORIES).forEach(([key, category]) => {
            // الأنظمة العامة (system, approval) متاحة للجميع
            if (category.system === 'system' || category.system === 'approval') {
                availableSystems.push(category);
                return;
            }

            // التحقق من صلاحية الوصول للنظام
            if (canAccessSystem(userRoles, category.system)) {
                availableSystems.push(category);
            }
        });

        setUserSystems(availableSystems);

        // تهيئة تفضيلات الأنظمة
        const systemsPrefs = {};
        availableSystems.forEach(system => {
            systemsPrefs[system.id] = {
                enabled: true,
                types: Object.fromEntries(
                    Object.entries(system.types).map(([type, config]) => [type, config.default])
                ),
            };
        });

        setPreferences(prev => ({
            ...prev,
            systems: systemsPrefs,
        }));
    }, [session, userRoles]);

    // ═══════════════════════════════════════════════════════════
    // تحميل التفضيلات من الـ Backend
    // ═══════════════════════════════════════════════════════════
    const loadPreferences = useCallback(async () => {
        if (!session?.user?.id) return;

        setLoading(true);
        setError(null);

        try {
            // محاولة تحميل من الـ Backend
            const response = await api.notifications?.getPreferences?.(session.user.id);

            if (response && response.preferences) {
                setPreferences(prev => ({
                    ...prev,
                    ...response.preferences,
                }));
            }
        } catch (err) {
            console.warn('Failed to load preferences from backend, using local:', err);

            // محاولة تحميل من localStorage
            const localPrefs = localStorage.getItem(`notification_prefs_${session.user.id}`);
            if (localPrefs) {
                try {
                    const parsed = JSON.parse(localPrefs);
                    setPreferences(prev => ({
                        ...prev,
                        ...parsed,
                    }));
                } catch (e) {
                    console.warn('Failed to parse local preferences:', e);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        if (status === 'authenticated') {
            loadPreferences();
        }
    }, [status, loadPreferences]);

    // ═══════════════════════════════════════════════════════════
    // حفظ التفضيلات
    // ═══════════════════════════════════════════════════════════
    const savePreferences = useCallback(async (newPreferences) => {
        if (!session?.user?.id) return;

        setSaving(true);
        setError(null);

        const updatedPrefs = { ...preferences, ...newPreferences };
        setPreferences(updatedPrefs);

        // حفظ محلياً فوراً
        localStorage.setItem(`notification_prefs_${session.user.id}`, JSON.stringify(updatedPrefs));

        try {
            // حفظ في الـ Backend
            await api.notifications?.savePreferences?.(session.user.id, updatedPrefs);
        } catch (err) {
            console.warn('Failed to save to backend, saved locally:', err);
        } finally {
            setSaving(false);
        }
    }, [session?.user?.id, preferences]);

    // ═══════════════════════════════════════════════════════════
    // تحديث إعداد معين
    // ═══════════════════════════════════════════════════════════
    const updateGeneralSetting = useCallback((key, value) => {
        const newPrefs = {
            ...preferences,
            general: {
                ...preferences.general,
                [key]: value,
            },
        };
        savePreferences(newPrefs);
    }, [preferences, savePreferences]);

    const updatePrioritySetting = useCallback((key, value) => {
        const newPrefs = {
            ...preferences,
            priority: {
                ...preferences.priority,
                [key]: value,
            },
        };
        savePreferences(newPrefs);
    }, [preferences, savePreferences]);

    const updateSystemSetting = useCallback((systemId, enabled) => {
        const newPrefs = {
            ...preferences,
            systems: {
                ...preferences.systems,
                [systemId]: {
                    ...preferences.systems[systemId],
                    enabled,
                },
            },
        };
        savePreferences(newPrefs);
    }, [preferences, savePreferences]);

    const updateSystemTypeSetting = useCallback((systemId, typeId, enabled) => {
        const newPrefs = {
            ...preferences,
            systems: {
                ...preferences.systems,
                [systemId]: {
                    ...preferences.systems[systemId],
                    types: {
                        ...preferences.systems[systemId]?.types,
                        [typeId]: enabled,
                    },
                },
            },
        };
        savePreferences(newPrefs);
    }, [preferences, savePreferences]);

    // ═══════════════════════════════════════════════════════════
    // التحقق من إمكانية إرسال إشعار
    // ═══════════════════════════════════════════════════════════
    const canSendNotification = useCallback((systemId, typeId, priority = 'medium') => {
        // التحقق من التفعيل العام
        if (!preferences.general.enabled) return false;

        // التحقق من وضع عدم الإزعاج
        if (preferences.general.doNotDisturb) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const start = preferences.general.doNotDisturbStart;
            const end = preferences.general.doNotDisturbEnd;

            // إذا كان الوقت الحالي ضمن فترة عدم الإزعاج
            if (start < end) {
                if (currentTime >= start && currentTime <= end) {
                    // السماح فقط للإشعارات العاجلة
                    if (priority !== 'urgent') return false;
                }
            } else {
                // فترة عدم الإزعاج تمتد عبر منتصف الليل
                if (currentTime >= start || currentTime <= end) {
                    if (priority !== 'urgent') return false;
                }
            }
        }

        // التحقق من الأولوية
        if (!preferences.priority[priority]) return false;

        // التحقق من تفعيل النظام
        const systemPrefs = preferences.systems[systemId];
        if (!systemPrefs?.enabled) return false;

        // التحقق من تفعيل نوع الإشعار
        if (typeId && !systemPrefs.types?.[typeId]) return false;

        return true;
    }, [preferences]);

    // ═══════════════════════════════════════════════════════════
    // التحقق من الصلاحية للنظام
    // ═══════════════════════════════════════════════════════════
    const hasAccessToSystem = useCallback((systemId) => {
        return userSystems.some(s => s.id === systemId);
    }, [userSystems]);

    // ═══════════════════════════════════════════════════════════
    // تفعيل/تعطيل جميع الأنظمة
    // ═══════════════════════════════════════════════════════════
    const enableAllSystems = useCallback(() => {
        const newSystems = {};
        userSystems.forEach(system => {
            newSystems[system.id] = {
                enabled: true,
                types: Object.fromEntries(
                    Object.entries(system.types).map(([type]) => [type, true])
                ),
            };
        });
        savePreferences({ ...preferences, systems: newSystems });
    }, [userSystems, preferences, savePreferences]);

    const disableAllSystems = useCallback(() => {
        const newSystems = {};
        userSystems.forEach(system => {
            newSystems[system.id] = {
                enabled: false,
                types: Object.fromEntries(
                    Object.entries(system.types).map(([type]) => [type, false])
                ),
            };
        });
        savePreferences({ ...preferences, systems: newSystems });
    }, [userSystems, preferences, savePreferences]);

    // ═══════════════════════════════════════════════════════════
    // إعادة التعيين للافتراضي
    // ═══════════════════════════════════════════════════════════
    const resetToDefault = useCallback(() => {
        const systemsPrefs = {};
        userSystems.forEach(system => {
            systemsPrefs[system.id] = {
                enabled: true,
                types: Object.fromEntries(
                    Object.entries(system.types).map(([type, config]) => [type, config.default])
                ),
            };
        });

        savePreferences({
            ...DEFAULT_PREFERENCES,
            systems: systemsPrefs,
        });
    }, [userSystems, savePreferences]);

    const value = {
        // الحالة
        preferences,
        loading,
        saving,
        error,
        userSystems,
        userRoles,

        // الدوال
        loadPreferences,
        savePreferences,
        updateGeneralSetting,
        updatePrioritySetting,
        updateSystemSetting,
        updateSystemTypeSetting,
        canSendNotification,
        hasAccessToSystem,
        enableAllSystems,
        disableAllSystems,
        resetToDefault,

        // الثوابت
        NOTIFICATION_CATEGORIES,
    };

    return (
        <NotificationPreferencesContext.Provider value={value}>
            {children}
        </NotificationPreferencesContext.Provider>
    );
}

// ═══════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════
export function useNotificationPreferences() {
    const context = useContext(NotificationPreferencesContext);
    if (!context) {
        throw new Error('useNotificationPreferences must be used within NotificationPreferencesProvider');
    }
    return context;
}

export default NotificationPreferencesContext;
