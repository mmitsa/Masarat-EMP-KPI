import React from 'react';
import { useITSM } from '../../context/ITSMContext';

/**
 * زر الدعم الفني العائم
 * يظهر في أسفل الشاشة للسماح للموظفين بطلب الدعم الفني
 */
export default function SupportButton() {
    const { toggleWidget, unreadCount, isWidgetOpen } = useITSM();

    return (
        <button
            onClick={toggleWidget}
            className={`
                group relative
                w-14 h-14
                rounded-2xl
                shadow-lg
                transition-all duration-300 ease-out
                hover:shadow-2xl hover:scale-110
                focus:outline-none focus:ring-4 focus:ring-yellow-400/50
                ${isWidgetOpen
                    ? 'bg-gray-700 text-white rotate-0'
                    : 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white'
                }
            `}
            style={{
                boxShadow: isWidgetOpen
                    ? '0 4px 15px rgba(0,0,0,0.2)'
                    : '0 8px 32px rgba(251, 146, 60, 0.4), 0 4px 16px rgba(234, 88, 12, 0.3)'
            }}
            title="طلب دعم فني"
            aria-label="طلب دعم فني"
        >
            {/* خلفية متوهجة */}
            {!isWidgetOpen && (
                <span className="
                    absolute inset-0
                    rounded-2xl
                    bg-gradient-to-br from-amber-400 via-orange-500 to-red-500
                    opacity-0 group-hover:opacity-100
                    blur-xl
                    transition-opacity duration-300
                    -z-10
                " />
            )}

            {/* أيقونة الدعم */}
            <span className="relative flex items-center justify-center w-full h-full">
                {isWidgetOpen ? (
                    // أيقونة الإغلاق
                    <svg
                        className="w-6 h-6 transition-transform duration-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                ) : (
                    // أيقونة سماعة الدعم الفني (Headset)
                    <svg
                        className="w-7 h-7 transition-transform duration-300 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        {/* السماعة */}
                        <path
                            d="M4 12V11C4 6.58172 7.58172 3 12 3C16.4183 3 20 6.58172 20 11V12"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                        />
                        {/* السماعة اليسرى */}
                        <path
                            d="M2 15.5V14.5C2 13.1193 3.11929 12 4.5 12H5C5.55228 12 6 12.4477 6 13V17C6 17.5523 5.55228 18 5 18H4.5C3.11929 18 2 16.8807 2 15.5Z"
                            fill="currentColor"
                        />
                        {/* السماعة اليمنى */}
                        <path
                            d="M22 15.5V14.5C22 13.1193 20.8807 12 19.5 12H19C18.4477 12 18 12.4477 18 13V17C18 17.5523 18.4477 18 19 18H19.5C20.8807 18 22 16.8807 22 15.5Z"
                            fill="currentColor"
                        />
                        {/* الميكروفون */}
                        <path
                            d="M18 18V19C18 20.6569 16.6569 22 15 22H14"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                        />
                        <circle cx="12" cy="22" r="1.5" fill="currentColor" />
                    </svg>
                )}
            </span>

            {/* عداد الإشعارات */}
            {unreadCount > 0 && !isWidgetOpen && (
                <span className="
                    absolute -top-1.5 -right-1.5
                    min-w-[22px] h-[22px]
                    px-1.5
                    bg-red-500 text-white text-xs font-bold
                    rounded-full
                    flex items-center justify-center
                    shadow-lg
                    animate-bounce
                    border-2 border-white
                ">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}

            {/* تلميح عند المرور */}
            <span className="
                absolute left-full mr-3 ml-3
                px-3 py-1.5
                bg-gray-900 text-white text-sm
                rounded-lg
                opacity-0 group-hover:opacity-100
                pointer-events-none
                transition-opacity duration-200
                whitespace-nowrap
                shadow-lg
                z-50
            ">
                طلب دعم فني
                <span className="
                    absolute top-1/2 -translate-y-1/2 -right-1
                    w-2 h-2
                    bg-gray-900
                    rotate-45
                " />
            </span>

            {/* نبض مستمر عند وجود إشعارات */}
            {unreadCount > 0 && !isWidgetOpen && (
                <span className="
                    absolute inset-0
                    rounded-2xl
                    border-2 border-orange-400
                    animate-ping
                    opacity-75
                " />
            )}
        </button>
    );
}
