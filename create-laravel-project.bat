@echo off
echo Creating Laravel project for NaTask backend...
echo.

REM Check if composer is available
where composer >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Composer not found. Please install Composer first.
    echo Download from: https://getcomposer.org/download/
    pause
    exit /b 1
)

REM Check if PHP is available
where php >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PHP not found. Please install PHP first or start Laragon.
    pause
    exit /b 1
)

echo Creating Laravel project...
composer create-project laravel/laravel backend

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create Laravel project
    pause
    exit /b 1
)

echo.
echo Installing required packages...
cd backend

composer require laravel/sanctum
composer require laravel/socialite
composer require guzzlehttp/guzzle

echo.
echo Setup completed!
echo.
echo Next steps:
echo 1. Copy .env.example to .env in the backend folder
echo 2. Update database configuration in .env
echo 3. Run: php artisan key:generate
echo 4. Create database 'natask' in MySQL
echo 5. Run: php artisan migrate
echo 6. Start server: php artisan serve
echo.
pause