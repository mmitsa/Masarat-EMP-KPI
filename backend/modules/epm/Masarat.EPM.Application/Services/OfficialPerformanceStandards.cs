using Masarat.EPM.Application.DTOs;

namespace Masarat.EPM.Application.Services;

public static class OfficialPerformanceStandards
{
    private static readonly RatingScaleDto[] RatingScale =
    [
        new(5, "ممتاز", "حقق كل أهدافه وتخطى المستهدفات المحددة بالمستوى المطلوب، وأظهر الجدارات في مستويات أعلى من المطلوبة للوظيفة."),
        new(4, "جيد جداً", "حقق كل أهدافه بالمستوى المطلوب، وأظهر الجدارات في مستويات تتوافق بدرجة كبيرة مع المستويات المطلوبة للوظيفة."),
        new(3, "جيد", "حقق معظم أهدافه بالمستوى المطلوب، وأظهر الجدارات في مستويات قريبة من المستويات المطلوبة للوظيفة."),
        new(2, "مرضي", "الأداء أقل من التوقعات، وحقق بعض أهدافه بالمستوى المطلوب، والجدارات المطلوبة لا تتسم بالثبات الكافي."),
        new(1, "غير مرضي", "الأداء أقل من التوقعات بشكل دائم، ولم يحقق معظم أهدافه ولم يصل في أي منها إلى المستوى المطلوب.")
    ];

    private static readonly string[] CharterFields =
    [
        "اسم الموظف",
        "المسمى الوظيفي",
        "الرقم الوظيفي",
        "الوكالة / الإدارة العامة",
        "الإدارة / القسم",
        "المدير (المقيّم)"
    ];

    private static readonly string[] GoalColumns =
    [
        "م",
        "الهدف",
        "معيار القياس",
        "الوزن النسبي",
        "الناتج المستهدف",
        "الناتج الفعلي",
        "الفرق بين الناتجين",
        "التقدير (1-5)",
        "التقدير الموزون"
    ];

    private static readonly string[] MeasurementTypes =
    [
        "كمية / عددية",
        "جودة / مطابقة",
        "زمن / مدة إنجاز",
        "تكلفة / كفاءة إنفاق",
        "رضا المستفيد",
        "التزام / امتثال"
    ];

    public static PerformanceStandardsDto GetAll()
    {
        return new PerformanceStandardsDto(
            RatingScale,
            CharterFields,
            GoalColumns,
            MeasurementTypes,
            new Dictionary<string, PerformanceTemplateDto>
            {
                ["nonSupervisory"] = GetTemplate("nonSupervisory"),
                ["supervisory"] = GetTemplate("supervisory")
            });
    }

    public static PerformanceTemplateDto GetTemplate(string? jobCategory)
    {
        return NormalizeJobCategory(jobCategory) == "supervisory"
            ? SupervisoryTemplate()
            : NonSupervisoryTemplate();
    }

    public static IReadOnlyList<CompetencyStandardDto> GetCompetencies(string? jobCategory)
    {
        return GetTemplate(jobCategory).Competencies;
    }

    public static string NormalizeJobCategory(string? jobCategory)
    {
        return string.Equals(jobCategory, "supervisory", StringComparison.OrdinalIgnoreCase)
            ? "supervisory"
            : "nonSupervisory";
    }

    public static string GetRatingLabel(decimal score)
    {
        return score switch
        {
            >= 4.5m => "ممتاز",
            >= 3.5m => "جيد جداً",
            >= 2.5m => "جيد",
            >= 1.5m => "مرضي",
            _ => "غير مرضي"
        };
    }

    private static PerformanceTemplateDto NonSupervisoryTemplate()
    {
        return new PerformanceTemplateDto(
            "nonSupervisory",
            "وظيفة غير إشرافية",
            "ميثاق الأداء للموظف على الوظيفة غير الإشرافية",
            "نموذج تقييم الأداء الوظيفي - الوظيفة غير الإشرافية",
            100,
            [
                Responsibility(10),
                Cooperation(5),
                Communication(15),
                Results(20),
                Development(10),
                Engagement(40)
            ],
            [
                "يجب أن يكون مجموع الوزن النسبي للأهداف 100%.",
                "يجب أن يكون مجموع الوزن النسبي للجدارات 100%.",
                "جدارة القيادة غير محتسبة للوظيفة غير الإشرافية."
            ]);
    }

    private static PerformanceTemplateDto SupervisoryTemplate()
    {
        return new PerformanceTemplateDto(
            "supervisory",
            "وظيفة إشرافية",
            "ميثاق الأداء للموظف على الوظيفة الإشرافية",
            "نموذج تقييم الأداء الوظيفي - الوظيفة الإشرافية",
            100,
            [
                Responsibility(10),
                Cooperation(5),
                Communication(5),
                Results(20),
                Development(10),
                Engagement(10),
                Leadership(40)
            ],
            [
                "يجب أن يكون مجموع الوزن النسبي للأهداف 100%.",
                "يجب أن يكون مجموع الوزن النسبي للجدارات 100%.",
                "لا يتجاوز الوزن النسبي لجدارة القيادة 40%، ولا يتجاوز أي وزن آخر 20%."
            ]);
    }

    private static CompetencyStandardDto Responsibility(decimal weight) => new(
        "responsibility",
        "حس المسؤولية",
        weight,
        [
            "يتحمل مسؤولية أعماله وقراراته، ولا يلقي اللوم على الآخرين.",
            "يفهم دوره وكيفية ارتباطه بالأهداف العامة لجهة عمله.",
            "يفصح عما يواجهه من تحديات بشفافية."
        ]);

    private static CompetencyStandardDto Cooperation(decimal weight) => new(
        "cooperation",
        "التعاون",
        weight,
        [
            "يشارك المعلومات بانفتاح وفق متطلبات العمل.",
            "يسعى إلى الاستفادة من آراء الآخرين وتهيئتهم لدعم الأعمال من خلال بناء علاقات داعمة.",
            "يستجيب لطلبات الدعم والمساندة من الوحدات التنظيمية في جهة عمله."
        ]);

    private static CompetencyStandardDto Communication(decimal weight) => new(
        "communication",
        "التواصل",
        weight,
        [
            "يستخدم التواصل المكتوب الواضح والفعال.",
            "يستخدم التواصل الشفهي الواضح والفعال.",
            "ينصت للآخرين بعناية."
        ]);

    private static CompetencyStandardDto Results(decimal weight) => new(
        "results",
        "تحقيق النتائج",
        weight,
        [
            "يستطيع القيام بمهام متعددة وتحديد أولوياتها حسب أهميتها النسبية.",
            "يمكن الاعتماد عليه، وينفذ مهامه في وقتها بمستوى عال من الجودة.",
            "مبادر وقادر على تقديم بدائل وحلول عند تنفيذ مهامه."
        ]);

    private static CompetencyStandardDto Development(decimal weight) => new(
        "development",
        "تطوير الموظفين",
        weight,
        [
            "يسعى إلى التعلم وتطوير نفسه باستمرار.",
            "يقدم آراء مساعدة للآخرين ويشارك النصح والاقتراحات."
        ]);

    private static CompetencyStandardDto Engagement(decimal weight) => new(
        "engagement",
        "الارتباط الوظيفي",
        weight,
        [
            "لديه الاستعداد لمواجهة تحديات العمل.",
            "يتطلع إلى مستوى أعلى من الإنجاز والابتكار عند تنفيذ العمل.",
            "يلتزم بمواعيد العمل ويكون متواجداً عند الحاجة إليه.",
            "يركز على خدمة العملاء عند تنفيذ أعماله."
        ]);

    private static CompetencyStandardDto Leadership(decimal weight) => new(
        "leadership",
        "القيادة",
        weight,
        [
            "مرن وقادر على تنفيذ أعمال هامة في ظروف تنطوي على قدر كبير من المخاطرة وعدم اليقين.",
            "يدعم ويشجع فريقه على تحقيق أهدافه حتى في الظروف الصعبة.",
            "يفكر بمنطقية وإبداع دون التأثر بتحيزاته الشخصية.",
            "يفوض الصلاحيات ويتابع النتائج.",
            "يوفر ويدعم فرص تطوير المرؤوسين."
        ]);
}

