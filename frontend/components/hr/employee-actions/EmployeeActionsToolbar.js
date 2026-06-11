/**
 * شريط إجراءات الموظف
 * Employee Actions Toolbar with dropdown menu
 */

import React, { useState, useRef, useEffect } from 'react';

const MENU_ITEMS = [
    { id: 'photo', label: 'الصورة الشخصية', icon: 'photo', handler: 'onUploadPhoto' },
    { id: 'signature', label: 'رفع التوقيع', icon: 'signature', handler: 'onUploadSignature' },
    { id: 'schedule', label: 'جدول عمل خاص', icon: 'clock', handler: 'onAssignSchedule' },
    { id: 'badge', label: 'طباعة بطاقة الموظف', icon: 'badge', handler: 'onPrintBadge' },
    { id: 'report', label: 'تقرير شامل', icon: 'report', handler: 'onPrintFullReport' },
    { id: 'divider1', type: 'divider' },
    { id: 'print', label: 'طباعة', icon: 'print', handler: 'onPrint' },
    { id: 'pdf', label: 'تصدير PDF', icon: 'pdf', handler: 'onExportPDF' },
    { id: 'excel', label: 'تصدير Excel', icon: 'excel', handler: 'onExportExcel' },
    { id: 'divider2', type: 'divider' },
    { id: 'disable', label: 'تعطيل الموظف', icon: 'disable', handler: 'onDisable', danger: true },
];

const ICONS = {
    photo: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    ),
    signature: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    ),
    clock: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    badge: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
    ),
    report: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
    print: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    ),
    pdf: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    ),
    excel: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    ),
    disable: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    ),
};

export default function EmployeeActionsToolbar({
    employee,
    onEdit,
    onDisable,
    onPrint,
    onExportPDF,
    onExportExcel,
    onUploadPhoto,
    onUploadSignature,
    onAssignSchedule,
    onPrintBadge,
    onPrintFullReport,
}) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const handlers = {
        onUploadPhoto,
        onUploadSignature,
        onAssignSchedule,
        onPrintBadge,
        onPrintFullReport,
        onPrint,
        onExportPDF,
        onExportExcel,
        onDisable,
    };

    return (
        <div className="flex items-center gap-2">
            {/* زر تعديل */}
            <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                تعديل
            </button>

            {/* زر طباعة البطاقة */}
            <button
                onClick={onPrintBadge}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg hover:bg-purple-100 transition text-sm font-medium"
                title="طباعة بطاقة الموظف"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {ICONS.badge}
                </svg>
                البطاقة
            </button>

            {/* القائمة المنسدلة */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setOpen(!open)}
                    className="p-2.5 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 transition"
                    title="المزيد من الإجراءات"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>

                {open && (
                    <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[220px] z-50">
                        {MENU_ITEMS.map((item) => {
                            if (item.type === 'divider') {
                                return <div key={item.id} className="my-1 border-t border-gray-100 dark:border-gray-800" />;
                            }
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        handlers[item.handler]?.();
                                        setOpen(false);
                                    }}
                                    className={`w-full px-4 py-2.5 flex items-center gap-3 text-sm transition ${
                                        item.danger
                                            ? 'text-red-600 dark:text-red-400 hover:bg-red-50'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {ICONS[item.icon]}
                                    </svg>
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
