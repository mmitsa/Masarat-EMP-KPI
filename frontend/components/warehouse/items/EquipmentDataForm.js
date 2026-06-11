import React from 'react';
import { EQUIPMENT_REQUIRED_FIELDS } from './constants';

/**
 * نموذج بيانات المعدة - يظهر كتاب فرعي داخل نموذج الصنف عند اختيار فئة "معدة"
 */
export default function EquipmentDataForm({ equipmentData, onChange }) {
    const handleChange = (field, value) => {
        onChange({ ...equipmentData, [field]: value });
    };

    const isRequired = (field) => EQUIPMENT_REQUIRED_FIELDS.includes(field);

    return (
        <div className="space-y-6">
            {/* تنبيه */}
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded-xl text-sm text-orange-700">
                <strong>ملاحظة:</strong> الحقول المميزة بـ (*) إلزامية لاكتمال بيانات المعدة.
            </div>

            {/* بيانات أساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        الرقم التسلسلي {isRequired('equipmentSerial') && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        type="text"
                        className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="الرقم التسلسلي للمعدة"
                        value={equipmentData.equipmentSerial || ''}
                        onChange={(e) => handleChange('equipmentSerial', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        رقم الموديل {isRequired('modelNumber') && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        type="text"
                        className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="رقم الموديل"
                        value={equipmentData.modelNumber || ''}
                        onChange={(e) => handleChange('modelNumber', e.target.value)}
                    />
                </div>
            </div>

            {/* المواصفات الفنية */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">المواصفات الفنية</label>
                <textarea
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows="3"
                    placeholder="وصف المواصفات الفنية للمعدة..."
                    value={equipmentData.specifications || ''}
                    onChange={(e) => handleChange('specifications', e.target.value)}
                />
            </div>

            {/* بيانات إضافية */}
            <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3">بيانات فنية إضافية</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">القدرة (واط/حصان)</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="مثال: 50 كيلوواط"
                            value={equipmentData.powerRating || ''}
                            onChange={(e) => handleChange('powerRating', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">الوزن (كجم)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="الوزن بالكيلوجرام"
                            value={equipmentData.weight || ''}
                            onChange={(e) => handleChange('weight', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">الأبعاد (سم)</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="الطول x العرض x الارتفاع"
                            value={equipmentData.dimensions || ''}
                            onChange={(e) => handleChange('dimensions', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* تواريخ */}
            <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3">التواريخ</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">انتهاء الضمان</label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            value={equipmentData.warrantyExpiry || ''}
                            onChange={(e) => handleChange('warrantyExpiry', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">تاريخ المعايرة القادم</label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            value={equipmentData.calibrationDate || ''}
                            onChange={(e) => handleChange('calibrationDate', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
