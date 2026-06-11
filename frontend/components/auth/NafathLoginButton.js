import React, { useState, useEffect } from 'react';
import { useNafathLogin, nafathAuthApi } from '../../lib/nafathService';

/**
 * مكون زر الدخول عبر نفاذ - يتكامل مع API حقيقي
 * يدعم: Polling و SignalR Real-time updates
 */
export default function NafathLoginButton() {
    const { step, randomNumber, countdown, error, login, reset } = useNafathLogin();
    const [nationalId, setNationalId] = useState('');
    const [nafathActive, setNafathActive] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    // التحقق من حالة نفاذ عند التحميل
    useEffect(() => {
        checkNafathStatus();
    }, []);

    const checkNafathStatus = async () => {
        try {
            const status = await nafathAuthApi.getStatus();
            setNafathActive(status.isActive);
        } catch (err) {
            console.warn('فشل التحقق من حالة نفاذ:', err);
            setNafathActive(false);
        } finally {
            setCheckingStatus(false);
        }
    };

    // إذا كان نفاذ غير مفعل، لا نعرض الزر
    if (checkingStatus) {
        return null; // أو يمكن عرض skeleton loader
    }

    if (!nafathActive) {
        return null;
    }

    return (
        <div className="mt-6">
            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-gray-100 dark:border-gray-800"></div>
                </div>
                <div className="relative flex justify-center">
                    <span className="px-4 bg-gradient-to-br from-slate-50 via-white to-blue-50 text-gray-400 text-sm font-medium">
                        أو الدخول عبر نفاذ
                    </span>
                </div>
            </div>

            {/* Nafath Login Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 shadow-lg">
                {step === 'idle' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">الدخول الموحد - نفاذ</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">تسجيل دخول آمن عبر الهوية الرقمية</p>
                            </div>
                        </div>

                        <input
                            type="text"
                            value={nationalId}
                            onChange={(e) => setNationalId(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="أدخل رقم الهوية الوطنية (10 أرقام)"
                            maxLength={10}
                            className="w-full px-4 py-3 border-2 border-green-200 dark:border-green-800 rounded-xl text-center text-lg font-mono tracking-wider focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all"
                        />

                        {nationalId.length > 0 && nationalId.length < 10 && (
                            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                                {10 - nationalId.length} أرقام متبقية
                            </div>
                        )}

                        <button
                            onClick={() => login(nationalId)}
                            disabled={nationalId.length !== 10}
                            className="w-full py-3 px-6 bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>دخول عبر نفاذ</span>
                        </button>
                    </div>
                )}

                {step === 'loading' && (
                    <div className="text-center py-8">
                        <svg className="animate-spin w-12 h-12 mx-auto text-green-600 dark:text-green-400 mb-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-700 dark:text-gray-200 font-semibold">جاري إرسال الطلب إلى نفاذ...</p>
                    </div>
                )}

                {step === 'waiting' && (
                    <div className="text-center py-6">
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-200 font-semibold mb-2">افتح تطبيق نفاذ واختر الرقم:</p>
                            <div className="text-7xl font-bold text-green-600 dark:text-green-400 my-6 animate-pulse" style={{ fontFamily: 'monospace' }}>
                                {randomNumber}
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-300 mb-4">
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>في انتظار التأكيد... ({countdown}s)</span>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-200">
                            💡 سيتم تحويلك تلقائياً بعد التأكيد
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">تم التحقق بنجاح!</h3>
                        <p className="text-gray-600 dark:text-gray-300">جاري تحويلك إلى لوحة التحكم...</p>
                    </div>
                )}

                {step === 'rejected' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">تم رفض الطلب</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">تم رفض طلب التوثيق من تطبيق نفاذ</p>
                        <button
                            onClick={reset}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            حاول مرة أخرى
                        </button>
                    </div>
                )}

                {step === 'expired' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-orange-600 mb-2">انتهت المهلة</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">انتهت مهلة التأكيد، حاول مرة أخرى</p>
                        <button
                            onClick={reset}
                            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            حاول مرة أخرى
                        </button>
                    </div>
                )}

                {step === 'error' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">حدث خطأ</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">{error || 'حدث خطأ غير متوقع'}</p>
                        <button
                            onClick={reset}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            حاول مرة أخرى
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
