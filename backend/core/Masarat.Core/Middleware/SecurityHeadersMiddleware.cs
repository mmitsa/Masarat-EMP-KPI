using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Masarat.Core.Middleware;

/// <summary>
/// Middleware لإضافة رؤوس الأمان لجميع الاستجابات
/// Adds security headers to all HTTP responses for defense-in-depth protection.
/// Should be placed early in the middleware pipeline, before response-generating middleware.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityHeadersMiddleware> _logger;
    private readonly SecurityHeadersOptions _options;
    private readonly bool _isProduction;

    public SecurityHeadersMiddleware(
        RequestDelegate next,
        ILogger<SecurityHeadersMiddleware> logger,
        IHostEnvironment environment,
        SecurityHeadersOptions? options = null)
    {
        _next = next;
        _logger = logger;
        _options = options ?? new SecurityHeadersOptions();
        _isProduction = environment.IsProduction();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;

            // Prevent MIME type sniffing
            headers.TryAdd("X-Content-Type-Options", _options.ContentTypeOptions);

            // Prevent clickjacking
            headers.TryAdd("X-Frame-Options", _options.FrameOptions);

            // XSS Protection - Modern approach: set to "0" and rely on CSP instead.
            // The X-XSS-Protection header can introduce vulnerabilities in older browsers.
            headers.TryAdd("X-XSS-Protection", _options.XssProtection);

            // Referrer Policy - Controls how much referrer information is sent
            headers.TryAdd("Referrer-Policy", _options.ReferrerPolicy);

            // Content Security Policy - Restricts resource loading origins
            if (!string.IsNullOrEmpty(_options.ContentSecurityPolicy))
            {
                headers.TryAdd("Content-Security-Policy", _options.ContentSecurityPolicy);
            }

            // Permissions Policy - Restricts browser feature access
            if (!string.IsNullOrEmpty(_options.PermissionsPolicy))
            {
                headers.TryAdd("Permissions-Policy", _options.PermissionsPolicy);
            }

            // HSTS - Only in production to avoid issues with local development
            if (_isProduction && _options.EnableHsts)
            {
                headers.TryAdd("Strict-Transport-Security", _options.StrictTransportSecurity);
            }

            // Remove server identification header to reduce information leakage
            if (_options.RemoveServerHeader)
            {
                headers.Remove("Server");
                headers.Remove("X-Powered-By");
            }

            return Task.CompletedTask;
        });

        await _next(context);
    }
}

/// <summary>
/// خيارات رؤوس الأمان - قابلة للتخصيص حسب كل خدمة
/// Security headers options - customizable per service
/// </summary>
public class SecurityHeadersOptions
{
    /// <summary>Prevent MIME type sniffing. Default: "nosniff"</summary>
    public string ContentTypeOptions { get; set; } = "nosniff";

    /// <summary>Prevent clickjacking. Default: "DENY"</summary>
    public string FrameOptions { get; set; } = "DENY";

    /// <summary>XSS Protection. Default: "0" (modern approach: rely on CSP)</summary>
    public string XssProtection { get; set; } = "0";

    /// <summary>Referrer policy. Default: "strict-origin-when-cross-origin"</summary>
    public string ReferrerPolicy { get; set; } = "strict-origin-when-cross-origin";

    /// <summary>Content Security Policy. Default: basic self-only policy</summary>
    public string ContentSecurityPolicy { get; set; } =
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'";

    /// <summary>Permissions Policy. Default: restrict camera, mic, geolocation</summary>
    public string PermissionsPolicy { get; set; } =
        "camera=(), microphone=(), geolocation=()";

    /// <summary>Enable HSTS header (only applied in production). Default: true</summary>
    public bool EnableHsts { get; set; } = true;

    /// <summary>HSTS value. Default: max-age=31536000 (1 year) with includeSubDomains</summary>
    public string StrictTransportSecurity { get; set; } =
        "max-age=31536000; includeSubDomains";

    /// <summary>Remove Server and X-Powered-By headers. Default: true</summary>
    public bool RemoveServerHeader { get; set; } = true;
}

/// <summary>
/// Extension methods لإضافة واستخدام Security Headers Middleware
/// </summary>
public static class SecurityHeadersExtensions
{
    /// <summary>
    /// إضافة Security Headers لجميع الاستجابات
    /// Add security headers to all responses.
    /// Place early in the middleware pipeline, before UseRouting/UseAuthentication.
    /// </summary>
    /// <example>
    /// <code>
    /// // Basic usage with default options
    /// app.UseSecurityHeaders();
    ///
    /// // Custom options
    /// app.UseSecurityHeaders(options =>
    /// {
    ///     options.FrameOptions = "SAMEORIGIN";
    ///     options.ContentSecurityPolicy = "default-src 'self'; img-src 'self' https://cdn.masarat.sa";
    /// });
    /// </code>
    /// </example>
    public static IApplicationBuilder UseSecurityHeaders(
        this IApplicationBuilder app,
        Action<SecurityHeadersOptions>? configure = null)
    {
        var options = new SecurityHeadersOptions();
        configure?.Invoke(options);
        return app.UseMiddleware<SecurityHeadersMiddleware>(options);
    }
}
