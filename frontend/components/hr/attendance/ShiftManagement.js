import React, { useState, useEffect, useCallback } from 'react';
import hrAPI from '../../../lib/hr-api';

// ─────────────────────────────────────────────────────────────
// ShiftManagement - إدارة نوبات العمل
// ─────────────────────────────────────────────────────────────

const EMPTY_SHIFT = {
  nameAr: '',
  nameEn: '',
  code: '',
  startTime: '08:00',
  endTime: '16:00',
  breakDurationMinutes: 60,
  gracePeriodMinutes: 15,
  overtimeStartAfterMinutes: 30,
  isDefault: false,
  isNightShift: false,
  color: '#1d4ed8',
  isActive: true,
};

const EMPTY_DEPT_ASSIGN = {
  departmentId: '',
  workShiftId: '',
  effectiveFrom: '',
  effectiveTo: '',
};

const EMPTY_EMP_ASSIGN = {
  employeeId: '',
  workShiftId: '',
  effectiveFrom: '',
  effectiveTo: '',
  reason: '',
};

export default function ShiftManagement({ darkMode }) {
  // ── Data state ──
  const [shifts, setShifts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Modal / form state ──
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_SHIFT });
  const [formErrors, setFormErrors] = useState({});

  // ── Assign state ──
  const [assignTab, setAssignTab] = useState('department'); // department | employee
  const [deptAssign, setDeptAssign] = useState({ ...EMPTY_DEPT_ASSIGN });
  const [empAssign, setEmpAssign] = useState({ ...EMPTY_EMP_ASSIGN });
  const [assignErrors, setAssignErrors] = useState({});
  const [assignSaving, setAssignSaving] = useState(false);

  // ── Theme helpers ──
  const card = darkMode
    ? 'bg-gray-800 border-gray-700 text-gray-100'
    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white';
  const inputCls = darkMode
    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500';
  const labelCls = darkMode ? 'text-gray-300' : 'text-gray-700';
  const tableRowEven = darkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-900';
  const tableRowOdd = darkMode ? 'bg-gray-750' : 'bg-gray-50';
  const hoverRow = darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-50';

  // ── Load data ──
  const loadShifts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await hrAPI.shifts.getAll();
      setShifts(data?.data || data || []);
    } catch (err) {
      console.error('Error loading shifts:', err);
      setError('حدث خطأ أثناء تحميل نوبات العمل');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const { data } = await hrAPI.departments.getAll();
      setDepartments(data?.data || data || []);
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  }, []);

  useEffect(() => {
    loadShifts();
    loadDepartments();
  }, [loadShifts, loadDepartments]);

  // ── Auto-dismiss messages ──
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ── Form helpers ──
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.nameAr.trim()) errs.nameAr = 'الاسم بالعربي مطلوب';
    if (!formData.code.trim()) errs.code = 'الرمز مطلوب';
    if (!formData.startTime) errs.startTime = 'وقت البداية مطلوب';
    if (!formData.endTime) errs.endTime = 'وقت النهاية مطلوب';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── CRUD handlers ──
  const openCreateModal = () => {
    setEditingShift(null);
    setFormData({ ...EMPTY_SHIFT });
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (shift) => {
    setEditingShift(shift);
    setFormData({
      nameAr: shift.nameAr || '',
      nameEn: shift.nameEn || '',
      code: shift.code || '',
      startTime: shift.startTime || '08:00',
      endTime: shift.endTime || '16:00',
      breakDurationMinutes: shift.breakDurationMinutes ?? 60,
      gracePeriodMinutes: shift.gracePeriodMinutes ?? 15,
      overtimeStartAfterMinutes: shift.overtimeStartAfterMinutes ?? 30,
      isDefault: shift.isDefault ?? false,
      isNightShift: shift.isNightShift ?? false,
      color: shift.color || '#1d4ed8',
      isActive: shift.isActive ?? true,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSaveShift = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      setError('');
      if (editingShift) {
        await hrAPI.shifts.update(editingShift.id, formData);
        setSuccessMsg('تم تحديث النوبة بنجاح');
      } else {
        await hrAPI.shifts.create(formData);
        setSuccessMsg('تم إنشاء النوبة بنجاح');
      }
      setShowModal(false);
      await loadShifts();
    } catch (err) {
      console.error('Error saving shift:', err);
      setError('حدث خطأ أثناء حفظ النوبة');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (shift) => {
    setEditingShift(shift);
    setShowDeleteConfirm(true);
  };

  const handleDeleteShift = async () => {
    if (!editingShift) return;
    try {
      setSaving(true);
      setError('');
      await hrAPI.shifts.delete(editingShift.id);
      setSuccessMsg('تم حذف النوبة بنجاح');
      setShowDeleteConfirm(false);
      setEditingShift(null);
      await loadShifts();
    } catch (err) {
      console.error('Error deleting shift:', err);
      setError('حدث خطأ أثناء حذف النوبة');
    } finally {
      setSaving(false);
    }
  };

  // ── Assignment validation ──
  const validateAssignment = () => {
    const errs = {};
    if (assignTab === 'department') {
      if (!deptAssign.departmentId) errs.departmentId = 'يرجى اختيار القسم';
      if (!deptAssign.workShiftId) errs.workShiftId = 'يرجى اختيار النوبة';
      if (!deptAssign.effectiveFrom) errs.effectiveFrom = 'تاريخ البداية مطلوب';
    } else {
      if (!empAssign.employeeId) errs.employeeId = 'رقم الموظف مطلوب';
      if (!empAssign.workShiftId) errs.workShiftId = 'يرجى اختيار النوبة';
      if (!empAssign.effectiveFrom) errs.effectiveFrom = 'تاريخ البداية مطلوب';
    }
    setAssignErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAssign = async () => {
    if (!validateAssignment()) return;
    try {
      setAssignSaving(true);
      setError('');
      if (assignTab === 'department') {
        await hrAPI.shifts.assignDepartment(deptAssign);
        setSuccessMsg('تم تعيين النوبة للقسم بنجاح');
        setDeptAssign({ ...EMPTY_DEPT_ASSIGN });
      } else {
        await hrAPI.shifts.assignEmployee(empAssign);
        setSuccessMsg('تم تعيين النوبة للموظف بنجاح');
        setEmpAssign({ ...EMPTY_EMP_ASSIGN });
      }
      setAssignErrors({});
    } catch (err) {
      console.error('Error assigning shift:', err);
      setError('حدث خطأ أثناء تعيين النوبة');
    } finally {
      setAssignSaving(false);
    }
  };

  // ── Computed ──
  const calcWorkingHours = (start, end) => {
    if (!start || !end) return '-';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60; // overnight shift
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return mins > 0 ? `${hours}:${String(mins).padStart(2, '0')}` : `${hours}`;
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6" dir="rtl">
      {/* ── Toast messages ── */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => setError('')} className="mr-auto text-red-600 dark:text-red-400 hover:text-red-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* Section 1: Work Shifts List                                */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className={`rounded-xl p-6 shadow-sm dark:shadow-gray-900/20 border ${card}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold font-cairo">
              نوبات العمل
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
              إدارة وتعريف نوبات العمل المعتمدة
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة نوبة
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 rounded-full animate-spin" />
            <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
              جاري تحميل النوبات...
            </p>
          </div>
        ) : shifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className={`w-16 h-16 ${darkMode ? 'text-gray-600 dark:text-gray-300' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
              لا توجد نوبات عمل حالياً
            </p>
            <button
              onClick={openCreateModal}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium"
            >
              إضافة أول نوبة
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}>
                  <th className="px-4 py-3 text-right font-medium">اللون</th>
                  <th className="px-4 py-3 text-right font-medium">الاسم</th>
                  <th className="px-4 py-3 text-right font-medium">الرمز</th>
                  <th className="px-4 py-3 text-right font-medium">البداية</th>
                  <th className="px-4 py-3 text-right font-medium">النهاية</th>
                  <th className="px-4 py-3 text-right font-medium">ساعات العمل</th>
                  <th className="px-4 py-3 text-right font-medium">فترة السماح</th>
                  <th className="px-4 py-3 text-right font-medium">افتراضية</th>
                  <th className="px-4 py-3 text-right font-medium">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {shifts.map((shift, idx) => (
                  <tr
                    key={shift.id}
                    className={`${idx % 2 === 0 ? tableRowEven : tableRowOdd} ${hoverRow} transition-colors duration-150`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="inline-block w-5 h-5 rounded-full border-2 border-white shadow-sm dark:shadow-gray-900/20"
                        style={{ backgroundColor: shift.color || '#1d4ed8' }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{shift.nameAr}</td>
                    <td className="px-4 py-3 font-mono text-xs">{shift.code}</td>
                    <td className="px-4 py-3">{shift.startTime}</td>
                    <td className="px-4 py-3">{shift.endTime}</td>
                    <td className="px-4 py-3">
                      {shift.workingHours ?? calcWorkingHours(shift.startTime, shift.endTime)} ساعة
                    </td>
                    <td className="px-4 py-3">{shift.gracePeriodMinutes ?? '-'} دقيقة</td>
                    <td className="px-4 py-3">
                      {shift.isDefault ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          افتراضية
                        </span>
                      ) : (
                        <span className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {shift.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                          فعالة
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
                          معطلة
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(shift)}
                          title="تعديل"
                          className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => confirmDelete(shift)}
                          title="حذف"
                          className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* Section 3: Assign Shifts                                   */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className={`rounded-xl p-6 shadow-sm dark:shadow-gray-900/20 border ${card}`}>
        <h2 className="text-xl font-bold font-cairo mb-4">
          تعيين النوبات
        </h2>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-gray-100 dark:bg-gray-700/50">
          {[
            { key: 'department', label: 'تعيين لقسم' },
            { key: 'employee', label: 'تعيين لموظف' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setAssignTab(tab.key); setAssignErrors({}); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                assignTab === tab.key
                  ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 shadow-sm dark:shadow-gray-900/20'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Department Assignment */}
        {assignTab === 'department' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Department select */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                القسم <span className="text-red-500">*</span>
              </label>
              <select
                value={deptAssign.departmentId}
                onChange={(e) => {
                  setDeptAssign((p) => ({ ...p, departmentId: e.target.value }));
                  if (assignErrors.departmentId) setAssignErrors((p) => ({ ...p, departmentId: '' }));
                }}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls} ${assignErrors.departmentId ? 'border-red-400' : ''}`}
              >
                <option value="">اختر القسم...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              {assignErrors.departmentId && (
                <p className="mt-1 text-xs text-red-500">{assignErrors.departmentId}</p>
              )}
            </div>

            {/* Shift select */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                النوبة <span className="text-red-500">*</span>
              </label>
              <select
                value={deptAssign.workShiftId}
                onChange={(e) => {
                  setDeptAssign((p) => ({ ...p, workShiftId: e.target.value }));
                  if (assignErrors.workShiftId) setAssignErrors((p) => ({ ...p, workShiftId: '' }));
                }}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls} ${assignErrors.workShiftId ? 'border-red-400' : ''}`}
              >
                <option value="">اختر النوبة...</option>
                {shifts.filter((s) => s.isActive).map((s) => (
                  <option key={s.id} value={s.id}>{s.nameAr} ({s.code})</option>
                ))}
              </select>
              {assignErrors.workShiftId && (
                <p className="mt-1 text-xs text-red-500">{assignErrors.workShiftId}</p>
              )}
            </div>

            {/* Effective From */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                من تاريخ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={deptAssign.effectiveFrom}
                onChange={(e) => {
                  setDeptAssign((p) => ({ ...p, effectiveFrom: e.target.value }));
                  if (assignErrors.effectiveFrom) setAssignErrors((p) => ({ ...p, effectiveFrom: '' }));
                }}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls} ${assignErrors.effectiveFrom ? 'border-red-400' : ''}`}
              />
              {assignErrors.effectiveFrom && (
                <p className="mt-1 text-xs text-red-500">{assignErrors.effectiveFrom}</p>
              )}
            </div>

            {/* Effective To */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                إلى تاريخ
              </label>
              <input
                type="date"
                value={deptAssign.effectiveTo}
                onChange={(e) => setDeptAssign((p) => ({ ...p, effectiveTo: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls}`}
              />
              <p className={`mt-1 text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                اتركه فارغاً إذا كان مفتوح المدة
              </p>
            </div>
          </div>
        )}

        {/* Employee Assignment */}
        {assignTab === 'employee' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Employee ID */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                  رقم الموظف <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={empAssign.employeeId}
                  onChange={(e) => {
                    setEmpAssign((p) => ({ ...p, employeeId: e.target.value }));
                    if (assignErrors.employeeId) setAssignErrors((p) => ({ ...p, employeeId: '' }));
                  }}
                  placeholder="أدخل رقم الموظف"
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls} ${assignErrors.employeeId ? 'border-red-400' : ''}`}
                />
                {assignErrors.employeeId && (
                  <p className="mt-1 text-xs text-red-500">{assignErrors.employeeId}</p>
                )}
              </div>

              {/* Shift select */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                  النوبة <span className="text-red-500">*</span>
                </label>
                <select
                  value={empAssign.workShiftId}
                  onChange={(e) => {
                    setEmpAssign((p) => ({ ...p, workShiftId: e.target.value }));
                    if (assignErrors.workShiftId) setAssignErrors((p) => ({ ...p, workShiftId: '' }));
                  }}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls} ${assignErrors.workShiftId ? 'border-red-400' : ''}`}
                >
                  <option value="">اختر النوبة...</option>
                  {shifts.filter((s) => s.isActive).map((s) => (
                    <option key={s.id} value={s.id}>{s.nameAr} ({s.code})</option>
                  ))}
                </select>
                {assignErrors.workShiftId && (
                  <p className="mt-1 text-xs text-red-500">{assignErrors.workShiftId}</p>
                )}
              </div>

              {/* Effective From */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                  من تاريخ <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={empAssign.effectiveFrom}
                  onChange={(e) => {
                    setEmpAssign((p) => ({ ...p, effectiveFrom: e.target.value }));
                    if (assignErrors.effectiveFrom) setAssignErrors((p) => ({ ...p, effectiveFrom: '' }));
                  }}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls} ${assignErrors.effectiveFrom ? 'border-red-400' : ''}`}
                />
                {assignErrors.effectiveFrom && (
                  <p className="mt-1 text-xs text-red-500">{assignErrors.effectiveFrom}</p>
                )}
              </div>

              {/* Effective To */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  value={empAssign.effectiveTo}
                  onChange={(e) => setEmpAssign((p) => ({ ...p, effectiveTo: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls}`}
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                سبب التعيين
              </label>
              <input
                type="text"
                value={empAssign.reason}
                onChange={(e) => setEmpAssign((p) => ({ ...p, reason: e.target.value }))}
                placeholder="مثال: انتقال الموظف لفرع آخر"
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls}`}
              />
            </div>
          </div>
        )}

        {/* Assign button */}
        <div className="mt-6 flex justify-start">
          <button
            onClick={handleAssign}
            disabled={assignSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {assignSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري التعيين...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                تعيين النوبة
              </>
            )}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* Section 2: Create/Edit Shift Modal                         */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
          <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl border ${card}`}>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold font-cairo">
                {editingShift ? 'تعديل النوبة' : 'إضافة نوبة جديدة'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className={`p-1 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors duration-200`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              {/* Names row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                    الاسم بالعربي <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => handleFormChange('nameAr', e.target.value)}
                    placeholder="مثال: الفترة الصباحية"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls} ${formErrors.nameAr ? 'border-red-400' : ''}`}
                  />
                  {formErrors.nameAr && <p className="mt-1 text-xs text-red-500">{formErrors.nameAr}</p>}
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                    الاسم بالإنجليزي
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => handleFormChange('nameEn', e.target.value)}
                    placeholder="e.g. Morning Shift"
                    dir="ltr"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls}`}
                  />
                </div>
              </div>

              {/* Code + Times */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                    الرمز <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleFormChange('code', e.target.value.toUpperCase())}
                    placeholder="مثال: MRN"
                    dir="ltr"
                    className={`w-full px-3 py-2 rounded-lg border text-sm font-mono focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls} ${formErrors.code ? 'border-red-400' : ''}`}
                  />
                  {formErrors.code && <p className="mt-1 text-xs text-red-500">{formErrors.code}</p>}
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                    وقت البداية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleFormChange('startTime', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls} ${formErrors.startTime ? 'border-red-400' : ''}`}
                  />
                  {formErrors.startTime && <p className="mt-1 text-xs text-red-500">{formErrors.startTime}</p>}
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                    وقت النهاية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleFormChange('endTime', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls} ${formErrors.endTime ? 'border-red-400' : ''}`}
                  />
                  {formErrors.endTime && <p className="mt-1 text-xs text-red-500">{formErrors.endTime}</p>}
                </div>
              </div>

              {/* Duration fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                    مدة الاستراحة (دقيقة)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.breakDurationMinutes}
                    onChange={(e) => handleFormChange('breakDurationMinutes', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                    فترة السماح (دقيقة)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.gracePeriodMinutes}
                    onChange={(e) => handleFormChange('gracePeriodMinutes', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                    بداية الوقت الإضافي بعد (دقيقة)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.overtimeStartAfterMinutes}
                    onChange={(e) => handleFormChange('overtimeStartAfterMinutes', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls}`}
                  />
                </div>
              </div>

              {/* Color + Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${labelCls}`}>
                    لون النوبة
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => handleFormChange('color', e.target.value)}
                      className="w-10 h-10 rounded-lg border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => handleFormChange('color', e.target.value)}
                      dir="ltr"
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm font-mono focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 outline-none transition-all duration-200 ${inputCls}`}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {/* isDefault */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => handleFormChange('isDefault', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400"
                    />
                    <span className={`text-sm ${labelCls}`}>نوبة افتراضية</span>
                  </label>

                  {/* isNightShift */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isNightShift}
                      onChange={(e) => handleFormChange('isNightShift', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400"
                    />
                    <span className={`text-sm ${labelCls}`}>نوبة ليلية</span>
                  </label>

                  {/* isActive */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleFormChange('isActive', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 focus:ring-green-500"
                    />
                    <span className={`text-sm ${labelCls}`}>فعالة</span>
                  </label>
                </div>
              </div>

              {/* Working hours preview */}
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'}`}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ساعات العمل المحسوبة: {calcWorkingHours(formData.startTime, formData.endTime)} ساعة
                {formData.breakDurationMinutes > 0 && (
                  <span className={`${darkMode ? 'text-gray-400' : 'text-blue-500'}`}>
                    (صافي بعد الاستراحة: {(() => {
                      const [sh, sm] = (formData.startTime || '').split(':').map(Number);
                      const [eh, em] = (formData.endTime || '').split(':').map(Number);
                      if (isNaN(sh) || isNaN(eh)) return '-';
                      let diff = (eh * 60 + em) - (sh * 60 + sm);
                      if (diff < 0) diff += 24 * 60;
                      diff -= formData.breakDurationMinutes;
                      if (diff < 0) return '-';
                      const h = Math.floor(diff / 60);
                      const m = diff % 60;
                      return m > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${h}`;
                    })()} ساعة)
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  darkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50'
                }`}
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveShift}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {editingShift ? 'تحديث النوبة' : 'إنشاء النوبة'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* Delete Confirmation Modal                                  */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showDeleteConfirm && editingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(false)} />
          <div className={`relative w-full max-w-md rounded-xl shadow-xl border p-6 ${card}`}>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold font-cairo mb-2">تأكيد الحذف</h3>
              <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                هل أنت متأكد من حذف النوبة{' '}
                <span className="font-bold">&quot;{editingShift.nameAr}&quot;</span>؟
                <br />
                لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                    darkMode
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50'
                  }`}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteShift}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري الحذف...
                    </>
                  ) : (
                    'نعم، احذف'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
