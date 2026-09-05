<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    /**
     * Register a new user.
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|min:9|max:20|regex:/^[0-9+\s\-]+$/',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'phone.required' => 'Nomor WhatsApp aktif wajib diisi.',
            'phone.min' => 'Nomor WhatsApp minimal 9 digit.',
            'phone.regex' => 'Format nomor WhatsApp tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first('phone') ?: 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $phone = preg_replace('/[^0-9+]/', '', $request->phone);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $phone,
            'password' => Hash::make($request->password),
            'timezone' => $request->timezone ?? 'UTC',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * Login user.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        $user = Auth::user();
        $user->updateLastActive();
        
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    /**
     * Logout user.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get current user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['ownedProjects', 'projects']);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Update user profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:30',
            'bio' => 'nullable|string|max:1000',
            'timezone' => 'sometimes|required|string|max:50',
            'preferences' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user->update($request->only([
            'name', 'email', 'phone', 'bio', 'timezone', 'preferences'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $user,
        ]);
    }

    /**
     * Upload a profile avatar.
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'avatar' => 'required|file|image|mimes:jpg,jpeg,png,webp,gif,bmp,heic,heif|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first('avatar') ?: 'File avatar tidak valid atau melebihi batas ukuran (maksimal 10 MB).',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        if ($user->avatar) {
            $parsedPath = parse_url($user->avatar, PHP_URL_PATH);
            if ($parsedPath && str_contains($parsedPath, '/storage/avatars/')) {
                $relativeStoragePath = substr($parsedPath, strpos($parsedPath, '/storage/') + 9);
                Storage::disk('public')->delete($relativeStoragePath);
            }
        }

        $path = $request->file('avatar')->store('avatars/' . $user->id, 'public');
        $user->update(['avatar' => Storage::disk('public')->url($path)]);

        return response()->json([
            'success' => true,
            'message' => 'Avatar updated successfully',
            'data' => $user->fresh(),
        ]);
    }


    /**
     * Redirect to Google OAuth.
     */
    public function redirectToGoogle(): JsonResponse
    {
        $url = Socialite::driver('google')
            ->stateless()
            ->redirect()
            ->getTargetUrl();

        return response()->json([
            'success' => true,
            'data' => [
                'url' => $url,
            ],
        ]);
    }

    /**
     * Handle Google OAuth callback.
     */
    public function handleGoogleCallback(): Response
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            $email = $googleUser->getEmail();
            $googleId = $googleUser->getId();
            $name = $googleUser->getName() ?: ($googleUser->getNickname() ?: 'Google User');
            $avatar = $googleUser->getAvatar();

            $user = User::where('email', $email)->first();

            if ($user) {
                // Update Google ID if not set
                if (!$user->google_id && $googleId) {
                    $user->google_id = $googleId;
                }

                // Update avatar if Google provides one; retain existing avatar if Google doesn't
                if (!empty($avatar)) {
                    $user->avatar = $avatar;
                }

                $user->save();
            } else {
                // Create new user with Google profile information
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'google_id' => $googleId,
                    'avatar' => $avatar,
                    'email_verified_at' => now(),
                ]);
            }

            $user->updateLastActive();
            $token = $user->createToken('auth_token')->plainTextToken;

            // Redirect to frontend with token
            $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
            
            return redirect()->away($frontendUrl . '/auth/callback?token=' . urlencode($token));

        } catch (\Throwable $e) {
            $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
            return redirect()->away($frontendUrl . '/auth/callback?error=' . urlencode('oauth_failed'));
        }
    }
}