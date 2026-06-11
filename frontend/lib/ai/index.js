/**
 * AI Module Index
 * التصدير الرئيسي لوحدة الذكاء الاصطناعي
 */

// Claude Client
export { ClaudeClient, default as claudeClient } from './claude-client';

// Prompt Templates
export {
    BASE_SYSTEM_PROMPT,
    MODULE_PROMPTS,
    buildSystemPrompt,
    getTimeBasedGreeting,
    getWelcomeMessage,
} from './prompt-templates';

// Function Registry
export {
    ASSISTANT_FUNCTIONS,
    getAvailableFunctions,
    buildClaudeTools,
    getFunctionByName,
} from './function-registry';

// Action Handlers
export {
    HRActionHandler,
    WarehouseActionHandler,
    MovementActionHandler,
    ArchivingActionHandler,
    SadadActionHandler,
    EPMActionHandler,
    NavigationHandler,
    getHandler,
    executeFunction,
} from './handlers';

// Assistant Service
export {
    AssistantService,
    createAssistantFromSession,
    default as assistantService,
} from './assistant-service';

// RAG Service - البحث الدلالي
export { RAGService, getRAGService } from './rag-service';

// Knowledge Base - قاعدة المعرفة
export {
    KNOWLEDGE_BASE,
    getModuleKnowledge,
    getAllFAQs,
    getAllPolicies,
} from './knowledge-base';

// Learning Service - نظام التعلم المستمر
export { LearningService, getLearningService } from './learning-service';

/**
 * تهيئة جميع خدمات AI
 */
export function initializeAIServices() {
    const { getRAGService: getRag } = require('./rag-service');
    const { getLearningService: getLearning } = require('./learning-service');

    const services = {
        rag: getRag(),
        learning: getLearning(),
    };

    console.log('[AI Services] Initialized:', {
        knowledgeItems: services.rag.getKnowledgeStats().totalItems,
        learningEnabled: services.learning.autoLearnEnabled,
    });

    return services;
}

/**
 * الحصول على إحصائيات خدمات AI
 */
export function getAIServicesStats() {
    const { getRAGService: getRag } = require('./rag-service');
    const { getLearningService: getLearning } = require('./learning-service');

    return {
        knowledge: getRag().getKnowledgeStats(),
        performance: getLearning().getPerformanceReport(),
        timestamp: new Date().toISOString(),
    };
}
