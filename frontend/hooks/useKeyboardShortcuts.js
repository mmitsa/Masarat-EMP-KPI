/**
 * Keyboard Shortcuts Hook - اختصارات لوحة المفاتيح
 * 
 * نظام موحد لاختصارات لوحة المفاتيح في المنصة
 * 
 * @version 1.0.0
 * @date 2026-02-07
 */

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';

// الاختصارات العامة للمنصة
export const SHORTCUTS = {
    // التنقل
    SEARCH: 'ctrl+k',
    HOME: 'ctrl+h',
    HELP: 'ctrl+/',
    
    // الإجراءات
    NEW: 'ctrl+n',
    SAVE: 'ctrl+s',
    CANCEL: 'escape',
    REFRESH: 'ctrl+r',
    
    // UI
    TOGGLE_SIDEBAR: 'ctrl+b',
    TOGGLE_THEME: 'ctrl+shift+t',
    
    // الموديولات السريعة
    HR_MODULE: 'ctrl+1',
    WAREHOUSE_MODULE: 'ctrl+2',
    FINANCE_MODULE: 'ctrl+3',
    ITSM_MODULE: 'ctrl+4',
};

/**
 * تحويل الاختصار إلى مفتاح موحد
 */
function normalizeShortcut(e) {
    const parts = [];
    
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    
    const key = (e.key || '').toLowerCase();
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
        parts.push(key);
    }
    
    return parts.join('+');
}

/**
 * Hook لإضافة اختصار لوحة مفاتيح
 */
export function useKeyboardShortcut(shortcut, callback, options = {}) {
    const {
        enabled = true,
        preventDefault = true,
        stopPropagation = false,
    } = options;
    
    const callbackRef = useRef(callback);
    callbackRef.current = callback;
    
    useEffect(() => {
        if (!enabled) return;
        
        const handleKeyDown = (e) => {
            const pressed = normalizeShortcut(e);
            
            if (pressed === shortcut.toLowerCase()) {
                if (preventDefault) e.preventDefault();
                if (stopPropagation) e.stopPropagation();
                
                callbackRef.current(e);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcut, enabled, preventDefault, stopPropagation]);
}

/**
 * Hook للاختصارات العامة في المنصة
 */
export function useGlobalShortcuts({
    onSearch,
    onHelp,
    onToggleSidebar,
    onToggleTheme,
    enabled = true,
} = {}) {
    const router = useRouter();
    
    // البحث السريع
    useKeyboardShortcut(SHORTCUTS.SEARCH, () => {
        onSearch?.();
    }, { enabled: enabled && !!onSearch });
    
    // الصفحة الرئيسية
    useKeyboardShortcut(SHORTCUTS.HOME, () => {
        router.push('/dashboard');
    }, { enabled });
    
    // المساعدة
    useKeyboardShortcut(SHORTCUTS.HELP, () => {
        onHelp?.();
    }, { enabled: enabled && !!onHelp });
    
    // إظهار/إخفاء Sidebar
    useKeyboardShortcut(SHORTCUTS.TOGGLE_SIDEBAR, () => {
        onToggleSidebar?.();
    }, { enabled: enabled && !!onToggleSidebar });
    
    // تبديل الثيم
    useKeyboardShortcut(SHORTCUTS.TOGGLE_THEME, () => {
        onToggleTheme?.();
    }, { enabled: enabled && !!onToggleTheme });
    
    // التنقل للموديولات
    useKeyboardShortcut(SHORTCUTS.HR_MODULE, () => {
        router.push('/hr/employees');
    }, { enabled });
    
    useKeyboardShortcut(SHORTCUTS.WAREHOUSE_MODULE, () => {
        router.push('/warehouse');
    }, { enabled });
    
    useKeyboardShortcut(SHORTCUTS.FINANCE_MODULE, () => {
        router.push('/finance/budget');
    }, { enabled });
    
    useKeyboardShortcut(SHORTCUTS.ITSM_MODULE, () => {
        router.push('/itsm/tickets');
    }, { enabled });
}

/**
 * Hook لاختصارات النموذج
 */
export function useFormShortcuts({
    onSave,
    onCancel,
    onNew,
    enabled = true,
} = {}) {
    // حفظ
    useKeyboardShortcut(SHORTCUTS.SAVE, () => {
        onSave?.();
    }, { enabled: enabled && !!onSave });
    
    // إلغاء
    useKeyboardShortcut(SHORTCUTS.CANCEL, () => {
        onCancel?.();
    }, { enabled: enabled && !!onCancel });
    
    // جديد
    useKeyboardShortcut(SHORTCUTS.NEW, () => {
        onNew?.();
    }, { enabled: enabled && !!onNew });
}

/**
 * Hook لاختصارات الجدول
 */
export function useTableShortcuts({
    onRefresh,
    onExport,
    onFilter,
    enabled = true,
} = {}) {
    // تحديث
    useKeyboardShortcut(SHORTCUTS.REFRESH, (e) => {
        e.preventDefault();
        onRefresh?.();
    }, { enabled: enabled && !!onRefresh });
    
    // تصدير
    useKeyboardShortcut('ctrl+e', () => {
        onExport?.();
    }, { enabled: enabled && !!onExport });
    
    // فلتر
    useKeyboardShortcut('ctrl+f', () => {
        onFilter?.();
    }, { enabled: enabled && !!onFilter });
}

/**
 * Component لعرض الاختصارات المتاحة
 */
export function ShortcutsHelp({ shortcuts = [], onClose }) {
    // إغلاق عند الضغط على Escape
    useKeyboardShortcut('escape', onClose);
    
    // الاختصارات الافتراضية
    const defaultShortcuts = [
        { key: 'Ctrl + K', description: 'بحث سريع' },
        { key: 'Ctrl + H', description: 'الصفحة الرئيسية' },
        { key: 'Ctrl + /', description: 'المساعدة' },
        { key: 'Ctrl + N', description: 'إنشاء جديد' },
        { key: 'Ctrl + S', description: 'حفظ' },
        { key: 'Ctrl + B', description: 'إظهار/إخفاء القائمة الجانبية' },
        { key: 'Ctrl + Shift + T', description: 'تبديل الثيم' },
        { key: 'Ctrl + 1-4', description: 'التنقل السريع للموديولات' },
        { key: 'Escape', description: 'إلغاء/إغلاق' },
        ...shortcuts,
    ];
    
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            ⌨️ اختصارات لوحة المفاتيح
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div className="p-6">
                    <div className="space-y-3">
                        {defaultShortcuts.map((shortcut, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                                <span className="text-gray-700 dark:text-gray-300">
                                    {shortcut.description}
                                </span>
                                <kbd className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-mono text-sm border border-gray-300 dark:border-gray-600">
                                    {shortcut.key}
                                </kbd>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        اضغط <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Escape</kbd> للإغلاق
                    </p>
                </div>
            </div>
        </div>
    );
}

export default useKeyboardShortcut;
