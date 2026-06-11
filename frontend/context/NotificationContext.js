import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import ToastContainer from '../components/ui/ToastContainer';

const NotificationContext = createContext({
    notify: () => {},
    success: () => {},
    error: () => {},
    info: () => {},
    warning: () => {},
});

let toastId = 0;

/**
 * معالج المعاملات المرنة - يدعم عدة أنماط للاستدعاء:
 * toast.success('رسالة')
 * toast.success('عنوان', 'رسالة')
 * toast.success('رسالة', { title: 'عنوان', duration: 5000 })
 * toast.success('عنوان', { message: 'رسالة' })
 */
function parseArgs(firstArg, secondArg) {
    // toast.success('message')
    if (!secondArg) {
        return { message: firstArg };
    }
    // toast.success('message', { ...options })
    if (typeof secondArg === 'object') {
        return { message: firstArg, ...secondArg };
    }
    // toast.success('title', 'message')
    if (typeof secondArg === 'string') {
        return { title: firstArg, message: secondArg };
    }
    return { message: firstArg };
}

export function NotificationProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const remove = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const add = useCallback((toast) => {
        toastId += 1;
        const id = toastId;
        const payload = {
            id,
            title: toast.title || '',
            message: toast.message || '',
            variant: toast.variant || 'info',
            duration: toast.duration ?? 4000,
        };
        setToasts((prev) => [...prev, payload]);
        if (payload.duration > 0) {
            setTimeout(() => remove(id), payload.duration);
        }
    }, [remove]);

    const api = useMemo(() => ({
        notify: add,
        success: (first, second) => add({ ...parseArgs(first, second), variant: 'success' }),
        error: (first, second) => add({ ...parseArgs(first, second), variant: 'error', duration: 6000 }),
        info: (first, second) => add({ ...parseArgs(first, second), variant: 'info' }),
        warning: (first, second) => add({ ...parseArgs(first, second), variant: 'warning', duration: 5000 }),
    }), [add]);

    return (
        <NotificationContext.Provider value={api}>
            {children}
            <ToastContainer toasts={toasts} onClose={remove} />
        </NotificationContext.Provider>
    );
}

export const useToast = () => useContext(NotificationContext);
