using Masarat.EPM.Application.DTOs;
using Masarat.EPM.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Masarat.EPM.API.Controllers;

/// <summary>
/// تحكم نظام إدارة الأداء
/// Performance Management Controller
/// </summary>
[ApiController]
[Route("api/epm")]
[Authorize]
public class PerformanceController : ControllerBase
{
    private readonly IPerformanceCharterService _charterService;
    private readonly IGoalService _goalService;
    private readonly IEvaluationService _evaluationService;
    private readonly IReviewService _reviewService;
    private readonly ILogger<PerformanceController> _logger;

    public PerformanceController(
        IPerformanceCharterService charterService,
        IGoalService goalService,
        IEvaluationService evaluationService,
        IReviewService reviewService,
        ILogger<PerformanceController> logger)
    {
        _charterService = charterService;
        _goalService = goalService;
        _evaluationService = evaluationService;
        _reviewService = reviewService;
        _logger = logger;
    }

    // ==========================================
    // Charters - ميثاق الأداء
    // ==========================================

    /// <summary>
    /// المعايير الرسمية للميثاق والتقييم حسب النماذج المعتمدة
    /// Official charter/evaluation standards
    /// </summary>
    [HttpGet("standards")]
    [AllowAnonymous]
    public IActionResult GetStandards()
    {
        return Ok(OfficialPerformanceStandards.GetAll());
    }

    /// <summary>
    /// الحصول على جميع مواثيق الأداء
    /// Get all performance charters
    /// </summary>
    [HttpGet("charters")]
    public async Task<IActionResult> GetCharters([FromQuery] int? year, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            // Enforce max page size to prevent excessive memory usage
            pageSize = Math.Clamp(pageSize, 1, 100);
            page = Math.Max(page, 1);

            IEnumerable<PerformanceCharterDto> charters;
            if (year.HasValue)
            {
                charters = await _charterService.GetChartersByYearAsync(year.Value);
            }
            else
            {
                charters = await _charterService.GetAllChartersAsync();
            }

            var charterList = charters.ToList();
            var totalCount = charterList.Count;
            var pagedCharters = charterList.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            return Ok(new
            {
                data = pagedCharters,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع مواثيق الأداء");
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// الحصول على ميثاق أداء بالمعرف
    /// Get charter by ID
    /// </summary>
    [HttpGet("charters/{id}")]
    public async Task<IActionResult> GetCharter(int id)
    {
        try
        {
            var charter = await _charterService.GetCharterByIdAsync(id);
            if (charter == null)
            {
                return NotFound(new { Error = "الميثاق غير موجود" });
            }
            return Ok(charter);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع الميثاق {CharterId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// الحصول على ميثاق موظف للسنة المحددة
    /// Get charter by employee and year
    /// </summary>
    [HttpGet("charters/employee/{employeeId}")]
    public async Task<IActionResult> GetCharterByEmployee(int employeeId, [FromQuery] int? year)
    {
        try
        {
            var fiscalYear = year ?? DateTime.UtcNow.Year;
            var charter = await _charterService.GetCharterByEmployeeAndYearAsync(employeeId, fiscalYear);
            if (charter == null)
            {
                return NotFound(new { Error = $"لا يوجد ميثاق للموظف للسنة {fiscalYear}" });
            }
            return Ok(charter);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع ميثاق الموظف {EmployeeId}", employeeId);
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// الحصول على مواثيق فريق المدير
    /// Get charters for manager's team
    /// </summary>
    [HttpGet("charters/manager/{managerId}")]
    public async Task<IActionResult> GetChartersByManager(int managerId)
    {
        try
        {
            var charters = await _charterService.GetChartersByManagerAsync(managerId);
            return Ok(charters);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع مواثيق فريق المدير {ManagerId}", managerId);
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// الحصول على المواثيق المستحقة للمراجعة نصف السنوية
    /// Get charters due for mid-year review
    /// </summary>
    [HttpGet("charters/due-midyear")]
    public async Task<IActionResult> GetDueForMidYearReview([FromQuery] int? year)
    {
        try
        {
            var fiscalYear = year ?? DateTime.UtcNow.Year;
            var charters = await _charterService.GetDueForMidYearReviewAsync(fiscalYear);
            return Ok(charters);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع المواثيق المستحقة للمراجعة");
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// الحصول على المواثيق المستحقة للتقييم النهائي
    /// Get charters due for final evaluation
    /// </summary>
    [HttpGet("charters/due-final")]
    public async Task<IActionResult> GetDueForFinalEvaluation([FromQuery] int? year)
    {
        try
        {
            var fiscalYear = year ?? DateTime.UtcNow.Year;
            var charters = await _charterService.GetDueForFinalEvaluationAsync(fiscalYear);
            return Ok(charters);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع المواثيق المستحقة للتقييم");
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// إنشاء ميثاق أداء جديد
    /// Create new performance charter
    /// </summary>
    [HttpPost("charters")]
    public async Task<IActionResult> CreateCharter([FromBody] CreateCharterDto dto)
    {
        try
        {
            var charter = await _charterService.CreateCharterAsync(dto);
            return CreatedAtAction(nameof(GetCharter), new { id = charter.CharterId }, charter);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في إنشاء الميثاق");
            return StatusCode(500, new { Error = "حدث خطأ في إنشاء الميثاق" });
        }
    }

    /// <summary>
    /// توقيع الميثاق من الموظف
    /// Sign charter by employee
    /// </summary>
    [HttpPost("charters/{id}/sign")]
    public async Task<IActionResult> SignCharter(int id)
    {
        try
        {
            await _charterService.SignCharterByEmployeeAsync(id);
            return Ok(new { Message = "تم توقيع الميثاق بنجاح" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في توقيع الميثاق {CharterId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في توقيع الميثاق" });
        }
    }

    /// <summary>
    /// موافقة المدير على الميثاق
    /// Approve charter by manager
    /// </summary>
    [HttpPost("charters/{id}/approve")]
    public async Task<IActionResult> ApproveCharter(int id)
    {
        try
        {
            await _charterService.ApproveCharterByManagerAsync(id);
            return Ok(new { Message = "تمت الموافقة على الميثاق بنجاح" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في الموافقة على الميثاق {CharterId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في الموافقة على الميثاق" });
        }
    }

    /// <summary>
    /// إجراء المراجعة نصف السنوية
    /// Perform mid-year review
    /// </summary>
    [HttpPost("charters/{id}/midyear-review")]
    public async Task<IActionResult> PerformMidYearReview(int id, [FromBody] MidYearReviewDto dto)
    {
        try
        {
            await _charterService.PerformMidYearReviewAsync(id, dto);
            return Ok(new { Message = "تمت المراجعة نصف السنوية بنجاح" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في المراجعة نصف السنوية للميثاق {CharterId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في المراجعة" });
        }
    }

    /// <summary>
    /// إكمال التقييم النهائي
    /// Complete final evaluation
    /// </summary>
    [HttpPost("charters/{id}/final-evaluation")]
    public async Task<IActionResult> CompleteFinalEvaluation(int id, [FromBody] FinalEvaluationDto dto)
    {
        try
        {
            await _charterService.CompleteFinalEvaluationAsync(id, dto);
            return Ok(new { Message = "تم إكمال التقييم النهائي بنجاح" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في التقييم النهائي للميثاق {CharterId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في التقييم" });
        }
    }

    /// <summary>
    /// تقديم تظلم
    /// File appeal
    /// </summary>
    [HttpPost("charters/{id}/appeal")]
    public async Task<IActionResult> FileAppeal(int id, [FromBody] AppealDto dto)
    {
        try
        {
            await _charterService.FileAppealAsync(id, dto);
            return Ok(new { Message = "تم تقديم التظلم بنجاح" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في تقديم التظلم للميثاق {CharterId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في تقديم التظلم" });
        }
    }

    /// <summary>
    /// معالجة التظلم
    /// Process appeal
    /// </summary>
    [HttpPost("charters/{id}/process-appeal")]
    public async Task<IActionResult> ProcessAppeal(int id, [FromBody] ProcessAppealDto dto)
    {
        try
        {
            await _charterService.ProcessAppealAsync(id, dto);
            return Ok(new { Message = dto.Approved ? "تم قبول التظلم" : "تم رفض التظلم" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في معالجة التظلم للميثاق {CharterId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في معالجة التظلم" });
        }
    }

    /// <summary>
    /// حذف ميثاق
    /// Delete charter
    /// </summary>
    [HttpDelete("charters/{id}")]
    public async Task<IActionResult> DeleteCharter(int id)
    {
        try
        {
            await _charterService.DeleteCharterAsync(id);
            return Ok(new { Message = "تم حذف الميثاق بنجاح" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في حذف الميثاق {CharterId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في حذف الميثاق" });
        }
    }

    /// <summary>
    /// الحصول على إحصائيات المواثيق حسب الحالة
    /// Get charter statistics by status
    /// </summary>
    [HttpGet("charters/statistics")]
    public async Task<IActionResult> GetCharterStatistics([FromQuery] int? year)
    {
        try
        {
            var fiscalYear = year ?? DateTime.UtcNow.Year;
            var statistics = await _charterService.GetCharterStatisticsByStatusAsync(fiscalYear);
            return Ok(new
            {
                FiscalYear = fiscalYear,
                Statistics = statistics,
                Total = statistics.Values.Sum()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع إحصائيات المواثيق");
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع الإحصائيات" });
        }
    }

    // ==========================================
    // Goals - الأهداف
    // ==========================================

    /// <summary>
    /// الحصول على جميع الأهداف
    /// Get all goals
    /// </summary>
    [HttpGet("goals")]
    public async Task<IActionResult> GetGoals([FromQuery] int? charterId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            // Enforce max page size to prevent excessive memory usage
            pageSize = Math.Clamp(pageSize, 1, 100);
            page = Math.Max(page, 1);

            IEnumerable<GoalDto> goals;
            if (charterId.HasValue)
            {
                goals = await _goalService.GetGoalsByCharterAsync(charterId.Value);
            }
            else
            {
                goals = await _goalService.GetAllGoalsAsync();
            }

            var goalList = goals.ToList();
            var totalCount = goalList.Count;
            var pagedGoals = goalList.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            return Ok(new
            {
                data = pagedGoals,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع الأهداف");
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// الحصول على هدف بالمعرف
    /// Get goal by ID
    /// </summary>
    [HttpGet("goals/{id}")]
    public async Task<IActionResult> GetGoal(int id)
    {
        try
        {
            var goal = await _goalService.GetGoalByIdAsync(id);
            if (goal == null)
            {
                return NotFound(new { Error = "الهدف غير موجود" });
            }
            return Ok(goal);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع الهدف {GoalId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// الحصول على أهداف موظف
    /// Get goals by employee
    /// </summary>
    [HttpGet("goals/employee/{employeeId}")]
    public async Task<IActionResult> GetGoalsByEmployee(int employeeId)
    {
        try
        {
            var goals = await _goalService.GetGoalsByEmployeeAsync(employeeId);
            return Ok(goals);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع أهداف الموظف {EmployeeId}", employeeId);
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// الحصول على أهداف ميثاق
    /// Get goals by charter
    /// </summary>
    [HttpGet("goals/charter/{charterId}")]
    public async Task<IActionResult> GetGoalsByCharter(int charterId)
    {
        try
        {
            var goals = await _goalService.GetGoalsByCharterAsync(charterId);
            return Ok(goals);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع أهداف الميثاق {CharterId}", charterId);
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// إنشاء هدف جديد
    /// Create new goal
    /// </summary>
    [HttpPost("goals")]
    public async Task<IActionResult> CreateGoal([FromBody] CreateGoalDto dto)
    {
        try
        {
            var goal = await _goalService.CreateGoalAsync(dto);
            return CreatedAtAction(nameof(GetGoal), new { id = goal.GoalId }, goal);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في إنشاء الهدف");
            return StatusCode(500, new { Error = "حدث خطأ في إنشاء الهدف" });
        }
    }

    /// <summary>
    /// تحديث هدف
    /// Update goal
    /// </summary>
    [HttpPut("goals/{id}")]
    public async Task<IActionResult> UpdateGoal(int id, [FromBody] CreateGoalDto dto)
    {
        try
        {
            var goal = await _goalService.UpdateGoalAsync(id, dto);
            return Ok(goal);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في تحديث الهدف {GoalId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في تحديث الهدف" });
        }
    }

    /// <summary>
    /// تحديث نسبة إنجاز الهدف
    /// Update goal progress
    /// </summary>
    [HttpPut("goals/{id}/progress")]
    public async Task<IActionResult> UpdateGoalProgress(int id, [FromBody] UpdateGoalProgressDto dto)
    {
        try
        {
            await _goalService.UpdateGoalProgressAsync(id, dto);
            return Ok(new { Message = "تم تحديث نسبة الإنجاز بنجاح" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في تحديث نسبة إنجاز الهدف {GoalId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في تحديث النسبة" });
        }
    }

    /// <summary>
    /// تقييم هدف
    /// Evaluate goal
    /// </summary>
    [HttpPost("goals/{id}/evaluate")]
    public async Task<IActionResult> EvaluateGoal(int id, [FromBody] EvaluateGoalDto dto)
    {
        try
        {
            await _goalService.EvaluateGoalAsync(id, dto);
            return Ok(new { Message = "تم تقييم الهدف بنجاح" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في تقييم الهدف {GoalId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في تقييم الهدف" });
        }
    }

    /// <summary>
    /// حذف هدف
    /// Delete goal
    /// </summary>
    [HttpDelete("goals/{id}")]
    public async Task<IActionResult> DeleteGoal(int id)
    {
        try
        {
            await _goalService.DeleteGoalAsync(id);
            return Ok(new { Message = "تم حذف الهدف بنجاح" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في حذف الهدف {GoalId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في حذف الهدف" });
        }
    }

    /// <summary>
    /// التحقق من صحة أوزان الأهداف
    /// Validate goal weights
    /// </summary>
    [HttpGet("goals/validate-weights/{charterId}")]
    public async Task<IActionResult> ValidateGoalWeights(int charterId)
    {
        try
        {
            var isValid = await _goalService.ValidateGoalWeightsAsync(charterId);
            return Ok(new
            {
                CharterId = charterId,
                IsValid = isValid,
                Message = isValid ? "أوزان الأهداف صحيحة (100%)" : "مجموع أوزان الأهداف لا يساوي 100%"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في التحقق من أوزان الأهداف للميثاق {CharterId}", charterId);
            return StatusCode(500, new { Error = "حدث خطأ في التحقق" });
        }
    }

    /// <summary>
    /// الحصول على إحصائيات الأهداف
    /// Get goal statistics
    /// </summary>
    [HttpGet("goals/statistics/{charterId}")]
    public async Task<IActionResult> GetGoalStatistics(int charterId)
    {
        try
        {
            var statistics = await _goalService.GetGoalStatisticsAsync(charterId);
            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع إحصائيات الأهداف للميثاق {CharterId}", charterId);
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع الإحصائيات" });
        }
    }

    // ==========================================
    // Evaluations - التقييمات
    // ==========================================

    /// <summary>
    /// الحصول على جميع التقييمات
    /// Get all evaluations
    /// </summary>
    [HttpGet("evaluations")]
    public async Task<IActionResult> GetEvaluations([FromQuery] int? year, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            // Enforce max page size to prevent excessive memory usage
            pageSize = Math.Clamp(pageSize, 1, 100);
            page = Math.Max(page, 1);

            var evaluations = await _evaluationService.GetAllEvaluationsAsync(year);
            var evaluationList = evaluations.ToList();
            var totalCount = evaluationList.Count;
            var pagedEvaluations = evaluationList.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            return Ok(new
            {
                data = pagedEvaluations,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع التقييمات");
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// الحصول على تقييم بالمعرف
    /// Get evaluation by ID
    /// </summary>
    [HttpGet("evaluations/{id}")]
    public async Task<IActionResult> GetEvaluation(int id)
    {
        try
        {
            var evaluation = await _evaluationService.GetEvaluationByIdAsync(id);
            if (evaluation == null)
            {
                return NotFound(new { Error = "التقييم غير موجود" });
            }
            return Ok(evaluation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع التقييم {EvaluationId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// الحصول على تقييمات موظف
    /// Get evaluations by employee
    /// </summary>
    [HttpGet("evaluations/employee/{employeeId}")]
    public async Task<IActionResult> GetEvaluationsByEmployee(int employeeId)
    {
        try
        {
            var evaluations = await _evaluationService.GetEvaluationsByEmployeeAsync(employeeId);
            return Ok(evaluations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع تقييمات الموظف {EmployeeId}", employeeId);
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// الحصول على التقييمات المعلقة
    /// Get pending evaluations
    /// </summary>
    [HttpGet("evaluations/pending")]
    public async Task<IActionResult> GetPendingEvaluations()
    {
        try
        {
            var evaluations = await _evaluationService.GetPendingEvaluationsAsync();
            return Ok(evaluations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع التقييمات المعلقة");
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// إنشاء تقييم جديد
    /// Create new evaluation
    /// </summary>
    [HttpPost("evaluations")]
    public async Task<IActionResult> CreateEvaluation([FromBody] CreateEvaluationDto dto)
    {
        try
        {
            var evaluation = await _evaluationService.CreateEvaluationAsync(dto);
            return CreatedAtAction(nameof(GetEvaluation), new { id = evaluation.EvaluationId }, evaluation);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في إنشاء التقييم");
            return StatusCode(500, new { Error = "حدث خطأ في إنشاء التقييم" });
        }
    }

    /// <summary>
    /// تحديث تقييم
    /// Update evaluation
    /// </summary>
    [HttpPut("evaluations/{id}")]
    public async Task<IActionResult> UpdateEvaluation(int id, [FromBody] UpdateEvaluationDto dto)
    {
        try
        {
            var evaluation = await _evaluationService.UpdateEvaluationAsync(id, dto);
            return Ok(evaluation);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في تحديث التقييم {EvaluationId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في تحديث التقييم" });
        }
    }

    /// <summary>
    /// تقديم تقييم للمراجعة
    /// Submit evaluation for review
    /// </summary>
    [HttpPost("evaluations/{id}/submit")]
    public async Task<IActionResult> SubmitEvaluation(int id)
    {
        try
        {
            await _evaluationService.SubmitEvaluationAsync(id);
            return Ok(new { Message = "تم تقديم التقييم للمراجعة بنجاح" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في تقديم التقييم {EvaluationId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في تقديم التقييم" });
        }
    }

    /// <summary>
    /// الموافقة على تقييم
    /// Approve evaluation
    /// </summary>
    [HttpPost("evaluations/{id}/approve")]
    public async Task<IActionResult> ApproveEvaluation(int id)
    {
        try
        {
            await _evaluationService.ApproveEvaluationAsync(id);
            return Ok(new { Message = "تمت الموافقة على التقييم بنجاح" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في الموافقة على التقييم {EvaluationId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في الموافقة" });
        }
    }

    /// <summary>
    /// رفض تقييم
    /// Reject evaluation
    /// </summary>
    [HttpPost("evaluations/{id}/reject")]
    public async Task<IActionResult> RejectEvaluation(int id, [FromBody] RejectEvaluationDto dto)
    {
        try
        {
            await _evaluationService.RejectEvaluationAsync(id, dto);
            return Ok(new { Message = "تم رفض التقييم" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في رفض التقييم {EvaluationId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في رفض التقييم" });
        }
    }

    /// <summary>
    /// حذف تقييم
    /// Delete evaluation
    /// </summary>
    [HttpDelete("evaluations/{id}")]
    public async Task<IActionResult> DeleteEvaluation(int id)
    {
        try
        {
            await _evaluationService.DeleteEvaluationAsync(id);
            return Ok(new { Message = "تم حذف التقييم بنجاح" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في حذف التقييم {EvaluationId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في حذف التقييم" });
        }
    }

    /// <summary>
    /// الحصول على إحصائيات التقييمات
    /// Get evaluation statistics
    /// </summary>
    [HttpGet("evaluations/statistics")]
    public async Task<IActionResult> GetEvaluationStatistics([FromQuery] int? year)
    {
        try
        {
            var fiscalYear = year ?? DateTime.UtcNow.Year;
            var statistics = await _evaluationService.GetEvaluationStatisticsAsync(fiscalYear);
            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع إحصائيات التقييمات");
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع الإحصائيات" });
        }
    }

    // ==========================================
    // Reviews - المراجعات الدورية
    // ==========================================

    /// <summary>
    /// الحصول على جميع المراجعات
    /// Get all reviews
    /// </summary>
    [HttpGet("reviews")]
    public async Task<IActionResult> GetReviews([FromQuery] string? period, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            // Enforce max page size to prevent excessive memory usage
            pageSize = Math.Clamp(pageSize, 1, 100);
            page = Math.Max(page, 1);

            var reviews = await _reviewService.GetAllReviewsAsync(period);
            var reviewList = reviews.ToList();
            var totalCount = reviewList.Count;
            var pagedReviews = reviewList.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            return Ok(new
            {
                data = pagedReviews,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع المراجعات");
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// الحصول على مراجعة بالمعرف
    /// Get review by ID
    /// </summary>
    [HttpGet("reviews/{id}")]
    public async Task<IActionResult> GetReview(int id)
    {
        try
        {
            var review = await _reviewService.GetReviewByIdAsync(id);
            if (review == null)
            {
                return NotFound(new { Error = "المراجعة غير موجودة" });
            }
            return Ok(review);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع المراجعة {ReviewId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// الحصول على مراجعات موظف
    /// Get reviews by employee
    /// </summary>
    [HttpGet("reviews/employee/{employeeId}")]
    public async Task<IActionResult> GetReviewsByEmployee(int employeeId)
    {
        try
        {
            var reviews = await _reviewService.GetReviewsByEmployeeAsync(employeeId);
            return Ok(reviews);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع مراجعات الموظف {EmployeeId}", employeeId);
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع البيانات" });
        }
    }

    /// <summary>
    /// إنشاء مراجعة جديدة
    /// Create new review
    /// </summary>
    [HttpPost("reviews")]
    public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto)
    {
        try
        {
            var review = await _reviewService.CreateReviewAsync(dto);
            return CreatedAtAction(nameof(GetReview), new { id = review.ReviewId }, review);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في إنشاء المراجعة");
            return StatusCode(500, new { Error = "حدث خطأ في إنشاء المراجعة" });
        }
    }

    /// <summary>
    /// تحديث مراجعة
    /// Update review
    /// </summary>
    [HttpPut("reviews/{id}")]
    public async Task<IActionResult> UpdateReview(int id, [FromBody] UpdateReviewDto dto)
    {
        try
        {
            var review = await _reviewService.UpdateReviewAsync(id, dto);
            return Ok(review);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في تحديث المراجعة {ReviewId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في تحديث المراجعة" });
        }
    }

    /// <summary>
    /// إكمال مراجعة
    /// Complete review
    /// </summary>
    [HttpPost("reviews/{id}/complete")]
    public async Task<IActionResult> CompleteReview(int id)
    {
        try
        {
            await _reviewService.CompleteReviewAsync(id);
            return Ok(new { Message = "تمت إكمال المراجعة بنجاح" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في إكمال المراجعة {ReviewId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في إكمال المراجعة" });
        }
    }

    /// <summary>
    /// حذف مراجعة
    /// Delete review
    /// </summary>
    [HttpDelete("reviews/{id}")]
    public async Task<IActionResult> DeleteReview(int id)
    {
        try
        {
            await _reviewService.DeleteReviewAsync(id);
            return Ok(new { Message = "تم حذف المراجعة بنجاح" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في حذف المراجعة {ReviewId}", id);
            return StatusCode(500, new { Error = "حدث خطأ في حذف المراجعة" });
        }
    }

    /// <summary>
    /// الحصول على إحصائيات المراجعات
    /// Get review statistics
    /// </summary>
    [HttpGet("reviews/statistics")]
    public async Task<IActionResult> GetReviewStatistics([FromQuery] string period)
    {
        try
        {
            var statistics = await _reviewService.GetReviewStatisticsAsync(period ?? $"Q4-{DateTime.UtcNow.Year}");
            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع إحصائيات المراجعات");
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع الإحصائيات" });
        }
    }

    // ==========================================
    // Reports - التقارير
    // ==========================================

    /// <summary>
    /// تقرير أداء موظف
    /// Employee performance report
    /// </summary>
    [HttpGet("reports/performance/{employeeId}")]
    public async Task<IActionResult> GetPerformanceReport(int employeeId, [FromQuery] int? year)
    {
        try
        {
            var fiscalYear = year ?? DateTime.UtcNow.Year;
            var charter = await _charterService.GetCharterByEmployeeAndYearAsync(employeeId, fiscalYear);
            var evaluations = await _evaluationService.GetEvaluationsByEmployeeAsync(employeeId);
            var reviews = await _reviewService.GetReviewsByEmployeeAsync(employeeId);

            return Ok(new
            {
                EmployeeId = employeeId,
                Year = fiscalYear,
                CurrentCharter = charter,
                Evaluations = evaluations.Where(e => e.Year == fiscalYear),
                Reviews = reviews.Where(r => r.Period.Contains(fiscalYear.ToString())),
                Summary = new
                {
                    AverageScore = evaluations.Where(e => e.Year == fiscalYear && e.FinalScore.HasValue)
                        .Select(e => e.FinalScore!.Value).DefaultIfEmpty(0m).Average(),
                    GoalsAchievement = charter?.GoalsScore,
                    CompetenciesScore = charter?.CompetenciesScore,
                    TotalScore = charter?.TotalScore
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع تقرير أداء الموظف {EmployeeId}", employeeId);
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع التقرير" });
        }
    }

    /// <summary>
    /// تقرير سنوي شامل
    /// Annual performance report
    /// </summary>
    [HttpGet("reports/annual")]
    public async Task<IActionResult> GetAnnualReport([FromQuery] int? year)
    {
        try
        {
            var fiscalYear = year ?? DateTime.UtcNow.Year;
            var charterStats = await _charterService.GetCharterStatisticsByStatusAsync(fiscalYear);
            var evaluationStats = await _evaluationService.GetEvaluationStatisticsAsync(fiscalYear);

            return Ok(new
            {
                Year = fiscalYear,
                CharterStatistics = charterStats,
                EvaluationStatistics = evaluationStats,
                Summary = new
                {
                    TotalCharters = charterStats.Values.Sum(),
                    CompletedCharters = charterStats.GetValueOrDefault("Completed", 0),
                    ActiveCharters = charterStats.GetValueOrDefault("Active", 0),
                    AverageScore = evaluationStats.GetValueOrDefault("AverageScore", 0m)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "خطأ في استرجاع التقرير السنوي");
            return StatusCode(500, new { Error = "حدث خطأ في استرجاع التقرير" });
        }
    }
}
