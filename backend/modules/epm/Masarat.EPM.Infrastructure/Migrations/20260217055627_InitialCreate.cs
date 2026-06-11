using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Masarat.EPM.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PerformanceCharters",
                columns: table => new
                {
                    CharterId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    EmployeeNationalId = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    EmployeeName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ManagerId = table.Column<int>(type: "int", nullable: false),
                    ManagerName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    FiscalYear = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Draft"),
                    EmployeeSignedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ManagerApprovedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MidYearReviewDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MidYearReviewNotes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    FinalEvaluationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    GoalsScore = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    CompetenciesScore = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    TotalScore = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    FinalRating = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    FinalEvaluationNotes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    HasAppeal = table.Column<bool>(type: "bit", nullable: false),
                    AppealDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AppealNotes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    AppealStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ManagerComments = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PerformanceCharters", x => x.CharterId);
                });

            migrationBuilder.CreateTable(
                name: "Competencies",
                columns: table => new
                {
                    CompetencyId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CharterId = table.Column<int>(type: "int", nullable: false),
                    CompetencyType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NameAr = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NameEn = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Weight = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: true),
                    ScorePercentage = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    WeightedScore = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    EvaluationNotes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    PositiveBehaviors = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    AreasForImprovement = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    EvaluatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Competencies", x => x.CompetencyId);
                    table.ForeignKey(
                        name: "FK_Competencies_PerformanceCharters_CharterId",
                        column: x => x.CharterId,
                        principalTable: "PerformanceCharters",
                        principalColumn: "CharterId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExcellenceElements",
                columns: table => new
                {
                    ElementId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CharterId = table.Column<int>(type: "int", nullable: false),
                    ElementType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ActivityDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Impact = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    SupportingDocuments = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ApprovalStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    ApprovedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ManagerNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    BonusPoints = table.Column<decimal>(type: "decimal(4,2)", precision: 4, scale: 2, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExcellenceElements", x => x.ElementId);
                    table.ForeignKey(
                        name: "FK_ExcellenceElements_PerformanceCharters_CharterId",
                        column: x => x.CharterId,
                        principalTable: "PerformanceCharters",
                        principalColumn: "CharterId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Goals",
                columns: table => new
                {
                    GoalId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CharterId = table.Column<int>(type: "int", nullable: false),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Weight = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    MeasurableIndicators = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    TimeFrame = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    CompletionPercentage = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    ActualScore = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    WeightedScore = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    EvaluationNotes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    EvaluatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Goals", x => x.GoalId);
                    table.ForeignKey(
                        name: "FK_Goals_PerformanceCharters_CharterId",
                        column: x => x.CharterId,
                        principalTable: "PerformanceCharters",
                        principalColumn: "CharterId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Competency_Charter",
                table: "Competencies",
                column: "CharterId");

            migrationBuilder.CreateIndex(
                name: "IX_Competency_Type",
                table: "Competencies",
                column: "CompetencyType");

            migrationBuilder.CreateIndex(
                name: "IX_Excellence_Charter",
                table: "ExcellenceElements",
                column: "CharterId");

            migrationBuilder.CreateIndex(
                name: "IX_Excellence_Status",
                table: "ExcellenceElements",
                column: "ApprovalStatus");

            migrationBuilder.CreateIndex(
                name: "IX_Excellence_Type",
                table: "ExcellenceElements",
                column: "ElementType");

            migrationBuilder.CreateIndex(
                name: "IX_Goal_Charter",
                table: "Goals",
                column: "CharterId");

            migrationBuilder.CreateIndex(
                name: "IX_Goal_Charter_Order",
                table: "Goals",
                columns: new[] { "CharterId", "OrderIndex" });

            migrationBuilder.CreateIndex(
                name: "IX_Charter_Employee_Year",
                table: "PerformanceCharters",
                columns: new[] { "EmployeeId", "FiscalYear" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Charter_FiscalYear",
                table: "PerformanceCharters",
                column: "FiscalYear");

            migrationBuilder.CreateIndex(
                name: "IX_Charter_Manager",
                table: "PerformanceCharters",
                column: "ManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_Charter_Status",
                table: "PerformanceCharters",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Competencies");

            migrationBuilder.DropTable(
                name: "ExcellenceElements");

            migrationBuilder.DropTable(
                name: "Goals");

            migrationBuilder.DropTable(
                name: "PerformanceCharters");
        }
    }
}
