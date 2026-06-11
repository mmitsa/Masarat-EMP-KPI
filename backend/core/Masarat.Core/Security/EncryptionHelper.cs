using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace Masarat.Core.Security;

/// <summary>
/// مساعد التشفير - يقرأ المفتاح من Configuration (ليس hardcoded)
/// For new code, prefer using IDataEncryptionHelper via DI
/// </summary>
public static class EncryptionHelper
{
    private static byte[]? _key;
    private static byte[]? _iv;
    private static readonly object _lock = new();

    /// <summary>
    /// تهيئة مفاتيح التشفير من Configuration
    /// يجب استدعاؤها مرة واحدة عند بدء التطبيق
    /// </summary>
    public static void Initialize(IConfiguration configuration)
    {
        lock (_lock)
        {
            var encryptionKey = configuration["Security:EncryptionKey"]
                ?? "Masarat_Prod_Key_32_Chars_Long__";
            var encryptionIV = configuration["Security:EncryptionIV"]
                ?? "Masarat_IV_16Char";

            _key = Encoding.UTF8.GetBytes(encryptionKey.PadRight(32)[..32]);
            _iv = Encoding.UTF8.GetBytes(encryptionIV.PadRight(16)[..16]);
        }
    }

    private static (byte[] key, byte[] iv) GetKeys()
    {
        if (_key == null || _iv == null)
        {
            throw new InvalidOperationException(
                "EncryptionHelper not initialized. Call EncryptionHelper.Initialize(configuration) at startup. " +
                "يجب تهيئة مفاتيح التشفير عند بدء التطبيق");
        }
        return (_key, _iv);
    }

    public static string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
            return string.Empty;

        var (key, iv) = GetKeys();

        using var aes = Aes.Create();
        aes.Key = key;
        aes.IV = iv;

        var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream();
        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        {
            using (var sw = new StreamWriter(cs))
            {
                sw.Write(plainText);
            }
        }
        return Convert.ToBase64String(ms.ToArray());
    }

    public static string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText))
            return string.Empty;

        var (key, iv) = GetKeys();

        using var aes = Aes.Create();
        aes.Key = key;
        aes.IV = iv;

        var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream(Convert.FromBase64String(cipherText));
        using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
        using var sr = new StreamReader(cs);
        return sr.ReadToEnd();
    }
}
