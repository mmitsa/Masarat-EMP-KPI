/**
 * تصدير خدمات الماسح الضوئي
 * Scanner Services Export
 */

// خدمة الماسح الرئيسية
export {
    default as scannerService,
    ScannerService,
    DEFAULT_SCAN_CONFIG,
    PAPER_SIZES,
    COLOR_MODES,
    DPI_OPTIONS,
} from './ScannerService';

// قاعدة بيانات الماسحات
export {
    default as scannerDatabase,
    SCANNER_MANUFACTURERS,
    SCANNER_TYPES,
    SCANNER_DATABASE,
    SCANNER_PATTERNS,
    identifyScanner,
    searchScanners,
    getRecommendedScanners,
    getScannerById,
} from './scannerDatabase';

// خدمة OCR المتكاملة
export {
    default as ocrService,
    OcrService,
    OCR_CONFIG,
    EXTRACTION_PATTERNS,
    DOCUMENT_CLASSIFICATIONS,
} from './OcrService';
