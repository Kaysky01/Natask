<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ActivityController extends Controller
{
    /**
     * Display a listing of activities for the user's projects.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $projectIds = Project::where('owner_id', $user->id)
            ->orWhereHas('members', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->pluck('id');

        $activities = Activity::whereIn('project_id', $projectIds)
            ->with(['user:id,name,email,avatar', 'project:id,name,slug'])
            ->latest()
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $activities,
        ]);
    }

    /**
     * Display activities for a specific project.
     */
    public function projectActivities(Request $request, Project $project): JsonResponse
    {
        $user = $request->user();
        if ($project->owner_id !== $user->id && !$project->members()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to project activities',
            ], 403);
        }

        $activities = $project->activities()
            ->with(['user:id,name,email,avatar'])
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $activities,
        ]);
    }

    /**
     * Get aggregate dashboard data for the authenticated user.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        // 1. User projects
        $projects = Project::where('owner_id', $user->id)
            ->orWhereHas('members', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->with(['owner:id,name,email,avatar', 'members:id,name,email,avatar', 'taskStatuses'])
            ->withCount(['tasks', 'tasks as completed_tasks_count' => function ($q) {
                $q->whereHas('status', function ($sq) {
                    $sq->whereIn('name', ['Done', 'Completed']);
                });
            }])
            ->latest()
            ->limit(5)
            ->get();

        $projects->transform(function ($project) {
            $total = $project->tasks_count;
            $completed = $project->completed_tasks_count;
            $project->progress = $total > 0 ? round(($completed / $total) * 100) : 0;
            return $project;
        });

        // 2. Tasks assigned to user due soon
        $myTasksDueSoon = Task::whereHas('assignees', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->whereDoesntHave('status', function ($sq) {
                $sq->whereIn('name', ['Done', 'Completed']);
            })
            ->with(['project:id,name,slug', 'status', 'labels'])
            ->orderByRaw('CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC')
            ->limit(10)
            ->get();

        // 3. User task statistics
        $allAssignedTasks = Task::whereHas('assignees', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        });

        $totalAssigned = (clone $allAssignedTasks)->count();
        $completedAssigned = (clone $allAssignedTasks)
            ->whereHas('status', function ($sq) {
                $sq->whereIn('name', ['Done', 'Completed']);
            })->count();

        $overdueCount = (clone $allAssignedTasks)
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString())
            ->whereDoesntHave('status', function ($sq) {
                $sq->whereIn('name', ['Done', 'Completed']);
            })->count();

        $activeProjectsCount = Project::where(function ($q) use ($user) {
                $q->where('owner_id', $user->id)
                  ->orWhereHas('members', function ($mq) use ($user) {
                      $mq->where('user_id', $user->id);
                  });
            })
            ->where('status', 'active')
            ->count();

        // 4. Recent activities
        $projectIds = Project::where('owner_id', $user->id)
            ->orWhereHas('members', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->pluck('id');

        $recentActivities = Activity::whereIn('project_id', $projectIds)
            ->with(['user:id,name,email,avatar', 'project:id,name,slug'])
            ->latest()
            ->limit(8)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'active_projects' => $activeProjectsCount,
                    'assigned_tasks' => $totalAssigned,
                    'completed_tasks' => $completedAssigned,
                    'overdue_tasks' => $overdueCount,
                ],
                'projects' => $projects,
                'my_tasks_due_soon' => $myTasksDueSoon,
                'recent_activities' => $recentActivities,
            ],
        ]);
    }

    /**
     * Get task statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $assignedTasksQuery = Task::whereHas('assignees', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        });

        $stats = [
            'total' => (clone $assignedTasksQuery)->count(),
            'completed' => (clone $assignedTasksQuery)->whereHas('status', function ($sq) {
                $sq->whereIn('name', ['Done', 'Completed']);
            })->count(),
            'in_progress' => (clone $assignedTasksQuery)->whereHas('status', function ($sq) {
                $sq->whereIn('name', ['In Progress', 'Progress']);
            })->count(),
            'todo' => (clone $assignedTasksQuery)->whereHas('status', function ($sq) {
                $sq->whereIn('name', ['To Do', 'Todo']);
            })->count(),
            'overdue' => (clone $assignedTasksQuery)
                ->whereNotNull('due_date')
                ->where('due_date', '<', now()->toDateString())
                ->whereDoesntHave('status', function ($sq) {
                    $sq->whereIn('name', ['Done', 'Completed']);
                })->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
