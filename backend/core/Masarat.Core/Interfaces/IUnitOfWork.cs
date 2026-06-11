namespace Masarat.Core.Interfaces;

public interface IUnitOfWork : IDisposable
{
    Task<int> CompleteAsync();
}
