<?php

namespace App\Http\Controllers;

use App\Services\DatabaseFirstAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function __construct(private readonly DatabaseFirstAuthService $databaseAuth)
    {
        $this->middleware('auth:api')->except(['register', 'login']);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $email = strtolower(trim($validated['email']));

        if ($this->databaseAuth->emailExists($email)) {
            return response()->json([
                'message' => 'The email has already been taken.',
                'errors' => [
                    'email' => ['The email has already been taken.'],
                ],
            ], 422);
        }

        $patient = $this->databaseAuth->registerPatient(
            $validated['name'],
            $email,
            $validated['password'],
        );

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

        $authResult = $this->databaseAuth->login(
            $validated['email'],
            $validated['password'],
        );

        if (! $authResult) {
            return response()->json([
                'message' => 'Invalid email or password.',
            ], 401);
        }

        return response()->json([
            'access_token' => $authResult['token'],
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
            'user' => $authResult['user'],
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
