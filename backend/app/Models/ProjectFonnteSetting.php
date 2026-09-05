<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectFonnteSetting extends Model
{
    use HasFactory;

    protected $table = 'project_fonnte_settings';

    protected $fillable = [
        'project_id',
        'api_token',
        'api_endpoint',
        'is_enabled',
        'target_type',
        'group_target',
        'notify_task_created',
        'notify_task_status_changed',
        'notify_task_commented',
        'notify_member_joined',
        'sender_number',
        'device_status',
    ];

    protected $casts = [
        'api_token' => 'encrypted',
        'is_enabled' => 'boolean',
        'notify_task_created' => 'boolean',
        'notify_task_status_changed' => 'boolean',
        'notify_task_commented' => 'boolean',
        'notify_member_joined' => 'boolean',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
