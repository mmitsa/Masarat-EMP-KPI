using Microsoft.Extensions.Logging;

namespace Masarat.Core.Services;

public abstract class BaseService<T>
{
    protected readonly ILogger<T> _logger;
    
    /// <summary>
    /// Alias for _logger to support both naming conventions
    /// </summary>
    protected ILogger<T> Logger => _logger;

    protected BaseService(ILogger<T> logger)
    {
        _logger = logger;
    }
}
