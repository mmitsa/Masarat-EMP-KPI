using FluentAssertions;
using Masarat.EPM.Application.DTOs;
using Masarat.EPM.Application.Services;
using Masarat.EPM.Domain.Entities;
using Masarat.EPM.Domain.Interfaces;
using Moq;

namespace Masarat.EPM.Tests.Services;

/// <summary>
/// اختبارات وحدة خدمة التقييمات - نظام إدارة الأداء الوظيفي
/// </summary>
public class EvaluationServiceTests
{
    private readonly Mock<IEvaluationService> _evaluationServiceMock;
    private readonly Mock<IPerformanceCharterRepository> _charterRepoMock;

    public EvaluationServiceTests()
    {
        _evaluationServiceMock = new Mock<IEvaluationService>();
        _charterRepoMock = new Mock<IPerformanceCharterRepository>();
    }

    #region GetAllEvaluationsAsync (via Interface Mock)

    [Fact]
    public async Task GetAllEvaluationsAsync_WithEvaluations_ShouldReturnAll()
    {
        // Arrange
        var evaluations = new List<EvaluationDto>
        {
            new() { EvaluationId = 1, EmployeeId = 101, EmployeeName = "أحمد محمد", Year = 2026, ReviewType = "نهاية العام", Status = "Draft", GoalsScore = 85m },
            new() { EvaluationId = 2, EmployeeId = 102, EmployeeName = "سارة عبدالله", Year = 2026, ReviewType = "منتصف العام", Status = "Submitted", GoalsScore = 92m }
        };

        _evaluationServiceMock.Setup(s => s.GetAllEvaluationsAsync(2026)).ReturnsAsync(evaluations);

        // Act
        var result = await _evaluationServiceMock.Object.GetAllEvaluationsAsync(2026);

        // Assert
        result.Should().HaveCount(2);
        result.First().EmployeeName.Should().Be("أحمد محمد");
        result.Last().GoalsScore.Should().Be(92m);
    }

    [Fact]
    public async Task GetAllEvaluationsAsync_WhenEmpty_ShouldReturnEmptyList()
    {
        // Arrange
        _evaluationServiceMock.Setup(s => s.GetAllEvaluationsAsync(2026)).ReturnsAsync(new List<EvaluationDto>());

        // Act
        var result = await _evaluationServiceMock.Object.GetAllEvaluationsAsync(2026);

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region GetEvaluationByIdAsync

    [Fact]
    public async Task GetEvaluationByIdAsync_ExistingId_ShouldReturnEvaluation()
    {
        // Arrange
        var evaluation = new EvaluationDto
        {
            EvaluationId = 1,
            EmployeeId = 101,
            EmployeeName = "أحمد محمد",
            Department = "تقنية المعلومات",
            Year = 2026,
            ReviewType = "نهاية العام",
            Status = "Approved",
            GoalsScore = 88m,
            CompetenciesScore = 85m,
            FinalScore = 87m
        };

        _evaluationServiceMock.Setup(s => s.GetEvaluationByIdAsync(1)).ReturnsAsync(evaluation);

        // Act
        var result = await _evaluationServiceMock.Object.GetEvaluationByIdAsync(1);

        // Assert
        result.Should().NotBeNull();
        result!.EmployeeName.Should().Be("أحمد محمد");
        result.FinalScore.Should().Be(87m);
        result.Status.Should().Be("Approved");
    }

    [Fact]
    public async Task GetEvaluationByIdAsync_NonExistingId_ShouldReturnNull()
    {
        // Arrange
        _evaluationServiceMock.Setup(s => s.GetEvaluationByIdAsync(999)).ReturnsAsync((EvaluationDto?)null);

        // Act
        var result = await _evaluationServiceMock.Object.GetEvaluationByIdAsync(999);

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region CreateEvaluationAsync

    [Fact]
    public async Task CreateEvaluationAsync_WithValidData_ShouldCreateEvaluation()
    {
        // Arrange
        var createDto = new CreateEvaluationDto
        {
            EmployeeId = 101,
            Year = 2026,
            ReviewType = "نهاية العام"
        };

        var expectedResult = new EvaluationDto
        {
            EvaluationId = 1,
            EmployeeId = 101,
            Year = 2026,
            ReviewType = "نهاية العام",
            Status = "Draft",
            CreatedAt = DateTime.Now
        };

        _evaluationServiceMock.Setup(s => s.CreateEvaluationAsync(createDto)).ReturnsAsync(expectedResult);

        // Act
        var result = await _evaluationServiceMock.Object.CreateEvaluationAsync(createDto);

        // Assert
        result.Should().NotBeNull();
        result.EmployeeId.Should().Be(101);
        result.Status.Should().Be("Draft");
        result.Year.Should().Be(2026);
    }

    #endregion

    #region DeleteEvaluationAsync

    [Fact]
    public async Task DeleteEvaluationAsync_ExistingId_ShouldCallDelete()
    {
        // Arrange
        _evaluationServiceMock.Setup(s => s.DeleteEvaluationAsync(1)).Returns(Task.CompletedTask);

        // Act
        await _evaluationServiceMock.Object.DeleteEvaluationAsync(1);

        // Assert
        _evaluationServiceMock.Verify(s => s.DeleteEvaluationAsync(1), Times.Once);
    }

    #endregion

    #region PerformanceCharter Domain Logic Tests

    [Fact]
    public void PerformanceCharter_IsInPlanningPhase_WhenDraft_ShouldReturnTrue()
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            CharterId = 1,
            Status = "Draft",
            EmployeeSignedDate = null
        };

        // Act & Assert
        charter.IsInPlanningPhase().Should().BeTrue();
    }

    [Fact]
    public void PerformanceCharter_IsInPlanningPhase_WhenSigned_ShouldReturnFalse()
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            CharterId = 1,
            Status = "Draft",
            EmployeeSignedDate = DateTime.Now
        };

        // Act & Assert
        charter.IsInPlanningPhase().Should().BeFalse();
    }

    [Fact]
    public void PerformanceCharter_IsActiveCharter_WhenBothSigned_ShouldReturnTrue()
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            CharterId = 1,
            Status = "Active",
            EmployeeSignedDate = DateTime.Now.AddDays(-10),
            ManagerApprovedDate = DateTime.Now.AddDays(-5)
        };

        // Act & Assert
        charter.IsActiveCharter().Should().BeTrue();
    }

    [Fact]
    public void PerformanceCharter_IsActiveCharter_WhenOnlyEmployeeSigned_ShouldReturnFalse()
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            CharterId = 1,
            Status = "Active",
            EmployeeSignedDate = DateTime.Now.AddDays(-10),
            ManagerApprovedDate = null
        };

        // Act & Assert
        charter.IsActiveCharter().Should().BeFalse();
    }

    [Fact]
    public void PerformanceCharter_SignByEmployee_ShouldSetSignedDate()
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            CharterId = 1,
            Status = "Draft"
        };

        // Act
        charter.SignByEmployee();

        // Assert
        charter.EmployeeSignedDate.Should().NotBeNull();
        charter.EmployeeSignedDate!.Value.Should().BeCloseTo(DateTime.Now, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void PerformanceCharter_SignByEmployee_WhenAlreadySigned_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            CharterId = 1,
            EmployeeSignedDate = DateTime.Now.AddDays(-5)
        };

        // Act
        var act = () => charter.SignByEmployee();

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*موقع بالفعل*");
    }

    [Fact]
    public void PerformanceCharter_ApproveByManager_ShouldActivateCharter()
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            CharterId = 1,
            Status = "Draft",
            EmployeeSignedDate = DateTime.Now.AddDays(-5)
        };

        // Act
        charter.ApproveByManager();

        // Assert
        charter.ManagerApprovedDate.Should().NotBeNull();
        charter.Status.Should().Be("Active");
    }

    [Fact]
    public void PerformanceCharter_ApproveByManager_WhenEmployeeNotSigned_ShouldThrow()
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            CharterId = 1,
            Status = "Draft",
            EmployeeSignedDate = null
        };

        // Act
        var act = () => charter.ApproveByManager();

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*يوقع الموظف أولا*");
    }

    [Fact]
    public void PerformanceCharter_CalculateTotalScore_ShouldComputeCorrectly()
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            CharterId = 1,
            GoalsScore = 90m,
            CompetenciesScore = 80m
        };

        // Act  (70% goals, 30% competencies by default)
        charter.CalculateTotalScore();

        // Assert
        // (90 * 70 / 100) + (80 * 30 / 100) = 63 + 24 = 87
        charter.TotalScore.Should().Be(87m);
        charter.FinalRating.Should().Be("Exceeds Expectations");
    }

    [Theory]
    [InlineData(95, 90, "Outstanding")]           // (95*0.7)+(90*0.3) = 66.5+27 = 93.5
    [InlineData(85, 80, "Exceeds Expectations")]   // (85*0.7)+(80*0.3) = 59.5+24 = 83.5
    [InlineData(75, 70, "Meets Expectations")]     // (75*0.7)+(70*0.3) = 52.5+21 = 73.5
    [InlineData(65, 60, "Needs Improvement")]      // (65*0.7)+(60*0.3) = 45.5+18 = 63.5
    [InlineData(50, 40, "Unsatisfactory")]         // (50*0.7)+(40*0.3) = 35+12 = 47
    public void PerformanceCharter_CalculateTotalScore_WithVariousScores_ShouldReturnCorrectRating(
        decimal goalsScore, decimal competenciesScore, string expectedRating)
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            GoalsScore = goalsScore,
            CompetenciesScore = competenciesScore
        };

        // Act
        charter.CalculateTotalScore();

        // Assert
        charter.FinalRating.Should().Be(expectedRating);
    }

    [Fact]
    public void PerformanceCharter_CalculateTotalScore_WithoutScores_ShouldThrow()
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            GoalsScore = null,
            CompetenciesScore = null
        };

        // Act
        var act = () => charter.CalculateTotalScore();

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*تقييم الأهداف والجدارات*");
    }

    [Fact]
    public void PerformanceCharter_CompleteFinalEvaluation_ShouldSetStatusCompleted()
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            CharterId = 1,
            GoalsScore = 85m,
            CompetenciesScore = 80m
        };
        charter.CalculateTotalScore();

        // Act
        charter.CompleteFinalEvaluation("تقييم ممتاز");

        // Assert
        charter.Status.Should().Be("Completed");
        charter.FinalEvaluationDate.Should().NotBeNull();
        charter.FinalEvaluationNotes.Should().Be("تقييم ممتاز");
    }

    [Fact]
    public void PerformanceCharter_FileAppeal_WhenCompleted_ShouldSetAppeal()
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            CharterId = 1,
            Status = "Completed",
            HasAppeal = false
        };

        // Act
        charter.FileAppeal("أعتقد أن التقييم غير عادل");

        // Assert
        charter.HasAppeal.Should().BeTrue();
        charter.AppealDate.Should().NotBeNull();
        charter.AppealNotes.Should().Be("أعتقد أن التقييم غير عادل");
        charter.AppealStatus.Should().Be("Pending");
    }

    [Fact]
    public void PerformanceCharter_FileAppeal_WhenNotCompleted_ShouldThrow()
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            CharterId = 1,
            Status = "Active"
        };

        // Act
        var act = () => charter.FileAppeal("تظلم");

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*إكمال التقييم*");
    }

    [Fact]
    public void PerformanceCharter_ProcessAppeal_Approved_ShouldUpdateStatus()
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            CharterId = 1,
            Status = "Completed",
            HasAppeal = true,
            AppealStatus = "Pending",
            AppealNotes = "تظلم الموظف"
        };

        // Act
        charter.ProcessAppeal(true, "تمت الموافقة على التظلم");

        // Assert
        charter.AppealStatus.Should().Be("Approved");
    }

    [Fact]
    public void PerformanceCharter_ProcessAppeal_Rejected_ShouldUpdateStatus()
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            CharterId = 1,
            Status = "Completed",
            HasAppeal = true,
            AppealStatus = "Pending",
            AppealNotes = "تظلم الموظف"
        };

        // Act
        charter.ProcessAppeal(false, "التقييم عادل");

        // Assert
        charter.AppealStatus.Should().Be("Rejected");
    }

    #endregion

    #region PerformanceCharter Repository Tests

    [Fact]
    public async Task GetCharterByEmployeeAndYear_ShouldReturnCharter()
    {
        // Arrange
        var charter = new PerformanceCharter
        {
            CharterId = 1,
            EmployeeId = 101,
            EmployeeName = "أحمد محمد",
            FiscalYear = 2026,
            Status = "Active"
        };

        _charterRepoMock.Setup(r => r.GetByEmployeeAndYearAsync(101, 2026)).ReturnsAsync(charter);

        // Act
        var result = await _charterRepoMock.Object.GetByEmployeeAndYearAsync(101, 2026);

        // Assert
        result.Should().NotBeNull();
        result!.EmployeeName.Should().Be("أحمد محمد");
        result.FiscalYear.Should().Be(2026);
    }

    [Fact]
    public async Task GetPendingChartersForMidYearReview_ShouldReturnOnlyDue()
    {
        // Arrange
        var charters = new List<PerformanceCharter>
        {
            new() { CharterId = 1, EmployeeName = "موظف 1", Status = "Active", FiscalYear = 2026 },
            new() { CharterId = 2, EmployeeName = "موظف 2", Status = "Active", FiscalYear = 2026 }
        };

        _charterRepoMock.Setup(r => r.GetDueForMidYearReviewAsync(2026)).ReturnsAsync(charters);

        // Act
        var result = await _charterRepoMock.Object.GetDueForMidYearReviewAsync(2026);

        // Assert
        result.Should().HaveCount(2);
    }

    #endregion
}
