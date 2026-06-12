/**
 * Next.js Middleware - حماية المسارات من جانب الخادم
 *
 * يحمي جميع المسارات المصادق عليها ويعيد توجيه
 * المستخدمين غير المسجلين إلى صفحة تسجيل الدخول.
 *
 * يعمل مع NextAuth v4 وPages Router في Next.js 14.1
 *
 * ═══════════════════════════════════════════════════════════
 * ملاحظة مهمة: مسارات /api/saas/* مُستثناة من هذا الـ middleware
 * لأنها تملك نظام مصادقة مزدوج (dual-auth) خاص:
 *   1. next-auth session (لوحة التحكم الرئيسية)
 *   2. Platform Admin header (إدارة المنصة)
 * التحقق يتم داخل الـ API route نفسه عبر lib/saasAuth.js
 * ═══════════════════════════════════════════════════════════
 */

import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

/**
 * المسارات العامة التي لا تحتاج إلى مصادقة
 * Public paths that do not require authentication
 */
const PUBLIC_PATHS = [
    '/',
    '/login',
    '/sso', // الدخول الموحّد من نظام الموارد (MasaratHR)
    '/register',
    '/about',
    '/forgot-password',
    '/reset-password',
    '/404',
    '/500',
    '/platform-admin', // بوابة إدارة المنصة - لها نظام مصادقة منفصل
];

/**
 * التحقق مما إذا كان المسار عامًا
 */
function isPublicPath(pathname) {
    // السماح بجميع مسارات API الخاصة بـ NextAuth
    if (pathname.startsWith('/api/auth')) return true;

    // السماح بمسارات SaaS API (لديها dual-auth خاص)
    if (pathname.startsWith('/api/saas')) return true;

    // السماح بمسارات iClock/PUSH (أجهزة البصمة — مصادقة خاصة بـ SerialNumber+ApiKey)
    if (pathname.startsWith('/iclock') || pathname.startsWith('/api/iclock')) return true;

    // السماح بمسار Agent Sync (مصادقة خاصة بـ PushApiKey)
    if (pathname === '/api/hr/attendance/agent-sync') return true;

    // السماح بالملفات الثابتة والأصول
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/images') ||
        pathname.startsWith('/icons') ||
        pathname.startsWith('/fonts') ||
        pathname.startsWith('/public')
    ) {
        return true;
    }

    // السماح بالمسارات العامة المحددة
    return PUBLIC_PATHS.some(
        (publicPath) =>
            pathname === publicPath || pathname.startsWith(publicPath + '/')
    );
}

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // تجاوز المسارات العامة والأصول الثابتة
    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    // التحقق من رمز المصادقة باستخدام next-auth/jwt
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    // هل الطلب موجه لـ API route؟
    const isApiRoute = pathname.startsWith('/api/');

    // إذا لم يكن هناك رمز صالح
    if (!token) {
        // لطلبات API: إرجاع 401 JSON بدلاً من إعادة التوجيه
        // (إعادة التوجيه 307 تحافظ على method POST → صفحة login ترجع 405)
        if (isApiRoute) {
            return NextResponse.json(
                { success: false, error: 'غير مصرح - يرجى تسجيل الدخول', code: 'UNAUTHORIZED' },
                { status: 401 }
            );
        }
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 🛡️ أخطاء تجديد التوكن لا تطرد المستخدم — الجلسة دائمة
    // التجديد يتم تلقائياً في الخلفية بدون تأثير على المستخدم
    if (token.error === 'RefreshTokenExpired' || token.error === 'RefreshTokenError') {
        console.warn(`⚠️ [Middleware] Token refresh error (${token.error}) — allowing user through`);
        // نسمح بالمرور بدلاً من إعادة التوجيه — الجلسة تبقى فعالة
        return NextResponse.next();
    }

    // إجبار تغيير كلمة المرور عند أول دخول أو انتهاء الصلاحية
    if (token.mustChangePassword && pathname !== '/change-password' && !pathname.startsWith('/api/')) {
        const changeUrl = new URL('/change-password', request.url);
        changeUrl.searchParams.set('reason', 'first_login');
        return NextResponse.redirect(changeUrl);
    }

    // المستخدم مصادق عليه - السماح بالمرور
    return NextResponse.next();
}

/**
 * إعداد Matcher - تشغيل الـ middleware فقط على المسارات ذات الصلة
 *
 * يستثني:
 * - ملفات _next/static و _next/image (أصول Next.js)
 * - favicon.ico
 * - مسارات api/auth (NextAuth)
 * - مسارات api/saas (SaaS dual-auth)
 */
export const config = {
    matcher: [
        /*
         * تطابق جميع مسارات الطلبات باستثناء:
         * - _next/static  (ملفات ثابتة)
         * - _next/image   (تحسين الصور)
         * - favicon.ico
         * - api/auth      (نقاط نهاية NextAuth)
         * - api/saas      (SaaS API مع dual-auth)
         */
        '/((?!_next/static|_next/image|favicon\\.ico|api/).*)',
    ],
};
