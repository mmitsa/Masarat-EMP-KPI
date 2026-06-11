/**
 * أدوات التاريخ الهجري
 * Hijri Date Utilities
 *
 * يستخدم خوارزمية أم القرى للتحويل بين التاريخ الهجري والميلادي
 * Uses Umm al-Qura algorithm for Hijri-Gregorian conversion
 */

// أسماء الأشهر الهجرية
export const HIJRI_MONTHS = [
    { id: 1, name: 'محرم', nameEn: 'Muharram' },
    { id: 2, name: 'صفر', nameEn: 'Safar' },
    { id: 3, name: 'ربيع الأول', nameEn: 'Rabi al-Awwal' },
    { id: 4, name: 'ربيع الثاني', nameEn: 'Rabi al-Thani' },
    { id: 5, name: 'جمادى الأولى', nameEn: 'Jumada al-Awwal' },
    { id: 6, name: 'جمادى الآخرة', nameEn: 'Jumada al-Thani' },
    { id: 7, name: 'رجب', nameEn: 'Rajab' },
    { id: 8, name: 'شعبان', nameEn: 'Shaban' },
    { id: 9, name: 'رمضان', nameEn: 'Ramadan' },
    { id: 10, name: 'شوال', nameEn: 'Shawwal' },
    { id: 11, name: 'ذو القعدة', nameEn: 'Dhul-Qadah' },
    { id: 12, name: 'ذو الحجة', nameEn: 'Dhul-Hijjah' },
];

// أسماء أيام الأسبوع بالعربية
export const WEEKDAY_NAMES = [
    { id: 0, name: 'الأحد', nameEn: 'Sunday' },
    { id: 1, name: 'الاثنين', nameEn: 'Monday' },
    { id: 2, name: 'الثلاثاء', nameEn: 'Tuesday' },
    { id: 3, name: 'الأربعاء', nameEn: 'Wednesday' },
    { id: 4, name: 'الخميس', nameEn: 'Thursday' },
    { id: 5, name: 'الجمعة', nameEn: 'Friday' },
    { id: 6, name: 'السبت', nameEn: 'Saturday' },
];

/**
 * تحويل التاريخ الميلادي إلى هجري
 * يستخدم API المتصفح المدمج
 * @param {Date|string} gregorianDate - التاريخ الميلادي
 * @returns {Object} التاريخ الهجري {day, month, year, monthName}
 */
export function toHijri(gregorianDate) {
    const date = typeof gregorianDate === 'string' ? new Date(gregorianDate) : gregorianDate;

    if (isNaN(date.getTime())) {
        return null;
    }

    try {
        // استخدام Intl.DateTimeFormat للتحويل
        const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        const parts = formatter.formatToParts(date);
        const result = {};

        for (const part of parts) {
            if (part.type === 'day') result.day = parseInt(part.value);
            if (part.type === 'month') result.monthName = part.value;
            if (part.type === 'year') result.year = parseInt(part.value);
        }

        // إيجاد رقم الشهر
        result.month = HIJRI_MONTHS.findIndex(m => m.name === result.monthName) + 1;
        if (result.month === 0) {
            // محاولة مطابقة جزئية
            result.month = HIJRI_MONTHS.findIndex(m =>
                result.monthName?.includes(m.name) || m.name.includes(result.monthName)
            ) + 1;
        }

        return result;
    } catch (error) {
        console.error('خطأ في تحويل التاريخ الهجري:', error);
        return null;
    }
}

/**
 * تنسيق التاريخ الهجري كنص
 * @param {Date|string} gregorianDate - التاريخ الميلادي
 * @param {string} format - صيغة التنسيق ('full', 'short', 'numeric')
 * @returns {string} التاريخ الهجري منسقاً
 */
export function formatHijri(gregorianDate, format = 'full') {
    const date = typeof gregorianDate === 'string' ? new Date(gregorianDate) : gregorianDate;

    if (isNaN(date.getTime())) {
        return '';
    }

    try {
        const options = {
            calendar: 'islamic-umalqura',
        };

        switch (format) {
            case 'full':
                options.day = 'numeric';
                options.month = 'long';
                options.year = 'numeric';
                options.weekday = 'long';
                break;
            case 'short':
                options.day = 'numeric';
                options.month = 'short';
                options.year = 'numeric';
                break;
            case 'numeric':
                options.day = '2-digit';
                options.month = '2-digit';
                options.year = 'numeric';
                break;
            default:
                options.day = 'numeric';
                options.month = 'long';
                options.year = 'numeric';
        }

        return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', options).format(date);
    } catch (error) {
        console.error('خطأ في تنسيق التاريخ الهجري:', error);
        return '';
    }
}

/**
 * تنسيق التاريخ الميلادي كنص
 * @param {Date|string} date - التاريخ
 * @param {string} format - صيغة التنسيق
 * @returns {string} التاريخ الميلادي منسقاً
 */
export function formatGregorian(date, format = 'full') {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
        return '';
    }

    try {
        const options = {};

        switch (format) {
            case 'full':
                options.day = 'numeric';
                options.month = 'long';
                options.year = 'numeric';
                options.weekday = 'long';
                break;
            case 'short':
                options.day = 'numeric';
                options.month = 'short';
                options.year = 'numeric';
                break;
            case 'numeric':
                options.day = '2-digit';
                options.month = '2-digit';
                options.year = 'numeric';
                break;
            default:
                options.day = 'numeric';
                options.month = 'long';
                options.year = 'numeric';
        }

        return new Intl.DateTimeFormat('ar-SA', options).format(d);
    } catch (error) {
        console.error('خطأ في تنسيق التاريخ الميلادي:', error);
        return '';
    }
}

/**
 * تنسيق التاريخ بالصيغتين (هجري + ميلادي)
 * @param {Date|string} date - التاريخ
 * @param {Object} options - خيارات التنسيق
 * @returns {Object} {hijri, gregorian, combined}
 */
export function formatDualDate(date, options = {}) {
    const { format = 'short', separator = ' | ' } = options;

    const hijri = formatHijri(date, format);
    const gregorian = formatGregorian(date, format);

    return {
        hijri,
        gregorian,
        combined: `${hijri}${separator}${gregorian}`,
    };
}

/**
 * الحصول على اسم اليوم بالعربية
 * @param {Date|string} date - التاريخ
 * @returns {string} اسم اليوم
 */
export function getWeekdayName(date) {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
        return '';
    }

    return WEEKDAY_NAMES[d.getDay()]?.name || '';
}

/**
 * الحصول على اسم الشهر الهجري
 * @param {number} month - رقم الشهر (1-12)
 * @returns {string} اسم الشهر
 */
export function getHijriMonthName(month) {
    return HIJRI_MONTHS[month - 1]?.name || '';
}

/**
 * التحقق من صحة التاريخ
 * @param {Date|string} date - التاريخ للتحقق منه
 * @returns {boolean}
 */
export function isValidDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d instanceof Date && !isNaN(d.getTime());
}

/**
 * الحصول على التاريخ الحالي بالصيغتين
 * @returns {Object}
 */
export function getCurrentDualDate() {
    return formatDualDate(new Date());
}

/**
 * مكون React لعرض التاريخ المزدوج
 */
export function DualDateDisplay({ date, format = 'short', className = '' }) {
    if (!date) return null;

    const { hijri, gregorian } = formatDualDate(date, { format });

    return (
        <div className={`dual-date ${className}`}>
            <div className="text-sm">{hijri}</div>
            <div className="text-xs text-gray-400">{gregorian}</div>
        </div>
    );
}

/**
 * تنسيق التاريخ المزدوج كنص (هجري أولاً ثم ميلادي)
 * يُستخدم في كل مكان بدلاً من toLocaleDateString
 *
 * @param {Date|string} date - التاريخ
 * @param {string} [fallback='-'] - القيمة الافتراضية إذا كان التاريخ فارغاً
 * @returns {string} مثال: "٢٦ ربيع الآخر ١٤٠٣ هـ (2 مايو 1983 م)"
 */
export function fmtDate(date, fallback = '-') {
    if (!date) return fallback;
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return fallback;

    const greg = d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });
    try {
        const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
            day: 'numeric', month: 'long', year: 'numeric',
        }).format(d);
        return `${hijri} \u0647\u0640 (${greg} \u0645)`;
    } catch {
        return greg;
    }
}

export default {
    toHijri,
    formatHijri,
    formatGregorian,
    formatDualDate,
    fmtDate,
    getWeekdayName,
    getHijriMonthName,
    isValidDate,
    getCurrentDualDate,
    HIJRI_MONTHS,
    WEEKDAY_NAMES,
};
