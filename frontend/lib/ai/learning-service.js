/**
 * Learning Service - نظام التعلم المستمر
 * يجمع التقييمات ويحلل الأداء ويحسن المساعد تلقائياً
 */

import { getRAGService } from './rag-service';

/**
 * نظام التعلم المستمر
 */
export class LearningService {
    constructor() {
        this.feedbackStore = [];
        this.conversationPatterns = new Map();
        this.improvementSuggestions = [];
        this.performanceMetrics = {
            totalInteractions: 0,
            successfulActions: 0,
            failedActions: 0,
            averageRating: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
        this.autoLearnEnabled = true;
    }

    // ========================================
    // جمع التغذية الراجعة
    // ========================================

    /**
     * تسجيل تقييم رسالة
     */
    async recordFeedback(feedback) {
        const {
            messageId,
            conversationId,
            rating,
            feedbackType,
            comment,
            userQuery,
            assistantResponse,
            module,
            actionExecuted,
            timestamp = new Date().toISOString(),
        } = feedback;

        const feedbackRecord = {
            id: `FB-${Date.now()}`,
            messageId,
            conversationId,
            rating,
            feedbackType, // 'helpful', 'not_helpful', 'incorrect', 'slow', 'other'
            comment,
            userQuery,
            assistantResponse,
            module,
            actionExecuted,
            timestamp,
            analyzed: false,
        };

        this.feedbackStore.push(feedbackRecord);
        this.updatePerformanceMetrics(feedbackRecord);

        // التعلم التلقائي للتقييمات السلبية
        if (this.autoLearnEnabled && rating && rating <= 2) {
            await this.analyzeNegativeFeedback(feedbackRecord);
        }

        return feedbackRecord;
    }

    /**
     * تحديث مقاييس الأداء
     */
    updatePerformanceMetrics(feedback) {
        this.performanceMetrics.totalInteractions++;

        if (feedback.actionExecuted) {
            if (feedback.rating >= 4) {
                this.performanceMetrics.successfulActions++;
            } else if (feedback.rating <= 2) {
                this.performanceMetrics.failedActions++;
            }
        }

        if (feedback.rating) {
            const currentTotal = this.performanceMetrics.averageRating *
                (this.performanceMetrics.totalInteractions - 1);
            this.performanceMetrics.averageRating =
                (currentTotal + feedback.rating) / this.performanceMetrics.totalInteractions;

            if (this.performanceMetrics.ratingDistribution[feedback.rating] !== undefined) {
                this.performanceMetrics.ratingDistribution[feedback.rating]++;
            }
        }
    }

    // ========================================
    // تحليل الأداء
    // ========================================

    /**
     * تحليل التقييمات السلبية
     */
    async analyzeNegativeFeedback(feedback) {
        const analysis = {
            feedbackId: feedback.id,
            timestamp: new Date().toISOString(),
            issues: [],
            suggestions: [],
        };

        // تحليل نوع المشكلة
        if (feedback.feedbackType === 'incorrect') {
            analysis.issues.push({
                type: 'accuracy',
                description: 'الرد غير دقيق أو خاطئ',
                userQuery: feedback.userQuery,
                response: feedback.assistantResponse,
            });
            analysis.suggestions.push({
                action: 'update_knowledge',
                priority: 'high',
                details: `تحديث المعرفة المتعلقة بـ: ${this.extractTopics(feedback.userQuery)}`,
            });
        }

        if (feedback.feedbackType === 'not_helpful') {
            analysis.issues.push({
                type: 'relevance',
                description: 'الرد غير مفيد أو غير ذي صلة',
                userQuery: feedback.userQuery,
            });
            analysis.suggestions.push({
                action: 'improve_understanding',
                priority: 'medium',
                details: 'تحسين فهم نية المستخدم',
            });
        }

        if (feedback.comment) {
            analysis.issues.push({
                type: 'user_comment',
                description: feedback.comment,
            });
        }

        this.improvementSuggestions.push(analysis);

        // تحديث قاعدة المعرفة إذا كان التعلم التلقائي مفعلاً
        if (this.autoLearnEnabled) {
            await this.autoImprove(analysis);
        }

        return analysis;
    }

    /**
     * استخراج المواضيع من الاستعلام
     */
    extractTopics(query) {
        const topicKeywords = {
            'إجازة': 'leaves',
            'رصيد': 'balance',
            'حضور': 'attendance',
            'صرف': 'exchange',
            'مستودع': 'warehouse',
            'عهدة': 'custody',
            'مركبة': 'vehicle',
            'سيارة': 'vehicle',
            'حجز': 'booking',
            'معاملة': 'document',
            'أرشفة': 'archiving',
            'فاتورة': 'invoice',
            'هدف': 'goal',
            'أداء': 'performance',
        };

        const foundTopics = [];
        for (const [arabic, english] of Object.entries(topicKeywords)) {
            if (query.includes(arabic)) {
                foundTopics.push(english);
            }
        }

        return foundTopics.join(', ') || 'general';
    }

    /**
     * تحليل الأنماط المتكررة
     */
    analyzePatterns() {
        const patterns = {
            commonQueries: new Map(),
            failurePatterns: [],
            successPatterns: [],
            moduleUsage: {},
        };

        for (const feedback of this.feedbackStore) {
            // تحليل الاستعلامات الشائعة
            const normalizedQuery = this.normalizeQuery(feedback.userQuery);
            if (normalizedQuery) {
                const count = patterns.commonQueries.get(normalizedQuery) || 0;
                patterns.commonQueries.set(normalizedQuery, count + 1);
            }

            // تحليل أنماط الفشل والنجاح
            if (feedback.rating <= 2) {
                patterns.failurePatterns.push({
                    query: feedback.userQuery,
                    module: feedback.module,
                    type: feedback.feedbackType,
                });
            } else if (feedback.rating >= 4) {
                patterns.successPatterns.push({
                    query: feedback.userQuery,
                    module: feedback.module,
                });
            }

            // استخدام الوحدات
            if (feedback.module) {
                patterns.moduleUsage[feedback.module] =
                    (patterns.moduleUsage[feedback.module] || 0) + 1;
            }
        }

        return patterns;
    }

    /**
     * تطبيع الاستعلام للمقارنة
     */
    normalizeQuery(query) {
        if (!query) return null;
        return query
            .toLowerCase()
            .replace(/[؟،.!:;]/g, '')
            .trim();
    }

    // ========================================
    // التحسين التلقائي
    // ========================================

    /**
     * تحسين تلقائي بناءً على التحليل
     */
    async autoImprove(analysis) {
        const improvements = [];

        for (const suggestion of analysis.suggestions) {
            switch (suggestion.action) {
                case 'update_knowledge':
                    const knowledgeUpdate = await this.updateKnowledge(suggestion);
                    if (knowledgeUpdate) {
                        improvements.push(knowledgeUpdate);
                    }
                    break;

                case 'improve_understanding':
                    const understandingUpdate = await this.improveUnderstanding(suggestion);
                    if (understandingUpdate) {
                        improvements.push(understandingUpdate);
                    }
                    break;

                case 'add_example':
                    const exampleUpdate = await this.addTrainingExample(suggestion);
                    if (exampleUpdate) {
                        improvements.push(exampleUpdate);
                    }
                    break;
            }
        }

        return improvements;
    }

    /**
     * تحديث قاعدة المعرفة
     */
    async updateKnowledge(suggestion) {
        try {
            const ragService = getRAGService();

            // البحث عن المعرفة ذات الصلة
            const relatedKnowledge = await ragService.search(suggestion.details, {
                limit: 3,
            });

            if (relatedKnowledge.length > 0) {
                // تسجيل أن هذه المعرفة تحتاج تحديث
                return {
                    type: 'knowledge_flagged',
                    items: relatedKnowledge.map(k => k.id),
                    reason: suggestion.details,
                    timestamp: new Date().toISOString(),
                };
            }

            return null;
        } catch (error) {
            console.error('Error updating knowledge:', error);
            return null;
        }
    }

    /**
     * تحسين الفهم
     */
    async improveUnderstanding(suggestion) {
        // تسجيل نمط جديد للتعلم
        return {
            type: 'understanding_improvement',
            suggestion: suggestion.details,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * إضافة مثال تدريبي
     */
    async addTrainingExample(suggestion) {
        // إضافة مثال للتدريب المستقبلي
        return {
            type: 'training_example',
            example: suggestion.details,
            timestamp: new Date().toISOString(),
        };
    }

    // ========================================
    // تقارير وإحصائيات
    // ========================================

    /**
     * الحصول على تقرير الأداء
     */
    getPerformanceReport(options = {}) {
        const { fromDate, toDate, module } = options;

        let filteredFeedback = [...this.feedbackStore];

        // تصفية حسب التاريخ
        if (fromDate) {
            filteredFeedback = filteredFeedback.filter(f =>
                new Date(f.timestamp) >= new Date(fromDate)
            );
        }
        if (toDate) {
            filteredFeedback = filteredFeedback.filter(f =>
                new Date(f.timestamp) <= new Date(toDate)
            );
        }

        // تصفية حسب الوحدة
        if (module) {
            filteredFeedback = filteredFeedback.filter(f => f.module === module);
        }

        // حساب الإحصائيات
        const totalFeedback = filteredFeedback.length;
        const ratingsSum = filteredFeedback.reduce((sum, f) => sum + (f.rating || 0), 0);
        const ratedFeedback = filteredFeedback.filter(f => f.rating).length;

        const report = {
            period: { fromDate, toDate },
            module,
            summary: {
                totalInteractions: totalFeedback,
                averageRating: ratedFeedback > 0 ? (ratingsSum / ratedFeedback).toFixed(2) : 'N/A',
                satisfactionRate: this.calculateSatisfactionRate(filteredFeedback),
                completionRate: this.calculateCompletionRate(filteredFeedback),
            },
            ratingBreakdown: this.getRatingBreakdown(filteredFeedback),
            feedbackTypes: this.getFeedbackTypeBreakdown(filteredFeedback),
            topIssues: this.getTopIssues(filteredFeedback),
            improvements: this.improvementSuggestions.slice(-10),
            generatedAt: new Date().toISOString(),
        };

        return report;
    }

    /**
     * حساب معدل الرضا
     */
    calculateSatisfactionRate(feedbackList) {
        const rated = feedbackList.filter(f => f.rating);
        if (rated.length === 0) return 'N/A';

        const satisfied = rated.filter(f => f.rating >= 4).length;
        return ((satisfied / rated.length) * 100).toFixed(1) + '%';
    }

    /**
     * حساب معدل إكمال المهام
     */
    calculateCompletionRate(feedbackList) {
        const actionFeedback = feedbackList.filter(f => f.actionExecuted !== undefined);
        if (actionFeedback.length === 0) return 'N/A';

        const successful = actionFeedback.filter(f => f.actionExecuted).length;
        return ((successful / actionFeedback.length) * 100).toFixed(1) + '%';
    }

    /**
     * تحليل توزيع التقييمات
     */
    getRatingBreakdown(feedbackList) {
        const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        for (const f of feedbackList) {
            if (f.rating && breakdown[f.rating] !== undefined) {
                breakdown[f.rating]++;
            }
        }

        return breakdown;
    }

    /**
     * تحليل أنواع التغذية الراجعة
     */
    getFeedbackTypeBreakdown(feedbackList) {
        const types = {};

        for (const f of feedbackList) {
            if (f.feedbackType) {
                types[f.feedbackType] = (types[f.feedbackType] || 0) + 1;
            }
        }

        return types;
    }

    /**
     * الحصول على أهم المشكلات
     */
    getTopIssues(feedbackList) {
        const issues = {};

        for (const f of feedbackList) {
            if (f.rating <= 2 && f.feedbackType) {
                const key = `${f.module || 'general'}_${f.feedbackType}`;
                issues[key] = (issues[key] || 0) + 1;
            }
        }

        return Object.entries(issues)
            .map(([key, count]) => ({ issue: key, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }

    // ========================================
    // إعدادات التعلم
    // ========================================

    /**
     * تفعيل/تعطيل التعلم التلقائي
     */
    setAutoLearn(enabled) {
        this.autoLearnEnabled = enabled;
    }

    /**
     * تصدير بيانات التعلم
     */
    exportLearningData() {
        return {
            feedback: this.feedbackStore,
            patterns: Array.from(this.conversationPatterns.entries()),
            suggestions: this.improvementSuggestions,
            metrics: this.performanceMetrics,
            exportedAt: new Date().toISOString(),
        };
    }

    /**
     * استيراد بيانات التعلم
     */
    importLearningData(data) {
        if (data.feedback) {
            this.feedbackStore = [...this.feedbackStore, ...data.feedback];
        }
        if (data.patterns) {
            for (const [key, value] of data.patterns) {
                this.conversationPatterns.set(key, value);
            }
        }
        if (data.suggestions) {
            this.improvementSuggestions = [...this.improvementSuggestions, ...data.suggestions];
        }
        if (data.metrics) {
            // دمج المقاييس
            this.performanceMetrics.totalInteractions += data.metrics.totalInteractions || 0;
        }
    }

    /**
     * مسح بيانات التعلم
     */
    clearLearningData() {
        this.feedbackStore = [];
        this.conversationPatterns.clear();
        this.improvementSuggestions = [];
        this.performanceMetrics = {
            totalInteractions: 0,
            successfulActions: 0,
            failedActions: 0,
            averageRating: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    }
}

/**
 * إنشاء instance مشترك
 */
let learningServiceInstance = null;

export function getLearningService() {
    if (!learningServiceInstance) {
        learningServiceInstance = new LearningService();
    }
    return learningServiceInstance;
}

export default {
    LearningService,
    getLearningService,
};
