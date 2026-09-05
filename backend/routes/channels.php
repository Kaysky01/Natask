<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('projects.{projectId}', function ($user, $projectId) {
    $project = \App\Models\Project::find($projectId);

    return $project && ($project->owner_id === $user->id || $project->hasMember($user));
});
