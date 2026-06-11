/**
 * منطق إدراج سجلات الحضور المشترك
 * يُستخدم من:
 *   - devices.js (PULL sync via ZKTeco UDP/TCP)
 *   - agent-sync.js (Local Agent)
 *   - iclock/[...path].js (PUSH/ADMS protocol)
 *
 * يحسب تلقائياً:
 *   - LateMinutes (دقائق التأخير)
 *   - EarlyLeaveMinutes (دقائق الخروج المبكر)
 *   - OvertimeHours (ساعات العمل الإضافي)
 */

import { sqlcmdJson, sqlcmdExec, escapeSql, safeIntVal } from '@/lib/sqlcmd';

const DB = 'Masarat_HR';

/** Default shift if no DB shift found */
const DEFAULT_SHIFT = {
    StartTime: '07:30:00',
    EndTime: '14:30:00',
    GracePeriodMinutes: 15,
    OvertimeStartAfterMinutes: 30,
};

/** Cache shifts per tenant to avoid repeated DB queries (expires every 5 min) */
const shiftCache = new Map();
const SHIFT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * جلب وردية المستأجر الافتراضية (مع تخزين مؤقت)
 */
async function getDefaultShift(tenantId) {
    const safeTenant = safeIntVal(tenantId);
    const cacheKey = `shift_${safeTenant}`;
    const cached = shiftCache.get(cacheKey);

    if (cached && (Date.now() - cached.ts < SHIFT_CACHE_TTL)) {
        return cached.data;
    }

    try {
        const rows = await sqlcmdJson(
            `SELECT TOP 1
                CAST(StartTime AS VARCHAR(8)) AS StartTime,
                CAST(EndTime AS VARCHAR(8)) AS EndTime,
                GracePeriodMinutes,
                OvertimeStartAfterMinutes
             FROM HR.WorkShifts
             WHERE TenantId = ${safeTenant}
               AND IsDefault = 1 AND IsActive = 1 AND IsDeleted = 0
             FOR JSON PATH`, DB, []
        );

        const shift = (rows && rows[0]) ? rows[0] : DEFAULT_SHIFT;
        shiftCache.set(cacheKey, { data: shift, ts: Date.now() });
        return shift;
    } catch (err) {
        console.warn('[AttendanceInsert] Shift query failed, using default:', err.message);
        return DEFAULT_SHIFT;
    }
}

/**
 * تحويل وقت نصي إلى دقائق من منتصف الليل
 * "07:30:00" → 450, "14:30" → 870
 */
function timeToMinutes(timeStr) {
    if (!timeStr) return null;
    const parts = String(timeStr).split(':');
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    return h * 60 + m;
}

/**
 * يبحث عن EmployeeId بناءً على userId من جهاز البصمة
 * يبحث أولاً بـ EmployeeNumber ثم بـ Id
 *
 * @param {string|number} userId - معرف المستخدم من جهاز البصمة
 * @param {number} tenantId - معرف المستأجر
 * @returns {Promise<number|null>} EmployeeId أو null
 */
export async function resolveEmployeeId(userId, tenantId) {
    if (!userId && userId !== 0) return null;
    const safeTenant = safeIntVal(tenantId);
    const safeUserId = escapeSql(String(userId));

    const rows = await sqlcmdJson(
        `SELECT TOP 1 Id FROM dbo.Employees
         WHERE TenantId = ${safeTenant} AND IsDeleted = 0
           AND (EmployeeNumber = ${safeUserId} OR CAST(Id AS NVARCHAR) = ${safeUserId})
         FOR JSON PATH`, DB, []
    );
    return (rows && rows[0]) ? rows[0].Id : null;
}

/**
 * حساب دقائق التأخير عند تسجيل الدخول
 * @returns {number} دقائق التأخير (0 إذا في الوقت أو قبله)
 */
function calculateLateMinutes(checkInTime, shift) {
    const checkInMin = timeToMinutes(checkInTime);
    const shiftStartMin = timeToMinutes(shift.StartTime);
    const grace = parseInt(shift.GracePeriodMinutes) || 0;

    if (checkInMin === null || shiftStartMin === null) return 0;

    const lateBy = checkInMin - shiftStartMin;
    // إذا وصل بعد وقت البداية + فترة السماح → تأخير
    if (lateBy > grace) {
        return lateBy; // التأخير الكلي من بداية الوردية (وليس من نهاية السماح)
    }
    return 0;
}

/**
 * حساب دقائق الخروج المبكر عند تسجيل الخروج
 * @returns {number} دقائق الخروج المبكر (0 إذا في الوقت أو بعده)
 */
function calculateEarlyLeave(checkOutTime, shift) {
    const checkOutMin = timeToMinutes(checkOutTime);
    const shiftEndMin = timeToMinutes(shift.EndTime);

    if (checkOutMin === null || shiftEndMin === null) return 0;

    if (checkOutMin < shiftEndMin) {
        return shiftEndMin - checkOutMin;
    }
    return 0;
}

/**
 * حساب ساعات العمل الإضافي عند تسجيل الخروج
 * @returns {number} ساعات العمل الإضافي (0 إذا لم يتجاوز الحد الأدنى)
 */
function calculateOvertime(checkOutTime, shift) {
    const checkOutMin = timeToMinutes(checkOutTime);
    const shiftEndMin = timeToMinutes(shift.EndTime);
    const otMinThreshold = parseInt(shift.OvertimeStartAfterMinutes) || 30;

    if (checkOutMin === null || shiftEndMin === null) return 0;

    const extraMinutes = checkOutMin - shiftEndMin;
    // يجب أن يتجاوز الحد الأدنى (30 دقيقة افتراضياً)
    if (extraMinutes >= otMinThreshold) {
        // ساعات العمل الإضافي (بحد أقصى 3 ساعات يومياً)
        const hours = Math.round((extraMinutes / 60) * 100) / 100;
        return Math.min(hours, 3.0);
    }
    return 0;
}

/**
 * إدراج أو تحديث سجل حضور مع حسابات التأخير والخروج المبكر والعمل الإضافي
 *
 * @param {object} params
 * @param {number} params.employeeId - معرف الموظف
 * @param {string} params.date - التاريخ بصيغة YYYY-MM-DD
 * @param {string} params.time - الوقت بصيغة HH:mm:ss أو HH:mm
 * @param {number} params.punchType - 0,2,4=CheckIn / 1,3,5=CheckOut
 * @param {number} params.source - 1=biometric, 2=mobile, 0=manual
 * @param {number} params.tenantId
 * @param {string} [params.createdBy='BiometricSync']
 * @param {number|null} [params.verifyType=null]
 * @param {number|null} [params.deviceId=null] - معرف جهاز البصمة
 * @param {string|null} [params.deviceName=null] - اسم جهاز البصمة
 * @returns {Promise<boolean>} true إذا تم الإدراج/التحديث بنجاح
 */
export async function insertAttendanceRecord({
    employeeId, date, time, punchType, source = 1, tenantId, createdBy = 'BiometricSync', verifyType = null,
    deviceId = null, deviceName = null
}) {
    const safeEmpId = safeIntVal(employeeId);
    const safeTenant = safeIntVal(tenantId);
    const safeDate = escapeSql(date);
    const safeTime = escapeSql(time);
    const safeCreator = escapeSql(createdBy);

    if (safeEmpId === 'NULL' || safeTenant === 'NULL') return false;

    const isCheckIn = (punchType === 0 || punchType === 2 || punchType === 4);
    const isCheckOut = (punchType === 1 || punchType === 3 || punchType === 5);

    if (!isCheckIn && !isCheckOut) return false;

    const safeVerify = verifyType !== null && verifyType !== undefined ? safeIntVal(verifyType) : 'NULL';
    const safeDeviceId = deviceId ? safeIntVal(deviceId) : 'NULL';
    const safeDeviceName = deviceName ? escapeSql(deviceName) : 'NULL';

    // فحص حظر الجهاز — إذا الموظف محظور على هذا الجهاز يتم رفض السجل
    if (deviceId) {
        try {
            const blocked = await sqlcmdJson(
                `SELECT TOP 1 Id FROM HR.BiometricDeviceRestrictions
                 WHERE TenantId = ${safeTenant} AND EmployeeId = ${safeEmpId}
                   AND DeviceId = ${safeDeviceId} AND IsBlocked = 1
                 FOR JSON PATH`, DB, []
            );
            if (blocked && blocked.length > 0) {
                console.warn(`[AttendanceInsert] Employee ${employeeId} BLOCKED on device ${deviceId} (${deviceName})`);
                return false; // مرفوض — الموظف محظور على هذا الجهاز
            }
        } catch (err) {
            // إذا الجدول غير موجود أو خطأ، نتابع بدون فحص
            console.warn('[AttendanceInsert] Restriction check failed:', err.message);
        }
    }

    // جلب الوردية لحساب التأخير/الخروج المبكر/العمل الإضافي
    const shift = await getDefaultShift(tenantId);

    if (isCheckIn) {
        const lateMinutes = calculateLateMinutes(time, shift);

        await sqlcmdExec(`
            IF NOT EXISTS (
                SELECT 1 FROM dbo.Attendances
                WHERE EmployeeId = ${safeEmpId} AND [Date] = ${safeDate} AND TenantId = ${safeTenant}
            )
                INSERT INTO dbo.Attendances
                    (EmployeeId, [Date], CheckInTime, LateMinutes, Status, Source, VerifyType, BiometricDeviceId, BiometricDeviceName, TenantId, IsDeleted, CreatedAt, CreatedBy)
                VALUES
                    (${safeEmpId}, ${safeDate}, ${safeTime}, ${lateMinutes}, 1, ${safeIntVal(source)}, ${safeVerify}, ${safeDeviceId}, ${safeDeviceName}, ${safeTenant}, 0, GETDATE(), ${safeCreator})
            ELSE
                UPDATE dbo.Attendances
                SET CheckInTime = ${safeTime},
                    LateMinutes = ${lateMinutes},
                    Source = ${safeIntVal(source)},
                    VerifyType = ${safeVerify},
                    BiometricDeviceId = COALESCE(${safeDeviceId}, BiometricDeviceId),
                    BiometricDeviceName = COALESCE(${safeDeviceName}, BiometricDeviceName),
                    LastModifiedAt = GETDATE(),
                    LastModifiedBy = ${safeCreator}
                WHERE EmployeeId = ${safeEmpId} AND [Date] = ${safeDate} AND TenantId = ${safeTenant}
                  AND CheckInTime IS NULL;
        `, DB);
    } else {
        const earlyLeave = calculateEarlyLeave(time, shift);
        const overtime = calculateOvertime(time, shift);

        await sqlcmdExec(`
            IF EXISTS (
                SELECT 1 FROM dbo.Attendances
                WHERE EmployeeId = ${safeEmpId} AND [Date] = ${safeDate} AND TenantId = ${safeTenant}
            )
                UPDATE dbo.Attendances
                SET CheckOutTime = ${safeTime},
                    EarlyLeaveMinutes = ${earlyLeave},
                    OvertimeHours = ${overtime},
                    Source = ${safeIntVal(source)},
                    VerifyType = ${safeVerify},
                    BiometricDeviceId = COALESCE(${safeDeviceId}, BiometricDeviceId),
                    BiometricDeviceName = COALESCE(${safeDeviceName}, BiometricDeviceName),
                    LastModifiedAt = GETDATE(),
                    LastModifiedBy = ${safeCreator}
                WHERE EmployeeId = ${safeEmpId} AND [Date] = ${safeDate} AND TenantId = ${safeTenant}
            ELSE
                INSERT INTO dbo.Attendances
                    (EmployeeId, [Date], CheckOutTime, EarlyLeaveMinutes, OvertimeHours, Status, Source, VerifyType, BiometricDeviceId, BiometricDeviceName, TenantId, IsDeleted, CreatedAt, CreatedBy)
                VALUES
                    (${safeEmpId}, ${safeDate}, ${safeTime}, ${earlyLeave}, ${overtime}, 1, ${safeIntVal(source)}, ${safeVerify}, ${safeDeviceId}, ${safeDeviceName}, ${safeTenant}, 0, GETDATE(), ${safeCreator});
        `, DB);
    }

    return true;
}

/**
 * إعادة حساب سجلات الحضور الموجودة (تُستخدم لتحديث السجلات القديمة)
 *
 * @param {number} tenantId
 * @returns {Promise<{ updated: number }>}
 */
export async function recalculateAttendanceRecords(tenantId) {
    const safeTenant = safeIntVal(tenantId);
    const shift = await getDefaultShift(tenantId);

    const shiftStartMin = timeToMinutes(shift.StartTime);
    const shiftEndMin = timeToMinutes(shift.EndTime);
    const grace = parseInt(shift.GracePeriodMinutes) || 0;
    const otThreshold = parseInt(shift.OvertimeStartAfterMinutes) || 30;

    // تحديث LateMinutes لكل سجل فيه CheckInTime
    await sqlcmdExec(`
        UPDATE dbo.Attendances
        SET LateMinutes = CASE
            WHEN DATEDIFF(MINUTE, CAST(${escapeSql(shift.StartTime)} AS TIME), CheckInTime) > ${grace}
            THEN DATEDIFF(MINUTE, CAST(${escapeSql(shift.StartTime)} AS TIME), CheckInTime)
            ELSE 0
        END
        WHERE TenantId = ${safeTenant} AND IsDeleted = 0
          AND CheckInTime IS NOT NULL;
    `, DB);

    // تحديث EarlyLeaveMinutes و OvertimeHours لكل سجل فيه CheckOutTime
    await sqlcmdExec(`
        UPDATE dbo.Attendances
        SET EarlyLeaveMinutes = CASE
                WHEN DATEDIFF(MINUTE, CheckOutTime, CAST(${escapeSql(shift.EndTime)} AS TIME)) > 0
                THEN DATEDIFF(MINUTE, CheckOutTime, CAST(${escapeSql(shift.EndTime)} AS TIME))
                ELSE 0
            END,
            OvertimeHours = CASE
                WHEN DATEDIFF(MINUTE, CAST(${escapeSql(shift.EndTime)} AS TIME), CheckOutTime) >= ${otThreshold}
                THEN CAST(ROUND(CAST(DATEDIFF(MINUTE, CAST(${escapeSql(shift.EndTime)} AS TIME), CheckOutTime) AS DECIMAL(10,2)) / 60.0, 2) AS DECIMAL(5,2))
                ELSE 0
            END
        WHERE TenantId = ${safeTenant} AND IsDeleted = 0
          AND CheckOutTime IS NOT NULL;
    `, DB);

    // عد السجلات المحدثة
    const countRows = await sqlcmdJson(`
        SELECT COUNT(*) AS cnt FROM dbo.Attendances
        WHERE TenantId = ${safeTenant} AND IsDeleted = 0
          AND (CheckInTime IS NOT NULL OR CheckOutTime IS NOT NULL)
        FOR JSON PATH
    `, DB, []);

    return { updated: (countRows && countRows[0]) ? countRows[0].cnt : 0 };
}

/**
 * معالجة مجموعة سجلات حضور دفعة واحدة
 *
 * @param {Array} records - مصفوفة { userId, dateTime, punchType }
 * @param {number} tenantId
 * @param {string} [createdBy='BiometricSync']
 * @param {object} [deviceInfo=null] - { id, name } معلومات جهاز البصمة
 * @returns {Promise<{ inserted: number, skipped: number, errors: number }>}
 */
export async function processBatchRecords(records, tenantId, createdBy = 'BiometricSync', deviceInfo = null) {
    let inserted = 0, skipped = 0, errors = 0;

    for (const rec of records) {
        try {
            // Parse dateTime: "2026-03-11 08:00:00" or separate date/time
            let date, time;
            if (rec.dateTime) {
                const parts = String(rec.dateTime).split(' ');
                date = parts[0]; // YYYY-MM-DD
                time = parts[1] || '00:00:00'; // HH:mm:ss
            } else {
                date = rec.date;
                time = rec.time;
            }

            if (!date || !rec.userId) { skipped++; continue; }

            const employeeId = await resolveEmployeeId(rec.userId, tenantId);
            if (!employeeId) { skipped++; continue; }

            const ok = await insertAttendanceRecord({
                employeeId, date, time,
                punchType: parseInt(rec.punchType) || 0,
                verifyType: rec.verifyType !== undefined ? parseInt(rec.verifyType) : null,
                source: 1, tenantId, createdBy,
                deviceId: deviceInfo?.id || null,
                deviceName: deviceInfo?.name || null,
            });
            if (ok) inserted++; else skipped++;
        } catch (err) {
            console.error(`[AttendanceInsert] Error for userId ${rec.userId}:`, err.message);
            errors++;
        }
    }

    return { inserted, skipped, errors };
}
