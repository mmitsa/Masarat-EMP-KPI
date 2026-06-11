using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using Masarat.Core.Middleware;

namespace Masarat.Core.Extensions
{
    /// <summary>
    /// Extension methods لضمان ترميز Unicode/العربية الصحيح في كل الخدمات
    ///
    /// المشكلة: System.Text.Json يحوّل الأحرف العربية إلى \uXXXX بشكل افتراضي
    /// مثال: "عبدالرحمن" تصبح "\u0639\u0628\u062F\u0627\u0644\u0631\u062D\u0645\u0646"
    ///
    /// الحل: استخدام UnsafeRelaxedJsonEscaping الذي يبقي Unicode كما هو
    /// </summary>
    public static class UnicodeJsonExtensions
    {
        /// <summary>
        /// JsonSerializerOptions مشتركة مع دعم Unicode كامل
        /// يمكن استخدامها مع JsonSerializer.Serialize مباشرة
        /// </summary>
        public static readonly JsonSerializerOptions UnicodeJsonOptions = new()
        {
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            WriteIndented = false,
        };

        /// <summary>
        /// إضافة ترميز Unicode للـ JSON serialization
        /// يمنع تحويل الأحرف العربية إلى \uXXXX
        ///
        /// الاستخدام في Program.cs:
        /// builder.Services.AddControllers().AddUnicodeJsonOptions();
        /// </summary>
        public static IMvcBuilder AddUnicodeJsonOptions(this IMvcBuilder builder)
        {
            return builder.AddJsonOptions(options =>
            {
                // منع escape للأحرف العربية والـ Unicode
                options.JsonSerializerOptions.Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
                options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });
        }

        /// <summary>
        /// إضافة middleware يضمن charset=utf-8 لكل استجابات JSON
        ///
        /// الاستخدام في Program.cs:
        /// app.UseUnicodeResponses();
        /// </summary>
        public static IApplicationBuilder UseUnicodeResponses(this IApplicationBuilder app)
        {
            return app.UseMiddleware<UnicodeResponseMiddleware>();
        }
    }
}
