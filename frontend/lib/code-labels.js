/**
 * تحويل الأكواد إلى نصوص عربية
 * يُستخدم في جميع صفحات عرض بيانات الموظفين
 *
 * القيم في قاعدة البيانات (Masarat_HR):
 * - الجنس: 1=ذكر، 2=أنثى
 * - الحالة الاجتماعية: 1=أعزب، 2=متزوج، 3=مطلق، 4=أرمل
 * - الجنسية: مخزنة كنص عربي (مثلاً "سعودي")
 */

// الجنس (1=ذكر، 2=أنثى)
const genderLabels = {
    1: 'ذكر', 2: 'أنثى',
    '1': 'ذكر', '2': 'أنثى',
    'M': 'ذكر', 'F': 'أنثى',
    'male': 'ذكر', 'female': 'أنثى',
    'ذكر': 'ذكر', 'أنثى': 'أنثى',
};

export function getGenderLabel(code) {
    if (code === null || code === undefined || code === '') return '-';
    return genderLabels[code] || genderLabels[String(code)] || '-';
}

// الحالة الاجتماعية (1=أعزب، 2=متزوج، 3=مطلق، 4=أرمل)
const maritalLabels = {
    1: 'أعزب', 2: 'متزوج', 3: 'مطلق', 4: 'أرمل',
    '1': 'أعزب', '2': 'متزوج', '3': 'مطلق', '4': 'أرمل',
    'single': 'أعزب', 'married': 'متزوج', 'divorced': 'مطلق', 'widowed': 'أرمل',
    'أعزب': 'أعزب', 'متزوج': 'متزوج', 'مطلق': 'مطلق', 'أرمل': 'أرمل',
};

export function getMaritalLabel(code) {
    if (code === null || code === undefined || code === '') return '-';
    return maritalLabels[code] || maritalLabels[String(code)] || '-';
}

// الجنسية (مخزنة كنص عربي في DB، لكن ندعم الأكواد الرقمية أيضاً كاحتياط)
const nationalityLabels = {
    '113': 'سعودي', '100': 'مصري', '101': 'أردني', '102': 'إماراتي',
    '103': 'بحريني', '104': 'تونسي', '105': 'جزائري', '106': 'جيبوتي',
    '107': 'سوداني', '108': 'سوري', '109': 'صومالي', '110': 'عراقي',
    '111': 'عماني', '112': 'فلسطيني', '114': 'قطري', '115': 'كويتي',
    '116': 'لبناني', '117': 'ليبي', '118': 'مغربي', '119': 'موريتاني',
    '120': 'يمني', '121': 'هندي', '122': 'باكستاني', '123': 'بنغلاديشي',
    '124': 'فلبيني', '125': 'إندونيسي', '126': 'سريلانكي', '127': 'نيبالي',
    '128': 'أثيوبي', '129': 'إريتري', '130': 'تركي', '131': 'إيراني',
    'SAU': 'سعودي', 'EGY': 'مصري', 'JOR': 'أردني', 'IND': 'هندي',
    'PAK': 'باكستاني', 'BGD': 'بنغلاديشي', 'PHL': 'فلبيني',
    'سعودي': 'سعودي', 'Saudi': 'سعودي',
};

export function getNationalityLabel(code) {
    if (code === null || code === undefined || code === '') return '-';
    return nationalityLabels[code] || nationalityLabels[String(code)] || String(code);
}

// حالة الموظف
const statusLabels = {
    'Active': 'نشط', 'Suspended': 'موقوف', 'Draft': 'مسودة',
    'Terminated': 'منتهي', 'OnLeave': 'في إجازة',
    '01': 'على رأس العمل', '02': 'في إجازة', '03': 'معار',
    '04': 'منتدب', '05': 'مكلف', '06': 'موقوف عن العمل',
    '07': 'منتهية خدماته', '08': 'متقاعد', '09': 'متوفى',
};

export function getStatusLabel(code) {
    if (code === null || code === undefined || code === '') return '-';
    return statusLabels[code] || statusLabels[String(code)] || String(code);
}

// نوع العقد
const contractLabels = {
    1: 'دائم', 2: 'عقد', 3: 'مؤقت', 4: 'تجريبي', 5: 'تدريب',
    'permanent': 'دائم', 'contract': 'عقد', 'temporary': 'مؤقت',
};

export function getContractLabel(code) {
    if (code === null || code === undefined || code === '') return '-';
    return contractLabels[code] || contractLabels[String(code)] || String(code);
}

// المؤهل العلمي
const educationLabels = {
    1: 'ابتدائي', 2: 'متوسط', 3: 'ثانوي', 4: 'دبلوم', 5: 'بكالوريوس', 6: 'ماجستير', 7: 'دكتوراه',
};

export function getEducationLabel(code) {
    if (code === null || code === undefined || code === '') return '-';
    return educationLabels[code] || educationLabels[String(code)] || String(code);
}

/**
 * تحويل جميع الأكواد في كائن الموظف إلى نصوص عربية
 */
export function enrichEmployeeLabels(emp) {
    if (!emp) return emp;
    return {
        ...emp,
        genderName: emp.genderName || getGenderLabel(emp.gender),
        maritalStatusName: emp.maritalStatusName || getMaritalLabel(emp.maritalStatus || emp.marital_status),
        nationalityName: emp.nationalityName || getNationalityLabel(emp.nationality),
        jobTitle: emp.jobTitle || emp.position || emp.rank || emp.job_title || '-',
    };
}
