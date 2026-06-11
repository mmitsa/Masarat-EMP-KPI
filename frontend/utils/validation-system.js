/**
 * نظام التحقق من صحة البيانات
 * System Validation for ELtizam & SARF Integration
 */

// ==================== قواعد التحقق من بيانات الموظفين ====================
export const EMPLOYEE_VALIDATION_RULES = {
    nationalId: {
        required: true,
        pattern: /^[12]\d{9}$/,
        message: 'رقم الهوية يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2',
    },
    name: {
        required: true,
        minLength: 5,
        maxLength: 100,
        message: 'اسم الموظف مطلوب (5-100 حرف)',
    },
    bankAccount: {
        required: true,
        pattern: /^SA\d{22}$/,
        message: 'رقم الحساب البنكي (IBAN) غير صحيح - يجب أن يبدأ بـ SA ويتبعه 22 رقم',
    },
    bankCode: {
        required: true,
        pattern: /^\d{2}$/,
        message: 'كود البنك يجب أن يكون رقمين',
    },
    basicSalary: {
        required: true,
        min: 0,
        max: 999999,
        message: 'الراتب الأساسي يجب أن يكون رقم موجب',
    },
    employeeNumber: {
        required: true,
        pattern: /^[A-Z0-9-]{1,20}$/,
        message: 'الرقم الوظيفي غير صحيح',
    },
    email: {
        required: false,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'البريد الإلكتروني غير صحيح',
    },
    phone: {
        required: false,
        pattern: /^(05|966)\d{8,9}$/,
        message: 'رقم الهاتف غير صحيح',
    },
};

// ==================== قواعد التحقق من بيانات الرواتب ====================
export const PAYROLL_VALIDATION_RULES = {
    month: {
        required: true,
        pattern: /^\d{4}-(0[1-9]|1[0-2])$/,
        message: 'الشهر مطلوب بصيغة YYYY-MM',
    },
    basicSalary: {
        required: true,
        min: 0,
        message: 'الراتب الأساسي مطلوب',
    },
    netSalary: {
        required: true,
        min: 0,
        message: 'صافي الراتب مطلوب',
    },
};

// ==================== قواعد التحقق من بيانات الإجازات ====================
export const VACATION_VALIDATION_RULES = {
    employeeId: {
        required: true,
        message: 'رقم الموظف مطلوب',
    },
    vacationType: {
        required: true,
        validValues: ['annual', 'sick', 'unpaid', 'emergency', 'maternity', 'paternity', 'hajj'],
        message: 'نوع الإجازة غير صحيح',
    },
    startDate: {
        required: true,
        pattern: /^\d{4}-\d{2}-\d{2}$/,
        message: 'تاريخ البداية مطلوب بصيغة YYYY-MM-DD',
    },
    endDate: {
        required: true,
        pattern: /^\d{4}-\d{2}-\d{2}$/,
        message: 'تاريخ النهاية مطلوب بصيغة YYYY-MM-DD',
    },
    days: {
        required: true,
        min: 1,
        max: 365,
        message: 'عدد الأيام يجب أن يكون بين 1 و 365',
    },
};

// ==================== قواعد التحقق من بيانات الحضور ====================
export const ATTENDANCE_VALIDATION_RULES = {
    employeeId: {
        required: true,
        message: 'رقم الموظف مطلوب',
    },
    date: {
        required: true,
        pattern: /^\d{4}-\d{2}-\d{2}$/,
        message: 'التاريخ مطلوب بصيغة YYYY-MM-DD',
    },
    checkIn: {
        required: false,
        pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        message: 'وقت الحضور بصيغة HH:MM',
    },
    checkOut: {
        required: false,
        pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        message: 'وقت الانصراف بصيغة HH:MM',
    },
    status: {
        required: true,
        validValues: ['present', 'absent', 'late', 'early_leave', 'vacation', 'sick'],
        message: 'حالة الحضور غير صحيحة',
    },
};

// ==================== أنواع الأخطاء ====================
export const ERROR_TYPES = {
    VALIDATION: 'validation',      // خطأ في التحقق
    CONNECTION: 'connection',      // خطأ في الاتصال
    SERVER: 'server',              // خطأ من الخادم
    DATA_FORMAT: 'data_format',    // خطأ في صيغة البيانات
    MISSING_DATA: 'missing_data',  // بيانات مفقودة
    DUPLICATE: 'duplicate',        // تكرار
    PERMISSION: 'permission',      // صلاحيات
};

// ==================== مستويات الخطورة ====================
export const SEVERITY_LEVELS = {
    ERROR: 'error',      // يمنع التصدير
    WARNING: 'warning',  // تحذير - يمكن المتابعة
    INFO: 'info',        // معلومات
};

// ==================== فئة الخطأ ====================
export class ValidationError {
    constructor({
        type,
        severity,
        field,
        value,
        message,
        messageEn,
        recordId,
        recordName,
        suggestion,
    }) {
        this.type = type;
        this.severity = severity;
        this.field = field;
        this.value = value;
        this.message = message;
        this.messageEn = messageEn;
        this.recordId = recordId;
        this.recordName = recordName;
        this.suggestion = suggestion;
        this.timestamp = new Date().toISOString();
    }
}

// ==================== دوال التحقق ====================

/**
 * التحقق من قيمة واحدة
 */
export function validateField(value, rules) {
    const errors = [];

    if (rules.required && (!value || value.toString().trim() === '')) {
        errors.push('القيمة مطلوبة');
    }

    if (value && rules.pattern && !rules.pattern.test(value.toString())) {
        errors.push(rules.message);
    }

    if (value && rules.minLength && value.toString().length < rules.minLength) {
        errors.push(`الحد الأدنى ${rules.minLength} حرف`);
    }

    if (value && rules.maxLength && value.toString().length > rules.maxLength) {
        errors.push(`الحد الأقصى ${rules.maxLength} حرف`);
    }

    if (value !== undefined && value !== null && rules.min !== undefined && parseFloat(value) < rules.min) {
        errors.push(`القيمة يجب أن تكون أكبر من أو تساوي ${rules.min}`);
    }

    if (value !== undefined && value !== null && rules.max !== undefined && parseFloat(value) > rules.max) {
        errors.push(`القيمة يجب أن تكون أقل من أو تساوي ${rules.max}`);
    }

    return errors;
}

/**
 * التحقق من بيانات الموظف
 */
export function validateEmployee(employee) {
    const errors = [];

    // التحقق من رقم الهوية
    if (!employee.nationalId || !/^[12]\d{9}$/.test(employee.nationalId)) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.VALIDATION,
            severity: SEVERITY_LEVELS.ERROR,
            field: 'nationalId',
            value: employee.nationalId,
            message: 'رقم الهوية غير صحيح',
            messageEn: 'Invalid National ID',
            recordId: employee.id,
            recordName: employee.name,
            suggestion: 'تأكد من أن رقم الهوية مكون من 10 أرقام ويبدأ بـ 1 (سعودي) أو 2 (مقيم)',
        }));
    }

    // التحقق من الاسم
    if (!employee.name || employee.name.trim().length < 5) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.MISSING_DATA,
            severity: SEVERITY_LEVELS.ERROR,
            field: 'name',
            value: employee.name,
            message: 'اسم الموظف مفقود أو قصير جداً',
            messageEn: 'Employee name is missing or too short',
            recordId: employee.id,
            recordName: employee.name,
            suggestion: 'أدخل الاسم الكامل للموظف',
        }));
    }

    // التحقق من الحساب البنكي
    if (!employee.bankAccount || !/^SA\d{22}$/.test(employee.bankAccount)) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.VALIDATION,
            severity: SEVERITY_LEVELS.ERROR,
            field: 'bankAccount',
            value: employee.bankAccount,
            message: 'رقم الحساب البنكي (IBAN) غير صحيح',
            messageEn: 'Invalid IBAN',
            recordId: employee.id,
            recordName: employee.name,
            suggestion: 'تأكد من أن رقم الحساب يبدأ بـ SA ويتبعه 22 رقم',
        }));
    }

    // التحقق من كود البنك
    if (!employee.bankCode || !/^\d{2}$/.test(employee.bankCode)) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.VALIDATION,
            severity: SEVERITY_LEVELS.WARNING,
            field: 'bankCode',
            value: employee.bankCode,
            message: 'كود البنك غير صحيح',
            messageEn: 'Invalid bank code',
            recordId: employee.id,
            recordName: employee.name,
            suggestion: 'راجع قائمة أكواد البنوك المعتمدة',
        }));
    }

    // التحقق من الراتب
    if (!employee.basicSalary || employee.basicSalary <= 0) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.VALIDATION,
            severity: SEVERITY_LEVELS.ERROR,
            field: 'basicSalary',
            value: employee.basicSalary,
            message: 'الراتب الأساسي غير صحيح',
            messageEn: 'Invalid basic salary',
            recordId: employee.id,
            recordName: employee.name,
            suggestion: 'تأكد من إدخال قيمة الراتب الأساسي',
        }));
    }

    return errors;
}

/**
 * التحقق من بيانات الراتب
 */
export function validatePayroll(payroll) {
    const errors = [];

    // التحقق من الشهر
    if (!payroll.month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(payroll.month)) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.VALIDATION,
            severity: SEVERITY_LEVELS.ERROR,
            field: 'month',
            value: payroll.month,
            message: 'الشهر غير صحيح',
            messageEn: 'Invalid month format',
            recordId: payroll.employeeId,
            recordName: payroll.employeeName,
            suggestion: 'استخدم صيغة YYYY-MM',
        }));
    }

    // التحقق من صافي الراتب
    if (payroll.netSalary < 0) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.VALIDATION,
            severity: SEVERITY_LEVELS.ERROR,
            field: 'netSalary',
            value: payroll.netSalary,
            message: 'صافي الراتب سالب',
            messageEn: 'Negative net salary',
            recordId: payroll.employeeId,
            recordName: payroll.employeeName,
            suggestion: 'راجع الاستقطاعات - قد تكون أكثر من الراتب',
        }));
    }

    // التحقق من التناسق
    const calculatedNet = (payroll.basicSalary || 0) + (payroll.allowances || 0) - (payroll.deductions || 0);
    if (Math.abs(calculatedNet - (payroll.netSalary || 0)) > 1) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.DATA_FORMAT,
            severity: SEVERITY_LEVELS.WARNING,
            field: 'netSalary',
            value: `متوقع: ${calculatedNet}, فعلي: ${payroll.netSalary}`,
            message: 'صافي الراتب لا يتطابق مع الحسابات',
            messageEn: 'Net salary does not match calculations',
            recordId: payroll.employeeId,
            recordName: payroll.employeeName,
            suggestion: 'راجع حسابات الراتب والبدلات والاستقطاعات',
        }));
    }

    return errors;
}

/**
 * التحقق من بيانات الإجازة
 */
export function validateVacation(vacation) {
    const errors = [];

    // التحقق من رقم الموظف
    if (!vacation.employeeId) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.MISSING_DATA,
            severity: SEVERITY_LEVELS.ERROR,
            field: 'employeeId',
            value: vacation.employeeId,
            message: 'رقم الموظف مفقود',
            messageEn: 'Employee ID is missing',
            recordId: vacation.id,
            recordName: vacation.employeeName,
            suggestion: 'أضف رقم الموظف للإجازة',
        }));
    }

    // التحقق من نوع الإجازة
    const validTypes = ['annual', 'sick', 'unpaid', 'emergency', 'maternity', 'paternity', 'hajj'];
    if (!vacation.vacationType || !validTypes.includes(vacation.vacationType)) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.VALIDATION,
            severity: SEVERITY_LEVELS.ERROR,
            field: 'vacationType',
            value: vacation.vacationType,
            message: 'نوع الإجازة غير صحيح',
            messageEn: 'Invalid vacation type',
            recordId: vacation.id,
            recordName: vacation.employeeName,
            suggestion: `الأنواع المتاحة: سنوية، مرضية، بدون راتب، طارئة، أمومة، أبوة، حج`,
        }));
    }

    // التحقق من التواريخ
    if (!vacation.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(vacation.startDate)) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.VALIDATION,
            severity: SEVERITY_LEVELS.ERROR,
            field: 'startDate',
            value: vacation.startDate,
            message: 'تاريخ البداية غير صحيح',
            messageEn: 'Invalid start date',
            recordId: vacation.id,
            recordName: vacation.employeeName,
            suggestion: 'استخدم صيغة YYYY-MM-DD',
        }));
    }

    if (!vacation.endDate || !/^\d{4}-\d{2}-\d{2}$/.test(vacation.endDate)) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.VALIDATION,
            severity: SEVERITY_LEVELS.ERROR,
            field: 'endDate',
            value: vacation.endDate,
            message: 'تاريخ النهاية غير صحيح',
            messageEn: 'Invalid end date',
            recordId: vacation.id,
            recordName: vacation.employeeName,
            suggestion: 'استخدم صيغة YYYY-MM-DD',
        }));
    }

    // التحقق من أن تاريخ النهاية بعد البداية
    if (vacation.startDate && vacation.endDate) {
        const start = new Date(vacation.startDate);
        const end = new Date(vacation.endDate);
        if (end < start) {
            errors.push(new ValidationError({
                type: ERROR_TYPES.VALIDATION,
                severity: SEVERITY_LEVELS.ERROR,
                field: 'endDate',
                value: `${vacation.startDate} - ${vacation.endDate}`,
                message: 'تاريخ النهاية قبل تاريخ البداية',
                messageEn: 'End date is before start date',
                recordId: vacation.id,
                recordName: vacation.employeeName,
                suggestion: 'تأكد من أن تاريخ النهاية بعد تاريخ البداية',
            }));
        }
    }

    // التحقق من عدد الأيام
    if (vacation.days !== undefined && (vacation.days < 1 || vacation.days > 365)) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.VALIDATION,
            severity: SEVERITY_LEVELS.WARNING,
            field: 'days',
            value: vacation.days,
            message: 'عدد أيام الإجازة غير منطقي',
            messageEn: 'Vacation days out of range',
            recordId: vacation.id,
            recordName: vacation.employeeName,
            suggestion: 'راجع عدد أيام الإجازة',
        }));
    }

    return errors;
}

/**
 * التحقق من بيانات الحضور
 */
export function validateAttendance(attendance) {
    const errors = [];

    // التحقق من رقم الموظف
    if (!attendance.employeeId) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.MISSING_DATA,
            severity: SEVERITY_LEVELS.ERROR,
            field: 'employeeId',
            value: attendance.employeeId,
            message: 'رقم الموظف مفقود',
            messageEn: 'Employee ID is missing',
            recordId: attendance.id,
            recordName: attendance.employeeName,
            suggestion: 'أضف رقم الموظف',
        }));
    }

    // التحقق من التاريخ
    if (!attendance.date || !/^\d{4}-\d{2}-\d{2}$/.test(attendance.date)) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.VALIDATION,
            severity: SEVERITY_LEVELS.ERROR,
            field: 'date',
            value: attendance.date,
            message: 'تاريخ الحضور غير صحيح',
            messageEn: 'Invalid attendance date',
            recordId: attendance.id,
            recordName: attendance.employeeName,
            suggestion: 'استخدم صيغة YYYY-MM-DD',
        }));
    }

    // التحقق من وقت الحضور والانصراف
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (attendance.checkIn && !timePattern.test(attendance.checkIn)) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.VALIDATION,
            severity: SEVERITY_LEVELS.WARNING,
            field: 'checkIn',
            value: attendance.checkIn,
            message: 'صيغة وقت الحضور غير صحيحة',
            messageEn: 'Invalid check-in time format',
            recordId: attendance.id,
            recordName: attendance.employeeName,
            suggestion: 'استخدم صيغة HH:MM',
        }));
    }

    if (attendance.checkOut && !timePattern.test(attendance.checkOut)) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.VALIDATION,
            severity: SEVERITY_LEVELS.WARNING,
            field: 'checkOut',
            value: attendance.checkOut,
            message: 'صيغة وقت الانصراف غير صحيحة',
            messageEn: 'Invalid check-out time format',
            recordId: attendance.id,
            recordName: attendance.employeeName,
            suggestion: 'استخدم صيغة HH:MM',
        }));
    }

    // التحقق من حالة الحضور
    const validStatuses = ['present', 'absent', 'late', 'early_leave', 'vacation', 'sick'];
    if (attendance.status && !validStatuses.includes(attendance.status)) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.VALIDATION,
            severity: SEVERITY_LEVELS.WARNING,
            field: 'status',
            value: attendance.status,
            message: 'حالة الحضور غير صحيحة',
            messageEn: 'Invalid attendance status',
            recordId: attendance.id,
            recordName: attendance.employeeName,
            suggestion: 'الحالات المتاحة: حاضر، غائب، متأخر، انصراف مبكر، إجازة، مرضي',
        }));
    }

    return errors;
}

/**
 * التحقق الشامل قبل التصدير
 */
export function validateBeforeExport(data, exportType) {
    const result = {
        isValid: true,
        totalRecords: data.length,
        validRecords: 0,
        invalidRecords: 0,
        errors: [],
        warnings: [],
        summary: {},
    };

    data.forEach((record, index) => {
        let recordErrors = [];

        switch (exportType) {
            case 'employees':
                recordErrors = validateEmployee(record);
                break;
            case 'payroll':
                recordErrors = validatePayroll(record);
                break;
            case 'vacations':
                recordErrors = validateVacation(record);
                break;
            case 'attendance':
                recordErrors = validateAttendance(record);
                break;
        }

        const criticalErrors = recordErrors.filter(e => e.severity === SEVERITY_LEVELS.ERROR);
        const warnings = recordErrors.filter(e => e.severity === SEVERITY_LEVELS.WARNING);

        if (criticalErrors.length > 0) {
            result.invalidRecords++;
            result.errors.push(...criticalErrors);
        } else {
            result.validRecords++;
        }

        result.warnings.push(...warnings);
    });

    result.isValid = result.invalidRecords === 0;

    // ملخص الأخطاء حسب النوع
    result.summary = {
        byType: groupBy(result.errors, 'type'),
        byField: groupBy(result.errors, 'field'),
        bySeverity: {
            errors: result.errors.length,
            warnings: result.warnings.length,
        },
    };

    return result;
}

/**
 * تحليل الأخطاء من استجابة API
 */
export function parseApiErrors(apiResponse) {
    const errors = [];

    if (!apiResponse) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.CONNECTION,
            severity: SEVERITY_LEVELS.ERROR,
            field: null,
            value: null,
            message: 'لا توجد استجابة من الخادم',
            messageEn: 'No response from server',
            suggestion: 'تحقق من الاتصال بالإنترنت',
        }));
        return errors;
    }

    if (apiResponse.status === 401 || apiResponse.status === 403) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.PERMISSION,
            severity: SEVERITY_LEVELS.ERROR,
            field: null,
            value: null,
            message: 'غير مصرح لك بهذه العملية',
            messageEn: 'Unauthorized',
            suggestion: 'تحقق من صلاحياتك أو أعد تسجيل الدخول',
        }));
    }

    if (apiResponse.status >= 500) {
        errors.push(new ValidationError({
            type: ERROR_TYPES.SERVER,
            severity: SEVERITY_LEVELS.ERROR,
            field: null,
            value: null,
            message: 'خطأ في الخادم',
            messageEn: 'Server error',
            suggestion: 'حاول مرة أخرى لاحقاً أو تواصل مع الدعم الفني',
        }));
    }

    // تحليل الأخطاء من جسم الاستجابة
    if (apiResponse.errors && Array.isArray(apiResponse.errors)) {
        apiResponse.errors.forEach(err => {
            errors.push(new ValidationError({
                type: err.type || ERROR_TYPES.SERVER,
                severity: err.severity || SEVERITY_LEVELS.ERROR,
                field: err.field,
                value: err.value,
                message: err.message || err.messageAr || 'خطأ غير معروف',
                messageEn: err.messageEn || err.message,
                recordId: err.recordId,
                suggestion: err.suggestion || getDefaultSuggestion(err.type),
            }));
        });
    }

    return errors;
}

/**
 * الحصول على اقتراح افتراضي بناءً على نوع الخطأ
 */
function getDefaultSuggestion(errorType) {
    const suggestions = {
        [ERROR_TYPES.VALIDATION]: 'راجع البيانات المدخلة وتأكد من صحتها',
        [ERROR_TYPES.CONNECTION]: 'تحقق من الاتصال بالإنترنت وحاول مرة أخرى',
        [ERROR_TYPES.SERVER]: 'حاول مرة أخرى لاحقاً أو تواصل مع الدعم الفني',
        [ERROR_TYPES.DATA_FORMAT]: 'تأكد من صيغة البيانات المطلوبة',
        [ERROR_TYPES.MISSING_DATA]: 'أكمل البيانات المفقودة',
        [ERROR_TYPES.DUPLICATE]: 'تأكد من عدم تكرار البيانات',
        [ERROR_TYPES.PERMISSION]: 'تحقق من صلاحياتك',
    };
    return suggestions[errorType] || 'راجع البيانات وحاول مرة أخرى';
}

/**
 * تجميع العناصر حسب خاصية معينة
 */
function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = item[key] || 'other';
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
}

/**
 * تصدير تقرير الأخطاء
 */
export function generateErrorReport(validationResult) {
    const report = {
        generatedAt: new Date().toISOString(),
        summary: {
            totalRecords: validationResult.totalRecords,
            validRecords: validationResult.validRecords,
            invalidRecords: validationResult.invalidRecords,
            errorCount: validationResult.errors.length,
            warningCount: validationResult.warnings.length,
        },
        errorsByType: {},
        errorsByField: {},
        details: [],
    };

    // تجميع الأخطاء حسب النوع
    validationResult.errors.forEach(error => {
        if (!report.errorsByType[error.type]) {
            report.errorsByType[error.type] = 0;
        }
        report.errorsByType[error.type]++;

        if (!report.errorsByField[error.field]) {
            report.errorsByField[error.field] = 0;
        }
        report.errorsByField[error.field]++;

        report.details.push({
            recordId: error.recordId,
            recordName: error.recordName,
            field: error.field,
            message: error.message,
            suggestion: error.suggestion,
        });
    });

    return report;
}

// ==================== دوال الإصلاح التلقائي ====================

/**
 * إصلاح رقم الحساب البنكي (IBAN)
 */
export function autoFixIBAN(iban) {
    if (!iban) return null;

    // إزالة المسافات والشرطات
    let cleaned = iban.replace(/[\s-]/g, '').toUpperCase();

    // إضافة SA إذا كان مفقوداً
    if (/^\d{22}$/.test(cleaned)) {
        cleaned = 'SA' + cleaned;
    }

    // إضافة SA0 إذا بدأ برقم البنك مباشرة
    if (/^\d{24}$/.test(cleaned)) {
        cleaned = 'SA' + cleaned;
    }

    // التحقق من الصيغة النهائية
    if (/^SA\d{22}$/.test(cleaned)) {
        return cleaned;
    }

    return null; // لا يمكن الإصلاح
}

/**
 * إصلاح رقم الهوية
 */
export function autoFixNationalId(nationalId) {
    if (!nationalId) return null;

    // إزالة المسافات والشرطات
    let cleaned = nationalId.toString().replace(/[\s-]/g, '');

    // إزالة الأصفار البادئة الزائدة
    cleaned = cleaned.replace(/^0+/, '');

    // التحقق من الصيغة
    if (/^[12]\d{9}$/.test(cleaned)) {
        return cleaned;
    }

    return null;
}

/**
 * إصلاح كود البنك
 */
export function autoFixBankCode(bankCode) {
    if (!bankCode) return null;

    // تحويل إلى رقم ثم إضافة صفر بادئ إذا لزم
    const num = parseInt(bankCode, 10);
    if (!isNaN(num) && num >= 0 && num <= 99) {
        return num.toString().padStart(2, '0');
    }

    return null;
}

/**
 * إصلاح تنسيق التاريخ
 */
export function autoFixDate(dateStr) {
    if (!dateStr) return null;

    // محاولة تحويل التنسيقات المختلفة
    const patterns = [
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/,     // YYYY-M-D
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,   // D/M/YYYY
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/,     // D-M-YYYY
    ];

    for (const pattern of patterns) {
        const match = dateStr.match(pattern);
        if (match) {
            let year, month, day;
            if (pattern === patterns[0]) {
                [, year, month, day] = match;
            } else {
                [, day, month, year] = match;
            }

            month = month.padStart(2, '0');
            day = day.padStart(2, '0');

            const fixed = `${year}-${month}-${day}`;
            if (/^\d{4}-\d{2}-\d{2}$/.test(fixed)) {
                return fixed;
            }
        }
    }

    return null;
}

/**
 * إصلاح تنسيق الوقت
 */
export function autoFixTime(timeStr) {
    if (!timeStr) return null;

    // إزالة AM/PM وتحويل إلى 24 ساعة
    let cleaned = timeStr.trim().toUpperCase();

    const amPmMatch = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (amPmMatch) {
        let [, hours, minutes, period] = amPmMatch;
        hours = parseInt(hours, 10);

        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    return null;
}

/**
 * إصلاح سجل موظف تلقائياً
 */
export function autoFixEmployee(employee) {
    const fixed = { ...employee };
    const fixes = [];

    // إصلاح IBAN
    if (employee.bankAccount) {
        const fixedIBAN = autoFixIBAN(employee.bankAccount);
        if (fixedIBAN && fixedIBAN !== employee.bankAccount) {
            fixed.bankAccount = fixedIBAN;
            fixes.push({ field: 'bankAccount', original: employee.bankAccount, fixed: fixedIBAN });
        }
    }

    // إصلاح رقم الهوية
    if (employee.nationalId) {
        const fixedId = autoFixNationalId(employee.nationalId);
        if (fixedId && fixedId !== employee.nationalId) {
            fixed.nationalId = fixedId;
            fixes.push({ field: 'nationalId', original: employee.nationalId, fixed: fixedId });
        }
    }

    // إصلاح كود البنك
    if (employee.bankCode) {
        const fixedCode = autoFixBankCode(employee.bankCode);
        if (fixedCode && fixedCode !== employee.bankCode) {
            fixed.bankCode = fixedCode;
            fixes.push({ field: 'bankCode', original: employee.bankCode, fixed: fixedCode });
        }
    }

    return { fixed, fixes };
}

/**
 * إصلاح مجموعة سجلات تلقائياً
 */
export function autoFixRecords(records, recordType = 'employees') {
    const results = {
        totalRecords: records.length,
        fixedRecords: 0,
        fixedFields: 0,
        unfixableRecords: 0,
        details: [],
        fixedData: [],
    };

    records.forEach((record, index) => {
        let fixResult;

        switch (recordType) {
            case 'employees':
                fixResult = autoFixEmployee(record);
                break;
            default:
                fixResult = { fixed: record, fixes: [] };
        }

        results.fixedData.push(fixResult.fixed);

        if (fixResult.fixes.length > 0) {
            results.fixedRecords++;
            results.fixedFields += fixResult.fixes.length;
            results.details.push({
                recordIndex: index,
                recordId: record.id,
                recordName: record.name,
                fixes: fixResult.fixes,
            });
        }
    });

    return results;
}

// ==================== تصدير Excel ====================

/**
 * تحويل تقرير التحقق إلى صيغة Excel (CSV)
 */
export function generateExcelReport(validationResult) {
    const rows = [];

    // رأس الجدول
    rows.push(['رقم السجل', 'اسم السجل', 'الحقل', 'القيمة', 'الخطأ', 'الاقتراح', 'النوع', 'الخطورة']);

    // الأخطاء
    validationResult.errors.forEach(error => {
        rows.push([
            error.recordId || '',
            error.recordName || '',
            getFieldNameArabic(error.field),
            error.value || '',
            error.message,
            error.suggestion || '',
            getErrorTypeArabic(error.type),
            'خطأ',
        ]);
    });

    // التحذيرات
    validationResult.warnings.forEach(warning => {
        rows.push([
            warning.recordId || '',
            warning.recordName || '',
            getFieldNameArabic(warning.field),
            warning.value || '',
            warning.message,
            warning.suggestion || '',
            getErrorTypeArabic(warning.type),
            'تحذير',
        ]);
    });

    // تحويل إلى CSV
    const csvContent = rows.map(row =>
        row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // إضافة BOM للدعم العربي
    const bom = '\uFEFF';
    return bom + csvContent;
}

/**
 * تحميل ملف Excel
 */
export function downloadExcelReport(validationResult, filename = 'validation_report') {
    const csvContent = generateExcelReport(validationResult);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * الحصول على اسم الحقل بالعربية
 */
function getFieldNameArabic(field) {
    const names = {
        nationalId: 'رقم الهوية',
        name: 'الاسم',
        bankAccount: 'رقم الحساب',
        bankCode: 'كود البنك',
        basicSalary: 'الراتب الأساسي',
        netSalary: 'صافي الراتب',
        month: 'الشهر',
        email: 'البريد الإلكتروني',
        phone: 'رقم الهاتف',
        employeeId: 'رقم الموظف',
        vacationType: 'نوع الإجازة',
        startDate: 'تاريخ البداية',
        endDate: 'تاريخ النهاية',
        days: 'عدد الأيام',
        date: 'التاريخ',
        checkIn: 'وقت الحضور',
        checkOut: 'وقت الانصراف',
        status: 'الحالة',
    };
    return names[field] || field;
}

/**
 * الحصول على نوع الخطأ بالعربية
 */
function getErrorTypeArabic(type) {
    const types = {
        validation: 'خطأ في البيانات',
        connection: 'خطأ في الاتصال',
        server: 'خطأ من الخادم',
        data_format: 'خطأ في الصيغة',
        missing_data: 'بيانات مفقودة',
        duplicate: 'تكرار',
        permission: 'صلاحيات',
    };
    return types[type] || type;
}

export default {
    EMPLOYEE_VALIDATION_RULES,
    PAYROLL_VALIDATION_RULES,
    VACATION_VALIDATION_RULES,
    ATTENDANCE_VALIDATION_RULES,
    ERROR_TYPES,
    SEVERITY_LEVELS,
    ValidationError,
    validateField,
    validateEmployee,
    validatePayroll,
    validateVacation,
    validateAttendance,
    validateBeforeExport,
    parseApiErrors,
    generateErrorReport,
    // Auto-fix functions
    autoFixIBAN,
    autoFixNationalId,
    autoFixBankCode,
    autoFixDate,
    autoFixTime,
    autoFixEmployee,
    autoFixRecords,
    // Excel export
    generateExcelReport,
    downloadExcelReport,
};
