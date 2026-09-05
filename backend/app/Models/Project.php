<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Project extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'owner_id',
        'status',
        'priority',
        'start_date',
        'due_date',
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

        static::creating(function ($project) {
            if (empty($project->slug)) {
                $project->slug = Str::slug($project->name);
            }
        });

        static::created(function ($project) {
            // Create default task statuses for the project
            $project->createDefaultStatuses();
            
            // Add owner as project member with owner role
            $project->members()->attach($project->owner_id, ['role' => 'owner']);
        });
    }

    /**
     * Get the owner of the project.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the project members.
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')
                    ->withPivot('role')
                    ->withTimestamps();
    }

    /**
     * Get the tasks in the project.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Get the task statuses for the project.
     */
    public function taskStatuses(): HasMany
    {
        return $this->hasMany(TaskStatus::class)->orderBy('position');
    }

    /**
     * Get the labels for the project.
     */
    public function labels(): HasMany
    {
        return $this->hasMany(Label::class);
    }

    /**
     * Get the activities for the project.
     */
    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class)->latest();
    }

    /**
     * Create default task statuses for the project.
     */
    public function createDefaultStatuses(): void
    {
        $defaultStatuses = [
            ['name' => 'To Do', 'color' => '#6B7280', 'position' => 0, 'is_default' => true],
            ['name' => 'In Progress', 'color' => '#3B82F6', 'position' => 1, 'is_default' => false],
            ['name' => 'Review', 'color' => '#8B5CF6', 'position' => 2, 'is_default' => false],
            ['name' => 'Done', 'color' => '#10B981', 'position' => 3, 'is_default' => false],
        ];

        foreach ($defaultStatuses as $status) {
            $this->taskStatuses()->create($status);
        }
    }

    /**
     * Get the default task status for the project.
     */
    public function getDefaultStatus()
    {
        return $this->taskStatuses()->where('is_default', true)->first();
    }

    /**
     * Calculate project progress percentage.
     */
    public function getProgressAttribute(): int
    {
        $totalTasks = $this->tasks()->count();
        
        if ($totalTasks === 0) {
            return 0;
        }

        $doneStatus = $this->taskStatuses()
            ->where('name', 'Done')
            ->first();

        if (!$doneStatus) {
            return 0;
        }

        $completedTasks = $this->tasks()
            ->where('status_id', $doneStatus->id)
            ->count();

        return round(($completedTasks / $totalTasks) * 100);
    }

    /**
     * Check if user is a member of the project.
     */
    public function hasMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
    }

    /**
     * Get user's role in the project.
     */
    public function getMemberRole(User $user): ?string
    {
        $member = $this->members()->where('user_id', $user->id)->first();
        return $member?->pivot->role;
    }

    /**
     * Scope to get projects where user is a member.
     */
    public function scopeForUser($query, User $user)
    {
        return $query->whereHas('members', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        });
    }
}