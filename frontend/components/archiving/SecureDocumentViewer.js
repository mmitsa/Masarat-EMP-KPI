/**
 * SecureDocumentViewer - عارض المستندات الآمن
 *
 * المميزات:
 * - عرض PDF و الصور داخل النظام
 * - تعطيل التحميل والطباعة الأصلية
 * - علامة مائية ديناميكية
 * - حظر النقر اليمين واختصارات لوحة المفاتيح
 * - عداد تنازلي لانتهاء الرمز
 * - أزرار طلب الصلاحية
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Badge, Modal } from '../ui';

export default function SecureDocumentViewer({
    documentId,
    config,
    documentUrl,
    onRequestDownload,
    onRequestPrint,
    onTokenExpired,
    onClose,
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [tokenRemaining, setTokenRemaining] = useState(
        config?.tokenExpiresInMinutes ? config.tokenExpiresInMinutes * 60 : 1800
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestType, setRequestType] = useState(null);
    const containerRef = useRef(null);
    const iframeRef = useRef(null);

    // عداد تنازلي للرمز
    useEffect(() => {
        if (tokenRemaining <= 0) {
            onTokenExpired?.();
            return;
        }
        const timer = setInterval(() => {
            setTokenRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onTokenExpired?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [tokenRemaining, onTokenExpired]);

    // حظر النقر اليمين
    useEffect(() => {
        const handleContextMenu = (e) => {
            e.preventDefault();
            return false;
        };
        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    // حظر اختصارات لوحة المفاتيح
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+S, Ctrl+P, Ctrl+C, PrintScreen
            if (
                (e.ctrlKey || e.metaKey) && ['s', 'p', 'c'].includes(e.key.toLowerCase()) ||
                e.key === 'PrintScreen'
            ) {
                e.preventDefault();
                return false;
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // حظر السحب والإفلات
    useEffect(() => {
        const handleDragStart = (e) => {
            e.preventDefault();
            return false;
        };
        document.addEventListener('dragstart', handleDragStart);
        return () => document.removeEventListener('dragstart', handleDragStart);
    }, []);

    // تنسيق الوقت المتبقي
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // الحصول على لون شارة الوقت
    const getTimeColor = () => {
        if (tokenRemaining < 60) return 'danger';
        if (tokenRemaining < 300) return 'warning';
        return 'info';
    };

    // معالجة طلب التحميل
    const handleRequestDownload = () => {
        setRequestType('Download');
        setShowRequestModal(true);
    };

    // معالجة طلب الطباعة
    const handleRequestPrint = () => {
        setRequestType('Print');
        setShowRequestModal(true);
    };

    // تأكيد الطلب
    const handleConfirmRequest = () => {
        setShowRequestModal(false);
        if (requestType === 'Download') {
            onRequestDownload?.();
        } else if (requestType === 'Print') {
            onRequestPrint?.();
        }
    };

    // الطباعة الآمنة (إذا مسموح)
    const handleSecurePrint = useCallback(() => {
        if (config?.canPrint) {
            // طباعة مع العلامة المائية
            window.print();
        }
    }, [config?.canPrint]);

    // بناء URL الآمن
    const secureDocumentUrl = documentUrl ||
        `/api/archiving/documents/${documentId}/security/stream?token=${config?.viewerToken}`;

    // تحديد نوع المستند
    const isImage = config?.documentInfo?.contentType?.startsWith('image/');
    const isPdf = config?.documentInfo?.contentType === 'application/pdf';

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-50 bg-gray-900 flex flex-col"
            style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
            }}
        >
            {/* شريط الأدوات العلوي */}
            <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
                {/* معلومات المستند */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="text-white">
                        <h3 className="font-semibold text-sm">
                            {config?.documentInfo?.fileName || 'مستند'}
                        </h3>
                        <p className="text-xs text-gray-400">
                            {config?.documentInfo?.barcode}
                        </p>
                    </div>
                </div>

                {/* عناصر التحكم */}
                <div className="flex items-center gap-3">
                    {/* التكبير والتصغير */}
                    <div className="flex items-center gap-1 bg-gray-700 rounded-lg px-2 py-1">
                        <button
                            onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                            className="p-1 text-gray-400 hover:text-white"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                        </button>
                        <span className="text-sm text-white min-w-[50px] text-center">
                            {Math.round(scale * 100)}%
                        </span>
                        <button
                            onClick={() => setScale(s => Math.min(3, s + 0.25))}
                            className="p-1 text-gray-400 hover:text-white"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>

                    {/* الوقت المتبقي */}
                    <Badge variant={getTimeColor()} className="px-3 py-1">
                        <svg className="w-4 h-4 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ينتهي في {formatTime(tokenRemaining)}
                    </Badge>

                    {/* مستوى السرية */}
                    {config?.confidentialityLevel > 0 && (
                        <Badge variant="danger" className="px-3 py-1">
                            <svg className="w-4 h-4 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            {config?.confidentialityLevelName}
                        </Badge>
                    )}
                </div>

                {/* أزرار الإجراءات */}
                <div className="flex items-center gap-2">
                    {/* زر الطباعة */}
                    {config?.canPrint ? (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleSecurePrint}
                            className="flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            طباعة
                        </Button>
                    ) : config?.requiresApprovalForPrint ? (
                        <Button
                            size="sm"
                            variant="warning"
                            onClick={handleRequestPrint}
                            className="flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            طلب صلاحية الطباعة
                        </Button>
                    ) : null}

                    {/* زر التحميل */}
                    {config?.canDownload ? (
                        <Button
                            size="sm"
                            className="flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            تحميل
                        </Button>
                    ) : config?.requiresApprovalForDownload ? (
                        <Button
                            size="sm"
                            variant="warning"
                            onClick={handleRequestDownload}
                            className="flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            طلب صلاحية التحميل
                        </Button>
                    ) : null}
                </div>
            </div>

            {/* منطقة عرض المستند */}
            <div className="flex-1 overflow-auto bg-gray-700 relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-400">جاري تحميل المستند...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <div className="text-center text-red-400">
                            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-lg font-semibold mb-2">خطأ في تحميل المستند</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* عرض المستند */}
                <div
                    className="min-h-full flex items-start justify-center p-4"
                    style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
                >
                    {isImage ? (
                        <img
                            src={secureDocumentUrl}
                            alt={config?.documentInfo?.fileName}
                            className="max-w-full shadow-2xl"
                            onLoad={() => setIsLoading(false)}
                            onError={() => {
                                setIsLoading(false);
                                setError('فشل في تحميل الصورة');
                            }}
                            onContextMenu={(e) => e.preventDefault()}
                            draggable={false}
                        />
                    ) : (
                        <iframe
                            ref={iframeRef}
                            src={`${secureDocumentUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                            className="w-full bg-white dark:bg-gray-900 shadow-2xl"
                            style={{
                                height: 'calc(100vh - 120px)',
                                minWidth: '800px',
                                maxWidth: '1200px'
                            }}
                            onLoad={() => setIsLoading(false)}
                            onError={() => {
                                setIsLoading(false);
                                setError('فشل في تحميل المستند');
                            }}
                            title={config?.documentInfo?.fileName}
                        />
                    )}
                </div>

                {/* العلامة المائية */}
                {config?.addWatermark && (
                    <div
                        className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
                        style={{ zIndex: 10 }}
                    >
                        <div
                            className="text-4xl font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap"
                            style={{
                                opacity: 0.15,
                                transform: 'rotate(-30deg)',
                                fontSize: '4rem',
                                letterSpacing: '0.5rem'
                            }}
                        >
                            {config.watermarkText || 'محمي'}
                        </div>
                    </div>
                )}
            </div>

            {/* شريط المعلومات السفلي */}
            <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-4">
                    <span>
                        <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {config?.documentInfo?.fileSizeFormatted}
                    </span>
                    <span>
                        <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                        </svg>
                        {config?.documentInfo?.cabinetName}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-amber-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    هذا المستند محمي. جميع عمليات الوصول مسجلة.
                </div>
            </div>

            {/* نافذة تأكيد الطلب */}
            <Modal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                title={requestType === 'Download' ? 'طلب صلاحية التحميل' : 'طلب صلاحية الطباعة'}
            >
                <div className="p-4 space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-blue-800 dark:text-blue-200">
                        <p className="text-sm">
                            سيتم إرسال طلبك للموافقة من المسؤول المختص.
                            <br />
                            <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 block">
                                ملاحظة: صلاحية {requestType === 'Download' ? 'التحميل' : 'الطباعة'} ستكون صالحة لمدة 30 دقيقة فقط بعد الموافقة.
                            </span>
                        </p>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <Button variant="secondary" onClick={() => setShowRequestModal(false)}>
                            إلغاء
                        </Button>
                        <Button onClick={handleConfirmRequest}>
                            تأكيد الطلب
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
