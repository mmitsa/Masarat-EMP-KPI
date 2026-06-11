// Unified database access layer for Postgres and SQL Server (ESM)
import { Pool } from 'pg';
import sql from 'mssql';

export function getPrimarySource() {
  const mode = (process.env.DATA_SOURCE_PRIMARY || 'postgres').toLowerCase();
  return mode === 'sqlserver' ? 'sqlserver' : 'postgres';
}

export function getSyncToPostgresFlag() {
  return (process.env.SYNC_TO_POSTGRES || 'false').toLowerCase() === 'true';
}

export function createPgPool() {
  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'masarat_modern',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000,
  });
}

export async function getMssqlPool() {
  // التحقق من وجود كلمة المرور في متغيرات البيئة
  const mssqlPass = process.env.MSSQL_PASS;
  if (!mssqlPass && process.env.NODE_ENV === 'production') {
    throw new Error('MSSQL_PASS environment variable is required in production');
  }

  const config = {
    server: process.env.MSSQL_HOST || 'localhost',
    user: process.env.MSSQL_USER || 'sa',
    password: mssqlPass || (process.env.NODE_ENV === 'development' ? 'DevPassword123!' : ''),
    database: process.env.DB_NAME_HR || process.env.MSSQL_DATABASE || 'Masarat_HR',
    port: parseInt(process.env.MSSQL_PORT || '1433'),
    options: {
      // encrypt: يُفعّل فقط إذا MSSQL_ENCRYPT=true (عند استخدام شهادة SSL حقيقية)
      // trustServerCertificate: يُفعّل للـ localhost أو عند عدم وجود شهادة CA
      encrypt: (process.env.MSSQL_ENCRYPT || 'false').toLowerCase() === 'true',
      trustServerCertificate: (process.env.MSSQL_TRUST_CERT || 'true').toLowerCase() === 'true',
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
  
  // Reuse global connection if already established
  if (sql?.connected) {
    return sql;
  }
  await sql.connect(config);
  return sql;
}

