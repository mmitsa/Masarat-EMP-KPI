/**
 * React Query Configuration
 * 
 * إعدادات التخزين المؤقت الذكي للبيانات
 * 
 * @version 1.0.0
 * @date 2026-02-07
 */

import { QueryClient } from '@tanstack/react-query';
import { useToast } from '../hooks/useToast';
import logger from '../utils/logger';

/**
 * إعدادات React Query
 */
export const queryClientConfig = {
    defaultOptions: {
        queries: {
            // التخزين المؤقت
            staleTime: 5 * 60 * 1000, // 5 دقائق - البيانات تعتبر حديثة
            cacheTime: 24 * 60 * 60 * 1000, // 24 ساعة - الاحتفاظ بالبيانات للعمل بدون اتصال
            
            // إعادة الجلب
            refetchOnWindowFocus: false, // عدم إعادة الجلب عند التركيز على النافذة
            refetchOnReconnect: true, // إعادة الجلب عند استعادة الاتصال
            refetchOnMount: false, // عدم إعادة الجلب عند Mount
            
            // إعادة المحاولة
            retry: 1, // Retry once (resilientClient already retries)
            retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 3000),
            
            // معالجة الأخطاء
            onError: (error) => {
                logger.error('Query Error', { error: error.message });
            },
        },
        mutations: {
            // إعادة المحاولة
            retry: 1,
            
            // معالجة الأخطاء
            onError: (error) => {
                logger.error('Mutation Error', { error: error.message });
            },
        },
    },
};

/**
 * إنشاء Query Client
 */
export const queryClient = new QueryClient(queryClientConfig);

/**
 * Query Keys - مفاتيح موحدة للاستعلامات
 */
export const QUERY_KEYS = {
    // الموارد البشرية
    EMPLOYEES: ['employees'],
    EMPLOYEE: (id) => ['employee', id],
    EMPLOYEE_ATTENDANCE: (id) => ['employee-attendance', id],
    EMPLOYEE_LEAVES: (id) => ['employee-leaves', id],
    DEPARTMENTS: ['departments'],
    POSITIONS: ['positions'],
    
    // المخزون
    ITEMS: ['items'],
    ITEM: (id) => ['item', id],
    CATEGORIES: ['categories'],
    WAREHOUSES: ['warehouses'],
    EXCHANGE_REQUESTS: ['exchange-requests'],
    STOCKTAKINGS: ['stocktakings'],
    
    // الحركة
    VEHICLES: ['vehicles'],
    VEHICLE: (id) => ['vehicle', id],
    MAINTENANCE: ['maintenance'],
    TRIPS: ['trips'],
    
    // المالية
    BUDGET: ['budget'],
    BUDGET_ITEMS: ['budget-items'],
    EXPENSES: ['expenses'],
    DISBURSEMENTS: ['disbursements'],
    
    // الدعم الفني
    TICKETS: ['tickets'],
    TICKET: (id) => ['ticket', id],
    ASSETS: ['assets'],
    
    // الأرشفة
    DOCUMENTS: ['documents'],
    DOCUMENT: (id) => ['document', id],
    
    // التحليلات
    ANALYTICS: ['analytics'],
    REPORTS: ['reports'],
};

/**
 * Hooks مخصصة للاستعلامات الشائعة
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

/**
 * Hook للحصول على قائمة الموظفين
 */
export function useEmployees(filters = {}) {
    return useQuery({
        queryKey: [...QUERY_KEYS.EMPLOYEES, filters],
        queryFn: () => api.hr.getEmployees(filters),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook للحصول على موظف محدد
 */
export function useEmployee(id) {
    return useQuery({
        queryKey: QUERY_KEYS.EMPLOYEE(id),
        queryFn: () => api.hr.getEmployee(id),
        enabled: !!id,
    });
}

/**
 * Hook لإضافة/تعديل موظف
 */
export function useEmployeeMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();
    
    return useMutation({
        mutationFn: (data) => {
            if (data.id) {
                return api.hr.updateEmployee(data.id, data);
            }
            return api.hr.createEmployee(data);
        },
        onSuccess: (data, variables) => {
            // إبطال التخزين المؤقت للموظفين
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYEES });
            
            if (variables.id) {
                // تحديث الموظف في الكاش
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYEE(variables.id) });
                toast.success('تم التحديث بنجاح');
            } else {
                toast.success('تم الإضافة بنجاح');
            }
            
            logger.info('Employee mutation success', { id: variables.id });
        },
        onError: (error) => {
            toast.error('فشلت العملية', error.message);
            logger.error('Employee mutation failed', { error: error.message });
        },
    });
}

/**
 * Hook لحذف موظف
 */
export function useDeleteEmployee() {
    const queryClient = useQueryClient();
    const toast = useToast();
    
    return useMutation({
        mutationFn: (id) => api.hr.deleteEmployee(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYEES });
            toast.success('تم الحذف بنجاح');
            logger.info('Employee deleted', { id });
        },
        onError: (error) => {
            toast.error('فشل الحذف', error.message);
            logger.error('Delete employee failed', { error: error.message });
        },
    });
}

/**
 * Hook للحصول على قائمة الأصناف
 */
export function useItems(filters = {}) {
    return useQuery({
        queryKey: [...QUERY_KEYS.ITEMS, filters],
        queryFn: () => api.warehouse.getItems(filters),
        staleTime: 10 * 60 * 1000, // 10 دقائق - البيانات نادراً ما تتغير
    });
}

/**
 * Hook للحصول على التذاكر
 */
export function useTickets(filters = {}) {
    return useQuery({
        queryKey: [...QUERY_KEYS.TICKETS, filters],
        queryFn: () => api.itsm.getTickets(filters),
        staleTime: 2 * 60 * 1000, // دقيقتان - بيانات متغيرة
        refetchInterval: 30000, // تحديث تلقائي كل 30 ثانية
    });
}

/**
 * Hook لإنشاء تذكرة
 */
export function useCreateTicket() {
    const queryClient = useQueryClient();
    const toast = useToast();
    
    return useMutation({
        mutationFn: (data) => api.itsm.createTicket(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS });
            toast.success('تم إنشاء التذكرة بنجاح');
        },
        onError: (error) => {
            toast.error('فشل إنشاء التذكرة', error.message);
        },
    });
}

/**
 * Optimistic Update - تحديث متفائل
 */
export function useOptimisticUpdate(queryKey, updateFn) {
    const queryClient = useQueryClient();
    
    return {
        onMutate: async (newData) => {
            // إلغاء الاستعلامات الجارية
            await queryClient.cancelQueries({ queryKey });
            
            // حفظ البيانات السابقة
            const previousData = queryClient.getQueryData(queryKey);
            
            // تحديث متفائل
            queryClient.setQueryData(queryKey, (old) => updateFn(old, newData));
            
            return { previousData };
        },
        onError: (err, newData, context) => {
            // استرجاع البيانات السابقة عند الفشل
            queryClient.setQueryData(queryKey, context.previousData);
        },
        onSettled: () => {
            // إعادة جلب البيانات للتأكد من التزامن
            queryClient.invalidateQueries({ queryKey });
        },
    };
}

/**
 * Prefetch - جلب مسبق للبيانات
 */
export async function prefetchEmployees(queryClient) {
    await queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.EMPLOYEES,
        queryFn: () => api.hr.getEmployees(),
    });
}

export async function prefetchEmployee(queryClient, id) {
    await queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.EMPLOYEE(id),
        queryFn: () => api.hr.getEmployee(id),
    });
}

/**
 * تنظيف الكاش
 */
export function clearCache() {
    queryClient.clear();
    logger.info('Query cache cleared');
}

/**
 * إعادة جلب كل البيانات
 */
export function refetchAll() {
    queryClient.refetchQueries();
    logger.info('All queries refetched');
}

export default {
    queryClient,
    queryClientConfig,
    QUERY_KEYS,
    useEmployees,
    useEmployee,
    useEmployeeMutation,
    useDeleteEmployee,
    useItems,
    useTickets,
    useCreateTicket,
    useOptimisticUpdate,
    prefetchEmployees,
    prefetchEmployee,
    clearCache,
    refetchAll,
};
