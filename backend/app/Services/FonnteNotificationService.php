<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Project;
use App\Models\ProjectFonnteSetting;
use App\Models\Task;
use App\Models\TaskStatus;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FonnteNotificationService
{
    /**
     * Check Fonnte device connection status & sender number.
     */
    public function checkDevice(string $token, ?string $endpoint = null): array
    {
        try {
            // Default device check endpoint
            $deviceEndpoint = 'https://api.fonnte.com/get-devices';
            
            $response = Http::withHeaders([
                'Authorization' => $token,
            ])->timeout(8)->post($deviceEndpoint);

            if ($response->successful()) {
                $json = $response->json();
                
                // Parse standard Fonnte device response structure
                $deviceData = null;
                if (isset($json['data']) && is_array($json['data'])) {
                    $deviceData = $json['data'][0] ?? $json['data'];
                }

                $device = $deviceData['device'] ?? $json['device'] ?? $json['sender'] ?? null;
                $status = $deviceData['status'] ?? $json['status'] ?? 'connected';
                $name = $deviceData['name'] ?? $json['name'] ?? 'WhatsApp Device';

                return [
                    'success' => true,
                    'status' => $status,
                    'sender_number' => $device,
                    'device_name' => $name,
                    'raw' => $json,
                ];
            }

            // Fallback: try /device endpoint
            $altResponse = Http::withHeaders([
                'Authorization' => $token,
            ])->timeout(8)->post('https://api.fonnte.com/device');

            if ($altResponse->successful()) {
                $json = $altResponse->json();
                $device = $json['device'] ?? $json['sender'] ?? null;
                $status = $json['status'] ?? 'connected';

                return [
                    'success' => true,
                    'status' => $status,
                    'sender_number' => $device,
                    'device_name' => $json['name'] ?? 'WhatsApp Device',
                    'raw' => $json,
                ];
            }

            return [
                'success' => false,
                'status' => 'disconnected',
                'message' => $response->json()['reason'] ?? $response->json()['message'] ?? 'Device tidak terhubung atau token tidak valid',
            ];
        } catch (\Throwable $e) {
            Log::warning('Fonnte checkDevice error: ' . $e->getMessage());
            return [
                'success' => false,
                'status' => 'error',
                'message' => 'Gagal menghubungi server Fonnte: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Send raw message to Fonnte API endpoint.
     */
    public function sendRawMessage(string $endpoint, string $token, string $target, string $message): array
    {
        try {
            $url = !empty($endpoint) ? $endpoint : 'https://api.fonnte.com/send';

            $response = Http::withHeaders([
                'Authorization' => $token,
            ])->timeout(10)->post($url, [
                'target' => $target,
                'message' => $message,
                'countryCode' => '62',
            ]);

            $json = $response->json() ?? [];

            return [
                'success' => $response->successful() && ($json['status'] ?? false) !== false,
                'response' => $json,
            ];
        } catch (\Throwable $e) {
            Log::error('Fonnte sendRawMessage error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send a test message initiated by the Project Owner.
     */
    public function sendTestMessage(Project $project, string $targetPhone, User $actor): array
    {
        $setting = $project->fonnteSetting;
        if (!$setting || empty($setting->api_token)) {
            return [
                'success' => false,
                'message' => 'API Token Fonnte belum diisi pada proyek ini.',
            ];
        }

        $now = now()->setTimezone('Asia/Jakarta')->format('d M Y, H:i') . ' WIB';
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
        $projectUrl = "{$frontendUrl}/projects/{$project->id}";

        $message = "✅ *Tes Koneksi NaTask — Fonnte Berhasil!*\n"
            . "━━━━━━━━━━━━━━━━━━━\n"
            . "📁 *Proyek:* {$project->name}\n"
            . "👤 *Diuji oleh:* {$actor->name}\n"
            . "🕒 *Waktu:* {$now}\n"
            . "━━━━━━━━━━━━━━━━━━━\n"
            . "Bot notifikasi WhatsApp untuk proyek ini telah siap dan aktif! 🎉\n"
            . "🔗 *Buka Proyek:* {$projectUrl}";

        return $this->sendRawMessage(
            $setting->api_endpoint ?? 'https://api.fonnte.com/send',
            $setting->api_token,
            $targetPhone,
            $message
        );
    }

    /**
     * Dispatch notification when a task is created.
     */
    public function notifyTaskCreated(Project $project, Task $task, User $actor): void
    {
        try {
            $setting = $project->fonnteSetting;
            if (!$this->shouldSend($setting, 'notify_task_created')) {
                return;
            }

            // Always fresh load assignees with phone numbers
            $assignees = $task->assignees()->select('users.id', 'users.name', 'users.email', 'users.phone')->get();
            $assigneeNames = $assignees->isNotEmpty()
                ? $assignees->pluck('name')->join(', ')
                : 'Belum ditugaskan';

            $dueDate = $task->due_date
                ? \Carbon\Carbon::parse($task->due_date)->format('d M Y')
                : '-';

            $priorityEmoji = match ($task->priority) {
                'urgent' => '🔴 Urgent',
                'high' => '🟠 High',
                'low' => '🟢 Low',
                default => '🟡 Medium',
            };

            $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
            $projectUrl = "{$frontendUrl}/projects/{$project->id}";

            $message = "📌 *NaTask — Task Baru Dibuat*\n"
                . "━━━━━━━━━━━━━━━━━━━\n"
                . "📁 *Proyek:* {$project->name}\n"
                . "📝 *Task:* {$task->title}\n"
                . "👤 *Dibuat oleh:* {$actor->name}\n"
                . "👥 *Ditugaskan ke:* {$assigneeNames}\n"
                . "⚡ *Prioritas:* {$priorityEmoji}\n"
                . "📅 *Deadline:* {$dueDate}\n"
                . "━━━━━━━━━━━━━━━━━━━\n"
                . "🔗 *Buka Proyek:* {$projectUrl}";

            $this->deliverNotification($setting, $message, $assignees, $actor, $project);
        } catch (\Throwable $e) {
            Log::warning('Fonnte notifyTaskCreated failed: ' . $e->getMessage());
        }
    }

    /**
     * Dispatch notification when a member is assigned to a task.
     */
    public function notifyTaskAssigned(Project $project, Task $task, $assignedUsers, User $actor): void
    {
        try {
            $setting = $project->fonnteSetting;
            if (!$this->shouldSend($setting, 'notify_task_created')) {
                return;
            }

            $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
            $projectUrl = "{$frontendUrl}/projects/{$project->id}";

            $dueDate = $task->due_date
                ? \Carbon\Carbon::parse($task->due_date)->format('d M Y')
                : '-';

            $priorityEmoji = match ($task->priority) {
                'urgent' => '🔴 Urgent',
                'high' => '🟠 High',
                'low' => '🟢 Low',
                default => '🟡 Medium',
            };

            $message = "📋 *NaTask — Anda Ditugaskan pada Task*\n"
                . "━━━━━━━━━━━━━━━━━━━\n"
                . "📁 *Proyek:* {$project->name}\n"
                . "📝 *Task:* {$task->title}\n"
                . "👤 *Ditugaskan oleh:* {$actor->name}\n"
                . "⚡ *Prioritas:* {$priorityEmoji}\n"
                . "📅 *Deadline:* {$dueDate}\n"
                . "━━━━━━━━━━━━━━━━━━━\n"
                . "🔗 *Buka Task:* {$projectUrl}";

            $this->deliverNotification($setting, $message, $assignedUsers, $actor, $project);
        } catch (\Throwable $e) {
            Log::warning('Fonnte notifyTaskAssigned failed: ' . $e->getMessage());
        }
    }

    /**
     * Dispatch notification when a task status is changed.
     */
    public function notifyTaskStatusChanged(Project $project, Task $task, TaskStatus $oldStatus, TaskStatus $newStatus, User $actor): void
    {
        try {
            $setting = $project->fonnteSetting;
            if (!$this->shouldSend($setting, 'notify_task_status_changed')) {
                return;
            }

            // Always fresh load assignees with phone numbers
            $assignees = $task->assignees()->select('users.id', 'users.name', 'users.email', 'users.phone')->get();
            $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
            $projectUrl = "{$frontendUrl}/projects/{$project->id}";

            $isDone = strtolower($newStatus->name) === 'done';
            $statusHeader = $isDone ? "✅ *Task Selesai (Done)*" : "🔄 *Status Task Berubah*";

            $message = "{$statusHeader}\n"
                . "━━━━━━━━━━━━━━━━━━━\n"
                . "📁 *Proyek:* {$project->name}\n"
                . "📝 *Task:* {$task->title}\n"
                . "🏷️ *Perubahan:* {$oldStatus->name} ➔ *{$newStatus->name}*\n"
                . "👤 *Diubah oleh:* {$actor->name}\n"
                . "━━━━━━━━━━━━━━━━━━━\n"
                . "🔗 *Buka Proyek:* {$projectUrl}";

            $this->deliverNotification($setting, $message, $assignees, $actor, $project);
        } catch (\Throwable $e) {
            Log::warning('Fonnte notifyTaskStatusChanged failed: ' . $e->getMessage());
        }
    }

    /**
     * Dispatch notification when a new comment is added to a task.
     */
    public function notifyTaskCommented(Project $project, Task $task, Comment $comment, User $actor): void
    {
        try {
            $setting = $project->fonnteSetting;
            if (!$this->shouldSend($setting, 'notify_task_commented')) {
                return;
            }

            // Always fresh load assignees with phone numbers
            $assignees = $task->assignees()->select('users.id', 'users.name', 'users.email', 'users.phone')->get();
            $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
            $projectUrl = "{$frontendUrl}/projects/{$project->id}";

            $commentSnippet = \Illuminate\Support\Str::limit(strip_tags($comment->body), 120);

            $message = "💬 *NaTask — Komentar Baru di Task*\n"
                . "━━━━━━━━━━━━━━━━━━━\n"
                . "📁 *Proyek:* {$project->name}\n"
                . "📝 *Task:* {$task->title}\n"
                . "👤 *Dari:* {$actor->name}\n"
                . "💬 *Pesan:* \"{$commentSnippet}\"\n"
                . "━━━━━━━━━━━━━━━━━━━\n"
                . "🔗 *Buka Task:* {$projectUrl}";

            $this->deliverNotification($setting, $message, $assignees, $actor, $project);
        } catch (\Throwable $e) {
            Log::warning('Fonnte notifyTaskCommented failed: ' . $e->getMessage());
        }
    }

    /**
     * Dispatch notification when a new member joins the project.
     */
    public function notifyMemberJoined(Project $project, User $newMember, string $role): void
    {
        try {
            $setting = $project->fonnteSetting;
            if (!$this->shouldSend($setting, 'notify_member_joined')) {
                return;
            }

            $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
            $projectUrl = "{$frontendUrl}/projects/{$project->id}";

            $message = "👥 *NaTask — Anggota Baru Bergabung*\n"
                . "━━━━━━━━━━━━━━━━━━━\n"
                . "📁 *Proyek:* {$project->name}\n"
                . "👤 *Anggota:* {$newMember->name} ({$newMember->email})\n"
                . "🔰 *Role:* " . ucfirst($role) . "\n"
                . "━━━━━━━━━━━━━━━━━━━\n"
                . "Selamat datang di tim! 🎉\n"
                . "🔗 *Buka Proyek:* {$projectUrl}";

            $targets = [];
            if ($setting->target_type === 'group' || $setting->target_type === 'both') {
                if (!empty($setting->group_target)) {
                    $targets[] = trim($setting->group_target);
                }
            }

            // Also notify owner and the new member if personal
            if ($setting->target_type === 'personal' || $setting->target_type === 'both') {
                $owner = $project->owner()->select('id', 'name', 'phone')->first() ?? $project->owner;
                if ($owner && !empty($owner->phone)) {
                    $targets[] = $this->cleanPhoneNumber($owner->phone);
                }
                if (!empty($newMember->phone)) {
                    $targets[] = $this->cleanPhoneNumber($newMember->phone);
                }
            }

            foreach (array_unique(array_filter($targets)) as $target) {
                $this->sendRawMessage(
                    $setting->api_endpoint ?? 'https://api.fonnte.com/send',
                    $setting->api_token,
                    $target,
                    $message
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Fonnte notifyMemberJoined failed: ' . $e->getMessage());
        }
    }

    /**
     * Helper to clean / sanitize phone numbers.
     */
    private function cleanPhoneNumber(string $phone): string
    {
        $cleaned = preg_replace('/[^0-9+]/', '', trim($phone));
        return $cleaned;
    }

    /**
     * Helper to verify if notification should be sent.
     */
    private function shouldSend(?ProjectFonnteSetting $setting, string $triggerColumn): bool
    {
        if (!$setting) {
            return false;
        }

        if (!$setting->is_enabled || empty($setting->api_token)) {
            return false;
        }

        return (bool) ($setting->{$triggerColumn} ?? false);
    }

    /**
     * Deliver notification to group and/or individual assignees based on target_type.
     */
    private function deliverNotification(
        ProjectFonnteSetting $setting,
        string $message,
        $assignees = null,
        ?User $excludeUser = null,
        ?Project $project = null
    ): void {
        $targets = [];

        // 1. Group Target
        if ($setting->target_type === 'group' || $setting->target_type === 'both') {
            if (!empty($setting->group_target)) {
                $targets[] = trim($setting->group_target);
            }
        }

        // 2. Personal Targets (Assignees with valid phone numbers)
        if ($setting->target_type === 'personal' || $setting->target_type === 'both') {
            $hasPersonalTargets = false;

            if ($assignees && is_iterable($assignees)) {
                foreach ($assignees as $assignee) {
                    if ($excludeUser && (int) $assignee->id === (int) $excludeUser->id) {
                        continue;
                    }
                    if (!empty($assignee->phone)) {
                        $targets[] = $this->cleanPhoneNumber($assignee->phone);
                        $hasPersonalTargets = true;
                    }
                }
            }

            // Fallback for personal notifications: If task has NO assignees, or if action was performed by someone else, notify the Project Owner!
            if (!$hasPersonalTargets && $project) {
                $owner = $project->owner()->select('id', 'name', 'phone')->first() ?? $project->owner;
                if ($owner && !empty($owner->phone)) {
                    if (!$excludeUser || (int) $owner->id !== (int) $excludeUser->id) {
                        $targets[] = $this->cleanPhoneNumber($owner->phone);
                    }
                }
            }
        }

        $targets = array_unique(array_filter($targets));

        foreach ($targets as $target) {
            $this->sendRawMessage(
                $setting->api_endpoint ?? 'https://api.fonnte.com/send',
                $setting->api_token,
                $target,
                $message
            );
        }
    }
}
