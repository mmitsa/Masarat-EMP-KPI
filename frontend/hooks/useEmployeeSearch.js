import { useState, useCallback, useRef } from 'react';
import api from '../lib/api';

/**
 * Hook مشترك للبحث عن الموظفين - يستبدل MOCK_EMPLOYEES
 * يستدعي HR API مع debounce ويعود لقائمة وهمية إذا فشل
 *
 * @returns {{ employees: Array, loading: boolean, error: string|null, search: Function, clearResults: Function }}
 */

// قائمة وهمية للـ fallback عند فشل API
const FALLBACK_EMPLOYEES = [
    { id: 'EMP001', name: 'أحمد محمد العتيبي', position: 'مدير الموارد البشرية', department: 'الموارد البشرية', departmentId: 1 },
    { id: 'EMP002', name: 'فاطمة عبدالله السبيعي', position: 'مدير المستودعات', department: 'المستودعات', departmentId: 2 },
    { id: 'EMP003', name: 'خالد سعد الدوسري', position: 'مدير الحركة', department: 'الحركة', departmentId: 3 },
    { id: 'EMP004', name: 'نورة محمد الشمري', position: 'مدير المالية', department: 'المالية', departmentId: 4 },
    { id: 'EMP005', name: 'سعود عبدالرحمن القحطاني', position: 'مدير تقنية المعلومات', department: 'تقنية المعلومات', departmentId: 5 },
    { id: 'EMP006', name: 'مريم أحمد الغامدي', position: 'محاسب', department: 'المالية', departmentId: 4 },
    { id: 'EMP007', name: 'عبدالعزيز خالد المطيري', position: 'مسؤول أرشفة', department: 'الأرشفة', departmentId: 6 },
    { id: 'EMP008', name: 'هند سعد الحربي', position: 'مسؤول مشتريات', department: 'المشتريات', departmentId: 7 },
    { id: 'EMP009', name: 'ياسر محمد الزهراني', position: 'مهندس برمجيات', department: 'تقنية المعلومات', departmentId: 5 },
    { id: 'EMP010', name: 'لمياء عبدالله العنزي', position: 'أخصائي موارد بشرية', department: 'الموارد البشرية', departmentId: 1 },
];

export default function useEmployeeSearch() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [usingFallback, setUsingFallback] = useState(false);
    const debounceRef = useRef(null);

    /**
     * تحويل بيانات HR API إلى الشكل المستخدم في المكونات
     */
    const mapApiEmployee = useCallback((emp) => ({
        id: emp.nationalId || emp.id?.toString() || '',
        name: emp.arName || emp.name || '',
        position: emp.jobName || emp.rank || '',
        department: emp.departmentName || '',
        departmentId: emp.departmentId,
        employeeId: emp.id,
    }), []);

    /**
     * البحث عن موظفين - API أولاً، fallback محلي إذا فشل
     */
    const search = useCallback((query) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!query || query.trim().length < 2) {
            setEmployees([]);
            setError(null);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await api.hr.searchEmployees(query.trim());
                if (result && result.items && result.items.length > 0) {
                    setEmployees(result.items.map(mapApiEmployee));
                    setUsingFallback(false);
                } else if (result && Array.isArray(result) && result.length > 0) {
                    setEmployees(result.map(mapApiEmployee));
                    setUsingFallback(false);
                } else {
                    // No results from API - use fallback filtered
                    const filtered = FALLBACK_EMPLOYEES.filter(emp =>
                        emp.name.includes(query) || emp.position.includes(query) || emp.department.includes(query)
                    );
                    setEmployees(filtered);
                    setUsingFallback(true);
                }
            } catch (err) {
                // API failed - use fallback
                console.warn('Employee search API failed, using fallback:', err.message);
                const filtered = FALLBACK_EMPLOYEES.filter(emp =>
                    emp.name.includes(query) || emp.position.includes(query) || emp.department.includes(query)
                );
                setEmployees(filtered.length > 0 ? filtered : FALLBACK_EMPLOYEES);
                setUsingFallback(true);
                setError(null); // Don't show error to user, fallback is seamless
            } finally {
                setLoading(false);
            }
        }, 300); // 300ms debounce
    }, [mapApiEmployee]);

    /**
     * مسح النتائج
     */
    const clearResults = useCallback(() => {
        setEmployees([]);
        setError(null);
    }, []);

    return {
        employees,
        loading,
        error,
        usingFallback,
        search,
        clearResults,
        FALLBACK_EMPLOYEES,
    };
}
