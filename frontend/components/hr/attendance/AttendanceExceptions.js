import React, { useState, useEffect } from 'react';
import { DataTable, Button, Badge, Modal } from '../../ui';


import { fmtDate } from '../../../utils/hijriDate';

export default function AttendanceExceptions({ darkMode }) {
  const [exceptions, setExceptions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedException, setSelectedException] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    empId: '',
    note: '',
    exceptionType: 'temporary'
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExceptions();
    loadEmployees();
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

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const mockExceptions = [
        {
          id: 1,
          empId: 25,
          arName: 'أحمد محمد',
          autoSerial: 1025,
          job: 'مدير مشروع',
          management: 'الإدارة التنفيذية',
          note: 'منتدب خارجياً - 3 أشهر',
          exceptionType: 'temporary',
          addDate: '2026-01-15',
          addedByName: 'مدير الموارد البشرية'
        },
        {
          id: 2,
          empId: 47,
          arName: 'فاطمة أحمد',
          autoSerial: 1047,
          job: 'محلل مالي',
          management: 'إدارة المالية',
          note: 'إجازة دراسية - سنة واحدة',
          exceptionType: 'long_leave',
          addDate: '2026-01-10',
          addedByName: 'مدير الموارد البشرية'
        }
      ];
      setExceptions(mockExceptions);
    } catch (error) {
      console.error('Error fetching exceptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddException = async () => {
    // Validate
    const errors = {};
    if (!formData.empId) errors.empId = 'يرجى اختيار موظف';
    if (!formData.note.trim()) errors.note = 'يرجى إدخال سبب الاستثناء';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Check if employee already has exception
    if (exceptions.some(e => e.empId === Number(formData.empId))) {
      setFormErrors({ empId: 'هذا الموظف لديه استثناء مسجل بالفعل' });
      return;
    }

    setSaving(true);
    try {
      const employee = employees.find(e => e.empId === Number(formData.empId));

      const newException = {
        id: Date.now(),
        empId: Number(formData.empId),
        arName: employee?.arName || 'موظف',
        autoSerial: employee?.autoSerial || formData.empId,
        job: employee?.job || '-',
        management: employee?.management || '-',
        note: formData.note,
        exceptionType: formData.exceptionType,
        addDate: new Date().toISOString().split('T')[0],
        addedByName: 'المستخدم الحالي'
      };

      setExceptions([...exceptions, newException]);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding exception:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteException = async () => {
    if (!selectedException) return;

    setSaving(true);
    try {
      setExceptions(exceptions.filter(e => e.id !== selectedException.id));
      setShowDeleteModal(false);
      setSelectedException(null);
    } catch (error) {
      console.error('Error deleting exception:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      empId: '',
      note: '',
      exceptionType: 'temporary'
    });
    setFormErrors({});
  };

  const getExceptionTypeBadge = (type) => {
    const types = {
      temporary: { label: 'مؤقت', color: 'yellow' },
      long_leave: { label: 'إجازة طويلة', color: 'blue' },
      secondment: { label: 'انتداب', color: 'purple' },
      remote: { label: 'عمل عن بعد', color: 'green' },
      permanent: { label: 'دائم', color: 'gray' }
    };
    const config = types[type] || types.temporary;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const columns = [
    {
      key: 'autoSerial',
      label: 'الرقم الوظيفي',
      render: (_, row) => <span className="font-medium">{row.autoSerial}</span>
    },
    {
      key: 'arName',
      label: 'اسم الموظف',
      render: (_, row) => <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{row.arName}</span>
    },
    {
      key: 'job',
      label: 'الوظيفة',
      render: (_, row) => <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{row.job}</span>
    },
    {
      key: 'management',
      label: 'الإدارة',
      render: (_, row) => <span className={darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}>{row.management}</span>
    },
    {
      key: 'exceptionType',
      label: 'نوع الاستثناء',
      render: (_, row) => getExceptionTypeBadge(row.exceptionType)
    },
    {
      key: 'note',
      label: 'سبب الاستثناء',
      render: (_, row) => <span className="text-sm">{row.note}</span>
    },
    {
      key: 'addDate',
      label: 'تاريخ الإضافة',
      render: (_, row) => fmtDate(row.addDate)
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      render: (_, row) => (
        <button
          onClick={() => {
            setSelectedException(row);
            setShowDeleteModal(true);
          }}
          className={`p-2 rounded-lg transition-colors ${
            darkMode
              ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100'
          }`}
          title="إزالة الاستثناء"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )
    }
  ];

  // Filter out employees who already have exceptions
  const availableEmployees = employees.filter(
    emp => !exceptions.some(ex => ex.empId === emp.empId)
  );

  return (
    <div>
      {/* Warning Banner */}
      <div className={`p-4 rounded-xl mb-4 ${
        darkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
      }`}>
        <div className="flex items-start gap-3">
          <svg className={`w-6 h-6 flex-shrink-0 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className={`font-semibold mb-1 ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
              تنبيه: استثناءات البصمة
            </h4>
            <p className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
              الموظفون المستثنون من كشوفات الحضور لن يظهروا في التقارير اليومية. يُستخدم هذا للموظفين في إجازات طويلة أو منتدبين خارجياً أو العاملين عن بعد.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-4 flex justify-between items-center">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
          قائمة الموظفين المستثنين ({exceptions.length})
        </h3>
        <Button onClick={() => {
          resetForm();
          setShowAddModal(true);
        }}>
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          إضافة استثناء
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={exceptions}
        loading={loading}
        darkMode={darkMode}
        emptyMessage="لا توجد استثناءات مسجلة"
      />

      {/* Add Exception Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="إضافة استثناء جديد"
        darkMode={darkMode}
      >
        <div className="space-y-4">
          {/* Employee Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              الموظف <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.empId}
              onChange={(e) => {
                setFormData({ ...formData, empId: e.target.value });
                setFormErrors({ ...formErrors, empId: '' });
              }}
              className={`w-full px-3 py-2 rounded-lg border ${
                formErrors.empId
                  ? 'border-red-500'
                  : darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <option value="">اختر موظفاً...</option>
              {availableEmployees.map((emp) => (
                <option key={emp.empId} value={emp.empId}>
                  {emp.autoSerial} - {emp.arName} ({emp.job})
                </option>
              ))}
            </select>
            {formErrors.empId && (
              <p className="text-red-500 text-xs mt-1">{formErrors.empId}</p>
            )}
          </div>

          {/* Exception Type */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              نوع الاستثناء
            </label>
            <select
              value={formData.exceptionType}
              onChange={(e) => setFormData({ ...formData, exceptionType: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <option value="temporary">مؤقت</option>
              <option value="long_leave">إجازة طويلة</option>
              <option value="secondment">انتداب</option>
              <option value="remote">عمل عن بعد</option>
              <option value="permanent">دائم</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
              سبب الاستثناء <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => {
                setFormData({ ...formData, note: e.target.value });
                setFormErrors({ ...formErrors, note: '' });
              }}
              rows={3}
              placeholder="مثال: منتدب لمشروع خارجي لمدة 6 أشهر"
              className={`w-full px-3 py-2 rounded-lg border ${
                formErrors.note
                  ? 'border-red-500'
                  : darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 dark:placeholder-gray-500'
                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500'
              }`}
            />
            {formErrors.note && (
              <p className="text-red-500 text-xs mt-1">{formErrors.note}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleAddException} disabled={saving} className="flex-1">
              {saving ? 'جاري الحفظ...' : 'إضافة الاستثناء'}
            </Button>
            <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedException(null);
        }}
        title="تأكيد إزالة الاستثناء"
        darkMode={darkMode}
      >
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
              هل أنت متأكد من إزالة استثناء الموظف:
            </p>
            <p className={`font-bold mt-2 text-lg ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {selectedException?.arName}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {selectedException?.job} - {selectedException?.management}
            </p>
          </div>

          <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
            ⚠️ بعد الإزالة، سيظهر هذا الموظف في تقارير الحضور اليومية
          </p>

          <div className="flex gap-2 pt-4">
            <Button
              variant="danger"
              onClick={handleDeleteException}
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'جاري الإزالة...' : 'نعم، إزالة الاستثناء'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedException(null);
              }}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
