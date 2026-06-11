import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ContentCard, DataTable, Badge, Button, Modal, SearchInput, StatCard } from '../../ui';
import PermissionGuard from '../../PermissionGuard';
import api from '../../../lib/api';

import { FISCAL_YEARS } from './constants';
import { PlusIcon, EditIcon, TrashIcon, BalanceIcon } from './icons';

// ==================== الحالة الأولية للنموذج ====================

const INITIAL_FORM_DATA = {
    itemId: '',
    warehouseId: '',
    quantity: '',
    unitCost: '',
    batchNumber: '',
    expiryDate: '',
    fiscalYear: FISCAL_YEARS[0]?.value || '',
};

// ==================== تنسيق العملة ====================

function formatSAR(value) {
    const num = Number(value);
    if (isNaN(num)) return '0.00 ر.س';
    return num.toLocaleString('ar-SA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }) + ' ر.س';
}

// ==================== مكون الأرصدة الافتتاحية ====================

export default function OpeningBalancesTab({ items = [] }) {
    // ---- الحالات ----
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [warehouses, setWarehouses] = useState([]);
    const [saving, setSaving] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const [filters, setFilters] = useState({
        warehouseId: '',
        fiscalYear: '',
        search: '',
    });

    const [formData, setFormData] = useState(INITIAL_FORM_DATA);

    // ---- تحميل البيانات ----
    useEffect(() => {
        let cancelled = false;

        async function loadData() {
            setLoading(true);
            try {
                const [balancesRes, warehousesRes] = await Promise.all([
                    api.warehouse?.getOpeningBalances?.().catch(() => null),
                    api.warehouse?.getWarehouses?.().catch(() => null),
                ]);

                if (cancelled) return;

                setBalances(balancesRes?.data || balancesRes || []);
                setWarehouses(warehousesRes?.data || warehousesRes || []);
            } catch {
                if (!cancelled) {
                    setBalances([]);
                    setWarehouses([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadData();
        return () => { cancelled = true; };
    }, []);

    // ---- تصفية البيانات ----
    const filteredBalances = useMemo(() => {
        let result = [...balances];

        if (filters.warehouseId) {
            result = result.filter(b => String(b.warehouseId) === String(filters.warehouseId));
        }

        if (filters.fiscalYear) {
            result = result.filter(b => b.fiscalYear === filters.fiscalYear);
        }

        if (filters.search) {
            const term = filters.search.toLowerCase();
            result = result.filter(b =>
                b.itemName?.toLowerCase().includes(term) ||
                b.itemCode?.toLowerCase().includes(term) ||
                b.batchNumber?.toLowerCase().includes(term)
            );
        }

        return result;
    }, [balances, filters]);

    // ---- الإحصائيات ----
    const stats = useMemo(() => {
        const totalValue = filteredBalances.reduce((sum, b) => {
            const val = b.totalValue ?? (Number(b.quantity) * Number(b.unitCost));
            return sum + (val || 0);
        }, 0);

        const totalItems = filteredBalances.length;

        const uniqueWarehouses = new Set(filteredBalances.map(b => b.warehouseId)).size;

        return { totalValue, totalItems, uniqueWarehouses };
    }, [filteredBalances]);

    // ---- معالجة النموذج ----
    const handleFormChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleFilterChange = useCallback((field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    }, []);

    const openAddModal = useCallback(() => {
        setEditingId(null);
        setFormData(INITIAL_FORM_DATA);
        setShowModal(true);
    }, []);

    const openEditModal = useCallback((balance) => {
        setEditingId(balance.id);
        setFormData({
            itemId: balance.itemId || '',
            warehouseId: balance.warehouseId || '',
            quantity: balance.quantity || '',
            unitCost: balance.unitCost || '',
            batchNumber: balance.batchNumber || '',
            expiryDate: balance.expiryDate || '',
            fiscalYear: balance.fiscalYear || '',
        });
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setEditingId(null);
        setFormData(INITIAL_FORM_DATA);
    }, []);

    const handleSave = useCallback(async () => {
        if (!formData.itemId || !formData.warehouseId || !formData.quantity || !formData.unitCost) {
            return;
        }

        setSaving(true);
        try {
            const selectedItem = items.find(i => String(i.id) === String(formData.itemId));
            const selectedWarehouse = warehouses.find(w => String(w.id) === String(formData.warehouseId));
            const quantity = Number(formData.quantity);
            const unitCost = Number(formData.unitCost);

            const payload = {
                ...formData,
                quantity,
                unitCost,
                totalValue: quantity * unitCost,
                itemCode: selectedItem?.itemCode || '',
                itemName: selectedItem?.itemName || '',
                warehouseName: selectedWarehouse?.name || '',
                unitName: selectedItem?.unitName || '',
            };

            if (editingId) {
                // تحديث
                await api.warehouse?.updateOpeningBalance?.(editingId, payload)?.catch(() => null);
                setBalances(prev =>
                    prev.map(b => b.id === editingId ? { ...b, ...payload, id: editingId } : b)
                );
            } else {
                // إضافة جديد
                const res = await api.warehouse?.createOpeningBalance?.(payload)?.catch(() => null);
                const newId = res?.data?.id || res?.id || Date.now();
                setBalances(prev => [...prev, { ...payload, id: newId }]);
            }

            closeModal();
        } catch {
            // يمكن إضافة toast للخطأ
        } finally {
            setSaving(false);
        }
    }, [formData, editingId, items, warehouses, closeModal]);

    const handleDelete = useCallback(async (id) => {
        try {
            await api.warehouse?.deleteOpeningBalance?.(id)?.catch(() => null);
            setBalances(prev => prev.filter(b => b.id !== id));
        } catch {
            // يمكن إضافة toast للخطأ
        }
        setDeleteConfirmId(null);
    }, []);

    // ---- أعمدة الجدول ----
    const columns = useMemo(() => [
        {
            key: 'itemCode',
            title: 'رمز الصنف',
            width: '100px',
            render: (val) => (
                <span className="font-mono text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded">
                    {val}
                </span>
            ),
        },
        {
            key: 'itemName',
            title: 'اسم الصنف',
        },
        {
            key: 'warehouseName',
            title: 'المستودع',
        },
        {
            key: 'quantity',
            title: 'الكمية',
            render: (val, row) => (
                <span className="font-semibold">
                    {Number(val).toLocaleString('ar-SA')} {row.unitName || ''}
                </span>
            ),
        },
        {
            key: 'unitCost',
            title: 'تكلفة الوحدة',
            render: (val) => formatSAR(val),
        },
        {
            key: 'totalValue',
            title: 'القيمة الإجمالية',
            render: (val, row) => {
                const computed = val ?? (Number(row.quantity) * Number(row.unitCost));
                return (
                    <span className="font-bold text-success-600 dark:text-success-400">
                        {formatSAR(computed)}
                    </span>
                );
            },
        },
        {
            key: 'fiscalYear',
            title: 'السنة المالية',
            render: (val) => (
                <Badge variant="info" size="sm">{val} هـ</Badge>
            ),
        },
        {
            key: 'batchNumber',
            title: 'رقم الدفعة',
            render: (val) => val || <span className="text-gray-400">-</span>,
        },
    ], []);

    // ---- التحقق من صحة النموذج ----
    const isFormValid = formData.itemId && formData.warehouseId && formData.quantity && formData.unitCost && formData.fiscalYear;

    // ---- العرض ----
    return (
        <div className="space-y-6">
            {/* === إحصائيات === */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="إجمالي القيمة"
                    value={formatSAR(stats.totalValue)}
                    icon={<BalanceIcon className="w-6 h-6" />}
                    color="primary"
                    loading={loading}
                />
                <StatCard
                    title="عدد الأصناف"
                    value={stats.totalItems.toLocaleString('ar-SA')}
                    icon="📦"
                    color="success"
                    loading={loading}
                />
                <StatCard
                    title="عدد المستودعات"
                    value={stats.uniqueWarehouses.toLocaleString('ar-SA')}
                    icon="🏭"
                    color="info"
                    loading={loading}
                />
            </div>

            {/* === بطاقة الجدول === */}
            <ContentCard
                title="الأرصدة الافتتاحية"
                subtitle="إدارة أرصدة الأصناف الافتتاحية لكل مستودع وسنة مالية"
                icon={<BalanceIcon className="w-5 h-5" />}
                actions={
                    <PermissionGuard requires="warehouse.opening_balances.create">
                        <Button
                            variant="primary"
                            size="sm"
                            icon={<PlusIcon />}
                            onClick={openAddModal}
                        >
                            إضافة رصيد
                        </Button>
                    </PermissionGuard>
                }
                padding="none"
            >
                {/* --- فلاتر --- */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* فلتر المستودع */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                المستودع
                            </label>
                            <select
                                value={filters.warehouseId}
                                onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                            >
                                <option value="">جميع المستودعات</option>
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* فلتر السنة المالية */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                السنة المالية
                            </label>
                            <select
                                value={filters.fiscalYear}
                                onChange={(e) => handleFilterChange('fiscalYear', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                            >
                                <option value="">جميع السنوات</option>
                                {FISCAL_YEARS.map(fy => (
                                    <option key={fy.value} value={fy.value}>{fy.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* بحث */}
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                بحث
                            </label>
                            <SearchInput
                                value={filters.search}
                                onChange={(val) => handleFilterChange('search', val)}
                                placeholder="بحث بالاسم، الرمز، أو رقم الدفعة..."
                                size="sm"
                            />
                        </div>
                    </div>
                </div>

                {/* --- الجدول --- */}
                <DataTable
                    columns={columns}
                    data={filteredBalances}
                    loading={loading}
                    emptyMessage="لا توجد أرصدة افتتاحية"
                    pagination={true}
                    pageSize={10}
                    actions={(row) => (
                        <div className="flex items-center gap-1">
                            <PermissionGuard requires="warehouse.opening_balances.edit">
                                <button
                                    type="button"
                                    onClick={() => openEditModal(row)}
                                    className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                                    aria-label="تعديل الرصيد"
                                    title="تعديل"
                                >
                                    <EditIcon className="w-4 h-4" />
                                </button>
                            </PermissionGuard>
                            <PermissionGuard requires="warehouse.opening_balances.delete">
                                <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(row.id)}
                                    className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                    aria-label="حذف الرصيد"
                                    title="حذف"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </PermissionGuard>
                        </div>
                    )}
                />
            </ContentCard>

            {/* === نافذة الإضافة/التعديل === */}
            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={editingId ? 'تعديل رصيد افتتاحي' : 'إضافة رصيد افتتاحي'}
                subtitle="أدخل بيانات الرصيد الافتتاحي للصنف"
                size="lg"
                footer={
                    <>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            loading={saving}
                            disabled={!isFormValid}
                        >
                            {editingId ? 'حفظ التعديلات' : 'إضافة الرصيد'}
                        </Button>
                        <Button variant="outline" onClick={closeModal} disabled={saving}>
                            إلغاء
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* الصنف */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            الصنف <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.itemId}
                            onChange={(e) => handleFormChange('itemId', e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                        >
                            <option value="">اختر الصنف</option>
                            {items.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.itemCode} - {item.itemName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* المستودع */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            المستودع <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.warehouseId}
                            onChange={(e) => handleFormChange('warehouseId', e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                        >
                            <option value="">اختر المستودع</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* الكمية وتكلفة الوحدة */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                الكمية <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={formData.quantity}
                                onChange={(e) => handleFormChange('quantity', e.target.value)}
                                placeholder="0"
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                تكلفة الوحدة (ر.س) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.unitCost}
                                onChange={(e) => handleFormChange('unitCost', e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* معاينة القيمة الإجمالية */}
                    {formData.quantity && formData.unitCost && (
                        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-3 text-center">
                            <span className="text-xs text-primary-600 dark:text-primary-400">القيمة الإجمالية</span>
                            <p className="text-lg font-bold text-primary-700 dark:text-primary-300 mt-0.5">
                                {formatSAR(Number(formData.quantity) * Number(formData.unitCost))}
                            </p>
                        </div>
                    )}

                    {/* رقم الدفعة وتاريخ الانتهاء */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                رقم الدفعة
                            </label>
                            <input
                                type="text"
                                value={formData.batchNumber}
                                onChange={(e) => handleFormChange('batchNumber', e.target.value)}
                                placeholder="مثال: B-2025-001"
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                تاريخ الانتهاء
                            </label>
                            <input
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) => handleFormChange('expiryDate', e.target.value)}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* السنة المالية */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            السنة المالية <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.fiscalYear}
                            onChange={(e) => handleFormChange('fiscalYear', e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                        >
                            <option value="">اختر السنة المالية</option>
                            {FISCAL_YEARS.map(fy => (
                                <option key={fy.value} value={fy.value}>{fy.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Modal>

            {/* === نافذة تأكيد الحذف === */}
            <Modal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                title="تأكيد الحذف"
                size="sm"
                footer={
                    <>
                        <Button
                            variant="danger"
                            onClick={() => handleDelete(deleteConfirmId)}
                            icon={<TrashIcon />}
                        >
                            حذف
                        </Button>
                        <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                            إلغاء
                        </Button>
                    </>
                }
            >
                <div className="text-center py-2">
                    <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrashIcon className="w-7 h-7 text-red-500" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                        هل أنت متأكد من حذف هذا الرصيد الافتتاحي؟
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                        هذا الإجراء لا يمكن التراجع عنه
                    </p>
                </div>
            </Modal>
        </div>
    );
}
