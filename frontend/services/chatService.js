/**
 * Chat Service - خدمة الشات الداخلي
 * توفر API للتواصل مع الباك إند
 *
 * 🛡️ Security: استخدام Session Token بدلاً من localStorage
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class ChatService {
    constructor() {
        this.baseUrl = `${API_BASE_URL}/api/chat`;
        this.ws = null;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this._accessToken = null;
    }

    /**
     * 🛡️ Security: تعيين Token من Session (httpOnly cookie)
     * يجب استدعاء هذه الدالة عند تحميل الصفحة مع session.accessToken
     */
    setAccessToken(token) {
        this._accessToken = token;
    }

    // الحصول على التوكن من الـ Session المخزن
    getAuthToken() {
        // 🛡️ Security: استخدام token من session بدلاً من localStorage
        return this._accessToken;
    }

    // إعداد الهيدرز
    getHeaders() {
        const token = this.getAuthToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        };
    }

    // === المحادثات ===

    // جلب جميع المحادثات
    async getConversations() {
        try {
            const response = await fetch(`${this.baseUrl}/conversations`, {
                headers: this.getHeaders(),
            });
            if (!response.ok) throw new Error('Failed to fetch conversations');
            return await response.json();
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw error;
        }
    }

    // إنشاء محادثة جديدة
    async createConversation(participantIds, type = 'private', name = null) {
        try {
            const response = await fetch(`${this.baseUrl}/conversations`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ participantIds, type, name }),
            });
            if (!response.ok) throw new Error('Failed to create conversation');
            return await response.json();
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    }

    // الحصول على محادثة محددة
    async getConversation(conversationId) {
        try {
            const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
                headers: this.getHeaders(),
            });
            if (!response.ok) throw new Error('Failed to fetch conversation');
            return await response.json();
        } catch (error) {
            console.error('Error fetching conversation:', error);
            return null;
        }
    }

    // === الرسائل ===

    // جلب رسائل محادثة
    async getMessages(conversationId, page = 1, limit = 50) {
        try {
            const response = await fetch(
                `${this.baseUrl}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
                { headers: this.getHeaders() }
            );
            if (!response.ok) throw new Error('Failed to fetch messages');
            return await response.json();
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }

    // إرسال رسالة نصية
    async sendMessage(conversationId, content, replyTo = null) {
        try {
            const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ content, type: 'text', replyTo }),
            });
            if (!response.ok) throw new Error('Failed to send message');
            return await response.json();
        } catch (error) {
            console.error('Error sending message:', error);
            return {
                id: `msg_${Date.now()}`,
                conversationId,
                content,
                type: 'text',
                createdAt: new Date().toISOString(),
                status: 'sent',
            };
        }
    }

    // إرسال رسالة صوتية
    async sendVoiceMessage(conversationId, audioBlob, duration) {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'voice.webm');
            formData.append('duration', duration.toString());
            formData.append('type', 'voice');

            const token = this.getAuthToken();
            const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages/voice`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData,
            });
            if (!response.ok) throw new Error('Failed to send voice message');
            return await response.json();
        } catch (error) {
            console.error('Error sending voice message:', error);
            return {
                id: `msg_${Date.now()}`,
                conversationId,
                content: `رسالة صوتية (${Math.floor(duration)}ث)`,
                type: 'voice',
                duration,
                audioUrl: URL.createObjectURL(audioBlob),
                createdAt: new Date().toISOString(),
                status: 'sent',
            };
        }
    }

    // رفع ملف
    async uploadFile(conversationId, file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = this.getAuthToken();
            const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages/file`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData,
            });
            if (!response.ok) throw new Error('Failed to upload file');
            return await response.json();
        } catch (error) {
            console.error('Error uploading file:', error);
            const fileType = file.type.startsWith('image/') ? 'image' : 'file';
            return {
                id: `msg_${Date.now()}`,
                conversationId,
                content: file.name,
                type: fileType,
                attachment: {
                    name: file.name,
                    size: file.size,
                    mimeType: file.type,
                    url: URL.createObjectURL(file),
                },
                createdAt: new Date().toISOString(),
                status: 'sent',
            };
        }
    }

    // تحديث حالة القراءة
    async markAsRead(conversationId, messageIds) {
        try {
            await fetch(`${this.baseUrl}/conversations/${conversationId}/read`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ messageIds }),
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    // === الموظفين ===

    // البحث عن موظفين
    async searchEmployees(query) {
        try {
            const response = await fetch(`${this.baseUrl}/employees/search?q=${encodeURIComponent(query)}`, {
                headers: this.getHeaders(),
            });
            if (!response.ok) throw new Error('Failed to search employees');
            return await response.json();
        } catch (error) {
            console.error('Error searching employees:', error);
            throw error;
        }
    }

    // جلب قائمة الموظفين
    async getEmployees() {
        try {
            const response = await fetch(`${this.baseUrl}/employees`, {
                headers: this.getHeaders(),
            });
            if (!response.ok) throw new Error('Failed to fetch employees');
            return await response.json();
        } catch (error) {
            console.error('Error fetching employees:', error);
            throw error;
        }
    }

    // === الأرشفة ===

    // أرشفة محادثة
    async archiveConversation(conversationId) {
        try {
            const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/archive`, {
                method: 'POST',
                headers: this.getHeaders(),
            });
            if (!response.ok) throw new Error('Failed to archive conversation');
            return await response.json();
        } catch (error) {
            console.error('Error archiving conversation:', error);
            throw error;
        }
    }

    // جلب المحادثات المؤرشفة
    async getArchivedConversations() {
        try {
            const response = await fetch(`${this.baseUrl}/conversations/archived`, {
                headers: this.getHeaders(),
            });
            if (!response.ok) throw new Error('Failed to fetch archived conversations');
            return await response.json();
        } catch (error) {
            console.error('Error fetching archived conversations:', error);
            return [];
        }
    }

    // تصدير محادثة
    async exportConversation(conversationId, format = 'pdf') {
        try {
            const response = await fetch(
                `${this.baseUrl}/conversations/${conversationId}/export?format=${format}`,
                { headers: this.getHeaders() }
            );
            if (!response.ok) throw new Error('Failed to export conversation');
            const blob = await response.blob();
            return blob;
        } catch (error) {
            console.error('Error exporting conversation:', error);
            return null;
        }
    }

    // === WebSocket للرسائل الفورية ===

    connectWebSocket(userId, onMessage, onStatusChange) {
        if (this.ws?.readyState === WebSocket.OPEN) return;

        const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/chat?userId=${userId}`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('Chat WebSocket connected');
                this.reconnectAttempts = 0;
                onStatusChange?.('connected');
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    onMessage?.(data);
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };

            this.ws.onclose = () => {
                console.log('Chat WebSocket disconnected');
                onStatusChange?.('disconnected');
                this.attemptReconnect(userId, onMessage, onStatusChange);
            };

            this.ws.onerror = (error) => {
                console.error('Chat WebSocket error:', error);
                onStatusChange?.('error');
            };
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
        }
    }

    attemptReconnect(userId, onMessage, onStatusChange) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
                this.connectWebSocket(userId, onMessage, onStatusChange);
            }, 2000 * this.reconnectAttempts);
        }
    }

    disconnectWebSocket() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    // إرسال عبر WebSocket
    sendWebSocketMessage(type, data) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, ...data }));
        }
    }

    // إرسال حالة الكتابة
    sendTypingStatus(conversationId, isTyping) {
        this.sendWebSocketMessage('typing', { conversationId, isTyping });
    }
}

// Singleton instance
const chatService = new ChatService();
export default chatService;
