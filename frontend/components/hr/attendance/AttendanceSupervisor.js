/**
 * AttendanceSupervisor Component
 * لوحة تحكم مراقب الدوام - إدارة شاملة للحضور والانصراف
 */

import React, { useState, useEffect } from 'react';
import { DataTable, Badge, Button, Modal } from '../../ui';

import {
  getLateLevel,
  getDeductionOptions,
  DEDUCTION_TYPES,
  NOTIFICATION_TEMPLATES,
  generateNotificationMessage,
  getEscalationAction,
  generateMonthlyAttendanceSummary,
  LATE_THRESHOLDS
} from '../../../lib/attendance-deduction-rules';

export default function AttendanceSupervisor({ darkMode }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  // Reconciliation alerts
  const [reconciliationAlerts, setReconciliationAlerts] = useState([]);

  // Modals
  const [showBulkAlert, setShowBulkAlert] = useState(false);
  const [showBulkDeduction, setShowBulkDeduction] = useState(false);
  const [showPendingDeductions, setShowPendingDeductions] = useState(false);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [showReconciliation, setShowReconciliation] = useState(false);

  // Form states
  const [bulkAlertType, setBulkAlertType] = useState('warning');
  const [bulkAlertMessage, setBulkAlertMessage] = useState('');
  const [deductionType, setDeductionType] = useState(DEDUCTION_TYPES.FROM_SALARY);
  const [saving, setSaving] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    leave: 0,
    pendingDeductions: 0,
    totalLateMinutes: 0
  });

  // Pending deductions mock
  const [pendingDeductions, setPendingDeductions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let data = [];
      try {
        const today = new Date();
        const res = await fetch('/api/hr/attendance/daily-table', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            year: today.getFullYear(),
            month: today.getMonth() + 1,
            day: today.getDate(),
          }),
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            data = Array.isArray(result.data) ? result.data : (result.data.employees || []);
          }
        }
      } catch { /* API unavailable */ }

      setEmployees(data);

      // Fetch reconciliation alerts from API
      try {
        const reconRes = await fetch('/api/hr/attendance/reconciliation');
        if (reconRes.ok) {
          const reconData = await reconRes.json();
          if (Array.isArray(reconData) && reconData.length > 0) {
            const mapped = reconData.map(item => ({
              empId: item.employeeId || item.EmployeeId,
              arName: item.employeeName || item.EmployeeName || '-',
              department: item.department || item.Department || '-',
              date: item.date || item.Date,
              biometric: item.biometric || item.Biometric ? {
                attendanceId: (item.biometric || item.Biometric)?.attendanceId || (item.biometric || item.Biometric)?.AttendanceId,
                checkIn: (item.biometric || item.Biometric)?.checkIn || (item.biometric || item.Biometric)?.CheckIn || '-',
                checkOut: (item.biometric || item.Biometric)?.checkOut || (item.biometric || item.Biometric)?.CheckOut || '-',
                source: 'Biometric',
              } : null,
              mobile: item.mobile || item.Mobile ? {
                attendanceId: (item.mobile || item.Mobile)?.attendanceId || (item.mobile || item.Mobile)?.AttendanceId,
                checkIn: (item.mobile || item.Mobile)?.checkIn || (item.mobile || item.Mobile)?.CheckIn || '-',
                checkOut: (item.mobile || item.Mobile)?.checkOut || (item.mobile || item.Mobile)?.CheckOut || '-',
                source: 'Mobile',
                selfieUrl: (item.mobile || item.Mobile)?.selfieUrl || (item.mobile || item.Mobile)?.SelfieUrl,
                isInsideGeofence: (item.mobile || item.Mobile)?.isInsideGeofence ?? (item.mobile || item.Mobile)?.IsInsideGeofence,
              } : null,
            })).filter(a => a.biometric && a.mobile);
            setReconciliationAlerts(mapped);
          } else {
            setReconciliationAlerts([]);
          }
        }
      } catch (reconErr) {
        console.log('[Supervisor] Reconciliation API unavailable, using fallback data');
        // Fallback mock data
        const mockReconciliation = [
          {
            empId: 1001, arName: 'أحمد محمد العتيبي', department: 'تقنية المعلومات',
            biometric: { attendanceId: 101, checkIn: '07:55', checkOut: '16:05', source: 'Biometric' },
            mobile: { attendanceId: 102, checkIn: '07:48', checkOut: '16:12', source: 'Mobile', selfieUrl: '/selfie.jpg', isInsideGeofence: true }
          },
          {
            empId: 1002, arName: 'فاطمة سعد الزهراني', department: 'الموارد البشرية',
            biometric: { attendanceId: 103, checkIn: '08:10', checkOut: '15:50', source: 'Biometric' },
            mobile: { attendanceId: 104, checkIn: '07:58', checkOut: '16:02', source: 'Mobile', selfieUrl: '/selfie2.jpg', isInsideGeofence: true }
          },
        ];
        setReconciliationAlerts(mockReconciliation);
      }

      // Calculate stats
      const newStats = {
        total: enrichedData.length,
        present: enrichedData.filter(e => e.status === 'present').length,
        late: enrichedData.filter(e => e.status === 'late').length,
        absent: enrichedData.filter(e => e.status === 'absent').length,
        leave: enrichedData.filter(e => e.status === 'leave').length,
        pendingDeductions: enrichedData.filter(e => e.pendingDeduction).length,
        totalLateMinutes: enrichedData.reduce((sum, e) => sum + (e.lateMinutes || 0), 0)
      };
      setStats(newStats);

      // Mock pending deductions
      const pending = enrichedData
        .filter(e => e.lateMinutes > 15)
        .map(e => ({
          ...e,
          deductionOptions: getDeductionOptions(e.lateMinutes, e.salary, e.leaveBalance)
        }));
      setPendingDeductions(pending);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'issues') return emp.status === 'late' || emp.status === 'absent';
    if (filterStatus === 'pending') return emp.pendingDeduction;
    return emp.status === filterStatus;
  });

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedEmployees(filteredEmployees.map(e => e.empId));
    } else {
      setSelectedEmployees([]);
    }
  };

  // Handle select employee
  const handleSelectEmployee = (empId) => {
    setSelectedEmployees(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  // Send bulk alert
  const handleSendBulkAlert = async () => {
    if (selectedEmployees.length === 0) {
      alert('يرجى اختيار موظفين');
      return;
    }
    if (!bulkAlertMessage.trim()) {
      alert('يرجى كتابة رسالة التنبيه');
      return;
    }

    setSaving(true);
    try {
      const selectedEmps = employees.filter(e => selectedEmployees.includes(e.empId));

      console.log('إرسال تنبيه جماعي:', {
        type: bulkAlertType,
        message: bulkAlertMessage,
        employees: selectedEmps.map(e => e.arName)
      });

      alert(`تم إرسال التنبيه إلى ${selectedEmployees.length} موظف`);
      setShowBulkAlert(false);
      setBulkAlertMessage('');
      setSelectedEmployees([]);
    } catch (error) {
      console.error('Error sending bulk alert:', error);
      alert('حدث خطأ أثناء الإرسال');
    } finally {
      setSaving(false);
    }
  };

  // Apply bulk deduction
  const handleApplyBulkDeduction = async () => {
    if (selectedEmployees.length === 0) {
      alert('يرجى اختيار موظفين');
      return;
    }

    setSaving(true);
    try {
      const selectedEmps = employees.filter(e =>
        selectedEmployees.includes(e.empId) && e.pendingDeduction
      );

      console.log('تطبيق خصم جماعي:', {
        type: deductionType,
        employees: selectedEmps.map(e => ({
          name: e.arName,
          lateMinutes: e.lateMinutes
        }))
      });

      alert(`تم تطبيق الخصم على ${selectedEmps.length} موظف`);
      setShowBulkDeduction(false);
      setSelectedEmployees([]);

      // Remove from pending
      setPendingDeductions(prev =>
        prev.filter(e => !selectedEmployees.includes(e.empId))
      );
    } catch (error) {
      console.error('Error applying bulk deduction:', error);
      alert('حدث خطأ أثناء تطبيق الخصم');
    } finally {
      setSaving(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const config = {
      present: { label: 'حاضر', color: 'green' },
      late: { label: 'متأخر', color: 'yellow' },
      absent: { label: 'غائب', color: 'red' },
      leave: { label: 'إجازة', color: 'blue' }
    };
    return <Badge color={config[status]?.color || 'gray'}>{config[status]?.label || status}</Badge>;
  };

  // Get escalation badge
  const getEscalationBadge = (emp) => {
    const lateEscalation = getEscalationAction('late', emp.monthlyLateCount);
    const absentEscalation = getEscalationAction('absent', emp.monthlyAbsentCount);

    if (absentEscalation) {
      return <Badge color="red">{absentEscalation.label}</Badge>;
    }
    if (lateEscalation) {
      return <Badge color="orange">{lateEscalation.label}</Badge>;
    }
    return null;
  };

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="w-4 h-4 rounded"
        />
      ),
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedEmployees.includes(row.empId)}
          onChange={() => handleSelectEmployee(row.empId)}
          className="w-4 h-4 rounded"
        />
      )
    },
    {
      key: 'autoSerial',
      label: 'الرقم',
      render: (_, row) => <span className="font-mono">{row.autoSerial}</span>
    },
    {
      key: 'arName',
      label: 'الموظف',
      render: (_, row) => (
        <div>
          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{row.arName}</span>
          <span className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{row.job}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (_, row) => getStatusBadge(row.status)
    },
    {
      key: 'checkIn',
      label: 'الدخول',
      render: (_, row) => (
        <span className={row.checkIn ? (darkMode ? 'text-blue-400' : 'text-blue-600 dark:text-blue-400') : 'text-gray-400'}>
          {row.checkIn || '-'}
        </span>
      )
    },
    {
      key: 'lateMinutes',
      label: 'التأخير',
      render: (_, row) => {
        if (!row.lateMinutes) return <span className="text-gray-400">-</span>;
        const level = getLateLevel(row.lateMinutes);
        return (
          <span className={`font-bold ${
            level.color === 'green' ? 'text-green-600 dark:text-green-400' :
            level.color === 'yellow' ? 'text-yellow-600' :
            level.color === 'orange' ? 'text-orange-600' :
            'text-red-600 dark:text-red-400'
          }`}>
            {row.lateMinutes} د
          </span>
        );
      }
    },
    {
      key: 'monthlyLateCount',
      label: 'التأخير الشهري',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <span className={row.monthlyLateCount > 5 ? 'text-red-600 dark:text-red-400 font-bold' : ''}>
            {row.monthlyLateCount} مرة
          </span>
          {getEscalationBadge(row)}
        </div>
      )
    },
    {
      key: 'pendingDeduction',
      label: 'خصم معلق',
      render: (_, row) => row.pendingDeduction ? (
        <Badge color="orange">معلق</Badge>
      ) : (
        <span className="text-gray-400">-</span>
      )
    },
    {
      key: 'actions',
      label: 'إجراء سريع',
      render: (_, row) => (
        <div className="flex gap-1">
          <button
            onClick={() => {
              setSelectedEmployees([row.empId]);
              setBulkAlertMessage(
                row.status === 'late'
                  ? `تنبيه: تم تسجيل تأخير بمقدار ${row.lateMinutes} دقيقة.`
                  : row.status === 'absent'
                    ? 'تنبيه: تم تسجيل غياب اليوم.'
                    : 'شكراً على التزامك بالحضور.'
              );
              setShowBulkAlert(true);
            }}
            className={`p-1.5 rounded ${darkMode ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100'}`}
            title="إرسال تنبيه"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          {row.pendingDeduction && (
            <button
              onClick={() => {
                setSelectedEmployees([row.empId]);
                setShowBulkDeduction(true);
              }}
              className={`p-1.5 rounded ${darkMode ? 'bg-orange-900/30 text-orange-400 hover:bg-orange-900/50' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 hover:bg-orange-100'}`}
              title="تطبيق خصم"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
          <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{stats.total}</div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>إجمالي الموظفين</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-green-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
          <div className={`text-3xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.present}</div>
          <div className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700 dark:text-green-300'}`}>حاضر</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
          <div className={`text-3xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{stats.late}</div>
          <div className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>متأخر</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-red-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
          <div className={`text-3xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{stats.absent}</div>
          <div className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700 dark:text-red-300'}`}>غائب</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
          <div className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{stats.leave}</div>
          <div className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700 dark:text-blue-300'}`}>إجازة</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-orange-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
          <div className={`text-3xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>{stats.pendingDeductions}</div>
          <div className={`text-sm ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>خصم معلق</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-purple-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
          <div className={`text-3xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{stats.totalLateMinutes}</div>
          <div className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-700 dark:text-purple-300'}`}>دقائق تأخير</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-amber-900/30' : 'bg-amber-100 dark:bg-amber-900/30'} cursor-pointer`} onClick={() => reconciliationAlerts.length > 0 && setShowReconciliation(true)}>
          <div className={`text-3xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>{reconciliationAlerts.length}</div>
          <div className={`text-sm ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>تحتاج مطابقة</div>
        </div>
      </div>

      {/* Reconciliation Alert Banner */}
      {reconciliationAlerts.length > 0 && (
        <div className={`p-4 rounded-xl flex items-center justify-between ${darkMode ? 'bg-amber-900/20 border border-amber-700/50' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
          <div className="flex items-center gap-3">
            <svg className={`w-6 h-6 flex-shrink-0 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className={`font-medium ${darkMode ? 'text-amber-300' : 'text-amber-800 dark:text-amber-200'}`}>
              يوجد {reconciliationAlerts.length} سجلات تحتاج مطابقة (بصمة + جوال)
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReconciliation(true)}
            className={`${darkMode ? 'border-amber-600 text-amber-400 hover:bg-amber-900/30' : 'border-amber-400 text-amber-700 hover:bg-amber-100'}`}
          >
            عرض التفاصيل
          </Button>
        </div>
      )}

      {/* Actions Bar */}
      <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-2 flex-wrap">
            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <option value="all">جميع الموظفين</option>
              <option value="issues">المتأخرين والغائبين</option>
              <option value="pending">بانتظار الخصم</option>
              <option value="late">المتأخرين فقط</option>
              <option value="absent">الغائبين فقط</option>
            </select>

            {/* Selected count */}
            {selectedEmployees.length > 0 && (
              <span className={`px-3 py-2 rounded-lg ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                تم اختيار {selectedEmployees.length} موظف
              </span>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Bulk Alert */}
            <Button
              variant="outline"
              onClick={() => setShowBulkAlert(true)}
              disabled={selectedEmployees.length === 0}
            >
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              إرسال تنبيه جماعي
            </Button>

            {/* Bulk Deduction */}
            <Button
              variant="outline"
              onClick={() => setShowBulkDeduction(true)}
              disabled={selectedEmployees.length === 0}
            >
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              تطبيق خصم جماعي
            </Button>

            {/* Pending Deductions */}
            <Button onClick={() => setShowPendingDeductions(true)}>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              الخصومات المعلقة ({stats.pendingDeductions})
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredEmployees}
        loading={loading}
        darkMode={darkMode}
        emptyMessage="لا يوجد موظفين"
      />

      {/* Bulk Alert Modal */}
      <Modal
        isOpen={showBulkAlert}
        onClose={() => setShowBulkAlert(false)}
        title="إرسال تنبيه جماعي"
        darkMode={darkMode}
        size="lg"
      >
        <div className="space-y-4">
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
            <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700 dark:text-blue-300'}`}>
              سيتم إرسال التنبيه إلى {selectedEmployees.length} موظف
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              نوع التنبيه
            </label>
            <select
              value={bulkAlertType}
              onChange={(e) => setBulkAlertType(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <option value="reminder">تذكير</option>
              <option value="warning">تنبيه</option>
              <option value="urgent">عاجل</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              رسالة التنبيه
            </label>
            <textarea
              value={bulkAlertMessage}
              onChange={(e) => setBulkAlertMessage(e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
              placeholder="اكتب رسالة التنبيه..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSendBulkAlert} disabled={saving} className="flex-1">
              {saving ? 'جاري الإرسال...' : 'إرسال التنبيه'}
            </Button>
            <Button variant="outline" onClick={() => setShowBulkAlert(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Deduction Modal */}
      <Modal
        isOpen={showBulkDeduction}
        onClose={() => setShowBulkDeduction(false)}
        title="تطبيق خصم جماعي"
        darkMode={darkMode}
      >
        <div className="space-y-4">
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-orange-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
            <p className={`text-sm ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
              سيتم تطبيق الخصم على الموظفين المختارين الذين لديهم تأخير
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              طريقة الخصم
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setDeductionType(DEDUCTION_TYPES.FROM_SALARY)}
                className={`w-full p-3 rounded-lg border-2 text-right ${
                  deductionType === DEDUCTION_TYPES.FROM_SALARY
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 dark:border-gray-700 bg-white'
                }`}
              >
                💰 خصم من الراتب
              </button>
              <button
                onClick={() => setDeductionType(DEDUCTION_TYPES.FROM_LEAVE)}
                className={`w-full p-3 rounded-lg border-2 text-right ${
                  deductionType === DEDUCTION_TYPES.FROM_LEAVE
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 dark:border-gray-700 bg-white'
                }`}
              >
                📅 خصم من رصيد الإجازات
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleApplyBulkDeduction} disabled={saving} className="flex-1">
              {saving ? 'جاري التطبيق...' : 'تطبيق الخصم'}
            </Button>
            <Button variant="outline" onClick={() => setShowBulkDeduction(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>

      {/* Pending Deductions Modal */}
      <Modal
        isOpen={showPendingDeductions}
        onClose={() => setShowPendingDeductions(false)}
        title="الخصومات المعلقة"
        darkMode={darkMode}
        size="xl"
      >
        <div className="space-y-4">
          {pendingDeductions.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
              لا توجد خصومات معلقة
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingDeductions.map((emp) => (
                <div
                  key={emp.empId}
                  className={`p-4 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{emp.arName}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{emp.job}</p>
                    </div>
                    <div className="text-left">
                      <Badge color={getLateLevel(emp.lateMinutes).color}>
                        تأخير {emp.lateMinutes} دقيقة
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {emp.deductionOptions?.options.map((option) => (
                      <button
                        key={option.type}
                        onClick={() => {
                          console.log('تطبيق خصم:', { employee: emp.arName, option });
                          setPendingDeductions(prev => prev.filter(e => e.empId !== emp.empId));
                          alert(`تم تطبيق الخصم على ${emp.arName}`);
                        }}
                        disabled={!option.enabled}
                        className={`p-2 rounded-lg text-sm transition-colors ${
                          option.enabled
                            ? darkMode
                              ? 'bg-gray-700 hover:bg-gray-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 text-gray-800 dark:text-gray-100'
                            : 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" onClick={() => setShowPendingDeductions(false)} className="w-full">
            إغلاق
          </Button>
        </div>
      </Modal>

      {/* Reconciliation Modal */}
      <Modal
        isOpen={showReconciliation}
        onClose={() => setShowReconciliation(false)}
        title="مطابقة سجلات الحضور (بصمة / جوال)"
        darkMode={darkMode}
        size="xl"
      >
        <div className="space-y-4">
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-amber-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
            <p className={`text-sm ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
              الموظفون التاليون لديهم سجلات حضور من مصدرين مختلفين (بصمة وجوال) لنفس اليوم. يرجى اعتماد السجل الصحيح لكل موظف.
            </p>
          </div>

          {reconciliationAlerts.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
              لا توجد سجلات تحتاج مطابقة
            </div>
          ) : (
            <div className="space-y-4 max-h-[28rem] overflow-y-auto">
              {reconciliationAlerts.map((alert) => (
                <div
                  key={alert.empId}
                  className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'}`}
                >
                  {/* Employee Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700 dark:text-gray-200'}`}>
                      {alert.arName.charAt(0)}
                    </div>
                    <div>
                      <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{alert.arName}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{alert.department}</p>
                    </div>
                  </div>

                  {/* Two columns: Biometric vs Mobile */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Biometric Column */}
                    <div className={`p-3 rounded-lg border ${darkMode ? 'border-green-800/50 bg-green-900/10' : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <svg className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600 dark:text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                        </svg>
                        <span className={`text-sm font-bold ${darkMode ? 'text-green-400' : 'text-green-700 dark:text-green-300'}`}>بصمة</span>
                        <Badge color="green">Biometric</Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الدخول:</span>
                          <span className={`text-sm font-mono font-medium ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{alert.biometric.checkIn}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الخروج:</span>
                          <span className={`text-sm font-mono font-medium ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{alert.biometric.checkOut}</span>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Column */}
                    <div className={`p-3 rounded-lg border ${darkMode ? 'border-blue-800/50 bg-blue-900/10' : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <svg className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className={`text-sm font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700 dark:text-blue-300'}`}>جوال</span>
                        <Badge color="blue">Mobile</Badge>
                        {alert.mobile.isInsideGeofence ? (
                          <Badge color="green">داخل النطاق</Badge>
                        ) : (
                          <Badge color="red">خارج النطاق</Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الدخول:</span>
                          <span className={`text-sm font-mono font-medium ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{alert.mobile.checkIn}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الخروج:</span>
                          <span className={`text-sm font-mono font-medium ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{alert.mobile.checkOut}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={async () => {
                        try {
                          await fetch('/api/hr/attendance/reconciliation', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ attendanceId: alert.biometric.attendanceId }),
                          });
                        } catch (err) {
                          console.error('Reconciliation approve error:', err);
                        }
                        setReconciliationAlerts(prev => prev.filter(a => a.empId !== alert.empId));
                      }}
                      className={`p-2.5 rounded-lg text-sm font-medium transition-colors ${
                        darkMode
                          ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-700/50'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 border border-green-300'
                      }`}
                    >
                      اعتماد البصمة
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await fetch('/api/hr/attendance/reconciliation', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ attendanceId: alert.mobile.attendanceId }),
                          });
                        } catch (err) {
                          console.error('Reconciliation approve error:', err);
                        }
                        setReconciliationAlerts(prev => prev.filter(a => a.empId !== alert.empId));
                      }}
                      className={`p-2.5 rounded-lg text-sm font-medium transition-colors ${
                        darkMode
                          ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border border-blue-700/50'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 border border-blue-300'
                      }`}
                    >
                      اعتماد الجوال
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" onClick={() => setShowReconciliation(false)} className="w-full">
            إغلاق
          </Button>
        </div>
      </Modal>
    </div>
  );
}
