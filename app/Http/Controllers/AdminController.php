<?php

namespace App\Http\Controllers;

use App\Services\DatabaseFirstAdminManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class AdminController extends Controller
{
    public function __construct(private readonly DatabaseFirstAdminManagementService $admins)
    {
        $this->middleware('auth:admin');
    }

    public function store(Request $request): JsonResponse
    {
        $actingAdmin = $request->user();

        if (! $actingAdmin || ($actingAdmin->role ?? null) !== 'admin') {
            return response()->json([
                'message' => 'Only admins can create admin accounts.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:6'],
            'confirm_password' => ['required', 'string', 'min:6'],
            'phone' => ['nullable', 'string', 'max:30'],
            'admin_role' => ['required', 'string', 'in:super,manager,hr'],
        ]);

        try {
            $admin = $this->admins->createAdmin(
                (int) $actingAdmin->id,
                (string) $validated['name'],
                (string) $validated['email'],
                (string) $validated['password'],
                (string) $validated['confirm_password'],
                $validated['phone'] ?? null,
                (string) $validated['admin_role'],
            );
        } catch (RuntimeException $e) {
            $status = str_contains($e->getMessage(), 'Only super admins') ? 403 : 422;

            return response()->json([
                'message' => $e->getMessage(),
            ], $status);
        }

        return response()->json([
            'message' => 'Admin created successfully.',
            'admin' => $admin,
        ], 201);
    }
}
