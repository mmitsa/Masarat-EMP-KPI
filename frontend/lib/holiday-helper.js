/**
 * Holiday Helper — دالة مساعدة للتحقق من العطلات الرسمية
 * تُستخدم من نظام الحضور وخصومات التأخير لاستبعاد أيام العطلات
 */

import { sqlcmdJson, safeIntVal } from '@/lib/sqlcmd';

const DB = 'Masarat_HR';

/**
 * التحقق هل تاريخ معين عطلة رسمية
 * @param {string} date - التاريخ بصيغة YYYY-MM-DD
 * @param {number} tenantId - معرف المستأجر
 * @returns {Promise<{isHoliday: boolean, holidayName: string|null}>}
 */
export async function isOfficialHoliday(date, tenantId = 1) {
  try {
    const safeTenant = safeIntVal(tenantId);
    const rows = await sqlcmdJson(`
      SELECT TOP 1 NameAr, NameEn, HolidayType
      FROM dbo.OfficialHolidays
      WHERE '${date}' BETWEEN StartDate AND EndDate
        AND IsActive = 1
        AND AffectsAttendance = 1
        AND TenantId = ${safeTenant}
    `, DB);

    if (rows && rows.length > 0) {
      return {
        isHoliday: true,
        holidayName: rows[0].NameAr || rows[0].NameEn,
        holidayType: rows[0].HolidayType,
      };
    }
    return { isHoliday: false, holidayName: null, holidayType: null };
  } catch (err) {
    // إذا الجدول غير موجود (error 208)، نرجع false
    if (String(err).includes('208')) {
      return { isHoliday: false, holidayName: null, holidayType: null };
    }
    console.error('[holiday-helper] Error:', err.message);
    return { isHoliday: false, holidayName: null, holidayType: null };
  }
}

/**
 * جلب جميع العطلات لشهر معين
 * @param {number} month - الشهر (1-12)
 * @param {number} year - السنة
 * @param {number} tenantId - معرف المستأجر
 * @returns {Promise<Array>} قائمة تواريخ العطلات
 */
export async function getHolidaysForMonth(month, year, tenantId = 1) {
  try {
    const safeTenant = safeIntVal(tenantId);
    const safeMonth = safeIntVal(month);
    const safeYear = safeIntVal(year);

    const rows = await sqlcmdJson(`
      SELECT NameAr, NameEn, HolidayType, StartDate, EndDate, TotalDays
      FROM dbo.OfficialHolidays
      WHERE IsActive = 1
        AND AffectsAttendance = 1
        AND TenantId = ${safeTenant}
        AND (
          (YEAR(StartDate) = ${safeYear} AND MONTH(StartDate) = ${safeMonth})
          OR (YEAR(EndDate) = ${safeYear} AND MONTH(EndDate) = ${safeMonth})
          OR (StartDate <= CAST('${year}-${String(month).padStart(2, '0')}-01' AS DATE)
              AND EndDate >= EOMONTH(CAST('${year}-${String(month).padStart(2, '0')}-01' AS DATE)))
        )
      ORDER BY StartDate ASC
    `, DB);

    // توسيع كل عطلة لقائمة تواريخ فردية
    const holidayDates = new Set();
    const holidayMap = {};

    for (const h of (rows || [])) {
      const start = new Date(h.StartDate);
      const end = new Date(h.EndDate);
      const current = new Date(start);

      while (current <= end) {
        if (current.getMonth() + 1 === parseInt(month) && current.getFullYear() === parseInt(year)) {
          const dateStr = current.toISOString().split('T')[0];
          holidayDates.add(dateStr);
          holidayMap[dateStr] = h.NameAr || h.NameEn;
        }
        current.setDate(current.getDate() + 1);
      }
    }

    return {
      dates: Array.from(holidayDates),
      map: holidayMap,
      count: holidayDates.size,
    };
  } catch (err) {
    if (String(err).includes('208')) {
      return { dates: [], map: {}, count: 0 };
    }
    console.error('[holiday-helper] getHolidaysForMonth Error:', err.message);
    return { dates: [], map: {}, count: 0 };
  }
}

/**
 * التحقق هل يوم معين هو يوم عطلة نهاية أسبوع (الجمعة والسبت في السعودية)
 * @param {string} date - التاريخ بصيغة YYYY-MM-DD
 * @returns {boolean}
 */
export function isWeekend(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
  return day === 5 || day === 6; // الجمعة والسبت
}

/**
 * حساب أيام العمل الفعلية في شهر (بعد استبعاد العطلات وأيام الأسبوع)
 * @param {number} month
 * @param {number} year
 * @param {number} tenantId
 * @returns {Promise<{workingDays: number, holidays: number, weekends: number}>}
 */
export async function getWorkingDaysInMonth(month, year, tenantId = 1) {
  const holidays = await getHolidaysForMonth(month, year, tenantId);
  const daysInMonth = new Date(year, month, 0).getDate();

  let weekends = 0;
  let holidayCount = 0;
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isWknd = isWeekend(dateStr);
    const isHol = holidays.dates.includes(dateStr);

    if (isWknd) {
      weekends++;
    } else if (isHol) {
      holidayCount++;
    } else {
      workingDays++;
    }
  }

  return {
    workingDays,
    holidays: holidayCount,
    weekends,
    totalDays: daysInMonth,
    holidayDetails: holidays.map,
  };
}
