<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api')->except(['register', 'login']);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:patients,email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $patient = Patient::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'patient',
        ]);

        $token = JWTAuth::fromUser($patient);

        return response()->json([
            'message' => 'Patient registered successfully.',
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
            'user' => $patient,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $email = strtolower(trim($validated['email']));
        $credentials = [
            'email' => $email,
            'password' => $validated['password'],
        ];

        // If the email exists in admins, authenticate against the admin guard.
        if (Admin::where('email', $email)->exists()) {
            $token = auth('admin')->attempt($credentials);

            if (! $token) {
                return response()->json([
                    'message' => 'Invalid email or password.',
                ], 401);
            }

            /** @var \App\Models\Admin $admin */
            $admin = auth('admin')->user();

            return response()->json([
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
                'user' => $admin,
            ], 200);
        }

        // Default: patient login
        if (! $token = auth('api')->attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid email or password.',
            ], 401);
        }

        /** @var \App\Models\Patient $patient */
        $patient = auth('api')->user();

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
            'user' => $patient,
        ], 200);
    }

    public function profile(): JsonResponse
    {
        return response()->json([
            'user' => JWTAuth::parseToken()->authenticate(),
        ]);
    }

    public function dashboard(): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        return response()->json([
            'message' => 'Dashboard data fetched successfully.',
            'user' => $user,
        ]);
    }

    public function logout(): JsonResponse
    {
        JWTAuth::parseToken()->invalidate();

        return response()->json([
            'message' => 'Successfully logged out.',
        ]);
    }

    public function refresh(): JsonResponse
    {
        $newToken = JWTAuth::parseToken()->refresh();

        return response()->json([
            'access_token' => $newToken,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
            'user' => JWTAuth::setToken($newToken)->user(),
        ]);
    }
}
