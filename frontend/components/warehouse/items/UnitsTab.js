import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ContentCard, DataTable, Badge, Button, Modal, SearchInput } from '../../ui';
import PermissionGuard from '../../PermissionGuard';
import api from '../../../lib/api';

import { PlusIcon, EditIcon, TrashIcon } from './icons';

// ==================== وحدات القياس ====================

const INITIAL_FORM_DATA = { name: '', isActive: true };

export default function UnitsTab() {
    // ===== State =====
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // ===== Load Data =====
    const loadUnits = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.warehouse?.getUnits?.().catch(() => null);
            if (response?.data) {
                setUnits(response.data);
            } else {
                setUnits([]);
            }
        } catch {
            setUnits([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUnits();
    }, [loadUnits]);

    // ===== Filtered Data =====
    const filteredUnits = useMemo(() => {
        if (!searchTerm.trim()) return units;
        const term = searchTerm.trim().toLowerCase();
        return units.filter(unit =>
            unit.name?.toLowerCase().includes(term)
        );
    }, [units, searchTerm]);

    // ===== Handlers =====
    const handleOpenCreate = useCallback(() => {
        setFormData(INITIAL_FORM_DATA);
        setShowCreateModal(true);
    }, []);

    const handleCloseCreate = useCallback(() => {
        setShowCreateModal(false);
        setFormData(INITIAL_FORM_DATA);
    }, []);

    const handleOpenEdit = useCallback((unit) => {
        setSelectedUnit(unit);
        setFormData({ name: unit.name, isActive: unit.isActive });
        setShowEditModal(true);
    }, []);

    const handleCloseEdit = useCallback(() => {
        setShowEditModal(false);
        setSelectedUnit(null);
        setFormData(INITIAL_FORM_DATA);
    }, []);

    const handleFormChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleCreate = useCallback(async () => {
        if (!formData.name.trim()) return;

        setSaving(true);
        try {
            const response = await api.warehouse?.createUnit?.(formData).catch(() => null);
            if (response?.data) {
                setUnits(prev => [...prev, response.data]);
            } else {
                // Fallback: add locally with generated id
                const newUnit = {
                    id: Math.max(0, ...units.map(u => u.id)) + 1,
                    name: formData.name.trim(),
                    isActive: formData.isActive,
                    itemsCount: 0,
                };
                setUnits(prev => [...prev, newUnit]);
            }
            handleCloseCreate();
        } catch {
            // Fallback: add locally
            const newUnit = {
                id: Math.max(0, ...units.map(u => u.id)) + 1,
                name: formData.name.trim(),
                isActive: formData.isActive,
                itemsCount: 0,
            };
            setUnits(prev => [...prev, newUnit]);
            handleCloseCreate();
        } finally {
            setSaving(false);
        }
    }, [formData, units, handleCloseCreate]);

    const handleUpdate = useCallback(async () => {
        if (!formData.name.trim() || !selectedUnit) return;

        setSaving(true);
        try {
            const response = await api.warehouse?.updateUnit?.(selectedUnit.id, formData).catch(() => null);
            if (response?.data) {
                setUnits(prev => prev.map(u => u.id === selectedUnit.id ? response.data : u));
            } else {
                // Fallback: update locally
                setUnits(prev => prev.map(u =>
                    u.id === selectedUnit.id
                        ? { ...u, name: formData.name.trim(), isActive: formData.isActive }
                        : u
                ));
            }
            handleCloseEdit();
        } catch {
            setUnits(prev => prev.map(u =>
                u.id === selectedUnit.id
                    ? { ...u, name: formData.name.trim(), isActive: formData.isActive }
                    : u
            ));
            handleCloseEdit();
        } finally {
            setSaving(false);
        }
    }, [formData, selectedUnit, handleCloseEdit]);

    const handleDeleteConfirm = useCallback((unit) => {
        setDeleteConfirm(unit);
    }, []);

    const handleDelete = useCallback(async () => {
        if (!deleteConfirm) return;

        try {
            await api.warehouse?.deleteUnit?.(deleteConfirm.id).catch(() => null);
        } catch {
            // Continue with local delete even if API fails
        }
        setUnits(prev => prev.filter(u => u.id !== deleteConfirm.id));
        setDeleteConfirm(null);
    }, [deleteConfirm]);

    // ===== Table Columns =====
    const columns = useMemo(() => [
        {
            key: 'name',
            title: 'اسم الوحدة',
            sortable: true,
        },
        {
            key: 'isActive',
            title: 'الحالة',
            sortable: true,
            render: (value) => (
                <Badge variant={value ? 'success' : 'secondary'} dot>
                    {value ? 'نشط' : 'غير نشط'}
                </Badge>
            ),
        },
        {
            key: 'itemsCount',
            title: 'عدد الأصناف',
            sortable: true,
            render: (value) => (
                <span className="text-[var(--text-secondary)] font-medium">
                    {value || 0}
                </span>
            ),
        },
    ], []);

    // ===== Actions Column =====
    const renderActions = useCallback((row) => (
        <div className="flex items-center gap-2">
            <PermissionGuard requires="warehouse.units.edit">
                <button
                    type="button"
                    onClick={() => handleOpenEdit(row)}
                    className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    aria-label={`تعديل ${row.name}`}
                    title="تعديل"
                >
                    <EditIcon className="w-4 h-4" />
                </button>
            </PermissionGuard>
            <PermissionGuard requires="warehouse.units.delete">
                <button
                    type="button"
                    onClick={() => handleDeleteConfirm(row)}
                    className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    aria-label={`حذف ${row.name}`}
                    title="حذف"
                    disabled={row.itemsCount > 0}
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </PermissionGuard>
        </div>
    ), [handleOpenEdit, handleDeleteConfirm]);

    // ===== Form Modal Content =====
    const renderFormContent = () => (
        <div className="space-y-5">
            {/* Unit Name */}
            <div>
                <label
                    htmlFor="unit-name"
                    className="block text-sm font-bold text-[var(--text-primary)] mb-2"
                >
                    اسم الوحدة <span className="text-red-500">*</span>
                </label>
                <input
                    id="unit-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="مثال: قطعة، كرتون، كيلوجرام"
                    className="w-full px-4 py-3 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--input-focus-border)] focus:ring-4 focus:ring-[var(--color-primary-100)] transition-all"
                    autoFocus
                    dir="rtl"
                />
                {!formData.name.trim() && (
                    <p className="mt-1.5 text-xs text-red-500">اسم الوحدة مطلوب</p>
                )}
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleFormChange('isActive', e.target.checked)}
                        className="sr-only peer"
                        aria-label="حالة التفعيل"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 rtl:peer-checked:after:-translate-x-full"></div>
                </label>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                    {formData.isActive ? 'نشط' : 'غير نشط'}
                </span>
            </div>
        </div>
    );

    // ===== Modal Footer =====
    const renderModalFooter = (onSave) => (
        <>
            <Button
                variant="primary"
                onClick={onSave}
                loading={saving}
                disabled={!formData.name.trim()}
                size="md"
            >
                {saving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
            <Button
                variant="outline"
                onClick={showCreateModal ? handleCloseCreate : handleCloseEdit}
                disabled={saving}
                size="md"
            >
                إلغاء
            </Button>
        </>
    );

    // ===== Render =====
    return (
        <div className="space-y-4">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="البحث في وحدات القياس..."
                    className="w-full sm:w-80"
                    aria-label="البحث في وحدات القياس"
                />
                <PermissionGuard requires="warehouse.units.create">
                    <Button
                        variant="primary"
                        size="sm"
                        icon={<PlusIcon className="w-4 h-4" />}
                        onClick={handleOpenCreate}
                    >
                        إضافة وحدة
                    </Button>
                </PermissionGuard>
            </div>

            {/* Data Table */}
            <ContentCard padding="none">
                <DataTable
                    columns={columns}
                    data={filteredUnits}
                    loading={loading}
                    emptyMessage="لا توجد وحدات قياس"
                    sortable
                    pagination
                    pageSize={10}
                    actions={renderActions}
                />
            </ContentCard>

            {/* Create Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={handleCloseCreate}
                title="إضافة وحدة قياس جديدة"
                subtitle="أدخل بيانات وحدة القياس"
                size="sm"
                footer={renderModalFooter(handleCreate)}
            >
                {renderFormContent()}
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={handleCloseEdit}
                title="تعديل وحدة القياس"
                subtitle={selectedUnit ? `تعديل: ${selectedUnit.name}` : ''}
                size="sm"
                footer={renderModalFooter(handleUpdate)}
            >
                {renderFormContent()}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="تأكيد الحذف"
                size="sm"
                footer={
                    <>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            size="md"
                        >
                            حذف
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirm(null)}
                            size="md"
                        >
                            إلغاء
                        </Button>
                    </>
                }
            >
                <div className="text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                        <TrashIcon className="w-7 h-7 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-[var(--text-primary)] text-base font-medium mb-2">
                        هل أنت متأكد من حذف الوحدة؟
                    </p>
                    <p className="text-[var(--text-secondary)] text-sm">
                        سيتم حذف وحدة القياس <strong>"{deleteConfirm?.name}"</strong> نهائيا.
                        {deleteConfirm?.itemsCount > 0 && (
                            <span className="block mt-2 text-red-500 font-medium">
                                تحذير: هذه الوحدة مرتبطة بـ {deleteConfirm.itemsCount} صنف
                            </span>
                        )}
                    </p>
                </div>
            </Modal>
        </div>
    );
}
