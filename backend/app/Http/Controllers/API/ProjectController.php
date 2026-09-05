<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\TaskStatus;
use App\Models\Label;
use App\Models\User;
use App\Models\Activity;
use App\Models\ProjectInvitation;
use App\Events\ProjectChanged;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    /**
     * Display a listing of projects the user is involved in.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Project::query()
            ->where(function ($q) use ($user) {
                $q->where('owner_id', $user->id)
                  ->orWhereHas('members', function ($mq) use ($user) {
                      $mq->where('user_id', $user->id);
                  });
            })
            ->with(['owner:id,name,email,avatar', 'members:id,name,email,avatar', 'taskStatuses'])
            ->withCount(['tasks', 'tasks as completed_tasks_count' => function ($q) {
                $q->whereHas('status', function ($sq) {
                    $sq->whereIn('name', ['Done', 'Completed']);
                });
            }]);

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('priority') && $request->priority) {
            $query->where('priority', $request->priority);
        }

        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $projects = $query->latest()->get();

        // Calculate progress percentage for each project
        $projects->transform(function ($project) {
            $total = $project->tasks_count;
            $completed = $project->completed_tasks_count;
            $project->progress = $total > 0 ? round(($completed / $total) * 100) : 0;
            return $project;
        });

        return response()->json([
            'success' => true,
            'data' => $projects,
        ]);
    }

    /**
     * Store a newly created project.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'status' => 'sometimes|in:planning,active,on_hold,completed,archived',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $baseSlug = Str::slug($request->name);
        $slug = $baseSlug;
        $counter = 1;
        while (Project::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter++;
        }

        $project = Project::create([
            'name' => $request->name,
            'slug' => $slug,
            'description' => $request->description,
            'owner_id' => $user->id,
            'status' => $request->status ?? 'active',
            'priority' => $request->priority ?? 'medium',
            'start_date' => $request->start_date,
            'due_date' => $request->due_date,
        ]);

        // Log activity
        Activity::log('project_created', $project, $user, ['name' => $project->name]);
        ProjectChanged::dispatch($project, 'project.created');

        $project->load(['owner:id,name,email,avatar', 'members:id,name,email,avatar', 'taskStatuses']);

        return response()->json([
            'success' => true,
            'message' => 'Project created successfully',
            'data' => $project,
        ], 201);
    }

    /**
     * Display the specified project.
     */
    public function show(Request $request, Project $project): JsonResponse
    {
        $this->authorizeMember($request->user(), $project);

        // Auto-provision default task statuses if project has none
        if ($project->taskStatuses()->count() === 0) {
            $project->createDefaultStatuses();
        }

        $project->load([
            'owner:id,name,email,avatar',
            'members:id,name,email,avatar',
            'taskStatuses' => function ($q) {
                $q->orderBy('position');
            },
            'labels',
            'tasks' => function ($q) {
                $q->with([
                    'status',
                    'assignees:id,name,email,avatar',
                    'labels',
                    'checklists.items',
                ])
                ->withCount(['comments', 'attachments'])
                ->orderBy('position');
            }
        ]);

        $totalTasks = $project->tasks->count();
        $completedTasks = $project->tasks->filter(function ($t) {
            return in_array(strtolower($t->status?->name ?? ''), ['done', 'completed']);
        })->count();

        $project->progress = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0;

        return response()->json([
            'success' => true,
            'data' => $project,
        ]);
    }

    /**
     * Update the specified project.
     */
    public function update(Request $request, Project $project): JsonResponse
    {
        $this->authorizeAdmin($request->user(), $project);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'status' => 'sometimes|in:planning,active,on_hold,completed,archived',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $project->update($request->only([
            'name', 'description', 'status', 'priority', 'start_date', 'due_date'
        ]));

        Activity::log('project_updated', $project, $request->user(), ['name' => $project->name]);
        ProjectChanged::dispatch($project, 'project.updated');

        return response()->json([
            'success' => true,
            'message' => 'Project updated successfully',
            'data' => $project->fresh(['owner:id,name,email,avatar', 'members:id,name,email,avatar', 'taskStatuses']),
        ]);
    }

    /**
     * Remove the specified project.
     */
    public function destroy(Request $request, Project $project): JsonResponse
    {
        $this->authorizeOwner($request->user(), $project);

        DB::transaction(function () use ($project) {
            // Tasks must be removed before statuses because task.status_id is restrictive.
            $project->tasks()->get()->each->delete();
            $project->taskStatuses()->delete();
            $project->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Project deleted successfully',
        ]);
    }


    /**
     * List members of a project.
     */
    public function members(Request $request, Project $project): JsonResponse
    {
        $this->authorizeMember($request->user(), $project);

        $members = $project->members()->get();

        return response()->json([
            'success' => true,
            'data' => $members,
        ]);
    }

    /**
     * Add a member to a project.
     */
    public function addMember(Request $request, Project $project): JsonResponse
    {
        $this->authorizeAdmin($request->user(), $project);

        $isOwner = $project->owner_id === $request->user()->id;
        $allowedRoles = $isOwner ? 'in:admin,member,viewer' : 'in:member,viewer';

        $validator = Validator::make($request->all(), [
            'email' => 'required_without:user_id|email',
            'user_id' => 'required_without:email|exists:users,id',
            'role' => 'sometimes|' . $allowedRoles,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $isOwner ? 'Validation error' : 'Admins can only invite members or viewers',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = null;
        if ($request->has('user_id')) {
            $user = User::find($request->user_id);
        } elseif ($request->has('email')) {
            $user = User::where('email', $request->email)->first();
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User with the specified email does not exist',
            ], 404);
        }

        if ($project->members()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'User is already a member of this project',
            ], 409);
        }

        $role = $request->role ?? 'member';
        $project->members()->attach($user->id, ['role' => $role]);

        Activity::log('member_added', $project, $request->user(), [
            'member_id' => $user->id,
            'member_name' => $user->name,
            'role' => $role,
        ]);
        ProjectChanged::dispatch($project, 'member.added');

        return response()->json([
            'success' => true,
            'message' => 'Member added successfully',
            'data' => $project->members()->where('user_id', $user->id)->first(),
        ], 201);
    }

    /**
     * Create a shareable invitation link for the project (expires in 10 minutes).
     */
    public function createInvitation(Request $request, Project $project): JsonResponse
    {
        $this->authorizeAdmin($request->user(), $project);

        $isOwner = (int) $project->owner_id === (int) $request->user()->id;
        $allowedRoles = $isOwner ? ['admin', 'member', 'viewer'] : ['member', 'viewer'];

        $validator = Validator::make($request->all(), [
            'role' => 'required|in:' . implode(',', $allowedRoles),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $isOwner ? 'Validation error' : 'Admins can only invite members or viewers',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Clean up previous invitations for this project with the same role to regenerate cleanly
        ProjectInvitation::where('project_id', $project->id)
            ->where('role', $request->role)
            ->delete();

        $token = Str::random(64);
        $expiresAt = now()->addMinutes(10);

        $invitation = ProjectInvitation::create([
            'project_id' => $project->id,
            'invited_by' => $request->user()->id,
            'role' => $request->role,
            'token_hash' => hash('sha256', $token),
            'expires_at' => $expiresAt,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Link undangan berhasil dibuat (berlaku 10 menit)',
            'data' => [
                'id' => $invitation->id,
                'role' => $invitation->role,
                'expires_at' => $invitation->expires_at,
                'expires_in_seconds' => 600,
                'url' => rtrim(config('app.frontend_url', 'http://localhost:5173'), '/') . '/invitations/' . $token,
            ],
        ], 201);
    }

    /**
     * Preview an invitation link.
     */
    public function previewInvitation(string $token): JsonResponse
    {
        $tokenHash = hash('sha256', $token);
        $invitation = ProjectInvitation::with(['project.owner:id,name,email,avatar', 'inviter:id,name,email,avatar'])
            ->where('token_hash', $tokenHash)
            ->where('expires_at', '>', now())
            ->first();

        if (!$invitation || !$invitation->project) {
            return response()->json([
                'success' => false,
                'message' => 'Link undangan tidak valid atau sudah kadaluarsa (berlaku 10 menit). Silakan minta link baru.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'project' => [
                    'id' => $invitation->project->id,
                    'name' => $invitation->project->name,
                    'description' => $invitation->project->description,
                    'owner' => $invitation->project->owner,
                ],
                'inviter' => $invitation->inviter,
                'role' => $invitation->role,
                'expires_at' => $invitation->expires_at,
            ],
        ]);
    }

    /**
     * Accept a project invitation link for the authenticated user.
     */
    public function acceptInvitation(Request $request, string $token): JsonResponse
    {
        $tokenHash = hash('sha256', $token);
        $invitation = ProjectInvitation::with('project')
            ->where('token_hash', $tokenHash)
            ->where('expires_at', '>', now())
            ->first();

        if (!$invitation || !$invitation->project) {
            return response()->json([
                'success' => false,
                'message' => 'Link undangan tidak valid atau sudah kadaluarsa (berlaku 10 menit). Silakan minta link baru.',
            ], 404);
        }

        $project = $invitation->project;
        $currentUser = $request->user();

        // If user is already owner or member of this project, return graceful success
        if ((int) $project->owner_id === (int) $currentUser->id || $project->members()->where('user_id', $currentUser->id)->exists()) {
            $currentRole = (int) $project->owner_id === (int) $currentUser->id
                ? 'owner'
                : ($project->getMemberRole($currentUser) ?? 'member');

            return response()->json([
                'success' => true,
                'message' => 'Anda sudah menjadi anggota proyek ini',
                'data' => [
                    'project' => $project->only(['id', 'name', 'slug']),
                    'role' => $currentRole,
                    'already_member' => true,
                ],
            ]);
        }

        DB::transaction(function () use ($invitation, $project, $currentUser) {
            $project->members()->attach($currentUser->id, ['role' => $invitation->role]);
            Activity::log('member_joined_by_invitation', $project, $currentUser, [
                'role' => $invitation->role,
            ]);
            ProjectChanged::dispatch($project, 'member.joined');
        });

        return response()->json([
            'success' => true,
            'message' => 'Anda berhasil bergabung ke proyek ini',
            'data' => [
                'project' => $project->only(['id', 'name', 'slug']),
                'role' => $invitation->role,
                'already_member' => false,
            ],
        ]);
    }

    /**
     * Update member's role in a project.
     */
    public function updateMemberRole(Request $request, Project $project, User $user): JsonResponse
    {
        $this->authorizeAdmin($request->user(), $project);

        $currentUser = $request->user();
        $isOwner = $project->owner_id === $currentUser->id;

        $validator = Validator::make($request->all(), [
            'role' => 'required|' . ($isOwner ? 'in:admin,member,viewer' : 'in:member,viewer'),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $isOwner ? 'Validation error' : 'Admins can only change roles to member or viewer',
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($project->owner_id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot modify owner role',
            ], 400);
        }

        $targetMember = $project->members()->where('user_id', $user->id)->first();
        if (!$targetMember) {
            return response()->json([
                'success' => false,
                'message' => 'User is not a member of this project',
            ], 404);
        }

        // If caller is Admin (not owner), they cannot modify role of fellow Admin
        if (!$isOwner && $targetMember->pivot->role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only the project owner can modify admin roles',
            ], 403);
        }

        $project->members()->updateExistingPivot($user->id, ['role' => $request->role]);

        return response()->json([
            'success' => true,
            'message' => 'Member role updated successfully',
        ]);
    }

    /**
     * Remove member from project.
     */
    public function removeMember(Request $request, Project $project, User $user): JsonResponse
    {
        $this->authorizeAdmin($request->user(), $project);

        $currentUser = $request->user();
        $isOwner = $project->owner_id === $currentUser->id;

        if ($project->owner_id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot remove the project owner',
            ], 400);
        }

        $targetMember = $project->members()->where('user_id', $user->id)->first();
        if (!$targetMember) {
            return response()->json([
                'success' => false,
                'message' => 'User is not a member of this project',
            ], 404);
        }

        // If caller is Admin (not owner), they cannot kick fellow Admin
        if (!$isOwner && $targetMember->pivot->role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only the project owner can remove admins',
            ], 403);
        }

        $project->members()->detach($user->id);

        Activity::log('member_removed', $project, $request->user(), [
            'removed_user_id' => $user->id,
            'removed_user_name' => $user->name,
        ]);
        ProjectChanged::dispatch($project, 'member.removed');

        return response()->json([
            'success' => true,
            'message' => 'Member removed successfully',
        ]);
    }


    /**
     * List labels for a project.
     */
    public function labels(Request $request, Project $project): JsonResponse
    {
        $this->authorizeMember($request->user(), $project);

        return response()->json([
            'success' => true,
            'data' => $project->labels,
        ]);
    }

    /**
     * Create a new label for a project.
     */
    public function storeLabel(Request $request, Project $project): JsonResponse
    {
        $this->authorizeMember($request->user(), $project);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'color' => 'sometimes|string|max:7',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $label = $project->labels()->create([
            'name' => $request->name,
            'color' => $request->color ?? '#6B7280',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Label created successfully',
            'data' => $label,
        ], 201);
    }

    /**
     * Update a label.
     */
    public function updateLabel(Request $request, Project $project, Label $label): JsonResponse
    {
        $this->authorizeMember($request->user(), $project);
        $this->ensureLabelBelongsToProject($label, $project);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:100',
            'color' => 'sometimes|required|string|max:7',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $label->update($request->only(['name', 'color']));

        return response()->json([
            'success' => true,
            'message' => 'Label updated successfully',
            'data' => $label,
        ]);
    }

    /**
     * Delete a label.
     */
    public function destroyLabel(Request $request, Project $project, Label $label): JsonResponse
    {
        $this->authorizeMember($request->user(), $project);
        $this->ensureLabelBelongsToProject($label, $project);

        $label->delete();

        return response()->json([
            'success' => true,
            'message' => 'Label deleted successfully',
        ]);
    }

    /**
     * Get task statuses for a project.
     */
    public function taskStatuses(Request $request, Project $project): JsonResponse
    {
        $this->authorizeMember($request->user(), $project);

        $statuses = $project->taskStatuses()->orderBy('position')->get();

        return response()->json([
            'success' => true,
            'data' => $statuses,
        ]);
    }

    /**
     * Create a new task status for a project.
     */
    public function storeTaskStatus(Request $request, Project $project): JsonResponse
    {
        $this->authorizeAdmin($request->user(), $project);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'color' => 'sometimes|string|max:7',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $maxPosition = $project->taskStatuses()->max('position') ?? -1;

        $status = $project->taskStatuses()->create([
            'name' => $request->name,
            'color' => $request->color ?? '#6B7280',
            'position' => $maxPosition + 1,
            'is_default' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status created successfully',
            'data' => $status,
        ], 201);
    }

    /**
     * Update a task status.
     */
    public function updateTaskStatus(Request $request, Project $project, TaskStatus $status): JsonResponse
    {
        $this->authorizeAdmin($request->user(), $project);
        $this->ensureStatusBelongsToProject($status, $project);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:100',
            'color' => 'sometimes|required|string|max:7',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $status->update($request->only(['name', 'color']));

        return response()->json([
            'success' => true,
            'message' => 'Status updated successfully',
            'data' => $status,
        ]);
    }

    /**
     * Delete a task status.
     */
    public function destroyTaskStatus(Request $request, Project $project, TaskStatus $status): JsonResponse
    {
        $this->authorizeAdmin($request->user(), $project);
        $this->ensureStatusBelongsToProject($status, $project);

        if ($project->taskStatuses()->count() <= 1) {
            return response()->json([
                'success' => false,
                'message' => 'Project must have at least one task status',
            ], 400);
        }

        // Reassign tasks in this status to another status before deleting
        $fallbackStatus = $project->taskStatuses()->where('id', '!=', $status->id)->orderBy('position')->first();
        if ($fallbackStatus) {
            $project->tasks()->where('status_id', $status->id)->update(['status_id' => $fallbackStatus->id]);
        }

        $status->delete();

        return response()->json([
            'success' => true,
            'message' => 'Status deleted successfully',
        ]);
    }

    /**
     * Reorder task statuses.
     */
    public function reorderTaskStatuses(Request $request, Project $project): JsonResponse
    {
        $this->authorizeAdmin($request->user(), $project);

        $validator = Validator::make($request->all(), [
            'status_ids' => 'required|array',
            'status_ids.*' => 'integer|exists:task_statuses,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($project->taskStatuses()->whereIn('id', $request->status_ids)->count() !== count(array_unique($request->status_ids))) {
            return response()->json([
                'success' => false,
                'message' => 'All statuses must belong to this project',
            ], 422);
        }

        foreach ($request->status_ids as $position => $statusId) {
            TaskStatus::where('id', $statusId)
                ->where('project_id', $project->id)
                ->update(['position' => $position]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Statuses reordered successfully',
            'data' => $project->taskStatuses()->orderBy('position')->get(),
        ]);
    }

    /**
     * Set up default task statuses for a project if none exist.
     */
    public function setupDefaults(Request $request, Project $project): JsonResponse
    {
        $this->authorizeAdmin($request->user(), $project);

        if ($project->taskStatuses()->count() === 0) {
            $project->createDefaultStatuses();
        }

        return response()->json([
            'success' => true,
            'message' => 'Default statuses created successfully',
            'data' => $project->taskStatuses()->orderBy('position')->get(),
        ]);
    }

    // Authorization helpers
    protected function authorizeMember(User $user, Project $project): void
    {
        if ($project->owner_id !== $user->id && !$project->members()->where('user_id', $user->id)->exists()) {
            abort(403, 'You are not a member of this project');
        }

        if (request()->isMethod('GET')) {
            return;
        }

        $role = $project->getMemberRole($user);
        if ($role === 'viewer') {
            abort(403, 'Viewers have read-only access to this project');
        }
    }

    protected function authorizeAdmin(User $user, Project $project): void
    {
        if ((int) $project->owner_id === (int) $user->id) {
            return;
        }

        $member = $project->members()->where('user_id', $user->id)->first();
        if (!$member || !in_array($member->pivot->role, ['owner', 'admin'])) {
            abort(403, 'Only project owners and admins can perform this action');
        }
    }

    protected function authorizeOwner(User $user, Project $project): void
    {
        if ((int) $project->owner_id !== (int) $user->id) {
            abort(403, 'Only the project owner can perform this action');
        }
    }

    protected function ensureLabelBelongsToProject(Label $label, Project $project): void
    {
        if ($label->project_id !== $project->id) {
            abort(404, 'Label not found in this project');
        }
    }

    protected function ensureStatusBelongsToProject(TaskStatus $status, Project $project): void
    {
        if ($status->project_id !== $project->id) {
            abort(404, 'Status not found in this project');
        }
    }
}
