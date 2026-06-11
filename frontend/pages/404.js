import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function Custom404() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const isLoading = status === 'loading';

    // Determine where to redirect based on session status
    const getRedirectPath = () => {
        if (isLoading) return '/';
        if (session) return '/dashboard';
        return '/login';
    };

    const handleGoBack = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push(getRedirectPath());
        }
    };

    return (
        <>
            <Head>
                <title>404 - الصفحة غير موجودة | منصة مسارات</title>
            </Head>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
                <div className="text-center px-4 max-w-2xl">
                    {/* Icon */}
                    <div className="mb-8">
                        <svg
                            className="w-32 h-32 mx-auto text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>

                    {/* Error Code */}
                    <h1 className="text-8xl font-bold text-gray-800 dark:text-gray-100 mb-4">404</h1>

                    {/* Error Message */}
                    <p className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
                        عذراً، الصفحة غير موجودة
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                        الصفحة التي تبحث عنها قد تكون قد تم نقلها أو حذفها أو لم تكن موجودة من الأساس
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleGoBack}
                            className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-300 transition-colors duration-200"
                        >
                            <svg
                                className="w-5 h-5 ml-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            رجوع
                        </button>

                        <Link
                            href={getRedirectPath()}
                            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors duration-200 shadow-lg shadow-primary-500/30"
                        >
                            <svg
                                className="w-5 h-5 ml-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                            </svg>
                            {session ? 'الذهاب للوحة التحكم' : 'الذهاب لصفحة تسجيل الدخول'}
                        </Link>
                    </div>

                    {/* Additional Help */}
                    <div className="mt-12 pt-8 border-t border-gray-300 dark:border-gray-600">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">تحتاج مساعدة؟</p>
                        <Link
                            href="/help"
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                            مركز المساعدة
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
