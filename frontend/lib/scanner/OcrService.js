/**
 * خدمة OCR المتكاملة
 * Integrated OCR Service
 *
 * تعمل مباشرة في المتصفح بدون مجلد وسيط
 * باستخدام Tesseract.js للتعرف على النصوص
 */

// إعدادات OCR
export const OCR_CONFIG = {
    languages: ['ara', 'eng'], // العربية والإنجليزية
    defaultLanguage: 'ara+eng',
    confidenceThreshold: 60,
    preprocessImage: true,
};

// أنماط استخراج البيانات
export const EXTRACTION_PATTERNS = {
    // أرقام المستندات
    documentNumber: [
        /رقم[:\s]*([٠-٩0-9\/\-]+)/i,
        /رقم الوارد[:\s]*([٠-٩0-9\/\-]+)/i,
        /رقم الصادر[:\s]*([٠-٩0-9\/\-]+)/i,
        /الرقم[:\s]*([٠-٩0-9\/\-]+)/i,
        /م\/([٠-٩0-9]+)/,
        /No[.:\s]*([0-9\/\-]+)/i,
        /Ref[.:\s]*([0-9\/\-]+)/i,
    ],

    // التواريخ
    date: [
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
        /([٠-٩]{1,2})[\/\-]([٠-٩]{1,2})[\/\-]([٠-٩]{2,4})/,
        /التاريخ[:\s]*(.+?)(?:\n|$)/i,
        /بتاريخ[:\s]*(.+?)(?:\n|$)/i,
    ],

    // الموضوع
    subject: [
        /الموضوع[:\s]*(.+?)(?:\n|$)/i,
        /بشأن[:\s]*(.+?)(?:\n|$)/i,
        /عن[:\s]*(.+?)(?:\n|$)/i,
        /Subject[:\s]*(.+?)(?:\n|$)/i,
        /Re[:\s]*(.+?)(?:\n|$)/i,
    ],

    // المرسل
    sender: [
        /من[:\s]*(.+?)(?:\n|$)/,
        /صادر من[:\s]*(.+?)(?:\n|$)/i,
        /From[:\s]*(.+?)(?:\n|$)/i,
        /المرسل[:\s]*(.+?)(?:\n|$)/i,
    ],

    // المرسل إليه
    recipient: [
        /إلى[:\s]*(.+?)(?:\n|$)/,
        /الى[:\s]*(.+?)(?:\n|$)/,
        /سعادة[:\s]*(.+?)(?:\n|$)/i,
        /معالي[:\s]*(.+?)(?:\n|$)/i,
        /To[:\s]*(.+?)(?:\n|$)/i,
        /المرسل إليه[:\s]*(.+?)(?:\n|$)/i,
    ],

    // الرقم المرجعي
    referenceNumber: [
        /إشارة إلى[:\s]*(.+?)(?:\n|$)/i,
        /بالإشارة إلى[:\s]*(.+?)(?:\n|$)/i,
        /Reference[:\s]*(.+?)(?:\n|$)/i,
    ],
};

// تصنيفات المستندات
export const DOCUMENT_CLASSIFICATIONS = {
    'incoming_letter': {
        nameAr: 'خطاب وارد',
        keywords: ['وارد', 'سعادة', 'معالي', 'إلى', 'تحية طيبة'],
        patterns: [/خطاب وارد/i, /رقم الوارد/i],
    },
    'outgoing_letter': {
        nameAr: 'خطاب صادر',
        keywords: ['صادر', 'من', 'المملكة العربية السعودية'],
        patterns: [/خطاب صادر/i, /رقم الصادر/i],
    },
    'invoice': {
        nameAr: 'فاتورة',
        keywords: ['فاتورة', 'إجمالي', 'ضريبة', 'المبلغ', 'ريال'],
        patterns: [/فاتورة/i, /invoice/i, /total/i],
    },
    'contract': {
        nameAr: 'عقد',
        keywords: ['عقد', 'اتفاقية', 'الطرف الأول', 'الطرف الثاني'],
        patterns: [/عقد/i, /contract/i, /agreement/i],
    },
    'meeting_minutes': {
        nameAr: 'محضر اجتماع',
        keywords: ['محضر', 'اجتماع', 'الحاضرون', 'جدول الأعمال'],
        patterns: [/محضر اجتماع/i, /minutes/i],
    },
    'report': {
        nameAr: 'تقرير',
        keywords: ['تقرير', 'ملخص', 'توصيات', 'نتائج'],
        patterns: [/تقرير/i, /report/i],
    },
    'decision': {
        nameAr: 'قرار',
        keywords: ['قرار', 'تقرر', 'بناءً على', 'المادة'],
        patterns: [/قرار رقم/i, /decision/i],
    },
};

/**
 * فئة خدمة OCR
 */
export class OcrService {
    constructor() {
        this.worker = null;
        this.isReady = false;
        this.isLoading = false;
        this.listeners = new Map();
    }

    /**
     * تهيئة Tesseract Worker
     */
    async initialize() {
        if (this.isReady || this.isLoading) return;

        this.isLoading = true;
        this.emit('loading', { message: 'جاري تحميل محرك OCR...' });

        try {
            // التحقق من وجود Tesseract
            if (typeof window !== 'undefined' && window.Tesseract) {
                this.worker = await window.Tesseract.createWorker('ara+eng', 1, {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            this.emit('progress', { progress: m.progress * 100 });
                        }
                    },
                });

                this.isReady = true;
                this.isLoading = false;
                this.emit('ready', { message: 'محرك OCR جاهز' });
                return true;
            } else {
                // Fallback: استخدام API خارجي
                console.log('Tesseract not available, using fallback');
                this.isReady = true;
                this.isLoading = false;
                return true;
            }
        } catch (error) {
            this.isLoading = false;
            this.emit('error', { error: error.message });
            throw error;
        }
    }

    /**
     * معالجة صورة واستخراج النص
     */
    async processImage(imageSource) {
        if (!this.isReady) {
            await this.initialize();
        }

        this.emit('processing', { message: 'جاري معالجة الصورة...' });

        try {
            let result;

            if (this.worker) {
                // استخدام Tesseract المحلي
                result = await this.worker.recognize(imageSource);
            } else {
                // Fallback: محاكاة OCR أو استخدام API
                result = await this.fallbackOcr(imageSource);
            }

            // تحويل النتيجة لتنسيق موحد
            const ocrResult = this.formatResult(result);

            // استخراج البيانات
            const extractedData = this.extractData(ocrResult.fullText);

            // تصنيف المستند
            const classification = this.classifyDocument(ocrResult.fullText);

            const finalResult = {
                ...ocrResult,
                extractedData,
                classification,
                processedAt: new Date().toISOString(),
            };

            this.emit('completed', finalResult);
            return finalResult;

        } catch (error) {
            this.emit('error', { error: error.message });
            throw error;
        }
    }

    /**
     * تنسيق نتيجة OCR
     */
    formatResult(tesseractResult) {
        const regions = [];
        let fullTextParts = [];
        let totalConfidence = 0;

        if (tesseractResult.data) {
            const data = tesseractResult.data;

            // استخراج الكلمات مع إحداثياتها
            if (data.words) {
                data.words.forEach((word, index) => {
                    if (word.text.trim()) {
                        regions.push({
                            id: index,
                            text: word.text,
                            confidence: word.confidence,
                            box: {
                                x: word.bbox.x0,
                                y: word.bbox.y0,
                                width: word.bbox.x1 - word.bbox.x0,
                                height: word.bbox.y1 - word.bbox.y0,
                            },
                            type: 'word',
                        });
                        totalConfidence += word.confidence;
                    }
                });
            }

            // استخراج السطور
            if (data.lines) {
                data.lines.forEach((line, index) => {
                    if (line.text.trim()) {
                        fullTextParts.push(line.text);
                        regions.push({
                            id: `line-${index}`,
                            text: line.text,
                            confidence: line.confidence,
                            box: {
                                x: line.bbox.x0,
                                y: line.bbox.y0,
                                width: line.bbox.x1 - line.bbox.x0,
                                height: line.bbox.y1 - line.bbox.y0,
                            },
                            type: 'line',
                        });
                    }
                });
            }

            return {
                success: true,
                fullText: data.text || fullTextParts.join('\n'),
                regions: regions,
                confidence: regions.length > 0 ? totalConfidence / regions.length : 0,
                wordCount: data.words?.length || 0,
                lineCount: data.lines?.length || 0,
            };
        }

        return {
            success: false,
            fullText: '',
            regions: [],
            confidence: 0,
            wordCount: 0,
            lineCount: 0,
        };
    }

    /**
     * Fallback OCR (محاكاة أو API خارجي)
     */
    async fallbackOcr(imageSource) {
        // يمكن استبدال هذا بـ API خارجي مثل Google Vision أو Azure OCR
        console.log('Using fallback OCR method');

        return {
            data: {
                text: '',
                words: [],
                lines: [],
            }
        };
    }

    /**
     * استخراج البيانات من النص
     */
    extractData(text) {
        const extracted = {
            documentNumber: null,
            date: null,
            subject: null,
            sender: null,
            recipient: null,
            referenceNumber: null,
            detectedDates: [],
            detectedNumbers: [],
        };

        if (!text) return extracted;

        // استخراج كل نوع من البيانات
        for (const [field, patterns] of Object.entries(EXTRACTION_PATTERNS)) {
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match && match[1]) {
                    const value = match[1].trim();
                    if (field === 'date') {
                        extracted.detectedDates.push(value);
                        if (!extracted.date) extracted.date = value;
                    } else if (field === 'documentNumber') {
                        extracted.detectedNumbers.push(value);
                        if (!extracted.documentNumber) extracted.documentNumber = value;
                    } else {
                        if (!extracted[field]) extracted[field] = value;
                    }
                }
            }
        }

        return extracted;
    }

    /**
     * تصنيف المستند
     */
    classifyDocument(text) {
        if (!text) return null;

        const textLower = text.toLowerCase();
        let bestMatch = null;
        let highestScore = 0;

        for (const [type, config] of Object.entries(DOCUMENT_CLASSIFICATIONS)) {
            let score = 0;

            // فحص الكلمات المفتاحية
            for (const keyword of config.keywords) {
                if (text.includes(keyword) || textLower.includes(keyword.toLowerCase())) {
                    score += 1;
                }
            }

            // فحص الأنماط
            for (const pattern of config.patterns) {
                if (pattern.test(text)) {
                    score += 2;
                }
            }

            if (score > highestScore) {
                highestScore = score;
                bestMatch = {
                    type,
                    nameAr: config.nameAr,
                    confidence: Math.min(score * 20, 100),
                };
            }
        }

        return bestMatch;
    }

    /**
     * معالجة صور متعددة
     */
    async processMultipleImages(images) {
        const results = [];

        for (let i = 0; i < images.length; i++) {
            this.emit('progress', {
                current: i + 1,
                total: images.length,
                message: `معالجة الصفحة ${i + 1} من ${images.length}...`
            });

            const result = await this.processImage(images[i]);
            results.push(result);
        }

        // دمج النتائج
        const combined = {
            pages: results,
            fullText: results.map(r => r.fullText).join('\n\n---\n\n'),
            totalRegions: results.reduce((sum, r) => sum + r.regions.length, 0),
            averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
            extractedData: this.mergeExtractedData(results.map(r => r.extractedData)),
            classification: results[0]?.classification,
        };

        return combined;
    }

    /**
     * دمج البيانات المستخرجة من صفحات متعددة
     */
    mergeExtractedData(dataArray) {
        const merged = {
            documentNumber: null,
            date: null,
            subject: null,
            sender: null,
            recipient: null,
            referenceNumber: null,
            detectedDates: [],
            detectedNumbers: [],
        };

        for (const data of dataArray) {
            if (!data) continue;

            for (const [key, value] of Object.entries(data)) {
                if (Array.isArray(value)) {
                    merged[key] = [...merged[key], ...value];
                } else if (value && !merged[key]) {
                    merged[key] = value;
                }
            }
        }

        // إزالة التكرارات
        merged.detectedDates = [...new Set(merged.detectedDates)];
        merged.detectedNumbers = [...new Set(merged.detectedNumbers)];

        return merged;
    }

    /**
     * تنظيف وإنهاء
     */
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
        this.isReady = false;
    }

    // Event Handling
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
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
                console.error(`Error in OCR event ${event}:`, error);
            }
        });
    }
}

// إنشاء instance افتراضي
const ocrService = new OcrService();

export default ocrService;
