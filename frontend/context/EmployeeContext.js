import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * EmployeeContext - سياق عالمي لبيانات الموظفين
 *
 * يوفر هذا السياق قائمة الموظفين والأقسام لجميع الموديولات دون الحاجة
 * لإعادة جلب البيانات في كل صفحة. يعتمد على react-query للتخزين المؤقت
 * ومنع الطلبات المكررة.
 *
 * الاستخدام:
 *   const { employees, getEmployeeName, isLoading } = useEmployees();
 */

const EmployeeContext = createContext(null);

export function EmployeeProvider({ children }) {
    // ذاكرة تخزين مؤقت للموظفين بحسب المعرف - تُحدَّث تلقائياً عند جلب البيانات
    const employeeCache = useRef(new Map());

    // استخراج مصفوفة بأمان من استجابة API
    const extractArray = (data) => {
        if (Array.isArray(data)) return data;
        if (data && typeof data === 'object') {
            if (Array.isArray(data.data)) return data.data;
            if (Array.isArray(data.items)) return data.items;
            if (Array.isArray(data.$values)) return data.$values;
        }
        return [];
    };

    // جلب جميع الموظفين النشطين - يُستخدم في القوائم المنسدلة عبر الموديولات
    const { data: employees = [], isLoading, error } = useQuery({
        queryKey: ['global-employees'],
        queryFn: async () => {
            const res = await fetch('/api/hr/employees?pageSize=500&isActive=true');
            if (!res.ok) return [];
            const data = await res.json();
            const list = extractArray(data);
            // تعبئة الذاكرة المؤقتة بالمعرفات
            list.forEach(emp => employeeCache.current.set(emp.id, emp));
            return list;
        },
        staleTime: 5 * 60 * 1000,       // 5 دقائق قبل إعادة الجلب
        refetchOnWindowFocus: false,
    });

    // جلب الأقسام - تتغير نادراً لذا مدة التخزين أطول
    const { data: departments = [] } = useQuery({
        queryKey: ['global-departments'],
        queryFn: async () => {
            const res = await fetch('/api/hr/departments');
            if (!res.ok) return [];
            const data = await res.json();
            return extractArray(data);
        },
        staleTime: 10 * 60 * 1000,      // 10 دقائق
        refetchOnWindowFocus: false,
    });

    /**
     * إرجاع بيانات موظف بمعرفه - يبحث أولاً في الذاكرة المؤقتة
     * @param {number|string} id - معرف الموظف
     * @returns {Object|null}
     */
    const getEmployeeById = useCallback((id) => {
        if (!id) return null;
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        return (
            employeeCache.current.get(numericId) ||
            employeeCache.current.get(id) ||
            employees.find(e => e.id === numericId || e.id === id) ||
            null
        );
    }, [employees]);

    /**
     * إرجاع اسم الموظف بمعرفه (اختصار مناسب للعرض)
     * @param {number|string} id - معرف الموظف
     * @returns {string}
     */
    const getEmployeeName = useCallback((id) => {
        const emp = getEmployeeById(id);
        return emp?.arName || emp?.name || emp?.employeeName || '';
    }, [getEmployeeById]);

    /**
     * البحث في قائمة الموظفين بالاسم أو الرقم الوطني
     * @param {string} query - نص البحث (يجب أن يكون حرفين على الأقل)
     * @returns {Array}
     */
    const searchEmployees = useCallback((query) => {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase();
        return employees.filter(e =>
            (e.arName || e.name || '').toLowerCase().includes(q) ||
            (e.enName || '').toLowerCase().includes(q) ||
            (e.nationalId || '').includes(q)
        );
    }, [employees]);

    /**
     * إرجاع قائمة الموظفين في قسم معين
     * @param {number|string} deptId - معرف القسم
     * @returns {Array}
     */
    const getEmployeesByDepartment = useCallback((deptId) => {
        if (!deptId) return [];
        return employees.filter(e => e.departmentId === deptId);
    }, [employees]);

    const value = {
        employees,
        departments,
        isLoading,
        error,
        getEmployeeById,
        getEmployeeName,
        searchEmployees,
        getEmployeesByDepartment,
    };

    return (
        <EmployeeContext.Provider value={value}>
            {children}
        </EmployeeContext.Provider>
    );
}

/**
 * useEmployees - hook للوصول إلى سياق الموظفين
 * يجب استخدامه داخل EmployeeProvider
 */
export function useEmployees() {
    const context = useContext(EmployeeContext);
    if (!context) {
        throw new Error('useEmployees يجب أن يُستخدم داخل EmployeeProvider');
    }
    return context;
}

export default EmployeeContext;
