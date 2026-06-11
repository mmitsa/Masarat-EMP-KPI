import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSystemNotifications, SYSTEMS, PRIORITY } from '../context/SystemNotificationContext';

const SYSTEM_ICONS = {
    [SYSTEMS.CHAT]: '💬',
    [SYSTEMS.HR]: '👥',
    [SYSTEMS.WAREHOUSE]: '📦',
    [SYSTEMS.MOVEMENT]: '🚗',
    [SYSTEMS.ARCHIVING]: '📂',
    [SYSTEMS.SADAD]: '💳',
    [SYSTEMS.EPM]: '🎯',
    [SYSTEMS.SYSTEM]: '⚙️',
    [SYSTEMS.APPROVAL]: '✅',
    [SYSTEMS.TRASH]: '🗑️',
};

const SYSTEM_NAMES = {
    [SYSTEMS.CHAT]: 'المحادثات',
    [SYSTEMS.HR]: 'الموارد البشرية',
    [SYSTEMS.WAREHOUSE]: 'المستودعات',
    [SYSTEMS.MOVEMENT]: 'الحركة',
    [SYSTEMS.ARCHIVING]: 'الأرشفة',
    [SYSTEMS.SADAD]: 'سداد',
    [SYSTEMS.EPM]: 'الأداء',
    [SYSTEMS.SYSTEM]: 'النظام',
    [SYSTEMS.APPROVAL]: 'الاعتمادات',
    [SYSTEMS.TRASH]: 'المهملات',
};

const PRIORITY_COLORS = {
    [PRIORITY.LOW]: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300',
    [PRIORITY.MEDIUM]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    [PRIORITY.HIGH]: 'bg-orange-100 text-orange-600',
    [PRIORITY.URGENT]: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

export default function NotificationCenter({ darkMode = false }) {
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        getUnreadBySystem,
    } = useSystemNotifications();

    const [showDropdown, setShowDropdown] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
    };

    // Filter notifications
    const filteredNotifications = activeFilter === 'all'
        ? notifications
        : notifications.filter(n => n.system === activeFilter);

    // Get recent notifications (last 10)
    const recentNotifications = filteredNotifications.slice(0, 10);

    // Systems with unread counts
    const systemsWithUnread = Object.values(SYSTEMS).map(system => ({
        system,
        count: getUnreadBySystem(system),
    })).filter(s => s.count > 0);

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        if (notification.actionUrl) {
            setShowDropdown(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`p-2 rounded-xl transition-colors relative
                    ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400'}`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div className={`absolute left-0 mt-2 w-96 rounded-xl shadow-2xl border z-50
                    ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>

                    {/* Header */}
                    <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🔔</span>
                                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    الإشعارات
                                </h3>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                                        {unreadCount} جديد
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-xs font-medium"
                                    >
                                        قراءة الكل
                                    </button>
                                )}
                                <Link
                                    href="/notifications"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-xs font-medium"
                                    onClick={() => setShowDropdown(false)}
                                >
                                    عرض الكل
                                </Link>
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                            <button
                                onClick={() => setActiveFilter('all')}
                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition
                                    ${activeFilter === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : darkMode
                                            ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                    }`}
                            >
                                الكل
                            </button>
                            {systemsWithUnread.map(({ system, count }) => (
                                <button
                                    key={system}
                                    onClick={() => setActiveFilter(system)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition flex items-center gap-1
                                        ${activeFilter === system
                                            ? 'bg-blue-600 text-white'
                                            : darkMode
                                                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                        }`}
                                >
                                    <span>{SYSTEM_ICONS[system]}</span>
                                    <span>{SYSTEM_NAMES[system]}</span>
                                    {count > 0 && (
                                        <span className={`px-1.5 rounded-full text-[10px] ${
                                            activeFilter === system
                                                ? 'bg-white/20 text-white'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                        }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {recentNotifications.length === 0 ? (
                            <div className={`px-4 py-12 text-center ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                                <span className="text-4xl block mb-3">🔔</span>
                                <p className="font-medium">لا توجد إشعارات</p>
                                <p className="text-xs mt-1">ستظهر هنا إشعاراتك الجديدة</p>
                            </div>
                        ) : (
                            recentNotifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    darkMode={darkMode}
                                    onClick={() => handleNotificationClick(notification)}
                                    onDelete={() => deleteNotification(notification.id)}
                                    formatTime={formatTime}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {recentNotifications.length > 0 && (
                        <div className={`px-4 py-3 border-t ${darkMode ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800'}`}>
                            <div className="flex items-center justify-between text-xs">
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}>
                                    {notifications.length} إشعار
                                </span>
                                <Link
                                    href="/notifications/settings"
                                    className={`flex items-center gap-1 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                                    onClick={() => setShowDropdown(false)}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    إعدادات الإشعارات
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Notification Item Component
function NotificationItem({ notification, darkMode, onClick, onDelete, formatTime }) {
    const [showActions, setShowActions] = useState(false);

    const content = (
        <div
            className={`px-4 py-3 border-b last:border-b-0 transition-colors cursor-pointer relative
                ${!notification.read ? (darkMode ? 'bg-blue-900/10' : 'bg-blue-50/50') : ''}
                ${darkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-50 hover:bg-gray-50'}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg
                    ${darkMode ? 'bg-gray-800' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
                    {notification.sender?.avatar ? (
                        <img
                            src={notification.sender.avatar}
                            alt={notification.sender.name}
                            className="w-full h-full rounded-xl object-cover"
                        />
                    ) : (
                        SYSTEM_ICONS[notification.system] || '🔔'
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[notification.priority]}`}>
                            {SYSTEM_NAMES[notification.system]}
                        </span>
                        <span className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                            {formatTime(notification.timestamp)}
                        </span>
                    </div>
                    <h4 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {notification.title}
                    </h4>
                    <p className={`text-xs mt-1 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {notification.message}
                    </p>
                </div>

                {/* Actions */}
                {showActions && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className={`p-1 rounded-lg transition-colors ${
                            darkMode ? 'hover:bg-gray-700 text-gray-500 dark:text-gray-400' : 'hover:bg-gray-200 text-gray-400'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );

    // Only render Link if actionUrl is a valid non-empty string
    if (notification.actionUrl && typeof notification.actionUrl === 'string' && notification.actionUrl.trim() !== '') {
        return (
            <Link href={notification.actionUrl}>
                {content}
            </Link>
        );
    }

    return content;
}
