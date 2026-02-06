@echo off
echo ========================================
echo    M-Swasth Deployment Script
echo ========================================
echo.

:: Bump version
echo [1/3] Bumping version...
node scripts/bumpVersion.js
if %errorlevel% neq 0 (
    echo ERROR: Version bump failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Deploying to Firebase...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo ERROR: Deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Deployment Complete!
echo ========================================
echo.
echo Users will automatically receive the update.
echo.
pause
