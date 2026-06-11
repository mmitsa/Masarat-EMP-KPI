/**
 * التحقق من صحة بيانات الموظف ومؤشر تطابق التزام
 */

// حقول التزام المطلوبة لمؤشر التطابق
export const ELTIZAM_FORM_FIELDS = {
    personal: {
        label: 'البيانات الشخصية',
        step: 1,
        fields: [
            { key: 'nationalId', label: 'رقم الهوية', validate: v => /^[12]\d{9}$/.test(v) },
            { key: 'firstNameAr', label: 'الاسم الأول', validate: v => v && /[\u0600-\u06FF]/.test(v) },
            { key: 'fatherNameAr', label: 'اسم الأب', validate: v => v && /[\u0600-\u06FF]/.test(v) },
            { key: 'familyNameAr', label: 'اسم العائلة', validate: v => v && /[\u0600-\u06FF]/.test(v) },
            { key: 'gender', label: 'الجنس', validate: v => ['M', 'F', '1', '2'].includes(v) },
            { key: 'birthDate', label: 'تاريخ الميلاد', validate: v => !!v && !isNaN(Date.parse(v)) },
            { key: 'nationality', label: 'الجنسية', validate: v => !!v && v !== '' },
            { key: 'maritalStatus', label: 'الحالة الاجتماعية', validate: v => !!v },
            { key: 'mobile', label: 'رقم الجوال', validate: v => /^05\d{8}$/.test(v || '') },
        ],
    },
    employment: {
        label: 'البيانات الوظيفية',
        step: 2,
        fields: [
            { key: 'employeeNumber', label: 'الرقم الوظيفي', validate: v => !!v },
            { key: 'hireDate', label: 'تاريخ التعيين', validate: v => !!v && !isNaN(Date.parse(v)) },
            { key: 'contractType', label: 'نوع العقد', validate: v => !!v },
            { key: 'position', label: 'المسمى الوظيفي', validate: v => !!v },
            { key: 'departmentId', label: 'الإدارة', validate: v => !!v },
        ],
    },
    financial: {
        label: 'البيانات المالية',
        step: 3,
        fields: [
            { key: 'basicSalary', label: 'الراتب الأساسي', validate: v => v && Number(v) > 0 },
            { key: 'bankName', label: 'البنك', validate: v => !!v },
            { key: 'iban', label: 'رقم IBAN', validate: v => /^SA\d{22}$/.test(v || '') },
        ],
    },
    qualification: {
        label: 'المؤهلات',
        step: 4,
        fields: [
            { key: 'educationLevel', label: 'المستوى التعليمي', validate: v => !!v },
        ],
    },
};

// حساب نسبة تطابق التزام من بيانات النموذج
export function calculateFormCompliance(data) {
    let totalRequired = 0, totalValid = 0;
    const categories = {};
    const missingFields = [];

    for (const [catKey, category] of Object.entries(ELTIZAM_FORM_FIELDS)) {
        let catValid = 0;
        const catTotal = category.fields.length;

        for (const field of category.fields) {
            totalRequired++;
            const value = String(data[field.key] || '').trim();
            if (field.validate(value)) {
                totalValid++;
                catValid++;
            } else {
                missingFields.push({ ...field, category: category.label, step: category.step });
            }
        }

        categories[catKey] = {
            label: category.label,
            step: category.step,
            percentage: catTotal > 0 ? Math.round((catValid / catTotal) * 100) : 0,
            valid: catValid,
            total: catTotal,
        };
    }

    return {
        percentage: totalRequired > 0 ? Math.round((totalValid / totalRequired) * 100) : 0,
        categories,
        totalValid,
        totalRequired,
        missingFields,
    };
}

// الحقول الإلزامية لكل خطوة (للتحقق قبل الانتقال)
export const STEP_MANDATORY_FIELDS = {
    1: [
        { key: 'nationalId', label: 'رقم الهوية', validate: v => /^[12]\d{9}$/.test(v), message: 'يجب أن يبدأ بـ 1 أو 2 ويتكون من 10 أرقام' },
        { key: 'firstNameAr', label: 'الاسم الأول', validate: v => v && v.trim().length > 0, message: 'مطلوب' },
        { key: 'fatherNameAr', label: 'اسم الأب', validate: v => v && v.trim().length > 0, message: 'مطلوب' },
        { key: 'familyNameAr', label: 'اسم العائلة', validate: v => v && v.trim().length > 0, message: 'مطلوب' },
        { key: 'gender', label: 'الجنس', validate: v => !!v, message: 'مطلوب' },
        { key: 'mobile', label: 'الجوال', validate: v => /^05\d{8}$/.test(v || ''), message: 'يجب أن يبدأ بـ 05 ويتكون من 10 أرقام' },
    ],
    2: [
        { key: 'employeeNumber', label: 'الرقم الوظيفي', validate: v => !!v && v.trim().length > 0, message: 'مطلوب' },
        { key: 'departmentId', label: 'الإدارة', validate: v => !!v, message: 'يجب تحديد الإدارة' },
        { key: 'position', label: 'الوظيفة', validate: v => !!v, message: 'مطلوب' },
        { key: 'hireDate', label: 'تاريخ التعيين', validate: v => !!v && !isNaN(Date.parse(v)), message: 'مطلوب' },
        { key: 'contractType', label: 'نوع العقد', validate: v => !!v, message: 'مطلوب' },
    ],
    3: [
        { key: 'basicSalary', label: 'الراتب الأساسي', validate: v => v && Number(v) > 0, message: 'يجب أن يكون أكبر من صفر' },
        { key: 'bankName', label: 'البنك', validate: v => !!v, message: 'مطلوب' },
        { key: 'iban', label: 'رقم IBAN', validate: v => /^SA\d{22}$/.test(v || ''), message: 'يجب أن يبدأ بـ SA ويتكون من 24 حرف' },
    ],
    4: [
        { key: 'educationLevel', label: 'المستوى التعليمي', validate: v => !!v, message: 'مطلوب' },
    ],
};

// التحقق من خطوة محددة
export function validateStep(stepNumber, formData) {
    const fields = STEP_MANDATORY_FIELDS[stepNumber] || [];
    const errors = {};

    for (const field of fields) {
        const value = String(formData[field.key] || '').trim();
        if (!field.validate(value)) {
            errors[field.key] = field.message || `${field.label} مطلوب`;
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        errorList: Object.entries(errors).map(([key, msg]) => {
            const field = fields.find(f => f.key === key);
            return { key, label: field?.label || key, message: msg };
        }),
    };
}

// هل الخطوة مكتملة
export function isStepComplete(stepNumber, formData) {
    return validateStep(stepNumber, formData).isValid;
}

// التحقق من جميع الخطوات (للحفظ النهائي)
export function validateAllSteps(formData) {
    const results = {};
    let firstFailedStep = null;

    for (let step = 1; step <= 4; step++) {
        const result = validateStep(step, formData);
        results[step] = result;
        if (!result.isValid && firstFailedStep === null) {
            firstFailedStep = step;
        }
    }

    return {
        isValid: firstFailedStep === null,
        firstFailedStep,
        results,
    };
}

// الحد الأدنى للحفظ كمسودة
export function validateDraft(formData) {
    const errors = {};
    if (!formData.nationalId || !/^[12]\d{9}$/.test(formData.nationalId)) {
        errors.nationalId = 'رقم الهوية مطلوب للحفظ كمسودة';
    }
    if (!formData.firstNameAr || !formData.firstNameAr.trim()) {
        errors.firstNameAr = 'الاسم الأول مطلوب للحفظ كمسودة';
    }
    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}
