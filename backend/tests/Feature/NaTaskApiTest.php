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
}

