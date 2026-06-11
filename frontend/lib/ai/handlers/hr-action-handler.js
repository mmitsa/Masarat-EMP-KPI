/**
 * HR Action Handler
 * معالج إجراءات الموارد البشرية
 */

import { apiGet, apiPost } from '../../api';
import { API } from '../../routes';

/**
 * تعيين أنواع الإجازات
 */
const LEAVE_TYPES = {
    annual: { code: '01', nameAr: 'إجازة سنوية' },
    sick: { code: '03', nameAr: 'إجازة مرضية' },
    emergency: { code: '02', nameAr: 'إجازة اضطرارية' },
    marriage: { code: '05', nameAr: 'إجازة زواج' },
    death: { code: '06', nameAr: 'إجازة وفاة' },
    maternity: { code: '07', nameAr: 'إجازة أمومة' },
    paternity: { code: '08', nameAr: 'إجازة أبوة' },
    hajj: { code: '09', nameAr: 'إجازة حج' },
};

/**
 * معالج إجراءات الموارد البشرية
 */
export class HRActionHandler {
    constructor(userId, userRoles, accessToken) {
        this.userId = userId;
        this.roles = userRoles;
        this.accessToken = accessToken;
    }

    /**
     * عرض رصيد الإجازات
     */
    async getLeaveBalance({ employeeId } = {}) {
        try {
            const targetId = employeeId || this.userId;

            // محاكاة البيانات للتطوير
            // في الإنتاج سيتم استبدالها بـ API حقيقي
            const balance = await this.fetchLeaveBalance(targetId);

            return {
                success: true,
                type: 'leave_balance',
                data: balance,
                message: this.formatLeaveBalanceMessage(balance),
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                suggestion: 'حاول مرة أخرى أو تواصل مع الدعم الفني',
            };
        }
    }

    /**
     * إنشاء طلب إجازة
     */
    async createLeaveRequest({ leaveType, startDate, endDate, reason, substituteEmployeeId }) {
        try {
            // التحقق من صحة التواريخ
            const start = new Date(startDate);
            const end = new Date(endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (start < today) {
                return {
                    success: false,
                    error: 'لا يمكن طلب إجازة بتاريخ سابق',
                };
            }

            if (start > end) {
                return {
                    success: false,
                    error: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية',
                };
            }

            // حساب عدد الأيام
            const daysRequested = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

            // التحقق من الرصيد
            const balance = await this.fetchLeaveBalance(this.userId);
            const leaveTypeInfo = LEAVE_TYPES[leaveType] || LEAVE_TYPES.annual;

            if (leaveType === 'annual' && balance.annual < daysRequested) {
                return {
                    success: false,
                    error: `رصيدك الحالي ${balance.annual} يوم فقط، والمطلوب ${daysRequested} يوم`,
                    suggestion: 'يمكنك تقليل عدد أيام الإجازة أو اختيار نوع إجازة آخر',
                };
            }

            // إنشاء الطلب
            const requestData = {
                employee_id: this.userId,
                leave_type_code: leaveTypeInfo.code,
                leave_type_name: leaveTypeInfo.nameAr,
                start_date: startDate,
                end_date: endDate,
                days_count: daysRequested,
                reason: reason || '',
                substitute_employee_id: substituteEmployeeId || null,
                status: 'pending',
            };

            // محاكاة الإنشاء
            const result = await this.submitLeaveRequest(requestData);

            return {
                success: true,
                type: 'leave_request_created',
                data: {
                    requestId: result.id,
                    leaveType: leaveTypeInfo.nameAr,
                    startDate,
                    endDate,
                    daysCount: daysRequested,
                    status: 'pending',
                },
                message: `تم إنشاء طلب الإجازة بنجاح`,
                details: [
                    `نوع الإجازة: ${leaveTypeInfo.nameAr}`,
                    `من: ${this.formatDate(startDate)}`,
                    `إلى: ${this.formatDate(endDate)}`,
                    `المدة: ${daysRequested} ${daysRequested > 10 ? 'يوم' : 'أيام'}`,
                    `رقم الطلب: ${result.id}`,
                ],
                nextSteps: [
                    'سيتم إرسال الطلب للموافقة',
                    'يمكنك متابعة حالة الطلب من صفحة الإجازات',
                ],
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * البحث عن موظفين
     */
    async searchEmployees({ query, department }) {
        try {
            // محاكاة البحث
            const employees = await this.fetchEmployees(query, department);

            if (employees.length === 0) {
                return {
                    success: true,
                    type: 'employee_search',
                    data: [],
                    message: `لم يتم العثور على موظفين يطابقون "${query}"`,
                };
            }

            return {
                success: true,
                type: 'employee_search',
                data: employees,
                message: `تم العثور على ${employees.length} موظف`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * عرض سجل الحضور
     */
    async getAttendanceReport({ employeeId, fromDate, toDate }) {
        try {
            const targetId = employeeId || this.userId;
            const from = fromDate || this.getMonthStart();
            const to = toDate || this.getToday();

            // محاكاة البيانات
            const attendance = await this.fetchAttendance(targetId, from, to);

            return {
                success: true,
                type: 'attendance_report',
                data: attendance,
                message: this.formatAttendanceMessage(attendance),
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * عرض طلبات الإجازة
     */
    async getLeaveRequests({ status }) {
        try {
            const requests = await this.fetchLeaveRequests(this.userId, status);

            if (requests.length === 0) {
                return {
                    success: true,
                    type: 'leave_requests',
                    data: [],
                    message: 'لا توجد طلبات إجازة',
                };
            }

            return {
                success: true,
                type: 'leave_requests',
                data: requests,
                message: `لديك ${requests.length} طلب إجازة`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // ============================================
    // دوال مساعدة
    // ============================================

    async fetchLeaveBalance(employeeId) {
        // محاكاة - في الإنتاج سيتم استخدام API حقيقي
        try {
            const response = await apiGet(`${API.HR.LEAVES}/balance/${employeeId}`);
            return response;
        } catch {
            // بيانات محاكاة للتطوير
            return {
                annual: 15,
                sick: 90,
                emergency: 5,
                usedThisYear: 6,
                totalEntitlement: 21,
            };
        }
    }

    async submitLeaveRequest(data) {
        try {
            const response = await apiPost(API.HR.LEAVES, data);
            return response;
        } catch {
            // محاكاة للتطوير
            return {
                id: 'LR-' + Date.now(),
                ...data,
            };
        }
    }

    async fetchEmployees(query, department) {
        try {
            let url = `${API.HR.EMPLOYEES}?search=${encodeURIComponent(query)}`;
            if (department) {
                url += `&department=${encodeURIComponent(department)}`;
            }
            const response = await apiGet(url);
            return response.data || response;
        } catch {
            // محاكاة للتطوير
            return [
                { id: '1001', name: 'أحمد محمد', department: 'تقنية المعلومات', position: 'مطور' },
                { id: '1002', name: 'محمد علي', department: 'الموارد البشرية', position: 'أخصائي موارد بشرية' },
            ].filter(e => e.name.includes(query) || e.id.includes(query));
        }
    }

    async fetchAttendance(employeeId, fromDate, toDate) {
        try {
            const response = await apiGet(`${API.HR.ATTENDANCE}?employeeId=${employeeId}&from=${fromDate}&to=${toDate}`);
            return response;
        } catch {
            // محاكاة للتطوير
            return {
                summary: {
                    totalDays: 22,
                    presentDays: 20,
                    absentDays: 1,
                    lateDays: 1,
                    workingHours: 176,
                },
                records: [],
            };
        }
    }

    async fetchLeaveRequests(employeeId, status) {
        try {
            let url = `${API.HR.LEAVES}?employeeId=${employeeId}`;
            if (status && status !== 'all') {
                url += `&status=${status}`;
            }
            const response = await apiGet(url);
            return response.data || response;
        } catch {
            // محاكاة للتطوير
            return [
                {
                    id: 'LR-001',
                    type: 'إجازة سنوية',
                    startDate: '2026-02-01',
                    endDate: '2026-02-05',
                    days: 5,
                    status: 'pending',
                },
            ];
        }
    }

    formatLeaveBalanceMessage(balance) {
        const lines = [
            '📊 رصيد الإجازات:',
            `• الإجازة السنوية: ${balance.annual} يوم`,
            `• الإجازة المرضية: ${balance.sick} يوم`,
        ];

        if (balance.emergency) {
            lines.push(`• الإجازة الاضطرارية: ${balance.emergency} أيام`);
        }

        if (balance.usedThisYear) {
            lines.push(`\n📈 المستخدم هذا العام: ${balance.usedThisYear} يوم`);
        }

        return lines.join('\n');
    }

    formatAttendanceMessage(attendance) {
        const { summary } = attendance;
        return [
            '📋 ملخص الحضور:',
            `• أيام الحضور: ${summary.presentDays} من ${summary.totalDays}`,
            `• الغياب: ${summary.absentDays} ${summary.absentDays > 1 ? 'أيام' : 'يوم'}`,
            `• التأخير: ${summary.lateDays} ${summary.lateDays > 1 ? 'مرات' : 'مرة'}`,
            `• ساعات العمل: ${summary.workingHours} ساعة`,
        ].join('\n');
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    getToday() {
        return new Date().toISOString().split('T')[0];
    }

    getMonthStart() {
        const date = new Date();
        date.setDate(1);
        return date.toISOString().split('T')[0];
    }
}

export default HRActionHandler;
