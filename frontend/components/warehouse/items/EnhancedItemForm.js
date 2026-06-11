import React, { useState } from 'react';
import { Button, Badge } from '../../ui';
import { ITEM_CATEGORIES, ITEM_TYPES, CUSTODY_TYPES, isVehicleDataComplete, isEquipmentDataComplete } from './constants';
import VehicleDataForm from './VehicleDataForm';
import EquipmentDataForm from './EquipmentDataForm';

/**
 * EnhancedItemForm - نموذج إضافة/تعديل صنف محسّن
 * يدعم ثلاث فئات: أصناف عادية، سيارات، ومعدات
 * يحل محل نموذج الأصناف القديم (ItemForm) المضمّن في صفحة الأصناف
 */
export default function EnhancedItemForm({
    formData,
    setFormData,
    groups,
    units,
    onSubmit,
    onCancel,
    submitLabel,
}) {
    const [formTab, setFormTab] = useState('basic');

    const category = formData.category || 'regular';
    const hasSpecializedTab = category === 'vehicle' || category === 'equipment';

    // ---- Helpers ----

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCategoryChange = (newCategory) => {
        setFormData(prev => ({ ...prev, category: newCategory }));
        setFormTab('basic');
    };

    const handleVehicleDataChange = (vehicleData) => {
        setFormData(prev => ({ ...prev, vehicleData }));
    };

    const handleEquipmentDataChange = (equipmentData) => {
        setFormData(prev => ({ ...prev, equipmentData }));
    };

    const getSpecializedDataComplete = () => {
        if (category === 'vehicle') return isVehicleDataComplete(formData.vehicleData);
        if (category === 'equipment') return isEquipmentDataComplete(formData.equipmentData);
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (category === 'vehicle' && !isVehicleDataComplete(formData.vehicleData)) {
            alert('يرجى إكمال بيانات السيارة الإلزامية قبل الحفظ.');
            setFormTab('specialized');
            return;
        }

        if (category === 'equipment' && !isEquipmentDataComplete(formData.equipmentData)) {
            alert('يرجى إكمال بيانات المعدة الإلزامية قبل الحفظ.');
            setFormTab('specialized');
            return;
        }

        onSubmit(e);
    };

    // ---- Shared field styling ----

    const inputClasses =
        'w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 bg-white dark:bg-gray-900';
    const labelClasses = 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1';

    // ==================== Section Renderers ====================

    /** القسم 1 - اختيار الفئة */
    const renderCategorySelector = () => (
        <div className="mb-6">
            <label className={labelClasses}>فئة الصنف</label>
            <div className="grid grid-cols-3 gap-3 mt-1">
                {Object.entries(ITEM_CATEGORIES).map(([key, cat]) => {
                    const isSelected = category === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => handleCategoryChange(key)}
                            className={`
                                flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2
                                transition-all duration-200 cursor-pointer select-none
                                ${isSelected
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm dark:shadow-gray-900/20'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 hover:bg-gray-50'
                                }
                            `}
                        >
                            <span className="text-2xl" aria-hidden="true">{cat.icon}</span>
                            <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-600 dark:text-gray-300'}`}>
                                {cat.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    /** ألسنة التبويب الداخلية (pill buttons) - تظهر فقط للسيارات والمعدات */
    const renderInnerTabs = () => {
        if (!hasSpecializedTab) return null;

        const specializedLabel = category === 'vehicle' ? 'بيانات السيارة' : 'بيانات المعدة';
        const isComplete = getSpecializedDataComplete();

        return (
            <div className="flex items-center gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
                <button
                    type="button"
                    onClick={() => setFormTab('basic')}
                    className={`
                        flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${formTab === 'basic'
                            ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 shadow-sm dark:shadow-gray-900/20'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-800'
                        }
                    `}
                >
                    البيانات الأساسية
                </button>
                <button
                    type="button"
                    onClick={() => setFormTab('specialized')}
                    className={`
                        flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        flex items-center justify-center gap-2
                        ${formTab === 'specialized'
                            ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 shadow-sm dark:shadow-gray-900/20'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-800'
                        }
                    `}
                >
                    <span>{specializedLabel}</span>
                    <span
                        className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            isComplete ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        aria-label={isComplete ? 'البيانات مكتملة' : 'البيانات غير مكتملة'}
                    />
                </button>
            </div>
        );
    };

    /** القسم 2 - الحقول الأساسية */
    const renderBasicFields = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* اسم الصنف */}
            <div className="md:col-span-2 lg:col-span-3">
                <label className={labelClasses}>
                    اسم الصنف <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    className={inputClasses}
                    placeholder="أدخل اسم الصنف"
                    value={formData.itemName || ''}
                    onChange={(e) => handleFieldChange('itemName', e.target.value)}
                    required
                />
            </div>

            {/* المجموعة */}
            <div>
                <label className={labelClasses}>المجموعة</label>
                <select
                    className={inputClasses}
                    value={formData.groupId || ''}
                    onChange={(e) => handleFieldChange('groupId', e.target.value)}
                >
                    <option value="">اختر المجموعة</option>
                    {(groups || []).map(g => (
                        <option key={g.id || g.groupId} value={g.id || g.groupId}>
                            {g.groupName || g.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* نوع الصنف */}
            <div>
                <label className={labelClasses}>نوع الصنف</label>
                <select
                    className={inputClasses}
                    value={formData.itemType || ''}
                    onChange={(e) => handleFieldChange('itemType', e.target.value)}
                >
                    <option value="">اختر النوع</option>
                    {Object.entries(ITEM_TYPES).map(([key, type]) => (
                        <option key={key} value={key}>
                            {type.icon} {type.label} - {type.desc}
                        </option>
                    ))}
                </select>
            </div>

            {/* نوع العهدة - يظهر فقط عند اختيار مستديم */}
            {formData.itemType === '1' && (
                <div>
                    <label className={labelClasses}>نوع العهدة</label>
                    <select
                        className={inputClasses}
                        value={formData.custodyType || ''}
                        onChange={(e) => handleFieldChange('custodyType', e.target.value)}
                    >
                        <option value="">اختر نوع العهدة</option>
                        {Object.entries(CUSTODY_TYPES).map(([key, type]) => (
                            <option key={key} value={key}>{type.label}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* وحدة القياس */}
            <div>
                <label className={labelClasses}>وحدة القياس</label>
                <select
                    className={inputClasses}
                    value={formData.unitId || ''}
                    onChange={(e) => handleFieldChange('unitId', e.target.value)}
                >
                    <option value="">اختر الوحدة</option>
                    {(units || []).map(u => (
                        <option key={u.id || u.unitId} value={u.id || u.unitId}>
                            {u.unitName || u.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* الحد الأدنى للمخزون */}
            <div>
                <label className={labelClasses}>الحد الأدنى للمخزون</label>
                <input
                    type="number"
                    min="0"
                    className={inputClasses}
                    placeholder="0"
                    value={formData.lowQuantity ?? 0}
                    onChange={(e) => handleFieldChange('lowQuantity', parseInt(e.target.value, 10) || 0)}
                />
            </div>
        </div>
    );

    /** القسم 3 - الأسعار */
    const renderPricingSection = () => (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-3">الأسعار</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className={labelClasses}>آخر سعر شراء</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputClasses}
                        placeholder="0.00"
                        value={formData.lastPrice ?? 0}
                        onChange={(e) => handleFieldChange('lastPrice', parseFloat(e.target.value) || 0)}
                    />
                </div>
                <div>
                    <label className={labelClasses}>أدنى سعر</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputClasses}
                        placeholder="0.00"
                        value={formData.lowPrice ?? 0}
                        onChange={(e) => handleFieldChange('lowPrice', parseFloat(e.target.value) || 0)}
                    />
                </div>
                <div>
                    <label className={labelClasses}>أعلى سعر</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputClasses}
                        placeholder="0.00"
                        value={formData.highPrice ?? 0}
                        onChange={(e) => handleFieldChange('highPrice', parseFloat(e.target.value) || 0)}
                    />
                </div>
            </div>
        </div>
    );

    /** القسم 4 - معلومات تصنيعية */
    const renderManufacturingSection = () => (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-3">معلومات تصنيعية</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className={labelClasses}>الموديل</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="موديل الصنف"
                        value={formData.model || ''}
                        onChange={(e) => handleFieldChange('model', e.target.value)}
                    />
                </div>
                <div>
                    <label className={labelClasses}>بلد المنشأ</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="بلد التصنيع"
                        value={formData.countryOfOrigin || ''}
                        onChange={(e) => handleFieldChange('countryOfOrigin', e.target.value)}
                    />
                </div>
                <div>
                    <label className={labelClasses}>الشركة المصنعة</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="اسم الشركة المصنعة"
                        value={formData.manufacturer || ''}
                        onChange={(e) => handleFieldChange('manufacturer', e.target.value)}
                    />
                </div>
                <div>
                    <label className={labelClasses}>تاريخ الإنتاج</label>
                    <input
                        type="date"
                        className={inputClasses}
                        value={formData.productionDate || ''}
                        onChange={(e) => handleFieldChange('productionDate', e.target.value)}
                    />
                </div>
                <div>
                    <label className={labelClasses}>تاريخ الصلاحية/الانتهاء</label>
                    <input
                        type="date"
                        className={inputClasses}
                        value={formData.expiryDate || ''}
                        onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
                    />
                </div>
                <div className="flex items-end">
                    <label className="flex items-center gap-3 cursor-pointer select-none pb-2">
                        <input
                            type="checkbox"
                            checked={formData.hasQRCode ?? true}
                            onChange={(e) => handleFieldChange('hasQRCode', e.target.checked)}
                            className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">تفعيل رمز QR</span>
                    </label>
                </div>
            </div>
        </div>
    );

    /** القسم 5 - الوصف */
    const renderDescriptionSection = () => (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <label className={labelClasses}>الوصف / ملاحظات</label>
            <textarea
                className={inputClasses}
                rows="3"
                placeholder="أدخل وصف الصنف أو ملاحظات إضافية..."
                value={formData.itemDescription || ''}
                onChange={(e) => handleFieldChange('itemDescription', e.target.value)}
            />
        </div>
    );

    /** محتوى التاب المتخصص (سيارة / معدة) */
    const renderSpecializedContent = () => {
        if (category === 'vehicle') {
            return (
                <VehicleDataForm
                    vehicleData={formData.vehicleData || {}}
                    onChange={handleVehicleDataChange}
                />
            );
        }
        if (category === 'equipment') {
            return (
                <EquipmentDataForm
                    equipmentData={formData.equipmentData || {}}
                    onChange={handleEquipmentDataChange}
                />
            );
        }
        return null;
    };

    /** أزرار الإجراءات */
    const renderFooter = () => (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6 flex items-center justify-end gap-3">
            <Button
                variant="outline"
                size="md"
                type="button"
                onClick={onCancel}
            >
                إلغاء
            </Button>
            <Button
                variant="primary"
                size="md"
                type="submit"
            >
                {submitLabel || 'حفظ'}
            </Button>
        </div>
    );

    // ==================== Main Render ====================

    return (
        <form onSubmit={handleSubmit} className="space-y-0" noValidate>
            {/* اختيار الفئة */}
            {renderCategorySelector()}

            {/* ألسنة التبويب الداخلية */}
            {renderInnerTabs()}

            {/* محتوى النموذج بناءً على الفئة والتاب */}
            {hasSpecializedTab ? (
                <>
                    {formTab === 'basic' && (
                        <div className="space-y-0">
                            {renderBasicFields()}
                            {renderPricingSection()}
                            {renderManufacturingSection()}
                            {renderDescriptionSection()}
                        </div>
                    )}
                    {formTab === 'specialized' && (
                        <div>{renderSpecializedContent()}</div>
                    )}
                </>
            ) : (
                <div className="space-y-0">
                    {renderBasicFields()}
                    {renderPricingSection()}
                    {renderManufacturingSection()}
                    {renderDescriptionSection()}
                </div>
            )}

            {/* أزرار التحكم */}
            {renderFooter()}
        </form>
    );
}
