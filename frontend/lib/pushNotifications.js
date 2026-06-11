/**
 * أدوات الإشعارات الفورية - Push Notifications Utility
 * يوفر وظائف لإدارة إشعارات PWA
 */

/**
 * التحقق من دعم الإشعارات الفورية
 * @returns {boolean}
 */
export function isPushSupported() {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * التحقق من حالة الإذن الحالية
 * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
 */
export function getNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission;
}

/**
 * طلب إذن الإشعارات من المستخدم
 * @returns {Promise<'granted' | 'denied' | 'default'>}
 */
export async function requestNotificationPermission() {
    if (!isPushSupported()) {
        console.warn('Push notifications are not supported in this browser');
        return 'denied';
    }

    if (!('Notification' in window)) {
        console.warn('Notification API is not supported');
        return 'denied';
    }

    // إذا كان الإذن ممنوحاً بالفعل
    if (Notification.permission === 'granted') {
        return 'granted';
    }

    // إذا كان الإذن مرفوضاً بشكل دائم
    if (Notification.permission === 'denied') {
        console.warn('Notification permission has been denied by the user');
        return 'denied';
    }

    // طلب الإذن
    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (error) {
        console.warn('Error requesting notification permission:', error);
        return 'denied';
    }
}

/**
 * الاشتراك في الإشعارات الفورية
 * @param {string} [vapidPublicKey] - VAPID public key from server
 * @returns {Promise<PushSubscription | null>}
 */
export async function subscribeToPush(vapidPublicKey) {
    if (!isPushSupported()) {
        console.warn('Push notifications are not supported');
        return null;
    }

    try {
        // التأكد من الإذن
        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
            console.warn('Notification permission not granted');
            return null;
        }

        // الحصول على Service Worker Registration
        const registration = await navigator.serviceWorker.ready;

        // التحقق من وجود اشتراك حالي
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
            return existingSubscription;
        }

        // إنشاء اشتراك جديد
        const subscriptionOptions = {
            userVisibleOnly: true,
        };

        // إضافة VAPID key إذا كان متاحاً
        if (vapidPublicKey) {
            subscriptionOptions.applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        }

        const subscription = await registration.pushManager.subscribe(subscriptionOptions);
        return subscription;
    } catch (error) {
        console.warn('Error subscribing to push notifications:', error);
        return null;
    }
}

/**
 * إلغاء الاشتراك من الإشعارات الفورية
 * @returns {Promise<boolean>}
 */
export async function unsubscribeFromPush() {
    if (!isPushSupported()) return false;

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            const result = await subscription.unsubscribe();
            return result;
        }

        return true;
    } catch (error) {
        console.warn('Error unsubscribing from push:', error);
        return false;
    }
}

/**
 * الحصول على الاشتراك الحالي
 * @returns {Promise<PushSubscription | null>}
 */
export async function getCurrentSubscription() {
    if (!isPushSupported()) return null;

    try {
        const registration = await navigator.serviceWorker.ready;
        return await registration.pushManager.getSubscription();
    } catch (error) {
        console.warn('Error getting current subscription:', error);
        return null;
    }
}

/**
 * إرسال إشعار محلي (بدون خادم)
 * @param {string} title - عنوان الإشعار
 * @param {Object} options - خيارات الإشعار
 * @returns {Promise<boolean>}
 */
export async function showLocalNotification(title, options = {}) {
    if (!isPushSupported()) return false;

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return false;

    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
            dir: 'rtl',
            lang: 'ar',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-96x96.png',
            ...options,
        });
        return true;
    } catch (error) {
        console.warn('Error showing notification:', error);
        return false;
    }
}

/**
 * تحويل VAPID key من Base64 URL إلى Uint8Array
 * @param {string} base64String
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}
