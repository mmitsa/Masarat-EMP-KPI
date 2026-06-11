import React from 'react';
import { Badge } from '../ui';

/**
 * SyncStatusBadge - مكون عرض حالة المزامنة مع شامل
 * يستخدم في جميع صفحات المستودعات لعرض حالة مزامنة السجلات
 *
 * @param {boolean} isSync - هل تم المزامنة؟
 * @param {string} syncDateTime - تاريخ ووقت آخر مزامنة
 * @param {string} size - حجم العرض (sm, md, lg)
 * @param {boolean} showDate - عرض تاريخ المزامنة
 */
export function SyncStatusBadge({ isSync, syncDateTime, size = 'sm', showDate = false }) {
    const getStatusConfig = () => {
        if (isSync === true) {
            return {
                variant: 'green',
                icon: '✓',
                label: 'تم المزامنة',
                labelEn: 'Synced'
            };
        } else if (isSync === false || isSync === null) {
            return {
                variant: 'orange',
                icon: '⏳',
                label: 'معلق',
                labelEn: 'Pending'
            };
        } else {
            return {
                variant: 'red',
                icon: '✗',
                label: 'فشل',
                labelEn: 'Failed'
            };
        }
    };

    const config = getStatusConfig();

    return (
        <div className="flex items-center gap-2">
            <Badge variant={config.variant} size={size}>
                <span className="ml-1">{config.icon}</span>
                {config.label}
            </Badge>
            {showDate && syncDateTime && isSync && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(syncDateTime).toLocaleString('ar-SA')}
                </span>
            )}
        </div>
    );
}

/**
 * SyncStatusIndicator - مؤشر حالة المزامنة المصغر
 * للاستخدام في الجداول والقوائم
 */
export function SyncStatusIndicator({ isSync, className = '' }) {
    return (
        <span
            className={`inline-block w-2 h-2 rounded-full ${
                isSync === true ? 'bg-green-500' :
                isSync === false ? 'bg-orange-500 animate-pulse' :
                'bg-red-500'
            } ${className}`}
            title={isSync === true ? 'تم المزامنة' : isSync === false ? 'معلق' : 'فشل'}
        />
    );
}

/**
 * SyncSummaryCard - بطاقة ملخص المزامنة
 * تعرض إحصائيات المزامنة للصفحة
 */
export function SyncSummaryCard({
    totalRecords = 0,
    syncedRecords = 0,
    pendingRecords = 0,
    failedRecords = 0,
    lastSyncTime = null,
    onSyncNow = null,
    loading = false
}) {
    const syncPercentage = totalRecords > 0 ? Math.round((syncedRecords / totalRecords) * 100) : 0;

    return (
        <div className="bg-gradient-to-l from-blue-50 to-white p-4 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="font-bold text-gray-800 dark:text-gray-100">حالة المزامنة مع شامل</span>
                </div>
                {onSyncNow && (
                    <button
                        onClick={onSyncNow}
                        disabled={loading}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                    >
                        {loading ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        ) : (
                            <span>مزامنة الآن</span>
                        )}
                    </button>
                )}
            </div>

            {/* شريط التقدم */}
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">نسبة الإكمال</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{syncPercentage}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-l from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${syncPercentage}%` }}
                    />
                </div>
            </div>

            {/* الإحصائيات */}
            <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{totalRecords}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">الإجمالي</div>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">{syncedRecords}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">تم المزامنة</div>
                </div>
                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">{pendingRecords}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">معلق</div>
                </div>
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">{failedRecords}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">فشل</div>
                </div>
            </div>

            {/* آخر مزامنة */}
            {lastSyncTime && (
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-left">
                    آخر مزامنة: {new Date(lastSyncTime).toLocaleString('ar-SA')}
                </div>
            )}
        </div>
    );
}

/**
 * SyncTemplateInfo - معلومات قالب المزامنة
 * يعرض رقم القالب المستخدم للمزامنة مع شامل
 */
export function SyncTemplateInfo({ templateId, templateName }) {
    return (
        <div className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-mono">
                T{templateId}
            </span>
            {templateName && <span>{templateName}</span>}
        </div>
    );
}

export default {
    SyncStatusBadge,
    SyncStatusIndicator,
    SyncSummaryCard,
    SyncTemplateInfo
};
