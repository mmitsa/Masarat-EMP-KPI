/**
 * تصدير مكونات الماسح الضوئي وإدارة المرفقات
 * Scanner and Attachment Components Export
 */

// المكونات الرئيسية
export { default as ScannerInterface } from './ScannerInterface';
export { default as ImageEditor, QuickEditButton } from './ImageEditor';
export { default as PDFViewer, PDFThumbnail } from './PDFViewer';
export { default as AttachmentManager } from './AttachmentManager';

// مكونات OCR التفاعلية
export { default as OcrImageMap, ExtractedDataPanel, FullTextPanel } from './OcrImageMap';

// المكون المدمج (الماسح + OCR)
export { default as ScannerWithOcr } from './ScannerWithOcr';

// الخدمات
export { default as scannerService, ScannerService, DEFAULT_SCAN_CONFIG, PAPER_SIZES, COLOR_MODES, DPI_OPTIONS } from '../../lib/scanner/ScannerService';

// خدمة OCR
export { default as ocrService, OcrService, OCR_CONFIG, EXTRACTION_PATTERNS, DOCUMENT_CLASSIFICATIONS } from '../../lib/scanner/OcrService';

// قاعدة بيانات الماسحات
export {
    SCANNER_MANUFACTURERS,
    SCANNER_TYPES,
    SCANNER_DATABASE,
    identifyScanner,
    searchScanners,
    getRecommendedScanners,
    getScannerById,
} from '../../lib/scanner/scannerDatabase';
