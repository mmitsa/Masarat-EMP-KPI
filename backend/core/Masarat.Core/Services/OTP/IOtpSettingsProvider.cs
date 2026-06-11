using System.Threading.Tasks;
using Masarat.Core.Services.SMS;

namespace Masarat.Core.Services.OTP;

/// <summary>
/// مزوّد إعدادات OTP الديناميكي - يقرأ من قاعدة البيانات
/// Dynamic OTP Settings Provider - reads from database
/// </summary>
public interface IOtpSettingsProvider
{
    /// <summary>
    /// جلب إعدادات سلوك OTP (طول الرمز، الصلاحية، المحاولات...)
    /// </summary>
    Task<OtpSettings> GetOtpSettingsAsync();

    /// <summary>
    /// جلب إعدادات مزود SMS (المزود، المفتاح، المرسل...)
    /// </summary>
    Task<SmsSettings> GetSmsSettingsAsync();

    /// <summary>
    /// هل نظام OTP مفعّل على مستوى المنصة؟
    /// </summary>
    Task<bool> IsOtpActiveAsync();

    /// <summary>
    /// إبطال الكاش عند تحديث الإعدادات من صفحة الإدارة
    /// </summary>
    Task InvalidateCacheAsync();
}
