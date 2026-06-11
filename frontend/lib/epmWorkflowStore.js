import { QUESTION_BANK } from './epmOfficialStandards';

const STORE_KEY = 'epm-workflow-v1';
const WORKFLOW_API = '/api/epm/workflow';

const today = () => new Date().toISOString().slice(0, 10);

const addDays = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
};

export const TASK_STATUS = {
    notStarted: { id: 'notStarted', label: 'لم يبدأ', color: 'secondary' },
    inProgress: { id: 'inProgress', label: 'قيد التنفيذ', color: 'info' },
    completed: { id: 'completed', label: 'منجز', color: 'success' },
    extensionRequested: { id: 'extensionRequested', label: 'طلب تمديد', color: 'warning' },
    extended: { id: 'extended', label: 'ممدد', color: 'warning' },
    blocked: { id: 'blocked', label: 'متعثر', color: 'danger' },
};

export const QUESTION_CONTEXTS = {
    goal: 'هدف',
    evaluation: 'تقييم',
    followup: 'متابعة',
    extension: 'تمديد',
    directive: 'توجيه مدير',
};

export const defaultWorkflowData = {
    questions: QUESTION_BANK,
    questionnaires: [
        {
            id: 'qn-demo-1',
            title: 'استجابة الموظف لهدف تحسين زمن الإنجاز',
            department: 'عام',
            context: 'goal',
            employeeName: 'أحمد محمد',
            managerName: 'مدير الإدارة',
            linkedGoalTitle: 'خفض متوسط زمن إنجاز المعاملات',
            status: 'sent',
            sentAt: today(),
            dueDate: addDays(5),
            questions: QUESTION_BANK.filter((q) => ['goal_measurement_001', 'goal_measurement_002', 'goal_risk_001'].includes(q.id))
                .map((q) => ({ ...q, answer: '' })),
        },
    ],
    tasks: [
        {
            id: 'task-demo-1',
            title: 'تحليل أسباب تأخر المعاملات',
            description: 'مهمة مسندة من المدير لدعم هدف تحسين زمن الإنجاز.',
            department: 'عام',
            assigneeName: 'أحمد محمد',
            managerName: 'مدير الإدارة',
            sourceType: 'managerDirective',
            linkedGoalTitle: 'خفض متوسط زمن إنجاز المعاملات',
            startDate: today(),
            dueDate: addDays(7),
            status: 'inProgress',
            progress: 45,
            priority: 'high',
            createdBy: 'manager',
            history: [
                { at: today(), action: 'تم إنشاء المهمة من المدير' },
            ],
        },
        {
            id: 'task-demo-2',
            title: 'تجهيز ملف أدلة الإنجاز',
            description: 'مهمة ذاتية أضافها الموظف لإثبات تحقق الهدف.',
            department: 'عام',
            assigneeName: 'أحمد محمد',
            managerName: 'مدير الإدارة',
            sourceType: 'self',
            linkedGoalTitle: 'خفض متوسط زمن إنجاز المعاملات',
            startDate: today(),
            dueDate: addDays(10),
            status: 'notStarted',
            progress: 0,
            priority: 'medium',
            createdBy: 'employee',
            history: [
                { at: today(), action: 'أضاف الموظف المهمة الذاتية' },
            ],
        },
    ],
};

const canUseStorage = () => typeof window !== 'undefined' && window.localStorage;

const canUseFetch = () => typeof window !== 'undefined' && typeof window.fetch === 'function';

const writeLocalStore = (data, notify = true) => {
    if (!canUseStorage()) return data;
    window.localStorage.setItem(STORE_KEY, JSON.stringify(data));
    if (notify) window.dispatchEvent(new Event('epm-workflow-updated'));
    return data;
};

const apiRequest = async (path = '', options = {}) => {
    if (!canUseFetch()) return null;
    const response = await fetch(`${WORKFLOW_API}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        credentials: 'same-origin',
        ...options,
    });
    if (!response.ok) {
        throw new Error(`EPM workflow API failed: ${response.status}`);
    }
    return response.json();
};

const normalizeWorkflowStore = (store) => ({
    questions: store?.questions?.length ? store.questions : QUESTION_BANK,
    questionnaires: store?.questionnaires || [],
    tasks: store?.tasks || [],
});

export const readWorkflowStore = () => {
    if (!canUseStorage()) return defaultWorkflowData;

    try {
        const raw = window.localStorage.getItem(STORE_KEY);
        if (!raw) {
            window.localStorage.setItem(STORE_KEY, JSON.stringify(defaultWorkflowData));
            return defaultWorkflowData;
        }
        const parsed = JSON.parse(raw);
        return normalizeWorkflowStore(parsed);
    } catch {
        return defaultWorkflowData;
    }
};

export const writeWorkflowStore = (data) => {
    return writeLocalStore(normalizeWorkflowStore(data));
};

export const loadWorkflowStore = async () => {
    try {
        const remoteStore = normalizeWorkflowStore(await apiRequest());
        return writeLocalStore(remoteStore);
    } catch {
        return readWorkflowStore();
    }
};

const mirrorToApi = (operation) => {
    if (!canUseFetch()) return;
    operation()
        .then(async () => {
            try {
                const remoteStore = normalizeWorkflowStore(await apiRequest());
                writeLocalStore(remoteStore);
            } catch {
                // Keep local fallback when the remote refresh fails.
            }
        })
        .catch(() => {
            // Local fallback remains the source for the current browser session.
        });
};

export const addQuestion = (question) => {
    const store = readWorkflowStore();
    const next = {
        ...store,
        questions: [
            {
                id: `q-${Date.now()}`,
                required: false,
                audience: 'employee',
                context: 'goal',
                type: 'custom',
                ...question,
            },
            ...store.questions,
        ],
    };
    writeWorkflowStore(next);
    mirrorToApi(() => apiRequest('/questions', { method: 'POST', body: JSON.stringify(question) }));
    return next;
};

export const sendQuestionnaire = (payload) => {
    const store = readWorkflowStore();
    const selectedQuestions = store.questions
        .filter((question) => payload.questionIds.includes(question.id))
        .map((question) => ({ ...question, answer: '', convertedToTask: false }));

    const questionnaire = {
        id: `qn-${Date.now()}`,
        status: 'sent',
        sentAt: today(),
        dueDate: payload.dueDate || addDays(5),
        questions: selectedQuestions,
        ...payload,
    };

    const next = {
        ...store,
        questionnaires: [questionnaire, ...store.questionnaires],
    };
    writeWorkflowStore(next);
    mirrorToApi(() => apiRequest('/questionnaires', { method: 'POST', body: JSON.stringify(payload) }));
    return questionnaire;
};

export const answerQuestionnaire = (questionnaireId, answers) => {
    const store = readWorkflowStore();
    const next = {
        ...store,
        questionnaires: store.questionnaires.map((questionnaire) => {
            if (questionnaire.id !== questionnaireId) return questionnaire;
            return {
                ...questionnaire,
                status: 'answered',
                answeredAt: today(),
                questions: questionnaire.questions.map((question) => ({
                    ...question,
                    answer: answers[question.id] ?? question.answer ?? '',
                })),
            };
        }),
    };
    writeWorkflowStore(next);
    if (/^\d+$/.test(String(questionnaireId))) {
        mirrorToApi(() => apiRequest(`/questionnaires/${questionnaireId}/answers`, {
            method: 'PUT',
            body: JSON.stringify({ answers }),
        }));
    }
    return next;
};

export const createTask = (task) => {
    const store = readWorkflowStore();
    const newTask = {
        id: `task-${Date.now()}`,
        status: 'notStarted',
        progress: 0,
        priority: 'medium',
        startDate: today(),
        dueDate: addDays(7),
        history: [{ at: today(), action: 'تم إنشاء المهمة' }],
        ...task,
    };
    const next = { ...store, tasks: [newTask, ...store.tasks] };
    writeWorkflowStore(next);
    mirrorToApi(() => apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify({
            ...task,
            historyAction: task.history?.[0]?.action,
        }),
    }));
    return newTask;
};

export const updateTask = (taskId, patch, actionLabel) => {
    const store = readWorkflowStore();
    const next = {
        ...store,
        tasks: store.tasks.map((task) => {
            if (task.id !== taskId) return task;
            return {
                ...task,
                ...patch,
                history: [
                    ...(task.history || []),
                    ...(actionLabel ? [{ at: today(), action: actionLabel }] : []),
                ],
            };
        }),
    };
    writeWorkflowStore(next);
    if (/^\d+$/.test(String(taskId))) {
        mirrorToApi(() => apiRequest(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ ...patch, actionLabel }),
        }));
    }
    return next;
};

export const requestTaskExtension = (taskId, { reason, requestedDueDate }) => {
    const next = updateTask(
        taskId,
        {
            status: 'extensionRequested',
            extensionRequest: {
                reason,
                requestedDueDate,
                requestedAt: today(),
                status: 'pending',
            },
        },
        `طلب الموظف تمديد المهمة إلى ${requestedDueDate}`
    );
    if (/^\d+$/.test(String(taskId))) {
        mirrorToApi(() => apiRequest(`/tasks/${taskId}/extension-request`, {
            method: 'POST',
            body: JSON.stringify({ reason, requestedDueDate }),
        }));
    }
    return next;
};

export const decideTaskExtension = (taskId, approved, managerComment = '') => {
    const store = readWorkflowStore();
    const task = store.tasks.find((item) => item.id === taskId);
    const requestedDueDate = task?.extensionRequest?.requestedDueDate;

    const next = updateTask(
        taskId,
        {
            status: approved ? 'extended' : 'inProgress',
            dueDate: approved && requestedDueDate ? requestedDueDate : task?.dueDate,
            extensionRequest: {
                ...(task?.extensionRequest || {}),
                status: approved ? 'approved' : 'rejected',
                decidedAt: today(),
                managerComment,
            },
        },
        approved ? 'اعتمد المدير طلب التمديد' : 'رفض المدير طلب التمديد'
    );
    if (/^\d+$/.test(String(taskId))) {
        mirrorToApi(() => apiRequest(`/tasks/${taskId}/extension-decision`, {
            method: 'POST',
            body: JSON.stringify({ approved, managerComment }),
        }));
    }
    return next;
};

export const getWorkflowStats = (store = readWorkflowStore()) => {
    const tasks = store.tasks || [];
    const questionnaires = store.questionnaires || [];
    return {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((task) => task.status === 'completed').length,
        delayedTasks: tasks.filter((task) => new Date(task.dueDate) < new Date() && task.status !== 'completed').length,
        extensionRequests: tasks.filter((task) => task.status === 'extensionRequested').length,
        pendingQuestionnaires: questionnaires.filter((item) => item.status === 'sent').length,
        answeredQuestionnaires: questionnaires.filter((item) => item.status === 'answered').length,
    };
};
