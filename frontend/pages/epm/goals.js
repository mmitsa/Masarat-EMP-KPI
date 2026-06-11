import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/layout/AppLayout';
import { NAVIGATION } from '../../lib/routes';
import { navigateTo } from '../../lib/routeHelpers';
import { ContentCard, StatCard, DataTable, Button, Badge, Modal, Input, Select, SearchInput, Tabs, TabPanel } from '../../components/ui';
import api from '../../lib/api';
import { GOAL_COLUMNS, MEASUREMENT_TYPES, QUESTION_BANK, calculateGoalWeightedScore, getTotalWeight } from '../../lib/epmOfficialStandards';
import { sendQuestionnaire } from '../../lib/epmWorkflowStore';

// Icons
const GoalIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const FlagIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const categories = [
    { id: 'all', label: 'الكل' },
    ...MEASUREMENT_TYPES,
];

const priorities = [
    { id: 'critical', label: 'حرج', color: 'danger' },
    { id: 'high', label: 'عالي', color: 'warning' },
    { id: 'medium', label: 'متوسط', color: 'info' },
    { id: 'low', label: 'منخفض', color: 'secondary' },
];

const statusConfig = {
    'on-track': { label: 'على المسار', color: 'success' },
    'at-risk': { label: 'في خطر', color: 'warning' },
    'delayed': { label: 'متأخر', color: 'danger' },
    'completed': { label: 'مكتمل', color: 'success' },
    'cancelled': { label: 'ملغى', color: 'secondary' },
};

const initialGoalForm = {
    title: '',
    description: '',
    measurementType: '',
    measurementCriterion: '',
    weight: '',
    targetResult: '',
    actualResult: '',
    rating: 3,
    priority: 'medium',
    owner: '',
    department: '',
    startDate: '',
    dueDate: '',
    milestones: '',
    questionIds: QUESTION_BANK.filter((question) => question.context === 'goal' && question.required).map((question) => question.id),
};

export default function EPMGoalsPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [formData, setFormData] = useState(initialGoalForm);

    const filters = { categoryFilter, statusFilter };
    const { data: rawGoals, isLoading: loading } = useQuery({
        queryKey: ['epm-goals', filters],
        queryFn: () => api.epm.getGoals(filters),
        staleTime: 5 * 60 * 1000
    });
    const goals = Array.isArray(rawGoals) ? rawGoals : [];

    // Stats
    const stats = {
        total: goals.length,
        onTrack: goals.filter(g => g.status === 'on-track').length,
        atRisk: goals.filter(g => g.status === 'at-risk').length,
        delayed: goals.filter(g => g.status === 'delayed').length,
        avgProgress: Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length || 0),
        totalWeight: getTotalWeight(goals),
    };

    // Filter goals
    const filteredGoals = goals.filter(goal => {
        const matchesSearch = goal.title.includes(searchTerm) ||
            goal.owner.includes(searchTerm) ||
            goal.department.includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || goal.category === categoryFilter || goal.measurementType === categoryFilter;
        const matchesStatus = statusFilter === 'all' || goal.status === statusFilter;
        const matchesTab = activeTab === 'all' ||
            (activeTab === 'active' && ['on-track', 'at-risk', 'delayed'].includes(goal.status)) ||
            (activeTab === 'critical' && goal.priority === 'critical');
        return matchesSearch && matchesCategory && matchesStatus && matchesTab;
    });

    const goalQuestionOptions = QUESTION_BANK.filter((question) => {
        const contextMatch = question.context === 'goal' || question.context === 'directive';
        const departmentMatch = !formData.department || ['عام', formData.department].includes(question.department);
        return contextMatch && departmentMatch && ['employee', 'manager'].includes(question.audience);
    });

    const toggleGoalQuestion = (questionId) => {
        setFormData((prev) => ({
            ...prev,
            questionIds: prev.questionIds.includes(questionId)
                ? prev.questionIds.filter((id) => id !== questionId)
                : [...prev.questionIds, questionId],
        }));
    };

    const createGoalMutation = useMutation({
        mutationFn: (data) => api.epm.createGoal(data),
        onSuccess: (_data, variables) => {
            if (variables.questionIds?.length) {
                sendQuestionnaire({
                    title: `أسئلة تنفيذ الهدف - ${variables.title}`,
                    department: variables.department || 'عام',
                    context: 'goal',
                    employeeName: variables.owner,
                    managerName: 'مدير الإدارة',
                    linkedGoalTitle: variables.title,
                    dueDate: variables.dueDate,
                    questionIds: variables.questionIds,
                });
            }
            queryClient.invalidateQueries(['epm-goals']);
            setShowModal(false);
            setFormData(initialGoalForm);
        }
    });

    const updateProgressMutation = useMutation({
        mutationFn: ({ goalId, newProgress }) => api.epm.updateGoalProgress(goalId, newProgress),
        onSuccess: () => {
            queryClient.invalidateQueries(['epm-goals']);
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        createGoalMutation.mutate(formData);
    };

    const handleUpdateProgress = async (goalId, newProgress) => {
        updateProgressMutation.mutate({ goalId, newProgress });
    };

    const getProgressColor = (progress) => {
        if (progress >= 75) return 'bg-green-500';
        if (progress >= 50) return 'bg-green-600';
        if (progress >= 25) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const columns = [
        {
            key: 'title',
            label: 'الهدف',
            render: (_, row) => (
                <div>
                    <div className="font-medium">{row?.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{row?.description}</div>
                </div>
            )
        },
        {
            key: 'priority',
            label: 'نوع القياس',
            render: (value, row) => {
                const priority = priorities.find(p => p.id === value);
                const measurementType = MEASUREMENT_TYPES.find(type => type.id === row?.measurementType || type.id === row?.category);
                return (
                    <Badge color="secondary">
                        {measurementType?.label || priority?.label || value || 'غير محدد'}
                    </Badge>
                );
            }
        },
        {
            key: 'owner',
            label: 'المسؤول',
            render: (value, row) => (
                <div>
                    <div className="font-medium">{value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{row?.department}</div>
                </div>
            )
        },
        {
            key: 'measurementCriterion',
            label: 'معيار القياس',
            render: (value, row) => value || row?.measurableIndicators || '—'
        },
        {
            key: 'targetResult',
            label: 'الناتج المستهدف',
            render: (value, row) => value || row?.targetResult || '—'
        },
        {
            key: 'actualResult',
            label: 'الناتج الفعلي',
            render: (value, row) => value || row?.actualResult || '—'
        },
        {
            key: 'weightedRating',
            label: 'التقدير الموزون',
            render: (_, row) => {
                const rating = row?.rating || row?.actualScore || 0;
                const weight = row?.weight || 0;
                return `${calculateGoalWeightedScore(rating, weight)}/5`;
            }
        },
        {
            key: 'progress',
            label: 'التقدم',
            render: (value) => (
                <div className="w-32">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{value}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getProgressColor(value)} transition-all`}
                            style={{ width: `${value}%` }}
                        />
                    </div>
                </div>
            )
        },
        {
            key: 'milestones',
            label: 'المراحل',
            render: (value) => (
                <div className="flex gap-1">
                    {value?.map((m, i) => (
                        <div
                            key={i}
                            className={`w-3 h-3 rounded-full ${m.completed ? 'bg-green-500' : 'bg-gray-300'}`}
                            title={m.title}
                        />
                    ))}
                </div>
            )
        },
        {
            key: 'dueDate',
            label: 'الموعد النهائي',
            render: (value, row) => {
                const isOverdue = new Date(value) < new Date() && row?.status !== 'completed';
                return (
                    <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                        {value}
                    </span>
                );
            }
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
                        onClick={() => {
                            setSelectedGoal(row);
                            setShowDetailsModal(true);
                        }}
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

    const tabs = [
        { id: 'all', label: 'جميع الأهداف', count: goals.length },
        { id: 'active', label: 'نشطة', count: goals.filter(g => ['on-track', 'at-risk', 'delayed'].includes(g.status)).length },
        { id: 'critical', label: 'حرجة', count: goals.filter(g => g.priority === 'critical').length },
    ];

    return (
        <AppLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <GoalIcon />
                            الأهداف الاستراتيجية
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            إدارة ومتابعة الأهداف المؤسسية
                        </p>
                    </div>
                    <Button onClick={() => setShowModal(true)}>
                        <PlusIcon />
                        <span>هدف جديد</span>
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <StatCard
                        title="إجمالي الأهداف"
                        value={stats.total}
                        icon={<GoalIcon />}
                        color="green"
                    />
                    <StatCard
                        title="على المسار"
                        value={stats.onTrack}
                        icon={<CheckCircleIcon />}
                        color="green"
                    />
                    <StatCard
                        title="في خطر"
                        value={stats.atRisk}
                        icon={<FlagIcon />}
                        color="yellow"
                    />
                    <StatCard
                        title="متأخرة"
                        value={stats.delayed}
                        icon={<FlagIcon />}
                        color="red"
                    />
                    <StatCard
                        title="متوسط التقدم"
                        value={`${stats.avgProgress}%`}
                        icon={<GoalIcon />}
                        color="green"
                    />
                </div>

                {/* Tabs */}
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                <ContentCard>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">نموذج أهداف الميثاق</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                الأهداف الآن مبنية على أعمدة النموذج الرسمي، مع إلزام مجموع الوزن النسبي بـ 100%.
                            </p>
                        </div>
                        <div className="lg:col-span-2 flex flex-wrap gap-2">
                            {GOAL_COLUMNS.map(column => (
                                <Badge key={column} color="secondary">{column}</Badge>
                            ))}
                        </div>
                    </div>
                </ContentCard>

                {/* Table */}
                <ContentCard>
                    <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex-1 min-w-64">
                            <SearchInput
                                placeholder="بحث بالعنوان أو المسؤول..."
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
                            <option value="on-track">على المسار</option>
                            <option value="at-risk">في خطر</option>
                            <option value="delayed">متأخر</option>
                            <option value="completed">مكتمل</option>
                        </Select>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filteredGoals}
                        loading={loading}
                        emptyMessage="لا توجد أهداف"
                    />
                </ContentCard>

                {/* Create Goal Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="إنشاء هدف جديد"
                    size="lg"
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="عنوان الهدف"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                        <Input
                            label="وصف الهدف"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="وصف تفصيلي للهدف"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="نوع معيار القياس"
                                value={formData.measurementType}
                                onChange={(e) => setFormData({ ...formData, measurementType: e.target.value })}
                                required
                            >
                                <option value="">اختر نوع القياس</option>
                                {categories.filter(c => c.id !== 'all').map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                            </Select>
                            <Input
                                label="الوزن النسبي"
                                type="number"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                placeholder="مثال: 20"
                                required
                            />
                        </div>
                        <Input
                            label="معيار القياس"
                            value={formData.measurementCriterion}
                            onChange={(e) => setFormData({ ...formData, measurementCriterion: e.target.value })}
                            placeholder="مثال: نسبة الإنجاز، عدد المعاملات، مدة الإنجاز"
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="الناتج المستهدف"
                                value={formData.targetResult}
                                onChange={(e) => setFormData({ ...formData, targetResult: e.target.value })}
                                required
                            />
                            <Input
                                label="الناتج الفعلي"
                                value={formData.actualResult}
                                onChange={(e) => setFormData({ ...formData, actualResult: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="التقدير (1-5)"
                                value={formData.rating}
                                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                            >
                                {[1, 2, 3, 4, 5].map(value => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </Select>
                            <Select
                                label="الأولوية"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            >
                                {priorities.map(p => (
                                    <option key={p.id} value={p.id}>{p.label}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="المسؤول"
                                value={formData.owner}
                                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                                required
                            />
                            <Input
                                label="القسم"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                type="date"
                                label="تاريخ البدء"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                            <Input
                                type="date"
                                label="الموعد النهائي"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                required
                            />
                        </div>
                        <Input
                            label="المراحل الرئيسية"
                            value={formData.milestones}
                            onChange={(e) => setFormData({ ...formData, milestones: e.target.value })}
                            placeholder="أدخل المراحل مفصولة بفاصلة"
                        />

                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                            <div className="mb-3">
                                <h3 className="font-bold text-gray-900 dark:text-white">أسئلة تُرسل للموظف مع الهدف</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">يظهر هذا البنك للمسؤول عند وضع الهدف، وتنتقل الأسئلة لصندوق الموظف للرد وربط الردود بالمهام.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {goalQuestionOptions.map((question) => (
                                    <label key={question.id} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                                        <input
                                            type="checkbox"
                                            className="mt-1"
                                            checked={formData.questionIds.includes(question.id)}
                                            onChange={() => toggleGoalQuestion(question.id)}
                                        />
                                        <span>
                                            <span className="block font-medium text-gray-900 dark:text-white">{question.text}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{question.department} - {question.required ? 'إلزامي' : 'اختياري'}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit">
                                إنشاء الهدف
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Details Modal */}
                <Modal
                    isOpen={showDetailsModal}
                    onClose={() => setShowDetailsModal(false)}
                    title={selectedGoal?.title || ''}
                    size="lg"
                >
                    {selectedGoal && (
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-400">{selectedGoal.description}</p>

                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <div className="text-center mb-3">
                                    <div className="text-4xl font-bold epm-saudi-number">{selectedGoal.progress}%</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">نسبة الإنجاز</div>
                                </div>
                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getProgressColor(selectedGoal.progress)} transition-all`}
                                        style={{ width: `${selectedGoal.progress}%` }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">المسؤول</label>
                                    <p className="font-medium">{selectedGoal.owner}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">القسم</label>
                                    <p className="font-medium">{selectedGoal.department}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">الأولوية</label>
                                    <p>
                                        <Badge color={priorities.find(p => p.id === selectedGoal.priority)?.color}>
                                            {priorities.find(p => p.id === selectedGoal.priority)?.label}
                                        </Badge>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">الحالة</label>
                                    <p>
                                        <Badge color={statusConfig[selectedGoal.status]?.color}>
                                            {statusConfig[selectedGoal.status]?.label}
                                        </Badge>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">تاريخ البدء</label>
                                    <p className="font-medium">{selectedGoal.startDate}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">الموعد النهائي</label>
                                    <p className="font-medium">{selectedGoal.dueDate}</p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3">المراحل الرئيسية</h4>
                                <div className="space-y-2">
                                    {selectedGoal.milestones.map((m, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${m.completed ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                                                {m.completed && <CheckCircleIcon />}
                                            </div>
                                            <span className={m.completed ? 'line-through text-gray-400' : ''}>{m.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t">
                                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                                    إغلاق
                                </Button>
                                <Button>
                                    تحديث التقدم
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AppLayout>
    );
}
