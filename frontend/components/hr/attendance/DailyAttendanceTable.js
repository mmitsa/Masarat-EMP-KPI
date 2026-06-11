import React, { useState, useEffect } from 'react';
import { DataTable, Badge, Button, SearchInput } from '../../ui';

import AttendanceActions from './AttendanceActions';

export default function DailyAttendanceTable({ darkMode }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    employees: [],
    summary: {}
  });
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    managementId: 0,
    contracts: [],
    showPresentOnly: false
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let employees = null;

      // Try fetching from real backend API first
      try {
        const dateStr = `${filters.year}-${String(filters.month).padStart(2, '0')}-${String(filters.day).padStart(2, '0')}`;
        const res = await fetch(`/api/hr/attendance/daily-table`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            year: filters.year,
            month: filters.month,
            day: filters.day,
            managementId: filters.managementId,
            showPresentOnly: filters.showPresentOnly
          }),
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            const rawEmps = Array.isArray(result.data) ? result.data : (result.data.employees || []);
            if (rawEmps.length > 0) {
              employees = rawEmps.map(item => ({
                empId: item.empId || item.id || item.Id,
                autoSerial: item.autoSerial || item.employeeNationalId || item.EmployeeNationalId || '-',
                arName: item.arName || item.employeeName || item.EmployeeName || '-',
                job: item.job || item.jobTitle || '-',
                management: item.management || item.departmentName || '-',
                status: (item.status || item.statusName || 'present').toLowerCase(),
                source: item.source || item.Source || 'Manual',
                hasMultipleSources: item.hasMultipleSources || (item.reconciliationStatus === 'PendingReview'),
                checkIn: item.checkIn || (item.checkInTime ? item.checkInTime.substring(0, 5) : null),
                checkOut: item.checkOut || (item.checkOutTime ? item.checkOutTime.substring(0, 5) : null),
                workHours: item.workHours || null,
                lateMinutes: item.lateMinutes || item.LateMinutes || 0,
              }));
            }
          }
        }
      } catch (apiError) {
        console.log('[DailyTable] Backend unavailable');
      }

      if (!employees) {
        employees = [];
      }

      // Calculate summary
      const summary = {
        total: employees.length,
        present: employees.filter(e => e.status === 'present').length,
        absent: employees.filter(e => e.status === 'absent').length,
        late: employees.filter(e => e.status === 'late').length,
        onLeave: employees.filter(e => e.status === 'leave').length
      };

      // Apply filters
      let filtered = [...employees];

      if (filters.showPresentOnly) {
        filtered = filtered.filter(e => e.status === 'present' || e.status === 'late');
      }

      setData({
        employees: filtered,
        summary: summary
      });
    } catch (error) {
      console.error('Error fetching daily attendance:', error);
      setData({ employees: [], summary: {} });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      present: { label: 'حاضر', color: 'green' },
      absent: { label: 'غائب', color: 'red' },
      late: { label: 'متأخر', color: 'yellow' },
      leave: { label: 'إجازة', color: 'blue' },
      halfDay: { label: 'نصف يوم', color: 'orange' }
    };

    const config = statusConfig[status] || { label: status, color: 'gray' };
    return <Badge color={config.color} className="whitespace-nowrap">{config.label}</Badge>;
  };

  const columns = [
    {
      key: 'autoSerial',
      label: 'الرقم الوظيفي',
      render: (_, row) => row ? <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{row.autoSerial || '-'}</span> : '-'
    },
    {
      key: 'arName',
      label: 'اسم الموظف',
      render: (_, row) => row ? <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{row.arName || '-'}</span> : '-'
    },
    {
      key: 'job',
      label: 'الوظيفة',
      render: (_, row) => row ? <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{row.job || '-'}</span> : '-'
    },
    {
      key: 'management',
      label: 'الإدارة',
      render: (_, row) => row ? <span className={darkMode ? 'text-gray-200' : 'text-gray-800 dark:text-gray-100'}>{row.management || '-'}</span> : '-'
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (_, row) => row ? getStatusBadge(row.status) : '-'
    },
    {
      key: 'source',
      label: 'المصدر',
      render: (_, row) => {
        if (!row) return '-';
        const source = row.source || 'Manual';
        const sourceConfig = {
          Biometric: { label: 'بصمة', color: 'green' },
          Mobile: { label: 'جوال', color: 'blue' },
          Manual: { label: 'يدوي', color: 'gray' },
          System: { label: 'نظام', color: 'purple' }
        };
        const config = sourceConfig[source] || sourceConfig.Manual;
        return (
          <div className="flex items-center gap-1">
            <Badge color={config.color} className="whitespace-nowrap text-xs">{config.label}</Badge>
            {row.hasMultipleSources && (
              <span className="text-amber-500 text-lg" title="يوجد أكثر من مصدر تسجيل">⚠️</span>
            )}
          </div>
        );
      }
    },
    {
      key: 'checkIn',
      label: 'وقت الدخول',
      render: (_, row) => row && row.checkIn ? <span className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{row.checkIn}</span> : <span className={darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}>-</span>
    },
    {
      key: 'checkOut',
      label: 'وقت الخروج',
      render: (_, row) => row && row.checkOut ? <span className={`font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{row.checkOut}</span> : <span className={darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}>-</span>
    },
    {
      key: 'workHours',
      label: 'ساعات العمل',
      render: (_, row) => row && row.workHours ? <span className={`font-bold ${row.workHours >= 8 ? darkMode ? 'text-green-300' : 'text-green-700' : darkMode ? 'text-orange-300' : 'text-orange-700'}`}>{row.workHours} ساعة</span> : <span className={darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}>-</span>
    },
    {
      key: 'lateMinutes',
      label: 'دقائق التأخير',
      render: (_, row) => row && row.lateMinutes > 0 ? <span className={`font-bold ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{row.lateMinutes} دقيقة</span> : <span className={darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}>-</span>
    },
    {
      key: 'actions',
      label: 'الأجراءات',
      sortable: false,
      render: (_, row) => row ? <AttendanceActions employee={row} darkMode={darkMode} /> : '-'
    }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: 1, label: 'يناير' },
    { value: 2, label: 'فبراير' },
    { value: 3, label: 'مارس' },
    { value: 4, label: 'أبريل' },
    { value: 5, label: 'مايو' },
    { value: 6, label: 'يونيو' },
    { value: 7, label: 'يوليو' },
    { value: 8, label: 'أغسطس' },
    { value: 9, label: 'سبتمبر' },
    { value: 10, label: 'أكتوبر' },
    { value: 11, label: 'نوفمبر' },
    { value: 12, label: 'ديسمبر' }
  ];

  const getDaysInMonth = (year, month) => {
    const daysCount = new Date(year, month, 0).getDate();
    return Array.from({ length: daysCount }, (_, i) => i + 1);
  };

  return (
    <div>
      {/* الفلاتر */}
      <div className={`p-4 rounded-xl mb-4 ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              السنة
            </label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              الشهر
            </label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              اليوم
            </label>
            <select
              value={filters.day}
              onChange={(e) => setFilters({ ...filters, day: parseInt(e.target.value) })}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              {getDaysInMonth(filters.year, filters.month).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showPresentOnly}
                onChange={(e) => setFilters({ ...filters, showPresentOnly: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                عرض الحاضرين فقط
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* الملخص */}
      {data.summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className={`p-4 rounded-lg text-center border-2 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'}`}>
            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {data.summary.total || 0}
            </div>
            <div className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              الإجمالي
            </div>
          </div>
          <div className={`p-4 rounded-lg text-center border-2 ${darkMode ? 'bg-green-900 border-green-700 text-white' : 'bg-green-50 dark:bg-green-900/20 border-green-400 text-green-900'}`}>
            <div className={`text-3xl font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
              {data.summary.present || 0}
            </div>
            <div className={`text-sm font-semibold ${darkMode ? 'text-green-200' : 'text-green-800 dark:text-green-200'}`}>حاضر</div>
          </div>
          <div className={`p-4 rounded-lg text-center border-2 ${darkMode ? 'bg-red-900 border-red-700 text-white' : 'bg-red-50 dark:bg-red-900/20 border-red-400 text-red-900'}`}>
            <div className={`text-3xl font-bold ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
              {data.summary.absent || 0}
            </div>
            <div className={`text-sm font-semibold ${darkMode ? 'text-red-200' : 'text-red-800 dark:text-red-200'}`}>غائب</div>
          </div>
          <div className={`p-4 rounded-lg text-center border-2 ${darkMode ? 'bg-yellow-900 border-yellow-700 text-white' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 text-yellow-900'}`}>
            <div className={`text-3xl font-bold ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
              {data.summary.late || 0}
            </div>
            <div className={`text-sm font-semibold ${darkMode ? 'text-yellow-200' : 'text-yellow-800 dark:text-yellow-200'}`}>متأخر</div>
          </div>
          <div className={`p-4 rounded-lg text-center border-2 ${darkMode ? 'bg-blue-900 border-blue-700 text-white' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-900'}`}>
            <div className={`text-3xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              {data.summary.onLeave || 0}
            </div>
            <div className={`text-sm font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-800 dark:text-blue-200'}`}>إجازة</div>
          </div>
        </div>
      )}

      {/* الجدول */}
      <DataTable
        columns={columns}
        data={data.employees || []}
        loading={loading}
        darkMode={darkMode}
        emptyMessage="لا توجد بيانات حضور لهذا التاريخ"
      />
    </div>
  );
}
