@echo off
chcp 65001 >nul
echo.
echo ══════════════════════════════════════════════
echo   تثبيت وكيل مزامنة البصمة كخدمة Windows
echo ══════════════════════════════════════════════
echo.

:: Check for admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [خطأ] يجب تشغيل هذا الملف كمسؤول (Run as Administrator)
    pause
    exit /b 1
)

:: Check Node.js
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [خطأ] Node.js غير مثبت. حمّله من https://nodejs.org
    pause
    exit /b 1
)

:: Check nssm
where nssm >nul 2>&1
if %errorLevel% neq 0 (
    echo [تحذير] NSSM غير مثبت. جاري التحميل...
    echo حمّل NSSM من https://nssm.cc/download ثم ضعه في PATH
    pause
    exit /b 1
)

set AGENT_DIR=%~dp0
set SERVICE_NAME=MasaratBiometricAgent

:: Remove existing service if any
nssm stop %SERVICE_NAME% >nul 2>&1
nssm remove %SERVICE_NAME% confirm >nul 2>&1

:: Install service
echo جاري تثبيت الخدمة...
nssm install %SERVICE_NAME% node "%AGENT_DIR%masarat-agent.js"
nssm set %SERVICE_NAME% AppDirectory "%AGENT_DIR%"
nssm set %SERVICE_NAME% DisplayName "Masarat Biometric Agent"
nssm set %SERVICE_NAME% Description "وكيل مزامنة أجهزة البصمة مع منصة مسارات"
nssm set %SERVICE_NAME% Start SERVICE_AUTO_START
nssm set %SERVICE_NAME% AppStdout "%AGENT_DIR%service-stdout.log"
nssm set %SERVICE_NAME% AppStderr "%AGENT_DIR%service-stderr.log"
nssm set %SERVICE_NAME% AppRotateFiles 1
nssm set %SERVICE_NAME% AppRotateBytes 5242880

:: Start service
nssm start %SERVICE_NAME%

echo.
echo ══════════════════════════════════════════════
echo   تم تثبيت الخدمة وتشغيلها بنجاح!
echo   اسم الخدمة: %SERVICE_NAME%
echo.
echo   أوامر مفيدة:
echo     nssm status %SERVICE_NAME%
echo     nssm restart %SERVICE_NAME%
echo     nssm stop %SERVICE_NAME%
echo     nssm remove %SERVICE_NAME% confirm
echo ══════════════════════════════════════════════
pause
