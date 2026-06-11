using Microsoft.AspNetCore.Http;
using System.Security.Cryptography;
using System.Text;

namespace Masarat.Core.Middleware;

/// <summary>
/// Middleware لإضافة ETag و Last-Modified لاستجابات GET
/// يدعم Conditional Requests (304 Not Modified)
/// </summary>
public class CacheHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public CacheHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Method != HttpMethods.Get)
        {
            await _next(context);
            return;
        }

        // Capture response body
        var originalBodyStream = context.Response.Body;
        using var memoryStream = new MemoryStream();
        context.Response.Body = memoryStream;

        await _next(context);

        memoryStream.Position = 0;
        var responseBody = await new StreamReader(memoryStream).ReadToEndAsync();

        if (context.Response.StatusCode == 200 && !string.IsNullOrEmpty(responseBody))
        {
            // Generate ETag from response content
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(responseBody));
            var etag = $"\"{Convert.ToBase64String(hash)[..16]}\"";

            // Check If-None-Match
            var ifNoneMatch = context.Request.Headers.IfNoneMatch.ToString();
            if (!string.IsNullOrEmpty(ifNoneMatch) && ifNoneMatch == etag)
            {
                context.Response.StatusCode = 304;
                context.Response.Body = originalBodyStream;
                return;
            }

            context.Response.Headers.ETag = etag;
            context.Response.Headers["Last-Modified"] = DateTime.UtcNow.ToString("R");
            context.Response.Headers["Cache-Control"] = "private, max-age=0, must-revalidate";
        }

        // Write back to original stream
        memoryStream.Position = 0;
        context.Response.Body = originalBodyStream;
        await memoryStream.CopyToAsync(originalBodyStream);
    }
}
