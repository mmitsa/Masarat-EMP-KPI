/**
 * مكون اختيار نوع الإجازة
 * Leave Type Select Component
 */

import React from 'react';
import { Select } from '../../ui';
import {
    LEAVE_TYPES,
    LEAVE_CATEGORIES,
    getLeaveTypesOptions
} from '../../../constants/leave-types';

export default function LeaveTypeSelect({
    value,
    onChange,
    label = 'نوع الإجازة',
    required = false,
    grouped = true,
    category = null,
    disabled = false,
    error = null,
    hint = null,
    showDays = false,
    ...props
}) {
    // فلترة حسب التصنيف إذا تم تحديده
    let options = [];

    if (category) {
        // فلترة حسب تصنيف معين
        options = Object.entries(LEAVE_TYPES)
            .filter(([_, type]) => type.category === category)
            .map(([code, type]) => ({
                value: code,
                label: showDays && type.days > 0
                    ? `${type.name} (${type.days} يوم)`
                    : type.name,
            }));
    } else if (grouped) {
        // تجميع حسب التصنيف
        const groups = {};
        Object.entries(LEAVE_TYPES).forEach(([code, type]) => {
            const categoryName = LEAVE_CATEGORIES[type.category]?.name || type.category;
            if (!groups[categoryName]) {
                groups[categoryName] = [];
            }
            groups[categoryName].push({
                value: code,
                label: showDays && type.days > 0
                    ? `${type.name} (${type.days} يوم)`
                    : type.name,
            });
        });

        // تحويل المجموعات إلى خيارات
        Object.entries(groups).forEach(([groupName, groupOptions]) => {
            options.push({
                value: '',
                label: `── ${groupName} ──`,
                disabled: true
            });
            options.push(...groupOptions);
        });
    } else {
        // قائمة مسطحة
        options = Object.entries(LEAVE_TYPES).map(([code, type]) => ({
            value: code,
            label: showDays && type.days > 0
                ? `${type.name} (${type.days} يوم)`
                : type.name,
        }));
    }

    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={options}
            placeholder="اختر نوع الإجازة"
            required={required}
            disabled={disabled}
            error={error}
            hint={hint}
            {...props}
        />
    );
}

// مكونات Select جاهزة لتصنيفات محددة
export function AnnualLeaveSelect(props) {
    return <LeaveTypeSelect category="annual" label="إجازة سنوية" {...props} />;
}

export function SickLeaveSelect(props) {
    return <LeaveTypeSelect category="sick" label="إجازة مرضية" {...props} />;
}

export function OfficialLeaveSelect(props) {
    return <LeaveTypeSelect category="official" label="إجازة رسمية" {...props} />;
}
