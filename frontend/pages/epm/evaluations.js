import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/layout/AppLayout';
import { NAVIGATION } from '../../lib/routes';
import { navigateTo } from '../../lib/routeHelpers';
import { ContentCard, StatCard, DataTable, Button, Badge, Modal, Input, Select, SearchInput, Tabs, TabPanel } from '../../components/ui';
import api from '../../lib/api';
import { HistoricalDataPanel } from '../../components/historical';
import {
    CHARTER_FIELDS,
    GOAL_COLUMNS,
    JOB_CATEGORIES,
    QUESTION_BANK,
    RATING_SCALE,
    calculateCompetencyScore,
    getRatingLabel,
    getTemplate,
} from '../../lib/epmOfficialStandards';
import { sendQuestionnaire } from '../../lib/epmWorkflowStore';

// Icons
const EvaluationIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const StarIcon = ({ filled }) => (
    <svg className={`w-5 h-5 ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

const statusConfig = {
    'scheduled': { label: 'مجدول', color: 'secondary' },
    'in-progress': { label: 'قيد التقييم', color: 'info' },
    'pending-review': { label: 'بانتظار المراجعة', color: 'warning' },
    'completed': { label: 'مكتمل', color: 'success' },
    'approved': { label: 'معتمد', color: 'success' },
};

const periods = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025'];

const initialScheduleForm = {
    employeeId: '',
    jobCategory: 'nonSupervisory',
    jobTitle: '',
    jobNumber: '',
    agencyName: '',
    departmentName: '',
    managerName: '',
    period: 'Q4 2024',
    scheduledDate: '',
    questionIds: QUESTION_BANK.filter((question) => question.context === 'evaluation' && question.required).map((question) => question.id),
};

export default function EPMEvaluationsPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [periodFilter, setPeriodFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showEvalModal, setShowEvalModal] = useState(false);
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);
    const [formData, setFormData] = useState(initialScheduleForm);
    const [evalFormData, setEvalFormData] = useState({
        jobCategory: 'nonSupervisory',
        responsibility: 3,
        cooperation: 3,
        communication: 3,
        results: 3,
        development: 3,
        engagement: 3,
        leadership: 3,
        comments: '',
        strengths: '',
        improvements: ''
    });

    const charterTemplate = getTemplate(formData.jobCategory);
    const evaluationTemplate = getTemplate(evalFormData.jobCategory || selectedEvaluation?.jobCategory);
    const evaluationCriteria = evaluationTemplate.competencies;

    const { data: rawEmployees } = useQuery({
        queryKey: ['epm-employees'],
        queryFn: async () => {
            const res = await api.epm?.getEmployees?.().catch(() => null);
            return res?.data?.data || res?.data || res || [];
        },
        staleTime: 10 * 60 * 1000,
    });
    const employees = Array.isArray(rawEmployees) ? rawEmployees : [];

    const filters = { statusFilter, periodFilter };
    const { data: rawEvaluations, isLoading: loading } = useQuery({
        queryKey: ['epm-evaluations', filters],
        queryFn: () => api.epm.getEvaluations(filters),
        staleTime: 5 * 60 * 1000
    });
    const evaluations = Array.isArray(rawEvaluations) ? rawEvaluations : [];

    // Stats
    const stats = {
        total: evaluations.length,
        completed: evaluations.filter(e => ['completed', 'approved'].includes(e.status)).length,
        inProgress: evaluations.filter(e => e.status === 'in-progress').length,
        pending: evaluations.filter(e => e.status === 'pending-review').length,
        avgScore: (evaluations.filter(e => e.overallScore).reduce((sum, e) => sum + e.overallScore, 0) / evaluations.filter(e => e.overallScore).length || 0).toFixed(1),
    };

    // Filter evaluations
    const filteredEvaluations = evaluations.filter(evaluation => {
        const matchesSearch = (evaluation.employeeName || '').includes(searchTerm) ||
            (evaluation.department || '').includes(searchTerm) ||
            (evaluation.evaluator || '').includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || evaluation.status === statusFilter;
        const matchesPeriod = periodFilter === 'all' || evaluation.period === periodFilter;
        const matchesTab = activeTab === 'all' ||
            (activeTab === 'pending' && ['scheduled', 'in-progress', 'pending-review'].includes(evaluation.status)) ||
            (activeTab === 'completed' && ['completed', 'approved'].includes(evaluation.status));
        return matchesSearch && matchesStatus && matchesPeriod && matchesTab;
    });

    const evaluationQuestionOptions = QUESTION_BANK.filter((question) => {
        const contextMatch = question.context === 'evaluation' || question.context === 'followup';
        const departmentMatch = !formData.departmentName || ['عام', formData.departmentName].includes(question.department);
        return contextMatch && departmentMatch && ['employee', 'manager'].includes(question.audience);
    });

    const toggleEvaluationQuestion = (questionId) => {
        setFormData((prev) => ({
            ...prev,
            questionIds: prev.questionIds.includes(questionId)
                ? prev.questionIds.filter((id) => id !== questionId)
                : [...prev.questionIds, questionId],
        }));
    };

    const scheduleEvaluationMutation = useMutation({
        mutationFn: (data) => api.epm.scheduleEvaluation(data),
        onSuccess: (_data, variables) => {
            const employee = employees.find((item) => String(item.id) === String(variables.employeeId));
            const employeeName = employee?.name || employee?.fullName || employee?.nameAr || variables.employeeId || 'موظف';
            if (variables.questionIds?.length) {
                sendQuestionnaire({
                    title: `أسئلة تقييم الأداء - ${employeeName}`,
                    department: variables.departmentName || employee?.departmentName || employee?.department || 'عام',
                    context: 'evaluation',
                    employeeName,
                    managerName: variables.managerName || 'مدير الإدارة',
                    linkedGoalTitle: `تقييم ${variables.period}`,
                    dueDate: variables.scheduledDate,
                    questionIds: variables.questionIds,
                });
            }
            queryClient.invalidateQueries(['epm-evaluations']);
            setShowModal(false);
            setFormData(initialScheduleForm);
        }
    });

    const submitEvaluationMutation = useMutation({
        mutationFn: ({ id, data }) => api.epm.submitEvaluation(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['epm-evaluations']);
            setShowEvalModal(false);
        }
    });

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        scheduleEvaluationMutation.mutate(formData);
    };

    const handleEvaluationSubmit = async (e) => {
        e.preventDefault();
        submitEvaluationMutation.mutate({ id: selectedEvaluation.id, data: evalFormData });
    };

    const calculateOverall = () => {
        return calculateCompetencyScore(evalFormData, evalFormData.jobCategory).toFixed(2);
    };

    const renderStars = (score) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                    <StarIcon key={star} filled={star <= Math.round(score)} />
                ))}
            </div>
        );
    };

    const columns = [
        {
            key: 'employee',
            label: 'الموظف',
            render: (_, row) => (
                <div>
                    <div className="font-medium">{row?.employeeName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{row?.position}</div>
                </div>
            )
        },
        {
            key: 'department',
            label: 'القسم',
        },
        {
            key: 'evaluator',
            label: 'المقيّم',
        },
        {
            key: 'period',
            label: 'الفترة',
            render: (value) => <Badge color="secondary">{value}</Badge>
        },
        {
            key: 'score',
            label: 'التقييم',
            render: (_, row) => (
                row?.overallScore ? (
                    <div>
                        {renderStars(row?.overallScore)}
                        <span className="text-sm font-medium mr-2">{row?.overallScore}/5</span>
                    </div>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            )
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
                        onClick={() => setSelectedEvaluation(row)}
                    >
                        عرض
                    </Button>
                    {row?.status === 'in-progress' && (
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                                setSelectedEvaluation(row);
                                setShowEvalModal(true);
                            }}
                        >
                            تقييم
                        </Button>
                    )}
                </div>
            )
        }
    ];

    const tabs = [
        { id: 'all', label: 'جميع التقييمات', count: evaluations.length },
        { id: 'pending', label: 'قيد الإجراء', count: evaluations.filter(e => ['scheduled', 'in-progress', 'pending-review'].includes(e.status)).length },
        { id: 'completed', label: 'مكتملة', count: evaluations.filter(e => ['completed', 'approved'].includes(e.status)).length },
        { id: 'historical', label: 'البيانات التاريخية' },
    ];

    return (
        <AppLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <EvaluationIcon />
                            تقييمات الأداء
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            إدارة تقييمات الأداء وفق نماذج الميثاق الإشرافي وغير الإشرافي
                        </p>
                    </div>
                    <Button onClick={() => setShowModal(true)}>
                        <PlusIcon />
                        <span>جدولة تقييم</span>
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <StatCard
                        title="إجمالي التقييمات"
                        value={stats.total}
                        icon={<EvaluationIcon />}
                        color="green"
                    />
                    <StatCard
                        title="مكتملة"
                        value={stats.completed}
                        icon={<EvaluationIcon />}
                        color="green"
                    />
                    <StatCard
                        title="قيد التقييم"
                        value={stats.inProgress}
                        icon={<EvaluationIcon />}
                        color="yellow"
                    />
                    <StatCard
                        title="بانتظار المراجعة"
                        value={stats.pending}
                        icon={<EvaluationIcon />}
                        color="orange"
                    />
                    <StatCard
                        title="متوسط التقييم"
                        value={`${stats.avgScore}/5`}
                        icon={<StarIcon filled />}
                        color="green"
                    />
                </div>

                {/* Tabs */}
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                {activeTab === 'historical' ? (
                    <HistoricalDataPanel screenId="epm-evaluations" />
                ) : (
                <>
                <ContentCard className="mb-6">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">معايير الميثاق الرسمية</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-7">
                                تم تطبيق حقول النموذج: {CHARTER_FIELDS.map(field => field.label).join('، ')}.
                                ويجب أن يكون مجموع أوزان الأهداف والجدارات 100%.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">أعمدة قياس الأهداف</h3>
                            <div className="flex flex-wrap gap-2">
                                {GOAL_COLUMNS.map(column => (
                                    <Badge key={column} color="secondary">{column}</Badge>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">مقياس التقدير</h3>
                            <div className="space-y-2">
                                {RATING_SCALE.map(item => (
                                    <div key={item.score} className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{item.score} - {item.label}</span>
                                        <span className="text-gray-500 dark:text-gray-400 truncate max-w-48">{item.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ContentCard>
                {/* Table */}
                <ContentCard>
                    <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex-1 min-w-64">
                            <SearchInput
                                placeholder="بحث بالاسم أو القسم..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(typeof e === 'string' ? e : e?.target?.value || '')}
                            />
                        </div>
                        <Select
                            value={periodFilter}
                            onChange={(e) => setPeriodFilter(e.target.value)}
                            className="w-40"
                        >
                            <option value="all">جميع الفترات</option>
                            {periods.map(period => (
                                <option key={period} value={period}>{period}</option>
                            ))}
                        </Select>
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-48"
                        >
                            <option value="all">جميع الحالات</option>
                            <option value="scheduled">مجدول</option>
                            <option value="in-progress">قيد التقييم</option>
                            <option value="pending-review">بانتظار المراجعة</option>
                            <option value="completed">مكتمل</option>
                            <option value="approved">معتمد</option>
                        </Select>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filteredEvaluations}
                        loading={loading}
                        emptyMessage="لا توجد تقييمات"
                    />
                </ContentCard>
                </>
                )}

                {/* Schedule Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="جدولة تقييم جديد"
                    size="md"
                >
                    <form onSubmit={handleScheduleSubmit} className="space-y-4">
                        <Select
                            label="الموظف"
                            value={formData.employeeId}
                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                            required
                        >
                            <option value="">اختر الموظف</option>
                            {employees.length === 0 && <option disabled>لا توجد بيانات</option>}
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.name || emp.fullName || emp.nameAr} - {emp.departmentName || emp.department || ''}
                                </option>
                            ))}
                        </Select>
                        <Select
                            label="نوع الوظيفة"
                            value={formData.jobCategory}
                            onChange={(e) => setFormData({ ...formData, jobCategory: e.target.value })}
                            required
                        >
                            {Object.values(JOB_CATEGORIES).map(category => (
                                <option key={category.id} value={category.id}>{category.label}</option>
                            ))}
                        </Select>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                            <div className="font-semibold text-gray-900 dark:text-white mb-2">{charterTemplate.charterTitle}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input
                                    label="المسمى الوظيفي"
                                    value={formData.jobTitle}
                                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                />
                                <Input
                                    label="الرقم الوظيفي"
                                    value={formData.jobNumber}
                                    onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                                />
                                <Input
                                    label="الوكالة / الإدارة العامة"
                                    value={formData.agencyName}
                                    onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                                />
                                <Input
                                    label="الإدارة / القسم"
                                    value={formData.departmentName}
                                    onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                                />
                                <Input
                                    label="المدير (المقيّم)"
                                    value={formData.managerName}
                                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                                />
                            </div>
                        </div>
                        <Select
                            label="الفترة"
                            value={formData.period}
                            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                            required
                        >
                            {periods.map(period => (
                                <option key={period} value={period}>{period}</option>
                            ))}
                        </Select>
                        <Input
                            type="date"
                            label="تاريخ التقييم"
                            value={formData.scheduledDate}
                            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                            required
                        />

                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                            <div className="mb-3">
                                <h3 className="font-bold text-gray-900 dark:text-white">أسئلة التقييم المرسلة للموظف</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">تستخدم كجزء من متابعة التقييم، وتتحول إجابات الموظف إلى مهام تحسين عند الحاجة.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {evaluationQuestionOptions.map((question) => (
                                    <label key={question.id} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                                        <input
                                            type="checkbox"
                                            className="mt-1"
                                            checked={formData.questionIds.includes(question.id)}
                                            onChange={() => toggleEvaluationQuestion(question.id)}
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
                                جدولة
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Evaluation Form Modal */}
                <Modal
                    isOpen={showEvalModal}
                    onClose={() => setShowEvalModal(false)}
                    title={`تقييم: ${selectedEvaluation?.employeeName || ''}`}
                    size="lg"
                >
                    <form onSubmit={handleEvaluationSubmit} className="space-y-4">
                        <div className="epm-saudi-soft p-4 rounded-lg mb-4">
                            <div className="font-medium">{selectedEvaluation?.employeeName}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedEvaluation?.position} - {selectedEvaluation?.department}
                            </div>
                        </div>

                        <Select
                            label="نوع الوظيفة حسب نموذج الميثاق"
                            value={evalFormData.jobCategory}
                            onChange={(e) => setEvalFormData({ ...evalFormData, jobCategory: e.target.value })}
                            required
                        >
                            {Object.values(JOB_CATEGORIES).map(category => (
                                <option key={category.id} value={category.id}>{category.label}</option>
                            ))}
                        </Select>

                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                            <div className="font-semibold text-gray-900 dark:text-white mb-2">{evaluationTemplate.evaluationTitle}</div>
                            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                {evaluationTemplate.notes.map(note => <li key={note}>• {note}</li>)}
                            </ul>
                        </div>

                        {evaluationCriteria.map(criterion => (
                            <div key={criterion.id} className="border-b pb-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                    <label className="font-medium">{criterion.name}</label>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">({criterion.weight}%)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setEvalFormData({ ...evalFormData, [criterion.id]: star })}
                                                className="focus:outline-none"
                                            >
                                                <StarIcon filled={star <= evalFormData[criterion.id]} />
                                            </button>
                                        ))}
                                    </div>
                                    <span className="w-8 text-center font-medium">{evalFormData[criterion.id]}</span>
                                    <Badge color="secondary">{getRatingLabel(evalFormData[criterion.id])}</Badge>
                                    </div>
                                </div>
                                <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    {criterion.behaviors.map(behavior => (
                                        <li key={behavior}>• {behavior}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                            <div className="text-sm text-gray-500 dark:text-gray-400">التقييم الإجمالي</div>
                            <div className="text-3xl font-bold epm-saudi-number">{calculateOverall()}/5</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{getRatingLabel(Math.round(Number(calculateOverall())))}</div>
                        </div>

                        <Input
                            label="نقاط القوة"
                            value={evalFormData.strengths}
                            onChange={(e) => setEvalFormData({ ...evalFormData, strengths: e.target.value })}
                            placeholder="أبرز نقاط القوة لدى الموظف"
                        />
                        <Input
                            label="مجالات التحسين"
                            value={evalFormData.improvements}
                            onChange={(e) => setEvalFormData({ ...evalFormData, improvements: e.target.value })}
                            placeholder="المجالات التي تحتاج تحسين"
                        />
                        <Input
                            label="ملاحظات إضافية"
                            value={evalFormData.comments}
                            onChange={(e) => setEvalFormData({ ...evalFormData, comments: e.target.value })}
                            placeholder="أي ملاحظات أخرى"
                        />

                        <div className="flex gap-3 justify-end pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowEvalModal(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit">
                                حفظ التقييم
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* View Details Modal */}
                <Modal
                    isOpen={!!selectedEvaluation && !showEvalModal}
                    onClose={() => setSelectedEvaluation(null)}
                    title={`تفاصيل تقييم: ${selectedEvaluation?.employeeName || ''}`}
                    size="md"
                >
                    {selectedEvaluation && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">الموظف</label>
                                    <p className="font-medium">{selectedEvaluation.employeeName}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">المنصب</label>
                                    <p className="font-medium">{selectedEvaluation.position}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">القسم</label>
                                    <p className="font-medium">{selectedEvaluation.department}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">المقيّم</label>
                                    <p className="font-medium">{selectedEvaluation.evaluator}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">الفترة</label>
                                    <p><Badge color="secondary">{selectedEvaluation.period}</Badge></p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">الحالة</label>
                                    <p>
                                        <Badge color={statusConfig[selectedEvaluation.status]?.color}>
                                            {statusConfig[selectedEvaluation.status]?.label}
                                        </Badge>
                                    </p>
                                </div>
                            </div>

                            {selectedEvaluation.scores && (
                                <>
                                    <div className="border-t pt-4">
                                        <h4 className="font-medium mb-3">تفاصيل التقييم</h4>
                                        {getTemplate(selectedEvaluation.jobCategory).competencies.map(criterion => (
                                            <div key={criterion.id} className="flex justify-between items-center py-2">
                                                <span>{criterion.name}</span>
                                                <div className="flex items-center gap-2">
                                                    {renderStars(selectedEvaluation.scores[criterion.id])}
                                                    <span className="font-medium">{selectedEvaluation.scores[criterion.id]}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="epm-saudi-soft p-4 rounded-lg text-center">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">التقييم الإجمالي</div>
                                        <div className="text-3xl font-bold epm-saudi-number">{selectedEvaluation.overallScore}/5</div>
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 justify-end pt-4 border-t">
                                <Button variant="outline" onClick={() => setSelectedEvaluation(null)}>
                                    إغلاق
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AppLayout>
    );
}
