/**
 * مكون ErrorBoundary للصفحات الداخلية
 * يلتقط الأخطاء في React ويعرض واجهة مستخدم أنيقة
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
            errorCount: 0,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);

        this.setState(prevState => ({
            error,
            errorInfo,
            errorCount: prevState.errorCount + 1
        }));
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });

        if (this.props.resetOnError) {
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            const { fallback } = this.props;

            if (fallback) {
                return fallback({
                    error: this.state.error,
                    resetError: this.handleReset
                });
            }

            // واجهة خطأ بسيطة وأنيقة داخل الصفحة
            return (
                <div className="flex items-center justify-center py-16 px-4" dir="rtl">
                    <div className="text-center max-w-md">
                        {/* أيقونة */}
                        <div className="mb-6 flex justify-center">
                            <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">
                            يرجى إعادة تحميل المحتوى
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                            حدثت مشكلة مؤقتة أثناء عرض هذا المحتوى. جرّب إعادة المحاولة.
                        </p>

                        <div className="flex gap-3 justify-center flex-wrap">
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                إعادة المحاولة
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-all text-sm font-medium"
                            >
                                إعادة تحميل الصفحة
                            </button>
                        </div>

                        {this.state.errorCount > 2 && (
                            <p className="mt-4 text-xs text-amber-600">
                                إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني.
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

/**
 * Hook لإنشاء Error Boundary برمجياً
 */
export function useErrorBoundary() {
    const [error, setError] = React.useState(null);

    const resetError = React.useCallback(() => {
        setError(null);
    }, []);

    const catchError = React.useCallback((error) => {
        setError(error);
    }, []);

    if (error) {
        throw error;
    }

    return { catchError, resetError };
}

/**
 * مكون ErrorFallback خفيف للأجزاء الصغيرة
 */
export function ErrorFallback({ error, resetError }) {
    return (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl" dir="rtl">
            <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200">
                        تعذر تحميل هذا المحتوى
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        يرجى المحاولة مرة أخرى أو إعادة تحميل الصفحة.
                    </p>
                    {resetError && (
                        <button
                            onClick={resetError}
                            className="mt-2 text-xs text-blue-700 dark:text-blue-300 hover:text-blue-900 font-medium underline"
                        >
                            إعادة المحاولة
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
