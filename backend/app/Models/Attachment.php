<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attachment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'task_id',
        'user_id',
        'original_name',
        'storage_path',
        'mime_type',
        'size',
    ];

    /**
     * Get the task that owns the attachment.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Get the user who uploaded the attachment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the formatted file size.
     */
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size;
        $sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        if ($bytes == 0) return '0 B';
        
        $i = floor(log($bytes, 1024));
        
        return round($bytes / pow(1024, $i), 2) . ' ' . $sizes[$i];
    }

    /**
     * Check if the attachment is an image.
     */
    public function getIsImageAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Get the file icon based on mime type.
     */
    public function getIconAttribute(): string
    {
        if (str_starts_with($this->mime_type, 'image/')) return '🖼️';
        if (str_starts_with($this->mime_type, 'video/')) return '🎥';
        if (str_starts_with($this->mime_type, 'audio/')) return '🎵';
        if (str_contains($this->mime_type, 'pdf')) return '📄';
        if (str_contains($this->mime_type, 'word')) return '📝';
        if (str_contains($this->mime_type, 'sheet')) return '📊';
        if (str_contains($this->mime_type, 'presentation')) return '📊';
        return '📎';
    }
}