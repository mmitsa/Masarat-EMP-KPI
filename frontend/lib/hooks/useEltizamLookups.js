/**
 * Hook لجلب أكواد وتصنيفات التزام
 * يستخدم في نماذج الموظفين لملء القوائم المنسدلة
 * يدعم fallback من البيانات الثابتة عند عدم توفر قاعدة البيانات
 */

import { useState, useEffect, useCallback } from 'react';
import {
    GENDER_CODES,
    NATIONALITY_CODES,
    MARITAL_STATUS_CODES,
    EMPLOYEE_STATUS_CODES,
    CONTRACT_TYPE_CODES,
    QUALIFICATION_CODES,
    CADRE_CODES,
    VACATION_CODES,
    ELEMENT_CODES,
    SALARY_SCALES,
    JOB_TITLE_CODES,
    MAJOR_CODES,
} from '../../constants/eltizam-codes';

// تحويل أكواد eltizam-codes.js إلى شكل { code, descAr, descEn }
function codesToLookupFormat(codes) {
    return Object.values(codes).map(v => ({
        code: v.code,
        descAr: v.name,
        descEn: v.nameEn || v.name,
    }));
}

// البيانات الثابتة كـ fallback عند فشل الاتصال بالـ API
const STATIC_FALLBACKS = {
    genders: codesToLookupFormat(GENDER_CODES),
    nationalities: codesToLookupFormat(NATIONALITY_CODES),
    maritalStatus: codesToLookupFormat(MARITAL_STATUS_CODES),
    employeeStatuses: codesToLookupFormat(EMPLOYEE_STATUS_CODES),
    contractTypes: codesToLookupFormat(CONTRACT_TYPE_CODES),
    qualifications: codesToLookupFormat(QUALIFICATION_CODES),
    jobs: codesToLookupFormat(JOB_TITLE_CODES),
    leaveTypes: codesToLookupFormat(VACATION_CODES),
    religions: [
        { code: '01', descAr: 'مسلم', descEn: 'Muslim' },
        { code: '02', descAr: 'مسيحي', descEn: 'Christian' },
        { code: '03', descAr: 'يهودي', descEn: 'Jewish' },
        { code: '99', descAr: 'أخرى', descEn: 'Other' },
    ],
    bloodTypes: [
        { code: 'A+', descAr: 'A+', descEn: 'A+' },
        { code: 'A-', descAr: 'A-', descEn: 'A-' },
        { code: 'B+', descAr: 'B+', descEn: 'B+' },
        { code: 'B-', descAr: 'B-', descEn: 'B-' },
        { code: 'AB+', descAr: 'AB+', descEn: 'AB+' },
        { code: 'AB-', descAr: 'AB-', descEn: 'AB-' },
        { code: 'O+', descAr: 'O+', descEn: 'O+' },
        { code: 'O-', descAr: 'O-', descEn: 'O-' },
    ],
    idTypes: [
        { code: '01', descAr: 'هوية وطنية', descEn: 'National ID' },
        { code: '02', descAr: 'إقامة', descEn: 'Iqama' },
        { code: '03', descAr: 'جواز سفر', descEn: 'Passport' },
        { code: '04', descAr: 'تأشيرة زيارة', descEn: 'Visit Visa' },
    ],
    healthStatuses: [
        { code: '01', descAr: 'سليم', descEn: 'Healthy' },
        { code: '02', descAr: 'مريض مزمن', descEn: 'Chronic Illness' },
        { code: '03', descAr: 'إعاقة جزئية', descEn: 'Partial Disability' },
        { code: '04', descAr: 'إعاقة كلية', descEn: 'Full Disability' },
    ],
    educationLevels: [
        { code: '01', descAr: 'ابتدائي', descEn: 'Primary' },
        { code: '02', descAr: 'متوسط', descEn: 'Intermediate' },
        { code: '03', descAr: 'ثانوي', descEn: 'Secondary' },
        { code: '04', descAr: 'دبلوم', descEn: 'Diploma' },
        { code: '05', descAr: 'بكالوريوس', descEn: 'Bachelor' },
        { code: '06', descAr: 'ماجستير', descEn: 'Master' },
        { code: '07', descAr: 'دكتوراه', descEn: 'PhD' },
    ],
    banks: [
        { code: '10', descAr: 'البنك الأهلي السعودي', descEn: 'SNB' },
        { code: '20', descAr: 'بنك الراجحي', descEn: 'Al Rajhi Bank' },
        { code: '30', descAr: 'بنك الرياض', descEn: 'Riyad Bank' },
        { code: '40', descAr: 'البنك السعودي البريطاني', descEn: 'SABB' },
        { code: '45', descAr: 'بنك البلاد', descEn: 'Bank AlBilad' },
        { code: '50', descAr: 'البنك السعودي الفرنسي', descEn: 'BSF' },
        { code: '55', descAr: 'بنك الجزيرة', descEn: 'Bank AlJazira' },
        { code: '60', descAr: 'البنك العربي الوطني', descEn: 'ANB' },
        { code: '65', descAr: 'بنك الإنماء', descEn: 'Alinma Bank' },
        { code: '80', descAr: 'بنك الخليج الدولي', descEn: 'GIB' },
    ],
    regions: [
        { code: '01', descAr: 'الرياض', descEn: 'Riyadh' },
        { code: '02', descAr: 'مكة المكرمة', descEn: 'Makkah' },
        { code: '03', descAr: 'المدينة المنورة', descEn: 'Madinah' },
        { code: '04', descAr: 'القصيم', descEn: 'Qassim' },
        { code: '05', descAr: 'المنطقة الشرقية', descEn: 'Eastern Province' },
        { code: '06', descAr: 'عسير', descEn: 'Asir' },
        { code: '07', descAr: 'تبوك', descEn: 'Tabuk' },
        { code: '08', descAr: 'حائل', descEn: 'Hail' },
        { code: '09', descAr: 'الحدود الشمالية', descEn: 'Northern Borders' },
        { code: '10', descAr: 'جازان', descEn: 'Jazan' },
        { code: '11', descAr: 'نجران', descEn: 'Najran' },
        { code: '12', descAr: 'الباحة', descEn: 'Bahah' },
        { code: '13', descAr: 'الجوف', descEn: 'Jouf' },
    ],
    cities: [
        { code: '01', descAr: 'الرياض', descEn: 'Riyadh' },
        { code: '02', descAr: 'جدة', descEn: 'Jeddah' },
        { code: '03', descAr: 'مكة المكرمة', descEn: 'Makkah' },
        { code: '04', descAr: 'المدينة المنورة', descEn: 'Madinah' },
        { code: '05', descAr: 'الدمام', descEn: 'Dammam' },
        { code: '06', descAr: 'الخبر', descEn: 'Khobar' },
        { code: '07', descAr: 'الظهران', descEn: 'Dhahran' },
        { code: '08', descAr: 'الجبيل', descEn: 'Jubail' },
        { code: '09', descAr: 'ينبع', descEn: 'Yanbu' },
        { code: '10', descAr: 'الطائف', descEn: 'Taif' },
        { code: '11', descAr: 'بريدة', descEn: 'Buraidah' },
        { code: '12', descAr: 'عنيزة', descEn: 'Unaizah' },
        { code: '13', descAr: 'حائل', descEn: 'Hail' },
        { code: '14', descAr: 'تبوك', descEn: 'Tabuk' },
        { code: '15', descAr: 'أبها', descEn: 'Abha' },
        { code: '16', descAr: 'خميس مشيط', descEn: 'Khamis Mushait' },
        { code: '17', descAr: 'نجران', descEn: 'Najran' },
        { code: '18', descAr: 'جازان', descEn: 'Jazan' },
        { code: '19', descAr: 'الباحة', descEn: 'Bahah' },
        { code: '20', descAr: 'سكاكا', descEn: 'Sakaka' },
        { code: '21', descAr: 'عرعر', descEn: 'Arar' },
        { code: '22', descAr: 'القطيف', descEn: 'Qatif' },
        { code: '23', descAr: 'الأحساء', descEn: 'Ahsa' },
        { code: '24', descAr: 'حفر الباطن', descEn: 'Hafr Al-Batin' },
    ],
    appointmentTypes: [
        { code: '01', descAr: 'تعيين جديد', descEn: 'New Hire' },
        { code: '02', descAr: 'نقل', descEn: 'Transfer' },
        { code: '03', descAr: 'إعارة', descEn: 'Secondment' },
        { code: '04', descAr: 'ترقية', descEn: 'Promotion' },
        { code: '05', descAr: 'تكليف', descEn: 'Assignment' },
    ],
    salaryScales: [
        { code: '01', descAr: 'السلم العام', descEn: 'General Scale' },
        { code: '02', descAr: 'سلم الفنيين', descEn: 'Technical Scale' },
        { code: '03', descAr: 'سلم المعلمين', descEn: 'Teachers Scale' },
        { code: '04', descAr: 'سلم الصحيين', descEn: 'Health Scale' },
    ],
    placeIssuance: [
        { code: '01', descAr: 'الرياض', descEn: 'Riyadh' },
        { code: '02', descAr: 'جدة', descEn: 'Jeddah' },
        { code: '03', descAr: 'مكة المكرمة', descEn: 'Makkah' },
        { code: '04', descAr: 'المدينة المنورة', descEn: 'Madinah' },
        { code: '05', descAr: 'الدمام', descEn: 'Dammam' },
    ],
    specializations: codesToLookupFormat(MAJOR_CODES),
};

// أنواع القوائم المتاحة
export const LOOKUP_TYPES = {
    JOBS: 'jobs',
    BANKS: 'banks',
    BRANCHES: 'branches',
    DEPARTMENTS: 'departments',
    NATIONALITIES: 'nationalities',
    RELIGIONS: 'religions',
    MARITAL_STATUS: 'maritalStatus',
    GENDERS: 'genders',
    BLOOD_TYPES: 'bloodTypes',
    ID_TYPES: 'idTypes',
    EMPLOYEE_STATUSES: 'employeeStatuses',
    HEALTH_STATUSES: 'healthStatuses',
    EDUCATION_LEVELS: 'educationLevels',
    CONTRACT_TYPES: 'contractTypes',
    REGIONS: 'regions',
    CITIES: 'cities',
    LEAVE_TYPES: 'leaveTypes',
    APPOINTMENT_TYPES: 'appointmentTypes',
    END_SERVICE_REASONS: 'endServiceReasons',
    ALLOWANCE_TYPES: 'allowanceTypes',
    DEDUCTION_TYPES: 'deductionTypes',
    SALARY_SCALES: 'salaryScales',
    PLACE_ISSUANCE: 'placeIssuance',
    QUALIFICATIONS: 'qualifications',
    SPECIALIZATIONS: 'specializations',
};

// Cache للبيانات لتجنب الطلبات المتكررة
const lookupsCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

/**
 * جلب نوع محدد من الأكواد - مع fallback للبيانات الثابتة
 */
async function fetchLookupType(type) {
    const cacheKey = type;
    const cached = lookupsCache[cacheKey];

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }

    try {
        const response = await fetch(`/api/lookups/eltizam?type=${type}`);
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            lookupsCache[cacheKey] = {
                data: result.data,
                timestamp: Date.now(),
            };
            return result.data;
        }
    } catch (error) {
        console.warn(`تعذر جلب ${type} من API، استخدام البيانات الثابتة`);
    }

    // استخدام البيانات الثابتة كـ fallback
    const fallback = STATIC_FALLBACKS[type] || [];
    if (fallback.length > 0) {
        lookupsCache[cacheKey] = {
            data: fallback,
            timestamp: Date.now(),
        };
    }
    return fallback;
}

/**
 * جلب جميع الأكواد المطلوبة
 */
async function fetchAllLookups(types) {
    const results = {};
    const fetchPromises = types.map(async (type) => {
        results[type] = await fetchLookupType(type);
    });
    await Promise.all(fetchPromises);
    return results;
}

/**
 * Hook لجلب نوع واحد من الأكواد
 */
export function useLookup(type) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!type) return;

        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await fetchLookupType(type);
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [type]);

    const refresh = useCallback(async () => {
        delete lookupsCache[type];
        const result = await fetchLookupType(type);
        setData(result);
    }, [type]);

    return { data, loading, error, refresh };
}

/**
 * Hook لجلب أكواد متعددة في وقت واحد
 */
export function useLookups(types = []) {
    const [lookups, setLookups] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!types.length) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const results = await fetchAllLookups(types);
                setLookups(results);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [types.join(',')]);

    const refresh = useCallback(async () => {
        types.forEach(type => delete lookupsCache[type]);
        const results = await fetchAllLookups(types);
        setLookups(results);
    }, [types]);

    return { lookups, loading, error, refresh };
}

/**
 * Hook لجلب جميع الأكواد المطلوبة لنموذج الموظف
 */
export function useEmployeeLookups() {
    const types = [
        LOOKUP_TYPES.JOBS,
        LOOKUP_TYPES.DEPARTMENTS,
        LOOKUP_TYPES.NATIONALITIES,
        LOOKUP_TYPES.RELIGIONS,
        LOOKUP_TYPES.MARITAL_STATUS,
        LOOKUP_TYPES.GENDERS,
        LOOKUP_TYPES.BLOOD_TYPES,
        LOOKUP_TYPES.ID_TYPES,
        LOOKUP_TYPES.EMPLOYEE_STATUSES,
        LOOKUP_TYPES.HEALTH_STATUSES,
        LOOKUP_TYPES.EDUCATION_LEVELS,
        LOOKUP_TYPES.CONTRACT_TYPES,
        LOOKUP_TYPES.BANKS,
        LOOKUP_TYPES.BRANCHES,
        LOOKUP_TYPES.REGIONS,
        LOOKUP_TYPES.CITIES,
        LOOKUP_TYPES.APPOINTMENT_TYPES,
        LOOKUP_TYPES.SALARY_SCALES,
        LOOKUP_TYPES.PLACE_ISSUANCE,
        LOOKUP_TYPES.QUALIFICATIONS,
        LOOKUP_TYPES.SPECIALIZATIONS,
    ];

    return useLookups(types);
}

/**
 * تحويل البيانات لشكل يناسب القائمة المنسدلة
 */
export function formatForSelect(items, valueField = 'code', labelField = 'descAr') {
    if (!items || !Array.isArray(items)) return [];

    return items.map(item => ({
        value: item[valueField] || item.id || item.code,
        label: item[labelField] || item.descAr || item.name || item.label,
        ...item
    }));
}

/**
 * البحث في القائمة بالكود
 */
export function findByCode(items, code) {
    if (!items || !code) return null;
    return items.find(item =>
        item.code === code ||
        item.id === code ||
        item.value === code
    );
}

/**
 * الحصول على الوصف العربي بالكود
 */
export function getDescriptionByCode(items, code) {
    const item = findByCode(items, code);
    return item?.descAr || item?.label || item?.name || code;
}

export default useEmployeeLookups;
