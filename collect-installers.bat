@echo off
title Elana AI Installer Collector
echo ========================================
echo 🚀 Elana AI - Windows Installer Collector
echo ========================================

:: Get version from package.json
set VERSION=
for /f "tokens=2 delims=:, " %%a in ('findstr /c:"\"version\":" package.json') do (
    set VERSION=%%~a
)

if "%VERSION%"=="" (
    echo ❌ Error: Could not determine version from package.json.
    pause
    exit /b 1
)

echo [i] Current Version detected: %VERSION%
echo.

:: Create installers directory
if not exist "instaladores" (
    mkdir "instaladores"
)

:: Define source files
set MSI_SRC=src-tauri\target\release\bundle\msi\elana_%VERSION%_x64_en-US.msi
set NSIS_SRC=src-tauri\target\release\bundle\nsis\elana_%VERSION%_x64-setup.exe
set APK_SRC=src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release.apk

:: Copy MSI
if exist "%MSI_SRC%" (
    copy /y "%MSI_SRC%" "instaladores\" >nul
    echo ✓ Copied Windows MSI: elana_%VERSION%_x64_en-US.msi
) else (
    echo ⚠️ Warning: Windows MSI installer not found.
)

:: Copy NSIS EXE
if exist "%NSIS_SRC%" (
    copy /y "%NSIS_SRC%" "instaladores\" >nul
    echo ✓ Copied Windows EXE: elana_%VERSION%_x64-setup.exe
) else (
    echo ⚠️ Warning: Windows NSIS EXE installer not found.
)

:: Copy Android APK
if exist "%APK_SRC%" (
    copy /y "%APK_SRC%" "instaladores\elana-%VERSION%.apk" >nul
    echo ✓ Copied ^& Renamed Android APK: elana-%VERSION%.apk
) else (
    echo ⚠️ Warning: Android APK installer not found.
)

echo ----------------------------------------
echo 🎉 Collection complete!
echo Files ready in: instaladores\
echo.
dir "instaladores"
echo ========================================
