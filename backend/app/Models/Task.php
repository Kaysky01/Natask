<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\DB;

class Task extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'project_id',
        'status_id',
        'creator_id',
        'parent_id',
        'title',
        'description',
        'priority',
        'start_date',
        'due_date',
        'position',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_date' => 'date',
        'due_date' => 'date',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($task) {
            if (is_null($task->position)) {
                $maxPosition = static::where('project_id', $task->project_id)
                    ->where('status_id', $task->status_id)
                    ->max('position');
                $task->position = ($maxPosition ?? -1) + 1;
            }
        });
    }

    /**
     * Get the project that owns the task.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the status of the task.
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(TaskStatus::class, 'status_id');
    }

    /**
     * Get the creator of the task.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * Get the parent task (for subtasks).
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'parent_id');
    }

    /**
     * Get the subtasks.
     */
    public function subtasks(): HasMany
    {
        return $this->hasMany(Task::class, 'parent_id')->orderBy('position');
    }

    /**
     * Get the assigned users.
     */
    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_assignees')->withTimestamps();
    }

    /**
     * Get the labels assigned to the task.
     */
    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(Label::class, 'task_labels')->withTimestamps();
    }

    /**
     * Get the checklists for the task.
     */
    public function checklists(): HasMany
    {
        return $this->hasMany(Checklist::class)->orderBy('position');
    }

    /**
     * Get the comments for the task.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->latest();
    }

    /**
     * Get the attachments for the task.
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class)->latest();
    }

    /**
     * Check if the task is overdue.
     */
    public function getIsOverdueAttribute(): bool
    {
        if (!$this->due_date) {
            return false;
        }

        // Check if task is not completed
        $doneStatuses = ['Done', 'Completed'];
        $isCompleted = in_array($this->status->name ?? '', $doneStatuses);

        return !$isCompleted && $this->due_date->isPast();
    }

    /**
     * Check if the task is due soon (within 3 days).
     */
    public function getIsDueSoonAttribute(): bool
    {
        if (!$this->due_date) {
            return false;
        }

        $doneStatuses = ['Done', 'Completed'];
        $isCompleted = in_array($this->status->name ?? '', $doneStatuses);

        if ($isCompleted) {
            return false;
        }

        return $this->due_date->isBetween(
            now()->startOfDay(),
            now()->addDays(3)->endOfDay()
        );
    }

    /**
     * Get the completion percentage based on checklists.
     */
    public function getCompletionPercentageAttribute(): int
    {
        $totalItems = 0;
        $completedItems = 0;

        foreach ($this->checklists as $checklist) {
            foreach ($checklist->items as $item) {
                $totalItems++;
                if ($item->completed) {
                    $completedItems++;
                }
            }
        }

        if ($totalItems === 0) {
            return 0;
        }

        return round(($completedItems / $totalItems) * 100);
    }

    /**
     * Scope to get tasks assigned to a user.
     */
    public function scopeAssignedTo($query, User $user)
    {
        return $query->whereHas('assignees', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        });
    }

    /**
     * Scope to get tasks in a specific status.
     */
    public function scopeInStatus($query, $statusName)
    {
        return $query->whereHas('status', function ($q) use ($statusName) {
            $q->where('name', $statusName);
        });
    }

    /**
     * Scope to get overdue tasks.
     */
    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
            ->whereDoesntHave('status', function ($q) {
                $q->whereIn('name', ['Done', 'Completed']);
            });
    }

    /**
     * Move task to a different status and update position.
     */
    public function moveToStatus(TaskStatus $status, ?int $position = null): void
    {
        DB::transaction(function () use ($status, $position): void {
            $oldStatusId = $this->status_id;
            $oldPosition = $this->position;

            if ($oldStatusId === $status->id) {
                if ($position === null || $position === $oldPosition) {
                    return;
                }

                if ($position < $oldPosition) {
                    static::where('status_id', $status->id)
                        ->whereBetween('position', [$position, $oldPosition - 1])
                        ->increment('position');
                } else {
                    static::where('status_id', $status->id)
                        ->whereBetween('position', [$oldPosition + 1, $position])
                        ->decrement('position');
                }
            } else {
                static::where('status_id', $oldStatusId)
                    ->where('position', '>', $oldPosition)
                    ->decrement('position');

                $position ??= (static::where('status_id', $status->id)->max('position') ?? -1) + 1;
                static::where('status_id', $status->id)
                    ->where('position', '>=', $position)
                    ->increment('position');
            }

            $this->update([
                'status_id' => $status->id,
                'position' => $position ?? $oldPosition,
            ]);
        });
    }
}