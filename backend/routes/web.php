<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return response()->json([
        'message' => 'NaTask API is running',
        'version' => '1.0.0',
        'endpoints' => [
            'api' => '/api',
            'auth' => '/auth',
            'docs' => '/docs (coming soon)',
        ]
    ]);
});

// Google OAuth routes (web routes for proper redirects)
Route::prefix('auth')->group(function () {
    Route::get('google', [AuthController::class, 'redirectToGoogle']);
    Route::get('google/redirect', [AuthController::class, 'redirectToGoogle']);
    Route::get('google/callback', [AuthController::class, 'handleGoogleCallback']);
});

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'environment' => app()->environment(),
    ]);
});

// CSRF token endpoint for SPA
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});