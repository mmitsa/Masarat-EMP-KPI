using Microsoft.AspNetCore.Mvc;
using System.Reflection;

namespace Masarat.Core.Controllers
{
    /// <summary>
    /// Health Check Controller - يستخدم للتحقق من صحة الخدمة
    /// يعمل مع Docker Health Checks و Kubernetes Probes
    /// </summary>
    [ApiController]
    [Route("api/core/[controller]")]
    public class HealthController : ControllerBase
    {
        /// <summary>
        /// التحقق من صحة الخدمة - Liveness Probe
        /// </summary>
        [HttpGet]
        public IActionResult Health()
        {
            return Ok(new
            {
                status = "Healthy",
                timestamp = DateTime.UtcNow,
                service = Assembly.GetEntryAssembly()?.GetName().Name ?? "Unknown"
            });
        }

        /// <summary>
        /// التحقق من جاهزية الخدمة - Readiness Probe
        /// </summary>
        [HttpGet("ready")]
        public IActionResult Ready()
        {
            // يمكن إضافة فحوصات إضافية هنا (قاعدة البيانات، Redis، إلخ)
            return Ok(new
            {
                status = "Ready",
                timestamp = DateTime.UtcNow
            });
        }

        /// <summary>
        /// التحقق من حيوية الخدمة - Liveness Probe
        /// </summary>
        [HttpGet("live")]
        public IActionResult Live()
        {
            return Ok(new
            {
                status = "Alive",
                timestamp = DateTime.UtcNow
            });
        }
    }
}
