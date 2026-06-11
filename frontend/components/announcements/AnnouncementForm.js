import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../ui';
import { ANNOUNCEMENT_TYPES, ANNOUNCEMENT_PRIORITIES } from '../../context/AnnouncementPopupContext';
import { PhotoIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/AppContext';

// شروط الصورة
const IMAGE_CONSTRAINTS = {
    maxSizeMB: 5,
    maxSizeBytes: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: '.jpg,.jpeg,.png,.webp,.gif',
    minWidth: 400,
    minHeight: 300,
    recommendedWidth: 1200,
    recommendedHeight: 800,
};

/**
 * AnnouncementForm - فورم إنشاء/تعديل الإعلان
 * يُستخدم داخل Modal في صفحة الإدارة
 */
export default function AnnouncementForm({ initialData, onSubmit, onCancel, isEditing = false }) {
    const { darkMode } = useTheme();

    const [formData, setFormData] = useState({
        titleAr: initialData?.titleAr || '',
        contentAr: initialData?.contentAr || '',
        type: initialData?.type || 'general',
        priority: initialData?.priority || 'normal',
        timerDuration: initialData?.timerDuration || 15,
        publishAt: initialData?.publishAt ? initialData.publishAt.slice(0, 16) : '',
        expiresAt: initialData?.expiresAt ? initialData.expiresAt.slice(0, 16) : '',
        publishNow: false,
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(initialData?.imageUrl || null);
    const [imageError, setImageError] = useState(null);
    const [imageDimensions, setImageDimensions] = useState(null);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    const inputClass = darkMode
        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 dark:focus:border-blue-400 focus:ring-blue-500/20'
        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20';

    const labelClass = darkMode ? 'text-gray-200' : 'text-gray-700';

    const handleChange = useCallback((field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }));
        }
    }, [errors]);

    // معالجة رفع الصورة
    const handleImageUpload = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageError(null);
        setImageDimensions(null);

        // فحص النوع
        if (!IMAGE_CONSTRAINTS.allowedTypes.includes(file.type)) {
            setImageError('نوع الملف غير مدعوم. الأنواع المسموحة: JPG, PNG, WebP, GIF');
            return;
        }

        // فحص الحجم
        if (file.size > IMAGE_CONSTRAINTS.maxSizeBytes) {
            setImageError(`حجم الملف (${(file.size / 1024 / 1024).toFixed(1)}MB) يتجاوز الحد الأقصى (${IMAGE_CONSTRAINTS.maxSizeMB}MB)`);
            return;
        }

        // فحص الأبعاد
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            const dims = { width: img.width, height: img.height };
            setImageDimensions(dims);

            if (img.width < IMAGE_CONSTRAINTS.minWidth || img.height < IMAGE_CONSTRAINTS.minHeight) {
                setImageError(`أبعاد الصورة (${img.width}×${img.height}) أصغر من الحد الأدنى (${IMAGE_CONSTRAINTS.minWidth}×${IMAGE_CONSTRAINTS.minHeight})`);
                URL.revokeObjectURL(objectUrl);
                return;
            }

            setImageFile(file);
            setImagePreview(objectUrl);
        };
        img.onerror = () => {
            setImageError('تعذر قراءة الصورة');
            URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;
    }, []);

    // إزالة الصورة
    const removeImage = useCallback(() => {
        setImageFile(null);
        setImagePreview(null);
        setImageDimensions(null);
        setImageError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    // التحقق من الصحة
    const validate = useCallback(() => {
        const newErrors = {};
        if (!formData.titleAr.trim()) newErrors.titleAr = 'العنوان مطلوب';
        else if (formData.titleAr.length > 500) newErrors.titleAr = 'العنوان يتجاوز 500 حرف';

        if (!formData.contentAr.trim()) newErrors.contentAr = 'المحتوى مطلوب';
        else if (formData.contentAr.length > 5000) newErrors.contentAr = 'المحتوى يتجاوز 5000 حرف';

        if (formData.timerDuration < 5) newErrors.timerDuration = 'الحد الأدنى 5 ثوانٍ';
        else if (formData.timerDuration > 120) newErrors.timerDuration = 'الحد الأقصى 120 ثانية';

        if (formData.publishAt && formData.expiresAt && new Date(formData.expiresAt) <= new Date(formData.publishAt)) {
            newErrors.expiresAt = 'تاريخ الانتهاء يجب أن يكون بعد تاريخ النشر';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    // الإرسال
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (!validate()) return;

        const data = {
            ...formData,
            timerDuration: parseInt(formData.timerDuration, 10),
            imageUrl: imagePreview,
            imageFile,
            status: formData.publishNow ? 'published' : 'draft',
            publishAt: formData.publishNow ? null : (formData.publishAt || null),
            expiresAt: formData.expiresAt || null,
        };

        onSubmit(data);
    }, [formData, imagePreview, imageFile, validate, onSubmit]);

    const showDimensionWarning = imageDimensions && (
        imageDimensions.width !== IMAGE_CONSTRAINTS.recommendedWidth ||
        imageDimensions.height !== IMAGE_CONSTRAINTS.recommendedHeight
    ) && !imageError;

    return (
        <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
            {/* العنوان */}
            <div>
                <label className={`block text-sm font-medium mb-1.5 ${labelClass}`}>
                    العنوان <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.titleAr}
                    onChange={(e) => handleChange('titleAr', e.target.value)}
                    placeholder="عنوان الإعلان..."
                    maxLength={500}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors ${inputClass} ${
                        errors.titleAr ? 'border-red-500' : ''
                    }`}
                />
                <div className="flex justify-between mt-1">
                    {errors.titleAr && <p className="text-xs text-red-500">{errors.titleAr}</p>}
                    <p className={`text-xs ${formData.titleAr.length > 450 ? 'text-amber-500' : 'text-gray-400'} mr-auto`}>
                        {formData.titleAr.length}/500
                    </p>
                </div>
            </div>

            {/* المحتوى */}
            <div>
                <label className={`block text-sm font-medium mb-1.5 ${labelClass}`}>
                    المحتوى <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={formData.contentAr}
                    onChange={(e) => handleChange('contentAr', e.target.value)}
                    placeholder="محتوى الإعلان التفصيلي..."
                    maxLength={5000}
                    rows={5}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm resize-y transition-colors ${inputClass} ${
                        errors.contentAr ? 'border-red-500' : ''
                    }`}
                />
                <div className="flex justify-between mt-1">
                    {errors.contentAr && <p className="text-xs text-red-500">{errors.contentAr}</p>}
                    <p className={`text-xs ${formData.contentAr.length > 4500 ? 'text-amber-500' : 'text-gray-400'} mr-auto`}>
                        {formData.contentAr.length}/5000
                    </p>
                </div>
            </div>

            {/* الصورة / البانر */}
            <div>
                <label className={`block text-sm font-medium mb-1.5 ${labelClass}`}>
                    الصورة / البانر
                </label>

                {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <img
                            src={imagePreview}
                            alt="معاينة"
                            className="w-full max-h-[250px] object-cover"
                        />
                        <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 left-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                        {imageDimensions && (
                            <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                                darkMode ? 'bg-black/60 text-white' : 'bg-white/80 text-gray-700 dark:text-gray-200'
                            }`}>
                                {imageDimensions.width} × {imageDimensions.height}
                            </div>
                        )}
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                            darkMode
                                ? 'border-gray-600 hover:border-gray-500 bg-gray-700/30'
                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 bg-gray-50 dark:bg-gray-800'
                        }`}
                    >
                        <PhotoIcon className={`w-10 h-10 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                            اضغط لرفع صورة أو بانر
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            JPG, PNG, WebP, GIF - أقصى {IMAGE_CONSTRAINTS.maxSizeMB}MB - الأبعاد الموصى بها {IMAGE_CONSTRAINTS.recommendedWidth}×{IMAGE_CONSTRAINTS.recommendedHeight}
                        </p>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={IMAGE_CONSTRAINTS.allowedExtensions}
                    onChange={handleImageUpload}
                    className="hidden"
                />

                {imageError && (
                    <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                        <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                        {imageError}
                    </p>
                )}
                {showDimensionWarning && (
                    <p className="flex items-center gap-1 text-xs text-amber-500 mt-1.5">
                        <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                        الأبعاد الموصى بها: {IMAGE_CONSTRAINTS.recommendedWidth}×{IMAGE_CONSTRAINTS.recommendedHeight} بكسل
                    </p>
                )}
            </div>

            {/* صف: النوع + الأولوية */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={`block text-sm font-medium mb-1.5 ${labelClass}`}>
                        النوع <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm ${inputClass}`}
                    >
                        {Object.entries(ANNOUNCEMENT_TYPES).map(([key, val]) => (
                            <option key={key} value={key}>{val.icon} {val.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={`block text-sm font-medium mb-1.5 ${labelClass}`}>
                        الأولوية <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.priority}
                        onChange={(e) => handleChange('priority', e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm ${inputClass}`}
                    >
                        {Object.entries(ANNOUNCEMENT_PRIORITIES).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* مدة المؤقت */}
            <div>
                <label className={`block text-sm font-medium mb-1.5 ${labelClass}`}>
                    مدة المؤقت (ثانية) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        value={formData.timerDuration}
                        onChange={(e) => handleChange('timerDuration', e.target.value)}
                        min={5}
                        max={120}
                        className={`w-32 px-4 py-2.5 rounded-lg border text-sm ${inputClass} ${
                            errors.timerDuration ? 'border-red-500' : ''
                        }`}
                    />
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        الحد الأدنى 5 ثوانٍ - الحد الأقصى 120 ثانية
                    </span>
                </div>
                {errors.timerDuration && <p className="text-xs text-red-500 mt-1">{errors.timerDuration}</p>}
            </div>

            {/* صف: تاريخ النشر + تاريخ الانتهاء */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={`block text-sm font-medium mb-1.5 ${labelClass}`}>
                        تاريخ النشر (اختياري)
                    </label>
                    <input
                        type="datetime-local"
                        value={formData.publishAt}
                        onChange={(e) => handleChange('publishAt', e.target.value)}
                        disabled={formData.publishNow}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm ${inputClass} ${
                            formData.publishNow ? 'opacity-50' : ''
                        }`}
                    />
                </div>
                <div>
                    <label className={`block text-sm font-medium mb-1.5 ${labelClass}`}>
                        تاريخ الانتهاء (اختياري)
                    </label>
                    <input
                        type="datetime-local"
                        value={formData.expiresAt}
                        onChange={(e) => handleChange('expiresAt', e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm ${inputClass} ${
                            errors.expiresAt ? 'border-red-500' : ''
                        }`}
                    />
                    {errors.expiresAt && <p className="text-xs text-red-500 mt-1">{errors.expiresAt}</p>}
                </div>
            </div>

            {/* النشر فوراً */}
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={formData.publishNow}
                    onChange={(e) => handleChange('publishNow', e.target.checked)}
                    className="w-4 h-4 text-blue-600 dark:text-blue-400 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400"
                />
                <span className={`text-sm font-medium ${labelClass}`}>
                    النشر فوراً عند الحفظ
                </span>
            </label>

            {/* أزرار الإجراء */}
            <div className={`flex items-center justify-end gap-3 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                <Button variant="ghost" size="md" onClick={onCancel} type="button">
                    إلغاء
                </Button>
                <Button variant="primary" size="md" type="submit">
                    {isEditing ? 'حفظ التعديلات' : 'إنشاء الإعلان'}
                </Button>
            </div>
        </form>
    );
}
