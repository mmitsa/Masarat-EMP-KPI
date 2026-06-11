import React from 'react';
import { FUEL_TYPES, VEHICLE_COLORS, VEHICLE_REQUIRED_FIELDS } from './constants';

/**
 * نموذج بيانات السيارة - يظهر كتاب فرعي داخل نموذج الصنف عند اختيار فئة "سيارة"
 */
export default function VehicleDataForm({ vehicleData, onChange }) {
    const handleChange = (field, value) => {
        onChange({ ...vehicleData, [field]: value });
    };

    const isRequired = (field) => VEHICLE_REQUIRED_FIELDS.includes(field);

    return (
        <div className="space-y-6">
            {/* تنبيه */}
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl text-sm text-purple-700 dark:text-purple-300">
                <strong>ملاحظة:</strong> الحقول المميزة بـ (*) إلزامية لاكتمال بيانات السيارة.
            </div>

            {/* بيانات أساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        رقم اللوحة {isRequired('licensePlate') && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        type="text"
                        className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="مثال: أ ب ج 1234"
                        value={vehicleData.licensePlate || ''}
                        onChange={(e) => handleChange('licensePlate', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        رقم الهيكل (VIN) {isRequired('chassisNumber') && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        type="text"
                        className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="17 حرف/رقم"
                        value={vehicleData.chassisNumber || ''}
                        onChange={(e) => handleChange('chassisNumber', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        رقم المحرك {isRequired('engineNumber') && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        type="text"
                        className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={vehicleData.engineNumber || ''}
                        onChange={(e) => handleChange('engineNumber', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        سنة الموديل {isRequired('modelYear') && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        type="number"
                        min="1990"
                        max="2030"
                        className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="مثال: 2025"
                        value={vehicleData.modelYear || ''}
                        onChange={(e) => handleChange('modelYear', e.target.value)}
                    />
                </div>
            </div>

            {/* بيانات إضافية */}
            <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3">بيانات إضافية</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">اللون</label>
                        <select
                            className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            value={vehicleData.color || ''}
                            onChange={(e) => handleChange('color', e.target.value)}
                        >
                            <option value="">اختر اللون</option>
                            {VEHICLE_COLORS.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">نوع الوقود</label>
                        <select
                            className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            value={vehicleData.fuelType || ''}
                            onChange={(e) => handleChange('fuelType', e.target.value)}
                        >
                            <option value="">اختر نوع الوقود</option>
                            {FUEL_TYPES.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">سعة المحرك (cc)</label>
                        <input
                            type="number"
                            min="0"
                            className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="مثال: 2500"
                            value={vehicleData.engineCapacity || ''}
                            onChange={(e) => handleChange('engineCapacity', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* تواريخ */}
            <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3">التواريخ</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">انتهاء التأمين</label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            value={vehicleData.insuranceExpiry || ''}
                            onChange={(e) => handleChange('insuranceExpiry', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">انتهاء الفحص الدوري</label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            value={vehicleData.registrationExpiry || ''}
                            onChange={(e) => handleChange('registrationExpiry', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
