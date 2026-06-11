/**
 * Scanner Integration Module - تكامل الماسحات الضوئية
 * ✅ يستخدم Masarat Scanner Bridge (مجاني) بدلاً من Dynamsoft
 * Supports: TWAIN, WIA via local bridge, Camera, File Upload
 */

import { ScannerBridge } from './scanner/ScannerBridge';

// Scanner configuration
const SCANNER_CONFIG = {
    defaultDPI: 300,
    colorMode: 'Color', // Color, Grayscale, BlackWhite
    paperSize: 'A4',
    duplex: false,
    autoFeeder: true,
    showUI: false,
};

// ✅ Bridge Scanner (بديل مجاني لـ Dynamsoft)
class BridgeScanner {
    constructor() {
        this.bridge = new ScannerBridge();
        this.isInitialized = false;
        this.isConnected = false;
        this.onScanComplete = null;
        this.onError = null;
    }

    async initialize() {
        if (typeof window === 'undefined') {
            throw new Error('Scanner only works in browser');
        }

        const result = await this.bridge.initialize();
        this.isInitialized = true;
        this.isConnected = result.success && result.available;
        return this.isConnected;
    }

    // Get available scanners
    async getScanners() {
        if (this.isConnected) {
            const result = await this.bridge.getScanners(true);
            if (result.success && result.scanners.length > 0) {
                return result.scanners;
            }
        }
        return this.getFallbackScanners();
    }

    // Fallback scanner detection
    getFallbackScanners() {
        return [
            { index: -1, name: 'كاميرا الجهاز (Device Camera)', type: 'camera' },
            { index: -2, name: 'رفع ملف من الجهاز (File Upload)', type: 'file' },
        ];
    }

    // Select scanner
    selectScanner(index) {
        return true;
    }

    // Scan document
    async scan(options = {}) {
        const config = { ...SCANNER_CONFIG, ...options };

        if (this.isConnected) {
            return this.scanWithBridge(config);
        } else {
            return this.scanWithFallback(config);
        }
    }

    // ✅ Scan via local bridge service
    async scanWithBridge(config) {
        try {
            const result = await this.bridge.scan({
                scannerIndex: config.scannerIndex || 0,
                dpi: config.defaultDPI || config.dpi || 300,
                colorMode: (config.colorMode || 'Color').toLowerCase(),
                paperSize: config.paperSize || 'A4',
                duplex: config.duplex || false,
                autoFeeder: config.autoFeeder || false,
                showUI: config.showUI || false,
                jpegQuality: 85,
                outputFormat: 'jpeg',
            });

            return result.images || [];
        } catch (error) {
            throw new Error(`خطأ في المسح: ${error.message}`);
        }
    }

    // Fallback scanning using camera/file input
    async scanWithFallback(config) {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment';
            input.multiple = true;

            input.onchange = async (e) => {
                const files = Array.from(e.target.files);
                const images = await Promise.all(
                    files.map(async (file, index) => {
                        const base64 = await this.fileToBase64(file);
                        return {
                            index,
                            data: base64,
                            file,
                            name: file.name,
                            size: file.size,
                            type: file.type,
                        };
                    })
                );
                resolve(images);
            };

            input.onerror = () => reject(new Error('Failed to capture image'));
            input.click();
        });
    }

    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Clear buffer
    clearBuffer() {
        // No-op: buffer is managed in memory
    }

    // Destroy
    destroy() {
        if (this.bridge) {
            this.bridge.destroy();
        }
        this.isInitialized = false;
        this.isConnected = false;
    }
}

// Web Camera Scanner (for mobile/tablets)
class WebCameraScanner {
    constructor() {
        this.stream = null;
        this.videoElement = null;
    }

    async start(videoElement) {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            });
            this.videoElement = videoElement;
            videoElement.srcObject = this.stream;
            await videoElement.play();
            return true;
        } catch (error) {
            console.error('Camera error:', error);
            throw new Error('تعذر الوصول للكاميرا. تأكد من منح الإذن.');
        }
    }

    capture() {
        if (!this.videoElement) return null;

        const canvas = document.createElement('canvas');
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.videoElement, 0, 0);

        return {
            dataUrl: canvas.toDataURL('image/jpeg', 0.95),
            blob: new Promise((resolve) => {
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
            }),
            width: canvas.width,
            height: canvas.height,
        };
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
            this.videoElement = null;
        }
    }
}

// Unified Scanner Interface
export class ScannerService {
    constructor() {
        this.bridgeScanner = new BridgeScanner();
        this.cameraScanner = new WebCameraScanner();
        this.mode = 'auto'; // auto, bridge, camera
    }

    async initialize() {
        try {
            const connected = await this.bridgeScanner.initialize();
            if (connected) {
                this.mode = 'bridge';
                return { success: true, mode: 'bridge' };
            }
        } catch (error) {
            console.warn('Bridge not available:', error.message);
        }

        this.mode = 'camera';
        return { success: true, mode: 'camera' };
    }

    async getScanners() {
        return await this.bridgeScanner.getScanners();
    }

    async scan(options = {}) {
        return await this.bridgeScanner.scan(options);
    }

    async startCamera(videoElement) {
        return await this.cameraScanner.start(videoElement);
    }

    captureFromCamera() {
        return this.cameraScanner.capture();
    }

    stopCamera() {
        this.cameraScanner.stop();
    }

    destroy() {
        this.bridgeScanner.destroy();
        this.cameraScanner.stop();
    }
}

export default new ScannerService();
