/**
 * useOcrScanner Hook
 * هوك مخصص للماسح الضوئي مع OCR متكامل
 *
 * يجمع بين:
 * - المسح المباشر (بدون مجلد وسيط)
 * - معالجة OCR تلقائية
 * - استخراج البيانات بالذكاء الاصطناعي
 * - التعبئة التلقائية للحقول
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import scannerService from '../lib/scanner/ScannerService';
import ocrService from '../lib/scanner/OcrService';

/**
 * حالات الماسح
 */
export const SCANNER_STATES = {
    IDLE: 'idle',
    INITIALIZING: 'initializing',
    READY: 'ready',
    SCANNING: 'scanning',
    PROCESSING_OCR: 'processing_ocr',
    EXTRACTING: 'extracting',
    COMPLETED: 'completed',
    ERROR: 'error',
};

/**
 * Hook الرئيسي
 */
export function useOcrScanner(options = {}) {
    const {
        autoInitialize = true,
        autoProcessOcr = true,
        onScanComplete,
        onOcrComplete,
        onDataExtracted,
        onError,
    } = options;

    // الحالات
    const [state, setState] = useState(SCANNER_STATES.IDLE);
    const [statusMessage, setStatusMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const [scanners, setScanners] = useState([]);
    const [selectedScanner, setSelectedScanner] = useState(null);
    const [scannedImages, setScannedImages] = useState([]);
    const [currentImage, setCurrentImage] = useState(null);
    const [ocrResult, setOcrResult] = useState(null);
    const [extractedData, setExtractedData] = useState({});
    const [classification, setClassification] = useState(null);
    const [error, setError] = useState(null);

    // المراجع
    const isInitializedRef = useRef(false);

    /**
     * تهيئة الخدمات
     */
    const initialize = useCallback(async () => {
        if (isInitializedRef.current) return;

        setState(SCANNER_STATES.INITIALIZING);
        setStatusMessage('جاري تهيئة الماسح ومحرك OCR...');

        try {
            // تهيئة خدمة الماسح
            await scannerService.initialize();
            const availableScanners = await scannerService.getScanners();
            setScanners(availableScanners);

            // تهيئة خدمة OCR
            await ocrService.initialize();

            // إعداد مستمعي الأحداث
            setupEventListeners();

            isInitializedRef.current = true;
            setState(SCANNER_STATES.READY);
            setStatusMessage('جاهز للمسح');

        } catch (err) {
            setState(SCANNER_STATES.ERROR);
            setError(err.message);
            setStatusMessage('فشل في التهيئة: ' + err.message);
            onError?.(err);
        }
    }, [onError]);

    /**
     * إعداد مستمعي الأحداث
     */
    const setupEventListeners = useCallback(() => {
        // أحداث الماسح
        scannerService.on('imageCaptured', handleImageCaptured);
        scannerService.on('scanComplete', handleScanComplete);
        scannerService.on('scanError', handleScanError);

        // أحداث OCR
        ocrService.on('progress', (data) => {
            setProgress(data.progress);
        });
        ocrService.on('completed', handleOcrComplete);
        ocrService.on('error', handleOcrError);
    }, []);

    /**
     * معالجة صورة ملتقطة
     */
    const handleImageCaptured = useCallback(async (image) => {
        setScannedImages(prev => [...prev, image]);
        setCurrentImage(image);

        if (autoProcessOcr) {
            await processOcr(image.data);
        }
    }, [autoProcessOcr]);

    /**
     * معالجة اكتمال المسح
     */
    const handleScanComplete = useCallback((result) => {
        setState(SCANNER_STATES.COMPLETED);
        setStatusMessage('تم المسح بنجاح');
        onScanComplete?.(result);
    }, [onScanComplete]);

    /**
     * معالجة خطأ المسح
     */
    const handleScanError = useCallback((data) => {
        setState(SCANNER_STATES.ERROR);
        setError(data.error);
        setStatusMessage('خطأ: ' + data.error);
        onError?.(data);
    }, [onError]);

    /**
     * معالجة اكتمال OCR
     */
    const handleOcrComplete = useCallback((result) => {
        setOcrResult(result);
        setExtractedData(result.extractedData || {});
        setClassification(result.classification);
        setState(SCANNER_STATES.COMPLETED);
        setStatusMessage('تم استخراج النص والبيانات');
        onOcrComplete?.(result);
        onDataExtracted?.(result.extractedData, result.classification);
    }, [onOcrComplete, onDataExtracted]);

    /**
     * معالجة خطأ OCR
     */
    const handleOcrError = useCallback((data) => {
        // لا نوقف العملية، فقط نسجل الخطأ
        console.warn('OCR Error:', data.error);
        setState(SCANNER_STATES.COMPLETED);
        setStatusMessage('تم المسح (بدون OCR)');
    }, []);

    /**
     * اختيار ماسح
     */
    const selectScanner = useCallback(async (scanner) => {
        try {
            await scannerService.selectScanner(scanner.index);
            setSelectedScanner(scanner);
            setStatusMessage(`تم اختيار: ${scanner.model || scanner.name}`);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    /**
     * بدء المسح
     */
    const startScan = useCallback(async (config = {}) => {
        if (!selectedScanner) {
            setError('يرجى اختيار ماسح أولاً');
            return;
        }

        setState(SCANNER_STATES.SCANNING);
        setStatusMessage('جاري المسح...');
        setProgress(0);
        setError(null);

        try {
            const result = await scannerService.startScan(config);
            return result;
        } catch (err) {
            setState(SCANNER_STATES.ERROR);
            setError(err.message);
            throw err;
        }
    }, [selectedScanner]);

    /**
     * معالجة OCR لصورة
     */
    const processOcr = useCallback(async (imageSource) => {
        setState(SCANNER_STATES.PROCESSING_OCR);
        setStatusMessage('جاري معالجة OCR...');
        setProgress(0);

        try {
            const result = await ocrService.processImage(imageSource);
            return result;
        } catch (err) {
            console.error('OCR Error:', err);
            return null;
        }
    }, []);

    /**
     * معالجة OCR لملف مرفوع
     */
    const processUploadedFile = useCallback(async (file) => {
        setState(SCANNER_STATES.PROCESSING_OCR);
        setStatusMessage('جاري معالجة الملف...');

        try {
            // تحويل الملف لـ Data URL
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // إضافة للصور الممسوحة
            const image = {
                id: Date.now(),
                data: dataUrl,
                name: file.name,
                size: file.size,
                type: file.type,
                source: 'upload',
                timestamp: new Date().toISOString(),
            };

            setScannedImages(prev => [...prev, image]);
            setCurrentImage(image);

            // معالجة OCR
            if (autoProcessOcr && file.type.startsWith('image/')) {
                const result = await processOcr(dataUrl);
                return { image, ocrResult: result };
            }

            return { image, ocrResult: null };

        } catch (err) {
            setState(SCANNER_STATES.ERROR);
            setError(err.message);
            throw err;
        }
    }, [autoProcessOcr, processOcr]);

    /**
     * تعيين قيمة لحقل من OCR
     */
    const assignFieldValue = useCallback((fieldId, value) => {
        setExtractedData(prev => ({
            ...prev,
            [fieldId]: value,
        }));
    }, []);

    /**
     * تطبيق البيانات المستخرجة على نموذج
     */
    const applyExtractedData = useCallback((formSetter) => {
        if (!extractedData) return;

        const fieldMappings = {
            documentNumber: 'referenceNumber',
            date: 'transactionDate',
            subject: 'title',
            sender: 'sourceOrganization',
            recipient: 'destinationOrganization',
            referenceNumber: 'referenceNumber',
        };

        const formData = {};
        for (const [ocrField, formField] of Object.entries(fieldMappings)) {
            if (extractedData[ocrField]) {
                formData[formField] = extractedData[ocrField];
            }
        }

        formSetter(prev => ({ ...prev, ...formData }));
    }, [extractedData]);

    /**
     * مسح كل البيانات
     */
    const clearAll = useCallback(() => {
        scannerService.clearBuffer();
        setScannedImages([]);
        setCurrentImage(null);
        setOcrResult(null);
        setExtractedData({});
        setClassification(null);
        setError(null);
        setState(SCANNER_STATES.READY);
        setStatusMessage('جاهز للمسح');
    }, []);

    /**
     * حذف صورة
     */
    const removeImage = useCallback((index) => {
        scannerService.removeImage(index);
        setScannedImages(scannerService.getImages());
    }, []);

    /**
     * تدوير صورة
     */
    const rotateImage = useCallback(async (index, degrees = 90) => {
        await scannerService.rotateImage(index, degrees);
        setScannedImages([...scannerService.getImages()]);
    }, []);

    // التهيئة التلقائية
    useEffect(() => {
        if (autoInitialize) {
            initialize();
        }

        return () => {
            scannerService.stopCamera();
        };
    }, [autoInitialize, initialize]);

    // القيم المشتقة
    const isReady = state === SCANNER_STATES.READY || state === SCANNER_STATES.COMPLETED;
    const isScanning = state === SCANNER_STATES.SCANNING;
    const isProcessing = state === SCANNER_STATES.PROCESSING_OCR || state === SCANNER_STATES.EXTRACTING;
    const hasImages = scannedImages.length > 0;
    const hasOcrResult = ocrResult !== null;

    return {
        // الحالات
        state,
        statusMessage,
        progress,
        error,

        // الماسحات
        scanners,
        selectedScanner,
        selectScanner,

        // الصور
        scannedImages,
        currentImage,
        setCurrentImage,
        removeImage,
        rotateImage,

        // OCR
        ocrResult,
        extractedData,
        classification,
        processOcr,
        assignFieldValue,

        // الإجراءات
        initialize,
        startScan,
        processUploadedFile,
        applyExtractedData,
        clearAll,

        // الحالات المشتقة
        isReady,
        isScanning,
        isProcessing,
        hasImages,
        hasOcrResult,
    };
}

export default useOcrScanner;
