import React, { useState, useEffect } from 'react';
import { useSmartAssistant } from '../../context/SmartAssistantContext';
import { useUser } from '../../context/AppContext';
import { useRouter } from 'next/router';

// بوب أب الترحيب الأولي
export function WelcomePopup({ darkMode = false }) {
    const { showWelcomePopup, dismissWelcomePopup, getPersonalGreeting, moduleKnowledge } = useSmartAssistant();
    const user = useUser();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (showWelcomePopup) {
            setTimeout(() => setIsVisible(true), 100);
        } else {
            setIsVisible(false);
        }
    }, [showWelcomePopup]);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(dismissWelcomePopup, 300);
    };

    if (!showWelcomePopup) return null;

    const firstName = user?.name?.split(' ')[0] || 'المستخدم';
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء النور';

    return (
        <div
            className={`fixed bottom-24 left-6 z-50 transition-all duration-500 transform ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
            dir="rtl"
        >
            <div
                className={`relative max-w-sm rounded-2xl shadow-2xl overflow-hidden ${
                    darkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-900'
                }`}
            >
                {/* Header with gradient */}
                <div
                    className="p-4 pb-12"
                    style={{ background: `linear-gradient(135deg, ${moduleKnowledge?.color || '#3b82f6'}, #8b5cf6)` }}
                >
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 left-3 p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Avatar */}
                <div className="relative -mt-8 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg border-4 border-white">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 pt-4 text-center">
                    <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {timeGreeting} {firstName}! 👋
                    </h3>
                    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        أهلاً بك في منصة مسارات! أنا المساعد الذكي، جاهز لمساعدتك في إنجاز أعمالك.
                    </p>

                    <div className="space-y-2">
                        <button
                            onClick={handleDismiss}
                            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                        >
                            ابدأ العمل
                        </button>
                        <button
                            onClick={handleDismiss}
                            className={`w-full py-2.5 rounded-xl font-medium transition-colors ${
                                darkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                            }`}
                        >
                            لا تظهر مرة أخرى
                        </button>
                    </div>
                </div>

                {/* Speech bubble tail */}
                <div
                    className={`absolute -bottom-2 left-8 w-4 h-4 transform rotate-45 ${
                        darkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-900'
                    }`}
                ></div>
            </div>
        </div>
    );
}

// بوب أب التلميحات الدورية
export function TipPopup({ darkMode = false }) {
    const { showAssistantTip, currentTip, dismissTip, moduleKnowledge } = useSmartAssistant();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (showAssistantTip) {
            setTimeout(() => setIsVisible(true), 100);
        } else {
            setIsVisible(false);
        }
    }, [showAssistantTip]);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(dismissTip, 300);
    };

    if (!showAssistantTip || !currentTip) return null;

    const getTipIcon = (type) => {
        switch (type) {
            case 'warning':
                return '⚠️';
            case 'policy':
                return '📋';
            case 'reminder':
                return '⏰';
            default:
                return '💡';
        }
    };

    const getTipColor = (type) => {
        switch (type) {
            case 'warning':
                return { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-800 dark:text-yellow-200' };
            case 'policy':
                return { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-800 dark:text-purple-200' };
            case 'reminder':
                return { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200', text: 'text-orange-800 dark:text-orange-200' };
            default:
                return { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-200' };
        }
    };

    const colors = getTipColor(currentTip.type);

    return (
        <div
            className={`fixed bottom-24 left-6 z-40 transition-all duration-500 transform ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
            dir="rtl"
        >
            <div
                className={`relative max-w-xs p-4 rounded-2xl shadow-lg border ${colors.bg} ${colors.border}`}
            >
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 left-2 p-1 rounded-full hover:bg-white/50 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex gap-3">
                    <div className="text-2xl shrink-0">{getTipIcon(currentTip.type)}</div>
                    <div>
                        <h4 className={`font-bold text-sm mb-1 ${colors.text}`}>
                            {currentTip.title}
                        </h4>
                        <p className={`text-xs ${colors.text} opacity-80`}>
                            {currentTip.content}
                        </p>
                    </div>
                </div>

                {/* Tail */}
                <div
                    className={`absolute -bottom-2 left-8 w-4 h-4 transform rotate-45 ${colors.bg} border-b border-r ${colors.border}`}
                ></div>
            </div>
        </div>
    );
}

// بوب أب التوجيه السياقي
export function ContextualHelpPopup({
    isOpen,
    onClose,
    title,
    content,
    tips = [],
    actions = [],
    position = 'bottom-right',
    darkMode = false
}) {
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setIsVisible(true), 100);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    if (!isOpen) return null;

    const getPositionClasses = () => {
        switch (position) {
            case 'top-right':
                return 'top-20 left-6';
            case 'top-left':
                return 'top-20 right-6';
            case 'bottom-left':
                return 'bottom-24 right-6';
            case 'center':
                return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
            default:
                return 'bottom-24 left-6';
        }
    };

    return (
        <div
            className={`fixed ${getPositionClasses()} z-40 transition-all duration-500 transform ${
                isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
            }`}
            dir="rtl"
        >
            <div
                className={`relative max-w-sm rounded-2xl shadow-2xl overflow-hidden ${
                    darkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-900'
                }`}
            >
                {/* Header */}
                <div className="bg-gradient-to-l from-blue-500 to-purple-600 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-white font-bold">{title}</h3>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                        {content}
                    </p>

                    {/* Tips */}
                    {tips.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {tips.map((tip, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-xl ${
                                        darkMode ? 'bg-gray-700/50' : 'bg-blue-50 dark:bg-blue-900/20'
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg">💡</span>
                                        <div>
                                            <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                {tip.title}
                                            </p>
                                            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {tip.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    {actions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {actions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (action.path) router.push(action.path);
                                        if (action.onClick) action.onClick();
                                        handleDismiss();
                                    }}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                        action.primary
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : darkMode
                                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-200'
                                    }`}
                                >
                                    {action.icon && <span>{action.icon}</span>}
                                    <span>{action.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// مكون البالون العائم للتلميحات
export function FloatingTipBalloon({
    message,
    icon = '💡',
    position = { x: 'left-6', y: 'bottom-24' },
    duration = 5000,
    onDismiss,
    darkMode = false
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 100);

        if (duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onDismiss]);

    return (
        <div
            className={`fixed ${position.x} ${position.y} z-30 transition-all duration-500 transform ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
            dir="rtl"
        >
            <div
                className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg ${
                    darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'
                }`}
            >
                <span className="text-xl">{icon}</span>
                <p className="text-sm">{message}</p>
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(onDismiss, 300);
                    }}
                    className={`p-1 rounded-full ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Animation dots */}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {duration > 0 && (
                        <div
                            className="h-1 bg-blue-500 rounded-full animate-shrink"
                            style={{
                                width: '60px',
                                animation: `shrink ${duration}ms linear forwards`
                            }}
                        ></div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes shrink {
                    from { width: 60px; }
                    to { width: 0; }
                }
            `}</style>
        </div>
    );
}

export default { WelcomePopup, TipPopup, ContextualHelpPopup, FloatingTipBalloon };
