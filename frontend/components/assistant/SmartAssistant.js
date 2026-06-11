import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSmartAssistant } from '../../context/SmartAssistantContext';
import { useUser } from '../../context/AppContext';
import { useRouter } from 'next/router';

// مكون فقاعة الرسالة
function MessageBubble({ message, isBot, darkMode }) {
    const router = useRouter();

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
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>

                    {/* Action Buttons */}
                    {message.actions?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {message.actions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => router.push(action.path)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        darkMode
                                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                            : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-700 dark:text-blue-300'
                                    }`}
                                >
                                    <span>{action.icon}</span>
                                    <span>{action.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Tips */}
                    {message.tips?.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {message.tips.map((tip, idx) => (
                                <div
                                    key={idx}
                                    className={`p-2 rounded-lg text-xs ${
                                        tip.type === 'warning'
                                            ? darkMode
                                                ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-800'
                                                : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 border border-yellow-200 dark:border-yellow-800'
                                            : tip.type === 'policy'
                                                ? darkMode
                                                    ? 'bg-purple-900/30 text-purple-300 border border-purple-800'
                                                    : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                                : darkMode
                                                    ? 'bg-blue-900/30 text-blue-300 border border-blue-800'
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

// مكون المساعد الذكي الرئيسي
export default function SmartAssistant({ isOpen, onClose, darkMode = false }) {
    const {
        moduleKnowledge,
        currentModule,
        processQuestion,
        navigateToPage,
        chatHistory,
        isTyping,
        getPersonalGreeting,
    } = useSmartAssistant();
    const user = useUser();

    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [localTyping, setLocalTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // تهيئة الرسائل عند الفتح
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const greeting = getPersonalGreeting();
            const welcomeMessage = moduleKnowledge.welcomeMessages[
                Math.floor(Math.random() * moduleKnowledge.welcomeMessages.length)
            ];

            setMessages([
                {
                    id: 1,
                    type: 'bot',
                    text: `${greeting}\n\n${welcomeMessage}`,
                    actions: moduleKnowledge.quickActions.slice(0, 4),
                    timestamp: new Date(),
                },
            ]);
        }
    }, [isOpen, moduleKnowledge, getPersonalGreeting]);

    // تغيير الرسالة عند تغيير الموديول
    useEffect(() => {
        if (messages.length > 0) {
            const moduleChangeMessage = {
                id: Date.now(),
                type: 'bot',
                text: `أنت الآن في ${moduleKnowledge.nameAr}. كيف أساعدك؟`,
                actions: moduleKnowledge.quickActions.slice(0, 4),
                timestamp: new Date(),
            };
            // لا نضيف رسالة جديدة لكل تغيير، فقط إذا تغير الموديول فعلياً
        }
    }, [currentModule, moduleKnowledge]);

    // التمرير للأسفل
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // التركيز على الإدخال
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    // إرسال سؤال
    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            text: inputValue,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setLocalTyping(true);

        try {
            const response = await processQuestion(inputValue);

            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                text: response.text,
                actions: response.actions,
                tips: response.tips,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error processing question:', error);
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    type: 'bot',
                    text: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setLocalTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div
            className={`fixed left-0 top-0 h-screen w-full sm:w-96 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
                darkMode ? 'bg-gray-900' : 'bg-white dark:bg-gray-900'
            } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
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
                            {moduleKnowledge.nameAr}
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
                    />
                ))}

                {/* Typing Indicator */}
                {(localTyping || isTyping) && (
                    <div className="flex gap-2 mb-4 flex-row-reverse">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div
                            className={`px-4 py-3 rounded-2xl rounded-bl-sm ${
                                darkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800'
                            }`}
                        >
                            <div className="flex gap-1">
                                <span className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-gray-500' : 'bg-gray-400'}`} style={{ animationDelay: '0ms' }}></span>
                                <span className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-gray-500' : 'bg-gray-400'}`} style={{ animationDelay: '150ms' }}></span>
                                <span className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-gray-500' : 'bg-gray-400'}`} style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}

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
                                onClick={() => navigateToPage(action.path)}
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

            {/* FAQs */}
            {messages.length > 0 && messages.length <= 3 && moduleKnowledge.faqs?.length > 0 && (
                <div className={`p-3 border-t ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
                    <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                        أسئلة شائعة:
                    </p>
                    <div className="space-y-1">
                        {moduleKnowledge.faqs.slice(0, 3).map((faq, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setInputValue(faq.q);
                                    setTimeout(handleSend, 100);
                                }}
                                className={`w-full text-right px-3 py-2 rounded-lg text-xs transition-colors ${
                                    darkMode
                                        ? 'hover:bg-gray-800 text-gray-400'
                                        : 'hover:bg-gray-100 text-gray-600 dark:text-gray-300'
                                }`}
                            >
                                {faq.q}
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
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || localTyping}
                        className={`p-2 rounded-xl transition-all ${
                            inputValue.trim() && !localTyping
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
                <p className={`text-[10px] text-center mt-2 ${darkMode ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`}>
                    المساعد الذكي يتكيف مع القسم الحالي ({moduleKnowledge.nameAr})
                </p>
            </div>
        </div>
    );
}

// زر فتح المساعد الذكي
export function SmartAssistantButton({ onClick, darkMode = false, moduleKnowledge }) {
    return (
        <button
            onClick={onClick}
            className="relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 transition-all hover:scale-110"
            style={{ background: `linear-gradient(135deg, ${moduleKnowledge?.color || '#3b82f6'}, #8b5cf6)` }}
        >
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        </button>
    );
}
