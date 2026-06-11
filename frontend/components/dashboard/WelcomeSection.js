import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * WelcomeSection Component - قسم الترحيب
 *
 * يعرض ترحيب شخصي للمستخدم مع الوقت والتاريخ
 *
 * @example
 * <WelcomeSection
 *   userName="أحمد محمد"
 *   userRole="مدير الموارد البشرية"
 * />
 */
const WelcomeSection = memo(function WelcomeSection({
    userName = 'مستخدم',
    userRole = 'موظف',
    userAvatar,
    showDate = true,
    showQuote = true,
    darkMode = false,
    className = '',
}) {
    const [greeting, setGreeting] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [currentTime, setCurrentTime] = useState('');

    // تحديث الوقت والتحية
    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const hours = now.getHours();

            // التحية حسب الوقت
            if (hours >= 5 && hours < 12) {
                setGreeting('صباح الخير');
            } else if (hours >= 12 && hours < 17) {
                setGreeting('مساء الخير');
            } else if (hours >= 17 && hours < 21) {
                setGreeting('مساء النور');
            } else {
                setGreeting('مساء الخير');
            }

            // التاريخ
            setCurrentDate(now.toLocaleDateString('ar-SA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }));

            // الوقت
            setCurrentTime(now.toLocaleTimeString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit'
            }));
        };

        updateDateTime();
        const interval = setInterval(updateDateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // اقتباسات تحفيزية
    const quotes = [
        { text: 'النجاح هو مجموع الجهود الصغيرة المتكررة يومياً', author: 'روبرت كولير' },
        { text: 'الإنجاز يبدأ بقرار المحاولة', author: 'غير معروف' },
        { text: 'العمل الجاد يتغلب على الموهبة عندما تفشل الموهبة في العمل الجاد', author: 'تيم نوتكي' },
        { text: 'لا تنتظر الظروف المثالية، ابدأ من حيث أنت', author: 'آرثر آش' },
    ];

    const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);

    return (
        <div
            className={`
                relative overflow-hidden rounded-2xl p-6 lg:p-8
                ${darkMode
                    ? 'bg-gradient-to-br from-primary-900 via-primary-800 to-neutral-900'
                    : 'bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700'
                }
                ${className}
            `}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <pattern id="welcome-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                            <circle cx="1" cy="1" r="1" fill="white" />
                        </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#welcome-pattern)" />
                </svg>
            </div>

            {/* Content */}
            <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        {userAvatar ? (
                            <img
                                src={userAvatar}
                                alt={userName}
                                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/20"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center ring-4 ring-white/10">
                                <span className="text-2xl font-bold text-white">
                                    {userName.charAt(0)}
                                </span>
                            </div>
                        )}

                        {/* Greeting */}
                        <div>
                            <p className="text-white/80 text-sm mb-1">{greeting} 👋</p>
                            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                                {userName}
                            </h1>
                            <p className="text-white/70 text-sm">{userRole}</p>
                        </div>
                    </div>

                    {/* Date & Time */}
                    {showDate && (
                        <div className="text-right">
                            <div className="text-4xl lg:text-5xl font-bold text-white mb-1">
                                {currentTime}
                            </div>
                            <p className="text-white/70 text-sm">{currentDate}</p>
                        </div>
                    )}
                </div>

                {/* Quote */}
                {showQuote && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-white/90 text-sm italic">"{quote.text}"</p>
                        <p className="text-white/60 text-xs mt-1">— {quote.author}</p>
                    </div>
                )}
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-gold-500/10 rounded-full blur-3xl" />
        </div>
    );
});

WelcomeSection.displayName = 'WelcomeSection';

WelcomeSection.propTypes = {
    /** اسم المستخدم */
    userName: PropTypes.string,
    /** دور المستخدم */
    userRole: PropTypes.string,
    /** صورة المستخدم */
    userAvatar: PropTypes.string,
    /** إظهار التاريخ */
    showDate: PropTypes.bool,
    /** إظهار الاقتباس */
    showQuote: PropTypes.bool,
    /** الوضع المظلم */
    darkMode: PropTypes.bool,
    /** Classes إضافية */
    className: PropTypes.string,
};

export default WelcomeSection;
