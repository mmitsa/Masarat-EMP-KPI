/**
 * lib/password-utils.js - أدوات إدارة كلمات المرور
 *
 * يوفر:
 * 1. توليد كلمة مرور عشوائية آمنة
 * 2. تشفير كلمة المرور بصيغة ASP.NET Identity V3 (PBKDF2)
 *    متوافق مع identity-db.js الذي يتحقق من نفس الصيغة
 *
 * صيغة الهاش:
 *   Byte 0:     0x01 (V3 marker)
 *   Bytes 1-4:  PRF algorithm (big-endian uint32): 1=SHA256
 *   Bytes 5-8:  Iteration count (big-endian uint32): 100000
 *   Bytes 9-12: Salt length (big-endian uint32): 16
 *   Bytes 13-28: Salt (16 bytes)
 *   Bytes 29-60: Derived key (32 bytes)
 *   Total: 61 bytes → Base64 encoded
 */

import crypto from 'crypto';

// ═══════════════════════════════════════════════════════
// ثوابت التشفير
// ═══════════════════════════════════════════════════════

const PBKDF2_ALGORITHM = 'sha256';
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_SALT_LENGTH = 16;    // 16 bytes
const PBKDF2_SUBKEY_LENGTH = 32;  // 32 bytes
const PBKDF2_PRF = 1;             // 1 = SHA256 in ASP.NET Identity

// ═══════════════════════════════════════════════════════
// توليد كلمة مرور عشوائية آمنة
// ═══════════════════════════════════════════════════════

/**
 * توليد كلمة مرور عشوائية تستوفي سياسة المنصة
 * - 14 حرف (أكثر من الحد الأدنى 12)
 * - حروف كبيرة وصغيرة وأرقام ورموز خاصة
 * - سهلة القراءة (بدون أحرف متشابهة مثل 0/O, 1/l/I)
 *
 * @returns {string} كلمة المرور العشوائية
 */
export function generateSecurePassword() {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';  // بدون I, O
    const lower = 'abcdefghjkmnpqrstuvwxyz';    // بدون i, l, o
    const digits = '23456789';                    // بدون 0, 1
    const special = '@#$%&*!?+=';

    // ضمان وجود حرف واحد على الأقل من كل نوع
    const password = [
        upper[crypto.randomInt(upper.length)],
        upper[crypto.randomInt(upper.length)],
        lower[crypto.randomInt(lower.length)],
        lower[crypto.randomInt(lower.length)],
        lower[crypto.randomInt(lower.length)],
        digits[crypto.randomInt(digits.length)],
        digits[crypto.randomInt(digits.length)],
        digits[crypto.randomInt(digits.length)],
        special[crypto.randomInt(special.length)],
        special[crypto.randomInt(special.length)],
    ];

    // إضافة أحرف عشوائية إضافية للوصول لـ 14 حرف
    const allChars = upper + lower + digits + special;
    while (password.length < 14) {
        password.push(allChars[crypto.randomInt(allChars.length)]);
    }

    // خلط الأحرف عشوائياً (Fisher-Yates shuffle)
    for (let i = password.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join('');
}

// ═══════════════════════════════════════════════════════
// تشفير كلمة المرور بصيغة ASP.NET Identity V3
// ═══════════════════════════════════════════════════════

/**
 * تشفير كلمة المرور بصيغة ASP.NET Identity V3 (PBKDF2-SHA256)
 * الناتج متوافق مع IdentityServer و identity-db.js
 *
 * @param {string} password - كلمة المرور الأصلية
 * @returns {string} الهاش بصيغة Base64
 */
export function hashPasswordPBKDF2(password) {
    // توليد salt عشوائي
    const salt = crypto.randomBytes(PBKDF2_SALT_LENGTH);

    // اشتقاق المفتاح
    const subkey = crypto.pbkdf2Sync(
        password,
        salt,
        PBKDF2_ITERATIONS,
        PBKDF2_SUBKEY_LENGTH,
        PBKDF2_ALGORITHM
    );

    // بناء البنية الثنائية (ASP.NET Identity V3)
    const output = Buffer.alloc(13 + PBKDF2_SALT_LENGTH + PBKDF2_SUBKEY_LENGTH);

    // Byte 0: Version marker (V3 = 0x01)
    output[0] = 0x01;

    // Bytes 1-4: PRF algorithm (big-endian)
    output.writeUInt32BE(PBKDF2_PRF, 1);

    // Bytes 5-8: Iteration count (big-endian)
    output.writeUInt32BE(PBKDF2_ITERATIONS, 5);

    // Bytes 9-12: Salt length (big-endian)
    output.writeUInt32BE(PBKDF2_SALT_LENGTH, 9);

    // Bytes 13+: Salt
    salt.copy(output, 13);

    // Bytes 13+saltLen+: Subkey
    subkey.copy(output, 13 + PBKDF2_SALT_LENGTH);

    return output.toString('base64');
}

/**
 * التحقق من كلمة المرور مقابل هاش PBKDF2 (ASP.NET Identity V3)
 *
 * @param {string} hashedPassword - الهاش المخزن (Base64)
 * @param {string} providedPassword - كلمة المرور المقدمة
 * @returns {boolean} صحيح إذا تطابقت
 */
export function verifyPasswordPBKDF2(hashedPassword, providedPassword) {
    try {
        const decoded = Buffer.from(hashedPassword, 'base64');
        if (decoded.length < 13) return false;

        const formatMarker = decoded[0];

        if (formatMarker === 0x01) {
            // V3 format
            const prf = decoded.readUInt32BE(1);
            const algorithm = prf === 1 ? 'sha256' : prf === 2 ? 'sha512' : 'sha1';
            const iterations = decoded.readUInt32BE(5);
            const saltLength = decoded.readUInt32BE(9);
            const salt = decoded.subarray(13, 13 + saltLength);
            const subkey = decoded.subarray(13 + saltLength);

            const derivedKey = crypto.pbkdf2Sync(
                providedPassword, salt, iterations, subkey.length, algorithm
            );

            return crypto.timingSafeEqual(derivedKey, subkey);
        }

        if (formatMarker === 0x00) {
            // V2 format (SHA1, 1000 iterations)
            const salt = decoded.subarray(1, 17);
            const subkey = decoded.subarray(17, 49);

            const derivedKey = crypto.pbkdf2Sync(
                providedPassword, salt, 1000, 32, 'sha1'
            );

            return crypto.timingSafeEqual(derivedKey, subkey);
        }

        return false;
    } catch {
        return false;
    }
}

export default {
    generateSecurePassword,
    hashPasswordPBKDF2,
    verifyPasswordPBKDF2,
};
