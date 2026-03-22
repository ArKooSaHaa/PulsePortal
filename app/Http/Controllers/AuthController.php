<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
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

        return response()->json([
            'message' => 'Patient registered successfully.',
            'data' => $patient,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $patient = Patient::where('email', $validated['email'])->first();

        if (! $patient || ! Hash::check($validated['password'], $patient->password)) {
            return response()->json([
                'message' => 'Invalid email or password.',
            ], 401);
        }

        return response()->json([
            'message' => 'Login successful.',
            'data' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
                'role' => $patient->role,
            ],
        ], 200);
    }
}
