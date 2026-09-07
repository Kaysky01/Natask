<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskStatus;
use App\Models\Project;
use App\Models\User;
use App\Models\Label;
use App\Models\Checklist;
use App\Models\ChecklistItem;
use App\Models\Comment;
use App\Models\Attachment;
use App\Models\Activity;
use App\Events\ProjectChanged;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class TaskController extends Controller
{
    /**
     * Display a listing of tasks with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Task::query()
            ->whereHas('project', function ($pq) use ($user) {
                $pq->where('owner_id', $user->id)
                   ->orWhereHas('members', function ($mq) use ($user) {
                       $mq->where('user_id', $user->id);
                   });
            })
            ->with([
                'project:id,name,slug',
                'status',
                'creator:id,name,email,avatar,phone',
                'assignees:id,name,email,avatar,phone',
                'labels',
                'checklists.items',
            ])
            ->withCount(['comments', 'attachments']);

        if ($request->has('project_id') && $request->project_id) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->has('status_id') && $request->status_id) {
            $query->where('status_id', $request->status_id);
        }

        if ($request->has('priority') && $request->priority) {
            $query->where('priority', $request->priority);
        }

        if ($request->has('assigned_to_me') && $request->boolean('assigned_to_me')) {
            $query->whereHas('assignees', function ($aq) use ($user) {
                $aq->where('user_id', $user->id);
            });
        }

        if ($request->has('due_soon') && $request->boolean('due_soon')) {
            $query->whereNotNull('due_date')
                ->where('due_date', '>=', now())
                ->where('due_date', '<=', now()->addDays(7))
                ->whereDoesntHave('status', function ($sq) {
                    $sq->whereIn('name', ['Done', 'Completed']);
                });
        }

        if ($request->has('search') && $request->search) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $tasks = $query->orderBy('position')->get();

        return response()->json([
            'success' => true,
            'data' => $tasks,
        ]);
    }

    /**
     * Display tasks for a specific project.
     */
    public function projectTasks(Request $request, Project $project): JsonResponse
    {
        $this->authorizeMember($request->user(), $project);

        $tasks = $project->tasks()
            ->with([
                'status',
                'creator:id,name,email,avatar,phone',
                'assignees:id,name,email,avatar,phone',
                'labels',
                'checklists.items',
            ])
            ->withCount(['comments', 'attachments'])
            ->orderBy('position')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tasks,
        ]);
    }

    /**
     * Store a newly created task.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status_id' => 'nullable|exists:task_statuses,id',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'integer|exists:users,id',
            'label_ids' => 'nullable|array',
            'label_ids.*' => 'integer|exists:labels,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $project = Project::findOrFail($request->project_id);
        $this->authorizeMember($request->user(), $project);
        $this->validateProjectRelations($project, $request->status_id, $request->assignee_ids, $request->label_ids);

        // If status_id is not provided, pick first default status for the project
        $statusId = $request->status_id;
        if (!$statusId) {
            $defaultStatus = $project->taskStatuses()->where('is_default', true)->first()
                ?? $project->taskStatuses()->orderBy('position')->first();
            $statusId = $defaultStatus ? $defaultStatus->id : null;
        }

        $maxPosition = Task::where('project_id', $project->id)
            ->where('status_id', $statusId)
            ->max('position') ?? -1;

        $task = Task::create([
            'project_id' => $project->id,
            'status_id' => $statusId,
            'creator_id' => $request->user()->id,
            'title' => $request->title,
            'description' => $request->description,
            'priority' => $request->priority ?? 'medium',
            'start_date' => $request->start_date,
            'due_date' => $request->due_date,
            'position' => $maxPosition + 1,
        ]);

        if ($request->has('assignee_ids') && is_array($request->assignee_ids)) {
            $task->assignees()->sync($request->assignee_ids);
        }

        if ($request->has('label_ids') && is_array($request->label_ids)) {
            $task->labels()->sync($request->label_ids);
        }

        Activity::log('task_created', $project, $request->user(), [
            'task_id' => $task->id,
            'task_title' => $task->title,
        ]);
        ProjectChanged::dispatch($project, 'task.created', $task->id);

        $task->load([
            'project:id,name,slug',
            'status',
            'creator:id,name,email,avatar,phone',
            'assignees:id,name,email,avatar,phone',
            'labels',
            'checklists.items',
        ]);

        // Send Fonnte WhatsApp notification
        app(\App\Services\FonnteNotificationService::class)->notifyTaskCreated($project, $task, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully',
            'data' => $task,
        ], 201);
    }

    /**
     * Display the specified task.
     */
    public function show(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $task);

        $task->load([
            'project:id,name,slug',
            'status',
            'creator:id,name,email,avatar,phone',
            'assignees:id,name,email,avatar,phone',
            'labels',
            'checklists.items',
            'comments.user:id,name,email,avatar,phone',
            'attachments.user:id,name,email,avatar,phone',
        ]);

        return response()->json([
            'success' => true,
            'data' => $task,
        ]);
    }

    /**
     * Update the specified task.
     */
    public function update(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $task);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status_id' => 'sometimes|exists:task_statuses,id',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'position' => 'nullable|integer',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'integer|exists:users,id',
            'label_ids' => 'nullable|array',
            'label_ids.*' => 'integer|exists:labels,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $this->validateProjectRelations($task->project, $request->status_id, $request->assignee_ids, $request->label_ids);

        $oldStatus = $task->status;

        $task->update($request->only([
            'title', 'description', 'status_id', 'priority', 'start_date', 'due_date', 'position'
        ]));

        if ($request->has('assignee_ids')) {
            $task->assignees()->sync($request->assignee_ids);
        }

        if ($request->has('label_ids')) {
            $task->labels()->sync($request->label_ids);
        }

        Activity::log('task_updated', $task->project, $request->user(), [
            'task_id' => $task->id,
            'task_title' => $task->title,
        ]);
        ProjectChanged::dispatch($task->project, 'task.updated', $task->id);

        // Send Fonnte WhatsApp notification if status changed
        if ($oldStatus && $task->status_id && (int) $oldStatus->id !== (int) $task->status_id) {
            $newStatus = TaskStatus::find($task->status_id);
            if ($newStatus) {
                app(\App\Services\FonnteNotificationService::class)->notifyTaskStatusChanged(
                    $task->project,
                    $task,
                    $oldStatus,
                    $newStatus,
                    $request->user()
                );
            }
        }

        $task->load([
            'project:id,name,slug',
            'status',
            'creator:id,name,email,avatar,phone',
            'assignees:id,name,email,avatar,phone',
            'labels',
            'checklists.items',
            'comments.user:id,name,email,avatar,phone',
            'attachments.user:id,name,email,avatar,phone',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully',
            'data' => $task,
        ]);
    }

    /**
     * Remove the specified task.
     */
    public function destroy(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $task);

        $project = $task->project;
        $title = $task->title;

        $task->delete();

        Activity::log('task_deleted', $project, $request->user(), [
            'task_title' => $title,
        ]);
        ProjectChanged::dispatch($project, 'task.deleted', $task->id);

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully',
        ]);
    }

    /**
     * Update task status and position (Kanban Drag & Drop).
     */
    public function updateStatus(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $task);

        $validator = Validator::make($request->all(), [
            'status_id' => 'required|exists:task_statuses,id',
            'position' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $oldStatus = $task->status;
        $newStatus = TaskStatus::findOrFail($request->status_id);
        if ($newStatus->project_id !== $task->project_id) {
            return response()->json([
                'success' => false,
                'message' => 'Status does not belong to this task project',
            ], 422);
        }
        $task->moveToStatus($newStatus, $request->position);
        ProjectChanged::dispatch($task->project, 'task.status_updated', $task->id);

        // Send Fonnte WhatsApp notification if status changed
        if ($oldStatus && (int) $oldStatus->id !== (int) $newStatus->id) {
            app(\App\Services\FonnteNotificationService::class)->notifyTaskStatusChanged(
                $task->project,
                $task,
                $oldStatus,
                $newStatus,
                $request->user()
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Task status updated',
            'data' => $task->fresh(['status', 'assignees', 'labels']),
        ]);
    }

    /**
     * Reorder task within the same status.
     */
    public function updatePosition(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $task);

        $validator = Validator::make($request->all(), [
            'position' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $task->update(['position' => $request->position]);
        ProjectChanged::dispatch($task->project, 'task.reordered', $task->id);

        return response()->json([
            'success' => true,
            'message' => 'Task position updated',
            'data' => $task,
        ]);
    }

    /**
     * Assign user to task.
     */
    public function assign(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $task);

        $validator = Validator::make($request->all(), [
            'user_id' => 'required_without:user_ids|exists:users,id',
            'user_ids' => 'required_without:user_id|array',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $userIds = $request->has('user_ids') ? $request->user_ids : [$request->user_id];
        $task->assignees()->syncWithoutDetaching($userIds);

        $assignedUsers = User::whereIn('id', $userIds)->select('id', 'name', 'email', 'phone')->get();
        app(\App\Services\FonnteNotificationService::class)->notifyTaskAssigned(
            $task->project,
            $task,
            $assignedUsers,
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'User(s) assigned successfully',
            'data' => $task->assignees()->get(),
        ]);
    }

    /**
     * Unassign user from task.
     */
    public function unassign(Request $request, Task $task, User $user): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $task);

        $task->assignees()->detach($user->id);

        return response()->json([
            'success' => true,
            'message' => 'User unassigned successfully',
        ]);
    }

    /**
     * Attach labels to task.
     */
    public function attachLabels(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $task);

        $validator = Validator::make($request->all(), [
            'label_ids' => 'required|array',
            'label_ids.*' => 'integer|exists:labels,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $task->labels()->syncWithoutDetaching($request->label_ids);

        return response()->json([
            'success' => true,
            'message' => 'Labels attached successfully',
            'data' => $task->labels()->get(),
        ]);
    }

    /**
     * Detach label from task.
     */
    public function detachLabel(Request $request, Task $task, Label $label): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $task);

        $task->labels()->detach($label->id);

        return response()->json([
            'success' => true,
            'message' => 'Label detached successfully',
        ]);
    }

    /**
     * Get task checklists.
     */
    public function checklists(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $task);

        return response()->json([
            'success' => true,
            'data' => $task->checklists()->with('items')->get(),
        ]);
    }

    /**
     * Create a checklist for task.
     */
    public function storeChecklist(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $task);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $checklist = $task->checklists()->create([
            'title' => $request->title,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Checklist created successfully',
            'data' => $checklist->load('items'),
        ], 201);
    }

    /**
     * Update checklist.
     */
    public function updateChecklist(Request $request, Checklist $checklist): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $checklist->task);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'position' => 'sometimes|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $checklist->update($request->only(['title', 'position']));

        return response()->json([
            'success' => true,
            'message' => 'Checklist updated successfully',
            'data' => $checklist,
        ]);
    }

    /**
     * Delete checklist.
     */
    public function destroyChecklist(Request $request, Checklist $checklist): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $checklist->task);

        $checklist->delete();

        return response()->json([
            'success' => true,
            'message' => 'Checklist deleted successfully',
        ]);
    }

    /**
     * Add item to checklist.
     */
    public function storeChecklistItem(Request $request, Checklist $checklist): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $checklist->task);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $item = $checklist->items()->create([
            'title' => $request->title,
            'completed' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Checklist item added',
            'data' => $item,
        ], 201);
    }

    /**
     * Update checklist item (e.g. toggle completed).
     */
    public function updateChecklistItem(Request $request, ChecklistItem $item): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $item->checklist->task);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'completed' => 'sometimes|boolean',
            'position' => 'sometimes|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $item->update($request->only(['title', 'completed', 'position']));

        return response()->json([
            'success' => true,
            'message' => 'Checklist item updated',
            'data' => $item,
        ]);
    }

    /**
     * Delete checklist item.
     */
    public function destroyChecklistItem(Request $request, ChecklistItem $item): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $item->checklist->task);

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Checklist item deleted',
        ]);
    }

    /**
     * Get comments for a task.
     */
    public function comments(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $task);

        $comments = $task->comments()->with('user:id,name,email,avatar')->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $comments,
        ]);
    }

    /**
     * Add comment to task.
     */
    public function storeComment(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $task);

        $validator = Validator::make($request->all(), [
            'body' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $comment = $task->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $request->body,
        ]);

        Activity::log('comment_added', $task->project, $request->user(), [
            'task_id' => $task->id,
            'task_title' => $task->title,
        ]);
        ProjectChanged::dispatch($task->project, 'comment.created', $task->id);

        // Send Fonnte WhatsApp notification
        app(\App\Services\FonnteNotificationService::class)->notifyTaskCommented(
            $task->project,
            $task,
            $comment,
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Comment posted successfully',
            'data' => $comment->load('user:id,name,email,avatar'),
        ], 201);
    }

    /**
     * Update comment.
     */
    public function updateComment(Request $request, Comment $comment): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $comment->task);

        if ($comment->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only edit your own comments',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'body' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $comment->update(['body' => $request->body]);

        return response()->json([
            'success' => true,
            'message' => 'Comment updated',
            'data' => $comment->fresh('user:id,name,email,avatar'),
        ]);
    }

    /**
     * Delete comment.
     */
    public function destroyComment(Request $request, Comment $comment): JsonResponse
    {
        $task = $comment->task;
        $this->authorizeTaskAccess($request->user(), $task);
        $isAuthor = $comment->user_id === $request->user()->id;
        $isProjectOwner = $task && $task->project && $task->project->owner_id === $request->user()->id;

        if (!$isAuthor && !$isProjectOwner) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this comment',
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully',
        ]);
    }

    /**
     * Get attachments for a task.
     */
    public function attachments(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $task);

        return response()->json([
            'success' => true,
            'data' => $task->attachments()->with('user:id,name,email,avatar')->get(),
        ]);
    }

    /**
     * Store attachment for a task.
     */
    public function storeAttachment(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($request->user(), $task);

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:20480|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,jpg,jpeg,png,webp,gif,svg,zip,rar,7z,mp4,mov', // max 20MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first('file') ?: 'File tidak valid atau melebihi batas ukuran (maksimal 20 MB).',
                'errors' => $validator->errors(),
            ], 422);
        }

        $file = $request->file('file');
        $path = $file->store('attachments/' . $task->id, 'public');

        $attachment = $task->attachments()->create([
            'user_id' => $request->user()->id,
            'original_name' => $file->getClientOriginalName(),
            'storage_path' => $path,
            'mime_type' => $file->getClientMimeType() ?: 'application/octet-stream',
            'size' => $file->getSize(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Attachment uploaded successfully',
            'data' => $attachment->load('user:id,name,email,avatar'),
        ], 201);
    }

    /**
     * Delete attachment.
     */
    public function destroyAttachment(Request $request, Attachment $attachment): JsonResponse
    {
        $task = $attachment->task;
        $this->authorizeTaskAccess($request->user(), $task);

        if (Storage::disk('public')->exists($attachment->storage_path)) {
            Storage::disk('public')->delete($attachment->storage_path);
        }

        $attachment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attachment deleted successfully',
        ]);
    }

    /**
     * Download attachment.
     */
    public function downloadAttachment(Request $request, Attachment $attachment)
    {
        $task = $attachment->task;
        $this->authorizeTaskAccess($request->user(), $task);

        if (!Storage::disk('public')->exists($attachment->storage_path)) {
            return response()->json([
                'success' => false,
                'message' => 'Attachment file not found',
            ], 404);
        }

        return Storage::disk('public')->download($attachment->storage_path, $attachment->original_name);
    }

    // Authorization helpers
    protected function authorizeTaskAccess(User $user, Task $task): void
    {
        $project = $task->project;
        if (!$project) {
            abort(404, 'Project not found');
        }

        if ((int) $project->owner_id !== (int) $user->id && !$project->members()->where('user_id', $user->id)->exists()) {
            abort(403, 'You do not have access to this task');
        }

        if (!request()->isMethod('GET') && $project->getMemberRole($user) === 'viewer') {
            abort(403, 'Viewers have read-only access to project tasks');
        }
    }

    protected function authorizeMember(User $user, Project $project): void
    {
        if ((int) $project->owner_id !== (int) $user->id && !$project->members()->where('user_id', $user->id)->exists()) {
            abort(403, 'You are not a member of this project');
        }

        if (!request()->isMethod('GET') && $project->getMemberRole($user) === 'viewer') {
            abort(403, 'Viewers have read-only access to this project');
        }
    }

    protected function validateProjectRelations(Project $project, ?int $statusId, ?array $assigneeIds, ?array $labelIds): void
    {
        if ($statusId !== null && !$project->taskStatuses()->whereKey($statusId)->exists()) {
            abort(422, 'Status does not belong to this project');
        }

        if ($labelIds !== null) {
            $labelCount = $project->labels()->whereIn('id', $labelIds)->count();
            if ($labelCount !== count(array_unique($labelIds))) {
                abort(422, 'One or more labels do not belong to this project');
            }
        }

        if ($assigneeIds !== null) {
            $memberCount = $project->members()->whereIn('users.id', $assigneeIds)->count();
            if ($memberCount !== count(array_unique($assigneeIds))) {
                abort(422, 'All assignees must be members of this project');
            }
        }
    }
}
