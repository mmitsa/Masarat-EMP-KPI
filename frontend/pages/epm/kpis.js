import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/layout/AppLayout';
import { NAVIGATION } from '../../lib/routes';
import { navigateTo } from '../../lib/routeHelpers';
import { ContentCard, StatCard, DataTable, Button, Badge, Modal, Input, Select, SearchInput, Tabs, TabPanel } from '../../components/ui';
import api from '../../lib/api';
import { MEASUREMENT_TYPES } from '../../lib/epmOfficialStandards';

// Icons
const KPIIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const TrendUpIcon = () => (
    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const TrendDownIcon = () => (
    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
);

const categories = [
    { id: 'all', label: 'الكل' },
    ...MEASUREMENT_TYPES,
];

const statusConfig = {
    'exceeded': { label: 'تجاوز الهدف', color: 'success' },
    'on-track': { label: 'على المسار', color: 'info' },
    'at-risk': { label: 'في خطر', color: 'warning' },
    'off-track': { label: 'خارج المسار', color: 'danger' },
};

const frequencyLabels = {
    daily: 'يومي',
    weekly: 'أسبوعي',
    monthly: 'شهري',
    quarterly: 'ربع سنوي',
    yearly: 'سنوي',
};

export default function EPMKPIsPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedKPI, setSelectedKPI] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        target: '',
        unit: '',
        department: '',
        owner: '',
        frequency: 'monthly',
        description: ''
    });

    const filters = { categoryFilter, statusFilter };
    const { data: rawKpis, isLoading: loading } = useQuery({
        queryKey: ['epm-kpis', filters],
        queryFn: () => api.epm.getKPIs(filters),
        staleTime: 5 * 60 * 1000
    });
    const kpis = Array.isArray(rawKpis) ? rawKpis : [];

    // Stats
    const stats = {
        total: kpis.length,
        exceeded: kpis.filter(k => k.status === 'exceeded').length,
        onTrack: kpis.filter(k => k.status === 'on-track').length,
        atRisk: kpis.filter(k => k.status === 'at-risk').length,
        offTrack: kpis.filter(k => k.status === 'off-track').length,
    };

    // Filter KPIs
    const filteredKPIs = kpis.filter(kpi => {
        const matchesSearch = kpi.name.includes(searchTerm) ||
            kpi.department.includes(searchTerm) ||
            kpi.owner.includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || kpi.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' || kpi.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const createKPIMutation = useMutation({
        mutationFn: (data) => api.epm.createKPI(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['epm-kpis']);
            setShowModal(false);
            setFormData({
                name: '',
                category: '',
                target: '',
                unit: '',
                department: '',
                owner: '',
                frequency: 'monthly',
                description: ''
            });
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        createKPIMutation.mutate(formData);
    };

    const getProgressColor = (current, target, lowerIsBetter = false) => {
        const percentage = lowerIsBetter ? (target / current) * 100 : (current / target) * 100;
        if (percentage >= 100) return 'bg-green-500';
        if (percentage >= 80) return 'bg-green-600';
        if (percentage >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const calculateProgress = (current, target, lowerIsBetter = false) => {
        if (lowerIsBetter) {
            return Math.min(100, (target / current) * 100);
        }
        return Math.min(100, (current / target) * 100);
    };

    const columns = [
        {
            key: 'name',
            label: 'المؤشر',
            render: (value, row) => (
                <div>
                    <div className="font-medium">{value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{row?.id}</div>
                </div>
            )
        },
        {
            key: 'category',
            label: 'الفئة',
            render: (value) => (
                <Badge color="secondary">
                    {categories.find(c => c.id === value)?.label || value}
                </Badge>
            )
        },
        {
            key: 'progress',
            label: 'التقدم',
            render: (_, row) => {
                const isLowerBetter = ['تكلفة', 'وقت', 'معدل دوران'].some(term => row?.name?.includes(term));
                const progress = calculateProgress(row?.current, row?.target, isLowerBetter);
                return (
                    <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                            <span>{row?.current} {row?.unit}</span>
                            <span className="text-gray-500 dark:text-gray-400">/ {row?.target}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getProgressColor(row?.current, row?.target, isLowerBetter)} transition-all`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )
            }
        },
        {
            key: 'trend',
            label: 'الاتجاه',
            render: (value, row) => (
                <div className="flex items-center gap-1">
                    {value === 'up' ? <TrendUpIcon /> : value === 'down' ? <TrendDownIcon /> : <span className="text-gray-400">—</span>}
                    {row?.trendValue !== 0 && (
                        <span className={`text-sm ${row?.trendValue > 0 ? 'text-green-600' : 'text-red-600 dark:text-red-400'}`}>
                            {row?.trendValue > 0 ? '+' : ''}{row?.trendValue}%
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'department',
            label: 'القسم',
        },
        {
            key: 'frequency',
            label: 'التكرار',
            render: (value) => frequencyLabels[value] || value
        },
        {
            key: 'status',
            label: 'الحالة',
            render: (value) => (
                <Badge color={statusConfig[value]?.color || 'secondary'}>
                    {statusConfig[value]?.label || value}
                </Badge>
            )
        },
        {
            key: 'actions',
            label: 'الإجراءات',
            render: (_, row) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedKPI(row)}
                    >
                        تفاصيل
                    </Button>
                    <Button size="sm" variant="outline">
                        تحديث
                    </Button>
                </div>
            )
        }
    ];

    return (
        <AppLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <KPIIcon />
                            معايير القياس ومؤشرات الأداء
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            تعريف ومتابعة معيار القياس لكل هدف وفق ميثاق الأداء
                        </p>
                    </div>
                    <Button onClick={() => setShowModal(true)}>
                        <PlusIcon />
                        <span>مؤشر جديد</span>
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <StatCard
                        title="إجمالي المؤشرات"
                        value={stats.total}
                        icon={<KPIIcon />}
                        color="green"
                    />
                    <StatCard
                        title="تجاوز الهدف"
                        value={stats.exceeded}
                        icon={<TrendUpIcon />}
                        color="green"
                    />
                    <StatCard
                        title="على المسار"
                        value={stats.onTrack}
                        icon={<KPIIcon />}
                        color="green"
                    />
                    <StatCard
                        title="في خطر"
                        value={stats.atRisk}
                        icon={<KPIIcon />}
                        color="yellow"
                    />
                    <StatCard
                        title="خارج المسار"
                        value={stats.offTrack}
                        icon={<TrendDownIcon />}
                        color="red"
                    />
                </div>

                <ContentCard>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">أنواع معايير القياس الرسمية</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                استخدم هذه التصنيفات عند تعريف معيار القياس في الهدف: كمية، جودة، زمن، تكلفة، رضا المستفيد، أو التزام.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {MEASUREMENT_TYPES.map(type => (
                                <Badge key={type.id} color="secondary">{type.label}</Badge>
                            ))}
                        </div>
                    </div>
                </ContentCard>

                {/* Filters */}
                <ContentCard>
                    <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex-1 min-w-64">
                            <SearchInput
                                placeholder="بحث بالاسم أو القسم..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-40"
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </Select>
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-40"
                        >
                            <option value="all">جميع الحالات</option>
                            <option value="exceeded">تجاوز الهدف</option>
                            <option value="on-track">على المسار</option>
                            <option value="at-risk">في خطر</option>
                            <option value="off-track">خارج المسار</option>
                        </Select>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filteredKPIs}
                        loading={loading}
                        emptyMessage="لا توجد مؤشرات أداء"
                    />
                </ContentCard>

                {/* Create KPI Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="إنشاء مؤشر أداء جديد"
                    size="md"
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="اسم معيار القياس"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="نوع معيار القياس"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                            >
                                <option value="">اختر نوع القياس</option>
                                {categories.filter(c => c.id !== 'all').map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                            </Select>
                            <Select
                                label="التكرار"
                                value={formData.frequency}
                                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                            >
                                <option value="daily">يومي</option>
                                <option value="weekly">أسبوعي</option>
                                <option value="monthly">شهري</option>
                                <option value="quarterly">ربع سنوي</option>
                                <option value="yearly">سنوي</option>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                type="number"
                                label="القيمة المستهدفة"
                                value={formData.target}
                                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                required
                            />
                            <Input
                                label="الوحدة"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                placeholder="%, ر.س, ساعة..."
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="القسم"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                required
                            />
                            <Input
                                label="المسؤول"
                                value={formData.owner}
                                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                                required
                            />
                        </div>
                        <Input
                            label="الوصف"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="وصف المؤشر وكيفية قياسه"
                        />

                        <div className="flex gap-3 justify-end pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit">
                                إنشاء المؤشر
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* KPI Details Modal */}
                <Modal
                    isOpen={!!selectedKPI}
                    onClose={() => setSelectedKPI(null)}
                    title={`تفاصيل المؤشر: ${selectedKPI?.name || ''}`}
                    size="md"
                >
                    {selectedKPI && (
                        <div className="space-y-4">
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-4xl font-bold epm-saudi-number">
                                    {selectedKPI.current} {selectedKPI.unit}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    الهدف: {selectedKPI.target} {selectedKPI.unit}
                                </div>
                                <div className="mt-3">
                                    <Badge color={statusConfig[selectedKPI.status]?.color} size="lg">
                                        {statusConfig[selectedKPI.status]?.label}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">الفئة</label>
                                    <p className="font-medium">{categories.find(c => c.id === selectedKPI.category)?.label}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">القسم</label>
                                    <p className="font-medium">{selectedKPI.department}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">المسؤول</label>
                                    <p className="font-medium">{selectedKPI.owner}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">التكرار</label>
                                    <p className="font-medium">{frequencyLabels[selectedKPI.frequency]}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">الاتجاه</label>
                                    <div className="flex items-center gap-1">
                                        {selectedKPI.trend === 'up' ? <TrendUpIcon /> : selectedKPI.trend === 'down' ? <TrendDownIcon /> : <span>—</span>}
                                        <span className={selectedKPI.trendValue > 0 ? 'text-green-600' : 'text-red-600 dark:text-red-400'}>
                                            {selectedKPI.trendValue > 0 ? '+' : ''}{selectedKPI.trendValue}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t">
                                <Button variant="outline" onClick={() => setSelectedKPI(null)}>
                                    إغلاق
                                </Button>
                                <Button>
                                    تحديث القيمة
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AppLayout>
    );
}
