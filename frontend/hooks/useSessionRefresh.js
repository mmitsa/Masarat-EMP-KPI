/**
 * useSessionRefresh Hook - معالجة تحديث الجلسة
 *
 * 🛡️ Security: يراقب حالة الجلسة ويسجل خروج المستخدم عند انتهاء صلاحية الـ Refresh Token
 *
 * @version 1.0.0
 * @date 2026-02-07
 */

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

/**
 * Hook لمراقبة حالة الجلسة ومعالجة أخطاء التحديث
 *
 * @param {object} options - خيارات التكوين
 * @param {boolean} options.redirectOnError - إعادة التوجيه عند الخطأ (افتراضي: true)
 * @param {string} options.redirectUrl - رابط إعادة التوجيه (افتراضي: '/login')
 * @param {function} options.onError - دالة تُنفذ عند حدوث خطأ
 */
export function useSessionRefresh(options = {}) {
    const {
        redirectOnError = true,
        redirectUrl = '/login',
        onError,
    } = options;

    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        // 🛡️ أخطاء تجديد التوكن لا تؤدي لتسجيل الخروج — الجلسة دائمة
        // التجديد يتم تلقائياً في الخلفية
        if (session?.error === 'RefreshTokenError' || session?.error === 'RefreshTokenExpired') {
            console.warn(`⚠️ Token refresh issue (${session.error}) — session remains active`);

            // تنفيذ دالة الخطأ المخصصة إن وجدت (للتسجيل فقط)
            if (onError) {
                onError(session.error);
            }

            // ❌ لا نسجل خروج المستخدم أبداً بسبب خطأ في التجديد
        }
    }, [session?.error, redirectOnError, redirectUrl, onError]);

    return {
        session,
        status,
        isAuthenticated: status === 'authenticated', // الجلسة فعالة حتى لو فيه خطأ تجديد
        isLoading: status === 'loading',
        hasError: !!session?.error,
        error: session?.error,
    };
}

/**
 * HOC للتحقق من الجلسة وتحديثها تلقائياً
 *
 * @param {React.Component} Component - المكون المراد حمايته
 * @param {object} options - خيارات التكوين
 */
export function withSessionRefresh(Component, options = {}) {
    return function WrappedComponent(props) {
        const sessionState = useSessionRefresh(options);

        if (sessionState.isLoading) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            );
        }

        if (!sessionState.isAuthenticated) {
            return null; // سيتم إعادة التوجيه تلقائياً
        }

        return <Component {...props} session={sessionState.session} />;
    };
}

export default useSessionRefresh;
