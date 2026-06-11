import React, { useState, useMemo } from 'react';
import { useOrganizationStructure } from '../../context/OrganizationStructureContext';
import { useTheme } from '../../context/ThemeContext';
import CascadingOrgSelect from '../ui/CascadingOrgSelect';
import { ContentCard, DataTable, Badge, Button, EmptyState } from '../ui';

/**
 * ModuleStructureTab - تبويب الهيكل التنظيمي داخل الموديولات
 * يعرض الأعضاء حسب الإدارة/القسم/الوحدة
 *
 * @param {string} moduleId - معرف الموديول (hr, warehouse, movement, etc.)
 * @param {string} className - CSS classes
 */
export default function ModuleStructureTab({ moduleId, className = '' }) {
    const { isDarkMode } = useTheme();
    const { departments, sections, units, members, getMembers } = useOrganizationStructure();

    const [filter, setFilter] = useState({ departmentId: null, sectionId: null, unitId: null });

    const filteredMembers = useMemo(() => {
        return getMembers(filter);
    }, [filter, getMembers]);

    // إحصائيات سريعة
    const stats = useMemo(() => {
        const deptCount = filter.departmentId ? 1 : departments.filter(d => d.isActive).length;
        const secCount = filter.departmentId
            ? sections.filter(s => s.departmentId === filter.departmentId && s.isActive).length
            : sections.filter(s => s.isActive).length;
        const unitCount = filter.sectionId
            ? units.filter(u => u.sectionId === filter.sectionId && u.isActive).length
            : filter.departmentId
                ? units.filter(u => u.departmentId === filter.departmentId && u.isActive).length
                : units.filter(u => u.isActive).length;

        return { deptCount, secCount, unitCount, memberCount: filteredMembers.length };
    }, [filter, departments, sections, units, filteredMembers]);

    const columns = [
        {
            key: 'employeeName',
            label: 'الموظف',
            render: (_, row) => (
                <span className="font-medium text-gray-900 dark:text-white">{row?.employeeName}</span>
            ),
        },
        {
            key: 'department',
            label: 'الإدارة',
            render: (_, row) => {
                const dept = departments.find(d => d.id === row?.departmentId);
                return dept?.name || '-';
            },
        },
        {
            key: 'section',
            label: 'القسم',
            render: (_, row) => {
                const sec = sections.find(s => s.id === row?.sectionId);
                return sec?.name || '-';
            },
        },
        {
            key: 'unit',
            label: 'الوحدة',
            render: (_, row) => {
                const unit = units.find(u => u.id === row?.unitId);
                return unit?.name || '-';
            },
        },
        {
            key: 'role',
            label: 'الدور',
            render: (_, row) => (
                <Badge variant={row?.role === 'مدير' ? 'primary' : row?.role === 'مشرف' ? 'warning' : 'default'}>
                    {row?.role}
                </Badge>
            ),
        },
        {
            key: 'jobTitle',
            label: 'المسمى الوظيفي',
        },
    ];

    return (
        <div className={className}>
            {/* فلاتر */}
            <ContentCard title="تصفية حسب الهيكل التنظيمي" className="mb-4">
                <CascadingOrgSelect
                    value={filter}
                    onChange={setFilter}
                    showUnit={true}
                />
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>{stats.deptCount} إدارة</span>
                    <span>{stats.secCount} قسم</span>
                    <span>{stats.unitCount} وحدة</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{stats.memberCount} عضو</span>
                </div>
            </ContentCard>

            {/* جدول الأعضاء */}
            <ContentCard title="الأعضاء">
                {filteredMembers.length > 0 ? (
                    <DataTable
                        columns={columns}
                        data={filteredMembers}
                        emptyMessage="لا يوجد أعضاء في النطاق المحدد"
                    />
                ) : (
                    <EmptyState
                        title="لا يوجد أعضاء"
                        description="حدد إدارة أو قسم لعرض الأعضاء، أو أضف أعضاء من صفحة هيكلة الجهة"
                    />
                )}
            </ContentCard>
        </div>
    );
}
