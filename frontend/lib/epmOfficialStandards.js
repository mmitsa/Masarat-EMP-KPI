export const JOB_CATEGORIES = {
    nonSupervisory: {
        id: 'nonSupervisory',
        label: 'وظيفة غير إشرافية',
        charterTitle: 'ميثاق الأداء للموظف على الوظيفة غير الإشرافية',
        evaluationTitle: 'نموذج تقييم الأداء الوظيفي - الوظيفة غير الإشرافية',
    },
    supervisory: {
        id: 'supervisory',
        label: 'وظيفة إشرافية',
        charterTitle: 'ميثاق الأداء للموظف على الوظيفة الإشرافية',
        evaluationTitle: 'نموذج تقييم الأداء الوظيفي - الوظيفة الإشرافية',
    },
};

export const RATING_SCALE = [
    {
        score: 5,
        label: 'ممتاز',
        description: 'حقق كل أهدافه وتخطى المستهدفات المحددة بالمستوى المطلوب، وأظهر الجدارات في مستويات أعلى من المطلوبة للوظيفة.',
    },
    {
        score: 4,
        label: 'جيد جداً',
        description: 'حقق كل أهدافه بالمستوى المطلوب، وأظهر الجدارات في مستويات تتوافق بدرجة كبيرة مع المستويات المطلوبة للوظيفة.',
    },
    {
        score: 3,
        label: 'جيد',
        description: 'حقق معظم أهدافه بالمستوى المطلوب، وأظهر الجدارات في مستويات قريبة من المستويات المطلوبة للوظيفة.',
    },
    {
        score: 2,
        label: 'مرضي',
        description: 'الأداء أقل من التوقعات، وحقق بعض أهدافه بالمستوى المطلوب، والجدارات المطلوبة لا تتسم بالثبات الكافي.',
    },
    {
        score: 1,
        label: 'غير مرضي',
        description: 'الأداء أقل من التوقعات بشكل دائم، ولم يحقق معظم أهدافه ولم يصل في أي منها إلى المستوى المطلوب.',
    },
];

const commonCompetencies = {
    responsibility: {
        id: 'responsibility',
        name: 'حس المسؤولية',
        weight: 10,
        behaviors: [
            'يتحمل مسؤولية أعماله وقراراته، ولا يلقي اللوم على الآخرين.',
            'يفهم دوره وكيفية ارتباطه بالأهداف العامة لجهة عمله.',
            'يفصح عما يواجهه من تحديات بشفافية.',
        ],
    },
    cooperation: {
        id: 'cooperation',
        name: 'التعاون',
        weight: 5,
        behaviors: [
            'يشارك المعلومات بانفتاح وفق متطلبات العمل.',
            'يسعى إلى الاستفادة من آراء الآخرين وتهيئتهم لدعم الأعمال من خلال بناء علاقات داعمة.',
            'يستجيب لطلبات الدعم والمساندة من الوحدات التنظيمية في جهة عمله.',
        ],
    },
    communication: {
        id: 'communication',
        name: 'التواصل',
        weight: 15,
        behaviors: [
            'يستخدم التواصل المكتوب الواضح والفعال.',
            'يستخدم التواصل الشفهي الواضح والفعال.',
            'ينصت للآخرين بعناية.',
        ],
    },
    results: {
        id: 'results',
        name: 'تحقيق النتائج',
        weight: 20,
        behaviors: [
            'يستطيع القيام بمهام متعددة وتحديد أولوياتها حسب أهميتها النسبية.',
            'يمكن الاعتماد عليه، وينفذ مهامه في وقتها بمستوى عال من الجودة.',
            'مبادر وقادر على تقديم بدائل وحلول عند تنفيذ مهامه.',
        ],
    },
    development: {
        id: 'development',
        name: 'تطوير الموظفين',
        weight: 10,
        behaviors: [
            'يسعى إلى التعلم وتطوير نفسه باستمرار.',
            'يقدم آراء مساعدة للآخرين ويشارك النصح والاقتراحات.',
        ],
    },
    engagement: {
        id: 'engagement',
        name: 'الارتباط الوظيفي',
        weight: 40,
        behaviors: [
            'لديه الاستعداد لمواجهة تحديات العمل.',
            'يتطلع إلى مستوى أعلى من الإنجاز والابتكار عند تنفيذ العمل.',
            'يلتزم بمواعيد العمل ويكون متواجداً عند الحاجة إليه.',
            'يركز على خدمة العملاء عند تنفيذ أعماله.',
        ],
    },
    leadership: {
        id: 'leadership',
        name: 'القيادة',
        weight: 40,
        behaviors: [
            'مرن وقادر على تنفيذ أعمال هامة في ظروف تنطوي على قدر كبير من المخاطرة وعدم اليقين.',
            'يدعم ويشجع فريقه على تحقيق أهدافه حتى في الظروف الصعبة.',
            'يفكر بمنطقية وإبداع دون التأثر بتحيزاته الشخصية.',
            'يفوض الصلاحيات ويتابع النتائج.',
            'يوفر ويدعم فرص تطوير المرؤوسين.',
        ],
    },
};

export const PERFORMANCE_TEMPLATES = {
    nonSupervisory: {
        ...JOB_CATEGORIES.nonSupervisory,
        goalsWeightTotal: 100,
        competencies: [
            commonCompetencies.responsibility,
            commonCompetencies.cooperation,
            commonCompetencies.communication,
            commonCompetencies.results,
            commonCompetencies.development,
            commonCompetencies.engagement,
        ],
        notes: [
            'يجب أن يكون مجموع الوزن النسبي للأهداف 100%.',
            'يجب أن يكون مجموع الوزن النسبي للجدارات 100%.',
            'جدارة القيادة غير محتسبة للوظيفة غير الإشرافية.',
        ],
    },
    supervisory: {
        ...JOB_CATEGORIES.supervisory,
        goalsWeightTotal: 100,
        competencies: [
            commonCompetencies.responsibility,
            commonCompetencies.cooperation,
            { ...commonCompetencies.communication, weight: 5 },
            commonCompetencies.results,
            commonCompetencies.development,
            { ...commonCompetencies.engagement, weight: 10 },
            commonCompetencies.leadership,
        ],
        notes: [
            'يجب أن يكون مجموع الوزن النسبي للأهداف 100%.',
            'يجب أن يكون مجموع الوزن النسبي للجدارات 100%.',
            'لا يتجاوز الوزن النسبي لجدارة القيادة 40%، ولا يتجاوز أي وزن آخر 20%.',
        ],
    },
};

export const CHARTER_FIELDS = [
    { id: 'employeeName', label: 'اسم الموظف' },
    { id: 'jobTitle', label: 'المسمى الوظيفي' },
    { id: 'jobNumber', label: 'الرقم الوظيفي' },
    { id: 'agencyName', label: 'الوكالة / الإدارة العامة' },
    { id: 'departmentName', label: 'الإدارة / القسم' },
    { id: 'managerName', label: 'المدير (المقيّم)' },
];

export const GOAL_COLUMNS = [
    'م',
    'الهدف',
    'معيار القياس',
    'الوزن النسبي',
    'الناتج المستهدف',
    'الناتج الفعلي',
    'الفرق بين الناتجين',
    'التقدير (1-5)',
    'التقدير الموزون',
];

export const MEASUREMENT_TYPES = [
    { id: 'quantity', label: 'كمية / عددية' },
    { id: 'quality', label: 'جودة / مطابقة' },
    { id: 'time', label: 'زمن / مدة إنجاز' },
    { id: 'cost', label: 'تكلفة / كفاءة إنفاق' },
    { id: 'satisfaction', label: 'رضا المستفيد' },
    { id: 'compliance', label: 'التزام / امتثال' },
];

export const OFFICIAL_REFERENCES = [
    {
        id: 'hrsd-framework',
        title: 'أطر العمل التنظيمية للائحة التنفيذية للموارد البشرية - إدارة الأداء',
        source: 'وزارة الموارد البشرية والتنمية الاجتماعية',
        url: 'https://www.hrsd.gov.sa/knowledge-centre/decisions-and-regulations/regulation-and-procedures/836898',
        appliedTo: 'الميثاق، دورة الأداء، مصادر التقييم، خطط التطوير، التظلمات',
    },
    {
        id: 'hrsd-executive-regulation',
        title: 'اللائحة التنفيذية للموارد البشرية في الخدمة المدنية',
        source: 'وزارة الموارد البشرية والتنمية الاجتماعية',
        url: 'https://www.hrsd.gov.sa/knowledge-centre/decisions-and-regulations/regulation-and-procedures/%D8%A7%D9%84%D9%84%D8%A7%D8%A6%D8%AD%D8%A9-%D8%A7%D9%84%D8%AA%D9%86%D9%81%D9%8A%D8%B0%D9%8A%D8%A9-%D9%84%D9%84%D9%85%D9%88%D8%A7%D8%B1%D8%AF-%D8%A7%D9%84%D8%A8%D8%B4%D8%B1%D9%8A%D8%A9-%D9%81%D9%8A-%D8%A7%D9%84%D8%AE%D8%AF%D9%85%D8%A9-%D8%A7%D9%84%D9%85%D8%AF%D9%86%D9%8A%D8%A9',
        appliedTo: 'مسؤولية إدارة الأداء، التظلم، تعديل التقويم، تحليل الاحتياج التدريبي',
    },
    {
        id: 'promotion-points',
        title: 'دليل احتساب نقاط الترقية بالمفاضلة',
        source: 'وزارة الموارد البشرية والتنمية الاجتماعية',
        url: 'https://www.hrsd.gov.sa/knowledge-centre/decisions-and-regulations/regulation-and-procedures/%D8%AF%D9%84%D9%8A%D9%84-%D8%A7%D8%AD%D8%AA%D8%B3%D8%A7%D8%A8-%D9%86%D9%82%D8%A7%D8%B7-%D8%A7%D9%84%D8%AA%D8%B1%D9%82%D9%8A%D8%A9-%D8%A8%D8%A7%D9%84%D9%85%D9%81%D8%A7%D8%B6%D9%84%D8%A9',
        appliedTo: 'ربط الأداء بعناصر المفاضلة للترقية',
    },
    {
        id: 'promotion-service',
        title: 'إشغال الوظائف بالترقيات',
        source: 'وزارة الموارد البشرية والتنمية الاجتماعية',
        url: 'https://www.hrsd.gov.sa/ministry-services/services/%D8%A5%D8%B4%D8%BA%D8%A7%D9%84-%D8%A7%D9%84%D9%88%D8%B8%D8%A7%D8%A6%D9%81-%D8%A8%D8%A7%D9%84%D8%AA%D8%B1%D9%82%D9%8A%D8%A7%D8%AA',
        appliedTo: 'مسار الترقيات: إعلان، تقييم، مفاضلة، اعتماد محضر',
    },
];

export const PERFORMANCE_CYCLE_STAGES = [
    {
        id: 'planning',
        title: 'تخطيط الأداء وإعداد الميثاق',
        owner: 'الرئيس المباشر بالتنسيق مع الموظف',
        output: 'ميثاق أداء معتمد يتضمن الأهداف، معيار القياس، الوزن النسبي، والناتج المستهدف.',
        controls: [
            'ألا تقل الأهداف عن أربعة أهداف.',
            'مجموع أوزان الأهداف يساوي 100%.',
            'تحديد جدارات الوظيفة الإشرافية أو غير الإشرافية وفق النموذج المعتمد.',
        ],
    },
    {
        id: 'approval',
        title: 'اطلاع الموظف والاعتماد',
        owner: 'الرئيس المباشر ورئيس الوحدة التنظيمية',
        output: 'ميثاق موقع من الموظف والرئيس المباشر ومعتمد من رئيس الوحدة.',
        controls: [
            'تزويد إدارة الموارد البشرية بالنسخة المعتمدة.',
            'حفظ نسخة قابلة للرجوع عند التقييم والتظلم.',
        ],
    },
    {
        id: 'mid-year',
        title: 'المتابعة والمراجعة النصفية',
        owner: 'الرئيس المباشر',
        output: 'سجل متابعة وملاحظات وتحديثات مسموحة بعد النصف الأول عند الحاجة.',
        controls: [
            'تدوين الملاحظات والأدلة بشكل مستمر.',
            'يجوز تعديل الميثاق بعد انتهاء النصف الأول من دورة الأداء.',
        ],
    },
    {
        id: 'final-evaluation',
        title: 'التقييم النهائي',
        owner: 'الرئيس المباشر',
        output: 'نتيجة تقييم مبنية على الميثاق وسجل الملاحظات وتقرير الإنجاز وسجل متابعة الأداء.',
        controls: [
            'احتساب الأهداف والجدارات على مقياس من خمسة مستويات.',
            'اعتماد النتيجة وحفظها لدى إدارة الموارد البشرية.',
        ],
    },
    {
        id: 'classification',
        title: 'التصنيف والقرارات',
        owner: 'إدارة الموارد البشرية',
        output: 'تصنيف الأداء، توصيات تطوير، مؤشرات ترقية ومفاضلة، وتنبيهات نظامية.',
        controls: [
            'إعداد خطة تطوير لمن حصل على أقل من جيد جدا.',
            'إبلاغ الموظف كتابة عند الحصول على غير مرضي.',
            'إتاحة مسار التظلم وفق إطار العمل التنظيمي.',
        ],
    },
];

export const RESPONSIBILITY_MATRIX = [
    {
        role: 'الموظف',
        responsibilities: [
            'المشاركة في صياغة الأهداف وفهم معيار القياس والوزن النسبي.',
            'تقديم تقرير الإنجاز والأدلة الداعمة خلال دورة الأداء.',
            'توقيع الميثاق والاطلاع على نتيجة التقييم.',
            'تنفيذ خطة التحسين أو التطوير المعتمدة عند الحاجة.',
            'تقديم التظلم خلال المسار النظامي إذا اعترض على النتيجة.',
        ],
    },
    {
        role: 'الرئيس المباشر',
        responsibilities: [
            'إعداد الميثاق بالتنسيق مع الموظف.',
            'تحديد الأهداف والجدارات والوزن النسبي والناتج المستهدف.',
            'متابعة الأداء وتدوين الملاحظات والأدلة.',
            'إجراء المراجعة النصفية والتقييم النهائي.',
            'تقديم توصيات التطوير أو الترقية أو المعالجة بناء على النتيجة.',
        ],
    },
    {
        role: 'رئيس الوحدة التنظيمية',
        responsibilities: [
            'اعتماد ميثاق الأداء بعد إعداده واطلاع الموظف عليه.',
            'مراجعة اتساق الأهداف مع مهام الوحدة.',
            'دعم معالجة الاعتراضات داخل الوحدة قبل التظلم الرسمي.',
        ],
    },
    {
        role: 'إدارة الموارد البشرية',
        responsibilities: [
            'إدارة عملية الأداء وحفظ التقييم المعتمد وتزويد الموظف بنسخة.',
            'تهيئة البيانات والبرامج والتدريب اللازم لتطبيق التصنيف.',
            'إعداد خطط تطوير للحاصلين على أقل من جيد جدا.',
            'إرسال الإنذارات النظامية للحاصلين على غير مرضي.',
            'ربط نتائج الأداء باحتياجات التدريب، التعاقب الوظيفي، وبرامج تطوير القيادات.',
        ],
    },
    {
        role: 'لجنة التظلمات',
        responsibilities: [
            'فحص التظلمات الخاصة بعمليات الأداء بسرية.',
            'دراسة الأدلة ومصادر التقييم ورفع التوصية النظامية.',
        ],
    },
];

export const CHARTER_QUESTIONS = {
    employee: [
        'هل فهم الموظف الهدف ومعيار قياسه والناتج المستهدف؟',
        'هل قدم الموظف أدلة إنجاز كافية لكل هدف؟',
        'هل التزم الموظف بالمواعيد وجودة التنفيذ؟',
        'ما أهم العوائق التي أثرت على الإنجاز؟',
        'ما الدعم أو التدريب المطلوب لتحسين الأداء؟',
        'هل توجد مبادرات أو إنجازات مؤثرة يمكن احتسابها في المفاضلة؟',
    ],
    manager: [
        'هل الهدف مرتبط بمهام الوظيفة وخطة الوحدة؟',
        'هل معيار القياس قابل للتحقق ومرتبط بنتيجة واضحة؟',
        'هل الوزن النسبي يعكس أهمية الهدف؟',
        'هل تم الرجوع إلى سجل الملاحظات وتقرير الإنجاز وسجل متابعة الأداء؟',
        'هل التقييم مدعوم بأدلة موضوعية وقابلة للمراجعة؟',
        'ما القرار المقترح: اعتماد، تطوير، تحسين أداء، ترشيح، أو تظلم؟',
    ],
    hr: [
        'هل الميثاق مكتمل ومعتمد ومتاح للرجوع؟',
        'هل مجموع أوزان الأهداف والجدارات يساوي 100%؟',
        'هل تصنيف الأداء يحتاج ضم إدارات عند انخفاض عدد الموظفين عن الحد الأدنى؟',
        'هل النتيجة أقل من جيد جدا وتحتاج خطة تطوير؟',
        'هل النتيجة غير مرضي وتحتاج إشعارا كتابيا ومسارا تصحيحيا؟',
        'هل النتيجة تدخل ضمن عناصر مفاضلة الترقية أو برامج التدريب والتطوير؟',
    ],
};

export const QUESTION_BANK = [
    {
        id: 'goal_measurement_001',
        department: 'عام',
        context: 'goal',
        audience: 'employee',
        type: 'measurement',
        text: 'ما المهام العملية التي ستنفذها لتحقيق هذا الهدف؟',
        suggestedTaskTitle: 'تحويل الهدف إلى مهام تنفيذية',
        required: true,
    },
    {
        id: 'goal_measurement_002',
        department: 'عام',
        context: 'goal',
        audience: 'employee',
        type: 'evidence',
        text: 'ما الأدلة أو المرفقات التي ستثبت تحقق الناتج المستهدف؟',
        suggestedTaskTitle: 'تجهيز أدلة إنجاز الهدف',
        required: true,
    },
    {
        id: 'goal_risk_001',
        department: 'عام',
        context: 'goal',
        audience: 'employee',
        type: 'risk',
        text: 'ما المخاطر أو العوائق المتوقعة التي قد تؤخر تنفيذ الهدف؟',
        suggestedTaskTitle: 'معالجة عوائق تنفيذ الهدف',
        required: false,
    },
    {
        id: 'goal_support_001',
        department: 'عام',
        context: 'goal',
        audience: 'employee',
        type: 'support',
        text: 'ما الدعم أو الصلاحيات أو البيانات التي تحتاجها من المدير أو الإدارة؟',
        suggestedTaskTitle: 'طلب دعم لتنفيذ الهدف',
        required: false,
    },
    {
        id: 'evaluation_evidence_001',
        department: 'عام',
        context: 'evaluation',
        audience: 'employee',
        type: 'evidence',
        text: 'اذكر أهم ثلاثة إنجازات مرتبطة بميثاق الأداء خلال الفترة.',
        suggestedTaskTitle: 'توثيق إنجازات فترة التقييم',
        required: true,
    },
    {
        id: 'evaluation_improvement_001',
        department: 'عام',
        context: 'evaluation',
        audience: 'employee',
        type: 'improvement',
        text: 'ما الجدارة أو المهارة التي تحتاج إلى تحسينها في الفترة القادمة؟',
        suggestedTaskTitle: 'خطة تحسين مهارة أو جدارة',
        required: true,
    },
    {
        id: 'extension_reason_001',
        department: 'عام',
        context: 'extension',
        audience: 'employee',
        type: 'extension',
        text: 'ما سبب طلب تمديد مدة المهمة؟ وما التاريخ الجديد المقترح؟',
        suggestedTaskTitle: 'استكمال المهمة بعد التمديد',
        required: true,
    },
    {
        id: 'manager_direction_001',
        department: 'عام',
        context: 'directive',
        audience: 'manager',
        type: 'directive',
        text: 'ما التوجيه الإداري المطلوب تحويله إلى مهمة للموظف؟',
        suggestedTaskTitle: 'تنفيذ توجيه المدير',
        required: true,
    },
    {
        id: 'finance_goal_001',
        department: 'المالية',
        context: 'goal',
        audience: 'employee',
        type: 'measurement',
        text: 'ما معيار الالتزام المالي المطلوب: نسبة صرف، مطابقة، إغلاق مطالبة، أو زمن معالجة؟',
        suggestedTaskTitle: 'متابعة معيار الالتزام المالي',
        required: true,
    },
    {
        id: 'hr_goal_001',
        department: 'الموارد البشرية',
        context: 'goal',
        audience: 'employee',
        type: 'measurement',
        text: 'ما مؤشر قياس الخدمة HR: زمن إنجاز، دقة بيانات، رضا مستفيد، أو اكتمال إجراء؟',
        suggestedTaskTitle: 'تنفيذ مؤشر خدمة الموارد البشرية',
        required: true,
    },
    {
        id: 'projects_goal_001',
        department: 'المشاريع',
        context: 'goal',
        audience: 'employee',
        type: 'milestone',
        text: 'ما المعالم الرئيسية للهدف وما تاريخ تسليم كل مخرج؟',
        suggestedTaskTitle: 'تسليم معلم مشروع مرتبط بالهدف',
        required: true,
    },
    {
        id: 'technical_goal_001',
        department: 'تقنية المعلومات',
        context: 'goal',
        audience: 'employee',
        type: 'quality',
        text: 'ما معيار الجودة الفني المطلوب: توفر، زمن استجابة، أمن، أو إغلاق بلاغات؟',
        suggestedTaskTitle: 'تحقيق معيار جودة تقني',
        required: true,
    },
    {
        id: 'field_goal_001',
        department: 'الأعمال الميدانية',
        context: 'goal',
        audience: 'employee',
        type: 'field',
        text: 'ما خطة التنفيذ الميداني وعدد الجولات أو المواقع المستهدفة؟',
        suggestedTaskTitle: 'تنفيذ جولة أو مهمة ميدانية',
        required: true,
    },
];

export const EVIDENCE_SOURCES = [
    'ميثاق الأداء المعتمد',
    'سجل تدوين الملاحظات',
    'تقرير الإنجاز',
    'سجل متابعة الأداء',
    'مؤشرات الأداء والقياس',
    'الأدلة والمرفقات الداعمة',
    'نتائج التدريب أو الاختبارات أو المقابلات عند المفاضلة',
];

export const IMPACT_RULES = [
    {
        id: 'promotion',
        title: 'أثر الأداء على الترقية',
        summary: 'تقييم الأداء الوظيفي أحد عناصر مفاضلة الترقية مع المبادرات والإنجازات، التدريب والتطوير، المقابلة الشخصية، واختبار المفاضلة.',
        systemAction: 'يعرض النظام مؤشر جاهزية للترقية ويجمع عناصر المفاضلة، ولا يصدر قرار ترقية نهائي دون مسار الترقيات المعتمد.',
    },
    {
        id: 'development',
        title: 'خطة تطوير إلزامية',
        summary: 'الموظف الحاصل على أقل من جيد جدا يحتاج خطة تطوير لرفع الأداء.',
        systemAction: 'ينشئ النظام توصيات تدريب وتحسين مرتبطة بأضعف الأهداف والجدارات.',
    },
    {
        id: 'unsatisfactory',
        title: 'معالجة غير مرضي',
        summary: 'عند الحصول على غير مرضي يتم إبلاغ الموظف كتابة بضرورة رفع الأداء، ويتصاعد الأثر إذا تكرر التقدير في السنوات التالية.',
        systemAction: 'ينشئ النظام إنذارا كتابيا ومسار متابعة شهري وخطة تحسين أداء.',
    },
    {
        id: 'allowance',
        title: 'مؤشر العلاوة أو المزايا المرتبطة بالأداء',
        summary: 'أي أثر مالي يخضع للائحة الحقوق والمزايا المالية وقرارات الجهة، ويستخدم الأداء كشرط أو قرينة ضمن بعض الحالات.',
        systemAction: 'يعرض النظام مؤشرا أوليا فقط: ممتاز للمراتب العليا، وجيد جدا فأعلى للمراتب الأدنى عند وجود مسار نظامي معمول به داخل الجهة.',
    },
    {
        id: 'training',
        title: 'تحليل الاحتياج التدريبي',
        summary: 'تحليل الاحتياج التطويري والتدريبي ينبثق من نتائج تقويم الأداء لتمكين الموظف من تحسين أدائه والاستعداد لمسؤوليات جديدة.',
        systemAction: 'يربط النظام كل فجوة أداء بتوصية تدريب أو إرشاد أو متابعة أو تكليف تدريجي.',
    },
];

const scoreToRating = (score) => {
    const numeric = Number(score) || 0;
    if (numeric >= 4.5) return { score: 5, label: 'ممتاز' };
    if (numeric >= 3.5) return { score: 4, label: 'جيد جداً' };
    if (numeric >= 2.5) return { score: 3, label: 'جيد' };
    if (numeric >= 1.5) return { score: 2, label: 'مرضي' };
    return { score: 1, label: 'غير مرضي' };
};

export const getPerformanceDecision = ({
    finalScore = 0,
    previousUnsatisfactoryCount = 0,
    rankLevel = 10,
    yearsInRank = 0,
    hasDisciplinaryAction = false,
    absenceDeductionDays = 0,
} = {}) => {
    const rating = scoreToRating(finalScore);
    const isExcellent = rating.score === 5;
    const isVeryGoodOrAbove = rating.score >= 4;
    const belowVeryGood = rating.score < 4;
    const unsatisfactory = rating.score === 1;
    const highRank = Number(rankLevel) >= 11;

    const promotionReadiness = isVeryGoodOrAbove && !hasDisciplinaryAction
        ? 'جاهز مبدئيا للدخول في مفاضلة الترقية عند اكتمال بقية الشروط'
        : 'غير جاهز مبدئيا للترقية ويحتاج تحسين عناصر الأداء أو معالجة الموانع';

    const allowanceIndicator = highRank
        ? (isExcellent ? 'مؤشر إيجابي للعلاوة عند وجود مسار نظامي معمول به' : 'يتطلب ممتاز للمراتب 11 فأعلى كمؤشر أولي')
        : (isVeryGoodOrAbove && yearsInRank >= 4 && absenceDeductionDays < 5 && !hasDisciplinaryAction
            ? 'مؤشر إيجابي للعلاوة عند وجود مسار نظامي معمول به'
            : 'يتطلب جيد جدا فأعلى مع مدة وموانع نظامية للمراتب العاشرة فما دون');

    const actions = [];
    if (belowVeryGood) {
        actions.push('إنشاء خطة تطوير أداء مرتبطة بالأهداف والجدارات الأقل تقييما.');
        actions.push('تحديد تدريب أو توجيه وظيفي ومراجعة شهرية حتى نهاية الدورة.');
    }
    if (unsatisfactory) {
        actions.push('إبلاغ الموظف كتابة بضرورة رفع مستوى الأداء.');
        actions.push(previousUnsatisfactoryCount >= 2
            ? 'رفع الحالة للمعالجة النظامية بسبب تكرار غير مرضي للسنة الثالثة.'
            : 'إنشاء مسار تحسين أداء مع إنذار ومراجعة موثقة.');
    }
    if (isExcellent) {
        actions.push('ترشيح للمبادرات والإنجازات وبرامج تطوير القيادات عند توفر الشروط.');
    }
    if (isVeryGoodOrAbove) {
        actions.push('إدراج النتيجة ضمن عناصر مفاضلة الترقية مع التدريب والمبادرات والمقابلة والاختبار.');
    }

    return {
        rating,
        promotionReadiness,
        allowanceIndicator,
        needsDevelopmentPlan: belowVeryGood,
        requiresWrittenNotice: unsatisfactory,
        actions,
    };
};

export const getImprovementRecommendations = (ratings = {}, jobCategory = 'nonSupervisory') => {
    const template = getTemplate(jobCategory);
    return template.competencies
        .map((competency) => ({
            competencyId: competency.id,
            competencyName: competency.name,
            score: Number(ratings?.[competency.id]) || 0,
            recommendation: getCompetencyRecommendation(competency.id),
        }))
        .filter((item) => item.score > 0 && item.score < 4)
        .sort((a, b) => a.score - b.score);
};

const getCompetencyRecommendation = (competencyId) => {
    const recommendations = {
        responsibility: 'تحديد التوقعات والمهام كتابة، ومراجعة أسبوعية للالتزام وتحمل المسؤولية.',
        cooperation: 'إشراك الموظف في عمل جماعي وتكليفه بمخرجات مشتركة قابلة للقياس.',
        communication: 'تدريب على الاتصال الكتابي والشفهي، وتوثيق الاجتماعات والردود المهنية.',
        results: 'تقسيم الأهداف إلى مراحل قصيرة، وربط كل مرحلة بمؤشر قياس وموعد إنجاز.',
        development: 'خطة تعلم فردية وتوجيه مهني ومراجعة أثر التدريب على العمل.',
        engagement: 'جلسة توجيه حول الدافعية وبيئة العمل وخدمة المستفيد والالتزام بالحضور.',
        leadership: 'برنامج قيادة وتفويض ومتابعة نتائج المرؤوسين وإدارة المخاطر.',
    };

    return recommendations[competencyId] || 'خطة تطوير فردية مرتبطة بسلوكيات الجدارة ومؤشرات القياس.';
};

export const getTemplate = (jobCategory = 'nonSupervisory') =>
    PERFORMANCE_TEMPLATES[jobCategory] || PERFORMANCE_TEMPLATES.nonSupervisory;

export const getRatingLabel = (score) =>
    RATING_SCALE.find((item) => item.score === Number(score))?.label || 'غير محدد';

export const calculateWeightedRating = (rating, weight) =>
    Number((((Number(rating) || 0) * (Number(weight) || 0)) / 100).toFixed(2));

export const calculateCompetencyScore = (ratings, jobCategory = 'nonSupervisory') => {
    const template = getTemplate(jobCategory);
    return Number(template.competencies.reduce((sum, competency) => {
        return sum + calculateWeightedRating(ratings?.[competency.id], competency.weight);
    }, 0).toFixed(2));
};

export const calculateGoalWeightedScore = (rating, weight) =>
    Number((((Number(rating) || 0) * (Number(weight) || 0)) / 100).toFixed(2));

export const getTotalWeight = (items = []) =>
    Number(items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0).toFixed(2));
