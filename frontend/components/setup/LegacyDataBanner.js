import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * LegacyDataBanner - شريط تنبيه البيانات التاريخية
 * يظهر في أعلى أقسام البيانات المنقولة من الأنظمة السابقة
 * لتنبيه المستخدم أن هذه البيانات للاطلاع فقط
 */
const LegacyDataBanner = memo(function LegacyDataBanner({
    sourceSystem,
    importDate,
    recordCount,
    darkMode = false,
}) {
    const formattedDate = importDate
        ? new Date(importDate).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : null;

    return (
        <div
            dir="rtl"
            className={`
                rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3
                ${darkMode
                    ? 'bg-yellow-900/30 border-yellow-700/50 text-yellow-200'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900'
                }
            `}
            role="alert"
            aria-label="تنبيه بيانات النظام السابق"
        >
            {/* أيقونة التحذير */}
            <div
                className={`
                    flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                    ${darkMode
                        ? 'bg-yellow-800/50 text-yellow-300'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                    }
                `}
                aria-hidden="true"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>

            {/* المحتوى */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-relaxed">
                    بيانات من النظام السابق ({sourceSystem})
                </p>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-yellow-300/70' : 'text-amber-700'}`}>
                    هذه البيانات للاطلاع فقط ولا يمكن تعديلها
                </p>
            </div>

            {/* معلومات الاستيراد */}
            <div className="flex items-center gap-4 flex-shrink-0 text-xs">
                {formattedDate && (
                    <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formattedDate}</span>
                    </div>
                )}
                {recordCount !== undefined && recordCount !== null && (
                    <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{recordCount.toLocaleString('ar-SA')} سجل</span>
                    </div>
                )}
            </div>
        </div>
    );
});

LegacyDataBanner.displayName = 'LegacyDataBanner';

LegacyDataBanner.propTypes = {
    /** اسم النظام المصدر */
    sourceSystem: PropTypes.string.isRequired,
    /** تاريخ الاستيراد */
    importDate: PropTypes.string,
    /** عدد السجلات */
    recordCount: PropTypes.number,
    /** الوضع الداكن */
    darkMode: PropTypes.bool,
};

export default LegacyDataBanner;
