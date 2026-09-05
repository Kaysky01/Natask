<?php

namespace App\Events;

use App\Models\Project;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectChanged implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Project $project,
        public string $action,
        public ?int $taskId = null,
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('projects.' . $this->project->id)];
    }

    public function broadcastAs(): string
    {
        return 'project.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'project_id' => $this->project->id,
            'action' => $this->action,
            'task_id' => $this->taskId,
        ];
    }
}
