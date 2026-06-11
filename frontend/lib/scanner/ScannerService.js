/**
 * خدمة الماسحات الضوئية المتقدمة
 * Advanced Scanner Service
 *
 * يوفر واجهة موحدة للتحكم في الماسحات الضوئية
 * مع دعم TWAIN, WIA, وكاميرا الجهاز
 *
 * ✅ يستخدم Masarat Scanner Bridge (مجاني) بدلاً من Dynamsoft (مدفوع)
 * الخدمة المحلية: http://localhost:11234
 */

import { identifyScanner, getScannerById, SCANNER_MANUFACTURERS } from './scannerDatabase';
import { ScannerBridge, CONNECTION_STATUS } from './ScannerBridge';

// إعدادات المسح الافتراضية
export const DEFAULT_SCAN_CONFIG = {
    dpi: 300,
    colorMode: 'color', // color, grayscale, blackwhite
    paperSize: 'A4',
    duplex: false,
    autoFeeder: false,
    showUI: false,
    brightness: 0,
    contrast: 0,
    threshold: 128,
    autoRotate: true,
    autoDeskew: true,
    removeBlankPages: false,
    outputFormat: 'jpeg', // jpeg, png, pdf, tiff
    jpegQuality: 85,
};

// أحجام الورق
export const PAPER_SIZES = {
    A4: { width: 210, height: 297, nameAr: 'A4' },
    A3: { width: 297, height: 420, nameAr: 'A3' },
    A5: { width: 148, height: 210, nameAr: 'A5' },
    Letter: { width: 216, height: 279, nameAr: 'ليتر' },
    Legal: { width: 216, height: 356, nameAr: 'ليجال' },
    Photo4x6: { width: 102, height: 152, nameAr: 'صورة 4×6' },
    Photo5x7: { width: 127, height: 178, nameAr: 'صورة 5×7' },
    BusinessCard: { width: 89, height: 51, nameAr: 'بطاقة عمل' },
    Custom: { width: 0, height: 0, nameAr: 'مخصص' },
};

// أوضاع الألوان
export const COLOR_MODES = {
    color: { id: 'color', name: 'Color', nameAr: 'ألوان كاملة', value: 2 },
    grayscale: { id: 'grayscale', name: 'Grayscale', nameAr: 'تدرج رمادي', value: 1 },
    blackwhite: { id: 'blackwhite', name: 'Black & White', nameAr: 'أبيض وأسود', value: 0 },
};

// دقة المسح
export const DPI_OPTIONS = [
    { value: 75, label: '75 DPI', nameAr: 'منخفضة' },
    { value: 100, label: '100 DPI', nameAr: 'عادية' },
    { value: 150, label: '150 DPI', nameAr: 'متوسطة' },
    { value: 200, label: '200 DPI', nameAr: 'جيدة' },
    { value: 300, label: '300 DPI', nameAr: 'عالية (موصى بها)', recommended: true },
    { value: 400, label: '400 DPI', nameAr: 'عالية جداً' },
    { value: 600, label: '600 DPI', nameAr: 'ممتازة' },
    { value: 1200, label: '1200 DPI', nameAr: 'احترافية' },
];

/**
 * فئة خدمة الماسحات الضوئية
 */
export class ScannerService {
    constructor() {
        this.isInitialized = false;
        this.scanners = [];
        this.selectedScanner = null;
        this.selectedScannerInfo = null;
        this.dwObject = null;
        this.cameraStream = null;
        this.mode = 'auto'; // auto, bridge, twain, wia, camera
        this.listeners = new Map();
        this.scanBuffer = [];
        this.isScanning = false;

        // ✅ Masarat Scanner Bridge (بديل مجاني لـ Dynamsoft)
        this.bridge = new ScannerBridge();
        this.bridgeConnected = false;
    }

    /**
     * تهيئة الخدمة
     */
    async initialize() {
        if (this.isInitialized) return { success: true };

        try {
            if (typeof window !== 'undefined') {
                // ✅ أولاً: محاولة الاتصال بالخدمة المحلية المجانية
                const bridgeResult = await this.initializeBridge();
                if (bridgeResult.success && bridgeResult.available) {
                    this.mode = 'bridge';
                    this.bridgeConnected = true;
                    this.isInitialized = true;
                    this.emit('initialized', { success: true, mode: 'bridge' });
                    return { success: true, mode: 'bridge' };
                }

                // الخدمة المحلية غير متاحة - fallback للكاميرا/ملفات
                console.warn('خدمة الماسح المحلية غير متوفرة - استخدام الكاميرا/الملفات');
            }

            this.mode = 'camera';
            this.isInitialized = true;
            this.emit('initialized', { success: true, mode: this.mode, fallback: true });
            return { success: true, mode: this.mode, fallback: true };
        } catch (error) {
            console.error('Scanner initialization error:', error);
            this.mode = 'camera';
            this.isInitialized = true;
            return { success: true, mode: 'camera', fallback: true };
        }
    }

    /**
     * ✅ تهيئة الخدمة المحلية (بديل Dynamsoft)
     */
    async initializeBridge() {
        try {
            const result = await this.bridge.initialize();

            if (result.success && result.available) {
                // ربط أحداث الجسر
                this.bridge.on('scanStarted', (data) => {
                    this.emit('scanStarted', data);
                });
                this.bridge.on('scanComplete', (data) => {
                    if (data.images) {
                        this.scanBuffer = [...this.scanBuffer, ...data.images];
                    }
                    this.emit('scanComplete', data);
                });
                this.bridge.on('scanError', (data) => {
                    this.emit('scanError', data);
                });
                this.bridge.on('disconnected', () => {
                    this.bridgeConnected = false;
                    this.emit('bridgeDisconnected');
                });
                this.bridge.on('statusChange', (data) => {
                    this.bridgeConnected = data.status === CONNECTION_STATUS.CONNECTED;
                    this.emit('bridgeStatusChange', data);
                });

                return result;
            }

            return { success: false, available: false };
        } catch (error) {
            return { success: false, available: false, error: error.message };
        }
    }

    /**
     * الحصول على قائمة الماسحات المتصلة
     */
    async getScanners() {
        const scanners = [];

        try {
            // ✅ الخدمة المحلية المجانية (بدل Dynamsoft)
            if (this.bridgeConnected) {
                const bridgeResult = await this.bridge.getScanners(true);
                if (bridgeResult.success && bridgeResult.scanners.length > 0) {
                    for (const s of bridgeResult.scanners) {
                        const scannerInfo = identifyScanner(s.name);
                        scanners.push({
                            index: s.index,
                            name: s.name,
                            type: s.type, // twain أو wia
                            info: scannerInfo,
                            isIdentified: !!scannerInfo,
                            manufacturer: s.manufacturer || scannerInfo?.manufacturerInfo || null,
                            model: scannerInfo?.model || s.model || s.name,
                            manufacturerInfo: s.manufacturer ? { nameAr: s.manufacturer } : scannerInfo?.manufacturerInfo || null,
                            capabilities: scannerInfo ? {
                                maxDPI: scannerInfo.maxDPI,
                                hasADF: scannerInfo.adf,
                                hasDuplex: scannerInfo.duplex,
                                colorDepth: scannerInfo.colorDepth,
                            } : null,
                            source: 'bridge',
                        });
                    }
                }
            }

            // إضافة خيار الكاميرا
            if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                scanners.push({
                    index: -1,
                    name: 'كاميرا الجهاز',
                    type: 'camera',
                    info: null,
                    isIdentified: true,
                    model: 'Device Camera',
                    icon: 'camera',
                });
            }

            // إضافة خيار رفع الملفات
            scanners.push({
                index: -2,
                name: 'رفع ملف من الجهاز',
                type: 'file',
                info: null,
                isIdentified: true,
                model: 'File Upload',
                icon: 'upload',
            });

        } catch (error) {
            console.error('Error getting scanners:', error);
        }

        this.scanners = scanners;
        return scanners;
    }

    /**
     * اختيار ماسح
     */
    async selectScanner(index) {
        const scanner = this.scanners.find(s => s.index === index);
        if (!scanner) {
            throw new Error('الماسح غير موجود');
        }

        this.selectedScanner = scanner;
        this.selectedScannerInfo = scanner.info;

        this.emit('scannerSelected', scanner);
        return scanner;
    }

    /**
     * الحصول على إمكانيات الماسح المحدد
     */
    async getScannerCapabilities() {
        if (!this.selectedScanner) return null;

        const capabilities = {
            supportedDPI: [75, 100, 150, 200, 300, 400, 600],
            supportedColorModes: ['color', 'grayscale', 'blackwhite'],
            supportedPaperSizes: ['A4', 'Letter', 'Legal'],
            hasADF: false,
            hasDuplex: false,
            hasFlatbed: true,
            maxWidth: 216,
            maxHeight: 356,
        };

        // ✅ استخدام الخدمة المحلية للحصول على الإمكانيات
        if (this.bridgeConnected && this.selectedScanner.source === 'bridge') {
            try {
                const bridgeCaps = await this.bridge.getScannerCapabilities(this.selectedScanner.index);
                if (bridgeCaps) {
                    capabilities.supportedDPI = bridgeCaps.supported_dpi || capabilities.supportedDPI;
                    capabilities.hasADF = bridgeCaps.has_adf || false;
                    capabilities.hasDuplex = bridgeCaps.has_duplex || false;
                    capabilities.hasFlatbed = bridgeCaps.has_flatbed !== false;
                }
            } catch (e) {
                console.warn('Could not get bridge capabilities:', e);
            }
        }

        // دمج معلومات من قاعدة البيانات
        if (this.selectedScannerInfo) {
            capabilities.supportedDPI = DPI_OPTIONS
                .filter(d => d.value <= (this.selectedScannerInfo.maxDPI || 600))
                .map(d => d.value);
            capabilities.hasADF = this.selectedScannerInfo.adf || capabilities.hasADF;
            capabilities.hasDuplex = this.selectedScannerInfo.duplex || capabilities.hasDuplex;
        }

        return capabilities;
    }

    /**
     * بدء المسح
     */
    async startScan(config = {}) {
        const scanConfig = { ...DEFAULT_SCAN_CONFIG, ...config };

        if (this.isScanning) {
            throw new Error('عملية مسح أخرى قيد التنفيذ');
        }

        this.isScanning = true;
        this.emit('scanStarted', { config: scanConfig });

        try {
            let result;

            // ✅ الخدمة المحلية المجانية (TWAIN/WIA)
            if (this.bridgeConnected && this.selectedScanner?.source === 'bridge') {
                result = await this.scanWithBridge(scanConfig);
            } else if (this.selectedScanner?.type === 'camera') {
                result = await this.scanWithCamera(scanConfig);
            } else {
                result = await this.scanWithFileInput(scanConfig);
            }

            this.isScanning = false;
            this.emit('scanComplete', result);
            return result;

        } catch (error) {
            this.isScanning = false;
            this.emit('scanError', { error: error.message });
            throw error;
        }
    }

    /**
     * ✅ المسح عبر الخدمة المحلية (بديل Dynamsoft)
     */
    async scanWithBridge(config) {
        try {
            const result = await this.bridge.scan({
                scannerIndex: this.selectedScanner.index,
                dpi: config.dpi,
                colorMode: config.colorMode,
                paperSize: config.paperSize,
                duplex: config.duplex,
                autoFeeder: config.autoFeeder,
                showUI: config.showUI,
                brightness: config.brightness,
                contrast: config.contrast,
                jpegQuality: config.jpegQuality,
                outputFormat: config.outputFormat,
            });

            if (result.success && result.images) {
                // إضافة الصور للمخزن المؤقت
                this.scanBuffer = [...this.scanBuffer, ...result.images];

                // إرسال حدث لكل صفحة
                result.images.forEach((img, i) => {
                    this.emit('pageScanned', { pageCount: i + 1 });
                    this.emit('imageCaptured', img);
                });
            }

            return result;
        } catch (error) {
            throw new Error(`خطأ في المسح: ${error.message}`);
        }
    }

    /**
     * المسح باستخدام الكاميرا
     */
    async scanWithCamera(config) {
        return new Promise((resolve, reject) => {
            // سيتم التعامل معها في مكون الواجهة
            this.emit('cameraRequired', { config });

            // نستخدم listener للانتظار
            const timeout = setTimeout(() => {
                reject(new Error('انتهت مهلة انتظار الكاميرا'));
            }, 300000); // 5 دقائق

            this.once('cameraCapture', (data) => {
                clearTimeout(timeout);
                resolve(data);
            });
        });
    }

    /**
     * التقاط صورة من الكاميرا
     */
    async captureFromCamera(videoElement) {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));

        const image = {
            index: this.scanBuffer.length,
            data: dataUrl,
            blob,
            width: canvas.width,
            height: canvas.height,
            format: 'jpeg',
            timestamp: new Date().toISOString(),
            source: 'camera',
        };

        this.scanBuffer.push(image);
        this.emit('imageCaptured', image);

        return image;
    }

    /**
     * بدء تشغيل الكاميرا
     */
    async startCamera(videoElement, facingMode = 'environment') {
        try {
            const constraints = {
                video: {
                    facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            };

            this.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = this.cameraStream;
            await videoElement.play();

            this.emit('cameraStarted');
            return true;
        } catch (error) {
            throw new Error('تعذر الوصول للكاميرا: ' + error.message);
        }
    }

    /**
     * إيقاف الكاميرا
     */
    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
            this.emit('cameraStopped');
        }
    }

    /**
     * المسح من ملف
     */
    async scanWithFileInput(config) {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,.pdf';
            input.multiple = true;
            input.capture = 'environment';

            input.onchange = async (e) => {
                try {
                    const files = Array.from(e.target.files);
                    const images = await Promise.all(
                        files.map(async (file, index) => {
                            const dataUrl = await this.fileToBase64(file);
                            const dimensions = await this.getImageDimensions(dataUrl);

                            return {
                                index,
                                data: dataUrl,
                                file,
                                name: file.name,
                                size: file.size,
                                type: file.type,
                                width: dimensions.width,
                                height: dimensions.height,
                                format: file.type.split('/')[1],
                                timestamp: new Date().toISOString(),
                                source: 'file',
                            };
                        })
                    );

                    this.scanBuffer = [...this.scanBuffer, ...images];
                    resolve({
                        success: true,
                        images,
                        pageCount: images.length,
                    });
                } catch (error) {
                    reject(error);
                }
            };

            input.onerror = () => reject(new Error('فشل في قراءة الملف'));
            input.click();
        });
    }

    /**
     * تحويل ملف إلى Base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * الحصول على أبعاد الصورة
     */
    getImageDimensions(dataUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = () => resolve({ width: 0, height: 0 });
            img.src = dataUrl;
        });
    }

    /**
     * حذف صورة من المخزن المؤقت
     */
    removeImage(index) {
        this.scanBuffer = this.scanBuffer.filter((_, i) => i !== index);
        this.emit('imageRemoved', { index });
    }

    /**
     * إعادة ترتيب الصور
     */
    reorderImages(fromIndex, toIndex) {
        const images = [...this.scanBuffer];
        const [removed] = images.splice(fromIndex, 1);
        images.splice(toIndex, 0, removed);
        this.scanBuffer = images.map((img, i) => ({ ...img, index: i }));
        this.emit('imagesReordered', { images: this.scanBuffer });
        return this.scanBuffer;
    }

    /**
     * تدوير صورة
     */
    async rotateImage(index, degrees) {
        const image = this.scanBuffer[index];
        if (!image) return null;

        // تدوير باستخدام Canvas
        const rotated = await this.rotateImageCanvas(image.data, degrees);
        this.scanBuffer[index] = { ...image, ...rotated };

        this.emit('imageRotated', { index, degrees });
        return this.scanBuffer[index];
    }

    /**
     * تدوير الصورة باستخدام Canvas
     */
    async rotateImageCanvas(dataUrl, degrees) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const radians = (degrees * Math.PI) / 180;
                const sin = Math.abs(Math.sin(radians));
                const cos = Math.abs(Math.cos(radians));

                canvas.width = img.height * sin + img.width * cos;
                canvas.height = img.height * cos + img.width * sin;

                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(radians);
                ctx.drawImage(img, -img.width / 2, -img.height / 2);

                resolve({
                    data: canvas.toDataURL('image/jpeg', 0.95),
                    width: canvas.width,
                    height: canvas.height,
                });
            };
            img.src = dataUrl;
        });
    }

    /**
     * اقتصاص صورة
     */
    async cropImage(index, cropArea) {
        const image = this.scanBuffer[index];
        if (!image) return null;

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = cropArea.width;
                canvas.height = cropArea.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(
                    img,
                    cropArea.x, cropArea.y, cropArea.width, cropArea.height,
                    0, 0, cropArea.width, cropArea.height
                );

                const cropped = {
                    ...image,
                    data: canvas.toDataURL('image/jpeg', 0.95),
                    width: cropArea.width,
                    height: cropArea.height,
                };

                this.scanBuffer[index] = cropped;
                this.emit('imageCropped', { index, cropArea });
                resolve(cropped);
            };
            img.src = image.data;
        });
    }

    /**
     * تطبيق فلتر على صورة
     */
    async applyFilter(index, filter) {
        const image = this.scanBuffer[index];
        if (!image) return null;

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                ctx.filter = this.getFilterString(filter);
                ctx.drawImage(img, 0, 0);

                const filtered = {
                    ...image,
                    data: canvas.toDataURL('image/jpeg', 0.95),
                    filter,
                };

                this.scanBuffer[index] = filtered;
                this.emit('filterApplied', { index, filter });
                resolve(filtered);
            };
            img.src = image.data;
        });
    }

    /**
     * الحصول على نص الفلتر CSS
     */
    getFilterString(filter) {
        const filters = [];

        if (filter.brightness !== undefined) {
            filters.push(`brightness(${100 + filter.brightness}%)`);
        }
        if (filter.contrast !== undefined) {
            filters.push(`contrast(${100 + filter.contrast}%)`);
        }
        if (filter.grayscale) {
            filters.push('grayscale(100%)');
        }
        if (filter.invert) {
            filters.push('invert(100%)');
        }
        if (filter.blur !== undefined) {
            filters.push(`blur(${filter.blur}px)`);
        }
        if (filter.sharpen) {
            // Sharpen is not directly available in CSS, use contrast
            filters.push('contrast(120%)');
        }

        return filters.join(' ') || 'none';
    }

    /**
     * تحويل الصور إلى PDF
     */
    async exportToPDF(options = {}) {
        const { filename = 'scanned-document.pdf', quality = 0.95 } = options;

        if (this.scanBuffer.length === 0) {
            throw new Error('لا توجد صور للتصدير');
        }

        // استخدام jsPDF إذا كان متاحاً
        if (typeof window !== 'undefined' && window.jspdf) {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();

            for (let i = 0; i < this.scanBuffer.length; i++) {
                const image = this.scanBuffer[i];
                if (i > 0) pdf.addPage();

                const imgProps = pdf.getImageProperties(image.data);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(image.data, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }

            return {
                blob: pdf.output('blob'),
                filename,
                pageCount: this.scanBuffer.length,
            };
        }

        throw new Error('مكتبة PDF غير متاحة - يرجى تضمين jsPDF');
    }

    /**
     * تصدير كصور منفصلة
     */
    async exportAsImages(format = 'jpeg') {
        return this.scanBuffer.map(img => ({
            ...img,
            downloadUrl: img.data,
        }));
    }

    /**
     * مسح المخزن المؤقت
     */
    clearBuffer() {
        this.scanBuffer = [];
        this.emit('bufferCleared');
    }

    /**
     * الحصول على الصور الحالية
     */
    getImages() {
        return this.scanBuffer;
    }

    /**
     * الحصول على عدد الصور
     */
    getImageCount() {
        return this.scanBuffer.length;
    }

    // ========== Event Handling ==========

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return () => this.off(event, callback);
    }

    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        this.on(event, wrapper);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
    }

    emit(event, data) {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in scanner event ${event}:`, error);
            }
        });
    }

    /**
     * هل الخدمة المحلية متصلة؟
     */
    isBridgeConnected() {
        return this.bridgeConnected;
    }

    /**
     * حالة الاتصال بالخدمة المحلية
     */
    getBridgeStatus() {
        return {
            connected: this.bridgeConnected,
            status: this.bridge?.status || CONNECTION_STATUS.DISCONNECTED,
            twain: this.bridge?.twainAvailable || false,
            wia: this.bridge?.wiaAvailable || false,
            version: this.bridge?.version || null,
        };
    }

    /**
     * تدمير الخدمة
     */
    destroy() {
        this.stopCamera();
        this.clearBuffer();

        // إيقاف الخدمة المحلية
        if (this.bridge) {
            this.bridge.destroy();
        }

        this.isInitialized = false;
        this.bridgeConnected = false;
        this.listeners.clear();
        this.emit('destroyed');
    }
}

// إنشاء instance افتراضي
const scannerService = new ScannerService();

export default scannerService;
