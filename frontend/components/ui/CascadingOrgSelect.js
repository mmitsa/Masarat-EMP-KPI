import React, { useMemo } from 'react';
import { useOrganizationStructure } from '../../context/OrganizationStructureContext';
import Select from './Select';

/**
 * CascadingOrgSelect - قوائم منسدلة متسلسلة للهيكل التنظيمي
 * إدارة → قسم → وحدة
 *
 * @param {object} value - { departmentId, sectionId, unitId }
 * @param {function} onChange - ({ departmentId, sectionId, unitId }) => void
 * @param {boolean} showUnit - إظهار اختيار الوحدة (افتراضي: true)
 * @param {boolean} required - حقل مطلوب
 * @param {boolean} disabled - تعطيل الحقول
 * @param {string} className - CSS classes
 */
export default function CascadingOrgSelect({
    value = {},
    onChange,
    showUnit = true,
    required = false,
    disabled = false,
    className = '',
}) {
    const { departments, getSectionsByDepartment, getUnitsByDepartment, getUnitsBySection } = useOrganizationStructure();

    const activeDepartments = useMemo(
        () => departments.filter(d => d.isActive),
        [departments]
    );

    const filteredSections = useMemo(
        () => value.departmentId ? getSectionsByDepartment(value.departmentId) : [],
        [value.departmentId, getSectionsByDepartment]
    );

    const filteredUnits = useMemo(() => {
        if (!value.departmentId) return [];
        if (value.sectionId) return getUnitsBySection(value.sectionId);
        return getUnitsByDepartment(value.departmentId);
    }, [value.departmentId, value.sectionId, getUnitsBySection, getUnitsByDepartment]);

    const handleDepartmentChange = (departmentId) => {
        onChange({ departmentId: departmentId || null, sectionId: null, unitId: null });
    };

    const handleSectionChange = (sectionId) => {
        onChange({ ...value, sectionId: sectionId || null, unitId: null });
    };

    const handleUnitChange = (unitId) => {
        onChange({ ...value, unitId: unitId || null });
    };

    const departmentOptions = [
        { value: '', label: 'جميع الإدارات' },
        ...activeDepartments.map(d => ({ value: d.id, label: d.name })),
    ];

    const sectionOptions = [
        { value: '', label: 'جميع الأقسام' },
        ...filteredSections.map(s => ({ value: s.id, label: s.name })),
    ];

    const unitOptions = [
        { value: '', label: 'جميع الوحدات' },
        ...filteredUnits.map(u => ({ value: u.id, label: u.name })),
    ];

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${showUnit ? 'lg:grid-cols-3' : ''} gap-3 ${className}`}>
            <Select
                label="الإدارة"
                value={value.departmentId || ''}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                options={departmentOptions}
                required={required}
                disabled={disabled}
            />
            <Select
                label="القسم"
                value={value.sectionId || ''}
                onChange={(e) => handleSectionChange(e.target.value)}
                options={sectionOptions}
                disabled={disabled || !value.departmentId}
            />
            {showUnit && (
                <Select
                    label="الوحدة"
                    value={value.unitId || ''}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    options={unitOptions}
                    disabled={disabled || !value.departmentId}
                />
            )}
        </div>
    );
}
