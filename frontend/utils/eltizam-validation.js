/**
 * نظام التحقق الشامل من بيانات التزام (MCS-Eltezam)
 * يغطي جميع أنواع التقديم السبعة حسب Data Dictionary v3.24
 *
 * @version 2.0.0
 * @date 2026-02-11
 */

import {
    VACATION_CODES,
    EMPLOYEE_STATUS_CODES,
    ELEMENT_CODES,
    QUALIFICATION_CODES,
    EMPLOYMENT_TYPE_CODES,
    RANK_CODES,
    LOCATION_CODES,
    NATIONALITY_CODES,
    MARITAL_STATUS_CODES,
    CADRE_CODES,
    GENDER_CODES,
    JOB_TITLE_CODES,
    MAJOR_CODES,
    UNIVERSITY_CODES,
    TRANSACTION_CODES,
    JOB_TRANSACTION_CODES,
    CONTRACT_TYPE_CODES,
} from '../constants/eltizam-codes';

// ==================== أنواع التقديم السبعة ====================
export const SUBMISSION_TYPES = {
    EMPLOYEE_INFO: { id: 'employeeInfo', label: 'بيانات الموظفين', labelEn: 'submitEmployeeInfo', icon: '👤', fieldCount: 49 },
    EMPLOYEE_HISTORICAL: { id: 'historicalInfo', label: 'البيانات التاريخية', labelEn: 'submitEmployeeHistoricalInfo', icon: '📜', fieldCount: 23 },
    JOB_INFO: { id: 'jobInfo', label: 'بيانات الوظائف', labelEn: 'submitJobInfo', icon: '💼', fieldCount: 19 },
    PAYSLIP_INFO: { id: 'payslipInfo', label: 'بيانات الرواتب', labelEn: 'submitEmployeePayslipInfo', icon: '💰', fieldCount: 18 },
    QUALIFICATION_INFO: { id: 'qualificationInfo', label: 'بيانات المؤهلات', labelEn: 'submitEmployeeQualificationInfo', icon: '🎓', fieldCount: 15 },
    VACATION_INFO: { id: 'vacationInfo', label: 'بيانات الإجازات', labelEn: 'submitEmployeeVacationInfo', icon: '🏖️', fieldCount: 10 },
    APPRAISAL_INFO: { id: 'appraisalInfo', label: 'بيانات تقييم الأداء', labelEn: 'submitEmployeeAppraisalInfo', icon: '⭐', fieldCount: 8 },
};

// ==================== مستويات الخطورة ====================
export const SEVERITY = {
    CRITICAL: 'critical',  // يمنع التصدير نهائياً
    ERROR: 'error',        // خطأ يجب إصلاحه
    WARNING: 'warning',    // تحذير يمكن تجاوزه
    INFO: 'info',          // ملاحظة
};

const SEVERITY_LABELS = {
    critical: 'حرج',
    error: 'خطأ',
    warning: 'تحذير',
    info: 'ملاحظة',
};

const SEVERITY_COLORS = {
    critical: 'red',
    error: 'red',
    warning: 'yellow',
    info: 'blue',
};

// ==================== فئة خطأ التحقق ====================
export class EltizamValidationError {
    constructor({ submissionType, field, fieldLabel, value, severity, message, suggestion, recordId, recordName, autoFixable = false, autoFixFn = null }) {
        this.submissionType = submissionType;
        this.field = field;
        this.fieldLabel = fieldLabel;
        this.value = value;
        this.severity = severity;
        this.message = message;
        this.suggestion = suggestion;
        this.recordId = recordId;
        this.recordName = recordName;
        this.autoFixable = autoFixable;
        this.autoFixFn = autoFixFn;
        this.timestamp = new Date().toISOString();
        this.id = `${submissionType}-${field}-${recordId}-${Date.now()}`;
    }
}

// ==================== أداة مساعدة للتحقق من الأكواد ====================
function getCodeValues(codeObject) {
    return Object.values(codeObject).map(v => v.code || v);
}

function isValidCode(value, codeObject) {
    if (!value) return false;
    const val = value.toString().trim();
    return Object.values(codeObject).some(v => (v.code || v).toString() === val);
}

function isValidDate(dateStr) {
    if (!dateStr) return false;
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) || /^\d{4}\/\d{2}\/\d{2}$/.test(dateStr);
}

function isValidHijriDate(dateStr) {
    if (!dateStr) return false;
    return /^\d{4}[-/]\d{2}[-/]\d{2}$/.test(dateStr);
}

// ==================== 1. التحقق من بيانات الموظفين (submitEmployeeInfo) ====================
export function validateEmployeeInfo(employee) {
    const errors = [];
    const type = 'employeeInfo';
    const recId = employee.id || employee.employeeId || employee.nationalId;
    const recName = employee.name || employee.employeeName || 'غير محدد';

    // EmployeeID - رقم الموظف (مطلوب، 1-20 حرف)
    if (!employee.employeeId && !employee.employeeNumber) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'employeeId', fieldLabel: 'رقم الموظف',
            value: '', severity: SEVERITY.CRITICAL,
            message: 'رقم الموظف مطلوب', suggestion: 'أدخل رقم الموظف الوظيفي',
            recordId: recId, recordName: recName,
        }));
    }

    // PersonIdentifier - رقم الهوية (مطلوب، 10 أرقام، يبدأ بـ 1 أو 2)
    if (!employee.nationalId || !/^[12]\d{9}$/.test(employee.nationalId?.toString())) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'nationalId', fieldLabel: 'رقم الهوية',
            value: employee.nationalId || '', severity: SEVERITY.CRITICAL,
            message: 'رقم الهوية غير صحيح - يجب أن يكون 10 أرقام ويبدأ بـ 1 (سعودي) أو 2 (مقيم)',
            suggestion: 'تأكد أن رقم الهوية مكون من 10 أرقام ويبدأ بالرقم 1 أو 2',
            recordId: recId, recordName: recName,
            autoFixable: true, autoFixFn: 'fixNationalId',
        }));
    }

    // FullName - الاسم الكامل (مطلوب، 5-200 حرف)
    if (!employee.name || employee.name.trim().length < 5) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'name', fieldLabel: 'الاسم الكامل',
            value: employee.name || '', severity: SEVERITY.CRITICAL,
            message: 'الاسم الكامل مطلوب (5 أحرف على الأقل)',
            suggestion: 'أدخل الاسم الرباعي كاملاً',
            recordId: recId, recordName: recName,
        }));
    }

    // Gender - الجنس (M أو F)
    if (!employee.gender || !['M', 'F'].includes(employee.gender?.toString().toUpperCase())) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'gender', fieldLabel: 'الجنس',
            value: employee.gender || '', severity: SEVERITY.ERROR,
            message: 'الجنس غير صحيح - يجب أن يكون M (ذكر) أو F (أنثى)',
            suggestion: 'اختر M للذكر أو F للأنثى',
            recordId: recId, recordName: recName,
            autoFixable: true, autoFixFn: 'fixGender',
        }));
    }

    // Nationality - الجنسية (كود من جدول الجنسيات)
    if (employee.nationality && !isValidCode(employee.nationality, NATIONALITY_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'nationality', fieldLabel: 'الجنسية',
            value: employee.nationality || '', severity: SEVERITY.ERROR,
            message: 'كود الجنسية غير صحيح',
            suggestion: 'استخدم أحد أكواد الجنسيات المعتمدة من التزام',
            recordId: recId, recordName: recName,
        }));
    }

    // MaritalStatus - الحالة الاجتماعية
    if (employee.maritalStatus && !isValidCode(employee.maritalStatus, MARITAL_STATUS_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'maritalStatus', fieldLabel: 'الحالة الاجتماعية',
            value: employee.maritalStatus || '', severity: SEVERITY.WARNING,
            message: 'كود الحالة الاجتماعية غير صحيح',
            suggestion: 'استخدم: 01=أعزب، 02=متزوج، 03=مطلق، 04=أرمل',
            recordId: recId, recordName: recName,
        }));
    }

    // BirthDate - تاريخ الميلاد
    if (!employee.birthDate) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'birthDate', fieldLabel: 'تاريخ الميلاد',
            value: '', severity: SEVERITY.ERROR,
            message: 'تاريخ الميلاد مطلوب',
            suggestion: 'أدخل تاريخ الميلاد بصيغة YYYY-MM-DD',
            recordId: recId, recordName: recName,
        }));
    } else if (!isValidDate(employee.birthDate)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'birthDate', fieldLabel: 'تاريخ الميلاد',
            value: employee.birthDate, severity: SEVERITY.ERROR,
            message: 'صيغة تاريخ الميلاد غير صحيحة',
            suggestion: 'استخدم صيغة YYYY-MM-DD',
            recordId: recId, recordName: recName,
            autoFixable: true, autoFixFn: 'fixDate',
        }));
    }

    // EmploymentTypeCode - نوع التوظيف
    if (employee.employmentType && !isValidCode(employee.employmentType, EMPLOYMENT_TYPE_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'employmentType', fieldLabel: 'نوع التوظيف',
            value: employee.employmentType || '', severity: SEVERITY.ERROR,
            message: 'كود نوع التوظيف غير صحيح',
            suggestion: 'استخدم أحد أكواد التوظيف المعتمدة',
            recordId: recId, recordName: recName,
        }));
    }

    // RankCode - الرتبة/المرتبة
    if (employee.rank && !isValidCode(employee.rank, RANK_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'rank', fieldLabel: 'المرتبة',
            value: employee.rank || '', severity: SEVERITY.ERROR,
            message: 'كود المرتبة غير صحيح',
            suggestion: 'استخدم أحد أكواد المراتب المعتمدة',
            recordId: recId, recordName: recName,
        }));
    }

    // EmployeeStatusCode - حالة الموظف
    if (employee.statusCode && !isValidCode(employee.statusCode, EMPLOYEE_STATUS_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'statusCode', fieldLabel: 'حالة الموظف',
            value: employee.statusCode || '', severity: SEVERITY.ERROR,
            message: 'كود حالة الموظف غير صحيح',
            suggestion: 'استخدم أحد أكواد الحالة المعتمدة من التزام',
            recordId: recId, recordName: recName,
        }));
    }

    // LocationCode - كود الموقع
    if (employee.location && !isValidCode(employee.location, LOCATION_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'location', fieldLabel: 'الموقع',
            value: employee.location || '', severity: SEVERITY.WARNING,
            message: 'كود الموقع غير صحيح',
            suggestion: 'استخدم أحد أكواد المواقع المعتمدة',
            recordId: recId, recordName: recName,
        }));
    }

    // HireDate - تاريخ التعيين (مطلوب)
    if (!employee.hireDate) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'hireDate', fieldLabel: 'تاريخ التعيين',
            value: '', severity: SEVERITY.CRITICAL,
            message: 'تاريخ التعيين مطلوب',
            suggestion: 'أدخل تاريخ التعيين بصيغة YYYY-MM-DD',
            recordId: recId, recordName: recName,
        }));
    }

    // IBAN - الحساب البنكي (مطلوب، SA + 22 رقم)
    if (!employee.bankAccount && !employee.iban) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'bankAccount', fieldLabel: 'رقم الآيبان',
            value: '', severity: SEVERITY.ERROR,
            message: 'رقم الحساب البنكي (IBAN) مطلوب',
            suggestion: 'أدخل رقم الآيبان بصيغة SA متبوعاً بـ 22 رقم',
            recordId: recId, recordName: recName,
        }));
    } else {
        const iban = employee.bankAccount || employee.iban || '';
        if (!/^SA\d{22}$/.test(iban)) {
            errors.push(new EltizamValidationError({
                submissionType: type, field: 'bankAccount', fieldLabel: 'رقم الآيبان',
                value: iban, severity: SEVERITY.ERROR,
                message: 'صيغة الآيبان غير صحيحة - يجب أن يبدأ بـ SA ويتبعه 22 رقم',
                suggestion: 'مثال: SA0380000000608010167519',
                recordId: recId, recordName: recName,
                autoFixable: true, autoFixFn: 'fixIBAN',
            }));
        }
    }

    // BankCode - كود البنك (مطلوب، رقمين)
    if (employee.bankCode && !/^\d{2}$/.test(employee.bankCode?.toString())) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'bankCode', fieldLabel: 'كود البنك',
            value: employee.bankCode || '', severity: SEVERITY.WARNING,
            message: 'كود البنك يجب أن يكون رقمين',
            suggestion: 'مثال: 05 = البنك الأهلي، 10 = الراجحي',
            recordId: recId, recordName: recName,
            autoFixable: true, autoFixFn: 'fixBankCode',
        }));
    }

    // CadreCode - كود الكادر
    if (employee.cadre && !isValidCode(employee.cadre, CADRE_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'cadre', fieldLabel: 'الكادر',
            value: employee.cadre || '', severity: SEVERITY.WARNING,
            message: 'كود الكادر غير صحيح',
            suggestion: 'استخدم أحد أكواد الكوادر المعتمدة',
            recordId: recId, recordName: recName,
        }));
    }

    // Phone / Mobile
    if (employee.phone && !/^(05|966)\d{8,9}$/.test(employee.phone?.toString().replace(/[\s-]/g, ''))) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'phone', fieldLabel: 'رقم الجوال',
            value: employee.phone || '', severity: SEVERITY.WARNING,
            message: 'رقم الجوال غير صحيح',
            suggestion: 'أدخل رقم الجوال بصيغة 05XXXXXXXX',
            recordId: recId, recordName: recName,
            autoFixable: true, autoFixFn: 'fixPhone',
        }));
    }

    // Email
    if (employee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'email', fieldLabel: 'البريد الإلكتروني',
            value: employee.email || '', severity: SEVERITY.WARNING,
            message: 'صيغة البريد الإلكتروني غير صحيحة',
            suggestion: 'مثال: user@domain.com',
            recordId: recId, recordName: recName,
        }));
    }

    return errors;
}

// ==================== 2. التحقق من البيانات التاريخية (submitEmployeeHistoricalInfo) ====================
export function validateHistoricalInfo(record) {
    const errors = [];
    const type = 'historicalInfo';
    const recId = record.employeeId || record.id;
    const recName = record.employeeName || record.name || 'غير محدد';

    if (!record.employeeId) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'employeeId', fieldLabel: 'رقم الموظف',
            value: '', severity: SEVERITY.CRITICAL,
            message: 'رقم الموظف مطلوب', suggestion: 'أدخل رقم الموظف',
            recordId: recId, recordName: recName,
        }));
    }

    if (!record.nationalId || !/^[12]\d{9}$/.test(record.nationalId?.toString())) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'nationalId', fieldLabel: 'رقم الهوية',
            value: record.nationalId || '', severity: SEVERITY.CRITICAL,
            message: 'رقم الهوية غير صحيح',
            suggestion: 'يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2',
            recordId: recId, recordName: recName,
            autoFixable: true, autoFixFn: 'fixNationalId',
        }));
    }

    // TransactionCode - كود الحركة (مطلوب)
    if (record.transactionCode && !isValidCode(record.transactionCode, TRANSACTION_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'transactionCode', fieldLabel: 'كود الحركة',
            value: record.transactionCode || '', severity: SEVERITY.ERROR,
            message: 'كود الحركة غير صحيح',
            suggestion: 'استخدم أحد أكواد الحركات المعتمدة',
            recordId: recId, recordName: recName,
        }));
    }

    // EffectiveDate - تاريخ السريان
    if (!record.effectiveDate) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'effectiveDate', fieldLabel: 'تاريخ السريان',
            value: '', severity: SEVERITY.ERROR,
            message: 'تاريخ السريان مطلوب',
            suggestion: 'أدخل تاريخ سريان الحركة بصيغة YYYY-MM-DD',
            recordId: recId, recordName: recName,
        }));
    }

    // DecisionNumber - رقم القرار
    if (!record.decisionNumber) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'decisionNumber', fieldLabel: 'رقم القرار',
            value: '', severity: SEVERITY.WARNING,
            message: 'رقم القرار مفقود',
            suggestion: 'أدخل رقم القرار الإداري',
            recordId: recId, recordName: recName,
        }));
    }

    // DecisionDate - تاريخ القرار
    if (record.decisionDate && !isValidDate(record.decisionDate)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'decisionDate', fieldLabel: 'تاريخ القرار',
            value: record.decisionDate, severity: SEVERITY.ERROR,
            message: 'صيغة تاريخ القرار غير صحيحة',
            suggestion: 'استخدم صيغة YYYY-MM-DD',
            recordId: recId, recordName: recName,
            autoFixable: true, autoFixFn: 'fixDate',
        }));
    }

    return errors;
}

// ==================== 3. التحقق من بيانات الوظائف (submitJobInfo) ====================
export function validateJobInfo(job) {
    const errors = [];
    const type = 'jobInfo';
    const recId = job.jobId || job.id;
    const recName = job.jobTitle || job.title || 'غير محدد';

    // JobID - رقم الوظيفة (مطلوب)
    if (!job.jobId && !job.id) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'jobId', fieldLabel: 'رقم الوظيفة',
            value: '', severity: SEVERITY.CRITICAL,
            message: 'رقم الوظيفة مطلوب',
            suggestion: 'أدخل رقم الوظيفة',
            recordId: recId, recordName: recName,
        }));
    }

    // JobNameCode - كود المسمى الوظيفي
    if (job.jobNameCode && !isValidCode(job.jobNameCode, JOB_TITLE_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'jobNameCode', fieldLabel: 'كود المسمى الوظيفي',
            value: job.jobNameCode || '', severity: SEVERITY.ERROR,
            message: 'كود المسمى الوظيفي غير صحيح',
            suggestion: 'استخدم أحد أكواد المسميات الوظيفية المعتمدة',
            recordId: recId, recordName: recName,
        }));
    }

    // JobClassCode - كود التصنيف الوظيفي (كادر)
    if (job.jobClassCode && !isValidCode(job.jobClassCode, CADRE_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'jobClassCode', fieldLabel: 'كود التصنيف الوظيفي',
            value: job.jobClassCode || '', severity: SEVERITY.ERROR,
            message: 'كود التصنيف الوظيفي غير صحيح',
            suggestion: 'استخدم أحد أكواد الكوادر المعتمدة',
            recordId: recId, recordName: recName,
        }));
    }

    // RankCode - المرتبة
    if (job.rankCode && !isValidCode(job.rankCode, RANK_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'rankCode', fieldLabel: 'المرتبة',
            value: job.rankCode || '', severity: SEVERITY.ERROR,
            message: 'كود المرتبة غير صحيح',
            suggestion: 'استخدم أحد أكواد المراتب المعتمدة',
            recordId: recId, recordName: recName,
        }));
    }

    // LocationCode - كود الموقع
    if (job.locationCode && !isValidCode(job.locationCode, LOCATION_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'locationCode', fieldLabel: 'كود الموقع',
            value: job.locationCode || '', severity: SEVERITY.WARNING,
            message: 'كود الموقع غير صحيح',
            suggestion: 'استخدم أحد أكواد المواقع المعتمدة',
            recordId: recId, recordName: recName,
        }));
    }

    // JobStatus - حالة الوظيفة (Occupied/Vacant)
    if (job.jobStatus && !['Occupied', 'Vacant', 'occupied', 'vacant', '1', '0'].includes(job.jobStatus?.toString())) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'jobStatus', fieldLabel: 'حالة الوظيفة',
            value: job.jobStatus || '', severity: SEVERITY.WARNING,
            message: 'حالة الوظيفة غير صحيحة',
            suggestion: 'استخدم Occupied (مشغولة) أو Vacant (شاغرة)',
            recordId: recId, recordName: recName,
        }));
    }

    // EmploymentTypeCode - نوع التوظيف
    if (job.employmentTypeCode && !isValidCode(job.employmentTypeCode, EMPLOYMENT_TYPE_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'employmentTypeCode', fieldLabel: 'نوع التوظيف',
            value: job.employmentTypeCode || '', severity: SEVERITY.ERROR,
            message: 'كود نوع التوظيف غير صحيح',
            suggestion: 'استخدم أحد أكواد التوظيف المعتمدة',
            recordId: recId, recordName: recName,
        }));
    }

    return errors;
}

// ==================== 4. التحقق من بيانات الرواتب (submitEmployeePayslipInfo) ====================
export function validatePayslipInfo(payslip) {
    const errors = [];
    const type = 'payslipInfo';
    const recId = payslip.employeeId || payslip.id;
    const recName = payslip.employeeName || payslip.name || 'غير محدد';

    // EmployeeID
    if (!payslip.employeeId) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'employeeId', fieldLabel: 'رقم الموظف',
            value: '', severity: SEVERITY.CRITICAL,
            message: 'رقم الموظف مطلوب',
            suggestion: 'أدخل رقم الموظف',
            recordId: recId, recordName: recName,
        }));
    }

    // NationalID
    if (!payslip.nationalId || !/^[12]\d{9}$/.test(payslip.nationalId?.toString())) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'nationalId', fieldLabel: 'رقم الهوية',
            value: payslip.nationalId || '', severity: SEVERITY.CRITICAL,
            message: 'رقم الهوية غير صحيح',
            suggestion: 'يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2',
            recordId: recId, recordName: recName,
            autoFixable: true, autoFixFn: 'fixNationalId',
        }));
    }

    // ElementCode - كود العنصر (بدل/استقطاع)
    if (payslip.elementCode) {
        const allElements = [
            ...Object.values(ELEMENT_CODES.ALLOWANCES || {}),
            ...Object.values(ELEMENT_CODES.DEDUCTIONS || {}),
        ];
        const validCodes = allElements.map(e => (e.code || e).toString());
        if (!validCodes.includes(payslip.elementCode?.toString())) {
            errors.push(new EltizamValidationError({
                submissionType: type, field: 'elementCode', fieldLabel: 'كود العنصر',
                value: payslip.elementCode || '', severity: SEVERITY.ERROR,
                message: 'كود عنصر الراتب غير صحيح',
                suggestion: 'استخدم أحد أكواد البدلات أو الاستقطاعات المعتمدة',
                recordId: recId, recordName: recName,
            }));
        }
    }

    // Amount - المبلغ (مطلوب، رقم)
    if (payslip.amount !== undefined && payslip.amount !== null) {
        const amount = parseFloat(payslip.amount);
        if (isNaN(amount)) {
            errors.push(new EltizamValidationError({
                submissionType: type, field: 'amount', fieldLabel: 'المبلغ',
                value: payslip.amount, severity: SEVERITY.ERROR,
                message: 'المبلغ يجب أن يكون رقم',
                suggestion: 'أدخل قيمة رقمية صحيحة',
                recordId: recId, recordName: recName,
            }));
        }
    }

    // NetPay - صافي الراتب
    if (payslip.netPay !== undefined && payslip.netPay !== null) {
        const net = parseFloat(payslip.netPay);
        if (isNaN(net) || net < 0) {
            errors.push(new EltizamValidationError({
                submissionType: type, field: 'netPay', fieldLabel: 'صافي الراتب',
                value: payslip.netPay, severity: SEVERITY.ERROR,
                message: 'صافي الراتب غير صحيح أو سالب',
                suggestion: 'تأكد من أن صافي الراتب قيمة رقمية موجبة',
                recordId: recId, recordName: recName,
            }));
        }
    }

    // HijriMonth / HijriYear
    if (payslip.hijriMonth && (parseInt(payslip.hijriMonth) < 1 || parseInt(payslip.hijriMonth) > 12)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'hijriMonth', fieldLabel: 'الشهر الهجري',
            value: payslip.hijriMonth, severity: SEVERITY.ERROR,
            message: 'الشهر الهجري يجب أن يكون من 1 إلى 12',
            suggestion: 'أدخل رقم الشهر الهجري (1-12)',
            recordId: recId, recordName: recName,
        }));
    }

    if (payslip.hijriYear && (parseInt(payslip.hijriYear) < 1400 || parseInt(payslip.hijriYear) > 1500)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'hijriYear', fieldLabel: 'السنة الهجرية',
            value: payslip.hijriYear, severity: SEVERITY.WARNING,
            message: 'السنة الهجرية تبدو غير صحيحة',
            suggestion: 'تأكد من السنة الهجرية (مثل 1446)',
            recordId: recId, recordName: recName,
        }));
    }

    // EmploymentTypeCode
    if (payslip.employmentTypeCode && !isValidCode(payslip.employmentTypeCode, EMPLOYMENT_TYPE_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'employmentTypeCode', fieldLabel: 'نوع التوظيف',
            value: payslip.employmentTypeCode || '', severity: SEVERITY.ERROR,
            message: 'كود نوع التوظيف غير صحيح',
            suggestion: 'استخدم أحد أكواد التوظيف المعتمدة',
            recordId: recId, recordName: recName,
        }));
    }

    // PaidDate - تاريخ الصرف
    if (payslip.paidDate && !isValidDate(payslip.paidDate)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'paidDate', fieldLabel: 'تاريخ الصرف',
            value: payslip.paidDate, severity: SEVERITY.WARNING,
            message: 'صيغة تاريخ الصرف غير صحيحة',
            suggestion: 'استخدم صيغة YYYY-MM-DD',
            recordId: recId, recordName: recName,
            autoFixable: true, autoFixFn: 'fixDate',
        }));
    }

    return errors;
}

// ==================== 5. التحقق من بيانات المؤهلات (submitEmployeeQualificationInfo) ====================
export function validateQualificationInfo(qualification) {
    const errors = [];
    const type = 'qualificationInfo';
    const recId = qualification.employeeId || qualification.id;
    const recName = qualification.employeeName || qualification.name || 'غير محدد';

    // EmployeeID
    if (!qualification.employeeId) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'employeeId', fieldLabel: 'رقم الموظف',
            value: '', severity: SEVERITY.CRITICAL,
            message: 'رقم الموظف مطلوب',
            suggestion: 'أدخل رقم الموظف',
            recordId: recId, recordName: recName,
        }));
    }

    // QualificationCode - كود المؤهل
    if (qualification.qualificationCode && !isValidCode(qualification.qualificationCode, QUALIFICATION_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'qualificationCode', fieldLabel: 'كود المؤهل',
            value: qualification.qualificationCode || '', severity: SEVERITY.ERROR,
            message: 'كود المؤهل غير صحيح',
            suggestion: 'استخدم أحد أكواد المؤهلات المعتمدة (مثل: 01=ابتدائي، 06=بكالوريوس)',
            recordId: recId, recordName: recName,
        }));
    }

    // MajorCode - كود التخصص
    if (qualification.majorCode && !isValidCode(qualification.majorCode, MAJOR_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'majorCode', fieldLabel: 'كود التخصص',
            value: qualification.majorCode || '', severity: SEVERITY.ERROR,
            message: 'كود التخصص غير صحيح',
            suggestion: 'استخدم أحد أكواد التخصصات المعتمدة',
            recordId: recId, recordName: recName,
        }));
    }

    // UniversityCode - كود الجامعة
    if (qualification.universityCode && !isValidCode(qualification.universityCode, UNIVERSITY_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'universityCode', fieldLabel: 'كود الجامعة',
            value: qualification.universityCode || '', severity: SEVERITY.WARNING,
            message: 'كود الجامعة غير صحيح',
            suggestion: 'استخدم أحد أكواد الجامعات المعتمدة',
            recordId: recId, recordName: recName,
        }));
    }

    // GraduationDate - تاريخ التخرج
    if (qualification.graduationDate && !isValidDate(qualification.graduationDate)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'graduationDate', fieldLabel: 'تاريخ التخرج',
            value: qualification.graduationDate, severity: SEVERITY.WARNING,
            message: 'صيغة تاريخ التخرج غير صحيحة',
            suggestion: 'استخدم صيغة YYYY-MM-DD',
            recordId: recId, recordName: recName,
            autoFixable: true, autoFixFn: 'fixDate',
        }));
    }

    // GPA - المعدل
    if (qualification.gpa !== undefined && qualification.gpa !== null && qualification.gpa !== '') {
        const gpa = parseFloat(qualification.gpa);
        if (isNaN(gpa) || gpa < 0 || gpa > 5) {
            errors.push(new EltizamValidationError({
                submissionType: type, field: 'gpa', fieldLabel: 'المعدل',
                value: qualification.gpa, severity: SEVERITY.WARNING,
                message: 'المعدل يجب أن يكون بين 0 و 5',
                suggestion: 'أدخل المعدل التراكمي (0-5)',
                recordId: recId, recordName: recName,
            }));
        }
    }

    // Country - بلد الدراسة
    if (qualification.country && !isValidCode(qualification.country, NATIONALITY_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'country', fieldLabel: 'بلد الدراسة',
            value: qualification.country || '', severity: SEVERITY.INFO,
            message: 'كود بلد الدراسة غير مطابق',
            suggestion: 'استخدم أحد أكواد الدول المعتمدة',
            recordId: recId, recordName: recName,
        }));
    }

    return errors;
}

// ==================== 6. التحقق من بيانات الإجازات (submitEmployeeVacationInfo) ====================
export function validateVacationInfo(vacation) {
    const errors = [];
    const type = 'vacationInfo';
    const recId = vacation.employeeId || vacation.id;
    const recName = vacation.employeeName || vacation.name || 'غير محدد';

    // EmployeeID
    if (!vacation.employeeId) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'employeeId', fieldLabel: 'رقم الموظف',
            value: '', severity: SEVERITY.CRITICAL,
            message: 'رقم الموظف مطلوب',
            suggestion: 'أدخل رقم الموظف',
            recordId: recId, recordName: recName,
        }));
    }

    // PersonIdentifier - رقم الهوية
    if (!vacation.nationalId && !vacation.personIdentifier) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'nationalId', fieldLabel: 'رقم الهوية',
            value: '', severity: SEVERITY.ERROR,
            message: 'رقم الهوية مطلوب',
            suggestion: 'أدخل رقم الهوية',
            recordId: recId, recordName: recName,
        }));
    }

    // VacationCode - كود الإجازة (مطلوب)
    if (!vacation.vacationCode) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'vacationCode', fieldLabel: 'كود الإجازة',
            value: '', severity: SEVERITY.CRITICAL,
            message: 'كود الإجازة مطلوب',
            suggestion: 'اختر نوع الإجازة من القائمة',
            recordId: recId, recordName: recName,
        }));
    } else if (!isValidCode(vacation.vacationCode, VACATION_CODES)) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'vacationCode', fieldLabel: 'كود الإجازة',
            value: vacation.vacationCode, severity: SEVERITY.ERROR,
            message: 'كود الإجازة غير صحيح',
            suggestion: 'استخدم أحد أكواد الإجازات المعتمدة (01-27)',
            recordId: recId, recordName: recName,
        }));
    }

    // StartDate - تاريخ البداية
    if (!vacation.startDate) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'startDate', fieldLabel: 'تاريخ البداية',
            value: '', severity: SEVERITY.CRITICAL,
            message: 'تاريخ بداية الإجازة مطلوب',
            suggestion: 'أدخل تاريخ البداية بصيغة YYYY-MM-DD',
            recordId: recId, recordName: recName,
        }));
    }

    // EndDate - تاريخ النهاية
    if (!vacation.endDate) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'endDate', fieldLabel: 'تاريخ النهاية',
            value: '', severity: SEVERITY.CRITICAL,
            message: 'تاريخ نهاية الإجازة مطلوب',
            suggestion: 'أدخل تاريخ النهاية بصيغة YYYY-MM-DD',
            recordId: recId, recordName: recName,
        }));
    }

    // التحقق من أن النهاية بعد البداية
    if (vacation.startDate && vacation.endDate) {
        const start = new Date(vacation.startDate);
        const end = new Date(vacation.endDate);
        if (end < start) {
            errors.push(new EltizamValidationError({
                submissionType: type, field: 'endDate', fieldLabel: 'تاريخ النهاية',
                value: `${vacation.startDate} ← ${vacation.endDate}`,
                severity: SEVERITY.ERROR,
                message: 'تاريخ النهاية قبل تاريخ البداية',
                suggestion: 'تأكد من أن تاريخ النهاية بعد تاريخ البداية',
                recordId: recId, recordName: recName,
            }));
        }
    }

    // Period - المدة بالأيام
    if (vacation.period !== undefined && vacation.period !== null) {
        const period = parseInt(vacation.period);
        if (isNaN(period) || period < 1 || period > 730) {
            errors.push(new EltizamValidationError({
                submissionType: type, field: 'period', fieldLabel: 'المدة (أيام)',
                value: vacation.period, severity: SEVERITY.WARNING,
                message: 'مدة الإجازة غير منطقية',
                suggestion: 'تأكد من عدد أيام الإجازة',
                recordId: recId, recordName: recName,
            }));
        }
    }

    // DecisionNumber - رقم القرار
    if (!vacation.decisionNumber) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'decisionNumber', fieldLabel: 'رقم القرار',
            value: '', severity: SEVERITY.WARNING,
            message: 'رقم القرار مفقود',
            suggestion: 'أدخل رقم قرار الإجازة',
            recordId: recId, recordName: recName,
        }));
    }

    return errors;
}

// ==================== 7. التحقق من بيانات تقييم الأداء (submitEmployeeAppraisalInfo) ====================
export function validateAppraisalInfo(appraisal) {
    const errors = [];
    const type = 'appraisalInfo';
    const recId = appraisal.employeeId || appraisal.id;
    const recName = appraisal.employeeName || appraisal.name || 'غير محدد';

    // EmployeeID
    if (!appraisal.employeeId) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'employeeId', fieldLabel: 'رقم الموظف',
            value: '', severity: SEVERITY.CRITICAL,
            message: 'رقم الموظف مطلوب',
            suggestion: 'أدخل رقم الموظف',
            recordId: recId, recordName: recName,
        }));
    }

    // NationalID
    if (!appraisal.nationalId || !/^[12]\d{9}$/.test(appraisal.nationalId?.toString())) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'nationalId', fieldLabel: 'رقم الهوية',
            value: appraisal.nationalId || '', severity: SEVERITY.CRITICAL,
            message: 'رقم الهوية غير صحيح',
            suggestion: 'يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2',
            recordId: recId, recordName: recName,
        }));
    }

    // AppraisalYear - سنة التقييم (هجري)
    if (!appraisal.appraisalYear) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'appraisalYear', fieldLabel: 'سنة التقييم',
            value: '', severity: SEVERITY.ERROR,
            message: 'سنة التقييم مطلوبة',
            suggestion: 'أدخل السنة الهجرية (مثل 1446)',
            recordId: recId, recordName: recName,
        }));
    }

    // RatingCode - كود التقدير
    const validRatings = ['1', '2', '3', '4', '5', 'A', 'B', 'C', 'D', 'E'];
    if (appraisal.ratingCode && !validRatings.includes(appraisal.ratingCode?.toString())) {
        errors.push(new EltizamValidationError({
            submissionType: type, field: 'ratingCode', fieldLabel: 'كود التقدير',
            value: appraisal.ratingCode || '', severity: SEVERITY.ERROR,
            message: 'كود التقدير غير صحيح',
            suggestion: 'استخدم: 1=ممتاز، 2=جيد جداً، 3=جيد، 4=مقبول، 5=غير مرضي',
            recordId: recId, recordName: recName,
        }));
    }

    // Score - الدرجة (0-100)
    if (appraisal.score !== undefined && appraisal.score !== null) {
        const score = parseFloat(appraisal.score);
        if (isNaN(score) || score < 0 || score > 100) {
            errors.push(new EltizamValidationError({
                submissionType: type, field: 'score', fieldLabel: 'الدرجة',
                value: appraisal.score, severity: SEVERITY.ERROR,
                message: 'الدرجة يجب أن تكون بين 0 و 100',
                suggestion: 'أدخل درجة التقييم (0-100)',
                recordId: recId, recordName: recName,
            }));
        }
    }

    return errors;
}

// ==================== محرك التحقق الشامل ====================
export function runFullValidation(data) {
    const result = {
        timestamp: new Date().toISOString(),
        categories: {},
        totalErrors: 0,
        totalWarnings: 0,
        totalCritical: 0,
        totalRecords: 0,
        totalValid: 0,
        totalInvalid: 0,
        overallScore: 0,
        allErrors: [],
    };

    const validators = {
        employeeInfo: { fn: validateEmployeeInfo, data: data.employees || [] },
        historicalInfo: { fn: validateHistoricalInfo, data: data.historical || [] },
        jobInfo: { fn: validateJobInfo, data: data.jobs || [] },
        payslipInfo: { fn: validatePayslipInfo, data: data.payslips || [] },
        qualificationInfo: { fn: validateQualificationInfo, data: data.qualifications || [] },
        vacationInfo: { fn: validateVacationInfo, data: data.vacations || [] },
        appraisalInfo: { fn: validateAppraisalInfo, data: data.appraisals || [] },
    };

    for (const [key, { fn, data: records }] of Object.entries(validators)) {
        const subType = Object.values(SUBMISSION_TYPES).find(s => s.id === key);
        const categoryResult = {
            label: subType?.label || key,
            labelEn: subType?.labelEn || key,
            icon: subType?.icon || '',
            totalRecords: records.length,
            validRecords: 0,
            invalidRecords: 0,
            errors: [],
            warnings: [],
            critical: [],
            fieldErrors: {},
        };

        records.forEach(record => {
            const errors = fn(record);
            const criticals = errors.filter(e => e.severity === SEVERITY.CRITICAL);
            const errs = errors.filter(e => e.severity === SEVERITY.ERROR);
            const warns = errors.filter(e => e.severity === SEVERITY.WARNING || e.severity === SEVERITY.INFO);

            if (criticals.length > 0 || errs.length > 0) {
                categoryResult.invalidRecords++;
            } else {
                categoryResult.validRecords++;
            }

            categoryResult.critical.push(...criticals);
            categoryResult.errors.push(...errs);
            categoryResult.warnings.push(...warns);

            errors.forEach(e => {
                if (!categoryResult.fieldErrors[e.field]) {
                    categoryResult.fieldErrors[e.field] = { label: e.fieldLabel, count: 0 };
                }
                categoryResult.fieldErrors[e.field].count++;
            });

            result.allErrors.push(...errors);
        });

        result.totalRecords += categoryResult.totalRecords;
        result.totalValid += categoryResult.validRecords;
        result.totalInvalid += categoryResult.invalidRecords;
        result.totalCritical += categoryResult.critical.length;
        result.totalErrors += categoryResult.errors.length;
        result.totalWarnings += categoryResult.warnings.length;

        result.categories[key] = categoryResult;
    }

    // حساب النسبة المئوية
    result.overallScore = result.totalRecords > 0
        ? Math.round((result.totalValid / result.totalRecords) * 100)
        : 100;

    return result;
}

// ==================== دوال الإصلاح التلقائي ====================
export const AUTO_FIX_FUNCTIONS = {
    fixNationalId: (value) => {
        if (!value) return null;
        let cleaned = value.toString().replace(/[\s-]/g, '');
        cleaned = cleaned.replace(/^0+/, '');
        return /^[12]\d{9}$/.test(cleaned) ? cleaned : null;
    },

    fixIBAN: (value) => {
        if (!value) return null;
        let cleaned = value.replace(/[\s-]/g, '').toUpperCase();
        if (/^\d{22}$/.test(cleaned)) cleaned = 'SA' + cleaned;
        return /^SA\d{22}$/.test(cleaned) ? cleaned : null;
    },

    fixBankCode: (value) => {
        if (!value) return null;
        const num = parseInt(value, 10);
        return (!isNaN(num) && num >= 0 && num <= 99) ? num.toString().padStart(2, '0') : null;
    },

    fixDate: (value) => {
        if (!value) return null;
        const patterns = [
            { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, order: ['y', 'm', 'd'] },
            { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: ['d', 'm', 'y'] },
            { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, order: ['d', 'm', 'y'] },
        ];
        for (const { regex, order } of patterns) {
            const match = value.match(regex);
            if (match) {
                const parts = {};
                order.forEach((key, idx) => { parts[key] = match[idx + 1]; });
                const fixed = `${parts.y}-${parts.m.padStart(2, '0')}-${parts.d.padStart(2, '0')}`;
                if (/^\d{4}-\d{2}-\d{2}$/.test(fixed)) return fixed;
            }
        }
        return null;
    },

    fixGender: (value) => {
        if (!value) return null;
        const val = value.toString().trim().toLowerCase();
        const maleValues = ['m', 'male', 'ذكر', '1', 'رجل'];
        const femaleValues = ['f', 'female', 'أنثى', '2', 'انثى', 'امرأة'];
        if (maleValues.includes(val)) return 'M';
        if (femaleValues.includes(val)) return 'F';
        return null;
    },

    fixPhone: (value) => {
        if (!value) return null;
        let cleaned = value.toString().replace(/[\s-()]/g, '');
        if (cleaned.startsWith('966')) cleaned = '0' + cleaned.slice(3);
        if (cleaned.startsWith('+966')) cleaned = '0' + cleaned.slice(4);
        if (/^05\d{8}$/.test(cleaned)) return cleaned;
        return null;
    },
};

// تطبيق الإصلاح التلقائي على خطأ واحد
export function applyAutoFix(error, currentValue) {
    if (!error.autoFixable || !error.autoFixFn) return null;
    const fixFn = AUTO_FIX_FUNCTIONS[error.autoFixFn];
    if (!fixFn) return null;
    return fixFn(currentValue);
}

// ==================== تصدير تقرير Excel ====================
export function exportValidationToCSV(validationResult) {
    const rows = [];

    // رأس الجدول
    rows.push([
        'نوع التقديم', 'رقم السجل', 'اسم السجل', 'الحقل',
        'اسم الحقل', 'القيمة الحالية', 'الخطورة', 'الخطأ', 'الاقتراح', 'قابل للإصلاح التلقائي'
    ]);

    // كل الأخطاء
    validationResult.allErrors.forEach(error => {
        const subType = Object.values(SUBMISSION_TYPES).find(s => s.id === error.submissionType);
        rows.push([
            subType?.label || error.submissionType,
            error.recordId || '',
            error.recordName || '',
            error.field || '',
            error.fieldLabel || '',
            error.value?.toString() || '',
            SEVERITY_LABELS[error.severity] || error.severity,
            error.message || '',
            error.suggestion || '',
            error.autoFixable ? 'نعم' : 'لا',
        ]);
    });

    // تحويل إلى CSV مع BOM
    const csvContent = rows.map(row =>
        row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    return '\uFEFF' + csvContent;
}

export function downloadValidationReport(validationResult, filename = 'compliance_validation') {
    const csvContent = exportValidationToCSV(validationResult);
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

export default {
    SUBMISSION_TYPES,
    SEVERITY,
    EltizamValidationError,
    validateEmployeeInfo,
    validateHistoricalInfo,
    validateJobInfo,
    validatePayslipInfo,
    validateQualificationInfo,
    validateVacationInfo,
    validateAppraisalInfo,
    runFullValidation,
    AUTO_FIX_FUNCTIONS,
    applyAutoFix,
    exportValidationToCSV,
    downloadValidationReport,
};
