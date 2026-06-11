import React, { useState, useEffect } from 'react';
import { Button, DataTable, Badge } from '../../ui';


export default function EmployeeAttendanceView({ darkMode }) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    // Load employees list
    loadEmployees();
    
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await fetch('/api/hr/employees?pageSize=200');
      if (res.ok) {
        const result = await res.json();
        const empList = result?.data || result?.items || [];
        setEmployees(Array.isArray(empList) ? empList : []);
        return;
      }
    } catch { /* API unavailable */ }
    setEmployees([]);
  };

  const handleViewReport = async () => {
    if (!selectedEmployeeId || !dateFrom || !dateTo) {
      alert('الرجاء اختيار موظف والفترة الزمنية');
      return;
    }

    // Safety: ensure we have employees loaded
    if (!employees || employees.length === 0) {
      await loadEmployees();
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/hr/attendance/monitor/register?from=${dateFrom}&to=${dateTo}&page=1&pageSize=500`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.ok) {
        const result = await res.json();
        const records = (result?.data || [])
          .filter(r => String(r.employeeId) === String(selectedEmployeeId))
          .map(r => ({
            date: r.date,
            dayName: r.date ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][new Date(r.date).getDay()] : '',
            status: r.status,
            checkIn: r.checkIn,
            checkOut: r.checkOut,
            workHours: r.workMinutes ? Math.round(r.workMinutes / 60 * 10) / 10 : 0,
            lateMinutes: r.lateMinutes || 0,
          }));
        const employee = employees.find(e => String(e.id || e.empId) === String(selectedEmployeeId));
        const summary = {
          totalDays: records.length,
          presentDays: records.filter(r => r.status === 'present').length,
          absentDays: records.filter(r => r.status === 'absent').length,
          lateDays: records.filter(r => r.status === 'late').length,
          leaveDays: records.filter(r => r.status === 'on_leave' || r.status === 'leave').length,
          totalWorkHours: Math.round(records.reduce((sum, r) => sum + r.workHours, 0) * 10) / 10,
          totalLateMinutes: records.reduce((sum, r) => sum + r.lateMinutes, 0),
        };
        setEmployeeData({ employee: employee || { id: selectedEmployeeId, arName: 'الموظف المحدد' }, records, summary });
      } else {
        setEmployeeData(null);
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات الحضور:', error);
      setEmployeeData(null);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'date',
      label: 'التاريخ',
      render: (_, row) => row ? (
        <div>
          <div className="font-medium">{row.date || '-'}</div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>{row.dayName || '-'}</div>
        </div>
      ) : '-'
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (_, row) => row ? (
        <Badge color={
          row.status === 'present' ? 'green' :
          row.status === 'late' ? 'yellow' :
          row.status === 'leave' ? 'blue' : 'red'
        }>
          {row.status === 'present' ? 'حاضر' :
           row.status === 'late' ? 'متأخر' :
           row.status === 'leave' ? 'إجازة' : 'غائب'}
        </Badge>
      ) : '-'
    },
    {
      key: 'checkIn',
      label: 'وقت الدخول',
      render: (_, row) => row && row.checkIn ? row.checkIn : '-'
    },
    {
      key: 'checkOut',
      label: 'وقت الخروج',
      render: (_, row) => row && row.checkOut ? row.checkOut : '-'
    },
    {
      key: 'workHours',
      label: 'ساعات العمل',
      render: (_, row) => row ? (
        <span className={`font-bold ${
          row.workHours >= 8 ? 'text-green-600 dark:text-green-400' : 
          row.workHours > 0 ? 'text-yellow-600' : 
          darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {row.workHours > 0 ? `${row.workHours} ساعة` : '-'}
        </span>
      ) : '-'
    },
    {
      key: 'lateMinutes',
      label: 'دقائق التأخير',
      render: (_, row) => row ? (
        <span className={row.lateMinutes > 0 ? 'text-red-600 dark:text-red-400 font-bold' : ''}>
          {row.lateMinutes > 0 ? `${row.lateMinutes} دقيقة` : '-'}
        </span>
      ) : '-'
    }
  ];

  return (
    <div>
      {/* Filters */}
      <div className={`p-4 rounded-xl mb-4 ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              الموظف
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <option value="">اختر موظفاً...</option>
              {employees.map((emp) => (
                <option key={emp.empId} value={emp.empId}>
                  {emp.autoSerial} - {emp.arName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              من تاريخ
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              إلى تاريخ
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleViewReport} disabled={loading}>
            {loading ? 'جاري التحميل...' : 'عرض التقرير'}
          </Button>
        </div>
      </div>

      {/* Results */}
      {employeeData ? (
        <div>
          {/* Employee Info */}
          <div className={`p-4 rounded-xl mb-4 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {employeeData.employee.arName}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}>الرقم الوظيفي: </span>
                <span className="font-medium">{employeeData.employee.autoSerial}</span>
              </div>
              <div>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}>الوظيفة: </span>
                <span className="font-medium">{employeeData.employee.job}</span>
              </div>
              <div>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}>الإدارة: </span>
                <span className="font-medium">{employeeData.employee.management}</span>
              </div>
              <div>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}>القسم: </span>
                <span className="font-medium">{employeeData.employee.department}</span>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50 dark:bg-gray-800'}`}>
              <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>إجمالي الأيام</div>
              <div className="text-xl font-bold">{employeeData.summary.totalDays}</div>
            </div>
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
              <div className={`text-xs mb-1 ${darkMode ? 'text-green-400' : 'text-green-700 dark:text-green-300'}`}>أيام الحضور</div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-green-300' : 'text-green-700 dark:text-green-300'}`}>{employeeData.summary.presentDays}</div>
            </div>
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
              <div className={`text-xs mb-1 ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>أيام التأخير</div>
              <div className="text-xl font-bold text-yellow-600">{employeeData.summary.lateDays}</div>
            </div>
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <div className={`text-xs mb-1 ${darkMode ? 'text-red-400' : 'text-red-700 dark:text-red-300'}`}>أيام الغياب</div>
              <div className="text-xl font-bold text-red-600 dark:text-red-400">{employeeData.summary.absentDays}</div>
            </div>
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
              <div className={`text-xs mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-700 dark:text-blue-300'}`}>أيام الإجازة</div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{employeeData.summary.leaveDays}</div>
            </div>
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-purple-900/20' : 'bg-purple-50 dark:bg-purple-900/20'}`}>
              <div className={`text-xs mb-1 ${darkMode ? 'text-purple-400' : 'text-purple-700 dark:text-purple-300'}`}>إجمالي الساعات</div>
              <div className="text-xl font-bold text-purple-600">{employeeData.summary.totalWorkHours}</div>
            </div>
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-orange-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
              <div className={`text-xs mb-1 ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>دقائق التأخير</div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>{employeeData.summary.totalLateMinutes}</div>
            </div>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={employeeData.records}
            darkMode={darkMode}
            emptyMessage="لا توجد سجلات في الفترة المحددة"
          />
        </div>
      ) : (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
          <svg className={`mx-auto w-16 h-16 mb-4 ${darkMode ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-lg font-medium">اختر موظفاً لعرض سجل حضوره</p>
          <p className="text-sm mt-2">قم باختيار موظف والفترة الزمنية لعرض تقرير الحضور التفصيلي</p>
        </div>
      )}
    </div>
  );
}
