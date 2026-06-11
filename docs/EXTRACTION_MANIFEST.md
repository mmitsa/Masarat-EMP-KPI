# Extraction Manifest

## Source

- Root: `/Volumes/Projects/All Progs`
- Backend module: `backend/modules/epm`
- Frontend module: `frontend/dashboard/Unified-Dashboard`
- Database scripts: `database/schemas`, `scripts/migrate-epm-database.sql`

## Backend Included

- `Masarat.EPM.API`
- `Masarat.EPM.Application`
- `Masarat.EPM.Domain`
- `Masarat.EPM.Infrastructure`
- `Masarat.EPM.Tests`
- `Masarat.Core`
- `Masarat.Events`

Excluded generated folders: `bin`, `obj`.

## Frontend Included

Included EPM pages:

- `pages/epm.js`
- `pages/epm/evaluations.js`
- `pages/epm/goals.js`
- `pages/epm/kpis.js`
- `pages/epm/permissions.js`
- `pages/hr/performance.js`

Included shared runtime dependencies:

- `components`
- `context`
- `hooks`
- `lib`
- `public`
- `services`
- `styles`
- `utils`
- Next.js config files and package files

Excluded generated folders: `node_modules`, `.next`.

## Database Included

- `20260611_epm_postgresql_schema.sql`
- `20260611_epm_official_charter_standards.sql`
- `migrate-epm-database.sql`
- `001_performance_indexes.sql`
- `004_performance_optimization.sql`
- `test-epm-routes.ps1`

The standalone EPM runtime now uses PostgreSQL (`masarat_epm`) for the module database.
SQL Server scripts remain as inherited legacy references only.

## Official Standards Applied

Source Excel files:

- `/Volumes/Projects/قياس الاداء الاوظيفي/ميثاق الاداء الوظيفي غير اشرافي (2).xlsx`
- `/Volumes/Projects/قياس الاداء الاوظيفي/نموذج-ميثاق-الاداء-والتقييم-للوظيفة-الاشرافية-2-3-1439 (2).xlsx`

Applied areas:

- Backend `/api/epm/standards`
- Performance charter metadata fields
- Automatic competency template selection by `JobCategory`
- PostgreSQL `EmployeeSnapshots` for HR employee read-model integration
- HR sync endpoint `/api/epm/integrations/hr/sync`
- Frontend EPM dashboard
- Frontend EPM evaluations
- Frontend EPM goals
- Frontend EPM KPIs
- Frontend HR performance page

## Verification Notes

Backend build passed with two inherited NuGet vulnerability warnings in `Masarat.Core`:

- `OpenTelemetry.Exporter.Jaeger` 1.5.1
- `OpenTelemetry.Exporter.OpenTelemetryProtocol` 1.9.0

Frontend production build passed after installing packages with `npm ci --ignore-scripts`.
The normal `npm ci` path failed on this macOS machine because `msnodesqlv8` requires `unixODBC` native headers/libraries.
