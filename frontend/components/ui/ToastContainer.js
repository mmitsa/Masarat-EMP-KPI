import React, { useEffect, useState } from 'react';

// ══════════════════════════════════════════════════════════════
// أيقونات التنبيهات
// ══════════════════════════════════════════════════════════════
const IconClose = ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const IconCheck = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
);

const IconInfo = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
    </svg>
);

const IconWarn = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a1 1 0 00.86 1.5h18.64a1 1 0 00.86-1.5L13.71 3.86a1 1 0 00-1.72 0z" />
    </svg>
);

const IconError = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// ══════════════════════════════════════════════════════════════
// أنماط التنبيهات
// ══════════════════════════════════════════════════════════════
const variantConfig = {
    success: {
        containerClass: 'bg-white dark:bg-gray-800 border-green-500',
        iconBg: 'bg-green-100 dark:bg-green-900/40',
        iconColor: 'text-green-600 dark:text-green-400',
        titleColor: 'text-green-800 dark:text-green-200',
        progressColor: 'bg-green-500',
        Icon: IconCheck,
    },
    error: {
        containerClass: 'bg-white dark:bg-gray-800 border-red-500',
        iconBg: 'bg-red-100 dark:bg-red-900/40',
        iconColor: 'text-red-600 dark:text-red-400',
        titleColor: 'text-red-800 dark:text-red-200',
        progressColor: 'bg-red-500',
        Icon: IconError,
    },
    warning: {
        containerClass: 'bg-white dark:bg-gray-800 border-amber-500',
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        iconColor: 'text-amber-600 dark:text-amber-400',
        titleColor: 'text-amber-800 dark:text-amber-200',
        progressColor: 'bg-amber-500',
        Icon: IconWarn,
    },
    info: {
        containerClass: 'bg-white dark:bg-gray-800 border-blue-500',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        iconColor: 'text-blue-600 dark:text-blue-400',
        titleColor: 'text-blue-800 dark:text-blue-200',
        progressColor: 'bg-blue-500',
        Icon: IconInfo,
    },
};

// ══════════════════════════════════════════════════════════════
// Toast Item - عنصر تنبيه واحد
// ══════════════════════════════════════════════════════════════
function ToastItem({ toast, onClose }) {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);
    const config = variantConfig[toast.variant] || variantConfig.info;
    const { Icon } = config;
    const duration = toast.duration || 4000;

    useEffect(() => {
        if (duration <= 0) return;

        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining <= 0) clearInterval(interval);
        }, 50);

        return () => clearInterval(interval);
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose?.(toast.id), 300);
    };

    return (
        <div
            className={`
                ${config.containerClass}
                relative overflow-hidden
                border-r-4 border-t border-b border-l
                border-t-gray-200 border-b-gray-200 border-l-gray-200
                dark:border-t-gray-700 dark:border-b-gray-700 dark:border-l-gray-700
                shadow-xl dark:shadow-2xl dark:shadow-black/30
                rounded-xl p-4
                flex items-start gap-3
                transition-all duration-300 ease-out
                ${isExiting ? 'opacity-0 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'}
            `}
            style={{ animation: isExiting ? undefined : 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
            role="status"
            aria-live="polite"
        >
            {/* أيقونة */}
            <div className={`w-9 h-9 rounded-lg ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>

            {/* المحتوى */}
            <div className="flex-1 min-w-0 pt-0.5">
                {toast.title && (
                    <p className={`text-sm font-bold ${config.titleColor}`}>
                        {toast.title}
                    </p>
                )}
                {toast.message && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 whitespace-pre-line leading-relaxed">
                        {toast.message}
                    </p>
                )}
            </div>

            {/* زر الإغلاق */}
            <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                aria-label="إغلاق التنبيه"
            >
                <IconClose />
            </button>

            {/* شريط التقدم */}
            {duration > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-700">
                    <div
                        className={`h-full ${config.progressColor} transition-all duration-100 ease-linear rounded-full`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// Toast Container - حاوية التنبيهات
// ══════════════════════════════════════════════════════════════
export default function ToastContainer({ toasts, onClose }) {
    if (!toasts || toasts.length === 0) return null;

    // عرض آخر 5 تنبيهات فقط
    const visibleToasts = toasts.slice(-5);

    return (
        <>
            <div
                className="fixed top-4 left-4 z-[9999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
                dir="rtl"
            >
                {visibleToasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItem toast={toast} onClose={onClose} />
                    </div>
                ))}
            </div>

            <style jsx global>{`
                @keyframes toastSlideIn {
                    0% {
                        opacity: 0;
                        transform: translateX(-24px) scale(0.96);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }
            `}</style>
        </>
    );
}
