# نشر نظام قياس الأداء الوظيفي — بورت 9050 (2026-06-11)

## البنية على هذا السيرفر

| المكوّن | المكان | المنفذ |
|---|---|---|
| EPM API (.NET 8) | موقع IIS `epm-api` → `D:\Newmasar\Masarat-EMP-KPI\.deploy\publish\api` | `127.0.0.1:5063` |
| واجهة EPM (Next.js) | مهمة مجدولة `EPM-Frontend` → `.deploy\start-frontend.ps1` | `localhost:3008` |
| بروكسي IIS | موقع `EPM` → `.deploy\proxy\web.config` | `*:9050` |
| قاعدة البيانات | PostgreSQL 16 محلي `masarat_epm` (مالك `masarat`) | 5432 |

> **تنبيه مهم — قاعدة البيانات**: وضع التهيئة `EnsureCreated` (في `appsettings.Production.json`).
> لا تحوّله إلى `Migrate` أبداً: ملف الـ migration `InitialCreate` مولّد لـ SQL Server
> (nvarchar/GETDATE) ويفشل على PostgreSQL.

> **تنبيه — البروكسي**: كل مسارات `/api` تذهب إلى **الواجهة** (3008) لا إلى الباك إند،
> لأن NextAuth (`/api/auth`) وبروكسي `/api/epm/[...path]` يعيشان في الواجهة وهي
> تمرر بنفسها إلى 5063 بتوكن محلي. فقط `/swagger` و`/health` يمران مباشرة للباك إند.

## التكامل مع نظام الموارد (MasaratHR)

- **مزامنة الموظفين**: EPM يسحب من `GET http://127.0.0.1:5061/api/hr/employees`
  (مفتاح خدمة `X-Service-ApiKey` = `EpmIntegration:FeedApiKey` في إعدادات الموارد).
  تُشغَّل تلقائياً كل 30 دقيقة من `EpmSyncHostedService` في الموارد، أو يدوياً:
  `POST /api/epm/integrations/hr/sync` (بتوكن EPM) أو `POST /api/epm-bridge/sync` (من الموارد).
- **المعرفات**: معرف الموظف في EPM = الرقم الوظيفي (رقمي). المدير = مدير الوحدة
  التنظيمية، ومدير الوحدة يتبع مدير الوحدة الأم.
- **جسر بوابة الموظف**: `/api/epm-bridge/*` في الموارد (ملخص/مهام/قبول/تقدم/تمديد/
  نماذج أسئلة/مهام الفريق/SSO) — يستدعي EPM بتوكن خدمة HS256 بالمفتاح المشترك.
- **الدخول الموحّد**: الموارد تصدر تذكرة دقيقتين (`EpmIntegration:SsoSecret` =
  `HR_SSO_SECRET` في `frontend\.env.production`) → `http://10.22.184.254:9050/sso?ticket=…`
  → مزوّد NextAuth `hr-sso`.
- **المؤشرات التشغيلية** (تُعرض في بوابة الموظف وتدخل في النسبة الكلية):
  - الحضور: من قاعدة الموارد مباشرة (أيام الالتزام/الحضور منذ بداية السنة).
  - المستودعات: `http://127.0.0.1:8087/api/employees/{n}/assets` بمفتاح wh-feed.
  - سداد: `http://127.0.0.1:5062/api/portal-feed/employee-stats/{n}` بمفتاح PortalFeed.
- **الوزن الكلي**: درجة الميثاق/التقييم 50% + إنجاز المهام 30% + التشغيلي 20%
  (يُعاد التوزيع على المتاح فقط).

## الأسرار

كل القيم الحية في:
- الموارد: `D:\Newmasar\Archive\MasaratHR\.deploy\publish\api\appsettings.PostgreSQL.json`
  (قسم `EpmIntegration` + `Integrations:SadadFeed` + `Integrations:Warehouse`) —
  **لا يُستبدل هذا الملف عند النشر** (مستثنى من robocopy، نسخة احتياطية `.bak-epm`).
- EPM API: `.deploy\publish\api\appsettings.Production.json` (نسخة مطابقة في المصدر).
- واجهة EPM: `frontend\.env.production`.

## إعادة النشر

```powershell
# الباك إند
dotnet publish backend\modules\epm\Masarat.EPM.API\Masarat.EPM.API.csproj -c Release -o .deploy\publish\api
%windir%\system32\inetsrv\appcmd recycle apppool /apppool.name:"epm-api"

# الواجهة (npm على هذا السيرفر متقلب — أعد المحاولة عند ECONNRESET)
cd frontend; npm install --ignore-scripts; node node_modules\next\dist\bin\next build
Stop-ScheduledTask EPM-Frontend; Start-ScheduledTask EPM-Frontend
```

## إشعارات الموارد

أحداث SignalR من خدمة المزامنة: `EpmTaskAssigned` (للموظف عند إسناد مهمة جديدة، P1)
و`EpmExtensionRequested` (لمدير المهمة، P2) — مسجلة في `useHrRealtime.knownEvents`.
