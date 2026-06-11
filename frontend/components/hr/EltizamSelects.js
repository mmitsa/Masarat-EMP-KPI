/**
 * ELtizam Select Components
 * مكونات الاختيار المتوافقة مع نظام التزام
 */

import React from 'react';
import { Select } from '../ui';
import {
    VACATION_CODES,
    EMPLOYEE_STATUS_CODES,
    ELEMENT_CODES,
    SALARY_SCALES,
    CADRE_CODES,
    QUALIFICATION_CODES,
    GENDER_CODES,
    NATIONALITY_CODES,
    MARITAL_STATUS_CODES,
    CONTRACT_TYPE_CODES,
    JOB_TITLE_CODES,
    MAJOR_CODES,
    UNIVERSITY_CODES,
} from '../../constants/eltizam-codes';

// ==================== تحويل الأكواد إلى خيارات ====================
const codesToOptions = (codes, includeCode = true) => {
    return Object.entries(codes).map(([key, value]) => ({
        value: value.code,
        label: includeCode ? `${value.name} (${value.code})` : value.name,
        key,
        ...value,
    }));
};

// ==================== الجنس ====================
export const genderOptions = codesToOptions(GENDER_CODES, false);

export function GenderSelect({ value, onChange, label = 'الجنس', required = false, ...props }) {
    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={genderOptions}
            placeholder="اختر الجنس"
            required={required}
            {...props}
        />
    );
}

// ==================== الجنسية ====================
export const nationalityOptions = codesToOptions(NATIONALITY_CODES);

export function NationalitySelect({ value, onChange, label = 'الجنسية', required = false, ...props }) {
    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={nationalityOptions}
            placeholder="اختر الجنسية"
            required={required}
            {...props}
        />
    );
}

// ==================== الحالة الاجتماعية ====================
export const maritalStatusOptions = codesToOptions(MARITAL_STATUS_CODES, false);

export function MaritalStatusSelect({ value, onChange, label = 'الحالة الاجتماعية', required = false, ...props }) {
    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={maritalStatusOptions}
            placeholder="اختر الحالة الاجتماعية"
            required={required}
            {...props}
        />
    );
}

// ==================== المؤهل العلمي ====================
export const qualificationOptions = codesToOptions(QUALIFICATION_CODES);

export function QualificationSelect({ value, onChange, label = 'المؤهل العلمي', required = false, ...props }) {
    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={qualificationOptions}
            placeholder="اختر المؤهل العلمي"
            required={required}
            {...props}
        />
    );
}

// ==================== نوع العقد ====================
export const contractTypeOptions = codesToOptions(CONTRACT_TYPE_CODES);

export function ContractTypeSelect({ value, onChange, label = 'نوع العقد', required = false, ...props }) {
    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={contractTypeOptions}
            placeholder="اختر نوع العقد"
            required={required}
            {...props}
        />
    );
}

// ==================== حالة الموظف ====================
export const employeeStatusOptions = codesToOptions(EMPLOYEE_STATUS_CODES);

// تصفية حسب الفئة
export const activeStatusOptions = employeeStatusOptions.filter(opt => opt.category === 'active');
export const suspendedStatusOptions = employeeStatusOptions.filter(opt => opt.category === 'suspended');
export const terminatedStatusOptions = employeeStatusOptions.filter(opt => opt.category === 'terminated');

export function EmployeeStatusSelect({ value, onChange, label = 'حالة الموظف', required = false, category = null, ...props }) {
    let options = employeeStatusOptions;
    if (category === 'active') options = activeStatusOptions;
    else if (category === 'suspended') options = suspendedStatusOptions;
    else if (category === 'terminated') options = terminatedStatusOptions;

    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={options}
            placeholder="اختر حالة الموظف"
            required={required}
            {...props}
        />
    );
}

// ==================== الكادر ====================
export const cadreOptions = codesToOptions(CADRE_CODES);

export function CadreSelect({ value, onChange, label = 'الكادر', required = false, ...props }) {
    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={cadreOptions}
            placeholder="اختر الكادر"
            required={required}
            {...props}
        />
    );
}

// ==================== نوع الإجازة ====================
export const vacationTypeOptions = codesToOptions(VACATION_CODES);

// تصنيف أنواع الإجازات
export const annualVacationOptions = vacationTypeOptions.filter(opt =>
    ['01', '02'].includes(opt.code)
);
export const sickVacationOptions = vacationTypeOptions.filter(opt =>
    ['03', '04', '05'].includes(opt.code)
);
export const maternityVacationOptions = vacationTypeOptions.filter(opt =>
    ['06', '07', '19', '20', '21'].includes(opt.code)
);
export const bereavementVacationOptions = vacationTypeOptions.filter(opt =>
    ['08', '09', '10'].includes(opt.code)
);
export const officialVacationOptions = vacationTypeOptions.filter(opt =>
    ['22', '23', '24', '25'].includes(opt.code)
);
export const otherVacationOptions = vacationTypeOptions.filter(opt =>
    ['11', '12', '13', '14', '15', '16', '17', '18', '26', '27', '28', '29', '30'].includes(opt.code)
);

export function VacationTypeSelect({ value, onChange, label = 'نوع الإجازة', required = false, grouped = false, ...props }) {
    if (grouped) {
        // Grouped options
        const groupedOptions = [
            { label: '--- الإجازات السنوية ---', value: '', disabled: true },
            ...annualVacationOptions,
            { label: '--- الإجازات المرضية ---', value: '', disabled: true },
            ...sickVacationOptions,
            { label: '--- إجازات الأمومة ---', value: '', disabled: true },
            ...maternityVacationOptions,
            { label: '--- إجازات الوفاة ---', value: '', disabled: true },
            ...bereavementVacationOptions,
            { label: '--- الإجازات الرسمية ---', value: '', disabled: true },
            ...officialVacationOptions,
            { label: '--- إجازات أخرى ---', value: '', disabled: true },
            ...otherVacationOptions,
        ];

        return (
            <Select
                label={label}
                value={value}
                onChange={onChange}
                options={groupedOptions}
                placeholder="اختر نوع الإجازة"
                required={required}
                {...props}
            />
        );
    }

    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={vacationTypeOptions}
            placeholder="اختر نوع الإجازة"
            required={required}
            {...props}
        />
    );
}

// ==================== البدلات ====================
export const allowanceOptions = Object.entries(ELEMENT_CODES.ALLOWANCES).map(([key, value]) => ({
    value: value.code,
    label: `${value.name} (${value.code})`,
    key,
    ...value,
}));

// تصنيف البدلات
export const basicAllowanceOptions = allowanceOptions.filter(opt => opt.category === 'basic');
export const natureAllowanceOptions = allowanceOptions.filter(opt => opt.category === 'nature');
export const adminAllowanceOptions = allowanceOptions.filter(opt => opt.category === 'admin');
export const specialAllowanceOptions = allowanceOptions.filter(opt => opt.category === 'special');
export const missionAllowanceOptions = allowanceOptions.filter(opt => opt.category === 'mission');
export const additionalAllowanceOptions = allowanceOptions.filter(opt => opt.category === 'additional');

export function AllowanceSelect({ value, onChange, label = 'البدل', required = false, category = null, multiple = false, ...props }) {
    let options = allowanceOptions;
    if (category === 'basic') options = basicAllowanceOptions;
    else if (category === 'nature') options = natureAllowanceOptions;
    else if (category === 'admin') options = adminAllowanceOptions;
    else if (category === 'special') options = specialAllowanceOptions;
    else if (category === 'mission') options = missionAllowanceOptions;
    else if (category === 'additional') options = additionalAllowanceOptions;

    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={options}
            placeholder="اختر البدل"
            required={required}
            multiple={multiple}
            {...props}
        />
    );
}

// ==================== الاستقطاعات ====================
export const deductionOptions = Object.entries(ELEMENT_CODES.DEDUCTIONS).map(([key, value]) => ({
    value: value.code,
    label: `${value.name} (${value.code})`,
    key,
    ...value,
}));

// تصنيف الاستقطاعات
export const mandatoryDeductionOptions = deductionOptions.filter(opt => opt.category === 'mandatory');
export const attendanceDeductionOptions = deductionOptions.filter(opt => opt.category === 'attendance');
export const loanDeductionOptions = deductionOptions.filter(opt => opt.category === 'loan');
export const insuranceDeductionOptions = deductionOptions.filter(opt => opt.category === 'insurance');

export function DeductionSelect({ value, onChange, label = 'الاستقطاع', required = false, category = null, multiple = false, ...props }) {
    let options = deductionOptions;
    if (category === 'mandatory') options = mandatoryDeductionOptions;
    else if (category === 'attendance') options = attendanceDeductionOptions;
    else if (category === 'loan') options = loanDeductionOptions;
    else if (category === 'insurance') options = insuranceDeductionOptions;

    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={options}
            placeholder="اختر الاستقطاع"
            required={required}
            multiple={multiple}
            {...props}
        />
    );
}

// ==================== سلم الرواتب ====================
export const salaryScaleOptions = Object.entries(SALARY_SCALES).map(([key, value]) => ({
    value: value.id,
    label: value.name,
    key,
    ...value,
}));

export function SalaryScaleSelect({ value, onChange, label = 'سلم الرواتب', required = false, ...props }) {
    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={salaryScaleOptions}
            placeholder="اختر سلم الرواتب"
            required={required}
            {...props}
        />
    );
}

// ==================== المرتبة ====================
export function RankSelect({ value, onChange, scaleId, label = 'المرتبة', required = false, ...props }) {
    const scale = Object.values(SALARY_SCALES).find(s => s.id === scaleId);
    const rankOptions = scale?.ranks?.map((rank, idx) => ({
        value: typeof rank.rank === 'number' ? rank.rank.toString() : rank.rank,
        label: typeof rank.rank === 'number' ? `المرتبة ${rank.rank}` : rank.rank,
    })) || [];

    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={rankOptions}
            placeholder="اختر المرتبة"
            required={required}
            disabled={!scaleId}
            {...props}
        />
    );
}

// ==================== الدرجة ====================
export function StepSelect({ value, onChange, scaleId, rank, label = 'الدرجة', required = false, ...props }) {
    const scale = Object.values(SALARY_SCALES).find(s => s.id === scaleId);
    const rankData = scale?.ranks?.find(r =>
        (typeof r.rank === 'number' ? r.rank.toString() : r.rank) === rank
    );
    const stepOptions = rankData?.steps?.map((step, idx) => ({
        value: (idx + 1).toString(),
        label: `الدرجة ${idx + 1} - ${step.toLocaleString('ar-SA')} ر.س`,
    })) || [];

    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={stepOptions}
            placeholder="اختر الدرجة"
            required={required}
            disabled={!rank}
            {...props}
        />
    );
}

// ==================== الديانة ====================
export const religionOptions = [
    { value: '1', label: 'مسلم' },
    { value: '2', label: 'مسيحي' },
    { value: '3', label: 'يهودي' },
    { value: '4', label: 'هندوسي' },
    { value: '5', label: 'بوذي' },
    { value: '9', label: 'أخرى' },
];

export function ReligionSelect({ value, onChange, label = 'الديانة', required = false, ...props }) {
    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={religionOptions}
            placeholder="اختر الديانة"
            required={required}
            {...props}
        />
    );
}

// ==================== فصيلة الدم ====================
export const bloodTypeOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
];

export function BloodTypeSelect({ value, onChange, label = 'فصيلة الدم', required = false, ...props }) {
    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={bloodTypeOptions}
            placeholder="اختر فصيلة الدم"
            required={required}
            {...props}
        />
    );
}

// ==================== البنوك السعودية ====================
export const bankOptions = [
    { value: '10', label: 'البنك الأهلي السعودي (SNB)' },
    { value: '20', label: 'بنك الرياض (Riyad Bank)' },
    { value: '40', label: 'البنك السعودي الفرنسي (BSF)' },
    { value: '45', label: 'البنك السعودي البريطاني (SABB)' },
    { value: '55', label: 'البنك العربي الوطني (ANB)' },
    { value: '60', label: 'بنك الجزيرة (Bank AlJazira)' },
    { value: '65', label: 'بنك البلاد (Bank Albilad)' },
    { value: '80', label: 'مصرف الراجحي (Al Rajhi Bank)' },
    { value: '90', label: 'بنك الإنماء (Bank Alinma)' },
    { value: '95', label: 'بنك الخليج الدولي (GIB)' },
    { value: '05', label: 'مصرف الراجحي الاستثماري' },
];

export function BankSelect({ value, onChange, label = 'البنك', required = false, ...props }) {
    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={bankOptions}
            placeholder="اختر البنك"
            required={required}
            {...props}
        />
    );
}

// ==================== المنطقة الإدارية ====================
export const regionOptions = [
    { value: '01', label: 'منطقة الرياض' },
    { value: '02', label: 'منطقة مكة المكرمة' },
    { value: '03', label: 'المنطقة الشرقية' },
    { value: '04', label: 'منطقة المدينة المنورة' },
    { value: '05', label: 'منطقة القصيم' },
    { value: '06', label: 'منطقة عسير' },
    { value: '07', label: 'منطقة تبوك' },
    { value: '08', label: 'منطقة حائل' },
    { value: '09', label: 'منطقة الحدود الشمالية' },
    { value: '10', label: 'منطقة جازان' },
    { value: '11', label: 'منطقة نجران' },
    { value: '12', label: 'منطقة الباحة' },
    { value: '13', label: 'منطقة الجوف' },
];

export function RegionSelect({ value, onChange, label = 'المنطقة', required = false, ...props }) {
    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={regionOptions}
            placeholder="اختر المنطقة"
            required={required}
            {...props}
        />
    );
}

// ==================== جدول العمل ====================
export const workScheduleOptions = [
    { value: '01', label: 'دوام كامل - صباحي' },
    { value: '02', label: 'دوام كامل - مسائي' },
    { value: '03', label: 'دوام جزئي - صباحي' },
    { value: '04', label: 'دوام جزئي - مسائي' },
    { value: '05', label: 'مناوبات' },
    { value: '06', label: 'عمل عن بعد' },
    { value: '07', label: 'مرن' },
];

export function WorkScheduleSelect({ value, onChange, label = 'جدول العمل', required = false, ...props }) {
    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={workScheduleOptions}
            placeholder="اختر جدول العمل"
            required={required}
            {...props}
        />
    );
}

// ==================== المسمى الوظيفي ====================
export const jobTitleOptions = Object.entries(JOB_TITLE_CODES).map(([key, value]) => ({
    value: value.code,
    label: `${value.name} (${value.code})`,
    key,
    ...value,
}));

// تصنيف المسميات حسب الفئة
export const executiveJobOptions = jobTitleOptions.filter(opt => opt.category === 'executive');
export const managementJobOptions = jobTitleOptions.filter(opt => opt.category === 'management');
export const hrJobOptions = jobTitleOptions.filter(opt => opt.category === 'hr');
export const financeJobOptions = jobTitleOptions.filter(opt => opt.category === 'finance');
export const itJobOptions = jobTitleOptions.filter(opt => opt.category === 'it');
export const engineeringJobOptions = jobTitleOptions.filter(opt => opt.category === 'engineering');
export const healthJobOptions = jobTitleOptions.filter(opt => opt.category === 'health');
export const educationJobOptions = jobTitleOptions.filter(opt => opt.category === 'education');
export const adminJobOptions = jobTitleOptions.filter(opt => opt.category === 'admin');

export function JobTitleSelect({ value, onChange, label = 'المسمى الوظيفي', required = false, category = null, grouped = false, ...props }) {
    let options = jobTitleOptions;
    if (category) {
        options = jobTitleOptions.filter(opt => opt.category === category);
    }

    if (grouped) {
        const groupedOptions = [
            { label: '--- الإدارة العليا ---', value: '', disabled: true },
            ...executiveJobOptions,
            { label: '--- المدراء ---', value: '', disabled: true },
            ...managementJobOptions,
            { label: '--- الموارد البشرية ---', value: '', disabled: true },
            ...hrJobOptions,
            { label: '--- المالية ---', value: '', disabled: true },
            ...financeJobOptions,
            { label: '--- تقنية المعلومات ---', value: '', disabled: true },
            ...itJobOptions,
            { label: '--- الهندسة ---', value: '', disabled: true },
            ...engineeringJobOptions,
            { label: '--- الصحة ---', value: '', disabled: true },
            ...healthJobOptions,
            { label: '--- التعليم ---', value: '', disabled: true },
            ...educationJobOptions,
            { label: '--- الإدارية ---', value: '', disabled: true },
            ...adminJobOptions,
        ];

        return (
            <Select
                label={label}
                value={value}
                onChange={onChange}
                options={groupedOptions}
                placeholder="اختر المسمى الوظيفي"
                required={required}
                {...props}
            />
        );
    }

    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={options}
            placeholder="اختر المسمى الوظيفي"
            required={required}
            {...props}
        />
    );
}

// ==================== التخصص ====================
export const majorOptions = Object.entries(MAJOR_CODES).map(([key, value]) => ({
    value: value.code,
    label: `${value.name} (${value.code})`,
    key,
    ...value,
}));

// تصنيف التخصصات حسب الفئة
export const itMajorOptions = majorOptions.filter(opt => opt.category === 'it');
export const engineeringMajorOptions = majorOptions.filter(opt => opt.category === 'engineering');
export const businessMajorOptions = majorOptions.filter(opt => opt.category === 'business');
export const healthMajorOptions = majorOptions.filter(opt => opt.category === 'health');
export const lawMajorOptions = majorOptions.filter(opt => opt.category === 'law');
export const educationMajorOptions = majorOptions.filter(opt => opt.category === 'education');
export const artsMajorOptions = majorOptions.filter(opt => opt.category === 'arts');
export const socialMajorOptions = majorOptions.filter(opt => opt.category === 'social');
export const islamicMajorOptions = majorOptions.filter(opt => opt.category === 'islamic');

export function MajorSelect({ value, onChange, label = 'التخصص', required = false, category = null, grouped = false, ...props }) {
    let options = majorOptions;
    if (category) {
        options = majorOptions.filter(opt => opt.category === category);
    }

    if (grouped) {
        const groupedOptions = [
            { label: '--- الحاسب وتقنية المعلومات ---', value: '', disabled: true },
            ...itMajorOptions,
            { label: '--- الهندسة ---', value: '', disabled: true },
            ...engineeringMajorOptions,
            { label: '--- إدارة الأعمال ---', value: '', disabled: true },
            ...businessMajorOptions,
            { label: '--- الطب والصحة ---', value: '', disabled: true },
            ...healthMajorOptions,
            { label: '--- القانون ---', value: '', disabled: true },
            ...lawMajorOptions,
            { label: '--- التربية والتعليم ---', value: '', disabled: true },
            ...educationMajorOptions,
            { label: '--- الفنون والإعلام ---', value: '', disabled: true },
            ...artsMajorOptions,
            { label: '--- العلوم الاجتماعية ---', value: '', disabled: true },
            ...socialMajorOptions,
            { label: '--- العلوم الإسلامية ---', value: '', disabled: true },
            ...islamicMajorOptions,
        ];

        return (
            <Select
                label={label}
                value={value}
                onChange={onChange}
                options={groupedOptions}
                placeholder="اختر التخصص"
                required={required}
                {...props}
            />
        );
    }

    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={options}
            placeholder="اختر التخصص"
            required={required}
            {...props}
        />
    );
}

// ==================== الجامعة ====================
export const universityOptions = Object.entries(UNIVERSITY_CODES).map(([key, value]) => ({
    value: value.code,
    label: value.country === 'SA' ? value.name : `${value.name} (${value.country})`,
    key,
    ...value,
}));

// تصفية حسب البلد
export const saudiUniversityOptions = universityOptions.filter(opt => opt.country === 'SA');
export const gulfUniversityOptions = universityOptions.filter(opt => ['AE', 'KW', 'QA', 'BH', 'OM'].includes(opt.country));
export const arabUniversityOptions = universityOptions.filter(opt => ['EG', 'JO', 'SY', 'LB'].includes(opt.country));
export const internationalUniversityOptions = universityOptions.filter(opt => ['US', 'UK'].includes(opt.country));

export function UniversitySelect({ value, onChange, label = 'الجامعة', required = false, country = null, grouped = false, ...props }) {
    let options = universityOptions;
    if (country === 'SA') options = saudiUniversityOptions;
    else if (country === 'GULF') options = gulfUniversityOptions;
    else if (country === 'ARAB') options = arabUniversityOptions;
    else if (country === 'INT') options = internationalUniversityOptions;

    if (grouped) {
        const groupedOptions = [
            { label: '--- الجامعات السعودية ---', value: '', disabled: true },
            ...saudiUniversityOptions,
            { label: '--- الجامعات الخليجية ---', value: '', disabled: true },
            ...gulfUniversityOptions,
            { label: '--- الجامعات العربية ---', value: '', disabled: true },
            ...arabUniversityOptions,
            { label: '--- الجامعات الدولية ---', value: '', disabled: true },
            ...internationalUniversityOptions,
        ];

        return (
            <Select
                label={label}
                value={value}
                onChange={onChange}
                options={groupedOptions}
                placeholder="اختر الجامعة"
                required={required}
                {...props}
            />
        );
    }

    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={options}
            placeholder="اختر الجامعة"
            required={required}
            {...props}
        />
    );
}

// ==================== Helper للحصول على اسم من الكود ====================
export const getNameByCode = (options, code) => {
    if (code === null || code === undefined || code === '') return '-';
    // بحث مباشر بالقيمة
    const option = options.find(opt => opt.value === code || opt.value === String(code));
    if (option?.label) return option.label;
    // إرجاع القيمة الأصلية فقط إذا كانت نصية (ليست رقماً)
    if (typeof code === 'string' && isNaN(code)) return code;
    return '-';
};

// تعيين الجنس يدعم أكواد قاعدة البيانات (1=ذكر، 2=أنثى) وأكواد التزام (M/F)
export const getGenderName = (code) => {
    if (code === 1 || code === '1') return 'ذكر';
    if (code === 2 || code === '2') return 'أنثى';
    return getNameByCode(genderOptions, code);
};

// تعيين الجنسية يدعم الأكواد الرقمية (113=سعودي) والنصية (SAU)
const nationalityCodeMap = {
    '113': 'سعودي', '100': 'مصري', '101': 'أردني', '102': 'إماراتي',
    '103': 'بحريني', '104': 'تونسي', '105': 'جزائري', '106': 'جيبوتي',
    '107': 'سوداني', '108': 'سوري', '109': 'صومالي', '110': 'عراقي',
    '111': 'عماني', '112': 'فلسطيني', '114': 'قطري', '115': 'كويتي',
    '116': 'لبناني', '117': 'ليبي', '118': 'مغربي', '119': 'موريتاني',
    '120': 'يمني', '121': 'هندي', '122': 'باكستاني', '123': 'بنغلاديشي',
    '124': 'فلبيني', '125': 'إندونيسي', '126': 'سريلانكي', '127': 'نيبالي',
    '128': 'أثيوبي', '129': 'إريتري', '130': 'تركي', '131': 'إيراني',
};
export const getNationalityName = (code) => {
    if (!code && code !== 0) return '-';
    const mapped = nationalityCodeMap[String(code)];
    if (mapped) return mapped;
    return getNameByCode(nationalityOptions, code);
};

// تعيين الحالة الاجتماعية يدعم الأكواد الرقمية (1=أعزب، 2=متزوج، 3=مطلق، 4=أرمل)
export const getMaritalStatusName = (code) => {
    const intMap = { 1: 'أعزب', 2: 'متزوج', 3: 'مطلق', 4: 'أرمل' };
    if (code in intMap) return intMap[code];
    if (String(code) in intMap) return intMap[String(code)];
    return getNameByCode(maritalStatusOptions, code);
};
export const getQualificationName = (code) => getNameByCode(qualificationOptions, code);
export const getContractTypeName = (code) => getNameByCode(contractTypeOptions, code);
export const getEmployeeStatusName = (code) => getNameByCode(employeeStatusOptions, code);
export const getCadreName = (code) => getNameByCode(cadreOptions, code);
export const getVacationTypeName = (code) => getNameByCode(vacationTypeOptions, code);
export const getAllowanceName = (code) => getNameByCode(allowanceOptions, code);
export const getDeductionName = (code) => getNameByCode(deductionOptions, code);
export const getBankName = (code) => getNameByCode(bankOptions, code);
export const getRegionName = (code) => getNameByCode(regionOptions, code);
export const getJobTitleName = (code) => getNameByCode(jobTitleOptions, code);
export const getMajorName = (code) => getNameByCode(majorOptions, code);
export const getUniversityName = (code) => getNameByCode(universityOptions, code);

// Export default with all components
export default {
    // Select Components
    GenderSelect,
    NationalitySelect,
    MaritalStatusSelect,
    QualificationSelect,
    ContractTypeSelect,
    EmployeeStatusSelect,
    CadreSelect,
    VacationTypeSelect,
    AllowanceSelect,
    DeductionSelect,
    SalaryScaleSelect,
    RankSelect,
    StepSelect,
    ReligionSelect,
    BloodTypeSelect,
    BankSelect,
    RegionSelect,
    WorkScheduleSelect,
    JobTitleSelect,
    MajorSelect,
    UniversitySelect,
    // Options
    genderOptions,
    nationalityOptions,
    maritalStatusOptions,
    qualificationOptions,
    contractTypeOptions,
    employeeStatusOptions,
    cadreOptions,
    vacationTypeOptions,
    allowanceOptions,
    deductionOptions,
    salaryScaleOptions,
    religionOptions,
    bloodTypeOptions,
    bankOptions,
    regionOptions,
    workScheduleOptions,
    jobTitleOptions,
    majorOptions,
    universityOptions,
    // Helpers
    getNameByCode,
    getGenderName,
    getNationalityName,
    getMaritalStatusName,
    getQualificationName,
    getContractTypeName,
    getEmployeeStatusName,
    getCadreName,
    getVacationTypeName,
    getAllowanceName,
    getDeductionName,
    getBankName,
    getRegionName,
    getJobTitleName,
    getMajorName,
    getUniversityName,
};
