/**
 * Approvals React Query Hooks
 * React Query hooks لنظام الموافقات
 *
 * @module hooks/useApprovals
 * @version 1.0.0
 * @date 2026-02-14
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import approvalsApi from '../services/approvalsApi';
import { useToast } from './useToast';

/**
 * Query Keys
 */
const QUERY_KEYS = {
    dashboard: ['approvals', 'dashboard'],
    pendingApprovals: (params) => ['approvals', 'pending', params],
    myRequests: (params) => ['approvals', 'my-requests', params],
    requestDetails: (id) => ['approvals', 'request', id],
    approvalHistory: (id) => ['approvals', 'history', id],
    workflows: (params) => ['approvals', 'workflows', params],
    workflowDetails: (id) => ['approvals', 'workflow', id],
    slaStats: ['approvals', 'stats', 'sla'],
};

/**
 * استرجاع لوحة التحكم
 * Hook for dashboard data
 */
export function useApprovalsDashboard() {
    return useQuery({
        queryKey: QUERY_KEYS.dashboard,
        queryFn: () => approvalsApi.getDashboard(),
        staleTime: 1000 * 60 * 2, retry: 1,
        refetchInterval: 1000 * 60 * 5,
    });
}

/**
 * استرجاع الطلبات المعلقة
 * Hook for pending approvals
 */
export function usePendingApprovals(params = {}) {
    return useQuery({
        queryKey: QUERY_KEYS.pendingApprovals(params),
        queryFn: () => approvalsApi.getPendingApprovals(params),
        staleTime: 1000 * 60, // 1 minute
    });
}

/**
 * استرجاع طلباتي
 * Hook for my requests
 */
export function useMyRequests(params = {}) {
    return useQuery({
        queryKey: QUERY_KEYS.myRequests(params),
        queryFn: () => approvalsApi.getMyRequests(params),
        staleTime: 1000 * 60, // 1 minute
    });
}

/**
 * استرجاع تفاصيل طلب
 * Hook for request details
 */
export function useRequestDetails(requestId) {
    return useQuery({
        queryKey: QUERY_KEYS.requestDetails(requestId),
        queryFn: () => approvalsApi.getRequestDetails(requestId),
        enabled: !!requestId,
        staleTime: 1000 * 30, // 30 seconds
    });
}

/**
 * استرجاع تاريخ الموافقات
 * Hook for approval history
 */
export function useApprovalHistory(requestId) {
    return useQuery({
        queryKey: QUERY_KEYS.approvalHistory(requestId),
        queryFn: () => approvalsApi.getApprovalHistory(requestId),
        enabled: !!requestId,
    });
}

/**
 * استرجاع Workflows
 * Hook for workflows list
 */
export function useWorkflows(params = {}) {
    return useQuery({
        queryKey: QUERY_KEYS.workflows(params),
        queryFn: () => approvalsApi.getWorkflows(params),
    });
}

/**
 * استرجاع تفاصيل Workflow
 * Hook for workflow details
 */
export function useWorkflowDetails(workflowId) {
    return useQuery({
        queryKey: QUERY_KEYS.workflowDetails(workflowId),
        queryFn: () => approvalsApi.getWorkflowDetails(workflowId),
        enabled: !!workflowId,
    });
}

/**
 * استرجاع إحصائيات SLA
 * Hook for SLA statistics
 */
export function useSLAStats() {
    return useQuery({
        queryKey: QUERY_KEYS.slaStats,
        queryFn: () => approvalsApi.getSLAStats(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * الموافقة على طلب
 * Hook for approving a request
 */
export function useApproveRequest() {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    return useMutation({
        mutationFn: ({ requestId, data }) => approvalsApi.approveRequest(requestId, data),
        onSuccess: (data, variables) => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            addToast('تمت الموافقة على الطلب بنجاح', 'success');
        },
        onError: (error) => {
            addToast(`خطأ: ${error.message}`, 'error');
        },
    });
}

/**
 * رفض طلب
 * Hook for rejecting a request
 */
export function useRejectRequest() {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    return useMutation({
        mutationFn: ({ requestId, data }) => approvalsApi.rejectRequest(requestId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            addToast('تم رفض الطلب بنجاح', 'success');
        },
        onError: (error) => {
            addToast(`خطأ: ${error.message}`, 'error');
        },
    });
}

/**
 * سحب طلب
 * Hook for recalling a request
 */
export function useRecallRequest() {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    return useMutation({
        mutationFn: (requestId) => approvalsApi.recallRequest(requestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            addToast('تم سحب الطلب بنجاح', 'success');
        },
        onError: (error) => {
            addToast(`خطأ: ${error.message}`, 'error');
        },
    });
}

/**
 * تفعيل/تعطيل Workflow
 * Hook for toggling workflow
 */
export function useToggleWorkflow() {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    return useMutation({
        mutationFn: ({ workflowId, isActive }) => approvalsApi.toggleWorkflow(workflowId, isActive),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['approvals', 'workflows'] });
            addToast(
                data.isActive ? 'تم تفعيل Workflow بنجاح' : 'تم تعطيل Workflow بنجاح',
                'success'
            );
        },
        onError: (error) => {
            addToast(`خطأ: ${error.message}`, 'error');
        },
    });
}

/**
 * موافقة جماعية
 * Hook for bulk approve
 */
export function useBulkApprove() {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    return useMutation({
        mutationFn: ({ requestIds, data }) => approvalsApi.bulkApprove(requestIds, data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            addToast(
                `تمت الموافقة على ${response.successCount} من ${response.totalCount} طلب`,
                'success'
            );
        },
        onError: (error) => {
            addToast(`خطأ: ${error.message}`, 'error');
        },
    });
}

/**
 * رفض جماعي
 * Hook for bulk reject
 */
export function useBulkReject() {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    return useMutation({
        mutationFn: ({ requestIds, data }) => approvalsApi.bulkReject(requestIds, data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            addToast(
                `تم رفض ${response.successCount} من ${response.totalCount} طلب`,
                'success'
            );
        },
        onError: (error) => {
            addToast(`خطأ: ${error.message}`, 'error');
        },
    });
}
