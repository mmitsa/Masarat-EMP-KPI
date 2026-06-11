/**
 * Rich Message Components
 * مكونات الرسائل الغنية للمساعد الذكي
 */

import React from 'react';

/**
 * بطاقة رصيد الإجازات
 */
export function LeaveBalanceCard({ data }) {
    if (!data) return null;

    return (
        <div className="grid grid-cols-3 gap-3 my-3" dir="rtl">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.annual || 0}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">إجازة سنوية</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{data.sick || 0}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">إجازة مرضية</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{data.usedThisYear || 0}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">مستخدمة</div>
            </div>
        </div>
    );
}

/**
 * جدول بيانات
 */
export function DataTableMessage({ data, columns }) {
    if (!data || data.length === 0) return null;

    // استنتاج الأعمدة إذا لم تُحدد
    const cols = columns || Object.keys(data[0]).map(key => ({
        key,
        label: key,
    }));

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 my-3" dir="rtl">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        {cols.map(col => (
                            <th
                                key={col.key}
                                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                            {cols.map(col => (
                                <td key={col.key} className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                    {row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {data.length > 10 && (
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
                    يُعرض 10 من {data.length} نتيجة
                </div>
            )}
        </div>
    );
}

/**
 * قائمة العهد
 */
export function CustodiesCard({ data }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="space-y-2 my-3" dir="rtl">
            {data.map((custody, idx) => (
                <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            📦
                        </div>
                        <div>
                            <div className="font-medium text-gray-900 dark:text-white">{custody.itemName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">الكمية: {custody.quantity}</div>
                        </div>
                    </div>
                    {custody.value && (
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                            {custody.value.toLocaleString('ar-SA')} ر.س
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

/**
 * بطاقة طلب إجازة
 */
export function LeaveRequestCard({ data }) {
    if (!data) return null;

    const statusColors = {
        pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
        approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
        rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    };

    const statusLabels = {
        pending: 'قيد الانتظار',
        approved: 'تمت الموافقة',
        rejected: 'مرفوض',
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 my-3" dir="rtl">
            <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-gray-900 dark:text-white">{data.leaveType}</div>
                <span className={`px-2 py-1 rounded-full text-xs ${statusColors[data.status] || statusColors.pending}`}>
                    {statusLabels[data.status] || data.status}
                </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>من {data.startDate} إلى {data.endDate}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>⏱️</span>
                    <span>{data.daysCount} {data.daysCount > 10 ? 'يوم' : 'أيام'}</span>
                </div>
                {data.requestId && (
                    <div className="flex items-center gap-2">
                        <span>🔢</span>
                        <span>رقم الطلب: {data.requestId}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * قائمة المركبات المتاحة
 */
export function VehiclesCard({ data }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="grid grid-cols-2 gap-3 my-3" dir="rtl">
            {data.map((vehicle, idx) => (
                <div
                    key={idx}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🚗</span>
                        <div>
                            <div className="font-medium text-gray-900 dark:text-white">{vehicle.type}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{vehicle.plateNumber}</div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">السعة: {vehicle.capacity}</span>
                        <span className="text-green-600 dark:text-green-400 text-xs">متاحة</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * أزرار الإجراءات
 */
export function ActionButtons({ actions, onAction }) {
    if (!actions || actions.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-3" dir="rtl">
            {actions.map((action, idx) => (
                <button
                    key={idx}
                    onClick={() => onAction(action)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                        ${action.primary
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-200'
                        }`}
                >
                    {action.icon && <span>{action.icon}</span>}
                    {action.label}
                </button>
            ))}
        </div>
    );
}

/**
 * رسالة التأكيد
 */
export function ConfirmationMessage({ message, onConfirm, onCancel }) {
    return (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 my-3" dir="rtl">
            <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                    <div className="font-medium text-amber-800 dark:text-amber-200 mb-2">تأكيد الإجراء</div>
                    <div className="text-sm text-amber-700 whitespace-pre-line">{message}</div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                        >
                            ✅ تأكيد
                        </button>
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 bg-gray-200 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                        >
                            ❌ إلغاء
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * رسالة النجاح
 */
export function SuccessMessage({ message, details, nextSteps }) {
    return (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 my-3" dir="rtl">
            <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div className="flex-1">
                    <div className="font-medium text-green-800 dark:text-green-200 mb-2">{message}</div>
                    {details && details.length > 0 && (
                        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 mb-2">
                            {details.map((detail, idx) => (
                                <li key={idx}>{detail}</li>
                            ))}
                        </ul>
                    )}
                    {nextSteps && nextSteps.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                            <div className="text-xs text-green-600 dark:text-green-400 mb-1">الخطوات التالية:</div>
                            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                                {nextSteps.map((step, idx) => (
                                    <li key={idx}>• {step}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * رسالة الخطأ
 */
export function ErrorMessage({ error, suggestion }) {
    return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 my-3" dir="rtl">
            <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div className="flex-1">
                    <div className="font-medium text-red-800 dark:text-red-200 mb-1">{error}</div>
                    {suggestion && (
                        <div className="text-sm text-red-600 dark:text-red-400">{suggestion}</div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * الإجراءات السريعة
 */
export function QuickActions({ actions, onAction }) {
    if (!actions || actions.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-4" dir="rtl">
            {actions.map((action, idx) => (
                <button
                    key={idx}
                    onClick={() => onAction(action)}
                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                    {action.label}
                </button>
            ))}
        </div>
    );
}

/**
 * مؤشر الكتابة
 */
export function TypingIndicator() {
    return (
        <div className="flex items-center gap-1 p-3" dir="rtl">
            <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">يكتب...</span>
        </div>
    );
}

export default {
    LeaveBalanceCard,
    DataTableMessage,
    CustodiesCard,
    LeaveRequestCard,
    VehiclesCard,
    ActionButtons,
    ConfirmationMessage,
    SuccessMessage,
    ErrorMessage,
    QuickActions,
    TypingIndicator,
};
