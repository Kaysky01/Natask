<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Checklist extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'task_id',
        'title',
        'position',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($checklist) {
            if (is_null($checklist->position)) {
                $maxPosition = static::where('task_id', $checklist->task_id)->max('position');
                $checklist->position = ($maxPosition ?? -1) + 1;
            }
        });
    }

    /**
     * Get the task that owns the checklist.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Get the checklist items.
     */
    public function items(): HasMany
    {
        return $this->hasMany(ChecklistItem::class)->orderBy('position');
    }

    /**
     * Get the completion percentage of the checklist.
     */
    public function getCompletionPercentageAttribute(): int
    {
        $totalItems = $this->items()->count();
        
        if ($totalItems === 0) {
            return 0;
        }

        $completedItems = $this->items()->where('completed', true)->count();

        return round(($completedItems / $totalItems) * 100);
    }
}