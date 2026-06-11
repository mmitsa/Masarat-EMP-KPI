/**
 * Unified Notification Center - مركز الإشعارات الموحد
 * يدمج إشعارات الموافقات وإشعارات النظام في مكون واحد
 *
 * @version 1.0.0
 * @date 2026-02-03
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useSystemNotifications, SYSTEMS, PRIORITY, NOTIFICATION_TYPES } from '../../context/SystemNotificationContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';

// ========== Constants ==========
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
    [SYSTEMS.APPROVAL]: 'الموافقات',
    [SYSTEMS.TRASH]: 'المهملات',
};

const PRIORITY_COLORS = {
    [PRIORITY.LOW]: { bg: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-600 dark:text-gray-300', dark: 'bg-gray-800 text-gray-400' },
    [PRIORITY.MEDIUM]: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', dark: 'bg-blue-900/30 text-blue-400' },
    [PRIORITY.HIGH]: { bg: 'bg-orange-100', text: 'text-orange-600', dark: 'bg-orange-900/30 text-orange-400' },
    [PRIORITY.URGENT]: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', dark: 'bg-red-900/30 text-red-400' },
};

const TABS = [
    { id: 'all', label: 'الكل', icon: '🔔' },
    { id: 'approvals', label: 'الموافقات', icon: '✅' },
    { id: 'system', label: 'النظام', icon: '⚙️' },
];

// ========== Helper Functions ==========
const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} د`;
    if (diffHours < 24) return `منذ ${diffHours} س`;
    if (diffDays < 7) return `منذ ${diffDays} ي`;
    return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
};

// ========== Main Component ==========
export default function UnifiedNotificationCenter({ onOpenChat }) {
    const router = useRouter();
    const { data: session } = useSession();
    const { isDarkMode } = useTheme();
    const darkMode = isDarkMode ?? false;

    // System Notifications from context
    const {
        notifications: systemNotifications,
        unreadCount: systemUnreadCount,
        markAsRead: markSystemAsRead,
        markAllAsRead: markAllSystemAsRead,
        deleteNotification: deleteSystemNotification,
        getUnreadBySystem,
    } = useSystemNotifications();

    // Approval Notifications state
    const [approvalNotifications, setApprovalNotifications] = useState([]);
    const [approvalUnreadCount, setApprovalUnreadCount] = useState(0);

    // UI State
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [activeSystemFilter, setActiveSystemFilter] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);

    const dropdownRef = useRef(null);
    const userId = session?.user?.id || 1;

    // Total unread count
    const totalUnreadCount = systemUnreadCount + approvalUnreadCount;

    // ========== Load Approval Notifications ==========
    const loadApprovalNotifications = useCallback(async () => {
        try {
            const result = await api.notifications?.getUserNotifications?.(userId, false, 1, 10).catch(() => null);
            if (result?.value) {
                setApprovalNotifications(result.value);
                setApprovalUnreadCount(result.value.filter(n => !n.IsRead).length);
            } else {
                // API unavailable — show empty state
                setApprovalNotifications([]);
                setApprovalUnreadCount(0);
            }
        } catch (error) {
            console.warn('Error loading approval notifications:', error);
            setApprovalNotifications([]);
            setApprovalUnreadCount(0);
        }
    }, [userId]);

    // Load approval notifications on mount and interval
    useEffect(() => {
        loadApprovalNotifications();
        const interval = setInterval(loadApprovalNotifications, 30000);
        return () => clearInterval(interval);
    }, [loadApprovalNotifications]);

    // Load when dropdown opens
    useEffect(() => {
        if (showDropdown) {
            loadApprovalNotifications();
        }
    }, [showDropdown, loadApprovalNotifications]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
                setShowActionModal(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ========== Combined Notifications ==========
    const getCombinedNotifications = () => {
        // Convert approval notifications to unified format
        const normalizedApprovals = approvalNotifications.map(n => ({
            id: `approval_${n.Id}`,
            originalId: n.Id,
            type: 'approval',
            system: SYSTEMS.APPROVAL,
            priority: n.Priority === 'High' ? PRIORITY.HIGH : PRIORITY.MEDIUM,
            title: n.TitleAr,
            message: n.MessageAr,
            timestamp: new Date(n.CreatedAt),
            read: n.IsRead,
            actionUrl: n.ActionUrl,
            entityType: n.EntityType,
            entityId: n.EntityId,
            notificationType: n.NotificationType,
        }));

        // Combine with system notifications
        const allNotifications = [...normalizedApprovals, ...systemNotifications];

        // Sort by timestamp (newest first)
        allNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return allNotifications;
    };

    // ========== Filter Notifications ==========
    const getFilteredNotifications = () => {
        const combined = getCombinedNotifications();

        if (activeTab === 'all') {
            if (activeSystemFilter) {
                return combined.filter(n => n.system === activeSystemFilter);
            }
            return combined;
        }

        if (activeTab === 'approvals') {
            return combined.filter(n => n.type === 'approval');
        }

        if (activeTab === 'system') {
            return combined.filter(n => n.type !== 'approval');
        }

        return combined;
    };

    const filteredNotifications = getFilteredNotifications().slice(0, 15);

    // ========== Actions ==========
    const handleNotificationClick = (notification) => {
        // Mark as read
        if (!notification.read) {
            if (notification.type === 'approval') {
                handleMarkApprovalAsRead([notification.originalId]);
            } else {
                markSystemAsRead(notification.id);
            }
        }

        // Check if it's an approval that needs quick action
        if (notification.type === 'approval' && notification.notificationType === 'Approval' && !notification.read) {
            setSelectedNotification(notification);
            setShowActionModal(true);
            return;
        }

        // إشعارات المحادثات → فتح لوحة الشات الجانبية
        if (notification.system === SYSTEMS.CHAT && onOpenChat) {
            setShowDropdown(false);
            onOpenChat();
            return;
        }

        // Navigate to action URL
        if (notification.actionUrl) {
            setShowDropdown(false);
            router.push(notification.actionUrl);
        }
    };

    const handleMarkApprovalAsRead = async (ids) => {
        try {
            await api.notifications?.markAsRead?.(ids).catch(() => null);
            setApprovalNotifications(prev =>
                prev.map(n => ids.includes(n.Id) ? { ...n, IsRead: true } : n)
            );
            setApprovalUnreadCount(prev => Math.max(0, prev - ids.length));
        } catch (error) {
            console.warn('Error marking approval as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        // Mark all system notifications
        markAllSystemAsRead();

        // Mark all approval notifications
        try {
            await api.notifications?.markAllAsRead?.(userId).catch(() => null);
            setApprovalNotifications(prev => prev.map(n => ({ ...n, IsRead: true })));
            setApprovalUnreadCount(0);
        } catch (error) {
            console.warn('Error marking all as read:', error);
        }
    };

    const handleDeleteNotification = async (notification) => {
        if (notification.type === 'approval') {
            try {
                await api.notifications?.delete?.(notification.originalId).catch(() => null);
                setApprovalNotifications(prev => prev.filter(n => n.Id !== notification.originalId));
            } catch (error) {
                console.warn('Error deleting notification:', error);
            }
        } else {
            deleteSystemNotification(notification.id);
        }
    };

    // Navigate to action page from modal
    const handleGoToAction = () => {
        if (selectedNotification?.actionUrl) {
            setShowDropdown(false);
            setShowActionModal(false);
            router.push(selectedNotification.actionUrl);
        }
    };

    // ========== Systems with unread ==========
    const systemsWithUnread = Object.values(SYSTEMS)
        .filter(s => s !== SYSTEMS.APPROVAL)
        .map(system => ({
            system,
            count: getUnreadBySystem(system),
        }))
        .filter(s => s.count > 0);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`
                    p-2.5 rounded-xl transition-all duration-200 relative
                    ${darkMode
                        ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                        : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }
                `}
                aria-label="الإشعارات"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {totalUnreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 animate-pulse">
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div
                    className={`
                        absolute left-0 mt-2 w-[420px] rounded-2xl shadow-2xl border z-50
                        ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}
                    `}
                >
                    {/* Header */}
                    <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🔔</span>
                                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    الإشعارات
                                </h3>
                                {totalUnreadCount > 0 && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${darkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                        {totalUnreadCount} جديد
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {totalUnreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
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

                        {/* Main Tabs */}
                        <div className="flex gap-1.5">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setActiveSystemFilter(null);
                                    }}
                                    className={`
                                        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                        ${activeTab === tab.id
                                            ? 'bg-blue-600 text-white'
                                            : darkMode
                                                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                        }
                                    `}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                    {tab.id === 'approvals' && approvalUnreadCount > 0 && (
                                        <span className={`px-1.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white/20' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                            {approvalUnreadCount}
                                        </span>
                                    )}
                                    {tab.id === 'system' && systemUnreadCount > 0 && (
                                        <span className={`px-1.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white/20' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                            {systemUnreadCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* System Filter (when in 'all' or 'system' tab) */}
                        {(activeTab === 'all' || activeTab === 'system') && systemsWithUnread.length > 0 && (
                            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                                {systemsWithUnread.map(({ system, count }) => (
                                    <button
                                        key={system}
                                        onClick={() => setActiveSystemFilter(activeSystemFilter === system ? null : system)}
                                        className={`
                                            flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition
                                            ${activeSystemFilter === system
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                : darkMode
                                                    ? 'bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-700'
                                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100'
                                            }
                                        `}
                                    >
                                        <span>{SYSTEM_ICONS[system]}</span>
                                        <span>{count}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {filteredNotifications.length === 0 ? (
                            <div className={`px-4 py-12 text-center ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                                <span className="text-4xl block mb-3">🔔</span>
                                <p className="font-medium">لا توجد إشعارات</p>
                                <p className="text-xs mt-1">ستظهر هنا إشعاراتك الجديدة</p>
                            </div>
                        ) : (
                            filteredNotifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    darkMode={darkMode}
                                    onClick={() => handleNotificationClick(notification)}
                                    onDelete={() => handleDeleteNotification(notification)}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer with Quick Links */}
                    <div className={`px-4 py-3 border-t ${darkMode ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex gap-3">
                                {onOpenChat && (
                                    <button
                                        className={`flex items-center gap-1.5 text-xs font-medium ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}
                                        onClick={() => { setShowDropdown(false); onOpenChat(); }}
                                    >
                                        <span>💬</span>
                                        <span>المحادثات</span>
                                    </button>
                                )}
                                <Link
                                    href="/approvals"
                                    className={`flex items-center gap-1.5 text-xs font-medium ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}
                                    onClick={() => setShowDropdown(false)}
                                >
                                    <span>✅</span>
                                    <span>مهام الموافقات</span>
                                </Link>
                                <Link
                                    href="/workflows"
                                    className={`flex items-center gap-1.5 text-xs font-medium ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}
                                    onClick={() => setShowDropdown(false)}
                                >
                                    <span>📋</span>
                                    <span>متابعة طلباتي</span>
                                </Link>
                            </div>
                            <Link
                                href="/notifications/settings"
                                className={`flex items-center gap-1 text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                                onClick={() => setShowDropdown(false)}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Action Modal */}
            {showActionModal && selectedNotification && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowActionModal(false)} />
                    <div className={`
                        relative w-full max-w-md rounded-2xl shadow-2xl p-6
                        ${darkMode ? 'bg-gray-900' : 'bg-white dark:bg-gray-900'}
                    `}>
                        {/* Icon */}
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>

                        {/* Content */}
                        <h3 className={`text-lg font-bold text-center mb-2 ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            {selectedNotification.title}
                        </h3>
                        <p className={`text-sm text-center mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                            {selectedNotification.message}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowActionModal(false)}
                                className={`
                                    flex-1 py-3 rounded-xl font-medium transition-colors
                                    ${darkMode
                                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-200'
                                    }
                                `}
                            >
                                إغلاق
                            </button>
                            <button
                                onClick={handleGoToAction}
                                className="flex-1 py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <span>عرض التفاصيل</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ========== Notification Item Component ==========
function NotificationItem({ notification, darkMode, onClick, onDelete }) {
    const [showActions, setShowActions] = useState(false);

    const getPriorityColors = () => {
        const colors = PRIORITY_COLORS[notification.priority] || PRIORITY_COLORS[PRIORITY.MEDIUM];
        return darkMode ? colors.dark : `${colors.bg} ${colors.text}`;
    };

    return (
        <div
            className={`
                px-4 py-3 border-b last:border-b-0 transition-colors cursor-pointer relative
                ${!notification.read
                    ? darkMode ? 'bg-blue-900/10' : 'bg-blue-50/50'
                    : ''
                }
                ${darkMode
                    ? 'border-gray-800 hover:bg-gray-800/50'
                    : 'border-gray-50 hover:bg-gray-50'
                }
            `}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                    ${darkMode ? 'bg-gray-800' : 'bg-gray-100 dark:bg-gray-700/50'}
                `}>
                    {notification.type === 'approval' ? (
                        notification.notificationType === 'Approval' ? '✅' :
                        notification.notificationType === 'Alert' ? '⚠️' :
                        notification.notificationType === 'Task' ? '📋' : '🔔'
                    ) : (
                        SYSTEM_ICONS[notification.system] || '🔔'
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${getPriorityColors()}`}>
                            {notification.type === 'approval' ? 'موافقة' : SYSTEM_NAMES[notification.system]}
                        </span>
                        <span className={`text-[10px] ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
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
                        className={`
                            p-1.5 rounded-lg transition-colors flex-shrink-0
                            ${darkMode
                                ? 'hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-300'
                                : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                            }
                        `}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

// ========== Mock Data (removed — all data now comes from the real API) ==========
// TODO: If needed in future, connect to GET /api/notifications/user-notifications
function _removedGetMockApprovalNotifications_unused() {
    const now = Date.now();
    return [
        {
            Id: 1,
            TitleAr: 'طلب موافقة: صرف مالي',
            MessageAr: 'لديك طلب صرف بمبلغ 125,000 ريال يحتاج موافقتك',
            NotificationType: 'Approval',
            EntityType: 'DisbursementRequest',
            EntityId: 101,
            ActionUrl: '/approvals',
            Priority: 'High',
            IsRead: false,
            CreatedAt: new Date(now - 30 * 60000).toISOString()
        },
        {
            Id: 2,
            TitleAr: 'طلب إجازة - أحمد محمد',
            MessageAr: 'طلب إجازة سنوية لمدة 5 أيام بانتظار موافقتك',
            NotificationType: 'Approval',
            EntityType: 'LeaveRequest',
            EntityId: 202,
            ActionUrl: '/approvals?type=leave',
            Priority: 'Normal',
            IsRead: false,
            CreatedAt: new Date(now - 2 * 3600000).toISOString()
        },
        {
            Id: 3,
            TitleAr: 'تذكير: أمر شراء متأخر',
            MessageAr: 'أمر الشراء رقم PO-2026-0145 متأخر منذ يومين',
            NotificationType: 'Alert',
            EntityType: 'PurchaseOrder',
            EntityId: 303,
            ActionUrl: '/approvals?type=po',
            Priority: 'High',
            IsRead: false,
            CreatedAt: new Date(now - 48 * 3600000).toISOString()
        },
        {
            Id: 4,
            TitleAr: 'مهمة جديدة مُعينة',
            MessageAr: 'تم تعيينك على مراجعة عقد الموردين الجديد',
            NotificationType: 'Task',
            EntityType: 'Contract',
            EntityId: 404,
            ActionUrl: '/projects',
            Priority: 'Normal',
            IsRead: true,
            CreatedAt: new Date(now - 72 * 3600000).toISOString()
        },
        {
            Id: 5,
            TitleAr: 'طلب نقل موظف',
            MessageAr: 'طلب نقل الموظف خالد العتيبي إلى قسم المبيعات',
            NotificationType: 'Approval',
            EntityType: 'TransferRequest',
            EntityId: 505,
            ActionUrl: '/approvals?type=transfer',
            Priority: 'Normal',
            IsRead: true,
            CreatedAt: new Date(now - 96 * 3600000).toISOString()
        },
    ];
}
