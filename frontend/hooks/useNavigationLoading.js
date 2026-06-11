/**
 * Navigation Loading Store - إدارة حالة التنقل بين الصفحات
 *
 * يوفر حالة مركزية لعرض مؤشرات التحميل أثناء التنقل
 * يُستخدم مع Next.js Router events
 *
 * @version 1.0.0
 * @date 2026-02-09
 */

import { create } from 'zustand';

export const useNavigationStore = create((set) => ({
    isNavigating: false,
    targetPath: null,

    startNavigation: (path) => {
        set({ isNavigating: true, targetPath: path });
    },

    endNavigation: () => {
        set({ isNavigating: false, targetPath: null });
    },
}));
