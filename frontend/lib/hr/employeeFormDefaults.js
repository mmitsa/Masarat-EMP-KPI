/**
 * القيم الافتراضية لنموذج بيانات الموظف
 * يُستخدم في إنشاء موظف جديد وإعادة تعيين النموذج
 */

export const INITIAL_FORM_DATA = {
    // البيانات الشخصية - الاسم الرباعي حسب اشتراطات نظام التزام
    nationalId: '',
    firstNameAr: '',
    fatherNameAr: '',
    grandfatherNameAr: '',
    familyNameAr: '',
    firstNameEn: '',
    fatherNameEn: '',
    grandfatherNameEn: '',
    familyNameEn: '',
    gender: 'M',
    birthDate: '',
    birthPlace: '',
    nationality: '001',
    religion: '01',
    maritalStatus: '01',
    childrenCount: 0,

    // بيانات الاتصال
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    postalCode: '',
    emergencyContact: '',
    emergencyPhone: '',

    // البيانات الوظيفية
    employeeNumber: '',
    departmentId: '',
    sectionId: '',
    unitId: '',
    position: '',
    jobTitle: '',
    jobGrade: '',
    jobLevel: '',
    managerId: '',
    branchId: '',
    hireDate: '',
    contractType: '01',
    contractEndDate: '',
    probationEndDate: '',

    // سلم الرواتب والكوادر
    cadreId: '',
    salaryScaleId: '',
    gradeScaleId: '',
    currentStep: '',

    // البيانات المالية
    basicSalary: '',
    housingAllowance: '',
    transportAllowance: '',
    phoneAllowance: '',
    otherAllowances: '',
    bankName: '',
    bankAccount: '',
    iban: '',

    // التأمينات والتقاعد
    socialInsuranceNumber: '',
    socialInsuranceDate: '',
    medicalInsuranceNumber: '',
    medicalInsuranceClass: '',

    // المؤهلات
    educationLevel: '',
    educationSpecialty: '',
    university: '',
    graduationYear: '',

    // بيانات إضافية
    status: 'Active',
    notes: '',
};

export function getDefaultFormData() {
    return { ...INITIAL_FORM_DATA };
}

// حساب الاسم الكامل من الأجزاء الأربعة
export const getFullNameAr = (data) =>
    [data.firstNameAr, data.fatherNameAr, data.grandfatherNameAr, data.familyNameAr].filter(Boolean).join(' ');

export const getFullNameEn = (data) =>
    [data.firstNameEn, data.fatherNameEn, data.grandfatherNameEn, data.familyNameEn].filter(Boolean).join(' ');

// تفكيك الاسم الكامل إلى أجزاء
export const splitName = (fullName) => {
    if (!fullName) return { first: '', father: '', grandfather: '', family: '' };
    const parts = fullName.trim().split(/\s+/);
    return {
        first: parts[0] || '',
        father: parts[1] || '',
        grandfather: parts[2] || '',
        family: parts.slice(3).join(' ') || '',
    };
};

// تحويل قيم الجنس من رموز نصية إلى أرقام صحيحة للـ DB
function normalizeGender(val) {
    if (val === 'M' || val === 'male' || val === 'ذكر') return 1;
    if (val === 'F' || val === 'female' || val === 'أنثى') return 2;
    const num = parseInt(val);
    return (num === 1 || num === 2) ? num : 1; // افتراضي: ذكر
}

// تحويل قيم الحالة الاجتماعية من رموز نصية إلى أرقام
function normalizeMaritalStatus(val) {
    const map = { '01': 1, '02': 2, '03': 3, '04': 4, 'single': 1, 'married': 2, 'divorced': 3, 'widowed': 4 };
    if (map[val]) return map[val];
    const num = parseInt(val);
    return (num >= 1 && num <= 4) ? num : null;
}

// تحويل نوع العقد/التوظيف من رموز نصية إلى أرقام
function normalizeEmploymentType(val) {
    const map = { '01': 1, '02': 2, '03': 3, '04': 4, '05': 5 };
    if (map[val]) return map[val];
    const num = parseInt(val);
    return (!isNaN(num) && num > 0) ? num : null;
}

// بناء بيانات الموظف للإرسال للباك إند
// يشمل جميع الحقول المتاحة في جدول Employees بقاعدة البيانات
export function buildEmployeePayload(formData) {
    const fullNameAr = getFullNameAr(formData);
    const fullNameEn = getFullNameEn(formData);

    return {
        // ══ البيانات الشخصية ══
        arName: fullNameAr,
        enName: fullNameEn || null,
        nationalId: formData.nationalId,
        gender: normalizeGender(formData.gender),
        birthDate: formData.birthDate || null,
        birthPlace: formData.birthPlace || null,
        nationality: formData.nationality,
        religion: formData.religion || null,
        maritalStatus: normalizeMaritalStatus(formData.maritalStatus),
        childrenCount: formData.childrenCount ? parseInt(formData.childrenCount) : 0,

        // ══ بيانات الاتصال ══
        mobile: formData.mobile,
        phone: formData.phone || null,
        email: formData.email,
        address: formData.address || null,
        city: formData.city || null,
        postalCode: formData.postalCode || null,
        emergencyContact: formData.emergencyContact || null,
        emergencyPhone: formData.emergencyPhone || null,

        // ══ البيانات الوظيفية ══
        employeeNumber: formData.employeeNumber || null,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        sectionId: formData.sectionId ? parseInt(formData.sectionId) : null,
        unitId: formData.unitId ? parseInt(formData.unitId) : null,
        managerId: formData.managerId ? parseInt(formData.managerId) : null,
        branchId: formData.branchId ? parseInt(formData.branchId) : null,
        rank: formData.position || formData.jobTitle,
        jobGrade: formData.jobGrade || null,
        jobLevel: formData.jobLevel || null,
        hireDate: formData.hireDate || null,
        contractType: normalizeEmploymentType(formData.contractType),
        contractEndDate: formData.contractEndDate || null,
        probationEndDate: formData.probationEndDate || null,

        // ══ سلم الرواتب والكوادر ══
        cadreId: formData.cadreId ? parseInt(formData.cadreId) : null,
        gradeScaleId: formData.gradeScaleId ? parseInt(formData.gradeScaleId) : null,
        currentStep: formData.currentStep ? parseInt(formData.currentStep) : null,

        // ══ البيانات المالية ══
        basicSalary: formData.basicSalary ? parseFloat(formData.basicSalary) : null,
        housingAllowance: formData.housingAllowance ? parseFloat(formData.housingAllowance) : null,
        transportAllowance: formData.transportAllowance ? parseFloat(formData.transportAllowance) : null,
        phoneAllowance: formData.phoneAllowance ? parseFloat(formData.phoneAllowance) : null,
        otherAllowances: formData.otherAllowances ? parseFloat(formData.otherAllowances) : null,
        bankName: formData.bankName,
        bankAccount: formData.bankAccount,
        iban: formData.iban,

        // ══ التأمينات ══
        socialInsuranceNumber: formData.socialInsuranceNumber || null,
        socialInsuranceDate: formData.socialInsuranceDate || null,
        medicalInsuranceNumber: formData.medicalInsuranceNumber || null,
        medicalInsuranceClass: formData.medicalInsuranceClass || null,

        // ══ المؤهلات ══
        educationLevel: formData.educationLevel || null,
        educationSpecialty: formData.educationSpecialty || null,
        university: formData.university || null,
        graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : null,

        // ══ بيانات إضافية ══
        status: formData.status || 'Active',
        notes: formData.notes || null,
    };
}
