// =============================================================================
// مكون المساعد الذكي - Tailwind Version
// AI Assistant Component with Floating Action Button
// =============================================================================

import { useState, useRef, useEffect } from 'react';
import api from '../../lib/api';

export default function AIAssistant({ onAction, context = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'مرحباً! أنا المساعد الذكي للمنصة الموحدة. كيف يمكنني مساعدتك اليوم؟',
      actions: ['عرض أرصدة المستودع', 'طلبات الصرف المعلقة', 'حالة الجرد']
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Send message
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.ai.chat(text, context);

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.response,
        actions: response.suggestedActions || response.suggested_actions,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.',
        isError: true,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action) => {
    if (onAction && typeof onAction === 'function') {
      const handled = onAction(action);
      if (handled) {
        setIsOpen(false);
        return;
      }
    }
    sendMessage(action);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-new',
        role: 'assistant',
        content: 'تم مسح المحادثة. كيف يمكنني مساعدتك؟',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        className="fixed bottom-6 left-6 w-14 h-14 rounded-full
                   bg-gradient-to-r from-primary-500 to-primary-600
                   shadow-lg hover:shadow-xl transform hover:scale-110
                   transition-all duration-200 z-50
                   flex items-center justify-center group"
        onClick={() => setIsOpen(true)}
        aria-label="فتح المساعد الذكي"
      >
        <svg
          className="w-7 h-7 text-white group-hover:scale-110 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>

      {/* Chat Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            className="absolute left-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl
                       transform transition-transform duration-300 flex flex-col"
            dir="rtl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">المساعد الذكي</h3>
                    <p className="text-xs opacity-90">المنصة الموحدة</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearChat}
                    className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center
                               transition-colors"
                    title="مسح المحادثة"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center
                               transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className="flex items-end gap-2 max-w-[85%]">
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm">🤖</span>
                      </div>
                    )}

                    <div className="flex-1">
                      <div
                        className={`
                          rounded-2xl p-3
                          ${msg.role === 'user'
                            ? 'bg-primary-500 text-white rounded-tr-sm'
                            : msg.isError
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-tl-sm'
                            : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm dark:shadow-gray-900/20 rounded-tl-sm'}
                        `}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>

                        {msg.actions && msg.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {msg.actions.map((action, i) => (
                              <button
                                key={i}
                                onClick={() => handleAction(action)}
                                className="px-3 py-1 bg-primary-100 hover:bg-primary-200
                                         text-primary-700 rounded-lg text-xs
                                         transition-colors duration-200"
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {msg.timestamp && (
                        <p className="text-xs text-gray-400 mt-1 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString('ar-SA', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-end">
                  <div className="flex items-end gap-2 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
                      <span className="text-white text-sm">🤖</span>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl rounded-tl-sm p-3 shadow-sm dark:shadow-gray-900/20">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">جاري الكتابة...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="اكتب رسالتك..."
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3
                             focus:ring-2 focus:ring-primary-500 focus:border-transparent
                             text-right transition-all"
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-12 h-12 rounded-xl bg-primary-500 text-white
                             disabled:opacity-50 disabled:cursor-not-allowed
                             hover:bg-primary-600 transition-colors
                             flex items-center justify-center flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                مدعوم بـ dLLM • الذكاء الاصطناعي
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
