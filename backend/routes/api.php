<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProjectController;
use App\Http\Controllers\API\ProjectFonnteController;
use App\Http\Controllers\API\TaskController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\ActivityController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('register', [AuthController::class, 'register']);
    Route::get('google', [AuthController::class, 'redirectToGoogle']);
    Route::get('google/callback', [AuthController::class, 'handleGoogleCallback']);
});

Route::get('invitations/{token}/preview', [ProjectController::class, 'previewInvitation']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Current user
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::put('profile', [AuthController::class, 'updateProfile']);
        Route::post('avatar', [AuthController::class, 'updateAvatar']);
    });

    // Users
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('{user}', [UserController::class, 'show']);
        Route::get('search/{query}', [UserController::class, 'search']);
    });

    // Projects
    Route::prefix('projects')->group(function () {
        Route::get('/', [ProjectController::class, 'index']);
        Route::post('/', [ProjectController::class, 'store']);
        Route::get('{project}', [ProjectController::class, 'show']);
        Route::put('{project}', [ProjectController::class, 'update']);
        Route::delete('{project}', [ProjectController::class, 'destroy']);
        Route::get('{project}/tasks', [TaskController::class, 'projectTasks']);
        
        // Project members
        Route::get('{project}/members', [ProjectController::class, 'members']);
        Route::post('{project}/members', [ProjectController::class, 'addMember']);
        Route::post('{project}/invitations', [ProjectController::class, 'createInvitation']);
        Route::put('{project}/members/{user}', [ProjectController::class, 'updateMemberRole']);
        Route::delete('{project}/members/{user}', [ProjectController::class, 'removeMember']);
        
        // Project labels
        Route::get('{project}/labels', [ProjectController::class, 'labels']);
        Route::post('{project}/labels', [ProjectController::class, 'storeLabel']);
        Route::put('{project}/labels/{label}', [ProjectController::class, 'updateLabel']);
        Route::delete('{project}/labels/{label}', [ProjectController::class, 'destroyLabel']);
        
        // Project task statuses
        Route::get('{project}/statuses', [ProjectController::class, 'taskStatuses']);
        Route::post('{project}/statuses', [ProjectController::class, 'storeTaskStatus']);
        Route::put('{project}/statuses/reorder', [ProjectController::class, 'reorderTaskStatuses']);
        Route::put('{project}/statuses/{status}', [ProjectController::class, 'updateTaskStatus']);
        Route::delete('{project}/statuses/{status}', [ProjectController::class, 'destroyTaskStatus']);
        Route::post('{project}/setup-defaults', [ProjectController::class, 'setupDefaults']);

        // Project Fonnte WhatsApp integration (Owner only)
        Route::get('{project}/fonnte', [ProjectFonnteController::class, 'getSettings']);
        Route::post('{project}/fonnte', [ProjectFonnteController::class, 'updateSettings']);
        Route::post('{project}/fonnte/check-device', [ProjectFonnteController::class, 'checkDevice']);
        Route::post('{project}/fonnte/test-send', [ProjectFonnteController::class, 'testSend']);
    });

    Route::post('invitations/{token}/accept', [ProjectController::class, 'acceptInvitation']);

    // Tasks
    Route::prefix('tasks')->group(function () {
        Route::get('/', [TaskController::class, 'index']);
        Route::post('/', [TaskController::class, 'store']);
        Route::get('{task}', [TaskController::class, 'show']);
        Route::put('{task}', [TaskController::class, 'update']);
        Route::delete('{task}', [TaskController::class, 'destroy']);
        
        // Task assignments
        Route::post('{task}/assign', [TaskController::class, 'assign']);
        Route::delete('{task}/assign/{user}', [TaskController::class, 'unassign']);
        
        // Task labels
        Route::post('{task}/labels', [TaskController::class, 'attachLabels']);
        Route::delete('{task}/labels/{label}', [TaskController::class, 'detachLabel']);
        
        // Task status and position
        Route::put('{task}/status', [TaskController::class, 'updateStatus']);
        Route::put('{task}/position', [TaskController::class, 'updatePosition']);
        
        // Checklists
        Route::get('{task}/checklists', [TaskController::class, 'checklists']);
        Route::post('{task}/checklists', [TaskController::class, 'storeChecklist']);
        Route::put('checklists/{checklist}', [TaskController::class, 'updateChecklist']);
        Route::delete('checklists/{checklist}', [TaskController::class, 'destroyChecklist']);
        
        // Checklist items
        Route::post('checklists/{checklist}/items', [TaskController::class, 'storeChecklistItem']);
        Route::put('checklist-items/{item}', [TaskController::class, 'updateChecklistItem']);
        Route::delete('checklist-items/{item}', [TaskController::class, 'destroyChecklistItem']);
        
        // Comments
        Route::get('{task}/comments', [TaskController::class, 'comments']);
        Route::post('{task}/comments', [TaskController::class, 'storeComment']);
        Route::put('comments/{comment}', [TaskController::class, 'updateComment']);
        Route::delete('comments/{comment}', [TaskController::class, 'destroyComment']);
        
        // Attachments
        Route::get('{task}/attachments', [TaskController::class, 'attachments']);
        Route::post('{task}/attachments', [TaskController::class, 'storeAttachment']);
        Route::delete('attachments/{attachment}', [TaskController::class, 'destroyAttachment']);
        Route::get('attachments/{attachment}/download', [TaskController::class, 'downloadAttachment']);
    });

    // Activities
    Route::prefix('activities')->group(function () {
        Route::get('/', [ActivityController::class, 'index']);
        Route::get('projects/{project}', [ActivityController::class, 'projectActivities']);
    });

    // Dashboard data
    Route::prefix('dashboard')->group(function () {
        Route::get('/', [ActivityController::class, 'dashboard']);
        Route::get('stats', [ActivityController::class, 'stats']);
    });
});