import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

/**
 * سياق الشريط الإخباري - إدارة الأخبار والتعميمات
 * الإصدار 2.0 — متصل بقاعدة البيانات عبر /api/admin/news-ticker
 */

const NewsTickerContext = createContext(null);

// أنواع الأخبار
export const NEWS_TYPES = {
    announcement: { icon: '📢', label: 'تعميم', color: 'blue' },
    event: { icon: '📅', label: 'فعالية', color: 'purple' },
    news: { icon: '📰', label: 'خبر', color: 'green' },
    decision: { icon: '⚖️', label: 'قرار', color: 'amber' },
    thanks: { icon: '🏆', label: 'شكر', color: 'emerald' },
};

// مصادر الأخبار (الموديولات)
export const NEWS_SOURCES = {
    general: 'عام',
    hr: 'الموارد البشرية',
    warehouse: 'المستودعات',
    movement: 'الحركة والأسطول',
    finance: 'المالية',
    archiving: 'الأرشفة',
    projects: 'المشاريع',
    itsm: 'الدعم الفني',
    admin: 'الإدارة',
};

// الأولويات
export const NEWS_PRIORITIES = {
    low: { label: 'عادي', color: 'gray' },
    medium: { label: 'متوسط', color: 'blue' },
    high: { label: 'مهم', color: 'amber' },
    urgent: { label: 'عاجل', color: 'red' },
};

const API_URL = '/api/admin/news-ticker';

// Actions
const ACTIONS = {
    SET_ITEMS: 'SET_ITEMS',
    ADD_ITEM: 'ADD_ITEM',
    UPDATE_ITEM: 'UPDATE_ITEM',
    DELETE_ITEM: 'DELETE_ITEM',
    TOGGLE_MINIMIZE: 'TOGGLE_MINIMIZE',
    SET_LOADING: 'SET_LOADING',
};

function reducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_ITEMS:
            return { ...state, allItems: action.payload, loading: false };
        case ACTIONS.ADD_ITEM:
            return { ...state, allItems: [action.payload, ...state.allItems] };
        case ACTIONS.UPDATE_ITEM:
            return {
                ...state,
                allItems: state.allItems.map((item) =>
                    item.id === action.payload.id ? { ...item, ...action.payload } : item
                ),
            };
        case ACTIONS.DELETE_ITEM:
            return {
                ...state,
                allItems: state.allItems.filter((item) => item.id !== action.payload),
            };
        case ACTIONS.TOGGLE_MINIMIZE:
            return { ...state, isMinimized: !state.isMinimized };
        case ACTIONS.SET_LOADING:
            return { ...state, loading: action.payload };
        default:
            return state;
    }
}

export function NewsTickerProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, {
        allItems: [],
        isMinimized: false,
        loading: true,
    });

    const hasFetched = useRef(false);

    // ── تحميل الأخبار من الـ API عند بدء التطبيق ─────────────────
    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        async function fetchNews() {
            dispatch({ type: ACTIONS.SET_LOADING, payload: true });
            try {
                const res = await fetch(API_URL);
                if (!res.ok) {
                    dispatch({ type: ACTIONS.SET_ITEMS, payload: [] });
                    return;
                }
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    dispatch({ type: ACTIONS.SET_ITEMS, payload: data.data });
                } else {
                    dispatch({ type: ACTIONS.SET_ITEMS, payload: [] });
                }
            } catch (err) {
                dispatch({ type: ACTIONS.SET_ITEMS, payload: [] });
            }
        }

        fetchNews();
    }, []);

    // ── تحميل حالة الإخفاء من localStorage ─────────────────────
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('news-ticker-minimized');
            if (saved === 'true') {
                dispatch({ type: ACTIONS.TOGGLE_MINIMIZE });
            }
        }
    }, []);

    // ── حفظ حالة الإخفاء ────────────────────────────────────────
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('news-ticker-minimized', String(state.isMinimized));
        }
    }, [state.isMinimized]);

    // ── الأخبار المنشورة فقط (غير المنتهية) ────────────────────
    const publishedItems = useMemo(() => {
        const now = new Date();
        const items = Array.isArray(state.allItems) ? state.allItems : [];
        return items.filter(
            (item) =>
                item.status === 'published' &&
                (!item.expiresAt || new Date(item.expiresAt) > now)
        );
    }, [state.allItems]);

    // ── إضافة خبر جديد ── POST /api/admin/news-ticker ──────────
    const addItem = useCallback(async (item) => {
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
            });
            const data = await res.json();
            if (data.success && data.data) {
                dispatch({ type: ACTIONS.ADD_ITEM, payload: data.data });
                return data.data;
            }
        } catch (err) {
            console.error('[NewsTicker] Failed to add item:', err);
        }
        return null;
    }, []);

    // ── تعديل خبر ── PUT /api/admin/news-ticker?id=X ───────────
    const updateItem = useCallback(async (id, updates) => {
        try {
            const res = await fetch(`${API_URL}?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            const data = await res.json();
            if (data.success && data.data) {
                dispatch({ type: ACTIONS.UPDATE_ITEM, payload: data.data });
                return data.data;
            }
        } catch (err) {
            console.error('[NewsTicker] Failed to update item:', err);
        }
        return null;
    }, []);

    // ── حذف خبر ── DELETE /api/admin/news-ticker?id=X ───────────
    const deleteItem = useCallback(async (id) => {
        try {
            const res = await fetch(`${API_URL}?id=${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                dispatch({ type: ACTIONS.DELETE_ITEM, payload: id });
                return true;
            }
        } catch (err) {
            console.error('[NewsTicker] Failed to delete item:', err);
        }
        return false;
    }, []);

    // ── نشر خبر ── PATCH /api/admin/news-ticker?id=X ────────────
    const publishItem = useCallback(async (id) => {
        try {
            const res = await fetch(`${API_URL}?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'published' }),
            });
            const data = await res.json();
            if (data.success && data.data) {
                dispatch({ type: ACTIONS.UPDATE_ITEM, payload: data.data });
                return true;
            }
        } catch (err) {
            console.error('[NewsTicker] Failed to publish item:', err);
        }
        return false;
    }, []);

    // ── إلغاء نشر خبر ── PATCH ──────────────────────────────────
    const unpublishItem = useCallback(async (id) => {
        try {
            const res = await fetch(`${API_URL}?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'draft' }),
            });
            const data = await res.json();
            if (data.success && data.data) {
                dispatch({ type: ACTIONS.UPDATE_ITEM, payload: data.data });
                return true;
            }
        } catch (err) {
            console.error('[NewsTicker] Failed to unpublish item:', err);
        }
        return false;
    }, []);

    // ── أرشفة خبر ── PATCH ──────────────────────────────────────
    const archiveItem = useCallback(async (id) => {
        try {
            const res = await fetch(`${API_URL}?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'archived' }),
            });
            const data = await res.json();
            if (data.success && data.data) {
                dispatch({ type: ACTIONS.UPDATE_ITEM, payload: data.data });
                return true;
            }
        } catch (err) {
            console.error('[NewsTicker] Failed to archive item:', err);
        }
        return false;
    }, []);

    // ── إعادة تحميل البيانات من الـ API ─────────────────────────
    const refreshItems = useCallback(async () => {
        try {
            const res = await fetch(API_URL);
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                dispatch({ type: ACTIONS.SET_ITEMS, payload: data.data });
            }
        } catch (err) {
            console.error('[NewsTicker] Failed to refresh:', err);
        }
    }, []);

    const toggleMinimize = useCallback(() => {
        dispatch({ type: ACTIONS.TOGGLE_MINIMIZE });
    }, []);

    const value = useMemo(
        () => ({
            allItems: state.allItems,
            publishedItems,
            isMinimized: state.isMinimized,
            loading: state.loading,
            addItem,
            updateItem,
            deleteItem,
            publishItem,
            unpublishItem,
            archiveItem,
            toggleMinimize,
            refreshItems,
        }),
        [state, publishedItems, addItem, updateItem, deleteItem, publishItem, unpublishItem, archiveItem, toggleMinimize, refreshItems]
    );

    return (
        <NewsTickerContext.Provider value={value}>
            {children}
        </NewsTickerContext.Provider>
    );
}

export function useNewsTicker() {
    const ctx = useContext(NewsTickerContext);
    if (!ctx) {
        // Fallback for components outside provider
        return {
            allItems: [],
            publishedItems: [],
            isMinimized: false,
            loading: false,
            addItem: async () => null,
            updateItem: async () => null,
            deleteItem: async () => false,
            publishItem: async () => false,
            unpublishItem: async () => false,
            archiveItem: async () => false,
            toggleMinimize: () => {},
            refreshItems: async () => {},
        };
    }
    return ctx;
}
