import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from './AppContext';
import api from '../lib/api';

const ITSMContext = createContext(null);

// حالات التذاكر
export const TICKET_STATUS = {
    NEW: 'new',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    PENDING: 'pending',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
    CANCELLED: 'cancelled',
};

// مستويات الأولوية
export const TICKET_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
};

// ترجمة الحالات
export const STATUS_LABELS = {
    [TICKET_STATUS.NEW]: 'جديدة',
    [TICKET_STATUS.ASSIGNED]: 'مُسندة',
    [TICKET_STATUS.IN_PROGRESS]: 'قيد التنفيذ',
    [TICKET_STATUS.PENDING]: 'معلقة',
    [TICKET_STATUS.RESOLVED]: 'تم الحل',
    [TICKET_STATUS.CLOSED]: 'مغلقة',
    [TICKET_STATUS.CANCELLED]: 'ملغاة',
};

// ترجمة الأولويات
export const PRIORITY_LABELS = {
    [TICKET_PRIORITY.LOW]: 'منخفضة',
    [TICKET_PRIORITY.MEDIUM]: 'متوسطة',
    [TICKET_PRIORITY.HIGH]: 'عالية',
    [TICKET_PRIORITY.CRITICAL]: 'حرجة',
};

// ألوان الحالات (باستخدام Design Tokens)
export const STATUS_COLORS = {
    [TICKET_STATUS.NEW]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    [TICKET_STATUS.ASSIGNED]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    [TICKET_STATUS.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    [TICKET_STATUS.PENDING]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    [TICKET_STATUS.RESOLVED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    [TICKET_STATUS.CLOSED]: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    [TICKET_STATUS.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

// ألوان الأولويات
export const PRIORITY_COLORS = {
    [TICKET_PRIORITY.LOW]: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    [TICKET_PRIORITY.MEDIUM]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    [TICKET_PRIORITY.HIGH]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    [TICKET_PRIORITY.CRITICAL]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export function ITSMProvider({ children }) {
    const user = useUser();

    // حالة الـ Widget
    const [isWidgetOpen, setIsWidgetOpen] = useState(false);
    const [widgetView, setWidgetView] = useState('main'); // main, create, tickets, detail
    const [selectedTicket, setSelectedTicket] = useState(null);

    // بيانات التذاكر
    const [myTickets, setMyTickets] = useState([]);
    const [myAssets, setMyAssets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // حالات التحميل
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // تحميل البيانات الأولية
    useEffect(() => {
        if (user?.id) {
            loadInitialData();
        }
    }, [user?.id]);

    // تحميل البيانات الأولية
    const loadInitialData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // تحميل التذاكر والأصول والتصنيفات بالتوازي
            const [ticketsRes, assetsRes, categoriesRes] = await Promise.all([
                api.itsm?.tickets?.getMyTickets?.() || Promise.resolve({ data: [] }),
                api.itsm?.assets?.getMyAssets?.() || Promise.resolve({ data: [] }),
                api.itsm?.categories?.getAll?.() || Promise.resolve({ data: [] }),
            ]);

            setMyTickets(ticketsRes?.data || []);
            setMyAssets(assetsRes?.data || []);
            setCategories(categoriesRes?.data || []);

            // حساب عدد التذاكر غير المقروءة
            const unread = (ticketsRes?.data || []).filter(
                t => t.status === TICKET_STATUS.RESOLVED && !t.userViewed
            ).length;
            setUnreadCount(unread);

        } catch (err) {
            // ITSM اختياري - لا نسجل خطأ عندما الخدمة مش شغالة
            console.warn('ITSM: تعذر تحميل البيانات (الخدمة غير متاحة)');
        } finally {
            setLoading(false);
        }
    }, []);

    // تحديث التذاكر
    const refreshTickets = useCallback(async () => {
        try {
            const response = await api.itsm.tickets.getMyTickets();
            setMyTickets(response?.data || []);

            const unread = (response?.data || []).filter(
                t => t.status === TICKET_STATUS.RESOLVED && !t.userViewed
            ).length;
            setUnreadCount(unread);
        } catch (err) {
            console.warn('ITSM: تعذر تحديث التذاكر');
        }
    }, []);

    // تحديث الأصول
    const refreshAssets = useCallback(async () => {
        try {
            const response = await api.itsm.assets.getMyAssets();
            setMyAssets(response?.data || []);
        } catch (err) {
            console.warn('ITSM: تعذر تحديث الأصول');
        }
    }, []);

    // إنشاء تذكرة جديدة
    const createTicket = useCallback(async (ticketData) => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.itsm.quickSupport.createQuickTicket({
                ...ticketData,
                requesterId: user?.id,
            });

            if (response.success) {
                await refreshTickets();
                setWidgetView('tickets');
                return { success: true, ticket: response.data };
            } else {
                throw new Error(response.message || 'فشل في إنشاء التذكرة');
            }
        } catch (err) {
            console.warn('ITSM: Error creating ticket:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [user?.id, refreshTickets]);

    // تقييم الخدمة
    const rateTicket = useCallback(async (ticketId, rating, feedback) => {
        try {
            setLoading(true);
            const response = await api.itsm.quickSupport.rateService(ticketId, rating, feedback);

            if (response.success) {
                await refreshTickets();
                return { success: true };
            } else {
                throw new Error(response.message || 'فشل في إرسال التقييم');
            }
        } catch (err) {
            console.warn('ITSM: Error rating ticket:', err);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [refreshTickets]);

    // إضافة تعليق للتذكرة
    const addComment = useCallback(async (ticketId, comment) => {
        try {
            const response = await api.itsm.tickets.addComment(ticketId, { content: comment });

            if (response.success) {
                await refreshTickets();
                return { success: true };
            } else {
                throw new Error(response.message || 'فشل في إضافة التعليق');
            }
        } catch (err) {
            console.warn('ITSM: Error adding comment:', err);
            return { success: false, error: err.message };
        }
    }, [refreshTickets]);

    // فتح/إغلاق الـ Widget
    const toggleWidget = useCallback(() => {
        setIsWidgetOpen(prev => !prev);
        if (!isWidgetOpen) {
            setWidgetView('main');
        }
    }, [isWidgetOpen]);

    // فتح الـ Widget
    const openWidget = useCallback(() => {
        setIsWidgetOpen(true);
        setWidgetView('main');
    }, []);

    // إغلاق الـ Widget
    const closeWidget = useCallback(() => {
        setIsWidgetOpen(false);
        setSelectedTicket(null);
    }, []);

    // الانتقال إلى عرض معين
    const goToView = useCallback((view, data = null) => {
        setWidgetView(view);
        if (view === 'detail' && data) {
            setSelectedTicket(data);
        }
    }, []);

    // العودة للخلف
    const goBack = useCallback(() => {
        if (widgetView === 'detail') {
            setWidgetView('tickets');
            setSelectedTicket(null);
        } else if (widgetView === 'create' || widgetView === 'tickets') {
            setWidgetView('main');
        }
    }, [widgetView]);

    // التذاكر النشطة (غير مغلقة أو ملغاة)
    const activeTickets = useMemo(() => {
        const tickets = Array.isArray(myTickets) ? myTickets : [];
        return tickets.filter(t =>
            ![TICKET_STATUS.CLOSED, TICKET_STATUS.CANCELLED].includes(t.status)
        );
    }, [myTickets]);

    // التذاكر المحلولة (بانتظار التقييم)
    const resolvedTickets = useMemo(() => {
        const tickets = Array.isArray(myTickets) ? myTickets : [];
        return tickets.filter(t => t.status === TICKET_STATUS.RESOLVED);
    }, [myTickets]);

    // إحصائيات سريعة
    const quickStats = useMemo(() => {
        return {
            total: Array.isArray(myTickets) ? myTickets.length : 0,
            active: activeTickets.length,
            resolved: resolvedTickets.length,
            assets: Array.isArray(myAssets) ? myAssets.length : 0,
            unread: unreadCount,
        };
    }, [myTickets, activeTickets, resolvedTickets, myAssets, unreadCount]);

    const value = {
        // حالة الـ Widget
        isWidgetOpen,
        widgetView,
        selectedTicket,

        // البيانات
        myTickets,
        myAssets,
        categories,
        activeTickets,
        resolvedTickets,
        unreadCount,
        quickStats,

        // حالات التحميل
        loading,
        error,

        // الدوال
        toggleWidget,
        openWidget,
        closeWidget,
        goToView,
        goBack,
        createTicket,
        rateTicket,
        addComment,
        refreshTickets,
        refreshAssets,
        loadInitialData,

        // الثوابت
        TICKET_STATUS,
        TICKET_PRIORITY,
        STATUS_LABELS,
        PRIORITY_LABELS,
        STATUS_COLORS,
        PRIORITY_COLORS,
    };

    return (
        <ITSMContext.Provider value={value}>
            {children}
        </ITSMContext.Provider>
    );
}

export const useITSM = () => {
    const context = useContext(ITSMContext);
    if (!context) {
        throw new Error('useITSM must be used within ITSMProvider');
    }
    return context;
};

export default ITSMContext;
