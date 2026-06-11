/**
 * Assistant Service
 * الخدمة الرئيسية للمساعد الذكي
 */

import { ClaudeClient } from './claude-client';
import { buildSystemPrompt, getWelcomeMessage } from './prompt-templates';
import { getAvailableFunctions, buildClaudeTools, getFunctionByName } from './function-registry';
import { executeFunction } from './handlers';

/**
 * خدمة المساعد الذكي
 */
export class AssistantService {
    constructor(options = {}) {
        this.userId = options.userId;
        this.userName = options.userName;
        this.userRoles = options.userRoles || [];
        this.currentModule = options.currentModule || 'dashboard';
        this.accessToken = options.accessToken;

        this.claudeClient = new ClaudeClient();
        this.conversationHistory = [];
        this.maxHistoryLength = 20;
    }

    /**
     * معالجة رسالة من المستخدم
     * @param {string} message - رسالة المستخدم
     * @param {Object} options - خيارات إضافية
     * @returns {Promise<Object>} - رد المساعد
     */
    async processMessage(message, options = {}) {
        try {
            // إضافة رسالة المستخدم للتاريخ
            this.addToHistory({ role: 'user', content: message });

            // بناء System Prompt
            const systemPrompt = buildSystemPrompt({
                userName: this.userName,
                userRoles: this.userRoles,
                currentModule: this.currentModule,
            });

            // الحصول على الدوال المتاحة
            const availableFunctions = getAvailableFunctions(this.currentModule, this.userRoles);
            const tools = buildClaudeTools(availableFunctions);

            // إرسال للـ Claude
            const response = await this.claudeClient.chat(
                this.getFormattedHistory(),
                {
                    systemPrompt,
                    tools: tools.length > 0 ? tools : undefined,
                }
            );

            // معالجة الرد
            const result = await this.processResponse(response);

            // إضافة رد المساعد للتاريخ
            this.addToHistory({
                role: 'assistant',
                content: result.text,
                toolCalls: result.toolCalls,
                toolResults: result.toolResults,
            });

            return result;
        } catch (error) {
            console.error('Assistant Error:', error);
            return {
                text: 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.',
                error: error.message,
            };
        }
    }

    /**
     * معالجة رد Claude
     */
    async processResponse(response) {
        const textContent = ClaudeClient.extractText(response);
        const toolCalls = ClaudeClient.extractToolCalls(response);

        const result = {
            text: textContent,
            toolCalls: [],
            toolResults: [],
            actions: [],
        };

        // معالجة استدعاءات الدوال
        if (toolCalls.length > 0) {
            for (const toolCall of toolCalls) {
                const funcDef = getFunctionByName(toolCall.name);

                // التحقق من الحاجة للتأكيد
                if (funcDef?.requiresConfirmation) {
                    result.confirmationRequired = {
                        functionName: toolCall.name,
                        arguments: toolCall.arguments,
                        description: funcDef.description,
                    };
                    result.text = this.buildConfirmationMessage(funcDef, toolCall.arguments);
                    continue;
                }

                // تنفيذ الدالة
                const funcResult = await this.executeToolCall(toolCall);
                result.toolCalls.push(toolCall);
                result.toolResults.push(funcResult);

                // إضافة الإجراءات
                if (funcResult.action) {
                    result.actions.push({
                        type: funcResult.action,
                        data: funcResult.actionData,
                    });
                }

                // تحديث النص بناءً على نتيجة الدالة
                if (funcResult.message) {
                    result.text = funcResult.message;
                }

                // إضافة البيانات للعرض
                if (funcResult.data) {
                    result.data = funcResult.data;
                    result.dataType = funcResult.type;
                }
            }
        }

        return result;
    }

    /**
     * تنفيذ استدعاء دالة
     */
    async executeToolCall(toolCall) {
        return await executeFunction(toolCall.name, toolCall.arguments, {
            module: this.currentModule,
            userId: this.userId,
            userRoles: this.userRoles,
            accessToken: this.accessToken,
        });
    }

    /**
     * تأكيد وتنفيذ إجراء
     */
    async confirmAndExecute(functionName, args) {
        const funcResult = await executeFunction(functionName, args, {
            module: this.currentModule,
            userId: this.userId,
            userRoles: this.userRoles,
            accessToken: this.accessToken,
        });

        // إضافة للتاريخ
        this.addToHistory({
            role: 'assistant',
            content: funcResult.message || 'تم تنفيذ الإجراء',
            toolResults: [funcResult],
        });

        return funcResult;
    }

    /**
     * بناء رسالة التأكيد
     */
    buildConfirmationMessage(funcDef, args) {
        const lines = ['هل تريد تأكيد هذا الإجراء؟', '', `📋 ${funcDef.description}`, ''];

        // إضافة تفاصيل حسب نوع الإجراء
        if (args.leaveType) {
            const leaveTypes = {
                annual: 'إجازة سنوية',
                sick: 'إجازة مرضية',
                emergency: 'إجازة اضطرارية',
                marriage: 'إجازة زواج',
                death: 'إجازة وفاة',
                maternity: 'إجازة أمومة',
                paternity: 'إجازة أبوة',
            };
            lines.push(`• النوع: ${leaveTypes[args.leaveType] || args.leaveType}`);
        }
        if (args.startDate) lines.push(`• من: ${args.startDate}`);
        if (args.endDate) lines.push(`• إلى: ${args.endDate}`);
        if (args.destination) lines.push(`• الوجهة: ${args.destination}`);
        if (args.items) lines.push(`• عدد الأصناف: ${args.items.length}`);

        lines.push('', '✅ للتأكيد اكتب: نعم أو تأكيد');
        lines.push('❌ للإلغاء اكتب: لا أو إلغاء');

        return lines.join('\n');
    }

    /**
     * الحصول على رسالة ترحيب
     */
    getWelcomeMessage() {
        const moduleNames = {
            hr: 'الموارد البشرية',
            warehouse: 'المستودعات',
            movement: 'حركة الأسطول',
            archiving: 'الأرشفة',
            sadad: 'سداد',
            epm: 'قياس الأداء',
            analytics: 'التحليلات',
            dashboard: 'منصة مسارات',
        };

        return getWelcomeMessage(
            this.userName,
            moduleNames[this.currentModule] || 'المنصة'
        );
    }

    /**
     * إضافة رسالة للتاريخ
     */
    addToHistory(message) {
        this.conversationHistory.push({
            ...message,
            timestamp: new Date().toISOString(),
        });

        // تقليم التاريخ إذا تجاوز الحد
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
    }

    /**
     * تنسيق التاريخ لـ Claude
     */
    getFormattedHistory() {
        return this.conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
        }));
    }

    /**
     * مسح التاريخ
     */
    clearHistory() {
        this.conversationHistory = [];
    }

    /**
     * تغيير الوحدة الحالية
     */
    setModule(module) {
        this.currentModule = module;
    }

    /**
     * الحصول على الإجراءات السريعة للوحدة الحالية
     */
    getQuickActions() {
        const actions = {
            hr: [
                { label: 'رصيد الإجازات', action: 'get_leave_balance' },
                { label: 'طلب إجازة', action: 'create_leave_request' },
                { label: 'سجل الحضور', action: 'get_attendance_report' },
            ],
            warehouse: [
                { label: 'عهدتي', action: 'get_my_custodies' },
                { label: 'طلب صرف', action: 'create_exchange_request' },
                { label: 'البحث عن صنف', action: 'search_items' },
            ],
            movement: [
                { label: 'حجز مركبة', action: 'book_vehicle' },
                { label: 'رحلاتي', action: 'get_my_trips' },
                { label: 'المركبات المتاحة', action: 'get_available_vehicles' },
            ],
        };

        return actions[this.currentModule] || [];
    }
}

/**
 * إنشاء خدمة المساعد من الجلسة
 */
export function createAssistantFromSession(session, currentModule) {
    return new AssistantService({
        userId: session?.user?.nationalId || session?.user?.id,
        userName: session?.user?.name,
        userRoles: session?.user?.roles || [],
        accessToken: session?.accessToken,
        currentModule,
    });
}

export default AssistantService;
