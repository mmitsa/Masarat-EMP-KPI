using System;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.Extensions.Logging;
using Masarat.Core.MultiTenancy;
using Masarat.Events.Contracts;

namespace Masarat.Core.Messaging
{
    /// <summary>
    /// MassTransit filter that sets tenant context for all event consumers
    /// </summary>
    public class TenantContextConsumerFilter<T> : IFilter<ConsumeContext<T>>
        where T : class, IEvent
    {
        private readonly ITenantContext _tenantContext;
        private readonly ITenantResolver _tenantResolver;
        private readonly ILogger<TenantContextConsumerFilter<T>> _logger;

        public TenantContextConsumerFilter(
            ITenantContext tenantContext,
            ITenantResolver tenantResolver,
            ILogger<TenantContextConsumerFilter<T>> logger)
        {
            _tenantContext = tenantContext;
            _tenantResolver = tenantResolver;
            _logger = logger;
        }

        public async Task Send(ConsumeContext<T> context, IPipe<ConsumeContext<T>> next)
        {
            var message = context.Message;
            long? processedTenantId = null;
            
            try
            {
                // Extract TenantId from the event
                long? tenantId = null;
                
                if (message is DomainEvent domainEvent)
                {
                    tenantId = domainEvent.TenantId;
                }
                else
                {
                    // Fallback: try to get TenantId via reflection for events implementing IEvent
                    // but not inheriting DomainEvent (e.g., cross-module integration events)
                    var tenantIdProp = message.GetType().GetProperty("TenantId");
                    if (tenantIdProp != null)
                    {
                        var val = tenantIdProp.GetValue(message);
                        if (val is long l)
                            tenantId = l;
                        else if (val is int i)
                            tenantId = i;
                    }
                }

                if (tenantId.HasValue)
                {
                    processedTenantId = tenantId.Value;
                    
                    _logger.LogInformation(
                        "Setting tenant context for consumer - TenantId: {TenantId}, Event: {EventType}",
                        tenantId.Value, typeof(T).Name);

                    var tenantInfo = await _tenantResolver.ResolveByIdAsync(tenantId.Value);
                    
                    if (tenantInfo == null)
                    {
                        _logger.LogError(
                            "Invalid tenant ID in event - TenantId: {TenantId}, Event: {EventType}",
                            tenantId.Value, typeof(T).Name);
                        
                        throw new InvalidOperationException(
                            $"Cannot process event for invalid tenant: {tenantId.Value}. Event: {typeof(T).Name}");
                    }

                    if (!tenantInfo.IsActive)
                    {
                        _logger.LogWarning(
                            "Skipping event for inactive tenant - TenantId: {TenantId}, Event: {EventType}",
                            tenantId.Value, typeof(T).Name);
                        return;
                    }

                    _tenantContext.SetTenant(tenantInfo);
                    
                    _logger.LogDebug(
                        "Tenant context set - Tenant: {TenantName} (ID: {TenantId})",
                        tenantInfo.Name, tenantInfo.Id);
                }
                else
                {
                    _logger.LogWarning(
                        "Event has no TenantId property - EventType: {EventType}. Processing without tenant context.",
                        typeof(T).Name);
                }

                await next.Send(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error processing event with tenant context - Event: {EventType}, Message: {Message}",
                    typeof(T).Name, ex.Message);
                throw;
            }
            finally
            {
                if (_tenantContext.TenantId != null)
                {
                    _tenantContext.ClearTenant();
                }
            }
        }

        public void Probe(ProbeContext context)
        {
            context.CreateFilterScope("tenantContext");
        }
    }

    /// <summary>
    /// Extension methods for configuring tenant context filter in MassTransit
    /// </summary>
    public static class TenantContextConsumerFilterExtensions
    {
        /// <summary>
        /// Adds tenant context filter to all consumers
        /// </summary>
        public static void UseTenantContextFilter(
            this IReceiveEndpointConfigurator configurator,
            IRegistrationContext context)
        {
            configurator.UseConsumeFilter(typeof(TenantContextConsumerFilter<>), context);
        }
    }
}