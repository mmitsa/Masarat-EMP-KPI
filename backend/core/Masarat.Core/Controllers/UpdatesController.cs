using Microsoft.AspNetCore.Mvc;

namespace Masarat.Core.Controllers;

/// <summary>
/// متحكم التحديثات - Version Manifest للتحديثات التلقائية
/// </summary>
[ApiController]
[Route("api/core/[controller]")]
public class UpdatesController : ControllerBase
{
    /// <summary>
    /// جلب manifest الإصدار الحالي
    /// </summary>
    [HttpGet("manifest")]
    public ActionResult GetManifest()
    {
        // TODO: Read from configuration or database
        return Ok(new UpdateManifest
        {
            CurrentVersion = "1.0.0",
            BuildNumber = 100,
            ReleaseDate = DateTimeOffset.UtcNow,
            MinSupportedVersion = "1.0.0",
            ForceUpdate = false,
            Changelog = new Dictionary<string, string>
            {
                ["ar"] = "الإصدار الأول - دعم العمل بدون اتصال",
                ["en"] = "First release - Offline support"
            },
            Assets = new UpdateAssets
            {
                Web = new AssetInfo { Version = "1.0.0", Checksum = "" },
                Mobile = new AssetInfo { Version = "1.0.0", Checksum = "" }
            }
        });
    }

    /// <summary>
    /// جلب manifest التحديث للتطبيق المحمول (متوافق مع expo-updates)
    /// </summary>
    [HttpGet("mobile-manifest")]
    public ActionResult GetMobileManifest()
    {
        return Ok(new
        {
            id = Guid.NewGuid().ToString(),
            createdAt = DateTimeOffset.UtcNow,
            runtimeVersion = "1.0.0",
            launchAsset = new
            {
                key = "bundle",
                contentType = "application/javascript",
                url = $"{Request.Scheme}://{Request.Host}/api/core/updates/mobile-bundle/latest"
            },
            assets = Array.Empty<object>(),
            metadata = new { }
        });
    }
}

public class UpdateManifest
{
    public string CurrentVersion { get; set; } = string.Empty;
    public int BuildNumber { get; set; }
    public DateTimeOffset ReleaseDate { get; set; }
    public string MinSupportedVersion { get; set; } = string.Empty;
    public bool ForceUpdate { get; set; }
    public Dictionary<string, string> Changelog { get; set; } = new();
    public UpdateAssets Assets { get; set; } = new();
}

public class UpdateAssets
{
    public AssetInfo Web { get; set; } = new();
    public AssetInfo Mobile { get; set; } = new();
}

public class AssetInfo
{
    public string Version { get; set; } = string.Empty;
    public string? BundleUrl { get; set; }
    public string Checksum { get; set; } = string.Empty;
}
