/**
 * مودال رفع الصورة الشخصية للموظف
 * Employee Photo Upload Modal
 */

import React, { useState, useRef, useEffect } from 'react';
import Modal from '../../ui/Modal';
import api from '../../../lib/api';

export default function PhotoUploadModal({ isOpen, onClose, employee, onSaveComplete }) {
    const [photoPreview, setPhotoPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && employee?.photoUrl) {
            setPhotoPreview(employee.photoUrl);
        } else if (!isOpen) {
            setPhotoPreview(null);
        }
    }, [isOpen, employee?.photoUrl]);

    const handleFileSelect = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('يرجى اختيار ملف صورة فقط');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('حجم الملف يجب أن لا يتجاوز 5 ميجابايت');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => setPhotoPreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const handleSave = async () => {
        if (!photoPreview || !employee?.id) return;
        setSaving(true);
        try {
            await api.hr.uploadPhoto(employee.id, { photoUrl: photoPreview });
            onSaveComplete?.({ ...employee, photoUrl: photoPreview });
            onClose();
        } catch (err) {
            console.error('Error saving photo:', err);
            alert('حدث خطأ أثناء حفظ الصورة');
        } finally {
            setSaving(false);
        }
    };

    const handleClear = () => {
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="الصورة الشخصية للموظف" size="md">
            <div className="space-y-6">
                {/* معلومات الموظف */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {employee?.name?.charAt(0)}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{employee?.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{employee?.position} - {employee?.department_name}</p>
                    </div>
                </div>

                {/* معاينة الصورة الحالية */}
                {photoPreview && (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-32 h-40 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-900/20">
                            <img
                                src={photoPreview}
                                alt="الصورة الشخصية"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            onClick={handleClear}
                            className="text-xs text-red-500 hover:text-red-700 transition"
                        >
                            إزالة الصورة
                        </button>
                    </div>
                )}

                {/* منطقة الرفع */}
                {!photoPreview && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">الصورة الشخصية</label>
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                dragOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                        >
                            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">اسحب صورة الموظف هنا أو اضغط للاختيار</p>
                            <p className="text-xs text-gray-400">PNG, JPG - حد أقصى 5 ميجابايت</p>
                            <p className="text-xs text-gray-400 mt-1">يُفضل صورة بحجم 3×4 بخلفية بيضاء</p>
                        </div>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                />

                {/* ملاحظة */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        الصورة الشخصية ستظهر في بطاقة تعريف الموظف والتقارير الرسمية
                    </p>
                </div>
            </div>

            {/* أزرار */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
                <button onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 transition">
                    إلغاء
                </button>
                {photoPreview && !employee?.photoUrl?.startsWith(photoPreview?.substring(0, 30) || '') && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {saving ? 'جاري الحفظ...' : 'حفظ الصورة'}
                    </button>
                )}
                {!photoPreview && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        اختيار صورة
                    </button>
                )}
            </div>
        </Modal>
    );
}
