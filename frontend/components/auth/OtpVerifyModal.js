/**
 * OtpVerifyModal - نافذة التحقق من الهوية برمز OTP
 * تستخدم في تسجيل الدخول والعمليات الحساسة
 * تدعم 6 خانات رقمية مع لصق وإرسال تلقائي
 */
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import PropTypes from 'prop-types';

/**
 * تنسيق الوقت المتبقي بصيغة MM:SS
 */
function formatTime(totalSeconds) {
    if (totalSeconds <= 0) return '00:00';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * حساب الثواني المتبقية من تاريخ انتهاء
 */
function getSecondsRemaining(expiresAt) {
    if (!expiresAt) return 0;
    const now = Date.now();
    const expiry = typeof expiresAt === 'number' ? expiresAt : new Date(expiresAt).getTime();
    return Math.max(0, Math.floor((expiry - now) / 1000));
}

// ============================================================
// المكون الرئيسي
// ============================================================
const OtpVerifyModal = memo(function OtpVerifyModal({
    visible,
    onClose,
    onVerify,
    onResend,
    maskedPhone,
    maskedEmail,
    expiresAt,
    codeLength = 6,
    remainingAttempts,
    isLocked = false,
    lockoutSeconds = 0,
}) {
    // حالات المكون
    const [digits, setDigits] = useState(() => Array(codeLength).fill(''));
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [shaking, setShaking] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(() => getSecondsRemaining(expiresAt));
    const [resendCooldown, setResendCooldown] = useState(0);
    const [lockoutRemaining, setLockoutRemaining] = useState(lockoutSeconds);

    // مراجع DOM
    const inputRefs = useRef([]);
    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);

    // ============================================================
    // مؤقت العد التنازلي لانتهاء الصلاحية
    // ============================================================
    useEffect(() => {
        if (!visible || !expiresAt) return;
        setSecondsLeft(getSecondsRemaining(expiresAt));

        const interval = setInterval(() => {
            const remaining = getSecondsRemaining(expiresAt);
            setSecondsLeft(remaining);
            if (remaining <= 0) clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [visible, expiresAt]);

    // ============================================================
    // مؤقت تبريد إعادة الإرسال
    // ============================================================
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // ============================================================
    // مؤقت القفل
    // ============================================================
    useEffect(() => {
        setLockoutRemaining(lockoutSeconds);
    }, [lockoutSeconds]);

    useEffect(() => {
        if (lockoutRemaining <= 0) return;
        const timer = setInterval(() => {
            setLockoutRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [lockoutRemaining]);

    // ============================================================
    // إعادة تعيين عند الفتح / الإغلاق
    // ============================================================
    useEffect(() => {
        if (visible) {
            setDigits(Array(codeLength).fill(''));
            setError('');
            setShaking(false);
            setVerifying(false);
            setResending(false);
            previousActiveElement.current = document.activeElement;
            // التركيز على أول خانة
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } else {
            previousActiveElement.current?.focus?.();
        }
    }, [visible, codeLength]);

    // ============================================================
    // قفل التمرير وإغلاق بالـ Escape
    // ============================================================
    useEffect(() => {
        if (!visible) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();

            // حبس التركيز داخل النافذة
            if (e.key === 'Tab' && modalRef.current) {
                const focusable = modalRef.current.querySelectorAll(
                    'button, input, [tabindex]:not([tabindex="-1"])'
                );
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first?.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [visible, onClose]);

    // ============================================================
    // تشغيل اهتزاز الخطأ
    // ============================================================
    const triggerShake = useCallback((msg) => {
        setError(msg);
        setShaking(true);
        setTimeout(() => setShaking(false), 600);
    }, []);

    // ============================================================
    // إرسال الرمز
    // ============================================================
    const submitOtp = useCallback(async (code) => {
        if (verifying || isLocked || lockoutRemaining > 0) return;
        if (code.length !== codeLength) return;

        setVerifying(true);
        setError('');

        try {
            await onVerify(code);
        } catch (err) {
            const message = err?.message || 'رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى.';
            triggerShake(message);
            // مسح الخانات بعد الخطأ
            setDigits(Array(codeLength).fill(''));
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } finally {
            setVerifying(false);
        }
    }, [verifying, isLocked, lockoutRemaining, codeLength, onVerify, triggerShake]);

    // ============================================================
    // معالجة الإدخال في خانة واحدة
    // ============================================================
    const handleInput = useCallback((index, value) => {
        // قبول رقم واحد فقط
        const digit = value.replace(/\D/g, '').slice(-1);

        setDigits((prev) => {
            const next = [...prev];
            next[index] = digit;

            // إرسال تلقائي عند اكتمال جميع الخانات
            if (digit && next.every((d) => d !== '')) {
                setTimeout(() => submitOtp(next.join('')), 50);
            }

            return next;
        });

        // الانتقال للخانة التالية
        if (digit && index < codeLength - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    }, [codeLength, submitOtp]);

    // ============================================================
    // معالجة لوحة المفاتيح (Backspace / Arrow keys)
    // ============================================================
    const handleKeyDown = useCallback((index, e) => {
        if (e.key === 'Backspace') {
            if (digits[index] === '' && index > 0) {
                // خانة فارغة: رجوع للخانة السابقة ومسحها
                setDigits((prev) => {
                    const next = [...prev];
                    next[index - 1] = '';
                    return next;
                });
                inputRefs.current[index - 1]?.focus();
                e.preventDefault();
            } else {
                // مسح الخانة الحالية
                setDigits((prev) => {
                    const next = [...prev];
                    next[index] = '';
                    return next;
                });
            }
        } else if (e.key === 'ArrowRight' && index > 0) {
            // RTL: السهم اليمين = الخانة السابقة
            inputRefs.current[index - 1]?.focus();
            e.preventDefault();
        } else if (e.key === 'ArrowLeft' && index < codeLength - 1) {
            // RTL: السهم اليسار = الخانة التالية
            inputRefs.current[index + 1]?.focus();
            e.preventDefault();
        } else if (e.key === 'Enter') {
            const code = digits.join('');
            if (code.length === codeLength) {
                submitOtp(code);
            }
        }
    }, [digits, codeLength, submitOtp]);

    // ============================================================
    // معالجة اللصق
    // ============================================================
    const handlePaste = useCallback((e) => {
        e.preventDefault();
        const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, codeLength);
        if (!pasted) return;

        const newDigits = Array(codeLength).fill('');
        for (let i = 0; i < pasted.length; i++) {
            newDigits[i] = pasted[i];
        }
        setDigits(newDigits);

        // التركيز على الخانة المناسبة
        const focusIndex = Math.min(pasted.length, codeLength - 1);
        inputRefs.current[focusIndex]?.focus();

        // إرسال تلقائي إذا اكتمل الرمز
        if (pasted.length === codeLength) {
            setTimeout(() => submitOtp(newDigits.join('')), 50);
        }
    }, [codeLength, submitOtp]);

    // ============================================================
    // إعادة إرسال الرمز
    // ============================================================
    const handleResend = useCallback(async () => {
        if (resendCooldown > 0 || resending) return;

        setResending(true);
        setError('');

        try {
            await onResend();
            setResendCooldown(60); // تبريد 60 ثانية
            setDigits(Array(codeLength).fill(''));
            inputRefs.current[0]?.focus();
        } catch (err) {
            triggerShake(err?.message || 'فشل إعادة الإرسال. حاول مرة أخرى.');
        } finally {
            setResending(false);
        }
    }, [resendCooldown, resending, onResend, codeLength, triggerShake]);

    // ============================================================
    // الضغط على زر التحقق
    // ============================================================
    const handleVerifyClick = useCallback(() => {
        const code = digits.join('');
        if (code.length !== codeLength) {
            triggerShake('يرجى إدخال الرمز كاملاً');
            return;
        }
        submitOtp(code);
    }, [digits, codeLength, submitOtp, triggerShake]);

    // ============================================================
    // قيم مشتقة
    // ============================================================
    const isExpired = secondsLeft <= 0 && expiresAt;
    const isCodeComplete = digits.every((d) => d !== '');
    const effectivelyLocked = isLocked || lockoutRemaining > 0;

    const attemptsColor =
        remainingAttempts == null
            ? 'text-gray-500 dark:text-gray-400'
            : remainingAttempts <= 1
            ? 'text-red-600 dark:text-red-400'
            : remainingAttempts <= 3
            ? 'text-amber-600'
            : 'text-gray-500 dark:text-gray-400';

    const maskedTarget = maskedPhone || maskedEmail || '';

    if (!visible) return null;

    // ============================================================
    // العرض
    // ============================================================
    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4" dir="rtl">
            {/* ===== خلفية معتمة مع ضبابية ===== */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* ===== بطاقة النافذة ===== */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="otp-modal-title"
                aria-describedby="otp-modal-desc"
                className="relative z-[1110] w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 animate-slideUp"
                style={{ fontFamily: "'IBM Plex Sans Arabic', 'Cairo', sans-serif" }}
            >
                {/* ===== زر الإغلاق ===== */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 left-4 p-2 rounded-xl hover:bg-gray-100 transition-colors z-10"
                    aria-label="إغلاق النافذة"
                >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-6 sm:p-8">
                    {/* ===== الأيقونة والعنوان ===== */}
                    <div className="text-center mb-6">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-[#1d4ed8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                />
                            </svg>
                        </div>

                        <h2 id="otp-modal-title" className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "'Cairo', sans-serif" }}>
                            التحقق من الهوية
                        </h2>

                        <p id="otp-modal-desc" className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            تم إرسال رمز التحقق إلى
                            {maskedTarget && (
                                <span className="block mt-1 font-semibold text-gray-700 dark:text-gray-200 tracking-wide" dir="ltr">
                                    {maskedTarget}
                                </span>
                            )}
                        </p>
                    </div>

                    {/* ===== حالة القفل ===== */}
                    {effectivelyLocked && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
                                    />
                                </svg>
                                <span className="font-bold text-red-700 dark:text-red-300">تم قفل الحساب مؤقتاً</span>
                            </div>
                            <p className="text-sm text-red-600 dark:text-red-400">
                                تجاوزت الحد المسموح من المحاولات.
                                {lockoutRemaining > 0 && (
                                    <span className="block mt-1 font-semibold">
                                        يمكنك المحاولة بعد {formatTime(lockoutRemaining)}
                                    </span>
                                )}
                            </p>
                        </div>
                    )}

                    {/* ===== خانات الإدخال ===== */}
                    {!effectivelyLocked && (
                        <>
                            <div
                                className={`flex justify-center gap-2 sm:gap-3 mb-4 ${shaking ? 'animate-otp-shake' : ''}`}
                                dir="ltr"
                            >
                                {digits.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => { inputRefs.current[idx] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={1}
                                        value={digit}
                                        disabled={verifying || isExpired}
                                        onChange={(e) => handleInput(idx, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(idx, e)}
                                        onPaste={handlePaste}
                                        onFocus={(e) => e.target.select()}
                                        className={`
                                            w-11 h-14 sm:w-12 sm:h-16
                                            text-center text-xl sm:text-2xl font-bold
                                            rounded-xl border-2 outline-none
                                            transition-all duration-200
                                            ${error
                                                ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                                : digit
                                                ? 'border-[#1d4ed8] bg-blue-50 dark:bg-blue-900/20 text-[#1d4ed8] focus:ring-2 focus:ring-blue-200'
                                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-[#1d4ed8] focus:ring-2 focus:ring-blue-200'
                                            }
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                        `}
                                        aria-label={`رقم ${idx + 1} من ${codeLength}`}
                                    />
                                ))}
                            </div>

                            {/* ===== رسالة الخطأ ===== */}
                            {error && (
                                <div className={`mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center ${shaking ? 'animate-otp-shake' : ''}`}>
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <span className="text-sm font-medium text-red-700 dark:text-red-300">{error}</span>
                                    </div>
                                </div>
                            )}

                            {/* ===== المؤقت + المحاولات المتبقية ===== */}
                            <div className="flex items-center justify-between mb-6 text-sm">
                                {/* المؤقت */}
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    {isExpired ? (
                                        <span className="text-red-600 dark:text-red-400 font-medium">انتهت صلاحية الرمز</span>
                                    ) : expiresAt ? (
                                        <span className={`font-medium tabular-nums ${secondsLeft <= 30 ? 'text-red-600' : secondsLeft <= 60 ? 'text-amber-600' : 'text-gray-600 dark:text-gray-300'}`}>
                                            {formatTime(secondsLeft)}
                                        </span>
                                    ) : null}
                                </div>

                                {/* المحاولات المتبقية */}
                                {remainingAttempts != null && (
                                    <div className={`flex items-center gap-1.5 ${attemptsColor}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                            />
                                        </svg>
                                        <span className="font-medium">
                                            {remainingAttempts === 1 ? 'محاولة أخيرة' : `${remainingAttempts} محاولات متبقية`}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* ===== زر التحقق ===== */}
                            <button
                                type="button"
                                onClick={handleVerifyClick}
                                disabled={!isCodeComplete || verifying || isExpired}
                                className={`
                                    w-full py-3.5 rounded-xl text-base font-bold
                                    text-white
                                    transition-all duration-200
                                    focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    ${isCodeComplete && !verifying && !isExpired
                                        ? 'bg-gradient-to-l from-[#1d4ed8] to-[#2563eb] hover:from-[#1e40af] hover:to-[#1d4ed8] shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
                                        : 'bg-gray-300'
                                    }
                                `}
                                aria-busy={verifying}
                            >
                                {verifying ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        جاري التحقق...
                                    </span>
                                ) : (
                                    'تحقق من الرمز'
                                )}
                            </button>
                        </>
                    )}

                    {/* ===== إعادة الإرسال ===== */}
                    <div className="mt-5 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">لم يصلك الرمز؟</p>
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resendCooldown > 0 || resending || effectivelyLocked}
                            className={`
                                text-sm font-semibold
                                transition-all duration-200
                                disabled:cursor-not-allowed
                                ${resendCooldown > 0 || resending || effectivelyLocked
                                    ? 'text-gray-400'
                                    : 'text-[#1d4ed8] hover:text-[#1e40af] hover:underline'
                                }
                            `}
                        >
                            {resending ? (
                                <span className="flex items-center justify-center gap-1.5">
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    جاري الإرسال...
                                </span>
                            ) : resendCooldown > 0 ? (
                                <span className="tabular-nums">
                                    إعادة الإرسال بعد {resendCooldown} ثانية
                                </span>
                            ) : (
                                'إعادة إرسال الرمز'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== تعريف حركة الاهتزاز ===== */}
            <style jsx>{`
                @keyframes otpShake {
                    0%, 100% { transform: translateX(0); }
                    10%, 50%, 90% { transform: translateX(-4px); }
                    30%, 70% { transform: translateX(4px); }
                }
                .animate-otp-shake {
                    animation: otpShake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
});

OtpVerifyModal.displayName = 'OtpVerifyModal';

OtpVerifyModal.propTypes = {
    /** إظهار النافذة */
    visible: PropTypes.bool.isRequired,
    /** دالة الإغلاق */
    onClose: PropTypes.func.isRequired,
    /** دالة التحقق - تستقبل رمز OTP كنص (async) */
    onVerify: PropTypes.func.isRequired,
    /** دالة إعادة الإرسال (async) */
    onResend: PropTypes.func.isRequired,
    /** رقم الجوال المقنّع */
    maskedPhone: PropTypes.string,
    /** البريد الإلكتروني المقنّع */
    maskedEmail: PropTypes.string,
    /** وقت انتهاء الصلاحية (timestamp أو Date string) */
    expiresAt: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** عدد خانات الرمز */
    codeLength: PropTypes.number,
    /** عدد المحاولات المتبقية */
    remainingAttempts: PropTypes.number,
    /** هل الحساب مقفل؟ */
    isLocked: PropTypes.bool,
    /** مدة القفل بالثواني */
    lockoutSeconds: PropTypes.number,
};

export default OtpVerifyModal;
