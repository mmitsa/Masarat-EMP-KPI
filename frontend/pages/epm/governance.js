import React, { useMemo, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import {
    CHARTER_QUESTIONS,
    EVIDENCE_SOURCES,
    IMPACT_RULES,
    JOB_CATEGORIES,
    OFFICIAL_REFERENCES,
    PERFORMANCE_CYCLE_STAGES,
    RESPONSIBILITY_MATRIX,
    getImprovementRecommendations,
    getPerformanceDecision,
    getTemplate,
} from '../../lib/epmOfficialStandards';

const SectionTitle = ({ title, subtitle }) => (
    <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
);

const Card = ({ children, className = '' }) => (
    <div className={`epm-saudi-card rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}>
        {children}
    </div>
);

const Pill = ({ children, tone = 'blue' }) => {
    const tones = {
        blue: 'epm-saudi-soft',
        green: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
        red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200',
        gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
    };

    return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
};

export default function EPMGovernancePage() {
    const [decisionInput, setDecisionInput] = useState({
        finalScore: 3.2,
        jobCategory: 'nonSupervisory',
        rankLevel: 10,
        yearsInRank: 4,
        previousUnsatisfactoryCount: 0,
        absenceDeductionDays: 0,
        hasDisciplinaryAction: false,
        responsibility: 3,
        cooperation: 3,
        communication: 3,
        results: 3,
        development: 3,
        engagement: 3,
        leadership: 3,
    });

    const decision = useMemo(() => getPerformanceDecision(decisionInput), [decisionInput]);
    const recommendations = useMemo(
        () => getImprovementRecommendations(decisionInput, decisionInput.jobCategory),
        [decisionInput]
    );
    const template = getTemplate(decisionInput.jobCategory);

    const updateInput = (field, value) => {
        setDecisionInput((prev) => ({
            ...prev,
            [field]: field === 'hasDisciplinaryAction'
                ? value
                : ['jobCategory'].includes(field)
                    ? value
                    : Number(value),
        }));
    };

    return (
        <AppLayout
            title="الحوكمة والقرارات"
            subtitle="تطبيق متطلبات إدارة الأداء الوظيفي السعودية داخل النظام"
        >
            <div className="space-y-8">
                <Card className="bg-gradient-to-l from-green-50 to-white dark:from-green-950/30 dark:to-gray-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                دورة الأداء من الميثاق إلى القرار
                            </h1>
                            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600 dark:text-gray-300">
                                تم تحويل المتطلبات الرسمية إلى مراحل تشغيلية، أسئلة تحقق، مسؤوليات، مصادر أدلة، ومؤشرات أثر على الترقية والتطوير والعلاوة كمؤشرات أولية لا تغني عن اعتماد الموارد البشرية وصاحب الصلاحية.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                            <div>
                                <div className="text-2xl font-bold epm-saudi-number">4+</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">أهداف كحد أدنى</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold epm-saudi-number">100%</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">أوزان الأهداف</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold epm-saudi-number">5</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">مستويات تقييم</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold epm-saudi-number">HR</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">حفظ واعتماد</div>
                            </div>
                        </div>
                    </div>
                </Card>

                <section className="space-y-4">
                    <SectionTitle
                        title="مراحل دورة الأداء"
                        subtitle="كل مرحلة لها مالك ومخرج وضوابط رقابية داخل النظام."
                    />
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                        {PERFORMANCE_CYCLE_STAGES.map((stage, index) => (
                            <Card key={stage.id}>
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <Pill>{`مرحلة ${index + 1}`}</Pill>
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{stage.title}</h3>
                                <p className="mt-2 text-xs font-semibold text-green-700 dark:text-green-300">{stage.owner}</p>
                                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{stage.output}</p>
                                <ul className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                    {stage.controls.map((control) => (
                                        <li key={control} className="flex gap-2">
                                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-green-700" />
                                            <span>{control}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        ))}
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <Card>
                        <SectionTitle title="أسئلة الموظف" subtitle="تظهر عند إعداد الميثاق والمراجعة." />
                        <QuestionList items={CHARTER_QUESTIONS.employee} />
                    </Card>
                    <Card>
                        <SectionTitle title="أسئلة المدير" subtitle="تظهر عند الاعتماد والتقييم النهائي." />
                        <QuestionList items={CHARTER_QUESTIONS.manager} />
                    </Card>
                    <Card>
                        <SectionTitle title="أسئلة الموارد البشرية" subtitle="تظهر عند المراجعة والتصنيف." />
                        <QuestionList items={CHARTER_QUESTIONS.hr} />
                    </Card>
                </section>

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <Card>
                        <SectionTitle title="مصفوفة المسؤوليات" subtitle="من المسؤول عن كل جزء في دورة الأداء." />
                        <div className="mt-4 space-y-4">
                            {RESPONSIBILITY_MATRIX.map((item) => (
                                <div key={item.role} className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
                                    <div className="mb-2 font-bold text-gray-900 dark:text-white">{item.role}</div>
                                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                        {item.responsibilities.map((responsibility) => (
                                            <li key={responsibility} className="flex gap-2">
                                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-green-500" />
                                                <span>{responsibility}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <SectionTitle title="مصادر الأدلة" subtitle="لا يعتمد التقييم النهائي على الرأي فقط." />
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {EVIDENCE_SOURCES.map((source) => (
                                <div key={source} className="rounded-lg bg-gray-50 p-3 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                    {source}
                                </div>
                            ))}
                        </div>

                        <div className="mt-6">
                            <SectionTitle title="أثر النتائج على القرارات" subtitle="قواعد تظهر كتوصيات ومؤشرات وليست قرارات آلية نهائية." />
                            <div className="mt-4 space-y-3">
                                {IMPACT_RULES.map((rule) => (
                                    <div key={rule.id} className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
                                        <div className="font-bold text-gray-900 dark:text-white">{rule.title}</div>
                                        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{rule.summary}</p>
                                        <p className="mt-2 text-sm font-semibold text-green-700 dark:text-green-300">{rule.systemAction}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </section>

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <Card className="xl:col-span-1">
                        <SectionTitle title="محاكي قرار الأداء" subtitle="أدخل نتيجة الموظف لعرض الأثر والتوصيات." />
                        <div className="mt-4 space-y-4">
                            <Field label="النتيجة النهائية من 5">
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    step="0.1"
                                    value={decisionInput.finalScore}
                                    onChange={(e) => updateInput('finalScore', e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                                />
                            </Field>
                            <Field label="نوع الوظيفة">
                                <select
                                    value={decisionInput.jobCategory}
                                    onChange={(e) => updateInput('jobCategory', e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                                >
                                    {Object.values(JOB_CATEGORIES).map((category) => (
                                        <option key={category.id} value={category.id}>{category.label}</option>
                                    ))}
                                </select>
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="المرتبة">
                                    <input type="number" value={decisionInput.rankLevel} onChange={(e) => updateInput('rankLevel', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" />
                                </Field>
                                <Field label="سنوات المرتبة">
                                    <input type="number" value={decisionInput.yearsInRank} onChange={(e) => updateInput('yearsInRank', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" />
                                </Field>
                                <Field label="خصم الغياب">
                                    <input type="number" value={decisionInput.absenceDeductionDays} onChange={(e) => updateInput('absenceDeductionDays', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" />
                                </Field>
                                <Field label="تكرار غير مرضي">
                                    <input type="number" value={decisionInput.previousUnsatisfactoryCount} onChange={(e) => updateInput('previousUnsatisfactoryCount', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" />
                                </Field>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                <input
                                    type="checkbox"
                                    checked={decisionInput.hasDisciplinaryAction}
                                    onChange={(e) => updateInput('hasDisciplinaryAction', e.target.checked)}
                                />
                                يوجد إجراء تأديبي مؤثر
                            </label>
                        </div>
                    </Card>

                    <Card className="xl:col-span-2">
                        <SectionTitle title="نتيجة القرار والتوصيات" subtitle="النظام يعرض توصية تشغيلية قابلة للمراجعة من الموارد البشرية." />
                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-lg epm-saudi-soft p-4">
                                <div className="text-xs text-green-800 dark:text-green-200">التقدير</div>
                                <div className="mt-2 text-2xl font-bold text-green-950 dark:text-green-100">{decision.rating.label}</div>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                                <div className="text-xs text-gray-500 dark:text-gray-400">خطة تطوير</div>
                                <div className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                                    {decision.needsDevelopmentPlan ? 'مطلوبة' : 'غير مطلوبة'}
                                </div>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                                <div className="text-xs text-gray-500 dark:text-gray-400">إشعار كتابي</div>
                                <div className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                                    {decision.requiresWrittenNotice ? 'مطلوب' : 'غير مطلوب'}
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            <DecisionBlock title="الترقية والمفاضلة" text={decision.promotionReadiness} />
                            <DecisionBlock title="العلاوة أو الأثر المالي" text={decision.allowanceIndicator} />
                        </div>

                        <div className="mt-6">
                            <h3 className="font-bold text-gray-900 dark:text-white">الإجراءات المقترحة</h3>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {decision.actions.map((action) => (
                                    <Pill key={action} tone={action.includes('إنذار') || action.includes('كتابة') ? 'red' : action.includes('ترشيح') ? 'green' : 'amber'}>
                                        {action}
                                    </Pill>
                                ))}
                                {decision.actions.length === 0 && <Pill tone="gray">لا توجد إجراءات إضافية</Pill>}
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="font-bold text-gray-900 dark:text-white">توصيات تحسين الأداء حسب الجدارات</h3>
                            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                                {template.competencies.map((competency) => (
                                    <Field key={competency.id} label={`${competency.name} (${competency.weight}%)`}>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            step="1"
                                            value={decisionInput[competency.id] || 3}
                                            onChange={(e) => updateInput(competency.id, e.target.value)}
                                            className="w-full"
                                        />
                                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            الدرجة الحالية: {decisionInput[competency.id] || 3}/5
                                        </div>
                                    </Field>
                                ))}
                            </div>
                            <div className="mt-4 space-y-2">
                                {recommendations.map((item) => (
                                    <div key={item.competencyId} className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
                                        <span className="font-bold">{item.competencyName}: </span>
                                        {item.recommendation}
                                    </div>
                                ))}
                                {recommendations.length === 0 && (
                                    <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-100">
                                        لا توجد فجوات جدارات أقل من جيد جدا.
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </section>

                <section className="space-y-4">
                    <SectionTitle title="المراجع الرسمية المطبقة" subtitle="تظهر هنا لأغراض الحوكمة والمراجعة الداخلية." />
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {OFFICIAL_REFERENCES.map((reference) => (
                            <Card key={reference.id}>
                                <div className="font-bold text-gray-900 dark:text-white">{reference.title}</div>
                                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{reference.source}</div>
                                <div className="mt-3 text-sm text-green-700 dark:text-green-300">{reference.appliedTo}</div>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}

const QuestionList = ({ items }) => (
    <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
        {items.map((item) => (
            <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-green-700" />
                <span>{item}</span>
            </li>
        ))}
    </ul>
);

const Field = ({ label, children }) => (
    <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
        {children}
    </label>
);

const DecisionBlock = ({ title, text }) => (
    <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
        <div className="text-sm font-bold text-gray-900 dark:text-white">{title}</div>
        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{text}</p>
    </div>
);
