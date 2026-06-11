/**
 * RAG Service - Retrieval Augmented Generation
 * نظام البحث الدلالي المعزز بالذكاء الاصطناعي
 */

import { KNOWLEDGE_BASE } from './knowledge-base';

/**
 * نظام RAG للبحث الدلالي
 */
export class RAGService {
    constructor() {
        this.knowledgeBase = KNOWLEDGE_BASE;
        this.embeddingCache = new Map();
        this.searchIndex = this.buildSearchIndex();
    }

    /**
     * بناء فهرس البحث
     */
    buildSearchIndex() {
        const index = {
            byModule: {},
            byCategory: {},
            byKeywords: {},
            all: [],
        };

        for (const [module, categories] of Object.entries(this.knowledgeBase)) {
            index.byModule[module] = [];

            for (const [category, items] of Object.entries(categories)) {
                if (!index.byCategory[category]) {
                    index.byCategory[category] = [];
                }

                for (const item of items) {
                    const indexedItem = {
                        ...item,
                        module,
                        category,
                        searchText: this.buildSearchText(item),
                    };

                    index.byModule[module].push(indexedItem);
                    index.byCategory[category].push(indexedItem);
                    index.all.push(indexedItem);

                    // فهرسة الكلمات المفتاحية
                    if (item.keywords) {
                        for (const keyword of item.keywords) {
                            if (!index.byKeywords[keyword]) {
                                index.byKeywords[keyword] = [];
                            }
                            index.byKeywords[keyword].push(indexedItem);
                        }
                    }
                }
            }
        }

        return index;
    }

    /**
     * بناء نص البحث
     */
    buildSearchText(item) {
        const parts = [
            item.title,
            item.content,
            item.keywords?.join(' ') || '',
            item.examples?.join(' ') || '',
        ];
        return parts.join(' ').toLowerCase();
    }

    /**
     * البحث في قاعدة المعرفة
     * @param {string} query - نص البحث
     * @param {Object} options - خيارات البحث
     * @returns {Array} - نتائج البحث مرتبة حسب الصلة
     */
    async search(query, options = {}) {
        const {
            module = null,
            category = null,
            limit = 5,
            minScore = 0.3,
        } = options;

        const normalizedQuery = query.toLowerCase().trim();
        const queryTokens = this.tokenize(normalizedQuery);

        // تحديد مجموعة البحث
        let searchSet = this.searchIndex.all;
        if (module && this.searchIndex.byModule[module]) {
            searchSet = this.searchIndex.byModule[module];
        }
        if (category && this.searchIndex.byCategory[category]) {
            searchSet = searchSet.filter(item => item.category === category);
        }

        // حساب درجة التطابق لكل عنصر
        const results = searchSet.map(item => {
            const score = this.calculateRelevanceScore(queryTokens, item);
            return { ...item, score };
        });

        // ترتيب وفلترة النتائج
        return results
            .filter(item => item.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * تقسيم النص إلى رموز
     */
    tokenize(text) {
        // إزالة علامات الترقيم وتقسيم الكلمات
        return text
            .replace(/[؟،.!:;]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 1);
    }

    /**
     * حساب درجة الصلة
     */
    calculateRelevanceScore(queryTokens, item) {
        let score = 0;
        const searchText = item.searchText;
        const title = item.title.toLowerCase();
        const keywords = item.keywords || [];

        for (const token of queryTokens) {
            // تطابق في العنوان (أعلى وزن)
            if (title.includes(token)) {
                score += 0.4;
            }

            // تطابق في الكلمات المفتاحية
            if (keywords.some(k => k.includes(token) || token.includes(k))) {
                score += 0.3;
            }

            // تطابق في المحتوى
            if (searchText.includes(token)) {
                score += 0.2;
            }

            // تطابق جزئي (للكلمات العربية)
            if (this.fuzzyMatch(token, searchText)) {
                score += 0.1;
            }
        }

        // تطبيع الدرجة
        return Math.min(1, score / queryTokens.length);
    }

    /**
     * تطابق ضبابي للنص العربي
     */
    fuzzyMatch(token, text) {
        // إزالة التشكيل للمقارنة
        const normalizedToken = this.removeArabicDiacritics(token);
        const normalizedText = this.removeArabicDiacritics(text);

        return normalizedText.includes(normalizedToken);
    }

    /**
     * إزالة التشكيل العربي
     */
    removeArabicDiacritics(text) {
        return text.replace(/[\u064B-\u0652]/g, '');
    }

    /**
     * البحث بالسياق
     * يبحث عن معلومات ذات صلة بسياق المحادثة
     */
    async searchWithContext(query, conversationContext = {}) {
        const { module, previousMessages = [], userIntent } = conversationContext;

        // استخراج كلمات مفتاحية من السياق
        const contextKeywords = this.extractContextKeywords(previousMessages);

        // دمج الاستعلام مع السياق
        const enhancedQuery = [query, ...contextKeywords].join(' ');

        // البحث بالاستعلام المحسن
        const results = await this.search(enhancedQuery, {
            module,
            limit: 5,
        });

        // ترتيب النتائج بناءً على نية المستخدم
        if (userIntent) {
            return this.reorderByIntent(results, userIntent);
        }

        return results;
    }

    /**
     * استخراج الكلمات المفتاحية من السياق
     */
    extractContextKeywords(messages) {
        const keywords = [];
        const recentMessages = messages.slice(-3); // آخر 3 رسائل

        for (const msg of recentMessages) {
            if (msg.role === 'user') {
                const tokens = this.tokenize(msg.content);
                keywords.push(...tokens.filter(t => t.length > 2));
            }
        }

        return [...new Set(keywords)].slice(0, 5);
    }

    /**
     * إعادة ترتيب النتائج حسب نية المستخدم
     */
    reorderByIntent(results, intent) {
        const intentWeights = {
            query: ['كيف', 'ما', 'هل', 'أين', 'متى'],
            action: ['أريد', 'طلب', 'إنشاء', 'إضافة', 'حجز'],
            help: ['مساعدة', 'شرح', 'فهم', 'توضيح'],
        };

        return results.sort((a, b) => {
            const aIntentMatch = this.matchesIntent(a, intent, intentWeights);
            const bIntentMatch = this.matchesIntent(b, intent, intentWeights);
            return bIntentMatch - aIntentMatch;
        });
    }

    /**
     * التحقق من تطابق النتيجة مع النية
     */
    matchesIntent(item, intent, intentWeights) {
        const words = intentWeights[intent] || [];
        let matches = 0;

        for (const word of words) {
            if (item.searchText.includes(word)) {
                matches++;
            }
        }

        return matches;
    }

    /**
     * الحصول على معلومات مرتبطة
     * يجد معلومات مرتبطة بموضوع معين
     */
    async getRelatedKnowledge(topic, currentModule) {
        // البحث الأساسي
        const directResults = await this.search(topic, {
            module: currentModule,
            limit: 3,
        });

        // البحث في الوحدات المرتبطة
        const relatedModules = this.getRelatedModules(currentModule);
        const crossModuleResults = [];

        for (const relModule of relatedModules) {
            const results = await this.search(topic, {
                module: relModule,
                limit: 2,
            });
            crossModuleResults.push(...results);
        }

        return {
            direct: directResults,
            related: crossModuleResults.slice(0, 3),
        };
    }

    /**
     * الحصول على الوحدات المرتبطة
     */
    getRelatedModules(module) {
        const relations = {
            hr: ['epm', 'archiving'],
            warehouse: ['movement', 'archiving'],
            movement: ['warehouse', 'hr'],
            archiving: ['hr', 'sadad'],
            sadad: ['archiving', 'warehouse'],
            epm: ['hr'],
        };

        return relations[module] || [];
    }

    /**
     * الحصول على الأسئلة الشائعة
     */
    getFAQs(module) {
        if (module && this.searchIndex.byCategory['faq']) {
            return this.searchIndex.byCategory['faq']
                .filter(item => item.module === module)
                .slice(0, 10);
        }
        return this.searchIndex.byCategory['faq'] || [];
    }

    /**
     * تحديث قاعدة المعرفة
     */
    async updateKnowledge(newItems) {
        // إضافة العناصر الجديدة
        for (const item of newItems) {
            const { module, category, ...data } = item;

            if (!this.knowledgeBase[module]) {
                this.knowledgeBase[module] = {};
            }
            if (!this.knowledgeBase[module][category]) {
                this.knowledgeBase[module][category] = [];
            }

            this.knowledgeBase[module][category].push(data);
        }

        // إعادة بناء الفهرس
        this.searchIndex = this.buildSearchIndex();

        return { success: true, itemsAdded: newItems.length };
    }

    /**
     * تصدير قاعدة المعرفة
     */
    exportKnowledge() {
        return JSON.stringify(this.knowledgeBase, null, 2);
    }

    /**
     * الحصول على إحصائيات قاعدة المعرفة
     */
    getKnowledgeStats() {
        const stats = {
            totalItems: this.searchIndex.all.length,
            byModule: {},
            byCategory: {},
        };

        for (const [module, items] of Object.entries(this.searchIndex.byModule)) {
            stats.byModule[module] = items.length;
        }

        for (const [category, items] of Object.entries(this.searchIndex.byCategory)) {
            stats.byCategory[category] = items.length;
        }

        return stats;
    }
}

/**
 * إنشاء instance مشترك
 */
let ragServiceInstance = null;

export function getRAGService() {
    if (!ragServiceInstance) {
        ragServiceInstance = new RAGService();
    }
    return ragServiceInstance;
}

export default {
    RAGService,
    getRAGService,
};
