<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskDateHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'user_id',
        'type',
        'old_start_date',
        'new_start_date',
        'old_due_date',
        'new_due_date',
        'extension_days',
        'reason',
    ];

    protected $casts = [
        'old_start_date' => 'date',
        'new_start_date' => 'date',
        'old_due_date' => 'date',
        'new_due_date' => 'date',
        'extension_days' => 'integer',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
