using System;
using System.Data;
using System.Data.Common;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using Masarat.Core.MultiTenancy;

namespace Masarat.Core.Database
{
    /// <summary>
    /// DbConnection interceptor that sets tenant context in SQL Server session
    /// SECURITY: Prevents connection pooling pollution between tenants
    ///
    /// Uses SQL Server SESSION_CONTEXT with sp_set_session_context for RLS:
    /// 1. Sets TenantId in SESSION_CONTEXT on connection open
    /// 2. Clears TenantId on connection close
    /// 3. Prevents cross-tenant data access via connection reuse
    /// </summary>
    public class TenantConnectionInterceptor : DbConnectionInterceptor
    {
        private readonly ITenantContext _tenantContext;
        private readonly ILogger<TenantConnectionInterceptor> _logger;

        public TenantConnectionInterceptor(
            ITenantContext tenantContext,
            ILogger<TenantConnectionInterceptor> logger)
        {
            _tenantContext = tenantContext;
            _logger = logger;
        }

        public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
        {
            SetTenantContextInDatabase(connection);
            base.ConnectionOpened(connection, eventData);
        }

        public override async Task ConnectionOpenedAsync(
            DbConnection connection,
            ConnectionEndEventData eventData,
            CancellationToken cancellationToken = default)
        {
            await SetTenantContextInDatabaseAsync(connection, cancellationToken);
            await base.ConnectionOpenedAsync(connection, eventData, cancellationToken);
        }

        public override void ConnectionClosed(DbConnection connection, ConnectionEndEventData eventData)
        {
            ResetTenantContextInDatabase(connection);
            base.ConnectionClosed(connection, eventData);
        }

        public override async Task ConnectionClosedAsync(DbConnection connection, ConnectionEndEventData eventData)
        {
            await ResetTenantContextInDatabaseAsync(connection);
            await base.ConnectionClosedAsync(connection, eventData);
        }

        private void SetTenantContextInDatabase(DbConnection connection)
        {
            var tenantId = _tenantContext.TenantId;

            if (tenantId == null)
            {
                _logger.LogWarning(
                    "SECURITY WARNING: Database connection opened without tenant context. " +
                    "This may allow unrestricted data access.");
                return;
            }

            try
            {
                using var command = connection.CreateCommand();
                command.CommandText = "EXEC sp_set_session_context @key = N'TenantId', @value = @TenantId";
                var param = command.CreateParameter();
                param.ParameterName = "@TenantId";
                param.Value = tenantId;
                param.DbType = DbType.Int64;
                command.Parameters.Add(param);
                command.ExecuteNonQuery();

                _logger.LogDebug(
                    "Tenant context set in SQL Server SESSION_CONTEXT - TenantId: {TenantId}, ConnectionId: {ConnectionId}",
                    tenantId, connection.GetHashCode());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to set tenant context in database - TenantId: {TenantId}",
                    tenantId);
            }
        }

        private async Task SetTenantContextInDatabaseAsync(
            DbConnection connection,
            CancellationToken cancellationToken)
        {
            var tenantId = _tenantContext.TenantId;

            if (tenantId == null)
            {
                _logger.LogWarning(
                    "SECURITY WARNING: Database connection opened without tenant context. " +
                    "This may allow unrestricted data access.");
                return;
            }

            try
            {
                using var command = connection.CreateCommand();
                command.CommandText = "EXEC sp_set_session_context @key = N'TenantId', @value = @TenantId";
                var param = command.CreateParameter();
                param.ParameterName = "@TenantId";
                param.Value = tenantId;
                param.DbType = DbType.Int64;
                command.Parameters.Add(param);
                await command.ExecuteNonQueryAsync(cancellationToken);

                _logger.LogDebug(
                    "Tenant context set in SQL Server SESSION_CONTEXT - TenantId: {TenantId}, ConnectionId: {ConnectionId}",
                    tenantId, connection.GetHashCode());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to set tenant context in database - TenantId: {TenantId}",
                    tenantId);
            }
        }

        private void ResetTenantContextInDatabase(DbConnection connection)
        {
            // Connection is already closed when ConnectionClosed is called - skip reset
            if (connection.State != ConnectionState.Open)
            {
                _logger.LogTrace(
                    "Skipping tenant context reset - connection already closed. ConnectionId: {ConnectionId}, State: {State}",
                    connection.GetHashCode(), connection.State);
                return;
            }

            try
            {
                using var command = connection.CreateCommand();
                command.CommandText = "EXEC sp_set_session_context @key = N'TenantId', @value = NULL";
                command.ExecuteNonQuery();

                _logger.LogTrace(
                    "Tenant context reset in SQL Server SESSION_CONTEXT - ConnectionId: {ConnectionId}",
                    connection.GetHashCode());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to reset tenant context in database - ConnectionId: {ConnectionId}",
                    connection.GetHashCode());
            }
        }

        private async Task ResetTenantContextInDatabaseAsync(DbConnection connection)
        {
            // Connection is already closed when ConnectionClosedAsync is called - skip reset
            if (connection.State != ConnectionState.Open)
            {
                _logger.LogTrace(
                    "Skipping tenant context reset - connection already closed. ConnectionId: {ConnectionId}, State: {State}",
                    connection.GetHashCode(), connection.State);
                return;
            }

            try
            {
                using var command = connection.CreateCommand();
                command.CommandText = "EXEC sp_set_session_context @key = N'TenantId', @value = NULL";
                await command.ExecuteNonQueryAsync();

                _logger.LogTrace(
                    "Tenant context reset in SQL Server SESSION_CONTEXT - ConnectionId: {ConnectionId}",
                    connection.GetHashCode());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to reset tenant context in database - ConnectionId: {ConnectionId}",
                    connection.GetHashCode());
            }
        }
    }
}
