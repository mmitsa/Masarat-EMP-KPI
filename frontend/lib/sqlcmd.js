/**
 * lib/sqlcmd.js - وحدة تنفيذ استعلامات SQL Server عبر sqlcmd
 *
 * الإصدار 2.0 - حل مشكلة ترميز العربية نهائياً
 *
 * المبدأ الأساسي: كل المدخلات والمخرجات تمر عبر ملفات UTF-16LE مع BOM
 * لضمان ترميز عربي صحيح في كل الاتجاهات:
 *
 * الكتابة: SQL → ملف UTF-16LE مع BOM → sqlcmd -i
 * القراءة: sqlcmd -u -o → ملف UTF-16LE → fixSqlcmdEncoding → نص عربي صحيح
 *
 * الاستخدام:
 *   import { sqlcmdQuery, sqlcmdExec, sqlcmdJson, escapeSql } from '@/lib/sqlcmd';
 *   const rows = await sqlcmdJson('SELECT ... FOR JSON PATH');
 *   const count = await sqlcmdExec('SELECT COUNT(*) FROM ...');
 */

import { execFile } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// ══════════════════════════════════════════════════════
// Windows-1252 → byte reverse mapping
// sqlcmd يحوّل bytes 0x80-0x9F حسب جدول Windows-1252 بدل Latin-1
// نحتاج عكس هذا التحويل لاسترجاع UTF-8 bytes الصحيحة
// ══════════════════════════════════════════════════════
const WIN1252_REVERSE = new Map();
const WIN1252_MAP = [
  [0x80, 0x20AC], [0x82, 0x201A], [0x83, 0x0192], [0x84, 0x201E],
  [0x85, 0x2026], [0x86, 0x2020], [0x87, 0x2021], [0x88, 0x02C6],
  [0x89, 0x2030], [0x8A, 0x0160], [0x8B, 0x2039], [0x8C, 0x0152],
  [0x8E, 0x017D], [0x91, 0x2018], [0x92, 0x2019], [0x93, 0x201C],
  [0x94, 0x201D], [0x95, 0x2022], [0x96, 0x2013], [0x97, 0x2014],
  [0x98, 0x02DC], [0x99, 0x2122], [0x9A, 0x0161], [0x9B, 0x203A],
  [0x9C, 0x0153], [0x9E, 0x017E], [0x9F, 0x0178],
];
for (const [byte, unicode] of WIN1252_MAP) {
  WIN1252_REVERSE.set(unicode, byte);
}

/**
 * إصلاح ترميز sqlcmd الذكي - يتعامل مع نوعين من البيانات:
 *
 * النوع 1 (بيانات قديمة - seed/.NET):
 *   sqlcmd يحوّل UTF-8 bytes → Windows-1252 chars → UTF-16LE
 *   النتيجة: أحرف في نطاق 0x00-0xFF + أحرف Windows-1252 المعيّنة
 *   الحل: عكس التحويل واسترجاع UTF-8 bytes الأصلية
 *
 * النوع 2 (بيانات جديدة - sqlcmd N'...'):
 *   Unicode مخزّن بشكل صحيح في nvarchar
 *   النتيجة: أحرف عربية حقيقية (U+0600+)
 *   الحل: إبقاء الأحرف كما هي
 *
 * الدالة تتعامل مع كلا النوعين في نفس الناتج تلقائياً
 *
 * @param {string} garbled - النص من ملف UTF-16LE
 * @returns {string} النص العربي الصحيح
 */
function fixSqlcmdEncoding(garbled) {
  if (!garbled) return '';

  let result = '';
  let byteBuffer = [];

  function flushBytes() {
    if (byteBuffer.length > 0) {
      try {
        result += Buffer.from(byteBuffer).toString('utf8');
      } catch {
        // إذا فشل التحويل، نمرر البايتات كما هي
        result += String.fromCharCode(...byteBuffer);
      }
      byteBuffer = [];
    }
  }

  for (let i = 0; i < garbled.length; i++) {
    const code = garbled.charCodeAt(i);

    if (code < 0x80) {
      // ASCII عادي (0x00-0x7F): آمن دائماً
      flushBytes();
      result += garbled[i];
    } else if (code < 0x100) {
      // نطاق 0x80-0xFF: قد يكون byte من UTF-8 متعدد البايت (بيانات قديمة)
      byteBuffer.push(code);
    } else if (WIN1252_REVERSE.has(code)) {
      // حرف Windows-1252 مُعيَّن (مثل U+201E → 0x84): نسترجع byte الأصلي
      byteBuffer.push(WIN1252_REVERSE.get(code));
    } else {
      // حرف Unicode حقيقي (عربي U+0600+، إلخ): نحافظ عليه كما هو
      flushBytes();
      result += garbled[i];
    }
  }

  flushBytes();
  return result;
}

/**
 * الحصول على معلومات اتصال SQL Server
 * يدعم Windows (named instances) و macOS/Linux (TCP with port)
 */
function getSqlInstance() {
  const host = process.env.MSSQL_HOST || 'localhost';
  const port = process.env.MSSQL_PORT || '1433';

  // على Windows: استخدام named instance أو localhost
  // على macOS/Linux: استخدام TCP مع port
  if (process.platform === 'win32') {
    const rawHost = host.includes('\\') ? host : '.\\MSSQLSERVER2022';
    return rawHost.replace(/\\\\/g, '\\').replace(/^localhost/i, '.');
  }

  // macOS/Linux: استخدام host,port format
  return `${host},${port}`;
}

/**
 * الحصول على credentials لـ SQL Server Authentication
 */
function getSqlCredentials() {
  const user = process.env.MSSQL_USER;
  const pass = process.env.MSSQL_PASS;

  if (user && pass) {
    return ['-U', user, '-P', pass];
  }
  // Windows Authentication (بدون credentials)
  return [];
}

/**
 * تنظيف ملفات مؤقتة بأمان
 */
function safeUnlink(filePath) {
  try { if (filePath) unlinkSync(filePath); } catch { /* تجاهل */ }
}

/**
 * قراءة ملف UTF-16LE مع إصلاح الترميز
 */
function readUtf16Output(filePath) {
  let raw = readFileSync(filePath, 'utf16le');
  // إزالة BOM
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  // إصلاح ترميز العربية
  return fixSqlcmdEncoding(raw.trim());
}

/**
 * فحص نص الناتج للأخطاء من SQL Server
 */
function checkOutputForErrors(output) {
  if (output && /^Msg \d+, Level \d+, State \d+/m.test(output)) {
    throw new Error('SQL Server: ' + output.split('\n')[0]);
  }
}

// ══════════════════════════════════════════════════════
// دوال تنظيف القيم لمنع SQL Injection
// ══════════════════════════════════════════════════════

/**
 * تنظيف القيم النصية لمنع SQL Injection
 * يغلف القيمة بـ N'...' للتعامل مع Unicode بشكل صحيح
 *
 * الحماية متعددة الطبقات:
 * - مضاعفة Single quotes
 * - إزالة Semicolons (منع أوامر متعددة)
 * - إزالة SQL comments (-- و block comments)
 * - إزالة Dangerous procedures (xp_, sp_)
 * - إزالة DDL/DML keywords (DROP, TRUNCATE, UNION SELECT, etc.)
 * - إزالة CHAR/NCHAR injection
 *
 * @param {any} value
 * @returns {string} القيمة المنظفة مغلفة بـ N'...' أو NULL
 */
export function escapeSql(value) {
  if (value === null || value === undefined || value === '') return 'NULL';
  let str = String(value);
  // 1. مضاعفة علامات الاقتباس المفردة
  str = str.replace(/'/g, "''");
  // 2. إزالة الفاصلة المنقوطة (منع تنفيذ أوامر متعددة)
  str = str.replace(/;/g, '');
  // 3. إزالة تعليقات SQL
  str = str.replace(/--/g, '');
  str = str.replace(/\/\*/g, '');
  str = str.replace(/\*\//g, '');
  // 4. إزالة Extended/System stored procedures
  str = str.replace(/\bxp_/gi, '');
  str = str.replace(/\bsp_/gi, '');
  // 5. إزالة أوامر DDL/DML الخطيرة
  str = str.replace(/\bEXEC\s*\(/gi, '');
  str = str.replace(/\bEXECUTE\s*\(/gi, '');
  str = str.replace(/\bDROP\s+(TABLE|DATABASE|INDEX|VIEW|PROCEDURE)\b/gi, '');
  str = str.replace(/\bTRUNCATE\s+TABLE\b/gi, '');
  str = str.replace(/\bALTER\s+(TABLE|DATABASE|VIEW|PROCEDURE)\b/gi, '');
  str = str.replace(/\bUNION\s+(ALL\s+)?SELECT\b/gi, '');
  str = str.replace(/\bINSERT\s+INTO\b/gi, '');
  str = str.replace(/\bDELETE\s+FROM\b/gi, '');
  str = str.replace(/\bUPDATE\s+\w+\s+SET\b/gi, '');
  // 6. إزالة CHAR/NCHAR injection
  str = str.replace(/\bCHAR\s*\(\d+\)/gi, '');
  str = str.replace(/\bNCHAR\s*\(\d+\)/gi, '');
  return `N'${str}'`;
}

/**
 * تنظيف قيمة رقمية - يقبل فقط أرقام عشرية
 * @param {any} v - القيمة
 * @returns {string} الرقم أو NULL
 */
export function safeNumVal(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  const n = parseFloat(v);
  if (isNaN(n)) return 'NULL';
  return String(n);
}

/**
 * تنظيف قيمة عدد صحيح
 * @param {any} v - القيمة
 * @returns {string} العدد الصحيح أو NULL
 */
export function safeIntVal(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  const n = parseInt(v, 10);
  if (isNaN(n)) return 'NULL';
  return String(n);
}

/**
 * تنظيف قيمة تاريخ - يقبل فقط تواريخ بصيغة YYYY-MM-DD
 * @param {any} v - القيمة
 * @returns {string} التاريخ مغلف بـ '' أو NULL
 */
export function safeDateVal(v) {
  if (!v) return 'NULL';
  const s = String(v).trim();
  // قبول YYYY-MM-DD أو YYYY-MM-DDTHH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return `'${s.substring(0, 10)}'`;
  }
  return 'NULL';
}

/**
 * تنظيف قيمة boolean لـ SQL Server (BIT)
 * @param {any} v - القيمة
 * @returns {string} 0 أو 1 أو NULL
 */
export function safeBitVal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (v === true || v === 1 || v === '1' || v === 'true') return '1';
  return '0';
}

// ══════════════════════════════════════════════════════
// دوال التنفيذ الرئيسية - كلها تمر عبر ملفات Unicode
// ══════════════════════════════════════════════════════

/**
 * تنفيذ استعلام SQL بسيط (INSERT, UPDATE, DELETE, COUNT)
 * يدعم النص العربي في المدخلات والمخرجات عبر ملفات UTF-16LE
 *
 * @param {string} sqlQuery - الاستعلام
 * @param {string} database - اسم قاعدة البيانات
 * @param {object} opts - خيارات إضافية
 * @param {number} opts.timeout - المهلة بالمللي ثانية (افتراضي: 30000)
 * @returns {Promise<string>} الناتج النصي مع دعم العربية
 */
export function sqlcmdExec(sqlQuery, database = 'Masarat_HR', opts = {}) {
  const { timeout = 30000 } = opts;
  return new Promise((resolve, reject) => {
    const instance = getSqlInstance();
    const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const tmpSqlFile = join(tmpdir(), `msql_${uid}.sql`);
    const tmpOutFile = join(tmpdir(), `msql_out_${uid}.txt`);

    // كتابة SQL كـ UTF-16LE مع BOM
    try {
      writeFileSync(tmpSqlFile, '\uFEFF' + 'SET QUOTED_IDENTIFIER ON;\nSET NOCOUNT ON;\n' + sqlQuery, 'utf16le');
    } catch (e) {
      return reject(new Error('فشل كتابة ملف SQL: ' + e.message));
    }

    // ملاحظة: -h -1 و -y 0 متعارضان في sqlcmd
    // لـ exec: نستخدم -h -1 (بدون عناوين) لأن النتائج عادة أرقام قصيرة
    const credentials = getSqlCredentials();
    execFile('sqlcmd', [
      '-S', instance, '-d', database, '-C',
      ...credentials,
      '-i', tmpSqlFile,
      '-o', tmpOutFile,
      '-u',           // UTF-16LE output - ضمان ترميز Unicode
      '-h', '-1',     // بدون عناوين أعمدة
    ], { timeout }, (error, stdout, stderr) => {
      safeUnlink(tmpSqlFile);

      if (error) {
        safeUnlink(tmpOutFile);
        return reject(new Error('SQL Error: ' + (stderr || stdout || error.message)));
      }
      if (stderr && stderr.includes('Msg ')) {
        safeUnlink(tmpOutFile);
        return reject(new Error('SQL Server: ' + stderr));
      }

      try {
        const fixed = readUtf16Output(tmpOutFile);
        safeUnlink(tmpOutFile);
        // فحص أخطاء SQL Server في الناتج
        checkOutputForErrors(fixed);
        resolve(fixed);
      } catch (readErr) {
        safeUnlink(tmpOutFile);
        // إذا لم يوجد ملف ناتج، نستخدم stdout كملاذ أخير
        if (readErr.message?.startsWith('SQL Server:')) return reject(readErr);
        resolve(stdout ? stdout.trim() : '');
      }
    });
  });
}

/**
 * تنفيذ استعلام SQL يرجع نص (بما فيه العربية) عبر ملف Unicode
 * يُستخدم مع أي استعلام يرجع بيانات تحتوي نص عربي
 * يحل مشكلة الترميز تلقائياً
 *
 * @param {string} sqlQuery - الاستعلام (عادة مع FOR JSON PATH)
 * @param {string} database - اسم قاعدة البيانات
 * @param {object} opts - خيارات إضافية
 * @param {number} opts.timeout - المهلة بالمللي ثانية (افتراضي: 30000)
 * @returns {Promise<string>} الناتج النصي مع عربية صحيحة
 */
export function sqlcmdQuery(sqlQuery, database = 'Masarat_HR', opts = {}) {
  const { timeout = 30000 } = opts;
  return new Promise((resolve, reject) => {
    const instance = getSqlInstance();
    const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const tmpSqlFile = join(tmpdir(), `msql_${uid}.sql`);
    const tmpOutFile = join(tmpdir(), `msql_out_${uid}.txt`);

    // كتابة SQL كـ UTF-16LE مع BOM
    try {
      writeFileSync(tmpSqlFile, '\uFEFF' + 'SET QUOTED_IDENTIFIER ON;\nSET NOCOUNT ON;\n' + sqlQuery, 'utf16le');
    } catch (e) {
      return reject(new Error('فشل كتابة ملف SQL: ' + e.message));
    }

    const credentials = getSqlCredentials();
    execFile('sqlcmd', [
      '-S', instance, '-d', database, '-C',
      ...credentials,
      '-i', tmpSqlFile,
      '-o', tmpOutFile,
      '-u',           // UTF-16LE output
      '-y', '0',      // بدون حد لعرض الأعمدة
    ], { timeout }, (error, stdout, stderr) => {
      safeUnlink(tmpSqlFile);

      if (error) {
        safeUnlink(tmpOutFile);
        return reject(new Error('SQL Error: ' + (stderr || stdout || error.message)));
      }
      if (stderr && stderr.includes('Msg ')) {
        safeUnlink(tmpOutFile);
        return reject(new Error('SQL Server: ' + stderr));
      }

      try {
        const fixed = readUtf16Output(tmpOutFile);
        safeUnlink(tmpOutFile);
        checkOutputForErrors(fixed);
        resolve(fixed);
      } catch (readErr) {
        safeUnlink(tmpOutFile);
        if (readErr.message?.startsWith('SQL Server:')) return reject(readErr);
        resolve(stdout ? stdout.trim() : '');
      }
    });
  });
}

/**
 * تنفيذ استعلام SQL مع FOR JSON PATH وإرجاع النتيجة كـ JSON parsed
 * يتعامل مع headers من sqlcmd ويستخرج JSON تلقائياً
 * يحل مشكلة ترميز العربية تلقائياً
 *
 * @param {string} sqlQuery - الاستعلام مع FOR JSON PATH
 * @param {string} database - اسم قاعدة البيانات
 * @param {any} fallback - القيمة الافتراضية إذا فشل الاستعلام
 * @returns {Promise<any>} البيانات المُحللة (parsed JSON)
 */
export async function sqlcmdJson(sqlQuery, database = 'Masarat_HR', fallback = null) {
  try {
    const output = await sqlcmdQuery(sqlQuery, database);
    if (!output) return fallback;

    // إزالة أسطر جديدة وبحث عن بداية JSON
    const cleaned = output.replace(/\r?\n/g, '').trim();
    const arrIdx = cleaned.indexOf('[');
    const objIdx = cleaned.indexOf('{');
    let start = -1;
    if (arrIdx >= 0 && objIdx >= 0) start = Math.min(arrIdx, objIdx);
    else if (arrIdx >= 0) start = arrIdx;
    else if (objIdx >= 0) start = objIdx;

    if (start < 0) return fallback;

    return JSON.parse(cleaned.substring(start));
  } catch {
    return fallback;
  }
}

/**
 * تنفيذ استعلام SQL مع pipe-separated output (لـ identity-db)
 * يدعم النص العربي عبر ملف Unicode + إصلاح الترميز
 *
 * @param {string} sqlQuery - الاستعلام
 * @param {string} database - اسم قاعدة البيانات
 * @returns {Promise<string>} الناتج النصي مع أعمدة مفصولة بـ |
 */
export function sqlcmdPiped(sqlQuery, database = 'Masarat_Identity') {
  return new Promise((resolve, reject) => {
    const instance = getSqlInstance();
    const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const tmpSqlFile = join(tmpdir(), `msql_${uid}.sql`);
    const tmpOutFile = join(tmpdir(), `msql_out_${uid}.txt`);

    try {
      writeFileSync(tmpSqlFile, '\uFEFF' + 'SET QUOTED_IDENTIFIER ON;\nSET NOCOUNT ON;\n' + sqlQuery, 'utf16le');
    } catch (e) {
      return reject(new Error('فشل كتابة ملف SQL: ' + e.message));
    }

    const credentials = getSqlCredentials();
    execFile('sqlcmd', [
      '-S', instance, '-d', database, '-C',
      ...credentials,
      '-i', tmpSqlFile,
      '-o', tmpOutFile,
      '-u',           // UTF-16LE output
      '-s', '|',      // pipe separator
      '-W',           // remove trailing spaces
    ], { timeout: 15000 }, (error, stdout, stderr) => {
      safeUnlink(tmpSqlFile);

      if (error) {
        safeUnlink(tmpOutFile);
        return reject(new Error(stderr || stdout || error.message));
      }
      if (stderr && stderr.includes('Msg ')) {
        safeUnlink(tmpOutFile);
        return reject(new Error(stderr));
      }

      try {
        const fixed = readUtf16Output(tmpOutFile);
        safeUnlink(tmpOutFile);
        resolve(fixed);
      } catch (readErr) {
        safeUnlink(tmpOutFile);
        resolve(stdout ? stdout.trim() : '');
      }
    });
  });
}

// تصدير افتراضي
export default {
  sqlcmdExec, sqlcmdQuery, sqlcmdJson, sqlcmdPiped,
  escapeSql, safeNumVal, safeIntVal, safeDateVal, safeBitVal,
};
