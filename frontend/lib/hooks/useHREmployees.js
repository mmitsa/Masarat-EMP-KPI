import { useQuery } from '@tanstack/react-query';

/**
 * useHREmployees - Hook مشترك لجلب بيانات الموظفين من وحدة HR
 *
 * يستخدمه أي موديول يحتاج قائمة موظفين (مستودعات، حركة، مشاريع، ITSM، إلخ)
 * دون الحاجة للوصول إلى EmployeeContext العالمي. مناسب للمكونات المستقلة
 * التي تحتاج فلترة مخصصة (قسم معين، حجم صفحة محدد، إلخ).
 *
 * @param {Object} options - خيارات الفلترة والتحكم
 * @param {number}  [options.departmentId]  - فلترة حسب القسم (اختياري)
 * @param {boolean} [options.activeOnly=true]  - الموظفون النشطون فقط
 * @param {number}  [options.pageSize=200]     - الحد الأقصى لعدد النتائج
 * @param {boolean} [options.enabled=true]     - تفعيل الاستعلام (للتحكم المشروط)
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 *
 * @example
 * // جلب كل الموظفين النشطين
 * const { data: employees = [], isLoading } = useHREmployees();
 *
 * @example
 * // جلب موظفي قسم معين فقط
 * const { data: employees = [] } = useHREmployees({ departmentId: 5 });
 *
 * @example
 * // تعطيل الاستعلام حتى يتوفر شرط
 * const { data } = useHREmployees({ enabled: !!selectedDept, departmentId: selectedDept });
 */
export function useHREmployees({
    departmentId,
    activeOnly = true,
    pageSize = 200,
    enabled = true,
} = {}) {
    const params = new URLSearchParams();
    params.set('pageSize', String(pageSize));
    if (activeOnly) params.set('isActive', 'true');
    if (departmentId) params.set('departmentId', String(departmentId));

    return useQuery({
        queryKey: ['hr-employees', { departmentId, activeOnly, pageSize }],
        queryFn: async () => {
            const res = await fetch(`/api/hr/employees?${params.toString()}`);
            if (!res.ok) throw new Error('فشل في جلب بيانات الموظفين');
            const data = await res.json();
            return data.data || data.items || data || [];
        },
        staleTime: 5 * 60 * 1000,       // 5 دقائق
        refetchOnWindowFocus: false,
        enabled,
    });
}

/**
 * useHRDepartments - Hook لجلب قائمة الأقسام
 *
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true] - تفعيل الاستعلام
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 *
 * @example
 * const { data: departments = [] } = useHRDepartments();
 */
export function useHRDepartments({ enabled = true } = {}) {
    return useQuery({
        queryKey: ['hr-departments'],
        queryFn: async () => {
            const res = await fetch('/api/hr/departments');
            if (!res.ok) throw new Error('فشل في جلب بيانات الأقسام');
            const data = await res.json();
            return data.data || data || [];
        },
        staleTime: 10 * 60 * 1000,      // 10 دقائق - الأقسام تتغير نادراً
        refetchOnWindowFocus: false,
        enabled,
    });
}

/**
 * useHREmployee - Hook لجلب بيانات موظف واحد بمعرفه
 *
 * @param {number|string} employeeId - معرف الموظف
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true] - تفعيل الاستعلام
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 *
 * @example
 * const { data: employee } = useHREmployee(driverId);
 */
export function useHREmployee(employeeId, { enabled = true } = {}) {
    return useQuery({
        queryKey: ['hr-employee', employeeId],
        queryFn: async () => {
            const res = await fetch(`/api/hr/employees/${employeeId}`);
            if (!res.ok) throw new Error('فشل في جلب بيانات الموظف');
            return await res.json();
        },
        staleTime: 5 * 60 * 1000,
        enabled: enabled && !!employeeId,
    });
}

export default useHREmployees;
