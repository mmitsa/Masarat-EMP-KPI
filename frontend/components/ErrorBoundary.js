/**
 * Error Boundary - حدود الخطأ
 *
 * يلتقط الأخطاء في React ويعرض واجهة بديلة أنيقة
 * @version 2.0.0
 * @date 2026-02-25
 */

import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // تسجيل الخطأ في الكونسول فقط
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState(prevState => ({
            error,
            errorInfo,
            errorCount: prevState.errorCount + 1
        }));

        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });

        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/dashboard';
    };

    handleGoBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/dashboard';
        }
    };

    render() {
        if (this.state.hasError) {
            // واجهة بديلة مخصصة
            if (this.props.fallback) {
                return this.props.fallback({
                    error: this.state.error,
                    errorInfo: this.state.errorInfo,
                    reset: this.handleReset
                });
            }

            // الواجهة الافتراضية الأنيقة
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 px-4" dir="rtl">
                    <div className="max-w-lg w-full text-center">
                        {/* أيقونة */}
                        <div className="mb-6 flex justify-center">
                            <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center animate-pulse">
                                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                            يرجى إعادة تحميل الصفحة
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
                            حدثت مشكلة مؤقتة أثناء تحميل هذا المحتوى.
                        </p>
                        <p className="text-gray-400 mb-8 text-sm">
                            جرّب إعادة تحميل الصفحة أو العودة للصفحة الرئيسية.
                        </p>

                        <div className="flex gap-3 justify-center flex-wrap">
                            <button
                                onClick={this.handleReset}
                                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-sm dark:shadow-gray-900/20 hover:shadow-md flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                إعادة المحاولة
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm font-medium flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                إعادة تحميل الصفحة
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="text-gray-500 dark:text-gray-400 px-6 py-3 rounded-xl hover:bg-gray-100 transition-all duration-200 text-sm font-medium"
                            >
                                العودة للرئيسية
                            </button>
                        </div>

                        {this.state.errorCount > 2 && (
                            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                <p className="text-sm text-amber-700">
                                    إذا استمرت المشكلة، يرجى مسح ذاكرة المتصفح أو التواصل مع الدعم الفني.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
