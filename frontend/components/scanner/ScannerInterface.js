/**
 * واجهة الماسح الضوئي
 * Scanner Interface Component
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import scannerService, {
    DEFAULT_SCAN_CONFIG,
    PAPER_SIZES,
    COLOR_MODES,
    DPI_OPTIONS,
} from '../../lib/scanner/ScannerService';
import { SCANNER_MANUFACTURERS } from '../../lib/scanner/scannerDatabase';
import { CONNECTION_STATUS } from '../../lib/scanner/ScannerBridge';

// أيقونات
const ScannerIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const CameraIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const UploadIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const RotateIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const DeleteIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const ZoomInIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
    </svg>
);

const ZoomOutIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
    </svg>
);

const SettingsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export default function ScannerInterface({
    onScanComplete,
    onAddAttachment,
    transactionId,
    maxFiles = 50,
    allowedFormats = ['image/*', 'application/pdf'],
    className = '',
}) {
    // الحالات
    const [isInitialized, setIsInitialized] = useState(false);
    const [scanners, setScanners] = useState([]);
    const [selectedScanner, setSelectedScanner] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedImages, setScannedImages] = useState([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [error, setError] = useState(null);
    const [scanProgress, setScanProgress] = useState(0);
    const [bridgeStatus, setBridgeStatus] = useState(CONNECTION_STATUS.DISCONNECTED);

    // إعدادات المسح
    const [scanConfig, setScanConfig] = useState({
        ...DEFAULT_SCAN_CONFIG,
    });

    // المراجع
    const videoRef = useRef(null);
    const previewRef = useRef(null);

    // تهيئة الخدمة
    useEffect(() => {
        initializeScanner();

        return () => {
            scannerService.stopCamera();
        };
    }, []);

    const initializeScanner = async () => {
        try {
            const initResult = await scannerService.initialize();
            const availableScanners = await scannerService.getScanners();
            setScanners(availableScanners);
            setIsInitialized(true);

            // تحديث حالة الخدمة المحلية
            const status = scannerService.getBridgeStatus();
            setBridgeStatus(status.connected ? CONNECTION_STATUS.CONNECTED : CONNECTION_STATUS.DISCONNECTED);

            // الاشتراك في الأحداث
            scannerService.on('imageCaptured', handleImageCaptured);
            scannerService.on('scanComplete', handleScanComplete);
            scannerService.on('scanError', handleScanError);
            scannerService.on('pageScanned', handlePageScanned);
            scannerService.on('bridgeStatusChange', (data) => {
                setBridgeStatus(data.status);
            });

        } catch (err) {
            setError('فشل في تهيئة الماسح: ' + err.message);
        }
    };

    // معالجات الأحداث
    const handleImageCaptured = useCallback((image) => {
        setScannedImages(prev => [...prev, image]);
    }, []);

    const handleScanComplete = useCallback((result) => {
        setIsScanning(false);
        setScanProgress(100);
        if (result.images) {
            setScannedImages(prev => [...prev, ...result.images]);
        }
    }, []);

    const handleScanError = useCallback((data) => {
        setIsScanning(false);
        setError(data.error);
    }, []);

    const handlePageScanned = useCallback((data) => {
        setScanProgress((data.pageCount / 10) * 100);
    }, []);

    // اختيار ماسح
    const handleSelectScanner = async (scanner) => {
        try {
            await scannerService.selectScanner(scanner.index);
            setSelectedScanner(scanner);

            if (scanner.type === 'camera') {
                setShowCamera(true);
            } else {
                setShowCamera(false);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    // بدء المسح
    const handleStartScan = async () => {
        if (!selectedScanner) {
            setError('يرجى اختيار ماسح أولاً');
            return;
        }

        setError(null);
        setIsScanning(true);
        setScanProgress(0);

        try {
            const result = await scannerService.startScan(scanConfig);
            if (result.images) {
                setScannedImages(prev => [...prev, ...result.images]);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsScanning(false);
        }
    };

    // تشغيل الكاميرا
    const handleStartCamera = async () => {
        try {
            await scannerService.startCamera(videoRef.current);
        } catch (err) {
            setError(err.message);
        }
    };

    // التقاط صورة من الكاميرا
    const handleCaptureFromCamera = async () => {
        try {
            await scannerService.captureFromCamera(videoRef.current);
        } catch (err) {
            setError(err.message);
        }
    };

    // إيقاف الكاميرا
    const handleStopCamera = () => {
        scannerService.stopCamera();
        setShowCamera(false);
    };

    // تدوير صورة
    const handleRotateImage = async (index, degrees = 90) => {
        const rotated = await scannerService.rotateImage(index, degrees);
        if (rotated) {
            setScannedImages(scannerService.getImages());
        }
    };

    // حذف صورة
    const handleDeleteImage = (index) => {
        scannerService.removeImage(index);
        setScannedImages(scannerService.getImages());
        if (selectedImageIndex === index) {
            setSelectedImageIndex(null);
        }
    };

    // تغيير ترتيب الصور
    const handleReorderImages = (fromIndex, toIndex) => {
        const reordered = scannerService.reorderImages(fromIndex, toIndex);
        setScannedImages(reordered);
    };

    // إضافة المرفقات للمعاملة
    const handleAddToTransaction = async () => {
        if (scannedImages.length === 0) {
            setError('لا توجد صور لإضافتها');
            return;
        }

        try {
            const attachments = scannedImages.map((img, index) => ({
                id: `scan-${Date.now()}-${index}`,
                name: `مستند ممسوح ${index + 1}.${img.format || 'jpg'}`,
                type: `image/${img.format || 'jpeg'}`,
                size: img.data.length,
                data: img.data,
                timestamp: img.timestamp,
                source: img.source || 'scanner',
            }));

            if (onAddAttachment) {
                for (const attachment of attachments) {
                    await onAddAttachment(attachment);
                }
            }

            if (onScanComplete) {
                onScanComplete(attachments);
            }

            // مسح المخزن المؤقت
            scannerService.clearBuffer();
            setScannedImages([]);
            setSelectedImageIndex(null);

        } catch (err) {
            setError('فشل في إضافة المرفقات: ' + err.message);
        }
    };

    // تحديث إعدادات المسح
    const updateScanConfig = (key, value) => {
        setScanConfig(prev => ({ ...prev, [key]: value }));
    };

    // الحصول على أيقونة الماسح
    const getScannerIcon = (scanner) => {
        if (scanner.type === 'camera') return <CameraIcon />;
        if (scanner.type === 'file') return <UploadIcon />;
        return <ScannerIcon />;
    };

    return (
        <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800 ${className}`} dir="rtl">
            {/* رأس المكون */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                        <ScannerIcon />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">الماسح الضوئي</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedScanner ? selectedScanner.model || selectedScanner.name : 'اختر ماسحاً للبدء'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* مؤشر حالة الاتصال */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                        ${bridgeStatus === CONNECTION_STATUS.CONNECTED
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'
                        }`}
                        title={bridgeStatus === CONNECTION_STATUS.CONNECTED
                            ? 'الخدمة المحلية متصلة - الماسح الفعلي متاح'
                            : 'الخدمة المحلية غير متصلة - شغّل masarat_scanner_bridge'
                        }
                    >
                        <span className={`inline-block w-2 h-2 rounded-full
                            ${bridgeStatus === CONNECTION_STATUS.CONNECTED ? 'bg-green-500' : 'bg-gray-400'}`}
                        />
                        {bridgeStatus === CONNECTION_STATUS.CONNECTED ? 'متصل' : 'غير متصل'}
                    </div>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="إعدادات المسح"
                    >
                        <SettingsIcon />
                    </button>
                </div>
            </div>

            {/* رسالة الخطأ */}
            {error && (
                <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    {error}
                    <button onClick={() => setError(null)} className="float-left">×</button>
                </div>
            )}

            {/* قائمة الماسحات */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">اختر الماسح</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {scanners.map((scanner) => (
                        <button
                            key={scanner.index}
                            onClick={() => handleSelectScanner(scanner)}
                            className={`p-3 rounded-xl border-2 transition-all text-right flex items-center gap-3
                                ${selectedScanner?.index === scanner.index
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                                ${selectedScanner?.index === scanner.index ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
                                {getScannerIcon(scanner)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-white truncate">
                                    {scanner.model || scanner.name}
                                </div>
                                {scanner.manufacturerInfo && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {scanner.manufacturerInfo.nameAr}
                                    </div>
                                )}
                                {scanner.isIdentified && scanner.info && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                                        <span className="text-xs text-green-600 dark:text-green-400">تم التعرف عليه</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* إعدادات المسح */}
            {showSettings && (
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">إعدادات المسح</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {/* الدقة */}
                        <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">الدقة (DPI)</label>
                            <select
                                value={scanConfig.dpi}
                                onChange={(e) => updateScanConfig('dpi', parseInt(e.target.value))}
                                className="w-full p-2 border rounded-lg text-sm"
                            >
                                {DPI_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.nameAr}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* وضع الألوان */}
                        <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">الألوان</label>
                            <select
                                value={scanConfig.colorMode}
                                onChange={(e) => updateScanConfig('colorMode', e.target.value)}
                                className="w-full p-2 border rounded-lg text-sm"
                            >
                                {Object.values(COLOR_MODES).map(mode => (
                                    <option key={mode.id} value={mode.id}>
                                        {mode.nameAr}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* حجم الورق */}
                        <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">حجم الورق</label>
                            <select
                                value={scanConfig.paperSize}
                                onChange={(e) => updateScanConfig('paperSize', e.target.value)}
                                className="w-full p-2 border rounded-lg text-sm"
                            >
                                {Object.entries(PAPER_SIZES).map(([key, size]) => (
                                    <option key={key} value={key}>
                                        {size.nameAr}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* الجودة */}
                        <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">الجودة</label>
                            <input
                                type="range"
                                min="50"
                                max="100"
                                value={scanConfig.jpegQuality}
                                onChange={(e) => updateScanConfig('jpegQuality', parseInt(e.target.value))}
                                className="w-full"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400">{scanConfig.jpegQuality}%</span>
                        </div>
                    </div>

                    {/* خيارات إضافية */}
                    <div className="flex flex-wrap gap-4 mt-4">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={scanConfig.duplex}
                                onChange={(e) => updateScanConfig('duplex', e.target.checked)}
                                className="rounded"
                            />
                            <span>مسح الوجهين</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={scanConfig.autoFeeder}
                                onChange={(e) => updateScanConfig('autoFeeder', e.target.checked)}
                                className="rounded"
                            />
                            <span>تلقيم تلقائي</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={scanConfig.autoRotate}
                                onChange={(e) => updateScanConfig('autoRotate', e.target.checked)}
                                className="rounded"
                            />
                            <span>تدوير تلقائي</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={scanConfig.removeBlankPages}
                                onChange={(e) => updateScanConfig('removeBlankPages', e.target.checked)}
                                className="rounded"
                            />
                            <span>حذف الصفحات الفارغة</span>
                        </label>
                    </div>
                </div>
            )}

            {/* عرض الكاميرا */}
            {showCamera && (
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
                            <button
                                onClick={handleStartCamera}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                تشغيل الكاميرا
                            </button>
                            <button
                                onClick={handleCaptureFromCamera}
                                className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                            >
                                التقاط
                            </button>
                            <button
                                onClick={handleStopCamera}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                                إيقاف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* منطقة المعاينة والصور الممسوحة */}
            <div className="p-4">
                {/* شريط الأدوات */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleStartScan}
                            disabled={!selectedScanner || isScanning}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isScanning ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>جاري المسح...</span>
                                </>
                            ) : (
                                <>
                                    <ScannerIcon />
                                    <span>بدء المسح</span>
                                </>
                            )}
                        </button>

                        {scannedImages.length > 0 && (
                            <>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {scannedImages.length} صفحة
                                </span>
                                <button
                                    onClick={() => {
                                        scannerService.clearBuffer();
                                        setScannedImages([]);
                                    }}
                                    className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 rounded-lg text-sm"
                                >
                                    مسح الكل
                                </button>
                            </>
                        )}
                    </div>

                    {/* أدوات التكبير */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setZoom(Math.max(25, zoom - 25))}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ZoomOutIcon />
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-300 w-12 text-center">{zoom}%</span>
                        <button
                            onClick={() => setZoom(Math.min(200, zoom + 25))}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ZoomInIcon />
                        </button>
                    </div>
                </div>

                {/* شريط التقدم */}
                {isScanning && (
                    <div className="mb-4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${scanProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* عرض الصور */}
                {scannedImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {scannedImages.map((image, index) => (
                            <div
                                key={index}
                                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                                    ${selectedImageIndex === index ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                                onClick={() => setSelectedImageIndex(index)}
                            >
                                <img
                                    src={image.data}
                                    alt={`صفحة ${index + 1}`}
                                    className="w-full aspect-[3/4] object-cover"
                                    style={{ transform: `scale(${zoom / 100})` }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRotateImage(index); }}
                                            className="p-1.5 bg-white dark:bg-gray-900 rounded-lg shadow hover:bg-gray-100"
                                            title="تدوير"
                                        >
                                            <RotateIcon />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteImage(index); }}
                                            className="p-1.5 bg-white dark:bg-gray-900 rounded-lg shadow hover:bg-red-50 text-red-600 dark:text-red-400"
                                            title="حذف"
                                        >
                                            <DeleteIcon />
                                        </button>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                    <span className="text-white text-xs">صفحة {index + 1}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center">
                            <ScannerIcon />
                        </div>
                        <p>لا توجد صور ممسوحة</p>
                        <p className="text-sm mt-1">اختر ماسحاً واضغط على "بدء المسح"</p>
                    </div>
                )}
            </div>

            {/* معاينة الصورة المحددة */}
            {selectedImageIndex !== null && scannedImages[selectedImageIndex] && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImageIndex(null)}
                >
                    <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
                        <img
                            src={scannedImages[selectedImageIndex].data}
                            alt="معاينة"
                            className="max-w-full max-h-[80vh] object-contain rounded-lg"
                        />
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-white/90 rounded-lg p-2">
                            <button
                                onClick={() => handleRotateImage(selectedImageIndex, -90)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                                title="تدوير يساراً"
                            >
                                <RotateIcon />
                            </button>
                            <button
                                onClick={() => handleRotateImage(selectedImageIndex, 90)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                                title="تدوير يميناً"
                            >
                                <RotateIcon />
                            </button>
                            <button
                                onClick={() => handleDeleteImage(selectedImageIndex)}
                                className="p-2 hover:bg-red-50 text-red-600 dark:text-red-400 rounded-lg"
                                title="حذف"
                            >
                                <DeleteIcon />
                            </button>
                        </div>
                        <button
                            onClick={() => setSelectedImageIndex(null)}
                            className="absolute top-4 left-4 p-2 bg-white/90 rounded-lg hover:bg-white"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* زر إضافة للمعاملة */}
            {scannedImages.length > 0 && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                    <button
                        onClick={handleAddToTransaction}
                        className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        إضافة {scannedImages.length} مرفق للمعاملة
                    </button>
                </div>
            )}
        </div>
    );
}
