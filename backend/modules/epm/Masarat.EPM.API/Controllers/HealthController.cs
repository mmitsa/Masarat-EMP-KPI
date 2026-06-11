using Masarat.Core.Health;
using Masarat.EPM.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;

namespace Masarat.EPM.API.Controllers
{
    /// <summary>
    /// Health Check Controller for EPM API
    /// فحص صحة خدمة إدارة الأداء
    /// </summary>
    public class HealthController : BaseHealthController<EPMDbContext>
    {
        public HealthController(EPMDbContext context)
            : base(context, "EPM API")
        {
        }
    }
}
