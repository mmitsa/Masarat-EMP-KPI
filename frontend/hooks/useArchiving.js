/**
 * useArchiving Hook - إدارة حالة نظام الأرشفة
 * Custom hook for managing archiving state with React Query
 *
 * @version 1.0.0
 * @date 2026-02-14
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../context/NotificationContext';
import archivingApi from '../services/archivingApi';

/**
 * Query Keys للأرشفة
 */
export const ARCHIVING_KEYS = {
  all: ['archiving'],
  dashboard: () => [...ARCHIVING_KEYS.all, 'dashboard'],
  documents: () => [...ARCHIVING_KEYS.all, 'documents'],
  document: (id) => [...ARCHIVING_KEYS.documents(), id],
  recent: () => [...ARCHIVING_KEYS.documents(), 'recent'],
  cabinets: () => [...ARCHIVING_KEYS.all, 'cabinets'],
  cabinet: (id) => [...ARCHIVING_KEYS.cabinets(), id],
  cabinetDocs: (id) => [...ARCHIVING_KEYS.cabinet(id), 'documents'],
  tree: () => [...ARCHIVING_KEYS.cabinets(), 'tree'],
  classifications: () => [...ARCHIVING_KEYS.all, 'classifications'],
  classification: (id) => [...ARCHIVING_KEYS.classifications(), id],
  classTree: () => [...ARCHIVING_KEYS.classifications(), 'tree'],
  accessRequests: () => [...ARCHIVING_KEYS.all, 'access-requests'],
  tags: () => [...ARCHIVING_KEYS.all, 'tags'],
  history: (docId) => [...ARCHIVING_KEYS.document(docId), 'history'],
  accessLog: (docId) => [...ARCHIVING_KEYS.document(docId), 'access-log'],
};

/**
 * Hook لإحصائيات لوحة التحكم
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ARCHIVING_KEYS.dashboard(),
    queryFn: archivingApi.getDashboardStats,
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
  });
}

/**
 * Hook للمستندات
 */
export function useDocuments(params = {}) {
  return useQuery({
    queryKey: [...ARCHIVING_KEYS.documents(), params],
    queryFn: () => archivingApi.getDocuments(params),
    staleTime: 30000,
    keepPreviousData: true, // لتجربة أفضل عند التنقل بين الصفحات
  });
}

/**
 * Hook للمستندات الأخيرة
 */
export function useRecentDocuments(limit = 10) {
  return useQuery({
    queryKey: [...ARCHIVING_KEYS.recent(), limit],
    queryFn: () => archivingApi.getRecentDocuments(limit),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook لمستند واحد
 */
export function useDocument(documentId, options = {}) {
  return useQuery({
    queryKey: ARCHIVING_KEYS.document(documentId),
    queryFn: () => archivingApi.getDocument(documentId),
    enabled: !!documentId,
    ...options,
  });
}

/**
 * Hook لإنشاء مستند
 */
export function useCreateDocument() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (formData) => archivingApi.createDocument(formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries(ARCHIVING_KEYS.documents());
      queryClient.invalidateQueries(ARCHIVING_KEYS.dashboard());
      toast.success('نجاح', 'تم إنشاء المستند بنجاح');
    },
    onError: (error) => {
      toast.error('خطأ', error.message || 'فشل في إنشاء المستند');
    },
  });
}

/**
 * Hook لتحديث مستند
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => archivingApi.updateDocument(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(ARCHIVING_KEYS.document(variables.id));
      queryClient.invalidateQueries(ARCHIVING_KEYS.documents());
      toast.success('نجاح', 'تم تحديث المستند بنجاح');
    },
    onError: (error) => {
      toast.error('خطأ', error.message || 'فشل في تحديث المستند');
    },
  });
}

/**
 * Hook لحذف مستند
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (documentId) => archivingApi.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries(ARCHIVING_KEYS.documents());
      queryClient.invalidateQueries(ARCHIVING_KEYS.dashboard());
      toast.success('نجاح', 'تم حذف المستند بنجاح');
    },
    onError: (error) => {
      toast.error('خطأ', error.message || 'فشل في حذف المستند');
    },
  });
}

/**
 * Hook لأرشفة مستند
 */
export function useArchiveDocument() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (documentId) => archivingApi.archiveDocument(documentId),
    onSuccess: (data, documentId) => {
      queryClient.invalidateQueries(ARCHIVING_KEYS.document(documentId));
      queryClient.invalidateQueries(ARCHIVING_KEYS.documents());
      toast.success('نجاح', 'تم أرشفة المستند بنجاح');
    },
    onError: (error) => {
      toast.error('خطأ', error.message || 'فشل في أرشفة المستند');
    },
  });
}

/**
 * Hook لرفع مستند مع تتبع التقدم
 */
export function useUploadDocument(onProgress) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ file, metadata }) =>
      archivingApi.uploadDocument(file, metadata, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries(ARCHIVING_KEYS.documents());
      queryClient.invalidateQueries(ARCHIVING_KEYS.dashboard());
      toast.success('نجاح', 'تم رفع المستند بنجاح');
    },
    onError: (error) => {
      toast.error('خطأ', error.message || 'فشل في رفع المستند');
    },
  });
}

/**
 * Hook لرفع ملفات متعددة
 */
export function useUploadMultipleDocuments(onProgress) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ files, metadata }) =>
      archivingApi.uploadMultipleDocuments(files, metadata, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries(ARCHIVING_KEYS.documents());
      queryClient.invalidateQueries(ARCHIVING_KEYS.dashboard());
      toast.success('نجاح', 'تم رفع المستندات بنجاح');
    },
    onError: (error) => {
      toast.error('خطأ', error.message || 'فشل في رفع المستندات');
    },
  });
}

/**
 * Hook للخزائن
 */
export function useCabinets(params = {}) {
  return useQuery({
    queryKey: [...ARCHIVING_KEYS.cabinets(), params],
    queryFn: () => archivingApi.getCabinets(params),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook لشجرة الخزائن
 */
export function useCabinetsTree() {
  return useQuery({
    queryKey: ARCHIVING_KEYS.tree(),
    queryFn: archivingApi.getCabinetsTree,
    staleTime: 120000, // 2 minutes
  });
}

/**
 * Hook لخزينة واحدة
 */
export function useCabinet(cabinetId) {
  return useQuery({
    queryKey: ARCHIVING_KEYS.cabinet(cabinetId),
    queryFn: () => archivingApi.getCabinet(cabinetId),
    enabled: !!cabinetId,
  });
}

/**
 * Hook لمستندات خزينة
 */
export function useCabinetDocuments(cabinetId, params = {}) {
  return useQuery({
    queryKey: [...ARCHIVING_KEYS.cabinetDocs(cabinetId), params],
    queryFn: () => archivingApi.getCabinetDocuments(cabinetId, params),
    enabled: !!cabinetId,
    keepPreviousData: true,
  });
}

/**
 * Hook لإنشاء خزينة
 */
export function useCreateCabinet() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data) => archivingApi.createCabinet(data),
    onSuccess: () => {
      queryClient.invalidateQueries(ARCHIVING_KEYS.cabinets());
      queryClient.invalidateQueries(ARCHIVING_KEYS.tree());
      toast.success('نجاح', 'تم إنشاء الخزينة بنجاح');
    },
    onError: (error) => {
      toast.error('خطأ', error.message || 'فشل في إنشاء الخزينة');
    },
  });
}

/**
 * Hook لتحديث خزينة
 */
export function useUpdateCabinet() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => archivingApi.updateCabinet(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(ARCHIVING_KEYS.cabinet(variables.id));
      queryClient.invalidateQueries(ARCHIVING_KEYS.cabinets());
      toast.success('نجاح', 'تم تحديث الخزينة بنجاح');
    },
    onError: (error) => {
      toast.error('خطأ', error.message || 'فشل في تحديث الخزينة');
    },
  });
}

/**
 * Hook لحذف خزينة
 */
export function useDeleteCabinet() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (cabinetId) => archivingApi.deleteCabinet(cabinetId),
    onSuccess: () => {
      queryClient.invalidateQueries(ARCHIVING_KEYS.cabinets());
      queryClient.invalidateQueries(ARCHIVING_KEYS.tree());
      toast.success('نجاح', 'تم حذف الخزينة بنجاح');
    },
    onError: (error) => {
      toast.error('خطأ', error.message || 'فشل في حذف الخزينة');
    },
  });
}

/**
 * Hook للتصنيفات
 */
export function useClassifications() {
  return useQuery({
    queryKey: ARCHIVING_KEYS.classifications(),
    queryFn: archivingApi.getClassifications,
    staleTime: 120000, // 2 minutes
  });
}

/**
 * Hook لشجرة التصنيفات
 */
export function useClassificationsTree() {
  return useQuery({
    queryKey: ARCHIVING_KEYS.classTree(),
    queryFn: archivingApi.getClassificationsTree,
    staleTime: 120000,
  });
}

/**
 * Hook لإنشاء تصنيف
 */
export function useCreateClassification() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data) => archivingApi.createClassification(data),
    onSuccess: () => {
      queryClient.invalidateQueries(ARCHIVING_KEYS.classifications());
      toast.success('نجاح', 'تم إنشاء التصنيف بنجاح');
    },
    onError: (error) => {
      toast.error('خطأ', error.message || 'فشل في إنشاء التصنيف');
    },
  });
}

/**
 * Hook للبحث في المستندات
 */
export function useSearchDocuments() {
  const toast = useToast();

  return useMutation({
    mutationFn: (filters) => archivingApi.searchDocuments(filters),
    onError: (error) => {
      toast.error('خطأ', error.message || 'فشل في البحث');
    },
  });
}

/**
 * Hook لطلبات الوصول
 */
export function useAccessRequests(params = {}) {
  return useQuery({
    queryKey: [...ARCHIVING_KEYS.accessRequests(), params],
    queryFn: () => archivingApi.getAccessRequests(params),
    staleTime: 30000,
  });
}

/**
 * Hook لطلب الوصول إلى مستند
 */
export function useRequestDocumentAccess() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ documentId, data }) =>
      archivingApi.requestDocumentAccess(documentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(ARCHIVING_KEYS.accessRequests());
      toast.success('نجاح', 'تم إرسال طلب الوصول بنجاح');
    },
    onError: (error) => {
      toast.error('خطأ', error.message || 'فشل في إرسال طلب الوصول');
    },
  });
}

/**
 * Hook للموافقة على طلب وصول
 */
export function useApproveAccessRequest() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ requestId, data }) =>
      archivingApi.approveAccessRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(ARCHIVING_KEYS.accessRequests());
      toast.success('نجاح', 'تمت الموافقة على الطلب');
    },
    onError: (error) => {
      toast.error('خطأ', error.message || 'فشل في الموافقة على الطلب');
    },
  });
}

/**
 * Hook لسجل المستند
 */
export function useDocumentHistory(documentId) {
  return useQuery({
    queryKey: ARCHIVING_KEYS.history(documentId),
    queryFn: () => archivingApi.getDocumentHistory(documentId),
    enabled: !!documentId,
    staleTime: 60000,
  });
}

/**
 * Hook لجميع الوسوم
 */
export function useTags() {
  return useQuery({
    queryKey: ARCHIVING_KEYS.tags(),
    queryFn: archivingApi.getAllTags,
    staleTime: 120000,
  });
}

/**
 * Hook مركب لصفحة لوحة التحكم
 * يجمع جميع البيانات المطلوبة للوحة التحكم
 */
export function useArchivingDashboard() {
  const stats = useDashboardStats();
  const recentDocs = useRecentDocuments(10);
  const cabinets = useCabinets({ limit: 5 });

  return {
    stats,
    recentDocs,
    cabinets,
    isLoading: stats.isLoading || recentDocs.isLoading || cabinets.isLoading,
    error: stats.error || recentDocs.error || cabinets.error,
  };
}

export default {
  useDashboardStats,
  useDocuments,
  useDocument,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  useArchiveDocument,
  useUploadDocument,
  useUploadMultipleDocuments,
  useCabinets,
  useCabinetsTree,
  useCabinet,
  useCabinetDocuments,
  useCreateCabinet,
  useUpdateCabinet,
  useDeleteCabinet,
  useClassifications,
  useClassificationsTree,
  useCreateClassification,
  useSearchDocuments,
  useAccessRequests,
  useRequestDocumentAccess,
  useApproveAccessRequest,
  useDocumentHistory,
  useTags,
  useArchivingDashboard,
};
