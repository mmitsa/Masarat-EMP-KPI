import React, { useState, useEffect, useCallback, useRef } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { signIn, signOut, useSession } from 'next-auth/react';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import OtpVerifyModal from '../components/auth/OtpVerifyModal';

export default function LoginPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        rememberMe: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [currentTime, setCurrentTime] = useState('');
    const [greeting, setGreeting] = useState('');
    const [showSessionWarning, setShowSessionWarning] = useState(false);

    // النظام المستخرج مستقل: بعد الدخول يفتح قياس الأداء مباشرة
    const getLandingPage = (userSession) => {
        return router.query.callbackUrl || '/epm';
    };

    // OTP states
    const [otpRequired, setOtpRequired] = useState(false);
    const [otpSessionData, setOtpSessionData] = useState(null);
    const [otpRemainingAttempts, setOtpRemainingAttempts] = useState(null);
    const [otpIsLocked, setOtpIsLocked] = useState(false);
    const [otpLockoutSeconds, setOtpLockoutSeconds] = useState(0);

    // reCAPTCHA
    const recaptchaRef = useRef(null);
    const [recaptchaToken, setRecaptchaToken] = useState(null);
    const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
    const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    // Check if user is already logged in - show warning instead of auto-redirect
    useEffect(() => {
        if (status === 'authenticated' && session) {
            setShowSessionWarning(true);
        }
    }, [session, status]);

    // Handle logout to clear session and allow new login
    const handleClearSession = async () => {
        // Clear all storage
        if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
        }
        // Sign out without redirect
        await signOut({ redirect: false });
        // Clear warning
        setShowSessionWarning(false);
        setError('');
    };

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const hours = now.getHours();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            setCurrentTime(now.toLocaleDateString('ar-SA', options));

            if (hours >= 5 && hours < 12) {
                setGreeting('صباح الخير');
            } else if (hours >= 12 && hours < 17) {
                setGreeting('مساء الخير');
            } else {
                setGreeting('مساء النور');
            }
        };
        updateTime();
        const timer = setInterval(updateTime, 60000);
        return () => clearInterval(timer);
    }, []);

    // تهيئة reCAPTCHA widget
    useEffect(() => {
        if (recaptchaLoaded && recaptchaSiteKey && recaptchaRef.current) {
            try {
                if (recaptchaRef.current.childNodes.length === 0) {
                    window.grecaptcha.render(recaptchaRef.current, {
                        sitekey: recaptchaSiteKey,
                        callback: (token) => setRecaptchaToken(token),
                        'expired-callback': () => setRecaptchaToken(null),
                        hl: 'ar',
                        theme: 'light',
                    });
                }
            } catch (e) {
                // widget already rendered
            }
        }
    }, [recaptchaLoaded, recaptchaSiteKey]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // التحقق من reCAPTCHA
        if (recaptchaSiteKey && !recaptchaToken) {
            setError('يرجى إكمال التحقق من reCAPTCHA أولاً.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // تسجيل دخول مباشر عبر Identity API
            const result = await signIn('credentials', {
                username: formData.username,
                password: formData.password,
                redirect: false,
            });

            if (result?.ok) {
                // جلب الجلسة لمعرفة دور المستخدم وتوجيهه للصفحة المناسبة
                const freshSession = await getSession();
                const landingPage = getLandingPage(freshSession);
                router.push(landingPage);
            } else {
                setError(result?.error || 'بيانات الدخول غير صحيحة. يرجى التحقق من رقم الهوية وكلمة المرور.');
                setLoading(false);
            }
        } catch (err) {
            console.error('Login exception:', err);
            setError('فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى.');
            setLoading(false);
        }
    };

    // التحقق من رمز OTP - يرمي error ليتعامل معه OtpVerifyModal
    const handleOtpVerify = useCallback(async (otpCode) => {
        if (!otpSessionData?.sessionToken) return;

        const step2Res = await fetch('/api/auth/otp-step2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionToken: otpSessionData.sessionToken,
                otpCode,
            }),
        });

        const step2Data = await step2Res.json();

        if (!step2Res.ok || !step2Data.success) {
            // تحديث حالة القفل والمحاولات المتبقية
            if (step2Data.remainingAttempts !== undefined) {
                setOtpRemainingAttempts(step2Data.remainingAttempts);
            }
            if (step2Data.isLocked) {
                setOtpIsLocked(true);
                setOtpLockoutSeconds(step2Data.lockoutSeconds || 300);
            }
            // رمي الخطأ ليتعامل معه OtpVerifyModal
            throw new Error(step2Data.messageAr || step2Data.message || 'رمز التحقق غير صحيح');
        }

        // نجاح التحقق - تسجيل الدخول عبر NextAuth مع بيانات OTP
        const result = await signIn('credentials', {
            username: formData.username,
            password: formData.password,
            otpToken: step2Data.accessToken,
            otpUserData: JSON.stringify(step2Data.user),
            redirect: false,
        });

        if (result?.ok) {
            setOtpRequired(false);
            const freshSession = await getSession();
            router.push(getLandingPage(freshSession));
        } else {
            throw new Error(result?.error || 'فشل في إتمام تسجيل الدخول');
        }
    }, [otpSessionData, formData, router]);

    // إعادة إرسال رمز OTP
    const handleOtpResend = useCallback(async () => {
        try {
            const resendRes = await fetch('/api/auth/otp-step1', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nationalId: formData.username,
                    password: formData.password,
                    otpMethod: otpSessionData?.deliveryMethod || 'SMS',
                }),
            });

            const resendData = await resendRes.json();

            if (resendRes.ok && resendData.success) {
                setOtpSessionData(prev => ({
                    ...prev,
                    sessionToken: resendData.sessionToken,
                    expiresAt: resendData.otpExpiresAt,
                }));
                setOtpRemainingAttempts(null);
                setOtpIsLocked(false);
            } else {
                throw new Error(resendData.error || 'فشل في إعادة الإرسال');
            }
        } catch (err) {
            console.error('OTP resend error:', err);
            throw err;
        }
    }, [formData, otpSessionData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <>
            <Head>
                <title>تسجيل الدخول | نظام قياس الأداء الوظيفي</title>
                <meta name="description" content="تسجيل الدخول إلى نظام قياس الأداء الوظيفي" />
            </Head>

            {/* Google reCAPTCHA Script */}
            {recaptchaSiteKey && (
                <Script
                    src="https://www.google.com/recaptcha/api.js?render=explicit&hl=ar"
                    strategy="lazyOnload"
                    onLoad={() => setRecaptchaLoaded(true)}
                />
            )}

            <div className="min-h-screen flex" dir="rtl">
                {/* Left Side - Login Form */}
                <div className="epm-saudi-login w-full lg:w-[45%] flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l from-[#0A3319] via-[#165C2D] to-[#D4AF37]"></div>

                    <div className="w-full max-w-md relative z-10">
                        {/* Logo with background for transparent logo */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-lg shadow-green-900/10 mb-6 border border-green-900/10">
                                <div className="epm-saudi-login-mark w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold">
                                    ق
                                </div>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-950 dark:text-white">
                                {greeting}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">
                                سجّل دخولك للوصول إلى نظام قياس الأداء الوظيفي
                            </p>
                            <p className="text-gray-400 text-xs mt-1">{currentTime}</p>
                        </div>

                        <div className="mb-6 p-4 epm-saudi-soft border border-green-900/10 rounded-2xl text-sm">
                            <p className="font-bold mb-2">حساب التشغيل المحلي</p>
                            <div className="grid grid-cols-1 gap-1">
                                <span>رقم الهوية: <b dir="ltr">1000000001</b></span>
                                <span>كلمة المرور: <b dir="ltr">Mm123456</b></span>
                            </div>
                        </div>

                        {/* Session Warning - Already logged in */}
                        {showSessionWarning && !error && (
                            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-800 dark:text-amber-200 text-sm">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold mb-2">أنت مسجل دخول بالفعل</p>
                                        <p className="text-xs text-amber-700 mb-3">
                                            لديك جلسة نشطة في نظام قياس الأداء. يمكنك فتح النظام أو تسجيل الخروج لتسجيل دخول بحساب آخر.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => router.push('/epm')}
                                                className="px-4 py-2 epm-saudi-primary text-xs font-medium rounded-lg transition-colors"
                                            >
                                                فتح نظام قياس الأداء
                                            </button>
                                            <button
                                                onClick={handleClearSession}
                                                className="px-4 py-2 bg-white dark:bg-gray-900 hover:bg-amber-50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-xs font-medium rounded-lg transition-colors"
                                            >
                                                تسجيل خروج وتسجيل دخول بحساب آخر
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-2xl text-red-600 dark:text-red-400 text-sm flex items-center gap-3 animate-shake">
                                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Username Field */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    رقم الهوية
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400 group-focus-within:text-green-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full pr-12 pl-4 py-4 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-green-700 dark:focus:border-green-500 focus:ring-4 focus:ring-green-700/10 transition-all duration-200 shadow-sm dark:shadow-gray-900/20"
                                        placeholder="أدخل رقم الهوية"
                                        required
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    كلمة المرور
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400 group-focus-within:text-green-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full pr-12 pl-12 py-4 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-green-700 dark:focus:border-green-500 focus:ring-4 focus:ring-green-700/10 transition-all duration-200 shadow-sm dark:shadow-gray-900/20"
                                        placeholder="أدخل كلمة المرور"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 hover:text-green-700 transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* reCAPTCHA */}
                            {recaptchaSiteKey && (
                                <div className="flex justify-center">
                                    <div ref={recaptchaRef}></div>
                                </div>
                            )}

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            name="rememberMe"
                                            checked={formData.rememberMe}
                                            onChange={handleChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-lg peer-checked:bg-green-700 peer-checked:border-green-700 transition-all duration-200 peer-focus:ring-4 peer-focus:ring-green-700/20"></div>
                                        <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-800 transition-colors">تذكرني</span>
                                </label>
                                <span className="text-sm text-gray-400">دخول محلي للنظام</span>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-6 epm-saudi-primary font-bold rounded-2xl shadow-xl shadow-green-900/20 hover:shadow-green-900/25 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>جاري تسجيل الدخول...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>تسجيل الدخول</span>
                                        <svg className="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>
                        {/* Footer */}
                        <p className="text-center text-gray-400 text-xs mt-6">
                            نظام قياس الأداء الوظيفي &copy; {new Date().getFullYear()}
                        </p>
                    </div>
                </div>

                {/* OTP Verification Modal */}
                {otpRequired && (
                    <OtpVerifyModal
                        visible={otpRequired}
                        onClose={() => {
                            setOtpRequired(false);
                            setOtpSessionData(null);
                            setOtpRemainingAttempts(null);
                            setOtpIsLocked(false);
                        }}
                        onVerify={handleOtpVerify}
                        onResend={handleOtpResend}
                        maskedPhone={otpSessionData?.maskedPhone}
                        maskedEmail={otpSessionData?.maskedEmail}
                        expiresAt={otpSessionData?.expiresAt}
                        codeLength={otpSessionData?.codeLength || 6}
                        remainingAttempts={otpRemainingAttempts}
                        isLocked={otpIsLocked}
                        lockoutSeconds={otpLockoutSeconds}
                    />
                )}

                {/* Right Side - Branding */}
                <div className="epm-saudi-login-side hidden lg:flex lg:w-[55%] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-[0.04]"></div>
                    <div className="absolute inset-y-0 right-0 w-2 bg-[#D4AF37]"></div>

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
                        {/* Logo with glow effect for transparent background */}
                        <div className="mb-10 animate-fade-in relative">
                            <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/15">
                                <div className="w-32 h-32 rounded-3xl bg-white text-[#165C2D] flex items-center justify-center text-6xl font-bold shadow-2xl">
                                    ق
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl xl:text-4xl font-bold text-white text-center mb-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            نظام قياس الأداء الوظيفي
                        </h2>
                        <p className="text-lg xl:text-xl text-green-50/80 text-center mb-10 max-w-lg animate-fade-in" style={{ animationDelay: '0.4s' }}>
                            ميثاق الأداء، الأهداف، الجدارات، ومعايير التقييم الرسمية
                        </p>

                        {/* Features Grid */}
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 w-full max-w-2xl animate-fade-in" style={{ animationDelay: '0.6s' }}>
                            <FeatureCard
                                icon={<EPMIcon />}
                                title="ميثاق الأداء"
                                description="الأهداف والجدارات"
                                color="green"
                            />
                            <FeatureCard
                                icon={<ReportsIcon />}
                                title="التقييمات"
                                description="قياس ومراجعة الأداء"
                                color="amber"
                            />
                            <FeatureCard
                                icon={<ReportsIcon />}
                                title="التقارير"
                                description="نتائج ومؤشرات الأداء"
                                color="green"
                            />
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 xl:gap-10 mt-10 animate-fade-in" style={{ animationDelay: '0.8s' }}>
                            <StatItem value="100%" label="معايير رسمية" />
                            <div className="w-px h-12 bg-white/20"></div>
                            <StatItem value="1-5" label="مقياس التقييم" />
                            <div className="w-px h-12 bg-white/20"></div>
                            <StatItem value="EPM" label="نظام مستقل" />
                        </div>
                    </div>

                    {/* Bottom Copyright */}
                    <div className="absolute bottom-6 left-0 right-0 text-center">
                        <p className="text-green-50/45 text-sm">
                            نظام قياس الأداء الوظيفي &copy; {new Date().getFullYear()}
                        </p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
                    50% { transform: translateY(-30px) scale(1.5); opacity: 0.6; }
                }
                .animate-shake { animation: shake 0.5s ease-in-out; }
                .animate-fade-in { animation: fade-in 0.8s ease-out forwards; opacity: 0; }
                .animate-float { animation: float 8s ease-in-out infinite; }
            `}</style>
        </>
    );
}

function FeatureCard({ icon, title, description, color = 'green' }) {
    const colors = {
        green: 'from-white/16 to-white/6 border-white/16 hover:border-white/32',
        amber: 'from-amber-400/20 to-white/5 border-amber-300/30 hover:border-amber-200/60',
    };

    const iconColors = {
        green: 'text-green-100',
        amber: 'text-amber-200',
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color] || colors.green} backdrop-blur-sm rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] cursor-default group`}>
            <div className={`${iconColors[color] || iconColors.green} mb-2 group-hover:scale-105 transition-transform`}>
                {icon}
            </div>
            <h3 className="text-white font-bold text-sm mb-0.5">{title}</h3>
            <p className="text-green-50/65 text-xs">{description}</p>
        </div>
    );
}

function StatItem({ value, label }) {
    return (
        <div className="text-center group cursor-default">
            <div className="text-2xl xl:text-3xl font-bold text-white group-hover:text-amber-200 transition-colors">
                {value}
            </div>
            <div className="text-green-50/60 text-sm">{label}</div>
        </div>
    );
}

// Icons
function HRIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function WarehouseIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    );
}

function MovementIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
    );
}

function ArchiveIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
    );
}

function EPMIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    );
}

function ReportsIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

