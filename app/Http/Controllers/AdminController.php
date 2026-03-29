<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:admins,email', 'unique:patients,email'],
            'password' => ['required', 'string', 'min:6'],
            'phone' => ['nullable', 'string', 'max:30'],
            'admin_role' => ['nullable', 'string', 'max:60'],
        ]);

        $admin = Admin::create([
            'name' => $validated['name'],
            'email' => strtolower(trim($validated['email'])),
            'password' => $validated['password'],
            'phone' => $validated['phone'] ?? null,
            'role' => 'admin',
            'admin_role' => $validated['admin_role'] ?? null,
        ]);

        return response()->json([
            'message' => 'Admin created successfully.',
            'admin' => $admin,
        ], 201);
    }
}
