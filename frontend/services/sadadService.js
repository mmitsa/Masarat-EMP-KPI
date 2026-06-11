/**
 * Sadad Service - Payment Gateway Integration via Masarat Gateway
 */

import { apiMethods } from '../lib/apiClient'

const SADAD_BASE = '/sadad'

export const sadadService = {
  // Invoice endpoints
  getInvoices: (page = 1, pageSize = 20, status = '') =>
    apiMethods.get(`${SADAD_BASE}/invoices`, {
      params: { page, pageSize, status },
    }),

  getInvoice: (id) => apiMethods.get(`${SADAD_BASE}/invoices/${id}`),

  createInvoice: (data) => apiMethods.post(`${SADAD_BASE}/invoices`, data),

  updateInvoice: (id, data) => apiMethods.put(`${SADAD_BASE}/invoices/${id}`, data),

  sendInvoice: (id) =>
    apiMethods.post(`${SADAD_BASE}/invoices/${id}/send`, {}),

  cancelInvoice: (id, reason) =>
    apiMethods.patch(`${SADAD_BASE}/invoices/${id}`, { cancelled: true, reason }),

  // Payment endpoints
  getPayments: (page = 1, pageSize = 20) =>
    apiMethods.get(`${SADAD_BASE}/payments`, {
      params: { page, pageSize },
    }),

  recordPayment: (invoiceId, amount, method) =>
    apiMethods.post(`${SADAD_BASE}/payments`, {
      invoiceId,
      amount,
      method,
      timestamp: new Date().toISOString(),
    }),

  // Sadad payment gateway integration
  initiateSadadPayment: (invoiceId, amount) =>
    apiMethods.post(`${SADAD_BASE}/payments/sadad/initiate`, {
      invoiceId,
      amount,
    }),

  confirmSadadPayment: (transactionId, reference) =>
    apiMethods.post(`${SADAD_BASE}/payments/sadad/confirm`, {
      transactionId,
      reference,
    }),

  // Settlement endpoints
  getSettlements: (page = 1, pageSize = 20) =>
    apiMethods.get(`${SADAD_BASE}/settlements`, {
      params: { page, pageSize },
    }),

  createSettlement: (data) => apiMethods.post(`${SADAD_BASE}/settlements`, data),

  // Dashboard & Analytics
  getDashboardStats: () => apiMethods.get(`${SADAD_BASE}/dashboard/stats`),

  getPaymentAnalytics: (period = 'monthly') =>
    apiMethods.get(`${SADAD_BASE}/analytics`, { params: { period } }),

  getOutstandingInvoices: () =>
    apiMethods.get(`${SADAD_BASE}/invoices/outstanding`),
}

export default sadadService
