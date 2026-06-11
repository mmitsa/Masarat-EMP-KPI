namespace Masarat.EPM.Application.DTOs;

public record RatingScaleDto(int Score, string Label, string Description);

public record CompetencyStandardDto(
    string Id,
    string Name,
    decimal Weight,
    IReadOnlyList<string> Behaviors);

public record PerformanceTemplateDto(
    string Id,
    string Label,
    string CharterTitle,
    string EvaluationTitle,
    decimal GoalsWeightTotal,
    IReadOnlyList<CompetencyStandardDto> Competencies,
    IReadOnlyList<string> Notes);

public record PerformanceStandardsDto(
    IReadOnlyList<RatingScaleDto> RatingScale,
    IReadOnlyList<string> CharterFields,
    IReadOnlyList<string> GoalColumns,
    IReadOnlyList<string> MeasurementTypes,
    IReadOnlyDictionary<string, PerformanceTemplateDto> Templates);

