/**
 * Approvals API Service
 * خدمة API لنظام الموافقات
 *
 * @module services/approvalsApi
 * @version 1.0.0
 * @date 2026-02-14
 */

const APPROVALS_BASE_URL = '/api/approvals';

/**
 * Approvals API Client
 */
class ApprovalsAPI {
    /**
     * استرجاع ملخص لوحة التحكم
     * Get dashboard summary
     * @returns {Promise<Object>} Dashboard data
     */
    async getDashboard() {
        const response = await fetch(`${APPROVALS_BASE_URL}/dashboard`);
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        return response.json();
    }

    /**
     * استرجاع قائمة الطلبات المعلقة علي
     * Get pending approvals for current user
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Pending approvals list
     */
    async getPendingApprovals(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${APPROVALS_BASE_URL}/pending${queryString ? `?${queryString}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch pending approvals');
        return response.json();
    }

    /**
     * استرجاع طلباتي
     * Get my submitted requests
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} My requests list
     */
    async getMyRequests(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${APPROVALS_BASE_URL}/my-requests${queryString ? `?${queryString}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch my requests');
        return response.json();
    }

    /**
     * استرجاع تفاصيل طلب
     * Get request details
     * @param {string} requestId - Request ID
     * @returns {Promise<Object>} Request details
     */
    async getRequestDetails(requestId) {
        const response = await fetch(`${APPROVALS_BASE_URL}/requests/${requestId}`);
        if (!response.ok) throw new Error('Failed to fetch request details');
        return response.json();
    }

    /**
     * الموافقة على طلب
     * Approve a request
     * @param {string} requestId - Request ID
     * @param {Object} data - Approval data (comment, etc.)
     * @returns {Promise<Object>} Updated request
     */
    async approveRequest(requestId, data = {}) {
        const response = await fetch(`${APPROVALS_BASE_URL}/requests/${requestId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to approve request');
        return response.json();
    }

    /**
     * رفض طلب
     * Reject a request
     * @param {string} requestId - Request ID
     * @param {Object} data - Rejection data (reason, comment)
     * @returns {Promise<Object>} Updated request
     */
    async rejectRequest(requestId, data = {}) {
        const response = await fetch(`${APPROVALS_BASE_URL}/requests/${requestId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to reject request');
        return response.json();
    }

    /**
     * سحب طلب
     * Recall a request
     * @param {string} requestId - Request ID
     * @returns {Promise<Object>} Updated request
     */
    async recallRequest(requestId) {
        const response = await fetch(`${APPROVALS_BASE_URL}/requests/${requestId}/recall`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to recall request');
        return response.json();
    }

    /**
     * استرجاع تاريخ الموافقات لطلب
     * Get approval history for a request
     * @param {string} requestId - Request ID
     * @returns {Promise<Array>} Approval history
     */
    async getApprovalHistory(requestId) {
        const response = await fetch(`${APPROVALS_BASE_URL}/requests/${requestId}/history`);
        if (!response.ok) throw new Error('Failed to fetch approval history');
        return response.json();
    }

    /**
     * استرجاع قائمة Workflows
     * Get workflows list
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Workflows list
     */
    async getWorkflows(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${APPROVALS_BASE_URL}/workflows${queryString ? `?${queryString}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch workflows');
        return response.json();
    }

    /**
     * استرجاع تفاصيل Workflow
     * Get workflow details
     * @param {string} workflowId - Workflow ID
     * @returns {Promise<Object>} Workflow details
     */
    async getWorkflowDetails(workflowId) {
        const response = await fetch(`${APPROVALS_BASE_URL}/workflows/${workflowId}`);
        if (!response.ok) throw new Error('Failed to fetch workflow details');
        return response.json();
    }

    /**
     * تفعيل/تعطيل Workflow
     * Activate/Deactivate workflow
     * @param {string} workflowId - Workflow ID
     * @param {boolean} isActive - New active state
     * @returns {Promise<Object>} Updated workflow
     */
    async toggleWorkflow(workflowId, isActive) {
        const response = await fetch(`${APPROVALS_BASE_URL}/workflows/${workflowId}/toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive }),
        });
        if (!response.ok) throw new Error('Failed to toggle workflow');
        return response.json();
    }

    /**
     * موافقة جماعية
     * Bulk approve requests
     * @param {Array<string>} requestIds - Array of request IDs
     * @param {Object} data - Approval data
     * @returns {Promise<Object>} Bulk operation result
     */
    async bulkApprove(requestIds, data = {}) {
        const response = await fetch(`${APPROVALS_BASE_URL}/bulk/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestIds, ...data }),
        });
        if (!response.ok) throw new Error('Failed to bulk approve');
        return response.json();
    }

    /**
     * رفض جماعي
     * Bulk reject requests
     * @param {Array<string>} requestIds - Array of request IDs
     * @param {Object} data - Rejection data
     * @returns {Promise<Object>} Bulk operation result
     */
    async bulkReject(requestIds, data = {}) {
        const response = await fetch(`${APPROVALS_BASE_URL}/bulk/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestIds, ...data }),
        });
        if (!response.ok) throw new Error('Failed to bulk reject');
        return response.json();
    }

    /**
     * استرجاع إحصائيات SLA
     * Get SLA statistics
     * @returns {Promise<Object>} SLA stats
     */
    async getSLAStats() {
        const response = await fetch(`${APPROVALS_BASE_URL}/stats/sla`);
        if (!response.ok) throw new Error('Failed to fetch SLA stats');
        return response.json();
    }
}

// Export singleton instance
export default new ApprovalsAPI();
