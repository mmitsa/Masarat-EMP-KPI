using Masarat.EPM.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Masarat.EPM.API.Controllers;

[ApiController]
[Route("api/epm/integrations/hr")]
public class EmployeeIntegrationController : ControllerBase
{
    private readonly IEmployeeIntegrationService _employeeIntegrationService;
    private readonly ILogger<EmployeeIntegrationController> _logger;

    public EmployeeIntegrationController(
        IEmployeeIntegrationService employeeIntegrationService,
        ILogger<EmployeeIntegrationController> logger)
    {
        _employeeIntegrationService = employeeIntegrationService;
        _logger = logger;
    }

    /// <summary>
    /// قراءة الموظفين المحفوظين محلياً من آخر مزامنة مع نظام الموارد البشرية.
    /// </summary>
    [HttpGet("employees")]
    [AllowAnonymous]
    public async Task<IActionResult> GetEmployees(
        [FromQuery] string? search,
        [FromQuery] bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var employees = await _employeeIntegrationService.GetEmployeesAsync(search, activeOnly, cancellationToken);
        return Ok(new
        {
            data = employees,
            totalCount = employees.Count,
            source = "EPM.EmployeeSnapshots"
        });
    }

    /// <summary>
    /// قراءة موظف واحد حسب معرفه في نظام الموارد البشرية.
    /// </summary>
    [HttpGet("employees/{sourceEmployeeId:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetEmployee(int sourceEmployeeId, CancellationToken cancellationToken = default)
    {
        var employee = await _employeeIntegrationService.GetEmployeeBySourceIdAsync(sourceEmployeeId, cancellationToken);
        return employee == null ? NotFound(new { error = "الموظف غير موجود في نسخة الربط المحلية" }) : Ok(employee);
    }

    /// <summary>
    /// تشغيل مزامنة فورية من نظام الموارد البشرية الخارجي إلى قاعدة EPM PostgreSQL.
    /// </summary>
    [HttpPost("sync")]
    [AllowAnonymous]
    public async Task<IActionResult> Sync(CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _employeeIntegrationService.SyncFromHrAsync(cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "فشلت مزامنة موظفي HR مع EPM");
            return StatusCode(502, new
            {
                error = "فشلت مزامنة بيانات الموظفين من نظام الموارد البشرية",
                details = ex.Message
            });
        }
    }
}
