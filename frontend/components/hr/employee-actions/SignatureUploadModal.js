/**
 * مودال رفع توقيع الموظف
 * Employee Signature Upload Modal
 */

import React, { useState, useRef, useEffect } from 'react';
import Modal from '../../ui/Modal';
import api from '../../../lib/api';

export default function SignatureUploadModal({ isOpen, onClose, employee, onSaveComplete }) {
    const [signaturePreview, setSignaturePreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && employee?.signatureImageUrl) {
            setSignaturePreview(employee.signatureImageUrl);
        } else if (!isOpen) {
            setSignaturePreview(null);
        }
    }, [isOpen, employee?.signatureImageUrl]);

    const handleFileSelect = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('يرجى اختيار ملف صورة فقط');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('حجم الملف يجب أن لا يتجاوز 2 ميجابايت');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => setSignaturePreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const handleSave = async () => {
        if (!signaturePreview || !employee?.id) return;
        setSaving(true);
        try {
            await api.hr.uploadSignature(employee.id, { signatureImageUrl: signaturePreview });
            onSaveComplete?.({ ...employee, signatureImageUrl: signaturePreview });
            onClose();
        } catch (err) {
            console.error('Error saving signature:', err);
            alert('حدث خطأ أثناء حفظ التوقيع');
        } finally {
            setSaving(false);
        }
    };

    const handleClear = () => {
        setSignaturePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="رفع توقيع الموظف" size="md">
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

                {/* منطقة الرفع */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">صورة التوقيع</label>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                            dragOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                    >
                        <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">اسحب صورة التوقيع هنا أو اضغط للاختيار</p>
                        <p className="text-xs text-gray-400">PNG, JPG - حد أقصى 2 ميجابايت</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files[0])}
                    />
                </div>

                {/* معاينة التوقيع */}
                {signaturePreview && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">معاينة التوقيع</label>
                            <button
                                onClick={handleClear}
                                className="text-xs text-red-500 hover:text-red-700 transition"
                            >
                                مسح التوقيع
                            </button>
                        </div>
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-center">
                            <img
                                src={signaturePreview}
                                alt="التوقيع"
                                className="max-h-24 max-w-full object-contain"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* أزرار */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
                <button onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 transition">
                    إلغاء
                </button>
                <button
                    onClick={handleSave}
                    disabled={!signaturePreview || saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {saving ? 'جاري الحفظ...' : 'حفظ التوقيع'}
                </button>
            </div>
        </Modal>
    );
}
