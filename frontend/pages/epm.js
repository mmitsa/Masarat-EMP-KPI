import { NAVIGATION } from '../lib/routes';
import { navigateTo } from '../lib/routeHelpers';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '../components/layout/AppLayout';
import { useTheme } from '../context/AppContext';
import api from '../lib/api';
import {
    IMPACT_RULES,
    PERFORMANCE_CYCLE_STAGES,
    PERFORMANCE_TEMPLATES,
    RATING_SCALE,
} from '../lib/epmOfficialStandards';
import { getWorkflowStats, loadWorkflowStore, readWorkflowStore } from '../lib/epmWorkflowStore';

export default function EPMModule() {
    const router = useRouter();
    const { darkMode } = useTheme();
    const { section } = router.query;
    const [activeSection, setActiveSection] = useState(section || 'dashboard');
    const [workflowStats, setWorkflowStats] = useState(() => getWorkflowStats(readWorkflowStore()));

    useEffect(() => {
        const reloadWorkflowStats = () => setWorkflowStats(getWorkflowStats(readWorkflowStore()));
        loadWorkflowStore().then((store) => setWorkflowStats(getWorkflowStats(store))).catch(reloadWorkflowStats);
        window.addEventListener('epm-workflow-updated', reloadWorkflowStats);
        return () => window.removeEventListener('epm-workflow-updated', reloadWorkflowStats);
    }, []);

    // Fetch dashboard summary
    const {
        data: dashboardStats,
        isLoading: statsLoading,
        error: statsError,
    } = useQuery({
        queryKey: ['epm-dashboard-summary'],
        queryFn: () => api.epm.getDashboardSummary(),
        staleTime: 5 * 60 * 1000, retry: 1,
        select: (data) => data ? {
            avgPerformance: data?.averagePerformance ?? data?.averageScore ?? 0,
            totalEmployees: data?.totalEmployees ?? 0,
            evaluatedEmployees: data?.evaluatedEmployees ?? data?.chartersCompleted ?? data?.totalCharters ?? 0,
            excellentPerformers: data?.excellentPerformers ?? data?.goalsAchieved ?? 0,
            needsImprovement: data?.needsImprovement ?? data?.pendingCharters ?? 0,
        } : null,
    });

    // Fetch charters (used as performance data in dashboard view)
    const {
        data: charters,
        isLoading: chartersLoading,
    } = useQuery({
        queryKey: ['epm-charters'],
        queryFn: () => api.epm.getCharters(),
        staleTime: 5 * 60 * 1000, retry: 1,
        select: (data) => data?.Data || data || [],
    });

    // Fetch goals
    const {
        data: goals,
        isLoading: goalsLoading,
    } = useQuery({
        queryKey: ['epm-goals'],
        queryFn: () => api.epm.getGoals(),
        staleTime: 5 * 60 * 1000, retry: 1,
        select: (data) => data?.Data || data || [],
    });

    // Fetch evaluations
    const {
        data: evaluations,
        isLoading: evaluationsLoading,
    } = useQuery({
        queryKey: ['epm-evaluations'],
        queryFn: () => api.epm.getEvaluations(),
        staleTime: 5 * 60 * 1000, retry: 1,
        select: (data) => data?.Data || data || [],
    });

    const isLoading = statsLoading || chartersLoading || goalsLoading || evaluationsLoading;

    // Derive performance data from charters/evaluations
    const performanceData = Array.isArray(charters) ? charters.map((charter, idx) => ({
        id: charter.id || idx + 1,
        employee: charter.employeeName || charter.employee || `موظف ${idx + 1}`,
        department: charter.departmentName || charter.department || '',
        score: charter.score || charter.performanceScore || 0,
        trend: (charter.score || charter.performanceScore || 0) >= 80 ? 'up' : 'down',
    })) : [];

    // Handle create evaluation
    const handleCreateEvaluation = async () => {
        navigateTo(router, NAVIGATION.EPM.EVALUATION_NEW);
    };

    // Handle create goal
    const handleCreateGoal = async () => {
        navigateTo(router, NAVIGATION.EPM.GOAL_NEW);
    };

    const sections = [
        { id: 'dashboard', label: 'لوحة الأداء', icon: '\u{1F4CA}' },
        { id: 'kpis', label: 'مؤشرات الأداء', icon: '\u{1F3AF}' },
        { id: 'evaluations', label: 'التقييمات', icon: '\u{1F4DD}' },
        { id: 'goals', label: 'الأهداف', icon: '\u{1F3C6}' },
    ];

    const handleSectionChange = (sectionId) => {
        setActiveSection(sectionId);
        router.push(`/epm?section=${sectionId}`, undefined, { shallow: true });
    };

    if (isLoading) {
        return (
            <AppLayout title="قياس الأداء الوظيفي" subtitle="تتبع وتحليل أداء الموظفين">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">جاري تحميل البيانات...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const stats = dashboardStats || {
        avgPerformance: 0,
        totalEmployees: 0,
        evaluatedEmployees: 0,
        excellentPerformers: 0,
        needsImprovement: 0,
    };

    const evaluatedPercent = stats.evaluatedEmployees > 0
        ? Math.round((stats.excellentPerformers / stats.evaluatedEmployees) * 100)
        : 0;
    const improvementPercent = stats.evaluatedEmployees > 0
        ? Math.round((stats.needsImprovement / stats.evaluatedEmployees) * 100)
        : 0;

    return (
        <AppLayout title="قياس الأداء الوظيفي" subtitle="تتبع وتحليل أداء الموظفين">
            {/* Performance Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className={`epm-saudi-kpi rounded-xl p-6 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-900'}`}>
                    <div className="text-3xl mb-2">{'\u{1F3AF}'}</div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>معدل الأداء العام</p>
                    <p className="text-3xl font-bold epm-saudi-number">{stats.avgPerformance}%</p>
                </div>
                <div className={`epm-saudi-kpi rounded-xl p-6 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-900'}`}>
                    <div className="text-3xl mb-2">{'\u{1F465}'}</div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>موظفين مقيّمين</p>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{stats.evaluatedEmployees.toLocaleString('ar-SA')}</p>
                    <p className="text-xs text-green-700 mt-1">من أصل {stats.totalEmployees.toLocaleString('ar-SA')} موظف</p>
                </div>
                <div className={`epm-saudi-kpi rounded-xl p-6 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-900'}`}>
                    <div className="text-3xl mb-2">{'\u{1F4C8}'}</div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>أداء متميز</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.excellentPerformers}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{evaluatedPercent}% من الموظفين</p>
                </div>
                <div className={`epm-saudi-kpi rounded-xl p-6 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-900'}`}>
                    <div className="text-3xl mb-2">{'\u26A0\uFE0F'}</div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>يحتاج تحسين</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.needsImprovement}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{improvementPercent}% من الموظفين</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                <div className={`epm-saudi-card rounded-xl p-6 shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
                    <div className="flex items-start justify-between gap-4 mb-5">
                        <div>
                            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>بنك الأسئلة والمهام</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">متابعة أسئلة الأهداف والتقييمات وتحويل إجابات الموظفين إلى مهام تنفيذية.</p>
                        </div>
                        <button
                            onClick={() => router.push('/epm/question-bank')}
                            className="px-4 py-2 rounded-lg epm-saudi-primary text-sm transition"
                        >
                            بنك الأسئلة
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <WorkflowMiniStat label="نماذج بانتظار الرد" value={workflowStats.pendingQuestionnaires} />
                        <WorkflowMiniStat label="ردود مستلمة" value={workflowStats.answeredQuestionnaires} />
                        <WorkflowMiniStat label="مهام مفتوحة" value={Math.max(workflowStats.totalTasks - workflowStats.completedTasks, 0)} />
                        <WorkflowMiniStat label="طلبات تمديد" value={workflowStats.extensionRequests} />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                        <button
                            onClick={() => router.push('/epm/tasks')}
                            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 transition"
                        >
                            إدارة المهام والمتابعة
                        </button>
                        <button
                            onClick={() => router.push('/epm/goals')}
                            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 transition"
                        >
                            إنشاء هدف مع أسئلة
                        </button>
                    </div>
                </div>

                <div className={`epm-saudi-card rounded-xl p-6 shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
                    <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>مسار المتابعة العملي</h2>
                    <div className="space-y-3">
                        {[
                            'المسؤول يختار أسئلة من البنك عند وضع الهدف أو التقييم.',
                            'الموظف يرد على الأسئلة ويحوّل الرد إلى خطة مهام محددة المدة.',
                            'المدير يتابع الإنجاز ويقبل أو يرفض طلبات التمديد مع سبب موثق.',
                            'النتائج تغذي توصيات التحسين وأثر الأداء على القرارات.',
                        ].map((step, index) => (
                            <div key={step} className="epm-saudi-step flex items-start gap-3 rounded-lg bg-gray-50 dark:bg-gray-800/70 p-3">
                                <span className="epm-saudi-step-index w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0">
                                    {index + 1}
                                </span>
                                <p className="text-sm text-gray-700 dark:text-gray-200 leading-6">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                {Object.values(PERFORMANCE_TEMPLATES).map(template => (
                    <div key={template.id} className={`epm-saudi-card rounded-xl p-6 shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{template.charterTitle}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.evaluationTitle}</p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold epm-saudi-soft">
                                {template.label}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {template.competencies.map(competency => (
                                <div key={competency.id} className="rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium text-gray-900 dark:text-white">{competency.name}</span>
                                        <span className="text-sm font-bold epm-saudi-number">{competency.weight}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className={`epm-saudi-card rounded-xl p-6 shadow-sm border mb-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
                <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>مقياس التقدير العام</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {RATING_SCALE.map(item => (
                        <div key={item.score} className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3">
                            <div className="text-xl font-bold epm-saudi-number">{item.score} - {item.label}</div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-5">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                <div className={`epm-saudi-card rounded-xl p-6 shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>مراحل دورة الأداء الرسمية</h2>
                        <button
                            onClick={() => router.push('/epm/governance')}
                            className="px-4 py-2 rounded-lg epm-saudi-primary text-sm transition"
                        >
                            الحوكمة والقرارات
                        </button>
                    </div>
                    <div className="space-y-3">
                        {PERFORMANCE_CYCLE_STAGES.map((stage, index) => (
                            <div key={stage.id} className="epm-saudi-step flex items-start gap-3 rounded-lg bg-gray-50 dark:bg-gray-800/70 p-3">
                                <span className="epm-saudi-step-index w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0">
                                    {index + 1}
                                </span>
                                <div>
                                    <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{stage.title}</div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stage.owner}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`epm-saudi-card rounded-xl p-6 shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
                    <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>أثر النتائج على القرارات</h2>
                    <div className="space-y-3">
                        {IMPACT_RULES.map(rule => (
                            <div key={rule.id} className="rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                                <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{rule.title}</div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-6">{rule.systemAction}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Section Navigation */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className={`epm-saudi-card rounded-xl shadow-sm p-4 ${darkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-900'}`}>
                        <nav className="space-y-2">
                            {sections.map((sec) => (
                                <button
                                    key={sec.id}
                                    onClick={() => handleSectionChange(sec.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                        activeSection === sec.id
                                            ? 'epm-saudi-soft font-bold'
                                            : darkMode
                                                ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="text-xl">{sec.icon}</span>
                                    <span>{sec.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    <div className={`epm-saudi-card rounded-xl shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-900'}`}>
                        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100 dark:border-gray-800'}`}>
                            <div className="flex items-center justify-between">
                                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {sections.find(s => s.id === activeSection)?.label || 'تقييمات الأداء'}
                                </h2>
                                <button
                                    onClick={handleCreateEvaluation}
                                    className="px-4 py-2 epm-saudi-primary rounded-lg transition"
                                >
                                    + تقييم جديد
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            {activeSection === 'dashboard' && (
                                <div className="space-y-4">
                                    {performanceData.length > 0 ? performanceData.map((emp) => (
                                        <div
                                            key={emp.id}
                                            className={`flex items-center gap-4 p-4 border rounded-xl transition ${
                                                darkMode
                                                    ? 'border-gray-700 hover:border-green-700'
                                                    : 'border-gray-100 dark:border-gray-800 hover:border-green-700/30'
                                            }`}
                                        >
                                            <div className="w-12 h-12 rounded-full epm-saudi-soft flex items-center justify-center font-bold">
                                                {emp.employee[0]}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                    {emp.employee}
                                                </h3>
                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {emp.department}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold epm-saudi-number">{emp.score}%</div>
                                                <span className={`text-xs ${emp.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                                    {emp.trend === 'up' ? '\u2191 تحسن' : '\u2193 تراجع'}
                                                </span>
                                            </div>
                                            <button className={`px-4 py-2 rounded-lg transition ${
                                                darkMode
                                                    ? 'text-green-400 hover:bg-green-900/30'
                                                    : 'text-green-700 hover:bg-green-50'
                                            }`}>
                                                التفاصيل
                                            </button>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12 text-gray-400">
                                            <p>لا توجد بيانات أداء متاحة حالياً</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeSection === 'kpis' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Array.isArray(goals) && goals.length > 0 ? goals.slice(0, 4).map((goal, idx) => (
                                        <div key={goal.id || idx} className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'}`}>
                                            <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                {goal.nameAr || goal.name || `مؤشر ${idx + 1}`}
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}>المستهدف</span>
                                                    <span className="font-bold">{goal.target || 0}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                                                    <div className="bg-green-700 h-3 rounded-full" style={{ width: `${Math.min(goal.progress || 0, 100)}%` }}></div>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}>المحقق</span>
                                                    <span className="font-bold epm-saudi-number">{goal.progress || 0}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-2 text-center py-12 text-gray-400">
                                            <p>لا توجد مؤشرات أداء متاحة حالياً</p>
                                            <button
                                                onClick={handleCreateGoal}
                                                className="mt-4 px-6 py-3 epm-saudi-primary rounded-lg transition"
                                            >
                                                إضافة هدف جديد
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeSection === 'evaluations' && (
                                <div>
                                    {Array.isArray(evaluations) && evaluations.length > 0 ? (
                                        <div className="space-y-4">
                                            {evaluations.map((evaluation, idx) => (
                                                <div
                                                    key={evaluation.id || idx}
                                                    className={`flex items-center gap-4 p-4 border rounded-xl transition ${
                                                        darkMode
                                                            ? 'border-gray-700 hover:border-green-700'
                                                            : 'border-gray-100 dark:border-gray-800 hover:border-green-700/30'
                                                    }`}
                                                >
                                                    <div className="flex-1">
                                                        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                            {evaluation.employeeName || evaluation.title || `تقييم ${idx + 1}`}
                                                        </h3>
                                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                            {evaluation.period || evaluation.evaluationPeriod || ''}
                                                        </p>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xl font-bold epm-saudi-number">
                                                            {evaluation.score || evaluation.totalScore || 0}%
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                            <div className="text-6xl mb-4">{'\u{1F4DD}'}</div>
                                            <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                التقييمات الدورية
                                            </h3>
                                            <p>لا توجد تقييمات حالياً. ابدأ بإنشاء تقييم جديد.</p>
                                            <button
                                                onClick={handleCreateEvaluation}
                                                className="mt-4 px-6 py-3 epm-saudi-primary rounded-lg transition"
                                            >
                                                بدء تقييم جديد
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeSection === 'goals' && (
                                <div>
                                    {Array.isArray(goals) && goals.length > 0 ? (
                                        <div className="space-y-4">
                                            {goals.map((goal, idx) => (
                                                <div
                                                    key={goal.id || idx}
                                                    className={`flex items-center gap-4 p-4 border rounded-xl transition ${
                                                        darkMode
                                                            ? 'border-gray-700 hover:border-green-700'
                                                            : 'border-gray-100 dark:border-gray-800 hover:border-green-700/30'
                                                    }`}
                                                >
                                                    <div className="flex-1">
                                                        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                            {goal.nameAr || goal.name || `هدف ${idx + 1}`}
                                                        </h3>
                                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                            {goal.description || ''}
                                                        </p>
                                                    </div>
                                                    <div className="w-32">
                                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                            <div className="bg-green-700 h-2 rounded-full" style={{ width: `${Math.min(goal.progress || 0, 100)}%` }}></div>
                                                        </div>
                                                        <p className="text-xs text-center mt-1 epm-saudi-number font-bold">{goal.progress || 0}%</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                            <div className="text-6xl mb-4">{'\u{1F3C6}'}</div>
                                            <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                الأهداف والإنجازات
                                            </h3>
                                            <p>لا توجد أهداف حالياً. ابدأ بإضافة هدف جديد.</p>
                                            <button
                                                onClick={handleCreateGoal}
                                                className="mt-4 px-6 py-3 epm-saudi-primary rounded-lg transition"
                                            >
                                                إضافة هدف جديد
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

const WorkflowMiniStat = ({ label, value }) => (
    <div className="epm-saudi-step rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        <div className="mt-1 text-2xl font-bold epm-saudi-number">{value}</div>
    </div>
);

export const config = { ssr: true };


export async function getServerSideProps(context) {
  return { props: {} }
}
