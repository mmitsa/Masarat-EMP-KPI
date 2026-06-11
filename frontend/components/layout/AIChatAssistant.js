import React, { useState, useRef, useEffect } from 'react';

// Sample AI responses for demo
const aiResponses = {
    'مرحبا': 'مرحباً بك! أنا المساعد الذكي لمنصة مسارات. كيف يمكنني مساعدتك اليوم؟',
    'كيف': 'يسعدني مساعدتك! يرجى تحديد سؤالك بشكل أوضح حتى أتمكن من مساعدتك.',
    'المستودع': 'نظام المستودعات يتيح لك إدارة المخزون والعهد وطلبات الصرف. يمكنك الوصول إليه من القائمة الجانبية.',
    'الموظفين': 'يمكنك إدارة بيانات الموظفين من قسم الموارد البشرية. هل تريد أن أوجهك للصفحة؟',
    'تقرير': 'يمكنك إنشاء تقارير متنوعة من قسم التقارير والتحليلات. ما نوع التقرير الذي تحتاجه؟',
    'default': 'شكراً لتواصلك! أنا هنا لمساعدتك في استخدام منصة مسارات. يمكنني مساعدتك في:\n\n• إدارة المستودعات والمخزون\n• الموارد البشرية والموظفين\n• إدارة الحركة والمركبات\n• الأرشفة الإلكترونية\n• التقارير والتحليلات\n\nما الذي تحتاج مساعدة فيه؟'
};

const getAIResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    for (const [key, response] of Object.entries(aiResponses)) {
        if (key !== 'default' && lowerMessage.includes(key)) {
            return response;
        }
    }
    return aiResponses.default;
};

export default function AIChatAssistant({ isOpen, onClose, darkMode = false }) {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: 'مرحباً! أنا المساعد الذكي لمنصة مسارات. كيف يمكنني مساعدتك؟',
            time: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage = {
            id: messages.length + 1,
            type: 'user',
            text: inputValue,
            time: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        // Simulate AI response delay
        setTimeout(() => {
            const botMessage = {
                id: messages.length + 2,
                type: 'bot',
                text: getAIResponse(inputValue),
                time: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
        }, 1000 + Math.random() * 1000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickActions = [
        { label: 'كيف أضيف موظف؟', icon: '👤' },
        { label: 'تقرير المخزون', icon: '📦' },
        { label: 'طلب صيانة', icon: '🔧' },
        { label: 'إنشاء معاملة', icon: '📄' },
    ];

    if (!isOpen) return null;

    return (
        <div className={`fixed left-0 top-0 h-screen w-96 z-50 flex flex-col shadow-2xl transition-all duration-300
            ${darkMode ? 'bg-gray-900' : 'bg-white dark:bg-gray-900'}`}
            dir="rtl"
        >
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between
                ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            المساعد الذكي
                        </h3>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            متصل الآن
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className={`p-2 rounded-lg transition-colors
                        ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400'}`}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-gray-950' : 'bg-gray-50 dark:bg-gray-800'}`}>
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                        <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                            {message.type === 'bot' && (
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                                        المساعد الذكي
                                    </span>
                                </div>
                            )}
                            <div
                                className={`px-4 py-3 rounded-2xl whitespace-pre-wrap
                                    ${message.type === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                        : darkMode
                                            ? 'bg-gray-800 text-gray-100 rounded-bl-sm'
                                            : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-bl-sm shadow-sm dark:shadow-gray-900/20'
                                    }`}
                            >
                                {message.text}
                            </div>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}
                                ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                                {message.time.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex justify-end">
                        <div className={`px-4 py-3 rounded-2xl rounded-bl-sm
                            ${darkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-900 shadow-sm'}`}>
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
                        {quickActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setInputValue(action.label);
                                    setTimeout(() => handleSend(), 100);
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                                    ${darkMode
                                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                    }`}
                            >
                                <span className="ml-1">{action.icon}</span>
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className={`p-4 border-t ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
                <div className={`flex items-end gap-2 p-2 rounded-2xl border
                    ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200 dark:border-gray-700'}`}>
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="اكتب رسالتك..."
                        rows={1}
                        className={`flex-1 resize-none px-3 py-2 bg-transparent outline-none
                            ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'}`}
                        style={{ maxHeight: '120px' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isTyping}
                        className={`p-2 rounded-xl transition-all
                            ${inputValue.trim() && !isTyping
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
                <p className={`text-xs text-center mt-2 ${darkMode ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`}>
                    المساعد الذكي قد لا يكون دقيقاً دائماً. تحقق من المعلومات المهمة.
                </p>
            </div>
        </div>
    );
}

// Floating Chat Button Component
export function ChatButton({ onClick, darkMode = false, hasUnread = false }) {
    return (
        <button
            onClick={onClick}
            className={`fixed left-6 bottom-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 transition-all hover:scale-110
                bg-gradient-to-br from-blue-500 to-purple-600 text-white`}
        >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {hasUnread && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
        </button>
    );
}
