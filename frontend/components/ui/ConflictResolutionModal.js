/**
 * نافذة حل التعارضات - Conflict Resolution Modal
 * تظهر عند وجود تعارض بين البيانات المحلية والخادم
 */

import React from 'react';

export default function ConflictResolutionModal({ isOpen, conflicts, onResolve, onClose }) {
    if (!isOpen || !conflicts || conflicts.length === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 p-2 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </span>
                        <div>
                            <h3 className="text-lg font-bold text-orange-800 dark:text-orange-200">
                                تعارض في البيانات
                            </h3>
                            <p className="text-sm text-orange-600 mt-1">
                                تم تعديل بعض السجلات من مصدر آخر أثناء العمل بدون اتصال
                            </p>
                        </div>
                    </div>
                </div>

                {/* Conflicts List */}
                <div className="p-6 overflow-y-auto max-h-[50vh] space-y-4">
                    {conflicts.map((conflict, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-gray-800 dark:text-gray-100">
                                    {conflict.entityType} #{conflict.entityId}
                                </span>
                                <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 px-2 py-1 rounded-full">
                                    تعارض
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{conflict.message}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onResolve(conflict, 'server')}
                                    className="flex-1 text-sm bg-blue-600 text-white rounded-xl py-2 hover:bg-blue-700 transition-colors"
                                >
                                    قبول نسخة الخادم
                                </button>
                                <button
                                    onClick={() => onResolve(conflict, 'client')}
                                    className="flex-1 text-sm bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 rounded-xl py-2 hover:bg-gray-200 transition-colors"
                                >
                                    الاحتفاظ بنسختي
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="border-t px-6 py-4 flex justify-between">
                    <button
                        onClick={() => onResolve(null, 'accept-all-server')}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors"
                    >
                        قبول جميع نسخ الخادم
                    </button>
                    <button
                        onClick={onClose}
                        className="text-sm bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 rounded-xl px-4 py-2 hover:bg-gray-200 transition-colors"
                    >
                        لاحقاً
                    </button>
                </div>
            </div>
        </div>
    );
}
