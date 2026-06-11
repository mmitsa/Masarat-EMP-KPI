/**
 * HR Helpers - أدوات الموارد البشرية
 * Utility functions for HR operations
 */

import {
    VACATION_CODES,
    EMPLOYEE_STATUS_CODES,
    ELEMENT_CODES,
    SALARY_SCALES,
    QUALIFICATION_CODES,
    GENDER_CODES,
    NATIONALITY_CODES,
    MARITAL_STATUS_CODES,
    CONTRACT_TYPE_CODES,
} from '../constants/eltizam-codes';

// ==================== تحويل التاريخ ====================
/**
 * تحويل من ميلادي إلى هجري
 */
export function gregorianToHijri(gregorianDate) {
    if (!gregorianDate) return null;
    const date = new Date(gregorianDate);
    try {
        const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
        return hijri;
    } catch {
        return null;
    }
}

/**
 * تحويل من ميلادي إلى هجري (رقمي)
 */
export function gregorianToHijriNumeric(gregorianDate) {
    if (!gregorianDate) return null;
    const date = new Date(gregorianDate);
    try {
        const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
        return hijri;
    } catch {
        return null;
    }
}

/**
 * تنسيق التاريخ بالعربية مع الهجري
 * يعرض التاريخ الهجري أولاً ثم الميلادي بين قوسين
 * مثال: ٢٦ ربيع الآخر ١٤٠٣ هـ (2 مايو 1983 م)
 */
export function formatDateArabic(date, options = {}) {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const gregOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        ...options,
    };
    const greg = d.toLocaleDateString('ar-SA', gregOptions);

    try {
        const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(d);
        return `${hijri} هـ (${greg} م)`;
    } catch {
        return greg;
    }
}

/**
 * حساب عدد الأيام بين تاريخين
 */
export function daysBetween(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * حساب مدة الخدمة
 */
export function calculateServiceDuration(hireDate, endDate = new Date()) {
    if (!hireDate) return { years: 0, months: 0, days: 0, total: '' };

    const start = new Date(hireDate);
    const end = new Date(endDate);

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
        months--;
        days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} سنة`);
    if (months > 0) parts.push(`${months} شهر`);
    if (days > 0) parts.push(`${days} يوم`);

    return {
        years,
        months,
        days,
        total: parts.join(' و ') || '0 يوم',
    };
}

// ==================== حسابات الراتب ====================
/**
 * حساب بدل السكن (25% من الأساسي)
 */
export function calculateHousingAllowance(basicSalary, percentage = 25) {
    return (basicSalary * percentage) / 100;
}

/**
 * حساب خصم التأمينات الاجتماعية
 */
export function calculateGOSI(basicSalary, housingAllowance = 0, isSaudi = true) {
    const total = basicSalary + housingAllowance;
    const employeeRate = isSaudi ? 9.75 : 2; // 9.75% للسعودي، 2% لغير السعودي
    return (total * employeeRate) / 100;
}

/**
 * حساب صافي الراتب
 */
export function calculateNetSalary(salaryDetails) {
    const {
        basicSalary = 0,
        housingAllowance = 0,
        transportAllowance = 0,
        otherAllowances = 0,
        gosiDeduction = 0,
        loanDeduction = 0,
        absenceDeduction = 0,
        otherDeductions = 0,
    } = salaryDetails;

    const totalEarnings = basicSalary + housingAllowance + transportAllowance + otherAllowances;
    const totalDeductions = gosiDeduction + loanDeduction + absenceDeduction + otherDeductions;

    return {
        totalEarnings,
        totalDeductions,
        netSalary: totalEarnings - totalDeductions,
    };
}

/**
 * حساب خصم الغياب
 */
export function calculateAbsenceDeduction(dailySalary, absenceDays) {
    return dailySalary * absenceDays;
}

/**
 * حساب الراتب اليومي
 */
export function calculateDailySalary(monthlySalary) {
    return monthlySalary / 30;
}

/**
 * حساب الأجر بالساعة
 */
export function calculateHourlySalary(monthlySalary, hoursPerDay = 8) {
    return monthlySalary / 30 / hoursPerDay;
}

/**
 * حساب مكافأة نهاية الخدمة
 */
export function calculateEndOfService(basicSalary, serviceYears, terminationType = 'resignation') {
    if (serviceYears <= 0) return 0;

    let amount = 0;
    const halfMonthSalary = basicSalary / 2;
    const fullMonthSalary = basicSalary;

    // أول 5 سنوات: نصف راتب شهري عن كل سنة
    const firstFiveYears = Math.min(serviceYears, 5);
    amount += firstFiveYears * halfMonthSalary;

    // بعد 5 سنوات: راتب شهري كامل عن كل سنة
    if (serviceYears > 5) {
        const remainingYears = serviceYears - 5;
        amount += remainingYears * fullMonthSalary;
    }

    // تعديل حسب نوع انتهاء الخدمة
    switch (terminationType) {
        case 'resignation':
            if (serviceYears >= 2 && serviceYears < 5) {
                amount = amount * (1 / 3);
            } else if (serviceYears >= 5 && serviceYears < 10) {
                amount = amount * (2 / 3);
            }
            break;
        case 'termination':
        case 'retirement':
        case 'death':
            // يستحق المكافأة كاملة
            break;
        default:
            break;
    }

    return Math.round(amount);
}

/**
 * الحصول على الراتب من سلم الرواتب
 */
export function getSalaryFromScale(scaleId, rank, step) {
    const scale = Object.values(SALARY_SCALES).find(s => s.id === scaleId);
    if (!scale) return null;

    const rankData = scale.ranks.find(r => r.rank === rank);
    if (!rankData || !rankData.steps[step - 1]) return null;

    return rankData.steps[step - 1];
}

// ==================== حسابات الإجازات ====================
/**
 * حساب رصيد الإجازة السنوية
 */
export function calculateAnnualLeaveBalance(hireDate, usedDays = 0, leavePerYear = 21) {
    const serviceDuration = calculateServiceDuration(hireDate);
    const totalYears = serviceDuration.years + (serviceDuration.months / 12);
    const earnedDays = Math.floor(totalYears * leavePerYear);
    return {
        earned: earnedDays,
        used: usedDays,
        remaining: earnedDays - usedDays,
    };
}

/**
 * التحقق من صلاحية طلب الإجازة
 */
export function validateLeaveRequest(request, balance, rules = {}) {
    const errors = [];
    const { startDate, endDate, leaveType } = request;
    const days = daysBetween(startDate, endDate);

    // التحقق من الرصيد
    if (days > balance) {
        errors.push('عدد أيام الإجازة المطلوبة يتجاوز الرصيد المتاح');
    }

    // التحقق من الحد الأدنى
    if (rules.minDays && days < rules.minDays) {
        errors.push(`الحد الأدنى للإجازة ${rules.minDays} أيام`);
    }

    // التحقق من الحد الأقصى
    if (rules.maxDays && days > rules.maxDays) {
        errors.push(`الحد الأقصى للإجازة ${rules.maxDays} يوم`);
    }

    // التحقق من تاريخ البداية
    if (new Date(startDate) < new Date()) {
        errors.push('لا يمكن طلب إجازة بتاريخ سابق');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// ==================== تنسيق البيانات ====================
/**
 * تنسيق المبلغ بالريال السعودي
 */
export function formatCurrency(amount, options = {}) {
    if (amount == null || isNaN(amount)) return '-';
    const { showSymbol = true, decimals = 2 } = options;
    const formatted = Number(amount).toLocaleString('ar-SA', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    return showSymbol ? `${formatted} ر.س` : formatted;
}

/**
 * تنسيق رقم الهاتف السعودي
 */
export function formatPhoneNumber(phone) {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10 && cleaned.startsWith('05')) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('966')) {
        return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }
    return phone;
}

/**
 * تنسيق رقم الهوية
 */
export function formatNationalId(id) {
    if (!id) return '-';
    return id.toString().replace(/(\d{1})(\d{4})(\d{4})(\d{1})/, '$1-$2-$3-$4');
}

/**
 * تنسيق رقم الآيبان
 */
export function formatIBAN(iban) {
    if (!iban) return '-';
    return iban.replace(/(.{4})/g, '$1 ').trim();
}

// ==================== التحقق من صحة البيانات ====================
/**
 * التحقق من رقم الهوية السعودية
 */
export function validateNationalId(id) {
    if (!id || id.length !== 10) return { valid: false, error: 'رقم الهوية يجب أن يكون 10 أرقام' };
    if (!/^\d+$/.test(id)) return { valid: false, error: 'رقم الهوية يجب أن يحتوي على أرقام فقط' };
    if (!['1', '2'].includes(id[0])) return { valid: false, error: 'رقم الهوية يجب أن يبدأ بـ 1 أو 2' };

    // خوارزمية التحقق من رقم الهوية
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        let digit = parseInt(id[i]);
        if (i % 2 === 0) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
    }

    if (sum % 10 !== 0) {
        return { valid: false, error: 'رقم الهوية غير صحيح' };
    }

    return { valid: true, type: id[0] === '1' ? 'سعودي' : 'مقيم' };
}

/**
 * التحقق من رقم الجوال السعودي
 */
export function validateSaudiPhone(phone) {
    if (!phone) return { valid: false, error: 'رقم الجوال مطلوب' };
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10 && cleaned.startsWith('05')) {
        return { valid: true };
    }
    if (cleaned.length === 12 && cleaned.startsWith('966') && cleaned[3] === '5') {
        return { valid: true };
    }
    return { valid: false, error: 'رقم الجوال غير صحيح' };
}

/**
 * التحقق من البريد الإلكتروني
 */
export function validateEmail(email) {
    if (!email) return { valid: false, error: 'البريد الإلكتروني مطلوب' };
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
        valid: regex.test(email),
        error: regex.test(email) ? null : 'البريد الإلكتروني غير صحيح',
    };
}

/**
 * التحقق من الآيبان السعودي
 */
export function validateSaudiIBAN(iban) {
    if (!iban) return { valid: false, error: 'الآيبان مطلوب' };
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    if (!cleaned.startsWith('SA')) {
        return { valid: false, error: 'الآيبان السعودي يجب أن يبدأ بـ SA' };
    }
    if (cleaned.length !== 24) {
        return { valid: false, error: 'الآيبان السعودي يجب أن يكون 24 حرف' };
    }
    return { valid: true };
}

// ==================== توليد الوثائق ====================
/**
 * توليد رقم مرجعي
 */
export function generateReferenceNumber(prefix = 'REF') {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Date.now().toString().slice(-4);
    return `${prefix}-${year}${month}${day}-${random}`;
}

/**
 * توليد بيانات تعريف الراتب
 */
export function generateSalaryDefinitionData(employee, salaryDetails) {
    const today = new Date();
    const serviceDuration = calculateServiceDuration(employee.hireDate);

    return {
        referenceNumber: generateReferenceNumber('SAL'),
        issueDate: today.toISOString(),
        issueDateHijri: gregorianToHijri(today),
        employee: {
            name: employee.fullName || `${employee.firstName} ${employee.lastName}`,
            nameEn: employee.fullNameEn || employee.name_en,
            nationalId: employee.nationalId,
            employeeNumber: employee.employeeNumber,
            position: employee.position,
            department: employee.departmentName,
            hireDate: employee.hireDate,
            hireDateHijri: gregorianToHijri(employee.hireDate),
            serviceDuration: serviceDuration.total,
        },
        salary: {
            basicSalary: salaryDetails.basicSalary,
            housingAllowance: salaryDetails.housingAllowance,
            transportAllowance: salaryDetails.transportAllowance,
            otherAllowances: salaryDetails.otherAllowances || 0,
            totalSalary: salaryDetails.basicSalary +
                         (salaryDetails.housingAllowance || 0) +
                         (salaryDetails.transportAllowance || 0) +
                         (salaryDetails.otherAllowances || 0),
        },
    };
}

/**
 * توليد بيانات بطاقة الموظف
 */
export function generateEmployeeCardData(employee) {
    return {
        cardNumber: generateReferenceNumber('EMP'),
        issueDate: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // صالحة لسنة
        employee: {
            photo: employee.photo,
            name: employee.fullName || `${employee.firstName} ${employee.lastName}`,
            nameEn: employee.fullNameEn,
            nationalId: employee.nationalId,
            employeeNumber: employee.employeeNumber,
            position: employee.position,
            department: employee.departmentName,
            bloodType: employee.bloodType,
            emergencyContact: employee.emergencyContact,
            emergencyPhone: employee.emergencyPhone,
        },
    };
}

/**
 * توليد بيانات إخلاء الطرف
 */
export function generateClearanceData(employee, departments) {
    const defaultDepartments = [
        { id: 'hr', name: 'الموارد البشرية', nameEn: 'Human Resources' },
        { id: 'finance', name: 'الشؤون المالية', nameEn: 'Finance' },
        { id: 'it', name: 'تقنية المعلومات', nameEn: 'IT' },
        { id: 'admin', name: 'الشؤون الإدارية', nameEn: 'Administration' },
        { id: 'security', name: 'الأمن', nameEn: 'Security' },
        { id: 'warehouse', name: 'المستودعات', nameEn: 'Warehouse' },
        { id: 'transport', name: 'النقل', nameEn: 'Transport' },
    ];

    return {
        referenceNumber: generateReferenceNumber('CLR'),
        issueDate: new Date().toISOString(),
        employee: {
            name: employee.fullName || `${employee.firstName} ${employee.lastName}`,
            nationalId: employee.nationalId,
            employeeNumber: employee.employeeNumber,
            position: employee.position,
            department: employee.departmentName,
            hireDate: employee.hireDate,
            terminationDate: employee.terminationDate || new Date().toISOString(),
            terminationReason: employee.terminationReason,
        },
        departments: (departments || defaultDepartments).map(dept => ({
            ...dept,
            status: 'pending', // pending, approved, rejected
            approvedBy: null,
            approvedDate: null,
            notes: '',
        })),
    };
}

/**
 * توليد بيانات بيان الخدمات
 */
export function generateServiceStatementData(employee, services = []) {
    const serviceDuration = calculateServiceDuration(employee.hireDate, employee.terminationDate || new Date());

    return {
        referenceNumber: generateReferenceNumber('SVC'),
        issueDate: new Date().toISOString(),
        employee: {
            name: employee.fullName || `${employee.firstName} ${employee.lastName}`,
            nationalId: employee.nationalId,
            employeeNumber: employee.employeeNumber,
            qualification: employee.qualification,
            major: employee.major,
        },
        services: services.length > 0 ? services : [{
            employer: 'الجهة الحالية',
            position: employee.position,
            department: employee.departmentName,
            startDate: employee.hireDate,
            endDate: employee.terminationDate || 'حتى الآن',
            duration: serviceDuration.total,
            salary: employee.salary,
            notes: '',
        }],
        totalServiceYears: serviceDuration.years,
        totalServiceMonths: serviceDuration.months,
        totalServiceDays: serviceDuration.days,
    };
}

// ==================== تحويل البيانات لنظام التزام ====================
/**
 * تحويل بيانات الموظف لصيغة التزام
 */
export function convertToEltizamFormat(employee) {
    return {
        EmployeeID: employee.nationalId,
        EmployeeNameAr: employee.fullName || `${employee.firstName} ${employee.lastName}`,
        EmployeeNameEn: employee.fullNameEn || '',
        NationalID: employee.nationalId,
        Gender: employee.gender === 'male' ? '1' : '2',
        NationalityCode: getNationalityCode(employee.nationality),
        DateOfBirth: formatDateForEltizam(employee.birthDate),
        HireDate: formatDateForEltizam(employee.hireDate),
        DepartmentCode: employee.departmentCode,
        PositionCode: employee.positionCode,
        RankCode: employee.rankCode,
        StepNo: employee.step,
        BasicSalary: employee.basicSalary,
        HousingAllowance: employee.housingAllowance,
        TransportAllowance: employee.transportAllowance,
        OtherAllowances: employee.otherAllowances || 0,
        IBAN: employee.iban,
        BankCode: employee.bankCode,
        Status: getEmployeeStatusCode(employee.status),
        Email: employee.email,
        Mobile: employee.phone,
    };
}

/**
 * تحويل بيانات الراتب لصيغة التزام
 */
export function convertPayslipToEltizam(payslip) {
    return {
        EmployeeID: payslip.nationalId,
        Month: payslip.month,
        Year: payslip.year,
        BasicSalary: payslip.basicSalary,
        Elements: [
            { ElementCode: '002', Amount: payslip.housingAllowance },
            { ElementCode: '003', Amount: payslip.transportAllowance },
            { ElementCode: '101', Amount: -payslip.gosiDeduction },
            ...Object.entries(payslip.otherElements || {}).map(([code, amount]) => ({
                ElementCode: code,
                Amount: amount,
            })),
        ],
        NetSalary: payslip.netSalary,
    };
}

function formatDateForEltizam(date) {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getNationalityCode(nationality) {
    const found = Object.values(NATIONALITY_CODES).find(
        n => n.name === nationality || n.nameEn?.toLowerCase() === nationality?.toLowerCase()
    );
    return found?.code || '999';
}

function getEmployeeStatusCode(status) {
    const statusMap = {
        'Active': '01',
        'OnLeave': '02',
        'Suspended': '10',
        'Resigned': '20',
        'Terminated': '21',
        'Retired': '22',
    };
    return statusMap[status] || '01';
}

// ==================== تصدير الملفات ====================
/**
 * تصدير إلى Excel
 */
export function prepareExcelData(data, columns) {
    return data.map(row => {
        const excelRow = {};
        columns.forEach(col => {
            excelRow[col.label] = col.render ? col.render(row[col.key], row) : row[col.key];
        });
        return excelRow;
    });
}

/**
 * تصدير إلى CSV
 */
export function exportToCSV(data, columns, filename = 'export') {
    const headers = columns.map(col => col.label).join(',');
    const rows = data.map(row =>
        columns.map(col => {
            const value = col.render ? col.render(row[col.key], row) : row[col.key];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
}

// Export all helpers
export default {
    // Date helpers
    gregorianToHijri,
    gregorianToHijriNumeric,
    formatDateArabic,
    daysBetween,
    calculateServiceDuration,

    // Salary helpers
    calculateHousingAllowance,
    calculateGOSI,
    calculateNetSalary,
    calculateAbsenceDeduction,
    calculateDailySalary,
    calculateHourlySalary,
    calculateEndOfService,
    getSalaryFromScale,

    // Leave helpers
    calculateAnnualLeaveBalance,
    validateLeaveRequest,

    // Formatting helpers
    formatCurrency,
    formatPhoneNumber,
    formatNationalId,
    formatIBAN,

    // Validation helpers
    validateNationalId,
    validateSaudiPhone,
    validateEmail,
    validateSaudiIBAN,

    // Document generators
    generateReferenceNumber,
    generateSalaryDefinitionData,
    generateEmployeeCardData,
    generateClearanceData,
    generateServiceStatementData,

    // ELtizam converters
    convertToEltizamFormat,
    convertPayslipToEltizam,

    // Export helpers
    prepareExcelData,
    exportToCSV,
};
