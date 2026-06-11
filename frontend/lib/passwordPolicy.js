/**
 * سياسة كلمة المرور - Password Policy
 * أداة مركزية لإدارة سياسات كلمة المرور في المنصة
 */

export const PASSWORD_POLICY = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: true,
  requiredUniqueChars: 4,
  defaultPassword: 'ChangeMe@First!Login1',
  expiryDays: 90,
  warningDaysBeforeExpiry: 10,
  suspensionGraceDays: 3,
};

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

/**
 * التحقق من كلمة المرور وفق السياسة
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePassword(password) {
  const errors = [];

  if (!password || password.length < PASSWORD_POLICY.minLength) {
    errors.push(`يجب ألا تقل كلمة المرور عن ${PASSWORD_POLICY.minLength} أحرف`);
  }
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
  }
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
  }
  if (PASSWORD_POLICY.requireDigit && !/[0-9]/.test(password)) {
    errors.push('يجب أن تحتوي على رقم واحد على الأقل');
  }
  if (PASSWORD_POLICY.requireSpecial && !SPECIAL_CHARS.test(password)) {
    errors.push('يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%...)');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * قياس قوة كلمة المرور
 * @param {string} password
 * @returns {{ score: number, label: string, color: string }}
 */
export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: 'فارغة', color: 'gray' };

  let score = 0;
  if (password.length >= 12) score += 20;
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 10;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (SPECIAL_CHARS.test(password)) score += 15;

  if (score < 30) return { score, label: 'ضعيفة جداً', color: '#ef4444' };
  if (score < 50) return { score, label: 'ضعيفة', color: '#f97316' };
  if (score < 70) return { score, label: 'متوسطة', color: '#f59e0b' };
  if (score < 90) return { score, label: 'قوية', color: '#10b981' };
  return { score, label: 'قوية جداً', color: '#059669' };
}

/**
 * التحقق من انتهاء صلاحية كلمة المرور
 * @param {string|Date} expiresAt
 * @returns {boolean}
 */
export function isPasswordExpired(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt) <= new Date();
}

/**
 * التحقق من اقتراب انتهاء الصلاحية
 * @param {string|Date} expiresAt
 * @returns {{ expiring: boolean, daysLeft: number }}
 */
export function isPasswordExpiringSoon(expiresAt) {
  if (!expiresAt) return { expiring: false, daysLeft: Infinity };
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry - now;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    expiring: daysLeft > 0 && daysLeft <= PASSWORD_POLICY.warningDaysBeforeExpiry,
    daysLeft,
  };
}

/**
 * حساب تاريخ انتهاء صلاحية كلمة المرور
 * @param {Date} [from] - تاريخ البداية (افتراضي: الآن)
 * @returns {string} ISO date string
 */
export function calculatePasswordExpiry(from = new Date()) {
  const expiry = new Date(from);
  expiry.setDate(expiry.getDate() + PASSWORD_POLICY.expiryDays);
  return expiry.toISOString();
}

/**
 * التحقق مما إذا كان يجب تعليق الحساب
 * @param {string|Date} expiresAt
 * @returns {boolean}
 */
export function shouldSuspendAccount(expiresAt) {
  if (!expiresAt) return false;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = now - expiry;
  const daysPastExpiry = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return daysPastExpiry >= PASSWORD_POLICY.suspensionGraceDays;
}
