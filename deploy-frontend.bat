@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo Building frontend...
echo ========================================
call npm run build
if errorlevel 1 (
    echo.
    echo Build failed. Deployment stopped.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deploying dist to CloudBase hosting...
echo ========================================
call npx --yes -p @cloudbase/cli cloudbase hosting deploy ./dist -e xkdn-9g0lbgfyc7310777
if errorlevel 1 (
    echo.
    echo Deployment failed.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deployment completed.
echo ========================================
pause
