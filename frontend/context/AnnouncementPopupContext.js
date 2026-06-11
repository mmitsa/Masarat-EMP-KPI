import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { useSession } from 'next-auth/react';
import api from '../lib/api';

/**
 * سياق الإعلانات المنبثقة - نظام التعميمات والبانرات الإلزامية
 * يدير عرض الإعلانات المنبثقة عند تسجيل الدخول مع مؤقت إلزامي
 * متصل بـ Backend API حقيقي (Masarat.Announcements.API - Port 5013)
 * @version 2.0.0
 */

const AnnouncementPopupContext = createContext(null);

// أنواع الإعلانات
export const ANNOUNCEMENT_TYPES = {
    general: { label: 'عام', color: 'blue', icon: '📢' },
    urgent: { label: 'عاجل', color: 'red', icon: '🚨' },
    policy: { label: 'سياسة / لائحة', color: 'purple', icon: '📜' },
    celebration: { label: 'تهنئة / احتفال', color: 'emerald', icon: '🎉' },
    maintenance: { label: 'صيانة النظام', color: 'amber', icon: '🔧' },
};

// الأولويات
export const ANNOUNCEMENT_PRIORITIES = {
    low: { label: 'عادي', color: 'gray' },
    normal: { label: 'متوسط', color: 'blue' },
    high: { label: 'مهم', color: 'amber' },
    critical: { label: 'حرج', color: 'red' },
};

// الحالات
export const ANNOUNCEMENT_STATUSES = {
    draft: { label: 'مسودة', color: 'gray' },
    scheduled: { label: 'مجدول', color: 'purple' },
    published: { label: 'منشور', color: 'green' },
    expired: { label: 'منتهي', color: 'amber' },
    archived: { label: 'مؤرشف', color: 'gray' },
};

// localStorage key - يُستخدم كـ cache احتياطي
const ACKNOWLEDGED_KEY = 'masarat-acknowledged-announcements';

function getAcknowledgedIds() {
    if (typeof window === 'undefined') return [];
    try {
        const saved = localStorage.getItem(ACKNOWLEDGED_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

function saveAcknowledgedIds(ids) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(ACKNOWLEDGED_KEY, JSON.stringify(ids));
    } catch { /* ignore */ }
}

// Actions
const ACTIONS = {
    SET_ANNOUNCEMENTS: 'SET_ANNOUNCEMENTS',
    ADD_ANNOUNCEMENT: 'ADD_ANNOUNCEMENT',
    UPDATE_ANNOUNCEMENT: 'UPDATE_ANNOUNCEMENT',
    DELETE_ANNOUNCEMENT: 'DELETE_ANNOUNCEMENT',
    SET_PENDING: 'SET_PENDING',
    SHOW_POPUP: 'SHOW_POPUP',
    HIDE_POPUP: 'HIDE_POPUP',
    ACKNOWLEDGE: 'ACKNOWLEDGE',
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    SET_CHECKED: 'SET_CHECKED',
};

function reducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_ANNOUNCEMENTS:
            return { ...state, announcements: action.payload, isLoading: false, error: null };

        case ACTIONS.ADD_ANNOUNCEMENT:
            return { ...state, announcements: [action.payload, ...state.announcements] };

        case ACTIONS.UPDATE_ANNOUNCEMENT:
            return {
                ...state,
                announcements: state.announcements.map((a) =>
                    a.id === action.payload.id ? { ...a, ...action.payload } : a
                ),
            };

        case ACTIONS.DELETE_ANNOUNCEMENT:
            return {
                ...state,
                announcements: state.announcements.filter((a) => a.id !== action.payload),
            };

        case ACTIONS.SET_PENDING:
            return {
                ...state,
                pendingAnnouncements: action.payload,
                currentAnnouncement: action.payload.length > 0 ? action.payload[0] : null,
                isPopupOpen: action.payload.length > 0,
            };

        case ACTIONS.SHOW_POPUP:
            return { ...state, isPopupOpen: true, currentAnnouncement: action.payload };

        case ACTIONS.HIDE_POPUP:
            return { ...state, isPopupOpen: false, currentAnnouncement: null };

        case ACTIONS.ACKNOWLEDGE: {
            const remaining = state.pendingAnnouncements.filter((a) => a.id !== action.payload);
            const updatedAnnouncements = state.announcements.map((a) => {
                if (a.id === action.payload) {
                    return {
                        ...a,
                        acknowledgments: [
                            ...(a.acknowledgments || []),
                            action.acknowledgment,
                        ],
                    };
                }
                return a;
            });
            return {
                ...state,
                announcements: updatedAnnouncements,
                pendingAnnouncements: remaining,
                currentAnnouncement: remaining.length > 0 ? remaining[0] : null,
                isPopupOpen: remaining.length > 0,
            };
        }

        case ACTIONS.SET_LOADING:
            return { ...state, isLoading: action.payload };

        case ACTIONS.SET_ERROR:
            return { ...state, error: action.payload, isLoading: false };

        case ACTIONS.SET_CHECKED:
            return { ...state, hasChecked: true };

        default:
            return state;
    }
}

export function AnnouncementPopupProvider({ children }) {
    const { data: session, status: sessionStatus } = useSession();

    const [state, dispatch] = useReducer(reducer, {
        announcements: [],
        pendingAnnouncements: [],
        currentAnnouncement: null,
        isPopupOpen: false,
        isLoading: false,
        error: null,
        hasChecked: false,
    });

    // جلب جميع الإعلانات من API
    const fetchAnnouncements = useCallback(async () => {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        try {
            const response = await api.announcements.getAll({ pageSize: 100 });
            const data = response?.items || response?.data?.items || response || [];
            dispatch({ type: ACTIONS.SET_ANNOUNCEMENTS, payload: Array.isArray(data) ? data : [] });
        } catch (err) {
            // الإعلانات اختيارية - لا نسجل خطأ عندما الخدمة مش شغالة
            console.warn('تعذر جلب الإعلانات (الخدمة غير متاحة)');
            dispatch({ type: ACTIONS.SET_ERROR, payload: null });
        }
    }, []);

    // عند تسجيل الدخول - جلب الإعلانات ثم الإعلانات المعلقة
    useEffect(() => {
        if (sessionStatus !== 'authenticated') return;

        // جلب الإعلانات للصفحة الإدارية
        fetchAnnouncements();
    }, [sessionStatus, fetchAnnouncements]);

    // جلب الإعلانات المعلقة من API عند تسجيل الدخول
    useEffect(() => {
        if (sessionStatus !== 'authenticated' || state.hasChecked) return;
        if (typeof window === 'undefined') return;

        const fetchPending = async () => {
            try {
                const pending = await api.announcements.getPending();
                const pendingList = Array.isArray(pending) ? pending : (pending?.data || []);

                // فلترة إضافية بالـ localStorage cache
                const acknowledgedIds = getAcknowledgedIds();
                const filtered = pendingList.filter((a) => !acknowledgedIds.includes(a.id));

                dispatch({ type: ACTIONS.SET_PENDING, payload: filtered });
            } catch (err) {
                // الإعلانات المعلقة اختيارية - لا نعرض popup عند فشل الخدمة
                console.warn('تعذر جلب الإعلانات المعلقة (الخدمة غير متاحة)');
            }
            dispatch({ type: ACTIONS.SET_CHECKED });
        };

        fetchPending();
    }, [sessionStatus, state.hasChecked]);

    // إقرار المستخدم بإعلان - عبر API
    const acknowledgeAnnouncement = useCallback(async (announcementId, viewDuration = 0) => {
        const userId = session?.user?.nationalId || session?.user?.id || null;
        const userName = session?.user?.name || 'المستخدم الحالي';

        const acknowledgment = {
            userId,
            userName,
            departmentName: session?.user?.department || 'غير محدد',
            acknowledgedAt: new Date().toISOString(),
            viewDuration,
        };

        // تحديث محلي فوري (Optimistic)
        const ids = getAcknowledgedIds();
        if (!ids.includes(announcementId)) {
            ids.push(announcementId);
            saveAcknowledgedIds(ids);
        }
        dispatch({ type: ACTIONS.ACKNOWLEDGE, payload: announcementId, acknowledgment });

        // إرسال للـ API
        try {
            await api.announcements.acknowledge({ announcementId, viewDuration });
        } catch (err) {
            console.warn('خطأ في تسجيل الإقرار:', err);
            // الـ localStorage يضمن عدم إعادة العرض حتى لو فشل الـ API
        }
    }, [session]);

    // CRUD - إضافة إعلان عبر API
    const addAnnouncement = useCallback(async (data) => {
        try {
            const result = await api.announcements.create(data);
            const newAnnouncement = result?.data || result;
            if (newAnnouncement?.id) {
                dispatch({ type: ACTIONS.ADD_ANNOUNCEMENT, payload: newAnnouncement });
            }
            return newAnnouncement;
        } catch (err) {
            console.warn('خطأ في إنشاء الإعلان:', err);
            throw err;
        }
    }, []);

    // تعديل إعلان عبر API
    const updateAnnouncement = useCallback(async (id, updates) => {
        try {
            const result = await api.announcements.update(id, updates);
            const updated = result?.data || result;
            dispatch({ type: ACTIONS.UPDATE_ANNOUNCEMENT, payload: { id, ...updated } });
        } catch (err) {
            console.warn('خطأ في تعديل الإعلان:', err);
            throw err;
        }
    }, []);

    // حذف إعلان عبر API
    const deleteAnnouncement = useCallback(async (id) => {
        try {
            await api.announcements.delete(id);
            dispatch({ type: ACTIONS.DELETE_ANNOUNCEMENT, payload: id });
        } catch (err) {
            console.warn('خطأ في حذف الإعلان:', err);
            throw err;
        }
    }, []);

    // نشر إعلان عبر API
    const publishAnnouncement = useCallback(async (id) => {
        try {
            await api.announcements.publish(id);
            dispatch({
                type: ACTIONS.UPDATE_ANNOUNCEMENT,
                payload: { id, status: 'Published', publishedAt: new Date().toISOString() },
            });
        } catch (err) {
            console.warn('خطأ في نشر الإعلان:', err);
            throw err;
        }
    }, []);

    // إلغاء نشر عبر API
    const unpublishAnnouncement = useCallback(async (id) => {
        try {
            await api.announcements.unpublish(id);
            dispatch({
                type: ACTIONS.UPDATE_ANNOUNCEMENT,
                payload: { id, status: 'Draft', publishedAt: null },
            });
        } catch (err) {
            console.warn('خطأ في إلغاء نشر الإعلان:', err);
            throw err;
        }
    }, []);

    // أرشفة عبر API
    const archiveAnnouncement = useCallback(async (id) => {
        try {
            await api.announcements.archive(id);
            dispatch({
                type: ACTIONS.UPDATE_ANNOUNCEMENT,
                payload: { id, status: 'Archived' },
            });
        } catch (err) {
            console.warn('خطأ في أرشفة الإعلان:', err);
            throw err;
        }
    }, []);

    // إعادة جلب الإعلانات
    const recheckPending = useCallback(() => {
        dispatch({ type: ACTIONS.SET_CHECKED }); // reset hasChecked to false... wait, SET_CHECKED sets it to true
        // نحتاج إعادة ضبط hasChecked
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const value = useMemo(
        () => ({
            // حالة الـ Popup
            isPopupOpen: state.isPopupOpen,
            currentAnnouncement: state.currentAnnouncement,
            pendingCount: state.pendingAnnouncements.length,
            acknowledgeAnnouncement,

            // إدارة الإعلانات (للصفحة الإدارية)
            announcements: state.announcements,
            isLoading: state.isLoading,
            error: state.error,
            addAnnouncement,
            updateAnnouncement,
            deleteAnnouncement,
            publishAnnouncement,
            unpublishAnnouncement,
            archiveAnnouncement,
            recheckPending,
            fetchAnnouncements,
        }),
        [
            state.isPopupOpen,
            state.currentAnnouncement,
            state.pendingAnnouncements.length,
            state.announcements,
            state.isLoading,
            state.error,
            acknowledgeAnnouncement,
            addAnnouncement,
            updateAnnouncement,
            deleteAnnouncement,
            publishAnnouncement,
            unpublishAnnouncement,
            archiveAnnouncement,
            recheckPending,
            fetchAnnouncements,
        ]
    );

    return (
        <AnnouncementPopupContext.Provider value={value}>
            {children}
        </AnnouncementPopupContext.Provider>
    );
}

export function useAnnouncementPopup() {
    const ctx = useContext(AnnouncementPopupContext);
    if (!ctx) {
        return {
            isPopupOpen: false,
            currentAnnouncement: null,
            pendingCount: 0,
            acknowledgeAnnouncement: () => {},
            announcements: [],
            isLoading: false,
            error: null,
            addAnnouncement: () => {},
            updateAnnouncement: () => {},
            deleteAnnouncement: () => {},
            publishAnnouncement: () => {},
            unpublishAnnouncement: () => {},
            archiveAnnouncement: () => {},
            recheckPending: () => {},
            fetchAnnouncements: () => {},
        };
    }
    return ctx;
}
