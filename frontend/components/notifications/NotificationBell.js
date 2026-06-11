import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import api from '../../lib/api';

import { fmtDate } from '../../utils/hijriDate';

/**
 * أيقونة الجرس
 */
const BellIcon = ({ hasNotifications }) => (
    <svg
        className={`w-6 h-6 transition-transform ${hasNotifications ? 'animate-bounce' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
    </svg>
);

/**
 * مكون إشعار واحد
 */
const NotificationItem = ({ notification, onRead, onDelete }) => {
    const router = useRouter();

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Approval':
                return (
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case 'Alert':
                return (
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            case 'Task':
                return (
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        if (days < 7) return `منذ ${days} يوم`;
        return fmtDate(date);
    };

    const handleClick = () => {
        if (!notification.IsRead) {
            onRead([notification.Id]);
        }
        if (notification.ActionUrl) {
            router.push(notification.ActionUrl);
        }
    };

    return (
        <div
            className={`flex gap-3 p-3 cursor-pointer transition-colors rounded-lg ${
                notification.IsRead ? 'bg-white dark:bg-gray-900' : 'bg-blue-50'
            } hover:bg-gray-50`}
            onClick={handleClick}
        >
            {getTypeIcon(notification.NotificationType)}
            <div className="flex-1 min-w-0">
                <p className={`text-sm ${notification.IsRead ? 'text-gray-700' : 'text-gray-900 dark:text-white font-medium'}`}>
                    {notification.TitleAr}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {notification.MessageAr}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    {formatTime(notification.CreatedAt)}
                </p>
            </div>
            {notification.Priority === 'High' && (
                <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2" />
            )}
        </div>
    );
};

/**
 * مكون جرس الإشعارات
 * يعرض عدد الإشعارات غير المقروءة وقائمة منسدلة بالإشعارات
 */
export default function NotificationBell() {
    const { data: session } = useSession();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const userId = session?.user?.id || 1;

    // إغلاق القائمة عند النقر خارجها
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // تحميل عدد الإشعارات غير المقروءة
    const loadUnreadCount = useCallback(async () => {
        try {
            const result = await api.notifications?.getUnreadCount?.(userId).catch(() => null);
            if (result) {
                setUnreadCount(result.unreadCount);
            } else {
                setUnreadCount(0);
            }
        } catch (error) {
            console.warn('Error loading unread count:', error);
            setUnreadCount(0);
        }
    }, [userId]);

    // تحميل الإشعارات
    const loadNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const result = await api.notifications?.getUserNotifications?.(userId, false, 1, 10).catch(() => null);
            if (result) {
                setNotifications(result.value || []);
                setUnreadCount(result.unreadCount || 0);
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.warn('Error loading notifications:', error);
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // تحميل العدد عند التحميل وكل 30 ثانية
    useEffect(() => {
        loadUnreadCount();
        const interval = setInterval(loadUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [loadUnreadCount]);

    // تحميل الإشعارات عند فتح القائمة
    useEffect(() => {
        if (isOpen) {
            loadNotifications();
        }
    }, [isOpen, loadNotifications]);

    // تحديد كمقروء
    const handleMarkAsRead = async (ids) => {
        try {
            await api.notifications?.markAsRead?.(ids).catch(() => null);
            setNotifications(prev =>
                prev.map(n => ids.includes(n.Id) ? { ...n, IsRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - ids.length));
        } catch (error) {
            console.warn('Error marking as read:', error);
        }
    };

    // تحديد الكل كمقروء
    const handleMarkAllAsRead = async () => {
        try {
            await api.notifications?.markAllAsRead?.(userId).catch(() => null);
            setNotifications(prev => prev.map(n => ({ ...n, IsRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.warn('Error marking all as read:', error);
        }
    };

    // حذف إشعار
    const handleDelete = async (id) => {
        try {
            await api.notifications?.delete?.(id).catch(() => null);
            setNotifications(prev => prev.filter(n => n.Id !== id));
        } catch (error) {
            console.warn('Error deleting notification:', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* زر الجرس */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="الإشعارات"
            >
                <BellIcon hasNotifications={unreadCount > 0} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* القائمة المنسدلة */}
            {isOpen && (
                <div className="absolute left-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    {/* الرأس */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                        <h3 className="font-bold text-gray-900 dark:text-white">الإشعارات</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800"
                            >
                                تحديد الكل كمقروء
                            </button>
                        )}
                    </div>

                    {/* قائمة الإشعارات */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <p>لا توجد إشعارات</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {notifications.map(notification => (
                                    <NotificationItem
                                        key={notification.Id}
                                        notification={notification}
                                        onRead={handleMarkAsRead}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* الروابط السفلية */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/approvals');
                            }}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800"
                        >
                            مهام الموافقات
                        </button>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/workflows');
                            }}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800"
                        >
                            متابعة طلباتي
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
