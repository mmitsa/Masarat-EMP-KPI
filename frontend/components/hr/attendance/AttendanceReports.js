import React, { useState, useEffect, useRef } from 'react';
import { fmtDate } from '../../../utils/hijriDate';
import { Button, DataTable, Badge } from '../../ui';


export default function AttendanceReports({ darkMode }) {
  const [reportType, setReportType] = useState('detailed');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [management, setManagement] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [contractType, setContractType] = useState('');
  const [status, setStatus] = useState('');
  const [employees, setEmployees] = useState([]);
  const [detailedRows, setDetailedRows] = useState([]);
  const [summaryRows, setSummaryRows] = useState([]);
  const [exporting, setExporting] = useState(false);
  const printRef = useRef(null);

  const managementOptions = ['الإدارة العامة', 'الإدارة التنفيذية', 'إدارة الفروع', 'إدارة العمليات', 'الإدارة المالية', 'الإدارة الفنية'];
  const departmentOptions = ['الموارد البشرية', 'تقنية المعلومات', 'المالية والحسابات', 'التسويق والمبيعات', 'العمليات والإنتاج', 'خدمة العملاء', 'المشتريات والمخازن'];
  const jobOptions = ['مدير قسم', 'مشرف', 'محلل', 'موظف إداري', 'أخصائي موارد بشرية', 'محاسب', 'مطور برمجيات'];
  const contractOptions = ['رسمي', 'دوام جزئي', 'متعاون', 'مقاول'];
  const statusOptions = ['present', 'late', 'absent', 'leave'];

  useEffect(() => {
    // default date range last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);

    // load employees from mock immediately
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
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
          const empList = Array.isArray(result.data) ? result.data : (result.data.employees || []);
          setEmployees(empList);
          return;
        }
      }
    } catch { /* API unavailable */ }
    setEmployees([]);
  };

  const handleGenerateReport = () => {
    const filtered = (employees || []).filter((emp) => {
      return (
        (!employeeId || emp.empId === Number(employeeId)) &&
        (!department || emp.department === department) &&
        (!management || emp.management === management) &&
        (!jobTitle || emp.job === jobTitle) &&
        (!status || emp.status === status)
      );
    });

    const detailed = filtered.slice(0, 50).map((emp, idx) => ({
      id: `${emp.empId}-${idx}`,
      empName: emp.arName,
      autoSerial: emp.autoSerial,
      department: emp.department,
      management: emp.management,
      job: emp.job,
      status: emp.status,
      checkIn: emp.checkIn || '-',
      checkOut: emp.checkOut || '-',
      workHours: emp.workHours || 0,
      lateMinutes: emp.lateMinutes || 0,
    }));

    const summary = [
      { label: 'إجمالي الموظفين', value: filtered.length },
      { label: 'حاضر', value: filtered.filter((e) => e.status === 'present').length },
      { label: 'متأخر', value: filtered.filter((e) => e.status === 'late').length },
      { label: 'غائب', value: filtered.filter((e) => e.status === 'absent').length },
      { label: 'إجازة', value: filtered.filter((e) => e.status === 'leave').length },
    ];

    setDetailedRows(detailed);
    setSummaryRows(summary);
  };

  // Export to Excel (CSV format)
  const handleExportExcel = () => {
    setExporting(true);

    try {
      const data = reportType === 'detailed' ? detailedRows : summaryRows;

      if (data.length === 0) {
        alert('لا توجد بيانات للتصدير. يرجى إنشاء التقرير أولاً.');
        setExporting(false);
        return;
      }

      let csvContent = '\uFEFF'; // BOM for Arabic support

      if (reportType === 'detailed') {
        // Header row
        csvContent += 'الرقم الوظيفي,الموظف,القسم,الإدارة,الوظيفة,الحالة,وقت الدخول,وقت الخروج,ساعات العمل,دقائق التأخير\n';

        // Data rows
        data.forEach((row) => {
          const statusText = row.status === 'present' ? 'حاضر' :
                            row.status === 'late' ? 'متأخر' :
                            row.status === 'leave' ? 'إجازة' : 'غائب';
          csvContent += `${row.autoSerial},${row.empName},${row.department},${row.management},${row.job},${statusText},${row.checkIn},${row.checkOut},${row.workHours},${row.lateMinutes}\n`;
        });
      } else {
        // Summary report
        csvContent += 'البند,القيمة\n';
        data.forEach((row) => {
          csvContent += `${row.label},${row.value}\n`;
        });
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      const reportName = reportType === 'detailed' ? 'تقرير_الحضور_التفصيلي' : 'تقرير_الحضور_التجميعي';
      const fileName = `${reportName}_${dateFrom}_${dateTo}.csv`;

      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      alert('حدث خطأ أثناء التصدير');
    } finally {
      setExporting(false);
    }
  };

  // Print functionality
  const handlePrint = () => {
    const data = reportType === 'detailed' ? detailedRows : summaryRows;

    if (data.length === 0) {
      alert('لا توجد بيانات للطباعة. يرجى إنشاء التقرير أولاً.');
      return;
    }

    const reportTitle = reportType === 'detailed' ? 'تقرير الحضور التفصيلي' : 'تقرير الحضور التجميعي';

    let tableHTML = '';

    if (reportType === 'detailed') {
      tableHTML = `
        <table style="width:100%; border-collapse: collapse; direction: rtl; font-family: 'Cairo', sans-serif;">
          <thead>
            <tr style="background-color: #1d4ed8; color: white;">
              <th style="border: 1px solid #ddd; padding: 12px;">الرقم الوظيفي</th>
              <th style="border: 1px solid #ddd; padding: 12px;">الموظف</th>
              <th style="border: 1px solid #ddd; padding: 12px;">القسم</th>
              <th style="border: 1px solid #ddd; padding: 12px;">الإدارة</th>
              <th style="border: 1px solid #ddd; padding: 12px;">الوظيفة</th>
              <th style="border: 1px solid #ddd; padding: 12px;">الحالة</th>
              <th style="border: 1px solid #ddd; padding: 12px;">وقت الدخول</th>
              <th style="border: 1px solid #ddd; padding: 12px;">وقت الخروج</th>
              <th style="border: 1px solid #ddd; padding: 12px;">ساعات العمل</th>
              <th style="border: 1px solid #ddd; padding: 12px;">دقائق التأخير</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((row, idx) => {
              const statusText = row.status === 'present' ? 'حاضر' :
                                row.status === 'late' ? 'متأخر' :
                                row.status === 'leave' ? 'إجازة' : 'غائب';
              const statusColor = row.status === 'present' ? '#10b981' :
                                 row.status === 'late' ? '#f59e0b' :
                                 row.status === 'leave' ? '#3b82f6' : '#ef4444';
              return `
                <tr style="background-color: ${idx % 2 === 0 ? '#f9fafb' : 'white'};">
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${row.autoSerial}</td>
                  <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">${row.empName}</td>
                  <td style="border: 1px solid #ddd; padding: 10px;">${row.department}</td>
                  <td style="border: 1px solid #ddd; padding: 10px;">${row.management}</td>
                  <td style="border: 1px solid #ddd; padding: 10px;">${row.job}</td>
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">
                    <span style="background-color: ${statusColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">${statusText}</span>
                  </td>
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #1d4ed8; font-weight: 500;">${row.checkIn}</td>
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #7c3aed; font-weight: 500;">${row.checkOut}</td>
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold; color: ${row.workHours >= 8 ? '#10b981' : '#f59e0b'};">${row.workHours}</td>
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: ${row.lateMinutes > 0 ? '#ef4444' : '#9ca3af'}; font-weight: ${row.lateMinutes > 0 ? 'bold' : 'normal'};">${row.lateMinutes > 0 ? row.lateMinutes : '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else {
      tableHTML = `
        <table style="width: 50%; margin: 0 auto; border-collapse: collapse; direction: rtl; font-family: 'Cairo', sans-serif;">
          <thead>
            <tr style="background-color: #1d4ed8; color: white;">
              <th style="border: 1px solid #ddd; padding: 12px;">البند</th>
              <th style="border: 1px solid #ddd; padding: 12px;">القيمة</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((row, idx) => `
              <tr style="background-color: ${idx % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">${row.label}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-size: 18px; font-weight: bold; color: #1d4ed8;">${row.value}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${reportTitle}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Cairo', sans-serif;
            padding: 20px;
            direction: rtl;
          }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1d4ed8; margin-bottom: 10px;">${reportTitle}</h1>
          <p style="color: #666;">الفترة: ${dateFrom} إلى ${dateTo}</p>
          <p style="color: #999; font-size: 12px;">تاريخ الطباعة: ${fmtDate(new Date())} - ${new Date().toLocaleTimeString('ar-SA')}</p>
        </div>
        ${tableHTML}
        <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
          <p>نظام مسارات - إدارة الموارد البشرية</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const detailedColumns = [
    { key: 'autoSerial', label: 'الرقم الوظيفي', render: (_, row) => <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{row.autoSerial}</span> },
    { key: 'empName', label: 'الموظف', render: (_, row) => <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{row.empName}</span> },
    { key: 'department', label: 'القسم', render: (_, row) => <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{row.department}</span> },
    { key: 'management', label: 'الإدارة', render: (_, row) => <span className={darkMode ? 'text-gray-200' : 'text-gray-800 dark:text-gray-100'}>{row.management}</span> },
    { key: 'job', label: 'الوظيفة', render: (_, row) => <span className={darkMode ? 'text-gray-200' : 'text-gray-800 dark:text-gray-100'}>{row.job}</span> },
    {
      key: 'status',
      label: 'الحالة',
      render: (_, row) => (
        <Badge color={
          row.status === 'present' ? 'green' :
          row.status === 'late' ? 'yellow' :
          row.status === 'leave' ? 'blue' : 'red'
        }>
          {row.status === 'present' ? 'حاضر' : row.status === 'late' ? 'متأخر' : row.status === 'leave' ? 'إجازة' : 'غائب'}
        </Badge>
      )
    },
    { key: 'checkIn', label: 'دخول', render: (_, row) => <span className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-700 dark:text-blue-300'}`}>{row.checkIn}</span> },
    { key: 'checkOut', label: 'خروج', render: (_, row) => <span className={`font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{row.checkOut}</span> },
    { key: 'workHours', label: 'ساعات العمل', render: (_, row) => <span className={`font-bold ${row.workHours >= 8 ? darkMode ? 'text-green-300' : 'text-green-700 dark:text-green-300' : darkMode ? 'text-orange-300' : 'text-orange-700'}`}>{row.workHours}</span> },
    { key: 'lateMinutes', label: 'دقائق التأخير', render: (_, row) => row.lateMinutes > 0 ? <span className={`font-bold ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{row.lateMinutes} دقيقة</span> : <span className={darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}>-</span> }
  ];

  const summaryColumns = [
    { key: 'label', label: 'البند', render: (_, row) => <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{row.label}</span> },
    { key: 'value', label: 'القيمة', render: (_, row) => <span className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{row.value}</span> }
  ];

  return (
    <div ref={printRef}>
      {/* Filters */}
      <div className={`p-4 rounded-xl mb-4 ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              نوع التقرير
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <option value="detailed">تقرير تفصيلي</option>
              <option value="summary">تقرير تجميعي</option>
              <option value="monthly">تقرير شهري</option>
              <option value="absence">تقرير الغياب</option>
              <option value="late">تقرير التأخير</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              الموظف
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <option value="">الكل</option>
              {employees.map((emp) => (
                <option key={emp.empId} value={emp.empId}>
                  {emp.autoSerial} - {emp.arName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              الإدارة
            </label>
            <select
              value={management}
              onChange={(e) => setManagement(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <option value="">الكل</option>
              {managementOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              القسم
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <option value="">الكل</option>
              {departmentOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              الوظيفة
            </label>
            <select
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <option value="">الكل</option>
              {jobOptions.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              نوع العقد
            </label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <option value="">الكل</option>
              {contractOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              الحالة
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <option value="">الكل</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s === 'present' ? 'حاضر' : s === 'late' ? 'متأخر' : s === 'leave' ? 'إجازة' : 'غائب'}
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

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2 flex-wrap">
          <Button onClick={handleGenerateReport}>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            عرض التقرير
          </Button>

          <button
            onClick={handleExportExcel}
            disabled={exporting || (detailedRows.length === 0 && summaryRows.length === 0)}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
              exporting || (detailedRows.length === 0 && summaryRows.length === 0)
                ? 'opacity-50 cursor-not-allowed'
                : ''
            } ${
              darkMode
                ? 'border-green-700 text-green-400 hover:bg-green-900/30'
                : 'border-green-500 text-green-700 dark:text-green-300 hover:bg-green-50'
            }`}
          >
            {exporting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            تصدير Excel
          </button>

          <button
            onClick={handlePrint}
            disabled={detailedRows.length === 0 && summaryRows.length === 0}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
              detailedRows.length === 0 && summaryRows.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
            } ${
              darkMode
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            طباعة
          </button>
        </div>
      </div>

      {/* Report Results */}
      {reportType === 'detailed' && detailedRows.length > 0 && (
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700'}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              تقرير تفصيلي
            </h3>
            <Badge color="blue">{detailedRows.length} سجل</Badge>
          </div>
          <DataTable columns={detailedColumns} data={detailedRows} darkMode={darkMode} />
        </div>
      )}

      {reportType === 'summary' && summaryRows.length > 0 && (
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700'}`}>
          <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            تقرير تجميعي
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {summaryRows.map((row, idx) => {
              const colors = ['blue', 'green', 'yellow', 'red', 'purple'];
              const bgColors = darkMode
                ? ['bg-blue-900/30', 'bg-green-900/30', 'bg-yellow-900/30', 'bg-red-900/30', 'bg-purple-900/30']
                : ['bg-blue-50 dark:bg-blue-900/20', 'bg-green-50', 'bg-yellow-50', 'bg-red-50', 'bg-purple-50'];
              const textColors = darkMode
                ? ['text-blue-300', 'text-green-300', 'text-yellow-300', 'text-red-300', 'text-purple-300']
                : ['text-blue-700 dark:text-blue-300', 'text-green-700', 'text-yellow-700', 'text-red-700', 'text-purple-700'];

              return (
                <div key={idx} className={`p-4 rounded-xl ${bgColors[idx]}`}>
                  <div className={`text-3xl font-bold ${textColors[idx]}`}>{row.value}</div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>{row.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {detailedRows.length === 0 && summaryRows.length === 0 && (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
          <svg className={`mx-auto w-16 h-16 mb-4 ${darkMode ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">اختر الفلاتر واضغط عرض التقرير</p>
          <p className="text-sm mt-2">الفلاتر تشمل الموظف، الإدارة، القسم، الوظيفة، الحالة، والفترة الزمنية</p>
        </div>
      )}
    </div>
  );
}
