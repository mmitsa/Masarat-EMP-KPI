using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Masarat.Core.Services;

/// <summary>
/// خدمة البريد الإلكتروني المتكاملة
/// Integrated Email Service for all notifications
/// </summary>
public interface IEmailService
{
    Task<bool> SendEmailAsync(string to, string subject, string body, bool isHtml = true);
    Task<bool> SendEmailAsync(string to, string subject, string templateName, Dictionary<string, string> placeholders, string language = "ar");
    Task<bool> SendBulkEmailAsync(List<string> recipients, string subject, string body, bool isHtml = true);

    // Subscription-specific emails
    Task<bool> SendTrialRequestConfirmationAsync(string email, string organizationName, string contactName, string language = "ar");
    Task<bool> SendTrialApprovedAsync(string email, string organizationName, string contactName, DateTime trialEndDate, string loginUrl, string language = "ar");
    Task<bool> SendTrialRejectedAsync(string email, string organizationName, string contactName, string reason, string language = "ar");
    Task<bool> SendTrialExpiringWarningAsync(string email, string organizationName, int daysRemaining, string upgradeUrl, string language = "ar");
    Task<bool> SendTrialExpiredAsync(string email, string organizationName, string upgradeUrl, string language = "ar");
    Task<bool> SendSubscriptionActivatedAsync(string email, string organizationName, string planName, DateTime expiryDate, string language = "ar");
    Task<bool> SendSubscriptionRenewalReminderAsync(string email, string organizationName, int daysRemaining, decimal amount, string language = "ar");
    Task<bool> SendSubscriptionExpiredAsync(string email, string organizationName, string renewUrl, string language = "ar");
    Task<bool> SendPaymentReceiptAsync(string email, string organizationName, string invoiceNumber, decimal amount, DateTime paymentDate, string language = "ar");
    Task<bool> SendInvoiceAsync(string email, string organizationName, string invoiceNumber, decimal amount, DateTime dueDate, string paymentUrl, string language = "ar");
    Task<bool> SendContactRequestConfirmationAsync(string email, string fullName, string subject, string language = "ar");
    Task<bool> SendWelcomeEmailAsync(string email, string fullName, string organizationName, string loginUrl, string language = "ar");
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly EmailSettings _settings;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;

        _settings = new EmailSettings
        {
            SmtpServer = configuration["Email:SmtpServer"] ?? "smtp.gmail.com",
            SmtpPort = int.Parse(configuration["Email:SmtpPort"] ?? "587"),
            SmtpUsername = configuration["Email:SmtpUsername"] ?? "",
            SmtpPassword = configuration["Email:SmtpPassword"] ?? "",
            FromEmail = configuration["Email:FromEmail"] ?? "noreply@masarat.sa",
            FromName = configuration["Email:FromName"] ?? "منصة مسارات",
            EnableSsl = bool.Parse(configuration["Email:EnableSsl"] ?? "true"),
            IsEnabled = bool.Parse(configuration["Email:IsEnabled"] ?? "true"),
            BaseUrl = configuration["Email:BaseUrl"] ?? "https://masarat.sa"
        };
    }

    public async Task<bool> SendEmailAsync(string to, string subject, string body, bool isHtml = true)
    {
        if (!_settings.IsEnabled)
        {
            _logger.LogWarning("Email service is disabled. Email to {To} not sent.", to);
            return true; // Return true to not block the flow
        }

        try
        {
            using var client = new SmtpClient(_settings.SmtpServer, _settings.SmtpPort)
            {
                Credentials = new NetworkCredential(_settings.SmtpUsername, _settings.SmtpPassword),
                EnableSsl = _settings.EnableSsl
            };

            var message = new MailMessage
            {
                From = new MailAddress(_settings.FromEmail, _settings.FromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml
            };
            message.To.Add(to);

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent successfully to {To}", to);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
            return false;
        }
    }

    public async Task<bool> SendEmailAsync(string to, string subject, string templateName, Dictionary<string, string> placeholders, string language = "ar")
    {
        var template = GetTemplate(templateName, language);

        foreach (var placeholder in placeholders)
        {
            template = template.Replace($"{{{{{placeholder.Key}}}}}", placeholder.Value);
        }

        return await SendEmailAsync(to, subject, template, true);
    }

    public async Task<bool> SendBulkEmailAsync(List<string> recipients, string subject, string body, bool isHtml = true)
    {
        var results = new List<bool>();
        foreach (var recipient in recipients)
        {
            var result = await SendEmailAsync(recipient, subject, body, isHtml);
            results.Add(result);
        }
        return results.TrueForAll(r => r);
    }

    #region Subscription Emails

    public async Task<bool> SendTrialRequestConfirmationAsync(string email, string organizationName, string contactName, string language = "ar")
    {
        var subject = language == "ar"
            ? "تم استلام طلب التجربة المجانية - منصة مسارات"
            : "Free Trial Request Received - Masarat Platform";

        var placeholders = new Dictionary<string, string>
        {
            { "ContactName", contactName },
            { "OrganizationName", organizationName },
            { "BaseUrl", _settings.BaseUrl }
        };

        return await SendEmailAsync(email, subject, "trial_request_confirmation", placeholders, language);
    }

    public async Task<bool> SendTrialApprovedAsync(string email, string organizationName, string contactName, DateTime trialEndDate, string loginUrl, string language = "ar")
    {
        var subject = language == "ar"
            ? "تمت الموافقة على طلب التجربة المجانية - منصة مسارات"
            : "Free Trial Request Approved - Masarat Platform";

        var placeholders = new Dictionary<string, string>
        {
            { "ContactName", contactName },
            { "OrganizationName", organizationName },
            { "TrialEndDate", trialEndDate.ToString("yyyy-MM-dd") },
            { "DaysRemaining", ((trialEndDate - DateTime.Now).Days).ToString() },
            { "LoginUrl", loginUrl },
            { "BaseUrl", _settings.BaseUrl }
        };

        return await SendEmailAsync(email, subject, "trial_approved", placeholders, language);
    }

    public async Task<bool> SendTrialRejectedAsync(string email, string organizationName, string contactName, string reason, string language = "ar")
    {
        var subject = language == "ar"
            ? "بخصوص طلب التجربة المجانية - منصة مسارات"
            : "Regarding Your Free Trial Request - Masarat Platform";

        var placeholders = new Dictionary<string, string>
        {
            { "ContactName", contactName },
            { "OrganizationName", organizationName },
            { "Reason", reason },
            { "ContactEmail", _settings.FromEmail },
            { "BaseUrl", _settings.BaseUrl }
        };

        return await SendEmailAsync(email, subject, "trial_rejected", placeholders, language);
    }

    public async Task<bool> SendTrialExpiringWarningAsync(string email, string organizationName, int daysRemaining, string upgradeUrl, string language = "ar")
    {
        var subject = language == "ar"
            ? $"تنبيه: تبقى {daysRemaining} أيام على انتهاء التجربة المجانية"
            : $"Warning: {daysRemaining} days left in your free trial";

        var placeholders = new Dictionary<string, string>
        {
            { "OrganizationName", organizationName },
            { "DaysRemaining", daysRemaining.ToString() },
            { "UpgradeUrl", upgradeUrl },
            { "BaseUrl", _settings.BaseUrl }
        };

        return await SendEmailAsync(email, subject, "trial_expiring_warning", placeholders, language);
    }

    public async Task<bool> SendTrialExpiredAsync(string email, string organizationName, string upgradeUrl, string language = "ar")
    {
        var subject = language == "ar"
            ? "انتهت فترة التجربة المجانية - منصة مسارات"
            : "Free Trial Expired - Masarat Platform";

        var placeholders = new Dictionary<string, string>
        {
            { "OrganizationName", organizationName },
            { "UpgradeUrl", upgradeUrl },
            { "BaseUrl", _settings.BaseUrl }
        };

        return await SendEmailAsync(email, subject, "trial_expired", placeholders, language);
    }

    public async Task<bool> SendSubscriptionActivatedAsync(string email, string organizationName, string planName, DateTime expiryDate, string language = "ar")
    {
        var subject = language == "ar"
            ? "تم تفعيل اشتراكك بنجاح - منصة مسارات"
            : "Subscription Activated Successfully - Masarat Platform";

        var placeholders = new Dictionary<string, string>
        {
            { "OrganizationName", organizationName },
            { "PlanName", planName },
            { "ExpiryDate", expiryDate.ToString("yyyy-MM-dd") },
            { "BaseUrl", _settings.BaseUrl }
        };

        return await SendEmailAsync(email, subject, "subscription_activated", placeholders, language);
    }

    public async Task<bool> SendSubscriptionRenewalReminderAsync(string email, string organizationName, int daysRemaining, decimal amount, string language = "ar")
    {
        var subject = language == "ar"
            ? $"تذكير: تجديد الاشتراك خلال {daysRemaining} أيام"
            : $"Reminder: Subscription renewal in {daysRemaining} days";

        var placeholders = new Dictionary<string, string>
        {
            { "OrganizationName", organizationName },
            { "DaysRemaining", daysRemaining.ToString() },
            { "Amount", amount.ToString("N2") },
            { "Currency", "ريال" },
            { "BaseUrl", _settings.BaseUrl }
        };

        return await SendEmailAsync(email, subject, "subscription_renewal_reminder", placeholders, language);
    }

    public async Task<bool> SendSubscriptionExpiredAsync(string email, string organizationName, string renewUrl, string language = "ar")
    {
        var subject = language == "ar"
            ? "انتهى اشتراكك - منصة مسارات"
            : "Subscription Expired - Masarat Platform";

        var placeholders = new Dictionary<string, string>
        {
            { "OrganizationName", organizationName },
            { "RenewUrl", renewUrl },
            { "BaseUrl", _settings.BaseUrl }
        };

        return await SendEmailAsync(email, subject, "subscription_expired", placeholders, language);
    }

    public async Task<bool> SendPaymentReceiptAsync(string email, string organizationName, string invoiceNumber, decimal amount, DateTime paymentDate, string language = "ar")
    {
        var subject = language == "ar"
            ? $"إيصال الدفع رقم {invoiceNumber} - منصة مسارات"
            : $"Payment Receipt #{invoiceNumber} - Masarat Platform";

        var placeholders = new Dictionary<string, string>
        {
            { "OrganizationName", organizationName },
            { "InvoiceNumber", invoiceNumber },
            { "Amount", amount.ToString("N2") },
            { "Currency", "ريال" },
            { "PaymentDate", paymentDate.ToString("yyyy-MM-dd HH:mm") },
            { "BaseUrl", _settings.BaseUrl }
        };

        return await SendEmailAsync(email, subject, "payment_receipt", placeholders, language);
    }

    public async Task<bool> SendInvoiceAsync(string email, string organizationName, string invoiceNumber, decimal amount, DateTime dueDate, string paymentUrl, string language = "ar")
    {
        var subject = language == "ar"
            ? $"فاتورة رقم {invoiceNumber} - منصة مسارات"
            : $"Invoice #{invoiceNumber} - Masarat Platform";

        var placeholders = new Dictionary<string, string>
        {
            { "OrganizationName", organizationName },
            { "InvoiceNumber", invoiceNumber },
            { "Amount", amount.ToString("N2") },
            { "Currency", "ريال" },
            { "DueDate", dueDate.ToString("yyyy-MM-dd") },
            { "PaymentUrl", paymentUrl },
            { "BaseUrl", _settings.BaseUrl }
        };

        return await SendEmailAsync(email, subject, "invoice", placeholders, language);
    }

    public async Task<bool> SendContactRequestConfirmationAsync(string email, string fullName, string subject, string language = "ar")
    {
        var emailSubject = language == "ar"
            ? "تم استلام رسالتك - منصة مسارات"
            : "Message Received - Masarat Platform";

        var placeholders = new Dictionary<string, string>
        {
            { "FullName", fullName },
            { "Subject", subject },
            { "BaseUrl", _settings.BaseUrl }
        };

        return await SendEmailAsync(email, emailSubject, "contact_request_confirmation", placeholders, language);
    }

    public async Task<bool> SendWelcomeEmailAsync(string email, string fullName, string organizationName, string loginUrl, string language = "ar")
    {
        var subject = language == "ar"
            ? "مرحباً بك في منصة مسارات"
            : "Welcome to Masarat Platform";

        var placeholders = new Dictionary<string, string>
        {
            { "FullName", fullName },
            { "OrganizationName", organizationName },
            { "LoginUrl", loginUrl },
            { "BaseUrl", _settings.BaseUrl }
        };

        return await SendEmailAsync(email, subject, "welcome", placeholders, language);
    }

    #endregion

    #region Email Templates

    private string GetTemplate(string templateName, string language)
    {
        var templates = GetEmailTemplates();
        var key = $"{templateName}_{language}";

        if (templates.TryGetValue(key, out var template))
        {
            return template;
        }

        // Fallback to Arabic if template not found
        key = $"{templateName}_ar";
        if (templates.TryGetValue(key, out template))
        {
            return template;
        }

        return GetDefaultTemplate(language);
    }

    private Dictionary<string, string> GetEmailTemplates()
    {
        return new Dictionary<string, string>
        {
            #region Arabic Templates

            ["trial_request_confirmation_ar"] = @"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .content h2 { color: #1d4ed8; margin-top: 0; }
        .highlight { background: #eff6ff; border-right: 4px solid #1d4ed8; padding: 15px; margin: 20px 0; border-radius: 8px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        .btn { display: inline-block; background: #1d4ed8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>منصة مسارات</h1>
        </div>
        <div class='content'>
            <h2>مرحباً {{ContactName}} 👋</h2>
            <p>شكراً لاهتمامك بمنصة مسارات!</p>
            <p>تم استلام طلب التجربة المجانية الخاص بمنشأة <strong>{{OrganizationName}}</strong> بنجاح.</p>

            <div class='highlight'>
                <strong>ماذا بعد؟</strong>
                <ul>
                    <li>سيقوم فريقنا بمراجعة طلبك خلال 24 ساعة عمل</li>
                    <li>ستتلقى إشعاراً بالبريد الإلكتروني فور الموافقة</li>
                    <li>مدة التجربة المجانية: 14 يوم</li>
                </ul>
            </div>

            <p>في حال وجود أي استفسار، لا تتردد في التواصل معنا.</p>
        </div>
        <div class='footer'>
            <p>© 2026 منصة مسارات - جميع الحقوق محفوظة</p>
            <p>{{BaseUrl}}</p>
        </div>
    </div>
</body>
</html>",

            ["trial_approved_ar"] = @"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .content h2 { color: #10b981; margin-top: 0; }
        .highlight { background: #ecfdf5; border-right: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 8px; }
        .info-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .info-row:last-child { border-bottom: none; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        .btn { display: inline-block; background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-size: 16px; font-weight: bold; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎉 تمت الموافقة على طلبك!</h1>
        </div>
        <div class='content'>
            <h2>مرحباً {{ContactName}}</h2>
            <p>يسعدنا إبلاغك بأنه تمت الموافقة على طلب التجربة المجانية لمنشأة <strong>{{OrganizationName}}</strong>.</p>

            <div class='highlight'>
                <strong>✅ حسابك جاهز للاستخدام!</strong>
            </div>

            <div class='info-box'>
                <div class='info-row'>
                    <span>تاريخ انتهاء التجربة:</span>
                    <strong>{{TrialEndDate}}</strong>
                </div>
                <div class='info-row'>
                    <span>الأيام المتبقية:</span>
                    <strong>{{DaysRemaining}} يوم</strong>
                </div>
            </div>

            <p style='text-align: center;'>
                <a href='{{LoginUrl}}' class='btn'>تسجيل الدخول الآن</a>
            </p>

            <p>استمتع بتجربة جميع مزايا المنصة بدون أي قيود خلال فترة التجربة.</p>
        </div>
        <div class='footer'>
            <p>© 2026 منصة مسارات - جميع الحقوق محفوظة</p>
            <p>{{BaseUrl}}</p>
        </div>
    </div>
</body>
</html>",

            ["trial_expiring_warning_ar"] = @"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .content h2 { color: #f59e0b; margin-top: 0; }
        .warning-box { background: #fffbeb; border-right: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .days-counter { font-size: 48px; font-weight: bold; color: #f59e0b; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        .btn { display: inline-block; background: #f59e0b; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-size: 16px; font-weight: bold; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>⚠️ تنبيه: قرب انتهاء التجربة</h1>
        </div>
        <div class='content'>
            <h2>عزيزنا في {{OrganizationName}}</h2>

            <div class='warning-box'>
                <p>تبقى على انتهاء تجربتك المجانية</p>
                <div class='days-counter'>{{DaysRemaining}}</div>
                <p>أيام فقط</p>
            </div>

            <p>لا تفوت الفرصة! قم بترقية حسابك الآن للاستمرار في الاستفادة من جميع مزايا المنصة.</p>

            <p style='text-align: center;'>
                <a href='{{UpgradeUrl}}' class='btn'>ترقية الحساب الآن</a>
            </p>

            <p><strong>مميزات الاشتراك:</strong></p>
            <ul>
                <li>الوصول الكامل لجميع الوحدات</li>
                <li>دعم فني على مدار الساعة</li>
                <li>تحديثات مجانية</li>
                <li>نسخ احتياطي تلقائي</li>
            </ul>
        </div>
        <div class='footer'>
            <p>© 2026 منصة مسارات - جميع الحقوق محفوظة</p>
            <p>{{BaseUrl}}</p>
        </div>
    </div>
</body>
</html>",

            ["trial_expired_ar"] = @"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .content h2 { color: #ef4444; margin-top: 0; }
        .expired-box { background: #fef2f2; border-right: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        .btn { display: inline-block; background: #1d4ed8; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-size: 16px; font-weight: bold; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>انتهت فترة التجربة المجانية</h1>
        </div>
        <div class='content'>
            <h2>عزيزنا في {{OrganizationName}}</h2>

            <div class='expired-box'>
                <p>للأسف، انتهت فترة التجربة المجانية الخاصة بكم.</p>
                <p>لكن لا تقلق! بياناتك محفوظة بأمان ويمكنك استعادة الوصول الكامل فوراً.</p>
            </div>

            <p><strong>اختر الخطة المناسبة لمنشأتك:</strong></p>
            <ul>
                <li><strong>الخطة الأساسية:</strong> 500 ريال/شهر</li>
                <li><strong>الخطة الاحترافية:</strong> 1,500 ريال/شهر (الأكثر شيوعاً)</li>
                <li><strong>الخطة المؤسسية:</strong> 3,000 ريال/شهر</li>
            </ul>

            <p style='text-align: center;'>
                <a href='{{UpgradeUrl}}' class='btn'>اشترك الآن</a>
            </p>

            <p>خصم 17% عند الاشتراك السنوي!</p>
        </div>
        <div class='footer'>
            <p>© 2026 منصة مسارات - جميع الحقوق محفوظة</p>
            <p>{{BaseUrl}}</p>
        </div>
    </div>
</body>
</html>",

            ["subscription_activated_ar"] = @"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .success-icon { text-align: center; font-size: 64px; margin: 20px 0; }
        .info-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
        .info-row:last-child { border-bottom: none; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>تم تفعيل اشتراكك بنجاح! 🎉</h1>
        </div>
        <div class='content'>
            <div class='success-icon'>✅</div>
            <h2 style='text-align: center; color: #10b981;'>مرحباً بك في منصة مسارات</h2>

            <div class='info-box'>
                <div class='info-row'>
                    <span>المنشأة:</span>
                    <strong>{{OrganizationName}}</strong>
                </div>
                <div class='info-row'>
                    <span>الخطة:</span>
                    <strong>{{PlanName}}</strong>
                </div>
                <div class='info-row'>
                    <span>صالح حتى:</span>
                    <strong>{{ExpiryDate}}</strong>
                </div>
            </div>

            <p>يمكنك الآن الاستفادة من جميع مزايا المنصة. شكراً لثقتك بنا!</p>
        </div>
        <div class='footer'>
            <p>© 2026 منصة مسارات - جميع الحقوق محفوظة</p>
            <p>{{BaseUrl}}</p>
        </div>
    </div>
</body>
</html>",

            ["payment_receipt_ar"] = @"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .receipt-box { border: 2px dashed #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
        .receipt-row:last-child { border-bottom: none; }
        .total-row { font-size: 20px; font-weight: bold; color: #10b981; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>إيصال الدفع</h1>
        </div>
        <div class='content'>
            <h2>شكراً لك! تم استلام الدفعة بنجاح ✅</h2>

            <div class='receipt-box'>
                <div class='receipt-row'>
                    <span>رقم الفاتورة:</span>
                    <strong>{{InvoiceNumber}}</strong>
                </div>
                <div class='receipt-row'>
                    <span>المنشأة:</span>
                    <strong>{{OrganizationName}}</strong>
                </div>
                <div class='receipt-row'>
                    <span>تاريخ الدفع:</span>
                    <strong>{{PaymentDate}}</strong>
                </div>
                <div class='receipt-row total-row'>
                    <span>المبلغ المدفوع:</span>
                    <strong>{{Amount}} {{Currency}}</strong>
                </div>
            </div>

            <p>تم إضافة هذا الإيصال إلى سجلاتك. يمكنك تحميله من لوحة التحكم.</p>
        </div>
        <div class='footer'>
            <p>© 2026 منصة مسارات - جميع الحقوق محفوظة</p>
            <p>{{BaseUrl}}</p>
        </div>
    </div>
</body>
</html>",

            ["invoice_ar"] = @"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .invoice-box { border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .invoice-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
        .invoice-row:last-child { border-bottom: none; }
        .total-row { font-size: 20px; font-weight: bold; color: #1d4ed8; }
        .due-date { background: #fef3c7; padding: 10px; border-radius: 8px; text-align: center; color: #92400e; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        .btn { display: inline-block; background: #1d4ed8; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-size: 16px; font-weight: bold; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>فاتورة جديدة</h1>
        </div>
        <div class='content'>
            <h2>فاتورة رقم: {{InvoiceNumber}}</h2>

            <div class='invoice-box'>
                <div class='invoice-row'>
                    <span>المنشأة:</span>
                    <strong>{{OrganizationName}}</strong>
                </div>
                <div class='invoice-row total-row'>
                    <span>المبلغ المستحق:</span>
                    <strong>{{Amount}} {{Currency}}</strong>
                </div>
            </div>

            <div class='due-date'>
                <strong>تاريخ الاستحقاق: {{DueDate}}</strong>
            </div>

            <p style='text-align: center;'>
                <a href='{{PaymentUrl}}' class='btn'>ادفع الآن عبر سداد</a>
            </p>
        </div>
        <div class='footer'>
            <p>© 2026 منصة مسارات - جميع الحقوق محفوظة</p>
            <p>{{BaseUrl}}</p>
        </div>
    </div>
</body>
</html>",

            ["contact_request_confirmation_ar"] = @"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>تم استلام رسالتك</h1>
        </div>
        <div class='content'>
            <h2>مرحباً {{FullName}} 👋</h2>
            <p>شكراً لتواصلك معنا!</p>
            <p>تم استلام رسالتك بخصوص: <strong>{{Subject}}</strong></p>
            <p>سيقوم فريقنا بالرد عليك في أقرب وقت ممكن.</p>
        </div>
        <div class='footer'>
            <p>© 2026 منصة مسارات - جميع الحقوق محفوظة</p>
            <p>{{BaseUrl}}</p>
        </div>
    </div>
</body>
</html>",

            ["welcome_ar"] = @"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%); color: white; padding: 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        .btn { display: inline-block; background: #1d4ed8; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-size: 16px; font-weight: bold; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎉 مرحباً بك في منصة مسارات!</h1>
        </div>
        <div class='content'>
            <h2>أهلاً {{FullName}}</h2>
            <p>نحن سعداء بانضمامك إلى منصة مسارات.</p>
            <p>منشأتك <strong>{{OrganizationName}}</strong> جاهزة الآن للاستخدام.</p>

            <p style='text-align: center;'>
                <a href='{{LoginUrl}}' class='btn'>ابدأ الآن</a>
            </p>

            <p>إذا كان لديك أي استفسار، فريق الدعم جاهز لمساعدتك.</p>
        </div>
        <div class='footer'>
            <p>© 2026 منصة مسارات - جميع الحقوق محفوظة</p>
            <p>{{BaseUrl}}</p>
        </div>
    </div>
</body>
</html>",

            #endregion

            #region English Templates

            ["trial_request_confirmation_en"] = @"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .content h2 { color: #1d4ed8; margin-top: 0; }
        .highlight { background: #eff6ff; border-left: 4px solid #1d4ed8; padding: 15px; margin: 20px 0; border-radius: 8px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Masarat Platform</h1>
        </div>
        <div class='content'>
            <h2>Hello {{ContactName}} 👋</h2>
            <p>Thank you for your interest in Masarat Platform!</p>
            <p>Your free trial request for <strong>{{OrganizationName}}</strong> has been received successfully.</p>

            <div class='highlight'>
                <strong>What's Next?</strong>
                <ul>
                    <li>Our team will review your request within 24 business hours</li>
                    <li>You'll receive an email notification once approved</li>
                    <li>Free trial duration: 14 days</li>
                </ul>
            </div>

            <p>If you have any questions, feel free to contact us.</p>
        </div>
        <div class='footer'>
            <p>© 2026 Masarat Platform - All Rights Reserved</p>
            <p>{{BaseUrl}}</p>
        </div>
    </div>
</body>
</html>",

            ["trial_approved_en"] = @"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .info-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        .btn { display: inline-block; background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-size: 16px; font-weight: bold; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎉 Your Request is Approved!</h1>
        </div>
        <div class='content'>
            <h2>Hello {{ContactName}}</h2>
            <p>Great news! Your free trial request for <strong>{{OrganizationName}}</strong> has been approved.</p>

            <div class='info-box'>
                <div class='info-row'>
                    <span>Trial Ends:</span>
                    <strong>{{TrialEndDate}}</strong>
                </div>
                <div class='info-row'>
                    <span>Days Remaining:</span>
                    <strong>{{DaysRemaining}} days</strong>
                </div>
            </div>

            <p style='text-align: center;'>
                <a href='{{LoginUrl}}' class='btn'>Login Now</a>
            </p>
        </div>
        <div class='footer'>
            <p>© 2026 Masarat Platform - All Rights Reserved</p>
        </div>
    </div>
</body>
</html>"

            #endregion
        };
    }

    private string GetDefaultTemplate(string language)
    {
        if (language == "ar")
        {
            return @"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head><meta charset='UTF-8'></head>
<body style='font-family: Arial, sans-serif; direction: rtl;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <h2>منصة مسارات</h2>
        <p>{{Content}}</p>
        <p>© 2026 منصة مسارات</p>
    </div>
</body>
</html>";
        }

        return @"
<!DOCTYPE html>
<html lang='en'>
<head><meta charset='UTF-8'></head>
<body style='font-family: Arial, sans-serif;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <h2>Masarat Platform</h2>
        <p>{{Content}}</p>
        <p>© 2026 Masarat Platform</p>
    </div>
</body>
</html>";
    }

    #endregion
}

public class EmailSettings
{
    public string SmtpServer { get; set; } = "smtp.gmail.com";
    public int SmtpPort { get; set; } = 587;
    public string SmtpUsername { get; set; } = "";
    public string SmtpPassword { get; set; } = "";
    public string FromEmail { get; set; } = "noreply@masarat.sa";
    public string FromName { get; set; } = "منصة مسارات";
    public bool EnableSsl { get; set; } = true;
    public bool IsEnabled { get; set; } = true;
    public string BaseUrl { get; set; } = "https://masarat.sa";
}
