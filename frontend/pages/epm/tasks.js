import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { Badge, Button, ContentCard, Input, Select, StatCard, Tabs } from '../../components/ui';
import {
    TASK_STATUS,
    createTask,
    decideTaskExtension,
    getWorkflowStats,
    loadWorkflowStore,
    readWorkflowStore,
    requestTaskExtension,
    updateTask,
} from '../../lib/epmWorkflowStore';

const priorityLabels = {
    critical: { label: 'حرجة', color: 'danger' },
    high: { label: 'عالية', color: 'warning' },
    medium: { label: 'متوسطة', color: 'info' },
    low: { label: 'منخفضة', color: 'secondary' },
};

const sourceLabels = {
    managerDirective: 'توجيه مدير',
    self: 'مهمة ذاتية',
    questionnaire: 'من إجابة موظف',
    goal: 'مرتبطة بهدف',
};

const initialTaskForm = {
    title: '',
    description: '',
    department: 'عام',
    assigneeName: '',
    managerName: 'مدير الإدارة',
    linkedGoalTitle: '',
    startDate: '',
    dueDate: '',
    priority: 'medium',
};

export default function EPMTasksPage() {
    const [store, setStore] = useState(() => readWorkflowStore());
    const [activeTab, setActiveTab] = useState('all');
    const [filters, setFilters] = useState({ department: 'all', status: 'all', sourceType: 'all' });
    const [managerTask, setManagerTask] = useState(initialTaskForm);
    const [selfTask, setSelfTask] = useState({ ...initialTaskForm, managerName: '', priority: 'medium' });
    const [extensionForms, setExtensionForms] = useState({});
    const [progressForms, setProgressForms] = useState({});
    const [managerComments, setManagerComments] = useState({});

    const reload = () => setStore(readWorkflowStore());

    useEffect(() => {
        loadWorkflowStore().then(setStore);
        const onUpdate = () => reload();
        window.addEventListener('epm-workflow-updated', onUpdate);
        return () => window.removeEventListener('epm-workflow-updated', onUpdate);
    }, []);

    const stats = useMemo(() => getWorkflowStats(store), [store]);
    const departments = useMemo(() => ['all', ...new Set((store.tasks || []).map((task) => task.department || 'عام'))], [store.tasks]);

    const filteredTasks = useMemo(() => {
        return (store.tasks || []).filter((task) => {
            const tabMatch = activeTab === 'all'
                || (activeTab === 'employee' && ['self', 'questionnaire'].includes(task.sourceType))
                || (activeTab === 'manager' && task.sourceType === 'managerDirective')
                || (activeTab === 'extension' && task.status === 'extensionRequested');
            const statusMatch = filters.status === 'all' || task.status === filters.status;
            const departmentMatch = filters.department === 'all' || task.department === filters.department;
            const sourceMatch = filters.sourceType === 'all' || task.sourceType === filters.sourceType;
            return tabMatch && statusMatch && departmentMatch && sourceMatch;
        });
    }, [activeTab, filters, store.tasks]);

    const tabs = [
        { id: 'all', label: 'كل المهام', count: store.tasks.length },
        { id: 'manager', label: 'مهام المدير', count: store.tasks.filter((task) => task.sourceType === 'managerDirective').length },
        { id: 'employee', label: 'مهام الموظف', count: store.tasks.filter((task) => ['self', 'questionnaire'].includes(task.sourceType)).length },
        { id: 'extension', label: 'طلبات التمديد', count: stats.extensionRequests },
    ];

    const handleCreateManagerTask = (event) => {
        event.preventDefault();
        if (!managerTask.title || !managerTask.assigneeName || !managerTask.dueDate) return;
        createTask({
            ...managerTask,
            sourceType: 'managerDirective',
            createdBy: 'manager',
            history: [{ at: new Date().toISOString().slice(0, 10), action: 'أسند المدير المهمة للموظف' }],
        });
        setManagerTask(initialTaskForm);
        reload();
    };

    const handleCreateSelfTask = (event) => {
        event.preventDefault();
        if (!selfTask.title || !selfTask.assigneeName || !selfTask.dueDate) return;
        createTask({
            ...selfTask,
            sourceType: 'self',
            createdBy: 'employee',
            history: [{ at: new Date().toISOString().slice(0, 10), action: 'أنشأ الموظف مهمة ذاتية لتنفيذ هدف أو التزام' }],
        });
        setSelfTask({ ...initialTaskForm, managerName: '', priority: 'medium' });
        reload();
    };

    const handleProgress = (task) => {
        const progress = Number(progressForms[task.id] ?? task.progress ?? 0);
        const nextStatus = progress >= 100 ? 'completed' : 'inProgress';
        updateTask(task.id, { progress: Math.max(0, Math.min(progress, 100)), status: nextStatus }, `حدث الموظف نسبة الإنجاز إلى ${progress}%`);
        reload();
    };

    const handleExtensionRequest = (task) => {
        const form = extensionForms[task.id] || {};
        if (!form.reason || !form.requestedDueDate) return;
        requestTaskExtension(task.id, form);
        setExtensionForms((prev) => ({ ...prev, [task.id]: { reason: '', requestedDueDate: '' } }));
        reload();
    };

    const handleExtensionDecision = (task, approved) => {
        decideTaskExtension(task.id, approved, managerComments[task.id] || '');
        setManagerComments((prev) => ({ ...prev, [task.id]: '' }));
        reload();
    };

    return (
        <AppLayout title="المهام والمتابعة" subtitle="إدارة مهام قياس الأداء وربطها بالأهداف وأسئلة الميثاق">
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    <StatCard title="إجمالي المهام" value={stats.totalTasks} icon="📌" color="primary" />
                    <StatCard title="منجزة" value={stats.completedTasks} icon="✓" color="success" />
                    <StatCard title="متأخرة" value={stats.delayedTasks} icon="!" color="error" />
                    <StatCard title="طلبات تمديد" value={stats.extensionRequests} icon="⏱" color="warning" />
                    <StatCard title="نماذج بانتظار الرد" value={stats.pendingQuestionnaires} icon="؟" color="info" />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <TaskForm
                        title="إسناد مهمة من المدير"
                        subtitle="توجيه مرتبط بهدف أو التزام داخل الإدارة"
                        form={managerTask}
                        setForm={setManagerTask}
                        onSubmit={handleCreateManagerTask}
                        submitLabel="إسناد المهمة"
                        requireManager
                    />
                    <TaskForm
                        title="إضافة مهمة ذاتية للموظف"
                        subtitle="خطة تنفيذ يضيفها الموظف للرد على هدف أو تحسين أداء"
                        form={selfTask}
                        setForm={setSelfTask}
                        onSubmit={handleCreateSelfTask}
                        submitLabel="إضافة مهمة ذاتية"
                    />
                </div>

                <ContentCard>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <Select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
                            {departments.map((department) => (
                                <option key={department} value={department}>{department === 'all' ? 'كل الإدارات' : department}</option>
                            ))}
                        </Select>
                        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                            <option value="all">كل الحالات</option>
                            {Object.values(TASK_STATUS).map((status) => (
                                <option key={status.id} value={status.id}>{status.label}</option>
                            ))}
                        </Select>
                        <Select value={filters.sourceType} onChange={(e) => setFilters({ ...filters, sourceType: e.target.value })}>
                            <option value="all">كل المصادر</option>
                            {Object.entries(sourceLabels).map(([id, label]) => (
                                <option key={id} value={id}>{label}</option>
                            ))}
                        </Select>
                        <Button variant="outline" onClick={() => setFilters({ department: 'all', status: 'all', sourceType: 'all' })}>
                            تصفية الكل
                        </Button>
                    </div>
                </ContentCard>

                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                <div className="grid grid-cols-1 gap-5">
                    {filteredTasks.length === 0 ? (
                        <ContentCard>
                            <div className="py-10 text-center text-gray-500 dark:text-gray-400">لا توجد مهام مطابقة</div>
                        </ContentCard>
                    ) : filteredTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            progressValue={progressForms[task.id] ?? task.progress ?? 0}
                            onProgressChange={(value) => setProgressForms((prev) => ({ ...prev, [task.id]: value }))}
                            onStart={() => {
                                updateTask(task.id, { status: 'inProgress', progress: Math.max(task.progress || 0, 10) }, 'بدأ الموظف تنفيذ المهمة');
                                reload();
                            }}
                            onComplete={() => {
                                updateTask(task.id, { status: 'completed', progress: 100 }, 'أنجز الموظف المهمة');
                                reload();
                            }}
                            onProgress={() => handleProgress(task)}
                            extensionForm={extensionForms[task.id] || { reason: '', requestedDueDate: '' }}
                            onExtensionChange={(patch) => setExtensionForms((prev) => ({ ...prev, [task.id]: { ...(prev[task.id] || {}), ...patch } }))}
                            onExtensionRequest={() => handleExtensionRequest(task)}
                            managerComment={managerComments[task.id] || ''}
                            onManagerComment={(value) => setManagerComments((prev) => ({ ...prev, [task.id]: value }))}
                            onApprove={() => handleExtensionDecision(task, true)}
                            onReject={() => handleExtensionDecision(task, false)}
                        />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}

const TaskForm = ({ title, subtitle, form, setForm, onSubmit, submitLabel, requireManager = false }) => (
    <ContentCard title={title} subtitle={subtitle}>
        <form onSubmit={onSubmit} className="space-y-4">
            <Input label="عنوان المهمة" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea
                className="min-h-24 w-full rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="وصف المهمة أو التوجيه المطلوب"
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="اسم الموظف" value={form.assigneeName} onChange={(e) => setForm({ ...form, assigneeName: e.target.value })} required />
                <Input label="الإدارة" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
                <Input label="المدير" value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} required={requireManager} />
                <Select label="الأولوية" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {Object.entries(priorityLabels).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
                </Select>
                <Input label="الهدف المرتبط" value={form.linkedGoalTitle} onChange={(e) => setForm({ ...form, linkedGoalTitle: e.target.value })} />
                <Input type="date" label="تاريخ البداية" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                <Input type="date" label="تاريخ الاستحقاق" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
            </div>
            <div className="flex justify-end">
                <Button type="submit">{submitLabel}</Button>
            </div>
        </form>
    </ContentCard>
);

const TaskCard = ({
    task,
    progressValue,
    onProgressChange,
    onStart,
    onComplete,
    onProgress,
    extensionForm,
    onExtensionChange,
    onExtensionRequest,
    managerComment,
    onManagerComment,
    onApprove,
    onReject,
}) => {
    const status = TASK_STATUS[task.status] || TASK_STATUS.notStarted;
    const priority = priorityLabels[task.priority] || priorityLabels.medium;
    const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

    return (
        <ContentCard>
            <div className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="flex flex-wrap gap-2 mb-2">
                            <Badge color={status.color}>{status.label}</Badge>
                            <Badge color={priority.color}>{priority.label}</Badge>
                            <Badge color="secondary">{sourceLabels[task.sourceType] || task.sourceType}</Badge>
                            {overdue && <Badge color="danger">متأخرة</Badge>}
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{task.title}</h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{task.description || 'لا يوجد وصف'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm lg:min-w-80">
                        <Info label="الموظف" value={task.assigneeName || 'غير محدد'} />
                        <Info label="المدير" value={task.managerName || 'غير محدد'} />
                        <Info label="الإدارة" value={task.department || 'عام'} />
                        <Info label="الاستحقاق" value={task.dueDate || 'غير محدد'} danger={overdue} />
                    </div>
                </div>

                {task.linkedGoalTitle && (
                    <div className="rounded-lg epm-saudi-soft p-3 text-sm">
                        الهدف المرتبط: {task.linkedGoalTitle}
                    </div>
                )}

                <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-200">نسبة الإنجاز</span>
                        <span className="font-bold epm-saudi-number">{task.progress || 0}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div className="h-full rounded-full bg-green-700 transition-all" style={{ width: `${Math.min(task.progress || 0, 100)}%` }} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <div className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                        <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">تحديث التنفيذ</div>
                        <div className="flex gap-2">
                            <Input type="number" min="0" max="100" value={progressValue} onChange={(e) => onProgressChange(e.target.value)} />
                            <Button variant="outline" onClick={onProgress}>حفظ</Button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" variant="secondary" onClick={onStart}>بدء</Button>
                            <Button size="sm" variant="success" onClick={onComplete}>إنجاز</Button>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                        <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">طلب تمديد</div>
                        <Input type="date" value={extensionForm.requestedDueDate || ''} onChange={(e) => onExtensionChange({ requestedDueDate: e.target.value })} />
                        <textarea
                            className="mt-2 min-h-20 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                            value={extensionForm.reason || ''}
                            onChange={(e) => onExtensionChange({ reason: e.target.value })}
                            placeholder="سبب طلب التمديد"
                        />
                        <div className="mt-2 flex justify-end">
                            <Button size="sm" variant="warning" onClick={onExtensionRequest}>إرسال الطلب</Button>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                        <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">قرار المدير</div>
                        {task.extensionRequest ? (
                            <>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    المطلوب حتى: {task.extensionRequest.requestedDueDate}
                                </p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{task.extensionRequest.reason}</p>
                                <Input className="mt-2" value={managerComment} onChange={(e) => onManagerComment(e.target.value)} placeholder="تعليق المدير" />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <Button size="sm" variant="success" onClick={onApprove}>اعتماد</Button>
                                    <Button size="sm" variant="danger" onClick={onReject}>رفض</Button>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">لا يوجد طلب تمديد على هذه المهمة</p>
                        )}
                    </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">سجل المتابعة</div>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        {(task.history || []).slice(-4).map((item, index) => (
                            <div key={`${item.at}-${index}`}>{item.at}: {item.action}</div>
                        ))}
                    </div>
                </div>
            </div>
        </ContentCard>
    );
};

const Info = ({ label, value, danger = false }) => (
    <div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        <div className={`font-medium ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{value}</div>
    </div>
);
