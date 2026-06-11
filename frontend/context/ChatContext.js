import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useUser } from './AppContext';
import api from '../lib/api';
import * as signalR from '@microsoft/signalr';

// Chat Context
const ChatContext = createContext(null);

// Notification context reference (will be set by provider)
let notificationContextRef = null;
export const setNotificationContext = (context) => {
    notificationContextRef = context;
};

// Initial State
const initialState = {
    conversations: [],
    activeConversation: null,
    messages: {},
    employees: [],
    unreadCount: 0,
    isConnected: false,
    typingUsers: {},
};

export function ChatProvider({ children }) {
    const user = useUser();
    const router = useRouter();
    const [state, setState] = useState(initialState);
    const [isLoading, setIsLoading] = useState(false);
    const wsRef = useRef(null);

    // SignalR Connection Setup (Optional - Based on Feature Flag)
    useEffect(() => {
        // Check if chat feature and SignalR are enabled
        const chatEnabled = process.env.NEXT_PUBLIC_ENABLE_CHAT === 'true';
        const signalREnabled = process.env.NEXT_PUBLIC_ENABLE_SIGNALR === 'true';

        if (!chatEnabled) {
            console.log('ℹ️ Chat feature is disabled via feature flag.');
            return;
        }

        if (!signalREnabled) {
            console.log('ℹ️ SignalR is disabled for chat. Using polling mode.');
            setState(prev => ({ ...prev, isConnected: false }));
            return;
        }

        if (!user?.id) return;

        console.log('🔌 Initializing Chat SignalR connection...');

        // في الإنتاج: يمر عبر IIS reverse proxy (chathub → localhost:5009)
        // في التطوير: يتصل مباشرة بخدمة المحادثات
        const chatBaseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || process.env.NEXT_PUBLIC_CHAT_API_URL || 'http://localhost:5009';
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${chatBaseUrl}/chathub`, {
                accessTokenFactory: async () => {
                    try {
                        const res = await fetch('/api/auth/session');
                        const session = await res.json();
                        return session?.accessToken || session?.user?.id || '';
                    } catch {
                        return '';
                    }
                },
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    // Exponential backoff: 0s, 2s, 10s, 30s, 60s
                    if (retryContext.previousRetryCount === 0) return 0;
                    if (retryContext.previousRetryCount < 3) return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 10000);
                    return 30000;
                },
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        // معالجة الأحداث
        connection.on('ReceiveMessage', (message) => {
            console.log('📩 New message received:', message);

            setState(prev => ({
                ...prev,
                messages: {
                    ...prev.messages,
                    [message.conversationId]: [
                        ...(prev.messages[message.conversationId] || []),
                        message
                    ],
                },
                conversations: prev.conversations.map(c =>
                    c.id === message.conversationId
                        ? {
                            ...c,
                            lastMessage: message.content,
                            lastMessageTime: new Date(message.createdAt),
                            unreadCount: c.unreadCount + 1
                        }
                        : c
                ),
                unreadCount: prev.unreadCount + 1,
            }));
        });

        connection.on('MessageUpdated', (message) => {
            console.log('✏️ Message updated:', message);

            setState(prev => ({
                ...prev,
                messages: {
                    ...prev.messages,
                    [message.conversationId]: prev.messages[message.conversationId]?.map(m =>
                        m.id === message.id ? message : m
                    ) || [],
                },
            }));
        });

        connection.on('MessageDeleted', ({ conversationId, messageId }) => {
            console.log('🗑️ Message deleted:', messageId);

            setState(prev => ({
                ...prev,
                messages: {
                    ...prev.messages,
                    [conversationId]: prev.messages[conversationId]?.filter(m =>
                        m.id !== messageId
                    ) || [],
                },
            }));
        });

        connection.on('UserTyping', ({ employeeId, userName }) => {
            console.log('⌨️ User typing:', userName);

            setState(prev => ({
                ...prev,
                typingUsers: {
                    ...prev.typingUsers,
                    [employeeId]: { name: userName, timestamp: Date.now() }
                },
            }));

            // إزالة بعد 3 ثواني
            setTimeout(() => {
                setState(prev => {
                    const newTyping = { ...prev.typingUsers };
                    delete newTyping[employeeId];
                    return { ...prev, typingUsers: newTyping };
                });
            }, 3000);
        });

        connection.on('UserJoined', (employeeId) => {
            console.log('👋 User joined:', employeeId);
        });

        connection.on('UserLeft', (employeeId) => {
            console.log('👋 User left:', employeeId);
        });

        // بدء الاتصال
        connection.start()
            .then(() => {
                console.log('✅ Chat SignalR connected');
                setState(prev => ({ ...prev, isConnected: true }));
                wsRef.current = connection;
            })
            .catch(err => {
                console.warn('Chat SignalR: الخدمة غير متاحة');
                setState(prev => ({ ...prev, isConnected: false }));
                // Don't retry if feature is disabled
                if (!signalREnabled) {
                    console.log('ℹ️ SignalR disabled, not retrying.');
                }
            });

        // معالجة إعادة الاتصال
        connection.onreconnecting(() => {
            console.log('🔄 Chat SignalR reconnecting...');
            setState(prev => ({ ...prev, isConnected: false }));
        });

        connection.onreconnected(() => {
            console.log('✅ Chat SignalR reconnected');
            setState(prev => ({ ...prev, isConnected: true }));
        });

        connection.onclose(() => {
            console.log('🔌 Chat SignalR connection closed');
            setState(prev => ({ ...prev, isConnected: false }));
        });

        return () => {
            if (connection.state === signalR.HubConnectionState.Connected) {
                connection.stop();
            }
        };
    }, [user?.id]);

    // تحميل البيانات من API
    useEffect(() => {
        const loadConversations = async () => {
            const isAuthPage = router.pathname === '/login' || router.pathname === '/forgot-password' || router.pathname === '/reset-password';
            if (!user?.id || isAuthPage) {
                // لا يوجد مستخدم أو في صفحة المصادقة - حالة فارغة
                setState(prev => ({
                    ...prev,
                    employees: [],
                    conversations: [],
                    unreadCount: 0,
                }));
                return;
            }

            // محاولة تحميل الموظفين من API
            let resolvedEmployees = [];
            try {
                const empRes = await fetch('/api/chat/employees', { credentials: 'include' });
                if (empRes.ok) {
                    const empData = await empRes.json();
                    resolvedEmployees = empData.success
                        ? (empData.data || empData.employees || [])
                        : [];
                }
            } catch (_e) {
                // الخدمة غير متاحة - قائمة فارغة
            }

            try {
                setIsLoading(true);
                const response = await api.chat.getConversations(user.id);
                // Handle different response formats: direct array, wrapped in conversations/data, or null
                let conversations = [];
                if (Array.isArray(response)) {
                    conversations = response;
                } else if (response?.conversations) {
                    conversations = response.conversations;
                } else if (response?.data) {
                    conversations = response.data;
                }

                setState(prev => ({
                    ...prev,
                    employees: resolvedEmployees,
                    conversations,
                    unreadCount: conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
                }));
            } catch (error) {
                // المحادثات اختيارية - حالة فارغة عند عدم توفر الخدمة
                console.warn('Chat: تعذر تحميل المحادثات (الخدمة غير متاحة)');
                setState(prev => ({
                    ...prev,
                    employees: resolvedEmployees,
                    conversations: [],
                    unreadCount: 0,
                }));
            } finally {
                setIsLoading(false);
            }
        };

        loadConversations();
    }, [user?.id, router.pathname]);

    // بدء محادثة جديدة
    const startConversation = useCallback((employeeId, notifyOther = true) => {
        const existingConv = state.conversations.find(
            c => c.type === 'private' && c.participants.includes(employeeId) && c.participants.includes(user?.id)
        );

        if (existingConv) {
            setState(prev => ({ ...prev, activeConversation: existingConv.id }));
            return existingConv.id;
        }

        const newConv = {
            id: `conv_${Date.now()}`,
            type: 'private',
            participants: [user?.id || 1, employeeId],
            lastMessage: '',
            lastMessageTime: new Date(),
            unreadCount: 0,
            createdBy: user?.id || 1,
        };

        setState(prev => ({
            ...prev,
            conversations: [newConv, ...prev.conversations],
            activeConversation: newConv.id,
            messages: { ...prev.messages, [newConv.id]: [] },
        }));

        // Send notification to the other user about new conversation
        if (notifyOther && notificationContextRef?.notifyNewChat) {
            const currentUserInfo = {
                id: user?.id || 1,
                name: user?.name || 'مستخدم',
                avatar: user?.avatar || null,
            };
            notificationContextRef.notifyNewChat(currentUserInfo, newConv.id, false);
        }

        return newConv.id;
    }, [state.conversations, user?.id, user?.name, user?.avatar]);

    // إرسال رسالة
    const sendMessage = useCallback(async (conversationId, content, type = 'text', attachments = [], notifyRecipients = true) => {
        const tempMessage = {
            id: `msg_${Date.now()}`,
            conversationId,
            senderId: user?.id || 1,
            content,
            type, // text, voice, file, image
            attachments,
            timestamp: new Date(),
            status: 'sending', // sending, sent, delivered, read
            reactions: [],
        };

        // أضف الرسالة محلياً مباشرة
        setState(prev => ({
            ...prev,
            messages: {
                ...prev.messages,
                [conversationId]: [...(prev.messages[conversationId] || []), tempMessage],
            },
            conversations: prev.conversations.map(c =>
                c.id === conversationId
                    ? { ...c, lastMessage: content, lastMessageTime: new Date() }
                    : c
            ),
        }));

        try {
            // إرسال للسيرفر الحقيقي
            const response = await api.chat.sendMessage(conversationId, {
                content,
                type,
                attachments,
                senderId: user?.id || 1,
            });

            const serverMessage = response.message || response.data || tempMessage;

            // تحديث الرسالة بالبيانات من السيرفر
            setState(prev => ({
                ...prev,
                messages: {
                    ...prev.messages,
                    [conversationId]: prev.messages[conversationId]?.map(m =>
                        m.id === tempMessage.id ? { ...serverMessage, status: 'sent' } : m
                    ) || [],
                },
            }));

            // Send notification to recipients
            if (notifyRecipients && notificationContextRef?.notifyNewMessage) {
                const currentUserInfo = {
                    id: user?.id || 1,
                    name: user?.name || 'مستخدم',
                    avatar: user?.avatar || null,
                };
                notificationContextRef.notifyNewMessage(currentUserInfo, conversationId, content);
            }

            return serverMessage;
        } catch (error) {
            console.warn('Error sending message:', error);

            // في حالة الخطأ، حدّث الحالة إلى failed
            setState(prev => ({
                ...prev,
                messages: {
                    ...prev.messages,
                    [conversationId]: prev.messages[conversationId]?.map(m =>
                        m.id === tempMessage.id ? { ...m, status: 'failed' } : m
                    ) || [],
                },
            }));

            throw error;
        }
    }, [user?.id, user?.name, user?.avatar]);

    // إرسال رسالة صوتية
    const sendVoiceMessage = useCallback(async (conversationId, audioBlob, duration) => {
        try {
            // 1. إنشاء رسالة مؤقتة
            const tempMessage = {
                id: `msg_${Date.now()}`,
                conversationId,
                senderId: user?.id || 1,
                content: `رسالة صوتية (${Math.floor(duration)}ث)`,
                type: 'voice',
                attachments: [],
                timestamp: new Date(),
                status: 'uploading',
            };

            // 2. عرض الرسالة محلياً
            setState(prev => ({
                ...prev,
                messages: {
                    ...prev.messages,
                    [conversationId]: [...(prev.messages[conversationId] || []), tempMessage],
                },
            }));

            // 3. إرسال رسالة فارغة للسيرفر
            const response = await api.chat.sendMessage(conversationId, {
                content: tempMessage.content,
                type: 'voice',
                senderId: user?.id || 1,
            });

            const serverMessage = response.message || response.data || response;

            // 4. رفع الملف الصوتي
            const formData = new FormData();
            formData.append('file', audioBlob, 'voice-note.webm');
            formData.append('type', 'voice');
            formData.append('duration', Math.floor(duration).toString());

            const attachment = await api.chat.uploadAttachment(
                conversationId,
                serverMessage.id,
                formData
            );

            // 5. تحديث الرسالة بالمرفق
            setState(prev => ({
                ...prev,
                messages: {
                    ...prev.messages,
                    [conversationId]: prev.messages[conversationId]?.map(m =>
                        m.id === tempMessage.id
                            ? {
                                ...serverMessage,
                                attachments: [attachment],
                                status: 'sent'
                            }
                            : m
                    ) || [],
                },
                conversations: prev.conversations.map(c =>
                    c.id === conversationId
                        ? { ...c, lastMessage: tempMessage.content, lastMessageTime: new Date() }
                        : c
                ),
            }));

            return serverMessage;
        } catch (error) {
            console.warn('Error sending voice message:', error);
            throw error;
        }
    }, [user?.id, sendMessage]);

    // إرسال ملف
    const sendFile = useCallback(async (conversationId, file) => {
        try {
            const fileType = file.type.startsWith('image/') ? 'image' : 'file';

            // 1. إنشاء رسالة مؤقتة
            const tempMessage = {
                id: `msg_${Date.now()}`,
                conversationId,
                senderId: user?.id || 1,
                content: file.name,
                type: fileType,
                attachments: [],
                timestamp: new Date(),
                status: 'uploading',
            };

            // 2. عرض الرسالة محلياً
            setState(prev => ({
                ...prev,
                messages: {
                    ...prev.messages,
                    [conversationId]: [...(prev.messages[conversationId] || []), tempMessage],
                },
            }));

            // 3. إرسال رسالة للسيرفر
            const response = await api.chat.sendMessage(conversationId, {
                content: file.name,
                type: fileType,
                senderId: user?.id || 1,
            });

            const serverMessage = response.message || response.data || response;

            // 4. رفع الملف
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', fileType);

            const attachment = await api.chat.uploadAttachment(
                conversationId,
                serverMessage.id,
                formData
            );

            // 5. تحديث الرسالة بالمرفق
            setState(prev => ({
                ...prev,
                messages: {
                    ...prev.messages,
                    [conversationId]: prev.messages[conversationId]?.map(m =>
                        m.id === tempMessage.id
                            ? {
                                ...serverMessage,
                                attachments: [attachment],
                                status: 'sent'
                            }
                            : m
                    ) || [],
                },
                conversations: prev.conversations.map(c =>
                    c.id === conversationId
                        ? { ...c, lastMessage: file.name, lastMessageTime: new Date() }
                        : c
                ),
            }));

            return serverMessage;
        } catch (error) {
            console.warn('Error sending file:', error);
            throw error;
        }
    }, [user?.id, sendMessage]);

    // تحميل رسائل محادثة
    const loadMessages = useCallback(async (conversationId) => {
        if (state.messages[conversationId]) return state.messages[conversationId];

        try {
            setIsLoading(true);
            // تحميل الرسائل من API
            const response = await api.chat.getMessages(conversationId);
            const messages = response.messages || response.data || [];

            setState(prev => ({
                ...prev,
                messages: { ...prev.messages, [conversationId]: messages },
            }));

            return messages;
        } catch (error) {
            console.warn('Error loading messages:', error);

            // في حالة الخطأ، عرض حالة فارغة بدون رسائل وهمية
            setState(prev => ({
                ...prev,
                messages: { ...prev.messages, [conversationId]: [] },
            }));

            return [];
        } finally {
            setIsLoading(false);
        }
    }, [state.messages, user.id]);

    // تعيين المحادثة النشطة
    const setActiveConversation = useCallback((conversationId) => {
        setState(prev => ({ ...prev, activeConversation: conversationId }));
        if (conversationId) {
            loadMessages(conversationId);

            // الانضمام للمحادثة عبر SignalR
            if (wsRef.current?.state === signalR.HubConnectionState.Connected) {
                wsRef.current.invoke('JoinConversation', conversationId)
                    .catch(err => console.warn('Error joining conversation:', err));
            }

            // تصفير عداد الرسائل غير المقروءة
            setState(prev => ({
                ...prev,
                conversations: prev.conversations.map(c =>
                    c.id === conversationId ? { ...c, unreadCount: 0 } : c
                ),
                unreadCount: prev.conversations.reduce((acc, c) =>
                    c.id === conversationId ? acc : acc + c.unreadCount, 0
                ),
            }));
        }
    }, [loadMessages]);

    // البحث عن موظفين
    const searchEmployees = useCallback((query) => {
        if (!query) return state.employees;
        const lowerQuery = query.toLowerCase();
        return state.employees.filter(e =>
            e.name.toLowerCase().includes(lowerQuery) ||
            e.department.toLowerCase().includes(lowerQuery) ||
            e.role.toLowerCase().includes(lowerQuery)
        );
    }, [state.employees]);

    // الحصول على معلومات موظف
    const getEmployee = useCallback((employeeId) => {
        return state.employees.find(e => e.id === employeeId);
    }, [state.employees]);

    // إنشاء مجموعة جديدة
    const createGroupConversation = useCallback((name, participantIds, notifyMembers = true) => {
        const newGroup = {
            id: `group_${Date.now()}`,
            type: 'group',
            name,
            participants: [user?.id || 1, ...participantIds],
            lastMessage: 'تم إنشاء المجموعة',
            lastMessageTime: new Date(),
            unreadCount: 0,
            createdBy: user?.id || 1,
            admins: [user?.id || 1],
        };

        setState(prev => ({
            ...prev,
            conversations: [newGroup, ...prev.conversations],
            activeConversation: newGroup.id,
            messages: { ...prev.messages, [newGroup.id]: [] },
        }));

        // Send notifications to all participants
        if (notifyMembers && notificationContextRef?.notifyNewChat) {
            const currentUserInfo = {
                id: user?.id || 1,
                name: user?.name || 'مستخدم',
                avatar: user?.avatar || null,
            };
            notificationContextRef.notifyNewChat(currentUserInfo, newGroup.id, true);
        }

        return newGroup.id;
    }, [user?.id, user?.name, user?.avatar]);

    // أرشفة المحادثة
    const archiveConversation = useCallback(async (conversationId) => {
        // إرسال للأرشيف
        const conversation = state.conversations.find(c => c.id === conversationId);
        const messages = state.messages[conversationId] || [];

        const archiveData = {
            conversationId,
            conversation,
            messages,
            archivedAt: new Date(),
            archivedBy: user?.id,
        };

        console.log('Archiving conversation:', archiveData);

        return archiveData;
    }, [state.conversations, state.messages, user?.id]);

    // تحديث حالة الاتصال
    const updateOnlineStatus = useCallback((employeeId, status) => {
        setState(prev => ({
            ...prev,
            employees: prev.employees.map(e =>
                e.id === employeeId ? { ...e, status } : e
            ),
        }));
    }, []);

    // محاكاة استلام رسالة جديدة (للتجربة - بيئة التطوير فقط)
    const simulateIncomingMessage = process.env.NODE_ENV === 'development'
        ? useCallback((conversationId, senderId, content) => {
            const sender = state.employees.find(e => e.id === senderId);
            const newMessage = {
                id: `msg_${Date.now()}`,
                conversationId,
                senderId,
                content,
                type: 'text',
                attachments: [],
                timestamp: new Date(),
                status: 'delivered',
                reactions: [],
            };

            setState(prev => ({
                ...prev,
                messages: {
                    ...prev.messages,
                    [conversationId]: [...(prev.messages[conversationId] || []), newMessage],
                },
                conversations: prev.conversations.map(c =>
                    c.id === conversationId
                        ? { ...c, lastMessage: content, lastMessageTime: new Date(), unreadCount: c.unreadCount + 1 }
                        : c
                ),
                unreadCount: prev.unreadCount + 1,
            }));

            // Send notification
            if (sender && notificationContextRef?.notifyNewMessage) {
                notificationContextRef.notifyNewMessage(
                    { id: sender.id, name: sender.name, avatar: sender.avatar },
                    conversationId,
                    content
                );
            }

            return newMessage;
        }, [state.employees])
        : () => {};

    const value = {
        ...state,
        startConversation,
        createGroupConversation,
        sendMessage,
        sendVoiceMessage,
        sendFile,
        loadMessages,
        setActiveConversation,
        searchEmployees,
        getEmployee,
        archiveConversation,
        updateOnlineStatus,
        simulateIncomingMessage,
        isLoading,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within ChatProvider');
    }
    return context;
};

export default ChatContext;
