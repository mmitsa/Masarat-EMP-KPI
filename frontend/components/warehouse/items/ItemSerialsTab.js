import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ContentCard, DataTable, Badge, Button, Modal, SearchInput } from '../../ui';
import PermissionGuard from '../../PermissionGuard';
import api from '../../../lib/api';

import { SERIAL_STATUSES } from './constants';
import { PlusIcon, SerialIcon } from './icons';

// ==================== مكون إدارة السيريالات ====================

export default function ItemSerialsTab({ items = [] }) {
    // ---- الحالات ----
    const [serials, setSerials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [filters, setFilters] = useState({
        itemId: '',
        status: '',
        search: '',
    });

    const [addFormData, setAddFormData] = useState({
        itemId: '',
        serialNumbers: '',
    });

    // ---- تحميل البيانات ----
    useEffect(() => {
        let cancelled = false;

        async function loadData() {
            setLoading(true);
            try {
                const res = await api.warehouse?.getSerials?.().catch(() => null);

                if (cancelled) return;

                setSerials(res?.data || res || []);
            } catch {
                if (!cancelled) {
                    setSerials([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadData();
        return () => { cancelled = true; };
    }, []);

    // ---- تصفية البيانات ----
    const filteredSerials = useMemo(() => {
        let result = [...serials];

        if (filters.itemId) {
            result = result.filter(s => String(s.itemId) === String(filters.itemId));
        }

        if (filters.status) {
            result = result.filter(s => s.status === filters.status);
        }

        if (filters.search) {
            const term = filters.search.toLowerCase();
            result = result.filter(s =>
                s.serialNumber?.toLowerCase().includes(term)
            );
        }

        return result;
    }, [serials, filters]);

    // ---- عدد السيريالات المُدخلة في النموذج ----
    const parsedSerials = useMemo(() => {
        if (!addFormData.serialNumbers.trim()) return [];
        return addFormData.serialNumbers
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean);
    }, [addFormData.serialNumbers]);

    // ---- معالجة الفلاتر ----
    const handleFilterChange = useCallback((field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    }, []);

    // ---- فتح/إغلاق نافذة الإضافة ----
    const openAddModal = useCallback(() => {
        setAddFormData({ itemId: '', serialNumbers: '' });
        setShowAddModal(true);
    }, []);

    const closeAddModal = useCallback(() => {
        setShowAddModal(false);
        setAddFormData({ itemId: '', serialNumbers: '' });
    }, []);

    // ---- حفظ السيريالات ----
    const handleAddSerials = useCallback(async () => {
        if (!addFormData.itemId || parsedSerials.length === 0) return;

        setSaving(true);
        try {
            const selectedItem = items.find(i => String(i.id) === String(addFormData.itemId));

            const payload = {
                itemId: addFormData.itemId,
                serialNumbers: parsedSerials,
            };

            const res = await api.warehouse?.addSerials?.(payload)?.catch(() => null);

            // إنشاء سيريالات محلية للعرض
            const newSerials = parsedSerials.map((sn, idx) => ({
                id: res?.data?.[idx]?.id || Date.now() + idx,
                itemId: Number(addFormData.itemId),
                itemCode: selectedItem?.itemCode || '',
                itemName: selectedItem?.itemName || '',
                serialNumber: sn,
                status: 'available',
                warehouseId: null,
                warehouseName: '',
                custodianName: null,
                custodianId: null,
                receiptNoteNumber: '',
                createdAt: new Date().toISOString().split('T')[0],
            }));

            setSerials(prev => [...prev, ...newSerials]);
            closeAddModal();
        } catch {
            // يمكن إضافة toast للخطأ
        } finally {
            setSaving(false);
        }
    }, [addFormData, parsedSerials, items, closeAddModal]);

    // ---- الحصول على بادج الحالة ----
    const getStatusBadge = useCallback((status) => {
        const config = SERIAL_STATUSES[status];
        if (!config) {
            return <Badge variant="default" size="sm">{status}</Badge>;
        }

        const variantMap = {
            success: 'success',
            primary: 'primary',
            warning: 'warning',
            danger: 'danger',
        };

        return (
            <Badge
                variant={variantMap[config.variant] || 'default'}
                size="sm"
                dot
            >
                {config.label}
            </Badge>
        );
    }, []);

    // ---- أعمدة الجدول ----
    const columns = useMemo(() => [
        {
            key: 'serialNumber',
            title: 'رقم السيريال',
            render: (val) => (
                <span className="font-mono text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded tracking-wide">
                    {val}
                </span>
            ),
        },
        {
            key: 'itemName',
            title: 'اسم الصنف',
        },
        {
            key: 'status',
            title: 'الحالة',
            render: (val) => getStatusBadge(val),
        },
        {
            key: 'warehouseName',
            title: 'المستودع',
            render: (val) => val || <span className="text-gray-400">-</span>,
        },
        {
            key: 'custodianName',
            title: 'المستلم',
            render: (val) => val || <span className="text-gray-400">{'\u2014'}</span>,
        },
        {
            key: 'receiptNoteNumber',
            title: 'رقم سند الاستلام',
            render: (val) => val ? (
                <span className="text-primary-600 dark:text-primary-400 text-xs font-medium">
                    {val}
                </span>
            ) : <span className="text-gray-400">-</span>,
        },
        {
            key: 'createdAt',
            title: 'تاريخ الإنشاء',
            render: (val) => {
                if (!val) return <span className="text-gray-400">-</span>;
                try {
                    return new Date(val).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    });
                } catch {
                    return val;
                }
            },
        },
    ], [getStatusBadge]);

    // ---- التحقق من صحة النموذج ----
    const isFormValid = addFormData.itemId && parsedSerials.length > 0;

    // ---- العرض ----
    return (
        <div className="space-y-6">
            {/* === تنبيه معلوماتي === */}
            <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                    السيريالات تظهر عند التسليم وتُسجّل تلقائياً في عهدة الموظف وبطاقة عهدته وبوابته الإلكترونية
                </p>
            </div>

            {/* === بطاقة الجدول === */}
            <ContentCard
                title="سيريالات الأصناف"
                subtitle="إدارة الأرقام التسلسلية للأصناف المستديمة"
                icon={<SerialIcon className="w-5 h-5" />}
                actions={
                    <PermissionGuard requires="warehouse.serials.create">
                        <Button
                            variant="primary"
                            size="sm"
                            icon={<PlusIcon />}
                            onClick={openAddModal}
                        >
                            إضافة سيريالات
                        </Button>
                    </PermissionGuard>
                }
                padding="none"
            >
                {/* --- فلاتر --- */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* فلتر الصنف */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                الصنف
                            </label>
                            <select
                                value={filters.itemId}
                                onChange={(e) => handleFilterChange('itemId', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                            >
                                <option value="">جميع الأصناف</option>
                                {items.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.itemCode} - {item.itemName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* فلتر الحالة */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                الحالة
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                            >
                                <option value="">الكل</option>
                                {Object.entries(SERIAL_STATUSES).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* بحث بالسيريال */}
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                بحث برقم السيريال
                            </label>
                            <SearchInput
                                value={filters.search}
                                onChange={(val) => handleFilterChange('search', val)}
                                placeholder="بحث برقم السيريال..."
                                size="sm"
                            />
                        </div>
                    </div>
                </div>

                {/* --- الجدول --- */}
                <DataTable
                    columns={columns}
                    data={filteredSerials}
                    loading={loading}
                    emptyMessage="لا توجد سيريالات مسجلة"
                    pagination={true}
                    pageSize={10}
                />
            </ContentCard>

            {/* === نافذة إضافة سيريالات === */}
            <Modal
                isOpen={showAddModal}
                onClose={closeAddModal}
                title="إضافة سيريالات جديدة"
                subtitle="إضافة أرقام تسلسلية متعددة لصنف محدد"
                size="lg"
                footer={
                    <>
                        <Button
                            variant="primary"
                            onClick={handleAddSerials}
                            loading={saving}
                            disabled={!isFormValid}
                            icon={<PlusIcon />}
                        >
                            إضافة السيريالات
                        </Button>
                        <Button variant="outline" onClick={closeAddModal} disabled={saving}>
                            إلغاء
                        </Button>
                    </>
                }
            >
                <div className="space-y-5">
                    {/* اختيار الصنف */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            الصنف <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={addFormData.itemId}
                            onChange={(e) => setAddFormData(prev => ({ ...prev, itemId: e.target.value }))}
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

                    {/* إدخال السيريالات */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            الأرقام التسلسلية <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={addFormData.serialNumbers}
                            onChange={(e) => setAddFormData(prev => ({ ...prev, serialNumbers: e.target.value }))}
                            placeholder="أدخل كل سيريال في سطر منفصل"
                            rows={8}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all font-mono leading-relaxed resize-none"
                            dir="ltr"
                        />
                    </div>

                    {/* عدّاد المعاينة */}
                    {parsedSerials.length > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium text-green-800 dark:text-green-300">
                                        سيتم إضافة {parsedSerials.length.toLocaleString('ar-SA')} سيريال
                                    </span>
                                </div>
                            </div>

                            {/* معاينة أول 5 سيريالات */}
                            {parsedSerials.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                                    <div className="flex flex-wrap gap-1.5">
                                        {parsedSerials.slice(0, 5).map((sn, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-block font-mono text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded"
                                                dir="ltr"
                                            >
                                                {sn}
                                            </span>
                                        ))}
                                        {parsedSerials.length > 5 && (
                                            <span className="inline-block text-xs text-green-600 dark:text-green-400 px-2 py-0.5">
                                                +{(parsedSerials.length - 5).toLocaleString('ar-SA')} أخرى
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
