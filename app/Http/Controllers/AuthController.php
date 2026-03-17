<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Services\AuthService;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
        $this->middleware('auth:api')->except(['login', 'register']);
    }

    // POST /api/auth/register
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => [
                'required',
                'string',
                'min:2',
                'max:255',
                // Only letters and spaces allowed — no numbers or special characters
                'regex:/^[\pL\s\-\.]+$/u',
            ],
            'email'    => [
                'required',
                'email:rfc,dns',
                'unique:users,email',
                // Only allow these specific domains
                'regex:/^[a-zA-Z0-9._%+\-]+@(gmail\.com|yahoo\.com|outlook\.com|aust\.edu|pulseportal\.com)$/',
            ],
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                // Must have at least one uppercase, one lowercase, one number
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/',
            ],
        ], [
            // ── Custom error messages ─────────────────────────────
            'name.regex'     => 'Name can only contain letters, spaces, hyphens, and dots.',
            'email.regex'    => 'Only gmail.com, yahoo.com, outlook.com, aust.edu, and pulseportal.com emails are allowed.',
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
            'password.min'   => 'Password must be at least 8 characters.',
            'email.unique'   => 'This email is already registered.',
        ]);

        $result = $this->authService->registerPatient($data);

        return response()->json([
            'status'  => 'success',
            'message' => 'Registration successful',
            'data'    => $result,
        ], 201);
    }

    // POST /api/auth/login
    public function login(Request $request)
    {
        try {
            $credentials = $request->validate([
                'email'    => 'required|email',
                'password' => 'required|string',
            ]);

            $result = $this->authService->login($credentials);

            if (!$result) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Invalid email or password',
                ], 401);
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'Login successful',
                'data'    => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    // POST /api/auth/logout
    public function logout()
    {
        auth()->logout();

        return response()->json([
            'status'  => 'success',
            'message' => 'Logged out successfully',
        ]);
    }

    // GET /api/auth/me
    public function me()
    {
        $user = auth()->user();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ]);
    }
}
