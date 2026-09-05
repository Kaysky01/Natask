<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;

class NaTaskApiTest extends TestCase
{
    public function test_user_can_login_and_receive_token(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@natask.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user' => ['id', 'name', 'email'],
                    'token',
                ],
            ]);
    }

    public function test_authenticated_user_can_fetch_projects(): void
    {
        $user = User::where('email', 'admin@natask.com')->first();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/projects');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'slug', 'status', 'priority', 'progress'],
                ],
            ]);
    }

    public function test_authenticated_user_can_fetch_dashboard(): void
    {
        $user = User::where('email', 'admin@natask.com')->first();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'stats' => ['active_projects', 'assigned_tasks', 'completed_tasks', 'overdue_tasks'],
                    'projects',
                    'my_tasks_due_soon',
                    'recent_activities',
                ],
            ]);
    }

    public function test_task_status_can_be_updated_for_kanban(): void
    {
        $user = User::where('email', 'admin@natask.com')->first();
        $token = $user->createToken('test')->plainTextToken;
        $task = Task::first();
        $newStatus = TaskStatus::where('project_id', $task->project_id)->where('id', '!=', $task->status_id)->first();

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson("/api/tasks/{$task->id}/status", [
                'status_id' => $newStatus->id,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertEquals($newStatus->id, $task->fresh()->status_id);
    }

    public function test_project_task_status_column_can_be_created_and_updated(): void
    {
        $user = User::where('email', 'admin@natask.com')->first();
        $token = $user->createToken('test')->plainTextToken;
        $project = Project::first();

        // 1. Create a new column
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/projects/{$project->id}/statuses", [
                'name' => 'QA Testing',
                'color' => '#EC4899',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'QA Testing',
                    'color' => '#EC4899',
                ],
            ]);

        $statusId = $response->json('data.id');

        // 2. Rename column
        $updateResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson("/api/projects/{$project->id}/statuses/{$statusId}", [
                'name' => 'Quality Assurance',
                'color' => '#8B5CF6',
            ]);

        $updateResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Quality Assurance',
                    'color' => '#8B5CF6',
                ],
            ]);
    }

    public function test_task_checklist_can_be_created_and_toggled(): void
    {
        $user = User::where('email', 'admin@natask.com')->first();
        $token = $user->createToken('test')->plainTextToken;
        $task = Task::first();

        // 1. Create checklist
        $resChecklist = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/tasks/{$task->id}/checklists", [
                'title' => 'Release Checklist',
            ]);

        $resChecklist->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'title' => 'Release Checklist',
                ],
            ]);

        $checklistId = $resChecklist->json('data.id');

        // 2. Add item to checklist
        $resItem = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/tasks/checklists/{$checklistId}/items", [
                'title' => 'Verify unit tests',
            ]);

        $resItem->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'title' => 'Verify unit tests',
                    'completed' => false,
                ],
            ]);

        $itemId = $resItem->json('data.id');

        // 3. Toggle checklist item
        $resToggle = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson("/api/tasks/checklist-items/{$itemId}", [
                'completed' => true,
            ]);

        $resToggle->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $itemId,
                    'completed' => true,
                ],
            ]);
    }

    public function test_google_callback_creates_new_user_with_avatar(): void
    {
        $email = 'new_google_' . uniqid() . '@natask.com';
        $abstractUser = \Mockery::mock(\Laravel\Socialite\Two\User::class);
        $abstractUser->shouldReceive('getId')->andReturn('google_unique_' . uniqid());
        $abstractUser->shouldReceive('getEmail')->andReturn($email);
        $abstractUser->shouldReceive('getName')->andReturn('Google Test User');
        $abstractUser->shouldReceive('getNickname')->andReturn(null);
        $abstractUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/a/new-avatar-url');

        $provider = \Mockery::mock(\Laravel\Socialite\Contracts\Provider::class);
        $provider->shouldReceive('stateless')->andReturnSelf();
        $provider->shouldReceive('user')->andReturn($abstractUser);

        \Laravel\Socialite\Facades\Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get('/api/auth/google/callback');

        $response->assertStatus(302);
        $location = $response->headers->get('Location');
        $this->assertStringContainsString('/auth/callback?token=', $location);

        $user = User::where('email', $email)->first();
        $this->assertNotNull($user);
        $this->assertEquals('Google Test User', $user->name);
        $this->assertEquals('https://lh3.googleusercontent.com/a/new-avatar-url', $user->avatar);
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_google_callback_updates_existing_user_avatar_and_google_id(): void
    {
        $email = 'existing_oauth_' . uniqid() . '@natask.com';
        $googleId = 'google_existing_' . uniqid();

        $existing = User::create([
            'name' => 'Existing User',
            'email' => $email,
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);

        $abstractUser = \Mockery::mock(\Laravel\Socialite\Two\User::class);
        $abstractUser->shouldReceive('getId')->andReturn($googleId);
        $abstractUser->shouldReceive('getEmail')->andReturn($email);
        $abstractUser->shouldReceive('getName')->andReturn('Existing User Updated');
        $abstractUser->shouldReceive('getNickname')->andReturn(null);
        $abstractUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/a/updated-avatar');

        $provider = \Mockery::mock(\Laravel\Socialite\Contracts\Provider::class);
        $provider->shouldReceive('stateless')->andReturnSelf();
        $provider->shouldReceive('user')->andReturn($abstractUser);

        \Laravel\Socialite\Facades\Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get('/api/auth/google/callback');

        $response->assertStatus(302);
        $this->assertStringContainsString('/auth/callback?token=', $response->headers->get('Location'));

        $fresh = $existing->fresh();
        $this->assertEquals($googleId, $fresh->google_id);
        $this->assertEquals('https://lh3.googleusercontent.com/a/updated-avatar', $fresh->avatar);
    }


    public function test_authenticated_user_can_upload_avatar(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');

        $user = User::where('email', 'admin@natask.com')->first();
        $token = $user->createToken('test_avatar')->plainTextToken;

        $file = \Illuminate\Http\UploadedFile::fake()->image('profile.jpg', 200, 200);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/avatar', [
                'avatar' => $file,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Avatar updated successfully',
            ]);

        $freshUser = $user->fresh();
        $this->assertNotNull($freshUser->avatar);
        $this->assertStringContainsString('avatars/' . $user->id, $freshUser->avatar);
    }

    public function test_owner_can_delete_project_but_admin_cannot(): void
    {
        $owner = User::create([
            'name' => 'Project Owner',
            'email' => 'owner_' . uniqid() . '@natask.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);
        $admin = User::create([
            'name' => 'Project Admin',
            'email' => 'admin_' . uniqid() . '@natask.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);

        $project = Project::create([
            'name' => 'Permission Test Project ' . uniqid(),
            'owner_id' => $owner->id,
            'status' => 'active',
            'priority' => 'medium',
        ]);
        $project->createDefaultStatuses();
        $project->members()->attach($admin->id, ['role' => 'admin']);

        $adminToken = $admin->createToken('admin_token')->plainTextToken;
        $ownerToken = $owner->createToken('owner_token')->plainTextToken;

        // Admin attempts to delete project -> 403 Forbidden
        $responseAdmin = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/projects/{$project->id}");
        $responseAdmin->assertStatus(403);

        // Owner deletes project -> 200 OK
        $responseOwner = $this->actingAs($owner, 'sanctum')
            ->deleteJson("/api/projects/{$project->id}");
        $responseOwner->assertStatus(200);
        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_admin_role_limitations_on_managing_members(): void
    {
        $owner = User::create([
            'name' => 'Owner User',
            'email' => 'owner_' . uniqid() . '@natask.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);
        $admin1 = User::create([
            'name' => 'Admin One',
            'email' => 'admin1_' . uniqid() . '@natask.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);
        $admin2 = User::create([
            'name' => 'Admin Two',
            'email' => 'admin2_' . uniqid() . '@natask.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);
        $member = User::create([
            'name' => 'Member User',
            'email' => 'member_' . uniqid() . '@natask.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);

        $project = Project::create([
            'name' => 'Admin Restrictions Project ' . uniqid(),
            'owner_id' => $owner->id,
            'status' => 'active',
            'priority' => 'medium',
        ]);
        $project->createDefaultStatuses();
        $project->members()->attach($admin1->id, ['role' => 'admin']);
        $project->members()->attach($admin2->id, ['role' => 'admin']);
        $project->members()->attach($member->id, ['role' => 'member']);

        // Admin cannot promote member to admin (422)
        $respPromote = $this->actingAs($admin1, 'sanctum')
            ->putJson("/api/projects/{$project->id}/members/{$member->id}", [
                'role' => 'admin',
            ]);
        $respPromote->assertStatus(422);

        // Admin can change member to viewer (200)
        $respDemote = $this->actingAs($admin1, 'sanctum')
            ->putJson("/api/projects/{$project->id}/members/{$member->id}", [
                'role' => 'viewer',
            ]);
        $respDemote->assertStatus(200);

        // Admin cannot kick fellow Admin (403)
        $respKickAdmin = $this->actingAs($admin1, 'sanctum')
            ->deleteJson("/api/projects/{$project->id}/members/{$admin2->id}");
        $respKickAdmin->assertStatus(403);

        // Admin cannot kick Owner (400 or 403)
        $respKickOwner = $this->actingAs($admin1, 'sanctum')
            ->deleteJson("/api/projects/{$project->id}/members/{$owner->id}");
        $respKickOwner->assertStatus(400);

        // Owner CAN kick fellow Admin (200)
        $respOwnerKickAdmin = $this->actingAs($owner, 'sanctum')
            ->deleteJson("/api/projects/{$project->id}/members/{$admin2->id}");
        $respOwnerKickAdmin->assertStatus(200);

        // Owner CAN promote member/viewer to Admin (200)
        $respOwnerPromote = $this->actingAs($owner, 'sanctum')
            ->putJson("/api/projects/{$project->id}/members/{$member->id}", [
                'role' => 'admin',
            ]);
        $respOwnerPromote->assertStatus(200);
    }

    public function test_viewer_has_strict_read_only_access(): void
    {
        $owner = User::create([
            'name' => 'Owner',
            'email' => 'owner_' . uniqid() . '@natask.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);
        $viewer = User::create([
            'name' => 'Viewer User',
            'email' => 'viewer_' . uniqid() . '@natask.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);

        $project = Project::create([
            'name' => 'Viewer Test Project ' . uniqid(),
            'owner_id' => $owner->id,
            'status' => 'active',
            'priority' => 'medium',
        ]);
        $project->createDefaultStatuses();
        $status = $project->taskStatuses()->first();
        $project->members()->attach($viewer->id, ['role' => 'viewer']);

        $task = Task::create([
            'project_id' => $project->id,
            'status_id' => $status->id,
            'creator_id' => $owner->id,
            'title' => 'Initial Task',
            'priority' => 'medium',
        ]);

        // Viewer can read project (200)
        $respShow = $this->actingAs($viewer, 'sanctum')
            ->getJson("/api/projects/{$project->id}");
        $respShow->assertStatus(200);

        // Viewer CANNOT create task (403)
        $respCreateTask = $this->actingAs($viewer, 'sanctum')
            ->postJson("/api/tasks", [
                'project_id' => $project->id,
                'title' => 'Viewer Created Task',
                'status_id' => $status->id,
                'priority' => 'medium',
            ]);
        $respCreateTask->assertStatus(403);

        // Viewer CANNOT update task (403)
        $respUpdateTask = $this->actingAs($viewer, 'sanctum')
            ->putJson("/api/tasks/{$task->id}", [
                'title' => 'Hacked title',
            ]);
        $respUpdateTask->assertStatus(403);

        // Viewer CANNOT update task status (403)
        $respStatus = $this->actingAs($viewer, 'sanctum')
            ->putJson("/api/tasks/{$task->id}/status", [
                'status_id' => $status->id,
            ]);
        $respStatus->assertStatus(403);

        // Viewer CANNOT add comment (403)
        $respComment = $this->actingAs($viewer, 'sanctum')
            ->postJson("/api/tasks/{$task->id}/comments", [
                'content' => 'Viewer comment',
            ]);
        $respComment->assertStatus(403);

        // Viewer CANNOT delete task (403)
        $respDeleteTask = $this->actingAs($viewer, 'sanctum')
            ->deleteJson("/api/tasks/{$task->id}");
        $respDeleteTask->assertStatus(403);
    }

    public function test_invitation_expires_in_10_minutes_and_can_be_regenerated(): void
    {
        $owner = User::create([
            'name' => 'Owner Invite',
            'email' => 'owner_inv_' . uniqid() . '@natask.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);
        $guest = User::create([
            'name' => 'Guest User',
            'email' => 'guest_' . uniqid() . '@natask.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);

        $project = Project::create([
            'name' => 'Invite 10 Min Project ' . uniqid(),
            'owner_id' => $owner->id,
            'status' => 'active',
            'priority' => 'medium',
        ]);
        $project->createDefaultStatuses();

        // 1. Owner creates invitation
        $respCreate = $this->actingAs($owner, 'sanctum')
            ->postJson("/api/projects/{$project->id}/invitations", [
                'role' => 'member',
            ]);

        $respCreate->assertStatus(201);
        $respCreate->assertJson([
            'success' => true,
            'data' => [
                'role' => 'member',
                'expires_in_seconds' => 600,
            ],
        ]);

        $inviteUrl = $respCreate->json('data.url');
        $token = basename($inviteUrl);

        // 2. Guest previews invitation
        $respPreview = $this->getJson("/api/invitations/{$token}/preview");
        $respPreview->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'role' => 'member',
                    'project' => [
                        'id' => $project->id,
                    ],
                ],
            ]);

        // 3. Guest accepts invitation
        $respAccept = $this->actingAs($guest, 'sanctum')
            ->postJson("/api/invitations/{$token}/accept");

        $respAccept->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'role' => 'member',
                    'already_member' => false,
                ],
            ]);

        $this->assertTrue($project->fresh()->members()->where('user_id', $guest->id)->exists());

        // 4. Accepting again when already a member should succeed gracefully (already_member: true)
        $respAcceptAgain = $this->actingAs($guest, 'sanctum')
            ->postJson("/api/invitations/{$token}/accept");

        $respAcceptAgain->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'already_member' => true,
                ],
            ]);

        // 5. Test expired invitation (> 10 minutes)
        $expiredToken = \Illuminate\Support\Str::random(64);
        \App\Models\ProjectInvitation::create([
            'project_id' => $project->id,
            'invited_by' => $owner->id,
            'role' => 'viewer',
            'token_hash' => hash('sha256', $expiredToken),
            'expires_at' => now()->subMinute(), // expired
        ]);

        $otherUser = User::create([
            'name' => 'Other User',
            'email' => 'other_' . uniqid() . '@natask.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);

        $respExpired = $this->actingAs($otherUser, 'sanctum')
            ->postJson("/api/invitations/{$expiredToken}/accept");
        $respExpired->assertStatus(404);

        // 6. Test 'never' expires invitation
        $respNever = $this->actingAs($owner, 'sanctum')
            ->postJson("/api/projects/{$project->id}/invitations", [
                'role' => 'viewer',
                'expires_in' => 'never',
            ]);
        $respNever->assertStatus(201);
        $respNever->assertJson([
            'success' => true,
            'data' => [
                'role' => 'viewer',
                'expires_at' => null,
                'expires_in_seconds' => null,
            ],
        ]);
        $neverToken = basename($respNever->json('data.url'));
        $respNeverAccept = $this->actingAs($otherUser, 'sanctum')
            ->postJson("/api/invitations/{$neverToken}/accept");
        $respNeverAccept->assertStatus(200);
        $this->assertTrue($project->fresh()->members()->where('user_id', $otherUser->id)->exists());

        // 7. Test '5m' expires invitation
        $resp5m = $this->actingAs($owner, 'sanctum')
            ->postJson("/api/projects/{$project->id}/invitations", [
                'role' => 'member',
                'expires_in' => '5m',
            ]);
        $resp5m->assertStatus(201);
        $resp5m->assertJson([
            'success' => true,
            'data' => [
                'expires_in_seconds' => 300,
            ],
        ]);

        // 8. Test '15m' expires invitation
        $resp15m = $this->actingAs($owner, 'sanctum')
            ->postJson("/api/projects/{$project->id}/invitations", [
                'role' => 'member',
                'expires_in' => '15m',
            ]);
        $resp15m->assertStatus(201);
        $resp15m->assertJson([
            'success' => true,
            'data' => [
                'expires_in_seconds' => 900,
            ],
        ]);
    }

    public function test_fonnte_whatsapp_integration_lifecycle_and_owner_permissions(): void
    {
        \Illuminate\Support\Facades\Http::fake([
            'https://api.fonnte.com/*' => \Illuminate\Support\Facades\Http::response([
                'status' => true,
                'device' => '628123456789',
                'name' => 'Test Bot Device',
                'target' => ['628123456789'],
            ], 200),
        ]);

        $owner = User::create([
            'name' => 'Fonnte Owner',
            'email' => 'fonnte_owner_' . uniqid() . '@natask.com',
            'phone' => '081234567890',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);

        $member = User::create([
            'name' => 'Fonnte Member',
            'email' => 'fonnte_member_' . uniqid() . '@natask.com',
            'phone' => '089876543210',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);

        $project = Project::create([
            'name' => 'Fonnte WhatsApp Project ' . uniqid(),
            'owner_id' => $owner->id,
            'status' => 'active',
            'priority' => 'medium',
        ]);
        $project->createDefaultStatuses();
        $project->members()->attach($member->id, ['role' => 'member']);

        // 1. Member tries to get Fonnte settings -> 403 Forbidden
        $respMemberGet = $this->actingAs($member, 'sanctum')
            ->getJson("/api/projects/{$project->id}/fonnte");
        $respMemberGet->assertStatus(403);

        // 2. Owner gets default Fonnte settings -> 200 OK
        $respOwnerGet = $this->actingAs($owner, 'sanctum')
            ->getJson("/api/projects/{$project->id}/fonnte");
        $respOwnerGet->assertStatus(200);
        $respOwnerGet->assertJson([
            'success' => true,
            'data' => [
                'is_enabled' => false,
                'target_type' => 'group',
            ],
        ]);

        // 3. Member tries to update Fonnte settings -> 403 Forbidden
        $respMemberUpdate = $this->actingAs($member, 'sanctum')
            ->postJson("/api/projects/{$project->id}/fonnte", [
                'is_enabled' => true,
                'api_token' => 'sample_token_123',
                'target_type' => 'group',
            ]);
        $respMemberUpdate->assertStatus(403);

        // 4. Owner updates Fonnte settings -> 200 OK
        $respOwnerUpdate = $this->actingAs($owner, 'sanctum')
            ->postJson("/api/projects/{$project->id}/fonnte", [
                'is_enabled' => true,
                'api_token' => 'secret_fonnte_api_token_xyz',
                'api_endpoint' => 'https://api.fonnte.com/send',
                'target_type' => 'both',
                'group_target' => '120363028392819@g.us',
                'notify_task_created' => true,
                'notify_task_status_changed' => true,
                'notify_task_commented' => true,
                'notify_member_joined' => true,
            ]);
        $respOwnerUpdate->assertStatus(200);
        $respOwnerUpdate->assertJson([
            'success' => true,
            'data' => [
                'is_enabled' => true,
                'is_token_set' => true,
                'target_type' => 'both',
                'group_target' => '120363028392819@g.us',
            ],
        ]);

        // 5. Check device status
        $respCheck = $this->actingAs($owner, 'sanctum')
            ->postJson("/api/projects/{$project->id}/fonnte/check-device");
        $respCheck->assertStatus(200);

        // 6. Test send message
        $respTestSend = $this->actingAs($owner, 'sanctum')
            ->postJson("/api/projects/{$project->id}/fonnte/test-send", [
                'target' => '081234567890',
            ]);
        $respTestSend->assertStatus(200);

        // 7. Verify Task creation triggers notification without error
        $todoStatus = $project->taskStatuses()->where('name', 'To Do')->first();
        $doneStatus = $project->taskStatuses()->where('name', 'Done')->first();

        $respTask = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/tasks', [
                'project_id' => $project->id,
                'title' => 'Fonnte Auto Notification Task',
                'status_id' => $todoStatus->id,
                'assignee_ids' => [$member->id],
            ]);
        $respTask->assertStatus(201);
        $taskId = $respTask->json('data.id');

        // 8. Verify Task status change triggers notification
        $respStatusChange = $this->actingAs($member, 'sanctum')
            ->putJson("/api/tasks/{$taskId}", [
                'status_id' => $doneStatus->id,
            ]);
        $respStatusChange->assertStatus(200);

        // 9. Verify Comment creation triggers notification
        $respComment = $this->actingAs($member, 'sanctum')
            ->postJson("/api/tasks/{$taskId}/comments", [
                'body' => 'Komentar pengujian notifikasi WhatsApp!',
            ]);
        $respComment->assertStatus(201);
    }
}




