/**
 * Smart Assistant V2
 * المساعد الذكي المحسن مع دعم Claude API
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../context/AppContext';
import { useSmartAssistant } from '../../context/SmartAssistantContext';
import {
    LeaveBalanceCard,
    DataTableMessage,
    CustodiesCard,
    LeaveRequestCard,
    VehiclesCard,
    ActionButtons,
    ConfirmationMessage,
    SuccessMessage,
    ErrorMessage,
    QuickActions,
    TypingIndicator,
} from './RichMessage';

/**
 * مكون فقاعة الرسالة المحسن
 */
function MessageBubble({ message, isBot, darkMode, onConfirm, onCancel, onAction }) {
    const router = useRouter();

    // عرض المحتوى الغني حسب النوع
    const renderRichContent = () => {
        if (!message.data) return null;

        switch (message.dataType) {
            case 'leave_balance':
                return <LeaveBalanceCard data={message.data} />;
            case 'leave_request_created':
            case 'leave_requests':
                return <LeaveRequestCard data={message.data} />;
            case 'custodies':
                return <CustodiesCard data={message.data} />;
            case 'available_vehicles':
                return <VehiclesCard data={message.data} />;
            case 'employee_search':
            case 'item_search':
                return <DataTableMessage data={message.data} />;
            default:
                return null;
        }
    };

    return (
        <div className={`flex gap-2 mb-4 ${isBot ? 'flex-row-reverse' : 'flex-row'}`}>
            {isBot && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
            )}

            <div className={`max-w-[85%] ${isBot ? 'ml-auto' : 'mr-auto'}`}>
                <div
                    className={`px-4 py-3 rounded-2xl ${
                        isBot
                            ? darkMode
                                ? 'bg-gray-800 text-gray-100'
                                : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800'
                            : 'bg-blue-600 text-white'
                    } ${isBot ? 'rounded-bl-sm' : 'rounded-br-sm'}`}
                >
                    {/* النص الرئيسي */}
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>

                    {/* المحتوى الغني */}
                    {renderRichContent()}

                    {/* التفاصيل */}
                    {message.details && message.details.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <ul className="text-sm space-y-1">
                                {message.details.map((detail, idx) => (
                                    <li key={idx} className="text-gray-600 dark:text-gray-300">{detail}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* رسالة النجاح */}
                    {message.success && message.nextSteps && (
                        <SuccessMessage
                            message={message.text}
                            details={message.details}
                            nextSteps={message.nextSteps}
                        />
                    )}

                    {/* رسالة الخطأ */}
                    {message.error && (
                        <ErrorMessage
                            error={message.error}
                            suggestion={message.suggestion}
                        />
                    )}

                    {/* طلب التأكيد */}
                    {message.confirmationRequired && (
                        <ConfirmationMessage
                            message={message.text}
                            onConfirm={onConfirm}
                            onCancel={onCancel}
                        />
                    )}

                    {/* أزرار الإجراءات */}
                    {message.actions?.length > 0 && (
                        <ActionButtons
                            actions={message.actions}
                            onAction={(action) => {
                                if (action.path) {
                                    router.push(action.path);
                                } else if (onAction) {
                                    onAction(action);
                                }
                            }}
                        />
                    )}

                    {/* التلميحات */}
                    {message.tips?.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {message.tips.map((tip, idx) => (
                                <div
                                    key={idx}
                                    className={`p-2 rounded-lg text-xs ${
                                        tip.type === 'warning'
                                            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 border border-yellow-200 dark:border-yellow-800'
                                            : tip.type === 'policy'
                                                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                    }`}
                                >
                                    <strong>{tip.title}:</strong> {tip.content}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <p className={`text-[10px] mt-1 ${darkMode ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'} ${isBot ? 'text-left' : 'text-right'}`}>
                    {message.timestamp?.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
}

/**
 * المساعد الذكي V2
 */
export default function SmartAssistantV2({ isOpen, onClose, darkMode = false }) {
    const {
        moduleKnowledge,
        currentModule,
        getPersonalGreeting,
        processQuestion,
    } = useSmartAssistant();
    const user = useUser();
    const router = useRouter();

    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const [pendingConfirmation, setPendingConfirmation] = useState(null);
    const [useLLM, setUseLLM] = useState(true); // استخدام LLM أو الوضع المحلي

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // تهيئة المحادثة
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            initializeConversation();
        }
    }, [isOpen]);

    // التركيز على الإدخال
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    // التمرير للأسفل
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    /**
     * تهيئة المحادثة
     */
    const initializeConversation = async () => {
        const greeting = getPersonalGreeting();
        const welcomeMessage = moduleKnowledge.welcomeMessages[
            Math.floor(Math.random() * moduleKnowledge.welcomeMessages.length)
        ];

        const initialMessage = {
            id: Date.now(),
            type: 'bot',
            text: `${greeting}\n\n${welcomeMessage}`,
            actions: moduleKnowledge.quickActions.slice(0, 4),
            timestamp: new Date(),
        };

        setMessages([initialMessage]);

        // محاولة الحصول على رسالة من الـ API
        if (useLLM) {
            try {
                const response = await fetch('/api/assistant/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ module: currentModule }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setConversationId(data.conversationId);
                }
            } catch (error) {
                console.log('LLM not available, using local mode');
                setUseLLM(false);
            }
        }
    };

    /**
     * إرسال رسالة
     */
    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            text: inputValue,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            if (useLLM) {
                // استخدام Claude API
                const response = await fetch('/api/assistant/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: inputValue,
                        module: currentModule,
                        conversationId,
                    }),
                });

                if (!response.ok) {
                    throw new Error('API Error');
                }

                const data = await response.json();
                setConversationId(data.conversationId);

                const botMessage = {
                    id: Date.now() + 1,
                    type: 'bot',
                    text: data.text,
                    data: data.data,
                    dataType: data.dataType,
                    actions: data.actions,
                    details: data.details,
                    nextSteps: data.nextSteps,
                    success: data.success,
                    error: data.error,
                    suggestion: data.suggestion,
                    confirmationRequired: data.confirmationRequired,
                    timestamp: new Date(),
                };

                setMessages(prev => [...prev, botMessage]);

                // حفظ طلب التأكيد
                if (data.confirmationRequired) {
                    setPendingConfirmation(data.confirmationRequired);
                }

                // تنفيذ الإجراءات
                if (data.actions) {
                    for (const action of data.actions) {
                        if (action.type === 'navigate' && action.data?.path) {
                            setTimeout(() => router.push(action.data.path), 500);
                        }
                    }
                }
            } else {
                // الوضع المحلي (fallback)
                await handleLocalMessage(inputValue);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setUseLLM(false);
            await handleLocalMessage(inputValue);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * معالجة الرسالة محلياً (fallback)
     */
    const handleLocalMessage = async (text) => {
        // استخدام processQuestion المستخرجة في أعلى المكون
        const response = await processQuestion(text);

        const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            text: response.text,
            actions: response.actions,
            tips: response.tips,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, botMessage]);
    };

    /**
     * تأكيد الإجراء
     */
    const handleConfirm = async () => {
        if (!pendingConfirmation) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    confirm: true,
                    confirmAction: pendingConfirmation.functionName,
                    confirmArgs: pendingConfirmation.arguments,
                    module: currentModule,
                    conversationId,
                }),
            });

            const data = await response.json();

            const confirmMessage = {
                id: Date.now(),
                type: 'bot',
                text: data.text || data.message,
                data: data.data,
                dataType: data.dataType,
                details: data.details,
                nextSteps: data.nextSteps,
                success: data.success,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, confirmMessage]);
            setPendingConfirmation(null);
        } catch (error) {
            console.error('Confirmation error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * إلغاء الإجراء
     */
    const handleCancel = () => {
        setPendingConfirmation(null);
        setMessages(prev => [
            ...prev,
            {
                id: Date.now(),
                type: 'bot',
                text: 'تم إلغاء الإجراء',
                timestamp: new Date(),
            },
        ]);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed left-0 top-0 h-screen w-96 z-50 flex flex-col shadow-2xl transition-all duration-300 ${
                darkMode ? 'bg-gray-900' : 'bg-white dark:bg-gray-900'
            }`}
            dir="rtl"
        >
            {/* Header */}
            <div
                className={`p-4 border-b flex items-center justify-between ${
                    darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${moduleKnowledge.color}, #8b5cf6)` }}
                    >
                        <span className="text-xl">{moduleKnowledge.icon}</span>
                    </div>
                    <div>
                        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            المساعد الذكي
                        </h3>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {moduleKnowledge.nameAr} {useLLM && '• متصل'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className={`p-2 rounded-lg transition-colors ${
                        darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400'
                    }`}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-4 ${darkMode ? 'bg-gray-950' : 'bg-gray-50 dark:bg-gray-800'}`}>
                {messages.map((message) => (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        isBot={message.type === 'bot'}
                        darkMode={darkMode}
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                    />
                ))}

                {/* Typing Indicator */}
                {isLoading && <TypingIndicator />}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 2 && (
                <div className={`p-3 border-t ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
                    <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                        اقتراحات سريعة:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {moduleKnowledge.quickActions.slice(0, 4).map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setInputValue(action.description || action.label);
                                    setTimeout(handleSend, 100);
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                                    darkMode
                                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                }`}
                            >
                                <span>{action.icon}</span>
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className={`p-4 border-t ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
                <div
                    className={`flex items-end gap-2 p-2 rounded-2xl border ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200 dark:border-gray-700'
                    }`}
                >
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="اسأل المساعد..."
                        rows={1}
                        className={`flex-1 resize-none px-3 py-2 bg-transparent outline-none ${
                            darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'
                        }`}
                        style={{ maxHeight: '120px' }}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading}
                        className={`p-2 rounded-xl transition-all ${
                            inputValue.trim() && !isLoading
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : darkMode
                                    ? 'bg-gray-700 text-gray-500 dark:text-gray-400'
                                    : 'bg-gray-200 text-gray-400'
                        }`}
                    >
                        <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>

                {/* حالة الاتصال */}
                <div className={`text-center mt-2 text-xs ${darkMode ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`}>
                    {useLLM ? '🟢 متصل بـ Claude AI' : '🟡 وضع محلي'}
                </div>
            </div>
        </div>
    );
}
