import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { Badge, Button, ContentCard, Input, Select, Tabs } from '../../components/ui';
import {
    QUESTION_CONTEXTS,
    addQuestion,
    answerQuestionnaire,
    createTask,
    loadWorkflowStore,
    readWorkflowStore,
    sendQuestionnaire,
} from '../../lib/epmWorkflowStore';

const audienceLabels = {
    employee: 'الموظف',
    manager: 'المدير',
    hr: 'الموارد البشرية',
};

export default function EPMQuestionBankPage() {
    const [store, setStore] = useState(() => readWorkflowStore());
    const [activeTab, setActiveTab] = useState('bank');
    const [filters, setFilters] = useState({ department: 'all', context: 'all', audience: 'all' });
    const [newQuestion, setNewQuestion] = useState({
        department: 'عام',
        context: 'goal',
        audience: 'employee',
        type: 'custom',
        text: '',
        suggestedTaskTitle: '',
        required: false,
    });
    const [sendForm, setSendForm] = useState({
        title: '',
        department: 'عام',
        context: 'goal',
        employeeName: '',
        managerName: 'مدير الإدارة',
        linkedGoalTitle: '',
        dueDate: '',
        questionIds: [],
    });
    const [answers, setAnswers] = useState({});

    const reload = () => setStore(readWorkflowStore());

    useEffect(() => {
        loadWorkflowStore().then(setStore);
        const onUpdate = () => reload();
        window.addEventListener('epm-workflow-updated', onUpdate);
        return () => window.removeEventListener('epm-workflow-updated', onUpdate);
    }, []);

    const departments = useMemo(() => {
        return ['all', ...new Set(store.questions.map((question) => question.department || 'عام'))];
    }, [store.questions]);

    const filteredQuestions = useMemo(() => {
        return store.questions.filter((question) => {
            const departmentMatch = filters.department === 'all' || question.department === filters.department;
            const contextMatch = filters.context === 'all' || question.context === filters.context;
            const audienceMatch = filters.audience === 'all' || question.audience === filters.audience;
            return departmentMatch && contextMatch && audienceMatch;
        });
    }, [filters, store.questions]);

    const tabs = [
        { id: 'bank', label: 'بنك الأسئلة', count: filteredQuestions.length },
        { id: 'send', label: 'إرسال للموظف' },
        { id: 'inbox', label: 'صندوق الموظف', count: store.questionnaires.filter((item) => item.status === 'sent').length },
        { id: 'responses', label: 'الردود', count: store.questionnaires.filter((item) => item.status === 'answered').length },
    ];

    const toggleQuestion = (questionId) => {
        setSendForm((prev) => ({
            ...prev,
            questionIds: prev.questionIds.includes(questionId)
                ? prev.questionIds.filter((id) => id !== questionId)
                : [...prev.questionIds, questionId],
        }));
    };

    const handleAddQuestion = (event) => {
        event.preventDefault();
        if (!newQuestion.text.trim()) return;
        addQuestion(newQuestion);
        setNewQuestion((prev) => ({ ...prev, text: '', suggestedTaskTitle: '' }));
        reload();
    };

    const handleSend = (event) => {
        event.preventDefault();
        if (!sendForm.employeeName || sendForm.questionIds.length === 0) return;
        sendQuestionnaire({
            ...sendForm,
            title: sendForm.title || `أسئلة ${QUESTION_CONTEXTS[sendForm.context]} - ${sendForm.employeeName}`,
        });
        setSendForm((prev) => ({ ...prev, title: '', linkedGoalTitle: '', employeeName: '', questionIds: [] }));
        setActiveTab('inbox');
        reload();
    };

    const handleAnswer = (questionnaire) => {
        answerQuestionnaire(questionnaire.id, answers[questionnaire.id] || {});
        setAnswers((prev) => ({ ...prev, [questionnaire.id]: {} }));
        reload();
    };

    const createTaskFromAnswer = (questionnaire, question) => {
        const answer = answers?.[questionnaire.id]?.[question.id] || question.answer;
        createTask({
            title: question.suggestedTaskTitle || `متابعة: ${question.text.slice(0, 40)}`,
            description: answer || question.text,
            department: questionnaire.department,
            assigneeName: questionnaire.employeeName,
            managerName: questionnaire.managerName,
            sourceType: 'questionnaire',
            linkedGoalTitle: questionnaire.linkedGoalTitle,
            priority: question.required ? 'high' : 'medium',
            createdBy: 'employee',
        });
        reload();
    };

    return (
        <AppLayout title="بنك أسئلة الأداء" subtitle="إرسال أسئلة الأهداف والتقييمات للموظف ومتابعة إجاباته">
            <div className="space-y-6">
                <ContentCard>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <Select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
                            {departments.map((department) => (
                                <option key={department} value={department}>{department === 'all' ? 'كل الإدارات' : department}</option>
                            ))}
                        </Select>
                        <Select value={filters.context} onChange={(e) => setFilters({ ...filters, context: e.target.value })}>
                            <option value="all">كل السياقات</option>
                            {Object.entries(QUESTION_CONTEXTS).map(([id, label]) => (
                                <option key={id} value={id}>{label}</option>
                            ))}
                        </Select>
                        <Select value={filters.audience} onChange={(e) => setFilters({ ...filters, audience: e.target.value })}>
                            <option value="all">كل المستفيدين</option>
                            {Object.entries(audienceLabels).map(([id, label]) => (
                                <option key={id} value={id}>{label}</option>
                            ))}
                        </Select>
                        <Button variant="outline" onClick={() => setFilters({ department: 'all', context: 'all', audience: 'all' })}>
                            تصفية الكل
                        </Button>
                    </div>
                </ContentCard>

                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                {activeTab === 'bank' && (
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                        <ContentCard className="xl:col-span-2">
                            <div className="grid grid-cols-1 gap-4">
                                {filteredQuestions.map((question) => (
                                    <QuestionCard key={question.id} question={question} selectable={false} />
                                ))}
                            </div>
                        </ContentCard>
                        <ContentCard title="إضافة سؤال جديد">
                            <form onSubmit={handleAddQuestion} className="space-y-4">
                                <Input label="نص السؤال" value={newQuestion.text} onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })} required />
                                <Input label="عنوان المهمة المقترحة عند تحويل الإجابة لمهمة" value={newQuestion.suggestedTaskTitle} onChange={(e) => setNewQuestion({ ...newQuestion, suggestedTaskTitle: e.target.value })} />
                                <div className="grid grid-cols-1 gap-3">
                                    <Input label="الإدارة" value={newQuestion.department} onChange={(e) => setNewQuestion({ ...newQuestion, department: e.target.value })} />
                                    <Select label="السياق" value={newQuestion.context} onChange={(e) => setNewQuestion({ ...newQuestion, context: e.target.value })}>
                                        {Object.entries(QUESTION_CONTEXTS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                                    </Select>
                                    <Select label="المستفيد" value={newQuestion.audience} onChange={(e) => setNewQuestion({ ...newQuestion, audience: e.target.value })}>
                                        {Object.entries(audienceLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                                    </Select>
                                </div>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={newQuestion.required} onChange={(e) => setNewQuestion({ ...newQuestion, required: e.target.checked })} />
                                    سؤال إلزامي
                                </label>
                                <Button type="submit">إضافة للبنك</Button>
                            </form>
                        </ContentCard>
                    </div>
                )}

                {activeTab === 'send' && (
                    <form onSubmit={handleSend} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                        <ContentCard title="بيانات الإرسال">
                            <div className="space-y-4">
                                <Input label="عنوان النموذج" value={sendForm.title} onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })} placeholder="مثال: أسئلة هدف الربع الأول" />
                                <Input label="اسم الموظف" value={sendForm.employeeName} onChange={(e) => setSendForm({ ...sendForm, employeeName: e.target.value })} required />
                                <Input label="اسم المدير" value={sendForm.managerName} onChange={(e) => setSendForm({ ...sendForm, managerName: e.target.value })} required />
                                <Input label="الهدف أو التقييم المرتبط" value={sendForm.linkedGoalTitle} onChange={(e) => setSendForm({ ...sendForm, linkedGoalTitle: e.target.value })} />
                                <Input label="الإدارة" value={sendForm.department} onChange={(e) => setSendForm({ ...sendForm, department: e.target.value })} />
                                <Select label="السياق" value={sendForm.context} onChange={(e) => setSendForm({ ...sendForm, context: e.target.value })}>
                                    {Object.entries(QUESTION_CONTEXTS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                                </Select>
                                <Input type="date" label="آخر موعد للرد" value={sendForm.dueDate} onChange={(e) => setSendForm({ ...sendForm, dueDate: e.target.value })} />
                                <Button type="submit" disabled={sendForm.questionIds.length === 0}>إرسال للموظف</Button>
                            </div>
                        </ContentCard>
                        <ContentCard title="اختيار الأسئلة" className="xl:col-span-2">
                            <div className="grid grid-cols-1 gap-3">
                                {filteredQuestions.map((question) => (
                                    <QuestionCard
                                        key={question.id}
                                        question={question}
                                        selectable
                                        selected={sendForm.questionIds.includes(question.id)}
                                        onToggle={() => toggleQuestion(question.id)}
                                    />
                                ))}
                            </div>
                        </ContentCard>
                    </form>
                )}

                {activeTab === 'inbox' && (
                    <QuestionnaireList
                        items={store.questionnaires.filter((item) => item.status === 'sent')}
                        answers={answers}
                        setAnswers={setAnswers}
                        onAnswer={handleAnswer}
                        onTask={createTaskFromAnswer}
                    />
                )}

                {activeTab === 'responses' && (
                    <QuestionnaireList
                        items={store.questionnaires.filter((item) => item.status === 'answered')}
                        answers={answers}
                        setAnswers={setAnswers}
                        onAnswer={handleAnswer}
                        onTask={createTaskFromAnswer}
                        readonly
                    />
                )}
            </div>
        </AppLayout>
    );
}

const QuestionCard = ({ question, selectable, selected, onToggle }) => (
    <div className={`rounded-xl border p-4 transition ${selected ? 'border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'}`}>
        <div className="flex items-start gap-3">
            {selectable && (
                <input type="checkbox" checked={selected} onChange={onToggle} className="mt-1" />
            )}
            <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                    <Badge color="secondary">{question.department}</Badge>
                    <Badge color="info">{QUESTION_CONTEXTS[question.context] || question.context}</Badge>
                    <Badge color={question.required ? 'warning' : 'secondary'}>{question.required ? 'إلزامي' : 'اختياري'}</Badge>
                    <Badge color="secondary">{audienceLabels[question.audience] || question.audience}</Badge>
                </div>
                <p className="font-medium text-gray-900 dark:text-white">{question.text}</p>
                {question.suggestedTaskTitle && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">المهمة المقترحة: {question.suggestedTaskTitle}</p>
                )}
            </div>
        </div>
    </div>
);

const QuestionnaireList = ({ items, answers, setAnswers, onAnswer, onTask, readonly = false }) => {
    if (items.length === 0) {
        return (
            <ContentCard>
                <div className="py-10 text-center text-gray-500 dark:text-gray-400">لا توجد نماذج في هذا القسم</div>
            </ContentCard>
        );
    }

    return (
        <div className="space-y-5">
            {items.map((questionnaire) => (
                <ContentCard key={questionnaire.id}>
                    <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{questionnaire.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                الموظف: {questionnaire.employeeName} | المدير: {questionnaire.managerName} | الهدف: {questionnaire.linkedGoalTitle || 'غير محدد'}
                            </p>
                        </div>
                        <Badge color={questionnaire.status === 'answered' ? 'success' : 'warning'}>
                            {questionnaire.status === 'answered' ? 'تم الرد' : 'بانتظار رد الموظف'}
                        </Badge>
                    </div>
                    <div className="space-y-4">
                        {questionnaire.questions.map((question) => (
                            <div key={question.id} className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
                                <div className="font-medium text-gray-900 dark:text-white">{question.text}</div>
                                <textarea
                                    className="mt-3 min-h-24 w-full rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                                    value={(answers?.[questionnaire.id]?.[question.id] ?? question.answer ?? '')}
                                    onChange={(e) => setAnswers((prev) => ({
                                        ...prev,
                                        [questionnaire.id]: {
                                            ...(prev[questionnaire.id] || {}),
                                            [question.id]: e.target.value,
                                        },
                                    }))}
                                    disabled={readonly}
                                    placeholder="إجابة الموظف..."
                                />
                                <div className="mt-3 flex justify-end">
                                    <Button type="button" size="sm" variant="outline" onClick={() => onTask(questionnaire, question)}>
                                        تحويل الإجابة إلى مهمة
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {!readonly && (
                        <div className="mt-4 flex justify-end">
                            <Button onClick={() => onAnswer(questionnaire)}>إرسال إجابات الموظف</Button>
                        </div>
                    )}
                </ContentCard>
            ))}
        </div>
    );
};
