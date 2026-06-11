/**
 * Identity Database Authentication Module
 * مصادقة المستخدمين مباشرة من قاعدة بيانات Masarat_Identity
 *
 * يُستخدم عندما لا يكون IdentityServer متاحاً (USE_IDENTITY_API=false)
 * يستخدم sqlcmd مع Windows Auth (لا يحتاج كلمة مرور SQL)
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sqlcmdPiped, escapeSql } from '@/lib/sqlcmd';

// ═══════════════════════════════════════════════════════════════
// تنفيذ SQL عبر lib/sqlcmd.js المشترك (يدعم العربية تلقائياً)
// ═══════════════════════════════════════════════════════════════

function executeSqlCmd(sqlQuery, database = 'Masarat_Identity') {
  return sqlcmdPiped(sqlQuery, database);
}

/** Parse sqlcmd pipe-separated output into array of objects */
function parseSqlOutput(output) {
  const lines = output.split('\n').map(l => l.trim()).filter(l => l && !l.match(/^-+(\|-+)*$/));
  if (lines.length < 2) return [];
  const headers = lines[0].split('|').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].startsWith('(') && lines[i].includes('rows affected')) continue;
    const vals = lines[i].split('|').map(v => v.trim());
    const row = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] === 'NULL' ? null : (vals[idx] || null); });
    rows.push(row);
  }
  return rows;
}

// ═══════════════════════════════════════════════════════════════
// التحقق من كلمة المرور (BCrypt + ASP.NET Identity V3 PBKDF2)
// ═══════════════════════════════════════════════════════════════

/**
 * التحقق من كلمة المرور - يدعم 3 صيغ:
 * 1. BCrypt ($2a$, $2b$, $2y$) - المستخدمة في seed data من .NET
 * 2. ASP.NET Identity V3 (0x01 marker) - PBKDF2-SHA256/SHA512
 * 3. ASP.NET Identity V2 (0x00 marker) - PBKDF2-SHA1
 */
function verifyPasswordHash(hashedPassword, providedPassword) {
  try {
    // 1. BCrypt format: يبدأ بـ $2a$, $2b$, أو $2y$
    if (hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2y$')) {
      return bcrypt.compareSync(providedPassword, hashedPassword);
    }

    // 2. ASP.NET Identity PBKDF2 format (Base64 encoded)
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
      // V2 format (SHA1, 1000 iterations, 16-byte salt, 32-byte subkey)
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

// ═══════════════════════════════════════════════════════════════
// البحث عن المستخدم والمصادقة
// ═══════════════════════════════════════════════════════════════

/**
 * مصادقة المستخدم من قاعدة البيانات
 * الجداول: Users, UserRoles, Roles, UserPermissions, Permissions
 */
export async function authenticateFromDb(identifier, password) {
  try {
    // 1. البحث عن المستخدم (مع حماية SQL Injection)
    // التحقق من صحة المدخل: NationalId = أرقام فقط، Username = أحرف وأرقام
    const cleanId = String(identifier).trim();
    if (cleanId.length > 100) {
      return null; // رفض المدخلات الطويلة جداً
    }
    const safeId = escapeSql(cleanId);
    const userOutput = await executeSqlCmd(`
      SELECT Id, NationalId, Username, Email, PasswordHash,
             NameAr, NameEn, TenantId, TenantName,
             Status, IsDeleted, PhoneNumber, Role,
             DepartmentId, DepartmentName, Position,
             MustChangePassword, PasswordExpiresAt, EmployeeNumber
      FROM Users
      WHERE (Username = ${safeId} OR NationalId = ${safeId})
        AND IsDeleted = 0
    `);

    const users = parseSqlOutput(userOutput);
    if (!users.length) return null;
    const user = users[0];

    // 2. فحص حالة الحساب
    if (user.Status !== 'active') {
      throw new Error('حسابك موقوف. يرجى مراجعة مدير النظام.');
    }

    // 3. التحقق من كلمة المرور
    if (!user.PasswordHash || !verifyPasswordHash(user.PasswordHash, password)) {
      return null;
    }

    // 4. الحصول على الأدوار
    let roles = [];
    try {
      const rolesOutput = await executeSqlCmd(`
        SELECT r.RoleName
        FROM UserRoles ur
        JOIN Roles r ON ur.RoleId = r.Id
        WHERE ur.UserId = ${parseInt(user.Id)}
      `);
      const roleRows = parseSqlOutput(rolesOutput);
      roles = roleRows.map(r => r.RoleName).filter(Boolean);
    } catch {}

    // إضافة الدور من عمود Role في Users إذا لم تكن الأدوار موجودة
    if (!roles.length && user.Role) {
      roles = [user.Role];
    }

    // 5. الحصول على الصلاحيات
    let permissions = [];
    try {
      const permsOutput = await executeSqlCmd(`
        SELECT p.PermissionKey
        FROM UserPermissions up
        JOIN Permissions p ON up.PermissionId = p.Id
        WHERE up.UserId = ${parseInt(user.Id)}
      `);
      const permRows = parseSqlOutput(permsOutput);
      permissions = permRows.map(p => p.PermissionKey).filter(Boolean);
    } catch {}

    // 6. الحصول على بيانات المستأجر من Masarat_SaaS
    let tenantData = null;
    if (user.TenantId) {
      try {
        const tenantOutput = await executeSqlCmd(`
          SELECT Id, Code, NameAr, NameEn, IsActive
          FROM [Masarat_SaaS].dbo.TenantEntities
          WHERE Id = ${parseInt(user.TenantId)}
        `, 'Masarat_SaaS');
        const tenantRows = parseSqlOutput(tenantOutput);
        if (tenantRows.length) tenantData = tenantRows[0];
      } catch {}
    }

    // 7. الحصول على الموديولات المفعّلة
    let activeModules = [];
    if (user.TenantId) {
      try {
        const modulesOutput = await executeSqlCmd(`
          SELECT m.Code
          FROM SystemSubscriptions s
          JOIN SystemModules m ON s.SystemModuleId = m.Id
          JOIN TenantEntities t ON s.TenantEntityId = t.Id
          WHERE t.Id = ${parseInt(user.TenantId)} AND s.IsActive = 1
        `, 'Masarat_SaaS');
        const modRows = parseSqlOutput(modulesOutput);
        activeModules = modRows.map(m => m.Code).filter(Boolean);
      } catch {}
    }

    // 8. تحويل الصلاحيات
    const platformPermissions = mapPermissions(permissions, roles, activeModules);

    // تحديد حالة MustChangePassword
    const mustChangePassword = user.MustChangePassword === '1' || user.MustChangePassword === 'True' || user.MustChangePassword === 'true';

    // تحديد حالة انتهاء صلاحية كلمة المرور
    const passwordExpiresAt = user.PasswordExpiresAt || null;

    console.log(`[DB] Authenticated: ${identifier} | Tenant: ${user.TenantName || 'N/A'} | Roles: ${roles.join(',')} | MustChangePassword: ${mustChangePassword}`);

    // تحديث LastLogin في قاعدة البيانات
    try {
      await executeSqlCmd(`
        UPDATE Users SET LastLogin = GETUTCDATE(), LastActivity = GETUTCDATE()
        WHERE Id = ${parseInt(user.Id)}
      `);
    } catch { /* تجاهل خطأ التحديث */ }

    return {
      id: String(user.Id),
      name: user.NameAr || user.NameEn || user.Username,
      email: user.Email,
      roles,
      permissions: platformPermissions,
      tenantId: String(user.TenantId || 1),  // رقم نصي بدون prefix (كان 'tenant-X' وسبب مشاكل)
      tenantName: user.TenantName || tenantData?.NameAr || 'غير محدد',
      tenantCode: tenantData?.Code,
      activeModules,
      departmentId: user.DepartmentId ? parseInt(user.DepartmentId) : null,
      department: user.DepartmentName,
      position: user.Position,
      username: user.Username || user.NationalId,
      nationalId: user.NationalId || user.Username,
      mustChangePassword,
      passwordExpiresAt,
      employeeNumber: user.EmployeeNumber,
    };
  } catch (error) {
    if (error.message.includes('موقوف')) throw error;
    console.error(`[DB] Auth error for ${identifier}:`, error.message);
    return null;
  }
}

/**
 * تحويل صلاحيات قاعدة البيانات لصيغة المنصة
 */
// خريطة الأدوار → الصلاحيات التلقائية
const ROLE_PERMISSIONS_MAP = {
  hr_director:   ['hr:read', 'hr:write', 'hr:admin', 'epm:read', 'epm:write', 'analytics:read'],
  hr_manager:    ['hr:read', 'hr:write', 'hr:admin', 'epm:read', 'epm:write', 'warehouse:read', 'movement:read', 'archiving:read', 'finance:read', 'analytics:read', 'itsm:read', 'grc:read', 'projects:read', 'agents:read', 'settings:read'],
  hr_employee:   ['hr:read', 'hr:write'],
  hr_sys_admin:  ['hr:read', 'settings:read', 'settings:write'],
  hr_officer_full: ['hr:read', 'hr:write', 'hr:admin'],
  hr_officer_basic: ['hr:read', 'hr:write'],
  hr_attendance: ['hr:read', 'hr:write'],
  hr_att_vac:    ['hr:read', 'hr:write'],
  hr_overtime:   ['hr:read', 'hr:write'],
  it_director:   ['hr:read', 'warehouse:read', 'movement:read', 'archiving:read', 'finance:read', 'epm:read', 'analytics:read', 'itsm:read', 'itsm:write', 'itsm:admin', 'grc:read', 'projects:read', 'saas:read', 'saas:write', 'agents:read', 'agents:write', 'settings:read', 'settings:write', 'it_permissions:manage'],
  it_manager:    ['hr:read', 'hr:write', 'warehouse:read', 'warehouse:write', 'movement:read', 'movement:write', 'archiving:read', 'archiving:write', 'finance:read', 'epm:read', 'epm:write', 'analytics:read', 'itsm:read', 'itsm:write', 'itsm:admin', 'grc:read', 'projects:read', 'projects:write', 'saas:read', 'saas:write', 'agents:read', 'agents:write', 'settings:read', 'settings:write', 'it_permissions:manage'],
  it_specialist: ['itsm:read', 'itsm:write'],
  it_helpdesk:   ['itsm:read', 'itsm:write'],
  warehouse_admin:     ['warehouse:read', 'warehouse:write', 'warehouse:admin', 'hr:read'],
  warehouse_director:  ['warehouse:read', 'warehouse:write', 'warehouse:admin', 'hr:read'],
  warehouse_keeper:    ['warehouse:read', 'warehouse:write', 'hr:read'],
  head_warehouse:      ['warehouse:read', 'warehouse:write', 'warehouse:admin', 'hr:read'],
  security_warehouse:  ['warehouse:read', 'warehouse:write', 'hr:read'],
  fleet_manager: ['movement:read', 'movement:write', 'movement:admin', 'hr:read'],
  archive_admin: ['archiving:read', 'archiving:write', 'archiving:admin', 'hr:read'],
  finance_admin: ['finance:read', 'finance:write', 'finance:admin', 'sadad:read'],
  finance_director: ['finance:read', 'finance:write', 'finance:admin', 'sadad:read', 'analytics:read'],
  department_head: ['hr:read'],
  authority_holder: ['hr:read', 'hr:write'],
  deputy_authority: ['hr:read', 'hr:write'],
  employee:      ['hr:read'],
  Employee:      ['hr:read'],
};

function mapPermissions(dbPermissions, roles, activeModules) {
  if (roles.includes('SuperAdmin') || roles.includes('super_admin')) {
    return ['*'];
  }

  const mapped = new Set();

  // 1. صلاحيات من قاعدة البيانات (UserPermissions)
  for (const perm of dbPermissions) {
    mapped.add(perm);
    const [module] = perm.split(':');
    if (module) mapped.add(`${module}.*`);
  }

  // 2. صلاحيات من الوحدات المفعّلة (SystemSubscriptions)
  for (const mod of activeModules) {
    mapped.add(`${mod.toLowerCase()}:read`);
    mapped.add(`${mod.toLowerCase()}:write`);
  }

  // 3. صلاحيات من الأدوار (Role-based)
  for (const role of roles) {
    const rolePerms = ROLE_PERMISSIONS_MAP[role];
    if (rolePerms) {
      rolePerms.forEach(p => mapped.add(p));
    }
  }

  return mapped.size > 0 ? Array.from(mapped) : ['hr:read'];
}

export default { authenticateFromDb };
