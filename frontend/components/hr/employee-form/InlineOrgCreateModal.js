import React, { useState } from 'react';
import { useOrganizationStructure } from '../../../context/OrganizationStructureContext';
import { useToast } from '../../../context/NotificationContext';

const TYPE_CONFIG = {
    department: { title: 'إضافة إدارة جديدة', nameLabel: 'اسم الإدارة *', icon: 'building' },
    section: { title: 'إضافة قسم جديد', nameLabel: 'اسم القسم *', icon: 'folder' },
    unit: { title: 'إضافة وحدة جديدة', nameLabel: 'اسم الوحدة *', icon: 'users' },
};

export default function InlineOrgCreateModal({ type, isOpen, onClose, parentId, departmentId, onCreated }) {
    const { addDepartment, addSection, addUnit } = useOrganizationStructure();
    const toast = useToast();
    const [form, setForm] = useState({ name: '', nameEn: '', code: '' });
    const [saving, setSaving] = useState(false);

    if (!isOpen || !type) return null;

    const config = TYPE_CONFIG[type];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.warning('الرجاء إدخال الاسم');
            return;
        }

        setSaving(true);
        try {
            let result;
            if (type === 'department') {
                result = await addDepartment({
                    name: form.name.trim(),
                    nameEn: form.nameEn.trim() || undefined,
                    code: form.code.trim() || undefined,
                });
            } else if (type === 'section') {
                result = await addSection({
                    name: form.name.trim(),
                    nameEn: form.nameEn.trim() || undefined,
                    code: form.code.trim() || undefined,
                    departmentId: parentId,
                });
            } else if (type === 'unit') {
                result = await addUnit({
                    name: form.name.trim(),
                    nameEn: form.nameEn.trim() || undefined,
                    code: form.code.trim() || undefined,
                    departmentId: departmentId,
                    sectionId: parentId,
                });
            }

            toast.success(`تم إنشاء ${config.nameLabel.replace(' *', '')} بنجاح`);
            onCreated(result);
            setForm({ name: '', nameEn: '', code: '' });
            onClose();
        } catch (error) {
            console.error('Error creating org entity:', error);
            toast.error(`فشل في الإنشاء: ${error?.message || 'خطأ غير معروف'}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{config.title}</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{config.nameLabel}</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="الاسم بالعربية"
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">الاسم بالإنجليزية</label>
                        <input
                            type="text"
                            name="nameEn"
                            value={form.nameEn}
                            onChange={handleChange}
                            placeholder="English Name"
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                            dir="ltr"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">الرمز</label>
                        <input
                            type="text"
                            name="code"
                            value={form.code}
                            onChange={handleChange}
                            placeholder="مثال: IT-001"
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                            dir="ltr"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 rounded-lg transition font-medium"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !form.name.trim()}
                        className="px-5 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                إضافة
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
