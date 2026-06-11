import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAnnouncementPopup, ANNOUNCEMENT_TYPES, ANNOUNCEMENT_PRIORITIES } from '../../context/AnnouncementPopupContext';
import { Button, Badge } from '../ui';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../../context/AppContext';

import { fmtDate } from '../../utils/hijriDate';

/**
 * AnnouncementPopup - النافذة المنبثقة الإلزامية للإعلانات
 *
 * - لا يمكن إغلاقها بـ Escape أو الضغط على الـ overlay
 * - مؤقت إلزامي (افتراضي 15 ثانية) قبل تفعيل زر الإقرار
 * - z-index: 1100 (أعلى من كل شيء)
 * - عرض تتابعي للإعلانات المتعددة
 */
export default function AnnouncementPopup() {
    const { isPopupOpen, currentAnnouncement, acknowledgeAnnouncement, pendingCount } = useAnnouncementPopup();
    const { darkMode } = useTheme();
    const [remainingSeconds, setRemainingSeconds] = useState(15);
    const [isAcknowledging, setIsAcknowledging] = useState(false);
    const [mounted, setMounted] = useState(false);
    const startTimeRef = useRef(null);
    const buttonRef = useRef(null);

    // Portal mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // إعادة تعيين المؤقت عند تغيير الإعلان
    useEffect(() => {
        if (currentAnnouncement) {
            setRemainingSeconds(currentAnnouncement.timerDuration || 15);
            startTimeRef.current = Date.now();
            setIsAcknowledging(false);
        }
    }, [currentAnnouncement?.id]);

    // العد التنازلي
    useEffect(() => {
        if (!isPopupOpen || remainingSeconds <= 0) return;

        const timer = setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPopupOpen, remainingSeconds > 0]);

    // منع Escape
    useEffect(() => {
        if (!isPopupOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        document.addEventListener('keydown', handleKeyDown, true);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.body.style.overflow = '';
        };
    }, [isPopupOpen]);

    // تركيز على الزر عند تفعيله
    useEffect(() => {
        if (remainingSeconds === 0 && buttonRef.current) {
            buttonRef.current.focus();
        }
    }, [remainingSeconds]);

    // معالجة الإقرار
    const handleAcknowledge = useCallback(async () => {
        if (remainingSeconds > 0 || isAcknowledging || !currentAnnouncement) return;

        setIsAcknowledging(true);
        const viewDuration = Math.round((Date.now() - startTimeRef.current) / 1000);

        try {
            acknowledgeAnnouncement(currentAnnouncement.id, viewDuration);
        } catch {
            setIsAcknowledging(false);
        }
    }, [remainingSeconds, isAcknowledging, currentAnnouncement, acknowledgeAnnouncement]);

    if (!mounted || !isPopupOpen || !currentAnnouncement) return null;

    const typeInfo = ANNOUNCEMENT_TYPES[currentAnnouncement.type] || ANNOUNCEMENT_TYPES.general;
    const priorityInfo = ANNOUNCEMENT_PRIORITIES[currentAnnouncement.priority] || ANNOUNCEMENT_PRIORITIES.normal;
    const timerTotal = currentAnnouncement.timerDuration || 15;
    const progress = ((timerTotal - remainingSeconds) / timerTotal) * 100;
    const isReady = remainingSeconds === 0;

    const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700';
    const textPrimary = darkMode ? 'text-white' : 'text-gray-900 dark:text-white';
    const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-600';
    const textMuted = darkMode ? 'text-gray-400' : 'text-gray-500';

    const badgeColors = {
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
        purple: 'bg-purple-100 text-purple-700 dark:text-purple-300',
        emerald: 'bg-emerald-100 text-emerald-700',
        amber: 'bg-amber-100 text-amber-700',
        gray: 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    };

    return createPortal(
        <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 1100 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="announcement-title"
            aria-describedby="announcement-content"
            dir="rtl"
        >
            {/* Overlay - لا يمكن الإغلاق بالضغط */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* البطاقة الرئيسية */}
            <div className={`relative w-full max-w-2xl ${cardBg} rounded-2xl shadow-2xl border overflow-hidden animate-in`}>

                {/* شريط علوي ملون حسب النوع */}
                <div className={`h-1.5 ${
                    typeInfo.color === 'red' ? 'bg-red-500' :
                    typeInfo.color === 'purple' ? 'bg-purple-500' :
                    typeInfo.color === 'emerald' ? 'bg-emerald-500' :
                    typeInfo.color === 'amber' ? 'bg-amber-500' :
                    'bg-blue-500'
                }`} />

                {/* Header */}
                <div className="px-6 pt-5 pb-3">
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badgeColors[typeInfo.color] || badgeColors.blue}`}>
                            <span>{typeInfo.icon}</span>
                            {typeInfo.label}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badgeColors[priorityInfo.color] || badgeColors.gray}`}>
                            {priorityInfo.label}
                        </span>
                        {pendingCount > 1 && (
                            <span className={`mr-auto text-xs ${textMuted}`}>
                                {pendingCount} إعلانات معلقة
                            </span>
                        )}
                    </div>
                    <h2
                        id="announcement-title"
                        className={`text-xl font-bold ${textPrimary}`}
                    >
                        {currentAnnouncement.titleAr}
                    </h2>
                    {currentAnnouncement.createdBy && (
                        <p className={`text-sm mt-1 ${textMuted}`}>
                            بواسطة: {currentAnnouncement.createdBy}
                            {currentAnnouncement.publishedAt && (
                                <span className="mr-3">
                                    {fmtDate(currentAnnouncement.publishedAt)}
                                </span>
                            )}
                        </p>
                    )}
                </div>

                {/* Body - scrollable */}
                <div className="px-6 pb-4 max-h-[50vh] overflow-y-auto" id="announcement-content">
                    {/* صورة البانر */}
                    {currentAnnouncement.imageUrl && (
                        <div className="mb-4 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700/50">
                            <img
                                src={currentAnnouncement.imageUrl}
                                alt={currentAnnouncement.titleAr}
                                className="w-full max-h-[400px] object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </div>
                    )}

                    {/* المحتوى */}
                    <div className={`text-base leading-relaxed whitespace-pre-wrap ${textSecondary}`}>
                        {currentAnnouncement.contentAr}
                    </div>
                </div>

                {/* Footer - المؤقت والزر */}
                <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 dark:border-gray-800 bg-gray-50/50'}`}>
                    <div className="flex items-center justify-between gap-4">

                        {/* العداد التنازلي الدائري */}
                        <div className="flex items-center gap-3">
                            <div className="relative w-14 h-14">
                                {/* دائرة الخلفية */}
                                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                                    <circle
                                        cx="28" cy="28" r="24"
                                        fill="none"
                                        stroke={darkMode ? '#374151' : '#e5e7eb'}
                                        strokeWidth="4"
                                    />
                                    {/* دائرة التقدم */}
                                    <circle
                                        cx="28" cy="28" r="24"
                                        fill="none"
                                        stroke={isReady ? '#10b981' : '#1d4ed8'}
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 24}`}
                                        strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                                        className="transition-all duration-1000 ease-linear"
                                    />
                                </svg>
                                {/* الرقم بالداخل */}
                                <div className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${
                                    isReady ? 'text-green-500' : 'text-blue-600 dark:text-blue-400'
                                }`}>
                                    {isReady ? (
                                        <CheckCircleIcon className="w-7 h-7 text-green-500" />
                                    ) : (
                                        remainingSeconds
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className={`text-sm font-medium ${textPrimary}`}>
                                    {isReady ? 'يمكنك المتابعة الآن' : 'يرجى قراءة الإعلان'}
                                </p>
                                <p className={`text-xs ${textMuted}`}>
                                    {isReady
                                        ? 'اضغط على الزر للمتابعة'
                                        : `${remainingSeconds} ثانية متبقية`
                                    }
                                </p>
                            </div>
                        </div>

                        {/* زر الإقرار */}
                        <Button
                            ref={buttonRef}
                            variant={isReady ? 'primary' : 'ghost'}
                            size="lg"
                            disabled={!isReady || isAcknowledging}
                            loading={isAcknowledging}
                            onClick={handleAcknowledge}
                            className={`min-w-[160px] ${
                                !isReady ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {isAcknowledging
                                ? 'جاري التسجيل...'
                                : isReady
                                    ? 'تم العلم'
                                    : `تم العلم (${remainingSeconds})`
                            }
                        </Button>
                    </div>
                </div>
            </div>

            {/* Animation styles */}
            <style jsx>{`
                .animate-in {
                    animation: slideUp 0.4s ease-out;
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px) scale(0.97);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>,
        document.body
    );
}
