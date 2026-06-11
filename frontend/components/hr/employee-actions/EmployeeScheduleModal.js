/**
 * مودال جدول العمل الخاص بالموظف
 * Employee Custom Schedule Assignment Modal
 */

import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import api from '../../../lib/api';

import { fmtDate } from '../../../utils/hijriDate';

const SCHEDULE_TYPES = [
    { value: 'Custom', label: 'مخصص', desc: 'أوقات دوام مخصصة' },
    { value: 'Flexible', label: 'مرن', desc: 'دوام مرن بساعات حرة' },
    { value: 'Shift', label: 'ورديات', desc: 'نظام الورديات/النوبات' },
    { value: 'Exempted', label: 'مستثنى', desc: 'معفى من الحضور والانصراف' },
    { value: 'FieldWork', label: 'ميداني', desc: 'عمل ميداني خارج المقر' },
    { value: 'Remote', label: 'عن بُعد', desc: 'عمل عن بُعد' },
    { value: 'PartTime', label: 'جزئي', desc: 'دوام جزئي' },
];

const DAYS_OF_WEEK = [
    { value: 'Sunday', label: 'الأحد' },
    { value: 'Monday', label: 'الاثنين' },
    { value: 'Tuesday', label: 'الثلاثاء' },
    { value: 'Wednesday', label: 'الأربعاء' },
    { value: 'Thursday', label: 'الخميس' },
];

const STATUS_COLORS = {
    Pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    Approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    Rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    Cancelled: 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100',
};

const STATUS_LABELS = {
    Pending: 'في الانتظار',
    Approved: 'موافق عليه',
    Rejected: 'مرفوض',
    Cancelled: 'ملغي',
};

const DEFAULT_FORM = {
    scheduleType: 'Custom',
    startDate: '',
    endDate: '',
    customCheckInTime: '08:00',
    customCheckOutTime: '16:00',
    isExempted: false,
    exemptionReason: '',
    workReason: '',
    daysOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
};

export default function EmployeeScheduleModal({ isOpen, onClose, employee, onSaveComplete }) {
    const [schedules, setSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ ...DEFAULT_FORM });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && employee?.id) {
            loadSchedules();
        }
        if (!isOpen) {
            setShowForm(false);
            setFormData({ ...DEFAULT_FORM });
        }
    }, [isOpen, employee?.id]);

    const loadSchedules = async () => {
        setLoadingSchedules(true);
        try {
            const res = await api.hr.customSchedules.getByEmployee(employee.id);
            const data = res?.data?.data || res?.data || res || [];
            setSchedules(Array.isArray(data) ? data : []);
        } catch {
            setSchedules([]);
        } finally {
            setLoadingSchedules(false);
        }
    };

    const handleSave = async () => {
        if (!formData.startDate || !formData.workReason) {
            alert('يرجى تعبئة تاريخ البداية وسبب المواعيد الخاصة');
            return;
        }
        setSaving(true);
        try {
            await api.hr.customSchedules.create({
                employeeId: employee.id,
                employeeNameAr: employee.name,
                departmentNameAr: employee.department_name,
                ...formData,
            });
            setShowForm(false);
            setFormData({ ...DEFAULT_FORM });
            await loadSchedules();
            onSaveComplete?.();
        } catch (err) {
            console.error('Error creating schedule:', err);
            alert('حدث خطأ أثناء حفظ الجدول');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const toggleDay = (day) => {
        setFormData(prev => ({
            ...prev,
            daysOfWeek: prev.daysOfWeek.includes(day)
                ? prev.daysOfWeek.filter(d => d !== day)
                : [...prev.daysOfWeek, day],
        }));
    };

    const needsTimes = !['Exempted', 'FieldWork'].includes(formData.scheduleType);

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`جدول العمل الخاص - ${employee?.name}`} size="lg">
            <div className="space-y-6">
                {/* الجداول الحالية */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">الجداول الحالية</h4>
                        {!showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                إضافة جدول جديد
                            </button>
                        )}
                    </div>

                    {loadingSchedules ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">جاري التحميل...</div>
                    ) : schedules.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">لا توجد جداول عمل خاصة</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">النوع</th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">من</th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">إلى</th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">الدخول</th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">الخروج</th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {schedules.map((s, i) => (
                                        <tr key={s.id || i} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 font-medium">
                                                {SCHEDULE_TYPES.find(t => t.value === s.scheduleType)?.label || s.scheduleTypeAr || s.scheduleType}
                                            </td>
                                            <td className="px-3 py-2">{fmtDate(s.startDate)}</td>
                                            <td className="px-3 py-2">{s.endDate ? fmtDate(s.endDate) : 'مفتوح'}</td>
                                            <td className="px-3 py-2">{s.customCheckInTime || '-'}</td>
                                            <td className="px-3 py-2">{s.customCheckOutTime || '-'}</td>
                                            <td className="px-3 py-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.approvalStatus] || STATUS_COLORS.Pending}`}>
                                                    {STATUS_LABELS[s.approvalStatus] || s.approvalStatus || 'في الانتظار'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* نموذج إضافة جدول جديد */}
                {showForm && (
                    <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-5 bg-blue-50/30">
                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-4">إضافة جدول عمل جديد</h4>

                        <div className="grid grid-cols-2 gap-4">
                            {/* نوع الجدول */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">نوع الجدول</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {SCHEDULE_TYPES.map(type => (
                                        <button
                                            key={type.value}
                                            onClick={() => updateField('scheduleType', type.value)}
                                            className={`p-2 rounded-lg border text-sm text-center transition ${
                                                formData.scheduleType === type.value
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                                            }`}
                                        >
                                            <p className="font-medium">{type.label}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{type.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* التواريخ */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">تاريخ البداية *</label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => updateField('startDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">تاريخ النهاية</label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => updateField('endDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                                />
                            </div>

                            {/* أوقات الدخول والخروج */}
                            {needsTimes && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">وقت الدخول</label>
                                        <input
                                            type="time"
                                            value={formData.customCheckInTime}
                                            onChange={(e) => updateField('customCheckInTime', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">وقت الخروج</label>
                                        <input
                                            type="time"
                                            value={formData.customCheckOutTime}
                                            onChange={(e) => updateField('customCheckOutTime', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                                        />
                                    </div>
                                </>
                            )}

                            {/* سبب المواعيد الخاصة */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">سبب المواعيد الخاصة *</label>
                                <textarea
                                    value={formData.workReason}
                                    onChange={(e) => updateField('workReason', e.target.value)}
                                    rows={2}
                                    placeholder="اذكر سبب تعيين مواعيد عمل خاصة لهذا الموظف..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 resize-none"
                                />
                            </div>

                            {/* الإعفاء */}
                            <div className="col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isExempted}
                                        onChange={(e) => updateField('isExempted', e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">معفى من تسجيل الحضور والانصراف</span>
                                </label>
                                {formData.isExempted && (
                                    <input
                                        type="text"
                                        value={formData.exemptionReason}
                                        onChange={(e) => updateField('exemptionReason', e.target.value)}
                                        placeholder="سبب الإعفاء..."
                                        className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                                    />
                                )}
                            </div>

                            {/* أيام العمل */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">أيام العمل</label>
                                <div className="flex gap-2">
                                    {DAYS_OF_WEEK.map(day => (
                                        <button
                                            key={day.value}
                                            onClick={() => toggleDay(day.value)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                                formData.daysOfWeek.includes(day.value)
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                            }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* أزرار النموذج */}
                        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                            <button
                                onClick={() => { setShowForm(false); setFormData({ ...DEFAULT_FORM }); }}
                                className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 transition"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                            >
                                {saving ? 'جاري الحفظ...' : 'حفظ الجدول'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
