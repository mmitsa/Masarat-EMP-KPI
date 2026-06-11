import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

// Notification Types
export const NOTIFICATION_TYPES = {
    // Chat & Communication
    CHAT_NEW_CONVERSATION: 'chat_new_conversation',
    CHAT_NEW_MESSAGE: 'chat_new_message',
    CHAT_GROUP_INVITE: 'chat_group_invite',
    CHAT_MENTION: 'chat_mention',

    // Approvals & Workflow
    APPROVAL_PENDING: 'approval_pending',
    APPROVAL_APPROVED: 'approval_approved',
    APPROVAL_REJECTED: 'approval_rejected',
    APPROVAL_ESCALATED: 'approval_escalated',

    // HR System
    HR_LEAVE_REQUEST: 'hr_leave_request',
    HR_LEAVE_APPROVED: 'hr_leave_approved',
    HR_LEAVE_REJECTED: 'hr_leave_rejected',
    HR_NEW_EMPLOYEE: 'hr_new_employee',
    HR_EVALUATION: 'hr_evaluation',
    HR_DOCUMENT_EXPIRY: 'hr_document_expiry',

    // Warehouse
    WAREHOUSE_LOW_STOCK: 'warehouse_low_stock',
    WAREHOUSE_NEW_REQUEST: 'warehouse_new_request',
    WAREHOUSE_REQUEST_APPROVED: 'warehouse_request_approved',
    WAREHOUSE_ITEM_RECEIVED: 'warehouse_item_received',
    // Temp Receive - الاستلام المؤقت للفحص
    WAREHOUSE_TEMP_RECEIVE_CREATED: 'warehouse_temp_receive_created',
    WAREHOUSE_TEMP_RECEIVE_TRANSFERRED: 'warehouse_temp_receive_transferred',
    WAREHOUSE_TEMP_RECEIVE_APPROVED: 'warehouse_temp_receive_approved',
    WAREHOUSE_TEMP_RECEIVE_REJECTED: 'warehouse_temp_receive_rejected',
    WAREHOUSE_TEMP_RECEIVE_CANCELLED: 'warehouse_temp_receive_cancelled',
    // Receipt Note - مذكرات الاستلام
    WAREHOUSE_RECEIPT_NOTE_CREATED: 'warehouse_receipt_note_created',
    WAREHOUSE_RECEIPT_NOTE_APPROVED: 'warehouse_receipt_note_approved',
    WAREHOUSE_STOCK_ADDED: 'warehouse_stock_added',

    // Movement
    MOVEMENT_VEHICLE_ASSIGNED: 'movement_vehicle_assigned',
    MOVEMENT_TRIP_STARTED: 'movement_trip_started',
    MOVEMENT_TRIP_COMPLETED: 'movement_trip_completed',
    MOVEMENT_MAINTENANCE_DUE: 'movement_maintenance_due',

    // Archiving
    ARCHIVING_DOCUMENT_UPLOADED: 'archiving_document_uploaded',
    ARCHIVING_DOCUMENT_SHARED: 'archiving_document_shared',
    ARCHIVING_FOLDER_SHARED: 'archiving_folder_shared',

    // Sadad
    SADAD_PAYMENT_RECEIVED: 'sadad_payment_received',
    SADAD_PAYMENT_DUE: 'sadad_payment_due',
    SADAD_INVOICE_CREATED: 'sadad_invoice_created',

    // EPM
    EPM_GOAL_ASSIGNED: 'epm_goal_assigned',
    EPM_EVALUATION_DUE: 'epm_evaluation_due',
    EPM_FEEDBACK_RECEIVED: 'epm_feedback_received',

    // System
    SYSTEM_ANNOUNCEMENT: 'system_announcement',
    SYSTEM_MAINTENANCE: 'system_maintenance',
    SYSTEM_UPDATE: 'system_update',

    // Trash/Restore
    TRASH_RESTORE_REQUEST: 'trash_restore_request',
    TRASH_RESTORE_APPROVED: 'trash_restore_approved',
    TRASH_RESTORE_REJECTED: 'trash_restore_rejected',
};

// Notification Priority
export const PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
};

// System Categories
export const SYSTEMS = {
    CHAT: 'chat',
    HR: 'hr',
    WAREHOUSE: 'warehouse',
    MOVEMENT: 'movement',
    ARCHIVING: 'archiving',
    SADAD: 'sadad',
    EPM: 'epm',
    SYSTEM: 'system',
    APPROVAL: 'approval',
    TRASH: 'trash',
};

// Helper: map raw API notification to frontend shape
function mapNotification(n) {
    return {
        id: n.id?.toString(),
        type: n.type || NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
        system: n.system || n.category?.toLowerCase() || SYSTEMS.SYSTEM,
        priority: n.priority?.toLowerCase() || PRIORITY.MEDIUM,
        title: n.title || n.titleAr || '',
        message: n.message || n.messageAr || '',
        sender: n.sender || null,
        data: n.data || (n.metadata ? JSON.parse(n.metadata) : {}),
        timestamp: new Date(n.timestamp || n.createdAt || Date.now()),
        read: n.read ?? n.isRead ?? false,
        actionUrl: n.actionUrl || null,
    };
}

// Context
const SystemNotificationContext = createContext(null);

export function SystemNotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [settings, setSettings] = useState({
        sound: true,
        desktop: true,
        email: false,
        enabledSystems: Object.values(SYSTEMS),
        enabledTypes: Object.values(NOTIFICATION_TYPES),
    });
    const [isConnected, setIsConnected] = useState(false);
    const audioRef = useRef(null);
    const connectionRef = useRef(null);
    const [userId, setUserId] = useState(null);

    // Get user ID from session
    useEffect(() => {
        // Try to get user ID from localStorage or session
        const storedUserId = localStorage.getItem('user_id');
        if (storedUserId) {
            setUserId(parseInt(storedUserId));
        }
    }, []);

    // Load notifications from API on mount
    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const res = await fetch('/api/notifications', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.data || data.notifications || []);
                    setNotifications(list.map(mapNotification));
                }
            } catch (error) {
                console.warn('Notifications: تعذر تحميل الإشعارات (الخدمة غير متاحة)');
                setNotifications([]);
            }
        };

        loadNotifications();

        const savedSettings = localStorage.getItem('notification_settings');
        if (savedSettings) {
            try {
                setSettings(JSON.parse(savedSettings));
            } catch (e) {}
        }
    }, []);

    // Save notifications to localStorage
    useEffect(() => {
        if (notifications.length > 0) {
            localStorage.setItem('system_notifications', JSON.stringify(notifications));
        }
    }, [notifications]);

    // Save settings to localStorage
    useEffect(() => {
        localStorage.setItem('notification_settings', JSON.stringify(settings));
    }, [settings]);

    // Play notification sound
    const playSound = useCallback(() => {
        if (settings.sound) {
            try {
                // Create audio element if it doesn't exist
                if (!audioRef.current) {
                    audioRef.current = new Audio('/sounds/notification.mp3');
                    audioRef.current.volume = 0.5;
                }
                audioRef.current.play().catch(() => {});
            } catch (e) {}
        }
    }, [settings.sound]);

    // Show desktop notification
    const showDesktopNotification = useCallback((notification) => {
        if (settings.desktop && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id,
            });
        }
    }, [settings.desktop]);

    // Request desktop notification permission
    const requestDesktopPermission = useCallback(async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }, []);

    // Add notification
    const addNotification = useCallback(async (notification) => {
        // Check if this type/system is enabled
        if (!settings.enabledSystems.includes(notification.system)) return null;
        if (!settings.enabledTypes.includes(notification.type)) return null;

        const tempId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newNotification = {
            id: tempId,
            timestamp: new Date(),
            read: false,
            ...notification,
        };

        // Optimistic update
        setNotifications(prev => [newNotification, ...prev]);
        playSound();
        showDesktopNotification(newNotification);

        // Persist to API
        try {
            const res = await fetch('/api/notifications', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: notification.sender?.id || null,
                    titleAr: notification.title,
                    titleEn: notification.title,
                    messageAr: notification.message,
                    messageEn: notification.message,
                    type: notification.type || 'info',
                    category: notification.system || 'general',
                    priority: notification.priority || 'normal',
                    actionUrl: notification.actionUrl || null,
                    data: notification.data ? JSON.stringify(notification.data) : null,
                }),
            });
            if (res.ok) {
                const saved = await res.json();
                // Replace temp id with server-assigned id
                if (saved.id) {
                    setNotifications(prev =>
                        prev.map(n => n.id === tempId ? { ...n, id: saved.id.toString() } : n)
                    );
                }
            }
        } catch (error) {
            console.warn('Failed to persist notification to API:', error);
        }

        return newNotification;
    }, [settings.enabledSystems, settings.enabledTypes, playSound, showDesktopNotification]);

    // Mark as read
    const markAsRead = useCallback(async (notificationId) => {
        // تحديث في Frontend فوراً (optimistic update)
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );

        // تحديث في Backend
        try {
            await fetch(`/api/notifications/${notificationId}`, {
                method: 'PUT',
                credentials: 'include',
            });
        } catch (error) {
            console.warn('Failed to mark notification as read:', error);
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        // تحديث في Frontend فوراً
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        // تحديث في Backend
        try {
            await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.warn('Failed to mark all notifications as read:', error);
        }
    }, []);

    // Mark system notifications as read
    const markSystemAsRead = useCallback((system) => {
        setNotifications(prev =>
            prev.map(n => n.system === system ? { ...n, read: true } : n)
        );
    }, []);

    // Delete notification
    const deleteNotification = useCallback(async (notificationId) => {
        // حذف من Frontend فوراً
        setNotifications(prev => prev.filter(n => n.id !== notificationId));

        // حذف من Backend
        try {
            await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
        } catch (error) {
            console.warn('Failed to delete notification:', error);
        }
    }, []);

    // Clear all notifications
    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Clear notifications by system
    const clearSystemNotifications = useCallback((system) => {
        setNotifications(prev => prev.filter(n => n.system !== system));
    }, []);

    // Update settings
    const updateSettings = useCallback((newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    // Get unread count
    const safeNotifications = Array.isArray(notifications) ? notifications : [];
    const unreadCount = safeNotifications.filter(n => !n.read).length;

    // Get unread count by system
    const getUnreadBySystem = useCallback((system) => {
        const items = Array.isArray(notifications) ? notifications : [];
        return items.filter(n => !n.read && n.system === system).length;
    }, [notifications]);

    // Get notifications by system
    const getNotificationsBySystem = useCallback((system) => {
        const items = Array.isArray(notifications) ? notifications : [];
        return items.filter(n => n.system === system);
    }, [notifications]);

    // Get notifications by type
    const getNotificationsByType = useCallback((type) => {
        const items = Array.isArray(notifications) ? notifications : [];
        return items.filter(n => n.type === type);
    }, [notifications]);

    // Helper functions for specific notification types
    const notifyNewChat = useCallback((sender, conversationId, isGroup = false) => {
        return addNotification({
            type: isGroup ? NOTIFICATION_TYPES.CHAT_GROUP_INVITE : NOTIFICATION_TYPES.CHAT_NEW_CONVERSATION,
            system: SYSTEMS.CHAT,
            priority: PRIORITY.MEDIUM,
            title: isGroup ? 'دعوة لمجموعة جديدة' : 'محادثة جديدة',
            message: isGroup
                ? `${sender.name} أضافك إلى مجموعة جديدة`
                : `${sender.name} بدأ محادثة معك`,
            sender,
            data: { conversationId, isGroup },
            actionUrl: '/chat',
        });
    }, [addNotification]);

    const notifyNewMessage = useCallback((sender, conversationId, messagePreview) => {
        return addNotification({
            type: NOTIFICATION_TYPES.CHAT_NEW_MESSAGE,
            system: SYSTEMS.CHAT,
            priority: PRIORITY.MEDIUM,
            title: 'رسالة جديدة',
            message: `${sender.name}: ${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}`,
            sender,
            data: { conversationId, messagePreview },
            actionUrl: '/chat',
        });
    }, [addNotification]);

    const notifyApprovalPending = useCallback((sender, requestType, requestId, details) => {
        const typeNames = {
            leave: 'طلب إجازة',
            expense: 'طلب مصروفات',
            purchase: 'طلب شراء',
            travel: 'طلب سفر',
            document: 'طلب مستند',
        };
        return addNotification({
            type: NOTIFICATION_TYPES.APPROVAL_PENDING,
            system: SYSTEMS.APPROVAL,
            priority: PRIORITY.HIGH,
            title: 'طلب اعتماد جديد',
            message: `${typeNames[requestType] || 'طلب'} من ${sender.name} بانتظار موافقتك`,
            sender,
            data: { requestId, requestType, ...details },
            actionUrl: '/admin/approval-workflow',
        });
    }, [addNotification]);

    const notifyApprovalResult = useCallback((approver, requestType, requestId, approved, reason = '') => {
        return addNotification({
            type: approved ? NOTIFICATION_TYPES.APPROVAL_APPROVED : NOTIFICATION_TYPES.APPROVAL_REJECTED,
            system: SYSTEMS.APPROVAL,
            priority: PRIORITY.HIGH,
            title: approved ? 'تمت الموافقة على طلبك' : 'تم رفض طلبك',
            message: approved
                ? `${approver.name} وافق على طلبك`
                : `${approver.name} رفض طلبك${reason ? `: ${reason}` : ''}`,
            sender: approver,
            data: { requestId, requestType, approved, reason },
            actionUrl: '/admin/approval-workflow',
        });
    }, [addNotification]);

    const notifyWarehouseLowStock = useCallback((itemName, currentStock, minStock) => {
        return addNotification({
            type: NOTIFICATION_TYPES.WAREHOUSE_LOW_STOCK,
            system: SYSTEMS.WAREHOUSE,
            priority: currentStock <= minStock * 0.5 ? PRIORITY.URGENT : PRIORITY.HIGH,
            title: 'تنبيه مخزون منخفض',
            message: `المنتج "${itemName}" وصل للحد الأدنى (${currentStock} وحدة متبقية)`,
            sender: null,
            data: { itemName, currentStock, minStock },
            actionUrl: '/warehouse',
        });
    }, [addNotification]);

    /**
     * إشعارات الاستلام المؤقت للفحص
     * @param {string} type - نوع الإشعار: created, transferred, approved, rejected, cancelled
     * @param {object} details - تفاصيل الإشعار
     */
    const notifyTempReceive = useCallback((type, details) => {
        const configs = {
            created: {
                type: NOTIFICATION_TYPES.WAREHOUSE_TEMP_RECEIVE_CREATED,
                title: 'استلام مؤقت جديد',
                message: `تم إنشاء استلام مؤقت جديد رقم ${details.documentNumber}`,
                priority: PRIORITY.MEDIUM,
            },
            transferred: {
                type: NOTIFICATION_TYPES.WAREHOUSE_TEMP_RECEIVE_TRANSFERRED,
                title: 'تم ترحيل استلام مؤقت',
                message: `الاستلام المؤقت رقم ${details.documentNumber} بانتظار الاعتماد`,
                priority: PRIORITY.HIGH,
            },
            approved: {
                type: NOTIFICATION_TYPES.WAREHOUSE_TEMP_RECEIVE_APPROVED,
                title: 'تم اعتماد استلام مؤقت',
                message: `تم اعتماد الاستلام المؤقت رقم ${details.documentNumber}`,
                priority: PRIORITY.MEDIUM,
            },
            rejected: {
                type: NOTIFICATION_TYPES.WAREHOUSE_TEMP_RECEIVE_REJECTED,
                title: 'تم رفض استلام مؤقت',
                message: `تم رفض الاستلام المؤقت رقم ${details.documentNumber}${details.reason ? `: ${details.reason}` : ''}`,
                priority: PRIORITY.HIGH,
            },
            cancelled: {
                type: NOTIFICATION_TYPES.WAREHOUSE_TEMP_RECEIVE_CANCELLED,
                title: 'تم إلغاء استلام مؤقت',
                message: `تم إلغاء الاستلام المؤقت رقم ${details.documentNumber}`,
                priority: PRIORITY.MEDIUM,
            },
        };

        const config = configs[type];
        if (!config) return null;

        return addNotification({
            type: config.type,
            system: SYSTEMS.WAREHOUSE,
            priority: config.priority,
            title: config.title,
            message: config.message,
            sender: details.performer || null,
            data: {
                tempReceiveId: details.id,
                documentNumber: details.documentNumber,
                warehouseId: details.warehouseId,
                status: details.status,
                ...details,
            },
            actionUrl: '/warehouse/temp-receive',
        });
    }, [addNotification]);

    /**
     * إشعارات مذكرات الاستلام
     * @param {string} type - نوع الإشعار: created, approved, stock_added
     * @param {object} details - تفاصيل الإشعار
     */
    const notifyReceiptNote = useCallback((type, details) => {
        const configs = {
            created: {
                type: NOTIFICATION_TYPES.WAREHOUSE_RECEIPT_NOTE_CREATED,
                title: 'مذكرة استلام جديدة',
                message: `تم إنشاء مذكرة استلام رقم ${details.documentNumber}`,
                priority: PRIORITY.MEDIUM,
            },
            approved: {
                type: NOTIFICATION_TYPES.WAREHOUSE_RECEIPT_NOTE_APPROVED,
                title: 'تم اعتماد مذكرة استلام',
                message: `تم اعتماد مذكرة الاستلام رقم ${details.documentNumber} وإضافة الأصناف للمخزون`,
                priority: PRIORITY.MEDIUM,
            },
            stock_added: {
                type: NOTIFICATION_TYPES.WAREHOUSE_STOCK_ADDED,
                title: 'تم إضافة أصناف للمخزون',
                message: `تم إضافة ${details.itemCount || 'عدة'} أصناف للمخزون من مذكرة ${details.documentNumber}`,
                priority: PRIORITY.LOW,
            },
        };

        const config = configs[type];
        if (!config) return null;

        return addNotification({
            type: config.type,
            system: SYSTEMS.WAREHOUSE,
            priority: config.priority,
            title: config.title,
            message: config.message,
            sender: details.performer || null,
            data: {
                receiptNoteId: details.id,
                documentNumber: details.documentNumber,
                tempReceiveId: details.tempReceiveId,
                warehouseId: details.warehouseId,
                ...details,
            },
            actionUrl: '/warehouse/receipt-note',
        });
    }, [addNotification]);

    const notifyHRLeave = useCallback((employee, leaveType, startDate, endDate, status) => {
        const statusMessages = {
            pending: `طلب إجازة ${leaveType} من ${employee.name}`,
            approved: `تمت الموافقة على إجازة ${employee.name}`,
            rejected: `تم رفض طلب إجازة ${employee.name}`,
        };
        return addNotification({
            type: status === 'pending' ? NOTIFICATION_TYPES.HR_LEAVE_REQUEST
                : status === 'approved' ? NOTIFICATION_TYPES.HR_LEAVE_APPROVED
                : NOTIFICATION_TYPES.HR_LEAVE_REJECTED,
            system: SYSTEMS.HR,
            priority: status === 'pending' ? PRIORITY.HIGH : PRIORITY.MEDIUM,
            title: status === 'pending' ? 'طلب إجازة جديد' : status === 'approved' ? 'موافقة على إجازة' : 'رفض إجازة',
            message: statusMessages[status],
            sender: employee,
            data: { leaveType, startDate, endDate, status },
            actionUrl: '/hr/leaves',
        });
    }, [addNotification]);

    const notifyMovement = useCallback((type, details) => {
        const configs = {
            assigned: {
                type: NOTIFICATION_TYPES.MOVEMENT_VEHICLE_ASSIGNED,
                title: 'تم تعيين مركبة',
                message: `تم تعيين المركبة (${details.vehiclePlate}) لمهمتك`,
            },
            started: {
                type: NOTIFICATION_TYPES.MOVEMENT_TRIP_STARTED,
                title: 'بدأت الرحلة',
                message: `بدأت رحلة ${details.tripName}`,
            },
            completed: {
                type: NOTIFICATION_TYPES.MOVEMENT_TRIP_COMPLETED,
                title: 'اكتملت الرحلة',
                message: `اكتملت رحلة ${details.tripName} بنجاح`,
            },
            maintenance: {
                type: NOTIFICATION_TYPES.MOVEMENT_MAINTENANCE_DUE,
                title: 'صيانة مستحقة',
                message: `المركبة (${details.vehiclePlate}) تحتاج صيانة`,
            },
        };
        const config = configs[type];
        return addNotification({
            type: config.type,
            system: SYSTEMS.MOVEMENT,
            priority: type === 'maintenance' ? PRIORITY.HIGH : PRIORITY.MEDIUM,
            title: config.title,
            message: config.message,
            sender: details.sender || null,
            data: details,
            actionUrl: '/movement',
        });
    }, [addNotification]);

    const notifyArchiving = useCallback((type, details) => {
        const configs = {
            uploaded: {
                type: NOTIFICATION_TYPES.ARCHIVING_DOCUMENT_UPLOADED,
                title: 'مستند جديد',
                message: `تم رفع مستند "${details.documentName}"`,
            },
            shared: {
                type: NOTIFICATION_TYPES.ARCHIVING_DOCUMENT_SHARED,
                title: 'تمت مشاركة مستند معك',
                message: `${details.sharer.name} شارك معك "${details.documentName}"`,
            },
            folder_shared: {
                type: NOTIFICATION_TYPES.ARCHIVING_FOLDER_SHARED,
                title: 'تمت مشاركة مجلد معك',
                message: `${details.sharer.name} شارك معك مجلد "${details.folderName}"`,
            },
        };
        const config = configs[type];
        return addNotification({
            type: config.type,
            system: SYSTEMS.ARCHIVING,
            priority: PRIORITY.MEDIUM,
            title: config.title,
            message: config.message,
            sender: details.sharer || null,
            data: details,
            actionUrl: '/archiving',
        });
    }, [addNotification]);

    const notifyTrashRestore = useCallback((type, details) => {
        const configs = {
            request: {
                type: NOTIFICATION_TYPES.TRASH_RESTORE_REQUEST,
                title: 'طلب إرجاع معاملة',
                message: `${details.requester.name} يطلب إرجاع "${details.itemTitle}"`,
                priority: PRIORITY.HIGH,
            },
            approved: {
                type: NOTIFICATION_TYPES.TRASH_RESTORE_APPROVED,
                title: 'تمت الموافقة على الإرجاع',
                message: `تمت الموافقة على إرجاع "${details.itemTitle}"`,
                priority: PRIORITY.MEDIUM,
            },
            rejected: {
                type: NOTIFICATION_TYPES.TRASH_RESTORE_REJECTED,
                title: 'تم رفض طلب الإرجاع',
                message: `تم رفض طلب إرجاع "${details.itemTitle}"`,
                priority: PRIORITY.MEDIUM,
            },
        };
        const config = configs[type];
        return addNotification({
            type: config.type,
            system: SYSTEMS.TRASH,
            priority: config.priority,
            title: config.title,
            message: config.message,
            sender: details.requester || details.approver || null,
            data: details,
            actionUrl: '/trash',
        });
    }, [addNotification]);

    const notifySystem = useCallback((title, message, priority = PRIORITY.LOW) => {
        return addNotification({
            type: NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
            system: SYSTEMS.SYSTEM,
            priority,
            title,
            message,
            sender: null,
            data: {},
            actionUrl: null,
        });
    }, [addNotification]);

    // SignalR Real-time Connection (Optional - Based on Feature Flag)
    useEffect(() => {
        // Check if SignalR and real-time notifications are enabled
        const signalREnabled = process.env.NEXT_PUBLIC_ENABLE_SIGNALR === 'true';
        const realtimeEnabled = process.env.NEXT_PUBLIC_ENABLE_REALTIME_NOTIFICATIONS === 'true';

        if (!signalREnabled || !realtimeEnabled) {
            console.log('ℹ️ SignalR is disabled via feature flag. Using REST API polling mode.');
            setIsConnected(false);
            return;
        }

        if (!userId) return;

        console.log('🔌 Initializing SignalR connection...');

        // إنشاء اتصال SignalR
        // في الإنتاج: يمر عبر IIS reverse proxy
        // في التطوير: يتصل مباشرة بخدمة الإشعارات
        const notificationsBaseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:5016';
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${notificationsBaseUrl}/hubs/notifications?userId=${userId}`, {
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    // Exponential backoff: 0, 2, 10, 30 seconds
                    if (retryContext.previousRetryCount === 0) return 0;
                    if (retryContext.previousRetryCount === 1) return 2000;
                    if (retryContext.previousRetryCount === 2) return 10000;
                    return 30000;
                }
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        connectionRef.current = connection;

        // معالجات الأحداث
        connection.on('ReceiveNotification', (notification) => {
            console.log('📩 Received notification via SignalR:', notification);

            // تحويل إشعار من Backend إلى صيغة Frontend
            const formattedNotification = {
                id: notification.id?.toString() || `notif_${Date.now()}`,
                type: notification.type || NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
                system: notification.category?.toLowerCase() || SYSTEMS.SYSTEM,
                priority: notification.priority?.toLowerCase() || PRIORITY.MEDIUM,
                title: notification.titleAr,
                message: notification.messageAr,
                sender: null,
                data: notification.metadata ? JSON.parse(notification.metadata) : {},
                timestamp: new Date(notification.createdAt || Date.now()),
                read: false,
                actionUrl: notification.actionUrl || null,
            };

            // إضافة الإشعار
            addNotification(formattedNotification);
        });

        connection.onreconnecting((error) => {
            console.warn('⚠️ SignalR reconnecting:', error);
            setIsConnected(false);
        });

        connection.onreconnected((connectionId) => {
            console.log('✅ SignalR reconnected:', connectionId);
            setIsConnected(true);
        });

        connection.onclose((error) => {
            console.warn('SignalR: اتصال الإشعارات أُغلق');
            setIsConnected(false);
        });

        // بدء الاتصال
        let retryCount = 0;
        const maxRetries = 3;
        const startConnection = async () => {
            try {
                await connection.start();
                console.log('✅ SignalR connected successfully');
                setIsConnected(true);
                retryCount = 0; // Reset on success
            } catch (error) {
                console.warn('SignalR: تعذر الاتصال (الخدمة غير متاحة)');
                setIsConnected(false);

                // Stop retrying after max attempts
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`⏳ Retrying SignalR connection (${retryCount}/${maxRetries}) in 5 seconds...`);
                    setTimeout(startConnection, 5000);
                } else {
                    console.warn('⚠️ Max SignalR retry attempts reached. Using REST API polling as fallback.');
                }
            }
        };

        startConnection();

        // تنظيف الاتصال عند إلغاء التثبيت
        return () => {
            if (connection) {
                connection.stop();
            }
        };
    }, [userId, addNotification]);

    const value = {
        notifications,
        settings,
        isConnected,
        unreadCount,

        // Core functions
        addNotification,
        markAsRead,
        markAllAsRead,
        markSystemAsRead,
        deleteNotification,
        clearAllNotifications,
        clearSystemNotifications,
        updateSettings,
        requestDesktopPermission,

        // Query functions
        getUnreadBySystem,
        getNotificationsBySystem,
        getNotificationsByType,

        // Helper functions for specific notifications
        notifyNewChat,
        notifyNewMessage,
        notifyApprovalPending,
        notifyApprovalResult,
        notifyWarehouseLowStock,
        notifyTempReceive,
        notifyReceiptNote,
        notifyHRLeave,
        notifyMovement,
        notifyArchiving,
        notifyTrashRestore,
        notifySystem,
    };

    return (
        <SystemNotificationContext.Provider value={value}>
            {children}
        </SystemNotificationContext.Provider>
    );
}

export const useSystemNotifications = () => {
    const context = useContext(SystemNotificationContext);
    if (!context) {
        throw new Error('useSystemNotifications must be used within SystemNotificationProvider');
    }
    return context;
};

export default SystemNotificationContext;
