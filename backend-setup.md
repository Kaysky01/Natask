# Backend Setup Guide - Laravel API

## Prerequisites
1. **PHP 8.1+** - Make sure PHP is installed and in PATH
2. **Composer** - PHP dependency manager
3. **MySQL** - Database server (or MariaDB)

## Setup Steps

### 1. Create Laravel Project
```bash
composer create-project laravel/laravel backend
cd backend
```

### 2. Install Required Packages
```bash
composer require laravel/sanctum
composer require laravel/socialite
composer require guzzlehttp/guzzle
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and update:

```env
APP_NAME=NaTask
APP_ENV=local
APP_KEY=base64:your-app-key-here
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=natask
DB_USERNAME=root
DB_PASSWORD=

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Session and Sanctum
SESSION_DRIVER=cookie
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

### 4. Database Setup
```bash
# Create database
mysql -u root -p
CREATE DATABASE natask;
EXIT;

# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate
```

### 5. Configure Sanctum
```bash
# Publish Sanctum config
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# Run Sanctum migrations
php artisan migrate
```

### 6. Configure CORS
Update `config/cors.php`:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie', 'auth/*'],
'allowed_methods' => ['*'],
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```

### 7. Configure Socialite
Add to `config/services.php`:
```php
'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_REDIRECT_URI'),
],
```

### 8. Start Development Server
```bash
php artisan serve --host=0.0.0.0 --port=8000
```

## Project Structure
```
backend/
├── app/
│   ├── Http/Controllers/
│   │   ├── API/
│   │   └── Auth/
│   ├── Models/
│   ├── Middleware/
│   └── Providers/
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   ├── api.php
│   ├── web.php
│   └── auth.php
└── config/
```

## API Endpoints Structure
- `/api/auth/*` - Authentication endpoints
- `/api/projects/*` - Project management
- `/api/tasks/*` - Task management
- `/api/users/*` - User management
- `/api/activities/*` - Activity tracking

## Next Steps After Setup
1. Create database migrations for all tables (see DATABASE.md)
2. Create models with relationships
3. Set up API controllers
4. Configure authentication middleware
5. Implement Google OAuth flow

## VPS Production Google Login

Use the public HTTPS domains in both Google Cloud Console and the backend environment:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.example.com
FRONTEND_URL=https://app.example.com
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_REDIRECT_URI=https://api.example.com/api/auth/google/callback
LOGIN_RATE_LIMIT=5
```

In Google Cloud Console, add this exact URI under **Authorized redirect URIs**:

```text
https://api.example.com/api/auth/google/callback
```

Set the frontend environment to the public API:

```env
VITE_API_URL=https://api.example.com/api
VITE_REVERB_HOST=api.example.com
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=https
```

After changing production environment values, run:

```bash
php artisan config:clear
php artisan config:cache
php artisan migrate --force
php artisan queue:restart
```

Keep `GOOGLE_CLIENT_SECRET`, `APP_KEY`, and database credentials only in the VPS environment; never commit them to the repository.