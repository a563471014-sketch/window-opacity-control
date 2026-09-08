@echo off
rem Window Opacity Control pack: bundle extension -> build vsix -> auto install
rem NOTE: bump VER together with extension\package.json version
setlocal
cd /d "%~dp0"
set VER=1.0.0

if not exist vsix mkdir vsix
if not exist dist mkdir dist
if exist vsix-build rmdir /s /q vsix-build
mkdir vsix-build
xcopy /e /i /y extension vsix-build\extension\ >nul
copy /Y vsix\[Content_Types].xml vsix-build\ >nul
copy /Y vsix\extension.vsixmanifest vsix-build\ >nul
tar --format zip -cf dist\window-opacity-control-%VER%.vsix -C vsix-build [Content_Types].xml extension.vsixmanifest extension
if exist dist\window-opacity-control-%VER%.vsix (echo OK: dist\window-opacity-control-%VER%.vsix) else (echo vsix failed & exit /b 1)

rem ---- auto install ----
where code >nul 2>nul
if errorlevel 1 (
    echo [WARN] code CLI not found - install manually: dist\window-opacity-control-%VER%.vsix
) else (
    code --install-extension dist\window-opacity-control-%VER%.vsix --force
    if errorlevel 1 (echo install failed & exit /b 1) else (echo INSTALLED: window-opacity-control-%VER% - Reload Window to activate)
)
