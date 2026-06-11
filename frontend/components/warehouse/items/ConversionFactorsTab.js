import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ContentCard, DataTable, Badge, Button, Modal } from '../../ui';
import PermissionGuard from '../../PermissionGuard';
import api from '../../../lib/api';

import { PlusIcon, EditIcon, TrashIcon, ConvertIcon } from './icons';

// ==================== معاملات التحويل بين الوحدات ====================

const INITIAL_FORM_DATA = { fromUnitId: '', toUnitId: '', factor: 1, isActive: true };

export default function ConversionFactorsTab({ units = [] }) {
    // ===== State =====
    const [conversions, setConversions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    // ===== Load Data =====
    const loadConversions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.warehouse?.getConversionFactors?.().catch(() => null);
            if (response?.data) {
                setConversions(response.data);
            } else {
                setConversions([]);
            }
        } catch {
            setConversions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConversions();
    }, [loadConversions]);

    // ===== Helper: get unit name by id =====
    const getUnitName = useCallback((unitId) => {
        const unit = units.find(u => u.id === Number(unitId));
        return unit?.name || '';
    }, [units]);

    // ===== Validation =====
    const validateForm = useCallback(() => {
        const errors = {};

        if (!formData.fromUnitId) {
            errors.fromUnitId = 'يجب اختيار وحدة المصدر';
        }
        if (!formData.toUnitId) {
            errors.toUnitId = 'يجب اختيار وحدة الهدف';
        }
        if (formData.fromUnitId && formData.toUnitId && String(formData.fromUnitId) === String(formData.toUnitId)) {
            errors.toUnitId = 'يجب أن تكون وحدة الهدف مختلفة عن وحدة المصدر';
        }
        if (!formData.factor || Number(formData.factor) <= 0) {
            errors.factor = 'معامل التحويل يجب أن يكون أكبر من صفر';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    // ===== Handlers =====
    const handleOpenCreate = useCallback(() => {
        setEditingId(null);
        setFormData(INITIAL_FORM_DATA);
        setFormErrors({});
        setShowModal(true);
    }, []);

    const handleOpenEdit = useCallback((conversion) => {
        setEditingId(conversion.id);
        setFormData({
            fromUnitId: conversion.fromUnitId,
            toUnitId: conversion.toUnitId,
            factor: conversion.factor,
            isActive: conversion.isActive,
        });
        setFormErrors({});
        setShowModal(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setEditingId(null);
        setFormData(INITIAL_FORM_DATA);
        setFormErrors({});
    }, []);

    const handleFormChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for the field being changed
        setFormErrors(prev => {
            const updated = { ...prev };
            delete updated[field];
            return updated;
        });
    }, []);

    const handleSave = useCallback(async () => {
        if (!validateForm()) return;

        setSaving(true);
        const fromUnitName = getUnitName(formData.fromUnitId);
        const toUnitName = getUnitName(formData.toUnitId);

        const payload = {
            ...formData,
            fromUnitId: Number(formData.fromUnitId),
            toUnitId: Number(formData.toUnitId),
            factor: Number(formData.factor),
        };

        try {
            if (editingId) {
                // Update
                const response = await api.warehouse?.updateConversionFactor?.(editingId, payload).catch(() => null);
                if (response?.data) {
                    setConversions(prev => prev.map(c => c.id === editingId ? response.data : c));
                } else {
                    setConversions(prev => prev.map(c =>
                        c.id === editingId
                            ? { ...c, ...payload, fromUnitName, toUnitName }
                            : c
                    ));
                }
            } else {
                // Create
                const response = await api.warehouse?.createConversionFactor?.(payload).catch(() => null);
                if (response?.data) {
                    setConversions(prev => [...prev, response.data]);
                } else {
                    const newConversion = {
                        id: Math.max(0, ...conversions.map(c => c.id)) + 1,
                        ...payload,
                        fromUnitName,
                        toUnitName,
                    };
                    setConversions(prev => [...prev, newConversion]);
                }
            }
            handleCloseModal();
        } catch {
            // Fallback: apply locally
            if (editingId) {
                setConversions(prev => prev.map(c =>
                    c.id === editingId
                        ? { ...c, ...payload, fromUnitName, toUnitName }
                        : c
                ));
            } else {
                const newConversion = {
                    id: Math.max(0, ...conversions.map(c => c.id)) + 1,
                    ...payload,
                    fromUnitName,
                    toUnitName,
                };
                setConversions(prev => [...prev, newConversion]);
            }
            handleCloseModal();
        } finally {
            setSaving(false);
        }
    }, [formData, editingId, validateForm, getUnitName, conversions, handleCloseModal]);

    const handleDeleteConfirm = useCallback((conversion) => {
        setDeleteConfirm(conversion);
    }, []);

    const handleDelete = useCallback(async () => {
        if (!deleteConfirm) return;

        try {
            await api.warehouse?.deleteConversionFactor?.(deleteConfirm.id).catch(() => null);
        } catch {
            // Continue with local delete even if API fails
        }
        setConversions(prev => prev.filter(c => c.id !== deleteConfirm.id));
        setDeleteConfirm(null);
    }, [deleteConfirm]);

    // ===== Build visual formula =====
    const buildFormula = useCallback((conversion) => {
        const fromName = conversion.fromUnitName || getUnitName(conversion.fromUnitId);
        const toName = conversion.toUnitName || getUnitName(conversion.toUnitId);
        return `1 ${fromName} = ${conversion.factor} ${toName}`;
    }, [getUnitName]);

    // ===== Table Columns =====
    const columns = useMemo(() => [
        {
            key: 'fromUnitName',
            title: 'من وحدة',
            sortable: true,
            render: (value, row) => (
                <span className="font-medium text-[var(--text-primary)]">
                    {value || getUnitName(row.fromUnitId)}
                </span>
            ),
        },
        {
            key: '_arrow',
            title: '',
            sortable: false,
            width: '50px',
            render: () => (
                <span className="text-[var(--text-tertiary)] text-lg flex justify-center" aria-hidden="true">
                    <ConvertIcon className="w-5 h-5" />
                </span>
            ),
        },
        {
            key: 'toUnitName',
            title: 'إلى وحدة',
            sortable: true,
            render: (value, row) => (
                <span className="font-medium text-[var(--text-primary)]">
                    {value || getUnitName(row.toUnitId)}
                </span>
            ),
        },
        {
            key: 'factor',
            title: 'معامل التحويل',
            sortable: true,
            render: (value) => (
                <span className="font-bold text-[var(--color-primary-500)] text-base">
                    {value}
                </span>
            ),
        },
        {
            key: '_formula',
            title: 'معادلة التحويل',
            sortable: false,
            render: (_value, row) => (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-primary-50,#eff6ff)] dark:bg-[var(--color-primary-900,#1e3a5f)]/20 text-sm">
                    <ConvertIcon className="w-4 h-4 text-[var(--color-primary-500)]" />
                    <span className="text-[var(--text-primary)] font-medium" dir="rtl">
                        {buildFormula(row)}
                    </span>
                </div>
            ),
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
    ], [getUnitName, buildFormula]);

    // ===== Actions Column =====
    const renderActions = useCallback((row) => (
        <div className="flex items-center gap-2">
            <PermissionGuard requires="warehouse.conversions.edit">
                <button
                    type="button"
                    onClick={() => handleOpenEdit(row)}
                    className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    aria-label={`تعديل معامل التحويل من ${row.fromUnitName} إلى ${row.toUnitName}`}
                    title="تعديل"
                >
                    <EditIcon className="w-4 h-4" />
                </button>
            </PermissionGuard>
            <PermissionGuard requires="warehouse.conversions.delete">
                <button
                    type="button"
                    onClick={() => handleDeleteConfirm(row)}
                    className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    aria-label={`حذف معامل التحويل من ${row.fromUnitName} إلى ${row.toUnitName}`}
                    title="حذف"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </PermissionGuard>
        </div>
    ), [handleOpenEdit, handleDeleteConfirm]);

    // ===== Preview formula in modal =====
    const previewFormula = useMemo(() => {
        if (!formData.fromUnitId || !formData.toUnitId || !formData.factor) return null;
        if (String(formData.fromUnitId) === String(formData.toUnitId)) return null;

        const fromName = getUnitName(formData.fromUnitId);
        const toName = getUnitName(formData.toUnitId);
        if (!fromName || !toName) return null;

        return `1 ${fromName} = ${formData.factor} ${toName}`;
    }, [formData, getUnitName]);

    // ===== Form Modal Content =====
    const renderFormContent = () => (
        <div className="space-y-5">
            {/* From Unit */}
            <div>
                <label
                    htmlFor="from-unit"
                    className="block text-sm font-bold text-[var(--text-primary)] mb-2"
                >
                    من وحدة <span className="text-red-500">*</span>
                </label>
                <select
                    id="from-unit"
                    value={formData.fromUnitId}
                    onChange={(e) => handleFormChange('fromUnitId', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary-100)] transition-all ${
                        formErrors.fromUnitId
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[var(--input-border)] focus:border-[var(--input-focus-border)]'
                    }`}
                    dir="rtl"
                >
                    <option value="">-- اختر وحدة المصدر --</option>
                    {units.map(unit => (
                        <option key={unit.id} value={unit.id}>
                            {unit.name}
                        </option>
                    ))}
                </select>
                {formErrors.fromUnitId && (
                    <p className="mt-1.5 text-xs text-red-500">{formErrors.fromUnitId}</p>
                )}
            </div>

            {/* To Unit */}
            <div>
                <label
                    htmlFor="to-unit"
                    className="block text-sm font-bold text-[var(--text-primary)] mb-2"
                >
                    إلى وحدة <span className="text-red-500">*</span>
                </label>
                <select
                    id="to-unit"
                    value={formData.toUnitId}
                    onChange={(e) => handleFormChange('toUnitId', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary-100)] transition-all ${
                        formErrors.toUnitId
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[var(--input-border)] focus:border-[var(--input-focus-border)]'
                    }`}
                    dir="rtl"
                >
                    <option value="">-- اختر وحدة الهدف --</option>
                    {units.map(unit => (
                        <option key={unit.id} value={unit.id}>
                            {unit.name}
                        </option>
                    ))}
                </select>
                {formErrors.toUnitId && (
                    <p className="mt-1.5 text-xs text-red-500">{formErrors.toUnitId}</p>
                )}
            </div>

            {/* Conversion Factor */}
            <div>
                <label
                    htmlFor="conversion-factor"
                    className="block text-sm font-bold text-[var(--text-primary)] mb-2"
                >
                    معامل التحويل <span className="text-red-500">*</span>
                </label>
                <input
                    id="conversion-factor"
                    type="number"
                    min="0.001"
                    step="any"
                    value={formData.factor}
                    onChange={(e) => handleFormChange('factor', e.target.value)}
                    placeholder="مثال: 24"
                    className={`w-full px-4 py-3 rounded-lg border bg-[var(--input-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary-100)] transition-all ${
                        formErrors.factor
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[var(--input-border)] focus:border-[var(--input-focus-border)]'
                    }`}
                    dir="ltr"
                />
                {formErrors.factor && (
                    <p className="mt-1.5 text-xs text-red-500">{formErrors.factor}</p>
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

            {/* Preview Formula */}
            {previewFormula && (
                <div className="mt-4 p-4 rounded-xl bg-[var(--color-primary-50,#eff6ff)] dark:bg-[var(--color-primary-900,#1e3a5f)]/20 border border-[var(--color-primary-200,#bfdbfe)] dark:border-[var(--color-primary-800,#1e40af)]/30">
                    <div className="flex items-center gap-2 mb-2">
                        <ConvertIcon className="w-5 h-5 text-[var(--color-primary-500)]" />
                        <span className="text-sm font-bold text-[var(--color-primary-500)]">
                            معاينة المعادلة
                        </span>
                    </div>
                    <p className="text-lg font-bold text-[var(--text-primary)] text-center" dir="rtl">
                        {previewFormula}
                    </p>
                </div>
            )}
        </div>
    );

    // ===== Render =====
    return (
        <div className="space-y-4">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <ConvertIcon className="w-5 h-5 text-[var(--color-primary-500)]" />
                    <h3 className="text-sm font-bold text-[var(--text-secondary)]">
                        معاملات التحويل ({conversions.length})
                    </h3>
                </div>
                <PermissionGuard requires="warehouse.conversions.create">
                    <Button
                        variant="primary"
                        size="sm"
                        icon={<PlusIcon className="w-4 h-4" />}
                        onClick={handleOpenCreate}
                    >
                        إضافة معامل تحويل
                    </Button>
                </PermissionGuard>
            </div>

            {/* Data Table */}
            <ContentCard padding="none">
                <DataTable
                    columns={columns}
                    data={conversions}
                    loading={loading}
                    emptyMessage="لا توجد معاملات تحويل بين الوحدات"
                    sortable
                    pagination
                    pageSize={10}
                    actions={renderActions}
                />
            </ContentCard>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingId ? 'تعديل معامل التحويل' : 'إضافة معامل تحويل جديد'}
                subtitle={editingId ? 'تعديل بيانات معامل التحويل بين الوحدات' : 'حدد وحدة المصدر والهدف ومعامل التحويل'}
                size="md"
                footer={
                    <>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            loading={saving}
                            size="md"
                        >
                            {saving ? 'جاري الحفظ...' : (editingId ? 'تحديث' : 'حفظ')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCloseModal}
                            disabled={saving}
                            size="md"
                        >
                            إلغاء
                        </Button>
                    </>
                }
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
                        هل أنت متأكد من حذف معامل التحويل؟
                    </p>
                    {deleteConfirm && (
                        <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <p className="text-[var(--text-secondary)] text-sm font-medium" dir="rtl">
                                {buildFormula(deleteConfirm)}
                            </p>
                        </div>
                    )}
                    <p className="text-[var(--text-secondary)] text-sm mt-3">
                        سيتم حذف هذا المعامل نهائيا ولا يمكن التراجع عن هذا الإجراء.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
