/**
 * عارض ومحرر ملفات PDF
 * PDF Viewer and Editor Component
 *
 * يوفر:
 * - عرض ملفات PDF
 * - التكبير والتصغير
 * - التنقل بين الصفحات
 * - التدوير
 * - إعادة تسمية
 * - تحميل الملف
 * - طباعة
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

// أيقونات
const Icons = {
    ZoomIn: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
    ),
    ZoomOut: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
        </svg>
    ),
    RotateRight: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
    ChevronRight: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    ),
    ChevronLeft: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    ),
    Download: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
    ),
    Print: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
    ),
    Fullscreen: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
    ),
    Close: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    Edit: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    ),
    FitWidth: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
    ),
    FitPage: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
        </svg>
    ),
    Thumbnail: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    ),
    PDF: () => (
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-6 4h6m-6-8h1" />
        </svg>
    ),
};

// مستويات التكبير المتاحة
const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150, 200, 300, 400];

export default function PDFViewer({
    file,
    fileUrl,
    fileName = 'مستند PDF',
    onClose,
    onRename,
    onDownload,
    showThumbnails = true,
    className = '',
}) {
    // الحالات
    const [pdfDoc, setPdfDoc] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSidebar, setShowSidebar] = useState(showThumbnails);
    const [thumbnails, setThumbnails] = useState([]);
    const [fitMode, setFitMode] = useState('page'); // page, width, custom
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [documentName, setDocumentName] = useState(fileName);
    const [isEditingName, setIsEditingName] = useState(false);

    // المراجع
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const pdfViewerRef = useRef(null);

    // تحميل مكتبة PDF.js
    useEffect(() => {
        loadPDFJS();
    }, []);

    const loadPDFJS = async () => {
        if (typeof window !== 'undefined' && !window.pdfjsLib) {
            // تحميل PDF.js من CDN
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.async = true;
            script.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                loadDocument();
            };
            document.head.appendChild(script);
        } else if (window.pdfjsLib) {
            loadDocument();
        }
    };

    // تحميل المستند
    const loadDocument = useCallback(async () => {
        if (!file && !fileUrl) return;

        setIsLoading(true);
        setError(null);

        try {
            const loadingTask = window.pdfjsLib.getDocument(
                fileUrl || await fileToArrayBuffer(file)
            );
            const pdf = await loadingTask.promise;

            setPdfDoc(pdf);
            setTotalPages(pdf.numPages);
            setCurrentPage(1);

            // إنشاء الصور المصغرة
            if (showThumbnails) {
                generateThumbnails(pdf);
            }

            // عرض الصفحة الأولى
            renderPage(pdf, 1, zoom, rotation);

        } catch (err) {
            console.error('Error loading PDF:', err);
            setError('فشل في تحميل ملف PDF');
        } finally {
            setIsLoading(false);
        }
    }, [file, fileUrl, zoom, rotation, showThumbnails]);

    // تحويل الملف إلى ArrayBuffer
    const fileToArrayBuffer = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    // عرض صفحة
    const renderPage = async (pdf, pageNum, scale, rot) => {
        try {
            const page = await pdf.getPage(pageNum);
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const viewport = page.getViewport({
                scale: scale / 100,
                rotation: rot,
            });

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: ctx,
                viewport: viewport,
            }).promise;

        } catch (err) {
            console.error('Error rendering page:', err);
        }
    };

    // إنشاء الصور المصغرة
    const generateThumbnails = async (pdf) => {
        const thumbs = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const scale = 0.2;
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            await page.render({
                canvasContext: ctx,
                viewport: viewport,
            }).promise;

            thumbs.push({
                page: i,
                dataUrl: canvas.toDataURL('image/jpeg', 0.5),
            });
        }
        setThumbnails(thumbs);
    };

    // تحديث العرض عند تغيير الإعدادات
    useEffect(() => {
        if (pdfDoc) {
            renderPage(pdfDoc, currentPage, zoom, rotation);
        }
    }, [pdfDoc, currentPage, zoom, rotation]);

    // التنقل بين الصفحات
    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const nextPage = () => goToPage(currentPage + 1);
    const prevPage = () => goToPage(currentPage - 1);

    // التكبير والتصغير
    const zoomIn = () => {
        const nextLevel = ZOOM_LEVELS.find(level => level > zoom) || ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
        setZoom(nextLevel);
        setFitMode('custom');
    };

    const zoomOut = () => {
        const prevLevel = [...ZOOM_LEVELS].reverse().find(level => level < zoom) || ZOOM_LEVELS[0];
        setZoom(prevLevel);
        setFitMode('custom');
    };

    // التدوير
    const rotate = (degrees = 90) => {
        setRotation((rotation + degrees) % 360);
    };

    // ملاءمة العرض
    const fitToWidth = () => {
        if (containerRef.current && pdfDoc) {
            const containerWidth = containerRef.current.clientWidth - 48;
            setZoom(Math.round((containerWidth / 612) * 100)); // 612 = A4 width at 72 DPI
            setFitMode('width');
        }
    };

    const fitToPage = () => {
        if (containerRef.current && pdfDoc) {
            const containerHeight = containerRef.current.clientHeight - 48;
            setZoom(Math.round((containerHeight / 792) * 100)); // 792 = A4 height at 72 DPI
            setFitMode('page');
        }
    };

    // الشاشة الكاملة
    const toggleFullscreen = () => {
        if (!isFullscreen) {
            pdfViewerRef.current?.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
        setIsFullscreen(!isFullscreen);
    };

    // تحميل الملف
    const handleDownload = () => {
        if (onDownload) {
            onDownload();
        } else if (fileUrl) {
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = documentName;
            link.click();
        }
    };

    // الطباعة
    const handlePrint = () => {
        if (fileUrl) {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = fileUrl;
            document.body.appendChild(iframe);
            iframe.onload = () => {
                iframe.contentWindow?.print();
                setTimeout(() => document.body.removeChild(iframe), 1000);
            };
        }
    };

    // إعادة التسمية
    const handleRename = () => {
        if (onRename) {
            onRename(documentName);
        }
        setIsEditingName(false);
    };

    // التنقل بلوحة المفاتيح
    useEffect(() => {
        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                case 'PageDown':
                    e.preventDefault();
                    nextPage();
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                case 'PageUp':
                    e.preventDefault();
                    prevPage();
                    break;
                case 'Home':
                    e.preventDefault();
                    goToPage(1);
                    break;
                case 'End':
                    e.preventDefault();
                    goToPage(totalPages);
                    break;
                case '+':
                case '=':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        zoomIn();
                    }
                    break;
                case '-':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        zoomOut();
                    }
                    break;
                case 'Escape':
                    if (isFullscreen) {
                        document.exitFullscreen?.();
                    } else if (onClose) {
                        onClose();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, totalPages, isFullscreen, zoom]);

    return (
        <div
            ref={pdfViewerRef}
            className={`fixed inset-0 bg-gray-900 z-50 flex flex-col ${className}`}
            dir="rtl"
        >
            {/* شريط الأدوات العلوي */}
            <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between shadow-lg">
                {/* اسم الملف وأزرار التحكم */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg"
                        title="إغلاق"
                    >
                        <Icons.Close />
                    </button>
                    <div className="flex items-center gap-2">
                        {isEditingName ? (
                            <input
                                type="text"
                                value={documentName}
                                onChange={(e) => setDocumentName(e.target.value)}
                                onBlur={handleRename}
                                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                className="bg-gray-700 px-3 py-1 rounded-lg text-white"
                                autoFocus
                            />
                        ) : (
                            <>
                                <span className="font-medium">{documentName}</span>
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className="p-1 hover:bg-gray-700 rounded"
                                    title="إعادة تسمية"
                                >
                                    <Icons.Edit />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* أدوات التكبير */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={zoomOut}
                        className="p-2 hover:bg-gray-700 rounded-lg"
                        title="تصغير"
                    >
                        <Icons.ZoomOut />
                    </button>

                    <select
                        value={zoom}
                        onChange={(e) => {
                            setZoom(parseInt(e.target.value));
                            setFitMode('custom');
                        }}
                        className="bg-gray-700 px-3 py-1.5 rounded-lg text-white"
                    >
                        {ZOOM_LEVELS.map(level => (
                            <option key={level} value={level}>{level}%</option>
                        ))}
                    </select>

                    <button
                        onClick={zoomIn}
                        className="p-2 hover:bg-gray-700 rounded-lg"
                        title="تكبير"
                    >
                        <Icons.ZoomIn />
                    </button>

                    <div className="w-px h-6 bg-gray-600 mx-2"></div>

                    <button
                        onClick={fitToWidth}
                        className={`p-2 rounded-lg ${fitMode === 'width' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                        title="ملاءمة العرض"
                    >
                        <Icons.FitWidth />
                    </button>

                    <button
                        onClick={fitToPage}
                        className={`p-2 rounded-lg ${fitMode === 'page' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                        title="ملاءمة الصفحة"
                    >
                        <Icons.FitPage />
                    </button>
                </div>

                {/* أدوات إضافية */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => rotate(90)}
                        className="p-2 hover:bg-gray-700 rounded-lg"
                        title="تدوير"
                    >
                        <Icons.RotateRight />
                    </button>

                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`p-2 rounded-lg ${showSidebar ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                        title="الصور المصغرة"
                    >
                        <Icons.Thumbnail />
                    </button>

                    <div className="w-px h-6 bg-gray-600 mx-2"></div>

                    <button
                        onClick={handleDownload}
                        className="p-2 hover:bg-gray-700 rounded-lg"
                        title="تحميل"
                    >
                        <Icons.Download />
                    </button>

                    <button
                        onClick={handlePrint}
                        className="p-2 hover:bg-gray-700 rounded-lg"
                        title="طباعة"
                    >
                        <Icons.Print />
                    </button>

                    <button
                        onClick={toggleFullscreen}
                        className="p-2 hover:bg-gray-700 rounded-lg"
                        title="شاشة كاملة"
                    >
                        <Icons.Fullscreen />
                    </button>
                </div>
            </div>

            {/* المحتوى الرئيسي */}
            <div className="flex-1 flex overflow-hidden">
                {/* الشريط الجانبي للصور المصغرة */}
                {showSidebar && (
                    <div className="w-48 bg-gray-800 border-l border-gray-700 overflow-y-auto p-2">
                        <div className="space-y-2">
                            {thumbnails.map((thumb) => (
                                <button
                                    key={thumb.page}
                                    onClick={() => goToPage(thumb.page)}
                                    className={`w-full rounded-lg overflow-hidden border-2 transition-all ${
                                        currentPage === thumb.page
                                            ? 'border-blue-500 ring-2 ring-blue-300'
                                            : 'border-transparent hover:border-gray-600'
                                    }`}
                                >
                                    <img
                                        src={thumb.dataUrl}
                                        alt={`صفحة ${thumb.page}`}
                                        className="w-full"
                                    />
                                    <div className="bg-gray-700 text-white text-xs py-1 text-center">
                                        {thumb.page}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* منطقة العرض */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto flex items-center justify-center p-6 bg-gray-700"
                >
                    {isLoading ? (
                        <div className="text-center text-white">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p>جاري تحميل المستند...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center text-white">
                            <div className="text-red-400 mb-4">
                                <Icons.PDF />
                            </div>
                            <p className="text-red-400">{error}</p>
                        </div>
                    ) : (
                        <canvas
                            ref={canvasRef}
                            className="shadow-2xl"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                            }}
                        />
                    )}
                </div>
            </div>

            {/* شريط التنقل السفلي */}
            <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-center gap-4">
                <button
                    onClick={prevPage}
                    disabled={currentPage <= 1}
                    className="p-2 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="الصفحة السابقة"
                >
                    <Icons.ChevronRight />
                </button>

                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={currentPage}
                        onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                        min={1}
                        max={totalPages}
                        className="w-16 bg-gray-700 px-3 py-1 rounded-lg text-center text-white"
                    />
                    <span className="text-gray-400">من</span>
                    <span>{totalPages}</span>
                </div>

                <button
                    onClick={nextPage}
                    disabled={currentPage >= totalPages}
                    className="p-2 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="الصفحة التالية"
                >
                    <Icons.ChevronLeft />
                </button>
            </div>
        </div>
    );
}

// مكون معاينة مصغرة لملف PDF
export function PDFThumbnail({
    file,
    fileUrl,
    onClick,
    className = '',
}) {
    const [thumbnail, setThumbnail] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pageCount, setPageCount] = useState(0);

    useEffect(() => {
        loadThumbnail();
    }, [file, fileUrl]);

    const loadThumbnail = async () => {
        if (!window.pdfjsLib) {
            // تحميل PDF.js
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.async = true;
            script.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                generateThumbnail();
            };
            document.head.appendChild(script);
        } else {
            generateThumbnail();
        }
    };

    const generateThumbnail = async () => {
        try {
            let source = fileUrl;
            if (file && !fileUrl) {
                source = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(file);
                });
            }

            const pdf = await window.pdfjsLib.getDocument(source).promise;
            setPageCount(pdf.numPages);

            const page = await pdf.getPage(1);
            const scale = 0.3;
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            await page.render({
                canvasContext: ctx,
                viewport: viewport,
            }).promise;

            setThumbnail(canvas.toDataURL('image/jpeg', 0.7));
        } catch (err) {
            console.error('Error generating thumbnail:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            onClick={onClick}
            className={`relative cursor-pointer group ${className}`}
        >
            {isLoading ? (
                <div className="w-full aspect-[3/4] bg-gray-100 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : thumbnail ? (
                <>
                    <img
                        src={thumbnail}
                        alt="معاينة PDF"
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 transition-colors"
                    />
                    {pageCount > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {pageCount} صفحات
                        </div>
                    )}
                </>
            ) : (
                <div className="w-full aspect-[3/4] bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-400">
                    <Icons.PDF />
                </div>
            )}
        </div>
    );
}
