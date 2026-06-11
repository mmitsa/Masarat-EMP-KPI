import React, { useState, useEffect } from 'react';

import { fmtDate } from '../../../utils/hijriDate';

const emptyAnnouncements = { thanks: [], circulars: [], decisions: [], events: [] };

const tabs = [
    { id: 'all', label: 'الكل', icon: '📋' },
    { id: 'thanks', label: 'الشكر والتقدير', icon: '🏆' },
    { id: 'circulars', label: 'التعميمات', icon: '📢' },
    { id: 'decisions', label: 'القرارات', icon: '⚖️' },
    { id: 'events', label: 'الفعاليات', icon: '📅' },
];

export default function AnnouncementsBoard({ data = emptyAnnouncements, darkMode = false }) {
    const [activeTab, setActiveTab] = useState('all');
    const [expandedItem, setExpandedItem] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div>
            {/* Tabs */}
            <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeTab === tab.id
                            ? 'bg-blue-600 text-white'
                            : darkMode
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {/* Thanks */}
                {(activeTab === 'all' || activeTab === 'thanks') && data.thanks?.map(item => (
                    <ThanksCard key={`thanks-${item.id}`} item={item} darkMode={darkMode} />
                ))}

                {/* Circulars */}
                {(activeTab === 'all' || activeTab === 'circulars') && data.circulars?.map(item => (
                    <CircularCard key={`circular-${item.id}`} item={item} darkMode={darkMode} />
                ))}

                {/* Decisions */}
                {(activeTab === 'all' || activeTab === 'decisions') && data.decisions?.map(item => (
                    <DecisionCard key={`decision-${item.id}`} item={item} darkMode={darkMode} />
                ))}

                {/* Events */}
                {(activeTab === 'all' || activeTab === 'events') && data.events?.map(item => (
                    <EventCard key={`event-${item.id}`} item={item} darkMode={darkMode} mounted={mounted} />
                ))}

                {/* Empty state */}
                {!data.thanks?.length && !data.circulars?.length && !data.decisions?.length && !data.events?.length && (
                    <div className={`text-center py-10 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        <p>لا توجد إعلانات حالياً</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: ${darkMode ? '#374151' : '#f3f4f6'};
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${darkMode ? '#4b5563' : '#d1d5db'};
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}

// بطاقة الشكر
function ThanksCard({ item, darkMode }) {
    return (
        <div className={`p-4 rounded-xl border-r-4 border-emerald-500 ${darkMode ? 'bg-emerald-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                    <span className="text-xl">🏆</span>
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            {item.title}
                        </h4>
                        <span className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                            {fmtDate(item.date)}
                        </span>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                        إلى: <span className="font-medium">{item.recipient}</span>
                    </p>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                        {item.message}
                    </p>
                    <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        من: {item.from}
                    </p>
                </div>
            </div>
        </div>
    );
}

// بطاقة التعميم
function CircularCard({ item, darkMode }) {
    const priorityColors = {
        high: darkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700 dark:text-red-300',
        medium: darkMode ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-700',
        low: darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300',
    };

    return (
        <div className={`p-4 rounded-xl border-r-4 border-blue-500 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                    <span className="text-xl">📢</span>
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                                تعميم #{item.number}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[item.priority]}`}>
                                {item.priority === 'high' ? 'هام' : item.priority === 'medium' ? 'متوسط' : 'عادي'}
                            </span>
                        </div>
                        <span className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                            {fmtDate(item.date)}
                        </span>
                    </div>
                    <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {item.title}
                    </h4>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {item.department}
                    </p>
                </div>
            </div>
        </div>
    );
}

// بطاقة القرار
function DecisionCard({ item, darkMode }) {
    return (
        <div className={`p-4 rounded-xl border-r-4 border-amber-500 ${darkMode ? 'bg-amber-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-amber-900/50' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                    <span className="text-xl">⚖️</span>
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'}`}>
                            قرار #{item.number}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${item.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                                {fmtDate(item.date)}
                            </span>
                        </div>
                    </div>
                    <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {item.title}
                    </h4>
                </div>
            </div>
        </div>
    );
}

// بطاقة الفعالية
function EventCard({ item, darkMode, mounted = false }) {
    const eventDate = new Date(item.date);
    // Only calculate relative time on client to avoid hydration mismatch
    const now = mounted ? new Date() : eventDate;
    const isUpcoming = eventDate > now;
    const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

    const typeIcons = {
        meeting: '👥',
        workshop: '🎓',
        ceremony: '🎉',
        conference: '🎤',
    };

    return (
        <div className={`p-4 rounded-xl border-r-4 border-purple-500 ${darkMode ? 'bg-purple-900/20' : 'bg-purple-50 dark:bg-purple-900/20'}`}>
            <div className="flex items-start gap-3">
                <div className={`text-center min-w-[50px] p-2 rounded-xl ${darkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-700 dark:text-purple-300'}`}>
                        {eventDate.getDate()}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                        {fmtDate(eventDate)}
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{typeIcons[item.type] || '📅'}</span>
                        <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            {item.title}
                        </h4>
                    </div>
                    <div className={`flex items-center gap-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {item.time}
                        </span>
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {item.location}
                        </span>
                    </div>
                    {mounted && isUpcoming && daysUntil <= 7 && (
                        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                            }`}>
                            {daysUntil === 0 ? 'اليوم' : daysUntil === 1 ? 'غداً' : `بعد ${daysUntil} أيام`}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// مكون مصغر للشريط الجانبي
export function QuickAnnouncements({ data = emptyAnnouncements, darkMode = false }) {
    const allItems = [
        ...data.thanks.map(i => ({ ...i, type: 'thanks' })),
        ...data.circulars.map(i => ({ ...i, type: 'circular' })),
        ...data.decisions.map(i => ({ ...i, type: 'decision' })),
        ...data.events.map(i => ({ ...i, type: 'event' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);

    const icons = {
        thanks: '🏆',
        circular: '📢',
        decision: '⚖️',
        event: '📅',
    };

    return (
        <div className="space-y-2">
            {allItems.map((item, index) => (
                <div
                    key={index}
                    className={`p-3 rounded-xl flex items-center gap-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100'
                        } transition-colors cursor-pointer`}
                >
                    <span className="text-lg">{icons[item.type]}</span>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            {item.title}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {fmtDate(item.date)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
