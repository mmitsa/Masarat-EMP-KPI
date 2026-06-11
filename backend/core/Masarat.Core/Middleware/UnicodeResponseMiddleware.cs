using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace Masarat.Core.Middleware
{
    /// <summary>
    /// Middleware يضمن ترميز UTF-8 في كل استجابات JSON
    /// يُضاف تلقائياً عبر UseObservability() لكل الخدمات
    ///
    /// المشكلة: بعض الخدمات ترسل Content-Type: application/json بدون charset
    /// مما يسبب مشاكل في عرض النصوص العربية في بعض المتصفحات والعملاء
    ///
    /// الحل: هذا الـ middleware يضيف charset=utf-8 تلقائياً لكل استجابات JSON
    /// </summary>
    public class UnicodeResponseMiddleware
    {
        private readonly RequestDelegate _next;

        public UnicodeResponseMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // إضافة charset=utf-8 لكل استجابات JSON قبل إرسالها
            context.Response.OnStarting(() =>
            {
                var contentType = context.Response.ContentType;
                if (!string.IsNullOrEmpty(contentType))
                {
                    // إضافة charset فقط لاستجابات JSON التي لا تحتوي عليه
                    if (contentType.Contains("application/json") && !contentType.Contains("charset"))
                    {
                        context.Response.ContentType = contentType + "; charset=utf-8";
                    }
                    // نفس الشيء لـ text/json و text/plain
                    else if ((contentType.Contains("text/json") || contentType.Contains("text/plain"))
                             && !contentType.Contains("charset"))
                    {
                        context.Response.ContentType = contentType + "; charset=utf-8";
                    }
                }
                return Task.CompletedTask;
            });

            await _next(context);
        }
    }
}
