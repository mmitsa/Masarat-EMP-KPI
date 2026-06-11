/**
 * تبويب أصحاب الصلاحية والاعتمادات
 * يُستخدم داخل صفحة إعدادات الجهة (organization.js)
 *
 * يسمح بتعريف مناصب صلاحية، تعيين موظفين عليها،
 * تحديد الأنظمة والاعتمادات، ورفع التوقيعات.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../ui/Modal';
import { Button, Badge } from '../ui';

// ═══════════════════════════════════════════
// الثوابت
// ═══════════════════════════════════════════

const POSITION_TYPES = [
    { value: 'authority_holder', label: 'صاحب صلاحية' },
    { value: 'deputy', label: 'نائب صاحب الصلاحية' },
    { value: 'financial', label: 'مسؤول مالي' },
    { value: 'administrative', label: 'مسؤول إداري' },
    { value: 'custom', label: 'مخصص' },
];

const SYSTEMS_LIST = [
    { code: 'hr', label: 'الموارد البشرية', icon: '👥' },
    { code: 'warehouse', label: 'المستودعات', icon: '📦' },
    { code: 'finance', label: 'المالية', icon: '💰' },
    { code: 'archiving', label: 'الأرشيف', icon: '📂' },
    { code: 'movement', label: 'الحركة', icon: '🚗' },
    { code: 'projects', label: 'المشاريع', icon: '📋' },
    { code: 'procurement', label: 'المشتريات', icon: '🛒' },
    { code: 'grc', label: 'الحوكمة والمخاطر', icon: '🛡️' },
    { code: 'sadad', label: 'المدفوعات', icon: '💳' },
    { code: 'epm', label: 'إدارة الأداء', icon: '🎯' },
];

const DEFAULT_APPROVAL_TYPES = [
    'إجازات', 'صرف مستودعي', 'أوامر شراء', 'قرارات إدارية',
    'مخاطبات رسمية', 'عقود', 'مناقصات', 'تعيينات', 'ترقيات', 'نقل',
];

const POSITION_TYPE_COLORS = {
    authority_holder: 'bg-purple-100 text-purple-800 dark:text-purple-200',
    deputy: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    financial: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    administrative: 'bg-orange-100 text-orange-800 dark:text-orange-200',
    custom: 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200',
};

const EMPTY_FORM = {
    positionTitleAr: '',
    positionTitleEn: '',
    positionType: 'authority_holder',
    employeeId: null,
    employeeName: '',
    employeeNumber: '',
    jobTitle: '',
    systems: [],
    approvalTypes: [],
    signatureImage: null,
    signatureSource: 'employee', // 'employee' | 'custom'
    sortOrder: 0,
};

// ═══════════════════════════════════════════
// المكون الرئيسي
// ═══════════════════════════════════════════

export default function AuthoritiesTab() {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    // بحث الموظفين
    const [empSearch, setEmpSearch] = useState('');
    const [empResults, setEmpResults] = useState([]);
    const [empSearching, setEmpSearching] = useState(false);
    const empSearchTimer = useRef(null);

    // اعتماد مخصص
    const [customApproval, setCustomApproval] = useState('');

    // رفع التوقيع
    const fileInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    // ─── جلب البيانات ───────────────────────
    const fetchPositions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/authorities');
            const json = await res.json();
            if (json.success) setPositions(json.data || []);
        } catch (err) {
            console.error('Error fetching authorities:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPositions(); }, [fetchPositions]);

    // ─── بحث الموظفين ───────────────────────
    useEffect(() => {
        if (!empSearch || empSearch.length < 2) {
            setEmpResults([]);
            return;
        }
        clearTimeout(empSearchTimer.current);
        empSearchTimer.current = setTimeout(async () => {
            setEmpSearching(true);
            try {
                const res = await fetch(`/api/hr/employees?search=${encodeURIComponent(empSearch)}&limit=8`);
                const json = await res.json();
                if (json.success) {
                    setEmpResults((json.data || []).map(e => ({
                        id: e.id,
                        name: e.name || e.arName || e.fullName || '-',
                        number: e.employeeNumber || e.employee_number || '',
                        jobTitle: e.jobTitle || e.job_title || '',
                        signatureImageUrl: e.signatureImageUrl || null,
                    })));
                }
            } catch { /* silent */ }
            finally { setEmpSearching(false); }
        }, 400);
        return () => clearTimeout(empSearchTimer.current);
    }, [empSearch]);

    // ─── فتح المودال ─────────────────────────
    const openAdd = () => {
        setEditingId(null);
        setFormData({ ...EMPTY_FORM });
        setEmpSearch('');
        setEmpResults([]);
        setCustomApproval('');
        setShowModal(true);
    };

    const openEdit = (pos) => {
        setEditingId(pos.id);
        setFormData({
            positionTitleAr: pos.positionTitleAr || '',
            positionTitleEn: pos.positionTitleEn || '',
            positionType: pos.positionType || 'authority_holder',
            employeeId: pos.employeeId,
            employeeName: pos.employeeName || '',
            employeeNumber: pos.employeeNumber || '',
            jobTitle: pos.jobTitle || '',
            systems: pos.systems || [],
            approvalTypes: pos.approvalTypes || [],
            signatureImage: pos.signatureImage || null,
            signatureSource: pos.signatureImage ? 'custom' : 'employee',
            sortOrder: pos.sortOrder || 0,
        });
        setEmpSearch('');
        setEmpResults([]);
        setCustomApproval('');
        setShowModal(true);
    };

    // ─── اختيار موظف ────────────────────────
    const selectEmployee = (emp) => {
        setFormData(prev => ({
            ...prev,
            employeeId: emp.id,
            employeeName: emp.name,
            employeeNumber: emp.number,
            jobTitle: emp.jobTitle,
            signatureImage: prev.signatureSource === 'employee' ? emp.signatureImageUrl : prev.signatureImage,
        }));
        setEmpSearch('');
        setEmpResults([]);
    };

    const clearEmployee = () => {
        setFormData(prev => ({
            ...prev,
            employeeId: null,
            employeeName: '',
            employeeNumber: '',
            jobTitle: '',
            signatureImage: prev.signatureSource === 'employee' ? null : prev.signatureImage,
        }));
    };

    // ─── الأنظمة ────────────────────────────
    const toggleSystem = (code) => {
        setFormData(prev => ({
            ...prev,
            systems: prev.systems.includes(code)
                ? prev.systems.filter(s => s !== code)
                : [...prev.systems, code],
        }));
    };

    // ─── الاعتمادات ─────────────────────────
    const toggleApproval = (type) => {
        setFormData(prev => ({
            ...prev,
            approvalTypes: prev.approvalTypes.includes(type)
                ? prev.approvalTypes.filter(t => t !== type)
                : [...prev.approvalTypes, type],
        }));
    };

    const addCustomApproval = () => {
        const val = customApproval.trim();
        if (!val) return;
        if (!formData.approvalTypes.includes(val)) {
            setFormData(prev => ({
                ...prev,
                approvalTypes: [...prev.approvalTypes, val],
            }));
        }
        setCustomApproval('');
    };

    // ─── رفع التوقيع ────────────────────────
    const handleFileSelect = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('حجم الملف يجب أن لا يتجاوز 2 ميجابايت');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            setFormData(prev => ({ ...prev, signatureImage: e.target.result, signatureSource: 'custom' }));
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files[0]);
    };

    // ─── حفظ ────────────────────────────────
    const handleSave = async () => {
        if (!formData.positionTitleAr.trim()) {
            alert('يرجى إدخال عنوان المنصب');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                positionTitleAr: formData.positionTitleAr,
                positionTitleEn: formData.positionTitleEn || null,
                positionType: formData.positionType,
                employeeId: formData.employeeId || null,
                employeeName: formData.employeeName || null,
                employeeNumber: formData.employeeNumber || null,
                jobTitle: formData.jobTitle || null,
                systems: formData.systems,
                approvalTypes: formData.approvalTypes,
                signatureImage: formData.signatureImage || null,
                sortOrder: formData.sortOrder || 0,
            };

            const url = editingId ? `/api/admin/authorities?id=${editingId}` : '/api/admin/authorities';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = await res.json();

            if (json.success) {
                setShowModal(false);
                fetchPositions();
            } else {
                alert(json.error || 'حدث خطأ');
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('حدث خطأ أثناء الحفظ');
        } finally {
            setSaving(false);
        }
    };

    // ─── حذف ────────────────────────────────
    const handleDelete = async (id) => {
        if (!confirm('هل تريد حذف هذا المنصب؟')) return;
        setDeleting(id);
        try {
            const res = await fetch(`/api/admin/authorities?id=${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) fetchPositions();
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeleting(null);
        }
    };

    // ─── العرض ───────────────────────────────
    const positionTypeLabel = (type) => POSITION_TYPES.find(t => t.value === type)?.label || type;
    const systemLabel = (code) => SYSTEMS_LIST.find(s => s.code === code)?.label || code;
    const systemIcon = (code) => SYSTEMS_LIST.find(s => s.code === code)?.icon || '📌';

    return (
        <div className="space-y-6">
            {/* العنوان وزر الإضافة */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">أصحاب الصلاحية والاعتمادات</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">تعيين المسؤولين عن الأنظمة والقرارات والاعتمادات</p>
                </div>
                <Button variant="primary" size="md" onClick={openAdd}>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    إضافة منصب
                </Button>
            </div>

            {/* قائمة المناصب */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : positions.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h4 className="text-gray-500 dark:text-gray-400 font-medium mb-1">لا توجد مناصب محددة</h4>
                    <p className="text-sm text-gray-400 mb-4">أضف أصحاب الصلاحية المسؤولين عن الأنظمة والقرارات</p>
                    <Button variant="primary" size="sm" onClick={openAdd}>إضافة أول منصب</Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {positions.map(pos => (
                        <div key={pos.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                                {/* المعلومات */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-base">{pos.positionTitleAr}</h4>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${POSITION_TYPE_COLORS[pos.positionType] || POSITION_TYPE_COLORS.custom}`}>
                                            {positionTypeLabel(pos.positionType)}
                                        </span>
                                    </div>

                                    {/* الموظف المعين */}
                                    {pos.employeeName ? (
                                        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-300">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span className="font-medium text-gray-800 dark:text-gray-100">{pos.employeeName}</span>
                                            {pos.employeeNumber && <span className="text-gray-400">• رقم {pos.employeeNumber}</span>}
                                            {pos.jobTitle && <span className="text-gray-400">• {pos.jobTitle}</span>}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-amber-600 mb-3 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                            لم يتم تعيين موظف بعد
                                        </p>
                                    )}

                                    {/* الأنظمة */}
                                    {pos.systems?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {pos.systems.map(sys => (
                                                <span key={sys} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium">
                                                    <span>{systemIcon(sys)}</span> {systemLabel(sys)}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* الاعتمادات */}
                                    {pos.approvalTypes?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {pos.approvalTypes.map(type => (
                                                <span key={type} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-lg text-xs">
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* التوقيع + الأزرار */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    {/* صورة التوقيع */}
                                    {pos.signatureImage ? (
                                        <div className="w-20 h-12 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 p-1 flex items-center justify-center">
                                            <img src={pos.signatureImage} alt="التوقيع" className="max-h-full max-w-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="w-20 h-12 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                                            <span className="text-xs text-gray-400">بدون توقيع</span>
                                        </div>
                                    )}

                                    {/* أزرار الإجراءات */}
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openEdit(pos)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="تعديل"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(pos.id)}
                                            disabled={deleting === pos.id}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="حذف"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══════════ مودال الإضافة/التعديل ═══════════ */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingId ? 'تعديل منصب' : 'إضافة منصب جديد'}
                size="lg"
            >
                <div className="space-y-5 max-h-[70vh] overflow-y-auto px-1">

                    {/* ── عنوان المنصب ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                عنوان المنصب بالعربي <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.positionTitleAr}
                                onChange={(e) => setFormData(prev => ({ ...prev, positionTitleAr: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm"
                                placeholder="مثال: المدير العام"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">عنوان المنصب بالإنجليزي</label>
                            <input
                                type="text"
                                value={formData.positionTitleEn}
                                onChange={(e) => setFormData(prev => ({ ...prev, positionTitleEn: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm"
                                placeholder="e.g. General Manager"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    {/* ── نوع المنصب ── */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">نوع المنصب</label>
                        <select
                            value={formData.positionType}
                            onChange={(e) => setFormData(prev => ({ ...prev, positionType: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm bg-white dark:bg-gray-900"
                        >
                            {POSITION_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* ── تعيين الموظف ── */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            تعيين الموظف
                        </label>

                        {formData.employeeId ? (
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                        {formData.employeeName?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{formData.employeeName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formData.employeeNumber && `رقم ${formData.employeeNumber}`}
                                            {formData.jobTitle && ` • ${formData.jobTitle}`}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={clearEmployee} className="text-red-500 hover:text-red-700 text-xs font-medium">
                                    إزالة
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={empSearch}
                                    onChange={(e) => setEmpSearch(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm pr-10"
                                    placeholder="ابحث عن موظف بالاسم أو الرقم..."
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    {empSearching ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent" />
                                    ) : (
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    )}
                                </div>

                                {/* نتائج البحث */}
                                {empResults.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                        {empResults.map(emp => (
                                            <button
                                                key={emp.id}
                                                onClick={() => selectEmployee(emp)}
                                                className="w-full text-right px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0 flex items-center gap-3"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-bold flex-shrink-0">
                                                    {emp.name?.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{emp.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{emp.number} {emp.jobTitle && `• ${emp.jobTitle}`}</p>
                                                </div>
                                                {emp.signatureImageUrl && (
                                                    <span className="text-green-500 text-xs flex-shrink-0">✓ توقيع</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── الأنظمة ── */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            الأنظمة المسؤول عنها
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {SYSTEMS_LIST.map(sys => {
                                const checked = formData.systems.includes(sys.code);
                                return (
                                    <button
                                        key={sys.code}
                                        onClick={() => toggleSystem(sys.code)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                                            checked
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 text-blue-800 dark:text-blue-200 font-medium'
                                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                                        }`}
                                    >
                                        <span>{sys.icon}</span>
                                        <span>{sys.label}</span>
                                        {checked && (
                                            <svg className="w-4 h-4 mr-auto text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── أنواع الاعتمادات ── */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            أنواع الاعتمادات والقرارات
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {DEFAULT_APPROVAL_TYPES.map(type => {
                                const checked = formData.approvalTypes.includes(type);
                                return (
                                    <button
                                        key={type}
                                        onClick={() => toggleApproval(type)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                            checked
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 text-green-800 dark:text-green-200'
                                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                                        }`}
                                    >
                                        {checked && '✓ '}{type}
                                    </button>
                                );
                            })}
                        </div>
                        {/* إضافة نوع مخصص */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customApproval}
                                onChange={(e) => setCustomApproval(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomApproval())}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                placeholder="إضافة نوع اعتماد مخصص..."
                            />
                            <button
                                onClick={addCustomApproval}
                                disabled={!customApproval.trim()}
                                className="px-3 py-2 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
                            >
                                إضافة
                            </button>
                        </div>
                    </div>

                    {/* ── التوقيع ── */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            التوقيع
                        </label>

                        {/* خيارات مصدر التوقيع */}
                        <div className="flex gap-4 mb-3">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="sigSource"
                                    checked={formData.signatureSource === 'employee'}
                                    onChange={() => setFormData(prev => ({ ...prev, signatureSource: 'employee', signatureImage: null }))}
                                    className="text-blue-600 dark:text-blue-400"
                                />
                                سحب من ملف الموظف
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="sigSource"
                                    checked={formData.signatureSource === 'custom'}
                                    onChange={() => setFormData(prev => ({ ...prev, signatureSource: 'custom' }))}
                                    className="text-blue-600 dark:text-blue-400"
                                />
                                رفع توقيع مخصص
                            </label>
                        </div>

                        {formData.signatureSource === 'custom' ? (
                            <>
                                {/* منطقة الرفع */}
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                                        dragOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">اسحب صورة التوقيع هنا أو اضغط للاختيار</p>
                                    <p className="text-xs text-gray-400">PNG, JPG — حد أقصى 2 ميجابايت</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                />
                            </>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                سيتم سحب التوقيع تلقائياً من ملف الموظف المعين (إن وجد).
                            </p>
                        )}

                        {/* معاينة التوقيع */}
                        {formData.signatureImage && (
                            <div className="mt-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">معاينة التوقيع</span>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, signatureImage: null }))}
                                        className="text-xs text-red-500 hover:text-red-700"
                                    >
                                        مسح
                                    </button>
                                </div>
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center justify-center">
                                    <img src={formData.signatureImage} alt="التوقيع" className="max-h-20 max-w-full object-contain" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* أزرار الحفظ */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
                    <button
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/50 rounded-xl hover:bg-gray-200 transition text-sm font-medium"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !formData.positionTitleAr.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {editingId ? 'تحديث' : 'حفظ'}
                            </>
                        )}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
