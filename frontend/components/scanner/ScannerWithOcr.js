/**
 * مكون الماسح الضوئي المتكامل مع OCR
 * Integrated Scanner with OCR Component
 *
 * يجمع بين:
 * ✅ المسح المباشر (بدون مجلد وسيط)
 * ✅ معالجة OCR تلقائية
 * ✅ الخريطة التفاعلية للنقر على النص
 * ✅ استخراج البيانات التلقائي
 * ✅ التعبئة التلقائية للحقول
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import useOcrScanner, { SCANNER_STATES } from '../../hooks/useOcrScanner';
import OcrImageMap, { ExtractedDataPanel, FullTextPanel } from './OcrImageMap';
import { DPI_OPTIONS, COLOR_MODES, PAPER_SIZES } from '../../lib/scanner/ScannerService';

// الأيقونات
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

const OcrIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const SpinnerIcon = () => (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

/**
 * المكون الرئيسي
 */
export default function ScannerWithOcr({
    onDataExtracted,
    onAttachmentsChange,
    onApplyToForm,
    initialAttachments = [],
    maxFiles = 50,
    className = '',
}) {
    // استخدام الـ hook
    const {
        state,
        statusMessage,
        progress,
        error,
        scanners,
        selectedScanner,
        selectScanner,
        scannedImages,
        currentImage,
        setCurrentImage,
        removeImage,
        rotateImage,
        ocrResult,
        extractedData,
        classification,
        processOcr,
        assignFieldValue,
        initialize,
        startScan,
        processUploadedFile,
        applyExtractedData,
        clearAll,
        isReady,
        isScanning,
        isProcessing,
        hasImages,
        hasOcrResult,
    } = useOcrScanner({
        autoInitialize: true,
        autoProcessOcr: true,
        onDataExtracted: (data, classification) => {
            onDataExtracted?.(data, classification);
        },
    });

    // حالات محلية
    const [activeTab, setActiveTab] = useState('scan'); // scan, ocr, data
    const [showSettings, setShowSettings] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [scanConfig, setScanConfig] = useState({
        dpi: 300,
        colorMode: 'color',
        paperSize: 'A4',
        duplex: false,
        autoFeeder: false,
    });

    // المراجع
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);

    // معالجة رفع الملفات
    const handleFileUpload = useCallback(async (event) => {
        const files = Array.from(event.target.files);

        for (const file of files) {
            if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                await processUploadedFile(file);
            }
        }

        // إعادة تعيين الـ input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [processUploadedFile]);

    // بدء المسح
    const handleStartScan = useCallback(async () => {
        try {
            await startScan(scanConfig);
        } catch (err) {
            console.error('Scan error:', err);
        }
    }, [startScan, scanConfig]);

    // تطبيق البيانات على النموذج
    const handleApplyToForm = useCallback(() => {
        if (onApplyToForm) {
            onApplyToForm(extractedData, classification);
        }
    }, [extractedData, classification, onApplyToForm]);

    // تحديث المرفقات
    useEffect(() => {
        if (onAttachmentsChange) {
            onAttachmentsChange(scannedImages);
        }
    }, [scannedImages, onAttachmentsChange]);

    // الحصول على لون حالة الماسح
    const getStateColor = () => {
        switch (state) {
            case SCANNER_STATES.READY:
            case SCANNER_STATES.COMPLETED:
                return 'bg-green-100 dark:bg-green-900/30 border-green-300 text-green-700 dark:text-green-300';
            case SCANNER_STATES.SCANNING:
            case SCANNER_STATES.PROCESSING_OCR:
                return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 text-blue-700 dark:text-blue-300';
            case SCANNER_STATES.ERROR:
                return 'bg-red-100 dark:bg-red-900/30 border-red-300 text-red-700 dark:text-red-300';
            default:
                return 'bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200';
        }
    };

    return (
        <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700 ${className}`} dir="rtl">
            {/* الرأس */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
                            <ScannerIcon />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">الماسح الضوئي الذكي</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">مسح + OCR + استخراج تلقائي</p>
                        </div>
                    </div>

                    {/* شارة الحالة */}
                    <div className={`px-4 py-2 rounded-full border text-sm font-medium ${getStateColor()}`}>
                        {isScanning && <SpinnerIcon />}
                        {statusMessage || 'جاهز'}
                    </div>
                </div>

                {/* شريط التقدم */}
                {(isScanning || isProcessing) && (
                    <div className="mt-4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">{Math.round(progress)}%</p>
                    </div>
                )}
            </div>

            {/* التبويبات */}
            <div className="flex border-b border-gray-100 dark:border-gray-800">
                {[
                    { id: 'scan', label: 'المسح', icon: <ScannerIcon /> },
                    { id: 'ocr', label: 'OCR', icon: <OcrIcon />, disabled: !hasImages },
                    { id: 'data', label: 'البيانات', icon: '📊', disabled: !hasOcrResult },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => !tab.disabled && setActiveTab(tab.id)}
                        disabled={tab.disabled}
                        className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors
                            ${activeTab === tab.id
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                : tab.disabled
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        {typeof tab.icon === 'string' ? <span>{tab.icon}</span> : tab.icon}
                        <span>{tab.label}</span>
                        {tab.id === 'scan' && hasImages && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                                {scannedImages.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* المحتوى */}
            <div className="p-4">
                {/* تبويب المسح */}
                {activeTab === 'scan' && (
                    <div className="space-y-4">
                        {/* اختيار الماسح */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">اختر مصدر المسح</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {scanners.map((scanner) => (
                                    <button
                                        key={scanner.index}
                                        onClick={() => selectScanner(scanner)}
                                        className={`p-4 rounded-xl border-2 transition-all text-right
                                            ${selectedScanner?.index === scanner.index
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                                                ${selectedScanner?.index === scanner.index
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700/50'
                                                }`}>
                                                {scanner.type === 'camera' ? <CameraIcon /> : <ScannerIcon />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{scanner.model || scanner.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{scanner.type}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* إعدادات المسح */}
                        {showSettings && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-4">
                                <h4 className="font-medium text-gray-900 dark:text-white">إعدادات المسح</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">الدقة (DPI)</label>
                                        <select
                                            value={scanConfig.dpi}
                                            onChange={(e) => setScanConfig(prev => ({ ...prev, dpi: parseInt(e.target.value) }))}
                                            className="w-full p-2 border rounded-lg text-sm"
                                        >
                                            {DPI_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.nameAr}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">الألوان</label>
                                        <select
                                            value={scanConfig.colorMode}
                                            onChange={(e) => setScanConfig(prev => ({ ...prev, colorMode: e.target.value }))}
                                            className="w-full p-2 border rounded-lg text-sm"
                                        >
                                            {Object.values(COLOR_MODES).map(mode => (
                                                <option key={mode.id} value={mode.id}>{mode.nameAr}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">حجم الورق</label>
                                        <select
                                            value={scanConfig.paperSize}
                                            onChange={(e) => setScanConfig(prev => ({ ...prev, paperSize: e.target.value }))}
                                            className="w-full p-2 border rounded-lg text-sm"
                                        >
                                            {Object.entries(PAPER_SIZES).map(([key, size]) => (
                                                <option key={key} value={key}>{size.nameAr}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-end gap-4">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={scanConfig.duplex}
                                                onChange={(e) => setScanConfig(prev => ({ ...prev, duplex: e.target.checked }))}
                                                className="rounded"
                                            />
                                            <span>وجهين</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* أزرار الإجراءات */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleStartScan}
                                disabled={!selectedScanner || isScanning}
                                className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                            >
                                {isScanning ? <SpinnerIcon /> : <ScannerIcon />}
                                <span>{isScanning ? 'جاري المسح...' : 'بدء المسح'}</span>
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 sm:flex-none px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 font-medium"
                            >
                                <UploadIcon />
                                <span>رفع ملف</span>
                            </button>

                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50"
                            >
                                ⚙️
                            </button>

                            {hasImages && (
                                <button
                                    onClick={clearAll}
                                    className="px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 rounded-xl"
                                >
                                    🗑️ مسح الكل
                                </button>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,application/pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                        />

                        {/* عرض الصور الممسوحة */}
                        {hasImages && (
                            <div className="mt-4">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-3">الصور الممسوحة ({scannedImages.length})</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {scannedImages.map((image, index) => (
                                        <div
                                            key={image.id || index}
                                            className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                                                ${currentImage?.id === image.id
                                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                }`}
                                            onClick={() => {
                                                setCurrentImage(image);
                                                setActiveTab('ocr');
                                            }}
                                        >
                                            <img
                                                src={image.data}
                                                alt={`صفحة ${index + 1}`}
                                                className="w-full aspect-[3/4] object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); rotateImage(index); }}
                                                        className="p-2 bg-white dark:bg-gray-900 rounded-lg shadow"
                                                    >
                                                        🔄
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                                                        className="p-2 bg-white dark:bg-gray-900 rounded-lg shadow text-red-600 dark:text-red-400"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                                                صفحة {index + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* رسالة الخطأ */}
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
                                ❌ {error}
                            </div>
                        )}
                    </div>
                )}

                {/* تبويب OCR */}
                {activeTab === 'ocr' && currentImage && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-white">الخريطة التفاعلية - انقر على النص لتعيينه</h4>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setZoom(Math.max(50, zoom - 25))}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    ➖
                                </button>
                                <span className="text-sm text-gray-600 dark:text-gray-300 w-16 text-center">{zoom}%</span>
                                <button
                                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    ➕
                                </button>
                            </div>
                        </div>

                        {ocrResult ? (
                            <OcrImageMap
                                imageSrc={currentImage.data}
                                regions={ocrResult.regions || []}
                                extractedData={extractedData}
                                zoom={zoom}
                                showRegions={true}
                                showConfidence={true}
                                onFieldAssign={assignFieldValue}
                            />
                        ) : (
                            <div className="text-center py-8">
                                <button
                                    onClick={() => processOcr(currentImage.data)}
                                    disabled={isProcessing}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
                                >
                                    {isProcessing ? <SpinnerIcon /> : <OcrIcon />}
                                    <span>{isProcessing ? 'جاري المعالجة...' : 'بدء معالجة OCR'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* تبويب البيانات */}
                {activeTab === 'data' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ExtractedDataPanel
                            extractedData={extractedData}
                            classification={classification}
                            onFieldChange={assignFieldValue}
                            onApplyToForm={handleApplyToForm}
                        />
                        {ocrResult && (
                            <FullTextPanel
                                fullText={ocrResult.fullText}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
