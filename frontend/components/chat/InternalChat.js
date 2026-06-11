import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import { useUser } from '../../context/AppContext';

// في الإنتاج: الملفات المرفقة تمر عبر Gateway (يحوّل /api/chat/* للخدمة)
// GATEWAY_URL أولاً لأن CHAT_API_URL قد يكون subdomain غير موجود (chat.masarat.sa)
// Browser: relative URLs to avoid mixed-content; Server: direct service URL
const CHAT_BASE_URL = typeof window !== 'undefined'
    ? '' // Browser: relative URLs, proxied by Next.js/IIS
    : (process.env.NEXT_PUBLIC_GATEWAY_URL || process.env.NEXT_PUBLIC_CHAT_API_URL || 'http://localhost:5009');

// مكون تسجيل الصوت
function VoiceRecorder({ onRecordComplete, onCancel }) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onRecordComplete(blob, duration);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setDuration(0);

            timerRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
        } catch (error) {
            console.warn('Error accessing microphone:', error);
            alert('لا يمكن الوصول للميكروفون');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
            clearInterval(timerRef.current);
            setIsRecording(false);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
            clearInterval(timerRef.current);
            setIsRecording(false);
        }
        onCancel();
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/30 px-4 py-2 rounded-xl">
            {!isRecording ? (
                <button
                    onClick={startRecording}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93V7h2v1c0 2.76 2.24 5 5 5s5-2.24 5-5V7h2v1c0 4.08-3.06 7.44-7 7.93V19h3v2H8v-2h3v-3.07z"/>
                    </svg>
                </button>
            ) : (
                <>
                    <div className="flex items-center gap-2 flex-1">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="text-red-600 dark:text-red-400 font-medium">{formatDuration(duration)}</span>
                        <div className="flex-1 h-1 bg-red-200 dark:bg-red-800 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                    </div>
                    <button
                        onClick={cancelRecording}
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <button
                        onClick={stopRecording}
                        className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                        </svg>
                    </button>
                </>
            )}
        </div>
    );
}

// مكون رسالة صوتية
function VoiceMessage({ audioUrl, duration }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef(null);

    // تحويل URL نسبي إلى URL كامل
    const fullAudioUrl = audioUrl?.startsWith('http')
        ? audioUrl
        : `${CHAT_BASE_URL}${audioUrl}`;

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.ontimeupdate = () => {
                setProgress((audio.currentTime / audio.duration) * 100);
            };
            audio.onended = () => {
                setIsPlaying(false);
                setProgress(0);
            };
        }
    }, []);

    return (
        <div className="flex items-center gap-2 min-w-[200px]">
            <audio ref={audioRef} src={fullAudioUrl} />
            <button
                onClick={togglePlay}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
                {isPlaying ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                )}
            </button>
            <div className="flex-1">
                <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white dark:bg-gray-900 transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
            <span className="text-xs opacity-70">{Math.floor(duration)}ث</span>
        </div>
    );
}

// مكون مرفق الملف
function FileAttachment({ attachment, isOwn }) {
    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // تحويل URL نسبي إلى URL كامل
    const fullUrl = attachment.url?.startsWith('http')
        ? attachment.url
        : `${CHAT_BASE_URL}${attachment.url}`;

    if (attachment.type === 'image' || attachment.mimeType?.startsWith('image/')) {
        return (
            <div className="max-w-[250px] rounded-lg overflow-hidden">
                <img
                    src={fullUrl}
                    alt={attachment.name || attachment.fileName}
                    className="w-full h-auto cursor-pointer hover:opacity-90"
                    onClick={() => window.open(fullUrl, '_blank')}
                />
            </div>
        );
    }

    return (
        <a
            href={fullUrl}
            download={attachment.name || attachment.fileName}
            className={`flex items-center gap-3 p-3 rounded-lg ${
                isOwn ? 'bg-white/10' : 'bg-gray-100 dark:bg-gray-700'
            } hover:opacity-80 transition-opacity`}
        >
            <div className={`p-2 rounded-lg ${isOwn ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {attachment.name}
                </p>
                <p className={`text-xs ${isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                    {formatSize(attachment.size)}
                </p>
            </div>
            <svg className={`w-5 h-5 ${isOwn ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
        </a>
    );
}

// مكون الرسالة
function Message({ message, isOwn, senderName, showAvatar }) {
    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '؟';
    };

    return (
        <div className={`flex gap-2 mb-3 ${isOwn ? 'flex-row' : 'flex-row-reverse'}`}>
            {showAvatar && !isOwn && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {getInitials(senderName)}
                </div>
            )}
            {showAvatar && isOwn && <div className="w-8"></div>}

            <div className={`max-w-[75%] ${isOwn ? 'mr-auto' : 'ml-auto'}`}>
                {!isOwn && showAvatar && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 text-left">{senderName}</p>
                )}
                <div
                    className={`px-4 py-2.5 rounded-2xl ${
                        isOwn
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-700'
                    }`}
                >
                    {message.type === 'voice' && message.attachments?.[0] && (
                        <VoiceMessage
                            audioUrl={message.attachments[0].url}
                            duration={message.attachments[0].duration}
                        />
                    )}

                    {(message.type === 'file' || message.type === 'image') && message.attachments?.[0] && (
                        <FileAttachment
                            attachment={message.attachments[0]}
                            isOwn={isOwn}
                        />
                    )}

                    {message.type === 'text' && (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                </div>

                <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-start' : 'justify-end'}`}>
                    <span className="text-[10px] text-gray-400">
                        {formatTime(message.timestamp)}
                    </span>
                    {isOwn && (
                        <span className="text-[10px]">
                            {message.status === 'read' ? (
                                <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
                                </svg>
                            ) : message.status === 'delivered' ? (
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41z"/>
                                </svg>
                            ) : (
                                <svg className="w-3.5 h-3.5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                                </svg>
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// مكون قائمة المحادثات
function ConversationList({ conversations, activeId, onSelect, employees, onNewChat, darkMode }) {
    const [searchQuery, setSearchQuery] = useState('');
    const user = useUser();

    const getOtherParticipant = (conv) => {
        const otherId = conv.participants.find(p => p !== user.id);
        return employees.find(e => e.id === otherId);
    };

    const filteredConversations = searchQuery
        ? conversations.filter(conv => {
            if (conv.type === 'group') return conv.name?.includes(searchQuery);
            const other = getOtherParticipant(conv);
            return other?.name?.includes(searchQuery);
        })
        : conversations;

    const formatTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'أمس';
        } else if (diffDays < 7) {
            return d.toLocaleDateString('ar-SA', { weekday: 'short' });
        } else {
            return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
        }
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '؟';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'away': return 'bg-yellow-500';
            case 'busy': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-white dark:bg-gray-900'}`}>
            {/* شريط البحث + زر محادثة جديدة */}
            <div className={`p-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="البحث في المحادثات..."
                            className={`w-full px-4 py-2 pr-10 rounded-xl border text-sm ${
                                darkMode
                                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400`}
                        />
                        <svg
                            className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                                darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button
                        onClick={onNewChat}
                        className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shrink-0"
                        title="محادثة جديدة"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            لا توجد محادثات
                        </p>
                        <button
                            onClick={onNewChat}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                        >
                            بدء محادثة جديدة
                        </button>
                    </div>
                ) : (
                    filteredConversations.map(conv => {
                        const other = conv.type === 'private' ? getOtherParticipant(conv) : null;
                        const displayName = conv.type === 'group' ? conv.name : other?.name;
                        const isActive = conv.id === activeId;

                        return (
                            <button
                                key={conv.id}
                                onClick={() => onSelect(conv.id)}
                                className={`w-full p-3 flex items-center gap-3 transition-colors ${
                                    isActive
                                        ? darkMode
                                            ? 'bg-gray-800'
                                            : 'bg-blue-50 dark:bg-blue-900/20'
                                        : darkMode
                                            ? 'hover:bg-gray-800/50'
                                            : 'hover:bg-gray-50'
                                }`}
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                        {conv.type === 'group' ? (
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        ) : (
                                            getInitials(displayName)
                                        )}
                                    </div>
                                    {other?.status && (
                                        <span className={`absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full border-2 ${
                                            darkMode ? 'border-gray-900' : 'border-white'
                                        } ${getStatusColor(other.status)}`}></span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 text-right">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-medium truncate ${
                                            darkMode ? 'text-white' : 'text-gray-900 dark:text-white'
                                        }`}>
                                            {displayName}
                                        </span>
                                        <span className={`text-xs shrink-0 mr-2 ${
                                            darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'
                                        }`}>
                                            {formatTime(conv.lastMessageTime)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm truncate ${
                                            darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                            {conv.lastMessage}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <span className="shrink-0 mr-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// مكون نافذة المحادثة - مُعدّل للوحة الجانبية
function ChatWindow({ conversationId, onBack, darkMode }) {
    const { messages, sendMessage, sendVoiceMessage, sendFile, loadMessages, getEmployee, conversations } = useChat();
    const user = useUser();
    const [inputValue, setInputValue] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const conversation = conversations.find(c => c.id === conversationId);
    const conversationMessages = messages[conversationId] || [];

    const otherParticipantId = conversation?.participants?.find(p => p !== user.id);
    const otherParticipant = otherParticipantId ? getEmployee(otherParticipantId) : null;

    useEffect(() => {
        if (conversationId) {
            setIsLoading(true);
            loadMessages(conversationId).finally(() => setIsLoading(false));
        }
    }, [conversationId, loadMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversationMessages]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        sendMessage(conversationId, inputValue);
        setInputValue('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleVoiceComplete = (blob, duration) => {
        sendVoiceMessage(conversationId, blob, duration);
        setIsRecording(false);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            sendFile(conversationId, file);
        }
        e.target.value = '';
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '؟';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'away': return 'bg-yellow-500';
            case 'busy': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'online': return 'متصل الآن';
            case 'away': return 'بعيد';
            case 'busy': return 'مشغول';
            default: return 'غير متصل';
        }
    };

    if (!conversation) return null;

    return (
        <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-950' : 'bg-gray-50 dark:bg-gray-800'}`}>
            {/* شريط معلومات المحادثة */}
            <div className={`px-4 py-3 border-b flex items-center gap-3 shrink-0 ${
                darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white/80 border-gray-200 dark:border-gray-700'
            }`}>
                <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {conversation.type === 'group' ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        ) : (
                            getInitials(otherParticipant?.name)
                        )}
                    </div>
                    {otherParticipant?.status && (
                        <span className={`absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full border-2 ${
                            darkMode ? 'border-gray-900' : 'border-white'
                        } ${getStatusColor(otherParticipant.status)}`}></span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {conversation.type === 'group' ? conversation.name : otherParticipant?.name}
                    </h3>
                    <p className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {conversation.type === 'group'
                            ? `${conversation.participants.length} أعضاء`
                            : otherParticipant?.status ? getStatusText(otherParticipant.status) : ''
                        }
                    </p>
                </div>

                <button className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600 dark:text-gray-300'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                ) : conversationMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            ابدأ المحادثة مع {otherParticipant?.name || 'الفريق'}
                        </p>
                    </div>
                ) : (
                    <>
                        {conversationMessages.map((msg, index) => {
                            const isOwn = msg.senderId === user.id;
                            const sender = getEmployee(msg.senderId);
                            const showAvatar = index === 0 || conversationMessages[index - 1]?.senderId !== msg.senderId;

                            return (
                                <Message
                                    key={msg.id}
                                    message={msg}
                                    isOwn={isOwn}
                                    senderName={sender?.name}
                                    showAvatar={showAvatar}
                                />
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className={`p-4 border-t ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                {isRecording ? (
                    <VoiceRecorder
                        onRecordComplete={handleVoiceComplete}
                        onCancel={() => setIsRecording(false)}
                    />
                ) : (
                    <div className={`flex items-end gap-2 p-2 rounded-2xl border ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}>
                        {/* Attachment Button */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileSelect}
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={`p-2 rounded-xl transition-colors ${
                                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </button>

                        {/* Text Input */}
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="اكتب رسالتك..."
                            rows={1}
                            className={`flex-1 resize-none px-3 py-2 bg-transparent outline-none text-sm ${
                                darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'
                            }`}
                            style={{ maxHeight: '120px' }}
                        />

                        {/* Voice Button */}
                        <button
                            onClick={() => setIsRecording(true)}
                            className={`p-2 rounded-xl transition-colors ${
                                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </button>

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim()}
                            className={`p-2 rounded-xl transition-all ${
                                inputValue.trim()
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
                )}
            </div>
        </div>
    );
}

// مكون اختيار موظف للمحادثة الجديدة
function NewChatDialog({ isOpen, onClose, onSelect, darkMode }) {
    const { employees, searchEmployees } = useChat();
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState(employees);

    useEffect(() => {
        setFilteredEmployees(searchEmployees(searchQuery));
    }, [searchQuery, searchEmployees]);

    if (!isOpen) return null;

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '؟';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'away': return 'bg-yellow-500';
            case 'busy': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className={`w-full max-w-md mx-4 rounded-2xl shadow-xl overflow-hidden ${
                    darkMode ? 'bg-gray-900' : 'bg-white dark:bg-gray-900'
                }`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            محادثة جديدة
                        </h3>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="البحث عن موظف..."
                        className={`w-full px-4 py-2.5 rounded-xl border ${
                            darkMode
                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400`}
                        autoFocus
                    />
                </div>

                {/* Employee List */}
                <div className="max-h-96 overflow-y-auto">
                    {filteredEmployees.map(employee => (
                        <button
                            key={employee.id}
                            onClick={() => {
                                onSelect(employee.id);
                                onClose();
                            }}
                            className={`w-full p-4 flex items-center gap-3 transition-colors ${
                                darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                            }`}
                        >
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                    {getInitials(employee.name)}
                                </div>
                                <span className={`absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full border-2 ${
                                    darkMode ? 'border-gray-900' : 'border-white'
                                } ${getStatusColor(employee.status)}`}></span>
                            </div>
                            <div className="flex-1 text-right">
                                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {employee.name}
                                </p>
                                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {employee.role} - {employee.department}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// المكون الرئيسي للشات الداخلي - لوحة جانبية يسرى
export default function InternalChat({ isOpen, onClose, darkMode = false }) {
    const { conversations, employees, setActiveConversation, activeConversation, startConversation, unreadCount } = useChat();
    const [showNewChat, setShowNewChat] = useState(false);
    const [view, setView] = useState('list'); // 'list' | 'chat'

    const handleSelectConversation = (conversationId) => {
        setActiveConversation(conversationId);
        setView('chat');
    };

    const handleNewChat = (employeeId) => {
        const convId = startConversation(employeeId);
        setView('chat');
    };

    const handleBack = () => {
        setView('list');
        setActiveConversation(null);
    };

    const handleClose = () => {
        onClose();
        // إعادة العرض لقائمة المحادثات عند الإغلاق
        setTimeout(() => {
            setView('list');
            setActiveConversation(null);
        }, 300);
    };

    return (
        <>
            {/* Backdrop - خلفية شفافة عند الفتح على الجوال */}
            <div
                className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={handleClose}
            />

            {/* لوحة الشات الجانبية */}
            <div
                className={`fixed top-0 left-0 h-screen w-full sm:w-[420px] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
                    darkMode ? 'bg-gray-900' : 'bg-white dark:bg-gray-900'
                } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
                dir="rtl"
            >
                {/* Header */}
                <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
                    darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                }`}>
                    <div className="flex items-center gap-3">
                        {view === 'chat' && (
                            <button
                                onClick={handleBack}
                                className={`p-2 rounded-xl transition-colors ${
                                    darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                الشات الداخلي
                            </h3>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {unreadCount > 0 ? `${unreadCount} رسائل جديدة` : 'تواصل مع زملائك'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className={`p-2 rounded-xl transition-colors ${
                            darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* المحتوى - قائمة أو محادثة */}
                <div className="flex-1 overflow-hidden">
                    {view === 'list' ? (
                        <ConversationList
                            conversations={conversations}
                            activeId={activeConversation}
                            onSelect={handleSelectConversation}
                            employees={employees}
                            onNewChat={() => setShowNewChat(true)}
                            darkMode={darkMode}
                        />
                    ) : (
                        <ChatWindow
                            conversationId={activeConversation}
                            onBack={handleBack}
                            darkMode={darkMode}
                        />
                    )}
                </div>

                {/* New Chat Dialog */}
                <NewChatDialog
                    isOpen={showNewChat}
                    onClose={() => setShowNewChat(false)}
                    onSelect={handleNewChat}
                    darkMode={darkMode}
                />
            </div>
        </>
    );
}

// عرض لوحة الشات (بالبكسل) - يُستخدم لحساب الإزاحة
export const CHAT_PANEL_WIDTH = 420;

// زر فتح الشات
export function InternalChatButton({ onClick, darkMode = false, unreadCount = 0 }) {
    return (
        <button
            onClick={onClick}
            className="relative p-3 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            title="الشات الداخلي"
        >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    );
}
