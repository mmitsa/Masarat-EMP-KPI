import Head from 'next/head';
import Link from 'next/link';

export default function Custom500() {
    return (
        <>
            <Head>
                <title>خطأ مؤقت | منصة مسارات</title>
            </Head>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50" dir="rtl">
                <div className="text-center max-w-lg mx-auto px-6">
                    {/* أيقونة */}
                    <div className="mb-6 flex justify-center">
                        <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                        جاري معالجة طلبك
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
                        واجه النظام مشكلة مؤقتة أثناء معالجة طلبك.
                    </p>
                    <p className="text-gray-400 mb-8 text-sm">
                        يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
                    </p>

                    <div className="flex gap-3 justify-center flex-wrap">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-sm dark:shadow-gray-900/20 hover:shadow-md"
                        >
                            إعادة المحاولة
                        </button>
                        <Link
                            href="/dashboard"
                            className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
                        >
                            العودة للرئيسية
                        </Link>
                        <button
                            onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/dashboard'}
                            className="text-gray-500 dark:text-gray-400 px-6 py-3 rounded-xl hover:bg-gray-100 transition-all duration-200 text-sm font-medium"
                        >
                            الصفحة السابقة
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
