@echo off
rem Window Opacity Control pack: bundle extension -> build vsix -> auto install
rem NOTE: bump VER together with extension\package.json version
rem Pack uses pack.ps1 (PowerShell ZipArchive) because tar treats [Content_Types].xml as a glob pattern
setlocal
cd /d "%~dp0"
set VER=1.0.1

if not exist dist mkdir dist
powershell -NoProfile -ExecutionPolicy Bypass -File pack.ps1 -Version %VER%
if errorlevel 1 (echo vsix failed & exit /b 1)
if not exist dist\window-opacity-control-%VER%.vsix (echo vsix failed & exit /b 1)

rem ---- auto install ----
where code >nul 2>nul
if errorlevel 1 (
    echo [WARN] code CLI not found - install manually: dist\window-opacity-control-%VER%.vsix
) else (
    code --install-extension dist\window-opacity-control-%VER%.vsix --force
    if errorlevel 1 (echo install failed & exit /b 1) else (echo INSTALLED: window-opacity-control-%VER% - Reload Window to activate)
)
