/**
 * Hook للإشعارات الخاصة بالاعتمادات
 * Approval Notifications Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { approvalWorkflowService, NOTIFICATION_TYPES } from '../lib/approvalWorkflowService';

/**
 * Hook لإدارة إشعارات الاعتمادات
 */
export function useApprovalNotifications() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const wsRef = useRef(null);
    const pollIntervalRef = useRef(null);

    // جلب الإشعارات
    const fetchNotifications = useCallback(async () => {
        try {
            // جلب من التخزين المحلي
            const stored = JSON.parse(localStorage.getItem('approvalNotifications') || '[]');

            // تصفية الإشعارات الخاصة بالمستخدم الحالي
            const userNotifications = stored.filter(n =>
                n.recipientId === session?.user?.id ||
                n.recipientId === session?.user?.employeeId
            );

            setNotifications(userNotifications);
            setUnreadCount(userNotifications.filter(n => !n.read).length);
        } catch (error) {
            console.warn('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id, session?.user?.employeeId]);

    // وضع علامة مقروء
    const markAsRead = useCallback(async (notificationId) => {
        try {
            const stored = JSON.parse(localStorage.getItem('approvalNotifications') || '[]');
            const updated = stored.map(n =>
                n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
            );
            localStorage.setItem('approvalNotifications', JSON.stringify(updated));

            setNotifications(prev => prev.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.warn('Error marking notification as read:', error);
        }
    }, []);

    // وضع علامة مقروء للكل
    const markAllAsRead = useCallback(async () => {
        try {
            const stored = JSON.parse(localStorage.getItem('approvalNotifications') || '[]');
            const updated = stored.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }));
            localStorage.setItem('approvalNotifications', JSON.stringify(updated));

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.warn('Error marking all notifications as read:', error);
        }
    }, []);

    // حذف إشعار
    const deleteNotification = useCallback(async (notificationId) => {
        try {
            const stored = JSON.parse(localStorage.getItem('approvalNotifications') || '[]');
            const updated = stored.filter(n => n.id !== notificationId);
            localStorage.setItem('approvalNotifications', JSON.stringify(updated));

            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            setUnreadCount(prev => {
                const notification = notifications.find(n => n.id === notificationId);
                return notification && !notification.read ? prev - 1 : prev;
            });
        } catch (error) {
            console.warn('Error deleting notification:', error);
        }
    }, [notifications]);

    // حذف كل الإشعارات
    const clearAll = useCallback(async () => {
        try {
            localStorage.setItem('approvalNotifications', '[]');
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.warn('Error clearing notifications:', error);
        }
    }, []);

    // الاستماع للإشعارات الجديدة
    useEffect(() => {
        if (!session?.user) return;

        // جلب الإشعارات الحالية
        fetchNotifications();

        // الاستماع لأحداث الخدمة
        const unsubscribeSubmitted = approvalWorkflowService.on('requestSubmitted', () => {
            fetchNotifications();
        });

        const unsubscribeApproved = approvalWorkflowService.on('requestApproved', () => {
            fetchNotifications();
        });

        const unsubscribeRejected = approvalWorkflowService.on('requestRejected', () => {
            fetchNotifications();
        });

        // جدولة التحديث الدوري
        pollIntervalRef.current = setInterval(fetchNotifications, 30000); // كل 30 ثانية

        return () => {
            unsubscribeSubmitted?.();
            unsubscribeApproved?.();
            unsubscribeRejected?.();
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [session?.user, fetchNotifications]);

    // محاولة الاتصال بـ WebSocket
    useEffect(() => {
        if (!session?.user) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
        if (!wsUrl) return;

        try {
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('WebSocket connected for notifications');
                // تسجيل المستخدم
                wsRef.current.send(JSON.stringify({
                    type: 'register',
                    userId: session.user.id
                }));
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'notification') {
                        setNotifications(prev => [data.data, ...prev]);
                        setUnreadCount(prev => prev + 1);

                        // عرض إشعار المتصفح
                        if (Notification.permission === 'granted') {
                            new Notification(data.data.title, {
                                body: data.data.message,
                                icon: '/icons/notification.png'
                            });
                        }
                    }
                } catch (error) {
                    console.warn('Error processing WebSocket message:', error);
                }
            };

            wsRef.current.onclose = () => {
                console.log('WebSocket disconnected');
            };

            // حفظ مرجع للـ WebSocket عالمياً
            window.notificationSocket = wsRef.current;
        } catch (error) {
            console.warn('WebSocket connection failed:', error);
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [session?.user]);

    // طلب إذن الإشعارات
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refresh: fetchNotifications
    };
}

/**
 * Hook للطلبات المعلقة
 */
export function usePendingApprovals() {
    const { data: session } = useSession();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPendingApprovals = useCallback(async () => {
        if (!session?.user) return;

        setLoading(true);
        setError(null);

        try {
            const requests = await approvalWorkflowService.getPendingRequestsForUser(session.user);
            setPendingRequests(requests);
        } catch (err) {
            console.warn('Error fetching pending approvals:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [session?.user]);

    useEffect(() => {
        fetchPendingApprovals();

        // الاستماع للتحديثات
        const unsubscribeApproved = approvalWorkflowService.on('requestApproved', () => {
            fetchPendingApprovals();
        });

        const unsubscribeRejected = approvalWorkflowService.on('requestRejected', () => {
            fetchPendingApprovals();
        });

        return () => {
            unsubscribeApproved?.();
            unsubscribeRejected?.();
        };
    }, [fetchPendingApprovals]);

    return {
        pendingRequests,
        loading,
        error,
        refresh: fetchPendingApprovals
    };
}

/**
 * Hook للموافقة على الطلبات
 */
export function useApprovalActions() {
    const { data: session } = useSession();
    const [processing, setProcessing] = useState(false);

    const approve = useCallback(async (requestId, stepNumber, notes = '') => {
        if (!session?.user) {
            return { success: false, error: 'not_authenticated' };
        }

        setProcessing(true);
        try {
            const result = await approvalWorkflowService.approveRequest(
                requestId,
                stepNumber,
                session.user,
                notes
            );
            return result;
        } finally {
            setProcessing(false);
        }
    }, [session?.user]);

    const reject = useCallback(async (requestId, reason) => {
        if (!session?.user) {
            return { success: false, error: 'not_authenticated' };
        }

        setProcessing(true);
        try {
            const result = await approvalWorkflowService.rejectRequest(
                requestId,
                session.user,
                reason
            );
            return result;
        } finally {
            setProcessing(false);
        }
    }, [session?.user]);

    const delegate = useCallback(async (requestId, stepNumber, delegatee, reason = '') => {
        if (!session?.user) {
            return { success: false, error: 'not_authenticated' };
        }

        setProcessing(true);
        try {
            const result = await approvalWorkflowService.delegateApproval(
                requestId,
                stepNumber,
                session.user,
                delegatee,
                reason
            );
            return result;
        } finally {
            setProcessing(false);
        }
    }, [session?.user]);

    const escalate = useCallback(async (requestId, reason) => {
        if (!session?.user) {
            return { success: false, error: 'not_authenticated' };
        }

        setProcessing(true);
        try {
            const result = await approvalWorkflowService.escalateRequest(
                requestId,
                session.user,
                reason
            );
            return result;
        } finally {
            setProcessing(false);
        }
    }, [session?.user]);

    return {
        approve,
        reject,
        delegate,
        escalate,
        processing
    };
}

export default useApprovalNotifications;
