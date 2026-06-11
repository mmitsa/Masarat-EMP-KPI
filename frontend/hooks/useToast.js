/**
 * Toast Hook - نظام الإشعارات المنبثقة
 * 
 * يوفر نظام إشعارات موحد للمنصة
 * @version 1.0.0
 * @date 2026-02-07
 */

import { create } from 'zustand';

// Store للإشعارات
export const useToastStore = create((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = Date.now() + Math.random();
        const newToast = {
            id,
            variant: 'info',
            duration: 5000,
            ...toast,
        };
        
        set((state) => ({
            toasts: [...state.toasts, newToast]
        }));

        // إزالة تلقائية بعد المدة المحددة
        if (newToast.duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter(t => t.id !== id)
                }));
            }, newToast.duration);
        }

        return id;
    },
    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter(t => t.id !== id)
        }));
    },
    clearAll: () => set({ toasts: [] }),
}));

// Standalone toast object for use outside React components (e.g., in utility files)
export const toast = {
    success: (title, options = {}) => {
        const { addToast } = useToastStore.getState();
        const message = typeof options === 'string' ? options : options?.description || '';
        return addToast({ variant: 'success', title, message, duration: 5000 });
    },
    error: (title, options = {}) => {
        const { addToast } = useToastStore.getState();
        const message = typeof options === 'string' ? options : options?.description || '';
        return addToast({ variant: 'error', title, message, duration: 7000 });
    },
    warning: (title, options = {}) => {
        const { addToast } = useToastStore.getState();
        const message = typeof options === 'string' ? options : options?.description || '';
        return addToast({ variant: 'warning', title, message, duration: 6000 });
    },
    info: (title, options = {}) => {
        const { addToast } = useToastStore.getState();
        const message = typeof options === 'string' ? options : options?.description || '';
        return addToast({ variant: 'info', title, message, duration: 5000 });
    },
};

// Hook للاستخدام في المكونات
export const useToast = () => {
    const addToast = useToastStore((state) => state.addToast);
    const removeToast = useToastStore((state) => state.removeToast);
    const clearAll = useToastStore((state) => state.clearAll);

    return {
        // إشعار نجاح
        success: (title, message = '', duration = 5000) => {
            return addToast({ variant: 'success', title, message, duration });
        },
        
        // إشعار خطأ
        error: (title, message = '', duration = 7000) => {
            return addToast({ variant: 'error', title, message, duration });
        },
        
        // إشعار تحذير
        warning: (title, message = '', duration = 6000) => {
            return addToast({ variant: 'warning', title, message, duration });
        },
        
        // إشعار معلومات
        info: (title, message = '', duration = 5000) => {
            return addToast({ variant: 'info', title, message, duration });
        },
        
        // إضافة إشعار مخصص
        custom: (toast) => {
            return addToast(toast);
        },
        
        // إزالة إشعار
        remove: removeToast,
        
        // مسح جميع الإشعارات
        clearAll,
    };
};
