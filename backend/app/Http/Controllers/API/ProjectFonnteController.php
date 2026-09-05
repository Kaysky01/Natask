<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectFonnteSetting;
use App\Services\FonnteNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProjectFonnteController extends Controller
{
    protected FonnteNotificationService $fonnteService;

    public function __construct(FonnteNotificationService $fonnteService)
    {
        $this->fonnteService = $fonnteService;
    }

    /**
     * Authorize that the user is the project owner.
     */
    private function authorizeOwner(Request $request, Project $project): void
    {
        if ((int) $project->owner_id !== (int) $request->user()->id) {
            abort(403, 'Hanya Owner Proyek yang memiliki izin untuk mengelola integrasi WhatsApp Fonnte.');
        }
    }

    /**
     * Get the Fonnte settings for a project.
     */
    public function getSettings(Request $request, Project $project): JsonResponse
    {
        $this->authorizeOwner($request, $project);

        $setting = $project->fonnteSetting;

        if (!$setting) {
            return response()->json([
                'success' => true,
                'data' => [
                    'is_enabled' => false,
                    'api_token' => '',
                    'is_token_set' => false,
                    'api_endpoint' => 'https://api.fonnte.com/send',
                    'target_type' => 'group',
                    'group_target' => '',
                    'notify_task_created' => true,
                    'notify_task_status_changed' => true,
                    'notify_task_commented' => true,
                    'notify_member_joined' => true,
                    'sender_number' => null,
                    'device_status' => null,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $setting->id,
                'is_enabled' => (bool) $setting->is_enabled,
                'api_token' => $setting->api_token ? $setting->api_token : '',
                'is_token_set' => !empty($setting->api_token),
                'api_endpoint' => $setting->api_endpoint ?: 'https://api.fonnte.com/send',
                'target_type' => $setting->target_type ?: 'group',
                'group_target' => $setting->group_target ?: '',
                'notify_task_created' => (bool) $setting->notify_task_created,
                'notify_task_status_changed' => (bool) $setting->notify_task_status_changed,
                'notify_task_commented' => (bool) $setting->notify_task_commented,
                'notify_member_joined' => (bool) $setting->notify_member_joined,
                'sender_number' => $setting->sender_number,
                'device_status' => $setting->device_status,
                'updated_at' => $setting->updated_at,
            ],
        ]);
    }

    /**
     * Save or update Fonnte settings for a project.
     */
    public function updateSettings(Request $request, Project $project): JsonResponse
    {
        $this->authorizeOwner($request, $project);

        $validator = Validator::make($request->all(), [
            'is_enabled' => 'required|boolean',
            'api_token' => 'nullable|string',
            'api_endpoint' => 'nullable|url',
            'target_type' => 'required|in:group,personal,both',
            'group_target' => 'nullable|string|max:100',
            'notify_task_created' => 'boolean',
            'notify_task_status_changed' => 'boolean',
            'notify_task_commented' => 'boolean',
            'notify_member_joined' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $setting = $project->fonnteSetting ?? new ProjectFonnteSetting(['project_id' => $project->id]);

        // Keep previous token if empty input
        if (isset($validated['api_token']) && $validated['api_token'] !== '') {
            $setting->api_token = $validated['api_token'];
        }

        $setting->api_endpoint = $validated['api_endpoint'] ?? 'https://api.fonnte.com/send';
        $setting->is_enabled = (bool) $validated['is_enabled'];
        $setting->target_type = $validated['target_type'];
        $setting->group_target = $validated['group_target'] ?? null;
        $setting->notify_task_created = (bool) ($validated['notify_task_created'] ?? true);
        $setting->notify_task_status_changed = (bool) ($validated['notify_task_status_changed'] ?? true);
        $setting->notify_task_commented = (bool) ($validated['notify_task_commented'] ?? true);
        $setting->notify_member_joined = (bool) ($validated['notify_member_joined'] ?? true);

        // Auto-check device if token is available
        if (!empty($setting->api_token)) {
            $deviceInfo = $this->fonnteService->checkDevice($setting->api_token, $setting->api_endpoint);
            if ($deviceInfo['success']) {
                $setting->sender_number = $deviceInfo['sender_number'] ?? $setting->sender_number;
                $setting->device_status = $deviceInfo['status'] ?? 'connected';
            }
        }

        $setting->save();

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan WhatsApp Fonnte berhasil disimpan.',
            'data' => [
                'id' => $setting->id,
                'is_enabled' => (bool) $setting->is_enabled,
                'is_token_set' => !empty($setting->api_token),
                'api_endpoint' => $setting->api_endpoint,
                'target_type' => $setting->target_type,
                'group_target' => $setting->group_target,
                'notify_task_created' => (bool) $setting->notify_task_created,
                'notify_task_status_changed' => (bool) $setting->notify_task_status_changed,
                'notify_task_commented' => (bool) $setting->notify_task_commented,
                'notify_member_joined' => (bool) $setting->notify_member_joined,
                'sender_number' => $setting->sender_number,
                'device_status' => $setting->device_status,
            ],
        ]);
    }

    /**
     * Check Fonnte device connection status and sender number.
     */
    public function checkDevice(Request $request, Project $project): JsonResponse
    {
        $this->authorizeOwner($request, $project);

        $token = $request->input('api_token');
        if (empty($token)) {
            $setting = $project->fonnteSetting;
            $token = $setting?->api_token;
        }

        if (empty($token)) {
            return response()->json([
                'success' => false,
                'message' => 'Token Fonnte tidak boleh kosong untuk melakukan pengecekan.',
            ], 422);
        }

        $endpoint = $request->input('api_endpoint') ?? $project->fonnteSetting?->api_endpoint;
        $deviceInfo = $this->fonnteService->checkDevice($token, $endpoint);

        if ($project->fonnteSetting && $deviceInfo['success']) {
            $project->fonnteSetting->update([
                'sender_number' => $deviceInfo['sender_number'] ?? $project->fonnteSetting->sender_number,
                'device_status' => $deviceInfo['status'] ?? 'connected',
            ]);
        }

        return response()->json([
            'success' => $deviceInfo['success'],
            'message' => $deviceInfo['success'] ? 'Koneksi Fonnte aktif' : ($deviceInfo['message'] ?? 'Device tidak terhubung'),
            'data' => $deviceInfo,
        ]);
    }

    /**
     * Send a test WhatsApp message.
     */
    public function testSend(Request $request, Project $project): JsonResponse
    {
        $this->authorizeOwner($request, $project);

        $validator = Validator::make($request->all(), [
            'target' => 'required|string|min:8|max:30',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Nomor tujuan tes tidak valid',
                'errors' => $validator->errors(),
            ], 422);
        }

        $target = $request->input('target');
        $result = $this->fonnteService->sendTestMessage($project, $target, $request->user());

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => 'Pesan uji coba WhatsApp berhasil dikirim ke ' . $target,
                'data' => $result,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['message'] ?? 'Gagal mengirim pesan uji coba WhatsApp. Pastikan token Fonnte valid dan nomor tujuan terdaftar WhatsApp.',
            'data' => $result,
        ], 400);
    }
}
