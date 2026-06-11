import { useCallback, useEffect, useRef } from 'react';

/**
 * هوك اكتشاف التحديثات — يكتشف نسخة جديدة ويسجلها في console
 *
 * ملاحظة: لا يعيد تحميل الصفحة تلقائياً.
 * الإشعار المرئي يتم عبر UpdateNotification component في AppLayout.
 *
 * الآلية:
 * 1. يسحب /api/version كل 30 ثانية
 * 2. يقارن buildId الحالي بالجديد
 * 3. عند اكتشاف تحديث → يسجل في console فقط
 */

const POLL_INTERVAL = 30_000; // 30 ثانية

export default function useAutoUpdate() {
    const currentBuildId = useRef(null);

    const checkVersion = useCallback(async () => {
        try {
            const res = await fetch('/api/version', {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
            });
            if (!res.ok) return;

            const data = await res.json();
            const newBuildId = data.buildId;

            if (!newBuildId || newBuildId === '__development__') return;

            // أول مرة — حفظ النسخة الحالية
            if (!currentBuildId.current) {
                currentBuildId.current = newBuildId;
                return;
            }

            // نسخة جديدة مكتشفة
            if (newBuildId !== currentBuildId.current) {
                console.info('[AutoUpdate] نسخة جديدة مكتشفة:', newBuildId);
                // UpdateNotification يتولى إشعار المستخدم
            }
        } catch {
            // الشبكة غير متاحة مؤقتاً
        }
    }, []);

    useEffect(() => {
        const initialTimer = setTimeout(checkVersion, 5_000);
        const pollTimer = setInterval(checkVersion, POLL_INTERVAL);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(pollTimer);
        };
    }, [checkVersion]);
}
