# نظام قياس الأداء الوظيفي

تم استخراج نظام قياس الأداء الوظيفي من المنصة الموحدة في حزمة مستقلة.

## المحتويات

- `backend/modules/epm`: مشاريع EPM API/Application/Domain/Infrastructure/Tests.
- `backend/core/Masarat.Core`: الاعتمادات المشتركة المطلوبة لتشغيل EPM.
- `backend/core/Masarat.Events`: عقود وأحداث التكامل المطلوبة.
- `frontend`: واجهة Next.js مركزة على صفحات EPM.
- `database`: سكربتات PostgreSQL ومؤشرات قاعدة بيانات `masarat_epm`.
- `EmployeePerformanceMeasurement.slnx`: ملف حل مستقل للباك إند.

## تشغيل الباك إند

```bash
cd "/Volumes/Projects/قياس الاداء"
export POSTGRES_HOST="localhost"
export POSTGRES_PORT="5432"
export POSTGRES_DB="masarat_epm"
export POSTGRES_USER="masarat_epm"
export POSTGRES_PASSWORD="postgres"
export HR_SERVICE_URL="http://localhost:5001"
./scripts/run-backend.sh
```

الـ API يعمل افتراضياً على إعدادات ASP.NET المحلية. أهم المسارات:

- `GET /api/epm/summary`
- `GET /api/epm/charters`
- `GET /api/epm/goals`
- `GET /api/epm/evaluations`
- `GET /api/epm/reviews`
- `GET /api/epm/reports/annual`
- `GET /api/epm/integrations/hr/employees`
- `POST /api/epm/integrations/hr/sync`

## تشغيل الواجهة

```bash
cd "/Volumes/Projects/قياس الاداء/frontend"
npm ci
npm run dev -- -p 3008
```

على macOS قد يفشل `npm ci` بسبب الحزمة الأصلية `msnodesqlv8` إذا لم يكن `unixODBC` مثبتاً. للتحقق من الواجهة فقط:

```bash
npm ci --ignore-scripts
npm run build
```

الصفحات المستخرجة:

- `/epm`
- `/epm/evaluations`
- `/epm/goals`
- `/epm/kpis`
- `/epm/permissions`
- `/hr/performance`

## قاعدة البيانات PostgreSQL

قاعدة النظام: `masarat_epm`.

إنشاء مستخدم وقاعدة محلياً:

```sql
CREATE ROLE masarat_epm LOGIN PASSWORD 'postgres';
CREATE DATABASE masarat_epm OWNER masarat_epm;
GRANT ALL PRIVILEGES ON DATABASE masarat_epm TO masarat_epm;
```

تطبيق السكربت:

```bash
psql -U masarat_epm -d masarat_epm -f database/20260611_epm_postgresql_schema.sql
```

الملفات المهمة:

- `database/20260611_epm_postgresql_schema.sql`
- `database/20260611_epm_official_charter_standards.sql`
- `database/migrate-epm-database.sql`
- `database/001_performance_indexes.sql`
- `database/004_performance_optimization.sql`

تمت إضافة حقول الميثاق الرسمية: نوع الوظيفة، المسمى الوظيفي، الرقم الوظيفي، الوكالة / الإدارة العامة، والإدارة / القسم.

## تكامل الموارد البشرية

نظام قياس الأداء لا يعتبر نفسه مصدر بيانات الموظفين. مصدر الحقيقة هو نظام الموارد البشرية الخارجي، ويتم الربط كالتالي:

- `EmployeeSnapshots`: نسخة قراءة محلية داخل PostgreSQL تحفظ آخر بيانات موظف مطلوبة للتقييم.
- `IntegrationSyncLogs`: سجل كل عملية مزامنة ونتيجتها.
- `POST /api/epm/integrations/hr/sync`: يسحب الموظفين من `HR_SERVICE_URL` عبر endpoint `/api/hr/employees`.
- أحداث MassTransit مثل `EmployeeUpdatedEvent` و`EmployeeTerminatedEvent` تحدث snapshot والمواثيق المفتوحة.

إعدادات التكامل:

```json
"Integrations": {
  "HR": {
    "BaseUrl": "http://localhost:5001",
    "EmployeesEndpoint": "/api/hr/employees",
    "ApiKey": ""
  }
}
```

## المعايير الرسمية

تم تطبيق قوالب Excel المرفقة في النظام:

- وظيفة غير إشرافية: حس المسؤولية 10%، التعاون 5%، التواصل 15%، تحقيق النتائج 20%، تطوير الموظفين 10%، الارتباط الوظيفي 40%.
- وظيفة إشرافية: حس المسؤولية 10%، التعاون 5%، التواصل 5%، تحقيق النتائج 20%، تطوير الموظفين 10%، الارتباط الوظيفي 10%، القيادة 40%.
- مقياس التقدير الرسمي من 1 إلى 5: غير مرضي، مرضي، جيد، جيد جداً، ممتاز.

API المعايير:

```bash
curl -H "X-Tenant-Id: 1" http://localhost:5006/api/epm/standards
```

## التحقق المنفذ

- `dotnet restore EmployeePerformanceMeasurement.slnx`
- `dotnet build EmployeePerformanceMeasurement.slnx --no-restore`
- `npm ci --ignore-scripts`
- `npm run build`

تم اختبار تشغيل الباك إند على PostgreSQL المحلي، وتطبيق سكربت الجداول، وقراءة:

```bash
curl -H "X-Tenant-Id: 1" http://localhost:5006/api/epm/integrations/hr/employees
curl http://localhost:3008/api/epm/integrations/hr/employees
```

ملاحظة: تم حذف `node_modules`, `.next`, `bin`, و`obj` بعد التحقق لإبقاء الحزمة مصدرية نظيفة.
