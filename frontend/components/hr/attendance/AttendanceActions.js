/**
 * AttendanceActions Component
 * مكون إجراءات الحضور - يشمل التنبيهات والخصومات والعقوبات
 */

import React, { useState, useEffect } from 'react';
import { fmtDate } from '../../../utils/hijriDate';
import { Button, Badge, Modal } from '../../ui';
import {
  getLateLevel,
  getDeductionOptions,
  DEDUCTION_TYPES,
  NOTIFICATION_TEMPLATES,
  generateNotificationMessage,
  ESCALATION_POLICY,
  getEscalationAction,
  calculateLateMinutes,
  LATE_THRESHOLDS
} from '../../../lib/attendance-deduction-rules';

export default function AttendanceActions({ employee, darkMode, onUpdate }) {
  // Modal states
  const [showAlert, setShowAlert] = useState(false);
  const [showPenalty, setShowPenalty] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeduction, setShowDeduction] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Form states
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('warning');
  const [penaltyType, setPenaltyType] = useState('warning');
  const [penaltyReason, setPenaltyReason] = useState('');
  const [selectedDeductionType, setSelectedDeductionType] = useState(null);
  const [deductionOptions, setDeductionOptions] = useState(null);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editStatus, setEditStatus] = useState(employee?.status || 'present');
  const [editCheckIn, setEditCheckIn] = useState(employee?.checkIn || '08:00');
  const [editCheckOut, setEditCheckOut] = useState(employee?.checkOut || '16:00');
  const [editNote, setEditNote] = useState('');

  // Notification history (mock)
  const [notificationHistory, setNotificationHistory] = useState([
    { id: 1, date: '2026-01-28', type: 'تنبيه', message: 'تنبيه بخصوص التأخير', status: 'sent' },
    { id: 2, date: '2026-01-25', type: 'إنذار', message: 'إنذار أول', status: 'read' },
  ]);

  // Status messages
  const statusMessages = {
    late: 'تأخير في الحضور',
    absent: 'غياب بدون عذر',
    earlyDeparture: 'انصراف مبكر',
    early: 'حضور مبكر',
    present: 'حضور منتظم',
    leave: 'إجازة'
  };

  // Alert types
  const alertTypes = [
    { value: 'reminder', label: 'تذكير', icon: '💡', color: 'blue' },
    { value: 'warning', label: 'تنبيه', icon: '⚠️', color: 'yellow' },
    { value: 'urgent', label: 'عاجل', icon: '🚨', color: 'red' },
    { value: 'inquiry', label: 'استفسار', icon: '❓', color: 'purple' },
    { value: 'appreciation', label: 'تقدير', icon: '⭐', color: 'green' }
  ];

  // Penalty types
  const penaltyTypes = [
    { value: 'verbal_warning', label: 'تنبيه شفهي', severity: 1 },
    { value: 'written_warning', label: 'إنذار كتابي أول', severity: 2 },
    { value: 'final_warning', label: 'إنذار كتابي نهائي', severity: 3 },
    { value: 'salary_deduction', label: 'خصم من الراتب', severity: 4 },
    { value: 'suspension', label: 'إيقاف مؤقت', severity: 5 },
    { value: 'termination', label: 'إنهاء خدمة', severity: 6 }
  ];

  // Calculate deduction options when opening deduction modal
  useEffect(() => {
    if (showDeduction && employee?.lateMinutes > 0) {
      // Mock data - in real app, get from employee record
      const monthlySalary = employee.salary || 10000;
      const leaveBalance = employee.leaveBalance || 15; // days

      const options = getDeductionOptions(
        employee.lateMinutes,
        monthlySalary,
        leaveBalance
      );
      setDeductionOptions(options);
      setSelectedDeductionType(options.recommendation);
    }
  }, [showDeduction, employee]);

  // Get late level info
  const lateLevel = employee?.lateMinutes > 0 ? getLateLevel(employee.lateMinutes) : null;

  // Handle send alert
  const handleSendAlert = async () => {
    if (!alertMessage.trim()) {
      alert('يرجى كتابة رسالة التنبيه');
      return;
    }

    setSaving(true);
    try {
      const alertData = {
        employeeId: employee.empId,
        employeeName: employee.arName,
        type: alertType,
        message: alertMessage,
        status: employee.status,
        lateMinutes: employee.lateMinutes || 0,
        date: new Date().toISOString()
      };

      console.log('إرسال تنبيه:', alertData);

      // Add to history
      setNotificationHistory(prev => [{
        id: Date.now(),
        date: fmtDate(new Date()),
        type: alertTypes.find(t => t.value === alertType)?.label,
        message: alertMessage,
        status: 'sent'
      }, ...prev]);

      alert('تم إرسال التنبيه بنجاح');
      setShowAlert(false);
      setAlertMessage('');
      setAlertType('warning');
    } catch (error) {
      console.error('Error sending alert:', error);
      alert('حدث خطأ أثناء إرسال التنبيه');
    } finally {
      setSaving(false);
    }
  };

  // Handle add penalty
  const handleAddPenalty = async () => {
    if (!penaltyReason.trim()) {
      alert('يرجى كتابة سبب العقوبة');
      return;
    }

    setSaving(true);
    try {
      const penaltyData = {
        employeeId: employee.empId,
        employeeName: employee.arName,
        type: penaltyType,
        reason: penaltyReason,
        date: new Date().toISOString(),
        status: employee.status,
        lateMinutes: employee.lateMinutes || 0
      };

      console.log('إضافة عقوبة:', penaltyData);

      const penaltyLabel = penaltyTypes.find(p => p.value === penaltyType)?.label;
      alert(`تم إضافة عقوبة: ${penaltyLabel}`);
      setShowPenalty(false);
      setPenaltyReason('');
      setPenaltyType('verbal_warning');
    } catch (error) {
      console.error('Error adding penalty:', error);
      alert('حدث خطأ أثناء إضافة العقوبة');
    } finally {
      setSaving(false);
    }
  };

  // Handle deduction
  const handleApplyDeduction = async () => {
    if (!selectedDeductionType) {
      alert('يرجى اختيار طريقة الخصم');
      return;
    }

    setSaving(true);
    try {
      const selectedOption = deductionOptions.options.find(o => o.type === selectedDeductionType);

      const deductionData = {
        employeeId: employee.empId,
        employeeName: employee.arName,
        lateMinutes: employee.lateMinutes,
        deductionType: selectedDeductionType,
        amount: selectedDeductionType === DEDUCTION_TYPES.FROM_SALARY
          ? selectedOption.amount
          : null,
        hours: selectedDeductionType === DEDUCTION_TYPES.FROM_LEAVE
          ? selectedOption.hours
          : null,
        date: new Date().toISOString()
      };

      console.log('تطبيق الخصم:', deductionData);

      const message = selectedDeductionType === DEDUCTION_TYPES.FROM_SALARY
        ? `تم خصم ${selectedOption.amount.toFixed(2)} ر.س من الراتب`
        : `تم خصم ${selectedOption.hours} ساعة من رصيد الإجازات`;

      alert(message);
      setShowDeduction(false);
      setSelectedDeductionType(null);

      // Trigger update callback
      if (onUpdate) {
        onUpdate({ ...employee, deductionApplied: true });
      }
    } catch (error) {
      console.error('Error applying deduction:', error);
      alert('حدث خطأ أثناء تطبيق الخصم');
    } finally {
      setSaving(false);
    }
  };

  // Handle edit attendance
  const handleEditAttendance = async () => {
    setSaving(true);
    try {
      const newLateMinutes = calculateLateMinutes(editCheckIn);

      const editData = {
        employeeId: employee.empId,
        status: editStatus,
        checkIn: editCheckIn,
        checkOut: editCheckOut,
        lateMinutes: newLateMinutes,
        note: editNote,
        editedAt: new Date().toISOString()
      };

      console.log('تعديل الحضور:', editData);

      alert('تم تعديل سجل الحضور بنجاح');
      setShowEdit(false);

      // Trigger update callback
      if (onUpdate) {
        onUpdate({
          ...employee,
          status: editStatus,
          checkIn: editCheckIn,
          checkOut: editCheckOut,
          lateMinutes: newLateMinutes
        });
      }
    } catch (error) {
      console.error('Error editing attendance:', error);
      alert('حدث خطأ أثناء التعديل');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (window.confirm(`هل تريد حذف سجل الحضور للموظف ${employee.arName}؟`)) {
      console.log('حذف السجل:', employee.empId);
      alert('تم حذف السجل بنجاح');
      if (onUpdate) {
        onUpdate({ ...employee, deleted: true });
      }
    }
  };

  // Generate suggested message
  const generateSuggestedMessage = () => {
    const data = {
      date: fmtDate(new Date()),
      minutes: employee.lateMinutes || 0,
      count: employee.monthlyLateCount || 1,
      start: '08:00',
      end: '16:00'
    };

    if (employee.status === 'late') {
      if (data.count <= 2) {
        return generateNotificationMessage(NOTIFICATION_TEMPLATES.late.first, data);
      } else if (data.count <= 5) {
        return generateNotificationMessage(NOTIFICATION_TEMPLATES.late.repeated, data);
      } else {
        return generateNotificationMessage(NOTIFICATION_TEMPLATES.late.warning, data);
      }
    } else if (employee.status === 'absent') {
      return generateNotificationMessage(NOTIFICATION_TEMPLATES.absent.first, data);
    }

    return generateNotificationMessage(NOTIFICATION_TEMPLATES.general.reminder, data);
  };

  return (
    <div className="flex gap-1 flex-wrap">
      {/* زر إرسال تنبيه */}
      <button
        onClick={() => {
          setAlertMessage(generateSuggestedMessage());
          setShowAlert(true);
        }}
        className={`p-2 rounded-lg transition-colors ${
          darkMode
            ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
        }`}
        title="إرسال تنبيه"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </button>

      {/* زر الخصم - يظهر فقط للمتأخرين */}
      {employee.lateMinutes > 15 && (
        <button
          onClick={() => setShowDeduction(true)}
          className={`p-2 rounded-lg transition-colors ${
            darkMode
              ? 'bg-orange-900/30 text-orange-400 hover:bg-orange-900/50'
              : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 hover:bg-orange-100'
          }`}
          title="إدارة الخصم"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}

      {/* زر إضافة عقوبة */}
      {(employee.status === 'late' || employee.status === 'absent') && (
        <button
          onClick={() => setShowPenalty(true)}
          className={`p-2 rounded-lg transition-colors ${
            darkMode
              ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100'
          }`}
          title="إضافة عقوبة"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </button>
      )}

      {/* زر سجل التنبيهات */}
      <button
        onClick={() => setShowHistory(true)}
        className={`p-2 rounded-lg transition-colors ${
          darkMode
            ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50'
            : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-100'
        }`}
        title="سجل التنبيهات"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* زر التعديل */}
      <button
        onClick={() => setShowEdit(true)}
        className={`p-2 rounded-lg transition-colors ${
          darkMode
            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
        }`}
        title="تعديل"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {/* ============================================ */}
      {/* مودال إرسال التنبيه */}
      {/* ============================================ */}
      <Modal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="إرسال تنبيه للموظف"
        darkMode={darkMode}
        size="lg"
      >
        <div className="space-y-4">
          {/* معلومات الموظف */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {employee.arName}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {employee.job} - {employee.management}
                </p>
              </div>
              <div className="text-left">
                <Badge color={
                  employee.status === 'present' ? 'green' :
                  employee.status === 'late' ? 'yellow' :
                  employee.status === 'absent' ? 'red' : 'blue'
                }>
                  {statusMessages[employee.status]}
                </Badge>
                {employee.lateMinutes > 0 && (
                  <p className={`text-sm mt-1 ${darkMode ? 'text-red-400' : 'text-red-600 dark:text-red-400'}`}>
                    تأخير: {employee.lateMinutes} دقيقة
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* نوع التنبيه */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              نوع التنبيه
            </label>
            <div className="grid grid-cols-5 gap-2">
              {alertTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setAlertType(type.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    alertType === type.value
                      ? `border-${type.color}-500 ${darkMode ? `bg-${type.color}-900/30` : `bg-${type.color}-50`}`
                      : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                  }`}
                >
                  <span className="text-2xl block mb-1">{type.icon}</span>
                  <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* رسالة التنبيه */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              رسالة التنبيه
            </label>
            <textarea
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
              placeholder="اكتب رسالة التنبيه..."
            />
          </div>

          {/* أزرار الإجراء */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSendAlert} disabled={saving} className="flex-1">
              {saving ? 'جاري الإرسال...' : 'إرسال التنبيه'}
            </Button>
            <Button variant="outline" onClick={() => setShowAlert(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================ */}
      {/* مودال الخصم */}
      {/* ============================================ */}
      <Modal
        isOpen={showDeduction}
        onClose={() => setShowDeduction(false)}
        title="إدارة الخصم"
        darkMode={darkMode}
        size="lg"
      >
        <div className="space-y-4">
          {/* معلومات التأخير */}
          {lateLevel && (
            <div className={`p-4 rounded-lg ${
              lateLevel.color === 'yellow' ? darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20' :
              lateLevel.color === 'orange' ? darkMode ? 'bg-orange-900/20' : 'bg-orange-50' :
              lateLevel.color === 'red' ? darkMode ? 'bg-red-900/20' : 'bg-red-50' :
              darkMode ? 'bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {employee.arName}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    تأخير: {employee.lateMinutes} دقيقة
                  </p>
                </div>
                <Badge color={lateLevel.color}>{lateLevel.level}</Badge>
              </div>
            </div>
          )}

          {/* شرح الخصم */}
          <div className={`p-4 rounded-lg border-2 border-dashed ${
            darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
          }`}>
            <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              قاعدة الخصم المطبقة
            </h4>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              التأخير {employee.lateMinutes} دقيقة يستوجب خصم {lateLevel?.deductionPercent}% من الراتب اليومي
              أو {lateLevel?.deductionHours} ساعة من رصيد الإجازات.
            </p>
          </div>

          {/* خيارات الخصم */}
          {deductionOptions && (
            <div>
              <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                اختر طريقة الخصم
              </label>
              <div className="space-y-3">
                {deductionOptions.options.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => option.enabled && setSelectedDeductionType(option.type)}
                    disabled={!option.enabled}
                    className={`w-full p-4 rounded-lg border-2 text-right transition-all ${
                      selectedDeductionType === option.type
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : option.enabled
                          ? darkMode ? 'border-gray-600 bg-gray-700 hover:border-gray-500' : 'border-gray-200 dark:border-gray-700 bg-white hover:border-gray-300'
                          : 'opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                          {option.type === DEDUCTION_TYPES.FROM_SALARY ? '💰 خصم من الراتب' : '📅 خصم من الإجازات'}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                          {option.label}
                        </p>
                        {option.sublabel && (
                          <p className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {option.sublabel}
                          </p>
                        )}
                      </div>
                      {selectedDeductionType === option.type && (
                        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                      {option.type === deductionOptions.recommendation && (
                        <Badge color="green" className="mr-2">موصى به</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ملاحظة */}
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
            <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700 dark:text-blue-300'}`}>
              💡 سيتم إشعار الموظف بطريقة الخصم المختارة وتسجيلها في ملفه.
            </p>
          </div>

          {/* أزرار الإجراء */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleApplyDeduction}
              disabled={saving || !selectedDeductionType}
              className="flex-1"
            >
              {saving ? 'جاري التطبيق...' : 'تطبيق الخصم'}
            </Button>
            <Button variant="outline" onClick={() => setShowDeduction(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================ */}
      {/* مودال العقوبة */}
      {/* ============================================ */}
      <Modal
        isOpen={showPenalty}
        onClose={() => setShowPenalty(false)}
        title="إضافة عقوبة"
        darkMode={darkMode}
      >
        <div className="space-y-4">
          {/* معلومات الموظف */}
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'}`}>
            <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {employee.arName}
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              الحالة: {statusMessages[employee.status]}
              {employee.lateMinutes > 0 && ` - تأخير ${employee.lateMinutes} دقيقة`}
            </p>
          </div>

          {/* نوع العقوبة */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              نوع العقوبة
            </label>
            <select
              value={penaltyType}
              onChange={(e) => setPenaltyType(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              {penaltyTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* سبب العقوبة */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              سبب العقوبة
            </label>
            <textarea
              value={penaltyReason}
              onChange={(e) => setPenaltyReason(e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
              placeholder="اكتب سبب العقوبة..."
            />
          </div>

          {/* تحذير */}
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700 dark:text-red-300'}`}>
              ⚠️ سيتم تسجيل هذه العقوبة في ملف الموظف وإشعاره بها.
            </p>
          </div>

          {/* أزرار الإجراء */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="danger"
              onClick={handleAddPenalty}
              disabled={saving || !penaltyReason.trim()}
              className="flex-1"
            >
              {saving ? 'جاري الإضافة...' : 'إضافة العقوبة'}
            </Button>
            <Button variant="outline" onClick={() => setShowPenalty(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================ */}
      {/* مودال سجل التنبيهات */}
      {/* ============================================ */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="سجل التنبيهات والإجراءات"
        darkMode={darkMode}
        size="lg"
      >
        <div className="space-y-4">
          {notificationHistory.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
              لا توجد تنبيهات سابقة
            </div>
          ) : (
            <div className="space-y-2">
              {notificationHistory.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border ${
                    darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                        {item.date}
                      </span>
                      <Badge color={item.type === 'إنذار' ? 'red' : 'blue'} className="mr-2">
                        {item.type}
                      </Badge>
                    </div>
                    <Badge color={item.status === 'sent' ? 'yellow' : 'green'}>
                      {item.status === 'sent' ? 'مرسل' : 'مقروء'}
                    </Badge>
                  </div>
                  <p className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                    {item.message}
                  </p>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" onClick={() => setShowHistory(false)} className="w-full">
            إغلاق
          </Button>
        </div>
      </Modal>

      {/* ============================================ */}
      {/* مودال التعديل */}
      {/* ============================================ */}
      <Modal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="تعديل سجل الحضور"
        darkMode={darkMode}
      >
        <div className="space-y-4">
          {/* معلومات الموظف */}
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'}`}>
            <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {employee.arName}
            </p>
          </div>

          {/* حالة الحضور */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              حالة الحضور
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <option value="present">حاضر</option>
              <option value="late">متأخر</option>
              <option value="absent">غائب</option>
              <option value="leave">إجازة</option>
            </select>
          </div>

          {/* أوقات الدخول والخروج */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                وقت الدخول
              </label>
              <input
                type="time"
                value={editCheckIn}
                onChange={(e) => setEditCheckIn(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                وقت الخروج
              </label>
              <input
                type="time"
                value={editCheckOut}
                onChange={(e) => setEditCheckOut(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                }`}
              />
            </div>
          </div>

          {/* ملاحظة */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              ملاحظة (اختياري)
            </label>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              rows={2}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
              placeholder="سبب التعديل..."
            />
          </div>

          {/* أزرار الإجراء */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleEditAttendance} disabled={saving} className="flex-1">
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
            <Button variant="outline" onClick={() => setShowEdit(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
