/**
 * Service Worker مخصص - Custom Service Worker
 * يُكمِّل الـ Service Worker المولَّد تلقائياً من next-pwa
 *
 * ═══════════════════════════════════════════════════════════
 * مهم: لا نخزن API responses مؤقتاً أبداً!
 * التخزين المؤقت لـ API كان يسبب مشاكل:
 * 1. تخزين ردود 401 القديمة → redirect loop
 * 2. تقديم بيانات قديمة بعد التحديث
 * 3. تعارض مع نظام المصادقة NextAuth
 * ═══════════════════════════════════════════════════════════
 */

const SYNC_TAG = 'masarat-sync';
const OFFLINE_QUEUE_CACHE = 'masarat-offline-queue';

// ═══════════════════════════════════════════════════════════
// فقط Background Sync للعمليات الكتابية (POST/PUT/DELETE)
// عند فقدان الاتصال، تُحفظ العمليات وتُعاد عند عودة الاتصال
// ═══════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // ═══ لا نتدخل أبداً في طلبات API أو المصادقة ═══
    // نتركها تمر مباشرة للشبكة بدون أي تخزين مؤقت
    if (url.pathname.startsWith('/api/')) {
        // فقط نتدخل في حالة فشل عمليات الكتابة (offline)
        if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
            event.respondWith(
                fetch(request.clone()).catch(async () => {
                    // حفظ العملية الفاشلة للمزامنة لاحقاً
                    const body = await request.clone().text();
                    const queueItem = {
                        url: request.url,
                        method: request.method,
                        headers: Object.fromEntries(request.headers.entries()),
                        body,
                        timestamp: Date.now(),
                    };

                    const cache = await caches.open(OFFLINE_QUEUE_CACHE);
                    const key = `queue-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                    await cache.put(
                        new Request(key),
                        new Response(JSON.stringify(queueItem))
                    );

                    // تسجيل المزامنة الخلفية
                    if (self.registration.sync) {
                        await self.registration.sync.register(SYNC_TAG);
                    }

                    return new Response(
                        JSON.stringify({
                            queued: true,
                            message: 'تم حفظ العملية وستتم المزامنة عند عودة الاتصال',
                        }),
                        { status: 202, headers: { 'Content-Type': 'application/json' } }
                    );
                })
            );
        }
        // GET API requests: لا نتدخل - نتركها تمر مباشرة
        return;
    }
});

/**
 * معالجة Background Sync
 */
self.addEventListener('sync', (event) => {
    if (event.tag === SYNC_TAG) {
        event.waitUntil(processOfflineQueue());
    }
});

/**
 * معالجة الطابور المحلي
 */
async function processOfflineQueue() {
    const cache = await caches.open(OFFLINE_QUEUE_CACHE);
    const keys = await cache.keys();

    for (const key of keys) {
        try {
            const response = await cache.match(key);
            const queueItem = await response.json();

            const result = await fetch(queueItem.url, {
                method: queueItem.method,
                headers: queueItem.headers,
                body: queueItem.body,
            });

            if (result.ok || result.status < 500) {
                await cache.delete(key);
            }
        } catch (err) {
            console.error('[SW] فشل إعادة إرسال الطلب:', err);
        }
    }
}

/**
 * التحقق من رسائل العميل
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

/**
 * تنظيف الكاشات القديمة عند تفعيل Service Worker الجديد
 * هذا يضمن عدم وجود بيانات قديمة تؤثر على الأداء
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => {
                        // حذف كاشات API القديمة
                        return name === 'masarat-api-fallback' ||
                               name === 'api-cache' ||
                               (name.startsWith('masarat-') && name !== 'masarat-offline-queue');
                    })
                    .map((name) => {
                        console.log('[SW] حذف كاش قديم:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
});
