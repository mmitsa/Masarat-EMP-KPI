using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace Masarat.Core.Security;

/// <summary>
/// مساعد تشفير البيانات الحساسة
/// Data Encryption Helper for Sensitive Data
/// </summary>
public interface IDataEncryptionHelper
{
    string Encrypt(string plainText);
    string Decrypt(string cipherText);
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
    string MaskSensitiveData(string data, int visibleChars = 4);
}

public class DataEncryptionHelper : IDataEncryptionHelper
{
    private readonly byte[] _key;
    private readonly byte[] _iv;

    public DataEncryptionHelper(IConfiguration configuration)
    {
        var encryptionKey = configuration["Security:EncryptionKey"]
            ?? throw new InvalidOperationException(
                "Security:EncryptionKey must be configured. " +
                "Set it in appsettings.json or environment variables. " +
                "يجب تعيين مفتاح التشفير في الإعدادات");
        var encryptionIV = configuration["Security:EncryptionIV"]
            ?? throw new InvalidOperationException(
                "Security:EncryptionIV must be configured. " +
                "Set it in appsettings.json or environment variables. " +
                "يجب تعيين متجه التهيئة في الإعدادات");

        _key = Encoding.UTF8.GetBytes(encryptionKey.PadRight(32).Substring(0, 32));
        _iv = Encoding.UTF8.GetBytes(encryptionIV.PadRight(16).Substring(0, 16));
    }

    /// <summary>
    /// تشفير النص
    /// Encrypt plain text
    /// </summary>
    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
            return string.Empty;

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = _iv;

        var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);

        using var msEncrypt = new MemoryStream();
        using var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write);
        using (var swEncrypt = new StreamWriter(csEncrypt))
        {
            swEncrypt.Write(plainText);
        }

        return Convert.ToBase64String(msEncrypt.ToArray());
    }

    /// <summary>
    /// فك تشفير النص
    /// Decrypt cipher text
    /// </summary>
    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText))
            return string.Empty;

        try
        {
            var cipherBytes = Convert.FromBase64String(cipherText);

            using var aes = Aes.Create();
            aes.Key = _key;
            aes.IV = _iv;

            var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);

            using var msDecrypt = new MemoryStream(cipherBytes);
            using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
            using var srDecrypt = new StreamReader(csDecrypt);

            return srDecrypt.ReadToEnd();
        }
        catch
        {
            return string.Empty;
        }
    }

    /// <summary>
    /// تجزئة كلمة المرور (Hash)
    /// Hash password using PBKDF2
    /// </summary>
    public string HashPassword(string password)
    {
        if (string.IsNullOrEmpty(password))
            return string.Empty;

        using var rng = RandomNumberGenerator.Create();
        var salt = new byte[16];
        rng.GetBytes(salt);

        using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100000, HashAlgorithmName.SHA256);
        var hash = pbkdf2.GetBytes(32);

        var hashBytes = new byte[48];
        Array.Copy(salt, 0, hashBytes, 0, 16);
        Array.Copy(hash, 0, hashBytes, 16, 32);

        return Convert.ToBase64String(hashBytes);
    }

    /// <summary>
    /// التحقق من كلمة المرور
    /// Verify password against hash
    /// </summary>
    public bool VerifyPassword(string password, string hash)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(hash))
            return false;

        try
        {
            var hashBytes = Convert.FromBase64String(hash);

            var salt = new byte[16];
            Array.Copy(hashBytes, 0, salt, 0, 16);

            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100000, HashAlgorithmName.SHA256);
            var computedHash = pbkdf2.GetBytes(32);

            for (int i = 0; i < 32; i++)
            {
                if (hashBytes[i + 16] != computedHash[i])
                    return false;
            }

            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// إخفاء البيانات الحساسة (Masking)
    /// Mask sensitive data
    /// </summary>
    public string MaskSensitiveData(string data, int visibleChars = 4)
    {
        if (string.IsNullOrEmpty(data) || data.Length <= visibleChars)
            return data;

        var masked = new string('*', data.Length - visibleChars);
        return masked + data.Substring(data.Length - visibleChars);
    }
}

/// <summary>
/// Value Converter للتشفير التلقائي في EF Core
/// Automatic encryption value converter for EF Core
/// </summary>
public class EncryptedStringConverter : Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<string, string>
{
    public EncryptedStringConverter(IDataEncryptionHelper encryptionHelper)
        : base(
            v => encryptionHelper.Encrypt(v),
            v => encryptionHelper.Decrypt(v))
    {
    }
}

/// <summary>
/// Attribute لتحديد الحقول المشفرة
/// Attribute to mark encrypted fields
/// </summary>
[AttributeUsage(AttributeTargets.Property)]
public class EncryptedAttribute : Attribute
{
}

/// <summary>
/// Extension methods لتكوين التشفير
/// </summary>
public static class EncryptionExtensions
{
    /// <summary>
    /// تكوين التشفير التلقائي للحقول المشفرة
    /// Configure automatic encryption for encrypted fields
    /// </summary>
    public static Microsoft.EntityFrameworkCore.ModelBuilder UseEncryption(
        this Microsoft.EntityFrameworkCore.ModelBuilder modelBuilder,
        IDataEncryptionHelper encryptionHelper)
    {
        var converter = new EncryptedStringConverter(encryptionHelper);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                var propertyInfo = property.PropertyInfo;
                if (propertyInfo != null &&
                    Attribute.IsDefined(propertyInfo, typeof(EncryptedAttribute)))
                {
                    property.SetValueConverter(converter);
                }
            }
        }

        return modelBuilder;
    }
}
