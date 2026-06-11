/**
 * Claude API Client
 * عميل التكامل مع Claude API من Anthropic
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ASSISTANT_MODEL = process.env.ASSISTANT_MODEL || 'claude-sonnet-4-20250514';
const ASSISTANT_MAX_TOKENS = parseInt(process.env.ASSISTANT_MAX_TOKENS || '4096');
const ASSISTANT_TEMPERATURE = parseFloat(process.env.ASSISTANT_TEMPERATURE || '0.7');

/**
 * Claude Client للتكامل مع Anthropic API
 */
export class ClaudeClient {
    constructor(options = {}) {
        this.apiKey = options.apiKey || ANTHROPIC_API_KEY;
        this.model = options.model || ASSISTANT_MODEL;
        this.maxTokens = options.maxTokens || ASSISTANT_MAX_TOKENS;
        this.temperature = options.temperature || ASSISTANT_TEMPERATURE;
        this.baseUrl = 'https://api.anthropic.com/v1';

        if (!this.apiKey) {
            console.warn('Warning: ANTHROPIC_API_KEY is not set');
        }
    }

    /**
     * إرسال رسالة للمحادثة
     * @param {Array} messages - رسائل المحادثة
     * @param {Object} options - خيارات إضافية
     * @returns {Promise<Object>} - رد Claude
     */
    async chat(messages, options = {}) {
        const response = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: options.model || this.model,
                max_tokens: options.maxTokens || this.maxTokens,
                temperature: options.temperature || this.temperature,
                system: options.systemPrompt || '',
                messages: this.formatMessages(messages),
                tools: options.tools || undefined,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Claude API Error: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * محادثة مع Streaming
     * @param {Array} messages - رسائل المحادثة
     * @param {Object} options - خيارات إضافية
     * @yields {Object} - أحداث الـ Stream
     */
    async *chatStream(messages, options = {}) {
        const response = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: options.model || this.model,
                max_tokens: options.maxTokens || this.maxTokens,
                temperature: options.temperature || this.temperature,
                system: options.systemPrompt || '',
                messages: this.formatMessages(messages),
                tools: options.tools || undefined,
                stream: true,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Claude API Error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') return;

                    try {
                        const event = JSON.parse(data);
                        yield event;
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }
    }

    /**
     * تنسيق الرسائل لـ Claude API
     */
    formatMessages(messages) {
        return messages.map(msg => ({
            role: msg.role === 'system' ? 'user' : msg.role,
            content: msg.content,
        }));
    }

    /**
     * بناء أدوات Claude من سجل الدوال
     */
    static buildTools(functionRegistry) {
        return Object.entries(functionRegistry).map(([name, func]) => ({
            name: func.name,
            description: func.description,
            input_schema: {
                type: 'object',
                properties: func.parameters?.properties || {},
                required: func.parameters?.required || [],
            },
        }));
    }

    /**
     * استخراج استدعاءات الدوال من رد Claude
     */
    static extractToolCalls(response) {
        const toolCalls = [];

        if (response.content) {
            for (const block of response.content) {
                if (block.type === 'tool_use') {
                    toolCalls.push({
                        id: block.id,
                        name: block.name,
                        arguments: block.input,
                    });
                }
            }
        }

        return toolCalls;
    }

    /**
     * استخراج النص من رد Claude
     */
    static extractText(response) {
        let text = '';

        if (response.content) {
            for (const block of response.content) {
                if (block.type === 'text') {
                    text += block.text;
                }
            }
        }

        return text;
    }

    /**
     * التحقق من توفر الـ API
     */
    async isAvailable() {
        try {
            if (!this.apiKey) return false;

            const response = await this.chat([
                { role: 'user', content: 'مرحبا' }
            ], { maxTokens: 10 });

            return !!response;
        } catch (error) {
            console.error('Claude API check failed:', error.message);
            return false;
        }
    }
}

// تصدير افتراضي
const defaultClient = new ClaudeClient();
export default defaultClient;
