// HR API Services
// خدمات برنامج الموارد البشرية المتقدمة

import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_HR_API_URL || 'http://localhost:5001';
const USE_PLATFORM_API = process.env.NEXT_PUBLIC_USE_PLATFORM_API === 'true';
const platformApi = axios.create({ baseURL: '/api/hr' });

const mapDepartment = (row) => ({
  id: row.id,
  name: row.name,
  code: row.code,
  employeeCount: row.employees_count ?? row.employeeCount ?? 0,
  managerName: row.managerName || '-',
  location: row.location || '-',
  description: row.description || '',
  avgSalary: row.avg_salary ?? row.avgSalary ?? 0,
});

const mapAttendance = (row) => ({
  id: row.id,
  employeeId: row.employee_id ?? row.employeeId,
  employeeName: row.employee_name ?? row.employeeName,
  date: row.date,
  checkInTime: row.check_in ?? row.checkIn ?? row.checkInTime ?? null,
  checkOutTime: row.check_out ?? row.checkOut ?? row.checkOutTime ?? null,
  workingHours: row.workingHours ?? row.overtime_hours ?? null,
  status: row.status,
  notes: row.notes || '',
});

const mapLeave = (row) => ({
  id: row.id,
  employeeId: row.employee_id ?? row.employeeId,
  employeeName: row.employee_name ?? row.employeeName,
  leaveType: row.leave_type ?? row.leaveType,
  startDate: row.start_date ?? row.startDate,
  endDate: row.end_date ?? row.endDate,
  numberOfDays: row.days_count ?? row.numberOfDays,
  status: row.status,
  requestDate: row.request_date ?? row.requestDate,
  nationalId: row.national_id ?? row.nationalId,
});

const mapSalary = (row) => {
  const allowancesSum = (row.housing_allowance || 0) + (row.transport_allowance || 0) + (row.other_allowances || 0);
  return {
    id: row.id,
    employeeId: row.employee_id ?? row.employeeId,
    employeeName: row.employee_name ?? row.employeeName,
    baseSalary: row.basic_salary ?? row.baseSalary,
    allowances: allowancesSum || row.allowances || 0,
    deductions: row.deductions ?? 0,
    netSalary: row.net_salary ?? row.netSalary,
    status: row.status || 'processed',
    month: row.month,
    year: row.year,
    departmentName: row.department_name ?? row.departmentName,
    nationalId: row.national_id ?? row.nationalId,
  };
};

// ==================== ELtizam & SARF Integration ====================
const eltizamApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_ELTIZAM_API_URL || '/api/hr/eltizam' });
const sarfApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_SARF_API_URL || '/api/hr/sarf' });

export const hrAPI = {
  // ==================== الموظفون ====================
  employees: {
    getAll: (filters = {}) =>
      USE_PLATFORM_API
        ? platformApi.get('/employees', { params: filters })
        : axios.get(`${API_BASE}/api/employees`, { params: filters }),
    
    getById: (id) =>
      USE_PLATFORM_API
        ? platformApi.get(`/employees/${id}`)
        : axios.get(`${API_BASE}/api/employees/${id}`),
    
    create: (data) =>
      axios.post(`${API_BASE}/api/employees`, data),
    
    update: (id, data) =>
      axios.put(`${API_BASE}/api/employees/${id}`, data),
    
    delete: (id) =>
      axios.delete(`${API_BASE}/api/employees/${id}`),
    
    search: (query) =>
      axios.get(`${API_BASE}/api/employees/search`, {
        params: { q: query },
      }),
    
    getByDepartment: (departmentId) =>
      USE_PLATFORM_API
        ? platformApi.get('/employees', { params: { departmentId } })
        : axios.get(`${API_BASE}/api/employees/department/${departmentId}`),
    
    getAttendance: (employeeId, month) =>
      axios.get(`${API_BASE}/api/employees/${employeeId}/attendance/${month}`),
  },

  // ==================== الإجازات ====================
  leaves: {
    getAll: (filters = {}) =>
      USE_PLATFORM_API
        ? platformApi.get('/leaves', { params: filters }).then((r) => ({ ...r, data: { ...r.data, data: r.data.data?.map(mapLeave) || [] } }))
        : axios.get(`${API_BASE}/api/leaves`, { params: filters }),
    
    getById: (id) =>
      USE_PLATFORM_API
        ? platformApi.get(`/leaves`, { params: { id } }).then((r) => ({ ...r, data: { ...r.data, data: (r.data.data || []).map(mapLeave).find((x) => x.id === id) || null } }))
        : axios.get(`${API_BASE}/api/leaves/${id}`),
    
    request: (data) =>
      USE_PLATFORM_API
        ? platformApi.post('/leaves', {
            employee_id: data.employeeId || data.employee_id,
            leave_type: data.leaveType || data.leave_type,
            start_date: data.startDate || data.start_date,
            end_date: data.endDate || data.end_date,
            days_count: data.daysCount || data.days_count,
            reason: data.reason,
          })
        : axios.post(`${API_BASE}/api/leaves/request`, data),
    
    approve: (id, notes) =>
      USE_PLATFORM_API
        ? (() => {
            const payload = typeof notes === 'object' ? notes : { notes };
            return platformApi.put(`/leaves/${id}`, { status: 'approved', notes: payload.notes });
          })()
        : axios.put(`${API_BASE}/api/leaves/${id}/approve`, { notes }),
    
    reject: (id, reason) =>
      USE_PLATFORM_API
        ? (() => {
            const payload = typeof reason === 'object' ? reason : { reason };
            return platformApi.put(`/leaves/${id}`, { status: 'rejected', reason: payload.reason });
          })()
        : axios.put(`${API_BASE}/api/leaves/${id}/reject`, { reason }),
    
    getBalance: (employeeId) =>
      axios.get(`${API_BASE}/api/leaves/${employeeId}/balance`),
    
    getSchedule: (departmentId, month) =>
      axios.get(`${API_BASE}/api/leaves/schedule`, {
        params: { departmentId, month },
      }),
  },

  // ==================== الرواتب ====================
  salaries: {
    getAll: (filters = {}) =>
      USE_PLATFORM_API
        ? platformApi.get('/salaries', { params: filters }).then((r) => ({ ...r, data: { ...r.data, data: r.data.data?.map(mapSalary) || [], statistics: r.data.statistics } }))
        : axios.get(`${API_BASE}/api/salaries`, { params: filters }),
    
    getById: (id) =>
      axios.get(`${API_BASE}/api/salaries/${id}`),
    
    calculate: (employeeId, month) =>
      axios.post(`${API_BASE}/api/salaries/calculate`, {
        employeeId,
        month,
      }),
    
    approve: (id) =>
      axios.put(`${API_BASE}/api/salaries/${id}/approve`),
    
    generatePayslip: (id) =>
      axios.get(`${API_BASE}/api/salaries/${id}/payslip`, {
        responseType: 'blob',
      }),
    
    processPayroll: (month) =>
      axios.post(`${API_BASE}/api/salaries/process-payroll`, { month }),
    
    getDeductions: (employeeId) =>
      axios.get(`${API_BASE}/api/salaries/${employeeId}/deductions`),
    
    getAllowances: (employeeId) =>
      axios.get(`${API_BASE}/api/salaries/${employeeId}/allowances`),
  },

  // ==================== الحضور ====================
  attendance: {
    getAll: (filters = {}) =>
      USE_PLATFORM_API
        ? platformApi.get('/attendance', { params: filters }).then((r) => ({ ...r, data: { ...r.data, data: r.data.data?.map(mapAttendance) || [], statistics: r.data.statistics } }))
        : axios.get(`${API_BASE}/api/attendance`, { params: filters }),
    
    checkIn: (data) =>
      USE_PLATFORM_API
        ? platformApi.post('/attendance', {
            employee_id: data.employeeId || data.employee_id,
            date: data.date,
            check_in: data.checkInTime || data.check_in,
            status: data.status || 'present',
            notes: data.notes,
          })
        : axios.post(`${API_BASE}/api/attendance/check-in`, data),
    
    checkOut: (data) =>
      USE_PLATFORM_API
        ? (() => {
            const payload = typeof data === 'object' ? data : { employee_id: data };
            return platformApi.patch('/attendance', {
              employee_id: payload.employeeId || payload.employee_id,
              check_out: payload.checkOutTime || payload.check_out,
            });
          })()
        : axios.post(`${API_BASE}/api/attendance/check-out`, data),
    
    getByEmployee: (employeeId, month) =>
      axios.get(`${API_BASE}/api/attendance/employee/${employeeId}/${month}`),
    
    getMonthlyReport: (month) => {
      if (!USE_PLATFORM_API) return axios.get(`${API_BASE}/api/attendance/monthly-report/${month}`);
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;
      return platformApi
        .get('/attendance', { params: { startDate, endDate, page: 1, pageSize: 500 } })
        .then((r) => ({ ...r, data: { ...r.data, data: r.data.data?.map(mapAttendance) || [] } }));
    },
    
    getLatecomers: (month) =>
      axios.get(`${API_BASE}/api/attendance/latecomers`, {
        params: { month },
      }),
  },

  // ==================== الأداء ====================
  performance: {
    getAll: () =>
      axios.get(`${API_BASE}/api/performance`),
    
    getById: (id) =>
      axios.get(`${API_BASE}/api/performance/${id}`),
    
    create: (data) =>
      axios.post(`${API_BASE}/api/performance`, data),
    
    update: (id, data) =>
      axios.put(`${API_BASE}/api/performance/${id}`, data),
    
    getByEmployee: (employeeId, year) =>
      axios.get(`${API_BASE}/api/performance/employee/${employeeId}/${year}`),
    
    generateReport: (year) =>
      axios.get(`${API_BASE}/api/performance/report/${year}`, {
        responseType: 'blob',
      }),
  },

  // ==================== الأقسام ====================
  departments: {
    getAll: () =>
      USE_PLATFORM_API
        ? platformApi.get('/departments').then((r) => ({ ...r, data: { ...r.data, data: r.data.data?.map(mapDepartment) || [] } }))
        : axios.get(`${API_BASE}/api/departments`),
    
    getById: (id) =>
      USE_PLATFORM_API
        ? platformApi.get(`/departments/${id}`).then((r) => ({ ...r, data: { ...r.data, data: r.data.data ? { department: mapDepartment(r.data.data.department), employees: (r.data.data.employees || []).map((e) => ({
              id: e.id,
              national_id: e.national_id,
              name: e.name,
              email: e.email,
              position: e.position,
              basic_salary: e.basic_salary,
              joining_date: e.joining_date,
              is_active: e.is_active,
            })) } : null } }))
        : axios.get(`${API_BASE}/api/departments/${id}`),
    
    create: (data) =>
      USE_PLATFORM_API
        ? platformApi.post('/departments', {
            name: data.name,
            code: data.code,
            description: data.description,
          })
        : axios.post(`${API_BASE}/api/departments`, data),
    
    update: (id, data) =>
      USE_PLATFORM_API
        ? platformApi.put(`/departments/${id}`, {
            name: data.name,
            code: data.code,
            description: data.description,
          })
        : axios.put(`${API_BASE}/api/departments/${id}`, data),
    
    delete: (id) =>
      USE_PLATFORM_API
        ? platformApi.delete(`/departments/${id}`)
        : axios.delete(`${API_BASE}/api/departments/${id}`),
    
    getEmployeeCount: (id) =>
      axios.get(`${API_BASE}/api/departments/${id}/employee-count`),
  },

  // ==================== الوظائف ====================
  positions: {
    getAll: () =>
      axios.get(`${API_BASE}/api/positions`),
    
    getById: (id) =>
      axios.get(`${API_BASE}/api/positions/${id}`),
    
    create: (data) =>
      axios.post(`${API_BASE}/api/positions`, data),
    
    update: (id, data) =>
      axios.put(`${API_BASE}/api/positions/${id}`, data),
  },

  // ==================== التقارير ====================
  reports: {
    employeeList: () =>
      axios.get(`${API_BASE}/api/reports/employee-list`, {
        responseType: 'blob',
      }),
    
    attendanceSummary: (month) =>
      axios.get(`${API_BASE}/api/reports/attendance-summary`, {
        params: { month },
        responseType: 'blob',
      }),
    
    absentees: (month) =>
      axios.get(`${API_BASE}/api/reports/absentees`, {
        params: { month },
        responseType: 'blob',
      }),
    
    payrollSummary: (month) =>
      axios.get(`${API_BASE}/api/reports/payroll-summary`, {
        params: { month },
        responseType: 'blob',
      }),
    
    performanceAnalysis: (year) =>
      axios.get(`${API_BASE}/api/reports/performance-analysis`, {
        params: { year },
        responseType: 'blob',
      }),
  },

  // ==================== العقود ====================
  contracts: {
    getAll: () =>
      axios.get(`${API_BASE}/api/contracts`),
    
    getById: (id) =>
      axios.get(`${API_BASE}/api/contracts/${id}`),
    
    create: (data) =>
      axios.post(`${API_BASE}/api/contracts`, data),
    
    update: (id, data) =>
      axios.put(`${API_BASE}/api/contracts/${id}`, data),
    
    getExpiring: () =>
      axios.get(`${API_BASE}/api/contracts/expiring`),
    
    renew: (id, data) =>
      axios.put(`${API_BASE}/api/contracts/${id}/renew`, data),
  },

  // ==================== الوثائق والشهادات ====================
  documents: {
    // تعريف الراتب
    getSalaryDefinition: (employeeId) =>
      axios.get(`${API_BASE}/api/documents/salary-definition/${employeeId}`),

    generateSalaryDefinition: (employeeId, options = {}) =>
      axios.post(`${API_BASE}/api/documents/salary-definition`, { employeeId, ...options }),

    // بطاقة الموظف
    getEmployeeCard: (employeeId) =>
      axios.get(`${API_BASE}/api/documents/employee-card/${employeeId}`),

    generateEmployeeCard: (employeeId) =>
      axios.post(`${API_BASE}/api/documents/employee-card`, { employeeId }),

    // إخلاء الطرف
    getClearance: (employeeId) =>
      axios.get(`${API_BASE}/api/documents/clearance/${employeeId}`),

    createClearance: (employeeId, data) =>
      axios.post(`${API_BASE}/api/documents/clearance`, { employeeId, ...data }),

    updateClearanceStatus: (clearanceId, departmentId, status, notes) =>
      axios.put(`${API_BASE}/api/documents/clearance/${clearanceId}/department/${departmentId}`, { status, notes }),

    // بيان الخدمات
    getServiceStatement: (employeeId) =>
      axios.get(`${API_BASE}/api/documents/service-statement/${employeeId}`),

    generateServiceStatement: (employeeId) =>
      axios.post(`${API_BASE}/api/documents/service-statement`, { employeeId }),

    // طباعة الوثائق
    printDocument: (documentType, documentId) =>
      axios.get(`${API_BASE}/api/documents/print/${documentType}/${documentId}`, { responseType: 'blob' }),

    downloadPDF: (documentType, documentId) =>
      axios.get(`${API_BASE}/api/documents/pdf/${documentType}/${documentId}`, { responseType: 'blob' }),
  },

  // ==================== تكامل التزام ====================
  eltizam: {
    // تصدير بيانات الموظفين
    exportEmployees: (filters = {}) =>
      eltizamApi.post('/export/employees', filters),

    // تصدير مسير الرواتب
    exportPayroll: (month, year) =>
      eltizamApi.post('/export/payroll', { month, year }),

    // تصدير الإجازات
    exportVacations: (startDate, endDate) =>
      eltizamApi.post('/export/vacations', { startDate, endDate }),

    // استيراد البيانات من التزام
    importData: (type, data) =>
      eltizamApi.post('/import', { type, data }),

    // مزامنة البيانات
    syncEmployees: () =>
      eltizamApi.post('/sync/employees'),

    syncPayroll: (month, year) =>
      eltizamApi.post('/sync/payroll', { month, year }),

    // التحقق من الاتصال
    checkConnection: () =>
      eltizamApi.get('/health'),

    // سجل العمليات
    getExportHistory: (filters = {}) =>
      eltizamApi.get('/history', { params: filters }),

    // إعادة المحاولة
    retryExport: (exportId) =>
      eltizamApi.post(`/retry/${exportId}`),
  },

  // ==================== تكامل سارف ====================
  sarf: {
    // تصدير مسير الرواتب للبنك
    exportBankFile: (month, year, bankCode) =>
      sarfApi.post('/export/bank-file', { month, year, bankCode }),

    // تصدير ملف التحويلات
    exportTransfers: (month, year) =>
      sarfApi.post('/export/transfers', { month, year }),

    // الحصول على حالة الدفعات
    getPaymentStatus: (batchId) =>
      sarfApi.get(`/payments/${batchId}/status`),

    // قائمة البنوك المعتمدة
    getBanks: () =>
      sarfApi.get('/banks'),

    // سجل التصدير
    getExportHistory: (filters = {}) =>
      sarfApi.get('/history', { params: filters }),

    // تحميل ملف التصدير
    downloadExportFile: (exportId) =>
      sarfApi.get(`/download/${exportId}`, { responseType: 'blob' }),
  },

  // ==================== الإعدادات والترميز ====================
  settings: {
    // البدلات
    getAllowances: () =>
      axios.get(`${API_BASE}/api/settings/allowances`),

    createAllowance: (data) =>
      axios.post(`${API_BASE}/api/settings/allowances`, data),

    updateAllowance: (id, data) =>
      axios.put(`${API_BASE}/api/settings/allowances/${id}`, data),

    deleteAllowance: (id) =>
      axios.delete(`${API_BASE}/api/settings/allowances/${id}`),

    // الاستقطاعات
    getDeductions: () =>
      axios.get(`${API_BASE}/api/settings/deductions`),

    createDeduction: (data) =>
      axios.post(`${API_BASE}/api/settings/deductions`, data),

    updateDeduction: (id, data) =>
      axios.put(`${API_BASE}/api/settings/deductions/${id}`, data),

    deleteDeduction: (id) =>
      axios.delete(`${API_BASE}/api/settings/deductions/${id}`),

    // الكوادر
    getCadres: () =>
      axios.get(`${API_BASE}/api/settings/cadres`),

    createCadre: (data) =>
      axios.post(`${API_BASE}/api/settings/cadres`, data),

    updateCadre: (id, data) =>
      axios.put(`${API_BASE}/api/settings/cadres/${id}`, data),

    deleteCadre: (id) =>
      axios.delete(`${API_BASE}/api/settings/cadres/${id}`),

    // سلم الرواتب
    getSalaryScales: () =>
      axios.get(`${API_BASE}/api/settings/salary-scales`),

    getSalaryScale: (id) =>
      axios.get(`${API_BASE}/api/settings/salary-scales/${id}`),

    createSalaryScale: (data) =>
      axios.post(`${API_BASE}/api/settings/salary-scales`, data),

    updateSalaryScale: (id, data) =>
      axios.put(`${API_BASE}/api/settings/salary-scales/${id}`, data),

    deleteSalaryScale: (id) =>
      axios.delete(`${API_BASE}/api/settings/salary-scales/${id}`),

    // أنواع الإجازات
    getLeaveTypes: () =>
      axios.get(`${API_BASE}/api/settings/leave-types`),

    createLeaveType: (data) =>
      axios.post(`${API_BASE}/api/settings/leave-types`, data),

    updateLeaveType: (id, data) =>
      axios.put(`${API_BASE}/api/settings/leave-types/${id}`, data),

    deleteLeaveType: (id) =>
      axios.delete(`${API_BASE}/api/settings/leave-types/${id}`),

    // حالات الموظفين
    getEmployeeStatuses: () =>
      axios.get(`${API_BASE}/api/settings/employee-statuses`),

    // المؤهلات
    getQualifications: () =>
      axios.get(`${API_BASE}/api/settings/qualifications`),

    // أنواع العقود
    getContractTypes: () =>
      axios.get(`${API_BASE}/api/settings/contract-types`),
  },

  // ==================== الانتداب الخارجي ====================
  missions: {
    getAll: (filters = {}) =>
      axios.get(`${API_BASE}/api/missions`, { params: filters }),

    getById: (id) =>
      axios.get(`${API_BASE}/api/missions/${id}`),

    create: (data) =>
      axios.post(`${API_BASE}/api/missions`, data),

    update: (id, data) =>
      axios.put(`${API_BASE}/api/missions/${id}`, data),

    delete: (id) =>
      axios.delete(`${API_BASE}/api/missions/${id}`),

    approve: (id, notes) =>
      axios.put(`${API_BASE}/api/missions/${id}/approve`, { notes }),

    reject: (id, reason) =>
      axios.put(`${API_BASE}/api/missions/${id}/reject`, { reason }),

    calculateAllowance: (missionData) =>
      axios.post(`${API_BASE}/api/missions/calculate-allowance`, missionData),

    getCountries: () =>
      axios.get(`${API_BASE}/api/missions/countries`),

    getMissionRates: () =>
      axios.get(`${API_BASE}/api/missions/rates`),
  },

  // ==================== القروض والسلف ====================
  loans: {
    getAll: (filters = {}) =>
      axios.get(`${API_BASE}/api/loans`, { params: filters }),

    getById: (id) =>
      axios.get(`${API_BASE}/api/loans/${id}`),

    create: (data) =>
      axios.post(`${API_BASE}/api/loans`, data),

    update: (id, data) =>
      axios.put(`${API_BASE}/api/loans/${id}`, data),

    delete: (id) =>
      axios.delete(`${API_BASE}/api/loans/${id}`),

    approve: (id, installmentAmount) =>
      axios.put(`${API_BASE}/api/loans/${id}/approve`, { installmentAmount }),

    reject: (id, reason) =>
      axios.put(`${API_BASE}/api/loans/${id}/reject`, { reason }),

    getInstallments: (loanId) =>
      axios.get(`${API_BASE}/api/loans/${loanId}/installments`),

    payInstallment: (loanId, installmentId) =>
      axios.post(`${API_BASE}/api/loans/${loanId}/installments/${installmentId}/pay`),

    getEmployeeLoans: (employeeId) =>
      axios.get(`${API_BASE}/api/loans/employee/${employeeId}`),
  },

  // ==================== التقييم والأداء ====================
  evaluations: {
    getAll: (filters = {}) =>
      axios.get(`${API_BASE}/api/evaluations`, { params: filters }),

    getById: (id) =>
      axios.get(`${API_BASE}/api/evaluations/${id}`),

    create: (data) =>
      axios.post(`${API_BASE}/api/evaluations`, data),

    update: (id, data) =>
      axios.put(`${API_BASE}/api/evaluations/${id}`, data),

    submit: (id) =>
      axios.put(`${API_BASE}/api/evaluations/${id}/submit`),

    approve: (id) =>
      axios.put(`${API_BASE}/api/evaluations/${id}/approve`),

    getEmployeeEvaluations: (employeeId) =>
      axios.get(`${API_BASE}/api/evaluations/employee/${employeeId}`),

    getCriteria: () =>
      axios.get(`${API_BASE}/api/evaluations/criteria`),

    getPeriods: () =>
      axios.get(`${API_BASE}/api/evaluations/periods`),
  },

  // ==================== كشوف الرواتب (Payslips + GOSI) ====================
  payslips: {
    getAll: (params = {}) => platformApi.get('/payslips', { params }),
    getById: (id) => platformApi.get(`/payslips/${id}`),
    getLatest: (employeeId) => platformApi.get(`/payslips/latest/${employeeId}`),
    create: (data) => platformApi.post('/payslips', data),
    generateMonthly: (month, year) => platformApi.post('/payslips/generate-monthly', { month, year }),
    calculateGosi: (employeeId) => platformApi.get(`/payslips/gosi/${employeeId}`),
    approve: (id, notes) => platformApi.post(`/payslips/${id}/approve`, { notes }),
    pay: (id, data) => platformApi.post(`/payslips/${id}/pay`, data),
    getMonthlySummary: (month, year) => platformApi.get(`/payslips/summary/${month}/${year}`),
  },

  // ==================== الترقيات ====================
  promotions: {
    getAll: (params = {}) => platformApi.get('/promotions', { params }),
    getById: (id) => platformApi.get(`/promotions/${id}`),
    getPending: () => platformApi.get('/promotions/pending'),
    create: (data) => platformApi.post('/promotions', data),
    approve: (data) => platformApi.post('/promotions/approve', data),
    execute: (id) => platformApi.post(`/promotions/${id}/execute`),
  },

  // ==================== نهاية الخدمة ====================
  endOfService: {
    getAll: (params = {}) => platformApi.get('/endofservice', { params }),
    getById: (id) => platformApi.get(`/endofservice/${id}`),
    calculate: (data) => platformApi.post('/endofservice/calculate', data),
    create: (data) => platformApi.post('/endofservice', data),
    approve: (id) => platformApi.post(`/endofservice/${id}/approve`),
    markPaid: (id, data) => platformApi.post(`/endofservice/${id}/pay`, data),
  },

  // ==================== إخلاء الطرف ====================
  clearance: {
    getAll: (params = {}) => platformApi.get('/clearance', { params }),
    getById: (id) => platformApi.get(`/clearance/${id}`),
    getPending: (department) => platformApi.get('/clearance/pending', { params: { department } }),
    create: (data) => platformApi.post('/clearance', data),
    clearDepartment: (data) => platformApi.post('/clearance/clear', data),
    cancel: (id) => platformApi.post(`/clearance/${id}/cancel`),
  },

  // ==================== تقييم الأداء ====================
  performanceReviews: {
    getAll: (params = {}) => platformApi.get('/performancereviews', { params }),
    getById: (id) => platformApi.get(`/performancereviews/${id}`),
    getPending: (reviewerId) => platformApi.get('/performancereviews/pending', { params: { reviewerId } }),
    create: (data) => platformApi.post('/performancereviews', data),
    update: (id, data) => platformApi.put(`/performancereviews/${id}`, data),
    submit: (id) => platformApi.post(`/performancereviews/${id}/submit`),
    acknowledge: (id, data) => platformApi.post(`/performancereviews/${id}/acknowledge`, data),
    approve: (id) => platformApi.post(`/performancereviews/${id}/approve`),
  },

  // ==================== تغييرات الرواتب ====================
  salaryChanges: {
    getAll: (params = {}) => platformApi.get('/salarychanges', { params }),
    getById: (id) => platformApi.get(`/salarychanges/${id}`),
    getHistory: (employeeId) => platformApi.get(`/salarychanges/history/${employeeId}`),
    create: (data) => platformApi.post('/salarychanges', data),
    approve: (id) => platformApi.post(`/salarychanges/${id}/approve`),
    execute: (id) => platformApi.post(`/salarychanges/${id}/execute`),
  },

  // ==================== أرصدة الإجازات ====================
  leaveBalances: {
    getByEmployee: (employeeId, year) => platformApi.get(`/leavebalances/${employeeId}`, { params: { year } }),
    getBalance: (employeeId, year, leaveType) => platformApi.get(`/leavebalances/${employeeId}/${year}/${leaveType}`),
    initialize: (data) => platformApi.post('/leavebalances/initialize', data),
    recalculate: (data) => platformApi.post('/leavebalances/recalculate', data),
    initializeYear: (year) => platformApi.post('/leavebalances/initialize-year', { year }),
  },

  // ==================== لوحة الحكم ====================
  dashboard: {
    getSummary: () =>
      USE_PLATFORM_API
        ? platformApi.get('/dashboard/summary')
        : axios.get(`${API_BASE}/api/dashboard/summary`),

    getEmployeeStats: () =>
      USE_PLATFORM_API
        ? platformApi.get('/dashboard/employees')
        : axios.get(`${API_BASE}/api/dashboard/employees`),

    getLeaveStats: () =>
      USE_PLATFORM_API
        ? platformApi.get('/dashboard/leaves')
        : axios.get(`${API_BASE}/api/dashboard/leaves`),

    getSalaryStats: () =>
      USE_PLATFORM_API
        ? platformApi.get('/dashboard/salaries')
        : axios.get(`${API_BASE}/api/dashboard/salaries`),

    getAttendanceStats: () =>
      USE_PLATFORM_API
        ? platformApi.get('/dashboard/attendance')
        : axios.get(`${API_BASE}/api/dashboard/attendance`),

    getRecentActivities: (limit = 10) =>
      USE_PLATFORM_API
        ? platformApi.get('/dashboard/activities', { params: { limit } })
        : axios.get(`${API_BASE}/api/dashboard/activities`, { params: { limit } }),

    getPendingRequests: () =>
      USE_PLATFORM_API
        ? platformApi.get('/dashboard/pending')
        : axios.get(`${API_BASE}/api/dashboard/pending`),

    getSystemMetrics: () =>
      USE_PLATFORM_API
        ? platformApi.get('/dashboard/metrics')
        : axios.get(`${API_BASE}/api/dashboard/metrics`),
  },

  // ═══════════════════════════════════════════════════════════
  // Work Shifts - نوبات العمل
  // ═══════════════════════════════════════════════════════════
  shifts: {
    getAll: () => platformApi.get('/shifts'),
    getById: (id) => platformApi.get('/shifts', { params: { id } }),
    create: (data) => platformApi.post('/shifts', data),
    update: (id, data) => platformApi.put('/shifts', { id, ...data }),
    delete: (id) => platformApi.delete('/shifts', { params: { id } }),
    assignDepartment: (data) => platformApi.post('/shifts/assign?type=department', data),
    assignEmployee: (data) => platformApi.post('/shifts/assign?type=employee', data),
    unassignDepartment: (id) => platformApi.delete(`/shifts/assign?type=department&id=${id}`),
    unassignEmployee: (id) => platformApi.delete(`/shifts/assign?type=employee&id=${id}`),
    getDepartmentShifts: (deptId) => platformApi.get('/shifts', { params: { departmentId: deptId } }),
  },

  // ═══════════════════════════════════════════════════════════
  // Biometric Devices - أجهزة البصمة
  // ═══════════════════════════════════════════════════════════
  devices: {
    getAll: () => platformApi.get('/attendance/devices'),
    getById: (id) => platformApi.get('/attendance/devices', { params: { action: 'get', id } }),
    create: (data) => platformApi.post('/attendance/devices', data),
    update: (data) => platformApi.put('/attendance/devices', data),
    delete: (id) => platformApi.delete('/attendance/devices', { params: { id } }),
    testConnection: (id) => platformApi.get('/attendance/devices', { params: { action: 'test', id } }),
    triggerSync: (id) => platformApi.get('/attendance/devices', { params: { action: 'sync', id } }),
    syncAll: () => platformApi.post('/attendance/devices', { action: 'sync-all' }),
    getSyncLogs: (id) => platformApi.get('/attendance/devices', { params: { action: 'logs', id } }),
    getStatus: (id) => platformApi.get('/attendance/devices', { params: { action: 'status', id } }),
  },

  // ═══════════════════════════════════════════════════════════
  // Attendance Reports - تقارير الحضور
  // ═══════════════════════════════════════════════════════════
  attendanceReports: {
    getMonthly: (month, year, departmentId) =>
      platformApi.get('/attendance/reports', { params: { type: 'monthly', month, year, departmentId } }),
    getDepartmentSummary: (departmentId, month, year) =>
      platformApi.get('/attendance/reports', { params: { type: 'department', departmentId, month, year } }),
    getEmployeeReport: (employeeId, month, year) =>
      platformApi.get('/attendance/reports', { params: { type: 'employee', employeeId, month, year } }),
    getLatecomers: (month, year) =>
      platformApi.get('/attendance/reports', { params: { type: 'latecomers', month, year } }),
    getOvertime: (month, year) =>
      platformApi.get('/attendance/reports', { params: { type: 'overtime', month, year } }),
  },
};

export default hrAPI;
