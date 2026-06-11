using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Masarat.Core.Middleware
{
    /// <summary>
    /// Global Exception Handling Middleware
    /// Catches all unhandled exceptions and returns standardized error responses
    /// Logs all errors to centralized logging system (ELK)
    /// </summary>
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                // Continue with next middleware
                await _next(context);
            }
            catch (Exception ex)
            {
                // Log exception with full context
                _logger.LogError(ex, 
                    "Unhandled exception occurred. Path: {Path}, Method: {Method}, User: {User}",
                    context.Request.Path, 
                    context.Request.Method, 
                    context.User?.Identity?.Name ?? "Anonymous");

                // Handle the exception
                await HandleExceptionAsync(context, ex, _logger);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception, ILogger logger)
        {
            context.Response.ContentType = "application/json; charset=utf-8";

            var response = new ErrorResponse
            {
                Status = "error",
                Error = new ErrorDetail
                {
                    Code = GetErrorCode(exception),
                    Message = exception.Message,
                    Details = exception.InnerException?.Message ?? string.Empty
                },
                Timestamp = DateTime.UtcNow.ToString("O")
            };

            // Determine appropriate HTTP status code
            context.Response.StatusCode = GetStatusCode(exception);

            // Return JSON response with Unicode support (Arabic text not escaped)
            var jsonOptions = new JsonSerializerOptions
            {
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            };
            var json = JsonSerializer.Serialize(response, jsonOptions);
            return context.Response.WriteAsync(json, System.Text.Encoding.UTF8);
        }

        private static int GetStatusCode(Exception exception) =>
            exception switch
            {
                ArgumentNullException => StatusCodes.Status400BadRequest,
                ArgumentException => StatusCodes.Status400BadRequest,
                InvalidOperationException => StatusCodes.Status409Conflict,
                KeyNotFoundException => StatusCodes.Status404NotFound,
                UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
                TimeoutException => StatusCodes.Status504GatewayTimeout,
                _ => StatusCodes.Status500InternalServerError
            };

        private static string GetErrorCode(Exception exception) =>
            exception switch
            {
                ArgumentNullException => "VALIDATION_ERROR",
                ArgumentException => "VALIDATION_ERROR",
                InvalidOperationException => "CONFLICT",
                KeyNotFoundException => "NOT_FOUND",
                UnauthorizedAccessException => "UNAUTHORIZED",
                TimeoutException => "TIMEOUT",
                _ => "INTERNAL_SERVER_ERROR"
            };
    }

    /// <summary>
    /// Standard error response format for all APIs
    /// </summary>
    public class ErrorResponse
    {
        [System.Text.Json.Serialization.JsonPropertyName("status")]
        public string Status { get; set; } = "error";

        [System.Text.Json.Serialization.JsonPropertyName("error")]
        public ErrorDetail Error { get; set; } = new();

        [System.Text.Json.Serialization.JsonPropertyName("timestamp")]
        public string Timestamp { get; set; } = DateTime.UtcNow.ToString("O");
    }

    /// <summary>
    /// Detailed error information
    /// </summary>
    public class ErrorDetail
    {
        [System.Text.Json.Serialization.JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("details")]
        public string Details { get; set; } = string.Empty;
    }
}
